// TASK-0029 (DEC-0079): şehir → sancak → eyalet. TASK-0033: Osmanlı dışında 6+ şehirli devletlerde de, kültüre göre
// adlarla (kontluk/dükalık, voyvodalık, tema, vilayet…). Başlangıç dağılımı senaryodan gelir (Osmanlı: sancaklar.json;
// diğerleri otomatik kümeleme). Şehir el değiştirince sancağından çıkar; devletin yeni aldığı şehir en yakın sancağa
// katılır; merkezini kaybeden sancağın merkezi en kalabalık şehre geçer, boşalan sancak kalkar. Yönetim açıksa
// sancağın şehirleri yerel yönetici gibi yönetilir (yerel yönetim bütçesiyle, 7d).

import { olayEkle, type DevletDurumu, type DunyaDurumu, type Eyalet, type Sancak, type SehirDurumu, type SenaryoVerisi } from "./durum";
import type { Baglam, Dogrulama } from "./emirler";
import { araziGelirleri, yapiGelirleri } from "./ekonomi";
import { sehirTicareti } from "./ticaret";
import { ADLAR, type AdHavuzu } from "./hanedan";

/** Kültüre (ad havuzuna) göre idari terimler ve yönetici unvanı (TASK-0033) [TASLAK]. */
export const IDARI_TERIMLER: Record<AdHavuzu, { sancak: string; cogul: string; eyalet: string; unvan: string }> = {
  turk: { sancak: "sancak", cogul: "Sancaklar", eyalet: "eyalet", unvan: "Bey" },
  slav: { sancak: "voyvodalık", cogul: "Voyvodalıklar", eyalet: "ülke", unvan: "Voyvoda" },
  latin: { sancak: "kontluk", cogul: "Kontluklar", eyalet: "dükalık", unvan: "Kont" },
  rum: { sancak: "tema", cogul: "Temalar", eyalet: "eyalet", unvan: "Kefali" },
  asya: { sancak: "vilayet", cogul: "Vilayetler", eyalet: "eyalet", unvan: "Vali" },
  genel: { sancak: "vilayet", cogul: "Vilayetler", eyalet: "eyalet", unvan: "Vali" },
};
export const idariTerim = (d: DunyaDurumu, devlet: number) => IDARI_TERIMLER[d.devletler[devlet]?.adHavuzu ?? "genel"] ?? IDARI_TERIMLER.genel;

export function baslangicSancaklari(s: SenaryoVerisi, sehirler: SehirDurumu[], devletler: DevletDurumu[], bul: (id: string | null) => number): { eyaletler: Eyalet[]; sancaklar: Sancak[] } {
  const eyaletler: Eyalet[] = [], sancaklar: Sancak[] = [];
  const ad = new Map(sehirler.map((c, i) => [c.ad, i]));
  for (const v of s.sancaklar ?? []) {
    const devlet = bul(v.devlet);
    if (devlet < 0) continue;
    const terim = IDARI_TERIMLER[devletler[devlet].adHavuzu] ?? IDARI_TERIMLER.genel;
    const adlar = ADLAR[devletler[devlet].adHavuzu] ?? ADLAR.genel;
    v.sancaklar.forEach((x, j) => {
      const merkez = ad.get(x.merkez);
      const liste = x.sehirler.map((a) => ad.get(a)).filter((i): i is number => i !== undefined && sehirler[i].devlet === devlet);
      if (merkez === undefined || !liste.includes(merkez)) return;
      const kisi = adlar[(devlet * 7 + j * 3) % adlar.length]; // kurgusal, durumsuz
      // Türkçede unvan sonda ("Ali Bey"), diğer kültürlerde başta ("Kont Henri", "Voyvoda Stefan")
      const bey = x.bey ?? (terim.unvan === "Bey" ? `${kisi} ${terim.unvan}` : `${terim.unvan} ${kisi}`);
      sancaklar.push({ ad: x.ad, devlet, eyalet: x.eyalet, merkez, bey, sehirler: liste, yonetim: false, tur: terim.sancak });
    });
    eyaletler.push(...v.eyaletler.map((e) => ({ id: e.id, ad: e.ad, devlet, tur: terim.eyalet })));
  }
  return { eyaletler, sancaklar };
}

/** Şehir → sancak indeksi (−1: sancaksız). */
export function sehirSancaklari(d: DunyaDurumu): number[] {
  const m = d.sehirler.map(() => -1);
  d.sancaklar.forEach((s, i) => { for (const c of s.sehirler) m[c] = i; });
  return m;
}

