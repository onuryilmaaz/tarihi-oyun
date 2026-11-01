# Age of History karşılaştırması — 1 Kasım 2026

Görev: TASK-0041. İlk araştırma teslimi. 2026-11-01 kullanıcı uygulamaya başlamayı onayladı (DEC-0086 / TASK-0042);
aşağıdaki durum araştırma anını gösterir, uygulama ilerlemesi yeni görev kartlarında tutulur.

## Sonuç ve yöntem

Mevcut oyun temel fetih döngüsüne sahip. En büyük geliştirme alanı savaş dışındaki kararların çeşitlenmesi ve
mevcut sistemlerin birbirine bağlanması. Bu, kaynak kod ve tasarım incelemesinden çıkan değerlendirmedir.
Age of History bu oturumda oynanmadı; bizim oyunda yeni canlı kampanya testi yapılmadı.

MASTER_SPEC, DECISIONS ve Aşama 10 belgesi okundu. Güncel kod esas alındı; eskimiş yorumlar uygulama kanıtı
sayılmadı. Şehir ve toprağın birlikte fethi DEC-0074/0077 ile geçerli. TASK-0040 HEAD'de commit edilmiş
(`e0125683`); devir notundaki commit bekliyor ifadesi eski. Başlangıçta üç kaynak betiğinde bekleyen değişiklik vardı.

## Resmî kaynaklar ve sürüm ayrımı

