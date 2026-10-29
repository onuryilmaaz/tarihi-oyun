// Oyunun kendi açılır liste penceresi (DEC-0054): <select> öğeleri yerinde kalır (değer, olaylar, mevcut kod aynen çalışır);
// yalnızca tarayıcının açılan liste penceresi yerine bu bileşen gösterilir. Fare ve klavyeyle (↑ ↓ Home End Enter Boşluk Esc,
// harfle arama) kullanılır. Seçim yapılınca select.value güncellenir ve "input" + "change" olayları gönderilir.

let acik: { sel: HTMLSelectElement; liste: HTMLDivElement; vurgu: number; arama: string; aramaZamani: number } | null = null;

function kapat(odakGeri = true) {
  if (!acik) return;
  const { sel, liste } = acik;
  liste.remove();
  sel.setAttribute("aria-expanded", "false");
  acik = null;
  if (odakGeri) sel.focus();
}

function sec(i: number) {
  if (!acik) return;
  const { sel } = acik;
  const o = sel.options[i];
  if (!o || o.disabled) return;
  const degisti = sel.selectedIndex !== i;
  sel.selectedIndex = i;
  kapat();
  if (degisti) {
    sel.dispatchEvent(new Event("input", { bubbles: true }));
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function vurgula(i: number) {
  if (!acik) return;
  const ogeler = acik.liste.querySelectorAll<HTMLElement>("[data-i]");
  acik.vurgu = i;
  ogeler.forEach((el) => el.classList.toggle("vurgulu", Number(el.dataset.i) === i));
  ogeler.forEach((el) => { if (Number(el.dataset.i) === i) el.scrollIntoView({ block: "nearest" }); });
}

/** i'den yön adımıyla ilerleyip ilk seçilebilir seçeneği bulur. */
function sonraki(sel: HTMLSelectElement, i: number, yon: 1 | -1): number {
  for (let j = i + yon; j >= 0 && j < sel.options.length; j += yon) if (!sel.options[j].disabled) return j;
  return i;
}

function ac(sel: HTMLSelectElement) {
  kapat(false);
  if (sel.disabled || !sel.options.length) return;
  const liste = document.createElement("div");
  liste.className = "secim-liste";
  liste.setAttribute("role", "listbox");
  [...sel.options].forEach((o, i) => {
    const el = document.createElement("div");
    el.className = `secim-oge${o.disabled ? " kapali" : ""}${i === sel.selectedIndex ? " secili" : ""}`;
    el.setAttribute("role", "option");
    el.setAttribute("aria-selected", String(i === sel.selectedIndex));
    el.dataset.i = String(i);
    el.textContent = o.textContent;
    liste.append(el);
  });
  liste.addEventListener("mousedown", (e) => e.preventDefault()); // odağı select'te tut
  liste.addEventListener("click", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-i]");
    if (el) sec(Number(el.dataset.i));
  });
  liste.addEventListener("mousemove", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-i]");
    if (el && !el.classList.contains("kapali") && Number(el.dataset.i) !== acik?.vurgu) vurgula(Number(el.dataset.i));
  });
  document.body.append(liste);
  // Konum: select'in altında; sığmazsa üstünde; genişlik en az select kadar
  const r = sel.getBoundingClientRect();
  liste.style.minWidth = `${Math.round(r.width)}px`;
  liste.style.left = `${Math.round(Math.min(r.left, window.innerWidth - liste.offsetWidth - 8))}px`;
  const asagi = window.innerHeight - r.bottom - 8, yukari = r.top - 8;
  const yukseklik = Math.min(liste.scrollHeight, 300);
  if (asagi >= yukseklik || asagi >= yukari) { liste.style.top = `${Math.round(r.bottom + 4)}px`; liste.style.maxHeight = `${Math.max(120, Math.min(300, asagi))}px`; }
  else { liste.style.maxHeight = `${Math.min(300, yukari)}px`; liste.style.top = `${Math.round(r.top - 4 - Math.min(liste.scrollHeight, Math.min(300, yukari)))}px`; }
  sel.setAttribute("aria-expanded", "true");
  acik = { sel, liste, vurgu: sel.selectedIndex, arama: "", aramaZamani: 0 };
  vurgula(sel.selectedIndex >= 0 ? sel.selectedIndex : sonraki(sel, -1, 1));
}

export function ozelSecimleriKur(): void {
  // Tarayıcının liste penceresi açılmasın: fareyle basınca kendi listemizi açarız
  document.addEventListener("mousedown", (e) => {
    const hedef = e.target as HTMLElement;
    if (acik && !acik.liste.contains(hedef) && hedef !== acik.sel) kapat(false);
    const sel = hedef.closest?.("select");
    if (!(sel instanceof HTMLSelectElement) || sel.multiple || sel.size > 1) return;
    e.preventDefault();
    if (acik?.sel === sel) { kapat(); return; }
    sel.focus();
    ac(sel);
  }, true);
  document.addEventListener("keydown", (e) => {
    const sel = e.target instanceof HTMLSelectElement ? e.target : null;
    if (!acik) {
      if (sel && !sel.multiple && (e.key === " " || e.key === "Enter" || ((e.key === "ArrowDown" || e.key === "ArrowUp") && e.altKey))) {
        e.preventDefault(); ac(sel);
      }
      return;
    }
    const s = acik.sel;
    if (e.key === "Escape" || e.key === "Tab") { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); } kapat(e.key === "Escape"); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); vurgula(sonraki(s, acik.vurgu, 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); vurgula(sonraki(s, acik.vurgu, -1)); }
    else if (e.key === "Home") { e.preventDefault(); vurgula(sonraki(s, -1, 1)); }
    else if (e.key === "End") { e.preventDefault(); vurgula(sonraki(s, s.options.length, -1)); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sec(acik.vurgu); }
    else if (e.key.length === 1) {
      // harfle arama: yazılan harflerle başlayan ilk seçenek
      const simdi = e.timeStamp;
      acik.arama = (simdi - acik.aramaZamani < 700 ? acik.arama : "") + e.key.toLocaleLowerCase("tr-TR");
      acik.aramaZamani = simdi;
      const i = [...s.options].findIndex((o) => !o.disabled && (o.textContent ?? "").toLocaleLowerCase("tr-TR").startsWith(acik!.arama));
      if (i >= 0) { e.preventDefault(); vurgula(i); }
    }
  }, true);
  // Sayfa kayar ya da boyut değişirse liste kopmasın: kapat
  window.addEventListener("resize", () => kapat(false));
  document.addEventListener("scroll", (e) => { if (acik && !acik.liste.contains(e.target as Node)) kapat(false); }, true);
}
