// Wikidata (CC0) → public/veri/wikidata-1453.json
// Ayrıntı bölgesi devletleri için: Wikidata öğesi, kuruluş/yıkılış, 1453'teki başkent ve devlet başkanı.
// Çalıştırma: node scripts/wikidata-sorgula.mjs

import fs from "node:fs";

const API = "https://www.wikidata.org/w/api.php";
const UA = "tarihi-oyun-prototype/0.1 (https://github.com/onuryilmaaz/tarihi-oyun)";
const YIL = 1453;

// Proje devlet kimliği → Wikidata arama metni (İngilizce) ya da elle doğrulanmış QID (arama yapılmaz).
const ARAMA = {
  osm: "Ottoman Empire", biz: "Byzantine Empire", mor: "Despotate of the Morea", atn: "Duchy of Athens",
  trb: "Empire of Trebizond", kar: "Karamanids", can: "Q2096678", dul: "Dulkadirids", ram: "Ramadanid",
  akk: "Aq Qoyunlu", kkk: "Qara Qoyunlu", mem: "Mamluk Sultanate", grc: "Kingdom of Georgia",
  sir: "Shirvanshah", dag: "Shamkhalate of Tarki", cer: "Circassia", ser: "Serbian Despotate",
  bos: "Kingdom of Bosnia", hrc: "Duchy of Saint Sava", zet: "Zeta under the Crnojević", arn: "League of Lezhë",
  rag: "Republic of Ragusa", ven: "Republic of Venice", cen: "Republic of Genoa", rod: "Knights Hospitaller",
  kib: "Kingdom of Cyprus", nax: "Duchy of the Archipelago", hun: "Q16056854",
  efl: "Principality of Wallachia", bog: "Principality of Moldavia", kir: "Crimean Khanate",
  teo: "Principality of Theodoro", alt: "Great Horde", kaz: "Khanate of Kazan", nog: "Nogai Horde",
  lit: "Grand Duchy of Lithuania", pol: "Crown of the Kingdom of Poland", mos: "Grand Duchy of Moscow",
  nap: "Kingdom of Naples", pap: "Papal States", ara: "Crown of Aragon", tim: "Timurid Empire",
  haf: "Hafsid dynasty", avs: "Archduchy of Austria", boh: "Kingdom of Bohemia",
};

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", origin: "*", ...params })}`;
  for (let deneme = 1; ; deneme++) {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    const j = r.ok ? await r.json() : { error: { code: `http-${r.status}` } };
    const mesgul = /busy|maxlag|ratelimit|http-429|http-5/.test(j.error?.code ?? "");
    if (!mesgul || deneme >= 6) return j;
    await bekle(2000 * deneme);
  }
}

const yilOf = (dv) => (dv?.value?.time ? Number(dv.value.time.slice(0, 5)) : null);
const deger = (c) => c.mainsnak?.datavalue;
const nitelikYil = (c, p) => (c.qualifiers?.[p]?.[0] ? yilOf(c.qualifiers[p][0].datavalue) : null);
// Bir ifadenin 1453'te geçerli olup olmadığı: başlangıç (P580) ≤ 1453 ≤ bitiş (P582); nitelik yoksa "belirsiz"
function gecerlilik(c) {
  const b = nitelikYil(c, "P580"), s = nitelikYil(c, "P582");
  if (b === null && s === null) return "belirsiz";
  return (b === null || b <= YIL) && (s === null || s >= YIL) ? "gecerli" : "degil";
}

