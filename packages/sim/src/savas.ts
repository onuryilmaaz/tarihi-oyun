// Savaş, görünürlük ve muharebe (TASK-0007 / 4a, DEC-0027).
// Tüm hesaplar tam sayı ve tohumlu rastgelelikle yapılır; aynı durum aynı sonucu verir (MASTER_SPEC §8.5).

import { olayEkle, type DunyaDurumu, type Muharebe, type MuharebeRaporu, type OrduDurumu } from "./durum";
import { DENGE } from "./denge";
import { rotaBul, type HareketAgi } from "./hareket";
import { aralik } from "./rastgele";
import { etkiCarpani, istihbaratEtkisi, istihbaratVar } from "./casusluk";
import { muharebeGucYuzde } from "./teknoloji";
import { kompozisyonCikar, kompozisyonOransalAl } from "./birim";

/** Binlik ayırıcılı sayı (ortamdan bağımsız; toLocaleString simülasyonda yasak) */
export function sayiMetni(n: number): string {
  const s = String(Math.abs(Math.trunc(n)));
  let r = "";
  for (let i = 0; i < s.length; i++) r += (i && (s.length - i) % 3 === 0 ? "." : "") + s[i];
  return (n < 0 ? "−" : "") + r;
}

export const savasta = (d: DunyaDurumu, a: number, b: number) =>
  a !== b && d.savaslar.some((s) => (s.saldiran === a && s.savunan === b) || (s.saldiran === b && s.savunan === a));

// --- Görünürlük (DEC-0027/2, AT-013) ---------------------------------------------------------------

/** Devletin gördüğü düğümler: kendi (yasal ya da askerî) toprakları + komşuları + ordularının çevresi. */
export function gorunurDugumler(d: DunyaDurumu, ag: HareketAgi, devlet: number): Set<number> {
  const gorunur = new Set<number>();
  const komsular = (u: number) => ag.komsu[u].map((ki) => (ag.kenarlar[ki].a === u ? ag.kenarlar[ki].b : ag.kenarlar[ki].a));
  ag.dugumler.forEach((n, u) => {
    const b = d.birimler[n.b];
    if (b && (b.sahip === devlet || b.kontrol === devlet)) {
      gorunur.add(u);
      for (const v of komsular(u)) gorunur.add(v);
    }
  });
  for (const o of d.ordular) {
    if (o.devlet !== devlet) continue;
    let sinir = [o.dugum];
    gorunur.add(o.dugum);
    for (let adim = 0; adim < DENGE.GORUS_DUGUM; adim++) {
      const yeni: number[] = [];
      for (const u of sinir) for (const v of komsular(u)) if (!gorunur.has(v)) { gorunur.add(v); yeni.push(v); }
      sinir = yeni;
    }
  }
  return gorunur;
}

/** Görülen ordunun büyüklüğü: kesin sayı yerine yuvarlanmış tahmin. */
export const yaklasikAsker = (n: number) => (n < 5000 ? Math.max(1000, Math.round(n / 1000) * 1000) : Math.round(n / 5000) * 5000);

export interface YabanciOrdu {
  id: number;
  ad: string;
  devlet: number;
  dugum: number;
  x: number;
  y: number;
  yaklasikAsker: number; // kesin asker sayısı bilinçli olarak yoktur (askerî istihbarat varsa kesin, 8c)
  muharebede: boolean;
  kesin: boolean; // askerî istihbaratla bilinen kesin sayı
}

/** Oyuncuya gösterilebilecek yabancı ordular (görünmeyenler hiç gönderilmez). */
export function gorunurYabanciOrdular(d: DunyaDurumu, ag: HareketAgi, devlet: number): YabanciOrdu[] {
  const g = gorunurDugumler(d, ag, devlet);
  // Askerî istihbarat (8c): hedefin bütün orduları görünür ve sayıları kesindir
  return d.ordular.filter((o) => o.devlet !== devlet && (g.has(o.dugum) || istihbaratVar(d, devlet, o.devlet, "askeri"))).map((o) => {
    const etki = istihbaratEtkisi(d, devlet, o.devlet, "askeri");
    // Yanlış bilgi (TASK-0018, 3/3): oyuncu "kesin" etiketli ama çarpıtılmış bir sayı görür; bunu bilemez.
    return { id: o.id, ad: o.ad, devlet: o.devlet, dugum: o.dugum, x: o.x, y: o.y,
      yaklasikAsker: etki ? Math.max(0, Math.round((o.asker * etkiCarpani(etki)) / 1000)) : yaklasikAsker(o.asker),
      muharebede: o.muharebe !== null, kesin: !!etki };
  });
}

