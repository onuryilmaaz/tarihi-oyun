// TASK-0006: ordu hareketi ve toprak kontrolü — gerçek 1453 senaryosu ve hareket ağıyla
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  agHazirla, baslangicDurumu, degismezler, durumOzeti, emirVer, gunIlerlet, kalanYol, kaydet, rotaBul,
  turSuresiAyarla, turuIlerlet, yukle, type Baglam, type DunyaDurumu, type SenaryoVerisi,
} from "../src";
import { dunyaOzeti } from "./yardimci";

const senaryo: SenaryoVerisi = JSON.parse(
  readFileSync(join(import.meta.dirname, "..", "..", "..", "veri", "senaryo-1453", "senaryo.json"), "utf8"));
const ag = agHazirla(senaryo.ag!);
const B: Baglam = { ag };
const yeni = () => baslangicDurumu(senaryo, { tohum: 1453 });

const sehir = (d: DunyaDurumu, ad: string) => d.sehirler.findIndex((s) => s.ad === ad);
/** Şehrin bulunduğu birimin ilk düğüm merkezi: hedef olarak kullanılır */
function hedef(d: DunyaDurumu, ad: string) {
  const b = d.sehirler[sehir(d, ad)].birim;
  const dugum = ag.dugumler.findIndex((n) => n.b === b);
  return { x: ag.dugumler[dugum].x, y: ag.dugumler[dugum].y, dugum };
}
const ordu = (d: DunyaDurumu, ad: string) => d.ordular.find((o) => o.ad === ad)!;

