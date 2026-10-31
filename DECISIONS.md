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

## DEC-0045 — 7b (nüfus grupları, din/kültür, göç) kapsamı

- **Tarih:** 2026-10-29
- **Seçilen karar:** TASK-0010 / 7b kapsamı onaylandı: din × kültür nüfus grupları (toplam = şehir nüfusu), devlet/bölge
  varsayılanı + önemli şehir düzeltmeleri (tahmini tablo onaya sunulur), yıllık doğal artış, kuşatma/işgal kaybı ve
  göç, basit **iskân** emri, aynı din +10 / farklı din ailesi −10 ilişki bileşeni, "Din" ve "Kültür" harita modları.
  Test amaçlı günlük rastgele nüfus artışı kaldırılır.
- **Onay kaydı:** Kullanıcı: "1- evet 2- evet 3- evet 4- evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0046 — 7b kabulü ve nüfus tablosu

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. 7b (nüfus grupları, din/kültür, göç, iskân, Din/Kültür harita modları) kullanıcı tarafından test edildi ve kabul edildi.
  2. `veri/senaryo-1453/nufus.json` (132 devlet varsayılanı, 41 şehir düzeltmesi, 9 din, 44 kültür) onaylandı; [TASLAK].
  3. 7b commit + push onaylandı; 7c (istikrar ve isyan riski) kapsamı önce onaya sunulur.
- **Onay kaydı:** Kullanıcı: "1- başarılı 2- uygun 3- evet 4- evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0047 — 7c (istikrar ve isyan riski) kapsamı

- **Tarih:** 2026-10-29
- **Seçilen karar:** TASK-0010 / 7c kapsamı onaylandı: şehir başına 0–100 isyan riski, bileşenleri ve "geçen aya göre
  neden değişti" açıklaması, İstikrar harita modu; aşamalar huzursuzluk (≥ 50, gelir yarı) ve ayaklanma (3 ay ≥ 80;
  gelir/asker/inşaat yok, tur durur); bağımsızlık sonraya; araçlar ordu bulundurma ve tek seferlik bağış; yüksek
  risk yalnızca uyarı verir.
- **Onay kaydı:** Kullanıcı: "hepsine evet diyorum" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0048 — 7c kabulü

- **Tarih:** 2026-10-29
- **Seçilen karar:** 7c (istikrar ve isyan riski; Codex uygulaması, şema 13, 158 test) kullanıcı tarafından test edildi
  ve kabul edildi. Sıradaki adım 7d (yerel yönetim) kapsamının onaya sunulmasıdır.
- **Onay kaydı:** Kullanıcı: "testleri yaptım diğer adıma geçebiliriz" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0049 — 7d (yerel yönetim) kapsamı

