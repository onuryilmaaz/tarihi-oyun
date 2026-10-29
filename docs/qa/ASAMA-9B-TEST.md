# Aşama 9b — tarihî nüfus, arazi verimi ve denge: test raporu

- **Tarih:** 2026-10-29 · **Görev:** TASK-0012/9b · **Karar:** DEC-0056
- **Otomatik:** 184 test, `tsc`, derleme temiz. Şema 17→18 dönüşümü (verim 10).
- **Veri:** 193 şehir tahmini nüfusu (toplam ~6,6 milyon kent nüfusu; ör. Pekin 600.000, Nankin 400.000, Kahire 200.000,
  Paris 150.000, Venedik 100.000, Konstantiniyye 45.000, Edirne 30.000). Arazi verimi: 1.373 ova (12), 1.262 engebe (10),
  650 dağ (9), 352 sarp (7).

**Sonuç:** Kullanıcı testi: "biraz durağan ama okey" (DEC-0057).

## 50 yıllık otomatik simülasyon (gerçek senaryo, tohum 21, oyuncu Osmanlı pasif, yıllık tur)

| Yıl | Yaşayan devlet | Açık savaş | 5 yılda açılan | Eksi hazine | Ayaklanma | En büyükler (arazi; başlangıç) |
|---|---|---|---|---|---|---|
| 1458 | 123 | 4 | 40 | 2 | 0 | Memlûk 111 (110), Macaristan 97 (93) |
| 1468 | 121 | 3 | 9 | 2 | 0 | Memlûk 117, Macaristan 107 |
| 1478 | 120 | 3 | 9 | 3 | 0 | Macaristan 109, Karakoyunlu 90 (64) |
| 1488 | 118 | 3 | 7 | 3 | 0 | Macaristan 117, Karakoyunlu 99 |
| 1503 | 115 | 2 | 5 | 3 | 0 | Macaristan 131, Memlûk 117, Karakoyunlu 109 |

Yıllık tur ~0,6 sn; değişmez (tutarlılık) hatası 0. İlk denemede dünya durağandı (büyük devletler hiç büyümüyordu); "fırsatçı
fetih" kuralıyla düzeldi. İlk yıllardaki savaş dalgası müttefik çağrılarını da içerir.

## Kullanıcı için test adımları (http://localhost:5173)

1. **Yeni oyun** → Osmanlı. Edirne'nin panelinde nüfus artık 30.000; Bursa 35.000; Konstantiniyye (Bizans) 45.000.
2. **Devlet** sekmesi → **Aylık bütçe**: arazi geliri arazi verimine göre değişti.
3. **Yıl → Turu ilerlet**'e 5–10 kez basın: günlükte AI savaşları ("Gerekçe: fırsat …" ya da "kötü ilişki …") ve barışlar; Diplomasi
   haritasında sınırların değiştiğini görün.
