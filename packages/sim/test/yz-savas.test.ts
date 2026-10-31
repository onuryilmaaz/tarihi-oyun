// TASK-0009/6c: AI savaş ilanı, sefer, barış ve oyuncuya gelen teklifler (DEC-0038, DEC-0040)
import { describe, expect, it } from "vitest";
import {
  agHazirla, barisDogrula, barisiUygula, barisKararlari, baslangicDurumu, degismezler, DENGE, diplomasiOnHesap, durumOzeti, emirleriUygula,
  emirVer, muharebeleriBaslat, muharebeGunleri, sayiMetni, etkiEkle, gunIlerlet, kaydet, savasKarari, yikilanDevletleriTemizle, savasta,
  seferKararlari, yukle, type DunyaDurumu, type SenaryoVerisi,
} from "../src";
import { askerAyarla } from "./yardimci";

// Doğrusal dünya: a (oyuncu) | b | c — düğüm i, birim i'de; her devletin başkenti kendi ilk biriminde
const S: SenaryoVerisi = {
  id: "yz-savas", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
  devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }, { id: "c", ad: "C" }],
  birimler: ["a", "a", "b", "b", "c", "c"].map((devlet) => ({ devlet })),
  sehirler: [
    { ad: "A1", devlet: "a", birim: 0, dugum: 0, x: 0, y: 0, baskent: true, nufus: 40000 },
    { ad: "B1", devlet: "b", birim: 2, dugum: 2, x: 20000, y: 0, baskent: true, nufus: 40000 },
    { ad: "C1", devlet: "c", birim: 4, dugum: 4, x: 40000, y: 0, baskent: true, nufus: 40000 },
    { ad: "C2", devlet: "c", birim: 5, dugum: 5, x: 50000, y: 0, baskent: false, nufus: 5000 },
  ],
  ag: { dugumler: [0, 1, 2, 3, 4, 5].map((b) => ({ b, x: b * 10000, y: 0, kx: 10000, ky: 10000, z: 100 })),
    kenarlar: [0, 1, 2, 3, 4].map((a) => ({ a, b: a + 1, mx: a * 10000 + 5000, my: 0, da: 5000, db: 5000, n: 0, g: 0 })) },
};
const B = { ag: agHazirla(S.ag!), sehirKonumlari: S.sehirler.map((s) => ({ x: s.x!, y: s.y! })) };
const A = 0, Bd = 1, C = 2;
const yeni = () => baslangicDurumu(S, { tohum: 3 });
const savasAc = (d: DunyaDurumu, saldiran: number, savunan: number) => d.savaslar.push({ id: d.sonrakiSavasId++, saldiran, savunan, baslangic: d.gun });

