// TASK-0047: komutan havuzu, ordu deneyimi ve topçu
import { describe, expect, it } from "vitest";
import {
  agHazirla, baslangicDurumu, degismezler, DENGE, durumOzeti, emirleriUygula, emirVer, gunIlerlet, kaydet, kusatmaGucu,
  orduDeneyimGucu, yukle, type SenaryoVerisi,
} from "../src";

// Doğrusal dünya: A1 (0) … A3 (2), B1 (3); düğümler 10 km arayla
const S: SenaryoVerisi = {
  id: "komutan-test", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
  devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }],
  birimler: Array.from({ length: 4 }, (_, i) => ({ devlet: i < 3 ? "a" : "b" })),
  sehirler: [0, 1, 2, 3].map((i) => ({ ad: i < 3 ? `A${i + 1}` : "B1", devlet: i < 3 ? "a" : "b", birim: i, dugum: i, x: i * 10000, y: 0,
    baskent: i === 0 || i === 3, nufus: 40000 })),
  ordular: [{ ad: "A Ordusu", devlet: "a", asker: 10000, dugum: 0, x: 0, y: 0 }, { ad: "B Ordusu", devlet: "b", asker: 10000, dugum: 3, x: 30000, y: 0 }],
  ag: { dugumler: Array.from({ length: 4 }, (_, b) => ({ b, x: b * 10000, y: 0, kx: 10000, ky: 10000, z: 100 })),
    kenarlar: Array.from({ length: 3 }, (_, a) => ({ a, b: a + 1, mx: a * 10000 + 5000, my: 0, da: 5000, db: 5000, n: 0, g: 0 })) },
};
const B = { ag: agHazirla(S.ag!), sehirKonumlari: S.sehirler.map((s) => ({ x: s.x!, y: s.y! })) };
const yeni = () => {
  const d = baslangicDurumu(S, { tohum: 3 });
  d.devletler[0].hazine = 100000;
  return d;
};
const uygula = (d: ReturnType<typeof yeni>) => emirleriUygula(d, B);

