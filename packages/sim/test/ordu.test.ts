import { describe, expect, it } from "vitest";
import {
  agHazirla, baslangicDurumu, degismezler, DENGE, devletMaasi, durumOzeti, emirleriUygula, emirVer,
  gunIlerlet, ikmalDurumu, kaydet, kullanilabilirHazine, kullanilabilirInsanGucu, maaslariOde,
  SEMA_SURUMU, toplamaMaliyeti, turSuresiAyarla, turuIlerlet, yukle, type SenaryoVerisi,
} from "../src";
import { dunyaOzeti } from "./yardimci";

const senaryo: SenaryoVerisi = {
  id: "ordu-test", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
  devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }],
  birimler: ["a", "a", "b", null].map((devlet) => ({ devlet })),
  sehirler: [{ ad: "A1", devlet: "a", birim: 0, dugum: 0, baskent: true, nufus: 20000, x: 1234, y: 567 },
    { ad: "A2", devlet: "a", birim: 1, dugum: 1, baskent: false, nufus: 10000, x: 10000, y: 0 },
    { ad: "B1", devlet: "b", birim: 2, dugum: 2, baskent: true, nufus: 10000, x: 20000, y: 0 }],
  ordular: [{ ad: "Birinci", devlet: "a", asker: 1000, dugum: 0, x: 0, y: 0 }],
  ag: { dugumler: [0, 1, 2, 3].map((b) => ({ b, x: b * 10000, y: 0, z: 100, kx: 10000, ky: 10000 })),
    kenarlar: [0, 1, 2].map((a) => ({ a, b: a + 1, mx: a * 10000 + 5000, my: 0, da: 5000, db: 5000, n: 0, g: 0 })) },
};
const B = { ag: agHazirla(senaryo.ag!), sehirKonumlari: senaryo.sehirler.map((s) => ({ x: s.x!, y: s.y! })) };
function yeni() {
  const d = baslangicDurumu(senaryo, { tohum: 1453 });
  d.ordular = d.ordular.filter((o) => o.devlet === 0);
  return d;
}
const topla = { tur: "askerTopla", sehir: 0, asker: 500 } as const;

describe("asker toplama (4b)", () => {
  it("AT-004: para/insan gücü yalnızca tur başında düşer; ordu süre dolunca kurulur", () => {
    const d = yeni();
    const ilk = structuredClone(d);
    expect(emirVer(d, topla, B).gecerli).toBe(true);
    expect(d.devletler).toEqual(ilk.devletler);
    expect(d.sehirler).toEqual(ilk.sehirler);
    expect(d.ordular).toEqual(ilk.ordular);
    emirleriUygula(d, B);
    expect(d.devletler[0].hazine).toBe(ilk.devletler[0].hazine - toplamaMaliyeti(500));
    expect(d.sehirler[0].insanGucu).toBe(500);
    for (let i = 0; i < DENGE.TOPLAMA_GUN - 1; i++) gunIlerlet(d, B);
    expect(d.ordular).toHaveLength(1);
    gunIlerlet(d, B);
    expect(d.askerToplamalar).toHaveLength(0);
    expect(d.ordular).toHaveLength(2);
    expect(d.ordular[1]).toMatchObject({ asker: 500, dugum: 0, x: 1234, y: 567 });
    expect(degismezler(d)).toEqual([]);
  });

  it("AT-010: toplama ve harcama aynı hazineyi paylaşır, kuyruk kaynakları iki kez kullanamaz", () => {
    for (const ters of [false, true]) {
      const d = yeni(); d.devletler[0].hazine = 60;
      const harca = { tur: "harca", devlet: 0, miktar: 20, aciklama: "yatırım" } as const;
      expect(emirVer(d, ters ? harca : topla, B).gecerli).toBe(true);
      expect(emirVer(d, ters ? topla : harca, B).gecerli).toBe(false);
      expect(kullanilabilirHazine(d, 0)).toBe(ters ? 40 : 10);
      emirleriUygula(d, B);
      expect(d.devletler[0].hazine).toBeGreaterThanOrEqual(0);
    }
  });

  it("insan gücü de kuyrukta ayrılır; kesir, negatif, fazla ve yabancı şehir reddedilir", () => {
    const d = yeni();
    expect(emirVer(d, { ...topla, asker: 800 }, B).gecerli).toBe(true);
    expect(kullanilabilirInsanGucu(d, 0)).toBe(200);
    expect(emirVer(d, { ...topla, asker: 201 }, B).gecerli).toBe(false);
    for (const asker of [0, -1, 1.5, NaN, Infinity]) expect(emirVer(d, { ...topla, asker }, B).gecerli).toBe(false);
    expect(emirVer(d, { ...topla, sehir: 2 }, B).gecerli).toBe(false);
    d.devletler[0].hazine = -1;
    expect(emirVer(d, { ...topla, asker: 1 }, B).gecerli).toBe(false);
  });

  it("tur başında hazine/kontrol yeniden doğrulanır; reddedilen toplama kaynak tüketmez", () => {
    const d = yeni();
    emirVer(d, topla, B);
    d.devletler[0].hazine = 0;
    emirleriUygula(d, B);
    expect(d.askerToplamalar).toHaveLength(0);
    expect(d.sehirler[0].insanGucu).toBe(1000);
    expect(d.gunluk.at(-1)?.tur).toBe("emir-reddedildi");
    d.devletler[0].hazine = 100;
    d.sehirler[0].kontrol = 1;
    expect(emirVer(d, topla, B).gecerli).toBe(false);
    d.sehirler[0].kontrol = 0; d.birimler[0].kontrol = 1;
    expect(emirVer(d, topla, B).gecerli).toBe(false);
  });

  it("toplama işgal boyunca durur, kontrol geri gelince kaldığı süreden sürer", () => {
    const d = yeni(); emirVer(d, topla, B); emirleriUygula(d, B);
    gunIlerlet(d, B);
    const kalan = d.askerToplamalar[0].kalanGun;
    d.sehirler[0].kontrol = 1;
    for (let i = 0; i < 40; i++) gunIlerlet(d, B);
    expect(d.askerToplamalar[0].kalanGun).toBe(kalan);
    d.sehirler[0].kontrol = 0;
    for (let i = 0; i < kalan; i++) gunIlerlet(d, B);
    expect(d.askerToplamalar).toHaveLength(0);
    expect(d.ordular.reduce((s, o) => s + o.asker, 0)).toBe(1500);
  });
});

