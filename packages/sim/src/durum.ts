// Dünya durumu ve senaryodan başlangıç durumu üretimi.
// Durum düz veri (JSON'a dönüştürülebilir) olarak tutulur; başvurular dizi indeksiyle yapılır.

import { tarihtenGun, type Tarih } from "./takvim";
import type { Emir } from "./emirler";
import { HAREKET, type AgVerisi, type RotaAdimi } from "./hareket";
import { DENGE } from "./denge";

export type TurSuresi = "hafta" | "ay" | "ceyrek" | "yil";
export const TUR_SURESI_ADLARI: Record<TurSuresi, string> = {
  hafta: "1 hafta", ay: "1 ay", ceyrek: "3 ay", yil: "1 yıl",
};

export interface DevletDurumu {
  id: string;
  ad: string;
  hazine: number; // tam sayı; eksi olabilir (DEC-0002), borç değildir
  baskent: number | null; // şehir indeksi
}

// MASTER_SPEC §9.1: yasal sahip ile askerî kontrol ayrı tutulur
export interface BirimDurumu {
  sahip: number; // devlet indeksi; -1 = devlet yok
  kontrol: number;
  isgalBaslangic: number | null; // gün
}

export interface SehirDurumu {
  ad: string;
  devlet: number; // yasal sahip
  kontrol: number; // askerî kontrol — şehir çevresinden ayrı ele geçirilebilir (AT-007)
  isgalBaslangic: number | null;
  birim: number; // -1 = bilinmiyor
  dugum: number; // hareket ağı düğümü; -1 = bilinmiyor
  nufus: number;
  baskent: boolean;
}

/** Geri çekilme tutumu: muharebede moral bu eşiğin altına düşünce çekilir (DEC-0008, DEC-0027/3) */
export type Tutum = "temkinli" | "dengeli" | "inatci";

export interface Savas {
  id: number;
  saldiran: number;
  savunan: number;
  baslangic: number;
}

export interface MuharebeTarafi {
  devlet: number;
  ordular: number[]; // ordu kimlikleri
  baslangicAsker: number;
  kayip: number;
  baslangicMoral: number;
}

export interface Muharebe {
  id: number;
  dugum: number;
  baslangic: number;
  gun: number; // geçen muharebe günü
  taraflar: [MuharebeTarafi, MuharebeTarafi];
}

export interface MuharebeRaporu {
  id: number;
  dugum: number;
  birim: number;
  baslangic: number;
  bitis: number;
  kazanan: number;
  taraflar: [RaporTarafi, RaporTarafi];
  nedenler: string[];
}
export interface RaporTarafi {
  devlet: number;
  ordular: string[];
  baslangicAsker: number;
  kayip: number;
  moralBas: number;
  moralSon: number;
  sonuc: "zafer" | "geri-cekildi" | "dagildi";
}

// MASTER_SPEC §8.1 ordu veri modelinin ilk sürümü (TASK-0006); birlik grupları, moral ve ikmal Aşama 4–5'te
export interface OrduDurumu {
  id: number;
  ad: string;
  devlet: number;
  asker: number;
  dugum: number; // hareket ağında bulunduğu düğüm
  x: number; // son ulaşılan nokta (Miller × 10⁴)
  y: number;
  hiz: number; // efektif metre/gün
  rota: RotaAdimi[];
  ilerleme: number; // rotanın ilk adımında katedilen efektif metre
  hedef: { x: number; y: number } | null;
  moral: number; // binde 0–1000
  tutum: Tutum;
  cekiliyor: boolean; // yenilgi sonrası geri çekilme yürüyüşü
  muharebe: number | null; // katıldığı muharebe kimliği
}

export interface OlayKaydi {
  id: number;
  gun: number;
  tur: string;
  devlet: number | null;
  metin: string;
}

export interface Kesinti {
  gun: number;
  neden: string;
}

export interface DunyaDurumu {
  sema: number;
  senaryo: string;
  tohum: number;
  rng: number;
  gun: number; // Jülyen gün numarası
  turNo: number;
  ayarlar: { turSuresi: TurSuresi; oyuncu: number };
  devletler: DevletDurumu[];
  birimler: BirimDurumu[];
  sehirler: SehirDurumu[];
  ordular: OrduDurumu[];
  sonrakiOrduId: number;
  savaslar: Savas[];
  sonrakiSavasId: number;
  muharebeler: Muharebe[];
  sonrakiMuharebeId: number;
  muharebeRaporlari: MuharebeRaporu[];
  emirKuyrugu: Emir[];
  planliKesintiler: Kesinti[];
  aktifKesinti: Kesinti | null;
  gunluk: OlayKaydi[];
  sonrakiOlayId: number;
}

