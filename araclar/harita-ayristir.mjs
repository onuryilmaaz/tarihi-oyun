// TASK-0022 (1. faz, DEC-0071): harita verisini kıta bazında, varlık başına ayrı dosyalara ayırır.
// Girdi: veri/senaryo-1453/harita.json, deniz.json (mevcut, tek dosyalık kaynak).
// Çıktı: veri/geom/<kita>/{devletler,bolgeler,sehirler,deniz}/*.json + arklar.json + _sira.json manifestleri.
// Orijinal dosyalara DOKUNMAZ; yalnızca yeni kaynak dosyaları üretir. Tersi için bkz. harita-derle.mjs.
// Çalıştırma: node araclar/harita-ayristir.mjs <kita-id> <devlet-indeks-baslangic> <devlet-indeks-bitis> [--deniz]
//   örnek (Avrupa + Yakındoğu, devlet indeks 0-75, deniz bölgeleri dahil):
//     node araclar/harita-ayristir.mjs avrupa-yakindogu 0 75 --deniz
//   deniz.json'daki TÜM bölgeler zaten Avrupa+Yakındoğu sularında (Akdeniz/Karadeniz); --deniz yalnızca BİR
//   kıtada verilmeli, yoksa aynı deniz bölgesi birden çok kıta klasöründe yinelenir (bkz. harita-derle.mjs).

import fs from "node:fs";

const [, , kita, bas, bit, ...bayraklar] = process.argv;
if (!kita || bas === undefined || bit === undefined) {
  console.error("Kullanım: node araclar/harita-ayristir.mjs <kita-id> <devlet-indeks-baslangic> <devlet-indeks-bitis> [--deniz]");
  process.exit(1);
}
const devletBas = Number(bas), devletBit = Number(bit);
const denizDahil = bayraklar.includes("--deniz");

const kok = new URL("../", import.meta.url);
const kaynakDizin = new URL("veri/senaryo-1453/", kok);
const hedef = new URL(`veri/geom/${kita}/`, kok);

const harita = JSON.parse(fs.readFileSync(new URL("harita.json", kaynakDizin), "utf8"));
const deniz = denizDahil ? JSON.parse(fs.readFileSync(new URL("deniz.json", kaynakDizin), "utf8")) : null;

const dizin = (p) => { const u = new URL(p, hedef); fs.mkdirSync(u, { recursive: true }); return u; };
const yaz = (dizinUrl, ad, veri) => fs.writeFileSync(new URL(ad, dizinUrl), JSON.stringify(veri, null, 1) + "\n");

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

// --- Deniz bölgeleri (şu an yalnızca nokta + komşuluk grafı; gerçek poligon yok) — yalnızca --deniz verilirse ---
let denizSayisi = 0;
if (denizDahil) {
  const denizDizin = dizin("deniz/");
  const denizSirasi = deniz.bolgeler.map((b) => b.id);
  deniz.bolgeler.forEach((b) => yaz(denizDizin, `${b.id}.json`, b));
  yaz(denizDizin, "_sira.json", denizSirasi);
  yaz(hedef, "deniz-ekstra.json", { aciklama: deniz.aciklama, limanlar: deniz.limanlar, bogazlar: deniz.bogazlar, donanmalar: deniz.donanmalar });
  denizSayisi = denizSirasi.length;
}

console.log(`[${kita}] ${devletSirasi.length} devlet, ${bolgeSayisi} bölge, ${sehirSayisi} şehir, ${kullanilanYaylar.size} yay, ${denizSayisi} deniz bölgesi ayrıştırıldı → ${hedef.pathname}`);
