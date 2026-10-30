// TASK-0009/6a: ilişkiler, savunma ittifakı ve hediye (DEC-0038)
import { describe, expect, it } from "vitest";
import {
  agHazirla, baslangicDurumu, degismezler, DENGE, diplomasiOnHesap, diplomasiSonumu, durumOzeti, emirleriUygula, emirVer, etkiEkle, gunIlerlet,
  hediyePuanBedeli, iliski, iliskiBilesenleri, ittifakKur, kaydet, kullanilabilirHazine, muttefik, savasta, SEMA_SURUMU,
  turuIlerlet, yukle, type DunyaDurumu, type SenaryoVerisi,
} from "../src";
import { TEST_SENARYOSU, yeniDurum } from "./yardimci";

const A = 0, B = 1, C = 2;
const on = (d: DunyaDurumu) => diplomasiOnHesap(d, null);
const sonuc = (d: DunyaDurumu, ...emirler: Parameters<typeof emirVer>[1][]) => {
  for (const e of emirler) expect(emirVer(d, e)).toEqual({ gecerli: true });
  emirleriUygula(d);
};

describe("diplomasi (6a)", () => {
  it("başlangıç tablosu ilişki etkisi ve ittifak olarak yüklenir", () => {
    const d = baslangicDurumu({ ...TEST_SENARYOSU, iliskiler: [{ a: "b", b: "a", deger: -40 }], ittifaklar: [{ a: "a", b: "c" }] }, { tohum: 1 });
    expect(d.iliskiEtkileri).toEqual([{ a: A, b: B, neden: "tarih", deger: -40 }]);
    expect(iliski(d, on(d), A, B)).toBe(-40);
    expect(iliski(d, on(d), B, A)).toBe(-40);
    expect(muttefik(d, C, A)).toBe(true);
    expect(iliski(d, on(d), A, C)).toBe(DENGE.ILISKI_ITTIFAK);
    expect(degismezler(d)).toEqual([]);
  });

  it("ittifak teklifi ilişki eşiğine göre gerekçeyle reddedilir ya da kabul edilir", () => {
    const d = yeniDurum();
    sonuc(d, { tur: "ittifakTeklif", hedef: B });
    expect(muttefik(d, A, B)).toBe(false);
    expect(d.gunluk.at(-1)!.metin).toMatch(/reddetti.*bakışı 0.*en az 25/);
    etkiEkle(d, A, B, "tarih", DENGE.ITTIFAK_ESIGI);
    sonuc(d, { tur: "ittifakTeklif", hedef: B });
    expect(muttefik(d, A, B)).toBe(true);
    expect(d.gunluk.at(-1)!.metin).toMatch(/kabul etti/);
    expect(emirVer(d, { tur: "ittifakTeklif", hedef: B }).gecerli).toBe(false); // zaten müttefik
    expect(emirVer(d, { tur: "savasIlan", devlet: A, hedef: B }).gecerli).toBe(false); // önce ittifaktan çık
    sonuc(d, { tur: "ittifakBoz", hedef: B });
    expect(muttefik(d, A, B)).toBe(false);
    expect(iliski(d, on(d), B, A)).toBe(DENGE.ITTIFAK_ESIGI + DENGE.ETKI_ITTIFAK_BOZMA);
  });

  it("hediye parayı ayırır, aktarır, ilişkiyi sınırlı artırır ve zamanla söner (borç yok)", () => {
    const d = yeniDurum();
    d.devletler[A].hazine = 5000;
    const bedel = hediyePuanBedeli(d, B, on(d));
    expect(emirVer(d, { tur: "hediye", hedef: B, miktar: 6000 }).gecerli).toBe(false);
    expect(emirVer(d, { tur: "hediye", hedef: B, miktar: bedel * 10 }).gecerli).toBe(true);
    expect(kullanilabilirHazine(d, A)).toBe(5000 - bedel * 10);
    const bHazine = d.devletler[B].hazine;
    emirleriUygula(d);
    expect(d.devletler[A].hazine).toBe(5000 - bedel * 10);
    expect(d.devletler[B].hazine).toBe(bHazine + bedel * 10);
    expect(iliski(d, on(d), B, A)).toBe(10);
    d.devletler[A].hazine = 100000;
    sonuc(d, { tur: "hediye", hedef: B, miktar: bedel * 100 });
    expect(iliski(d, on(d), B, A)).toBe(DENGE.HEDIYE_EN_COK); // birikme sınırı
    for (let i = 0; i < 70; i++) gunIlerlet(d); // iki ay başı
    expect(iliski(d, on(d), B, A)).toBe(DENGE.HEDIYE_EN_COK - 2 * DENGE.ETKI_SONUM);
    expect(degismezler(d)).toEqual([]);
  });

  it("savaş ilanı saldırganlığı artırır; savunanın müttefiki çağrıya uyar ya da reddedip ittifakı bozar", () => {
    const d = yeniDurum();
    ittifakKur(d, B, C);
    etkiEkle(d, B, C, "tarih", 10);
    sonuc(d, { tur: "savasIlan", devlet: A, hedef: B });
    expect(d.saldirganlik[A]).toBe(DENGE.SALDIRGANLIK_ILAN);
    expect(savasta(d, A, C)).toBe(true); // C çağrıya uydu
    expect(d.aktifKesinti?.neden).toMatch(/çağrısına uyarak/);
    const bilesen = iliskiBilesenleri(d, on(d), B, A).map((x) => x.ad);
    expect(bilesen).toEqual(expect.arrayContaining(["Geçmiş savaşlar", "Savaştalar", "Saldırganlığı"]));

    const e = yeniDurum();
    ittifakKur(e, B, C);
    etkiEkle(e, B, C, "tarih", -60); // ittifak var ama C, B'yi sevmiyor
    sonuc(e, { tur: "savasIlan", devlet: A, hedef: B });
    expect(savasta(e, A, C)).toBe(false);
    expect(muttefik(e, B, C)).toBe(false);
    expect(e.gunluk.some((o) => /yardım çağrısını reddetti/.test(o.metin))).toBe(true);
    expect(degismezler(e)).toEqual([]);
  });

  it("komşu büyük devlet kaygı yaratır; komşular saldırganlığı iki kat algılar", () => {
    const S: SenaryoVerisi = {
      ...TEST_SENARYOSU, ag: {
        // birim 0 (a) – birim 5 (b) komşu; c ile bağlantı yok
        dugumler: [0, 5, 8].map((b, i) => ({ b, x: i * 10000, y: 0, kx: 10000, ky: 10000, z: 100 })),
        kenarlar: [{ a: 0, b: 1, mx: 5000, my: 0, da: 5000, db: 5000, n: 0, g: 0 }],
      },
    };
    const d = baslangicDurumu(S, { tohum: 1 }), o = diplomasiOnHesap(d, agHazirla(S.ag!));
    // a: 5 arazi, b: 3 → b'nin a'ya bakışında kaygı: (5−3)·10/3 = 6
    expect(iliskiBilesenleri(d, o, B, A)).toEqual([{ ad: "Güçlü komşu kaygısı", deger: -6 }]);
    expect(iliskiBilesenleri(d, o, A, B)).toEqual([]);
    d.saldirganlik[A] = 10;
    expect(iliski(d, o, B, A)).toBe(-6 - 20);
    expect(iliski(d, o, C, A)).toBe(-10);
  });

  it("kayıt/yükleme sonucu değiştirmez; şema 7 kaydı dönüştürülür (AT-011)", () => {
    const d = yeniDurum();
    d.devletler[A].hazine = 5000;
    emirVer(d, { tur: "hediye", hedef: B, miktar: 500 });
    emirVer(d, { tur: "savasIlan", devlet: A, hedef: C });
    turuIlerlet(d);
    const e = yukle(kaydet(d), d.senaryo);
    for (let i = 0; i < 4; i++) { turuIlerlet(d); turuIlerlet(e); }
    expect(durumOzeti(e)).toBe(durumOzeti(d));
    const p = JSON.parse(kaydet(yeniDurum()));
    p.sema = 7; p.durum.sema = 7;
    delete p.durum.iliskiEtkileri; delete p.durum.saldirganlik; delete p.durum.ittifaklar;
    const g = yukle(JSON.stringify(p));
    expect(g.sema).toBe(SEMA_SURUMU);
    expect(g.saldirganlik).toHaveLength(g.devletler.length);
    expect(degismezler(g)).toEqual([]);
  });
});

