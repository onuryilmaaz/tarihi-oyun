// Harita → three.js katmanları (ADR-0001 yaklaşımı) + tema uygulama + seçim vurgusu.
// Çizim sırası: kara dolgusu → göller → arazi sınırı → nehir → kıyı → devlet sınırı
//               → seçim çerçevesi → şehirler → şehir seçimi

import * as THREE from "three";
import earcut from "earcut";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import type { Harita } from "./veri";
import type { Tema } from "./temalar";

export interface Katmanlar {
  grup: THREE.Group;
  dolgu: THREE.Mesh;
  goller: THREE.Mesh;
  araziSiniri: LineSegments2;
  nehirBuyuk: LineSegments2;
  nehirKucuk: LineSegments2;
  kiyi: LineSegments2;
  devletSiniri: LineSegments2;
  secimCercevesi: LineSegments2;
  baskentler: THREE.Points;
  sehirler: THREE.Points;
  sehirSecimi: THREE.Points;
  cizgiler: LineSegments2[];
  birimKose: Int32Array; // birim başına [başlangıç, sayı]
  temelRenk: Float32Array;
  ucgenSayisi: number;
}

function cizgi(pts: number[], sira: number): LineSegments2 {
  const m = new LineMaterial({ color: 0xffffff, linewidth: 1, transparent: true, depthTest: false });
  const l = new LineSegments2(new LineSegmentsGeometry().setPositions(pts.length ? pts : [0, 0, 0, 0, 0, 0]), m);
  l.renderOrder = sira;
  l.frustumCulled = false;
  return l;
}

function yayParcalari(a: Float32Array, hedef: number[]) {
  for (let i = 0; i + 3 < a.length; i += 2) hedef.push(a[i], a[i + 1], 0, a[i + 2], a[i + 3], 0);
}

function noktalar(xy: number[], sira: number): THREE.Points {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array((xy.length / 2) * 3);
  for (let i = 0; i < xy.length / 2; i++) { pos[3 * i] = xy[2 * i]; pos[3 * i + 1] = xy[2 * i + 1]; }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({
    size: 8, sizeAttenuation: false, transparent: true, alphaTest: 0.05, depthTest: false,
  }));
  p.renderOrder = sira;
  p.frustumCulled = false;
  return p;
}

function poligonlariUcgenle(polys: Float32Array[][], konum: number[], indeks: number[]) {
  for (const hs of polys) {
    const taban = konum.length / 3;
    const duz: number[] = [];
    const delikler: number[] = [];
    hs.forEach((h, k) => {
      if (k > 0) delikler.push(duz.length / 2);
      for (let i = 0; i < h.length; i++) duz.push(h[i]);
    });
    for (let i = 0; i < duz.length; i += 2) konum.push(duz[i], duz[i + 1], 0);
    for (const t of earcut(duz, delikler.length ? delikler : undefined)) indeks.push(taban + t);
  }
}

