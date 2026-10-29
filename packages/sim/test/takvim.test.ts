import { describe, expect, it } from "vitest";
import { ayEkle, ayUzunlugu, gundenTarih, tarihMetni, tarihtenGun } from "../src";

describe("Jülyen takvimi", () => {
  it("bilinen Jülyen gün numaralarıyla uyuşur", () => {
    expect(tarihtenGun({ yil: -4712, ay: 1, gun: 1 })).toBe(0); // JGN tanımı
    expect(tarihtenGun({ yil: 1582, ay: 10, gun: 4 })).toBe(2299160); // Gregoryen geçişinden önceki son Jülyen gün
  });

  it("gün ↔ tarih dönüşümü 1400–1700 arasında tutarlı", () => {
    const bas = tarihtenGun({ yil: 1400, ay: 1, gun: 1 });
    const son = tarihtenGun({ yil: 1700, ay: 1, gun: 1 });
    for (let g = bas; g <= son; g += 37) expect(tarihtenGun(gundenTarih(g))).toBe(g);
  });

  it("artık yıl kuralı: her 4 yılda bir (1500 dahil)", () => {
    expect(ayUzunlugu(1452, 2)).toBe(29);
    expect(ayUzunlugu(1453, 2)).toBe(28);
    expect(ayUzunlugu(1500, 2)).toBe(29); // Gregoryen'de 28 olurdu
  });

  it("ay eklerken gün ay sonuna çekilir", () => {
    expect(ayEkle({ yil: 1453, ay: 1, gun: 31 }, 1)).toEqual({ yil: 1453, ay: 2, gun: 28 });
    expect(ayEkle({ yil: 1453, ay: 11, gun: 15 }, 3)).toEqual({ yil: 1454, ay: 2, gun: 15 });
  });

  it("Türkçe tarih metni", () => {
    expect(tarihMetni(tarihtenGun({ yil: 1453, ay: 5, gun: 29 }))).toBe("29 Mayıs 1453");
  });

  it("geçersiz tarihi reddeder", () => {
    expect(() => tarihtenGun({ yil: 1453, ay: 2, gun: 29 })).toThrow();
  });
});
