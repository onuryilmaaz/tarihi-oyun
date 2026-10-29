// Dünya durumu ve senaryodan başlangıç durumu üretimi.
// Durum düz veri (JSON'a dönüştürülebilir) olarak tutulur; başvurular dizi indeksiyle yapılır.

import { tarihtenGun, type Tarih } from "./takvim";
import type { Emir } from "./emirler";
import { HAREKET, type AgVerisi, type RotaAdimi } from "./hareket";

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
  nufus: number;
  baskent: boolean;
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
  sehirler: { ad: string; devlet: string; birim: number; baskent: boolean; nufus: number }[];
  ordular?: { ad: string; devlet: string; asker: number; dugum: number; x: number; y: number }[];
  ag?: AgVerisi;
}

// 2: ordular ve şehir kontrolü eklendi (TASK-0006)
export const SEMA_SURUMU = 2;

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
    return { ad: c.ad, devlet, kontrol: devlet, isgalBaslangic: null, birim: c.birim, nufus: c.nufus, baskent: c.baskent };
  });
  const ordular: OrduDurumu[] = (s.ordular ?? []).map((o, i) => ({
    id: i + 1, ad: o.ad, devlet: bul(o.devlet), asker: o.asker, dugum: o.dugum, x: o.x, y: o.y,
    hiz: HAREKET.TEMEL_HIZ, rota: [], ilerleme: 0, hedef: null,
  }));
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
  });
  if (d.ayarlar.oyuncu < 0 || d.ayarlar.oyuncu >= n) h.push("oyuncu devleti geçersiz");
  return h;
}
