# TASK-0007 / 4c test ve kabul raporu

Tarih: 2026-10-29. Agent: Codex. Gereksinimler: MASTER_SPEC §8.8, §9, §11.2, §22–23;
AT-007, AT-009, AT-013, AT-016; DEC-0002, DEC-0027, DEC-0031.

**Durum:** Uygulama tamamlandı. Kullanıcı 4c testini 5a ile birleştirmeyi istedi (DEC-0032).
4c kullanıcı kabulü ve Aşama 4 kapanış onayı BEKLENİYOR; Aşama 5’e geçiş ayrıca yetkilendirildi.

## Otomatik doğrulama

- `npm test`: 11 dosyada 89 test başarılı.
- `npm run typecheck`: sim ve istemci başarılı.
- `npm run build`: başarılı, 4175 dosyaları güncellendi. Önceden de görülen 500 kB paket
  boyutu uyarısı sürüyor (istemci JS yaklaşık 613 kB, gzip 161 kB); derleme hatası yok.
- Yeni `kusatma-baris.test.ts`: 23 davranış testi; iki yeni sim modülü determinizm taramasında.
- Kapsam: yürüyüşle şehrin düşmemesi; süreli arazi işgali; geri çekilme/ayrılmada süre sıfırlama;
  ayrı şehir-arazi sahipliği; kuşatma yöntemleri, güç ve mesafe; yöntem değişimi, çoklu ordu,
  ordu yok oluşu; başkentin tek başına zafer olmaması; geçersiz/tekrarlı/yetersiz puanlı talepler;
  peşin tazminat/para korunumu; tur başında yeniden doğrulama; tam işgal; devam eden muharebenin
  barışla durması; başka savaşların korunması; dönüşte ışınlanmama; kaybedilen şehirde toplamanın
  iptali; kuşatma/barış kaydı; şema 3 ve 4 dönüşümü; aynı gün sayısında deterministik sonuç.

## Chrome uçtan uca (5173)

Kullanıcı kayıtlarından bağımsız geçici Chrome profili ve DevTools Protocol kullanıldı.
Düğmeler, şehir bağlantıları, seçimler, kuşatma ve barış onay ekranları üzerinden denendi.

1. Osmanlı, Karaman'a savaş ilan etti. Anadolu Ordusu seçildi; Larende bağlantısı ve
   “Şehre yürü” kullanıldı. Haftalar ilerletildi; karşılaşma ve muharebe raporu görüldü.
2. Ordu Larende'ye vardı: şehir yasal ve askerî olarak hâlâ Karamanoğulları'ndaydı.
   Sadece yürüyüş şehri düşürmedi. Çevre arazi ayrı olarak işgal edildi.
3. Kara ablukası başlatıldı. Bir hafta sonra 7 etkin gün, garnizon ~2.000, erzak ~%70.
   Bu sırada manuel kayıt alındı.
4. Yöntem surlara saldırıya çevrildi; süre sıfırlanmadı. Toplam 16 etkin kuşatma günü sonunda
   Larende düştü, tur durdu. Şehir askerî kontrolü Osmanlı, yasal sahibi Karamanoğulları olarak kaldı.
5. Savaş devam ediyordu; skor 47 idi. Barış ekranında 999.999 tazminat girilince peşin
   ödenemeyeceği açıklandı ve teklif düğmesi devre dışı kaldı.
6. Karaman arazisi + Larende şehri, 0 tazminat seçildi: 47 puan talep / 47 skor kabul edilebilir.
   Oyun içi onay verildi; bir sonraki turun başında antlaşma uygulandı.
7. Savaş kalktı; tarihçede 1 arazi, 1 şehir, 0 tazminat göründü. Harita Karaman arazisini
   Osmanlı rengine çevirdi; Larende sahibi Osmanlı oldu ve eski başkent işareti kalktı.
   Karaman'ın kalan şehri Konya yeni başkent olarak işaretlendi.
8. Manuel kayıt yüklendi: savaş, 7 günlük abluka, yaklaşık garnizon ve erzak geri geldi.
   Harita rengi, siyasi sınır ve Larende'nin başkent/sahip bilgisi eski duruma döndü.
9. Yakalanan JavaScript çalışma zamanı hatası yok.

Geçici betik: `/tmp/tarihi-4c-browser.mjs`. Görseller:
`/tmp/tarihi-4c-kusatma.png`, `/tmp/tarihi-4c-baris.png` (depo dışında).

## Kullanıcı için tıklama adımları (4175)

Başlangıç Osmanlı oyununda:

1. Sayfayı yenile. Haritadaki Karaman ordusunun yaklaşık **~4B** işaretine tıkla;
   sağ panelden **Savaş ilan et** ve oyunun onay ekranında onayla.
2. Solda **Anadolu Ordusu**'nu seç. Sağdaki Karaman panelinde **Larende**'ye, ardından
   **Şehre yürü**'ye bas.
3. **Hafta → Turu ilerlet** ile ilerle. Muharebe kesintisinde **Anladım**'a, raporda
   **Kapat**'a basıp ilerlemeye devam et. Ordu Larende'de bekleyince kuşatma seçeneği açılır.
4. Solda **Kuşatma → Larende → Surlara saldırı → Kuşatmayı başlat**.
   Ardından **Ay → Turu ilerlet**. Şehir düşünce tur durur; **Anladım**'a bas.
5. **Savaşlar → Barış teklif et**. Arazi listesinden **Karaman**, şehir listesinden
   **Larende**'yi işaretle; tazminatı **0** bırak.
6. **Barış teklif et → onayla → Turu ilerlet**. Savaş kalkmalı, Larende ve seçilen arazi
   Osmanlı'ya geçmeli. Barış geçmişinde antlaşma görünmeli.

İstersen yalnızca şehri veya yalnızca araziyi seçerek ayrı fetih davranışını da deneyebilirsin.
Süre ve sayılar TASLAK'tır; denge kabulü anlamına gelmez. Ayrıntılı sınırlar Aşama 4 belgesindedir.

## Değişen yerler

- Sim: `kusatma.ts`, `baris.ts`, `durum.ts`, `denge.ts`, `emirler.ts`, `sistemler.ts`, `kayit.ts`, `index.ts`.
- İstemci: `savas-arayuzu.ts`, `main.ts`, `sim-isci.ts`, `sim-protokol.ts`, `index.html`;
  harita katmanları, görünüm ve etiketler (`harita.ts`, `gorunum.ts`, `etiketler.ts`).
- Test: `packages/sim/test/kusatma-baris.test.ts`.
- Belgeler: AGENTS, DECISIONS, CHANGELOG, TASK-0007, ASAMA-4, DEVIR-TESLIM ve bu rapor.
