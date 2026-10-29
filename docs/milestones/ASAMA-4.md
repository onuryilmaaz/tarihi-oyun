# Aşama 4 — Savaş, Kuşatma ve Barış

**Durum:** Sürüyor — 4a tamamlandı, kullanıcı testi bekliyor; 4b ve 4c sırada (DEC-0027/4)

## 4a — Savaş ilanı, yabancı ordular, görünürlük, muharebe, moral, geri çekilme

| Çıktı | Yer |
|---|---|
| Savaş durumu, savaş ilanı emri; savaşta erişim kuralı açılır | `packages/sim/src/savas.ts`, `emirler.ts`, `hareket.ts` |
| Garnizon orduları (her devlete başkentinde; [TASLAK] büyüklük formülü) | `packages/sim/src/durum.ts` |
| Görünürlük: kendi toprakları + komşuları + ordu çevresi (2 düğüm); yaklaşık büyüklük | `savas.ts` → `gorunurYabanciOrdular` |
| Muharebe: günlük turlar (en çok 5 gün), sayı × moral × arazi, ±%15 şans, takip, dağılma | `savas.ts` |
| Moral ve tutum (temkinli / dengeli / inatçı), geri çekilme en yakın kendi şehrine | `savas.ts`, `denge.ts` |
| Denge değerleri tek dosyada [TASLAK] | `packages/sim/src/denge.ts` |
| İstemci: yabancı ordu işaretleri, savaş ilanı, tutum, moral, savaşlar listesi, muharebe raporu penceresi | `packages/istemci/` |

### Kabul (4a)

| Ölçüt | Kanıt | Sonuç |
|---|---|---|
| AT-008: muharebe otomatik çözülür; kayıp, moral, geri çekilme raporlanır | `savas.test.ts`; tarayıcıda Karaman muharebesi raporu | ✔ |
| Savaş nedenleri raporlanır | Rapor: sayı üstünlüğü, arazi, moral farkı, eşik, takip | ✔ |
| Yenilgi ve geri çekilme işler | Kaybeden en yakın kendi şehrine çekilir; çok zayıfsa dağılır | ✔ |
| Oyuncunun muharebesi turu durdurur (DEC-0006) | Test + tarayıcı kesinti penceresi | ✔ |
| AT-013: görünmeyen ordu ve kesin büyüklük istemciye gitmez | `savas.test.ts`; Worker yalnızca görünen yabancı orduyu yaklaşık sayıyla gönderir | ✔ |
| Determinizm; muharebe ortasında kayıt/yükleme | `savas.test.ts` | ✔ |

### Bilinen sınırlar (4a)

- Karşılaşma yalnızca aynı düğümde algılanır; aynı kenarda karşıdan gelen iki ordu düğüme varınca savaşır.
- Yabancı ordular yerinde savunur (DEC-0027/1); gerçek AI Aşama 6'da.
- Muharebe yeri adı modern il adıdır (prototip verisi).
- Kayıt şeması 3: önceki kayıtlar güvenli biçimde reddedilir.
