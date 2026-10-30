// TASK-0023 (1. teslim, DEC-0072): sınır kırıntılarını birleştirir.
// Arazi birimleri modern idari bölgelerden türetildiği için 1453 sınırı bazı illeri kesip öbür yanda küçük
// kırıntılar bırakmış (ör. "Vidin ili (Eflak)" 52 km², 3 parça). Bu modül:
//   1) bir birimin ana gövdesinden kopuk küçük poligon parçalarını, aynı devletin en uzun ortak sınırlı
//      komşu birimine taşır (adalar, yani hiçbir komşuya değmeyen parçalar yerinde kalır);
//   2) eşiğin altındaki birimleri aynı devletin en uzun ortak sınırlı komşusuna katar.
// Devlet sınırı hiç değişmez (yalnızca aynı sahipli birimler birleşir); iki şehir aynı birime düşmez.
// Ortak yaylar silinmez, yalnızca kullanılmaz olur (istemci sahipsiz yayı çizmez); yay indeksleri korunur.

const ESIK_KM2 = 500;

export function birimleriBirlestir(harita, { esik = ESIK_KM2 } = {}) {
  // Üst üste binen (yay paylaşmayan) kaynak poligonlarda halka dikişi alanı korumaz; böyle kümelerin
  // birimleri dışlanıp yeniden denenir — onlar olduğu gibi kalır.
  const haric = new Set();
  for (;;) {
    const r = birlestir(harita, esik, haric);
    if (!r.bozuk.length) return { harita: r.harita, eskidenYeniye: r.eskidenYeniye, rapor: { ...r.rapor, dislanan: haric.size } };
    for (const i of r.bozuk) haric.add(i);
  }
}

