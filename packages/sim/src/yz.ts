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
import { arastirmaEngeli, TEKNOLOJILER, yapiEnYuksek, type Alan } from "./teknoloji";
import { insaatMaliyeti, sehirdeInsaatVar } from "./yatirim";
import { gundenTarih } from "./takvim";
import { barisKararlari, savasKarari } from "./yz-savas";
import { diplomatikTeklifKarari } from "./yz-diplomasi";
import { aylikMaasYuzde, toplamaMaliyetiYuzde, type BirimTuru } from "./birim";
import { yapiSeviyeGeliri } from "./yatirim";

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
  // 6c: önce süren savaşların barışı, sonra yeni savaş kararı (tehdit hesabı ilanı da görür)
  barisKararlari(d, b, devlet);
  savasKarari(d, b, on, devlet);
  diplomatikTeklifKarari(d, on, devlet); // TASK-0020 (1/3): oyuncuya ittifak/ticaret/saldırmazlık teklifi
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
    const birim: BirimTuru = tehdit ? "suvari" : aralik(d, 10) < DENGE.YZ_OKCU_OLASILIK ? "okcu" : "piyade";
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
    let en: { sehir: number; yapi: "tarla" | "pazar"; oran: number; bedel: number } | null = null;
    for (const i of sehirler) {
      if (sehirdeInsaatVar(d, i, true)) continue;
      for (const yapi of ["tarla", "pazar"] as const) {
        const bedel = insaatMaliyeti(d, d.sehirler[i], yapi);
        if (bedel === null || bedel > para()) continue;
        const gelir = yapiSeviyeGeliri(d, d.sehirler[i], yapi); // TASK-0032: gerçek (nüfusa ölçekli) getiri
        if (gelir * DENGE.YZ_YATIRIM_GERI_DONUS_AY < bedel) continue; // kendini geç ödeyen yatırım yapılmaz
        const oran = Math.floor((gelir * 100000) / bedel);
        if (!en || oran > en.oran) en = { sehir: i, yapi, oran, bedel };
      }
    }
    if (!en || !dene({ tur: "insaat", sehir: en.sehir, yapi: en.yapi, devlet })) return false;
    d.yzSayac.insaat++;
    return true;
  };

  // Tehdit altında önce savunma; barışta önce kalkınma. Her karar adımında en çok birer iş.
  const sira = tehdit ? [asker, sur, () => arastir("askeri"), yatirim] : [() => arastir(null), yatirim, asker, ...(zengin ? [sur] : [])];
  for (const adim of sira) adim();
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
