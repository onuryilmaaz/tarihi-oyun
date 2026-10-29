# 1453 yaklaşık sınırları — prototip verisi

- **Durum:** TAHMİN. Kaynaklandırılmamış ve doğrulanmamıştır (MASTER_SPEC §5.1, DEC-0016).
- **Not (v0.2):** Bu belge v0.1'i anlatır. v0.2'de ayrıntı bölgesinin bir kısmı OpenHistoricalMap
  kaynaklıdır; ayrıntılar `1453-v02-karsilastirma.md` belgesinde.
- **Kullanım yeri:** Yalnızca görsel ve etkileşim prototipleri (TASK-0002). Gerçek senaryo
  verisi **değildir**. Kaynaklı veri OPEN-018 kapsamında ayrıca ele alınacak.
- **Kod:** `prototypes/harita-gorsel-02/scripts/devletler-1453.mjs`

## Yöntem

1. **Coğrafya:** Natural Earth 1:10m. Kullanılan katmanlar: 1. düzey idari birimler (il/eyalet),
   göller (scalerank ≤ 4) ve nehirler (ayrıntı bölgesinde scalerank ≤ 6, başka yerlerde ≤ 4).
   **Lisans:** kamu malı (public domain); atıf zorunlu değil ama verildi.
2. **Atama:** Her modern idari birim, ülke ve birim adı, bölge alanı ya da etiket noktasının
   enlem/boylamı kullanılarak bir 1453 devletine atandı. Atanamayan birimler "devlet yok"
   (gri/bej) bırakıldı. Yerleşik devleti olmayan bölgelerde ve bilinçli olarak
   basitleştirilen bölgelerde durum böyle.
3. **Bölmeler:**
   - İstanbul ili: Konstantiniyye ve çevresi Bizans'a, kalanı Osmanlı'ya verildi.
   - Batı Yunanistan: Korint Körfezi'ne göre Mora ile Osmanlı arasında bölündü.
   - Güney Ege: Rodos Şövalyeleri ile Nakşa arasında bölündü.
4. **Birleştirme:** Çok küçük birimli ülkelerde (İngiltere, Slovenya, Letonya, Makedonya,
   Azerbaycan, Moldova, Karadağ vb.) birimler bölgeye ya da devlete göre birleştirildi.
5. **Etiket konumu:** Her devletin birleşik sınırının en büyük parçasında en geniş iç dairenin
   merkezi (polylabel).

## Senaryo anı

Konstantiniyye'nin fethinden **önce** (AT-002 gereği şehir Bizans'ta). Gaskonya henüz
İngiltere'de (Castillon savaşından önce).

## Bilinen basitleştirmeler ve doğrulanması gerekenler

- **Sınır çizgileri:** Modern il/eyalet çizgilerini izliyor; tarihî sınırlar bu çizgilerle
  örtüşmez. DEC-0007'deki kaza/nahiye ölçeğindeki birimler gerçek veriyle üretilmeli.
- **Anadolu beylikleri:** Karaman, Candar, Dulkadir, Ramazanoğulları, Akkoyunlu ve Karakoyunlu
  sınırları kaba. Erzincan, Erzurum, Kayseri, Malatya ve Gümüşhane'nin hangi devlete ait
  olduğu tartışmalı.
- **Balkanlar:** Arnavut beylikleri, Zeta ve Hersek ile Venedik'in Adriyatik kıyısındaki
  kaleleri yaklaşık. Venedik'in Mora'daki kaleleri (Modon, Koron, Nafplio, Argos) ve Eğriboz
  gösterilmedi.
- **Kutsal Roma İmparatorluğu:** Birkaç büyük devlet dışında "diğer" olarak tek parça gösterildi.
- **Doğu Avrupa:** Litvanya, Büyük Orda, Kırım ve Nogay sınırları bozkırda belirsiz.
- **Asya, Afrika, Amerika:** Yalnızca büyük siyasi yapılar kaba olarak yer aldı.
- **Küçük yapılar:** Kefe (Cenova) ve Galata bölge olarak değil, yalnızca şehir noktası olarak
  var.

## Sonraki adım önerisi

Gerçek 1453 senaryo verisi için kaynak ve lisans araştırması (OPEN-018) ayrı bir görev olmalı.
Önce ayrıntı bölgesi (Balkanlar, Anadolu, Doğu Akdeniz) ele alınmalı.