- **Tarih:** 2026-10-29
- **Seçilen karar:** TASK-0010 / 7d kapsamı onaylandı (OPEN-016'nın ilk kapsamı): şehir başına aç/kapa yerel yönetici;
  oyuncunun aylık toplam bütçe tavanı ve hazine alt sınırı; yetki yalnızca bağış (riskli şehir) ve tarla/pazar;
  öncelik önce bağış sonra en kârlı yatırım; elle verilen emir/inşaat her zaman önce; her harcama günlükte;
  varsayılan: yöneticiler kapalı, bütçe 0. 7c commit + push onaylandı.
- **Onay kaydı:** Kullanıcı: "1- evet 2- evet 3- evet 4- evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0050 — 7d kabulü, Aşama 7 kapanışı, Aşama 8'e geçiş

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. 7d (yerel yönetim) kullanıcı tarafından test edildi ve kabul edildi; commit + push onaylandı.
  2. **Aşama 7 kapandı** (7a–7d kabul). Sonraya kalanlar: isyan eden şehrin bağımsızlığı / yeni devlet, vergi
     politikası, yerel yöneticiye geniş yetki.
  3. Aşama 8 (denizcilik, casusluk, ileri sistemler) başlar; önce TASK-0011 kapsamı onaya sunulur.
- **Onay kaydı:** Kullanıcı: "1- başarılı 2- evet 3- evet 4- evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0051 — Aşama 8 görev kartı (TASK-0011) onayı

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. 8a donanma ve deniz kontrolü → 8b ticaret yolları → 8c casusluk sırası ve kapsamı onaylandı.
  2. Deniz haritası: elle tanımlanmış ~25 deniz bölgesi ve liman şehirleri (liste kullanıcı onayına sunulur).
  3. Gemi türleri: **kadırga** ve **kalyon** (kullanıcı: "kadırga ve dev kalyonlar"). Not: kalyon tarihî olarak
     16. yy'da yaygınlaşır; teknolojiye bağlanması ayrıca sorulur.
  4. Aşama 8 taslak belgeleri commit + push edilir.
- **Onay kaydı:** Kullanıcı: "1- evet 2- önerin iyi 3- kadırga ve dev kalyonlar 4- evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0052 — 8a kabulü, kalyon teknolojisi, sol panel düzeni

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. 8a (donanma ve deniz kontrolü) kullanıcı tarafından test edildi ve kabul edildi; commit + push onaylandı.
  2. `veri/senaryo-1453/deniz.json` (29 bölge, 70 liman, 6 boğaz, 15 başlangıç donanması) onaylandı; [TASLAK].
  3. Kalyon yeni **"Kalyon İnşası"** teknolojisine bağlanır (askerî alan); araştırmadan kalyon yapılamaz.
     Başlangıç donanmalarındaki kalyonlar korunur.
  4. Sol panel sekmeli ve daha düzenli olur; seçili devletin (oyuncunun) arması üstte görünür; yatay kaymalar giderilir.
     Armalar lisanslı görsel değil, oyunun kendi ürettiği simgelerdir (renk + din/kültür sembolü).
  5. 8b (ticaret yolları) başlar.
- **Onay kaydı:** Kullanıcı: "1- başarılı 2- uygun 3- b 4- pushla 5- evet"; "sol paneli daha kullanışlı yap … sekme bazlı devlet armaları falan olsun seçili devlete ait" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0053 — Panel geri bildirimi, 8b kabulü, 8c'ye geçiş

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. Sol panel "daha iyi olabilir": genişlik 272 → 340 px; form alanları (sayı, liste, onay kutusu) tarayıcı varsayılanı yerine
     oyunun koyu/altın temasıyla. Lejantlar panel genişliğine göre konumlanır.
  2. 8b (ticaret) ve kalyon teknolojisi testleri tamam sayıldı; commit + push onaylandı.
  3. 8c (casusluk) başlar.
- **Onay kaydı:** Kullanıcı: "1- daha iyi olabilir. panel biraz daha geniş olsun. input alanları default olmasın orayı da bizim tasarımı kullan. 2- evet 3- evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0054 — 8c kabulü, Aşama 8 kapanışı, Aşama 9'a geçiş, açılır liste tasarımı

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. 8c (casusluk) kullanıcı tarafından test edildi ve kabul edildi; commit + push onaylandı.
  2. **Aşama 8 kapandı.** Sonraya: AI gemi inşası, kara ticaret yolları/antlaşmalar, karşı istihbarat ve yanlış bilgi.
  3. Aşama 9 (tarihî içerik, UX, optimizasyon) başlar; önce TASK-0012 kapsamı onaya sunulur.
  4. Açılır listelerin (select) **açılan kısmı** da tarayıcı varsayılanı değil, oyunun kendi tasarımıyla olur.
- **Onay kaydı:** Kullanıcı: "1- başarılı 2- evet 3- evet 4- evet … dropdownların açılan kısmını da bizim tasarımla yap. default bişey istemiyorum" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0055 — Aşama 9 görev kartı (TASK-0012) onayı

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. 9a ana menü/devlet seçimi/oyun içi menü/kayıt yuvaları → 9b tarihî veri ve denge → 9c rehber → 9d kaynaklar/lisans →
     9e performans/erişilebilirlik sırası ve kapsamı onaylandı.
  2. Devlet seçimi: 132 devletin hepsi seçilebilir; tarihî verisi olmayanlar "kurgusal hükümdar" etiketiyle gösterilir.
  3. Mobil arayüz Aşama 9 dışında, sonraya (DEC-0013); yalnızca küçük ekranlarda bozulmama.
  4. Açılır liste tasarımı ve Aşama 9 taslağı commit + push edilir.
- **Onay kaydı:** Kullanıcı: "1- evet 2- uygundur 3- önerin gayet iyi 4- evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0056 — 9a kabulü ve 9b'ye geçiş

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. 9a (ana menü, devlet seçimi, kayıt yuvaları) kabul edildi; "kaydı sil" onay penceresinin menü arkasında açılması
     düzeltildi (onay penceresi menü katmanının üstünde). Commit + push onaylandı.
  2. 9b başlar: 1453 tahmini şehir nüfusları ve bölge verimi tablosu hazırlanıp onaya sunulur; ardından 50 yıllık
     simülasyonla denge ayarı.
- **Onay kaydı:** Kullanıcı: "1- kaydı sil diyince onay ekranı arkada açıldı gerisi sorunsuz 2- evet 3- evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0057 — 9b kabulü ve 9c'ye geçiş

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. 9b (tarihî şehir nüfusları, arazi verimi, fırsatçı fetih dengesi) kabul edildi; `sehir-nufus.json` onaylandı ([TASLAK]).
     Kullanıcı notu: dünya "biraz durağan ama okey" — ileride AI savaş olasılıkları (YZ_FIRSAT_OLASILIK vb.) yükseltilebilir.
  2. 9b commit + push onaylandı; 9c (oyun içi rehber, ipuçları, terimler sözlüğü) başlar.
- **Onay kaydı:** Kullanıcı: "1- biraz durağan ama okey 2- okey 3- evet 4- evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0058 — 9c kabulü ve 9d'ye geçiş

- **Tarih:** 2026-10-29
- **Seçilen karar:** 9c (ilk oyun rehberi, Nasıl oynanır, sözlük) kabul edildi ("gayet iyi"); commit + push onaylandı; 9d (kaynaklar
  ve lisans kontrolü) başlar.
- **Onay kaydı:** Kullanıcı: "1- gayet iyi 2- evet 3- evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0059 — 9d kabulü ve 9e'ye geçiş

- **Tarih:** 2026-10-29
- **Seçilen karar:** 9d (lisans kontrol listesi, kaynaklar belgesi ve ekranı, veri etiket testi) kabul edildi; commit + push
  onaylandı; 9e (performans ölçümleri, paket boyutu, erişilebilirlik, yazı boyutu ayarı) başlar.
- **Onay kaydı:** Kullanıcı: "1- evet 2- evet 3- evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0060 — 9e kabulü, Aşama 9 kapanışı (oynanabilir sürüm), Aşama 10'a geçiş

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. 9e kabul edildi; kullanıcının bulduğu hata (sekmelerde ← → haritayı da kaydırıyordu) düzeltildi: odak panel/sekme/menüdeyken
     harita ok tuşlarını yok sayar. Commit + push onaylandı.
  2. **Aşama 9 kapandı: oyunun bu hâli oynanabilir sürüm olarak kabul edildi.** Denge sayıları taslak kalır.
  3. Aşama 10 (yayın hazırlığı) başlar; önce TASK-0013 kapsamı onaya sunulur. Üretime çıkış ayrıca açık onay ister (§22).
- **Onay kaydı:** Kullanıcı: "1- … ← → tuşlarıyla sekmeler arasında gezin bunu yapınca haritada da geziyor sağa sola 2- evet 3- evet 4- evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0061 — Aşama 10 görev kartı (TASK-0013) onayı

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. 10a kayıt güvenilirliği → 10b hata yakalama → 10c sürüm/paket/kontrol listesi → 10d gizlilik notu sırası ve kapsamı onaylandı.
  2. Sürüm numarası **0.9.0 "oynanabilir önizleme"**; 1.0 denge ve ertelenen özellikler sonrasına.
  3. Test dağıtımı: şimdilik **yalnızca yerel paket (zip)**; dış barındırma/servis kararı yayına yaklaşınca ayrıca verilecek.
- **Onay kaydı:** Kullanıcı: "1- evet 2- evet 3- a" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0062 — 10a kabulü, otomatik kayıt sıklığı, 10b'ye geçiş

- **Tarih:** 2026-10-29
- **Seçilen karar:**
  1. 10a (içerik özeti, dönüşümlü otomatik kayıt, dosyaya indir/dosyadan yükle) kabul edildi; commit + push onaylandı.
  2. Kullanıcı her tur otomatik kaydı sorguladı: Ayar'a **otomatik kayıt sıklığı** seçeneği eklenir (her tur / oyun takviminde ayda bir /
     yılda bir / kapalı); varsayılan kullanıcıya sorulur.
  3. 10b (hata yakalama, kurtarma ekranı, yerel hata raporu) başlar.
