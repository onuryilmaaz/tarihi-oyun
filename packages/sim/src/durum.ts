// Dünya durumu ve senaryodan başlangıç durumu üretimi.
// Durum düz veri (JSON'a dönüştürülebilir) olarak tutulur; başvurular dizi indeksiyle yapılır.

import { tarihtenGun, type Tarih } from "./takvim";
import { bosIstikrar, type Istikrar } from "./istikrar";
import { bosYerelYonetim, type YerelYonetim } from "./yonetim";
import type { Ambargo } from "./ticaret";
import { GOREV_TURLERI, type CasusEtkisi, type CasusGorevi } from "./casusluk";
import { baslangicDenizi, GEMI_TURLERI, type DenizHaritasi, type Donanma, type GemiInsasi } from "./deniz";
import type { Emir } from "./emirler";
import { HAREKET, type AgVerisi, type RotaAdimi } from "./hareket";
import { DENGE } from "./denge";
import type { Insaat } from "./yatirim";
import type { Arastirma, TeknolojiId } from "./teknoloji";
import type { IliskiEtkisi, Ittifak } from "./diplomasi";
import { BILINMIYOR, DIN_AILELERI, baslangicGruplari, type Iskan, type NufusGrubu } from "./nufus";
import { baslangicHanedanlari, type AdHavuzu, type Hukumdar, type TarihiHalef, type Veraset, type VerasetSecimi } from "./hanedan";
import type { VergiOrani } from "./vergi";
import { BIRIM_TURLERI, kompozisyonToplami, tekTurKompozisyon, type BirimTuru, type Kompozisyon } from "./birim";

export type TurSuresi = "hafta" | "ay" | "ceyrek" | "yil";
export const TUR_SURESI_ADLARI: Record<TurSuresi, string> = {
  hafta: "1 hafta", ay: "1 ay", ceyrek: "3 ay", yil: "1 yıl",
};

export interface DevletDurumu {
  id: string;
  ad: string;
  hazine: number; // tam sayı; eksi olabilir (DEC-0002), borç değildir
  baskent: number | null; // şehir indeksi
  teknolojiler: TeknolojiId[]; // bitmiş araştırmalar (TASK-0008/5c)
  // TASK-0010/7a: hükümdar (null = veraset bekleniyor), gelenek, kurgusal ad havuzu, sıradaki tarihî halef
  hukumdar: Hukumdar | null;
  veraset: Veraset;
  adHavuzu: AdHavuzu;
  tarihiHalef: TarihiHalef | null;
  din: string; // resmî din (7b); "bilinmiyor" = veri yok
  kultur: string; // baskın kültür
  vergiOrani: VergiOrani; // TASK-0017: arazi/yapı geliri ve istikrar riski üzerinde etkili (19)
  hazineGecmisi: number[]; // son aylık net gelir-gider farkları, en eski başta; en çok 12 kayıt (19)
}

// MASTER_SPEC §9.1: yasal sahip ile askerî kontrol ayrı tutulur
export interface BirimDurumu {
  sahip: number; // devlet indeksi; -1 = devlet yok
  kontrol: number;
  isgalBaslangic: number | null; // gün
  verim: number; // arazi verimi (9b; 10 = ortalama, arazi geliri bununla ölçeklenir)
}

export interface SehirDurumu {
  ad: string;
  devlet: number; // yasal sahip
  kontrol: number; // askerî kontrol — şehir çevresinden ayrı ele geçirilebilir (AT-007)
  isgalBaslangic: number | null;
  birim: number; // -1 = bilinmiyor
  dugum: number; // hareket ağı düğümü; -1 = bilinmiyor
  nufus: number;
  insanGucu: number; // kalan ek asker havuzu; nüfustan türetilmiş test değeri
  baskent: boolean;
  sur: number; // prototip seviye; tarihî doğrulanmış sur verisi değildir
  garnizon: number; // şehirdeki savunucular; hareketli ordudan ayrıdır
  istikrar: Istikrar;
  yonetici: boolean; // oyuncunun yerel yöneticisi açık mı (7d)
  gruplar: NufusGrubu[]; // din × kültür; toplam = nufus (7b)
  yapilar: { tarla: number; pazar: number }; // 5b şehir yatırımları (seviye 0–en yüksek)
}

