// Natural Earth (kamu malı) → prototip harita paketi
//   SURUM=v01 (varsayılan): public/veri/dunya-1453.json — yalnızca tahmin kuralları (TASK-0002)
//   SURUM=v02:              public/veri/dunya-1453-v02.json — OHM CC0 sınırları + tahmin (TASK-0004)
// Çalıştırma: npm run veri / npm run veri:v02   (girdi: veri-ham/*.geojson, depoya dahil değil)

import fs from "node:fs";
import { topology } from "topojson-server";
import { presimplify, simplify, quantile } from "topojson-simplify";
import { merge, feature } from "topojson-client";
import polygonClipping from "polygon-clipping";
import polylabel from "polylabel";
import { DEVLETLER, BOLMELER, SEHIRLER, BIRLESTIR, ata } from "./devletler-1453.mjs";
import { OHM_DEVLET, OHM_RED, OHM_DUZELTME } from "./ohm-esleme.mjs";

const HAM = new URL("../veri-ham/", import.meta.url);
const SURUM = process.env.SURUM ?? "v01";
const CIKTI = new URL(SURUM === "v02" ? "../public/veri/dunya-1453-v02.json" : "../public/veri/dunya-1453.json", import.meta.url);
const oku = (ad) => JSON.parse(fs.readFileSync(new URL(ad, HAM), "utf8"));

const ENLEM_MIN = -57, ENLEM_MAX = 83.7;
// Ayrıntı bölgesi (DEC-0004): Balkanlar, Anadolu, Doğu Akdeniz
const AYRINTI = { lon0: 12, lon1: 50, lat0: 29, lat1: 49 };
const SADELIK_ORANI = Number(process.env.SADELIK ?? 0.25); // korunacak nokta oranı (yaklaşık)

// Miller silindirik projeksiyon (derece cinsinden y)
const R2D = 180 / Math.PI, D2R = Math.PI / 180;
const miller = (lat) => 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * lat * D2R)) * R2D;
const proj = ([lon, lat]) => {
  const la = Math.max(ENLEM_MIN, Math.min(ENLEM_MAX, lat));
  return [lon, miller(la)];
};
const projGeo = (g) => {
  if (g.type === "Polygon") return { type: "Polygon", coordinates: g.coordinates.map((r) => r.map(proj)) };
  if (g.type === "MultiPolygon") {
    return { type: "MultiPolygon", coordinates: g.coordinates.map((p) => p.map((r) => r.map(proj))) };
  }
  if (g.type === "LineString") return { type: "LineString", coordinates: g.coordinates.map(proj) };
  if (g.type === "MultiLineString") return { type: "MultiLineString", coordinates: g.coordinates.map((l) => l.map(proj)) };
  throw new Error(g.type);
};
const cokluPoligon = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);

const t0 = Date.now();
const devletIndeks = new Map(DEVLETLER.map((d, i) => [d.id, i]));

// 1) Birimler ve 1453 ataması
const admin1 = oku("ne_10m_admin_1_states_provinces.geojson");
const birimler = [];
const bolmeKullanildi = new Set();
let atanmamis = 0;
for (const f of admin1.features) {
  const p = f.properties;
  if (p.adm0_a3 === "ATA" || !f.geometry) continue;
  const ad = p.name_tr || p.name || "?";
  const temel = { ad, neAd: p.name, ulke: p.admin, kod: p.adm0_a3, bolge: p.region || null };
  const bolme = BOLMELER.find(([k, a]) => k === p.adm0_a3 && a === p.name);
  if (bolme) {
    bolmeKullanildi.add(bolme[1]);
    const [, , kesici, icDevlet, disDevlet] = bolme;
    const geo = cokluPoligon(f.geometry);
    const ic = polygonClipping.intersection(geo, [[kesici]]);
    const dis = polygonClipping.difference(geo, [[kesici]]);
    // Elle bölünen iç parça korunur (OHM ile değiştirilmez); kaynağı elle tahmin
    if (ic.length) birimler.push({ ...temel, ad: `${ad} (iç)`, devlet: icDevlet, geo: ic, korunan: true, kaynak: "tahmin-elle" });
    if (dis.length) birimler.push({ ...temel, devlet: disDevlet, geo: dis, kaynak: "tahmin" });
    continue;
  }
  const devlet = ata(p);
  if (devlet && !devletIndeks.has(devlet)) throw new Error(`Bilinmeyen devlet: ${devlet} (${p.name})`);
  if (!devlet) atanmamis++;
  birimler.push({ ...temel, devlet, geo: cokluPoligon(f.geometry), kaynak: "tahmin" });
}
for (const [, a] of BOLMELER) if (!bolmeKullanildi.has(a)) console.warn("UYARI: bölme eşleşmedi:", a);

