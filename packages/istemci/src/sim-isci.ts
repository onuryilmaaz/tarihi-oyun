// Simülasyon Web Worker'ı (DEC-0023). Dünya durumu yalnızca burada tutulur ve değiştirilir;
// ana iş parçacığı yalnızca özet alır, böylece uzun turlar haritayı dondurmaz.

import {
  agHazirla, baslangicDurumu, durumOzeti, emirVer, gorunurYabanciOrdular, kalanYol, kaydet, orduKonumu, orduRotasi,
  tarihMetni, turSuresiAyarla, turuIlerlet, yukle, TUR_SURESI_ADLARI, type Baglam, type DunyaDurumu,
  aylikMaas, devletMaasi, emirDogrula, ikmalDurumu, kullanilabilirHazine, kullanilabilirInsanGucu, DENGE,
  barisBedeli, barisDogrula, kusatmaGucu, orduKusatmasi, savasSkoru,
  butceOzeti, insaatMaliyeti, insaatSuresi, sehirYapiGeliri, yapiSeviyesi, yapiEnYuksek, pazarGeliriSeviyeBasina, YAPI_ADLARI, YAPI_TURLERI,
  diplomasiOnHesap, etkiDegeri, hediyePuanBedeli, iliski, iliskiBilesenleri, ittifakDegerlendir, komsuMu, muttefik, muttefikleri, savasta,
  hukumdarYasi, VERASET_ADLARI, type Hukumdar,
  ALAN_ADLARI, TEKNOLOJILER, teknolojiBul, biliyor, toplamaBedelYuzde, toplamaSuresi,
} from "@tarihi/sim";
import type { Istek, Ozet, Yanit } from "./sim-protokol";

let d: DunyaDurumu | null = null;
let baglam: Baglam = { ag: null };

const hukumdarOzeti = (durum: DunyaDurumu, h: Omit<Hukumdar, "tahtaCikis"> | null) => h && {
  ad: h.ad, hanedan: h.hanedan, yas: hukumdarYasi(durum, h), yonetim: h.yonetim, askerlik: h.askerlik, diplomasi: h.diplomasi,
  mesruiyet: h.mesruiyet, kurgusal: h.kurgusal };

