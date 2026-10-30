// TASK-0018 (2/3, DEC-0067): vasallık — yalnızca barış görüşmesinde "vasal yap" seçeneğiyle kurulur.
// Vasal toprağını/şehirlerini korur, efendisine aylık vergi öder, efendisinin savaşlarına zorunlu katılır,
// kendi başına savaş ilan edemez. Efendisi "serbest bırak" emriyle bağı koparır. Sayılar denge.ts'te [TASLAK].

import { olayEkle, type DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import { etkiEkle } from "./diplomasi";

export const efendisi = (d: DunyaDurumu, vasal: number): number | null => d.vasalliklar.find((v) => v.vasal === vasal)?.efendi ?? null;
export const vasalMi = (d: DunyaDurumu, devlet: number) => d.vasalliklar.some((v) => v.vasal === devlet);
export const vasallari = (d: DunyaDurumu, efendi: number) => d.vasalliklar.filter((v) => v.efendi === efendi).map((v) => v.vasal);

export function vasalKur(d: DunyaDurumu, efendi: number, vasal: number): void {
  d.vasalliklar = d.vasalliklar.filter((v) => v.vasal !== vasal);
  d.vasalliklar.push({ efendi, vasal, baslangic: d.gun });
}

export function vasalSerbestBirak(d: DunyaDurumu, efendi: number, vasal: number): void {
  d.vasalliklar = d.vasalliklar.filter((v) => !(v.efendi === efendi && v.vasal === vasal));
  etkiEkle(d, efendi, vasal, "vasalSerbest", DENGE.VASAL_SERBEST_ILISKI);
  olayEkle(d, { tur: "vasal-serbest", devlet: efendi === d.ayarlar.oyuncu ? efendi : vasal === d.ayarlar.oyuncu ? vasal : null,
    metin: `${d.devletler[efendi].ad}, vasalı ${d.devletler[vasal].ad}'yı serbest bıraktı.` });
}

/** Aylık: her vasal, gelirinin bir payını efendisine öder (borç oluşturmaz; vasalın hazinesi eksi olsa da zorunlu gider).
 * Döngüsel bağımlılığı önlemek için gelir dışarıdan (ekonomi.ts: prototipGelirleri) verilir. */
export function vasalVergisiAl(d: DunyaDurumu, gelir: number[]): void {
  if (!d.vasalliklar.length) return;
  for (const v of d.vasalliklar) {
    const vergi = Math.floor((gelir[v.vasal] * DENGE.VASAL_VERGI_YUZDE) / 100);
    if (!vergi) continue;
    d.devletler[v.vasal].hazine -= vergi;
    d.devletler[v.efendi].hazine += vergi;
    const oyuncu = d.ayarlar.oyuncu;
    if (v.vasal === oyuncu || v.efendi === oyuncu) {
      olayEkle(d, { tur: "vasal-vergi", devlet: oyuncu,
        metin: v.vasal === oyuncu ? `${d.devletler[v.efendi].ad}'na vasallık vergisi: −${vergi}.` : `Vasalınız ${d.devletler[v.vasal].ad}'dan vergi: +${vergi}.` });
    }
  }
}
