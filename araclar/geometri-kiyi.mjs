// TASK-0042: şehir koordinatlarını koruyarak yerel kıyı ayrıntısını mevcut Natural Earth'ten tamamlar.
// Devletler arasında toprak devretmez; şehir çevresindeki sahipsiz kıyı başkent toprağına eklenebilir.
// Kaynağın yuvarlanmış şehir noktası suya düşüyorsa en çok 3 km'lik
// yerel kıyı düzeltmesi belgelenir; uzun bir deniz geçişi veya bütün bir modern il eklenmez.
import polygonClipping from "polygon-clipping";
import { topology } from "topojson-server";
import {
  cokluPoligondaMi, enYakinKenar, haritaHalkalari, halkaAlani, kutu, kutularKesisir, millerY,
} from "./geometri-kontrol.mjs";

export function kiyiGeometrisiniTamamla(harita, naturalEarth) {
  const H = haritaHalkalari(harita).map((ps) => ps.flatMap((p) => {
    if (p[0].length < 4 || halkaAlani(p[0]) < 1e-12) return [];
    return [[p[0], ...p.slice(1).filter((r) => r.length >= 4 && halkaAlani(r) >= 1e-12)]];
  }));
  const adaylar = harita.sehirler.map((c) => ({ c, bi: harita.birimler.findIndex((b) => b.s === c.ad) }))
    .filter(({ c, bi }) => bi >= 0 && !cokluPoligondaMi(H[bi], c.x, c.y));
  const notlar = [...(harita.geometriDuzeltmeleri ?? [])];
  const rapor = [];
  const raw = adaylar.length ? naturalEarth.features.flatMap((f) => {
    if (!f.geometry || !["Polygon", "MultiPolygon"].includes(f.geometry.type)) return [];
    const ps = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    return ps.map((p) => p.map((r) => r.map(([x, lat]) => [Math.round(x * 1e6) / 1e6, Math.round(millerY(lat) * 1e6) / 1e6])));
  }).map((p) => ({ p, kutu: kutu([p]) })) : [];

  for (const { c, bi } of adaylar) {
    // Yalnızca şehir çevresindeki yaklaşık 18 km'lik pencere. Diğer bölgelerin mevcut karası çıkarılır.
    const r = 0.08, k = [c.x - r, c.y - r, c.x + r, c.y + r];
    const pencere = [[[k[0], k[1]], [k[2], k[1]], [k[2], k[3]], [k[0], k[3]], [k[0], k[1]]]];
    const parcalar = raw.filter((p) => kutularKesisir(k, p.kutu))
      .flatMap(({ p }) => polygonClipping.intersection([p], [pencere]));
    let eklenen = [];
    if (parcalar.length) {
      const kaynak = polygonClipping.union(...parcalar.map((p) => [p]));
      const mevcut = H.flatMap((ps, i) => i === bi || harita.birimler[i].d < 0 ? [] : ps.filter((p) => kutularKesisir(k, kutu([p]))));
      eklenen = mevcut.length ? polygonClipping.difference(kaynak, ...mevcut.map((p) => [p])) : kaynak;
      if (eklenen.length) H[bi] = polygonClipping.union(H[bi], eklenen);
    }
    let yaklasikKiyi = 0;
    if (!cokluPoligondaMi(H[bi], c.x, c.y)) {
      const yakin = enYakinKenar(H[bi], c.x, c.y);
      if (!yakin || yakin.ri !== 0 || yakin.metre > 3000) throw new Error(`${c.ad}: kıyı 3 km içinde tamamlanamadı; elle inceleme gerekli.`);
      const p = H[bi][yakin.pi][0], a = p[yakin.j], b = p[yakin.i];
      // Kaynak koordinatı ve çizilmiş kıyı arasında küçük fark: gerçek konum korunur, kıyı yayı açılır.
      const dx = c.x - yakin.nokta[0], dy = c.y - yakin.nokta[1];
      const tip = [c.x + dx * 0.2, c.y + dy * 0.2];
      const ek = [[a, b, tip, a]];
      // Yeni kama başka bir devletin karasını kaplayamaz.
      const diger = H.flatMap((ps, i) => i === bi ? [] : ps.filter((poly) => kutularKesisir(kutu([ek]), kutu([poly]))));
      const temiz = diger.length ? polygonClipping.difference([ek], ...diger.map((poly) => [poly])) : [ek];
      H[bi] = polygonClipping.union(H[bi], temiz);
      yaklasikKiyi = Math.round(yakin.metre);
    }
    if (!cokluPoligondaMi(H[bi], c.x, c.y)) throw new Error(`${c.ad}: şehir merkezi kıyı düzeltmesinden sonra dışarıda kaldı.`);
    // Kilva gibi mevcut başkentin çevresinde yanlışlıkla sahipsiz bırakılmış kıyılar: çifte sahiplik oluşmasın.
    let sahipsizKiyi = false;
    H.forEach((ps, i) => {
      if (harita.birimler[i].d >= 0 || !ps.some((p) => kutularKesisir(k, kutu([p])))) return;
      const ortak = polygonClipping.intersection(ps, H[bi]);
      if (!ortak.length) return;
      H[i] = polygonClipping.difference(ps, H[bi]);
      sahipsizKiyi = true;
    });
    const not = { sehir: c.ad, kaynak: "Natural Earth 10m admin-0 (yerel kaynak)", pencere: k,
      konumKorundu: true, yaklasikKiyiMetre: yaklasikKiyi, sahipsizKiyi,
      aciklama: yaklasikKiyi ? "Kaynak şehir/kıyı hassasiyet farkı için yerel oyun kıyısı; tarihî kıyı ölçümü değildir." : "Kaynak kıyı ayrıntısı geri getirildi." };
    notlar.push(not); rapor.push(not);
  }

  const t = topology({ b: { type: "GeometryCollection", geometries: H.map((p) => ({ type: "MultiPolygon", coordinates: p })) } });
  const birimler = harita.birimler.map((b, i) => {
    const g = t.objects.b.geometries[i];
    return { ...b, p: g.type === "MultiPolygon" ? g.arcs : g.type === "Polygon" ? [g.arcs] : [] };
  });
  return { harita: { ...harita, arklar: t.arcs.map((a) => a.flat()), birimler, geometriDuzeltmeleri: notlar }, rapor };
}
