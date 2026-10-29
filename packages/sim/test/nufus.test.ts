// TASK-0010/7b: nüfus grupları, artış, göç, iskân, din ilişkisi (DEC-0045)
import { describe, expect, it } from "vitest";
import {
  baslangicDurumu, degismezler, DENGE, diplomasiOnHesap, durumOzeti, emirleriUygula, emirVer, gunIlerlet, iliskiBilesenleri,
  iskanBedeli, kaydet, kullanilabilirHazine, nufusArtisi, nufusCikar, paylastir, savasGocu, SEMA_SURUMU, yukle,
  type DunyaDurumu, type SenaryoVerisi,
} from "../src";
import { TEST_SENARYOSU } from "./yardimci";

const A = 0, B = 1, C = 2, A1 = 0, A2 = 1;
const S: SenaryoVerisi = {
  ...TEST_SENARYOSU,
  sehirler: TEST_SENARYOSU.sehirler.map((s, i) => ({ ...s, x: i * 10000, y: 0 })),
  nufus: {
    dinler: {}, dinAileleri: {}, kulturler: {},
    devletler: {
      a: { din: "sunni", kultur: "turk", karisim: [["sunni", "turk", 700], ["ortodoks", "rum", 300]] },
      b: { din: "sunni", kultur: "arap", karisim: [["sunni", "arap", 1000]] },
      c: { din: "katolik", kultur: "italyan", karisim: [["katolik", "italyan", 1000]] },
    },
    sehirler: { A2: [["ortodoks", "rum", 600], ["sunni", "turk", 400]] },
  },
};
const B_ = { ag: null, sehirKonumlari: S.sehirler.map((s) => ({ x: s.x!, y: s.y! })) };
const yeni = () => baslangicDurumu(S, { tohum: 2 });
const toplam = (d: DunyaDurumu) => d.sehirler.reduce((t, s) => t + s.nufus, 0) + d.iskanlar.reduce((t, k) => t + k.gruplar.reduce((u, g) => u + g.nufus, 0), 0);

