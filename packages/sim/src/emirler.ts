// Emir kuyruğu. Emirler verildiği anda doğrulanır (oyuncuya anında sebep gösterilir), turun başında
// yeniden doğrulanıp uygulanır (MASTER_SPEC §3.2, evre 1). Tur ilerlemeden dünya değişmez (AT-004).

import { olayEkle, type BarisTalebi, type DunyaDurumu, type KusatmaYontemi, type OrduDurumu, type Tutum } from "./durum";
import { sayiMetni, savasta } from "./savas";
import { orduKonumu, rotaBul, HAREKET, type HareketAgi, type RotaSonucu } from "./hareket";
import { tarihMetni } from "./takvim";
import { toplamaMaliyeti } from "./ordu";
import { DENGE } from "./denge";
import { kusatmadanCikar, orduKusatmasi, sehirMenzilinde } from "./kusatma";
import { barisDogrula, barisiUygula } from "./baris";
import { YAPI_ADLARI, insaatMaliyeti, insaatSuresi, sehirdeInsaatVar, yapiSeviyesi, type YapiTuru } from "./yatirim";
import { bekleyenVerasetiCoz, tahtaCikar } from "./hanedan";
import { iskanBedeli, nufusCikar } from "./nufus";
import { ambargoVar } from "./ticaret";
import { GOREV_TURLERI, gorevEngeli, type GorevTuru } from "./casusluk";
import { bolgeGunu, denizYolu, GEMI_TURLERI, kapasite, type GemiTuru } from "./deniz";
import {
  diplomasiOnHesap, etkiEkle, hediyePuani, ittifakBoz, ittifakDegerlendir, ittifakKur, muttefik, muttefikleri, savasIlaniSonuclari,
  saldirmazlikDegerlendir, saldirmazlikKur, saldirmazlikVar, ticaretAnlasmasiBoz, ticaretAnlasmasiKur, ticaretAnlasmasiVar, ticaretDegerlendir,
} from "./diplomasi";
import { efendisi, vasalKur, vasalMi, vasallari, vasalSerbestBirak } from "./vasallik";
import { BIRIM_ADLARI, birimTuruGecerli, kompozisyonCikar, kompozisyonHizi, kompozisyonOransalAl, kompozisyonTopla, tekTurKompozisyon, type BirimTuru } from "./birim";
import { biliyor, arastirmaEngeli, teknolojiBul, teknolojiGecerli, toplamaBedelYuzde, toplamaSuresi, type TeknolojiId } from "./teknoloji";
import { VERGI_ADLARI, vergiOraniGecerli, type VergiOrani } from "./vergi";
import { elciEngeli } from "./elci";
import { bagimsiz, birlesmeBaslat, birlesmeEngeli } from "./sehir";

/** Statik senaryo verisi (dünya durumuna girmez, kayda yazılmaz). */
export interface Baglam {
  ag: HareketAgi | null;
  sehirKonumlari?: { x: number; y: number }[]; // statik senaryo şehir noktaları
}
export const BOS_BAGLAM: Baglam = { ag: null };

export type Emir =
  // İsteğe bağlı harcama: hazineyi aşamaz, hazine eksideyken yapılamaz (DEC-0002, AT-010)
  | { tur: "harca"; devlet: number; miktar: number; aciklama: string }
  // Test: N gün sonra oyuncu için kesinti planla (DEC-0006 altyapısının sınanması)
  | { tur: "testKesintisi"; gunSonra: number; neden: string }
  // Ordu hedefi: serbest nokta (Miller × 10⁴) ve içinde bulunduğu ağ düğümü (MASTER_SPEC §8.3)
  | { tur: "orduHedef"; ordu: number; x: number; y: number; dugum: number }
  | { tur: "orduDur"; ordu: number }
  // Test: askerî kontrolü değiştir (gerçek işgal savaşla Aşama 4'te; AT-007 modelinin sınanması)
  | { tur: "testIsgal"; hedef: "birim" | "sehir"; indeks: number; devlet: number }
  // Serbest savaş ilanı (MASTER_SPEC §7.1); diplomatik sonuçlar Aşama 6'da
  | { tur: "savasIlan"; devlet: number; hedef: number; gerekce?: string } // gerekçe: AI ilanında (6c)
  // Geri çekilme tutumu (DEC-0008)
  | { tur: "orduTutum"; ordu: number; tutum: Tutum }
  // devlet: yalnızca AI kararlarında (TASK-0009/6b); oyuncu emrinde boş bırakılır
  | { tur: "askerTopla"; sehir: number; asker: number; devlet?: number; birim?: BirimTuru } // TASK-0019: birim yoksa piyade
  | { tur: "toplamaIptal"; id: number; devlet?: number } // TASK-0017: bedel ve insan gücü tam iade edilir
  | { tur: "orduBol"; ordu: number; asker: number }
  | { tur: "orduBirlestir"; ordu: number; diger: number }
  | { tur: "kusat"; ordu: number; sehir: number; yontem: KusatmaYontemi }
  | { tur: "kusatmaBirak"; ordu: number }
  | ({ tur: "baris" } & BarisTalebi)
  // Şehir yatırımı (TASK-0008/5b, DEC-0033)
  | { tur: "insaat"; sehir: number; yapi: YapiTuru; devlet?: number }
  // Teknoloji araştırması (TASK-0008/5c, DEC-0035); her zaman oyuncu devleti için
  | { tur: "arastir"; teknoloji: TeknolojiId; devlet?: number }
  // Diplomasi (TASK-0009/6a, DEC-0038); her zaman oyuncu devleti adına
  | { tur: "ittifakTeklif"; hedef: number }
  | { tur: "ittifakBoz"; hedef: number }
  | { tur: "hediye"; hedef: number; miktar: number }
  | { tur: "elciGonder"; hedef: number } // TASK-0020 (2/3)
  | { tur: "ticaretTeklif"; hedef: number } // TASK-0017 (4/4)
  | { tur: "ticaretBoz"; hedef: number }
  | { tur: "saldirmazlikTeklif"; hedef: number; ay: number }
  | { tur: "vasalSerbestBirak"; hedef: number } // TASK-0018 (2/3)
  // AI barış teklifine cevap (TASK-0009/6c)
  | { tur: "barisCevap"; teklif: number; kabul: boolean }
  // AI'dan gelen diplomatik teklife (ittifak/ticaret/saldırmazlık) cevap (TASK-0020 1/3)
  | { tur: "diplomatikTeklifCevap"; teklif: number; kabul: boolean }
  // Oyuncu hükümdarı ölünce halef seçimi (TASK-0010/7a)
  | { tur: "halefSec"; aday: number }
  // İskân: oyuncunun bir şehrinden diğerine nüfus taşıma (TASK-0010/7b)
  | { tur: "iskan"; kaynak: number; hedef: number; miktar: number }
  | { tur: "bagis"; sehir: number; devlet?: number }
  // Donanma (TASK-0011/8a): limanda gemi inşası, bölgeye yelken, çıkarma (ordu gemiye alınıp hedef limana indirilir)
  | { tur: "gemiInsa"; sehir: number; gemi: GemiTuru; adet: number; devlet?: number }
  | { tur: "donanmaHedef"; donanma: number; bolge: number }
  | { tur: "cikarma"; donanma: number; ordu: number; sehir: number }
  // Ambargo koy/kaldır (TASK-0011/8b); oyuncu adına
  | { tur: "ambargo"; hedef: number; acik: boolean }

  | { tur: "vergiAyarla"; oran: VergiOrani; devlet?: number } // TASK-0017
  // Casusluk görevi (TASK-0011/8c); devlet: yalnızca AI
  | { tur: "casusluk"; hedef: number; gorev: GorevTuru; sehir: number | null; devlet?: number }
  // TASK-0026: iki komşu şehri birleştir (30 gün; küçük olan merkeze bağlanır)
  | { tur: "sehirBirlestir"; sehir: number; katilan: number };

export type Dogrulama = { gecerli: true } | { gecerli: false; neden: string };

