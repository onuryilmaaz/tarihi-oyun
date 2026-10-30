# TASK-0015 — Oynanış hataları düzeltme ve test raporu

- **Tarih:** 2026-10-29 · **Dayanak:** DEC-0064, kullanıcının “hepsini sırayla yap” onayı.
- **Kaynak inceleme:** `OYNANIS-HATA-INCELEMESI.md` (orijinal hata kanıtları korunur).
- **Kayıt:** Yeni durum alanı eklenmedi; şema **18**. Commit/push yapılmadı. Önceden kalan 10b değişiklikleri korundu.
- **Durum:** Kod ve otomatik kontroller tamam; kullanıcı kabulü bekleniyor.

## Değişiklikler ve karşılıkları

| Bulgu | Düzeltilen davranış | Doğrulama |
|---|---|---|
| H-01 | Tavan düşürülünce bu ayki gerçekleşmiş harcama korunur; kayıt geçerlidir. Reddedilen ayar kısmen uygulanmaz. | Yönetici 300 harcadı → tavan 0 → kayıt/yükle; otomatik test ve tarayıcı. |
| H-02 | Barış ve devletin yıkılması ortak savaş temizliği kullanır. Tam ilhakın üçüncü devletlerle bitirdiği muharebe/işgal, günlük muharebeden önce temizlenir. | Üç devletli regresyon; ilgisiz savaş ve işgalin korunduğu test; gerçek senaryo deneyi. |
| UX-01 | Barış önizlemesi ve onayında devredilen/kalan arazi ve şehir sayıları, tam ilhak durumu yazılır. Çevreden farklı sahibi olan şehirde sahiplik açıklaması ve harita etiketi vardır. | Osmanlı–Eflak: 26/0 ve 26/1 seçimleri; gerçek barış düğmeleri ve şehir paneli. |
| H-03 | Yeni oyun/kayıt yükleme, otomatik kayıt dönemini sıfırlar; ilk tur yeni dünyanın kaydını yazar. | Aynı ayda hazine 9.400 olan dünyadan 12.345 olan dünyaya geçiş; otomatik kayıt 12.345. |
| H-04 | Ayaklanmadaki limanda yeni gemi emri reddedilir. Ayaklanma/kuşatmada süren tersane bekler; şehir elden çıkarsa iptal olur. Arayüz bekleme nedenini gösterir. | 60 günlük kadırga inşası durur; kayıttan dönüş ve ayaklanma bitince kalan süreyle tamamlanır; tekrar ödeme yok. |
| H-05 | Bütçe ve maaş ortak toplam asker sorgusunu kullanır; gemideki ordu da sayılır. | Osmanlı 32.000 → 20.000 kişi gemiye biner → toplam yine 32.000; inişte çift sayım yok. |
| H-06 | İsyan desteği yalnızca güncel sahibi hâlâ kayıtlı hedef devletse etkilidir. Sahiplik değişince eski etki günlük temizlenir. | +25 → kendi eline geçince 0; kayıt/yükle ve geri devirde bitmiş etki canlanmaz. |
| H-07 | Dünya değişiminde görülen rapor kimlikleri temizlenip yüklenen kaydın raporlarıyla kurulur. | Önce Karaman raporu 1, sonra farklı Eflak muharebesi 1; yeni zafer penceresi açılır. |
| K-01 | Oyuncu, şehir ve ordu devlet indeksleri tam sayı olmalı. | Kesirli/eksik/metin/aralık dışı oyuncu indeksi, doğru içerik özetiyle bile reddedilir. |
| T-01/T-02 | Gerçek senaryo testi hareket bağlamı kullanır; bitmiş savaşın muharebesi ve yıkılmış devletin askerî kontrolü değişmezlerde yakalanır. | Gerçek ağla 10 yıllık iki deterministik kampanya, yıllık değişmezler ve kayıt sonrası aynı devam. |

## Eski kayıtlar

- H-01 nedeniyle harcaması tavandan yüksek kalmış kayıtlar, geçmiş harcama silinmeden artık yüklenebilir.
- H-02 nedeniyle savaş silindiği hâlde muharebe/işgal kalmış bir kayıtta, **yalnızca bu ilişki hataları varsa** ve dosyanın
  mevcut içerik özeti tutuyorsa dar kapsamlı temizlik yapılır. Günlüğe “Eski kayıttaki sona ermiş savaşın muharebe ve işgal
  kalıntıları temizlendi” yazılır. Sağlam kayıtların özeti/sonucu değişmez. Eski özetsiz kayıt desteği korunur.
- Başka tutarsızlık veya uyuşmayan içerik özeti kabul edilmez. Kullanıcının kayıt dosyaları yerinde düzenlenmedi;
  yükleme, bellekte çözülmüş kopyada çalışır. Otomatik şehir devri yapılmaz.

## Otomatik kontroller

- **`npm test`: 25 dosya, 198 test başarılı** (başlangıç 190; 8 yeni test, mevcut testlerde ek kontroller).
- **`npm run typecheck`: başarılı.**
- **`npm run build`: başarılı.**
- Her mantıksal değişiklik grubundan sonra üç komut çalıştırıldı. Bir ara çalışmada mevcut gerçek senaryo hareket testi
  5 saniyelik sınırı aştı; tekrar çalışmada geçti. Gerçek dünya kampanyaları için bu testin sınırı 30 saniyeye çıkarıldı;
  sonuç/eşitlik kontrolleri korunuyor. Son bütün denetimler başarılı.
- Simülasyon için yasaklı API/determinizm taraması yeni `savas-sonu.ts` dosyasını da kapsıyor.

## 5173 tarayıcı doğrulaması