function ozet(durum: DunyaDurumu): Ozet {
  const o = durum.devletler[durum.ayarlar.oyuncu];
  return {
    gun: durum.gun,
    tarih: tarihMetni(durum.gun),
    turNo: durum.turNo,
    turSuresi: durum.ayarlar.turSuresi,
    turSuresiAdi: TUR_SURESI_ADLARI[durum.ayarlar.turSuresi],
    oyuncu: { indeks: durum.ayarlar.oyuncu, id: o.id, ad: o.ad, hazine: o.hazine },
    gunluk: durum.gunluk.filter((e) => e.devlet === null || e.devlet === durum.ayarlar.oyuncu).slice(-30),
    bekleyenEmir: durum.emirKuyrugu.length,
    kullanilabilirHazine: kullanilabilirHazine(durum, durum.ayarlar.oyuncu),
    aylikMaas: devletMaasi(durum, durum.ayarlar.oyuncu),
    butce: butceOzeti(durum, durum.ayarlar.oyuncu),
    sehirYatirimlari: durum.sehirler.flatMap((s, indeks) => {
      if (s.devlet !== durum.ayarlar.oyuncu) return [];
      const suren = durum.insaatlar.find((i) => i.sehir === indeks);
      const emir = durum.emirKuyrugu.find((e) => e.tur === "insaat" && e.sehir === indeks);
      const insaat = suren
        ? { yapi: suren.yapi, ad: YAPI_ADLARI[suren.yapi], hedef: suren.hedef, kalanGun: suren.kalanGun, emir: false,
          durdu: durum.kusatmalar.some((k) => k.sehir === indeks) }
        : emir && emir.tur === "insaat"
          ? { yapi: emir.yapi, ad: YAPI_ADLARI[emir.yapi], hedef: yapiSeviyesi(s, emir.yapi) + 1, kalanGun: insaatSuresi(durum, s.devlet, emir.yapi), emir: true, durdu: false }
          : null;
      return [{
        indeks, ad: s.ad, aylikGelir: sehirYapiGeliri(durum, s), insaat,
        secenekler: YAPI_TURLERI.map((yapi) => {
          const dog = emirDogrula(durum, { tur: "insaat", sehir: indeks, yapi }, baglam);
          return {
            yapi, ad: YAPI_ADLARI[yapi], seviye: yapiSeviyesi(s, yapi), enYuksek: yapiEnYuksek(durum, s.devlet, yapi),
            maliyet: insaatMaliyeti(durum, s, yapi), sure: insaatSuresi(durum, s.devlet, yapi),
            gelirArtisi: yapi === "sur" ? 0 : yapi === "pazar" ? pazarGeliriSeviyeBasina(durum, s.devlet) : DENGE.YAPI_AYLIK_GELIR[yapi],
            uygun: dog.gecerli, neden: dog.gecerli ? null : dog.neden,
          };
        }),
      }];
    }),
    hukumdar: hukumdarOzeti(durum, o.hukumdar),
    verasetSecimi: durum.verasetSecimi && { onceki: durum.verasetSecimi.onceki, veraset: VERASET_ADLARI[o.veraset],
      adaylar: durum.verasetSecimi.adaylar.map((a) => ({ ...hukumdarOzeti(durum, a)!, tarihi: a.tarihi, gelenek: a.gelenek })) },
    veraset: VERASET_ADLARI[o.veraset], tarihiHalef: o.tarihiHalef?.ad ?? null,
    teknoloji: {
      yuva: DENGE.ARASTIRMA_YUVASI,
      kartlar: TEKNOLOJILER.map((t) => {
        const oyuncu = durum.ayarlar.oyuncu;
        const suren = durum.arastirmalar.find((a) => a.devlet === oyuncu && a.teknoloji === t.id);
        const emir = durum.emirKuyrugu.some((e) => e.tur === "arastir" && e.teknoloji === t.id);
        const dog = emirDogrula(durum, { tur: "arastir", teknoloji: t.id }, baglam);
        const durumu = biliyor(durum, oyuncu, t.id) ? "biliniyor" : suren ? "suruyor" : emir ? "emir" : dog.gecerli ? "acik" : "kapali";
        return { id: t.id, ad: t.ad, alan: t.alan, alanAdi: ALAN_ADLARI[t.alan], onKosul: t.onKosul.map((k) => teknolojiBul(k).ad),
          etki: t.etki, bedel: DENGE.TEKNOLOJI[t.id].bedel, sure: DENGE.TEKNOLOJI[t.id].sure, durum: durumu,
          kalanGun: suren ? suren.kalanGun : emir ? DENGE.TEKNOLOJI[t.id].sure : null,
          uygun: dog.gecerli, neden: dog.gecerli ? null : dog.neden } as const;
      }),
    },
    diplomasi: (() => {
      const on = diplomasiOnHesap(durum, baglam.ag), p = durum.ayarlar.oyuncu;
      return durum.devletler.map((_, i) => {
        if (i === p) return null;
        const bekleyen = durum.emirKuyrugu.find((e) => (e.tur === "ittifakTeklif" || e.tur === "ittifakBoz") && e.hedef === i);
        return {
          hukumdar: hukumdarOzeti(durum, durum.devletler[i].hukumdar),
          bakisi: iliski(durum, on, i, p), bakisimiz: iliski(durum, on, p, i), bilesenler: iliskiBilesenleri(durum, on, i, p),
          muttefik: muttefik(durum, p, i), muttefikleri: muttefikleri(durum, i), savasta: savasta(durum, p, i), komsu: komsuMu(on, p, i),
          ittifak: ittifakDegerlendir(durum, on, p, i), hediyePuanBedeli: hediyePuanBedeli(durum, i, on),
          hediyeKalan: Math.max(0, DENGE.HEDIYE_EN_COK - etkiDegeri(durum, p, i, "hediye")),
          bekleyen: bekleyen && (bekleyen.tur === "ittifakTeklif" || bekleyen.tur === "ittifakBoz") ? bekleyen.tur : null,
        };
      });
    })(),
    saldirganlik: durum.saldirganlik[durum.ayarlar.oyuncu],
    barisTeklifleri: durum.barisTeklifleri.map((t) => {
      const c = durum.emirKuyrugu.find((e) => e.tur === "barisCevap" && e.teklif === t.id);
      return { id: t.id, devlet: t.teklifEden, gerekce: t.gerekce, size: t.alan === durum.ayarlar.oyuncu,
        birimler: t.talep.birimler, sehirler: t.talep.sehirler, kalanGun: DENGE.BARIS_TEKLIF_GUN - (durum.gun - t.gun),
        cevap: c && c.tur === "barisCevap" ? c.kabul : null };
    }),
    toplamaKurali: { bedelYuzde: toplamaBedelYuzde(durum, durum.ayarlar.oyuncu), gun: toplamaSuresi(durum, durum.ayarlar.oyuncu) },
    askerSehirleri: durum.sehirler.flatMap((s, indeks) => s.devlet !== durum.ayarlar.oyuncu ? [] : [{
      indeks, ad: s.ad, insanGucu: kullanilabilirInsanGucu(durum, indeks),
      uygun: s.kontrol === s.devlet && !!baglam.ag?.dugumler[s.dugum]
        && durum.birimler[baglam.ag!.dugumler[s.dugum].b]?.kontrol === s.devlet,
    }]),
    toplamalar: [
      ...durum.askerToplamalar.filter((t) => t.devlet === durum.ayarlar.oyuncu).map((t) => {
        const s = durum.sehirler[t.sehir];
        const n = baglam.ag?.dugumler[s.dugum];
        return { sehir: s.ad, asker: t.asker, kalanGun: t.kalanGun,
          bekliyor: !n || s.kontrol !== t.devlet || durum.birimler[n.b]?.kontrol !== t.devlet, emir: false };
      }),
      ...durum.emirKuyrugu.flatMap((e) => e.tur !== "askerTopla" ? [] : [{ sehir: durum.sehirler[e.sehir].ad,
        asker: e.asker, kalanGun: toplamaSuresi(durum, durum.ayarlar.oyuncu), bekliyor: false, emir: true }]),
    ],
    planliKesinti: durum.planliKesintiler.map((k) => ({ tarih: tarihMetni(k.gun), neden: k.neden })),
    hash: durumOzeti(durum),
    ordular: durum.ordular.filter((o) => o.devlet === durum.ayarlar.oyuncu).map((o) => {
      const k = orduKonumu(o);
      const kalan = kalanYol(o);
      const ikmal = ikmalDurumu(durum, baglam.ag, o);
      return {
        id: o.id, ad: o.ad, devlet: o.devlet, asker: o.asker, x: k.x, y: k.y,
        yuruyor: o.rota.length > 0,
        rota: o.rota.map((a) => [a.x, a.y] as [number, number]),
        kalanGun: o.rota.length ? kalan.gun : 0,
        varisTarihi: o.rota.length ? tarihMetni(durum.gun + kalan.gun) : null,
        moral: o.moral, tutum: o.tutum, muharebede: o.muharebe !== null, cekiliyor: o.cekiliyor,
        ikmal: ikmal.deger, ikmalNedeni: ikmal.neden, maas: aylikMaas(o.asker), maasAksiyor: durum.devletler[o.devlet].hazine < 0,
        bolunebilir: emirDogrula(durum, { tur: "orduBol", ordu: o.id, asker: 1 }, baglam).gecerli,
        birlesebilir: durum.ordular.filter((a) => a.id !== o.id && emirDogrula(durum,
          { tur: "orduBirlestir", ordu: o.id, diger: a.id }, baglam).gecerli).map((a) => a.id),
        kusatma: orduKusatmasi(durum, o.id)?.sehir ?? null,
        kusatmaEmriBekliyor: durum.emirKuyrugu.some((e) => (e.tur === "kusat" || e.tur === "kusatmaBirak") && e.ordu === o.id),
        kusatilabilir: durum.sehirler.flatMap((_, sehir) => emirDogrula(durum,
          { tur: "kusat", ordu: o.id, sehir, yontem: "abluka" }, baglam).gecerli ? [sehir] : []),
      };
    }),
    // Yabancı ordular yalnızca görünürlük kuralıyla süzülerek ve yaklaşık büyüklükle gönderilir (DEC-0027/2)
    yabanciOrdular: baglam.ag ? gorunurYabanciOrdular(durum, baglam.ag, durum.ayarlar.oyuncu)
      .map((y) => ({ ...y, ...orduKonumu(durum.ordular.find((o) => o.id === y.id)!) })) : [],
    savaslar: durum.savaslar.filter((s) => s.saldiran === durum.ayarlar.oyuncu || s.savunan === durum.ayarlar.oyuncu)
      .map((s) => {
        const oyuncu = durum.ayarlar.oyuncu, karsi = s.saldiran === oyuncu ? s.savunan : s.saldiran;
        return { id: s.id, karsi, baslangic: tarihMetni(s.baslangic), saldiran: s.saldiran === oyuncu,
          ...savasSkoru(durum, oyuncu, karsi),
          birimler: durum.birimler.flatMap((b, i) => b.sahip === karsi && b.kontrol === oyuncu ? [i] : []),
          sehirler: durum.sehirler.flatMap((c, i) => c.devlet === karsi && c.kontrol === oyuncu ? [i] : []),
        };
      }),
    kusatmalar: durum.kusatmalar.filter((k) => [k.devlet, k.savunan].includes(durum.ayarlar.oyuncu)).map((k) => ({
      sehir: k.sehir, devlet: k.devlet, savunan: k.savunan, yontem: k.yontem, gun: k.gun,
      erzak: k.devlet === durum.ayarlar.oyuncu ? Math.ceil(k.erzak / 100) * 100 : k.erzak,
      gucYeterli: k.devlet === durum.ayarlar.oyuncu ? kusatmaGucu(durum, k).yeterli : null,
    })),
    sehirDurumlari: durum.sehirler.map((s) => ({ devlet: s.devlet, kontrol: s.kontrol, baskent: s.baskent, sur: s.sur,
      garnizon: s.kontrol === durum.ayarlar.oyuncu ? s.garnizon : Math.ceil(s.garnizon / 1000) * 1000,
      garnizonTahmin: s.kontrol !== durum.ayarlar.oyuncu })),
    birimSahipleri: durum.birimler.map((b) => b.sahip),
    isgalHazirliklari: durum.isgalHazirliklari.filter((p) => p.devlet === durum.ayarlar.oyuncu).map((p) => ({ birim: p.birim, gun: p.gun })),
    barislar: durum.barislar.filter((p) => p.devlet === durum.ayarlar.oyuncu || p.karsi === durum.ayarlar.oyuncu),
    raporlar: durum.muharebeRaporlari.filter((r) => r.taraflar.some((t) => t.devlet === durum.ayarlar.oyuncu)).slice(-10),
    birimIsgal: durum.birimler.flatMap((b, i) => (b.kontrol !== b.sahip ? [[i, b.kontrol, b.isgalBaslangic ?? durum.gun]] : [])) as [number, number, number][],
    sehirIsgal: durum.sehirler.flatMap((s, i) => (s.kontrol !== s.devlet ? [[i, s.kontrol, s.isgalBaslangic ?? durum.gun]] : [])) as [number, number, number][],
  };
}

function isle(i: Istek): Yanit {
  switch (i.tip) {
    case "barisOnizle": {
      if (!d) return { id: i.id, tamam: false, hata: "Oyun başlatılmadı." };
      const s = d.savaslar.find((v) => v.id === i.talep.savas);
      const karsi = s ? (s.saldiran === d.ayarlar.oyuncu ? s.savunan : s.saldiran) : -1;
      return { id: i.id, tamam: true, ozet: ozet(d), baris: {
        puan: karsi >= 0 ? barisBedeli(d, d.ayarlar.oyuncu, karsi, i.talep) : 0,
        skor: karsi >= 0 ? savasSkoru(d, d.ayarlar.oyuncu, karsi).skor : 0,
        dogrulama: barisDogrula(d, i.talep),
      } };
    }
    case "yeniOyun":
      baglam = { ag: i.senaryo.ag ? agHazirla(i.senaryo.ag) : null,
        sehirKonumlari: i.senaryo.sehirler.map((s) => ({
          x: s.x ?? i.senaryo.ag?.dugumler[s.dugum ?? -1]?.x ?? 0,
          y: s.y ?? i.senaryo.ag?.dugumler[s.dugum ?? -1]?.y ?? 0,
        })) };
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