export type KusatmaYontemi = "abluka" | "saldiri" | "bekle";
export interface Kusatma {
  sehir: number;
  devlet: number;
  savunan: number;
  ordular: number[];
  yontem: KusatmaYontemi;
  baslangic: number;
  gun: number;
  erzak: number; // binde; yalnızca mevcut kuşatma süresince takip edilir
}
export interface IsgalHazirligi { birim: number; devlet: number; gun: number }
export interface BarisTalebi { savas: number; birimler: number[]; sehirler: number[]; tazminat: number; vasalYap?: boolean } // TASK-0018
export interface BarisKaydi extends BarisTalebi { gun: number; devlet: number; karsi: number }
/** AI'dan oyuncuya barış teklifi (TASK-0009/6c); alan: talep edilen yerleri alacak taraf */
export interface BarisTeklifi { id: number; savas: number; teklifEden: number; alan: number; talep: BarisTalebi; gun: number; gerekce: string }
export interface Ateskes { a: number; b: number; bitis: number } // a < b

// TASK-0017 (4/4, DEC-0066): temel diplomasi — ticaret anlaşması ve saldırmazlık paktı (a < b)
export interface TicaretAnlasmasi { a: number; b: number; baslangic: number }
export interface SaldirmazlikPakti { a: number; b: number; bitis: number }

/** TASK-0018 (2/3, DEC-0067): yalnızca barışta kurulan vasallık; bir devletin en çok bir efendisi olur. */
export interface Vasallik { efendi: number; vasal: number; baslangic: number }

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
  asker: number; // toplam; kapasite/asayiş/görünürlük bunu kullanır
  kompozisyon: Kompozisyon; // TASK-0019 (23): türlere göre dağılım, toplamı asker'e eşit olmalı
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

export interface AskerToplama {
  id: number; // TASK-0017 (20): iptal emriyle adreslemek için
  sehir: number;
  devlet: number;
  asker: number;
  birim: BirimTuru; // TASK-0019 (23)
  kalanGun: number;
  bedel: number; // iptalde tam iade edilen tutar (sonradan teknolojiyle oran değişse de sabit kalır)
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
  askerToplamalar: AskerToplama[];
  sonrakiToplamaId: number; // TASK-0017 (20)
  insaatlar: Insaat[];
  arastirmalar: Arastirma[];
  iliskiEtkileri: IliskiEtkisi[]; // TASK-0009/6a
  saldirganlik: number[]; // devlet başına; ayda söner
  ittifaklar: Ittifak[];
  ticaretAnlasmalari: TicaretAnlasmasi[]; // TASK-0017 (21)
  saldirmazlikPaktlari: SaldirmazlikPakti[]; // TASK-0017 (21)
  vasalliklar: Vasallik[]; // TASK-0018 (22)
  yzSayac: { insaat: number; arastirma: number; asker: number }; // yıllık dünya özeti (6b)
  barisTeklifleri: BarisTeklifi[]; // 6c
  sonrakiTeklifId: number;
  ateskesler: Ateskes[];
  verasetSecimi: VerasetSecimi | null; // oyuncunun halef seçimi (7a)
  iskanlar: Iskan[]; // yoldaki iskânlar (7b)
  yerelYonetim: YerelYonetim; // oyuncunun yerel yönetim bütçesi (7d)
  // 8a: deniz haritası (senaryodan, değişmez), donanmalar ve gemi inşaları
  deniz: DenizHaritasi;
  donanmalar: Donanma[];
  sonrakiDonanmaId: number;
  gemiInsalari: GemiInsasi[];
  ambargolar: Ambargo[]; // 8b
  casusGorevleri: CasusGorevi[]; // 8c
  casusEtkileri: CasusEtkisi[];
  sonrakiGorevId: number;
  kusatmalar: Kusatma[];
  isgalHazirliklari: IsgalHazirligi[];
  barislar: BarisKaydi[];
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
  birimler: { devlet: string | null; verim?: number }[];
  sehirler: { ad: string; devlet: string; birim: number; baskent: boolean; nufus: number; dugum?: number; x?: number; y?: number }[];
  ordular?: { ad: string; devlet: string; asker: number; dugum: number; x: number; y: number }[];
  // Başlangıç ilişkileri ve ittifakları (6a; tarihî tahmin, [TASLAK])
  iliskiler?: { a: string; b: string; deger: number; not?: string }[];
  ittifaklar?: { a: string; b: string; not?: string }[];
  // 1453 hükümdarları, veraset gelenekleri ve ad havuzları (7a; tarihî tahmin, [TASLAK])
  hukumdarlar?: {
    hukumdarlar: { devlet: string; ad: string; hanedan: string; dogum: number; yetenek: [number, number, number]; halef?: { ad: string; dogum: number; yetenek: [number, number, number] } }[];
    veraset: { acik: string[]; secimli: string[] };
    adHavuzu: Partial<Record<AdHavuzu, string[]>>;
  };
  // 1453 nüfus grupları (7b; tahmini, [TASLAK]): karışım [din, kültür, binde]
  // Deniz bölgeleri, limanlar, boğazlar, başlangıç donanmaları (8a; tahmini, [TASLAK])
  deniz?: {
    bolgeler: { id: string; ad: string; lon: number; lat: number; komsu: string[]; ticaretGecidi?: string }[];
    limanlar: Record<string, string[]>;
    bogazlar: { ad: string; bolge: string }[];
    donanmalar: { devlet: string; bolge: string; ad: string; kadirga: number; kalyon: number }[];
  };
  nufus?: {
    dinler: Record<string, string>; dinAileleri: Record<string, string>; kulturler: Record<string, string>;
    devletler: Record<string, { din: string; kultur: string; karisim: [string, string, number][] }>;
    sehirler: Record<string, [string, string, number][]>;
  };
  ag?: AgVerisi;
}

