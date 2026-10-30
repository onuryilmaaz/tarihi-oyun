// TASK-0015 / H-02: barış ve devletin yıkılması aynı savaş temizliğini kullanır.
import { olayEkle, type DunyaDurumu, type Savas } from "./durum";
import { sayiMetni } from "./savas";

export function savasiSonlandir(d: DunyaDurumu, s: Savas): void {
  const taraf = (i: number) => i === s.saldiran || i === s.savunan;
  const biten = new Set(d.muharebeler.filter((m) => m.taraflar.every((t) => taraf(t.devlet))).map((m) => m.id));
  for (const o of d.ordular) if (o.muharebe !== null && biten.has(o.muharebe)) o.muharebe = null;
  d.muharebeler = d.muharebeler.filter((m) => !biten.has(m.id));
  d.kusatmalar = d.kusatmalar.filter((k) => !(taraf(k.devlet) && taraf(k.savunan)));
  d.isgalHazirliklari = d.isgalHazirliklari.filter((p) => !(taraf(p.devlet) && taraf(d.birimler[p.birim].sahip)));
  for (const b of d.birimler) if (taraf(b.sahip) && taraf(b.kontrol)) { b.kontrol = b.sahip; b.isgalBaslangic = null; }
  for (const c of d.sehirler) if (taraf(c.devlet) && taraf(c.kontrol)) { c.kontrol = c.devlet; c.isgalBaslangic = null; }
  d.savaslar = d.savaslar.filter((w) => w.id !== s.id);
  d.barisTeklifleri = d.barisTeklifleri.filter((t) => t.savas !== s.id);
}

/** Yıkılan devletin savaş işlemlerini bitirir; kalan ordusu dağılır (TASK-0018, OPEN-024). */
export function yikilanDevletleriTemizle(d: DunyaDurumu): void {
  const yasayan = new Set([...d.birimler.map((b) => b.sahip), ...d.sehirler.map((c) => c.devlet)]);
  for (const s of [...d.savaslar]) {
    const olu = [s.saldiran, s.savunan].find((i) => !yasayan.has(i));
    if (olu === undefined) continue;
    savasiSonlandir(d, s);
    const diger = olu === s.saldiran ? s.savunan : s.saldiran;
    olayEkle(d, { tur: "savas-bitti", devlet: diger === d.ayarlar.oyuncu ? diger : null,
      metin: `${d.devletler[olu].ad} yıkıldığı için ${d.devletler[diger].ad} ile savaşı sona erdi.` });
  }
  d.ittifaklar = d.ittifaklar.filter((a) => yasayan.has(a.a) && yasayan.has(a.b));
  const dagilanAsker = new Map<number, number>();
  d.ordular = d.ordular.filter((o) => {
    if (yasayan.has(o.devlet)) return true;
    dagilanAsker.set(o.devlet, (dagilanAsker.get(o.devlet) ?? 0) + o.asker);
    return false;
  });
  for (const [devlet, asker] of dagilanAsker) {
    olayEkle(d, { tur: "devlet-yikildi", devlet: null,
      metin: `${d.devletler[devlet].ad} yıkıldı; toprağı kalmayan ${sayiMetni(asker)} asker dağıldı.` });
  }
}

/** Eski H-02 kayıtlarında zaten silinmiş savaştan kalan ilişkiler. Yeni sahiplik üretmez. */
export function eskiSavasKalintilariniTemizle(d: DunyaDurumu): void {
  yikilanDevletleriTemizle(d);
  const savasVar = (a: number, b: number) => d.savaslar.some((s) =>
    (s.saldiran === a && s.savunan === b) || (s.saldiran === b && s.savunan === a));
  const biten = new Set(d.muharebeler.filter((m) => !savasVar(m.taraflar[0].devlet, m.taraflar[1].devlet)).map((m) => m.id));
  for (const o of d.ordular) if (o.muharebe !== null && biten.has(o.muharebe)) o.muharebe = null;
  d.muharebeler = d.muharebeler.filter((m) => !biten.has(m.id));
  d.kusatmalar = d.kusatmalar.filter((k) => savasVar(k.devlet, k.savunan));
  const yasayan = new Set([...d.birimler.map((b) => b.sahip), ...d.sehirler.map((s) => s.devlet)]);
  for (const b of d.birimler) if (!yasayan.has(b.kontrol) && b.kontrol >= 0) { b.kontrol = b.sahip; b.isgalBaslangic = null; }
  for (const s of d.sehirler) if (!yasayan.has(s.kontrol)) { s.kontrol = s.devlet; s.isgalBaslangic = null; }
  d.isgalHazirliklari = d.isgalHazirliklari.filter((p) => yasayan.has(p.devlet));
}
