// TASK-0049: idare reformu, danışmanlar, fetih bütünleşmesi ve politika, görevler
import { describe, expect, it } from "vitest";
import {
  butceOzeti, degismezler, DENGE, devletMaasi, durumOzeti, emirleriUygula, emirVer, gorevOlcumu, kaydet, reformAyi, riskBilesenleri,
  sehirGelirYuzde, toplamaBedelYuzde, yukle,
} from "../src";
import { yeniDurum } from "./yardimci";

const A = 0, Bd = 1;

describe("idare reformu ve danışmanlar (TASK-0049)", () => {
  it("reform bedelli ve süreli; merkezî idare geliri artırır ama riski yükseltir", () => {
    const d = yeniDurum();
    d.devletler[A].hazine = 10000;
    const gelir = butceOzeti(d, A).aylikAraziGeliri;
    expect(emirVer(d, { tur: "reformBaslat", idare: "merkezi" }).gecerli).toBe(true);
    expect(emirVer(d, { tur: "reformBaslat", idare: "yerel" }).gecerli).toBe(false); // bekleyen reform
    emirleriUygula(d);
    expect(d.devletler[A].hazine).toBe(10000 - DENGE.REFORM_BEDEL);
    expect(d.devletler[A].idare).toBe("dengeli");
    d.gun = d.devletler[A].reform!.bitis;
    reformAyi(d);
    expect(d.devletler[A].idare).toBe("merkezi");
    expect(butceOzeti(d, A).aylikAraziGeliri).toBeGreaterThan(gelir);
    const a1 = d.sehirler.findIndex((s) => s.devlet === A);
    expect(riskBilesenleri(d, a1, { ag: null }).find((x) => x.id === "idare")!.puan).toBe(DENGE.IDARE_RISK_FARK);
  });

  it("danışmanlar: en çok iki, maaşlı; harbiye toplama bedelini indirir", () => {
    const d = yeniDurum();
    d.devletler[A].hazine = 10000;
    const maas = devletMaasi(d, A), bedel = toplamaBedelYuzde(d, A);
    for (const x of ["harbiye", "kadi"] as const) expect(emirVer(d, { tur: "danismanAl", danisman: x }).gecerli).toBe(true);
    expect(emirVer(d, { tur: "danismanAl", danisman: "maliye" })).toMatchObject({ gecerli: false, neden: expect.stringMatching(/En çok 2/) });
    emirleriUygula(d);
    expect(devletMaasi(d, A)).toBe(maas + 2 * DENGE.DANISMAN_MAAS);
    expect(toplamaBedelYuzde(d, A)).toBe(Math.floor((bedel * (100 - DENGE.DANISMAN_HARBIYE_INDIRIM)) / 100));
    expect(emirVer(d, { tur: "danismanCikar", danisman: "kadi" }).gecerli).toBe(true);
    emirleriUygula(d);
    expect(d.devletler[A].danismanlar).toEqual(["harbiye"]);
    expect(degismezler(d)).toEqual([]);
  });
});

describe("fetih bütünleşmesi ve politika (TASK-0049)", () => {
  it("fethedilen şehir sıfırdan bütünleşir; düşük bütünleşme geliri düşürür; politika hızı ve riski değiştirir", () => {
    const d = yeniDurum();
    const b2 = d.sehirler.findIndex((s) => s.ad === "B2");
    d.sehirler[b2].devlet = d.sehirler[b2].kontrol = A;
    reformAyi(d);
    expect(d.sehirler[b2].butunlesme).toBe(0);
    expect(sehirGelirYuzde(d.sehirler[b2])).toBe(50);
    expect(riskBilesenleri(d, b2, { ag: null }).find((x) => x.id === "butunlesme")!.puan).toBe(DENGE.IST_BUTUNLESME_EN_COK);
    expect(emirVer(d, { tur: "sehirPolitika", sehir: b2, politika: "hosgoru" }).gecerli).toBe(true);
    emirleriUygula(d);
    reformAyi(d);
    expect(d.sehirler[b2].butunlesme).toBe(DENGE.BUTUNLESME_AYLIK.hosgoru);
    expect(riskBilesenleri(d, b2, { ag: null }).find((x) => x.id === "idare")!.puan).toBe(DENGE.POLITIKA_RISK.hosgoru);
    // Asıl sahibine dönen şehir tam bütünleşiktir
    d.sehirler[b2].devlet = d.sehirler[b2].kontrol = Bd;
    reformAyi(d);
    expect(d.sehirler[b2].butunlesme).toBe(100);
    expect(degismezler(d)).toEqual([]);
  });
});

describe("görevler (TASK-0049)", () => {
  it("üç teklif; biri kabul edilince diğerleri düşer; tamamlanınca ödül ve meşruiyet", () => {
    const d = yeniDurum();
    reformAyi(d);
    const teklifler = d.gorevler.filter((g) => g.devlet === A);
    expect(teklifler).toHaveLength(DENGE.GOREV_TEKLIF_SAYISI);
    const g = teklifler[0];
    expect(emirVer(d, { tur: "gorevKabul", no: g.no }).gecerli).toBe(true);
    emirleriUygula(d);
    expect(d.gorevler).toEqual([{ ...g, durum: "aktif", bitis: d.gun + DENGE.GOREV_GUN }]);
    // Hedefi zorla sağla
    if (g.tur === "hazine") d.devletler[A].hazine = g.hedef;
    else if (g.tur === "ittifak") d.ittifaklar.push({ a: A, b: Bd, baslangic: d.gun });
    else if (g.tur === "ticaret") d.ticaretAnlasmalari.push({ a: A, b: Bd, baslangic: d.gun });
    else if (g.tur === "sur") d.sehirler[d.devletler[A].baskent!].sur = g.hedef;
    else d.ordular.find((o) => o.devlet === A)!.asker += g.hedef;
    expect(gorevOlcumu(d, A, g.tur)).toBeGreaterThanOrEqual(g.hedef);
    const once = d.devletler[A].hazine;
    reformAyi(d);
    expect(d.devletler[A].hazine).toBe(once + g.odul);
    expect(d.gorevler.filter((x) => x.durum === "aktif")).toEqual([]);
  });

  it("kayıt/yükleme reform, danışman ve görevleri korur", () => {
    const d = yeniDurum();
    d.devletler[A].hazine = 10000;
    emirVer(d, { tur: "reformBaslat", idare: "yerel" }); emirVer(d, { tur: "danismanAl", danisman: "maliye" });
    emirleriUygula(d); reformAyi(d);
    const e = yukle(kaydet(d), d.senaryo);
    expect(durumOzeti(e)).toBe(durumOzeti(d));
    expect(e.devletler[A]).toMatchObject({ danismanlar: ["maliye"], reform: d.devletler[A].reform });
  });
});
