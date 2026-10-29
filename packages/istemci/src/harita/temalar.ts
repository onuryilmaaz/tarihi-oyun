// Görsel yön denemeleri (OPEN-021). Hiçbiri seçilmiş değildir; kullanıcı karşılaştırır.

export interface Tema {
  id: string;
  ad: string;
  aciklama: string;
  deniz: string;
  bosKara: string; // devlete atanmamış kara
  doygunluk: number;
  aciklik: number;
  oynama: number; // devletler arası açıklık farkı
  kagit: boolean;
  vurgu: number; // seçimde beyaza karışım
  araziSinir: { renk: string; opak: number; kalinlik: number };
  devletSinir: { renk: string; opak: number; kalinlik: number };
  kiyi: { renk: string; opak: number; kalinlik: number };
  nehir: { renk: string; opak: number; kalinlik: number };
  secim: string;
  sehir: { dolgu: string; kenar: string };
  baskent: { dolgu: string; kenar: string };
  etiket: {
    devletFont: string; devletAgirlik: number; devletRenk: string; devletAralik: number; buyukHarf: boolean;
    sehirFont: string; sehirAgirlik: number; sehirRenk: string; sehirBoyut: number; hale: string;
    italik: boolean;
  };
  arayuz: "acik" | "koyu";
}

export const TEMALAR: Tema[] = [
  {
    id: "atlas",
    ad: "Tarihî atlas",
    aciklama: "Parşömen dokusu, soluk renkler, serifli yazı",
    deniz: "#b4c6c2",
    bosKara: "#e6dcc3",
    doygunluk: 0.34,
    aciklik: 0.72,
    oynama: 0.05,
    kagit: true,
    vurgu: 0.35,
    araziSinir: { renk: "#6b5443", opak: 0.4, kalinlik: 0.8 },
    devletSinir: { renk: "#4a3426", opak: 0.9, kalinlik: 1.7 },
    kiyi: { renk: "#55706f", opak: 0.85, kalinlik: 1.1 },
    nehir: { renk: "#5f8790", opak: 0.75, kalinlik: 1.0 },
    secim: "#fff6dc",
    sehir: { dolgu: "#3a2a1e", kenar: "#f4ead4" },
    baskent: { dolgu: "#8a2a1e", kenar: "#f4ead4" },
    etiket: {
      devletFont: "Cinzel", devletAgirlik: 600, devletRenk: "rgba(58,40,28,0.82)", devletAralik: 0.14,
      buyukHarf: true, sehirFont: "Cormorant Garamond", sehirAgirlik: 700, sehirRenk: "#2b1f16", sehirBoyut: 14,
      hale: "rgba(240,230,205,0.85)", italik: true,
    },
    arayuz: "koyu",
  },
  {
    id: "modern",
    ad: "Modern siyasi",
    aciklama: "Temiz, doygun renkler, sans-serif yazı",
    deniz: "#c9dce8",
    bosKara: "#e9e9e6",
    doygunluk: 0.5,
    aciklik: 0.68,
    oynama: 0.06,
    kagit: false,
    vurgu: 0.4,
    araziSinir: { renk: "#ffffff", opak: 0.7, kalinlik: 0.8 },
    devletSinir: { renk: "#3d4249", opak: 0.85, kalinlik: 1.3 },
    kiyi: { renk: "#7a9db3", opak: 1, kalinlik: 1 },
    nehir: { renk: "#86afc9", opak: 0.9, kalinlik: 1 },
    secim: "#111111",
    sehir: { dolgu: "#2a2f36", kenar: "#ffffff" },
    baskent: { dolgu: "#c0392b", kenar: "#ffffff" },
    etiket: {
      devletFont: "Inter", devletAgirlik: 700, devletRenk: "rgba(35,40,48,0.78)", devletAralik: 0.08,
      buyukHarf: true, sehirFont: "Inter", sehirAgirlik: 500, sehirRenk: "#1f2328", sehirBoyut: 12,
      hale: "rgba(255,255,255,0.9)", italik: false,
    },
    arayuz: "acik",
  },
  {
    id: "gece",
    ad: "Gece",
    aciklama: "Koyu deniz, derin renkler, açık sınırlar",
    deniz: "#0f1c26",
    bosKara: "#2b2a27",
    doygunluk: 0.32,
    aciklik: 0.34,
    oynama: 0.05,
    kagit: false,
    vurgu: 0.25,
    araziSinir: { renk: "#000000", opak: 0.35, kalinlik: 0.8 },
    devletSinir: { renk: "#e6d6b4", opak: 0.75, kalinlik: 1.2 },
    kiyi: { renk: "#5d8696", opak: 0.9, kalinlik: 1 },
    nehir: { renk: "#3b6b80", opak: 0.9, kalinlik: 1 },
    secim: "#ffd98a",
    sehir: { dolgu: "#e8dcc4", kenar: "#14130f" },
    baskent: { dolgu: "#f0b54a", kenar: "#14130f" },
    etiket: {
      devletFont: "Cinzel", devletAgirlik: 600, devletRenk: "rgba(240,228,204,0.8)", devletAralik: 0.14,
      buyukHarf: true, sehirFont: "Inter", sehirAgirlik: 500, sehirRenk: "#efe6d2", sehirBoyut: 12,
      hale: "rgba(8,10,12,0.75)", italik: false,
    },
    arayuz: "koyu",
  },
];
