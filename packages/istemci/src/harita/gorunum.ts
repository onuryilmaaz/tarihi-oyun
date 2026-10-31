// Harita görünümü: three.js sahnesi, kamera, etiketler, seçim hiyerarşisi ve bilgi paneli.
// harita-gorsel-02 prototipinden (TASK-0002/0004) temizlenerek taşındı; görsel yön Tarihî atlas (DEC-0018).

import * as THREE from "three";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { tarihMetni, type YabanciOrdu } from "@tarihi/sim";
import type { OrduOzeti } from "../sim-protokol";
import { birimBul, denizBul, type Harita } from "./veri";
import { TEMALAR } from "./temalar";
import { katmanlariKur, temaUygula, boyutAyarla, secimiCiz, devletRengi, kagitDokusu, isgalKatmani, mulkiyetKatmanlariniGuncelle, type Secim } from "./harita";
import { Etiketler, ESIK } from "./etiketler";

const sinirla = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const yumusak = (x: number, a: number, b: number) => sinirla((x - a) / (b - a), 0, 1);
export const kacis = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const miller = (lat: number) => 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * lat * Math.PI / 180)) * 180 / Math.PI;

export const KONUMLAR: Record<string, [number, number, number]> = { // boylam, enlem, ölçek (px/derece)
  dunya: [10, 25, 0],
  avrupa: [24, 45, 13],
  konstantiniyye: [28.97, 41.01, 260],
};

export interface Katmanlar { arazi: boolean; nehir: boolean; sehir: boolean; etiket: boolean; guven: boolean }

export interface HaritaGorunumu {
  git(ad: keyof typeof KONUMLAR): void;
  istek(): void;
  devletRenkKutusu(d: number): string;
  /** Devletin harita rengi (#rrggbb) */
  devletRengiHex(d: number): string;
  oyuncuyuAyarla(devletIndeksi: number): void;
  /** Diplomasi harita modu (MASTER_SPEC §7.3): devlet başına renk (#rrggbb); null = siyasi harita */
  haritaRenkleri(renkler: string[] | null): void;
  /** Din/kültür modu: arazi birimi başına renk; null = kapalı */
  birimRenkleri(renkler: string[] | null): void;
  /** Ordu işaretleri ve rotaları; planli: emri verilmiş ama yürüyüşe başlamamış rotalar (kesikli) */
  ordulariGoster(ordular: OrduOzeti[], yabanci: YabanciOrdu[], secili: number | null, planli: Map<number, [number, number][]>): void;
  /** [birim, kontrol eden, gün], [şehir, kontrol eden, gün] */
  isgalGoster(birimler: [number, number, number][], sehirler: [number, number, number][]): void;
  mulkiyetGoster(birimler: number[], sehirler: { devlet: number; baskent: boolean; ad: string; bagli: number; birim: number }[]): void;
  orduyaOdaklan(o: OrduOzeti): void;
  /** Donanma ve deniz bölgesi işaretleri (8a): x,y Miller × 10⁴; tıklanınca olaylar.donanmaSec */
  donanmalariGoster(liste: { anahtar: string; x: number; y: number; html: string; sinif: string; donanma: number | null }[]): void;
  seciliOge(): Secim;
  /** Dışarıdan seçim (ör. listeden bir şehre gitmek); şehirde haritayı oraya kaydırır */
  secVeGit(s: Secim): void;
  olaylar: {
    orduSec?: (id: number) => void;
    donanmaSec?: (id: number) => void;
    hedef?: (x: number, y: number, birim: number) => void; // Miller derece
    /** Bilgi panelinin altına eklenecek HTML (ör. savaş ilanı düğmesi) */
    ekBilgi?: (s: NonNullable<Secim>) => string;
  };
}

