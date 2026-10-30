# DEVİR TESLİM — agent değişiminde kaldığın yer

Son güncelleme: **2026-10-30, Claude — TASK-0020 2/3 (elçi gönderme) kod olarak tamamlandı; kullanıcı testi ve
commit onayı bekleniyor. 1/3 commit+push edilmiş ve kullanıcı isteğiyle main'e fast-forward edilmiştir
(şu an `main` üzerinde çalışılıyor — ayrı dal yok).**
Bağlayıcı kurallar: `AGENTS.md`, `MASTER_SPEC.md`, `DECISIONS.md`.

## 0. En son — BURADAN BAŞLA

- Kullanıcı "testleri sonra yaparız, eksikleri analiz et" dedi (TASK-0019 sonrası), sonra elçi gönderme/gelen
  teklifleri görme/figürlerle gösterme istedi → **TASK-0020 / DEC-0069** onaylandı: 3 alt teslim sırayla
  (1) AI'dan gelen diplomatik teklifler + gelen kutusu, (2) elçi gönderme, (3) hükümdar/devlet portresi.
- **1/3 commit edildi (`10d0e70`), kullanıcı "main'den devam" dedi → main bu commit'e fast-forward edilip push
  edildi; artık doğrudan `main` üzerinde çalışılıyor (DEC-0015 ile tutarlı), ayrı dal açılmıyor.**
  Yeni `yz-diplomasi.ts` — her AI devleti, oyuncunun sınır
  komşusuysa, savaşta değillerse ve 180 gün içinde ona teklif göndermediyse, aylık kararında küçük bir olasılıkla
  (`YZ_DIPLOMASI_TEKLIF_OLASILIK` %1) ilişkisine göre ittifak/ticaret/saldırmazlık teklif eder. Yeni emir
  `diplomatikTeklifCevap` (kabul/ret), barış teklifiyle aynı doğrulama/uygulama deseninde. Şema 23 → 24
  (`diplomatikTeklifler`, `diplomatikTeklifSoguma`). İstemci: barış teklifiyle aynı desende genelleştirilmiş
  pencere (`#dipTeklifi`), devlet panelinde "📨 ... teklif ediyor" bildirimi, savaş rozeti sayacı güncellendi.
  **Önemli düzeltme:** İlk sürümde (tüm 132 devlet, komşuluk/soğuma kısıtı yok) 10 yıllık senaryo testinde
  yıllık turlar sürekli kesintiye uğrayıp 10 yıl yalnızca ~4 ay ilerliyordu; sınır komşusu kısıtı + 180 günlük
  soğuma eklenince makul sıklığa indi (bkz. CHANGELOG). `senaryo-1453.test.ts`'teki 10 yıllık test artık
  kesintileri reddederek ilerliyor, tam 10 yılın geçtiğini (kesintiler nedeniyle takvim birkaç ay kayabilir)
  doğruluyor — bu kasıtlı davranış, "tur durur, oyuncu karar verir" kuralıyla tutarlı.
  242 sim testi (4 yeni: `yz-diplomasi.test.ts`), typecheck, build geçti; 5173'te Playwright ile canlı doğrulandı
  (Candaroğulları'ndan saldırmazlık paktı teklifi kesintiyle geldi, `#dipTeklifi` doğru metinle açıldı, "Kabul et"
  JS hatasız çalıştı; kullanıcıya ekran görüntüsü gönderildi).
- **2/3 kod olarak tamamlandı, henüz commit edilmedi:** Yeni `elci.ts` — emir `elciGonder` (bedel 180, 60 gün);
  varınca hediyeyle aynı birikim/sönüm kuralına tabi +15 ilişki ekler (`ELCI_EN_COK` 30 tavanlı, bağımsız havuz).
  Aynı devlete ikinci elçi, ilki yoldayken gönderilemez. Şema 24 → 25 (`elciler`, `sonrakiElciId`). İstemci:
  devlet panelinde hediyenin yanına "Elçi gönder" düğmesi / "🕊 Elçiniz yolda; N gün sonra varacak" bildirimi.
  246 sim testi (3 yeni: `elci.test.ts`), typecheck, build geçti; 5173'te Playwright ile canlı doğrulandı
  (Brandenburg'a elçi gönderildi, hazineden 180 düştü, tur sonrası panelde "Elçiniz yolda" göründü, JS hatası yok;
  kullanıcıya ekran görüntüsü gönderildi).
