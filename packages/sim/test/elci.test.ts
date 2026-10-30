// TASK-0020 (2/3, DEC-0069): elçi gönderme.
import { describe, expect, it } from "vitest";
import {
  degismezler, DENGE, diplomasiOnHesap, elciEngeli, emirleriUygula, emirVer, etkiEkle, gunIlerlet, iliski, kullanilabilirHazine,
  type DunyaDurumu,
} from "../src";
import { yeniDurum } from "./yardimci";

const A = 0, B = 1, C = 2;
const on = (d: DunyaDurumu) => diplomasiOnHesap(d, null);
const sonuc = (d: DunyaDurumu, ...emirler: Parameters<typeof emirVer>[1][]) => {
  for (const e of emirler) expect(emirVer(d, e)).toEqual({ gecerli: true });
  emirleriUygula(d);
};

describe("elçi gönderme (TASK-0020 2/3)", () => {
  it("bedeli hemen ayırır; 60 gün sonra ilişkiye +15 ekler (hediyeyle aynı birikim/sönüm kuralı)", () => {
    const d = yeniDurum();
    d.devletler[A].hazine = 1000;
    sonuc(d, { tur: "elciGonder", hedef: B });
    expect(kullanilabilirHazine(d, A)).toBe(1000 - DENGE.ELCI_BEDEL);
    expect(d.elciler).toHaveLength(1);
    for (let i = 0; i < DENGE.ELCI_GUN - 1; i++) gunIlerlet(d);
    expect(iliski(d, on(d), B, A)).toBe(0); // henüz varmadı
    gunIlerlet(d);
    expect(d.elciler).toHaveLength(0);
    expect(iliski(d, on(d), B, A)).toBe(DENGE.ELCI_ILISKI);
    expect(d.gunluk.at(-1)!.metin).toMatch(/vardı.*\+15/);
    expect(degismezler(d)).toEqual([]);
  });

  it("birikim sınırını aşmaz ve zamanla söner", () => {
    const d = yeniDurum();
    d.devletler[A].hazine = 100000;
    etkiEkle(d, A, B, "elci", DENGE.ELCI_EN_COK - 5);
    sonuc(d, { tur: "elciGonder", hedef: B });
    for (let i = 0; i < DENGE.ELCI_GUN; i++) gunIlerlet(d);
    expect(iliski(d, on(d), B, A)).toBe(DENGE.ELCI_EN_COK); // 15 eklenecekken sınıra kırpıldı
    for (let i = 0; i < 70; i++) gunIlerlet(d); // en az bir ay başı daha geçer
    expect(iliski(d, on(d), B, A)).toBeLessThan(DENGE.ELCI_EN_COK);
  });

  it("aynı devlete ikinci elçi, ilki yoldayken gönderilemez; hazine yetersizse de reddedilir", () => {
    const d = yeniDurum();
    d.devletler[A].hazine = 100000;
    expect(elciEngeli(d, B)).toBeNull();
    sonuc(d, { tur: "elciGonder", hedef: B });
    expect(emirVer(d, { tur: "elciGonder", hedef: B }).gecerli).toBe(false);
    expect(emirVer(d, { tur: "elciGonder", hedef: C }).gecerli).toBe(true); // başka devlete gönderilebilir
    const d2 = yeniDurum();
    d2.devletler[A].hazine = 10;
    expect(emirVer(d2, { tur: "elciGonder", hedef: B }).gecerli).toBe(false);
    expect(emirVer(d2, { tur: "elciGonder", hedef: A }).gecerli).toBe(false); // kendine gönderilemez
  });
});
