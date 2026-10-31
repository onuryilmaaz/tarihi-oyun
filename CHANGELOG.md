# CHANGELOG

## 2026-10-31 — TASK-0032/0033/0034: denge, idari birimler bütün devletlerde, tarihî adlar (Claude)

- Denge: yatırım geliri nüfusla ölçekli, taban tarla 8 / pazar 10, gelişmişlik her 3 seviyede, AI 60 ay geri dönüş.
- 88 devlette kültüre göre adlandırılmış otomatik idari birimler (kontluk, voyvodalık, tema, vilayet…).
- 17 şehre 1453 adı (Ruha, Ayıntab, Revan…), şehir panelinde günümüzdeki adı. 10 yıllık test sınırı 120 sn.

## 2026-10-31 — TASK-0031: şehir merkezli harita bütün dünyaya yayıldı (Claude)

- Asya, Afrika'nın güneyi ve Amerika (şehirler arası en az 90 km); 128 devlet, 2.152 şehir, 414 yeni liman.
  Bölüşüm dört grupta (Avrupa+Yakındoğu, Asya, Afrika, Amerika) ayrı yapılır.

## 2026-10-31 — TASK-0030: şehir merkezli harita Avrupa ve Yakındoğu'ya yayıldı (Claude)

- 80 devlet, 1.324 şehir, 282 yeni liman; Wikidata adayları karelerle çekiliyor. Sim başarımı: AI ekonomi kararında
  gelirler günde bir kez hesaplanıyor, liman ticaretinde anlaşma sayımı hızlandı (3 yıl 7,7 → 3,4 sn).

## 2026-10-31 — TASK-0029: sancak sistemi; garnizon; toplananlar orduya katılır; harita bağlam menüsü (Claude)

- Osmanlı sancak/eyalet sistemi (şema 29), "Sancak sınırları" katmanı, Sancaklar paneli, sancakbeyi yönetimi.
- Garnizon ve sur nüfusa göre. Toplama bitince şehirde bekleyen orduya katılım.
- Ordu seçili değilken sağ tık bağlam menüsü (asker topla, bağış, savaş ilanı, en yakın orduyla kuşatma).

## 2026-10-31 — TASK-0028: kıyı limanları; gelişmişlik ve gelir kaynağı ekonomide (Claude)

- 54 kıyı şehri liman oldu (toplam 124). Gelişmişlik gelir çarpanı, gelir kaynağı etkileri, gelişmişlik değişimi
  (yatırım +, kuşatma/ayaklanma −). Şema 28. Şehir panelinde canlı değerler.

## 2026-10-31 — TASK-0027: şehir ve toprağı birlikte fethedilir (Claude)

- Şehirli toprak şehrini izler; şehir düşünce toprağı da geçer; barışta şehir toprağıyla gider. Şehirsiz toprak
  eskisi gibi işgal edilir. Kuşatmadaki ordu aşınmaz [TASLAK]. 14 eski kural testi uyarlandı.
- Oyuncunun ordusu düşman şehrinin önüne varınca (karadan ya da çıkarmayla) kuşatma kendiliğinden başlar; düşman
  şehrinin panelinde "ile kuşat" / "Şehre yürü ve kuşat".

## 2026-10-31 — TASK-0026: şehir adı değiştirme ve birleştirme; eski kayıt desteği kaldırıldı (Claude)

- Oyuncu kendi şehrinin adını değiştirebilir (eski ad saklanır) ve toprakları komşu iki şehrini birleştirebilir
  (500, 30 gün; büyük ya da başkent merkez kalır, küçük şehir bağlanır). Şema 27.
- DEC-0075: eski kayıtlar taşınmaz; kayıt dönüştürücü zinciri, eski kayıt onarımı ve eski şema testleri kaldırıldı.
- Harita: Üsküdar'ın Avrupa yakasına taşan kıyı şeridi giderildi (bölgeler yalnızca kendi kara parçasıyla kesişir,
  boşluklar aynı kara parçasındaki en yakın bölgeye verilir).

## 2026-10-31 — TASK-0025 pilot: şehir merkezli harita (Anadolu + Balkanlar) (Claude)

- Wikidata (CC0) şehir adayları (`araclar/sehir-wikidata.mjs`, `sehirler-wikidata.json`), seçim ve seyreltme
  (`araclar/sehir-sec.mjs`, en az 45 km; `sehir-haric.json` elle dışlama). 24 pilot devlete 236 yeni şehir.
- Pilot devletlerin toprağı şehir topraklarına bölündü (`bolge-uret.mjs` şehir kipi): her şehrin kendi toprağı var,
  sınır şehrin ortasından geçmez, devlet sınırı şehir topraklarını izler.
- Şehre tür, gelişmişlik, gelir kaynağı (tahmini, henüz ekonomiye bağlı değil) ve Wikidata bağlantısı.

## 2026-10-31 — TASK-0024 (A): araziye göre üretilen oyun bölgeleri (Claude)

- **Yeni `araclar/bolge-uret.mjs`** (`npm run senaryo` içinde): devlet sınırları ve kıyılar korunarak her devletin
  içi şehirlerden başlayan, engebe ve büyük nehirlere duyarlı bölüşümle yeniden bölündü; bölge sayısı devlet başına
  aynı. Adlar: şehirli bölge şehrin adı, diğerleri "<en yakın şehir> <yön>" (geçici). Ortak yaylar topojson-server
  ile yeniden kuruldu. Yeni devDependency: polygon-clipping (MIT), topojson-server (ISC).
- `ag-uret.mjs`: `etopoOku` dışa açıldı. `veri/geom` yeniden ayrıştırıldı. Senaryo sürümü değişti.

## 2026-10-31 — TASK-0023: sınır kırıntıları birleştirildi, deniz bölgeleri seçilebilir (Claude)

- **Yeni `araclar/birim-birlestir.mjs`** (`npm run senaryo` içinde): 500 km² altı birimler ve kopuk küçük parçalar
  aynı devletin en uzun ortak sınırlı komşusuna katılır. 3637 → 3146 birim; sahipli birimlerde 500 km² altı
  317 → 46. Devlet sınırları değişmedi (devlet başına alan farkı ≤ %0,01). Çakışan kaynak poligonlu 26 birim
  dokunulmadan kaldı. `veri/geom/` ayrılmış dosyaları yeni haritadan yeniden üretildi (`harita-derle` doğrulaması geçti).
- **Yeni `araclar/deniz-alan-uret.mjs`**: 29 deniz bölgesine karadan türetilmiş alan geometrisi (`harita.json`:
  `denizAlanlari`, `denizSinirlari`). Dış veri yok.
- **İstemci:** denize tıklama/ipucu, seçili denizin vurgusu, açık su bölge sınırları, deniz bilgi paneli (kontrol,
  limanlar, komşu denizler, donanmalar, "buraya yelken açsın").
- **Kayıt uyumu:** senaryo sürümü değişti; önceki kayıtlar yüklenmez (DEC-0072).
- `npm test` (253), `npm run typecheck`, `npm run build` geçti.

## 2026-10-30 — TASK-0022 (1. faz): harita verisini varlık bazlı ayrı dosyalarda tutma (Claude)

- **Yeni `araclar/harita-ayristir.mjs`** (`npm run harita:ayristir`): `harita.json`/`deniz.json`'daki devlet/
  bölge(birim)/şehir/deniz-bölgesi kayıtlarını, belirtilen devlet indeks aralığı için **varlık başına ayrı
  dosyaya** ayırır; `veri/geom/<kita>/{devletler,bolgeler,sehirler,deniz}/*.json` + ortak `arklar.json`
  (kullanılan sınır yayları) üretir.
- **Yeni `araclar/harita-derle.mjs`** (`npm run harita:derle`): Ayrıştırılmış dosyaları, henüz ayrıştırılmamış
  kıtaların verisiyle birleştirip `harita.json`/`deniz.json`'ı yeniden üretir ve orijinal dosyalarla **birebir
  eşleştiğini doğrular** (varsayılan: yalnızca doğrular; `--yaz` ile üzerine yazar).
- **Avrupa + Yakındoğu (devlet indeks 0–75) ayrıştırıldı:** 76 devlet, 1321 bölge, 133 şehir, 29 deniz bölgesi,
  9190 yay → `veri/geom/avrupa-yakindogu/`. Doğrulama geçti: hem `harita.json` hem `deniz.json` birebir
  eşleşiyor. **Mevcut dosyalar değiştirilmedi** (yalnızca paralel kaynak eklendi); istemci kodu hiç
  değişmedi, oyun/harita birebir aynı kalır.
- `npm test` (253, aynen geçti), `npm run build` geçti. `KAYNAKLAR.md` güncellendi.
- **Kalan 3 kıta da aynı oturumda tamamlandı:** `afrika` (devlet 76–89, 14 devlet, 268 bölge), `asya`
  (devlet 90–125, 36 devlet, 433 bölge), `amerika` (devlet 126–131, 6 devlet, 53 bölge) — **132 devletin
  tamamı artık ayrıştırılmış durumda.** Deniz bölgelerinin tamamı (29 bölge) coğrafi olarak Avrupa+Yakındoğu
  sularında olduğu için yalnızca o kıtada kaldı; `harita-ayristir.mjs`'e eklenen `--deniz` bayrağı yinelenmeyi
  önlüyor, `harita-derle.mjs` artık her kıtayı ayrı ayrı işliyor. Toplam **2439 dosya**, 13MB. Doğrulama hâlâ
  geçiyor (`harita.json`/`deniz.json` birebir eşleşiyor); `npm test` (253), `npm run build` geçti.
  Kasıtlı dışarıda kalan: 1562 sahipsiz (`d: -1`, arka plan) bölge — ayrı bir karar gerektirir.
