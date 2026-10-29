# DEVİR TESLİM — agent değişiminde kaldığın yer

Son güncelleme: **2026-10-29, Claude (Opus 5.5)** — Codex'in 4b/4c/5a işinden sonra devraldı. Bağlayıcı kurallar: `AGENTS.md`, `MASTER_SPEC.md`, `DECISIONS.md`.

## 1. İlk okunacaklar

1. Bu belge, `AGENTS.md`, `MASTER_SPEC.md` tamamen ve `DECISIONS.md` (DEC-0001 … DEC-0037).
2. Aktif görev `tasks/TASK-0008.md`, aşama `docs/milestones/ASAMA-5.md`; önceki görev TASK-0007.
3. Son rapor `docs/qa/ASAMA-5A-TEST.md`; birlikte test edilecek `docs/qa/ASAMA-4C-TEST.md`.

## 0. En son (Claude oturumu)

- Codex'in 4b/4c/5a işi doğrulandı (94 test, tip, derleme, tarayıcı) ve kullanıcı onayıyla commit edildi (`312b2d9`).
- Kullanıcı kararları (DEC-0033): 4c/5a "az çok" test edildi, ayrıntılı test sonraki turlarda;
  **5b kapsamı onaylandı** ve **5b tamamlandı**: şehir yatırımları (tarla/pazar/sur), `packages/sim/src/yatirim.ts`,
  kayıt şeması **6**, 101 test. Kullanıcı testi bekliyor: `docs/qa/ASAMA-5B-TEST.md`.
- 5b kullanıcı tarafından kabul edildi ve commit edildi (DEC-0034).
- **5c teknoloji ağacı tamamlandı ve kabul edildi** (DEC-0035, DEC-0036): `packages/sim/src/teknoloji.ts`,
  `arastir` emri, kayıt şeması **7**, 109 test, üst çubukta "Teknoloji" penceresi. Commit + push edildi.
- 4c/5a testi başarılı; **Aşama 4 ve 5 kapandı** (DEC-0037). Şehir yönetimi otomasyonu Aşama 7'ye ertelendi.
- **Aşama 6: TASK-0009 onaylandı (DEC-0038). 6a tamamlandı** (`diplomasi.ts`, şema 8, 116 test, Diplomasi
  harita modu). 6a ve başlangıç ilişki tablosu kabul edildi, commit edildi (DEC-0039).
- **6b kabul edildi ve commit edildi** (DEC-0040; garnizon tabanı 0, eksi bütçeli başlangıç 71 → 0).
- **6c kabul edildi; Aşama 6 kapandı** (DEC-0041), commit + push edildi. Ertelenenler: AI-AI ittifak, ileri diplomasi,
  şehir yönetimi otomasyonu (Aşama 7), terhis.
- **Sıradaki:** Aşama 7'ye geçiş için kullanıcı onayı; onaydan sonra TASK-0010 kapsam taslağı.
- Aşağıdaki 2–3. bölümler Codex'in notlarıdır; "5b/5c sorusuna yanıt yok" bilgisi artık geçersiz (DEC-0033).
- Arayüz notu: Ordu işaretinin olduğu şehre tıklamak orduyu seçer; şehir paneline sol paneldeki
  "Şehir yatırımları → Şehri aç" ile de ulaşılır.

## 2. Mevcut durum (Codex notları)

- **Aşama 5 başladı (DEC-0032). 5a bütçe özeti tamamlandı.**
- Aşama 4: 4a, 4b ve 4c kod olarak tamamlandı.
- 4b kullanıcı tarafından “test ettim başarılı” ile kabul edildi (DEC-0030).
- Kullanıcı 4c başlama sorusuna **“başla”** dedi (DEC-0031); bu oturum 4c'yi uyguladı.
- Kullanıcının son talimatı: **4c testini sonraki adımla birlikte yapacak; sıradaki adıma
  geçmemizi ve limit nedeniyle işi kontrollü tamamlamamızı istedi (DEC-0032).**
- **4c kabul edilmiş sayılmaz; resmî Aşama 4 kapanışı açık. Aşama 5 geçişine açık izin var.**
- Bu tur sınırlı 5a tamamlandı; yeni ekonomi kuralı eklenmedi. 4c + 5a kullanıcı testi ertelendi.
- 5b/5c önerisi için kullanıcıya metin sorusu gönderildi; **yanıt henüz yok**. Sorunun özeti:
  “5b tarım/pazar/sur, 5c küçük ağaç ve iki paralel alan uygun mu; yoksa önce yalnızca ekonomi mi?”
  Yanıtı yeni agent ilk kontrol etsin. Sessizliği onay sayma.
