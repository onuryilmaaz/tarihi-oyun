# TARİHÎ STRATEJİ OYUNU

## Ana Ürün Vizyonu, Oyun Tasarım Belgesi (GDD), Teknik Karar Çerçevesi ve AI Agent Geliştirme Protokolü

**Belge sürümü:** 1.3 --- Teknoloji ve platform sırası kararları (bkz.
`DECISIONS.md`, `CHANGELOG.md`)\
**Durum:** Onaylı tasarım tabanı (29 Ekim 2026, DEC-0011); \[TASLAK\] ve
\[AÇIK\] maddeler kullanıcı onayına tabidir\
**Tarih:** 28 Ekim 2026\
**Hedef platformlar:** Web + mobil; önce web, mobil sonraki aşama
(DEC-0013)\
**İlk oyun modu:** Tek oyunculu; çok oyunculu sonraki aşama\
**İlk sürüm senaryosu:** Tek senaryo --- 1453 (DEC-0004)\
**Dil:** Türkçe (çok dillilik hazırlığı değerlendirilecek)\
**Belgenin sahibi / nihai karar mercii:** Proje sahibi (kullanıcı)

> **ÜST KURAL:** Bu belge AI agent'ların bağımsız ürün sahibi gibi
> davranmasına izin vermez. Her aşamada kullanıcı sürece katılır.
> Belirsiz konular karara bağlanmadan uygulanmaz. Bir agent,
> kullanıcının açık onayı olmadan kapsamı, temel mekanikleri, teknoloji
> yığınını, görsel yönü, veri kaynaklarını veya üretim ortamını
> değiştiremez.

------------------------------------------------------------------------

# 0. BU BELGE NASIL KULLANILIR?

Bu dosya, farklı AI agent'ların aynı ürün hedefini paylaşması için **tek
referans kaynağıdır**. Üç bilgi düzeyini kesin biçimde ayırır:

-   **\[KARAR\]** Kullanıcının keşif görüşmesinde açıkça seçtiği veya
    doğruladığı gereksinim.
-   **\[TASLAK\]** Bu kararın uygulanabilir hâle gelmesi için
    hazırlanmış, henüz kullanıcı tarafından tek tek onaylanmamış
    ayrıntı. Kodlama öncesinde onay gerektirir.
-   **\[AÇIK\]** Henüz karara bağlanmamış konu; agent soru sormalı veya
    seçenekli karar kaydı hazırlamalıdır.

**Öncelik sırası:** (1) Kullanıcının son açık talimatı, (2) onaylanmış
karar kayıtları, (3) bu belgedeki \[KARAR\] maddeleri, (4) onaylı
ayrıntılı alt dokümanlar, (5) \[TASLAK\] maddeleri. Çelişki varsa agent
uygulamayı durdurur, çelişkiyi açıklar ve onay ister. Sessizce varsayım
üretmez.

**Değişiklik yöntemi:** Her önemli değişiklik için `DECISIONS.md`
dosyasında ID, tarih, konu, alternatifler, seçilen karar, gerekçe,
etkilenen modüller ve onay kaydı tutulur. `CHANGELOG.md` güncellenir.
Kabul edilmiş gereksinimlerin izini kaybettiren toplu yeniden yazımlar
yapılmaz.

**Bu belgenin sınırı:** Ürün vizyonu ayrıntılıdır; henüz kesinleşmemiş
sayı, denge formülü, harita veri lisansı, ağ mimarisi, framework, tarihî
veri kümesi, ekonomik parametre veya üretim takvimi *onaylanmış gerçek*
değildir. Aşağıdaki örnekler test ve tartışma içindir.

------------------------------------------------------------------------

# 1. ÜRÜN KİMLİĞİ VE TASARIM FELSEFESİ

## 1.1 Oyun tanımı

\[KARAR\] Farklı tarihî başlangıç senaryolarında bir **devleti**
yöneterek tarihî koşullardan kendi alternatif tarihini ürettiğin; net
siyasi sınırları bulunan ayrıntılı dünya haritası üzerinde oynanan,
**tur bazlı** büyük strateji oyunu. Oyuncu bir hükümdarın ömrüyle
sınırlı değildir; devletin sürekliliğini yönetir.

\[KARAR\] Tarih, senaryonun **başlangıç koşullarını** belirler. Senaryo
başladıktan sonra fetihler, hanedan sıraları, ittifaklar, teknolojiler
ve devletlerin kaderi tarihî takvim tarafından zorla dayatılmaz. Yapay
zekâ devletleri de bağımsız kararlar alır.

\[KARAR\] Oyun Age of History'nin kopyası gibi hissettirilmemelidir.
Oyuncunun beğendiği belirli kavramlar (bölgesel siyasi harita, savaş
sonrası toprak talepleri gibi) referans alınabilir; görsel dil, oynanış
döngüsü, sistem ilişkileri ve ürün kimliği özgün olmalıdır. Başka
oyunların varlıkları, arayüzleri veya kodları izinsiz kopyalanamaz.

\[KARAR\] Harita merkezî arayüzdür; siyasi okunabilirlik, net sınırlar,
ayrıntılı yakınlaştırma ve devletlerin zaman içindeki dönüşümünü izleme
deneyimi kritik önemdedir.

## 1.2 Tasarım ilkeleri

1.  **Devlet odaklılık:** Oyuncu ülkeyi yönetir; hanedan, hükümdar ve
    komutanlar ülke yönetiminin parçalarıdır.
2.  **Gerçekçi başlangıç, serbest gelecek:** Tarihî doğruluk senaryo
    açılışında yüksek; sonrasında deterministik tarihî olay zorlaması
    yok.
3.  **Derinlik, zorunlu mikro yönetim değil:** Ayrıntılı sistemler
    oyuncu isterse incelenir; rutin işlemler devredilebilir.
4.  **Haritada açıklık:** Ülke, sınır, şehir, ordu, diplomasi ve riskler
    kolay ayırt edilir.
5.  **Neden-sonuç:** Savaş, vergi, ticaret, teknoloji, göç, isyan ve
    diplomasi birbirini anlamlı şekilde etkiler.
6.  **Bilgi asimetrisi:** Rakibin gizli askerî/diplomatik verileri her
    zaman açık değildir; istihbarat değer taşır.
7.  **Oyuncu kontrolü:** Turun ne zaman ilerleyeceği ve tur uzunluğu
    oyuncu kontrolündedir.
8.  **Tarihî çeşitlilik:** Devletlerin kurumları, verasetleri, asker
    toplama yöntemleri ve avantajları aynı kalıba sıkıştırılmaz.
9.  **Adil belirsizlik:** Belirsizlik görünür sebeplere dayanır;
    açıklanamayan rastgele cezalandırma en aza indirilir.
10. **AI geliştirmede insan onayı:** Kod, sanat, denge ve kapsam
    üzerinde nihai karar daima kullanıcıdadır.

## 1.3 Başarı kriterleri \[TASLAK\]

-   Oyuncu haritada siyasi durumu tek bakışta okuyabilir.
-   1453 gibi bir senaryoda başlangıç devletleri, sınırlar, önemli
    şehirler ve hükümdarlar doğrulanabilir kaynaklarla açıklanabilir.
-   Aynı başlangıç farklı kararlarla farklı tarih üretir; önceden
    yazılmış olay dizisine kilitlenmez.
-   Oyuncu ordulara emir verebilir, tur ilerletir, hareket süresini ve
    savaş sonuçlarını anlaşılır biçimde görür.
-   Büyük bir devleti yönetmek, her şehri ve orduyu sürekli tek tek
    tıklamayı gerektirmez.
-   Sistemler kayıt/yükleme sonrasında tutarlı ve tekrarlanabilir
    çalışır.
-   Web ve mobilde temel harita etkileşimleri kullanılabilir ve
    performans ölçümleri kabul edilen eşikleri karşılar.

------------------------------------------------------------------------

