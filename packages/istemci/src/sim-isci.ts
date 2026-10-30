// Simülasyon Web Worker'ı (DEC-0023). Dünya durumu yalnızca burada tutulur ve değiştirilir;
// ana iş parçacığı yalnızca özet alır, böylece uzun turlar haritayı dondurmaz.

import {
  agHazirla, baslangicDurumu, durumOzeti, emirVer, gorunurYabanciOrdular, kalanYol, kaydet, orduKonumu, orduRotasi,
  tarihMetni, turSuresiAyarla, turuIlerlet, yukle, TUR_SURESI_ADLARI, type Baglam, type DunyaDurumu,
  kompozisyonMaasi, devletMaasi, emirDogrula, ikmalDurumu, kullanilabilirHazine, kullanilabilirInsanGucu, DENGE,
  barisBedeli, barisDevirOzeti, barisDogrula, kusatmaGucu, orduKusatmasi, savasSkoru,
  butceOzeti, insaatMaliyeti, insaatSuresi, sehirYapiGeliri, yapiSeviyesi, yapiEnYuksek, pazarGeliriSeviyeBasina, YAPI_ADLARI, YAPI_TURLERI,
  diplomasiOnHesap, etkiDegeri, hediyePuanBedeli, iliski, iliskiBilesenleri, ittifakDegerlendir, komsuMu, muttefik, muttefikleri, savasta,
  ticaretAnlasmasiVar, ticaretDegerlendir, saldirmazlikVar, saldirmazlikDegerlendir, efendisi,
  asayisAskeri, gerekenAsayis,
  hukumdarYasi, VERASET_ADLARI, yerelYonetimAyarla, bolgeKontrolu, gorunurDonanmalar, kapasite, sehirMenzilinde, sehirTicareti, type Hukumdar,
  ALAN_ADLARI, TEKNOLOJILER, teknolojiBul, biliyor, toplamaBedelYuzde, toplamaSuresi, etkiCarpani,
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
          durdu: s.istikrar.ayaklanma || durum.kusatmalar.some((k) => k.sehir === indeks) }
        : emir && emir.tur === "insaat"
          ? { yapi: emir.yapi, ad: YAPI_ADLARI[emir.yapi], hedef: yapiSeviyesi(s, emir.yapi) + 1, kalanGun: insaatSuresi(durum, s.devlet, emir.yapi), emir: true, durdu: false }
          : null;
      return [{
        indeks, ad: s.ad, aylikGelir: sehirYapiGeliri(durum, s), yonetici: s.yonetici, insaat,
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
    din: o.din, kultur: o.kultur,
    istikrar: durum.sehirler.map((s, sehir) => {
      const kendi = s.devlet === durum.ayarlar.oyuncu;
      const dog = kendi ? emirDogrula(durum, { tur: "bagis", sehir }, baglam) : { gecerli: false as const, neden: "Yabancı şehir." };
      return { ...s.istikrar, asayis: kendi ? asayisAskeri(durum, sehir) : 0, gerekenAsker: gerekenAsayis(s),
        bagisUygun: dog.gecerli, bagisNedeni: dog.gecerli ? null : dog.neden };
    }),
    sehirNufuslari: durum.sehirler.map((s) => ({ nufus: s.nufus, gruplar: s.gruplar.map((g) => [g.din, g.kultur, g.nufus] as [string, string, number]) })),
    devletDinleri: durum.devletler.map((v) => v.din),
    yerelYonetim: { ...durum.yerelYonetim },
    denizBolgeleri: durum.deniz.bolgeler.map((b, i) => ({ ad: b.ad, kontrol: bolgeKontrolu(durum, i), komsu: b.komsu })),
    limanlar: durum.deniz.limanlar,
    donanmalar: durum.donanmalar.filter((f) => f.devlet === durum.ayarlar.oyuncu).map((f) => ({
      id: f.id, ad: f.ad, bolge: f.bolge, kadirga: f.kadirga, kalyon: f.kalyon, moral: f.moral, rota: f.rota, kalanGun: f.kalanGun,
      kapasite: kapasite(f), yuk: f.yuk && { ad: f.yuk.ad, asker: f.yuk.asker }, cikarmaHedef: f.cikarmaHedef,
      emirBekliyor: durum.emirKuyrugu.some((e) => "donanma" in e && e.donanma === f.id),
      binebilir: durum.ordular.filter((o) => o.devlet === f.devlet && durum.sehirler.some((c, i) => durum.deniz.limanlar[i] === f.bolge
        && c.kontrol === f.devlet && sehirMenzilinde(durum, baglam, o, i))).map((o) => ({ id: o.id, ad: o.ad, asker: o.asker })),
    })),
    yabanciDonanmalar: gorunurDonanmalar(durum, durum.ayarlar.oyuncu),
    ticaret: durum.sehirler.map((s, i) => (s.devlet === durum.ayarlar.oyuncu && durum.deniz.limanlar[i] >= 0 ? sehirTicareti(durum, i) : null)),
    ambargolarim: durum.ambargolar.filter((a) => a.devlet === durum.ayarlar.oyuncu).map((a) => a.hedef),
    bizeAmbargo: durum.ambargolar.filter((a) => a.hedef === durum.ayarlar.oyuncu).map((a) => a.devlet),
    casusGorevleri: [
      ...durum.casusGorevleri.filter((g) => g.devlet === durum.ayarlar.oyuncu).map((g) => ({ hedef: g.hedef, tur: g.tur, ad: DENGE.CASUS[g.tur].ad, sehir: g.sehir, kalanGun: g.kalanGun, emir: false })),
      ...durum.emirKuyrugu.flatMap((e) => (e.tur === "casusluk" ? [{ hedef: e.hedef, tur: e.gorev, ad: DENGE.CASUS[e.gorev].ad, sehir: e.sehir, kalanGun: DENGE.CASUS[e.gorev].hazirlik, emir: true }] : [])),
    ],
    istihbarat: durum.casusEtkileri.filter((e) => e.devlet === durum.ayarlar.oyuncu && e.tur !== "isyan").map((e) => ({ hedef: e.hedef, tur: e.tur, kalanGun: e.bitis - durum.gun })),
    diplomatikRapor: (() => {
      const r: Ozet["diplomatikRapor"] = {}, p = durum.ayarlar.oyuncu, on = diplomasiOnHesap(durum, baglam.ag);
      for (const e of durum.casusEtkileri) {
        if (e.devlet !== p || e.tur !== "diplomatik" || e.bitis <= durum.gun || r[e.hedef]) continue;
        const h = e.hedef, bakis = durum.devletler.flatMap((_, k) => (k === h || !durum.birimler.some((b) => b.sahip === k) ? [] : [[k, iliski(durum, on, h, k)] as [number, number]]));
        bakis.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
        // Yanlış bilgi (TASK-0018, 3/3): oyuncu bunu bilemez; gösterilen hazine çarpıtılmış olabilir.
        const carpan = etkiCarpani(e);
        r[h] = { muttefikleri: muttefikleri(durum, h), savaslari: durum.savaslar.flatMap((s) => (s.saldiran === h ? [s.savunan] : s.savunan === h ? [s.saldiran] : [])),
          enKotu: bakis.slice(0, 3), enIyi: bakis.slice(-3).reverse(), hazine: Math.round((durum.devletler[h].hazine * carpan) / 1000 / 100) * 100 };
      }
      return r;
    })(),
    gemiInsalari: [
      ...durum.gemiInsalari.filter((g) => g.devlet === durum.ayarlar.oyuncu).map((g) => ({ sehir: g.sehir, gemi: g.gemi, adet: g.adet, kalanGun: g.kalanGun, emir: false })),
      ...durum.emirKuyrugu.flatMap((e) => (e.tur === "gemiInsa" ? [{ sehir: e.sehir, gemi: e.gemi, adet: e.adet, kalanGun: DENGE.GEMI[e.gemi].sure, emir: true }] : [])),
    ],
    devletKulturleri: durum.devletler.map((v) => v.kultur),
    iskanlar: [
      ...durum.iskanlar.filter((k) => k.devlet === durum.ayarlar.oyuncu).map((k) => ({ kaynak: k.kaynak, hedef: k.hedef,
        miktar: k.gruplar.reduce((t, g) => t + g.nufus, 0), kalanGun: k.kalanGun, emir: false })),
      ...durum.emirKuyrugu.flatMap((e) => (e.tur === "iskan" ? [{ kaynak: e.kaynak, hedef: e.hedef, miktar: e.miktar, kalanGun: DENGE.ISKAN_GUN, emir: true }] : [])),
    ],
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
        const bekleyenTurler = ["ittifakTeklif", "ittifakBoz", "ticaretTeklif", "ticaretBoz", "saldirmazlikTeklif", "vasalSerbestBirak"] as const;
        const bekleyen = durum.emirKuyrugu.find((e) => (bekleyenTurler as readonly string[]).includes(e.tur) && "hedef" in e && e.hedef === i);
        return {
          hukumdar: hukumdarOzeti(durum, durum.devletler[i].hukumdar),
          bakisi: iliski(durum, on, i, p), bakisimiz: iliski(durum, on, p, i), bilesenler: iliskiBilesenleri(durum, on, i, p),
          muttefik: muttefik(durum, p, i), muttefikleri: muttefikleri(durum, i), savasta: savasta(durum, p, i), komsu: komsuMu(on, p, i),
          ittifak: ittifakDegerlendir(durum, on, p, i), hediyePuanBedeli: hediyePuanBedeli(durum, i, on),
          hediyeKalan: Math.max(0, DENGE.HEDIYE_EN_COK - etkiDegeri(durum, p, i, "hediye")),
          ticaretVar: ticaretAnlasmasiVar(durum, p, i), ticaret: ticaretDegerlendir(durum, on, p, i),
          saldirmazlikVar: saldirmazlikVar(durum, p, i), saldirmazlik: saldirmazlikDegerlendir(durum, on, p, i),
          vasalim: efendisi(durum, i) === p, onunEfendisi: efendisi(durum, i),
          bekleyen: bekleyen && (bekleyenTurler as readonly string[]).includes(bekleyen.tur) ? (bekleyen.tur as typeof bekleyenTurler[number]) : null,
        };
      });
    })(),
    saldirganlik: durum.saldirganlik[durum.ayarlar.oyuncu],
    efendim: efendisi(durum, durum.ayarlar.oyuncu),
    barisTeklifleri: durum.barisTeklifleri.map((t) => {
      const c = durum.emirKuyrugu.find((e) => e.tur === "barisCevap" && e.teklif === t.id);
      return { id: t.id, devlet: t.teklifEden, gerekce: t.gerekce, size: t.alan === durum.ayarlar.oyuncu,
        birimler: t.talep.birimler, sehirler: t.talep.sehirler, kalanGun: DENGE.BARIS_TEKLIF_GUN - (durum.gun - t.gun),
        cevap: c && c.tur === "barisCevap" ? c.kabul : null };
    }),
    toplamaKurali: { bedelYuzde: toplamaBedelYuzde(durum, durum.ayarlar.oyuncu), gun: toplamaSuresi(durum, durum.ayarlar.oyuncu) },
    askerSehirleri: durum.sehirler.flatMap((s, indeks) => s.devlet !== durum.ayarlar.oyuncu ? [] : [{
      indeks, ad: s.ad, insanGucu: kullanilabilirInsanGucu(durum, indeks),
      ayaklanma: s.istikrar.ayaklanma, uygun: !s.istikrar.ayaklanma && s.kontrol === s.devlet && !!baglam.ag?.dugumler[s.dugum]
        && durum.birimler[baglam.ag!.dugumler[s.dugum].b]?.kontrol === s.devlet,
    }]),
    toplamalar: [
      ...durum.askerToplamalar.filter((t) => t.devlet === durum.ayarlar.oyuncu).map((t) => {
        const s = durum.sehirler[t.sehir];
        const n = baglam.ag?.dugumler[s.dugum];
        return { id: t.id, sehir: s.ad, asker: t.asker, birim: t.birim, kalanGun: t.kalanGun,
          bekliyor: s.istikrar.ayaklanma || !n || s.kontrol !== t.devlet || durum.birimler[n.b]?.kontrol !== t.devlet, emir: false };
      }),
      ...durum.emirKuyrugu.flatMap((e) => e.tur !== "askerTopla" ? [] : [{ id: null, sehir: durum.sehirler[e.sehir].ad,
        asker: e.asker, birim: e.birim ?? "piyade", kalanGun: toplamaSuresi(durum, durum.ayarlar.oyuncu), bekliyor: false, emir: true }]),
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
        ikmal: ikmal.deger, ikmalNedeni: ikmal.neden, maas: kompozisyonMaasi(o.kompozisyon), maasAksiyor: durum.devletler[o.devlet].hazine < 0,
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

// Tur hesaplanırken hata olursa dünya yarım kalmış olabilir (10b): yalnızca yeni oyun ya da kayıt yüklemeye izin verilir
let bozuk = false;

function isle(i: Istek): Yanit {
  if (bozuk && i.tip !== "yeniOyun" && i.tip !== "yukle") {
    return { id: i.id, tamam: false, hata: "Simülasyon bir hatadan sonra güvenilir değil; son otomatik kayda dönün." };
  }
  if (i.tip === "yeniOyun" || i.tip === "yukle") bozuk = false;
  if (i.tip === "testSimHatasi") { bozuk = true; throw new Error("Test: simülasyon tur ortasında durdu (geliştirici denemesi)"); }
  switch (i.tip) {
    case "barisOnizle": {
      if (!d) return { id: i.id, tamam: false, hata: "Oyun başlatılmadı." };
      const s = d.savaslar.find((v) => v.id === i.talep.savas);
      const karsi = s ? (s.saldiran === d.ayarlar.oyuncu ? s.savunan : s.saldiran) : -1;
      return { id: i.id, tamam: true, ozet: ozet(d), baris: {
        puan: karsi >= 0 ? barisBedeli(d, d.ayarlar.oyuncu, karsi, i.talep) : 0,
        skor: karsi >= 0 ? savasSkoru(d, d.ayarlar.oyuncu, karsi).skor : 0,
        dogrulama: barisDogrula(d, i.talep),
        devir: karsi >= 0 ? barisDevirOzeti(d, karsi, i.talep) : null,
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
    case "yonetim": {
      const dogrulama = yerelYonetimAyarla(d, i);
      return { id: i.id, tamam: true, ozet: ozet(d), dogrulama };
    }
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
    if (e.data.tip === "turuIlerlet") bozuk = true;
    y = { id: e.data.id, tamam: false, hata: hata instanceof Error ? hata.message : String(hata),
      yigin: hata instanceof Error ? hata.stack : undefined, bozuk };
  }
  self.postMessage(y);
};
