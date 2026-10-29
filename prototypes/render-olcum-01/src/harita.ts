// HaritaVerisi → three.js katmanları.
// Katman başına tek çizim çağrısı: dolgu, arazi sınırı, devlet sınırı, kıyı, yerleşim, başkent, seçim.

import * as THREE from "three";
import earcut from "earcut";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import type { HaritaVerisi } from "./veri";

export interface HaritaKatmanlari {
  grup: THREE.Group;
  dolgu: THREE.Mesh;
  araziSiniri: THREE.LineSegments;
  devletSiniri: LineSegments2;
  kiyi: LineSegments2;
  yerlesim: THREE.Points;
  baskent: THREE.Points;
  secim: LineSegments2;
  cizgiMalzemeleri: LineMaterial[];
  hucreKoseBaslangic: Int32Array;
  hucreKoseSayisi: Int32Array;
  orijinalRenk: Float32Array;
  ucgenSayisi: number;
  sureler: Record<string, number>;
}

function daireDokusu(dolgu: string, kenar: string): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  g.beginPath();
  g.arc(32, 32, 26, 0, Math.PI * 2);
  g.fillStyle = dolgu;
  g.fill();
  g.lineWidth = 8;
  g.strokeStyle = kenar;
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function kenarParcalari(pts: Float32Array, hedef: number[]) {
  const m = pts.length / 2;
  for (let j = 0; j < m - 1; j++) {
    hedef.push(pts[2 * j], pts[2 * j + 1], 0, pts[2 * j + 2], pts[2 * j + 3], 0);
  }
}

export function katmanlariKur(v: HaritaVerisi, pikselOrani: number): HaritaKatmanlari {
  const sureler: Record<string, number> = {};
  let t0 = performance.now();

  // --- Dolgu: tüm kara hücreleri tek geometri, köşe renkleriyle
  const hucreKoseBaslangic = new Int32Array(v.hucreSayisi).fill(-1);
  const hucreKoseSayisi = new Int32Array(v.hucreSayisi);
  let toplamKose = 0;
  for (let i = 0; i < v.hucreSayisi; i++) {
    if (!v.kara[i]) continue;
    hucreKoseBaslangic[i] = toplamKose;
    hucreKoseSayisi[i] = v.halkalar[i].length / 2;
    toplamKose += hucreKoseSayisi[i];
  }
  const konum = new Float32Array(toplamKose * 3);
  const renk = new Float32Array(toplamKose * 3);
  const indeksler: number[] = [];
  const devletRenk = v.devletler.map((d) =>
    new THREE.Color().setHSL(d.hsl[0], d.hsl[1], d.hsl[2], THREE.SRGBColorSpace));

  for (let i = 0; i < v.hucreSayisi; i++) {
    if (!v.kara[i]) continue;
    const halka = v.halkalar[i];
    const bas = hucreKoseBaslangic[i];
    const c = devletRenk[v.devletId[i]];
    for (let j = 0; j < halka.length / 2; j++) {
      const k = (bas + j) * 3;
      konum[k] = halka[2 * j];
      konum[k + 1] = halka[2 * j + 1];
      renk[k] = c.r;
      renk[k + 1] = c.g;
      renk[k + 2] = c.b;
    }
    const tri = earcut(halka);
    for (const t of tri) indeksler.push(bas + t);
  }
  sureler.ucgenleme = performance.now() - t0;

  t0 = performance.now();
  const dolguGeo = new THREE.BufferGeometry();
  dolguGeo.setAttribute("position", new THREE.BufferAttribute(konum, 3));
  dolguGeo.setAttribute("color", new THREE.BufferAttribute(renk, 3));
  dolguGeo.setIndex(new THREE.BufferAttribute(Uint32Array.from(indeksler), 1));
  const dolgu = new THREE.Mesh(dolguGeo, new THREE.MeshBasicMaterial({ vertexColors: true }));
  dolgu.renderOrder = 0;

  // --- Sınırlar: kenar türüne göre ayır
  const ic: number[] = [], devlet: number[] = [], kiyiPts: number[] = [];
  for (let e = 0; e < v.kenarNoktalari.length; e++) {
    const a = v.kenarA[e], b = v.kenarB[e];
    const ka = a >= 0 && v.kara[a] === 1;
    const kb = b >= 0 && v.kara[b] === 1;
    if (ka && kb) {
      kenarParcalari(v.kenarNoktalari[e], v.devletId[a] === v.devletId[b] ? ic : devlet);
    } else if (ka !== kb && b >= 0) {
      kenarParcalari(v.kenarNoktalari[e], kiyiPts);
    }
  }

  const araziGeo = new THREE.BufferGeometry();
  araziGeo.setAttribute("position", new THREE.Float32BufferAttribute(ic, 3));
  const araziSiniri = new THREE.LineSegments(araziGeo,
    new THREE.LineBasicMaterial({ color: 0x2a2118, transparent: true, opacity: 0, depthTest: false }));
  araziSiniri.renderOrder = 1;

  const devletMat = new LineMaterial({ color: 0x1d1712, linewidth: 1.8, depthTest: false });
  const devletGeo = new LineSegmentsGeometry().setPositions(devlet);
  const devletSiniri = new LineSegments2(devletGeo, devletMat);
  devletSiniri.renderOrder = 3;

  const kiyiMat = new LineMaterial({ color: 0x3f5f73, linewidth: 1.2, depthTest: false });
  const kiyi = new LineSegments2(new LineSegmentsGeometry().setPositions(kiyiPts), kiyiMat);
  kiyi.renderOrder = 2;

  // --- Yerleşimler (DEC-0007: arazi biriminden ayrı nokta nesnesi)
  const yerPos = new Float32Array(v.yerlesimler.length * 3);
  v.yerlesimler.forEach((h, k) => {
    yerPos[3 * k] = v.noktalar[2 * h];
    yerPos[3 * k + 1] = v.noktalar[2 * h + 1];
  });
  const yerGeo = new THREE.BufferGeometry();
  yerGeo.setAttribute("position", new THREE.BufferAttribute(yerPos, 3));
  const yerlesim = new THREE.Points(yerGeo, new THREE.PointsMaterial({
    size: 6 * pikselOrani, sizeAttenuation: false, map: daireDokusu("#2e261f", "#f3ead8"),
    transparent: true, alphaTest: 0.3, depthTest: false, opacity: 0,
  }));
  yerlesim.renderOrder = 4;

  const bPos = new Float32Array(v.devletler.length * 3);
  v.devletler.forEach((d, k) => {
    bPos[3 * k] = v.noktalar[2 * d.baskent];
    bPos[3 * k + 1] = v.noktalar[2 * d.baskent + 1];
  });
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute("position", new THREE.BufferAttribute(bPos, 3));
  const baskent = new THREE.Points(bGeo, new THREE.PointsMaterial({
    size: 10 * pikselOrani, sizeAttenuation: false, map: daireDokusu("#7a1f1a", "#f3ead8"),
    transparent: true, alphaTest: 0.3, depthTest: false,
  }));
  baskent.renderOrder = 5;

  // --- Seçim çerçevesi (içeriği seçimde doldurulur)
  const secimMat = new LineMaterial({ color: 0xfff6d5, linewidth: 3, depthTest: false });
  const secim = new LineSegments2(new LineSegmentsGeometry(), secimMat);
  secim.renderOrder = 6;
  secim.visible = false;

  const grup = new THREE.Group();
  grup.add(dolgu, araziSiniri, kiyi, devletSiniri, yerlesim, baskent, secim);
  sureler.geometri = performance.now() - t0;

  return {
    grup, dolgu, araziSiniri, devletSiniri, kiyi, yerlesim, baskent, secim,
    cizgiMalzemeleri: [devletMat, kiyiMat, secimMat],
    hucreKoseBaslangic, hucreKoseSayisi,
    orijinalRenk: renk.slice(),
    ucgenSayisi: indeksler.length / 3,
    sureler,
  };
}

