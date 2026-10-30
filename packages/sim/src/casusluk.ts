// TASK-0011/8c: casusluk görevleri (MASTER_SPEC §7.4; DEC-0051, DEC-0053).
// Görevler: askerî istihbarat (hedefin ordularını süre boyunca kesin sayıyla görme), diplomatik istihbarat (ilişkileri ve
// hazinesini görme), isyanı destekleme (hedef şehrin istikrar riskine dış destek), sabotaj (inşaatı geciktirme ya da
// garnizonu azaltma). Her görevin bedeli (borç yok), hazırlık süresi ve başarı olasılığı vardır; başarısız casus yakalanabilir
// ve hedefin bakışı bozulur. Gizli bilgi yalnızca bu yolla açılır (AT-013). Karşı istihbarat ve yanlış bilgi sonraki adıma.

import { olayEkle, type DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import { aralik } from "./rastgele";
import { etkiEkle } from "./diplomasi";

export type GorevTuru = keyof typeof DENGE.CASUS;
export const GOREV_TURLERI: GorevTuru[] = ["askeri", "diplomatik", "isyan", "sabotaj"];
export const SEHIRLI_GOREV: GorevTuru[] = ["isyan", "sabotaj"];

export interface CasusGorevi { id: number; devlet: number; hedef: number; tur: GorevTuru; sehir: number | null; kalanGun: number }
/** Süren etki: istihbarat (askerî/diplomatik) ya da şehirdeki isyan desteği; bitis gününe kadar. */
export interface CasusEtkisi { devlet: number; hedef: number; tur: "askeri" | "diplomatik" | "isyan"; sehir: number | null; bitis: number }

export const istihbaratVar = (d: DunyaDurumu, devlet: number, hedef: number, tur: "askeri" | "diplomatik") =>
  d.casusEtkileri.some((e) => e.devlet === devlet && e.hedef === hedef && e.tur === tur && e.bitis > d.gun);
/** Şehre yabancı isyan desteği (7c risk bileşeni). */
export const disDestek = (d: DunyaDurumu, sehir: number) =>
  d.casusEtkileri.some((e) => e.tur === "isyan" && e.sehir === sehir && isyanHedefiGecerli(d, e) && e.bitis > d.gun) ? DENGE.CASUS_ISYAN_RISK : 0;

const isyanHedefiGecerli = (d: DunyaDurumu, e: CasusEtkisi) =>
  e.sehir !== null && d.sehirler[e.sehir]?.devlet === e.hedef && e.devlet !== e.hedef;

/** Görevi başlatılabilir mi? (gerekçe ya da null) */
export function gorevEngeli(d: DunyaDurumu, devlet: number, hedef: number, tur: GorevTuru, sehir: number | null, bekleyen = 0): string | null {
  if (!GOREV_TURLERI.includes(tur)) return "Geçersiz görev.";
  if (!d.devletler[hedef] || hedef === devlet) return "Geçersiz hedef devlet.";
  if (SEHIRLI_GOREV.includes(tur)) {
    if (sehir === null || !d.sehirler[sehir] || d.sehirler[sehir].devlet !== hedef) return "Hedef devletin bir şehrini seçin.";
  }
  const suren = d.casusGorevleri.filter((g) => g.devlet === devlet);
  if (suren.length + bekleyen >= DENGE.CASUS_EN_COK) return `Aynı anda en çok ${DENGE.CASUS_EN_COK} görev yürütülebilir.`;
  if (suren.some((g) => g.hedef === hedef && g.tur === tur)) return "Bu hedefe aynı görev zaten sürüyor.";
  return null;
}

/** Günlük: hazırlığı biten görev sonuçlanır. */
export function casusGorevleriIlerlet(d: DunyaDurumu): void {
  const oyuncu = d.ayarlar.oyuncu;
  d.casusEtkileri = d.casusEtkileri.filter((e) => e.bitis > d.gun && (e.tur !== "isyan" || isyanHedefiGecerli(d, e)));
  for (const g of [...d.casusGorevleri]) {
    if (--g.kalanGun > 0) continue;
    d.casusGorevleri = d.casusGorevleri.filter((x) => x !== g);
    const c = DENGE.CASUS[g.tur], hedefAd = d.devletler[g.hedef].ad;
    const yer = g.sehir !== null ? ` (${d.sehirler[g.sehir].ad})` : "";
    const sehirGecerli = g.sehir === null || d.sehirler[g.sehir].devlet === g.hedef;
    if (sehirGecerli && aralik(d, 100) < c.basari) {
      let sonuc = "";
      if (g.tur === "sabotaj") {
        const s = d.sehirler[g.sehir!], ins = d.insaatlar.find((i) => i.sehir === g.sehir);
        if (ins) { ins.kalanGun += DENGE.CASUS_SABOTAJ_GUN; sonuc = `inşaat ${DENGE.CASUS_SABOTAJ_GUN} gün gecikti`; }
        else { const k = Math.floor((s.garnizon * DENGE.CASUS_SABOTAJ_GARNIZON_YUZDE) / 100); s.garnizon -= k; sonuc = `garnizon ${k} asker kaybetti`; }
      } else {
        d.casusEtkileri.push({ devlet: g.devlet, hedef: g.hedef, tur: g.tur, sehir: g.sehir, bitis: d.gun + c.sure });
        sonuc = g.tur === "isyan" ? `şehrin isyan riski ${c.sure} gün boyunca +${DENGE.CASUS_ISYAN_RISK}` : `${c.sure} gün boyunca bilgi akacak`;
      }
      if (g.devlet === oyuncu) olayEkle(d, { tur: "casusluk", devlet: oyuncu, metin: `${c.ad} başarılı — ${hedefAd}${yer}: ${sonuc}.` });
      else if (g.hedef === oyuncu && g.tur === "sabotaj") olayEkle(d, { tur: "casusluk", devlet: oyuncu, metin: `${d.sehirler[g.sehir!].ad}'da sabotaj: ${sonuc} (failler bilinmiyor).` });
      continue;
    }
    const yakalandi = aralik(d, 100) < DENGE.CASUS_YAKALANMA_YUZDE;
    if (yakalandi) etkiEkle(d, g.devlet, g.hedef, "casusluk", DENGE.CASUS_YAKALANMA_ILISKI);
    if (g.devlet === oyuncu) {
      olayEkle(d, { tur: "casusluk", devlet: oyuncu, metin: `${c.ad} başarısız — ${hedefAd}${yer}.`
        + (yakalandi ? ` Casusunuz yakalandı; ${hedefAd} size daha soğuk bakıyor (${DENGE.CASUS_YAKALANMA_ILISKI}).` : " Casus izini kaybettirdi.") });
    } else if (g.hedef === oyuncu && yakalandi) {
      olayEkle(d, { tur: "casusluk", devlet: oyuncu, metin: `${d.devletler[g.devlet].ad}'nın casusu yakalandı (${c.ad.toLowerCase()}${yer}).` });
    }
  }
}