function bekleyenHarcama(d: DunyaDurumu, devlet: number): number {
  let s = 0;
  for (const e of d.emirKuyrugu) {
    if (e.tur === "bagis" && d.sehirler[e.sehir]?.devlet === devlet) s += DENGE.IST_BAGIS_BEDEL;
    if (e.tur === "harca" && e.devlet === devlet) s += e.miktar;
    if (e.tur === "askerTopla" && d.sehirler[e.sehir]?.devlet === devlet) s += toplamaMaliyeti(e.asker, toplamaBedelYuzde(d, devlet), e.birim ?? "piyade");
    if (e.tur === "insaat" && d.sehirler[e.sehir]?.devlet === devlet) s += insaatMaliyeti(d, d.sehirler[e.sehir], e.yapi) ?? 0;
    if (e.tur === "hediye" && d.ayarlar.oyuncu === devlet) s += e.miktar;
    if (e.tur === "elciGonder" && d.ayarlar.oyuncu === devlet) s += DENGE.ELCI_BEDEL;
    if (e.tur === "casusluk" && (e.devlet ?? d.ayarlar.oyuncu) === devlet && GOREV_TURLERI.includes(e.gorev)) s += DENGE.CASUS[e.gorev].bedel;
    if (e.tur === "gemiInsa" && d.sehirler[e.sehir]?.devlet === devlet && GEMI_TURLERI.includes(e.gemi)) s += e.adet * DENGE.GEMI[e.gemi].bedel;
    if (e.tur === "iskan" && d.ayarlar.oyuncu === devlet) s += iskanBedeli(e.miktar);
    if (e.tur === "arastir" && d.ayarlar.oyuncu === devlet && teknolojiGecerli(e.teknoloji)) s += DENGE.TEKNOLOJI[e.teknoloji].bedel;
    if (e.tur === "sehirBirlestir" && d.ayarlar.oyuncu === devlet) s += DENGE.SEHIR_BIRLESTIR_BEDEL;
  }
  return s;
}

const orduBul = (d: DunyaDurumu, id: number): OrduDurumu | undefined => d.ordular.find((o) => o.id === id);

export function kullanilabilirHazine(d: DunyaDurumu, devlet: number): number {
  return d.devletler[devlet].hazine - bekleyenHarcama(d, devlet);
}
export function kullanilabilirInsanGucu(d: DunyaDurumu, sehir: number): number {
  return d.sehirler[sehir].insanGucu - d.emirKuyrugu.reduce((s, e) => s + (e.tur === "askerTopla" && e.sehir === sehir ? e.asker : 0), 0);
}
function duzenlenebilir(d: DunyaDurumu, o: OrduDurumu | undefined): Dogrulama {
  if (!o || o.devlet !== d.ayarlar.oyuncu || o.asker <= 0) return { gecerli: false, neden: "Kendi ordunuzu seçin." };
  if (o.muharebe !== null || o.cekiliyor || o.rota.length) return { gecerli: false, neden: "Ordu bekliyor olmalı; yürüyüşte, muharebede veya geri çekilmede düzenlenemez." };
  if (orduKusatmasi(d, o.id)) return { gecerli: false, neden: "Önce kuşatmadan ayrılın; kuşatan ordu bölünemez veya birleştirilemez." };
  return { gecerli: true };
}