# 2. KESİNLEŞEN OYUN KARARLARI (KAYNAK ÖZETİ)

  ------------------------------------------------------------------------------------
  Alan                    Durum                   Karar
  ----------------------- ----------------------- ------------------------------------
  Oynanış zamanı          KARAR                   Tur bazlı; tur süresini oyuncu
                                                  belirler

  Oyuncu rolü             KARAR                   Hükümdar değil, devlet

  Tarih                   KARAR                   Tarihî başlangıç; sonraki gelişmeler
                                                  serbest

  Harita                  KARAR                   Keskin siyasi sınırlar; çok katmanlı
                                                  tarihî idari yapı

  Yakınlaştırma           KARAR                   Öncelikle şehir, yol, idari birim ve
                                                  siyasi ayrıntı

  Şehir gelişimi          KARAR                   Sayısal, görsel ve çağlara göre
                                                  dönüşüm

  Şehir yönetimi          KARAR                   Önemli şehirleri elle; diğerlerini
                                                  yerel yöneticiyle

  Toprak kontrolü         KARAR                   Şehir ve çevre topraklar ayrı ele
                                                  geçirilebilir

  Ordu hareketi           KARAR                   Serbest harita hareketi; mesafe ve
                                                  koşullara göre tur süresi

  Ordu görseli            KARAR                   Bayrak/simge/asker sayısı; sade

  Savaş                   KARAR                   Otomatik çözüm; stratejik emirler
                                                  etkili

  Kuşatma                 KARAR                   Süre, sur, ikmal, abluka, saldırı ve
                                                  teslim seçenekleri

  Ordu kurulumu           KARAR                   Şehir + merkezî toplama; tarihî
                                                  yöntemler; birleştir/böl

  Takviye                 KARAR                   İnsan gücü, hazine, mesafe, ikmal;
                                                  otomasyon/öncelik

  Deneyim                 KARAR                   Birlik türü deneyimi ve komutan
                                                  etkisi

  Komutan                 KARAR                   Oyuncu atar; uzmanlık, tecrübe,
                                                  tarihî kişiler ve yeni nesiller

  Moral                   KARAR                   Zafer, yenilgi, maaş, ikmal,
                                                  yorgunluk; çözülme/toparlanma

  Yenilgi                 KARAR                   Geri çekilme, dağılma, esir, takip;
                                                  komutan/coğrafya etkisi

  Donanma                 KARAR                   Gemi türleri, ablukalar, çıkarma,
                                                  boğazlar, deniz ticareti

  Savaş ilanı             KARAR                   Serbest; diplomatik ve siyasi
                                                  sonuçlar

  İttifak                 KARAR                   Güç dengesi ve tarihî ilişkiler
                                                  belirleyici

  Diplomasi haritası      KARAR                   İlişkiler renklerle gösterilir

  Casusluk                KARAR                   Askerî/diplomatik istihbarat, isyan
                                                  desteği, sabotaj

  Rakip bilgisi           KARAR                   Tam açık değil;
                                                  keşif/ticaret/diplomasi/casuslukla
                                                  öğrenilir

  Barış                   KARAR                   Bölgesel değer/üstünlük temelli
                                                  talepler; tam zafer koşulları

  Başkent                 KARAR                   Düşmesi önemli; otomatik devlet
                                                  çöküşü değil

  Ekonomi                 KARAR                   Üretim, kaynak, ticaret, dinamik
                                                  koşullar; otomasyon

  Ticaret                 KARAR                   Otomatik akış + anlaşma, gümrük,
                                                  ambargo, güzergâh kontrolü

  Borç                    KARAR                   **Devlet borçlanması yok**; isteğe
                                                  bağlı harcamada hazine sınırı;
                                                  zorunlu giderlerle eksi bakiye
                                                  mümkün (DEC-0002)

  Teknoloji               KARAR                   Ortak ağaç; araştırmayı oyuncu
                                                  seçer; paralel alanlar

  Teknoloji sonucu        KARAR                   İstatistik, yeni birlik/yapı/seçenek
                                                  ve görsel değişim

  Hanedan                 KARAR                   Halef seçimi; devletin tarihî
                                                  veraset kuralları belirleyici

  Alternatif soy          KARAR                   Kültüre ve soy ağacına uygun tarihî
                                                  isim havuzu

  Karakter                KARAR                   Hükümdarlar, önemli tarihî kişiler;
                                                  gelecekte yeni karakterler

  Din/kültür              KARAR                   Nüfus, politika, diplomasi ve
                                                  değişimle bağlantılı

  Nüfus                   KARAR                   Din/kültür/meslek dağılımı; doğum,
                                                  ölüm, göç, salgın vb.

  Göç                     KARAR                   Kendiliğinden ve politika kaynaklı;
                                                  yerel/uluslararası

  İdare                   KARAR                   Devlete özgü; yerel yöneticiye
                                                  yetki; oyuncu müdahalesi

  İsyan                   KARAR                   Risk önceden görülebilir; harita,
                                                  uyarı ve panel

  İsim/bayrak             KARAR                   Tarihî dönüşüm ve isteğe bağlı
                                                  özelleştirme

  Dünya akışı             KARAR                   Oyun kapalıyken ilerlemez

  Kayıt                   AÇIK                    Farklı kayıt/geri alma modları
                                                  değerlendirilecek (OPEN-007;
                                                  DEC-0003)

  İlk senaryo             KARAR                   İlk sürümde tek senaryo: 1453
                                                  (DEC-0004)

  Tur süresi seçenekleri  KARAR                   1 hafta / 1 ay / 3 ay / 1 yıl;
                                                  sabit iç adım (DEC-0005)

  Uzun tur kesintisi      KARAR                   Kritik olayda tur durur, kararı
                                                  oyuncu verir (DEC-0006)

  En küçük arazi birimi   KARAR                   Elle çizilmiş poligon; şehir ayrı
                                                  nokta nesnesi (DEC-0007)

  Geri çekilme            KARAR                   Oyuncunun verdiği karara/emre
                                                  bağlı (DEC-0008)

  Teknoloji               KARAR                   TypeScript + three.js; hazır oyun
                                                  motoru yok (DEC-0012)

  Platform sırası         KARAR                   Önce web; mobil ertelendi
                                                  (DEC-0013)
  ------------------------------------------------------------------------------------

**Önemli güncellenmiş karar:** Eski görüşmelerde gerçek zamanlı akış ve
komşu bölgeye hareket konuşulmuş olsa da daha sonra **tur bazlı oyun**
ve **serbest konum hedefli, tur süresi hesaplanan ordu hareketi**
seçilmiştir. Yeni kararlar geçerlidir.

------------------------------------------------------------------------

# 3. OYUNCU DENEYİMİ VE ANA OYUN DÖNGÜSÜ

## 3.1 Senaryo başlangıcı \[TASLAK\]

1.  Oyuncu yeni oyun açar.
2.  Tarihî başlangıç yılı/senaryosu seçer.
3.  Devlet seçer; haritada devletin sınırları, başkenti, kurumları ve
    mevcut koşulları gösterilir.
4.  İsteğe bağlı oyun kuralları ve kayıt modu seçilir.
5.  Oyun, seçilen tarihin doğrulanmış başlangıç verilerini yükler.
6.  Oyuncu ilk turda hazine, ordu, diplomasi, araştırma, nüfus ve risk
    özetini görür.
7.  Oyuncu emirleri verir, isterse şehirleri ve yönetimi devreder.
8.  Oyuncu tur süresini belirleyip **Turu İlerle** komutunu verir.
9.  Simülasyon bütün devletler için tutarlı bir sıra içinde işler;
    sonuçlar haritaya ve olay akışına yansır.
10. Oyuncu yeni durumu değerlendirir ve devam eder.

## 3.2 Turun temel evreleri \[TASLAK; sıranın onayı gerekli\]

1.  Emirlerin doğrulanması ve maliyetlerin kontrolü.
2.  Devlet politikaları, diplomasi ve araştırma ilerlemesi.
3.  Üretim, vergi, ticaret, nüfus ve kaynak güncellemeleri.
4.  Asker toplama, takviye, ikmal ve hareket ilerlemesi.
5.  Keşif, tespit, karşılaşma, muharebe ve kuşatma çözümü.
6.  İşgal, kontrol, barış, isyan riski ve idari sonuçlar.
7.  Tarihî kişilerin yaşlanması, veraset ve karakter olayları.
8.  AI devletlerinin yeni kararlarının ve bildirimlerin hazırlanması.
9.  Kayıt anlık görüntüsü, olay günlüğü ve oyuncuya sonuç raporu.

**Tur süresi (DEC-0005, DEC-0006):** \[KARAR\] Seçenekler 1 hafta, 1
ay, 3 ay ve 1 yıldır. Simülasyon, seçilen süreden bağımsız olarak sabit
iç adımlarla işler; böylece tek bir 1 yıllık tur ile 12 adet 1 aylık tur
aynı sonucu üretir (AT-005). \[KARAR\] Uzun turda oyuncuyu ilgilendiren
kritik bir olay olursa (ör. oyuncu ordusunun düşmanla karşılaşması,
oyuncuya savaş ilanı, hükümdar ölümü) tur o noktada durur ve kararı
oyuncu verir. \[TASLAK\] İç adım boyları (ör. hareket/muharebe günlük,
ekonomi aylık), kesinti tetikleyicilerinin tam listesi ve hangi
tetikleyicilerin ayarlardan kapatılabileceği onay gerektirir.

## 3.3 Oyuncu kontrolü ve otomasyon \[KARAR + TASLAK\]

-   Oyuncu bir orduyu doğrudan yönetebilir veya komutana emir verebilir.
-   Komutan emirleri uygulamakla yükümlüdür; kendiliğinden emre aykırı
    hareket varsayılan davranış değildir.
-   Oyuncu önemli şehirlerde yapı ve yatırım kararlarını kendisi verir.
-   Rutin yerel yönetim yetkili yöneticilere devredilebilir.
-   Ekonomi, ticaret, ikmal ve takviye uygun ayarlarla otomatik
    yürüyebilir.
-   Otomasyonun hangi işlemleri yapabildiği, bütçe limitleri ve geri
    alınabilirliği **\[AÇIK\]**.

------------------------------------------------------------------------

# 4. HARİTA VE COĞRAFYA ŞARTNAMESİ

## 4.1 Dünya ve harita katmanları

\[KARAR\] Dünya ölçekli harita, net devlet sınırları ve
yakınlaştırıldıkça artan siyasi/coğrafi ayrıntı sunar. Her devletin
idari hiyerarşisi tarihî koşullarına uygun olabilir: ör. Osmanlı'da
eyalet/sancak/şehir; başka ülkede farklı isim ve katmanlar.

**Mantıksal katmanlar \[TASLAK\]:** Dünya → devlet → idari bölge → alt
idari bölge → yerleşim → seçilebilir arazi/kontrol birimi. Her katman
her dönemde veya her devlette aynı sayıda olmak zorunda değildir.

**Harita görünümleri \[KARAR\]:** Siyasi, diplomatik, isyan riski.
**\[TASLAK\]** Ekonomik üretim, kültür/din, ikmal ve askerî istihbarat
görünümleri ayrı tasarım onayıyla eklenebilir.

## 4.2 Sınırlar ve seçilebilir alanlar

-   \[KARAR\] Siyasi sınırlar keskin, renkler ayırt edilebilir ve
    yakınlaştırmada okunur olmalıdır.
-   \[KARAR\] Şehir ve çevresindeki topraklar otomatik tek bir fetih
    paketi değildir.
-   \[KARAR\] Ordular idari bölge merkezleri arasında sıçramak yerine
    haritada serbest hedef konuma yürür.
-   \[TASLAK\] **Siyasi mülkiyet**, **fiilî askerî işgal** ve **idari
    bağlılık** ayrı veri alanları olmalıdır; barışla sınır değişimi ile
    geçici işgal karıştırılmamalıdır.
-   \[KARAR\] En küçük fethedilebilir birim, elle çizilmiş poligon
    arazi birimidir; boyutu yerleşim yoğunluğuna göre değişir (kabaca
    kaza/nahiye ölçeği). Şehirler bu birimlerden ayrı nokta
    nesneleridir (DEC-0007). Grid (altıgen/kare) kullanılmaz.
-   \[AÇIK\] Arazi birimlerinin toplam sayısı, topolojik veri biçimi, yol
    ağı ayrıntısı, sınırların tarihsel değişimi ve sınır doğruluk
    düzeyi.

## 4.3 Yakınlaştırma ve etkileşim

