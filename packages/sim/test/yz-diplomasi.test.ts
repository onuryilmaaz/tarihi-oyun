// TASK-0020 (1/3, DEC-0069): AI'dan oyuncuya diplomatik teklifler (ittifak/ticaret/saldırmazlık).
import { describe, expect, it } from "vitest";
import {
  agHazirla, baslangicDurumu, degismezler, DENGE, diplomasiOnHesap, diplomatikTeklifKarari, diplomatikTeklifSureleri,
  emirDogrula, emirUygula, emirVer, etkiEkle, muttefik, saldirmazlikVar, ticaretAnlasmasiVar, type DunyaDurumu, type SenaryoVerisi,
} from "../src";

// A (oyuncu) ve B komşu; C, A'ya komşu değil (B üzerinden ulaşılır).
const S: SenaryoVerisi = {
  id: "yz-diplomasi", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
  devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }, { id: "c", ad: "C" }],
  birimler: ["a", "a", "b", "b", "c", "c"].map((devlet) => ({ devlet })),
  sehirler: [
    { ad: "A1", devlet: "a", birim: 0, dugum: 0, x: 0, y: 0, baskent: true, nufus: 40000 },
    { ad: "B1", devlet: "b", birim: 2, dugum: 2, x: 20000, y: 0, baskent: true, nufus: 40000 },
    { ad: "C1", devlet: "c", birim: 4, dugum: 4, x: 40000, y: 0, baskent: true, nufus: 40000 },
  ],
  ag: { dugumler: [0, 1, 2, 3, 4, 5].map((b) => ({ b, x: b * 10000, y: 0, kx: 10000, ky: 10000, z: 100 })),
    kenarlar: [0, 1, 2, 3, 4].map((a) => ({ a, b: a + 1, mx: a * 10000 + 5000, my: 0, da: 5000, db: 5000, n: 0, g: 0 })) },
};
const B = { ag: agHazirla(S.ag!), sehirKonumlari: S.sehirler.map((s) => ({ x: s.x!, y: s.y! })) };
const A = 0, Bd = 1, C = 2;
const yeni = () => baslangicDurumu(S, { tohum: 7 });

describe("AI diplomatik teklifleri (TASK-0020 1/3)", () => {
  it("komşu ve ilişkisi iyi olan AI, zamanla oyuncuya teklif gönderir; uzak devlet göndermez", () => {
    const d = yeni();
    etkiEkle(d, A, Bd, "hediye", 50); // B'nin A'ya bakışı yüksek (ittifak eşiğinin üstü)
    etkiEkle(d, A, C, "hediye", 50); // C de yüksek ilişkili ama komşu değil
    for (let g = 0; g < 400 && !d.diplomatikTeklifler.length; g++) {
      d.gun = g;
      diplomatikTeklifKarari(d, diplomasiOnHesap(d, B.ag), Bd);
      diplomatikTeklifKarari(d, diplomasiOnHesap(d, B.ag), C);
    }
    expect(d.diplomatikTeklifler).toHaveLength(1);
    expect(d.diplomatikTeklifler[0].devlet).toBe(Bd); // yalnızca komşu B teklif gönderebildi
    expect(d.diplomatikTeklifler[0].tur).toBe("ittifak"); // ilişki ittifak eşiğinin üstünde
    expect(degismezler(d)).toEqual([]);
  });

  it("savaştaki devlet teklif göndermez", () => {
    const d = yeni();
    etkiEkle(d, A, Bd, "hediye", 50);
    d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: A, savunan: Bd, baslangic: d.gun });
    for (let g = 0; g < 400; g++) { d.gun = g; diplomatikTeklifKarari(d, diplomasiOnHesap(d, B.ag), Bd); }
    expect(d.diplomatikTeklifler).toHaveLength(0);
  });

  it("süresi dolan teklif günlükte bildirilip düşer", () => {
    const d = yeni();
    d.diplomatikTeklifler.push({ id: d.sonrakiDiplomatikTeklifId++, devlet: Bd, tur: "ticaret", ay: null, gun: d.gun, gerekce: "test" });
    d.gun += DENGE.BARIS_TEKLIF_GUN;
    diplomatikTeklifSureleri(d);
    expect(d.diplomatikTeklifler).toHaveLength(0);
    expect(d.gunluk.at(-1)?.tur).toBe("diplomatik-teklif");
  });

  it("oyuncu kabul ederse ilgili ilişki kurulur; reddederse kurulmaz", () => {
    const kabulEt = (tur: "ittifak" | "ticaret" | "saldirmazlik", ay: number | null) => {
      const d = yeni();
      d.diplomatikTeklifler.push({ id: d.sonrakiDiplomatikTeklifId++, devlet: Bd, tur, ay, gun: d.gun, gerekce: "test" });
      const e = { tur: "diplomatikTeklifCevap" as const, teklif: 1, kabul: true };
      expect(emirDogrula(d, e, B, true).gecerli).toBe(true);
      emirUygula(d, e, B);
      expect(d.diplomatikTeklifler).toHaveLength(0);
      return d;
    };
    expect(muttefik(kabulEt("ittifak", null), A, Bd)).toBe(true);
    expect(ticaretAnlasmasiVar(kabulEt("ticaret", null), A, Bd)).toBe(true);
    expect(saldirmazlikVar(kabulEt("saldirmazlik", 12), A, Bd)).toBe(true);

    const d = yeni();
    d.diplomatikTeklifler.push({ id: d.sonrakiDiplomatikTeklifId++, devlet: Bd, tur: "ittifak", ay: null, gun: d.gun, gerekce: "test" });
    emirVer(d, { tur: "diplomatikTeklifCevap", teklif: 1, kabul: false }, B);
    expect(d.emirKuyrugu).toHaveLength(1);
    emirUygula(d, d.emirKuyrugu[0], B);
    expect(muttefik(d, A, Bd)).toBe(false);
    expect(d.diplomatikTeklifler).toHaveLength(0);
    expect(degismezler(d)).toEqual([]);
  });
});
