# DECISIONS — Karar Kayıtları

Bu dosya onaylı ürün kararlarının tek kaydıdır. Her kayıt: ID, tarih,
konu, alternatifler, seçilen karar, gerekçe, etkilenen modüller ve onay
kaydı içerir. Kayıtlar silinmez; değişen karar yeni kayıtla geçersiz
kılınır (`Durum: GEÇERSİZ → DEC-XXXX`).

Kaynak belge: `MASTER_SPEC.md` (v1.3). Orijinal keşif çıktısı:
`TARIHI_STRATEJI_OYUNU_AGENT_GDD.md` (v1.0, değiştirilmez).

---

## DEC-0001 — GDD'nin temel referans olarak kullanılması

- **Tarih:** 2026-10-28
- **Konu:** Ürün vizyonunun referans belgesi
- **Alternatifler:** (a) GDD v1.0'ı temel referans kabul etmek; (b) önce
  yeniden yazmak
- **Seçilen karar:** (a) GDD, `MASTER_SPEC.md` adıyla projenin temel
  referansıdır; v1.1 bu kayıtlardaki kararları işler.
- **Gerekçe:** Keşif görüşmesinin sistematik özeti; [KARAR]/[TASLAK]/[AÇIK]
  ayrımı korunuyor.
- **Etkilenen modüller:** Tümü
- **Onay kaydı:** Kullanıcı "önerilerini yap" dedi (2026-10-28).
  Açık teyit: "Tasarım tabanı onaylandı" (2026-10-29, DEC-0011).
- **Durum:** GEÇERLİ

## DEC-0002 — Hazine: eksi bakiye mümkün, borçlanma yok

- **Tarih:** 2026-10-28
- **Konu:** Zorunlu giderler (maaş, bakım) geliri aştığında ne olur?
- **Alternatifler:** (a) eksi bakiye; (b) giderler otomatik kesilir /
  birlikler dağılır; (c) öncelik sırasına göre kısmi ödeme
- **Seçilen karar:** (a) **Eksi bakiye mümkündür.** Devlet borçlanması
  yasağı aynen geçerlidir: kredi, faiz, tahvil veya borç veren taraf yok.
- **Uygulama ayrımı** (agent yorumu; kullanıcı 2026-10-29'da "evet"
  ile onayladı):
  - İsteğe bağlı harcamalar hazineyi aşamaz; yetersizse reddedilir (AT-010
    geçerli kalır).
  - Eksi bakiye yalnızca zorunlu, tekrarlayan giderlerden doğar; faiz
    işletmez.
  - Hazine eksideyken isteğe bağlı harcama yapılamaz.
- **Açık kalan:** Eksi bakiyenin sonuçları, alt sınır, UI gösterimi →
  OPEN-023
- **Gerekçe:** Moral sistemi "maaş" etkenini içeriyor (§8.6); gelir
  düşüşünde tanımsız durum kalmamalı.
- **Etkilenen modüller:** Ekonomi, hazine, ordu (maaş/moral), UI
- **Onay kaydı:** Kullanıcı: "eksi bakiye" (2026-10-28)
- **Durum:** GEÇERLİ

## DEC-0003 — Etiket düzeltmeleri

- **Tarih:** 2026-10-28
- **Konu:** [KARAR] etiketli ama içeriği karara bağlanmamış maddeler
- **Seçilen karar:**
  - §2 "Kayıt" satırı → [AÇIK] (OPEN-007)
  - §5.3 "toparlanma veya başka devlete geçme" → [AÇIK] (OPEN-024).
    "Yenilgi her zaman oyun sonu değildir" kısmı [KARAR] olarak kalır.
- **Etkilenen modüller:** Kayıt sistemi, oyun sonu koşulları
- **Onay kaydı:** Kullanıcı: "tamam" (2026-10-28)
- **Durum:** GEÇERLİ

## DEC-0004 — İlk sürüm: tek senaryo, 1453

- **Tarih:** 2026-10-28
- **Konu:** İlk oynanabilir senaryo (OPEN-001)
- **Alternatifler:** (a) 1453, dünya haritası + bölgesel tam ayrıntı;
  (b) 1453, her yerde eşit ayrıntı; (c) birden çok senaryo
- **Seçilen karar:** İlk sürümde **tek senaryo: 1453**. Harita dünya
  ölçekli; tam ayrıntı öncelikle Balkanlar, Anadolu ve Doğu Akdeniz'de,
  dünyanın geri kalanı devlet / büyük bölge düzeyinde (öneri (a)).
- **Açık kalan:** Tam ayrıntı bölgesinin kesin sınırları [TASLAK].
- **Gerekçe:** Veri üretimi ve performans riskini erken aşamada sınırlar;
  "dünya ölçekli harita" kararını bozmaz.
- **Etkilenen modüller:** Harita verisi, tarihî araştırma, kabul testleri
  (AT-001, AT-003)