-   Uzak ölçek: Devlet adları, renkleri, sınırları, büyük ordular ve
    önemli başkentler.
-   Orta ölçek: İdari birimler, şehirler, yollar, limanlar, geçitler ve
    ordu simgeleri.
-   Yakın ölçek: Yerleşim ayrıntıları, bağlı araziler ve seçilebilir
    kontrol noktaları.
-   Harita seçimleri klavye/fare/dokunmatik etkileşimine uygun olmalı.
-   Seçilen alanın siyasi statüsü, işgal durumu ve temel verileri aynı
    kaynak durumundan gelmeli.
-   Siyasi renkler erişilebilirlik açısından yalnızca renge dayanmamalı;
    kenarlık, desen veya etiket seçenekleri değerlendirilmeli.

## 4.4 Şehir görselliği

\[KARAR\] Şehirler sayısal olarak gelişir; yapılaşmaları haritada
değişebilir; tarihî çağlara göre mimari dönüşüm görülür. \[KARAR\] Buna
rağmen yakınlaştırmada temel öncelik siyasi/idari ayrıntıdır.

\[TASLAK\] Görsel yoğunluk, performans için seviyeli ayrıntı (LOD) ve
isteğe bağlı kalite ayarlarıyla kontrol edilebilir. Görsel şehir
gelişimi gerçek simülasyon verisine dayanmalı; yalnızca rastgele
dekorasyon olmamalıdır.

## 4.5 Coğrafi veri güvenilirliği

-   Her senaryo için harita verisinin tarihi, kaynağı, lisansı ve
    belirsizlik düzeyi belgelenir.
-   Tartışmalı veya döneme göre değişken sınırlar için tarihçi
    değerlendirmesi ve açıklama alanı gerekir.
-   Güncel modern sınırlar tarihî sınırlarmış gibi kullanılmaz.
-   Coğrafi veri ile oyun amaçlı sadeleştirme ayrımı kayıt altına
    alınır.
-   Açık lisans, atıf, türetilmiş veri ve dağıtım hakları doğrulanmadan
    varlık üretim hattına alınmaz.

------------------------------------------------------------------------

# 5. TARİHÎ SENARYO VE ALTERNATİF TARİH

## 5.1 Başlangıç verisi

\[KARAR\] Başlangıç senaryoları dönemin devletlerini, sınırlarını,
başkentlerini, önemli hükümdarlarını, hanedanlarını ve siyasi
ilişkilerini yansıtmalıdır. Nüfus, ordu ve ekonomik rakamların tarihî
kesinliği mümkün değilse makul tahmin kullanılabilir; **tahmin olduğu
açıkça etiketlenir**.

\[KARAR\] İlk sürümde **tek senaryo vardır: 1453** (DEC-0004). Harita
dünya ölçeklidir; tam ayrıntı (arazi birimleri, yerleşimler, yollar)
öncelikle Balkanlar, Anadolu ve Doğu Akdeniz için üretilir; dünyanın
geri kalanı ilk sürümde devlet ve büyük bölge düzeyinde kalır.
\[TASLAK\] Tam ayrıntı bölgesinin kesin sınırları onay gerektirir.

\[TASLAK\] Senaryo veri paketi: `scenario_id`, tarih, coğrafi sürüm,
devletler, başkentler, idari hiyerarşiler, hükümdarlar, soy ilişkileri,
başlangıç ilişkileri, ordu/donanma, ekonomi, teknoloji, nüfus ve kaynak
atıfları.

## 5.2 Oyun başladıktan sonra

-   \[KARAR\] İstanbul'un fethi gibi olaylar takvime bağlı zorunlu olay
    değildir.
-   \[KARAR\] Devletler farklı ittifaklar kurabilir, güçlenebilir,
    küçülebilir veya parçalanabilir.
-   \[KARAR\] Hanedan devamı oyuncu ve simülasyon kararlarıyla gerçek
    tarihten ayrılabilir.
-   \[KARAR\] Alternatif soyun isimleri kültüre ve hanedan geleneğine
    uygun tarihî isim havuzundan gelir.
-   \[TASLAK\] Dünya olayları, koşullara bağlı sistemik sonuçlar olarak
    üretilir; zorunlu tarihî olay script'leri temel oynanışı yönetmez.

## 5.3 Devlet sürekliliği

\[KARAR\] Devletin yenilmesi veya dağılması her zaman oyun sonu olmak
zorunda değildir. \[AÇIK\] Toparlanma veya başka devlete geçme gibi
seçenekler düşünülmüş, henüz karara bağlanmamıştır (DEC-0003; OPEN-024).
Hangi durumlarda ülke değiştirme mümkün olduğu,
ironman ve başarı koşulları.

------------------------------------------------------------------------

# 6. DEVLET, HÜKÜMDAR, HANEDAN VE KARAKTERLER

## 6.1 Oyuncunun kimliği

\[KARAR\] Oyuncu devletin yöneticisidir; tek karaktere kilitlenmez.
Hükümdar ölümü oyunu bitirmez.

## 6.2 Veraset

-   \[KARAR\] Oyuncu uygun koşullarda halef seçimine müdahale edebilir.
-   \[KARAR\] Sonuçlar devletin tarihî veraset geleneğine bağlıdır.
-   \[KARAR\] Gerçek tarihî sıradan ayrılırsa yeni soy çizgisi oluşur.
-   \[TASLAK\] Veraset veri modeli: hükümdar, hanedan, ebeveyn/çocuk
    ilişkileri, adaylar, geçerli hukuk/gelenek, tahta çıkış, meşruiyet
    ve halef olayları.
-   \[AÇIK\] Halef seçimindeki kısıtlar, taht mücadelelerinin kesin
    tetikleyicileri, evlilik ve soy ağacı ayrıntısı.

## 6.3 Karakter kapsamı

\[KARAR\] Tarihî hükümdarlar, önemli sadrazamlar/devlet adamları,
komutanlar ve hanedan üyeleri yer alır. Gelecekte yeni kişiler üretilir.
\[KARAR\] Ayrıntılı kişisel entrika simülasyonu oyunun ana ekseni
değildir.

\[TASLAK\] Asgari karakter alanları: kimlik, isim, doğum/ölüm tarihleri
(biliniyorsa), bağlı devlet/hanedan, görev, uzmanlık, yetenek ve tarihî
kaynak. Yapay zekâ tarafından oluşturulan karakterler açıkça kurgusal
olarak işaretlenir.

## 6.4 Devlete özgü kurumlar

\[KARAR\] Osmanlı'nın sancak/eyalet, asker toplama ve yönetim kurumları
başka devletlerden farklı olabilir. Reformlarla bazı yapılar
değişebilir. \[AÇIK\] Reformların kapsamı ve tarihî sınırlamaları.

------------------------------------------------------------------------

# 7. DİPLOMASİ, GÜÇ DENGESİ VE İSTİHBARAT

## 7.1 Diplomatik ilişkiler

\[KARAR\] Savaş ilanı serbesttir; saldırganlığın siyasi ve diplomatik
sonuçları olabilir. Devletler güçlü rakiplere karşı denge ittifakları
kurabilir; ancak tarihî düşmanlıklar, hanedan ve dinî ilişkiler
ittifakları etkiler. Otomatik, gerekçesiz 'oyuncuya karşı herkes
birleşsin' kuralı kullanılmaz.

\[TASLAK\] İlişki bileşenleri: güven, tehdit algısı, geçmiş savaşlar,
ortak rakip, ticaret bağı, dinî/kültürel yakınlık, hanedan bağı, mevcut
anlaşmalar. Ağırlıklar denge testleriyle onaylanır.

## 7.2 Diplomatik eylemler \[TASLAK\]

İttifak, barış, ateşkes, ticaret antlaşması, geçiş izni, vasallık,
bağımsızlık desteği, ambargo ve diplomatik tavizler. Her eylemin
koşulları, maliyeti, süresi, iptal şartı ve AI değerlendirme mantığı
ayrıca onaylanmalıdır.

## 7.3 Diplomasi haritası

\[KARAR\] Müttefik, düşman, vasal ve tarafsız devletler haritada farklı
renklerle gösterilir. İlişki çizgileri zorunlu değildir.

## 7.4 Casusluk

\[KARAR\] Askerî istihbarat, diplomatik istihbarat, isyanları destekleme
ve sabotaj bulunur. Rakiplerin asker sayıları/konumları ve yabancı şehir
ayrıntıları otomatik tam açık değildir.

\[TASLAK\] Casusluk eylemi için hedef, hazırlık süresi, maliyet, keşif
seviyesi, başarı olasılığı, yakalanma sonucu ve diplomatik etkiler
tanımlanır. **\[AÇIK\]** Yanlış istihbarat, karşı istihbarat ve casus
ağlarının ayrıntı düzeyi henüz kesinleşmemiştir.

------------------------------------------------------------------------

# 8. ORDU, HAREKET VE MUHAREBE

## 8.1 Ordu veri modeli \[TASLAK\]

`army_id`, bağlı devlet, harita konumu, hedef konum, hareket emri,
komutan, birlik grupları, mevcut/maksimum personel, moral, ikmal, maaş
durumu, yorgunluk, tecrübe, hareket ilerlemesi, işgal/kuşatma görevi,
emir önceliği ve durum.

## 8.2 Asker toplama

\[KARAR\] Hem şehir bazlı hem merkezî asker toplama; devletin tarihî
kurumlarına göre birim türleri. Ordular birleştirilip bölünebilir.
\[TASLAK\] İnsan gücü havuzu, asker alma süresi, eğitim, maliyet ve
birim üretim sınırları simülasyonla hesaplanır.

## 8.3 Serbest hareket ve süre

\[KARAR\] Oyuncu haritada hedef noktayı seçer; ordu oraya belirli tur
sayısında gider. Mesafe, yol, coğrafya, ikmal ve ordu özellikleri etkili
olabilir. **Önceki komşu bölgeye hareket kararı geçersizdir.**

\[TASLAK\] Yol bulma, kara/deniz geçişleri, nehir ve dağ maliyetleri,
düşman kontrolü, erişim izinleri ve ulaşılmaz hedef durumları açıkça
modellenir. Hesaplanan tahmini varış tarihi ve gerekçeleri UI'da
gösterilir. Tur süresi değişirse kalan mesafe ve geçen süre korunur;
ordu 'ışınlanmaz'.

