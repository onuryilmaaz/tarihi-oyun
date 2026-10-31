// TASK-0008/5c: teknoloji ağacı (DEC-0035)
import { describe, expect, it } from "vitest";
import {
  agHazirla, baslangicDurumu, butceOzeti, degismezler, DENGE, durumOzeti, emirleriUygula, emirVer, gunIlerlet, insaatMaliyeti, kaydet,
  kullanilabilirHazine, muharebeGunu, muharebeGucYuzde, toplamaMaliyeti, turSuresiAyarla, turuIlerlet, yukle, type DunyaDurumu,
  yapiSeviyeGeliri, type SenaryoVerisi, type TeknolojiId,
} from "../src";
import { yeniDurum } from "./yardimci";

const A1 = 0, A2 = 1;
const ogren = (d: DunyaDurumu, ...t: TeknolojiId[]) => { d.devletler[0].teknolojiler.push(...t); };
const neden = (d: DunyaDurumu, teknoloji: TeknolojiId) => {
  const s = emirVer(d, { tur: "arastir", teknoloji });
  return s.gecerli ? null : s.neden;
};

describe("teknoloji ağacı (5c)", () => {
  it("bedel emirde ayrılır, tur başında düşülür; süre dolunca teknoloji bilinir", () => {
    const d = yeniDurum();
    d.devletler[0].hazine = 2000;
    expect(neden(d, "yargi")).toBeNull();
    expect(kullanilabilirHazine(d, 0)).toBe(2000 - DENGE.TEKNOLOJI.yargi.bedel);
    expect(d.devletler[0].hazine).toBe(2000); // AT-004
    turSuresiAyarla(d, "hafta");
    turuIlerlet(d);
    expect(d.arastirmalar).toHaveLength(1);
    expect(d.devletler[0].teknolojiler).toEqual([]);
    while (d.arastirmalar.length) gunIlerlet(d);
    expect(d.devletler[0].teknolojiler).toEqual(["yargi"]);
    expect(d.gunluk.some((o) => o.tur === "arastirma-bitti")).toBe(true);
    expect(neden(d, "yargi")).toMatch(/zaten biliniyor/);
    expect(degismezler(d)).toEqual([]);
  });

  it("ön koşul, iki yuva, farklı alan ve hazine kuralları (borç yok)", () => {
    const d = yeniDurum();
    d.devletler[0].hazine = 100000;
    expect(neden(d, "vergi")).toMatch(/Önce.*Sulama Teknikleri.*Kervan Yolları/);
    expect(neden(d, "kayit")).toMatch(/Daimî Ordu/);
    expect(neden(d, "sulama")).toBeNull();
    expect(neden(d, "kervan")).toMatch(/Ekonomik alanında zaten/);
    expect(neden(d, "sulama")).toMatch(/zaten araştırılıyor/);
    expect(neden(d, "top")).toBeNull();
    expect(neden(d, "yargi")).toMatch(/en çok 2/);
    const e = yeniDurum();
    e.devletler[0].hazine = DENGE.TEKNOLOJI.top.bedel - 1;
    expect(neden(e, "top")).toMatch(/Hazine yetersiz.*Borçlanma yoktur/);
    e.devletler[0].hazine = -5;
    expect(neden(e, "yargi")).toMatch(/Hazine yetersiz/);
  });

  it("ekonomik etkiler: tarla/pazar 4. seviye, pazar +5, arazi geliri 11", () => {
    const d = yeniDurum();
    const s = d.sehirler[A1];
    s.yapilar = { tarla: 3, pazar: 3 };
    expect(insaatMaliyeti(d, s, "tarla")).toBeNull();
    const once = butceOzeti(d, 0), seviyeOnce = yapiSeviyeGeliri(d, s, "pazar");
    ogren(d, "sulama", "kervan");
    expect(insaatMaliyeti(d, s, "tarla")).toBe(DENGE.YAPI_MALIYET.tarla[3]);
    expect(insaatMaliyeti(d, s, "pazar")).toBe(DENGE.YAPI_MALIYET.pazar[3]);
    expect(butceOzeti(d, 0).aylikYapiGeliri - once.aylikYapiGeliri).toBe(3 * (yapiSeviyeGeliri(d, s, "pazar") - seviyeOnce)); // kervan +5, nüfusa ölçekli (TASK-0032)
    expect(yapiSeviyeGeliri(d, s, "pazar")).toBeGreaterThan(seviyeOnce);
    ogren(d, "vergi");
    const b = butceOzeti(d, 0);
    expect(b.aylikAraziGeliri).toBe(b.araziSayisi * DENGE.VERGI_ARAZI_GELIRI);
    expect(degismezler(d)).toEqual([]);
  });

  it("idari etkiler: inşaat süresi −%20, sur 6 ve %25 ucuz, sayım insan gücü +%50", () => {
    const d = yeniDurum();
    d.devletler[0].hazine = 100000;
    ogren(d, "yargi", "bayindirlik");
    d.sehirler[A1].sur = DENGE.YAPI_EN_YUKSEK.sur;
    expect(insaatMaliyeti(d, d.sehirler[A1], "sur")).toBe(Math.ceil(DENGE.YAPI_MALIYET.sur[5] * 75 / 100));
    emirVer(d, { tur: "insaat", sehir: A2, yapi: "tarla" });
    emirleriUygula(d);
    expect(d.insaatlar[0].kalanGun).toBe(Math.ceil(DENGE.YAPI_SURE_GUN.tarla * 80 / 100));

    const e = yeniDurum();
    e.devletler[0].hazine = 100000;
    const havuz = e.sehirler.map((s) => s.insanGucu);
    emirVer(e, { tur: "arastir", teknoloji: "sayim" });
    turSuresiAyarla(e, "hafta");
    turuIlerlet(e);
    while (e.arastirmalar.length) gunIlerlet(e);
    e.sehirler.forEach((s, i) => {
      const ek = s.devlet === 0 ? Math.floor(Math.floor(s.nufus * DENGE.INSAN_GUCU_YUZDE / 100) * DENGE.SAYIM_INSAN_GUCU_YUZDE / 100) : 0;
      expect(s.insanGucu).toBe(havuz[i] + ek);
    });
  });

  it("askerî etkiler: toplama ucuz ve kısa; Daimî Ordu muharebe gücü +%10", () => {
    const d = yeniDurum();
    ogren(d, "daimiOrdu", "kayit");
    expect(toplamaMaliyeti(1000, 75)).toBe(Math.ceil(1000 * DENGE.TOPLAMA_ASKER_BASINA_MALIYET_BINDE * 75 / 100000));
    expect(muharebeGucYuzde(d, 0)).toBe(110);
    expect(muharebeGucYuzde(d, 1)).toBe(100);
    const duz = muharebeGunu([10000, 10000], [1000, 1000], 100, -1, [100, 100]);
    const guclu = muharebeGunu([10000, 10000], [1000, 1000], 100, -1, [100, 100], [110, 100]);
    expect(guclu.guc[0]).toBe(Math.floor(duz.guc[0] * 110 / 100));
    expect(guclu.guc[1]).toBe(duz.guc[1]);
    expect(guclu.kayip[1]).toBeGreaterThan(duz.kayip[1]);
  });

  it("Büyük Top Dökümü surlara saldırıda garnizon kaybını ×1,5 yapar", () => {
    const S: SenaryoVerisi = {
      id: "top-test", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
      devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }],
      birimler: ["a", "b"].map((devlet) => ({ devlet })),
      sehirler: [
        { ad: "A1", devlet: "a", birim: 0, dugum: 0, x: 0, y: 0, baskent: true, nufus: 40000 },
        { ad: "B1", devlet: "b", birim: 1, dugum: 1, x: 10000, y: 0, baskent: true, nufus: 40000 },
      ],
      ordular: [{ ad: "A Ordusu", devlet: "a", asker: 20000, dugum: 1, x: 10000, y: 0 }],
      ag: { dugumler: [0, 1].map((b) => ({ b, x: b * 10000, y: 0, kx: 10000, ky: 10000, z: 100 })),
        kenarlar: [{ a: 0, b: 1, mx: 5000, my: 0, da: 5000, db: 5000, n: 0, g: 0 }] },
    };
    const B = { ag: agHazirla(S.ag!), sehirKonumlari: S.sehirler.map((s) => ({ x: s.x!, y: s.y! })) };
    const kayip = (top: boolean) => {
      const d = baslangicDurumu(S, { tohum: 1 });
      d.ordular = d.ordular.filter((o) => o.devlet === 0);
      d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: 0, savunan: 1, baslangic: d.gun });
      if (top) ogren(d, "top");
      expect(emirVer(d, { tur: "kusat", ordu: d.ordular[0].id, sehir: 1, yontem: "saldiri" }, B).gecerli).toBe(true);
      emirleriUygula(d, B);
      const g = d.sehirler[1].garnizon;
      gunIlerlet(d, B);
      return g - d.sehirler[1].garnizon;
    };
    const duz = kayip(false), toplu = kayip(true);
    expect(duz).toBeGreaterThan(1);
    expect(toplu).toBeGreaterThanOrEqual(Math.floor(duz * 3 / 2));
    expect(toplu).toBeLessThanOrEqual(Math.floor(duz * 3 / 2) + 1);
  });

  it("araştırma sürerken kayıt/yükleme sonucu değiştirmez (AT-011)", () => {
    const d = yeniDurum();
    d.devletler[0].hazine = 5000;
    emirVer(d, { tur: "arastir", teknoloji: "daimiOrdu" });
    turuIlerlet(d);
    const e = yukle(kaydet(d), d.senaryo);
    for (let i = 0; i < Math.ceil(DENGE.TEKNOLOJI.daimiOrdu.sure / 30); i++) { turuIlerlet(d); turuIlerlet(e); } // süre denge.ts'ten
    expect(d.devletler[0].teknolojiler).toEqual(["daimiOrdu"]);
    expect(durumOzeti(e)).toBe(durumOzeti(d));
  });
});
