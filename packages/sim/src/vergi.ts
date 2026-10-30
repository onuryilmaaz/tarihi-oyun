// TASK-0017 (DEC-0066): vergi oranı — arazi ve yapı gelirini artırır/azaltır, istikrar riskini etkiler.
// Teknoloji ağacındaki "vergi" (Para ve Vergi Reformu) ile karıştırılmamalı; o birim başına taban geliri değiştirir,
// bu oran o gelire ayrıca uygulanan bir çarpandır. Sayılar denge.ts'te [TASLAK].

import type { DunyaDurumu } from "./durum";
import { DENGE } from "./denge";

export type VergiOrani = "dusuk" | "orta" | "yuksek";
export const VERGI_ORANLARI: VergiOrani[] = ["dusuk", "orta", "yuksek"];
export const VERGI_ADLARI: Record<VergiOrani, string> = { dusuk: "Düşük", orta: "Orta", yuksek: "Yüksek" };

export const vergiOraniGecerli = (x: unknown): x is VergiOrani => VERGI_ORANLARI.includes(x as VergiOrani);

/** Arazi + yapı gelirine uygulanan yüzde (100 = etkisiz). */
export const vergiGelirYuzde = (d: DunyaDurumu, devlet: number): number =>
  DENGE.VERGI_ORANI_GELIR_YUZDE[d.devletler[devlet]?.vergiOrani ?? "orta"];

/** İstikrar risk bileşenine eklenen puan (düşük vergi küçük bir indirim verir). */
export const vergiRiskPuani = (d: DunyaDurumu, devlet: number): number =>
  DENGE.VERGI_ORANI_RISK_PUANI[d.devletler[devlet]?.vergiOrani ?? "orta"];
