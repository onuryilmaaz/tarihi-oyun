// TASK-0008/5a: mevcut kuralların bütçe sorgusu. Yeni gelir/gider yaratmaz.
// Arazi geliri hâlâ test sistemidir; gerçek üretim/vergi modeli sonraki teslimde tasarlanacak.
import type { DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import { kullanilabilirHazine } from "./emirler";
import { devletMaasi } from "./ordu";

export interface ButceOzeti {
  hazine: number;
  ayrilan: number;
  kullanilabilir: number;
  aylikGelir: number;
  aylikMaas: number;
  aylikNet: number;
  araziSayisi: number;
  askerSayisi: number;
}

/** Ay başındaki mevcut test geliriyle arayüzün aynı hesabı kullanmasını sağlar. */
export function prototipGelirleri(d: DunyaDurumu): number[] {
  const gelir = new Array<number>(d.devletler.length).fill(0);
  for (const b of d.birimler) if (b.sahip >= 0) gelir[b.sahip] += DENGE.TEST_GELIR_BIRIM_BASINA;
  return gelir;
}

/** O anki arazi ve ordular korunursa aylık düzenli fark; gerçekleşmiş işlem dökümü değildir. */
export function butceOzeti(d: DunyaDurumu, devlet: number): ButceOzeti {
  const hazine = d.devletler[devlet].hazine;
  const kullanilabilir = kullanilabilirHazine(d, devlet);
  const aylikGelir = prototipGelirleri(d)[devlet], aylikMaas = devletMaasi(d, devlet);
  return { hazine, ayrilan: hazine - kullanilabilir, kullanilabilir, aylikGelir, aylikMaas,
    aylikNet: aylikGelir - aylikMaas,
    araziSayisi: d.birimler.filter((b) => b.sahip === devlet).length,
    askerSayisi: d.ordular.filter((o) => o.devlet === devlet).reduce((s, o) => s + o.asker, 0) };
}
