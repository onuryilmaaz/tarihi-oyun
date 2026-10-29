// Hareket ağı üretimi (TASK-0006, DEC-0025). senaryo-uret.mjs tarafından çağrılır.
//
// Düğüm: bir arazi biriminin bir poligon parçası (çok parçalı birimlerde her parça ayrı düğümdür;
//        böylece iki yakası olan birimler boğazı bedavaya geçirmez).
// Kenar: ortak sınırı olan iki parça; ordu A merkezi → ortak sınır orta noktası → B merkezi yürür.
// Boğaz: elle tanımlanan geçitler (BOGAZLAR), ek süre cezası sim tarafında uygulanır.
// Zorluk: NOAA ETOPO 2022 (kamu malı) yükseklik ızgarasından engebe → yüzde çarpan [TASLAK formül].
// Koordinatlar Miller projeksiyonunda (x = boylam, y = Miller derece); mesafeler metre.

import fs from "node:fs";
import polylabel from "polylabel";

const D2R = Math.PI / 180;
const millerY = (lat) => 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * lat * D2R)) / D2R;
const millerLat = (y) => (2.5 * (Math.atan(Math.exp((y * D2R) / 1.25)) - Math.PI / 4)) / D2R;
const R = 6371008.8;
const metre = ([x1, y1], [x2, y2]) => {
  const p1 = millerLat(y1) * D2R, p2 = millerLat(y2) * D2R, dl = (x2 - x1) * D2R;
  const a = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
};

// Boğaz geçitleri: [ad, yaka A (boylam, enlem), yaka B]
export const BOGAZLAR = [
  ["Çanakkale Boğazı", [26.67, 40.42], [26.70, 40.33]],
  ["İstanbul Boğazı", [29.06, 41.19], [29.10, 41.17]],
  ["Messina Boğazı", [15.60, 38.25], [15.66, 38.21]],
  ["Kerç Boğazı", [36.55, 45.30], [36.70, 45.25]],
  ["Öresund", [12.62, 56.03], [12.70, 56.05]],
  ["Cebelitarık Boğazı", [-5.60, 36.02], [-5.60, 35.85]],
];

