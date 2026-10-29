// Ordu hareketi (TASK-0006, DEC-0025): hareket ağı, yol bulma ve rota.
// Konumlar Miller koordinatı × 10⁴ tam sayıdır; uzunluklar "efektif metre" (arazi zorluğu ve geçiş
// cezaları eklenmiş) tam sayıdır. Trigonometri yoktur; yalnızca dört işlem ve Math.sqrt (IEEE'de
// doğru yuvarlanır, tarayıcıdan bağımsızdır) kullanılır.

import type { DunyaDurumu, OrduDurumu } from "./durum";
import { HAREKET } from "./denge";
export { HAREKET } from "./denge";

export interface AgDugum { b: number; x: number; y: number; z: number; kx: number; ky: number }
export interface AgKenar { a: number; b: number; mx: number; my: number; da: number; db: number; n: number; g: number; ad?: string }
export interface AgVerisi { dugumler: AgDugum[]; kenarlar: AgKenar[] }

export interface HareketAgi extends AgVerisi {
  komsu: number[][]; // düğüm → kenar indeksleri
}

export function agHazirla(veri: AgVerisi): HareketAgi {
  const komsu: number[][] = veri.dugumler.map(() => []);
  veri.kenarlar.forEach((k, i) => { komsu[k.a].push(i); komsu[k.b].push(i); });
  return { ...veri, komsu };
}

export interface RotaAdimi {
  d: number; // bu noktaya varınca ordunun bulunduğu düğüm
  x: number;
  y: number;
  m: number; // bu adımın efektif uzunluğu (metre)
}

export interface RotaKirilimi {
  mesafeM: number; // ham yol uzunluğu
  araziM: number; // arazi zorluğunun eklediği
  nehir: number;
  bogaz: number;
}

export type RotaSonucu =
  | { gecerli: true; adimlar: RotaAdimi[]; toplam: number; kirilim: RotaKirilimi; gun: number }
  | { gecerli: false; neden: string };

/** Bir düğüm içindeki düz yolun ham uzunluğu (metre); yerel ölçekle yaklaşık. */
function icMesafe(n: AgDugum, x0: number, y0: number, x1: number, y1: number): number {
  const dx = ((x1 - x0) * n.kx) / 10000, dy = ((y1 - y0) * n.ky) / 10000;
  return Math.round(Math.sqrt(dx * dx + dy * dy));
}
const zorlu = (m: number, z: number) => Math.round((m * z) / 100);

/** Erişim kuralı (DEC-0025/3): kendi ve devletsiz topraklar; savaşta olunan devletin toprakları (DEC-0027). */
export function gecilebilir(d: DunyaDurumu, ag: HareketAgi, dugum: number, devlet: number): boolean {
  const sahip = d.birimler[ag.dugumler[dugum].b]?.sahip ?? -1;
  if (sahip === devlet || sahip === -1) return true;
  return d.savaslar.some((s) => (s.saldiran === devlet && s.savunan === sahip) || (s.saldiran === sahip && s.savunan === devlet));
}

// İkili yığın (öncelik kuyruğu); eşitlikte düğüm indeksi küçük olan önce — deterministik
class Yigin {
  private v: number[] = []; // [maliyet, düğüm] çiftleri düz dizide
  get bos() { return this.v.length === 0; }
  private kucuk(i: number, j: number) {
    const a = this.v[2 * i], b = this.v[2 * j];
    return a < b || (a === b && this.v[2 * i + 1] < this.v[2 * j + 1]);
  }
  private takas(i: number, j: number) {
    const v = this.v;
    [v[2 * i], v[2 * j]] = [v[2 * j], v[2 * i]];
    [v[2 * i + 1], v[2 * j + 1]] = [v[2 * j + 1], v[2 * i + 1]];
  }
  ekle(maliyet: number, dugum: number) {
    this.v.push(maliyet, dugum);
    let i = this.v.length / 2 - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (!this.kucuk(i, p)) break; this.takas(i, p); i = p; }
  }
  al(): [number, number] {
    const m = this.v[0], d = this.v[1];
    const n = this.v.length / 2 - 1;
    this.takas(0, n);
    this.v.length -= 2;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1, r = l + 1;
      let k = i;
      if (l < n && this.kucuk(l, k)) k = l;
      if (r < n && this.kucuk(r, k)) k = r;
      if (k === i) break;
      this.takas(i, k); i = k;
    }
    return [m, d];
  }
}

/** Kenarı a→b yönünde yürümenin iki adımı: sınır orta noktasına, sonra b merkezine. */
function kenarAdimlari(ag: HareketAgi, ki: number, from: number): [RotaAdimi, RotaAdimi, RotaKirilimi] {
  const k = ag.kenarlar[ki];
  const ileri = k.a === from;
  const hedef = ileri ? k.b : k.a;
  const A = ag.dugumler[from], B = ag.dugumler[hedef];
  const m1 = ileri ? k.da : k.db, m2 = ileri ? k.db : k.da;
  const e1 = zorlu(m1, A.z), e2 = zorlu(m2, B.z);
  const ceza = k.n * HAREKET.NEHIR_CEZASI + k.g * HAREKET.BOGAZ_CEZASI;
  return [
    { d: hedef, x: k.mx, y: k.my, m: e1 },
    { d: hedef, x: B.x, y: B.y, m: e2 + ceza },
    { mesafeM: m1 + m2, araziM: e1 - m1 + e2 - m2, nehir: k.n, bogaz: k.g },
  ];
}

