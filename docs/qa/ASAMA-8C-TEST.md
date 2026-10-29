# Aşama 8c — casusluk: test raporu

- **Tarih:** 2026-10-29 · **Görev:** TASK-0011/8c · **Karar:** DEC-0051, DEC-0053
- **Otomatik:** 184 test (4'ü 8c: doğrulama/eş zamanlı sınır/bedel; askerî istihbaratla uzaktaki ordunun kesin sayıyla
  görünmesi ve yakalanınca ilişki bedeli; isyan desteğinin risk bileşeni ve sabotajın inşaat gecikmesi; kayıt/yükleme ve
  şema 16→17). `tsc`, derleme temiz.
- **Tarayıcı (5173):** Karaman'a askerî + diplomatik istihbarat → 3 ay sonra Savaş sekmesinde "👁 … 119 gün"; haritada Karaman
  orduları "2.100 👁", "1.400 👁"; Karaman panelinde istihbarat raporu (en düşmanca: Osmanlı −62; hazine ≈ 200). Hata yok.

**Sonuç:** Kullanıcı testi başarılı (DEC-0054).

## Kullanıcı için test adımları (http://localhost:5173)

1. Haritada **Karamanoğulları**'na tıklayın. Sağ panelin altında **Casusluk**: "Askerî istihbarat" → **Görevi başlat**.
   Sonra "Diplomatik istihbarat" → **Görevi başlat** (en çok 2 görev).
2. Sol panelde **Savaş** sekmesi → **Casusluk** listesinde iki görev.
3. **3 Ay → Turu ilerlet**. Başarılı olursa: Karaman orduları haritada kesin sayı ve 👁 ile görünür; Karaman panelinde
   **İstihbarat raporu** (müttefikleri, savaşları, kime nasıl baktığı, hazinesi). Başarısız olursa günlükte yazar; casus
   yakalanırsa Karaman'ın size bakışında "Yakalanan casus −30" çıkar.
4. İsterseniz bir düşman şehrine **İsyanı destekleme** ya da **Sabotaj** deneyin (şehir listesinden seçin).
