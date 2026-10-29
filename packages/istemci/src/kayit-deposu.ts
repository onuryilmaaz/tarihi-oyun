// Yerel kayıt deposu: IndexedDB (DEC-0023). Yuvalar: "otomatik" ve oyuncunun adlandırdığı kayıtlar ("kayit:…", 9a);
// eski sürümün "manuel" yuvası da listelenir.
// Her yazma tek bir IndexedDB işleminde yapılır; işlem ya tamamen yazılır ya hiç yazılmaz (atomik).
// Kayıt metni yazılmadan önce simülasyonda üretilmiş ve doğrulanmış olmalıdır.

export type Yuva = string;

export interface KayitKaydi {
  metin: string;
  oyunTarihi: string; // ör. "1 Mayıs 1453"
  devlet: string;
  zaman: number; // gerçek zaman (yalnızca listelemek için)
  ad?: string; // oyuncunun verdiği kayıt adı (9a)
}

const VT = "tarihi-oyun";
const DEPO = "kayitlar";

function ac(): Promise<IDBDatabase> {
  return new Promise((cozum, red) => {
    const istek = indexedDB.open(VT, 1);
    istek.onupgradeneeded = () => istek.result.createObjectStore(DEPO);
    istek.onsuccess = () => cozum(istek.result);
    istek.onerror = () => red(istek.error);
  });
}

export async function kayitYaz(yuva: Yuva, kayit: KayitKaydi): Promise<void> {
  const vt = await ac();
  await new Promise<void>((cozum, red) => {
    const islem = vt.transaction(DEPO, "readwrite");
    islem.objectStore(DEPO).put(kayit, yuva);
    islem.oncomplete = () => cozum();
    islem.onerror = () => red(islem.error);
    islem.onabort = () => red(islem.error ?? new Error("Kayıt işlemi iptal edildi."));
  });
  vt.close();
}

export async function kayitOku(yuva: Yuva): Promise<KayitKaydi | null> {
  const vt = await ac();
  const sonuc = await new Promise<KayitKaydi | null>((cozum, red) => {
    const istek = vt.transaction(DEPO, "readonly").objectStore(DEPO).get(yuva);
    istek.onsuccess = () => cozum((istek.result as KayitKaydi | undefined) ?? null);
    istek.onerror = () => red(istek.error);
  });
  vt.close();
  return sonuc;
}

/** Bütün kayıtlar, en yeniden eskiye. */
export async function kayitlariListele(): Promise<{ yuva: Yuva; kayit: KayitKaydi }[]> {
  const vt = await ac();
  const sonuc = await new Promise<{ yuva: Yuva; kayit: KayitKaydi }[]>((cozum, red) => {
    const depo = vt.transaction(DEPO, "readonly").objectStore(DEPO);
    const anahtar = depo.getAllKeys(), deger = depo.getAll();
    deger.onsuccess = () => cozum((anahtar.result as string[]).map((yuva, i) => ({ yuva, kayit: deger.result[i] as KayitKaydi })));
    deger.onerror = () => red(deger.error);
  });
  vt.close();
  return sonuc.sort((a, b) => b.kayit.zaman - a.kayit.zaman);
}

export async function kayitSil(yuva: Yuva): Promise<void> {
  const vt = await ac();
  await new Promise<void>((cozum, red) => {
    const islem = vt.transaction(DEPO, "readwrite");
    islem.objectStore(DEPO).delete(yuva);
    islem.oncomplete = () => cozum();
    islem.onerror = () => red(islem.error);
  });
  vt.close();
}
