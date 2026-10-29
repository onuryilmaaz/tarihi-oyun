import { describe, expect, it } from "vitest";
import { KayitHatasi, durumOzeti, kaydet, turSuresiAyarla, turuIlerlet, yukle } from "../src";
import { yeniDurum } from "./yardimci";

describe("kayıt / yükleme", () => {
  it("AT-016 iskeleti: kaydet → yükle → devam = kesintisiz devam", () => {
    const a = yeniDurum();
    turSuresiAyarla(a, "ceyrek");
    for (let i = 0; i < 3; i++) turuIlerlet(a);
    const b = yukle(kaydet(a), a.senaryo);
    expect(durumOzeti(b)).toBe(durumOzeti(a));
    for (let i = 0; i < 6; i++) { turuIlerlet(a); turuIlerlet(b); }
    expect(durumOzeti(b)).toBe(durumOzeti(a));
  });

  it("bozuk kayıtlar güvenli hata verir", () => {
    const iyi = kaydet(yeniDurum());
    expect(() => yukle("{bozuk")).toThrow(KayitHatasi);
    expect(() => yukle(JSON.stringify({ tur: "baska" }))).toThrow(/oyun kaydı değil/);
    expect(() => yukle(iyi.replace('"sema":1', '"sema":99'))).toThrow(/daha yeni/);
    expect(() => yukle(iyi, "baska-senaryo@1")).toThrow(/farklı bir senaryo/);
    const p = JSON.parse(iyi);
    p.durum.devletler[0].hazine = 1.5;
    expect(() => yukle(JSON.stringify(p))).toThrow(/tutarsız/);
  });
});