- 4a için ayrı test tutanağı alınmadı; önceki 4b geçişi kullanıcının açık “4b geçebilirsin”
  talimatıyla (DEC-0029) yapılmıştı. Kullanıcı onayı uydurma.
- **94 test başarılı** (12 dosya), sim/istemci tip kontrolü ve `npm run build` başarılı.
  4175 önizlemesi yeni derlemeyi sunar. Mevcut 500 kB paket uyarısı sürüyor; derleme hatası yok.
- 5173'te ayrı Chrome profiliyle gerçek düğmeler kullanılarak savaş → yürüyüş → muharebe →
  kuşatma → şehir düşmesi → barış → eski kuşatma kaydına dönüş akışı doğrulandı; JS hatası yok.
- **Kayıt şeması 5.** Şema 3 ve 4 kayıtları mevcut ordu/para/emir/toplama durumları korunarak
  dönüştürülür; yeni sur/garnizon ve boş kuşatma/işgal/barış listeleri eklenir. Şema 1–2 reddedilir.

### Bekleyen kararlar

1. 5b/5c kapsam sorusunun yanıtı; genel kapsam onayı bina/teknoloji formüllerinin onayı değildir.
2. Kullanıcı uygun bulduğunda 4c + 5a birlikte test ve kabul; Aşama 4 resmî kapanışı açık.
3. Commit/push için ayrıca kullanıcı onayı (DEC-0017). **4b, 4c ve 5a commit/push edilmedi.**

## 2a. En son tamamlanan iş: 5a bütçe özeti

- `packages/sim/src/ekonomi.ts`: salt sorgu `butceOzeti` ve mevcut `prototipGelirleri`.
  Test geliri/maaş kuralları değişmedi. Hazine, ayrılan ve kullanılabilir para, aylık gelir/maaş/net,
  arazi ve asker sayısı gösterilir. Aylık gelir artık sistemle özetin kullandığı aynı fonksiyondan gelir.
- İstemci `sim-protokol.ts`, `sim-isci.ts`, `main.ts`, `index.html`: oyuncu bütçesini taşır ve
  “Ordu giderleri” altında açılır “Aylık bütçe özeti” gösterir.
- Yeni test `packages/sim/test/ekonomi.test.ts`: 4 davranış testi. Yeni modülün determinizm
  taramasıyla 89 → 94 test. Kayıt şeması değişmedi (5), yeni denge değeri/harcama yok.
- Chrome: başlangıç hazine 9.400, gelir 940, maaş 640, net +300; 1.000 asker emrinde
  rezerv 100, kullanılabilir 9.300; bir ay sonra hazine 9.580, maaş 660, net +280. JS hatası yok.
- Yeni görev/aşama/rapor: TASK-0008, ASAMA-5, ASAMA-5A-TEST. 4175 build güncel.

### Devralanın ilk yapacağı iş

1. Son kullanıcı mesajını kontrol et; yukarıdaki 5b/5c sorusuna yanıt varsa kaydet.
2. TASK-0008 kapsamına göre 5b'nin somut bina/etki/maliyet/otomasyon önerisini hazırla.
   MASTER_SPEC OPEN-010/011/016 açık; bunları kendi kendine kapatma. Yeniden Aşama 5'e
   geçiş izni isteme: kullanıcı zaten verdi (DEC-0032).
3. Kullanıcının test ertelemesine saygı göster. 4c/5a için test yapılmış veya kabul edilmiş yazma.
4. Yeni üretim işi ancak ilgili açık mekanik kararları netleştikten sonra; küçük teslimleri bitir,
   test/typecheck/build çalıştır, sonra kullanıcıya sun. Limitte bu devir notunu güncelle.

## 3. 4c nasıl çalışır?

- **Arazi işgali:** Savaştaki düşman kontrolündeki arazide, muharebe/geri çekilme dışında duran
  ordu 3 gün sonra askerî kontrolü alır. Şehrin kontrolü/sahibi bundan değişmez.
- **Kuşatma:** Ordu şehir noktasının 3 km yakınına yürütülür. Soldaki Kuşatma panelinde
  şehir ve yöntem seçilir. Kuşatma açık emirle başlar; salt yürüyüşle şehir düşmez.