function birlestir(harita, esik, haric) {
  const A = harita.arklar;
  const yayNoktalari = (r) => {
    const a = A[r < 0 ? ~r : r], p = [];
    for (let i = 0; i < a.length; i += 2) p.push([a[i], a[i + 1]]);
    return r < 0 ? p.reverse() : p;
  };
  const halka = (refs) => refs.flatMap((r, k) => (k ? yayNoktalari(r).slice(1) : yayNoktalari(r)));
  // Yaklaşık km² (Miller x/y derece; enlem düzeltmesi kaba ama sıralama için yeterli)
  const halkaAlani = (p) => {
    let s = 0;
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      s += (a[0] * b[1] - b[0] * a[1]) * Math.cos(((a[1] + b[1]) / 2) * Math.PI / 180);
    }
    return Math.abs(s) / 2 * 12321;
  };
  const poliAlani = (poly) => poly.reduce((t, r, i) => t + (i ? -1 : 1) * halkaAlani(halka(r)), 0);
  const yayUzunlugu = (k) => {
    const a = A[k];
    let s = 0;
    for (let i = 2; i < a.length; i += 2) s += Math.hypot(a[i] - a[i - 2], a[i + 1] - a[i - 1]);
    return s;
  };
  const icinde = (h, x, y) => {
    let ic = false;
    for (let i = 0, j = h.length - 1; i < h.length; j = i++) {
      const [xi, yi] = h[i], [xj, yj] = h[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ic = !ic;
    }
    return ic;
  };

  const B = harita.birimler;
  // Poligon parçaları: { birim (şu anki sahibi), p (halka yay dizileri), alan }
  const parcalar = [];
  const birimParcalari = B.map((b, i) => b.p.map((poly) => { parcalar.push({ birim: i, p: poly, alan: poliAlani(poly) }); return parcalar.length - 1; }));
  const yayParcalari = new Map(); // yay → bu yayı kullanan parça indeksleri
  parcalar.forEach((pc, pi) => pc.p.flat().forEach((r) => {
    const k = r < 0 ? ~r : r;
    (yayParcalari.get(k) ?? yayParcalari.set(k, []).get(k)).push(pi);
  }));

  // Şehir → birim (iki şehri aynı birime koymamak için)
  const sehirli = new Set();
  for (const s of harita.sehirler) {
    const bi = B.findIndex((b) => b.p.some((poly) => icinde(halka(poly[0]), s.x, s.y) && !poly.slice(1).some((r) => icinde(halka(r), s.x, s.y))));
    if (bi >= 0) sehirli.add(bi);
  }

  // Birleşim kümeleri (birim düzeyinde)
  const ust = B.map((_, i) => i);
  const kok = (i) => (ust[i] === i ? i : (ust[i] = kok(ust[i])));
  const kumeSehirli = new Set(sehirli);

  /** Bir parçanın (ya da birimin) aynı sahipli, başka kümedeki komşuları → ortak sınır uzunluğu. */
  const komsular = (parcaListesi, kendiKok, d) => {
    const m = new Map();
    for (const pi of parcaListesi) for (const r of parcalar[pi].p.flat()) {
      const k = r < 0 ? ~r : r;
      for (const qi of yayParcalari.get(k)) {
        const hedef = kok(parcalar[qi].birim);
        if (hedef === kendiKok || B[parcalar[qi].birim].d !== d || haric.has(parcalar[qi].birim)) continue;
        m.set(hedef, (m.get(hedef) ?? 0) + yayUzunlugu(k));
      }
    }
    return [...m].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  };

  // 1) Kopuk küçük parçalar: en büyük parça yerinde kalır, ötekiler komşuya taşınır
  let tasinanParca = 0;
  B.forEach((b, i) => {
    if (birimParcalari[i].length < 2 || haric.has(i)) return;
    const sirali = [...birimParcalari[i]].sort((x, y) => parcalar[y].alan - parcalar[x].alan);
    for (const pi of sirali.slice(1)) {
      if (parcalar[pi].alan >= esik) continue;
      const [hedef] = komsular([pi], i, b.d);
      if (!hedef) continue; // ada: yerinde kalır
      parcalar[pi].birim = hedef[0];
      tasinanParca++;
    }
  });

  // 2) Küçük birimler: artan alana göre, en uzun ortak sınırlı aynı sahipli komşu kümeye katılır
  const kumeParcalari = () => {
    const m = new Map();
    parcalar.forEach((pc, pi) => { const k = kok(pc.birim); (m.get(k) ?? m.set(k, []).get(k)).push(pi); });
    return m;
  };
  let kp = kumeParcalari();
  const kumeAlani = (k) => (kp.get(k) ?? []).reduce((t, pi) => t + parcalar[pi].alan, 0);
  let katilanBirim = 0;
  const sira = B.map((_, i) => i).filter((i) => kp.has(i)).sort((x, y) => kumeAlani(x) - kumeAlani(y) || x - y);
  for (const i of sira) {
    const k = kok(i);
    if (k !== i || haric.has(i) || kumeAlani(k) >= esik) continue;
    const aday = komsular(kp.get(k), k, B[i].d).find(([h]) => !(kumeSehirli.has(h) && kumeSehirli.has(k)));
    if (!aday) continue;
    const h = aday[0];
    ust[k] = h;
    if (kumeSehirli.has(k)) kumeSehirli.add(h);
    kp.set(h, [...kp.get(h), ...kp.get(k)]);
    kp.delete(k);
    katilanBirim++;
  }
  kp = kumeParcalari();

  // 3) Yeni birimler: kümenin kimliği en büyük üyesininki; değişmeyen birimin geometrisi aynen kalır
  const yeniIndeks = new Map();
  const birimler = [];
  const bozuk = [];
  for (const [k, liste] of [...kp].sort((a, b) => a[0] - b[0])) {
    const uyeler = [...new Set(liste.map((pi) => birimParcalari.findIndex((l) => l.includes(pi))))];
    const degismedi = uyeler.length === 1 && uyeler[0] === k && liste.length === birimParcalari[k].length;
    const enBuyuk = uyeler.reduce((x, y) => {
      const ax = birimParcalari[x].reduce((t, pi) => t + parcalar[pi].alan, 0), ay = birimParcalari[y].reduce((t, pi) => t + parcalar[pi].alan, 0);
      return ay > ax ? y : x;
    });
    const { p, ...kimlik } = B[enBuyuk];
    const yeniP = degismedi ? p : halkalariOr(liste.map((pi) => parcalar[pi].p));
    if (!degismedi) {
      const beklenen = liste.reduce((t, pi) => t + parcalar[pi].alan, 0), olan = yeniP.reduce((t, poly) => t + poliAlani(poly), 0);
      if (Math.abs(olan - beklenen) > Math.max(1, beklenen * 0.001)) bozuk.push(...uyeler);
    }
    yeniIndeks.set(k, birimler.length);
    birimler.push({ ...kimlik, d: B[k].d, p: yeniP });
  }
  const eskidenYeniye = B.map((_, i) => yeniIndeks.get(kok(i)));

  /** Parçaların yaylarından iç (iki kez kullanılan) yayları atıp kalanları kapalı halkalara diker. */
  function halkalariOr(polys) {
    const sayac = new Map();
    for (const r of polys.flat(2)) { const k = r < 0 ? ~r : r; sayac.set(k, (sayac.get(k) ?? 0) + 1); }
    const dis = [...sayac].filter(([, n]) => n === 1).map(([k]) => k);
    const anahtar = (x, y) => `${x},${y}`;
    const uc = (k) => { const a = A[k]; return [anahtar(a[0], a[1]), anahtar(a[a.length - 2], a[a.length - 1])]; };
    const dugum = new Map();
    for (const k of dis) for (const u of uc(k)) (dugum.get(u) ?? dugum.set(u, []).get(u)).push(k);
    const kullanildi = new Set();
    const halkalar = [];
    for (const k0 of dis) {
      if (kullanildi.has(k0)) continue;
      kullanildi.add(k0);
      const [bas, son0] = uc(k0);
      const refs = [k0];
      let son = son0;
      while (son !== bas) {
        const k = dugum.get(son).find((x) => !kullanildi.has(x));
        if (k === undefined) throw new Error(`halka kapanmadı (yay ${k0})`);
        kullanildi.add(k);
        const [u1, u2] = uc(k);
        if (u1 === son) { refs.push(k); son = u2; } else { refs.push(~k); son = u1; }
      }
      halkalar.push(refs);
    }
    // Dış halka / delik: başka bir halkanın içinde kalan halka deliktir; en küçük kapsayan dışa bağlanır
    const noktalar = halkalar.map(halka);
    const alanlar = noktalar.map(halkaAlani);
    const kapsar = (i, j) => { // i, j'yi kapsıyor mu (j'nin köşelerinin çoğu i'nin içinde)
      if (alanlar[i] <= alanlar[j]) return false;
      const pj = noktalar[j], adim = Math.max(1, Math.floor(pj.length / 7));
      let ic = 0, n = 0;
      for (let t = 0; t < pj.length; t += adim, n++) if (icinde(noktalar[i], pj[t][0], pj[t][1])) ic++;
      return ic * 2 > n;
    };
    const kapsayanlar = halkalar.map((_, j) => halkalar.map((_, i) => i).filter((i) => i !== j && kapsar(i, j)));
    const disMi = kapsayanlar.map((l) => l.length % 2 === 0);
    const sonuc = new Map();
    halkalar.forEach((h, i) => { if (disMi[i]) sonuc.set(i, [h]); });
    halkalar.forEach((h, j) => {
      if (disMi[j]) return;
      const dislar = kapsayanlar[j].filter((i) => disMi[i]).sort((x, y) => alanlar[x] - alanlar[y]);
      sonuc.get(dislar[0])?.push(h);
    });
    return [...sonuc.values()];
  }

  return { bozuk, harita: { ...harita, birimler }, eskidenYeniye, rapor: { onceki: B.length, sonraki: birimler.length, tasinanParca, katilanBirim } };
}
