// TASK-0048: ortak barış payı, vasal sadakati/ilhakı, ayaklanmadan bağımsızlık
import { describe, expect, it } from "vitest";
import {
  bagimsizlikAyi, bagimsizlikBeklentisi, barisDogrula, barisiUygula, degismezler, DENGE, emirleriUygula, emirVer, ilhakBedeli, ortakBarisPayi, vasalKur,
  vasalSadakatAyi,
} from "../src";
import { yeniDurum } from "./yardimci";

const A = 0, Bd = 1, C = 2;
const BOS = { ag: null };

describe("ortak savaş ve barış (TASK-0048)", () => {
  it("kazanan liderin müttefiki işgal ettiği şehirleri pay alır; kaybeden liderin müttefiki beyaz barış yapar", () => {
    const d = yeniDurum();
    d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: A, savunan: Bd, baslangic: 0 });
    d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: C, savunan: Bd, baslangic: 0, lider: A });
    const b2 = d.sehirler.findIndex((s) => s.ad === "B2");
    d.sehirler[b2].kontrol = C;
    d.savaslar = d.savaslar.filter((w) => w.saldiran !== A); // liderin kendi savaşı barışla bitti
    ortakBarisPayi(d, A, Bd);
    expect(d.savaslar).toEqual([]);
    expect([d.sehirler[b2].devlet, d.sehirler[b2].kontrol]).toEqual([C, C]);

    const e = yeniDurum();
    e.savaslar.push({ id: e.sonrakiSavasId++, saldiran: C, savunan: Bd, baslangic: 0, lider: A });
    const eb2 = e.sehirler.findIndex((s) => s.ad === "B2");
    e.sehirler[eb2].kontrol = C;
    ortakBarisPayi(e, Bd, A); // lider A kaybetti
    expect(e.savaslar).toEqual([]);
    expect([e.sehirler[eb2].devlet, e.sehirler[eb2].kontrol]).toEqual([Bd, Bd]);
  });
});

describe("vasal sadakati ve ilhak (TASK-0048)", () => {
  it("sadakat eşiğin altına inerse vasal bağımsızlık savaşı açar", () => {
    const d = yeniDurum();
    vasalKur(d, A, Bd);
    d.vasalliklar[0].sadakat = DENGE.VASAL_ISYAN_SADAKAT - DENGE.VASAL_SADAKAT_ADIM - 1;
    d.devletler[A].hazine = 0;
    for (const o of d.ordular) if (o.devlet === A) o.asker = o.kompozisyon.piyade = 1; // efendi zayıf: sadakat düşer
    vasalSadakatAyi(d, BOS);
    expect(d.vasalliklar).toEqual([]);
    expect(d.savaslar.some((w) => w.saldiran === Bd && w.savunan === A)).toBe(true);
  });

  it("sadık vasal bedel ve süreyle ilhak edilir; şartlar emirde denetlenir", () => {
    const d = yeniDurum();
    vasalKur(d, A, Bd);
    d.devletler[A].hazine = 100000;
    expect(emirVer(d, { tur: "vasalIlhak", hedef: Bd })).toMatchObject({ gecerli: false, neden: expect.stringMatching(/gün vasal olmalı/) });
    d.vasalliklar[0].baslangic = d.gun - DENGE.VASAL_ILHAK_EN_AZ_GUN;
    d.vasalliklar[0].sadakat = 100;
    const { bedel, gun } = ilhakBedeli(d, Bd);
    expect(emirVer(d, { tur: "vasalIlhak", hedef: Bd }).gecerli).toBe(true);
    emirleriUygula(d);
    expect(d.devletler[A].hazine).toBe(100000 - bedel);
    expect(d.vasalliklar[0].ilhakBitis).toBe(d.gun + gun);
    d.gun += gun;
    vasalSadakatAyi(d, BOS);
    expect(d.sehirler.filter((s) => s.devlet === Bd)).toEqual([]);
    expect(d.birimler.some((b) => b.sahip === Bd)).toBe(false);
    expect(d.vasalliklar).toEqual([]);
    expect(degismezler(d)).toEqual([]);
  });
});

