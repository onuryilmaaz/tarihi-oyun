// TASK-0025 (DEC-0074): Wikidata adaylarından pilot bölgesinin şehirlerini seçer ve haritaya ekler.
// Pilot devletler: başkenti kutunun içinde olanlar. Aday, düştüğü arazi biriminin devletine aittir (1453 OHM + tahmin);
// pilot devletine düşmeyen aday alınmaz. Öncelik: mevcut şehirler (hep kalır) → antik/1453 öncesi kaydı olanlar →
// günümüz nüfusu. Şehirler arası en az EN_AZ_KM; aynı adlı ikinci şehir alınmaz (veriler ada göre eşleşir).

const EN_AZ_KM = 55;
const D2R = Math.PI / 180;
const millerY = (lat) => 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * lat * D2R)) / D2R;
const millerLat = (y) => (2.5 * (Math.atan(Math.exp((y * D2R) / 1.25)) - Math.PI / 4)) / D2R;

// Belediye, semt gibi idari birimler şehir sayılmaz
const IDARI = /(Nahiyesi|Belediyesi|Municipality|Sector|Republic|Rayon|District|ilçesi|Oblast|Arrondissement|Kreis|Gemeinde|Comune|Municipio|Powiat|Gmina|Kommune|Borough|Bezirk|Quartier|Stadtteil|Okrug|Governorate|Province|County|Muhafaza|Region|Metropol)/i;

export function sehirleriSec(harita, aday, haric = [], ek = [], tarihiAdlar = {}) {
  const dislanan = new Set(haric);
  // Pilot devletler: başkenti aday kutularından birinin içinde olanlar (TASK-0030: birden çok kutu)
  // TASK-0031: kutunun grubu (aynı gruptaki devletler birlikte bölünür) ve şehirler arası en küçük mesafesi
  const kutular = (aday.kutular ?? [aday.kutu]).map((k) => ({ grup: 0, enAzKm: EN_AZ_KM, ...k }));
  const kutuBul = (lon, lat) => kutular.find((k) => lon >= k.bati && lon <= k.dogu && lat >= k.guney && lat <= k.kuzey);
  const pilot = new Map(); // devlet → grup
  harita.sehirler.forEach((s) => {
    const k = s.b === 1 ? kutuBul(s.x, millerLat(s.y)) : null;
    if (k && !pilot.has(s.d)) pilot.set(s.d, k.grup);
  });

  // Birim bulma (ızgara ön süzgeçli nokta-poligon)
  const A = harita.arklar;
  const halka = (refs) => refs.flatMap((r, k) => {
    const a = A[r < 0 ? ~r : r], p = [];
    for (let i = 0; i < a.length; i += 2) p.push([a[i], a[i + 1]]);
    if (r < 0) p.reverse();
    return k ? p.slice(1) : p;
  });
  const icinde = (h, x, y) => {
    let ic = false;
    for (let i = 0, j = h.length - 1; i < h.length; j = i++) {
      const [xi, yi] = h[i], [xj, yj] = h[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ic = !ic;
    }
    return ic;
  };
  const adaylarBirim = harita.birimler.map((b, i) => ({ i, d: b.d, polys: pilot.has(b.d) ? b.p.map((poly) => poly.map(halka)) : null }))
    .filter((b) => b.polys);
  for (const b of adaylarBirim) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const poly of b.polys) for (const [x, y] of poly[0]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    b.kutu = [x0, y0, x1, y1];
  }
  const devletBul = (x, y) => adaylarBirim.find((b) => x >= b.kutu[0] && x <= b.kutu[2] && y >= b.kutu[1] && y <= b.kutu[3]
    && b.polys.some((poly) => icinde(poly[0], x, y) && !poly.slice(1).some((h) => icinde(h, x, y))))?.d ?? -1;

  const km = (a, b) => {
    const la = millerLat((a.y + b.y) / 2) * D2R;
    return 111.2 * Math.hypot((a.x - b.x) * Math.cos(la), millerLat(a.y) - millerLat(b.y));
  };
  const secilen = harita.sehirler.map((s) => ({ ...s }));
  // Elle eklenenler (ör. İstanbul'un Anadolu yakası Üsküdar): mesafe kuralından bağımsız
  for (const e of ek) {
    const d = harita.devletler.findIndex((v) => v.id === e.devlet);
    if (d < 0) throw new Error(`sehir-ek: bilinmeyen devlet ${e.devlet}`);
    secilen.push({ ad: e.ad, x: e.lon, y: Math.round(millerY(e.lat) * 1e4) / 1e4, d, b: 0 });
  }
  const adlar = new Set(secilen.map((s) => s.ad));
  const puan = (o) => Math.log(o.nufusGunumuz) + (o.pleiades || (o.kurulus !== null && o.kurulus <= 1453) ? 3 : 0);
  let eklenen = 0;
  for (let o of [...aday.adaylar].sort((a, b) => puan(b) - puan(a) || a.qid.localeCompare(b.qid, "en"))) {
    if (IDARI.test(o.ad) || IDARI.test(o.en ?? "")) continue;
    o = { ...o, ad: o.ad.split(",")[0].trim() }; // "Boston, Lincolnshire" → "Boston" (ayırt edici ek)
    // TASK-0034: 1453'teki ad (Türkçe ya da İngilizce günümüz adına göre); günümüz adı saklanır
    const tarihi = tarihiAdlar[o.ad] ?? tarihiAdlar[o.en ?? ""];
    if (tarihi && tarihi !== o.ad) o = { ...o, modernAd: o.ad, ad: tarihi };
    if (adlar.has(o.ad) || dislanan.has(o.ad)) continue;
    const c = { x: o.lon, y: millerY(o.lat) };
    const enAz = kutuBul(o.lon, o.lat)?.enAzKm ?? EN_AZ_KM;
    if (secilen.some((s) => km(s, c) < enAz)) continue;
    const d = devletBul(c.x, c.y);
    if (!pilot.has(d)) continue;
    secilen.push({ ad: o.ad, x: c.x, y: Math.round(c.y * 1e4) / 1e4, d, b: 0, qid: o.qid, nufusGunumuz: o.nufusGunumuz, ...(o.modernAd ? { modernAd: o.modernAd } : {}) });
    adlar.add(o.ad);
    eklenen++;
  }
  return { harita: { ...harita, sehirler: secilen }, pilot, rapor: { pilotDevlet: pilot.size, eklenen, toplam: secilen.length } };
}
