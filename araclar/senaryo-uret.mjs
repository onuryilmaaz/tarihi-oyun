// v0.2 harita verisinden 1453 senaryosunu üretir (TASK-0005).
//   girdi : prototypes/harita-gorsel-02/public/veri/dunya-1453-v02.json, wikidata-1453.json
//   çıktı : veri/senaryo-1453/harita.json  (harita geometrisi, istemci çizer)
//           veri/senaryo-1453/senaryo.json (simülasyon başlangıç verisi + hareket ağı)
//   ek girdi: veri-ham/etopo2022-0.2deg.csv (NOAA ETOPO 2022, kamu malı; depoda değil — README)
//           veri/senaryo-1453/wikidata.json
// Çalıştırma: npm run senaryo

import fs from "node:fs";
import crypto from "node:crypto";
import { agUret, etopoOku } from "./ag-uret.mjs";
import { bolgeleriUret } from "./bolge-uret.mjs";
import { sehirleriSec } from "./sehir-sec.mjs";
import { birimleriBirlestir } from "./birim-birlestir.mjs";
import { denizAlanlariUret } from "./deniz-alan-uret.mjs";

const kok = new URL("../", import.meta.url);
const kaynak = new URL("prototypes/harita-gorsel-02/public/veri/", kok);
const hedef = new URL("veri/senaryo-1453/", kok);
fs.mkdirSync(hedef, { recursive: true });

// TASK-0023: sınır kırıntıları aynı devletin komşu birimine katılır (birim-birlestir.mjs)
const { harita: kirintisiz } = birimleriBirlestir(JSON.parse(fs.readFileSync(new URL("dunya-1453-v02.json", kaynak), "utf8")));
// TASK-0024: devletlerin içi modern iller yerine araziye göre yeniden bölünür (bolge-uret.mjs); ardından
// kesişimde doğan küçük kopuk parçalar yine aynı devletin komşusuna katılır
// TASK-0025 pilot: Anadolu + Balkanlar'da şehir listesi Wikidata adaylarıyla genişler, toprak şehirlere bölünür
const { harita: sehirli, pilot, rapor: sehirRaporu } = sehirleriSec(kirintisiz, JSON.parse(fs.readFileSync(new URL("sehirler-wikidata.json", hedef), "utf8")),
  JSON.parse(fs.readFileSync(new URL("sehir-haric.json", hedef), "utf8")).adlar,
  JSON.parse(fs.readFileSync(new URL("sehir-ek.json", hedef), "utf8")).sehirler,
  JSON.parse(fs.readFileSync(new URL("sehir-tarihi-adlar.json", hedef), "utf8")).adlar);
const etopo = etopoOku(new URL("veri-ham/etopo2022-0.2deg.csv", kok));
const { harita: bolgeli, rapor: bolgeRaporu } = bolgeleriUret(sehirli, etopo, { pilot });
const { harita: birlesik, rapor: birlesimRaporu } = birimleriBirlestir(bolgeli);
// TASK-0023: deniz bölgelerinin seçilebilir alanları karadan türetilir (deniz-alan-uret.mjs)
const { alanlar: denizAlanlari, sinirlar: denizSinirlari } = denizAlanlariUret(birlesik, JSON.parse(fs.readFileSync(new URL("deniz.json", hedef), "utf8")));
const harita = { ...birlesik, denizAlanlari, denizSinirlari };
const haritaMetni = JSON.stringify(harita);
const { ag, rapor, dugumBul } = agUret(harita, new URL("veri-ham/etopo2022-0.2deg.csv", kok));
const surum = crypto.createHash("sha256").update(haritaMetni).update(JSON.stringify(ag)).digest("hex").slice(0, 10);
const millerLat = (y) => (2.5 * (Math.atan(Math.exp((y * Math.PI / 180) / 1.25)) - Math.PI / 4)) * 180 / Math.PI;

