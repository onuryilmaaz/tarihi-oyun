# Aşama 6c — AI savaş, sefer, kuşatma ve barış: test raporu

- **Tarih:** 2026-10-29 · **Görev:** TASK-0009/6c · **Kararlar:** DEC-0038, DEC-0040
- **Otomatik:** 129 test (6'sı 6c: gerekçeli savaş ilanı ve ateşkes/iyi ilişki/güçlü hedef engelleri; oyuncuya ilanda
  tur durması; AI ordusunun yürüyüp işgal etmesi ve kuşatması; AI-AI barış dayatması, toprak devri, ateşkes, dünya
  haberi; oyuncuya teklif → kabul/ret/süre dolması; kayıt/yükleme determinizmi ve şema 9→10). `tsc`, derleme temiz.
- **Uzun simülasyon (gerçek senaryo, 15 yıl):** yılda 0–4 yeni savaş; barışlarla toprak el değiştirdi (ör. Đại Việt ←
  Champa 6 arazi); 3 devlet yıkıldı; yıllık tur 0,3–0,7 sn; değişmez hatası 0. Bu tohumda AI Osmanlı'ya savaş açmadı.
- **Tarayıcı (5173):** hazır kayıtla (Karaman savaşı kaybediyor): Savaşlar listesinde "Gelen teklifi cevapla", oyunun
  kendi penceresi (Konya, Mersin, Karaman, Nevşehir, Kırşehir size geçer) → Kabul et → bir sonraki tur barış uygulandı.
  Yıllık turlarda AI savaş ilanları ve barışları günlükte dünya haberi olarak çıktı. Hata yok, tarayıcı penceresi yok.

## Kullanıcı için test adımları (http://localhost:5173)

1. Sayfayı yenileyin. Üstte **Yıl** → **Turu ilerlet**'e 2–3 kez basın.
2. Olay günlüğünde "… savaş ilan etti. Gerekçe: …" ve "… barış yaptı: … arazi … geçti" gibi dünya haberlerini görün.
   **Diplomasi** düğmesiyle haritaya bakın; sınırlar zamanla değişebilir.
3. Karaman'a savaş ilan edin, Anadolu Ordusu'yla Larende'ye yürüyüp kuşatın (4c adımları). Karaman ordusu daha
   zayıfsa başkentini savunur. Savaşı kazanırsanız ~6 ay sonra Karaman size **barış teklifi** gönderir: tur durur,
   pencereden Kabul / Reddet / Sonra seçin. Sonra karar verirseniz Savaşlar listesinde "Gelen teklifi cevapla" düğmesi kalır.

## Bilinen sınırlar

- AI kendi aralarında ittifak kurmuyor (yalnızca başlangıç ittifakları ve oyuncu teklifleri); savaş ilanında
  müttefikler çağrılıyor.
- AI'nın asıl ordusu başkentte toplanmış tek ordu; birden çok cephe planlaması yok.
- Denge değerleri [TASLAK]; ilişki/güç eşikleri uzun oyunlarda ayarlanacak.
