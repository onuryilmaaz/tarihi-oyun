# Aşama 10a — kayıt güvenilirliği: test raporu

- **Tarih:** 2026-10-29 · **Görev:** TASK-0013/10a · **Karar:** DEC-0061
- **Otomatik:** 189 test (2 yeni: içerik özeti ile değiştirilmiş kaydın reddi, yarım yazılmış dosya, özetsiz eski kayıt; şema 3'ten
  bugüne bütün dönüşüm zincirinin geçerli ve oynanabilir dünya üretmesi). `tsc`, derleme temiz.
- **Tarayıcı (5173):** 3 haftalık tur → kayıt listesinde "Otomatik kayıt (son tur) 22 Nisan", "(1 tur önce) 15 Nisan", "(2 tur önce)
  8 Nisan". ⭳ ile `tarihi-1453-osmanlı-devleti-22-nisan-1453.json` indirildi; ⭱ Dosyadan yükle ile geri yüklendi (22 Nisan 1453).
  Yarım kesilmiş dosya "Kayıt dosyası okunamadı (bozuk JSON)" ile reddedildi. Hata yok.

**Sonuç:** Kullanıcı testi başarılı; otomatik kayıt sıklığı ayarı istendi (DEC-0062).

## Kullanıcı için test adımları (http://localhost:5173)

1. Bir oyun açın, **Hafta → Turu ilerlet**'e 3 kez basın.
2. **Yükle**: üç otomatik kayıt (son tur, 1 tur önce, 2 tur önce) görünür.
3. Bir kaydın yanındaki **⭳** ile dosyayı indirin (İndirilenler klasörüne).
4. **⭱ Dosyadan yükle…** ile o dosyayı seçin: oyun o kayıttan açılır ve listeye eklenir.
5. İsterseniz **Kaydet** penceresindeki **⭳ Dosyaya indir** ile o anki oyunu doğrudan indirin.
