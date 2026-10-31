// TASK-0007/4c — arazi işgali ile şehir kuşatması birbirinden bağımsızdır (AT-007/009).
import { olayEkle, type DunyaDurumu, type IsgalHazirligi, type Kusatma, type OrduDurumu } from "./durum";
import { DENGE } from "./denge";
import { emirDogrula, emirUygula, type Baglam } from "./emirler";
import { savasta } from "./savas";
import { kusatmaSaldiriYuzde } from "./teknoloji";
import { denizAblukasi } from "./deniz";
import { kompozisyonCikar, kompozisyonMuharebeYuzde, kompozisyonOransalAl } from "./birim";
import { sehirliBirimler } from "./sehir";

export function sehirMenzilinde(d: DunyaDurumu, b: Baglam, o: OrduDurumu, sehir: number): boolean {
  const s = d.sehirler[sehir], n = s && b.ag?.dugumler[s.dugum];
  if (!s || !n || s.dugum !== o.dugum) return false;
  const p = b.sehirKonumlari?.[sehir] ?? n;
  const dx = Math.trunc((o.x - p.x) * n.kx / 10000), dy = Math.trunc((o.y - p.y) * n.ky / 10000);
  return dx * dx + dy * dy <= DENGE.KUSATMA_MENZIL_M * DENGE.KUSATMA_MENZIL_M;
}

export function orduKusatmasi(d: DunyaDurumu, id: number): Kusatma | undefined {
  return d.kusatmalar.find((k) => k.ordular.includes(id));
}

export function kusatmaGucu(d: DunyaDurumu, k: Kusatma): { guc: number; gereken: number; yeterli: boolean } {
  // TASK-0019 (4/4): kuşatan her zaman saldırır; kompozisyona göre saldırı yüzdesi çarpan olarak uygulanır.
  const guc = k.ordular.reduce((s, id) => {
    const o = d.ordular.find((a) => a.id === id);
    if (!o) return s;
    const birimYuzde = kompozisyonMuharebeYuzde(o.kompozisyon, false);
    return s + Math.floor((o.asker * o.moral * birimYuzde) / (DENGE.MORAL_EN_YUKSEK * 100));
  }, 0);
  const gereken = Math.max(1, d.sehirler[k.sehir].garnizon) * (d.sehirler[k.sehir].sur + 1);
  return { guc, gereken, yeterli: guc >= gereken };
}

/** Son ordu ayrılınca kuşatma kalkar. Yarım kalan kuşatma otomatik zafer sağlamaz. */
export function kusatmadanCikar(d: DunyaDurumu, ordu: number): void {
  for (const k of d.kusatmalar) {
    if (!k.ordular.includes(ordu)) continue;
    k.ordular = k.ordular.filter((id) => id !== ordu);
    if (!k.ordular.length) olayEkle(d, { tur: "kusatma-kalkti", devlet: k.devlet, metin: `${d.sehirler[k.sehir].ad} kuşatması kaldırıldı.` });
  }
  d.kusatmalar = d.kusatmalar.filter((k) => k.ordular.length > 0);
}

export function isgalleriIlerlet(d: DunyaDurumu, b: Baglam): void {
  if (!b.ag) return;
  const adaylar = new Map<number, Set<number>>();
  for (const o of d.ordular) {
    if (o.asker <= 0 || o.moral <= 0 || o.rota.length || o.cekiliyor || o.muharebe !== null) continue;
    const n = b.ag.dugumler[o.dugum];
    if (!n) continue;
    if (!adaylar.has(n.b)) adaylar.set(n.b, new Set());
    adaylar.get(n.b)!.add(o.devlet);
  }
  const yeni: IsgalHazirligi[] = [];
  const sehirli = sehirliBirimler(d); // TASK-0027: şehirli toprak şehriyle birlikte el değiştirir
  for (const [birim, devletler] of adaylar) {
    const t = d.birimler[birim];
    if (sehirli.has(birim)) continue;
    if (!t || t.sahip < 0 || devletler.size !== 1) continue; // çekişmeli veya devletsiz arazi alınmaz
    const devlet = [...devletler][0];
    if (t.kontrol === devlet || !savasta(d, devlet, t.kontrol)) continue;
    // Düğümde süren muharebe varsa arazideki başka bir ordu işgali bitiremez.
    if (d.muharebeler.some((m) => b.ag!.dugumler[m.dugum]?.b === birim)) continue;
    const gun = (d.isgalHazirliklari.find((p) => p.birim === birim && p.devlet === devlet)?.gun ?? 0) + 1;
    if (gun < DENGE.ISGAL_GUN) { yeni.push({ birim, devlet, gun }); continue; }
    const onceki = t.kontrol;
    t.kontrol = devlet;
    t.isgalBaslangic = t.sahip === devlet ? null : d.gun;
    olayEkle(d, { tur: "arazi-isgal", devlet: d.ayarlar.oyuncu === onceki ? onceki : devlet,
      metin: `${d.devletler[devlet].ad}, arazi ${birim} üzerinde ${DENGE.ISGAL_GUN} günlük bekleyiş sonunda askerî kontrolü aldı. Yasal sahip değişmedi.` });
  }
  d.isgalHazirliklari = yeni;
}

