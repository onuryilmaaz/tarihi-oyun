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

  it("değişmezler bitmiş savaşı yakalar; eski H-02 kaydı açık günlük kaydıyla onarılır (T-02)", () => {
    const d = yeniDurum();
    const ordu = { id: 1, ad: "B Ordusu", devlet: 1, asker: 10000, dugum: 0, x: 0, y: 0, hiz: 1000,
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
    const e = yukle(kaydet(d));
    expect(e.muharebeler).toHaveLength(0);
    expect(e.ordular.every((o) => o.muharebe === null)).toBe(true);
    expect(e.birimler[8].kontrol).toBe(2);
    expect(e.sehirler[4].kontrol).toBe(2);
    expect(e.gunluk.at(-1)?.tur).toBe("kayit-onarildi");
    expect(degismezler(e)).toEqual([]);
    const p = JSON.parse(kaydet(d)); p.durum.devletler[0].hazine++;
    expect(() => yukle(JSON.stringify(p))).toThrow(KayitHatasi); // özeti bozuk dosya onarımla kabul edilmez
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
    expect(() => yukle(iyi.replace(`"sema":${SEMA_SURUMU}`, '"sema":1'))).toThrow(/eski bir prototip/);
    expect(() => yukle(iyi, "baska-senaryo@1")).toThrow(/farklı bir senaryo/);
    const p = JSON.parse(iyi);
    p.durum.devletler[0].hazine = 1.5;
    expect(() => yukle(JSON.stringify(p))).toThrow(/tutarsız/);
  });

  it("10a: içerik özeti değiştirilmiş ya da yarım kaydı yakalar; özetsiz eski kayıt yüklenir", () => {
    const iyi = kaydet(yeniDurum());
    expect(JSON.parse(iyi).ozet).toMatch(/^[0-9a-f]+$/);
    const p = JSON.parse(iyi);
    p.durum.devletler[0].hazine += 1000; // geçerli ama değiştirilmiş
    expect(() => yukle(JSON.stringify(p))).toThrow(/içerik özeti tutmuyor/);
    expect(() => yukle(iyi.slice(0, Math.floor(iyi.length / 2)))).toThrow(/bozuk JSON/); // yarım yazılmış dosya
    delete p.ozet;
    expect(yukle(JSON.stringify(p)).devletler[0].hazine).toBe(JSON.parse(iyi).durum.devletler[0].hazine + 1000);
  });

  it("10a: en eski desteklenen şemadan (3) bugüne bütün dönüşüm zinciri geçerli bir dünya üretir", () => {
    const d = yeniDurum();
    turSuresiAyarla(d, "ceyrek");
    turuIlerlet(d);
    const p = JSON.parse(kaydet(d));
    delete p.ozet;
    const x = p.durum;
    // Şema 3'te olmayan alanlar silinir; dönüşümler bunları varsayılanlarla yeniden kurmalı
    for (const k of ["askerToplamalar", "sonrakiToplamaId", "kusatmalar", "isgalHazirliklari", "barislar", "insaatlar", "arastirmalar", "iliskiEtkileri",
      "saldirganlik", "ittifaklar", "ticaretAnlasmalari", "saldirmazlikPaktlari", "yzSayac", "barisTeklifleri", "sonrakiTeklifId", "ateskesler", "verasetSecimi", "iskanlar",
      "yerelYonetim", "deniz", "donanmalar", "sonrakiDonanmaId", "gemiInsalari", "ambargolar", "casusGorevleri", "casusEtkileri", "sonrakiGorevId"]) delete x[k];
    for (const s of x.sehirler) for (const k of ["insanGucu", "sur", "garnizon", "yapilar", "gruplar", "istikrar", "yonetici"]) delete s[k];
    for (const v of x.devletler) for (const k of ["teknolojiler", "hukumdar", "veraset", "adHavuzu", "tarihiHalef", "din", "kultur", "vergiOrani", "hazineGecmisi"]) delete v[k];
    for (const b of x.birimler) delete b.verim;
    p.sema = 3; x.sema = 3;
    const g = yukle(JSON.stringify(p), d.senaryo);
    expect(g.sema).toBe(SEMA_SURUMU);
    turuIlerlet(g); // dönüştürülmüş dünya oynanabilir
    expect(g.turNo).toBe(d.turNo + 1);
  });

  it("TASK-0017: şema 18 kaydı vergi oranı orta ve boş hazine geçmişiyle 19'a taşınır", () => {
    const d = yeniDurum();
    const p = JSON.parse(kaydet(d));
    delete p.ozet;
    for (const v of p.durum.devletler) { delete v.vergiOrani; delete v.hazineGecmisi; }
    p.sema = 18; p.durum.sema = 18;
    const g = yukle(JSON.stringify(p), d.senaryo);
    expect(g.sema).toBe(SEMA_SURUMU);
    expect(g.devletler.every((v) => v.vergiOrani === "orta" && Array.isArray(v.hazineGecmisi) && v.hazineGecmisi.length === 0)).toBe(true);
  });
});
