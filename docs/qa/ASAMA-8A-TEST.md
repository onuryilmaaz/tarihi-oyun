# Aşama 8a — donanma ve deniz kontrolü: test raporu

- **Tarih:** 2026-10-29 · **Görev:** TASK-0011/8a · **Karar:** DEC-0051
- **Otomatik:** 173 test (7'si 8a: başlangıç donanmaları/limanlar/kontrol ve bakım gideri; gemi inşası (kalyon dahil);
  bölge hareketi ve hız; deniz muharebesi, çekilme/batma, tur durması; düşman kontrolündeki boğazın kapanması ve deniz
  ablukası; çıkarma (kapasite, gemide maaş, hedef limana iniş); kayıt/yükleme ve şema 14→15). `tsc`, derleme temiz.
- **Tarayıcı (5173):** Osmanlı Donanması (100 kadırga) Marmara'da işaretli; yabancı donanmalar yaklaşık sayıyla (~10, ~15).
  Panel: Ege'ye yelken → 4 gün sonra "Ege Denizi bölgesine vardı". Gelibolu tersanesinde 5 kadırga emri (−300, 60 gün).
  Hata yok, tarayıcı penceresi yok.

**Sonuç:** Kullanıcı testi başarılı (DEC-0052).

## Kullanıcı için test adımları (http://localhost:5173)

1. Sol panelde **Donanmalar** → **Osmanlı Donanması**'na tıklayın (haritada Marmara'da ⚓ 100 işareti de seçer).
2. Panelde **Yelken aç** listesinden **Ege Denizi**'ni seçin → **Yelken aç** → **Hafta → Turu ilerlet**. Donanma Ege'ye geçer.
3. **Şehir yatırımları → Gelibolu → Şehri aç** → **Tersane**: Kalyon seçin, adet 2 → **Gemi yap**.
4. Çıkarma denemesi: Rumeli Ordusu'nu Gelibolu'ya yürütün; donanma Marmara'dayken panelde **Çıkarma** → ordu ve hedef liman
   (ör. savaşta olduğunuz bir devletin limanı) → **Çıkarma yap**. Ordu gemiye biner, hedefte karaya çıkar.
5. İsterseniz Venedik'e savaş ilan edip donanmayı Adriyatik'e gönderin: deniz muharebesinde tur durur.