const sonuc = {};
const etiketIstek = new Set();
for (const [id, metin] of Object.entries(ARAMA)) {
  const ara = /^Q\d+$/.test(metin) // elle doğrulanmış QID
    ? { search: [{ id: metin }] }
    : await api({ action: "wbsearchentities", search: metin, language: "en", limit: "5", type: "item" });
  if (!ara.search) { console.warn("Arama hatası:", metin, JSON.stringify(ara).slice(0, 200)); sonuc[id] = { arama: metin, bulunamadi: true }; continue; }
  const adaylar = ara.search.map((s) => s.id);
  if (!adaylar.length) { sonuc[id] = { arama: metin, bulunamadi: true }; continue; }
  const ogeler = (await api({ action: "wbgetentities", ids: adaylar.join("|"), props: "claims|labels|descriptions", languages: "tr|en" })).entities;
  // 1453'ü kapsayan ilk aday (kuruluş ≤ 1453 ≤ yıkılış); yoksa ilk aday
  let secilen = null;
  for (const q of adaylar) {
    const c = ogeler[q].claims ?? {};
    const k = yilOf(c.P571?.[0] && deger(c.P571[0])), y = yilOf(c.P576?.[0] && deger(c.P576[0]));
    if (k !== null && k <= YIL && (y === null || y >= YIL)) { secilen = q; break; }
  }
  const kesin = secilen !== null;
  secilen ??= adaylar[0];
  const o = ogeler[secilen], c = o.claims ?? {};
  const ifadeler = (p) => (c[p] ?? []).map((x) => ({ q: deger(x)?.value?.id, durum: gecerlilik(x), b: nitelikYil(x, "P580"), s: nitelikYil(x, "P582") }))
    .filter((x) => x.q);
  const baskentler = ifadeler("P36"), basbakanlar = ifadeler("P35");
  for (const x of [...baskentler, ...basbakanlar]) etiketIstek.add(x.q);
  sonuc[id] = {
    arama: metin, qid: secilen, eslesme: kesin ? "1453'ü kapsıyor" : "tarih doğrulanamadı (ilk arama sonucu)",
    etiket: o.labels?.tr?.value ?? o.labels?.en?.value, aciklama: o.descriptions?.en?.value ?? null,
    kurulus: yilOf(c.P571?.[0] && deger(c.P571[0])), yikilis: yilOf(c.P576?.[0] && deger(c.P576[0])),
    baskentler, devletBaskanlari: basbakanlar,
  };
  await bekle(1000);
}

// Başkent ve hükümdar etiketleri
const ids = [...etiketIstek];
const etiketler = {};
for (let i = 0; i < ids.length; i += 50) {
  const e = (await api({ action: "wbgetentities", ids: ids.slice(i, i + 50).join("|"), props: "labels", languages: "tr|en" })).entities;
  for (const [q, v] of Object.entries(e)) etiketler[q] = v.labels?.tr?.value ?? v.labels?.en?.value ?? q;
}
for (const s of Object.values(sonuc)) {
  for (const x of [...(s.baskentler ?? []), ...(s.devletBaskanlari ?? [])]) x.ad = etiketler[x.q];
  // yalnızca 1453'te geçerli olanları ve niteliksiz olanları tut (uzun listeler için)
  if (s.devletBaskanlari) s.devletBaskanlari = s.devletBaskanlari.filter((x) => x.durum === "gecerli");
}

fs.writeFileSync(new URL("../public/veri/wikidata-1453.json", import.meta.url), JSON.stringify({
  kaynak: "Wikidata (CC0) — https://www.wikidata.org/wiki/Wikidata:Licensing",
  sorgu: new Date().toISOString().slice(0, 10), yil: YIL, devletler: sonuc,
}, null, 2));
for (const [id, s] of Object.entries(sonuc)) {
  const bk = (s.baskentler ?? []).map((x) => `${x.ad}${x.durum === "gecerli" ? "✓" : x.durum === "degil" ? "✗" : "?"}`).join(", ");
  const hk = (s.devletBaskanlari ?? []).map((x) => x.ad).join(", ");
  console.log(`${id.padEnd(4)} ${s.qid ?? "-"} ${(s.etiket ?? "").slice(0, 34).padEnd(34)} ${s.kurulus ?? "?"}–${s.yikilis ?? "?"} | ${s.eslesme ?? "BULUNAMADI"} | başkent: ${bk} | 1453 başkanı: ${hk}`);
}
