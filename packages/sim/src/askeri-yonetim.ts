// TASK-0043: yurtta terhis, bütçe sınırlı takviye ve AI maaş toparlanması. Mevcut toplama kuralları kullanılır.
import { olayEkle, type DunyaDurumu, type OrduDurumu } from "./durum";
import { DENGE } from "./denge";
import { BIRIM_TURLERI, bosKompozisyon, kompozisyonCikar, kompozisyonHizi, kompozisyonOransalAl, kompozisyonToplami, type Kompozisyon } from "./birim";
import { HAREKET } from "./hareket";
import { orduKusatmasi, sehirMenzilinde } from "./kusatma";
import { devletMaasi, insanGucuTavani, toplamaMaliyeti } from "./ordu";
import { emirDogrula, emirUygula, kullanilabilirHazine, kullanilabilirInsanGucu, sehirToplamaYuzde, type Baglam } from "./emirler";
import { gundenTarih } from "./takvim";

export function terhisEngeli(d: DunyaDurumu, b: Baglam, o: OrduDurumu | undefined, devlet: number): string | null {
  if (!o || o.devlet !== devlet || o.asker <= 0) return "Kendi kara ordunuzu seçin.";
  if (o.rota.length || o.muharebe !== null || o.cekiliyor || orduKusatmasi(d, o.id)) return "Terhis için ordu yürüyüş, muharebe, geri çekilme ve kuşatma dışında beklemeli.";
  const birim = b.ag?.dugumler[o.dugum]?.b;
  if (birim === undefined || d.birimler[birim]?.sahip !== devlet || d.birimler[birim]?.kontrol !== devlet) return "Terhis yalnızca kendi kontrolünüzdeki kendi toprağınızda yapılır.";
  return null;
}

export function takviyeSehri(d: DunyaDurumu, b: Baglam, o: OrduDurumu): number {
  if (terhisEngeli(d, b, o, o.devlet)) return -1;
  return d.sehirler.findIndex((s, i) => s.devlet === o.devlet && s.kontrol === o.devlet && s.bagli < 0
    && !s.istikrar.ayaklanma && s.dugum === o.dugum && !d.kusatmalar.some((k) => k.sehir === i) && sehirMenzilinde(d, b, o, i));
}

/** Hedef büyütülürken mevcut tür oranları korunur; en büyük kalanlar aynı sırayla dağıtılır. */
export function takviyeKompozisyonu(o: OrduDurumu, hedef: number): Kompozisyon {
  const k = bosKompozisyon();
  const sira = BIRIM_TURLERI.map((t) => { k[t] = Math.floor(o.kompozisyon[t] * hedef / o.asker); return { t, kalan: (o.kompozisyon[t] * hedef) % o.asker }; })
    .sort((a, b) => b.kalan - a.kalan || BIRIM_TURLERI.indexOf(a.t) - BIRIM_TURLERI.indexOf(b.t));
  let kalan = hedef - kompozisyonToplami(k);
  for (const { t } of sira) if (kalan-- > 0) k[t]++;
  return k;
}

export function takviyeyiKapat(d: DunyaDurumu, o: OrduDurumu): void {
  delete o.takviye;
  // Ücreti ödenmiş ama tamamlanmamış otomatik toplama da iptal edilir. Elle verilen toplamalara dokunulmaz.
  for (const t of d.askerToplamalar.filter((x) => x.takviye === o.id && x.devlet === o.devlet)) {
    d.devletler[t.devlet].hazine += t.bedel;
    const s = d.sehirler[t.sehir];
    if (s.devlet === t.devlet) s.insanGucu = Math.min(insanGucuTavani(d, t.sehir), s.insanGucu + t.asker);
  }
  d.askerToplamalar = d.askerToplamalar.filter((t) => t.takviye !== o.id || t.devlet !== o.devlet);
}