/** Günlük: sahiplik değişikliklerini sancaklara yansıtır. */
export function sancakBakimi(d: DunyaDurumu, b: Baglam): void {
  if (!d.sancaklar.length) return;
  const sistemli = new Set(d.sancaklar.map((s) => s.devlet));
  const konum = (i: number) => b.sehirKonumlari?.[i] ?? (b.ag && d.sehirler[i].dugum >= 0 ? b.ag.dugumler[d.sehirler[i].dugum] : null);
  // Kaybedilen şehirler çıkar
  for (const s of d.sancaklar) {
    const once = s.sehirler.length;
    s.sehirler = s.sehirler.filter((i) => d.sehirler[i].devlet === s.devlet);
    if (s.sehirler.length !== once && !s.sehirler.includes(s.merkez) && s.sehirler.length) {
      s.merkez = [...s.sehirler].sort((a, c) => d.sehirler[c].nufus - d.sehirler[a].nufus || a - c)[0];
      olayEkle(d, { tur: "sancak", devlet: s.devlet, metin: `${s.ad} sancağının merkezi ${d.sehirler[s.merkez].ad} oldu.` });
    }
  }
  const bos = d.sancaklar.filter((s) => !s.sehirler.length);
  for (const s of bos) olayEkle(d, { tur: "sancak", devlet: s.devlet, metin: `${s.ad} sancağının bütün şehirleri kaybedildi; sancak kaldırıldı.` });
  d.sancaklar = d.sancaklar.filter((s) => s.sehirler.length);
  // Yeni alınan şehirler en yakın sancağa
  const atanmis = new Set(d.sancaklar.flatMap((s) => s.sehirler));
  d.sehirler.forEach((c, i) => {
    if (atanmis.has(i) || !sistemli.has(c.devlet)) return;
    const p = konum(i);
    const adaylar = d.sancaklar.filter((s) => s.devlet === c.devlet);
    if (!p || !adaylar.length) return;
    const uzak = (s: Sancak) => {
      const q = konum(s.merkez);
      return q ? (q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y) : Infinity;
    };
    const hedef = adaylar.reduce((a, s) => (uzak(s) < uzak(a) ? s : a));
    hedef.sehirler.push(i);
    if (hedef.yonetim) c.yonetici = true;
    olayEkle(d, { tur: "sancak", devlet: c.devlet, metin: `${c.ad} ${hedef.ad} sancağına bağlandı.` });
  });
}

/** Sancakbeyi yönetimini açar/kapatır: sancağın şehirleri yerel yönetici gibi yönetilir (oyuncu). */
export function sancakYonetimiAyarla(d: DunyaDurumu, sancak: number, acik: boolean): Dogrulama {
  const s = d.sancaklar[sancak];
  if (!s || s.devlet !== d.ayarlar.oyuncu) return { gecerli: false, neden: "Yalnızca kendi sancağınızı yönetebilirsiniz." };
  s.yonetim = acik;
  for (const i of s.sehirler) if (d.sehirler[i].bagli < 0) d.sehirler[i].yonetici = acik;
  olayEkle(d, { tur: "sancak", devlet: s.devlet, metin: `${s.ad} sancağı: ${acik ? `yönetim ${s.bey}'e bırakıldı` : "sancakbeyi yönetimi kaldırıldı"}.` });
  return { gecerli: true };
}

export interface SancakOzeti { sancak: number; ad: string; eyalet: string; merkez: number; bey: string; sehirler: number[]; yonetim: boolean; nufus: number; insanGucu: number; aylikGelir: number }

/** Sancak başına nüfus, insan gücü ve yaklaşık aylık gelir (yapı + ticaret + şehirli toprağın arazi payı). */
export function sancakOzetleri(d: DunyaDurumu, devlet: number): SancakOzeti[] {
  const arazi = araziGelirleri(d)[devlet], yapi = yapiGelirleri(d)[devlet];
  const benimSehirler = d.sehirler.filter((s) => s.devlet === devlet && s.bagli < 0).length || 1;
  return d.sancaklar.map((s, i) => ({ s, i })).filter(({ s }) => s.devlet === devlet).map(({ s, i }) => {
    const sehirler = s.sehirler.map((c) => d.sehirler[c]);
    const bagimsiz = sehirler.filter((c) => c.bagli < 0).length;
    // Arazi ve yapı geliri devlet düzeyinde vergilendirilir; sancağa şehir sayısı oranında yaklaşık pay düşer
    const pay = Math.floor(((arazi + yapi) * bagimsiz) / benimSehirler);
    const ticaret = s.sehirler.reduce((t, c) => t + sehirTicareti(d, c).gelir, 0);
    return { sancak: i, ad: s.ad, eyalet: s.eyalet, merkez: s.merkez, bey: s.bey, sehirler: s.sehirler, yonetim: s.yonetim,
      nufus: sehirler.reduce((t, c) => t + c.nufus, 0), insanGucu: sehirler.reduce((t, c) => t + c.insanGucu, 0), aylikGelir: pay + ticaret };
  });
}
