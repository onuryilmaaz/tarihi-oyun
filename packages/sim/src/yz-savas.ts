// TASK-0009/6c: AI savaş ilanı, sefer, kuşatma ve barış (MASTER_SPEC §7.1, §16; DEC-0038, DEC-0040).
// AI oyuncuyla aynı emirleri aynı doğrulamayla kullanır. Yabancı ordular için yalnızca görünürlük kuralının
// verdiği yaklaşık sayıları, şehirler için açık sur seviyesi ve yaklaşık garnizonu bilir (AT-013).
// Kararların nedeni savaş ilanı ve barış metinlerinde açıklanır (§16.2). Sayılar denge.ts'te [TASLAK].

import { olayEkle, type BarisTalebi, type DunyaDurumu, type Savas } from "./durum";
import { DENGE } from "./denge";
import { emirDogrula, emirUygula, type Baglam, type Emir } from "./emirler";
import { gorunurYabanciOrdular, savasta } from "./savas";
import { orduKonumu } from "./hareket";
import { orduKusatmasi, sehirMenzilinde } from "./kusatma";
import { barisBedeli, barisDogrula, barisiUygula, savasSkoru, sehirDegeri } from "./baris";
import { iliski, komsuMu, muttefik, muttefikleri, saldirmazlikVar, type DiplomasiOnHesap } from "./diplomasi";
import { aralik } from "./rastgele";

const dene = (d: DunyaDurumu, b: Baglam, e: Emir) => {
  if (!emirDogrula(d, e, b, true).gecerli) return false;
  emirUygula(d, e, b);
  return true;
};
const savaslari = (d: DunyaDurumu, devlet: number) => d.savaslar.filter((s) => s.saldiran === devlet || s.savunan === devlet);
const karsiTaraf = (s: Savas, devlet: number) => (s.saldiran === devlet ? s.savunan : s.saldiran);
export const ateskesVar = (d: DunyaDurumu, a: number, b: number) =>
  d.ateskesler.some((x) => x.a === Math.min(a, b) && x.b === Math.max(a, b) && x.bitis > d.gun);
/** Yabancı şehrin dışarıdan görünen garnizonu (istemcideki gösterimle aynı yuvarlama). */
const tahminiGarnizon = (d: DunyaDurumu, sehir: number) => Math.ceil(d.sehirler[sehir].garnizon / 1000) * 1000;

// --- Savaş ilanı (aylık karar) ---------------------------------------------------------------------

/** Komşu, kötü ilişkili ve açıkça zayıf bir hedef bulursa (olasılıkla) savaş ilan eder. */
export function savasKarari(d: DunyaDurumu, b: Baglam, on: DiplomasiOnHesap, devlet: number): boolean {
  if (!b.ag || savaslari(d, devlet).length || d.saldirganlik[devlet] >= DENGE.YZ_SALDIRGANLIK_SINIRI) return false;
  const benim = d.ordular.filter((o) => o.devlet === devlet).reduce((t, o) => t + o.asker, 0);
  if (benim <= 0) return false;
  const gorunur = gorunurYabanciOrdular(d, b.ag, devlet);
  const tahmin = (k: number) => Math.max(
    gorunur.filter((o) => o.devlet === k).reduce((t, o) => t + o.yaklasikAsker, 0), on.arazi[k] * DENGE.GARNIZON_BIRIM_BASINA);
  let en: { hedef: number; oran: number; p: number } | null = null;
  for (let k = 0; k < on.n; k++) {
    if (k === devlet || !on.arazi[k] || !komsuMu(on, devlet, k) || muttefik(d, devlet, k) || ateskesVar(d, devlet, k) || saldirmazlikVar(d, devlet, k)) continue;
    const p = iliski(d, on, devlet, k);
    if (p > DENGE.YZ_FIRSAT_ILISKI) continue;
    const dusman = tahmin(k) + muttefikleri(d, k).filter((m) => m !== devlet && !muttefik(d, devlet, m)).reduce((t, m) => t + tahmin(m), 0);
    const oran = Math.floor((benim * 100) / Math.max(1, dusman));
    // Kötü ilişkide 1,5 kat üstünlük yeter; ilişki yalnızca dostça değilse (fırsatçı fetih) 3 kat gerekir
    if (oran < (p <= DENGE.YZ_SAVAS_ILISKI ? DENGE.YZ_SAVAS_GUC_YUZDE : DENGE.YZ_FIRSAT_GUC_YUZDE)) continue;
    // Kötü ilişkili hedef fırsat hedefinden önce gelir; aynı türde daha büyük üstünlük seçilir
    const kotu = p <= DENGE.YZ_SAVAS_ILISKI, enKotu = en !== null && en.p <= DENGE.YZ_SAVAS_ILISKI;
    if (!en || (kotu && !enKotu) || (kotu === enKotu && oran > en.oran)) en = { hedef: k, oran, p };
  }
  if (!en || aralik(d, 100) >= (en.p <= DENGE.YZ_SAVAS_ILISKI ? DENGE.YZ_SAVAS_OLASILIK : DENGE.YZ_FIRSAT_OLASILIK)) return false;
  return dene(d, b, { tur: "savasIlan", devlet, hedef: en.hedef,
    gerekce: `${en.p <= DENGE.YZ_SAVAS_ILISKI ? `kötü ilişki (${en.p})` : `fırsat (ilişki ${en.p})`} ve tahmini güç üstünlüğü (yaklaşık ${Math.floor(en.oran / 10) / 10} kat).` });
}

