# Aşama 9c — oyun içi rehber ve sözlük: test raporu

- **Tarih:** 2026-10-29 · **Görev:** TASK-0012/9c · **Karar:** DEC-0057
- **Otomatik:** sim değişmedi (184 test); `tsc`, derleme temiz.
- **Tarayıcı (5173):** Yeni oyun → rehber kendiliğinden açıldı; 12 adım (Hoş geldiniz › Devletiniz › Zaman › Turu ilerletmek › Harita ›
  Harita modları › Sol panel › Ordular › Şehirler › Teknoloji › Kayıt › Hazırsınız), her adımda ilgili öğe vurgulu; sonda kapandı.
  Menü → Nasıl oynanır → sözlükte "abluka" araması iki terim buldu. Hata yok.

**Sonuç:** Kullanıcı testi: "gayet iyi" (DEC-0058).

## Kullanıcı için test adımları (http://localhost:5173)

1. Rehberi daha önce gördüyseniz: **☰ Menü → Nasıl oynanır → Adım adım rehberi başlat**. (İlk kez yeni oyun başlatınca kendiliğinden açılır.)
2. **İleri ›** ile adımları gezin; vurgulanan düğmeyi ve açıklamayı okuyun. **Rehberi kapat** ya da Esc ile istediğiniz an çıkın.
3. **Nasıl oynanır** sayfasında kısa kuralları okuyun; **Sözlük**'te bir terim arayın (ör. "meşruiyet", "abluka").
