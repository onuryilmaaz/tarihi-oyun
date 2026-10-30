// TASK-0008/5a: mevcut kuralların bütçe sorgusu. Yeni gelir/gider yaratmaz.
// Arazi geliri hâlâ test sistemidir; gerçek üretim/vergi modeli sonraki teslimde tasarlanacak.
import type { DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import { kullanilabilirHazine } from "./emirler";
import { devletMaasi, toplamAskerSayisi } from "./ordu";
import { sehirYapiGeliri } from "./yatirim";
import { sehirTicareti, ticaretGelirleri } from "./ticaret";
import { araziGeliriBirimBasina } from "./teknoloji";
import { birimGelirYuzdeleri } from "./istikrar";
import { hukumdarGelirYuzde } from "./hanedan";
import { vergiGelirYuzde, type VergiOrani } from "./vergi";

export interface ButceOzeti {
  hazine: number;
  ayrilan: number;
  kullanilabilir: number;
  aylikGelir: number; // arazi + yapı + ticaret
  aylikAraziGeliri: number;
  aylikYapiGeliri: number;
  aylikTicaretGeliri: number; // liman ticareti (8b)
  aylikMaas: number;
  aylikNet: number;
  araziSayisi: number;
  askerSayisi: number;
  vergiOrani: VergiOrani; // TASK-0017
  sehirler: SehirGelirOzeti[];
  hazineGecmisi: number[]; // en eski başta
}

/** Arazi test geliri (yasal sahip başına); vergi oranı (TASK-0017) burada da uygulanır. */
export function araziGelirleri(d: DunyaDurumu): number[] {
  const gelir = new Array<number>(d.devletler.length).fill(0);
  const birimBasina = d.devletler.map((_, i) => araziGeliriBirimBasina(d, i)); // Para ve Vergi Reformu (5c)
  const etki = birimGelirYuzdeleri(d);
  // Arazi verimi (9b): 10 ortalama; birim başına gelir verimle ölçeklenir
  d.birimler.forEach((b, i) => { if (b.sahip >= 0) gelir[b.sahip] += Math.floor((birimBasina[b.sahip] * b.verim * etki[i]) / 1000); });
  return gelir.map((g, i) => Math.floor((Math.floor((g * hukumdarGelirYuzde(d, i)) / 100) * vergiGelirYuzde(d, i)) / 100)); // hükümdar (7a) + vergi oranı
}

/** Şehir yapılarından gelen gelir (TASK-0008/5b); vergi oranı (TASK-0017) burada da uygulanır. */
export function yapiGelirleri(d: DunyaDurumu): number[] {
  const gelir = new Array<number>(d.devletler.length).fill(0);
  for (const s of d.sehirler) gelir[s.devlet] += sehirYapiGeliri(d, s);
  return gelir.map((g, i) => Math.floor((g * vergiGelirYuzde(d, i)) / 100));
}

export interface SehirGelirOzeti { sehir: number; ad: string; yapiGeliri: number; ticaretGeliri: number; toplam: number }

/** Bütçe panelinde şehir bazlı döküm: yapı ve ticaret geliri (arazi geliri poligon bazlıdır, şehre özgü değildir). */
export function sehirGelirOzetleri(d: DunyaDurumu, devlet: number): SehirGelirOzeti[] {
  const yuzde = vergiGelirYuzde(d, devlet);
  return d.sehirler.map((s, i) => ({ s, i })).filter(({ s }) => s.devlet === devlet).map(({ s, i }) => {
    const yapiGeliri = Math.floor((sehirYapiGeliri(d, s) * yuzde) / 100);
    const ticaretGeliri = sehirTicareti(d, i).gelir;
    return { sehir: i, ad: s.ad, yapiGeliri, ticaretGeliri, toplam: yapiGeliri + ticaretGeliri };
  });
}

/** Ay başındaki gelirle arayüzün aynı hesabı kullanmasını sağlar (arazi + yapı). */
export function prototipGelirleri(d: DunyaDurumu): number[] {
  const a = araziGelirleri(d), y = yapiGelirleri(d), t = ticaretGelirleri(d);
  return a.map((x, i) => x + y[i] + t[i]);
}

/** O anki arazi ve ordular korunursa aylık düzenli fark; gerçekleşmiş işlem dökümü değildir. */
export function butceOzeti(d: DunyaDurumu, devlet: number): ButceOzeti {
  const hazine = d.devletler[devlet].hazine;
  const kullanilabilir = kullanilabilirHazine(d, devlet);
  const aylikAraziGeliri = araziGelirleri(d)[devlet], aylikYapiGeliri = yapiGelirleri(d)[devlet], aylikTicaretGeliri = ticaretGelirleri(d)[devlet];
  const aylikGelir = aylikAraziGeliri + aylikYapiGeliri + aylikTicaretGeliri, aylikMaas = devletMaasi(d, devlet);
  return { hazine, ayrilan: hazine - kullanilabilir, kullanilabilir, aylikGelir, aylikAraziGeliri, aylikYapiGeliri, aylikTicaretGeliri, aylikMaas,
    aylikNet: aylikGelir - aylikMaas,
    araziSayisi: d.birimler.filter((b) => b.sahip === devlet).length,
    askerSayisi: toplamAskerSayisi(d, devlet),
    vergiOrani: d.devletler[devlet].vergiOrani,
    sehirler: sehirGelirOzetleri(d, devlet),
    hazineGecmisi: d.devletler[devlet].hazineGecmisi };
}
