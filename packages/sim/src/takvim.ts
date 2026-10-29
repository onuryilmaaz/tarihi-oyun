// Jülyen takvimi (DEC-0023). İçeride gün sayacı olarak Jülyen gün numarası (JGN) kullanılır;
// tüm dönüşümler tam sayı aritmetiğiyle yapılır.
// Not: Yılbaşı 1 Ocak kabul edilir; tarihî yılbaşı gelenekleri (ör. 1 Mart, 25 Mart) gösterim
// için ileride ayrıca ele alınabilir.

export interface Tarih {
  yil: number;
  ay: number; // 1–12
  gun: number; // 1–31
}

export const AY_ADLARI = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos",
  "Eylül", "Ekim", "Kasım", "Aralık"] as const;

const bol = (a: number, b: number) => Math.floor(a / b);

export function artikYil(yil: number): boolean {
  return ((yil % 4) + 4) % 4 === 0;
}

export function ayUzunlugu(yil: number, ay: number): number {
  if (ay === 2) return artikYil(yil) ? 29 : 28;
  return [4, 6, 9, 11].includes(ay) ? 30 : 31;
}

export function tarihtenGun(t: Tarih): number {
  if (!Number.isInteger(t.yil) || t.ay < 1 || t.ay > 12 || t.gun < 1 || t.gun > ayUzunlugu(t.yil, t.ay)) {
    throw new RangeError(`geçersiz tarih: ${t.yil}-${t.ay}-${t.gun}`);
  }
  const a = bol(14 - t.ay, 12);
  const y = t.yil + 4800 - a;
  const m = t.ay + 12 * a - 3;
  return t.gun + bol(153 * m + 2, 5) + 365 * y + bol(y, 4) - 32083;
}

export function gundenTarih(jgn: number): Tarih {
  const c = jgn + 32082;
  const d = bol(4 * c + 3, 1461);
  const e = c - bol(1461 * d, 4);
  const m = bol(5 * e + 2, 153);
  return {
    gun: e - bol(153 * m + 2, 5) + 1,
    ay: m + 3 - 12 * bol(m, 10),
    yil: d - 4800 + bol(m, 10),
  };
}

/** Ay ekler; gün ayın uzunluğunu aşarsa ayın son gününe çekilir. */
export function ayEkle(t: Tarih, n: number): Tarih {
  const toplam = t.yil * 12 + (t.ay - 1) + n;
  const yil = bol(toplam, 12);
  const ay = toplam - yil * 12 + 1;
  return { yil, ay, gun: Math.min(t.gun, ayUzunlugu(yil, ay)) };
}

export function tarihMetni(jgn: number): string {
  const t = gundenTarih(jgn);
  return `${t.gun} ${AY_ADLARI[t.ay - 1]} ${t.yil}`;
}
