import { describe, expect, it } from "vitest";
import { emirVer, turuIlerlet } from "../src";
import { yeniDurum } from "./yardimci";

describe("emirler ve hazine (DEC-0002)", () => {
  it("AT-010: hazine 100 iken 120'lik harcama borç yaratmadan reddedilir", () => {
    const d = yeniDurum();
    d.devletler[0].hazine = 100;
    const s = emirVer(d, { tur: "harca", devlet: 0, miktar: 120, aciklama: "kale" });
    expect(s.gecerli).toBe(false);
    if (!s.gecerli) expect(s.neden).toMatch(/Hazine yetersiz/);
    expect(d.emirKuyrugu).toHaveLength(0);
    expect(d.devletler[0].hazine).toBe(100);
  });

  it("kuyruktaki harcamalar kullanılabilir hazineden düşülür", () => {
    const d = yeniDurum();
    d.devletler[0].hazine = 100;
    expect(emirVer(d, { tur: "harca", devlet: 0, miktar: 60, aciklama: "1" }).gecerli).toBe(true);
    expect(emirVer(d, { tur: "harca", devlet: 0, miktar: 60, aciklama: "2" }).gecerli).toBe(false);
    turuIlerlet(d);
    expect(d.devletler[0].hazine).toBe(100 - 60 + 50); // + Mayıs başı test geliri
  });

  it("hazine eksideyken isteğe bağlı harcama yapılamaz", () => {
    const d = yeniDurum();
    d.devletler[1].hazine = -20;
    const s = emirVer(d, { tur: "harca", devlet: 1, miktar: 1, aciklama: "x" });
    expect(s.gecerli).toBe(false);
  });

  it("geçersiz emir değerleri reddedilir", () => {
    const d = yeniDurum();
    expect(emirVer(d, { tur: "harca", devlet: 0, miktar: 0, aciklama: "x" }).gecerli).toBe(false);
    expect(emirVer(d, { tur: "harca", devlet: 0, miktar: 2.5, aciklama: "x" }).gecerli).toBe(false);
    expect(emirVer(d, { tur: "harca", devlet: 99, miktar: 1, aciklama: "x" }).gecerli).toBe(false);
    expect(emirVer(d, { tur: "testKesintisi", gunSonra: 0, neden: "x" }).gecerli).toBe(false);
  });
});
