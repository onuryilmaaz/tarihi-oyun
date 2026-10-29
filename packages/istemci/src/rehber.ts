// İlk oyun rehberi (TASK-0012/9c): ilgili arayüz öğesini vurgulayıp kısa açıklama gösteren, atlanabilir adımlar.
// Oyunun kendi penceresidir (tarayıcı penceresi yok). İlk yeni oyunda kendiliğinden açılır; Menü → "Nasıl oynanır"dan tekrar açılır.

export interface RehberAdimi {
  baslik: string;
  metin: string;
  hedef?: string; // vurgulanacak öğenin CSS seçicisi (yoksa ekran ortasında)
  once?: () => void; // adım gösterilmeden önce (ör. sekme açmak)
}

export const ADIMLAR: RehberAdimi[] = [
  { baslik: "Hoş geldiniz", metin: "1453 baharındasınız. Belirlenmiş bir zafer koşulu yok: devletinizi yönetin, tarihi yeniden yazın. Bu kısa rehberi istediğiniz an atlayabilirsiniz." },
  { baslik: "Devletiniz", hedef: "#devletBaslik", metin: "Sol üstte armanız, hükümdarınız ve resmî dininiz. Hükümdar ölünce oyun bitmez; halefi siz seçersiniz." },
  { baslik: "Zaman", hedef: "#sureler", metin: "Tur süresini seçin: hafta, ay, 3 ay ya da yıl. Simülasyon her durumda gün gün işler; yalnızca ne kadar ilerleyeceğinizi seçersiniz." },
  { baslik: "Turu ilerletmek", hedef: "#ilerleBtn", metin: "Emirleriniz bir sonraki turun başında uygulanır. Boşluk tuşu da turu ilerletir. Önemli bir olay olursa (muharebe, savaş ilanı, barış teklifi) tur kendiliğinden durur." },
  { baslik: "Harita", hedef: "#tuvalKap", metin: "Bir devlete tıklayın; tekrar tıklayınca araziyi, şehre tıklayınca şehri seçersiniz. Esc bir üst seviyeye çıkar. Fareyle sürükleyip tekerlekle yakınlaştırın." },
  { baslik: "Harita modları", hedef: "#haritaModlari", metin: "Diplomasi (dost/düşman), Din, İstikrar (isyan riski) ve Kültür modları haritayı boyar. Aynı düğmeye tekrar basınca siyasi haritaya dönersiniz." },
  { baslik: "Sol panel", hedef: "#sekmeler", metin: "Devlet: bütçe, hükümdar, araştırma. Ordu: ordular, kuşatma, asker toplama. Deniz: donanmalar. Şehir: yatırımlar. Savaş: savaşlar, casusluk. Günlük: olaylar." },
  { baslik: "Ordular", hedef: '[data-sekme="ordu"]', once: () => document.querySelector<HTMLElement>('[data-sekme="ordu"]')?.click(),
    metin: "Bir ordu seçip haritada sağ tıklayarak hedef verin; varış süresi arazi, nehir ve boğazlara göre hesaplanır. Yabancı topraklara girmek için savaş ilan etmelisiniz (devletin panelinden)." },
  { baslik: "Şehirler", hedef: '[data-sekme="sehir"]', once: () => document.querySelector<HTMLElement>('[data-sekme="sehir"]')?.click(),
    metin: "Şehrinize tıklayın: tarla ve pazar gelir, sur kuşatmaya direnç verir. Liman şehirlerinde tersane ve ticaret, her şehirde nüfus ve isyan riski görünür." },
  { baslik: "Teknoloji", hedef: "#teknolojiAc", metin: "Aynı anda iki araştırma yürütebilirsiniz; ikisi farklı alanlarda olmalı. Bedel başta ödenir, borçlanma yoktur." },
  { baslik: "Kayıt", hedef: "#kayitlar", metin: "Kaydet ile adlandırılmış kayıt alın, Yükle ile dönün. Her tur sonunda otomatik kayıt da yapılır. ☰ Menü'de yeni oyun, kaynaklar ve bu rehber var." },
  { baslik: "Hazırsınız", metin: "Önemli kural: borç yoktur. Hazine yalnızca zorunlu giderlerden (maaş, bakım) eksiye düşebilir. Terimler için Menü → Nasıl oynanır → Sözlük. İyi oyunlar!" },
];