## 8.4 Keşif ve karşılaşma

\[KARAR\] İki düşman ordusu karşılaşınca savaş ihtimali; keşif, tespit,
kaçınma, saldırı, savunma ve geri çekilme emirleri sonucu etkiler.
\[TASLAK\] Tespit mesafesi, gizlilik, görüş, hareket eşzamanlılığı ve
çatışma önceliği ayrı tasarım gerektirir.

## 8.5 Muharebe çözümü

\[KARAR\] Savaşlar otomatik çözülür; oyuncu bir taktik savaş ekranında
birimleri tek tek kontrol etmez. Etkenler: birlik türleri ve
deneyimleri, komutan uzmanlığı, moral, arazi, ikmal, teknoloji, sayı,
savunma koşulları.

\[TASLAK\] Muharebe çözümü deterministik çekirdek + kayıtlı rastgelelik
tohumu ile yeniden üretilebilir olmalıdır. Sonuç raporu: kazanan,
kayıplar, esirler, geri çekilme, moral, komutan etkisi ve önemli
nedenler. **\[AÇIK\]** Formüller ve savaş süresi.

## 8.6 Moral ve yenilgi

\[KARAR\] Moral; zafer/yenilgi, maaş, ikmal, uzun sefer, dinlenme ve
komutandan etkilenir. Morali düşen ordu geri çekilebilir veya
dağılabilir. Yenilgi sonrası takip, esir düşme ve düzenli geri çekilme
mümkün olur. Komutan ve coğrafya sonuçları değiştirir.

\[KARAR\] Geri çekilme oyuncunun verdiği karara/emre bağlıdır
(DEC-0008). Oyuncu ordunun hangi koşulda geri çekileceğini veya
direneceğini belirler; bu davranış komutanın emre uyma yükümlülüğünün
(§3.3) ihlali sayılmaz. \[KARAR\] Geri çekilme koşulu ordu emri olarak verilir (ör.
'belirli kayıp eşiğinde çekil', 'son ana kadar diren'). \[AÇIK\] Emir
seçeneklerinin kesin listesi ve moral tamamen çöktüğünde dağılmanın
emirden bağımsız gerçekleşip gerçekleşmeyeceği.

## 8.7 Takviye ve ikmal

\[KARAR\] Takviye insan gücü, hazine, mesafe ve ikmal bağlantısına
bağlıdır. Otomatik takviye ve belirli orduya öncelik verme mümkündür.
İkmal hatları, kış, arazi, yerel kaynaklar ve uzun seferler önemlidir.
Oyuncu her erzak birimini tek tek taşımaz.

\[TASLAK\] İkmal durumu açıklanabilir olmalıdır: kaynak, hat, kapasite,
tüketim, kesinti, beklenen dayanma süresi. Yerel kaynak kullanımının
ekonomi ve halk üzerindeki sonuçları ölçülebilir olmalıdır.

## 8.8 Kuşatma

\[KARAR\] Kuşatmalar zaman alabilir; sur, garnizon, erzak, deniz ikmali,
teknoloji ve arazi etkiler. Abluka, saldırı, teslim bekleme gibi
stratejik seçenekler bulunur. Taktik kuşatma mikro yönetimi yoktur.

------------------------------------------------------------------------

# 9. TOPRAK KONTROLÜ, İŞGAL VE BARIŞ

## 9.1 Kontrol ayrımı \[TASLAK\]

Her seçilebilir alan için en az `legal_owner`, `military_controller`,
`administrative_parent`, `occupation_since` ayrımı değerlendirilmelidir.
İşgal ile kalıcı ilhak birbirinden ayrı ele alınır.

## 9.2 Barış antlaşmaları

\[KARAR\] Savaş üstünlüğüne ve bölgelerin stratejik değerlerine bağlı
toprak talepleri; tazminat, vasallık, askerî/diplomatik tavizler gibi
koşullar. Tam zaferlerde devletin tümüyle ilhakı bazı gerçekçi
koşullarda mümkün olabilir.

\[TASLAK\] Bölge değerinde nüfus, ekonomi, kale, başkent, liman,
stratejik konum ve savaş durumu dikkate alınabilir. Bu, başka oyunun
barış sistemini bire bir kopyalamamalıdır. **\[AÇIK\]** Kesin puan
formülü, talep sınırları, koalisyon barışı ve savaş yorgunluğu ilişkisi.

## 9.3 Fetih sonrası yönetim

\[KARAR\] Fethedilen bölgeler isyan, kültür, din, özerklik, ekonomik
entegrasyon ve askerî kontrol gibi unsurlarla yönetilir. \[TASLAK\]
İşgal sonrası istikrar, vergi üretimi, nüfus hareketleri ve yönetim
devri kademeli sonuç verir.

## 9.4 Başkent

\[KARAR\] Başkentin düşmesi önemli siyasi/ekonomik/askerî sonuç
doğurabilir, ama otomatik zafer değildir. Hükümdar veya yönetim başka
bir merkezden devam edebilir. Etki devletin merkeziyetçiliğine bağlıdır.

------------------------------------------------------------------------

# 10. DONANMA VE DENİZCİLİK

\[KARAR\] Donanmalar haritada yönetilir, deniz savaşları otomatik
çözülür. Gemi türleri tarihî çağlara göre değişir. Boğazlar, limanlar,
deniz ticareti, abluka, çıkarma ve asker taşımacılığı önemlidir.

\[TASLAK\] Donanma: gemi türü, sayı, dayanıklılık, denizcilik deneyimi,
amiral, ikmal limanı, hareket menzili, taşıma kapasitesi, abluka gücü.
Deniz kontrolü ticaret ve askerî sevkiyatla bağlantılıdır.

\[AÇIK\] Keşif ve sömürgecilik ayrıntısı, okyanus seyrüseferi,
hava/deniz mevsimselliği, gemi inşa ve bakım sistemi.

------------------------------------------------------------------------

# 11. EKONOMİ, HAZİNE, ÜRETİM VE TİCARET

## 11.1 Ekonomi ilkeleri

\[KARAR\] Vergi, üretim, kaynak, ticaret, liman, ticaret yolları,
teknoloji, savaş ve nüfus birbirini etkiler. Ekonomi derin ama zorunlu
ayrıntılı muhasebe gerektirmez.

## 11.2 Hazine

**\[KARAR --- KESİN\] Devlet borçlanması yoktur.** Kredi, faiz, tahvil,
borç veren taraf veya borç mekaniği bulunmaz; agent bunları
kendiliğinden ekleyemez.

\[KARAR\] **Eksi bakiye mümkündür** (DEC-0002). \[KARAR\] Uygulama
ayrımı:

-   **İsteğe bağlı harcamalar** (yapı, asker toplama, yatırım,
    diplomatik ödeme vb.) için harcama öncesi kaynak doğrulaması yapılır;
    hazine yetersizse işlem reddedilir ve sebep gösterilir (AT-010).
-   **Zorunlu, tekrarlayan giderler** (ordu maaşı, bakım vb.) gelir
    yetmese bile işlenir ve hazine eksiye düşebilir. Eksi bakiye faiz
    işletmez ve kimseye borç doğurmaz; karşılanmamış yükümlülük olarak
    görünür.
-   Hazine eksideyken isteğe bağlı harcama yapılamaz.
-   \[AÇIK\] Eksi bakiyenin sonuçları (ör. maaş gecikmesi → moral,
    istikrar, isyan riski), bir alt sınır olup olmadığı ve UI gösterimi
    (OPEN-023).

## 11.3 Üretim ve kaynaklar

\[KARAR\] Bölgelerin üretimleri ve kaynakları farklı olabilir: tarım,
maden, kereste, dokuma vb. Üretim kapasitesi nüfus, teknoloji, coğrafya,
altyapı ve savaş koşullarına bağlı olabilir.

\[TASLAK\] Kaynaklar için üretim, yerel tüketim, ticaret fazlası,
stratejik kullanım ve fiyat etkileri ayrı tasarlanır. **\[AÇIK\]** Ürün
listesi, fiyat mekanizması, stok yönetimi ve piyasa ayrıntısı.

## 11.4 Ticaret

\[KARAR\] Temel ticaret akışları otomatik gerçekleşir. Oyuncu ticaret
anlaşmaları, gümrük, ambargo ve ticaret yolları/boğazlar üzerinde
stratejik kararlar verir. Deniz ve kara güzergâhları, savaşlar ve
ablukalar ekonomiyi etkiler.

## 11.5 Otomasyon sınırları

\[TASLAK\] Otomatik yöneticiler oyuncunun belirlediği bütçe tavanını
aşamaz. Harcama yapan her otomatik işlem günlükte görünür. Oyuncu
otomasyonu durdurabilir ve öncelikleri değiştirebilir. Bu davranışların
ayrıntıları onaylanmalıdır.

------------------------------------------------------------------------

# 12. TEKNOLOJİ VE ÇAĞLAR

\[KARAR\] Bütün devletler ortak bir teknoloji ağacına erişebilir.
Araştırma önceliğini oyuncu seçer. Araştırma süresi, eğitim/bilim
kapasitesi, yatırım, kaynak ve mevcut gelişmişliğe bağlı olabilir.
Farklı alanlarda eş zamanlı araştırma mümkündür.

\[KARAR\] Teknolojiler yalnızca sayısal bonus vermez; yeni birlikler,
gemiler, binalar, ekonomik faaliyetler ve stratejik seçenekler açar.
Görseller tarihî çağlara göre değişebilir.

\[TASLAK\] Her teknoloji: kimlik, ad, çağ, alan, ön koşullar, araştırma
maliyeti, zaman/puan, etkiler, açtığı içerikler, tarihî açıklama ve
kaynak. Teknoloji ağacı döngüsüz olmalı; kayıt/yükleme ve AI
seçimleriyle uyumlu çalışmalıdır.

\[AÇIK\] Araştırma yuvası sayısı, teknoloji maliyet formülleri,
teknolojik yayılma ve teknoloji ağacının ilk kapsamı.

------------------------------------------------------------------------

# 13. ŞEHİRLER, İDARİ BÖLGELER VE YAPILAŞMA

