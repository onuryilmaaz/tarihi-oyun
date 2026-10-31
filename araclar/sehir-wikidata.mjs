// TASK-0025 (DEC-0074): şehir adaylarını Wikidata'dan (CC0) çeker → veri/senaryo-1453/sehirler-wikidata.json
// Aday: yerleşim (Q486972 alt sınıfları), günümüz nüfusu ≥ 15.000; 1453'ten sonra kurulduğu kayıtlı olanlar elenir.
// Seçim (seyreltme, devlet ataması) senaryo-uret.mjs içinde yapılır; bu dosya yalnızca ham aday listesidir.
// Çalıştırma: node araclar/sehir-wikidata.mjs [batı güney doğu kuzey]   (varsayılan pilot: 13 34 45 47)

import fs from "node:fs";

const [bati, guney, dogu, kuzey] = process.argv.length >= 6 ? process.argv.slice(2, 6).map(Number) : [13, 34, 45, 47];
const UA = "tarihi-oyun-prototype/0.1 (https://github.com/onuryilmaaz/tarihi-oyun)";
const sorgu = `SELECT ?s ?trAd ?enAd ?koord ?nufus ?kurulus ?pleiades WHERE {
  SERVICE wikibase:box {
    ?s wdt:P625 ?koord .
    bd:serviceParam wikibase:cornerWest "Point(${bati} ${guney})"^^geo:wktLiteral .
    bd:serviceParam wikibase:cornerEast "Point(${dogu} ${kuzey})"^^geo:wktLiteral .
  }
  ?s wdt:P31/wdt:P279* wd:Q486972 .
  ?s wdt:P1082 ?nufus . FILTER(?nufus >= 15000)
  OPTIONAL { ?s wdt:P571 ?kurulus }
  OPTIONAL { ?s wdt:P1584 ?pleiades }
  OPTIONAL { ?s rdfs:label ?trAd FILTER(lang(?trAd)="tr") }
  OPTIONAL { ?s rdfs:label ?enAd FILTER(lang(?enAd)="en") }
}`;

const r = await fetch(`https://query.wikidata.org/sparql?${new URLSearchParams({ query: sorgu })}`, {
  headers: { Accept: "application/sparql-results+json", "User-Agent": UA },
});
if (!r.ok) throw new Error(`Wikidata yanıtı: ${r.status}`);
const satirlar = (await r.json()).results.bindings;

const adaylar = new Map();
for (const b of satirlar) {
  const qid = b.s.value.split("/").pop();
  const [lon, lat] = b.koord.value.match(/-?[\d.]+(e-?\d+)?/g).map(Number);
  const o = adaylar.get(qid) ?? { qid, ad: null, en: null, lon, lat, nufusGunumuz: 0, kurulus: null, pleiades: false };
  o.ad ??= b.trAd?.value ?? null;
  o.en ??= b.enAd?.value ?? null;
  o.nufusGunumuz = Math.max(o.nufusGunumuz, Number(b.nufus.value));
  const yil = b.kurulus ? parseInt(b.kurulus.value, 10) : NaN; // "-0300-01-01…" → -300
  if (!Number.isNaN(yil)) o.kurulus = o.kurulus === null ? yil : Math.min(o.kurulus, yil);
  if (b.pleiades) o.pleiades = true;
  adaylar.set(qid, o);
}
const temizAd = (a) => a?.replace(/ (Merkez|merkez)$/, "").replace(/ \(.*\)$/, "").trim();
const liste = [...adaylar.values()]
  .map((o) => ({ ...o, ad: temizAd(o.ad ?? o.en), en: temizAd(o.en) }))
  .filter((o) => o.ad && !/^Q\d+$/.test(o.ad) && !(o.kurulus !== null && o.kurulus > 1453))
  .map((o) => ({ ...o, lon: Math.round(o.lon * 1e4) / 1e4, lat: Math.round(o.lat * 1e4) / 1e4 }))
  .sort((a, b) => a.qid.localeCompare(b.qid, "en"));

const hedef = new URL("../veri/senaryo-1453/sehirler-wikidata.json", import.meta.url);
fs.writeFileSync(hedef, JSON.stringify({
  kaynak: "Wikidata (CC0) — https://www.wikidata.org/wiki/Wikidata:Licensing",
  sorgu: new Date().toISOString().slice(0, 10),
  kutu: { bati, guney, dogu, kuzey },
  aciklama: "Şehir adayları (TASK-0025). nufusGunumuz günümüz nüfusudur; 1453 nüfusu senaryo-uret.mjs içinde tahmin edilir [TASLAK].",
  adaylar: liste,
}, null, 0) + "\n");
console.log(`${satirlar.length} satır → ${adaylar.size} yerleşim → ${liste.length} aday (1453 sonrası kurulanlar elendi)`);