describe("TASK-0017 (4/4): ticaret anlaşması ve saldırmazlık paktı", () => {
  it("ticaret anlaşması ilişki eşiğine göre reddedilir ya da kabul edilir; tekrar teklif ve bozma", () => {
    const d = yeniDurum();
    sonuc(d, { tur: "ticaretTeklif", hedef: B });
    expect(d.ticaretAnlasmalari).toEqual([]);
    expect(d.gunluk.at(-1)!.metin).toMatch(/reddetti.*bakışı 0.*en az 10/);
    etkiEkle(d, A, B, "tarih", DENGE.TICARET_ANLASMA_ESIGI);
    sonuc(d, { tur: "ticaretTeklif", hedef: B });
    expect(d.ticaretAnlasmalari).toEqual([{ a: A, b: B, baslangic: d.gun }]);
    expect(emirVer(d, { tur: "ticaretTeklif", hedef: B }).gecerli).toBe(false); // zaten var
    sonuc(d, { tur: "ticaretBoz", hedef: B });
    expect(d.ticaretAnlasmalari).toEqual([]);
    expect(emirVer(d, { tur: "ticaretBoz", hedef: B }).gecerli).toBe(false); // zaten yok
    expect(degismezler(d)).toEqual([]);
  });

  it("savaş ilanı mevcut ticaret anlaşmasını bozar", () => {
    const d = yeniDurum();
    etkiEkle(d, A, B, "tarih", DENGE.TICARET_ANLASMA_ESIGI);
    sonuc(d, { tur: "ticaretTeklif", hedef: B });
    expect(d.ticaretAnlasmalari).toHaveLength(1);
    sonuc(d, { tur: "savasIlan", devlet: A, hedef: B });
    expect(d.ticaretAnlasmalari).toEqual([]);
  });

  it("saldırmazlık paktı ilişki 0 iken bile kurulabilir; savaş ilanını engeller; süre dolunca kalkar", () => {
    const d = yeniDurum();
    sonuc(d, { tur: "saldirmazlikTeklif", hedef: B, ay: 12 });
    expect(d.saldirmazlikPaktlari).toEqual([{ a: A, b: B, bitis: d.gun + 12 * 30 }]);
    expect(emirVer(d, { tur: "savasIlan", devlet: A, hedef: B }).gecerli).toBe(false);
    expect(emirVer(d, { tur: "saldirmazlikTeklif", hedef: B, ay: 24 }).gecerli).toBe(false); // zaten var
    expect(emirVer(d, { tur: "saldirmazlikTeklif", hedef: B, ay: 13 as 12 }).gecerli).toBe(false); // geçersiz süre
    d.saldirmazlikPaktlari[0].bitis = d.gun - 1;
    diplomasiSonumu(d);
    expect(d.saldirmazlikPaktlari).toEqual([]);
    expect(emirVer(d, { tur: "savasIlan", devlet: A, hedef: B }).gecerli).toBe(true);
    expect(degismezler(d)).toEqual([]);
  });

  it("savaşan taraflar birbirine saldırmazlık paktı teklif edemez", () => {
    const d = yeniDurum();
    sonuc(d, { tur: "savasIlan", devlet: A, hedef: B });
    expect(emirVer(d, { tur: "saldirmazlikTeklif", hedef: B, ay: 12 }).gecerli).toBe(false);
  });

  it("kayıt/yükleme korur; şema 20 kaydı boş listelerle 21'e taşınır", () => {
    const d = yeniDurum();
    etkiEkle(d, A, B, "tarih", DENGE.TICARET_ANLASMA_ESIGI);
    sonuc(d, { tur: "ticaretTeklif", hedef: B }, { tur: "saldirmazlikTeklif", hedef: C, ay: 24 });
    const e = yukle(kaydet(d), d.senaryo);
    expect(e.ticaretAnlasmalari).toEqual(d.ticaretAnlasmalari);
    expect(e.saldirmazlikPaktlari).toEqual(d.saldirmazlikPaktlari);

    const p = JSON.parse(kaydet(yeniDurum()));
    delete p.durum.ticaretAnlasmalari; delete p.durum.saldirmazlikPaktlari;
    p.sema = 20; p.durum.sema = 20;
    const g = yukle(JSON.stringify(p));
    expect(g.sema).toBe(SEMA_SURUMU);
    expect(g.ticaretAnlasmalari).toEqual([]);
    expect(g.saldirmazlikPaktlari).toEqual([]);
    expect(degismezler(g)).toEqual([]);
  });
});
