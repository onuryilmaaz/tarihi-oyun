# 1453 senaryo verisi — kaynaklar ve lisanslar

Bu klasör `npm run senaryo` (`araclar/senaryo-uret.mjs`) ile üretilir. **Prototip verisidir; gerçek
senaryo verisi değildir** (DEC-0016, DEC-0021).

| Veri | Kaynak | Lisans | Kullanım |
|---|---|---|---|
| Kıyı, göl, nehir, idari birimler | Natural Earth 1:10m | Kamu malı | `harita.json` geometrisi |
| 1453 siyasi sınırları (kısmen) | OpenHistoricalMap | CC0 (kayıt bazında kontrol: `prototypes/harita-gorsel-02/scripts/ohm-kayitlari.json`) | `harita.json` birim atamaları |
| 1453 siyasi sınırları (kalan) | Agent tahmini | — (kaynaksız, düşük güven) | `harita.json` birim atamaları |
| Devlet, başkent, tarihler | Wikidata | CC0 | `wikidata.json` |
| Yükseklik (arazi zorluğu) | NOAA NCEI ETOPO 2022 (15″), ERDDAP üzerinden 0,2° seyreltilmiş | Ücretsiz kullanım ve yeniden dağıtım ("may be used and redistributed for free") | `senaryo.json` → `ag.dugumler[].z` (yalnızca türetilmiş zorluk yüzdesi) |
| Hareket ağı, boğaz geçitleri | Natural Earth topolojisinden türetildi; boğazlar elle tanımlandı | — | `senaryo.json` → `ag` |
| Nüfus, hazine, ordu asker sayıları | Test değerleri | — | `senaryo.json` |

Ham ETOPO indirmesi depoya alınmaz (`veri-ham/`, ~59 MB):

```sh
mkdir -p veri-ham
curl -o veri-ham/etopo2022-0.2deg.csv \
  "https://coastwatch.pfeg.noaa.gov/erddap/griddap/ETOPO_2022_v1_15s.csv0?z%5B(-57):48:(84)%5D%5B(-180):48:(180)%5D"
npm run senaryo
```
