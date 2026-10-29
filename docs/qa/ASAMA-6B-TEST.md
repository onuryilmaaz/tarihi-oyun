# Aşama 6b — AI ekonomi ve ordu hazırlığı: test raporu

- **Tarih:** 2026-10-29 · **Görev:** TASK-0009/6b · **Karar:** DEC-0039
- **Otomatik:** 122 test (5'i 6b: barışta araştırma/yatırım ve yedeğin korunması; parası yetmeyen devletin hiçbir şey
  yapmaması; oyuncu devletine karar verilmemesi ve başka devlet adına emir verilememesi; savaşta tehdit ve asker
  toplama; yıllık toplu dünya özeti; kayıt/yükleme ve tur süresinden bağımsız sonuç; şema 8→9). `tsc`, derleme temiz.
- **Uzun simülasyon (gerçek 1453 senaryosu, 10 yıl):** yıllık tur ~0,2 sn; değişmez hatası 0; tarla+pazar seviyeleri
  184 → 692; ilk yıl 178 inşaat, 112 araştırma. **59 devlet eksi aylık bütçeyle kaldı** (aşağıdaki bulgu).
- **Tarayıcı (5173):** "Yıl" turu ~0,25 sn; günlükte "1454 yılında dünyada: 89 yeni inşaat, 53 araştırma…". Hata yok.

## Bulgu — küçük devletlerin bütçesi

Aşama 4'teki garnizon ordusu taslak formülü (2.000 + arazi başına 300 asker) küçük devletler için gelirden pahalı:
başlangıçta 132 devletin 71'i ayda eksi veriyor, hazineleri eriyor ve AI hiçbir şey yapamıyor. **Karar (DEC-0040):** sabit 2.000 kaldırıldı → eksi bütçeli başlangıç 0. Kullanıcı testi başarılı.

## Kullanıcı için test adımları (http://localhost:5173)

1. Üstte **Yıl** → **Turu ilerlet**'e 2 kez basın.
2. Olay günlüğünde "… yılında dünyada: N yeni inşaat, M araştırma …" satırını görün.
3. Tek tek AI kararları size gösterilmez (bilgi asimetrisi, AT-013); yalnızca yıllık toplam görünür.