- **Onay kaydı:** Kullanıcı: "1- başarılı, her turu kendi kendine kayıt mı edecek saçma değil mi 2- evet 3- evet" (2026-10-29)
- **Durum:** GEÇERLİ

## DEC-0063 — Oynanış hatalarının ayrıntılı araştırılması

- **Tarih:** 2026-10-29
- **Seçilen karar:** Kullanıcının bildirdiği ilhak sonrası şehirde eski devlet adı görünmesi ve benzer oynanış sorunları
  TASK-0014 kapsamında araştırılır. Kod, kayıt ve arayüz bağlantıları incelenir; doğrulanmış hatalar, beklenen kurallar ve
  ertelenmiş özellikler ayrı raporlanır. Bu talep yeni mekanik, üretim kodu düzeltmesi, yayın veya commit/push onayı değildir.
- **Onay kaydı:** Kullanıcı: “devletleri tamamen ilhak ediyorum ama şehirlerine tıklayınca eski devlet adları çıkıyor …
  sen bi detaylı araştırma yap”; örnek sorusuna “osmanlı ile eflak ı”; sonrasında “kaldığın yerden devam” (2026-10-29).
- **Durum:** GEÇERLİ

## DEC-0064 — İnceleme bulgularının düzeltilmesi

- **Tarih:** 2026-10-29
- **Seçilen karar:** TASK-0014 raporundaki H-01…H-07, UX-01, K-01 ve test kapsamı bulguları TASK-0015 ile sırayla
  düzeltilir. Ayrı şehir/arazi devri korunur. Ertelenmiş yeni mekanikler ve yayın bu onayın kapsamında değildir.
  Commit/push için ayrıca kullanıcı onayı gerekir (DEC-0017).
