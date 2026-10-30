// TASK-0023 (2. teslim, DEC-0072): deniz bölgeleri için seçilebilir alan geometrisi üretir.
// Deniz bölgeleri deniz.json'da yalnızca merkez nokta + komşuluk olarak tutulur. Burada dış veri kullanmadan,
// harita karasından alan türetilir: kara (birimler + göller) bir ızgaraya işlenir, her bölge merkezinden SU
// üzerinden yayılınır (en kısa su yolu; Karadeniz karanın üstünden Akdeniz'e taşmaz, boğazlar doğal sınır olur),
// her bölgenin hücrelerinden kontur çıkarılıp yumuşatılır. Alanlar kıyıda karanın 2 hücre altına uzatılır;
// istemci onları karanın altına çizdiği için kıyı çizgisi kara verisinden gelir. Bölge merkezine EN_UZAK'tan
// uzak açık okyanus hiçbir bölgeye ait değildir.
// Çıktı (harita koordinatı: x = boylam, y = Miller y, derece):
//   alanlar: [{ id, ad, p: [[dış halka [x,y,...], delik...], ...] }]  — deniz.json bölge sırasıyla
//   sinirlar: [{ a, b, p: [x,y,x,y,...] }, ...]                     — a ile b bölgesi arasındaki açık su sınırı

const R = 0.15; // ızgara adımı (derece)
const EN_UZAK = 15; // derece (≈ 1650 km)
const KIYI_TASMA = 2; // hücre
// Dar boğazla açılan küçük denizlerin büyük komşuya taşmaması için yayılma maliyeti çarpanı (ör. Azak Kerç'ten
// Doğu Karadeniz'e yayılmasın). Sınırların yeri elle ayarlanacaksa buradan yapılır.
const MALIYET_CARPANI = { azak: 4 };

const millerY = (lat) => (1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * (lat * Math.PI / 180)))) * 180 / Math.PI;
const millerLat = (y) => (2.5 * (Math.atan(Math.exp((y * Math.PI / 180) / 1.25)) - Math.PI / 4)) * 180 / Math.PI;