export function emirDogrula(d: DunyaDurumu, e: Emir, b: Baglam = BOS_BAGLAM, kuyrukHaric = false): Dogrulama {
  if (!kuyrukHaric && "ordu" in e && d.emirKuyrugu.some((x) =>
    (x.tur === "orduBol" && x.ordu === e.ordu) || (x.tur === "orduBirlestir" && [x.ordu, x.diger].includes(e.ordu)))) {
    return { gecerli: false, neden: "Bu ordu için bölme/birleştirme emri bekliyor; önce turu ilerletin." };
  }
  // TASK-0026: birleşmeyle bağlanmış şehir hiçbir emrin hedefi olamaz
  for (const alan of ["sehir", "katilan", "kaynak", "hedef"] as const) {
    if (alan === "hedef" && e.tur !== "iskan") continue; // diğer emirlerde hedef bir devlettir
    const i = (e as Record<string, unknown>)[alan];
    if (typeof i === "number" && d.sehirler[i] && !bagimsiz(d.sehirler[i])) return { gecerli: false, neden: `${d.sehirler[i].ad} başka bir şehre bağlıdır.` };
  }
  switch (e.tur) {
    case "sehirBirlestir": {
      const engel = birlesmeEngeli(d, b, d.ayarlar.oyuncu, e.sehir, e.katilan, kuyrukHaric);
      if (engel) return { gecerli: false, neden: engel };
      if (!kuyrukHaric && d.emirKuyrugu.some((x) => x.tur === "sehirBirlestir" && [x.sehir, x.katilan].some((i) => i === e.sehir || i === e.katilan)))
        return { gecerli: false, neden: "Bu şehirler için birleştirme emri zaten bekliyor." };
      const para = kuyrukHaric ? d.devletler[d.ayarlar.oyuncu].hazine : kullanilabilirHazine(d, d.ayarlar.oyuncu);
      if (para < DENGE.SEHIR_BIRLESTIR_BEDEL) return { gecerli: false, neden: "Birleştirme için hazine yetersiz; borçlanma yoktur." };
      return { gecerli: true };
    }
    case "bagis": {
      const c = d.sehirler[e.sehir], devlet = e.devlet ?? d.ayarlar.oyuncu;
      if (!c || c.devlet !== devlet || c.kontrol !== devlet) return { gecerli: false, neden: "Bağış yalnızca kontrolünüzdeki kendi şehrinize yapılır." };
      if (c.istikrar.bagis > 0 || (!kuyrukHaric && d.emirKuyrugu.some((x) => x.tur === "bagis" && x.sehir === e.sehir))) return { gecerli: false, neden: "Bu şehre yapılan yardım hâlâ etkili veya emri bekliyor." };
      const para = kuyrukHaric ? d.devletler[devlet].hazine : kullanilabilirHazine(d, devlet);
      if (para < DENGE.IST_BAGIS_BEDEL) return { gecerli: false, neden: "Bağış için hazine yetersiz; borçlanma yoktur." };
      return { gecerli: true };
    }

    case "baris":
      if (!kuyrukHaric && d.emirKuyrugu.some((x) => x.tur === "baris" && x.savas === e.savas)) return { gecerli: false, neden: "Bu savaş için bir barış teklifi zaten bekliyor." };
      return barisDogrula(d, e);
    case "kusat": {
      const o = orduBul(d, e.ordu), s = d.sehirler[e.sehir];
      if (!o || !s) return { gecerli: false, neden: "Kendi ordunuzu ve hedef şehri seçin." };
      if (!["abluka", "bekle", "saldiri"].includes(e.yontem)) return { gecerli: false, neden: "Kuşatma yöntemi geçersiz." };
      if (!savasta(d, o.devlet, s.kontrol)) return { gecerli: false, neden: "Şehrin kontrolünü elinde tutan devletle savaşta değilsiniz." };
      if (o.rota.length || o.cekiliyor || o.muharebe !== null || o.asker <= 0 || o.moral <= 0) return { gecerli: false, neden: "Kuşatma için ordu yürüyüş ve muharebe dışında, morali sıfırdan yüksek olmalı." };
      if (!sehirMenzilinde(d, b, o, e.sehir)) return { gecerli: false, neden: `Kuşatmak için orduyu şehir noktasının ${DENGE.KUSATMA_MENZIL_M / 1000} km yakınına götürün.` };
      const mevcut = d.kusatmalar.find((k) => k.sehir === e.sehir), onceki = orduKusatmasi(d, o.id);
      if (mevcut && mevcut.devlet !== o.devlet) return { gecerli: false, neden: "Şehri başka bir devlet kuşatıyor." };
      if (onceki && onceki.sehir !== e.sehir) return { gecerli: false, neden: "Ordu önce mevcut kuşatmadan ayrılmalı." };
      if (!kuyrukHaric && d.emirKuyrugu.some((x) => "ordu" in x && x.ordu === e.ordu)) return { gecerli: false, neden: "Bu ordu için bekleyen emir var; önce turu ilerletin." };
      return { gecerli: true };
    }
    case "kusatmaBirak": {
      const o = orduBul(d, e.ordu);
      return o && orduKusatmasi(d, o.id) ? { gecerli: true } : { gecerli: false, neden: "Ordu kuşatmada değil." };
    }
    case "insaat": {
      const s = d.sehirler[e.sehir];
      if (!s || s.devlet !== (e.devlet ?? d.ayarlar.oyuncu) || s.kontrol !== s.devlet) return { gecerli: false, neden: "Yalnızca kontrolünüzdeki kendi şehrinize yatırım yapabilirsiniz." };
      if (!["tarla", "pazar", "sur"].includes(e.yapi)) return { gecerli: false, neden: "Geçersiz yapı türü." };
      if (s.istikrar.ayaklanma) return { gecerli: false, neden: "Ayaklanmadaki şehirde inşaat başlatılamaz." };
      if (d.kusatmalar.some((k) => k.sehir === e.sehir)) return { gecerli: false, neden: "Kuşatma altındaki şehirde inşaat başlatılamaz." };
      if (sehirdeInsaatVar(d, e.sehir, kuyrukHaric)) return { gecerli: false, neden: `${s.ad} şehrinde zaten bir inşaat sürüyor ya da bekliyor; aynı anda tek inşaat yapılır.` };
      const bedel = insaatMaliyeti(d, s, e.yapi);
      if (bedel === null) return { gecerli: false, neden: `${YAPI_ADLARI[e.yapi]} en yüksek seviyede (${yapiSeviyesi(s, e.yapi)}).` };
      const para = kuyrukHaric ? d.devletler[s.devlet].hazine : kullanilabilirHazine(d, s.devlet);
      if (para < 0 || bedel > para) return { gecerli: false, neden: `Hazine yetersiz: ${para} kullanılabilir, ${bedel} gerekli. Borçlanma yoktur.` };
      return { gecerli: true };
    }
    case "iskan": {
      const oyuncu = d.ayarlar.oyuncu, k = d.sehirler[e.kaynak], h = d.sehirler[e.hedef];
      const benim = (c: typeof k, i: number) => c && c.devlet === oyuncu && c.kontrol === oyuncu && !d.kusatmalar.some((x) => x.sehir === i);
      if (!benim(k, e.kaynak) || !benim(h, e.hedef) || e.kaynak === e.hedef) return { gecerli: false, neden: "İskân yalnızca kontrolünüzdeki, kuşatma altında olmayan iki farklı şehriniz arasında yapılır." };
      if (!kuyrukHaric && d.emirKuyrugu.some((x) => x.tur === "iskan" && x.kaynak === e.kaynak)) return { gecerli: false, neden: "Bu şehirden bekleyen bir iskân emri var." };
      if (d.iskanlar.some((x) => x.kaynak === e.kaynak)) return { gecerli: false, neden: "Bu şehirden süren bir iskân var." };
      const enCok = Math.floor((k.nufus * DENGE.ISKAN_EN_COK_YUZDE) / 100);
      if (!Number.isSafeInteger(e.miktar) || e.miktar <= 0 || e.miktar > enCok) return { gecerli: false, neden: `İskân miktarı 1 ile ${enCok} (nüfusun %${DENGE.ISKAN_EN_COK_YUZDE}'si) arasında olmalı.` };
      const para = kuyrukHaric ? d.devletler[oyuncu].hazine : kullanilabilirHazine(d, oyuncu);
      const bedel = iskanBedeli(e.miktar);
      if (para < 0 || bedel > para) return { gecerli: false, neden: `Hazine yetersiz: ${para} kullanılabilir, ${bedel} gerekli. Borçlanma yoktur.` };
      return { gecerli: true };
    }
    case "casusluk": {
      const devlet = e.devlet ?? d.ayarlar.oyuncu;
      const bekleyen = kuyrukHaric ? 0 : d.emirKuyrugu.filter((x) => x.tur === "casusluk").length;
      const engel = gorevEngeli(d, devlet, e.hedef, e.gorev, e.sehir, bekleyen);
      if (engel) return { gecerli: false, neden: engel };
      const para = kuyrukHaric ? d.devletler[devlet].hazine : kullanilabilirHazine(d, devlet);
      const bedel = DENGE.CASUS[e.gorev].bedel;
      if (para < 0 || bedel > para) return { gecerli: false, neden: `Hazine yetersiz: ${para} kullanılabilir, ${bedel} gerekli. Borçlanma yoktur.` };
      return { gecerli: true };
    }
    case "ambargo": {
      const oyuncu = d.ayarlar.oyuncu, v = d.devletler[e.hedef];
      if (!Number.isSafeInteger(e.hedef) || !v || e.hedef === oyuncu) return { gecerli: false, neden: "Geçersiz hedef devlet." };
      if (e.acik && muttefik(d, oyuncu, e.hedef)) return { gecerli: false, neden: `${v.ad} müttefikiniz; önce ittifaktan çıkın.` };
      if (e.acik === ambargoVar(d, oyuncu, e.hedef)) return { gecerli: false, neden: e.acik ? `${v.ad}'na zaten ambargo var.` : `${v.ad}'na ambargo yok.` };
      if (!kuyrukHaric && d.emirKuyrugu.some((x) => x.tur === "ambargo" && x.hedef === e.hedef)) return { gecerli: false, neden: "Bu devlet için bekleyen ambargo emri var." };
      return { gecerli: true };
    }
    case "vergiAyarla": {
      const devlet = e.devlet ?? d.ayarlar.oyuncu;
      if (!d.devletler[devlet]) return { gecerli: false, neden: "Geçersiz devlet." };
      if (!vergiOraniGecerli(e.oran)) return { gecerli: false, neden: "Geçersiz vergi oranı." };
      if (d.devletler[devlet].vergiOrani === e.oran) return { gecerli: false, neden: `Vergi oranı zaten ${VERGI_ADLARI[e.oran]}.` };
      if (!kuyrukHaric && d.emirKuyrugu.some((x) => x.tur === "vergiAyarla" && (x.devlet ?? d.ayarlar.oyuncu) === devlet)) return { gecerli: false, neden: "Vergi oranı için bekleyen bir emir var." };
      return { gecerli: true };
    }
    case "gemiInsa": {
      const s = d.sehirler[e.sehir], devlet = e.devlet ?? d.ayarlar.oyuncu;
      if (!s || s.devlet !== devlet || s.kontrol !== devlet || (d.deniz.limanlar[e.sehir] ?? -1) < 0) return { gecerli: false, neden: "Gemi yalnızca kontrolünüzdeki kendi liman şehrinizde yapılır." };
      if (s.istikrar.ayaklanma) return { gecerli: false, neden: "Ayaklanmadaki limanda gemi inşası başlatılamaz." };
      if (!GEMI_TURLERI.includes(e.gemi)) return { gecerli: false, neden: "Geçersiz gemi türü." };
      if (e.gemi === "kalyon" && !biliyor(d, devlet, "kalyon")) return { gecerli: false, neden: "Kalyon yapmak için önce \"Kalyon İnşası\" teknolojisini araştırın." };
      if (d.kusatmalar.some((k) => k.sehir === e.sehir)) return { gecerli: false, neden: "Kuşatma altındaki limanda gemi yapılamaz." };
      if (!Number.isSafeInteger(e.adet) || e.adet <= 0 || e.adet > DENGE.GEMI_INSA_EN_COK) return { gecerli: false, neden: `Adet 1 ile ${DENGE.GEMI_INSA_EN_COK} arasında olmalı.` };
      const para = kuyrukHaric ? d.devletler[devlet].hazine : kullanilabilirHazine(d, devlet);
      const bedel = e.adet * DENGE.GEMI[e.gemi].bedel;
      if (para < 0 || bedel > para) return { gecerli: false, neden: `Hazine yetersiz: ${para} kullanılabilir, ${bedel} gerekli. Borçlanma yoktur.` };
      return { gecerli: true };
    }
    case "donanmaHedef": {
      const f = d.donanmalar.find((x) => x.id === e.donanma);
      if (!f) return { gecerli: false, neden: "Donanma bulunamadı." };
      if (!Number.isSafeInteger(e.bolge) || !d.deniz.bolgeler[e.bolge]) return { gecerli: false, neden: "Geçersiz deniz bölgesi." };
      if (denizYolu(d, f.bolge, e.bolge) === null) return { gecerli: false, neden: "Bu bölgeye deniz yolu yok." };
      if (!kuyrukHaric && d.emirKuyrugu.some((x) => "donanma" in x && x.donanma === e.donanma)) return { gecerli: false, neden: "Bu donanma için bekleyen emir var." };
      return { gecerli: true };
    }
    case "cikarma": {
      const f = d.donanmalar.find((x) => x.id === e.donanma), o = orduBul(d, e.ordu), s = d.sehirler[e.sehir];
      if (!f || !o || !s || o.devlet !== f.devlet) return { gecerli: false, neden: "Kendi donanmanızı, ordunuzu ve hedef limanı seçin." };
      if (f.yuk || f.rota.length) return { gecerli: false, neden: "Donanma boş ve demirli olmalı." };
      if (o.rota.length || o.muharebe !== null || o.cekiliyor || orduKusatmasi(d, o.id)) return { gecerli: false, neden: "Ordu beklemede olmalı (yürüyüş, muharebe ve kuşatma dışında)." };
      const liman = d.sehirler.findIndex((c, i) => d.deniz.limanlar[i] === f.bolge && c.kontrol === o.devlet && sehirMenzilinde(d, b, o, i));
      if (liman < 0) return { gecerli: false, neden: "Ordu, donanmanın bulunduğu denizdeki kendi limanınızda olmalı." };
      if (o.asker > kapasite(f)) return { gecerli: false, neden: `Taşıma kapasitesi yetersiz: ${kapasite(f)} asker taşınabilir.` };
      const hb = d.deniz.limanlar[e.sehir] ?? -1;
      if (hb < 0 || e.sehir === liman) return { gecerli: false, neden: "Hedef başka bir liman şehri olmalı." };
      if (denizYolu(d, f.bolge, hb) === null) return { gecerli: false, neden: "Hedef limana deniz yolu yok." };
      if (!kuyrukHaric && d.emirKuyrugu.some((x) => ("donanma" in x && x.donanma === e.donanma) || ("ordu" in x && x.ordu === e.ordu))) return { gecerli: false, neden: "Bu donanma ya da ordu için bekleyen emir var." };
      return { gecerli: true };
    }
    case "halefSec": {
      const s = d.verasetSecimi;
      if (!s || s.devlet !== d.ayarlar.oyuncu) return { gecerli: false, neden: "Bekleyen veraset yok." };
      if (!Number.isSafeInteger(e.aday) || !s.adaylar[e.aday]) return { gecerli: false, neden: "Geçersiz aday." };
      if (!kuyrukHaric && d.emirKuyrugu.some((x) => x.tur === "halefSec")) return { gecerli: false, neden: "Halef zaten seçildi; tur başında tahta çıkar." };
      return { gecerli: true };
    }
    case "barisCevap": {
      const t = d.barisTeklifleri.find((x) => x.id === e.teklif);
      if (!t) return { gecerli: false, neden: "Barış teklifi artık geçerli değil." };
      if (!kuyrukHaric && d.emirKuyrugu.some((x) => x.tur === "barisCevap" && x.teklif === e.teklif)) return { gecerli: false, neden: "Bu teklife zaten cevap verdiniz." };
      return e.kabul ? barisDogrula(d, t.talep, t.alan) : { gecerli: true };
    }
    case "diplomatikTeklifCevap": {
      const t = d.diplomatikTeklifler.find((x) => x.id === e.teklif);
      if (!t) return { gecerli: false, neden: "Teklif artık geçerli değil." };
      if (!kuyrukHaric && d.emirKuyrugu.some((x) => x.tur === "diplomatikTeklifCevap" && x.teklif === e.teklif)) return { gecerli: false, neden: "Bu teklife zaten cevap verdiniz." };
      return { gecerli: true };
    }
    case "elciGonder": {
      const oyuncu = d.ayarlar.oyuncu;
      const engel = elciEngeli(d, e.hedef);
      if (engel) return { gecerli: false, neden: engel };
      if (!kuyrukHaric && d.emirKuyrugu.some((x) => x.tur === "elciGonder" && x.hedef === e.hedef)) return { gecerli: false, neden: "Bu devlete zaten bir elçi gönderme emri bekliyor." };
      const para = kuyrukHaric ? d.devletler[oyuncu].hazine : kullanilabilirHazine(d, oyuncu);
      if (para < 0 || DENGE.ELCI_BEDEL > para) return { gecerli: false, neden: `Hazine yetersiz: ${para} kullanılabilir. Borçlanma yoktur.` };
      return { gecerli: true };
    }
    case "ittifakTeklif":
    case "ittifakBoz":
    case "hediye": {
      const oyuncu = d.ayarlar.oyuncu, v = d.devletler[e.hedef];
      if (!Number.isSafeInteger(e.hedef) || !v || e.hedef === oyuncu) return { gecerli: false, neden: "Geçersiz hedef devlet." };
      if (!kuyrukHaric && d.emirKuyrugu.some((x) => (x.tur === "ittifakTeklif" || x.tur === "ittifakBoz") && x.tur === e.tur && x.hedef === e.hedef)) {
        return { gecerli: false, neden: "Bu emir zaten bir sonraki tur için bekliyor." };
      }
      if (e.tur === "ittifakBoz") return muttefik(d, oyuncu, e.hedef) ? { gecerli: true } : { gecerli: false, neden: `${v.ad} müttefikiniz değil.` };
      if (savasta(d, oyuncu, e.hedef)) return { gecerli: false, neden: `${v.ad} ile savaştasınız.` };
      if (e.tur === "ittifakTeklif") {
        if (muttefik(d, oyuncu, e.hedef)) return { gecerli: false, neden: `${v.ad} zaten müttefikiniz.` };
        const bekleyen = kuyrukHaric ? 0 : d.emirKuyrugu.filter((x) => x.tur === "ittifakTeklif").length;
        if (muttefikleri(d, oyuncu).length + bekleyen >= DENGE.ITTIFAK_EN_COK) return { gecerli: false, neden: `En çok ${DENGE.ITTIFAK_EN_COK} müttefikiniz olabilir.` };
        return { gecerli: true };
      }
      if (!Number.isSafeInteger(e.miktar) || e.miktar <= 0) return { gecerli: false, neden: "Hediye miktarı pozitif tam sayı olmalı." };
      const para = kuyrukHaric ? d.devletler[oyuncu].hazine : kullanilabilirHazine(d, oyuncu);
      if (para < 0 || e.miktar > para) return { gecerli: false, neden: `Hazine yetersiz: ${para} kullanılabilir. Borçlanma yoktur.` };
      return { gecerli: true };
    }
    case "ticaretTeklif":
    case "ticaretBoz":
    case "saldirmazlikTeklif": {
      const oyuncu = d.ayarlar.oyuncu, v = d.devletler[e.hedef];
      if (!Number.isSafeInteger(e.hedef) || !v || e.hedef === oyuncu) return { gecerli: false, neden: "Geçersiz hedef devlet." };
      if (!kuyrukHaric && d.emirKuyrugu.some((x) =>
        (x.tur === "ticaretTeklif" || x.tur === "ticaretBoz" || x.tur === "saldirmazlikTeklif") && x.tur === e.tur && x.hedef === e.hedef)) {
        return { gecerli: false, neden: "Bu emir zaten bir sonraki tur için bekliyor." };
      }
      if (e.tur === "ticaretBoz") return ticaretAnlasmasiVar(d, oyuncu, e.hedef) ? { gecerli: true } : { gecerli: false, neden: `${v.ad} ile ticaret anlaşmanız yok.` };
      if (savasta(d, oyuncu, e.hedef)) return { gecerli: false, neden: `${v.ad} ile savaştasınız.` };
      if (e.tur === "ticaretTeklif") {
        if (ticaretAnlasmasiVar(d, oyuncu, e.hedef)) return { gecerli: false, neden: `${v.ad} ile zaten bir ticaret anlaşmanız var.` };
        return { gecerli: true };
      }
      if (saldirmazlikVar(d, oyuncu, e.hedef)) return { gecerli: false, neden: `${v.ad} ile zaten bir saldırmazlık paktınız var.` };
      if (!(DENGE.SALDIRMAZLIK_AYLARI as readonly number[]).includes(e.ay)) return { gecerli: false, neden: `Süre ${DENGE.SALDIRMAZLIK_AYLARI.join("/")} aydan biri olmalı.` };
      return { gecerli: true };
    }
    case "vasalSerbestBirak": {
      const oyuncu = d.ayarlar.oyuncu;
      if (!Number.isSafeInteger(e.hedef) || !d.devletler[e.hedef]) return { gecerli: false, neden: "Geçersiz hedef devlet." };
      if (efendisi(d, e.hedef) !== oyuncu) return { gecerli: false, neden: `${d.devletler[e.hedef].ad} sizin vasalınız değil.` };
      if (!kuyrukHaric && d.emirKuyrugu.some((x) => x.tur === "vasalSerbestBirak" && x.hedef === e.hedef)) return { gecerli: false, neden: "Bu emir zaten bir sonraki tur için bekliyor." };
      return { gecerli: true };
    }
    case "arastir": {
      if (!teknolojiGecerli(e.teknoloji)) return { gecerli: false, neden: "Geçersiz teknoloji." };
      const oyuncu = e.devlet ?? d.ayarlar.oyuncu;
      if (!d.devletler[oyuncu]) return { gecerli: false, neden: "Devlet bulunamadı." };
      const engel = arastirmaEngeli(d, oyuncu, e.teknoloji, kuyrukHaric);
      if (engel) return { gecerli: false, neden: engel };
      const bedel = DENGE.TEKNOLOJI[e.teknoloji].bedel;
      const para = kuyrukHaric ? d.devletler[oyuncu].hazine : kullanilabilirHazine(d, oyuncu);
      if (para < 0 || bedel > para) return { gecerli: false, neden: `Hazine yetersiz: ${para} kullanılabilir, ${bedel} gerekli. Borçlanma yoktur.` };
      return { gecerli: true };
    }
    case "askerTopla": {
      const s = d.sehirler[e.sehir];
      if (s?.istikrar.ayaklanma) return { gecerli: false, neden: "Ayaklanmadaki şehirden asker toplanamaz." };
      if (!s || s.devlet !== (e.devlet ?? d.ayarlar.oyuncu) || s.kontrol !== s.devlet) return { gecerli: false, neden: "Asker yalnızca kontrolünüzdeki kendi şehrinizden toplanır." };
      const n = b.ag?.dugumler[s.dugum];
      if (!n || d.birimler[n.b]?.kontrol !== s.devlet) return { gecerli: false, neden: "Şehir çevresi kontrolünüzde ve hareket ağına bağlı olmalı." };
      if (!Number.isSafeInteger(e.asker) || e.asker <= 0 || !Number.isSafeInteger(e.asker * DENGE.TOPLAMA_ASKER_BASINA_MALIYET_BINDE)) return { gecerli: false, neden: "Asker sayısı pozitif tam sayı olmalı." };
      if (e.birim !== undefined && !birimTuruGecerli(e.birim)) return { gecerli: false, neden: "Geçersiz birim türü." };
      const havuz = kuyrukHaric ? s.insanGucu : kullanilabilirInsanGucu(d, e.sehir);
      if (e.asker > havuz) return { gecerli: false, neden: `İnsan gücü yetersiz: ${havuz} asker toplanabilir.` };
      const para = kuyrukHaric ? d.devletler[s.devlet].hazine : kullanilabilirHazine(d, s.devlet);
      if (para < 0 || toplamaMaliyeti(e.asker, toplamaBedelYuzde(d, s.devlet), e.birim ?? "piyade") > para) return { gecerli: false, neden: `Hazine yetersiz: ${para} kullanılabilir. Borçlanma yoktur.` };
      return { gecerli: true };
    }
    case "toplamaIptal": {
      const t = d.askerToplamalar.find((x) => x.id === e.id);
      const devlet = e.devlet ?? d.ayarlar.oyuncu;
      if (!t || t.devlet !== devlet) return { gecerli: false, neden: "Bu toplama bulunamadı ya da size ait değil." };
      if (!kuyrukHaric && d.emirKuyrugu.some((x) => x.tur === "toplamaIptal" && x.id === e.id)) return { gecerli: false, neden: "Bu toplama için zaten bir iptal emri bekliyor." };
      return { gecerli: true };
    }
    case "orduBol":
    case "orduBirlestir": {
      const o = orduBul(d, e.ordu);
      const uygun = duzenlenebilir(d, o);
      if (!uygun.gecerli) return uygun;
      const idler = e.tur === "orduBirlestir" ? [e.ordu, e.diger] : [e.ordu];
      if (!kuyrukHaric && d.emirKuyrugu.some((x) =>
        ("ordu" in x && idler.includes(x.ordu)) || (x.tur === "orduBirlestir" && idler.includes(x.diger)))) {
        return { gecerli: false, neden: "Bu ordu için bekleyen emir var; önce turu ilerletin." };
      }
      if (e.tur === "orduBol") {
        if (!Number.isSafeInteger(e.asker) || e.asker <= 0 || e.asker >= o!.asker) return { gecerli: false, neden: "Ayrılacak asker sayısı 1 ile ordunun asker sayısından bir eksik arasında olmalı." };
      } else {
        const a = orduBul(d, e.diger);
        const ikinci = duzenlenebilir(d, a);
        if (!ikinci.gecerli) return ikinci;
        if (a!.id === o!.id || a!.dugum !== o!.dugum || a!.x !== o!.x || a!.y !== o!.y) return { gecerli: false, neden: "Birleştirmek için iki ayrı ordu tam olarak aynı konumda beklemeli." };
        if (!Number.isSafeInteger(a!.asker + o!.asker)) return { gecerli: false, neden: "Birleşik asker sayısı hesap sınırını aşıyor." };
      }
      return { gecerli: true };
    }
    case "harca": {
      const v = d.devletler[e.devlet];
      if (!v) return { gecerli: false, neden: "Devlet bulunamadı." };
      if (!Number.isSafeInteger(e.miktar) || e.miktar <= 0) return { gecerli: false, neden: "Miktar pozitif tam sayı olmalı." };
      if (v.hazine < 0) return { gecerli: false, neden: "Hazine eksi bakiyede; isteğe bağlı harcama yapılamaz." };
      const kullanilabilir = v.hazine - (kuyrukHaric ? 0 : bekleyenHarcama(d, e.devlet));
      if (e.miktar > kullanilabilir) {
        return { gecerli: false, neden: `Hazine yetersiz: ${kullanilabilir} kullanılabilir, ${e.miktar} isteniyor. Borçlanma yoktur.` };
      }
      return { gecerli: true };
    }
    case "testKesintisi":
      if (!Number.isSafeInteger(e.gunSonra) || e.gunSonra < 1) return { gecerli: false, neden: "Gün sayısı en az 1 olmalı." };
      return { gecerli: true };
    case "orduHedef": {
      const o = orduBul(d, e.ordu);
      if (!o) return { gecerli: false, neden: "Ordu bulunamadı." };
      if (o.muharebe !== null || o.cekiliyor) return { gecerli: false, neden: "Muharebedeki veya geri çekilen orduya yürüyüş emri verilemez." };
      if (!b.ag) return { gecerli: false, neden: "Hareket ağı yüklenmedi." };
      if (![e.x, e.y, e.dugum].every(Number.isSafeInteger)) return { gecerli: false, neden: "Hedef koordinatı geçersiz." };
      const r = orduRotasi(d, b.ag, o, e, !kuyrukHaric);
      return r.gecerli ? { gecerli: true } : { gecerli: false, neden: r.neden };
    }
    case "orduDur": {
      const o = orduBul(d, e.ordu);
      if (!o) return { gecerli: false, neden: "Ordu bulunamadı." };
      if (o.muharebe !== null || o.cekiliyor) return { gecerli: false, neden: "Muharebedeki veya geri çekilen ordu durdurulamaz." };
      return { gecerli: true };
    }
    case "savasIlan":
      if (!d.devletler[e.devlet] || !d.devletler[e.hedef]) return { gecerli: false, neden: "Devlet bulunamadı." };
      if (e.devlet === e.hedef) return { gecerli: false, neden: "Bir devlet kendine savaş ilan edemez." };
      if (savasta(d, e.devlet, e.hedef)) return { gecerli: false, neden: `${d.devletler[e.hedef].ad} ile zaten savaştasınız.` };
      if (muttefik(d, e.devlet, e.hedef)) return { gecerli: false, neden: `${d.devletler[e.hedef].ad} müttefikiniz; önce ittifaktan çıkın.` };
      if (saldirmazlikVar(d, e.devlet, e.hedef)) return { gecerli: false, neden: `${d.devletler[e.hedef].ad} ile saldırmazlık paktınız var; süresi dolmadan savaş ilan edemezsiniz.` };
      if (vasalMi(d, e.devlet)) return { gecerli: false, neden: "Vasal bir devlet kendi başına savaş ilan edemez." };
      if (!kuyrukHaric && d.emirKuyrugu.some((x) => x.tur === "savasIlan" && x.devlet === e.devlet && x.hedef === e.hedef)) {
        return { gecerli: false, neden: "Bu savaş ilanı zaten bir sonraki tur için bekliyor." };
      }
      return { gecerli: true };
    case "orduTutum":
      if (!orduBul(d, e.ordu)) return { gecerli: false, neden: "Ordu bulunamadı." };
      if (!["temkinli", "dengeli", "inatci"].includes(e.tutum)) return { gecerli: false, neden: "Geçersiz tutum." };
      return { gecerli: true };
    case "testIsgal": {
      const liste = e.hedef === "birim" ? d.birimler : d.sehirler;
      if (!Number.isSafeInteger(e.indeks) || !liste[e.indeks]) return { gecerli: false, neden: "Hedef bulunamadı." };
      if (!d.devletler[e.devlet]) return { gecerli: false, neden: "Devlet bulunamadı." };
      return { gecerli: true };
    }
  }
}

