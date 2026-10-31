// TASK-0008/5b: şehir yatırımları (DEC-0033). Tarla ve pazar aylık gelir, sur kuşatma direnci verir.
// Bedel emir verilince ayrılır, tur başında hazineden düşülür (borç yok, DEC-0002); yapım süreklidir.
// Sayılar denge.ts içinde [TASLAK].

import { olayEkle, type DunyaDurumu, type SehirDurumu } from "./durum";
import { sehirGelirYuzde } from "./istikrar";
import { DENGE } from "./denge";
import { insaatSureYuzde, pazarGeliriSeviyeBasina, surBedelYuzde, yapiEnYuksek } from "./teknoloji";
import { gelismislikDegistir, gelismislikYuzde, kaynakYapiYuzde } from "./sehir";

export type YapiTuru = "tarla" | "pazar" | "sur";
export const YAPI_TURLERI: YapiTuru[] = ["tarla", "pazar", "sur"];
export const YAPI_ADLARI: Record<YapiTuru, string> = { tarla: "Tarla", pazar: "Pazar", sur: "Sur" };

export interface Insaat {
  sehir: number;
  devlet: number;
  yapi: YapiTuru;
  hedef: number; // tamamlanınca ulaşılacak seviye
  kalanGun: number;
}

export const yapiSeviyesi = (s: SehirDurumu, yapi: YapiTuru) => (yapi === "sur" ? s.sur : s.yapilar[yapi]);

/** Sahibinin teknolojilerine göre bir sonraki seviyenin bedeli; en yüksek seviyedeyse null. */
export function insaatMaliyeti(d: DunyaDurumu, s: SehirDurumu, yapi: YapiTuru): number | null {
  const hedef = yapiSeviyesi(s, yapi) + 1;
  if (hedef > yapiEnYuksek(d, s.devlet, yapi)) return null;
  const bedel = DENGE.YAPI_MALIYET[yapi][hedef - 1];
  return yapi === "sur" ? Math.ceil(bedel * surBedelYuzde(d, s.devlet) / 100) : bedel;
}

/** Yeni başlayacak inşaatın süresi (Yargı Teşkilatı kısaltır). */
export const insaatSuresi = (d: DunyaDurumu, devlet: number, yapi: YapiTuru) =>
  Math.ceil(DENGE.YAPI_SURE_GUN[yapi] * insaatSureYuzde(d, devlet) / 100);

/** Şehrin yapılarından gelen aylık gelir (şehir yasal sahibinin askerî kontrolündeyken). */
export function sehirYapiGeliri(d: DunyaDurumu, s: SehirDurumu): number {
  if (s.kontrol !== s.devlet) return 0;
  // TASK-0028: gelir kaynağı yapının, gelişmişlik bütün şehrin gelirini çarpar
  const ham = Math.floor((s.yapilar.tarla * DENGE.YAPI_AYLIK_GELIR.tarla * kaynakYapiYuzde(s, "tarla")
    + s.yapilar.pazar * pazarGeliriSeviyeBasina(d, s.devlet) * kaynakYapiYuzde(s, "pazar")) / 100);
  return Math.floor((Math.floor((ham * gelismislikYuzde(s)) / 100) * sehirGelirYuzde(s)) / 100);
}

/** Bekleyen ya da süren bir inşaat varsa kimliği; şehir başına aynı anda tek inşaat. */
export function sehirdeInsaatVar(d: DunyaDurumu, sehir: number, kuyrukHaric = false): boolean {
  return d.insaatlar.some((i) => i.sehir === sehir)
    || (!kuyrukHaric && d.emirKuyrugu.some((e) => e.tur === "insaat" && e.sehir === sehir));
}

/** Kuşatma yoksa günde bir gün ilerler; şehir el değiştirirse inşaat iptal olur (bedel geri verilmez). */
export function insaatlariIlerlet(d: DunyaDurumu): void {
  for (const i of [...d.insaatlar]) {
    const s = d.sehirler[i.sehir];
    const sil = () => { d.insaatlar = d.insaatlar.filter((x) => x !== i); };
    if (s.devlet !== i.devlet || s.kontrol !== i.devlet) {
      sil();
      olayEkle(d, { tur: "insaat-iptal", devlet: i.devlet, metin: `${s.ad}: ${YAPI_ADLARI[i.yapi]} inşaatı şehir el değiştirdiği için yarım kaldı.` });
      continue;
    }
    if (s.istikrar.ayaklanma || d.kusatmalar.some((k) => k.sehir === i.sehir)) continue; // kuşatma altında iş durur
    i.kalanGun--;
    if (i.kalanGun > 0) continue;
    if (i.yapi === "sur") s.sur = i.hedef;
    else {
      s.yapilar[i.yapi] = i.hedef;
      if ((s.yapilar.tarla + s.yapilar.pazar) % 2 === 0) gelismislikDegistir(s, 1); // her iki yatırım seviyesinde +1 (TASK-0028)
    }
    sil();
    olayEkle(d, { tur: "insaat-bitti", devlet: i.devlet, metin: `${s.ad}: ${YAPI_ADLARI[i.yapi]} ${i.hedef}. seviyeye yükseldi.` });
  }
}
