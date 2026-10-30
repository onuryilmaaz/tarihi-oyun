import type { Istikrar, BarisDevirOzeti } from "@tarihi/sim";
// Ana iş parçacığı ↔ simülasyon Worker'ı mesaj protokolü.

import type { Alan, Degerlendirme, IliskiBileseni, TeknolojiId, YapiTuru, BarisKaydi, BarisTalebi, ButceOzeti, Dogrulama, Emir, KusatmaYontemi, MuharebeRaporu, OlayKaydi, RotaKirilimi, SenaryoVerisi, Tutum, TurSonucu, TurSuresi, YabanciOrdu } from "@tarihi/sim";

export type Istek = { id: number } & (
  | { tip: "yeniOyun"; senaryo: SenaryoVerisi; tohum: number; oyuncu?: string }
  | { tip: "yukle"; metin: string; senaryo: string }
  | { tip: "turSuresi"; sure: TurSuresi }
  // Yerel yönetim ayarı (7d): tur süresi gibi anında uygulanır, harcama yapmaz
  | { tip: "yonetim"; sehir?: number; acik?: boolean; butce?: number; altSinir?: number }
  | { tip: "emir"; emir: Emir }
  | { tip: "turuIlerlet" }
  | { tip: "kaydet" }
  | { tip: "rotaOnizle"; ordu: number; x: number; y: number; dugum: number }
  | { tip: "barisOnizle"; talep: BarisTalebi }
  | { tip: "testSimHatasi" } // geliştirici denemesi: tur ortasında hata gibi davranır (10b)
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
  ikmal: number;
  ikmalNedeni: string;
  maas: number;
  maasAksiyor: boolean;
  bolunebilir: boolean;
  birlesebilir: number[];
  kusatma: number | null;
  kusatilabilir: number[];
  kusatmaEmriBekliyor: boolean;
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
  kullanilabilirHazine: number;
  aylikMaas: number;
  butce: ButceOzeti;
  sehirYatirimlari: SehirYatirimi[]; // oyuncunun şehirleri (TASK-0008/5b)
  teknoloji: TeknolojiOzeti; // TASK-0008/5c
  hukumdar: HukumdarOzeti | null; // oyuncunun hükümdarı (7a); null = halef bekleniyor
  verasetSecimi: { onceki: string; veraset: string; adaylar: (HukumdarOzeti & { tarihi: boolean; gelenek: boolean })[] } | null;
  veraset: string; tarihiHalef: string | null;
  din: string; kultur: string; // oyuncu devletinin resmî dini ve baskın kültürü (7b)
  istikrar: (Istikrar & { asayis: number; gerekenAsker: number; bagisUygun: boolean; bagisNedeni: string | null })[];
  sehirNufuslari: { nufus: number; gruplar: [string, string, number][] }[]; // şehir başına din × kültür
  devletDinleri: string[]; // harita modu için
  yerelYonetim: { butce: number; altSinir: number; harcanan: number }; // 7d
  // 8a — deniz
  denizBolgeleri: { ad: string; kontrol: number | null; komsu: number[] }[];
  limanlar: number[]; // şehir → bölge (−1: liman değil)
  donanmalar: { id: number; ad: string; bolge: number; kadirga: number; kalyon: number; moral: number; rota: number[]; kalanGun: number;
    kapasite: number; yuk: { ad: string; asker: number } | null; cikarmaHedef: number | null; emirBekliyor: boolean;
    binebilir: { id: number; ad: string; asker: number }[] }[];
  yabanciDonanmalar: { id: number; ad: string; devlet: number; bolge: number; yaklasikGemi: number }[];
  ticaret: ({ taban: number; gelir: number; yuzde: number; nedenler: string[] } | null)[]; // kendi liman şehirleri (8b)
  ambargolarim: number[]; bizeAmbargo: number[];
  // 8c — casusluk
  casusGorevleri: { hedef: number; tur: string; ad: string; sehir: number | null; kalanGun: number; emir: boolean }[];
  istihbarat: { hedef: number; tur: string; kalanGun: number }[];
  diplomatikRapor: Record<number, { muttefikleri: number[]; savaslari: number[]; enKotu: [number, number][]; enIyi: [number, number][]; hazine: number }>;
  gemiInsalari: { sehir: number; gemi: string; adet: number; kalanGun: number; emir: boolean }[];
  devletKulturleri: string[];
  iskanlar: { kaynak: number; hedef: number; miktar: number; kalanGun: number; emir: boolean }[];
  diplomasi: (DiplomasiKarti | null)[]; // devlet başına; oyuncunun kendisi null (TASK-0009/6a)
  saldirganlik: number; // oyuncunun saldırganlığı
  barisTeklifleri: { id: number; devlet: number; gerekce: string; size: boolean; birimler: number[]; sehirler: number[]; kalanGun: number; cevap: boolean | null }[]; // 6c
  toplamaKurali: { bedelYuzde: number; gun: number }; // teknolojiyle değişir (Asker Kayıt Defterleri)
  askerSehirleri: { indeks: number; ad: string; insanGucu: number; uygun: boolean; ayaklanma: boolean }[];
  toplamalar: { id: number | null; sehir: string; asker: number; kalanGun: number; bekliyor: boolean; emir: boolean }[];
  planliKesinti: { tarih: string; neden: string }[];
  hash: string;
  ordular: OrduOzeti[];
  yabanciOrdular: YabanciOrdu[]; // yalnızca görünenler; kesin asker sayısı yok (AT-013)
  savaslar: { id: number; karsi: number; baslangic: string; saldiran: boolean; skor: number; alinan: number; kaybedilen: number; toplam: number; birimler: number[]; sehirler: number[] }[];
  kusatmalar: { sehir: number; devlet: number; savunan: number; yontem: KusatmaYontemi; gun: number; erzak: number; gucYeterli: boolean | null }[];
  sehirDurumlari: { devlet: number; kontrol: number; baskent: boolean; sur: number; garnizon: number; garnizonTahmin: boolean }[];
  birimSahipleri: number[];
  isgalHazirliklari: { birim: number; gun: number }[];
  barislar: BarisKaydi[];
  raporlar: MuharebeRaporu[]; // oyuncunun taraf olduğu son muharebeler
  birimIsgal: [number, number, number][]; // [birim, kontrol eden devlet, başlangıç günü]
  sehirIsgal: [number, number, number][];
}

