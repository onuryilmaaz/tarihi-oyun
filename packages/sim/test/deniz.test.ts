// TASK-0011/8a: donanma, deniz kontrolü, abluka, çıkarma, boğaz (DEC-0051)
import { describe, expect, it } from "vitest";
import {
  agHazirla, baslangicDurumu, bolgeKontrolu, degismezler, DENGE, denizAblukasi, devletMaasi, donanmaGucu, durumOzeti,
  emirleriUygula, emirVer, gemiSayisi, gunIlerlet, kaydet, kullanilabilirHazine, rotaBul, SEMA_SURUMU, yukle,
  type DunyaDurumu, type SenaryoVerisi,
} from "../src";

// Doğrusal kara: düğüm 0–1 (a), 2–3 (b); 1–2 arası "Test Boğazı". Deniz: z0 (A1 limanı), z1 (B1 limanı)
const S: SenaryoVerisi = {
  id: "deniz-test", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
  devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }],
  birimler: ["a", "a", "b", "b"].map((devlet) => ({ devlet })),
  sehirler: [
    { ad: "A1", devlet: "a", birim: 0, dugum: 0, x: 0, y: 0, baskent: true, nufus: 40000 },
    { ad: "B1", devlet: "b", birim: 3, dugum: 3, x: 30000, y: 0, baskent: true, nufus: 40000 },
  ],
  ordular: [{ ad: "A Ordusu", devlet: "a", asker: 5000, dugum: 0, x: 0, y: 0 }],
  ag: { dugumler: [0, 1, 2, 3].map((b) => ({ b, x: b * 10000, y: 0, kx: 10000, ky: 10000, z: 100 })),
    kenarlar: [0, 1, 2].map((a) => ({ a, b: a + 1, mx: a * 10000 + 5000, my: 0, da: 5000, db: 5000, n: 0, g: a === 1 ? 1 : 0, ...(a === 1 ? { ad: "Test Boğazı" } : {}) })) },
  deniz: {
    bolgeler: [{ id: "z0", ad: "Batı", lon: 0, lat: 0, komsu: ["z1"] }, { id: "z1", ad: "Doğu", lon: 3, lat: 0, komsu: ["z0"] }],
    limanlar: { z0: ["A1"], z1: ["B1"] },
    bogazlar: [{ ad: "Test Boğazı", bolge: "z0" }],
    donanmalar: [{ devlet: "a", bolge: "z0", ad: "A Donanması", kadirga: 10, kalyon: 0 }, { devlet: "b", bolge: "z1", ad: "B Donanması", kadirga: 4, kalyon: 0 }],
  },
};
const B = { ag: agHazirla(S.ag!), sehirKonumlari: S.sehirler.map((s) => ({ x: s.x!, y: s.y! })) };
const A = 0, Bd = 1, Z0 = 0, Z1 = 1;
const yeni = () => { const d = baslangicDurumu(S, { tohum: 4 }); d.ordular = d.ordular.filter((o) => o.devlet === A); return d; };
const savas = (d: DunyaDurumu) => d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: A, savunan: Bd, baslangic: d.gun });
const gun = (d: DunyaDurumu, n: number) => { for (let i = 0; i < n; i++) { gunIlerlet(d, B); d.aktifKesinti = null; } };
const fa = (d: DunyaDurumu) => d.donanmalar.find((f) => f.devlet === A)!;

