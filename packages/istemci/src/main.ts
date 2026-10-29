// Oyun istemcisi (TASK-0005): harita + üst durum çubuğu + tur akışı + yerel kayıt.
// Simülasyon Web Worker'da çalışır (DEC-0023); bu dosya yalnızca arayüzü yönetir.

import "@fontsource/cinzel/600.css";
import "@fontsource/cormorant-garamond/700-italic.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/700.css";
import { DENGE, tarihMetni, toplamaMaliyeti, type Emir, type MuharebeRaporu, type SenaryoVerisi, type Tutum, type TurSuresi } from "@tarihi/sim";
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
    ordularPaneli();
    toplamaPaneli();
    $("orduGideri").textContent = `Aylık toplam maaş: ${ozet.aylikMaas.toLocaleString("tr-TR")}. Kullanılabilir hazine: ${ozet.kullanilabilirHazine.toLocaleString("tr-TR")}.`
      + (ozet.oyuncu.hazine < 0 ? ` Maaş aksıyor: her gün ${DENGE.MAAS_AKSAMASI_MORAL / 10} puan moral kaybı; toparlanma yok. Borç/faiz yoktur.` : " Maaş her ayın ilk günü zorunlu gider olarak alınır.");
    const butce = ozet.butce;
    const para = (n: number) => n.toLocaleString("tr-TR");
    $("butceKalemleri").innerHTML = `<dt>Hazine</dt><dd>${para(butce.hazine)}</dd>
      <dt>Emirlere ayrılan</dt><dd>${para(butce.ayrilan)}</dd><dt>Kullanılabilir</dt><dd>${para(butce.kullanilabilir)}</dd>
      <dt>Aylık gelir (prototip)</dt><dd>+${para(butce.aylikGelir)}<small class="not"> · ${para(butce.araziSayisi)} arazi</small></dd>
      <dt>Aylık ordu maaşı</dt><dd>−${para(butce.aylikMaas)}<small class="not"> · ${para(butce.askerSayisi)} asker</small></dd>
      <dt>Aylık fark</dt><dd id="butceNet" class="${butce.aylikNet < 0 ? "eksi" : "artı"}">${butce.aylikNet > 0 ? "+" : ""}${para(butce.aylikNet)}</dd>`;
    $("savasListesi").innerHTML = ozet.savaslar.map((s) =>
      `<li>${gorunum.devletRenkKutusu(s.karsi)}<span>${kacis(h.paket.devletler[s.karsi].ad)}<small>${s.saldiran ? "Siz ilan ettiniz" : "Size ilan etti"} · ${kacis(s.baslangic)}<br />Savaş skoru: ${s.skor}</small><button data-baris="${s.id}">Barış teklif et</button></span></li>`).join("")
      + [...bekleyenSavas].map((d) => `<li>${gorunum.devletRenkKutusu(d)}<span>${kacis(h.paket.devletler[d].ad)}<small>İlan edildi · bir sonraki turda başlar</small></span></li>`).join("")
      || '<li class="bos">Savaş yok. Bir devleti seçip savaş ilan edebilirsiniz.</li>';
    savasUI.guncelle();
    $("raporListesi").innerHTML = [...ozet.raporlar].reverse().map((r) => {
      const biz = r.kazanan === ozet.oyuncu.indeks;
      const karsi = r.taraflar.find((t) => t.devlet !== ozet.oyuncu.indeks)!;
      return `<li><button class="rapor-satir" data-rapor="${r.id}"><b class="${biz ? "zafer" : "yenilgi"}">${biz ? "Zafer" : "Yenilgi"}</b>
        ${kacis(h.paket.devletler[karsi.devlet].ad)}<small>${kacis(birimAdi(r.birim))} · ${kacis(tarihMetni(r.bitis))}</small></button></li>`;
    }).join("") || '<li class="bos">Henüz muharebe yok.</li>';
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
    $("toplamaListesi").innerHTML = ozet.toplamalar.map((t) => `<li>${kacis(t.sehir)} · ${t.asker.toLocaleString("tr-TR")} asker · ${t.emir ? "Emir bekliyor" : t.bekliyor ? "İşgal nedeniyle bekliyor" : `${t.kalanGun} gün kaldı`}</li>`).join("");
    toplamaBilgisi();
  };
  const toplamaBilgisi = () => {
    const sehir = ozet.askerSehirleri.find((s) => s.indeks === Number($<HTMLSelectElement>("toplamaSehir").value));
    const asker = $<HTMLInputElement>("toplamaAsker").valueAsNumber;
    const sayiUygun = Number.isSafeInteger(asker) && asker > 0;
    const bedel = sayiUygun ? toplamaMaliyeti(asker) : 0;
    $("toplamaBilgi").textContent = sehir
      ? `Kullanılabilir insan gücü: ${sehir.insanGucu.toLocaleString("tr-TR")}. ${DENGE.TOPLAMA_GUN} gün; bedel: ${bedel.toLocaleString("tr-TR")}.`
        + (!sehir.uygun ? " Şehir ve çevresi kontrolünüzde olmalı." : !sayiUygun ? " Pozitif tam sayı girin." : asker > sehir.insanGucu ? " İnsan gücü yetersiz." : ozet.kullanilabilirHazine < bedel ? " Hazine yetersiz; borçlanma yoktur." : " Yeni ordu şehirde kurulur.")
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
  $("raporListesi").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-rapor]");
    const r = b && ozet.raporlar.find((x) => x.id === Number(b.dataset.rapor));
    if (r) raporGoster(r);
  });

  // Bilgi paneli: yabancı devlet seçiliyken savaş durumu / savaş ilanı (MASTER_SPEC §7.1)
  gorunum.olaylar.ekBilgi = (s) => {
    if (s.tur === "sehir") {
      const c = ozet.sehirDurumlari[s.id], k = ozet.kusatmalar.find((v) => v.sehir === s.id);
      return `<h4>Şehir savunması (prototip değerleri)</h4><dl><dt>Sur seviyesi</dt><dd>${c.sur}</dd>
        <dt>Garnizon</dt><dd>${c.garnizonTahmin ? "Yaklaşık " : ""}${c.garnizon.toLocaleString("tr-TR")}</dd></dl>
        <p class="not">${k ? `${k.gun} etkin gündür kuşatma altında.` : c.kontrol === ozet.oyuncu.indeks
          ? c.devlet === ozet.oyuncu.indeks ? "Şehir size ait ve askerî kontrolünüzde." : "Şehir askerî kontrolünüzde; yasal sahiplik barış antlaşmasıyla değişir."
          : "Şehir hareketle ele geçirilmez; kuşatma emri gerekir."}</p>
        ${seciliOrdu !== null ? `<button data-sehir-hedef="${s.id}">Şehre yürü</button>` : '<p class="not">Şehre yürümek için önce ordunuzu seçin.</p>'}`;
    }
    if (s.tur === "birim") {
      const p = ozet.isgalHazirliklari.find((v) => v.birim === s.id);
      return p ? `<p class="not">Askerî kontrol kuruluyor: ${p.gun}/${DENGE.ISGAL_GUN} gün. Şehir ayrı kuşatılır.</p>` : "";
    }
    if (s.tur !== "devlet" || s.id === ozet.oyuncu.indeks) return "";
    const savas = ozet.savaslar.find((x) => x.karsi === s.id);
    if (savas) return `<p class="savas-durumu">⚔ Savaştasınız (${kacis(savas.baslangic)}) · Skor ${savas.skor}</p><button data-eylem="baris" data-savas="${savas.id}">Barış teklif et</button>`;
    if (bekleyenSavas.has(s.id)) return '<p class="savas-durumu">Savaş ilan edildi; bir sonraki turda başlar.</p>';
    return `<div class="satir eylem"><button class="tehlike" data-eylem="savas" data-devlet="${s.id}">Savaş ilan et</button></div>`;
  };
  $("bilgi").addEventListener("click", async (e) => {
    const sehir = (e.target as HTMLElement).closest<HTMLElement>("[data-sehir-hedef]");
    if (sehir) {
      const c = senaryo.sehirler[Number(sehir.dataset.sehirHedef)];
      if (c.x !== undefined && c.y !== undefined) await gorunum.olaylar.hedef?.(c.x / 1e4, c.y / 1e4, c.birim);
      return;
    }
    const baris = (e.target as HTMLElement).closest<HTMLElement>('[data-eylem="baris"]');
    if (baris) { savasUI.barisAc(Number(baris.dataset.savas)); return; }
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-eylem="savas"]');
    if (!b) return;
    const hedef = Number(b.dataset.devlet);
    const onay = await onayIste("Savaş ilanı", `${h.paket.devletler[hedef].ad}'na savaş ilan edilsin mi? Savaş bir sonraki turun başında başlar; ordularınız o devletin topraklarına girebilir. Diplomatik sonuçlar ileride (Aşama 6) eklenecek.`, "Savaş ilan et", true);
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
    if (e.code !== "Space" || !$("kesinti").hidden || !$("rapor").hidden || !$("onay").hidden || !$("baris").hidden) return;
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
