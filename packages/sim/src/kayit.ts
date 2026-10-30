// Kayıt ve yükleme (ADR-0002 Karar 4). Biçim: JSON; şema sürümü ve senaryo kimliği taşır.
// Depolama (IndexedDB) istemcinin işidir; burada yalnızca serileştirme ve doğrulama vardır.

import { SEMA_SURUMU, degismezler, olayEkle, type DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import { toplamaMaliyeti } from "./ordu";
import { kurgusalHukumdar } from "./hanedan";
import { bosIstikrar } from "./istikrar";
import { BILINMIYOR } from "./nufus";
import { gundenTarih } from "./takvim";
import { eskiSavasKalintilariniTemizle } from "./savas-sonu";
import { bosKompozisyon } from "./birim";

export interface KayitPaketi {
  tur: "tarihi-oyun-kayit";
  sema: number;
  senaryo: string;
  durum: DunyaDurumu;
  ozet?: string; // içerik özeti (10a): dosya bozulmuş ya da değiştirilmişse yüklemede yakalanır; eski kayıtlarda yok
}

export class KayitHatasi extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = "KayitHatasi";
  }
}

export function kaydet(d: DunyaDurumu): string {
  const paket: KayitPaketi = { tur: "tarihi-oyun-kayit", sema: SEMA_SURUMU, senaryo: d.senaryo, durum: d, ozet: durumOzeti(d) };
  return JSON.stringify(paket);
}

