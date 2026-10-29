# Aşama 5c — teknoloji ağacı: test raporu

- **Tarih:** 2026-10-29 · **Görev:** TASK-0008/5c · **Kararlar:** DEC-0034, DEC-0035
- **Otomatik:** 109 test (7'si 5c: bedel/rezerv ve bitiş; ön koşul, iki yuva, farklı alan, hazine/borç yasağı;
  ekonomik etkiler; idari etkiler (süre, sur, sayım); askerî etkiler (toplama, Daimî Ordu gücü);
  Büyük Top ile surlara saldırı; kayıt/yükleme determinizmi ve şema 6→7 dönüşümü). `tsc` ve derleme temiz.
- **Tarayıcı (5173):** Teknoloji penceresi açıldı; 9 kart üç sütunda, ön koşulu eksik 3 kart kapalı ve nedeni
  yazılı. Daimî Ordu + Yargı Teşkilatı araştırıldı (oyunun kendi onay penceresiyle) → diğer kartlar
  "Aynı anda en çok 2 araştırma" ile kapandı; hazine 9.400 → 7.700 ayrıldı. 3 aylık turlarla Yargı
  29 Ağustos, Daimî Ordu 28 Eylül 1453'te tamamlandı (olay günlüğünde). JS hatası yok, tarayıcı penceresi yok.

## Kullanıcı için test adımları (http://localhost:5173)

**Sonuç:** Kullanıcı testi başarılı (DEC-0036).

1. Üst çubukta **Teknoloji** düğmesine basın. Üç sütun (Ekonomik, Askerî, İdari) görünmeli.
2. **Daimî Ordu** kartında **Araştır** → açılan pencerede **Araştır**. Kart "Emir bekliyor" olur;
   sol panelde **Araştırmalar** altında görünür. Askerî sütundaki diğer kartlar artık kapalıdır (aynı alan).
3. **Yargı Teşkilatı**'nı da başlatın. Artık bütün kartlar kapalı olmalı (en çok 2 araştırma).
4. **Esc** ile pencereyi kapatın. Üstte **3 Ay** → **Turu ilerlet**'e 2 kez basın.
5. Olay günlüğünde "… araştırması tamamlandı" satırları çıkmalı; Teknoloji penceresinde iki kart
   yeşil "✓ Biliniyor" olur, **Asker Kayıt Defterleri** ve **Bayındırlık Teşkilatı** açılır.
6. İsterseniz **Asker Kayıt Defterleri**'ni bitirin: sol paneldeki asker toplama bilgisinde süre 20 gün,
   bedel %25 daha az görünür.

## Değerler (hepsi [TASLAK], `packages/sim/src/denge.ts`)

Liste DEC-0035 / TASK-0008 tablosundaki gibidir. Ek olarak: 4. seviye tarla 2.000, 4. seviye pazar 2.600,
6. seviye sur 3.500 (Bayındırlıkla %25 indirimli 2.625).

## Bilinen sınırlar

- Yapay zekâ devletleri henüz araştırma yapmaz (Aşama 6).
- Yargı indirimi yalnızca yeni başlayan inşaatlara uygulanır; süren inşaat kısalmaz.
- Nüfus ve Vergi Sayımı, bittiği anda yasal sahibi olunan şehirlere bir defa eklenir.
