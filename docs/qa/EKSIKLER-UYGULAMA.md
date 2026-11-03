# Eksiklerin uygulama takibi — 2 Kasım 2026

Kullanıcı onayı: “hepsini yap”; DEC-0088. Bu tablo uygulama durumudur; kullanıcı kabulü veya yayın onayı değildir.

| Görev | Kapsam | Durum |
|---|---|---|
| TASK-0045 | Askerî geçiş, AI diplomatik bağları | Uygulandı; 302 test, typecheck/build; 5173 kabul/iptal akışı |
| TASK-0046 | Yapılar, kaynaklar, teknoloji | Uygulandı; 308 test, typecheck/build; 5173 okul, kaynak alımı ve teknoloji listesi |
| TASK-0047 | Komutan, deneyim, topçu | Uygulandı (Claude); 314 test, typecheck/build; 5173 yetiştir/ata/topçu reddi |
| TASK-0048 | Ortak savaş/barış, vasal bütünleşmesi, siyasi isyan | Uygulandı (Claude); 319 test, typecheck/build |
| TASK-0049 | Reform, fetih bütünleşmesi, görevler | Uygulandı (Claude); 325 test, typecheck/build; 5173 danışman/reform/görev |
| TASK-0050 | Kampanya geçmişi, haber merkezi | Uygulandı (Claude); typecheck/build; 5173 haber/güç/geçmiş harita |
| TASK-0051 | AI gemi üretimi, çıkarma | Uygulandı (Claude); 332 test, typecheck/build |

## TASK-0045

- Geçiş izni yönlüdür; 12/24/36 ay, ilişki en az 15 veya ittifak (hedefin müttefikiyle savaşıyorsa ret). İzin isteme, verme, geri alma ve vazgeçme diplomasi panelindedir. Kuyrukta ve tur başında doğrulanır. Yalnız yürüyüş hakkıdır; işgal/ikmal hakkı veya mülkiyet vermez. Efendi/vasal arasında da kara geçişi açıktır.
- İzin bittiğinde veya siyasi erişim değiştiğinde geçersiz rota bulunduğu anlık konumda durur; ışınlanma yok. İptal edilen iznin içinde kalan ordu yeni erişim veya açık koridor gerektirebilir.
- AI çiftleri 180 günlük karar ritminde, komşu ve karşılıklı kabul koşulları uygunsa ittifak/ticaret/saldırmazlık; müttefikler geçiş kurar. Her denemede en çok bir bağ; oyuncu adına otomatik anlaşma yok. Oluşan bağ dünya haberidir; gizli bilgi içermez.
- `gecis.test.ts`: üçüncü devlet koridoru, yön, sahiplik, ret/kabul, bekleyen emir, süre/iptal/savaş, kayıt/devam, AI çiftleri. Tam takım 39 dosya / 302 test; typecheck/build geçti.
- 5173'te ayrı geçici profilde hazırlanan Osmanlı/Eflak kaydında **Geçiş izni iste → tur → bitiş tarihi → İznimizden vazgeç → tur → izin yok** doğrulandı. Kullanıcının kayıtları değiştirilmedi.
- Değişen modüller: sim `gecis`, `durum`, `denge`, `hareket`, `emirler`, `sistemler`, `yz`, `yz-diplomasi`, `savas-sonu`, `index`; istemci protokol/işçi/main; testler ve görev/karar/devir.
- Şema 31; eski kayıt taşınmaz. Commit/push yapılmadı.

## TASK-0046

