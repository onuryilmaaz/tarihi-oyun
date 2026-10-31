// TASK-0024 (A, DEC-0073): modern il biçimli arazi birimleri yerine araziye göre oyun bölgeleri üretir.
// Devlet sınırları ve kıyılar korunur; yalnızca her devletin iç bölünmesi yeniden çizilir:
//   1) devletin birimleri birleştirilir (devlet alanı T);
//   2) T'yi kapsayan ince ızgarada tohumlardan (önce şehirler, sonra en uzak nokta seçimi + dengeleme) araziye göre
//      en kısa yol bölüşümü yapılır; engebe (ETOPO) ve büyük nehirler pahalıdır → sınırlar sırtlara, nehirlere oturur;
//   3) ızgara sınırları ortak köşe konumlarıyla yumuşatılıp sadeleştirilir (komşu iki bölge aynı çizgiyi paylaşır);
//   4) ham bölgeler T ile kesiştirilir (polygon-clipping); yeni kesişim noktaları komşu halkalara da eklenir;
//   5) bütün harita için ortak yaylar yeniden kurulur (topojson-server).
// Bölge sayısı devlet başına girdideki birim sayısı kadardır (en az şehir sayısı). Sahipsiz birimler değişmez.

import polygonClipping from "polygon-clipping";
import { topology } from "topojson-server";

const HEDEF_HUCRE = 70000; // devlet başına ızgara hücresi
const YUMUSATMA = 4; // Laplace turu
const ENGEBE = 25; // eğim çarpanı
const NEHIR = 0.35; // büyük nehre girme bedeli (derece)
const NEHIR_RUTBE = 3; // bu rütbe ve altı büyük nehir (istemcideki nehirBuyuk ile aynı)
const DENGELEME = 3; // tohum dengeleme turu

const D2R = Math.PI / 180;
const millerLat = (y) => (2.5 * (Math.atan(Math.exp((y * D2R) / 1.25)) - Math.PI / 4)) / D2R;