describe("TASK-0017: asker toplama iptali", () => {
  it("iptal tam hazine ve insan gücü iadesi yapar; toplama kuyruktan düşer", () => {
    const d = yeni(); emirVer(d, topla, B); emirleriUygula(d, B);
    const hazineOnce = d.devletler[0].hazine, insanGucuOnce = d.sehirler[0].insanGucu;
    const id = d.askerToplamalar[0].id;
    expect(id).toBeGreaterThan(0);
    expect(emirVer(d, { tur: "toplamaIptal", id }, B).gecerli).toBe(true);
    emirleriUygula(d, B);
    expect(d.askerToplamalar).toHaveLength(0);
    expect(d.devletler[0].hazine).toBe(hazineOnce + toplamaMaliyeti(500));
    expect(d.sehirler[0].insanGucu).toBe(insanGucuOnce + 500);
    expect(degismezler(d)).toEqual([]);
  });

  it("olmayan ya da başka devletin toplamasını iptal etmek reddedilir; iki kez iptal edilemez", () => {
    const d = yeni(); emirVer(d, topla, B); emirleriUygula(d, B);
    const id = d.askerToplamalar[0].id;
    expect(emirVer(d, { tur: "toplamaIptal", id: id + 999 }, B).gecerli).toBe(false);
    expect(emirVer(d, { tur: "toplamaIptal", id, devlet: 1 }, B).gecerli).toBe(false);
    expect(emirVer(d, { tur: "toplamaIptal", id }, B).gecerli).toBe(true);
    expect(emirVer(d, { tur: "toplamaIptal", id }, B).gecerli).toBe(false);
  });

  it("şema 19 → 20: eski kayıttaki süren toplamaya kimlik ve iade bedeli eklenir", () => {
    const d = yeni(); emirVer(d, topla, B); emirleriUygula(d, B);
    const p = JSON.parse(kaydet(d));
    delete p.ozet;
    delete p.durum.sonrakiToplamaId;
    for (const t of p.durum.askerToplamalar) { delete t.id; delete t.bedel; }
    p.sema = 19; p.durum.sema = 19;
    const g = yukle(JSON.stringify(p), d.senaryo);
    expect(g.sema).toBe(SEMA_SURUMU);
    expect(g.askerToplamalar[0].id).toBe(1);
    expect(g.askerToplamalar[0].bedel).toBe(toplamaMaliyeti(500));
    expect(g.sonrakiToplamaId).toBe(2);
    expect(degismezler(g)).toEqual([]);
  });
});

