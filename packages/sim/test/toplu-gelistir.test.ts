// TASK-0038: tüm şehirleri tek emirle birer seviye geliştirme
import { describe, expect, it } from "vitest";
import { DENGE, degismezler, emirVer, insaatMaliyeti, kullanilabilirHazine, topluGelistirmePlani, turuIlerlet } from "../src";
import { yeniDurum } from "./yardimci";

describe("tüm şehirleri geliştir (TASK-0038)", () => {
  it("her uygun şehre bir inşaat; dolu ve inşaatlı şehir atlanır; bedel üst sınırı aşmaz", () => {
    const d = yeniDurum();
    d.devletler[0].hazine = 100000;
    const benim = d.sehirler.flatMap((s, i) => (s.devlet === 0 ? [i] : []));
    expect(benim.length).toBeGreaterThanOrEqual(2);
    const [dolu, ...diger] = benim;
    d.sehirler[dolu].yapilar = { tarla: DENGE.YAPI_EN_YUKSEK.tarla, pazar: DENGE.YAPI_EN_YUKSEK.pazar };
    const p = topluGelistirmePlani(d, 100000);
    expect(p).toMatchObject({ gecerli: true, dolu: 1 });
    expect(emirVer(d, { tur: "topluGelistir", ustSinir: 100000 }).gecerli).toBe(true);
    expect(d.emirKuyrugu.map((e) => e.tur === "insaat" && e.sehir).sort()).toEqual([...diger].sort());
    // İkinci basış: hepsinde inşaat bekliyor
    expect(emirVer(d, { tur: "topluGelistir", ustSinir: 100000 })).toMatchObject({ gecerli: false, neden: expect.stringMatching(/Geliştirilecek şehir yok/) });
    const once = d.devletler[0].hazine, bedel = p.gecerli ? p.bedel : 0;
    turuIlerlet(d);
    expect(d.insaatlar).toHaveLength(diger.length);
    expect(d.devletler[0].hazine).toBeLessThanOrEqual(once - bedel + 100000); // gelir eklenebilir; borç yok
    expect(degismezler(d)).toEqual([]);
  });

  it("üst sınır ve hazine: en kârlılar önce, sığmayan atlanır; hiçbiri sığmazsa reddedilir", () => {
    const d = yeniDurum();
    d.devletler[0].hazine = 100000;
    const sehir = d.sehirler.findIndex((s) => s.devlet === 0);
    const en = Math.min(insaatMaliyeti(d, d.sehirler[sehir], "tarla")!, insaatMaliyeti(d, d.sehirler[sehir], "pazar")!);
    const p = topluGelistirmePlani(d, en);
    expect(p.gecerli && p.bedel).toBeLessThanOrEqual(en);
    expect(p.gecerli && p.emirler.length).toBe(1);
    d.devletler[0].hazine = 1;
    expect(topluGelistirmePlani(d, 100000)).toMatchObject({ gecerli: false, neden: expect.stringMatching(/Bütçe yetmiyor/) });
    expect(kullanilabilirHazine(d, 0)).toBe(1);
    expect(topluGelistirmePlani(d, 0).gecerli).toBe(false);
  });

  it("surlar: başkent önce, sonra kalabalık şehir; tam surlu şehir atlanır", () => {
    const d = yeniDurum();
    d.devletler[0].hazine = 100000;
    const benim = d.sehirler.flatMap((s, i) => (s.devlet === 0 ? [i] : []));
    const baskent = d.devletler[0].baskent!;
    const p = topluGelistirmePlani(d, 100000, false, true);
    expect(p.gecerli && p.emirler.map((e) => e.yapi)).toEqual(benim.filter((i) => d.sehirler[i].sur < DENGE.YAPI_EN_YUKSEK.sur).map(() => "sur"));
    expect(p.gecerli && p.emirler[0].sehir).toBe(baskent);
    for (const i of benim) d.sehirler[i].sur = DENGE.YAPI_EN_YUKSEK.sur;
    expect(topluGelistirmePlani(d, 100000, false, true)).toMatchObject({ gecerli: false, neden: expect.stringMatching(/sur en yüksek/) });
  });
});