export function bolgeleriUret(harita, etopo, { log = () => {}, pilot = new Set() } = {}) {
  const A = harita.arklar;
  const yay = (r) => {
    const a = A[r < 0 ? ~r : r], p = [];
    for (let i = 0; i < a.length; i += 2) p.push([a[i], a[i + 1]]);
    return r < 0 ? p.reverse() : p;
  };
  const halka = (refs) => { const p = refs.flatMap((r, k) => (k ? yay(r).slice(1) : yay(r))); p.push(p[0]); return p; };
  // Dejenere halkalar (< 3 farklı nokta) polygon-clipping'i bozar
  const birimPoly = harita.birimler.map((b) => b.p.map((poly) => poly.map(halka).filter((h) => h.length >= 4)).filter((poly) => poly.length));

  const sehirler = harita.devletler.map(() => []);
  harita.sehirler.forEach((s, i) => sehirler[s.d]?.push(i));

  const yeniBirimler = []; // { ad, ulke, d, k, mp: MultiPolygon koordinat }
  const yukseklik = etopoOrnekleyici(etopo);
  const nehirler = harita.nehirler.filter((n) => n.r <= NEHIR_RUTBE);

  // Değişmeyen birimler (sahipsiz ya da tek birimli devlet)
  const devletBirimleri = harita.devletler.map(() => []);
  harita.birimler.forEach((b, i) => { if (b.d >= 0) devletBirimleri[b.d].push(i); else yeniBirimler.push({ ...kimlik(b), mp: birimPoly[i] }); });

  const kimlikBul = (liste, ornek) => { // örnek noktaların düştüğü eski birimlerin çoğunluğu (ülke, kaynak)
    const sayac = new Map();
    for (const [x, y] of ornek) {
      const bi = liste.find((i) => birimPoly[i].some((poly) => icinde(poly[0], x, y) && !poly.slice(1).some((h) => icinde(h, x, y))));
      if (bi !== undefined) sayac.set(bi, (sayac.get(bi) ?? 0) + 1);
    }
    return harita.birimler[([...sayac].sort((a, b) => b[1] - a[1])[0] ?? [liste[0]])[0]];
  };

  // TASK-0025 pilot (şehir kipi): pilot devletlerin toprağı birlikte, yalnızca şehir tohumlarıyla bölünür;
  // her toprak şehrinin devletine geçer (devlet sınırı şehir topraklarını izler)
  // TASK-0031: pilot bir Map (devlet → grup) olabilir; her grup ayrı bölünür (dünyayı tek seferde birleştirmek çok ağır)
  const gruplar = new Map();
  for (const [d, g] of pilot instanceof Map ? pilot : [...pilot].map((x) => [x, 0])) {
    (gruplar.get(g) ?? gruplar.set(g, new Set()).get(g)).add(d);
  }
  for (const [g, uyeler] of gruplar) {
    const liste = harita.birimler.map((b, i) => i).filter((i) => uyeler.has(harita.birimler[i].d) && birimPoly[i].length);
    const pSehirler = harita.sehirler.filter((s) => uyeler.has(s.d));
    if (!liste.length || !pSehirler.length) continue;
    const T = polygonClipping.union(...liste.map((i) => birimPoly[i]));
    const sonuc = devletiBol(T, pSehirler.length, pSehirler, yukseklik, nehirler, { sehirKipi: true });
    for (const r of sonuc) {
      const eski = kimlikBul(liste, r.ornek);
      yeniBirimler.push({ ad: r.ad, ulke: eski.ulke, d: r.sehir.d, k: eski.k, s: r.sehir.ad, mp: r.mp });
    }
    log(`grup ${g}: ${uyeler.size} devlet, ${liste.length} birim → ${sonuc.length} şehir toprağı`);
  }

  let degisen = 0;
  harita.devletler.forEach((dv, d) => {
    if (pilot.has(d)) return;
    const liste = devletBirimleri[d].filter((i) => birimPoly[i].length);
    if (!liste.length) return;
    const k = Math.max(liste.length, sehirler[d].length);
    if (liste.length <= 1 && k <= 1) {
      for (const i of liste) yeniBirimler.push({ ...kimlik(harita.birimler[i]), s: harita.sehirler[sehirler[d][0]]?.ad, mp: birimPoly[i] });
      return;
    }
    const T = polygonClipping.union(...liste.filter((i) => birimPoly[i].length).map((i) => birimPoly[i]));
    const sonuc = devletiBol(T, k, sehirler[d].map((i) => harita.sehirler[i]), yukseklik, nehirler);
    for (const r of sonuc) {
      const eski = kimlikBul(liste, r.ornek);
      yeniBirimler.push({ ad: r.ad, ulke: eski.ulke, d, k: eski.k, s: r.sehir?.ad, mp: r.mp });
    }
    degisen++;
    log(`${dv.ad}: ${liste.length} birim → ${sonuc.length} bölge`);
  });

  // T-kavşakları: kesişimde doğan yeni noktalar, üzerinde durdukları bütün halka parçalarına eklenir
  tKavsaklariniDuzelt(yeniBirimler);

  // Ortak yaylar
  const topo = topology({
    b: { type: "GeometryCollection", geometries: yeniBirimler.map((b) => ({ type: "MultiPolygon", coordinates: b.mp })) },
  });
  const arklar = topo.arcs.map((a) => a.flat().map((v) => Math.round(v * 1e4) / 1e4));
  // Sıfır uzunluklu (tek noktalı) yaylar halkalardan atılır
  const bos = arklar.map((a) => a.every((v, i) => v === a[i % 2]));
  const birimler = yeniBirimler.map((b, i) => {
    const g = topo.objects.b.geometries[i];
    const p = (g.type === "MultiPolygon" ? g.arcs : g.type === "Polygon" ? [g.arcs] : [])
      .map((poly) => poly.map((h) => h.filter((r) => !bos[r < 0 ? ~r : r])).filter((h) => h.length)).filter((poly) => poly.length);
    return { ad: b.ad, ulke: b.ulke, d: b.d, k: b.k, ...(b.s ? { s: b.s } : {}), p }; // s: toprağın şehri
  }).filter((b) => b.p.length);
  return { harita: { ...harita, arklar, birimler }, rapor: { devlet: degisen, birim: birimler.length, yay: arklar.length } };
}

const kimlik = ({ p, ...k }) => k;

