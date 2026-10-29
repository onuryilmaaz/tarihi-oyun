// Ana iş parçacığı ↔ simülasyon Worker'ı mesaj protokolü.

import type { Dogrulama, Emir, OlayKaydi, SenaryoVerisi, TurSonucu, TurSuresi } from "@tarihi/sim";

export type Istek = { id: number } & (
  | { tip: "yeniOyun"; senaryo: SenaryoVerisi; tohum: number; oyuncu?: string }
  | { tip: "yukle"; metin: string; senaryo: string }
  | { tip: "turSuresi"; sure: TurSuresi }
  | { tip: "emir"; emir: Emir }
  | { tip: "turuIlerlet" }
  | { tip: "kaydet" }
);

export interface Ozet {
  gun: number;
  tarih: string;
  turNo: number;
  turSuresi: TurSuresi;
  turSuresiAdi: string;
  oyuncu: { indeks: number; id: string; ad: string; hazine: number };
  gunluk: OlayKaydi[];
  bekleyenEmir: number;
  planliKesinti: { tarih: string; neden: string }[];
  hash: string;
}

export type Yanit =
  | { id: number; tamam: true; ozet: Ozet; sonuc?: TurSonucu; sureMs?: number; metin?: string; dogrulama?: Dogrulama }
  | { id: number; tamam: false; hata: string };

type IstekGovdesi = Istek extends infer T ? (T extends { id: number } ? Omit<T, "id"> : never) : never;

/** Worker'a söz (promise) tabanlı erişim. İstekler sırayla işlenir. */
export class SimIstemcisi {
  private isci = new Worker(new URL("./sim-isci.ts", import.meta.url), { type: "module" });
  private sonrakiId = 1;
  private bekleyen = new Map<number, (y: Yanit) => void>();

  constructor() {
    this.isci.onmessage = (e: MessageEvent<Yanit>) => {
      const cozum = this.bekleyen.get(e.data.id);
      this.bekleyen.delete(e.data.id);
      cozum?.(e.data);
    };
  }

  async gonder(govde: IstekGovdesi): Promise<Extract<Yanit, { tamam: true }>> {
    const id = this.sonrakiId++;
    const y = await new Promise<Yanit>((cozum) => {
      this.bekleyen.set(id, cozum);
      this.isci.postMessage({ id, ...govde } as Istek);
    });
    if (!y.tamam) throw new Error(y.hata);
    return y;
  }
}
