// TASK-0049: idare reformu (merkezî/dengeli/yerel), danışmanlar, fetih bütünleşmesi + şehir politikası, isteğe bağlı görevler.
// Tarihî olay zorlaması yok; hepsi oyuncu kararıdır (AI yalnızca danışman ve politika kullanır). Sayılar denge.ts'te [TASLAK].

import { olayEkle, type DunyaDurumu, type SehirDurumu } from "./durum";
import { DENGE } from "./denge";
import { toplamAskerSayisi } from "./ordu";

export const IDARELER = ["merkezi", "dengeli", "yerel"] as const;
export type Idare = typeof IDARELER[number];
export const IDARE_ADLARI: Record<Idare, string> = { merkezi: "Merkezî idare", dengeli: "Dengeli idare", yerel: "Yerel yetki" };

export const DANISMAN_TURLERI = ["maliye", "harbiye", "kadi"] as const;
export type DanismanTuru = typeof DANISMAN_TURLERI[number];
export const DANISMAN_ADLARI: Record<DanismanTuru, string> = { maliye: "Maliye nazırı", harbiye: "Harbiye danışmanı", kadi: "Kadı (adalet)" };
export const DANISMAN_ETKILERI: Record<DanismanTuru, string> = {
  maliye: `Arazi ve yapı geliri +%${DENGE.DANISMAN_MALIYE_GELIR}`,
  harbiye: `Asker toplama bedeli −%${DENGE.DANISMAN_HARBIYE_INDIRIM}`,
  kadi: `Bütün şehirlerde isyan riski −${DENGE.DANISMAN_KADI_RISK}`,
};

export const POLITIKALAR = ["olagan", "hosgoru", "baski"] as const;
export type SehirPolitikasi = typeof POLITIKALAR[number];
export const POLITIKA_ADLARI: Record<SehirPolitikasi, string> = { olagan: "Olağan", hosgoru: "Hoşgörü", baski: "Baskı" };

export const HEDEF_TURLERI = ["hazine", "ittifak", "sur", "ordu", "ticaret"] as const;
export type HedefTuru = typeof HEDEF_TURLERI[number];
export interface Gorev { no: number; devlet: number; tur: HedefTuru; hedef: number; odul: number; durum: "teklif" | "aktif"; bitis: number | null }

// --- Etkiler (diğer modüller okur) ---------------------------------------------------------------

/** Arazi + yapı gelirine idare ve maliye danışmanı çarpanı (100 = etkisiz). */
export function idareGelirYuzde(d: DunyaDurumu, devlet: number): number {
  const v = d.devletler[devlet];
  if (!v) return 100;
  const idare = v.idare === "merkezi" ? 100 + DENGE.IDARE_GELIR_FARK : v.idare === "yerel" ? 100 - DENGE.IDARE_GELIR_FARK : 100;
  return v.danismanlar.includes("maliye") ? Math.floor((idare * (100 + DENGE.DANISMAN_MALIYE_GELIR)) / 100) : idare;
}
export const harbiyeIndirimi = (d: DunyaDurumu, devlet: number): number => (d.devletler[devlet]?.danismanlar.includes("harbiye") ? DENGE.DANISMAN_HARBIYE_INDIRIM : 0);
export const danismanMaasi = (d: DunyaDurumu, devlet: number): number => (d.devletler[devlet]?.danismanlar.length ?? 0) * DENGE.DANISMAN_MAAS;

/** İdare, kadı ve şehir politikasının risk puanı. */
export function idareRiskPuani(d: DunyaDurumu, s: SehirDurumu): number {
  const v = d.devletler[s.devlet];
  const idare = v.idare === "merkezi" ? DENGE.IDARE_RISK_FARK : v.idare === "yerel" ? -DENGE.IDARE_RISK_FARK : 0;
  return idare - (v.danismanlar.includes("kadi") ? DENGE.DANISMAN_KADI_RISK : 0) + DENGE.POLITIKA_RISK[s.politika];
}
/** Bütünleşmemiş fetih riski: %0 bütünleşmede IST_BUTUNLESME_EN_COK puan. */
export const butunlesmeRiski = (s: SehirDurumu): number => Math.floor(((100 - s.butunlesme) * DENGE.IST_BUTUNLESME_EN_COK) / 100);
/** Şehrin gelir çarpanı: bütünleşme %0'da yarım gelir; hoşgörü ek indirim. */
export const butunlesmeGelirYuzde = (s: SehirDurumu): number =>
  Math.floor(((50 + Math.floor(s.butunlesme / 2)) * (100 - DENGE.POLITIKA_GELIR_INDIRIM[s.politika])) / 100);

