// Sistem zamanlayıcısı: her sistem kendi sıklığında çalışır (DEC-0005, ADR-0002).
// Sıra sabittir; aynı gün içinde önce günlük, sonra aylık, sonra yıllık sistemler çalışır.
//
// [TASLAK — TEST SİSTEMLERİ] Aşağıdaki sistemler yalnızca tur çekirdeğini sınamak içindir;
// gerçek nüfus ve ekonomi kuralları değildir. Aşama 5 ve 7'de tasarlanan sistemlerle değiştirilecek.

import { olayEkle, type DunyaDurumu } from "./durum";
import { aralik } from "./rastgele";
import { gundenTarih } from "./takvim";

export type Siklik = "gunluk" | "aylik" | "yillik";

export interface Sistem {
  id: string;
  siklik: Siklik;
  calistir(d: DunyaDurumu): void;
}

export const SISTEMLER: Sistem[] = [
  {
    // Test: her gün rastgele bir şehrin nüfusu 0–2 artar (rastgelelik akışını her gün kullanır)
    id: "test-nufus",
    siklik: "gunluk",
    calistir(d) {
      if (!d.sehirler.length) return;
      const s = d.sehirler[aralik(d, d.sehirler.length)];
      s.nufus += aralik(d, 3);
    },
  },
  {
    // Test: her ayın başında devlet, yasal sahibi olduğu birim başına 10 gelir alır
    id: "test-gelir",
    siklik: "aylik",
    calistir(d) {
      const gelir = new Array<number>(d.devletler.length).fill(0);
      for (const b of d.birimler) if (b.sahip >= 0) gelir[b.sahip] += 10;
      d.devletler.forEach((v, i) => { v.hazine += gelir[i]; });
    },
  },
  {
    // Test: yılbaşında oyuncu için yıllık özet olayı
    id: "test-yillik-ozet",
    siklik: "yillik",
    calistir(d) {
      const o = d.devletler[d.ayarlar.oyuncu];
      olayEkle(d, { tur: "yillik-ozet", devlet: d.ayarlar.oyuncu, metin: `${gundenTarih(d.gun).yil} yılı başladı. Hazine: ${o.hazine}` });
    },
  },
];

export function gununSistemleri(d: DunyaDurumu): void {
  const t = gundenTarih(d.gun);
  const ayBasi = t.gun === 1, yilBasi = ayBasi && t.ay === 1;
  for (const s of SISTEMLER) if (s.siklik === "gunluk") s.calistir(d);
  if (ayBasi) for (const s of SISTEMLER) if (s.siklik === "aylik") s.calistir(d);
  if (yilBasi) for (const s of SISTEMLER) if (s.siklik === "yillik") s.calistir(d);
}
