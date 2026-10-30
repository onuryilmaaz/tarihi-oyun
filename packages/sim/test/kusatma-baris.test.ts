import { describe, expect, it } from "vitest";
import {
  agHazirla, barisBedeli, barisDevirOzeti, barisDogrula, baslangicDurumu, degismezler, DENGE, durumOzeti, emirleriUygula, emirVer,
  gunIlerlet, kaydet, muharebeleriBaslat, savasSkoru, turSuresiAyarla, turuIlerlet, yukle,
  type BarisTalebi, type KusatmaYontemi, type SenaryoVerisi,
} from "../src";
import { dunyaOzeti } from "./yardimci";

const S: SenaryoVerisi = {
  id: "kusatma-test", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
  devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }, { id: "c", ad: "C" }],
  birimler: ["a", "b", "b", "c", "a"].map((devlet) => ({ devlet })),
  sehirler: [
    { ad: "A1", devlet: "a", birim: 0, dugum: 0, x: 0, y: 0, baskent: true, nufus: 40000 },
    { ad: "B1", devlet: "b", birim: 1, dugum: 1, x: 10000, y: 0, baskent: true, nufus: 40000 },
    { ad: "B2", devlet: "b", birim: 2, dugum: 2, x: 20000, y: 0, baskent: false, nufus: 10000 },
    { ad: "C1", devlet: "c", birim: 3, dugum: 3, x: 30000, y: 0, baskent: true, nufus: 40000 },
  ],
  ordular: [{ ad: "A Ordusu", devlet: "a", asker: 20000, dugum: 0, x: 0, y: 0 }],
  ag: { dugumler: [0, 1, 2, 3, 4].map((b) => ({ b, x: b * 10000, y: 0, kx: 10000, ky: 10000, z: 100 })),
    kenarlar: [0, 1, 2, 3].map((a) => ({ a, b: a + 1, mx: a * 10000 + 5000, my: 0, da: 5000, db: 5000, n: 0, g: 0 })) },
};
const B = { ag: agHazirla(S.ag!), sehirKonumlari: S.sehirler.map((s) => ({ x: s.x!, y: s.y! })) };
function yeni() {
  const d = baslangicDurumu(S, { tohum: 1453 });
  d.ordular = d.ordular.filter((o) => o.devlet === 0);
  d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: 0, savunan: 1, baslangic: d.gun });
  return d;
}
function kusat(yontem: KusatmaYontemi = "abluka") {
  const d = yeni(), o = d.ordular[0]; o.dugum = 1; o.x = 10000;
  expect(emirVer(d, { tur: "kusat", ordu: o.id, sehir: 1, yontem }, B).gecerli).toBe(true);
  emirleriUygula(d, B);
  return d;
}
const talep = (t: Partial<BarisTalebi> = {}): BarisTalebi => ({ savas: 1, birimler: [], sehirler: [], tazminat: 0, ...t });

it("barış önizlemesi tüm arazi seçilse bile geride kalan şehirleri bildirir (UX-01)", () => {
  const d = yeni(), once = durumOzeti(d);
  expect(barisDevirOzeti(d, 1, talep({ birimler: [1, 2] })))
    .toEqual({ alinanArazi: 2, alinanSehir: 0, kalanArazi: 0, kalanSehir: 2, tamIlhak: false });
  expect(barisDevirOzeti(d, 1, talep({ birimler: [1, 2], sehirler: [1, 2] })).tamIlhak).toBe(true);
  expect(durumOzeti(d)).toBe(once);
});

