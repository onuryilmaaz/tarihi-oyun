// v0.2 harita verisinden 1453 senaryosunu üretir (TASK-0005).
//   girdi : prototypes/harita-gorsel-02/public/veri/dunya-1453-v02.json, wikidata-1453.json
//   çıktı : veri/senaryo-1453/harita.json  (harita geometrisi, istemci çizer)
//           veri/senaryo-1453/senaryo.json (simülasyon başlangıç verisi + hareket ağı)
//   ek girdi: veri-ham/etopo2022-0.2deg.csv (NOAA ETOPO 2022, kamu malı; depoda değil — README)
//           veri/senaryo-1453/wikidata.json
// Çalıştırma: npm run senaryo

import fs from "node:fs";
import crypto from "node:crypto";
import { agUret } from "./ag-uret.mjs";

const kok = new URL("../", import.meta.url);
const kaynak = new URL("prototypes/harita-gorsel-02/public/veri/", kok);
const hedef = new URL("veri/senaryo-1453/", kok);
fs.mkdirSync(hedef, { recursive: true });

const haritaMetni = fs.readFileSync(new URL("dunya-1453-v02.json", kaynak), "utf8");
const harita = JSON.parse(haritaMetni);
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
const senaryo = {
  id: "1453",
  surum,
  aciklama: "1453 senaryosu (prototip verisi; DEC-0016, DEC-0021, DEC-0022). Nüfus değerleri TEST değeridir.",
  baslangic: { yil: 1453, ay: 4, gun: 1 }, // Konstantiniyye'nin fethinden önce (AT-002)
  varsayilanOyuncu: "osm",
  devletler,
  birimler: harita.birimler.map((b) => ({ devlet: b.d >= 0 ? harita.devletler[b.d].id : null })),
  sehirler: harita.sehirler.map((s) => ({
    ad: s.ad,
    devlet: harita.devletler[s.d].id,
    birim: birimBul(s.x, s.y),
    baskent: s.b === 1,
    nufus: s.b === 1 ? 40000 : 10000, // [TASLAK — test değeri] gerçek nüfus verisi Aşama 7'de
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
fs.writeFileSync(new URL("senaryo.json", hedef), JSON.stringify(senaryo));
fs.copyFileSync(new URL("wikidata-1453.json", kaynak), new URL("wikidata.json", hedef));
const birimsiz = senaryo.sehirler.filter((s) => s.birim < 0).map((s) => s.ad);
console.log("hareket ağı:", rapor);
console.log({ surum, devlet: devletler.length, birim: senaryo.birimler.length, sehir: senaryo.sehirler.length, birimsizSehir: birimsiz });
