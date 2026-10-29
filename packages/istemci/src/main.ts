// Oyun istemcisi (TASK-0005): harita + üst durum çubuğu + tur akışı + yerel kayıt.
// Simülasyon Web Worker'da çalışır (DEC-0023); bu dosya yalnızca arayüzü yönetir.

import "@fontsource/cinzel/600.css";
import "@fontsource/cormorant-garamond/700-italic.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/700.css";
import { tarihMetni, type SenaryoVerisi, type TurSuresi } from "@tarihi/sim";
import { haritaYukle } from "./harita/veri";
import { haritaGorunumuKur, kacis, KONUMLAR, type Katmanlar, type WdDevlet } from "./harita/gorunum";
import { SimIstemcisi, type Ozet } from "./sim-protokol";
import { kayitOku, kayitYaz, type Yuva } from "./kayit-deposu";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const parametreler = new URLSearchParams(location.search);
const TOHUM = Number(parametreler.get("tohum")) || 1453;
const SENARYO_YOLU = `${import.meta.env.BASE_URL}senaryo-1453/`;

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
    { kap: $("tuvalKap"), etiketKap: $("etiketler"), kagit: $("kagit"), bilgi: $("bilgi"), ipucu: $("ipucu") },
    katmanAyarlari);
  for (const id of ["kArazi", "kNehir", "kSehir", "kEtiket", "kGuven"]) $(id).addEventListener("change", gorunum.istek);
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-git]")) {
    b.onclick = () => gorunum.git(b.dataset.git as keyof typeof KONUMLAR);
  }

  // --- Simülasyon
  const sim = new SimIstemcisi();
  let ozet: Ozet = (await sim.gonder({ tip: "yeniOyun", senaryo, tohum: TOHUM, oyuncu: parametreler.get("devlet") ?? undefined })).ozet;
  let mesgul = false;

  const arayuzuGuncelle = () => {
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
    gorunum.oyuncuyuAyarla(ozet.oyuncu.indeks);
  };

  const turuIlerlet = async () => {
    if (mesgul) return;
    mesgul = true;
    $<HTMLButtonElement>("ilerleBtn").disabled = true;
    try {
      const y = await sim.gonder({ tip: "turuIlerlet" });
      ozet = y.ozet;
      $("sonTur").textContent = `Son tur: ${Math.round(y.sureMs ?? 0)} ms`;
      if (y.sonuc?.kesinti) kesintiGoster(ozet.tarih, y.sonuc.kesinti.neden);
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
  $("kesintiTamam").onclick = () => { $("kesinti").hidden = true; };

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
    if (e.code !== "Space" || !$("kesinti").hidden) return;
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
