// DOM üstü etiketler: devlet adları (iç daireye sığacak boyutta) ve şehir adları.
// Öncelik sırası: devletler (alana göre) → başkentler → diğer şehirler; çakışan etiket gizlenir.

import { birimBul, type Harita } from "./veri";
import type { Tema } from "./temalar";

export interface Gorunum { cx: number; cy: number; z: number; w: number; h: number }

interface Etiket {
  el: HTMLDivElement;
  tur: "devlet" | "baskent" | "sehir";
  x: number;
  y: number;
  r: number; // devlet: iç daire yarıçapı (derece)
  satirlar: string[];
  genislik: number; // 1px font boyutunda en uzun satır genişliği
  gorunur: boolean;
}

export const ESIK = { baskent: 6, sehir: 14 }; // px/derece; WebGL noktalarıyla aynı eşikler

function ikiSatir(ad: string): string[] {
  const k = ad.split(" ");
  if (ad.length <= 14 || k.length < 2) return [ad];
  let enIyi = 1, fark = Infinity;
  for (let i = 1; i < k.length; i++) {
    const d = Math.abs(k.slice(0, i).join(" ").length - k.slice(i).join(" ").length);
    if (d < fark) { fark = d; enIyi = i; }
  }
  return [k.slice(0, enIyi).join(" "), k.slice(enIyi).join(" ")];
}

export class Etiketler {
  private liste: Etiket[] = [];
  private tema!: Tema;
  private olcer = document.createElement("canvas").getContext("2d")!;
  sehirlerAcik = true;
  etiketlerAcik = true;

  constructor(private kap: HTMLElement, h: Harita) {
    this.yenile(h);
  }

  /** Barış veya kayıt yüklemesi sonrası başkent ve devlet etiketlerini yeniden kurar. */
  yenile(h: Harita) {
    this.kap.replaceChildren();
    this.liste = [];
    const sirali = h.paket.devletler.map((d, i) => ({ d, i })).filter((o) => o.d.etiket)
      .sort((a, b) => b.d.alan - a.d.alan);
    for (const { d } of sirali) {
      const [x, y, r] = d.etiket!;
      this.ekle("devlet", d.ad, x, y, r);
    }
    const sehirler = h.paket.sehirler.map((s, i) => ({ s, i }))
      .sort((a, b) => b.s.b - a.s.b || h.paket.devletler[b.s.d].alan - h.paket.devletler[a.s.d].alan);
    for (const { s } of sehirler) {
      const bi = birimBul(h, s.x, s.y), cevre = h.paket.birimler[bi]?.d;
      const ayri = cevre !== undefined && cevre !== s.d;
      const sahip = h.paket.devletler[s.d].ad;
      this.ekle(s.b ? "baskent" : "sehir", ayri ? `⚑ ${s.ad} · ${sahip}` : s.ad, s.x, s.y, 0);
      if (ayri) {
        const el = this.liste[this.liste.length - 1].el;
        el.classList.add("ayri-sehir");
        if (!h.devletBirimleri[s.d].length) el.classList.add("topraksiz-sehir");
        el.title = `Şehir: ${sahip}. Çevre arazi: ${cevre >= 0 ? h.paket.devletler[cevre].ad : "devletsiz"}.`;
      }
    }
    // Ayrı sahibi olan şehir kaybolmasın: çakışma hesabında devlet adlarından önce yer ayır.
    const oncelik = (e: Etiket) => e.el.classList.contains("topraksiz-sehir") ? 0 : e.el.classList.contains("ayri-sehir") ? 1 : 2;
    this.liste.sort((a, b) => oncelik(a) - oncelik(b));
    if (this.tema) this.temaAyarla(this.tema);
  }