describe("maaş ve ikmal", () => {
  it("aylık maaş zorunlu giderdir; eksi hazine moral düşürür ve harcamayı engeller", () => {
    const d = yeni(); d.devletler[0].hazine = 0;
    const asker = d.ordular[0].asker;
    maaslariOde(d);
    expect(d.devletler[0].hazine).toBe(-devletMaasi(d, 0));
    const moral = d.ordular[0].moral;
    gunIlerlet(d, B);
    expect(d.ordular[0].moral).toBe(moral - DENGE.MAAS_AKSAMASI_MORAL);
    expect(d.ordular[0].asker).toBe(asker);
    expect(emirVer(d, topla, B).gecerli).toBe(false);
    d.devletler[0].hazine = 100;
    gunIlerlet(d, B);
    expect(d.ordular[0].moral).toBe(moral - DENGE.MAAS_AKSAMASI_MORAL + DENGE.MORAL_TOPARLANMA_KENDI);
  });

  it("gelir ve maaş ay başında bir kez işlenir", () => {
    const d = yeni(); const ilk = d.devletler[0].hazine;
    turuIlerlet(d, B);
    expect(d.devletler[0].hazine).toBe(ilk + 2 * DENGE.TEST_GELIR_BIRIM_BASINA - devletMaasi(d, 0));
    expect(d.gunluk.filter((e) => e.tur === "ordu-maasi")).toHaveLength(1);
  });

  it("kendi toprağında tam ikmal; düşmanda günlük kayıp; dönüşte kayıp durur", () => {
    const d = yeni(); const o = d.ordular[0];
    expect(ikmalDurumu(d, B.ag, o).deger).toBe(1000);
    gunIlerlet(d, B); expect(o.asker).toBe(1000);
    d.savaslar.push({ id: 1, saldiran: 0, savunan: 1, baslangic: d.gun });
    o.dugum = 2;
    expect(ikmalDurumu(d, B.ag, o).dusmanda).toBe(true);
    gunIlerlet(d, B);
    expect(o.asker).toBe(999); expect(o.moral).toBe(1000 - DENGE.IKMALSIZ_MORAL);
    o.dugum = 0; gunIlerlet(d, B);
    expect(o.asker).toBe(999); expect(o.moral).toBe(1000);
    o.dugum = 3; expect(ikmalDurumu(d, B.ag, o).deger).toBe(DENGE.TARAFSIZ_IKMAL);
    gunIlerlet(d, B); expect(o.asker).toBe(999);
  });

  it("aşınma orduyu sıfırın altına indirmez, tamamen tükenen ordu silinir", () => {
    const d = yeni(); const o = d.ordular[0]; o.asker = 1; o.dugum = 2;
    d.savaslar.push({ id: 1, saldiran: 0, savunan: 1, baslangic: d.gun });
    gunIlerlet(d, B);
    expect(d.ordular).toHaveLength(0); expect(degismezler(d)).toEqual([]);
  });
});

