// TASK-0019 (1/4, DEC-0068): birim çeşitliliği — veri modeli ve asker toplama
import { describe, expect, it } from "vitest";
import {
  agHazirla, baslangicDurumu, degismezler, DENGE, devletMaasi, emirleriUygula, emirVer, HAREKET, kusatmaGucu, muharebeleriBaslat,
  muharebeGunleri, toplamaMaliyeti, turSuresiAyarla, turuIlerlet, type SenaryoVerisi,
} from "../src";

const senaryo: SenaryoVerisi = {
  id: "birim-test", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
  devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }],
  birimler: ["a", "a", "b", null].map((devlet) => ({ devlet })),
  sehirler: [{ ad: "A1", devlet: "a", birim: 0, dugum: 0, x: 0, y: 0, baskent: true, nufus: 40000 },
    { ad: "A2", devlet: "a", birim: 1, dugum: 1, x: 10000, y: 0, baskent: false, nufus: 10000 },
    { ad: "B1", devlet: "b", birim: 2, dugum: 2, x: 20000, y: 0, baskent: true, nufus: 10000 }],
  ordular: [{ ad: "Birinci", devlet: "a", asker: 1000, dugum: 0, x: 0, y: 0 }],
  ag: { dugumler: [0, 1, 2, 3].map((b) => ({ b, x: b * 10000, y: 0, z: 100, kx: 10000, ky: 10000 })),
    kenarlar: [0, 1, 2].map((a) => ({ a, b: a + 1, mx: a * 10000 + 5000, my: 0, da: 5000, db: 5000, n: 0, g: 0 })) },
};
const B = { ag: agHazirla(senaryo.ag!), sehirKonumlari: senaryo.sehirler.map((s) => ({ x: s.x!, y: s.y! })) };
const yeni = () => {
  const d = baslangicDurumu(senaryo, { tohum: 1453 });
  d.ordular = d.ordular.filter((o) => o.devlet === 0);
  return d;
};

describe("TASK-0019 (1/4): birim çeşitliliği — veri modeli ve asker toplama", () => {
  it("senaryo/garnizon orduları tamamen piyade olarak başlar", () => {
    const d = yeni();
    expect(d.ordular[0].kompozisyon).toEqual({ piyade: 1000, okcu: 0, suvari: 0 });
    expect(degismezler(d)).toEqual([]);
  });

  it("süvari piyadeden daha pahalı ve daha yüksek maaşlıdır; birim seçilmezse piyade varsayılır", () => {
    const piyadeBedel = toplamaMaliyeti(1000, 100, "piyade");
    const suvariBedel = toplamaMaliyeti(1000, 100, "suvari");
    const okcuBedel = toplamaMaliyeti(1000, 100, "okcu");
    expect(toplamaMaliyeti(1000, 100)).toBe(piyadeBedel); // varsayılan birim
    expect(suvariBedel).toBeGreaterThan(piyadeBedel);
    expect(okcuBedel).toBeLessThan(piyadeBedel);
  });

  it("süvari toplama emri kompozisyonu doğru kurar; maaş piyadeden yüksektir", () => {
    const d = yeni(), oncekiMaas = devletMaasi(d, 0);
    expect(emirVer(d, { tur: "askerTopla", sehir: 0, asker: 1000, birim: "suvari" }, B).gecerli).toBe(true);
    emirleriUygula(d, B);
    turSuresiAyarla(d, "hafta");
    for (let i = 0; i < 5; i++) turuIlerlet(d, B);
    const yeniOrdu = d.ordular.find((o) => o.id !== 1);
    expect(yeniOrdu?.kompozisyon).toEqual({ piyade: 0, okcu: 0, suvari: 1000 });
    expect(devletMaasi(d, 0)).toBeGreaterThan(oncekiMaas);
    expect(degismezler(d)).toEqual([]);
  });

  it("ordu bölme türleri oransal ayırır; birleştirme toplar; toplam her zaman asker'e eşit kalır", () => {
    const d = yeni(), o = d.ordular[0];
    o.asker = 1000; o.kompozisyon = { piyade: 600, okcu: 300, suvari: 100 };
    expect(emirVer(d, { tur: "orduBol", ordu: o.id, asker: 250 }, B).gecerli).toBe(true);
    emirleriUygula(d, B);
    const a = d.ordular.find((x) => x.id !== o.id)!;
    expect(a.asker).toBe(250);
    expect(a.kompozisyon.piyade + a.kompozisyon.okcu + a.kompozisyon.suvari).toBe(250);
    expect(o.kompozisyon.piyade + o.kompozisyon.okcu + o.kompozisyon.suvari).toBe(750);
    // Oranlar korunur: %60/%30/%10 civarı (yuvarlama ile tam oran)
    expect(a.kompozisyon.piyade).toBe(150); expect(a.kompozisyon.okcu).toBe(75); expect(a.kompozisyon.suvari).toBe(25);
    expect(emirVer(d, { tur: "orduBirlestir", ordu: o.id, diger: a.id }, B).gecerli).toBe(true);
    emirleriUygula(d, B);
    expect(o.asker).toBe(1000);
    expect(o.kompozisyon).toEqual({ piyade: 600, okcu: 300, suvari: 100 });
    expect(degismezler(d)).toEqual([]);
  });

  it("ikmalsizlik ve muharebe kayıpları kompozisyonu asker sayısıyla tutarlı tutar", () => {
    const d = yeni(), o = d.ordular[0];
    o.asker = 1000; o.kompozisyon = { piyade: 500, okcu: 300, suvari: 200 };
    d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: 0, savunan: 1, baslangic: d.gun });
    o.dugum = 2; // düşman toprağı (B'nin başkenti)
    for (let i = 0; i < 10; i++) { turuIlerlet(d, B); if (o.asker === 0) break; }
    expect(o.kompozisyon.piyade + o.kompozisyon.okcu + o.kompozisyon.suvari).toBe(o.asker);
    expect(degismezler(d)).toEqual([]);
  });

});

