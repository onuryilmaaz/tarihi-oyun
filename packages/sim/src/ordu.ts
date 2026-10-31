// TASK-0007/4b: toplama, maaş ve ikmal. Tüm oranlar denge.ts içindedir.
import { olayEkle, type DunyaDurumu, type OrduDurumu } from "./durum";
import { aylikBakim } from "./deniz";
import { DENGE } from "./denge";
import { HAREKET, rotaBul, type HareketAgi } from "./hareket";
import { savasta, sayiMetni } from "./savas";
import type { Baglam } from "./emirler";
import { BIRIM_TURLERI, kompozisyonCikar, kompozisyonHizi, kompozisyonTopla, kompozisyonOransalAl, toplamaMaliyetiYuzde, aylikMaasYuzde, tekTurKompozisyon, type BirimTuru, type Kompozisyon } from "./birim";

// yuzde: teknoloji indirimi (Asker Kayıt Defterleri, 5c); varsayılan indirimsiz. birim: TASK-0019, varsayılan piyade
// (piyadenin maliyetYuzde'si 100 olduğu için eski çağrılar aynı sonucu verir).
export const toplamaMaliyeti = (asker: number, yuzde = 100, birim: BirimTuru = "piyade"): number =>
  Math.ceil(asker * DENGE.TOPLAMA_ASKER_BASINA_MALIYET_BINDE * yuzde * toplamaMaliyetiYuzde(birim) / 10000000);
// Devlet toplamı üzerinden yuvarlanır: orduyu bölmek maaşı değiştirmez. birim: TASK-0019, varsayılan piyade.
export const aylikMaas = (asker: number, birim: BirimTuru = "piyade"): number =>
  Math.ceil(asker * DENGE.AYLIK_ASKER_MAASI_BINDE * aylikMaasYuzde(birim) / 100000);
/** Bir ordunun kompozisyonuna göre toplam aylık maaşı (TASK-0019). */
export const kompozisyonMaasi = (k: Kompozisyon): number => BIRIM_TURLERI.reduce((s, t) => s + (k[t] ? aylikMaas(k[t], t) : 0), 0);
/** Kara ve gemideki ordular birlikte; bir ordu yalnızca bir listede bulunur. */
export function toplamAskerSayisi(d: DunyaDurumu, devlet: number): number {
  return d.ordular.filter((o) => o.devlet === devlet).reduce((s, o) => s + o.asker, 0)
    + d.donanmalar.filter((f) => f.devlet === devlet && f.yuk).reduce((s, f) => s + f.yuk!.asker, 0);
}
/** Zorunlu aylık askerî gider: ordu maaşı (kompozisyona göre, gemideki ordular dahil) + donanma bakımı (8a). */
export function devletMaasi(d: DunyaDurumu, devlet: number): number {
  const karaMaas = d.ordular.filter((o) => o.devlet === devlet).reduce((s, o) => s + kompozisyonMaasi(o.kompozisyon), 0);
  const gemiMaas = d.donanmalar.filter((f) => f.devlet === devlet && f.yuk).reduce((s, f) => s + kompozisyonMaasi(f.yuk!.kompozisyon), 0);
  return karaMaas + gemiMaas + aylikBakim(d, devlet);
}

export function ikmalDurumu(d: DunyaDurumu, ag: HareketAgi | null, o: OrduDurumu): { deger: number; neden: string; dusmanda: boolean } {
  const n = ag?.dugumler[o.dugum];
  if (!n) return { deger: 0, neden: "Konum bilgisi yok; ikmal hesaplanamıyor.", dusmanda: false };
  const kontrol = d.birimler[n.b]?.kontrol ?? -1;
  if (kontrol === o.devlet) return { deger: DENGE.IKAMET_IKMAL, neden: "Kendi kontrolünüzdeki toprak: tam ikmal.", dusmanda: false };
  // TASK-0027: şehirli toprak artık ayrıca işgal edilmediği için kuşatmadaki ordu ordugâh kurar; aşınmaz [TASLAK]
  if (d.kusatmalar.some((k) => k.ordular.includes(o.id))) return { deger: DENGE.TARAFSIZ_IKMAL, neden: "Kuşatma ordugâhı: sınırlı ikmal, aşınma yok.", dusmanda: false };
  if (kontrol >= 0 && savasta(d, o.devlet, kontrol)) return {
    deger: DENGE.DUSMAN_IKMAL, dusmanda: true,
    neden: `Düşman toprağı: günde binde ${DENGE.IKMALSIZ_KAYIP_BINDE} asker (yukarı yuvarlanır) ve ${DENGE.IKMALSIZ_MORAL / 10} puan moral kaybı.`,
  };
  return { deger: DENGE.TARAFSIZ_IKMAL, neden: "Tarafsız veya devletsiz toprak: sınırlı ikmal; bu sürümde aşınma yok.", dusmanda: false };
}

