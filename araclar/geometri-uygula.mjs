// TASK-0042: şehir bölüşümünü yeniden çalıştırmadan kıyıyı ve hareket ağını düzeltir.
// Varsayılan önizleme; dosyalara yalnızca --yaz ile yazar. Önce yedek ve bütün kontroller hazırlanır.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { agUret } from "./ag-uret.mjs";
import { geometriyiDenetle, millerLat } from "./geometri-kontrol.mjs";
import { kiyiGeometrisiniTamamla } from "./geometri-kiyi.mjs";

const kok = new URL("../", import.meta.url);
const hUrl = new URL("veri/senaryo-1453/harita.json", kok), sUrl = new URL("veri/senaryo-1453/senaryo.json", kok);
const hMetin = fs.readFileSync(hUrl, "utf8"), sMetin = fs.readFileSync(sUrl, "utf8");
const hIlk = JSON.parse(hMetin), sIlk = JSON.parse(sMetin);
const ham = JSON.parse(fs.readFileSync(new URL("prototypes/harita-gorsel-02/veri-ham/ne_10m_admin_0_countries.geojson", kok), "utf8"));
const { harita: h, rapor: kiyiRaporu } = kiyiGeometrisiniTamamla(hIlk, ham);
if (JSON.stringify(h.sehirler) !== JSON.stringify(hIlk.sehirler)) throw new Error("Şehir konumları değiştirilemez.");
if (h.birimler.some((b, i) => b.d !== hIlk.birimler[i].d)) throw new Error("Devletler arasında toprak devri yapılamaz.");
const ag = agUret(h, new URL("veri-ham/etopo2022-0.2deg.csv", kok));
const s = structuredClone(sIlk);
s.ag = ag.ag;
for (const c of s.sehirler) {
  const m = h.sehirler.find((x) => x.ad === c.ad);
  c.birim = h.birimler.findIndex((b) => b.s === c.ad);
  c.dugum = ag.dugumBul(m.x, millerLat(m.y), c.birim);
}
// Senaryodaki başlangıç ordularının düğümleri de değişen ağ sırasına bağlanır.
for (const o of s.ordular) {
  const eskiBirim = sIlk.ag.dugumler[o.dugum]?.b;
  const n = ag.dugumBul(o.x / 1e4, millerLat(o.y / 1e4), eskiBirim);
  if (n < 0) throw new Error(`${o.ad}: yeni hareket düğümü bulunamadı.`);
  o.dugum = n;
}
const hYeni = JSON.stringify(h);
s.surum = crypto.createHash("sha256").update(hYeni).update(JSON.stringify(s.ag)).digest("hex").slice(0, 10);
const kontrol = geometriyiDenetle(h, s);
if (kontrol.hatalar.length) throw new Error(kontrol.hatalar.join("\n"));
console.log(JSON.stringify({ kiyiRaporu, sehir: kontrol.sehir, hata: kontrol.hatalar.length, surum: s.surum }, null, 2));
if (process.argv.includes("--yaz")) {
  const uretiliyor = execFileSync("ps", ["-axo", "pid=,args="], { encoding: "utf8" }).split("\n")
    .some((satir) => /^\s*\d+\s+\S*node\s+[^\n]*araclar\/(senaryo-uret|harita-ayristir|deniz-ayristir)\.mjs/.test(satir));
  if (uretiliyor) throw new Error("Başka bir harita/senaryo üretimi sürüyor; dosyalara yazılmadı. Üretim bitince yeniden çalıştırın.");
  // Başka bir üretim aynı dosyaları değiştiriyorsa onun sonucunun üzerine yazma.
  if (fs.readFileSync(hUrl, "utf8") !== hMetin || fs.readFileSync(sUrl, "utf8") !== sMetin) throw new Error("Kaynaklar çalışma sırasında değişti; işlem uygulanmadı.");
  const yedek = fs.mkdtempSync(path.join(os.tmpdir(), "tarihi-geometri-oncesi-"));
  fs.writeFileSync(path.join(yedek, "harita.json"), hMetin);
  fs.writeFileSync(path.join(yedek, "senaryo.json"), sMetin);
  fs.writeFileSync(hUrl, hYeni);
  fs.writeFileSync(sUrl, JSON.stringify(s));
  // Şehir/bölge indeksleri korunur; sahiplik grubu değişmiş eski dosyalar yinelenmesin.
  const gruplar = [["avrupa-yakindogu", 0, 75], ["afrika", 76, 89], ["asya", 90, 125], ["amerika", 126, 131], ["sahipsiz", -1, -1]];
  for (const [kita, bas, bit] of gruplar) {
    execFileSync(process.execPath, [fileURLToPath(new URL("araclar/harita-ayristir.mjs", kok)), kita, ...(bas >= 0 ? [String(bas), String(bit)] : [])], { stdio: "inherit" });
    const bolgeler = new URL(`veri/geom/${kita}/bolgeler/`, kok);
    for (const ad of fs.readdirSync(bolgeler)) {
      if (!/^\d+\.json$/.test(ad)) continue;
      const i = Number(ad.slice(0, -5)), b = h.birimler[i];
      if (!b || b.d < bas || b.d > bit) fs.unlinkSync(new URL(ad, bolgeler));
    }
  }
  execFileSync(process.execPath, [fileURLToPath(new URL("araclar/harita-derle.mjs", kok))], { stdio: "inherit" });
  console.log(`Yazıldı; önceki harita/senaryo yedeği: ${yedek}`);
}
