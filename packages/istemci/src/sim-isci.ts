// Simülasyon Web Worker'ı (DEC-0023). Dünya durumu yalnızca burada tutulur ve değiştirilir;
// ana iş parçacığı yalnızca özet alır, böylece uzun turlar haritayı dondurmaz.

import {
  agHazirla, baslangicDurumu, durumOzeti, emirVer, gorunurYabanciOrdular, kalanYol, kaydet, orduKonumu, orduRotasi,
  tarihMetni, turSuresiAyarla, turuIlerlet, yukle, TUR_SURESI_ADLARI, type Baglam, type DunyaDurumu,
} from "@tarihi/sim";
import type { Istek, Ozet, Yanit } from "./sim-protokol";

let d: DunyaDurumu | null = null;
let baglam: Baglam = { ag: null };

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
    ordular: durum.ordular.filter((o) => o.devlet === durum.ayarlar.oyuncu).map((o) => {
      const k = orduKonumu(o);
      const kalan = kalanYol(o);
      return {
        id: o.id, ad: o.ad, devlet: o.devlet, asker: o.asker, x: k.x, y: k.y,
        yuruyor: o.rota.length > 0,
        rota: o.rota.map((a) => [a.x, a.y] as [number, number]),
        kalanGun: o.rota.length ? kalan.gun : 0,
        varisTarihi: o.rota.length ? tarihMetni(durum.gun + kalan.gun) : null,
        moral: o.moral, tutum: o.tutum, muharebede: o.muharebe !== null, cekiliyor: o.cekiliyor,
      };
    }),
    // Yabancı ordular yalnızca görünürlük kuralıyla süzülerek ve yaklaşık büyüklükle gönderilir (DEC-0027/2)
    yabanciOrdular: baglam.ag ? gorunurYabanciOrdular(durum, baglam.ag, durum.ayarlar.oyuncu)
      .map((y) => ({ ...y, ...orduKonumu(durum.ordular.find((o) => o.id === y.id)!) })) : [],
    savaslar: durum.savaslar.filter((s) => s.saldiran === durum.ayarlar.oyuncu || s.savunan === durum.ayarlar.oyuncu)
      .map((s) => ({ karsi: s.saldiran === durum.ayarlar.oyuncu ? s.savunan : s.saldiran, baslangic: tarihMetni(s.baslangic), saldiran: s.saldiran === durum.ayarlar.oyuncu })),
    raporlar: durum.muharebeRaporlari.filter((r) => r.taraflar.some((t) => t.devlet === durum.ayarlar.oyuncu)).slice(-10),
    birimIsgal: durum.birimler.flatMap((b, i) => (b.kontrol !== b.sahip ? [[i, b.kontrol, b.isgalBaslangic ?? durum.gun]] : [])) as [number, number, number][],
    sehirIsgal: durum.sehirler.flatMap((s, i) => (s.kontrol !== s.devlet ? [[i, s.kontrol, s.isgalBaslangic ?? durum.gun]] : [])) as [number, number, number][],
  };
}

function isle(i: Istek): Yanit {
  switch (i.tip) {
    case "yeniOyun":
      baglam = { ag: i.senaryo.ag ? agHazirla(i.senaryo.ag) : null };
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
      const dogrulama = emirVer(d, i.emir, baglam);
      return { id: i.id, tamam: true, ozet: ozet(d), dogrulama };
    }
    case "turuIlerlet": {
      const t0 = performance.now(); // yalnızca ölçüm; simülasyon sonucunu etkilemez
      const sonuc = turuIlerlet(d, baglam);
      return { id: i.id, tamam: true, ozet: ozet(d), sonuc, sureMs: performance.now() - t0 };
    }
    case "kaydet":
      return { id: i.id, tamam: true, ozet: ozet(d), metin: kaydet(d) };
    case "rotaOnizle": {
      const o = d.ordular.find((x) => x.id === i.ordu);
      if (!o || !baglam.ag) return { id: i.id, tamam: true, ozet: ozet(d), rota: { gecerli: false, neden: "Ordu ya da hareket ağı bulunamadı." } };
      const r = orduRotasi(d, baglam.ag, o, i);
      return {
        id: i.id, tamam: true, ozet: ozet(d),
        rota: r.gecerli
          ? { gecerli: true, noktalar: r.adimlar.map((a) => [a.x, a.y]), gun: r.gun, varisTarihi: tarihMetni(d.gun + r.gun), kirilim: r.kirilim }
          : { gecerli: false, neden: r.neden },
      };
    }
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
