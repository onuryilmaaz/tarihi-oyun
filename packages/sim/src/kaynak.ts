// TASK-0046: tahıl/demir/kereste oyun ekonomisi. Dağılım tarihî maden/orman verisi iddiası taşımaz.
import { olayEkle, type DunyaDurumu, type SehirDurumu } from "./durum";
import { DENGE } from "./denge";
import type { Baglam, Emir } from "./emirler";
import { biliyor } from "./teknoloji";
import { sehirGelirYuzde } from "./istikrar";
import { savasta } from "./savas";
import { ticaretAnlasmasiVar } from "./diplomasi";
import { bolgeKontrolu, denizYolu } from "./deniz";

export const KAYNAKLAR = ["tahil", "demir", "kereste"] as const;
export type Kaynak = typeof KAYNAKLAR[number];
export type KaynakStogu = Record<Kaynak, number>;
export const KAYNAK_ADLARI: Record<Kaynak, string> = { tahil: "Tahıl", demir: "Demir", kereste: "Kereste" };
export const bosKaynak = (): KaynakStogu => ({ tahil: 0, demir: 0, kereste: 0 });

export function sehirKaynagi(s: SehirDurumu, b: Baglam): Kaynak {
  if (s.gelirKaynagi === "tarim" || s.gelirKaynagi === "hayvancilik") return "tahil";
  return (b.ag?.dugumler[s.dugum]?.z ?? 100) >= 130 ? "demir" : "kereste";
}
export function sehirUretimi(d: DunyaDurumu, i: number, b: Baglam): KaynakStogu {
  const s = d.sehirler[i], r = bosKaynak();
  if (s.bagli >= 0 || s.kontrol !== s.devlet || s.istikrar.ayaklanma || d.kusatmalar.some((k) => k.sehir === i)) return r;
  const tur = sehirKaynagi(s, b);
  r[tur] = DENGE.KAYNAK_URETIM + Math.floor(s.nufus / DENGE.KAYNAK_NUFUS_ADIM);
  r.tahil += s.yapilar.tarla * DENGE.KAYNAK_TARLA_EK;
  for (const k of KAYNAKLAR) {
    const teknoloji = biliyor(d, s.devlet, k === "tahil" ? "tarimDonusumu" : "metalurji") ? DENGE.KAYNAK_TEKNOLOJI_YUZDE : 100;
    r[k] = Math.floor(r[k] * (100 + s.ekYapilar.atolye * DENGE.KAYNAK_ATOLYE_YUZDE) * teknoloji * sehirGelirYuzde(s) / 1000000);
  }
  return r;
}
export function kaynakUretimleri(d: DunyaDurumu, b: Baglam): KaynakStogu[] {
  const r = d.devletler.map(bosKaynak);
  d.sehirler.forEach((s, i) => { const u = sehirUretimi(d, i, b); for (const k of KAYNAKLAR) r[s.devlet][k] += u[k]; });
  return r;
}
export function tahilTuketimleri(d: DunyaDurumu): number[] {
  const r = d.devletler.map(() => 0);
  for (const o of [...d.ordular, ...d.donanmalar.flatMap((f) => f.yuk ? [f.yuk] : [])]) r[o.devlet] += o.asker;
  return r.map((asker) => Math.ceil(asker / DENGE.TAHIL_ASKER_ADIM));
}
export function kaynakAyi(d: DunyaDurumu, b: Baglam): void {
  const u = kaynakUretimleri(d, b), tuketim = tahilTuketimleri(d);
  d.devletler.forEach((v, i) => {
    for (const k of KAYNAKLAR) v.kaynaklar[k] = Math.min(DENGE.KAYNAK_TAVAN, v.kaynaklar[k] + u[i][k]);
    if (v.kaynaklar.tahil < tuketim[i]) {
      for (const o of [...d.ordular, ...d.donanmalar.flatMap((f) => f.yuk ? [f.yuk] : [])]) if (o.devlet === i) o.moral = Math.max(0, o.moral - DENGE.TAHIL_EKSIK_MORAL);
      olayEkle(d, { tur: "kaynak-eksik", devlet: i, metin: `Tahıl yetersiz: ${tuketim[i]} gerekli, ${v.kaynaklar.tahil} mevcut; orduların morali −${DENGE.TAHIL_EKSIK_MORAL / 10} puan.` });
    }
    v.kaynaklar.tahil = Math.max(0, v.kaynaklar.tahil - tuketim[i]);
  });
}

