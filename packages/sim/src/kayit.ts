// Kayıt ve yükleme (ADR-0002 Karar 4). Biçim: JSON; şema sürümü ve senaryo kimliği taşır.
// Depolama (IndexedDB) istemcinin işidir; burada yalnızca serileştirme ve doğrulama vardır.

import { SEMA_SURUMU, degismezler, type DunyaDurumu } from "./durum";

export interface KayitPaketi {
  tur: "tarihi-oyun-kayit";
  sema: number;
  senaryo: string;
  durum: DunyaDurumu;
  ozet: string; // içerik özeti (10a): dosya bozulmuş ya da değiştirilmişse yüklemede yakalanır
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
  if (paket.sema !== SEMA_SURUMU) {
    // Geliştirme aşamasında eski kayıtlar taşınmaz (kullanıcı kararı, 2026-10-31)
    throw new KayitHatasi(`Bu kayıt oyunun eski bir geliştirme sürümüne ait (şema ${paket.sema}); yüklenemez. Yeni oyun başlatın.`);
  }
  if (beklenenSenaryo && paket.senaryo !== beklenenSenaryo) {
    throw new KayitHatasi(`Kayıt farklı bir senaryoya ait: ${paket.senaryo} (beklenen ${beklenenSenaryo}).`);
  }
  const d = paket.durum;
  if (!d || typeof d !== "object") throw new KayitHatasi("Kayıt eksik: dünya durumu yok.");
  if (typeof paket.ozet !== "string") throw new KayitHatasi("Kayıt eksik: içerik özeti yok.");
  const ozetUyusmuyor = durumOzeti(d) !== paket.ozet;
  if (!Array.isArray(d.devletler) || !Array.isArray(d.birimler) || !Array.isArray(d.sehirler)) {
    throw new KayitHatasi("Kayıt eksik: dünya durumu bulunamadı.");
  }
  if (!Array.isArray(d.ordular) || !Array.isArray(d.savaslar) || !Array.isArray(d.muharebeler)
    || !Array.isArray(d.emirKuyrugu) || !Array.isArray(d.gunluk)) throw new KayitHatasi("Kayıt eksik: ordu veya emir listeleri yok.");
  if (d.sema !== paket.sema) throw new KayitHatasi("Kayıt tutarsız: paket ve dünya şema sürümleri uyuşmuyor.");
  const hatalar = degismezler(d);
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
