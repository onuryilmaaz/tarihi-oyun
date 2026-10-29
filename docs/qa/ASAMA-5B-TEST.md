# Aşama 5b — şehir yatırımları: test raporu

- **Tarih:** 2026-10-29 · **Görev:** TASK-0008/5b · **Karar:** DEC-0033
- **Otomatik:** 101 test (6'sı 5b: bedel/rezerv, gerekçeli retler, süre ve gelir, sur, kuşatmada durma ve el değiştirince iptal, kayıt ve şema 5→6 dönüşümü); `tsc` ve derleme temiz.
- **Tarayıcı (5173):** Edirne → Tarla geliştir → bedel 300 ayrıldı (kullanılabilir 9.400 → 9.100) → 60 gün sonra (31 Mayıs 1453) Tarla 1. seviye → aylık gelir 940 → 955, net +300 → +315; hazine 1 Temmuz'da 10.030. JS hatası yok, tarayıcı penceresi yok.

## Kullanıcı için test adımları (http://localhost:4175, sayfayı yenileyin)

1. Sol panelde **Şehir yatırımları** → listeden **Edirne**'yi seçin → **Şehri aç**.
2. Sağdaki panelde **Şehir yatırımları** bölümünde **Tarla** satırındaki **Geliştir**'e basın.
3. Sol paneldeki **Aylık bütçe özeti**'nde "Emirlere ayrılan 300" görünmeli.
4. Üstte **Ay** → **Turu ilerlet**'e 2–3 kez basın. Sol panelde kalan gün azalır; bitince olay günlüğünde "Tarla 1. seviyeye yükseldi" yazar.
5. Bütçe özetinde "yapılar 15" ve aylık farkın 15 arttığını görün.
6. İsterseniz **Sur** geliştirin (kuşatmayı zorlaştırır) ya da hazineniz yetmeyecek bir yatırım deneyin: düğme kapalı olur, üstüne gelince nedeni yazar.

## Değerler (hepsi [TASLAK], `packages/sim/src/denge.ts`)

| Yapı | Seviye bedeli (1 / 2 / 3) | Süre | Etki |
|---|---|---|---|
| Tarla | 300 / 600 / 1.200 | 60 gün | Seviye başına aylık +15 |
| Pazar | 400 / 800 / 1.600 | 90 gün | Seviye başına aylık +20 |
| Sur | 2.: 800 · 3.: 1.200 · 4.: 1.800 · 5.: 2.500 | 120 gün | Kuşatmada gereken güç artar (en çok 5) |

Kurallar: şehir başına aynı anda tek inşaat; kuşatma altında iş durur; şehir el değiştirirse
inşaat iptal olur ve bedel geri verilmez; yapılar şehirle birlikte kalır (barışla el değiştirirse yeni sahibine geçer).