function kaybiPaylastir(ordular: OrduDurumu[], kayip: number): void {
  const toplam = ordular.reduce((s, o) => s + o.asker, 0);
  let kalan = Math.min(kayip, toplam);
  for (let i = 0; i < ordular.length; i++) {
    const o = ordular[i];
    const pay = i === ordular.length - 1 ? Math.min(o.asker, kalan) : Math.min(o.asker, kalan, Math.floor(kayip * o.asker / Math.max(1, toplam)));
    o.kompozisyon = kompozisyonCikar(o.kompozisyon, kompozisyonOransalAl(o.kompozisyon, pay)); // TASK-0019
    o.asker -= pay; kalan -= pay;
  }
}

export function kusatmalariIlerlet(d: DunyaDurumu, b: Baglam): void {
  for (const k of [...d.kusatmalar]) {
    const s = d.sehirler[k.sehir];
    k.ordular = k.ordular.filter((id) => {
      const o = d.ordular.find((a) => a.id === id);
      return o && o.asker > 0 && !o.cekiliyor && !o.rota.length && sehirMenzilinde(d, b, o, k.sehir);
    });
    if (!k.ordular.length || s.kontrol !== k.savunan || !savasta(d, k.devlet, k.savunan)) {
      d.kusatmalar = d.kusatmalar.filter((a) => a !== k);
      olayEkle(d, { tur: "kusatma-kalkti", devlet: k.devlet, metin: `${s.ad} kuşatması sona erdi; şehir ele geçirilmedi.` });
      continue;
    }
    const ordular = d.ordular.filter((o) => k.ordular.includes(o.id));
    if (ordular.some((o) => o.muharebe !== null)) continue; // yardım ordusuyla muharebede kuşatma ilerlemez
    const guc = kusatmaGucu(d, k);
    if (!guc.yeterli) continue;
    k.gun++;
    // Denizden abluka (8a): liman ve bölge kuşatanın elindeyse erzak daha hızlı biter
    k.erzak = Math.max(0, k.erzak - DENGE.KUSATMA_ERZAK_AZALMA[k.yontem] * (denizAblukasi(d, k.sehir, k.devlet) ? DENGE.ABLUKA_ERZAK_CARPANI : 1));
    if (k.yontem === "saldiri") {
      const garnizonKaybi = Math.min(s.garnizon, Math.max(1,
        Math.floor(guc.guc * DENGE.KUSATMA_SALDIRI_GARNIZON_YUZDE * kusatmaSaldiriYuzde(d, k.devlet) / (10000 * (s.sur + 1)))));
      const askerKaybi = Math.min(ordular.reduce((t, o) => t + o.asker, 0), Math.ceil(s.garnizon * (s.sur + 1) * DENGE.KUSATMA_SALDIRI_ASKER_KAYIP_BINDE / 1000));
      kaybiPaylastir(ordular, askerKaybi);
      s.garnizon -= garnizonKaybi;
      for (const o of ordular) o.moral = Math.max(0, o.moral - DENGE.KUSATMA_SALDIRI_MORAL);
      if (askerKaybi || garnizonKaybi) olayEkle(d, { tur: "kusatma-saldiri", devlet: k.devlet,
        metin: `${s.ad}: surlara saldırıda ${askerKaybi} asker kaybı; garnizon savunması zayıfladı.` });
      const dagilan = ordular.filter((o) => o.asker <= 0).map((o) => o.id);
      d.ordular = d.ordular.filter((o) => o.asker > 0);
      for (const id of dagilan) kusatmadanCikar(d, id);
    }
    if (!d.kusatmalar.includes(k) || !k.ordular.length) continue;
    if (k.gun < DENGE.KUSATMA_EN_AZ_GUN || (s.garnizon > 0 && k.erzak > 0)) continue;
    s.kontrol = k.devlet;
    s.isgalBaslangic = s.devlet === k.devlet ? null : d.gun;
    d.kusatmalar = d.kusatmalar.filter((a) => a !== k);
    const neden = s.garnizon === 0 ? "garnizon yenildi" : "erzak tükendi ve şehir teslim oldu";
    const metin = `${s.ad}, ${k.gun} günlük kuşatma sonunda ${d.devletler[k.devlet].ad} kontrolüne geçti: ${neden}. Şehrin toprağı da onunla birlikte geçti; yasal sahiplik barışla değişir.`;
    olayEkle(d, { tur: "sehir-dustu", devlet: d.ayarlar.oyuncu === k.savunan ? k.savunan : k.devlet, metin });
    if ([k.devlet, k.savunan].includes(d.ayarlar.oyuncu) && !d.aktifKesinti) d.aktifKesinti = { gun: d.gun, neden: metin };
  }
}

/** TASK-0027: oyuncunun ordusu savaşta olduğu devletin şehrinin önüne varınca kuşatma kendiliğinden (abluka) başlar.
 *  Yalnızca varış anında denenir; oyuncu kuşatmadan ayrılırsa aynı yerde yeniden başlamaz. AI kendi kararını verir. */
export function varincaKusat(d: DunyaDurumu, b: Baglam, o: OrduDurumu): void {
  if (o.devlet !== d.ayarlar.oyuncu) return;
  for (let i = 0; i < d.sehirler.length; i++) {
    const s = d.sehirler[i];
    if (s.bagli >= 0 || s.kontrol < 0 || s.kontrol === o.devlet || !savasta(d, o.devlet, s.kontrol) || !sehirMenzilinde(d, b, o, i)) continue;
    const e = { tur: "kusat", ordu: o.id, sehir: i, yontem: "abluka" } as const;
    if (emirDogrula(d, e, b, true).gecerli) { emirUygula(d, e, b); return; }
  }
}
