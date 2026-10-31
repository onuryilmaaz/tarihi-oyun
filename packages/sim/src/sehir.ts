// TASK-0026 (DEC-0076): oyuncu için şehir adı değiştirme ve şehir birleştirme.
// Ad değiştirme anındadır (emir kuyruğuna girmez). Birleştirme bir emirdir: bedel emir uygulanınca düşer, 30 gün sürer;
// bitince nüfusu büyük olan (başkent varsa başkent) merkez kalır, küçük şehir merkeze bağlanır (bagli) ve ayrı şehir
// olarak oyundan çekilir: nüfusu, grupları, insan gücü, garnizonu ve yapıları merkeze geçer, sahipliği merkezi izler.

import { olayEkle, type DunyaDurumu, type SehirDurumu } from "./durum";
import { DENGE } from "./denge";
import type { Baglam, Dogrulama } from "./emirler";
import type { HareketAgi } from "./hareket";
import { nufusCikar, nufusEkle } from "./nufus";
import { yapiEnYuksek } from "./teknoloji";

/** Bağımsız (birleşmeyle başka şehre bağlanmamış) şehir mi; bağlı şehirler hedef ve liste dışıdır. */
export const bagimsiz = (s: SehirDurumu): boolean => s.bagli < 0;

/** Şehrin anında yeni ad alması (oyuncu). */
export function sehirAdiDegistir(d: DunyaDurumu, sehir: number, ad: string): Dogrulama {
  const s = d.sehirler[sehir], oyuncu = d.ayarlar.oyuncu;
  if (!s || s.devlet !== oyuncu || !bagimsiz(s)) return { gecerli: false, neden: "Yalnızca kendi şehrinizin adını değiştirebilirsiniz." };
  const yeni = typeof ad === "string" ? ad.trim().replace(/\s+/g, " ") : "";
  if (!yeni || yeni.length > DENGE.SEHIR_ADI_EN_UZUN) return { gecerli: false, neden: `Ad 1–${DENGE.SEHIR_ADI_EN_UZUN} karakter olmalı.` };
  if (yeni === s.ad) return { gecerli: false, neden: "Şehir zaten bu adı taşıyor." };
  const kucuk = yeni.toLocaleLowerCase("tr");
  if (d.sehirler.some((x, i) => i !== sehir && x.ad.toLocaleLowerCase("tr") === kucuk)) return { gecerli: false, neden: "Bu adda başka bir şehir var." };
  const eski = s.ad;
  s.eskiAd = s.eskiAd === null ? eski : s.eskiAd === yeni ? null : s.eskiAd;
  s.ad = yeni;
  olayEkle(d, { tur: "sehir-adi", devlet: oyuncu, metin: `${eski} şehrinin adı ${yeni} oldu.` });
  return { gecerli: true };
}

// Birim komşuluğu hareket ağından bir kez çıkarılır (ağ değişmez)
const komsulukOnbellegi = new WeakMap<HareketAgi, Map<number, Set<number>>>();
function birimKomsulari(ag: HareketAgi): Map<number, Set<number>> {
  let m = komsulukOnbellegi.get(ag);
  if (m) return m;
  m = new Map();
  for (const k of ag.kenarlar) {
    const x = ag.dugumler[k.a].b, y = ag.dugumler[k.b].b;
    if (x === y) continue;
    (m.get(x) ?? m.set(x, new Set()).get(x)!).add(y);
    (m.get(y) ?? m.set(y, new Set()).get(y)!).add(x);
  }
  komsulukOnbellegi.set(ag, m);
  return m;
}

/** İki şehrin toprakları komşu mu: hareket ağında iki şehrin birimleri arasında kenar var mı. */
export function sehirlerKomsu(d: DunyaDurumu, b: Baglam, a: number, c: number): boolean {
  const ba = d.sehirler[a]?.birim, bc = d.sehirler[c]?.birim;
  if (!b.ag || ba === undefined || bc === undefined || ba < 0 || bc < 0 || ba === bc) return false;
  return birimKomsulari(b.ag).get(ba)?.has(bc) ?? false;
}

/** Oyuncunun şehirle birleştirebileceği komşu şehirler (arayüz için). */
export function birlesmeAdaylari(d: DunyaDurumu, b: Baglam, sehir: number): number[] {
  const s = d.sehirler[sehir];
  if (!b.ag || !s || s.birim < 0) return [];
  const komsu = birimKomsulari(b.ag).get(s.birim) ?? new Set<number>();
  return d.sehirler.flatMap((x, i) => (komsu.has(x.birim) && !birlesmeEngeli(d, b, d.ayarlar.oyuncu, sehir, i) ? [i] : []));
}

/** Birleşme koşulları (emir doğrulamasında ve süre boyunca her gün). */
export function birlesmeEngeli(d: DunyaDurumu, b: Baglam, devlet: number, a: number, c: number, sureVar = false): string | null {
  const sa = d.sehirler[a], sc = d.sehirler[c];
  if (!sa || !sc || a === c) return "Birleştirilecek iki ayrı şehir seçin.";
  for (const s of [sa, sc]) {
    if (s.devlet !== devlet || s.kontrol !== devlet || !bagimsiz(s)) return "İki şehir de kontrolünüzdeki kendi şehriniz olmalı.";
    if (s.istikrar.ayaklanma) return `${s.ad} ayaklanma altında.`;
  }
  if (d.kusatmalar.some((k) => k.sehir === a || k.sehir === c)) return "Kuşatma altındaki şehir birleştirilemez.";
  if (!sureVar && d.sehirBirlesmeleri.some((x) => [x.merkez, x.katilan].some((i) => i === a || i === c))) return "Bu şehirlerden biri zaten birleşiyor.";
  if (!sehirlerKomsu(d, b, a, c)) return "Şehirlerin toprakları komşu olmalı.";
  return null;
}

