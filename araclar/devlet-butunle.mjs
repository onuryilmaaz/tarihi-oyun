// TASK-0041: başlangıçta devletlerin birbirinden kopuk kara parçası olmaz.
// Bir devletin şehir toprakları ortak yay (ya da boğaz gibi dar su, ~25 km) üzerinden bağlı kümelere ayrılır; başkentin
// bulunduğu küme (başkent yoksa en çok şehirli küme) kalır. Kıyısı olmayan (karaya kapalı) öteki kümeler en uzun ortak
// sınırlı komşu devlete şehirleriyle birlikte geçer. Kıyılı deniz aşırı parçalar (Norveç, Burgonya Hollandası, Venedik
// Dalmaçyası…) ve adalar yerinde kalır: donanmayla ulaşılabilirler.
// Gerçekçilikten çok oynanabilirlik içindir: ordular kendi topraklarından çıkamayan kırıntılara sıkışmaz.

const YAKIN_HUCRE = 0.12; // derece; komşu hücreler dahil ~0,25°ye (~25 km) kadar dar sular bağlı sayılır (Büyük Belt, Messina…)

export function devletleriButunle(harita, denizAlanlari = harita.denizAlanlari ?? []) {
  const A = harita.arklar, B = harita.birimler;
  const yayUzunlugu = (k) => {
    const a = A[k];
    let s = 0;
    for (let i = 2; i < a.length; i += 2) s += Math.hypot(a[i] - a[i - 2], a[i + 1] - a[i - 1]);
    return s;
  };
  // Yay → onu kullanan birimler
  const yayBirimleri = new Map();
  B.forEach((b, i) => b.p.flat(2).forEach((r) => {
    const k = r < 0 ? ~r : r;
    const l = yayBirimleri.get(k) ?? yayBirimleri.set(k, []).get(k);
    if (!l.includes(i)) l.push(i);
  }));
  // Kıyı: yalnızca bu birimin kullandığı yayın en az 3 noktası bir deniz alanının içinde (limanlarla aynı ölçüt). Kaynak
  // poligonları arasındaki ince boşluklar da tek kullanımlı yay bırakır; deniz alanı olmadan kıyı sayılmazlar.
  const denizler = denizAlanlari.map((z) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const poly of z.p) for (let i = 0; i < poly[0].length; i += 2) { x0 = Math.min(x0, poly[0][i]); x1 = Math.max(x1, poly[0][i]); y0 = Math.min(y0, poly[0][i + 1]); y1 = Math.max(y1, poly[0][i + 1]); }
    return { polys: z.p, kutu: [x0, y0, x1, y1] };
  });
  const icindeDuz = (h, x, y) => {
    let ic = false;
    for (let i = 0, j = h.length - 2; i < h.length; j = i, i += 2) {
      const xi = h[i], yi = h[i + 1], xj = h[j], yj = h[j + 1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ic = !ic;
    }
    return ic;
  };
  const denizde = (x, y) => denizler.some((z) => x >= z.kutu[0] && x <= z.kutu[2] && y >= z.kutu[1] && y <= z.kutu[3]
    && z.polys.some((poly) => icindeDuz(poly[0], x, y) && !poly.slice(1).some((h) => icindeDuz(h, x, y))));
  const kiyiOnbellek = new Map();
  const kiyi = (i) => {
    if (kiyiOnbellek.has(i)) return kiyiOnbellek.get(i);
    let n = 0;
    for (const r of B[i].p.flat(2)) {
      const k = r < 0 ? ~r : r;
      if (yayBirimleri.get(k).length !== 1) continue;
      const a = A[k];
      for (let j = 0; j < a.length && n < 3; j += 4) if (denizde(a[j], a[j + 1])) n++;
      if (n >= 3) break;
    }
    kiyiOnbellek.set(i, n >= 3);
    return n >= 3;
  };
  // Ortak sınır uzunlukları (birim çiftleri)
  const sinir = B.map(() => new Map());
  for (const [k, l] of yayBirimleri) {
    if (l.length < 2) continue;
    const u = yayUzunlugu(k);
    for (const a of l) for (const b of l) if (a !== b) sinir[a].set(b, (sinir[a].get(b) ?? 0) + u);
  }
  // Dar sular: aynı ya da komşu ızgara hücresinde köşesi olan birimler
  const izgara = new Map();
  B.forEach((b, i) => {
    if (b.d < 0) return;
    const gor = new Set();
    for (const r of b.p.flat(2)) {
      const a = A[r < 0 ? ~r : r];
      for (let t = 0; t < a.length; t += 2) {
        const h = `${Math.floor(a[t] / YAKIN_HUCRE)},${Math.floor(a[t + 1] / YAKIN_HUCRE)}`;
        if (gor.has(h)) continue;
        gor.add(h);
        (izgara.get(h) ?? izgara.set(h, []).get(h)).push(i);
      }
    }
  });
  const yakin = B.map(() => new Set());
  for (const [h, l] of izgara) {
    const [x, y] = h.split(",").map(Number);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const m = izgara.get(`${x + dx},${y + dy}`);
      if (!m) continue;
      for (const a of l) for (const b of m) if (a !== b && B[a].d === B[b].d) yakin[a].add(b);
    }
  }

  const sehirAd = new Map(harita.sehirler.map((s, i) => [s.ad, i]));
  // ada: yerinde kalan ada ya da kıyılı küme
  const rapor = { tasinanKume: 0, tasinanSehir: 0, ada: 0, devletler: new Map() };
  for (let tur = 0; tur < 5; tur++) {
    let degisti = false;
    harita.devletler.forEach((dv, d) => {
      const uyeler = B.map((b, i) => (b.d === d ? i : -1)).filter((i) => i >= 0);
      if (uyeler.length < 2) return;
      // Kümeler: aynı devletin ortak yaylı ya da dar suyla ayrılan birimleri
      const kume = new Map();
      const kumeler = [];
      for (const i of uyeler) {
        if (kume.has(i)) continue;
        const k = [], yigin = [i];
        kume.set(i, kumeler.length);
        while (yigin.length) {
          const a = yigin.pop();
          k.push(a);
          for (const b of [...sinir[a].keys(), ...yakin[a]]) if (B[b].d === d && !kume.has(b)) { kume.set(b, kumeler.length); yigin.push(b); }
        }
        kumeler.push(k);
      }
      if (kumeler.length < 2) return;
      const baskent = harita.sehirler.find((s) => s.d === d && s.b === 1);
      const sehirSayisi = (k) => k.filter((i) => B[i].s).length;
      const ana = baskent ? kumeler.findIndex((k) => k.some((i) => B[i].s === baskent.ad))
        : kumeler.reduce((en, k, j) => (sehirSayisi(k) > sehirSayisi(kumeler[en]) ? j : en), 0);
      kumeler.forEach((k, j) => {
        if (j === ana || j < 0) return;
        // Kara komşusu olan başka (sahipli) devletler ve ortak sınır uzunluğu
        const komsu = new Map();
        for (const a of k) for (const [b, u] of sinir[a]) if (B[b].d >= 0 && B[b].d !== d) komsu.set(B[b].d, (komsu.get(B[b].d) ?? 0) + u);
        if (!komsu.size || k.some((a) => kiyi(a))) { if (tur === 0) rapor.ada++; return; } // ada ya da kıyılı parça: yerinde kalır
        const hedef = [...komsu].sort((x, y) => y[1] - x[1] || x[0] - y[0])[0][0];
        for (const a of k) {
          B[a].d = hedef;
          const si = B[a].s !== undefined ? sehirAd.get(B[a].s) : undefined;
          if (si !== undefined) {
            harita.sehirler[si].d = hedef;
            if (harita.sehirler[si].b === 1) harita.sehirler[si].b = 0; // başka devletin başkenti olamaz
            rapor.tasinanSehir++;
          }
        }
        rapor.tasinanKume++;
        rapor.devletler.set(dv.id, (rapor.devletler.get(dv.id) ?? 0) + 1);
        degisti = true;
      });
    });
    if (!degisti) break;
  }
  return { harita, rapor: { ...rapor, devletler: Object.fromEntries(rapor.devletler) } };
}

