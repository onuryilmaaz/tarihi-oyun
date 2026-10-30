// TASK-0020 (2/3, DEC-0069): elçi gönderme — hediyenin ucuz ama gecikmeli alternatifi.
// Her zaman başarılı (yakalanma/başarısızlık riski ilk sürümün kapsamı dışında); yalnızca oyuncu gönderir.

import { olayEkle, type DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import { etkiDegeri, etkiEkle } from "./diplomasi";

export interface Elci { id: number; hedef: number; kalanGun: number }

/** Elçi gönderilebilir mi? (gerekçe ya da null) */
export function elciEngeli(d: DunyaDurumu, hedef: number): string | null {
  const oyuncu = d.ayarlar.oyuncu;
  if (!Number.isSafeInteger(hedef) || !d.devletler[hedef] || hedef === oyuncu) return "Geçersiz hedef devlet.";
  if (d.elciler.some((e) => e.hedef === hedef)) return "Bu devlete gönderilmiş bir elçi zaten yolda.";
  return null;
}

/** Günlük: yoldaki elçi varış gününde ilişkiye hediyeyle aynı birikim/sönüm kuralına tabi puan ekler. */
export function elciIlerlet(d: DunyaDurumu): void {
  const oyuncu = d.ayarlar.oyuncu;
  for (const e of [...d.elciler]) {
    if (--e.kalanGun > 0) continue;
    d.elciler = d.elciler.filter((x) => x !== e);
    const kalan = Math.max(0, DENGE.ELCI_EN_COK - etkiDegeri(d, oyuncu, e.hedef, "elci"));
    const puan = Math.min(kalan, DENGE.ELCI_ILISKI);
    if (puan > 0) etkiEkle(d, oyuncu, e.hedef, "elci", puan);
    olayEkle(d, { tur: "elci", devlet: oyuncu, metin: `Elçiniz ${d.devletler[e.hedef].ad}'a vardı; ilişki +${puan}.` });
  }
}
