import { describe, expect, it } from "vitest";
import { emirVer, gunIlerlet, gundenTarih, turHedefi, turSuresiAyarla, turuIlerlet, type TurSuresi } from "../src";
import { dunyaOzeti, yeniDurum } from "./yardimci";

const tarih = (g: number) => gundenTarih(g);

describe("tur süresi", () => {
  it("hedef günler takvime göre hesaplanır", () => {
    const d = yeniDurum(); // 1 Nisan 1453
    expect(turHedefi(d.gun, "hafta") - d.gun).toBe(7);
    expect(tarih(turHedefi(d.gun, "ay"))).toEqual({ yil: 1453, ay: 5, gun: 1 });
    expect(tarih(turHedefi(d.gun, "ceyrek"))).toEqual({ yil: 1453, ay: 7, gun: 1 });
    expect(tarih(turHedefi(d.gun, "yil"))).toEqual({ yil: 1454, ay: 4, gun: 1 });
  });

  it("AT-005: 1 yıl = 12 ay = 4 çeyrek = 52 hafta + 1 gün (aynı dünya durumu)", () => {
    const calistir = (sure: TurSuresi, kez: number) => {
      const d = yeniDurum();
      turSuresiAyarla(d, sure);
      for (let i = 0; i < kez; i++) turuIlerlet(d);
      return d;
    };
    const yil = calistir("yil", 1);
    const ay = calistir("ay", 12);
    const ceyrek = calistir("ceyrek", 4);
    const hafta = calistir("hafta", 52);
    gunIlerlet(hafta); // 52 hafta = 364 gün; 1454 artık değil → 1 gün eksik
    expect(tarih(yil.gun)).toEqual({ yil: 1454, ay: 4, gun: 1 });
    for (const d of [ay, ceyrek, hafta]) {
      expect(d.gun).toBe(yil.gun);
      expect(dunyaOzeti(d)).toBe(dunyaOzeti(yil));
    }
  });

  it("AT-004: tur ilerletilmeden dünya değişmez (emir verilse bile)", () => {
    const d = yeniDurum();
    const once = JSON.stringify({ gun: d.gun, devletler: d.devletler, birimler: d.birimler, sehirler: d.sehirler, rng: d.rng });
    emirVer(d, { tur: "harca", devlet: 0, miktar: 100, aciklama: "test" });
    turSuresiAyarla(d, "yil");
    const sonra = JSON.stringify({ gun: d.gun, devletler: d.devletler, birimler: d.birimler, sehirler: d.sehirler, rng: d.rng });
    expect(sonra).toBe(once);
  });

  it("DEC-0006: kesinti turu durdurur; devam edildiğinde sonuç kesintisiz yolla aynıdır", () => {
    const kesintisiz = yeniDurum();
    turSuresiAyarla(kesintisiz, "yil");
    turuIlerlet(kesintisiz);

    const d = yeniDurum();
    turSuresiAyarla(d, "yil");
    emirVer(d, { tur: "testKesintisi", gunSonra: 40, neden: "Test: düşman ordusu görüldü" });
    const bas = d.gun;
    const s1 = turuIlerlet(d);
    expect(s1.kesinti?.neden).toBe("Test: düşman ordusu görüldü");
    expect(s1.bitisGun - bas).toBe(40);
    expect(s1.yeniOlaylar.some((o) => o.tur === "kesinti")).toBe(true);
    // Oyuncu kalan süreyi ay ay ilerletir: yine aynı takvim noktasına gelinir
    turSuresiAyarla(d, "ay");
    while (d.gun < kesintisiz.gun) {
      if (turHedefi(d.gun, "ay") > kesintisiz.gun) gunIlerlet(d);
      else turuIlerlet(d);
    }
    expect(d.gun).toBe(kesintisiz.gun);
    expect(dunyaOzeti(d)).toBe(dunyaOzeti(kesintisiz));
  });

  it("aylık sistemler ayın ilk günü çalışır", () => {
    const d = yeniDurum();
    const once = d.devletler[0].hazine;
    turuIlerlet(d); // 1 Nisan → 1 Mayıs: 1 Mayıs'ta gelir
    expect(d.devletler[0].hazine).toBe(once + 5 * 10); // test-gelir: 5 birim × 10
  });
});
