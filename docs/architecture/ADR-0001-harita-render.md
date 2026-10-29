# ADR-0001 — Harita render yaklaşımı (three.js)

- **Durum:** KABUL EDİLDİ (2026-10-29, DEC-0014)
- **Tarih:** 2026-10-29
- **Görev:** TASK-0001
- **Dayanak:** DEC-0012 (TypeScript + three.js, oyun motoru yok), DEC-0013 (önce web),
  DEC-0007 (poligon arazi birimi, şehir ayrı nokta)
- **Prototip:** `prototypes/render-olcum-01/`

## Bağlam

Teknoloji kararı verildi (DEC-0012). Bu belge, three.js ile poligon tabanlı siyasi haritanın
hangi yaklaşımla çizileceğini ve masaüstü web tarayıcısında hangi ölçeğe kadar akıcı kaldığını
ölçer. Asıl soru şuydu: Aşama 1–3 için arazi birimi sayısında render tarafı bir sınır koyuyor mu?

## Denenen yaklaşım

| Katman | three.js yapısı | Çizim çağrısı |
|---|---|---|
| Arazi dolgusu | Tüm kara birimleri **tek** `BufferGeometry`; köşe renkleri; `earcut` ile üçgenleme | 1 |
| Arazi sınırı (ince) | `LineSegments`, yakınlaştıkça belirir | 1 |
| Devlet sınırı (kalın, keskin) | `LineSegments2` (piksel genişlikli "fat line") | 1 |
| Kıyı çizgisi | `LineSegments2` | 1 |
| Yerleşimler / başkentler | `Points`, ekranda sabit piksel boyutu | 2 |
| Seçim çerçevesi | `LineSegments2` | 1 |

- **Kamera:** Ortografik. Kaydırma, imleç merkezli yakınlaştırma ve klavye desteği var.
- **Ayrıntı düzeyi (LOD):** Ayrıntılar, bir arazi biriminin ekranda kaç piksel kapladığına göre
  açılır kapanır. Arazi sınırları yaklaşık 8 pikselde, yerleşimler 14 pikselde görünmeye başlar.
- **Seçim:** GPU'dan okuma yapılmaz. En yakın merkez `delaunay.find` ile bulunur, ardından
  komşularla birlikte kesin nokta–poligon testi yapılır. Seçilen arazinin rengi açılır ve
  çerçevelenir.
- **Paylaşılan kenarlar:** Komşu iki arazi aynı kenar noktalarını kullanır. Bu yüzden sınırlarda
  boşluk ya da üst üste binme oluşmaz. Gerçek veride de bu ilke korunmalıdır (topolojik veri).
- **Veri:** Tohumlu (seed) sentetik Voronoi haritası. Kenarlar kırılmıştır, bu yüzden arazi
  birimleri içbükey ve düzensizdir. **Gerçek tarihî veri değildir.**

## Ölçüm yöntemi

- 1600×900 CSS piksel tuval, 2× piksel oranı (gerçek çizim 3200×1800).
- 12 saniyelik sabit kamera yolu: ilk 4 saniye tüm dünya üzerinde kaydırma, sonraki 4 saniye en
  yakın seviyeye kadar yakınlaşma ve kaydırma, son 4 saniye uzaklaşma. İlk 0,5 saniye ısınma
  olarak sayılmadı.
- Otomatik çalıştırma: `prototypes/render-olcum-01/olcumler/olc.mjs` (puppeteer-core ile yerel
  Chrome). Elle çalıştırmak için `?olcum=1` adresi ya da paneldeki düğme kullanılabilir.
- Cihaz: **Apple M2, Chrome (headless), ANGLE Metal**. Ham sonuçlar:
  `prototypes/render-olcum-01/olcumler/2026-10-29-chrome-headless-apple-m2.json`.

## Sonuçlar

| Arazi birimi | Devlet | Üçgen | Ort. FPS | Kare p95 / p99 / en kötü | Render CPU ort. / p95 | Veri üretimi | three.js katmanı | İlk kare | JS bellek |
|---|---|---|---|---|---|---|---|---|---|
| 5.000 | 114 | 88 bin | 60,0 | 16,7 / 16,8 / 16,8 ms | 0,34 / 0,5 ms | 90 ms | 29 ms | 370 ms* | 22 MB |
| 20.000 | 446 | 348 bin | 60,0 | 16,7 / 16,8 / 16,8 ms | 0,41 / 0,5 ms | 295 ms | 75 ms | 35 ms | 99 MB |
| 50.000 | 1.101 | 865 bin | 59,9 | 16,8 / 16,8 / 33,4 ms | 0,47 / 0,6 ms | 762 ms | 146 ms | 56 ms | 136 MB |

\* İlk açılışta gölgelendiriciler derlendiği için süre uzun. Sonraki sayfalarda tarayıcı
önbelleği devreye girdi.

Bütün ölçeklerde çizim çağrısı sayısı ortalama 5–6 arasında kaldı. Seçim ve üzerine gelince
çıkan bilgi kutusu 20.000 birimde test edildi ve çalıştı. Sayfa hatası oluşmadı.