describe("AI savaş ve barış (6c)", () => {
  it("tam ilhak üçüncü devletle muharebe ve işgali anında bitirir; diğer savaş sürer (H-02)", () => {
    const d = yeni();
    savasAc(d, Bd, C); savasAc(d, A, Bd); savasAc(d, A, C);
    const bo = d.ordular.find((o) => o.devlet === Bd)!;
    const co = d.ordular.find((o) => o.devlet === C)!;
    askerAyarla(bo, 50000); askerAyarla(co, 50000);
    co.dugum = bo.dugum; co.x = bo.x; co.y = bo.y;
    muharebeleriBaslat(d);
    expect(d.muharebeler).toHaveLength(1);
    d.birimler[4].kontrol = Bd; d.birimler[4].isgalBaslangic = d.gun;
    d.sehirler[2].kontrol = Bd; d.sehirler[2].isgalBaslangic = d.gun;
    d.sehirler[3].kontrol = A; d.birimler[5].kontrol = A; // ayrı A–C savaşının işgali (C2 toprağıyla)
    d.birimler[2].kontrol = d.birimler[3].kontrol = A;
    d.sehirler[1].kontrol = A;
    const t = { savas: d.savaslar[1].id, birimler: [3], sehirler: [1], tazminat: 0 }; // B1'in toprağı (2) şehriyle gider
    expect(barisDogrula(d, t).gecerli).toBe(true);
    barisiUygula(d, B, t);
    expect(savasta(d, Bd, C)).toBe(false);
    expect(savasta(d, A, C)).toBe(true);
    expect(d.muharebeler).toHaveLength(0);
    expect(bo.muharebe).toBeNull(); expect(co.muharebe).toBeNull();
    expect(d.birimler[4]).toMatchObject({ sahip: C, kontrol: C, isgalBaslangic: null });
    expect(d.sehirler[2]).toMatchObject({ devlet: C, kontrol: C, isgalBaslangic: null });
    expect(d.birimler[5].kontrol).toBe(A);
    const asker = bo.asker;
    muharebeGunleri(d, B.ag);
    expect(bo.asker).toBe(asker);
    expect(degismezler(d)).toEqual([]);
  });
  it("kötü ilişkili, açıkça zayıf komşuya gerekçesiyle savaş ilan eder; ateşkes ve müttefiklik engeller", () => {
    const ilan = (hazirla: (d: DunyaDurumu) => void) => {
      const d = yeni();
      askerAyarla(d.ordular.find((o) => o.devlet === Bd)!, 20000);
      etkiEkle(d, Bd, C, "tarih", -60);
      hazirla(d);
      for (let i = 0; i < 100 && !savasta(d, Bd, C); i++) savasKarari(d, B, diplomasiOnHesap(d, B.ag), Bd);
      return d;
    };
    const d = ilan(() => {});
    expect(savasta(d, Bd, C)).toBe(true);
    expect(d.gunluk.find((o) => o.tur === "savas-ilani")?.metin).toMatch(/B, C'na savaş ilan etti\. Gerekçe: kötü ilişki/);
    expect(d.saldirganlik[Bd]).toBe(DENGE.SALDIRGANLIK_ILAN);
    expect(savasta(ilan((x) => x.ateskesler.push({ a: Bd, b: C, bitis: x.gun + 100 })), Bd, C)).toBe(false);
    expect(savasta(ilan((x) => etkiEkle(x, Bd, C, "tarih", 60)), Bd, C)).toBe(false);
    expect(savasta(ilan((x) => { askerAyarla(x.ordular.find((o) => o.devlet === C)!, 20000); }), Bd, C)).toBe(false); // güçlü hedef
  });

  it("oyuncuya savaş ilan edilirse tur durur", () => {
    const d = yeni();
    askerAyarla(d.ordular.find((o) => o.devlet === Bd)!, 30000);
    askerAyarla(d.ordular.find((o) => o.devlet === A)!, 1000);
    etkiEkle(d, Bd, A, "tarih", -60);
    for (let i = 0; i < 100 && !savasta(d, Bd, A); i++) savasKarari(d, B, diplomasiOnHesap(d, B.ag), Bd);
    expect(savasta(d, Bd, A)).toBe(true);
    expect(d.aktifKesinti?.neden).toMatch(/B, A'na savaş ilan etti/);
  });

  it("savaştaki AI ordusu düşman arazisine yürür, işgal eder ve kuşatır", () => {
    const d = yeni();
    askerAyarla(d.ordular.find((o) => o.devlet === Bd)!, 30000);
    savasAc(d, Bd, C);
    for (let i = 0; i < 90; i++) { gunIlerlet(d, B); d.aktifKesinti = null; }
    // C'nin arazisi B'nin kontrolüne geçti (barış da yapıldıysa yasal sahibi de B olur)
    expect(d.birimler.slice(4).some((x) => x.kontrol === Bd)).toBe(true);
    expect(degismezler(d)).toEqual([]);
  });

  it("iki AI arasında kazanan barış dayatır; topraklar el değiştirir, ateşkes başlar", () => {
    const d = yeni();
    savasAc(d, Bd, C);
    d.birimler[5].kontrol = Bd; d.sehirler[3].kontrol = Bd; // B, C2'yi ve çevresini işgal etti
    barisKararlari(d, B, Bd);
    expect(savasta(d, Bd, C)).toBe(false);
    expect(d.birimler[5].sahip).toBe(Bd);
    expect(d.sehirler[3].devlet).toBe(Bd);
    expect(d.ateskesler).toEqual([{ a: Bd, b: C, bitis: d.gun + DENGE.ATESKES_GUN }]);
    expect(d.gunluk.at(-1)).toMatchObject({ devlet: null, tur: "baris" }); // dünya haberi
    expect(degismezler(d)).toEqual([]);
  });

  it("oyuncuya barış teklifi turu durdurur; kabul tur başında uygulanır, ret ve süre dolması savaşı sürdürür", () => {
    const hazirla = () => {
      const d = yeni();
      savasAc(d, Bd, A);
      d.birimler[0].kontrol = Bd; d.birimler[1].kontrol = Bd; // B, A'nın iki arazisini işgal etti (skor 20)
      barisKararlari(d, B, Bd);
      return d;
    };
    const d = hazirla();
    expect(d.barisTeklifleri).toHaveLength(1);
    expect(d.aktifKesinti?.neden).toMatch(/B barış teklif ediyor: savaşı kazanıyor/);
    const t = d.barisTeklifleri[0];
    expect(emirVer(d, { tur: "barisCevap", teklif: t.id, kabul: true }, B).gecerli).toBe(true);
    emirleriUygula(d, B);
    expect(savasta(d, Bd, A)).toBe(false);
    expect(d.birimler[1].sahip).toBe(Bd);

    const e = hazirla();
    emirVer(e, { tur: "barisCevap", teklif: e.barisTeklifleri[0].id, kabul: false }, B);
    emirleriUygula(e, B);
    expect(savasta(e, Bd, A)).toBe(true);
    expect(e.barisTeklifleri).toHaveLength(0);

    const f = hazirla();
    for (let i = 0; i < DENGE.BARIS_TEKLIF_GUN; i++) { gunIlerlet(f, B); f.aktifKesinti = null; }
    expect(f.barisTeklifleri.filter((x) => x.id === 1)).toHaveLength(0);
    expect(f.gunluk.some((o) => /süresi doldu/.test(o.metin))).toBe(true);
    expect(degismezler(f)).toEqual([]);
  });

  it("AI savaşları sürerken kayıt/yükleme sonucu değiştirmez", () => {
    const d = yeni();
    askerAyarla(d.ordular.find((o) => o.devlet === Bd)!, 30000);
    savasAc(d, Bd, C);
    for (let i = 0; i < 20; i++) { gunIlerlet(d, B); seferKararlari(d, B); d.aktifKesinti = null; }
    const e = yukle(kaydet(d), d.senaryo);
    for (let i = 0; i < 60; i++) { gunIlerlet(d, B); gunIlerlet(e, B); d.aktifKesinti = e.aktifKesinti = null; }
    expect(durumOzeti(e)).toBe(durumOzeti(d));
  });
  it("mantık: yıkılan devletin savaşı biter; talep kurulamayan AI savaşı 4 yılda bir şekilde biter", () => {
    const d = yeni();
    savasAc(d, Bd, C);
    d.birimler.forEach((b) => { if (b.sahip === C) { b.sahip = Bd; b.kontrol = Bd; } });
    d.sehirler.forEach((c) => { if (c.devlet === C) { c.devlet = Bd; c.kontrol = Bd; } });
    yikilanDevletleriTemizle(d);
    expect(savasta(d, Bd, C)).toBe(false);
    expect(d.gunluk.some((o) => /C yıkıldığı için B ile savaşı sona erdi/.test(o.metin))).toBe(true);
    expect(d.gunluk.at(-1)?.metin).toMatch(/C yıkıldı; toprağı kalmayan .* asker dağıldı/); // TASK-0018, OPEN-024
    const e = yeni();
    e.savaslar.push({ id: e.sonrakiSavasId++, saldiran: Bd, savunan: C, baslangic: e.gun - 2 * DENGE.YZ_SAVAS_YORGUNLUK_GUN });
    barisKararlari(e, B, Bd);
    expect(savasta(e, Bd, C)).toBe(false);
    expect(degismezler(e)).toEqual([]);
  });

  it("TASK-0018 (OPEN-024): yıkılan devletin bütün orduları dağılır; diğer devletlerinki korunur", () => {
    const d = yeni();
    const ekOrdu = { ...d.ordular.find((o) => o.devlet === C)! };
    d.ordular.push({ ...ekOrdu, id: d.sonrakiOrduId++, asker: 321 }); // C'nin ikinci ordusu
    const toplamC = d.ordular.filter((o) => o.devlet === C).reduce((s, o) => s + o.asker, 0);
    const oncekiBdSayisi = d.ordular.filter((o) => o.devlet === Bd).length;
    d.birimler.forEach((b) => { if (b.sahip === C) { b.sahip = Bd; b.kontrol = Bd; } });
    d.sehirler.forEach((c) => { if (c.devlet === C) { c.devlet = Bd; c.kontrol = Bd; } });
    yikilanDevletleriTemizle(d);
    expect(d.ordular.some((o) => o.devlet === C)).toBe(false);
    expect(d.ordular.filter((o) => o.devlet === Bd)).toHaveLength(oncekiBdSayisi);
    expect(d.gunluk.at(-1)?.metin).toContain(sayiMetni(toplamC));
    expect(degismezler(d)).toEqual([]);
  });
});
