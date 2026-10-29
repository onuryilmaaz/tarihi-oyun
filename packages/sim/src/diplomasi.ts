// TASK-0009/6a: ilişkiler, savunma ittifakı ve hediye (MASTER_SPEC §7.1–7.3, DEC-0038).
// İlişki puanı "a'nın b'ye bakışı"dır (−100 … +100) ve bileşenlerinden her istendiğinde yeniden hesaplanır;
// durumda yalnızca süreklilik isteyen parçalar tutulur (etkiler, saldırganlık, ittifaklar). Sayılar denge.ts'te [TASLAK].

import { olayEkle, type DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import type { HareketAgi } from "./hareket";
import { savasta } from "./savas";

export type IliskiNedeni = "tarih" | "savas" | "hediye" | "ittifakBozma" | "cagriReddi";
export const ILISKI_NEDEN_ADLARI: Record<IliskiNedeni, string> = {
  tarih: "Tarihî ilişki (1453)", savas: "Geçmiş savaşlar", hediye: "Hediyeler",
  ittifakBozma: "Bozulan ittifak", cagriReddi: "Reddedilen yardım çağrısı",
};

/** İki devlet arasındaki simetrik, kalıcı ya da sönümlenen etki (a < b). */
export interface IliskiEtkisi { a: number; b: number; neden: IliskiNedeni; deger: number }
export interface Ittifak { a: number; b: number; baslangic: number } // a < b

export interface IliskiBileseni { ad: string; deger: number }

/** Komşuluk ve büyüklük ön hesabı; bir sorgu dizisi boyunca bir kez çıkarılır. */
export interface DiplomasiOnHesap { n: number; komsu: Set<number>; arazi: number[] }

export function diplomasiOnHesap(d: DunyaDurumu, ag: HareketAgi | null): DiplomasiOnHesap {
  const n = d.devletler.length;
  const arazi = new Array<number>(n).fill(0);
  for (const b of d.birimler) if (b.sahip >= 0) arazi[b.sahip]++;
  const komsu = new Set<number>();
  if (ag) {
    for (const k of ag.kenarlar) {
      const x = d.birimler[ag.dugumler[k.a].b]?.sahip ?? -1, y = d.birimler[ag.dugumler[k.b].b]?.sahip ?? -1;
      if (x >= 0 && y >= 0 && x !== y) { komsu.add(x * n + y); komsu.add(y * n + x); }
    }
  }
  return { n, komsu, arazi };
}

const cift = (a: number, b: number) => (a < b ? [a, b] : [b, a]) as [number, number];
export const komsuMu = (o: DiplomasiOnHesap, a: number, b: number) => o.komsu.has(a * o.n + b);
export const muttefik = (d: DunyaDurumu, a: number, b: number) => {
  const [x, y] = cift(a, b);
  return d.ittifaklar.some((i) => i.a === x && i.b === y);
};
export const muttefikleri = (d: DunyaDurumu, a: number) =>
  d.ittifaklar.flatMap((i) => (i.a === a ? [i.b] : i.b === a ? [i.a] : []));

export function etkiDegeri(d: DunyaDurumu, a: number, b: number, neden: IliskiNedeni): number {
  const [x, y] = cift(a, b);
  return d.iliskiEtkileri.find((e) => e.a === x && e.b === y && e.neden === neden)?.deger ?? 0;
}

/** Etkiyi ekler; sonuç [enAz, enCok] aralığına kırpılır. */
export function etkiEkle(d: DunyaDurumu, a: number, b: number, neden: IliskiNedeni, deger: number, enAz = -100, enCok = 100): void {
  const [x, y] = cift(a, b);
  let e = d.iliskiEtkileri.find((v) => v.a === x && v.b === y && v.neden === neden);
  if (!e) { e = { a: x, b: y, neden, deger: 0 }; d.iliskiEtkileri.push(e); }
  e.deger = Math.max(enAz, Math.min(enCok, e.deger + deger));
  if (e.deger === 0) d.iliskiEtkileri = d.iliskiEtkileri.filter((v) => v !== e);
}

/** a'nın b'ye bakışının bileşenleri (sıfır olanlar atlanır). */
export function iliskiBilesenleri(d: DunyaDurumu, o: DiplomasiOnHesap, a: number, b: number): IliskiBileseni[] {
  const r: IliskiBileseni[] = [];
  const [x, y] = cift(a, b);
  for (const e of d.iliskiEtkileri) if (e.a === x && e.b === y) r.push({ ad: ILISKI_NEDEN_ADLARI[e.neden], deger: e.deger });
  if (muttefik(d, a, b)) r.push({ ad: "Müttefik", deger: DENGE.ILISKI_ITTIFAK });
  if (savasta(d, a, b)) r.push({ ad: "Savaştalar", deger: -DENGE.ILISKI_SAVASTA });
  const komsu = komsuMu(o, a, b);
  if (komsu && o.arazi[b] > o.arazi[a]) {
    const t = Math.min(DENGE.ILISKI_TEHDIT_EN_COK, Math.floor(((o.arazi[b] - o.arazi[a]) * 10) / Math.max(1, o.arazi[a])));
    if (t > 0) r.push({ ad: "Güçlü komşu kaygısı", deger: -t });
  }
  const saldirgan = d.saldirganlik[b] * (komsu ? DENGE.SALDIRGANLIK_KOMSU_CARPANI : 1);
  if (saldirgan > 0) r.push({ ad: "Saldırganlığı", deger: -saldirgan });
  const ortak = d.savaslar.some((s) => {
    const dusman = s.saldiran === a ? s.savunan : s.savunan === a ? s.saldiran : -1;
    return dusman >= 0 && dusman !== b && savasta(d, b, dusman);
  });
  if (ortak) r.push({ ad: "Ortak düşman", deger: DENGE.ILISKI_ORTAK_DUSMAN });
  return r;
}

export const iliski = (d: DunyaDurumu, o: DiplomasiOnHesap, a: number, b: number) =>
  Math.max(-100, Math.min(100, iliskiBilesenleri(d, o, a, b).reduce((t, x) => t + x.deger, 0)));

export function iliskiAdi(p: number): string {
  if (p >= 50) return "Dostane";
  if (p >= 15) return "İyi";
  if (p > -15) return "Tarafsız";
  if (p > -50) return "Soğuk";
  return "Düşmanca";
}

// --- Değerlendirmeler (AI cevapları; oyuncuya nedeniyle gösterilir) --------------------------------

export interface Degerlendirme { kabul: boolean; nedenler: string[] }

/** hedef, teklifEden'in savunma ittifakı teklifini kabul eder mi? */
export function ittifakDegerlendir(d: DunyaDurumu, o: DiplomasiOnHesap, teklifEden: number, hedef: number): Degerlendirme {
  const p = iliski(d, o, hedef, teklifEden);
  const nedenler: string[] = [];
  if (savasta(d, teklifEden, hedef)) nedenler.push("İki devlet savaşta.");
  const ortakSavas = muttefikleri(d, teklifEden).find((m) => savasta(d, hedef, m));
  if (ortakSavas !== undefined) nedenler.push(`${d.devletler[ortakSavas].ad} ile savaşta; o sizin müttefikiniz.`);
  const karsi = muttefikleri(d, hedef).find((m) => savasta(d, teklifEden, m));
  if (karsi !== undefined) nedenler.push(`Müttefiki ${d.devletler[karsi].ad} sizinle savaşta.`);
  if (muttefikleri(d, hedef).length >= DENGE.ITTIFAK_EN_COK) nedenler.push(`Zaten ${DENGE.ITTIFAK_EN_COK} müttefiki var.`);
  if (p < DENGE.ITTIFAK_ESIGI) nedenler.push(`Size bakışı ${p} (${iliskiAdi(p)}); en az ${DENGE.ITTIFAK_ESIGI} gerekir.`);
  if (nedenler.length) return { kabul: false, nedenler };
  return { kabul: true, nedenler: [`Size bakışı ${p} (${iliskiAdi(p)}).`] };
}

/** Bir puanın hediye bedeli: alıcının aylık arazi gelirinin oranı (küçük devlet ucuz, büyük pahalı). */
export const hediyePuanBedeli = (d: DunyaDurumu, hedef: number, o: DiplomasiOnHesap) =>
  Math.max(DENGE.HEDIYE_PUAN_EN_AZ, Math.ceil((o.arazi[hedef] * DENGE.TEST_GELIR_BIRIM_BASINA * DENGE.HEDIYE_PUAN_GELIR_BINDE) / 1000));

/** Hediyenin ekleyeceği ilişki puanı (birikme sınırı dahil). */
export function hediyePuani(d: DunyaDurumu, o: DiplomasiOnHesap, veren: number, hedef: number, miktar: number): number {
  const kalan = Math.max(0, DENGE.HEDIYE_EN_COK - etkiDegeri(d, veren, hedef, "hediye"));
  return Math.min(kalan, Math.floor(miktar / hediyePuanBedeli(d, hedef, o)));
}

// --- Olaylar ------------------------------------------------------------------------------------

/** Savaş ilanı: saldırganlık, iki taraf arasındaki etki ve savunanın müttefiklerine çağrı. */
export function savasIlaniSonuclari(d: DunyaDurumu, ag: HareketAgi | null, saldiran: number, savunan: number): void {
  d.saldirganlik[saldiran] = Math.min(DENGE.SALDIRGANLIK_EN_COK, d.saldirganlik[saldiran] + DENGE.SALDIRGANLIK_ILAN);
  etkiEkle(d, saldiran, savunan, "savas", DENGE.ETKI_SAVAS_ILANI, DENGE.ETKI_SAVAS_EN_AZ, 0);
  const o = diplomasiOnHesap(d, ag);
  for (const m of muttefikleri(d, savunan)) {
    if (m === saldiran || savasta(d, m, saldiran)) continue;
    const ad = d.devletler[m].ad, savunanAd = d.devletler[savunan].ad, saldiranAd = d.devletler[saldiran].ad;
    if (muttefik(d, m, saldiran)) {
      olayEkle(d, { tur: "ittifak-cagri", devlet: m, metin: `${ad}, iki müttefiki ${saldiranAd} ve ${savunanAd} arasındaki savaşta tarafsız kaldı.` });
      continue;
    }
    const p = iliski(d, o, m, savunan);
    if (m === d.ayarlar.oyuncu || p >= DENGE.CAGRI_ESIGI) {
      d.savaslar.push({ id: d.sonrakiSavasId++, saldiran, savunan: m, baslangic: d.gun });
      const metin = `${ad}, müttefiki ${savunanAd}'nın çağrısına uyarak ${saldiranAd} ile savaşa girdi.`;
      olayEkle(d, { tur: "ittifak-cagri", devlet: m === d.ayarlar.oyuncu ? m : saldiran, metin });
      if ([m, saldiran].includes(d.ayarlar.oyuncu) && !d.aktifKesinti) d.aktifKesinti = { gun: d.gun, neden: metin };
    } else {
      d.ittifaklar = d.ittifaklar.filter((i) => !(i.a === Math.min(m, savunan) && i.b === Math.max(m, savunan)));
      etkiEkle(d, m, savunan, "cagriReddi", DENGE.ETKI_CAGRI_REDDI);
      olayEkle(d, { tur: "ittifak-cagri", devlet: savunan === d.ayarlar.oyuncu ? savunan : m,
        metin: `${ad}, ${savunanAd}'nın yardım çağrısını reddetti (bakışı ${p}); ittifak bozuldu.` });
    }
  }
}

export function ittifakKur(d: DunyaDurumu, a: number, b: number): void {
  const [x, y] = cift(a, b);
  if (!d.ittifaklar.some((i) => i.a === x && i.b === y)) d.ittifaklar.push({ a: x, b: y, baslangic: d.gun });
}

export function ittifakBoz(d: DunyaDurumu, a: number, b: number): void {
  const [x, y] = cift(a, b);
  d.ittifaklar = d.ittifaklar.filter((i) => !(i.a === x && i.b === y));
  etkiEkle(d, a, b, "ittifakBozma", DENGE.ETKI_ITTIFAK_BOZMA);
}

/** Aylık: tarih dışındaki etkiler ve saldırganlık sıfıra doğru söner. */
export function diplomasiSonumu(d: DunyaDurumu): void {
  for (const e of d.iliskiEtkileri) {
    if (e.neden === "tarih") continue;
    e.deger = e.deger > 0 ? Math.max(0, e.deger - DENGE.ETKI_SONUM) : Math.min(0, e.deger + DENGE.ETKI_SONUM);
  }
  d.iliskiEtkileri = d.iliskiEtkileri.filter((e) => e.deger !== 0);
  d.saldirganlik = d.saldirganlik.map((s) => Math.max(0, s - DENGE.SALDIRGANLIK_SONUM));
}