- **Onay kaydı:** Kullanıcı: “hepsini sırayla yap” (2026-10-29).
- **Durum:** GEÇERLİ

## DEC-0065 — Bütün yerel oyun kayıtlarını silme

- **Tarih:** 2026-10-29
- **Seçilen karar:** TASK-0016 ile Kayıtlar ekranına oyunun kendi onay penceresini kullanan “Tüm kayıtları sil” eklenir.
  Bu tarayıcıdaki manuel/eski manuel ve otomatik kayıtlar temizlenir. Açık oyun, ayarlar ve indirilmiş dosyalar korunur.
  Kullanıcının talebi özelliği eklemektir; agent mevcut kullanıcı kayıtlarını silmez. Commit/push izni verilmedi.
- **Onay kaydı:** Kullanıcı: “oyun kayıtlarının hepsin silme eklensin” (2026-10-29).
- **Durum:** GEÇERLİ

## DEC-0066 — TASK-0017 onayı: ekonomi, asker basma, ordu birleştirme/ayırma, temel diplomasi

- **Tarih:** 2026-10-30
- **Seçilen karar:** TASK-0017 tek görev kartı olarak onaylandı; sıra Ekonomi → Asker basma →
  Ordu birleştirme/ayırma → Temel diplomasi. Açık sorular: (1) vergi oranı düşük/orta/yüksek, varsayılan orta;
  (2) saldırmazlık/ateşkes paktı süresini oyuncu seçer (12/24/36 ay, varsayılan 24); (3) ordu birleştirme/ayırma
  arayüzünde hem checkbox listesi hem haritada tıkla-seç bulunur. Birim çeşitliliği, vasallık, çok taraflı
  antlaşma ve borç/faiz bu kartın kapsamı dışındadır. Her alt teslim ayrı test/onay/commit adımı olarak ilerler.
