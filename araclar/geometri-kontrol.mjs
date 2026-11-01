// TASK-0042: kaynak geometri, şehir ve hareket ağının ortak doğrulaması. Varsayılan kullanım salt okunur.
import fs from "node:fs";
import { pathToFileURL } from "node:url";

export const millerY = (lat) => 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * lat * Math.PI / 180)) * 180 / Math.PI;
export const millerLat = (y) => 2.5 * (Math.atan(Math.exp(y * Math.PI / 180 / 1.25)) - Math.PI / 4) * 180 / Math.PI;

export function haritaHalkalari(harita) {
  return harita.birimler.map((b) => b.p.map((p) => p.map((refs) => refs.flatMap((r, k) => {
    const a = harita.arklar[r < 0 ? ~r : r];
    if (!a || a.length < 4 || a.length % 2 || a.some((v) => !Number.isFinite(v))) throw new Error(`Geçersiz yay: ${r}`);
    const pts = [];
    for (let i = 0; i < a.length; i += 2) pts.push([a[i], a[i + 1]]);
    if (r < 0) pts.reverse();
    if (k) pts.shift();
    return pts;
  }))));
}

export function halkadaMi(ring, x, y) {
  let ic = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[j], [bx, by] = ring[i], dx = bx - ax, dy = by - ay;
    const cross = dx * (y - ay) - dy * (x - ax);
    if (Math.abs(cross) < 1e-10 && x >= Math.min(ax, bx) - 1e-9 && x <= Math.max(ax, bx) + 1e-9
      && y >= Math.min(ay, by) - 1e-9 && y <= Math.max(ay, by) + 1e-9) return true;
    if ((ay > y) !== (by > y) && x < (dx * (y - ay)) / dy + ax) ic = !ic;
  }
  return ic;
}

export const poligondaMi = (p, x, y) => halkadaMi(p[0], x, y) && !p.slice(1).some((r) => halkadaMi(r, x, y));
export const cokluPoligondaMi = (p, x, y) => p.some((poly) => poligondaMi(poly, x, y));
export const halkaAlani = (r) => Math.abs(r.reduce((a, p, i) => { const q = r[(i + 1) % r.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
export const poligonAlani = (p) => Math.max(0, halkaAlani(p[0]) - p.slice(1).reduce((t, r) => t + halkaAlani(r), 0));
export function kutu(p) {
  const k = [Infinity, Infinity, -Infinity, -Infinity];
  for (const poly of p) for (const [x, y] of poly[0]) { k[0] = Math.min(k[0], x); k[1] = Math.min(k[1], y); k[2] = Math.max(k[2], x); k[3] = Math.max(k[3], y); }
  return k;
}
export const kutularKesisir = (a, b) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
export function enYakinKenar(p, x, y) {
  const cx = Math.cos(millerLat(y) * Math.PI / 180), cy = Math.cos(0.8 * millerLat(y) * Math.PI / 180);
  let en = null;
  p.forEach((poly, pi) => poly.forEach((r, ri) => {
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const a = r[j], b = r[i], dx = (b[0] - a[0]) * cx, dy = (b[1] - a[1]) * cy;
      const t = Math.max(0, Math.min(1, (((x - a[0]) * cx * dx) + ((y - a[1]) * cy * dy)) / (dx * dx + dy * dy || 1)));
      const q = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const metre = 111320 * Math.hypot((x - q[0]) * cx, (y - q[1]) * cy);
      if (!en || metre < en.metre) en = { pi, ri, i, j, nokta: q, metre };
    }
  }));
  return en;
}

export function geometriyiDenetle(harita, senaryo = null) {
  const hatalar = [], uyarilar = [];
  let H;
  try { H = haritaHalkalari(harita); } catch (e) { return { hatalar: [e.message], uyarilar, sehir: harita.sehirler.length }; }
  const kimlikler = new Map();
  harita.birimler.forEach((b, i) => {
    if (b.s) { if (kimlikler.has(b.s)) hatalar.push(`${b.s}: birden fazla şehir toprağı.`); kimlikler.set(b.s, i); }
    H[i].forEach((p) => p.forEach((r) => {
      if (r.length < 4 || r[0][0] !== r.at(-1)[0] || r[0][1] !== r.at(-1)[1] || halkaAlani(r) < 1e-12) hatalar.push(`${b.ad}: açık veya dejenere halka.`);
    }));
  });
  const sehirAdlari = new Set();
  const sim = new Map(senaryo?.sehirler.map((s) => [s.ad, s]) ?? []);
  for (const c of harita.sehirler) {
    if (sehirAdlari.has(c.ad)) hatalar.push(`${c.ad}: yinelenen şehir adı.`);
    sehirAdlari.add(c.ad);
    const bi = kimlikler.get(c.ad), b = harita.birimler[bi];
    if (!b) { hatalar.push(`${c.ad}: şehir toprağı bulunamadı.`); continue; }
    if (b.d !== c.d) hatalar.push(`${c.ad}: şehir ile toprağın devleti farklı.`);
    if (!cokluPoligondaMi(H[bi], c.x, c.y)) hatalar.push(`${c.ad}: merkezi kendi toprağının dışında (${Math.round(enYakinKenar(H[bi], c.x, c.y)?.metre ?? 0)} m).`);
    if (b.p.length > 1) uyarilar.push({ sehir: c.ad, tur: "cok-parcali", parca: b.p.length });
    if (!senaryo) continue;
    const s = sim.get(c.ad), n = senaryo.ag?.dugumler[s?.dugum];
    if (!s || s.birim !== bi || senaryo.devletler[c.d]?.id !== s.devlet) hatalar.push(`${c.ad}: senaryo/toprak eşleşmesi hatalı.`);
    if (!n || n.b !== bi) hatalar.push(`${c.ad}: hareket düğümü kendi toprağında değil.`);
    if (s && (s.x !== Math.round(c.x * 1e4) || s.y !== Math.round(c.y * 1e4))) hatalar.push(`${c.ad}: harita/senaryo koordinatı farklı.`);
    if (n && n.b === bi && !H[bi].some((p) => poligondaMi(p, n.x / 1e4, n.y / 1e4))) hatalar.push(`${c.ad}: hareket düğümü poligon dışında.`);
  }
  return { sehir: harita.sehirler.length, birim: H.length, hatalar, uyarilar };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const kok = new URL("../", import.meta.url);
  const h = JSON.parse(fs.readFileSync(new URL("veri/senaryo-1453/harita.json", kok), "utf8"));
  const s = JSON.parse(fs.readFileSync(new URL("veri/senaryo-1453/senaryo.json", kok), "utf8"));
  const r = geometriyiDenetle(h, s);
  if (process.argv.includes("--json")) console.log(JSON.stringify(r, null, 2));
  else {
    console.log(`${r.sehir} şehir, ${r.birim} arazi; ${r.hatalar.length} hata, ${r.uyarilar.length} çok parçalı bölge (adalar dahil; otomatik hata değil).`);
    for (const e of r.hatalar) console.error(e);
  }
  if (r.hatalar.length) process.exitCode = 1;
}
