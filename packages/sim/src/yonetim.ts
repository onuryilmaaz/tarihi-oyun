// TASK-0010/7d: oyuncunun yerel yöneticileri (MASTER_SPEC §11.5, OPEN-016 ilk kapsam; DEC-0049).
// Yönetici yalnızca açık olduğu şehirde, ayda bir, oyuncunun aylık bütçe tavanı ve hazine alt sınırı içinde iş yapar.
// Yetki: riskli şehre bağış (7c), sonra en kârlı tarla/pazar. Asker, sur, araştırma, diplomasi, savaş, iskân yoktur.
// Oyuncunun emirleri önce gelir: şehirde inşaat ya da bekleyen emir varsa yönetici orada iş yapmaz.
// Her harcama günlüğe yazılır; kullanılmayan bütçe birikmez; borç yoktur (DEC-0002). AI devletleri 6b kurallarıyla devam eder.

import { olayEkle, type DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import { emirDogrula, emirUygula, kullanilabilirHazine, type Baglam, type Dogrulama, type Emir } from "./emirler";
import { insaatMaliyeti, sehirdeInsaatVar, YAPI_ADLARI } from "./yatirim";
import { pazarGeliriSeviyeBasina } from "./teknoloji";

export interface YerelYonetim { butce: number; altSinir: number; harcanan: number }
export const bosYerelYonetim = (): YerelYonetim => ({ butce: 0, altSinir: 0, harcanan: 0 });

/** Oyuncu ayarı (tur süresi gibi anında uygulanır; harcama yapmaz). */
export function yerelYonetimAyarla(d: DunyaDurumu, a: { sehir?: number; acik?: boolean; butce?: number; altSinir?: number }): Dogrulama {
  if (a.sehir !== undefined) {
    const s = d.sehirler[a.sehir];
    if (!s || s.devlet !== d.ayarlar.oyuncu) return { gecerli: false, neden: "Yalnızca kendi şehrinize yönetici atayabilirsiniz." };
    s.yonetici = !!a.acik;
  }
  for (const [ad, x] of [["butce", a.butce], ["altSinir", a.altSinir]] as const) {
    if (x === undefined) continue;
    if (!Number.isSafeInteger(x) || x < 0) return { gecerli: false, neden: "Bütçe ve alt sınır sıfır veya pozitif tam sayı olmalı." };
    d.yerelYonetim[ad] = x;
  }
  return { gecerli: true };
}

/** Aylık: açık şehirlerde önce riskli şehre bağış, sonra en kârlı tarla/pazar; tavan ve alt sınır aşılmaz. */
export function yerelYoneticiler(d: DunyaDurumu, b: Baglam): void {
  const y = d.yerelYonetim, oyuncu = d.ayarlar.oyuncu;
  y.harcanan = 0;
  // Elden çıkan şehrin yöneticisi kapanır (geri alınınca oyuncu yeniden açar)
  for (const s of d.sehirler) if (s.yonetici && s.devlet !== oyuncu) s.yonetici = false;
  if (y.butce <= 0) return;
  const kalan = () => Math.min(y.butce - y.harcanan, kullanilabilirHazine(d, oyuncu) - y.altSinir);
  const elleMesgul = (i: number) => sehirdeInsaatVar(d, i) || d.emirKuyrugu.some((e) => "sehir" in e && e.sehir === i);
  const sehirler = d.sehirler.flatMap((s, i) => (s.yonetici && s.devlet === oyuncu && s.kontrol === oyuncu && !elleMesgul(i) ? [i] : []));
  const harca = (e: Emir, bedel: number, metin: string) => {
    if (bedel > kalan() || !emirDogrula(d, e, b, true).gecerli) return false;
    emirUygula(d, e, b);
    y.harcanan += bedel;
    olayEkle(d, { tur: "yerel-yonetici", devlet: oyuncu, metin: `Yerel yönetici: ${metin}, −${bedel}. (Bu ay ${y.harcanan}/${y.butce})` });
    return true;
  };
  // 1) Riskli şehre bağış: en yüksek riskten başlayarak
  const riskli = sehirler.filter((i) => d.sehirler[i].istikrar.risk >= DENGE.IST_HUZURSUZLUK && d.sehirler[i].istikrar.bagis === 0)
    .sort((i, j) => d.sehirler[j].istikrar.risk - d.sehirler[i].istikrar.risk || i - j);
  const yapilan = new Set<number>();
  for (const i of riskli) {
    if (harca({ tur: "bagis", sehir: i }, DENGE.IST_BAGIS_BEDEL, `${d.sehirler[i].ad} şehrine bağış (risk %${d.sehirler[i].istikrar.risk})`)) yapilan.add(i);
  }
  // 2) Yatırım: bedel başına en çok gelir getiren tarla/pazar; şehir başına ayda bir iş
  for (;;) {
    let en: { sehir: number; yapi: "tarla" | "pazar"; oran: number; bedel: number } | null = null;
    for (const i of sehirler) {
      if (yapilan.has(i) || sehirdeInsaatVar(d, i, true)) continue;
      for (const yapi of ["tarla", "pazar"] as const) {
        const bedel = insaatMaliyeti(d, d.sehirler[i], yapi);
        if (bedel === null || bedel > kalan()) continue;
        const gelir = yapi === "tarla" ? DENGE.YAPI_AYLIK_GELIR.tarla : pazarGeliriSeviyeBasina(d, oyuncu);
        const oran = Math.floor((gelir * 100000) / bedel);
        if (!en || oran > en.oran) en = { sehir: i, yapi, oran, bedel };
      }
    }
    if (!en) break;
    yapilan.add(en.sehir);
    harca({ tur: "insaat", sehir: en.sehir, yapi: en.yapi }, en.bedel, `${d.sehirler[en.sehir].ad} şehrinde ${YAPI_ADLARI[en.yapi]} yatırımı`);
  }
}
