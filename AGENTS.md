# AGENTS — AI Agent Davranış ve Onay Kuralları

Bu dosya bu projede çalışan her AI agent için bağlayıcıdır. Ayrıntılı
kaynak: `MASTER_SPEC.md` §21 ve §27.

## Başlamadan önce

0. **`DEVIR-TESLIM.md` dosyasını oku** — önceki agent'ın kaldığı yer, bekleyen kararlar, sıradaki iş.
1. `MASTER_SPEC.md` dosyasını tamamen oku.
2. `DECISIONS.md` dosyasını oku; buradaki kayıtlar MASTER_SPEC'teki
   [TASLAK] maddelerinin önündedir.
3. Mevcut aşamayı `docs/milestones/` altından belirle.

**Öncelik sırası:** (1) kullanıcının son açık talimatı, (2) `DECISIONS.md`,
(3) MASTER_SPEC [KARAR], (4) onaylı alt dokümanlar, (5) [TASLAK].
Çelişki varsa dur, açıkla, onay iste. Sessizce varsayım üretme.

## Mevcut durum

- **Aşama:** 6 kapandı (DEC-0041); Aşama 4 ve 5 de kapalı (DEC-0037). Aşama 7 başladı (DEC-0042); TASK-0010
  7a kabul edildi (DEC-0044); 7b kabul edildi (DEC-0046); 7c kapsamı onay bekliyor. Durum için `DEVIR-TESLIM.md`.
- **Yerel sunucu (DEC-0036):** Kullanıcı da agent da **5173**'teki geliştirme sunucusunu kullanır
  (kullanıcı başlattı, kapatılmaz; kod değişince kendini yeniler). Kullanıcıya test adımı 5173 ile verilir;
  4175 önizlemesi kullanılmaz. Aşama 2 kapandı
  (DEC-0024), Aşama 1 kapandı (DEC-0019). Görsel yön: Tarihî atlas (DEC-0018).
  TASK-0003 kapandı (DEC-0021). TASK-0004 (v0.2 harita verisi) kabul edildi (DEC-0022).
- **Depo:** github.com/onuryilmaaz/tarihi-oyun (özel). Çalışma doğrudan
  `main` dalında yapılır (DEC-0015). **Commit ve push öncesinde kullanıcıya
  sorulur; onaysız commit atılmaz (DEC-0017).**
- **Teknoloji:** TypeScript + three.js; oyun motoru yok (DEC-0012). Önce web
  (DEC-0013). Simülasyon tarayıcıda Web Worker'da (DEC-0023, ADR-0002).
- **Kod yapısı:** `packages/sim` (oyun kuralları; DOM/three.js/Node API yasak, determinizm
  kuralları `kurallar.test.ts` ile denetlenir) ve `packages/istemci` (harita + arayüz).
  Senaryo verisi `veri/senaryo-1453/` (`npm run senaryo`). Prototipler `prototypes/` altında
  atılabilir koddur; ana koda yalnızca temizlenerek taşınır.
- **Komutlar:** `npm test` (sim testleri), `npm run typecheck`, `npm run dev` (istemci).
  Her değişiklikten sonra test ve tip kontrolü çalıştırılır.
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

## Devir teslim (DEC-0028)

- Bu projede farklı AI agent'lar (Claude, Codex vb.) sırayla çalışabilir. Hepsi aynı kurallara uyar.
- Oturumun ya da kullanım limitinin bitmesine yaklaşınca, son işten önce `DEVIR-TESLIM.md`'yi
  güncelle (durum, bekleyen kararlar, sıradaki iş, commit edilmemiş değişiklikler, yarım kalan iş).
- Devralan agent ilk iş olarak `DEVIR-TESLIM.md`'yi okur ve kullanıcıya kısaca nerede kaldığını söyler.

## Arayüz ve iletişim kuralları

- Tarayıcının kendi pencereleri (alert/confirm/prompt) kullanılmaz; oyunun kendi tasarımı kullanılır (DEC-0028).
- Kullanıcıyla Türkçe konuşulur. Kararlar numaralı sorulur ve her birine öneri yazılır.
- Kullanıcıya test adımları sade ve tıklama tıklama verilir; önce agent akışı kendisi dener.
- `npm run build` derleme hatası denetimi için çalıştırılır; kullanıcı testi 5173'te yapılır (DEC-0036).
