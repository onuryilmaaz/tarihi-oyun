// Kayıt ve yükleme (ADR-0002 Karar 4). Biçim: JSON; şema sürümü ve senaryo kimliği taşır.
// Depolama (IndexedDB) istemcinin işidir; burada yalnızca serileştirme ve doğrulama vardır.

import { SEMA_SURUMU, degismezler, type DunyaDurumu } from "./durum";
import { DENGE } from "./denge";

export interface KayitPaketi {
  tur: "tarihi-oyun-kayit";
  sema: number;
  senaryo: string;
  durum: DunyaDurumu;
}

export class KayitHatasi extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = "KayitHatasi";
  }
}

export function kaydet(d: DunyaDurumu): string {
  const paket: KayitPaketi = { tur: "tarihi-oyun-kayit", sema: SEMA_SURUMU, senaryo: d.senaryo, durum: d };
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
    d.sema = SEMA_SURUMU;
  }
  if (d.sema !== SEMA_SURUMU) throw new KayitHatasi("Kayıt tutarsız: dünya şema sürümü uyuşmuyor.");
  const hatalar = degismezler(d);
  if (hatalar.length) throw new KayitHatasi(`Kayıt tutarsız: ${hatalar.slice(0, 3).join("; ")}`);
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
