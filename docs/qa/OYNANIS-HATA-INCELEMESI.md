# Oynanış ve sistemler arası tutarlılık incelemesi

- **Tarih:** 2026-10-29 · **İnceleyen:** Codex · **Görev:** TASK-0014
- **İncelenen sürüm:** main çalışma ağacı, şema 18, 1453 senaryosu; önceden kalan commit edilmemiş 10b değişiklikleri dahil.
- **Talep:** Kullanıcı Osmanlı ile Eflak'ı ilhak ettiğinde şehirde eski devlet adını gördüğünü bildirdi; genel hata araştırması istedi.
- **Sonuç:** 7 oynanış hatası tekrar üretildi. Ayrıca ilhak arayüzünde bir açıklık eksikliği, kayıt doğrulamasında bir eksiklik ve test kapsamı boşlukları bulundu.
- **Bu çalışmanın sınırı:** Üretim kodu değiştirilmedi. Bulgular henüz düzeltilmedi; commit/push yapılmadı. Kullanıcının kendi kayıt dosyası incelenmedi.

> **Sonraki çalışma:** Kullanıcı “hepsini sırayla yap” ile düzeltmeleri onayladı (DEC-0064).
> TASK-0015 uygulaması ve sonuçları `BUG-DUZELTMELERI-TEST.md` içinde. Aşağıdaki metin araştırma anındaki orijinal kanıttır.

## 1. Osmanlı–Eflak: bildirilen davranış

Gerçek senaryoda Eflak 26 arazi birimine ve tek şehre, **Tırgovişte**'ye (şehir indeksi 68), sahip.
İşgaller test için hazırlanıp talep `barisDogrula` ile doğrulandıktan sonra normal `barisiUygula` yoluyla uygulandı.
Her iki sonuç oyunun kendi dosyadan yükleme akışıyla, ayrı Chrome profilinde 5173'te açıldı.

| Barışta devredilenler | Tırgovişte paneli | Çevre arazi | Sonuç |
|---|---|---|---|
| 26 arazi + Tırgovişte | Devlet: Osmanlı Devleti; statü: şehir | Osmanlı | Tam devirde eski devlet adı sorunu tekrar üretilemedi. |
| 26 arazi, şehir seçilmedi | Devlet: Eflak Voyvodalığı; statü: başkent | Osmanlı | Kullanıcının tarifine benzeyen görüntü tekrar üretildi. Şehir Eflak'ta kalıyor. |

İkinci durumda şehir kontrolü de barış sonunda Eflak'a dönüyor. Bu, şehir ve çevresinin ayrı devri kuralıyla uyumlu
(DEC-0007, MASTER_SPEC §4.2, §9); şehrin adını arazi sahibine göre değiştirmek mevcut kurala aykırı olur.
Kullanıcının şehir kutusunu seçip seçmediği henüz bilinmiyor; yaşadığı örneğin kesin nedeni bu deneyle kanıtlanmış sayılmaz.

**UX-01 — P2, ilhakın tamamlanmadığı yeterince görünür değil:** Arazi rengi tamamen Osmanlı'ya geçiyor; Eflak'ın
haritadaki devlet etiketi arazi kalmayınca kayboluyor. Elde kalan ayrı şehri ve “bu devletin 1 şehri kalacak” bilgisini
barışın önizlemesi göstermiyor. Mevcut genel “seçilmeyen işgaller kalkacak” cümlesi bu somut sonucu açıklamıyor.

Kod: [baris.ts](../../packages/sim/src/baris.ts:91),
[savas-arayuzu.ts](../../packages/istemci/src/savas-arayuzu.ts:51),
[gorunum.ts](../../packages/istemci/src/harita/gorunum.ts:484).

**Öneri:** Mevcut ayrı şehir/arazi kuralını koruyarak barış önizlemesine devredilecek ve geride kalacak arazi/şehir
sayılarını yazmak; tam ilhak olup olmadığını açıkça göstermek; yabancı şehirleri haritada sahibinin işaretiyle ayırt etmek.
Otomatik şehir devri eklemek farklı bir mekanik kararı olur; bu inceleme onu onaylamaz.

## 2. Doğrulanan oynanış hataları

P1: önce çözülmesi gereken kayıt/savaş tutarlılığı sorunu. P2: belirli bir akışı bozan veya yanlış bilgi veren sorun.