// Seçili hücreyi aç renkle vurgula ve çerçevele; -1 seçimi kaldırır.
export function secimiUygula(k: HaritaKatmanlari, v: HaritaVerisi, onceki: number, yeni: number) {
  const renk = k.dolgu.geometry.getAttribute("color") as THREE.BufferAttribute;
  const dizi = renk.array as Float32Array;
  if (onceki >= 0 && k.hucreKoseBaslangic[onceki] >= 0) {
    const b = k.hucreKoseBaslangic[onceki] * 3, s = k.hucreKoseSayisi[onceki] * 3;
    dizi.set(k.orijinalRenk.subarray(b, b + s), b);
  }
  if (yeni >= 0 && k.hucreKoseBaslangic[yeni] >= 0) {
    const b = k.hucreKoseBaslangic[yeni] * 3, s = k.hucreKoseSayisi[yeni] * 3;
    for (let i = b; i < b + s; i++) dizi[i] = dizi[i] + (1 - dizi[i]) * 0.45;
    const halka = v.halkalar[yeni];
    const m = halka.length / 2;
    const pts: number[] = [];
    for (let j = 0; j < m; j++) {
      const n = (j + 1) % m;
      pts.push(halka[2 * j], halka[2 * j + 1], 0, halka[2 * n], halka[2 * n + 1], 0);
    }
    k.secim.geometry.dispose();
    k.secim.geometry = new LineSegmentsGeometry().setPositions(pts);
    k.secim.visible = true;
  } else {
    k.secim.visible = false;
  }
  renk.needsUpdate = true;
}
