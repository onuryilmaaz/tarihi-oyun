// Tohumlu (seed) rastgelelik: aynı tohum her çalıştırmada aynı haritayı üretir.

export function mulberry32(tohum: number): () => number {
  let a = tohum >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a
export function metinHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// [0,1]² üzerinde birkaç oktavlı değer gürültüsü; kara/deniz maskesi ve yoğunluk için.
export function fbmGurultu(tohum: number): (u: number, v: number) => number {
  const oktavlar = [
    { gw: 4, gh: 2, w: 0.5 },
    { gw: 8, gh: 4, w: 0.25 },
    { gw: 16, gh: 8, w: 0.15 },
    { gw: 32, gh: 16, w: 0.1 },
  ];
  const rnd = mulberry32(tohum);
  const izgaralar = oktavlar.map((o) => {
    const g = new Float32Array((o.gw + 1) * (o.gh + 1));
    for (let i = 0; i < g.length; i++) g[i] = rnd();
    return g;
  });
  const yumusat = (f: number) => f * f * (3 - 2 * f);

  return (u, v) => {
    let toplam = 0;
    for (let k = 0; k < oktavlar.length; k++) {
      const { gw, gh, w } = oktavlar[k];
      const g = izgaralar[k];
      const x = Math.min(Math.max(u, 0), 1) * gw;
      const y = Math.min(Math.max(v, 0), 1) * gh;
      const x0 = Math.min(Math.floor(x), gw - 1);
      const y0 = Math.min(Math.floor(y), gh - 1);
      const fx = yumusat(x - x0);
      const fy = yumusat(y - y0);
      const s = gw + 1;
      const a = g[y0 * s + x0], b = g[y0 * s + x0 + 1];
      const c = g[(y0 + 1) * s + x0], d = g[(y0 + 1) * s + x0 + 1];
      toplam += w * ((a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy);
    }
    return toplam;
  };
}
