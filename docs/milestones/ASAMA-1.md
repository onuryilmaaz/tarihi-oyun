# Aşama 1 — Harita Deneyimi Prototipi

**Durum:** ✔ KAPANDI — kullanıcı onayı (2026-10-29, DEC-0019)

## Tamamlanan işler

| Görev | Çıktı | Sonuç |
|---|---|---|
| TASK-0001 | `prototypes/render-olcum-01/`, ADR-0001 | three.js render yaklaşımı; 50 bin birime kadar 60 FPS (M2) |
| TASK-0002 | `prototypes/harita-gorsel-02/`, `docs/ui-ux/gorsel-yon-denemeleri.md` | Natural Earth + yaklaşık 1453; 3 görsel yön; seçim hiyerarşisi; etiketler |

## Kabul matrisi (MASTER_SPEC §22, Aşama 1)

| Ölçüt | Sonuç |
|---|---|
| Harita okunabilir | ✔ Tarihî atlas seçildi (DEC-0018) |
| Sınır/topoloji tutarlı | ✔ Paylaşılan yaylardan sınır sınıflandırması |
| Seçim ve yakınlaştırma testleri | ✔ Otomatik test (devlet → arazi → Esc) |
| Cihaz ölçümleri raporlu | ⚠ Yalnızca Apple M2; zayıf cihaz yok (OPEN-019 açık) |
| Basit mobil etkileşim | — Ertelendi (DEC-0013) |

## Aşama 1'den devreden konular

- Gerçek 1453 sınır verisi ve kaynakları → TASK-0003 (OPEN-018).
- Arazi birimi ölçeği: Prototip modern il/eyalet kullanıyor; DEC-0007 kaza/nahiye ölçeği hedefliyor.
- Zayıf cihaz ölçümü (OPEN-019).
- Etiketler DOM'da; ordu simgeleri geldiğinde yeniden değerlendirilecek.
