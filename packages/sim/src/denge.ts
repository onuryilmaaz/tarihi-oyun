// Denge değerleri — hepsi [TASLAK] (TASK-0007 riskler bölümü). İlk oynanışlarla ayarlanacak;
// yeni bir denge değeri kod içine gömülmez, buraya eklenir.

export const HAREKET = {
  TEMEL_HIZ: 20000, // metre/gün (piyade ağırlıklı ordu)
  NEHIR_CEZASI: 15000,
  BOGAZ_CEZASI: 40000,
};

export const DENGE = {
  // 7c — DEC-0047: prototip risk ağırlıkları, tarihî ölçüm değildir.
  IST_MESRUIYET_EN_COK: 40,
  IST_FETIH_RISK: 30,
  IST_FETIH_SONUM_GUN: 30,
  IST_ISGAL_RISK: 25,
  IST_SAVAS_DONEM_GUN: 90,
  IST_SAVAS_DONEM_PUAN: 3,
  IST_SAVAS_EN_COK: 25,
  IST_EKSI_HAZINE: 30,
  IST_DIN_EN_COK: 10,
  IST_KUSATMA: 25,
  IST_DUSMAN: 15,
  IST_ASAYIS_INDIRIM: 20,
  IST_ASAYIS_EN_AZ_ASKER: 500,
  IST_ASAYIS_NUFUS_YUZDE: 5,
  IST_BASKENT_INDIRIM: 10,
  IST_HUZURSUZLUK: 50,
  IST_DIRENIS: 65, // TASK-0018 (3/3): huzursuzluk ile ayaklanma arasında ara kademe
  IST_AYAKLANMA: 80,
  IST_AYAKLANMA_AY: 3,
  IST_BASTIRMA_AY: 2,
  IST_BAGIS_BEDEL: 200,
  IST_BAGIS_INDIRIM: 20,
  IST_BAGIS_SONUM: 5,
  // 4c — prototip kuşatma, işgal ve barış değerleri
  SEHIR_SUR: 1,
  BASKENT_SUR: 3,
  SEHIR_GARNIZON: 500,
  SEHIR_GARNIZON_EN_AZ: 300, // TASK-0029: garnizon = nüfusun %5'i (100'e yuvarlanır), en az bu [TASLAK]
  GARNIZON_NUFUS_YUZDE: 5,
  BUYUK_SEHIR_NUFUS: 40000,
  BUYUK_SEHIR_SUR: 2,
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
  GARNIZON_TABAN: 0, // DEC-0040: sabit pay kaldırıldı; maaş arazi gelirinin ~%60'ı (küçük devletler eksi bütçeyle başlamaz)
  GARNIZON_BIRIM_BASINA: 300,
  GARNIZON_EN_COK: 40000,
  // Görünürlük (DEC-0027/2)
  GORUS_DUGUM: 2,
  // 5b — şehir yatırımları (DEC-0033); tarihî veri değildir, ilk oynanışla ayarlanacak
  YAPI_EN_YUKSEK: { tarla: 3, pazar: 3, sur: 5 },
  // Hedef seviyeye göre bedel: indeks = hedef seviye − 1 (sur 1. seviyeden başlar, 0. indeks kullanılmaz)
  YAPI_MALIYET: { tarla: [300, 600, 1200, 2000], pazar: [400, 800, 1600, 2600], sur: [0, 800, 1200, 1800, 2500, 3500] }, // son basamak teknolojiyle açılır (5c)
  YAPI_SURE_GUN: { tarla: 60, pazar: 90, sur: 120 },
  YAPI_AYLIK_GELIR: { tarla: 8, pazar: 10 }, // seviye başına, 20.000 nüfusta (TASK-0032: 15/20'den indi; 2.152 şehirli dünyada yatırım araziyi katbekat geçiyordu)
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
    kalyon: { bedel: 1600, sure: 300 }, // 8a, DEC-0052
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
  // 6b — AI ekonomi kararları (DEC-0039); hepsi [TASLAK]
  YZ_KARAR_ARALIGI: 30, // gün; her devlet bu aralıkla, kendi gününde karar verir (yük günlere yayılır)
  YZ_YEDEK_AY: 3, // hazinede bırakılan yedek: kaç aylık maaş
  YZ_YEDEK_EN_AZ: 200,
  YZ_ASKER_ARAZI_BASINA: 300, // barışta hedef ordu büyüklüğü (arazi başına)
  YZ_TEHDIT_ASKER_CARPANI: 2, // tehdit altında hedef ordu bu kat
  YZ_MAAS_NET_YUZDE: 50, // yeni askerin maaşı aylık fazlanın en çok bu yüzdesi
  YZ_TOPLAMA_EN_AZ: 500,
  YZ_DUSMANCA_ESIK: -40, // bu ilişkideki büyük komşu tehdit sayılır
  YZ_OKCU_OLASILIK: 6, // TASK-0021 (3/4): tehdit yokken /10 ihtimalle piyade yerine ucuz okçu toplanır
  // 6c — AI savaş ve barış (DEC-0040); hepsi [TASLAK]
  YZ_SAVAS_ILISKI: -30, // en az bu kadar kötü ilişki
  YZ_SAVAS_GUC_YUZDE: 150, // kendi ordusu / (hedef + müttefikleri tahmini) en az bu yüzde
  YZ_FIRSAT_GUC_YUZDE: 300, // bu kadar üstünse dostça olmayan (≤ 0) komşuya da saldırır (9b denge)
  YZ_FIRSAT_ILISKI: 0,
  YZ_FIRSAT_OLASILIK: 10, // fırsatçı fetihte aylık ilan olasılığı (%); kötü ilişkide YZ_SAVAS_OLASILIK
  YZ_SAVAS_OLASILIK: 25, // koşullar uygunsa bir ayda ilan etme olasılığı (%)
  YZ_SALDIRGANLIK_SINIRI: 20, // saldırganlığı bu düzeydeyken yeni savaş açmaz
  ATESKES_GUN: 1825, // barıştan sonra AI aynı devlete 5 yıl savaş açmaz
  YZ_SEFER_ARALIGI: 5, // gün; savaştaki AI ordularına bu aralıkla yeni emir
  YZ_SEFER_MORAL: 500, // bu moralin altındaki ordu sefere çıkmaz
  YZ_SALDIRI_GUC_KATI: 2, // gereken kuşatma gücünün bu katı varsa surlara saldırır, yoksa abluka
  YZ_BARIS_SKOR: 20, // bu skora ulaşan taraf barış dayatır/teklif eder
  YZ_SAVAS_YORGUNLUK_GUN: 730, // bu kadar süren dengeli savaş beyaz barışla biter
  YZ_KAYBEDEN_TEKLIF_GUN: 180, // kaybeden taraf bu süreden sonra oyuncuya taviz teklif eder
  BARIS_TEKLIF_GUN: 30, // oyuncuya gelen teklifin geçerlilik süresi
  // 7a — hükümdar ve veraset (DEC-0043); hepsi [TASLAK]
  HUK_ETKI_ORTA: 3, // yetenek 3 = etkisiz; her puan fark aşağıdaki kadar etki
  HUK_GELIR_YUZDE: 3, // yönetim: arazi geliri ±%3/puan (en çok ±%9)
  HUK_GUC_YUZDE: 3, // askerlik: muharebe gücü ±%3/puan
  HUK_DIPLOMASI_PUAN: 3, // diplomasi: başkalarının bakışı ±3/puan
  // Yaşa göre yıllık ölüm olasılığı (%): [alt yaş, yüzde]; her ay yüzde/12 olasılıkla
  OLUM_YUZDE: [[0, 1], [30, 2], [50, 4], [60, 8], [70, 15], [80, 30]] as [number, number][],
  MESRUIYET_TARIHI_HALEF: 90,
  MESRUIYET_GELENEKSEL: 80,
  MESRUIYET_SECIMLI: 70,
  MESRUIYET_GELENEK_DISI: 50,
  MESRUIYET_YILLIK_ARTIS: 2,
  KURGUSAL_YAS: [20, 55] as [number, number], // başlangıçta kurgusal hükümdar yaş aralığı
  HALEF_YAS: [16, 45] as [number, number], // kurgusal aday yaş aralığı
  VERASET_DUNYA_HABERI_ARAZI: 20, // bu büyüklükteki devletlerde tahta çıkış dünya haberidir
  // 7b — nüfus, göç, iskân (DEC-0045); hepsi [TASLAK]
  NUFUS_ARTIS_BINDE: 5, // yıllık doğal artış (%0,5)
  NUFUS_KUSATMA_KAYIP_BINDE: 10, // kuşatılan şehirde aylık kayıp (%1); yarısı göç eder
  NUFUS_ISGAL_KAYIP_BINDE: 5, // işgal altındaki (kuşatılmayan) şehirde aylık kayıp; yarısı göç eder
  GOC_PAYI_YUZDE: 50, // kaybın göç eden kısmı (kalanı ölür/dağılır)
  ISKAN_BEDEL_BINDE: 50, // kişi başına binde (1.000 kişi = 50)
  ISKAN_GUN: 60,
  ISKAN_EN_COK_YUZDE: 20, // bir iskânda kaynak şehir nüfusunun en çok bu yüzdesi
  DIN_AYNI: 10, // aynı din ilişki bileşeni
  DIN_FARKLI_AILE: -10, // farklı din ailesi
  // 8a — donanma (DEC-0051); hepsi [TASLAK]. Bakım aylık, gemi başına; kapasite asker
  GEMI: {
    kadirga: { ad: "Kadırga", bedel: 60, sure: 60, guc: 10, kapasite: 200, bakim: 1, hizGun: 4 },
    kalyon: { ad: "Kalyon", bedel: 200, sure: 120, guc: 30, kapasite: 600, bakim: 3, hizGun: 6 },
  },
  GEMI_INSA_EN_COK: 20, // bir emirde
  DENIZ_KAYIP_YUZDE: 12, // karşı tarafın gücünün günlük kayba dönüşen yüzdesi
  DENIZ_MORAL_KAYIP_CARPANI: 1500, // kaybedilen güç payı → moral (binde)
  DENIZ_GERI_CEKILME_MORAL: 400,
  DENIZ_MORAL_TOPARLANMA: 20, // günlük, çatışma dışında
  ABLUKA_ERZAK_CARPANI: 2, // denizden ablukadaki liman kuşatmasında erzak bu kat hızlı biter
  YZ_DONANMA_GUC_YUZDE: 120, // AI donanması karşı tarafın en az bu yüzdesi güçlüyse saldırır
  // 8b — ticaret (DEC-0051/0052); hepsi [TASLAK]
  TICARET_NUFUS_BINDE: 1, // liman şehrinin aylık ticaret geliri: nüfusun binde biri (40.000 → 40)
  TICARET_SAVAS_DENIZI_YUZDE: 50, // limanın denizinde savaştığınız bir donanma varsa
  TICARET_GECIT_YUZDE: 50, // denizin ticaret geçidi (boğaz) düşman kontrolündeyse
  AMBARGO_HEDEF_YUZDE: 10, // her ambargo hedefin ticaretinden düşer (en çok %50)
  AMBARGO_HEDEF_EN_COK: 50,
  AMBARGO_KOYAN_YUZDE: 5, // koyanın kendi ticaret kaybı (ambargo başına)
  AMBARGO_ILISKI: -20, // hedefin koyana bakışı
  // 8c — casusluk (DEC-0051/0053); hepsi [TASLAK]. hazirlik gün, basari %, sure: etkinin süresi (gün)
  CASUS: {
    askeri: { ad: "Askerî istihbarat", bedel: 150, hazirlik: 30, basari: 70, sure: 180 },
    diplomatik: { ad: "Diplomatik istihbarat", bedel: 120, hazirlik: 30, basari: 70, sure: 180 },
    isyan: { ad: "İsyanı destekleme", bedel: 250, hazirlik: 60, basari: 50, sure: 180 },
    sabotaj: { ad: "Sabotaj", bedel: 200, hazirlik: 45, basari: 50, sure: 0 },
  },
  CASUS_EN_COK: 2, // aynı anda yürüyen görev (devlet başına)
  CASUS_YAKALANMA_YUZDE: 50, // başarısız görevde casusun yakalanma olasılığı
  CASUS_YAKALANMA_ILISKI: -30, // yakalanınca hedefin bakışı (zamanla söner)
  // TASK-0018 (3/3): yanlış istihbarat — başarılı askerî/diplomatik görevde küçük bir ihtimalle rapor çarpıtılır
  CASUS_YANLIS_BILGI_YUZDE: 20, // başarılı askeri/diplomatik görevde yanlış bilgi ihtimali
  CASUS_YANLIS_CARPAN_EN_AZ: 700, // binde; gerçek sayının %70'i ile %130'u arasında görünür
  CASUS_YANLIS_CARPAN_EN_COK: 1300,
  CASUS_ISYAN_RISK: 25, // isyan desteği şehir riskine
  CASUS_SABOTAJ_GUN: 60, // süren inşaatı geciktirme
  CASUS_SABOTAJ_GARNIZON_YUZDE: 30, // inşaat yoksa garnizon kaybı
  YZ_CASUS_OLASILIK: 10, // savaştaki AI'nın aylık askerî istihbarat görevi açma olasılığı (%)
  // TASK-0017 — vergi oranı (DEC-0066); hepsi [TASLAK]
  VERGI_ORANI_GELIR_YUZDE: { dusuk: 80, orta: 100, yuksek: 130 },
  VERGI_ORANI_RISK_PUANI: { dusuk: -5, orta: 0, yuksek: 15 },
  HAZINE_GECMISI_EN_COK: 12, // ay
  // TASK-0017 (4/4) — temel diplomasi: ticaret anlaşması ve saldırmazlık paktı; hepsi [TASLAK]
  TICARET_ANLASMA_ESIGI: 10, // kabul için en az bu ilişki
  TICARET_ANLASMA_YUZDE: 10, // her anlaşma, liman ticaret gelirine bu kadar ek yüzde verir
  TICARET_ANLASMA_EN_COK_YUZDE: 30, // birden çok anlaşmanın toplam tavanı
  SALDIRMAZLIK_ESIGI: 0, // kabul için en az bu ilişki
  SALDIRMAZLIK_AYLARI: [12, 24, 36] as const,
  SALDIRMAZLIK_VARSAYILAN_AY: 24,
  // TASK-0018 (2/3) — vasallık; hepsi [TASLAK]
  VASAL_VERGI_YUZDE: 15, // vasalın aylık gelirinden efendiye aktarılan pay
  VASAL_SERBEST_ILISKI: 15, // serbest bırakılınca vasalın efendiye bakışı iyileşir
  VASAL_TEKLIF_ARAZI_KATI: 3, // TASK-0021 (4/4): AI, arazisi bu kattan büyükse ve komşuysa vasallık teklif edebilir
  // TASK-0019 — birim çeşitliliği; hepsi [TASLAK], ilk oynanışla ayarlanacak
  BIRIM: {
    piyade: { ad: "Piyade", maliyetYuzde: 100, maasYuzde: 100, saldiriYuzde: 100, savunmaYuzde: 100, hizYuzde: 100 },
    okcu: { ad: "Okçu", maliyetYuzde: 80, maasYuzde: 90, saldiriYuzde: 80, savunmaYuzde: 130, hizYuzde: 100 },
    suvari: { ad: "Süvari", maliyetYuzde: 180, maasYuzde: 160, saldiriYuzde: 140, savunmaYuzde: 70, hizYuzde: 150 },
  },
  // TASK-0020 (1/3, DEC-0069) — AI'dan oyuncuya diplomatik teklifler; hepsi [TASLAK]
  YZ_DIPLOMASI_TEKLIF_OLASILIK: 1, // AI'nın aylık kararında, ilişki uygunsa teklif sunma olasılığı (%)
  YZ_DIPLOMASI_SOGUMA_GUN: 180, // bir devlet, cevaplanan/süresi dolan teklifinden sonra bu kadar gün yeni teklif göndermez
  // TASK-0020 (2/3) — elçi gönderme: hediyenin ucuz ama gecikmeli alternatifi; hepsi [TASLAK]
  ELCI_BEDEL: 180,
  ELCI_GUN: 60,
  ELCI_ILISKI: 15, // varınca eklenen puan
  ELCI_EN_COK: 30, // hediyeyle aynı birikim sınırı mantığı (bağımsız havuz)
  // TASK-0021 (2/4, DEC-0070) — elçi küçük başarısızlık/yakalanma riski; casusluğun yakalanma desenini mirror eder
  ELCI_BASARISIZLIK_YUZDE: 15, // varış gününde yakalanma olasılığı
  ELCI_YAKALANMA_ILISKI: -15, // yakalanınca ilişkiye eklenir (zamanla söner, casustan daha hafif)
  // TASK-0026 şehir adı ve birleştirme [TASLAK]
  SEHIR_ADI_EN_UZUN: 32,
  SEHIR_BIRLESTIR_BEDEL: 500,
  SEHIR_BIRLESTIR_GUN: 30,
  SEHIR_BIRLESTIR_RISK: 10, // iki şehrin istikrar riskine eklenir (aylık hesapta söner)
  // TASK-0028 gelişmişlik ve gelir kaynağı [TASLAK]
  GELISMISLIK_VARSAYILAN: 5, // senaryoda yoksa (%100)
  GELISMISLIK_TABAN: 70, // gelir yüzdesi = taban + adım × gelişmişlik (1 → %76, 5 → %100, 10 → %130)
  GELISMISLIK_ADIM: 6,
  KAYNAK_TARIM_TARLA: 125, // tarım şehrinde tarla geliri
  KAYNAK_TICARET_PAZAR: 125, // ticaret şehrinde pazar ve liman geliri
  KAYNAK_ZANAAT_PAZAR: 115,
  KAYNAK_ZANAAT_TOPLAMA: 90, // zanaat şehrinde asker toplama bedeli
  KAYNAK_HAYVANCILIK_SUVARI: 80, // hayvancılık şehrinde süvari toplama bedeli
  // TASK-0032 denge (2.152 şehirli dünya) [TASLAK]
  YAPI_REFERANS_NUFUS: 20000, // yatırım geliri bu nüfusta %100; nüfusla orantılı
  YAPI_NUFUS_EN_AZ_YUZDE: 25,
  YAPI_NUFUS_EN_COK_YUZDE: 150,
  GELISMISLIK_YATIRIM_ADIM: 3, // her bu kadar yatırım seviyesinde gelişmişlik +1
  YZ_YATIRIM_GERI_DONUS_AY: 60, // AI ve yerel yönetici kendini bu sürede ödemeyen yatırımı yapmaz
};
