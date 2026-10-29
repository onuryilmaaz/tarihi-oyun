// TASK-0010/7a: hükümdar ve veraset (MASTER_SPEC §6; DEC-0043).
// Her devletin bir hükümdarı vardır; ölüm yaşa bağlı olasılıkladır, tarihî ölüm tarihi zorlanmaz.
// Tarihî halef tablodaysa ve hayattaysa birinci adaydır; ondan ayrılınca yeni soy çizgisi başlar (§6.2).
// Kurgusal kişiler açıkça işaretlenir (§6.3). Ölüm ve aday üretimi tohumdan türetilen durumsuz bir karışım
// fonksiyonuyla yapılır; böylece dünyanın rastgele sayı akışı (muharebe, AI) değişmez. Sayılar denge.ts'te [TASLAK].

import { olayEkle, type DunyaDurumu, type SenaryoVerisi } from "./durum";
import { DENGE } from "./denge";
import { gundenTarih } from "./takvim";

export type Veraset = "babadan" | "acik" | "secimli";
export const VERASET_ADLARI: Record<Veraset, string> = {
  babadan: "babadan oğula", acik: "hanedan içinde açık veraset", secimli: "seçimle",
};
export type AdHavuzu = "turk" | "slav" | "rum" | "latin" | "asya" | "genel";

export interface Hukumdar {
  ad: string;
  hanedan: string;
  dogum: number; // yıl
  yonetim: number; // 0–6
  askerlik: number;
  diplomasi: number;
  mesruiyet: number; // 0–100
  kurgusal: boolean;
  tahtaCikis: number; // gün
}
export interface TarihiHalef { ad: string; dogum: number; yetenek: [number, number, number] }
export interface VerasetAdayi extends Omit<Hukumdar, "tahtaCikis"> { tarihi: boolean; gelenek: boolean }
export interface VerasetSecimi { devlet: number; adaylar: VerasetAdayi[]; gun: number; onceki: string }

const ADLAR: Record<AdHavuzu, string[]> = {
  turk: ["Ahmed", "Mehmed", "Murad", "Süleyman", "Selim", "Mustafa", "Hasan", "Hüseyin", "Ali", "Orhan", "Korkut", "Cem", "Yusuf", "İbrahim", "Kasım", "Davud", "Bayezid", "Halil", "Ömer", "Yakub"],
  slav: ["Stefan", "Lazar", "Vuk", "Ivan", "Vasiliy", "Dmitriy", "Mihail", "Boris", "Jan", "Kazimierz", "Władysław", "Petar", "Radu", "Mircea", "Bogdan", "Aleksandr"],
  rum: ["Ioannes", "Manuel", "Andronikos", "Theodoros", "Demetrios", "Alexios", "Konstantinos", "Mikhael", "Nikephoros", "Andreas"],
  latin: ["Charles", "Louis", "Henri", "Philippe", "Jean", "Friedrich", "Heinrich", "Karl", "Johann", "Albrecht", "Ferdinando", "Alfonso", "Pedro", "Enrique", "Juan", "Edward", "Richard", "Willem", "Erik", "Christian"],
  asya: ["Zhu Jian", "Li Hao", "Wang Ming", "Taejong", "Sejong", "Yoshimasa", "Thánh Tông", "Nhân Tông", "Rama", "Boromma", "Thihathu", "Minkhaung", "Hayam", "Deva Raya", "Rajasimha"],
  genel: ["Askia", "Mansa Musa", "Ali", "Nkuwu", "Mwene", "Zara Yakob", "Itzcoatl", "Moctezuma", "Pachacuti", "Topa", "Minchançaman", "Ewuare"],
};

