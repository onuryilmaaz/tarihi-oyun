// TASK-0011/8a: donanma, deniz bölgeleri, deniz kontrolü, abluka, çıkarma ve boğazlar (MASTER_SPEC §10; DEC-0051).
// Denizler elle tanımlanmış bölgelerden oluşur; kıyı şehirleri limandır. Donanmalar bölgeden bölgeye gider, aynı
// bölgede savaştaki donanmalar otomatik çarpışır. Bölgede yalnızca bir tarafın (ve müttefiklerinin) donanması varsa o
// taraf bölgeyi kontrol eder: düşman kontrolündeki boğazdan ordu geçemez, düşman kontrolündeki liman kuşatması hızlanır
// (abluka). Çıkarma: donanma, limandaki orduyu gemiye alıp başka bir limana indirir. Sayılar denge.ts'te [TASLAK].

import { olayEkle, type DunyaDurumu, type OrduDurumu, type SenaryoVerisi } from "./durum";
import { DENGE } from "./denge";
import type { Baglam } from "./emirler";
import { savasta, sayiMetni } from "./savas";
import { muttefik } from "./diplomasi";
import { aralik } from "./rastgele";

export type GemiTuru = keyof typeof DENGE.GEMI;
export const GEMI_TURLERI: GemiTuru[] = ["kadirga", "kalyon"];

export interface DenizBolgesi { id: string; ad: string; komsu: number[]; gecit: number } // gecit: ticaretin geçtiği bölge (−1 yok, 8b)
export interface DenizHaritasi { bolgeler: DenizBolgesi[]; limanlar: number[]; bogazlar: { ad: string; bolge: number }[] } // limanlar: şehir → bölge (−1 değil)
export interface Donanma {
  id: number; ad: string; devlet: number; bolge: number;
  kadirga: number; kalyon: number; moral: number;
  rota: number[]; kalanGun: number; // sıradaki bölgeye kalan gün
  yuk: OrduDurumu | null; cikarmaHedef: number | null; // gemideki ordu ve indirileceği liman şehri
}
export interface GemiInsasi { sehir: number; devlet: number; gemi: GemiTuru; adet: number; kalanGun: number }

export const BOS_DENIZ: DenizHaritasi = { bolgeler: [], limanlar: [], bogazlar: [] };

/** Senaryodan deniz haritası ve başlangıç donanmaları. */
export function baslangicDenizi(s: SenaryoVerisi, devletIndeksi: (id: string) => number): { deniz: DenizHaritasi; donanmalar: Donanma[] } {
  const v = s.deniz;
  if (!v) return { deniz: { ...BOS_DENIZ, limanlar: s.sehirler.map(() => -1) }, donanmalar: [] };
  const sira = new Map(v.bolgeler.map((b, i) => [b.id, i]));
  const bolgeler = v.bolgeler.map((b) => ({ id: b.id, ad: b.ad, komsu: b.komsu.map((k) => sira.get(k)!), gecit: b.ticaretGecidi ? sira.get(b.ticaretGecidi)! : -1 }));
  const limanlar = s.sehirler.map((c) => {
    const e = Object.entries(v.limanlar).find(([, l]) => l.includes(c.ad));
    return e ? sira.get(e[0])! : -1;
  });
  const donanmalar = v.donanmalar.map((x, i) => ({ id: i + 1, ad: x.ad, devlet: devletIndeksi(x.devlet), bolge: sira.get(x.bolge)!,
    kadirga: x.kadirga, kalyon: x.kalyon, moral: 1000, rota: [], kalanGun: 0, yuk: null, cikarmaHedef: null }));
  return { deniz: { bolgeler, limanlar, bogazlar: v.bogazlar.map((b) => ({ ad: b.ad, bolge: sira.get(b.bolge)! })) }, donanmalar };
}

// --- Sorgular ----------------------------------------------------------------------------------------

export const gemiSayisi = (f: Donanma) => f.kadirga + f.kalyon;
export const donanmaGucu = (f: Donanma) =>
  Math.floor(((f.kadirga * DENGE.GEMI.kadirga.guc + f.kalyon * DENGE.GEMI.kalyon.guc) * f.moral) / 1000);
export const kapasite = (f: Donanma) => f.kadirga * DENGE.GEMI.kadirga.kapasite + f.kalyon * DENGE.GEMI.kalyon.kapasite;
/** Bölge geçiş süresi: en yavaş gemi belirler. */
export const bolgeGunu = (f: Donanma) => (f.kalyon > 0 ? DENGE.GEMI.kalyon.hizGun : DENGE.GEMI.kadirga.hizGun);
export const aylikBakim = (d: DunyaDurumu, devlet: number) => d.donanmalar.filter((f) => f.devlet === devlet)
  .reduce((t, f) => t + f.kadirga * DENGE.GEMI.kadirga.bakim + f.kalyon * DENGE.GEMI.kalyon.bakim, 0);