describe("gerçek işgal ve kuşatma", () => {
  it("AT-009: yalnızca şehre yürümek şehri düşürmez; çevre arazi süre sonunda ayrı işgal edilir", () => {
    const d = yeni();
    emirVer(d, { tur: "orduHedef", ordu: 1, x: 10000, y: 0, dugum: 1 }, B);
    emirleriUygula(d, B); gunIlerlet(d, B);
    expect(d.birimler[1].kontrol).toBe(1);
    for (let i = 0; i < DENGE.ISGAL_GUN - 1; i++) gunIlerlet(d, B);
    expect(d.birimler[1]).toMatchObject({ kontrol: 0, sahip: 1 });
    for (let i = 0; i < 60; i++) gunIlerlet(d, B);
    expect(d.sehirler[1]).toMatchObject({ kontrol: 1, devlet: 1 });
    expect(d.kusatmalar).toHaveLength(0);
  });

  it("ayrılan/geri çekilen ordu işgal süresini biriktiremez; dost arazi geri alınabilir", () => {
    const d = yeni(), o = d.ordular[0]; o.dugum = 1; o.x = 10000;
    gunIlerlet(d, B); expect(d.isgalHazirliklari[0].gun).toBe(1);
    o.cekiliyor = true; gunIlerlet(d, B); expect(d.isgalHazirliklari).toHaveLength(0);
    o.cekiliyor = false; o.dugum = 0; o.x = 0;
    d.birimler[0].kontrol = 1; d.birimler[0].isgalBaslangic = d.gun;
    for (let i = 0; i < DENGE.ISGAL_GUN; i++) gunIlerlet(d, B);
    expect(d.birimler[0]).toMatchObject({ sahip: 0, kontrol: 0, isgalBaslangic: null });
  });

  it("AT-007/009: kuşatma emir ve zaman ister; şehir düşmesi çevre mülkiyetini değiştirmez", () => {
    const d = kusat("saldiri"); const bas = d.gun;
    expect(d.sehirler[1].kontrol).toBe(1);
    for (let i = 0; i < DENGE.KUSATMA_EN_AZ_GUN - 1; i++) gunIlerlet(d, B);
    expect(d.sehirler[1].kontrol).toBe(1);
    gunIlerlet(d, B);
    expect(d.sehirler[1]).toMatchObject({ kontrol: 0, devlet: 1 });
    expect(d.birimler[1].sahip).toBe(1); expect(d.birimler[2].kontrol).toBe(1);
    expect(d.gun - bas).toBeGreaterThanOrEqual(DENGE.KUSATMA_EN_AZ_GUN);
    expect(d.aktifKesinti?.neden).toMatch(/kuşatma/); expect(degismezler(d)).toEqual([]);
  });

  it("abluka teslim beklemekten hızlıdır; saldırı daha hızlı ve ek kayıplıdır", () => {
    const oyna = (y: KusatmaYontemi) => {
      const d = kusat(y); let gun = 0;
      while (d.sehirler[1].kontrol === 1 && gun++ < 100) gunIlerlet(d, B);
      expect(d.sehirler[1].kontrol).toBe(0);
      return { gun, asker: d.ordular[0].asker };
    };
    const abluka = oyna("abluka"), bekle = oyna("bekle"), saldiri = oyna("saldiri");
    expect(saldiri.gun).toBeLessThan(abluka.gun); expect(abluka.gun).toBeLessThan(bekle.gun);
    expect(saldiri.asker).toBeLessThan(abluka.asker);
  });

  it("yetersiz güç ilerlemez; uzaktan, yürüyüşte ve barışta kuşatma reddedilir", () => {
    const d = kusat(); d.ordular[0].asker = 10;
    for (let i = 0; i < 10; i++) gunIlerlet(d, B);
    expect(d.kusatmalar[0]).toMatchObject({ gun: 0, erzak: DENGE.KUSATMA_ERZAK });
    const e = yeni();
    expect(emirVer(e, { tur: "kusat", ordu: 1, sehir: 1, yontem: "abluka" }, B).gecerli).toBe(false);
    const o = e.ordular[0]; o.dugum = 1; o.x = 10000; o.rota = [{ d: 1, x: 10001, y: 0, m: 100 }];
    expect(emirVer(e, { tur: "kusat", ordu: 1, sehir: 1, yontem: "abluka" }, B).gecerli).toBe(false);
    o.rota = []; e.savaslar = [];
    expect(emirVer(e, { tur: "kusat", ordu: 1, sehir: 1, yontem: "abluka" }, B).gecerli).toBe(false);
  });

  it("yöntem değişikliği süreyi sıfırlamaz; hareket kuşatmayı kaldırır; bölme engellenir", () => {
    const d = kusat(); gunIlerlet(d, B);
    expect(emirVer(d, { tur: "orduBol", ordu: 1, asker: 100 }, B).gecerli).toBe(false);
    expect(emirVer(d, { tur: "kusat", ordu: 1, sehir: 1, yontem: "bekle" }, B).gecerli).toBe(true);
    emirleriUygula(d, B); expect(d.kusatmalar[0]).toMatchObject({ gun: 1, yontem: "bekle" });
    emirVer(d, { tur: "orduHedef", ordu: 1, x: 0, y: 0, dugum: 0 }, B); emirleriUygula(d, B);
    expect(d.kusatmalar).toHaveLength(0); expect(d.sehirler[1].kontrol).toBe(1);
  });

  it("ordu yok olunca kuşatma kalkar, bozuk başvuru bırakılmaz", () => {
    const d = kusat(); d.ordular = [];
    gunIlerlet(d, B); expect(d.kusatmalar).toHaveLength(0); expect(degismezler(d)).toEqual([]);
  });

  it("aynı arazi biriminde olmak uzaktaki şehri kuşatmaya yetmez", () => {
    const d = yeni(), o = d.ordular[0]; o.dugum = 1; o.x = 15000;
    expect(emirVer(d, { tur: "kusat", ordu: 1, sehir: 1, yontem: "abluka" }, B).gecerli).toBe(false);
    o.x = 10000;
    expect(emirVer(d, { tur: "kusat", ordu: 1, sehir: 1, yontem: "abluka" }, B).gecerli).toBe(true);
  });

  it("aynı yerdeki iki ordu birlikte kuşatabilir; birinin ayrılması diğerini kaldırmaz", () => {
    const d = kusat();
    const ikinci = { ...structuredClone(d.ordular[0]), id: d.sonrakiOrduId++ }; d.ordular.push(ikinci);
    expect(emirVer(d, { tur: "kusat", ordu: ikinci.id, sehir: 1, yontem: "abluka" }, B).gecerli).toBe(true);
    emirleriUygula(d, B); expect(d.kusatmalar[0].ordular).toHaveLength(2);
    expect(emirVer(d, { tur: "kusatmaBirak", ordu: 1 }, B).gecerli).toBe(true); emirleriUygula(d, B);
    expect(d.kusatmalar[0].ordular).toEqual([ikinci.id]); expect(degismezler(d)).toEqual([]);
  });
});

