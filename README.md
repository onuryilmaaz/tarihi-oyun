# Tarihî Strateji Oyunu (çalışma adı)

1453'te başlayan, tur bazlı, harita merkezli bir büyük strateji oyunu.
Oyuncu bir devleti yönetir; tarih başlangıç koşullarını belirler,
sonrası serbesttir.

**Durum:** Aşama 2 — tur ve dünya durumu çekirdeği. Teknoloji: TypeScript + three.js,
simülasyon tarayıcıda Web Worker'da.

## Çalıştırma

```sh
npm install
npm run dev        # oyun istemcisi: http://localhost:5173
npm test           # simülasyon testleri
npm run typecheck  # tip kontrolü (tüm paketler)
npm run senaryo    # veri/senaryo-1453/ yeniden üretimi (prototip verisinden)
```

| Klasör | İçerik |
|---|---|
| `packages/sim` | Oyun kuralları: dünya durumu, tur, emirler, kayıt (saf TypeScript) |
| `packages/istemci` | Harita ve arayüz (three.js), simülasyon Worker'ı, yerel kayıt |
| `veri/senaryo-1453` | 1453 senaryo ve harita verisi |
| `prototypes/` | Atılabilir prototipler ve ölçümler |

## Belgeler

| Dosya | İçerik |
|---|---|
| `MASTER_SPEC.md` | Ana ürün şartnamesi (GDD) — tek referans |
| `DECISIONS.md` | Onaylı karar kayıtları |
| `AGENTS.md` | AI agent kuralları |
| `CHANGELOG.md` | Değişiklik geçmişi |
| `docs/gdd/` | Ayrıntılı mekanik belgeleri, sözlük, keşif soruları |
| `docs/milestones/` | Aşama kabul tutanakları |
| `tasks/` | Görev kartları |

`TARIHI_STRATEJI_OYUNU_AGENT_GDD.md`, keşif sürecinin orijinal çıktısıdır
(v1.0) ve değiştirilmez.
