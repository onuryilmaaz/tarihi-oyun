# CHANGELOG

## 2026-10-29 — Aşama 1 kapandı, TASK-0003

### Eklendi
- DEC-0017 (commit/push öncesi kullanıcı onayı), DEC-0018 (görsel yön: Tarihî
  atlas), DEC-0019 (Aşama 1 kapısı), DEC-0020 (ticari değil), DEC-0021 (karma
  1453 veri yöntemi).
- `docs/milestones/ASAMA-1.md`, `tasks/TASK-0003.md`.
- `docs/historical-sources/OPEN-018-kaynak-arastirmasi.md`.

### Değişti
- harita-gorsel-02: başkentler belirginleştirildi (halka + nokta işareti,
  büyük kalın ad).
- AGENTS.md: commit kuralı, mevcut aşama.

## 2026-10-29 — TASK-0002: gerçek dünya haritası, 1453 sınırları, görsel yönler

### Eklendi
- DEC-0015 (GitHub özel depo, main), DEC-0016 (Natural Earth + yaklaşık 1453).
- `prototypes/harita-gorsel-02/`: Natural Earth veri hattı, 131 devletli yaklaşık
  1453 haritası, 3 görsel yön, devlet/arazi/şehir seçim hiyerarşisi, etiketler.
- `docs/ui-ux/gorsel-yon-denemeleri.md` + ekran görüntüleri.
- `docs/historical-sources/1453-yaklasik-sinirlar.md`.

### Değişti
- AGENTS.md: depo bilgisi, mevcut aşama.

## 2026-10-29 — TASK-0001 kabul, TASK-0002, git deposu

### Eklendi
- DEC-0014 (ADR-0001 render yaklaşımı Aşama 1 temeli).
- `tasks/TASK-0002.md` (onaylandı; bir açık soru).
- Git deposu ve kök `.gitignore`.

### Değişti
- TASK-0001 ve ADR-0001 kabul edildi.
- AGENTS.md: depo ve dal stratejisi.

## 2026-10-29 — MASTER_SPEC v1.3 — Teknoloji kararı ve TASK-0001

### Eklendi
- DEC-0012 (TypeScript + three.js, oyun motoru yok), DEC-0013 (önce web,
  mobil ertelendi).
- `prototypes/render-olcum-01/`: three.js harita render ölçüm prototipi.
- `docs/architecture/ADR-0001-harita-render.md` + ekran görüntüleri.

### Değişti
- MASTER_SPEC: başlık, §2, §17.2, §20, §22 Aşama 1 notu, §25, §27.
- TASK-0001 kapsamı üç seçenekli karşılaştırmadan three.js ölçümüne
  daraltıldı; iş tamamlandı, kabul bekliyor.

## 2026-10-29 — MASTER_SPEC v1.2 — Aşama 0 kapandı

### Değişti
- DEC-0002 ve DEC-0008 yorumları onaylandı; MASTER_SPEC §8.6 ve §11.2'deki
  ilgili [TASLAK] etiketleri [KARAR] oldu (açık kalan alt konular [AÇIK]).
- §23.2 AT-003, 1453 senaryosuna uyarlandı (DEC-0010).
- Başlık durumu, §28.3 ve belge sonu v1.2.
- DEC-0001 açık teyit aldı.

### Eklendi
- DEC-0010, DEC-0011.
- `tasks/TASK-0001.md` (onay bekliyor).
- `docs/milestones/ASAMA-0.md` kapanış kaydı.

## 2026-10-28 — MASTER_SPEC v1.1 (Aşama 0)

### Eklendi
- `MASTER_SPEC.md`: `TARIHI_STRATEJI_OYUNU_AGENT_GDD.md` (v1.0) belgesinin
  proje kopyası; v1.1 kararları işlendi. Orijinal dosya değiştirilmedi.
- `DECISIONS.md`: DEC-0001 – DEC-0009.
- `AGENTS.md`: agent davranış ve onay kuralları.
- `docs/gdd/kesif-sorulari.md`: Keşif sorusu 93 ve cevabı.
- `docs/gdd/sozluk.md`: terimler sözlüğü.
- `docs/milestones/ASAMA-0.md`: Aşama 0 kabul matrisi ve onay talebi.
- MASTER_SPEC §26'daki klasör yapısı (`src/` hariç; teknoloji seçimi
  sonrası).

### Değişti (MASTER_SPEC)
- §2: Borç satırı (eksi bakiye), Kayıt satırı [AÇIK]; yeni karar satırları
  (ilk senaryo, tur süresi, kesinti, arazi birimi, geri çekilme).
- §3.2: Tur süresi kritik açık konusu → DEC-0005 / DEC-0006.
- §4.2: En küçük arazi birimi → DEC-0007.
- §5.1: İlk sürüm tek senaryo 1453 → DEC-0004.
- §5.3: Toparlanma / ülke değiştirme [AÇIK] (OPEN-024).
- §8.6: Geri çekilme oyuncu kararına bağlı → DEC-0008.
- §11.2: Eksi bakiye mümkün, borçlanma yasağı korunuyor → DEC-0002.
- §15: Soru 93 atfı.
- §22 Aşama 5 kabul ölçütü eksi bakiyeye göre güncellendi.
- §23.2 AT-003: güncelleme önerisi eklendi (onay bekliyor).
- §25: OPEN-001/002/003 durumu; yeni OPEN-023, OPEN-024.
- §27, §28.3: v1.1 durumu.