const dost = (d: DunyaDurumu, a: number, b: number) => a === b || muttefik(d, a, b);

/** Bölgeyi kontrol eden devlet: bölgedeki bütün donanmalar tek tarafa (devlet + müttefikleri) aitse en güçlüsü; yoksa null. */
export function bolgeKontrolu(d: DunyaDurumu, bolge: number): number | null {
  const f = d.donanmalar.filter((x) => x.bolge === bolge && gemiSayisi(x) > 0);
  if (!f.length) return null;
  if (f.some((x) => f.some((y) => !dost(d, x.devlet, y.devlet)))) return null;
  return [...f].sort((a, b) => donanmaGucu(b) - donanmaGucu(a) || a.id - b.id)[0].devlet;
}

/** Boğaz kenarı, bölgesi devletle savaşta olan biri tarafından kontrol ediliyorsa kapalıdır. */
export function bogazKapali(d: DunyaDurumu, kenarAdi: string | undefined, devlet: number): boolean {
  const b = d.deniz.bogazlar.find((x) => x.ad === kenarAdi);
  if (!b) return false;
  const k = bolgeKontrolu(d, b.bolge);
  return k !== null && savasta(d, k, devlet);
}

/** Limanın denizden ablukası: kuşatan (ya da müttefiki) bölgeyi kontrol ediyor mu? */
export function denizAblukasi(d: DunyaDurumu, sehir: number, kusatan: number): boolean {
  const b = d.deniz.limanlar[sehir] ?? -1;
  if (b < 0) return false;
  const k = bolgeKontrolu(d, b);
  return k !== null && dost(d, k, kusatan);
}

/** Bölgeler arası en kısa yol (BFS; eşitlikte küçük indeks). Başlangıç hariç bölge listesi; ulaşılamazsa null. */
export function denizYolu(d: DunyaDurumu, bas: number, hedef: number): number[] | null {
  if (bas === hedef) return [];
  const onceki = new Map<number, number>([[bas, -1]]);
  const kuyruk = [bas];
  while (kuyruk.length) {
    const u = kuyruk.shift()!;
    for (const v of [...d.deniz.bolgeler[u].komsu].sort((a, b) => a - b)) {
      if (onceki.has(v)) continue;
      onceki.set(v, u);
      if (v === hedef) {
        const yol: number[] = [];
        for (let x = v; x !== bas; x = onceki.get(x)!) yol.push(x);
        return yol.reverse();
      }
      kuyruk.push(v);
    }
  }
  return null;
}

/** Görünür yabancı donanmalar: kendi limanınızın, donanmanızın ya da komşu bölgelerinin denizinde; sayı yaklaşık. */
export function gorunurDonanmalar(d: DunyaDurumu, devlet: number): { id: number; ad: string; devlet: number; bolge: number; yaklasikGemi: number }[] {
  const gorulen = new Set<number>();
  d.sehirler.forEach((s, i) => { const b = d.deniz.limanlar[i] ?? -1; if (b >= 0 && s.kontrol === devlet) gorulen.add(b); });
  for (const f of d.donanmalar) if (f.devlet === devlet) { gorulen.add(f.bolge); for (const k of d.deniz.bolgeler[f.bolge].komsu) gorulen.add(k); }
  return d.donanmalar.filter((f) => f.devlet !== devlet && gorulen.has(f.bolge)).map((f) => ({
    id: f.id, ad: f.ad, devlet: f.devlet, bolge: f.bolge, yaklasikGemi: Math.max(5, Math.round(gemiSayisi(f) / 5) * 5) }));
}

// --- Günlük sistemler --------------------------------------------------------------------------------