describe("barış ve sahiplik", () => {
  it("başkent tek başına tam zafer değildir; işgal ve kaybedilen arazi skor nedenidir", () => {
    const d = yeni(); d.sehirler[1].kontrol = 0;
    const s = savasSkoru(d, 0, 1); expect(s.skor).toBeGreaterThan(0); expect(s.skor).toBeLessThan(100);
    d.birimler[0].kontrol = 1; expect(savasSkoru(d, 0, 1).skor).toBeLessThan(s.skor);
    expect(d.savaslar).toHaveLength(1);
  });

  it("barışta talep edilen şehir ve arazi ayrı devredilir; istenmeyen işgal geri döner", () => {
    const d = yeni(); d.sehirler[1].kontrol = 0; d.birimler[1].kontrol = 0;
    const t = talep({ sehirler: [1] });
    expect(emirVer(d, { tur: "baris", ...t }, B).gecerli).toBe(true);
    expect(d.sehirler[1].devlet).toBe(1); // tur dışında değişmez
    emirleriUygula(d, B);
    expect(d.sehirler[1]).toMatchObject({ devlet: 0, kontrol: 0, isgalBaslangic: null, baskent: false });
    expect(d.birimler[1]).toMatchObject({ sahip: 1, kontrol: 1, isgalBaslangic: null });
    expect(d.devletler[1].baskent).toBe(2); expect(d.sehirler[2].baskent).toBe(true);
    expect(d.savaslar).toHaveLength(0); expect(d.barislar).toHaveLength(1); expect(degismezler(d)).toEqual([]);
  });

  it("arazi talebi şehir sahibini değiştirmez", () => {
    const d = yeni(); d.birimler[1].kontrol = 0;
    expect(emirVer(d, { tur: "baris", ...talep({ birimler: [1] }) }, B).gecerli).toBe(true);
    emirleriUygula(d, B);
    expect(d.birimler[1]).toMatchObject({ sahip: 0, kontrol: 0 });
    expect(d.sehirler[1]).toMatchObject({ devlet: 1, kontrol: 1, baskent: true });
  });

  it("işgal edilmeyen/yabancı/tekrarlı talepler ve yetersiz skor reddedilir", () => {
    const d = yeni();
    expect(barisDogrula(d, talep({ birimler: [1] })).gecerli).toBe(false);
    d.birimler[1].kontrol = 0;
    for (const t of [talep({ birimler: [1, 1] }), talep({ birimler: [3] }), talep({ sehirler: [99] }),
      talep({ tazminat: -1 }), talep({ tazminat: 1.5 }), talep({ savas: 99 })]) expect(barisDogrula(d, t).gecerli).toBe(false);
    d.devletler[1].hazine = 1000;
    expect(barisDogrula(d, talep({ tazminat: 1000 })).gecerli).toBe(false);
  });

  it("tazminat peşin ödenir, para korunur; ödeyemeyen taraf borçlanamaz", () => {
    const d = yeni(); d.sehirler[1].kontrol = 0; d.devletler[1].hazine = 50;
    expect(barisDogrula(d, talep({ tazminat: 51 })).gecerli).toBe(false);
    const toplam = d.devletler[0].hazine + d.devletler[1].hazine;
    expect(emirVer(d, { tur: "baris", ...talep({ tazminat: 50 }) }, B).gecerli).toBe(true);
    emirleriUygula(d, B);
    expect(d.devletler[1].hazine).toBe(0); expect(d.devletler[0].hazine + d.devletler[1].hazine).toBe(toplam);
  });

  it("tur başında tekrar doğrular; aynı savaşa iki barış teklifi kabul edilmez", () => {
    const d = yeni(); d.birimler[1].kontrol = 0;
    const e = { tur: "baris", ...talep({ birimler: [1] }) } as const;
    expect(emirVer(d, e, B).gecerli).toBe(true); expect(emirVer(d, e, B).gecerli).toBe(false);
    d.birimler[1].kontrol = 1; emirleriUygula(d, B);
    expect(d.savaslar).toHaveLength(1); expect(d.birimler[1].sahip).toBe(1);
    expect(d.gunluk.at(-1)?.tur).toBe("emir-reddedildi");
  });

  it("tam işgalde tüm varlıklar talep edilebilir; devlet otomatik silinmez", () => {
    const d = yeni();
    for (const b of d.birimler) if (b.sahip === 1) b.kontrol = 0;
    for (const c of d.sehirler) if (c.devlet === 1) c.kontrol = 0;
    const t = talep({ birimler: [1, 2], sehirler: [1, 2] });
    expect(savasSkoru(d, 0, 1).skor).toBe(100); expect(barisBedeli(d, 0, 1, t)).toBe(100);
    expect(emirVer(d, { tur: "baris", ...t }, B).gecerli).toBe(true); emirleriUygula(d, B);
    expect(d.devletler).toHaveLength(3); expect(d.devletler[1].baskent).toBeNull(); expect(degismezler(d)).toEqual([]);
  });

  it("barış sadece ilgili savaşı temizler; dışarıdaki ordu ışınlanmadan dönüşe başlar", () => {
    const d = kusat(), o = d.ordular[0];
    const digerSavas = { id: d.sonrakiSavasId++, saldiran: 0, savunan: 2, baslangic: d.gun }; d.savaslar.push(digerSavas);
    d.birimler[3].kontrol = 0;
    const once = { x: o.x, y: o.y, dugum: o.dugum };
    expect(emirVer(d, { tur: "baris", ...talep() }, B).gecerli).toBe(true); emirleriUygula(d, B);
    expect(d.savaslar).toEqual([digerSavas]); expect(d.birimler[3].kontrol).toBe(0); expect(d.kusatmalar).toHaveLength(0);
    expect({ x: o.x, y: o.y, dugum: o.dugum }).toEqual(once); expect(o.cekiliyor).toBe(true);
    for (let i = 0; i < 5 && o.rota.length; i++) gunIlerlet(d, B);
    expect(d.birimler[B.ag.dugumler[o.dugum].b].sahip).toBe(0); expect(degismezler(d)).toEqual([]);
  });

  it("süren muharebe barışla durur; başka savaşa ait kuşatma ve işgal korunur", () => {
    const d = yeni(); const o = d.ordular[0]; o.dugum = 1; o.x = 10000;
    const dusman = { ...structuredClone(o), id: d.sonrakiOrduId++, devlet: 1, asker: 3000 }; d.ordular.push(dusman);
    muharebeleriBaslat(d); expect(d.muharebeler).toHaveLength(1);
    d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: 0, savunan: 2, baslangic: d.gun });
    const diger = { ...structuredClone(o), id: d.sonrakiOrduId++, dugum: 3, x: 30000, muharebe: null }; d.ordular.push(diger);
    expect(emirVer(d, { tur: "kusat", ordu: diger.id, sehir: 3, yontem: "abluka" }, B).gecerli).toBe(true);
    emirleriUygula(d, B);
    expect(emirVer(d, { tur: "baris", ...talep() }, B).gecerli).toBe(true); emirleriUygula(d, B);
    expect(d.muharebeler).toHaveLength(0); expect(d.ordular.every((a) => a.muharebe === null)).toBe(true);
    expect(d.kusatmalar.map((k) => k.sehir)).toEqual([3]); expect(d.savaslar).toHaveLength(1);
    expect(degismezler(d)).toEqual([]);
  });

  it("kaybedilen şehirde toplama iptal edilir; aynı hazineden peşin ödeme iki kez alınamaz", () => {
    const d = yeni(); d.sehirler[1].kontrol = 0; d.birimler[1].kontrol = 0;
    d.askerToplamalar.push({ id: d.sonrakiToplamaId++, sehir: 1, devlet: 1, asker: 200, kalanGun: 10, bedel: 20 });
    expect(emirVer(d, { tur: "baris", ...talep({ sehirler: [1] }) }, B).gecerli).toBe(true);
    emirleriUygula(d, B); expect(d.askerToplamalar).toHaveLength(0);
    expect(d.sehirler[1].devlet).toBe(0);
    expect(emirVer(d, { tur: "baris", ...talep({ tazminat: 1 }) }, B).gecerli).toBe(false);
  });
});