/**
 * Ordunun şu anki konumundan hedefe rota. bekleyenleriSay: kuyruktaki savaş ilanları da etkin sayılır
 * (tur başında yürüyüşten önce uygulanırlar), böylece ilan ve yürüyüş aynı turda verilebilir.
 */
export function orduRotasi(d: DunyaDurumu, ag: HareketAgi, o: OrduDurumu, hedef: { x: number; y: number; dugum: number },
  bekleyenleriSay = true): RotaSonucu {
  const bekleyen = bekleyenleriSay ? d.emirKuyrugu.flatMap((x, i) =>
    x.tur === "savasIlan" ? [{ id: -1 - i, saldiran: x.devlet, savunan: x.hedef, baslangic: d.gun }] : []) : [];
  const gorunum = bekleyen.length ? { ...d, savaslar: [...d.savaslar, ...bekleyen] } : d;
  return rotaBul(gorunum, ag, { ...o, ...orduKonumu(o), ilerleme: 0, rota: [] }, hedef);
}

/** Ordu yolun ortasındaysa bulunduğu noktada durur (ilerleme konuma işlenir). */
export function orduyuDurdur(o: OrduDurumu): void {
  const k = orduKonumu(o);
  o.x = k.x; o.y = k.y;
  o.rota = [];
  o.ilerleme = 0;
  o.hedef = null;
}