- **Onay kaydı:** Kullanıcı: “1-öneri 2- seçilsin 3-ikiside” (2026-10-30).
- **Durum:** GEÇERLİ

## DEC-0067 — TASK-0018 onayı: ilhak sonrası ordu kaderi, vasallık, isyan/casusluk derinliği

- **Tarih:** 2026-10-30
- **Seçilen karar:** TASK-0018 onaylandı; sıra (1) ilhak sonrası ordu kaderi (OPEN-024) — yıkılan devletin ordusu
  dağılır, (2) vasallık — yalnızca barış görüşmesinde "vasal yap" seçeneği, (3) isyan/casusluk derinliği — casuslukta
  yanlış bilgi ihtimali + istikrarda "direniş" ara kademesi, ikisi aynı kartta. Birim çeşitliliği (piyade/okçu/süvari)
  kasıtlı olarak bu kartın dışında bırakıldı; ayrı, daha büyük bir görev kartı (TASK-0019) olarak bu kart bitince
  ayrıca planlanacak. Her alt teslim ayrı test/onay/commit adımı olarak ilerler.
- **Onay kaydı:** Kullanıcı: "Ayrı, sonraki büyük görev olsun" / "Dağılır" / "Yalnızca barışta 'vasal yap' seçeneği" /
  "İkisi birden, aynı kartta" (2026-10-30).
- **Durum:** GEÇERLİ

## DEC-0079 — TASK-0029: sancak sistemi, nüfusa göre garnizon, toplananların orduya katılması, bağlam menüsü

- **Tarih:** 2026-10-31
- **Seçilen karar:** Osmanlı için şehir → sancak → eyalet (Rumeli, Anadolu, Rum); sancakbeyi yerel yönetici gibi
  çalışır; şehir el değiştirince sancaklar kendiliğinden güncellenir. Garnizon nüfusun %5'i (en az 300, başkent 2.000),
  büyük şehirde sur 2. Toplanan asker şehirde bekleyen orduya katılır. Haritada sağ tık bağlam menüsü. [TASLAK]
- **Onay kaydı:** Kullanıcı: "1- evet 2- evet 3- evet" + istekler (2026-10-31).
- **Durum:** GEÇERLİ

## DEC-0078 — TASK-0028: kıyı limanları, gelişmişlik ve gelir kaynağı ekonomide

- **Tarih:** 2026-10-31
- **Seçilen karar:** Toprağı denize değen ve kıyıya yakın şehirler liman olur (elle tutulan limanlar önceliklidir).
  Gelişmişlik (1–10) şehir ve toprağının gelirini %76–%130 arası çarpar; yatırımla artar, kuşatma ve ayaklanmayla
  düşer. Gelir kaynağı: tarım tarla +%25, ticaret pazar/liman +%25, zanaat pazar +%15 ve toplama −%10, hayvancılık
  süvari −%20. Sayılar [TASLAK].
