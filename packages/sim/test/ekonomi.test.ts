import { describe, expect, it } from "vitest";
import { agHazirla, baslangicDurumu, butceOzeti, durumOzeti, emirVer, turuIlerlet } from "../src";
import { TEST_SENARYOSU } from "./yardimci";

const yeni = () => baslangicDurumu({ ...TEST_SENARYOSU,
  ordular: [{ ad: "A Ordusu", devlet: "a", asker: 1001, dugum: 0, x: 0, y: 0 }] }, { tohum: 1453 });

describe("5a mevcut bütçe görünürlüğü", () => {
  it("gösterilen aylık fark gerçekten işlenen gelir ve maaşla eşleşir; sorgu dünyayı değiştirmez", () => {
    const d = yeni(), once = durumOzeti(d), b = butceOzeti(d, 0);
    expect(b).toMatchObject({ hazine: 500, ayrilan: 0, kullanilabilir: 500,
      aylikGelir: 50, aylikMaas: 21, aylikNet: 29, araziSayisi: 5, askerSayisi: 1001 });
    expect(durumOzeti(d)).toBe(once);
    turuIlerlet(d);
    expect(d.devletler[0].hazine - b.hazine).toBe(b.aylikNet);
  });

  it("toplama ve harcama kuyruğunun ayırdığı para bütçede görünür; yeni para harcanmaz", () => {
    const d = yeni(); d.sehirler[0].dugum = 0;
    const b = { ag: agHazirla({ dugumler: [{ b: 0, x: 0, y: 0, kx: 10000, ky: 10000, z: 100 }], kenarlar: [] }) };
    expect(emirVer(d, { tur: "askerTopla", sehir: 0, asker: 100 }, b).gecerli).toBe(true);
    expect(emirVer(d, { tur: "harca", devlet: 0, miktar: 30, aciklama: "test" }, b).gecerli).toBe(true);
    expect(butceOzeti(d, 0)).toMatchObject({ hazine: 500, ayrilan: 40, kullanilabilir: 460, aylikNet: 29 });
    expect(d.devletler[0].hazine).toBe(500);
    expect(emirVer(d, { tur: "harca", devlet: 0, miktar: 461, aciklama: "test" }, b).gecerli).toBe(false);
    expect(butceOzeti(d, 1)).toMatchObject({ ayrilan: 0, kullanilabilir: 300 });
  });

  it("eksi hazine ve aylık açık sıfıra yuvarlanarak gizlenmez", () => {
    const d = yeni(); d.devletler[0].hazine = -10; d.ordular[0].asker = 10000;
    expect(butceOzeti(d, 0)).toMatchObject({ hazine: -10, ayrilan: 0, kullanilabilir: -10, aylikMaas: 200, aylikNet: -150 });
  });

  it("işgal tek başına mevcut gelir kuralını değiştirmez; yasal devir bütçeye yansır", () => {
    const d = yeni(); d.birimler[5].kontrol = 0;
    expect(butceOzeti(d, 0).aylikGelir).toBe(50);
    d.birimler[5].sahip = 0;
    expect(butceOzeti(d, 0)).toMatchObject({ aylikGelir: 60, araziSayisi: 6 });
    expect(butceOzeti(d, 1).aylikGelir).toBe(20);
  });
});
