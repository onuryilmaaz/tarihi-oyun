# 1453 senaryo verisi — kaynaklar ve lisanslar

Bu klasör `npm run senaryo` (`araclar/senaryo-uret.mjs`) ile üretilir. **Prototip verisidir; tahmini tablolar
tarihî kaynakla doğrulanmamıştır** (DEC-0016, DEC-0021). Yazılım lisansları: `docs/LISANS-KONTROL.md`.

| Veri | Kaynak | Lisans | Kullanım |
|---|---|---|---|
| Kıyı, göl, nehir, idari birimler | Natural Earth 1:10m | Kamu malı | `harita.json` geometrisi |
| 1453 siyasi sınırları (kısmen) | OpenHistoricalMap (49 kayıt) | CC0 (kayıt bazında: `prototypes/harita-gorsel-02/scripts/ohm-kayitlari.json`) | `harita.json` birim atamaları |
| 1453 siyasi sınırları (kalan) | Agent tahmini | — (kaynaksız, düşük güven; oyunda kesikli gösterilebilir) | `harita.json` birim atamaları |
| Devlet, başkent, tarihler | Wikidata | CC0 | `wikidata.json` |
| Yükseklik (arazi zorluğu, arazi verimi) | NOAA NCEI ETOPO 2022 (15″), ERDDAP üzerinden 0,2° seyreltilmiş | Ücretsiz kullanım ve yeniden dağıtım | `ag.dugumler[].z`, `birimler[].verim` (türetilmiş) |
| Hareket ağı, boğaz geçitleri | Natural Earth topolojisinden türetildi; boğazlar elle tanımlandı | — | `senaryo.json` → `ag` |
| Başlangıç ilişkileri ve ittifakları | Agent'ın tarihî tahmini (DEC-0039) | — [TASLAK] | `iliskiler.json` |
| Hükümdarlar, halefler, veraset gelenekleri | Agent'ın tarihî tahmini (DEC-0044); yetenekler oyun tahminidir | — [TASLAK] | `hukumdarlar.json` |
| Nüfus grupları (din × kültür) | Agent'ın tarihî tahmini (DEC-0046) | — [TASLAK] | `nufus.json` |
| Şehir nüfusları | Agent'ın tarihî tahmini, yuvarlanmış (DEC-0057) | — [TASLAK] | `sehir-nufus.json` |
| Deniz bölgeleri, limanlar, başlangıç donanmaları | Agent'ın tahmini (DEC-0052) | — [TASLAK] | `deniz.json` |
| Başlangıç hazinesi, ordu sayıları, garnizon/insan gücü formülleri | Oyun denge değerleri | — [TASLAK] | `senaryo.json`, `packages/sim/src/denge.ts` |

Bütün agent tahmini tabloların `aciklama` alanı "[TASLAK]" işareti taşır; `packages/sim/test/veri-kaynak.test.ts` bunu denetler.
Armalar oyunun ürettiği simgelerdir (`packages/istemci/src/arma.ts`), tarihî arma görseli kullanılmaz.

Ham ETOPO indirmesi depoya alınmaz (`veri-ham/`, ~59 MB):

```sh
mkdir -p veri-ham
curl -o veri-ham/etopo2022-0.2deg.csv \
  "https://coastwatch.pfeg.noaa.gov/erddap/griddap/ETOPO_2022_v1_15s.csv0?z%5B(-57):48:(84)%5D%5B(-180):48:(180)%5D"
npm run senaryo
```