// --- Barış (aylık karar) ---------------------------------------------------------------------------

/** alan'ın işgal ettiği, karsi'ya ait yerlerden skoru aşmayan en değerli talep (şehirler önce). */
export function talepKur(d: DunyaDurumu, savas: number, alan: number, karsi: number, skor: number): BarisTalebi {
  const t: BarisTalebi = { savas, birimler: [], sehirler: [], tazminat: 0 };
  const sehirler = d.sehirler.flatMap((s, i) => (s.devlet === karsi && s.kontrol === alan ? [i] : []))
    .sort((x, y) => sehirDegeri(d, y) - sehirDegeri(d, x) || x - y);
  for (const i of sehirler) { t.sehirler.push(i); if (barisBedeli(d, alan, karsi, t) > skor) t.sehirler.pop(); }
  for (let i = 0; i < d.birimler.length; i++) {
    const a = d.birimler[i];
    if (a.sahip !== karsi || a.kontrol !== alan) continue;
    t.birimler.push(i);
    if (barisBedeli(d, alan, karsi, t) > skor) { t.birimler.pop(); break; }
  }
  return t;
}

/** Savaştaki AI: kazanıyorsa barış dayatır/teklif eder; uzun ve dengeli savaşı bitirir; oyuncuya kaybederken taviz verir. */
export function barisKararlari(d: DunyaDurumu, b: Baglam, devlet: number): void {
  const oyuncu = d.ayarlar.oyuncu;
  for (const w of [...savaslari(d, devlet)]) {
    if (!d.savaslar.includes(w)) continue;
    const karsi = karsiTaraf(w, devlet), skor = savasSkoru(d, devlet, karsi).skor, sure = d.gun - w.baslangic;
    const yorgun = sure >= DENGE.YZ_SAVAS_YORGUNLUK_GUN && Math.abs(skor) < DENGE.YZ_BARIS_SKOR;
    if (karsi === oyuncu) {
      if (d.barisTeklifleri.some((t) => t.savas === w.id)) continue;
      let alan: number, gerekce: string, karsiliksiz = false;
      if (skor >= DENGE.YZ_BARIS_SKOR) { alan = devlet; gerekce = `savaşı kazanıyor (skor ${skor}); işgal ettiği yerleri istiyor`; }
      // Skor karşı tarafın toplam değerine oranlanır; kaybetmeyi oyuncunun bu AI'ya karşı skoruyla ölçeriz
      else if (savasSkoru(d, oyuncu, devlet).skor >= DENGE.YZ_BARIS_SKOR && sure >= DENGE.YZ_KAYBEDEN_TEKLIF_GUN) {
        alan = oyuncu; gerekce = `savaşı kaybediyor (sizin skorunuz ${savasSkoru(d, oyuncu, devlet).skor}); işgal ettiğiniz yerleri bırakmayı öneriyor`;
      }
      else if (yorgun) { alan = skor >= 0 ? devlet : oyuncu; karsiliksiz = true; gerekce = `${Math.floor(sure / 365)} yıldır süren sonuçsuz savaştan yoruldu; karşılıksız barış öneriyor`; }
      else continue;
      const veren = alan === devlet ? oyuncu : devlet;
      const talep = karsiliksiz ? { savas: w.id, birimler: [], sehirler: [], tazminat: 0 }
        : talepKur(d, w.id, alan, veren, savasSkoru(d, alan, veren).skor);
      if (!barisDogrula(d, talep, alan).gecerli) continue;
      d.barisTeklifleri.push({ id: d.sonrakiTeklifId++, savas: w.id, teklifEden: devlet, alan, talep, gun: d.gun, gerekce });
      const metin = `${d.devletler[devlet].ad} barış teklif ediyor: ${gerekce}. ${talep.birimler.length} arazi, ${talep.sehirler.length} şehir `
        + `${alan === oyuncu ? "size" : "onlara"} geçer. Cevap için ${DENGE.BARIS_TEKLIF_GUN} gününüz var.`;
      olayEkle(d, { tur: "baris-teklifi", devlet: oyuncu, metin });
      if (!d.aktifKesinti) d.aktifKesinti = { gun: d.gun, neden: metin };
      continue;
    }
    // İki AI: kazanan dayatır (kaybeden aynı kuralla kabul eder); dengeli uzun savaşı küçük indeksli taraf bitirir
    const bos = { savas: w.id, birimler: [], sehirler: [], tazminat: 0 };
    if (skor >= DENGE.YZ_BARIS_SKOR) {
      const talep = talepKur(d, w.id, devlet, karsi, skor);
      if (barisDogrula(d, talep, devlet).gecerli) { barisiUygula(d, b, talep, devlet); continue; }
    } else if (yorgun && devlet < karsi) {
      const alan = skor >= 0 ? devlet : karsi;
      if (barisDogrula(d, bos, alan).gecerli) { barisiUygula(d, b, bos, alan); continue; }
    }
    // Güvenlik ağı: talep hiç geçerli kurulamıyorsa (skor iki yönden farklı ölçeklenir) savaş sonsuza dek sürmesin (9e/mantık)
    if (devlet < karsi && sure >= 2 * DENGE.YZ_SAVAS_YORGUNLUK_GUN) {
      const alan = skor >= 0 ? devlet : karsi, veren = alan === devlet ? karsi : devlet;
      const talep = talepKur(d, w.id, alan, veren, Math.max(0, savasSkoru(d, alan, veren).skor));
      if (barisDogrula(d, talep, alan).gecerli) barisiUygula(d, b, talep, alan);
      else if (barisDogrula(d, bos, alan).gecerli) barisiUygula(d, b, bos, alan);
    }
  }
}