- **Sırada:** TASK-0020 3/3 hükümdar/devlet portresi (saf görsel, `arma.ts` genişletilecek). Devralan agent önce
  kullanıcıdan 2/3'ün commit onayını istesin, sonra 3/3'e geçsin.
- `tasks/TASK-0020.md`, `CHANGELOG.md` güncel; henüz commit edilmedi.

## Arşiv — TASK-0019 ve öncesi (bu oturumun önceki kısmı)

**Aşağısı bu oturumun TASK-0017/18/19 notlarıdır; güncel durum için yukarıdaki en üst §0 geçerlidir.**

- **TASK-0015 (önceki oturum) commit/push edilmiş bulundu** (main'de `8d01be8`, commit mesajı hatalı/eksik "....."). Bu
  oturumda GitHub App erişimi düzeltildikten sonra bu dal (`claude/game-logic-gaps-rk0oge`) origin'e push edildi.
- **1/4 Ekonomi commit+push edildi** (`78ff386`, kullanıcı onayıyla — "2-et"). Kullanıcı telefonda olduğu için henüz
  kendi 5173'ünde denemedi; test hâlâ bekliyor.
- **2/4 Asker basma (toplama iptali) kod olarak tamamlandı, henüz commit edilmedi:** yeni emir `toplamaIptal` — süren bir
  asker toplamayı iptal eder, bedeli ve insan gücünü tam iade eder (borç oluşmaz). Şema 19 → 20 (`AskerToplama.id`/`bedel`,
  `sonrakiToplamaId`). İstemci: "Asker toplama" listesindeki her kalemde "İptal" düğmesi.
  209 test (3 yeni), typecheck, build geçti; 5173'te agent tarafından Playwright ile doğrulandı (toplama → iptal → tam iade;
  JS hatası yok). **Kullanıcı telefondan test edemediği için "bilgisayara geçince test et" seçeneğini onayladı; agent
  kendi testleriyle ilerlemeye devam ediyor.**
- **3/4 Ordu birleştirme/ayırma (checkbox listesi) kod olarak tamamlandı, henüz commit edilmedi:** birleştirme hedefi artık
  tek seçimlik `<select>` yerine tıklanabilir liste (ad + asker sayısı, ilk aday otomatik seçili); haritada sağ tıkla-seç
  akışı korundu. Sadece istemci değişti (`main.ts`, `index.html`); sim tarafı değişmedi, 209 test aynen geçiyor.
  5173'te agent tarafından doğrulandı: ordu bölündü, aynı konumdaki ordu listede çıktı, seçili/etkin oldu, Birleştir ile
  2 orduya indi. JS hatası yok. Commit+push edildi (`3fa88b8`).
- **4/4 Temel diplomasi (ticaret anlaşması + saldırmazlık paktı) kod olarak tamamlandı, henüz commit edilmedi:** ticaret
  anlaşması (eşik ilişki 10, +%10 liman geliri, savaşla otomatik bozulur), saldırmazlık paktı (12/24/36 ay seçimli,
  eşik 0, aktifken savaş ilanını her iki yönde de engeller, süre dolunca kalkar). Şema 20 → 21. Devlet panelinde yeni
  "Ticaret ve saldırmazlık" bölümü. 215 test (6 yeni), typecheck, build geçti; 5173'te agent tarafından doğrulandı
  (haritadan devlet seçip ticaret teklifi gönderildi, tahmini cevap/eşik metni doğru, tur ilerletildi, JS hatası yok).
  **TASK-0017'nin 4 alt teslimi de kod olarak bitti ve commit+push edildi** (`62c095a`).
- Kullanıcı yeni eksikleri sordu: **TASK-0018 / DEC-0067** onaylandı — sıra (1) ilhak sonrası ordu kaderi (OPEN-024,
  dağılır), (2) vasallık (yalnızca barışta "vasal yap"), (3) isyan/casusluk derinliği (yanlış istihbarat + direniş
  kademesi). Birim çeşitliliği (piyade/okçu/süvari) kasıtlı olarak dışarıda bırakıldı; ayrı büyük görev (TASK-0019)
  olarak TASK-0018 bitince planlanacak.