export type Yanit =
  | { id: number; tamam: true; ozet: Ozet; sonuc?: TurSonucu; sureMs?: number; metin?: string; dogrulama?: Dogrulama; rota?: RotaOnizleme; baris?: { puan: number; skor: number; dogrulama: Dogrulama; devir: BarisDevirOzeti | null } }
  | { id: number; tamam: false; hata: string; yigin?: string; bozuk?: boolean };

type IstekGovdesi = Istek extends infer T ? (T extends { id: number } ? Omit<T, "id"> : never) : never;

/** Worker'a söz (promise) tabanlı erişim. İstekler sırayla işlenir. */
/** Simülasyon hatası: yığın bilgisi ve dünyanın güvenilirliğini taşır (10b). */
export class SimHatasi extends Error {
  constructor(mesaj: string, readonly yigin?: string, readonly bozuk = false) { super(mesaj); this.name = "SimHatasi"; }
}

export class SimIstemcisi {
  private isci!: Worker;
  private sonrakiId = 1;
  private bekleyen = new Map<number, (y: Yanit) => void>();
  /** İşçinin kendisi çöktüğünde (ör. bellek) çağrılır; bekleyen istekler hatayla sonlanır. */
  coktuginde?: (mesaj: string) => void;

  constructor() { this.kur(); }

