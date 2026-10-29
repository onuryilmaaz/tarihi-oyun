// TASK-0009/6b: AI devletlerinin ekonomi ve ordu hazırlığı kararları (MASTER_SPEC §16, DEC-0039).
// AI oyuncuyla aynı emirleri aynı doğrulamadan geçirerek uygular; gizli avantajı yoktur.
// Yalnızca kendi bütçesini ve herkesin görebildiği bilgiyi (sınırlar, ilişkiler, savaşlar) kullanır;
// yabancı orduların gerçek sayısına bakmaz (AT-013). Sayılar denge.ts'te [TASLAK].

import { olayEkle, type DunyaDurumu } from "./durum";
import { DENGE } from "./denge";
import { BOS_BAGLAM, emirDogrula, emirUygula, type Baglam, type Emir } from "./emirler";
import { butceOzeti } from "./ekonomi";
import { toplamaMaliyeti } from "./ordu";
import { aralik } from "./rastgele";
import { diplomasiOnHesap, iliski, komsuMu, type DiplomasiOnHesap } from "./diplomasi";
import { arastirmaEngeli, pazarGeliriSeviyeBasina, TEKNOLOJILER, toplamaBedelYuzde, yapiEnYuksek, type Alan } from "./teknoloji";
import { insaatMaliyeti, sehirdeInsaatVar } from "./yatirim";
import { gundenTarih } from "./takvim";
import { barisKararlari, savasKarari } from "./yz-savas";

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
export function devletKarari(d: DunyaDurumu, b: Baglam, on: DiplomasiOnHesap, devlet: number): void {
  const butce = butceOzeti(d, devlet);
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
  // 8c: savaştaki AI ara sıra düşmanına askerî istihbarat görevi açar (aynı kurallar, aynı bedel)
  const dusmanSavasi = d.savaslar.find((s) => s.saldiran === devlet || s.savunan === devlet);
  if (dusmanSavasi && DENGE.CASUS.askeri.bedel <= para() && aralik(d, 100) < DENGE.YZ_CASUS_OLASILIK) {
    dene({ tur: "casusluk", hedef: dusmanSavasi.saldiran === devlet ? dusmanSavasi.savunan : dusmanSavasi.saldiran, gorev: "askeri", sehir: null, devlet });
  }
  const tehdit = tehditNedeni(d, on, devlet);
  const sehirler = d.sehirler.flatMap((s, i) => (s.devlet === devlet && s.kontrol === devlet ? [i] : []));

  const riskli = [...sehirler].sort((a, c) => d.sehirler[c].istikrar.risk - d.sehirler[a].istikrar.risk || a - c)
    .find((i) => d.sehirler[i].istikrar.risk >= DENGE.IST_HUZURSUZLUK && d.sehirler[i].istikrar.bagis === 0);
  if (riskli !== undefined && para() >= DENGE.IST_BAGIS_BEDEL) dene({ tur: "bagis", sehir: riskli, devlet });

  const asker = () => {
    const bekleyen = d.askerToplamalar.filter((t) => t.devlet === devlet).reduce((t, x) => t + x.asker, 0);
    const hedef = on.arazi[devlet] * DENGE.YZ_ASKER_ARAZI_BASINA * (tehdit ? DENGE.YZ_TEHDIT_ASKER_CARPANI : 1);
    const eksik = hedef - butce.askerSayisi - bekleyen;
    const maasPayi = Math.max(0, butce.aylikNet) * (tehdit ? 100 : DENGE.YZ_MAAS_NET_YUZDE) / 100;
    const maasSiniri = Math.floor((maasPayi * 1000) / DENGE.AYLIK_ASKER_MAASI_BINDE);
    const yuzde = toplamaBedelYuzde(d, devlet);
    const paraSiniri = Math.floor((Math.max(0, para()) * 100000) / (DENGE.TOPLAMA_ASKER_BASINA_MALIYET_BINDE * yuzde));
    const sehir = [...sehirler].sort((x, y) => d.sehirler[y].insanGucu - d.sehirler[x].insanGucu || x - y)[0];
    if (sehir === undefined) return false;
    const n = Math.min(eksik, maasSiniri, paraSiniri, d.sehirler[sehir].insanGucu);
    if (n < DENGE.YZ_TOPLAMA_EN_AZ || toplamaMaliyeti(n, yuzde) > para()) return false;
    if (!dene({ tur: "askerTopla", sehir, asker: n, devlet })) return false;
    d.yzSayac.asker += n;
    return true;
  };
  const sur = () => {
    const baskent = d.devletler[devlet].baskent;
    if (baskent === null || !sehirler.includes(baskent) || sehirdeInsaatVar(d, baskent, true)) return false;
    const s = d.sehirler[baskent];
    const bedel = insaatMaliyeti(d, s, "sur");
    if (bedel === null || s.sur >= yapiEnYuksek(d, devlet, "sur") || bedel > para()) return false;
    if (!dene({ tur: "insaat", sehir: baskent, yapi: "sur", devlet })) return false;
    d.yzSayac.insaat++;
    return true;
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
        const gelir = yapi === "tarla" ? DENGE.YAPI_AYLIK_GELIR.tarla : pazarGeliriSeviyeBasina(d, devlet);
        const oran = Math.floor((gelir * 100000) / bedel);
        if (!en || oran > en.oran) en = { sehir: i, yapi, oran, bedel };
      }
    }
    if (!en || !dene({ tur: "insaat", sehir: en.sehir, yapi: en.yapi, devlet })) return false;
    d.yzSayac.insaat++;
    return true;
  };

  // Tehdit altında önce savunma; barışta önce kalkınma. Her karar adımında en çok birer iş.
  const sira = tehdit ? [asker, sur, () => arastir("askeri"), yatirim] : [() => arastir(null), yatirim, asker];
  for (const adim of sira) adim();
}

/** Günlük sistem: o gün sırası gelen AI devletleri karar verir. */
export function yzKararlari(d: DunyaDurumu, b: Baglam = BOS_BAGLAM): void {
  const sirada = d.devletler.flatMap((_, i) =>
    i !== d.ayarlar.oyuncu && (d.gun + i) % DENGE.YZ_KARAR_ARALIGI === 0
      && (d.birimler.some((x) => x.sahip === i) || d.sehirler.some((s) => s.devlet === i)) ? [i] : []);
  if (!sirada.length) return;
  const on = diplomasiOnHesap(d, b.ag);
  for (const i of sirada) devletKarari(d, b, on, i);
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
