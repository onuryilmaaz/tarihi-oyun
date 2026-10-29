// TASK-0012/9d: agent tahmini veri tablolarının "[TASLAK]" işareti ve OHM kayıtlarının lisansı
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const kok = join(import.meta.dirname, "..", "..", "..");
const oku = (yol: string) => JSON.parse(readFileSync(join(kok, yol), "utf8"));

describe("veri kaynakları ve lisanslar (9d)", () => {
  it("bütün agent tahmini tablolar açıklamasında [TASLAK] işareti taşır", () => {
    for (const f of ["iliskiler", "hukumdarlar", "nufus", "sehir-nufus", "deniz"]) {
      expect(oku(`veri/senaryo-1453/${f}.json`).aciklama, f).toMatch(/\[TASLAK\]/);
    }
  });
  it("OpenHistoricalMap kayıtlarının hepsi CC0", () => {
    const ham = oku("prototypes/harita-gorsel-02/scripts/ohm-kayitlari.json");
    const k = (Array.isArray(ham) ? ham : ham.kayitlar ?? Object.values(ham)) as { lisans: string }[];
    expect(k.length).toBeGreaterThan(0);
    expect(k.every((x) => /CC0/.test(x.lisans))).toBe(true);
  });
  it("KAYNAKLAR.md her veri dosyasını anar", () => {
    const md = readFileSync(join(kok, "veri/senaryo-1453/KAYNAKLAR.md"), "utf8");
    for (const f of ["iliskiler.json", "hukumdarlar.json", "nufus.json", "sehir-nufus.json", "deniz.json", "wikidata.json", "harita.json"]) expect(md).toContain(f);
  });
});
