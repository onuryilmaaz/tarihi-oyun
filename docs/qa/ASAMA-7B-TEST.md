# Aşama 7b — nüfus grupları, din/kültür, göç, iskân: test raporu

- **Tarih:** 2026-10-29 · **Görev:** TASK-0010/7b · **Karar:** DEC-0045
- **Otomatik:** 143 test (6'sı 7b: başlangıç grupları ve paylaştırma; orantılı çıkarma, eksi olmama, yıllık artış;
  kuşatmada kayıp ve en yakın güvenli şehre göç; iskân bedeli/süresi/sınırı ve toplamın korunması; din ilişki
  bileşeni; kayıt/yükleme ve şema 11→12). `tsc`, derleme temiz.
- **Tarayıcı (5173):** Edirne paneli: 40.000 kişi — Sünnî·Türk %55, Ortodoks·Rum %25, Ortodoks·Bulgar %15,
  Yahudi %5. Edirne → Bursa 2.000 kişi iskân: bedel 100, 60 gün sonra "Bursa şehrine iskân edildi". Din ve Kültür
  harita modları ve lejantları çalışıyor (Rumeli'de Ortodoks şehirler, Anadolu Sünnî). Hata yok, tarayıcı penceresi yok.

**Sonuç:** Kullanıcı testi başarılı (DEC-0046).

## Kullanıcı için test adımları (http://localhost:5173)

1. Sol panelde **Şehir yatırımları → Edirne → Şehri aç**. Sağ panelde **Nüfus** bölümü: renkli çubuk ve gruplar.
2. Aynı paneldeki **İskân**: 2000 yazın, hedef **Bursa**, **Taşı**. Sol panelde "İskân: Edirne → Bursa" satırı görünür.
3. Üstte **Din** düğmesine basın: harita baskın dine göre boyanır, solda lejant çıkar. **Kültür**'e basın: kültüre göre.
   Aynı düğmeye tekrar basınca siyasi haritaya döner.
4. **3 Ay → Turu ilerlet**: günlükte "2.000 kişi Bursa şehrine iskân edildi".
5. Bir devlete tıklayın: Diplomasi bölümünde "Aynı din" (+10) ya da "Farklı din" (−10) satırı görünebilir.
