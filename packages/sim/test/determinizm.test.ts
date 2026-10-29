import { describe, expect, it } from "vitest";
import { degismezler, durumOzeti, emirVer, turSuresiAyarla, turuIlerlet, type DunyaDurumu, type TurSuresi } from "../src";
import { yeniDurum } from "./yardimci";

const SURELER: TurSuresi[] = ["hafta", "ay", "ceyrek", "yil"];

// Aynı senaryo: değişen tur süreleri, harcama emirleri ve bir kesinti, yaklaşık 10 yıl
function oyna(tohum: number): DunyaDurumu {
  const d = yeniDurum(tohum);
  for (let tur = 0; tur < 40; tur++) {
    turSuresiAyarla(d, SURELER[tur % SURELER.length]);
    if (tur % 3 === 0) emirVer(d, { tur: "harca", devlet: tur % 3, miktar: 25, aciklama: "test harcaması" });
    if (tur === 7) emirVer(d, { tur: "testKesintisi", gunSonra: 5, neden: "test" });
    turuIlerlet(d);
    expect(degismezler(d)).toEqual([]);
  }
  return d;
}

describe("determinizm", () => {
  it("aynı tohum ve emirler → aynı durum özeti", () => {
    for (const tohum of [1, 1453, 0xdeadbeef]) {
      expect(durumOzeti(oyna(tohum))).toBe(durumOzeti(oyna(tohum)));
    }
  });

  it("farklı tohum → farklı durum", () => {
    expect(durumOzeti(oyna(1))).not.toBe(durumOzeti(oyna(2)));
  });

  it("rastgelelik durumu dünya durumunun parçasıdır (kopya aynı yolu izler)", () => {
    const a = yeniDurum(7);
    turuIlerlet(a);
    const b: DunyaDurumu = structuredClone(a);
    for (let i = 0; i < 5; i++) { turuIlerlet(a); turuIlerlet(b); }
    expect(durumOzeti(b)).toBe(durumOzeti(a));
  });
});