\[KARAR\] Şehirler nüfus, ekonomi, altyapı ve görsel gelişim gösterir.
Önemli şehirleri oyuncu yönetebilir; diğerlerini yerel yöneticilere
bırakabilir. Devletlere özgü idari hiyerarşi korunur.

\[TASLAK\] Şehir alanları: konum, bağlı bölge, nüfus, din/kültür
dağılımı, üretim, altyapı, yapılar, garnizon, savunma, ticaret
bağlantısı, yerel yönetici, isyan riski, işgal durumu, mimari çağ.

\[TASLAK\] Yapı kategorileri: ekonomik, tarımsal, askerî, eğitim, idari,
liman/tersane, savunma. **\[AÇIK\]** Kesin bina listesi, seviyeler,
maliyetler, slot sistemi ve şehir planlaması kapsamı.

------------------------------------------------------------------------

# 14. NÜFUS, DİN, KÜLTÜR, GÖÇ VE TOPLUM

\[KARAR\] Nüfus din, kültür ve meslek dağılımlarıyla modellenebilir.
Doğum, ölüm, savaş, salgın, kıtlık, göç ve devlet politikaları
demografiyi etkiler. Göç yerel ve uluslararası olabilir; oyuncu iskân
politikalarıyla yönlendirebilir.

\[KARAR\] Dinî ve kültürel ilişkiler iç yönetimi ve diplomasiyi etkiler;
farklılık otomatik isyan sebebi olarak sabitlenmez. Politikalar,
koşullar ve tarihî bağlam önemlidir.

\[TASLAK\] Nüfus simülasyonu toplulaştırılmış gruplar üzerinde çalışır;
tek tek birey simülasyonu zorunlu değildir. Büyük tur atlamalarında
nüfus değişimi fiziksel/istatistiksel sınırlar içinde tutulur. Nüfus
eksiye düşemez, grupların toplamı şehir nüfusuyla tutarlı olmalıdır.

\[AÇIK\] Demografik ayrıntı düzeyi, kültürel dönüşüm hızı, salgın
modeli, göç çekim faktörleri, etik ve tarihî temsil ilkeleri.

------------------------------------------------------------------------

# 15. İSYAN, İSTİKRAR VE DEVLETİN PARÇALANMASI

\[KARAR\] İsyan riski önceden görülebilir. Oyuncu risk haritası, harita
uyarıları ve bölge paneli üzerinden sebepleri takip edebilir. Devletler
iç karışıklık, hanedan, kültür/din, dış müdahale, ekonomik çöküş veya
bağımsızlık süreçleriyle parçalanabilir.

\[TASLAK\] İsyan riskinin açıklanabilir bileşenleri: vergi baskısı,
savaş yorgunluğu, işgal, yerel yönetim kalitesi, meşruiyet, ekonomik
koşullar ve dış destek. UI, risk değişimini 'neden arttı/azaldı'
biçiminde göstermelidir.

\[AÇIK\] İsyan aşamaları, diplomatik çözüm seçenekleri, silahlı isyan
birimlerinin üretimi ve devletleşme koşulları. Kullanıcı 93. soruda
özellikle **önceden öngörülebilirliği** (A) seçti; diğer seçenekler
(B--E) otomatik onaylanmış sayılmaz. Sorunun tam metni:
`docs/gdd/kesif-sorulari.md`.

------------------------------------------------------------------------

# 16. YAPAY ZEKÂ DEVLETLERİ

## 16.1 Beklenen davranış

\[KARAR\] AI devletleri oyuncudan bağımsız hareket eder; ittifak kurar,
savaş açar, teknoloji geliştirir, ekonomisini yönetir ve alternatif
tarih üretir. Güç dengesi ve tarihî ilişkiler kararlarını etkiler.

\[TASLAK\] AI karar alanları: tehdit değerlendirmesi, diplomasi,
ekonomi, teknoloji, asker toplama, hareket, kuşatma, barış ve iç
istikrar. AI aynı temel oyun kurallarına tabi olmalıdır; özel avantajlar
yalnızca açıkça tanımlanmış zorluk ayarlarıyla verilir.

## 16.2 Açıklanabilirlik

-   AI savaş/ittifak kararı temel nedenlerle loglanır.
-   Gizli istihbarat bilgileri oyuncuya doğrudan sızdırılmaz.
-   Oyuncunun gördüğü diplomatik tepkiler anlaşılır ve tutarlı olur.
-   AI durumu kayıt/yükleme sonrasında bozulmaz.

## 16.3 Performans \[TASLAK\]

Dünya ölçeğinde çok sayıda devlet ve şehir bulunduğunda her AI'nin her
turda pahalı tam optimizasyon yapması zorunlu değildir. Karar sıklığı,
önceliklendirme ve olay temelli güncellemeler performans bütçesine göre
tasarlanır. Kesin algoritma ve eşikler onaylanmalıdır.

------------------------------------------------------------------------

# 17. ARAYÜZ, ERİŞİLEBİLİRLİK VE PLATFORM DENEYİMİ

## 17.1 Temel ekranlar \[TASLAK\]

1.  Ana menü / yeni oyun / kayıt yükleme.
2.  Senaryo ve devlet seçimi.
3.  Ana dünya haritası ve üst durum çubuğu.
4.  Devlet yönetimi özeti.
5.  Şehir/bölge bilgi ve yönetim paneli.
6.  Ordu/donanma paneli, hareket hedefi ve tahmini varış.
7.  Diplomasi ve casusluk ekranları.
8.  Ekonomi/ticaret ve hazine.
9.  Teknoloji ağacı ve araştırma kuyruğu.
10. Hükümdar/hanedan/komutan ekranı.
11. Savaş, kuşatma ve barış antlaşması arayüzü.
12. Olay bildirimleri, tarih çizelgesi ve geçmiş sınır görünümü.
13. Ayarlar, erişilebilirlik, grafik ve kayıt seçenekleri.

## 17.2 Web ve mobil

\[KARAR\] Web ve mobil hedeflenir. \[TASLAK\] Aynı oyun kuralları ve
kayıt biçimi iki platformda da korunmalı; arayüzler ekran boyutuna göre
uyarlanmalıdır. Mobilde büyük dokunma alanları, sade paneller ve hızlı
tur akışı; masaüstünde geniş bilgi alanı ve klavye/fare kullanımı
önemlidir.

\[KARAR\] İlk geliştirme ve yayın hedefi web'dir; mobil sonraki aşamaya
bırakıldı (DEC-0013). Mobil hedef iptal edilmedi; web mimarisi mobile
geçişi engellememelidir.

\[AÇIK\] Çevrimdışı oynanabilirlik, bulut kayıt, cihazlar arası eşitleme
ve minimum cihaz gereksinimleri.

## 17.3 Bilgi tasarımı

Her önemli değer için mümkünse 'ne, neden, nasıl değişti' açıklaması
bulunur. Risk, araştırma süresi, varış tarihi, maliyet ve savaş
sonuçları görünür olmalıdır. Gizli düşman verileri bu ilkeye istisnadır:
UI gizli bilgiyi açıkça 'bilinmiyor' veya 'tahmin' olarak etiketler.

------------------------------------------------------------------------

# 18. KAYIT, TEKRAR OYNANABİLİRLİK VE TARİH ÇİZELGESİ

\[KARAR\] Oyun kapalıyken dünya ilerlemez. Oyuncu farklı kayıt
modlarıyla oynayabilir; tarihî sınır değişimlerini ve olayları geriye
dönük inceleyebilir.

\[TASLAK\] Kayıt paketi: şema sürümü, senaryo sürümü, dünya durumu, tüm
devletler, harita kontrolü, karakterler, ordular, diplomasi, teknoloji,
ekonomi, nüfus, tur zamanı, rastgelelik tohumu ve olay günlüğü. Kaydetme
işlemi atomik olmalı; bozuk kayıt güvenli hata vermeli.

\[AÇIK\] Ironman, manuel kayıt, otomatik kayıt, geri sarma ve tarih
çizelgesi saklama maliyetleri. Geri sarma modu varsa başarı/çok oyunculu
kuralları ayrıca ele alınır.

------------------------------------------------------------------------

# 19. ÖNERİLEN VERİ ALANLARI VE İLİŞKİLER \[TASLAK\]

Bu bölüm **veritabanı şeması değildir**; sistemlerin birbirine nasıl
bağlanacağını anlatan kavramsal modeldir.

  -----------------------------------------------------------------------
  Varlık                  Örnek alanlar           İlişkiler
  ----------------------- ----------------------- -----------------------
  Scenario                id, tarih, veri sürümü, WorldState başlangıcı
                          kaynaklar               

  State                   id, ad, bayrak, hazine, bölgeler, ordular,
                          başkent, kurumlar       diplomasi

  AdministrativeUnit      id, tür, üst birim,     devlet, alt birimler
                          dönem                   

  Territory               id, geometri, sahip,    yerleşimler, kaynaklar
                          işgalci                 

  Settlement              id, konum, nüfus,       bölge, yönetici
                          yapılar, ekonomi        

  PopulationGroup         kültür, din, meslek,    yerleşim
                          sayı                    

  Character               id, isim, doğum/ölüm,   devlet, ordu, soy
                          hanedan, görev          

  Dynasty                 id, ad, soy ilişkileri, hükümdarlar
                          gelenek                 

  Army                    id, konum, hedef,       birlikler, komutan
                          moral, ikmal            

  UnitGroup               tür, sayı, deneyim,     ordu
                          teknoloji               

  Navy                    konum, gemiler, amiral, devlet, liman
                          görev                   

  Technology              id, ön koşullar,        araştırma durumu
                          etkiler                 

  DiplomaticRelation      taraflar, anlaşmalar,   devletler
                          güven, tehdit           

  War                     taraflar, hedefler,     ordular, barış
                          işgal, savaş durumu     

  PeaceTreaty             koşullar, bölge         savaş
                          talepleri, taraflar     

  SpyOperation            hedef, tür, ilerleme,   devletler
                          sonuç                   

  TradeRoute              uç noktalar, kapasite,  şehirler, devletler
                          risk                    

  EventLog                tur, tür, aktör,        dünya geçmişi
                          değişiklik              

  SaveGame                sürüm, durum, tohum,    tüm dünya
                          kayıt zamanı            
  -----------------------------------------------------------------------