- Okul, atölye, kışla eklendi. Okul seviye başına +%5 araştırma hızı (devlet toplamında en çok +%30), atölye +%25 üretim ve nüfusa göre gelir, kışla +%20 insan gücü tavanı ve −%10 toplama süresi verir. Yeni bina seviyeleri teknolojiyle 3'e çıkar. Birleşen şehirlerin yeni yapıları da aktarılır; bağlı şehir iki kez üretmez.
- Tahıl/demir/kereste gerçek stoktur; üretim şehir/arazi bilgisinden **oyun tahmini** olarak türetilir. İsyan/kuşatma/işgal üretimi keser; tarla, atölye, tarım ve metalurji teknolojileri artırır. Ordu (gemideki dahil) aylık tahıl tüketir; yetersizlik moral azaltır, stok eksiye inmez. Yeni binalar ve gemiler kaynak tüketir. Temel tarla/pazar/sur maliyeti korunur.
- Kaynak ticareti anlaşma, ambargosuz ilişki, kontrol edilen ortak kara sınırı veya düşman donanması olmayan liman güzergâhı ister. Hazine, satıcının ihracat rezervi ve depolama sınırı kuyrukta/turda doğrulanır; para ve mal karşı tarafa gerçekten aktarılır. Fiyat satıcının kıtlığına göre artabilir; tur başında yeniden doğrulanır. Devlet panelinden ürün/miktar seçilir; kaynak stok/üretim/tüketimi Şehir sekmesindedir.
- AI atölye, okul ve kışla yapabilir; kıtlıkta anlaşmalı açık yoldan bütçesi kadar kaynak alır. Oyuncuyla aynı doğrulama/bedelleri kullanır.
- 8 teknoloji: Matbaa ve Eğitim, Tarım Dönüşümü, Gelişmiş Metalurji, Manüfaktür, Sahra Mühendisliği, Sefer Lojistiği, Daimî Elçilikler, Taşra İdaresi. Araştırma/üretim/gelir/insan gücü/kuşatma/diplomasi/ikmal etkileri bağlıdır. **Sahra Mühendisliği'nin topçu birliği açılımı TASK-0047 ile tamamlanacak; şu anda topçu henüz yok.** Ağ toplam 18 teknoloji; tarih zorlaması yok.
- Yeni `kaynak-yapi.test.ts`: gerçek üretim ve tüketim, inşaat kaynak rezervasyonu, kayıt devamı, okul/kışla etkisi, ticaret para/mal korunumu ve ret koşulları, tahıl açlığı. 40 dosya / **308 test geçti**; typecheck ve build başarılı. `git diff --check` temiz.
- 5173'te ayrı test profilinde Edirne'de okul emri verildi, 120 günlük inşaat tamamlandı (30 Temmuz), araştırma hızı %100→%105; teknoloji penceresinde 18 kart görüldü. Eflak'tan 10 demir 50 bedelle alındı (27 Ağustos); AI Eflak'ın da Osmanlı'dan 20 kereste alımı gerçekleşti (3 Eylül). Testte hazırlanan kayıt ve gerçek arayüz düğmeleri kullanıldı. Kullanıcının kayıtlarına dokunulmadı. İlk denemede tarayıcı betiği tur işleminin bitmesini beklemeden yeniden tıklıyordu; bekleme düzeltildi, ürün hatası bulunmadı.
- Şema **32**; eski şemalar taşınmaz (DEC-0075). Senaryo geometrisi/sürümü bu teslimde değişmedi.
- Değişen modüller: yeni sim `kaynak.ts`; `durum`, `denge`, `yatirim`, `teknoloji`, `diplomasi`, `ordu`, `emirler`, `sistemler`, `sehir`, `yz`, `index`; istemci protokol/işçi/main/index; davranış testleri ve belgeler.

## Durum (2026-11-03, Claude)

TASK-0045–0051'in tamamı uygulandı. Kullanıcı kabulü ve commit/push onayı bekleniyor.

## Eski devam noktası

Aktif büyük işin 2/7 teslimi uygulandı; **TASK-0047–0051 yapılmadı**. Kullanıcının “hepsini yap” ve “devamm” talimatları kalan kapsam için de geçerlidir; yeniden izin istenmez. Önce TASK-0047: komutan atama/ayırma, ordu deneyimi, teknolojiyle topçu, bölme/birleştirme/takviye/maaş/kayıp/kuşatma ve arayüz entegrasyonu. Sonra TASK-0048–0051 kart sırası. Ayrı kabul/commit/push/yayın kararı verilmedi.