describe("TASK-0019 (2/4): muharebe gücü ve kayıp dağılımı", () => {
  /** A'nın ordusunu B'nin başkentine (dugum 2) yürütür: B savunan, A saldıran olur. */
  const saldiranA = () => {
    const d = yeni(), o = d.ordular[0];
    o.dugum = 2; o.x = 20000; o.y = 0;
    d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: 0, savunan: 1, baslangic: d.gun });
    const bOrdusu = { ...structuredClone(o), id: d.sonrakiOrduId++, devlet: 1,
      asker: 1000, kompozisyon: { piyade: 1000, okcu: 0, suvari: 0 } };
    d.ordular.push(bOrdusu);
    return { d, a: o, b: bOrdusu };
  };
  const ilkGun = (d: ReturnType<typeof saldiranA>["d"]) => {
    muharebeleriBaslat(d);
    const once = structuredClone(d.ordular.map((o) => ({ id: o.id, asker: o.asker })));
    muharebeGunleri(d, B.ag); // gerçek hareket ağı: B'nin toprağında savunan doğru belirlensin
    return Object.fromEntries(once.map((o) => [o.id, o.asker - (d.ordular.find((x) => x.id === o.id)?.asker ?? 0)]));
  };

  it("süvari ağırlıklı saldıran, eşit sayıda piyadeye göre düşmana (savunan) daha çok kayıp verdirir", () => {
    const esit = saldiranA();
    const kayipEsit = ilkGun(esit.d);

    const suvarili = saldiranA();
    suvarili.a.kompozisyon = { piyade: 0, okcu: 0, suvari: 1000 };
    const kayipSuvari = ilkGun(suvarili.d);

    expect(kayipSuvari[suvarili.b.id]).toBeGreaterThan(kayipEsit[esit.b.id]); // B'nin (savunan) kaybı arttı
    expect(degismezler(suvarili.d)).toEqual([]);
  });

  it("okçu ağırlıklı savunan, saldırana (A) piyadeye göre daha çok kayıp verdirir (savunmada güçlü)", () => {
    // Not: kayip[saldıran] = güç[savunan]'a bağlıdır; savunanın bileşimi güçlenince kendi kaybı değil, saldıranınki artar.
    const esit = saldiranA();
    const kayipEsit = ilkGun(esit.d);

    const okculu = saldiranA();
    okculu.b.kompozisyon = { piyade: 0, okcu: 1000, suvari: 0 };
    const kayipOkcu = ilkGun(okculu.d);

    expect(kayipOkcu[okculu.a.id]).toBeGreaterThan(kayipEsit[esit.a.id]); // A'nın (saldıran) kaybı arttı
    expect(kayipOkcu[okculu.b.id]).toBe(kayipEsit[esit.b.id]); // B'nin kendi kaybı A'nın gücüne bağlı, değişmez
    expect(degismezler(okculu.d)).toEqual([]);
  });
});

