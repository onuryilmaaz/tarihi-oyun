# render-olcum-01 — Harita render ölçüm prototipi

TASK-0001 kapsamında hazırlanan **atılabilir** prototip. Ana koda doğrudan taşınmaz.
Veriler sentetiktir; gerçek tarihî harita değildir. Sonuçlar:
`docs/architecture/ADR-0001-harita-render.md`.

## Çalıştırma

```sh
npm install
npm run dev          # http://localhost:5173
```

Adres parametreleri:

- `?n=20000` → kara arazi birimi sayısı (5000 / 20000 / 50000)
- `&tohum=1453` → rastgelelik tohumu (aynı tohum = aynı harita)
- `&olcum=1` → açılışta 12 sn'lik ölçümü otomatik başlatır

Kontroller: sürükle = kaydır, tekerlek veya + / − = yakınlaştır, ok tuşları = kaydır,
tıkla = arazi seç, Esc = seçimi kaldır.

## Otomatik ölçüm

`olcumler/olc.mjs`, puppeteer-core ile yerel Chrome'u çalıştırır. Prototipin bağımlılığı
değildir; ayrı bir klasörde `npm i puppeteer-core` kurulduktan sonra, `npm run build &&
npx vite preview --port 4173` açıkken şöyle çalıştırılır: `node olc.mjs <çıktı-klasörü>`.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `src/rng.ts` | Tohumlu rastgelelik, gürültü |
| `src/veri.ts` | Sentetik arazi, devlet ve yerleşim üretimi; seçim testi |
| `src/harita.ts` | three.js katmanları, seçim vurgusu |
| `src/olcum.ts` | Kare süresi istatistikleri |
| `src/main.ts` | Kamera, etkileşim, panel, ölçüm döngüsü |
