# Aşama 9a — ana menü, devlet seçimi, kayıt yuvaları: test raporu

- **Tarih:** 2026-10-29 · **Görev:** TASK-0012/9a · **Karar:** DEC-0055
- **Otomatik:** 184 sim testi (sim değişmedi), `tsc`, derleme temiz.
- **Tarayıcı (5173):** açılışta ana menü (Yeni oyun, Kayıt yükle, Kaynaklar); devlet seçiminde 132 kart; "vened" araması →
  Venedik Cumhuriyeti → **Bu devletle başla**: başlık "Venedik Cumhuriyeti · Doj Francesco Foscari · 80 yaşında · Katolik",
  hazine 3.400. **Kaydet → Yeni kayıt olarak kaydet** → listede görünür; **Yükle** listesi; Esc menüyü kapatır. Hata yok,
  tarayıcı penceresi yok.

**Sonuç:** Kullanıcı testi başarılı; kayıt silme onayının menü arkasında açılması düzeltildi (DEC-0056).

## Kullanıcı için test adımları (http://localhost:5173)

1. Sayfayı yenileyin: ana menü açılır. **Yeni oyun** → bir devlet arayın/seçin (ör. Venedik) → **Bu devletle başla**.
2. Sol panelin üstünde seçtiğiniz devletin arması ve hükümdarı; harita onun başkentine kayar.
3. Üstte **Kaydet** → adını değiştirebilirsiniz → **Yeni kayıt olarak kaydet**.
4. Birkaç tur oynayın, **Yükle** → kaydınızı **Yükle** (oyunun onay penceresiyle). Gereksiz kaydı **✕** ile silin.
5. **☰ Menü** → **Yeni oyun** ile başka bir devlete geçin; sayfayı yenileyince ana menüde **Devam et** son kaydınızı açar.