export function katmanlariKur(h: Harita): Katmanlar {
  const { paket } = h;

  // Kara dolgusu: tek geometri, birim başına ardışık köşe aralığı
  const konum: number[] = [];
  const indeks: number[] = [];
  const birimKose = new Int32Array(paket.birimler.length * 2);
  h.halkalar.forEach((polys, bi) => {
    birimKose[2 * bi] = konum.length / 3;
    poligonlariUcgenle(polys, konum, indeks);
    birimKose[2 * bi + 1] = konum.length / 3 - birimKose[2 * bi];
  });
  const dolguGeo = new THREE.BufferGeometry();
  dolguGeo.setAttribute("position", new THREE.Float32BufferAttribute(konum, 3));
  dolguGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(konum.length), 3));
  dolguGeo.setIndex(new THREE.BufferAttribute(Uint32Array.from(indeks), 1));
  const dolgu = new THREE.Mesh(dolguGeo, new THREE.MeshBasicMaterial({ vertexColors: true }));
  dolgu.renderOrder = 0;
  dolgu.frustumCulled = false;

  // Göller
  const gKonum: number[] = [], gIndeks: number[] = [];
  poligonlariUcgenle(paket.goller.map((p) => p.map((r) => Float32Array.from(r))), gKonum, gIndeks);
  const golGeo = new THREE.BufferGeometry();
  golGeo.setAttribute("position", new THREE.Float32BufferAttribute(gKonum, 3));
  golGeo.setIndex(gIndeks);
  const goller = new THREE.Mesh(golGeo, new THREE.MeshBasicMaterial({ depthTest: false }));
  goller.renderOrder = 1;
  goller.frustumCulled = false;

  // Sınırlar: yayın iki yanındaki birimlerin devletine göre
  const ic: number[] = [], devlet: number[] = [], kiyiPts: number[] = [];
  for (let k = 0; k < h.arklar.length; k++) {
    const a = h.yaySahipA[k], b = h.yaySahipB[k];
    if (a < 0) continue;
    if (b < 0) { yayParcalari(h.arklar[k], kiyiPts); continue; }
    const da = paket.birimler[a].d, db = paket.birimler[b].d;
    if (da !== db) yayParcalari(h.arklar[k], devlet);
    else if (da >= 0) yayParcalari(h.arklar[k], ic); // atanmamış bölgelerde modern iç sınır çizilmez
  }
  const araziSiniri = cizgi(ic, 3);
  const kiyi = cizgi(kiyiPts, 5);
  const devletSiniri = cizgi(devlet, 6);

  const nb: number[] = [], nk: number[] = [];
  for (const n of paket.nehirler) {
    const hedef = n.r <= 3 ? nb : nk;
    for (let i = 0; i + 3 < n.p.length; i += 2) hedef.push(n.p[i], n.p[i + 1], 0, n.p[i + 2], n.p[i + 3], 0);
  }
  const nehirBuyuk = cizgi(nb, 4);
  const nehirKucuk = cizgi(nk, 4);

  const secimCercevesi = cizgi([], 7);
  secimCercevesi.visible = false;

  const bxy: number[] = [], sxy: number[] = [];
  for (const s of paket.sehirler) (s.b ? bxy : sxy).push(s.x, s.y);
  const sehirler = noktalar(sxy, 8);
  const baskentler = noktalar(bxy, 9);
  const sehirSecimi = noktalar([0, 0], 10);
  sehirSecimi.visible = false;

  const grup = new THREE.Group();
  grup.add(dolgu, goller, araziSiniri, nehirBuyuk, nehirKucuk, kiyi, devletSiniri, secimCercevesi,
    sehirler, baskentler, sehirSecimi);

  return {
    grup, dolgu, goller, araziSiniri, nehirBuyuk, nehirKucuk, kiyi, devletSiniri, secimCercevesi,
    baskentler, sehirler, sehirSecimi,
    cizgiler: [araziSiniri, nehirBuyuk, nehirKucuk, kiyi, devletSiniri, secimCercevesi],
    birimKose,
    temelRenk: new Float32Array(konum.length),
    ucgenSayisi: indeks.length / 3,
  };
}

export function devletRengi(t: Tema, ton: number, i: number): THREE.Color {
  const l = t.aciklik + (((i * 37) % 7) / 6 - 0.5) * 2 * t.oynama;
  const s = t.doygunluk * (0.85 + ((i * 53) % 5) * 0.06);
  return new THREE.Color().setHSL(ton, s, l, THREE.SRGBColorSpace);
}

function daire(dolgu: string, kenar: string, halka = false): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  g.beginPath();
  g.arc(32, 32, halka ? 24 : 22, 0, Math.PI * 2);
  if (!halka) { g.fillStyle = dolgu; g.fill(); }
  g.lineWidth = halka ? 7 : 9;
  g.strokeStyle = kenar;
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function cizgiAyarla(l: LineSegments2, s: { renk: string; opak: number; kalinlik: number }) {
  const m = l.material as LineMaterial;
  m.color.set(s.renk);
  m.opacity = s.opak;
  m.linewidth = s.kalinlik;
}

export function temaUygula(k: Katmanlar, h: Harita, t: Tema, sahne: THREE.Scene) {
  sahne.background = new THREE.Color(t.deniz);
  (k.goller.material as THREE.MeshBasicMaterial).color.set(t.deniz);

  const renk = k.dolgu.geometry.getAttribute("color") as THREE.BufferAttribute;
  const dizi = renk.array as Float32Array;
  const bos = new THREE.Color(t.bosKara);
  const devletRenkleri = h.paket.devletler.map((d, i) => devletRengi(t, d.ton, i));
  h.paket.birimler.forEach((b, bi) => {
    const c = b.d >= 0 ? devletRenkleri[b.d] : bos;
    const bas = k.birimKose[2 * bi], n = k.birimKose[2 * bi + 1];
    for (let v = bas; v < bas + n; v++) { dizi[3 * v] = c.r; dizi[3 * v + 1] = c.g; dizi[3 * v + 2] = c.b; }
  });
  k.temelRenk.set(dizi);
  renk.needsUpdate = true;

  cizgiAyarla(k.araziSiniri, t.araziSinir);
  cizgiAyarla(k.devletSiniri, t.devletSinir);
  cizgiAyarla(k.kiyi, t.kiyi);
  cizgiAyarla(k.nehirBuyuk, t.nehir);
  cizgiAyarla(k.nehirKucuk, { ...t.nehir, kalinlik: t.nehir.kalinlik * 0.75 });
  cizgiAyarla(k.secimCercevesi, { renk: t.secim, opak: 1, kalinlik: 2.6 });

  const pm = (p: THREE.Points) => p.material as THREE.PointsMaterial;
  pm(k.sehirler).map?.dispose();
  pm(k.baskentler).map?.dispose();
  pm(k.sehirSecimi).map?.dispose();
  pm(k.sehirler).map = daire(t.sehir.dolgu, t.sehir.kenar);
  pm(k.baskentler).map = daire(t.baskent.dolgu, t.baskent.kenar);
  pm(k.sehirSecimi).map = daire("", t.secim, true);
  for (const p of [k.sehirler, k.baskentler, k.sehirSecimi]) pm(p).needsUpdate = true;
}

