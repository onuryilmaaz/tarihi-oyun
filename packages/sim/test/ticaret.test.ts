// TASK-0011/8b: ticaret yolları, abluka, boğaz geçidi, ambargo (DEC-0051, DEC-0052)
import { describe, expect, it } from "vitest";
import {
  baslangicDurumu, butceOzeti, degismezler, DENGE, diplomasiOnHesap, emirleriUygula, emirVer, iliskiBilesenleri, kaydet, SEMA_SURUMU,
  sehirTicareti, ticaretGelirleri, yukle, type DunyaDurumu, type SenaryoVerisi,
} from "../src";

// İki deniz: z0 (A1 limanı) ve z1 (B1 limanı); z1'in ticareti z0'dan geçer
const S: SenaryoVerisi = {
  id: "ticaret-test", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
  devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }],
  birimler: ["a", "b"].map((devlet) => ({ devlet })),
  sehirler: [
    { ad: "A1", devlet: "a", birim: 0, baskent: true, nufus: 40000 },
    { ad: "B1", devlet: "b", birim: 1, baskent: true, nufus: 30000 },
  ],
  deniz: {
    bolgeler: [{ id: "z0", ad: "Batı", lon: 0, lat: 0, komsu: ["z1"] }, { id: "z1", ad: "Doğu", lon: 3, lat: 0, komsu: ["z0"], ticaretGecidi: "z0" }],
    limanlar: { z0: ["A1"], z1: ["B1"] },
    bogazlar: [],
    donanmalar: [{ devlet: "a", bolge: "z0", ad: "A Donanması", kadirga: 10, kalyon: 0 }, { devlet: "b", bolge: "z1", ad: "B Donanması", kadirga: 4, kalyon: 0 }],
  },
};
const A = 0, B = 1, A1 = 0, B1 = 1;
const yeni = () => baslangicDurumu(S, { tohum: 1 });
const savas = (d: DunyaDurumu) => d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: A, savunan: B, baslangic: d.gun });
const fa = (d: DunyaDurumu) => d.donanmalar.find((f) => f.devlet === A)!;
const fb = (d: DunyaDurumu) => d.donanmalar.find((f) => f.devlet === B)!;

describe("ticaret (8b)", () => {
  it("liman şehri nüfusuna göre ticaret geliri verir; bütçe ve aylık gelire girer", () => {
    const d = yeni();
    expect(sehirTicareti(d, A1)).toEqual({ taban: 40, gelir: 40, yuzde: 100, nedenler: [] });
    expect(ticaretGelirleri(d)).toEqual([40, 30]);
    const b = butceOzeti(d, A);
    expect(b.aylikTicaretGeliri).toBe(40);
    expect(b.aylikGelir).toBe(b.aylikAraziGeliri + b.aylikYapiGeliri + 40);
  });

  it("düşman kontrolündeki deniz limanı ablukaya alır; aynı denizde düşman donanması geliri yarıya indirir", () => {
    const d = yeni();
    savas(d);
    fb(d).bolge = 0; fa(d).bolge = 1; // z0 artık B'nin
    expect(sehirTicareti(d, A1)).toMatchObject({ gelir: 0, nedenler: [expect.stringMatching(/Abluka: Batı düşman \(B\)/)] });
    fa(d).bolge = 0; // iki donanma z0'da
    expect(sehirTicareti(d, A1)).toMatchObject({ gelir: 40 * DENGE.TICARET_SAVAS_DENIZI_YUZDE / 100, yuzde: DENGE.TICARET_SAVAS_DENIZI_YUZDE });
  });

  it("ticaret geçidi düşman elindeyse geçen denizin limanları kaybeder", () => {
    const d = yeni();
    savas(d); // A z0'ı, B z1'i tutuyor; B1'in ticareti z0 üzerinden geçer
    expect(sehirTicareti(d, B1)).toMatchObject({ gelir: Math.floor(30 * DENGE.TICARET_GECIT_YUZDE / 100), nedenler: [expect.stringMatching(/geçidi Batı düşman/)] });
    expect(sehirTicareti(d, A1).gelir).toBe(40);
  });

  it("ambargo: hedefin ticareti ve koyanınki düşer, hedefin bakışı bozulur; kaldırılabilir", () => {
    const d = yeni();
    expect(emirVer(d, { tur: "ambargo", hedef: B, acik: false }).gecerli).toBe(false);
    expect(emirVer(d, { tur: "ambargo", hedef: B, acik: true }).gecerli).toBe(true);
    emirleriUygula(d);
    expect(sehirTicareti(d, B1).yuzde).toBe(100 - DENGE.AMBARGO_HEDEF_YUZDE);
    expect(sehirTicareti(d, A1).yuzde).toBe(100 - DENGE.AMBARGO_KOYAN_YUZDE);
    expect(iliskiBilesenleri(d, diplomasiOnHesap(d, null), B, A)).toContainEqual({ ad: "Ambargo uyguluyor", deger: DENGE.AMBARGO_ILISKI });
    emirVer(d, { tur: "ambargo", hedef: B, acik: false });
    emirleriUygula(d);
    expect(d.ambargolar).toEqual([]);
    expect(degismezler(d)).toEqual([]);
  });

  it("şema 15 kaydı dönüştürülür (ambargo yok, geçit etkisiz)", () => {
    const p = JSON.parse(kaydet(yeni()));
    p.sema = 15; p.durum.sema = 15;
    delete p.durum.ambargolar;
    for (const b of p.durum.deniz.bolgeler) delete b.gecit;
    const g = yukle(JSON.stringify(p));
    expect(g.sema).toBe(SEMA_SURUMU);
    expect(g.deniz.bolgeler.every((b) => b.gecit === -1)).toBe(true);
    expect(degismezler(g)).toEqual([]);
  });

  it("TASK-0017: aktif ticaret anlaşması liman gelirine ek yüzde verir", () => {
    const d = yeni();
    d.ticaretAnlasmalari.push({ a: A, b: B, baslangic: d.gun });
    const beklenen = Math.floor((40 * (100 + DENGE.TICARET_ANLASMA_YUZDE)) / 100);
    expect(sehirTicareti(d, A1)).toMatchObject({ taban: 40, gelir: beklenen, yuzde: 100 + DENGE.TICARET_ANLASMA_YUZDE });
    expect(degismezler(d)).toEqual([]);
  });
});