export const GUNLUK_SINIRI = 500;

export interface SenaryoVerisi {
  id: string;
  surum: string;
  baslangic: Tarih;
  varsayilanOyuncu: string;
  devletler: { id: string; ad: string }[];
  birimler: { devlet: string | null }[];
  sehirler: { ad: string; devlet: string; birim: number; baskent: boolean; nufus: number; dugum?: number; x?: number; y?: number }[];
  ordular?: { ad: string; devlet: string; asker: number; dugum: number; x: number; y: number }[];
  ag?: AgVerisi;
}

// 2: ordular ve şehir kontrolü (TASK-0006); 3: savaş, muharebe, moral, garnizon orduları (TASK-0007/4a)
export const SEMA_SURUMU = 3;

// [TASLAK — test değeri] Başlangıç hazinesi: birim başına 100. Ekonomi Aşama 5'te tasarlanacak.
const BASLANGIC_HAZINE_BIRIM_BASINA = 100;

export function baslangicDurumu(s: SenaryoVerisi, secenek: { tohum: number; oyuncu?: string }): DunyaDurumu {
  const indeks = new Map(s.devletler.map((d, i) => [d.id, i]));
  const bul = (id: string | null) => {
    if (id === null) return -1;
    const i = indeks.get(id);
    if (i === undefined) throw new Error(`senaryoda bilinmeyen devlet: ${id}`);
    return i;
  };
  const oyuncu = bul(secenek.oyuncu ?? s.varsayilanOyuncu);
  const birimSayisi = new Array<number>(s.devletler.length).fill(0);
  const birimler: BirimDurumu[] = s.birimler.map((b) => {
    const sahip = bul(b.devlet);
    if (sahip >= 0) birimSayisi[sahip]++;
    return { sahip, kontrol: sahip, isgalBaslangic: null };
  });
  const sehirler: SehirDurumu[] = s.sehirler.map((c) => {
    const devlet = bul(c.devlet);
    return { ad: c.ad, devlet, kontrol: devlet, isgalBaslangic: null, birim: c.birim, dugum: c.dugum ?? -1, nufus: c.nufus, baskent: c.baskent };
  });
  const yeniOrdu = (id: number, ad: string, devlet: number, asker: number, dugum: number, x: number, y: number): OrduDurumu => ({
    id, ad, devlet, asker, dugum, x, y, hiz: HAREKET.TEMEL_HIZ, rota: [], ilerleme: 0, hedef: null,
    moral: DENGE.MORAL_EN_YUKSEK, tutum: "dengeli", cekiliyor: false, muharebe: null,
  });
  const ordular: OrduDurumu[] = (s.ordular ?? []).map((o, i) => yeniOrdu(i + 1, o.ad, bul(o.devlet), o.asker, o.dugum, o.x, o.y));
  // Garnizon orduları (DEC-0025/4, DEC-0027/1): senaryoda ordusu olmayan her devlete başkentinde bir ordu
  // [TASLAK — büyüklük test formülü: taban + birim başına; üst sınırlı]
  s.devletler.forEach((v, i) => {
    if (ordular.some((o) => o.devlet === i)) return;
    const k = s.sehirler.findIndex((c) => c.devlet === v.id && c.baskent && (c.dugum ?? -1) >= 0);
    if (k < 0) return;
    const c = s.sehirler[k];
    const asker = Math.min(DENGE.GARNIZON_EN_COK, DENGE.GARNIZON_TABAN + DENGE.GARNIZON_BIRIM_BASINA * birimSayisi[i]);
    ordular.push(yeniOrdu(ordular.length + 1, `${v.ad} Ordusu`, i, asker, c.dugum!, c.x ?? 0, c.y ?? 0));
  });
  const devletler: DevletDurumu[] = s.devletler.map((d, i) => ({
    id: d.id,
    ad: d.ad,
    hazine: birimSayisi[i] * BASLANGIC_HAZINE_BIRIM_BASINA,
    baskent: (() => { const k = sehirler.findIndex((c) => c.devlet === i && c.baskent); return k >= 0 ? k : null; })(),
  }));
  return {
    sema: SEMA_SURUMU,
    senaryo: `${s.id}@${s.surum}`,
    tohum: secenek.tohum >>> 0,
    rng: secenek.tohum >>> 0,
    gun: tarihtenGun(s.baslangic),
    turNo: 0,
    ayarlar: { turSuresi: "ay", oyuncu },
    devletler,
    birimler,
    sehirler,
    ordular,
    sonrakiOrduId: ordular.length + 1,
    savaslar: [],
    sonrakiSavasId: 1,
    muharebeler: [],
    sonrakiMuharebeId: 1,
    muharebeRaporlari: [],
    emirKuyrugu: [],
    planliKesintiler: [],
    aktifKesinti: null,
    gunluk: [],
    sonrakiOlayId: 1,
  };
}

