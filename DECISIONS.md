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