### H-01 — P1: Yerel yönetim bütçesini düşürmek yüklenemeyen kayıt üretiyor

**Tetikleyici:** Yönetici o ay 300 harcadıktan sonra bütçe tavanını 1.000'den 0'a düşürmek.
`yerelYonetimAyarla` işlemi geçerli kabul ediyor; durum `{butce:0, harcanan:300}` oluyor.
Ancak kayıt doğrulaması `harcanan > butce` durumunu reddediyor.

**Tarayıcıda gerçek düğmelerle tekrar üretme:**

1. Osmanlı oyununda Edirne'yi aç; **Yerel yönetici: Kapalı — aç** düğmesine bas.
2. Solda **Devlet → Aylık bütçe tavanı** alanına 1.000 yaz; **Ayarı uygula**.
3. **Ay → Turu ilerlet**. Yönetici tarla başlatır; “Bu ay harcanan: 300 / 1.000” görünür.
4. Bütçeyi 0 yap; **Ayarı uygula**. “300 / 0” görünür; hata verilmez.
5. **Kaydet → Yeni kayıt olarak kaydet**. Kayıt yazılır.
6. Bu kaydı yükleme denemesi: **“Kayıt tutarsız: yerel yönetim geçersiz”**.

Kod: [yonetim.ts](../../packages/sim/src/yonetim.ts:17),
[durum.ts](../../packages/sim/src/durum.ts:506), [kayit.ts](../../packages/sim/src/kayit.ts:27).

**Etki:** Oyunun geçerli kabul ettiği ayar kendi kayıt sözleşmesini bozuyor. Sonraki ay sayaç sıfırlanana kadar yapılan
manuel kayıtlar ve ilgili otomatik kayıtlar yüklenemiyor.
**Öneri:** Bu ay gerçekleşen harcama ile bundan sonra geçerli tavanı tutarlı modellemek; bütçe düşürme işlemiyle
kaydet/yükle davranışını birlikte sınamak. Harcanmış parayı/sayacı sessizce silmek yerine anlamı korumak.

### H-02 — P1: Tam ilhak edilen devletin başka savaşındaki muharebe ve işgal sürüyor

**Deney:** Karaman ile Bizans arasında devam eden muharebe kuruldu; Karaman bir Bizans arazisini de kontrol ediyordu.
Osmanlı, ayrı bir barışla Karaman'ın bütün arazilerini ve şehirlerini aldı. Günlük `yikilanDevletleriTemizle` çalıştırıldı.

**Gerçekleşen:**

- Karaman–Bizans savaşı kaldırıldı (`savasta = false`).
- Karaman–Bizans muharebesi kaldırılmadı. Sonraki muharebe adımında gün 0 → 1, Karaman askeri **50.000 → 47.796** oldu.
- Bizans arazisinin kontrolü yıkılmış Karaman'da kaldı; sahibi Bizans, kontrolü Karaman.
- Mevcut `degismezler` bu tutarsızlıklara hata vermedi.

Kod: [yz-savas.ts](../../packages/sim/src/yz-savas.ts:198),
[baris.ts](../../packages/sim/src/baris.ts:82), [savas.ts](../../packages/sim/src/savas.ts:238).

**Neden:** Barış yalnızca o iki tarafın muharebelerini temizliyor; devlet yıkılınca diğer savaşları kaldıran yol aynı
muharebe/işgal temizliğini yapmıyor. Muharebe güncellemesi devam eden savaş kontrolü yapmıyor.
**Öneri:** Savaş sonlandırma temizliğini bütün sonlandırma yollarında tutarlı uygulamak; biten savaşa ait muharebe,
kuşatma, işgal hazırlığı ve askerî kontrolü sınamak. Artakalan orduların siyasi kaderi OPEN-024 ile ilgili ayrı konudur;
bu bulgu, savaş bittiği hâlde savaş işlemlerinin sürmesiyle sınırlıdır.

### H-03 — P2: Kayıt değiştirince aylık otomatik kayıt önceki dünyada kalabiliyor