/** Tohumdan türetilen durumsuz tam sayı karışımı (rastgele sayı akışını tüketmez). */
export function karistir(...x: number[]): number {
  let h = 0x9e3779b9;
  for (const v of x) {
    h = Math.imul(h ^ (v >>> 0), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
  }
  return h >>> 0;
}
const araliktan = (h: number, [alt, ust]: [number, number]) => alt + (h % (ust - alt + 1));

export const hukumdarYasi = (d: DunyaDurumu, h: Hukumdar | { dogum: number }) => gundenTarih(d.gun).yil - h.dogum;

/** Başlangıçta tabloda olmayan devletin kurgusal, ortalama yetenekli hükümdarı (etkileri nötr). */
export function kurgusalHukumdar(devletAd: string, tohum: number, devlet: number, yil: number, havuz: AdHavuzu, gun: number): Hukumdar {
  const h = karistir(tohum, devlet, 7);
  const adlar = ADLAR[havuz];
  return { ad: adlar[h % adlar.length], hanedan: `${devletAd} hanedanı`, dogum: yil - araliktan(karistir(h, 1), DENGE.KURGUSAL_YAS),
    yonetim: DENGE.HUK_ETKI_ORTA, askerlik: DENGE.HUK_ETKI_ORTA, diplomasi: DENGE.HUK_ETKI_ORTA, mesruiyet: DENGE.MESRUIYET_SECIMLI,
    kurgusal: true, tahtaCikis: gun };
}

/** Senaryo tablosundan başlangıç hükümdarları, gelenekler ve ad havuzları. */
export function baslangicHanedanlari(s: SenaryoVerisi, tohum: number, yil: number, gun: number) {
  const tablo = s.hukumdarlar;
  return s.devletler.map((v, i) => {
    const t = tablo?.hukumdarlar.find((x) => x.devlet === v.id);
    const veraset: Veraset = tablo?.veraset.acik.includes(v.id) ? "acik" : tablo?.veraset.secimli.includes(v.id) ? "secimli" : "babadan";
    const havuz = ((Object.entries(tablo?.adHavuzu ?? {}) as [AdHavuzu, string[]][]).find(([, l]) => l.includes(v.id))?.[0]) ?? "latin";
    const hukumdar: Hukumdar = t
      ? { ad: t.ad, hanedan: t.hanedan, dogum: t.dogum, yonetim: t.yetenek[0], askerlik: t.yetenek[1], diplomasi: t.yetenek[2],
        mesruiyet: DENGE.MESRUIYET_TARIHI_HALEF, kurgusal: false, tahtaCikis: gun }
      : kurgusalHukumdar(v.ad, tohum, i, yil, havuz, gun);
    return { hukumdar, veraset, adHavuzu: havuz, tarihiHalef: t?.halef ? { ad: t.halef.ad, dogum: t.halef.dogum, yetenek: t.halef.yetenek } : null };
  });
}

// --- Etkiler ---------------------------------------------------------------------------------------

const fark = (d: DunyaDurumu, devlet: number, alan: "yonetim" | "askerlik" | "diplomasi") => {
  const h = devlet >= 0 ? d.devletler[devlet]?.hukumdar : null;
  return h ? h[alan] - DENGE.HUK_ETKI_ORTA : 0;
};
export const hukumdarGelirYuzde = (d: DunyaDurumu, devlet: number) => 100 + fark(d, devlet, "yonetim") * DENGE.HUK_GELIR_YUZDE;
export const hukumdarGucYuzde = (d: DunyaDurumu, devlet: number) => 100 + fark(d, devlet, "askerlik") * DENGE.HUK_GUC_YUZDE;
export const hukumdarDiplomasiPuani = (d: DunyaDurumu, devlet: number) => fark(d, devlet, "diplomasi") * DENGE.HUK_DIPLOMASI_PUAN;

// --- Veraset -----------------------------------------------------------------------------------------

/** Ölen hükümdarın yerine adaylar: tarihî halef (doğmuş ve 80 yaşını geçmemişse) + kurgusal hanedan üyeleri. */
export function adaylariUret(d: DunyaDurumu, devlet: number, onceki: Hukumdar): VerasetAdayi[] {
  const v = d.devletler[devlet], yil = gundenTarih(d.gun).yil, r: VerasetAdayi[] = [];
  const t = v.tarihiHalef;
  if (t && t.dogum <= yil && yil - t.dogum <= 80) {
    r.push({ ad: t.ad, hanedan: onceki.hanedan, dogum: t.dogum, yonetim: t.yetenek[0], askerlik: t.yetenek[1], diplomasi: t.yetenek[2],
      mesruiyet: DENGE.MESRUIYET_TARIHI_HALEF, kurgusal: false, tarihi: true, gelenek: true });
  }
  const adlar = ADLAR[v.adHavuzu];
  const kullanilan = new Set([onceki.ad, ...r.map((a) => a.ad)]);
  for (let k = 0; r.length < 3 && k < 12; k++) {
    const h = karistir(d.tohum, devlet, d.gun, k);
    const ad = adlar[h % adlar.length];
    if (kullanilan.has(ad)) continue;
    kullanilan.add(ad);
    // Gelenek: seçimli ve açık verasette her hanedan üyesi meşrudur; babadan verasette yalnızca ilk (en büyük) aday
    const gelenek = v.veraset !== "babadan" || r.length === 0;
    r.push({ ad, hanedan: onceki.hanedan, dogum: yil - araliktan(karistir(h, 1), DENGE.HALEF_YAS),
      yonetim: 1 + (karistir(h, 2) % 5), askerlik: 1 + (karistir(h, 3) % 5), diplomasi: 1 + (karistir(h, 4) % 5),
      mesruiyet: !gelenek ? DENGE.MESRUIYET_GELENEK_DISI : v.veraset === "secimli" ? DENGE.MESRUIYET_SECIMLI : DENGE.MESRUIYET_GELENEKSEL,
      kurgusal: true, tarihi: false, gelenek });
  }
  return r;
}

/** Aday tahta çıkar. Tarihî halef kullanıldı ya da atlandı: bundan sonraki soy kurgusaldır. */
export function tahtaCikar(d: DunyaDurumu, devlet: number, aday: VerasetAdayi, secen: "oyuncu" | "otomatik" | "ai"): void {
  const v = d.devletler[devlet];
  const atlandi = v.tarihiHalef !== null && !aday.tarihi;
  v.hukumdar = { ad: aday.ad, hanedan: aday.hanedan, dogum: aday.dogum, yonetim: aday.yonetim, askerlik: aday.askerlik,
    diplomasi: aday.diplomasi, mesruiyet: aday.mesruiyet, kurgusal: aday.kurgusal, tahtaCikis: d.gun };
  v.tarihiHalef = null;
  if (d.verasetSecimi?.devlet === devlet) d.verasetSecimi = null;
  const oyuncu = d.ayarlar.oyuncu;
  const buyuk = d.birimler.filter((b) => b.sahip === devlet).length >= DENGE.VERASET_DUNYA_HABERI_ARAZI;
  if (devlet !== oyuncu && !buyuk) return;
  const ek = secen === "otomatik" ? " Karar verilmediği için divan en uygun adayı seçti." : "";
  olayEkle(d, { tur: "tahta-cikis", devlet: devlet === oyuncu ? oyuncu : null,
    metin: `${v.ad}: ${aday.ad}${aday.kurgusal ? " (kurgusal)" : ""} tahta çıktı. Meşruiyet ${aday.mesruiyet}.${atlandi ? " Tarihî sıradan ayrıldı; yeni soy çizgisi başladı." : ""}${ek}` });
}

/** En uygun aday: geleneğe uygun, meşruiyeti yüksek, yetenekleri toplamı büyük; eşitlikte listedeki ilk. */
export function enUygunAday(a: VerasetAdayi[]): VerasetAdayi {
  return [...a].sort((x, y) => Number(y.gelenek) - Number(x.gelenek) || y.mesruiyet - x.mesruiyet
    || (y.yonetim + y.askerlik + y.diplomasi) - (x.yonetim + x.askerlik + x.diplomasi))[0];
}

function hukumdarOldu(d: DunyaDurumu, devlet: number): void {
  const v = d.devletler[devlet], onceki = v.hukumdar!;
  const adaylar = adaylariUret(d, devlet, onceki);
  const yas = hukumdarYasi(d, onceki);
  if (devlet === d.ayarlar.oyuncu) {
    v.hukumdar = null;
    d.verasetSecimi = { devlet, adaylar, gun: d.gun, onceki: onceki.ad };
    const metin = `${onceki.ad} ${yas} yaşında öldü. Halefi seçmeniz gerekiyor (${VERASET_ADLARI[v.veraset]}).`;
    olayEkle(d, { tur: "hukumdar-oldu", devlet, metin });
    if (!d.aktifKesinti) d.aktifKesinti = { gun: d.gun, neden: metin };
    return;
  }
  tahtaCikar(d, devlet, enUygunAday(adaylar), "ai");
}

/** Aylık: ölüm denetimi (yaşa göre yıllık yüzde/12) ve yılbaşında meşruiyetin artması. */
export function hukumdarlariIlerlet(d: DunyaDurumu): void {
  const t = gundenTarih(d.gun);
  d.devletler.forEach((v, i) => {
    const h = v.hukumdar;
    if (!h) return;
    if (!d.birimler.some((b) => b.sahip === i) && !d.sehirler.some((s) => s.devlet === i)) return; // yıkılmış devlet
    if (t.ay === 1) h.mesruiyet = Math.min(100, h.mesruiyet + DENGE.MESRUIYET_YILLIK_ARTIS);
    const yas = t.yil - h.dogum;
    let yuzde = 0;
    for (const [alt, y] of DENGE.OLUM_YUZDE) if (yas >= alt) yuzde = y;
    if (karistir(d.tohum, i, d.gun, 1453) % 1200 < yuzde) hukumdarOldu(d, i);
  });
}

/** Tur başında, emirlerden sonra: oyuncu halef seçmeden turu ilerlettiyse divan en uygun adayı tahta çıkarır. */
export function bekleyenVerasetiCoz(d: DunyaDurumu): void {
  const s = d.verasetSecimi;
  if (s) tahtaCikar(d, s.devlet, enUygunAday(s.adaylar), "otomatik");
}
