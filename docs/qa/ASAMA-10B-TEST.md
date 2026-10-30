# Aşama 10b — hata yakalama ve kurtarma: test raporu

- **Tarih:** 2026-10-29 · **Görev:** TASK-0013/10b · **Karar:** DEC-0062
- **Otomatik:** 189 test (sim değişmedi), `tsc`, derleme temiz.
- **Tarayıcı (5173):** 2 haftalık tur → Ayar → **Test hatası**: "Arayüzde bir hata oluştu…", **Devam et** görünür. **Simülasyon hatası
  testi**: "Simülasyon bir hatayla durdu; dünya yarım kalmış olabilir…", Devam et gizli. **Hata raporunu indir**: sürüm 0.9.0, tarayıcı,
  ekran, oyun (Osmanlı · 15 Nisan 1453 · tur 2 · durum özeti), hatalar, son olaylar. **Son otomatik kayda dön**: "Yüklendi: Otomatik kayıt ·
  15 Nisan 1453"; ardından tur ilerledi (22 Nisan 1453). Hata yok.

## Kullanıcı için test adımları (http://localhost:5173)

1. Bir oyunda birkaç tur ilerletin. Sol panel **Ayar** → en altta **Geliştirici denemeleri** → **Simülasyon hatası testi**.
2. Açılan pencerede **Hata raporunu indir** (İndirilenler'e .txt), sonra **Son otomatik kayda dön**: oyun son tura döner, devam edebilirsiniz.
3. **Test hatası** ile arayüz hatasını deneyin: **Devam et** ile oyuna dönülür.
4. **Ayar → Otomatik kayıt**: "Oyunda ayda bir" seçip haftalık turlarla deneyin; otomatik kayıt yalnızca ay değişince alınır.