- **Yan etki:** AT-003 (Kanuni → Şehzade Mustafa) ilk sürümde doğrudan
  test edilemiyordu → DEC-0010 ile güncellendi.
- **Onay kaydı:** Kullanıcı: "ilk sürümde tek senaryo olacak, 1453 yılı"
  + "önerilerini yap" (2026-10-28)
- **Durum:** GEÇERLİ

## DEC-0005 — Tur süresi seçenekleri ve sabit iç adım

- **Tarih:** 2026-10-28
- **Konu:** OPEN-003 (tur süresi seçenekleri)
- **Seçilen karar:** Seçenekler **1 hafta / 1 ay / 3 ay / 1 yıl**.
  Simülasyon seçilen süreden bağımsız olarak sabit iç adımlarla işler;
  tek bir 1 yıllık tur ile 12 adet 1 aylık tur aynı sonucu verir.
- **Açık kalan:** İç adım boyları (öneri: hareket/muharebe günlük,
  ekonomi aylık) [TASLAK].
- **Gerekçe:** AT-005 (tur süresinden bağımsız tutarlılık) ve
  deterministik simülasyon hedefi.
- **Etkilenen modüller:** Tur çekirdeği, tüm simülasyon sistemleri
- **Onay kaydı:** Kullanıcı: "önerilerini yap" (2026-10-28)
- **Durum:** GEÇERLİ

## DEC-0006 — Uzun turda kritik olay kesintisi; kararı oyuncu verir

- **Tarih:** 2026-10-28
- **Konu:** Uzun bir tur sırasında oyuncunun ordusu düşmanla karşılaşırsa
  kim karar verir?
- **Alternatifler:** (a) oyuncu (tur durur); (b) komutan önceden verilmiş
  emre göre; (c) yapay zekâ
- **Seçilen karar:** (a) **Oyuncu karar verir.** Kritik olayda (oyuncu
  ordusunun düşmanla karşılaşması, oyuncuya savaş ilanı, hükümdar ölümü
  vb.) uzun tur o noktada durur.
- **Açık kalan:** Kesinti tetikleyicilerinin tam listesi; hangilerinin
  ayarlardan kapatılabileceği [TASLAK].
- **Etkilenen modüller:** Tur çekirdeği, hareket, muharebe, UI
  bildirimleri
- **Onay kaydı:** Kullanıcı: "ben" (2026-10-28)
- **Durum:** GEÇERLİ

## DEC-0007 — En küçük fethedilebilir birim: poligon arazi birimi

- **Tarih:** 2026-10-28
- **Konu:** OPEN-002
- **Alternatifler:** (a) elle çizilmiş poligon arazi birimleri; (b)
  altıgen/kare grid
- **Seçilen karar:** (a) Boyutu yerleşim yoğunluğuna göre değişen
  (kabaca kaza/nahiye ölçeği) poligon birimler. Şehirler bu birimlerden
  ayrı nokta nesneleridir. Grid kullanılmaz.
- **Açık kalan:** Toplam birim sayısı, topolojik veri biçimi.
- **Gerekçe:** "Net siyasi sınırlar", "tarihî idari yapı" ve "şehir ile
  çevresi ayrı fethedilir" kararlarıyla doğrudan uyumlu.
- **Etkilenen modüller:** Harita verisi, toprak kontrolü, hareket, savaş
- **Onay kaydı:** Kullanıcı: "önerilerini yap" (2026-10-28)
- **Durum:** GEÇERLİ

## DEC-0008 — Geri çekilme oyuncunun kararına bağlı

- **Tarih:** 2026-10-28
- **Konu:** "Komutan emre uymak zorunda" kuralı (§3.3) ile moral kaynaklı
  geri çekilme (§8.6) arasındaki ilişki
- **Seçilen karar:** Geri çekilme oyuncunun verdiği karara/emre bağlıdır.
  Emre uygun geri çekilme, emre aykırılık sayılmaz.
- **Uygulama** (agent yorumu; kullanıcı 2026-10-29'da "evet" ile
  onayladı): Oyuncu ordu emri olarak geri çekilme koşulunu belirler (ör.
  "belirli kayıp eşiğinde çekil", "son ana kadar diren").
- **Açık kalan:** Emir seçeneklerinin kesin listesi; moral tamamen
  çöktüğünde dağılmanın emirden bağımsız olup olmayacağı.
- **Etkilenen modüller:** Ordu emirleri, muharebe, moral
- **Onay kaydı:** Kullanıcı: "geri çekilmede karara bağlı" (2026-10-28);
  yorum teyidi "evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0009 — Keşif sorusu 93'ün kayda alınması

- **Tarih:** 2026-10-28
- **Konu:** §15'teki "93. soru" atfının izlenebilirliği
- **Seçilen karar:** Sorunun tam metni ve kullanıcı cevabı (A —
  önceden görülebilir) `docs/gdd/kesif-sorulari.md` dosyasına eklendi.
  B–E seçenekleri onaylanmış sayılmaz.