  private ekle(tur: Etiket["tur"], ad: string, x: number, y: number, r: number) {
    const el = document.createElement("div");
    el.className = tur === "devlet" ? "et-devlet" : "et-sehir";
    const satirlar = tur === "devlet" ? ikiSatir(ad) : [ad];
    el.innerHTML = satirlar.map((s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;")).join("<br>");
    el.style.display = "none";
    this.kap.append(el);
    this.liste.push({ el, tur, x, y, r, satirlar, genislik: 0, gorunur: false });
  }

  temaAyarla(t: Tema) {
    this.tema = t;
    const e = t.etiket;
    const s = this.kap.style;
    s.setProperty("--et-devlet-font", `"${e.devletFont}"`);
    s.setProperty("--et-devlet-agirlik", String(e.devletAgirlik));
    s.setProperty("--et-devlet-renk", e.devletRenk);
    s.setProperty("--et-devlet-aralik", `${e.devletAralik}em`);
    s.setProperty("--et-donusum", e.buyukHarf ? "uppercase" : "none");
    s.setProperty("--et-sehir-font", `"${e.sehirFont}"`);
    s.setProperty("--et-sehir-agirlik", String(e.sehirAgirlik));
    s.setProperty("--et-sehir-renk", e.sehirRenk);
    s.setProperty("--et-sehir-boyut", `${e.sehirBoyut}px`);
    s.setProperty("--et-sehir-stil", e.italik ? "italic" : "normal");
    s.setProperty("--et-hale", e.hale);
    // Genişlikleri 100px'de ölç, 1px'e indir
    for (const et of this.liste) {
      const devlet = et.tur === "devlet";
      const stil = devlet ? "normal" : e.italik ? "italic" : "normal";
      this.olcer.font = `${stil} ${devlet ? e.devletAgirlik : e.sehirAgirlik} 100px "${devlet ? e.devletFont : e.sehirFont}"`;
      let w = 0;
      for (const satir of et.satirlar) {
        const metin = devlet && e.buyukHarf ? satir.toLocaleUpperCase("tr") : satir;
        const aralik = devlet ? e.devletAralik * 100 * (metin.length - 1) : 0;
        w = Math.max(w, this.olcer.measureText(metin).width + aralik);
      }
      et.genislik = w / 100;
    }
  }

  guncelle(g: Gorunum) {
    const kutular: number[] = [];
    const cakisir = (x0: number, y0: number, x1: number, y1: number) => {
      for (let i = 0; i < kutular.length; i += 4) {
        if (x0 < kutular[i + 2] && x1 > kutular[i] && y0 < kutular[i + 3] && y1 > kutular[i + 1]) return true;
      }
      return false;
    };
    const ekran = (x: number, y: number) => [g.w / 2 + (x - g.cx) * g.z, g.h / 2 - (y - g.cy) * g.z];
    const boy = this.tema.etiket.sehirBoyut;

    for (const et of this.liste) {
      let goster = false;
      const [sx, sy] = ekran(et.x, et.y);
      if (et.tur === "devlet") {
        if (this.etiketlerAcik && sx > -400 && sx < g.w + 400 && sy > -200 && sy < g.h + 200) {
          const rpx = et.r * g.z;
          const n = et.satirlar.length;
          let fs = Math.min(30, rpx * 0.55, (2.7 * rpx) / Math.max(et.genislik, 0.1), (1.5 * rpx) / (n * 1.1));
          fs = Math.floor(fs * 2) / 2;
          if (fs >= 9) {
            const w = et.genislik * fs, hh = n * fs * 1.1;
            const x0 = sx - w / 2 - 2, y0 = sy - hh / 2 - 2, x1 = sx + w / 2 + 2, y1 = sy + hh / 2 + 2;
            if (!cakisir(x0, y0, x1, y1)) {
              kutular.push(x0, y0, x1, y1);
              goster = true;
              et.el.style.fontSize = `${fs}px`;
              et.el.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px) translate(-50%,-50%)`;
            }
          }
        }
      } else if (this.sehirlerAcik && g.z >= (et.tur === "baskent" ? ESIK.baskent : ESIK.sehir)
        && sx > -50 && sx < g.w + 50 && sy > -20 && sy < g.h + 20) {
        const baskent = et.tur === "baskent";
        const fs = baskent ? boy + 3 : boy;
        const ara = baskent ? 10 : 7; // işaretten uzaklık
        const w = et.genislik * fs * (baskent ? 1.06 : 1); // kalın yazı biraz daha geniş
        const x0 = sx + ara - 2, y0 = sy - fs * 0.65, x1 = sx + ara + 1 + w, y1 = sy + fs * 0.65;
        // nokta her zaman çizilir; yalnızca yazı çakışmaya bakar
        const kayma = (et.el.classList.contains("ayri-sehir") ? [0, fs * 1.5, -fs * 1.5] : [0])
          .find((dy) => !cakisir(x0, y0 + dy, x1, y1 + dy));
        if (kayma !== undefined) {
          kutular.push(x0, y0 + kayma, x1, y1 + kayma);
          goster = true;
          if (baskent) {
            et.el.style.fontWeight = "700";
            et.el.style.fontSize = `${fs}px`;
          }
          et.el.style.transform = `translate(${(sx + ara).toFixed(1)}px,${(sy + kayma).toFixed(1)}px) translate(0,-50%)`;
        }
      }
      if (goster !== et.gorunur) {
        et.el.style.display = goster ? "block" : "none";
        et.gorunur = goster;
      }
    }
  }
}