- **1/3 İlhak sonrası ordu kaderi — commit edildi (`45fdfb7`):** `savas-sonu.ts: yikilanDevletleriTemizle` artık
  yıkılan devletin bütün ordularını dağıtıyor (siliyor), günlüğe dünya geneli bir olay yazıyor. OPEN-024 bu kapsamda
  kapandı. 216 test, typecheck, build geçti.
- **2/3 Vasallık (yalnızca barışta) kod olarak tamamlandı, henüz commit edilmedi:** tam ilhak düzeyinde talepte
  "vasal yap" seçeneği — toprak kalır, efendiye aylık %15 vergi, efendinin savaşlarına zorunlu katılım, vasal kendi
  başına savaş ilan edemez, efendi "serbest bırak" ile bağı koparır. Yeni `vasallik.ts`; `baris.ts`/`emirler.ts`/
  `sistemler.ts` entegrasyonu. Şema 21 → 22. İstemci: barış panelinde "Vasal yap" onay kutusu (yalnızca tam ilhak
  talebinde görünür), devlet panelinde vasallık durumu/serbest bırak, vasalken "Savaş ilan et" nedenle pasif.
  222 test (5 yeni), typecheck, build geçti; 5173'te agent tarafından doğrulandı (barış penceresi, tam ilhak olmadan
  etiket gizli, JS hatası yok). Gerçek tam-ilhak+vasal akışı kuşatma gerektirdiği için canlı denenmedi; sim testleri
  uçtan uca kapsıyor. Commit+push edildi (`9b1a845`).
- **3/3 Yanlış istihbarat + direniş ara kademesi kod olarak tamamlandı, henüz commit edilmedi:** başarılı askerî/
  diplomatik casusluk görevinde %20 ihtimalle rapor çarpıtılır (gerçek sayının %70–%130'u, oyuncu bilemez; isyan
  desteğini etkilemez). İstikrarda huzursuzluk (%50) ile ayaklanma (%80) arasına yeni "Direniş" eşiği (%65): gelirin
  çeyreği kalır. Şema değişikliği yok (yeni alan isteğe bağlı). 224 test (3 yeni + 1 güncellenen), typecheck, build
  geçti; 5173'te casusluk görevi hatasız başlatıldı, JS hatası yok; istikrar panelinin canlı testi bu seferki
  denemede eksik kaldı, mantık sim testleriyle doğrulandı.
  **TASK-0018'in 3 alt teslimi de kod olarak bitti.** Commit+push edildi (`d8819e9`).
- Kullanıcı "sen devam et yapmaya" dedi; **TASK-0019 (birim çeşitliliği) DEC-0068 ile agent önerisiyle onaylandı.**
  Dört faz: (1) veri modeli + asker toplama, (2) muharebe gücü ve kayıp dağılımı — en riskli, (3) hareket hızı,
  (4) kuşatma gücü + arayüz tamamlama. Piyade/Okçu/Süvari; tüm sayılar TASLAK; AI v1'de yalnızca piyade toplar.
- **1/4 Veri modeli + asker toplama kod olarak tamamlandı, henüz commit edilmedi:** yeni `birim.ts`; `OrduDurumu.asker`
  toplam olarak korunur, yeni `kompozisyon` alanı eklendi (şema 22 → 23); `askerTopla` emrine `birim` parametresi,
  tür bazlı maliyet/maaş; ordu bölme/birleştirme oransal kompozisyon taşır; ikmalsizlik/muharebe kayıpları kompozisyonu
  tutarlı tutar. **Muharebe gücü formülü bu fazda değişmedi** — savaş dengesi henüz etkilenmez. İstemci: asker toplama
  formunda birim seçimi (maliyet/maaş/saldırı/savunma/hız özeti). 231 test (6 yeni), typecheck, build geçti; 5173'te
  agent tarafından doğrulandı (süvari bedeli piyadenin 1,8 katı, 500 süvari toplanıp bir ay sonra ordu listesinde
  çıktı, JS hatası yok). Commit+push edildi (`fccd5b4`).