function icinde(h, x, y) {
  let ic = false;
  for (let i = 0, j = h.length - 1; i < h.length; j = i++) {
    const [xi, yi] = h[i], [xj, yj] = h[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ic = !ic;
  }
  return ic;
}

function etopoOrnekleyici(e) {
  return (x, y) => {
    const lat = millerLat(y);
    const fi = (x - e.lon0) / e.adim, fj = (lat - e.lat0) / e.adim;
    const i = Math.max(0, Math.min(e.nx - 2, Math.floor(fi))), j = Math.max(0, Math.min(e.ny - 2, Math.floor(fj)));
    const u = Math.min(1, Math.max(0, fi - i)), v = Math.min(1, Math.max(0, fj - j));
    const z = (a, b) => Math.max(0, e.z[(j + b) * e.nx + i + a]);
    return z(0, 0) * (1 - u) * (1 - v) + z(1, 0) * u * (1 - v) + z(0, 1) * (1 - u) * v + z(1, 1) * u * v;
  };
}

/** Bir devletin alanını (MultiPolygon) k bölgeye böler; { ad, mp, ornek } listesi döner. */
function devletiBol(T, k, sehirler, yukseklik, nehirler, { sehirKipi = false } = {}) {
  // --- Izgara
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const poly of T) for (const [x, y] of poly[0]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const r = Math.min(0.15, Math.max(0.006, Math.sqrt(((x1 - x0) * (y1 - y0)) / (sehirKipi ? HEDEF_HUCRE * 10 : HEDEF_HUCRE))));
  x0 -= 3 * r; y0 -= 3 * r; x1 += 3 * r; y1 += 3 * r;
  const W = Math.ceil((x1 - x0) / r), H = Math.ceil((y1 - y0) / r), N = W * H;
  const merkez = (c) => [x0 + ((c % W) + 0.5) * r, y0 + (Math.floor(c / W) + 0.5) * r];
  // ic: hücrenin düştüğü kara parçası (T poligonu) + 1. Bölüşüm parçalar arasında atlamaz: dar bir boğaz hücreden
  // ince olsa bile karşı yakadaki şehir bu yakaya toprak alamaz.
  const ic = new Int32Array(N);
  T.forEach((poly, pi) => {
    let py0 = Infinity, py1 = -Infinity;
    for (const [, y] of poly[0]) { py0 = Math.min(py0, y); py1 = Math.max(py1, y); }
    for (let j = Math.max(0, Math.floor((py0 - y0) / r)); j < Math.min(H, Math.ceil((py1 - y0) / r) + 1); j++) {
      const yc = y0 + (j + 0.5) * r, xs = [];
      for (const h of poly) for (let t = 0; t + 1 < h.length; t++) {
        const [ax, ay] = h[t], [bx, by] = h[t + 1];
        if ((ay > yc) !== (by > yc)) xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let t = 0; t + 1 < xs.length; t += 2) {
        const i0 = Math.max(0, Math.ceil((xs[t] - x0) / r - 0.5)), i1 = Math.min(W - 1, Math.floor((xs[t + 1] - x0) / r - 0.5));
        for (let i = i0; i <= i1; i++) ic[j * W + i] = pi + 1;
      }
    }
  });

  // --- Maliyet: yükseklik ve nehir hücreleri
  const z = new Float32Array(N), nehir = new Uint8Array(N);
  for (let c = 0; c < N; c++) if (ic[c]) { const [x, y] = merkez(c); z[c] = yukseklik(x, y); }
  for (const n of nehirler) {
    for (let t = 0; t + 3 < n.p.length; t += 2) {
      const ax = n.p[t], ay = n.p[t + 1], bx = n.p[t + 2], by = n.p[t + 3];
      if (Math.max(ax, bx) < x0 || Math.min(ax, bx) > x1 || Math.max(ay, by) < y0 || Math.min(ay, by) > y1) continue;
      const adim = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / (r * 0.5)));
      for (let s = 0; s <= adim; s++) {
        const i = Math.floor((ax + ((bx - ax) * s) / adim - x0) / r), j = Math.floor((ay + ((by - ay) * s) / adim - y0) / r);
        if (i >= 0 && j >= 0 && i < W && j < H) nehir[j * W + i] = 1;
      }
    }
  }
  const yatay = new Float32Array(H), dikey = new Float32Array(H);
  for (let j = 0; j < H; j++) {
    const la = millerLat(y0 + (j + 0.5) * r);
    yatay[j] = r * Math.cos(la * D2R);
    dikey[j] = Math.abs(millerLat(y0 + (j + 1.5) * r) - la);
  }
  const komsu = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const bedel = (c, n, di, dj) => {
    const j = Math.floor(c / W);
    const d = Math.hypot(di ? yatay[j] : 0, dj ? dikey[j] : 0);
    const egim = Math.abs(z[n] - z[c]) / (d * 111000);
    return d * (1 + ENGEBE * egim) * (1 + Math.max(0, (z[n] - 1500) / 3000)) + (nehir[n] && !nehir[c] ? NEHIR : 0);
  };

  // --- Dijkstra (artımlı: yalnızca iyileşen hücreler)
  const uzak = new Float64Array(N), etiket = new Int32Array(N);
  const yigin = yiginKur();
  const yay = (kaynaklar, yalnizIc) => {
    for (const [c, e] of kaynaklar) { uzak[c] = 0; etiket[c] = e; yigin.it(c, 0); }
    while (yigin.n()) {
      const [c, d0] = yigin.al();
      if (d0 > uzak[c]) continue;
      const i = c % W, j = (c - i) / W;
      for (const [di, dj] of komsu) {
        const ii = i + di, jj = j + dj;
        if (ii < 0 || jj < 0 || ii >= W || jj >= H) continue;
        const n = jj * W + ii;
        if (yalnizIc && ic[n] !== ic[c]) continue; // dışarı ve başka kara parçasına geçilmez
        const dd = d0 + (yalnizIc ? bedel(c, n, di, dj) : Math.hypot(di ? yatay[j] : 0, dj ? dikey[j] : 0));
        if (dd < uzak[n]) { uzak[n] = dd; etiket[n] = etiket[c]; yigin.it(n, dd); }
      }
    }
  };
  const sifirla = () => { uzak.fill(Infinity); etiket.fill(-1); };
  const icHucreler = [];
  for (let c = 0; c < N; c++) if (ic[c]) icHucreler.push(c);
  if (!icHucreler.length) return [{ ad: sehirler[0]?.ad ?? "", mp: T, ornek: [T[0][0][0]] }];
  // Tohum çok küçük kara parçasına (ör. lagün adacığı) konmaz; bölgesi sadeleştirmede kaybolurdu
  const parcaHucre = new Map();
  for (const c of icHucreler) parcaHucre.set(ic[c], (parcaHucre.get(ic[c]) ?? 0) + 1);
  const buyukParca = [...parcaHucre.values()].some((n) => n >= 10);
  const enYakinIc = (x, y, dolu = null) => {
    let en = icHucreler[0], enD = Infinity;
    for (const c of icHucreler) {
      if (dolu?.has(c) || (buyukParca && parcaHucre.get(ic[c]) < 10)) continue;
      const [cx, cy] = merkez(c), dd = (cx - x) ** 2 + (cy - y) ** 2;
      if (dd < enD) { enD = dd; en = c; }
    }
    return en;
  };

  // --- Tohumlar: şehirler sabit; büyük kopuk parçalar (ada) kendi tohumunu alır; kalanı en uzak nokta
  const tohum = [], tohumSehir = [];
  const sabit = new Set();
  const dolu = new Set();
  for (const s of sehirler) {
    const c = enYakinIc(s.x, s.y, sehirKipi ? dolu : null); // şehir kipinde yakın iki şehir ayrı hücre alır
    if (tohum.includes(c)) continue;
    dolu.add(c);
    sabit.add(tohum.length); tohum.push(c); tohumSehir.push(s);
  }
  if (sehirKipi) k = tohum.length; // yalnızca şehirler; şehirsiz adalar en yakın şehre düşer
  sifirla();
  if (tohum.length) yay(tohum.map((c, e) => [c, e]), true);
  const ortalama = icHucreler.length / k;
  // Ulaşılamayan bileşenler (adalar): büyükse tohum
  for (;;) {
    if (tohum.length >= k) break;
    const ulasilmamis = icHucreler.find((c) => etiket[c] === -1);
    if (ulasilmamis === undefined) break;
    const bilesen = [], kuyruk = [ulasilmamis], gor = new Set([ulasilmamis]);
    while (kuyruk.length) {
      const c = kuyruk.pop(); bilesen.push(c);
      const i = c % W, j = (c - i) / W;
      for (const [di, dj] of komsu) {
        const n = (j + dj) * W + i + di;
        if (i + di >= 0 && i + di < W && j + dj >= 0 && j + dj < H && ic[n] === ic[c] && !gor.has(n)) { gor.add(n); kuyruk.push(n); }
      }
    }
    if (bilesen.length < ortalama * 0.4 && tohum.length) { for (const c of bilesen) { etiket[c] = -2; } continue; } // küçük ada: sonra en yakına
    const c = bilesen[Math.floor(bilesen.length / 2)];
    yay([[c, tohum.length]], true); tohum.push(c);
  }
  for (const c of icHucreler) if (etiket[c] === -2) etiket[c] = -1;
  while (tohum.length < k) {
    let en = -1, enD = -1;
    for (const c of icHucreler) if (uzak[c] !== Infinity && uzak[c] > enD) { enD = uzak[c]; en = c; }
    if (en < 0 || enD === 0) break;
    yay([[en, tohum.length]], true); tohum.push(en);
  }
  // Dengeleme: şehir olmayan tohumlar bölgelerinin ağırlık merkezine en yakın iç hücreye kayar
  for (let tur = 0; tur < DENGELEME; tur++) {
    const sx = new Float64Array(tohum.length), sy = new Float64Array(tohum.length), sn = new Float64Array(tohum.length);
    for (const c of icHucreler) { const e = etiket[c]; if (e < 0) continue; const [x, y] = merkez(c); sx[e] += x; sy[e] += y; sn[e]++; }
    const bolgeHucresi = tohum.map(() => []);
    for (const c of icHucreler) if (etiket[c] >= 0) bolgeHucresi[etiket[c]].push(c);
    tohum.forEach((t, e) => {
      if (sabit.has(e) || !sn[e]) return;
      const mx = sx[e] / sn[e], my = sy[e] / sn[e];
      let en = t, enD = Infinity;
      for (const c of bolgeHucresi[e]) { const [x, y] = merkez(c); const dd = (x - mx) ** 2 + (y - my) ** 2; if (dd < enD) { enD = dd; en = c; } }
      tohum[e] = en;
    });
    sifirla();
    yay(tohum.map((c, e) => [c, e]), true);
  }
  // Ulaşılmamış iç hücreler ve dış hücreler: düz uzaklıkla en yakın bölge (yalnızca ham alanı kapatmak için)
  const etiketli = [];
  for (let c = 0; c < N; c++) if (etiket[c] >= 0) { etiketli.push([c, etiket[c]]); }
  const icEtiket = etiket.slice();
  uzak.fill(Infinity);
  for (const [c] of etiketli) uzak[c] = 0;
  for (const [c, e] of etiketli) yigin.it(c, 0), (etiket[c] = e);
  yay([], false);

  // --- Ham bölge sınırları: hücre kenarları; köşe grafı, Laplace yumuşatma, ortak sadeleştirme
  const K = (i, j) => j * (W + 1) + i; // köşe indeksi
  const lab = (i, j) => (i < 0 || j < 0 || i >= W || j >= H ? -1 : etiket[j * W + i]);
  const kenarlar = []; // [köşeA, köşeB, soldaki etiket, sağdaki etiket]
  for (let j = -1; j < H; j++) for (let i = -1; i < W; i++) {
    const a = lab(i, j), sag = lab(i + 1, j), ust = lab(i, j + 1);
    // dikey kenar x=i+1, (i+1,j)→(i+1,j+1): sol a, sağ sag
    if (j >= 0 && a !== sag) kenarlar.push([K(i + 1, j), K(i + 1, j + 1), a, sag]);
    // yatay kenar y=j+1, (i+1,j+1)→(i,j+1): sol a (altta), sağ ust
    if (i >= 0 && a !== ust) kenarlar.push([K(i + 1, j + 1), K(i, j + 1), a, ust]);
  }
  const derece = new Map(), bag = new Map();
  for (const [a, b] of kenarlar) {
    derece.set(a, (derece.get(a) ?? 0) + 1); derece.set(b, (derece.get(b) ?? 0) + 1);
    (bag.get(a) ?? bag.set(a, []).get(a)).push(b); (bag.get(b) ?? bag.set(b, []).get(b)).push(a);
  }
  const konum = new Map();
  for (const c of derece.keys()) konum.set(c, [x0 + (c % (W + 1)) * r, y0 + Math.floor(c / (W + 1)) * r]);
  const kavsak = (c) => derece.get(c) !== 2 || c % (W + 1) === 0 || c % (W + 1) === W || c < W + 1 || c >= H * (W + 1);
  for (let tur = 0; tur < YUMUSATMA; tur++) {
    const yeni = new Map();
    for (const [c, p] of konum) {
      if (kavsak(c)) { yeni.set(c, p); continue; }
      const [a, b] = bag.get(c), pa = konum.get(a), pb = konum.get(b);
      yeni.set(c, [(pa[0] + pb[0] + 2 * p[0]) / 4, (pa[1] + pb[1] + 2 * p[1]) / 4]);
    }
    for (const [c, p] of yeni) konum.set(c, p);
  }
  // Zincirler (kavşaktan kavşağa) üzerinde Douglas–Peucker: tutulan köşeler ortak
  const tut = new Set([...derece.keys()].filter(kavsak));
  const gezildi = new Set();
  const zincirIsle = (z) => {
    const dp = (a, b, zorla = false) => {
      const [ax, ay] = konum.get(z[a]), [bx, by] = konum.get(z[b]);
      let en = -1, enD = 0;
      for (let t = a + 1; t < b; t++) {
        const [px, py] = konum.get(z[t]);
        const l = Math.hypot(bx - ax, by - ay) || 1e-12;
        const dd = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / l;
        if (dd > enD) { enD = dd; en = t; }
      }
      if (en >= 0 && (zorla || enD > r * 0.35)) { tut.add(z[en]); dp(a, en); dp(en, b); }
    };
    dp(0, z.length - 1, true); // iki zincirli halka iki noktaya çökmesin
  };
  const ziyaret = new Set();
  const kavsaklar = [...tut];
  for (const s of kavsaklar) for (const n of bag.get(s)) {
    if (gezildi.has(`${s},${n}`)) continue;
    const z = [s];
    let onceki = s, c = n;
    while (!kavsak(c)) {
      z.push(c); ziyaret.add(c);
      const sonraki = bag.get(c).find((x) => x !== onceki);
      onceki = c; c = sonraki;
    }
    z.push(c);
    gezildi.add(`${s},${z[1]}`); gezildi.add(`${c},${z[z.length - 2]}`);
    zincirIsle(z);
  }
  // Kavşaksız kapalı halkalar (bir bölgenin içinde kalan bölge): bir köşeyi kavşak say
  for (const c of derece.keys()) {
    if (kavsak(c) || ziyaret.has(c)) continue;
    tut.add(c);
    const z = [c];
    let onceki = c, x = bag.get(c)[0];
    while (x !== c) { z.push(x); ziyaret.add(x); const s2 = bag.get(x).find((y) => y !== onceki); onceki = x; x = s2; }
    z.push(c);
    zincirIsle(z);
  }

  // Etiket başına yönlü kenarlardan halkalar
  const cikis = new Map(); // etiket → köşe → hedef köşeler
  const ekle = (e, a, b) => { if (e < 0) return; const m = cikis.get(e) ?? cikis.set(e, new Map()).get(e); (m.get(a) ?? m.set(a, []).get(a)).push(b); };
  for (const [a, b, sol, sag] of kenarlar) { ekle(sol, a, b); ekle(sag, b, a); }
  // Etiketin hücrelerinin bulunduğu kara parçaları
  const parcaEtiket = new Map(), etiketliParca = new Set();
  for (const c of icHucreler) {
    const e = icEtiket[c];
    if (e < 0) continue;
    (parcaEtiket.get(e) ?? parcaEtiket.set(e, new Set()).get(e)).add(ic[c]);
    etiketliParca.add(ic[c]);
  }
  const sonuc = [];
  for (const [e, m] of cikis) {
    const halkalar = [];
    for (const bas of m.keys()) {
      while (m.get(bas)?.length) {
        const h = [];
        let c = bas, onceki = -1;
        do {
          if (tut.has(c)) h.push(konum.get(c));
          const l = m.get(c);
          // Kıstak köşesinde (iki çıkış) en keskin sol dönüş: bölge solda kaldığı için döngüler ayrı kalır
          let s2 = l.length - 1;
          if (l.length > 1 && onceki >= 0) {
            const gx = c % (W + 1) - onceki % (W + 1), gy = Math.floor(c / (W + 1)) - Math.floor(onceki / (W + 1));
            let en = -Infinity;
            l.forEach((n, t) => {
              const nx = n % (W + 1) - c % (W + 1), ny = Math.floor(n / (W + 1)) - Math.floor(c / (W + 1));
              const aci = Math.atan2(gx * ny - gy * nx, gx * nx + gy * ny);
              if (aci > en) { en = aci; s2 = t; }
            });
          }
          const n = l.splice(s2, 1)[0];
          onceki = c; c = n;
        } while (c !== bas || m.get(c)?.length && false);
        if (h.length >= 3) { h.push(h[0]); halkalar.push(h); }
      }
    }
    // Bölge solda kalacak yönde izlendi: pozitif alanlı halka dış, negatif alanlı delik
    const isaretli = (h) => { let t = 0; for (let i = 0; i + 1 < h.length; i++) t += h[i][0] * h[i + 1][1] - h[i + 1][0] * h[i][1]; return t / 2; };
    const dislar = halkalar.filter((h) => isaretli(h) > 0), delikler = halkalar.filter((h) => isaretli(h) < 0);
    let ham = dislar.length ? polygonClipping.union(...dislar.map((h) => [h])) : [];
    if (ham.length && delikler.length) ham = polygonClipping.difference(ham, ...delikler.map((h) => [h]));
    // Bölge yalnızca kendi hücrelerinin bulunduğu kara parçalarıyla (ve hiç bölgesi olmayan adalarla) kesişir;
    // böylece dar bir boğazın karşı kıyısındaki, hücreye düşmeyen ince kıyı şeridi bu bölgeye geçmez
    const parcalar = parcaEtiket.get(e) ?? new Set();
    const izinli = T.filter((_, pi) => parcalar.has(pi + 1) || !etiketliParca.has(pi + 1));
    const mp = izinli.length && ham.length ? polygonClipping.intersection(izinli, ham) : [];
    if (!mp.length) continue;
    const ornek = [];
    for (const c of icHucreler) if (icEtiket[c] === e && ornek.length < 40) ornek.push(merkez(c));
    sonuc.push({ e, mp, ornek: ornek.length ? ornek : [mp[0][0][0]], parcalar });
  }
  // Boşluklar (kara parçasının hiçbir bölgeye düşmeyen ince kıyı şeritleri): aynı kara parçasındaki en yakın bölgeye
  // Kara parçası başına küçük fark işlemleri (tek büyük işlem polygon-clipping'de sayısal hataya düşebiliyor)
  T.forEach((P, pi) => {
    const adaylar = sonuc.filter((b) => b.parcalar.has(pi + 1));
    if (!adaylar.length) return;
    let bosluk;
    try { bosluk = polygonClipping.difference([P], ...adaylar.map((b) => b.mp)); } catch { return; }
    for (const g of bosluk) {
      const [gx, gy] = g[0][0];
      const uzaklik = (b) => {
        let en = Infinity;
        for (const poly of b.mp) for (const [x, y] of poly[0]) en = Math.min(en, (x - gx) ** 2 + (y - gy) ** 2);
        return en;
      };
      const hedef = adaylar.reduce((a, b) => (uzaklik(b) < uzaklik(a) ? b : a));
      try { hedef.mp = polygonClipping.union(hedef.mp, [g]); } catch { /* sayısal hata: şerit boş kalır */ }
    }
  });
  // Adlar
  const yon = (dx, dy) => ["doğusu", "kuzeydoğusu", "kuzeyi", "kuzeybatısı", "batısı", "güneybatısı", "güneyi", "güneydoğusu"][((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8];
  const kullanilan = new Map();
  for (const b of sonuc) {
    const [cx, cy] = b.ornek.reduce((a, p) => [a[0] + p[0] / b.ornek.length, a[1] + p[1] / b.ornek.length], [0, 0]);
    const sehir = sehirler.find((s) => b.mp.some((poly) => icinde(poly[0], s.x, s.y) && !poly.slice(1).some((h) => icinde(h, s.x, s.y))));
    let ad;
    // Şehir tohumundan büyüyen bölge o şehrindir (şehrin noktası lagünde/kıyı dışında olsa bile)
    if (tohumSehir[b.e]) { b.sehir = tohumSehir[b.e]; b.ad = b.sehir.ad; continue; }
    if (sehir) ad = sehir.ad;
    else if (sehirler.length) {
      const en = sehirler.reduce((a, s) => ((s.x - cx) ** 2 + (s.y - cy) ** 2 < (a.x - cx) ** 2 + (a.y - cy) ** 2 ? s : a));
      ad = `${en.ad} ${yon(cx - en.x, cy - en.y)}`;
    } else ad = "Bölge";
    const n = (kullanilan.get(ad) ?? 0) + 1;
    kullanilan.set(ad, n);
    b.ad = n > 1 ? `${ad} ${n}` : ad;
  }
  return sonuc;
}

/** Kesişimde doğan noktalar başka halkaların parçaları üzerindeyse oraya da eklenir (ortak yay için şart). */
function tKavsaklariniDuzelt(birimler) {
  const sayac = new Map();
  const anahtar = (p) => `${p[0]},${p[1]}`;
  for (const b of birimler) for (const poly of b.mp) for (const h of poly) for (let i = 0; i + 1 < h.length; i++) sayac.set(anahtar(h[i]), (sayac.get(anahtar(h[i])) ?? 0) + 1);
  // Aday: tek halkada görülen noktalar (komşu tarafta eksik olabilir)
  const G = 0.05, izgara = new Map();
  for (const [k, n] of sayac) {
    if (n !== 1) continue;
    const [x, y] = k.split(",").map(Number);
    const g = `${Math.floor(x / G)},${Math.floor(y / G)}`;
    (izgara.get(g) ?? izgara.set(g, []).get(g)).push([x, y]);
  }
  let eklenen = 0;
  for (const b of birimler) for (const poly of b.mp) for (let hi = 0; hi < poly.length; hi++) {
    const h = poly[hi], yeni = [h[0]];
    for (let i = 0; i + 1 < h.length; i++) {
      const [ax, ay] = h[i], [bx, by] = h[i + 1];
      const ara = [];
      for (let gx = Math.floor(Math.min(ax, bx) / G); gx <= Math.floor(Math.max(ax, bx) / G); gx++) for (let gy = Math.floor(Math.min(ay, by) / G); gy <= Math.floor(Math.max(ay, by) / G); gy++) {
        for (const p of izgara.get(`${gx},${gy}`) ?? []) {
          const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
          if (!l2) continue;
          const t = ((p[0] - ax) * dx + (p[1] - ay) * dy) / l2;
          if (t <= 1e-9 || t >= 1 - 1e-9) continue;
          const cx = ax + t * dx - p[0], cy = ay + t * dy - p[1];
          if (cx * cx + cy * cy < 1e-16) ara.push([t, p]);
        }
      }
      ara.sort((a, b) => a[0] - b[0]);
      for (const [, p] of ara) { yeni.push(p); eklenen++; }
      yeni.push(h[i + 1]);
    }
    poly[hi] = yeni;
  }
  return eklenen;
}

function yiginKur() {
  let h = new Int32Array(1 << 16), u = new Float64Array(1 << 16), n = 0;
  return {
    n: () => n,
    it(c, d) {
      if (n === h.length) { const a = new Int32Array(n * 2); a.set(h); h = a; const b = new Float64Array(n * 2); b.set(u); u = b; }
      let i = n++;
      while (i > 0) { const p = (i - 1) >> 1; if (u[p] <= d) break; h[i] = h[p]; u[i] = u[p]; i = p; }
      h[i] = c; u[i] = d;
    },
    al() {
      const c = h[0], d0 = u[0], sc = h[--n], sd = u[n];
      let i = 0;
      for (;;) {
        let k = 2 * i + 1;
        if (k >= n) break;
        if (k + 1 < n && u[k + 1] < u[k]) k++;
        if (u[k] >= sd) break;
        h[i] = h[k]; u[i] = u[k]; i = k;
      }
      h[i] = sc; u[i] = sd;
      return [c, d0];
    },
  };
}
