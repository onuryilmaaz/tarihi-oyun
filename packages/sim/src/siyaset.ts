// TASK-0048: ortak savaş/barış payı, vasal sadakati ve ilhakı, ayaklanmadan bağımsızlık.
// Yeni devlet indeksi yaratılmaz: bağımsızlık şehrin 1453'teki asıl sahibini (senaryodaki devlet) yeniden canlandırır.
// Böylece harita rengi/adı hazırdır ve süreç öngörülebilirdir. Sayılar denge.ts'te [TASLAK].

import { olayEkle, type DunyaDurumu, type Savas } from "./durum";
import { DENGE } from "./denge";
import { diplomasiOnHesap, iliski } from "./diplomasi";
import { savasiSonlandir, yikilanDevletleriTemizle } from "./savas-sonu";
import { sehirToprakEsitle } from "./sehir";
import { baskentleriGuncelle } from "./baris";
import { savasta, sayiMetni } from "./savas";
import { toplamAskerSayisi } from "./ordu";
import { HAREKET } from "./denge";
import { kompozisyonHizi, tekTurKompozisyon } from "./birim";
import type { Baglam } from "./emirler";

const ilgili = (d: DunyaDurumu, ...devletler: number[]) => devletler.includes(d.ayarlar.oyuncu) ? d.ayarlar.oyuncu : null;

/** Lider barış yapınca onun yanında savaşan müttefiklerin aynı düşmanla savaşı da biter. Kazanan tarafın müttefiki
 *  işgal ettiği (askerî kontrolündeki) düşman şehirlerini pay olarak alır; kaybeden tarafın müttefiki beyaz barış yapar. */
export function ortakBarisPayi(d: DunyaDurumu, kazanan: number, kaybeden: number): void {
  for (const w of [...d.savaslar] as Savas[]) {
    if (w.lider !== kazanan && w.lider !== kaybeden) continue;
    const dusman = w.lider === kazanan ? kaybeden : kazanan;
    if (w.saldiran !== dusman && w.savunan !== dusman) continue;
    const muttefik = w.saldiran === dusman ? w.savunan : w.saldiran;
    const pay: string[] = [];
    if (w.lider === kazanan) {
      d.sehirler.forEach((c, i) => {
        if (c.devlet !== dusman || c.kontrol !== muttefik || c.bagli >= 0) return;
        c.devlet = muttefik; c.istikrar.fetihGun = d.gun; c.istikrar.bagis = 0;
        pay.push(d.sehirler[i].ad);
      });
    }
    savasiSonlandir(d, w);
    olayEkle(d, { tur: "ortak-baris", devlet: ilgili(d, muttefik, dusman),
      metin: `${d.devletler[muttefik].ad}, lideri ${d.devletler[w.lider].ad}'nın barışıyla ${d.devletler[dusman].ad} ile savaşı bitirdi.${pay.length ? ` Payı: ${pay.join(", ")}.` : ""}` });
  }
}

/** Saldıran devletin AI müttefikleri, ilişkileri yeterliyse ve hedefle bağları yoksa ortak savaşa katılır (oyuncu zorlanmaz). */
export function saldiriCagrisi(d: DunyaDurumu, b: Baglam, saldiran: number, hedef: number): void {
  const o = diplomasiOnHesap(d, b.ag);
  const muttefikler = d.ittifaklar.flatMap((i) => (i.a === saldiran ? [i.b] : i.b === saldiran ? [i.a] : []));
  for (const m of muttefikler) {
    if (m === hedef || m === d.ayarlar.oyuncu || savasta(d, m, hedef)) continue;
    if (d.ittifaklar.some((i) => (i.a === m && i.b === hedef) || (i.b === m && i.a === hedef))) continue;
    if (iliski(d, o, m, saldiran) < DENGE.ORTAK_SAVAS_KATILMA_ILISKI || iliski(d, o, m, hedef) >= 0) continue;
    d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: m, savunan: hedef, baslangic: d.gun, lider: saldiran });
    olayEkle(d, { tur: "ittifak-cagri", devlet: ilgili(d, m, hedef, saldiran),
      metin: `${d.devletler[m].ad}, müttefiki ${d.devletler[saldiran].ad}'nın yanında ${d.devletler[hedef].ad}'na karşı ortak savaşa girdi.` });
  }
}

/** Aylık: vasal sadakati ilişkiye ve güç dengesine göre hedefe yaklaşır; çok düşerse vasal bağımsızlık savaşı açar.
 *  Süren ilhak süresi dolunca vasal efendiye katılır; sadakat eşiğin altına inerse ilhak düşer. */
