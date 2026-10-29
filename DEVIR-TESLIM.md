# DEVİR TESLİM — agent değişiminde kaldığın yer

> Bu dosya, bir AI agent (Claude, Codex vb.) oturumu bittiğinde bir sonrakinin **tam olarak kaldığı
> yerden ve aynı kurallarla** devam etmesi içindir. Oturumu biten her agent bu dosyayı günceller
> (bkz. AGENTS.md → "Devir teslim"). Son güncelleme: **2026-10-29, Claude (Opus 5.5)**.

## 1. Önce oku (sırayla)

1. `AGENTS.md` — bağlayıcı kurallar (özeti aşağıda; asıl metin oradadır).
2. Bu dosya — şu anki durum ve sıradaki adım.
3. `DECISIONS.md` — DEC-0001 … DEC-0028; kullanıcı kararları. Kararla çelişen hiçbir şey yapma.
4. `tasks/TASK-0007.md` — aktif görev (Aşama 4) ve `docs/milestones/ASAMA-4.md`.
5. Gerektikçe `MASTER_SPEC.md` (ana şartname, v1.3).

## 2. Şu anki durum

- **Aşama 4 — savaş, kuşatma, barış (TASK-0007).** Üç alt teslim: 4a → 4b → 4c (DEC-0027/4).
- **4a kod olarak TAMAM** (savaş ilanı, yabancı ordular, görünürlük, muharebe, moral, tutum,
  geri çekilme). 48 test geçiyor, `tsc` temiz, tarayıcıda uçtan uca doğrulandı.
- **Kullanıcı 4a'yı anlamadığını söyledi.** İlk iş: aşağıdaki "4a'yı sade anlatım" bölümüyle
  kullanıcıya basitçe anlat ve adım adım birlikte test ettir. Kullanıcı 4a'yı onaylamadan 4b'ye geçme.
- **Son değişiklik:** Savaş ilanındaki tarayıcı `confirm()` penceresi kaldırıldı; yerine oyunun kendi
  onay ekranı (`#onay`, `onayIste()` — `packages/istemci/src/main.ts`) geldi (DEC-0028).
- **Commit durumu:** 4a + onay ekranı + bu devir belgesi kullanıcı onayıyla commit edilip GitHub'a
  gönderildi ("comitle"). Yine de `git status` ile kontrol et. Kullanıcı onayı olmadan commit/push
  YAPMA (DEC-0017).

### Kullanıcıdan bekleyen kararlar

1. 4a testi sonucu (sade anlatım + test adımlarından sonra).
2. 4b'ye başlama onayı.

### 4a'yı sade anlatım (kullanıcıya böyle anlat)

- Haritada artık **başka devletlerin orduları** da var; ama yalnızca **sınırınıza yakın olanları**
  görürsünüz ve büyüklüklerini **tahmini** görürsünüz ("~4B" = yaklaşık 4 bin asker).
- Bir devlete **savaş ilan edebilirsiniz**: devlete tıklayın → sağ panelde "Savaş ilan et".
  Savaş ilan ettiğiniz devletin topraklarına ordunuz girebilir (önce giremiyordu).
- İki düşman ordu aynı yere gelince **muharebe** olur: oyun durur ("Tur durdu"), birkaç günde kendiliğinden
  sonuçlanır, sonra **rapor** açılır (kim kazandı, kaç kayıp, neden).
- Her ordunun bir **morali** vardır. **Tutum** ne zaman kaçacağını belirler: Temkinli = erken çekilir,
  Dengeli = ortada, İnatçı = sonuna kadar direnir. Yenilen ordu en yakın kendi şehrine kaçar.

### 4a test adımları (http://localhost:4175 ya da 5173)

1. Ankara'nın güneydoğusundaki **Karamanoğulları**'na tıkla → sağ panel → **Savaş ilan et** → onay ekranında onayla.
2. Sol panel → **Ordular** → **Anadolu Ordusu**'nu seç → haritada **Larende**'ye **sağ tıkla**.
3. Üstte **Hafta** → **Turu ilerlet**'e birkaç kez bas. "Tur durdu" çıkınca **Anladım** → devam.
4. Muharebe bitince rapor penceresi açılır; sol paneldeki **Muharebe raporları**'ndan tekrar açılır.

## 3. Sıradaki işler

- **4b** (kullanıcı onayından sonra): asker toplama (şehirden, hazineden ödenir, borçsuz; süre alır;
  insan gücü havuzu nüfustan), ordu maaşı (aylık zorunlu gider → hazine eksiye düşebilir, eksi bakiye
  morale ceza — DEC-0002, OPEN-023 ilk uygulama), ikmal (kendi topraklarında tam, düşmanda aşınma),
  orduları birleştir/böl. Ayrıntı: `tasks/TASK-0007.md`.
