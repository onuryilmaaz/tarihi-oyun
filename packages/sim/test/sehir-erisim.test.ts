// TASK-0044: kullanıcının gösterdiği gerçek şehirlerde yürüyüş, çıkarma ve kuşatma bağlantısı.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { agHazirla, baslangicDurumu, degismezler, donanmaHareketi, emirVer, emirleriUygula, orduIlerlet, rotaBul, sehirMenzilinde, varincaKusat, type SenaryoVerisi } from "../src";
const S: SenaryoVerisi = JSON.parse(readFileSync(new URL("../../../veri/senaryo-1453/senaryo.json", import.meta.url), "utf8"));
const B = { ag: agHazirla(S.ag!), sehirKonumlari: S.sehirler.map((c) => ({ x: c.x!, y: c.y! })) };
const sehir = (ad: string) => S.sehirler.findIndex((c) => c.ad === ad);
const hedef = (i: number) => ({ x: S.sehirler[i].x!, y: S.sehirler[i].y!, dugum: S.sehirler[i].dugum! });

describe("gerçek şehir erişimi", () => {
  it.each([["Padova", "Venedik"], ["Foggia", "Napoli"], ["Saumur", "Nantes"], ["Nantes", "Brest"], ["Trieste", "Pola"]])("%s → %s: gerçek şehir düğümüne varıp kuşatır", (kaynak, ad) => {
    const d = baslangicDurumu(S, { tohum: 1453 }), o = d.ordular.find((o) => o.devlet === d.ayarlar.oyuncu)!;
    const i = sehir(ad); expect(i).toBeGreaterThanOrEqual(0);
    // Kara koridorunu test etmek için bütün yabancı devletlerle savaş; barışta geçiş izni verilmez.
    for (let v = 0; v < d.devletler.length; v++) if (v !== o.devlet) d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: o.devlet, savunan: v, baslangic: d.gun });
    d.donanmalar = []; d.ordular = [o]; Object.assign(o, hedef(sehir(kaynak)));
    const r = rotaBul(d, B.ag, o, hedef(i)); expect(r.gecerli).toBe(true);
    if (!r.gecerli) throw new Error(r.neden);
    if (ad === "Venedik") expect(r.kirilim.bogaz).toBe(1);
    o.rota = r.adimlar;
    for (let gun = 0; gun < 100 && o.rota.length; gun++) orduIlerlet(o);
    expect(o.rota).toHaveLength(0);
    expect(sehirMenzilinde(d, B, o, i)).toBe(true);
    varincaKusat(d, B, o);
    expect(d.kusatmalar.some((k) => k.sehir === i && k.ordular.includes(o.id))).toBe(true);
  });
  it.each(["Venedik", "Napoli", "Nantes", "Brest", "Pola"])("Selanik → %s: çıkarma emri, şehir düğümüne iniş ve otomatik kuşatma", (ad) => {
    const d = baslangicDurumu(S, { tohum: 1453 }), o = d.ordular.find((o) => o.devlet === d.ayarlar.oyuncu)!, f = d.donanmalar.find((f) => f.devlet === o.devlet)!;
    const i = sehir(ad), kaynak = sehir("Selanik"), karsi = d.sehirler[i].devlet;
    Object.assign(o, hedef(kaynak)); d.ordular = [o]; d.donanmalar = [f];
    f.bolge = d.deniz.limanlar[kaynak]; f.kalyon = 40;
    const e = { tur: "cikarma" as const, donanma: f.id, ordu: o.id, sehir: i };
    expect(emirVer(d, e, B).gecerli).toBe(false); // barışta yabancı kıyıya çıkılmaz
    d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: o.devlet, savunan: karsi, baslangic: d.gun });
    expect(emirVer(d, e, B).gecerli).toBe(true); emirleriUygula(d, B);
    expect(f.yuk?.id).toBe(o.id);
    for (let gun = 0; gun < 200 && f.yuk; gun++) donanmaHareketi(d, B);
    expect(f.yuk).toBeNull(); expect(o).toMatchObject(hedef(i));
    expect(sehirMenzilinde(d, B, o, i)).toBe(true);
    expect(d.kusatmalar.some((k) => k.sehir === i)).toBe(true);
    expect(degismezler(d)).toEqual([]);
  });
});
