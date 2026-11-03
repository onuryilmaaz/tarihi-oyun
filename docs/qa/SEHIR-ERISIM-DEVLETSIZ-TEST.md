# TASK-0044 — Şehir erişimi ve devletsiz fetih (2026-11-02)

Kapsam: Kullanıcının Venedik, Pola/Trieste, Napoli ve Bretonya görsellerindeki erişim şikâyeti; devletsiz araziyi alma isteği. DEC-0087 / TASK-0044.

## Neden ve değişiklik

- İstemci çok parçalı birimde **en yakın parça merkezini** seçiyordu. Napoli'nin gerçek şehir noktası ana karada olsa da en yakın merkez bir adaya; Nantes'ınki kopuk kıyı parçasına düşebiliyordu. Hedefin içinde bulunduğu poligonun düğümü kullanılır. Şehir paneli ve şehir işaretine sağ tık gerçek şehir noktasını/düğümünü kullanır.
- Venedik şehir adasının hareket düğümünde hiç kenar yoktu. Mevcut elle tanımlı geçit sistemiyle Venedik–Udine arasında kısa, süre maliyetli lagün geçidi eklendi. Oynanış yaklaşımıdır; 1453'te kara köprüsü bulunduğu iddiası değildir. Başka adalara otomatik bağlantı eklenmedi.
- Çıkarma sistemi mevcuttu; beş şehir de liman listesinde. Şehir paneline seçili donanmayla çıkarma düğmesi ve kapasite/konum/savaş engeli açıklaması eklendi. Gemi, liman ve savaş kuralları aynıdır. Kullanıcının kendi kaydı incelenmediği için denizden erişim şikâyetinin tek nedeni kesinleştirilmiş değildir.
- Devletsiz arazi, işgal kodunda açıkça atlanıyordu. Mevcut 3 günlük hazırlık artık şehirsiz devletsiz arazide kalıcı sahiplik ve kontrol verir. Çekişme, hareket, geri çekilme veya muharebe bekleyişi sıfırlar. Yabancı topraklarda savaş/işgal/barış ayrımı sürer.
- Rota hatasındaki eski “deniz taşıması donanmayla gelecek” ve “Aşama 6” ifadeleri güncellendi.

## Doğrulama

- `npm test`: 38 dosya / 297 test geçti. 13 yeni davranış testi.
- `npm run typecheck` ve `npm run build`: geçti.
- Kara senaryoları: Padova→Venedik, Foggia→Napoli, Saumur→Nantes, Nantes→Brest, Trieste→Pola; gerçek şehir düğümüne varış ve otomatik kuşatma. Kara ağının bağlantısını ölçen bu testte bütün yabancı devletlere savaş tanımlanır; üçüncü devlet üzerinden barışta geçiş yetkisi verildiği anlamına gelmez.
- Deniz senaryoları: Selanik→Venedik/Napoli/Nantes/Brest/Pola; barışta ret, savaşta emir→yükleme→seyir→gerçek şehir düğümüne iniş→otomatik kuşatma; değişmezler temiz.
- Devletsiz fetih: tam bekleme süresi; kayıt/yükleme devamı; tek olay; aynı devletin iki ordusunun süreyi hızlandırmaması; çekişme/hareket/muharebe/geri çekilme kesintisi; yabancı arazinin kalıcı sahipliğinin korunması.
- 5173, ayrı geçici Chrome profili (`/tmp/tarihi-task0044-chrome`): hazırlanmış güncel kayıtlar oyunun dosyadan yükleme ekranıyla yüklendi, gerçek düğmelerle emir ve tur verildi. Kullanıcının tarayıcı kayıtları değiştirilmedi.
  - Saumur→Nantes: 14 günlük rota, 15 Nisan varışı ve otomatik kuşatma. Eski yanlış parça seçimi tekrarlanmadı.
  - Selanik→Venedik: şehir panelinden çıkarma; 13 Nisan kıyıya iniş, otomatik kuşatma; gemi yükü boşaldı.
  - Devletsiz El Cufra (1208): haritaya sağ tıkla yürüyüş; 7 Mayıs varışı, 9 Mayıs sahiplik/kontrol; panelde Osmanlı ve haritada yeni siyasi sahiplik.
  - Beş şehirde istemcinin poligon-parça eşleşmesi senaryodaki şehir düğümüyle aynı.
  - Tarayıcı çalışma zamanı hatası görülmedi. İncelenen görüntü: `/tmp/tarihi-task0044-cikarma.png`.
- Hareket ağı, **mevcut haritadan** yeniden üretildi; düğümlerin birebir aynı olduğu doğrulanmadan senaryo yazılmadı. Yalnız bir geçit kenarı eklendi, harita ve `veri/geom` değişmedi. Senaryo sürümü `0f04ae997f`; kayıt şeması korunur. DEC-0075 gereği önceki senaryo sürümündeki kayıtlar taşınmaz; yeni oyun gerekir.
- `npm run geometri:kontrol`: **10 mevcut hata sürüyor**. `git show HEAD` içindeki harita/senaryoda da aynı liste bulundu; bu görevle eklenmedi. Cebelitarık ve Saint George's halkaları; Gelibolu ve Kilva şehir/düğüm eşleşmesi; Zara, Nakşa, Hürmüz, Malakka şehir kıyısı. Bu nedenle bütün dünya için geometri temizliği iddiası yoktur.

## Kullanıcı testi

1. `http://localhost:5173` sayfasını yenile, **yeni oyun** aç.
2. Orduyu seç → düşman şehir panelini aç → **Şehre yürü ve kuşat** → turu ilerlet. Kara koridorundaki üçüncü devletler için erişim kuralları sürer.
3. Deniz için orduyu kendi limanına götür → yeterli kapasiteli, o denizde demirli donanmayı seç → hedef limanı aç → **Bu limana çıkarma yap** → turu ilerlet. Yabancı hedefe savaş ilanı gerekir.
4. Orduyu seç → devletsiz araziye sağ tıkla → varıştan sonra 3 günlük bekleyişi tamamla; toprak devletinin rengini almalı.

Kullanıcı kabulü bekleniyor. Commit/push yapılmadı.
