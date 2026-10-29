// Sistem zamanlayıcısı: her sistem kendi sıklığında çalışır (DEC-0005, ADR-0002).
// Sıra sabittir; aynı gün içinde önce günlük, sonra aylık, sonra yıllık sistemler çalışır.
//
// [TASLAK — TEST SİSTEMLERİ] Aşağıdaki sistemler yalnızca tur çekirdeğini sınamak içindir;
// gerçek nüfus ve ekonomi kuralları değildir. Aşama 5 ve 7'de tasarlanan sistemlerle değiştirilecek.

import { olayEkle, type DunyaDurumu } from "./durum";
import { aralik } from "./rastgele";
import { gundenTarih } from "./takvim";
import { orduIlerlet } from "./hareket";
import { moralToparla, muharebeGunleri, muharebeleriBaslat } from "./savas";
import type { Baglam } from "./emirler";
import { ikmalVeMaasMorali, maaslariOde, toplamalariIlerlet } from "./ordu";
import { prototipGelirleri } from "./ekonomi";
import { isgalleriIlerlet, kusatmalariIlerlet } from "./kusatma";
import { insaatlariIlerlet } from "./yatirim";
import { arastirmalariIlerlet } from "./teknoloji";
import { diplomasiSonumu } from "./diplomasi";
import { yzKararlari, yzYillikOzet } from "./yz";

export type Siklik = "gunluk" | "aylik" | "yillik";

export interface Sistem {
  id: string;
  siklik: Siklik;
  calistir(d: DunyaDurumu, b: Baglam): void;
}

export const SISTEMLER: Sistem[] = [
  { id: "asker-toplama", siklik: "gunluk", calistir: (d, b) => toplamalariIlerlet(d, b) },
  {
    // Ordu hareketi (TASK-0006): her gün hız kadar rota tüketilir
    id: "ordu-hareket",
    siklik: "gunluk",
    calistir(d) {
      for (const o of d.ordular) {
        if (!o.rota.length || o.muharebe !== null) continue; // muharebedeki ordu yürümez
        if (orduIlerlet(o)) {
          o.hedef = null;
          if (o.cekiliyor) {
            o.cekiliyor = false;
            olayEkle(d, { tur: "ordu-vardi", devlet: o.devlet, metin: `${o.ad} geri çekilmeyi tamamladı.` });
          } else {
            olayEkle(d, { tur: "ordu-vardi", devlet: o.devlet, metin: `${o.ad} hedefine vardı.` });
          }
        }
      }
    },
  },
  // Savaş (TASK-0007/4a): temas → muharebe günü → moral toparlanması
  { id: "muharebe-temas", siklik: "gunluk", calistir: (d) => muharebeleriBaslat(d) },
  { id: "muharebe-gunu", siklik: "gunluk", calistir: (d, b) => muharebeGunleri(d, b.ag) },
  { id: "moral-toparlanma", siklik: "gunluk", calistir: (d, b) => moralToparla(d, b.ag) },
  { id: "ikmal-maas-moral", siklik: "gunluk", calistir: (d, b) => ikmalVeMaasMorali(d, b.ag) },
  { id: "gercek-isgal", siklik: "gunluk", calistir: isgalleriIlerlet },
  { id: "kusatma", siklik: "gunluk", calistir: kusatmalariIlerlet },
  { id: "sehir-insaati", siklik: "gunluk", calistir: insaatlariIlerlet },
  { id: "arastirma", siklik: "gunluk", calistir: arastirmalariIlerlet },
  // AI devletleri (TASK-0009/6b): her devlet 30 günde bir, kendi gününde
  { id: "yz-ekonomi", siklik: "gunluk", calistir: yzKararlari },
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
      const gelir = prototipGelirleri(d);
      d.devletler.forEach((v, i) => { v.hazine += gelir[i]; });
    },
  },
  { id: "ordu-maasi", siklik: "aylik", calistir: (d) => maaslariOde(d) },
  { id: "diplomasi-sonumu", siklik: "aylik", calistir: diplomasiSonumu },
  { id: "yz-yillik-ozet", siklik: "yillik", calistir: yzYillikOzet },
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

export function gununSistemleri(d: DunyaDurumu, b: Baglam): void {
  const t = gundenTarih(d.gun);
  const ayBasi = t.gun === 1, yilBasi = ayBasi && t.ay === 1;
  for (const s of SISTEMLER) if (s.siklik === "gunluk") s.calistir(d, b);
  if (ayBasi) for (const s of SISTEMLER) if (s.siklik === "aylik") s.calistir(d, b);
  if (yilBasi) for (const s of SISTEMLER) if (s.siklik === "yillik") s.calistir(d, b);
}