// 1b) v0.2: OpenHistoricalMap sınırları (DEC-0021). Her birim, OHM poligonlarıyla öncelik sırasına
// göre (önce özgül alt düzeyler) kesilir; OHM'nin kapsamadığı kalan kısım tahmin kuralıyla kalır.
const alan = (mp) => {
  let s = 0;
  for (const poly of mp) poly.forEach((ring, k) => {
    let a = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      a += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]) * Math.cos(((ring[i][1] + ring[j][1]) / 2) * D2R);
    }
    s += (k === 0 ? 1 : -1) * Math.abs(a / 2);
  });
  return s;
};
const kutu = (mp) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const poly of mp) for (const [x, y] of poly[0]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return [x0, y0, x1, y1];
};
const kesisir = (a, b) => a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];
const ohmIstatistik = { kesilenBirim: 0, parca: 0, hata: 0 };
if (SURUM === "v02") {
  const ohm = oku("ohm-1453.geojson").features
    .filter((f) => f.properties.kullanim === "ice-aktar" && !OHM_RED[f.properties.id])
    .map((f) => {
      const devlet = OHM_DEVLET[f.properties.id];
      if (!devlet) throw new Error(`OHM eşlemesi yok: ${f.properties.id} ${f.properties.ad}`);
      if (!devletIndeks.has(devlet)) throw new Error(`Bilinmeyen devlet: ${devlet}`);
      let geo = f.geometry.coordinates;
      try {
        geo = polygonClipping.union(geo); // geçersiz/örtüşen halkaları düzelt
        if (f.icHalkalar?.length) geo = polygonClipping.difference(geo, f.icHalkalar.map((h) => [h]));
      } catch (e) {
        console.warn("UYARI: OHM geometrisi düzeltilemedi:", f.properties.ad, e.message);
      }
      return { id: f.properties.id, ad: f.properties.ad, duzey: f.properties.duzey, devlet, geo, kutu: kutu(geo), alan: alan(geo) };
    })
    .sort((a, b) => b.duzey - a.duzey || a.alan - b.alan);

  // DEC-0022: kullanıcı kararıyla düzeltilen OHM atamaları
  const duzelt = (b, parca) => {
    const kural = OHM_DUZELTME.find((k) => parca.kaynak === `ohm:${k.ohm}` && k.kosul(b));
    if (!kural) return parca;
    ohmIstatistik.duzeltme = (ohmIstatistik.duzeltme ?? 0) + 1;
    return kural.devlet ? { ...parca, devlet: kural.devlet } : { ...parca, devlet: b.devlet, kaynak: "tahmin" };
  };
  const yeni = [];
  for (const b of birimler) {
    if (b.korunan) { yeni.push(b); continue; }
    const bk = kutu(b.geo);
    const adaylar = ohm.filter((o) => kesisir(bk, o.kutu));
    if (!adaylar.length) { yeni.push(b); continue; }
    const A = alan(b.geo);
    let kalan = b.geo;
    const parcalar = [];
    for (const o of adaylar) {
      try {
        const ic = polygonClipping.intersection(kalan, o.geo);
        if (!ic.length) continue;
        const a = alan(ic);
        if (a <= 0) continue;
        parcalar.push({ devlet: o.devlet, geo: ic, kaynak: `ohm:${o.id}`, a });
        kalan = polygonClipping.difference(kalan, o.geo);
      } catch (e) {
        ohmIstatistik.hata++;
      }
    }
    const kalanA = kalan.length ? alan(kalan) : 0;
    if (kalanA / A >= 0.15) parcalar.push({ devlet: b.devlet, geo: kalan, kaynak: "tahmin", a: kalanA });
    const buyukHam = parcalar.filter((p) => p.a / A >= 0.02);
    const buyuk = buyukHam.map((p) => duzelt(b, p)).sort((x, y) => y.a - x.a);
    if (!buyuk.length) { yeni.push(b); continue; }
    if (buyuk.length === 1) { // tek parça: birimin özgün geometrisi korunur
      yeni.push({ ...b, devlet: buyuk[0].devlet, kaynak: buyuk[0].kaynak });
      if (buyuk[0].kaynak !== "tahmin") ohmIstatistik.kesilenBirim++;
      continue;
    }
    // küçük parçalar ve kıyı kırıntıları en büyük parçaya eklenir (kara boşluğu kalmasın)
    const ufak = parcalar.filter((p) => !buyukHam.includes(p)).map((p) => p.geo);
    if (kalanA / A < 0.15 && kalan.length) ufak.push(kalan);
    if (ufak.length) {
      try { buyuk[0].geo = polygonClipping.union(buyuk[0].geo, ...ufak); } catch { ohmIstatistik.hata++; }
    }
    // aynı devlete düşen parçaları birleştir
    const devleteGore = new Map();
    for (const p of buyuk) {
      const k = `${p.devlet}|${p.kaynak}`;
      if (!devleteGore.has(k)) devleteGore.set(k, []);
      devleteGore.get(k).push(p);
    }
    for (const liste of devleteGore.values()) {
      const geo = liste.length === 1 ? liste[0].geo : polygonClipping.union(...liste.map((p) => p.geo));
      const dAd = DEVLETLER[devletIndeks.get(liste[0].devlet)]?.ad ?? "devlet yok";
      yeni.push({ ...b, ad: `${b.ad} (${dAd})`, devlet: liste[0].devlet, kaynak: liste[0].kaynak, geo });
      ohmIstatistik.parca++;
    }
    ohmIstatistik.kesilenBirim++;
  }
  console.log("OHM:", { kayit: ohm.length, birimOnce: birimler.length, birimSonra: yeni.length, ...ohmIstatistik });
  birimler.length = 0;
  birimler.push(...yeni);
}

