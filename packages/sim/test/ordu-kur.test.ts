// TASK-0036: tek emirle ordu kurma — yakın şehirlerden toplanır, toplanma şehrinde tek orduda birleşir
import { describe, expect, it } from "vitest";
import { agHazirla, baslangicDurumu, degismezler, DENGE, durumOzeti, emirVer, gunIlerlet, insanGucuTavani, insanGucuYenile, kaydet, orduKurPlani, turuIlerlet, yukle, type SenaryoVerisi } from "../src";

// Doğrusal dünya: A1 (0) … A4 (3), B1 (4); düğümler 10 km arayla
const S: SenaryoVerisi = {
  id: "ordu-kur-test", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
  devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }],
  birimler: Array.from({ length: 5 }, (_, i) => ({ devlet: i < 4 ? "a" : "b" })),
  sehirler: [0, 1, 2, 3, 4].map((i) => ({ ad: i < 4 ? `A${i + 1}` : "B1", devlet: i < 4 ? "a" : "b", birim: i, dugum: i, x: i * 10000, y: 0,
    baskent: i === 0 || i === 4, nufus: 40000 })),
  ag: { dugumler: Array.from({ length: 5 }, (_, b) => ({ b, x: b * 10000, y: 0, kx: 10000, ky: 10000, z: 100 })),
    kenarlar: Array.from({ length: 4 }, (_, a) => ({ a, b: a + 1, mx: a * 10000 + 5000, my: 0, da: 5000, db: 5000, n: 0, g: 0 })) },
};
const B = { ag: agHazirla(S.ag!), sehirKonumlari: S.sehirler.map((s) => ({ x: s.x!, y: s.y! })) };
const yeni = () => {
  const d = baslangicDurumu(S, { tohum: 1 });
  d.ordular = [];
  d.devletler[0].hazine = 100000;
  return d;
};

describe("tek emirle ordu kurma (TASK-0036)", () => {
  it("asker en yakın şehirlerden bölüşülür; birlikler toplanma şehrinde tek orduda birleşir", () => {
    const d = yeni();
    const havuz = d.sehirler[1].insanGucu;
    expect(emirVer(d, { tur: "orduKur", sehir: 1, asker: havuz + 500 }, B)).toEqual({ gecerli: true });
    // Önce toplanma şehrinin kendisi, sonra en yakın komşu (A1 ve A3 eşit; düşük indeks önce)
    expect(d.emirKuyrugu.map((e) => e.tur === "askerTopla" && [e.sehir, e.asker, e.toplanma])).toEqual([[1, havuz, 1], [0, 500, 1]]);
    turuIlerlet(d, B);
    for (let i = 0; i < 90 && d.askerToplamalar.length + d.ordular.filter((o) => o.toplanma !== undefined).length; i++) gunIlerlet(d, B);
    expect(d.ordular).toHaveLength(1);
    expect(d.ordular[0]).toMatchObject({ ad: "A2 Ordusu", dugum: 1, asker: havuz + 500 });
    expect(d.gunluk.some((o) => /A1 Ordusu, A2'da A2 Ordusu ile birleşti/.test(o.metin))).toBe(true);
    expect(degismezler(d)).toEqual([]);
  });

  it("yetmeyen insan gücü ve hazine reddedilir; yabancı şehirde ordu kurulamaz", () => {
    const d = yeni();
    const toplam = d.sehirler.slice(0, 4).reduce((t, s) => t + s.insanGucu, 0);
    expect(emirVer(d, { tur: "orduKur", sehir: 1, asker: toplam + 1 }, B).gecerli).toBe(false);
    expect(emirVer(d, { tur: "orduKur", sehir: 4, asker: 100 }, B).gecerli).toBe(false);
    d.devletler[0].hazine = 1;
    expect(emirVer(d, { tur: "orduKur", sehir: 1, asker: 5000 }, B)).toMatchObject({ gecerli: false, neden: expect.stringMatching(/Hazine yetersiz/) });
    expect(d.emirKuyrugu).toEqual([]);
    expect(DENGE.ORDU_KUR_EN_COK_GUN).toBeGreaterThan(0);
  });

  it("yürüyüşteki birlik başka hedefe gönderilirse toplanma bozulur; kayıt/yükleme sonucu değiştirmez", () => {
    const d = yeni();
    emirVer(d, { tur: "orduKur", sehir: 3, asker: d.sehirler[3].insanGucu + d.sehirler[2].insanGucu + d.sehirler[1].insanGucu + 100 }, B); // A1'den 100: 30 km, 2 gün
    turuIlerlet(d, B);
    while (d.askerToplamalar.length) gunIlerlet(d, B);
    const e = yukle(kaydet(d), d.senaryo);
    const yuruyen = d.ordular.find((o) => o.toplanma !== undefined && o.dugum !== 3)!;
    expect(yuruyen).toBeDefined();
    expect(emirVer(d, { tur: "orduDur", ordu: yuruyen.id }, B).gecerli).toBe(true);
    turuIlerlet(d, B);
    expect(d.ordular.find((o) => o.id === yuruyen.id)?.toplanma).toBeUndefined();
    const f = yukle(kaydet(e), e.senaryo);
    for (let i = 0; i < 20; i++) { gunIlerlet(e, B); gunIlerlet(f, B); }
    expect(durumOzeti(f)).toBe(durumOzeti(e));
    expect(degismezler(e)).toEqual([]);
  });
});

describe("insan gücü yenilenmesi (TASK-0039)", () => {
  it("boşalan havuz her ay tavanın 1/12'si kadar dolar, tavanı aşmaz; kayıt/yükleme sonucu değiştirmez", () => {
    const d = yeni();
    const tavan = insanGucuTavani(d, 1);
    d.sehirler[1].insanGucu = 0;
    insanGucuYenile(d);
    expect(d.sehirler[1].insanGucu).toBe(Math.ceil(tavan / DENGE.INSAN_GUCU_YENILENME_AY));
    for (let i = 0; i < DENGE.INSAN_GUCU_YENILENME_AY + 2; i++) insanGucuYenile(d);
    expect(d.sehirler[1].insanGucu).toBe(tavan);
    const e = yukle(kaydet(d), d.senaryo);
    d.sehirler[2].insanGucu = e.sehirler[2].insanGucu = 0;
    for (let i = 0; i < 70; i++) { gunIlerlet(d, B); gunIlerlet(e, B); }
    expect(d.sehirler[2].insanGucu).toBeGreaterThan(0);
    expect(durumOzeti(e)).toBe(durumOzeti(d));
  });

  it("ordu kurma yetmezse toplanabilecek en çok askeri bildirir", () => {
    const d = yeni();
    const toplam = d.sehirler.slice(0, 4).reduce((t, s) => t + s.insanGucu, 0);
    expect(orduKurPlani(d, { tur: "orduKur", sehir: 1, asker: toplam + 1 }, B)).toMatchObject({ gecerli: false, toplanabilir: toplam });
  });
});