- **Sahipsiz bölgeler + deniz bölgelerinin devlete göre dağıtımı (aynı oturumda, kullanıcı talebiyle):**
  Yeni `harita-ayristir.mjs sahipsiz` modu: 1562 `d:-1` bölgeyi `veri/geom/sahipsiz/bolgeler/` altına
  `durum: "sahipsiz"` etiketiyle ayırır (7023 yay). Önceki varsayım (29 deniz bölgesinin tamamı Avrupa+
  Yakındoğu'ya ait) yanlıştı — gerçekte bazı bölgeler Asya/Afrika'daki devletlere sınırdaş. Yeni
  `araclar/deniz-ayristir.mjs`: her deniz bölgesini, limanının sahibi olan **her devlete** bir kopya olarak
  dağıtır (`veri/geom/<kita>/deniz/<devlet-id>/<id>.json`, `sinirdasDevlet` etiketiyle) → 66 devlet-parçası;
  limanı olmayan 2 bölge (Azak, Manş) `veri/geom/uluslararasi-sular/` altına `durum: "uluslararasi"` etiketiyle
  yazıldı. Eski düz `avrupa-yakindogu/deniz/` klasörü silindi. `harita-derle.mjs` güncellendi: `"sahipsiz"`
  kıtası eklendi, `temizle()` yeni etiketleri siliyor, deniz birleştirmesi `deniz-sira.json`/`deniz-ekstra.json`
  üzerinden her kıtanın `deniz/<devletId>/` klasörlerinde arıyor. Doğrulama geçti: `harita.json`/`deniz.json`
  birebir eşleşiyor. `npm test` (253), `npm run typecheck`, `npm run build` geçti. Toplam **4041 dosya, 22MB**.
- **Not:** Bu değişiklik toplamda ~4041 yeni dosya ekliyor (büyük bir commit).
- **Sırada:** İstemci yükleme fazına geçiş — ayrı karar, kullanıcı onayı bekliyor.

## 2026-10-30 — TASK-0021 (4/4): AI vasallık teklif etsin — TASK-0021 tamamlandı (Claude)

- **Mevcut "gelen kutusu" altyapısına (`DiplomatikTeklif`) yeni `tur: "vasallik"` eklendi** (`yz-diplomasi.ts`):
  arazisi oyuncudan en az `VASAL_TEKLIF_ARAZI_KATI` (3) kat büyük, komşu, savaşta olmayan ve kendisi kimsenin
  vasalı olmayan bir AI, oyuncu zaten başka birinin vasalı değilse vasallık teklif edebilir. Bu, ilişkiden
  bağımsız bir eşik (dostluk teklifi değil, güç dengesine dayalı bir baskı/istek); diğer tüm teklif türleri
  ilişkiye bağlı kalmaya devam ediyor.
- Oyuncu kabul ederse `vasalKur(d, teklifEden, oyuncu)` çağrılır (efendi teklif eden, vasal oyuncu) — **asla
  zorla değil, yalnızca teklif/kabul/ret** (TASK-0021'in kabul kriteri).
- **Arayüz:** Gelen kutusu penceresinde vasallık için özel, açık metin ("X sizi vasalı olarak almak istiyor",
  vergi/savaş yükümlülüğü açıklaması) ve kabul öncesi ayrı bir onay penceresi eklendi.
- Şema değişikliği yok (`DiplomatikTeklif.tur` birleşimine eklemeli tür genişlemesi; veri şekli değişmedi).
- 253 sim testi (3 yeni: `yz-diplomasi.test.ts`'e eklenen vasallık bloğu — doğru/yanlış koşullarda teklif
  gelip gelmediğini ve kabul/ret'in `vasalliklar`'ı doğru güncellediğini doğruluyor), typecheck, build geçti.
  Canlı Playwright: JS hatası yok; gerçek bir vasallık teklifini 1453 senaryosunda tetiklemek pratikte zor
  (büyük bir devletin 3 kat büyük komşusu nadir — kasıtlı/gerçekçi bir sınır), mekanik sim testlerinde uçtan
  uca kanıtlı.
- **TASK-0021'in 4 alt teslimi de kod olarak tamamlandı:** (1) muharebe raporu birim kırılımı, (2) elçi küçük
  başarısızlık riski, (3) AI karışık ordu toplasın, (4) AI vasallık teklif etsin. Kullanıcı testi ve son commit
  onayı bekliyor.

## 2026-10-30 — TASK-0021 (3/4): AI karışık ordu toplasın (Claude)

- **`yz.ts: devletKarari`'nin `asker()` kararı artık tehdit altında süvari, barışta %60 okçu/%40 piyade**
  (`YZ_OKCU_OLASILIK: 6`/10) seçiyor; maaş/maliyet sınırları seçilen birimin gerçek maliyet/maaş yüzdesine göre
  hesaplanıyor (önceden hep piyade varsayıyordu, süvari/okçu için yanlış bütçe sınırı verirdi).
- Zar atmadan önce artık `eksik`/`para()` eşiği kontrol ediliyor: hem gereksiz rastgele tüketimini engelliyor
  hem de "parası yedeğin altındaysa hiçbir şey yapmaz" determinizm invariantını korumayı kolaylaştırıyor
  (mevcut `casusluk` kararındaki "önce bedel, sonra zar" deseniyle tutarlı).
- AI'nın güç kıyas formülleri bilinçli olarak değişmedi (zaten yaklaşık sayı kullanıyorlar, AT-013); şema
  değişikliği yok; yeni arayüz yüzeyi yok (oyuncu düşman ordu kompozisyonunu zaten göremiyor).
- 250 sim testi (2 yeni: tehdit altında süvari seçtiğini, barışta tohum taramasıyla hem okçu hem piyade
  gördüğünü doğruluyor), typecheck, build geçti. Yeni görsel yüzey olmadığı için canlı Playwright kontrolü
  gerekmedi; 10 yıllık `senaryo-1453.test.ts` determinizm testi de aynen geçti (yeni rastgele tüketimi bu
  testin tohumunda invariant'ı bozmadı).
- **Sırada:** TASK-0021 4/4 (AI vasallık teklif etsin) — son ve en karmaşık alt teslim. Kullanıcı testi ve
  commit onayı bekliyor.

## 2026-10-30 — TASK-0021 (2/4): elçi küçük başarısızlık/yakalanma riski (Claude)

- **`elci.ts: elciIlerlet`** artık varış gününde casusluğun yakalanma desenini mirror ediyor: %15
  (`ELCI_BASARISIZLIK_YUZDE`) ihtimalle elçi yakalanır — ilişki bozulur (`ELCI_YAKALANMA_ILISKI` −15, zamanla
  söner), bedel geri gelmez; aksi halde eskisi gibi hediyeyle aynı birikim kuralına tabi +15 ilişki ekler.
  Şema değişikliği yok (yalnızca varış anında hesaplanan bir olasılık, saklanan yeni veri yok).
- **Arayüz:** Devlet panelindeki elçi açıklamasına risk cümlesi eklendi ("%15 ihtimalle yakalanır; ilişki
  bozulur (−15), bedel geri gelmez").
- 249 sim testi (1 yeni: `elci.test.ts`'e eklenen yakalanma testi, tohum taraması ile yakalanma yolunu zorlayıp
  ilişkinin bozulduğunu ve birikime puan eklenmediğini doğruluyor), typecheck, build geçti. 5173'te Playwright
  ile canlı doğrulandı (panel metni doğru göründü, JS hatası yok).
- **Sırada:** TASK-0021 3/4 (AI karışık ordu toplasın). Kullanıcı testi ve commit onayı bekliyor.

## 2026-10-30 — TASK-0021 (1/4): muharebe raporunda birim kırılımı (Claude)

- **`MuharebeTarafi`/`RaporTarafi`'ye `kayipKompozisyon: Kompozisyon` eklendi** (`durum.ts`): gün gün
  (`savas.ts: muharebeGunleri`) ve takip kaybında (`muharebeyiBitir`) birikimli olarak güncellenir — mevcut
  toplam `kayip` alanıyla aynı desende (anlık enstantane değil, reinforce/katılım durumlarında da doğru).
  Şema 25 → 26 (eklemeli; eski kayıtlarda boş kompozisyon sayılır).
- **Arayüz:** Muharebe raporu penceresindeki kayıp sütununa, tamamen piyade olmayan taraflar için küçük bir
  tür dökümü eklendi; TASK-0019'da zaten canlı doğrulanmış `kompozisyonMetni` yardımcı fonksiyonu yeniden
  kullanıldı.
- 248 sim testi (2 yeni: `muharebe-kompozisyon.test.ts` — süvari/piyade karışık muharebede kırılımın doğru
  dağıldığını ve eski kayıt göçünü doğruluyor), typecheck, build geçti. Canlı Playwright testi kısmi kaldı:
  asker toplama ve savaş ilanı akışı denendi; oyuncunun fiilen karışık birimli bir muharebeye girmesi (ordu
  sevk + temas) bu oturumda tamamlanamadı. Mekanik sim testlerinde uçtan uca kanıtlı; render kodu önceden
  canlı doğrulanmış bir yardımcıyı yeniden kullanıyor.
- **Sırada:** TASK-0021 2/4 (elçi/casus küçük başarısızlık riski). Kullanıcı testi ve commit onayı bekliyor.

## 2026-10-30 — TASK-0020 (3/3): hükümdar/devlet portresi — TASK-0020 tamamlandı (Claude)

- **Yeni `packages/istemci/src/portre.ts: portreSvg(ad, hanedan)`:** Basit, deterministik insan silüeti SVG'si.
  Kişinin adı ten/saç rengini, hanedanı aksesuar (taç şeridi) rengini belirler — aynı hanedandan hükümdarlar ortak
  bir renk paylaşır, ayrı kişiler farklı ten/saç tonuyla ayrışır. Saf görsel: tarihî/fotoğrafik iddia taşımaz, sim
  tarafına, şemaya ya da oyun mantığına dokunmaz (kapsam dışı değildi, aynı zamanda hiçbir yeni veri gerektirmedi).
- **Arayüz:** Sol paneldeki kendi hükümdar kartına (`#hukumdarPortre`), devlet panelindeki (`diplomasiBolumu`)
  hükümdar bölümüne ve veraset seçimi aday listesine eklendi; mevcut soyut arma (`arma.ts`) yanında, onun yerine
  geçmeden.
- Sim tarafı değişmedi (246 test aynen geçti), typecheck ve build geçti. 5173'te Playwright ile canlı doğrulandı:
  kendi hükümdarım (II. Mehmed) ve Brandenburg'un hükümdarı (Karl) için birbirinden farklı, deterministik
  portreler göründü, JS hatası yok (kullanıcıya ekran görüntüsü gönderildi).
- **TASK-0020'nin 3 alt teslimi de kod olarak tamamlandı:** (1) AI'dan gelen diplomatik teklifler + gelen kutusu,
  (2) elçi gönderme, (3) hükümdar/devlet portresi. Kullanıcı testi ve son commit onayı bekliyor.

## 2026-10-30 — TASK-0020 (2/3): elçi gönderme (Claude)

- **Yeni emir `elciGonder` (`elci.ts`, yeni):** Orta maliyet (`ELCI_BEDEL` 180), 60 gün (`ELCI_GUN`) süren bir
  diplomatik eylem. Bedel emir anında ayrılır; elçi varınca ilişkiye hediyeyle aynı birikim/sönüm kuralına tabi
  +15 puan (`ELCI_ILISKI`, `ELCI_EN_COK` 30 tavanlı, bağımsız havuz) ekler. Her zaman başarılı (yakalanma riski
  kapsam dışı). Aynı devlete ikinci elçi, ilki yoldayken gönderilemez (`elciEngeli`).
- **Şema 24 → 25:** `elciler` (yoldaki elçiler) ve `sonrakiElciId` eklendi; eski kayıtlarda boş başlar.
- **Arayüz:** Devlet panelinde hediyenin yanına "Elçi gönder" düğmesi (bedel/süre/puan bilgisiyle) ya da
  "🕊 Elçiniz yolda; N gün sonra varacak" bildirimi.
- 246 sim testi (3 yeni: `elci.test.ts`), typecheck ve build geçti. 5173'te Playwright ile canlı doğrulandı:
  Brandenburg'a elçi gönderildi, hazineden 180 düştü, tur ilerletilince panelde "Elçiniz yolda; 59 gün sonra
  varacak" göründü, JS hatası yok (kullanıcıya ekran görüntüsü gönderildi).
- **Sırada:** TASK-0020 3/3 (hükümdar/devlet portresi). Kullanıcı testi ve commit onayı bekliyor.

## 2026-10-30 — TASK-0020 (1/3): AI'dan gelen diplomatik teklifler + gelen kutusu (Claude)

- **AI kararı (`yz-diplomasi.ts`, yeni):** Her AI devleti, oyuncunun sınır komşusuysa, savaşta değillerse ve
  180 gün içinde ona teklif göndermediyse, aylık kararında küçük bir olasılıkla (`YZ_DIPLOMASI_TEKLIF_OLASILIK`
  %1) ilişkisine göre ittifak (eşik 25) / ticaret anlaşması (eşik 10) / saldırmazlık paktı (eşik 0, 24 ay) teklif
  eder; en yüksek eşiği karşılayan tür seçilir. Uzak (komşu olmayan) devletler teklif göndermez — ilk denemede
  132 devletli senaryoda sınırsız teklif akışı 10 yıllık turları sürekli kesintiye uğratıyordu (bkz. riskler).
- **Oyuncu cevabı:** Yeni emir `diplomatikTeklifCevap` (kabul/ret), barış teklifiyle aynı doğrulama/uygulama
  deseninde (`emirler.ts`). Kabul edilirse ilgili ilişki (`ittifakKur`/`ticaretAnlasmasiKur`/`saldirmazlikKur`)
  kurulur.
- **Arayüz:** Barış teklifiyle aynı desende genelleştirilmiş bir pencere (`#dipTeklifi`): kesinti olduğunda
  otomatik açılır, devlet panelinde "📨 ... teklif ediyor" bildirimiyle de açılabilir. Savaş/barış rozetindeki
  sayaç artık bekleyen diplomatik teklifleri de sayıyor.
- **Şema 23 → 24:** `diplomatikTeklifler` (bekleyen teklifler) ve `diplomatikTeklifSoguma` (devlet başına son
  teklif günü, soğuma için) eklendi; eski kayıtlarda boş/soğuma süresi dolmuş başlar.
- **Riskler/düzeltme:** İlk sürümde (tüm 132 devlet, %8 olasılık, soğuma yok; sonradan %1'e düşürüldü) 10 yıllık senaryo testinde yıllık
  turlar sürekli kesintiye uğrayıp yalnızca ~4 ay ilerliyordu. Sınır komşusu kısıtı ve 180 günlük soğuma eklenerek
  10 yılda makul sayıda (gerçek oyunda birkaç yılda bir) teklife indirildi; `senaryo-1453.test.ts`'teki 10 yıllık
  test artık kesintileri reddederek ilerliyor ve en az 10 yıl geçtiğini doğruluyor (kesintiler nedeniyle takvim
  tarihi birkaç ay kayabilir — bu kasıtlı ve mevcut "tur durur, oyuncu karar verir" kuralıyla tutarlı).
- 242 sim testi (4 yeni: `yz-diplomasi.test.ts`), typecheck ve build geçti. 5173'te Playwright ile canlı
  doğrulandı: Candaroğulları'ndan saldırmazlık paktı teklifi kesintiyle geldi, `#dipTeklifi` penceresi doğru
  metinle açıldı, "Kabul et" JS hatasız çalıştı (kullanıcıya ekran görüntüsü gönderildi).
- **Sırada:** TASK-0020 2/3 (elçi gönderme), 3/3 (hükümdar/devlet portresi). Kullanıcı testi ve commit/push
  onayı bekliyor.

## 2026-10-30 — TASK-0019 (4/4): kuşatma gücü + arayüz tamamlama — TASK-0019 tamamlandı (Claude)

- **Kuşatma gücü:** `kusatma.ts: kusatmaGucu` artık kuşatan ordunun kompozisyonuna göre saldırı yüzdesi çarpanı
  kullanır (süvari ağırlıklı kuşatan daha güçlü, okçu ağırlıklı daha zayıf). Parametre etkisizse (piyade) eski
  formülle birebir aynı; sur saldırısındaki garnizon kaybı zaten bu güçten beslendiği için otomatik etkilendi.
- **Arayüz tamamlama:** Ordu listesi ve detayında, tamamen piyade olmayan ordular için tür kırılımı gösterilir
  (örn. "500 asker (500 süvari)"); birleştirme listesinde de aynı kırılım. Tamamen piyade ordularda ekstra bilgi
  gösterilmez (asker sayısı zaten yeterli). Muharebe raporu kırılımı kapsam dışı bırakıldı — `MuharebeRaporu`'na
  kompozisyon geçmişi eklemek ayrı bir şema değişikliği gerektirir, bu oturumun kapsamını aşan bir ek risk.
- 237 test (1 yeni), typecheck ve build geçti. 5173'te agent tarafından doğrulandı: 500 süvari toplandı, ordu
  listesinde "500 asker (500 süvari)", detayda "500 asker: 500 süvari." göründü. JS hatası yok.
- **TASK-0019'un 4 fazı da kod olarak tamamlandı.** Piyade/Okçu/Süvari artık asker toplama, maliyet/maaş, muharebe
  gücü, kayıp dağılımı, hareket hızı ve kuşatma gücünde gerçek fark yaratıyor. AI hâlâ yalnızca piyade topluyor.
- Kullanıcı testi ve commit/push onayı bekleniyor.

## 2026-10-30 — TASK-0019 (3/4): hareket hızı kompozisyona göre değişir (Claude)

- Ordu hızı artık kompozisyonun ağırlıklı ortalama hız yüzdesine göre hesaplanır (süvari ağırlıklı ordu temel
  hızın %150'si, piyade/okçu %100'ünde). Yeni asker toplama, ordu bölme ve birleştirme sonrası hız yeniden
  hesaplanır. Düşük riskli faz: `hareket.ts` dokunulmadı (zaten her orduyu kendi `hiz` alanından okuyor),
  değişiklik yalnızca ordu oluşturma/bölme/birleştirme noktalarında. Şema değişikliği yok.
- 236 test (2 yeni), typecheck ve build geçti. 5173'te agent tarafından süvari toplama ve tur ilerletme denendi
  (500 süvari toplandı, ordu listesinde çıktı), JS hatası yok; haritada hedef verip ETA karşılaştırma denemesi
  test betiğindeki bir seçici sorunu yüzünden tamamlanamadı — hız formülü sim testlerinde tam sayılarla doğrulandı.
- Kullanıcı testi ve commit/push onayı bekleniyor. Sonraki ve son faz: 4/4 Kuşatma gücü + arayüz tamamlama.

## 2026-10-30 — TASK-0019 (2/4): muharebe gücü ve kayıp dağılımı (Claude)

- **En riskli faz — savaş dengesini ilk kez gerçekten değiştiriyor.** Muharebe günü formülüne (`savas.ts:
  muharebeGunu`) kompozisyona göre saldırı/savunma çarpanı eklendi: saldıran taraf kompozisyonunun ağırlıklı
  saldırı yüzdesini, savunan taraf (varsa) ağırlıklı savunma yüzdesini kullanır. Süvari saldırırken, okçu
  savunurken daha güçlüdür. Savunan belirlenemiyorsa (açık arazi) iki taraf da saldırı yüzdesini kullanır.
  Parametre verilmezse (eski çağrılar) davranış birebir eskisiyle aynıdır — tüm mevcut testler değişmeden geçti.
  Kayıp dağılımı (türler arası oranlı) zaten 1. fazda uygulanmıştı, bu fazda değişmedi.
  Kuşatma gücü formülü bu fazda **değişmedi** (4. fazda gelecek). Şema değişikliği yok.
- 234 test (3 yeni), typecheck ve build geçti. Yeni testler: süvari saldıran eşit piyadeye göre düşmana daha çok
  kayıp verdirir; okçu savunan, saldırana (kendi kaybı değil, karşı tarafınki) daha çok kayıp verdirir — ikisi de
  gerçek `muharebeGunleri` akışından doğrulandı. 5173'te agent tarafından 20 turluk gerçek kampanya (ilan edilmiş
  savaş + çok sayıda AI savaşı) hatasız çalıştı, JS hatası yok.
- Kullanıcı testi ve commit/push onayı bekleniyor. Sonraki faz: 3/4 Hareket hızı (daha düşük risk).

## 2026-10-30 — TASK-0019 (1/4): birim çeşitliliği — veri modeli ve asker toplama (Claude)

- Üç birim türü: **Piyade** (taban), **Okçu** (ucuz, savunmada güçlü, saldırıda zayıf), **Süvari** (pahalı, hızlı,
  saldırıda güçlü, savunmada zayıf) — tüm sayılar TASLAK. Yeni modül `packages/sim/src/birim.ts`.
  `askerTopla` emrine `birim` parametresi; toplama maliyeti ve aylık maaş türe göre değişir (örn. 500 süvari
  bedeli 90, 500 piyade 50). Ordu birleştirme/bölme kompozisyonu oransal taşır; ikmalsizlik ve muharebe kayıpları
  da kompozisyonu asker sayısıyla tutarlı tutar.
  `OrduDurumu.asker` (toplam) **korunur** — kapasite, asayiş, görünürlük, donanma yükü değişmedi; yalnızca yeni
  `kompozisyon` alanı eklendi. **Muharebe gücü formülü bu fazda değişmedi** (2. fazda gelecek); bu yüzden savaş
  dengesi henüz etkilenmiyor. AI hâlâ yalnızca piyade topluyor.
  Kayıt şeması 22 → 23 (eski ordular tamamen piyade sayılır).
- İstemci: asker toplama formuna "Birim türü" seçimi (maliyet/maaş/saldırı/savunma/hız özet bilgisiyle); toplama
  listesinde tür adı gösterilir.
- 231 test (6 yeni), typecheck ve build geçti. 5173'te agent tarafından doğrulandı: süvari seçiminde bedel 90,
  piyadede 50 (oran %180 ile tutarlı); 500 süvari toplandı, bir ay sonra "Edirne Ordusu · 500 asker" olarak
  ordu listesinde çıktı. JS hatası yok.
- Kullanıcı testi ve commit/push onayı bekleniyor. Sonraki faz: 2/4 Muharebe gücü ve kayıp dağılımı (en riskli faz).

## 2026-10-30 — TASK-0018 (3/3): yanlış istihbarat + direniş ara kademesi — TASK-0018 tamamlandı (Claude)

- **Yanlış istihbarat:** Başarılı askerî/diplomatik casusluk görevinde %20 ihtimalle rapor çarpıtılır (gerçek sayının
  %70–%130'u arası); oyuncu bunu bilemez, rapor hâlâ "kesin" görünür. Çarpan görev başlarken belirlenip saklanır
  (sonradan sorgulanınca aynı sonucu verir, RNG tekrar tüketilmez). İsyanı destekleme görevini etkilemez.
  `casusluk.ts` (yeni alan `CasusEtkisi.carpanBinde`), `savas.ts` (askerî rapor), istemci `sim-isci.ts` (diplomatik
  rapordaki hazine).
- **Direniş ara kademesi:** İstikrarda huzursuzluk (%50) ile ayaklanma (%80) arasına yeni bir "Direniş" eşiği (%65)
  eklendi: bu aralıkta şehir ve çevresi gelirin tamamı yerine çeyreğini verir (önceden doğrudan yarıya düşüp
  ayaklanmaya geçiliyordu). `istikrar.ts`, istemci şehir panelinde yeni aşama adı ve açıklaması.
- Şema değişikliği yok (yeni alan isteğe bağlı, eski kayıtlarda yoksa doğru/1000 sayılır).
- 224 test (3 yeni + 1 güncellenen), typecheck ve build geçti. 5173'te agent tarafından doğrulandı: askerî istihbarat
  görevi hatasız başlatıldı, JS hatası yok; istikrar panelinin canlı ekran testi bu seferki denemede şehir seçilemediği
  için eksik kaldı — mantık sim testleriyle (direniş eşiği, gelir yüzdesi) doğrulandı.
- **TASK-0018'in 3 alt teslimi de kod olarak tamamlandı.** Kullanıcı testi ve commit/push onayı bekleniyor.

## 2026-10-30 — TASK-0018 (2/3): vasallık — yalnızca barışta "vasal yap" (Claude)

- Tam ilhak düzeyinde talepte (düşmanın bütün kalan arazi/şehri), galip taraf toprak devri yerine **vasal yap**
  seçebilir: kaybeden toprağını korur, efendisine aylık gelirinin %15'ini öder, efendisinin
  savaşlarına (saldıran ya da savunan tarafta) zorunlu katılır, kendi başına savaş ilan edemez. Efendisi
  "Serbest bırak" ile bağı koparır (ilişki +15, zamanla söner). Devlet yıkılırsa vasallık da kalkar.
  Yeni modül `packages/sim/src/vasallik.ts`; `baris.ts`, `emirler.ts`, `sistemler.ts` entegrasyonu. Kayıt şeması 21 → 22.
- İstemci: barış panelinde tam ilhak talebinde görünen "Vasal yap" seçeneği; devlet panelinde vasallık durumu ve
  "Serbest bırak" düğmesi; oyuncunun kendisi vasalsa "Savaş ilan et" düğmesi nedenle birlikte pasif.
- 222 test (5 yeni), typecheck ve build geçti. 5173'te agent tarafından doğrulandı: savaş ilan edilip barış penceresi
  açıldı, tam ilhak koşulu sağlanmadığında "Vasal yap" seçeneği doğru şekilde gizli kaldı, JS hatası yok.
  (Gerçek bir tam ilhak + vasal akışı, kuşatma/işgal gerektirdiği için ayrıca canlı denenmedi; sim testleri davranışı
  uçtan uca doğruluyor: kurma, savaş engeli, zorunlu katılım, vergi, serbest bırakma, şema dönüşümü.)
- Kullanıcı testi ve commit/push onayı bekleniyor. Sonraki alt teslim: 3/3 İsyan/casusluk derinliği.

## 2026-10-30 — TASK-0018 (1/3): ilhak sonrası ordu kaderi — OPEN-024 kapandı (Claude)

- Bir devlet tüm toprağını/şehrini kaybedip yıkıldığında, kalan ordusu artık **dağılır** (silinir); günlüğe
  "X yıkıldı; toprağı kalmayan N asker dağıldı" olayı yazılır (herkese görünür dünya olayı).
  `packages/sim/src/savas-sonu.ts: yikilanDevletleriTemizle`. MASTER_SPEC OPEN-024 bu kapsamda kapandı.
- 216 test (1 yeni + 1 güncellenen), typecheck ve build geçti. Değişiklik tek bir sim fonksiyonuyla sınırlı ve
  dar kapsamlı olduğu için bu alt teslimde ayrıca 5173 taraycı denemesi yapılmadı; otomatik testler (tam sayı
  kontrolü, değişmezler, günlük metni) davranışı doğruluyor.
- Kullanıcı testi ve commit/push onayı bekleniyor. Sonraki alt teslim: 2/3 Vasallık (yalnızca barışta).

## 2026-10-30 — TASK-0017 (4/4 Temel diplomasi): ticaret anlaşması ve saldırmazlık paktı (Claude)

- **Ticaret anlaşması:** oyuncu bir devlete teklif eder (eşik ilişki 10, ittifaktan daha kolay); kabul edilirse her iki
  tarafın liman ticaret gelirine +%10 (birden çok anlaşma en çok +%30'a kadar birikir). Savaş ilan edilince otomatik bozulur.
  Oyuncu istediği zaman `ticaretBoz` ile çıkabilir.
- **Saldırmazlık paktı:** oyuncu süre seçer (12/24/36 ay, varsayılan 24; eşik ilişki 0). Aktifken iki taraf da (oyuncu
  ve AI) birbirine savaş ilan edemez; süre dolunca otomatik kalkar. Savaştaki taraflar teklif edemez.
  AI'nın kendi savaş kararları da aktif paktı/ateşkesi zaten atladığı gibi bunu da atlar.
- Yeni modül yok; genişletme `diplomasi.ts`, `ticaret.ts`, `emirler.ts`, `yz-savas.ts`, `durum.ts` (şema 21), `kayit.ts`.
  İstemci: devlet panelinde "Ticaret ve saldırmazlık" bölümü (teklif/çık düğmeleri, tahmini AI cevabı, süre seçimi).
- 215 test (6 yeni), typecheck ve build geçti. 5173'te agent tarafından doğrulandı: haritadan bir devlet seçilip ticaret
  anlaşması teklif edildi ("İskoçya Krallığı'na ticaret anlaşması teklifi gönderildi"), tahmini cevap ve eşik metni doğru
  göründü, tur ilerletildi, dünya simülasyonu sorunsuz devam etti. JS hatası yok.
- **TASK-0017'nin 4 alt teslimi de kod olarak tamamlandı.** Kullanıcı testi ve commit/push onayı bekleniyor.

## 2026-10-30 — TASK-0017 (3/4 Ordu birleştirme/ayırma): checkbox listesi (Claude)

- Ordu birleştirme arayüzü: tek seçimlik açılır liste (`<select>`) yerine, haritada tıkla-seç ile birlikte kullanılabilen
  bir **tıklanabilir liste** (aynı konumdaki her aday ordu adı + asker sayısıyla, "etkin" vurgusu). İlk aday otomatik
  ön-seçili; "Birleştir" düğmesi seçim yokken pasif. Haritada diğer ordunun işaretine sağ tıklama akışı değişmedi.
  Ordu ayırma (asker sayısı girilen form) zaten vardı; değişmedi.
  Yeni backend mekaniği yok — sadece istemci arayüzü (`main.ts`, `index.html`); sim tarafında değişiklik yok.
- Derleme/tip kontrolü başarılı; sim testleri değişmediği için 209/209 geçti (bu teslim yalnızca istemci).
- 5173'te agent tarafından Playwright ile doğrulandı: ordu bölündükten sonra aynı konumdaki "Rumeli Ordusu" liste
  düğmesi olarak çıktı, seçili/etkin oldu, Birleştir ile iki ordu tek orduya indi (3 → 2). JS hatası yok.
- Kullanıcı testi ve commit/push onayı bekleniyor. Sonraki alt teslim: 4/4 Temel diplomasi (ticaret anlaşması,
  saldırmazlık/ateşkes paktı).

## 2026-10-30 — TASK-0017 (2/4 Asker basma): toplama iptali (Claude)

- Süren bir asker toplamayı iptal etme emri eklendi (`toplamaIptal`): bedel ve insan gücü tam iade edilir, borç oluşmaz.
  Kuyruk görünürlüğü ve maliyet/süre önizlemesi zaten vardı (mevcut `toplamaListesi`/`toplamaBilgi`); bu teslim onu tamamlıyor.
  Sol panelde "Asker toplama" listesindeki her sürmekte olan toplamanın yanında "İptal" düğmesi.
- Kayıt şeması 19 → **20**: süren toplamalara kimlik ve sabit iade bedeli eklendi (teknoloji sonradan değişse de iade
  toplandığı andaki orana göre sabit kalır); eski kayıtlarda otomatik atanır.
- `packages/sim/src/durum.ts` (AskerToplama.id/bedel, sonrakiToplamaId, değişmezler), `kayit.ts` (19→20 dönüşümü),
  `emirler.ts` (yeni emir + doğrulama + uygulama). İstemci `sim-protokol.ts`, `sim-isci.ts`, `main.ts`.
- 209 test (3 yeni), typecheck ve build geçti. 5173'te agent tarafından doğrulandı: 1.000 asker toplama emri (bedel 100,
  hazine 9.400 → 9.300), bir hafta sonra listede "23 gün kaldı · İptal"; iptal sonrası hazine 9.400'e döndü, liste boşaldı.
  JS hatası yok.
- Kullanıcı testi ve commit/push onayı bekleniyor. Sonraki alt teslim: 3/4 Ordu birleştirme/ayırma (checkbox listesi +
  haritada tıkla-seç).

## 2026-10-30 — TASK-0017 (1/4 Ekonomi): vergi oranı, şehir bazlı gelir dökümü, hazine geçmişi (Claude)

- DEC-0066: ekonomi, asker basma, ordu birleştirme/ayırma, temel diplomasi derinleştirmesi onaylandı; ilk alt teslim ekonomi.
- Yeni **vergi oranı** (düşük/orta/yüksek, varsayılan orta): arazi ve yapı gelirini %80/%100/%130 ölçekler; istikrar riskine
  küçük bir bileşen ekler (yüksek +15, düşük −5). Oyuncu sol panelde "Aylık bütçe" altında üç düğmeyle değiştirir; yeni emir
  `vergiAyarla`. Yeni modül `packages/sim/src/vergi.ts`.
- Bütçe özetine **şehir bazlı gelir dökümü** (yapı + ticaret geliri, arazi geliri poligon bazlı olduğu için ayrı kalır) ve
  **hazine geçmişi** (son 12 ayın net gelir-gider farkı) eklendi; "Şehir bazlı gelir ve hazine geçmişi" alt panelinde gösterilir.
- Kayıt şeması 18 → **19**: eski kayıtlarda vergi oranı orta, hazine geçmişi boş olarak kurulur; geri dönüşsüz veri kaybı yok.
- 206 test (6 yeni); tip kontrolü ve derleme başarılı. 5173'te gerçek düğmelerle doğrulandı: yüksek vergiye geçince aylık gelir
  1.282'ye çıktı (önceki orta orana göre arttı), buton "etkin" oldu, tur ilerleyince hazine geçmişinde "+542" göründü, şehir
  listesinde yapı/ticaret payları ayrı görünüyor. JS hatası yok.
- Kullanıcı onayı: DEC-0066 (“1-öneri 2-seçilsin 3-ikiside”, 2026-10-30). Kullanıcı testi ve sıradaki alt teslim (asker basma)
  onayı bekleniyor.

## 2026-10-29 — TASK-0015: oynanış hatalarının düzeltilmesi (Codex)

- DEC-0064 ile H-01…H-07, ilhak arayüzü ve kayıt/test doğrulaması düzeltildi; kullanıcı kabulü bekleniyor.
- Bütçe düşürünce geçmiş harcama ve kayıt yüklenebilirliği korunur. Ortak `savas-sonu.ts` ilhakın bitirdiği üçüncü devlet
  savaşlarındaki muharebe/işgali temizler; sağlam içerik özetli eski savaş kalıntıları yüklemede açıklamayla onarılır.
- Barışta devredilen ve kalan arazi/şehir, tam ilhak bilgisi; ayrı sahibi olan şehre harita etiketi ve çevre sahipliği açıklaması.
- Dünya değişiminde otomatik kayıt dönemi/rapor önbelleği sıfırlanır. Ayaklanmada tersane bekler; taşınan asker toplamda sayılır;
  fetih sonrası geçersiz isyan desteği uygulanmaz. Şema 18 korunur.
- 198 test; gerçek hareket ağıyla kampanya, kayıt/determinizm ve ilişkisel değişmezler. Tip kontrolü ve derleme başarılı.
- Ayrıntılar ve tıklama adımları: `docs/qa/BUG-DUZELTMELERI-TEST.md`. Commit/push yapılmadı.

## 2026-10-29 — TASK-0014: oynanış hataları incelemesi (Codex)

- DEC-0063: kullanıcı Osmanlı–Eflak ilhakı ve benzer sorunların ayrıntılı araştırılmasını istedi.
- `docs/qa/OYNANIS-HATA-INCELEMESI.md`: 7 doğrulanmış oynanış hatası; ilhak önizlemesi, kayıt doğrulaması ve test kapsamı bulguları;
  tekrar üretme sonuçları ve düzeltme sırası. Üretim kodu düzeltmesi yapılmadı.
- 190 test, typecheck ve build geçti; 5173'te ayrı profil ve gerçek hareket ağıyla 3 tohum × 10 yıl denendi.
- `DEVIR-TESLIM.md`: güncel iş ve araştırma sonucu öne alındı; eski notlar arşiv olarak korundu. Commit/push yapılmadı.

## 2026-10-29 — TASK-0013 / 10b: hata yakalama ve kurtarma (Claude)

- DEC-0062: 10a kabul; otomatik kayıt sıklığı ayarı istendi.
- İstemci: genel hata yakalama (arayüz hataları, reddedilen sözler, simülasyon işçisinin çökmesi), oyunun kendi hata penceresi,
  yerel **hata raporu** dosyası (kişisel veri yok, gönderim yok), **son otomatik kayda dön** kurtarması (işçi yeniden başlatılır,
  eski otomatik kayıtlara sırayla düşer). İşçi tur ortasındaki hatadan sonra yeni oyun/yükleme dışındaki istekleri reddeder.
- Ayar: **Otomatik kayıt** sıklığı (her tur / oyunda ayda bir / yılda bir / kapalı). `surum.ts`: 0.9.0.
- `docs/qa/ASAMA-10B-TEST.md`.

## 2026-10-29 — TASK-0013 / 10a: kayıt güvenilirliği (Claude)

- DEC-0061: Aşama 10 kartı (sürüm 0.9.0; dağıtım yalnızca yerel zip).
- `kayit.ts`: kayıt paketine içerik özeti; güncel şemada değiştirilmiş ya da bozulmuş kayıt anlaşılır hatayla reddedilir (eski kayıtlar özetsiz yüklenir).
- İstemci: dönüşümlü otomatik kayıt (son 3 tur), her kaydı **⭳ dosyaya indirme**, **⭱ dosyadan yükleme** (simülasyonda doğrulanır),
  bozuk otomatik kayıtta "daha eski otomatik kaydı deneyin" önerisi.
- Testler: içerik özeti ve yarım dosya; şema 3'ten 18'e tam dönüşüm zinciri (toplam 189). `docs/qa/ASAMA-10A-TEST.md`.

## 2026-10-29 — Aşama 9 kapanışı; Aşama 10 taslağı (Claude)

- DEC-0060: 9e kabul (sekmelerde ← → artık haritayı kaydırmıyor); **Aşama 9 kapandı, oynanabilir sürüm kabul edildi.**
- `tasks/TASK-0013.md`, `docs/milestones/ASAMA-10.md`: yayın hazırlığı taslağı (onay bekliyor).

## 2026-10-29 — TASK-0012 / 9e: performans ve erişilebilirlik (Claude)

- DEC-0059: 9d kabul.
- `vite.config.ts`: three.js ayrı parça; yazı tipleri yalnızca Latin/Latin genişletilmiş alt kümeleri.
- Ayar sekmesinde **Arayüz boyutu** (%90/%100/%115/%130; paneller ve pencereler ölçeklenir, harita etkilenmez); görünür klavye
  odağı; sekmelerde ← →; `prefers-reduced-motion`; ≤1180 px'te lejant gizli, ≤980 px'te üst çubuk iki satır ve dar panel.
- Ölçümler `docs/qa/ASAMA-9E-TEST.md`.

## 2026-10-29 — TASK-0012 / 9d: kaynaklar ve lisans kontrolü (Claude)

- DEC-0058: 9c kabul.
- `docs/LISANS-KONTROL.md`: veri, yazılım ve yazı tipi lisansları; dış ağ isteği yok; açık noktalar (tahmini tablolar doğrulanmadı,
  yayında OFL metinleri eklenecek). `veri/senaryo-1453/KAYNAKLAR.md`: bütün veri dosyaları ve tahmini tablolar.
- Oyun içi **Kaynaklar** ekranı ayrıntılandı. `packages/sim/test/veri-kaynak.test.ts` (3 test; toplam 187).

## 2026-10-29 — TASK-0012 / 9c: oyun içi rehber ve sözlük (Claude)

- DEC-0057: 9b kabul ("biraz durağan ama okey").
- `packages/istemci/src/rehber.ts`: 12 adımlı ilk oyun rehberi (ilgili öğeyi vurgular, İleri/Geri/Kapat, Esc); ilk yeni oyunda bir
  kez kendiliğinden açılır. Menü → **Nasıl oynanır**: kısa kurallar, rehberi yeniden başlatma, aranabilir sözlük (`sozluk.ts`, 29 terim).
- `docs/qa/ASAMA-9C-TEST.md`.

## 2026-10-29 — TASK-0012 / 9b: tarihî nüfus, arazi verimi, denge (Claude)

- DEC-0056: 9a kabul; onay penceresi menünün üstünde.
- `veri/senaryo-1453/sehir-nufus.json`: 193 şehrin 1453 tahmini nüfusu (test değerleri 40.000/10.000 yerine); senaryo üreticisi uygular.
- Arazi verimi (`BirimDurumu.verim`): birimin ortalama ETOPO zorluğundan 12/10/9/7; arazi geliri verimle ölçeklenir. Şema 18.
- AI denge: fırsatçı fetih kuralı (çok güçlüyse dostça olmayan komşuya, düşük olasılıkla); kötü ilişkili hedef öncelikli;
  gerekçe metninde "fırsat". AT-007 testi yalnızca Osmanlı arazilerine daraltıldı (AI kendi arasında savaşabilir).
- 50 yıllık simülasyon raporu: `docs/qa/ASAMA-9B-TEST.md`.

## 2026-10-29 — TASK-0012 / 9a: ana menü, devlet seçimi, kayıt yuvaları (Claude)

- DEC-0055: Aşama 9 kartı onaylandı.
- İstemci: açılış ana menüsü; 132 devletin seçilebildiği devlet seçimi (arma, hükümdar ya da "kurgusal hükümdar", arazi,
  din, zorluk ipucu; arama, sıralama, çift tıkla başla); üst çubukta Kaydet / Yükle / ☰ Menü; adlandırılmış kayıt yuvaları
  (`kayit-deposu.ts`: listele, sil), "Devam et" son kayıttan; Kaynaklar sayfası (ilk sürüm). Yeni oyun rastgele tohumla.
- `docs/qa/ASAMA-9A-TEST.md`.

## 2026-10-29 — Oyunun kendi açılır liste penceresi; Aşama 9 taslağı (Claude)

- DEC-0054: 8c kabul, Aşama 8 kapandı.
- `packages/istemci/src/secim.ts`: bütün açılır listelerde (select) tarayıcının liste penceresi yerine oyunun temalı listesi
  (fare, klavye: ↑ ↓ Home End Enter Boşluk Esc, harfle arama); select öğesi ve olayları aynen korunur.
- `tasks/TASK-0012.md`, `docs/milestones/ASAMA-9.md`: Aşama 9 kapsam taslağı (onay bekliyor).

## 2026-10-29 — TASK-0011 / 8c: casusluk (Claude)

- `packages/sim/src/casusluk.ts`: askerî ve diplomatik istihbarat, isyanı destekleme (7c risk bileşeni "Yabancı kışkırtma"),
  sabotaj; bedel/hazırlık/başarı olasılığı; yakalanma ve ilişki bedeli ("Yakalanan casus"); AI'nın sınırlı kullanımı.
  Askerî istihbarat görünürlüğü genişletir ve sayıları kesinleştirir (yalnızca bu yolla, AT-013). Kayıt şeması 17.
- İstemci: devlet panelinde Casusluk (görev + şehir + başlat), istihbarat raporu; Savaş sekmesinde görev listesi;
  kesin sayılı yabancı ordu işaretleri (👁).
- `packages/sim/test/casusluk.test.ts` (4 test; toplam 184), `docs/qa/ASAMA-8C-TEST.md`.

## 2026-10-29 — Sol panel düzeni, kalyon teknolojisi, TASK-0011 / 8b ticaret (Claude)

- DEC-0052: 8a kabul; deniz tablosu onayı; kalyon teknolojiye bağlandı; sol panel düzeni.
- DEC-0053: panel 340 px; sayı/liste/onay kutuları oyunun temasıyla (tarayıcı varsayılanı değil); 8b kabul.
- İstemci: sol panel sekmeli (Devlet, Ordu, Deniz, Şehir, Savaş, Günlük, Ayar; son sekme hatırlanır), üstte devlet
  arması + ad + hükümdar; seçili yabancı devletin paneline de arma. Armalar oyunun ürettiği SVG kalkanlardır
  (devlet rengi + resmî din simgesi; lisanslı görsel yok). Yatay kaymalar giderildi. Ordu/donanma seçilince ilgili sekme açılır.
- `teknoloji.ts`: "Kalyon İnşası" (askerî, ön koşul Büyük Top Dökümü); kalyon yapımı bu teknolojiyi ister.
- `packages/sim/src/ticaret.ts`: liman ticaret geliri; abluka, savaş denizi, ticaret geçidi (boğazlar), ambargo
  (`ambargo` emri, ilişki bileşeni). Bütçede "ticaret" satırı, şehir panelinde ticaret ve nedenleri, devlet panelinde
  "Ambargo koy/kaldır". `deniz.json`'a ticaret geçitleri eklendi. Kayıt şeması 16.
- `packages/sim/test/ticaret.test.ts` (5 test; toplam 179), `docs/qa/ASAMA-8B-TEST.md`.

## 2026-10-29 — TASK-0011 / 8a: donanma ve deniz kontrolü (Claude)

- DEC-0050: 7d kabul, Aşama 7 kapandı. DEC-0051: Aşama 8 kartı; gemi türleri kadırga ve kalyon.
- `packages/sim/src/deniz.ts`: deniz bölgeleri ve limanlar; donanma (kadırga/kalyon, moral, bölge rotası); limanda gemi
  inşası (bedel, süre, borç yok); otomatik deniz muharebesi (çekilme/batma, tur durur); bölge kontrolü; düşman kontrolündeki
  boğazın ordulara kapanması; denizden abluka (liman kuşatmasında erzak 2 kat hızlı); çıkarma (ordu gemiye binip hedef limana
  iner); bakım gideri; basit AI donanma davranışı; görünürlük (yaklaşık gemi sayısı). Kayıt şeması 15.
- `veri/senaryo-1453/deniz.json`: 29 deniz bölgesi, 70 liman, 6 boğaz, 15 başlangıç donanması ([TASLAK]).
- İstemci: haritada donanma işaretleri, sol panelde Donanmalar (yelken aç, çıkarma), liman şehrinde tersane.
- `packages/sim/test/deniz.test.ts` (7 test; toplam 173), `docs/qa/ASAMA-8A-TEST.md`.

## 2026-10-29 — TASK-0010 / 7d: yerel yönetim (Claude)

- DEC-0048: 7c kabul (Codex uygulaması commit edildi, `463b49b`). DEC-0049: 7d kapsamı. DEC-0050: 7d kabul, Aşama 7 kapandı.
- `packages/sim/src/yonetim.ts`: şehir başına aç/kapa yerel yönetici, oyuncunun aylık toplam bütçe tavanı ve hazine alt
  sınırı; önce riskli şehre bağış, sonra en kârlı tarla/pazar; şehir başına ayda bir iş; oyuncunun inşaatı/bekleyen emri
  olan şehre dokunmaz; her harcama günlükte; borç yok. Varsayılan kapalı, bütçe 0. Kayıt şeması 14.
- İstemci: sol panelde "Yerel yönetim" (tavan, alt sınır, bu ay harcanan), şehir panelinde yönetici aç/kapa.
- `packages/sim/test/yonetim.test.ts` (6 test; toplam 165), `docs/qa/ASAMA-7D-TEST.md`.

## 2026-10-29 — TASK-0010 / 7c: istikrar ve isyan riski (DEC-0047)

- `istikrar.ts`: deterministik aylık risk bileşenleri, önceki aya göre farklar, uyarı,
  huzursuzluk ve üç ay yüksek riskte ayaklanma; risk/asayişle sona erme.
- Şehir ve çevre gelirleri yarılanır/sıfırlanır; ayaklanmada yeni ve süren asker/inşaat işleri durur.
- Borçsuz bağış/imar yardımı, kuyrukta para rezervasyonu, zamanla sönüm; AI aynı kuralları kullanır.
- Barışla fetih tarihi; kayıt şeması 13, 12→13 ve önceki dönüşümlerin zinciri/testleri.
- Şehir risk/neden/değişim paneli, bağış düğmesi, asker toplama/inşaat durma açıklaması,
  İstikrar harita modu ve renk açıklaması.
- 14 yeni davranış testi + yeni modül determinizm taraması: toplam 158 test;
  typecheck/build ve 5173 Chrome denemeleri başarılı. QA/ASAMA-7C-TEST.md eklendi.
- Denge değerleri TASLAK. 7d başlamadı; 7c kabulü ve commit/push izni bekleniyor.

## 2026-10-29 — TASK-0010 / 7b: nüfus grupları, din/kültür, göç, iskân (Claude)

- DEC-0044: 7a kabul. DEC-0045: 7b kapsamı.
- `packages/sim/src/nufus.ts`: şehir başına din × kültür grupları (toplam = nüfus, değişmez denetimi), yıllık doğal
  artış, kuşatma/işgal kaybı ve en yakın güvenli şehre göç, `iskan` emri (bedel, 60 gün, en çok %20), resmî din ve
  aynı din +10 / farklı din ailesi −10 ilişki bileşeni. Test amaçlı günlük rastgele nüfus artışı kaldırıldı. Şema 12.
- `veri/senaryo-1453/nufus.json`: 1453 nüfus grupları tahmini ([TASLAK]); senaryo üreticisi gömer.
- İstemci: şehir panelinde nüfus dağılımı ve iskân; devlet panelinde resmî din; Din ve Kültür harita modları (lejantlı).
- `packages/sim/test/nufus.test.ts` (6 test; toplam 143), `docs/qa/ASAMA-7B-TEST.md`.

## 2026-10-29 — TASK-0010 / 7a: hükümdar ve veraset (Claude)

- DEC-0041: Aşama 6 kapandı. DEC-0042: Aşama 7 başladı. DEC-0043: 7a kapsamı.
- `packages/sim/src/hanedan.ts`: hükümdar (yetenekler, meşruiyet, kurgusal işareti), yaşa bağlı ölüm (aylık),
  veraset gelenekleri (babadan / açık / seçimli), tarihî halef ve alternatif soy, AI halef seçimi, oyuncu için
  `halefSec` emri ve tur başında divanın otomatik seçimi. Etkiler: yönetim → arazi geliri, askerlik → muharebe
  gücü, diplomasi → başkalarının bakışı (en çok ±%9 / ±9). Kayıt şeması 11.
- `veri/senaryo-1453/hukumdarlar.json`: 31 devletin 1453 hükümdarı ve tarihî halefi, veraset gelenekleri,
  kurgusal ad havuzları ([TASLAK]); senaryo üreticisi gömer.
- İstemci: sol panelde Hükümdar kartı, devlet panelinde hükümdar, oyunun kendi veraset penceresi.
- `packages/sim/test/hanedan.test.ts` (6 test; toplam 136), `docs/qa/ASAMA-7A-TEST.md`.

## 2026-10-29 — TASK-0009 / 6c: AI savaş ilanı, sefer, kuşatma, barış (Claude)

- DEC-0040: 6b kabul edildi; garnizon tabanı 0. DEC-0041: 6c kabul edildi, Aşama 6 kapandı.
- `packages/sim/src/yz-savas.ts`: gerekçeli AI savaş ilanı (komşu, kötü ilişki, görünür bilgiye dayalı güç tahmini,
  olasılık, ateşkes), sefer (kuşatma, başkent savunması, işgal, en yakın hedef), AI-AI barış ve oyuncuya barış teklifi.
- Barış/kuşatma doğrulaması oyuncudan bağımsızlaştırıldı (`barisDogrula/barisiUygula(…, devlet)`); oyuncu yalnızca
  kendi devleti/ordusu adına emir verir. `barisCevap` emri; ateşkes kaydı. Kayıt şeması 10.
- Oyuncuya savaş ilanı ve barış teklifi turu durdurur; teklif penceresi (Kabul / Reddet / Sonra), Savaşlar listesinde
  "Gelen teklifi cevapla". AI-AI savaş ve barışları dünya haberi olarak günlükte.
- `packages/sim/test/yz-savas.test.ts` (6 test; toplam 129). 15 yıllık gerçek senaryo: yılda 0–4 yeni savaş,
  toprak değişimi, 3 devlet yıkıldı; yıllık tur ~0,3–0,7 sn; değişmez hatası 0.

## 2026-10-29 — TASK-0009 / 6b: AI ekonomi ve ordu hazırlığı (Claude)

- DEC-0039: 6a ve başlangıç ilişki tablosu kabul edildi. DEC-0040: 6b kabul; garnizon tabanı 2.000 → 0
  (başlangıçta eksi bütçeli devlet 71 → 0).
- `packages/sim/src/yz.ts`: AI devletleri 30 günde bir (günlere yayılmış) karar verir; yedek para korunur;
  tehdit (savaş ya da düşmanca büyük komşu — yalnızca açık bilgi) varsa asker → sur → askerî araştırma,
  yoksa araştırma → tarla/pazar → asker. Emirler oyuncuyla aynı doğrulamadan geçer (`emirUygula` ayrıldı).
- Başka devletlere özel olaylar oyuncu günlüğüne yazılmaz; yıllık "dünya özeti" olayı. Kayıt şeması 9.
- `packages/sim/test/yz.test.ts` (5 test; toplam 122). 10 yıllık gerçek senaryo ölçümü: yıllık tur ~0,2 sn,
  değişmez hatası yok.

## 2026-10-29 — TASK-0009 / 6a: ilişkiler, ittifak, hediye, diplomasi haritası (Claude)

- DEC-0038: Aşama 6 kartı onaylandı.
- `packages/sim/src/diplomasi.ts`: yönlü ilişki puanı (tarih, geçmiş savaş, hediye, bozulan ittifak,
  reddedilen çağrı, müttefiklik, savaş, güçlü komşu kaygısı, saldırganlık, ortak düşman); savunma ittifakı
  (AI kabul/ret gerekçeli), müttefik çağrısı, hediye (bedel alıcının büyüklüğüne göre, birikme sınırı),
  aylık sönüm. Emirler: `ittifakTeklif`, `ittifakBoz`, `hediye`; müttefike savaş ilanı engeli. Şema 8.
- `veri/senaryo-1453/iliskiler.json`: 1453 başlangıç ilişkileri (tahmini, [TASLAK]); senaryo üreticisi gömer.
- İstemci: devlet panelinde Diplomasi bölümü; üst çubukta Diplomasi harita modu ve lejant; savaş ilanı
  onayında müttefik ve saldırganlık uyarısı.
- `packages/sim/test/diplomasi.test.ts` (6 test; toplam 116), `docs/qa/ASAMA-6A-TEST.md`.

## 2026-10-29 — Aşama 4 ve 5 kapanışı; Aşama 6 taslağı (Claude)

- DEC-0037: kullanıcı testi başarılı; Aşama 4 ve Aşama 5 kapandı (otomasyon Aşama 7'ye ertelendi).
- `tasks/TASK-0009.md` ve `docs/milestones/ASAMA-6.md`: diplomasi ve AI devletleri taslağı (onay bekliyor).

## 2026-10-29 — TASK-0008 / 5c: teknoloji ağacı (Claude)

### Eklendi
- DEC-0035: 9 teknolojilik liste onaylandı. DEC-0036: 5c kabul edildi; kullanıcı testleri 5173'te.
- `packages/sim/src/teknoloji.ts`: üç alan (ekonomik, askerî, idari), ön koşullar, en çok 2 eş zamanlı
  araştırma (farklı alanlarda), bedel emirde ayrılır ve tur başında ödenir (borç yok); `arastir` emri,
  günlük `arastirma` sistemi. Kayıt şeması 7 (6 → 7 dönüşümü).
- Etkiler: tarla/pazar 4. seviye, pazar +5, arazi geliri 11; top ×1,5 garnizon kaybı; Daimî Ordu
  muharebe gücü +%10; asker toplama −%25 bedel ve 20 gün; inşaat süresi −%20; insan gücü +%50
  (bir defa); sur 6. seviye ve −%25 bedel. Değerler `denge.ts`'te [TASLAK].
- İstemci: üst çubukta **Teknoloji** düğmesi ve oyunun kendi penceresi (3 sütun, kartlar, Araştır +
  onay); sol panelde **Araştırmalar** listesi; toplama ve yatırım bilgileri teknolojiye göre.
- `packages/sim/test/teknoloji.test.ts` (7 test; toplam 109), `docs/qa/ASAMA-5C-TEST.md`.

## 2026-10-29 — TASK-0008 / 5b: şehir yatırımları (Claude)

### Eklendi
- DEC-0033 (4c/5a kısmi test, 5b kapsamı); Codex'in 4b/4c/5a işi commit edildi (`312b2d9`).
- `packages/sim/src/yatirim.ts`: tarla, pazar, sur; bedel rezervi, yapım süresi, kuşatmada
  durma, el değiştirince iptal; yapı geliri. `insaat` emri; kayıt şeması 6 (5 → 6 dönüşümü).
- Bütçe özeti: arazi ve yapı geliri ayrı.
- İstemci: şehir panelinde yatırımlar, sol panelde şehir seçici ve süren inşaatlar.
- `packages/sim/test/yatirim.test.ts` (6 test; toplam 101), `docs/qa/ASAMA-5B-TEST.md`.
- DEC-0034: 5b kabul edildi; 5c teknoloji ağacı taslağı TASK-0008'e yazıldı (onay bekliyor).

## 2026-10-29 — TASK-0008 / 5a: bütçe görünürlüğü ve devir

- DEC-0032: kullanıcı 4c testini sonraki teslimle birleştirdi, Aşama 5'e geçişi yetkilendirdi;
  4c ve Aşama 4 resmî kabulü açık kaldı.
- TASK-0008 ve ASAMA-5 açıldı; sınırlı 5a bütçe özeti tamamlandı. 5b/5c kapsam önerisi yanıt bekliyor.
- `ekonomi.ts`: mevcut gelir/maaş/kuyruk rezervasyonu özeti; aylık test geliri aynı kaynaktan hesaplanır.
- İstemci: “Aylık bütçe özeti”, hazine/rezerv/kullanılabilir para/gelir/maaş/net fark ve prototip açıklaması.
- Yeni ekonomik kural, denge değeri veya kayıt şeması değişikliği yok.
- 94 test, tip kontrolü ve build başarılı; Chrome'da rezervasyon/ay başı hesabı doğrulandı.
- Devir ve test belgeleri güncellendi. 4b + 4c + 5a commit/push edilmedi.

## 2026-10-29 — TASK-0007 / 4c: kuşatma, gerçek işgal ve barış

### Eklendi
- DEC-0031: 4c'ye başlama onayı; Aşama 4 kapanışı kullanıcı kabulü bekliyor.
- `packages/sim/src/kusatma.ts`: 3 gün bekleyişle arazi kontrolü; şehir yakınında açık emirle
  kuşatma, prototip sur ve garnizonlar, kara ablukası/surlara saldırı/teslim bekleme,
  güç yeterliliği, erzak, saldırı kayıpları, kuşatmadan ayrılma ve şehir düşmesinde tur kesintisi.
- `packages/sim/src/baris.ts`: işgal değerinden açıklanabilir savaş skoru; şehir ve araziyi
  ayrı talep etme, puan ve peşin tazminat doğrulaması, kalıcı sahiplik ve başkent güncellemesi,
  ilgili savaşa ait kontrol/muharebe/kuşatma temizliği; kalan orduların yürüyerek dönüşü.
- `packages/istemci/src/savas-arayuzu.ts`: kuşatma paneli, yöntem/garnizon/erzak açıklamaları,
  ayrı şehir-arazi seçimli barış ekranı, Worker'dan talep önizlemesi ve oyun içi onay penceresi.
- Barış geçmişi, şehir savunma bilgisi, “Şehre yürü” düğmesi ve işgal ilerleme açıklaması.
- 23 yeni davranış testi + iki yeni modülün determinizm kontrolü: toplam 89 test.
- Kabul kanıtları ve kullanıcı adımları: `docs/qa/ASAMA-4C-TEST.md`.

### Değişti
- Kayıt şeması 5; şema 3 ve 4 kayıtları mevcut ordu/para/toplama/emirler korunarak dönüştürülür.
- Barış ve kayıt yüklemesinde harita dolguları, siyasi sınırlar, seçim bilgileri, devlet-şehir
  eşlemeleri, başkent işaretleri ve etiketler aynı sahiplik durumuna güncellenir.
- Test işgali düğmesi kaldırıldı. Eski kayıt/kabul testleri için çekirdekteki eski test emri korunur.
- Kuşatan ordu bölünemez/birleştirilemez; hareket emri kuşatmadan çıkarır. Onay penceresinin
  Escape dinleyicisi kapatılırken doğru biçimde kaldırılır.
- Denge değerleri yalnızca `denge.ts` içinde TASLAK. Yeni veri kaynağı/bağımlılık eklenmedi.
- 4c ve Aşama 4 kullanıcı kabulü bekliyor; Aşama 5 başlamadı. Commit/push yapılmadı.

## 2026-10-29 — 4b kullanıcı kabulü

- Kullanıcı 4b testini başarılı buldu; kabul DEC-0030 olarak kaydedildi.
- AGENTS, TASK-0007, Aşama 4, test raporu ve devir teslim durumları güncellendi.
- 4c başlama onayı bekliyor; üretim kodu değişmedi, commit/push yapılmadı.

## 2026-10-29 — TASK-0007 / 4b: asker toplama, maaş, ikmal, böl/birleştir

### Eklendi
- DEC-0029: kullanıcının 4b'ye geçiş onayı.
- `packages/sim/src/ordu.ts`: nüfustan türetilmiş ek insan gücü havuzu, 30 günlük toplama,
  aylık zorunlu ordu maaşı, eksi hazinede günlük moral cezası, düşman toprağında asker/moral aşınması.
- `askerTopla`, `orduBol`, `orduBirlestir` emirleri; kuyrukta ortak hazine ve insan gücü kontrolü,
  tur başında yeniden doğrulama; aynı konumda bekleyen ordularda asker ve tutum korunumu,
  asker sayısıyla ağırlıklı moral ortalaması. Toplama, şehir veya çevresi işgal edilirse bekler.
- İstemcide şehir/asker seçimi, bedel/süre/havuz, toplama kuyruğu, maaş ve ikmal açıklamaları,
  ordu bölme ve birleştirme kontrolleri.
- 15 yeni davranış testi + yeni modülün determinizm kontrolü: toplam 64 test.
  Tarayıcı kabul kanıtları: `docs/qa/ASAMA-4B-TEST.md`.

### Değişti
- Kayıt şeması 4; 4a'nın şema 3 kayıtları mevcut ordular, para ve emirler korunarak dönüştürülür.
- Hareket ve prototip ekonomi denge sabitleri de `denge.ts` içine taşındı; sayıları korunuyor.
- Maaş devletin toplam askerinden hesaplanır; bölme/birleştirme maaşı değiştirmez.
- Haritadaki ordu işaretine sağ tıklamak ordunun güncel konumunu hedefler; iki orduyu
  birleştirmek için tam olarak buluşturmak mümkün. Muharebe/geri çekilme sırasında yürüyüş
  ve durdurma, bekleyen bölme/birleştirme ile çakışan emirler gerekçeleriyle reddedilir.
- Maaş olayları yalnızca oyuncu için günlüğe yazılır; yabancı devletlerin mali bilgileri
  gösterilmez ve uzun turlarda oyuncunun hareket olayları gereksiz maaş olaylarıyla silinmez.
- 4b kullanıcı kabulü bekliyor; 4c başlamadı. Commit/push yapılmadı.

## 2026-10-29 — TASK-0007 / 4a: savaş, görünürlük, muharebe, moral

### Eklendi
- DEC-0027 (Aşama 4 kararları), TASK-0007, `docs/milestones/ASAMA-4.md`.
- `packages/sim/src/savas.ts`: savaş durumu, görünürlük (AT-013), muharebe başlatma ve günlük
  muharebe, takip, geri çekilme, dağılma, moral toparlanması, ortamdan bağımsız sayı biçimi.
- `packages/sim/src/denge.ts`: tüm [TASLAK] denge değerleri.
- Emirler: `savasIlan`, `orduTutum`; garnizon orduları; kayıt şeması 3.
- İstemci: yabancı ordu işaretleri (yaklaşık büyüklük; tıklayınca devleti seçer), savaş ilanı,
  tutum seçimi, moral göstergesi, savaşlar listesi, muharebe raporu penceresi.
- 7 yeni test (toplam 48); determinizm kurallarına yerel ayar biçimlendirme yasağı.

### Değişti
- Savaş ilanı onayı tarayıcı penceresi yerine oyunun kendi onay ekranında (DEC-0028).
- `DEVIR-TESLIM.md` eklendi; AGENTS.md'ye devir teslim ve arayüz/iletişim kuralları (DEC-0028).
- Senaryo verisi: şehirlere hareket ağı düğümü ve konum eklendi.
- Erişim kuralı: savaşta olunan devletin toprakları geçilebilir.

## 2026-10-29 — TASK-0006: Aşama 3 siyasi kontrol ve ordu hareketi

### Eklendi
- DEC-0025 (hareket ağı, ETOPO 2022 zorluğu, erişim kuralı, başlangıç orduları).
- `araclar/ag-uret.mjs`: parça başına düğümlü hareket ağı, boğaz geçitleri, nehir geçişleri,
  ETOPO 2022 engebesinden zorluk.
- `packages/sim/src/hareket.ts`: Dijkstra yol bulma, rota adımları, günlük ilerleme, tahmini varış
  ve gerekçe; tam sayı aritmetiği.
- Ordu modeli, şehir askerî kontrolü, `orduHedef` / `orduDur` / `testIsgal` emirleri,
  `ordu-hareket` sistemi; kayıt şeması 2.
- İstemci: ordu işaretleri, sağ tıkla hedef, planlı (kesikli) ve yürüyen (düz) rota, ordular
  paneli, işgal taraması, bilgi panelinde askerî kontrol.
- `veri/senaryo-1453/KAYNAKLAR.md`, `docs/milestones/ASAMA-3.md`; 9 yeni test (toplam 39).
- DEC-0026: Aşama 3 kapısı geçildi (kullanıcı testi).

## 2026-10-29 — TASK-0005: Aşama 2 tur ve dünya durumu çekirdeği

### Eklendi
- DEC-0023, ADR-0002 (kabul): simülasyon Web Worker'da, `packages/sim` + `packages/istemci`,
  Jülyen takvimi, yerel kayıt.
- `packages/sim`: dünya durumu, Jülyen takvim, tohumlu rastgelelik, emir kuyruğu (borçsuz
  harcama), sistem zamanlayıcısı (günlük/aylık/yıllık), tur döngüsü ve kesinti, kayıt/yükleme,
  durum özeti; 30 test.
- `packages/istemci`: harita (prototipten taşındı), üst durum çubuğu, tur süresi, "Turu ilerlet",
  kesinti penceresi, olay günlüğü, manuel/otomatik kayıt (IndexedDB).
- `veri/senaryo-1453/` ve `araclar/senaryo-uret.mjs`.
- `docs/milestones/ASAMA-2.md`; DEC-0024 (Aşama 2 kapısı geçildi).
- ADR-0001: kullanıcının kendi tarayıcısındaki ölçüm (60 FPS, p95 17,6 ms).

### Değişti
- MASTER_SPEC §25: OPEN-006 kapandı; zaman kuralı (Jülyen).
- Kök `package.json` (npm workspaces), `tsconfig.base.json`.

## 2026-10-29 — TASK-0004: 1453 haritası v0.2 (OHM + Wikidata)

### Eklendi
- `prototypes/harita-gorsel-02/scripts/`: `ohm-indir.mjs`, `ohm-esleme.mjs`,
  `ohm-kayitlari.json` (lisans kaydı), `wikidata-sorgula.mjs`, `karsilastir.mjs`.
- `public/veri/dunya-1453-v02.json`, `public/veri/wikidata-1453.json`.
- Teodoro Prensliği (OHM'den) ve Mangup, Teb şehirleri.
- Prototip: veri sürümü geçişi, "Kaynak güveni" katmanı, bilgi panelinde kaynak / güven /
  Wikidata satırları.
- `docs/historical-sources/1453-v02-karsilastirma.md` + görseller.

### Değişti
- Başkentler Wikidata ile düzeltildi: Candaroğulları → Sinop, Atina Dükalığı → Teb.
- Devlet etiket noktası: OHM parçaları için topojson merge yerine poligon birleşimi.
- v0.1 verisi (`dunya-1453.json`) değiştirilmedi.
- DEC-0022: Napoli ayrı devlet, Dağıstan Gazikumuk'ta, Urfa Akkoyunlu'da (`OHM_DUZELTME`).
- Prototip: lejant sol menünün sağına taşındı; menünün altını örtüp kaydırmayı
  engelliyordu.

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