/** Eski temel yatırımların bedeli korunur; yeni yapı, gemi ve topçu gerçek kaynak tüketir. */
export function kaynakMaliyeti(e: Emir): KaynakStogu {
  const r = bosKaynak();
  if (e.tur === "insaat") {
    if (e.yapi === "okul" || e.yapi === "atolye" || e.yapi === "kisla") Object.assign(r, DENGE.KAYNAK_YAPI_BEDELI[e.yapi]);
  }
  if (e.tur === "gemiInsa" && DENGE.KAYNAK_GEMI_BEDELI[e.gemi]) { r.kereste = e.adet * DENGE.KAYNAK_GEMI_BEDELI[e.gemi].kereste; r.demir = e.adet * DENGE.KAYNAK_GEMI_BEDELI[e.gemi].demir; }
  if (e.tur === "askerTopla" && (e.birim as string) === "topcu") { r.demir = Math.ceil(e.asker / DENGE.TOPCU_DEMIR_ADIM); r.kereste = Math.ceil(e.asker / DENGE.TOPCU_KERESTE_ADIM); }
  return r;
}
export function kullanilabilirKaynak(d: DunyaDurumu, devlet: number, kuyrukHaric = false): KaynakStogu {
  const r = { ...d.devletler[devlet].kaynaklar };
  if (!kuyrukHaric) for (const e of d.emirKuyrugu) {
    const sahibi = e.tur === "insaat" || e.tur === "gemiInsa" || e.tur === "askerTopla" ? d.sehirler[e.sehir]?.devlet : -1;
    if (sahibi !== devlet) continue;
    const m = kaynakMaliyeti(e); for (const k of KAYNAKLAR) r[k] -= m[k];
  }
  return r;
}
export function kaynakMaliyetEngeli(d: DunyaDurumu, e: Emir, devlet: number, kuyrukHaric: boolean): string | null {
  const r = kullanilabilirKaynak(d, devlet, kuyrukHaric), m = kaynakMaliyeti(e);
  const k = KAYNAKLAR.find((k) => r[k] < m[k]);
  return k ? `${KAYNAK_ADLARI[k]} yetersiz: ${r[k]} kullanılabilir, ${m[k]} gerekli.` : null;
}
export function kaynakBedeliniOde(d: DunyaDurumu, e: Emir, devlet: number): void {
  const m = kaynakMaliyeti(e); for (const k of KAYNAKLAR) d.devletler[devlet].kaynaklar[k] -= m[k];
}

export const kaynakFiyati = (d: DunyaDurumu, satici: number, k: Kaynak) =>
  DENGE.KAYNAK_FIYAT[k] + (d.devletler[satici].kaynaklar[k] < DENGE.KAYNAK_SATIS_YEDEK * 2 ? 1 : 0);
export const satilabilirKaynak = (d: DunyaDurumu, satici: number, k: Kaynak) => Math.max(0, d.devletler[satici].kaynaklar[k] - DENGE.KAYNAK_SATIS_YEDEK);

export function kaynakTicaretEngeli(d: DunyaDurumu, b: Baglam, alan: number, satan: number): string | null {
  if (alan === satan || !d.devletler[alan] || !d.devletler[satan]) return "İki farklı devlet seçin.";
  if (savasta(d, alan, satan)) return "Savaştaki devletten kaynak alınamaz.";
  if (!ticaretAnlasmasiVar(d, alan, satan)) return "Önce ticaret anlaşması kurun.";
  if (d.ambargolar.some((a) => (a.devlet === alan && a.hedef === satan) || (a.devlet === satan && a.hedef === alan))) return "Ambargo ticareti engelliyor.";
  if (b.ag?.kenarlar.some((e) => {
    const a = d.birimler[b.ag!.dugumler[e.a].b], c = d.birimler[b.ag!.dugumler[e.b].b];
    return a.kontrol === a.sahip && c.kontrol === c.sahip && ((a.sahip === alan && c.sahip === satan) || (a.sahip === satan && c.sahip === alan)) && !e.g;
  })) return null;
  const limanlar = (devlet: number) => [...new Set(d.sehirler.flatMap((s, i) => s.devlet === devlet && s.kontrol === devlet && s.bagli < 0
    && !s.istikrar.ayaklanma && !d.kusatmalar.some((k) => k.sehir === i) && d.deniz.limanlar[i] >= 0 ? [d.deniz.limanlar[i]] : []))];
  for (const a of limanlar(alan)) for (const c of limanlar(satan)) {
    const yol = denizYolu(d, a, c);
    if (yol !== null && [a, ...yol].every((z) => {
      if (d.donanmalar.some((f) => f.bolge === z && (savasta(d, alan, f.devlet) || savasta(d, satan, f.devlet)))) return false;
      const k = bolgeKontrolu(d, z); return k === null || (!savasta(d, alan, k) && !savasta(d, satan, k));
    })) return null;
  }
  return "Kontrol edilen ortak kara sınırı veya ablukasız liman güzergâhı yok.";
}

export function kaynakSatinAl(d: DunyaDurumu, alan: number, satan: number, k: Kaynak, miktar: number): void {
  const bedel = miktar * kaynakFiyati(d, satan, k);
  d.devletler[alan].hazine -= bedel; d.devletler[satan].hazine += bedel;
  d.devletler[satan].kaynaklar[k] -= miktar; d.devletler[alan].kaynaklar[k] += miktar;
  olayEkle(d, { tur: "kaynak-ticaret", devlet: alan === d.ayarlar.oyuncu || satan === d.ayarlar.oyuncu ? d.ayarlar.oyuncu : null,
    metin: `${d.devletler[alan].ad}, ${d.devletler[satan].ad} devletinden ${miktar} ${KAYNAK_ADLARI[k].toLocaleLowerCase("tr")} aldı; bedel ${bedel}.` });
}