export function olayEkle(d: DunyaDurumu, o: Omit<OlayKaydi, "id" | "gun">): OlayKaydi {
  const kayit: OlayKaydi = { id: d.sonrakiOlayId++, gun: d.gun, ...o };
  d.gunluk.push(kayit);
  if (d.gunluk.length > GUNLUK_SINIRI) d.gunluk.splice(0, d.gunluk.length - GUNLUK_SINIRI);
  return kayit;
}

/** Değişmezler (MASTER_SPEC §23.1). Hata metinlerini döndürür; boş dizi = geçerli. */
export function degismezler(d: DunyaDurumu): string[] {
  const h: string[] = [];
  const tam = (x: unknown) => typeof x === "number" && Number.isSafeInteger(x);
  if (!tam(d.gun)) h.push("gün tam sayı değil");
  if (!tam(d.rng) || d.rng < 0 || d.rng > 0xffffffff) h.push("rng 32 bit değil");
  const n = d.devletler.length;
  d.devletler.forEach((v, i) => { if (!tam(v.hazine)) h.push(`devlet ${i} hazinesi tam sayı değil`); });
  d.birimler.forEach((b, i) => {
    if (!tam(b.sahip) || b.sahip < -1 || b.sahip >= n) h.push(`birim ${i} sahibi geçersiz`);
    if (!tam(b.kontrol) || b.kontrol < -1 || b.kontrol >= n) h.push(`birim ${i} kontrolü geçersiz`);
  });
  d.sehirler.forEach((c, i) => {
    if (!tam(c.nufus) || c.nufus < 0) h.push(`şehir ${i} nüfusu geçersiz`);
    if (c.devlet < 0 || c.devlet >= n) h.push(`şehir ${i} devleti geçersiz`);
    if (!tam(c.kontrol) || c.kontrol < 0 || c.kontrol >= n) h.push(`şehir ${i} kontrolü geçersiz`);
  });
  const idler = new Set<number>();
  d.ordular.forEach((o, i) => {
    if (idler.has(o.id)) h.push(`ordu ${i} kimliği tekrar ediyor`);
    idler.add(o.id);
    if (o.devlet < 0 || o.devlet >= n) h.push(`ordu ${i} devleti geçersiz`);
    if (!tam(o.asker) || o.asker < 0) h.push(`ordu ${i} asker sayısı geçersiz`);
    if (![o.x, o.y, o.dugum, o.hiz, o.ilerleme].every(tam) || o.hiz <= 0) h.push(`ordu ${i} konum/hız tam sayı değil`);
    if (o.rota.some((a) => ![a.x, a.y, a.d, a.m].every(tam) || a.m <= 0)) h.push(`ordu ${i} rotası geçersiz`);
    if (o.rota.length && o.ilerleme >= o.rota[0].m) h.push(`ordu ${i} ilerlemesi adımı aşıyor`);
    if (!tam(o.moral) || o.moral < 0 || o.moral > DENGE.MORAL_EN_YUKSEK) h.push(`ordu ${i} morali geçersiz`);
    if (o.muharebe !== null && !d.muharebeler.some((m) => m.id === o.muharebe)) h.push(`ordu ${i} olmayan bir muharebede`);
  });
  for (const s of d.savaslar) if (s.saldiran === s.savunan || !d.devletler[s.saldiran] || !d.devletler[s.savunan]) h.push(`savaş ${s.id} geçersiz`);
  if (d.ayarlar.oyuncu < 0 || d.ayarlar.oyuncu >= n) h.push("oyuncu devleti geçersiz");
  return h;
}
