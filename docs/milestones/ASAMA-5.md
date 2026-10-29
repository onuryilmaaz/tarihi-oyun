# Aşama 5 — Ekonomi, şehirler ve teknoloji

**Durum:** ✔ KAPANDI — kullanıcı onayı (2026-10-29, DEC-0037). 5a, 5b, 5c test edildi ve kabul edildi
(DEC-0034, DEC-0036, DEC-0037). Kabul ölçütündeki "şehir yönetimi otomasyona devredilebilir" maddesi
kullanıcı kararıyla Aşama 7'deki yerel yönetim kapsamına ertelendi (OPEN-016).

## 5a — Mevcut bütçenin görünürlüğü

- Simülasyondan mevcut hazine, emir rezervasyonu, kullanılabilir para, aylık test geliri,
  ordu maaşı ve mevcut durumla aylık fark hesaplanıyor.
- Gelir hesabı `ekonomi.ts` üzerinden hem aylık sistem hem özet tarafından kullanılıyor.
- Yeni ekonomi kuralı/formül veya denge değeri eklenmedi; kayıt şeması 5 olarak kaldı.
- İstemci “Ordu giderleri” altında açılır bütçe özeti gösteriyor; prototip gelir ve tek
  seferlik işlemlerin aylık farka dahil olmadığı açıkça yazıyor.
- 94 test, tip kontrolü, build başarılı. Chrome'da rezervasyon ve ay başı hesabı doğrulandı.
- Kanıt ve birlikte test önerisi: `docs/qa/ASAMA-5A-TEST.md`.
- **Kabul:** Kullanıcı testi bekleniyor; tamamlandı ifadesi uygulama içindir.

## Bekleyen kapsam kararları

Kullanıcıya önerildi, yanıt henüz yok:
1. 5b için ilk şehir yatırımları: tarım, pazar, sur; 5c için küçük ağaç ve iki paralel alan.
2. Alternatif tercih: önce yalnızca ekonomi.

Bu genel öneri OPEN-010/011/016'nın tüm ayrıntılarını karara bağlamaz. Bina/araştırma
etkileri, maliyetleri, üretim ve yönetici bütçe yetkisi ayrı somut öneriyle netleştirilmeli.
