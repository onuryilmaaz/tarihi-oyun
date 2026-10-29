import { baslangicDurumu, durumOzeti, type DunyaDurumu, type SenaryoVerisi } from "../src";

// Küçük yapay senaryo: 3 devlet, 12 birim, 6 şehir. Gerçek tarihî veri değildir.
export const TEST_SENARYOSU: SenaryoVerisi = {
  id: "test",
  surum: "1",
  baslangic: { yil: 1453, ay: 4, gun: 1 },
  varsayilanOyuncu: "a",
  devletler: [{ id: "a", ad: "Devlet A" }, { id: "b", ad: "Devlet B" }, { id: "c", ad: "Devlet C" }],
  birimler: ["a", "a", "a", "a", "a", "b", "b", "b", "c", "c", null, null].map((devlet) => ({ devlet })),
  sehirler: [
    { ad: "A1", devlet: "a", birim: 0, baskent: true, nufus: 50000 },
    { ad: "A2", devlet: "a", birim: 2, baskent: false, nufus: 10000 },
    { ad: "B1", devlet: "b", birim: 5, baskent: true, nufus: 40000 },
    { ad: "B2", devlet: "b", birim: 7, baskent: false, nufus: 8000 },
    { ad: "C1", devlet: "c", birim: 8, baskent: true, nufus: 30000 },
    { ad: "C2", devlet: "c", birim: 9, baskent: false, nufus: 5000 },
  ],
};

export const yeniDurum = (tohum = 1453): DunyaDurumu => baslangicDurumu(TEST_SENARYOSU, { tohum });

/** Tur sayacı, oyuncu ayarı ve olay günlüğü hariç dünya özeti: farklı tur süreleriyle aynı noktaya
 *  gelindiğinde karşılaştırmak için. */
export const dunyaOzeti = (d: DunyaDurumu): string =>
  durumOzeti({
    ...d, turNo: 0, ayarlar: { ...d.ayarlar, turSuresi: "ay" },
    gunluk: [], sonrakiOlayId: 0, planliKesintiler: [], aktifKesinti: null,
  });