- **2/4 Muharebe gücü ve kayıp dağılımı kod olarak tamamlandı, henüz commit edilmedi — EN RİSKLİ FAZ, savaş
  dengesini ilk kez gerçekten değiştiriyor:** `savas.ts: muharebeGunu` artık kompozisyona göre saldırı/savunma
  çarpanı uyguluyor (süvari saldırırken, okçu savunurken güçlü). Parametre verilmezse eski davranışla birebir aynı
  (tüm eski testler değişmeden geçti). Kuşatma gücü bu fazda değişmedi (4. fazda). Şema değişikliği yok.
  234 test (3 yeni), typecheck, build geçti; 5173'te 20 turluk gerçek kampanya (ilan edilmiş savaş + çok sayıda AI
  savaşı) hatasız çalıştı. Commit+push edildi (`1af1668`).
- **3/4 Hareket hızı kod olarak tamamlandı, henüz commit edilmedi:** ordu hızı artık kompozisyonun ağırlıklı
  ortalama yüzdesine göre (süvari %150, piyade/okçu %100); yeni toplama/bölme/birleştirme sonrası yeniden
  hesaplanır. Düşük riskli, `hareket.ts`'e dokunulmadı. Şema değişikliği yok. 236 test (2 yeni), typecheck, build
  geçti; 5173'te süvari toplama/tur ilerletme denendi, JS hatası yok; ETA karşılaştırma canlı testi bir betik
  sorunu yüzünden tamamlanamadı, hız formülü sim testlerinde tam sayılarla doğrulandı. Commit+push edildi (`ce840a1`).
- **4/4 Kuşatma gücü + arayüz tamamlama kod olarak tamamlandı, henüz commit edilmedi — TASK-0019'un son fazı:**
  `kusatma.ts: kusatmaGucu` kompozisyona göre saldırı çarpanı kullanıyor (sur saldırısı garnizon kaybı otomatik
  etkilendi). Ordu listesi/detayı/birleştirme listesinde piyade dışı ordularda tür kırılımı gösteriliyor (örn.
  "500 asker (500 süvari)"); tamamen piyade ordularda ekstra bilgi yok. Muharebe raporu kırılımı bilinçli olarak
  kapsam dışı bırakıldı (ayrı şema değişikliği gerektirirdi, ek risk). 237 test (1 yeni), typecheck, build geçti;
  5173'te agent tarafından doğrulandı (500 süvari toplandı, liste ve detayda doğru gösterildi, JS hatası yok).
  **TASK-0019'un 4 fazı da kod olarak tamamlandı. Kullanıcı testi ve commit/push onayı bekliyor.**
- Kullanıcı "oyun mantığında eksiklikler var, Age of History gibi bir şey istiyorum: ekonomi, asker basma, ordu
  birleştirme/ayırma, diplomasi" dedi. **TASK-0017 / DEC-0066** ile tek görev kartı onaylandı: sıra Ekonomi → Asker basma →
  Ordu birleştirme/ayırma → Temel diplomasi. Açık sorular yanıtlandı: vergi düşük/orta/yüksek (varsayılan orta); pakt süresini
  oyuncu seçer; ordu birleştirme/ayırma arayüzünde hem checkbox listesi hem haritada tıkla-seç olacak (henüz uygulanmadı, 3. alt teslimde).
- **1/4 Ekonomi uygulandı:** vergi oranı (`packages/sim/src/vergi.ts`, emir `vergiAyarla`), şehir bazlı gelir dökümü
  (`ekonomi.ts: sehirGelirOzetleri`), hazine geçmişi (`sistemler.ts: hazine-gecmisi` sistemi, son 12 ay). Şema 19.
  İstemci: "Aylık bütçe" panelinde vergi düğmeleri + "Şehir bazlı gelir ve hazine geçmişi" alt paneli.
- **206 test (6 yeni: `vergi.test.ts` + 2 `kayit.test.ts` güncellemesi), typecheck, build başarılı.** 5173'te geçici
  sunucu + Playwright ile doğrulandı (bu oturumun temizlediği geçici betikler, kalıcı depo bağımlılığı değil): yüksek vergiye
  geçiş geliri artırdı, buton "etkin" oldu, tur sonrası hazine geçmişinde fark göründü, şehir listesi yapı/ticaret ayrı gösterdi.
  JS hatası yok. **Kullanıcı henüz kendi 5173'ünde denemedi.**