// --- Muharebe ---------------------------------------------------------------------------------

const orduBul = (d: DunyaDurumu, id: number) => d.ordular.find((o) => o.id === id);
const tarafOrdulari = (d: DunyaDurumu, ids: number[]) => ids.map((id) => orduBul(d, id)).filter((o): o is OrduDurumu => !!o);
const toplamAsker = (ordular: OrduDurumu[]) => ordular.reduce((s, o) => s + o.asker, 0);
/** Askere göre ağırlıklı ortalama moral (binde) */
const ortalamaMoral = (ordular: OrduDurumu[]) => {
  const a = toplamAsker(ordular);
  return a ? Math.round(ordular.reduce((s, o) => s + o.asker * o.moral, 0) / a) : 0;
};

/** Günlük temas taraması: savaştaki iki devletin ordusu aynı düğümdeyse muharebe başlar. */
export function muharebeleriBaslat(d: DunyaDurumu): void {
  const dugumdekiler = new Map<number, OrduDurumu[]>();
  for (const o of d.ordular) {
    if (o.cekiliyor) continue; // geri çekilen ordu yeni muharebeye girmez
    if (!dugumdekiler.has(o.dugum)) dugumdekiler.set(o.dugum, []);
    dugumdekiler.get(o.dugum)!.push(o);
  }
  for (const [dugum, ordular] of dugumdekiler) {
    // Devam eden muharebeye katılım
    const mevcut = d.muharebeler.find((m) => m.dugum === dugum);
    if (mevcut) {
      for (const o of ordular) {
        if (o.muharebe !== null) continue;
        const taraf = mevcut.taraflar.find((t) => t.devlet === o.devlet);
        if (taraf) { taraf.ordular.push(o.id); o.muharebe = mevcut.id; }
      }
      continue;
    }
    const serbest = ordular.filter((o) => o.muharebe === null);
    // İlk savaş çifti (sıra deterministik: ordu dizisi sırası)
    let cift: [number, number] | null = null;
    for (const a of serbest) for (const b of serbest) if (!cift && savasta(d, a.devlet, b.devlet)) cift = [a.devlet, b.devlet];
    if (!cift) continue;
    const m: Muharebe = {
      id: d.sonrakiMuharebeId++,
      dugum,
      baslangic: d.gun,
      gun: 0,
      taraflar: cift.map((devlet) => {
        const os = serbest.filter((o) => o.devlet === devlet);
        for (const o of os) o.muharebe = 0; // id aşağıda atanır
        return { devlet, ordular: os.map((o) => o.id), baslangicAsker: toplamAsker(os), kayip: 0, baslangicMoral: ortalamaMoral(os) };
      }) as Muharebe["taraflar"],
    };
    for (const t of m.taraflar) for (const o of tarafOrdulari(d, t.ordular)) o.muharebe = m.id;
    d.muharebeler.push(m);
    const [a, b] = m.taraflar.map((t) => d.devletler[t.devlet].ad);
    if (m.taraflar.some((t) => t.devlet === d.ayarlar.oyuncu) && !d.aktifKesinti) {
      // Oyuncunun muharebesi turu durdurur; kesinti kendi olay kaydını yazar (DEC-0006)
      d.aktifKesinti = { gun: d.gun, neden: `Muharebe başladı: ${a} ile ${b} orduları karşılaştı.` };
    } else {
      olayEkle(d, { tur: "muharebe-basladi", devlet: m.taraflar[0].devlet, metin: `Muharebe başladı: ${a} ile ${b}.` });
    }
  }
}

