// TASK-0051: AI gemi üretimi ve çıkarma. AI oyuncuyla aynı emirleri (gemiInsa, donanmaHedef, orduHedef, cikarma) aynı
// doğrulamadan geçirerek verir; bütçe, teknoloji ve kaynak sınırları ortaktır. Sayılar denge.ts'te [TASLAK].

import { olayEkle, type DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import { emirDogrula, emirUygula, type Baglam, type Emir } from "./emirler";
import { cikarmaEngeli, denizYolu, donanmaGucu, kapasite } from "./deniz";
import { dugumMaliyetleri } from "./hareket";
import { orduKusatmasi, sehirMenzilinde } from "./kusatma";
import { devletMaasi } from "./ordu";
import { biliyor } from "./teknoloji";
import { savasta } from "./savas";

const dene = (d: DunyaDurumu, b: Baglam, e: Emir) => {
  if (!emirDogrula(d, e, b, true).gecerli) return false;
  emirUygula(d, e, b);
  return true;
};
/** Neden beklediği AI'ın kendi kaydına düşer (oyuncunun günlüğüne yazılmaz). */
const bekle = (d: DunyaDurumu, devlet: number, neden: string) => { olayEkle(d, { tur: "yz-deniz", devlet, metin: neden }); return false; };

const limanlari = (d: DunyaDurumu, devlet: number) => d.sehirler.flatMap((s, i) => (s.devlet === devlet && s.kontrol === devlet && s.bagli < 0
  && (d.deniz.limanlar[i] ?? -1) >= 0 && !s.istikrar.ayaklanma && !d.kusatmalar.some((k) => k.sehir === i) ? [i] : []));

/** Aylık: limanı olan her AI, liman sayısına göre (savaşta iki kat) hedef donanma gücünün altındaysa yedeğini bozmadan gemi yapar. */
export function yzGemiInsalari(d: DunyaDurumu, b: Baglam): void {
  d.devletler.forEach((v, devlet) => {
    if (devlet === d.ayarlar.oyuncu) return;
    const limanlar = limanlari(d, devlet);
    if (!limanlar.length) return;
    const savasiVar = d.savaslar.some((s) => s.saldiran === devlet || s.savunan === devlet);
    const filolar = d.donanmalar.filter((f) => f.devlet === devlet);
    const yapiliyor = d.gemiInsalari.filter((g) => g.devlet === devlet).reduce((t, g) => t + g.adet * DENGE.GEMI[g.gemi].guc, 0);
    const guc = filolar.reduce((t, f) => t + donanmaGucu(f), 0) + yapiliyor;
    const hedef = Math.min(DENGE.YZ_FILO_EN_COK_GUC, limanlar.length * DENGE.YZ_FILO_LIMAN_GUC) * (savasiVar ? 2 : 1);
    if (guc >= hedef) return;
    const yedek = Math.max(DENGE.YZ_YEDEK_EN_AZ, devletMaasi(d, devlet) * DENGE.YZ_YEDEK_AY);
    const gemi = biliyor(d, devlet, "kalyon") && v.hazine - yedek >= DENGE.GEMI.kalyon.bedel * 4 ? "kalyon" : "kadirga";
    const g = DENGE.GEMI[gemi];
    const adet = Math.min(DENGE.GEMI_INSA_EN_COK, Math.ceil((hedef - guc) / g.guc), Math.floor((v.hazine - yedek) / g.bedel));
    if (adet < 1) return;
    // Ana donanmanın denizindeki liman, yoksa başkent, yoksa ilk liman
    const ana = filolar.sort((a, c) => donanmaGucu(c) - donanmaGucu(a) || a.id - c.id)[0];
    const sehir = limanlar.find((i) => ana && d.deniz.limanlar[i] === ana.bolge) ?? limanlar.find((i) => i === v.baskent) ?? limanlar[0];
    dene(d, b, { tur: "gemiInsa", sehir, gemi, adet, devlet });
  });
}

/** Savaştaki AI, kara yolu olmayan düşman limanına çıkarma planlar: ordu limana → donanma o denize → çıkarma emri. */
export function yzCikarmalari(d: DunyaDurumu, b: Baglam): void {
  if (!b.ag) return;
  const ag = b.ag;
  d.devletler.forEach((_, devlet) => {
    if (devlet === d.ayarlar.oyuncu || (d.gun + devlet * 3) % DENGE.YZ_SEFER_ARALIGI !== 0) return;
    if (!d.savaslar.some((s) => s.saldiran === devlet || s.savunan === devlet)) return;
    const ordular = d.ordular.filter((o) => o.devlet === devlet && !o.rota.length && o.muharebe === null && !o.cekiliyor
      && !orduKusatmasi(d, o.id) && o.asker >= DENGE.YZ_CIKARMA_EN_AZ_ASKER).sort((a, c) => c.asker - a.asker || a.id - c.id);
    if (!ordular.length) return;
    const o = ordular[0], maliyet = dugumMaliyetleri(d, ag, o.dugum, devlet);
    // Kara yolu olmayan, çıkılabilir düşman limanları
    const hedefler = d.sehirler.flatMap((s, i) => (savasta(d, devlet, s.devlet) && s.bagli < 0 && (d.deniz.limanlar[i] ?? -1) >= 0
      && s.dugum >= 0 && maliyet[s.dugum] === Infinity && !cikarmaEngeli(d, b, devlet, i) ? [i] : []));
    if (!hedefler.length) return;
    const filolar = d.donanmalar.filter((f) => f.devlet === devlet && !f.yuk && !f.rota.length);
    if (!filolar.length) { bekle(d, devlet, "Çıkarma bekliyor: boşta donanma yok."); return; }
    const benimLiman = limanlari(d, devlet).find((i) => sehirMenzilinde(d, b, o, i));
    if (benimLiman === undefined) {
      // Ordu en yakın kendi limanına yürür
      const liman = limanlari(d, devlet).filter((i) => d.sehirler[i].dugum >= 0 && maliyet[d.sehirler[i].dugum] < Infinity)
        .sort((a, c) => maliyet[d.sehirler[a].dugum] - maliyet[d.sehirler[c].dugum] || a - c)[0];
      if (liman === undefined) { bekle(d, devlet, "Çıkarma bekliyor: ordunun yürüyebileceği liman yok."); return; }
      const s = d.sehirler[liman], p = b.sehirKonumlari?.[liman] ?? ag.dugumler[s.dugum];
      dene(d, b, { tur: "orduHedef", ordu: o.id, x: p.x, y: p.y, dugum: s.dugum });
      return;
    }
    const bolge = d.deniz.limanlar[benimLiman];
    const filo = filolar.filter((f) => kapasite(f) >= o.asker).sort((a, c) => (a.bolge === bolge ? 0 : 1) - (c.bolge === bolge ? 0 : 1) || a.id - c.id)[0];
    if (!filo) { bekle(d, devlet, `Çıkarma bekliyor: ${o.asker} asker için taşıma kapasitesi yetmiyor.`); return; }
    if (filo.bolge !== bolge) { dene(d, b, { tur: "donanmaHedef", donanma: filo.id, bolge }); return; }
    const hedef = hedefler.map((i) => ({ i, yol: denizYolu(d, bolge, d.deniz.limanlar[i]) })).filter((x) => x.yol)
      .sort((a, c) => a.yol!.length - c.yol!.length || a.i - c.i)[0];
    if (!hedef) { bekle(d, devlet, "Çıkarma bekliyor: hedef limana deniz yolu yok."); return; }
    dene(d, b, { tur: "cikarma", donanma: filo.id, ordu: o.id, sehir: hedef.i });
  });
}