export function vasalSadakatAyi(d: DunyaDurumu, b: Baglam): void {
  if (!d.vasalliklar.length) return;
  const o = diplomasiOnHesap(d, b.ag);
  for (const v of [...d.vasalliklar]) {
    v.sadakat = Math.max(0, Math.min(100, v.sadakat + Math.max(-DENGE.VASAL_SADAKAT_ADIM, Math.min(DENGE.VASAL_SADAKAT_ADIM, sadakatHedefi(d, o, v.efendi, v.vasal) - v.sadakat))));
    const ef = d.devletler[v.efendi].ad, va = d.devletler[v.vasal].ad;
    if (v.ilhakBitis !== null && v.sadakat < DENGE.VASAL_ILHAK_SADAKAT) {
      v.ilhakBitis = null;
      olayEkle(d, { tur: "vasal-ilhak", devlet: ilgili(d, v.efendi, v.vasal), metin: `${va}'nın sadakati düştü (%${v.sadakat}); ${ef}'nın ilhak süreci durdu. Bedel geri verilmez.` });
    } else if (v.ilhakBitis !== null && d.gun >= v.ilhakBitis) {
      vasalIlhakEt(d, v.efendi, v.vasal);
      continue;
    }
    if (v.sadakat < DENGE.VASAL_ISYAN_SADAKAT && !savasta(d, v.vasal, v.efendi)) {
      d.vasalliklar = d.vasalliklar.filter((x) => x !== v);
      d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: v.vasal, savunan: v.efendi, baslangic: d.gun });
      const metin = `${va}, sadakati %${v.sadakat}'e düşünce ${ef}'ya karşı bağımsızlık savaşı açtı.`;
      olayEkle(d, { tur: "vasal-isyan", devlet: ilgili(d, v.efendi, v.vasal), metin });
      if ([v.efendi, v.vasal].includes(d.ayarlar.oyuncu) && !d.aktifKesinti) d.aktifKesinti = { gun: d.gun, neden: metin };
    }
  }
}

/** Sadakat hedefi: 50 + ilişkinin yarısı; efendi vasaldan iki kat güçlüyse +15, vasal daha güçlüyse −20. */
export function sadakatHedefi(d: DunyaDurumu, o: ReturnType<typeof diplomasiOnHesap>, efendi: number, vasal: number): number {
  const ge = toplamAskerSayisi(d, efendi), gv = toplamAskerSayisi(d, vasal);
  const guc = ge >= gv * 2 ? 15 : gv > ge ? -20 : 0;
  return Math.max(0, Math.min(100, 50 + Math.trunc(iliski(d, o, vasal, efendi) / 2) + guc));
}

export function ilhakBedeli(d: DunyaDurumu, vasal: number): { bedel: number; gun: number } {
  const sehir = d.sehirler.filter((c) => c.devlet === vasal && c.bagli < 0).length;
  return { bedel: sehir * DENGE.VASAL_ILHAK_SEHIR_BEDEL, gun: DENGE.VASAL_ILHAK_TABAN_GUN + sehir * DENGE.VASAL_ILHAK_SEHIR_GUN };
}

function vasalIlhakEt(d: DunyaDurumu, efendi: number, vasal: number): void {
  for (const c of d.sehirler) if (c.devlet === vasal) { c.devlet = efendi; c.kontrol = efendi; c.isgalBaslangic = null; }
  for (const bi of d.birimler) {
    if (bi.sahip === vasal) bi.sahip = efendi;
    if (bi.kontrol === vasal) bi.kontrol = efendi;
  }
  // Vasalın orduları efendiye geçer (dağılmaz); komutan bağları kopar
  for (const o of d.ordular) if (o.devlet === vasal) { o.devlet = efendi; o.komutan = null; }
  d.devletler[efendi].hazine += Math.max(0, d.devletler[vasal].hazine);
  d.devletler[vasal].hazine = 0;
  d.vasalliklar = d.vasalliklar.filter((v) => v.vasal !== vasal);
  sehirToprakEsitle(d);
  yikilanDevletleriTemizle(d);
  baskentleriGuncelle(d);
  olayEkle(d, { tur: "vasal-ilhak", devlet: ilgili(d, efendi, vasal), metin: `${d.devletler[vasal].ad}, ${d.devletler[efendi].ad}'na diplomatik yolla katıldı.` });
}

/** Şehrin 1453'teki asıl sahibi (senaryo), devlet indeksi. */
export const asilSahip = (d: DunyaDurumu, sehir: number): number => d.sehirler[sehir]?.asil ?? -1;