describe("komutanlar ve deneyim (TASK-0047)", () => {
  it("komutan yetiştirme bedelli ve sınırlı; atama/ayırma; bir komutan iki orduda olamaz", () => {
    const d = yeni();
    const [a] = d.ordular;
    expect(emirVer(d, { tur: "komutanYetistir", uzmanlik: "taarruz" }, B).gecerli).toBe(true);
    uygula(d);
    expect(d.komutanlar).toHaveLength(1);
    expect(d.devletler[0].hazine).toBe(100000 - DENGE.KOMUTAN_BEDEL);
    const k = d.komutanlar[0];
    expect(emirVer(d, { tur: "komutanAta", ordu: a.id, komutan: k.id }, B).gecerli).toBe(true);
    uygula(d);
    expect(a.komutan).toBe(k.id);
    // Bölünen birlik komutansız ayrılır, kıdemi taşır
    a.deneyim = 400;
    expect(emirVer(d, { tur: "orduBol", ordu: a.id, asker: 4000 }, B).gecerli).toBe(true);
    uygula(d);
    const ayri = d.ordular.find((o) => o.id !== a.id && o.devlet === 0)!;
    expect([ayri.komutan, ayri.deneyim]).toEqual([null, 400]);
    expect(emirVer(d, { tur: "komutanAta", ordu: ayri.id, komutan: k.id }, B)).toMatchObject({ gecerli: false, neden: expect.stringMatching(/başka bir orduda/) });
    expect(emirVer(d, { tur: "komutanAyir", ordu: a.id }, B).gecerli).toBe(true);
    uygula(d);
    expect(a.komutan).toBeNull();
    d.devletler[0].hazine = 0;
    expect(emirVer(d, { tur: "komutanYetistir", uzmanlik: "ikmal" }, B)).toMatchObject({ gecerli: false, neden: expect.stringMatching(/Hazine yetersiz/) });
    expect(degismezler(d)).toEqual([]);
  });

  it("deneyim ve komutan gücü artırır; birleşme kıdemi ağırlıklı ortalar; acemi askerler seyreltir", () => {
    const d = yeni();
    const [a] = d.ordular;
    expect(orduDeneyimGucu(d, a, "taarruz")).toBe(100);
    a.deneyim = DENGE.DENEYIM_EN_COK;
    expect(orduDeneyimGucu(d, a, "taarruz")).toBe(100 + DENGE.DENEYIM_GUC_EN_COK);
    emirVer(d, { tur: "komutanYetistir", uzmanlik: "savunma" }, B); uygula(d);
    emirVer(d, { tur: "komutanAta", ordu: a.id, komutan: d.komutanlar[0].id }, B); uygula(d);
    expect(orduDeneyimGucu(d, a, "savunma") - orduDeneyimGucu(d, a, "taarruz")).toBe(DENGE.KOMUTAN_UZMANLIK_GUC);
    // A1'de 10.000 acemi toplanır ve bekleyen orduya katılır: kıdem yarıya iner
    expect(emirVer(d, { tur: "askerTopla", sehir: 0, asker: 1000 }, B).gecerli).toBe(true);
    uygula(d);
    while (d.askerToplamalar.length) gunIlerlet(d, B);
    expect(a.asker).toBe(11000);
    expect(a.deneyim).toBe(Math.floor((DENGE.DENEYIM_EN_COK * 10000) / 11000));
  });

  it("muharebe günleri kıdem kazandırır; komutanlı taraf daha güçlüdür (deterministik)", () => {
    const savas = (komutanli: boolean) => {
      const d = yeni();
      d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: 0, savunan: 1, baslangic: d.gun });
      const [a, b] = d.ordular;
      if (komutanli) {
        emirVer(d, { tur: "komutanYetistir", uzmanlik: "taarruz" }, B); uygula(d);
        d.komutanlar[0].deneyim = DENGE.KOMUTAN_SEVIYE_DENEYIM * 2;
        emirVer(d, { tur: "komutanAta", ordu: a.id, komutan: d.komutanlar[0].id }, B); uygula(d);
      }
      b.dugum = a.dugum; b.x = a.x; b.y = a.y; // aynı düğümde temas
      for (let i = 0; i < 3; i++) gunIlerlet(d, B);
      return { d, a, b };
    };
    const duz = savas(false), guclu = savas(true);
    expect(guclu.b.asker).toBeLessThan(duz.b.asker);
    expect(duz.a.deneyim).toBeGreaterThan(0);
    expect(degismezler(guclu.d)).toEqual([]);
  });

  it("topçu Sahra Mühendisliği ister; kuşatmada surlara ek güç verir", () => {
    const d = yeni();
    d.devletler[0].kaynaklar.demir = 1000; d.devletler[0].kaynaklar.kereste = 1000;
    expect(emirVer(d, { tur: "askerTopla", sehir: 0, asker: 400, birim: "topcu" }, B)).toMatchObject({ gecerli: false, neden: expect.stringMatching(/Sahra Mühendisliği/) });
    d.devletler[0].teknolojiler.push("muhendislik");
    expect(emirVer(d, { tur: "askerTopla", sehir: 0, asker: 400, birim: "topcu" }, B).gecerli).toBe(true);
    const [a] = d.ordular;
    d.kusatmalar.push({ sehir: 3, devlet: 0, ordular: [a.id], gun: 0, yontem: "abluka" } as never);
    const once = kusatmaGucu(d, d.kusatmalar[0]).guc;
    a.kompozisyon = { piyade: 9000, okcu: 0, suvari: 0, topcu: 1000 };
    expect(kusatmaGucu(d, d.kusatmalar[0]).guc).toBeGreaterThan(once);
  });

  it("kayıt/yükleme komutan havuzunu ve kıdemi korur", () => {
    const d = yeni();
    emirVer(d, { tur: "komutanYetistir", uzmanlik: "kusatma" }, B); uygula(d);
    emirVer(d, { tur: "komutanAta", ordu: d.ordular[0].id, komutan: d.komutanlar[0].id }, B); uygula(d);
    d.ordular[0].deneyim = 250;
    const e = yukle(kaydet(d), d.senaryo);
    for (let i = 0; i < 40; i++) { gunIlerlet(d, B); gunIlerlet(e, B); }
    expect(durumOzeti(e)).toBe(durumOzeti(d));
    expect(e.ordular[0]).toMatchObject({ komutan: d.komutanlar[0].id, deneyim: 250 });
  });
});