Ayrı Chrome profili, yazılım WebGL; kullanıcı profiline dokunulmadı. Ürün akışları gerçek düğmelerle kullanıldı.
Savaşın uzun kurulumunu kısaltan ve aynı kimlikli iki farklı muharebeyi kuran kayıtlar **test için hazırlanmış** kayıtlardı;
doğal kampanyada oluşmuş kullanıcı kayıtları diye sunulmadı.

1. **Bütçe:** Edirne yöneticisi açıldı, 1.000 tavanla ay ilerletildi, 300 harcama görüldü. Tavan 0'a düşürüldü;
   yeni açıklama ve 300/0 geçmişi göründü. Oyunun Kaydet düğmesiyle yazılan kayıt simülasyonda başarıyla yüklendi.
2. **Otomatik kayıt:** Ayda bir seçeneği; A dünyasında 8 Nisan / 9.400, başka B dünyası yüklenip ilk haftası ilerleyince
   otomatik kayıtta 8 Nisan / **12.345**. Eski dünyanın metni değişti.
3. **Rapor:** Karaman zaferi kimlik 1 olan kayıt sonrası farklı Eflak muharebesi kimlik 1 yüklendi. Tur sonunda Eflak zaferi
   rapor listesinde ve **açılan rapor penceresinde** göründü.
4. **Barış:** Hazırlanmış Osmanlı işgali yüklendi → Savaş → Barış teklif et. Yalnız 26 arazi seçilince:
   “Karşı tarafta 0 arazi ve 1 şehir kalacak”. Tırgovişte de seçilince “Tam ilhak”. Onay metni aynı bilgiyi taşıdı.
   Barış emri ve Turu ilerlet düğmesiyle uygulandı; Tırgovişte paneli Osmanlı ve normal şehir statüsüne döndü.
5. **Ayrı şehir:** Yalnız arazi devredilmiş kayıt açıldı; Tırgovişte panelinde “Devlet: Eflak”, “Çevre arazi: Osmanlı · şehir
   ayrı mülkiyettedir”. Harita etiketi `⚑ Tırgovişte · Eflak Voyvodalığı` görünür olarak doğrulandı ve görüntüsü incelendi.
   Arazi etiketi kalmamış devletin şehri önce yer ayırır; diğer çakışmalar için alternatif dikey yerleşim var.
6. **Hedefli simülasyon:** Karaman–Bizans muharebesi tam ilhakla bitti; 50.000 asker 50.000 kaldı, Bizans işgali Bizans'a döndü.
   Ayaklanmalı Selanik gemi emrini reddetti; 20.000 taşınan Osmanlı askeri toplamdan düşmedi; kendi alınan şehirde isyan desteği 0.

Geçici betikler `/tmp/tarihi-audit-*.mjs`, `/tmp/tarihi-audit-*.js` ve `/tmp/tarihi-fix-*.js`; görsel
`/tmp/tarihi-fix-eflak-ayri.png`. Sonuçlar bu raporda kalıcılaştırıldı; betikler depo bağımlılığı değildir.

## Kullanıcının kısa testi — http://localhost:5173

1. Sayfayı yenile; mevcut Osmanlı kaydını yükle. Eflak şehrine tıkla. Arazi ve şehir farklı devletteyse ikisini ayrı görmelisin.
2. Bir sonraki barışta önce yalnız arazileri seç. Alt açıklamada karşı tarafta kaç şehir kalacağını oku. Şehirleri de seçince,
   hiçbir varlık kalmıyorsa **Tam ilhak** yazmalı. Onayla, turu ilerlet; şehir sahibini tekrar kontrol et.
3. Edirne → **Yerel yöneticiyi aç**. Devlet sekmesi → bütçe 1.000 → **Ayarı uygula** → **Ay → Turu ilerlet**.
   Harcama yaptıktan sonra bütçeyi 0 yap → **Ayarı uygula** → **Kaydet**. Kaydı yükle; hata çıkmamalı.
4. Ayar → otomatik kayıt **Ayda bir**. Farklı bir kayıt yükle, bir hafta ilerlet. Kayıtlar ekranındaki son otomatik kayıt
   yüklediğin dünyayı göstermeli.
5. Denizden asker taşırken Devlet → **Aylık bütçe** içindeki toplam asker sayısını kontrol et; binmeyle eksilmemeli.

## Değişen modüller ve sınırlar

- Simülasyon: `savas-sonu.ts` (yeni), `baris.ts`, `yz-savas.ts`, `durum.ts`, `kayit.ts`, `yonetim.ts`, `ordu.ts`,
  `ekonomi.ts`, `emirler.ts`, `deniz.ts`, `casusluk.ts`.
- İstemci: `main.ts`, `savas-arayuzu.ts`, `sim-isci.ts`, `sim-protokol.ts`, `harita/etiketler.ts`, `harita/gorunum.ts`, `index.html`.
- Testler: yönetim, AI savaş, kuşatma/barış, deniz, casusluk, kayıt, gerçek senaryo, hareket.
- Görev/karar/QA/devir/günlük belgeleri güncellendi. Önceki 10b dosyaları bu listenin dışında da kirli olabilir.
- Ayrı şehir/arazi kuralı ve OPEN-024 korunur. İlhak edilen devletin orduları otomatik silinmez veya galibe aktarılmaz.
  Ertelenmiş büyük özellikler eklenmedi; Aşama 10c/10d'ye geçilmedi. Kullanıcının asıl Eflak kaydı ayrıca incelenmedi.
- Kullanıcı kabulü ve commit/push izni bekliyor; düzeltmeler agent tarafından kullanıcı adına kabul edilmiş sayılmadı.
