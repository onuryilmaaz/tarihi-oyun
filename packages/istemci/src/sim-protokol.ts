// Ana iş parçacığı ↔ simülasyon Worker'ı mesaj protokolü.

import type { Dogrulama, Emir, MuharebeRaporu, OlayKaydi, RotaKirilimi, SenaryoVerisi, Tutum, TurSonucu, TurSuresi, YabanciOrdu } from "@tarihi/sim";

export type Istek = { id: number } & (
  | { tip: "yeniOyun"; senaryo: SenaryoVerisi; tohum: number; oyuncu?: string }
  | { tip: "yukle"; metin: string; senaryo: string }
  | { tip: "turSuresi"; sure: TurSuresi }
  | { tip: "emir"; emir: Emir }
  | { tip: "turuIlerlet" }
  | { tip: "kaydet" }
  | { tip: "rotaOnizle"; ordu: number; x: number; y: number; dugum: number }
);

export interface OrduOzeti {
  id: number;
  ad: string;
  devlet: number;
  asker: number;
  x: number; // anlık konum, Miller × 10⁴
  y: number;
  yuruyor: boolean;
  rota: [number, number][]; // kalan rota noktaları (anlık konumdan sonra)
  kalanGun: number;
  varisTarihi: string | null;
  moral: number; // binde
  tutum: Tutum;
  muharebede: boolean;
  cekiliyor: boolean;
}

export interface RotaOnizleme {
  gecerli: boolean;
  neden?: string;
  noktalar?: [number, number][];
  gun?: number;
  varisTarihi?: string;
  kirilim?: RotaKirilimi;
}

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
  ordular: OrduOzeti[];
  yabanciOrdular: YabanciOrdu[]; // yalnızca görünenler; kesin asker sayısı yok (AT-013)
  savaslar: { karsi: number; baslangic: string; saldiran: boolean }[];
  raporlar: MuharebeRaporu[]; // oyuncunun taraf olduğu son muharebeler
  birimIsgal: [number, number, number][]; // [birim, kontrol eden devlet, başlangıç günü]
  sehirIsgal: [number, number, number][];
}

export type Yanit =
  | { id: number; tamam: true; ozet: Ozet; sonuc?: TurSonucu; sureMs?: number; metin?: string; dogrulama?: Dogrulama; rota?: RotaOnizleme }
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
