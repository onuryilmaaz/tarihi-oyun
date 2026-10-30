// TASK-0007/4c — DEC-0027/1: AI gelene kadar işgal skoru talebi karşılıyorsa barış kabul edilir.
import { olayEkle, type BarisTalebi, type DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import type { Baglam, Dogrulama } from "./emirler";
import { gecilebilir, orduKonumu, rotaBul } from "./hareket";
import { savasiSonlandir, yikilanDevletleriTemizle } from "./savas-sonu";
import { efendisi, vasalKur, vasalMi } from "./vasallik";

export const sehirDegeri = (d: DunyaDurumu, sehir: number): number => d.sehirler[sehir].baskent ? DENGE.BASKENT_DEGERI : DENGE.SEHIR_DEGERI;
export interface BarisDevirOzeti { alinanArazi: number; alinanSehir: number; kalanArazi: number; kalanSehir: number; tamIlhak: boolean }
/** Talepte seçilmeyen şehirler araziyle birlikte otomatik devredilmez (UX-01). */
export function barisDevirOzeti(d: DunyaDurumu, karsi: number, t: BarisTalebi): BarisDevirOzeti {
  const alinanArazi = d.birimler.filter((b, i) => b.sahip === karsi && t.birimler.includes(i)).length;
  const alinanSehir = d.sehirler.filter((s, i) => s.devlet === karsi && t.sehirler.includes(i)).length;
  const kalanArazi = d.birimler.filter((b) => b.sahip === karsi).length - alinanArazi;
  const kalanSehir = d.sehirler.filter((s) => s.devlet === karsi).length - alinanSehir;
  return { alinanArazi, alinanSehir, kalanArazi, kalanSehir, tamIlhak: kalanArazi === 0 && kalanSehir === 0 };
}
function toplamDeger(d: DunyaDurumu, devlet: number): number {
  return d.birimler.filter((b) => b.sahip === devlet).length * DENGE.BOLGE_DEGERI
    + d.sehirler.reduce((s, c, i) => s + (c.devlet === devlet ? sehirDegeri(d, i) : 0), 0);
}
function isgalDegeri(d: DunyaDurumu, sahip: number, kontrol: number): number {
  return d.birimler.filter((b) => b.sahip === sahip && b.kontrol === kontrol).length * DENGE.BOLGE_DEGERI
    + d.sehirler.reduce((s, c, i) => s + (c.devlet === sahip && c.kontrol === kontrol ? sehirDegeri(d, i) : 0), 0);
}
export function savasSkoru(d: DunyaDurumu, devlet: number, karsi: number): { skor: number; alinan: number; kaybedilen: number; toplam: number } {
  const alinan = isgalDegeri(d, karsi, devlet), kaybedilen = isgalDegeri(d, devlet, karsi);
  const toplam = Math.max(1, toplamDeger(d, karsi));
  return { skor: Math.max(-100, Math.min(100, Math.floor((alinan - kaybedilen) * 100 / toplam))), alinan, kaybedilen, toplam };
}
export function barisBedeli(d: DunyaDurumu, devlet: number, karsi: number, t: BarisTalebi): number {
  const deger = t.birimler.length * DENGE.BOLGE_DEGERI + t.sehirler.reduce((s, i) => s + sehirDegeri(d, i), 0);
  const toprak = deger > 0 ? Math.max(1, Math.floor(deger * 100 / Math.max(1, toplamDeger(d, karsi)))) : 0;
  return toprak + Math.ceil(t.tazminat / DENGE.TAZMINAT_PUAN_BASINA);
}

/** devlet: talep eden (kazanan) taraf; oyuncu emri için varsayılan oyuncu. AI da aynı kuralla barış yapar (6c). */
export function barisDogrula(d: DunyaDurumu, t: BarisTalebi, devlet = d.ayarlar.oyuncu): Dogrulama {
  const s = d.savaslar.find((v) => v.id === t.savas);
  if (!s || (s.saldiran !== devlet && s.savunan !== devlet)) return { gecerli: false, neden: "Tarafı olduğunuz savaş bulunamadı." };
  const karsi = s.saldiran === devlet ? s.savunan : s.saldiran;
  if (!Array.isArray(t.birimler) || !Array.isArray(t.sehirler)
    || t.birimler.some((i) => !Number.isSafeInteger(i) || !d.birimler[i])
    || t.sehirler.some((i) => !Number.isSafeInteger(i) || !d.sehirler[i])
    || new Set(t.birimler).size !== t.birimler.length || new Set(t.sehirler).size !== t.sehirler.length) {
    return { gecerli: false, neden: "Barış talebindeki arazi/şehir listesi geçersiz veya tekrar içeriyor." };
  }
  if (!Number.isSafeInteger(t.tazminat) || t.tazminat < 0) return { gecerli: false, neden: "Tazminat sıfır veya pozitif tam sayı olmalı." };
  if (t.birimler.some((i) => d.birimler[i].sahip !== karsi || d.birimler[i].kontrol !== devlet)
    || t.sehirler.some((i) => d.sehirler[i].devlet !== karsi || d.sehirler[i].kontrol !== devlet)) {
    return { gecerli: false, neden: "Yalnızca bu düşmana ait ve sizin işgal ettiğiniz arazi/şehirler talep edilebilir." };
  }
  if (t.tazminat > Math.max(0, d.devletler[karsi].hazine)) return { gecerli: false, neden: "Karşı taraf bu tazminatı peşin ödeyemiyor. Borçlanma yoktur; tazminatı azaltın." };
  const skor = savasSkoru(d, devlet, karsi).skor, bedel = barisBedeli(d, devlet, karsi, t);
  if (bedel > skor) return { gecerli: false, neden: `Talep ${bedel} puan; savaş skorunuz ${skor}. Daha az talep edin veya işgali genişletin.` };
  if (t.vasalYap) {
    if (!barisDevirOzeti(d, karsi, t).tamIlhak) return { gecerli: false, neden: "Vasal yapmak için düşmanın bütün kalan arazi ve şehirlerini talep etmelisiniz (tam ilhak düzeyinde)." };
    if (vasalMi(d, karsi)) return { gecerli: false, neden: `${d.devletler[karsi].ad} zaten başka bir devletin vasalı.` };
    if (vasalMi(d, devlet) && efendisi(d, devlet) === karsi) return { gecerli: false, neden: "Kendi efendinizi vasal yapamazsınız." };
  }
  return { gecerli: true };
}

function baskentleriGuncelle(d: DunyaDurumu): void {
  d.devletler.forEach((v, devlet) => {
    if (v.baskent !== null && d.sehirler[v.baskent]?.devlet === devlet) return;
    const aday = d.sehirler.map((s, i) => ({ s, i })).filter(({ s }) => s.devlet === devlet)
      .sort((a, b) => b.s.nufus - a.s.nufus || a.i - b.i);
    v.baskent = aday[0]?.i ?? null;
  });
  d.sehirler.forEach((s, i) => { s.baskent = d.devletler[s.devlet].baskent === i; });
}

/** Yalnızca doğrulanmış talep için, turun başında. İsteğe bağlı tazminat eksi hazine yaratamaz. */
export function barisiUygula(d: DunyaDurumu, b: Baglam, t: BarisTalebi, devlet = d.ayarlar.oyuncu): void {
  const s = d.savaslar.find((v) => v.id === t.savas)!;
  const karsi = s.saldiran === devlet ? s.savunan : s.saldiran;
  const taraflar = [devlet, karsi];
  if (t.vasalYap) {
    vasalKur(d, devlet, karsi);
  } else {
    for (const i of t.birimler) d.birimler[i].sahip = devlet;
    for (const i of t.sehirler) {
      d.sehirler[i].devlet = devlet;
      d.sehirler[i].istikrar.fetihGun = d.gun;
      d.sehirler[i].istikrar.bagis = 0;
    }
  }
  savasiSonlandir(d, s);
  // Turun ilk günlük muharebe adımından önce üçüncü devletlerle biten savaşlar da temizlenir.
  yikilanDevletleriTemizle(d);
  // Kaybedilen şehirlerde devam eden toplama iptal edilir; harcanmış havuz/paralar yeniden kullanılmaz.
  d.askerToplamalar = d.askerToplamalar.filter((a) => d.sehirler[a.sehir].devlet === a.devlet);
  d.devletler[karsi].hazine -= t.tazminat;
  d.devletler[devlet].hazine += t.tazminat;
  baskentleriGuncelle(d);

  // Yeni sınır dışında kalan ordular eski savaşın erişimini sadece dönüş rotası için kullanır.
  // Konum anında değişmez; rota sıradan günlük yürüyüşle tamamlanır. Geçiş hakkı verilmez.
  if (b.ag) {
    const ag = b.ag, donus = { ...d, savaslar: [...d.savaslar, s] };
    for (const o of d.ordular.filter((a) => taraflar.includes(a.devlet))) {
      const birim = ag.dugumler[o.dugum]?.b;
      if (birim === undefined) continue;
      const disarida = taraflar.includes(d.birimler[birim].sahip) && d.birimler[birim].sahip !== o.devlet;
      const rotaYasak = o.rota.some((a) => !gecilebilir(d, ag, a.d, o.devlet));
      if (!disarida && !rotaYasak) continue;
      const konum = orduKonumu(o);
      o.x = konum.x; o.y = konum.y; o.rota = []; o.ilerleme = 0; o.hedef = null; o.cekiliyor = false;
      if (!disarida || o.muharebe !== null) continue;
      const adaylar = ag.dugumler.map((n, i) => ({ n, i })).filter(({ n }) => {
        const a = d.birimler[n.b]; return a.sahip === o.devlet && a.kontrol === o.devlet;
      }).sort((a, c) => {
        const uzaklik = (n: typeof a.n) => Math.abs(n.x - konum.x) + Math.abs(n.y - konum.y);
        return uzaklik(a.n) - uzaklik(c.n) || a.i - c.i;
      });
      for (const { n, i } of adaylar) {
        const r = rotaBul(donus, ag, o, { x: n.x, y: n.y, dugum: i });
        if (!r.gecerli) continue;
        o.rota = r.adimlar; o.cekiliyor = r.adimlar.length > 0;
        olayEkle(d, { tur: "baris-donus", devlet: o.devlet, metin: `${o.ad} barış sonrası kendi toprağına dönüyor (${r.gun} gün).` });
        break;
      }
    }
  }
  // Ateşkes: AI bu ikiliye bir süre savaş açmaz; savaşa ait bekleyen teklifler düşer (6c)
  d.ateskesler = d.ateskesler.filter((a) => !(a.a === Math.min(devlet, karsi) && a.b === Math.max(devlet, karsi)));
  d.ateskesler.push({ a: Math.min(devlet, karsi), b: Math.max(devlet, karsi), bitis: d.gun + DENGE.ATESKES_GUN });
  d.barisTeklifleri = d.barisTeklifleri.filter((x) => x.savas !== t.savas);
  d.barislar.push({ savas: t.savas, tazminat: t.tazminat, birimler: [...t.birimler], sehirler: [...t.sehirler], gun: d.gun, devlet, karsi });
  if (d.barislar.length > DENGE.BARIS_GECMISI_SINIRI) d.barislar.shift();
  // İki AI arasındaki barış herkesin bildiği bir dünya haberidir (devlet: null)
  const oyuncu = d.ayarlar.oyuncu;
  const devir = t.vasalYap
    ? `${d.devletler[karsi].ad} ${d.devletler[devlet].ad}'nın vasalı oldu (toprağı kaldı, aylık vergi ödeyecek)`
    : `${t.birimler.length} arazi, ${t.sehirler.length} şehir ${d.devletler[devlet].ad}'na geçti`;
  olayEkle(d, { tur: "baris", devlet: taraflar.includes(oyuncu) ? oyuncu : null,
    metin: !taraflar.includes(oyuncu)
      ? `${d.devletler[devlet].ad} ile ${d.devletler[karsi].ad} barış yaptı: ${devir}.`
      : devlet !== oyuncu
        ? `${d.devletler[devlet].ad} ile barış yapıldı: ${devir}, ${t.tazminat} tazminat.`
        : `${d.devletler[karsi].ad} ile barış yapıldı: ${devir}, ${t.tazminat} tazminat.${t.vasalYap ? "" : " Talep edilmeyen işgaller kaldırıldı."}` });
}
