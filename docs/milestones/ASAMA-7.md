# Aşama 7 — Hanedan, karakter, nüfus, kültür ve iç siyaset

**Durum:** ✔ KAPANDI — kullanıcı onayı (2026-10-29, DEC-0050). 7a–7d kabul edildi (DEC-0044, 0046, 0048, 0050).

**Çıktılar (MASTER_SPEC §22):** Tarihî karakterler, veraset, alternatif soy, nüfus grupları, göç, isyan riski ve yerel yönetim.

**Kabul:** Tarihî halef seçimi ve alternatif soy testleri geçer; nüfus tutarlı; isyan riski önceden görünür.

**Kapı:** Kullanıcı tarihî ve toplumsal derinliği onaylar.

## Alt adımlar

- **7a** — Hükümdar ve veraset.
- **7b** — Nüfus grupları, din/kültür, göç.
- **7c** — İstikrar ve isyan riski.
- **7d** — Yerel yönetim (şehir otomasyonu, OPEN-016).


## 7c — İstikrar ve isyan riski

- **Uygulama:** Tamamlandı; **kullanıcı kabulü:** bekleniyor. Aşama 7 kapısı kapanmadı.
- Şehir bazında 0–100 aylık risk, bileşenler ve önceki aya göre değişim; İstikrar haritası.
- Risk ≥50: uyarı ve yarım şehir/çevre geliri. Risk ≥80 üç ay: ayaklanma, gelir yok,
  asker toplama ve inşaat durur; oyuncu turu kesilir.
- Risk <50 veya iki aylık yeterli asayişle ayaklanma biter; bağımsız devlet/silahlı isyancı eklenmedi.
- Bağış aynı borçsuz emir kuyruğunu kullanır; AI aynı bedel ve kurallarla yardım eder.
- Şema 13; 12→13 dönüşümü eski para, nüfus, hanedan, ordu ve kuyrukları korur.
- **Doğrulama:** 158 test, tip kontrolü ve build başarılı. Chrome'da 5173 şehir paneli,
  bağış, harita, kayıt/yükle ve hazırlanmış kayıtta üç ay sonunda ayaklanma doğrulandı.
- Ayrıntılar ve denge sınırları: `docs/qa/ASAMA-7C-TEST.md`.
