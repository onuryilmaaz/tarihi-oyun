// public/veri/dunya-1453.json → çalışma zamanı yapıları (halkalar, yay sahipleri, seçim ızgarası).

export interface Devlet {
  id: string;
  ad: string;
  ton: number;
  etiket: [number, number, number] | null; // x, y, iç daire yarıçapı (derece)
  alan: number;
}

export interface Sehir { ad: string; x: number; y: number; d: number; b: number }

export interface Paket {
  uyari: string;
  dunya: { x0: number; x1: number; y0: number; y1: number };
  arklar: number[][];
  birimler: { ad: string; ulke: string; d: number; p: number[][][] }[];
  devletler: Devlet[];
  sehirler: Sehir[];
  goller: number[][][];
  nehirler: { r: number; p: number[] }[];
}

export interface Harita {
  paket: Paket;
  arklar: Float32Array[];
  halkalar: Float32Array[][][]; // birim → poligon → halka (ilk halka dış sınır)
  yaySahipA: Int32Array;
  yaySahipB: Int32Array; // tek sahipli yay (kıyı) için -1
  devletBirimleri: number[][];
  devletSehirleri: number[][];
  birimSehirleri: number[][];
  izgara: Map<number, [number, number][]>;
  hucre: number;
}

function halkaKur(arklar: Float32Array[], refs: number[]): Float32Array {
  const out: number[] = [];
  refs.forEach((r, k) => {
    const a = arklar[r < 0 ? ~r : r];
    const n = a.length / 2;
    const atla = k === 0 ? 0 : 1; // ardışık yaylar uç noktayı paylaşır
    if (r >= 0) for (let i = atla; i < n; i++) out.push(a[2 * i], a[2 * i + 1]);
    else for (let i = n - 1 - atla; i >= 0; i--) out.push(a[2 * i], a[2 * i + 1]);
  });
  const m = out.length;
  if (m >= 4 && out[0] === out[m - 2] && out[1] === out[m - 1]) out.length = m - 2;
  return Float32Array.from(out);
}

export function halkaIcinde(h: Float32Array, x: number, y: number): boolean {
  let ic = false;
  const m = h.length / 2;
  for (let i = 0, j = m - 1; i < m; j = i++) {
    const xi = h[2 * i], yi = h[2 * i + 1], xj = h[2 * j], yj = h[2 * j + 1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ic = !ic;
  }
  return ic;
}

export async function haritaYukle(url: string): Promise<Harita> {
  const paket: Paket = await (await fetch(url)).json();
  const arklar = paket.arklar.map((a) => Float32Array.from(a));

  const yaySahipA = new Int32Array(arklar.length).fill(-1);
  const yaySahipB = new Int32Array(arklar.length).fill(-1);
  const devletBirimleri: number[][] = paket.devletler.map(() => []);
  const izgara = new Map<number, [number, number][]>();
  const hucre = 2;
  const sutun = Math.ceil((paket.dunya.x1 - paket.dunya.x0) / hucre) + 1;

  const halkalar = paket.birimler.map((b, bi) => {
    if (b.d >= 0) devletBirimleri[b.d].push(bi);
    const polys: Float32Array[][] = [];
    for (const poly of b.p) {
      for (const ring of poly) for (const r of ring) {
        const k = r < 0 ? ~r : r;
        if (yaySahipA[k] < 0) yaySahipA[k] = bi;
        else if (yaySahipA[k] !== bi) yaySahipB[k] = bi;
      }
      const hs = poly.map((ring) => halkaKur(arklar, ring)).filter((h) => h.length >= 6);
      if (!hs.length) continue;
      const pi = polys.length;
      polys.push(hs);
      // seçim ızgarası: dış halkanın sınır kutusu
      const d = hs[0];
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let i = 0; i < d.length; i += 2) {
        x0 = Math.min(x0, d[i]); x1 = Math.max(x1, d[i]);
        y0 = Math.min(y0, d[i + 1]); y1 = Math.max(y1, d[i + 1]);
      }
      for (let gx = Math.floor((x0 - paket.dunya.x0) / hucre); gx <= Math.floor((x1 - paket.dunya.x0) / hucre); gx++) {
        for (let gy = Math.floor((y0 - paket.dunya.y0) / hucre); gy <= Math.floor((y1 - paket.dunya.y0) / hucre); gy++) {
          const key = gy * sutun + gx;
          let l = izgara.get(key);
          if (!l) izgara.set(key, (l = []));
          l.push([bi, pi]);
        }
      }
    }
    return polys;
  });

  const h: Harita = {
    paket, arklar, halkalar, yaySahipA, yaySahipB, devletBirimleri,
    devletSehirleri: paket.devletler.map(() => []),
    birimSehirleri: paket.birimler.map(() => []),
    izgara, hucre,
  };
  paket.sehirler.forEach((s, si) => {
    h.devletSehirleri[s.d].push(si);
    const b = birimBul(h, s.x, s.y);
    if (b >= 0) h.birimSehirleri[b].push(si);
  });
  return h;
}

export function birimBul(h: Harita, x: number, y: number): number {
  const { dunya } = h.paket;
  const sutun = Math.ceil((dunya.x1 - dunya.x0) / h.hucre) + 1;
  const key = Math.floor((y - dunya.y0) / h.hucre) * sutun + Math.floor((x - dunya.x0) / h.hucre);
  for (const [bi, pi] of h.izgara.get(key) ?? []) {
    const hs = h.halkalar[bi][pi];
    if (!halkaIcinde(hs[0], x, y)) continue;
    let delikte = false;
    for (let k = 1; k < hs.length; k++) if (halkaIcinde(hs[k], x, y)) delikte = true;
    if (!delikte) return bi;
  }
  return -1;
}