/** Birleşmeyi başlatır (emir uygulanınca; bedel düşülür). */
export function birlesmeBaslat(d: DunyaDurumu, devlet: number, a: number, c: number): void {
  d.devletler[devlet].hazine -= DENGE.SEHIR_BIRLESTIR_BEDEL;
  d.sehirBirlesmeleri.push({ merkez: a, katilan: c, devlet, kalanGun: DENGE.SEHIR_BIRLESTIR_GUN });
  olayEkle(d, { tur: "sehir-birlesme", devlet,
    metin: `${d.sehirler[a].ad} ile ${d.sehirler[c].ad} birleşiyor (${DENGE.SEHIR_BIRLESTIR_GUN} gün). Bedel: −${DENGE.SEHIR_BIRLESTIR_BEDEL}.` });
}

/** Günlük: süren birleşmeler; koşul bozulursa iptal (bedel iade edilmez), süre dolunca aktarım. */
export function sehirBirlesmeleriIlerlet(d: DunyaDurumu, b: Baglam): void {
  for (const x of [...d.sehirBirlesmeleri]) {
    const engel = birlesmeEngeli(d, b, x.devlet, x.merkez, x.katilan, true);
    if (engel) {
      d.sehirBirlesmeleri = d.sehirBirlesmeleri.filter((y) => y !== x);
      olayEkle(d, { tur: "sehir-birlesme", devlet: x.devlet,
        metin: `${d.sehirler[x.merkez].ad}–${d.sehirler[x.katilan].ad} birleşmesi iptal oldu: ${engel} Bedel iade edilmez.` });
      continue;
    }
    if (--x.kalanGun > 0) continue;
    d.sehirBirlesmeleri = d.sehirBirlesmeleri.filter((y) => y !== x);
    birlestir(d, x.merkez, x.katilan);
  }
}

function birlestir(d: DunyaDurumu, a: number, c: number): void {
  // Başkent varsa o, yoksa nüfusu büyük olan merkez kalır (eşitlikte emirdeki ilk şehir)
  const [m, k] = d.sehirler[c].baskent || (!d.sehirler[a].baskent && d.sehirler[c].nufus > d.sehirler[a].nufus) ? [c, a] : [a, c];
  const merkez = d.sehirler[m], katilan = d.sehirler[k];
  nufusEkle(merkez, nufusCikar(katilan, katilan.nufus));
  merkez.insanGucu += katilan.insanGucu;
  merkez.garnizon += katilan.garnizon;
  for (const y of ["tarla", "pazar"] as const) {
    merkez.yapilar[y] = Math.min(yapiEnYuksek(d, merkez.devlet, y), merkez.yapilar[y] + katilan.yapilar[y]);
  }
  merkez.sur = Math.max(merkez.sur, katilan.sur);
  merkez.istikrar.risk = Math.min(100, merkez.istikrar.risk + DENGE.SEHIR_BIRLESTIR_RISK);
  Object.assign(katilan, { insanGucu: 0, garnizon: 0, yapilar: { tarla: 0, pazar: 0 }, yonetici: false, bagli: m });
  katilan.istikrar.risk = Math.min(100, katilan.istikrar.risk + DENGE.SEHIR_BIRLESTIR_RISK);
  // Katılan şehre bağlı işler kapanır (inşaat, iskân, toplama)
  d.insaatlar = d.insaatlar.filter((i) => i.sehir !== k);
  d.iskanlar = d.iskanlar.filter((i) => i.kaynak !== k && i.hedef !== k);
  d.askerToplamalar = d.askerToplamalar.filter((t) => t.sehir !== k);
  olayEkle(d, { tur: "sehir-birlesme", devlet: merkez.devlet, metin: `${katilan.ad}, ${merkez.ad} ile birleşti; nüfusu ve yapıları ${merkez.ad} şehrine geçti.` });
}

/** Günlük: bağlı şehrin sahipliği ve askerî kontrolü merkezini izler. */
export function bagliSehirleriEsitle(d: DunyaDurumu): void {
  for (const s of d.sehirler) {
    if (bagimsiz(s)) continue;
    const m = d.sehirler[s.bagli];
    s.devlet = m.devlet; s.kontrol = m.kontrol; s.isgalBaslangic = m.isgalBaslangic;
  }
}

// --- TASK-0027 (DEC-0077): şehir ve toprağı birlikte fethedilir ----------------------------------------

/** Şehri olan birimler (toprak şehirle birlikte el değiştirir; ayrıca işgal edilmez, ayrıca talep edilmez). */
export function sehirliBirimler(d: DunyaDurumu): Set<number> {
  return new Set(d.sehirler.flatMap((s) => (s.birim >= 0 ? [s.birim] : [])));
}

/** Şehirli toprağın yasal sahibi ve askerî kontrolü şehrini izler. */
export function sehirToprakEsitle(d: DunyaDurumu): void {
  for (const s of d.sehirler) {
    const t = d.birimler[s.birim];
    if (!t) continue;
    t.sahip = s.devlet; t.kontrol = s.kontrol; t.isgalBaslangic = s.isgalBaslangic;
  }
  const sehirli = sehirliBirimler(d);
  d.isgalHazirliklari = d.isgalHazirliklari.filter((p) => !sehirli.has(p.birim));
}
