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
  // 5b — şehir yatırımları (DEC-0033); tarihî veri değildir, ilk oynanışla ayarlanacak
  YAPI_EN_YUKSEK: { tarla: 3, pazar: 3, sur: 5 },
  // Hedef seviyeye göre bedel: indeks = hedef seviye − 1 (sur 1. seviyeden başlar, 0. indeks kullanılmaz)
  YAPI_MALIYET: { tarla: [300, 600, 1200, 2000], pazar: [400, 800, 1600, 2600], sur: [0, 800, 1200, 1800, 2500, 3500] }, // son basamak teknolojiyle açılır (5c)
  YAPI_SURE_GUN: { tarla: 60, pazar: 90, sur: 120 },
  YAPI_AYLIK_GELIR: { tarla: 15, pazar: 20 }, // seviye başına, şehir kontrolünüzdeyken
  // 5c — teknoloji ağacı (DEC-0035); bedel hazine, süre takvim günü
  ARASTIRMA_YUVASI: 2,
  TEKNOLOJI: {
    sulama: { bedel: 800, sure: 180 },
    kervan: { bedel: 900, sure: 180 },
    vergi: { bedel: 1500, sure: 270 },
    top: { bedel: 1200, sure: 240 },
    daimiOrdu: { bedel: 1000, sure: 180 },
    kayit: { bedel: 1200, sure: 240 },
    yargi: { bedel: 700, sure: 150 },
    sayim: { bedel: 900, sure: 180 },
    bayindirlik: { bedel: 1400, sure: 240 },
  },
  YAPI_EN_YUKSEK_TEKNOLOJIYLE: { tarla: 4, pazar: 4, sur: 6 }, // sulama / kervan / bayındırlık
  KERVAN_PAZAR_EK_GELIR: 5,
  VERGI_ARAZI_GELIRI: 11,
  TOP_SALDIRI_YUZDE: 150,
  DAIMI_ORDU_GUC_YUZDE: 110,
  KAYIT_TOPLAMA_BEDEL_YUZDE: 75,
  KAYIT_TOPLAMA_GUN: 20,
  YARGI_INSAAT_SURE_YUZDE: 80,
  SAYIM_INSAN_GUCU_YUZDE: 50,
  BAYINDIRLIK_SUR_BEDEL_YUZDE: 75,
  // 6a — ilişkiler ve diplomasi (DEC-0038); hepsi [TASLAK]
  ILISKI_ITTIFAK: 30, // müttefikler birbirini daha iyi görür
  ILISKI_SAVASTA: 50, // savaştaki taraflar
  ILISKI_ORTAK_DUSMAN: 20, // ikisi de aynı devletle savaşta
  ILISKI_TEHDIT_EN_COK: 25, // daha büyük komşudan duyulan kaygı (arazi sayısı farkıyla)
  SALDIRGANLIK_ILAN: 10, // her savaş ilanında saldıranın saldırganlığı artar
  SALDIRGANLIK_EN_COK: 50,
  SALDIRGANLIK_SONUM: 1, // aylık
  SALDIRGANLIK_KOMSU_CARPANI: 2, // komşular saldırganlığı iki kat algılar
  ETKI_SAVAS_ILANI: -20, // iki devlet arasında; en çok ETKI_SAVAS_EN_AZ'a kadar birikir
  ETKI_SAVAS_EN_AZ: -40,
  ETKI_ITTIFAK_BOZMA: -30,
  ETKI_CAGRI_REDDI: -25,
  ETKI_SONUM: 1, // tarih dışındaki etkiler ayda 1 puan sıfıra yaklaşır
  ITTIFAK_ESIGI: 25, // AI'nın ittifak kabulü için gereken ilişki
  ITTIFAK_EN_COK: 3, // devlet başına
  CAGRI_ESIGI: 0, // müttefik çağrısına uymak için gereken ilişki
  HEDIYE_EN_COK: 30, // bir çiftte birikebilecek hediye etkisi
  HEDIYE_PUAN_EN_AZ: 20, // bir ilişki puanının en düşük bedeli
  HEDIYE_PUAN_GELIR_BINDE: 100, // puan bedeli: alıcının aylık arazi gelirinin %10'u
};
