// TASK-0010/7c — açıklanabilir, deterministik aylık risk; rastgele isyan yoktur.
import { olayEkle, type DunyaDurumu, type SehirDurumu } from "./durum";
import { DENGE } from "./denge";
import type { Baglam } from "./emirler";
import { savasta } from "./savas";
import { disDestek } from "./casusluk";

export interface RiskBileseni { id: string; ad: string; puan: number }
export interface Istikrar {
  risk: number; oncekiRisk: number; bilesenler: RiskBileseni[]; degisim: RiskBileseni[];
  yuksekAy: number; ayaklanma: boolean; asayisAy: number;
  bagis: number; fetihGun: number | null; hesapGun: number | null;
}
export const bosIstikrar = (): Istikrar => ({ risk: 0, oncekiRisk: 0, bilesenler: [], degisim: [],
  yuksekAy: 0, ayaklanma: false, asayisAy: 0, bagis: 0, fetihGun: null, hesapGun: null });
export const istikrarAsamasi = (s: SehirDurumu): string => s.istikrar.ayaklanma ? "Ayaklanma" : s.istikrar.risk >= DENGE.IST_HUZURSUZLUK ? "Huzursuzluk" : "Sakin";
export const sehirGelirYuzde = (s: SehirDurumu): number => s.istikrar.ayaklanma ? 0 : s.istikrar.risk >= DENGE.IST_HUZURSUZLUK ? 50 : 100;
/** Bir arazide birden çok şehir varsa en ağır etki uygulanır; ceza birikmez. */
export function birimGelirYuzdeleri(d: DunyaDurumu): number[] {
  const sonuc = d.birimler.map(() => 100);
  for (const s of d.sehirler) if (s.birim >= 0 && d.birimler[s.birim]?.sahip === s.devlet) sonuc[s.birim] = Math.min(sonuc[s.birim], sehirGelirYuzde(s));
  return sonuc;
}
export function asayisAskeri(d: DunyaDurumu, sehir: number): number {
  const s = d.sehirler[sehir];
  return s.dugum < 0 ? 0 : d.ordular.filter((o) => o.devlet === s.devlet && o.dugum === s.dugum
    && !o.rota.length && !o.cekiliyor && o.muharebe === null && o.moral > 0).reduce((n, o) => n + o.asker, 0);
}
export const gerekenAsayis = (s: SehirDurumu): number => Math.max(DENGE.IST_ASAYIS_EN_AZ_ASKER, Math.ceil(s.nufus * DENGE.IST_ASAYIS_NUFUS_YUZDE / 100));

export function riskBilesenleri(d: DunyaDurumu, sehir: number, b: Baglam): RiskBileseni[] {
  const s = d.sehirler[sehir], v = d.devletler[s.devlet];
  const komsu = new Set<number>(s.dugum >= 0 ? [s.dugum] : []);
  for (const ki of b.ag?.komsu[s.dugum] ?? []) {
    const k = b.ag!.kenarlar[ki]; komsu.add(k.a); komsu.add(k.b);
  }
  const baskent = v.baskent === null ? null : d.sehirler[v.baskent];
  const yakinBaskent = v.baskent === sehir || (baskent && baskent.dugum >= 0 && komsu.has(baskent.dugum));
  const savasYasi = d.savaslar.reduce((g, x) => [x.saldiran, x.savunan].includes(s.devlet) ? Math.max(g, d.gun - x.baslangic) : g, 0);
  const farkli = v.din === "bilinmiyor" ? 0 : s.gruplar.reduce((n, g) => n + (g.din !== "bilinmiyor" && g.din !== v.din ? g.nufus : 0), 0);
  const fetih = s.istikrar.fetihGun;
  return [
    { id: "mesruiyet", ad: "Meşruiyet düşüklüğü", puan: Math.floor((100 - (v.hukumdar?.mesruiyet ?? 0)) * DENGE.IST_MESRUIYET_EN_COK / 100) },
    { id: "fetih", ad: "Yeni fetih", puan: fetih === null ? 0 : Math.max(0, DENGE.IST_FETIH_RISK - Math.floor(Math.max(0, d.gun - fetih) / DENGE.IST_FETIH_SONUM_GUN)) },
    { id: "isgal", ad: "Askerî işgal", puan: s.kontrol !== s.devlet ? DENGE.IST_ISGAL_RISK : 0 },
    { id: "savas", ad: "Savaş yorgunluğu", puan: Math.min(DENGE.IST_SAVAS_EN_COK, Math.floor(savasYasi / DENGE.IST_SAVAS_DONEM_GUN) * DENGE.IST_SAVAS_DONEM_PUAN) },
    { id: "ekonomi", ad: "Eksi hazine / maaş aksaması", puan: v.hazine < 0 ? DENGE.IST_EKSI_HAZINE : 0 },
    { id: "din", ad: "Farklı din payı (tek başına isyan yaratmaz)", puan: Math.floor(farkli * DENGE.IST_DIN_EN_COK / Math.max(1, s.nufus)) },
    { id: "kusatma", ad: "Kuşatma", puan: d.kusatmalar.some((k) => k.sehir === sehir) ? DENGE.IST_KUSATMA : 0 },
    { id: "dusman", ad: "Yakındaki düşman orduları", puan: d.ordular.some((o) => o.asker > 0 && komsu.has(o.dugum) && savasta(d, s.devlet, o.devlet)) ? DENGE.IST_DUSMAN : 0 },
    { id: "asayis", ad: "Yeterli kendi ordusu", puan: asayisAskeri(d, sehir) >= gerekenAsayis(s) ? -DENGE.IST_ASAYIS_INDIRIM : 0 },
    { id: "baskent", ad: "Başkent yakınlığı", puan: yakinBaskent ? -DENGE.IST_BASKENT_INDIRIM : 0 },
    { id: "bagis", ad: "Bağış / imar yardımı", puan: -s.istikrar.bagis },
    { id: "disdestek", ad: "Yabancı kışkırtma (casusluk)", puan: disDestek(d, sehir) },
  ];
}