/** Tamamlanan gemiler, şehrin bölgesinde bekleyen kendi donanmasına katılır; yoksa yeni donanma kurulur. */
export function gemiInsalariIlerlet(d: DunyaDurumu): void {
  for (const g of [...d.gemiInsalari]) {
    if (--g.kalanGun > 0) continue;
    d.gemiInsalari = d.gemiInsalari.filter((x) => x !== g);
    const s = d.sehirler[g.sehir], bolge = d.deniz.limanlar[g.sehir];
    if (s.devlet !== g.devlet || s.kontrol !== g.devlet) {
      olayEkle(d, { tur: "gemi-iptal", devlet: g.devlet, metin: `${s.ad} elden çıktığı için ${g.adet} ${DENGE.GEMI[g.gemi].ad.toLowerCase()} tamamlanamadı.` });
      continue;
    }
    let f = d.donanmalar.find((x) => x.devlet === g.devlet && x.bolge === bolge && !x.rota.length && !x.yuk);
    if (!f) {
      f = { id: d.sonrakiDonanmaId++, ad: `${d.devletler[g.devlet].ad} Donanması (${s.ad})`, devlet: g.devlet, bolge,
        kadirga: 0, kalyon: 0, moral: 1000, rota: [], kalanGun: 0, yuk: null, cikarmaHedef: null };
      d.donanmalar.push(f);
    }
    f[g.gemi] += g.adet;
    olayEkle(d, { tur: "gemi-hazir", devlet: g.devlet, metin: `${s.ad}: ${g.adet} ${DENGE.GEMI[g.gemi].ad.toLowerCase()} denize indirildi (${f.ad}).` });
  }
}

/** Orduyu limana indirir (şehir noktası); kara geçişi yoksa gemide kalır. */
function indir(d: DunyaDurumu, b: Baglam, f: Donanma): void {
  const o = f.yuk, hedef = f.cikarmaHedef;
  if (!o || hedef === null) return;
  const s = d.sehirler[hedef];
  const sahip = s.dugum >= 0 && b.ag ? d.birimler[b.ag.dugumler[s.dugum].b]?.sahip ?? -1 : -1;
  if (s.dugum < 0 || (sahip !== o.devlet && sahip !== -1 && !savasta(d, o.devlet, sahip))) {
    olayEkle(d, { tur: "cikarma", devlet: o.devlet, metin: `${o.ad} ${s.ad} kıyısına çıkamadı (savaşta olmadığınız topraklar); gemide bekliyor.` });
    f.cikarmaHedef = null;
    return;
  }
  const p = b.sehirKonumlari?.[hedef] ?? (b.ag ? b.ag.dugumler[s.dugum] : { x: o.x, y: o.y });
  Object.assign(o, { dugum: s.dugum, x: p.x, y: p.y, rota: [], ilerleme: 0, hedef: null, cekiliyor: false, muharebe: null });
  d.ordular.push(o);
  f.yuk = null; f.cikarmaHedef = null;
  olayEkle(d, { tur: "cikarma", devlet: o.devlet, metin: `${o.ad} (${sayiMetni(o.asker)} asker) ${s.ad} kıyısına çıktı.` });
}

export function donanmaHareketi(d: DunyaDurumu, b: Baglam): void {
  for (const f of d.donanmalar) {
    if (!f.rota.length) {
      if (f.yuk && f.cikarmaHedef !== null && d.deniz.limanlar[f.cikarmaHedef] === f.bolge) indir(d, b, f);
      continue;
    }
    if (--f.kalanGun > 0) continue;
    f.bolge = f.rota.shift()!;
    f.kalanGun = f.rota.length ? bolgeGunu(f) : 0;
    if (!f.rota.length) {
      olayEkle(d, { tur: "donanma-vardi", devlet: f.devlet, metin: `${f.ad} ${d.deniz.bolgeler[f.bolge].ad} bölgesine vardı.` });
      if (f.yuk && f.cikarmaHedef !== null && d.deniz.limanlar[f.cikarmaHedef] === f.bolge) indir(d, b, f);
    }
  }
}

/** Gemi kaybı: önce kadırgalar (ön saf), sonra kalyonlar; güç biriminden gemiye. */
function gemiKaybet(f: Donanma, kayipGuc: number): number {
  let kalan = kayipGuc, kayip = 0;
  for (const t of GEMI_TURLERI) {
    const n = Math.min(f[t], Math.floor(kalan / DENGE.GEMI[t].guc));
    f[t] -= n; kayip += n; kalan -= n * DENGE.GEMI[t].guc;
  }
  if (kayip === 0 && kayipGuc > 0 && gemiSayisi(f) > 0) { if (f.kadirga) f.kadirga--; else f.kalyon--; kayip = 1; }
  return kayip;
}