export function toplamalariIlerlet(d: DunyaDurumu, b: Baglam): void {
  d.askerToplamalar = d.askerToplamalar.filter((t) => {
    const s = d.sehirler[t.sehir];
    const n = b.ag?.dugumler[s.dugum];
    // Şehir veya çevresi işgal altındaysa toplama bekler; para/insan gücü yeniden alınmaz.
    if (s.istikrar.ayaklanma || !n || s.devlet !== t.devlet || s.kontrol !== t.devlet || d.birimler[n.b]?.kontrol !== t.devlet) return true;
    t.kalanGun = Math.max(0, t.kalanGun - 1);
    if (t.kalanGun > 0) return true;
    const konum = b.sehirKonumlari?.[t.sehir] ?? n;
    const kompozisyon = tekTurKompozisyon(t.birim, t.asker);
    // Şehirde bekleyen kendi ordusu varsa yeni askerler ona katılır (yürüyüş, muharebe, geri çekilme ve kuşatma dışında)
    const bekleyen = t.toplanma === undefined ? toplanmaOrdusu(d, t.devlet, s.dugum) : undefined;
    if (bekleyen) {
      bekleyen.moral = Math.floor((bekleyen.moral * bekleyen.asker + DENGE.MORAL_EN_YUKSEK * t.asker) / (bekleyen.asker + t.asker));
      bekleyen.kompozisyon = kompozisyonTopla(bekleyen.kompozisyon, kompozisyon);
      bekleyen.asker += t.asker;
      bekleyen.hiz = kompozisyonHizi(bekleyen.kompozisyon, HAREKET.TEMEL_HIZ);
      olayEkle(d, { tur: "asker-toplandi", devlet: t.devlet, metin: `${s.ad}: ${t.asker} asker hazır; ${bekleyen.ad} ordusuna katıldı (${bekleyen.asker} asker).` });
      return false;
    }
    const o: OrduDurumu = { id: d.sonrakiOrduId++, ad: `${s.ad} Ordusu`, devlet: t.devlet, asker: t.asker,
      kompozisyon,
      dugum: s.dugum, x: konum.x, y: konum.y, hiz: kompozisyonHizi(kompozisyon, HAREKET.TEMEL_HIZ), rota: [], ilerleme: 0, hedef: null, // TASK-0019 (3/4)
      moral: DENGE.MORAL_EN_YUKSEK, tutum: "dengeli", cekiliyor: false, muharebe: null };
    d.ordular.push(o);
    // TASK-0036: toplanma şehrine yürür; yol kapanmışsa burada yeni ordu olarak kalır
    const h = t.toplanma !== undefined ? d.sehirler[t.toplanma] : undefined;
    const hn = h ? b.ag?.dugumler[h.dugum] : undefined;
    const r = h && hn && b.ag && h.devlet === t.devlet ? rotaBul(d, b.ag, o, { ...(b.sehirKonumlari?.[t.toplanma!] ?? hn), dugum: h.dugum }) : null;
    if (r?.gecerli && r.adimlar.length) {
      o.rota = r.adimlar;
      o.hedef = { x: r.adimlar[r.adimlar.length - 1].x, y: r.adimlar[r.adimlar.length - 1].y };
      o.toplanma = t.toplanma;
      olayEkle(d, { tur: "asker-toplandi", devlet: t.devlet, metin: `${s.ad}: ${t.asker} asker hazır; ${h!.ad}'daki toplanmaya yürüyor (${r.gun} gün).` });
    } else olayEkle(d, { tur: "asker-toplandi", devlet: t.devlet, metin: `${s.ad}: ${t.asker} asker hazır; yeni ordu kuruldu.` });
    return false;
  });
}