/** Günlük: süresi dolan teklifler düşer. */
export function teklifSureleri(d: DunyaDurumu): void {
  for (const t of d.barisTeklifleri.filter((x) => d.gun - x.gun >= DENGE.BARIS_TEKLIF_GUN)) {
    d.barisTeklifleri = d.barisTeklifleri.filter((x) => x !== t);
    olayEkle(d, { tur: "baris-teklifi", devlet: d.ayarlar.oyuncu, metin: `${d.devletler[t.teklifEden].ad}'nın barış teklifinin süresi doldu; savaş sürüyor.` });
  }
}

// --- Sefer (savaştaki devletler, birkaç günde bir) -----------------------------------------------

/** Boştaki AI ordusu: menzildeki düşman şehrini kuşatır; daha güçlü düşman görürse başkentini savunur; yoksa yurttaki düşmana, kuşatabileceği en yakın düşman şehrine,
 *  o da yoksa en yakın düşman arazisine yürüyüp işgal eder. */
export function seferKararlari(d: DunyaDurumu, b: Baglam): void {
  const ag = b.ag;
  if (!ag) return;
  for (let devlet = 0; devlet < d.devletler.length; devlet++) {
    if (devlet === d.ayarlar.oyuncu || (d.gun + devlet) % DENGE.YZ_SEFER_ARALIGI !== 0) continue;
    const dusmanlar = new Set(savaslari(d, devlet).map((s) => karsiTaraf(s, devlet)));
    if (!dusmanlar.size) continue;
    const gorunur = gorunurYabanciOrdular(d, ag, devlet).filter((o) => dusmanlar.has(o.devlet));
    const sehirNoktasi = (i: number) => b.sehirKonumlari?.[i] ?? ag.dugumler[d.sehirler[i].dugum];
    for (const o of d.ordular.filter((a) => a.devlet === devlet)) {
      if (o.rota.length || o.muharebe !== null || o.cekiliyor || o.asker <= 0 || orduKusatmasi(d, o.id)) continue;
      if (o.moral < DENGE.YZ_SEFER_MORAL) continue;
      const guc = Math.floor((o.asker * o.moral) / DENGE.MORAL_EN_YUKSEK);
      const gereken = (i: number) => Math.max(1, tahminiGarnizon(d, i)) * (d.sehirler[i].sur + 1);
      const kusatilabilir = (i: number) => {
        const s = d.sehirler[i], k = d.kusatmalar.find((x) => x.sehir === i);
        return s.dugum >= 0 && dusmanlar.has(s.kontrol) && savasta(d, devlet, s.kontrol) && (!k || k.devlet === devlet) && guc >= gereken(i);
      };
      // 1) Menzildeki düşman şehrini kuşat
      const yakin = d.sehirler.findIndex((_, i) => kusatilabilir(i) && sehirMenzilinde(d, b, o, i));
      if (yakin >= 0) {
        const yontem = guc >= gereken(yakin) * DENGE.YZ_SALDIRI_GUC_KATI ? "saldiri" : "abluka";
        if (dene(d, b, { tur: "kusat", ordu: o.id, sehir: yakin, yontem })) continue;
      }
      // 2) Görünen düşman kuvveti bu ordudan güçlüyse başkenti savun (başkentteyse orada bekle)
      const baskent = d.devletler[devlet].baskent;
      if (baskent !== null && d.sehirler[baskent].dugum >= 0 && gorunur.reduce((t, y) => t + y.yaklasikAsker, 0) > o.asker) {
        if (o.dugum !== d.sehirler[baskent].dugum) {
          const p = sehirNoktasi(baskent);
          dene(d, b, { tur: "orduHedef", ordu: o.id, x: p.x, y: p.y, dugum: d.sehirler[baskent].dugum });
        }
        continue;
      }
      // 3) İşgal sürüyorsa yerinde kal (arazi süre sonunda kendiliğinden işgal edilir, AT-009)
      const burasi = d.birimler[ag.dugumler[o.dugum].b];
      if (burasi && dusmanlar.has(burasi.kontrol)) continue;
      // 4) Hedef adayları: yurttaki zayıf düşman ordusu, kuşatılabilir düşman şehri; yoksa en yakın düşman arazisi
      const k = orduKonumu(o);
      const uzaklik = (x: number, y: number) => (x - k.x) * (x - k.x) + (y - k.y) * (y - k.y);
      const adaylar: { x: number; y: number; dugum: number; uzaklik: number }[] = [];
      for (const y of gorunur) {
        if (d.birimler[ag.dugumler[y.dugum].b]?.sahip === devlet && y.yaklasikAsker * 120 <= o.asker * 100) {
          adaylar.push({ x: y.x, y: y.y, dugum: y.dugum, uzaklik: uzaklik(y.x, y.y) });
        }
      }
      d.sehirler.forEach((s, i) => {
        if (!kusatilabilir(i)) return;
        const p = sehirNoktasi(i);
        adaylar.push({ x: p.x, y: p.y, dugum: s.dugum, uzaklik: uzaklik(p.x, p.y) });
      });
      if (!adaylar.length) {
        let en = -1, enU = Infinity;
        ag.dugumler.forEach((n, i) => {
          if (!dusmanlar.has(d.birimler[n.b]?.kontrol ?? -1)) return;
          const u = uzaklik(n.x, n.y);
          if (u < enU) { enU = u; en = i; }
        });
        if (en >= 0) adaylar.push({ x: ag.dugumler[en].x, y: ag.dugumler[en].y, dugum: en, uzaklik: enU });
      }
      adaylar.sort((a, c) => a.uzaklik - c.uzaklik || a.dugum - c.dugum);
      for (const a of adaylar.slice(0, 3)) if (dene(d, b, { tur: "orduHedef", ordu: o.id, x: a.x, y: a.y, dugum: a.dugum })) break;
    }
  }
}

// Ortak savaş temizliği: barış anında ve günlük sistemde aynı yol.
export { yikilanDevletleriTemizle } from "./savas-sonu";
