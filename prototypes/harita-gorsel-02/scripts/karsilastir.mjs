// v0.1 / v0.2 / historical-basemaps (1400, 1492) karşılaştırması — yalnızca ayrıntı bölgesi.
// historical-basemaps GPL-3.0'dır: yalnızca karşılaştırma için okunur, içe aktarılmaz (DEC-0021).
// Girdi: veri-ham/hb/world_1400.geojson, world_1492.geojson
// Çıktı: konsola Markdown tabloları
// Çalıştırma: node scripts/karsilastir.mjs

import fs from "node:fs";

const oku = (u) => JSON.parse(fs.readFileSync(new URL(u, import.meta.url), "utf8"));
const v1 = oku("../public/veri/dunya-1453.json");
const v2 = oku("../public/veri/dunya-1453-v02.json");
const hb = { 1400: oku("../veri-ham/hb/world_1400.geojson"), 1492: oku("../veri-ham/hb/world_1492.geojson") };
const AYRINTI = { lon0: 12, lon1: 50, lat0: 29, lat1: 49 };

const D2R = Math.PI / 180;
const tersMiller = (y) => (2.5 * (Math.atan(Math.exp((y * D2R) / 1.25)) - Math.PI / 4)) / D2R;

function halkalar(paket) {
  const arcs = paket.arklar;
  const halka = (refs) => {
    const out = [];
    refs.forEach((r, k) => {
      const a = arcs[r < 0 ? ~r : r];
      const pts = [];
      for (let i = 0; i < a.length; i += 2) pts.push([a[i], a[i + 1]]);
      if (r < 0) pts.reverse();
      out.push(...(k === 0 ? pts : pts.slice(1)));
    });
    return out;
  };
  return paket.birimler.map((b) => b.p.map((poly) => poly.map(halka)));
}
const alan = (h) => { let s = 0; for (let i = 0, j = h.length - 1; i < h.length; j = i++) s += h[j][0] * h[i][1] - h[i][0] * h[j][1]; return Math.abs(s / 2); };
const icinde = (h, x, y) => {
  let ic = false;
  for (let i = 0, j = h.length - 1; i < h.length; j = i++) {
    const [xi, yi] = h[i], [xj, yj] = h[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ic = !ic;
  }
  return ic;
};
const polyIcinde = (poly, x, y) => icinde(poly[0], x, y) && !poly.slice(1).some((h) => icinde(h, x, y));

// Temsil noktası: en büyük halkanın ağırlık merkezi; dışarıda kalırsa halkanın içindeki bir köşe ortası
function temsil(polys) {
  let en = null, enA = -1;
  for (const poly of polys) { const a = alan(poly[0]); if (a > enA) { enA = a; en = poly; } }
  if (!en) return null;
  const h = en[0];
  let cx = 0, cy = 0, A = 0;
  for (let i = 0, j = h.length - 1; i < h.length; j = i++) {
    const f = h[j][0] * h[i][1] - h[i][0] * h[j][1];
    cx += (h[j][0] + h[i][0]) * f; cy += (h[j][1] + h[i][1]) * f; A += f;
  }
  let p = A ? [cx / (3 * A), cy / (3 * A)] : h[0];
  if (!polyIcinde(en, p[0], p[1])) {
    for (let i = 0; i + 2 < h.length; i++) {
      const q = [(h[i][0] + h[i + 2][0]) / 2, (h[i][1] + h[i + 2][1]) / 2];
      if (polyIcinde(en, q[0], q[1])) { p = q; break; }
    }
  }
  return { x: p[0], y: p[1], alan: polys.reduce((s, poly) => s + alan(poly[0]), 0) };
}

const h1 = halkalar(v1), h2 = halkalar(v2);
const kutu = (polys) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const poly of polys) for (const [x, y] of poly[0]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return [x0, y0, x1, y1];
};
const k1 = h1.map(kutu);
const v1Devlet = (x, y) => {
  for (let i = 0; i < h1.length; i++) {
    const [x0, y0, x1, y1] = k1[i];
    if (x < x0 || x > x1 || y < y0 || y > y1) continue;
    if (h1[i].some((poly) => polyIcinde(poly, x, y))) return v1.birimler[i].d;
  }
  return -1;
};
const hbAd = (yil, lon, lat) => {
  for (const f of hb[yil].features) {
    const g = f.geometry;
    if (!g) continue;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
    if (polys.some((poly) => polyIcinde(poly, lon, lat))) return f.properties.NAME ?? "(adsız)";
  }
  return "(boş)";
};

const ozet = new Map(); // devlet → { alan, ohm, v1Ayni, hb1400: Map, hb1492: Map }
const degisim = new Map(); // "v1 → v2" → alan
for (let i = 0; i < v2.birimler.length; i++) {
  const b = v2.birimler[i];
  if (b.d < 0) continue;
  const t = temsil(h2[i]);
  if (!t) continue;
  const lat = tersMiller(t.y), lon = t.x;
  if (lon < AYRINTI.lon0 || lon > AYRINTI.lon1 || lat < AYRINTI.lat0 || lat > AYRINTI.lat1) continue;
  const dId = v2.devletler[b.d].id;
  if (!ozet.has(dId)) ozet.set(dId, { alan: 0, ohm: 0, v1Ayni: 0, hb1400: new Map(), hb1492: new Map() });
  const o = ozet.get(dId);
  o.alan += t.alan;
  if (b.k?.startsWith("ohm:")) o.ohm += t.alan;
  const d1 = v1Devlet(t.x, t.y);
  const id1 = d1 >= 0 ? v1.devletler[d1].id : "yok";
  if (id1 === dId) o.v1Ayni += t.alan;
  else degisim.set(`${id1} → ${dId}`, (degisim.get(`${id1} → ${dId}`) ?? 0) + t.alan);
  for (const yil of [1400, 1492]) {
    const ad = hbAd(yil, lon, lat);
    const m = o[`hb${yil}`];
    m.set(ad, (m.get(ad) ?? 0) + t.alan);
  }
}

const ad = (id) => v2.devletler.find((d) => d.id === id)?.ad ?? id;
const ilk = (m, A) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2)
  .map(([k, v]) => `${k} %${Math.round((v / A) * 100)}`).join("; ");
console.log("| Devlet | Güven | OHM payı | v0.1 ile aynı | historical-basemaps 1400 | historical-basemaps 1492 |");
console.log("|---|---|---|---|---|---|");
for (const [id, o] of [...ozet.entries()].sort((a, b) => b[1].alan - a[1].alan)) {
  if (o.alan < 0.05) continue;
  const g = v2.devletler.find((d) => d.id === id)?.kaynak?.guven ?? "?";
  console.log(`| ${ad(id)} | ${g} | %${Math.round((o.ohm / o.alan) * 100)} | %${Math.round((o.v1Ayni / o.alan) * 100)} | ${ilk(o.hb1400, o.alan)} | ${ilk(o.hb1492, o.alan)} |`);
}
console.log("\n| v0.1 → v0.2 | Alan (derece², projeksiyonlu) |\n|---|---|");
for (const [k, v] of [...degisim.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  const [a, b] = k.split(" → ");
  console.log(`| ${a === "yok" ? "devlet yok" : ad(a)} → ${ad(b)} | ${v.toFixed(2)} |`);
}
