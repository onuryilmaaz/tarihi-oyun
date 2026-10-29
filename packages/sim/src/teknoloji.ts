// TASK-0008/5c: teknoloji ağacı (DEC-0034, DEC-0035; MASTER_SPEC §12).
// Ortak ağaç; şimdilik yalnızca oyuncu araştırır (AI Aşama 6). Bedel başta ödenir (borç yok),
// en çok ARASTIRMA_YUVASI araştırma aynı anda ve hepsi farklı alanlarda yürür.
// Etkiler ilgili sistemlerde aşağıdaki yardımcılarla uygulanır; sayılar denge.ts'te [TASLAK].

import { olayEkle, type DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import { hukumdarGucYuzde } from "./hanedan";

export type Alan = "ekonomik" | "askeri" | "idari";
export type TeknolojiId = keyof typeof DENGE.TEKNOLOJI;

export interface Teknoloji {
  id: TeknolojiId;
  ad: string;
  alan: Alan;
  onKosul: TeknolojiId[];
  etki: string;
}

export const ALAN_ADLARI: Record<Alan, string> = { ekonomik: "Ekonomik", askeri: "Askerî", idari: "İdari" };

export const TEKNOLOJILER: Teknoloji[] = [
  { id: "sulama", ad: "Sulama Teknikleri", alan: "ekonomik", onKosul: [], etki: "Tarla 4. seviyeye çıkabilir." },
  { id: "kervan", ad: "Kervan Yolları", alan: "ekonomik", onKosul: [], etki: "Pazar 4. seviyeye çıkabilir; pazar geliri seviye başına +5." },
  { id: "vergi", ad: "Para ve Vergi Reformu", alan: "ekonomik", onKosul: ["sulama", "kervan"], etki: "Arazi geliri birim başına 10 → 11." },
  { id: "top", ad: "Büyük Top Dökümü", alan: "askeri", onKosul: [], etki: "Surlara saldırıda garnizon kaybı ×1,5." },
  { id: "daimiOrdu", ad: "Daimî Ordu", alan: "askeri", onKosul: [], etki: "Ordularınız muharebede %10 daha güçlü." },
  { id: "kayit", ad: "Asker Kayıt Defterleri", alan: "askeri", onKosul: ["daimiOrdu"], etki: "Asker toplama %25 ucuz, 30 yerine 20 gün." },
  { id: "yargi", ad: "Yargı Teşkilatı", alan: "idari", onKosul: [], etki: "Yeni inşaatlar %20 daha kısa sürer." },
  { id: "sayim", ad: "Nüfus ve Vergi Sayımı", alan: "idari", onKosul: [], etki: "Şehirlerin insan gücü havuzu bir defaya mahsus +%50." },
  { id: "bayindirlik", ad: "Bayındırlık Teşkilatı", alan: "idari", onKosul: ["yargi"], etki: "Sur 6. seviyeye çıkabilir; sur inşaatı %25 ucuz." },
];

export const teknolojiBul = (id: TeknolojiId) => TEKNOLOJILER.find((t) => t.id === id)!;
export const teknolojiGecerli = (id: unknown): id is TeknolojiId => TEKNOLOJILER.some((t) => t.id === id);

export interface Arastirma {
  devlet: number;
  teknoloji: TeknolojiId;
  kalanGun: number;
}

export const biliyor = (d: DunyaDurumu, devlet: number, id: TeknolojiId) =>
  devlet >= 0 && (d.devletler[devlet]?.teknolojiler ?? []).includes(id);

// --- Etki yardımcıları -------------------------------------------------------------------------

export const araziGeliriBirimBasina = (d: DunyaDurumu, devlet: number) =>
  biliyor(d, devlet, "vergi") ? DENGE.VERGI_ARAZI_GELIRI : DENGE.TEST_GELIR_BIRIM_BASINA;
export const pazarGeliriSeviyeBasina = (d: DunyaDurumu, devlet: number) =>
  DENGE.YAPI_AYLIK_GELIR.pazar + (biliyor(d, devlet, "kervan") ? DENGE.KERVAN_PAZAR_EK_GELIR : 0);
/** Teknoloji (Daimî Ordu) ve hükümdarın askerliği (7a) birlikte. */
export const muharebeGucYuzde = (d: DunyaDurumu, devlet: number) =>
  Math.floor(((biliyor(d, devlet, "daimiOrdu") ? DENGE.DAIMI_ORDU_GUC_YUZDE : 100) * hukumdarGucYuzde(d, devlet)) / 100);
export const kusatmaSaldiriYuzde = (d: DunyaDurumu, devlet: number) => (biliyor(d, devlet, "top") ? DENGE.TOP_SALDIRI_YUZDE : 100);
export const toplamaBedelYuzde = (d: DunyaDurumu, devlet: number) => (biliyor(d, devlet, "kayit") ? DENGE.KAYIT_TOPLAMA_BEDEL_YUZDE : 100);
export const toplamaSuresi = (d: DunyaDurumu, devlet: number) => (biliyor(d, devlet, "kayit") ? DENGE.KAYIT_TOPLAMA_GUN : DENGE.TOPLAMA_GUN);
export const insaatSureYuzde = (d: DunyaDurumu, devlet: number) => (biliyor(d, devlet, "yargi") ? DENGE.YARGI_INSAAT_SURE_YUZDE : 100);
export const surBedelYuzde = (d: DunyaDurumu, devlet: number) => (biliyor(d, devlet, "bayindirlik") ? DENGE.BAYINDIRLIK_SUR_BEDEL_YUZDE : 100);
export function yapiEnYuksek(d: DunyaDurumu, devlet: number, yapi: "tarla" | "pazar" | "sur"): number {
  const acan = { tarla: "sulama", pazar: "kervan", sur: "bayindirlik" } as const;
  return biliyor(d, devlet, acan[yapi]) ? DENGE.YAPI_EN_YUKSEK_TEKNOLOJIYLE[yapi] : DENGE.YAPI_EN_YUKSEK[yapi];
}

// --- Doğrulama ve ilerleme -----------------------------------------------------------------------

/** Araştırma başlatılabilir mi? (kuyruk: emir kuyruğundaki araştırmalar da sayılır) */
export function arastirmaEngeli(d: DunyaDurumu, devlet: number, id: TeknolojiId, kuyrukHaric: boolean): string | null {
  const t = teknolojiBul(id);
  if (biliyor(d, devlet, id)) return `${t.ad} zaten biliniyor.`;
  const suren = d.arastirmalar.filter((a) => a.devlet === devlet).map((a) => a.teknoloji);
  const bekleyen = kuyrukHaric ? [] : d.emirKuyrugu.flatMap((e) => (e.tur === "arastir" && d.ayarlar.oyuncu === devlet ? [e.teknoloji] : []));
  const etkin = [...suren, ...bekleyen];
  if (etkin.includes(id)) return `${t.ad} zaten araştırılıyor ya da emri bekliyor.`;
  const eksik = t.onKosul.filter((k) => !biliyor(d, devlet, k));
  if (eksik.length) return `Önce şu teknoloji(ler) bitmeli: ${eksik.map((k) => teknolojiBul(k).ad).join(", ")}.`;
  if (etkin.length >= DENGE.ARASTIRMA_YUVASI) return `Aynı anda en çok ${DENGE.ARASTIRMA_YUVASI} araştırma yürütülebilir.`;
  if (etkin.some((x) => teknolojiBul(x).alan === t.alan)) return `${ALAN_ADLARI[t.alan]} alanında zaten bir araştırma var; iki araştırma farklı alanlarda olmalı.`;
  return null;
}

/** Günlük ilerleme; biten teknoloji devlete eklenir ve tek seferlik etkiler uygulanır. */
export function arastirmalariIlerlet(d: DunyaDurumu): void {
  for (const a of [...d.arastirmalar]) {
    a.kalanGun--;
    if (a.kalanGun > 0) continue;
    d.arastirmalar = d.arastirmalar.filter((x) => x !== a);
    const v = d.devletler[a.devlet];
    v.teknolojiler.push(a.teknoloji);
    if (a.teknoloji === "sayim") {
      for (const s of d.sehirler) {
        if (s.devlet === a.devlet) s.insanGucu += Math.floor((Math.floor((s.nufus * DENGE.INSAN_GUCU_YUZDE) / 100) * DENGE.SAYIM_INSAN_GUCU_YUZDE) / 100);
      }
    }
    olayEkle(d, { tur: "arastirma-bitti", devlet: a.devlet, metin: `${teknolojiBul(a.teknoloji).ad} araştırması tamamlandı: ${teknolojiBul(a.teknoloji).etki}` });
  }
}
