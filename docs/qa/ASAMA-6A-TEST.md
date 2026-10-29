# Aşama 6a — ilişkiler, ittifak, hediye, diplomasi haritası: test raporu

- **Tarih:** 2026-10-29 · **Görev:** TASK-0009/6a · **Karar:** DEC-0038
- **Otomatik:** 116 test (6'sı 6a: başlangıç tablosu; ittifak ret/kabul ve bozma; hediye rezerv/aktarım/sınır/sönüm;
  savaş ilanında saldırganlık ve müttefik çağrısı (uyma/ret); komşu kaygısı ve saldırganlığın iki kat algılanması;
  kayıt/yükleme determinizmi ve şema 7→8). `tsc` ve derleme temiz.
- **Tarayıcı (5173):** Karamanoğulları paneli: size bakışı −75 (tarih −50, güçlü komşu kaygısı −25); 300 hediye →
  +15, bakış −60. Dulkadiroğulları: bakışı +5 (tarih +30, kaygı −25); ittifak teklifi turda gerekçeyle reddedildi
  ("en az 25 gerekir"). Diplomasi harita modu ve lejant çalışıyor. Tarayıcı penceresi yok, JS hatası yok.

## Kullanıcı için test adımları (http://localhost:5173)

1. Haritada **Karamanoğulları**'na tıklayın. Sağ panelde **Diplomasi** bölümünü görün: size bakışı ve nedenleri.
2. **Dulkadiroğulları**'nı seçin (Elbistan'a tıklayıp üstteki "Dulkadiroğulları" bağlantısına basabilirsiniz).
   "Tahmini cevap: ret — en az 25 gerekir" yazmalı.
3. Hediye kutusuna **400** yazıp **Hediye gönder** → onaylayın. **Hafta → Turu ilerlet**. Bakışı yaklaşık +25'e çıkar
   ve tahmini cevap **kabul** olur.
4. **Savunma ittifakı teklif et** → **Turu ilerlet**. Günlükte "kabul etti" yazmalı; panelde "Savunma ittifakınız var".
5. Üstte **Diplomasi** düğmesine basın: harita ilişkilere göre boyanır (siz sarı, müttefik yeşil, savaştakiler kırmızı).
6. İsterseniz Karaman'a savaş ilan edin: onay penceresi saldırganlık uyarısı verir; sonra diğer devletlerin size
   bakışında "Saldırganlığı" satırı belirir (komşularda iki kat).
