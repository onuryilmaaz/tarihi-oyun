// TASK-0026 (DEC-0076): şehir adı değiştirme ve şehir birleştirme
import { describe, expect, it } from "vitest";
import {
  agHazirla, baslangicDurumu, degismezler, DENGE, durumOzeti, emirleriUygula, emirVer, gunIlerlet, kaydet, kullanilabilirHazine,
  sehirAdiDegistir, yukle, type DunyaDurumu, type SenaryoVerisi,
} from "../src";

// Doğrusal dünya: A birim 0–2 (A1 başkent, A2, A3), B birim 3–5 (B1); her birim bir düğüm, ardışık düğümler komşu
const S: SenaryoVerisi = {
  id: "sehir-test", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
  devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }],
  birimler: Array.from({ length: 6 }, (_, i) => ({ devlet: i < 3 ? "a" : "b" })),
  sehirler: [
    { ad: "A1", devlet: "a", birim: 0, dugum: 0, x: 0, y: 0, baskent: true, nufus: 30000 },
    { ad: "A2", devlet: "a", birim: 1, dugum: 1, x: 10000, y: 0, baskent: false, nufus: 12000 },
    { ad: "A3", devlet: "a", birim: 2, dugum: 2, x: 20000, y: 0, baskent: false, nufus: 8000 },
    { ad: "B1", devlet: "b", birim: 3, dugum: 3, x: 30000, y: 0, baskent: true, nufus: 30000 },
  ],
  ag: { dugumler: Array.from({ length: 6 }, (_, b) => ({ b, x: b * 10000, y: 0, kx: 10000, ky: 10000, z: 100 })),
    kenarlar: Array.from({ length: 5 }, (_, a) => ({ a, b: a + 1, mx: a * 10000 + 5000, my: 0, da: 5000, db: 5000, n: 0, g: 0 })) },
};
const B = { ag: agHazirla(S.ag!) };
const A = 0, A1 = 0, A2 = 1, A3 = 2, B1 = 3;
const yeni = () => { const d = baslangicDurumu(S, { tohum: 1 }); d.devletler[A].hazine = 5000; return d; };
const bitir = (d: DunyaDurumu) => { for (let i = 0; i < DENGE.SEHIR_BIRLESTIR_GUN; i++) gunIlerlet(d, B); };

describe("şehir adı (TASK-0026)", () => {
  it("yalnızca kendi şehri; boş, uzun ve başka şehrin adı reddedilir; eski ad saklanır, geri dönünce silinir", () => {
    const d = yeni();
    expect(sehirAdiDegistir(d, B1, "Yeni").gecerli).toBe(false);
    expect(sehirAdiDegistir(d, A2, "  ").gecerli).toBe(false);
    expect(sehirAdiDegistir(d, A2, "x".repeat(DENGE.SEHIR_ADI_EN_UZUN + 1)).gecerli).toBe(false);
    expect(sehirAdiDegistir(d, A2, "b1").gecerli).toBe(false); // büyük/küçük harf duyarsız benzersizlik
    expect(sehirAdiDegistir(d, A2, "  Yeni   Şehir ")).toEqual({ gecerli: true });
    expect(d.sehirler[A2]).toMatchObject({ ad: "Yeni Şehir", eskiAd: "A2" });
    expect(sehirAdiDegistir(d, A2, "Üçüncü").gecerli).toBe(true);
    expect(d.sehirler[A2].eskiAd).toBe("A2"); // ilk ad korunur
    expect(sehirAdiDegistir(d, A2, "A2").gecerli).toBe(true);
    expect(d.sehirler[A2]).toMatchObject({ ad: "A2", eskiAd: null });
    expect(d.gunluk.some((o) => o.tur === "sehir-adi")).toBe(true);
    expect(degismezler(d)).toEqual([]);
  });
});