/** TASK-0041: bölgelerin içindeki küçük delikleri kapatır. Kaynak poligonları arasındaki ince boşluklar bölgenin içinde
 *  anlamsız çizgi kırıntıları bırakıyordu. Yalnızca yayları başka hiçbir birimce kullanılmayan (içinde başka bölge
 *  olmayan) ve alanı eşikten küçük delikler kapanır; göller ayrı katmanda çizilir. */
export function kucukDelikleriKapat(harita, esikKm2 = 50) {
  const A = harita.arklar;
  const kullanim = new Map();
  for (const b of harita.birimler) for (const r of b.p.flat(2)) { const k = r < 0 ? ~r : r; kullanim.set(k, (kullanim.get(k) ?? 0) + 1); }
  const yay = (r) => { const a = A[r < 0 ? ~r : r], p = []; for (let i = 0; i < a.length; i += 2) p.push([a[i], a[i + 1]]); return r < 0 ? p.reverse() : p; };
  const alan = (ring) => {
    const p = ring.flatMap(yay);
    let s = 0;
    for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += (a[0] * b[1] - b[0] * a[1]) * Math.cos(((a[1] + b[1]) / 2) * Math.PI / 180); }
    return Math.abs(s) / 2 * 12321;
  };
  let kapanan = 0;
  for (const b of harita.birimler) {
    b.p = b.p.map((poly) => [poly[0], ...poly.slice(1).filter((ring) => {
      const kendi = ring.every((r) => kullanim.get(r < 0 ? ~r : r) === 1);
      if (kendi && alan(ring) < esikKm2) { kapanan++; return false; }
      return true;
    })]);
  }
  return { kapanan };
}
