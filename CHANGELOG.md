# CHANGELOG

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
