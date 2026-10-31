// TASK-0025 (DEC-0074): şehir adaylarını Wikidata'dan (CC0) çeker → veri/senaryo-1453/sehirler-wikidata.json
// Aday: yerleşim (Q486972 alt sınıfları), günümüz nüfusu ≥ 15.000; 1453'ten sonra kurulduğu kayıtlı olanlar elenir.
// Seçim (seyreltme, devlet ataması) senaryo-uret.mjs içinde yapılır; bu dosya yalnızca ham aday listesidir.
// TASK-0030: büyük alan 10°×10° karelerle sorgulanır; sonuç mevcut dosyayla birleştirilir (qid'e göre), kutular
// listesi de büyür (senaryo-uret pilot devletleri bu kutulardan seçer).
// Çalıştırma: node araclar/sehir-wikidata.mjs batı güney doğu kuzey   (örn. -12 12 60 72)

import fs from "node:fs";

const [bati, guney, dogu, kuzey] = process.argv.slice(2, 6).map(Number);
if ([bati, guney, dogu, kuzey].some(Number.isNaN)) throw new Error("Kullanım: node araclar/sehir-wikidata.mjs batı güney doğu kuzey");
const ADIM = 10;
const UA = "tarihi-oyun-prototype/0.1 (https://github.com/onuryilmaaz/tarihi-oyun)";
const sorgu = (b, g, d, k) => `SELECT ?s ?trAd ?enAd ?koord ?nufus ?kurulus ?pleiades WHERE {
  SERVICE wikibase:box {
    ?s wdt:P625 ?koord .
    bd:serviceParam wikibase:cornerWest "Point(${b} ${g})"^^geo:wktLiteral .
    bd:serviceParam wikibase:cornerEast "Point(${d} ${k})"^^geo:wktLiteral .
  }
  ?s wdt:P31/wdt:P279* wd:Q486972 .
  ?s wdt:P1082 ?nufus . FILTER(?nufus >= 15000)
  OPTIONAL { ?s wdt:P571 ?kurulus }
  OPTIONAL { ?s wdt:P1584 ?pleiades }
  OPTIONAL { ?s rdfs:label ?trAd FILTER(lang(?trAd)="tr") }
  OPTIONAL { ?s rdfs:label ?enAd FILTER(lang(?enAd)="en") }
}`;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
async function cek(b, g, d, k) {
  for (let deneme = 1; ; deneme++) {
    const r = await fetch(`https://query.wikidata.org/sparql?${new URLSearchParams({ query: sorgu(b, g, d, k) })}`, {
      headers: { Accept: "application/sparql-results+json", "User-Agent": UA },
    });
    if (r.ok) return (await r.json()).results.bindings;
    if (deneme >= 4) throw new Error(`Wikidata yanıtı: ${r.status} (${b} ${g} ${d} ${k})`);
    await bekle(5000 * deneme);
  }
}

const hedef = new URL("../veri/senaryo-1453/sehirler-wikidata.json", import.meta.url);
const onceki = fs.existsSync(hedef) ? JSON.parse(fs.readFileSync(hedef, "utf8")) : null;
const adaylar = new Map((onceki?.adaylar ?? []).map((o) => [o.qid, { ...o, ham: false }]));
let satir = 0;
for (let g = guney; g < kuzey; g += ADIM) for (let b = bati; b < dogu; b += ADIM) {
  const rows = await cek(b, g, Math.min(dogu, b + ADIM), Math.min(kuzey, g + ADIM));
  satir += rows.length;
  for (const r of rows) {
    const qid = r.s.value.split("/").pop();
    const [lon, lat] = r.koord.value.match(/-?[\d.]+(e-?\d+)?/g).map(Number);
    const o = adaylar.get(qid)?.ham ? adaylar.get(qid) : { qid, ad: null, en: null, lon, lat, nufusGunumuz: 0, kurulus: null, pleiades: false, ham: true };
    o.ad ??= r.trAd?.value ?? null;
    o.en ??= r.enAd?.value ?? null;
    o.nufusGunumuz = Math.max(o.nufusGunumuz, Number(r.nufus.value));
    const yil = r.kurulus ? parseInt(r.kurulus.value, 10) : NaN;
    if (!Number.isNaN(yil)) o.kurulus = o.kurulus === null ? yil : Math.min(o.kurulus, yil);
    if (r.pleiades) o.pleiades = true;
    adaylar.set(qid, o);
  }
  process.stdout.write(`[${b},${g}] ${rows.length} satır\n`);
  await bekle(1000);
}
const temizAd = (a) => a?.replace(/ (Merkez|merkez)$/, "").replace(/ \(.*\)$/, "").trim();
const liste = [...adaylar.values()]
  .map(({ ham, ...o }) => (ham ? { ...o, ad: temizAd(o.ad ?? o.en), en: temizAd(o.en), lon: Math.round(o.lon * 1e4) / 1e4, lat: Math.round(o.lat * 1e4) / 1e4 } : o))
  .filter((o) => o.ad && !/^Q\d+$/.test(o.ad) && !(o.kurulus !== null && o.kurulus > 1453))
  .sort((a, b) => a.qid.localeCompare(b.qid, "en"));

const kutular = [...(onceki?.kutular ?? (onceki?.kutu ? [onceki.kutu] : [])), { bati, guney, dogu, kuzey }];
fs.writeFileSync(hedef, JSON.stringify({
  kaynak: "Wikidata (CC0) — https://www.wikidata.org/wiki/Wikidata:Licensing",
  sorgu: new Date().toISOString().slice(0, 10),
  kutular,
  aciklama: "Şehir adayları (TASK-0025/0030). nufusGunumuz günümüz nüfusudur; 1453 nüfusu senaryo-uret.mjs içinde tahmin edilir [TASLAK].",
  adaylar: liste,
}, null, 0) + "\n");
console.log(`${satir} satır → ${liste.length} aday (toplam), kutu sayısı ${kutular.length}`);
