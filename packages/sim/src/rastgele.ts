// Tohumlu rastgele sayı üreteci (mulberry32). Durumu tek bir 32 bit tam sayıdır ve dünya durumunun
// içinde saklanır; böylece kayıt/yükleme sonrası aynı dizi devam eder (ADR-0002, determinizm).

export interface RastgeleDurumu {
  rng: number;
}

/** [0, 2^32) aralığında tam sayı üretir ve durumu ilerletir. */
export function sonrakiTamSayi(d: RastgeleDurumu): number {
  d.rng = (d.rng + 0x6d2b79f5) >>> 0;
  let t = d.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (t ^ (t >>> 14)) >>> 0;
}

/** [0, ust) aralığında tam sayı. Kayan nokta bölme kullanmaz. */
export function aralik(d: RastgeleDurumu, ust: number): number {
  if (!Number.isInteger(ust) || ust <= 0 || ust > 0x100000000) throw new RangeError(`geçersiz üst sınır: ${ust}`);
  return sonrakiTamSayi(d) % ust;
}

/** Olasılık on binde birlik birimle: oran = 2500 → %25. */
export function olasilik(d: RastgeleDurumu, onBinde: number): boolean {
  return aralik(d, 10000) < onBinde;
}