  private kur() {
    this.isci = new Worker(new URL("./sim-isci.ts", import.meta.url), { type: "module" });
    this.isci.onmessage = (e: MessageEvent<Yanit>) => {
      const cozum = this.bekleyen.get(e.data.id);
      this.bekleyen.delete(e.data.id);
      cozum?.(e.data);
    };
    this.isci.onerror = (e) => {
      e.preventDefault();
      const mesaj = `Simülasyon işçisi çöktü: ${e.message || "bilinmeyen hata"}`;
      for (const [id, cozum] of this.bekleyen) cozum({ id, tamam: false, hata: mesaj, bozuk: true });
      this.bekleyen.clear();
      this.coktuginde?.(mesaj);
    };
  }

  /** Çöken ya da güvenilmez işçiyi kapatıp yenisini başlatır (ardından yeniOyun/yukle gönderilmelidir). */
  yenidenBaslat() {
    this.isci.terminate();
    for (const [id, cozum] of this.bekleyen) cozum({ id, tamam: false, hata: "Simülasyon yeniden başlatıldı.", bozuk: true });
    this.bekleyen.clear();
    this.kur();
  }

  async gonder(govde: IstekGovdesi): Promise<Extract<Yanit, { tamam: true }>> {
    const id = this.sonrakiId++;
    const y = await new Promise<Yanit>((cozum) => {
      this.bekleyen.set(id, cozum);
      this.isci.postMessage({ id, ...govde } as Istek);
    });
    if (!y.tamam) throw new SimHatasi(y.hata, y.yigin, y.bozuk ?? false);
    return y;
  }
}

export interface YatirimSecenegi {
  yapi: YapiTuru;
  ad: string;
  seviye: number;
  enYuksek: number;
  maliyet: number | null; // en yüksek seviyede null
  sure: number;
  gelirArtisi: number; // aylık; sur için 0
  uygun: boolean;
  neden: string | null;
}

export interface HukumdarOzeti { ad: string; hanedan: string; yas: number; yonetim: number; askerlik: number; diplomasi: number; mesruiyet: number; kurgusal: boolean }

export interface DiplomasiKarti {
  hukumdar: HukumdarOzeti | null;
  bakisi: number; // onun size bakışı
  bakisimiz: number; // sizin ona bakışınız
  bilesenler: IliskiBileseni[]; // onun bakışının bileşenleri
  muttefik: boolean;
  muttefikleri: number[]; // bu devletin müttefikleri (savaş ilanında çağrılabilir)
  savasta: boolean;
  komsu: boolean;
  ittifak: Degerlendirme; // teklif etseniz bugünkü tahmini cevap
  hediyePuanBedeli: number;
  hediyeKalan: number; // eklenebilecek en çok hediye puanı
  ticaretVar: boolean; // TASK-0017 (4/4)
  ticaret: Degerlendirme; // teklif etseniz bugünkü tahmini cevap
  saldirmazlikVar: boolean;
  saldirmazlik: Degerlendirme;
  bekleyen: "ittifakTeklif" | "ittifakBoz" | "ticaretTeklif" | "ticaretBoz" | "saldirmazlikTeklif" | null;
}

export interface TeknolojiKarti {
  id: TeknolojiId;
  ad: string;
  alan: Alan;
  alanAdi: string;
  onKosul: string[]; // ad olarak
  etki: string;
  bedel: number;
  sure: number;
  durum: "biliniyor" | "suruyor" | "emir" | "acik" | "kapali";
  kalanGun: number | null;
  uygun: boolean;
  neden: string | null;
}

export interface TeknolojiOzeti {
  kartlar: TeknolojiKarti[];
  yuva: number; // aynı anda en çok araştırma
}

export interface SehirYatirimi {
  indeks: number;
  ad: string;
  aylikGelir: number;
  yonetici: boolean; // yerel yönetici açık mı (7d)
  insaat: { yapi: YapiTuru; ad: string; hedef: number; kalanGun: number; emir: boolean; durdu: boolean } | null;
  secenekler: YatirimSecenegi[];
}