/**
 * Ordunun bulunduğu yerden hedef noktaya rota (Dijkstra; eşitlikte düşük indeks).
 * Hedef: Miller × 10⁴ koordinat ve içinde bulunduğu düğüm (istemci haritadan belirler).
 */
export function rotaBul(d: DunyaDurumu, ag: HareketAgi, ordu: OrduDurumu, hedef: { x: number; y: number; dugum: number }): RotaSonucu {
  const N = ag.dugumler.length;
  if (!Number.isSafeInteger(hedef.dugum) || hedef.dugum < 0 || hedef.dugum >= N) return { gecerli: false, neden: "Hedef karada değil." };
  if (!gecilebilir(d, ag, hedef.dugum, ordu.devlet)) {
    const sahip = d.birimler[ag.dugumler[hedef.dugum].b].sahip;
    return { gecerli: false, neden: `${d.devletler[sahip].ad} toprağına girmek için savaş ilan etmek gerekir (geçiş izni diplomasiyle Aşama 6'da).` };
  }
  const bas = ordu.dugum;
  const maliyet = new Float64Array(N).fill(Infinity);
  const onceki = new Int32Array(N).fill(-1); // gelinen kenar
  maliyet[bas] = 0;
  const y = new Yigin();
  y.ekle(0, bas);
  while (!y.bos) {
    const [c, u] = y.al();
    if (c > maliyet[u]) continue;
    if (u === hedef.dugum) break;
    for (const ki of ag.komsu[u]) {
      const k = ag.kenarlar[ki];
      const v = k.a === u ? k.b : k.a;
      if (!gecilebilir(d, ag, v, ordu.devlet)) continue;
      const [s1, s2] = kenarAdimlari(ag, ki, u);
      const yeni = c + s1.m + s2.m;
      if (yeni < maliyet[v]) { maliyet[v] = yeni; onceki[v] = ki; y.ekle(yeni, v); }
    }
  }
  if (maliyet[hedef.dugum] === Infinity) {
    return { gecerli: false, neden: "Ulaşılamıyor: kendi ya da devletsiz topraklardan geçen bir kara yolu yok (deniz taşıması donanmayla gelecek)." };
  }
  // Kenar zincirini geri izle
  const zincir: number[] = [];
  for (let v = hedef.dugum; v !== bas; ) {
    const ki = onceki[v];
    zincir.push(ki);
    const k = ag.kenarlar[ki];
    v = k.a === v ? k.b : k.a;
  }
  zincir.reverse();

  const adimlar: RotaAdimi[] = [];
  const kirilim: RotaKirilimi = { mesafeM: 0, araziM: 0, nehir: 0, bogaz: 0 };
  const icAdim = (dugum: number, x0: number, y0: number, x1: number, y1: number) => {
    const n = ag.dugumler[dugum];
    const m = icMesafe(n, x0, y0, x1, y1);
    if (m === 0) return;
    const e = zorlu(m, n.z);
    kirilim.mesafeM += m; kirilim.araziM += e - m;
    adimlar.push({ d: dugum, x: x1, y: y1, m: e });
  };
  let u = bas;
  if (zincir.length) {
    const B = ag.dugumler[bas];
    icAdim(bas, ordu.x, ordu.y, B.x, B.y); // önce bulunduğu parçanın merkezine
    for (const ki of zincir) {
      const [s1, s2, k] = kenarAdimlari(ag, ki, u);
      adimlar.push(s1, s2);
      kirilim.mesafeM += k.mesafeM; kirilim.araziM += k.araziM; kirilim.nehir += k.nehir; kirilim.bogaz += k.bogaz;
      u = s2.d;
    }
    const H = ag.dugumler[u];
    icAdim(u, H.x, H.y, hedef.x, hedef.y);
  } else {
    icAdim(bas, ordu.x, ordu.y, hedef.x, hedef.y);
  }
  const toplam = adimlar.reduce((s, a) => s + a.m, 0);
  return { gecerli: true, adimlar, toplam, kirilim, gun: Math.ceil(toplam / ordu.hiz) };
}

/** Görüntüleme için ordunun anlık konumu (tam sayı; adımın neresinde olduğu). */
export function orduKonumu(o: OrduDurumu): { x: number; y: number } {
  if (!o.rota.length || o.ilerleme === 0) return { x: o.x, y: o.y };
  const a = o.rota[0];
  return {
    x: o.x + Math.trunc(((a.x - o.x) * o.ilerleme) / a.m),
    y: o.y + Math.trunc(((a.y - o.y) * o.ilerleme) / a.m),
  };
}

/** Günlük ilerleme: hız kadar rota adımı tüketilir. Vardıysa true döner. */
export function orduIlerlet(o: OrduDurumu): boolean {
  if (!o.rota.length) return false;
  let kalan = o.hiz;
  while (kalan > 0 && o.rota.length) {
    const a = o.rota[0];
    const gereken = a.m - o.ilerleme;
    if (kalan >= gereken) {
      kalan -= gereken;
      o.x = a.x; o.y = a.y; o.dugum = a.d;
      o.ilerleme = 0;
      o.rota.shift();
    } else {
      o.ilerleme += kalan;
      kalan = 0;
    }
  }
  return o.rota.length === 0;
}

/** Kalan yolun efektif uzunluğu ve tahmini gün. */
export function kalanYol(o: OrduDurumu): { m: number; gun: number } {
  const m = o.rota.reduce((s, a) => s + a.m, 0) - o.ilerleme;
  return { m, gun: Math.ceil(m / o.hiz) };
}