describe("şehir birleştirme (TASK-0026)", () => {
  it("doğrulama: komşu olmalı, ikisi de kendi şehri olmalı, bedel ayrılır, aynı şehir iki birleşmeye giremez", () => {
    const d = yeni();
    expect(emirVer(d, { tur: "sehirBirlestir", sehir: A1, katilan: A3 }, B).gecerli).toBe(false); // komşu değil
    expect(emirVer(d, { tur: "sehirBirlestir", sehir: A3, katilan: B1 }, B).gecerli).toBe(false); // yabancı şehir
    expect(emirVer(d, { tur: "sehirBirlestir", sehir: A1, katilan: A2 }, B).gecerli).toBe(true);
    expect(kullanilabilirHazine(d, A)).toBe(5000 - DENGE.SEHIR_BIRLESTIR_BEDEL);
    expect(emirVer(d, { tur: "sehirBirlestir", sehir: A2, katilan: A3 }, B).gecerli).toBe(false); // A2 zaten bekliyor
    const e = yeni(); e.devletler[A].hazine = DENGE.SEHIR_BIRLESTIR_BEDEL - 1;
    expect(emirVer(e, { tur: "sehirBirlestir", sehir: A1, katilan: A2 }, B).gecerli).toBe(false);
  });

  it("30 gün sonra büyük şehir merkez kalır; nüfus ve yapılar geçer, küçük şehir bağlanır ve hedef olamaz", () => {
    const d = yeni();
    d.sehirler[A3].yapilar = { tarla: 2, pazar: 1 };
    d.sehirler[A2].yapilar = { tarla: 2, pazar: 0 };
    const toplam = d.sehirler[A2].nufus + d.sehirler[A3].nufus;
    emirVer(d, { tur: "sehirBirlestir", sehir: A3, katilan: A2 }, B); // küçük olan merkez seçilse de büyük merkez kalır
    emirleriUygula(d, B);
    expect(d.devletler[A].hazine).toBe(5000 - DENGE.SEHIR_BIRLESTIR_BEDEL);
    bitir(d);
    const m = d.sehirler[A2], k = d.sehirler[A3];
    expect(d.sehirBirlesmeleri).toHaveLength(0);
    expect(m.nufus).toBe(toplam);
    expect(m.yapilar.tarla).toBe(DENGE.YAPI_EN_YUKSEK.tarla); // 2 + 2, en yüksek seviyeyle sınırlı
    expect(m.yapilar.pazar).toBe(1);
    expect(k).toMatchObject({ bagli: A2, nufus: 0, garnizon: 0, insanGucu: 0 });
    expect(degismezler(d)).toEqual([]);
    expect(emirVer(d, { tur: "askerTopla", sehir: A3, asker: 100 }, B).gecerli).toBe(false);
    expect(emirVer(d, { tur: "insaat", sehir: A3, yapi: "tarla" }, B).gecerli).toBe(false);
    expect(sehirAdiDegistir(d, A3, "Başka").gecerli).toBe(false);
    // Bağlı şehrin sahipliği merkezi izler
    d.sehirler[A2].devlet = d.sehirler[A2].kontrol = 1;
    gunIlerlet(d, B);
    expect(d.sehirler[A3]).toMatchObject({ devlet: 1, kontrol: 1 });
  });

  it("başkent her zaman merkez kalır", () => {
    const d = yeni();
    d.sehirler[A2].nufus = 50000; d.sehirler[A2].gruplar[0].nufus = 50000;
    emirVer(d, { tur: "sehirBirlestir", sehir: A2, katilan: A1 }, B);
    emirleriUygula(d, B);
    bitir(d);
    expect(d.sehirler[A2].bagli).toBe(A1);
    expect(d.sehirler[A1].baskent).toBe(true);
    expect(degismezler(d)).toEqual([]);
  });

  it("süre içinde kontrol kaybedilirse birleşme iptal olur, bedel iade edilmez", () => {
    const d = yeni();
    emirVer(d, { tur: "sehirBirlestir", sehir: A1, katilan: A2 }, B);
    emirleriUygula(d, B);
    gunIlerlet(d, B);
    const hazine = d.devletler[A].hazine;
    d.sehirler[A2].kontrol = 1;
    gunIlerlet(d, B);
    expect(d.sehirBirlesmeleri).toHaveLength(0);
    expect(d.sehirler[A2].bagli).toBe(-1);
    expect(d.devletler[A].hazine).toBeLessThanOrEqual(hazine);
    expect(d.gunluk.some((o) => /iptal oldu/.test(o.metin))).toBe(true);
  });

  it("birleşme sürerken kayıt/yükleme sonucu değiştirmez", () => {
    const d = yeni();
    sehirAdiDegistir(d, A2, "Yeni");
    emirVer(d, { tur: "sehirBirlestir", sehir: A1, katilan: A2 }, B);
    emirleriUygula(d, B);
    for (let i = 0; i < 10; i++) gunIlerlet(d, B);
    const e = yukle(kaydet(d), d.senaryo);
    for (let i = 0; i < 40; i++) { gunIlerlet(d, B); gunIlerlet(e, B); }
    expect(durumOzeti(e)).toBe(durumOzeti(d));
    expect(e.sehirler[A2].bagli).toBe(A1);
  });
});