/** Kayıpları ordular arasında asker sayısına göre paylaştır (tam sayı; artan son orduya). */
function kayipDagit(ordular: OrduDurumu[], kayip: number): void {
  const toplam = toplamAsker(ordular);
  let kalan = Math.min(kayip, toplam);
  ordular.forEach((o, i) => {
    const pay = i === ordular.length - 1 ? kalan : Math.min(kalan, Math.floor((kayip * o.asker) / Math.max(1, toplam)));
    o.kompozisyon = kompozisyonCikar(o.kompozisyon, kompozisyonOransalAl(o.kompozisyon, pay)); // TASK-0019
    o.asker -= pay;
    kalan -= pay;
  });
}

export interface GunlukSonuc { kayip: [number, number]; guc: [number, number] }

/**
 * Bir muharebe günü (saf hesap; test edilebilir). Güç = asker × moral × (savunana arazi bonusu).
 * zorluk: muharebe düğümünün arazi zorluğu (%); savunan: 0 ya da 1 (toprağın kontrolü kimdeyse), yoksa -1.
 */
export function muharebeGunu(asker: [number, number], moral: [number, number], zorluk: number, savunan: number,
  sans: [number, number], gucYuzde: [number, number] = [100, 100]): GunlukSonuc {
  const arazi = (i: number) => (i === savunan ? 100 + Math.floor((zorluk - 100) / 2) : 100);
  const guc = [0, 1].map((i) => Math.floor((asker[i] * moral[i] * arazi(i) * gucYuzde[i]) / 10000000)) as [number, number];
  const kayip = [0, 1].map((i) => Math.min(asker[i], Math.round((guc[1 - i] * DENGE.KAYIP_YUZDE * sans[i]) / 10000))) as [number, number];
  return { kayip, guc };
}

/** Geri çekilme hedefi: en yakın (adım sayısıyla) kendi şehri; yoksa kendi kontrolündeki herhangi bir düğüm. */
function cekilmeHedefi(d: DunyaDurumu, ag: HareketAgi, o: OrduDurumu, haric: number): number {
  const sehirDugumu = new Set(d.sehirler.filter((s) => s.kontrol === o.devlet && s.dugum >= 0).map((s) => s.dugum));
  const kendi = (u: number) => d.birimler[ag.dugumler[u].b]?.kontrol === o.devlet;
  const gorulen = new Set([o.dugum]);
  let sinir = [o.dugum];
  let yedek = -1;
  for (let adim = 0; adim < 40 && sinir.length; adim++) {
    const yeni: number[] = [];
    for (const u of sinir) {
      for (const ki of ag.komsu[u]) {
        const k = ag.kenarlar[ki];
        const v = k.a === u ? k.b : k.a;
        if (gorulen.has(v)) continue;
        gorulen.add(v);
        if (v === haric) continue;
        if (sehirDugumu.has(v)) return v;
        if (yedek < 0 && kendi(v)) yedek = v;
        yeni.push(v);
      }
    }
    sinir = yeni;
  }
  return yedek;
}

