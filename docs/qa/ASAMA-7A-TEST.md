# Aşama 7a — hükümdar ve veraset: test raporu

- **Tarih:** 2026-10-29 · **Görev:** TASK-0010/7a · **Karar:** DEC-0043
- **Otomatik:** 136 test (6'sı 7a: tablo ve kurgusal hükümdar yükleme; yetenek etkileri (gelir, muharebe gücü,
  diplomatik bakış); AI'da tarihî halef ve sonrasında kurgusal soy; tarihî halef doğmamışsa alternatif soy; oyuncu
  ölümünde tur durması, gelenek dışı seçim ve meşruiyet, seçim yapılmazsa divan; rastgele sayı akışının değişmemesi,
  kayıt/yükleme ve şema 10→11). `tsc`, derleme temiz.
- **Tarayıcı (5173):** hazır kayıtla (II. Mehmed öldü): sol panelde "Taht boş — Halefi seç"; pencerede II. Bayezid
  (tarihî halef, meşruiyet 90) ve iki kurgusal aday; "Tahta çıkar" → tur sonunda II. Bayezid tahta çıktı. Karaman
  panelinde "II. İbrahim Bey · 55 yaşında". Hata yok, tarayıcı penceresi yok.

**Sonuç:** Kullanıcı testi başarılı (DEC-0044).

## Kullanıcı için test adımları (http://localhost:5173)

1. Sayfayı yenileyin. Sol panelin en üstünde **Hükümdar**: II. Mehmed, yaşı, yetenekleri, tarihî halef II. Bayezid.
2. Haritada **Karamanoğulları**'na tıklayın: sağ panelde Hükümdar bölümü (II. İbrahim Bey).
   Tabloda olmayan bir devlete tıklayın: hükümdarın yanında **kurgusal** etiketi görünür.
3. **Yıl** → **Turu ilerlet**'e birkaç kez basın: büyük devletlerde ölüm ve tahta çıkışlar günlükte dünya haberi olur.
   II. Mehmed ölürse tur durur ve **Veraset** penceresi açılır (yaşa bağlı olasılık; uzun sürebilir).
