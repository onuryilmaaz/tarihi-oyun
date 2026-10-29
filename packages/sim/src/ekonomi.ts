// TASK-0008/5a: mevcut kuralların bütçe sorgusu. Yeni gelir/gider yaratmaz.
// Arazi geliri hâlâ test sistemidir; gerçek üretim/vergi modeli sonraki teslimde tasarlanacak.
import type { DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import { kullanilabilirHazine } from "./emirler";
import { devletMaasi } from "./ordu";
import { sehirYapiGeliri } from "./yatirim";
import { ticaretGelirleri } from "./ticaret";
import { araziGeliriBirimBasina } from "./teknoloji";
import { birimGelirYuzdeleri } from "./istikrar";
import { hukumdarGelirYuzde } from "./hanedan";

export interface ButceOzeti {
  hazine: number;
  ayrilan: number;
  kullanilabilir: number;
  aylikGelir: number; // arazi + yapı
  aylikAraziGeliri: number;
  aylikYapiGeliri: number;
  aylikTicaretGeliri: number; // liman ticareti (8b)
  aylikMaas: number;
  aylikNet: number;
  araziSayisi: number;
  askerSayisi: number;
}

/** Arazi test geliri (yasal sahip başına). */
export function araziGelirleri(d: DunyaDurumu): number[] {
  const gelir = new Array<number>(d.devletler.length).fill(0);
  const birimBasina = d.devletler.map((_, i) => araziGeliriBirimBasina(d, i)); // Para ve Vergi Reformu (5c)
  const etki = birimGelirYuzdeleri(d);
  // Arazi verimi (9b): 10 ortalama; birim başına gelir verimle ölçeklenir
  d.birimler.forEach((b, i) => { if (b.sahip >= 0) gelir[b.sahip] += Math.floor((birimBasina[b.sahip] * b.verim * etki[i]) / 1000); });
  return gelir.map((g, i) => Math.floor((g * hukumdarGelirYuzde(d, i)) / 100)); // hükümdarın yönetimi (7a)
}

/** Şehir yapılarından gelen gelir (TASK-0008/5b). */
export function yapiGelirleri(d: DunyaDurumu): number[] {
  const gelir = new Array<number>(d.devletler.length).fill(0);
  for (const s of d.sehirler) gelir[s.devlet] += sehirYapiGeliri(d, s);
  return gelir;
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
    askerSayisi: d.ordular.filter((o) => o.devlet === devlet).reduce((s, o) => s + o.asker, 0) };
}