function muharebeyiBitir(d: DunyaDurumu, ag: HareketAgi | null, m: Muharebe, kaybeden: number, nedenler: string[]): void {
  const kazanan = 1 - kaybeden;
  const sonuc: MuharebeRaporu["taraflar"] = [] as unknown as MuharebeRaporu["taraflar"];
  const kazananOrdular = tarafOrdulari(d, m.taraflar[kazanan].ordular);
  const kaybedenOrdular = tarafOrdulari(d, m.taraflar[kaybeden].ordular);
  // Takip: kaybeden ek kayıp verir (MASTER_SPEC §8.6)
  const takip = Math.floor((toplamAsker(kaybedenOrdular) * (DENGE.TAKIP_KAYIP_ALT + aralik(d, DENGE.TAKIP_KAYIP_UST - DENGE.TAKIP_KAYIP_ALT + 1))) / 100);
  kayipDagit(kaybedenOrdular, takip);
  m.taraflar[kaybeden].kayip += takip;
  if (takip) nedenler.push(`Takip: geri çekilen taraf ${sayiMetni(takip)} ek kayıp verdi.`);
  for (const o of kazananOrdular) { o.moral = Math.min(DENGE.MORAL_EN_YUKSEK, o.moral + DENGE.ZAFER_MORALI); o.muharebe = null; }
  const dagilan: string[] = [];
  for (const o of kaybedenOrdular) {
    o.muharebe = null;
    const hedef = ag ? cekilmeHedefi(d, ag, o, m.dugum) : -1;
    const rota = hedef >= 0 && ag ? rotaBul(d, ag, { ...o, rota: [], ilerleme: 0 }, { x: ag.dugumler[hedef].x, y: ag.dugumler[hedef].y, dugum: hedef }) : null;
    const baslangic = m.taraflar[kaybeden].baslangicAsker;
    if (o.asker * 100 < baslangic * DENGE.DAGILMA_ORANI || o.moral <= 0 || !rota || !rota.gecerli) {
      dagilan.push(o.ad);
      o.asker = 0;
      o.kompozisyon = { piyade: 0, okcu: 0, suvari: 0 }; // TASK-0019
      continue;
    }
    o.rota = rota.adimlar;
    o.ilerleme = 0;
    o.hedef = null;
    o.cekiliyor = true;
  }
  if (dagilan.length) nedenler.push(`Dağılan: ${dagilan.join(", ")} (moral çöktü ya da çekilecek yer kalmadı).`);
  d.ordular = d.ordular.filter((o) => o.asker > 0);

  for (const i of [0, 1]) {
    const t = m.taraflar[i];
    const os = tarafOrdulari(d, t.ordular);
    sonuc.push({
      devlet: t.devlet,
      ordular: t.ordular.map((id) => orduBul(d, id)?.ad ?? "(dağıldı)"),
      baslangicAsker: t.baslangicAsker,
      kayip: t.kayip,
      moralBas: t.baslangicMoral,
      moralSon: ortalamaMoral(os),
      sonuc: i === kazanan ? "zafer" : os.length ? "geri-cekildi" : "dagildi",
    });
  }
  const rapor: MuharebeRaporu = {
    id: m.id, dugum: m.dugum, birim: ag ? ag.dugumler[m.dugum].b : -1, baslangic: m.baslangic, bitis: d.gun,
    kazanan: m.taraflar[kazanan].devlet, taraflar: sonuc, nedenler,
  };
  d.muharebeRaporlari.push(rapor);
  if (d.muharebeRaporlari.length > 30) d.muharebeRaporlari.shift();
  d.muharebeler = d.muharebeler.filter((x) => x !== m);
  olayEkle(d, { tur: "muharebe-bitti", devlet: rapor.kazanan,
    metin: `Muharebe bitti: ${d.devletler[rapor.kazanan].ad} kazandı (${sayiMetni(sonuc[kazanan].kayip)} kayıp; karşı taraf ${sayiMetni(sonuc[kaybeden].kayip)}).` });
}

