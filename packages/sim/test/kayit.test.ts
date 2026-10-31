import { describe, expect, it } from "vitest";
import { KayitHatasi, SEMA_SURUMU, degismezler, durumOzeti, kaydet, muharebeleriBaslat, turSuresiAyarla, turuIlerlet, yukle } from "../src";
import { yeniDurum } from "./yardimci";

describe("kayıt / yükleme", () => {
  it("kesirli, eksik ve aralık dışı oyuncu indeksi özeti doğru olsa da reddedilir (K-01)", () => {
    for (const oyuncu of [0.5, -1, 999, null, "0", undefined]) {
      const p = JSON.parse(kaydet(yeniDurum()));
      p.durum.ayarlar.oyuncu = oyuncu;
      p.ozet = durumOzeti(p.durum);
      expect(() => yukle(JSON.stringify(p))).toThrow(/oyuncu devleti geçersiz/);
    }
  });

  it("değişmezler bitmiş savaşı yakalar; böyle bir kayıt yüklenmez (T-02)", () => {
    const d = yeniDurum();
    const ordu = { id: 1, ad: "B Ordusu", devlet: 1, asker: 10000, kompozisyon: { piyade: 10000, okcu: 0, suvari: 0 }, dugum: 0, x: 0, y: 0, hiz: 1000,
      rota: [], ilerleme: 0, hedef: null, moral: 1000, tutum: "dengeli" as const, cekiliyor: false, muharebe: null };
    d.ordular = [ordu, { ...ordu, id: 2, ad: "C Ordusu", devlet: 2 }];
    d.sonrakiOrduId = 3;
    d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: 1, savunan: 2, baslangic: d.gun });
    muharebeleriBaslat(d);
    d.savaslar = []; // eski hata: savaş silinmiş, muharebe ve işgal kalmış
    d.birimler.forEach((b) => { if (b.sahip === 1) b.sahip = b.kontrol = 0; });
    d.sehirler.forEach((s) => { if (s.devlet === 1) s.devlet = s.kontrol = 0; });
    d.birimler[8].kontrol = 1;
    d.sehirler[4].kontrol = 1;
    expect(degismezler(d)).toEqual(expect.arrayContaining([
      expect.stringContaining("bitmiş savaşa"), expect.stringContaining("araziyi yıkılmış"), expect.stringContaining("şehri yıkılmış"),
    ]));
    expect(() => yukle(kaydet(d))).toThrow(/tutarsız/); // tutarsız dünya kaydedilse de yüklenmez
  });
  it("AT-016 iskeleti: kaydet → yükle → devam = kesintisiz devam", () => {
    const a = yeniDurum();
    turSuresiAyarla(a, "ceyrek");
    for (let i = 0; i < 3; i++) turuIlerlet(a);
    const b = yukle(kaydet(a), a.senaryo);
    expect(durumOzeti(b)).toBe(durumOzeti(a));
    for (let i = 0; i < 6; i++) { turuIlerlet(a); turuIlerlet(b); }
    expect(durumOzeti(b)).toBe(durumOzeti(a));
  });

  it("bozuk kayıtlar güvenli hata verir", () => {
    const iyi = kaydet(yeniDurum());
    expect(() => yukle("{bozuk")).toThrow(KayitHatasi);
    expect(() => yukle(JSON.stringify({ tur: "baska" }))).toThrow(/oyun kaydı değil/);
    expect(() => yukle(iyi.replace(`"sema":${SEMA_SURUMU}`, '"sema":99'))).toThrow(/daha yeni/);
    expect(() => yukle(iyi.replace(`"sema":${SEMA_SURUMU}`, '"sema":1'))).toThrow(/eski bir geliştirme sürümüne/);
    expect(() => yukle(iyi, "baska-senaryo@1")).toThrow(/farklı bir senaryo/);
    const p = JSON.parse(iyi);
    p.durum.devletler[0].hazine = 1.5;
    expect(() => yukle(JSON.stringify(p))).toThrow(/tutarsız/);
  });

  it("10a: içerik özeti değiştirilmiş, özetsiz ya da yarım kaydı yakalar", () => {
    const iyi = kaydet(yeniDurum());
    expect(JSON.parse(iyi).ozet).toMatch(/^[0-9a-f]+$/);
    const p = JSON.parse(iyi);
    p.durum.devletler[0].hazine += 1000; // geçerli ama değiştirilmiş
    expect(() => yukle(JSON.stringify(p))).toThrow(/içerik özeti tutmuyor/);
    expect(() => yukle(iyi.slice(0, Math.floor(iyi.length / 2)))).toThrow(/bozuk JSON/); // yarım yazılmış dosya
    delete p.ozet;
    expect(() => yukle(JSON.stringify(p))).toThrow(/içerik özeti yok/);
  });

});
