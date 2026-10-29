// Denge değerleri — hepsi [TASLAK] (TASK-0007 riskler bölümü). İlk oynanışlarla ayarlanacak;
// yeni bir denge değeri kod içine gömülmez, buraya eklenir.

export const DENGE = {
  // Muharebe (DEC-0027/3)
  MUHAREBE_EN_UZUN_GUN: 5,
  KAYIP_YUZDE: 4, // günlük kayıp ≈ karşı tarafın gücünün %4'ü
  SANS_ALT: 85, // ±%15 oynama: 85–115
  SANS_UST: 115,
  MORAL_KAYIP_CARPANI: 2500, // kayıp oranı × 2,5 → binde moral kaybı
  MORAL_YORGUNLUK: 15, // muharebe günü başına binde moral kaybı
  ZAFER_MORALI: 50,
  TAKIP_KAYIP_ALT: 3, // takipte ek kayıp %3–8
  TAKIP_KAYIP_UST: 8,
  DAGILMA_ORANI: 10, // başlangıç askerinin %10'unun altına düşen ordu dağılır
  // Arazi: savunanın gücü × (100 + (zorluk − 100) / 2) / 100 → zorluk 250'de ×1,75
  // Moral (binde)
  MORAL_EN_YUKSEK: 1000,
  MORAL_TOPARLANMA_KENDI: 20, // kendi topraklarında beklerken günlük
  MORAL_TOPARLANMA_YURUYUS: 8,
  GERI_CEKILME_ESIGI: { temkinli: 600, dengeli: 350, inatci: 100 } as const,
  // Yabancı garnizon orduları (DEC-0025/4, DEC-0027/1)
  GARNIZON_TABAN: 2000,
  GARNIZON_BIRIM_BASINA: 300,
  GARNIZON_EN_COK: 40000,
  // Görünürlük (DEC-0027/2)
  GORUS_DUGUM: 2,
};
