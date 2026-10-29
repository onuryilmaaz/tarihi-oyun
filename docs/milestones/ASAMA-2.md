# Aşama 2 — Tur ve Dünya Durumu Çekirdeği

**Durum:** ✔ KAPANDI — kullanıcı onayı: "onaylıyorum" (2026-10-29, DEC-0024)

## Tamamlanan işler

| Çıktı | Yer |
|---|---|
| Simülasyon çekirdeği (saf TypeScript) | `packages/sim/src/` |
| Testler (30) | `packages/sim/test/` |
| Oyun istemcisi (harita + tur arayüzü + kayıt) | `packages/istemci/` |
| 1453 senaryo verisi | `veri/senaryo-1453/` (`npm run senaryo` ile üretilir) |
| Mimari kararlar | ADR-0002, DEC-0023 |

## Kabul matrisi

| Ölçüt (MASTER_SPEC §22 / TASK-0005) | Kanıt | Sonuç |
|---|---|---|
| Aynı başlangıç + aynı emirler = aynı sonuç | `determinizm.test.ts`; 1453 senaryosunda 10 yıl | ✔ |
| Tur dışı ilerleme yok (AT-004) | `tur.test.ts`; istemcide dünya yalnızca "Turu ilerlet" ile değişir | ✔ |
| Tur süresinden bağımsız sonuç (AT-005) | 1 yıl = 12 ay = 4 çeyrek = 52 hafta + 1 gün | ✔ |
| Kritik olayda tur durur (DEC-0006) | `tur.test.ts`; istemcide test kesintisi 10. günde durdu | ✔ |
| Kayıt sonrası durum korunur (AT-016 iskeleti) | `kayit.test.ts`; istemcide manuel kayıt → yükleme, durum özeti aynı | ✔ |
| Borçsuz harcama (AT-010) | `emir.test.ts`; istemcide 50.000'lik harcama gerekçesiyle reddedildi | ✔ |
| Bozuk kayıt güvenli hata | `kayit.test.ts` | ✔ |
| Determinizm kuralları | `kurallar.test.ts` (yasaklı API taraması) | ✔ |

## Ölçümler (Apple M2, Chrome)

- 1 aylık tur ≈ 2 ms; 1 yıllık tur ≈ 5 ms (132 devlet, 3.637 birim, 193 şehir).
- Ölçüm yalnızca test sistemleriyle yapıldı; gerçek sistemler (ekonomi, nüfus, AI) eklendikçe yeniden ölçülmeli.

## Bilinen sınırlar ve sonraki aşamaya devredenler

- **Test sistemleri:** Gelir (birim başına 10 / ay), nüfus (günlük rastgele +0–2) ve başlangıç
  hazinesi (birim başına 100) yer tutucu değerlerdir. Aşama 5 ve 7'de gerçek kurallarla değiştirilecek.
- **Kesinti tetikleyicileri:** Yalnızca test kesintisi var. Gerçek tetikleyiciler (ordu karşılaşması,
  savaş ilanı, hükümdar ölümü) ilgili sistemlerle Aşama 3, 6 ve 7'de eklenecek.
- **Devlet seçimi:** Oyuncu varsayılan olarak Osmanlı; başka bir devlet `?devlet=<id>` ile seçilebilir.
  Senaryo ve devlet seçme ekranı (MASTER_SPEC §17.1) sonraki aşamalarda gelecek.
- **Yılbaşı:** 1 Ocak kabul edildi. Tarihî yılbaşı gelenekleri ileride ayrıca ele alınabilir.
- **Kıyı şehirleri:** Haritadaki 6 kıyı şehri sadeleştirilmiş kıyının dışında kaldığı için en
  yakın arazi birimine bağlandı.
