// Dünya durumu ve senaryodan başlangıç durumu üretimi.
// Durum düz veri (JSON'a dönüştürülebilir) olarak tutulur; başvurular dizi indeksiyle yapılır.

import { tarihtenGun, type Tarih } from "./takvim";
import type { Emir } from "./emirler";

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
  devlet: number;
  birim: number; // -1 = bilinmiyor
  nufus: number;
  baskent: boolean;
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
}

export const SEMA_SURUMU = 1;

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
  const sehirler: SehirDurumu[] = s.sehirler.map((c) => ({
    ad: c.ad, devlet: bul(c.devlet), birim: c.birim, nufus: c.nufus, baskent: c.baskent,
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
  });
  if (d.ayarlar.oyuncu < 0 || d.ayarlar.oyuncu >= n) h.push("oyuncu devleti geçersiz");
  return h;
}