describe("ayaklanmadan bağımsızlık (TASK-0048)", () => {
  it("fethedilmiş şehirde süren ayaklanma asıl sahibini yeniden kurar ve savaş başlatır; kendi şehrinde olmaz", () => {
    const d = yeniDurum();
    const b2 = d.sehirler.findIndex((s) => s.ad === "B2"), a2 = d.sehirler.findIndex((s) => s.ad === "A2");
    d.sehirler[b2].devlet = d.sehirler[b2].kontrol = A;
    for (const s of [d.sehirler[b2], d.sehirler[a2]]) Object.assign(s.istikrar, { ayaklanma: true, ayaklanmaAy: 2 });
    expect(bagimsizlikBeklentisi(d, b2)).toEqual({ devlet: Bd, kalanAy: DENGE.BAGIMSIZLIK_AYAKLANMA_AY - 2 });
    expect(bagimsizlikBeklentisi(d, a2)).toBeNull();
    bagimsizlikAyi(d, BOS);
    expect(d.sehirler[b2].devlet).toBe(A); // süre dolmadı
    d.sehirler[b2].istikrar.ayaklanmaAy = DENGE.BAGIMSIZLIK_AYAKLANMA_AY;
    d.sehirler[a2].istikrar.ayaklanmaAy = DENGE.BAGIMSIZLIK_AYAKLANMA_AY;
    bagimsizlikAyi(d, BOS);
    expect([d.sehirler[b2].devlet, d.sehirler[b2].istikrar.ayaklanma]).toEqual([Bd, false]);
    expect(d.sehirler[a2].devlet).toBe(A);
    expect(d.savaslar.some((w) => w.saldiran === Bd && w.savunan === A)).toBe(true);
    expect(degismezler(d)).toEqual([]);
  });
});

describe("barışta serbest bırakma (TASK-0052)", () => {
  it("işgal edilen şehir 1453 sahibine döner ve o devlet talep edenin vasalı olur; uygunsuz talep reddedilir", () => {
    const d = yeniDurum();
    d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: A, savunan: Bd, baslangic: 0 });
    const b2 = d.sehirler.findIndex((s) => s.ad === "B2");
    d.sehirler[b2].kontrol = A;
    for (const c of d.sehirler) if (c.devlet === Bd) c.kontrol = A; // puan yetsin: B'nin bütün şehirleri işgalde
    const savas = d.savaslar[0].id;
    expect(barisDogrula(d, { savas, birimler: [], sehirler: [b2], tazminat: 0, serbestBirak: true }, A))
      .toMatchObject({ gecerli: false, neden: expect.stringMatching(/serbest bırakılacak devlet yok/) });
    d.sehirler[b2].asil = C; // bu şehrin 1453 sahibi C olsun
    const t = { savas, birimler: [], sehirler: [b2], tazminat: 0, serbestBirak: true };
    expect(barisDogrula(d, t, A).gecerli).toBe(true);
    barisiUygula(d, { ag: null }, t, A);
    expect([d.sehirler[b2].devlet, d.sehirler[b2].kontrol]).toEqual([C, C]);
    expect(d.vasalliklar.some((v) => v.efendi === A && v.vasal === C)).toBe(true);
    expect(degismezler(d)).toEqual([]);
  });
});

describe("başkent taşıma (TASK-0053)", () => {
  it("kendi şehrine bedelle taşınır; bekleme süresi ve şartlar emirde denetlenir", () => {
    const d = yeniDurum();
    const a2 = d.sehirler.findIndex((s) => s.ad === "A2"), b2 = d.sehirler.findIndex((s) => s.ad === "B2");
    const eski = d.devletler[A].baskent!;
    d.devletler[A].hazine = DENGE.BASKENT_TASIMA_BEDEL + 100;
    expect(emirVer(d, { tur: "baskentTasi", sehir: b2 }).gecerli).toBe(false);
    expect(emirVer(d, { tur: "baskentTasi", sehir: eski }).gecerli).toBe(false);
    expect(emirVer(d, { tur: "baskentTasi", sehir: a2 }).gecerli).toBe(true);
    emirleriUygula(d);
    expect(d.devletler[A].baskent).toBe(a2);
    expect([d.sehirler[a2].baskent, d.sehirler[eski].baskent]).toEqual([true, false]);
    expect(d.devletler[A].hazine).toBe(100);
    d.devletler[A].hazine = 100000;
    expect(emirVer(d, { tur: "baskentTasi", sehir: eski })).toMatchObject({ gecerli: false, neden: expect.stringMatching(/gün sonra/) });
    d.gun += DENGE.BASKENT_TASIMA_ARALIK_GUN;
    expect(emirVer(d, { tur: "baskentTasi", sehir: eski }).gecerli).toBe(true);
    expect(degismezler(d)).toEqual([]);
  });
});
