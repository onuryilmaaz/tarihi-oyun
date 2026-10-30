// TASK-0011/8c: casusluk görevleri (DEC-0051, DEC-0053)
import { describe, expect, it } from "vitest";
import {
  agHazirla, baslangicDurumu, casusGorevleriIlerlet, degismezler, DENGE, diplomasiOnHesap, durumOzeti, emirleriUygula, emirVer,
  disDestek, gorunurYabanciOrdular, gunIlerlet, iliskiBilesenleri, istihbaratVar, kaydet, kullanilabilirHazine, riskBilesenleri, SEMA_SURUMU, yukle,
  type DunyaDurumu, type GorevTuru, type SenaryoVerisi,
} from "../src";

// Doğrusal dünya: A düğüm 0–1, B düğüm 2–9; B'nin ordusu uzakta (düğüm 9), A'nın görüşü dışında
const S: SenaryoVerisi = {
  id: "casus-test", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
  devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }],
  birimler: Array.from({ length: 10 }, (_, i) => ({ devlet: i < 2 ? "a" : "b" })),
  sehirler: [
    { ad: "A1", devlet: "a", birim: 0, dugum: 0, x: 0, y: 0, baskent: true, nufus: 40000 },
    { ad: "B1", devlet: "b", birim: 9, dugum: 9, x: 90000, y: 0, baskent: true, nufus: 40000 },
  ],
  ordular: [{ ad: "B Ordusu", devlet: "b", asker: 7300, dugum: 9, x: 90000, y: 0 }],
  ag: { dugumler: Array.from({ length: 10 }, (_, b) => ({ b, x: b * 10000, y: 0, kx: 10000, ky: 10000, z: 100 })),
    kenarlar: Array.from({ length: 9 }, (_, a) => ({ a, b: a + 1, mx: a * 10000 + 5000, my: 0, da: 5000, db: 5000, n: 0, g: 0 })) },
};
const B_ = { ag: agHazirla(S.ag!), sehirKonumlari: S.sehirler.map((s) => ({ x: s.x!, y: s.y! })) };
const A = 0, B = 1, B1 = 1;
const yeni = (tohum = 1) => { const d = baslangicDurumu(S, { tohum }); d.devletler[A].hazine = 5000; return d; };
/** Görevi başlat ve sonuçlandır; tohumlar arasında hem başarı hem başarısızlık örneği bulmak için. */
function gorev(tohum: number, tur: GorevTuru, sehir: number | null = null) {
  const d = yeni(tohum);
  if (tur === "sabotaj") d.insaatlar.push({ sehir: B1, devlet: B, yapi: "tarla", hedef: 1, kalanGun: 10 });
  expect(emirVer(d, { tur: "casusluk", hedef: B, gorev: tur, sehir }).gecerli).toBe(true);
  emirleriUygula(d);
  for (let i = 0; i < DENGE.CASUS[tur].hazirlik; i++) casusGorevleriIlerlet(d);
  return d;
}
const basarili = (d: DunyaDurumu) => d.gunluk.some((o) => /başarılı/.test(o.metin));