export function denizAlanlariUret(harita, deniz) {
  const { x0, x1, y0, y1 } = harita.dunya;
  const W = Math.ceil((x1 - x0) / R), H = Math.ceil((y1 - y0) / R);
  const kara = new Uint8Array(W * H);

  // --- Kara ızgarası: her poligon kendi tek-çift kuralıyla taranır (üst üste binen kaynak poligonlar zararsız)
  const A = harita.arklar;
  const halka = (refs) => {
    const out = [];
    refs.forEach((r, k) => {
      const a = A[r < 0 ? ~r : r], p = [];
      for (let i = 0; i < a.length; i += 2) p.push(a[i], a[i + 1]);
      if (r < 0) for (let i = 0, j = p.length - 2; i < j; i += 2, j -= 2) { [p[i], p[j]] = [p[j], p[i]]; [p[i + 1], p[j + 1]] = [p[j + 1], p[i + 1]]; }
      out.push(...(k === 0 ? p : p.slice(2)));
    });
    return out;
  };
  const tara = (halkalar) => {
    let ymin = Infinity, ymax = -Infinity;
    for (const h of halkalar) for (let i = 1; i < h.length; i += 2) { ymin = Math.min(ymin, h[i]); ymax = Math.max(ymax, h[i]); }
    const j0 = Math.max(0, Math.ceil((ymin - y0) / R - 0.5)), j1 = Math.min(H - 1, Math.floor((ymax - y0) / R - 0.5));
    for (let j = j0; j <= j1; j++) {
      const yc = y0 + (j + 0.5) * R, xs = [];
      for (const h of halkalar) {
        const n = h.length;
        for (let i = 0; i < n; i += 2) {
          const ax = h[i], ay = h[i + 1], bx = h[(i + 2) % n], by = h[(i + 3) % n];
          if ((ay > yc) !== (by > yc)) xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax));
        }
      }
      xs.sort((a, b) => a - b);
      for (let t = 0; t + 1 < xs.length; t += 2) {
        const i0 = Math.max(0, Math.ceil((xs[t] - x0) / R - 0.5)), i1 = Math.min(W - 1, Math.floor((xs[t + 1] - x0) / R - 0.5));
        for (let i = i0; i <= i1; i++) kara[j * W + i] = 1;
      }
    }
  };
  for (const b of harita.birimler) for (const poly of b.p) tara(poly.map(halka));
  for (const g of harita.goller) tara(g);

  // --- Çok kaynaklı en kısa su yolu (Dijkstra, 8 komşu; yatay adım enleme göre kısalır)
  const carpan = deniz.bolgeler.map((b) => MALIYET_CARPANI[b.id] ?? 1);
  const etiket = new Int16Array(W * H).fill(-1);
  const uzak = new Float32Array(W * H).fill(Infinity);
  const yatay = new Float32Array(H), dikey = new Float32Array(H);
  for (let j = 0; j < H; j++) {
    const la = millerLat(y0 + (j + 0.5) * R);
    yatay[j] = R * Math.cos(la * Math.PI / 180);
    dikey[j] = Math.abs(millerLat(y0 + (j + 1.5) * R) - la);
  }
  // İkili yığın (hücre, uzaklık)
  let yh = new Int32Array(1 << 16), yu = new Float32Array(1 << 16), yn = 0;
  const it = (c, d) => {
    if (yn === yh.length) { const a = new Int32Array(yn * 2); a.set(yh); yh = a; const b = new Float32Array(yn * 2); b.set(yu); yu = b; }
    let i = yn++;
    while (i > 0) { const p = (i - 1) >> 1; if (yu[p] <= d) break; yh[i] = yh[p]; yu[i] = yu[p]; i = p; }
    yh[i] = c; yu[i] = d;
  };
  const al = () => {
    const c = yh[0], sc = yh[--yn], sd = yu[yn];
    let i = 0;
    for (;;) {
      let k = 2 * i + 1;
      if (k >= yn) break;
      if (k + 1 < yn && yu[k + 1] < yu[k]) k++;
      if (yu[k] >= sd) break;
      yh[i] = yh[k]; yu[i] = yu[k]; i = k;
    }
    yh[i] = sc; yu[i] = sd;
    return c;
  };
  deniz.bolgeler.forEach((b, z) => {
    let i = Math.floor((b.lon - x0) / R), j = Math.floor((millerY(b.lat) - y0) / R);
    // Merkez karaya düşerse en yakın su hücresi
    if (kara[j * W + i]) {
      let en = -1, enD = Infinity;
      for (let dj = -20; dj <= 20; dj++) for (let di = -20; di <= 20; di++) {
        const c = (j + dj) * W + i + di;
        if (!kara[c] && di * di + dj * dj < enD) { enD = di * di + dj * dj; en = c; }
      }
      if (en < 0) throw new Error(`deniz bölgesi merkezi karada: ${b.id}`);
      i = en % W; j = Math.floor(en / W);
    }
    const c = j * W + i;
    uzak[c] = 0; etiket[c] = z; it(c, 0);
  });
  while (yn) {
    const d0 = yu[0], c = al();
    if (d0 > uzak[c]) continue;
    const i = c % W, j = (c - i) / W, z = etiket[c];
    for (let dj = -1; dj <= 1; dj++) {
      const jj = j + dj;
      if (jj < 0 || jj >= H) continue;
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ii = (i + di + W) % W, n = jj * W + ii;
        if (kara[n]) continue;
        const hx = di ? yatay[j] : 0, hy = dj ? dikey[Math.min(j, jj)] : 0;
        const d = d0 + Math.hypot(hx, hy) * carpan[z];
        if (d < uzak[n] && d <= EN_UZAK * carpan[z]) { uzak[n] = d; etiket[n] = z; it(n, d); }
      }
    }
  }

  // --- Kıyıda karanın altına taşma (yalnızca dolgu için; sınır hesabı taşmasız etiketle yapılır)
  const sinirEtiket = etiket.slice();
  for (let t = 0; t < KIYI_TASMA; t++) {
    const once = etiket.slice();
    for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
      const c = j * W + i;
      if (once[c] >= 0 || !kara[c]) continue;
      for (const n of [c - 1, c + 1, c - W, c + W]) if (once[n] >= 0) { etiket[c] = once[n]; break; }
    }
  }

  // --- Kontur (marching squares; hücre merkezleri köşe, değer = bölgeye ait mi)
  const merkez = (i, j) => [x0 + (i + 0.5) * R, y0 + (j + 0.5) * R];
  const alanlar = deniz.bolgeler.map((b, z) => {
    let i0 = W, i1 = -1, j0 = H, j1 = -1;
    for (let c = 0; c < W * H; c++) if (etiket[c] === z) { const i = c % W, j = (c - i) / W; i0 = Math.min(i0, i); i1 = Math.max(i1, i); j0 = Math.min(j0, j); j1 = Math.max(j1, j); }
    const v = (i, j) => (i >= i0 && i <= i1 && j >= j0 && j <= j1 && etiket[j * W + i] === z ? 1 : 0);
    // Kenar ortası noktası: yatay kenar (i,j)-(i+1,j) → "h,i,j"; dikey (i,j)-(i,j+1) → "v,i,j"
    const nokta = (k) => { const [t, a, b2] = k.split(","); const [x, y] = merkez(+a, +b2); return t === "h" ? [x + R / 2, y] : [x, y + R / 2]; };
    const komsu = new Map();
    const bagla = (a, b2) => { (komsu.get(a) ?? komsu.set(a, []).get(a)).push(b2); (komsu.get(b2) ?? komsu.set(b2, []).get(b2)).push(a); };
    for (let j = j0 - 1; j <= j1; j++) for (let i = i0 - 1; i <= i1; i++) {
      const a = v(i, j), b2 = v(i + 1, j), c = v(i + 1, j + 1), d = v(i, j + 1);
      const s = a | (b2 << 1) | (c << 2) | (d << 3);
      if (s === 0 || s === 15) continue;
      const alt = `h,${i},${j}`, sag = `v,${i + 1},${j}`, ust = `h,${i},${j + 1}`, sol = `v,${i},${j}`;
      switch (s) {
        case 1: case 14: bagla(sol, alt); break;
        case 2: case 13: bagla(alt, sag); break;
        case 4: case 11: bagla(sag, ust); break;
        case 8: case 7: bagla(ust, sol); break;
        case 3: case 12: bagla(sol, sag); break;
        case 6: case 9: bagla(alt, ust); break;
        case 5: bagla(sol, ust); bagla(alt, sag); break; // çapraz: köşeler ayrı tutulur
        case 10: bagla(sol, alt); bagla(sag, ust); break;
      }
    }
    const kullanildi = new Set(), halkalar = [];
    for (const bas of komsu.keys()) {
      if (kullanildi.has(bas)) continue;
      const r = [];
      let onceki = null, k = bas;
      while (k !== undefined && !kullanildi.has(k)) {
        kullanildi.add(k);
        r.push(nokta(k));
        const sonraki = komsu.get(k).find((x) => x !== onceki && !kullanildi.has(x));
        onceki = k; k = sonraki;
      }
      if (r.length >= 4) halkalar.push(yumusat(r));
    }
    return { id: b.id, p: delikleriBagla(halkalar) };
  });

  // --- Bölgeler arası açık su sınırları: her halka parçasının iki yanı farklı iki bölgeyse (kıyıya değmeden)
  const etiketAl = (x, y) => {
    const i = Math.floor((x - x0) / R), j = Math.floor((y - y0) / R);
    return i < 0 || j < 0 || i >= W || j >= H ? -1 : sinirEtiket[j * W + i];
  };
  const sinirlar = [];
  alanlar.forEach((a, z) => {
    for (const poly of a.p) for (const h of poly) {
      let cizgi = [], diger = -1;
      const bitir = () => { if (cizgi.length >= 4) sinirlar.push({ a: z, b: diger, p: cizgi }); cizgi = []; diger = -1; };
      for (let i = 0; i < h.length; i += 2) {
        const ax = h[i], ay = h[i + 1], bx = h[(i + 2) % h.length], by = h[(i + 3) % h.length];
        const mx = (ax + bx) / 2, my = (ay + by) / 2, l = Math.hypot(bx - ax, by - ay) || 1;
        const nx = (-(by - ay) / l) * R, ny = ((bx - ax) / l) * R;
        const e1 = etiketAl(mx + nx, my + ny), e2 = etiketAl(mx - nx, my - ny);
        const ok = e1 >= 0 && e2 >= 0 && e1 !== e2 && (e1 === z || e2 === z) && Math.min(e1, e2) === z;
        const o = e1 === z ? e2 : e1;
        if (ok && diger !== -1 && o !== diger) bitir();
        if (ok) { if (!cizgi.length) { cizgi.push(ax, ay); diger = o; } cizgi.push(bx, by); } else bitir();
      }
      bitir();
    }
  });
  const yuvarla = (dizi) => dizi.map((x) => Math.round(x * 1e4) / 1e4);
  return {
    alanlar: alanlar.map((a, z) => ({ id: a.id, ad: deniz.bolgeler[z].ad, p: a.p.map((poly) => poly.map(yuvarla)) })),
    sinirlar: sinirlar.map((l) => ({ ...l, p: yuvarla(l.p) })),
  };
}