**Tarayıcı deneyi:** Otomatik kayıt sıklığı “ayda bir” seçildi. A kaydı 1 Nisan'dan 8 Nisan'a ilerletildi; otomatik
kayıt hazinesi 9.400 idi. Aynı oturumda aynı tarihli, hazinesi 12.345 olan başka B kaydı dosyadan yüklendi ve haftalık
turla 8 Nisan'a ilerletildi.

**Gerçekleşen:** Ekranda **8 Nisan / 12.345**, otomatik kayıtta **8 Nisan / 9.400** kaldı; kayıt metni hiç değişmedi.

Kod: [main.ts](../../packages/istemci/src/main.ts:828), [main.ts](../../packages/istemci/src/main.ts:845).
**Neden:** `sonOtoDonem` yeni oyun/kayıt yükleme sırasında sıfırlanmıyor; eski dünyanın ayı yeni dünyanın kaydını bastırıyor.
**Öneri:** Otomatik kayıt dönemini oyun/kayıt değişiminde yeniden başlatmak; yıllık seçenek için de aynı geçişi sınamak.
Bu deney, ikinci dünya için hazırlanmış farklı hazine değeri kullandı; kullanıcı kayıtlarına dokunulmadı.

### H-04 — P2: Ayaklanmadaki liman gemi inşa edebiliyor

**Deney:** Hazırlanmış Selanik durumunda `ayaklanma=true`. Normal tarla inşası reddedilirken **1 kadırga** emri geçerli
kabul edildi. Gemi inşası 60 günlük süreden ilerleyip tamamlandı; günlükte “1 kadırga denize indirildi” yazdı.

Kod: [emirler.ts](../../packages/sim/src/emirler.ts:186), [deniz.ts](../../packages/sim/src/deniz.ts:114).
**Neden:** Gemi emri ve günlük tersane ilerlemesi ayaklanmayı denetlemiyor. Normal şehir inşaatında denetim var.
**Öneri:** DEC-0047'nin ayaklanmada inşaatın beklemesi kuralını tersaneye de bağlamak; hem yeni emir hem devam eden
inşaat için regresyon testi. Bu deney ayaklanmanın doğal oluşum süresini beklemeyen hazırlanmış durum deneyidir.

### H-05 — P2: Gemiye binen askerler bütçedeki toplam asker sayısından düşüyor

**Deney:** Osmanlı'nın 32.000 askerinden 20.000'i, doğrulanmış `cikarma` emriyle kapasitesi yeterli donanmaya bindirildi.
**Gerçekleşen:** Bütçe özeti asker sayısı **32.000 → 12.000**; gemide 20.000 asker var. Aylık gider 740 olarak sürüyor.
Askerler yok olmuyor; özet yanlış eksiltiyor.

Kod: [ekonomi.ts](../../packages/sim/src/ekonomi.ts:59), [ordu.ts](../../packages/sim/src/ordu.ts:14).
**Neden:** Maaş hesabı gemidekileri kapsıyor; `butceOzeti.askerSayisi` yalnızca `d.ordular` dizisini topluyor.
**Öneri:** Toplam asker sorgusuna taşınan orduları da katmak; binme, inme ve donanma kaybında tek sayım testi.

### H-06 — P2: Şehri alınca kendi casusunun isyan desteği kendi şehrini etkileyebiliyor

**Deney:** Bir devletin yabancı şehirde etkin isyan desteği varken şehir aynı devlete geçti.
**Gerçekleşen:** `disDestek` fetih öncesi ve sonrası **+25** dönüyor; kışkırtıcı devlet artık şehrin kendi sahibi.

Kod: [casusluk.ts](../../packages/sim/src/casusluk.ts:23), [istikrar.ts](../../packages/sim/src/istikrar.ts:51).
**Neden:** Etkin isyan desteği şehir ve bitiş tarihine göre aranıyor; kayıttaki hedef ile güncel sahip eşleşmesi kontrol edilmiyor.
Hazırlığı süren görevlerde sahiplik kontrolü var, başlamış etkide yok.
**Öneri:** Sahiplik değiştiğinde etkinin geçerliliğini güncel hedefe göre sınamak. Etkinin iptali veya üçüncü devlete devirdeki
kaderi netleştirilirken yeni bir kışkırtma yetkisi varsayılmamalı.

### H-07 — P2: Başka kayıttaki aynı kimlikli muharebe raporu otomatik açılmıyor