- **Onay kaydı:** Kullanıcı: "evet" (2026-10-31) — agent önerisi.
- **Durum:** GEÇERLİ

## DEC-0077 — TASK-0027: şehir ve toprağı birlikte fethedilir

- **Tarih:** 2026-10-31
- **Seçilen karar:** Şehirli toprak şehrini izler; ayrıca işgal ve ayrıca barış talebi yoktur; şehirsiz topraklar
  eskisi gibi işgal edilir. Kuşatmadaki ordu ikmal aşınması yaşamaz [TASLAK]. MASTER_SPEC'teki "şehir ve çevresi
  ayrı fethedilir" [KARAR]'ı DEC-0074 ve bu kararla geçersizdir.
- **Onay kaydı:** Kullanıcı: "3- evet" (agent önerisi, 2026-10-31).
- **Durum:** GEÇERLİ

## DEC-0076 — TASK-0026: oyuncu için şehir adı değiştirme ve birleştirme kuralları

- **Tarih:** 2026-10-31
- **Seçilen karar:** Ad değiştirme ve birleştirme bir oyuncu özelliğidir (harita düzenleyicisi değil). Kurallar
  `tasks/TASK-0026.md`'deki gibidir (agent önerisi). Sıralı plan: (1) bu iş, (2) "şehir ve toprağı birlikte
  fethedilir", (3) gelişmişlik/gelir kaynağının ekonomiye bağlanması, (4) Osmanlı sancak sistemi (şehir → sancak →
  eyalet, sancakbeyi yerel yönetici gibi; önce yalnızca Osmanlı), (5) dünyaya yayma.
- **Onay kaydı:** Kullanıcı: "1- b 2- uygundur 3- uygundur" ve "hepsi uygun" (2026-10-31).
- **Durum:** GEÇERLİ

## DEC-0075 — Geliştirme aşamasında geriye dönük kayıt uyumluluğu yok

- **Tarih:** 2026-10-31
- **Seçilen karar:** Eski şemalı kayıtlar taşınmaz; güncel şemadan farklı kayıt açık bir mesajla reddedilir. Kayıt
  dönüştürücü zinciri (şema 3→26), eski kayıt onarımı ve eski şema testleri kaldırıldı; içerik özeti zorunlu.
- **Onay kaydı:** Kullanıcı: "eski kayıtlara gerek yok. geliştirme aşamasında olduğumuz için geriye dönük bişey
  yapma. gereksiz eski şeyleride temizle." (2026-10-31)
- **Durum:** GEÇERLİ

## DEC-0074 — TASK-0025 onayı: şehir merkezli harita (MASTER_SPEC KARAR değişikliği)

- **Tarih:** 2026-10-31
- **Seçilen karar:** (1) Şehir ve toprağı tek birimdir, birlikte fethedilir; "şehir ve çevresi ayrı fethedilir"
  [KARAR]'ı bununla değişir (sime işlenmesi pilot onayından sonra). (2) Şehir listesi Wikidata'dan (CC0)
  genişletilir; 1453 nüfusları tahminidir [TASLAK]. (3) Devlet sınırı, sahip olduğu şehirlerin topraklarının
  toplamıdır; OHM yalnızca şehrin 1453 sahibini belirlemekte kullanılır. (4) Şehre gelişmişlik, tür ve gelir
  kaynağı eklenir. (5) Önce Anadolu + Balkanlar pilotu. (6) TASK-0024 A commit edilmeden altyapı olarak kullanılır.
- **Onay kaydı:** Kullanıcı: "1-a 2-uygundur 3-uygundur 4-mantıklı gelir kaynağı falan. başka şeyler de
  ekleyebilirsin. 5-tamam 6-tamam" (2026-10-31).
- **Durum:** GEÇERLİ

## DEC-0073 — TASK-0024 onayı: araziye göre üretilen oyun bölgeleri + elle düzeltme aracı