- **Etkilenen modüller:** İsyan / istikrar
- **Onay kaydı:** Kullanıcı soru metnini ve "a" cevabını verdi
  (2026-10-28)
- **Durum:** GEÇERLİ

## DEC-0010 — AT-003 kabul testinin 1453 senaryosuna uyarlanması

- **Tarih:** 2026-10-29
- **Konu:** Kanuni → Şehzade Mustafa örneği tek senaryolu (1453) ilk
  sürümde test edilemiyor (DEC-0004).
- **Seçilen karar:** AT-003: "II. Mehmed'in ölümünde oyuncu, veraset
  kuralları izin verdiğinde tarihî halef II. Bayezid yerine başka bir
  şehzadeyi seçer; alternatif soy çizgisi başlar ve sonraki nesiller
  tarihî soya otomatik dönmez."
- **Etkilenen modüller:** Hanedan / veraset, QA
- **Onay kaydı:** Kullanıcı: "evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0011 — Aşama 0 kapısı geçildi

- **Tarih:** 2026-10-29
- **Konu:** Tasarım tabanının onayı
- **Seçilen karar:** `MASTER_SPEC.md` v1.2 ve DEC-0001 – DEC-0010 onaylı
  tasarım tabanıdır. [TASLAK] ve [AÇIK] maddeler onaya tabi olmaya devam
  eder.
- **Etkilenen modüller:** Tümü
- **Onay kaydı:** Kullanıcı: "Tasarım tabanı onaylandı" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0012 — Teknoloji: TypeScript + three.js, oyun motoru yok

- **Tarih:** 2026-10-29
- **Konu:** OPEN-005 (harita render / motor teknolojisi)
- **Alternatifler:** (a) web tabanlı özel motor (TypeScript + WebGL
  kütüphanesi); (b) Godot; (c) Unity
- **Seçilen karar:** (a) **TypeScript + three.js.** Hazır oyun motoru
  kullanılmaz.
- **Açık kalan:** Simülasyonun çalışma yeri (istemci / Web Worker /
  sunucu — OPEN-006), kayıt ve veri formatı, test çerçevesi.
- **Sonuç:** TASK-0001'deki üç seçenekli karşılaştırma gereksizleşti;
  görev three.js yaklaşımının ölçümüne daraltıldı.
- **Etkilenen modüller:** Harita, UI, tüm istemci kodu
- **Onay kaydı:** Kullanıcı: "typescript ile three.js. Oyun motoru
  istemiyorum" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0013 — Platform sırası: önce web, mobil ertelendi

- **Tarih:** 2026-10-29
- **Konu:** İlk hedef platform (MASTER_SPEC §17.2, OPEN-019, OPEN-022)
- **Seçilen karar:** Geliştirme ve ölçümler önce masaüstü web
  tarayıcısında yapılır. Mobil hedef iptal edilmedi, sonraki aşamaya
  bırakıldı. Aşama 1'deki "basit mobil etkileşim" çıktısı ertelendi.
- **Etkilenen modüller:** UI, harita etkileşimi, performans hedefleri
- **Onay kaydı:** Kullanıcı: "başlangıç olarak sadece web gidelim",
  "mobil beklesin" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0014 — ADR-0001 render yaklaşımı Aşama 1 temeli

- **Tarih:** 2026-10-29
- **Konu:** TASK-0001 kabulü
- **Seçilen karar:** ADR-0001'deki katman yapısı (tek dolgu geometrisi,
  ayrı sınır katmanları, piksele göre LOD, CPU nokta–poligon seçimi)
  Aşama 1'in temelidir.
- **Kullanıcı geri bildirimi:** Sentetik test haritası olarak uygun;
  görsel kalite artırılmalı (TASK-0002 kapsamında).
- **Açık kalan:** Zayıf cihaz ölçümü — kullanıcının şu an böyle bir
  cihazı yok; OPEN-019 açık kalır, ölçüm ertelendi.
- **Etkilenen modüller:** Harita
- **Onay kaydı:** Kullanıcı: "evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0015 — Depo: GitHub (özel), doğrudan main

- **Tarih:** 2026-10-29
- **Konu:** Uzaktan (Claude remote) devam edebilmek için sürüm kontrolü
- **Seçilen karar:** Proje github.com/onuryilmaaz/tarihi-oyun özel
  deposundadır. Çalışma doğrudan `main` dalında yapılır.
- **Onay kaydı:** Kullanıcı depoyu kendisi oluşturup gönderdi; "mainde
  yapabilirsin sorun yok" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0016 — TASK-0002 coğrafyası: gerçek dünya + 1453 dönemi sınırları

- **Tarih:** 2026-10-29
- **Konu:** TASK-0002 açık sorusu 1
- **Alternatifler:** (a) sentetik harita; (b) Natural Earth gerçek dünya
  coğrafyası
- **Seçilen karar:** (b) Natural Earth (kamu malı) coğrafyası; siyasi
  sınırlar 1453 dönemine ait olacak.