describe("TASK-0019 (3/4): hareket hızı kompozisyona göre değişir", () => {
  it("süvari toplanan ordu temel hızdan hızlı, okçu/piyade temel hızda kurulur", () => {
    const d = yeni(); d.devletler[0].hazine = 1000;
    expect(emirVer(d, { tur: "askerTopla", sehir: 0, asker: 1000, birim: "suvari" }, B).gecerli).toBe(true);
    expect(emirVer(d, { tur: "askerTopla", sehir: 0, asker: 500, birim: "okcu" }, B).gecerli).toBe(true);
    emirleriUygula(d, B);
    turSuresiAyarla(d, "hafta");
    for (let i = 0; i < 5; i++) turuIlerlet(d, B);
    const suvariOrdusu = d.ordular.find((o) => o.kompozisyon.suvari > 0)!;
    const okcuOrdusu = d.ordular.find((o) => o.kompozisyon.okcu > 0)!;
    expect(suvariOrdusu.hiz).toBe(Math.round((HAREKET.TEMEL_HIZ * DENGE.BIRIM.suvari.hizYuzde) / 100));
    expect(suvariOrdusu.hiz).toBeGreaterThan(HAREKET.TEMEL_HIZ);
    expect(okcuOrdusu.hiz).toBe(HAREKET.TEMEL_HIZ);
    expect(degismezler(d)).toEqual([]);
  });

  it("bölme/birleştirme sonrası hız yeni kompozisyona göre yeniden hesaplanır", () => {
    const d = yeni(), o = d.ordular[0];
    o.asker = 1000; o.kompozisyon = { piyade: 0, okcu: 0, suvari: 1000 };
    o.hiz = Math.round((HAREKET.TEMEL_HIZ * DENGE.BIRIM.suvari.hizYuzde) / 100);
    expect(emirVer(d, { tur: "orduBol", ordu: o.id, asker: 400 }, B).gecerli).toBe(true);
    emirleriUygula(d, B);
    const a = d.ordular.find((x) => x.id !== o.id)!;
    expect(o.hiz).toBe(Math.round((HAREKET.TEMEL_HIZ * DENGE.BIRIM.suvari.hizYuzde) / 100)); // tamamen süvari kaldı, hız aynı
    expect(a.hiz).toBe(o.hiz); // bölünen de tamamen süvari
    o.hiz = 1; // birleştirmede yeniden hesaplanacağını görmek için bozulur
    expect(emirVer(d, { tur: "orduBirlestir", ordu: o.id, diger: a.id }, B).gecerli).toBe(true);
    emirleriUygula(d, B);
    expect(o.hiz).toBe(Math.round((HAREKET.TEMEL_HIZ * DENGE.BIRIM.suvari.hizYuzde) / 100));
    expect(degismezler(d)).toEqual([]);
  });
});

describe("TASK-0019 (4/4): kuşatma gücü kompozisyona göre değişir", () => {
  it("süvari ağırlıklı kuşatan, eşit sayıda piyadeye göre daha yüksek kuşatma gücü üretir", () => {
    const d = yeni(), o = d.ordular[0];
    o.asker = 1000; o.kompozisyon = { piyade: 1000, okcu: 0, suvari: 0 };
    const k = { sehir: 2, devlet: 0, savunan: 1, ordular: [o.id], yontem: "abluka" as const, baslangic: d.gun, gun: 0, erzak: 1000 };
    const piyadeGuc = kusatmaGucu(d, k).guc;

    o.kompozisyon = { piyade: 0, okcu: 0, suvari: 1000 };
    const suvariGuc = kusatmaGucu(d, k).guc;

    o.kompozisyon = { piyade: 0, okcu: 1000, suvari: 0 };
    const okcuGuc = kusatmaGucu(d, k).guc;

    expect(suvariGuc).toBeGreaterThan(piyadeGuc);
    expect(okcuGuc).toBeLessThan(piyadeGuc);
    // birimYuzde etkisizse (piyade) eski formülle birebir aynı: asker * moral / MORAL_EN_YUKSEK
    expect(piyadeGuc).toBe(Math.floor((1000 * o.moral) / DENGE.MORAL_EN_YUKSEK));
  });
});