function halkalar(harita) {
  const arcs = harita.arklar;
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
  return harita.birimler.map((b) => b.p.map((poly) => poly.map(halka)));
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
// İki doğru parçası kesişiyor mu (uç noktalar hariç)
const kesisir = ([ax, ay], [bx, by], [cx, cy], [dx, dy]) => {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return d1 * d2 < 0 && d3 * d4 < 0;
};

function etopoOku(dosya) {
  // csv0: enlem, boylam, z — enlem artan, boylam artan; 0.2° adım
  const satirlar = fs.readFileSync(dosya, "utf8").split("\n");
  const lat0 = Number(satirlar[0].split(",")[0]), lon0 = Number(satirlar[0].split(",")[1]);
  const adim = 0.2, nx = 1800;
  const ny = Math.floor((satirlar.length - 1) / nx);
  const z = new Float32Array(nx * ny);
  for (let i = 0; i < nx * ny; i++) z[i] = Number(satirlar[i].split(",")[2]);
  return { lat0, lon0, adim, nx, ny, z };
}

export function agUret(harita, etopoDosyasi) {
  const H = halkalar(harita);
  const etopo = etopoOku(etopoDosyasi);

  // 1) Düğümler: kara parçaları (birim × poligon)
  const dugumler = [];
  const parcaDugum = new Map(); // "birim:poligon" → düğüm
  H.forEach((polys, bi) => {
    polys.forEach((poly, pi) => {
      if (poly[0].length < 4 || alan(poly[0]) < 1e-5) return;
      const p = polylabel(poly, 0.005);
      parcaDugum.set(`${bi}:${pi}`, dugumler.length);
      dugumler.push({ b: bi, poly, x: p[0], y: p[1] });
    });
  });

  // 2) Engebe: düğüm poligonu içindeki ETOPO örnekleri (yalnızca kara: z > 0)
  for (const n of dugumler) {
    const xs = n.poly[0].map((p) => p[0]), ys = n.poly[0].map((p) => p[1]);
    const lat0 = millerLat(Math.min(...ys)), lat1 = millerLat(Math.max(...ys));
    const lon0 = Math.min(...xs), lon1 = Math.max(...xs);
    const ornek = [];
    for (let j = Math.max(0, Math.floor((lat0 - etopo.lat0) / etopo.adim)); j <= Math.min(etopo.ny - 1, Math.ceil((lat1 - etopo.lat0) / etopo.adim)); j++) {
      const lat = etopo.lat0 + j * etopo.adim, y = millerY(lat);
      for (let i = Math.max(0, Math.floor((lon0 - etopo.lon0) / etopo.adim)); i <= Math.min(etopo.nx - 1, Math.ceil((lon1 - etopo.lon0) / etopo.adim)); i++) {
        const x = etopo.lon0 + i * etopo.adim;
        const z = etopo.z[j * etopo.nx + i];
        if (z > 0 && polyIcinde(n.poly, x, y)) ornek.push(z);
      }
    }
    let ort = 0, std = 0;
    if (ornek.length) {
      ort = ornek.reduce((a, b) => a + b, 0) / ornek.length;
      std = Math.sqrt(ornek.reduce((a, b) => a + (b - ort) ** 2, 0) / ornek.length);
    }
    // [TASLAK] zorluk %: düz ova 100; engebe (std) ve yüksek ortalama yavaşlatır; üst sınır 250
    n.zorluk = ornek.length >= 3 ? Math.max(100, Math.min(250, Math.round(100 + std / 8 + Math.max(0, ort - 1000) / 40))) : 100;
    n.ornek = ornek.length;
    const lat = millerLat(n.y);
    n.kx = Math.round(111320 * Math.cos(lat * D2R)); // metre / boylam derecesi
    n.ky = Math.round(110574 * Math.cos(0.8 * lat * D2R)); // metre / Miller-y derecesi (dy/dφ = 1/cos(0.8φ))
  }

  // 3) Kenarlar: aynı yayı kullanan iki farklı parça
  const yaySahibi = new Map();
  harita.birimler.forEach((b, bi) => b.p.forEach((poly, pi) => {
    const n = parcaDugum.get(`${bi}:${pi}`);
    if (n === undefined) return;
    for (const ring of poly) for (const r of ring) {
      const k = r < 0 ? ~r : r;
      if (!yaySahibi.has(k)) yaySahibi.set(k, new Set());
      yaySahibi.get(k).add(n);
    }
  }));
  const yayUzunlugu = (a) => { let s = 0; for (let i = 2; i < a.length; i += 2) s += Math.hypot(a[i] - a[i - 2], a[i + 1] - a[i - 1]); return s; };
  const yayOrtasi = (a) => {
    const L = yayUzunlugu(a) / 2;
    let s = 0;
    for (let i = 2; i < a.length; i += 2) {
      const d = Math.hypot(a[i] - a[i - 2], a[i + 1] - a[i - 1]);
      if (s + d >= L) { const t = d ? (L - s) / d : 0; return [a[i - 2] + (a[i] - a[i - 2]) * t, a[i - 1] + (a[i + 1] - a[i - 1]) * t]; }
      s += d;
    }
    return [a[0], a[1]];
  };
  const ciftler = new Map(); // "a-b" → en uzun ortak yay
  for (const [k, sahipler] of yaySahibi) {
    if (sahipler.size !== 2) continue;
    const [a, b] = [...sahipler].sort((x, y) => x - y);
    const anahtar = `${a}-${b}`;
    const L = yayUzunlugu(harita.arklar[k]);
    if (!ciftler.has(anahtar) || ciftler.get(anahtar).L < L) ciftler.set(anahtar, { a, b, k, L });
  }
  const nehirler = harita.nehirler.filter((n) => n.r <= 3).map((n) => {
    const pts = [];
    for (let i = 0; i < n.p.length; i += 2) pts.push([n.p[i], n.p[i + 1]]);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    return { pts, kutu: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
  });
  const nehirSay = (p, q) => {
    const kutu = [Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[0], q[0]), Math.max(p[1], q[1])];
    let s = 0;
    for (const n of nehirler) {
      if (n.kutu[0] > kutu[2] || n.kutu[2] < kutu[0] || n.kutu[1] > kutu[3] || n.kutu[3] < kutu[1]) continue;
      for (let i = 1; i < n.pts.length; i++) if (kesisir(p, q, n.pts[i - 1], n.pts[i])) s++;
    }
    return s;
  };
  const kenarlar = [];
  for (const { a, b, k } of [...ciftler.values()].sort((x, y) => x.a - y.a || x.b - y.b)) {
    const A = dugumler[a], B = dugumler[b];
    const M = yayOrtasi(harita.arklar[k]);
    const n = Math.min(2, nehirSay([A.x, A.y], M) + nehirSay(M, [B.x, B.y]));
    kenarlar.push({ a, b, mx: M[0], my: M[1], da: Math.round(metre([A.x, A.y], M)), db: Math.round(metre(M, [B.x, B.y])), n, g: 0 });
  }

  // 4) Boğaz geçitleri
  const enYakinDugum = (lon, lat) => {
    const x = lon, y = millerY(lat);
    const ic = dugumler.findIndex((n) => polyIcinde(n.poly, x, y));
    if (ic >= 0) return ic;
    let en = -1, enD = Infinity;
    dugumler.forEach((n, i) => {
      for (const [px, py] of n.poly[0]) { const d = (px - x) ** 2 + (py - y) ** 2; if (d < enD) { enD = d; en = i; } }
    });
    return enD < 0.5 ** 2 ? en : -1;
  };
  const bogazRaporu = [];
  for (const [ad, pA, pB] of BOGAZLAR) {
    const a = enYakinDugum(...pA), b = enYakinDugum(...pB);
    if (a < 0 || b < 0 || a === b) { bogazRaporu.push(`${ad}: EKLENEMEDİ (a=${a}, b=${b})`); continue; }
    const A = dugumler[a], B = dugumler[b];
    const M = [(pA[0] + pB[0]) / 2, millerY((pA[1] + pB[1]) / 2)];
    kenarlar.push({ a: Math.min(a, b), b: Math.max(a, b), mx: M[0], my: M[1],
      da: Math.round(metre([A.x, A.y], M)), db: Math.round(metre(M, [B.x, B.y])), n: 0, g: 1, ad });
    bogazRaporu.push(`${ad}: ${harita.birimler[A.b].ad} ↔ ${harita.birimler[B.b].ad}`);
  }

  const r4 = (v) => Math.round(v * 10000);
  return {
    ag: {
      // x, y: Miller koordinatı × 10⁴ (tam sayı); z: zorluk %; kx, ky: metre/derece
      dugumler: dugumler.map((n) => ({ b: n.b, x: r4(n.x), y: r4(n.y), z: n.zorluk, kx: n.kx, ky: n.ky })),
      kenarlar: kenarlar.map((e) => ({ a: e.a, b: e.b, mx: r4(e.mx), my: r4(e.my), da: e.da, db: e.db, n: e.n, g: e.g, ...(e.ad ? { ad: e.ad } : {}) })),
    },
    rapor: {
      dugum: dugumler.length, kenar: kenarlar.length, bogaz: bogazRaporu,
      ornekSiz: dugumler.filter((n) => n.ornek < 3).length,
      zorlukDagilimi: [100, 125, 150, 200, 250].map((s) => `≤${s}: ${dugumler.filter((n) => n.zorluk <= s).length}`).join(", "),
      nehirliKenar: kenarlar.filter((e) => e.n > 0).length,
    },
    dugumBul: enYakinDugum,
  };
}
