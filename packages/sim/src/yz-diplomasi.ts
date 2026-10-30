// TASK-0020 (1/3, DEC-0069): AI'dan oyuncuya diplomatik teklifler (ittifak/ticaret/saldırmazlık).
// TASK-0021 (4/4, DEC-0070): çok daha güçlü bir komşu AI, oyuncuya vasallık da teklif edebilir.
// Mevcut barış teklifi altyapısına (yz-savas.ts) benzer: AI aylık kararında (YZ_KARAR_ARALIGI ritmiyle),
// oyuncuyla ilişkisi uygunsa ve ilgili ilişki henüz yoksa, küçük bir olasılıkla teklif kurar;
// oyuncu "gelen kutusu"nda kabul/ret eder (bkz. emirler.ts: diplomatikTeklifCevap). Vasallık yalnızca teklif
// edilir — oyuncu reddedebilir, zorla vasal yapılmaz.

import { olayEkle, type DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import { iliski, komsuMu, muttefik, muttefikleri, saldirmazlikVar, ticaretAnlasmasiVar, type DiplomasiOnHesap } from "./diplomasi";
import { savasta } from "./savas";
import { aralik } from "./rastgele";
import { efendisi, vasalMi } from "./vasallik";

const TUR_ADI = { ittifak: "savunma ittifakı", ticaret: "ticaret anlaşması", saldirmazlik: "saldırmazlık paktı", vasallik: "vasallık" } as const;

/** Bir AI devletinin oyuncuya diplomatik teklif sunma kararı (ayda bir, YZ_KARAR_ARALIGI ritmiyle). */
export function diplomatikTeklifKarari(d: DunyaDurumu, on: DiplomasiOnHesap, devlet: number): void {
  const oyuncu = d.ayarlar.oyuncu;
  // Sınır komşusu olmayan uzak devletler oyuncuya teklif göndermez (çok sayıda devlette her ay kontrol
  // edilince gelen kutusunu ve tur akışını boğmaması için; bkz. TASK-0020 riskler).
  if (devlet === oyuncu || savasta(d, devlet, oyuncu) || !komsuMu(on, devlet, oyuncu)) return;
  if (d.diplomatikTeklifler.some((t) => t.devlet === devlet)) return; // aynı anda bir bekleyen teklif
  if (d.gun - d.diplomatikTeklifSoguma[devlet] < DENGE.YZ_DIPLOMASI_SOGUMA_GUN) return; // son teklifinin üzerinden yeterince gün geçmedi
  if (aralik(d, 100) >= DENGE.YZ_DIPLOMASI_TEKLIF_OLASILIK) return;
  const p = iliski(d, on, devlet, oyuncu);
  let tur: "ittifak" | "ticaret" | "saldirmazlik" | "vasallik" | null = null;
  let ay: number | null = null;
  let nedenMetni = "";
  // TASK-0021 (4/4): arazisi oyuncudan kat kat büyük, kendisi kimsenin vasalı olmayan bir komşu, oyuncu
  // zaten bir efendisi yoksa, vasallık teklif edebilir (ilişkiden bağımsız — bu bir baskı/teklifi, dostluk değil).
  if (on.arazi[oyuncu] > 0 && on.arazi[devlet] >= on.arazi[oyuncu] * DENGE.VASAL_TEKLIF_ARAZI_KATI
    && efendisi(d, oyuncu) === null && efendisi(d, devlet) === null && !vasalMi(d, devlet)) {
    tur = "vasallik";
    nedenMetni = `Arazisi sizden ${DENGE.VASAL_TEKLIF_ARAZI_KATI} kattan büyük; sizi vasalı olarak görmek istiyor.`;
  } else if (p >= DENGE.ITTIFAK_ESIGI && !muttefik(d, devlet, oyuncu) && muttefikleri(d, devlet).length < DENGE.ITTIFAK_EN_COK) {
    tur = "ittifak";
    nedenMetni = `Size bakışı ${p} (dostane).`;
  } else if (p >= DENGE.TICARET_ANLASMA_ESIGI && !ticaretAnlasmasiVar(d, devlet, oyuncu)) {
    tur = "ticaret";
    nedenMetni = `Size bakışı ${p} (olumlu).`;
  } else if (p >= DENGE.SALDIRMAZLIK_ESIGI && !saldirmazlikVar(d, devlet, oyuncu)) {
    tur = "saldirmazlik";
    ay = DENGE.SALDIRMAZLIK_VARSAYILAN_AY;
    nedenMetni = `Size bakışı ${p} (tarafsız/olumlu).`;
  }
  if (!tur) return;
  d.diplomatikTeklifSoguma[devlet] = d.gun;
  const ad = d.devletler[devlet].ad;
  d.diplomatikTeklifler.push({ id: d.sonrakiDiplomatikTeklifId++, devlet, tur, ay, gun: d.gun, gerekce: nedenMetni });
  const metin = `${ad} size ${TUR_ADI[tur]} teklif ediyor. ${nedenMetni}`;
  olayEkle(d, { tur: "diplomatik-teklif", devlet: oyuncu, metin });
  if (!d.aktifKesinti) d.aktifKesinti = { gun: d.gun, neden: metin };
}

/** Günlük: süresi dolan diplomatik teklifler düşer (barış teklifiyle aynı geçerlilik süresi). */
export function diplomatikTeklifSureleri(d: DunyaDurumu): void {
  for (const t of d.diplomatikTeklifler.filter((x) => d.gun - x.gun >= DENGE.BARIS_TEKLIF_GUN)) {
    d.diplomatikTeklifler = d.diplomatikTeklifler.filter((x) => x !== t);
    olayEkle(d, { tur: "diplomatik-teklif", devlet: d.ayarlar.oyuncu, metin: `${d.devletler[t.devlet].ad}'nın ${TUR_ADI[t.tur]} teklifinin süresi doldu.` });
  }
}