export function askerTerhisEt(d: DunyaDurumu, b: Baglam, o: OrduDurumu, miktar: number): void {
  takviyeyiKapat(d, o);
  const sehir = takviyeSehri(d, b, o);
  const cikan = kompozisyonOransalAl(o.kompozisyon, miktar);
  o.kompozisyon = kompozisyonCikar(o.kompozisyon, cikan);
  o.asker -= miktar;
  o.hiz = kompozisyonHizi(o.kompozisyon, HAREKET.TEMEL_HIZ);
  let donen = 0;
  if (sehir >= 0) {
    const s = d.sehirler[sehir];
    donen = Math.min(miktar, Math.max(0, insanGucuTavani(d, sehir) - s.insanGucu));
    s.insanGucu += donen;
  }
  if (!o.asker) d.ordular = d.ordular.filter((x) => x !== o);
  olayEkle(d, { tur: "ordu-terhis", devlet: o.devlet, metin: `${o.ad}: ${miktar} asker terhis edildi.${donen ? ` ${donen} kişi ${d.sehirler[sehir].ad} insan gücü havuzuna döndü.` : ""} Takviye kapatıldı; terhis edilen askerin geçmiş toplama bedeli iade edilmez.` });
}

/** Aylık, sabit ordu sırası. Para ve insan gücü mevcut emir doğrulamasından geçer, aynı kaynak iki kez harcanmaz. */
export function otomatikTakviyeler(d: DunyaDurumu, b: Baglam): void {
  const t = gundenTarih(d.gun), ay = t.yil * 12 + t.ay;
  for (const o of [...d.ordular].sort((a, c) => a.id - c.id)) {
    const a = o.takviye;
    if (!a || a.sonAy === ay) continue;
    a.sonAy = ay;
    const sehir = takviyeSehri(d, b, o);
    if (sehir < 0) continue;
    let kalanButce = Math.min(a.aylikButce, kullanilabilirHazine(d, o.devlet));
    for (const birim of BIRIM_TURLERI) {
      const yolda = d.askerToplamalar.filter((x) => x.takviye === o.id && x.birim === birim).reduce((s, x) => s + x.asker, 0);
      const eksik = a.hedef[birim] - o.kompozisyon[birim] - yolda;
      const havuz = kullanilabilirInsanGucu(d, sehir);
      if (eksik <= 0 || havuz <= 0 || kalanButce <= 0) continue;
      const yuzde = sehirToplamaYuzde(d, sehir, birim);
      // Bedel tamsayıya yukarı yuvarlanır; ikili arama bütçenin üstüne çıkamaz.
      let alt = 0, ust = Math.min(eksik, havuz);
      while (alt < ust) {
        const n = Math.floor((alt + ust + 1) / 2);
        if (toplamaMaliyeti(n, yuzde, birim) <= kalanButce) alt = n; else ust = n - 1;
      }
      if (!alt) continue;
      const e = { tur: "askerTopla", sehir, asker: alt, birim, devlet: o.devlet, takviye: o.id } as const;
      if (!emirDogrula(d, e, b).gecerli) continue;
      const bedel = toplamaMaliyeti(alt, yuzde, birim);
      emirUygula(d, e, b);
      kalanButce -= bedel;
    }
  }
}

/** AI barışta maaşı gelirinin üzerinde kaldığında kendi yurttaki ordusunu kademeli azaltır. */
export function yzButceToparla(d: DunyaDurumu, b: Baglam, devlet: number, gelir: number): void {
  if (d.savaslar.some((s) => s.saldiran === devlet || s.savunan === devlet)) return;
  const hedef = Math.floor(gelir * DENGE.YZ_BUTCE_MAAS_YUZDE / 100);
  if (devletMaasi(d, devlet) <= gelir) return;
  for (const o of d.ordular.filter((x) => x.devlet === devlet).sort((a, c) => c.asker - a.asker || a.id - c.id)) {
    if (terhisEngeli(d, b, o, devlet)) continue;
    const fazla = devletMaasi(d, devlet) - hedef;
    if (fazla <= 0) break;
    const n = Math.min(Math.ceil(o.asker * DENGE.YZ_TERHIS_EN_COK_YUZDE / 100), Math.ceil(o.asker * fazla / Math.max(1, devletMaasi(d, devlet))));
    const e = { tur: "orduTerhis", ordu: o.id, asker: n, devlet } as const;
    if (emirDogrula(d, e, b, true).gecerli) emirUygula(d, e, b);
  }
}