// 2: ordular ve şehir kontrolü (TASK-0006); 3: savaş, muharebe, moral, garnizon orduları (TASK-0007/4a)
// 4: insan gücü ve asker toplama (TASK-0007/4b); şema 3 için eklemeli dönüşüm var.
// 5: kuşatma, gerçek işgal ve barış (TASK-0007/4c); şema 3–4 için eklemeli dönüşüm var.
// Şema geçmişi: 6 şehir yatırımları (5b), 7 teknoloji (5c), 8 diplomasi (6a), 9 AI ekonomi (6b), 10 AI savaş/barış (6c),
// 11 hükümdar ve veraset (7a), 12 nüfus grupları ve iskân (7b), 13 istikrar (7c), 14 yerel yönetim (7d)
export const SEMA_SURUMU = 23; // 23 birim çeşitliliği (TASK-0019), 22 vasallık (TASK-0018), 21 ticaret anlaşması ve saldırmazlık paktı (TASK-0017), 20 asker toplama iptali (TASK-0017),
// 19 vergi oranı ve hazine geçmişi (TASK-0017), 18 arazi verimi (9b), 15 donanma ve deniz (8a), 16 ticaret ve ambargo (8b), 17 casusluk (8c)

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
    return { sahip, kontrol: sahip, isgalBaslangic: null, verim: b.verim ?? 10 };
  });
  const sehirler: SehirDurumu[] = s.sehirler.map((c) => {
    const devlet = bul(c.devlet);
    return { ad: c.ad, devlet, kontrol: devlet, isgalBaslangic: null, birim: c.birim, dugum: c.dugum ?? -1, nufus: c.nufus,
      insanGucu: Math.floor(c.nufus * DENGE.INSAN_GUCU_YUZDE / 100), baskent: c.baskent,
      sur: c.baskent ? DENGE.BASKENT_SUR : DENGE.SEHIR_SUR,
      garnizon: c.baskent ? DENGE.BASKENT_GARNIZON : DENGE.SEHIR_GARNIZON, yapilar: { tarla: 0, pazar: 0 },
      istikrar: bosIstikrar(), yonetici: false, gruplar: baslangicGruplari(s, c.ad, c.devlet, c.nufus) };
  });
  // TASK-0019: senaryo/garnizon orduları başlangıçta tamamen piyade sayılır.
  const yeniOrdu = (id: number, ad: string, devlet: number, asker: number, dugum: number, x: number, y: number): OrduDurumu => ({
    id, ad, devlet, asker, kompozisyon: tekTurKompozisyon("piyade", asker), dugum, x, y, hiz: HAREKET.TEMEL_HIZ, rota: [], ilerleme: 0, hedef: null,
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
  const hanedanlar = baslangicHanedanlari(s, secenek.tohum >>> 0, s.baslangic.yil, tarihtenGun(s.baslangic));
  const deniz = baslangicDenizi(s, (id) => bul(id));
  const devletler: DevletDurumu[] = s.devletler.map((d, i) => ({
    id: d.id,
    ad: d.ad,
    hazine: birimSayisi[i] * DENGE.BASLANGIC_HAZINE_BIRIM_BASINA,
    baskent: (() => { const k = sehirler.findIndex((c) => c.devlet === i && c.baskent); return k >= 0 ? k : null; })(),
    teknolojiler: [],
    ...hanedanlar[i],
    din: s.nufus?.devletler[d.id]?.din ?? BILINMIYOR.din,
    kultur: s.nufus?.devletler[d.id]?.kultur ?? BILINMIYOR.kultur,
    vergiOrani: "orta" as VergiOrani,
    hazineGecmisi: [],
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
    askerToplamalar: [],
    sonrakiToplamaId: 1,
    insaatlar: [],
    arastirmalar: [],
    iliskiEtkileri: (s.iliskiler ?? []).map((r) => {
      const [a, b] = [bul(r.a), bul(r.b)].sort((x, y) => x - y);
      return { a, b, neden: "tarih" as const, deger: r.deger };
    }),
    saldirganlik: s.devletler.map(() => 0),
    yzSayac: { insaat: 0, arastirma: 0, asker: 0 },
    barisTeklifleri: [],
    sonrakiTeklifId: 1,
    ateskesler: [],
    verasetSecimi: null,
    iskanlar: [],
    yerelYonetim: bosYerelYonetim(),
    deniz: deniz.deniz,
    donanmalar: deniz.donanmalar,
    sonrakiDonanmaId: deniz.donanmalar.length + 1,
    gemiInsalari: [],
    ambargolar: [],
    casusGorevleri: [],
    casusEtkileri: [],
    sonrakiGorevId: 1,
    ittifaklar: (s.ittifaklar ?? []).map((r) => {
      const [a, b] = [bul(r.a), bul(r.b)].sort((x, y) => x - y);
      return { a, b, baslangic: tarihtenGun(s.baslangic) };
    }),
    ticaretAnlasmalari: [],
    saldirmazlikPaktlari: [],
    vasalliklar: [],
    kusatmalar: [],
    isgalHazirliklari: [],
    barislar: [],
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
  // Günlük oyuncunun gördüğü olayları tutar; başka devletlere özel olaylar (AI kararları, TASK-0009/6b)
  // sınırlı tamponu doldurup oyuncunun kayıtlarını silmesin diye yazılmaz.
  if (o.devlet !== null && o.devlet !== d.ayarlar.oyuncu) return kayit;
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
  d.devletler.forEach((v, i) => {
    if (!tam(v.hazine)) h.push(`devlet ${i} hazinesi tam sayı değil`);
    if (!["dusuk", "orta", "yuksek"].includes(v.vergiOrani)) h.push(`devlet ${i} vergi oranı geçersiz`);
    if (!Array.isArray(v.hazineGecmisi) || v.hazineGecmisi.length > DENGE.HAZINE_GECMISI_EN_COK || !v.hazineGecmisi.every(tam))
      h.push(`devlet ${i} hazine geçmişi geçersiz`);
  });
  d.birimler.forEach((b, i) => {
    if (!tam(b.sahip) || b.sahip < -1 || b.sahip >= n) h.push(`birim ${i} sahibi geçersiz`);
    if (!tam(b.kontrol) || b.kontrol < -1 || b.kontrol >= n) h.push(`birim ${i} kontrolü geçersiz`);
  });
  d.sehirler.forEach((c, i) => {
    if (!tam(c.nufus) || c.nufus < 0) h.push(`şehir ${i} nüfusu geçersiz`);
    if (!tam(c.insanGucu) || c.insanGucu < 0) h.push(`şehir ${i} insan gücü geçersiz`);
    if (!tam(c.sur) || c.sur < 0 || !tam(c.garnizon) || c.garnizon < 0) h.push(`şehir ${i} savunması geçersiz`);
    if (!tam(c.devlet) || c.devlet < 0 || c.devlet >= n) h.push(`şehir ${i} devleti geçersiz`);
    if (!tam(c.kontrol) || c.kontrol < 0 || c.kontrol >= n) h.push(`şehir ${i} kontrolü geçersiz`);
  });
  if (!Array.isArray(d.askerToplamalar)) h.push("asker toplama listesi eksik");
  else {
    const toplamaIdler = new Set<number>();
    for (const t of d.askerToplamalar) {
      if (!t || !tam(t.sehir) || !d.sehirler[t.sehir] || !tam(t.devlet) || !d.devletler[t.devlet]
        || !tam(t.asker) || t.asker <= 0 || !tam(t.kalanGun) || t.kalanGun < 0 || !tam(t.id) || !tam(t.bedel) || t.bedel < 0
        || !BIRIM_TURLERI.includes(t.birim)) h.push("asker toplama geçersiz");
      else if (toplamaIdler.has(t.id)) h.push(`asker toplama kimliği tekrar ediyor: ${t.id}`);
      else toplamaIdler.add(t.id);
    }
    if (!tam(d.sonrakiToplamaId) || d.sonrakiToplamaId < 1 || d.askerToplamalar.some((t) => t && t.id >= d.sonrakiToplamaId))
      h.push("sonraki asker toplama kimliği geçersiz");
  }
  const idler = new Set<number>();
  d.ordular.forEach((o, i) => {
    if (idler.has(o.id)) h.push(`ordu ${i} kimliği tekrar ediyor`);
    idler.add(o.id);
    if (!tam(o.devlet) || o.devlet < 0 || o.devlet >= n) h.push(`ordu ${i} devleti geçersiz`);
    if (!tam(o.asker) || o.asker < 0) h.push(`ordu ${i} asker sayısı geçersiz`);
    if (!o.kompozisyon || !BIRIM_TURLERI.every((t) => tam(o.kompozisyon[t]) && o.kompozisyon[t] >= 0) || kompozisyonToplami(o.kompozisyon) !== o.asker)
      h.push(`ordu ${i} kompozisyonu asker sayısıyla uyuşmuyor`); // TASK-0019
    if (![o.x, o.y, o.dugum, o.hiz, o.ilerleme].every(tam) || o.hiz <= 0) h.push(`ordu ${i} konum/hız tam sayı değil`);
    if (o.rota.some((a) => ![a.x, a.y, a.d, a.m].every(tam) || a.m <= 0)) h.push(`ordu ${i} rotası geçersiz`);
    if (o.rota.length && o.ilerleme >= o.rota[0].m) h.push(`ordu ${i} ilerlemesi adımı aşıyor`);
    if (!tam(o.moral) || o.moral < 0 || o.moral > DENGE.MORAL_EN_YUKSEK) h.push(`ordu ${i} morali geçersiz`);
    if (o.muharebe !== null && !d.muharebeler.some((m) => m.id === o.muharebe)) h.push(`ordu ${i} olmayan bir muharebede`);
  });
  if (!tam(d.sonrakiOrduId) || d.sonrakiOrduId < 1 || d.ordular.some((o) => o.id >= d.sonrakiOrduId)) h.push("sonraki ordu kimliği geçersiz");
  const kusatilan = new Set<number>(), kusatan = new Set<number>();
  if (!Array.isArray(d.kusatmalar) || !Array.isArray(d.isgalHazirliklari) || !Array.isArray(d.barislar)) h.push("kuşatma/işgal/barış listeleri eksik");
  else {
    for (const k of d.kusatmalar) {
      if (!k || !tam(k.sehir) || !d.sehirler[k.sehir] || !tam(k.devlet) || !d.devletler[k.devlet]
        || !tam(k.savunan) || !d.devletler[k.savunan] || k.devlet === k.savunan
        || !tam(k.gun) || k.gun < 0 || !tam(k.baslangic) || !tam(k.erzak) || k.erzak < 0 || k.erzak > DENGE.KUSATMA_ERZAK
        || !["abluka", "bekle", "saldiri"].includes(k.yontem) || !Array.isArray(k.ordular) || !k.ordular.length) {
        h.push("kuşatma geçersiz"); continue;
      }
      if (kusatilan.has(k.sehir)) h.push("şehir iki kez kuşatılıyor");
      kusatilan.add(k.sehir);
      for (const id of k.ordular) {
        if (kusatan.has(id) || !d.ordular.some((o) => o.id === id && o.devlet === k.devlet)) h.push("kuşatma ordusu geçersiz");
        kusatan.add(id);
      }
    }
    for (const p of d.isgalHazirliklari) if (!p || !tam(p.birim) || !d.birimler[p.birim]
      || !tam(p.devlet) || !d.devletler[p.devlet] || !tam(p.gun) || p.gun < 1 || p.gun >= DENGE.ISGAL_GUN) h.push("işgal hazırlığı geçersiz");
    for (const p of d.barislar) if (!p || !tam(p.gun) || !tam(p.savas) || !d.devletler[p.devlet] || !d.devletler[p.karsi]
      || !tam(p.tazminat) || p.tazminat < 0 || !Array.isArray(p.birimler) || p.birimler.some((i) => !tam(i) || !d.birimler[i])
      || !Array.isArray(p.sehirler) || p.sehirler.some((i) => !tam(i) || !d.sehirler[i])) h.push("barış kaydı geçersiz");
  }
  for (const s of d.savaslar) if (s.saldiran === s.savunan || !d.devletler[s.saldiran] || !d.devletler[s.savunan]) h.push(`savaş ${s.id} geçersiz`);
  d.sehirler.forEach((c, i) => {
    const st = c.istikrar;
    if (!st || ![st.risk, st.oncekiRisk].every((n) => tam(n) && n >= 0 && n <= 100)
      || ![st.yuksekAy, st.asayisAy, st.bagis].every((n) => tam(n) && n >= 0)
      || st.bagis > DENGE.IST_BAGIS_INDIRIM || typeof st.ayaklanma !== "boolean" || (st.fetihGun !== null && (!tam(st.fetihGun) || st.fetihGun > d.gun))
      || (st.hesapGun !== null && (!tam(st.hesapGun) || st.hesapGun > d.gun))
      || !Array.isArray(st.bilesenler) || !Array.isArray(st.degisim)
      || [...st.bilesenler, ...st.degisim].some((x) => !x || !tam(x.puan) || typeof x.id !== "string" || typeof x.ad !== "string")) h.push(`şehir ${i} istikrarı geçersiz`);
    const y = c.yapilar;
    if (!y || !tam(y.tarla) || !tam(y.pazar) || y.tarla < 0 || y.pazar < 0
      || y.tarla > DENGE.YAPI_EN_YUKSEK_TEKNOLOJIYLE.tarla || y.pazar > DENGE.YAPI_EN_YUKSEK_TEKNOLOJIYLE.pazar) h.push(`şehir ${i} yapıları geçersiz`);
  });
  const insaatSehirleri = new Set<number>();
  d.insaatlar.forEach((x, i) => {
    if (!d.sehirler[x.sehir] || insaatSehirleri.has(x.sehir)) h.push(`inşaat ${i} şehri geçersiz ya da tekrar ediyor`);
    insaatSehirleri.add(x.sehir);
    if (!["tarla", "pazar", "sur"].includes(x.yapi) || !tam(x.hedef) || x.hedef > DENGE.YAPI_EN_YUKSEK_TEKNOLOJIYLE[x.yapi] || !tam(x.kalanGun) || x.kalanGun <= 0) h.push(`inşaat ${i} geçersiz`);
  });
  d.devletler.forEach((v, i) => {
    if (!Array.isArray(v.teknolojiler) || v.teknolojiler.some((t) => !(t in DENGE.TEKNOLOJI)) || new Set(v.teknolojiler).size !== v.teknolojiler.length) h.push(`devlet ${i} teknolojileri geçersiz`);
  });
  const arastiran = new Set<string>();
  d.arastirmalar.forEach((a, i) => {
    if (!d.devletler[a.devlet] || !(a.teknoloji in DENGE.TEKNOLOJI) || !tam(a.kalanGun) || a.kalanGun <= 0
      || d.devletler[a.devlet].teknolojiler.includes(a.teknoloji) || arastiran.has(`${a.devlet}:${a.teknoloji}`)) h.push(`araştırma ${i} geçersiz`);
    arastiran.add(`${a.devlet}:${a.teknoloji}`);
  });
  for (const t of d.barisTeklifleri) {
    const s = d.savaslar.find((v) => v.id === t.savas);
    if (!s || ![s.saldiran, s.savunan].includes(t.teklifEden) || ![s.saldiran, s.savunan].includes(t.alan) || !tam(t.id) || t.id >= d.sonrakiTeklifId) h.push(`barış teklifi ${t.id} geçersiz`);
  }
  for (const a of d.ateskesler) if (!d.devletler[a.a] || !d.devletler[a.b] || a.a >= a.b || !tam(a.bitis)) h.push("ateşkes geçersiz");
  for (const t of d.ticaretAnlasmalari) if (!d.devletler[t.a] || !d.devletler[t.b] || t.a >= t.b || !tam(t.baslangic)) h.push("ticaret anlaşması geçersiz");
  for (const p of d.saldirmazlikPaktlari) if (!d.devletler[p.a] || !d.devletler[p.b] || p.a >= p.b || !tam(p.bitis)) h.push("saldırmazlık paktı geçersiz");
  {
    const vasallar = new Set<number>();
    for (const v of d.vasalliklar) {
      if (!d.devletler[v.efendi] || !d.devletler[v.vasal] || v.efendi === v.vasal || !tam(v.baslangic)) h.push("vasallık geçersiz");
      else if (vasallar.has(v.vasal)) h.push(`devlet ${v.vasal} birden çok efendiye vasal`);
      else vasallar.add(v.vasal);
    }
  }
  d.devletler.forEach((v, i) => {
    const k = v.hukumdar;
    if (!["babadan", "acik", "secimli"].includes(v.veraset) || !["turk", "slav", "rum", "latin", "asya", "genel"].includes(v.adHavuzu)) h.push(`devlet ${i} veraset/ad havuzu geçersiz`);
    if (k && (!tam(k.dogum) || ![k.yonetim, k.askerlik, k.diplomasi].every((x) => tam(x) && x >= 0 && x <= 6) || !tam(k.mesruiyet) || k.mesruiyet < 0 || k.mesruiyet > 100)) h.push(`devlet ${i} hükümdarı geçersiz`);
    if (!k && d.verasetSecimi?.devlet !== i) h.push(`devlet ${i} hükümdarsız`);
  });
  if (d.verasetSecimi && (d.verasetSecimi.devlet !== d.ayarlar.oyuncu || !d.verasetSecimi.adaylar.length)) h.push("veraset seçimi geçersiz");
  d.sehirler.forEach((c, i) => {
    if (!Array.isArray(c.gruplar) || c.gruplar.some((g) => !tam(g.nufus) || g.nufus <= 0 || !(g.din in DIN_AILELERI))
      || c.gruplar.reduce((t, g) => t + g.nufus, 0) !== c.nufus || c.nufus < 0) h.push(`şehir ${i} nüfus grupları tutarsız`);
  });
  for (const v of d.devletler) if (!(v.din in DIN_AILELERI) || typeof v.kultur !== "string") h.push(`${v.id} din/kültür geçersiz`);
  for (const k of d.iskanlar) if (!d.sehirler[k.kaynak] || !d.sehirler[k.hedef] || !tam(k.kalanGun) || k.kalanGun <= 0
    || k.gruplar.some((g) => !tam(g.nufus) || g.nufus <= 0)) h.push("iskân geçersiz");
  if (d.birimler.some((b) => !tam(b.verim) || b.verim < 1 || b.verim > 20)) h.push("arazi verimi geçersiz");
  const B = d.deniz.bolgeler.length;
  if (d.deniz.limanlar.length !== d.sehirler.length || d.deniz.limanlar.some((x) => !tam(x) || x < -1 || x >= B)) h.push("liman listesi geçersiz");
  const donanmaId = new Set<number>();
  for (const f of d.donanmalar) {
    if (!tam(f.id) || f.id >= d.sonrakiDonanmaId || donanmaId.has(f.id) || !d.devletler[f.devlet] || !tam(f.bolge) || f.bolge < 0 || f.bolge >= B
      || !GEMI_TURLERI.every((t) => tam(f[t]) && f[t] >= 0) || f.kadirga + f.kalyon <= 0 || !tam(f.moral) || f.moral < 0 || f.moral > 1000
      || f.rota.some((x) => !tam(x) || x < 0 || x >= B) || !tam(f.kalanGun) || f.kalanGun < 0
      || (f.yuk !== null && (f.yuk.devlet !== f.devlet || d.ordular.some((o) => o.id === f.yuk!.id)))) h.push(`donanma ${f.id} geçersiz`);
    donanmaId.add(f.id);
  }
  for (const b of d.deniz.bolgeler) if (!tam(b.gecit) || b.gecit < -1 || b.gecit >= B) h.push(`deniz bölgesi ${b.id} geçidi geçersiz`);
  const amb = new Set<string>();
  for (const a of d.ambargolar) {
    if (!d.devletler[a.devlet] || !d.devletler[a.hedef] || a.devlet === a.hedef || amb.has(`${a.devlet}:${a.hedef}`)) h.push("ambargo geçersiz");
    amb.add(`${a.devlet}:${a.hedef}`);
  }
  for (const g of d.casusGorevleri) if (!tam(g.id) || g.id >= d.sonrakiGorevId || !d.devletler[g.devlet] || !d.devletler[g.hedef]
    || !GOREV_TURLERI.includes(g.tur) || !tam(g.kalanGun) || g.kalanGun <= 0 || (g.sehir !== null && !d.sehirler[g.sehir])) h.push("casus görevi geçersiz");
  for (const e of d.casusEtkileri) if (!d.devletler[e.devlet] || !d.devletler[e.hedef] || !["askeri", "diplomatik", "isyan"].includes(e.tur) || !tam(e.bitis)
    || (e.carpanBinde !== undefined && (!tam(e.carpanBinde) || e.carpanBinde <= 0))) h.push("casus etkisi geçersiz");
  for (const g of d.gemiInsalari) if (!d.sehirler[g.sehir] || (d.deniz.limanlar[g.sehir] ?? -1) < 0 || !GEMI_TURLERI.includes(g.gemi)
    || !tam(g.adet) || g.adet <= 0 || !tam(g.kalanGun) || g.kalanGun <= 0) h.push("gemi inşası geçersiz");
  const yy = d.yerelYonetim;
  // Tavan sonradan düşürülebilir; bu ay gerçekleşmiş harcama yeni tavandan büyük olabilir.
  if (!yy || ![yy.butce, yy.altSinir, yy.harcanan].every((x) => tam(x) && x >= 0)) h.push("yerel yönetim geçersiz");
  d.sehirler.forEach((c, i) => { if (typeof c.yonetici !== "boolean") h.push(`şehir ${i} yönetici alanı geçersiz`); });
  const y = d.yzSayac;
  if (!y || ![y.insaat, y.arastirma, y.asker].every((x) => tam(x) && x >= 0)) h.push("AI sayacı geçersiz");
  if (!Array.isArray(d.saldirganlik) || d.saldirganlik.length !== n || d.saldirganlik.some((x) => !tam(x) || x < 0)) h.push("saldırganlık geçersiz");
  const etkiler = new Set<string>();
  for (const e of d.iliskiEtkileri) {
    const k = `${e.a}:${e.b}:${e.neden}`;
    if (!d.devletler[e.a] || !d.devletler[e.b] || e.a >= e.b || !tam(e.deger) || e.deger === 0 || etkiler.has(k)) h.push("ilişki etkisi geçersiz");
    etkiler.add(k);
  }
  const ittifak = new Set<string>();
  for (const i of d.ittifaklar) {
    if (!d.devletler[i.a] || !d.devletler[i.b] || i.a >= i.b || ittifak.has(`${i.a}:${i.b}`)) h.push("ittifak geçersiz");
    ittifak.add(`${i.a}:${i.b}`);
  }
  if (!d.ayarlar || !tam(d.ayarlar.oyuncu) || d.ayarlar.oyuncu < 0 || d.ayarlar.oyuncu >= n) h.push("oyuncu devleti geçersiz");
  const yasayan = new Set([...d.birimler.map((b) => b.sahip), ...d.sehirler.map((s) => s.devlet)]);
  const savasVar = (a: number, b: number) => d.savaslar.some((s) =>
    (s.saldiran === a && s.savunan === b) || (s.saldiran === b && s.savunan === a));
  for (const m of d.muharebeler) if (!savasVar(m.taraflar[0].devlet, m.taraflar[1].devlet))
    h.push(`savaş ilişkisi: muharebe ${m.id} bitmiş savaşa ait`);
  for (const b of d.birimler) if (b.kontrol >= 0 && !yasayan.has(b.kontrol)) h.push("savaş ilişkisi: araziyi yıkılmış devlet kontrol ediyor");
  for (const s of d.sehirler) if (!yasayan.has(s.kontrol)) h.push("savaş ilişkisi: şehri yıkılmış devlet kontrol ediyor");
  return h;
}
