# ADR-0002 — Simülasyon çekirdeği: çalışma yeri, yapı, zaman ve kayıt

- **Durum:** KABUL EDİLDİ (2026-10-29, DEC-0023) — dört öneri de onaylandı
- **Tarih:** 2026-10-29
- **İlgili:** OPEN-006 (simülasyon dili ve çalışma yeri), OPEN-007 (kayıt modları — kısmen),
  MASTER_SPEC §3.2, §18, §19, §20; DEC-0005, DEC-0006, DEC-0012, DEC-0013
- **Görev:** TASK-0005 (Aşama 2)

## Bağlam

Aşama 2 şunları ister: dünya durumu, tarih/tur kontrolü, seçilebilir tur süresi, emir kuyruğu,
deterministik güncelleme ve kayıt/yükleme iskeleti. Kabul ölçütü: aynı başlangıç ve aynı emirler
aynı sonucu üretir; tur dışında ilerleme olmaz; kayıt sonrası durum korunur.

Bu aşamada ilk kez prototip dışında, kalıcı oyun kodu yazılacak. Bu yüzden aşağıdaki kararların
önceden alınması gerekiyor.

## Karar 1 — Simülasyon nerede çalışır? (OPEN-006)

| Seçenek | Artı | Eksi |
|---|---|---|
| **A. Tarayıcıda, TypeScript, ayrı iş parçacığında (Web Worker)** | Sunucu gerekmez; çevrimdışı oynanır; harita akıcılığı tur hesabından etkilenmez; aynı kod ileride Node.js'te sunucu olarak da çalışabilir | Zayıf cihazda uzun turlar yavaş olabilir; durum ana iş parçacığına kopyalanarak aktarılır |
| B. Sunucuda (Node.js) | Ağır hesap güçlü makinede yapılır; çok oyunculuya yakın | Sunucu maliyeti ve bakımı; çevrimdışı oynanmaz; tek oyunculu ilk sürüm için gereksiz |
| C. Rust/C++ → WebAssembly | En hızlı hesap | İkinci dil; geliştirme ve agent bakımı zorlaşır; şu an ölçülmüş bir performans ihtiyacı yok |

**Öneri: A.** Çekirdek, DOM'a ve three.js'e bağımlı olmayan saf bir TypeScript modülü olur.
Bugün tarayıcıda Web Worker içinde çalışır; ileride çok oyunculu sürümde aynı kod sunucuda
çalıştırılabilir (MASTER_SPEC §20.1: tek ve test edilebilir kural kaynağı).

## Karar 2 — Kod yapısı

**Öneri:** Kök dizinde npm workspaces ile iki paket:

```text
packages/
├── sim/        # saf TypeScript: dünya durumu, tur, emirler, kayıt; DOM/three.js yok
│   └── test/   # Vitest testleri (determinizm, tur, kayıt)
└── istemci/    # three.js harita + arayüz (harita-gorsel-02 prototipinden temizlenerek taşınır)
```

- **Test çerçevesi:** Vitest (MIT).
- **Prototipler:** `prototypes/` olduğu gibi kalır, atılabilir.
- **İçerik verisi:** 1453 harita ve devlet verisi `veri/` altında, sürüm numarasıyla tutulur.
- **MASTER_SPEC §26 ile ilişkisi:** Belgedeki tek `src/` yerine `packages/` kullanılır.
  Ayrılmanın nedeni, simülasyonun arayüzden bağımsız test edilebilmesi.

## Karar 3 — Zaman, tur ve determinizm

- **İç adım:** 1 gün. DEC-0005 [TASLAK] "hareket ve muharebe günlük, ekonomi aylık" önerisini
  somutlaştırır. Her sistem kendi sıklığında (günlük, aylık, yıllık) çalışır. Tur süresi
  1 hafta, 1 ay, 3 ay ya da 1 yıl olabilir; tur, o kadar iç adımın art arda işletilmesidir.
  Bu nedenle 1 yıllık tek tur ile 12 aylık tur aynı sonucu verir (AT-005).
- **Kesinti:** Herhangi bir iç adımda kritik bir olay oluşursa tur o günde durur (DEC-0006).
  İlk tetikleyici listesi: oyuncu ordusunun düşmanla karşılaşması, oyuncuya savaş ilanı,
  oyuncu hükümdarının ölümü. Liste ayarlardan genişletilebilir.
- **Determinizm kuralları:**
  - Tek tohumlu rastgele sayı üreteci; durumun içinde saklanır, kayıtla birlikte yazılır.
  - `Math.random`, saat ve tarih okuma yasak.
  - Tarayıcılar arasında farklı sonuç verebilen matematik fonksiyonları (`Math.sin`, `Math.pow`
    vb.) simülasyonda kullanılmaz. Gerekirse kendi uygulamamız yazılır.
  - Para ve nüfus gibi birikimli değerler tam sayıyla tutulur.
  - Durum değişikliği yalnızca emirlerle ve iç adımlarla olur.
  - Bu kurallar bir test ve lint kontrolüyle korunur.
- **Takvim:** MASTER_SPEC §19'da [AÇIK]. Seçenekler:
  - (a) **Jülyen takvimi.** 1453'te kullanılan takvim; İstanbul'un fethi 29 Mayıs 1453 olarak
    görünür.
  - (b) Geriye dönük Gregoryen takvim. Fetih tarihi 7 Haziran 1453 görünür.
  - **Öneri:** (a). İçeride takvimden bağımsız bir gün sayacı tutulur; ekranda Jülyen tarih
    gösterilir. Gregoryen'e geçiş ileride ayrı bir karar olabilir.

## Karar 4 — Kayıt (Aşama 2 iskeleti)

- **Depolama:** Yalnızca tarayıcıda yerel (IndexedDB). Bulut ve hesap yok (OPEN-020 açık kalır).
- **Biçim:** JSON. İçinde şema sürümü, senaryo sürümü, gün sayacı, rastgelelik durumu, dünya
  durumu ve emir/olay günlüğü bulunur. Sıkıştırma ve büyük kayıt optimizasyonu daha sonra
  ölçülerek yapılır.
- **Güvenlik:** Kayıt atomik yazılır (önce geçici kayıt, sonra yer değiştirme). Bozuk kayıt
  güvenli bir hata verir.
- **Kayıt modları (ironman, geri sarma):** Bu aşamada yok. Manuel kayıt + tek otomatik kayıt
  yeterli (OPEN-007 açık kalır).

## Sonuçlar

- Aşama 2'de oyun mekaniği yok. Ordular, ekonomi ve diplomasi Aşama 3–6'da gelecek. Çekirdek
  yalnızca "zaman ilerler, emir işlenir, durum kaydedilir/yüklenir" döngüsünü kurar ve test eder.
- İlk emir türleri test amaçlıdır: örneğin "devlet hazinesine X ekle" ve "tur süresini değiştir".
  Gerçek emirler sonraki aşamalarda eklenir.
