# Aşama 3 — Siyasi Kontrol ve Hareket

**Durum:** ✔ KAPANDI — kullanıcı kendi tarayıcısında test etti ve onayladı (2026-10-29, DEC-0026)

## Tamamlanan işler (TASK-0006, DEC-0025)

| Çıktı | Yer |
|---|---|
| Hareket ağı (6.730 düğüm, 8.974 kenar, 6 boğaz geçidi), ETOPO 2022 engebesi | `araclar/ag-uret.mjs` → `veri/senaryo-1453/senaryo.json` |
| Ordu modeli, yol bulma, günlük hareket, tahmini varış ve gerekçe | `packages/sim/src/hareket.ts`, `durum.ts`, `emirler.ts`, `sistemler.ts` |
| Askerî kontrol / yasal sahip ayrımı (birim ve şehir ayrı) | `packages/sim/src/durum.ts` |
| Ordu işaretleri, sağ tıkla hedef, rota çizgisi, ordular paneli, işgal taraması | `packages/istemci/src/harita/gorunum.ts`, `main.ts` |
| Testler (39) | `packages/sim/test/hareket.test.ts` vb. |

## Kabul matrisi

| Ölçüt | Kanıt | Sonuç |
|---|---|---|
| Ordu serbest hedefe yürür | İstemci: Rumeli Ordusu sağ tıkla Bursa'ya; tahmin edilen günde (2 Mayıs 1453) vardı | ✔ |
| Mesafe ve koşullar süreyi değiştirir (AT-006) | Bursa→Bursa ili merkezi 2 gün; Bursa→Viyana 110 gün (1.795 km, 2 nehir, 1 boğaz) | ✔ |
| Mantıklı rota; denizden geçmez, boğazı geçitten geçer | Edirne→Bursa Çanakkale geçidinden (test + görsel) | ✔ |
| Tahmini varış ve gerekçe görünür | Ordular paneli: yol km, arazi ek km, nehir ve boğaz geçişleri | ✔ |
| Tur süresinden bağımsız varış, ışınlanma yok | Haftalık ve yıllık turlarda aynı varış günü ve aynı dünya durumu | ✔ |
| Erişim kuralı (DEC-0025/3) | Buda hedefi gerekçesiyle reddedildi; kara yolu olmayan hedef "Ulaşılamıyor" | ✔ |
| Toprak kontrolü değişmezleri (AT-007) | Şehrin askerî kontrolü değişince hiçbir arazi birimi değişmiyor; yasal sahip korunuyor | ✔ |
| Determinizm ve kayıt | Yürüyüş ortasında kaydet/yükle, durum özeti aynı | ✔ |

## Bilinen sınırlar ve devredilenler

- **Ağ ölçeği:** Düğümler modern il/eyalet parçalarıdır. Ordu önce bulunduğu parçanın merkezine,
  oradan komşu sınır orta noktalarına yürür; rotalar bu yüzden yer yer zikzak çizer. Kaza
  ölçeğinde birimlerle (DEC-0007) ağ yeniden üretilir; kod değişmez.
- **Denge değerleri [TASLAK]:** Hız 20 km/gün; nehir geçişi +15 km; boğaz geçişi +40 km; arazi
  zorluğu %100–250. Ordu türü, ikmal, mevsim ve yol ağı Aşama 4–5'te.
- **Yabancı ordular ve görünürlük:** Yok (DEC-0025/4); Aşama 4.
- **Gerçek işgal:** Bu aşamada yalnızca geliştirici komutuyla sınandı; savaşla Aşama 4'te gelecek.
- **Senaryo sürümü:** Hareket ağı eklendiği için senaryo kimliği ve kayıt şeması (2) değişti;
  önceki prototip kayıtları "eski sürüm" hatasıyla güvenli biçimde reddedilir.
- **Öresund:** Skåne 1453'te Danimarka'daydı; v0.2 haritasında İsveç'e atanmış (tahmin hatası,
  sonraki veri düzeltmesine not edildi).
