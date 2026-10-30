// TASK-0020 (2/3, DEC-0069): elçi gönderme — hediyenin ucuz ama gecikmeli alternatifi.
// TASK-0021 (2/4, DEC-0070): varış gününde casusluğun yakalanma desenini mirror eden küçük bir
// başarısızlık/yakalanma riski taşır; yakalanırsa ilişki bozulur, bedel geri gelmez. Yalnızca oyuncu gönderir.

import { olayEkle, type DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import { aralik } from "./rastgele";
import { etkiDegeri, etkiEkle } from "./diplomasi";

export interface Elci { id: number; hedef: number; kalanGun: number }

/** Elçi gönderilebilir mi? (gerekçe ya da null) */
export function elciEngeli(d: DunyaDurumu, hedef: number): string | null {
  const oyuncu = d.ayarlar.oyuncu;
  if (!Number.isSafeInteger(hedef) || !d.devletler[hedef] || hedef === oyuncu) return "Geçersiz hedef devlet.";
  if (d.elciler.some((e) => e.hedef === hedef)) return "Bu devlete gönderilmiş bir elçi zaten yolda.";
  return null;
}

/** Günlük: yoldaki elçi varış gününde ya yakalanır (ilişki bozulur, bedel geri gelmez) ya da hediyeyle
 * aynı birikim/sönüm kuralına tabi puan ekler (TASK-0021 2/4). */
export function elciIlerlet(d: DunyaDurumu): void {
  const oyuncu = d.ayarlar.oyuncu;
  for (const e of [...d.elciler]) {
    if (--e.kalanGun > 0) continue;
    d.elciler = d.elciler.filter((x) => x !== e);
    const ad = d.devletler[e.hedef].ad;
    if (aralik(d, 100) < DENGE.ELCI_BASARISIZLIK_YUZDE) {
      etkiEkle(d, oyuncu, e.hedef, "elci", DENGE.ELCI_YAKALANMA_ILISKI);
      olayEkle(d, { tur: "elci", devlet: oyuncu, metin: `Elçiniz ${ad}'da yakalandı; ilişki bozuldu (${DENGE.ELCI_YAKALANMA_ILISKI}).` });
      continue;
    }
    const kalan = Math.max(0, DENGE.ELCI_EN_COK - etkiDegeri(d, oyuncu, e.hedef, "elci"));
    const puan = Math.min(kalan, DENGE.ELCI_ILISKI);
    if (puan > 0) etkiEkle(d, oyuncu, e.hedef, "elci", puan);
    olayEkle(d, { tur: "elci", devlet: oyuncu, metin: `Elçiniz ${ad}'a vardı; ilişki +${puan}.` });
  }
}
