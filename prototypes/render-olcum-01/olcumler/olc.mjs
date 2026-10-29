import puppeteer from "puppeteer-core";
import fs from "node:fs";

const cikti = process.argv[2];
const basliksiz = process.argv[3] !== "pencere";
fs.mkdirSync(cikti, { recursive: true });

const tarayici = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: basliksiz,
  args: ["--enable-gpu", "--ignore-gpu-blocklist", "--enable-precise-memory-info", "--window-size=1600,1000"],
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 2 },
});

const sonuclar = [];
for (const n of [5000, 20000, 50000]) {
  const sayfa = await tarayici.newPage();
  const hatalar = [];
  sayfa.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") hatalar.push(m.text()); });
  sayfa.on("pageerror", (e) => hatalar.push(String(e)));
  await sayfa.goto(`http://localhost:4173/?n=${n}&olcum=1`);
  await sayfa.waitForFunction(() => document.documentElement.dataset.olcum === "bitti", { timeout: 180000 });
  const s = await sayfa.evaluate(() => window.__OLCUM_SONUC);
  s.konsolHatalari = hatalar;
  sonuclar.push(s);
  await new Promise((r) => setTimeout(r, 300));
  await sayfa.screenshot({ path: `${cikti}/n${n}-genel.png` });
  // yakınlaş + seçim
  await sayfa.mouse.move(800, 450);
  for (let i = 0; i < 9; i++) await sayfa.keyboard.press("+");
  await new Promise((r) => setTimeout(r, 400));
  await sayfa.mouse.click(820, 470);
  await new Promise((r) => setTimeout(r, 400));
  await sayfa.screenshot({ path: `${cikti}/n${n}-yakin.png` });
  await sayfa.close();
  console.log(n, JSON.stringify(s.kare), "gpu:", s.gpu, "hatalar:", hatalar.length);
}
fs.writeFileSync(`${cikti}/sonuclar.json`, JSON.stringify(sonuclar, null, 2));
await tarayici.close();