- **Commit/push yapılmadı; kullanıcı onayı bekleniyor (DEC-0017).** Sıradaki iş: kullanıcı testi/onayı, sonra 2/4 Asker basma
  (şehir başına toplama kuyruğu görünürlüğü, maliyet/süre önizlemesi, iptal emri) için kısa bir kapsam teyidiyle devam.
- `tasks/TASK-0017.md` ve `DECISIONS.md` (DEC-0066) güncel; CHANGELOG.md'ye 2026-10-30 girişi eklendi, henüz commit edilmedi.

## Arşiv — önceki oturumların notları (TASK-0015 ve öncesi)

**Aşağısı geçmiş oturum kaydıdır; güncel görev, onay veya commit durumu için yukarıdaki §0 geçerlidir.**

- Kullanıcı Osmanlı ile Eflak ilhakı ve benzer sorunlar için ayrıntılı araştırma istedi (DEC-0063 / TASK-0014).
  Sonra **“hepsini sırayla yap”** dedi; rapordaki bütün hata ve doğrulama düzeltmeleri onaylandı (DEC-0064 / TASK-0015).
- **Uygulama ve agent doğrulaması tamamlandı.** Güncel rapor `docs/qa/BUG-DUZELTMELERI-TEST.md`.
  Orijinal hata kanıtları `docs/qa/OYNANIS-HATA-INCELEMESI.md` içinde; onun “henüz düzeltilmedi” ifadeleri araştırma tarihine ait.
- **Tamamlananlar:** H-01 bütçeyi düşürünce harcama geçmişi/kayıt geçerliliği; H-02 ortak savaş sonlandırma ve tam ilhakın
  bitirdiği üçüncü devlet muharebe/işgal temizliği; UX-01 barışta kalan arazi/şehir ve tam ilhak özeti, farklı şehir/çevre sahipliği
  paneli ve harita etiketi; H-03 dünya değişiminde otomatik kayıt dönemi; H-04 ayaklanma/kuşatmada tersane beklemesi;
  H-05 gemideki askerin toplamda sayılması; H-06 fetih sonrası geçersiz isyan desteği filtresi; H-07 rapor kimliği önbelleği.
- **K-01/T-01/T-02:** Kesirli/eksik devlet indeksleri reddedilir. Bitmiş savaşın muharebesi ve yıkılmış devletin kontrolü
  değişmezlerde yakalanır. Gerçek 1453 senaryosu hareket ağıyla 10 yıllık deterministik kampanyayı artık otomatik testte çalıştırır.
- **Şema 18 korunuyor; yeni durum alanı eklenmedi.** Yeni modül `packages/sim/src/savas-sonu.ts`.
  Sağlam özetli/özetsiz desteklenen eski H-02 kaydında yalnız savaş ilişkileri hatalıysa kalıntılar temizlenir;
  günlükte `kayit-onarildi` mesajı görünür. Başka bozukluk veya uyuşmayan içerik özeti onarımla kabul edilmez.
- **Son kontroller başarılı:** `npm test` 25 dosya / **198 test**; `npm run typecheck`; `npm run build`; `git diff --check`.
  Bir ara mevcut gerçek dünya hareket testi 5 saniyelik sınırı aştı, tekrarı geçti; o testin sınırı gerçek kampanya/paralel yük
  için 30 saniye yapıldı, sonuç kontrolleri korunuyor. Son test çalışması 26 saniye; bütün testler geçti.
- **5173 tarayıcı sonuçları:** Gerçek düğmelerle yönetici 300 harcadı → tavan 0 → kaydedilen kayıt artık yükleniyor.
  Aynı ayda farklı dünyaya geçince otomatik kayıt yeni 12.345 hazinesini yazıyor. Karaman raporu 1 sonrası farklı Eflak muharebesi 1
  bitince rapor penceresi açılıyor. Eflak barış önizlemesi 26 arazi/0 şehir için 1 şehrin kalacağını, 26/1 için tam ilhakı söylüyor;
  onay ve tur düğmeleriyle uygulandı, Tırgovişte paneli Osmanlı oldu. Yalnız arazi devrinde panel Eflak + çevre Osmanlı diyor;
  `⚑ Tırgovişte · Eflak Voyvodalığı` etiketi görünür olarak test edildi, ekran görüntüsü incelendi.
