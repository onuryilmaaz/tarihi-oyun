// TASK-0022 (1. faz, DEC-0071): deniz bölgelerini, sınırı olan (limanı bulunan) devletlere göre dağıtır.
// Her deniz bölgesi, limanlarının sahibi olan HER devletin kendi kıta/devlet klasörüne bir kopya olarak yazılır
// (içerik küçük olduğu için yineleme zararsızdır — "parça ver"). Hiçbir devletin limanı bulunmayan bölgeler
// (ör. Azak Denizi, Manş: yalnızca geçiş suları) "uluslararası deniz alanı" sayılır, kıta/devletten bağımsız
// veri/geom/uluslararasi-sular/ altına yazılır.
// Girdi: veri/senaryo-1453/harita.json, deniz.json. Çıktı: veri/geom/<kita>/deniz/<devlet-id>/<id>.json,
// veri/geom/uluslararasi-sular/<id>.json, veri/geom/deniz-sira.json, veri/geom/deniz-ekstra.json.
// Çalıştırma: node araclar/deniz-ayristir.mjs

import fs from "node:fs";

const kok = new URL("../", import.meta.url);
const kaynakDizin = new URL("veri/senaryo-1453/", kok);
const geomDizin = new URL("veri/geom/", kok);

const harita = JSON.parse(fs.readFileSync(new URL("harita.json", kaynakDizin), "utf8"));
const deniz = JSON.parse(fs.readFileSync(new URL("deniz.json", kaynakDizin), "utf8"));

// Devlet indeksi → kıta (bkz. tasks/TASK-0022.md; devletler dizisi coğrafi olarak gruplu).
const kitaAraliklari = [
  { kita: "avrupa-yakindogu", bas: 0, bit: 75 },
  { kita: "afrika", bas: 76, bit: 89 },
  { kita: "asya", bas: 90, bit: 125 },
  { kita: "amerika", bas: 126, bit: 131 },
];
const devletKitasi = (devletIndeks) => kitaAraliklari.find((k) => devletIndeks >= k.bas && devletIndeks <= k.bit)?.kita;

const sehirByAd = new Map(harita.sehirler.map((s) => [s.ad, s]));
const dizin = (p) => { const u = new URL(p, geomDizin); fs.mkdirSync(u, { recursive: true }); return u; };
const yaz = (dizinUrl, ad, veri) => fs.writeFileSync(new URL(ad, dizinUrl), JSON.stringify(veri, null, 1) + "\n");

let devletParcasi = 0, uluslararasi = 0;
for (const b of deniz.bolgeler) {
  const limanlar = deniz.limanlar[b.id] ?? [];
  const devletIdleri = new Set();
  for (const ad of limanlar) {
    const s = sehirByAd.get(ad);
    if (s) devletIdleri.add(harita.devletler[s.d].id);
  }
  if (!devletIdleri.size) {
    yaz(dizin("uluslararasi-sular/"), `${b.id}.json`, { ...b, durum: "uluslararasi" });
    uluslararasi++;
    continue;
  }
  for (const devletId of devletIdleri) {
    const devletIndeks = harita.devletler.findIndex((v) => v.id === devletId);
    const kita = devletKitasi(devletIndeks);
    yaz(dizin(`${kita}/deniz/${devletId}/`), `${b.id}.json`, { ...b, sinirdasDevlet: devletId });
    devletParcasi++;
  }
}

yaz(geomDizin, "deniz-sira.json", deniz.bolgeler.map((b) => b.id));
yaz(geomDizin, "deniz-ekstra.json", { aciklama: deniz.aciklama, limanlar: deniz.limanlar, bogazlar: deniz.bogazlar, donanmalar: deniz.donanmalar });

console.log(`${deniz.bolgeler.length} deniz bölgesi: ${devletParcasi} devlet-parçası yazıldı, ${uluslararasi} bölge uluslararası sayıldı (limansız).`);