- **Uygulama notu:** Prototipte 1453 sınırları, Natural Earth modern
  1. düzey idari birimlerinin (il/eyalet) 1453 devletlerine atanmasıyla
  **yaklaşık** olarak üretilir; gerektiğinde birimler elle bölünür (ör.
  Konstantiniyye). Atamalar agent'ın genel tarih bilgisine dayanır,
  kaynaklandırılmamıştır ve **tahmin** olarak etiketlenir (§5.1). Gerçek
  senaryo verisi değildir; kaynaklı veri OPEN-018 ile ayrıca ele alınır.
- **Onay kaydı:** Kullanıcı: "gerçek dünya haritası ama sınırlar o zamana
  ait olsun. önerin iyi" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0017 — Commit ve push kullanıcı onayıyla

- **Tarih:** 2026-10-29
- **Konu:** DEC-0015'teki çalışma düzeninin netleştirilmesi
- **Seçilen karar:** Agent commit atmadan ve push etmeden önce kullanıcıya
  sorar; onay olmadan commit/push yapılmaz. Çalışma `main` dalında devam eder.
- **Onay kaydı:** Kullanıcı: "commit atmadan bana sor" (2026-10-29)
- **Durum:** GEÇERLİ (DEC-0015'i bu yönüyle günceller)

## DEC-0018 — Görsel yön: Tarihî atlas

- **Tarih:** 2026-10-29
- **Konu:** OPEN-021 (sanat yönü) — harita görsel yönü
- **Alternatifler:** Tarihî atlas, Modern siyasi, Gece (`docs/ui-ux/gorsel-yon-denemeleri.md`)
- **Seçilen karar:** **Tarihî atlas** (parşömen dokusu, soluk toprak tonları,
  mürekkep sınırlar, Cinzel / Cormorant Garamond yazı). Başkent işaretleri
  daha belirgin yapıldı (halka + nokta işareti, büyük ve kalın ad).
- **Açık kalan:** Oyun adı ve görsel marka (OPEN-021'in diğer kısmı); arayüz
  panellerinin nihai stili.
- **Onay kaydı:** Kullanıcı: "tarihi" + "başkentleri daha belirgin yapabilirsin" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0019 — Aşama 1 kapısı geçildi

- **Tarih:** 2026-10-29
- **Konu:** Aşama 1 (harita deneyimi prototipi) kabulü
- **Seçilen karar:** Görsel yön (DEC-0018) ve etkileşim (seçim hiyerarşisi,
  etiketler, yakınlaştırma) kabul edildi. TASK-0002 kabul edildi.
- **Not:** Mobil etkileşim DEC-0013 gereği ertelendi.
- **Onay kaydı:** Kullanıcı: "şuan gayet iyi. sadece başkentleri daha belirgin
  yapabilirsin." (2026-10-29) — başkent düzeltmesi yapıldı.
- **Durum:** GEÇERLİ

## DEC-0020 — Oyun ticari olarak satılmayacak

- **Tarih:** 2026-10-29
- **Konu:** OPEN-022 (gelir modeli) — veri lisansı seçimini etkiler
- **Seçilen karar:** Oyun ticari olarak satılmayacak.
- **Sonuç:** Ticari olmayan (NC) lisanslı kaynaklar artık lisans açısından
  kullanılabilir. Yine de CC0 / kamu malı kaynaklar tercih edilir; NC veya
  copyleft (GPL, BY-SA) veri kullanılırsa kaynak ve lisans kaydı tutulur.
  İleride ticari karar alınırsa bu veriler ayıklanabilmelidir.
- **Açık kalan:** Yayın platformu sırası (OPEN-022'nin diğer kısmı).
- **Onay kaydı:** Kullanıcı: "hayır" (ticari satış sorusuna, 2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0021 — 1453 veri yöntemi: karma, proje kendi veri setini üretir

- **Tarih:** 2026-10-29
- **Konu:** OPEN-018 (TASK-0003 önerisi)
- **Seçilen karar:** Coğrafya Natural Earth; siyasi sınırlar mümkün olduğunca
  OpenHistoricalMap CC0 kayıtları (kayıt bazında lisans kontrolü); devlet,
  hükümdar ve başkent verisi Wikidata (CC0); kalan yerler tahmin ve literatür;
  kaza/nahiye katmanı projenin kendi çizimi. Lisansı kısıtlı kaynaklar
  karşılaştırma için.
- **Euratlas:** Teklif istenmeyecek.
- **Doğrulama:** Tarihçi erişimi yok. Doğrulama agent'ın kaynak
  karşılaştırması ve kullanıcı kontrolüyle yapılır; her devlet ve sınır için
  `kaynak` ve `guven` alanı tutulur, düşük güvenli bölgeler haritada ve
  belgelerde işaretlenir.
- **Onay kaydı:** Kullanıcı: "evet", "gerek yok", "yok" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0022 — v0.2 harita düzeltmeleri (TASK-0004 kararları)

- **Tarih:** 2026-10-29
- **Konu:** OHM verisinin şüpheli atamaları ve varsayılan sürüm
- **Seçilen karar:**
  1. **Napoli ayrı devlettir.** OHM'nin Aragon kaydından İtalya anakarasına düşen parçalar
     Napoli Krallığı'na verilir; ortak hükümdar (V. Alfonso) ileride hanedan sistemiyle gösterilir.
  2. **Dağıstan:** OHM'nin Büyük Orda ataması geri alınır; Gazikumuk Şamhallığı kalır.
  3. **Güneydoğu Anadolu:** Malatya ve Antep Memlûk'te kalır; Urfa Akkoyunlu'ya döner.
  4. **Varsayılan sürüm:** Prototip v0.2 ile açılır.
- **Uygulama:** `scripts/ohm-esleme.mjs` → `OHM_DUZELTME`; geri alınan parçaların kaynağı "tahmin".
- **Onay kaydı:** Kullanıcı: "önerin kalsın", "önerini uygula", "tamam", "olur" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0023 — Simülasyon çekirdeği mimarisi (ADR-0002)

- **Tarih:** 2026-10-29
- **Konu:** OPEN-006 (simülasyon dili ve çalışma yeri), kod yapısı, takvim, Aşama 2 kayıt iskeleti
- **Seçilen karar:**
  1. Simülasyon **tarayıcıda, TypeScript, Web Worker** içinde çalışır. Çekirdek DOM'dan ve
     three.js'ten bağımsız saf bir modüldür; ileride sunucuda da çalışabilir.
  2. Kod `packages/sim` (kurallar) ve `packages/istemci` (harita ve arayüz) olarak iki pakete
     ayrılır (npm workspaces). Testler Vitest ile yazılır; prototipler olduğu gibi kalır.
  3. **Takvim: Jülyen.** İçeride gün sayacı (Jülyen gün numarası), ekranda Jülyen tarih.
  4. **Kayıt:** Yalnızca tarayıcıda yerel (IndexedDB), JSON + şema sürümü; manuel kayıt +
     tek otomatik kayıt. Ironman, geri sarma ve bulut kaydı yok (OPEN-007 ve OPEN-020 açık).
- **Onay kaydı:** Kullanıcı: "dediğin gibi yap", "mantıklı", "önerini uygula", "aynen" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0024 — Aşama 2 kapısı geçildi

- **Tarih:** 2026-10-29
- **Konu:** Aşama 2 (tur ve dünya durumu çekirdeği) kabulü
- **Seçilen karar:** Tur deneyimi (tarih, tur süresi, Turu ilerlet, kesinti, kaydet/yükle) ve
  TASK-0005 kabul edildi. Sıradaki aşama: Aşama 3 (siyasi kontrol ve hareket).
- **Onay kaydı:** Kullanıcı: "onaylıyorum" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0025 — Aşama 3 hareket ve kontrol kararları (TASK-0006)

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. **Hareket ağı:** Arazi birimlerinin (çok parçalı birimlerde parça başına) komşuluk ağı;
     boğaz geçitleri elle tanımlanır ve ek süre alır.
  2. **Arazi zorluğu:** NOAA ETOPO yükseklik verisi (ABD kamu malı) ile birim başına engebe →
     hız çarpanı; büyük nehir geçişleri Natural Earth nehirlerinden ceza alır.
  3. **Erişim (diplomasiye kadar):** Ordu yalnızca kendi ve devletsiz topraklarda hareket eder;
     yabancı toprak hedefi gerekçesiyle reddedilir.
  4. **Başlangıç orduları:** Yalnızca oyuncu devlete 2 test ordusu (başkent + büyük bir şehir);
     yabancı ordular görünürlük kuralıyla Aşama 4'te.
- **Onay kaydı:** Kullanıcı: "hepsini yap" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0026 — Aşama 3 kapısı geçildi

- **Tarih:** 2026-10-29
- **Konu:** Aşama 3 (siyasi kontrol ve hareket) kabulü
- **Seçilen karar:** Kullanıcı tüm denemeleri (hedef verme, yürüyüş, yasak hedefler, durdurma,
  test işgali, kaydet/yükle) kendi tarayıcısında başarıyla yaptı; TASK-0006 kabul edildi.
  Sıradaki aşama: Aşama 4 (savaş, kuşatma ve barış).
- **Onay kaydı:** Kullanıcı: "hepsi başarılı", "Evet şunalık gayet iyi", "onaylıyorum" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0027 — Aşama 4 kararları (TASK-0007)

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. **Düşman davranışı (AI'ye kadar):** Yabancı ordular yerinde savunur; temas olursa savaşır,
     yenilirse en yakın kendi şehrine çekilir; kendiliğinden saldırmaz. Barışta basit kural: savaş
     skoru talebi karşılıyorsa kabul. Gerçek AI Aşama 6'da.
  2. **Görünürlük:** Oyuncu kendi topraklarını, bunlara komşu birimleri ve ordularının 2 düğüm
     çevresini görür; dışarıdaki yabancı ordular görünmez. Görülen düşmanın büyüklüğü yaklaşık
     gösterilir; kesin sayı istemciye gönderilmez (AT-013).
  3. **Muharebe:** Günlük muharebe turları (en çok 5 gün); kayıp sayı × moral × arazi (savunana
     zorluk bonusu) ile orantılı; tohumlu ±%15 oynama; moral eşiği aşılınca geri çekilme, tamamen
     çöküşte dağılma. Komutan, birlik türü ve teknoloji sonradan aynı formüle eklenir.
  4. **Teslim sırası:** 4a (savaş, görünürlük, muharebe, moral, geri çekilme) → 4b (asker toplama,
     maaş, ikmal, birleştir/böl) → 4c (kuşatma, işgal, barış); her alt teslimden sonra kullanıcı testi.
- **Onay kaydı:** Kullanıcı: "önerilerin gayet yerinde. onaylıyorum" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0028 — Arayüz pencereleri ve agent devir teslimi

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. Tarayıcının kendi pencereleri (alert, confirm, prompt) kullanılmaz; onaylar ve uyarılar oyunun
     kendi tasarımıyla gösterilir. Savaş ilanı onayı `#onay` penceresine taşındı.
  2. Çalışma farklı AI agent'lar (Claude, Codex vb.) arasında devredilebilir. Oturumu biten agent
     `DEVIR-TESLIM.md`'yi günceller; yeni agent onu okuyarak aynı kurallarla devam eder.
- **Onay kaydı:** Kullanıcı: "onay ekranı da bizim tasarladığımız bir ekran olsun… codex e geçicem
  kaldığın yeri onun devam edeceği şekilde hallet. aynı şeyi o da limiti bitince yapsın." (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0029 — 4b'ye geçiş onayı

- **Tarih:** 2026-10-29
- **Konu:** TASK-0007 alt teslim sırası (DEC-0027/4)
- **Seçilen karar:** Kullanıcı 4b'ye (asker toplama, maaş, ikmal, birleştir/böl)
  başlanmasına açık onay verdi. 4c ve Aşama 4 kapanışı ayrıca kullanıcı kabulü bekler.
- **Onay kaydı:** Kullanıcı: “4b geçebilirsin” (2026-10-29).
- **Durum:** GEÇERLİ

## DEC-0030 — 4b kullanıcı kabulü

- **Tarih:** 2026-10-29
- **Konu:** TASK-0007 / 4b alt tesliminin kabulü (DEC-0027/4, DEC-0029)
- **Seçilen karar:** Kullanıcı 4b'yi kendi tarayıcısında test etti ve başarılı buldu;
  asker toplama, maaş, ikmal ve bölme/birleştirme alt teslimi kabul edildi.
  4c'ye başlama ve Aşama 4 kapanışı henüz onaylanmadı.
- **Etkilenen belgeler:** Görev, aşama, test raporu ve devir teslim durumları.
- **Onay kaydı:** Kullanıcı: “test ettim başarılı” (2026-10-29).
- **Durum:** GEÇERLİ

## DEC-0031 — 4c'ye başlama onayı

- **Tarih:** 2026-10-29
- **Konu:** TASK-0007 / 4c (DEC-0027/4)
- **Seçilen karar:** 4b kabulünden sonra kuşatma, gerçek işgal, savaş skoru ve barış
  alt tesliminin uygulanmasına başlandı. Aşama 4 kapanışı ayrıca kullanıcı testi/onayı bekler.
- **Onay kaydı:** Kullanıcı, 4c'ye başlama sorusuna “başla” dedi (2026-10-29).
- **Durum:** GEÇERLİ

## DEC-0032 — 4c testini birleştirme ve Aşama 5'e geçiş

- **Tarih:** 2026-10-29
- **Konu:** Kullanıcının test takvimi ve sıradaki işe başlama talimatı
- **Seçilen karar:** Kullanıcı 4c testini sonraki adımla birlikte yapacak; buna rağmen
  Aşama 5'e başlanmasına açık izin verdi. Bu, önceki “4c kabulünden önce ilerleme”
  bekleyişini bu geçiş için değiştirir; 4c test edilmiş/kabul edilmiş sayılmaz ve Aşama 4
  resmî kabulü açık kalır. 4c + ilk Aşama 5 teslimi birlikte kullanıcı testine sunulacak.
- **İlk sınırlı teslim:** TASK-0008 / 5a, mevcut gelir/maaş/harcama rezervasyonunu gösteren
  bütçe özeti. Yeni gelir, harcama, bina veya araştırma kuralı eklenmez. Diğer Aşama 5
  taslaklarının kapsamı/formülleri ayrıca netleştirilir.
- **Devir:** Kullanıcı limit uyarısı yaptı; tamamlanmış 5a sonrası test/çalışma ağacı ve
  bekleyen kararlar DEVIR-TESLIM'e aktarılır. Commit/push izni verilmedi.
- **Onay kaydı:** Kullanıcı: “şuanlık sadece bu testleri daha sonraki adımla beraber yapayım.
  sen sıradaki adıma geç ama limitin az kalmış ona göre yap.” (2026-10-29).
- **Durum:** GEÇERLİ

## DEC-0033 — 4c/5a kısmi test, 5b kapsamı onayı

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. Kullanıcı 4c ve 5a'yı "az çok" test etti, sorun bildirmedi; ayrıntılı test sonraki turlarda
     yapılacak. Aşama 4'ün resmî kapanışı ayrıntılı testle birlikte yapılır (açık kalır).
  2. **5b kapsamı:** Şehir yatırımları — tarla (gelir), pazar (gelir) ve sur (kuşatma direnci);
     seviyeli, maliyetli ve yapım süreli yapılar. İlk adımda yatırımı yalnızca oyuncu yapar;
     bütçe sınırlı otomatik yerel yönetici (OPEN-016) ayrı adımda. Sayılar `denge.ts`'te [TASLAK]
     olarak tutulur ve kullanıcıya test raporuyla sunulur. 5c (teknoloji ağacı) 5b'den sonra.
  3. Codex'in 4b/4c/5a çalışması kullanıcı onayıyla commit edildi.
- **Onay kaydı:** Kullanıcı: "commitle", "az çok yaptım diğer turlarda daha detaylı yaparız", "yap" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0034 — 5b kabulü ve 5c teknoloji ağacına başlama

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. 5b (şehir yatırımları) kullanıcı tarafından test edildi ve kabul edildi.
  2. 5c onaylandı: üç alanlı (askerî, ekonomik, idari) küçük teknoloji ağacı, aynı anda iki araştırma,
     her teknoloji somut bir içerik açar. Teknoloji listesi, bedel ve süreleri önce taslak olarak
     kullanıcıya sunulur (TASK-0008 / 5c), onaydan sonra kodlanır (OPEN-011'in ilk kapsamı).
- **Onay kaydı:** Kullanıcı: "uygun", "yap", "onaylıyorum" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0035 — 5c teknoloji listesi onayı

- **Tarih:** 2026-10-29
- **Seçilen karar:** TASK-0008 / 5c'deki 9 teknolojilik liste (askerî, ekonomik, idari; bedel, süre,
  ön koşul ve etkileri) ve kurallar (en çok 2 eş zamanlı araştırma, farklı alanlarda; bedel başta
  ödenir, borç yok) onaylandı. Sayılar `denge.ts`'te [TASLAK]; OPEN-011'in ilk kapsamı kapanır.
- **Onay kaydı:** Kullanıcı: "uygun uygun başla" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0036 — 5c kabulü ve test sunucusu

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. 5c (teknoloji ağacı) kullanıcı tarafından test edildi ve kabul edildi; commit + push onaylandı.
  2. Kullanıcı testleri de **5173**'teki geliştirme sunucusunda yapılır; 4175 önizlemesi kullanılmaz
     (AGENTS.md'deki eski "kullanıcı 4175" kuralının yerine geçer).
  3. Sıradaki: 4c/5a ayrıntılı kullanıcı testi; sonra Aşama 4 ve 5 kapanış onayı istenir.
- **Onay kaydı:** Kullanıcı: "pushla", "başarılı", "neden tekrardan 4175 portuna geçtik. 5173 açık oradan devam edecektik" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0037 — Aşama 4 ve Aşama 5 kapanışı; Aşama 6'ya geçiş

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. Kullanıcı 4c/5a ayrıntılı testini yaptı (bütçe, savaş/kuşatma, barış, kayıt): "hepsi başarılı".
     **Aşama 4 kapandı.**
  2. **Aşama 5 kapandı.** Kabul ölçütündeki "şehir yönetimi otomasyona devredilebilir" maddesi
     Aşama 7'deki yerel yönetim kapsamına ertelendi (OPEN-016 açık kalır).
  3. **Aşama 6 (diplomasi ve AI devletleri) onaylandı.** Önce kapsam ve görev kartı (TASK-0009)
     kullanıcı onayına sunulur; kart onaylanmadan üretim kodu yazılmaz.
- **Onay kaydı:** Kullanıcı: "hepsi başarılı"; "1- evet 2- b 3- evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0038 — Aşama 6 görev kartı (TASK-0009) onayı

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. 6a (ilişkiler, diplomasi haritası, ilk eylemler) → 6b (AI ekonomi) → 6c (AI savaş/barış) sırası ve
     TASK-0009 kapsamı onaylandı; her alt adım sonunda kullanıcı testi.
  2. İlk diplomatik eylemler: savunma ittifakı (kur / çık) ve hediye. Geçiş izni, ticaret, vasallık,
     ateşkes sonraki bir alt adımda ayrıca onaylanır.
  3. Başlangıç ilişkileri: agent'ın hazırlayacağı küçük tarihî tahmin tablosu ([TASLAK], kullanıcı onayına sunulur).
  4. AI'dan oyuncuya gelen savaş ilanı ve barış teklifi turu durdurur (DEC-0006); ittifak teklifi yalnızca bildirim.
- **Onay kaydı:** Kullanıcı: "1- evet 2- önerin güzel yap onu 3- a 4- evet 5- evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0039 — 6a kabulü ve başlangıç ilişki tablosu

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. 6a (ilişkiler, savunma ittifakı, hediye, diplomasi haritası) kullanıcı tarafından test edildi ve kabul edildi.
  2. `veri/senaryo-1453/iliskiler.json` başlangıç tablosu (40 ilişki, 4 ittifak) onaylandı; değerler [TASLAK],
     denge testlerinde düzeltilebilir.
  3. 6a commit + push onaylandı; 6b (AI ekonomi ve ordu hazırlığı) başlar.
- **Onay kaydı:** Kullanıcı: "1- başarılı 2- uygundur 3- evet 4- evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0040 — 6b kabulü, garnizon formülü düzeltmesi ve 6c'ye geçiş

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. 6b (AI ekonomi ve ordu hazırlığı) kullanıcı tarafından test edildi ve kabul edildi.
  2. Garnizon ordusu formülünden sabit 2.000 asker kaldırıldı (`GARNIZON_TABAN: 0`; arazi başına 300 kalır).
     Başlangıçta eksi bütçeli devlet sayısı 71 → 0. Yalnızca yeni oyunları etkiler; senaryoda tanımlı
     Osmanlı orduları değişmez. Terhis mekaniği eklenmedi.
  3. 6b commit + push onaylandı; 6c (AI savaş ilanı, sefer, kuşatma, barış) başlar.
- **Onay kaydı:** Kullanıcı: "1- test başarılı 2- a 3- evet 4- başla" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0041 — 6c kabulü ve Aşama 6 kapanışı

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. 6c (AI savaş ilanı, sefer, kuşatma, barış, oyuncuya gelen teklifler) kullanıcı tarafından test edildi ve kabul edildi.
  2. **Aşama 6 kapandı.** AI'lar arası yeni ittifak kurma ve ileri diplomasi (geçiş izni, ticaret, vasallık,
     ateşkes antlaşması, ambargo) sonraki bir alt adıma ertelendi; ayrıca onaylanır.
  3. 6c commit + push onaylandı. Aşama 7'ye geçiş ayrıca kullanıcı onayı ister.
- **Onay kaydı:** Kullanıcı: "1- tamam 2- pushla 3- a" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0042 — Aşama 7'ye geçiş

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. Aşama 7 (hanedan, karakter, nüfus, kültür, iç siyaset) başlar; önce TASK-0010 kartı onaya sunulur.
  2. Sıra: 7a hükümdar ve veraset → 7b nüfus grupları, din/kültür, göç → 7c istikrar ve isyan riski → 7d yerel yönetim
     (şehir otomasyonu, OPEN-016).
  3. Tarihî hükümdar verisi: önemli devletler (~20–30) için elle hazırlanmış küçük tablo (kullanıcı onayına sunulur);
     diğer devletlerde kurallarla üretilen, açıkça kurgusal işaretli hükümdarlar.
- **Onay kaydı:** Kullanıcı: "1- evet 2- uygun 3- a" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0043 — 7a (hükümdar ve veraset) kapsamı

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. TASK-0010 / 7a kapsamı onaylandı (hükümdar, yetenekler, meşruiyet, veraset gelenekleri, tarihî/kurgusal halef).
  2. Ölüm yaşa bağlı olasılıkla; tarihî ölüm tarihi zorlanmaz.
  3. Yetenek etkileri küçük: gelir ve muharebe gücü en çok ±%10, diplomatik bakış en çok ±10.
  4. Oyuncunun hükümdarı ölünce tur durur; halefi oyuncu oyunun kendi penceresinde seçer.
  5. DEC-0042 ve TASK-0010/ASAMA-7 taslakları commit + push edilir; hükümdar tablosu onaya sunulur.
- **Onay kaydı:** Kullanıcı: "1- uygundur 2- evet 3- evet 4- evet 5- evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0044 — 7a kabulü ve hükümdar tablosu

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. 7a (hükümdar ve veraset) kullanıcı tarafından test edildi ve kabul edildi.
  2. `veri/senaryo-1453/hukumdarlar.json` (31 devlet, veraset gelenekleri, ad havuzları) onaylandı; değerler [TASLAK].
  3. 7a commit + push onaylandı; 7b (nüfus grupları, din/kültür, göç) kapsamı önce onaya sunulur.
- **Onay kaydı:** Kullanıcı: "1- başarılı 2- uygun 3- evet 4- evet" (2026-10-29)
- **Durum:** GEÇERLİ
