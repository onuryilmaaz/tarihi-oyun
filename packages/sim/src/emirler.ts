// Emir kuyruğu. Emirler verildiği anda doğrulanır (oyuncuya anında sebep gösterilir), turun başında
// yeniden doğrulanıp uygulanır (MASTER_SPEC §3.2, evre 1). Tur ilerlemeden dünya değişmez (AT-004).

import { olayEkle, type DunyaDurumu, type OrduDurumu } from "./durum";
import { orduKonumu, rotaBul, type HareketAgi } from "./hareket";
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
  | { tur: "testIsgal"; hedef: "birim" | "sehir"; indeks: number; devlet: number };

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
      const r = rotaBul(d, b.ag, { ...o, ...orduKonumu(o), ilerleme: 0, rota: [] }, e);
      return r.gecerli ? { gecerli: true } : { gecerli: false, neden: r.neden };
    }
    case "orduDur":
      return orduBul(d, e.ordu) ? { gecerli: true } : { gecerli: false, neden: "Ordu bulunamadı." };
    case "testIsgal": {
      const liste = e.hedef === "birim" ? d.birimler : d.sehirler;
      if (!Number.isSafeInteger(e.indeks) || !liste[e.indeks]) return { gecerli: false, neden: "Hedef bulunamadı." };
      if (!d.devletler[e.devlet]) return { gecerli: false, neden: "Devlet bulunamadı." };
      return { gecerli: true };
    }
  }
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
  const kuyruk = d.emirKuyrugu;
  d.emirKuyrugu = [];
  for (const e of kuyruk) {
    const s = emirDogrula(d, e, b, true);
    if (!s.gecerli) {
      olayEkle(d, { tur: "emir-reddedildi", devlet: e.tur === "harca" || e.tur === "testIsgal" ? e.devlet : d.ayarlar.oyuncu, metin: s.neden });
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