// Şehirlerin bulunduğu arazi birimi (nokta-poligon, harita koordinatlarında)
const arklar = harita.arklar;
const halka = (refs) => {
  const out = [];
  refs.forEach((r, k) => {
    const a = arklar[r < 0 ? ~r : r];
    const pts = [];
    for (let i = 0; i < a.length; i += 2) pts.push([a[i], a[i + 1]]);
    if (r < 0) pts.reverse();
    out.push(...(k === 0 ? pts : pts.slice(1)));
  });
  return out;
};
const icinde = (h, x, y) => {
  let ic = false;
  for (let i = 0, j = h.length - 1; i < h.length; j = i++) {
    const [xi, yi] = h[i], [xj, yj] = h[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ic = !ic;
  }
  return ic;
};
const birimHalkalari = harita.birimler.map((b) => b.p.map((poly) => poly.map(halka)));
const birimBul = (x, y) => {
  const i = birimHalkalari.findIndex((polys) =>
    polys.some((poly) => icinde(poly[0], x, y) && !poly.slice(1).some((h) => icinde(h, x, y))));
  if (i >= 0) return i;
  // Sadeleştirilmiş kıyının dışında kalan liman şehirleri: en yakın köşesi olan kara birimi
  let en = -1, enD = Infinity;
  birimHalkalari.forEach((polys, bi) => {
    if (harita.birimler[bi].d < 0) return;
    for (const poly of polys) for (const [px, py] of poly[0]) {
      const dd = (px - x) ** 2 + (py - y) ** 2;
      if (dd < enD) { enD = dd; en = bi; }
    }
  });
  return en;
};

const devletler = harita.devletler.map((d) => ({ id: d.id, ad: d.ad }));
// TASK-0025 şehir bilgileri [TASLAK]: nüfus (tahmin tablosu yoksa günümüz nüfusundan), gelişmişlik, tür, gelir kaynağı
const limanAdlari = new Set(Object.values(JSON.parse(fs.readFileSync(new URL("deniz.json", hedef), "utf8")).limanlar).flat());
const yukseklikBul = (lon, lat) => {
  const i = Math.round((lon - etopo.lon0) / etopo.adim), j = Math.round((lat - etopo.lat0) / etopo.adim);
  return i >= 0 && j >= 0 && i < etopo.nx && j < etopo.ny ? etopo.z[j * etopo.nx + i] : 0;
};
const sehirBilgisi = (s, nufus) => {
  const gelismislik = Math.max(1, Math.min(10, 1 + Math.round((9 * Math.log(nufus / 1500)) / Math.log(100)) + (s.b === 1 ? 1 : 0)));
  const tur = nufus < 8000 ? "kasaba" : nufus < 40000 ? "sehir" : "buyuksehir";
  const gelirKaynagi = limanAdlari.has(s.ad) ? "ticaret" : nufus >= 20000 ? "zanaat"
    : yukseklikBul(s.x, millerLat(s.y)) > 1000 ? "hayvancilik" : "tarim";
  return { tur, gelismislik, gelirKaynagi };
};
const nufusTahmini = (s) => sehirNufuslari[s.ad] ?? (s.nufusGunumuz
  ? Math.max(1500, Math.min(25000, Math.round((12 * Math.sqrt(s.nufusGunumuz)) / 100) * 100))
  : s.b === 1 ? 40000 : 10000);
const sehirNufuslari = JSON.parse(fs.readFileSync(new URL("sehir-nufus.json", hedef), "utf8")).sehirler;
const zorlukToplam = new Map();
for (const n of ag.dugumler) { const a = zorlukToplam.get(n.b) ?? [0, 0]; a[0] += n.z; a[1]++; zorlukToplam.set(n.b, a); }
const verimHesapla = (i) => {
  const a = zorlukToplam.get(i);
  if (!a) return 10;
  const z = a[0] / a[1];
  return z <= 105 ? 12 : z <= 130 ? 10 : z <= 170 ? 9 : 7;
};

const senaryo = {
  id: "1453",
  surum,
  aciklama: "1453 senaryosu (prototip verisi; DEC-0016, DEC-0021, DEC-0022). Nüfus değerleri TEST değeridir.",
  baslangic: { yil: 1453, ay: 4, gun: 1 }, // Konstantiniyye'nin fethinden önce (AT-002)
  varsayilanOyuncu: "osm",
  devletler,
  // Arazi verimi (TASK-0012/9b): birimin hareket ağı düğümlerinin ortalama ETOPO zorluğundan (ova 12 … sarp 7)
  birimler: harita.birimler.map((b, i) => ({ devlet: b.d >= 0 ? harita.devletler[b.d].id : null, verim: verimHesapla(i) })),
  sehirler: harita.sehirler.map((s) => ({
    ad: s.ad,
    devlet: harita.devletler[s.d].id,
    birim: (() => { const i = harita.birimler.findIndex((b) => b.s === s.ad); return i >= 0 ? i : birimBul(s.x, s.y); })(),
    baskent: s.b === 1,
    nufus: nufusTahmini(s), // 1453 tahmini (sehir-nufus.json, 9b); yoksa günümüz nüfusundan (TASK-0025) ya da eski test değeri
    ...sehirBilgisi(s, nufusTahmini(s)),
    ...(s.qid ? { qid: s.qid } : {}),
    ...(s.modernAd ? { modernAd: s.modernAd } : {}), // TASK-0034
    dugum: dugumBul(s.x, millerLat(s.y)), // hareket ağındaki düğüm (ordu konuşlanması, geri çekilme hedefi)
    x: Math.round(s.x * 10000),
    y: Math.round(s.y * 10000),
  })),
  // DEC-0025/4: yalnızca oyuncu devlete 2 test ordusu [TASLAK — asker sayıları test değeri]
  ordular: [["Rumeli Ordusu", "Edirne", 20000], ["Anadolu Ordusu", "Bursa", 12000]].map(([ad, sehirAd, asker]) => {
    const s = harita.sehirler.find((c) => c.ad === sehirAd);
    const dugum = dugumBul(s.x, millerLat(s.y));
    if (dugum < 0) throw new Error(`ordu düğümü bulunamadı: ${sehirAd}`);
    return { ad, devlet: harita.devletler[s.d].id, asker, dugum, x: Math.round(s.x * 10000), y: Math.round(s.y * 10000) };
  }),
  ag,
  // Başlangıç ilişkileri ve ittifakları (TASK-0009/6a): elle tutulan tahmini tablo
  ...(({ iliskiler, ittifaklar }) => ({ iliskiler, ittifaklar }))(JSON.parse(fs.readFileSync(new URL("iliskiler.json", hedef), "utf8"))),
  // 1453 hükümdarları, veraset gelenekleri ve kurgusal ad havuzları (TASK-0010/7a): elle tutulan tahmini tablo
  hukumdarlar: (({ hukumdarlar, veraset, adHavuzu }) => ({ hukumdarlar, veraset, adHavuzu }))(JSON.parse(fs.readFileSync(new URL("hukumdarlar.json", hedef), "utf8"))),
  // 1453 nüfus grupları: din × kültür (TASK-0010/7b): elle tutulan tahmini tablo
  nufus: (({ dinler, dinAileleri, kulturler, devletler, sehirler }) => ({ dinler, dinAileleri, kulturler, devletler, sehirler }))(JSON.parse(fs.readFileSync(new URL("nufus.json", hedef), "utf8"))),
  // Deniz bölgeleri, limanlar, boğazlar ve başlangıç donanmaları (TASK-0011/8a): elle tutulan tahmini tablo
  deniz: (({ bolgeler, limanlar, bogazlar, donanmalar }) => ({ bolgeler, limanlar, bogazlar, donanmalar }))(JSON.parse(fs.readFileSync(new URL("deniz.json", hedef), "utf8"))),
};

fs.writeFileSync(new URL("harita.json", hedef), haritaMetni);
// TASK-0029: Osmanlı sancakları — her Osmanlı şehri kendi kıtasındaki en yakın sancak merkezine bağlanır (sancaklar.json)
{
  const v = JSON.parse(fs.readFileSync(new URL("sancaklar.json", hedef), "utf8"));
  const enlem = (c) => millerLat(c.y / 1e4), boylam = (c) => c.x / 1e4;
  // Boğazlar ve Ege hattı: Avrupa yakası (Rumeli) mi
  const avrupada = (c) => boylam(c) < 26.2 || (enlem(c) >= 40.6 && boylam(c) < 29.05) || (enlem(c) >= 40.4 && boylam(c) < 26.8);
  const kita = Object.fromEntries(v.eyaletler.map((e) => [e.id, e.kita]));
  const adIndeks = new Map(senaryo.sehirler.map((c, i) => [c.ad, i]));
  const sancaklar = v.sancaklar.filter((s) => {
    const m = adIndeks.get(s.merkez);
    if (m === undefined || senaryo.sehirler[m].devlet !== v.devlet) { console.warn("sancak merkezi bulunamadı:", s.ad, s.merkez); return false; }
    return true;
  }).map((s) => ({ ...s, sehirler: [] }));
  const km = (a, b) => Math.hypot((boylam(a) - boylam(b)) * Math.cos((enlem(a) * Math.PI) / 180), enlem(a) - enlem(b));
  for (const c of senaryo.sehirler) {
    if (c.devlet !== v.devlet) continue;
    const yaka = avrupada(c) ? "avrupa" : "asya";
    const adaylar = sancaklar.filter((s) => kita[s.eyalet] === yaka);
    const en = (adaylar.length ? adaylar : sancaklar).reduce((a, s) => (km(c, senaryo.sehirler[adIndeks.get(s.merkez)]) < km(c, senaryo.sehirler[adIndeks.get(a.merkez)]) ? s : a));
    en.sehirler.push(c.ad);
  }
  senaryo.sancaklar = [{ devlet: v.devlet, eyaletler: v.eyaletler.map(({ id, ad, merkez }) => ({ id, ad, merkez })), sancaklar }];
  console.log("sancaklar:", sancaklar.map((s) => `${s.ad}:${s.sehirler.length}`).join(" "));

  // TASK-0033: diğer devletler (6+ şehir) için idari birimler otomatik: şehirler yakınlığa göre ~5'erli kümelere,
  // büyük devletlerde (40+ şehir) kümeler de üst birimlere toplanır. Merkez en kalabalık şehir; adlar ve unvanlar
  // simde devletin ad havuzuna göre verilir (sancak/kontluk/voyvodalık/vilayet…).
  const kumele = (ogeler, k) => { // ogeler: { c (şehir), agirlik }[]; tohumlar en ağır öğeler; 8 tur
    let merkezler = [...ogeler].sort((a, b) => b.agirlik - a.agirlik || a.i - b.i).slice(0, k).map((o) => o.c);
    let atama = [];
    for (let tur = 0; tur < 8; tur++) {
      atama = ogeler.map((o) => merkezler.reduce((en, m, j) => (km(o.c, m) < km(o.c, merkezler[en]) ? j : en), 0));
      merkezler = merkezler.map((m, j) => {
        const uye = ogeler.filter((_, t) => atama[t] === j);
        if (!uye.length) return m;
        const ox = uye.reduce((t, o) => t + boylam(o.c), 0) / uye.length, oy = uye.reduce((t, o) => t + enlem(o.c), 0) / uye.length;
        return uye.reduce((en, o) => (Math.hypot(boylam(o.c) - ox, enlem(o.c) - oy) < Math.hypot(boylam(en.c) - ox, enlem(en.c) - oy) ? o : en)).c;
      });
    }
    return merkezler.map((_, j) => ogeler.filter((_, t) => atama[t] === j)).filter((l) => l.length);
  };
  let otomatik = 0;
  for (const dv of senaryo.devletler) {
    if (dv.id === v.devlet) continue;
    const sehirler = senaryo.sehirler.map((c, i) => ({ c, i, agirlik: c.nufus + (c.baskent ? 1e9 : 0) })).filter((o) => o.c.devlet === dv.id);
    if (sehirler.length < 6) continue;
    const kumeler = kumele(sehirler, Math.max(2, Math.round(sehirler.length / 5)));
    const sn = kumeler.map((uye) => {
      const merkez = [...uye].sort((a, b) => b.agirlik - a.agirlik || a.i - b.i)[0];
      return { merkez, uye, agirlik: uye.reduce((t, o) => t + o.c.nufus, 0) + (merkez.c.baskent ? 1e9 : 0) };
    });
    const ust = sehirler.length >= 40
      ? kumele(sn.map((x, i) => ({ c: x.merkez.c, i, agirlik: x.agirlik, x })), Math.max(2, Math.round(sn.length / 6))).map((l) => l.map((o) => o.x))
      : [sn];
    const eyaletler = ust.map((liste, j) => {
      const m = [...liste].sort((a, b) => b.agirlik - a.agirlik)[0].merkez.c;
      return { id: `${dv.id}-${j}`, ad: m.ad, merkez: m.ad, liste };
    });
    senaryo.sancaklar.push({
      devlet: dv.id,
      eyaletler: eyaletler.map(({ id, ad, merkez }) => ({ id, ad, merkez })),
      sancaklar: eyaletler.flatMap((e) => e.liste.map((x) => ({ ad: x.merkez.c.ad, eyalet: e.id, merkez: x.merkez.c.ad, sehirler: x.uye.map((o) => o.c.ad) }))),
    });
    otomatik++;
  }
  console.log("otomatik idari birim:", otomatik, "devlet,", senaryo.sancaklar.slice(1).reduce((t, x) => t + x.sancaklar.length, 0), "birim");
}

// TASK-0028: toprağı denize değen ve kıyıya yakın şehirler liman olur. Kıyı = tek bir birimin kullandığı yay; deniz
// alanları kıyıda karanın altına taştığı için kıyı noktası hangi deniz alanının içindeyse şehir o denize açılır.
// deniz.json'daki elle tutulan limanlar önceliklidir.
{
  const LIMAN_KIYI_UZAK = 0.35; // derece (≈ 35 km): şehir kıyıdan bu kadar uzaksa liman sayılmaz
  const kullanim = new Map();
  for (const b of harita.birimler) for (const r of b.p.flat(2)) { const k = r < 0 ? ~r : r; kullanim.set(k, (kullanim.get(k) ?? 0) + 1); }
  const denizler = harita.denizAlanlari.map((z) => {
    const polys = z.p;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const poly of polys) for (let i = 0; i < poly[0].length; i += 2) { x0 = Math.min(x0, poly[0][i]); x1 = Math.max(x1, poly[0][i]); y0 = Math.min(y0, poly[0][i + 1]); y1 = Math.max(y1, poly[0][i + 1]); }
    return { id: z.id, polys, kutu: [x0, y0, x1, y1] };
  });
  const icindeDuz = (h, x, y) => {
    let ic = false;
    for (let i = 0, j = h.length - 2; i < h.length; j = i, i += 2) {
      const xi = h[i], yi = h[i + 1], xj = h[j], yj = h[j + 1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ic = !ic;
    }
    return ic;
  };
  const denizBul = (x, y) => denizler.find((z) => x >= z.kutu[0] && x <= z.kutu[2] && y >= z.kutu[1] && y <= z.kutu[3]
    && z.polys.some((poly) => icindeDuz(poly[0], x, y) && !poly.slice(1).some((h) => icindeDuz(h, x, y))))?.id;
  const elle = new Set(Object.values(senaryo.deniz.limanlar).flat());
  let yeni = 0;
  senaryo.sehirler.forEach((c, i) => {
    if (elle.has(c.ad) || c.birim < 0) return;
    const sx = c.x / 1e4, sy = c.y / 1e4, oy = new Map();
    let enYakin = Infinity;
    for (const poly of harita.birimler[c.birim].p) for (const ring of poly) for (const r of ring) {
      const k = r < 0 ? ~r : r;
      if (kullanim.get(k) !== 1) continue; // komşu birimle paylaşılan yay kıyı değildir
      const a = harita.arklar[k];
      for (let j = 0; j < a.length; j += 4) { // her ikinci nokta yeterli
        enYakin = Math.min(enYakin, Math.hypot(a[j] - sx, a[j + 1] - sy));
        const z = denizBul(a[j], a[j + 1]);
        if (z) oy.set(z, (oy.get(z) ?? 0) + 1);
      }
    }
    const [z, n] = [...oy].sort((p, q) => q[1] - p[1])[0] ?? [];
    if (!z || n < 3 || enYakin > LIMAN_KIYI_UZAK) return;
    (senaryo.deniz.limanlar[z] ??= []).push(c.ad);
    limanAdlari.add(c.ad);
    Object.assign(c, sehirBilgisi(harita.sehirler[i], c.nufus)); // liman artık ticaret geliri kaynağı
    yeni++;
  });
  console.log("limanlar:", { elle: elle.size, yeni });
}
fs.writeFileSync(new URL("senaryo.json", hedef), JSON.stringify(senaryo));
fs.copyFileSync(new URL("wikidata-1453.json", kaynak), new URL("wikidata.json", hedef));
const birimsiz = senaryo.sehirler.filter((s) => s.birim < 0).map((s) => s.ad);
console.log("şehir seçimi:", sehirRaporu);
console.log("bölge üretimi:", bolgeRaporu);
console.log("birim birleştirme:", birlesimRaporu);
console.log("hareket ağı:", rapor);
console.log({ surum, devlet: devletler.length, birim: senaryo.birimler.length, sehir: senaryo.sehirler.length, birimsizSehir: birimsiz });
