# Aşama 5 — Ekonomi, şehirler ve teknoloji

**Durum:** Başlandı (DEC-0032). TASK-0008 / 5a tamamlandı; kullanıcı testi 4c ile birlikte.
5b/5c önerisinin yanıtı bekleniyor. Aşama 4 resmî kabulü açık; kullanıcı test beklemeden
ilerleme izni verdi. Aşama 5 kapısı henüz değerlendirilmedi.

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