describe("casusluk (8c)", () => {
  it("isyan desteği alınan kendi şehrini etkilemez; eski etki günlük temizlenir (H-06)", () => {
    const d = yeni();
    d.casusEtkileri.push({ devlet: A, hedef: B, tur: "isyan", sehir: B1, bitis: d.gun + 90 });
    expect(disDestek(d, B1)).toBe(DENGE.CASUS_ISYAN_RISK);
    d.sehirler[B1].devlet = A;
    expect(disDestek(d, B1)).toBe(0);
    const copy = yukle(kaydet(d));
    expect(disDestek(copy, B1)).toBe(0);
    casusGorevleriIlerlet(copy);
    expect(copy.casusEtkileri).toHaveLength(0);
    copy.sehirler[B1].devlet = B; // eski sahibine dönse bile bitmiş destek dirilmez
    expect(disDestek(copy, B1)).toBe(0);
  });
  it("doğrulama: hedef, şehir, eş zamanlı görev sınırı ve bedel (borç yok)", () => {
    const d = yeni();
    expect(emirVer(d, { tur: "casusluk", hedef: A, gorev: "askeri", sehir: null }).gecerli).toBe(false);
    expect(emirVer(d, { tur: "casusluk", hedef: B, gorev: "isyan", sehir: null }).gecerli).toBe(false); // şehir gerekli
    expect(emirVer(d, { tur: "casusluk", hedef: B, gorev: "isyan", sehir: 0 }).gecerli).toBe(false); // kendi şehri
    expect(emirVer(d, { tur: "casusluk", hedef: B, gorev: "askeri", sehir: null }).gecerli).toBe(true);
    expect(emirVer(d, { tur: "casusluk", hedef: B, gorev: "diplomatik", sehir: null }).gecerli).toBe(true);
    expect(emirVer(d, { tur: "casusluk", hedef: B, gorev: "sabotaj", sehir: B1 }).gecerli).toBe(false); // en çok 2
    expect(kullanilabilirHazine(d, A)).toBe(5000 - DENGE.CASUS.askeri.bedel - DENGE.CASUS.diplomatik.bedel);
    const e = yeni(); e.devletler[A].hazine = 100;
    expect(emirVer(e, { tur: "casusluk", hedef: B, gorev: "askeri", sehir: null }).gecerli).toBe(false);
  });

  it("askerî istihbarat: başarılıysa hedefin uzaktaki ordusu kesin sayıyla görünür; başarısız casus yakalanabilir", () => {
    expect(gorunurYabanciOrdular(yeni(), B_.ag, A)).toHaveLength(0);
    let gorduk = false, yakalandi = false;
    for (let t = 1; t < 40 && !(gorduk && yakalandi); t++) {
      const d = gorev(t, "askeri");
      if (basarili(d)) {
        gorduk = true;
        expect(istihbaratVar(d, A, B, "askeri")).toBe(true);
        expect(gorunurYabanciOrdular(d, B_.ag, A)).toMatchObject([{ devlet: B, yaklasikAsker: 7300, kesin: true }]);
      } else if (d.gunluk.some((o) => /Casusunuz yakalandı/.test(o.metin))) {
        yakalandi = true;
        expect(iliskiBilesenleri(d, diplomasiOnHesap(d, null), B, A)).toContainEqual({ ad: "Yakalanan casus", deger: DENGE.CASUS_YAKALANMA_ILISKI });
      }
      expect(degismezler(d)).toEqual([]);
    }
    expect(gorduk && yakalandi).toBe(true);
  });

  it("isyanı destekleme şehrin risk bileşenine, sabotaj süren inşaata etki eder", () => {
    let isyan = false, sabotaj = false;
    for (let t = 1; t < 40 && !(isyan && sabotaj); t++) {
      const d = gorev(t, "isyan", B1);
      if (basarili(d)) { isyan = true; expect(riskBilesenleri(d, B1, B_)).toContainEqual({ id: "disdestek", ad: "Yabancı kışkırtma (casusluk)", puan: DENGE.CASUS_ISYAN_RISK }); }
      const e = gorev(t, "sabotaj", B1);
      if (basarili(e)) { sabotaj = true; expect(e.insaatlar[0].kalanGun).toBe(10 + DENGE.CASUS_SABOTAJ_GUN); }
    }
    expect(isyan && sabotaj).toBe(true);
  });

  it("görev sürerken kayıt/yükleme sonucu değiştirmez; şema 16 kaydı dönüştürülür", () => {
    const d = yeni();
    emirVer(d, { tur: "casusluk", hedef: B, gorev: "askeri", sehir: null });
    emirleriUygula(d);
    const e = yukle(kaydet(d), d.senaryo);
    for (let i = 0; i < 60; i++) { gunIlerlet(d, B_); gunIlerlet(e, B_); }
    expect(durumOzeti(e)).toBe(durumOzeti(d));
    const p = JSON.parse(kaydet(yeni()));
    p.sema = 16; p.durum.sema = 16;
    delete p.durum.casusGorevleri; delete p.durum.casusEtkileri; delete p.durum.sonrakiGorevId;
    const g = yukle(JSON.stringify(p));
    expect(g.sema).toBe(SEMA_SURUMU);
    expect(degismezler(g)).toEqual([]);
  });
});