describe("bölme ve birleştirme", () => {
  it("asker, konum ve tutum korunur; moral asker ağırlıklı ortalanır; maaş bölmeden etkilenmez", () => {
    const d = yeni(); const o = d.ordular[0]; o.asker = 1001; o.moral = 600; o.tutum = "temkinli";
    const maas = devletMaasi(d, 0);
    expect(emirVer(d, { tur: "orduBol", ordu: o.id, asker: 301 }, B).gecerli).toBe(true);
    expect(d.ordular).toHaveLength(1);
    emirleriUygula(d, B);
    const a = d.ordular[1];
    expect([o.asker, a.asker]).toEqual([700, 301]);
    expect(a).toMatchObject({ x: o.x, y: o.y, dugum: o.dugum, moral: 600, tutum: "temkinli" });
    expect(devletMaasi(d, 0)).toBe(maas);
    a.moral = 900;
    expect(emirVer(d, { tur: "orduBirlestir", ordu: o.id, diger: a.id }, B).gecerli).toBe(true);
    emirleriUygula(d, B);
    expect(d.ordular).toHaveLength(1);
    expect(o.asker).toBe(1001);
    expect(o.moral).toBe(Math.floor((700 * 600 + 301 * 900) / 1001));
    expect(devletMaasi(d, 0)).toBe(maas); expect(degismezler(d)).toEqual([]);
  });

  it("sıfır/tüm asker, yabancı ordu, farklı konum, yürüyüş, muharebe ve geri çekilme reddedilir", () => {
    const d = yeni(); const o = d.ordular[0];
    for (const asker of [0, 1000, -1, 0.5]) expect(emirVer(d, { tur: "orduBol", ordu: o.id, asker }, B).gecerli).toBe(false);
    const a = { ...structuredClone(o), id: d.sonrakiOrduId++, x: 1 }; d.ordular.push(a);
    expect(emirVer(d, { tur: "orduBirlestir", ordu: o.id, diger: a.id }, B).gecerli).toBe(false);
    a.x = o.x; a.devlet = 1;
    expect(emirVer(d, { tur: "orduBirlestir", ordu: o.id, diger: a.id }, B).gecerli).toBe(false);
    a.devlet = 0;
    for (const kip of ["yuru", "muharebe", "cekil"]) {
      o.rota = kip === "yuru" ? [{ d: 1, x: 10000, y: 0, m: 10000 }] : [];
      o.muharebe = kip === "muharebe" ? 1 : null; o.cekiliyor = kip === "cekil";
      expect(emirVer(d, { tur: "orduBol", ordu: o.id, asker: 100 }, B).gecerli).toBe(false);
      expect(emirVer(d, { tur: "orduBirlestir", ordu: a.id, diger: o.id }, B).gecerli).toBe(false);
    }
  });

  it("aynı orduya kuyrukta çakışan emir verilemez; yeniden doğrulama geçersiz işlemi atlar", () => {
    const d = yeni(); const o = d.ordular[0];
    const e = { tur: "orduBol", ordu: o.id, asker: 400 } as const;
    expect(emirVer(d, e, B).gecerli).toBe(true);
    expect(emirVer(d, e, B).gecerli).toBe(false);
    expect(emirVer(d, { tur: "orduHedef", ordu: o.id, x: 10000, y: 0, dugum: 1 }, B).gecerli).toBe(false);
    o.asker = 300;
    emirleriUygula(d, B);
    expect(d.ordular).toHaveLength(1); expect(o.asker).toBe(300);
    expect(d.gunluk.at(-1)?.tur).toBe("emir-reddedildi");
  });
});

describe("4b kayıt ve determinizm", () => {
  it("toplama ortasında kaydet/yükle aynı sonuca devam eder", () => {
    const d = yeni(); emirVer(d, topla, B); turSuresiAyarla(d, "hafta"); turuIlerlet(d, B);
    const e = yukle(kaydet(d));
    for (let i = 0; i < 6; i++) { turuIlerlet(d, B); turuIlerlet(e, B); }
    expect(durumOzeti(e)).toBe(durumOzeti(d));
  });

  it("şema 3 dönüşümü mevcut para, ordu, savaş ve emirleri korur", () => {
    const d = yeni(); emirVer(d, { tur: "orduTutum", ordu: 1, tutum: "inatci" }, B);
    const paket = JSON.parse(kaydet(d)); paket.sema = paket.durum.sema = 3;
    delete paket.durum.askerToplamalar;
    for (const s of paket.durum.sehirler) delete s.insanGucu;
    const e = yukle(JSON.stringify(paket));
    expect(e).toEqual(d);
    const bozuk = JSON.parse(kaydet(d)); bozuk.durum.askerToplamalar = [{ sehir: 0, devlet: 0, asker: -5, kalanGun: 3 }];
    expect(() => yukle(JSON.stringify(bozuk))).toThrow(/tutarsız/);
  });

  it("toplama, maaş, ikmal ve moral 1 yıl/12 ay/52 hafta + 1 günde aynı sonucu verir", () => {
    const oyna = (sure: "hafta" | "ay" | "yil", kez: number) => {
      const d = yeni(); emirVer(d, topla, B);
      const o = d.ordular[0]; o.dugum = 2; o.x = 20000;
      d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: 0, savunan: 1, baslangic: d.gun });
      turSuresiAyarla(d, sure);
      for (let i = 0; i < kez; i++) turuIlerlet(d, B);
      if (sure === "hafta") gunIlerlet(d, B);
      expect(degismezler(d)).toEqual([]);
      return d;
    };
    const yil = oyna("yil", 1), ay = oyna("ay", 12), hafta = oyna("hafta", 52);
    expect(dunyaOzeti(ay)).toBe(dunyaOzeti(yil)); expect(dunyaOzeti(hafta)).toBe(dunyaOzeti(yil));
  });
});
