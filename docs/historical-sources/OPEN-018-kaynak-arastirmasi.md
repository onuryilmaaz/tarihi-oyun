# OPEN-018 — 1453 sınır verisi: kaynak ve lisans araştırması

- **Görev:** TASK-0003
- **Tarih:** 2026-10-29
- **Durum:** KARARA BAĞLANDI — karma yöntem (DEC-0021); oyun ticari değil (DEC-0020); Euratlas teklifi istenmeyecek; tarihçi erişimi yok
- **Not:** Bu belge hukuki görüş değildir. Ticari yayından önce lisans yorumları bir uzmana
  doğrulatılmalıdır.

## Özet

1453 için doğrudan kullanılabilecek, hem **doğru** hem **ticari kullanıma uygun lisanslı** hazır
bir sınır veri seti bulunamadı.

- **Ticari kullanıma en uygun kaynaklar:** OpenHistoricalMap (CC0) ve Wikidata (CC0).
  Ancak kapsamları ayrıntı bölgemizde parçalı.
- **Kaba ve kısıtlı kaynaklar:** historical-basemaps ve Euratlas. Diğer kaynaklar ya çok kaba,
  ya 1453'ü kapsamıyor, ya da lisansları ticari kullanımı kısıtlıyor.

**Öneri:** Proje kendi 1453 veri setini üretsin. Coğrafya Natural Earth'ten, siyasi sınırlar
mümkün olduğunca OpenHistoricalMap'in CC0 kayıtlarından, devlet, hükümdar ve başkent bilgileri
Wikidata'dan gelsin. Lisansı kısıtlı kaynaklar yalnızca **karşılaştırma ve doğrulama** için
kullanılsın. Ayrıntı bölgesi tarihçi gözden geçirmesiyle düzeltilsin.

## Kaynak karşılaştırması

| Kaynak | Ne sağlar | 1453'e uygunluk | Ayrıntı (ayrıntı bölgesi) | Lisans | Ticari kullanım | Değerlendirme |
|---|---|---|---|---|---|---|
| **OpenHistoricalMap (OHM)** | Tarihli sınır poligonları (başlangıç/bitiş tarihli) | ✔ Tarih filtresiyle doğrudan 1453 | **Parçalı:** bölgede 1453'te geçerli 48 kayıt (Osmanlı, Memlûk, Trabzon, Macaristan, Venedik, Eflak, Kıbrıs, Rodos, Atina, Nakşa, Kırım, Büyük Orda, Nogay, Teodoro…). **Eksik:** Bizans, Karaman, Akkoyunlu, Karakoyunlu, Sırbistan, Bosna, Boğdan, Litvanya, Lehistan | **CC0** (varsayılan); bazı kayıtlar `license=*` etiketiyle farklı | ✔ CC0 kayıtlar serbest; CC BY / CC BY-SA kayıtlar koşullu | **Ana kaynak adayı.** Kayıt bazında lisans ve kaynak kontrolü şart |
| **Wikidata** | Devletler, hükümdarlar, hanedanlar, başkentler, kuruluş/yıkılış tarihleri (geometri çok az) | ✔ | Varlık düzeyinde iyi; sınır yok | **CC0** | ✔ | **Devlet, karakter ve başkent verisi** için ana kaynak |
| **Natural Earth** | Kıyı, göl, nehir, modern idari birimler | Coğrafya için ✔; siyasi için ✗ (modern) | Kıyı 1:10m; İstanbul gibi yerlerde kaba | **Kamu malı** | ✔ | Coğrafya tabanı (zaten kullanılıyor) |
| **historical-basemaps** (aourednik) | Dünya siyasi sınırları; 1300, **1400**, **1492**, 1500… | ✗ 1453 yok; 1400 ile 1492 arasında | Çok kaba: 1400'de bölgede 26 yapı, hepsi "yaklaşık" hassasiyette; Karaman yok, "Seljuk Caliphate" gibi döneme uymayan kayıtlar var | **GPL-3.0** | ⚠ Copyleft: türetilen veri dağıtılırsa GPL koşulları doğabilir | **Yalnızca karşılaştırma için**, içe aktarılmasın |
| **Euratlas** (Nüssli) | Avrupa'nın yüzyıllık siyasi haritaları (GIS), şehirler | ⚠ Yüzyıl kesitleri (1400/1500); 1453 yok | Avrupa için akademik düzeyde; Anadolu ve Orta Doğu sınırlı | Ticari lisans; basit lisans 1.500 kopya / ayda 500 bin ziyaretçi sınırlı; geniş lisans sınırsız (1800 verisi için 150 € / 600 €) | ⚠ Oyun ve yazılım kullanımı açıkça düzenlenmemiş; teklif istenmeli | Bütçe varsa **referans/lisanslı kaynak** seçeneği |
| **Tabula Imperii Byzantini (DigTIB)** | Bizans dünyası yer adları, Balkan GIS katmanları (4.–15. yy) | ✔ Bizans ve Balkanlar için güçlü | Akademik ve yüksek; Anadolu dijital verisi belirsiz | Telif kısıtlı; açık lisans doğrulanamadı | ✗ (doğrulanana kadar) | **Akademik referans** |
| **World Historical Gazetteer** | Tarihî yer adları ve koordinatları (veri seti bazında) | Kısmen | Nokta verisi | Veri seti başına; CC BY 4.0, bazı kayıtlarda NC | ⚠ Yalnızca CC0 / CC BY veri setleri | Şehir adları ve konumları için **seçici kullanım** |
| **DARMC** (Harvard) | Roma ve Orta Çağ yerleşimleri, yolları | Kısmen | Nokta ve hat | Resmî lisans metni bulunamadı | ✗ (belirsiz) | Referans |
| **Osmanlı tahrir defterleri** ve akademik literatür | Sancak/kaza düzeyinde idari yapı | ✔ Birincil kaynak | En yüksek | Kaynak türüne göre | Olgular telifsizdir; haritalar telifli olabilir | 15. yüzyıl için hazır GIS verisi bulunamadı; **kaza/nahiye katmanı ancak bu yolla** üretilebilir |