/** Kaydı çözer ve doğrular. Bozuk ya da uyumsuz kayıtta KayitHatasi fırlatır; durum üretmez. */
export function yukle(metin: string, beklenenSenaryo?: string): DunyaDurumu {
  let paket: KayitPaketi;
  try {
    paket = JSON.parse(metin);
  } catch {
    throw new KayitHatasi("Kayıt dosyası okunamadı (bozuk JSON).");
  }
  if (!paket || paket.tur !== "tarihi-oyun-kayit") throw new KayitHatasi("Bu bir oyun kaydı değil.");
  if (!Number.isSafeInteger(paket.sema)) throw new KayitHatasi("Kaydın şema sürümü geçersiz.");
  if (paket.sema > SEMA_SURUMU) {
    throw new KayitHatasi(`Kayıt daha yeni bir oyun sürümüyle yapılmış (şema ${paket.sema} > ${SEMA_SURUMU}).`);
  }
  if (paket.sema < 3) {
    // Şema 1 (Aşama 2 prototipi) için dönüşüm yazılmadı: senaryo verisi de değiştiği için taşınamaz.
    throw new KayitHatasi(`Bu kayıt oyunun eski bir prototip sürümüne ait (şema ${paket.sema}); taşınamaz.`);
  }
  if (beklenenSenaryo && paket.senaryo !== beklenenSenaryo) {
    throw new KayitHatasi(`Kayıt farklı bir senaryoya ait: ${paket.senaryo} (beklenen ${beklenenSenaryo}).`);
  }
  const d = paket.durum;
  if (!d || typeof d !== "object") throw new KayitHatasi("Kayıt eksik: dünya durumu yok.");
  // Özet dönüşümlerden önce, kaydedildiği hâliyle hesaplanır; uyuşmazlık doğrulamalardan sonra bildirilir (10a)
  // Özet yalnızca güncel şemada yazılır; eski şemalı kayıtlarda yoktur
  const ozetUyusmuyor = paket.sema === SEMA_SURUMU && typeof paket.ozet === "string" && durumOzeti(d) !== paket.ozet;
  if (!d || !Array.isArray(d.devletler) || !Array.isArray(d.birimler) || !Array.isArray(d.sehirler)) {
    throw new KayitHatasi("Kayıt eksik: dünya durumu bulunamadı.");
  }
  if (!Array.isArray(d.ordular) || !Array.isArray(d.savaslar) || !Array.isArray(d.muharebeler)
    || !Array.isArray(d.emirKuyrugu) || !Array.isArray(d.gunluk)) throw new KayitHatasi("Kayıt eksik: ordu veya emir listeleri yok.");
  if (d.sema !== paket.sema) throw new KayitHatasi("Kayıt tutarsız: paket ve dünya şema sürümleri uyuşmuyor.");
  if (paket.sema === 3) {
    // 4a kaydını koruyan eklemeli dönüşüm; mevcut para, ordular, savaşlar ve emirler aynen kalır.
    for (const s of d.sehirler) s.insanGucu = Math.floor(s.nufus * DENGE.INSAN_GUCU_YUZDE / 100);
    d.askerToplamalar = [];
    d.sema = 4;
  }
  if (paket.sema <= 4) {
    for (const s of d.sehirler) {
      s.sur = s.baskent ? DENGE.BASKENT_SUR : DENGE.SEHIR_SUR;
      s.garnizon = s.baskent ? DENGE.BASKENT_GARNIZON : DENGE.SEHIR_GARNIZON;
    }
    d.kusatmalar = []; d.isgalHazirliklari = []; d.barislar = [];
    d.sema = 5;
  }
  if (d.sema === 5) {
    // 5b: yapısı olmayan şehirler ve boş inşaat listesi; mevcut sur seviyeleri korunur
    for (const s of d.sehirler) s.yapilar = { tarla: 0, pazar: 0 };
    d.insaatlar = [];
    d.sema = 6;
  }
  if (d.sema === 6) {
    // Şema 6 → 7 (TASK-0008/5c): teknoloji yok, araştırma yok
    for (const v of d.devletler) v.teknolojiler = [];
    d.arastirmalar = [];
    d.sema = 7;
  }
  if (d.sema === 7) {
    // Şema 7 → 8 (TASK-0009/6a): ilişki etkisi, saldırganlık ve ittifak yok (eski kayıtta tarihî tablo da yok)
    d.iliskiEtkileri = [];
    d.saldirganlik = d.devletler.map(() => 0);
    d.ittifaklar = [];
    d.sema = 8;
  }
  if (d.sema === 8) {
    // Şema 8 → 9 (TASK-0009/6b): AI faaliyet sayacı
    d.yzSayac = { insaat: 0, arastirma: 0, asker: 0 };
    d.sema = 9;
  }
  if (d.sema === 9) {
    // Şema 9 → 10 (TASK-0009/6c): barış teklifi ve ateşkes yok
    d.barisTeklifleri = [];
    d.sonrakiTeklifId = 1;
    d.ateskesler = [];
    d.sema = 10;
  }
  if (d.sema === 10) {
    // Şema 10 → 11 (TASK-0010/7a): eski kayıtta tarihî tablo yok; her devlete nötr kurgusal hükümdar
    const yil = gundenTarih(d.gun).yil;
    d.devletler.forEach((v, i) => {
      v.hukumdar = kurgusalHukumdar(v.ad, d.tohum, i, yil, "latin", d.gun);
      v.veraset = "babadan"; v.adHavuzu = "latin"; v.tarihiHalef = null;
    });
    d.verasetSecimi = null;
    d.sema = 11;
  }
  if (d.sema === 11) {
    // Şema 11 → 12 (TASK-0010/7b): eski kayıtta tablo yok; her şehir tek "bilinmiyor" grubu
    for (const s of d.sehirler) s.gruplar = s.nufus > 0 ? [{ din: BILINMIYOR.din, kultur: BILINMIYOR.kultur, nufus: s.nufus }] : [];
    for (const v of d.devletler) { v.din = BILINMIYOR.din; v.kultur = BILINMIYOR.kultur; }
    d.iskanlar = [];
    d.sema = 12;
  }
  if (d.sema === 12) {
    d.sehirler.forEach((s, i) => {
      s.istikrar = bosIstikrar();
      const fetih = [...d.barislar].reverse().find((p) => p.devlet === s.devlet && p.sehirler.includes(i));
      s.istikrar.fetihGun = fetih?.gun ?? null;
    });
    d.sema = 13;
  }
  if (d.sema === 13) {
    // Şema 13 → 14 (TASK-0010/7d): yöneticiler kapalı, bütçe 0 (DEC-0049 varsayılanı)
    for (const s of d.sehirler) s.yonetici = false;
    d.yerelYonetim = { butce: 0, altSinir: 0, harcanan: 0 };
    d.sema = 14;
  }
  if (d.sema === 14) {
    // Şema 14 → 15 (TASK-0011/8a): eski kayıtta deniz verisi yok; deniz sistemi bu kayıtta kapalı kalır
    d.deniz = { bolgeler: [], limanlar: d.sehirler.map(() => -1), bogazlar: [] };
    d.donanmalar = []; d.sonrakiDonanmaId = 1; d.gemiInsalari = [];
    d.sema = 15;
  }
  if (d.sema === 15) {
    // Şema 15 → 16 (TASK-0011/8b): ambargo yok; eski kayıtta ticaret geçidi bilinmiyor (etkisiz)
    for (const b of d.deniz.bolgeler) b.gecit = -1;
    d.ambargolar = [];
    d.sema = 16;
  }
  if (d.sema === 16) {
    // Şema 16 → 17 (TASK-0011/8c): casus görevi yok
    d.casusGorevleri = []; d.casusEtkileri = []; d.sonrakiGorevId = 1;
    d.sema = 17;
  }
  if (d.sema === 17) {
    // Şema 17 → 18 (TASK-0012/9b): eski kayıtta verim bilinmiyor; ortalama 10 (gelir değişmez)
    for (const b of d.birimler) b.verim = 10;
    d.sema = 18;
  }
  if (d.sema === 18) {
    // Şema 18 → 19 (TASK-0017): eski kayıtta vergi oranı yok; varsayılan orta, hazine geçmişi boş
    for (const v of d.devletler) { v.vergiOrani = "orta"; v.hazineGecmisi = []; }
    d.sema = 19;
  }
  if (d.sema === 19) {
    // Şema 19 → 20 (TASK-0017): eski kayıtta toplama iptali yok; süren toplamalara kimlik ve iade bedeli eklenir
    d.askerToplamalar.forEach((t, i) => {
      t.id = i + 1;
      t.bedel = toplamaMaliyeti(t.asker); // teknoloji indirimi bilinmiyor; taban oranla iade edilir
    });
    d.sonrakiToplamaId = d.askerToplamalar.length + 1;
    d.sema = 20;
  }
  if (d.sema === 20) {
    // Şema 20 → 21 (TASK-0017): eski kayıtta ticaret anlaşması/saldırmazlık paktı yok
    d.ticaretAnlasmalari = []; d.saldirmazlikPaktlari = [];
    d.sema = 21;
  }
  if (d.sema === 21) {
    // Şema 21 → 22 (TASK-0018): eski kayıtta vasallık yok
    d.vasalliklar = [];
    d.sema = 22;
  }
  if (d.sema === 22) {
    // Şema 22 → 23 (TASK-0019): eski kayıtlarda kompozisyon yok; bütün askerler piyade sayılır
    for (const o of d.ordular) o.kompozisyon = { piyade: o.asker, okcu: 0, suvari: 0 };
    for (const t of d.askerToplamalar) t.birim = "piyade";
    d.sema = 23;
  }
  if (d.sema === 23) {
    // Şema 23 → 24 (TASK-0020): eski kayıtlarda AI'dan gelen diplomatik teklif yok
    d.diplomatikTeklifler = []; d.sonrakiDiplomatikTeklifId = 1;
    d.diplomatikTeklifSoguma = d.devletler.map(() => -DENGE.YZ_DIPLOMASI_SOGUMA_GUN);
    d.sema = 24;
  }
  if (d.sema === 24) {
    // Şema 24 → 25 (TASK-0020): eski kayıtlarda yoldaki elçi yok
    d.elciler = []; d.sonrakiElciId = 1;
    d.sema = 25;
  }
  if (d.sema === 25) {
    // Şema 25 → 26 (TASK-0021): eski kayıtlarda muharebe/rapor kayıp kompozisyonu yok; boş sayılır
    for (const m of d.muharebeler) for (const t of m.taraflar) t.kayipKompozisyon = bosKompozisyon();
    for (const r of d.muharebeRaporlari) for (const t of r.taraflar) t.kayipKompozisyon = bosKompozisyon();
    d.sema = SEMA_SURUMU;
  }
  if (d.sema !== SEMA_SURUMU) throw new KayitHatasi("Kayıt tutarsız: dünya şema sürümü uyuşmuyor.");
  let hatalar = degismezler(d);
  // İçerik özeti doğru eski H-02 kayıtlarını dar kapsamda onar; diğer bozuk veriler reddedilir.
  if (!ozetUyusmuyor && hatalar.length && hatalar.every((h) => h.startsWith("savaş ilişkisi:"))) {
    eskiSavasKalintilariniTemizle(d);
    hatalar = degismezler(d);
    if (!hatalar.length) {
      olayEkle(d, { tur: "kayit-onarildi", devlet: d.ayarlar.oyuncu,
        metin: "Eski kayıttaki sona ermiş savaşın muharebe ve işgal kalıntıları temizlendi." });
    }
  }
  if (hatalar.length) throw new KayitHatasi(`Kayıt tutarsız: ${hatalar.slice(0, 3).join("; ")}`);
  if (ozetUyusmuyor) throw new KayitHatasi("Kayıt bozulmuş ya da elle değiştirilmiş (içerik özeti tutmuyor). Önceki bir otomatik kaydı deneyin.");
  return d;
}

/** Durumun deterministik özeti (cyrb53, 53 bit, onaltılık). Determinizm testleri ve hata ayıklama için. */
export function durumOzeti(d: DunyaDurumu): string {
  const s = JSON.stringify(d);
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, "0");
}
