# TASK-0010 / 7c — İstikrar ve isyan riski test raporu

Tarih: 2026-10-29. Agent: Codex. Dayanak: DEC-0047; MASTER_SPEC §14–15, §22;
AT-014 (risk görünürlüğü), AT-010 (borçsuz harcama), AT-016 (kayıt).
**Durum:** Uygulama tamamlandı, kullanıcı kabulü BEKLENİYOR. 7d başlamadı.

## Yapılan ve değişen dosyalar

- Sim: yeni `packages/sim/src/istikrar.ts`; denge/durum/kayit/index/sistemler,
  ekonomi/yatirim/ordu/emirler/baris/yz bağlantıları.
- İstemci: main.ts, sim-isci.ts, sim-protokol.ts, index.html.
- Test: yeni `packages/sim/test/istikrar.test.ts` (14 davranış testi).
- Belgeler: TASK-0010, ASAMA-7, AGENTS, CHANGELOG, DEVIR-TESLIM ve bu rapor.
- Önceden commit edilmemiş DEC-0047 ve belge değişiklikleri korundu. Commit/push yapılmadı.

## Otomatik doğrulama

- `npm test`: 20 dosyada **158 test başarılı**.
- `npm run typecheck`: sim ve istemci başarılı.
- `npm run build`: başarılı; mevcut 500 kB paket uyarısı devam ediyor, derleme hatası yok.
- Her risk bileşeninin sayısal testi; farklı dinin tek başına ayaklanma yaratmaması;
  önce uyarı/üç ardışık ayda kesinti, yüksek risk sayacının kesilmesi, iki aylık asayiş ve düşük riskle bitiş;
  gelir yarılanması/sıfırlanması, asker/inşaat beklemesi ve devamı; önceki ay değişim nedenleri;
  bağış rezervasyonu/borç yasağı/tekrar sınırı/sönüm; AI'nın aynı bağış kuralları;
  12→13 dönüşümü ve geçmiş fetih tarihi, geçersiz kayıt reddi, deterministik kayıt devamı.
- Önceki 7a/7b ve diğer aşama testleri de başarılı. Math.random/Date/üs alma eklenmedi.

## 5173 Chrome doğrulaması

Kullanıcının kayıtlarından bağımsız geçici Chrome profili kullanıldı; 5173 kapatılmadı.

1. Normal Osmanlı oyununda Selanik seçildi. İlk ay başına kadar “hesaplanacak” açıklaması görüldü.
2. 1 Mayıs: risk %11; meşruiyet +4 ve farklı din payı +7; önceki aya göre farklar doğru gösterildi.
3. Bağış düğmesine basıldı: hazine tur dışında değişmedi, para kuyrukta ayrıldı ve tekrar bağış kapandı.
4. 1 Haziran: bağış bileşeni −20, risk %11→%0, kalan yardım indirimi 15.
5. İstikrar modu ve renk açıklaması açıldı. Manuel kaydet → ay ilerlet → yükle;
   aynı risk, nedenler, yardım ve tarih geri geldi. JavaScript çalışma zamanı hatası yok.
6. **Hazırlanmış test kaydıyla ayrı kriz denemesi:** Selanik'e yeni fetih tarihi, düşük meşruiyet,
   eksi hazine ve sıfır bağış verildi. Kullanıcının gerçek kaydına dokunulmadı.
   İlk iki ay (Temmuz/Ağustos) tur kesilmedi; 1 Eylül'de ayaklanma başladı, tur durdu.
   Panelde risk %100, nedenler ve gelir/asker/inşaat durması göründü. İnşaat ve asker toplama
   düğmeleri kapalı, toplama gerekçesi ayaklanma. JavaScript hatası yok.

Geçici betikler: `/tmp/tarihi-7c-browser.mjs`, `/tmp/tarihi-7c-crisis.mjs`.
Görseller: `/tmp/tarihi-7c-istikrar.png`, `/tmp/tarihi-7c-ayaklanma.png`.
İlk tarayıcı betiğinde yanlış harita noktasına tıklama nedeniyle bağlantı bulunamadı;
şehir/devlet kırıntısından seçim yapılarak düzeltildi; ürün hatası değildi.

## Kullanıcı için sade deneme

1. `http://localhost:5173` aç/yenile. Osmanlı toprağına tıkla. Sağ panelde şehir listesinden **Selanik** seç.
   Bir arazi/şehir paneli açıldıysa üstteki **Osmanlı Devleti** kırıntısına tıkla, sonra Selanik seç.
2. Üstte **Ay → Turu ilerlet**. Şehirde **İstikrar** başlığının altında riski, nedenleri ve değişimi gör.
3. **Bağış / imar yardımı (200)** düğmesine bas; **Turu ilerlet**. Sonraki aylık hesapta
   yardımın indirimini ve risk düşüşünü gör. Diğer koşullar değişmişse toplam sonuç değişebilir.
4. Üstte **İstikrar** düğmesine bas; renk açıklamasını gör. Siyasi görünüme dönmek için tekrar bas.
5. **Kaydet → Turu ilerlet → Yükle**; risk ve yardım önceki kayıt değerine dönmeli.

Ayaklanma için doğal olarak birden fazla kötü koşulun üç ay sürmesi gerekir;
her yeni oyunda zorla isyan çıkarılmaz. Üç aylık ayaklanma ve bastırma yolları otomatik testlerle de doğrulandı.

## Denge ve bilinen sınırlar

- Tüm ağırlıklar `denge.ts` içinde TASLAK; tarihî kesinlik/denge kabulü iddiası yok.
- Meşruiyet en çok +40, yeni fetih +30 (30 günde 1 sönüm), işgal +25, uzun savaş en çok +25,
  eksi hazine +30, farklı din payı en çok +10, kuşatma +25, komşu düğümde düşman +15.
  Yeterli duran ordu −20; başkent veya komşu düğümü −10. Bilinmeyen din etkisizdir.
- Bağış 200; sonraki ay −20, ayda 5 sönüm. Mevcut yardım bitmeden yeni yardım birikmez.
- Asayiş eşiği max(500, nüfusun %5'i). Aynı düğümde duran kendi orduları sayılır;
  yürüyüş/geri çekilme/muharebedeki ordu sayılmaz. Kuşatma/işgalde bastırma sayacı ilerlemez.
- Ayaklanma risk <50 veya iki ardışık ay yeterli asayişle biter. Yeni bağımsız devlet/silahlı isyancı yok.
- İlk risk hesabı ilk ay başında yapılır; aylık risk snapshot'ı sonradan değişen koşulları bir sonraki ayda yansıtır.
- Risk hesabı gelir/maaş evresinden önce yapılır; gelir cezası aynı ay uygulanır.
- Aynı arazide birden çok şehirde en ağır gelir etkisi alınır; ceza çarpılarak birikmez.
  Şehirsiz araziler için ayrı uydurma şehir riski üretilmez; haritada veri yok olarak gösterilir.
- İlk 12→13 dönüşümünde geçmiş fetih barış kayıtlarından bulunur; bulunamazsa tarih uydurulmaz.
- 7d otomasyonu ayrıca kapsam onayı ister. Kullanıcı testi ve commit/push kararı bekleniyor.
