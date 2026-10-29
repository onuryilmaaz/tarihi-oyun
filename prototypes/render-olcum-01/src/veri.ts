// Sentetik harita verisi üretimi. Gerçek tarihî veri DEĞİLDİR; yalnızca render ölçümü içindir.
// Arazi birimleri: Voronoi hücreleri + paylaşılan kenarlarda tutarlı kırılma (DEC-0007'deki
// poligon arazi birimine benzer, içbükey ve düzensiz sınırlar üretmek için).

import { Delaunay } from "d3-delaunay";
import { fbmGurultu, mulberry32, metinHash } from "./rng";

export interface Devlet {
  ad: string;
  hsl: [number, number, number];
  baskent: number; // hücre indeksi
}

export interface HaritaVerisi {
  W: number;
  H: number;
  hucreSayisi: number; // kara + deniz
  karaSayisi: number;
  noktalar: Float64Array; // x0,y0,x1,y1,...
  kara: Uint8Array;
  devletId: Int32Array; // denizde -1
  halkalar: Float32Array[]; // hücre sınırı, düz xy, kapanmamış
  kenarA: Int32Array;
  kenarB: Int32Array; // tek komşulu (dünya kenarı) ise -1
  kenarNoktalari: Float32Array[];
  devletler: Devlet[];
  yerlesimler: Int32Array;
  delaunay: Delaunay<Float64Array>;
  ortHucreBoyu: number;
  sureler: Record<string, number>;
}

const HECELER = ["ka", "ve", "lor", "dan", "mi", "ra", "tu", "sel", "bar", "no", "is", "ar",
  "ze", "kor", "al", "um", "ten", "ha", "fi", "ros", "do", "vel", "sa", "mer"];

function adUret(rnd: () => number): string {
  const n = 2 + Math.floor(rnd() * 2);
  let s = "";
  for (let i = 0; i < n; i++) s += HECELER[Math.floor(rnd() * HECELER.length)];
  return s[0].toLocaleUpperCase("tr") + s.slice(1);
}

