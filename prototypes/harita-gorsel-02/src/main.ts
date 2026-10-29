import "@fontsource/cinzel/600.css";
import "@fontsource/cormorant-garamond/700-italic.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/700.css";
import * as THREE from "three";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { haritaYukle, birimBul, type Harita } from "./veri";
import { TEMALAR, type Tema } from "./temalar";
import { katmanlariKur, temaUygula, boyutAyarla, secimiCiz, devletRengi, kagitDokusu, type Katmanlar, type Secim } from "./harita";
import { Etiketler, ESIK } from "./etiketler";
import { KareOlcer, gpuAdi, heapMb } from "./olcum";

const parametreler = new URLSearchParams(location.search);
const otomatikOlcum = parametreler.get("olcum") === "1";
const SURUM = parametreler.get("veri") === "v01" ? "v01" : "v02";
const OLCUM_SURESI = 12000, ISINMA = 500;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const sinirla = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const yumusak = (x: number, a: number, b: number) => sinirla((x - a) / (b - a), 0, 1);
const kacis = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const miller = (lat: number) => 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * lat * Math.PI / 180)) * 180 / Math.PI;

const KONUMLAR: Record<string, [number, number, number]> = { // lon, lat, z (px/derece)
  dunya: [10, 25, 0],
  avrupa: [24, 45, 13],
  konstantiniyye: [28.97, 41.01, 260],
};

function temaKaydet(id: string) {
  try { localStorage.setItem("harita-tema", id); } catch { /* yoksay */ }
}
function temaOku(): string | null {
  try { return localStorage.getItem("harita-tema"); } catch { return null; }
}