/** Emri doğrular ve kuyruğa ekler. Dünya durumunu (kuyruk dışında) değiştirmez. */
export function emirVer(d: DunyaDurumu, e: Emir, b: Baglam = BOS_BAGLAM): Dogrulama {
  // Oyuncu yalnızca kendi devleti ve kendi orduları adına emir verir; AI aynı doğrulamayı emirUygula ile kullanır (6b/6c)
  const oyuncu = d.ayarlar.oyuncu;
  if (((e.tur === "insaat" || e.tur === "arastir" || e.tur === "askerTopla" || e.tur === "bagis" || e.tur === "vergiAyarla" || e.tur === "toplamaIptal") && e.devlet !== undefined && e.devlet !== oyuncu)
    || (e.tur === "savasIlan" && e.devlet !== oyuncu)
    || ("ordu" in e && orduBul(d, e.ordu) && orduBul(d, e.ordu)!.devlet !== oyuncu)
    || ("donanma" in e && d.donanmalar.find((f) => f.id === e.donanma) && d.donanmalar.find((f) => f.id === e.donanma)!.devlet !== oyuncu)
    || ((e.tur === "gemiInsa" || e.tur === "casusluk") && e.devlet !== undefined && e.devlet !== oyuncu)) {
    return { gecerli: false, neden: "Yalnızca kendi devletiniz ve ordularınız adına emir verebilirsiniz." };
  }
  const s = emirDogrula(d, e, b);
  if (s.gecerli) d.emirKuyrugu.push(e);
  return s;
}