- **Tarih:** 2026-10-31
- **Seçilen karar:** Modern il biçimli arazi birimleri yerine, devlet sınırları korunarak her devletin toprağı araziye
  göre (engebe, büyük nehirler) yeniden bölünür (A); bölge sayısı devlet başına bugünkü kadar kalır. Ardından
  geliştirici modunda elle düzeltme aracı yapılır (C). Tarihî OHM idari verisi (B) ve ücretli atlas verisi (D)
  bu aşamada kullanılmaz. Üretim betiklerinde polygon-clipping (MIT) ve topojson-server (ISC) kullanılır.
- **Onay kaydı:** Kullanıcı: "1- c 2- önerini yap 3- pusla" (2026-10-31) — sorun hem iç sınırlar hem devlet sınırı;
  agent önerisi A + C.
- **Durum:** GEÇERLİ

## DEC-0072 — TASK-0023 onayı: sınır kırıntılarının birleştirilmesi ve seçilebilir deniz bölgeleri

- **Tarih:** 2026-10-31
- **Seçilen karar:** (1) 500 km² altındaki arazi birimleri ve birimlerin ana gövdeden kopuk küçük parçaları, aynı
  devletin en uzun ortak sınırlı komşu birimine katılır; devlet sınırı değişmez, aynı devletten komşusu olmayan
  kırıntılar olduğu gibi kalır. (2) Birim sayısı/sırası değiştiği için eski kayıtlar yüklenmez; kayıt dönüştürücü
  yazılmaz (oyun henüz yayınlanmadı). (3) Deniz bölgelerinin alanı dış veri kullanılmadan eldeki kara verisinden,
  su üzerinden en kısa yol bölüşümüyle türetilir; denizler haritada seçilebilir olur. (4) İkisi tek kartta
  (TASK-0023) iki teslim olarak yapılır.
- **Onay kaydı:** Kullanıcı: "hepsini önerileni yap" (2026-10-31) — agent önerileri: eşik 500 km², komşusuz
  kırıntı kalsın, eski kayıt bozulmasını kabul, deniz alanı eldeki veriden, tek kart.
- **Durum:** GEÇERLİ

## DEC-0071 — TASK-0022 onayı: harita verisini varlık bazlı ayrı dosyalarda tutma (devlet/bölge/şehir/deniz)