- Savaş ve rapor kurulumları için hazırlanmış kayıtlar kullanıldı; kullanıcının kendi kaydı incelenmedi/değiştirilmedi.
  Kullanıcının şehir kutusunu seçmediğini kesin neden diye sunma. Şehir ve arazi ayrı devredilir; otomatik şehir ilhakı eklenmedi.
  İlhak edilen devletin ordusunun siyasi kaderi OPEN-024 olarak kalır; ordu otomatik silinmez/devredilmez.
- **Kullanıcı kabulü henüz yok; commit/push izni yok ve işlem yapılmadı (DEC-0017).** Son kullanıcı talimatı yalnız düzeltmeleri
  yapmak. Sonraki iş kullanıcı test sonucunu almak, varsa takip hatasını düzeltmek; commit/push istenirse güncel ağacı gözden geçirmek.
  Aşama 10c/10d'ye kendiliğinden geçme; ertelenmiş büyük mekanikler bu işte eklenmedi.
- **Çalışma ağacı:** Devralırken zaten commit edilmemiş 10b kod/belgeleri vardı; korundu. Araştırma (TASK-0014/DEC-0063/QA)
  ve düzeltme (TASK-0015/DEC-0064/QA) belgeleri de commit edilmemiştir. Güncel toplam dosya listesi için `git status`.
  Yeni kaynak `savas-sonu.ts`; önceki agent'ın yeni `surum.ts` ve `ASAMA-10B-TEST.md` dosyaları da ağacın parçasıdır.
- **Yarım kod yok.** 5173 kapatılmadı; 4175 kullanılmaz. Ayrı test tarayıcısı son temizlikte kapatıldı;
  kullanıcı profiline dokunulmadı. Geçici profil `/tmp/tarihi-fix-iFYlW6`, betikler `/tmp/tarihi-audit-*` ve `/tmp/tarihi-fix-*`,
  incelenmiş görsel `/tmp/tarihi-fix-eflak-ayri.png`. Bunlar kalıcı depo bağımlılığı değildir.

## 1. İlk okunacaklar ve sıradaki iş

1. Bu bölüm, `AGENTS.md`, `MASTER_SPEC.md`, `DECISIONS.md` (DEC-0001 … DEC-0064).
2. `tasks/TASK-0015.md` ve `docs/qa/BUG-DUZELTMELERI-TEST.md`; asıl inceleme için TASK-0014 ve hata raporu.
3. Yayın hazırlığı bağlamı: `tasks/TASK-0013.md`, `docs/milestones/ASAMA-10.md`. 10b önceden uygulanmıştı; 10c/10d bekliyor.
4. Son kullanıcı yanıtını esas al. Kullanıcı testi veya commit onayı uydurma. Aşağıdaki eski 7c/7d bekleyişleri güncel değildir.

## Arşiv — önceki agent'ın 10b/7c ve daha eski notları

**Aşağısı geçmiş oturum kaydıdır; güncel görev, onay veya commit durumu için üstteki §0–1 geçerlidir.**

