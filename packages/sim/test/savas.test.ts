// TASK-0007 / 4a: savaş ilanı, görünürlük, muharebe, moral, geri çekilme — gerçek 1453 senaryosuyla
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  agHazirla, baslangicDurumu, degismezler, durumOzeti, emirleriUygula, emirVer, gunIlerlet, gorunurYabanciOrdular, kaydet, muharebeGunu,
  turSuresiAyarla, turuIlerlet, yukle, type Baglam, type DunyaDurumu, type SenaryoVerisi, type Tutum,
} from "../src";
import { askerAyarla } from "./yardimci";

const senaryo: SenaryoVerisi = JSON.parse(
  readFileSync(join(import.meta.dirname, "..", "..", "..", "veri", "senaryo-1453", "senaryo.json"), "utf8"));
const ag = agHazirla(senaryo.ag!);
const B: Baglam = { ag };
const yeni = (tohum = 1453) => baslangicDurumu(senaryo, { tohum });
const devlet = (d: DunyaDurumu, id: string) => d.devletler.findIndex((v) => v.id === id);
const ordu = (d: DunyaDurumu, ad: string) => d.ordular.find((o) => o.ad === ad)!;
const sehirHedefi = (ad: string) => {
  const s = senaryo.sehirler.find((c) => c.ad === ad)!;
  return { x: s.x!, y: s.y!, dugum: s.dugum! };
};

/** Osmanlı Karaman'a savaş ilan eder, Anadolu Ordusu Larende'ye yürür; muharebe bitene kadar oynanır. */
function karamanSeferi(tohum = 1453, karamanTutumu: Tutum = "dengeli") {
  const d = yeni(tohum);
  const osm = devlet(d, "osm"), kar = devlet(d, "kar");
  const karamanOrdusu = d.ordular.find((o) => o.devlet === kar)!;
  karamanOrdusu.tutum = karamanTutumu;
  expect(emirVer(d, { tur: "savasIlan", devlet: osm, hedef: kar }, B).gecerli).toBe(true);
  turSuresiAyarla(d, "hafta");
  const kesintiler: string[] = [];
  const ilk = turuIlerlet(d, B); // savaş ilanı tur başında uygulanır; Karaman (AI) da hemen sefere çıkabilir (6c)
  if (ilk.kesinti) kesintiler.push(ilk.kesinti.neden);
  const anadolu = ordu(d, "Anadolu Ordusu");
  if (anadolu.muharebe === null && !anadolu.cekiliyor) {
    expect(emirVer(d, { tur: "orduHedef", ordu: anadolu.id, ...sehirHedefi("Larende") }, B).gecerli).toBe(true);
  }
  // AI devletleri kendi aralarında da savaşır (6c); yalnızca Osmanlı–Karaman muharebesi izlenir
  const bizim = () => d.muharebeRaporlari.filter((r) => r.taraflar.some((t) => t.devlet === osm));
  for (let i = 0; i < 40 && !bizim().length; i++) {
    const s = turuIlerlet(d, B);
    if (s.kesinti) kesintiler.push(s.kesinti.neden);
    expect(degismezler(d)).toEqual([]);
  }
  return { d, osm, kar, kesintiler, rapor: () => bizim()[0] };
}

describe("savaş ilanı ve erişim", () => {
  it("savaş ilan edilmeden düşman toprağına girilemez; ilandan sonra girilebilir", () => {
    const d = yeni();
    const osm = devlet(d, "osm"), kar = devlet(d, "kar");
    const anadolu = ordu(d, "Anadolu Ordusu");
    expect(emirVer(d, { tur: "orduHedef", ordu: anadolu.id, ...sehirHedefi("Konya") }, B).gecerli).toBe(false);
    emirVer(d, { tur: "savasIlan", devlet: osm, hedef: kar }, B);
    // Aynı turda verilen yürüyüş emri, bekleyen savaş ilanıyla birlikte geçerlidir
    expect(emirVer(d, { tur: "orduHedef", ordu: anadolu.id, ...sehirHedefi("Konya") }, B).gecerli).toBe(true);
    expect(emirVer(d, { tur: "savasIlan", devlet: osm, hedef: kar }, B).gecerli).toBe(false); // çift ilan
    turSuresiAyarla(d, "hafta"); // ordu bir haftada varamaz; rota dolu kalmalı
    turuIlerlet(d, B);
    expect(d.savaslar.filter((s) => s.saldiran === osm || s.savunan === osm)).toHaveLength(1); // AI'lar kendi aralarında da savaşabilir (6c)
    expect(d.gunluk.some((o) => o.tur === "savas-ilani")).toBe(true);
    expect(d.gunluk.some((o) => o.tur === "emir-reddedildi")).toBe(false);
    expect(anadolu.rota.length).toBeGreaterThan(0); // yürüyüş ilanla aynı turda başladı
  });
});