// Çok küçük birimleri birleştir (görsel kalabalığı azaltır; oyun ölçeği kaza/nahiye olmaya devam eder)
{
  const gruplar = new Map();
  const kalan = [];
  for (const b of birimler) {
    const tur = BIRLESTIR[b.kod];
    if (!tur) { kalan.push(b); continue; }
    const anahtar = `${b.kod}|${tur === "bolge" ? b.bolge ?? "-" : "-"}|${b.devlet}|${b.kaynak}`;
    if (!gruplar.has(anahtar)) gruplar.set(anahtar, []);
    gruplar.get(anahtar).push(b);
  }
  for (const liste of gruplar.values()) {
    const ilk = liste[0];
    const geo = liste.length === 1 ? ilk.geo : polygonClipping.union(...liste.map((b) => b.geo));
    const ad = liste.length === 1 ? ilk.ad : BIRLESTIR[ilk.kod] === "bolge" && ilk.bolge ? ilk.bolge : ilk.ulke;
    kalan.push({ ...ilk, ad, geo });
  }
  console.log("birleştirme:", birimler.length, "→", kalan.length);
  birimler.length = 0;
  birimler.push(...kalan);
}

// Devlet başına kaynak payı ve güven düzeyi (DEC-0021). "yuksek" kaynaklı + doğrulanmış veri için
// ayrılmıştır; tarihçi gözden geçirmesi olmadığından bu sürümde kullanılmaz.
const devletKaynak = DEVLETLER.map(() => ({ ohm: 0, toplam: 0, kayitlar: new Set() }));
for (const b of birimler) {
  if (!b.devlet) continue;
  const dk = devletKaynak[devletIndeks.get(b.devlet)];
  const a = alan(b.geo);
  dk.toplam += a;
  if (b.kaynak.startsWith("ohm:")) { dk.ohm += a; dk.kayitlar.add(Number(b.kaynak.slice(4))); }
}

// Hiç birimi olmayan devletleri bildir (yanlış yazılmış ad)
const kullanilan = new Set(birimler.map((b) => b.devlet));
for (const d of DEVLETLER) if (!kullanilan.has(d.id)) console.warn("UYARI: birimi olmayan devlet:", d.id);