/** Her gün: devam eden muharebelerin bir günü. */
export function muharebeGunleri(d: DunyaDurumu, ag: HareketAgi | null): void {
  for (const m of [...d.muharebeler]) {
    const os = m.taraflar.map((t) => tarafOrdulari(d, t.ordular));
    if (!os[0].length || !os[1].length) { // taraflardan biri başka yolla yok olduysa
      muharebeyiBitir(d, ag, m, os[0].length ? 1 : 0, ["Karşı taraf sahada kalmadı."]);
      continue;
    }
    m.gun++;
    const asker = os.map(toplamAsker) as [number, number];
    const moral = os.map(ortalamaMoral) as [number, number];
    const n = ag?.dugumler[m.dugum];
    const zorluk = n?.z ?? 100;
    const kontrol = n ? d.birimler[n.b]?.kontrol ?? -1 : -1;
    const savunan = m.taraflar.findIndex((t) => t.devlet === kontrol);
    const sans = [0, 1].map(() => DENGE.SANS_ALT + aralik(d, DENGE.SANS_UST - DENGE.SANS_ALT + 1)) as [number, number];
    const gucYuzde = m.taraflar.map((t) => muharebeGucYuzde(d, t.devlet)) as [number, number]; // Daimî Ordu (5c)
    const g = muharebeGunu(asker, moral, zorluk, savunan, sans, gucYuzde);
    for (const i of [0, 1]) {
      kayipDagit(os[i], g.kayip[i]);
      m.taraflar[i].kayip += g.kayip[i];
      const kayipBinde = Math.round((g.kayip[i] * DENGE.MORAL_KAYIP_CARPANI) / Math.max(1, asker[i]));
      for (const o of os[i]) o.moral = Math.max(0, o.moral - kayipBinde - DENGE.MORAL_YORGUNLUK);
    }
    // Sonuç: moral eşiği (tutum) aşılan ya da asker kalmayan taraf çekilir; eşitlikte daha düşük moralli
    const yeniMoral = os.map(ortalamaMoral);
    const esik = os.map((ordular) => Math.max(...ordular.map((o) => DENGE.GERI_CEKILME_ESIGI[o.tutum])));
    const cokmus = [0, 1].map((i) => toplamAsker(os[i]) === 0 || yeniMoral[i] <= esik[i]);
    const neden = (i: number) => {
      const r: string[] = [];
      const oran = asker[1 - i] / Math.max(1, asker[i]);
      if (oran >= 1.3) r.push(`Sayı üstünlüğü: ${d.devletler[m.taraflar[1 - i].devlet].ad} ${oran.toFixed(1).replace(".", ",")} kat kalabalıktı.`);
      if (savunan === 1 - i && zorluk > 110) r.push(`Savunan arazi avantajı: zorluk %${zorluk} (savunma gücü ×${((100 + Math.floor((zorluk - 100) / 2)) / 100).toFixed(2).replace(".", ",")}).`);
      if (moral[1 - i] - moral[i] >= 150) r.push(`Moral farkı: %${Math.round(moral[1 - i] / 10)} karşısında %${Math.round(moral[i] / 10)}.`);
      return r;
    };
    if (cokmus[0] || cokmus[1]) {
      const kaybeden = cokmus[0] && cokmus[1] ? (yeniMoral[0] <= yeniMoral[1] ? 0 : 1) : cokmus[0] ? 0 : 1;
      muharebeyiBitir(d, ag, m, kaybeden, [...neden(kaybeden),
        `${d.devletler[m.taraflar[kaybeden].devlet].ad} tarafının morali geri çekilme eşiğinin altına düştü (%${Math.round(yeniMoral[kaybeden] / 10)}).`]);
    } else if (m.gun >= DENGE.MUHAREBE_EN_UZUN_GUN) {
      // Süre doldu: başlangıç gücüne göre daha çok yıpranan taraf çekilir (eşitlikte saldıran)
      const yipranma = [0, 1].map((i) => (m.taraflar[i].kayip * 1000) / Math.max(1, m.taraflar[i].baslangicAsker));
      const kaybeden = yipranma[0] === yipranma[1] ? (savunan === 0 ? 1 : 0) : yipranma[0] > yipranma[1] ? 0 : 1;
      muharebeyiBitir(d, ag, m, kaybeden, [...neden(kaybeden), `${DENGE.MUHAREBE_EN_UZUN_GUN} gün sonunda daha çok yıpranan taraf çekildi.`]);
    }
  }
}

/** Moral toparlanması: muharebede olmayan ordular. */
export function moralToparla(d: DunyaDurumu, ag: HareketAgi | null): void {
  for (const o of d.ordular) {
    if (o.muharebe !== null || o.moral >= DENGE.MORAL_EN_YUKSEK || d.devletler[o.devlet].hazine < 0) continue;
    const kendi = ag ? d.birimler[ag.dugumler[o.dugum].b]?.kontrol === o.devlet : true;
    if (!kendi) continue; // ikmal ve yabancı toprak etkisi 4b'de
    o.moral = Math.min(DENGE.MORAL_EN_YUKSEK, o.moral + (o.rota.length ? DENGE.MORAL_TOPARLANMA_YURUYUS : DENGE.MORAL_TOPARLANMA_KENDI));
  }
}
