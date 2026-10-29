// TASK-0010/7b: nüfus grupları (din × kültür), doğal artış, savaş kaybı, göç ve iskân (MASTER_SPEC §14; DEC-0045).
// Nüfus toplulaştırılmış gruplarla tutulur; grupların toplamı her zaman şehir nüfusuna eşittir ve hiçbir grup eksiye
// düşmez. Farklılık kendi başına isyan sebebi değildir (§14); istikrara etkisi 7c'dedir. Sayılar denge.ts'te [TASLAK].

import { olayEkle, type DunyaDurumu, type SehirDurumu, type SenaryoVerisi } from "./durum";
import { DENGE } from "./denge";
import type { Baglam } from "./emirler";
import { sayiMetni } from "./savas";

export interface NufusGrubu { din: string; kultur: string; nufus: number }
export interface Iskan { kaynak: number; hedef: number; devlet: number; gruplar: NufusGrubu[]; kalanGun: number }

/** Dinler ve aileleri oyun kuralıdır (ilişki bileşeni); "bilinmiyor" veri yokken kullanılır ve etkisizdir. */
export const DIN_AILELERI: Record<string, string> = {
  sunni: "islam", sii: "islam", ortodoks: "hristiyan", katolik: "hristiyan", ermeni: "hristiyan",
  yahudi: "yahudi", budist: "dogu", hindu: "dogu", yerel: "yerel", bilinmiyor: "bilinmiyor",
};
export const BILINMIYOR = { din: "bilinmiyor", kultur: "diger" } as const;

/** Toplamı koruyarak binde oranlarına böler (en büyük kalan yöntemi; eşitlikte listedeki sıra). */
export function paylastir(toplam: number, oranlar: number[]): number[] {
  const t = oranlar.reduce((a, b) => a + b, 0);
  if (t <= 0) return oranlar.map(() => 0);
  const ham = oranlar.map((o) => Math.floor((toplam * o) / t));
  let kalan = toplam - ham.reduce((a, b) => a + b, 0);
  const sira = oranlar.map((o, i) => ({ i, k: (toplam * o) % t })).sort((a, b) => b.k - a.k || a.i - b.i);
  for (let j = 0; kalan > 0; j = (j + 1) % sira.length, kalan--) ham[sira[j].i]++;
  return ham;
}

export function baslangicGruplari(s: SenaryoVerisi, sehirAd: string, devletId: string, nufus: number): NufusGrubu[] {
  const karisim = s.nufus?.sehirler[sehirAd] ?? s.nufus?.devletler[devletId]?.karisim ?? [[BILINMIYOR.din, BILINMIYOR.kultur, 1000]];
  const paylar = paylastir(nufus, karisim.map((k) => k[2]));
  return birlestir(karisim.map(([din, kultur], i) => ({ din, kultur, nufus: paylar[i] })));
}

/** Aynı din × kültür gruplarını birleştirir, boşları atar; sıra: büyükten küçüğe, eşitlikte ada göre. */
export function birlestir(g: NufusGrubu[]): NufusGrubu[] {
  const m = new Map<string, NufusGrubu>();
  for (const x of g) {
    if (x.nufus <= 0) continue;
    const k = `${x.din}|${x.kultur}`;
    const v = m.get(k);
    if (v) v.nufus += x.nufus; else m.set(k, { ...x });
  }
  return [...m.values()].sort((a, b) => b.nufus - a.nufus || (a.din + a.kultur < b.din + b.kultur ? -1 : 1));
}

/** Şehirden orantılı olarak miktar kişi çıkarır; çıkan grupları döndürür. */
export function nufusCikar(s: SehirDurumu, miktar: number): NufusGrubu[] {
  const m = Math.max(0, Math.min(miktar, s.nufus));
  const paylar = paylastir(m, s.gruplar.map((g) => g.nufus));
  const cikan = s.gruplar.map((g, i) => ({ ...g, nufus: paylar[i] }));
  s.gruplar = birlestir(s.gruplar.map((g, i) => ({ ...g, nufus: g.nufus - paylar[i] })));
  s.nufus -= m;
  return birlestir(cikan);
}

export function nufusEkle(s: SehirDurumu, g: NufusGrubu[]): void {
  s.gruplar = birlestir([...s.gruplar, ...g]);
  s.nufus = s.gruplar.reduce((t, x) => t + x.nufus, 0);
}