- **4c:** kuşatma (sur/garnizon, abluka/saldırı/teslim bekleme; AT-009 anında düşmez), gerçek işgal
  (test işgalinin yerini alır), savaş skoru, barış antlaşması (toprak, tazminat; DEC-0027/1 basit kabul kuralı).
- 4c bitince Aşama 4 kapısı için kullanıcı testi; sonra Aşama 5 (ekonomi, şehirler, teknoloji) görev kartı.

## 4. Kod haritası

| Yer | İçerik |
|---|---|
| `packages/sim/src/` | Oyun kuralları (saf TypeScript; DOM/three.js/Node API yasak). `durum.ts` dünya durumu ve şema (şu an 3), `tur.ts` tur döngüsü, `emirler.ts` emir kuyruğu, `sistemler.ts` günlük/aylık/yıllık sistemler, `hareket.ts` yol bulma, `savas.ts` savaş/muharebe/görünürlük, `denge.ts` **tüm denge değerleri** [TASLAK], `kayit.ts` kayıt |
| `packages/sim/test/` | Vitest; `kurallar.test.ts` determinizm yasaklarını tarar (Math.random, Date, trig, `**`, toLocaleString…) |
| `packages/istemci/src/` | `main.ts` arayüz ve oyun akışı, `sim-isci.ts` Web Worker, `sim-protokol.ts` mesajlar, `harita/` three.js harita, `kayit-deposu.ts` IndexedDB |
| `veri/senaryo-1453/` | Senaryo + harita + hareket ağı; `npm run senaryo` ile üretilir (ham veri gerekir: `veri/senaryo-1453/KAYNAKLAR.md`) |
| `prototypes/` | Atılabilir prototipler (harita-gorsel-02 = veri hattı ve OHM/Wikidata betikleri) |

## 5. Komutlar ve sunucular

```sh
npm test             # sim testleri (her değişiklikten sonra)
npm run typecheck    # tüm paketler
npm run build        # istemci → packages/istemci/dist (4175'teki önizleme bunu sunar)
npm run dev          # geliştirme sunucusu (5173)
```

- **4175:** kullanıcının denediği önizleme (`vite preview`). Kod değiştikten sonra `npm run build`
  çalıştır ki kullanıcı yeni sürümü görsün.
- **5173:** kullanıcının başlattığı geliştirme sunucusu; agent kendi denemelerini burada yapar, kapatmaz.
- Tarayıcı testi: Claude, puppeteer-core ile yerel Chrome'u (`/Applications/Google Chrome.app`) sürerek
  akışları denedi ve ekran görüntüsü aldı (betikler oturum geçici klasöründeydi, depoda değil).
  Eşdeğer bir yöntemle kullanıcıya vermeden önce akışı kendin dene.

## 6. Değişmez kurallar (özet — asıl metin AGENTS.md)

- Kullanıcı ürün sahibidir; her aşama/görev onayla başlar, aşama kapısı açık onayla geçilir.
- Her iş `tasks/TASK-XXXX.md` kartıyla; her karar `DECISIONS.md`'ye (DEC-XXXX), her değişiklik
  `CHANGELOG.md`'ye.
- **Commit/push öncesi kullanıcıya sor** (DEC-0017). Çalışma `main` dalında.
- Kullanıcıyla **Türkçe** konuş; soruları numaralı sor, her soruda önerini yaz; kullanıcı
  "1- evet 2- ..." diye cevaplar. Test adımlarını sade, tıklama tıklama ver.
- **Tarayıcının kendi pencereleri (alert/confirm/prompt) yasak**; oyunun kendi tasarımıyla yap (DEC-0028).
- Simülasyon deterministik: tohumlu rastgelelik, tam sayı, yasaklı API yok; denge değerleri yalnızca `denge.ts`.
- Tarihî veri: kaynaksız tahminler "tahmin" diye etiketlenir; lisans kontrolsüz veri eklenmez;
  yeni veri seti kullanıcı onayı ister.
- Testleri ve tip kontrolünü çalıştırmadan "bitti" deme; sonuçları dürüstçe raporla.

## 7. Bu dosyayı güncelleme (devir kuralı)

Oturumun / limitin bitmesine yaklaşınca, **son işten önce** bu dosyayı güncelle:
- "Son güncelleme" satırı (tarih, agent adı),
- Şu anki durum, kullanıcıdan bekleyen kararlar, sıradaki işler,
- Commit edilmemiş değişiklikler (`git status` özeti),
- Yarım kalan iş varsa: nerede kaldı, hangi dosyalar, hangi testler kırık.
Sonra kullanıcıya kısa bir devir notu yaz.
