// TASK-0010/7a: hükümdar ve veraset (DEC-0043)
import { describe, expect, it } from "vitest";
import {
  baslangicDurumu, butceOzeti, degismezler, DENGE, diplomasiOnHesap, durumOzeti, emirleriUygula, emirVer, gundenTarih, gunIlerlet,
  hukumdarlariIlerlet, iliskiBilesenleri, kaydet, muharebeGucYuzde, yukle, type DunyaDurumu, type SenaryoVerisi,
} from "../src";
import { TEST_SENARYOSU } from "./yardimci";

const A = 0, B = 1;
const S: SenaryoVerisi = {
  ...TEST_SENARYOSU,
  hukumdarlar: {
    hukumdarlar: [
      { devlet: "a", ad: "Tarihî A", hanedan: "A-oğulları", dogum: 1400, yetenek: [3, 3, 3], halef: { ad: "Halef A", dogum: 1430, yetenek: [5, 4, 3] } },
      { devlet: "b", ad: "Tarihî B", hanedan: "B-oğulları", dogum: 1363, yetenek: [6, 6, 6], halef: { ad: "Halef B", dogum: 1425, yetenek: [4, 4, 4] } },
    ],
    veraset: { acik: ["b"], secimli: [] },
    adHavuzu: { turk: ["b"] },
  },
};
const yeni = () => baslangicDurumu(S, { tohum: 5 });
/** Ölene kadar ay başlarında ölüm denetimi (yaşlı hükümdarda kısa sürer). */
function oldur(d: DunyaDurumu, devlet: number) {
  const ad = d.devletler[devlet].hukumdar!.ad;
  d.devletler[devlet].hukumdar!.dogum = gundenTarih(d.gun).yil - 95; // %30/yıl
  for (let i = 0; i < 5000 && d.devletler[devlet].hukumdar?.ad === ad; i++) { gunIlerlet(d); d.aktifKesinti = d.devletler[devlet].hukumdar ? null : d.aktifKesinti; }
}

describe("hükümdar ve veraset (7a)", () => {
  it("tablodaki hükümdar ve gelenek yüklenir; tabloda olmayan devlete nötr kurgusal hükümdar verilir", () => {
    const d = yeni();
    expect(d.devletler[A].hukumdar).toMatchObject({ ad: "Tarihî A", hanedan: "A-oğulları", kurgusal: false });
    expect(d.devletler[B].veraset).toBe("acik");
    expect(d.devletler[2].hukumdar).toMatchObject({ kurgusal: true, yonetim: 3, askerlik: 3, diplomasi: 3 });
    expect(d.devletler[2].veraset).toBe("babadan");
    expect(degismezler(d)).toEqual([]);
  });

  it("yetenek etkileri: yönetim geliri, askerlik muharebe gücünü, diplomasi başkalarının bakışını değiştirir", () => {
    const d = yeni();
    const once = butceOzeti(d, A).aylikAraziGeliri;
    d.devletler[A].hukumdar!.yonetim = 6;
    expect(butceOzeti(d, A).aylikAraziGeliri).toBe(Math.floor((once * (100 + 3 * DENGE.HUK_GELIR_YUZDE)) / 100));
    expect(muharebeGucYuzde(d, B)).toBe(100 + 3 * DENGE.HUK_GUC_YUZDE); // B: askerlik 6
    expect(iliskiBilesenleri(d, diplomasiOnHesap(d, null), A, B)).toContainEqual({ ad: "Hükümdarının diplomasisi", deger: 3 * DENGE.HUK_DIPLOMASI_PUAN });
  });

  it("AI hükümdarı ölünce tarihî halef tahta çıkar; sonraki soy kurgusaldır", () => {
    const d = yeni();
    oldur(d, B);
    expect(d.devletler[B].hukumdar).toMatchObject({ ad: "Halef B", kurgusal: false, mesruiyet: DENGE.MESRUIYET_TARIHI_HALEF, hanedan: "B-oğulları" });
    expect(d.devletler[B].tarihiHalef).toBeNull();
    oldur(d, B);
    expect(d.devletler[B].hukumdar).toMatchObject({ kurgusal: true, hanedan: "B-oğulları" });
    expect(degismezler(d)).toEqual([]);
  });

  it("tarihî halef henüz doğmamışsa alternatif soy başlar (kurgusal halef)", () => {
    const d = yeni();
    d.devletler[B].tarihiHalef!.dogum = 1500;
    oldur(d, B);
    expect(d.devletler[B].hukumdar!.kurgusal).toBe(true);
    expect(d.devletler[B].tarihiHalef).toBeNull();
  });

  it("oyuncunun hükümdarı ölünce tur durur; oyuncu adayı seçer, seçmezse divan en uygununu çıkarır", () => {
    const d = yeni();
    oldur(d, A);
    expect(d.devletler[A].hukumdar).toBeNull();
    expect(d.verasetSecimi?.adaylar[0]).toMatchObject({ ad: "Halef A", tarihi: true, gelenek: true });
    expect(d.aktifKesinti?.neden).toMatch(/Halefi seçmeniz gerekiyor/);
    expect(degismezler(d)).toEqual([]);
    const gelenekDisi = d.verasetSecimi!.adaylar.findIndex((x) => !x.gelenek);
    expect(gelenekDisi).toBeGreaterThan(0); // babadan veraset: küçük kardeş geleneğe aykırı
    const e = yukle(kaydet(d), d.senaryo);
    expect(emirVer(d, { tur: "halefSec", aday: gelenekDisi }).gecerli).toBe(true);
    emirleriUygula(d);
    expect(d.devletler[A].hukumdar).toMatchObject({ mesruiyet: DENGE.MESRUIYET_GELENEK_DISI, kurgusal: true });
    expect(d.gunluk.at(-1)!.metin).toMatch(/Tarihî sıradan ayrıldı; yeni soy çizgisi başladı/);
    emirleriUygula(e); // seçim yok → divan
    expect(e.devletler[A].hukumdar!.ad).toBe("Halef A");
    expect(e.gunluk.at(-1)!.metin).toMatch(/divan en uygun adayı seçti/);
  });

  it("ölüm ve aday üretimi rastgele sayı akışını tüketmez; kayıt/yükleme sonucu değiştirmez", () => {
    const d = yeni();
    const rng = d.rng;
    for (let i = 0; i < 24; i++) hukumdarlariIlerlet(d);
    expect(d.rng).toBe(rng);
    const e = yukle(kaydet(d), d.senaryo);
    for (let i = 0; i < 400; i++) { gunIlerlet(d); gunIlerlet(e); }
    expect(durumOzeti(e)).toBe(durumOzeti(d));
  });
});
