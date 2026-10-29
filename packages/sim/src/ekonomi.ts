// TASK-0008/5a: mevcut kuralların bütçe sorgusu. Yeni gelir/gider yaratmaz.
// Arazi geliri hâlâ test sistemidir; gerçek üretim/vergi modeli sonraki teslimde tasarlanacak.
import type { DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import { kullanilabilirHazine } from "./emirler";
import { devletMaasi } from "./ordu";
import { sehirYapiGeliri } from "./yatirim";

export interface ButceOzeti {
  hazine: number;
  ayrilan: number;
  kullanilabilir: number;
  aylikGelir: number; // arazi + yapı
  aylikAraziGeliri: number;
  aylikYapiGeliri: number;
  aylikMaas: number;
  aylikNet: number;
  araziSayisi: number;
  askerSayisi: number;
}

/** Arazi test geliri (yasal sahip başına). */
export function araziGelirleri(d: DunyaDurumu): number[] {
  const gelir = new Array<number>(d.devletler.length).fill(0);
  for (const b of d.birimler) if (b.sahip >= 0) gelir[b.sahip] += DENGE.TEST_GELIR_BIRIM_BASINA;
  return gelir;
}

/** Şehir yapılarından gelen gelir (TASK-0008/5b). */
export function yapiGelirleri(d: DunyaDurumu): number[] {
  const gelir = new Array<number>(d.devletler.length).fill(0);
  for (const s of d.sehirler) gelir[s.devlet] += sehirYapiGeliri(s);
  return gelir;
}

/** Ay başındaki gelirle arayüzün aynı hesabı kullanmasını sağlar (arazi + yapı). */
export function prototipGelirleri(d: DunyaDurumu): number[] {
  const a = araziGelirleri(d), y = yapiGelirleri(d);
  return a.map((x, i) => x + y[i]);
}

/** O anki arazi ve ordular korunursa aylık düzenli fark; gerçekleşmiş işlem dökümü değildir. */
export function butceOzeti(d: DunyaDurumu, devlet: number): ButceOzeti {
  const hazine = d.devletler[devlet].hazine;
  const kullanilabilir = kullanilabilirHazine(d, devlet);
  const aylikAraziGeliri = araziGelirleri(d)[devlet], aylikYapiGeliri = yapiGelirleri(d)[devlet];
  const aylikGelir = aylikAraziGeliri + aylikYapiGeliri, aylikMaas = devletMaasi(d, devlet);
  return { hazine, ayrilan: hazine - kullanilabilir, kullanilabilir, aylikGelir, aylikAraziGeliri, aylikYapiGeliri, aylikMaas,
    aylikNet: aylikGelir - aylikMaas,
    araziSayisi: d.birimler.filter((b) => b.sahip === devlet).length,
    askerSayisi: d.ordular.filter((o) => o.devlet === devlet).reduce((s, o) => s + o.asker, 0) };
}
