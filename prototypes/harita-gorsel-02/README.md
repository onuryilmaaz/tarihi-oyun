# harita-gorsel-02 — 1453 harita görsel yön prototipi

TASK-0002 kapsamında hazırlanan **atılabilir** prototip. Gerçek dünya coğrafyası (Natural
Earth) üzerinde **yaklaşık** 1453 sınırları, üç görsel yön, devlet/arazi/şehir seçim
hiyerarşisi ve etiketler içerir. Sonuçlar: `docs/ui-ux/gorsel-yon-denemeleri.md`.

## Çalıştırma

```sh
npm install
npm run dev            # http://localhost:5173
```

Hazır veri `public/veri/dunya-1453.json` depoda bulunduğu için yeniden üretmek gerekmez.

Adres parametreleri: `?tema=atlas|modern|gece`; `&olcum=1` açılışta 12 sn'lik ölçümü başlatır.

## Veriyi yeniden üretme

Ham Natural Earth dosyaları depoya dahil değildir (`veri-ham/`, ~65 MB):

```sh
mkdir -p veri-ham && cd veri-ham
B=https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson
for f in ne_10m_admin_1_states_provinces ne_10m_lakes ne_10m_rivers_lake_centerlines; do
  curl -fLO $B/$f.geojson
done
cd .. && npm run veri          # SADELIK=0.25 (korunan nokta oranı) ile ayarlanabilir
```

1453 atamaları: `scripts/devletler-1453.mjs`. Bu atamalar **tahmindir**:
`docs/historical-sources/1453-yaklasik-sinirlar.md`.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `scripts/veri-hazirla.mjs` | Atama, bölme, birleştirme, projeksiyon (Miller), topoloji, sadeleştirme, etiket noktaları |
| `scripts/devletler-1453.mjs` | Devletler, atama kuralları, şehirler |
| `src/veri.ts` | Veri paketini çözme, halkalar, seçim ızgarası |
| `src/harita.ts` | three.js katmanları, tema uygulama, seçim vurgusu, kâğıt dokusu |
| `src/etiketler.ts` | DOM etiketleri, sığdırma ve çakışma önleme |
| `src/temalar.ts` | Üç görsel yön |
| `src/main.ts` | Kamera, etkileşim, panel, ölçüm |

## Lisanslar

Natural Earth: kamu malı. three (MIT), earcut / topojson-* / polylabel (ISC), polygon-clipping
(MIT), Cinzel / Cormorant Garamond / Inter yazı tipleri (OFL-1.1, @fontsource paketleri).
