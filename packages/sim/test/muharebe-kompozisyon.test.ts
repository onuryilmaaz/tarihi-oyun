// TASK-0021 (1/4, DEC-0070): muharebe raporunda birim türü kırılımı.
import { describe, expect, it } from "vitest";
import { baslangicDurumu, degismezler, muharebeGunleri, muharebeleriBaslat, type DunyaDurumu, type SenaryoVerisi } from "../src";

// İki devletli, başkentlerinde garnizon ordusu kurulacak küçük senaryo (dugum/x/y tanımlı; bkz. yz-savas.test.ts deseni).
const S: SenaryoVerisi = {
  id: "muharebe-kompozisyon", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
  devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }],
  birimler: ["a", "b"].map((devlet) => ({ devlet })),
  sehirler: [
    { ad: "A1", devlet: "a", birim: 0, dugum: 0, x: 0, y: 0, baskent: true, nufus: 40000 },
    { ad: "B1", devlet: "b", birim: 1, dugum: 1, x: 10000, y: 0, baskent: true, nufus: 40000 },
  ],
  ag: { dugumler: [0, 1].map((b) => ({ b, x: b * 10000, y: 0, kx: 10000, ky: 10000, z: 100 })),
    kenarlar: [{ a: 0, b: 1, mx: 5000, my: 0, da: 5000, db: 5000, n: 0, g: 0 }] },
};
const yeniDurum = () => baslangicDurumu(S, { tohum: 1453 });
const devlet = (d: DunyaDurumu, id: string) => d.devletler.findIndex((v) => v.id === id);

/** A tamamen süvari, B tamamen piyade toplar; aynı düğümde savaşa girer, muharebe bitene dek ilerletilir. */
function suvariPiyadeMuharebesi() {
  const d = yeniDurum();
  const a = devlet(d, "a"), b = devlet(d, "b");
  const ao = d.ordular.find((o) => o.devlet === a)!, bo = d.ordular.find((o) => o.devlet === b)!;
  ao.asker = 20000; ao.kompozisyon = { piyade: 0, okcu: 0, suvari: 20000 };
  bo.asker = 20000; bo.kompozisyon = { piyade: 20000, okcu: 0, suvari: 0 };
  bo.dugum = ao.dugum; bo.x = ao.x; bo.y = ao.y;
  d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: a, savunan: b, baslangic: d.gun });
  muharebeleriBaslat(d);
  expect(d.muharebeler).toHaveLength(1);
  for (let i = 0; i < 60 && d.muharebeler.length; i++) { d.gun++; muharebeGunleri(d, null); }
  expect(d.muharebeler).toHaveLength(0);
  expect(d.muharebeRaporlari).toHaveLength(1);
  return { d, a, b };
}

describe("muharebe raporu birim kırılımı (TASK-0021 1/4)", () => {
  it("taraf başına kayıp kompozisyonu, toplam kayıpla tutarlı ve türe göre doğru dağılır", () => {
    const { d, a, b } = suvariPiyadeMuharebesi();
    const [ta, tb] = d.muharebeRaporlari[0].taraflar;
    expect(ta.devlet).toBe(a);
    expect(tb.devlet).toBe(b);
    // A tamamen süvari topladı; A'nın kayıpları da yalnızca süvari türünde olmalı (başka türü yoktu)
    expect(ta.kayipKompozisyon.piyade).toBe(0);
    expect(ta.kayipKompozisyon.okcu).toBe(0);
    expect(ta.kayipKompozisyon.suvari).toBe(ta.kayip);
    // B tamamen piyade topladı; aynı şekilde yalnızca piyade kaybı olmalı
    expect(tb.kayipKompozisyon.suvari).toBe(0);
    expect(tb.kayipKompozisyon.okcu).toBe(0);
    expect(tb.kayipKompozisyon.piyade).toBe(tb.kayip);
    expect(degismezler(d)).toEqual([]);
  });
});
