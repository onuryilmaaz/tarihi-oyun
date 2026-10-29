// Oyunun kendi ürettiği devlet armaları (DEC-0052): lisanslı görsel kullanılmaz. Kalkan devletin harita rengiyle
// doldurulur; ortadaki simge resmî dine göre seçilir (veri yoksa adın baş harfi). Tarihî arma iddiası taşımaz.

const SIMGE: Record<string, string> = {
  // hilal ve yıldız
  islam: `<path d="M30 17a13 13 0 1 0 9 22.5a10.5 10.5 0 1 1 0-19A13 13 0 0 0 30 17z" class="s"/>
    <path d="M40.5 25.5l1.6 3.4 3.7.5-2.7 2.6.7 3.7-3.3-1.8-3.3 1.8.7-3.7-2.7-2.6 3.7-.5z" class="s"/>`,
  // Latin haçı
  katolik: `<path d="M27 14h6v9h9v6h-9v17h-6V29h-9v-6h9z" class="s"/>`,
  // Ortodoks haçı (üç kollu)
  ortodoks: `<path d="M28 13h4v4h6v3h-6v6h9v4h-9v16h-4V30h-9v-4h9v-6h-6v-3h6z" class="s"/><path d="M22 41l16-5v3l-16 5z" class="s"/>`,
  // Doğu kiliseleri: uçları genişleyen haç
  ermeni: `<path d="M26 14h8l-1 9 9-1v8l-9-1 1 15h-8l1-15-9 1v-8l9 1z" class="s"/>`,
  // altı köşeli yıldız
  yahudi: `<path d="M30 15l10 17H20z" class="c"/><path d="M30 45L20 28h20z" class="c"/>`,
  // dharma çarkı
  budist: `<circle cx="30" cy="31" r="12" class="c"/><circle cx="30" cy="31" r="3" class="s"/>
    <path d="M30 19v24M18 31h24M21.5 22.5l17 17M38.5 22.5l-17 17" class="c"/>`,
  // güneş
  hindu: `<circle cx="30" cy="31" r="7" class="s"/><path d="M30 17v6M30 39v6M16 31h6M38 31h6M20 21l4 4M36 37l4 4M40 21l-4 4M24 37l-4 4" class="c"/>`,
};
const AILE: Record<string, string> = { sunni: "islam", sii: "islam", katolik: "katolik", ortodoks: "ortodoks", ermeni: "ermeni",
  yahudi: "yahudi", budist: "budist", hindu: "hindu" };

/** Kalkan biçimli SVG arma. renk: #rrggbb, din: resmî din kimliği, ad: harf yedeği için devlet adı. */
export function armaSvg(renk: string, din: string, ad: string): string {
  const simge = SIMGE[AILE[din] ?? ""]
    ?? `<text x="30" y="40" text-anchor="middle" font-family="Cinzel, serif" font-size="24" font-weight="600" class="s">${ad.trim().charAt(0).toLocaleUpperCase("tr-TR")}</text>`;
  return `<svg viewBox="0 0 60 66" role="img" aria-label="${ad} arması"><style>.s{fill:#f3ead6;stroke:#2b2118;stroke-width:1}.c{fill:none;stroke:#f3ead6;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}</style>
    <path d="M5 5h50v26c0 18-25 31-25 31S5 49 5 31z" fill="${renk}" stroke="#c9a227" stroke-width="3"/>
    ${simge}</svg>`;
}