/** Günlük: aynı bölgede savaştaki donanmalar bir gün çarpışır; morali kırılan çekilir, gemisi kalmayan batar. */
export function denizMuharebeleri(d: DunyaDurumu): void {
  const oyuncu = d.ayarlar.oyuncu;
  for (let bolge = 0; bolge < d.deniz.bolgeler.length; bolge++) {
    const f = d.donanmalar.filter((x) => x.bolge === bolge && gemiSayisi(x) > 0);
    const cift = f.flatMap((a) => f.filter((c) => c.id > a.id && savasta(d, a.devlet, c.devlet)).map((c) => [a, c] as const))[0];
    if (!cift) {
      for (const x of f) x.moral = Math.min(1000, x.moral + DENGE.DENIZ_MORAL_TOPARLANMA);
      continue;
    }
    const [a, c] = cift;
    const ga = donanmaGucu(a), gc = donanmaGucu(c);
    const sans = () => 85 + aralik(d, 31);
    const kayipC = gemiKaybet(c, Math.floor((ga * DENGE.DENIZ_KAYIP_YUZDE * sans()) / 10000));
    const kayipA = gemiKaybet(a, Math.floor((gc * DENGE.DENIZ_KAYIP_YUZDE * sans()) / 10000));
    a.moral = Math.max(0, a.moral - Math.floor((DENGE.DENIZ_MORAL_KAYIP_CARPANI * Math.max(1, gc)) / Math.max(1, ga + gc) / 5));
    c.moral = Math.max(0, c.moral - Math.floor((DENGE.DENIZ_MORAL_KAYIP_CARPANI * Math.max(1, ga)) / Math.max(1, ga + gc) / 5));
    const yer = d.deniz.bolgeler[bolge].ad;
    const metin = `${yer}: deniz muharebesi — ${a.ad} ${kayipA} gemi, ${c.ad} ${kayipC} gemi kaybetti.`;
    const ilgili = [a.devlet, c.devlet].includes(oyuncu);
    olayEkle(d, { tur: "deniz-muharebesi", devlet: ilgili ? oyuncu : null, metin });
    if (ilgili && !d.aktifKesinti) d.aktifKesinti = { gun: d.gun, neden: metin };
    for (const x of [a, c]) {
      const batti = gemiSayisi(x) === 0;
      if (!batti && x.moral > DENGE.DENIZ_GERI_CEKILME_MORAL) continue;
      const kacis = batti ? undefined : d.deniz.bolgeler[bolge].komsu.find((k) => !d.donanmalar.some((y) => y.bolge === k && savasta(d, y.devlet, x.devlet)));
      if (kacis === undefined) {
        d.donanmalar = d.donanmalar.filter((y) => y !== x);
        olayEkle(d, { tur: "donanma-batti", devlet: x.devlet === oyuncu ? oyuncu : null,
          metin: `${x.ad} ${yer} bölgesinde yok edildi.${x.yuk ? ` Gemideki ${x.yuk.ad} (${sayiMetni(x.yuk.asker)} asker) de kayboldu.` : ""}` });
      } else {
        x.bolge = kacis; x.rota = []; x.kalanGun = 0;
        olayEkle(d, { tur: "donanma-cekildi", devlet: x.devlet === oyuncu ? oyuncu : null, metin: `${x.ad} ${d.deniz.bolgeler[kacis].ad} bölgesine çekildi.` });
      }
    }
  }
}

/** AI donanmaları (savaştaki devletler, birkaç günde bir): görünen daha zayıf düşman donanmasına saldırır;
 *  yoksa kendi ordusunun kuşattığı düşman limanını denizden abluka eder. Yalnızca görünür bilgi kullanılır. */
export function yzDonanmalari(d: DunyaDurumu): void {
  for (const f of d.donanmalar) {
    const devlet = f.devlet;
    if (devlet === d.ayarlar.oyuncu || f.rota.length || f.yuk || (d.gun + devlet) % DENGE.YZ_SEFER_ARALIGI !== 0) continue;
    if (!d.savaslar.some((s) => s.saldiran === devlet || s.savunan === devlet)) continue;
    const yakin = new Set([f.bolge, ...d.deniz.bolgeler[f.bolge].komsu]);
    const hedef = gorunurDonanmalar(d, devlet)
      .filter((y) => yakin.has(y.bolge) && savasta(d, devlet, y.devlet)
        && donanmaGucu(f) * 100 >= y.yaklasikGemi * DENGE.GEMI.kadirga.guc * DENGE.YZ_DONANMA_GUC_YUZDE)
      .sort((a, c) => a.bolge - c.bolge || a.id - c.id)[0];
    let bolge: number | undefined = hedef?.bolge;
    if (bolge === undefined) {
      const k = d.kusatmalar.find((x) => x.devlet === devlet && (d.deniz.limanlar[x.sehir] ?? -1) >= 0);
      bolge = k ? d.deniz.limanlar[k.sehir] : undefined;
    }
    if (bolge === undefined || bolge === f.bolge) continue;
    const yol = denizYolu(d, f.bolge, bolge);
    if (!yol) continue;
    f.rota = yol; f.kalanGun = bolgeGunu(f);
  }
}
