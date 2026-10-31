// TASK-0008/5b: şehir yatırımları (DEC-0033)
import { describe, expect, it } from "vitest";
import {
  DENGE, butceOzeti, degismezler, durumOzeti, emirVer, gundenTarih, gunIlerlet, kaydet, kullanilabilirHazine, insaatlariIlerlet,
  turSuresiAyarla, turuIlerlet, yapiSeviyeGeliri, yukle, type DunyaDurumu,
} from "../src";
import { yeniDurum } from "./yardimci";

// Test senaryosu: devlet "a" (oyuncu) şehirleri A1 (başkent, 0) ve A2 (1); "b" şehri B1 (2)
const A1 = 0, A2 = 1, B1 = 2;
const gunIlerle = (d: DunyaDurumu, n: number) => { for (let i = 0; i < n; i++) gunIlerlet(d); };

describe("şehir yatırımları (5b)", () => {
  it("bedel emir verilince ayrılır, tur başında düşülür; borç yaratmaz (DEC-0002)", () => {
    const d = yeniDurum();
    d.devletler[0].hazine = 1000;
    expect(emirVer(d, { tur: "insaat", sehir: A1, yapi: "tarla" }).gecerli).toBe(true);
    expect(kullanilabilirHazine(d, 0)).toBe(1000 - DENGE.YAPI_MALIYET.tarla[0]);
    expect(d.devletler[0].hazine).toBe(1000); // tur ilerlemeden dünya değişmez (AT-004)
    turSuresiAyarla(d, "hafta");
    turuIlerlet(d);
    expect(d.devletler[0].hazine).toBe(1000 - DENGE.YAPI_MALIYET.tarla[0]);
    expect(d.insaatlar).toHaveLength(1);
    expect(degismezler(d)).toEqual([]);
  });

  it("yetersiz hazine, yabancı şehir, ikinci inşaat ve en yüksek seviye gerekçesiyle reddedilir", () => {
    const d = yeniDurum();
    d.devletler[0].hazine = 100;
    const az = emirVer(d, { tur: "insaat", sehir: A1, yapi: "pazar" });
    expect(az.gecerli).toBe(false);
    if (!az.gecerli) expect(az.neden).toMatch(/Hazine yetersiz.*Borçlanma yoktur/);
    d.devletler[0].hazine = 100000;
    expect(emirVer(d, { tur: "insaat", sehir: B1, yapi: "tarla" }).gecerli).toBe(false);
    expect(emirVer(d, { tur: "insaat", sehir: A1, yapi: "tarla" }).gecerli).toBe(true);
    expect(emirVer(d, { tur: "insaat", sehir: A1, yapi: "pazar" }).gecerli).toBe(false); // şehir başına tek inşaat
    expect(emirVer(d, { tur: "insaat", sehir: A2, yapi: "pazar" }).gecerli).toBe(true); // başka şehir olur
    d.sehirler[A2].sur = DENGE.YAPI_EN_YUKSEK.sur;
    const tavan = emirVer(d, { tur: "insaat", sehir: A2, yapi: "sur" });
    expect(tavan.gecerli).toBe(false);
  });

  it("yapım süresi dolunca seviye artar; gelir bir sonraki ay başında tam beklenen kadar yükselir", () => {
    const d = yeniDurum(); // 1 Nisan 1453
    d.devletler[0].hazine = 5000;
    const once = butceOzeti(d, 0).aylikGelir;
    emirVer(d, { tur: "insaat", sehir: A2, yapi: "pazar" });
    turSuresiAyarla(d, "hafta");
    turuIlerlet(d); // inşaat başlar
    gunIlerle(d, DENGE.YAPI_SURE_GUN.pazar - 8);
    expect(d.sehirler[A2].yapilar.pazar).toBe(0);
    while (d.insaatlar.length) gunIlerlet(d);
    expect(d.sehirler[A2].yapilar.pazar).toBe(1);
    expect(d.gunluk.some((o) => o.tur === "insaat-bitti")).toBe(true);
    const butce = butceOzeti(d, 0);
    const seviye = yapiSeviyeGeliri(d, d.sehirler[A2], "pazar"); // nüfusa ölçekli (TASK-0032)
    expect(butce.aylikYapiGeliri).toBe(seviye);
    expect(butce.aylikGelir).toBe(once + seviye);
    // Bir sonraki ay başında hazineye işlenen fark, özetteki aylık net farkla birebir aynı
    const hazine = d.devletler[0].hazine;
    do gunIlerlet(d); while (gundenTarih(d.gun).gun !== 1);
    expect(d.devletler[0].hazine).toBe(hazine + butce.aylikNet);
  });

  it("sur seviyesi kuşatma direncini artırır ve inşaatla yükselir", () => {
    const d = yeniDurum();
    d.devletler[0].hazine = 5000;
    const sur = d.sehirler[A1].sur;
    emirVer(d, { tur: "insaat", sehir: A1, yapi: "sur" });
    turuIlerlet(d);
    while (d.insaatlar.length) gunIlerlet(d);
    expect(d.sehirler[A1].sur).toBe(sur + 1);
  });

  it("kuşatma altında inşaat durur; şehir el değiştirirse iptal olur (bedel geri verilmez)", () => {
    const d = yeniDurum();
    d.devletler[0].hazine = 5000;
    emirVer(d, { tur: "insaat", sehir: A2, yapi: "tarla" });
    turSuresiAyarla(d, "hafta");
    turuIlerlet(d);
    const kalan = d.insaatlar[0].kalanGun;
    // Kuşatma sistemi ordusuz sahte kuşatmayı sileceği için inşaat adımı doğrudan çağrılır
    d.kusatmalar.push({ sehir: A2 } as DunyaDurumu["kusatmalar"][number]);
    for (let i = 0; i < 5; i++) insaatlariIlerlet(d);
    expect(d.insaatlar[0].kalanGun).toBe(kalan); // durdu
    d.kusatmalar = [];
    const hazine = d.devletler[0].hazine;
    d.sehirler[A2].kontrol = 1; // şehir düştü
    gunIlerlet(d);
    expect(d.insaatlar).toHaveLength(0);
    expect(d.gunluk.some((o) => o.tur === "insaat-iptal")).toBe(true);
    expect(d.devletler[0].hazine).toBe(hazine);
  });

  it("inşaat sürerken kayıt/yükleme sonucu değiştirmez", () => {
    const d = yeniDurum(5);
    d.devletler[0].hazine = 5000;
    emirVer(d, { tur: "insaat", sehir: A1, yapi: "tarla" });
    turuIlerlet(d);
    const e = yukle(kaydet(d), d.senaryo);
    for (let i = 0; i < 4; i++) { turuIlerlet(d); turuIlerlet(e); }
    expect(durumOzeti(e)).toBe(durumOzeti(d));
  });
});
