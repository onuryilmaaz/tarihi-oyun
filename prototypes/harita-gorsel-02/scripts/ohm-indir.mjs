// OpenHistoricalMap → veri-ham/ohm-1453.geojson + scripts/ohm-kayitlari.json (lisans kaydı)
// Çalıştırma: node scripts/ohm-indir.mjs
// Senaryo anı: 1453-04-01 (Konstantiniyye'nin fethinden önce, AT-002)

import fs from "node:fs";

const API = "https://overpass-api.openhistoricalmap.org/api/interpreter";
const AN = "1453-04-01";
const KUTU = "29,12,49,50"; // ayrıntı bölgesi (güney, batı, kuzey, doğu)

async function sorgu(q) {
  for (let deneme = 1; deneme <= 3; deneme++) {
    const r = await fetch(API, { method: "POST", body: new URLSearchParams({ data: q }) });
    if (r.ok) return r.json();
    console.warn(`Overpass ${r.status}, deneme ${deneme}`);
    await new Promise((s) => setTimeout(s, 5000 * deneme));
  }
  throw new Error("Overpass yanıt vermedi");
}

// "1412-11-08", "1412", "0999", "-0500" → karşılaştırılabilir "±YYYY-MM-DD"
function tarih(s, son) {
  if (!s) return null;
  const m = /^(-?)(\d{1,4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(s);
  if (!m) return null;
  const yil = Number(m[2]) * (m[1] ? -1 : 1);
  const ay = m[3] ?? (son ? "12" : "01"), gun = m[4] ?? (son ? "31" : "01");
  return { yil, s: `${String(yil + 10000).padStart(5, "0")}-${ay}-${gun}` };
}
const AN_S = tarih(AN).s;

// Kaynak etiketi Wikimedia Commons / Wikipedia haritası olan kayıtlar referans sayılır (DEC-0021 notu)
const referansKaynak = (src) => /wikimedia|wikipedia/i.test(src ?? "");

// Yolları uç uca ekleyerek halka oluştur
function halkalariKur(yollar) {
  const kalan = yollar.map((y) => y.slice());
  const halkalar = [];
  const esit = (a, b) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
  while (kalan.length) {
    let halka = kalan.shift();
    let ilerledi = true;
    while (!esit(halka[0], halka[halka.length - 1]) && ilerledi) {
      ilerledi = false;
      for (let i = 0; i < kalan.length; i++) {
        const y = kalan[i];
        const son = halka[halka.length - 1];
        if (esit(son, y[0])) halka = halka.concat(y.slice(1));
        else if (esit(son, y[y.length - 1])) halka = halka.concat(y.slice(0, -1).reverse());
        else if (esit(halka[0], y[y.length - 1])) halka = y.slice(0, -1).concat(halka);
        else if (esit(halka[0], y[0])) halka = y.slice(1).reverse().concat(halka);
        else continue;
        kalan.splice(i, 1);
        ilerledi = true;
        break;
      }
    }
    if (esit(halka[0], halka[halka.length - 1]) && halka.length >= 4) halkalar.push(halka);
    else halkalar.push(null); // kapanmayan halka
  }
  return halkalar;
}

const t0 = Date.now();
const etiketler = await sorgu(`[out:json][timeout:120];relation["boundary"="administrative"]["admin_level"~"^[1-4]$"](${KUTU});out tags;`);
const gecerli = etiketler.elements.filter((r) => {
  const b = tarih(r.tags.start_date), s = tarih(r.tags.end_date, true);
  return b && b.s <= AN_S && (!s || s.s > AN_S);
});
// Yalnızca yıl hassasiyetli tarihlerde aynı devletin iki sürümü birden geçerli görünebilir
// (ör. Cenova 1354–1453 ve 1453–1456): fetihten önceki durumu yansıtan, daha erken biteni tut.
{
  const adaGore = new Map();
  for (const r of gecerli) {
    const ad = r.tags["name:en"] ?? r.tags.name;
    const onceki = adaGore.get(ad);
    const bitis = (x) => tarih(x.tags.end_date, true)?.s ?? "99999";
    if (!onceki || bitis(r) < bitis(onceki)) adaGore.set(ad, r);
  }
  const elenen = gecerli.filter((r) => adaGore.get(r.tags["name:en"] ?? r.tags.name) !== r);
  if (elenen.length) console.log("çift sürüm elendi:", elenen.map((r) => `${r.tags.name} ${r.tags.start_date}–${r.tags.end_date}`));
  gecerli.length = 0;
  gecerli.push(...adaGore.values());
}
console.log("bölgedeki ilişki:", etiketler.elements.length, "1453-04-01'de geçerli:", gecerli.length);

const geo = await sorgu(`[out:json][timeout:300];relation(id:${gecerli.map((r) => r.id).join(",")});out geom;`);
const ozellikler = [];
const kayitlar = [];
for (const r of geo.elements) {
  const t = r.tags;
  const dis = [], ic = [];
  for (const m of r.members ?? []) {
    if (m.type !== "way" || !m.geometry) continue;
    const pts = m.geometry.map((p) => [p.lon, p.lat]);
    (m.role === "inner" ? ic : dis).push(pts);
  }
  const disH = halkalariKur(dis), icH = halkalariKur(ic);
  const kapanmayan = disH.filter((h) => !h).length + icH.filter((h) => !h).length;
  const lisans = t.license ?? "CC0-1.0 (veri tabanı varsayılanı)";
  const lisansUygun = !t.license || /^CC0/i.test(t.license);
  const kullanim = !lisansUygun ? "referans (lisans)" : referansKaynak(t.source) ? "referans (kaynak: Commons/Wikipedia)"
    : !disH.some((h) => h) ? "kullanılamaz (geometri yok)" : "ice-aktar";
  kayitlar.push({
    id: r.id, ad: t["name:en"] ?? t.name, adYerel: t.name, duzey: t.admin_level,
    baslangic: t.start_date, bitis: t.end_date ?? null, lisans, kaynak: t.source ?? null,
    wikidata: t.wikidata ?? null, disHalka: disH.filter(Boolean).length, kapanmayanHalka: kapanmayan, kullanim,
  });
  if (!kullanim.startsWith("kullanılamaz")) {
    ozellikler.push({
      type: "Feature",
      properties: { id: r.id, ad: t["name:en"] ?? t.name, duzey: Number(t.admin_level), kullanim },
      geometry: { type: "MultiPolygon", coordinates: disH.filter(Boolean).map((h) => [h]) },
      // iç halkalar (delikler) aşağıda ayrı tutulur; hazırlama betiği fark işlemiyle uygular
      icHalkalar: icH.filter(Boolean),
    });
  }
}
kayitlar.sort((a, b) => String(a.ad).localeCompare(String(b.ad)));
fs.mkdirSync(new URL("../veri-ham/", import.meta.url), { recursive: true });
fs.writeFileSync(new URL("../veri-ham/ohm-1453.geojson", import.meta.url),
  JSON.stringify({ type: "FeatureCollection", an: AN, features: ozellikler }));
fs.writeFileSync(new URL("./ohm-kayitlari.json", import.meta.url),
  JSON.stringify({ kaynak: "OpenHistoricalMap (https://www.openhistoricalmap.org/copyright)", indirme: new Date().toISOString().slice(0, 10), an: AN, kutu: KUTU, kayitlar }, null, 2));
const say = (k) => kayitlar.filter((x) => x.kullanim.startsWith(k)).length;
console.log({ kayit: kayitlar.length, iceAktar: say("ice"), referans: say("referans"), kullanilamaz: say("kullan"), sureSn: (Date.now() - t0) / 1000 });
