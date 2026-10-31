// Oyun istemcisi (TASK-0005): harita + üst durum çubuğu + tur akışı + yerel kayıt.
// Simülasyon Web Worker'da çalışır (DEC-0023); bu dosya yalnızca arayüzü yönetir.

// Yazı tipleri: yalnızca Latin ve Latin genişletilmiş (Türkçe) alt kümeleri (9e)
import "@fontsource/cinzel/latin-600.css";
import "@fontsource/cinzel/latin-ext-600.css";
import "@fontsource/cormorant-garamond/latin-700-italic.css";
import "@fontsource/cormorant-garamond/latin-ext-700-italic.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-ext-500.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-ext-700.css";
import { type YapiTuru, DENGE, tarihMetni, toplamaMaliyeti, type Emir, type MuharebeRaporu, type SenaryoVerisi, type Tutum, type TurSuresi, type VergiOrani, BIRIM_TURLERI, BIRIM_ADLARI, type BirimTuru } from "@tarihi/sim";
import { Color } from "three";
import { armaSvg } from "./arma";
import { portreSvg } from "./portre";
import { ozelSecimleriKur } from "./secim";
import { rehberAcik, rehberGoruldu, rehberiBaslat } from "./rehber";
import { SOZLUK } from "./sozluk";

ozelSecimleriKur();
import { haritaYukle } from "./harita/veri";
import { haritaGorunumuKur, kacis, KONUMLAR, type Katmanlar } from "./harita/gorunum";
import { SimHatasi, SimIstemcisi, type Ozet, type RotaOnizleme } from "./sim-protokol";
import { SURUM } from "./surum";
import { kayitlariListele, kayitOku, kayitSil, kayitYaz, tumKayitlariSil, type Yuva } from "./kayit-deposu";
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
  const [h, senaryo] = await Promise.all([
    haritaYukle(`${SENARYO_YOLU}harita.json`),
    fetch(`${SENARYO_YOLU}senaryo.json`).then((r) => r.json() as Promise<SenaryoVerisi>),
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
    sancak: $<HTMLInputElement>("kSancak").checked,
  });
  const gorunum = haritaGorunumuKur(h,
    { kap: $("tuvalKap"), etiketKap: $("etiketler"), orduKap: $("ordular"), kagit: $("kagit"), bilgi: $("bilgi"), ipucu: $("ipucu") },
    katmanAyarlari);
  for (const id of ["kArazi", "kNehir", "kSehir", "kEtiket", "kGuven", "kSancak"]) $(id).addEventListener("change", gorunum.istek);
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-git]")) {
    b.onclick = () => gorunum.git(b.dataset.git as keyof typeof KONUMLAR);
  }

  // --- Simülasyon
  const sim = new SimIstemcisi();
  let ozet: Ozet = (await sim.gonder({ tip: "yeniOyun", senaryo, tohum: TOHUM, oyuncu: parametreler.get("devlet") ?? undefined })).ozet;
  let mesgul = false;
  let seciliOrdu: number | null = null;
  let seciliBirlestir: number | null = null; // TASK-0017: seçili ordu değişince orduListesi tıklamasında sıfırlanır
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
    $("hukumdarPortre").innerHTML = h ? portreSvg(h.ad, h.hanedan) : "";
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
    $("verasetAdaylar").innerHTML = v.adaylar.map((a, i) => `<div class="aday${secilenAday === i ? " secili" : ""}"><div class="aday-icerik"><div class="portre" aria-hidden="true">${portreSvg(a.ad, a.hanedan)}</div><span><b>${kacis(a.ad)}</b>${kurguRozeti(a)}${a.tarihi ? " · tarihî halef" : ""}
      <small>${a.yas} yaşında · ${yetenekMetni(a)} · meşruiyet ${a.mesruiyet}${a.gelenek ? "" : " (geleneğe aykırı)"}</small></span></div>
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
  // Sekmelerde ← → ile gezinme (9e)
  $("sekmeler").addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const tum = [...document.querySelectorAll<HTMLElement>("#sekmeler [data-sekme]")];
    const i = tum.findIndex((b) => b.getAttribute("aria-selected") === "true");
    const y = tum[(i + (e.key === "ArrowRight" ? 1 : tum.length - 1)) % tum.length];
    e.preventDefault(); sekmeAc(y.dataset.sekme!); y.focus();
  });
  // Arayüz boyutu (9e); tarayıcıda hatırlanır
  const olcekUygula = (v: string) => { document.documentElement.style.setProperty("--olcek", v); try { localStorage.setItem("tarihi-olcek", v); } catch { /* yok */ } };
  { let v = "1"; try { v = localStorage.getItem("tarihi-olcek") ?? "1"; } catch { /* yok */ }
    $<HTMLSelectElement>("arayuzOlcek").value = v; olcekUygula(v); }
  $("arayuzOlcek").addEventListener("change", (e) => olcekUygula((e.target as HTMLSelectElement).value));
  const devletBasligi = () => {
    const i = ozet.oyuncu.indeks, hk = ozet.hukumdar;
    $("devletArmasi").innerHTML = armaSvg(gorunum.devletRengiHex(i), ozet.din, ozet.oyuncu.ad);
    $("devletAdi").textContent = ozet.oyuncu.ad;
    $("devletAlt").textContent = `${hk ? `${hk.ad} · ${hk.yas} yaşında` : "Taht boş"} · ${dinAdi(ozet.din)}`;
    const n = ozet.savaslar.length + ozet.barisTeklifleri.filter((t) => t.cevap === null).length
      + ozet.diplomatikTeklifler.filter((t) => t.cevap === null).length;
    $("savasRozet").hidden = n === 0;
    $("savasRozet").textContent = String(n);
  };
  let sonSancakAnahtari = "";
  // TASK-0033: idari terimlerin iyelik hâli ve büyük harfle başlayan hâli
  const iyelik = (tur: string) => ({ eyalet: "eyaleti", "dükalık": "dükalığı", "ülke": "ülkesi" } as Record<string, string>)[tur] ?? tur;
  const buyukHarf = (x: string) => x.charAt(0).toLocaleUpperCase("tr") + x.slice(1);
  /** Sol panel, Devlet sekmesi: eyalet eyalet sancaklar (TASK-0029) */
  const sancaklariGoster = () => {
    $("sancakBolumu").hidden = !ozet.sancaklar.length;
    const t = ozet.idariTerim; // TASK-0033: Sancaklar / Kontluklar / Voyvodalıklar …
    $("sancakBaslik").textContent = t.cogul;
    $("sancakAciklama").textContent = `Şehirler ${t.sancak} birimlerine, bunlar ${t.eyalet} birimlerine bağlıdır. "${t.unvan} yönetsin" denen ${t.sancak} biriminde bağış ve yatırımı yönetici, yukarıdaki yerel yönetim bütçesiyle yapar.`;
    const para = (x: number) => x.toLocaleString("tr-TR");
    $("sancakListesi").innerHTML = ozet.eyaletler.map((ey) => {
      const liste = ozet.sancaklar.filter((s) => s.eyalet === ey.id);
      if (!liste.length) return "";
      return `<h3>${kacis(ey.ad)} ${kacis(iyelik(ey.tur))}</h3>${liste.map((s) => `<div class="sancak-satir">
        <div><button class="bag" data-secim-sehir="${s.merkez}">${kacis(s.ad)}</button>
          <small>${kacis(s.bey)} · ${s.sehirler.length} şehir · ~${para(s.aylikGelir)}/ay · ${para(s.insanGucu)} insan gücü</small></div>
        <button data-sancak-yonetim="${s.sancak}" data-acik="${s.yonetim ? 0 : 1}" title="${s.yonetim ? "Yönetici bu birimin şehirlerinde yerel yönetici gibi bağış ve yatırım yapıyor (yerel yönetim bütçesiyle)." : "Birimin şehirlerini yöneticisine bırak"}">${s.yonetim ? `${kacis(t.unvan)} yönetiyor` : `${kacis(t.unvan)} yönetsin`}</button>
      </div>`).join("")}`;
    }).join("");
  };
  $("sancakListesi").addEventListener("click", async (e) => {
    const sec = (e.target as HTMLElement).closest<HTMLElement>("[data-secim-sehir]");
    if (sec) { gorunum.secVeGit({ tur: "sehir", id: Number(sec.dataset.secimSehir) }); return; }
    const y = (e.target as HTMLElement).closest<HTMLElement>("[data-sancak-yonetim]");
    if (!y) return;
    const r = await sim.gonder({ tip: "sancakYonetim", sancak: Number(y.dataset.sancakYonetim), acik: y.dataset.acik === "1" });
    ozet = r.ozet; arayuzuGuncelle(); gorunum.istek();
    if (r.dogrulama && !r.dogrulama.gecerli) bildir(r.dogrulama.neden, "uyari");
  });
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
    ozet.sehirDurumlari.forEach((c, i) => { senaryo.sehirler[i].ad = c.ad; }); // TASK-0026: oyuncu adı değiştirebilir
    gorunum.mulkiyetGoster(ozet.birimSahipleri, ozet.sehirDurumlari);
    // TASK-0029: sancak sınırları (birim → sancak); yalnızca değişince yeniden çizilir
    const sancakAnahtar = ozet.sehirSancak.join(",") + "|" + ozet.sehirDurumlari.map((c) => c.birim).join(",");
    if (sancakAnahtar !== sonSancakAnahtari) {
      sonSancakAnahtari = sancakAnahtar;
      const bs = new Int32Array(h.paket.birimler.length).fill(-1);
      ozet.sehirSancak.forEach((sn, i) => { const b = ozet.sehirDurumlari[i].birim; if (sn >= 0 && b >= 0) bs[b] = sn; });
      gorunum.sancakGoster(bs);
    }
    sancaklariGoster();
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
    for (const b of document.querySelectorAll<HTMLButtonElement>("[data-vergi]")) {
      b.classList.toggle("etkin", b.dataset.vergi === butce.vergiOrani);
      b.disabled = mesgul;
    }
    $("butceKalemleri").innerHTML = `<dt>Hazine</dt><dd>${para(butce.hazine)}</dd>
      <dt>Emirlere ayrılan</dt><dd>${para(butce.ayrilan)}</dd><dt>Kullanılabilir</dt><dd>${para(butce.kullanilabilir)}</dd>
      <dt>Aylık gelir</dt><dd>+${para(butce.aylikGelir)}<small class="not"> · arazi ${para(butce.aylikAraziGeliri)} (${para(butce.araziSayisi)} arazi) + yapılar ${para(butce.aylikYapiGeliri)} + ticaret ${para(butce.aylikTicaretGeliri)}</small></dd>
      <dt>Aylık ordu maaşı</dt><dd>−${para(butce.aylikMaas)}<small class="not"> · ${para(butce.askerSayisi)} asker</small></dd>
      <dt>Aylık fark</dt><dd id="butceNet" class="${butce.aylikNet < 0 ? "eksi" : "artı"}">${butce.aylikNet > 0 ? "+" : ""}${para(butce.aylikNet)}</dd>`;
    $("butceSehirleri").innerHTML = butce.sehirler.length
      ? butce.sehirler.map((s) => `<dt>${kacis(s.ad)}</dt><dd>+${para(s.toplam)}<small class="not"> · yapılar ${para(s.yapiGeliri)} + ticaret ${para(s.ticaretGeliri)}</small></dd>`).join("")
      : "<dt class=\"bos\">Şehriniz yok.</dt>";
    $("hazineGecmisi").textContent = butce.hazineGecmisi.length
      ? `Son ${butce.hazineGecmisi.length} ayın net farkı: ${butce.hazineGecmisi.map((n) => (n > 0 ? "+" : "") + para(n)).join(", ")}.`
      : "Henüz bir aylık kapanış geçmedi.";
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
    $("insaatListesi").insertAdjacentHTML("beforeend", ozet.gemiInsalari.map((g) => `<li>Tersane: ${kacis(senaryo.sehirler[g.sehir].ad)} · ${g.adet} ${DENGE.GEMI[g.gemi as "kadirga" | "kalyon"].ad.toLowerCase()} · ${g.emir ? "emir bekliyor" : ozet.istikrar[g.sehir].ayaklanma || ozet.kusatmalar.some((k) => k.sehir === g.sehir) ? "kuşatma/ayaklanma nedeniyle bekliyor" : `${g.kalanGun} gün kaldı`}</li>`).join(""));
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
      + (yy.harcanan > yy.butce ? "Tavan düşürüldü; geçmiş harcama korunur, bu ay yeni otomatik harcama yapılmaz. " : "")
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
    const birimSecim = $<HTMLSelectElement>("toplamaBirim"), onceBirim = birimSecim.value;
    if (!birimSecim.options.length) {
      birimSecim.innerHTML = BIRIM_TURLERI.map((t) => {
        const b = DENGE.BIRIM[t];
        return `<option value="${t}">${BIRIM_ADLARI[t]} — maliyet %${b.maliyetYuzde}, maaş %${b.maasYuzde}, saldırı %${b.saldiriYuzde}, savunma %${b.savunmaYuzde}, hız %${b.hizYuzde}</option>`;
      }).join("");
      if (onceBirim) birimSecim.value = onceBirim;
    }
    $("toplamaListesi").innerHTML = ozet.toplamalar.map((t) => `<li>${kacis(t.sehir)} · ${t.asker.toLocaleString("tr-TR")} ${kacis(BIRIM_ADLARI[t.birim].toLowerCase())} · ${t.emir ? "Emir bekliyor" : t.bekliyor ? "Şehirde işler durduğu için bekliyor" : `${t.kalanGun} gün kaldı`}${t.id !== null ? `<button class="bag" data-toplama-iptal="${t.id}"${mesgul ? " disabled" : ""}>İptal</button>` : ""}</li>`).join("");
    toplamaBilgisi();
  };
  const toplamaBilgisi = () => {
    const sehir = ozet.askerSehirleri.find((s) => s.indeks === Number($<HTMLSelectElement>("toplamaSehir").value));
    const birim = $<HTMLSelectElement>("toplamaBirim").value as BirimTuru;
    const asker = $<HTMLInputElement>("toplamaAsker").valueAsNumber;
    const sayiUygun = Number.isSafeInteger(asker) && asker > 0;
    const bedel = sayiUygun ? toplamaMaliyeti(asker, ozet.toplamaKurali.bedelYuzde, birim) : 0;
    $("toplamaBilgi").textContent = sehir
      ? `Kullanılabilir insan gücü: ${sehir.insanGucu.toLocaleString("tr-TR")}. ${ozet.toplamaKurali.gun} gün; bedel: ${bedel.toLocaleString("tr-TR")}.`
        + (!sehir.uygun ? (sehir.ayaklanma ? " Ayaklanmada asker toplanamaz." : " Şehir ve çevresi kontrolünüzde olmalı.") : !sayiUygun ? " Pozitif tam sayı girin." : asker > sehir.insanGucu ? " Bu şehrin insan gücü yetmiyor; “Ordu kur” eksiği yakın şehirlerden toplar." : ozet.kullanilabilirHazine < bedel ? " Hazine yetersiz; borçlanma yoktur." : " Yeni ordu şehirde kurulur.")
      : "Asker toplanabilecek şehriniz yok.";
    $<HTMLButtonElement>("toplaBtn").disabled = mesgul || !sehir?.uygun || !sayiUygun || asker > sehir.insanGucu || ozet.kullanilabilirHazine < bedel;
    $<HTMLButtonElement>("orduKurBtn").disabled = mesgul || !sehir?.uygun || !sayiUygun; // TASK-0036: yeterlilik simde denetlenir
  };
  $("toplamaSehir").onchange = toplamaBilgisi;
  $("toplamaBirim").onchange = toplamaBilgisi;
  $("toplamaAsker").oninput = toplamaBilgisi;
  $("toplaBtn").onclick = () => emirGonder({ tur: "askerTopla", sehir: Number($<HTMLSelectElement>("toplamaSehir").value),
    asker: $<HTMLInputElement>("toplamaAsker").valueAsNumber, birim: $<HTMLSelectElement>("toplamaBirim").value as BirimTuru },
    "Asker toplama emri verildi; bir sonraki turda başlar.");
  $("orduKurBtn").onclick = () => emirGonder({ tur: "orduKur", sehir: Number($<HTMLSelectElement>("toplamaSehir").value),
    asker: $<HTMLInputElement>("toplamaAsker").valueAsNumber, birim: $<HTMLSelectElement>("toplamaBirim").value as BirimTuru },
    "Ordu kurma emri verildi: asker yakın şehirlerde toplanacak, hazır olanlar bu şehirde birleşecek.");
  $("toplamaListesi").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-toplama-iptal]");
    if (b) emirGonder({ tur: "toplamaIptal", id: Number(b.dataset.toplamaIptal) }, "Toplama iptal emri verildi; bedel bir sonraki turda iade edilir.");
  });
  const yuzde = (binde: number) => `%${Math.round(binde / 10)}`;
  const raporGoster = (r: MuharebeRaporu) => {
    const satir = (t: MuharebeRaporu["taraflar"][number]) => {
      const kirilim = kompozisyonMetni(t.kayipKompozisyon); // TASK-0021 (1/4)
      return `<tr>
      <td>${gorunum.devletRenkKutusu(t.devlet)} ${kacis(h.paket.devletler[t.devlet].ad)}<small>${t.ordular.map(kacis).join(", ")}</small></td>
      <td>${t.baslangicAsker.toLocaleString("tr-TR")}</td><td>−${t.kayip.toLocaleString("tr-TR")}${kirilim ? `<small class="not">(${kacis(kirilim)})</small>` : ""}</td>
      <td>${yuzde(t.moralBas)} → ${yuzde(t.moralSon)}</td>
      <td>${{ zafer: "Zafer", "geri-cekildi": "Geri çekildi", dagildi: "Dağıldı" }[t.sonuc]}</td></tr>`;
    };
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
      const yatirim = !y ? "" : `${yonetici}<h4>Şehir yatırımları</h4>
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
      const st = ozet.istikrar[s.id], durum = st.ayaklanma ? "Ayaklanma" : st.risk >= DENGE.IST_DIRENIS ? "Direniş" : st.risk >= DENGE.IST_HUZURSUZLUK ? "Huzursuzluk" : "Sakin";
      const imzali = (n: number) => `${n > 0 ? "+" : ""}${n}`;
      const istikrar = `<section id="istikrarBilgi"><h4>İstikrar · ${durum}</h4><p>İsyan riski: <b>%${st.risk}</b> · Önceki ay %${st.oncekiRisk}</p>
        <p class="not">${st.hesapGun === null ? "İlk ay başında hesaplanacak." : `Son hesap: ${tarihMetni(st.hesapGun)}. Risk 0–100 arasında tutulur.`}</p>
        <ul class="not">${st.bilesenler.filter((x) => x.puan !== 0).map((x) => `<li>${kacis(x.ad)}: ${imzali(x.puan)}</li>`).join("") || "<li>Etkin risk bileşeni yok.</li>"}</ul>
        <p class="not">Geçen aya göre: ${st.degisim.length ? st.degisim.map((x) => `${kacis(x.ad)} ${imzali(x.puan)}`).join("; ") : "bileşenler değişmedi"}. İndirimler ve 0–100 sınırı toplam farkı etkileyebilir.</p>
        <p class="not">${st.ayaklanma ? `Gelir ve asker toplama yok; inşaat bekliyor. ${DENGE.IST_BASTIRMA_AY} ay yeterli ordu veya riskin %${DENGE.IST_HUZURSUZLUK} altına düşmesiyle biter.`
          : st.risk >= DENGE.IST_DIRENIS ? `Direniş: şehir ve çevresi gelirin çeyreğini verir. %${DENGE.IST_AYAKLANMA} ve üzeri: ${st.yuksekAy}/${DENGE.IST_AYAKLANMA_AY} ay.`
          : st.risk >= DENGE.IST_HUZURSUZLUK ? `Şehir ve çevresi yarım gelir verir. %${DENGE.IST_AYAKLANMA} ve üzeri: ${st.yuksekAy}/${DENGE.IST_AYAKLANMA_AY} ay.` : "Şehir ve çevresinin gelirinde risk cezası yok."}</p>
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
          <button data-eylem="gemi" data-sehir="${s.id}"${st.ayaklanma || k ? ' disabled title="Ayaklanma veya kuşatma sırasında tersane bekler"' : ""}>Gemi yap</button></div>
        <p class="not">Kadırga: güç ${DENGE.GEMI.kadirga.guc}, ${DENGE.GEMI.kadirga.kapasite} asker taşır, bölgeyi ${DENGE.GEMI.kadirga.hizGun} günde geçer. Kalyon: güç ${DENGE.GEMI.kalyon.guc}, ${DENGE.GEMI.kalyon.kapasite} asker, ${DENGE.GEMI.kalyon.hizGun} gün. Aylık bakım ${DENGE.GEMI.kadirga.bakim} / ${DENGE.GEMI.kalyon.bakim}.</p>`;
      const ss = senaryo.sehirler[s.id];
      const SEHIR_TURU = { kasaba: "Kasaba", sehir: "Şehir", buyuksehir: "Büyük şehir" } as const;
      const GELIR = { tarim: "Tarım", hayvancilik: "Hayvancılık", ticaret: "Ticaret (liman)", zanaat: "Zanaat ve ticaret" } as const;
      const cd = ozet.sehirDurumlari[s.id];
      const KAYNAK_ETKI = {
        tarim: `Tarla geliri +%${DENGE.KAYNAK_TARIM_TARLA - 100}`,
        ticaret: `Pazar ve liman geliri +%${DENGE.KAYNAK_TICARET_PAZAR - 100}`,
        zanaat: `Pazar geliri +%${DENGE.KAYNAK_ZANAAT_PAZAR - 100}, asker toplama −%${100 - DENGE.KAYNAK_ZANAAT_TOPLAMA}`,
        hayvancilik: `Süvari toplama −%${100 - DENGE.KAYNAK_HAYVANCILIK_SUVARI}`,
      } as const;
      const sn = ozet.sehirSancak[s.id], sancak = sn >= 0 ? ozet.sancakAdlari[sn] : null;
      const kimlik = `<dl>${ss.tur ? `<dt>Tür</dt><dd>${SEHIR_TURU[ss.tur]}</dd>` : ""}
        ${ss.modernAd ? `<dt>Günümüzdeki adı</dt><dd>${kacis(ss.modernAd)}</dd>` : ""}
        ${sancak ? (() => { const ey = ozet.eyaletler.find((e) => e.id === sancak.eyalet);
          return `<dt>${kacis(buyukHarf(sancak.tur))}</dt><dd>${kacis(sancak.ad)}${ey ? ` · ${kacis(ey.ad)} ${kacis(iyelik(ey.tur))}` : ""}</dd>`; })() : ""}
        <dt>Gelişmişlik</dt><dd>${cd.gelismislik}/10 · gelir %${DENGE.GELISMISLIK_TABAN + DENGE.GELISMISLIK_ADIM * cd.gelismislik}</dd>
        ${cd.gelirKaynagi ? `<dt>Gelir kaynağı</dt><dd>${GELIR[cd.gelirKaynagi]}<small class="not"> · ${KAYNAK_ETKI[cd.gelirKaynagi]}</small></dd>` : ""}
</dl><p class="not">Gelişmişlik her iki yatırım seviyesinde artar; kuşatmayla düşmek ve ayaklanma onu geriletir.</p>`;
      const sd = ozet.sehirDurumlari[s.id], adi = (i: number) => kacis(senaryo.sehirler[i].ad);
      const birlesme = ozet.sehirBirlesmeleri.find((x) => x.merkez === s.id || x.katilan === s.id);
      const adaylar = ozet.birlesmeAdaylari[s.id] ?? [];
      const sehirYonetimi = sd.bagli >= 0 ? `<p class="not">Bu şehir ${adi(sd.bagli)} şehrine bağlıdır.</p>`
        : sd.devlet !== ozet.oyuncu.indeks ? "" : `<h4>Şehir adı ve birleştirme</h4>
        ${sd.eskiAd ? `<p class="not">Eski adı: ${kacis(sd.eskiAd)}</p>` : ""}
        <div class="iskan-satir"><input id="sehirYeniAd" type="text" maxlength="${DENGE.SEHIR_ADI_EN_UZUN}" value="${kacis(sd.ad)}" aria-label="Yeni ad" />
          <button data-eylem="sehirAdi" data-sehir="${s.id}">Adını değiştir</button></div>
        ${birlesme ? `<p class="not">${adi(birlesme.merkez)} ile ${adi(birlesme.katilan)} birleşiyor: ${birlesme.kalanGun} gün kaldı.</p>`
          : adaylar.length ? `<div class="iskan-satir"><select id="birlesmeHedef" aria-label="Birleşecek şehir">${adaylar.map((i) => `<option value="${i}">${adi(i)}</option>`).join("")}</select>
          <button data-eylem="sehirBirlestir" data-sehir="${s.id}">Birleştir</button></div>
          <p class="not">Bedel ${DENGE.SEHIR_BIRLESTIR_BEDEL}, ${DENGE.SEHIR_BIRLESTIR_GUN} gün. Büyük şehir (başkent varsa başkent) merkez kalır; küçüğün nüfusu ve yapıları ona geçer. Geri alınamaz.</p>`
          : '<p class="not">Birleştirilebilecek komşu şehriniz yok (toprağı komşu, kontrolünüzde, kuşatma ve ayaklanma altında olmayan).</p>'}`;
      return `${kimlik}${sehirYonetimi}${istikrar}${nufus}${iskan}${ticaret}${tersane}<h4>Şehir savunması</h4><dl><dt>Sur seviyesi</dt><dd>${c.sur}</dd>
        <dt>Garnizon</dt><dd>${c.garnizonTahmin ? "Yaklaşık " : ""}${c.garnizon.toLocaleString("tr-TR")}</dd></dl>
        <p class="not">${k ? `${k.gun} etkin gündür kuşatma altında.` : c.kontrol === ozet.oyuncu.indeks
          ? c.devlet === ozet.oyuncu.indeks ? "Şehir size ait ve askerî kontrolünüzde." : "Şehir askerî kontrolünüzde; yasal sahiplik barış antlaşmasıyla değişir."
          : "Şehir hareketle ele geçirilmez; kuşatma emri gerekir."}</p>
        ${(() => { // TASK-0027: şehri toprağıyla almak için kuşatma gerekir; düğme doğrudan şehir panelinde
          const so = ozet.ordular.find((o) => o.id === seciliOrdu);
          const dusman = c.kontrol !== ozet.oyuncu.indeks && ozet.savaslar.some((x) => x.karsi === c.kontrol);
          if (!so) return `<p class="not">${dusman ? "Kuşatmak" : "Şehre yürümek"} için önce ordunuzu seçin.</p>`;
          if (!dusman || k?.devlet === ozet.oyuncu.indeks) return `<button data-sehir-hedef="${s.id}">Şehre yürü</button>`;
          if (so.kusatilabilir.includes(s.id)) return `<button class="birincil" data-kusat="${s.id}">${kacis(so.ad)} ile kuşat</button>
            <p class="not">Abluka ile başlar; yöntemi Savaş sekmesinden değiştirebilirsiniz. Şehir düşünce toprağı da sizin olur.</p>`;
          return `<button class="birincil" data-sehir-hedef="${s.id}">Şehre yürü ve kuşat</button>
            <p class="not">Ordu şehrin önüne varınca kuşatma kendiliğinden (abluka) başlar.</p>`;
        })()}
        ${yatirim}`;
    }
    if (s.tur === "birim") {
      const p = ozet.isgalHazirliklari.find((v) => v.birim === s.id);
      return p ? `<p class="not">Askerî kontrol kuruluyor: ${p.gun}/${DENGE.ISGAL_GUN} gün. Şehir ayrı kuşatılır.</p>` : "";
    }
    if (s.tur === "deniz") return denizBilgisi(s.id);
    if (s.tur !== "devlet" || s.id === ozet.oyuncu.indeks) return "";
    const dip = diplomasiBolumu(s.id);
    const savas = ozet.savaslar.find((x) => x.karsi === s.id);
    if (savas) return `<p class="savas-durumu">⚔ Savaştasınız (${kacis(savas.baslangic)}) · Skor ${savas.skor}</p><button data-eylem="baris" data-savas="${savas.id}">Barış teklif et</button>${dip}`;
    if (bekleyenSavas.has(s.id)) return `<p class="savas-durumu">Savaş ilan edildi; bir sonraki turda başlar.</p>${dip}`;
    const k = ozet.diplomasi[s.id];
    const amb = ozet.ambargolarim.includes(s.id);
    const ambargo = `<button data-eylem="ambargo" data-devlet="${s.id}" data-acik="${amb ? 0 : 1}"${!amb && k?.muttefik ? " disabled" : ""}>${amb ? "Ambargoyu kaldır" : "Ambargo koy"}</button>`;
    const vasalEngeli = ozet.efendim !== null ? ' disabled title="Vasal bir devlet kendi başına savaş ilan edemez."' : "";
    return `${dip}<div class="satir eylem">${ambargo}<button class="tehlike" data-eylem="savas" data-devlet="${s.id}"${k?.muttefik ? ' disabled title="Müttefikinize savaş ilan edemezsiniz; önce ittifaktan çıkın."' : vasalEngeli}>Savaş ilan et</button></div>
      ${ozet.bizeAmbargo.includes(s.id) ? '<p class="not">Bu devlet size ticaret ambargosu uyguluyor.</p>' : ""}`;
  };
  /** Deniz bölgesi paneli (TASK-0023): kontrol, donanmalar, limanlar, komşu denizler */
  const denizBilgisi = (z: number) => {
    const b = ozet.denizBolgeleri[z];
    if (!b) return "";
    const devletAdi = (d: number) => `${gorunum.devletRenkKutusu(d)}${kacis(h.paket.devletler[d].ad)}`;
    const kontrol = b.kontrol === null ? "Kimsenin kontrolünde değil" : b.kontrol === ozet.oyuncu.indeks ? "Sizde" : devletAdi(b.kontrol);
    const benim = ozet.donanmalar.filter((f) => f.bolge === z);
    const yabanci = ozet.yabanciDonanmalar.filter((f) => f.bolge === z);
    const donanmalar = [
      ...benim.map((f) => `<li><button class="bag" data-donanma-sec="${f.id}">${kacis(f.ad)}</button> · ${gemiMetni(f.kadirga, f.kalyon)}</li>`),
      ...yabanci.map((f) => `<li>${devletAdi(f.devlet)} · ~${f.yaklasikGemi} gemi</li>`),
    ].join("");
    const limanlar = ozet.limanlar.map((l, i) => (l === z ? i : -1)).filter((i) => i >= 0);
    const secili = ozet.donanmalar.find((f) => f.id === seciliDonanma);
    const yelken = secili && secili.bolge !== z
      ? `<div class="satir eylem"><button data-eylem="yelken" data-bolge="${z}">⚓ ${kacis(secili.ad)} buraya yelken açsın</button></div>`
      : '<p class="not">Donanma göndermek için Deniz sekmesinden bir donanmanızı seçin.</p>';
    return `<dl><dt>Kontrol</dt><dd>${kontrol}</dd>
      <dt>Limanlar</dt><dd>${limanlar.length ? limanlar.map((i) => `<button class="bag" data-secim="sehir:${i}">${kacis(senaryo.sehirler[i].ad)}</button>`).join(", ") : "—"}</dd>
      <dt>Komşu denizler</dt><dd>${b.komsu.map((k) => `<button class="bag" data-secim="deniz:${k}">${kacis(ozet.denizBolgeleri[k].ad)}</button>`).join(", ") || "—"}</dd></dl>
      <h4>Donanmalar</h4>${donanmalar ? `<ul class="not">${donanmalar}</ul>` : '<p class="not">Görünür donanma yok.</p>'}${yelken}
      <p class="not">Denizdeki bütün donanmalar tek tarafa (devlet ve müttefikleri) aitse en güçlüsünün devleti denizi kontrol eder; karşıt donanmalar karşılaşırsa kontrol kimsede olmaz. Düşman kontrolündeki deniz, kıyısındaki limanları ablukaya alır.</p>`;
  };
  const isaretli = (n: number) => `<span class="${n > 0 ? "arti" : n < 0 ? "eksi" : ""}">${n > 0 ? "+" : ""}${n}</span>`;
  const iliskiAdi = (p: number) => (p >= 50 ? "Dostane" : p >= 15 ? "İyi" : p > -15 ? "Tarafsız" : p > -50 ? "Soğuk" : "Düşmanca");
  // AI'dan gelen diplomatik teklif (ittifak/ticaret/saldırmazlık; TASK-0020 1/3): barış teklifiyle aynı desen
  const dipTeklifAdi = { ittifak: "savunma ittifakı", ticaret: "ticaret anlaşması", saldirmazlik: "saldırmazlık paktı", vasallik: "vasallık" } as const;
  /** Devlet panelindeki diplomasi bölümü (TASK-0009/6a) */
  const diplomasiBolumu = (devlet: number) => {
    const k = ozet.diplomasi[devlet];
    if (!k) return "";
    const dipTeklif = ozet.diplomatikTeklifler.find((t) => t.devlet === devlet);
    const dipTeklifBanner = dipTeklif
      ? `<p class="not">📨 ${kacis(h.paket.devletler[devlet].ad)} size ${kacis(dipTeklifAdi[dipTeklif.tur])} teklif ediyor.
        <button data-dipteklif="${dipTeklif.id}">${dipTeklif.cevap === null ? "Teklifi cevapla" : "Cevabınız bekliyor"}</button></p>`
      : "";
    const durum = k.muttefik ? "Savunma ittifakınız var." : k.savasta ? "" : k.komsu ? "Sınır komşunuz." : "";
    const ittifak = k.savasta ? "" : k.muttefik
      ? `<button data-eylem="ittifakBoz" data-devlet="${devlet}"${k.bekleyen ? " disabled" : ""}>${k.bekleyen === "ittifakBoz" ? "Ayrılma emri bekliyor" : "İttifaktan çık"}</button>`
      : `<button data-eylem="ittifak" data-devlet="${devlet}"${k.bekleyen ? " disabled" : ""}>${k.bekleyen === "ittifakTeklif" ? "Teklif bekliyor" : "Savunma ittifakı teklif et"}</button>
        <p class="not">Tahmini cevap: <b class="${k.ittifak.kabul ? "zafer" : "yenilgi"}">${k.ittifak.kabul ? "kabul" : "ret"}</b> — ${kacis(k.ittifak.nedenler.join(" "))}</p>`;
    const hediye = k.savasta ? "" : `<div class="hediye-satir"><input id="hediyeMiktar" type="number" min="1" step="1" value="${k.hediyePuanBedeli * 5}" aria-label="Hediye miktarı" />
        <button data-eylem="hediye" data-devlet="${devlet}"${k.hediyeKalan ? "" : " disabled"}>Hediye gönder</button></div>
      <p class="not">1 ilişki puanı ≈ ${k.hediyePuanBedeli.toLocaleString("tr-TR")} · ${k.hediyeKalan ? `en çok ${k.hediyeKalan} puan daha eklenebilir` : "hediye etkisi dolu"}; zamanla söner.</p>`;
    const elci = k.elciYolda !== null
      ? `<p class="not">🕊 Elçiniz yolda; ${k.elciYolda} gün sonra varacak.</p>`
      : `<button data-eylem="elci" data-devlet="${devlet}"${k.bekleyen === "elciGonder" ? " disabled" : ""}>${k.bekleyen === "elciGonder" ? "Elçi gönderme emri bekliyor" : "Elçi gönder"}</button>
        <p class="not">Bedel ${DENGE.ELCI_BEDEL.toLocaleString("tr-TR")} · ${DENGE.ELCI_GUN} gün sonra ilişki +${DENGE.ELCI_ILISKI} (hediyeyle aynı birikim sınırı); hediyeden ucuz ama gecikmeli.
          %${DENGE.ELCI_BASARISIZLIK_YUZDE} ihtimalle yakalanır; ilişki bozulur (${DENGE.ELCI_YAKALANMA_ILISKI}), bedel geri gelmez.</p>`;
    const ticaret = k.savasta ? "" : k.ticaretVar
      ? `<button data-eylem="ticaretBoz" data-devlet="${devlet}"${k.bekleyen ? " disabled" : ""}>${k.bekleyen === "ticaretBoz" ? "Çıkma emri bekliyor" : "Ticaret anlaşmasından çık"}</button>
        <p class="not">Liman gelirinize +%${DENGE.TICARET_ANLASMA_YUZDE} ekler.</p>`
      : `<button data-eylem="ticaret" data-devlet="${devlet}"${k.bekleyen ? " disabled" : ""}>${k.bekleyen === "ticaretTeklif" ? "Teklif bekliyor" : "Ticaret anlaşması teklif et"}</button>
        <p class="not">Tahmini cevap: <b class="${k.ticaret.kabul ? "zafer" : "yenilgi"}">${k.ticaret.kabul ? "kabul" : "ret"}</b> — ${kacis(k.ticaret.nedenler.join(" "))}</p>`;
    const saldirmazlik = k.savasta || k.saldirmazlikVar ? (k.saldirmazlikVar ? '<p class="not">Saldırmazlık paktınız sürüyor; süresi dolmadan savaş ilan edemezsiniz.</p>' : "")
      : `<div class="hediye-satir"><select id="saldirmazlikAy" aria-label="Pakt süresi (ay)">${DENGE.SALDIRMAZLIK_AYLARI.map((ay) =>
          `<option value="${ay}"${ay === DENGE.SALDIRMAZLIK_VARSAYILAN_AY ? " selected" : ""}>${ay} ay</option>`).join("")}</select>
        <button data-eylem="saldirmazlik" data-devlet="${devlet}"${k.bekleyen ? " disabled" : ""}>${k.bekleyen === "saldirmazlikTeklif" ? "Teklif bekliyor" : "Saldırmazlık paktı teklif et"}</button></div>
        <p class="not">Tahmini cevap: <b class="${k.saldirmazlik.kabul ? "zafer" : "yenilgi"}">${k.saldirmazlik.kabul ? "kabul" : "ret"}</b> — ${kacis(k.saldirmazlik.nedenler.join(" "))}</p>`;
    const vasallik = k.vasalim
      ? `<p class="not">Bu devlet sizin vasalınız: aylık geliri'nin %${DENGE.VASAL_VERGI_YUZDE}'si size akar, savaşlarınıza zorunlu katılır, kendi başına savaş ilan edemez.</p>
        <button data-eylem="vasalSerbest" data-devlet="${devlet}"${k.bekleyen ? " disabled" : ""}>${k.bekleyen === "vasalSerbestBirak" ? "Serbest bırakma emri bekliyor" : "Serbest bırak"}</button>`
      : k.onunEfendisi !== null ? `<p class="not">Bu devlet ${kacis(h.paket.devletler[k.onunEfendisi].ad)}'nın vasalı.</p>` : "";
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
    const huk = k.hukumdar ? `<h4>Hükümdar</h4><div class="aday-icerik"><div class="portre" aria-hidden="true">${portreSvg(k.hukumdar.ad, k.hukumdar.hanedan)}</div>
      <p class="not"><b>${kacis(k.hukumdar.ad)}</b>${kurguRozeti(k.hukumdar)} · ${k.hukumdar.yas} yaşında · ${kacis(k.hukumdar.hanedan)}<br />${yetenekMetni(k.hukumdar)} · meşruiyet ${k.hukumdar.mesruiyet}</p></div>` : "";
    return `${arma}${huk}${inanc}${dipTeklifBanner}<h4>Diplomasi</h4><dl><dt>Size bakışı</dt><dd>${isaretli(k.bakisi)} · ${iliskiAdi(k.bakisi)}</dd>
      <dt>Sizin bakışınız</dt><dd>${isaretli(k.bakisimiz)} · ${iliskiAdi(k.bakisimiz)}</dd></dl>
      ${k.bilesenler.length ? `<ul class="iliski-bilesen">${k.bilesenler.map((b) => `<li><span>${kacis(b.ad)}</span>${isaretli(b.deger)}</li>`).join("")}</ul>` : '<p class="not">Aranızda özel bir etken yok.</p>'}
      ${durum ? `<p class="not">${durum}</p>` : ""}${ittifak}${hediye}${elci}<h4>Ticaret ve saldırmazlık</h4>${ticaret}${saldirmazlik}${vasallik}${casus}`;
  };
  $("bilgi").addEventListener("click", async (e) => {
    const bagis = (e.target as HTMLElement).closest<HTMLElement>("[data-bagis]");
    if (bagis) {
      await emirGonder({ tur: "bagis", sehir: Number(bagis.dataset.bagis) }, "Bağış emri verildi; bedel ayrıldı, indirim sonraki aylık hesapta uygulanacak.");
      return;
    }
    const kusatB = (e.target as HTMLElement).closest<HTMLElement>("[data-kusat]");
    if (kusatB && seciliOrdu !== null) {
      const sehir = Number(kusatB.dataset.kusat);
      await emirGonder({ tur: "kusat", ordu: seciliOrdu, sehir, yontem: "abluka" }, `${senaryo.sehirler[sehir].ad} kuşatma emri verildi (abluka); bir sonraki turda başlar.`);
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
    const adB = (e.target as HTMLElement).closest<HTMLElement>('[data-eylem="sehirAdi"]');
    if (adB) {
      const y = await sim.gonder({ tip: "sehirAdi", sehir: Number(adB.dataset.sehir), ad: $<HTMLInputElement>("sehirYeniAd").value });
      ozet = y.ozet; arayuzuGuncelle(); gorunum.istek();
      if (y.dogrulama && !y.dogrulama.gecerli) bildir(y.dogrulama.neden, "uyari"); else bildir("Şehrin adı değişti.");
      return;
    }
    const birB = (e.target as HTMLElement).closest<HTMLElement>('[data-eylem="sehirBirlestir"]');
    if (birB) {
      const sehir = Number(birB.dataset.sehir), katilan = Number($<HTMLSelectElement>("birlesmeHedef").value);
      const ad = (i: number) => senaryo.sehirler[i].ad;
      if (!await onayIste("Şehirleri birleştir", `${ad(sehir)} ile ${ad(katilan)} birleştirilsin mi? Bedel ${DENGE.SEHIR_BIRLESTIR_BEDEL}, ${DENGE.SEHIR_BIRLESTIR_GUN} gün sürer. Büyük şehir merkez kalır, küçük şehir ona bağlanır. Bu işlem geri alınamaz.`, "Birleştir", true)) return;
      await emirGonder({ tur: "sehirBirlestir", sehir, katilan }, `${ad(sehir)}–${ad(katilan)} birleştirme emri verildi; bir sonraki tur başlar.`);
      return;
    }
    const yelken = (e.target as HTMLElement).closest<HTMLElement>('[data-eylem="yelken"]');
    if (yelken && seciliDonanma !== null) {
      const bolge = Number(yelken.dataset.bolge);
      await emirGonder({ tur: "donanmaHedef", donanma: seciliDonanma, bolge }, `Donanma ${ozet.denizBolgeleri[bolge].ad} yönüne yelken açacak (bir sonraki tur).`);
      return;
    }
    const donSec = (e.target as HTMLElement).closest<HTMLElement>("[data-donanma-sec]");
    if (donSec) { donanmaSec(Number(donSec.dataset.donanmaSec)); return; }
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
    const dip = (e.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-eylem="ittifak"], [data-eylem="ittifakBoz"], [data-eylem="hediye"], [data-eylem="elci"], [data-eylem="ticaret"], [data-eylem="ticaretBoz"], [data-eylem="saldirmazlik"], [data-eylem="vasalSerbest"]');
    if (dip) {
      const hedef = Number(dip.dataset.devlet), ad = h.paket.devletler[hedef].ad;
      if (dip.dataset.eylem === "ittifak") {
        await emirGonder({ tur: "ittifakTeklif", hedef }, `${ad}'na ittifak teklifi gönderildi; cevap bir sonraki turun başında gelir.`);
      } else if (dip.dataset.eylem === "ittifakBoz") {
        if (!await onayIste("İttifaktan çık", `${ad} ile savunma ittifakından çıkılsın mı? İlişkiniz ${DENGE.ETKI_ITTIFAK_BOZMA} puan bozulur (zamanla söner).`, "İttifaktan çık", true)) return;
        await emirGonder({ tur: "ittifakBoz", hedef }, `${ad} ile ittifaktan çıkma emri verildi.`);
      } else if (dip.dataset.eylem === "ticaret") {
        await emirGonder({ tur: "ticaretTeklif", hedef }, `${ad}'na ticaret anlaşması teklifi gönderildi; cevap bir sonraki turun başında gelir.`);
      } else if (dip.dataset.eylem === "ticaretBoz") {
        if (!await onayIste("Ticaret anlaşmasından çık", `${ad} ile ticaret anlaşmasından çıkılsın mı?`, "Çık", true)) return;
        await emirGonder({ tur: "ticaretBoz", hedef }, `${ad} ile ticaret anlaşmasından çıkma emri verildi.`);
      } else if (dip.dataset.eylem === "saldirmazlik") {
        const ay = Number($<HTMLSelectElement>("saldirmazlikAy").value);
        await emirGonder({ tur: "saldirmazlikTeklif", hedef, ay }, `${ad}'na ${ay} aylık saldırmazlık paktı teklifi gönderildi; cevap bir sonraki turun başında gelir.`);
      } else if (dip.dataset.eylem === "vasalSerbest") {
        if (!await onayIste("Vasalı serbest bırak", `${ad} serbest bırakılsın mı? Artık vergi ödemeyecek ve savaşlarınıza katılmayacak.`, "Serbest bırak", true)) return;
        await emirGonder({ tur: "vasalSerbestBirak", hedef }, `${ad} serbest bırakma emri verildi.`);
      } else if (dip.dataset.eylem === "elci") {
        await emirGonder({ tur: "elciGonder", hedef }, `${ad}'na elçi gönderme emri verildi; bedel ayrıldı.`);
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

  // TASK-0019 (4/4): tamamen piyadeyse boş döner (asker sayısı zaten yeterli bilgi); aksi halde türler dökülür.
  const kompozisyonMetni = (k: { piyade: number; okcu: number; suvari: number }) => {
    if (!k.okcu && !k.suvari) return "";
    return BIRIM_TURLERI.filter((t) => k[t] > 0).map((t) => `${k[t].toLocaleString("tr-TR")} ${BIRIM_ADLARI[t].toLowerCase()}`).join(", ");
  };
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
      const kirilim = kompozisyonMetni(o.kompozisyon);
      return `<li><button class="ordu-satir${o.id === seciliOrdu ? " etkin" : ""}" data-ordu="${o.id}">
        ${gorunum.devletRenkKutusu(o.devlet)}<span><b>${kacis(o.ad)}</b> · ${o.asker.toLocaleString("tr-TR")} asker${kirilim ? ` <small class="not">(${kacis(kirilim)})</small>` : ""}<small>${durum}</small></span></button></li>`;
    }).join("") || '<li class="bos">Ordu yok.</li>';
    const o = ozet.ordular.find((x) => x.id === seciliOrdu);
    const det = $("orduDetay");
    det.hidden = !o;
    if (!o) return;
    if (!o.birlesebilir.includes(seciliBirlestir ?? -1)) seciliBirlestir = o.birlesebilir[0] ?? null;
    const p = planli.get(o.id);
    const tutum = bekleyenTutum.get(o.id) ?? o.tutum;
    const kirilim = kompozisyonMetni(o.kompozisyon);
    det.innerHTML = `<div class="moral-satir"><span>Moral</span><i class="moral buyuk" style="--moral:${o.moral / 10}%"></i><b>${yuzde(o.moral)}</b></div>
      ${kirilim ? `<p class="not">${o.asker.toLocaleString("tr-TR")} asker: ${kacis(kirilim)}.</p>` : ""}
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
        ${o.birlesebilir.length ? `<p class="not">Aynı konumdaki ordu (haritada diğer ordunun işaretine sağ tıklayarak da seçebilirsiniz):</p>
        <ul id="birlestirListesi" class="secim-listesi">${o.birlesebilir.map((id) => {
          const a = ozet.ordular.find((x) => x.id === id)!;
          const aKirilim = kompozisyonMetni(a.kompozisyon);
          return `<li><button data-birlestir-sec="${id}" class="${id === seciliBirlestir ? "etkin" : ""}">${kacis(a.ad)} <small>${a.asker.toLocaleString("tr-TR")} asker${aKirilim ? ` (${kacis(aKirilim)})` : ""}</small></button></li>`;
        }).join("")}</ul>
        <button id="orduBirlestir" ${seciliBirlestir !== null && o.birlesebilir.includes(seciliBirlestir) ? "" : "disabled"}>Birleştir</button>
        <p class="not">Askerler toplanır; moral asker sayısına göre ortalanır. Seçili ordunun tutumu korunur.</p>`
        : '<p class="not">Birleştirmek için bu ordu seçiliyken diğer ordunun haritadaki işaretine sağ tıklayın; varınca birleştirebilirsiniz.</p>'}
      </div>`;
    $("orduBol").onclick = () => emirGonder({ tur: "orduBol", ordu: o.id, asker: $<HTMLInputElement>("bolAsker").valueAsNumber }, "Bölme emri verildi; bir sonraki turda uygulanır.");
    const birlestirListesi = document.getElementById("birlestirListesi");
    if (birlestirListesi) birlestirListesi.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-birlestir-sec]");
      if (!b) return;
      seciliBirlestir = Number(b.dataset.birlestirSec);
      ordularPaneli();
    });
    const birlestir = document.getElementById("orduBirlestir");
    if (birlestir) birlestir.onclick = () => { if (seciliBirlestir !== null) emirGonder({ tur: "orduBirlestir", ordu: o.id,
      diger: seciliBirlestir }, "Birleştirme emri verildi; bir sonraki turda uygulanır."); };
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
    seciliBirlestir = null;
    if (seciliOrdu !== null) sekmeAc("ordu");
    arayuzuGuncelle();
  };
  $("orduListesi").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-ordu]");
    if (b) orduSec(Number(b.dataset.ordu));
  });
  gorunum.olaylar.orduSec = (id) => orduSec(id);

  // --- Harita bağlam menüsü (ordu seçili değilken sağ tık): sık işlemler panele gitmeden ---
  const baglamMenu = document.createElement("div");
  baglamMenu.id = "baglamMenu"; baglamMenu.className = "panel"; baglamMenu.hidden = true; baglamMenu.setAttribute("role", "menu");
  document.body.append(baglamMenu);
  const baglamKapat = () => { baglamMenu.hidden = true; };
  window.addEventListener("pointerdown", (e) => { if (!baglamMenu.contains(e.target as Node)) baglamKapat(); }, true);
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && !baglamMenu.hidden) { e.stopPropagation(); baglamKapat(); } }, true);
  window.addEventListener("wheel", baglamKapat, { passive: true });
  /** Devlet paneli açıkken savaş ilanı düğmesine basar (oyunun onay penceresi açılır). */
  const savasDugmesineBas = () => { $("bilgi").querySelector<HTMLButtonElement>('[data-eylem="savas"]')?.click(); };
  gorunum.olaylar.baglamMenusu = (px, py, sehir, birim) => {
    const oyuncu = ozet.oyuncu.indeks, maddeler: [string, () => unknown][] = [];
    let baslik = "";
    const enYakinOrdu = (x: number, y: number) => ozet.ordular
      .filter((o) => !o.muharebede && !o.cekiliyor && o.kusatma === null)
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    if (sehir >= 0) {
      const c = ozet.sehirDurumlari[sehir], sc = senaryo.sehirler[sehir];
      baslik = `${c.ad} · ${h.paket.devletler[c.devlet].ad}`;
      maddeler.push(["Şehri aç", () => gorunum.secVeGit({ tur: "sehir", id: sehir })]);
      if (c.devlet === oyuncu && c.kontrol === oyuncu) {
        maddeler.push(["Asker topla / ordu kur…", () => {
          sekmeAc("ordu");
          const sec = $<HTMLSelectElement>("toplamaSehir");
          if ([...sec.options].some((o) => o.value === String(sehir))) { sec.value = String(sehir); sec.dispatchEvent(new Event("change")); }
          $<HTMLInputElement>("toplamaAsker").focus();
        }]);
        if (ozet.istikrar[sehir]?.bagisUygun) maddeler.push([`Bağış / imar yardımı (${DENGE.IST_BAGIS_BEDEL})`, () => emirGonder({ tur: "bagis", sehir }, `${c.ad}: bağış emri verildi.`)]);
      } else if (c.kontrol !== oyuncu && c.kontrol >= 0) {
        const savasta = ozet.savaslar.some((x) => x.karsi === c.kontrol) || bekleyenSavas.has(c.kontrol);
        if (savasta && sc.x !== undefined && sc.y !== undefined) {
          const o = enYakinOrdu(sc.x, sc.y);
          if (o) maddeler.push([`${o.ad} ile kuşatmaya git`, async () => {
            seciliOrdu = o.id; arayuzuGuncelle();
            await gorunum.olaylar.hedef?.(sc.x! / 1e4, sc.y! / 1e4, sc.birim);
          }]);
        } else if (!savasta && !ozet.diplomasi[c.kontrol]?.muttefik) {
          maddeler.push(["Savaş ilan et…", () => { gorunum.secVeGit({ tur: "devlet", id: c.kontrol }); savasDugmesineBas(); }]);
        }
      }
    } else if (birim >= 0) {
      const b = h.paket.birimler[birim];
      baslik = b.d >= 0 ? h.paket.devletler[b.d].ad : b.ad;
      maddeler.push(["Toprağı göster", () => gorunum.secVeGit({ tur: "birim", id: birim })]);
      if (b.d >= 0) maddeler.push(["Devleti göster", () => gorunum.secVeGit({ tur: "devlet", id: b.d })]);
    }
    if (!maddeler.length) return baglamKapat();
    baglamMenu.innerHTML = `<b>${kacis(baslik)}</b>${maddeler.map(([ad], i) => `<button role="menuitem" data-baglam="${i}">${kacis(ad)}</button>`).join("")}`;
    baglamMenu.hidden = false;
    const r = baglamMenu.getBoundingClientRect();
    baglamMenu.style.left = `${Math.min(px, innerWidth - r.width - 8)}px`;
    baglamMenu.style.top = `${Math.min(py, innerHeight - r.height - 8)}px`;
    baglamMenu.onclick = (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-baglam]");
      if (!b) return;
      baglamKapat();
      void maddeler[Number(b.dataset.baglam)][1]();
    };
  };

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
      else bekleyenPencereyiAc();
      for (const o of y.sonuc?.yeniOlaylar ?? []) {
        if (o.tur === "emir-reddedildi") bildir(`Emir reddedildi: ${o.metin}`, "uyari");
      }
      await otomatikKaydet();
    } catch (e) {
      hataGoster(e, true);
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
  $("kesintiTamam").onclick = () => { $("kesinti").hidden = true; if (ozet.verasetSecimi && secilenAday === null) verasetAc(); else bekleyenPencereyiAc(); };
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

  // AI'dan gelen diplomatik teklif (ittifak/ticaret/saldırmazlık; TASK-0020 1/3): barış teklifiyle aynı desen
  const gosterilenDipTeklifler = new Set<number>();
  let acikDipTeklif: number | null = null;
  const dipTeklifGoster = (id?: number) => {
    const t = id !== undefined ? ozet.diplomatikTeklifler.find((x) => x.id === id)
      : ozet.diplomatikTeklifler.find((x) => x.cevap === null && !gosterilenDipTeklifler.has(x.id));
    if (!t || !$("kesinti").hidden || !$("barisTeklifi").hidden) return;
    gosterilenDipTeklifler.add(t.id);
    acikDipTeklif = t.id;
    const ad = h.paket.devletler[t.devlet].ad, turAdi = dipTeklifAdi[t.tur];
    $("dipTeklifBaslik").textContent = `${ad}: ${turAdi} teklifi`;
    const teklifCumlesi = t.tur === "vasallik"
      ? `${kacis(ad)} sizi vasalı olarak almak istiyor.` // TASK-0021 (4/4): yön tek taraflı (efendi teklif eden)
      : `${kacis(ad)} size ${kacis(turAdi)}${t.ay ? ` (${t.ay} ay)` : ""} teklif ediyor.`;
    $("dipTeklifIcerik").innerHTML = `<p>${teklifCumlesi}</p>
      <p class="not">${kacis(t.gerekce)}</p>
      ${t.tur === "vasallik" ? `<p class="not">Kabul ederseniz toprağınızı korursunuz; aylık gelirinizin %${DENGE.VASAL_VERGI_YUZDE}'si ${kacis(ad)}'na gider, onun savaşlarına katılmak zorunda kalırsınız ve kendi başınıza savaş ilan edemezsiniz.</p>` : ""}
      <p class="not">${t.cevap === null ? `Teklif ${t.kalanGun} gün daha geçerli.` : `Cevabınız: ${t.cevap ? "kabul" : "ret"} — bir sonraki tur başında uygulanır.`}</p>`;
    for (const b of ["dipTeklifKabul", "dipTeklifRet"]) $<HTMLButtonElement>(b).disabled = t.cevap !== null;
    $("dipTeklifi").hidden = false;
  };
  const dipTeklifCevapla = async (kabul: boolean) => {
    if (acikDipTeklif === null) return;
    const t = ozet.diplomatikTeklifler.find((x) => x.id === acikDipTeklif)!, ad = h.paket.devletler[t.devlet].ad;
    if (kabul && t.tur === "vasallik"
      && !await onayIste("Vasal olun", `${ad}'nın vasalı olmayı kabul ediyor musunuz? Toprağınızı korursunuz ama aylık gelirinizin %${DENGE.VASAL_VERGI_YUZDE}'si ona gider, savaşlarına katılmak zorunda kalırsınız ve kendi başınıza savaş ilan edemezsiniz.`, "Vasal ol", true)) return;
    const basariMetni = t.tur === "vasallik" ? `${ad}'nın vasalı oldunuz; bir sonraki tur başında uygulanır.` : `${ad} ile ${dipTeklifAdi[t.tur]} kabul edildi; bir sonraki tur başında uygulanır.`;
    if (await emirGonder({ tur: "diplomatikTeklifCevap", teklif: acikDipTeklif, kabul },
      kabul ? basariMetni : `${ad}'nın teklifi reddedildi.`)) {
      $("dipTeklifi").hidden = true;
    }
  };
  $("dipTeklifKabul").onclick = () => dipTeklifCevapla(true);
  $("dipTeklifRet").onclick = () => dipTeklifCevapla(false);
  $("dipTeklifSonra").onclick = () => { $("dipTeklifi").hidden = true; };
  const bekleyenPencereyiAc = () => { teklifGoster(); if ($("barisTeklifi").hidden) dipTeklifGoster(); };
  $("bilgi").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-dipteklif]");
    if (b) dipTeklifGoster(Number(b.dataset.dipteklif));
  });

  // --- Kayıt yuvaları, ana menü, devlet seçimi (TASK-0012/9a)
  const sifirla = () => {
    planli.clear(); bekleyenSavas.clear(); bekleyenTutum.clear(); gosterilenTeklifler.clear(); gosterilenDipTeklifler.clear();
    gorulenRaporlar.clear(); // kimlikler yalnızca ait oldukları dünyada benzersizdir (H-07)
    sonOtoDonem = ""; // ilk tur yeni/yüklenen dünyanın otomatik kaydını yazmalı (H-03)
    seciliOrdu = null; seciliDonanma = null; secilenAday = null;
    for (const r of ozet.raporlar) gorulenRaporlar.add(r.id);
  };
  const kaydet = async (yuva: Yuva, ad: string, sessiz = false) => {
    try {
      const y = await sim.gonder({ tip: "kaydet" });
      await kayitYaz(yuva, { metin: y.metin!, oyunTarihi: y.ozet.tarih, devlet: y.ozet.oyuncu.ad, zaman: Date.now(), ad });
      if (!sessiz) bildir(`Kaydedildi: ${ad} (${y.ozet.tarih})`);
    } catch (e) {
      bildir(`Kayıt yazılamadı: ${(e as Error).message}`, "hata");
    }
  };
  // Dönüşümlü otomatik kayıt (10a): son tur, 1 tur önce, 2 tur önce
  const OTOMATIK = ["otomatik", "otomatik-2", "otomatik-3"];
  // Otomatik kayıt sıklığı (DEC-0062): her tur / oyunda ayda bir / yılda bir / kapalı; tarayıcıda hatırlanır
  let otoSiklik = "tur", sonOtoDonem = "";
  try { otoSiklik = localStorage.getItem("tarihi-oto-kayit") ?? "tur"; } catch { /* yok */ }
  $<HTMLSelectElement>("otoKayitSiklik").value = otoSiklik;
  $("otoKayitSiklik").addEventListener("change", (e) => {
    otoSiklik = (e.target as HTMLSelectElement).value;
    try { localStorage.setItem("tarihi-oto-kayit", otoSiklik); } catch { /* yok */ }
  });
  const otomatikKaydet = async () => {
    if (otoSiklik === "kapali") return;
    const [, ay, yil] = ozet.tarih.split(" ");
    const donem = otoSiklik === "ay" ? `${ay} ${yil}` : otoSiklik === "yil" ? yil : "";
    if (otoSiklik !== "tur" && donem === sonOtoDonem) return;
    sonOtoDonem = donem;
    try {
      for (let i = OTOMATIK.length - 1; i > 0; i--) {
        const k = await kayitOku(OTOMATIK[i - 1]);
        if (k) await kayitYaz(OTOMATIK[i], k);
      }
    } catch { /* depolama kapalıysa yalnızca son kayıt denenir */ }
    await kaydet("otomatik", "Otomatik kayıt", true);
  };
  const yuvaAdi = (yuva: string, k: { ad?: string }) => yuva === "otomatik" ? "Otomatik kayıt (son tur)"
    : yuva === "otomatik-2" ? "Otomatik kayıt (1 tur önce)" : yuva === "otomatik-3" ? "Otomatik kayıt (2 tur önce)" : k.ad ?? "Kayıt";
  const dosyaAdi = (k: { devlet: string; oyunTarihi: string }) =>
    `tarihi-1453-${k.devlet}-${k.oyunTarihi}`.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9çğıöşü]+/g, "-").replace(/-+$/, "") + ".json";
  const dosyayaIndir = (metin: string, ad: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([metin], { type: "application/json" }));
    a.download = ad;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const yukle = async (yuva: Yuva) => {
    if (mesgul) return false;
    try {
      const k = await kayitOku(yuva);
      if (!k) { bildir("Bu yuvada kayıt yok.", "uyari"); return false; }
      ozet = (await sim.gonder({ tip: "yukle", metin: k.metin, senaryo: senaryoKimligi })).ozet;
      sifirla();
      arayuzuGuncelle();
      gorunum.secVeGit({ tur: "devlet", id: ozet.oyuncu.indeks });
      bildir(`Yüklendi: ${k.ad ?? k.devlet} · ${ozet.tarih}`);
      return true;
    } catch (e) {
      bildir(`Kayıt yüklenemedi: ${(e as Error).message}${yuva.startsWith("otomatik") ? " Daha eski bir otomatik kaydı deneyin." : ""}`, "hata");
      return false;
    }
  };

  let menuOyunda = false; // oyun başladıysa menü "Oyuna dön" gösterir
  const menuGecmisi: string[] = [];
  const menuGoster = (ad: string, geriEkle = true) => {
    const simdiki = document.querySelector<HTMLElement>("#menuKatmani section:not([hidden])")?.dataset.menu;
    if (geriEkle && simdiki && simdiki !== ad) menuGecmisi.push(simdiki);
    document.querySelectorAll<HTMLElement>("#menuKatmani section").forEach((x) => { x.hidden = x.dataset.menu !== ad; });
    $("menuKatmani").hidden = false;
  };
  const menuKapat = () => { $("menuKatmani").hidden = true; menuGecmisi.length = 0; };
  $("menuKatmani").addEventListener("click", (e) => {
    const g = (e.target as HTMLElement).closest<HTMLElement>("[data-menu-git]");
    if (!g) return;
    const hedef = g.dataset.menuGit === "geri" ? menuGecmisi.pop() ?? "ana" : g.dataset.menuGit!;
    menuGoster(hedef, false);
  });
  const anaMenuyuHazirla = async () => {
    $("mKapat").hidden = !menuOyunda;
    try {
      const son = (await kayitlariListele())[0];
      $("mDevam").hidden = !son;
      if (son) { $("mDevam").dataset.yuva = son.yuva; $("mDevamBilgi").textContent = `${son.kayit.ad ?? son.kayit.devlet} · ${son.kayit.oyunTarihi}`; }
    } catch { $("mDevam").hidden = true; }
  };
  const zamanMetni = (t: number) => new Date(t).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
  let kayitKipi: "kaydet" | "yukle" = "yukle";
  const kayitlariCiz = async () => {
    $("kayitBaslik").textContent = kayitKipi === "kaydet" ? "Oyunu kaydet" : "Kayıt yükle";
    $("kayitYeni").hidden = kayitKipi !== "kaydet";
    $("kayitDosya").hidden = kayitKipi !== "yukle";
    if (kayitKipi === "kaydet") $<HTMLInputElement>("kayitAdi").value = `${ozet.oyuncu.ad} · ${ozet.tarih}`;
    let liste: Awaited<ReturnType<typeof kayitlariListele>> = [];
    try { liste = await kayitlariListele(); } catch { bildir("Tarayıcı deposuna erişilemiyor.", "hata"); }
    $<HTMLButtonElement>("tumKayitlariSil").disabled = liste.length === 0;
    $("tumKayitlariSil").textContent = liste.length ? `Tüm kayıtları sil (${liste.length})` : "Tüm kayıtları sil";
    const oto = (y: string) => y.startsWith("otomatik");
    $("kayitListesi").innerHTML = liste.map(({ yuva, kayit }) => `<li><span><b>${kacis(yuvaAdi(yuva, kayit))}</b>
        <small>${kacis(kayit.devlet)} · ${kacis(kayit.oyunTarihi)} · ${zamanMetni(kayit.zaman)}</small></span>
      <span class="eylemler">${kayitKipi === "kaydet" ? (oto(yuva) ? "" : `<button data-kayit-yaz="${kacis(yuva)}">Üzerine yaz</button>`) : `<button class="birincil" data-kayit-yukle="${kacis(yuva)}">Yükle</button>`}
        <button data-kayit-indir="${kacis(yuva)}" title="Dosyaya indir">⭳</button>
        ${oto(yuva) ? "" : `<button class="tehlike" data-kayit-sil="${kacis(yuva)}" title="Sil">✕</button>`}</span></li>`).join("")
      || '<li class="bos">Henüz kayıt yok.</li>';
  };
  const kayitPenceresi = async (kip: "kaydet" | "yukle") => { kayitKipi = kip; await kayitlariCiz(); menuGoster("kayit"); };
  $("tumKayitlariSil").onclick = async () => {
    if (mesgul) return bildir("Tur tamamlanınca kayıtları silebilirsiniz.", "uyari");
    try {
      const liste = await kayitlariListele();
      if (!liste.length) return kayitlariCiz();
      if (!await onayIste("Tüm kayıtları sil", `Bu tarayıcıdaki ${liste.length} kaydın tamamı (manuel ve otomatik kayıtlar) kalıcı olarak silinecek. Bu işlem geri alınamaz. İndirdiğiniz dosyalar etkilenmez; açık oyun devam eder ve sonraki turlarda yeni otomatik kayıt oluşabilir.`, "Tümünü sil", true)) return;
      await tumKayitlariSil();
      sonOtoDonem = "";
      await kayitlariCiz();
      await anaMenuyuHazirla();
      bildir("Bu tarayıcıdaki tüm oyun kayıtları silindi.");
    } catch (e) { bildir(`Kayıtlar silinemedi: ${(e as Error).message}`, "hata"); }
  };
  $("kayitDosyaIndir").onclick = async () => {
    const y = await sim.gonder({ tip: "kaydet" });
    dosyayaIndir(y.metin!, dosyaAdi({ devlet: y.ozet.oyuncu.ad, oyunTarihi: y.ozet.tarih }));
    bildir("Oyun dosya olarak indirildi.");
  };
  $("kayitDosyaAc").onclick = () => $<HTMLInputElement>("kayitDosyaGirdi").click();
  $("kayitDosyaGirdi").addEventListener("change", async (e) => {
    const girdi = e.target as HTMLInputElement, dosya = girdi.files?.[0];
    girdi.value = "";
    if (!dosya) return;
    if (dosya.size > 50_000_000) return bildir("Dosya çok büyük; bir oyun kaydı değil.", "hata");
    const metin = await dosya.text();
    if (menuOyunda && !await onayIste("Dosyadan yükle", "Kaydedilmemiş ilerleme kaybolur. Bu dosya yüklensin mi?", "Yükle")) return;
    try {
      ozet = (await sim.gonder({ tip: "yukle", metin, senaryo: senaryoKimligi })).ozet; // doğrulama simülasyonda
    } catch (err) { return bildir(`Dosya yüklenemedi: ${(err as Error).message}`, "hata"); }
    sifirla(); arayuzuGuncelle();
    gorunum.secVeGit({ tur: "devlet", id: ozet.oyuncu.indeks });
    await kayitYaz(`kayit:${Date.now()}`, { metin, oyunTarihi: ozet.tarih, devlet: ozet.oyuncu.ad, zaman: Date.now(), ad: dosya.name.replace(/\.json$/i, "") });
    menuOyunda = true; menuKapat();
    bildir(`Dosyadan yüklendi: ${ozet.oyuncu.ad} · ${ozet.tarih}`);
  });
  $("kayitYeniBtn").onclick = async () => {
    const ad = $<HTMLInputElement>("kayitAdi").value.trim() || `${ozet.oyuncu.ad} · ${ozet.tarih}`;
    await kaydet(`kayit:${Date.now()}`, ad);
    menuKapat();
  };
  $("kayitListesi").addEventListener("click", async (e) => {
    const t = e.target as HTMLElement;
    const indirB = t.closest<HTMLElement>("[data-kayit-indir]");
    if (indirB) {
      const k = await kayitOku(indirB.dataset.kayitIndir!);
      if (k) { dosyayaIndir(k.metin, dosyaAdi(k)); bildir("Kayıt dosyası indirildi."); }
      return;
    }
    const yukleB = t.closest<HTMLElement>("[data-kayit-yukle]"), yazB = t.closest<HTMLElement>("[data-kayit-yaz]"), silB = t.closest<HTMLElement>("[data-kayit-sil]");
    if (yukleB) {
      if (menuOyunda && !await onayIste("Kayıt yükle", "Kaydedilmemiş ilerleme kaybolur. Bu kayıt yüklensin mi?", "Yükle")) return;
      if (await yukle(yukleB.dataset.kayitYukle!)) { menuOyunda = true; menuKapat(); }
    } else if (yazB) {
      const k = await kayitOku(yazB.dataset.kayitYaz!);
      if (!await onayIste("Üzerine yaz", `"${k?.ad ?? "Kayıt"}" üzerine bu oyun yazılsın mı?`, "Üzerine yaz", true)) return;
      await kaydet(yazB.dataset.kayitYaz!, k?.ad ?? `${ozet.oyuncu.ad} · ${ozet.tarih}`);
      menuKapat();
    } else if (silB) {
      const k = await kayitOku(silB.dataset.kayitSil!);
      if (!await onayIste("Kaydı sil", `"${k?.ad ?? "Kayıt"}" kalıcı olarak silinsin mi?`, "Sil", true)) return;
      await kayitSil(silB.dataset.kayitSil!);
      await kayitlariCiz();
    }
  });

  // Devlet seçimi: tablo (hükümdar, din) senaryodan; büyüklük arazi sayısından
  const araziSayilari = senaryo.devletler.map((v) => senaryo.birimler.filter((b) => b.devlet === v.id).length);
  let secilenDevlet: number | null = null;
  const devletleriCiz = () => {
    const ara = $<HTMLInputElement>("devletAra").value.trim().toLocaleLowerCase("tr-TR");
    const sirala = $<HTMLSelectElement>("devletSirala").value;
    const tablo = senaryo.hukumdarlar?.hukumdarlar ?? [];
    const liste = senaryo.devletler.map((v, i) => ({ v, i, t: tablo.find((x) => x.devlet === v.id), n: araziSayilari[i] }))
      .filter((x) => x.n > 0 && (!ara || x.v.ad.toLocaleLowerCase("tr-TR").includes(ara)))
      .sort((a, b) => sirala === "ad" ? a.v.ad.localeCompare(b.v.ad, "tr") : sirala === "tarihi" ? Number(!!b.t) - Number(!!a.t) || b.n - a.n : b.n - a.n);
    $("devletListesi").innerHTML = liste.map(({ v, i, t, n }) => {
      const din = senaryo.nufus?.devletler[v.id]?.din ?? "bilinmiyor";
      const zorluk = n >= 40 ? ["kolay", "Kolay"] : n >= 10 ? ["orta", "Orta"] : ["zor", "Zor"];
      return `<button class="devlet-kart${secilenDevlet === i ? " secili" : ""}" data-devlet-sec="${i}" role="option" aria-selected="${secilenDevlet === i}">
        <span class="arma">${armaSvg(gorunum.devletRengiHex(i), din, v.ad)}</span>
        <span><b>${kacis(v.ad)}</b><small>${t ? kacis(t.ad) : '<span title="Tarihî verisi olmayan devlet">kurgusal hükümdar</span>'} · ${n} arazi · ${kacis(dinAdi(din))}</small>
        <small class="zorluk-${zorluk[0]}">${zorluk[1]}</small></span></button>`;
    }).join("") || '<p class="not">Eşleşen devlet yok.</p>';
    $<HTMLButtonElement>("mBasla").disabled = secilenDevlet === null;
    $("devletSecimBilgi").textContent = secilenDevlet === null ? "Bir devlet seçin." : senaryo.devletler[secilenDevlet].ad;
  };
  $("devletAra").addEventListener("input", devletleriCiz);
  $("devletSirala").addEventListener("change", devletleriCiz);
  $("devletListesi").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-devlet-sec]");
    if (b) { secilenDevlet = Number(b.dataset.devletSec); devletleriCiz(); }
  });
  $("devletListesi").addEventListener("dblclick", (e) => { if ((e.target as HTMLElement).closest("[data-devlet-sec]")) $("mBasla").click(); });
  $("mBasla").onclick = async () => {
    if (secilenDevlet === null) return;
    if (menuOyunda && !await onayIste("Yeni oyun", "Kaydedilmemiş ilerleme kaybolur. Yeni oyun başlasın mı?", "Başla", true)) return;
    const tohum = Number(parametreler.get("tohum")) || crypto.getRandomValues(new Uint32Array(1))[0];
    ozet = (await sim.gonder({ tip: "yeniOyun", senaryo, tohum, oyuncu: senaryo.devletler[secilenDevlet].id })).ozet;
    sifirla();
    arayuzuGuncelle();
    gorunum.secVeGit({ tur: "devlet", id: ozet.oyuncu.indeks });
    menuOyunda = true;
    menuKapat();
    bildir(`${ozet.oyuncu.ad} ile yeni oyun: ${ozet.tarih}`);
    if (!rehberGoruldu()) rehberiBaslat();
  };
  $("mYeni").onclick = () => { secilenDevlet = ozet.oyuncu.indeks; devletleriCiz(); menuGoster("devlet"); };
  $("mYukle").onclick = () => kayitPenceresi("yukle");
  $("mDevam").onclick = async () => { if (await yukle($("mDevam").dataset.yuva!)) { menuOyunda = true; menuKapat(); } };
  $("mKapat").onclick = menuKapat;
  $("mKaynak").onclick = () => menuGoster("kaynak");
  $("mNasil").onclick = () => { sozlukCiz(); menuGoster("nasil"); };
  $("mRehber").onclick = () => { menuOyunda = true; menuKapat(); rehberiBaslat(); };
  const sozlukCiz = () => {
    const ara = $<HTMLInputElement>("sozlukAra").value.trim().toLocaleLowerCase("tr-TR");
    $("sozluk").innerHTML = SOZLUK.filter(([t, a]) => !ara || `${t} ${a}`.toLocaleLowerCase("tr-TR").includes(ara))
      .map(([t, a]) => `<dt>${kacis(t)}</dt><dd>${kacis(a)}</dd>`).join("") || '<dd class="not">Eşleşen terim yok.</dd>';
  };
  $("sozlukAra").addEventListener("input", sozlukCiz);
  $("kaynakMetni").innerHTML = `
    <h4>Harita ve coğrafya</h4><ul>
    <li><b>OpenHistoricalMap</b> — 1453 sınırlarının bir kısmı (49 kayıt, CC0). Kalan sınırlar tahmindir; Ayar → Katmanlar → "Kaynak güveni" ile kesikli gösterilir.</li>
    <li><b>Natural Earth</b> — kıyı, göl, nehir ve idari birim geometrisi (kamu malı).</li>
    <li><b>NOAA NCEI ETOPO 2022</b> — yükseklikten türetilen arazi zorluğu ve verimi (serbest kullanım).</li>
    <li><b>Wikidata</b> — devlet kimlikleri, başkentler, kuruluş/yıkılış yılları (CC0).</li></ul>
    <h4>Tahmini tablolar (taslak)</h4><ul>
    <li>Hükümdarlar ve halefler, başlangıç ilişkileri ve ittifakları, nüfus grupları (din × kültür), şehir nüfusları, deniz bölgeleri ve
      başlangıç donanmaları: geliştirici tahminidir, tarihî kaynakla tek tek doğrulanmamıştır. Yetenek puanları ve bütün denge sayıları oyun içindir.</li>
    <li>Armalar oyunun ürettiği simgelerdir (devlet rengi + resmî din simgesi); tarihî arma iddiası taşımaz.</li></ul>
    <h4>Yazılım ve yazı tipleri</h4><ul>
    <li>three.js (MIT), earcut (ISC); Cinzel, Cormorant Garamond, Inter yazı tipleri (SIL Open Font License 1.1).</li>
    <li>Oyun çalışırken dış bir sunucuya bağlanmaz; kayıtlar yalnızca bu tarayıcıda tutulur.</li></ul>`;
  $("menuBtn").onclick = async () => { await anaMenuyuHazirla(); menuGoster("ana", false); };

  // --- Hata yakalama ve kurtarma (TASK-0013/10b)
  const hataGunlugu: { zaman: string; mesaj: string; yigin?: string }[] = [];
  let hataSimBozuk = false;
  const hataGoster = (e: unknown, turHatasi = false) => {
    const h = e instanceof Error ? e : new Error(String(e));
    hataGunlugu.push({ zaman: new Date().toISOString(), mesaj: h.message, yigin: h instanceof SimHatasi ? h.yigin : h.stack });
    if (hataGunlugu.length > 20) hataGunlugu.shift();
    hataSimBozuk ||= turHatasi || (h instanceof SimHatasi && h.bozuk);
    $("hataAciklama").textContent = hataSimBozuk
      ? "Simülasyon bir hatayla durdu; dünya yarım kalmış olabilir. Son otomatik kayda dönün (gerekirse daha eski bir otomatik kayda). İsterseniz önce hata raporunu indirin."
      : "Arayüzde bir hata oluştu. Oyun büyük olasılıkla sürebilir; sorun tekrarlarsa son otomatik kayda dönün.";
    $("hataMetni").textContent = h.message;
    $("hataDevam").hidden = hataSimBozuk;
    $("hataPenceresi").hidden = false;
  };
  $("hataDevam").onclick = () => { $("hataPenceresi").hidden = true; };
  $("hataRapor").onclick = async () => {
    const satirlar = [
      `Tarihî Strateji 1453 — hata raporu`, `Sürüm: ${SURUM}`, `Zaman: ${new Date().toISOString()}`,
      `Tarayıcı: ${navigator.userAgent}`, `Ekran: ${innerWidth}×${innerHeight} @${devicePixelRatio}`,
      `Oyun: ${ozet.oyuncu.ad} · ${ozet.tarih} · tur ${ozet.turNo} · durum özeti ${ozet.hash}`, "",
      "Hatalar:", ...hataGunlugu.map((x) => `- ${x.zaman} ${x.mesaj}\n${(x.yigin ?? "").split("\n").slice(0, 8).map((l) => "    " + l).join("\n")}`), "",
      "Son olaylar:", ...ozet.gunluk.slice(-15).map((o) => `- ${tarihMetni(o.gun)} ${o.metin}`),
    ];
    if ($<HTMLInputElement>("hataKayitEkle").checked) {
      try { satirlar.push("", "Kayıt:", (await kayitOku("otomatik"))?.metin ?? "(otomatik kayıt yok)"); } catch { satirlar.push("", "Kayıt okunamadı."); }
    }
    dosyayaIndir(satirlar.join("\n"), `tarihi-1453-hata-raporu-${Date.now()}.txt`);
    bildir("Hata raporu indirildi.");
  };
  $("hataKurtar").onclick = async () => {
    try {
      sim.yenidenBaslat();
      await sim.gonder({ tip: "yeniOyun", senaryo, tohum: 1453 }); // hareket ağı ve bağlamı yeniden kurar
      for (const yuva of ["otomatik", "otomatik-2", "otomatik-3"]) {
        if (await kayitOku(yuva) && await yukle(yuva)) { hataSimBozuk = false; $("hataPenceresi").hidden = true; return; }
      }
      bildir("Kullanılabilir otomatik kayıt bulunamadı; ana menüden bir kayıt yükleyin ya da yeni oyun başlatın.", "uyari");
      hataSimBozuk = false; $("hataPenceresi").hidden = true;
      await anaMenuyuHazirla(); menuGoster("ana", false);
    } catch (err) { bildir(`Kurtarma başarısız: ${(err as Error).message}`, "hata"); }
  };
  sim.coktuginde = (m) => hataGoster(new SimHatasi(m, undefined, true));
  window.addEventListener("error", (e) => hataGoster(e.error ?? e.message));
  window.addEventListener("unhandledrejection", (e) => hataGoster(e.reason));
  $("testSimHata").onclick = async () => { try { await sim.gonder({ tip: "testSimHatasi" }); } catch (e) { hataGoster(e, true); } };
  $("testHata").onclick = () => { setTimeout(() => { throw new Error("Test hatası (geliştirici denemesi)"); }); };

  // --- Denetimler
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-sure]")) {
    b.onclick = async () => {
      ozet = (await sim.gonder({ tip: "turSuresi", sure: b.dataset.sure as TurSuresi })).ozet;
      arayuzuGuncelle();
    };
  }
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-vergi]")) {
    b.onclick = () => emirGonder({ tur: "vergiAyarla", oran: b.dataset.vergi as VergiOrani },
      `Vergi oranı değiştirme emri verildi: ${b.textContent}.`);
  }
  $("ilerleBtn").onclick = turuIlerlet;
  $("kaydetBtn").onclick = () => kayitPenceresi("kaydet");
  $("yukleBtn").onclick = () => kayitPenceresi("yukle");
  window.addEventListener("keydown", (e) => {
    if (rehberAcik()) return;
    if (!$("menuKatmani").hidden) { if (e.key === "Escape" && menuOyunda && $("onay").hidden) menuKapat(); return; }
    if (e.key === "Escape" && !$("teknoloji").hidden && $("onay").hidden) { $("teknoloji").hidden = true; return; }
    if (e.code !== "Space" || !$("verasetPencere").hidden || !$("kesinti").hidden || !$("rapor").hidden || !$("onay").hidden || !$("baris").hidden || !$("teknoloji").hidden || !$("barisTeklifi").hidden || !$("dipTeklifi").hidden) return;
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
  $("yukleniyor").remove();
  // Açılışta ana menü; ?devlet= ile doğrudan oyun (geliştirme/test kısayolu)
  if (parametreler.get("devlet")) menuOyunda = true;
  else { await anaMenuyuHazirla(); menuGoster("ana", false); }
}

baslat().catch((e) => {
  $("yukleniyor").textContent = `Yükleme hatası: ${(e as Error).message}`;
  throw e;
});
