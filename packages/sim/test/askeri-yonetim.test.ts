import { describe, expect, it } from "vitest";
import {
  agHazirla, baslangicDurumu, degismezler, devletMaasi, durumOzeti, emirDogrula, emirleriUygula, emirVer,
  insanGucuTavani, kaydet, otomatikTakviyeler, toplamalariIlerlet, turSuresiAyarla, turuIlerlet, yukle,
  yzButceToparla, DENGE, type SenaryoVerisi,
} from "../src";

const senaryo: SenaryoVerisi = {
  id: "askeri-yonetim", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
  devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }], birimler: [{ devlet: "a" }, { devlet: "a" }, { devlet: "b" }],
  sehirler: [
    { ad: "A1", devlet: "a", birim: 0, dugum: 0, baskent: true, nufus: 20000, x: 0, y: 0 },
    { ad: "A2", devlet: "a", birim: 1, dugum: 1, baskent: false, nufus: 10000, x: 10000, y: 0 },
    { ad: "B1", devlet: "b", birim: 2, dugum: 2, baskent: true, nufus: 20000, x: 20000, y: 0 },
  ],
  ordular: [{ ad: "Birinci", devlet: "a", asker: 1000, dugum: 0, x: 0, y: 0 }],
  ag: {
    dugumler: [0, 1, 2].map((b) => ({ b, x: b * 10000, y: 0, z: 100, kx: 10000, ky: 10000 })),
    kenarlar: [0, 1].map((a) => ({ a, b: a + 1, mx: a * 10000 + 5000, my: 0, da: 5000, db: 5000, n: 0, g: 0 })),
  },
};
const b = { ag: agHazirla(senaryo.ag!), sehirKonumlari: senaryo.sehirler.map((s) => ({ x: s.x!, y: s.y! })) };
function yeni() {
  const d = baslangicDurumu(senaryo, { tohum: 23 });
  d.ordular = d.ordular.filter((o) => o.devlet === 0);
  d.devletler.forEach((v) => { v.hazine = 10000; });
  d.ordular[0].kompozisyon = { piyade: 400, okcu: 300, suvari: 300 };
  return d;
}
function ac(d: ReturnType<typeof yeni>, hedef = 1500, aylikButce = 1000) {
  expect(emirVer(d, { tur: "orduTakviye", ordu: d.ordular[0].id, acik: true, hedef, aylikButce }, b).gecerli).toBe(true);
  emirleriUygula(d, b);
}

describe("TASK-0043: terhis", () => {
  it("turdan önce yalnız emir vardır; terhis türleri/maaşı azaltır, insan gücünü tavanda tutar", () => {
    const d = yeni(), o = d.ordular[0], ilkMaas = devletMaasi(d, 0), para = d.devletler[0].hazine;
    d.sehirler[0].insanGucu = 950;
    expect(emirVer(d, { tur: "orduTerhis", ordu: o.id, asker: 250 }, b).gecerli).toBe(true);
    expect(o.asker).toBe(1000);
    expect(emirVer(d, { tur: "orduBol", ordu: o.id, asker: 100 }, b).gecerli).toBe(false);
    emirleriUygula(d, b);
    expect(o.asker).toBe(750);
    expect(o.kompozisyon).toEqual({ piyade: 300, okcu: 225, suvari: 225 });
    expect(devletMaasi(d, 0)).toBeLessThan(ilkMaas);
    expect(d.sehirler[0].insanGucu).toBe(insanGucuTavani(d, 0));
    expect(d.devletler[0].hazine).toBe(para);
    expect(degismezler(d)).toEqual([]);
  });
  it("tam terhis orduyu kaldırır; başka devlet, hareket, kuşatma ve işgal sırasında reddedilir", () => {
    const d = yeni(), o = d.ordular[0], e = { tur: "orduTerhis", ordu: o.id, asker: 1000 } as const;
    expect(emirDogrula(d, { ...e, devlet: 1 }, b).gecerli).toBe(false);
    for (const asker of [0, -1, 1.5, NaN, Infinity, 1001]) expect(emirDogrula(d, { ...e, asker }, b).gecerli).toBe(false);
    o.rota = [{ d: 1, x: 10000, y: 0, m: 10000 }];
    expect(emirDogrula(d, e, b).gecerli).toBe(false); o.rota = [];
    d.kusatmalar = [{ sehir: 2, devlet: 0, savunan: 1, ordular: [o.id], yontem: "abluka", baslangic: d.gun, gun: 0, erzak: 1000 }];
    expect(emirDogrula(d, e, b).gecerli).toBe(false); d.kusatmalar = [];
    d.birimler[0].kontrol = 1;
    expect(emirDogrula(d, e, b).gecerli).toBe(false); d.birimler[0].kontrol = 0;
    expect(emirVer(d, e, b).gecerli).toBe(true); emirleriUygula(d, b);
    expect(d.ordular).toHaveLength(0);
    expect(degismezler(d)).toEqual([]);
  });
  it("tur başında konum yeniden doğrulanır; eksi hazinede de terhis yapılabilir", () => {
    const d = yeni(), o = d.ordular[0], e = { tur: "orduTerhis", ordu: o.id, asker: 500 } as const;
    d.devletler[0].hazine = -100;
    expect(emirVer(d, e, b).gecerli).toBe(true);
    d.birimler[0].kontrol = 1; emirleriUygula(d, b);
    expect(o.asker).toBe(1000);
    d.birimler[0].kontrol = 0;
    expect(emirVer(d, e, b).gecerli).toBe(true); emirleriUygula(d, b);
    expect(o.asker).toBe(500); expect(d.devletler[0].hazine).toBe(-100);
  });
});

