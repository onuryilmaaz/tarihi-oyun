// TASK-0020 (3/3, DEC-0069): hükümdar/devlet portresi — basit, deterministik insan silüeti/avatarı.
// Saf görsel; tarihî/fotoğrafik iddia taşımaz, oyun mantığını etkilemez, yeni veri/şema gerektirmez.
// Ad bireysel özellikleri (ten/saç) belirler; hanedan ortak aksesuar rengini belirler (aynı hanedandan
// hükümdarlar benzer bir "taç şeridi" rengi paylaşır).

function karma(metin: string): number {
  let h = 0;
  for (let i = 0; i < metin.length; i++) h = (h * 31 + metin.charCodeAt(i)) >>> 0;
  return h;
}

const TEN_RENKLERI = ["#e8b98c", "#d9a06c", "#c48a53", "#a66b3d", "#8a5634"];
const SAC_RENKLERI = ["#2b2118", "#3b2a1a", "#5a3d22", "#6b6b6b", "#1a1a1a"];
const AKSESUAR_RENKLERI = ["#c9a227", "#8a1f1f", "#2f4f6f", "#5a3d7a", "#1f6b4f"];

/** Kişi portresi: basit insan silüeti, deterministik renklerle. ad: soydaki bireyi, hanedan: aksesuar rengini seçer. */
export function portreSvg(ad: string, hanedan: string): string {
  const h1 = karma(ad), h2 = karma(hanedan || ad);
  const ten = TEN_RENKLERI[h1 % TEN_RENKLERI.length];
  const sac = SAC_RENKLERI[(h1 >>> 3) % SAC_RENKLERI.length];
  const aksesuar = AKSESUAR_RENKLERI[h2 % AKSESUAR_RENKLERI.length];
  return `<svg viewBox="0 0 48 48" role="img" aria-label="${ad} portresi">
    <circle cx="24" cy="24" r="23" fill="#f3ead6" stroke="#2b2118" stroke-width="1"/>
    <path d="M7 41c0-10.5 7.5-16 17-16s17 5.5 17 16z" fill="${ten}"/>
    <circle cx="24" cy="19" r="10.5" fill="${ten}"/>
    <path d="M13.3 16a10.5 10.5 0 0 1 21.4 0c0-6.5-4.8-11-10.7-11s-10.7 4.5-10.7 11z" fill="${sac}"/>
    <rect x="11" y="7" width="26" height="5" rx="2.2" fill="${aksesuar}" stroke="#2b2118" stroke-width=".6"/>
  </svg>`;
}