**Kimlik kuralı:** Görünen adlar benzersiz kimlik yerine kullanılmaz;
hanedan ve devlet isimleri değişebilir. **Zaman kuralı:** Tarihî tarih
formatı, MÖ dönemler ve takvim sistemi seçimi \[AÇIK\]. **Coğrafya
kuralı:** Geometri ve topoloji sürümlenir; sınır değişiklikleri kimlik
ilişkilerini bozmamalıdır.

------------------------------------------------------------------------

# 20. TEKNİK MİMARİ KARAR ÇERÇEVESİ --- KISMEN SEÇİLDİ

**Önemli:** Bu bölümde teknoloji seçimi yapılmamıştır. AI agent,
kullanıcının onayı olmadan 'React + X', 'Unity', 'Godot', 'PostgreSQL'
vb. kesin karar ilan edemez.

**v1.3:** \[KARAR\] Dil ve render: **TypeScript + three.js**. Unity,
Godot vb. hazır oyun motoru kullanılmaz (DEC-0012). Aşağıdaki diğer
başlıklar (simülasyon çalışma yeri, kayıt, veri formatı vb.) hâlâ
\[AÇIK\]'tır ve kullanıcı onayı olmadan karara bağlanamaz.

## 20.1 Mimari hedefler

-   Tek ve test edilebilir oyun kuralı kaynağı.
-   Web/mobil istemcilerin aynı simülasyon kurallarını kullanması.
-   Tur bazlı, durdurulabilir, deterministik veya yeniden üretilebilir
    simülasyon.
-   Dünya ölçeğinde harita ve çok sayıda aktör için performans.
-   Kayıt sürümleme ve veri migrasyonu.
-   Modüler sistemler: harita, diplomasi, savaş, ekonomi, nüfus, AI, UI.
-   Tarihî veri ile canlı oyun durumunun ayrılması.
-   İçerik üretim hattı ve lisans takibi.

## 20.2 Karar verilmesi gereken teknoloji başlıkları \[AÇIK\]

1.  Oyun motoru / render yaklaşımı: özel web motoru, çapraz platform
    motoru veya hibrit.
2.  Harita geometrisi ve çizim yöntemi: vektör, raster, hibrit,
    tile/LOD.
3.  Simülasyon dili ve çalışma yeri: istemci, yerel motor, sunucu veya
    hibrit.
4.  Web/mobil paketleme ve ortak kod paylaşımı.
5.  Yerel kayıt, bulut kayıt ve kimlik doğrulama gerekliliği.
6.  Veri tabanı, coğrafi veri formatı, içerik yönetimi.
7.  Modül iletişimi, olay sistemi, test çerçevesi ve telemetri.
8.  Çok oyunculuya ileride geçişin mimariye etkisi.

## 20.3 Karar değerlendirme şablonu

Her teknoloji seçeneği için şu tablo doldurulur: **seçenek**, **web
desteği**, **mobil desteği**, **harita performansı**, **offline/kayıt**,
**geliştirme karmaşıklığı**, **lisans/maliyet**, **AI agent ile
sürdürülebilirlik**, **risk**, **örnek prototip sonucu**, **öneri**,
**kullanıcı kararı**.

## 20.4 Performans ve ölçek \[AÇIK\]

Hedef cihazlar, haritadaki en küçük alan sayısı, aktif devlet/ordu
sayısı, tur işleme süresi, bellek, paket boyutu ve pil tüketimi eşikleri
gerçek prototip ölçümlerinden sonra kullanıcı tarafından onaylanmalıdır.
Ölçüm yapılmadan '60 FPS garanti' gibi vaatlerde bulunulmaz.

------------------------------------------------------------------------

# 21. AI AGENT YÖNETİM PROTOKOLÜ

## 21.1 Yetki modeli

**Kullanıcı = ürün sahibi, oyun tasarımının son karar mercii, mimari
onaylayıcı ve kabul testçisi.**\
**AI agent = araştırmacı, tasarımcı, uygulayıcı, testçi veya gözden
geçirici; bağımsız ürün sahibi değil.**

Agent'lar kullanıcı onayı olmadan:

-   Yeni temel mekanik ekleyemez veya onaylı mekaniği silemez.
-   Tur bazlı sistemi gerçek zamanlıya çeviremez.
-   Serbest ordu hareketini bölgeden bölgeye sisteme çeviremez.
-   Devlet borçlanması ekleyemez.
-   Harita görsel kimliğini ve temel UI yönünü değiştiremez.
-   Ücretli servis, dış API, veri seti veya lisanslı varlık satın
    alamaz/bağlayamaz.
-   Veritabanı şemasında geri döndürülemez değişiklik yapamaz.
-   Ana dalı korumasız biçimde değiştiremez; üretime dağıtım yapamaz.
-   Kapsam dışı modül geliştiremez veya sonraki aşamaya kendiliğinden
    geçemez.

## 21.2 Her görev öncesi zorunlu görev kartı

``` md
# TASK-XXXX — Görev adı
- Aşama:
- İlgili gereksinim / karar ID:
- Amaç:
- Kapsam dahilinde:
- Kapsam dışında:
- Beklenen dosyalar / modüller:
- Girdiler / bağımlılıklar:
- Açık sorular:
- Önerilen yaklaşım:
- Riskler / geri dönüş planı:
- Testler:
- Kabul kriterleri:
- Kullanıcı onayı: BEKLENİYOR / ONAYLANDI / REDDEDİLDİ
```

**Kural:** Onay bekleyen görev kartında üretim kodu yazılmaz; yalnızca
kullanıcı açıkça 'ön çalışma/prototip yap' dediyse sınırlı deney
yapılabilir.

## 21.3 Aşama kapıları (approval gates)

Her aşamada agent şunları sunar:

1.  Tamamlanan işler ve ilgili dosyalar.
2.  Ekran görüntüsü/video veya çalıştırılabilir demo (uygunsa).
3.  Test çıktıları ve performans ölçümleri.
4.  Açık hatalar, riskler ve teknik borç.
5.  Başlangıç gereksinimlerine karşı kabul matrisi.
6.  Sonraki aşama için alternatifler ve tavsiye.
7.  **Açık kullanıcı onayı isteği.**

Kullanıcı 'onaylıyorum' veya eşdeğer açık onay vermedikçe kapı geçilmez.
Sessizlik onay sayılmaz.

## 21.4 Agent rollerinin ayrılması \[TASLAK\]

-   **Product/GDD Agent:** Gereksinim, karar kaydı, kapsam, oyun
    döngüsü.
-   **Historical Research Agent:** Tarihî senaryo kaynakları,
    belirsizlikler, veri lisansı.
-   **Game Systems Agent:** Savaş, ekonomi, nüfus, diplomasi, teknoloji
    kuralları.
-   **Map/Geodata Agent:** Coğrafya, tarihî sınırlar, veri topolojisi ve
    LOD.
-   **UX/UI Agent:** Harita etkileşimi, paneller, mobil
    kullanılabilirlik.
-   **Architecture Agent:** Teknoloji seçenekleri, prototip ve
    performans kararları.
-   **Implementation Agent:** Yalnızca onaylı görev kartını kodlar.
-   **QA Agent:** Birim/entegrasyon/simülasyon/kabul testleri ve
    regresyon.
-   **Security/License Agent:** Bağımlılık, veri lisansı, gizli bilgi ve
    güvenlik incelemesi.

Bir agent kendi işini tek başına kabul edilmiş sayamaz. Kritik
değişiklikler ikinci bir gözden geçirme ve kullanıcı onayı ister.

## 21.5 Agent iletişim standardı

Her rapor: **Ne yaptım? Neden? Hangi gereksinime dayanıyor? Hangi
dosyaları değiştirdim? Nasıl test ettim? Neler belirsiz? Senden hangi
kararı istiyorum?** sorularını cevaplamalıdır.

## 21.6 Agent'ın durması gereken durumlar

-   İki gereksinim çelişiyorsa.
-   Tarihî veri kaynağı belirsiz veya lisansı uygun değilse.
-   Teknik seçim kullanıcı tarafından yapılmamışsa.
-   İşlem maliyetli, geri döndürülemez veya üretimi etkiliyorsa.
-   Yeni mekanik önerisi onaylı kapsamın dışındaysa.
-   Test başarısızsa ve neden bilinmiyorsa.
-   Kabul kriteri ölçülemiyorsa.

------------------------------------------------------------------------

# 22. GELİŞTİRME AŞAMALARI --- ÖNERİLEN İŞ AKIŞI, TAKVİM DEĞİL

> Bu sıra bir **\[TASLAK\]** iş akışıdır. Kullanıcı aşamaları, kapsamı
> ve öncelikleri ayrıca onaylayacaktır. Her aşama sonunda durulup
> değerlendirme yapılır.

## Aşama 0 --- Gereksinim dondurma ve karar envanteri

**Çıktılar:** Onaylı GDD v1, karar kayıtları, belirsizlik listesi,
terimler sözlüğü, ilk senaryo kapsamı.\
**Kabul:** Tüm \[KARAR\] maddeleri izlenebilir; çelişkiler çözülmüş;
açık konular etiketli.\
**Kapı:** Kullanıcı 'tasarım tabanı onaylandı' der.

## Aşama 1 --- Harita deneyimi prototipi

**Çıktılar:** Test verisiyle siyasi harita, net sınırlar, yakınlaştırma,
devlet/bölge/şehir seçimi, basit mobil etkileşim.\
**Kabul:** Harita okunabilir; sınır/topoloji tutarlı; seçim ve
yakınlaştırma testleri başarılı; cihaz ölçümleri raporlu.\
**Kapı:** Kullanıcı görsel yönü ve etkileşimi onaylar.\
**v1.3 notu:** Mobil etkileşim DEC-0013 gereği ertelendi; Aşama 1
masaüstü web tarayıcısında yürütülür.

## Aşama 2 --- Tur ve dünya durumu çekirdeği

**Çıktılar:** Dünya durumu, tarih/tur kontrolü, seçilebilir tur süresi
için ilk tasarım, emir kuyruğu, deterministik güncelleme, kayıt/yükleme
iskeleti.\
**Kabul:** Aynı başlangıç ve aynı emirler aynı sonucu üretir; tur dışı
ilerleme yoktur; kayıt sonrası durum korunur.\
**Kapı:** Kullanıcı tur deneyimini onaylar.

