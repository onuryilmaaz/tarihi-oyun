// TASK-0010/7d: yerel yönetim (DEC-0049)
import { describe, expect, it } from "vitest";
import {
  degismezler, DENGE, durumOzeti, emirVer, gunIlerlet, gundenTarih, kaydet, SEMA_SURUMU, yerelYoneticiler, yerelYonetimAyarla, yukle,
  type DunyaDurumu,
} from "../src";
import { yeniDurum } from "./yardimci";

const A = 0, A1 = 0, A2 = 1, B1 = 2;
const B = { ag: null };
const hazirla = (butce: number, hazine = 10000) => {
  const d = yeniDurum();
  d.devletler[A].hazine = hazine;
  expect(yerelYonetimAyarla(d, { sehir: A1, acik: true })).toEqual({ gecerli: true });
  expect(yerelYonetimAyarla(d, { sehir: A2, acik: true })).toEqual({ gecerli: true });
  expect(yerelYonetimAyarla(d, { butce })).toEqual({ gecerli: true });
  return d;
};
const otomatik = (d: DunyaDurumu) => d.insaatlar.filter((i) => i.devlet === A);

describe("yerel yönetim (7d)", () => {
  it("varsayılan kapalı ve bütçe 0: hiçbir şey harcanmaz; ayar doğrulanır", () => {
    const d = yeniDurum();
    d.devletler[A].hazine = 10000;
    expect(d.sehirler.every((s) => !s.yonetici)).toBe(true);
    expect(d.yerelYonetim).toEqual({ butce: 0, altSinir: 0, harcanan: 0 });
    yerelYoneticiler(d, B);
    expect(d.devletler[A].hazine).toBe(10000);
    expect(yerelYonetimAyarla(d, { sehir: B1, acik: true }).gecerli).toBe(false); // yabancı şehir
    expect(yerelYonetimAyarla(d, { butce: -1 }).gecerli).toBe(false);
    expect(degismezler(d)).toEqual([]);
  });

  it("aylık bütçe tavanı aşılmaz; her harcama günlüğe yazılır", () => {
    const d = hazirla(DENGE.YAPI_MALIYET.tarla[0] + 100); // yalnızca bir tarla sığar
    yerelYoneticiler(d, B);
    expect(otomatik(d)).toHaveLength(1);
    expect(d.yerelYonetim.harcanan).toBe(DENGE.YAPI_MALIYET.tarla[0]);
    expect(d.gunluk.at(-1)!.metin).toMatch(/^Yerel yönetici: A1 şehrinde Tarla yatırımı, −300\. \(Bu ay 300\/400\)/);
    const e = hazirla(2 * DENGE.YAPI_MALIYET.tarla[0]);
    yerelYoneticiler(e, B);
    expect(otomatik(e)).toHaveLength(2); // şehir başına ayda bir iş
    expect(degismezler(e)).toEqual([]);
  });

  it("hazine alt sınırı ve eksi hazine korunur (borç yok)", () => {
    const d = hazirla(1000, 500);
    yerelYonetimAyarla(d, { altSinir: 400 });
    yerelYoneticiler(d, B);
    expect(otomatik(d)).toHaveLength(0);
    const e = hazirla(1000, -50);
    yerelYoneticiler(e, B);
    expect(e.devletler[A].hazine).toBe(-50);
  });

  it("oyuncunun emri önce gelir: inşaatı ya da bekleyen emri olan şehre dokunmaz", () => {
    const d = hazirla(5000);
    expect(emirVer(d, { tur: "insaat", sehir: A1, yapi: "sur" }).gecerli).toBe(true);
    yerelYoneticiler(d, B);
    expect(otomatik(d).map((i) => i.sehir)).toEqual([A2]);
    expect(d.emirKuyrugu).toHaveLength(1); // oyuncunun emri yerinde
  });

  it("önce riskli şehre bağış, sonra yatırım; yetkisi dışındaki işleri yapmaz", () => {
    const d = hazirla(5000);
    d.sehirler[A2].istikrar.risk = DENGE.IST_HUZURSUZLUK + 10;
    yerelYoneticiler(d, B);
    expect(d.sehirler[A2].istikrar.bagis).toBe(DENGE.IST_BAGIS_INDIRIM);
    expect(otomatik(d).map((i) => i.sehir)).toEqual([A1]); // bağış yapılan şehirde o ay yatırım yok
    expect(otomatik(d).every((i) => i.yapi !== "sur")).toBe(true);
    expect(d.askerToplamalar).toHaveLength(0);
    expect(d.arastirmalar.filter((a) => a.devlet === A)).toHaveLength(0);
    expect(d.yerelYonetim.harcanan).toBe(DENGE.IST_BAGIS_BEDEL + DENGE.YAPI_MALIYET.tarla[0]);
  });

  it("ay başında sistem olarak çalışır; kayıt/yükleme sonucu değiştirmez; şema 13 dönüştürülür", () => {
    const d = hazirla(1000);
    do gunIlerlet(d); while (gundenTarih(d.gun).gun !== 1);
    expect(otomatik(d).length).toBeGreaterThan(0);
    const e = yukle(kaydet(d), d.senaryo);
    for (let i = 0; i < 200; i++) { gunIlerlet(d); gunIlerlet(e); }
    expect(durumOzeti(e)).toBe(durumOzeti(d));
    const p = JSON.parse(kaydet(yeniDurum()));
    p.sema = 13; p.durum.sema = 13;
    delete p.durum.yerelYonetim;
    for (const s of p.durum.sehirler) delete s.yonetici;
    const g = yukle(JSON.stringify(p));
    expect(g.sema).toBe(SEMA_SURUMU);
    expect(g.yerelYonetim).toEqual({ butce: 0, altSinir: 0, harcanan: 0 });
    expect(degismezler(g)).toEqual([]);
  });
});