**Tarayıcı deneyi:** Karaman savaşından rapor kimliği 1 içeren hazırlanmış kayıt açıldı. Ardından farklı bir Eflak
savaşının kimliği 1 olan, henüz bitmemiş muharebesini içeren kayıt yüklendi; tur ilerletildi.

**Gerçekleşen:** Yeni **Eflak / Edirne / 2 Nisan 1453** zaferi rapor listesine geldi, fakat rapor penceresi açılmadı.
Önceki kaydın Karaman raporu yeni kaydın Eflak raporunu “görülmüş” saydırdı.

Kod: [main.ts](../../packages/istemci/src/main.ts:109), [main.ts](../../packages/istemci/src/main.ts:737),
[main.ts](../../packages/istemci/src/main.ts:828).
**Neden:** `gorulenRaporlar` dünya değişiminde temizlenmiyor; yalnızca yüklenen kaydın rapor kimlikleri ekleniyor.
**Öneri:** Görülen rapor kümesini önce temizleyip yüklenen dünyanın mevcut raporlarıyla kurmak; ayrı kayıtlar/yeni oyun
arasında kimlik çakışmasını test etmek. Rapor tamamen kaybolmuyor, listeden açılabiliyor.

## 3. Ek doğrulama ve test kapsamı bulguları

**K-01 — Kayıt doğrulama eksikliği:** Hazırlanmış bir dosyada oyuncu indeksi `0.5` yapılıp içerik özeti yeniden
hesaplandığında `yukle` kabul etti. `degismezler` oyuncu için aralık kontrolü yapıyor, tam sayı kontrolü yapmıyor.
Sonraki `devletler[oyuncu]` erişimleri tanımsız değer üretebilir. Bu değer normal arayüzden üretilmedi;
H-01 gibi kendiliğinden oluşan kayıt bozulmasıyla karıştırılmamalı.
Kod: [durum.ts](../../packages/sim/src/durum.ts:523).

**T-01 — Gerçek senaryo entegrasyon testinde hareket bağlamı yok:**
`senaryo-1453.test.ts` içindeki 10 yıllık döngü `turuIlerlet(d)` çağırıyor; hareket ağı içeren `Baglam` vermiyor.
Bu nedenle bu test AI'nin gerçek kara seferi ve savaş ilanı yollarını kapsamıyor. AI ekonomi/hanedan gibi başka yollar
çalışıyor; test “hiçbir şey sınamıyor” değildir. Hedefli savaş testleri de var, fakat aynı kapsamda değiller.
Kod: [senaryo-1453.test.ts](../../packages/sim/test/senaryo-1453.test.ts:17).

**T-02 — Mevcut değişmezler ilişki tutarlılığını bütünüyle sınamıyor:** H-02'de bitmiş savaşa ait muharebe ve yıkılmış
devletin kontrolü hata üretmedi. Başarılı değişmez denetimi, bütün oyun ilişkilerinin geçerli olduğunu göstermiyor.

**D-01 — Devir belgesinde güncel ve eski işler karışmış:** Üst başlık/ilk okunacaklar 7c derken en son paragraf 10b diyordu;
eski 7c commit ve 7d izin bekleyişleri de aktif iş gibi görünüyordu. Bu araştırma sonunda güncel bölüm düzeltildi,
eski notlar arşiv olarak korundu.

## 4. Çalıştırılan doğrulamalar

| Denetim | Sonuç |
|---|---|
| `npm test` | **25 dosya, 190 test geçti.** |
| `npm run typecheck` | Simülasyon ve istemci geçti. |
| `npm run build` | Geçti. |
| 5173 / ayrı Chrome profili | Tam ve yalnızca arazi içeren Osmanlı–Eflak barış sonuçları; gerçek panel metinleri. |
| 5173 / gerçek düğmeler | Edirne yönetici harcaması → bütçeyi 0 yapma → kayıt yazma; yazılan kaydın yüklemede reddi. |
| 5173 / dosyadan yükleme ve tur düğmeleri | Aynı ayda farklı dünyaya geçişte otomatik kaydın eski dünyada kalması; farklı savaş raporunda kimlik çakışması. |
| Hedefli simülasyon deneyleri | H-02, H-04, H-05, H-06 ve bozuk kayıt deneyi; üretim işlevleri çağrıldı. |
| Gerçek hareket ağıyla uzun deney | Tohum **21, 99, 1453**; her biri **120 aylık tur**, 1 Nisan 1453 → 1 Nisan 1463. |

