# Aşama 4 — Savaş, Kuşatma ve Barış

**Durum:** ✔ KAPANDI — kullanıcı 4c/5a ayrıntılı testini yaptı ("hepsi başarılı") ve kapanışı
onayladı (2026-10-29, DEC-0037).

## 4a — Savaş ilanı, yabancı ordular, görünürlük, muharebe, moral, geri çekilme

| Çıktı | Yer |
|---|---|
| Savaş durumu, savaş ilanı emri; savaşta erişim kuralı açılır | `packages/sim/src/savas.ts`, `emirler.ts`, `hareket.ts` |
| Garnizon orduları (her devlete başkentinde; [TASLAK] büyüklük formülü) | `packages/sim/src/durum.ts` |
| Görünürlük: kendi toprakları + komşuları + ordu çevresi (2 düğüm); yaklaşık büyüklük | `savas.ts` → `gorunurYabanciOrdular` |
| Muharebe: günlük turlar (en çok 5 gün), sayı × moral × arazi, ±%15 şans, takip, dağılma | `savas.ts` |
| Moral ve tutum (temkinli / dengeli / inatçı), geri çekilme en yakın kendi şehrine | `savas.ts`, `denge.ts` |
| Denge değerleri tek dosyada [TASLAK] | `packages/sim/src/denge.ts` |
| İstemci: yabancı ordu işaretleri, savaş ilanı, tutum, moral, savaşlar listesi, muharebe raporu penceresi | `packages/istemci/` |

### Kabul (4a)

| Ölçüt | Kanıt | Sonuç |
|---|---|---|
| AT-008: muharebe otomatik çözülür; kayıp, moral, geri çekilme raporlanır | `savas.test.ts`; tarayıcıda Karaman muharebesi raporu | ✔ |
| Savaş nedenleri raporlanır | Rapor: sayı üstünlüğü, arazi, moral farkı, eşik, takip | ✔ |
| Yenilgi ve geri çekilme işler | Kaybeden en yakın kendi şehrine çekilir; çok zayıfsa dağılır | ✔ |
| Oyuncunun muharebesi turu durdurur (DEC-0006) | Test + tarayıcı kesinti penceresi | ✔ |
| AT-013: görünmeyen ordu ve kesin büyüklük istemciye gitmez | `savas.test.ts`; Worker yalnızca görünen yabancı orduyu yaklaşık sayıyla gönderir | ✔ |
| Determinizm; muharebe ortasında kayıt/yükleme | `savas.test.ts` | ✔ |

### Bilinen sınırlar (4a)

- Karşılaşma yalnızca aynı düğümde algılanır; aynı kenarda karşıdan gelen iki ordu düğüme varınca savaşır.
- Yabancı ordular yerinde savunur (DEC-0027/1); gerçek AI Aşama 6'da.
- Muharebe yeri adı modern il adıdır (prototip verisi).
- 4a sırasında kayıt şeması 3 kullanıldı. 4b şema 4 kullanır ve şema 3 kayıtlarını dönüştürür.


## 4b — Asker toplama, maaş, ikmal, bölme ve birleştirme

**Uygulama onayı:** DEC-0029. **Kabul:** Kullanıcı “test ettim başarılı” dedi (2026-10-29, DEC-0030); 4b kabul edildi.

| Ölçüt | Uygulama ve kanıt | Sonuç |
|---|---|---|
| Şehirden süreli, borçsuz toplama | `ordu.ts`, `emirler.ts`; 30 gün, şehir insan gücü ve hazine sınırı | ✔ |
| Kaynak kuyrukta iki kez harcanamaz | Toplama/harcama ortak bütçe, şehir havuzu; `ordu.test.ts` | ✔ |
| İşgalde toplama bekler | Şehir veya çevresinin kontrolü değişince süre durur, dönünce sürer | ✔ |
| Aylık zorunlu maaş ve eksi bakiyede moral | Bizans tarayıcı denemesi: üç ayda −8, sonraki haftada moral %79 | ✔ |
| Kendi toprağında tam ikmal, düşmanda aşınma | Birim testleri + Karaman seferinde ikmal %0, moral %93 | ✔ |
| Böl/birleştir, asker/moral/maaş tutarlılığı | Chrome: 20.000 → 19.000 + 1.000 → 20.000; ağırlıklı moral testleri | ✔ |
| Kayıt ve determinizm | Toplama ortasında devam, şema 3 dönüşümü; 1 yıl = 12 ay = 52 hafta + 1 gün | ✔ |
| Mevcut muharebe ve hareket korunur | Toplam 64 test + tip kontrolü + build | ✔ |

