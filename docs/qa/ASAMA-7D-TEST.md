# Aşama 7d — yerel yönetim: test raporu

- **Tarih:** 2026-10-29 · **Görev:** TASK-0010/7d · **Karar:** DEC-0049 (OPEN-016 ilk kapsam, MASTER_SPEC §11.5)
- **Otomatik:** 165 test (6'sı 7d: varsayılan kapalı/bütçe 0 ve ayar doğrulama; aylık tavan ve günlük kaydı; hazine alt
  sınırı ve eksi hazinede harcamama; oyuncunun emrine öncelik; önce bağış sonra yatırım, yetki dışı iş yok; aylık sistem,
  kayıt/yükleme ve şema 13→14). `tsc`, derleme temiz.
- **Tarayıcı (5173):** Edirne ve Bursa'da yönetici açıldı, tavan 700: 1 Mayıs 1453'te iki tarla (300 + 300), "Bu ay
  harcanan: 600 / 700", günlükte iki "Yerel yönetici: … Tarla yatırımı, −300" satırı. Hata yok, tarayıcı penceresi yok.

**Sonuç:** Kullanıcı testi başarılı (DEC-0050).

## Kullanıcı için test adımları (http://localhost:5173)

1. Sol panelde **Şehir yatırımları → Edirne → Şehri aç**. Sağ panelde **Yerel yönetici: Kapalı — aç** düğmesine basın.
   Aynısını **Bursa** için yapın.
2. Sol panelde **Yerel yönetim** bölümünde **Aylık bütçe tavanı**'na 700 yazın → **Ayarı uygula**.
3. **Ay → Turu ilerlet**. Günlükte "Yerel yönetici: … Tarla yatırımı, −300" satırları; sol panelde "Bu ay harcanan: 600 / 700".
4. Tavanı 0 yapın ya da yöneticiyi kapatın: sonraki ay harcama olmaz. **Hazine alt sınırı**'nı hazinenizden yükseğe
   koyarsanız da harcama olmaz.