/** Chaikin yumuşatması (2 tur) + düz çizgi üzerindeki noktaların seyreltilmesi; düz dizi döner. */
function yumusat(r) {
  let p = r;
  for (let t = 0; t < 2; t++) {
    const q = [];
    for (let i = 0; i < p.length; i++) {
      const [ax, ay] = p[i], [bx, by] = p[(i + 1) % p.length];
      q.push([0.75 * ax + 0.25 * bx, 0.75 * ay + 0.25 * by], [0.25 * ax + 0.75 * bx, 0.25 * ay + 0.75 * by]);
    }
    p = q;
  }
  const out = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[(i - 1 + p.length) % p.length], b = p[i], c = p[(i + 1) % p.length];
    const capraz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    if (Math.abs(capraz) > 1e-6 || i === 0) out.push(b[0], b[1]);
  }
  return out;
}

/** Halkaları dış/delik olarak ayırır: kapsayan halka sayısı tekse deliktir, en küçük kapsayan dışa bağlanır. */
function delikleriBagla(halkalar) {
  const icinde = (h, x, y) => {
    let ic = false;
    for (let i = 0, j = h.length - 2; i < h.length; j = i, i += 2) {
      const xi = h[i], yi = h[i + 1], xj = h[j], yj = h[j + 1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ic = !ic;
    }
    return ic;
  };
  const alan = (h) => { let s = 0; for (let i = 0, j = h.length - 2; i < h.length; j = i, i += 2) s += h[j] * h[i + 1] - h[i] * h[j + 1]; return Math.abs(s / 2); };
  const alanlar = halkalar.map(alan);
  const kapsayan = halkalar.map((h, j) => halkalar.map((_, i) => i).filter((i) => i !== j && alanlar[i] > alanlar[j] && icinde(halkalar[i], h[0], h[1])));
  const dis = kapsayan.map((l) => l.length % 2 === 0);
  const sonuc = new Map();
  halkalar.forEach((h, i) => { if (dis[i]) sonuc.set(i, [h]); });
  halkalar.forEach((h, j) => {
    if (dis[j]) return;
    const d = kapsayan[j].filter((i) => dis[i]).sort((a, b) => alanlar[a] - alanlar[b])[0];
    sonuc.get(d)?.push(h);
  });
  return [...sonuc.values()];
}
