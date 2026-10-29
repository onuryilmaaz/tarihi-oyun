// Simülasyon Web Worker'ı (DEC-0023). Dünya durumu yalnızca burada tutulur ve değiştirilir;
// ana iş parçacığı yalnızca özet alır, böylece uzun turlar haritayı dondurmaz.

import {
  baslangicDurumu, durumOzeti, emirVer, kaydet, tarihMetni, turSuresiAyarla, turuIlerlet, yukle,
  TUR_SURESI_ADLARI, type DunyaDurumu,
} from "@tarihi/sim";
import type { Istek, Ozet, Yanit } from "./sim-protokol";

let d: DunyaDurumu | null = null;

function ozet(durum: DunyaDurumu): Ozet {
  const o = durum.devletler[durum.ayarlar.oyuncu];
  return {
    gun: durum.gun,
    tarih: tarihMetni(durum.gun),
    turNo: durum.turNo,
    turSuresi: durum.ayarlar.turSuresi,
    turSuresiAdi: TUR_SURESI_ADLARI[durum.ayarlar.turSuresi],
    oyuncu: { indeks: durum.ayarlar.oyuncu, id: o.id, ad: o.ad, hazine: o.hazine },
    gunluk: durum.gunluk.slice(-30),
    bekleyenEmir: durum.emirKuyrugu.length,
    planliKesinti: durum.planliKesintiler.map((k) => ({ tarih: tarihMetni(k.gun), neden: k.neden })),
    hash: durumOzeti(durum),
  };
}

function isle(i: Istek): Yanit {
  switch (i.tip) {
    case "yeniOyun":
      d = baslangicDurumu(i.senaryo, { tohum: i.tohum, oyuncu: i.oyuncu });
      return { id: i.id, tamam: true, ozet: ozet(d) };
    case "yukle":
      d = yukle(i.metin, i.senaryo);
      return { id: i.id, tamam: true, ozet: ozet(d) };
  }
  if (!d) return { id: i.id, tamam: false, hata: "Oyun başlatılmadı." };
  switch (i.tip) {
    case "turSuresi":
      turSuresiAyarla(d, i.sure);
      return { id: i.id, tamam: true, ozet: ozet(d) };
    case "emir": {
      const dogrulama = emirVer(d, i.emir);
      return { id: i.id, tamam: true, ozet: ozet(d), dogrulama };
    }
    case "turuIlerlet": {
      const t0 = performance.now(); // yalnızca ölçüm; simülasyon sonucunu etkilemez
      const sonuc = turuIlerlet(d);
      return { id: i.id, tamam: true, ozet: ozet(d), sonuc, sureMs: performance.now() - t0 };
    }
    case "kaydet":
      return { id: i.id, tamam: true, ozet: ozet(d), metin: kaydet(d) };
  }
}

self.onmessage = (e: MessageEvent<Istek>) => {
  let y: Yanit;
  try {
    y = isle(e.data);
  } catch (hata) {
    y = { id: e.data.id, tamam: false, hata: hata instanceof Error ? hata.message : String(hata) };
  }
  self.postMessage(y);
};