/** Bağımsızlık beklentisi: fethedilmiş (asıl sahibi başka) ayaklanmadaki şehir için kalan ay ve yeniden doğacak devlet. */
export function bagimsizlikBeklentisi(d: DunyaDurumu, sehir: number): { devlet: number; kalanAy: number } | null {
  const s = d.sehirler[sehir], asil = asilSahip(d, sehir);
  if (!s.istikrar.ayaklanma || asil < 0 || asil === s.devlet) return null;
  return { devlet: asil, kalanAy: Math.max(0, DENGE.BAGIMSIZLIK_AYAKLANMA_AY - s.istikrar.ayaklanmaAy) };
}

/** Aylık (istikrardan sonra): süresi dolan ayaklanmalar, aynı asıl sahibe ait ayaklanmadaki komşu şehirlerle birlikte
 *  bağımsız olur. Asıl sahip yeniden doğar (ya da büyür), isyancı ordu kurulur ve eski sahibiyle savaş başlar. */
export function bagimsizlikAyi(d: DunyaDurumu, b: Baglam): void {
  const gruplar = new Map<string, number[]>();
  d.sehirler.forEach((s, i) => {
    const bk = bagimsizlikBeklentisi(d, i);
    if (!bk) return;
    const k = `${s.devlet}>${bk.devlet}`;
    (gruplar.get(k) ?? gruplar.set(k, []).get(k)!).push(i);
  });
  for (const [k, sehirler] of gruplar) {
    if (!sehirler.some((i) => d.sehirler[i].istikrar.ayaklanmaAy >= DENGE.BAGIMSIZLIK_AYAKLANMA_AY)) continue;
    const [eski, yeni] = k.split(">").map(Number);
    const yeniden = !d.sehirler.some((c) => c.devlet === yeni);
    let asker = 0;
    for (const i of sehirler) {
      const s = d.sehirler[i];
      s.devlet = yeni; s.kontrol = yeni; s.isgalBaslangic = null;
      Object.assign(s.istikrar, { ayaklanma: false, ayaklanmaAy: 0, yuksekAy: 0, asayisAy: 0, fetihGun: null });
      asker += Math.max(DENGE.BAGIMSIZLIK_ASKER_EN_AZ, Math.floor((s.nufus * DENGE.BAGIMSIZLIK_ASKER_YUZDE) / 100));
    }
    d.askerToplamalar = d.askerToplamalar.filter((t) => d.sehirler[t.sehir].devlet === t.devlet);
    d.vasalliklar = d.vasalliklar.filter((v) => v.vasal !== yeni);
    sehirToprakEsitle(d);
    if (yeniden) d.devletler[yeni].hazine = Math.max(d.devletler[yeni].hazine, DENGE.BAGIMSIZLIK_HAZINE);
    baskentleriGuncelle(d);
    // İsyancı ordu ilk şehirde kurulur
    const s0 = d.sehirler[sehirler[0]], n = b.ag?.dugumler[s0.dugum], p = b.sehirKonumlari?.[sehirler[0]] ?? n;
    if (p && s0.dugum >= 0) {
      const kompozisyon = tekTurKompozisyon("piyade", asker);
      d.ordular.push({ id: d.sonrakiOrduId++, ad: `${s0.ad} İsyancıları`, devlet: yeni, asker, kompozisyon, dugum: s0.dugum, x: p.x, y: p.y,
        hiz: kompozisyonHizi(kompozisyon, HAREKET.TEMEL_HIZ), rota: [], ilerleme: 0, hedef: null, moral: DENGE.MORAL_EN_YUKSEK, tutum: "dengeli",
        cekiliyor: false, muharebe: null, deneyim: 0, komutan: null });
    }
    if (!savasta(d, yeni, eski)) d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: yeni, savunan: eski, baslangic: d.gun });
    const metin = `${sehirler.map((i) => d.sehirler[i].ad).join(", ")} ayaklanması bastırılamadı: ${d.devletler[yeni].ad} ${yeniden ? "yeniden kuruldu" : "bu şehirleri geri aldı"}; ${sayiMetni(asker)} isyancı ${d.devletler[eski].ad}'na karşı savaşıyor.`;
    olayEkle(d, { tur: "bagimsizlik", devlet: ilgili(d, eski, yeni), metin });
    if ([eski, yeni].includes(d.ayarlar.oyuncu) && !d.aktifKesinti) d.aktifKesinti = { gun: d.gun, neden: metin };
  }
}