Görseller: `ADR-0001/n20000-genel.png`, `ADR-0001/n20000-secim.png`, `ADR-0001/n50000-genel.png`.

## Yorum

1. **Render bu ölçeklerde darboğaz değil.** 50.000 birimde bile her kare 60 Hz sınırında
   kaldı. Yalnızca bir kare 33 ms sürdü. Kare başına render CPU süresi 1 ms'nin altında.
   Arazi birimi sayısına (OPEN-002'nin açık kalan kısmı) render açısından **50.000'e kadar**
   bir engel görünmüyor.
2. **Asıl maliyet veri hazırlamada.** 50.000 birimde kenar ve halka üretimi tek başına yaklaşık
   600 ms sürüyor. Gerçek oyunda bu iş oyun açılırken yapılmamalı. Topoloji, önceden işlenmiş
   bir veri paketi olarak gelmeli (paylaşılan kenarlar + üçgenlenmiş dolgu).
3. **Bellek** 50.000 birimde 136 MB. Bunun çoğu prototipin tuttuğu ara diziler. Önceden
   işlenmiş veriyle düşmesi beklenir, ama bu ölçülmedi.

## Ek ölçüm: kullanıcının tarayıcısı (2026-10-29)

Kullanıcı, harita-gorsel-02 prototipini (gerçek dünya, 3.637 birim, 333 bin üçgen, Gece teması)
kendi Chrome penceresinde ölçtü: 1470×802 @2x, Apple M2.

- Ortalama 60 FPS; kare süresi p50 16,7 ms, p95 17,6 ms, en kötü 17,7 ms.
- Render CPU ortalama 0,15 ms; etiket güncellemesi ortalama 0,13 ms.
- 10 çizim çağrısı; JS belleği 124 MB.

Bu ölçüm, headless ölçümdeki "normal pencerede doğrulanmalı" uyarısını kapatır. Zayıf cihaz
ölçümü (OPEN-019) hâlâ açıktır.

## Sınırlar — bu ölçüm neyi göstermiyor?

- **Tek cihaz ve güçlü bir cihaz** (Apple M2). Zayıf bir dizüstü bilgisayar veya entegre
  GPU'lu bir Windows makinesi ölçülmedi. OPEN-019 için bu gerekli.
- **60 Hz tavanı:** Kare süresi ekran yenileme hızıyla sınırlı. Ne kadar pay kaldığı yalnızca
  render CPU süresinden tahmin edilebiliyor. GPU süresi ölçülmedi.
- **Headless çalıştırma:** Otomatik ekran görüntüsü alınırken canlı sayaç anlık olarak 32 FPS
  gösterdi. Bunun nedeni büyük olasılıkla ekran görüntüsü yakalamaydı. 12 saniyelik düzenli
  ölçümde bu düşüş görülmedi. Normal bir tarayıcı penceresinde elle doğrulanması önerilir.
- **Ölçülmeyen şeyler:** Yazı ve etiketler (devlet ve şehir adları), dokular, ordu simgeleri,
  harita modları (diplomasi, isyan riski) ve sık renk güncellemeleri. Bunlar ayrıca ölçülmeli.
- **Görsel yön:** Renkler ve çizgi stilleri yalnızca okunabilirlik için seçildi. Görsel yön
  kararı değildir (OPEN-021).

## Öneriler (onay gerektirir)

1. Bu katman yapısı Aşama 1'in temeli olarak kabul edilsin: tek dolgu geometrisi, ayrı sınır
   katmanları, piksele göre LOD, CPU tarafında nokta–poligon seçimi.
2. Gerçek oyunda sürekli döngü yerine **yalnızca değişiklik olduğunda çizim** yapılsın.
   Tur bazlı bir oyun için pil ve ısı açısından daha uygun.
3. Seçim gibi küçük renk değişikliklerinde yalnızca değişen aralık GPU'ya gönderilsin.
   Prototip şu an tüm renk tamponunu yeniden yüklüyor.
4. Sonraki ölçüm turunda (TASK-0002 adayı): devlet ve şehir etiketleri, ikinci bir zayıf cihaz,
   harita modu renk geçişi.

## Bağımlılıklar ve lisanslar

| Paket | Sürüm | Lisans | Kullanım |
|---|---|---|---|
| three | 0.186.1 | MIT | Render |
| earcut | 3.2.4 | ISC | Poligon üçgenleme |
| d3-delaunay | 6.0.4 | ISC | Sentetik veri (Voronoi), seçim ön araması |
| vite | 8.3.5 | MIT | Geliştirme ve derleme (yalnızca geliştirme) |
| typescript | 7.0.2 | Apache-2.0 | Tip kontrolü (yalnızca geliştirme) |
| puppeteer-core | — | Apache-2.0 | Otomatik ölçüm; prototipe dahil değil |

Hiçbiri ücretli değildir ve dış servis kullanılmamıştır.
