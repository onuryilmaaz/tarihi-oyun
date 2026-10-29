// Oyun istemcisi (TASK-0005): harita + üst durum çubuğu + tur akışı + yerel kayıt.
// Simülasyon Web Worker'da çalışır (DEC-0023); bu dosya yalnızca arayüzü yönetir.

import "@fontsource/cinzel/600.css";
import "@fontsource/cormorant-garamond/700-italic.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/700.css";
import { type YapiTuru, DENGE, tarihMetni, toplamaMaliyeti, type Emir, type MuharebeRaporu, type SenaryoVerisi, type Tutum, type TurSuresi } from "@tarihi/sim";
import { Color } from "three";
import { armaSvg } from "./arma";
import { ozelSecimleriKur } from "./secim";

ozelSecimleriKur();
import { haritaYukle } from "./harita/veri";
import { haritaGorunumuKur, kacis, KONUMLAR, type Katmanlar, type WdDevlet } from "./harita/gorunum";
import { SimIstemcisi, type Ozet, type RotaOnizleme } from "./sim-protokol";
import { kayitOku, kayitYaz, type Yuva } from "./kayit-deposu";
import { savasArayuzuKur } from "./savas-arayuzu";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const parametreler = new URLSearchParams(location.search);
const TOHUM = Number(parametreler.get("tohum")) || 1453;
const SENARYO_YOLU = `${import.meta.env.BASE_URL}senaryo-1453/`;

/** Oyunun kendi onay penceresi (tarayıcının confirm/alert pencereleri kullanılmaz). */
function onayIste(baslik: string, metin: string, evet: string, tehlikeli = false): Promise<boolean> {
  return new Promise((cozum) => {
    $("onayBaslik").textContent = baslik;
    $("onayMetin").textContent = metin;
    const evetBtn = $<HTMLButtonElement>("onayEvet"), hayirBtn = $<HTMLButtonElement>("onayHayir");
    evetBtn.textContent = evet;
    evetBtn.classList.toggle("tehlike", tehlikeli);
    $("onay").hidden = false;
    hayirBtn.focus();
    const bitir = (sonuc: boolean) => {
      $("onay").hidden = true;
      evetBtn.onclick = hayirBtn.onclick = null;
      window.removeEventListener("keydown", tus, true);
      cozum(sonuc);
    };
    const tus = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); bitir(false); } };
    window.addEventListener("keydown", tus, { capture: true });
    evetBtn.onclick = () => bitir(true);
    hayirBtn.onclick = () => bitir(false);
  });
}

let bildirimZamanlayici = 0;
function bildir(metin: string, tur: "bilgi" | "uyari" | "hata" = "bilgi") {
  const b = $("bildirim");
  b.textContent = metin;
  b.dataset.tur = tur;
  b.hidden = false;
  clearTimeout(bildirimZamanlayici);
  bildirimZamanlayici = window.setTimeout(() => { b.hidden = true; }, tur === "hata" ? 7000 : 4000);
}

