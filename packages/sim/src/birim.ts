// TASK-0019 (1/4, DEC-0068): birim çeşitliliği — piyade/okçu/süvari.
// OrduDurumu.asker toplamı korunur (kapasite, asayiş, görünürlük, donanma yükü değişmez); kompozisyon yalnızca
// maliyet, maaş, muharebe gücü ve hareket hızı hesaplarında kullanılır. Sayılar denge.ts'te [TASLAK].

import { DENGE } from "./denge";

export type BirimTuru = keyof typeof DENGE.BIRIM;
export const BIRIM_TURLERI: BirimTuru[] = ["piyade", "okcu", "suvari"];
export const BIRIM_ADLARI: Record<BirimTuru, string> = Object.fromEntries(BIRIM_TURLERI.map((t) => [t, DENGE.BIRIM[t].ad])) as Record<BirimTuru, string>;
export const birimTuruGecerli = (x: unknown): x is BirimTuru => BIRIM_TURLERI.includes(x as BirimTuru);

export type Kompozisyon = Record<BirimTuru, number>;
export const bosKompozisyon = (): Kompozisyon => ({ piyade: 0, okcu: 0, suvari: 0 });
export const kompozisyonToplami = (k: Kompozisyon): number => BIRIM_TURLERI.reduce((s, t) => s + k[t], 0);
export const tekTurKompozisyon = (birim: BirimTuru, asker: number): Kompozisyon => ({ ...bosKompozisyon(), [birim]: asker });

export function kompozisyonTopla(a: Kompozisyon, b: Kompozisyon): Kompozisyon {
  const r = bosKompozisyon();
  for (const t of BIRIM_TURLERI) r[t] = a[t] + b[t];
  return r;
}

/** Orandan bağımsız, her türden isteneni döndürecek kadar düşer; tam sayı korunur (kayıp/bölme ortak kullanır).
 * Pay, her türün payına göre taban alınır; kalan birimler en büyük türden başlanarak dağıtılır (deterministik). */
export function kompozisyonOransalAl(k: Kompozisyon, miktar: number): Kompozisyon {
  const toplam = kompozisyonToplami(k);
  if (miktar <= 0 || toplam <= 0) return bosKompozisyon();
  if (miktar >= toplam) return { ...k };
  const sonuc = bosKompozisyon();
  let alinan = 0;
  const kalanlar: { tur: BirimTuru; kalan: number }[] = [];
  for (const t of BIRIM_TURLERI) {
    const pay = Math.floor((k[t] * miktar) / toplam);
    sonuc[t] = pay;
    alinan += pay;
    kalanlar.push({ tur: t, kalan: (k[t] * miktar) % toplam });
  }
  // Yuvarlamadan kalan farkı, en büyük kalana sahip türden başlayarak (eşitlikte sabit sırayla) dağıt.
  kalanlar.sort((a, b) => b.kalan - a.kalan || BIRIM_TURLERI.indexOf(a.tur) - BIRIM_TURLERI.indexOf(b.tur));
  let eksik = miktar - alinan;
  for (const { tur } of kalanlar) {
    if (eksik <= 0) break;
    const ekSinir = k[tur] - sonuc[tur];
    const ek = Math.min(eksik, ekSinir);
    sonuc[tur] += ek;
    eksik -= ek;
  }
  return sonuc;
}

export function kompozisyonCikar(k: Kompozisyon, alinan: Kompozisyon): Kompozisyon {
  const r = bosKompozisyon();
  for (const t of BIRIM_TURLERI) r[t] = Math.max(0, k[t] - alinan[t]);
  return r;
}

export const toplamaMaliyetiYuzde = (birim: BirimTuru): number => DENGE.BIRIM[birim].maliyetYuzde;
export const aylikMaasYuzde = (birim: BirimTuru): number => DENGE.BIRIM[birim].maasYuzde;
export const saldiriYuzde = (birim: BirimTuru): number => DENGE.BIRIM[birim].saldiriYuzde;
export const savunmaYuzde = (birim: BirimTuru): number => DENGE.BIRIM[birim].savunmaYuzde;
export const hizYuzde = (birim: BirimTuru): number => DENGE.BIRIM[birim].hizYuzde;

/** Kompozisyonun ağırlıklı ortalama hız yüzdesi (100 = taban); boş kompozisyonda 100. */
export function kompozisyonHizYuzde(k: Kompozisyon): number {
  const toplam = kompozisyonToplami(k);
  if (!toplam) return 100;
  return Math.round(BIRIM_TURLERI.reduce((s, t) => s + k[t] * hizYuzde(t), 0) / toplam);
}

/** Kompozisyonun ağırlıklı ortalama saldırı/savunma yüzdesi (100 = taban); boş kompozisyonda 100.
 * TASK-0019 (2/4): muharebe ve kuşatma gücüne çarpan olarak uygulanır. */
export function kompozisyonMuharebeYuzde(k: Kompozisyon, savunuyor: boolean): number {
  const toplam = kompozisyonToplami(k);
  if (!toplam) return 100;
  const yuzde = savunuyor ? savunmaYuzde : saldiriYuzde;
  return Math.round(BIRIM_TURLERI.reduce((s, t) => s + k[t] * yuzde(t), 0) / toplam);
}