export function istikrarAyi(d: DunyaDurumu, b: Baglam): void {
  d.sehirler.forEach((s, sehir) => {
    const i = s.istikrar, once = i.risk, ayak = i.ayaklanma;
    const bilesenler = riskBilesenleri(d, sehir, b);
    i.degisim = bilesenler.map((x) => ({ ...x, puan: x.puan - (i.bilesenler.find((p) => p.id === x.id)?.puan ?? 0) })).filter((x) => x.puan !== 0);
    i.oncekiRisk = once; i.bilesenler = bilesenler;
    i.risk = Math.max(0, Math.min(100, bilesenler.reduce((n, x) => n + x.puan, 0)));
    i.hesapGun = d.gun;
    i.yuksekAy = i.risk >= DENGE.IST_AYAKLANMA ? i.yuksekAy + 1 : 0;
    const asayis = s.kontrol === s.devlet && !d.kusatmalar.some((k) => k.sehir === sehir)
      && asayisAskeri(d, sehir) >= gerekenAsayis(s);
    i.asayisAy = ayak && asayis ? i.asayisAy + 1 : 0;
    if (ayak && (i.risk < DENGE.IST_HUZURSUZLUK || i.asayisAy >= DENGE.IST_BASTIRMA_AY)) {
      i.ayaklanma = false; i.yuksekAy = 0; i.asayisAy = 0;
      olayEkle(d, { tur: "ayaklanma-bitti", devlet: s.devlet, metin: `${s.ad}: ayaklanma ${i.risk < DENGE.IST_HUZURSUZLUK ? "risk düştüğü" : "ordu asayişi sağladığı"} için sona erdi.` });
    } else if (!ayak && i.yuksekAy >= DENGE.IST_AYAKLANMA_AY) {
      i.ayaklanma = true; i.asayisAy = 0;
      const metin = `${s.ad}: risk üç ay en az %${DENGE.IST_AYAKLANMA} kaldı; ayaklanma başladı. Gelir ve asker toplama durdu, inşaat bekliyor.`;
      olayEkle(d, { tur: "ayaklanma", devlet: s.devlet, metin });
      if (s.devlet === d.ayarlar.oyuncu && !d.aktifKesinti) d.aktifKesinti = { gun: d.gun, neden: metin };
    }
    if (!i.ayaklanma && ((once < DENGE.IST_HUZURSUZLUK && i.risk >= DENGE.IST_HUZURSUZLUK) || (once < DENGE.IST_AYAKLANMA && i.risk >= DENGE.IST_AYAKLANMA)))
      olayEkle(d, { tur: "isyan-uyari", devlet: s.devlet, metin: `${s.ad}: isyan riski %${i.risk}. Huzursuzluk nedeniyle şehir ve çevresi yarım gelir verir; nedenleri şehir panelinde.` });
    i.bagis = Math.max(0, i.bagis - DENGE.IST_BAGIS_SONUM);
  });
}