export function haritaGorunumuKur(h: Harita,
  ogeler: { kap: HTMLElement; etiketKap: HTMLElement; orduKap: HTMLElement; kagit: HTMLElement; bilgi: HTMLElement; ipucu: HTMLElement },
  katmanAyarlari: () => Katmanlar): HaritaGorunumu {
  const tema = TEMALAR[0];
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  const oran = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(oran);
  ogeler.kap.prepend(renderer.domElement);
  ogeler.kagit.style.backgroundImage = `url(${kagitDokusu()})`;
  ogeler.kagit.hidden = !tema.kagit;
  document.body.dataset.tema = tema.id;

  const k = katmanlariKur(h);
  const sahne = new THREE.Scene();
  sahne.add(k.grup);
  const kamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  const etiketler = new Etiketler(ogeler.etiketKap, h);
  temaUygula(k, h, tema, sahne);
  etiketler.temaAyarla(tema);

  let secim: Secim = null;
  let oyuncu = -1;
  const ilkEtiketler = h.paket.devletler.map((d) => d.etiket ? [...d.etiket] as [number, number, number] : null);
  // Sınırlar değişince devlet adı etiketi için: birim alanı/ağırlık merkezi ve birim komşulukları (bir kez hesaplanır)
  const birimGeo = h.halkalar.map((polys) => {
    let alan = 0, mx = 0, my = 0;
    for (const hs of polys) {
      const r = hs[0];
      let a = 0, x = 0, y = 0;
      for (let i = 0, n = r.length; i < n; i += 2) {
        const j = (i + 2) % n, c = r[i] * r[j + 1] - r[j] * r[i + 1];
        a += c; x += (r[i] + r[j]) * c; y += (r[i + 1] + r[j + 1]) * c;
      }
      a /= 2;
      if (Math.abs(a) < 1e-9) continue;
      alan += Math.abs(a); mx += (x / (6 * a)) * Math.abs(a); my += (y / (6 * a)) * Math.abs(a);
    }
    return alan > 0 ? { alan, x: mx / alan, y: my / alan } : null;
  });
  const birimKomsu: number[][] = h.paket.birimler.map(() => []);
  for (let a = 0; a < h.arklar.length; a++) {
    const x = h.yaySahipA[a], y = h.yaySahipB[a];
    if (x >= 0 && y >= 0 && x !== y) { birimKomsu[x].push(y); birimKomsu[y].push(x); }
  }
  /** Devletin en büyük bitişik toprak parçasının ortası ve o parçaya uygun yazı boyutu. */
  const etiketHesapla = (devlet: number, ilk: [number, number, number] | null): [number, number, number] | null => {
    const kendi = new Set(h.devletBirimleri[devlet]);
    if (!kendi.size) return null;
    const gorulen = new Set<number>();
    let enIyi: number[] = [], enAlan = -1;
    for (const bas of kendi) {
      if (gorulen.has(bas)) continue;
      const parca: number[] = [], kuyruk = [bas];
      gorulen.add(bas);
      while (kuyruk.length) {
        const b = kuyruk.pop()!;
        parca.push(b);
        for (const k of birimKomsu[b]) if (kendi.has(k) && !gorulen.has(k)) { gorulen.add(k); kuyruk.push(k); }
      }
      const alan = parca.reduce((t, b) => t + (birimGeo[b]?.alan ?? 0), 0);
      if (alan > enAlan) { enAlan = alan; enIyi = parca; }
    }
    const parca = new Set(enIyi);
    // İlk (veriden gelen) konum hâlâ en büyük parçanın içindeyse korunur
    if (ilk) { const bi = birimBul(h, ilk[0], ilk[1]); if (bi >= 0 && parca.has(bi)) return [...ilk]; }
    let x = 0, y = 0;
    for (const b of enIyi) { const g = birimGeo[b]; if (g) { x += g.x * g.alan; y += g.y * g.alan; } }
    x /= Math.max(enAlan, 1e-9); y /= Math.max(enAlan, 1e-9);
    const icinde = birimBul(h, x, y);
    if (!(icinde >= 0 && parca.has(icinde))) { // ağırlık merkezi parçanın dışındaysa en yakın birimin ortasına
      let en = enIyi[0], enU = Infinity;
      for (const b of enIyi) { const g = birimGeo[b]; if (!g) continue; const u = (g.x - x) ** 2 + (g.y - y) ** 2; if (u < enU) { enU = u; en = b; } }
      const g = birimGeo[en];
      if (g) { x = g.x; y = g.y; }
    }
    const yaricap = Math.sqrt(enAlan / Math.PI) * 0.55;
    return [x, y, Math.max(0.25, Math.min(ilk?.[2] ?? yaricap, yaricap))];
  };
  const olaylar: HaritaGorunumu["olaylar"] = {};

  // --- Ordu ve işgal katmanları (TASK-0006)
  const rotaCizgisi = (renk: string, kalinlik: number, kesikli: boolean) => {
    const m = new LineMaterial({ color: renk, linewidth: kalinlik, transparent: true, depthTest: false, dashed: kesikli });
    const l = new LineSegments2(new LineSegmentsGeometry().setPositions([0, 0, 0, 0, 0, 0]), m);
    l.renderOrder = 11;
    l.frustumCulled = false;
    l.visible = false;
    sahne.add(l);
    return l;
  };
  const rotaYuruyen = rotaCizgisi("#7a1f1a", 2.6, false);
  const rotaPlanli = rotaCizgisi("#7a1f1a", 2.4, true);
  let isgalMesh: THREE.Mesh | null = null;
  const birimIsgal = new Map<number, [number, number]>(); // birim → [devlet, gün]
  const sehirIsgal = new Map<number, [number, number]>();
  let orduListesi: { id: number; x: number; y: number }[] = [];
  let seciliOrdu: number | null = null;
  const orduOgeleri = new Map<number, HTMLDivElement>();
  let denizListesi: { anahtar: string; x: number; y: number; donanma: number | null }[] = [];
  const denizOgeleri = new Map<string, HTMLDivElement>();
  let kirli = true;
  const istek = () => { kirli = true; };

  // --- Görünüm
  let W = window.innerWidth, H = window.innerHeight;
  const { dunya } = h.paket;
  const zMin = () => (W / (dunya.x1 - dunya.x0)) * 0.95;
  const zMaks = 600;
  const g = { cx: 0, cy: 0, z: 1 };
  const git = (ad: keyof typeof KONUMLAR) => {
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
    const tahminMat = lm(k.devletSiniriTahmin);
    tahminMat.dashed = katman.guven;
    tahminMat.dashSize = 7 / g.z;
    tahminMat.gapSize = 5 / g.z;
    for (const l of [rotaYuruyen, rotaPlanli]) {
      const m = l.material as LineMaterial;
      m.resolution.set(W * oran, H * oran);
      m.dashSize = 9 / g.z;
      m.gapSize = 6 / g.z;
    }
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

  // --- Bilgi paneli
  const devletRenkKutusu = (d: number) => {
    const c = devletRengi(tema, h.paket.devletler[d].ton, d);
    return `<span class="renk" style="background:#${c.getHexString(THREE.SRGBColorSpace)}"></span>`;
  };
  const kontrolSatiri = (isgal?: [number, number]) => isgal
    ? `<dt>Askerî kontrol</dt><dd class="isgal">${devletRenkKutusu(isgal[0])}${kacis(h.paket.devletler[isgal[0]].ad)} · işgal ${kacis(tarihMetni(isgal[1]))}</dd>`
    : "";
  const bilgiGoster = () => {
    const bilgi = ogeler.bilgi;
    if (!secim) { bilgi.hidden = true; return; }
    bilgi.hidden = false;
    const p = h.paket;
    const yol: string[] = [];
    let govde = "";
    const devletYolu = (d: number) => d >= 0
      ? `<button class="yol" data-secim="devlet:${d}">${devletRenkKutusu(d)}${kacis(p.devletler[d].ad)}</button>`
      : `<span class="yol-sabit">Devlet yok</span>`;
    if (secim.tur === "devlet") {
      const d = p.devletler[secim.id];
      yol.push(devletYolu(secim.id));
      const sehirler = h.devletSehirleri[secim.id].map((i) => ({ i, s: p.sehirler[i] }))
        .sort((a, b) => b.s.b - a.s.b || a.s.ad.localeCompare(b.s.ad, "tr"));
      const baskent = sehirler.find((x) => x.s.b);
      govde = `<h3>${devletRenkKutusu(secim.id)}${kacis(d.ad)}${secim.id === oyuncu ? ' <span class="rozet">Siz</span>' : ""}</h3><dl>
        <dt>Başkent</dt><dd>${baskent ? `<button class="bag" data-secim="sehir:${baskent.i}">${kacis(baskent.s.ad)}</button>` : "—"}</dd>
        <dt>Şehir</dt><dd>${sehirler.length}</dd>
      </dl>${sehirler.length > 1 ? `<details class="sehir-listesi"><summary>Şehirler (${sehirler.length})</summary>
        <div class="sehir-izgara">${sehirler.map((x) => `<button class="bag" data-secim="sehir:${x.i}">${kacis(x.s.ad)}</button>`).join("")}</div></details>` : ""}`;
    } else if (secim.tur === "birim") {
      // Toprak: birleşmiş şehirlerin toprakları tek bölge; bölgenin (gizli olmayan) şehri başlıkta
      const b = p.birimler[secim.id], grup = h.birimGrubu[secim.id];
      const sehirler = p.birimler.flatMap((_, i) => (h.birimGrubu[i] === grup ? h.birimSehirleri[i] : [])).filter((i) => !p.sehirler[i].gizli);
      const baslik = sehirler.length ? `${p.sehirler[sehirler[0]].ad} toprağı` : b.ad;
      yol.push(devletYolu(b.d), `<span class="yol-sabit">${kacis(baslik)}</span>`);
      govde = `<h3>${kacis(baslik)}</h3><dl>
        <dt>Devlet</dt><dd>${b.d >= 0 ? kacis(p.devletler[b.d].ad) : "Yerleşik devlet yok"}</dd>
        ${sehirler.length ? `<dt>Şehir</dt><dd>${sehirler.map((i) => `<button class="bag" data-secim="sehir:${i}">${kacis(p.sehirler[i].ad)}</button>`).join(", ")}</dd>` : ""}
        ${kontrolSatiri(birimIsgal.get(secim.id))}
      </dl>`;
    } else if (secim.tur === "deniz") {
      const z = p.denizAlanlari![secim.id];
      yol.push(`<span class="yol-sabit">Denizler</span>`, `<span class="yol-sabit">${kacis(z.ad)}</span>`);
      govde = `<h3>⚓ ${kacis(z.ad)}</h3>`; // kontrol, donanmalar ve limanlar sim özetinden (olaylar.ekBilgi)
    } else {
      const s = p.sehirler[secim.id];
      const bi = birimBul(h, s.x, s.y);
      yol.push(devletYolu(s.d));
      if (bi >= 0) yol.push(`<button class="yol" data-secim="birim:${bi}">${kacis(p.birimler[bi].ad)}</button>`);
      yol.push(`<span class="yol-sabit">${kacis(s.ad)}</span>`);
      govde = `<h3>${s.b ? "★ " : ""}${kacis(s.ad)}</h3><dl>
        <dt>Devlet</dt><dd>${kacis(p.devletler[s.d].ad)}</dd>
        ${bi >= 0 && p.birimler[bi].d !== s.d ? `<dt>Çevre arazi</dt><dd>${p.birimler[bi].d >= 0 ? kacis(p.devletler[p.birimler[bi].d].ad) : "Devletsiz"} · şehir ayrı mülkiyettedir</dd>` : ""}
        <dt>Statü</dt><dd>${s.b ? "Başkent" : "Şehir"}</dd>
        ${kontrolSatiri(sehirIsgal.get(secim.id))}
      </dl>`;
    }
    bilgi.innerHTML = `<nav class="kirinti">${yol.join('<span class="ayrac">›</span>')}</nav>${govde}${olaylar.ekBilgi?.(secim) ?? ""}`;
  };
  ogeler.bilgi.addEventListener("click", (e) => {
    const hedef = (e.target as HTMLElement).closest<HTMLElement>("[data-secim]");
    if (!hedef) return;
    const [tur, id] = hedef.dataset.secim!.split(":");
    sec({ tur: tur as "devlet" | "birim" | "sehir" | "deniz", id: Number(id) });
  });

  const sec = (s: Secim) => {
    secim = s;
    secimiCiz(k, h, tema, s);
    bilgiGoster();
    istek();
  };

  const sehirBul = (px: number, py: number): number => {
    if (!katmanAyarlari().sehir) return -1;
    let en = -1, enD = 11 * 11;
    h.paket.sehirler.forEach((s, i) => {
      if (s.gizli || g.z < (s.b ? ESIK.baskent : ESIK.sehir)) return;
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
    if (bi < 0) { const z = denizBul(h, x, y); return sec(z >= 0 ? { tur: "deniz", id: z } : null); }
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
  const ipucu = ogeler.ipucu;
  let surukle: { x: number; y: number; hareket: boolean } | null = null;

  const yakinlastir = (carpan: number, px: number, py: number) => {
    const [wx, wy] = ekrandanDunyaya(px, py);
    g.z = sinirla(g.z * carpan, zMin(), zMaks);
    g.cx = wx - (px - W / 2) / g.z;
    g.cy = wy + (py - H / 2) / g.z;
    istek();
  };

  tuval.addEventListener("pointerdown", (e) => {
    surukle = { x: e.clientX, y: e.clientY, hareket: false };
    tuval.setPointerCapture(e.pointerId);
  });
  tuval.addEventListener("pointermove", (e) => {
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
      } else {
        const z = denizBul(h, x, y);
        if (z >= 0) metin = h.paket.denizAlanlari![z].ad;
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
  // Seçili orduya hedef: sağ tık (MASTER_SPEC §8.3 serbest hedef)
  tuval.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (seciliOrdu === null || !olaylar.hedef) return;
    const [x, y] = ekrandanDunyaya(e.clientX, e.clientY);
    olaylar.hedef(x, y, birimBul(h, x, y));
  });
  tuval.addEventListener("wheel", (e) => {
    e.preventDefault();
    yakinlastir(Math.exp(-e.deltaY * 0.0018), e.clientX, e.clientY);
  }, { passive: false });
  window.addEventListener("keydown", (e) => {
    const etiket = (e.target as HTMLElement).tagName;
    if (etiket === "INPUT" || etiket === "SELECT" || etiket === "TEXTAREA") return;
    // Odak bir panelde/sekmede/menüdeyse ya da tuşu başka bir öğe kullandıysa harita kaymaz (9e)
    if (e.defaultPrevented || (e.target as HTMLElement).closest?.(".panel, [role=tablist], #menuKatmani, .secim-liste, #rehber")) {
      if (e.key !== "Escape") return;
    }
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

  // --- Çizim döngüsü: yalnızca değişiklik olduğunda (ADR-0001 önerisi 2)
  yenidenBoyutla();
  git("avrupa");
  const kare = () => {
    requestAnimationFrame(kare);
    if (!kirli) return;
    kirli = false;
    gorunumuUygula();
    renderer.render(sahne, kamera);
    etiketler.guncelle({ cx: g.cx, cy: g.cy, z: g.z, w: W, h: H });
    // Ordu işaretleri; aynı yerdeki ordular üst üste binmesin diye alt alta dizilir
    const yerlesen: [number, number][] = [];
    for (const o of orduListesi) {
      const el = orduOgeleri.get(o.id);
      if (!el) continue;
      const [sx, x0] = dunyadanEkrana(o.x / 10000, o.y / 10000);
      let sy = x0;
      while (yerlesen.some(([ax, ay]) => Math.abs(ax - sx) < 46 && Math.abs(ay - sy) < 20)) sy += 21;
      yerlesen.push([sx, sy]);
      el.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px)`;
    }
    for (const o of denizListesi) {
      const el = denizOgeleri.get(o.anahtar);
      if (!el) continue;
      const [sx, x0] = dunyadanEkrana(o.x / 10000, o.y / 10000);
      let sy = x0;
      while (yerlesen.some(([ax, ay]) => Math.abs(ax - sx) < 46 && Math.abs(ay - sy) < 20)) sy += 21;
      yerlesen.push([sx, sy]);
      el.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px)`;
    }
  };
  requestAnimationFrame(kare);

  const rotaParcalari = (bas: [number, number], noktalar: [number, number][]) => {
    const p: number[] = [];
    let [px, py] = bas;
    for (const [x, y] of noktalar) { p.push(px / 1e4, py / 1e4, 0, x / 1e4, y / 1e4, 0); px = x; py = y; }
    return p;
  };
  const cizgiAyarla = (l: LineSegments2, p: number[]) => {
    l.geometry.dispose();
    l.geometry = new LineSegmentsGeometry().setPositions(p.length ? p : [0, 0, 0, 0, 0, 0]);
    l.computeLineDistances();
    l.visible = p.length > 0;
  };

  return {
    git,
    istek,
    devletRenkKutusu,
    devletRengiHex: (d: number) => `#${devletRengi(tema, h.paket.devletler[d].ton, d).getHexString(THREE.SRGBColorSpace)}`,
    mulkiyetGoster(birimler, sehirler) {
      let degisti = false;
      birimler.forEach((d, i) => { if (h.paket.birimler[i].d !== d) { h.paket.birimler[i].d = d; degisti = true; } });
      sehirler.forEach((s, i) => {
        const c = h.paket.sehirler[i], gizli = s.bagli >= 0;
        if (c.d !== s.devlet || !!c.b !== s.baskent || c.ad !== s.ad || !!c.gizli !== gizli) {
          c.d = s.devlet; c.b = Number(s.baskent); c.ad = s.ad; c.gizli = gizli; degisti = true;
        }
      });
      // Birleşen şehirlerin toprakları: bağlı şehrin birimi merkezin birimine katılır
      sehirler.forEach((s) => {
        if (s.birim < 0) return;
        const g = s.bagli >= 0 ? sehirler[s.bagli].birim : s.birim;
        if (g >= 0 && h.birimGrubu[s.birim] !== g) { h.birimGrubu[s.birim] = g; degisti = true; }
      });
      if (!degisti) return;
      h.devletBirimleri = h.paket.devletler.map(() => []);
      h.devletSehirleri = h.paket.devletler.map(() => []);
      h.paket.birimler.forEach((b, i) => { if (b.d >= 0) h.devletBirimleri[b.d].push(i); });
      h.paket.sehirler.forEach((s, i) => { if (!s.gizli) h.devletSehirleri[s.d].push(i); });
      // Etiket: devletin elinde kalan en büyük bitişik toprak parçasında (başkent başka devletin toprağında kalsa bile)
      h.paket.devletler.forEach((d, i) => { d.etiket = etiketHesapla(i, ilkEtiketler[i]); });
      mulkiyetKatmanlariniGuncelle(k, h, tema, sahne);
      boyutAyarla(k, W, H, oran);
      secimiCiz(k, h, tema, secim);
      etiketler.yenile(h);
      bilgiGoster(); istek();
    },
    oyuncuyuAyarla(d) { oyuncu = d; bilgiGoster(); },
    birimRenkleri(renkler) {
      const yeni = renkler?.map((r) => new THREE.Color(r)) ?? null;
      if (!yeni && !k.ozelBirimRenk) return;
      if (yeni && k.ozelBirimRenk && yeni.every((c, i) => c.equals(k.ozelBirimRenk![i]))) return;
      k.ozelBirimRenk = yeni;
      temaUygula(k, h, tema, sahne);
      secimiCiz(k, h, tema, secim);
      istek();
    },
    haritaRenkleri(renkler) {
      const yeni = renkler?.map((r) => new THREE.Color(r)) ?? null;
      if (!yeni && !k.ozelRenk) return;
      if (yeni && k.ozelRenk && yeni.every((c, i) => c.equals(k.ozelRenk![i]))) return;
      k.ozelRenk = yeni;
      temaUygula(k, h, tema, sahne);
      secimiCiz(k, h, tema, secim);
      istek();
    },
    olaylar,
    seciliOge: () => secim,
    secVeGit(s) {
      sec(s);
      // Şehirde oraya, devlette başkentine (yoksa ilk şehrine) kaydır
      const denizMerkezi = (z: number) => { // bölgenin en büyük poligonunun dış halka köşe ortalaması
        const d = h.denizHalkalari[z].map((hs) => hs[0]).reduce((a, b) => (b.length > a.length ? b : a));
        let x = 0, y = 0;
        for (let i = 0; i < d.length; i += 2) { x += d[i]; y += d[i + 1]; }
        return { x: (2 * x) / d.length, y: (2 * y) / d.length };
      };
      const c = s?.tur === "sehir" ? h.paket.sehirler[s.id]
        : s?.tur === "devlet" ? h.paket.sehirler.find((x) => x.d === s.id && x.b) ?? h.paket.sehirler.find((x) => x.d === s.id)
        : s?.tur === "deniz" ? denizMerkezi(s.id) : undefined;
      if (c) {
        g.cx = c.x; g.cy = c.y; g.z = Math.max(g.z, s?.tur === "sehir" ? 40 : 20);
        istek();
      }
    },
    orduyaOdaklan(o) {
      g.cx = o.x / 1e4; g.cy = o.y / 1e4; g.z = Math.max(g.z, 40);
      istek();
    },
    donanmalariGoster(liste) {
      denizListesi = liste;
      for (const [k, el] of denizOgeleri) if (!liste.some((x) => x.anahtar === k)) { el.remove(); denizOgeleri.delete(k); }
      for (const x of liste) {
        let el = denizOgeleri.get(x.anahtar);
        if (!el) {
          el = document.createElement("div");
          el.addEventListener("pointerdown", (e) => e.stopPropagation());
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            const g = denizListesi.find((y) => y.anahtar === x.anahtar);
            if (g?.donanma != null) olaylar.donanmaSec?.(g.donanma);
          });
          ogeler.orduKap.append(el);
          denizOgeleri.set(x.anahtar, el);
        }
        el.className = x.sinif;
        if (el.innerHTML !== x.html) el.innerHTML = x.html;
      }
      istek();
    },
    ordulariGoster(ordular, yabanci, secili, planli) {
      orduListesi = [...ordular, ...yabanci];
      seciliOrdu = secili;
      for (const [id, el] of orduOgeleri) if (!orduListesi.some((o) => o.id === id)) { el.remove(); orduOgeleri.delete(id); }
      // Görülen yabancı ordular: yaklaşık büyüklük, seçilemez (bilgi asimetrisi, DEC-0027/2)
      for (const o of yabanci) {
        let el = orduOgeleri.get(o.id);
        if (!el) {
          el = document.createElement("div");
          el.className = "ordu yabanci";
          el.addEventListener("pointerdown", (e) => e.stopPropagation());
          // Yabancı ordunun işaretine tıklamak devletini seçer (bilgi paneli, savaş ilanı)
          el.addEventListener("click", (e) => { e.stopPropagation(); sec({ tur: "devlet", id: o.devlet }); });
          el.addEventListener("contextmenu", (e) => {
            e.preventDefault(); e.stopPropagation();
            if (seciliOrdu === null || !olaylar.hedef) return;
            const guncel = orduListesi.find((a) => a.id === o.id);
            if (!guncel) return;
            const x = guncel.x / 1e4, y = guncel.y / 1e4;
            olaylar.hedef(x, y, birimBul(h, x, y));
          });
          ogeler.orduKap.append(el);
          orduOgeleri.set(o.id, el);
        }
        el.innerHTML = `${devletRenkKutusu(o.devlet)}<b>${o.kesin ? `${o.yaklasikAsker.toLocaleString("tr-TR")} 👁` : `~${Math.round(o.yaklasikAsker / 1000)}B`}</b>`;
        el.title = o.kesin ? `${o.ad} · ${o.yaklasikAsker.toLocaleString("tr-TR")} asker (askerî istihbarat)` : `${o.ad} · yaklaşık ${o.yaklasikAsker.toLocaleString("tr-TR")} asker (kesin sayı bilinmiyor)`;
        el.classList.toggle("muharebede", o.muharebede);
      }
      for (const o of ordular) {
        let el = orduOgeleri.get(o.id);
        if (!el) {
          el = document.createElement("div");
          el.className = "ordu";
          el.addEventListener("pointerdown", (e) => e.stopPropagation());
          el.addEventListener("click", (e) => { e.stopPropagation(); olaylar.orduSec?.(o.id); });
          // İşaretin üstüne sağ tık da haritadaki o noktaya hedef vermektir (ör. başka bir ordunun yanına)
          el.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (seciliOrdu === null || !olaylar.hedef) return;
            const guncel = orduListesi.find((a) => a.id === o.id);
            if (!guncel) return;
            const x = guncel.x / 1e4, y = guncel.y / 1e4;
            olaylar.hedef(x, y, birimBul(h, x, y));
          });
          ogeler.orduKap.append(el);
          orduOgeleri.set(o.id, el);
        }
        const asker = o.asker >= 1000 ? `${Math.round(o.asker / 1000)}B` : String(o.asker);
        el.innerHTML = `${devletRenkKutusu(o.devlet)}<b>${asker}</b><i class="moral" style="--moral:${o.moral / 10}%"></i>`;
        el.title = `${o.ad} · ${o.asker.toLocaleString("tr-TR")} asker · moral %${Math.round(o.moral / 10)}`;
        el.classList.toggle("secili", o.id === secili);
        el.classList.toggle("yuruyor", o.yuruyor && !o.muharebede);
        el.classList.toggle("muharebede", o.muharebede);
      }
      const yuruyen: number[] = [], plan: number[] = [];
      for (const o of ordular) {
        if (o.yuruyor) yuruyen.push(...rotaParcalari([o.x, o.y], o.rota));
        const p = planli.get(o.id);
        if (p) plan.push(...rotaParcalari([o.x, o.y], p));
      }
      cizgiAyarla(rotaYuruyen, yuruyen);
      cizgiAyarla(rotaPlanli, plan);
      istek();
    },
    isgalGoster(birimler, sehirler) {
      birimIsgal.clear(); sehirIsgal.clear();
      for (const [b, d, gun] of birimler) birimIsgal.set(b, [d, gun]);
      for (const [s, d, gun] of sehirler) sehirIsgal.set(s, [d, gun]);
      if (isgalMesh) { sahne.remove(isgalMesh); isgalMesh.geometry.dispose(); (isgalMesh.material as THREE.Material).dispose(); }
      isgalMesh = isgalKatmani(k, h, tema, birimler.map(([b, d]) => [b, d]));
      if (isgalMesh) sahne.add(isgalMesh);
      bilgiGoster();
      istek();
    },
  };
}
