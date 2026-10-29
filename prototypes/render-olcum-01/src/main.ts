import * as THREE from "three";
import { haritaUret, hucreBul, type HaritaVerisi } from "./veri";
import { katmanlariKur, secimiUygula, type HaritaKatmanlari } from "./harita";
import { KareOlcer, gpuAdi, heapMb, type KareOzeti } from "./olcum";

const parametreler = new URLSearchParams(location.search);
const N_SECENEKLERI = [5000, 20000, 50000];
const hedefN = Number(parametreler.get("n")) || 5000;
const tohum = Number(parametreler.get("tohum")) || 1453;
const otomatikOlcum = parametreler.get("olcum") === "1";
const OLCUM_SURESI = 12000;
const ISINMA = 500;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function dl(el: HTMLElement, satirlar: [string, string][]) {
  el.innerHTML = satirlar.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
}

const ms = (x: number) => `${Math.round(x)} ms`;
const sayi = (x: number) => x.toLocaleString("tr-TR");
const sinirla = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

interface Gorunum { cx: number; cy: number; z: number }

function baslat() {
  const tBaslangic = performance.now();
  const v: HaritaVerisi = haritaUret(hedefN, tohum);
  const tVeri = performance.now() - tBaslangic;

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  const pikselOrani = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pikselOrani);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.prepend(renderer.domElement);

  const tKatman0 = performance.now();
  const k: HaritaKatmanlari = katmanlariKur(v, pikselOrani);
  const tKatman = performance.now() - tKatman0;

  const sahne = new THREE.Scene();
  sahne.background = new THREE.Color(0x9fb8c6);
  sahne.add(k.grup);
  const kamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  kamera.position.z = 10;

  const devletAraziSayisi = new Int32Array(v.devletler.length);
  for (let i = 0; i < v.hucreSayisi; i++) if (v.devletId[i] >= 0) devletAraziSayisi[v.devletId[i]]++;
  const yerlesimVar = new Uint8Array(v.hucreSayisi);
  for (const h of v.yerlesimler) yerlesimVar[h] = 1;
  const baskentMi = new Uint8Array(v.hucreSayisi);
  for (const d of v.devletler) baskentMi[d.baskent] = 1;

  // --- Görünüm
  let genislik = window.innerWidth, yukseklik = window.innerHeight;
  const sigdirZ = () => Math.min(genislik / v.W, yukseklik / v.H) * 0.98;
  const zMin = () => sigdirZ() * 0.8;
  const zMaks = () => Math.max(sigdirZ() * 8, 160 / v.ortHucreBoyu);
  const g: Gorunum = { cx: v.W / 2, cy: v.H / 2, z: sigdirZ() };

  const gorunumuUygula = () => {
    g.z = sinirla(g.z, zMin(), zMaks());
    g.cx = sinirla(g.cx, 0, v.W);
    g.cy = sinirla(g.cy, 0, v.H);
    kamera.left = -genislik / (2 * g.z);
    kamera.right = genislik / (2 * g.z);
    kamera.top = yukseklik / (2 * g.z);
    kamera.bottom = -yukseklik / (2 * g.z);
    kamera.position.x = g.cx;
    kamera.position.y = g.cy;
    kamera.updateProjectionMatrix();

    // Ayrıntı düzeyi: arazi birimi ekranda kaç piksel?
    const hucrePx = g.z * v.ortHucreBoyu;
    const araziOp = sinirla((hucrePx - 8) / 12, 0, 1);
    (k.araziSiniri.material as THREE.LineBasicMaterial).opacity = araziOp * 0.5;
    k.araziSiniri.visible = araziOp > 0;
    const yerOp = sinirla((hucrePx - 14) / 10, 0, 1);
    (k.yerlesim.material as THREE.PointsMaterial).opacity = yerOp;
    k.yerlesim.visible = yerOp > 0;
    const bOp = sinirla((hucrePx - 3) / 5, 0, 1);
    (k.baskent.material as THREE.PointsMaterial).opacity = bOp;
    k.baskent.visible = bOp > 0;
  };

  const ekrandanDunyaya = (px: number, py: number): [number, number] =>
    [g.cx + (px - genislik / 2) / g.z, g.cy - (py - yukseklik / 2) / g.z];

  const yenidenBoyutla = () => {
    genislik = window.innerWidth;
    yukseklik = window.innerHeight;
    renderer.setSize(genislik, yukseklik);
    for (const m of k.cizgiMalzemeleri) m.resolution.set(genislik * pikselOrani, yukseklik * pikselOrani);
    gorunumuUygula();
  };
  window.addEventListener("resize", yenidenBoyutla);
  yenidenBoyutla();

  // --- Etkileşim
  let olcumSurecek = false;
  let surukleme: { x: number; y: number; hareket: boolean } | null = null;
  let fare: { x: number; y: number } | null = null;
  let fareDegisti = false;
  let secili = -1;
  let sonBulunan = 0;
  const ipucu = $("ipucu");
  const bilgi = $("bilgi");

  const yakinlastir = (carpan: number, px: number, py: number) => {
    const [wx, wy] = ekrandanDunyaya(px, py);
    g.z = sinirla(g.z * carpan, zMin(), zMaks());
    g.cx = wx - (px - genislik / 2) / g.z;
    g.cy = wy + (py - yukseklik / 2) / g.z;
  };

  const sec = (h: number) => {
    if (h >= 0 && !v.kara[h]) h = -1;
    secimiUygula(k, v, secili, h);
    secili = h;
    if (h < 0) {
      bilgi.style.display = "none";
      return;
    }
    const d = v.devletler[v.devletId[h]];
    const renk = new THREE.Color().setHSL(d.hsl[0], d.hsl[1], d.hsl[2], THREE.SRGBColorSpace);
    bilgi.style.display = "block";
    bilgi.innerHTML = `<h1><span class="renk" style="background:#${renk.getHexString(THREE.SRGBColorSpace)}"></span>${d.ad}</h1>
      <dl style="margin-top:8px">
        <dt>Arazi birimi</dt><dd>#${h}</dd>
        <dt>Devletin arazisi</dt><dd>${sayi(devletAraziSayisi[v.devletId[h]])}</dd>
        <dt>Yerleşim</dt><dd>${baskentMi[h] ? "Başkent" : yerlesimVar[h] ? "Var" : "Yok"}</dd>
      </dl>`;
  };

  const tuval = renderer.domElement;
  tuval.addEventListener("pointerdown", (e) => {
    if (olcumSurecek) return;
    surukleme = { x: e.clientX, y: e.clientY, hareket: false };
    tuval.setPointerCapture(e.pointerId);
  });
  tuval.addEventListener("pointermove", (e) => {
    fare = { x: e.clientX, y: e.clientY };
    fareDegisti = true;
    if (!surukleme || olcumSurecek) return;
    const dx = e.clientX - surukleme.x, dy = e.clientY - surukleme.y;
    if (Math.abs(dx) + Math.abs(dy) > 0) {
      g.cx -= dx / g.z;
      g.cy += dy / g.z;
      surukleme.x = e.clientX;
      surukleme.y = e.clientY;
      surukleme.hareket = true;
    }
  });
  tuval.addEventListener("pointerup", (e) => {
    if (surukleme && !surukleme.hareket) {
      const [wx, wy] = ekrandanDunyaya(e.clientX, e.clientY);
      sec(hucreBul(v, wx, wy, sonBulunan));
    }
    surukleme = null;
  });
  tuval.addEventListener("pointerleave", () => {
    fare = null;
    ipucu.style.display = "none";
  });
  tuval.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (olcumSurecek) return;
    yakinlastir(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
  }, { passive: false });
  window.addEventListener("keydown", (e) => {
    if (olcumSurecek) return;
    const adim = 120 / g.z;
    if (e.key === "ArrowLeft") g.cx -= adim;
    else if (e.key === "ArrowRight") g.cx += adim;
    else if (e.key === "ArrowUp") g.cy += adim;
    else if (e.key === "ArrowDown") g.cy -= adim;
    else if (e.key === "+" || e.key === "=") yakinlastir(1.25, genislik / 2, yukseklik / 2);
    else if (e.key === "-") yakinlastir(0.8, genislik / 2, yukseklik / 2);
    else if (e.key === "Escape") sec(-1);
    else return;
    e.preventDefault();
  });

  // --- Panel
  const nSecim = $("nSecim");
  for (const n of N_SECENEKLERI) {
    const b = document.createElement("button");
    b.textContent = sayi(n);
    if (n === hedefN) b.className = "etkin";
    b.onclick = () => {
      parametreler.set("n", String(n));
      parametreler.delete("olcum");
      location.search = parametreler.toString();
    };
    nSecim.append(b);
  }

  const gl = renderer.getContext();
  const gpu = gpuAdi(gl);
  const kurulum: Record<string, number> = {
    "veri.noktalar": v.sureler.noktalar,
    "veri.voronoi": v.sureler.voronoi,
    "veri.devletler": v.sureler.devletler,
    "veri.kenarlar": v.sureler.kenarlar,
    "veri.toplam": tVeri,
    "katman.ucgenleme": k.sureler.ucgenleme,
    "katman.geometri": k.sureler.geometri,
    "katman.toplam": tKatman,
  };
  let ilkKareMs = 0;

  const kurulumuGoster = () => dl($("kurulum"), [
    ["Kara arazi birimi", sayi(v.karaSayisi)],
    ["Toplam hücre (deniz dahil)", sayi(v.hucreSayisi)],
    ["Devlet", sayi(v.devletler.length)],
    ["Yerleşim", sayi(v.yerlesimler.length)],
    ["Üçgen", sayi(k.ucgenSayisi)],
    ["Veri üretimi", ms(tVeri)],
    ["three.js katmanları", ms(tKatman)],
    ["İlk kare (gölgelendirici dahil)", ilkKareMs ? ms(ilkKareMs) : "…"],
    ["GPU", `<span title="${gpu}">${gpu.length > 26 ? gpu.slice(0, 25) + "…" : gpu}</span>`],
  ]);
  kurulumuGoster();

  const canli = new KareOlcer(240);
  const olcum = new KareOlcer(4000);
  let cizimCagrisiToplam = 0, cizimKare = 0;
  let olcumBaslangic = 0;
  let sonuc: Record<string, unknown> | null = null;

  const olcumYolu = (t: number) => {
    // 0–4 sn: tüm dünya üzerinde kaydırma; 4–8: derin yakınlaşma + kaydırma; 8–12: uzaklaşma
    const z0 = sigdirZ(), z1 = zMaks();
    if (t < 4000) {
      const u = t / 4000;
      g.z = z0 * 1.6;
      g.cx = v.W * (0.25 + 0.5 * u);
      g.cy = v.H * 0.5;
    } else if (t < 8000) {
      const u = (t - 4000) / 4000;
      g.z = z0 * 1.6 * Math.pow(z1 / (z0 * 1.6), Math.min(1, u * 1.5));
      g.cx = v.W * (0.75 - 0.25 * u);
      g.cy = v.H * (0.5 + 0.12 * Math.sin(u * Math.PI * 2));
    } else {
      const u = (t - 8000) / 4000;
      g.z = z1 * Math.pow(z0 / z1, u);
      g.cx = v.W * 0.5;
      g.cy = v.H * 0.5;
    }
  };

  const olcumuBaslat = () => {
    sec(-1);
    olcum.sifirla();
    cizimCagrisiToplam = 0;
    cizimKare = 0;
    olcumBaslangic = performance.now();
    olcumSurecek = true;
    ipucu.style.display = "none";
    ($("olcBtn") as HTMLButtonElement).disabled = true;
    $("olcBtn").textContent = "Ölçülüyor…";
  };

  const olcumuBitir = () => {
    olcumSurecek = false;
    const ozet: KareOzeti = olcum.ozet();
    sonuc = {
      gorev: "TASK-0001",
      tarih: new Date().toISOString(),
      hedefN,
      tohum,
      karaAraziBirimi: v.karaSayisi,
      toplamHucre: v.hucreSayisi,
      devlet: v.devletler.length,
      yerlesim: v.yerlesimler.length,
      ucgen: k.ucgenSayisi,
      ortCizimCagrisi: Math.round((cizimCagrisiToplam / Math.max(1, cizimKare)) * 10) / 10,
      kurulumMs: Object.fromEntries(Object.entries({ ...kurulum, ilkKare: ilkKareMs })
        .map(([a, b]) => [a, Math.round(b)])),
      kare: ozet,
      heapMb: heapMb(),
      tuval: `${genislik}x${yukseklik} @${pikselOrani}x`,
      gpu,
      tarayici: navigator.userAgent,
    };
    $("sonucJson").textContent = JSON.stringify(sonuc, null, 2);
    $("sonuc").style.display = "block";
    ($("olcBtn") as HTMLButtonElement).disabled = false;
    $("olcBtn").textContent = "Ölçümü tekrarla (12 sn)";
    (window as unknown as { __OLCUM_SONUC: unknown }).__OLCUM_SONUC = sonuc;
    document.documentElement.dataset.olcum = "bitti";
    g.cx = v.W / 2;
    g.cy = v.H / 2;
    g.z = sigdirZ();
  };

  $("olcBtn").onclick = olcumuBaslat;
  $("kopyalaBtn").onclick = () => navigator.clipboard.writeText(JSON.stringify(sonuc, null, 2));

  // --- Döngü
  let oncekiT = 0;
  let sonPanel = 0;
  const kare = (t: number) => {
    requestAnimationFrame(kare);
    const dt = oncekiT ? t - oncekiT : 0;
    oncekiT = t;

    if (olcumSurecek) {
      const gecen = t - olcumBaslangic;
      if (gecen >= OLCUM_SURESI) olcumuBitir();
      else olcumYolu(gecen);
    }
    gorunumuUygula();

    if (fare && fareDegisti && !surukleme && !olcumSurecek) {
      fareDegisti = false;
      const [wx, wy] = ekrandanDunyaya(fare.x, fare.y);
      const h = hucreBul(v, wx, wy, sonBulunan);
      sonBulunan = h;
      if (v.kara[h]) {
        ipucu.textContent = `${v.devletler[v.devletId[h]].ad} · arazi #${h}`;
        ipucu.style.display = "block";
        ipucu.style.left = `${fare.x + 14}px`;
        ipucu.style.top = `${fare.y + 14}px`;
      } else {
        ipucu.style.display = "none";
      }
    }

    const r0 = performance.now();
    renderer.render(sahne, kamera);
    const cpu = performance.now() - r0;

    if (!ilkKareMs) {
      gl.finish();
      ilkKareMs = performance.now() - r0;
      kurulumuGoster();
      $("yukleniyor").remove();
      if (otomatikOlcum) setTimeout(olcumuBaslat, 1000);
      return;
    }

    canli.ekle(dt, cpu);
    if (olcumSurecek && t - olcumBaslangic > ISINMA) {
      olcum.ekle(dt, cpu);
      cizimCagrisiToplam += renderer.info.render.calls;
      cizimKare++;
    }

    if (t - sonPanel > 500) {
      sonPanel = t;
      const o = canli.ozet();
      const heap = heapMb();
      dl($("canli"), [
        ["FPS (ort.)", String(Math.round(o.ortFps))],
        ["Kare süresi p95", `${o.kareMsP95} ms`],
        ["Render CPU (ort.)", `${o.renderCpuMsOrt} ms`],
        ["Çizim çağrısı", String(renderer.info.render.calls)],
        ["Yakınlaştırma", `${(g.z / sigdirZ()).toFixed(1)}×`],
        ["Arazi birimi ekranda", `${Math.round(g.z * v.ortHucreBoyu)} px`],
        ["JS bellek", heap === null ? "—" : `${heap} MB`],
      ]);
    }
  };
  requestAnimationFrame(kare);
}

// Yükleme yazısı görünsün diye üretimi bir kare ertele
requestAnimationFrame(() => setTimeout(baslat, 0));