## Aşama 3 --- Siyasi kontrol ve hareket

**Çıktılar:** Seçilebilir arazi kontrolü, şehir ve çevre ayrımı, serbest
hedefli ordu hareketi, varış süresi, geçiş/erişim kuralları.\
**Kabul:** Mesafe ve koşullar süreyi değiştirir; ordu hedefe mantıklı
rota izler; toprak kontrolü hatasızdır.\
**Kapı:** Kullanıcı harita-hareket deneyimini onaylar.

## Aşama 4 --- Savaş, kuşatma ve barış

**Çıktılar:** Ordu oluşturma, otomatik muharebe, moral, ikmalin ilk
sürümü, kuşatma, işgal ve barış anlaşması.\
**Kabul:** Savaş nedenleri raporlanır; yenilgi/geri çekilme işler;
kuşatma anlık sonuçlanmaz; barış sonrası mülkiyet tutarlıdır.\
**Kapı:** Kullanıcı savaş döngüsünü onaylar.

## Aşama 5 --- Ekonomi, şehirler ve teknoloji

**Çıktılar:** Hazine, gelir-gider, borçsuz harcama kontrolü, şehir
gelişimi, araştırma seçimi, paralel araştırma.\
**Kabul:** İsteğe bağlı harcama hazineyi aşamaz; eksi bakiye yalnızca
zorunlu giderlerden doğar; borç/faiz yok; teknoloji etkileri izlenebilir;
şehir yönetimi otomasyona devredilebilir.\
**Kapı:** Kullanıcı ekonomik ve araştırma döngüsünü onaylar.

## Aşama 6 --- Diplomasi ve AI devletleri

**Çıktılar:** İlişkiler, savaş ilanı, ittifaklar, diplomasi haritası,
AI'nin temel devlet yönetimi ve savaş/barış kararları.\
**Kabul:** AI bağımsız ve tutarlı davranır; diplomatik sonuçlar
açıklanır; gizli bilgi sızmaz.\
**Kapı:** Kullanıcı dünya davranışını onaylar.

## Aşama 7 --- Hanedan, karakter, nüfus, kültür ve iç siyaset

**Çıktılar:** Tarihî karakterler, veraset, alternatif soy, nüfus
grupları, göç, isyan riski ve yerel yönetim.\
**Kabul:** Tarihî halef seçimi ve alternatif soy testleri geçer; nüfus
tutarlı; isyan riski önceden görünür.\
**Kapı:** Kullanıcı tarihî ve toplumsal derinliği onaylar.

## Aşama 8 --- Denizcilik, casusluk ve ileri sistemler

**Çıktılar:** Donanmalar, deniz kontrolü, abluka/çıkarma, ticaret
yolları, casusluk görevleri, gelişmiş istihbarat.\
**Kabul:** Kara/deniz sistemleri entegre; casusluk bilgi asimetrisini
bozmadan çalışır.\
**Kapı:** Kullanıcı kapsamı ve dengeyi onaylar.

## Aşama 9 --- Tarihî içerik, UX ve optimizasyon

**Çıktılar:** Onaylı tarihî senaryolar, kaynaklandırma, mobil UI,
erişilebilirlik, performans, denge ve oyun içi açıklamalar.\
**Kabul:** Senaryo doğruluğu ve lisans kontrolleri tamam; hedef cihaz
performansı ölçülmüş; kritik akışlar kullanılabilir.\
**Kapı:** Kullanıcı oynanabilir sürümü kabul eder.

## Aşama 10 --- Yayın hazırlığı ve sonraki yol haritası

**Çıktılar:** Paketleme, test dağıtımı, çökme raporları, veri gizliliği,
mağaza gereksinimleri, sürüm notları, geri bildirim döngüsü.\
**Kabul:** Kritik hata yok, kayıt güvenilir, yayın kontrol listesi
onaylı.\
**Kapı:** Üretime çıkış için ayrı açık kullanıcı onayı.

**Not:** Çok oyunculu özellikler ilk tek oyunculu sürümün parçası
değildir; ayrı mimari ve ürün kararı gerektirir.

------------------------------------------------------------------------

# 23. TEST STRATEJİSİ VE KABUL SENARYOLARI

## 23.1 Genel test katmanları

-   **Birim testleri:** Ekonomi hesapları, tarih/tur dönüşümleri, ordu
    hareketi, veraset, araştırma.
-   **Entegrasyon testleri:** Harita--ordu--savaş--barış,
    ekonomi--nüfus--göç, teknoloji--birlikler, diplomasi--AI.
-   **Özellik/invariant testleri:** Nüfus negatif değil; ordu sayısı
    tutarlı; tek bölgenin aynı anda tek yasal sahibi var; hazine kuralı
    ihlal edilmez.
-   **Simülasyon testleri:** Yüzlerce turda tutarlılık, AI kilitlenmesi,
    ekonomik patlama, anormal devlet çöküşleri.
-   **Kayıt testleri:** Kaydet/yükle, sürüm migrasyonu, kısmi bozuk
    kayıt, deterministik tekrar.
-   **Performans testleri:** Dünya yükleme, harita etkileşimi, tur
    çözümleme, bellek, mobil pil/ısı.
-   **Görsel/UX testleri:** Siyasi sınır okunabilirliği, mobil dokunma,
    renk körlüğü, panel çakışmaları.
-   **Tarihî veri testleri:** Tarih, devlet, başkent, karakter ve kaynak
    eşlemesi.

## 23.2 Kabul senaryoları

**AT-001 --- Tarihî başlangıç:** 1453 örnek senaryosu açıldığında onaylı
başlangıç veri paketindeki devletler, sınırlar ve hükümdarlar doğru
yüklenir.

**AT-002 --- Alternatif tarih:** Oyuncu İstanbul'u fethetmezse sistem
1453 tarihine geldi diye fethi zorla gerçekleştirmez.

**AT-003 --- Halef:** II. Mehmed'in ölümünde oyuncu, veraset kuralları
izin verdiğinde tarihî halef II. Bayezid yerine başka bir şehzadeyi
seçer; alternatif soy çizgisi başlar ve sonraki nesiller tarihî soya
otomatik dönmez (DEC-0010).

**AT-004 --- Tur kontrolü:** Kullanıcı turu ilerletmediğinde dünya
durumu değişmez; uygulama kapalıyken ilerleme olmaz.

**AT-005 --- Tur süresi:** Farklı seçilmiş sürelerde ordu varış süresi
ve üretim artışı takvim zamanıyla tutarlı kalır.

**AT-006 --- Ordu hareketi:** Bursa--İznik ve Bursa--Viyana hareketleri
eşit tur sayısında tamamlanmaz; yol ve koşullar hesaba katılır.

**AT-007 --- Ayrı fetih:** Bursa şehri işgal edildiğinde çevredeki bütün
seçilebilir araziler otomatik olarak işgal edilmez.

**AT-008 --- Muharebe:** İki düşman ordu karşılaşır; savaş otomatik
çözülür; kayıp, moral ve geri çekilme raporu üretilir.

**AT-009 --- Kuşatma:** Güçlü surlu şehir, yeterli kuşatma koşulları
oluşmadan sıradan hareket eylemiyle anında düşmez.

**AT-010 --- Borç yasağı:** Hazine 100 birimken 120 birimlik harcama
borç yaratmadan reddedilir.

**AT-011 --- Teknoloji:** Oyuncu araştırma seçer; uygun maliyet ve
süreyle ilerler; teknoloji yeni içerik veya etki açar.

**AT-012 --- Diplomatik sonuç:** Serbest savaş ilanı mümkündür;
saldırganlığın ilişkiler üzerindeki etkisi izlenebilir.

**AT-013 --- Gizli bilgi:** Casusluk olmadan rakip ordunun kesin gücü
otomatik açık edilmez.

**AT-014 --- İsyan riski:** Yüksek riskli bölge haritada, uyarıda ve
panelde tutarlı biçimde görünür; nedenleri listelenir.

**AT-015 --- Yerel yönetim:** Otomatik yönetim açıkken şehir rutin
işleri yürütür; oyuncu müdahalesi öncelikli kalır.

**AT-016 --- Kayıt:** Dünya durumu kaydedilip yüklendiğinde siyasi
sınırlar, ordular, hanedanlar, ekonomi ve araştırmalar korunur.

**AT-017 --- Deniz:** Donanma liman ablukası uygular; ticaret/ikmal
etkisi doğru hesaplanır.

**AT-018 --- Harita:** Siyasi sınırlar farklı yakınlaştırma
seviyelerinde açık seçilir; diplomasi ve isyan haritaları doğru veri
gösterir.

------------------------------------------------------------------------

# 24. RİSKLER, BAĞIMLILIKLAR VE KAPSAM KONTROLÜ

  -------------------------------------------------------------------------------
  Risk                    Etki                    Kontrol yöntemi
  ----------------------- ----------------------- -------------------------------
  Dünya ölçeğinde çok     Performans, veri        Önce ölçümlü harita prototipi,
  fazla küçük bölge       üretimi                 ölçek kararı

  Tarihî sınır/veri       Yanlış başlangıçlar     Kaynaklandırma, belirsizlik
  eksikliği                                       etiketleri

  Tüm sistemlerin aynı    Kapsam taşması          Aşama kapıları, küçük kabul
  anda geliştirilmesi                             senaryoları

  AI agent'ın varsayım    Ürün yönünün bozulması  \[KARAR\]/\[TASLAK\]/\[AÇIK\]
  üretmesi                                        ayrımı

  Tur süresinin değişken  Simülasyon tutarsızlığı Zaman temelli hesaplama ve
  olması                                          invariant testleri

  Serbest hareket +       Karmaşık rota/çarpışma  Erken hareket prototipi
  ayrıntılı harita                                

  Ekonomi/nüfus/AI        Denge sorunları         Simülasyon testleri, log ve
  etkileşimi                                      açıklanabilirlik

  Web ve mobil performans Kötü mobil deneyim      Erken hedef cihaz testleri
  farkı                                           

  Tarihî eser/harita      Hukukî risk             Kaynak ve lisans denetimi
  lisansları                                      

  Uzun kayıt dosyaları    Kayıt bozulması ve      Sürümleme, atomik kayıt,
                          yükleme süresi          sıkıştırma ölçümü

  Gerçek tarih ile        Mantık hataları         Başlangıç veri--simülasyon
  alternatif tarih                                ayrımı
  çatışması                                       

  Çok oyunculuya erken    Gereksiz mimari         İlk sürüm tek oyunculu sınırı
  odaklanma               karmaşıklık             
  -------------------------------------------------------------------------------

