// Emir kuyruğu. Emirler verildiği anda doğrulanır (oyuncuya anında sebep gösterilir), turun başında
// yeniden doğrulanıp uygulanır (MASTER_SPEC §3.2, evre 1). Tur ilerlemeden dünya değişmez (AT-004).

import { olayEkle, type DunyaDurumu } from "./durum";

export type Emir =
  // İsteğe bağlı harcama: hazineyi aşamaz, hazine eksideyken yapılamaz (DEC-0002, AT-010)
  | { tur: "harca"; devlet: number; miktar: number; aciklama: string }
  // Test: N gün sonra oyuncu için kesinti planla (DEC-0006 altyapısının sınanması)
  | { tur: "testKesintisi"; gunSonra: number; neden: string };

export type Dogrulama = { gecerli: true } | { gecerli: false; neden: string };

function bekleyenHarcama(d: DunyaDurumu, devlet: number): number {
  let s = 0;
  for (const e of d.emirKuyrugu) if (e.tur === "harca" && e.devlet === devlet) s += e.miktar;
  return s;
}

export function emirDogrula(d: DunyaDurumu, e: Emir, kuyrukHaric = false): Dogrulama {
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
  }
}

/** Emri doğrular ve kuyruğa ekler. Dünya durumunu (kuyruk dışında) değiştirmez. */
export function emirVer(d: DunyaDurumu, e: Emir): Dogrulama {
  const s = emirDogrula(d, e);
  if (s.gecerli) d.emirKuyrugu.push(e);
  return s;
}

/** Turun başında: kuyruktaki emirleri sırayla yeniden doğrula ve uygula. */
export function emirleriUygula(d: DunyaDurumu): void {
  const kuyruk = d.emirKuyrugu;
  d.emirKuyrugu = [];
  for (const e of kuyruk) {
    const s = emirDogrula(d, e, true);
    if (!s.gecerli) {
      olayEkle(d, { tur: "emir-reddedildi", devlet: e.tur === "harca" ? e.devlet : d.ayarlar.oyuncu, metin: s.neden });
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
    }
  }
}
