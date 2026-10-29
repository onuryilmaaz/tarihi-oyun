// Emir kuyruğu. Emirler verildiği anda doğrulanır (oyuncuya anında sebep gösterilir), turun başında
// yeniden doğrulanıp uygulanır (MASTER_SPEC §3.2, evre 1). Tur ilerlemeden dünya değişmez (AT-004).

import { olayEkle, type DunyaDurumu, type OrduDurumu, type Tutum } from "./durum";
import { savasta } from "./savas";
import { orduKonumu, rotaBul, type HareketAgi, type RotaSonucu } from "./hareket";
import { tarihMetni } from "./takvim";

/** Statik senaryo verisi (dünya durumuna girmez, kayda yazılmaz). */
export interface Baglam {
  ag: HareketAgi | null;
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
  | { tur: "savasIlan"; devlet: number; hedef: number }
  // Geri çekilme tutumu (DEC-0008)
  | { tur: "orduTutum"; ordu: number; tutum: Tutum };

export type Dogrulama = { gecerli: true } | { gecerli: false; neden: string };

function bekleyenHarcama(d: DunyaDurumu, devlet: number): number {
  let s = 0;
  for (const e of d.emirKuyrugu) if (e.tur === "harca" && e.devlet === devlet) s += e.miktar;
  return s;
}

const orduBul = (d: DunyaDurumu, id: number): OrduDurumu | undefined => d.ordular.find((o) => o.id === id);

export function emirDogrula(d: DunyaDurumu, e: Emir, b: Baglam = BOS_BAGLAM, kuyrukHaric = false): Dogrulama {
  switch (e.tur) {
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
      if (!b.ag) return { gecerli: false, neden: "Hareket ağı yüklenmedi." };
      if (![e.x, e.y, e.dugum].every(Number.isSafeInteger)) return { gecerli: false, neden: "Hedef koordinatı geçersiz." };
      const r = orduRotasi(d, b.ag, o, e, !kuyrukHaric);
      return r.gecerli ? { gecerli: true } : { gecerli: false, neden: r.neden };
    }
    case "orduDur":
      return orduBul(d, e.ordu) ? { gecerli: true } : { gecerli: false, neden: "Ordu bulunamadı." };
    case "savasIlan":
      if (!d.devletler[e.devlet] || !d.devletler[e.hedef]) return { gecerli: false, neden: "Devlet bulunamadı." };
      if (e.devlet === e.hedef) return { gecerli: false, neden: "Bir devlet kendine savaş ilan edemez." };
      if (savasta(d, e.devlet, e.hedef)) return { gecerli: false, neden: `${d.devletler[e.hedef].ad} ile zaten savaştasınız.` };
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
      olayEkle(d, { tur: "emir-reddedildi", devlet: "devlet" in e ? e.devlet : d.ayarlar.oyuncu, metin: s.neden });
      continue;
    }
    switch (e.tur) {
      case "harca":
        d.devletler[e.devlet].hazine -= e.miktar;
        olayEkle(d, { tur: "harcama", devlet: e.devlet, metin: `${e.aciklama}: −${e.miktar}` });
        break;
      case "testKesintisi":
        d.planliKesintiler.push({ gun: d.gun + e.gunSonra, neden: e.neden });
        break;
      case "orduHedef": {
        const o = orduBul(d, e.ordu)!;
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
        if (o.rota.length) olayEkle(d, { tur: "ordu-durdu", devlet: o.devlet, metin: `${o.ad} durduruldu.` });
        orduyuDurdur(o);
        break;
      }
      case "savasIlan":
        d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: e.devlet, savunan: e.hedef, baslangic: d.gun });
        olayEkle(d, { tur: "savas-ilani", devlet: e.devlet, metin: `${d.devletler[e.devlet].ad}, ${d.devletler[e.hedef].ad}'na savaş ilan etti.` });
        break;
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
}
