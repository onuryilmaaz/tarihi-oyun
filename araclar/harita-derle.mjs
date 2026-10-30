// TASK-0022 (1. faz, DEC-0071): ayrıştırılmış kıta dosyalarını (harita-ayristir.mjs çıktısı) mevcut
// harita.json/deniz.json ile birleştirip tek dosya üretir/doğrular. Henüz ayrıştırılmamış kıtaların
// devlet/bölge/şehir kayıtları mevcut harita.json'dan değişmeden alınır (eklemeli geçiş).
// Çalıştırma: node araclar/harita-derle.mjs [--yaz] [--kita=avrupa-yakindogu]
//   --yaz verilmezse yalnızca doğrular (mevcut dosyalarla birebir eşleşmeli); --yaz verilirse üzerine yazar.

import fs from "node:fs";

const argv = process.argv.slice(2);
const yaz = argv.includes("--yaz");
const kitaArglari = argv.filter((a) => a.startsWith("--kita=")).map((a) => a.slice("--kita=".length));
const kitalar = kitaArglari.length ? kitaArglari : ["avrupa-yakindogu", "afrika", "asya", "amerika"];

const kok = new URL("../", import.meta.url);
const kaynakDizin = new URL("veri/senaryo-1453/", kok);

const haritaOrijinal = JSON.parse(fs.readFileSync(new URL("harita.json", kaynakDizin), "utf8"));
const denizOrijinal = JSON.parse(fs.readFileSync(new URL("deniz.json", kaynakDizin), "utf8"));

// Derin kopya: ayrıştırılmamış kıtaların kayıtları bu diziler üzerinde kalır, yalnızca ayrıştırılan
// aralıklar üzerine yazılır.
const devletler = structuredClone(haritaOrijinal.devletler);
const birimler = structuredClone(haritaOrijinal.birimler);
const sehirler = structuredClone(haritaOrijinal.sehirler);
const arklar = structuredClone(haritaOrijinal.arklar);
let denizBolgeleri = structuredClone(denizOrijinal.bolgeler);
let denizEkstra = { aciklama: denizOrijinal.aciklama, limanlar: denizOrijinal.limanlar, bogazlar: denizOrijinal.bogazlar, donanmalar: denizOrijinal.donanmalar };

const temizle = (o) => { const { indeks, ...r } = o; return r; };

for (const kita of kitalar) {
  const kitaDizin = new URL(`veri/geom/${kita}/`, kok);
  if (!fs.existsSync(kitaDizin)) { console.log(`[${kita}] henüz ayrıştırılmadı, atlanıyor.`); continue; }
  const oku = (p) => JSON.parse(fs.readFileSync(new URL(p, kitaDizin), "utf8"));

  const devletSirasi = oku("devletler/_sira.json");
  for (const id of devletSirasi) {
    const v = oku(`devletler/${id}.json`);
    devletler[v.indeks] = temizle(v);
  }

  for (const dosya of fs.readdirSync(new URL("bolgeler/", kitaDizin))) {
    const b = oku(`bolgeler/${dosya}`);
    birimler[b.indeks] = temizle(b);
  }

  for (const dosya of fs.readdirSync(new URL("sehirler/", kitaDizin))) {
    const s = oku(`sehirler/${dosya}`);
    sehirler[s.indeks] = temizle(s);
  }

  const kitaYaylar = oku("arklar.json");
  for (const [idx, ark] of Object.entries(kitaYaylar)) arklar[Number(idx)] = ark;

  if (fs.existsSync(new URL("deniz/_sira.json", kitaDizin))) {
    const denizSirasi = oku("deniz/_sira.json");
    // deniz.json'daki bölgeler şu an yalnızca bu kıtada (--deniz yalnızca bir kıtada çalıştırılmalı).
    denizBolgeleri = denizSirasi.map((id) => oku(`deniz/${id}.json`));
    denizEkstra = oku("deniz-ekstra.json");
  }
}

const haritaYeni = { ...haritaOrijinal, devletler, birimler, sehirler, arklar };
const denizYeni = { aciklama: denizEkstra.aciklama, bolgeler: denizBolgeleri, limanlar: denizEkstra.limanlar, bogazlar: denizEkstra.bogazlar, donanmalar: denizEkstra.donanmalar };

const esit = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const haritaEsit = esit(haritaYeni, haritaOrijinal);
const denizEsit = esit(denizYeni, denizOrijinal);
console.log("harita.json birebir eşleşiyor mu:", haritaEsit);
console.log("deniz.json birebir eşleşiyor mu:", denizEsit);

if (yaz) {
  fs.writeFileSync(new URL("harita.json", kaynakDizin), JSON.stringify(haritaYeni));
  fs.writeFileSync(new URL("deniz.json", kaynakDizin), JSON.stringify(denizYeni, null, 1) + "\n");
  console.log("Yazıldı.");
} else if (!haritaEsit || !denizEsit) {
  process.exitCode = 1;
}
