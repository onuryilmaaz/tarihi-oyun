// Gerçek 1453 senaryo verisiyle entegrasyon testi (veri/senaryo-1453/senaryo.json).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { agHazirla, baslangicDurumu, degismezler, durumOzeti, kaydet, tarihMetni, turSuresiAyarla, turuIlerlet, yukle, type SenaryoVerisi } from "../src";

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
    const oyna = () => {
      const d = baslangicDurumu(senaryo, { tohum: 99 });
      turSuresiAyarla(d, "yil");
      for (let i = 0; i < 10; i++) { turuIlerlet(d, baglam); expect(degismezler(d)).toEqual([]); }
      expect(d.savaslar.length + d.barislar.length).toBeGreaterThan(0);
      return d;
    };
    const a = oyna();
    expect(degismezler(a)).toEqual([]);
    expect(tarihMetni(a.gun)).toBe("1 Nisan 1463");
    expect(durumOzeti(oyna())).toBe(durumOzeti(a));
    const b = yukle(kaydet(a), a.senaryo);
    turuIlerlet(a, baglam); turuIlerlet(b, baglam);
    expect(durumOzeti(b)).toBe(durumOzeti(a));
  }, 60000); // 132 AI devletiyle 21 oyun yılı (6b–7b) birkaç saniye sürer
});