- **Tarih:** 2026-10-30
- **Seçilen karar:** TASK-0022 onaylandı. Şu an tek bir 4.7MB `harita.json` dosyasında tutulan dünya haritası
  verisi (devlet/bölge/şehir geometrisi) ve `deniz.json`'daki deniz bölgeleri, kıta kıta, her varlık kendi
  dosyasında olacak şekilde ayrıştırılacak. Amaç: veri düzenleme/düzeltme kolaylığı + ileride performans
  (istemcinin yalnızca gereken kıtayı yüklemesi) + gelecekteki senaryolar arası geometri paylaşımı. Gerekirse
  ileride PostgreSQL/PostGIS'e taşınabilir; bu aşamada dosya tabanlı kalınır (veritabanı kapsam dışı). Sıra:
  önce kaynak veri ayrıştırması (bu kart), sonra istemci yükleme biçiminin değişmesi (ayrı, gelecekteki bir
  karar). Başlangıç kıtası: Avrupa + Yakındoğu (mevcut 1453 senaryosunun kapsadığı bölge). Mevcut `harita.json`
  paylaşılan sınır yayları (arklar) kullandığından, bu fazda kıta başına ortak bir arklar havuzu korunur (tam
  bağımsız/kenar paylaşımsız varlık dosyaları — PostGIS'e en uygun biçim — ayrı bir sonraki faz kararı).
  İstemci kodu ve oyun davranışı bu fazda değişmez.
- **Onay kaydı:** Kullanıcı: "Her devletin geomu her bölgenin geomu her şehrin geom bilgisini ayrı ayrı tutalım.
  Gerekirse ileride bunu pgsql ile db de tutarız... Deniz sahaları içinde böyle yapalım" (2026-10-30). Agent'ın
  netleştirme sorularına kullanıcının yanıtları: amaç "Veri düzenleme/düzeltme kolaylığı + Performans +
  Gelecekteki senaryolar arası paylaşım" (üçü de); kapsam "Her ikisi birden, sırayla" (önce kaynak veri);
  başlangıç "Avrupa + Yakındoğu, TASK-0022 olarak".
- **Durum:** GEÇERLİ

## DEC-0070 — TASK-0021 onayı: AI karışık ordu, AI vasallık teklifi, elçi/casus riski, muharebe raporu kırılımı

- **Tarih:** 2026-10-30
- **Seçilen karar:** TASK-0021 onaylandı: (1) AI karışık ordu toplasın (piyade/okçu/süvari, TASLAK kural); (2) AI
  vasallık teklif etsin (mevcut gelen kutusu altyapısına yeni `tur: "vasallik"`; yalnızca teklif, oyuncu her zaman
  reddedebilir, zorla vasallık yok); (3) elçi/casus gibi küçük bir başarısızlık/yakalanma riski taşısın; (4)
  muharebe raporunda piyade/okçu/süvari kırılımı gösterilsin (şema artışı gerektirir). Sıra: muharebe raporu
  kırılımı → elçi/casus riski → AI karışık ordu → AI vasallık teklifi.
- **Onay kaydı:** Kullanıcı: "AI karışık ordu toplasın (Önerilen)", "AI vasallık teklif etsin", "Elçi/casus küçük
  başarısızlık riski", "Muharebe raporunda birim kırılımı" (dördü de seçildi) (2026-10-30).
- **Durum:** GEÇERLİ

## DEC-0069 — TASK-0020 onayı: AI'dan gelen diplomatik teklifler, elçi gönderme, hükümdar portresi

- **Tarih:** 2026-10-30
- **Seçilen karar:** TASK-0020 onaylandı: (1) AI devletler ittifak/ticaret/saldırmazlık teklif edebilir, genel
  "gelen kutusu" penceresi eklenir; (2) elçi gönderme — orta maliyet, 60 gün, tamamlanınca +15 ilişki (hediyeyle
  aynı sönüm kuralı), aynı devlete ikinci elçi yoldayken gönderilemez; (3) hükümdar/devlet için basit, deterministik
  bir görsel portre/avatar (saf görsel, oyun mantığını etkilemez). Sıra: AI teklifleri → elçi → portre.
- **Onay kaydı:** Kullanıcı: "AI'dan gelen teklifler, elçi gönderme, hükümdar portresi/avatarı" (üçü de seçildi),
  elçi tasarımı: "Orta maliyet, 60 gün, kademeli +15 ilişki" (2026-10-30).
- **Durum:** GEÇERLİ

## DEC-0068 — TASK-0019 onayı: birim çeşitliliği (piyade/okçu/süvari)

- **Tarih:** 2026-10-30
- **Seçilen karar:** TASK-0018 bitince kullanıcı "sen devam et yapmaya" dedi; TASK-0019 (birim çeşitliliği) agent
  önerisiyle onaylandı. Dört faz: (1) veri modeli + asker toplama, (2) muharebe gücü ve kayıp dağılımı, (3) hareket
  hızı, (4) kuşatma gücü + arayüz tamamlama. Tasarım: Piyade (taban), Okçu (ucuz, savunmada güçlü), Süvari (pahalı,
  hızlı, saldırıda güçlü, savunmada zayıf) — tüm sayılar TASLAK. AI v1'de yalnızca piyade toplar. `OrduDurumu.asker`
  toplam olarak korunur; yeni `kompozisyon` alanı yalnızca maliyet/maaş/güç/hız hesaplarını etkiler.
- **Onay kaydı:** Kullanıcı: "Sen devam et yapmaya" (2026-10-30); tasarım detayları agent önerisiyle.
- **Durum:** GEÇERLİ