- **Yöntemler:** Kara ablukası erzağı günde 50/1000, teslim bekleme 25/1000 azaltır.
  Saldırı daha hızlı ve kayıplıdır. Kuşatanın moral ağırlıklı gücü garnizon × (sur+1)
  seviyesinin altındaysa ilerleme bekler. Kuşatma en az 7 etkin gün sürer; garnizon veya erzak
  tükenmelidir. Şehir düşünce oyuncunun turu durur. Ayrılma/hareket kuşatmayı bırakır.
- **İşgal ve sahiplik ayrı:** Kuşatmayla yalnızca askerî kontrol değişir. Kalıcı sahiplik barışla gelir.
- **Barış:** Savaşlar listesinden açılır; işgal edilen arazi/şehirler ayrı seçilir. İşgal değeri,
  düşmanın toplam varlık değeri ve karşı işgallerden skor hesaplanır. Başkent tek başına zafer değildir.
  Tazminat peşindir, düşmanın mevcut parasını aşamaz; borç/faiz yaratmaz. Puan/sahiplik/para
  emir verilirken ve turun başında yeniden doğrulanır.
- **Barış sonrası:** Seçilmemiş iki taraflı işgaller kalkar; ilgili muharebe/kuşatmalar biter,
  diğer savaşlar sürer. Sınırlar, renkler, şehirler ve başkentler güncellenir. Dışarıda kalan
  ordu anında konum değiştirmeden kendi toprağına yürür. Barış geçmişi kaydedilir.

### Kullanıcıya kısa test

4175'i yenile → Karaman ordusuna tıkla → savaş ilan et/onayla → Anadolu Ordusu'nu seç →
sağ panelde Larende → Şehre yürü → haftalar ilerlet (muharebe kesinti/raporunu kapat) →
Larende'ye varınca Kuşatma: Larende / Surlara saldırı → Kuşatmayı başlat → Ay / Turu ilerlet →
şehir düşünce Anladım → Savaşlar / Barış teklif et → Karaman arazisi ve Larende şehrini seç,
0 tazminat → teklif/onay/tur. Harita ve sahiplik değişmeli.
Ayrıntılı adımlar ve doğrulanmış sonuçlar `docs/qa/ASAMA-4C-TEST.md` içinde.

## 4. Kod haritası

- `packages/sim/src/kusatma.ts`: kuşatma mesafesi, güç, yöntemler, günlük erzak/kayıp,
  bırakma, şehir düşmesi ve ayrı arazi işgali.
- `packages/sim/src/baris.ts`: puanlar/doğrulama, sahiplik/başkent değişimi, savaş temizliği,
  para transferi, yürüyerek dönüş ve antlaşma geçmişi.
- `durum.ts`: şehir sur/garnizon alanları, kuşatma/işgal hazırlığı/barış kayıtları; şema 5.
- `emirler.ts`: kusat/kusatmaBirak/baris; mevcut hareket kuşatmayı bırakır, bölme/birleştirme
  kuşatma sırasında reddedilir. Emirler yalnızca turun başında uygulanır.
- `sistemler.ts`: toplama → hareket → muharebe → moral → ikmal → arazi işgali → kuşatma;
  ay başında test geliri → maaş.
- `denge.ts`: **bütün denge sayıları** TASLAK. Hareket sabitleri de buradadır; `hareket.ts` yeniden dışa aktarır.
- `ordu.ts`: 4b toplama/maaş/ikmal; `kayit.ts`: şema 3–4 dönüşümü, kayıt doğrulaması.
- `packages/sim/test/kusatma-baris.test.ts`: 23 yeni davranış testi; `ordu.test.ts`: 4b'nin 15 testi.
- İstemci `savas-arayuzu.ts`: kuşatma paneli, barış önizlemesi ve onayı; `main.ts`: bağlantılar,
  şehir bilgileri ve yürüyüş, savaş listesi. Test işgali düğmesi kaldırıldı.
- `sim-isci.ts`, `sim-protokol.ts`: yeni özetler, barış önizlemesi. Yabancı garnizonlar yaklaşık
  gösterilir; yabancı ordular için 4a görünürlük/yuvarlama kuralı devam eder.
- `harita/harita.ts`, `gorunum.ts`, `etiketler.ts`: sahiplik değişince sınır/dolgu, şehir-devlet
  listeleri, başkent noktaları ve etiketleri güncelleme; eski kayda dönünce eski haritaya dönüş.