// 2) Projeksiyon + topoloji
const fc = {
  type: "FeatureCollection",
  features: birimler.map((b, i) => ({
    type: "Feature", id: i, properties: {},
    geometry: projGeo({ type: "MultiPolygon", coordinates: b.geo }),
  })),
};
let topo = topology({ b: fc });
const ayrintiY0 = miller(AYRINTI.lat0), ayrintiY1 = miller(AYRINTI.lat1);
const ayrintida = ([x, y]) => x >= AYRINTI.lon0 && x <= AYRINTI.lon1 && y >= ayrintiY0 && y <= ayrintiY1;
topo = presimplify(topo, (t) => {
  const alan = Math.abs((t[0][0] - t[2][0]) * (t[1][1] - t[0][1]) - (t[0][0] - t[1][0]) * (t[2][1] - t[0][1])) / 2;
  return ayrintida(t[1]) ? alan * 25 : alan;
});
const hamNokta = topo.arcs.reduce((s, a) => s + a.length, 0);
topo = simplify(topo, quantile(topo, SADELIK_ORANI));
const sadeNokta = topo.arcs.reduce((s, a) => s + a.filter((p) => p[2] !== 0).length, 0);

// 3) Komşuluk: aynı yayı kullanan birimler
const geos = topo.objects.b.geometries;
const yaySahipleri = new Map();
geos.forEach((g, bi) => {
  const polys = g.type === "Polygon" ? [g.arcs] : g.type === "MultiPolygon" ? g.arcs : [];
  for (const poly of polys) for (const ring of poly) for (const a of ring) {
    const k = a < 0 ? ~a : a;
    if (!yaySahipleri.has(k)) yaySahipleri.set(k, []);
    yaySahipleri.get(k).push(bi);
  }
});
const komsu = DEVLETLER.map(() => new Set());
for (const sahip of yaySahipleri.values()) {
  if (sahip.length < 2) continue;
  const [a, b] = sahip.map((bi) => birimler[bi].devlet);
  if (a && b && a !== b) {
    komsu[devletIndeks.get(a)].add(devletIndeks.get(b));
    komsu[devletIndeks.get(b)].add(devletIndeks.get(a));
  }
}

// 4) Renk tonu: sabit tonlar önce; diğerleri komşulardan en uzak aday
const tonFarki = (a, b) => { const d = Math.abs(a - b) % 1; return Math.min(d, 1 - d); };
const ton = DEVLETLER.map((d) => d.hue ?? null);
let tohum = 1453;
const rnd = () => ((tohum = (tohum * 16807) % 2147483647) / 2147483647);
DEVLETLER.forEach((d, i) => {
  if (ton[i] !== null) return;
  let enIyi = 0, skor = -1;
  for (let k = 0; k < 48; k++) {
    const aday = rnd();
    let s = 1;
    for (const n of komsu[i]) if (ton[n] !== null) s = Math.min(s, tonFarki(aday, ton[n]));
    if (s > skor) { skor = s; enIyi = aday; }
  }
  ton[i] = enIyi;
});

// 5) Devlet etiket noktaları: birleşik geometrinin en büyük parçasında en geniş iç daire
const poligonAlani = (ring) => {
  let s = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) s += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  return Math.abs(s / 2);
};
const devletCikti = DEVLETLER.map((d, i) => {
  const parcalar = geos.filter((g, bi) => birimler[bi].devlet === d.id);
  let etiket = null, toplamAlan = 0;
  if (parcalar.length) {
    // Önce sadeleştirilmiş parçaların poligon birleşimi; OHM kesimlerinden doğan parçalar yay
    // paylaşmadığında topojson merge bütünleşmiş bir şekil vermez. Hata olursa merge'e düşülür.
    let birlesik;
    try {
      birlesik = {
        coordinates: polygonClipping.union(...parcalar.map((g) => {
          const geo = feature(topo, g).geometry;
          return geo.type === "Polygon" ? [geo.coordinates] : geo.coordinates;
        })),
      };
    } catch {
      birlesik = merge(topo, parcalar);
    }
    let enBuyuk = null, enAlan = -1;
    for (const poly of birlesik.coordinates) {
      const a = poligonAlani(poly[0]);
      toplamAlan += a;
      if (a > enAlan) { enAlan = a; enBuyuk = poly; }
    }
    if (enBuyuk) {
      const pl = polylabel(enBuyuk, 0.02);
      etiket = [+pl[0].toFixed(3), +pl[1].toFixed(3), +pl.distance.toFixed(3)];
    }
  }
  const dk = devletKaynak[i];
  const ohmOran = dk.toplam ? dk.ohm / dk.toplam : 0;
  return {
    id: d.id, ad: d.ad, ton: +ton[i].toFixed(3), etiket, alan: +toplamAlan.toFixed(2),
    kaynak: { ohmOran: +ohmOran.toFixed(2), guven: ohmOran >= 0.8 ? "orta" : "dusuk", ohm: [...dk.kayitlar] },
  };
});

