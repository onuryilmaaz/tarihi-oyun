import { describe, expect, it } from "vitest";
import { KayitHatasi, SEMA_SURUMU, durumOzeti, kaydet, turSuresiAyarla, turuIlerlet, yukle } from "../src";
import { yeniDurum } from "./yardimci";

describe("kayıt / yükleme", () => {
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
    for (const k of ["askerToplamalar", "kusatmalar", "isgalHazirliklari", "barislar", "insaatlar", "arastirmalar", "iliskiEtkileri",
      "saldirganlik", "ittifaklar", "yzSayac", "barisTeklifleri", "sonrakiTeklifId", "ateskesler", "verasetSecimi", "iskanlar",
      "yerelYonetim", "deniz", "donanmalar", "sonrakiDonanmaId", "gemiInsalari", "ambargolar", "casusGorevleri", "casusEtkileri", "sonrakiGorevId"]) delete x[k];
    for (const s of x.sehirler) for (const k of ["insanGucu", "sur", "garnizon", "yapilar", "gruplar", "istikrar", "yonetici"]) delete s[k];
    for (const v of x.devletler) for (const k of ["teknolojiler", "hukumdar", "veraset", "adHavuzu", "tarihiHalef", "din", "kultur"]) delete v[k];
    for (const b of x.birimler) delete b.verim;
    p.sema = 3; x.sema = 3;
    const g = yukle(JSON.stringify(p), d.senaryo);
    expect(g.sema).toBe(SEMA_SURUMU);
    turuIlerlet(g); // dönüştürülmüş dünya oynanabilir
    expect(g.turNo).toBe(d.turNo + 1);
  });
});
