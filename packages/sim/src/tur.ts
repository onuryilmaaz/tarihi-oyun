// Tur döngüsü: emirler uygulanır, sonra tur süresince günlük iç adımlar işlenir (DEC-0005).
// Kritik bir olay olursa tur o gün durur ve kararı oyuncu verir (DEC-0006).

import { olayEkle, type DunyaDurumu, type Kesinti, type OlayKaydi, type TurSuresi } from "./durum";
import { BOS_BAGLAM, emirleriUygula, type Baglam } from "./emirler";
import { gununSistemleri } from "./sistemler";
import { ayEkle, gundenTarih, tarihtenGun } from "./takvim";

export interface TurSonucu {
  turNo: number;
  baslangicGun: number;
  hedefGun: number;
  bitisGun: number;
  kesinti: Kesinti | null;
  yeniOlaylar: OlayKaydi[];
}

export function turHedefi(gun: number, sure: TurSuresi): number {
  if (sure === "hafta") return gun + 7;
  const ay = sure === "ay" ? 1 : sure === "ceyrek" ? 3 : 12;
  return tarihtenGun(ayEkle(gundenTarih(gun), ay));
}

/** Tek bir iç adım (bir gün). Kesinti olursa d.aktifKesinti dolar. */
export function gunIlerlet(d: DunyaDurumu, b: Baglam = BOS_BAGLAM): void {
  d.gun++;
  gununSistemleri(d, b);
  for (let i = 0; i < d.planliKesintiler.length && !d.aktifKesinti; i++) {
    if (d.planliKesintiler[i].gun === d.gun) {
      d.aktifKesinti = d.planliKesintiler[i];
      d.planliKesintiler.splice(i, 1);
      break;
    }
  }
}

export function turuIlerlet(d: DunyaDurumu, b: Baglam = BOS_BAGLAM): TurSonucu {
  const ilkOlay = d.sonrakiOlayId;
  const baslangicGun = d.gun;
  d.aktifKesinti = null;
  emirleriUygula(d, b);
  const hedefGun = turHedefi(d.gun, d.ayarlar.turSuresi);
  while (d.gun < hedefGun && !d.aktifKesinti) gunIlerlet(d, b);
  const kesinti = d.aktifKesinti as Kesinti | null; // döngüde gunIlerlet tarafından atanır
  if (kesinti) olayEkle(d, { tur: "kesinti", devlet: d.ayarlar.oyuncu, metin: kesinti.neden });
  d.turNo++;
  return {
    turNo: d.turNo,
    baslangicGun,
    hedefGun,
    bitisGun: d.gun,
    kesinti,
    yeniOlaylar: d.gunluk.filter((o) => o.id >= ilkOlay),
  };
}

export function turSuresiAyarla(d: DunyaDurumu, sure: TurSuresi): void {
  d.ayarlar.turSuresi = sure;
}
