# AGENTS — AI Agent Davranış ve Onay Kuralları

Bu dosya bu projede çalışan her AI agent için bağlayıcıdır. Ayrıntılı
kaynak: `MASTER_SPEC.md` §21 ve §27.

## Başlamadan önce

1. `MASTER_SPEC.md` dosyasını tamamen oku.
2. `DECISIONS.md` dosyasını oku; buradaki kayıtlar MASTER_SPEC'teki
   [TASLAK] maddelerinin önündedir.
3. Mevcut aşamayı `docs/milestones/` altından belirle.

**Öncelik sırası:** (1) kullanıcının son açık talimatı, (2) `DECISIONS.md`,
(3) MASTER_SPEC [KARAR], (4) onaylı alt dokümanlar, (5) [TASLAK].
Çelişki varsa dur, açıkla, onay iste. Sessizce varsayım üretme.

## Mevcut durum

- **Aşama:** 1 (harita deneyimi prototipi) sürüyor. TASK-0001 kabul edildi
  (ADR-0001); sıradaki iş TASK-0002.
- **Depo:** Git; GitHub'a gönderilir. Çalışma dalı stratejisi: kullanıcı
  aksini söylemedikçe her görev kendi dalında (`task/XXXX-...`) yürütülür,
  `main`'e kullanıcı onayıyla birleştirilir.
- **Teknoloji:** TypeScript + three.js; oyun motoru yok (DEC-0012). Önce web
  (DEC-0013). Diğer mimari başlıklar AÇIK; `src/` henüz oluşturulmaz.
- **İlk sürüm:** Tek oyunculu, tek senaryo (1453).

## Kesinlikle korunacaklar

- Oyun tur bazlıdır; tur süresi 1 hafta / 1 ay / 3 ay / 1 yıl; simülasyon
  sabit iç adımlarla işler.
- Uzun turda kritik olay olursa tur durur, kararı oyuncu verir.
- Oyuncu devleti yönetir; hükümdarın ömrüyle sınırlı değildir.
- Tarihî olaylar başlangıçtan sonra zorla yaşatılmaz.
- Siyasi sınırlar nettir; harita ana arayüzdür.
- En küçük fethedilebilir birim poligon arazi birimidir; şehir ayrı
  nesnedir; şehir ve çevresi ayrı fethedilir.
- Ordular serbest hedefli hareket eder; varış süreleri değişkendir.
- Muharebeler otomatik çözülür; geri çekilme oyuncunun emrine bağlıdır.
- **Devlet borçlanması yoktur** (kredi/faiz/tahvil yok). Eksi bakiye
  yalnızca zorunlu giderlerden doğabilir.
- Agent kullanıcı onayı olmadan yeni aşamaya geçemez.

## Onaysız yapılamayacaklar

Yeni temel mekanik eklemek veya onaylı mekaniği silmek; teknoloji yığını
seçmek; ücretli servis, dış API, veri seti veya lisanslı varlık
bağlamak; harita görsel kimliğini değiştirmek; geri döndürülemez şema
değişikliği; ana dala korumasız yazmak veya üretime dağıtmak; kapsam dışı
modül geliştirmek.

## Çalışma biçimi

- Her iş `tasks/TASK-XXXX.md` görev kartıyla başlar (şablon: MASTER_SPEC
  §21.2). Kart onaylanmadan üretim kodu yazılmaz.
- Her karar `DECISIONS.md`'ye, her önemli değişiklik `CHANGELOG.md`'ye
  işlenir.
- Kullanıcıya her rapor şunları yanıtlar: Ne yaptım? Neden? Hangi
  gereksinime dayanıyor? Hangi dosyaları değiştirdim? Nasıl test ettim?
  Neler belirsiz? Senden hangi kararı istiyorum?
- Aşama kapısı yalnızca açık kullanıcı onayıyla geçilir. Sessizlik onay
  değildir.