async function baslat() {
  await Promise.all([
    document.fonts.load('600 20px "Cinzel"'),
    document.fonts.load('italic 700 20px "Cormorant Garamond"'),
    document.fonts.load('500 20px "Inter"'),
    document.fonts.load('700 20px "Inter"'),
  ]);
  const [h, senaryo, wikidata] = await Promise.all([
    haritaYukle(`${SENARYO_YOLU}harita.json`),
    fetch(`${SENARYO_YOLU}senaryo.json`).then((r) => r.json() as Promise<SenaryoVerisi>),
    fetch(`${SENARYO_YOLU}wikidata.json`).then((r) => r.json()).then((j) => j.devletler as Record<string, WdDevlet>)
      .catch(() => ({} as Record<string, WdDevlet>)),
  ]);
  // Harita ve senaryo aynı devlet sırasını kullanmalı (araclar/senaryo-uret.mjs)
  if (h.paket.devletler.length !== senaryo.devletler.length
    || h.paket.devletler.some((d, i) => d.id !== senaryo.devletler[i].id)) {
    throw new Error("Harita ve senaryo verisi uyumsuz; `npm run senaryo` ile yeniden üretin.");
  }
  const senaryoKimligi = `${senaryo.id}@${senaryo.surum}`;

  const katmanAyarlari = (): Katmanlar => ({
    arazi: $<HTMLInputElement>("kArazi").checked,
    nehir: $<HTMLInputElement>("kNehir").checked,
    sehir: $<HTMLInputElement>("kSehir").checked,
    etiket: $<HTMLInputElement>("kEtiket").checked,
    guven: $<HTMLInputElement>("kGuven").checked,
  });
  const gorunum = haritaGorunumuKur(h, wikidata,
    { kap: $("tuvalKap"), etiketKap: $("etiketler"), orduKap: $("ordular"), kagit: $("kagit"), bilgi: $("bilgi"), ipucu: $("ipucu") },
    katmanAyarlari);
  for (const id of ["kArazi", "kNehir", "kSehir", "kEtiket", "kGuven"]) $(id).addEventListener("change", gorunum.istek);
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-git]")) {
    b.onclick = () => gorunum.git(b.dataset.git as keyof typeof KONUMLAR);
  }

  // --- Simülasyon
  const sim = new SimIstemcisi();
  let ozet: Ozet = (await sim.gonder({ tip: "yeniOyun", senaryo, tohum: TOHUM, oyuncu: parametreler.get("devlet") ?? undefined })).ozet;
  let mesgul = false;
  let seciliOrdu: number | null = null;
  let seciliDonanma: number | null = null;
  const bekleyenSavas = new Set<number>(); // ilan edildi, bir sonraki turda başlayacak
  const bekleyenTutum = new Map<number, Tutum>();
  const gorulenRaporlar = new Set<number>();
  const TUTUMLAR: [Tutum, string, string][] = [
    ["temkinli", "Temkinli", "Moral %60'ın altına düşünce çekilir"],
    ["dengeli", "Dengeli", "Moral %35'in altına düşünce çekilir"],
    ["inatci", "İnatçı", "Moral %10'un altına düşene kadar direnir"],
  ];
  const planli = new Map<number, RotaOnizleme>(); // emri verilmiş, tur başında uygulanacak rotalar
  // Birim → hareket ağı düğümleri (haritadan tıklanan noktanın düğümünü bulmak için)
  const birimDugumleri = new Map<number, number[]>();
  senaryo.ag?.dugumler.forEach((n, i) => {
    if (!birimDugumleri.has(n.b)) birimDugumleri.set(n.b, []);
    birimDugumleri.get(n.b)!.push(i);
  });

  // Diplomasi harita modu (MASTER_SPEC §7.3): siz, müttefik, savaş, tarafsızlar bakışa göre
  let haritaModu: "siyasi" | "diplomasi" | "din" | "kultur" | "istikrar" = "siyasi";
  // Din/kültür renkleri (7b): dinler sabit, kültürler sırasına göre altın oranla dağıtılmış tonlar
  const DIN_RENK: Record<string, string> = { sunni: "#4f8f4a", sii: "#2e6b5e", ortodoks: "#8a5fa8", katolik: "#3f6fb5", ermeni: "#b5603f",
    yahudi: "#d8c36a", budist: "#e08a3c", hindu: "#c94f7c", yerel: "#8c8c7a", bilinmiyor: "#cfc6b0" };
  const kulturListesi = Object.keys(senaryo.nufus?.kulturler ?? {});
  const kulturRengi = (k: string) => {
    const i = kulturListesi.indexOf(k);
    if (i < 0) return "#cfc6b0";
    const c = new Color().setHSL(((i * 137.508) % 360) / 360, 0.45, 0.58);
    return `#${c.getHexString()}`;
  };
  const dinAdi = (x: string) => senaryo.nufus?.dinler[x] ?? (x === "bilinmiyor" ? "Bilinmiyor" : x);
  const kulturAdi = (x: string) => senaryo.nufus?.kulturler[x] ?? (x === "diger" ? "Diğer" : x);
  const nufusHaritasi = () => {
    if (haritaModu === "istikrar") {
      const riskler = ozet.birimSahipleri.map(() => 0), bilinen = new Set<number>();
      senaryo.sehirler.forEach((s, i) => { if (s.birim >= 0) { bilinen.add(s.birim); riskler[s.birim] = Math.max(riskler[s.birim], ozet.istikrar[i].risk); } });
      gorunum.birimRenkleri(riskler.map((r, i) => !bilinen.has(i) ? "#cfc6b0" : r >= DENGE.IST_AYAKLANMA ? "#b64d43" : r >= DENGE.IST_HUZURSUZLUK ? "#d6a64d" : "#8bac7a"));
      $("nufusLejant").innerHTML = '<b>İsyan riski · aylık hesap</b><div><span style="background:#8bac7a"></span>0–49: sakin</div><div><span style="background:#d6a64d"></span>50–79: huzursuzluk</div><div><span style="background:#b64d43"></span>80–100: ayaklanma tehlikesi</div><div><span style="background:#cfc6b0"></span>Şehir verisi yok</div><div>Birden fazla şehirde en yüksek risk gösterilir.</div>';
      $("nufusLejant").hidden = false; return;
    }
    if (haritaModu !== "din" && haritaModu !== "kultur") { gorunum.birimRenkleri(null); $("nufusLejant").hidden = true; return; }
    const din = haritaModu === "din";
    // Şehri olan arazi o şehrin baskın grubuyla, şehri olmayan arazi sahibinin resmî din/kültürüyle boyanır
    const sehirBirim = new Map<number, number>();
    senaryo.sehirler.forEach((s, i) => { if (s.birim >= 0) sehirBirim.set(s.birim, i); });
    const renk = (k: string) => (din ? DIN_RENK[k] ?? "#cfc6b0" : kulturRengi(k));
    const kullanilan = new Set<string>();
    gorunum.birimRenkleri(ozet.birimSahipleri.map((sahip, b) => {
      const si = sehirBirim.get(b);
      const g = si !== undefined ? ozet.sehirNufuslari[si].gruplar[0] : undefined;
      const k = g ? (din ? g[0] : g[1]) : sahip < 0 ? "bilinmiyor" : (din ? ozet.devletDinleri[sahip] : ozet.devletKulturleri[sahip]);
      if (sahip >= 0) kullanilan.add(k);
      return sahip < 0 ? "#e6dcc6" : renk(k);
    }));
    $("nufusLejant").innerHTML = `<b>${din ? "Baskın din" : "Baskın kültür"}</b>` + [...kullanilan].sort().map((k) =>
      `<div><span style="background:${renk(k)}"></span>${kacis(din ? dinAdi(k) : kulturAdi(k))}</div>`).join("");
    $("nufusLejant").hidden = false;
  };
  const diplomasiHaritasi = () => {
    nufusHaritasi();
    if (haritaModu !== "diplomasi") return gorunum.haritaRenkleri(null);
    const karis = (a: number[], b: number[], t: number) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
    const hex = (c: number[]) => `#${c.map((x) => x.toString(16).padStart(2, "0")).join("")}`;
    const kotu = [0xc9, 0x8a, 0x7e], notr = [0xd8, 0xcd, 0xb5], iyi = [0x9c, 0xc0, 0x8f];
    gorunum.haritaRenkleri(ozet.diplomasi.map((k) => !k ? "#c9a227" : k.savasta ? "#a33a2f" : k.muttefik ? "#4f8f4a"
      : hex(k.bakisi < 0 ? karis(notr, kotu, Math.min(1, -k.bakisi / 60)) : karis(notr, iyi, Math.min(1, k.bakisi / 60)))));
  };
  // Hükümdar ve veraset (TASK-0010/7a)
  type HukOz = NonNullable<Ozet["hukumdar"]>;
  const yetenekMetni = (h: HukOz) => `Yönetim ${h.yonetim} · Askerlik ${h.askerlik} · Diplomasi ${h.diplomasi}`;
  const kurguRozeti = (h: HukOz) => (h.kurgusal ? '<span class="rozet-kurgu" title="Tarihî kişi değil; oyunun ürettiği kurgusal kişi">kurgusal</span>' : "");
  const hukumdarKarti = () => {
    const h = ozet.hukumdar;
    $("hukumdarKarti").innerHTML = h
      ? `<b>${kacis(h.ad)}</b>${kurguRozeti(h)} · ${h.yas} yaşında<br />${kacis(h.hanedan)} · meşruiyet ${h.mesruiyet}<br />${yetenekMetni(h)}<br />
        Veraset: ${kacis(ozet.veraset)}${ozet.tarihiHalef ? ` · tarihî halef: ${kacis(ozet.tarihiHalef)}` : ""}`
      : `Taht boş — halef bekleniyor. <button id="verasetAc">Halefi seç</button>`;
  };
  let secilenAday: number | null = null;
  const verasetCiz = () => {
    const v = ozet.verasetSecimi;
    if (!v) { $("verasetPencere").hidden = true; return; }
    $("verasetBilgi").textContent = `${v.onceki} öldü. Veraset geleneği: ${v.veraset}. Geleneğe uygun aday daha yüksek meşruiyetle başlar.`;
    $("verasetAdaylar").innerHTML = v.adaylar.map((a, i) => `<div class="aday${secilenAday === i ? " secili" : ""}"><span><b>${kacis(a.ad)}</b>${kurguRozeti(a)}${a.tarihi ? " · tarihî halef" : ""}
      <small>${a.yas} yaşında · ${yetenekMetni(a)} · meşruiyet ${a.mesruiyet}${a.gelenek ? "" : " (geleneğe aykırı)"}</small></span>
      <button data-aday="${i}"${secilenAday !== null ? " disabled" : ""}>${secilenAday === i ? "Seçildi" : "Tahta çıkar"}</button></div>`).join("");
  };
  const verasetAc = () => { if (ozet.verasetSecimi) { verasetCiz(); $("verasetPencere").hidden = false; } };
  // Donanma (TASK-0011/8a): bölge merkezleri boylam/enlemden Miller × 10⁴'e
  const millerY = (lat: number) => 1.25 * Math.log(Math.tan(Math.PI / 4 + (0.4 * lat * Math.PI) / 180)) * 180 / Math.PI;
  const bolgeNoktasi = (b: number) => { const z = senaryo.deniz!.bolgeler[b]; return { x: Math.round(z.lon * 1e4), y: Math.round(millerY(z.lat) * 1e4) }; };
  const bolgeAdi = (b: number) => ozet.denizBolgeleri[b]?.ad ?? "?";
  const gemiMetni = (k: number, l: number) => [k ? `${k} kadırga` : "", l ? `${l} kalyon` : ""].filter(Boolean).join(", ");
  const donanmaArayuzu = () => {
    if (seciliDonanma !== null && !ozet.donanmalar.some((f) => f.id === seciliDonanma)) seciliDonanma = null;
    if (senaryo.deniz) {
      gorunum.donanmalariGoster([
        ...ozet.donanmalar.map((f) => ({ anahtar: `d${f.id}`, ...bolgeNoktasi(f.bolge), donanma: f.id,
          sinif: `ordu donanma${f.id === seciliDonanma ? " secili" : ""}${f.rota.length ? " yuruyor" : ""}`,
          html: `${gorunum.devletRenkKutusu(ozet.oyuncu.indeks)}<b>⚓ ${f.kadirga + f.kalyon}</b>${f.yuk ? " 🛡" : ""}` })),
        ...ozet.yabanciDonanmalar.map((f) => ({ anahtar: `y${f.id}`, ...bolgeNoktasi(f.bolge), donanma: null,
          sinif: "ordu donanma yabanci", html: `${gorunum.devletRenkKutusu(f.devlet)}<b>⚓ ~${f.yaklasikGemi}</b>` })),
      ]);
    }
    $("donanmaListesi").innerHTML = ozet.donanmalar.map((f) => `<li><button class="ordu-satir${f.id === seciliDonanma ? " etkin" : ""}" data-donanma="${f.id}">
        ${gorunum.devletRenkKutusu(ozet.oyuncu.indeks)}<span><b>${kacis(f.ad)}</b> · ${gemiMetni(f.kadirga, f.kalyon)}<small>${kacis(bolgeAdi(f.bolge))}${f.rota.length ? ` → ${kacis(bolgeAdi(f.rota[f.rota.length - 1]))}` : ""}${f.yuk ? ` · gemide ${kacis(f.yuk.ad)}` : ""}</small></span></button></li>`).join("")
      || '<li class="bos">Donanmanız yok. Liman şehrinizde gemi yapabilirsiniz.</li>';
    const f = ozet.donanmalar.find((x) => x.id === seciliDonanma);
    $("donanmaPaneli").hidden = !f;
    if (!f) return;
    const kontrol = (b: number) => { const k = ozet.denizBolgeleri[b].kontrol; return k === null ? "" : ` (${k === ozet.oyuncu.indeks ? "sizde" : h.paket.devletler[k].ad})`; };
    const limanlar = ozet.limanlar.flatMap((b, i) => (b >= 0 ? [i] : []));
    $("donanmaPaneli").innerHTML = `<b>${kacis(f.ad)}</b>
      <span>${gemiMetni(f.kadirga, f.kalyon)} · moral ${Math.round(f.moral / 10)} · taşıma ${f.kapasite.toLocaleString("tr-TR")} asker</span>
      <span>Konum: ${kacis(bolgeAdi(f.bolge))}${kontrol(f.bolge)}${f.rota.length ? ` · yolda: ${f.rota.map((b) => kacis(bolgeAdi(b))).join(" → ")} (${f.kalanGun + (f.rota.length - 1) * (f.kalyon ? DENGE.GEMI.kalyon.hizGun : DENGE.GEMI.kadirga.hizGun)} gün)` : ""}</span>
      ${f.yuk ? `<span>Gemide: ${kacis(f.yuk.ad)} (${f.yuk.asker.toLocaleString("tr-TR")} asker) → ${f.cikarmaHedef !== null ? kacis(senaryo.sehirler[f.cikarmaHedef].ad) : "hedef yok"}</span>` : ""}
      ${f.emirBekliyor ? '<span class="not">Emir bekliyor; bir sonraki tur uygulanır.</span>' : `
      <label>Yelken aç: <select id="donanmaBolge">${ozet.denizBolgeleri.map((b, i) => i === f.bolge ? "" : `<option value="${i}">${kacis(b.ad)}${kontrol(i)}</option>`).join("")}</select></label>
      <button id="donanmaYelken">Yelken aç</button>
      ${f.yuk ? "" : f.binebilir.length ? `<label>Çıkarma: <select id="cikarmaOrdu">${f.binebilir.map((o) => `<option value="${o.id}">${kacis(o.ad)} (${o.asker.toLocaleString("tr-TR")})</option>`).join("")}</select>
        → <select id="cikarmaSehir">${limanlar.map((i) => `<option value="${i}">${kacis(senaryo.sehirler[i].ad)} (${kacis(bolgeAdi(ozet.limanlar[i]))})</option>`).join("")}</select></label>
        <button id="cikarmaBtn">Çıkarma yap</button>` : '<span class="not">Çıkarma için bir ordunuzu bu denizdeki kendi limanınıza götürün.</span>'}`}`;
  };
  const donanmaSec = (id: number | null) => { seciliDonanma = id; if (id !== null) sekmeAc("deniz"); donanmaArayuzu(); };
  // Sol panel sekmeleri (DEC-0052); son açılan sekme tarayıcıda hatırlanır
  const sekmeAc = (ad: string) => {
    document.querySelectorAll<HTMLElement>("#sekmeler [data-sekme]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.sekme === ad)));
    document.querySelectorAll<HTMLElement>("#sekmeIcerik > section").forEach((s) => { s.hidden = s.dataset.sekme !== ad; });
    try { localStorage.setItem("tarihi-sol-sekme", ad); } catch { /* depolama kapalı olabilir */ }
  };
  $("sekmeler").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-sekme]");
    if (b) sekmeAc(b.dataset.sekme!);
  });
  sekmeAc((() => { try { return localStorage.getItem("tarihi-sol-sekme") ?? "devlet"; } catch { return "devlet"; } })());
  const devletBasligi = () => {
    const i = ozet.oyuncu.indeks, hk = ozet.hukumdar;
    $("devletArmasi").innerHTML = armaSvg(gorunum.devletRengiHex(i), ozet.din, ozet.oyuncu.ad);
    $("devletAdi").textContent = ozet.oyuncu.ad;
    $("devletAlt").textContent = `${hk ? `${hk.ad} · ${hk.yas} yaşında` : "Taht boş"} · ${dinAdi(ozet.din)}`;
    const n = ozet.savaslar.length + ozet.barisTeklifleri.filter((t) => t.cevap === null).length;
    $("savasRozet").hidden = n === 0;
    $("savasRozet").textContent = String(n);
  };
  const arayuzuGuncelle = () => {
    if (seciliOrdu !== null && !ozet.ordular.some((o) => o.id === seciliOrdu)) seciliOrdu = null;
    $("oyuncu").innerHTML = `${gorunum.devletRenkKutusu(ozet.oyuncu.indeks)}<span>${kacis(ozet.oyuncu.ad)}</span>`;
    $("hazine").textContent = ozet.oyuncu.hazine.toLocaleString("tr-TR");
    $("hazine").classList.toggle("eksi", ozet.oyuncu.hazine < 0);
    $("tarih").textContent = ozet.tarih;
    $("turNo").textContent = `Tur ${ozet.turNo}`;
    for (const b of document.querySelectorAll<HTMLButtonElement>("[data-sure]")) {
      b.classList.toggle("etkin", b.dataset.sure === ozet.turSuresi);
    }
    $("ilerleBtn").innerHTML = `Turu ilerlet <small>${kacis(ozet.turSuresiAdi)}</small>`;
    $("bekleyen").textContent = ozet.bekleyenEmir
      ? `${ozet.bekleyenEmir} emir bir sonraki turda uygulanacak.` : "Bekleyen emir yok.";
    $("planli").innerHTML = ozet.planliKesinti.map((k) => `<li>${kacis(k.tarih)} — ${kacis(k.neden)}</li>`).join("");
    $("gunluk").innerHTML = [...ozet.gunluk].reverse().slice(0, 12).map((o) =>
      `<li data-tur="${kacis(o.tur)}"><time>${kacis(tarihMetni(o.gun))}</time>${kacis(o.metin)}</li>`).join("")
      || "<li class=\"bos\">Henüz olay yok.</li>";
    $("ozetHash").textContent = ozet.hash;
    gorunum.mulkiyetGoster(ozet.birimSahipleri, ozet.sehirDurumlari);
    gorunum.oyuncuyuAyarla(ozet.oyuncu.indeks);
    const plan = new Map<number, [number, number][]>();
    for (const [id, r] of planli) if (r.noktalar) plan.set(id, r.noktalar);
    gorunum.ordulariGoster(ozet.ordular, ozet.yabanciOrdular, seciliOrdu, plan);
    gorunum.isgalGoster(ozet.birimIsgal, ozet.sehirIsgal);
    donanmaArayuzu();
    ordularPaneli();
    toplamaPaneli();
    $("orduGideri").textContent = `Aylık toplam maaş: ${ozet.aylikMaas.toLocaleString("tr-TR")}. Kullanılabilir hazine: ${ozet.kullanilabilirHazine.toLocaleString("tr-TR")}.`
      + (ozet.oyuncu.hazine < 0 ? ` Maaş aksıyor: her gün ${DENGE.MAAS_AKSAMASI_MORAL / 10} puan moral kaybı; toparlanma yok. Borç/faiz yoktur.` : " Maaş her ayın ilk günü zorunlu gider olarak alınır.");
    const butce = ozet.butce;
    const para = (n: number) => n.toLocaleString("tr-TR");
    $("butceKalemleri").innerHTML = `<dt>Hazine</dt><dd>${para(butce.hazine)}</dd>
      <dt>Emirlere ayrılan</dt><dd>${para(butce.ayrilan)}</dd><dt>Kullanılabilir</dt><dd>${para(butce.kullanilabilir)}</dd>
      <dt>Aylık gelir (prototip)</dt><dd>+${para(butce.aylikGelir)}<small class="not"> · arazi ${para(butce.aylikAraziGeliri)} (${para(butce.araziSayisi)} arazi) + yapılar ${para(butce.aylikYapiGeliri)} + ticaret ${para(butce.aylikTicaretGeliri)}</small></dd>
      <dt>Aylık ordu maaşı</dt><dd>−${para(butce.aylikMaas)}<small class="not"> · ${para(butce.askerSayisi)} asker</small></dd>
      <dt>Aylık fark</dt><dd id="butceNet" class="${butce.aylikNet < 0 ? "eksi" : "artı"}">${butce.aylikNet > 0 ? "+" : ""}${para(butce.aylikNet)}</dd>`;
    $("savasListesi").innerHTML = ozet.savaslar.map((s) =>
      `<li>${gorunum.devletRenkKutusu(s.karsi)}<span>${kacis(h.paket.devletler[s.karsi].ad)}<small>${s.saldiran ? "Siz ilan ettiniz" : "Size ilan etti"} · ${kacis(s.baslangic)}<br />Savaş skoru: ${s.skor}</small>${(() => {
        const t = ozet.barisTeklifleri.find((x) => x.devlet === s.karsi);
        return t ? `<button data-teklif="${t.id}">${t.cevap === null ? "Gelen teklifi cevapla" : "Cevabınız bekliyor"}</button>` : "";
      })()}<button data-baris="${s.id}">Barış teklif et</button></span></li>`).join("")
      + [...bekleyenSavas].map((d) => `<li>${gorunum.devletRenkKutusu(d)}<span>${kacis(h.paket.devletler[d].ad)}<small>İlan edildi · bir sonraki turda başlar</small></span></li>`).join("")
      || '<li class="bos">Savaş yok. Bir devleti seçip savaş ilan edebilirsiniz.</li>';
    savasUI.guncelle();
    const yatirimSecim = $<HTMLSelectElement>("yatirimSehir"), oncekiSehir = yatirimSecim.value;
    yatirimSecim.innerHTML = ozet.sehirYatirimlari.map((s) => `<option value="${s.indeks}">${kacis(s.ad)}${s.insaat ? " · inşaat var" : ""}</option>`).join("");
    if (ozet.sehirYatirimlari.some((s) => String(s.indeks) === oncekiSehir)) yatirimSecim.value = oncekiSehir;
    const insaatlar = ozet.sehirYatirimlari.filter((s) => s.insaat);
    $("insaatListesi").innerHTML = insaatlar.map((s) => `<li><button class="bag" data-sehir-sec="${s.indeks}">${kacis(s.ad)}</button>: ${kacis(s.insaat!.ad)} ${s.insaat!.hedef}. seviye · ${s.insaat!.emir ? "emir bekliyor" : s.insaat!.durdu ? "kuşatma/ayaklanma nedeniyle durdu" : `${s.insaat!.kalanGun} gün kaldı`}</li>`).join("")
      || '<li class="bos">Süren inşaat yok. Bir şehir seçip “Şehri aç”a basın ya da haritada şehrinize tıklayın.</li>';
    $("insaatListesi").insertAdjacentHTML("beforeend", ozet.gemiInsalari.map((g) => `<li>Tersane: ${kacis(senaryo.sehirler[g.sehir].ad)} · ${g.adet} ${DENGE.GEMI[g.gemi as "kadirga" | "kalyon"].ad.toLowerCase()} · ${g.emir ? "emir bekliyor" : `${g.kalanGun} gün kaldı`}</li>`).join(""));
    $("insaatListesi").insertAdjacentHTML("beforeend", ozet.iskanlar.map((k) => `<li>İskân: ${kacis(senaryo.sehirler[k.kaynak].ad)} → ${kacis(senaryo.sehirler[k.hedef].ad)} · ${k.miktar.toLocaleString("tr-TR")} kişi · ${k.emir ? "emir bekliyor" : `${k.kalanGun} gün kaldı`}</li>`).join(""));
    const suren = ozet.teknoloji.kartlar.filter((t) => t.durum === "suruyor" || t.durum === "emir");
    $("arastirmaListesi").innerHTML = suren.map((t) => `<li>${kacis(t.ad)} · ${t.durum === "emir" ? "emir bekliyor" : `${t.kalanGun} gün kaldı`}</li>`).join("")
      || '<li class="bos">Süren araştırma yok. Üst çubuktaki “Teknoloji” düğmesinden başlatın.</li>';
    if (!$("teknoloji").hidden) teknolojiCiz();
    diplomasiHaritasi();
    hukumdarKarti();
    devletBasligi();
    const yy = ozet.yerelYonetim, acikSehir = ozet.sehirYatirimlari.filter((x) => x.yonetici);
    if (document.activeElement?.id !== "yonetimButce") $<HTMLInputElement>("yonetimButce").value = String(yy.butce);
    if (document.activeElement?.id !== "yonetimAlt") $<HTMLInputElement>("yonetimAlt").value = String(yy.altSinir);
    $("yonetimBilgi").textContent = `Bu ay harcanan: ${yy.harcanan.toLocaleString("tr-TR")} / ${yy.butce.toLocaleString("tr-TR")}. `
      + (acikSehir.length ? `Yönetici açık: ${acikSehir.map((x) => x.ad).join(", ")}.` : "Hiçbir şehirde yönetici açık değil; şehir panelinden açabilirsiniz.")
      + " Yönetici yalnızca bağış ve tarla/pazar yapar; her harcama günlüğe yazılır, borç yapmaz.";
    if (!ozet.verasetSecimi) secilenAday = null;
    if (!$("verasetPencere").hidden) verasetCiz();
    $("casusListesi").innerHTML = ozet.casusGorevleri.map((g) => `<li>🕵 ${kacis(g.ad)} → ${kacis(h.paket.devletler[g.hedef].ad)}${g.sehir !== null ? ` (${kacis(senaryo.sehirler[g.sehir].ad)})` : ""} · ${g.emir ? "emir bekliyor" : `${g.kalanGun} gün`}</li>`).join("")
      + ozet.istihbarat.map((x) => `<li>👁 ${x.tur === "askeri" ? "Askerî" : "Diplomatik"} istihbarat: ${kacis(h.paket.devletler[x.hedef].ad)} · ${x.kalanGun} gün</li>`).join("")
      || '<li class="bos">Görev yok. Bir devlete tıklayıp panelindeki Casusluk bölümünden başlatın.</li>';
    $("raporListesi").innerHTML = [...ozet.raporlar].reverse().map((r) => {
      const biz = r.kazanan === ozet.oyuncu.indeks;
      const karsi = r.taraflar.find((t) => t.devlet !== ozet.oyuncu.indeks)!;
      return `<li><button class="rapor-satir" data-rapor="${r.id}"><b class="${biz ? "zafer" : "yenilgi"}">${biz ? "Zafer" : "Yenilgi"}</b>
        ${kacis(h.paket.devletler[karsi.devlet].ad)}<small>${kacis(birimAdi(r.birim))} · ${kacis(tarihMetni(r.bitis))}</small></button></li>`;
    }).join("") || '<li class="bos">Henüz muharebe yok.</li>';
  };
  const teknolojiCiz = () => {
    const tk = ozet.teknoloji, para = (n: number) => n.toLocaleString("tr-TR");
    $("teknolojiBilgi").textContent = `Aynı anda en çok ${tk.yuva} araştırma yürür ve her biri farklı alanda olmalı. Bedel başta ödenir; borçlanma yoktur. Kullanılabilir hazine: ${para(ozet.kullanilabilirHazine)}. Değerler denge taslağıdır.`;
    const durumMetni = (t: typeof tk.kartlar[number]) => ({
      biliniyor: "✓ Biliniyor", suruyor: `Araştırılıyor · ${t.kalanGun} gün kaldı`, emir: "Emir bekliyor · bir sonraki tur başlar",
      acik: "", kapali: t.neden ?? "",
    })[t.durum];
    const alanlar = [...new Map(tk.kartlar.map((t) => [t.alan, t.alanAdi])).entries()];
    $("teknolojiIcerik").innerHTML = alanlar.map(([alan, ad]) => `<section><h4>${kacis(ad)}</h4>${tk.kartlar.filter((t) => t.alan === alan).map((t) =>
      `<div class="tek-kart ${t.durum}"><b>${kacis(t.ad)}</b><p>${kacis(t.etki)}</p>
        <small>Bedel ${para(t.bedel)} · ${t.sure} gün${t.onKosul.length ? ` · Ön koşul: ${kacis(t.onKosul.join(", "))}` : ""}</small>
        ${t.durum === "acik" || t.durum === "kapali" ? `${t.durum === "kapali" ? `<p class="durum">${kacis(durumMetni(t))}</p>` : ""}<button data-arastir="${t.id}"${t.uygun && !mesgul ? "" : " disabled"}>Araştır</button>`
          : `<p class="durum">${kacis(durumMetni(t))}</p>`}</div>`).join("")}</section>`).join("");
  };
  const birimAdi = (b: number) => (b >= 0 ? h.paket.birimler[b].ad : "bilinmeyen yer");
  const emirGonder = async (emir: Emir, mesaj: string) => {
    if (mesgul) return false;
    try {
      const y = await sim.gonder({ tip: "emir", emir });
      ozet = y.ozet;
      arayuzuGuncelle();
      if (y.dogrulama && !y.dogrulama.gecerli) { bildir(y.dogrulama.neden, "uyari"); return false; }
      bildir(mesaj);
      return true;
    } catch (e) { bildir((e as Error).message, "hata"); return false; }
  };
  const savasUI = savasArayuzuKur({
    ozet: () => ozet, seciliOrdu: () => seciliOrdu,
    sehirAdi: (i) => senaryo.sehirler[i].ad, birimAdi,
    devletAdi: (i) => h.paket.devletler[i].ad, emir: emirGonder,
    onizle: async (talep) => (await sim.gonder({ tip: "barisOnizle", talep })).baris!,
    onay: onayIste, bildir: (m) => bildir(m, "uyari"),
  });
  const toplamaPaneli = () => {
    const secim = $<HTMLSelectElement>("toplamaSehir");
    const once = secim.value;
    secim.innerHTML = ozet.askerSehirleri.map((s) => `<option value="${s.indeks}">${kacis(s.ad)}${s.uygun ? "" : " · toplama yapılamaz"}</option>`).join("");
    if (ozet.askerSehirleri.some((s) => String(s.indeks) === once)) secim.value = once;
    $("toplamaListesi").innerHTML = ozet.toplamalar.map((t) => `<li>${kacis(t.sehir)} · ${t.asker.toLocaleString("tr-TR")} asker · ${t.emir ? "Emir bekliyor" : t.bekliyor ? "Şehirde işler durduğu için bekliyor" : `${t.kalanGun} gün kaldı`}</li>`).join("");
    toplamaBilgisi();
  };
  const toplamaBilgisi = () => {
    const sehir = ozet.askerSehirleri.find((s) => s.indeks === Number($<HTMLSelectElement>("toplamaSehir").value));
    const asker = $<HTMLInputElement>("toplamaAsker").valueAsNumber;
    const sayiUygun = Number.isSafeInteger(asker) && asker > 0;
    const bedel = sayiUygun ? toplamaMaliyeti(asker, ozet.toplamaKurali.bedelYuzde) : 0;
    $("toplamaBilgi").textContent = sehir
      ? `Kullanılabilir insan gücü: ${sehir.insanGucu.toLocaleString("tr-TR")}. ${ozet.toplamaKurali.gun} gün; bedel: ${bedel.toLocaleString("tr-TR")}.`
        + (!sehir.uygun ? (sehir.ayaklanma ? " Ayaklanmada asker toplanamaz." : " Şehir ve çevresi kontrolünüzde olmalı.") : !sayiUygun ? " Pozitif tam sayı girin." : asker > sehir.insanGucu ? " İnsan gücü yetersiz." : ozet.kullanilabilirHazine < bedel ? " Hazine yetersiz; borçlanma yoktur." : " Yeni ordu şehirde kurulur.")
      : "Asker toplanabilecek şehriniz yok.";
    $<HTMLButtonElement>("toplaBtn").disabled = mesgul || !sehir?.uygun || !sayiUygun || asker > sehir.insanGucu || ozet.kullanilabilirHazine < bedel;
  };
  $("toplamaSehir").onchange = toplamaBilgisi;
  $("toplamaAsker").oninput = toplamaBilgisi;
  $("toplaBtn").onclick = () => emirGonder({ tur: "askerTopla", sehir: Number($<HTMLSelectElement>("toplamaSehir").value),
    asker: $<HTMLInputElement>("toplamaAsker").valueAsNumber }, "Asker toplama emri verildi; bir sonraki turda başlar.");
  const yuzde = (binde: number) => `%${Math.round(binde / 10)}`;
  const raporGoster = (r: MuharebeRaporu) => {
    const satir = (t: MuharebeRaporu["taraflar"][number]) => `<tr>
      <td>${gorunum.devletRenkKutusu(t.devlet)} ${kacis(h.paket.devletler[t.devlet].ad)}<small>${t.ordular.map(kacis).join(", ")}</small></td>
      <td>${t.baslangicAsker.toLocaleString("tr-TR")}</td><td>−${t.kayip.toLocaleString("tr-TR")}</td>
      <td>${yuzde(t.moralBas)} → ${yuzde(t.moralSon)}</td>
      <td>${{ zafer: "Zafer", "geri-cekildi": "Geri çekildi", dagildi: "Dağıldı" }[t.sonuc]}</td></tr>`;
    $("raporIcerik").innerHTML = `<h3>${kacis(birimAdi(r.birim))} Muharebesi</h3>
      <div class="not">${kacis(tarihMetni(r.baslangic))} – ${kacis(tarihMetni(r.bitis))} · Kazanan: <b>${kacis(h.paket.devletler[r.kazanan].ad)}</b></div>
      <table><thead><tr><th>Taraf</th><th>Asker</th><th>Kayıp</th><th>Moral</th><th>Sonuç</th></tr></thead>
      <tbody>${r.taraflar.map(satir).join("")}</tbody></table>
      <h4>Sonucun nedenleri</h4><ul>${r.nedenler.map((n) => `<li>${kacis(n)}</li>`).join("")}</ul>`;
    $("rapor").hidden = false;
  };
  $("raporKapat").onclick = () => { $("rapor").hidden = true; };
  $("haritaModlari").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-harita-modu]");
    if (!b) return;
    const m = b.dataset.haritaModu as typeof haritaModu;
    haritaModu = haritaModu === m ? "siyasi" : m;
    document.querySelectorAll("[data-harita-modu]").forEach((x) => x.setAttribute("aria-pressed", String((x as HTMLElement).dataset.haritaModu === haritaModu)));
    $("diplomasiLejant").hidden = haritaModu !== "diplomasi";
    diplomasiHaritasi();
  });
  $("teknolojiAc").onclick = () => { teknolojiCiz(); $("teknoloji").hidden = false; };
  $("teknolojiKapat").onclick = () => { $("teknoloji").hidden = true; };
  $("teknolojiIcerik").addEventListener("click", async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-arastir]");
    const t = b && ozet.teknoloji.kartlar.find((x) => x.id === b.dataset.arastir);
    if (!t || b.disabled) return;
    if (!await onayIste("Araştırma", `${t.ad} araştırılsın mı? Bedel (${t.bedel.toLocaleString("tr-TR")}) emir verilince ayrılır, tur başında hazineden düşülür. Süre ${t.sure} gün.`, "Araştır")) return;
    await emirGonder({ tur: "arastir", teknoloji: t.id }, `${t.ad} araştırması emri verildi; bir sonraki tur başlar.`);
  });
  $("yatirimAc").onclick = () => {
    const v = $<HTMLSelectElement>("yatirimSehir").value;
    if (v !== "") gorunum.secVeGit({ tur: "sehir", id: Number(v) });
  };
  $("insaatListesi").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-sehir-sec]");
    if (b) gorunum.secVeGit({ tur: "sehir", id: Number(b.dataset.sehirSec) });
  });
  $("raporListesi").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-rapor]");
    const r = b && ozet.raporlar.find((x) => x.id === Number(b.dataset.rapor));
    if (r) raporGoster(r);
  });

  // Bilgi paneli: yabancı devlet seçiliyken savaş durumu / savaş ilanı (MASTER_SPEC §7.1)
  gorunum.olaylar.ekBilgi = (s) => {
    if (s.tur === "sehir") {
      const c = ozet.sehirDurumlari[s.id], k = ozet.kusatmalar.find((v) => v.sehir === s.id);
      const y = ozet.sehirYatirimlari.find((v) => v.indeks === s.id);
      const yonetici = !y ? "" : `<div class="satir eylem"><button data-eylem="yonetici" data-sehir="${s.id}" data-acik="${y.yonetici ? 0 : 1}">Yerel yönetici: ${y.yonetici ? "Açık — kapat" : "Kapalı — aç"}</button></div>
        <p class="not">${y.yonetici ? `Ayda bir, sol paneldeki bütçe tavanı içinde riskliyse bağış, değilse tarla/pazar yapar. Sizin emirleriniz önce gelir.${ozet.yerelYonetim.butce ? "" : " Bütçe tavanı 0 olduğu için şu an harcama yapmaz."}` : "Açarsanız bu şehrin bağış ve tarla/pazar kararlarını bütçe tavanı içinde yönetici verir."}</p>`;
      const yatirim = !y ? "" : `${yonetici}<h4>Şehir yatırımları (prototip değerleri)</h4>
        <p class="not">Yapıların aylık geliri: +${y.aylikGelir.toLocaleString("tr-TR")}${y.insaat ? ` · ${kacis(y.insaat.ad)} ${y.insaat.hedef}. seviye ${y.insaat.emir ? "emri bekliyor" : y.insaat.durdu ? "kuşatma/ayaklanma nedeniyle durdu" : `yapılıyor (${y.insaat.kalanGun} gün kaldı)`}` : ""}</p>
        <ul class="yatirimlar">${y.secenekler.map((o) => `<li><span><b>${kacis(o.ad)}</b> ${o.seviye}/${o.enYuksek}
          <small>${o.maliyet === null ? "En yüksek seviye" : `${o.seviye + 1}. seviye: ${o.maliyet.toLocaleString("tr-TR")} · ${o.sure} gün · ${o.yapi === "sur" ? "kuşatma direnci artar" : `aylık +${o.gelirArtisi}`}`}</small></span>
          ${o.maliyet === null ? "" : `<button data-insaat="${s.id}:${o.yapi}" ${o.uygun ? "" : `disabled title="${kacis(o.neden ?? "")}"`}>Geliştir</button>`}</li>`).join("")}</ul>
        ${y.secenekler.every((o) => !o.uygun) && y.secenekler[0].neden ? `<p class="not">${kacis(y.secenekler.find((o) => o.maliyet !== null)?.neden ?? "")}</p>` : ""}`;
      const n = ozet.sehirNufuslari[s.id], para = (x: number) => x.toLocaleString("tr-TR");
      const nufus = !n ? "" : `<h4>Nüfus (tahmini)</h4><p class="not">${para(n.nufus)} kişi</p>
        <div class="nufus-cubuk">${n.gruplar.map(([dn, , x]) => `<span style="flex:${x};background:${DIN_RENK[dn] ?? "#cfc6b0"}" title="${kacis(dinAdi(dn))}"></span>`).join("")}</div>
        <ul class="nufus-liste">${n.gruplar.slice(0, 6).map(([dn, kl, x]) => `<li><span><span class="renk" style="background:${DIN_RENK[dn] ?? "#cfc6b0"}"></span>${kacis(dinAdi(dn))} · ${kacis(kulturAdi(kl))}</span><span>%${Math.round((x * 100) / Math.max(1, n.nufus))}</span></li>`).join("")}</ul>`;
      const hedefler = ozet.sehirYatirimlari.filter((x) => x.indeks !== s.id);
      const iskan = !y || !hedefler.length ? "" : `<h4>İskân</h4><div class="iskan-satir">
          <input id="iskanMiktar" type="number" min="1" step="100" value="${Math.max(1, Math.floor(n.nufus * 0.1))}" aria-label="Taşınacak kişi" />
          <span>kişi →</span><select id="iskanHedef" aria-label="Hedef şehir">${hedefler.map((x) => `<option value="${x.indeks}">${kacis(x.ad)}</option>`).join("")}</select>
          <button data-eylem="iskan" data-sehir="${s.id}">Taşı</button></div>
        <p class="not">Bedel: 1.000 kişi için ${DENGE.ISKAN_BEDEL_BINDE}; ${DENGE.ISKAN_GUN} gün sürer; en çok nüfusun %${DENGE.ISKAN_EN_COK_YUZDE}'si. Gruplar oranıyla taşınır.</p>`;
      const st = ozet.istikrar[s.id], durum = st.ayaklanma ? "Ayaklanma" : st.risk >= DENGE.IST_HUZURSUZLUK ? "Huzursuzluk" : "Sakin";
      const imzali = (n: number) => `${n > 0 ? "+" : ""}${n}`;
      const istikrar = `<section id="istikrarBilgi"><h4>İstikrar · ${durum}</h4><p>İsyan riski: <b>%${st.risk}</b> · Önceki ay %${st.oncekiRisk}</p>
        <p class="not">${st.hesapGun === null ? "İlk ay başında hesaplanacak." : `Son hesap: ${tarihMetni(st.hesapGun)}. Risk 0–100 arasında tutulur.`}</p>
        <ul class="not">${st.bilesenler.filter((x) => x.puan !== 0).map((x) => `<li>${kacis(x.ad)}: ${imzali(x.puan)}</li>`).join("") || "<li>Etkin risk bileşeni yok.</li>"}</ul>
        <p class="not">Geçen aya göre: ${st.degisim.length ? st.degisim.map((x) => `${kacis(x.ad)} ${imzali(x.puan)}`).join("; ") : "bileşenler değişmedi"}. İndirimler ve 0–100 sınırı toplam farkı etkileyebilir.</p>
        <p class="not">${st.ayaklanma ? `Gelir ve asker toplama yok; inşaat bekliyor. ${DENGE.IST_BASTIRMA_AY} ay yeterli ordu veya riskin %${DENGE.IST_HUZURSUZLUK} altına düşmesiyle biter.` : st.risk >= DENGE.IST_HUZURSUZLUK ? `Şehir ve çevresi yarım gelir verir. %${DENGE.IST_AYAKLANMA} ve üzeri: ${st.yuksekAy}/${DENGE.IST_AYAKLANMA_AY} ay.` : "Şehir ve çevresinin gelirinde risk cezası yok."}</p>
        ${c.devlet === ozet.oyuncu.indeks ? `<p class="not">Asayiş: ${st.asayis}/${st.gerekenAsker} asker. Yardım indirimi kalan: ${st.bagis} puan.</p>
        <button data-bagis="${s.id}" ${st.bagisUygun ? "" : "disabled"}>Bağış / imar yardımı (${DENGE.IST_BAGIS_BEDEL})</button>
        <p class="not">${kacis(st.bagisNedeni ?? `Sonraki aylık hesapta −${DENGE.IST_BAGIS_INDIRIM} puan; ayda ${DENGE.IST_BAGIS_SONUM} puan söner. Borçlanma yoktur.`)}</p>` : ""}</section>`;
      const tic = ozet.ticaret[s.id];
      const ticaret = !tic ? "" : `<h4>Ticaret</h4><p class="not">Aylık ticaret geliri: <b>${tic.gelir}</b> (taban ${tic.taban}, %${tic.yuzde}).${tic.nedenler.length ? `<br />${tic.nedenler.map(kacis).join("<br />")}` : " Ticaret yolları açık."}</p>`;
      const tersane = !y || (ozet.limanlar[s.id] ?? -1) < 0 ? "" : `<h4>Tersane (${kacis(bolgeAdi(ozet.limanlar[s.id]))})</h4><div class="iskan-satir">
          <select id="gemiTuru" aria-label="Gemi türü">${(["kadirga", "kalyon"] as const).map((t) => {
            const kapali = t === "kalyon" && ozet.teknoloji.kartlar.find((k) => k.id === "kalyon")?.durum !== "biliniyor";
            return `<option value="${t}"${kapali ? " disabled" : ""}>${DENGE.GEMI[t].ad} — ${DENGE.GEMI[t].bedel}, ${DENGE.GEMI[t].sure} gün${kapali ? " (Kalyon İnşası gerekli)" : ""}</option>`;
          }).join("")}</select>
          <input id="gemiAdet" type="number" min="1" max="${DENGE.GEMI_INSA_EN_COK}" value="5" aria-label="Adet" />
          <button data-eylem="gemi" data-sehir="${s.id}">Gemi yap</button></div>
        <p class="not">Kadırga: güç ${DENGE.GEMI.kadirga.guc}, ${DENGE.GEMI.kadirga.kapasite} asker taşır, bölgeyi ${DENGE.GEMI.kadirga.hizGun} günde geçer. Kalyon: güç ${DENGE.GEMI.kalyon.guc}, ${DENGE.GEMI.kalyon.kapasite} asker, ${DENGE.GEMI.kalyon.hizGun} gün. Aylık bakım ${DENGE.GEMI.kadirga.bakim} / ${DENGE.GEMI.kalyon.bakim}.</p>`;
      return `${istikrar}${nufus}${iskan}${ticaret}${tersane}<h4>Şehir savunması (prototip değerleri)</h4><dl><dt>Sur seviyesi</dt><dd>${c.sur}</dd>
        <dt>Garnizon</dt><dd>${c.garnizonTahmin ? "Yaklaşık " : ""}${c.garnizon.toLocaleString("tr-TR")}</dd></dl>
        <p class="not">${k ? `${k.gun} etkin gündür kuşatma altında.` : c.kontrol === ozet.oyuncu.indeks
          ? c.devlet === ozet.oyuncu.indeks ? "Şehir size ait ve askerî kontrolünüzde." : "Şehir askerî kontrolünüzde; yasal sahiplik barış antlaşmasıyla değişir."
          : "Şehir hareketle ele geçirilmez; kuşatma emri gerekir."}</p>
        ${seciliOrdu !== null ? `<button data-sehir-hedef="${s.id}">Şehre yürü</button>` : '<p class="not">Şehre yürümek için önce ordunuzu seçin.</p>'}
        ${yatirim}`;
    }
    if (s.tur === "birim") {
      const p = ozet.isgalHazirliklari.find((v) => v.birim === s.id);
      return p ? `<p class="not">Askerî kontrol kuruluyor: ${p.gun}/${DENGE.ISGAL_GUN} gün. Şehir ayrı kuşatılır.</p>` : "";
    }
    if (s.tur !== "devlet" || s.id === ozet.oyuncu.indeks) return "";
    const dip = diplomasiBolumu(s.id);
    const savas = ozet.savaslar.find((x) => x.karsi === s.id);
    if (savas) return `<p class="savas-durumu">⚔ Savaştasınız (${kacis(savas.baslangic)}) · Skor ${savas.skor}</p><button data-eylem="baris" data-savas="${savas.id}">Barış teklif et</button>${dip}`;
    if (bekleyenSavas.has(s.id)) return `<p class="savas-durumu">Savaş ilan edildi; bir sonraki turda başlar.</p>${dip}`;
    const k = ozet.diplomasi[s.id];
    const amb = ozet.ambargolarim.includes(s.id);
    const ambargo = `<button data-eylem="ambargo" data-devlet="${s.id}" data-acik="${amb ? 0 : 1}"${!amb && k?.muttefik ? " disabled" : ""}>${amb ? "Ambargoyu kaldır" : "Ambargo koy"}</button>`;
    return `${dip}<div class="satir eylem">${ambargo}<button class="tehlike" data-eylem="savas" data-devlet="${s.id}"${k?.muttefik ? ' disabled title="Müttefikinize savaş ilan edemezsiniz; önce ittifaktan çıkın."' : ""}>Savaş ilan et</button></div>
      ${ozet.bizeAmbargo.includes(s.id) ? '<p class="not">Bu devlet size ticaret ambargosu uyguluyor.</p>' : ""}`;
  };
  const isaretli = (n: number) => `<span class="${n > 0 ? "arti" : n < 0 ? "eksi" : ""}">${n > 0 ? "+" : ""}${n}</span>`;
  const iliskiAdi = (p: number) => (p >= 50 ? "Dostane" : p >= 15 ? "İyi" : p > -15 ? "Tarafsız" : p > -50 ? "Soğuk" : "Düşmanca");
  /** Devlet panelindeki diplomasi bölümü (TASK-0009/6a) */
  const diplomasiBolumu = (devlet: number) => {
    const k = ozet.diplomasi[devlet];
    if (!k) return "";
    const durum = k.muttefik ? "Savunma ittifakınız var." : k.savasta ? "" : k.komsu ? "Sınır komşunuz." : "";
    const ittifak = k.savasta ? "" : k.muttefik
      ? `<button data-eylem="ittifakBoz" data-devlet="${devlet}"${k.bekleyen ? " disabled" : ""}>${k.bekleyen === "ittifakBoz" ? "Ayrılma emri bekliyor" : "İttifaktan çık"}</button>`
      : `<button data-eylem="ittifak" data-devlet="${devlet}"${k.bekleyen ? " disabled" : ""}>${k.bekleyen === "ittifakTeklif" ? "Teklif bekliyor" : "Savunma ittifakı teklif et"}</button>
        <p class="not">Tahmini cevap: <b class="${k.ittifak.kabul ? "zafer" : "yenilgi"}">${k.ittifak.kabul ? "kabul" : "ret"}</b> — ${kacis(k.ittifak.nedenler.join(" "))}</p>`;
    const hediye = k.savasta ? "" : `<div class="hediye-satir"><input id="hediyeMiktar" type="number" min="1" step="1" value="${k.hediyePuanBedeli * 5}" aria-label="Hediye miktarı" />
        <button data-eylem="hediye" data-devlet="${devlet}"${k.hediyeKalan ? "" : " disabled"}>Hediye gönder</button></div>
      <p class="not">1 ilişki puanı ≈ ${k.hediyePuanBedeli.toLocaleString("tr-TR")} · ${k.hediyeKalan ? `en çok ${k.hediyeKalan} puan daha eklenebilir` : "hediye etkisi dolu"}; zamanla söner.</p>`;
    const dev = h.paket.devletler, rap = ozet.diplomatikRapor[devlet];
    const casusSehirleri = senaryo.sehirler.flatMap((c, i) => (ozet.sehirDurumlari[i].devlet === devlet ? [i] : []));
    const casus = `<h4>Casusluk</h4><div class="casus-satir">
        <select id="casusGorev" aria-label="Görev">${(["askeri", "diplomatik", "isyan", "sabotaj"] as const).map((g) => `<option value="${g}">${DENGE.CASUS[g].ad} — ${DENGE.CASUS[g].bedel}, ${DENGE.CASUS[g].hazirlik} gün, %${DENGE.CASUS[g].basari}</option>`).join("")}</select>
        <select id="casusSehir" aria-label="Hedef şehir (isyan/sabotaj)">${casusSehirleri.map((i) => `<option value="${i}">${kacis(senaryo.sehirler[i].ad)}</option>`).join("")}</select>
        <button data-eylem="casusluk" data-devlet="${devlet}">Görevi başlat</button></div>
      <p class="not">Şehir yalnızca isyanı destekleme ve sabotaj için kullanılır. Başarısız casus yakalanırsa ilişki bozulur (${DENGE.CASUS_YAKALANMA_ILISKI}).</p>
      ${ozet.istihbarat.filter((x) => x.hedef === devlet).map((x) => `<p class="not">🕵 ${x.tur === "askeri" ? "Askerî" : "Diplomatik"} istihbarat: ${x.kalanGun} gün daha.</p>`).join("")}
      ${rap ? `<p class="not"><b>İstihbarat raporu</b><br />Müttefikleri: ${rap.muttefikleri.map((m) => kacis(dev[m].ad)).join(", ") || "yok"} · Savaşları: ${rap.savaslari.map((m) => kacis(dev[m].ad)).join(", ") || "yok"}<br />
        En düşmanca baktıkları: ${rap.enKotu.map(([m, p]) => `${kacis(dev[m].ad)} (${p})`).join(", ")}<br />En dostça: ${rap.enIyi.map(([m, p]) => `${kacis(dev[m].ad)} (${p})`).join(", ")}<br />Hazine ≈ ${rap.hazine.toLocaleString("tr-TR")}</p>` : ""}`;
    const inanc = `<p class="not">Resmî din: ${kacis(dinAdi(ozet.devletDinleri[devlet]))}</p>`;
    const arma = `<div class="arma">${armaSvg(gorunum.devletRengiHex(devlet), ozet.devletDinleri[devlet], h.paket.devletler[devlet].ad)}</div>`;
    const huk = k.hukumdar ? `<h4>Hükümdar</h4><p class="not"><b>${kacis(k.hukumdar.ad)}</b>${kurguRozeti(k.hukumdar)} · ${k.hukumdar.yas} yaşında · ${kacis(k.hukumdar.hanedan)}<br />${yetenekMetni(k.hukumdar)} · meşruiyet ${k.hukumdar.mesruiyet}</p>` : "";
    return `${arma}${huk}${inanc}<h4>Diplomasi</h4><dl><dt>Size bakışı</dt><dd>${isaretli(k.bakisi)} · ${iliskiAdi(k.bakisi)}</dd>
      <dt>Sizin bakışınız</dt><dd>${isaretli(k.bakisimiz)} · ${iliskiAdi(k.bakisimiz)}</dd></dl>
      ${k.bilesenler.length ? `<ul class="iliski-bilesen">${k.bilesenler.map((b) => `<li><span>${kacis(b.ad)}</span>${isaretli(b.deger)}</li>`).join("")}</ul>` : '<p class="not">Aranızda özel bir etken yok.</p>'}
      ${durum ? `<p class="not">${durum}</p>` : ""}${ittifak}${hediye}${casus}`;
  };
  $("bilgi").addEventListener("click", async (e) => {
    const bagis = (e.target as HTMLElement).closest<HTMLElement>("[data-bagis]");
    if (bagis) {
      await emirGonder({ tur: "bagis", sehir: Number(bagis.dataset.bagis) }, "Bağış emri verildi; bedel ayrıldı, indirim sonraki aylık hesapta uygulanacak.");
      return;
    }
    const sehir = (e.target as HTMLElement).closest<HTMLElement>("[data-sehir-hedef]");
    if (sehir) {
      const c = senaryo.sehirler[Number(sehir.dataset.sehirHedef)];
      if (c.x !== undefined && c.y !== undefined) await gorunum.olaylar.hedef?.(c.x / 1e4, c.y / 1e4, c.birim);
      return;
    }
    const insaat = (e.target as HTMLElement).closest<HTMLElement>("[data-insaat]");
    if (insaat) {
      const [sehirNo, yapi] = insaat.dataset.insaat!.split(":");
      await emirGonder({ tur: "insaat", sehir: Number(sehirNo), yapi: yapi as YapiTuru }, "İnşaat emri verildi; bedel ayrıldı, bir sonraki turda başlar.");
      return;
    }
    const baris = (e.target as HTMLElement).closest<HTMLElement>('[data-eylem="baris"]');
    if (baris) { savasUI.barisAc(Number(baris.dataset.savas)); return; }
    const cas = (e.target as HTMLElement).closest<HTMLElement>('[data-eylem="casusluk"]');
    if (cas) {
      const hedef = Number(cas.dataset.devlet), gorev = $<HTMLSelectElement>("casusGorev").value as "askeri" | "diplomatik" | "isyan" | "sabotaj";
      const sehirli = gorev === "isyan" || gorev === "sabotaj", sv = $<HTMLSelectElement>("casusSehir").value;
      const sehir = sehirli && sv !== "" ? Number(sv) : null;
      await emirGonder({ tur: "casusluk", hedef, gorev, sehir }, `${DENGE.CASUS[gorev].ad} görevi emri verildi: ${h.paket.devletler[hedef].ad}${sehir !== null ? ` (${senaryo.sehirler[sehir].ad})` : ""}.`);
      return;
    }
    const amb = (e.target as HTMLElement).closest<HTMLElement>('[data-eylem="ambargo"]');
    if (amb) {
      const hedef = Number(amb.dataset.devlet), acik = amb.dataset.acik === "1", ad = h.paket.devletler[hedef].ad;
      if (acik && !await onayIste("Ambargo", `${ad}'na ticaret ambargosu konsun mu? Onların liman ticareti %${DENGE.AMBARGO_HEDEF_YUZDE}, sizinki %${DENGE.AMBARGO_KOYAN_YUZDE} azalır; size bakışları ${DENGE.AMBARGO_ILISKI} puan bozulur.`, "Ambargo koy", true)) return;
      await emirGonder({ tur: "ambargo", hedef, acik }, acik ? `${ad}'na ambargo emri verildi (bir sonraki tur).` : `${ad} ambargosunun kaldırılması emri verildi.`);
      return;
    }
    const gemi = (e.target as HTMLElement).closest<HTMLElement>('[data-eylem="gemi"]');
    if (gemi) {
      const sehir = Number(gemi.dataset.sehir), tur = $<HTMLSelectElement>("gemiTuru").value as "kadirga" | "kalyon";
      const adet = $<HTMLInputElement>("gemiAdet").valueAsNumber;
      await emirGonder({ tur: "gemiInsa", sehir, gemi: tur, adet }, `${senaryo.sehirler[sehir].ad}: ${adet} ${DENGE.GEMI[tur].ad.toLowerCase()} yapım emri verildi; bedel ayrıldı.`);
      return;
    }
    const yon = (e.target as HTMLElement).closest<HTMLElement>('[data-eylem="yonetici"]');
    if (yon) {
      const acik = yon.dataset.acik === "1", sehir = Number(yon.dataset.sehir);
      const y = await sim.gonder({ tip: "yonetim", sehir, acik });
      ozet = y.ozet; arayuzuGuncelle(); gorunum.istek();
      if (y.dogrulama && !y.dogrulama.gecerli) bildir(y.dogrulama.neden, "uyari");
      else bildir(`${senaryo.sehirler[sehir].ad}: yerel yönetici ${acik ? "açıldı" : "kapatıldı"}.`);
      return;
    }
    const isk = (e.target as HTMLElement).closest<HTMLElement>('[data-eylem="iskan"]');
    if (isk) {
      const kaynak = Number(isk.dataset.sehir), hedef = Number($<HTMLSelectElement>("iskanHedef").value);
      const miktar = $<HTMLInputElement>("iskanMiktar").valueAsNumber;
      await emirGonder({ tur: "iskan", kaynak, hedef, miktar }, `${miktar.toLocaleString("tr-TR")} kişi ${senaryo.sehirler[kaynak].ad} → ${senaryo.sehirler[hedef].ad} iskân emri verildi; bedel ayrıldı.`);
      return;
    }
    const dip = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-eylem="ittifak"], [data-eylem="ittifakBoz"], [data-eylem="hediye"]');
    if (dip) {
      const hedef = Number(dip.dataset.devlet), ad = h.paket.devletler[hedef].ad;
      if (dip.dataset.eylem === "ittifak") {
        await emirGonder({ tur: "ittifakTeklif", hedef }, `${ad}'na ittifak teklifi gönderildi; cevap bir sonraki turun başında gelir.`);
      } else if (dip.dataset.eylem === "ittifakBoz") {
        if (!await onayIste("İttifaktan çık", `${ad} ile savunma ittifakından çıkılsın mı? İlişkiniz ${DENGE.ETKI_ITTIFAK_BOZMA} puan bozulur (zamanla söner).`, "İttifaktan çık", true)) return;
        await emirGonder({ tur: "ittifakBoz", hedef }, `${ad} ile ittifaktan çıkma emri verildi.`);
      } else {
        const miktar = $<HTMLInputElement>("hediyeMiktar").valueAsNumber;
        const k = ozet.diplomasi[hedef]!;
        const puan = Number.isSafeInteger(miktar) ? Math.min(k.hediyeKalan, Math.floor(miktar / k.hediyePuanBedeli)) : 0;
        if (!await onayIste("Hediye", `${ad}'na ${miktar.toLocaleString("tr-TR")} hediye gönderilsin mi? Para bir sonraki tur başında hazinenizden çıkar; ilişki yaklaşık +${puan} olur.`, "Gönder")) return;
        await emirGonder({ tur: "hediye", hedef, miktar }, `${ad}'na hediye emri verildi; bedel ayrıldı.`);
      }
      return;
    }
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-eylem="savas"]');
    if (!b) return;
    const hedef = Number(b.dataset.devlet);
    const mutt = ozet.diplomasi[hedef]?.muttefikleri.filter((m) => m !== ozet.oyuncu.indeks) ?? [];
    const onay = await onayIste("Savaş ilanı", `${h.paket.devletler[hedef].ad}'na savaş ilan edilsin mi? Savaş bir sonraki turun başında başlar; ordularınız o devletin topraklarına girebilir.`
      + (mutt.length ? ` Müttefikleri (${mutt.map((m) => h.paket.devletler[m].ad).join(", ")}) savaşa katılabilir.` : "")
      + ` Saldırganlığınız ${DENGE.SALDIRGANLIK_ILAN} artar; bütün devletler, özellikle komşularınız size daha soğuk bakar.`, "Savaş ilan et", true);
    if (!onay) return;
    const y = await sim.gonder({ tip: "emir", emir: { tur: "savasIlan", devlet: ozet.oyuncu.indeks, hedef } });
    ozet = y.ozet;
    if (y.dogrulama && !y.dogrulama.gecerli) return bildir(y.dogrulama.neden, "uyari");
    bekleyenSavas.add(hedef);
    arayuzuGuncelle();
    gorunum.istek();
    bildir(`${h.paket.devletler[hedef].ad}'na savaş ilan edildi; bir sonraki turda başlar.`, "uyari");
  });

  const kirilimMetni = (r: RotaOnizleme) => {
    const k = r.kirilim!;
    const km = (m: number) => `${Math.round(m / 1000).toLocaleString("tr-TR")} km`;
    return `${km(k.mesafeM)} yol · arazi +${km(k.araziM)}${k.nehir ? ` · ${k.nehir} nehir geçişi` : ""}${k.bogaz ? ` · ${k.bogaz} boğaz geçişi` : ""}`;
  };
  const ordularPaneli = () => {
    $("orduListesi").innerHTML = ozet.ordular.map((o) => {
      const p = planli.get(o.id);
      const durum = p ? `Emir verildi · varış ${kacis(p.varisTarihi!)} (${p.gun} gün)`
        : o.kusatma !== null ? `${kacis(senaryo.sehirler[o.kusatma].ad)} kuşatılıyor` : o.yuruyor ? `Yürüyor · varış ${kacis(o.varisTarihi!)} (${o.kalanGun} gün)` : "Bekliyor";
      return `<li><button class="ordu-satir${o.id === seciliOrdu ? " etkin" : ""}" data-ordu="${o.id}">
        ${gorunum.devletRenkKutusu(o.devlet)}<span><b>${kacis(o.ad)}</b> · ${o.asker.toLocaleString("tr-TR")} asker<small>${durum}</small></span></button></li>`;
    }).join("") || '<li class="bos">Ordu yok.</li>';
    const o = ozet.ordular.find((x) => x.id === seciliOrdu);
    const det = $("orduDetay");
    det.hidden = !o;
    if (!o) return;
    const p = planli.get(o.id);
    const tutum = bekleyenTutum.get(o.id) ?? o.tutum;
    det.innerHTML = `<div class="moral-satir"><span>Moral</span><i class="moral buyuk" style="--moral:${o.moral / 10}%"></i><b>${yuzde(o.moral)}</b></div>
      <p class="not">${o.muharebede ? "⚔ Muharebede." : o.cekiliyor ? "Kendi toprağına dönüyor." : o.kusatma !== null ? `${kacis(senaryo.sehirler[o.kusatma].ad)} kuşatmasında. Yürüyüş emri verirseniz kuşatmadan ayrılır.` : p ? `Planlanan rota: ${kirilimMetni(p)}. Yürüyüş bir sonraki turda başlar.`
      : o.yuruyor ? "Yürüyor. Haritada sağ tıklayarak yeni hedef verebilirsiniz."
      : "Hedef vermek için haritada bir noktaya <b>sağ tıklayın</b>."}</p>
      <div class="tutumlar" role="group" aria-label="Geri çekilme tutumu">${TUTUMLAR.map(([t, ad, aciklama]) =>
        `<button data-tutum="${t}" title="${aciklama}" class="${t === tutum ? "etkin" : ""}">${ad}</button>`).join("")}</div>
      <p class="not">${TUTUMLAR.find(([t]) => t === tutum)![2]}.${bekleyenTutum.has(o.id) ? " (Bir sonraki turda geçerli.)" : ""}</p>
      <p class="not">İkmal ${yuzde(o.ikmal)} · ${kacis(o.ikmalNedeni)}</p>
      <p class="not">Aylık maaş payı: yaklaşık ${o.maas.toLocaleString("tr-TR")}.${o.maasAksiyor ? ` Maaş aksıyor: günde ${DENGE.MAAS_AKSAMASI_MORAL / 10} puan moral kaybı.` : ""}</p>
      <div class="satir"><button id="orduOdak">Haritada göster</button>${(o.yuruyor || p) && !o.muharebede && !o.cekiliyor ? '<button id="orduDur">Durdur</button>' : ""}</div>
      <div class="ordu-duzenle" ${o.kusatma !== null ? "hidden" : ""}>
        <label for="bolAsker">Ayrılacak asker <input id="bolAsker" type="number" min="1" max="${o.asker - 1}" value="${Math.max(1, Math.floor(o.asker / 2))}" /></label>
        <button id="orduBol" ${o.bolunebilir ? "" : "disabled"}>Orduyu böl</button>
        <p class="not">Bölme ve birleştirme için ordular beklemeli; bekleyen emirleri olmamalı.</p>
        ${o.birlesebilir.length ? `<label for="birlestirOrdu">Aynı konumdaki ordu</label><select id="birlestirOrdu">${o.birlesebilir.map((id) => `<option value="${id}">${kacis(ozet.ordular.find((a) => a.id === id)!.ad)}</option>`).join("")}</select>
        <button id="orduBirlestir">Birleştir</button><p class="not">Askerler toplanır; moral asker sayısına göre ortalanır. Seçili ordunun tutumu korunur.</p>`
        : '<p class="not">Birleştirmek için bu ordu seçiliyken diğer ordunun haritadaki işaretine sağ tıklayın; varınca birleştirebilirsiniz.</p>'}
      </div>`;
    $("orduBol").onclick = () => emirGonder({ tur: "orduBol", ordu: o.id, asker: $<HTMLInputElement>("bolAsker").valueAsNumber }, "Bölme emri verildi; bir sonraki turda uygulanır.");
    const birlestir = document.getElementById("orduBirlestir");
    if (birlestir) birlestir.onclick = () => emirGonder({ tur: "orduBirlestir", ordu: o.id,
      diger: Number($<HTMLSelectElement>("birlestirOrdu").value) }, "Birleştirme emri verildi; bir sonraki turda uygulanır.");
    for (const b of det.querySelectorAll<HTMLButtonElement>("[data-tutum]")) {
      b.onclick = async () => {
        const t = b.dataset.tutum as Tutum;
        const y = await sim.gonder({ tip: "emir", emir: { tur: "orduTutum", ordu: o.id, tutum: t } });
        ozet = y.ozet;
        if (y.dogrulama && !y.dogrulama.gecerli) return bildir(y.dogrulama.neden, "uyari");
        bekleyenTutum.set(o.id, t);
        arayuzuGuncelle();
      };
    }
    $("orduOdak").onclick = () => gorunum.orduyaOdaklan(o);
    const dur = document.getElementById("orduDur");
    if (dur) dur.onclick = async () => {
      const y = await sim.gonder({ tip: "emir", emir: { tur: "orduDur", ordu: o.id } });
      ozet = y.ozet;
      if (y.dogrulama && !y.dogrulama.gecerli) return bildir(y.dogrulama.neden, "uyari");
      planli.delete(o.id);
      arayuzuGuncelle();
      bildir(`${o.ad} için durma emri verildi; bir sonraki turda uygulanır.`);
    };
  };
  const orduSec = (id: number | null) => {
    seciliOrdu = seciliOrdu === id ? null : id;
    if (seciliOrdu !== null) sekmeAc("ordu");
    arayuzuGuncelle();
  };
  $("orduListesi").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-ordu]");
    if (b) orduSec(Number(b.dataset.ordu));
  });
  gorunum.olaylar.orduSec = (id) => orduSec(id);
  gorunum.olaylar.hedef = async (x, y, birim) => {
    if (seciliOrdu === null || mesgul) return;
    if (birim < 0) return bildir("Hedef karada olmalı.", "uyari");
    const xi = Math.round(x * 1e4), yi = Math.round(y * 1e4);
    const adaylar = birimDugumleri.get(birim) ?? [];
    if (!adaylar.length) return bildir("Bu arazi biriminde hareket ağı düğümü yok.", "uyari");
    // Çok parçalı birimde tıklanan noktaya en yakın parça merkezi
    const dugum = adaylar.reduce((en, n) => {
      const a = senaryo.ag!.dugumler[n], b = senaryo.ag!.dugumler[en];
      return (a.x - xi) ** 2 + (a.y - yi) ** 2 < (b.x - xi) ** 2 + (b.y - yi) ** 2 ? n : en;
    }, adaylar[0]);
    const ordu = seciliOrdu;
    const o = await sim.gonder({ tip: "rotaOnizle", ordu, x: xi, y: yi, dugum });
    if (!o.rota?.gecerli) return bildir(o.rota?.neden ?? "Rota bulunamadı.", "uyari");
    const e = await sim.gonder({ tip: "emir", emir: { tur: "orduHedef", ordu, x: xi, y: yi, dugum } });
    ozet = e.ozet;
    if (e.dogrulama && !e.dogrulama.gecerli) return bildir(e.dogrulama.neden, "uyari");
    planli.set(ordu, o.rota);
    arayuzuGuncelle();
    bildir(`Hedef verildi: tahmini varış ${o.rota.varisTarihi} (${o.rota.gun} gün). Yürüyüş bir sonraki turda başlar.`);
  };

  const turuIlerlet = async () => {
    if (mesgul) return;
    mesgul = true;
    $<HTMLButtonElement>("ilerleBtn").disabled = true;
    try {
      const y = await sim.gonder({ tip: "turuIlerlet" });
      ozet = y.ozet;
      planli.clear(); // emirler tur başında uygulandı
      bekleyenSavas.clear();
      bekleyenTutum.clear();
      // Oyuncunun katıldığı yeni muharebe raporu varsa göster
      const yeniRapor = ozet.raporlar.filter((r) => !gorulenRaporlar.has(r.id));
      for (const r of ozet.raporlar) gorulenRaporlar.add(r.id);
      if (yeniRapor.length) raporGoster(yeniRapor[yeniRapor.length - 1]);
      $("sonTur").textContent = `Son tur: ${Math.round(y.sureMs ?? 0)} ms`;
      if (y.sonuc?.kesinti) kesintiGoster(ozet.tarih, y.sonuc.kesinti.neden);
      else teklifGoster();
      for (const o of y.sonuc?.yeniOlaylar ?? []) {
        if (o.tur === "emir-reddedildi") bildir(`Emir reddedildi: ${o.metin}`, "uyari");
      }
      await kaydet("otomatik", true);
    } catch (e) {
      bildir(`Tur hesaplanamadı: ${(e as Error).message}`, "hata");
    } finally {
      mesgul = false;
      $<HTMLButtonElement>("ilerleBtn").disabled = false;
      arayuzuGuncelle();
    }
  };

  const kesintiGoster = (tarih: string, neden: string) => {
    $("kesintiMetin").textContent = neden;
    $("kesintiTarih").textContent = tarih;
    $("kesinti").hidden = false;
    $<HTMLButtonElement>("kesintiTamam").focus();
  };
  $("kesintiTamam").onclick = () => { $("kesinti").hidden = true; if (ozet.verasetSecimi && secilenAday === null) verasetAc(); else teklifGoster(); };
  $("yonetimKaydet").onclick = async () => {
    const butce = $<HTMLInputElement>("yonetimButce").valueAsNumber, altSinir = $<HTMLInputElement>("yonetimAlt").valueAsNumber;
    const y = await sim.gonder({ tip: "yonetim", butce, altSinir });
    ozet = y.ozet; arayuzuGuncelle();
    if (y.dogrulama && !y.dogrulama.gecerli) bildir(y.dogrulama.neden, "uyari");
    else bildir(`Yerel yönetim: aylık tavan ${butce.toLocaleString("tr-TR")}, hazine alt sınırı ${altSinir.toLocaleString("tr-TR")}.`);
  };
  gorunum.olaylar.donanmaSec = (id) => donanmaSec(id);
  $("donanmaListesi").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-donanma]");
    if (b) donanmaSec(Number(b.dataset.donanma) === seciliDonanma ? null : Number(b.dataset.donanma));
  });
  $("donanmaPaneli").addEventListener("click", async (e) => {
    const id = (e.target as HTMLElement).id;
    if (seciliDonanma === null) return;
    if (id === "donanmaYelken") {
      const bolge = Number($<HTMLSelectElement>("donanmaBolge").value);
      await emirGonder({ tur: "donanmaHedef", donanma: seciliDonanma, bolge }, `Donanma ${ozet.denizBolgeleri[bolge].ad} yönüne yelken açacak (bir sonraki tur).`);
    } else if (id === "cikarmaBtn") {
      const ordu = Number($<HTMLSelectElement>("cikarmaOrdu").value), sehir = Number($<HTMLSelectElement>("cikarmaSehir").value);
      await emirGonder({ tur: "cikarma", donanma: seciliDonanma, ordu, sehir }, `Çıkarma emri verildi: hedef ${senaryo.sehirler[sehir].ad}.`);
    }
  });
  $("verasetKapat").onclick = () => { $("verasetPencere").hidden = true; };
  $("hukumdarKarti").addEventListener("click", (e) => { if ((e.target as HTMLElement).id === "verasetAc") verasetAc(); });
  $("verasetAdaylar").addEventListener("click", async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-aday]");
    if (!b || b.disabled) return;
    const i = Number(b.dataset.aday), a = ozet.verasetSecimi!.adaylar[i];
    if (await emirGonder({ tur: "halefSec", aday: i }, `${a.ad} halef seçildi; bir sonraki tur başında tahta çıkar.`)) { secilenAday = i; verasetCiz(); }
  });
  // AI'dan gelen barış teklifi (TASK-0009/6c): oyunun kendi penceresi; bir kez kendiliğinden açılır
  const gosterilenTeklifler = new Set<number>();
  let acikTeklif: number | null = null;
  const teklifGoster = (id?: number) => {
    const t = id !== undefined ? ozet.barisTeklifleri.find((x) => x.id === id)
      : ozet.barisTeklifleri.find((x) => x.cevap === null && !gosterilenTeklifler.has(x.id));
    if (!t || !$("kesinti").hidden) return;
    gosterilenTeklifler.add(t.id);
    acikTeklif = t.id;
    const ad = h.paket.devletler[t.devlet].ad;
    const yerler = [...t.sehirler.map((i) => senaryo.sehirler[i].ad), ...t.birimler.map((i) => birimAdi(i))];
    $("teklifBaslik").textContent = `${ad}: barış teklifi`;
    $("teklifIcerik").innerHTML = `<p>${kacis(ad)} ${kacis(t.gerekce)}.</p>
      <p><b>${yerler.length ? `${t.size ? "Size geçecek" : "Onlara geçecek"}: ` : "Toprak değişmez (karşılıksız barış)."}</b>${kacis(yerler.join(", "))}</p>
      <p class="not">${t.cevap === null ? `Teklif ${t.kalanGun} gün daha geçerli.` : `Cevabınız: ${t.cevap ? "kabul" : "ret"} — bir sonraki tur başında uygulanır.`}</p>`;
    for (const b of ["teklifKabul", "teklifRet"]) $<HTMLButtonElement>(b).disabled = t.cevap !== null;
    $("barisTeklifi").hidden = false;
  };
  const teklifCevapla = async (kabul: boolean) => {
    if (acikTeklif === null) return;
    const ad = h.paket.devletler[ozet.barisTeklifleri.find((x) => x.id === acikTeklif)!.devlet].ad;
    if (await emirGonder({ tur: "barisCevap", teklif: acikTeklif, kabul }, kabul ? `${ad} ile barış kabul edildi; bir sonraki tur başında uygulanır.` : `${ad}'nın teklifi reddedildi.`)) {
      $("barisTeklifi").hidden = true;
    }
  };
  $("savasListesi").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-teklif]");
    if (b) teklifGoster(Number(b.dataset.teklif));
  });
  $("teklifKabul").onclick = () => teklifCevapla(true);
  $("teklifRet").onclick = () => teklifCevapla(false);
  $("teklifSonra").onclick = () => { $("barisTeklifi").hidden = true; };

  const yuvaEtiketiGuncelle = async () => {
    for (const yuva of ["manuel", "otomatik"] as Yuva[]) {
      const b = $<HTMLButtonElement>(yuva === "manuel" ? "yukleManuel" : "yukleOtomatik");
      try {
        const k = await kayitOku(yuva);
        b.disabled = !k;
        b.title = k ? `${k.devlet} · ${k.oyunTarihi}` : "Kayıt yok";
        b.querySelector("small")!.textContent = k ? k.oyunTarihi : "boş";
      } catch {
        b.disabled = true;
        b.title = "Tarayıcı deposuna erişilemiyor";
      }
    }
  };

  const kaydet = async (yuva: Yuva, sessiz = false) => {
    try {
      const y = await sim.gonder({ tip: "kaydet" });
      await kayitYaz(yuva, { metin: y.metin!, oyunTarihi: y.ozet.tarih, devlet: y.ozet.oyuncu.ad, zaman: Date.now() });
      if (!sessiz) bildir(`Kaydedildi (${yuva === "manuel" ? "manuel" : "otomatik"}): ${y.ozet.tarih}`);
      await yuvaEtiketiGuncelle();
    } catch (e) {
      bildir(`Kayıt yazılamadı: ${(e as Error).message}`, "hata");
    }
  };

  const yukle = async (yuva: Yuva) => {
    if (mesgul) return;
    try {
      const k = await kayitOku(yuva);
      if (!k) return bildir("Bu yuvada kayıt yok.", "uyari");
      ozet = (await sim.gonder({ tip: "yukle", metin: k.metin, senaryo: senaryoKimligi })).ozet;
      planli.clear();
      bekleyenSavas.clear();
      bekleyenTutum.clear();
      for (const r of ozet.raporlar) gorulenRaporlar.add(r.id);
      arayuzuGuncelle();
      bildir(`Yüklendi: ${ozet.tarih}`);
    } catch (e) {
      bildir(`Kayıt yüklenemedi: ${(e as Error).message}`, "hata");
    }
  };

  // --- Denetimler
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-sure]")) {
    b.onclick = async () => {
      ozet = (await sim.gonder({ tip: "turSuresi", sure: b.dataset.sure as TurSuresi })).ozet;
      arayuzuGuncelle();
    };
  }
  $("ilerleBtn").onclick = turuIlerlet;
  $("kaydetBtn").onclick = () => kaydet("manuel");
  $("yukleManuel").onclick = () => yukle("manuel");
  $("yukleOtomatik").onclick = () => yukle("otomatik");
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("teknoloji").hidden && $("onay").hidden) { $("teknoloji").hidden = true; return; }
    if (e.code !== "Space" || !$("verasetPencere").hidden || !$("kesinti").hidden || !$("rapor").hidden || !$("onay").hidden || !$("baris").hidden || !$("teknoloji").hidden || !$("barisTeklifi").hidden) return;
    const etiket = (e.target as HTMLElement).tagName;
    if (etiket === "INPUT" || etiket === "SELECT" || etiket === "TEXTAREA") return;
    e.preventDefault();
    turuIlerlet();
  });

  // Geliştirici denemeleri (Aşama 2 altyapısını sınamak için; gerçek mekanik değildir)
  $("testKesinti").onclick = async () => {
    const y = await sim.gonder({ tip: "emir", emir: { tur: "testKesintisi", gunSonra: 10, neden: "Test: sınırda yabancı bir ordu görüldü." } });
    ozet = y.ozet;
    arayuzuGuncelle();
    bildir("Test kesintisi planlandı: bir sonraki turda 10. günde tur duracak.");
  };
  $("testHarca").onclick = async () => {
    const y = await sim.gonder({ tip: "emir", emir: { tur: "harca", devlet: ozet.oyuncu.indeks, miktar: 50000, aciklama: "Test harcaması" } });
    ozet = y.ozet;
    arayuzuGuncelle();
    if (y.dogrulama && !y.dogrulama.gecerli) bildir(`Reddedildi: ${y.dogrulama.neden}`, "uyari");
    else bildir("Harcama emri verildi; bir sonraki turda uygulanacak.");
  };


  arayuzuGuncelle();
  await yuvaEtiketiGuncelle();
  $("yukleniyor").remove();
}

baslat().catch((e) => {
  $("yukleniyor").textContent = `Yükleme hatası: ${(e as Error).message}`;
  throw e;
});