/** Düğümde bekleyen kendi ordusu (yürüyüş, muharebe, geri çekilme ve kuşatma dışında); en kalabalığı. */
export function toplanmaOrdusu(d: DunyaDurumu, devlet: number, dugum: number, haric = -1): OrduDurumu | undefined {
  return d.ordular.filter((o) => o.devlet === devlet && o.dugum === dugum && o.id !== haric && !o.rota.length && o.muharebe === null
    && !o.cekiliyor && o.toplanma === undefined && !d.kusatmalar.some((k) => k.ordular.includes(o.id)))
    .reduce<OrduDurumu | undefined>((a, o) => (!a || o.asker > a.asker ? o : a), undefined);
}

/** TASK-0036: toplanma şehrine varan birlik oradaki orduya katılır; yoksa ilk varan ordu olur ve sonrakileri bekler. */
export function toplanmayaKatil(d: DunyaDurumu, o: OrduDurumu): boolean {
  const sehir = o.toplanma;
  delete o.toplanma;
  if (sehir === undefined || d.sehirler[sehir]?.dugum !== o.dugum) return false;
  const a = toplanmaOrdusu(d, o.devlet, o.dugum, o.id);
  if (!a) { o.ad = `${d.sehirler[sehir].ad} Ordusu`; return false; }
  a.moral = Math.floor((a.moral * a.asker + o.moral * o.asker) / (a.asker + o.asker));
  a.kompozisyon = kompozisyonTopla(a.kompozisyon, o.kompozisyon);
  a.asker += o.asker;
  a.hiz = kompozisyonHizi(a.kompozisyon, HAREKET.TEMEL_HIZ);
  d.ordular = d.ordular.filter((x) => x.id !== o.id);
  olayEkle(d, { tur: "ordu-birlesti", devlet: a.devlet, metin: `${o.ad}, ${d.sehirler[sehir].ad}'da ${a.ad} ile birleşti (${sayiMetni(a.asker)} asker).` });
  return true;
}

export function maaslariOde(d: DunyaDurumu): void {
  d.devletler.forEach((v, devlet) => {
    const maas = devletMaasi(d, devlet);
    if (!maas) return;
    v.hazine -= maas;
    if (devlet === d.ayarlar.oyuncu) olayEkle(d, { tur: "ordu-maasi", devlet, metin: `Aylık ordu maaşı: −${maas}. Hazine: ${v.hazine}.${v.hazine < 0 ? " Maaş aksaması: moral her gün düşer. Borç/faiz yoktur." : ""}` });
  });
}

export function ikmalVeMaasMorali(d: DunyaDurumu, ag: HareketAgi | null): void {
  for (const o of d.ordular) {
    if (ikmalDurumu(d, ag, o).dusmanda) {
      // İlk sürümde her ordu ayrı aşınır; küçük birlik en az bir asker kaybeder.
      const kayip = Math.min(o.asker, Math.ceil(o.asker * DENGE.IKMALSIZ_KAYIP_BINDE / 1000));
      o.asker -= kayip;
      o.kompozisyon = kompozisyonCikar(o.kompozisyon, kompozisyonOransalAl(o.kompozisyon, kayip)); // TASK-0019
      o.moral = Math.max(0, o.moral - DENGE.IKMALSIZ_MORAL);
    }
    if (d.devletler[o.devlet].hazine < 0) o.moral = Math.max(0, o.moral - DENGE.MAAS_AKSAMASI_MORAL);
    if (o.asker === 0) olayEkle(d, { tur: "ordu-asindi", devlet: o.devlet, metin: `${o.ad} ikmalsizlik nedeniyle dağıldı.` });
  }
  d.ordular = d.ordular.filter((o) => o.asker > 0);
}
