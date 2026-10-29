# Aşama 9e — performans ve erişilebilirlik: test raporu

- **Tarih:** 2026-10-29 · **Görev:** TASK-0012/9e · **Karar:** DEC-0059
- **Otomatik:** 187 test, `tsc`, derleme temiz (paket uyarısı yalnızca three.js için sınır 600 kB'a çekildi).

## Performans (üretim derlemesi, geçici `vite preview`, Chrome masaüstü, 1470×810 @2x, gerçek 1453 senaryosu)

| Ölçüm | Sonuç |
|---|---|
| İlk açılış (oynanabilir) | ~930 ms (yerel sunucu) |
| Tur: 1 hafta / 1 ay / 3 ay / 1 yıl | 309 / 349 / 473 / ~930 ms (simülasyon 29 / 74 / 208 / ~665 ms) |
| Harita kare hızı | 60 kare/sn boşta ve sürüklerken |
| JS belleği | ~105 MB |
| Paket | oyun kodu 116 kB (gzip 43 kB), three.js 551 kB (gzip 137 kB), simülasyon işçisi 123 kB; harita verisi 4,6 MB + senaryo 1,2 MB (JSON) |

## Erişilebilirlik ve küçük ekran

- Ayar → **Arayüz boyutu** %130: üst çubuk, sol panel ve pencereler büyür, ekrandan taşma yok (ölçüldü).
- 900×700 ekranda: üst çubuk iki satır, sol panel altından başlar; taşma yok.
- Sekmelerde ← → çalışıyor; Tab ile gezinmede altın odak çizgisi; Esc menü/rehber/teknoloji pencerelerini kapatır.
- Mobil arayüz DEC-0013 gereği kapsam dışı.

**Sonuç:** Kullanıcı testi başarılı; sekmelerde ← → tuşlarının haritayı da kaydırması düzeltildi (DEC-0060).

## Kullanıcı için test adımları (http://localhost:5173)

1. Sol panel **Ayar** sekmesi → **Arayüz boyutu** %115 ya da %130 seçin; paneller büyür. Beğendiğinizde öyle kalır (hatırlanır).
2. Tarayıcı penceresini daraltın: üst çubuk iki satıra iner, paneller üst üste binmez.
3. Sol panel sekmesine tıklayıp ← → tuşlarıyla sekmeler arasında gezin; Tab ile düğmeler arasında dolaşın.
