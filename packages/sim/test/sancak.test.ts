// TASK-0029 (DEC-0079): şehir → sancak → eyalet
import { describe, expect, it } from "vitest";
import {
  agHazirla, baslangicDurumu, degismezler, durumOzeti, gunIlerlet, kaydet, sancakBakimi, sancakOzetleri, sancakYonetimiAyarla,
  sehirSancaklari, yukle, type SenaryoVerisi,
} from "../src";

// Doğrusal dünya: A şehirleri A1 (0), A2 (1), A3 (2), A4 (3); B1 (4)
const S: SenaryoVerisi = {
  id: "sancak-test", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
  devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }],
  birimler: Array.from({ length: 5 }, (_, i) => ({ devlet: i < 4 ? "a" : "b" })),
  sehirler: [
    { ad: "A1", devlet: "a", birim: 0, dugum: 0, x: 0, y: 0, baskent: true, nufus: 30000 },
    { ad: "A2", devlet: "a", birim: 1, dugum: 1, x: 10000, y: 0, baskent: false, nufus: 12000 },
    { ad: "A3", devlet: "a", birim: 2, dugum: 2, x: 20000, y: 0, baskent: false, nufus: 8000 },
    { ad: "A4", devlet: "a", birim: 3, dugum: 3, x: 30000, y: 0, baskent: false, nufus: 9000 },
    { ad: "B1", devlet: "b", birim: 4, dugum: 4, x: 40000, y: 0, baskent: true, nufus: 30000 },
  ],
  ag: { dugumler: Array.from({ length: 5 }, (_, b) => ({ b, x: b * 10000, y: 0, kx: 10000, ky: 10000, z: 100 })),
    kenarlar: Array.from({ length: 4 }, (_, a) => ({ a, b: a + 1, mx: a * 10000 + 5000, my: 0, da: 5000, db: 5000, n: 0, g: 0 })) },
  sancaklar: {
    devlet: "a",
    eyaletler: [{ id: "bati", ad: "Batı", merkez: "A1" }, { id: "dogu", ad: "Doğu", merkez: "A4" }],
    sancaklar: [
      { ad: "Paşa", eyalet: "bati", merkez: "A1", bey: "Ali Bey", sehirler: ["A1", "A2"] },
      { ad: "Uç", eyalet: "dogu", merkez: "A4", bey: "Veli Bey", sehirler: ["A3", "A4"] },
    ],
  },
};
const B = { ag: agHazirla(S.ag!), sehirKonumlari: S.sehirler.map((s) => ({ x: s.x!, y: s.y! })) };
const yeni = () => baslangicDurumu(S, { tohum: 1 });

describe("sancak sistemi (TASK-0029)", () => {
  it("başlangıçta senaryodaki sancak ve eyaletler kurulur", () => {
    const d = yeni();
    expect(d.eyaletler.map((e) => e.id)).toEqual(["bati", "dogu"]);
    expect(d.sancaklar.map((s) => [s.ad, s.merkez, s.sehirler])).toEqual([["Paşa", 0, [0, 1]], ["Uç", 3, [2, 3]]]);
    expect(sehirSancaklari(d)).toEqual([0, 0, 1, 1, -1]);
    expect(degismezler(d)).toEqual([]);
  });

  it("kaybedilen şehir sancaktan çıkar, merkez en kalabalığa geçer; boşalan sancak kalkar", () => {
    const d = yeni();
    d.sehirler[3].devlet = d.sehirler[3].kontrol = 1; // merkez A4 kaybedildi
    sancakBakimi(d, B);
    expect(d.sancaklar[1]).toMatchObject({ merkez: 2, sehirler: [2] });
    d.sehirler[2].devlet = d.sehirler[2].kontrol = 1;
    sancakBakimi(d, B);
    expect(d.sancaklar.map((s) => s.ad)).toEqual(["Paşa"]);
    expect(degismezler(d)).toEqual([]);
  });

  it("devletin yeni aldığı şehir en yakın sancağa bağlanır", () => {
    const d = yeni();
    d.sehirler[4].devlet = d.sehirler[4].kontrol = 0; // B1 alındı
    sancakBakimi(d, B);
    expect(sehirSancaklari(d)[4]).toBe(1); // A4 merkezli Uç sancağı daha yakın
    expect(d.gunluk.some((o) => /B1 Uç sancağına bağlandı/.test(o.metin))).toBe(true);
  });

  it("sancakbeyi yönetimi sancağın şehirlerinde yerel yöneticiyi açar; yabancı sancak reddedilir", () => {
    const d = yeni();
    expect(sancakYonetimiAyarla(d, 0, true)).toEqual({ gecerli: true });
    expect([0, 1, 2, 3].map((i) => d.sehirler[i].yonetici)).toEqual([true, true, false, false]);
    expect(sancakYonetimiAyarla(d, 0, false).gecerli).toBe(true);
    expect(d.sehirler[0].yonetici).toBe(false);
    d.sancaklar[1].devlet = 1;
    expect(sancakYonetimiAyarla(d, 1, true).gecerli).toBe(false);
  });

  it("özet nüfus ve insan gücünü toplar; kayıt/yükleme sonucu değiştirmez", () => {
    const d = yeni();
    const [pasa] = sancakOzetleri(d, 0);
    expect(pasa.nufus).toBe(d.sehirler[0].nufus + d.sehirler[1].nufus);
    expect(pasa.insanGucu).toBe(d.sehirler[0].insanGucu + d.sehirler[1].insanGucu);
    const e = yukle(kaydet(d), d.senaryo);
    for (let i = 0; i < 40; i++) { gunIlerlet(d, B); gunIlerlet(e, B); }
    expect(durumOzeti(e)).toBe(durumOzeti(d));
  });
});