export function haritaUret(karaHedef: number, tohum: number): HaritaVerisi {
  const W = 4000, H = 2000;
  const sureler: Record<string, number> = {};
  let t0 = performance.now();
  const rnd = mulberry32(tohum);
  const kitaGurultu = fbmGurultu(tohum * 7 + 1);
  const yogunlukGurultu = fbmGurultu(tohum * 13 + 5);

  const karaMi = (x: number, y: number) => {
    const u = x / W, v = y / H;
    const enlem = Math.abs(v - 0.5) * 2;
    return kitaGurultu(u, v) - Math.max(0, enlem - 0.75) * 0.8 > 0.53;
  };

  // 1) Noktalar: karada yoğunluğa bağlı, denizde seyrek
  const xs: number[] = [], ys: number[] = [], karaList: number[] = [];
  let karaN = 0, denizN = 0;
  const denizHedef = Math.round(karaHedef * 0.35);
  let deneme = 0, karaIsabet = 0;
  while ((karaN < karaHedef || denizN < denizHedef) && deneme < karaHedef * 200) {
    deneme++;
    const x = rnd() * W, y = rnd() * H;
    if (karaMi(x, y)) {
      karaIsabet++;
      if (karaN >= karaHedef) continue;
      const yog = 0.15 + 0.85 * Math.pow(yogunlukGurultu(x / W, y / H), 2) * 2;
      if (rnd() > yog) continue;
      karaN++;
      karaList.push(1);
    } else {
      if (denizN >= denizHedef) continue;
      denizN++;
      karaList.push(0);
    }
    xs.push(x);
    ys.push(y);
  }
  const N = xs.length;
  const noktalar = new Float64Array(N * 2);
  for (let i = 0; i < N; i++) {
    noktalar[2 * i] = xs[i];
    noktalar[2 * i + 1] = ys[i];
  }
  const kara = Uint8Array.from(karaList);
  sureler.noktalar = performance.now() - t0;

  // 2) Voronoi
  t0 = performance.now();
  const delaunay = new Delaunay(noktalar);
  const voronoi = delaunay.voronoi([0, 0, W, H]);
  sureler.voronoi = performance.now() - t0;

  // 3) Devletler: rastgele sınır sırasıyla çok kaynaklı büyüme → düzensiz şekiller
  t0 = performance.now();
  const devletId = new Int32Array(N).fill(-1);
  const devletler: Devlet[] = [];
  const devletSayisi = Math.max(20, Math.round(karaN / 45));
  const karaIndeksleri: number[] = [];
  for (let i = 0; i < N; i++) if (kara[i]) karaIndeksleri.push(i);

  const sinir: number[] = [];
  const devletAc = (hucre: number) => {
    const id = devletler.length;
    devletler.push({ ad: adUret(rnd), hsl: [0, 0, 0], baskent: hucre });
    devletId[hucre] = id;
    sinir.push(hucre);
  };
  const buyut = () => {
    while (sinir.length) {
      const k = Math.floor(rnd() * sinir.length);
      const h = sinir[k];
      sinir[k] = sinir[sinir.length - 1];
      sinir.pop();
      for (const n of delaunay.neighbors(h)) {
        if (kara[n] && devletId[n] < 0) {
          devletId[n] = devletId[h];
          sinir.push(n);
        }
      }
    }
  };
  for (let s = 0; s < devletSayisi; s++) {
    const h = karaIndeksleri[Math.floor(rnd() * karaIndeksleri.length)];
    if (devletId[h] < 0) devletAc(h);
  }
  buyut();
  for (const h of karaIndeksleri) {
    if (devletId[h] < 0) { // erişilemeyen adalar
      devletAc(h);
      buyut();
    }
  }

  // Renk: komşulardan ton olarak en uzak adayı seç
  const komsuDevletler: Set<number>[] = devletler.map(() => new Set());
  for (const h of karaIndeksleri) {
    for (const n of delaunay.neighbors(h)) {
      if (kara[n] && devletId[n] !== devletId[h]) komsuDevletler[devletId[h]].add(devletId[n]);
    }
  }
  const tonFarki = (a: number, b: number) => {
    const d = Math.abs(a - b) % 1;
    return Math.min(d, 1 - d);
  };
  devletler.forEach((d, id) => {
    let enIyi = rnd(), enIyiSkor = -1;
    for (let k = 0; k < 16; k++) {
      const aday = rnd();
      let skor = 1;
      for (const n of komsuDevletler[id]) {
        if (n < id) skor = Math.min(skor, tonFarki(aday, devletler[n].hsl[0]));
      }
      if (skor > enIyiSkor) { enIyiSkor = skor; enIyi = aday; }
    }
    d.hsl = [enIyi, 0.38 + rnd() * 0.2, 0.6 + rnd() * 0.12];
  });
  sureler.devletler = performance.now() - t0;

  // 4) Kenarlar ve kırılmış hücre halkaları
  t0 = performance.now();
  const karaAlani = W * H * (karaIsabet / Math.max(1, deneme));
  const ortHucreBoyu = Math.sqrt(karaAlani / Math.max(1, karaN));
  const kenarIndeks = new Map<string, number>();
  const kenarAList: number[] = [], kenarBList: number[] = [];
  const kenarNoktalari: Float32Array[] = [];
  const halkalar: Float32Array[] = new Array(N);
  const ust = 1e-6;
  const dunyaKenarinda = (ax: number, ay: number, bx: number, by: number) =>
    (Math.abs(ax) < ust && Math.abs(bx) < ust) || (Math.abs(ax - W) < ust && Math.abs(bx - W) < ust) ||
    (Math.abs(ay) < ust && Math.abs(by) < ust) || (Math.abs(ay - H) < ust && Math.abs(by - H) < ust);

  const kenarOlustur = (ax: number, ay: number, bx: number, by: number, anahtar: string) => {
    const dx = bx - ax, dy = by - ay;
    const uzunluk = Math.hypot(dx, dy);
    const parca = dunyaKenarinda(ax, ay, bx, by)
      ? 1
      : Math.min(6, Math.max(1, Math.round(uzunluk / (ortHucreBoyu * 0.2))));
    const pts = new Float32Array((parca + 1) * 2);
    const r = mulberry32(metinHash(anahtar));
    const nx = -dy / (uzunluk || 1), ny = dx / (uzunluk || 1);
    const genlik = 0.12 * uzunluk;
    for (let j = 0; j <= parca; j++) {
      const t = j / parca;
      const sapma = j === 0 || j === parca ? 0 : (r() * 2 - 1) * genlik * Math.sin(Math.PI * t);
      pts[2 * j] = ax + dx * t + nx * sapma;
      pts[2 * j + 1] = ay + dy * t + ny * sapma;
    }
    return pts;
  };

  for (let i = 0; i < N; i++) {
    const poli = voronoi.cellPolygon(i);
    if (!poli) {
      halkalar[i] = new Float32Array(0);
      continue;
    }
    const halka: number[] = [];
    for (let k = 0; k < poli.length - 1; k++) {
      const [ax, ay] = poli[k];
      const [bx, by] = poli[k + 1];
      const ka = `${ax.toFixed(3)},${ay.toFixed(3)}`;
      const kb = `${bx.toFixed(3)},${by.toFixed(3)}`;
      if (ka === kb) continue;
      const ters = ka > kb; // kanonik yön: komşu hücre aynı noktaları üretsin
      const anahtar = ters ? `${kb}|${ka}` : `${ka}|${kb}`;
      let e = kenarIndeks.get(anahtar);
      if (e === undefined) {
        e = kenarNoktalari.length;
        kenarIndeks.set(anahtar, e);
        kenarNoktalari.push(ters ? kenarOlustur(bx, by, ax, ay, anahtar) : kenarOlustur(ax, ay, bx, by, anahtar));
        kenarAList.push(i);
        kenarBList.push(-1);
      } else {
        kenarBList[e] = i;
      }
      const p = kenarNoktalari[e];
      const m = p.length / 2;
      // son noktayı ekleme; bir sonraki kenarın ilk noktası olacak
      if (!ters) for (let j = 0; j < m - 1; j++) halka.push(p[2 * j], p[2 * j + 1]);
      else for (let j = m - 1; j > 0; j--) halka.push(p[2 * j], p[2 * j + 1]);
    }
    halkalar[i] = Float32Array.from(halka);
  }
  sureler.kenarlar = performance.now() - t0;

  const yerlesimList: number[] = [];
  for (const h of karaIndeksleri) if (rnd() < 0.3) yerlesimList.push(h);

  return {
    W, H,
    hucreSayisi: N,
    karaSayisi: karaN,
    noktalar,
    kara,
    devletId,
    halkalar,
    kenarA: Int32Array.from(kenarAList),
    kenarB: Int32Array.from(kenarBList),
    kenarNoktalari,
    devletler,
    yerlesimler: Int32Array.from(yerlesimList),
    delaunay,
    ortHucreBoyu,
    sureler,
  };
}

// Nokta hücre halkasının içinde mi? (çift-tek kuralı)
export function halkaIcinde(halka: Float32Array, x: number, y: number): boolean {
  let ic = false;
  const m = halka.length / 2;
  for (let i = 0, j = m - 1; i < m; j = i++) {
    const xi = halka[2 * i], yi = halka[2 * i + 1];
    const xj = halka[2 * j], yj = halka[2 * j + 1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ic = !ic;
  }
  return ic;
}

// Ekran noktasındaki hücre: en yakın merkez + komşularında kesin poligon testi
export function hucreBul(v: HaritaVerisi, x: number, y: number, ipucu = 0): number {
  const aday = v.delaunay.find(x, y, ipucu);
  if (halkaIcinde(v.halkalar[aday], x, y)) return aday;
  for (const n of v.delaunay.neighbors(aday)) if (halkaIcinde(v.halkalar[n], x, y)) return n;
  return aday;
}
