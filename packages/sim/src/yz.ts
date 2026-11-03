// TASK-0009/6b: AI devletlerinin ekonomi ve ordu hazırlığı kararları (MASTER_SPEC §16, DEC-0039).
// AI oyuncuyla aynı emirleri aynı doğrulamadan geçirerek uygular; gizli avantajı yoktur.
// Yalnızca kendi bütçesini ve herkesin görebildiği bilgiyi (sınırlar, ilişkiler, savaşlar) kullanır;
// yabancı orduların gerçek sayısına bakmaz (AT-013). Sayılar denge.ts'te [TASLAK].

import { olayEkle, type DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import { BOS_BAGLAM, emirDogrula, emirUygula, sehirToplamaYuzde, type Baglam, type Emir } from "./emirler";
import { prototipGelirleri } from "./ekonomi";
import { devletMaasi, toplamaMaliyeti, toplamAskerSayisi } from "./ordu";
import { aralik } from "./rastgele";
import { diplomasiOnHesap, iliski, komsuMu, type DiplomasiOnHesap } from "./diplomasi";
import { arastirmaEngeli, biliyor, TEKNOLOJILER, yapiEnYuksek, type Alan } from "./teknoloji";
import { tumOrdular, UZMANLIKLAR } from "./komutan";
import { insaatMaliyeti, sehirdeInsaatVar } from "./yatirim";
import { gundenTarih } from "./takvim";
import { barisKararlari, savasKarari } from "./yz-savas";
import { diplomatikTeklifKarari, yzDiplomatikBaglar } from "./yz-diplomasi";
import { aylikMaasYuzde, toplamaMaliyetiYuzde, type BirimTuru } from "./birim";
import { yapiSeviyeGeliri } from "./yatirim";
import { yzButceToparla } from "./askeri-yonetim";
import { KAYNAKLAR, kaynakFiyati, satilabilirKaynak } from "./kaynak";

/** Tehdit nedeni (herkesin bildiği bilgilerden) ya da null. */
export function tehditNedeni(d: DunyaDurumu, on: DiplomasiOnHesap, devlet: number): string | null {
  const savas = d.savaslar.find((s) => s.saldiran === devlet || s.savunan === devlet);
  if (savas) return `${d.devletler[savas.saldiran === devlet ? savas.savunan : savas.saldiran].ad} ile savaşta`;
  for (let k = 0; k < on.n; k++) {
    if (k === devlet || !komsuMu(on, devlet, k) || on.arazi[k] <= on.arazi[devlet]) continue;
    if (iliski(d, on, devlet, k) <= DENGE.YZ_DUSMANCA_ESIK) return `düşmanca büyük komşu: ${d.devletler[k].ad}`;
  }
  return null;
}

/** Bir AI devletinin aylık kararı: yedeği koru, kalanı tehdide göre asker, araştırma ve yatırıma ayır. */
export function devletKarari(d: DunyaDurumu, b: Baglam, on: DiplomasiOnHesap, devlet: number, gelirler = prototipGelirleri(d)): void {
  yzButceToparla(d, b, devlet, gelirler[devlet]);
  // Bütçeden yalnızca maaş, net ve asker sayısı gerekir; gelirler günde bir kez hesaplanır (1300 şehirde belirgin hızlı)
  const aylikMaas = devletMaasi(d, devlet);
  const butce = { aylikMaas, aylikNet: gelirler[devlet] - aylikMaas, askerSayisi: toplamAskerSayisi(d, devlet) };
  const yedek = Math.max(DENGE.YZ_YEDEK_EN_AZ, DENGE.YZ_YEDEK_AY * butce.aylikMaas);
  const para = () => d.devletler[devlet].hazine - yedek;
  const dene = (e: Emir) => {
    if (!emirDogrula(d, e, b, true).gecerli) return false;
    emirUygula(d, e, b);
    return true;
  };
  // Kaynak kıtlığında yalnız anlaşmalı, açık yoldan ve gerçek bütçeyle alım; kaynak yaratılmaz.
  for (const kaynak of KAYNAKLAR) {
    const eksik = DENGE.YZ_KAYNAK_HEDEF - d.devletler[devlet].kaynaklar[kaynak];
    if (eksik <= 0 || para() <= 0) continue;
    for (let hedef = 0; hedef < d.devletler.length; hedef++) {
      if (hedef === devlet) continue;
      const miktar = Math.min(eksik, satilabilirKaynak(d, hedef, kaynak), Math.floor(para() / kaynakFiyati(d, hedef, kaynak)));
      if (miktar > 0 && dene({ tur: "kaynakAl", devlet, hedef, kaynak, miktar })) break;
    }
  }
  // 6c: önce süren savaşların barışı, sonra yeni savaş kararı (tehdit hesabı ilanı da görür)
  barisKararlari(d, b, devlet);
  savasKarari(d, b, on, devlet);
  diplomatikTeklifKarari(d, on, devlet); // TASK-0020 (1/3): oyuncuya ittifak/ticaret/saldırmazlık teklifi
  yzDiplomatikBaglar(d, on, devlet);
  // 8c: savaştaki AI ara sıra düşmanına askerî istihbarat görevi açar (aynı kurallar, aynı bedel)
  const dusmanSavasi = d.savaslar.find((s) => s.saldiran === devlet || s.savunan === devlet);
  if (dusmanSavasi && DENGE.CASUS.askeri.bedel <= para() && aralik(d, 100) < DENGE.YZ_CASUS_OLASILIK) {
    dene({ tur: "casusluk", hedef: dusmanSavasi.saldiran === devlet ? dusmanSavasi.savunan : dusmanSavasi.saldiran, gorev: "askeri", sehir: null, devlet });
  }
  const tehdit = tehditNedeni(d, on, devlet);
  const sehirler = d.sehirler.flatMap((s, i) => (s.devlet === devlet && s.kontrol === devlet ? [i] : []));
  // TASK-0035: hazinesi çok aylık geliri aşan AI biriktirmek yerine ordu ve sur yapar
  const zengin = para() > DENGE.YZ_ZENGIN_AY * Math.max(DENGE.YZ_YEDEK_EN_AZ, gelirler[devlet]);

  const riskli = [...sehirler].sort((a, c) => d.sehirler[c].istikrar.risk - d.sehirler[a].istikrar.risk || a - c)
    .find((i) => d.sehirler[i].istikrar.risk >= DENGE.IST_HUZURSUZLUK && d.sehirler[i].istikrar.bagis === 0);
  if (riskli !== undefined && para() >= DENGE.IST_BAGIS_BEDEL) dene({ tur: "bagis", sehir: riskli, devlet });

  const asker = () => {
    const bekleyen = d.askerToplamalar.filter((t) => t.devlet === devlet).reduce((t, x) => t + x.asker, 0);
    const hedef = on.arazi[devlet] * DENGE.YZ_ASKER_ARAZI_BASINA * (tehdit ? DENGE.YZ_TEHDIT_ASKER_CARPANI : 1)
      * (zengin ? DENGE.YZ_ZENGIN_ASKER_YUZDE : 100) / 100;
    const eksik = hedef - butce.askerSayisi - bekleyen;
    if (eksik < DENGE.YZ_TOPLAMA_EN_AZ || para() <= 0) return false; // zar atmadan erken çık (gereksiz rastgele tüketimi yok)
    const sehir = [...sehirler].sort((x, y) => d.sehirler[y].insanGucu - d.sehirler[x].insanGucu || x - y)[0];
    if (sehir === undefined) return false;
    const maasPayi = Math.max(0, butce.aylikNet) * (tehdit || zengin ? 100 : DENGE.YZ_MAAS_NET_YUZDE) / 100;
    // TASK-0021 (3/4): tehdit altında süvari ağırlıklı, barışta ucuz okçu ağırlıklı, aksi halde piyade.
    // TASK-0047: Sahra Mühendisliği bilinip topçu payı hedefin altındaysa topçu (demir/kereste kaynak doğrulamasından geçer)
    const benimOrdular = d.ordular.filter((o) => o.devlet === devlet);
    const topcu = benimOrdular.reduce((t, o) => t + o.kompozisyon.topcu, 0);
    const topcuEksik = biliyor(d, devlet, "muhendislik") && topcu * 100 < butce.askerSayisi * DENGE.YZ_TOPCU_HEDEF_YUZDE;
    const birim: BirimTuru = topcuEksik ? "topcu" : tehdit ? "suvari" : aralik(d, 10) < DENGE.YZ_OKCU_OLASILIK ? "okcu" : "piyade";
    const maasSiniri = Math.floor((maasPayi * 100000) / (DENGE.AYLIK_ASKER_MAASI_BINDE * aylikMaasYuzde(birim)));
    const yuzde = sehirToplamaYuzde(d, sehir, birim); // TASK-0028: şehrin gelir kaynağı
    const paraSiniri = Math.floor((Math.max(0, para()) * 10000000) / (DENGE.TOPLAMA_ASKER_BASINA_MALIYET_BINDE * yuzde * toplamaMaliyetiYuzde(birim)));
    const n = Math.min(eksik, maasSiniri, paraSiniri, d.sehirler[sehir].insanGucu);
    if (n < DENGE.YZ_TOPLAMA_EN_AZ || toplamaMaliyeti(n, yuzde, birim) > para()) return false;
    if (!dene({ tur: "askerTopla", sehir, asker: n, devlet, birim })) return false;
    d.yzSayac.asker += n;
    return true;
  };
  const sur = () => {
    // Başkent; zenginse en kalabalık şehirler de (TASK-0035)
    const baskent = d.devletler[devlet].baskent;
    const adaylar = [baskent, ...(zengin ? [...sehirler].sort((a, c) => d.sehirler[c].nufus - d.sehirler[a].nufus || a - c).slice(0, DENGE.YZ_ZENGIN_SUR_SEHIR) : [])];
    for (const i of adaylar) {
      if (i === null || !sehirler.includes(i) || sehirdeInsaatVar(d, i, true)) continue;
      const s = d.sehirler[i];
      const bedel = insaatMaliyeti(d, s, "sur");
      if (bedel === null || s.sur >= yapiEnYuksek(d, devlet, "sur") || bedel > para()) continue;
      if (!dene({ tur: "insaat", sehir: i, yapi: "sur", devlet })) continue;
      d.yzSayac.insaat++;
      return true;
    }
    return false;
  };
  const arastir = (tercih: Alan | null) => {
    const uygun = TEKNOLOJILER.filter((t) => DENGE.TEKNOLOJI[t.id].bedel <= para() && arastirmaEngeli(d, devlet, t.id, true) === null);
    const secenek = tercih && uygun.some((t) => t.alan === tercih) ? uygun.filter((t) => t.alan === tercih) : uygun;
    if (!secenek.length) return false;
    const t = secenek[aralik(d, secenek.length)];
    if (!dene({ tur: "arastir", teknoloji: t.id, devlet })) return false;
    d.yzSayac.arastirma++;
    return true;
  };
  const yatirim = () => {
    // Bedel başına en çok gelir getiren tarla/pazar (eşitlikte küçük şehir indeksi)
    let en: { sehir: number; yapi: "tarla" | "pazar" | "atolye"; oran: number; bedel: number } | null = null;
    for (const i of sehirler) {
      if (sehirdeInsaatVar(d, i, true)) continue;
      for (const yapi of ["tarla", "pazar", "atolye"] as const) {
        const bedel = insaatMaliyeti(d, d.sehirler[i], yapi);
        if (bedel === null || bedel > para()) continue;
        if (!emirDogrula(d, { tur: "insaat", sehir: i, yapi, devlet }, b, true).gecerli) continue;
        const gelir = yapiSeviyeGeliri(d, d.sehirler[i], yapi); // TASK-0032: gerçek (nüfusa ölçekli) getiri
        if (gelir * (zengin ? DENGE.YZ_ZENGIN_GERI_DONUS_AY : DENGE.YZ_YATIRIM_GERI_DONUS_AY) < bedel) continue; // kendini geç ödeyen yatırım yapılmaz
        const oran = Math.floor((gelir * 100000) / bedel);
        if (!en || oran > en.oran) en = { sehir: i, yapi, oran, bedel };
      }
    }
    if (!en || !dene({ tur: "insaat", sehir: en.sehir, yapi: en.yapi, devlet })) return false;
    d.yzSayac.insaat++;
    return true;
  };

  // Tehdit altında önce savunma; barışta önce kalkınma. Her karar adımında en çok birer iş.
  // TASK-0049: zengin AI maliye danışmanı tutar; riskli ve bütünleşmemiş fetih şehrine hoşgörü, sakinleşince olağan
  const idare = () => {
    let yapti = false;
    for (const i of sehirler) {
      const c = d.sehirler[i];
      if (c.butunlesme >= 100) continue;
      const istenen = c.istikrar.risk >= DENGE.IST_HUZURSUZLUK ? "hosgoru" : "olagan";
      if (c.politika !== istenen && dene({ tur: "sehirPolitika", sehir: i, politika: istenen, devlet })) yapti = true;
    }
    if (zengin && !d.devletler[devlet].danismanlar.includes("maliye")) yapti = dene({ tur: "danismanAl", danisman: "maliye", devlet }) || yapti;
    return yapti;
  };
  // TASK-0048: zengin efendi, ilhak koşullarını sağlayan en sadık vasalını diplomatik yolla katar (aynı emir doğrulaması)
  const ilhak = () => {
    if (!zengin) return false;
    const v = d.vasalliklar.filter((x) => x.efendi === devlet && x.ilhakBitis === null && x.sadakat >= DENGE.VASAL_ILHAK_SADAKAT + 10)
      .sort((a, c) => c.sadakat - a.sadakat || a.vasal - c.vasal)[0];
    return v ? dene({ tur: "vasalIlhak", hedef: v.vasal, devlet }) : false;
  };
  // TASK-0047: tehdit altında ya da zenginken komutan yetiştirir; boştaki komutanı en büyük komutansız orduya atar
  const komutanlik = () => {
    const ordular = d.ordular.filter((o) => o.devlet === devlet && o.komutan === null && o.muharebe === null).sort((a, c) => c.asker - a.asker || a.id - c.id);
    if (!ordular.length) return false;
    const atanmis = new Set(tumOrdular(d).flatMap((o) => (o.komutan === null ? [] : [o.komutan])));
    const bos = d.komutanlar.find((k) => k.devlet === devlet && !atanmis.has(k.id));
    if (bos) return dene({ tur: "komutanAta", ordu: ordular[0].id, komutan: bos.id });
    if (!(tehdit || zengin) || DENGE.KOMUTAN_BEDEL * 3 > para()) return false;
    const uzmanlik = tehdit ? "savunma" : d.savaslar.some((s) => s.saldiran === devlet) ? "taarruz" : UZMANLIKLAR[aralik(d, UZMANLIKLAR.length)];
    return dene({ tur: "komutanYetistir", uzmanlik, devlet });
  };
  const sira = tehdit ? [asker, komutanlik, sur, () => arastir("askeri"), yatirim] : [() => arastir(null), yatirim, asker, komutanlik, ilhak, idare, ...(zengin ? [sur] : [])];
  for (const adim of sira) adim();
  if (para() > Math.max(DENGE.YZ_YEDEK_EN_AZ, aylikMaas * DENGE.YZ_EK_YAPI_YEDEK_AY)) {
    const merkez = d.devletler[devlet].baskent;
    if (merkez !== null && sehirler.includes(merkez) && !sehirdeInsaatVar(d, merkez, true)) {
      const yapi = tehdit ? "kisla" : "okul";
      if (d.sehirler[merkez].ekYapilar[yapi] < yapiEnYuksek(d, devlet, yapi)) dene({ tur: "insaat", sehir: merkez, yapi, devlet });
    }
  }
  // TASK-0037: zengin AI (ör. Ming) ayda tek iş yaptığı için para biriktiriyordu; zenginlik sürdükçe birkaç iş daha yapar
  const zenginEsik = DENGE.YZ_ZENGIN_AY * Math.max(DENGE.YZ_YEDEK_EN_AZ, gelirler[devlet]);
  for (let i = 1; !tehdit && zengin && i < DENGE.YZ_ZENGIN_ADIM && para() > zenginEsik; i++) if (![yatirim, asker, sur].some((f) => f())) break;
}

/** Günlük sistem: o gün sırası gelen AI devletleri karar verir. */
export function yzKararlari(d: DunyaDurumu, b: Baglam = BOS_BAGLAM): void {
  const sirada = d.devletler.flatMap((_, i) =>
    i !== d.ayarlar.oyuncu && (d.gun + i) % DENGE.YZ_KARAR_ARALIGI === 0
      && (d.birimler.some((x) => x.sahip === i) || d.sehirler.some((s) => s.devlet === i)) ? [i] : []);
  if (!sirada.length) return;
  const on = diplomasiOnHesap(d, b.ag), gelirler = prototipGelirleri(d);
  for (const i of sirada) devletKarari(d, b, on, i, gelirler);
}

/** Yıllık: oyuncuya dünyadaki AI faaliyetinin toplu özeti (tek tek devlet bilgisi sızdırılmaz). */
export function yzYillikOzet(d: DunyaDurumu): void {
  const s = d.yzSayac;
  if (s.insaat || s.arastirma || s.asker) {
    olayEkle(d, { tur: "dunya-ozeti", devlet: null,
      metin: `${gundenTarih(d.gun).yil - 1} yılında dünyada: ${s.insaat} yeni inşaat, ${s.arastirma} araştırma, ${s.asker} asker toplandı (diğer devletler).` });
  }
  d.yzSayac = { insaat: 0, arastirma: 0, asker: 0 };
}
