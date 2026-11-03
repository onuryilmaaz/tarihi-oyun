// TASK-0050: haber merkezi (herkese açık dünya olayları), yıllık güç tablosu, altı ayda bir sınır görüntüsü.
// Gizli bilgi (ordu, hazine) tutulmaz: güç tablosu şehir sayısı ve nüfusla, sınırlar yalnızca sahiplikle kaydedilir.

import type { DunyaDurumu } from "./durum";
import { gundenTarih } from "./takvim";

export type HaberKategori = "savas" | "diplomasi" | "siyaset";
export interface Haber { id: number; gun: number; kategori: HaberKategori; metin: string }
export interface GucSatiri { devlet: number; sehir: number; nufus: number }
export interface SinirFarki { gun: number; birimler: [number, number][]; sehirler: [number, number][] }

/** Herkese açık olay türleri → haber kategorisi. Diğer olaylar yalnızca oyuncunun günlüğüne düşer. */
export const HABER_TURLERI: Record<string, HaberKategori> = {
  "savas-ilani": "savas", "savas-bitti": "savas", "sehir-dustu": "savas", "ortak-baris": "savas",
  "baris": "diplomasi", "ittifak": "diplomasi", "ittifak-cagri": "diplomasi", "dunya-diplomasi": "diplomasi", "ittifak-bozuldu": "diplomasi",
  "vasal-ilhak": "diplomasi", "vasal-serbest": "diplomasi", "vasal-isyan": "diplomasi", "vasal-savasa-katildi": "diplomasi",
  "devlet-yikildi": "siyaset", "bagimsizlik": "siyaset", "hukumdar-oldu": "siyaset", "tahta-cikis": "siyaset", "baskent-tasindi": "siyaset", "ayaklanma": "siyaset",
};
export const HABER_SINIRI = 400;
export const GUC_SATIR = 20;
export const SINIR_GECMIS_SINIRI = 120;

/** Taban (başlangıç) + farklardan istenen görüntüye kadar sahiplik dizileri. */
export function sinirGoruntusu(d: DunyaDurumu, indeks: number): { birimler: number[]; sehirler: number[] } {
  const birimler = [...d.sinirTaban.birimler], sehirler = [...d.sinirTaban.sehirler];
  for (let i = 0; i <= indeks && i < d.sinirGecmisi.length; i++) {
    for (const [b, s] of d.sinirGecmisi[i].birimler) birimler[b] = s;
    for (const [c, s] of d.sinirGecmisi[i].sehirler) sehirler[c] = s;
  }
  return { birimler, sehirler };
}

/** Aylık: ocakta güç tablosu; ocak ve temmuzda sınır farkı (değişmese de tarih işareti olarak). */
export function tarihceAyi(d: DunyaDurumu): void {
  const ay = gundenTarih(d.gun).ay;
  if (ay === 1) {
    const sayac = new Map<number, GucSatiri>();
    for (const s of d.sehirler) {
      if (s.devlet < 0 || s.bagli >= 0) continue;
      const r = sayac.get(s.devlet) ?? sayac.set(s.devlet, { devlet: s.devlet, sehir: 0, nufus: 0 }).get(s.devlet)!;
      r.sehir++; r.nufus += s.nufus;
    }
    d.gucGecmisi.push({ gun: d.gun, satirlar: [...sayac.values()].sort((a, b) => b.sehir - a.sehir || b.nufus - a.nufus || a.devlet - b.devlet).slice(0, GUC_SATIR) });
    if (d.gucGecmisi.length > 60) d.gucGecmisi.shift();
  }
  if (ay === 1 || ay === 7) {
    const son = sinirGoruntusu(d, d.sinirGecmisi.length - 1);
    const fark: SinirFarki = { gun: d.gun, birimler: [], sehirler: [] };
    d.birimler.forEach((b, i) => { if (son.birimler[i] !== b.sahip) fark.birimler.push([i, b.sahip]); });
    d.sehirler.forEach((c, i) => { if (son.sehirler[i] !== c.devlet) fark.sehirler.push([i, c.devlet]); });
    d.sinirGecmisi.push(fark);
    if (d.sinirGecmisi.length > SINIR_GECMIS_SINIRI) { // en eskisi tabana katlanır
      const ilk = d.sinirGecmisi.shift()!;
      for (const [b, s] of ilk.birimler) d.sinirTaban.birimler[b] = s;
      for (const [c, s] of ilk.sehirler) d.sinirTaban.sehirler[c] = s;
    }
  }
}