export function boyutAyarla(k: Katmanlar, w: number, hgt: number, oran: number) {
  for (const l of k.cizgiler) (l.material as LineMaterial).resolution.set(w * oran, hgt * oran);
  (k.sehirler.material as THREE.PointsMaterial).size = 6 * oran;
  (k.baskentler.material as THREE.PointsMaterial).size = 9 * oran;
  (k.sehirSecimi.material as THREE.PointsMaterial).size = 24 * oran;
}

export type Secim =
  | { tur: "devlet"; id: number }
  | { tur: "birim"; id: number }
  | { tur: "sehir"; id: number }
  | null;

// Seçimi uygula: dolgu vurgusu + çerçeve. Önceki vurgu temel renge döner.
export function secimiCiz(k: Katmanlar, h: Harita, t: Tema, s: Secim) {
  const renk = k.dolgu.geometry.getAttribute("color") as THREE.BufferAttribute;
  const dizi = renk.array as Float32Array;
  dizi.set(k.temelRenk);

  let birimler: number[] = [];
  if (s?.tur === "devlet") birimler = h.devletBirimleri[s.id];
  else if (s?.tur === "birim") birimler = [s.id];
  for (const bi of birimler) {
    const bas = k.birimKose[2 * bi] * 3, n = k.birimKose[2 * bi + 1] * 3;
    for (let i = bas; i < bas + n; i++) dizi[i] += (1 - dizi[i]) * t.vurgu;
  }
  renk.needsUpdate = true;

  // Çerçeve: bir yanı seçili kümede, diğer yanı dışarıda olan yaylar
  const kume = new Set(birimler);
  const pts: number[] = [];
  if (kume.size) {
    for (let a = 0; a < h.arklar.length; a++) {
      const ia = kume.has(h.yaySahipA[a]), ib = h.yaySahipB[a] >= 0 && kume.has(h.yaySahipB[a]);
      if (ia !== ib) yayParcalari(h.arklar[a], pts);
    }
  }
  k.secimCercevesi.geometry.dispose();
  k.secimCercevesi.geometry = new LineSegmentsGeometry().setPositions(pts.length ? pts : [0, 0, 0, 0, 0, 0]);
  k.secimCercevesi.visible = pts.length > 0;

  if (s?.tur === "sehir") {
    const c = h.paket.sehirler[s.id];
    const p = k.sehirSecimi.geometry.getAttribute("position") as THREE.BufferAttribute;
    p.setXYZ(0, c.x, c.y, 0);
    p.needsUpdate = true;
    k.sehirSecimi.visible = true;
  } else {
    k.sehirSecimi.visible = false;
  }
}

// Prosedürel parşömen dokusu: yumuşak lekeler (kenarlardan sarılarak döşenebilir) + gren + lifler.
// Değerler ~0.85–1.0; ekran üstü katmanda mix-blend-mode: multiply ile uygulanır (her ölçekte keskin).
export function kagitDokusu(): string {
  const N = 512;
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d")!;
  let tohum = 7;
  const r = () => ((tohum = (tohum * 16807) % 2147483647) / 2147483647);
  g.fillStyle = "rgb(252,248,240)";
  g.fillRect(0, 0, N, N);

  for (let i = 0; i < 90; i++) {
    const x = r() * N, y = r() * N, rad = 30 + r() * 150, a = 0.03 + r() * 0.07;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const cx = x + dx * N, cy = y + dy * N;
      if (cx + rad < 0 || cx - rad > N || cy + rad < 0 || cy - rad > N) continue;
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
      gr.addColorStop(0, `rgba(150,110,60,${a})`);
      gr.addColorStop(1, "rgba(150,110,60,0)");
      g.fillStyle = gr;
      g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    }
  }

  const img = g.getImageData(0, 0, N, N);
  for (let i = 0; i < N * N; i++) {
    const n = (r() - 0.5) * 10;
    for (let k = 0; k < 3; k++) img.data[i * 4 + k] = Math.max(0, Math.min(255, img.data[i * 4 + k] + n));
  }
  g.putImageData(img, 0, 0);

  g.strokeStyle = "rgba(110,80,50,0.07)";
  for (let i = 0; i < 160; i++) {
    const x = r() * N, y = r() * N, a = r() * Math.PI, l = 6 + r() * 26;
    g.lineWidth = 0.4 + r() * 0.8;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a + 0.4) * l * 0.5, y + Math.sin(a + 0.4) * l * 0.5,
      x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  return c.toDataURL("image/png");
}