let aktif = -1;
let kapatinca: (() => void) | null = null;

function el<K extends keyof HTMLElementTagNameMap>(etiket: K, sinif: string, ust: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(etiket);
  e.className = sinif;
  ust.append(e);
  return e;
}

function goster() {
  document.querySelector("#rehber")?.remove();
  if (aktif < 0 || aktif >= ADIMLAR.length) return;
  const a = ADIMLAR[aktif];
  a.once?.();
  const kok = document.createElement("div");
  kok.id = "rehber";
  document.body.append(kok);
  const hedef = a.hedef ? document.querySelector<HTMLElement>(a.hedef) : null;
  const r = hedef?.getBoundingClientRect();
  const isik = el("div", "rehber-isik", kok);
  if (r && r.width > 0) {
    const p = 6;
    Object.assign(isik.style, { left: `${r.left - p}px`, top: `${r.top - p}px`, width: `${r.width + 2 * p}px`, height: `${r.height + 2 * p}px` });
  } else Object.assign(isik.style, { left: "50%", top: "50%", width: "0px", height: "0px" });
  const kutu = el("div", "rehber-kutu panel", kok);
  kutu.setAttribute("role", "dialog");
  kutu.setAttribute("aria-label", a.baslik);
  kutu.innerHTML = `<small>${aktif + 1} / ${ADIMLAR.length}</small><h3>${a.baslik}</h3><p>${a.metin}</p>
    <div class="satir"><button data-r="atla">Rehberi kapat</button><span></span>${aktif > 0 ? '<button data-r="geri">‹ Geri</button>' : ""}
    <button data-r="ileri" class="birincil">${aktif === ADIMLAR.length - 1 ? "Başla" : "İleri ›"}</button></div>`;
  // Kutuyu hedefin yanına yerleştir; sığmazsa ortaya
  const W = window.innerWidth, H = window.innerHeight, kw = 360, kh = kutu.offsetHeight || 180;
  let x = W / 2 - kw / 2, y = H / 2 - kh / 2;
  if (r && r.width > 0) {
    if (r.right + 16 + kw < W) { x = r.right + 16; y = Math.min(Math.max(12, r.top), H - kh - 12); }
    else if (r.bottom + 16 + kh < H) { x = Math.min(Math.max(12, r.left), W - kw - 12); y = r.bottom + 16; }
    else if (r.top - 16 - kh > 0) { x = Math.min(Math.max(12, r.left), W - kw - 12); y = r.top - 16 - kh; }
  }
  Object.assign(kutu.style, { left: `${x}px`, top: `${y}px`, width: `${kw}px` });
  kutu.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-r]");
    if (!b) return;
    if (b.dataset.r === "atla") return rehberiKapat();
    aktif += b.dataset.r === "geri" ? -1 : 1;
    if (aktif >= ADIMLAR.length) rehberiKapat(); else goster();
  });
  kutu.querySelector<HTMLButtonElement>('[data-r="ileri"]')?.focus();
}

export function rehberiBaslat(bitince?: () => void) {
  aktif = 0;
  kapatinca = bitince ?? null;
  goster();
}

export function rehberiKapat() {
  aktif = -1;
  document.querySelector("#rehber")?.remove();
  try { localStorage.setItem("tarihi-rehber-goruldu", "1"); } catch { /* depolama kapalı olabilir */ }
  kapatinca?.();
  kapatinca = null;
}

export const rehberAcik = () => aktif >= 0;
export const rehberGoruldu = () => { try { return localStorage.getItem("tarihi-rehber-goruldu") === "1"; } catch { return false; } };

// Pencere boyutu değişirse vurguyu yeniden hesapla; Esc rehberi kapatır
window.addEventListener("resize", () => { if (aktif >= 0) goster(); });
window.addEventListener("keydown", (e) => { if (aktif >= 0 && e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); rehberiKapat(); } }, true);
