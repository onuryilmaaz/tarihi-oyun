// TASK-0019 (1/4, DEC-0068): birim çeşitliliği — veri modeli ve asker toplama
import { describe, expect, it } from "vitest";
import {
  agHazirla, baslangicDurumu, degismezler, DENGE, devletMaasi, emirleriUygula, emirVer,
  kaydet, SEMA_SURUMU, toplamaMaliyeti, turSuresiAyarla, turuIlerlet, yukle, type SenaryoVerisi,
} from "../src";

const senaryo: SenaryoVerisi = {
  id: "birim-test", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
  devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }],
  birimler: ["a", "a", "b", null].map((devlet) => ({ devlet })),
  sehirler: [{ ad: "A1", devlet: "a", birim: 0, dugum: 0, x: 0, y: 0, baskent: true, nufus: 40000 },
    { ad: "A2", devlet: "a", birim: 1, dugum: 1, x: 10000, y: 0, baskent: false, nufus: 10000 },
    { ad: "B1", devlet: "b", birim: 2, dugum: 2, x: 20000, y: 0, baskent: true, nufus: 10000 }],
  ordular: [{ ad: "Birinci", devlet: "a", asker: 1000, dugum: 0, x: 0, y: 0 }],
  ag: { dugumler: [0, 1, 2, 3].map((b) => ({ b, x: b * 10000, y: 0, z: 100, kx: 10000, ky: 10000 })),
    kenarlar: [0, 1, 2].map((a) => ({ a, b: a + 1, mx: a * 10000 + 5000, my: 0, da: 5000, db: 5000, n: 0, g: 0 })) },
};
const B = { ag: agHazirla(senaryo.ag!), sehirKonumlari: senaryo.sehirler.map((s) => ({ x: s.x!, y: s.y! })) };
const yeni = () => {
  const d = baslangicDurumu(senaryo, { tohum: 1453 });
  d.ordular = d.ordular.filter((o) => o.devlet === 0);
  return d;
};

describe("TASK-0019 (1/4): birim çeşitliliği — veri modeli ve asker toplama", () => {
  it("senaryo/garnizon orduları tamamen piyade olarak başlar", () => {
    const d = yeni();
    expect(d.ordular[0].kompozisyon).toEqual({ piyade: 1000, okcu: 0, suvari: 0 });
    expect(degismezler(d)).toEqual([]);
  });

  it("süvari piyadeden daha pahalı ve daha yüksek maaşlıdır; birim seçilmezse piyade varsayılır", () => {
    const piyadeBedel = toplamaMaliyeti(1000, 100, "piyade");
    const suvariBedel = toplamaMaliyeti(1000, 100, "suvari");
    const okcuBedel = toplamaMaliyeti(1000, 100, "okcu");
    expect(toplamaMaliyeti(1000, 100)).toBe(piyadeBedel); // varsayılan birim
    expect(suvariBedel).toBeGreaterThan(piyadeBedel);
    expect(okcuBedel).toBeLessThan(piyadeBedel);
  });

  it("süvari toplama emri kompozisyonu doğru kurar; maaş piyadeden yüksektir", () => {
    const d = yeni(), oncekiMaas = devletMaasi(d, 0);
    expect(emirVer(d, { tur: "askerTopla", sehir: 0, asker: 1000, birim: "suvari" }, B).gecerli).toBe(true);
    emirleriUygula(d, B);
    turSuresiAyarla(d, "hafta");
    for (let i = 0; i < 5; i++) turuIlerlet(d, B);
    const yeniOrdu = d.ordular.find((o) => o.id !== 1);
    expect(yeniOrdu?.kompozisyon).toEqual({ piyade: 0, okcu: 0, suvari: 1000 });
    expect(devletMaasi(d, 0)).toBeGreaterThan(oncekiMaas);
    expect(degismezler(d)).toEqual([]);
  });

  it("ordu bölme türleri oransal ayırır; birleştirme toplar; toplam her zaman asker'e eşit kalır", () => {
    const d = yeni(), o = d.ordular[0];
    o.asker = 1000; o.kompozisyon = { piyade: 600, okcu: 300, suvari: 100 };
    expect(emirVer(d, { tur: "orduBol", ordu: o.id, asker: 250 }, B).gecerli).toBe(true);
    emirleriUygula(d, B);
    const a = d.ordular.find((x) => x.id !== o.id)!;
    expect(a.asker).toBe(250);
    expect(a.kompozisyon.piyade + a.kompozisyon.okcu + a.kompozisyon.suvari).toBe(250);
    expect(o.kompozisyon.piyade + o.kompozisyon.okcu + o.kompozisyon.suvari).toBe(750);
    // Oranlar korunur: %60/%30/%10 civarı (yuvarlama ile tam oran)
    expect(a.kompozisyon.piyade).toBe(150); expect(a.kompozisyon.okcu).toBe(75); expect(a.kompozisyon.suvari).toBe(25);
    expect(emirVer(d, { tur: "orduBirlestir", ordu: o.id, diger: a.id }, B).gecerli).toBe(true);
    emirleriUygula(d, B);
    expect(o.asker).toBe(1000);
    expect(o.kompozisyon).toEqual({ piyade: 600, okcu: 300, suvari: 100 });
    expect(degismezler(d)).toEqual([]);
  });

  it("ikmalsizlik ve muharebe kayıpları kompozisyonu asker sayısıyla tutarlı tutar", () => {
    const d = yeni(), o = d.ordular[0];
    o.asker = 1000; o.kompozisyon = { piyade: 500, okcu: 300, suvari: 200 };
    d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: 0, savunan: 1, baslangic: d.gun });
    o.dugum = 2; // düşman toprağı (B'nin başkenti)
    for (let i = 0; i < 10; i++) { turuIlerlet(d, B); if (o.asker === 0) break; }
    expect(o.kompozisyon.piyade + o.kompozisyon.okcu + o.kompozisyon.suvari).toBe(o.asker);
    expect(degismezler(d)).toEqual([]);
  });

  it("şema 22 → 23: eski kayıttaki ordu ve toplamalar tamamen piyade sayılır", () => {
    const d = yeni();
    const p = JSON.parse(kaydet(d));
    delete p.ozet;
    for (const o of p.durum.ordular) delete o.kompozisyon;
    p.sema = 22; p.durum.sema = 22;
    const g = yukle(JSON.stringify(p), d.senaryo);
    expect(g.sema).toBe(SEMA_SURUMU);
    expect(g.ordular[0].kompozisyon).toEqual({ piyade: g.ordular[0].asker, okcu: 0, suvari: 0 });
    expect(degismezler(g)).toEqual([]);
  });
});