- 4b şehir koordinatları `Baglam.sehirKonumlari` içindedir; yeni ordu ve kuşatma gerçek şehir noktasını kullanır.

## 5. Bilinen sınırlar ve kapsam

- Sayılar tarihî kesin veri değil; prototip tahminleridir. Kuşatma deniz ablukası/ikmali, sur onarımı,
  garnizon yenilemesi içermez. Gerçek AI Aşama 6; donanma Aşama 8. Yeni veri kaynağı/bağımlılık eklenmedi.
- Skor yalnızca işgal değerlerinden; muharebe zaferine ayrıca puan verilmez. Vasallık, çok taraflı
  antlaşma, ateşkes süresi ve oyuncunun düşmana toprak/tazminat verme pazarlığı bu teslimde yok.
- Başkent barışla kaybedilirse kalan en kalabalık şehir seçilir (eşitlikte sabit indeks).
  Devlet otomatik silinmez; geri dönebileceği toprağı/yolu olmayan ordu yerinde kalır (OPEN-024 açık).
- Muharebe karşılaşması hâlâ aynı düğümde algılanır; 4a'nın bilinen sınırı devam eder.
- İkmal ağ düğümündeki askerî kontrole göredir; ayrıntılı hat/kış/otomatik takviye yok.
- Şehir insan gücü ek havuzdur, başlangıç nüfusunun %5'i; kendiliğinden yenilenmez.
- Gelir ve nüfus hâlâ test sistemleridir; Aşama 5/7 kapsamı kendiliğinden eklenmedi.
- Eski testIsgal emri yalnızca eski kayıt ve kabul testi uyumu için sim çekirdeğinde kaldı;
  oyunun arayüzünde test işgali yoktur.

## 6. Çalışma ağacı ve yarım işler

- Dal `main`. **4b + kabul belgeleri + 4c + 5a değişiklikleri commit edilmemiştir.** Güncel liste `git status`.
- Yeni dosyalar: `packages/sim/src/ordu.ts`, `kusatma.ts`, `baris.ts`;
  `ekonomi.ts`; `packages/sim/test/ordu.test.ts`, `kusatma-baris.test.ts`, `ekonomi.test.ts`;
  `packages/istemci/src/savas-arayuzu.ts`; `docs/qa/ASAMA-4B-TEST.md`, `ASAMA-4C-TEST.md`, `ASAMA-5A-TEST.md`; `tasks/TASK-0008.md`, `docs/milestones/ASAMA-5.md`.
- Mevcut sim dosyaları: denge/durum/emirler/hareket/index/kayit/savas/sistemler;
  istemci: index.html, main/sim-isci/sim-protokol, harita/gorunum/harita/etiketler.
- Belgeler: AGENTS, DECISIONS, CHANGELOG, TASK-0007, ASAMA-4, DEVIR-TESLIM.
- Bilinen yarım kod veya kırık test yok. 5a tamam; sıradaki iş 5b/5c kararlarını netleştirmek.
  4c + 5a kullanıcı kabulü ve Aşama 4 resmî kapısı açık.
- Geçici test betikleri/görseller `/tmp/tarihi-4c-*`, `/tmp/tarihi-5a-*` içinde olabilir; depo parçası değildir.

## 7. Komutlar ve değişmez kurallar

- `npm test`, `npm run typecheck`, `npm run build` (derleme denetimi).
- **5173** hem kullanıcı hem agent için (DEC-0036); 4175 kullanılmaz. Kullanıcı sunucularını kapatma.
- Türkçe, sade iletişim; karar soruları numaralı ve önerili. Tarayıcı alert/confirm/prompt yok.
- Yalnızca onaylı görev kapsamında üretim kodu. Kapılar açık kullanıcı onayıyla geçilir.
- Commit/push öncesi ayrıca sor (DEC-0017). Main üzerinde çalışma yetkisi commit yetkisi değildir.
- Sim saf ve deterministik: tam sayılar, tohumlu rastgelelik; DOM/three.js/Node API yok.
- Yeni kaynak/veri seti veya kapsam dışı mekanik ekleme. Denge sayıları `denge.ts` içinde.
- Oturum/limit bitmeden bu belgeyi mevcut durum, kararlar, testler, çalışma ağacı ve yarım işle güncelle.