export const baskinGrup = (s: SehirDurumu): NufusGrubu | null => s.gruplar[0] ?? null;

/** Devletin resmî dini; ilişki bileşeni (aynı din +, farklı aile −; bilinmiyorsa yok). */
export function dinBileseni(d: DunyaDurumu, a: number, b: number): number {
  const x = d.devletler[a]?.din, y = d.devletler[b]?.din;
  if (!x || !y || x === BILINMIYOR.din || y === BILINMIYOR.din) return 0;
  if (x === y) return DENGE.DIN_AYNI;
  return DIN_AILELERI[x] !== DIN_AILELERI[y] ? DENGE.DIN_FARKLI_AILE : 0;
}

// --- Yıllık / aylık / günlük -------------------------------------------------------------------------

/** Yıllık doğal artış (her grup kendi içinde). */
export function nufusArtisi(d: DunyaDurumu): void {
  for (const s of d.sehirler) {
    s.gruplar = birlestir(s.gruplar.map((g) => ({ ...g, nufus: g.nufus + Math.floor((g.nufus * DENGE.NUFUS_ARTIS_BINDE) / 1000) })));
    s.nufus = s.gruplar.reduce((t, x) => t + x.nufus, 0);
  }
}

/** Aylık: kuşatılan ya da işgal edilen şehirden kayıp; bir kısmı aynı devletin en yakın güvenli şehrine göçer. */
export function savasGocu(d: DunyaDurumu, b: Baglam): void {
  const konum = (i: number) => b.sehirKonumlari?.[i] ?? null;
  d.sehirler.forEach((s, i) => {
    const kusatma = d.kusatmalar.some((k) => k.sehir === i);
    const isgal = s.kontrol !== s.devlet;
    if (!kusatma && !isgal) return;
    const kayip = Math.floor((s.nufus * (kusatma ? DENGE.NUFUS_KUSATMA_KAYIP_BINDE : DENGE.NUFUS_ISGAL_KAYIP_BINDE)) / 1000);
    if (kayip <= 0) return;
    const cikan = nufusCikar(s, kayip);
    const p = konum(i);
    let hedef = -1, en = Infinity;
    d.sehirler.forEach((c, j) => {
      if (j === i || c.devlet !== s.devlet || c.kontrol !== c.devlet || d.kusatmalar.some((k) => k.sehir === j)) return;
      const q = konum(j);
      const u = p && q ? (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y) : j;
      if (u < en) { en = u; hedef = j; }
    });
    if (hedef < 0) return;
    const goc = cikan.map((g) => ({ ...g, nufus: Math.floor((g.nufus * DENGE.GOC_PAYI_YUZDE) / 100) }));
    nufusEkle(d.sehirler[hedef], goc);
  });
}

/** İskân bedeli (kişi başına). */
export const iskanBedeli = (miktar: number) => Math.ceil((miktar * DENGE.ISKAN_BEDEL_BINDE) / 1000);

/** Günlük: yoldaki iskânlar; varınca hedef artık sizin değilse nüfus kaynağa döner, o da değilse dağılır. */
export function iskanlariIlerlet(d: DunyaDurumu): void {
  for (const k of [...d.iskanlar]) {
    if (--k.kalanGun > 0) continue;
    d.iskanlar = d.iskanlar.filter((x) => x !== k);
    const uygun = (i: number) => d.sehirler[i].devlet === k.devlet && d.sehirler[i].kontrol === k.devlet;
    const yer = uygun(k.hedef) ? k.hedef : uygun(k.kaynak) ? k.kaynak : -1;
    const toplam = k.gruplar.reduce((t, g) => t + g.nufus, 0);
    if (yer >= 0) nufusEkle(d.sehirler[yer], k.gruplar);
    olayEkle(d, { tur: "iskan", devlet: k.devlet, metin: yer === k.hedef
      ? `${sayiMetni(toplam)} kişi ${d.sehirler[k.hedef].ad} şehrine iskân edildi.`
      : yer >= 0 ? `${d.sehirler[k.hedef].ad} elden çıktığı için ${sayiMetni(toplam)} kişi ${d.sehirler[yer].ad} şehrine geri döndü.`
        : `İskân edilecek ${sayiMetni(toplam)} kişi gidecek yer kalmadığı için dağıldı.` });
  }
}
