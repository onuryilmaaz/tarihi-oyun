# Lisans ve kaynak kontrol listesi (TASK-0012/9d)

Son denetim: 2026-10-29, Claude. Aşama 9 kabul ölçütü: "Senaryo doğruluğu ve lisans kontrolleri tamam".

## Veri

| Kaynak | Lisans | Atıf / koşul | Durum |
|---|---|---|---|
| Natural Earth 1:10m | Kamu malı | Atıf gerekmez; oyunda Kaynaklar ekranında anılır | ✔ |
| OpenHistoricalMap (49 kayıt) | CC0-1.0 (kayıt bazında `ohm-kayitlari.json`) | Atıf gerekmez; şehir/devlet panelinde kayıt bağlantısı | ✔ |
| Wikidata | CC0 | Atıf gerekmez; devlet panelinde QID bağlantısı | ✔ |
| NOAA NCEI ETOPO 2022 | Ücretsiz kullanım ve yeniden dağıtım | Ham veri depoda yok; yalnızca türetilmiş zorluk/verim | ✔ |
| Agent tahmini tablolar (ilişkiler, hükümdarlar, nüfus grupları, şehir nüfusları, deniz) | Projenin kendi içeriği | Hepsi "[TASLAK]" işaretli; oyunda "tahmin" olarak belirtilir | ✔ (test: `veri-kaynak.test.ts`) |

## Yazılım (istemci paketine giren)

| Paket | Sürüm | Lisans | Durum |
|---|---|---|---|
| three | 0.186.1 | MIT | ✔ |
| earcut | 3.2.4 | ISC | ✔ |
| @fontsource/cinzel | 5.3.0 | OFL-1.1 (yazı tipi) | ✔ |
| @fontsource/cormorant-garamond | 5.3.0 | OFL-1.1 (yazı tipi) | ✔ |
| @fontsource/inter | 5.3.0 | OFL-1.1 (yazı tipi) | ✔ |

Geliştirme araçları (pakete girmez): vite (MIT), typescript (Apache-2.0), vitest (MIT), polylabel (ISC).

## Diğer

- Görseller: harici görsel/ikon yok. Armalar ve kâğıt dokusu kodla üretilir.
- Çalışırken dış ağ isteği yok (yazı tipleri pakete gömülü); yalnızca oyuncunun tıkladığı OpenHistoricalMap/Wikidata bağlantıları.
- Ücretli servis, dış API ya da lisanslı varlık bağlanmadı (AGENTS: onaysız yapılamaz).

## Açık noktalar

- Agent tahmini tabloların tarihî kaynaklarla tek tek doğrulanması yapılmadı; bunlar oyunda "taslak" olarak kalır.
- Yayın (Aşama 10) öncesinde OFL yazı tipi lisans metinlerinin dağıtıma eklenmesi gerekir.