// --- Görevler -----------------------------------------------------------------------------------

export function gorevOlcumu(d: DunyaDurumu, devlet: number, tur: HedefTuru): number {
  const v = d.devletler[devlet];
  switch (tur) {
    case "hazine": return v.hazine;
    case "ittifak": return d.ittifaklar.filter((i) => i.a === devlet || i.b === devlet).length;
    case "sur": return v.baskent === null ? 0 : d.sehirler[v.baskent].sur;
    case "ordu": return toplamAskerSayisi(d, devlet);
    case "ticaret": return d.ticaretAnlasmalari.filter((t) => t.a === devlet || t.b === devlet).length;
  }
}
export const HEDEF_ADLARI: Record<HedefTuru, (h: number) => string> = {
  hazine: (h) => `Hazineyi ${h} akçeye çıkar`,
  ittifak: (h) => `${h} müttefike ulaş`,
  sur: (h) => `Başkent surunu ${h}. seviyeye çıkar`,
  ordu: (h) => `Ordunu ${h} askere büyüt`,
  ticaret: (h) => `${h} ticaret anlaşmasına ulaş`,
};

function teklifUret(d: DunyaDurumu, devlet: number): void {
  const bas = d.sonrakiGorevNo % HEDEF_TURLERI.length; // rastgele sayı tüketmeden döner
  const turler = [...HEDEF_TURLERI.slice(bas), ...HEDEF_TURLERI.slice(0, bas)];
  let n = 0;
  for (const tur of turler) {
    if (n >= DENGE.GOREV_TEKLIF_SAYISI) break;
    const simdi = gorevOlcumu(d, devlet, tur);
    if (tur === "sur" && simdi >= DENGE.YAPI_EN_YUKSEK.sur) continue;
    const hedef = tur === "hazine" ? Math.max(simdi, 0) + DENGE.GOREV_HAZINE_ARTIS : tur === "ordu" ? Math.ceil((simdi * 125) / 100) + 1000 : simdi + 1;
    d.gorevler.push({ no: d.sonrakiGorevNo++, devlet, tur, hedef, odul: DENGE.GOREV_ODUL[tur], durum: "teklif", bitis: null });
    n++;
  }
}

// --- Aylık sistem -------------------------------------------------------------------------------

export function reformAyi(d: DunyaDurumu): void {
  // İdare reformları yürürlüğe girer
  d.devletler.forEach((v, i) => {
    if (!v.reform || d.gun < v.reform.bitis) return;
    v.idare = v.reform.hedef; v.reform = null;
    olayEkle(d, { tur: "reform", devlet: i === d.ayarlar.oyuncu ? i : null, metin: `${v.ad}: ${IDARE_ADLARI[v.idare]} yürürlüğe girdi.` });
  });
  // Fetih bütünleşmesi: sahip değişince sıfırdan (asıl sahibine dönen şehir tam bütünleşik) başlar
  for (const s of d.sehirler) {
    if (s.butunlesmeDevlet !== s.devlet) {
      s.butunlesmeDevlet = s.devlet; s.butunlesme = s.devlet === s.asil ? 100 : 0; s.politika = "olagan";
      continue;
    }
    if (s.butunlesme < 100 && !s.istikrar.ayaklanma) s.butunlesme = Math.min(100, s.butunlesme + DENGE.BUTUNLESME_AYLIK[s.politika]);
  }
  // Oyuncunun görevleri
  const p = d.ayarlar.oyuncu;
  for (const g of d.gorevler.filter((x) => x.devlet === p && x.durum === "aktif")) {
    if (gorevOlcumu(d, p, g.tur) >= g.hedef) {
      d.devletler[p].hazine += g.odul;
      const h = d.devletler[p].hukumdar;
      if (h) h.mesruiyet = Math.min(100, h.mesruiyet + DENGE.GOREV_MESRUIYET);
      d.gorevler = d.gorevler.filter((x) => x !== g);
      olayEkle(d, { tur: "gorev", devlet: p, metin: `Görev tamamlandı: ${HEDEF_ADLARI[g.tur](g.hedef)}. Ödül +${g.odul}, meşruiyet +${DENGE.GOREV_MESRUIYET}.` });
    } else if (g.bitis !== null && d.gun > g.bitis) {
      d.gorevler = d.gorevler.filter((x) => x !== g);
      olayEkle(d, { tur: "gorev", devlet: p, metin: `Görev süresi doldu: ${HEDEF_ADLARI[g.tur](g.hedef)}. Ceza yoktur.` });
    }
  }
  if (!d.gorevler.some((x) => x.devlet === p)) teklifUret(d, p);
}