/** Turun başında: kuyruktaki emirleri sırayla yeniden doğrula ve uygula. */
export function emirleriUygula(d: DunyaDurumu, b: Baglam = BOS_BAGLAM): void {
  // Savaş ilanları önce: aynı turda verilen yürüyüş emirleri yeni savaşın topraklarına girebilsin
  const kuyruk = [...d.emirKuyrugu.filter((e) => e.tur === "savasIlan"), ...d.emirKuyrugu.filter((e) => e.tur !== "savasIlan")];
  d.emirKuyrugu = [];
  for (const e of kuyruk) {
    const s = emirDogrula(d, e, b, true);
    if (!s.gecerli) {
      olayEkle(d, { tur: "emir-reddedildi", devlet: ("devlet" in e ? e.devlet : undefined) ?? d.ayarlar.oyuncu, metin: s.neden });
      continue;
    }
    emirUygula(d, e, b);
  }
  bekleyenVerasetiCoz(d); // halef seçilmeden tur ilerletildiyse (7a)
}

/** Doğrulanmış tek emri uygular (oyuncu kuyruğu ve AI kararları aynı yolu kullanır). */
export function emirUygula(d: DunyaDurumu, e: Emir, b: Baglam = BOS_BAGLAM): void {
  switch (e.tur) {
    case "sehirBirlestir":
      birlesmeBaslat(d, d.ayarlar.oyuncu, e.sehir, e.katilan);
      break;
    case "bagis": {
      const c = d.sehirler[e.sehir];
      d.devletler[c.devlet].hazine -= DENGE.IST_BAGIS_BEDEL;
      c.istikrar.bagis = DENGE.IST_BAGIS_INDIRIM;
      olayEkle(d, { tur: "imar-yardimi", devlet: c.devlet, metin: `${c.ad}: bağış/imar yardımı −${DENGE.IST_BAGIS_BEDEL}; sonraki aylık risk hesabında ${DENGE.IST_BAGIS_INDIRIM} puan indirim, zamanla söner.` });
      break;
    }

    case "baris":
      barisiUygula(d, b, e);
      break;
    case "kusat": {
      const o = orduBul(d, e.ordu)!, s = d.sehirler[e.sehir];
      let k = d.kusatmalar.find((a) => a.sehir === e.sehir);
      if (!k) {
        k = { sehir: e.sehir, devlet: o.devlet, savunan: s.kontrol, ordular: [], yontem: e.yontem,
          baslangic: d.gun, gun: 0, erzak: DENGE.KUSATMA_ERZAK };
        d.kusatmalar.push(k);
      }
      if (!k.ordular.includes(o.id)) k.ordular.push(o.id);
      k.yontem = e.yontem;
      olayEkle(d, { tur: "kusatma-emri", devlet: o.devlet, metin: `${s.ad} kuşatması: ${{ abluka: "kara ablukası", bekle: "teslim bekleme", saldiri: "surlara saldırı" }[e.yontem]}.` });
      break;
    }
    case "kusatmaBirak":
      kusatmadanCikar(d, e.ordu);
      break;
    case "insaat": {
      const s = d.sehirler[e.sehir];
      const bedel = insaatMaliyeti(d, s, e.yapi)!;
      const hedef = yapiSeviyesi(s, e.yapi) + 1;
      const sure = insaatSuresi(d, s.devlet, e.yapi);
      d.devletler[s.devlet].hazine -= bedel;
      d.insaatlar.push({ sehir: e.sehir, devlet: s.devlet, yapi: e.yapi, hedef, kalanGun: sure });
      olayEkle(d, { tur: "insaat-basladi", devlet: s.devlet,
        metin: `${s.ad}: ${YAPI_ADLARI[e.yapi]} ${hedef}. seviye inşaatı başladı (${sure} gün). Bedel: −${bedel}.` });
      break;
    }
    case "arastir": {
      const devlet = e.devlet ?? d.ayarlar.oyuncu, t = DENGE.TEKNOLOJI[e.teknoloji];
      d.devletler[devlet].hazine -= t.bedel;
      d.arastirmalar.push({ devlet, teknoloji: e.teknoloji, kalanGun: t.sure });
      olayEkle(d, { tur: "arastirma-basladi", devlet, metin: `${teknolojiBul(e.teknoloji).ad} araştırması başladı (${t.sure} gün). Bedel: −${t.bedel}.` });
      break;
    }
    case "askerTopla": {
      const s = d.sehirler[e.sehir], birim = e.birim ?? "piyade";
      const bedel = toplamaMaliyeti(e.asker, toplamaBedelYuzde(d, s.devlet), birim);
      const sure = toplamaSuresi(d, s.devlet);
      d.devletler[s.devlet].hazine -= bedel;
      s.insanGucu -= e.asker;
      d.askerToplamalar.push({ id: d.sonrakiToplamaId++, sehir: e.sehir, devlet: s.devlet, asker: e.asker, birim, kalanGun: sure, bedel });
      olayEkle(d, { tur: "asker-toplama", devlet: s.devlet, metin: `${s.ad}: ${e.asker} ${BIRIM_ADLARI[birim].toLowerCase()} toplanıyor (${sure} gün). Bedel: −${bedel}.` });
      break;
    }
    case "toplamaIptal": {
      const i = d.askerToplamalar.findIndex((x) => x.id === e.id), t = d.askerToplamalar[i];
      const s = d.sehirler[t.sehir];
      d.devletler[t.devlet].hazine += t.bedel;
      s.insanGucu += t.asker;
      d.askerToplamalar.splice(i, 1);
      olayEkle(d, { tur: "toplama-iptal", devlet: t.devlet, metin: `${s.ad}: ${t.asker} askerlik toplama iptal edildi; ${t.bedel} hazineye iade edildi.` });
      break;
    }
    case "orduBol": {
      const o = orduBul(d, e.ordu)!;
      const alinanKomp = kompozisyonOransalAl(o.kompozisyon, e.asker); // TASK-0019: türler oransal ayrılır
      o.kompozisyon = kompozisyonCikar(o.kompozisyon, alinanKomp);
      o.asker -= e.asker;
      o.hiz = kompozisyonHizi(o.kompozisyon, HAREKET.TEMEL_HIZ); // TASK-0019 (3/4)
      const yeni = { ...o, id: d.sonrakiOrduId++, asker: e.asker, kompozisyon: alinanKomp,
        hiz: kompozisyonHizi(alinanKomp, HAREKET.TEMEL_HIZ), ad: `${o.ad} · Ayrılan birlik`, rota: [], hedef: null };
      d.ordular.push(yeni);
      olayEkle(d, { tur: "ordu-bolundu", devlet: o.devlet, metin: `${o.ad}: ${e.asker} asker ayrı orduya ayrıldı; moral ve tutum korundu.` });
      break;
    }
    case "orduBirlestir": {
      const o = orduBul(d, e.ordu)!, a = orduBul(d, e.diger)!;
      o.moral = Math.floor((o.moral * o.asker + a.moral * a.asker) / (o.asker + a.asker));
      o.kompozisyon = kompozisyonTopla(o.kompozisyon, a.kompozisyon); // TASK-0019
      o.asker += a.asker;
      o.hiz = kompozisyonHizi(o.kompozisyon, HAREKET.TEMEL_HIZ); // TASK-0019 (3/4)
      d.ordular = d.ordular.filter((x) => x.id !== a.id);
      olayEkle(d, { tur: "ordu-birlesti", devlet: o.devlet, metin: `${a.ad}, ${o.ad} ile birleşti (${o.asker} asker); seçili ordunun tutumu korundu.` });
      break;
    }
    case "harca":
      d.devletler[e.devlet].hazine -= e.miktar;
      olayEkle(d, { tur: "harcama", devlet: e.devlet, metin: `${e.aciklama}: −${e.miktar}` });
      break;
    case "testKesintisi":
      d.planliKesintiler.push({ gun: d.gun + e.gunSonra, neden: e.neden });
      break;
    case "orduHedef": {
      const o = orduBul(d, e.ordu)!;
      kusatmadanCikar(d, o.id);
      orduyuDurdur(o);
      const r = rotaBul(d, b.ag!, o, e);
      if (!r.gecerli) break; // doğrulandı; buraya düşmez
      o.rota = r.adimlar;
      o.hedef = { x: e.x, y: e.y };
      olayEkle(d, { tur: "ordu-yuruyus", devlet: o.devlet,
        metin: `${o.ad} yürüyüşe başladı; tahmini varış ${tarihMetni(d.gun + r.gun)} (${r.gun} gün).` });
      break;
    }
    case "orduDur": {
      const o = orduBul(d, e.ordu)!;
      kusatmadanCikar(d, o.id);
      if (o.rota.length) olayEkle(d, { tur: "ordu-durdu", devlet: o.devlet, metin: `${o.ad} durduruldu.` });
      orduyuDurdur(o);
      break;
    }
    case "savasIlan":
      d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: e.devlet, savunan: e.hedef, baslangic: d.gun });
      ticaretAnlasmasiBoz(d, e.devlet, e.hedef);
      {
        // Savaş ilanı herkesin bildiği bir olaydır; oyuncuya ilan edilirse tur durur (DEC-0038/4)
        const oyuncu = d.ayarlar.oyuncu;
        const metin = `${d.devletler[e.devlet].ad}, ${d.devletler[e.hedef].ad}'na savaş ilan etti.${e.gerekce ? ` Gerekçe: ${e.gerekce}` : ""}`;
        olayEkle(d, { tur: "savas-ilani", devlet: [e.devlet, e.hedef].includes(oyuncu) ? oyuncu : null, metin });
        if (e.hedef === oyuncu && e.devlet !== oyuncu && !d.aktifKesinti) d.aktifKesinti = { gun: d.gun, neden: metin };
      }
      savasIlaniSonuclari(d, b.ag, e.devlet, e.hedef);
      // TASK-0018 (2/3): vasallar efendilerinin savaşlarına zorunlu katılır
      for (const vasal of vasallari(d, e.devlet)) {
        if (!savasta(d, vasal, e.hedef)) {
          d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: vasal, savunan: e.hedef, baslangic: d.gun });
          olayEkle(d, { tur: "vasal-savasa-katildi", devlet: [vasal, e.hedef].includes(d.ayarlar.oyuncu) ? d.ayarlar.oyuncu : null,
            metin: `Vasal ${d.devletler[vasal].ad}, efendisi ${d.devletler[e.devlet].ad}'nın savaşına katıldı.` });
        }
      }
      for (const vasal of vasallari(d, e.hedef)) {
        if (!savasta(d, vasal, e.devlet)) {
          d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: e.devlet, savunan: vasal, baslangic: d.gun });
          olayEkle(d, { tur: "vasal-savasa-katildi", devlet: [vasal, e.devlet].includes(d.ayarlar.oyuncu) ? d.ayarlar.oyuncu : null,
            metin: `Vasal ${d.devletler[vasal].ad}, efendisi ${d.devletler[e.hedef].ad}'nın savunduğu savaşa katıldı.` });
        }
      }
      break;
    case "vasalSerbestBirak":
      vasalSerbestBirak(d, d.ayarlar.oyuncu, e.hedef);
      break;
    case "casusluk": {
      const devlet = e.devlet ?? d.ayarlar.oyuncu, c = DENGE.CASUS[e.gorev];
      d.devletler[devlet].hazine -= c.bedel;
      d.casusGorevleri.push({ id: d.sonrakiGorevId++, devlet, hedef: e.hedef, tur: e.gorev, sehir: e.sehir, kalanGun: c.hazirlik });
      olayEkle(d, { tur: "casusluk", devlet, metin: `${c.ad} görevi hazırlanıyor: ${d.devletler[e.hedef].ad}${e.sehir !== null ? ` (${d.sehirler[e.sehir].ad})` : ""}, ${c.hazirlik} gün, başarı şansı %${c.basari}. Bedel: −${c.bedel}.` });
      break;
    }
    case "ambargo": {
      const oyuncu = d.ayarlar.oyuncu, ad = d.devletler[e.hedef].ad;
      if (e.acik) d.ambargolar.push({ devlet: oyuncu, hedef: e.hedef });
      else d.ambargolar = d.ambargolar.filter((a) => !(a.devlet === oyuncu && a.hedef === e.hedef));
      olayEkle(d, { tur: "ambargo", devlet: oyuncu, metin: e.acik
        ? `${ad}'na ticaret ambargosu kondu: onların ticareti %${DENGE.AMBARGO_HEDEF_YUZDE}, sizinki %${DENGE.AMBARGO_KOYAN_YUZDE} azalır; size bakışları ${DENGE.AMBARGO_ILISKI}.`
        : `${ad}'na uygulanan ambargo kaldırıldı.` });
      break;
    }
    case "vergiAyarla": {
      const devlet = e.devlet ?? d.ayarlar.oyuncu, onceki = d.devletler[devlet].vergiOrani;
      d.devletler[devlet].vergiOrani = e.oran;
      olayEkle(d, { tur: "vergi-ayarlandi", devlet, metin: `Vergi oranı ${VERGI_ADLARI[onceki]} → ${VERGI_ADLARI[e.oran]} olarak değiştirildi.` });
      break;
    }
    case "gemiInsa": {
      const s = d.sehirler[e.sehir], devlet = s.devlet, g = DENGE.GEMI[e.gemi], bedel = e.adet * g.bedel;
      d.devletler[devlet].hazine -= bedel;
      d.gemiInsalari.push({ sehir: e.sehir, devlet, gemi: e.gemi, adet: e.adet, kalanGun: g.sure });
      olayEkle(d, { tur: "gemi-insa", devlet, metin: `${s.ad}: ${e.adet} ${g.ad.toLowerCase()} yapımı başladı (${g.sure} gün). Bedel: −${bedel}.` });
      break;
    }
    case "donanmaHedef": {
      const f = d.donanmalar.find((x) => x.id === e.donanma)!;
      f.rota = denizYolu(d, f.bolge, e.bolge)!;
      f.kalanGun = f.rota.length ? bolgeGunu(f) : 0;
      f.cikarmaHedef = f.yuk ? f.cikarmaHedef : null;
      if (f.rota.length) olayEkle(d, { tur: "donanma-yelken", devlet: f.devlet, metin: `${f.ad} ${d.deniz.bolgeler[e.bolge].ad} yönüne yelken açtı (${f.rota.length * bolgeGunu(f)} gün).` });
      break;
    }
    case "cikarma": {
      const f = d.donanmalar.find((x) => x.id === e.donanma)!, o = orduBul(d, e.ordu)!;
      d.ordular = d.ordular.filter((x) => x !== o);
      f.yuk = o; f.cikarmaHedef = e.sehir;
      f.rota = denizYolu(d, f.bolge, d.deniz.limanlar[e.sehir])!;
      f.kalanGun = f.rota.length ? bolgeGunu(f) : 0;
      olayEkle(d, { tur: "cikarma", devlet: f.devlet, metin: `${o.ad} ${f.ad} gemilerine bindi; hedef ${d.sehirler[e.sehir].ad} (${f.rota.length * bolgeGunu(f)} gün).` });
      break;
    }
    case "halefSec":
      tahtaCikar(d, d.ayarlar.oyuncu, d.verasetSecimi!.adaylar[e.aday], "oyuncu");
      break;
    case "iskan": {
      const oyuncu = d.ayarlar.oyuncu, bedel = iskanBedeli(e.miktar);
      d.devletler[oyuncu].hazine -= bedel;
      const gruplar = nufusCikar(d.sehirler[e.kaynak], e.miktar);
      d.iskanlar.push({ kaynak: e.kaynak, hedef: e.hedef, devlet: oyuncu, gruplar, kalanGun: DENGE.ISKAN_GUN });
      olayEkle(d, { tur: "iskan", devlet: oyuncu, metin: `${sayiMetni(e.miktar)} kişi ${d.sehirler[e.kaynak].ad} → ${d.sehirler[e.hedef].ad} yola çıktı (${DENGE.ISKAN_GUN} gün). Bedel: −${bedel}.` });
      break;
    }
    case "barisCevap": {
      const t = d.barisTeklifleri.find((x) => x.id === e.teklif)!;
      d.barisTeklifleri = d.barisTeklifleri.filter((x) => x !== t);
      if (e.kabul) barisiUygula(d, b, t.talep, t.alan);
      else olayEkle(d, { tur: "baris-ret", devlet: d.ayarlar.oyuncu, metin: `${d.devletler[t.teklifEden].ad}'nın barış teklifini reddettiniz; savaş sürüyor.` });
      break;
    }
    case "diplomatikTeklifCevap": {
      const t = d.diplomatikTeklifler.find((x) => x.id === e.teklif)!;
      d.diplomatikTeklifler = d.diplomatikTeklifler.filter((x) => x !== t);
      const oyuncu = d.ayarlar.oyuncu, ad = d.devletler[t.devlet].ad;
      if (e.kabul) {
        if (t.tur === "ittifak") ittifakKur(d, oyuncu, t.devlet);
        else if (t.tur === "ticaret") ticaretAnlasmasiKur(d, oyuncu, t.devlet);
        else if (t.tur === "saldirmazlik") saldirmazlikKur(d, oyuncu, t.devlet, t.ay!);
        else vasalKur(d, t.devlet, oyuncu); // TASK-0021 (4/4): efendi teklif eden, vasal oyuncu
        olayEkle(d, { tur: "diplomatik-teklif", devlet: oyuncu, metin: `${ad}'nın teklifini kabul ettiniz.` });
      } else {
        olayEkle(d, { tur: "diplomatik-teklif", devlet: oyuncu, metin: `${ad}'nın teklifini reddettiniz.` });
      }
      break;
    }
    case "ittifakTeklif": {
      const oyuncu = d.ayarlar.oyuncu, ad = d.devletler[e.hedef].ad;
      const c = ittifakDegerlendir(d, diplomasiOnHesap(d, b.ag), oyuncu, e.hedef);
      if (c.kabul) ittifakKur(d, oyuncu, e.hedef);
      olayEkle(d, { tur: "ittifak-cevap", devlet: oyuncu,
        metin: c.kabul ? `${ad} savunma ittifakı teklifinizi kabul etti. ${c.nedenler.join(" ")}` : `${ad} ittifak teklifinizi reddetti: ${c.nedenler.join(" ")}` });
      break;
    }
    case "ittifakBoz":
      ittifakBoz(d, d.ayarlar.oyuncu, e.hedef);
      olayEkle(d, { tur: "ittifak-bozuldu", devlet: d.ayarlar.oyuncu, metin: `${d.devletler[e.hedef].ad} ile ittifaktan çıktınız; ilişkiniz bozuldu (${DENGE.ETKI_ITTIFAK_BOZMA}).` });
      break;
    case "hediye": {
      const oyuncu = d.ayarlar.oyuncu;
      const puan = hediyePuani(d, diplomasiOnHesap(d, b.ag), oyuncu, e.hedef, e.miktar);
      d.devletler[oyuncu].hazine -= e.miktar;
      d.devletler[e.hedef].hazine += e.miktar;
      if (puan > 0) etkiEkle(d, oyuncu, e.hedef, "hediye", puan);
      olayEkle(d, { tur: "hediye", devlet: oyuncu, metin: `${d.devletler[e.hedef].ad}'na ${e.miktar} hediye gönderildi; ilişki +${puan}.` });
      break;
    }
    case "elciGonder": {
      const oyuncu = d.ayarlar.oyuncu;
      d.devletler[oyuncu].hazine -= DENGE.ELCI_BEDEL;
      d.elciler.push({ id: d.sonrakiElciId++, hedef: e.hedef, kalanGun: DENGE.ELCI_GUN });
      olayEkle(d, { tur: "elci", devlet: oyuncu, metin: `${d.devletler[e.hedef].ad}'na elçi gönderildi; ${DENGE.ELCI_GUN} gün sonra varacak. Bedel: −${DENGE.ELCI_BEDEL}.` });
      break;
    }
    case "ticaretTeklif": {
      const oyuncu = d.ayarlar.oyuncu, ad = d.devletler[e.hedef].ad;
      const c = ticaretDegerlendir(d, diplomasiOnHesap(d, b.ag), oyuncu, e.hedef);
      if (c.kabul) ticaretAnlasmasiKur(d, oyuncu, e.hedef);
      olayEkle(d, { tur: "ticaret-cevap", devlet: oyuncu,
        metin: c.kabul ? `${ad} ticaret anlaşması teklifinizi kabul etti. ${c.nedenler.join(" ")}` : `${ad} ticaret anlaşması teklifinizi reddetti: ${c.nedenler.join(" ")}` });
      break;
    }
    case "ticaretBoz":
      ticaretAnlasmasiBoz(d, d.ayarlar.oyuncu, e.hedef);
      olayEkle(d, { tur: "ticaret-bozuldu", devlet: d.ayarlar.oyuncu, metin: `${d.devletler[e.hedef].ad} ile ticaret anlaşmasından çıktınız.` });
      break;
    case "saldirmazlikTeklif": {
      const oyuncu = d.ayarlar.oyuncu, ad = d.devletler[e.hedef].ad;
      const c = saldirmazlikDegerlendir(d, diplomasiOnHesap(d, b.ag), oyuncu, e.hedef);
      if (c.kabul) saldirmazlikKur(d, oyuncu, e.hedef, e.ay);
      olayEkle(d, { tur: "saldirmazlik-cevap", devlet: oyuncu,
        metin: c.kabul ? `${ad} ${e.ay} aylık saldırmazlık paktı teklifinizi kabul etti. ${c.nedenler.join(" ")}` : `${ad} saldırmazlık paktı teklifinizi reddetti: ${c.nedenler.join(" ")}` });
      break;
    }
    case "orduTutum":
      orduBul(d, e.ordu)!.tutum = e.tutum;
      break;
    case "testIsgal": {
      const hedef = e.hedef === "birim" ? d.birimler[e.indeks] : d.sehirler[e.indeks];
      const sahip = "sahip" in hedef ? hedef.sahip : hedef.devlet;
      hedef.kontrol = e.devlet;
      hedef.isgalBaslangic = e.devlet === sahip ? null : d.gun;
      olayEkle(d, { tur: "test-isgal", devlet: e.devlet, metin: e.devlet === sahip
        ? `Test: askerî kontrol yasal sahibe döndü (${e.hedef} ${e.indeks}).`
        : `Test: ${d.devletler[e.devlet].ad} askerî kontrolü aldı (${e.hedef} ${e.indeks}).` });
      break;
    }
  }
}
