// TASK-0022 (1. faz, DEC-0071): harita verisini kıta bazında, varlık başına ayrı dosyalara ayırır.
// Girdi: veri/senaryo-1453/harita.json (mevcut, tek dosyalık kaynak).
// Çıktı: veri/geom/<kita>/{devletler,bolgeler,sehirler}/*.json + arklar.json + _sira.json manifestleri.
// Deniz bölgeleri için bkz. deniz-ayristir.mjs (sınırı olan devletlere göre dağıtılır, ayrı bir desen).
// Orijinal dosyalara DOKUNMAZ; yalnızca yeni kaynak dosyaları üretir. Tersi için bkz. harita-derle.mjs.
// Çalıştırma:
//   node araclar/harita-ayristir.mjs <kita-id> <devlet-indeks-baslangic> <devlet-indeks-bitis>
//     örnek (Avrupa + Yakındoğu, devlet indeks 0-75): node araclar/harita-ayristir.mjs avrupa-yakindogu 0 75
//   node araclar/harita-ayristir.mjs sahipsiz
//     hiçbir devlete ait olmayan (d: -1, arka plan) bölgeleri "sahipsiz" etiketiyle veri/geom/sahipsiz/bolgeler/
//     altına ayırır (devlet/şehir yok, yalnızca bölge+yay).

import fs from "node:fs";

const [, , kita, bas, bit] = process.argv;
if (!kita) {
  console.error("Kullanım: node araclar/harita-ayristir.mjs <kita-id> <devlet-indeks-baslangic> <devlet-indeks-bitis>  |  node araclar/harita-ayristir.mjs sahipsiz");
  process.exit(1);
}
const sahipsizMi = kita === "sahipsiz";
if (!sahipsizMi && (bas === undefined || bit === undefined)) {
  console.error("Kullanım: node araclar/harita-ayristir.mjs <kita-id> <devlet-indeks-baslangic> <devlet-indeks-bitis>");
  process.exit(1);
}
const devletBas = Number(bas), devletBit = Number(bit);

const kok = new URL("../", import.meta.url);
const kaynakDizin = new URL("veri/senaryo-1453/", kok);
const hedef = new URL(`veri/geom/${kita}/`, kok);

const harita = JSON.parse(fs.readFileSync(new URL("harita.json", kaynakDizin), "utf8"));

const dizin = (p) => { const u = new URL(p, hedef); fs.mkdirSync(u, { recursive: true }); return u; };
const yaz = (dizinUrl, ad, veri) => fs.writeFileSync(new URL(ad, dizinUrl), JSON.stringify(veri, null, 1) + "\n");

if (sahipsizMi) {
  // --- Sahipsiz bölgeler (d: -1; hiçbir 1453 devletine ait olmayan arka plan) ---
  const bolgelerDizin = dizin("bolgeler/");
  const kullanilanYaylar = new Set();
  let bolgeSayisi = 0;
  harita.birimler.forEach((b, i) => {
    if (b.d !== -1) return;
    bolgeSayisi++;
    yaz(bolgelerDizin, `${i}.json`, { indeks: i, durum: "sahipsiz", ...b });
    for (const halka of b.p) for (const yuzuk of halka) for (const ref of yuzuk) kullanilanYaylar.add(ref < 0 ? ~ref : ref);
  });
  const arklarObj = {};
  for (const idx of kullanilanYaylar) arklarObj[idx] = harita.arklar[idx];
  yaz(hedef, "arklar.json", arklarObj);
  console.log(`[sahipsiz] ${bolgeSayisi} bölge, ${kullanilanYaylar.size} yay ayrıştırıldı → ${hedef.pathname}`);
  process.exit(0);
}

// --- Devletler ---
const devletlerDizin = dizin("devletler/");
const devletSirasi = [];
harita.devletler.forEach((v, i) => {
  if (i < devletBas || i > devletBit) return;
  devletSirasi.push(v.id);
  yaz(devletlerDizin, `${v.id}.json`, { indeks: i, ...v });
});
yaz(devletlerDizin, "_sira.json", devletSirasi);

// --- Bölgeler (arazi birimleri) ---
const bolgelerDizin = dizin("bolgeler/");
const kullanilanYaylar = new Set();
let bolgeSayisi = 0;
harita.birimler.forEach((b, i) => {
  if (b.d < devletBas || b.d > devletBit) return;
  bolgeSayisi++;
  yaz(bolgelerDizin, `${i}.json`, { indeks: i, ...b });
  for (const halka of b.p) for (const yuzuk of halka) for (const ref of yuzuk) kullanilanYaylar.add(ref < 0 ? ~ref : ref);
});

// --- Şehirler ---
const sehirlerDizin = dizin("sehirler/");
let sehirSayisi = 0;
harita.sehirler.forEach((s, i) => {
  if (s.d < devletBas || s.d > devletBit) return;
  sehirSayisi++;
  yaz(sehirlerDizin, `${i}.json`, { indeks: i, ...s });
});

// --- Yaylar (ark) havuzu: bu kıtanın bölgelerinin kullandığı yaylar, orijinal küresel indeksle ---
const arklarObj = {};
for (const idx of kullanilanYaylar) arklarObj[idx] = harita.arklar[idx];
yaz(hedef, "arklar.json", arklarObj);

console.log(`[${kita}] ${devletSirasi.length} devlet, ${bolgeSayisi} bölge, ${sehirSayisi} şehir, ${kullanilanYaylar.size} yay ayrıştırıldı → ${hedef.pathname}`);