------------------------------------------------------------------------

# 25. AÇIK KARARLAR LİSTESİ

Bu maddeler kesinleştirilmeden agent ilgili alanda kalıcı uygulama
yapmamalıdır.

  -----------------------------------------------------------------------
  ID                      Karar                   Neden gerekli?
  ----------------------- ----------------------- -----------------------
  OPEN-001                İlk oynanabilir senaryo Tarihî veri ve harita
                          ve tarih                kapsamını belirler

  OPEN-002                En küçük fethedilebilir Harita/topoloji ve
                          arazi ölçeği            savaş sistemi

  OPEN-003                Tur süresi seçenekleri  Simülasyon doğruluğu
                          ve ara olay işleme      

  OPEN-004                İlk sürümde kaç         Performans ve içerik
                          devlet/şehir/ordu       bütçesi

  OPEN-005                Harita render/motor     Web ve mobil mimarisi
                          teknolojisi             

  OPEN-006                Simülasyon dili/çalışma Kod paylaşımı, kayıt,
                          ortamı                  performans

  OPEN-007                Kayıt modları ve geri   Oyun kuralları ve
                          sarma kuralları         depolama

  OPEN-008                Savaş ve kuşatma        Denge ve
                          formülleri              açıklanabilirlik

  OPEN-009                Barış antlaşması        Fetih ve diplomasi
                          puan/değer kuralları    

  OPEN-010                Ekonomik ürünler ve     Ekonomi karmaşıklığı
                          fiyat sistemi           

  OPEN-011                Teknoloji ağacı ilk     Oynanış ve veri üretimi
                          içerik listesi          

  OPEN-012                Veraset ve taht         Hanedan simülasyonu
                          mücadelelerinin         
                          sınırları               

  OPEN-013                İsyanların aşamaları ve İç siyaset
                          çözüm yolları           

  OPEN-014                Casuslukta yanlış bilgi Bilgi asimetrisi
                          ve karşı istihbarat     

  OPEN-015                İlk sürümde             İş yükü
                          deniz/sömürge kapsamı   

  OPEN-016                Yerel yöneticinin       Oyuncu kontrolü
                          otomatik harcama        
                          yetkisi                 

  OPEN-017                Çok dillilik ve tarihî  Veri ve UI
                          isimlerin yazımı        

  OPEN-018                Tarihî veri             Hukukî ve bilimsel
                          kaynakları/lisansları   doğruluk

  OPEN-019                İlk hedef cihazlar ve   Teknik seçim
                          performans eşikleri     

  OPEN-020                Çevrimdışı kayıt, bulut Ürün altyapısı
                          kayıt, hesap sistemi    

  OPEN-021                Oyun adı, görsel marka  Ürün kimliği
                          ve sanat yönü           

  OPEN-022                Gelir modeli ve yayın   Ürün stratejisi
                          platformu sırası        
  -----------------------------------------------------------------------

**v1.1 durumu:**

-   **OPEN-001** kapandı → DEC-0004 (tek senaryo: 1453).
-   **OPEN-002** kısmen kapandı → DEC-0007 (poligon arazi birimi); toplam
    birim sayısı ve veri biçimi açık.
-   **OPEN-003** kısmen kapandı → DEC-0005, DEC-0006; iç adım boyları ve
    kesinti tetikleyici listesi \[TASLAK\].
-   **OPEN-006** kapandı → DEC-0023 (tarayıcıda TypeScript, Web Worker; `packages/sim`).
-   **Zaman kuralı (§19)** → DEC-0023: Jülyen takvimi; içeride Jülyen gün numarası.
-   **OPEN-005** kapandı → DEC-0012 (TypeScript + three.js; oyun motoru
    yok).
-   **OPEN-019** kısmen → ilk hedef masaüstü web tarayıcısı (DEC-0013);
    eşikler ölçümden sonra.
-   **OPEN-022** kısmen → platform sırası: önce web (DEC-0013); gelir
    modeli açık.
-   **OPEN-023 (yeni)** Eksi bakiyenin sonuçları, alt sınırı ve UI
    gösterimi.
-   **OPEN-024 (yeni)** Devlet yıkıldığında toparlanma / başka devlete
    geçme kuralları.

------------------------------------------------------------------------

# 26. ÖNERİLEN REPO DOKÜMAN YAPISI \[TASLAK\]

``` text
/
├── README.md
├── MASTER_SPEC.md              # Bu belgenin proje içindeki kopyası
├── DECISIONS.md                # Onaylı karar kayıtları
├── CHANGELOG.md
├── AGENTS.md                   # Agent davranış ve onay kuralları
├── docs/
│   ├── gdd/                    # Ayrıntılı mekanik belgeleri
│   ├── architecture/           # Onaylı mimari ve ADR'ler
│   ├── historical-sources/     # Senaryo kaynakları ve lisanslar
│   ├── ui-ux/                  # Akışlar, wireframe, görsel yön
│   ├── data-schemas/           # Veri sözleşmeleri
│   ├── qa/                     # Test planları ve kabul raporları
│   └── milestones/             # Aşama kabul tutanakları
├── tasks/                      # Onay bekleyen / onaylı görev kartları
├── prototypes/                 # Ayrı prototipler (onayla)
└── src/                        # Teknoloji seçimi sonrası oluşturulur
```

------------------------------------------------------------------------

# 27. YENİ BİR AI AGENT'A VERİLECEK BAŞLANGIÇ TALİMATI

Aşağıdaki metin proje başlatılırken agent'a doğrudan verilebilir:

``` text
Bu proje tarihî, tur bazlı, harita merkezli bir büyük strateji oyunudur.
Önce MASTER_SPEC.md dosyasını tamamen oku. [KARAR], [TASLAK] ve
[AÇIK] işaretlerini birbirine karıştırma. Kullanıcı ürünün nihai karar
merciidir ve her aşamada sürece bizzat katılacaktır.

Görevin:
1. Önce mevcut aşamayı ve onaylı kararları belirle.
2. Gereksinimlerle çelişen noktaları raporla.
3. Çalışacağın işi TASK-XXXX görev kartıyla sınırla.
4. Açık kararlar için seçenekler, artılar/eksiler ve öneri sun.
5. Kullanıcının açık onayını bekle.
6. Onaylı kapsamda küçük, test edilebilir değişiklikler yap.
7. Test sonuçlarını, değişen dosyaları ve riskleri raporla.
8. Aşama sonunda kabul için kullanıcıya sun ve bekle.

Özellikle koru:
- Oyun tur bazlıdır; tur süresini oyuncu belirler.
- Oyuncu devleti yönetir, hükümdarın ömrüyle sınırlı değildir.
- Tarihî olaylar başlangıçtan sonra zorunlu olarak yaşanmaz.
- Siyasi sınırlar nettir; harita ana arayüzdür.
- Ordular serbest hedefli hareket eder; varış süreleri değişkendir.
- Muharebeler otomatik çözülür; stratejik emirler önemlidir.
- Şehir ve çevre araziler ayrı fethedilebilir.
- Ekonomi derin ama mikro yönetim zorunlu değildir.
- Devlet borçlanması yoktur; eksi bakiye yalnızca zorunlu giderlerden
  doğabilir, faiz/borç değildir.
- İlk sürümde tek senaryo vardır: 1453.
- Teknoloji: TypeScript + three.js; hazır oyun motoru yok. Önce web,
  mobil sonra.
- AI agent kullanıcı onayı olmadan yeni aşamaya geçemez.

Bu talimatı okuduktan sonra doğrudan kod yazma.
Önce mevcut durumu, önerdiğin ilk onay kapısını ve sorulması gereken
az sayıdaki kritik kararı sun.
```

------------------------------------------------------------------------

# 28. SON KABUL VE BELGE YÖNETİMİ

## 28.1 Bu sürümün kapsadığı şey

-   Kullanıcının keşif sürecindeki ana kararlarının sistematik özeti.
-   Oyun mekaniği için ayrıntılı gereksinim ve uygulanabilir taslaklar.
-   AI agent yetki sınırları, görev kartları ve aşama onay sistemi.
-   Kavramsal veri modeli, test senaryoları, riskler ve açık kararlar.
-   Teknoloji seçimini aceleye getirmeyen geliştirme çerçevesi.

## 28.2 Bu sürümün **henüz** iddia etmediği şey

-   Bütün mekaniklerin matematiksel formüllerinin onaylandığı.
-   Tarihî harita ve nüfus veri setlerinin toplandığı veya doğrulandığı.
-   Her ekranın piksel düzeyinde tasarlandığı.
-   Teknoloji yığınının seçildiği.
-   Prototipin, oyunun veya testlerin uygulandığı.
-   Kesin bütçe, takvim veya yayın tarihinin belirlendiği.

## 28.3 İlk kullanıcı onayı

**Önerilen ilk karar:** Bu belgeyi ürün vizyonunun temel referansı
olarak kabul edip etmediğini doğrulamak; ardından **ilk oynanabilir
senaryo, en küçük fethedilebilir arazi birimi ve tur süresi
seçenekleri** konularını birlikte netleştirmek.

**v1.1 durumu:** Kullanıcı 28 Ekim 2026'da ilk kararları verdi
(DEC-0001--DEC-0009). **v1.2:** Kullanıcı 29 Ekim 2026'da 'Tasarım
tabanı onaylandı' dedi; Aşama 0 kapısı geçildi (DEC-0011,
`docs/milestones/ASAMA-0.md`).

**Belge ilkesi:** Her geliştirme adımında kullanıcı vardır. AI agent
hızlandırır, önerir ve uygular; **oyunun yönünü kullanıcı belirler**.

------------------------------------------------------------------------

*Belge sonu --- TARİHÎ STRATEJİ OYUNU MASTER SPEC v1.3*
