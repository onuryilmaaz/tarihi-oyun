// TASK-0028 (DEC-0078): gelişmişlik ve gelir kaynağı
import { describe, expect, it } from "vitest";
import {
  araziGelirleri, DENGE, degismezler, gelismislikYuzde, insaatlariIlerlet, sehirTicareti, sehirToplamaYuzde, sehirYapiGeliri,
} from "../src";
import { yeniDurum } from "./yardimci";

const A1 = 0; // TEST_SENARYOSU: A1 birim 0'da, A devleti

describe("gelişmişlik ve gelir kaynağı (TASK-0028)", () => {
  it("gelişmişlik şehirli toprağın arazi gelirini çarpar (1 → %76, 5 → %100, 10 → %130)", () => {
    const d = yeniDurum();
    expect(gelismislikYuzde({ ...d.sehirler[A1], gelismislik: 1 })).toBe(76);
    expect(gelismislikYuzde({ ...d.sehirler[A1], gelismislik: 10 })).toBe(130);
    const once = araziGelirleri(d)[0];
    d.sehirler[A1].gelismislik = 10;
    expect(araziGelirleri(d)[0]).toBeGreaterThan(once);
    d.sehirler[A1].gelismislik = 1;
    expect(araziGelirleri(d)[0]).toBeLessThan(once);
    expect(degismezler(d)).toEqual([]);
  });

  it("gelir kaynağı yapı gelirini değiştirir: tarım tarlayı, ticaret ve zanaat pazarı artırır", () => {
    const d = yeniDurum(), s = d.sehirler[A1];
    s.yapilar = { tarla: 2, pazar: 2 };
    const notr = sehirYapiGeliri(d, s);
    s.gelirKaynagi = "tarim"; const tarim = sehirYapiGeliri(d, s);
    s.gelirKaynagi = "ticaret"; const ticaret = sehirYapiGeliri(d, s);
    s.gelirKaynagi = "zanaat"; const zanaat = sehirYapiGeliri(d, s);
    expect(tarim).toBeGreaterThan(notr); expect(ticaret).toBeGreaterThan(notr); expect(zanaat).toBeGreaterThan(notr);
    expect(ticaret).toBeGreaterThan(zanaat);
  });

  it("zanaat şehri asker toplamayı, hayvancılık şehri süvariyi ucuzlatır", () => {
    const d = yeniDurum(), s = d.sehirler[A1];
    const taban = sehirToplamaYuzde(d, A1, "piyade");
    s.gelirKaynagi = "zanaat";
    expect(sehirToplamaYuzde(d, A1, "piyade")).toBe(Math.floor((taban * DENGE.KAYNAK_ZANAAT_TOPLAMA) / 100));
    s.gelirKaynagi = "hayvancilik";
    expect(sehirToplamaYuzde(d, A1, "piyade")).toBe(taban);
    expect(sehirToplamaYuzde(d, A1, "suvari")).toBe(Math.floor((taban * DENGE.KAYNAK_HAYVANCILIK_SUVARI) / 100));
  });

  it("liman olmayan şehrin ticareti yoktur; gelişmişlik yalnızca şehrin kendisini etkiler", () => {
    const d = yeniDurum();
    expect(sehirTicareti(d, A1).taban).toBe(0);
  });

  it("her iki yatırım seviyesinde gelişmişlik +1 (en çok 10)", () => {
    const d = yeniDurum(), s = d.sehirler[A1];
    s.gelismislik = 3;
    d.insaatlar.push({ sehir: A1, devlet: 0, yapi: "tarla", hedef: 1, kalanGun: 1 });
    insaatlariIlerlet(d);
    expect(s.gelismislik).toBe(3); // toplam 1 seviye
    d.insaatlar.push({ sehir: A1, devlet: 0, yapi: "pazar", hedef: 1, kalanGun: 1 });
    insaatlariIlerlet(d);
    expect(s.gelismislik).toBe(4); // toplam 2 seviye
    expect(degismezler(d)).toEqual([]);
  });
});
