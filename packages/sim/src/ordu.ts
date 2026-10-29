// TASK-0007/4b: toplama, maaş ve ikmal. Tüm oranlar denge.ts içindedir.
import { olayEkle, type DunyaDurumu, type OrduDurumu } from "./durum";
import { DENGE } from "./denge";
import { HAREKET, type HareketAgi } from "./hareket";
import { savasta } from "./savas";
import type { Baglam } from "./emirler";

export const toplamaMaliyeti = (asker: number): number => Math.ceil(asker * DENGE.TOPLAMA_ASKER_BASINA_MALIYET_BINDE / 1000);
// Devlet toplamı üzerinden yuvarlanır: orduyu bölmek maaşı değiştirmez.
export const aylikMaas = (asker: number): number => Math.ceil(asker * DENGE.AYLIK_ASKER_MAASI_BINDE / 1000);
export function devletMaasi(d: DunyaDurumu, devlet: number): number {
  return aylikMaas(d.ordular.filter((o) => o.devlet === devlet).reduce((s, o) => s + o.asker, 0));
}

export function ikmalDurumu(d: DunyaDurumu, ag: HareketAgi | null, o: OrduDurumu): { deger: number; neden: string; dusmanda: boolean } {
  const n = ag?.dugumler[o.dugum];
  if (!n) return { deger: 0, neden: "Konum bilgisi yok; ikmal hesaplanamıyor.", dusmanda: false };
  const kontrol = d.birimler[n.b]?.kontrol ?? -1;
  if (kontrol === o.devlet) return { deger: DENGE.IKAMET_IKMAL, neden: "Kendi kontrolünüzdeki toprak: tam ikmal.", dusmanda: false };
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
    if (!n || s.devlet !== t.devlet || s.kontrol !== t.devlet || d.birimler[n.b]?.kontrol !== t.devlet) return true;
    t.kalanGun = Math.max(0, t.kalanGun - 1);
    if (t.kalanGun > 0) return true;
    const konum = b.sehirKonumlari?.[t.sehir] ?? n;
    d.ordular.push({ id: d.sonrakiOrduId++, ad: `${s.ad} Ordusu`, devlet: t.devlet, asker: t.asker,
      dugum: s.dugum, x: konum.x, y: konum.y, hiz: HAREKET.TEMEL_HIZ, rota: [], ilerleme: 0, hedef: null,
      moral: DENGE.MORAL_EN_YUKSEK, tutum: "dengeli", cekiliyor: false, muharebe: null });
    olayEkle(d, { tur: "asker-toplandi", devlet: t.devlet, metin: `${s.ad}: ${t.asker} asker hazır; yeni ordu kuruldu.` });
    return false;
  });
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
      o.moral = Math.max(0, o.moral - DENGE.IKMALSIZ_MORAL);
    }
    if (d.devletler[o.devlet].hazine < 0) o.moral = Math.max(0, o.moral - DENGE.MAAS_AKSAMASI_MORAL);
    if (o.asker === 0) olayEkle(d, { tur: "ordu-asindi", devlet: o.devlet, metin: `${o.ad} ikmalsizlik nedeniyle dağıldı.` });
  }
  d.ordular = d.ordular.filter((o) => o.asker > 0);
}
