// TASK-0051: AI gemi üretimi ve çıkarma
import { describe, expect, it } from "vitest";
import { agHazirla, baslangicDurumu, degismezler, DENGE, gunIlerlet, yzCikarmalari, yzGemiInsalari, type SenaryoVerisi } from "../src";

// İki ada: aralarında kara yolu yok, ortak deniz z0. A oyuncu, B AI.
const S: SenaryoVerisi = {
  id: "yz-deniz-test", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
  devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }],
  birimler: [{ devlet: "a" }, { devlet: "b" }],
  sehirler: [
    { ad: "A1", devlet: "a", birim: 0, dugum: 0, x: 0, y: 0, baskent: true, nufus: 20000 },
    { ad: "B1", devlet: "b", birim: 1, dugum: 1, x: 30000, y: 0, baskent: true, nufus: 40000 },
  ],
  ordular: [{ ad: "B Ordusu", devlet: "b", asker: 3000, dugum: 1, x: 30000, y: 0 }],
  ag: { dugumler: [0, 1].map((b) => ({ b, x: b * 30000, y: 0, kx: 10000, ky: 10000, z: 100 })), kenarlar: [] },
  deniz: {
    bolgeler: [{ id: "z0", ad: "Ara Deniz", lon: 1, lat: 0, komsu: [] }],
    limanlar: { z0: ["A1", "B1"] },
    bogazlar: [],
    donanmalar: [{ devlet: "b", bolge: "z0", ad: "B Donanması", kadirga: 20, kalyon: 0 }],
  },
};
const B = { ag: agHazirla(S.ag!), sehirKonumlari: S.sehirler.map((s) => ({ x: s.x!, y: s.y! })) };

describe("AI denizcilik (TASK-0051)", () => {
  it("savaştaki AI, kara yolu olmayan düşman limanına çıkarma yapar ve kuşatmaya başlar", () => {
    const d = baslangicDurumu(S, { tohum: 2 });
    d.ordular = d.ordular.filter((o) => o.devlet === 1);
    d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: 1, savunan: 0, baslangic: d.gun });
    while ((d.gun + 3) % DENGE.YZ_SEFER_ARALIGI !== 0) d.gun++;
    yzCikarmalari(d, B);
    const f = d.donanmalar.find((x) => x.devlet === 1)!;
    expect(f.yuk?.asker).toBe(3000);
    expect(f.cikarmaHedef).toBe(0);
    for (let i = 0; i < 10 && f.yuk; i++) { gunIlerlet(d, B); d.aktifKesinti = null; }
    expect(f.yuk).toBeNull();
    expect(d.ordular.find((o) => o.devlet === 1)?.dugum).toBe(0);
    expect(d.kusatmalar.some((k) => k.devlet === 1 && k.sehir === 0)).toBe(true);
    expect(degismezler(d)).toEqual([]);
  });

  it("donanması hedefin altındaki AI yedeğini bozmadan gemi yapar; parası yoksa yapmaz", () => {
    const d = baslangicDurumu(S, { tohum: 2 });
    d.donanmalar = d.donanmalar.filter((f) => f.devlet !== 1);
    d.devletler[1].hazine = 5000;
    yzGemiInsalari(d, B);
    const g = d.gemiInsalari.find((x) => x.devlet === 1);
    expect(g?.sehir).toBe(1);
    expect(d.devletler[1].hazine).toBeGreaterThanOrEqual(0);
    const e = baslangicDurumu(S, { tohum: 2 });
    e.donanmalar = [];
    e.devletler[1].hazine = 0;
    yzGemiInsalari(e, B);
    expect(e.gemiInsalari).toEqual([]);
  });
});