// 6) Göller ve nehirler (basit Douglas–Peucker)
const dp = (pts, tol) => {
  if (pts.length < 3) return pts;
  const tut = new Uint8Array(pts.length);
  tut[0] = tut[pts.length - 1] = 1;
  const yigin = [[0, pts.length - 1]];
  while (yigin.length) {
    const [a, b] = yigin.pop();
    let maks = 0, mi = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1e-12;
    for (let i = a + 1; i < b; i++) {
      const t = Math.max(0, Math.min(1, ((pts[i][0] - ax) * dx + (pts[i][1] - ay) * dy) / l2));
      const ex = ax + t * dx - pts[i][0], ey = ay + t * dy - pts[i][1];
      const d2 = ex * ex + ey * ey;
      if (d2 > maks) { maks = d2; mi = i; }
    }
    if (mi >= 0 && maks > tol * tol) { tut[mi] = 1; yigin.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => tut[i]);
};
const duz = (pts) => pts.flatMap(([x, y]) => [+x.toFixed(3), +y.toFixed(3)]);
const tolerans = (pts) => (pts.some(ayrintida) ? 0.01 : 0.04);

const goller = [];
for (const f of oku("ne_10m_lakes.geojson").features) {
  if (f.properties.scalerank > 4 || !f.geometry) continue;
  for (const poly of cokluPoligon(projGeo(f.geometry))) {
    const halkalar = poly.map((r) => dp(r, tolerans(r))).filter((r) => r.length >= 4);
    if (halkalar.length) goller.push(halkalar.map(duz));
  }
}
const nehirler = [];
for (const f of oku("ne_10m_rivers_lake_centerlines.geojson").features) {
  const sr = f.properties.scalerank;
  if (!f.geometry || f.properties.featurecla?.includes("Lake")) continue;
  const g = projGeo(f.geometry);
  const hatlar = g.type === "LineString" ? [g.coordinates] : g.coordinates;
  for (const h of hatlar) {
    const ayr = h.some(ayrintida);
    if (sr > (ayr ? 6 : 4)) continue;
    const s = dp(h, tolerans(h));
    if (s.length >= 2) nehirler.push({ r: sr, p: duz(s) });
  }
}

// 7) Çıktı
const yuvarla = (a) => {
  const out = [];
  for (const p of a) if (p[2] !== 0) out.push(+p[0].toFixed(4), +p[1].toFixed(4));
  return out;
};
const paket = {
  surum: SURUM,
  uyari: SURUM === "v02"
    ? "1453 sınırları: OpenHistoricalMap (CC0) kayıtları + agent tahmini. Coğrafya: Natural Earth (kamu malı)."
    : "1453 sınırları YAKLAŞIKTIR (agent tahmini, kaynaksız). Coğrafya: Natural Earth (kamu malı).",
  projeksiyon: "miller",
  dunya: { x0: -180, x1: 180, y0: miller(ENLEM_MIN), y1: miller(ENLEM_MAX) },
  arklar: topo.arcs.map(yuvarla),
  birimler: birimler.map((b, i) => {
    const g = geos[i];
    const polys = g.type === "Polygon" ? [g.arcs] : g.type === "MultiPolygon" ? g.arcs : [];
    return { ad: b.ad, ulke: b.ulke, d: b.devlet ? devletIndeks.get(b.devlet) : -1, k: b.kaynak, p: polys };
  }),
  devletler: devletCikti,
  sehirler: SEHIRLER.map(([ad, lon, lat, d, b]) => {
    const [x, y] = proj([lon, lat]);
    return { ad, x: +x.toFixed(3), y: +y.toFixed(3), d: devletIndeks.get(d), b: b ? 1 : 0 };
  }),
  goller,
  nehirler,
};
for (const s of paket.sehirler) if (s.d === undefined) throw new Error("Şehir devleti yok: " + s.ad);

fs.mkdirSync(new URL("../public/veri/", import.meta.url), { recursive: true });
const json = JSON.stringify(paket);
fs.writeFileSync(CIKTI, json);
console.log({
  birim: birimler.length, atanmamisBirim: atanmamis, devlet: DEVLETLER.length, sehir: SEHIRLER.length,
  hamNokta, sadeNokta, yay: topo.arcs.length, gol: goller.length, nehir: nehirler.length,
  boyutMB: +(json.length / 1048576).toFixed(2), sureSn: (Date.now() - t0) / 1000,
});
