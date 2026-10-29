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

Adres parametreleri: `?tema=atlas|modern|gece`; `?veri=v01` eski tahmin verisi (varsayılan v0.2);
`&olcum=1` açılışta 12 sn'lik ölçümü başlatır.

## Veri sürümleri

| Sürüm | Dosya | İçerik |
|---|---|---|
| v0.1 | `public/veri/dunya-1453.json` | Yalnızca agent tahmini (TASK-0002) |
| v0.2 | `public/veri/dunya-1453-v02.json`, `public/veri/wikidata-1453.json` | OpenHistoricalMap CC0 sınırları + tahmin; Wikidata devlet kayıtları (TASK-0004) |

## Veriyi yeniden üretme

Ham Natural Earth dosyaları depoya dahil değildir (`veri-ham/`, ~65 MB):

```sh
mkdir -p veri-ham && cd veri-ham
B=https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson
for f in ne_10m_admin_1_states_provinces ne_10m_lakes ne_10m_rivers_lake_centerlines; do
  curl -fLO $B/$f.geojson
done
cd .. && npm run veri          # v0.1; SADELIK=0.25 (korunan nokta oranı) ile ayarlanabilir
npm run veri:v02               # v0.2: OHM indirir (scripts/ohm-kayitlari.json lisans kaydını yazar) + üretir (~3 dk)
node scripts/wikidata-sorgula.mjs   # Wikidata devlet kayıtları
node scripts/karsilastir.mjs        # v0.1 / v0.2 / historical-basemaps karşılaştırması
                                    # (veri-ham/hb/ altına historical-basemaps world_1400/1492 gerekir; GPL-3.0, yalnızca karşılaştırma)
```

1453 atamaları: `scripts/devletler-1453.mjs`. Bu atamalar **tahmindir**:
`docs/historical-sources/1453-yaklasik-sinirlar.md`.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `scripts/veri-hazirla.mjs` | Atama, bölme, birleştirme, projeksiyon (Miller), topoloji, sadeleştirme, etiket noktaları |
| `scripts/devletler-1453.mjs` | Devletler, atama kuralları, şehirler |
| `scripts/ohm-indir.mjs` | OHM'den 1453 sınırları + kayıt bazında lisans/kaynak kontrolü |
| `scripts/ohm-esleme.mjs` | OHM kaydı → devlet eşlemesi; agent incelemesiyle reddedilen kayıtlar |
| `scripts/ohm-kayitlari.json` | İndirilen her OHM kaydının lisans ve kullanım durumu |
| `scripts/wikidata-sorgula.mjs` | Wikidata devlet, başkent ve tarih bilgisi |
| `scripts/karsilastir.mjs` | Sürüm ve kaynak karşılaştırma raporu |
| `src/veri.ts` | Veri paketini çözme, halkalar, seçim ızgarası |
| `src/harita.ts` | three.js katmanları, tema uygulama, seçim vurgusu, kâğıt dokusu |
| `src/etiketler.ts` | DOM etiketleri, sığdırma ve çakışma önleme |
| `src/temalar.ts` | Üç görsel yön |
| `src/main.ts` | Kamera, etkileşim, panel, ölçüm |

## Lisanslar

Natural Earth: kamu malı. OpenHistoricalMap: CC0 (yalnızca CC0 kayıtlar içe aktarılır; diğerleri referans).
Wikidata: CC0. three (MIT), earcut / topojson-* / polylabel (ISC), polygon-clipping
(MIT), Cinzel / Cormorant Garamond / Inter yazı tipleri (OFL-1.1, @fontsource paketleri).
