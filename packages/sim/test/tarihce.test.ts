// TASK-0050: haber merkezi, güç tablosu, sınır geçmişi
import { describe, expect, it } from "vitest";
import { degismezler, durumOzeti, emirleriUygula, emirVer, gundenTarih, kaydet, olayEkle, sinirGoruntusu, tarihceAyi, yukle } from "../src";
import { yeniDurum } from "./yardimci";

describe("haber merkezi ve tarihçe (TASK-0050)", () => {
  it("herkese açık olaylar oyuncuyu ilgilendirmese de habere düşer; özel olaylar düşmez", () => {
    const d = yeniDurum();
    olayEkle(d, { tur: "savas-ilani", devlet: 1, metin: "B, C'ye savaş ilan etti." });
    olayEkle(d, { tur: "ordu-yuruyus", devlet: 1, metin: "B ordusu yürüdü." });
    expect(d.haberler.map((h) => [h.kategori, h.metin])).toEqual([["savas", "B, C'ye savaş ilan etti."]]);
    expect(d.gunluk.some((o) => o.metin.startsWith("B ordusu"))).toBe(false);
  });

  it("ocakta güç tablosu; ocak/temmuzda sınır farkı; görüntü tabandan yeniden kurulur", () => {
    const d = yeniDurum();
    while (gundenTarih(d.gun).ay !== 1) d.gun++;
    tarihceAyi(d);
    expect(d.gucGecmisi).toHaveLength(1);
    expect(d.gucGecmisi[0].satirlar[0].sehir).toBeGreaterThan(0);
    const b2 = d.sehirler.findIndex((s) => s.ad === "B2");
    d.sehirler[b2].devlet = 0; d.birimler[d.sehirler[b2].birim].sahip = 0;
    while (gundenTarih(d.gun).ay !== 7) d.gun++;
    tarihceAyi(d);
    expect(d.sinirGecmisi).toHaveLength(2);
    expect(d.sinirGecmisi[1].sehirler).toEqual([[b2, 0]]);
    expect(sinirGoruntusu(d, 0).sehirler[b2]).toBe(1);
    expect(sinirGoruntusu(d, 1).sehirler[b2]).toBe(0);
    expect(degismezler(d)).toEqual([]);
    const e = yukle(kaydet(d), d.senaryo);
    expect(durumOzeti(e)).toBe(durumOzeti(d));
  });

  it("gerçek savaş ilanı haber merkezine yazılır", () => {
    const d = yeniDurum();
    expect(emirVer(d, { tur: "savasIlan", devlet: 0, hedef: 1 }).gecerli).toBe(true);
    emirleriUygula(d);
    expect(d.haberler.some((h) => h.kategori === "savas")).toBe(true);
  });
});