Son güncelleme: **2026-10-29, Claude** (Codex'ten devraldı). **7c kullanıcı tarafından kabul edildi (DEC-0048).**
7c ve 7d kabul edildi, commit edildi. **Aşama 7 kapandı (DEC-0050).** Aşama 8 başladı; TASK-0011 onaylandı (DEC-0051).
**8a kabul edildi ve commit edildi (DEC-0052).** Sol panel düzeni, kalyon teknolojisi ve **8b ticaret tamamlandı**
(şema 16, 179 test) — kabul ve commit (DEC-0053; panel 340 px, temalı form alanları). **8c kabul; Aşama 8 kapandı (DEC-0054).** Açılır liste tasarımı commit edildi. **Aşama 9 onaylandı (DEC-0055); 9a kabul edildi ve commit edildi (DEC-0056).** **9b kabul edildi ve commit edildi (DEC-0057).** Not: kullanıcı dünyayı "biraz durağan" buldu (ileride AI
savaş olasılıkları artırılabilir). **9c kabul edildi ve commit edildi (DEC-0058).** **9d kabul edildi ve commit edildi (DEC-0059).** **Aşama 9 kapandı: oynanabilir sürüm kabul edildi (DEC-0060).** Aşama 10 (yayın hazırlığı) sürüyor;
`tasks/TASK-0013.md` onaylandı (DEC-0061): sürüm 0.9.0, dağıtım yalnızca yerel zip. **10a kabul edildi ve commit edildi (DEC-0062).** **10b tamamlandı** (hata penceresi, yerel rapor, kurtarma, otomatik kayıt sıklığı) — commit edilmedi;
kullanıcı testi, otomatik kayıt varsayılanı kararı ve commit izni bekleniyor. Sonra 10c (sürüm notları, paket, kontrol listesi).
Not: açılışta menü gelir; puppeteer betikleri için `?devlet=osm` menüyü atlar.

- Aşama 0–6 kapalı. 7a kabul DEC-0044, 7b kabul DEC-0046 (son commit `0192de4`).
- **7c kapsamı DEC-0047 ile onaylı; uygulandı.** Yeni `packages/sim/src/istikrar.ts`;
  aylık risk/neden/fark, huzursuzluk/ayaklanma, ordu/bağış, ekonomi/asker/inşaat/AI bağlantıları.
- **158 test (20 dosya), npm run typecheck ve npm run build başarılı.** Mevcut paket boyutu uyarısı sürüyor.
- **Şema 13**, 12→13 dönüşümü/testi hazır. Fetih tarihi barışta kaydediliyor;
  eski kayıt için barış geçmişinden bulunuyor; bilinmiyorsa tarih uydurulmuyor.
- **Chrome / 5173 tamam:** Selanik ilk ay %11 → 200 bağış sonrası %0; harita, kayıt/yükle;
  ayrı hazırlanmış kayıtta üç ay yüksek risk → ayaklanma/tur kesintisi ve kapalı asker/inşaat düğmeleri.
  JS hatası yok. Kullanıcı kayıtları değiştirilmedi. Yalnızca geçici test Chrome'u kullanıldı.
- **Yeni rapor:** `docs/qa/ASAMA-7C-TEST.md`; sayılar/sınırlar ve tıklama adımları orada.
- **Commit/push yapılmadı:** önceden bekleyen DEC-0047/belgeler + 7c sim/istemci/test/QA değişiklikleri.
  Yeni dosyalar istikrar.ts, test/istikrar.test.ts, docs/qa/ASAMA-7C-TEST.md. Güncel liste için git status.
- **Yarım kod/kırık test yok.** Kullanıcıdan 1) 7c test sonucu, 2) commit/push, 3) 7d kapsamı onayı bekleniyor.
- 7d henüz başlamadı: TASK-0010 sonunda yalnızca öneri var (şehir başına aylık bütçe, tarla/pazar,
  elle emir önceliği). Bunu onaylanmış mekanik sanma; OPEN-016 açık.
- **Sunucu sadece 5173 (DEC-0036); 4175 kullanılmaz. 5173'ü kapatma.**
- Kullanıcı uzun sessizlikten rahatsız oldu. Ongoing işte 60 saniyeyi aşmadan somut durum güncellemesi ver.
- Denge değerleri denge.ts içinde TASLAK. Risk ilk ay başında hesaplanır; güncel snapshot aylıktır.
  Bağış 200, sonraki ay −20 ve aylık 5 sönüm; asayiş max(500, nüfus %5), iki ayla bastırma.
- Geçici tarayıcı betikleri `/tmp/tarihi-7c-browser.mjs`, `/tmp/tarihi-7c-crisis.mjs`;
  görseller `/tmp/tarihi-7c-istikrar.png`, `/tmp/tarihi-7c-ayaklanma.png`.

### Devralanın ilk işi

1. En son kullanıcı yanıtını oku; test/commit/7d kararlarını yalnızca açık yanıtla kaydet.
2. Commit istenmişse mevcut 7c değişiklikleri ve önceden bekleyen DEC-0047 belgelerini birlikte gözden geçir;
   onay yoksa commit/push yapma (DEC-0017). Kullanıcının önceki aşama commit izni bu iş için geçerli değildir.
3. 7d kapsamını somut görev kartıyla netleştir; kullanıcı onayı olmadan otomasyon kodlama.
4. Bu bölüm günceldir; aşağıdaki Aşama 5/4 notları eski oturum arşividir, uygulanacak iş değildir.

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
