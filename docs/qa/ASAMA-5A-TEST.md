# TASK-0008 / 5a — Bütçe özeti doğrulaması

Tarih: 2026-10-29. Agent: Codex. Dayanak: MASTER_SPEC §11, §17.3, §22 Aşama 5;
DEC-0002, DEC-0032. Kullanıcı kabulü bekleniyor; 4c ile birlikte yapılacak.

## Uygulama ve sınır

`packages/sim/src/ekonomi.ts` mevcut hazine, kuyruk rezervasyonu, kullanılabilir para,
aylık test geliri/maaş/farkını sorgular. `sistemler.ts` aynı gelir hesabını kullanır.
Worker/protokol ve main.ts/index.html bütçeyi oyuncuya gösterir.
Yeni gelir, harcama, vergi, üretim, bina, araştırma veya otomasyon kuralı eklenmedi.
Kayıt şeması 5, denge değerleri ve gerçekleşen para hareketleri korunuyor.
Aylık fark mevcut durumu anlatır; gelecekteki asker toplama tamamlamalarını, bir defalık
harcama veya tazminatı öngörmez. Gelir açıkça prototip olarak etiketlenir.

## Otomatik kontroller

- `npm test`: 12 dosyada **94 test başarılı**.
- `npm run typecheck`: sim ve istemci başarılı.
- `npm run build`: başarılı; 4175 güncellendi. Mevcut 500 kB paket uyarısı sürüyor.
- 4 yeni davranış testi: salt sorgu durum değiştirmez; aylık fark gerçek gelir/maaşla eşleşir;
  harcama ve toplamanın ortak rezervasyonu görünür; eksi hazine/açık gizlenmez;
  yasal sahiplik değişimi mevcut gelir kuralına göre yansır.
- Yeni modül de determinizm yasakları taramasında; önceki 4a/4b/4c testleri başarılı.

## Chrome (5173, bağımsız geçici profil)

1. Başlangıç Osmanlı bütçesi: hazine 9.400, rezerv 0, kullanılabilir 9.400;
   aylık prototip gelir +940 (94 arazi), maaş −640 (32.000 asker), fark +300.
2. Edirne'den 1.000 asker emri: hazine hâlâ 9.400; rezerv 100, kullanılabilir 9.300.
3. Bir ay ilerletildi: toplama tamamlandı, hazine 9.580; rezerv 0; 33.000 askerin
   maaşı 660 oldu ve yeni aylık fark +280 gösterildi. Hesap: 9.400 − 100 + 940 − 660.
4. JavaScript çalışma zamanı hatası yok.

Geçici betik `/tmp/tarihi-5a-browser.mjs`, görsel `/tmp/tarihi-5a-butce.png` (depo dışında).

## Sonradan birlikte yapılacak kullanıcı testi

1. 4175'i yenile. Solda “Ordu giderleri” altında **Aylık bütçe özeti**'ni gör.
2. Asker toplama emri ver; “Emirlere ayrılan” artmalı, “Kullanılabilir” düşmeli.
3. Ayı ilerlet; rezerv kullanılmış, maaş yeni orduya göre güncellenmiş olmalı.
4. `ASAMA-4C-TEST.md` içindeki savaş/kuşatma/barış denemesini yap. Kalıcı arazi devri
   prototip aylık gelir hesabına da yansımalı; şehir tek başına arazi geliri eklememeli.

Bu tur kullanıcıdan hemen test etmesi istenmedi; takvim kullanıcının tercihine bırakıldı.
