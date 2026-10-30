import { describe, expect, it } from "vitest";
import { baslangicDurumu, butceOzeti, emirVer, riskBilesenleri, turuIlerlet, VERGI_ADLARI, type Baglam } from "../src";
import { TEST_SENARYOSU } from "./yardimci";

const B: Baglam = { ag: null };
const yeni = () => baslangicDurumu(TEST_SENARYOSU, { tohum: 1453 });

describe("TASK-0017 — vergi oranı", () => {
  it("varsayılan orta; bütçe özetinde görünür", () => {
    const d = yeni();
    expect(d.devletler[0].vergiOrani).toBe("orta");
    expect(butceOzeti(d, 0).vergiOrani).toBe("orta");
  });

  it("yüksek vergi geliri artırır, düşük vergi azaltır; aynı orana tekrar geçiş reddedilir", () => {
    const d = yeni();
    const orta = butceOzeti(d, 0).aylikGelir;
    expect(emirVer(d, { tur: "vergiAyarla", oran: "yuksek" }, B).gecerli).toBe(true);
    expect(emirVer(d, { tur: "vergiAyarla", oran: "yuksek" }, B).gecerli).toBe(false);
    turuIlerlet(d);
    expect(d.devletler[0].vergiOrani).toBe("yuksek");
    expect(butceOzeti(d, 0).aylikGelir).toBeGreaterThan(orta);

    expect(emirVer(d, { tur: "vergiAyarla", oran: "dusuk" }, B).gecerli).toBe(true);
    turuIlerlet(d);
    expect(d.devletler[0].vergiOrani).toBe("dusuk");
    expect(butceOzeti(d, 0).aylikGelir).toBeLessThan(orta);
  });

  it("geçersiz oran reddedilir", () => {
    const d = yeni();
    expect(emirVer(d, { tur: "vergiAyarla", oran: "cok-yuksek" as never }, B).gecerli).toBe(false);
  });

  it("yüksek vergi istikrar riskine bileşen ekler; düşük vergi küçük bir indirim verir", () => {
    const d = yeni();
    const b: Baglam = { ag: null };
    const taban = riskBilesenleri(d, 0, b).find((x) => x.id === "vergi")!.puan;
    expect(taban).toBe(0);
    d.devletler[d.sehirler[0].devlet].vergiOrani = "yuksek";
    expect(riskBilesenleri(d, 0, b).find((x) => x.id === "vergi")!.puan).toBeGreaterThan(0);
    d.devletler[d.sehirler[0].devlet].vergiOrani = "dusuk";
    expect(riskBilesenleri(d, 0, b).find((x) => x.id === "vergi")!.puan).toBeLessThan(0);
  });

  it("vergi adları Türkçe", () => {
    expect(VERGI_ADLARI).toMatchObject({ dusuk: "Düşük", orta: "Orta", yuksek: "Yüksek" });
  });

  it("hazine geçmişi tur ilerleyince birikir, en çok 12 ay tutar", () => {
    const d = yeni();
    expect(d.devletler[0].hazineGecmisi).toEqual([]);
    for (let i = 0; i < 15; i++) turuIlerlet(d);
    const b = butceOzeti(d, 0);
    expect(b.hazineGecmisi.length).toBeLessThanOrEqual(12);
    expect(b.hazineGecmisi.length).toBeGreaterThan(0);
  });
});
