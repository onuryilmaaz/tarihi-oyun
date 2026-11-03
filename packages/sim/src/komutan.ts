// TASK-0047: kurgusal komutan havuzu ve birlik deneyimi; bütün etkiler aynı sim çekirdeğinde.
import { olayEkle, type DunyaDurumu, type OrduDurumu } from "./durum";
import { DENGE } from "./denge";

export const UZMANLIKLAR = ["taarruz", "savunma", "kusatma", "ikmal"] as const;
export type Uzmanlik = typeof UZMANLIKLAR[number];
export const UZMANLIK_ADLARI: Record<Uzmanlik, string> = { taarruz: "Taarruz", savunma: "Savunma", kusatma: "Kuşatma", ikmal: "İkmal" };
export interface Komutan { id: number; devlet: number; ad: string; uzmanlik: Uzmanlik; deneyim: number }
export const komutanSeviyesi = (k: Komutan): number => Math.min(DENGE.KOMUTAN_SEVIYE_EN_COK, 1 + Math.floor(k.deneyim / DENGE.KOMUTAN_SEVIYE_DENEYIM));
export const orduKomutani = (d: DunyaDurumu, o: OrduDurumu) => d.komutanlar.find((k) => k.id === o.komutan);
export const tumOrdular = (d: DunyaDurumu): OrduDurumu[] => [...d.ordular, ...d.donanmalar.flatMap((f) => f.yuk ? [f.yuk] : [])];

/** Komutan ve kıdemin güç yüzdesi; komutansız/deneyimsiz orduda tam 100. */
export function orduDeneyimGucu(d: DunyaDurumu, o: OrduDurumu, rol: "taarruz" | "savunma" | "kusatma"): number {
  const k = orduKomutani(d, o), kidem = Math.floor(o.deneyim * DENGE.DENEYIM_GUC_EN_COK / DENGE.DENEYIM_EN_COK);
  const komutan = k ? komutanSeviyesi(k) * DENGE.KOMUTAN_GUC_SEVIYE + (k.uzmanlik === rol ? DENGE.KOMUTAN_UZMANLIK_GUC : 0) : 0;
  return 100 + kidem + komutan;
}
export function savasDeneyimiKazan(d: DunyaDurumu, o: OrduDurumu): void {
  if (o.asker <= 0) return;
  o.deneyim = Math.min(DENGE.DENEYIM_EN_COK, o.deneyim + DENGE.DENEYIM_SAVAS_GUN);
  const k = orduKomutani(d, o);
  if (k) k.deneyim = Math.min(DENGE.DENEYIM_EN_COK, k.deneyim + DENGE.KOMUTAN_SAVAS_GUN);
}
export function kayipDeneyimi(o: OrduDurumu, kayip: number): void {
  if (o.asker > 0) o.deneyim = Math.floor(o.deneyim * Math.max(0, o.asker - kayip) / o.asker);
}
export function deneyimBirlestir(a: OrduDurumu, asker: number, deneyim = 0): void {
  a.deneyim = Math.floor((a.deneyim * a.asker + deneyim * asker) / Math.max(1, a.asker + asker));
}
export function komutanYetistir(d: DunyaDurumu, devlet: number, uzmanlik: Uzmanlik): Komutan {
  const id = d.sonrakiKomutanId++;
  // İsimler kurgusaldır; gerçek tarihî kişi oldukları iddia edilmez.
  const havuz = d.devletler[devlet].adHavuzu;
  const adlar = havuz === "turk" ? ["Ali", "Hasan", "Sinan", "Yusuf"] : havuz === "slav" ? ["Ivan", "Milan", "Stefan", "Boris"]
    : havuz === "rum" ? ["Nikolaos", "Georgios", "Demetrios", "Andronikos"] : havuz === "latin" ? ["Marco", "Jean", "Henri", "Luca"]
    : havuz === "asya" ? ["Liang", "Arjun", "Temür", "Rana"] : ["Aras", "Dara", "Sami", "Leon"];
  const k = { id, devlet, ad: `${adlar[(id - 1) % adlar.length]} ${id}`, uzmanlik, deneyim: 0 };
  d.komutanlar.push(k); d.devletler[devlet].hazine -= DENGE.KOMUTAN_BEDEL;
  olayEkle(d, { tur: "komutan", devlet, metin: `${k.ad} (kurgusal), ${UZMANLIK_ADLARI[uzmanlik]} uzmanı olarak yetiştirildi. Bedel: ${DENGE.KOMUTAN_BEDEL}.` });
  return k;
}