## Hukuki notlar (uzman görüşü gerektirir)

- Tarihî **olgular** ("1453'te Konya Karamanoğulları'ndaydı") telife konu olmaz. Belirli bir
  haritanın **çizimi** ise telifli olabilir. Telifli bir haritanın doğrudan izlenmesi
  (trace) türev eser riski taşır.
- AB'de veri tabanları için ayrıca **sui generis** veri tabanı hakkı vardır. Euratlas İsviçre
  kaynaklıdır, koşullarına dikkat edilmeli.
- OHM'deki bazı kayıtların kaynağı Wikimedia Commons haritaları. Bu haritalar çoğunlukla
  CC BY-SA lisanslı olduğundan, CC0 olarak işaretlenmiş olsalar bile güvenli tarafta kalmak
  için **referans** sayılmalı.
- GPL-3.0 lisanslı verinin kapalı kaynaklı bir oyunla birlikte dağıtılması belirsiz bir alan.
  İçe aktarılmaması öneriliyor.

## Önerilen yöntem (karma)

1. **v0.2: OHM ile iyileştirme.** Ayrıntı bölgesinde OHM'nin CC0 kayıtları içe aktarılır.
   Kayıt bazında lisans ve kaynak alanı kontrol edilir; kaynağı Commons olanlar referans
   sayılır. Eksik kalan devletler mevcut tahmin yöntemiyle sürer. Her devlet için
   `kaynak` ve `guven` (yüksek/orta/düşük) alanı tutulur.
2. **Wikidata aktarımı:** Devlet, hükümdar, hanedan ve başkent kayıtları 1453 için sorgulanıp
   proje veri setine alınır. Aynı kayıtlar Aşama 7'deki karakter ve hanedan sistemine temel olur.
3. **Kaza/nahiye katmanı:** DEC-0007 hedefi. Ayrıntı bölgesi için akademik literatür ve tahrir
   defteri çalışmaları referans alınarak **projenin kendi çizimi** olarak üretilir. Kaynakça
   tutulur; telifli haritalar izlenmez.
4. **Doğrulama:** historical-basemaps (1400/1492), Euratlas ve DigTIB karşılaştırma için
   kullanılır. Farklar bir rapora yazılır. Nihai kararı tarihçi gözden geçirmesi ve kullanıcı
   verir (MASTER_SPEC §4.5).
5. **Lisans kaydı:** Her veri öğesi için kaynak, lisans ve tarih tutulur
   (`docs/historical-sources/`).

## Kaynaklar

- OpenHistoricalMap telif ve lisans: https://www.openhistoricalmap.org/copyright
- OHM lisans etiketi: https://wiki.openstreetmap.org/wiki/OpenHistoricalMap/Tags/Key/license
- OHM sorgusu: `overpass-api.openhistoricalmap.org`, ayrıntı bölgesi kutusu (29–49°K, 12–50°D), 1–4. düzey idari sınırlar, 1453'te geçerli olanlar (2026-10-29)
- Wikidata lisansı: https://www.wikidata.org/wiki/Wikidata:Licensing
- historical-basemaps: https://github.com/aourednik/historical-basemaps (GitHub API: GPL-3.0; dosya listesi doğrulandı)
- Euratlas GIS SSS ve lisans: https://euratlas.net/history/europe/gis.html, https://www.euratlas.net/shop/licences/licence_periodis_b.pdf
- DigTIB: https://tib.oeaw.ac.at/digtib, https://maryjahariscenter.org/resources/digital-tabula-imperii-byzantini-digtib
- World Historical Gazetteer lisansı: https://whgazetteer.org/licensing, https://whgazetteer.org/public_data
- DARMC: https://maryjahariscenter.org/resources/digital-atlas-of-roman-and-medieval-civilizations
- Osmanlı idari bölümleri: https://en.wikipedia.org/wiki/Administrative_divisions_of_the_Ottoman_Empire
- Tahrir defterleri ve tarihî coğrafya: https://www.academia.edu/85133932/The_Ottoman_Tahrir_Defters_as_a_Source_for_Historical_Geography
- Osmanlı Macaristanı tapu defteri GIS veritabanı: https://real.mtak.hu/118073/1/11.Simon-DemeterOHV.pdf

## Kullanıcıdan istenen kararlar

1. Oyun **ticari** olarak satılacak mı (OPEN-022)? Lisans seçimini doğrudan etkiler.
2. Karma yöntem onaylanıyor mu? OHM CC0 içe aktarımı ve Wikidata kabul; GPL ve NC kaynaklar
   yalnızca referans.
3. Euratlas'tan fiyat teklifi istensin mi? Teklifi kullanıcının istemesi gerekir.
4. Ayrıntı bölgesi için bir tarihçiye ya da danışmana erişim var mı?
