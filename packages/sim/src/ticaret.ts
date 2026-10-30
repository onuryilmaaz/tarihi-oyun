// TASK-0011/8b: ticaret yolları (MASTER_SPEC §11.4; DEC-0051, DEC-0052).
// Temel ticaret otomatik akar: her liman şehri nüfusuna göre aylık ticaret geliri verir. Savaş ve deniz bunu keser:
// işgal/kuşatma ya da düşman kontrolündeki deniz (abluka) geliri sıfırlar; limanın denizinde düşman donanması varsa ya da
// denizin ticaret geçidi (ör. Karadeniz için İstanbul Boğazı/Marmara) düşman elindeyse gelir düşer. Ambargo hedefin
// ticaretini azaltır, koyana da küçük bir kayıp ve ilişki bedeli getirir. Sayılar denge.ts'te [TASLAK].

import type { DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import { savasta } from "./savas";
import { bolgeKontrolu } from "./deniz";
import { sehirGelirYuzde } from "./istikrar";
import { ticaretAnlasmasiVar } from "./diplomasi";

export interface Ambargo { devlet: number; hedef: number } // devlet, hedefe ambargo koydu

export interface TicaretDurumu { taban: number; gelir: number; yuzde: number; nedenler: string[] }

/** Liman şehrinin aylık ticaret geliri ve nedenleri (liman değilse taban 0). */
export function sehirTicareti(d: DunyaDurumu, sehir: number): TicaretDurumu {
  const s = d.sehirler[sehir], z = d.deniz.limanlar[sehir] ?? -1;
  if (z < 0) return { taban: 0, gelir: 0, yuzde: 0, nedenler: [] };
  const taban = Math.floor((s.nufus * DENGE.TICARET_NUFUS_BINDE) / 1000);
  const yok = (neden: string) => ({ taban, gelir: 0, yuzde: 0, nedenler: [neden] });
  if (s.kontrol !== s.devlet) return yok("Şehir işgal altında.");
  if (d.kusatmalar.some((k) => k.sehir === sehir)) return yok("Şehir kuşatma altında.");
  const bolge = d.deniz.bolgeler[z];
  const k = bolgeKontrolu(d, z);
  if (k !== null && savasta(d, k, s.devlet)) return yok(`Abluka: ${bolge.ad} düşman (${d.devletler[k].ad}) kontrolünde.`);
  let yuzde = 100;
  const nedenler: string[] = [];
  if (d.donanmalar.some((f) => f.bolge === z && savasta(d, f.devlet, s.devlet))) {
    yuzde = Math.min(yuzde, DENGE.TICARET_SAVAS_DENIZI_YUZDE);
    nedenler.push(`${bolge.ad} denizinde düşman donanması var.`);
  }
  for (let g = bolge.gecit, adim = 0; g >= 0 && adim < 8; g = d.deniz.bolgeler[g].gecit, adim++) {
    const kg = bolgeKontrolu(d, g);
    if (kg !== null && savasta(d, kg, s.devlet)) {
      yuzde = Math.floor((yuzde * DENGE.TICARET_GECIT_YUZDE) / 100);
      nedenler.push(`Ticaret geçidi ${d.deniz.bolgeler[g].ad} düşman (${d.devletler[kg].ad}) kontrolünde.`);
      break;
    }
  }
  const hedefOlan = d.ambargolar.filter((a) => a.hedef === s.devlet).length;
  const koyan = d.ambargolar.filter((a) => a.devlet === s.devlet).length;
  if (hedefOlan) { yuzde -= Math.min(DENGE.AMBARGO_HEDEF_EN_COK, hedefOlan * DENGE.AMBARGO_HEDEF_YUZDE); nedenler.push(`${hedefOlan} devletin ambargosu.`); }
  if (koyan) { yuzde -= koyan * DENGE.AMBARGO_KOYAN_YUZDE; nedenler.push(`Koyduğunuz ${koyan} ambargo kendi ticaretinizi de azaltıyor.`); }
  const ist = sehirGelirYuzde(s);
  if (ist < 100) { yuzde = Math.floor((yuzde * ist) / 100); nedenler.push(ist === 0 ? "Ayaklanma." : "Huzursuzluk."); }
  const anlasmalar = d.devletler.filter((_, i) => i !== s.devlet && ticaretAnlasmasiVar(d, s.devlet, i)).length;
  if (anlasmalar) {
    const ek = Math.min(DENGE.TICARET_ANLASMA_EN_COK_YUZDE, anlasmalar * DENGE.TICARET_ANLASMA_YUZDE);
    yuzde += ek;
    nedenler.push(`${anlasmalar} ticaret anlaşması: +%${ek}.`);
  }
  yuzde = Math.max(0, yuzde);
  return { taban, gelir: Math.floor((taban * yuzde) / 100), yuzde, nedenler };
}

/** Devlet başına aylık ticaret geliri (yasal sahibine). */
export function ticaretGelirleri(d: DunyaDurumu): number[] {
  const g = new Array<number>(d.devletler.length).fill(0);
  d.sehirler.forEach((s, i) => { if (s.devlet >= 0 && (d.deniz.limanlar[i] ?? -1) >= 0) g[s.devlet] += sehirTicareti(d, i).gelir; });
  return g;
}

export const ambargoVar = (d: DunyaDurumu, devlet: number, hedef: number) => d.ambargolar.some((a) => a.devlet === devlet && a.hedef === hedef);
