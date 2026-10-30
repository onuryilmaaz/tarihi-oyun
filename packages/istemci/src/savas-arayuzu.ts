// TASK-0007/4c — kurallar Worker'dadır; bu modül kuşatma emirlerini ve barış önizlemesini gösterir.
import { DENGE, tarihMetni, type BarisTalebi, type Emir, type KusatmaYontemi } from "@tarihi/sim";
import type { Ozet, Yanit } from "./sim-protokol";
import { kacis } from "./harita/gorunum";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const YONTEMLER: [KusatmaYontemi, string][] = [["abluka", "Kara ablukası"], ["saldiri", "Surlara saldırı"], ["bekle", "Teslim bekle"]];
type BarisOnizleme = NonNullable<Extract<Yanit, { tamam: true }>["baris"]>;

export function savasArayuzuKur(a: {
  ozet(): Ozet;
  seciliOrdu(): number | null;
  sehirAdi(i: number): string;
  birimAdi(i: number): string;
  devletAdi(i: number): string;
  emir(e: Emir, mesaj: string): Promise<boolean>;
  onizle(t: BarisTalebi): Promise<BarisOnizleme>;
  onay(baslik: string, metin: string, evet: string): Promise<boolean>;
  bildir(metin: string): void;
}) {
  let barisSavasi: number | null = null, onizlemeNo = 0;
  const devirMetni = (r: BarisOnizleme) => !r.devir ? "" :
    ` Devir: ${r.devir.alinanArazi} arazi, ${r.devir.alinanSehir} şehir. `
    + (r.devir.tamIlhak ? "Tam ilhak: karşı tarafın arazi ve şehri kalmayacak."
      : `Karşı tarafta ${r.devir.kalanArazi} arazi ve ${r.devir.kalanSehir} şehir kalacak; devlet varlığını sürdürecek.`)
    + " Şehirler çevre araziyle otomatik devredilmez.";
  function barisKapat() { $("baris").hidden = true; barisSavasi = null; onizlemeNo++; }
  $("barisKapat").onclick = barisKapat;
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("baris").hidden && $("onay").hidden) { e.preventDefault(); barisKapat(); }
  });
  function formTalebi(): BarisTalebi {
    return { savas: barisSavasi!, tazminat: $<HTMLInputElement>("barisTazminat").valueAsNumber,
      birimler: [...document.querySelectorAll<HTMLInputElement>("[data-baris-birim]:checked")].map((e) => Number(e.dataset.barisBirim)),
      sehirler: [...document.querySelectorAll<HTMLInputElement>("[data-baris-sehir]:checked")].map((e) => Number(e.dataset.barisSehir)) };
  }
  async function onizle() {
    const no = ++onizlemeNo;
    $<HTMLButtonElement>("barisGonder").disabled = true;
    if (barisSavasi === null) return;
    try {
      const r = await a.onizle(formTalebi());
      if (no !== onizlemeNo || $("baris").hidden) return;
      $("barisSonuc").dataset.gecerli = String(r.dogrulama.gecerli);
      $("barisSonuc").textContent = `Talep: ${Number.isFinite(r.puan) ? r.puan : "—"} puan · Savaş skoru: ${r.skor}. `
        + (r.dogrulama.gecerli ? "Bu koşullar kabul edilebilir. Antlaşma bir sonraki turun başında yeniden kontrol edilir." : r.dogrulama.neden)
        + devirMetni(r);
      $<HTMLButtonElement>("barisGonder").disabled = !r.dogrulama.gecerli;
    } catch (e) { if (no === onizlemeNo) $("barisSonuc").textContent = (e as Error).message; }
  }
  $("barisKosullari").onchange = onizle;
  $("barisTazminat").oninput = onizle;
  $("barisGonder").onclick = async () => {
    if (barisSavasi === null) return;
    const t = formTalebi(), s = a.ozet().savaslar.find((v) => v.id === t.savas);
    if (!s) return barisKapat();
    const r = await a.onizle(t);
    if (!r.dogrulama.gecerli) { a.bildir(r.dogrulama.neden); return onizle(); }
    const yerler = [...t.birimler.map(a.birimAdi), ...t.sehirler.map(a.sehirAdi)];
    if (!await a.onay("Barış antlaşması", `${a.devletAdi(s.karsi)} ile ${yerler.length ? yerler.join(", ") + " devri ve " : "toprak devri olmadan "}${t.tazminat} peşin tazminat karşılığında barış yapılsın mı? Seçilmeyen işgaller kalkacak.${devirMetni(r)}`, "Barış teklif et")) return;
    if (await a.emir({ tur: "baris", ...t }, "Barış teklifi verildi; bir sonraki turun başında uygulanacak.")) barisKapat();
  };
  function barisAc(savas: number) {
    const s = a.ozet().savaslar.find((v) => v.id === savas);
    if (!s) return;
    barisSavasi = savas;
    $("barisBaslik").textContent = `${a.devletAdi(s.karsi)} ile barış`;
    $("barisSkor").textContent = `Savaş skoru ${s.skor}: alınan işgal değeri ${s.alinan}, kaybedilen ${s.kaybedilen}, düşmanın toplam varlık değeri ${s.toplam}. Başkent tek başına savaşı bitirmez.`;
    const kutu = (baslik: string, liste: number[], tur: "birim" | "sehir", ad: (i: number) => string) =>
      `<fieldset><legend>${baslik}</legend>${liste.map((i) => `<label><input type="checkbox" data-baris-${tur}="${i}" /> ${kacis(ad(i))}</label>`).join("") || '<span class="not">Talep edilebilir işgal yok.</span>'}</fieldset>`;
    $("barisKosullari").innerHTML = kutu("Arazi", s.birimler, "birim", a.birimAdi) + kutu("Şehir", s.sehirler, "sehir", a.sehirAdi);
    $<HTMLInputElement>("barisTazminat").value = "0";
    $("baris").hidden = false;
    $("barisKapat").focus();
    void onizle();
  }
  $("savasListesi").addEventListener("click", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-baris]");
    if (el) barisAc(Number(el.dataset.baris));
  });

  function guncelle() {
    const d = a.ozet(), o = d.ordular.find((v) => v.id === a.seciliOrdu());
    const k = o?.kusatma !== null ? d.kusatmalar.find((v) => v.sehir === o?.kusatma) : undefined;
    const secim = document.getElementById("kusatmaSehir") as HTMLSelectElement | null;
    const once = secim?.value;
    const hedefler = o?.kusatmaEmriBekliyor ? [] : o?.kusatilabilir ?? [];
    $("kusatmaPaneli").innerHTML = o ? `<p class="not">${k ? `${kacis(a.sehirAdi(k.sehir))} kuşatılıyor · ${k.gun} etkin gün.` : "Şehir yakınında bekleyen orduya kuşatma emri verin."}</p>
      ${o.kusatmaEmriBekliyor ? '<p class="not">Kuşatma emri bir sonraki turu bekliyor.</p>' : hedefler.length ? `
      <label for="kusatmaSehir">Hedef şehir</label><select id="kusatmaSehir">${hedefler.map((i) => `<option value="${i}">${kacis(a.sehirAdi(i))}</option>`).join("")}</select>
      <label for="kusatmaYontem">Yöntem</label><select id="kusatmaYontem">${YONTEMLER.map(([v, ad]) => `<option value="${v}" ${k?.yontem === v ? "selected" : ""}>${ad}</option>`).join("")}</select>
      <p class="not">Saldırı daha hızlı ve kayıplıdır. Abluka erzağı daha hızlı azaltır; teslim bekleme daha yavaştır. Yetersiz güç ilerleyemez.</p>
      <button id="kusatBtn">${k ? "Yöntemi uygula" : "Kuşatmayı başlat"}</button>`
      : `<p class="not">Şehir noktasına ${DENGE.KUSATMA_MENZIL_M / 1000} km içinde beklemelisiniz. Şehri seçip “Şehre yürü” düğmesini kullanabilirsiniz.</p>`}
      ${k ? '<button id="kusatmaBirak">Kuşatmadan ayrıl</button>' : ""}`
      : '<p class="not">Kuşatma için önce bir ordu seçin.</p>';
    if (once && hedefler.includes(Number(once))) $<HTMLSelectElement>("kusatmaSehir").value = once;
    const baslat = document.getElementById("kusatBtn");
    if (baslat && o) baslat.onclick = () => { void a.emir({ tur: "kusat", ordu: o.id,
      sehir: Number($<HTMLSelectElement>("kusatmaSehir").value), yontem: $<HTMLSelectElement>("kusatmaYontem").value as KusatmaYontemi }, "Kuşatma emri verildi; bir sonraki turda uygulanacak."); };
    const birak = document.getElementById("kusatmaBirak");
    if (birak && o) birak.onclick = () => { void a.emir({ tur: "kusatmaBirak", ordu: o.id }, "Kuşatmadan ayrılma emri verildi."); };
    $("kusatmaListesi").innerHTML = d.kusatmalar.map((v) => {
      const s = d.sehirDurumlari[v.sehir];
      return `<li>${kacis(a.sehirAdi(v.sehir))} · ${YONTEMLER.find(([y]) => y === v.yontem)![1]} · ${v.gun} etkin gün<br />
        Sur ${s.sur} · Garnizon ${s.garnizonTahmin ? "~" : ""}${s.garnizon.toLocaleString("tr-TR")} · Erzak ${v.devlet === d.oyuncu.indeks ? "~" : ""}%${Math.round(v.erzak / 10)}
        ${v.gucYeterli === false ? "<br />Kuşatan güç yetersiz; ilerleme bekliyor." : ""}</li>`;
    }).join("");
    $("barisGecmisi").innerHTML = [...d.barislar].reverse().slice(0, 3).map((p) => `<li>${kacis(tarihMetni(p.gun))}: ${kacis(a.devletAdi(p.karsi))} ile barış; ${p.birimler.length} arazi, ${p.sehirler.length} şehir, ${p.tazminat} tazminat.</li>`).join("");
    if (barisSavasi !== null && !d.savaslar.some((s) => s.id === barisSavasi)) barisKapat();
  }
  return { guncelle, barisAc };
}
