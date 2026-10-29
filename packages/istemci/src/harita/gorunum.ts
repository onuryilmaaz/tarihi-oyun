// Harita görünümü: three.js sahnesi, kamera, etiketler, seçim hiyerarşisi ve bilgi paneli.
// harita-gorsel-02 prototipinden (TASK-0002/0004) temizlenerek taşındı; görsel yön Tarihî atlas (DEC-0018).

import * as THREE from "three";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { tarihMetni } from "@tarihi/sim";
import type { OrduOzeti } from "../sim-protokol";
import { birimBul, type Harita } from "./veri";
import { TEMALAR } from "./temalar";
import { katmanlariKur, temaUygula, boyutAyarla, secimiCiz, devletRengi, kagitDokusu, isgalKatmani, type Secim } from "./harita";
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

export type WdDevlet = {
  qid?: string; kurulus?: number; yikilis?: number;
  baskentler?: { ad: string; durum: "gecerli" | "degil" | "belirsiz" }[];
};

export interface Katmanlar { arazi: boolean; nehir: boolean; sehir: boolean; etiket: boolean; guven: boolean }

export interface HaritaGorunumu {
  git(ad: keyof typeof KONUMLAR): void;
  istek(): void;
  devletRenkKutusu(d: number): string;
  oyuncuyuAyarla(devletIndeksi: number): void;
  /** Ordu işaretleri ve rotaları; planli: emri verilmiş ama yürüyüşe başlamamış rotalar (kesikli) */
  ordulariGoster(ordular: OrduOzeti[], secili: number | null, planli: Map<number, [number, number][]>): void;
  /** [birim, kontrol eden, gün], [şehir, kontrol eden, gün] */
  isgalGoster(birimler: [number, number, number][], sehirler: [number, number, number][]): void;
  orduyaOdaklan(o: OrduOzeti): void;
  seciliOge(): Secim;
  olaylar: {
    orduSec?: (id: number) => void;
    hedef?: (x: number, y: number, birim: number) => void; // Miller derece
  };
}

export function haritaGorunumuKur(h: Harita, wikidata: Record<string, WdDevlet>,
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
  let orduListesi: OrduOzeti[] = [];
  let seciliOrdu: number | null = null;
  const orduOgeleri = new Map<number, HTMLDivElement>();
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
  const kaynakMetni = (kaynak?: string) => !kaynak || kaynak === "tahmin" ? "Tahmin (agent, kaynaksız)"
    : kaynak === "tahmin-elle" ? "Tahmin (elle bölme)"
    : `<a href="https://www.openhistoricalmap.org/relation/${kaynak.slice(4)}" target="_blank" rel="noopener">OpenHistoricalMap #${kaynak.slice(4)}</a> (CC0)`;
  const devletKaynakSatirlari = (d: number) => {
    const dv = h.paket.devletler[d];
    const kay = dv.kaynak
      ? `OHM payı %${Math.round(dv.kaynak.ohmOran * 100)} · güven: <b>${dv.kaynak.guven === "orta" ? "orta" : "düşük"}</b>`
      : "Tahmin";
    const wd = wikidata[dv.id];
    let wdSatir = "";
    if (wd?.qid) {
      const bk = (wd.baskentler ?? []).filter((x) => x.durum !== "degil")
        .map((x) => kacis(x.ad) + (x.durum === "gecerli" ? " ✓" : "")).join(", ");
      wdSatir = `<dt>Wikidata</dt><dd><a href="https://www.wikidata.org/wiki/${wd.qid}" target="_blank" rel="noopener">${wd.qid}</a> · ${wd.kurulus ?? "?"}–${wd.yikilis ?? "?"}</dd>
        <dt>Başkent (Wikidata)</dt><dd>${bk || "—"}</dd>`;
    }
    return `<dt>Sınır kaynağı</dt><dd>${kay}</dd>${wdSatir}`;
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
      const sehirler = h.devletSehirleri[secim.id].map((i) => p.sehirler[i]);
      const baskent = sehirler.find((s) => s.b);
      govde = `<h3>${devletRenkKutusu(secim.id)}${kacis(d.ad)}${secim.id === oyuncu ? ' <span class="rozet">Siz</span>' : ""}</h3><dl>
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
        ${kontrolSatiri(birimIsgal.get(secim.id))}
        <dt>Şehirler</dt><dd>${sehirler.length ? sehirler.map((i) => `<button class="bag" data-secim="sehir:${i}">${kacis(p.sehirler[i].ad)}</button>`).join(", ") : "—"}</dd>
      </dl><p class="ipucu-metin">Arazi birimi şimdilik modern il/eyalet sınırıdır (prototip verisi).</p>`;
    } else {
      const s = p.sehirler[secim.id];
      const bi = birimBul(h, s.x, s.y);
      yol.push(devletYolu(s.d));
      if (bi >= 0) yol.push(`<button class="yol" data-secim="birim:${bi}">${kacis(p.birimler[bi].ad)}</button>`);
      yol.push(`<span class="yol-sabit">${kacis(s.ad)}</span>`);
      govde = `<h3>${s.b ? "★ " : ""}${kacis(s.ad)}</h3><dl>
        <dt>Devlet</dt><dd>${kacis(p.devletler[s.d].ad)}</dd>
        <dt>Statü</dt><dd>${s.b ? "Başkent" : "Şehir"}</dd>
        ${kontrolSatiri(sehirIsgal.get(secim.id))}
      </dl>`;
    }
    bilgi.innerHTML = `<nav class="kirinti">${yol.join('<span class="ayrac">›</span>')}</nav>${govde}`;
  };
  ogeler.bilgi.addEventListener("click", (e) => {
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
    if (!katmanAyarlari().sehir) return -1;
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
    oyuncuyuAyarla(d) { oyuncu = d; bilgiGoster(); },
    olaylar,
    seciliOge: () => secim,
    orduyaOdaklan(o) {
      g.cx = o.x / 1e4; g.cy = o.y / 1e4; g.z = Math.max(g.z, 40);
      istek();
    },
    ordulariGoster(ordular, secili, planli) {
      orduListesi = ordular;
      seciliOrdu = secili;
      for (const [id, el] of orduOgeleri) if (!ordular.some((o) => o.id === id)) { el.remove(); orduOgeleri.delete(id); }
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
            const [x, y] = ekrandanDunyaya(e.clientX, e.clientY);
            olaylar.hedef(x, y, birimBul(h, x, y));
          });
          ogeler.orduKap.append(el);
          orduOgeleri.set(o.id, el);
        }
        const asker = o.asker >= 1000 ? `${Math.round(o.asker / 1000)}B` : String(o.asker);
        el.innerHTML = `${devletRenkKutusu(o.devlet)}<b>${asker}</b>`;
        el.title = `${o.ad} · ${o.asker.toLocaleString("tr-TR")} asker`;
        el.classList.toggle("secili", o.id === secili);
        el.classList.toggle("yuruyor", o.yuruyor);
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