async function baslat() {
  const t0 = performance.now();
  await Promise.all([
    document.fonts.load('600 20px "Cinzel"'),
    document.fonts.load('italic 700 20px "Cormorant Garamond"'),
    document.fonts.load('500 20px "Inter"'),
    document.fonts.load('700 20px "Inter"'),
  ]);
  const h: Harita = await haritaYukle(
    `${import.meta.env.BASE_URL}veri/${SURUM === "v02" ? "dunya-1453-v02.json" : "dunya-1453.json"}`);
  // Wikidata (CC0) devlet kayıtları — yalnızca bilgi panelinde gösterilir
  type WdBaskent = { ad: string; durum: "gecerli" | "degil" | "belirsiz" };
  type WdDevlet = { qid?: string; etiket?: string; kurulus?: number; yikilis?: number; baskentler?: WdBaskent[] };
  let wikidata: Record<string, WdDevlet> = {};
  if (SURUM === "v02") {
    try {
      wikidata = (await (await fetch(`${import.meta.env.BASE_URL}veri/wikidata-1453.json`)).json()).devletler;
    } catch { /* bilgi panelinde Wikidata satırı gösterilmez */ }
  }
  const tVeri = performance.now() - t0;

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  const oran = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(oran);
  $("tuvalKap").prepend(renderer.domElement);
  $("kagit").style.backgroundImage = `url(${kagitDokusu()})`;

  const tK0 = performance.now();
  const k: Katmanlar = katmanlariKur(h);
  const tKatman = performance.now() - tK0;
  const sahne = new THREE.Scene();
  sahne.add(k.grup);
  const kamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  const etiketler = new Etiketler($("etiketler"), h);

  let tema: Tema = TEMALAR.find((t) => t.id === (parametreler.get("tema") ?? temaOku())) ?? TEMALAR[0];
  let secim: Secim = null;
  let kirli = true;
  const istek = () => { kirli = true; };

  // --- Görünüm
  let W = window.innerWidth, H = window.innerHeight;
  const { dunya } = h.paket;
  const zMin = () => (W / (dunya.x1 - dunya.x0)) * 0.95;
  const zMaks = 600;
  const g = { cx: 0, cy: 0, z: 0 };
  const git = (ad: string) => {
    const [lon, lat, z] = KONUMLAR[ad];
    g.cx = lon; g.cy = miller(lat); g.z = z || zMin();
    istek();
  };

  const gorunumuUygula = () => {
    g.z = sinirla(g.z, zMin(), zMaks);
    g.cx = sinirla(g.cx, dunya.x0, dunya.x1);
    g.cy = sinirla(g.cy, dunya.y0, dunya.y1);
    kamera.left = -W / (2 * g.z); kamera.right = W / (2 * g.z);
    kamera.top = H / (2 * g.z); kamera.bottom = -H / (2 * g.z);
    kamera.position.set(g.cx, g.cy, 5);
    kamera.updateProjectionMatrix();

    const katman = katmanAyarlari();
    const lm = (l: { material: unknown }) => l.material as LineMaterial;
    const arazi = yumusak(g.z, 9, 20) * (katman.arazi ? 1 : 0);
    lm(k.araziSiniri).opacity = tema.araziSinir.opak * arazi;
    k.araziSiniri.visible = arazi > 0;
    const nb = yumusak(g.z, 3.5, 6) * (katman.nehir ? 1 : 0);
    lm(k.nehirBuyuk).opacity = tema.nehir.opak * nb;
    k.nehirBuyuk.visible = nb > 0;
    const nk = yumusak(g.z, 10, 16) * (katman.nehir ? 1 : 0);
    lm(k.nehirKucuk).opacity = tema.nehir.opak * nk;
    k.nehirKucuk.visible = nk > 0;
    // Kaynak güveni: tahmine dayanan devlet sınırları kesikli (kesik boyu ekranda sabit)
    const tahminMat = lm(k.devletSiniriTahmin);
    tahminMat.dashed = katman.guven;
    tahminMat.dashSize = 7 / g.z;
    tahminMat.gapSize = 5 / g.z;
    k.baskentler.visible = katman.sehir && g.z >= ESIK.baskent;
    k.sehirler.visible = katman.sehir && g.z >= ESIK.sehir;
    etiketler.sehirlerAcik = katman.sehir;
    etiketler.etiketlerAcik = katman.etiket;
  };

  const ekrandanDunyaya = (px: number, py: number): [number, number] =>
    [g.cx + (px - W / 2) / g.z, g.cy - (py - H / 2) / g.z];
  const dunyadanEkrana = (x: number, y: number): [number, number] =>
    [W / 2 + (x - g.cx) * g.z, H / 2 - (y - g.cy) * g.z];

  const yenidenBoyutla = () => {
    W = window.innerWidth; H = window.innerHeight;
    renderer.setSize(W, H);
    boyutAyarla(k, W, H, oran);
    istek();
  };
  window.addEventListener("resize", yenidenBoyutla);

  // --- Panel: tema ve katmanlar
  const katmanAyarlari = () => ({
    arazi: $<HTMLInputElement>("kArazi").checked,
    nehir: $<HTMLInputElement>("kNehir").checked,
    sehir: $<HTMLInputElement>("kSehir").checked,
    etiket: $<HTMLInputElement>("kEtiket").checked,
    guven: $<HTMLInputElement>("kGuven").checked,
  });
  for (const id of ["kArazi", "kNehir", "kSehir", "kEtiket", "kGuven"]) $(id).addEventListener("change", istek);
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-surum]")) {
    b.classList.toggle("etkin", b.dataset.surum === SURUM);
    b.onclick = () => {
      if (b.dataset.surum === "v02") parametreler.delete("veri"); else parametreler.set("veri", "v01");
      location.search = parametreler.toString();
    };
  }
  $("lejantUyari").textContent = h.paket.uyari;

  const temaDugmeleri = $("temalar");
  const temaSec = (t: Tema) => {
    tema = t;
    temaKaydet(t.id);
    temaUygula(k, h, t, sahne);
    secimiCiz(k, h, t, secim);
    etiketler.temaAyarla(t);
    document.body.dataset.arayuz = t.arayuz;
    document.body.dataset.tema = t.id;
    $("kagit").hidden = !t.kagit;
    for (const b of temaDugmeleri.querySelectorAll("button")) b.classList.toggle("etkin", b.dataset.id === t.id);
    bilgiGoster();
    istek();
  };
  for (const t of TEMALAR) {
    const b = document.createElement("button");
    b.dataset.id = t.id;
    b.innerHTML = `<b>${t.ad}</b><span>${t.aciklama}</span>`;
    b.onclick = () => temaSec(t);
    temaDugmeleri.append(b);
  }
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-git]")) b.onclick = () => git(b.dataset.git!);

  // --- Seçim ve bilgi paneli
  const bilgi = $("bilgi");
  const renkKutusu = (d: number) => {
    const c = devletRengi(tema, h.paket.devletler[d].ton, d);
    return `<span class="renk" style="background:#${c.getHexString(THREE.SRGBColorSpace)}"></span>`;
  };
  const kaynakMetni = (k?: string) => !k || k === "tahmin" ? "Tahmin (agent, kaynaksız)"
    : k === "tahmin-elle" ? "Tahmin (elle bölme)"
    : `<a href="https://www.openhistoricalmap.org/relation/${k.slice(4)}" target="_blank" rel="noopener">OpenHistoricalMap #${k.slice(4)}</a> (CC0)`;
  const devletKaynakSatirlari = (d: number) => {
    const dv = h.paket.devletler[d];
    const kay = dv.kaynak
      ? `OHM payı %${Math.round(dv.kaynak.ohmOran * 100)} · güven: <b>${dv.kaynak.guven === "orta" ? "orta" : "düşük"}</b>`
      : "Tahmin (v0.1)";
    const wd = wikidata[dv.id];
    let wdSatir = "";
    if (wd?.qid) {
      const bk = (wd.baskentler ?? []).filter((x) => x.durum !== "degil").map((x) => kacis(x.ad) + (x.durum === "gecerli" ? " ✓" : "")).join(", ");
      wdSatir = `<dt>Wikidata</dt><dd><a href="https://www.wikidata.org/wiki/${wd.qid}" target="_blank" rel="noopener">${wd.qid}</a> · ${wd.kurulus ?? "?"}–${wd.yikilis ?? "?"}</dd>
        <dt>Başkent (Wikidata)</dt><dd>${bk || "—"}</dd>`;
    }
    return `<dt>Sınır kaynağı</dt><dd>${kay}</dd>${wdSatir}`;
  };
  const bilgiGoster = () => {
    if (!secim) { bilgi.hidden = true; return; }
    bilgi.hidden = false;
    const p = h.paket;
    const yol: string[] = [];
    let govde = "";
    const devletYolu = (d: number) => d >= 0
      ? `<button class="yol" data-secim="devlet:${d}">${renkKutusu(d)}${kacis(p.devletler[d].ad)}</button>`
      : `<span class="yol-sabit">Devlet yok</span>`;
    if (secim.tur === "devlet") {
      const d = p.devletler[secim.id];
      yol.push(devletYolu(secim.id));
      const sehirler = h.devletSehirleri[secim.id].map((i) => p.sehirler[i]);
      const baskent = sehirler.find((s) => s.b);
      govde = `<h3>${renkKutusu(secim.id)}${kacis(d.ad)}</h3><dl>
        <dt>Başkent</dt><dd>${baskent ? kacis(baskent.ad) : "—"}</dd>
        <dt>Arazi birimi</dt><dd>${h.devletBirimleri[secim.id].length}</dd>
        ${devletKaynakSatirlari(secim.id)}
        <dt>Şehirler</dt><dd>${sehirler.length ? sehirler.map((s) => `<button class="bag" data-secim="sehir:${p.sehirler.indexOf(s)}">${kacis(s.ad)}</button>`).join(", ") : "—"}</dd>
      </dl><p class="ipucu-metin">Arazi birimini seçmek için devletin içine tekrar tıklayın.</p>`;
    } else if (secim.tur === "birim") {
      const b = p.birimler[secim.id];
      yol.push(devletYolu(b.d), `<span class="yol-sabit">${kacis(b.ad)}</span>`);
      const sehirler = h.birimSehirleri[secim.id];
      govde = `<h3>${kacis(b.ad)}</h3><dl>
        <dt>Devlet</dt><dd>${b.d >= 0 ? kacis(p.devletler[b.d].ad) : "Yerleşik devlet yok"}</dd>
        <dt>Modern idari birim</dt><dd>${kacis(b.ad)} (${kacis(b.ulke)})</dd>
        <dt>Sınır kaynağı</dt><dd>${kaynakMetni(b.k)}</dd>
        <dt>Şehirler</dt><dd>${sehirler.length ? sehirler.map((i) => `<button class="bag" data-secim="sehir:${i}">${kacis(p.sehirler[i].ad)}</button>`).join(", ") : "—"}</dd>
      </dl><p class="ipucu-metin">Arazi birimi şimdilik modern il/eyalet sınırıdır (test verisi).</p>`;
    } else {
      const s = p.sehirler[secim.id];
      const bi = birimBul(h, s.x, s.y);
      yol.push(devletYolu(s.d));
      if (bi >= 0) yol.push(`<button class="yol" data-secim="birim:${bi}">${kacis(p.birimler[bi].ad)}</button>`);
      yol.push(`<span class="yol-sabit">${kacis(s.ad)}</span>`);
      govde = `<h3>${s.b ? "★ " : ""}${kacis(s.ad)}</h3><dl>
        <dt>Devlet</dt><dd>${kacis(p.devletler[s.d].ad)}</dd>
        <dt>Statü</dt><dd>${s.b ? "Başkent" : "Şehir"}</dd>
      </dl>`;
    }
    bilgi.innerHTML = `<nav class="kirinti">${yol.join('<span class="ayrac">›</span>')}</nav>${govde}`;
  };
  bilgi.addEventListener("click", (e) => {
    const hedef = (e.target as HTMLElement).closest<HTMLElement>("[data-secim]");
    if (!hedef) return;
    const [tur, id] = hedef.dataset.secim!.split(":");
    sec({ tur: tur as "devlet" | "birim" | "sehir", id: Number(id) });
  });

  const sec = (s: Secim) => {
    secim = s;
    secimiCiz(k, h, tema, s);
    bilgiGoster();
    istek();
  };

  const sehirBul = (px: number, py: number): number => {
    const katman = katmanAyarlari();
    if (!katman.sehir) return -1;
    let en = -1, enD = 11 * 11;
    h.paket.sehirler.forEach((s, i) => {
      if (g.z < (s.b ? ESIK.baskent : ESIK.sehir)) return;
      const [sx, sy] = dunyadanEkrana(s.x, s.y);
      const d = (sx - px) ** 2 + (sy - py) ** 2;
      if (d < enD) { enD = d; en = i; }
    });
    return en;
  };

  const tikla = (px: number, py: number) => {
    const si = sehirBul(px, py);
    if (si >= 0) return sec({ tur: "sehir", id: si });
    const [x, y] = ekrandanDunyaya(px, py);
    const bi = birimBul(h, x, y);
    if (bi < 0) return sec(null);
    const d = h.paket.birimler[bi].d;
    if (d < 0) return sec({ tur: "birim", id: bi });
    const ayniDevlet = (secim?.tur === "devlet" && secim.id === d)
      || (secim?.tur === "birim" && h.paket.birimler[secim.id].d === d);
    sec(ayniDevlet ? { tur: "birim", id: bi } : { tur: "devlet", id: d });
  };

  const yukari = () => {
    if (!secim) return;
    if (secim.tur === "sehir") {
      const s = h.paket.sehirler[secim.id];
      const bi = birimBul(h, s.x, s.y);
      sec(bi >= 0 ? { tur: "birim", id: bi } : { tur: "devlet", id: s.d });
    } else if (secim.tur === "birim") {
      const d = h.paket.birimler[secim.id].d;
      sec(d >= 0 ? { tur: "devlet", id: d } : null);
    } else sec(null);
  };

  // --- Etkileşim
  const tuval = renderer.domElement;
  const ipucu = $("ipucu");
  let olcumSurecek = false;
  let surukle: { x: number; y: number; hareket: boolean } | null = null;

  const yakinlastir = (carpan: number, px: number, py: number) => {
    const [wx, wy] = ekrandanDunyaya(px, py);
    g.z = sinirla(g.z * carpan, zMin(), zMaks);
    g.cx = wx - (px - W / 2) / g.z;
    g.cy = wy + (py - H / 2) / g.z;
    istek();
  };

  tuval.addEventListener("pointerdown", (e) => {
    if (olcumSurecek) return;
    surukle = { x: e.clientX, y: e.clientY, hareket: false };
    tuval.setPointerCapture(e.pointerId);
  });
  tuval.addEventListener("pointermove", (e) => {
    if (olcumSurecek) return;
    if (surukle) {
      const dx = e.clientX - surukle.x, dy = e.clientY - surukle.y;
      if (surukle.hareket || Math.abs(dx) + Math.abs(dy) > 3) {
        g.cx -= dx / g.z; g.cy += dy / g.z;
        surukle.x = e.clientX; surukle.y = e.clientY; surukle.hareket = true;
        ipucu.hidden = true;
        istek();
      }
      return;
    }
    const si = sehirBul(e.clientX, e.clientY);
    let metin = "";
    if (si >= 0) {
      const s = h.paket.sehirler[si];
      metin = `${s.ad} · ${h.paket.devletler[s.d].ad}`;
    } else {
      const [x, y] = ekrandanDunyaya(e.clientX, e.clientY);
      const bi = birimBul(h, x, y);
      if (bi >= 0) {
        const b = h.paket.birimler[bi];
        metin = `${b.d >= 0 ? h.paket.devletler[b.d].ad : "Devlet yok"} — ${b.ad}`;
      }
    }
    ipucu.hidden = !metin;
    ipucu.textContent = metin;
    ipucu.style.transform = `translate(${e.clientX + 14}px,${e.clientY + 14}px)`;
    tuval.style.cursor = si >= 0 ? "pointer" : "";
  });
  tuval.addEventListener("pointerup", (e) => {
    if (surukle && !surukle.hareket) tikla(e.clientX, e.clientY);
    surukle = null;
  });
  tuval.addEventListener("pointerleave", () => { ipucu.hidden = true; });
  tuval.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (!olcumSurecek) yakinlastir(Math.exp(-e.deltaY * 0.0018), e.clientX, e.clientY);
  }, { passive: false });
  window.addEventListener("keydown", (e) => {
    if (olcumSurecek || (e.target as HTMLElement).tagName === "INPUT") return;
    const adim = 140 / g.z;
    if (e.key === "ArrowLeft") g.cx -= adim;
    else if (e.key === "ArrowRight") g.cx += adim;
    else if (e.key === "ArrowUp") g.cy += adim;
    else if (e.key === "ArrowDown") g.cy -= adim;
    else if (e.key === "+" || e.key === "=") return yakinlastir(1.3, W / 2, H / 2);
    else if (e.key === "-") return yakinlastir(1 / 1.3, W / 2, H / 2);
    else if (e.key === "Escape") return yukari();
    else return;
    e.preventDefault();
    istek();
  });

  // --- Ölçüm
  const gpu = gpuAdi(renderer.getContext());
  const olcum = new KareOlcer(4000);
  const etiketSureleri: number[] = [];
  let olcumBas = 0;
  let ilkKareMs = 0;
  let sonuc: Record<string, unknown> | null = null;

  const olcumYolu = (t: number) => {
    const [lonK, latK] = KONUMLAR.konstantiniyye;
    if (t < 4000) {
      const u = t / 4000;
      g.z = zMin() * 1.4; g.cx = -60 + 180 * u; g.cy = miller(30);
    } else if (t < 8000) {
      const u = (t - 4000) / 4000;
      const z0 = zMin() * 1.4, z1 = 260;
      g.z = z0 * Math.pow(z1 / z0, u);
      g.cx = 120 + (lonK - 120) * Math.min(1, u * 1.6);
      g.cy = miller(30) + (miller(latK) - miller(30)) * Math.min(1, u * 1.6);
    } else {
      const u = (t - 8000) / 4000;
      g.z = 260 * Math.pow(16 / 260, u);
      g.cx = lonK + (12 - lonK) * u; g.cy = miller(latK + (46 - latK) * u);
    }
  };

  const olcumuBaslat = () => {
    sec(null);
    olcum.sifirla();
    etiketSureleri.length = 0;
    olcumBas = performance.now();
    olcumSurecek = true;
    ipucu.hidden = true;
    $<HTMLButtonElement>("olcBtn").disabled = true;
    $("olcBtn").textContent = "Ölçülüyor…";
  };
  const olcumuBitir = () => {
    olcumSurecek = false;
    const s = [...etiketSureleri].sort((a, b) => a - b);
    const ort = s.reduce((a, b) => a + b, 0) / Math.max(1, s.length);
    sonuc = {
      gorev: "TASK-0002",
      tarih: new Date().toISOString(),
      tema: tema.id,
      birim: h.paket.birimler.length,
      yay: h.arklar.length,
      ucgen: k.ucgenSayisi,
      kurulumMs: { veriVeFont: Math.round(tVeri), katmanlar: Math.round(tKatman), ilkKare: Math.round(ilkKareMs) },
      kare: olcum.ozet(),
      etiketMs: { ort: +ort.toFixed(2), p95: +(s[Math.floor(s.length * 0.95)] ?? 0).toFixed(2) },
      cizimCagrisi: renderer.info.render.calls,
      heapMb: heapMb(),
      tuval: `${W}x${H} @${oran}x`,
      gpu,
      tarayici: navigator.userAgent,
    };
    $("sonucJson").textContent = JSON.stringify(sonuc, null, 2);
    $("sonuc").hidden = false;
    $<HTMLButtonElement>("olcBtn").disabled = false;
    $("olcBtn").textContent = "Ölçümü tekrarla";
    (window as unknown as { __OLCUM_SONUC: unknown }).__OLCUM_SONUC = sonuc;
    document.documentElement.dataset.olcum = "bitti";
    git("avrupa");
  };
  $("olcBtn").onclick = olcumuBaslat;
  $("kopyalaBtn").onclick = () => navigator.clipboard.writeText(JSON.stringify(sonuc, null, 2));

  // --- Başlangıç
  yenidenBoyutla();
  temaSec(tema);
  git("avrupa");

  let onceki = 0;
  const kare = (t: number) => {
    requestAnimationFrame(kare);
    const dt = onceki ? t - onceki : 0;
    onceki = t;
    if (olcumSurecek) {
      const gecen = t - olcumBas;
      if (gecen >= OLCUM_SURESI) olcumuBitir();
      else { olcumYolu(gecen); kirli = true; }
    }
    if (!kirli) return;
    kirli = false;
    gorunumuUygula();
    const r0 = performance.now();
    renderer.render(sahne, kamera);
    const cpu = performance.now() - r0;
    const e0 = performance.now();
    etiketler.guncelle({ cx: g.cx, cy: g.cy, z: g.z, w: W, h: H });
    const etiketMs = performance.now() - e0;
    $("olcek").textContent = `${g.z.toFixed(1)} px/°`;
    if (!ilkKareMs) {
      renderer.getContext().finish();
      ilkKareMs = performance.now() - r0;
      $("yukleniyor").remove();
      if (otomatikOlcum) setTimeout(olcumuBaslat, 800);
      return;
    }
    if (olcumSurecek && t - olcumBas > ISINMA) {
      olcum.ekle(dt, cpu);
      etiketSureleri.push(etiketMs);
    }
  };
  requestAnimationFrame(kare);
}

baslat().catch((e) => {
  $("yukleniyor").textContent = `Yükleme hatası: ${e}`;
  throw e;
});