describe("TASK-0043: otomatik takviye", () => {
  it("tür oranları, bedel, insan gücü ve toplama süresi korunur; aynı ay tekrar para harcamaz", () => {
    const d = yeni(), o = d.ordular[0], ilkPara = d.devletler[0].hazine;
    ac(d); otomatikTakviyeler(d, b);
    expect(o.takviye!.hedef).toEqual({ piyade: 600, okcu: 450, suvari: 450 });
    expect(o.asker).toBe(1000);
    expect(d.askerToplamalar.reduce((n, t) => n + t.asker, 0)).toBe(500);
    expect(d.sehirler[0].insanGucu).toBe(500);
    const harcama = ilkPara - d.devletler[0].hazine;
    expect(harcama).toBeGreaterThan(0);
    const sayi = d.askerToplamalar.length;
    otomatikTakviyeler(d, b); expect(d.askerToplamalar).toHaveLength(sayi);
    expect(d.devletler[0].hazine).toBe(ilkPara - harcama);
    for (let gun = 0; gun < DENGE.TOPLAMA_GUN; gun++) toplamalariIlerlet(d, b);
    expect(d.ordular).toHaveLength(1); expect(o.asker).toBe(1500);
    expect(o.kompozisyon).toEqual(o.takviye!.hedef);
    expect(degismezler(d)).toEqual([]);
  });
  it("aylık bütçe ve bekleyen elle harcama aynı parayı iki kez kullanamaz; havuz yetersizse kısmi toplar", () => {
    const d = yeni(); d.devletler[0].hazine = 50; d.sehirler[0].insanGucu = 20;
    ac(d, 2000, 10);
    expect(emirVer(d, { tur: "harca", devlet: 0, miktar: 45, aciklama: "yatırım" }, b).gecerli).toBe(true);
    otomatikTakviyeler(d, b);
    expect(d.devletler[0].hazine).toBeGreaterThanOrEqual(45);
    expect(d.devletler[0].hazine).toBeLessThan(50);
    expect(d.askerToplamalar.reduce((n, t) => n + t.asker, 0)).toBeLessThanOrEqual(20);
    expect(d.sehirler[0].insanGucu).toBeGreaterThanOrEqual(0);
    emirleriUygula(d, b); expect(d.devletler[0].hazine).toBeGreaterThanOrEqual(0);
  });
  it("hareket eden hedefi bekler; hedef ordu yok olursa hazır askerler kaybolmaz", () => {
    const d = yeni(), o = d.ordular[0]; ac(d); otomatikTakviyeler(d, b);
    const sure = d.askerToplamalar[0].kalanGun;
    o.rota = [{ d: 1, x: 10000, y: 0, m: 10000 }];
    toplamalariIlerlet(d, b); expect(d.askerToplamalar[0].kalanGun).toBe(sure);
    d.ordular = [];
    for (let gun = 0; gun < DENGE.TOPLAMA_GUN; gun++) toplamalariIlerlet(d, b);
    expect(d.askerToplamalar).toHaveLength(0);
    expect(d.ordular.reduce((n, x) => n + x.asker, 0)).toBe(500);
    expect(degismezler(d)).toEqual([]);
  });
  it("kapatma yalnız otomatik toplama bedelini iade eder, ikinci kez iade üretmez", () => {
    const d = yeni(), o = d.ordular[0], para = d.devletler[0].hazine;
    ac(d); otomatikTakviyeler(d, b);
    const kapat = { tur: "orduTakviye", ordu: o.id, acik: false, hedef: 0, aylikButce: 0 } as const;
    expect(emirVer(d, kapat, b).gecerli).toBe(true); emirleriUygula(d, b);
    expect(d.askerToplamalar).toHaveLength(0); expect(o.takviye).toBeUndefined();
    expect(d.devletler[0].hazine).toBe(para);
    expect(d.sehirler[0].insanGucu).toBe(1000);
    expect(emirVer(d, kapat, b).gecerli).toBe(true); emirleriUygula(d, b);
    expect(d.devletler[0].hazine).toBe(para);
  });
  it("bölme takviye hedefini çoğaltmaz; geçmiş şemadan farklı kayıtlar taşınmaz", () => {
    const d = yeni(), o = d.ordular[0]; ac(d); otomatikTakviyeler(d, b);
    expect(emirVer(d, { tur: "orduBol", ordu: o.id, asker: 300 }, b).gecerli).toBe(true); emirleriUygula(d, b);
    expect(d.ordular.every((a) => a.takviye === undefined)).toBe(true);
    expect(d.askerToplamalar).toHaveLength(0);
    const e = yeni(); ac(e); otomatikTakviyeler(e, b);
    const y = yukle(kaydet(e));
    expect(durumOzeti(e)).toBe(durumOzeti(y));
    for (const x of [e, y]) { turSuresiAyarla(x, "hafta"); turuIlerlet(x, b); }
    expect(durumOzeti(e)).toBe(durumOzeti(y));
  });
  it("negatif, kesirli ve sınırsız hedef/bütçe reddedilir", () => {
    const d = yeni(), o = d.ordular[0], e = { tur: "orduTakviye", ordu: o.id, acik: true, hedef: 1500, aylikButce: 100 } as const;
    for (const hedef of [0, -1, 999, 1.5, NaN, Infinity, DENGE.TAKVIYE_EN_COK_ASKER + 1]) expect(emirDogrula(d, { ...e, hedef }, b).gecerli).toBe(false);
    for (const aylikButce of [0, -1, 0.5, NaN, Infinity]) expect(emirDogrula(d, { ...e, aylikButce }, b).gecerli).toBe(false);
  });
});

describe("TASK-0043: AI bütçesi", () => {
  it("barışta fazla maaşı kademeli azaltır; savaş sırasında ve oyuncu dışı yetki olmadan terhis yapmaz", () => {
    const d = yeni(), o = d.ordular[0]; o.devlet = 1; o.dugum = 2; o.x = 20000; d.devletler[1].hazine = -500;
    const once = o.asker;
    yzButceToparla(d, b, 1, 1);
    expect(o.asker).toBeLessThan(once);
    expect(o.asker).toBeGreaterThanOrEqual(once * 0.75);
    d.savaslar = [{ id: 1, saldiran: 0, savunan: 1, baslangic: d.gun }];
    const savasta = o.asker; yzButceToparla(d, b, 1, 1); expect(o.asker).toBe(savasta);
    expect(d.devletler[1].hazine).toBe(-500);
  });
});