describe("donanma ve deniz (8a)", () => {
  it("başlangıç donanmaları, limanlar ve bölge kontrolü yüklenir; bakım zorunlu gidere eklenir", () => {
    const d = yeni();
    expect(d.deniz.limanlar).toEqual([Z0, Z1]);
    expect(fa(d)).toMatchObject({ bolge: Z0, kadirga: 10, moral: 1000 });
    expect(bolgeKontrolu(d, Z0)).toBe(A);
    expect(devletMaasi(d, A)).toBe(Math.ceil((5000 * DENGE.AYLIK_ASKER_MAASI_BINDE) / 1000) + 10 * DENGE.GEMI.kadirga.bakim);
    expect(degismezler(d)).toEqual([]);
  });

  it("limanda gemi inşası: bedel ayrılır, süre sonunda bölgedeki donanmaya katılır (kalyon dahil)", () => {
    const d = yeni();
    d.devletler[A].hazine = 1000;
    expect(emirVer(d, { tur: "gemiInsa", sehir: 1, gemi: "kalyon", adet: 1 }, B).gecerli).toBe(false); // yabancı liman
    expect(emirVer(d, { tur: "gemiInsa", sehir: 0, gemi: "kalyon", adet: 6 }, B).gecerli).toBe(false); // hazine
    expect(emirVer(d, { tur: "gemiInsa", sehir: 0, gemi: "kalyon", adet: 2 }, B).gecerli).toBe(true);
    expect(kullanilabilirHazine(d, A)).toBe(1000 - 2 * DENGE.GEMI.kalyon.bedel);
    emirleriUygula(d, B);
    gun(d, DENGE.GEMI.kalyon.sure);
    expect(fa(d)).toMatchObject({ kadirga: 10, kalyon: 2 });
  });

  it("bölgeler arası hareket en yavaş gemiye göre sürer", () => {
    const d = yeni();
    emirVer(d, { tur: "donanmaHedef", donanma: fa(d).id, bolge: Z1 }, B);
    emirleriUygula(d, B);
    gun(d, DENGE.GEMI.kadirga.hizGun - 1);
    expect(fa(d).bolge).toBe(Z0);
    gun(d, 1);
    expect(fa(d).bolge).toBe(Z1);
    expect(bolgeKontrolu(d, Z1)).toBeNull(); // iki devletin donanması: kontrol yok
  });

  it("savaştaki donanmalar aynı bölgede çarpışır; zayıf taraf çekilir ya da batar; tur durur", () => {
    const d = yeni();
    savas(d);
    fa(d).bolge = Z1;
    const ga = donanmaGucu(fa(d));
    gunIlerlet(d, B);
    expect(d.aktifKesinti?.neden).toMatch(/deniz muharebesi/);
    gun(d, 10);
    const b = d.donanmalar.find((f) => f.devlet === Bd);
    expect(!b || b.bolge !== Z1 || gemiSayisi(b) < 4).toBe(true);
    expect(donanmaGucu(fa(d))).toBeLessThanOrEqual(ga);
    expect(degismezler(d)).toEqual([]);
  });

  it("düşman kontrolündeki boğaz ordulara kapanır; liman kuşatmasında deniz ablukası hesaplanır", () => {
    const d = yeni();
    savas(d);
    const o = d.ordular[0];
    expect(rotaBul(d, B.ag, o, { x: 30000, y: 0, dugum: 3 }).gecerli).toBe(true); // z0 bizim: boğaz açık
    fa(d).bolge = Z1;
    d.donanmalar.find((f) => f.devlet === Bd)!.bolge = Z0; // z0 artık B'nin
    expect(rotaBul(d, B.ag, o, { x: 30000, y: 0, dugum: 3 }).gecerli).toBe(false);
    expect(denizAblukasi(d, 0, Bd)).toBe(true); // A1 limanı B'nin kontrolündeki denizde
    expect(denizAblukasi(d, 1, Bd)).toBe(false);
  });

  it("çıkarma: limandaki ordu gemiye biner, hedef limana iner; yoldayken maaşı sürer", () => {
    const d = yeni();
    savas(d);
    const o = d.ordular[0], f = fa(d);
    d.donanmalar = d.donanmalar.filter((x) => x.devlet === A); // yol açık
    expect(emirVer(d, { tur: "cikarma", donanma: f.id, ordu: o.id, sehir: 1 }, B).gecerli).toBe(false); // 10 kadırga = 2.000 asker
    f.kalyon = 6; // + 3.600 asker kapasitesi
    expect(emirVer(d, { tur: "cikarma", donanma: f.id, ordu: o.id, sehir: 1 }, B).gecerli).toBe(true);
    const maas = devletMaasi(d, A);
    emirleriUygula(d, B);
    expect(d.ordular).toHaveLength(0);
    expect(f.yuk?.id).toBe(o.id);
    expect(devletMaasi(d, A)).toBe(maas);
    expect(degismezler(d)).toEqual([]);
    gun(d, DENGE.GEMI.kalyon.hizGun + 1); // kalyon donanmayı yavaşlatır
    expect(d.ordular[0]).toMatchObject({ id: o.id, dugum: 3, x: 30000 });
    expect(f.yuk).toBeNull();
    expect(d.gunluk.some((x) => /kıyısına çıktı/.test(x.metin))).toBe(true);
  });

  it("kayıt/yükleme sonucu değiştirmez; şema 14 kaydı dönüştürülür (deniz kapalı)", () => {
    const d = yeni();
    savas(d);
    emirVer(d, { tur: "donanmaHedef", donanma: fa(d).id, bolge: Z1 }, B);
    emirleriUygula(d, B);
    const e = yukle(kaydet(d), d.senaryo);
    for (let i = 0; i < 30; i++) { gunIlerlet(d, B); gunIlerlet(e, B); d.aktifKesinti = e.aktifKesinti = null; }
    expect(durumOzeti(e)).toBe(durumOzeti(d));
    const p = JSON.parse(kaydet(yeni()));
    p.sema = 14; p.durum.sema = 14;
    delete p.durum.deniz; delete p.durum.donanmalar; delete p.durum.sonrakiDonanmaId; delete p.durum.gemiInsalari;
    const g = yukle(JSON.stringify(p));
    expect(g.sema).toBe(SEMA_SURUMU);
    expect(g.donanmalar).toEqual([]);
    expect(degismezler(g)).toEqual([]);
  });
});