- **S1 — Age of History II:** Devrimler, kampanya sonu tarih animasyonu, senaryo/devlet/bayrak/harita düzenleyicileri
  ve aynı cihazda sıralı çok oyunculu listeleniyor. [Geliştiricinin Steam sayfası](https://store.steampowered.com/app/603850/Age_of_History_II/).
- **S2 — Age of History 3:** Teknolojiyle açılan içerikler, 63'ten fazla birlik, iki hatlı muharebe, yenilenen insan
  gücü, danışmanlar/generaller, 90'dan fazla bina, 48 kaynak, devlet mirasları/avantajları ve kanun/reformlar var.
  İçerik sayısı kalite/denge kanıtı değildir. [Geliştiricinin Steam sayfası](https://store.steampowered.com/app/2772750/Age_of_History_3/).
- **S3 — Age of History 2: Definitive Edition:** Klasik II'den ayrı ürün. Barışı zorlama, savaşa müdahale/katılma,
  gönüllü asker, diplomatik zirve, teknoloji paylaşma ve birlik önerme gibi ek eylemleri var.
  [Geliştiricinin Steam sayfası](https://store.steampowered.com/app/3381680/Age_of_History_2_Definitive_Edition/).
- **S4 — III güncellemeleri:** İlişki ve ödeme koşullarıyla zaman içinde vasal bütünleştirme; devletlerin birleşmesi,
  yeni vasal devlet çıkarma ve müttefiklerden barışta toprak alma seçenekleri açıklanıyor.
  [Resmî duyurular](https://steamcommunity.com/app/2772750/announcements/).
- **S5 — III görevleri:** Koşullar sağlanınca oyuncunun etkinleştirdiği görevler ve senaryoya özel görev ağaçları
  geliştirici tarafından açıklanıyor. [Görev ağacı için geliştirici rehberi](https://steamcommunity.com/app/2772750/discussions/4/4632608644979033711/).
- **S6 — Definitive Edition ayrıntıları:** Geçiş izni, terhis, asimilasyon ve görev/olay düzenleme başlıkları var.
  II sayfasında duyurulmaları klasik II'nin tümünde aynı şekilde bulunduklarını kanıtlamaz.
  [Resmî duyurular](https://steamcommunity.com/app/603850/announcements/).

Topluluk modları ve oyuncu önerileri ana oyun özelliği sayılmadı. Mağaza ve geliştirici açıklamaları özellik
varlığını destekler; AI kalitesi, denge ve performans üstünlüğünü kanıtlamaz.

## Bizde zaten bulunanlar

Vergi, şehir gelir dökümü ve hazine geçmişi; tarla/pazar/sur; bütçe sınırlı yerel yönetim; toplu şehir/sur geliştirme;
şehirden ve merkezî asker toplama; **aylık insan gücü yenilenmesi**; ordu bölme/birleştirme; piyade/okçu/süvari;
moral/ikmal/geri çekilme; kuşatma; toprak/tazminat/vasallık barışı; ittifak, elçi, ticaret anlaşması, saldırmazlık,
ambargo, AI teklifleri; hükümdar/halef; din/kültür nüfusu ve iskân; açıklamalı isyan riski; donanma/abluka/çıkarma;
casusluk; devletlere göre adlandırılmış idari birimler; kayıt yuvaları ve dosyaya kayıt mevcut.

İnsan gücünün yenilenmemesi artık eksik değil (TASK-0039). Savunma ittifakı savaşa katılım üretiyor; eksik olan
ortak savaş/barış yönetimi. Şehir adı değiştirme ve birleştirme de mevcut; bunlar tam senaryo düzenleyicisi değil.

## Eksikler ve sınırlı kalanlar

P1: mevcut oyunda karar çeşitliliği/oyuncu kontrolü; P2: uzun kampanya derinliği; P3: sonraki araç/içerik.
Bu öncelikler öneridir; her mekanik için ayrıca kapsam, maliyet, kabul ölçütü ve kullanıcı onayı gerekir.

| No | Alan / referans | Kodda doğrulanan durum ve eksik | Oyuncuya etkisi / öneri | Öncelik |
|---|---|---|---|---|
| 1 | Askerî geçiş (S6) | `hareket.ts: gecilebilir` kendi, sahipsiz ve savaşılan toprağı kabul ediyor. Geçiş anlaşması yok. | Dost/müttefik üzerinden cepheye ulaşma sınırlı; süreli geçiş izni düşünülebilir. | P1 |
| 2 | Terhis ve takviye (S6, S2) | `emirler.ts` içinde terhis ve hedef sayıya göre otomatik takviye yok. Yeni toplama ve birleştirme var. | Maaşı düşürmek ve savaş kayıplarını karşılamak için araçlar eksik. İki ayrı küçük teslim uygun. | P1 |
| 3 | Yapı çeşitliliği (S2) | `yatirim.ts` geliştirilebilir yapıları tarla/pazar/sur olarak tanımlıyor. Liman ve gemi inşası ayrıca var. | Şehir seçimleri benzerleşiyor; okul, atölye, kışla gibi birkaç farklı işlev düşünülebilir. | P1 |
| 4 | Kaynak ekonomisi (S2) | `GelirKaynagi` dört tür; `sehir.ts` bunları gelir/toplama çarpanı yapıyor. Mal miktarı ve ürün bazlı ticaret yok. | Stratejik kaynak erişimi önemsiz kalıyor; küçük bir tahıl/demir/kereste kapsamı değerlendirilebilir. Stok/fiyat sistemi ayrı karar. | P1 |
| 5 | Teknoloji devamı (S2) | `teknoloji.ts` toplam 10 teknoloji içeriyor. İki paralel alan ve somut açılımlar var; devam eden çağ dalları yok. | Son teknolojiden sonra tercih bitiyor; yalnızca süre artırımı yerine 1453 sonrası anlamlı dallar önerilir. | P1 |
| 6 | Birlik ve komutan (S2) | Üç kara birliği var. `OrduDurumu` komutan, deneyim veya saf taşımıyor. Büyük Top Dökümü ayrı topçu değil, bonus. | Ordu farkları dar; önce komutan/deneyim ve topçu rolü düşünülebilir. | P2 |
| 7 | Ortak savaş/barış (S3, S4) | `Savas` ikili; müttefik katılımı ayrı savaş kaydı açıyor. `BarisTalebi` tek düşmandan toprak/tazminat/vasallıkla sınırlı. | Ortak lider, müttefike toprak paylaştırma, ortak barış ve devlet serbest bıraktırma yok. | P2 |
| 8 | Vasallık ve birleşme (S4) | Vergi, savaşa katılım ve mevcut vasalı serbest bırakma var (`vasallik.ts`). Bütünleştirme, bağımsızlık isteği ve yeni vasal oluşturma yok. | Vasallık ilişkisi dar kalıyor; sadakat ve diplomatik bütünleşme değerlendirilebilir. Devlet birleşmesi de ayrı eksik. | P2 |
| 9 | İsyanın siyasi sonucu (S1, S3) | `istikrar.ts` ayaklanma/bastırma içeriyor; yeni devlet veya ayrı isyancı ordu üretmiyor. | İç karışıklık ekonomiyi kesiyor, haritayı parçalamıyor; öngörülebilir bağımsızlık süreci düşünülebilir. | P2 |
| 10 | Kanun/reform/danışman (S2) | Vergi ve veraset var; oyuncunun seçtiği reform/kanun/danışman sistemi durum modelinde ve emirlerde yok. | Devletlerin kurumları benzer çalışıyor; merkezîleşme ve yerel yetki arasında bedelli tercihler düşünülebilir. | P2 |
| 11 | Fetih sonrası bütünleşme (S6) | Gruplar, göç, iskân ve yeni fetih riski var. Özerklik/bütünleşme ilerlemesi ve kültür politikası yok. | Seçenekler bağış/ordu/vergi etrafında kalıyor; yerel kabul ve yönetim tercihleri önerilir. | P2 |
| 12 | Hedef ve görevler (S5) | `index.html` belirlenmiş zafer koşulu olmadığını söylüyor. İsteğe bağlı görev/uzun vadeli hedef takibi yok. | Büyüme dışında ekonomi, diplomasi ve savunma hedefleri düşünülebilir; tarih zorlanmamalı. | P1 |
| 13 | Kampanya geçmişi (S1) | Olay/barış/muharebe kayıtları var; geçmiş tarihin sınır haritası ve kampanya animasyonu yok. | Alternatif tarihin oluşumunu geriye dönük izlemek sınırlı; önce tarih çizelgesi önerilir. | P3 |
| 14 | Düzenleyiciler (S1) | Betikler ve varlık dosyaları var; oyuncuya açık senaryo/devlet/bayrak/harita düzenleyicisi yok. | Özel başlangıç hazırlamak/paylaşmak zor; ayrı araç projesi. | P3 |
| 15 | Senaryo/mod çeşitliliği (S1, S3) | `main.ts` senaryo yolunu 1453'e bağlıyor; hotseat/çok oyunculu yok. | Tekrar oynanabilirlik farkı; mevcut ilk sürüm kararına aykırılık değil. | P3 / ertelenmiş |

## Bizim koddan çıkan ek iyileştirme alanları

Burada Age of History'nin AI'sının üstün olduğu iddia edilmiyor; bizim kodun sınırları belirtiliyor.

1. **AI'lar arası yeni diplomatik bağlar:** `yz-diplomasi.ts` tekliflerini oyuncuya yönlendiriyor. AI'lar arası savaş,
   mevcut ittifaka çağrı ve barış var; kendiliğinden yeni ittifak/ticaret/saldırmazlık ağı kurma yok. P1 önerisi.
2. **AI deniz stratejisi:** Düzeltme (2026-11-01): `deniz.ts: yzDonanmalari` zaten görünür zayıf düşmana
   saldırı ve kuşatılan limana abluka için hareket üretiyor. İlk raporun “donanma hareketi yok” ifadesi yanlıştı.
   Eksik olan gemi üretimi ve çıkarma planlaması; önce gemi yenileme, sonra çıkarma önerilir (P2).
3. **Eksi bütçeden çıkış:** AI yeni askerin maliyetini denetliyor; mevcut fazla askeri azaltacak terhis yok.
   Önceki devir notundaki küçük devletlerin eksi bütçe gözlemi bu oturumda yeniden kampanya ile ölçülmedi.
4. **Bildirim/dünya özeti:** Günlük var; işçi son 30 kaydı, ana panel son 12 kaydı gösteriyor. Filtreli kalıcı haber
   merkezi ve dünya güç değişimi ekranı yok. Kamuya açık bilgilerle takip düşünülebilir; gizli veri açılmamalı (P1/P2).

## Bilinçli farklar

- Borç/kredi/faiz eklemek eksik kapatma değil: DEC-0002 yasaklıyor.
- Diğer senaryolar, modern silahlar, mobil ve çok oyunculu ilk sürüm gereksinimi değil.
- Eski kayıt dönüştürme bilinçli kaldırıldı (DEC-0075).
- Daha fazla poligon tek başına hedef değil; siyasi okunabilirlik, topoloji ve tarihî güvenilirlik önemli.
- Serbest hedefli yürüyüş, değişken tur/olay kesintisi, hükümdar/halef, din/kültür nüfusu, bütçe sınırlı yerel yönetim
  ve donanma/abluka/çıkarma mevcut ürünün korunacak özellikleri.
- Zorunlu tarihî olay takvimi ve başka oyunun arayüz/varlıklarını kopyalamak MASTER_SPEC §1.1'e aykırı.

## Önerilen sıra ve doğrulama sınırı

Önce terhis/takviye ve geçiş; ardından AI diplomasisi/bütçe toparlanması; sonra yapı/kaynak çeşitliliği,
teknoloji devamı ve isteğe bağlı hedefler. Vasallık, siyasi isyan sonuçları, ortak barış ve reformlar ayrı büyük işler.
Sıra henüz onaylı değil. Araştırmanın tamamlanması için karar gerekmiyor; uygulama istenirse somut görev kartı gerekir.

Üretim kodu değiştirilmedi. Kaynaklar açıldı; ilgili veri modelleri, emirler, hesaplamalar ve arayüz incelendi.
TASK-0041, bu rapor, DECISIONS, CHANGELOG ve DEVIR-TESLIM güncellendi. Typecheck, build ve diff kontrolü başarılı.
273 testten 272'si geçti; mevcut 10 yıllık kampanya testi 120 saniye sınırını aştı (131,4 sn). Aynı anda başka bir
senaryo üretimi çalışıyordu; süre aşımının nedeni kesinleştirilmedi. Kod veya test süresi değiştirilmedi.
Bu kontroller karşılaştırılan bütün özelliklerin oynanış kalitesini kanıtlamaz; rapor canlı hata tespiti değildir.
