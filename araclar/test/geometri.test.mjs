import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { topology } from "topojson-server";
import { cokluPoligondaMi, geometriyiDenetle, haritaHalkalari, millerY, poligonAlani } from "../geometri-kontrol.mjs";
import { kiyiGeometrisiniTamamla } from "../geometri-kiyi.mjs";

const rect = (x0, y0, x1, y1) => [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]];
function harita(polys, sehirler) {
  const t = topology({ b: { type: "GeometryCollection", geometries: polys.map((p) => ({ type: "MultiPolygon", coordinates: p })) } });
  return { arklar: t.arcs.map((a) => a.flat()), devletler: [{ id: "a" }, { id: "b" }], sehirler,
    birimler: t.objects.b.geometries.map((g, i) => ({ ad: sehirler[i].ad, s: sehirler[i].ad, d: i, p: g.type === "Polygon" ? [g.arcs] : g.arcs })) };
}
const kaynak = (polys) => ({ features: polys.map((p) => ({ geometry: { type: "Polygon", coordinates: p } })) });

describe("şehir kıyıları ve geometri denetimi", () => {
  it("kıyıdaki şehir konumu korunur; komşu devletin alanı değişmez; tekrar çalıştırma aynı sonucu verir", () => {
    const a = { ad: "Liman", x: 1.002, y: millerY(0.5), d: 0 }, b = { ad: "Komşu", x: -0.5, y: millerY(0.5), d: 1 };
    const h = harita([[rect(0, 0, 1, millerY(1))], [rect(-1, 0, 0, millerY(1))]], [a, b]);
    const once = haritaHalkalari(h)[1].reduce((t, p) => t + poligonAlani(p), 0);
    const ham = kaynak([rect(-1, 0, 1.01, 1)]);
    assert.match(geometriyiDenetle(h).hatalar[0], /dışında/);
    const r = kiyiGeometrisiniTamamla(h, ham), H = haritaHalkalari(r.harita);
    assert.deepEqual(r.harita.sehirler, h.sehirler);
    assert(cokluPoligondaMi(H[0], a.x, a.y));
    assert.equal(H[1].reduce((t, p) => t + poligonAlani(p), 0), once);
    assert.deepEqual(geometriyiDenetle(r.harita).hatalar, []);
    assert.deepEqual(kiyiGeometrisiniTamamla(r.harita, ham).harita, r.harita);
  });
  it("kaynakta karaya çok yakın yuvarlanmış şehir noktası yerel kıyı kamasıyla içeride kalır", () => {
    const c = { ad: "Kıyı", x: 1.001, y: millerY(0.5), d: 0 };
    const h = harita([[rect(0, 0, 1, millerY(1))]], [c]);
    const r = kiyiGeometrisiniTamamla(h, kaynak([rect(0, 0, 1, 1)]));
    assert(cokluPoligondaMi(haritaHalkalari(r.harita)[0], c.x, c.y));
    assert(r.rapor[0].yaklasikKiyiMetre > 0);
    assert.deepEqual(r.harita.sehirler, h.sehirler);
  });
  it("kaynakta da kara olmayan uzaktaki şehir için yapay ada veya uzun kara köprüsü üretilmez", () => {
    const h = harita([[rect(0, 0, 1, millerY(1))]], [{ ad: "Uzak", x: 2, y: millerY(0.5), d: 0 }]);
    assert.throws(() => kiyiGeometrisiniTamamla(h, kaynak([rect(0, 0, 1, 1)])), /elle inceleme/);
  });
  it("başka araziye bağlanmış şehir düğümü yakalanır; doğru eşleşme kabul edilir", () => {
    const c = { ad: "Şehir", x: 0.5, y: millerY(0.5), d: 0 }, h = harita([[rect(0, 0, 1, millerY(1))]], [c]);
    const s = { devletler: [{ id: "a" }], sehirler: [{ ad: c.ad, devlet: "a", birim: 0, dugum: 0, x: 5000, y: Math.round(c.y * 1e4) }],
      ag: { dugumler: [{ b: 1, x: 5000, y: Math.round(c.y * 1e4) }] } };
    assert(geometriyiDenetle(h, s).hatalar.some((e) => /hareket düğümü/.test(e)));
    s.ag.dugumler[0].b = 0;
    assert.deepEqual(geometriyiDenetle(h, s).hatalar, []);
  });
  it("adalar hata sayılmaz; göl deliğine düşen şehir dışarıda kabul edilir", () => {
    const c = { ad: "Ada", x: 0.2, y: 0.2, d: 0 };
    const h = harita([[rect(0, 0, 1, 1), rect(2, 0, 3, 1)]], [c]);
    assert.deepEqual(geometriyiDenetle(h).hatalar, []);
    assert.equal(geometriyiDenetle(h).uyarilar.length, 1);
    const delikli = [[...rect(0, 0, 1, 1), ...rect(0.4, 0.4, 0.6, 0.6)]];
    assert.equal(cokluPoligondaMi(delikli, 0.5, 0.5), false);
  });
});
