# TASK-0007 / 4b test raporu

Tarih: 2026-10-29. Agent: Codex. Gereksinimler: MASTER_SPEC §8.2, §8.6–8.7, §11.2;
DEC-0002, DEC-0027/4, DEC-0029. Kullanıcı kabulü alındı: “test ettim başarılı” (2026-10-29, DEC-0030).

## Otomatik kontroller

- `npm test`: 10 dosyada 64 test başarılı. Yeni `ordu.test.ts`: 15 davranış testi.
- `npm run typecheck`: sim ve istemci başarılı.
- `npm run build`: başarılı; 4175 önizlemesinin dosyaları güncellendi.
- Davranış kapsamı: tur dışında değişmeme, ortak bütçe ve insan gücü rezervasyonu,
  geçersiz miktar/kontrol, tur başında yeniden doğrulama, toplama süresi ve işgalde bekleme,
  zorunlu maaş/eksi bakiye, moral toparlanması, ikmal aşınması ve sıfır asker,
  bölme/birleştirme asker ve moral tutarlılığı, aynı kalan maaş, çakışan emirler,
  toplama ortasında kayıt, şema 3 dönüşümü, farklı tur sürelerinde aynı sonuç.

## Chrome denemeleri (5173)

Ayrı, geçici Chrome profili kullanıldı; kullanıcının kayıtlarına ve mevcut tarayıcısına dokunulmadı.
Chrome DevTools Protocol ile oyunun düğmeleri ve harita etkileşimleri kullanıldı.

1. Osmanlı, Bursa, 500 asker: emir bekliyor → bir hafta sonra 23 gün kaldı →
   beş hafta sonunda Bursa Ordusu (500 asker). Yeni ordu şehir koordinatında kurulur.
2. Toplama başladıktan sonra manuel kayıt alındı; toplama ve ordu işlemleri bitince kayıt
   yüklendi: yeniden 23 gün kaldı, başlangıçtaki iki ordu, harcanmış insan gücü korundu.
3. Rumeli Ordusu: 20.000 → 19.000 + 1.000 → tekrar 20.000. Bölme ve birleştirme
   emirleri turun başında uygulandı, bekleyen işlem sırasında ikinci düzenleme engellendi.
4. `?devlet=biz`: üç aylık tur sonunda hazine −8, aylık maaş 46; toplama düğmesi kapalı,
   maaş aksaması açıklaması görünür. Bir hafta sonra moral %100 → %79.
5. Osmanlı, Karaman'a savaş ilanı ve Anadolu Ordusu ile haritadaki düşman ordu işaretine
   sağ tıkla yürüyüş: düşman toprağına varınca ikmal %0, moral %93 ve aşınma gerekçesi görüldü.
6. Bu denemelerde yakalanan JavaScript çalışma zamanı hatası yok.

## Kullanıcı için kısa deneme (4175)

1. Sayfayı yenile. Solda **Asker toplama** altında **Edirne**, **1000** seç;
   **Asker topla**'ya bas. Emir bekliyor görünmeli.
2. Üstte **Ay**, ardından **Turu ilerlet**'e bas. 30 gün geçtiğinde **Edirne Ordusu**
   listede görünmeli. **Ordu giderleri** altında aylık maaşı gör.
3. **Rumeli Ordusu**'nu seç; **Ayrılacak asker** alanına **1000** yaz; **Orduyu böl**,
   sonra **Turu ilerlet**. Ayrılan ordu listede görünmeli.
4. Rumeli seçiliyken **Aynı konumdaki ordu** listesinden ayrılan birliği seç;
   **Birleştir**, sonra **Turu ilerlet**. Rumeli yeniden 20.000 asker olmalı.
5. Seçili ordu detayında **İkmal %100** ve gerekçesini gör. Karaman seferini denersen
   düşman toprağında ikmal azalır; asker/moral kaybı açıklanır.

Not: Eski bir kayıttan devam ediyorsan ordu ve şehir havuzu mevcut durumuna göre değişir.
İnsan gücü ve oranlar TASLAK; havuz bu sürümde kendiliğinden yenilenmez.