describe("ordu hareketi", () => {
  it("başlangıçta Osmanlı'nın iki test ordusu var", () => {
    const d = yeni();
    expect(d.ordular.filter((o) => d.devletler[o.devlet].id === "osm").map((o) => o.ad)).toEqual(["Rumeli Ordusu", "Anadolu Ordusu"]);
    expect(degismezler(d)).toEqual([]);
  });

  it("AT-006: Bursa–İznik ile Bursa–Viyana aynı sürede tamamlanmaz", () => {
    const d = yeni();
    const anadolu = ordu(d, "Anadolu Ordusu");
    const iznik = rotaBul(d, ag, anadolu, hedef(d, "İznik"));
    // Viyana Osmanlı'ya ait değil; erişim kuralını bu karşılaştırma için kaldırmak üzere tüm topraklar Osmanlı'ya verilir
    const herYer: DunyaDurumu = structuredClone(d);
    for (const b of herYer.birimler) if (b.sahip >= 0) b.sahip = anadolu.devlet;
    const viyana = rotaBul(herYer, ag, anadolu, hedef(herYer, "Viyana"));
    expect(iznik.gecerli && viyana.gecerli).toBe(true);
    if (!iznik.gecerli || !viyana.gecerli) return;
    expect(iznik.gun).toBeLessThan(10);
    expect(viyana.gun).toBeGreaterThan(iznik.gun * 5);
    expect(viyana.kirilim.bogaz).toBeGreaterThanOrEqual(1); // Anadolu'dan Rumeli'ye boğaz geçidi
  });

  it("Edirne–Bursa rotası boğaz geçidini kullanır; arazi ve geçişler gerekçede görünür", () => {
    const d = yeni();
    const r = rotaBul(d, ag, ordu(d, "Rumeli Ordusu"), hedef(d, "Bursa"));
    expect(r.gecerli).toBe(true);
    if (!r.gecerli) return;
    expect(r.kirilim.bogaz).toBe(1);
    expect(r.kirilim.mesafeM).toBeGreaterThan(150000);
    expect(r.toplam).toBeGreaterThan(r.kirilim.mesafeM); // arazi zorluğu ve boğaz cezası eklenir
  });

  it("yabancı toprak ve ulaşılamayan hedef gerekçesiyle reddedilir (DEC-0025/3)", () => {
    const d = yeni();
    const rumeli = ordu(d, "Rumeli Ordusu");
    const buda = emirVer(d, { tur: "orduHedef", ordu: rumeli.id, ...hedef(d, "Buda") }, B);
    expect(buda.gecerli).toBe(false);
    if (!buda.gecerli) expect(buda.neden).toMatch(/Macaristan Krallığı toprağına girmek için savaş ilan etmek gerekir/);
    // Devletsiz ama kara yolu olmayan hedef: Avustralya (deniz taşıması Aşama 8)
    const avustralya = ag.dugumler.findIndex((n) => d.birimler[n.b].sahip === -1 && n.x > 1300000 && n.y < -200000);
    expect(avustralya).toBeGreaterThanOrEqual(0);
    const n = ag.dugumler[avustralya];
    const s = emirVer(d, { tur: "orduHedef", ordu: rumeli.id, x: n.x, y: n.y, dugum: avustralya }, B);
    expect(s.gecerli).toBe(false);
    if (!s.gecerli) expect(s.neden).toMatch(/Ulaşılamıyor/);
  });

  it("AT-004: emir verilince ordu tur ilerlemeden kıpırdamaz", () => {
    const d = yeni();
    const o = ordu(d, "Anadolu Ordusu");
    const once = { x: o.x, y: o.y, rota: o.rota.length };
    expect(emirVer(d, { tur: "orduHedef", ordu: o.id, ...hedef(d, "Sofya") }, B).gecerli).toBe(true);
    expect({ x: o.x, y: o.y, rota: o.rota.length }).toEqual(once);
  });

  it("varış günü tur süresinden bağımsızdır; ordu ışınlanmaz", () => {
    const calistir = (sure: "hafta" | "yil") => {
      const d = yeni();
      const o = ordu(d, "Anadolu Ordusu");
      emirVer(d, { tur: "orduHedef", ordu: o.id, ...hedef(d, "Sofya") }, B);
      turSuresiAyarla(d, sure);
      let varis = -1;
      for (let i = 0; i < 60 && varis < 0; i++) {
        const s = turuIlerlet(d, B);
        const v = s.yeniOlaylar.find((e) => e.tur === "ordu-vardi");
        if (v) varis = v.gun;
      }
      return { d, varis };
    };
    const hafta = calistir("hafta"), yil = calistir("yil");
    expect(hafta.varis).toBeGreaterThan(0);
    expect(yil.varis).toBe(hafta.varis);
    while (hafta.d.gun < yil.d.gun) gunIlerlet(hafta.d);
    expect(dunyaOzeti(hafta.d)).toBe(dunyaOzeti(yil.d));
  });

  it("yürüyüş sırasında kayıt/yükleme yolculuğu korur; durdurulan ordu bulunduğu yerde kalır", () => {
    const d = yeni();
    const o = ordu(d, "Rumeli Ordusu");
    emirVer(d, { tur: "orduHedef", ordu: o.id, ...hedef(d, "Bursa") }, B);
    turSuresiAyarla(d, "hafta");
    turuIlerlet(d, B);
    expect(o.rota.length).toBeGreaterThan(0);
    const kalan = kalanYol(o);
    const e = yukle(kaydet(d), d.senaryo);
    for (let i = 0; i < 3; i++) { turuIlerlet(d, B); turuIlerlet(e, B); }
    expect(durumOzeti(e)).toBe(durumOzeti(d));
    expect(kalanYol(o).m).toBeLessThan(kalan.m);
    emirVer(d, { tur: "orduDur", ordu: o.id }, B);
    turuIlerlet(d, B);
    expect(o.rota).toEqual([]);
    expect(degismezler(d)).toEqual([]);
  });

  it("AT-007: şehrin askerî kontrolü değişince çevresi değişmez; yasal sahip korunur", () => {
    const d = yeni();
    const bursa = sehir(d, "Bursa");
    const karaman = d.devletler.findIndex((v) => v.id === "kar");
    const birimlerOnce = JSON.stringify(d.birimler);
    emirVer(d, { tur: "testIsgal", hedef: "sehir", indeks: bursa, devlet: karaman }, B);
    turuIlerlet(d, B);
    expect(d.sehirler[bursa].kontrol).toBe(karaman);
    expect(d.devletler[d.sehirler[bursa].devlet].id).toBe("osm"); // yasal sahip değişmedi
    expect(d.sehirler[bursa].isgalBaslangic).not.toBeNull();
    expect(JSON.stringify(d.birimler)).toBe(birimlerOnce); // hiçbir arazi birimi etkilenmedi
    emirVer(d, { tur: "testIsgal", hedef: "sehir", indeks: bursa, devlet: d.sehirler[bursa].devlet }, B);
    turuIlerlet(d, B);
    expect(d.sehirler[bursa].kontrol).toBe(d.sehirler[bursa].devlet);
    expect(d.sehirler[bursa].isgalBaslangic).toBeNull();
  });
});