Uzun deneyde her tur değişmezler, her 12 turda kayıt gidiş-dönüş özeti kontrol edildi. Üçünde de hata/özet farkı yoktu;
sonda sırasıyla 6, 4, 5 savaş açıktı. Bu pasif deneylerde H-02'nin özel üç devletli koşulu oluşmadı;
H-01/H-03/H-07 gibi kullanıcı geçişleri de bu döngüde yok. Genel deneyin geçmesi hedefli bulguları geçersiz kılmıyor.

Tarayıcı ilk başlatmada GPU kapalı olduğu için WebGL bağlamı oluşturamadı; ayrı test tarayıcısı yazılım WebGL ile
yeniden başlatıldı ve deneyler tamamlandı. Bu araç kurulum sorunu oyun kusuru sayılmadı. Deney betiklerindeki ilk hedef
kimliği/başlatma hataları düzeltilip yeniden çalıştırıldı; ürün hatası olarak sayılmadı.

Geçici kanıtlar `/tmp/tarihi-audit-*` altında: `probes.json`, `stress.json`, `eflak-full.png`,
`probes.js`, `more.js`, `eflak.js`, `budget-ui.js`, `autosave-ui.js`, `report-cache.js`.
Bu dosyalar geçicidir; bulgular ve tekrar üretme sonuçları bu raporda kalıcılaştırıldı.
Kullanıcının tarayıcı profili/kayıtları değiştirilmedi; 5173 kapatılmadı, 4175 kullanılmadı.

## 5. Eksikler ve açık kapsam

- AI–AI yeni ittifak, ileri diplomasi/vasallık, terhis, AI gemi inşası, kara ticareti, karşı istihbarat, isyanla bağımsızlık,
  vergi politikası ve mobil arayüz görev kartlarında zaten sonraya bırakılmış. Bunlar yeni keşfedilmiş yazılım hataları diye sayılmadı.
- Komutan, deneyim ve ayrıntılı birlik türleri MASTER_SPEC hedefleri arasında; mevcut kara ordusu esasen tek asker sayısı,
  moral ve tutumla çalışıyor. Bunları tamamlamak bug düzeltmesinden daha geniş bir kapsam kararı gerektirir.
- Şehir/arazi kaynakları ve pek çok ekonomik değer tahmini/prototip. Tarihî doğruluk için ayrıca kaynak incelemesi gerekir;
  bu çalışma tarihî araştırma veya yeni veri kaynağı seçimi yapmadı.
- Belgede Aşama 10c/10d hâlâ bekliyor. Kullanıcının “tüm görevleri bitirdim” ifadesi bu incelemede yeni bir yayın/commit iznine
  dönüştürülmedi; araştırma talebi önceliklendirildi.
- Kullanıcının **kendi Eflak kaydı** ve şehir devir seçimi bilinmiyor. Tam devirde isim hatası başka bir koşulla oluşuyorsa
  ayrıca takip edilecek; mevcut bulgu “kesinlikle şehir seçilmemiş” demiyor.

## 6. Önerilen düzeltme sırası — henüz uygulanmadı

1. **İlk paket:** H-01 kayıt yüklenebilirliği + H-02 savaş sonlandırma + UX-01 barışta geride kalan şehir/arazi açıklaması.
   Şehirleri otomatik devreden yeni mekanik eklemeden, hatalar ve ilhakın anlaşılabilirliği birlikte ele alınmalı.
2. **Kayıt/arayüz geçişleri:** H-03 ve H-07; K-01 doğrulaması; gerçek hareket ağıyla entegrasyon kapsamını güçlendirme.
3. **Sistem bağlantıları:** H-04 tersane/ayaklanma, H-05 taşınan asker toplamı, H-06 fetih sonrası casus etkisi.
4. Her pakette anlamlı regresyon testleri, `npm test`, `npm run typecheck`, `npm run build` ve 5173 tarayıcı doğrulaması.
   Üretim kodu düzeltme kapsamı ve commit/push için gerekli onaylar ayrı tutulur (AGENTS.md, DEC-0017).
