// TASK-0045: askerî geçiş yönlüdür; toprağın sahibi izin verir, izin sahiplik veya ikmal hakkı değildir.
import { olayEkle, type DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import { iliski, muttefik, muttefikleri, type Degerlendirme, type DiplomasiOnHesap } from "./diplomasi";
import { savasta } from "./savas";
import { gecilebilir, orduKonumu } from "./hareket";
import type { Baglam } from "./emirler";

export interface GecisIzni { veren: number; alan: number; baslangic: number; bitis: number }
export const gecisIzni = (d: DunyaDurumu, veren: number, alan: number) =>
  d.gecisIzinleri.find((g) => g.veren === veren && g.alan === alan && g.bitis > d.gun);

export function gecisDegerlendir(d: DunyaDurumu, on: DiplomasiOnHesap, isteyen: number, hedef: number): Degerlendirme {
  const nedenler: string[] = [], p = iliski(d, on, hedef, isteyen);
  if (savasta(d, isteyen, hedef)) nedenler.push("İki devlet savaşta.");
  if (muttefikleri(d, hedef).some((m) => savasta(d, isteyen, m))) nedenler.push("Müttefikiyle savaştasınız.");
  if (!muttefik(d, isteyen, hedef) && p < DENGE.GECIS_ILISKI_ESIGI) nedenler.push(`İlişki ${p}; en az ${DENGE.GECIS_ILISKI_ESIGI} veya ittifak gerekir.`);
  return { kabul: !nedenler.length, nedenler: nedenler.length ? nedenler : [`İlişki ${p}; askerî geçiş kabul edilebilir.`] };
}

export function gecisVer(d: DunyaDurumu, veren: number, alan: number, ay: number): void {
  d.gecisIzinleri = d.gecisIzinleri.filter((g) => g.veren !== veren || g.alan !== alan);
  d.gecisIzinleri.push({ veren, alan, baslangic: d.gun, bitis: d.gun + ay * DENGE.GECIS_AY_GUN });
  olayEkle(d, { tur: "askeri-gecis", devlet: [veren, alan].includes(d.ayarlar.oyuncu) ? d.ayarlar.oyuncu : null,
    metin: `${d.devletler[veren].ad}, ${d.devletler[alan].ad} ordularına ${ay} aylık geçiş izni verdi.` });
}

/** İptalde/süre sonunda ordu bulunduğu yerde durur; yabancı topraklara ışınlanmaz veya işgal hakkı kazanmaz. */
export function gecisleriDenetle(d: DunyaDurumu, b: Baglam): void {
  for (const g of d.gecisIzinleri) if (g.bitis <= d.gun || savasta(d, g.veren, g.alan)) {
    olayEkle(d, { tur: "askeri-gecis", devlet: [g.veren, g.alan].includes(d.ayarlar.oyuncu) ? d.ayarlar.oyuncu : null,
      metin: `${d.devletler[g.veren].ad} → ${d.devletler[g.alan].ad} geçiş izni sona erdi.` });
  }
  d.gecisIzinleri = d.gecisIzinleri.filter((g) => g.bitis > d.gun && !savasta(d, g.veren, g.alan));
  if (!b.ag) return;
  for (const o of d.ordular) {
    if (!o.rota.some((a) => !gecilebilir(d, b.ag!, a.d, o.devlet))) continue;
    const p = orduKonumu(o); o.x = p.x; o.y = p.y;
    o.rota = []; o.ilerleme = 0; o.hedef = null;
    olayEkle(d, { tur: "rota-durdu", devlet: o.devlet, metin: `${o.ad}: güzergâhtaki askerî erişim değişti; yürüyüş bulunduğu konumda durdu.` });
  }
}
