// TASK-0007 / 4a: savaş ilanı, görünürlük, muharebe, moral, geri çekilme — gerçek 1453 senaryosuyla
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  agHazirla, baslangicDurumu, degismezler, durumOzeti, emirVer, gorunurYabanciOrdular, kaydet, muharebeGunu,
  turSuresiAyarla, turuIlerlet, yukle, type Baglam, type DunyaDurumu, type SenaryoVerisi, type Tutum,
} from "../src";

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
  turuIlerlet(d, B); // savaş ilanı tur başında uygulanır
  const anadolu = ordu(d, "Anadolu Ordusu");
  expect(emirVer(d, { tur: "orduHedef", ordu: anadolu.id, ...sehirHedefi("Larende") }, B).gecerli).toBe(true);
  const kesintiler: string[] = [];
  for (let i = 0; i < 40 && !d.muharebeRaporlari.length; i++) {
    const s = turuIlerlet(d, B);
    if (s.kesinti) kesintiler.push(s.kesinti.neden);
    expect(degismezler(d)).toEqual([]);
  }
  return { d, osm, kar, kesintiler };
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
    turuIlerlet(d, B);
    expect(d.savaslar).toHaveLength(1);
    expect(d.gunluk.some((o) => o.tur === "savas-ilani")).toBe(true);
    expect(d.gunluk.some((o) => o.tur === "emir-reddedildi")).toBe(false);
    expect(anadolu.rota.length).toBeGreaterThan(0); // yürüyüş ilanla aynı turda başladı
  });
});

describe("muharebe (AT-008)", () => {
  it("karşılaşmada tur durur; muharebe otomatik çözülür ve ayrıntılı rapor üretilir", () => {
    const { d, osm, kar, kesintiler } = karamanSeferi();
    expect(kesintiler.some((k) => k.startsWith("Muharebe başladı"))).toBe(true);
    expect(d.muharebeRaporlari).toHaveLength(1);
    const r = d.muharebeRaporlari[0];
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
    expect(d.muharebeler).toHaveLength(0);
    expect(d.ordular.every((o) => o.muharebe === null)).toBe(true);
  });

  it("geri çekilen ordu kendi şehrine yürür ve çekilmeyi tamamlar", () => {
    const { d } = karamanSeferi();
    const r = d.muharebeRaporlari[0];
    const kaybeden = r.taraflar.find((t) => t.devlet !== r.kazanan)!;
    if (kaybeden.sonuc !== "geri-cekildi") return; // dağıldıysa çekilme yok
    const cekilen = d.ordular.filter((o) => o.devlet === kaybeden.devlet && o.cekiliyor);
    expect(cekilen.length).toBeGreaterThan(0);
    expect(cekilen.every((o) => o.rota.length > 0)).toBe(true);
    for (let i = 0; i < 20 && d.ordular.some((o) => o.cekiliyor); i++) turuIlerlet(d, B);
    // Çekilen AI ordusunun olayı oyuncu günlüğüne yazılmaz (6b); çekilmenin bittiği durumdan okunur
    expect(d.ordular.filter((o) => o.devlet === kaybeden.devlet).every((o) => !o.cekiliyor && o.rota.length === 0)).toBe(true);
  });

  it("savunan zorlu arazide daha az kayıp verir; kayıplar sayıyla orantılıdır", () => {
    const ova = muharebeGunu([10000, 10000], [1000, 1000], 100, 1, [100, 100]);
    const dag = muharebeGunu([10000, 10000], [1000, 1000], 220, 1, [100, 100]);
    expect(dag.kayip[0]).toBeGreaterThan(ova.kayip[0]); // saldıran dağda daha çok kaybeder
    expect(dag.kayip[1]).toBe(ova.kayip[1]);
    const kalabalik = muharebeGunu([20000, 10000], [1000, 1000], 100, -1, [100, 100]);
    expect(kalabalik.kayip[1]).toBe(2 * kalabalik.kayip[0]);
  });

  it("tutum: inatçı ordu temkinli olandan daha uzun dayanır (DEC-0008)", () => {
    const sure = (t: Tutum) => { const r = karamanSeferi(1453, t).d.muharebeRaporlari[0]; return r.bitis - r.baslangic; };
    expect(sure("inatci")).toBeGreaterThanOrEqual(sure("temkinli"));
  });

  it("muharebeli sefer deterministiktir; muharebe ortasında kayıt/yükleme sonucu değiştirmez", () => {
    expect(durumOzeti(karamanSeferi(7).d)).toBe(durumOzeti(karamanSeferi(7).d));
    // Muharebe başladığı anda kaydet
    const d = yeni(11);
    emirVer(d, { tur: "savasIlan", devlet: devlet(d, "osm"), hedef: devlet(d, "kar") }, B);
    turSuresiAyarla(d, "hafta");
    turuIlerlet(d, B);
    emirVer(d, { tur: "orduHedef", ordu: ordu(d, "Anadolu Ordusu").id, ...sehirHedefi("Larende") }, B);
    for (let i = 0; i < 40 && !d.muharebeler.length; i++) turuIlerlet(d, B);
    expect(d.muharebeler).toHaveLength(1);
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