Ayrıntılı kanıt ve kullanıcı adımları: `docs/qa/ASAMA-4B-TEST.md`.

### Bilinen sınırlar (4b)

- Tüm denge sayıları TASLAK; şehir nüfusları ve insan gücü tarihî kesin rakamlar değildir.
- Ek insan gücü başlangıç nüfusunun %5'idir; harcanan havuz bu sürümde kendiliğinden yenilenmez.
- Birleştirme aynı düğümde ve tam aynı noktada bekleyen ordular içindir. Diğer ordunun işaretine
  sağ tıklayıp varışını beklemek bu koşulu sağlar. Yürüyüş/muharebe/geri çekilmede yapılamaz.
- İkmal ağ düğümündeki askerî kontrole göre hesaplanır; ayrıntılı ikmal hattı, kış, kapasite ve
  otomatik takviye sonraki kapsamdır. Tarafsız toprakta aşınma yoktur.
- Maaş toplam askerden ay başında alınır. Hazine negatif kaldığı günlerde moral cezası işler;
  faiz, kredi veya borç veren taraf yoktur. Gelir ve nüfus sistemleri hâlâ test sistemleridir.


## 4c — Kuşatma, gerçek işgal, savaş skoru ve barış

**Durum:** Uygulama tamamlandı ve kullanıcı testiyle KABUL EDİLDİ (DEC-0037).

| Kabul ölçütü | Kanıt | Sonuç |
|---|---|---|
| AT-009: şehir sıradan yürüyüşle düşmez, kuşatma zaman alır | `kusatma-baris.test.ts`; Chrome'da önce Larende hâlâ Karaman'da | ✔ |
| AT-007: şehir ve çevresi ayrı kontrol/sahiplik | Birim testlerinde ayrı şehir/arazi barışı; Chrome'da kuşatma sonrası yalnızca askerî kontrol | ✔ |
| Abluka/saldırı/teslim bekleme ve yeterli güç | Yöntem, süre, kayıp ve güç testleri; kuşatma paneli | ✔ |
| Ayrılma, yöntem değişimi, birden çok ordu, savaş kesintisi | Birim testleri; Chrome 7 gün abluka → saldırı → tur kesintisi | ✔ |
| Başkent tek başına zafer değildir | Skor <100 testi; Larende sonrası savaş sürüyor, skor 47 | ✔ |
| Barış sonrası mülkiyet tutarlı | Chrome: Karaman arazisi + Larende devri, yeni başkent Konya, diğer savaşların korunması testleri | ✔ |
| Tazminat/puan sınırı ve yeniden doğrulama | Fazla/negatif/tekrarlı talepler testleri, Chrome'da 999.999 tazminat engellendi | ✔ |
| Kayıt/şema/determinizm | Şema 3–4 dönüşümü, kuşatma ve barış kayıtları, farklı tur süreleri | ✔ |
| Önceki sistemler ve paketleme | 89 test, tip kontrolü ve build başarılı | ✔ |

Ayrıntı: `docs/qa/ASAMA-4C-TEST.md`. Aşama 4 kapanışı yalnızca açık kullanıcı onayıyla.

### Bilinen sınırlar (4c)

- Sur, garnizon, süre ve puanlar prototip denge değerleridir; tarihî kesin veri değildir.
- Kuşatma en az 7 etkin gün sürer. Yetersiz güçte veya muharebede etkin süre ilerlemez.
  Garnizon/erzak tükenmesi gerekir; salt beklemek gücü yetersiz orduya otomatik zafer sağlamaz.
- Abluka karadadır; donanma, deniz ikmali, sur onarımı ve garnizon yenilemesi bu teslimde yoktur.
- Skor işgal edilen arazi/şehir değerlerinden hesaplanır; gerçek AI pazarlığı Aşama 6'dadır.
- Barış yalnızca oyuncunun taleplerini ve düşmandan peşin tazminatı kapsar. Vasallık/çok taraflı
  antlaşma/ateşkes süresi kapsam dışıdır. Talep edilmeyen iki taraflı işgaller yasal sahibe döner.
- Başkent devredilirse kalan şehirler arasında en kalabalık şehir yeni başkent olur (eşitlikte
  sabit indeks). Şehri kalmayınca başkent null olur; devlet otomatik silinmez (OPEN-024).
- Dönebileceği kendi toprağı/yolu olmayan ordular yerinde kalır; oyun sonu/başka devlete geçiş
  kuralı eklenmedi. Normal dönüş anlık konum değişmeden günlük yürüyüşle gerçekleşir.
- Eski test işgali emri yalnızca eski kayıt/test uyumu için çekirdekte kaldı; arayüzde yoktur.
