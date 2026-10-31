// Gerçek 1453 senaryo verisiyle entegrasyon testi (veri/senaryo-1453/senaryo.json).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { agHazirla, baslangicDurumu, degismezler, durumOzeti, emirVer, gundenTarih, kaydet, tarihMetni, turSuresiAyarla, turuIlerlet, yukle, type SenaryoVerisi } from "../src";

const senaryo: SenaryoVerisi = JSON.parse(
  readFileSync(join(import.meta.dirname, "..", "..", "..", "veri", "senaryo-1453", "senaryo.json"), "utf8"));
const baglam = { ag: agHazirla(senaryo.ag!), sehirKonumlari: senaryo.sehirler.map((s) => ({ x: s.x!, y: s.y! })) };

describe("1453 senaryosu", () => {
  it("başlangıç durumu geçerli; oyuncu Osmanlı; tarih 1 Nisan 1453", () => {
    const d = baslangicDurumu(senaryo, { tohum: 1453 });
    expect(degismezler(d)).toEqual([]);
    expect(d.devletler[d.ayarlar.oyuncu].id).toBe("osm");
    expect(tarihMetni(d.gun)).toBe("1 Nisan 1453");
    expect(d.devletler[d.ayarlar.oyuncu].baskent).not.toBeNull();
  });

  it("gerçek hareket ağıyla 10 yıl: AI savaşları, değişmezler, determinizm ve kayıt devamı (T-01)", () => {
    // Tamamlanan (kesintisiz) yıl sayısını 10'a tamamlar; AI'dan gelen barış/diplomatik teklif gibi
    // kesintiler oyuncu adına reddedilip devam edilir (TASK-0020 1/3: AI artık ara sıra teklif gönderebilir).
    const oyna = () => {
      const d = baslangicDurumu(senaryo, { tohum: 99 });
      turSuresiAyarla(d, "yil");
      for (let tamamlanan = 0; tamamlanan < 10; ) {
        const r = turuIlerlet(d, baglam);
        expect(degismezler(d)).toEqual([]);
        if (r.kesinti) {
          for (const t of d.barisTeklifleri) emirVer(d, { tur: "barisCevap", teklif: t.id, kabul: false }, baglam);
          for (const t of d.diplomatikTeklifler) emirVer(d, { tur: "diplomatikTeklifCevap", teklif: t.id, kabul: false }, baglam);
        } else {
          tamamlanan++;
        }
      }
      expect(d.savaslar.length + d.barislar.length).toBeGreaterThan(0);
      return d;
    };
    const a = oyna();
    expect(degismezler(a)).toEqual([]);
    // Kesintiler bazı yılların bir kısmını "kaybettirebilir" (oyuncu karar verene dek tur durur); bu yüzden
    // tam 10 yıl tamamlanmış olsa da takvim tarihi birkaç hafta/ay ileri kayabilir — en az 10 yıl geçtiği doğrulanır.
    const { yil } = gundenTarih(a.gun);
    expect(yil).toBeGreaterThanOrEqual(1463);
    expect(yil).toBeLessThanOrEqual(1474); // TASK-0025: şehir haritasında AI daha sık teklif gönderiyor (~15 kesinti)
    expect(durumOzeti(oyna())).toBe(durumOzeti(a));
    const b = yukle(kaydet(a), a.senaryo);
    turuIlerlet(a, baglam); turuIlerlet(b, baglam);
    expect(durumOzeti(b)).toBe(durumOzeti(a));
  }, 60000); // 132 AI devletiyle 21 oyun yılı (6b–7b) birkaç saniye sürer
});