describe("nüfus grupları (7b)", () => {
  it("başlangıç grupları devlet varsayılanı ve şehir düzeltmesinden gelir; toplam nüfusa eşittir", () => {
    const d = yeni();
    expect(d.sehirler[A1].gruplar).toEqual([{ din: "sunni", kultur: "turk", nufus: 35000 }, { din: "ortodoks", kultur: "rum", nufus: 15000 }]);
    expect(d.sehirler[A2].gruplar[0]).toEqual({ din: "ortodoks", kultur: "rum", nufus: 6000 });
    expect(d.devletler[A]).toMatchObject({ din: "sunni", kultur: "turk" });
    expect(paylastir(10, [1, 1, 1])).toEqual([4, 3, 3]);
    expect(degismezler(d)).toEqual([]);
  });

  it("orantılı çıkarma ve yıllık artış grupları korur; nüfus eksiye düşmez", () => {
    const d = yeni();
    const cikan = nufusCikar(d.sehirler[A1], 1000);
    expect(cikan).toEqual([{ din: "sunni", kultur: "turk", nufus: 700 }, { din: "ortodoks", kultur: "rum", nufus: 300 }]);
    nufusCikar(d.sehirler[A2], 10 ** 9);
    expect(d.sehirler[A2]).toMatchObject({ nufus: 0, gruplar: [] });
    const once = d.sehirler[A1].gruplar.map((g) => g.nufus);
    nufusArtisi(d);
    expect(d.sehirler[A1].gruplar.map((g) => g.nufus)).toEqual(once.map((n) => n + Math.floor((n * DENGE.NUFUS_ARTIS_BINDE) / 1000)));
    expect(degismezler(d)).toEqual([]);
  });

  it("kuşatılan şehir nüfus kaybeder; bir kısmı aynı devletin en yakın güvenli şehrine göçer", () => {
    const d = yeni();
    d.kusatmalar.push({ sehir: A2 } as DunyaDurumu["kusatmalar"][number]);
    const [n2, n1] = [d.sehirler[A2].nufus, d.sehirler[A1].nufus];
    savasGocu(d, B_);
    const kayip = Math.floor((n2 * DENGE.NUFUS_KUSATMA_KAYIP_BINDE) / 1000);
    expect(d.sehirler[A2].nufus).toBe(n2 - kayip);
    expect(d.sehirler[A1].nufus - n1).toBeGreaterThan(0);
    expect(d.sehirler[A1].nufus - n1).toBeLessThanOrEqual(Math.ceil((kayip * DENGE.GOC_PAYI_YUZDE) / 100));
    expect(d.sehirler[A1].gruplar.some((g) => g.din === "ortodoks")).toBe(true);
  });

  it("iskân: bedel ayrılır, nüfus yola çıkar, süre sonunda hedefe yerleşir; toplam korunur", () => {
    const d = yeni();
    d.devletler[A].hazine = 1000;
    expect(emirVer(d, { tur: "iskan", kaynak: A2, hedef: A1, miktar: 3000 }).gecerli).toBe(false); // %20 sınırı (2.000)
    expect(emirVer(d, { tur: "iskan", kaynak: A2, hedef: 2, miktar: 1000 }).gecerli).toBe(false); // yabancı şehir
    expect(emirVer(d, { tur: "iskan", kaynak: A2, hedef: A1, miktar: 2000 }).gecerli).toBe(true);
    expect(kullanilabilirHazine(d, A)).toBe(1000 - iskanBedeli(2000));
    const t = toplam(d);
    emirleriUygula(d);
    expect(d.sehirler[A2].nufus).toBe(8000);
    expect(toplam(d)).toBe(t);
    for (let i = 0; i < DENGE.ISKAN_GUN; i++) gunIlerlet(d);
    expect(d.iskanlar).toHaveLength(0);
    expect(d.sehirler[A1].gruplar.find((g) => g.din === "ortodoks")!.nufus).toBe(15000 + 1200);
    expect(d.gunluk.some((o) => /iskân edildi/.test(o.metin))).toBe(true);
    expect(degismezler(d)).toEqual([]);
  });

  it("din ilişki bileşeni: aynı din +, farklı din ailesi −; veri yoksa etkisiz", () => {
    const d = yeni(), o = diplomasiOnHesap(d, null);
    expect(iliskiBilesenleri(d, o, B, A)).toContainEqual({ ad: "Aynı din", deger: DENGE.DIN_AYNI });
    expect(iliskiBilesenleri(d, o, C, A)).toContainEqual({ ad: "Farklı din", deger: DENGE.DIN_FARKLI_AILE });
    const e = baslangicDurumu(TEST_SENARYOSU, { tohum: 2 });
    expect(iliskiBilesenleri(e, diplomasiOnHesap(e, null), B, A).some((x) => /din/.test(x.ad))).toBe(false);
  });

  it("kayıt/yükleme sonucu değiştirmez; şema 11 kaydı dönüştürülür", () => {
    const d = yeni();
    d.devletler[A].hazine = 1000;
    emirVer(d, { tur: "iskan", kaynak: A2, hedef: A1, miktar: 1000 });
    emirleriUygula(d);
    const e = yukle(kaydet(d), d.senaryo);
    for (let i = 0; i < 400; i++) { gunIlerlet(d); gunIlerlet(e); }
    expect(durumOzeti(e)).toBe(durumOzeti(d));
    const p = JSON.parse(kaydet(yeni()));
    p.sema = 11; p.durum.sema = 11;
    delete p.durum.iskanlar;
    for (const s of p.durum.sehirler) delete s.gruplar;
    for (const v of p.durum.devletler) { delete v.din; delete v.kultur; }
    const g = yukle(JSON.stringify(p));
    expect(g.sema).toBe(SEMA_SURUMU);
    expect(g.sehirler[0].gruplar).toEqual([{ din: "bilinmiyor", kultur: "diger", nufus: 50000 }]);
    expect(degismezler(g)).toEqual([]);
  });
});
