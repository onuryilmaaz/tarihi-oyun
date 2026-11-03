// TASK-0044: devletsiz arazi kalıcı olarak alınır; yabancı arazide savaş/barış kuralı sürer.
import { describe, expect, it } from "vitest";
import { agHazirla, baslangicDurumu, degismezler, DENGE, durumOzeti, isgalleriIlerlet, kaydet, yukle, type SenaryoVerisi } from "../src";
const S: SenaryoVerisi = {
  id: "devletsiz", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
  devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }],
  birimler: [{ devlet: "a" }, { devlet: "b" }, { devlet: null }, { devlet: "b" }],
  sehirler: [0, 1].map((birim) => ({ ad: `Şehir ${birim}`, devlet: birim ? "b" : "a", birim, dugum: birim, baskent: true, nufus: 10000 })),
  ordular: [{ ad: "A", devlet: "a", asker: 1000, dugum: 2, x: 20000, y: 0 }],
  ag: { dugumler: [0, 1, 2, 3].map((b) => ({ b, x: b * 10000, y: 0, z: 100, kx: 10000, ky: 10000 })), kenarlar: [] },
};
const B = { ag: agHazirla(S.ag!) };
const yeni = () => { const d = baslangicDurumu(S, { tohum: 1453 }); d.ordular = d.ordular.filter((o) => o.ad === "A"); return d; };
const bekle = (d: ReturnType<typeof yeni>, gun = 1) => { for (let i = 0; i < gun; i++) { d.gun++; isgalleriIlerlet(d, B); } };

describe("devletsiz fetih", () => {
  it("3 gün bekleme ve kayıt devamı sonunda sahiplik/kontrol kazanılır; tekrar fetih olayı çıkmaz", () => {
    const d = yeni(); bekle(d, DENGE.ISGAL_GUN - 1);
    expect(d.birimler[2]).toMatchObject({ sahip: -1, kontrol: -1 });
    const kopya = yukle(kaydet(d), d.senaryo);
    bekle(d); bekle(kopya);
    expect(durumOzeti(kopya)).toBe(durumOzeti(d));
    expect(d.birimler[2]).toMatchObject({ sahip: 0, kontrol: 0, isgalBaslangic: null });
    expect(d.isgalHazirliklari).toEqual([]);
    bekle(d, 5);
    expect(d.gunluk.filter((o) => o.tur === "arazi-isgal")).toHaveLength(1);
    expect(degismezler(d)).toEqual([]);
  });
  it("yürüyüş, geri çekilme, muharebe ve çekişme bekleyişi sıfırlar; yeniden üç gün gerekir", () => {
    for (const engel of ["yuruyus", "cekilme", "muharebe", "cekisme"]) {
      const d = yeni(), o = d.ordular[0]; bekle(d, 2);
      if (engel === "yuruyus") o.rota = [{ d: 2, x: o.x + 100, y: 0, m: 100 }];
      if (engel === "cekilme") o.cekiliyor = true;
      if (engel === "muharebe") o.muharebe = 1;
      if (engel === "cekisme") d.ordular.push({ ...structuredClone(o), id: d.sonrakiOrduId++, devlet: 1 });
      bekle(d);
      expect(d.isgalHazirliklari).toEqual([]);
      expect(d.birimler[2].sahip).toBe(-1);
      o.rota = []; o.cekiliyor = false; o.muharebe = null; d.ordular = [o];
      bekle(d, 2); expect(d.birimler[2].sahip).toBe(-1);
      bekle(d); expect(d.birimler[2].sahip).toBe(0);
    }
  });
  it("aynı devletin iki ordusu bekleyişi hızlandırmaz; yabancı arazi savaş olmadan alınmaz", () => {
    const d = yeni(); d.ordular.push({ ...structuredClone(d.ordular[0]), id: d.sonrakiOrduId++ });
    bekle(d, 2); expect(d.birimler[2].sahip).toBe(-1);
    bekle(d); expect(d.birimler[2].sahip).toBe(0);
    for (const o of d.ordular) o.dugum = 3;
    bekle(d, 5); expect(d.birimler[3]).toMatchObject({ sahip: 1, kontrol: 1 });
    d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: 0, savunan: 1, baslangic: d.gun });
    bekle(d, 3); expect(d.birimler[3]).toMatchObject({ sahip: 1, kontrol: 0 });
  });
});