describe("4c kayıt ve determinizm", () => {
  it("kuşatma ortasında kayıt/yükle ve devam aynı sonucu verir", () => {
    const d = kusat(); turSuresiAyarla(d, "hafta"); turuIlerlet(d, B);
    const e = yukle(kaydet(d));
    for (let i = 0; i < 4; i++) { turuIlerlet(d, B); turuIlerlet(e, B); }
    expect(durumOzeti(d)).toBe(durumOzeti(e)); expect(degismezler(e)).toEqual([]);
  });

  it("şema 4 dönüşümü mevcut toplama, para ve orduları korur; bozuk kuşatma reddedilir", () => {
    const d = yeni(); emirVer(d, { tur: "askerTopla", sehir: 0, asker: 100 }, B); emirleriUygula(d, B);
    const p = JSON.parse(kaydet(d)); p.sema = p.durum.sema = 4;
    delete p.durum.kusatmalar; delete p.durum.isgalHazirliklari; delete p.durum.barislar;
    for (const c of p.durum.sehirler) { delete c.sur; delete c.garnizon; }
    expect(yukle(JSON.stringify(p))).toEqual(d);
    const q = JSON.parse(kaydet(kusat())); q.durum.kusatmalar[0].ordular = [999];
    expect(() => yukle(JSON.stringify(q))).toThrow(/tutarsız/);
    p.durum.sema = 5;
    expect(() => yukle(JSON.stringify(p))).toThrow(/şema sürümleri uyuşmuyor/);
  });

  it("aynı gün sayısında farklı tur süreleri aynı işgal/kuşatma sonucunu üretir", () => {
    const a = kusat("bekle"), b = kusat("bekle");
    turSuresiAyarla(a, "ay"); turuIlerlet(a, B);
    turSuresiAyarla(b, "hafta"); for (let i = 0; i < 4; i++) turuIlerlet(b, B);
    while (b.gun < a.gun) gunIlerlet(b, B);
    expect(dunyaOzeti(a)).toBe(dunyaOzeti(b)); expect(degismezler(a)).toEqual([]);
  });

  it("barış sonrası sahiplik, başkentler ve kayıt geçmişi yüklenince korunur", () => {
    const d = yeni(); d.sehirler[1].kontrol = 0; d.birimler[1].kontrol = 0;
    emirVer(d, { tur: "baris", ...talep({ birimler: [1], sehirler: [1] }) }, B); emirleriUygula(d, B);
    const e = yukle(kaydet(d)); expect(e).toEqual(d);
    for (let i = 0; i < 40; i++) { gunIlerlet(d, B); gunIlerlet(e, B); }
    expect(durumOzeti(e)).toBe(durumOzeti(d)); expect(degismezler(e)).toEqual([]);
  });
});
