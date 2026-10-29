// Denge değerleri — hepsi [TASLAK] (TASK-0007 riskler bölümü). İlk oynanışlarla ayarlanacak;
// yeni bir denge değeri kod içine gömülmez, buraya eklenir.

export const HAREKET = {
  TEMEL_HIZ: 20000, // metre/gün (piyade ağırlıklı ordu)
  NEHIR_CEZASI: 15000,
  BOGAZ_CEZASI: 40000,
};

export const DENGE = {
  // 4c — prototip kuşatma, işgal ve barış değerleri
  SEHIR_SUR: 1,
  BASKENT_SUR: 3,
  SEHIR_GARNIZON: 500,
  BASKENT_GARNIZON: 2000,
  KUSATMA_MENZIL_M: 3000,
  KUSATMA_EN_AZ_GUN: 7,
  KUSATMA_ERZAK: 1000,
  KUSATMA_ERZAK_AZALMA: { abluka: 50, bekle: 25, saldiri: 15 },
  KUSATMA_SALDIRI_GARNIZON_YUZDE: 10,
  KUSATMA_SALDIRI_ASKER_KAYIP_BINDE: 20,
  KUSATMA_SALDIRI_MORAL: 15,
  ISGAL_GUN: 3,
  BOLGE_DEGERI: 5,
  SEHIR_DEGERI: 20,
  BASKENT_DEGERI: 40,
  TAZMINAT_PUAN_BASINA: 10,
  BARIS_GECMISI_SINIRI: 20,
  BASLANGIC_HAZINE_BIRIM_BASINA: 100,
  TEST_GELIR_BIRIM_BASINA: 10,
  INSAN_GUCU_YUZDE: 5, // şehir nüfusundan ek asker toplama havuzu; kendiliğinden yenilenmez
  TOPLAMA_GUN: 30,
  TOPLAMA_ASKER_BASINA_MALIYET_BINDE: 100, // 1000 asker → 100 hazine
  AYLIK_ASKER_MAASI_BINDE: 20, // 1000 asker → ayda 20 hazine
  MAAS_AKSAMASI_MORAL: 30, // hazine eksideyken günlük; toparlanma uygulanmaz
  IKAMET_IKMAL: 1000,
  TARAFSIZ_IKMAL: 500,
  DUSMAN_IKMAL: 0,
  IKMALSIZ_KAYIP_BINDE: 1, // düşman toprağında günlük %0,1 (yukarı yuvarlanır)
  IKMALSIZ_MORAL: 10,
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
