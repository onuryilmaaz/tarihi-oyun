# Aşama 8b — ticaret yolları (+ sol panel düzeni, kalyon teknolojisi): test raporu

- **Tarih:** 2026-10-29 · **Görev:** TASK-0011/8b · **Karar:** DEC-0051, DEC-0052
- **Otomatik:** 179 test (5'i 8b: liman geliri ve bütçe; abluka ve savaş denizi; ticaret geçidi; ambargo ve ilişki;
  şema 15→16). Kalyon için teknoloji şartı deniz testinde. `tsc`, derleme temiz.
- **Tarayıcı (5173):** sol panel yedi sekmede, hiçbir sekmede yatay taşma yok (ölçüldü: 0 px); üstte Osmanlı arması
  (hilal). Bütçe: "+ ticaret 40". Selanik: "Aylık ticaret geliri: 10 (taban 10, %100)". Karaman'a ambargo: oyunun onay
  penceresi → günlükte ambargo satırı. Hata yok, tarayıcı penceresi yok.

## Kullanıcı için test adımları (http://localhost:5173)

1. Sol panelin üstünde Osmanlı arması ve adı; altında sekmeler. Sekmeler arasında gezin; kayma olmamalı.
2. **Devlet** sekmesi → **Aylık bütçe**: gelir satırında "ticaret" görünür.
3. **Şehir** sekmesi → **Selanik → Şehri aç**: sağ panelde **Ticaret** satırı. **Tersane**'de kalyon "Kalyon İnşası gerekli"
   diye kapalıdır; **Teknoloji** penceresinde Askerî sütunda "Kalyon İnşası" kartı vardır (önce Büyük Top Dökümü).
4. Haritada bir devlete (ör. Venedik) tıklayın: sağ panelde arması; **Ambargo koy** → onaylayın → **Turu ilerlet**.
   O devletin size bakışında "Ambargo uyguluyor −20" çıkar; bütçede ticaretiniz biraz düşer.
5. İsterseniz Venedik'e savaş ilan edip donanmasını Ege'ye getirin: Ege limanlarınızın ticareti düşer ya da kesilir.