describe("muharebe (AT-008)", () => {
  it("karşılaşmada tur durur; muharebe otomatik çözülür ve ayrıntılı rapor üretilir", () => {
    const { d, osm, kar, kesintiler, rapor } = karamanSeferi();
    expect(kesintiler.some((k) => k.startsWith("Muharebe başladı"))).toBe(true);
    const r = rapor();
    expect(r).toBeDefined();
    expect(r.taraflar.map((t) => t.devlet).sort()).toEqual([osm, kar].sort());
    for (const t of r.taraflar) {
      expect(t.kayip).toBeGreaterThan(0);
      expect(t.baslangicAsker).toBeGreaterThan(0);
      expect(t.moralSon).toBeLessThanOrEqual(1000);
    }
    expect(r.nedenler.length).toBeGreaterThan(0);
    expect(r.bitis).toBeGreaterThanOrEqual(r.baslangic);
    const kaybeden = r.taraflar.find((t) => t.devlet !== r.kazanan)!;
    expect(["geri-cekildi", "dagildi"]).toContain(kaybeden.sonuc);
    // Raporlanan muharebe bitti; AI bu arada yeni ordularla başka bir muharebe başlatmış olabilir
    expect(d.muharebeler.some((m) => m.dugum === r.dugum && m.baslangic === r.baslangic)).toBe(false);
  });

  it("geri çekilen ordu kendi şehrine yürür ve çekilmeyi tamamlar", () => {
    const { d, rapor } = karamanSeferi();
    const r = rapor();
    const kaybeden = r.taraflar.find((t) => t.devlet !== r.kazanan)!;
    if (kaybeden.sonuc !== "geri-cekildi") return; // dağıldıysa çekilme yok
    const cekilen = d.ordular.filter((o) => o.devlet === kaybeden.devlet && o.cekiliyor);
    expect(cekilen.length).toBeGreaterThan(0);
    expect(cekilen.every((o) => o.rota.length > 0)).toBe(true);
    // Yalnızca çekilen ordular izlenir: dünyanın başka yerindeki savaşlarda da ordular çekilebilir ve çekilmesini
    // bitiren AI ordusu yeniden yola çıkabilir (6b/6c); çekilmenin bittiği durumdan okunur
    const ids = new Set(cekilen.map((o) => o.id));
    for (let i = 0; i < 20 && d.ordular.some((o) => ids.has(o.id) && o.cekiliyor); i++) turuIlerlet(d, B);
    expect(d.ordular.filter((o) => ids.has(o.id)).every((o) => !o.cekiliyor)).toBe(true);
  });

  it("savunan zorlu arazide daha az kayıp verir; kayıplar sayıyla orantılıdır", () => {
    const ova = muharebeGunu([10000, 10000], [1000, 1000], 100, 1, [100, 100]);
    const dag = muharebeGunu([10000, 10000], [1000, 1000], 220, 1, [100, 100]);
    expect(dag.kayip[0]).toBeGreaterThan(ova.kayip[0]); // saldıran dağda daha çok kaybeder
    expect(dag.kayip[1]).toBe(ova.kayip[1]);
    const kalabalik = muharebeGunu([20000, 10000], [1000, 1000], 100, -1, [100, 100]);
    expect(kalabalik.kayip[1]).toBe(2 * kalabalik.kayip[0]);
  });

  it("TASK-0019 (2/4): birim çarpanı saldıran/savunanın gücünü ve dolayısıyla karşı tarafın kaybını değiştirir", () => {
    const esit = muharebeGunu([10000, 10000], [1000, 1000], 100, -1, [100, 100]); // 2. taraf savunan değil
    const guclu0 = muharebeGunu([10000, 10000], [1000, 1000], 100, -1, [100, 100], [100, 100], [140, 100]); // süvari gibi
    expect(guclu0.guc[0]).toBeGreaterThan(esit.guc[0]); expect(guclu0.guc[1]).toBe(esit.guc[1]);
    expect(guclu0.kayip[1]).toBeGreaterThan(esit.kayip[1]); // 0'ın gücü arttıkça 1'in kaybı artar
    expect(guclu0.kayip[0]).toBe(esit.kayip[0]);
    const zayif0 = muharebeGunu([10000, 10000], [1000, 1000], 100, -1, [100, 100], [100, 100], [70, 100]); // süvariye karşı savunan okçu gibi
    expect(zayif0.guc[0]).toBeLessThan(esit.guc[0]);
    expect(zayif0.kayip[1]).toBeLessThan(esit.kayip[1]);
    // birimYuzde verilmezse eski davranışla birebir aynı (geriye dönük uyum)
    expect(muharebeGunu([10000, 10000], [1000, 1000], 100, -1, [100, 100])).toEqual(esit);
  });

  it("tutum: inatçı ordu temkinli olandan daha uzun dayanır (DEC-0008)", () => {
    const sure = (t: Tutum) => { const r = karamanSeferi(1453, t).rapor(); return r.bitis - r.baslangic; };
    expect(sure("inatci")).toBeGreaterThanOrEqual(sure("temkinli"));
  });

  it("muharebeli sefer deterministiktir; muharebe ortasında kayıt/yükleme sonucu değiştirmez", () => {
    expect(durumOzeti(karamanSeferi(7).d)).toBe(durumOzeti(karamanSeferi(7).d));
    // Muharebe başladığı anda kaydet (gün gün ilerleyerek: AI ordusu artık kendisi de hareket eder, 6c)
    const d = yeni(11), osm = devlet(d, "osm");
    askerAyarla(d.ordular.find((o) => o.devlet === devlet(d, "kar"))!, 10000); // tek günde dağılmasın (garnizon tabanı 0, DEC-0040)
    emirVer(d, { tur: "savasIlan", devlet: osm, hedef: devlet(d, "kar") }, B);
    emirleriUygula(d, B);
    emirVer(d, { tur: "orduHedef", ordu: ordu(d, "Anadolu Ordusu").id, ...sehirHedefi("Larende") }, B);
    emirleriUygula(d, B);
    const bizim = () => d.muharebeler.filter((m) => m.taraflar.some((t) => t.devlet === osm));
    for (let i = 0; i < 280 && !bizim().length; i++) gunIlerlet(d, B);
    expect(bizim()).toHaveLength(1);
    d.aktifKesinti = null;
    turSuresiAyarla(d, "hafta");
    const e = yukle(kaydet(d), d.senaryo);
    for (let i = 0; i < 3; i++) { turuIlerlet(d, B); turuIlerlet(e, B); }
    expect(durumOzeti(e)).toBe(durumOzeti(d));
  });
});

describe("görünürlük (AT-013)", () => {
  it("uzaktaki ordular görünmez; görülenlerin kesin asker sayısı gönderilmez", () => {
    const d = yeni();
    const osm = devlet(d, "osm");
    const gorunen = gorunurYabanciOrdular(d, ag, osm);
    const ad = (id: string) => d.ordular.find((o) => o.devlet === devlet(d, id))?.ad;
    expect(gorunen.map((o) => o.ad)).toContain(ad("biz")); // Konstantiniyye Osmanlı topraklarına komşu
    expect(gorunen.map((o) => o.ad)).not.toContain(ad("min")); // Ming çok uzakta
    expect(gorunen.map((o) => o.ad)).not.toContain(ad("fra"));
    for (const o of gorunen) {
      expect(o).not.toHaveProperty("asker");
      expect(o.yaklasikAsker % 1000).toBe(0);
    }
  });
});
