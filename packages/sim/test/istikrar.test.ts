import { describe, expect, it } from "vitest";
import { agHazirla, araziGelirleri, asayisAskeri, baslangicDurumu, bosIstikrar, degismezler, DENGE, SEMA_SURUMU,
  diplomasiOnHesap, devletKarari, durumOzeti, emirleriUygula, emirVer, gerekenAsayis,
  insaatlariIlerlet, istikrarAyi, kaydet, kullanilabilirHazine, riskBilesenleri, sehirYapiGeliri,
  toplamalariIlerlet, yukle, type DunyaDurumu } from "../src";
import { TEST_SENARYOSU } from "./yardimci";

const B = { ag: agHazirla({ dugumler: TEST_SENARYOSU.sehirler.map((s, i) => ({ b: s.birim, x: i * 10000, y: 0, z: 100, kx: 10000, ky: 10000 })),
  kenarlar: [0, 1, 2, 3, 4].map((a) => ({ a, b: a + 1, mx: a * 10000 + 5000, my: 0, da: 5000, db: 5000, n: 0, g: 0 })) }) };
function yeni() {
  const d = baslangicDurumu({ ...TEST_SENARYOSU, sehirler: TEST_SENARYOSU.sehirler.map((s, i) => ({ ...s, dugum: i })) }, { tohum: 1453 });
  d.ordular = [];
  for (const v of d.devletler) { v.baskent = null; v.hazine = 10000; v.hukumdar!.mesruiyet = 100; v.din = "sunni"; }
  return d;
}
function ordu(d: DunyaDurumu, sehir = 1, devlet = 0) {
  const s = d.sehirler[sehir];
  const o = { id: d.sonrakiOrduId++, ad: "Asayiş", devlet, asker: gerekenAsayis(s), dugum: s.dugum, x: sehir * 10000, y: 0,
    hiz: 20000, rota: [], ilerleme: 0, hedef: null, moral: 1000, tutum: "dengeli" as const, cekiliyor: false, muharebe: null };
  d.ordular.push(o); return o;
}
function kriz() {
  const d = yeni(), s = d.sehirler[1];
  d.devletler[0].hukumdar!.mesruiyet = 0; d.devletler[0].hazine = -100;
  s.istikrar.fetihGun = d.gun;
  return d;
}
const puan = (d: DunyaDurumu, id: string) => riskBilesenleri(d, 1, B).find((x) => x.id === id)!.puan;
function ay(d: DunyaDurumu) { d.gun += 30; istikrarAyi(d, B); }

describe("7c risk bileşenleri", () => {
  it("meşruiyet, fetih ve eksi hazine sayısaldır; fetih zamanla söner", () => {
    const d = kriz(); expect(puan(d, "mesruiyet")).toBe(40); expect(puan(d, "fetih")).toBe(30); expect(puan(d, "ekonomi")).toBe(30);
    d.gun += 60; expect(puan(d, "fetih")).toBe(28);
    d.devletler[0].hukumdar = null; expect(puan(d, "mesruiyet")).toBe(40);
  });
  it("savaş süresi, işgal, kuşatma ve yakın düşman ayrı puanlar verir", () => {
    const d = yeni(), s = d.sehirler[1]; s.kontrol = 1;
    d.savaslar.push({ id: 1, saldiran: 0, savunan: 1, baslangic: d.gun - 180 });
    const o = ordu(d, 2, 1);
    d.kusatmalar.push({ sehir: 1, devlet: 1, savunan: 0, ordular: [o.id], yontem: "abluka", gun: 0, baslangic: d.gun, erzak: 1000 });
    expect(puan(d, "savas")).toBe(6); expect(puan(d, "isgal")).toBe(25);
    expect(puan(d, "kusatma")).toBe(25); expect(puan(d, "dusman")).toBe(15);
  });
  it("din payı küçük ağırlıktadır; bilinmiyor etkisiz ve din tek başına isyan yaratmaz", () => {
    const d = yeni(), s = d.sehirler[1]; s.gruplar = [{ din: "ortodoks", kultur: "diger", nufus: s.nufus }];
    expect(puan(d, "din")).toBe(10); istikrarAyi(d, B); expect(s.istikrar.risk).toBe(10);
    expect(s.istikrar.ayaklanma).toBe(false);
    d.devletler[0].din = "bilinmiyor"; expect(puan(d, "din")).toBe(0);
    d.devletler[0].din = "sunni"; s.gruplar[0].din = "bilinmiyor"; expect(puan(d, "din")).toBe(0);
  });
  it("yeterli duran ordu, başkent yakınlığı ve yardım azaltır; hareketli/düşman ordu asayiş sayılmaz", () => {
    const d = yeni(), s = d.sehirler[1]; const o = ordu(d);
    d.devletler[0].baskent = 0; s.istikrar.bagis = 20;
    expect(puan(d, "asayis")).toBe(-20); expect(puan(d, "baskent")).toBe(-10); expect(puan(d, "bagis")).toBe(-20);
    o.cekiliyor = true; expect(asayisAskeri(d, 1)).toBe(0); expect(puan(d, "asayis")).toBe(0);
  });
});

describe("7c aşamalar ve sonuçları", () => {
  it("yüksek risk önce yalnızca uyarır; üç ardışık ayda ayaklanma turu keser", () => {
    const d = kriz(), s = d.sehirler[1];
    ay(d); expect(s.istikrar.risk).toBe(99); expect(s.istikrar.ayaklanma).toBe(false); expect(d.aktifKesinti).toBeNull();
    ay(d); expect(s.istikrar.ayaklanma).toBe(false);
    ay(d); expect(s.istikrar.ayaklanma).toBe(true); expect(d.aktifKesinti?.neden).toMatch(/ayaklanma/);
    expect(d.gunluk.some((o) => o.tur === "isyan-uyari")).toBe(true);
  });
  it("yüksek risk sayacı kesintisiz olmalı; risk düşünce ayaklanma biter", () => {
    const d = kriz(), s = d.sehirler[1]; ay(d); ay(d);
    d.devletler[0].hazine = 10000; ay(d); expect(s.istikrar.yuksekAy).toBe(0);
    s.istikrar.ayaklanma = true; d.devletler[0].hukumdar!.mesruiyet = 100; ay(d);
    expect(s.istikrar.ayaklanma).toBe(false);
  });
  it("iki ay yeterli asayiş, risk hâlâ yüksek olsa da ayaklanmayı bitirir", () => {
    const d = kriz(), s = d.sehirler[1]; ay(d); ay(d); ay(d); ordu(d);
    ay(d); expect(s.istikrar.ayaklanma).toBe(true); ay(d); expect(s.istikrar.ayaklanma).toBe(false);
  });
  it("huzursuzluk şehir/çevre gelirini yarılar, ayaklanma sıfırlar; komşu arazi etkilenmez", () => {
    const d = yeni(), s = d.sehirler[1]; s.yapilar.tarla = 2;
    const once = araziGelirleri(d)[0], yapi = sehirYapiGeliri(d, s);
    s.istikrar.risk = 50;
    expect(sehirYapiGeliri(d, s)).toBe(yapi / 2); expect(araziGelirleri(d)[0]).toBe(once - 5);
    s.istikrar.ayaklanma = true;
    expect(sehirYapiGeliri(d, s)).toBe(0); expect(araziGelirleri(d)[0]).toBe(once - 10);
  });
  it("ayaklanmada yeni ve süren asker/inşaat işleri durur; bitince devam eder", () => {
    const d = yeni(), s = d.sehirler[1]; s.istikrar.ayaklanma = true;
    expect(emirVer(d, { tur: "askerTopla", sehir: 1, asker: 100 }, B).gecerli).toBe(false);
    expect(emirVer(d, { tur: "insaat", sehir: 1, yapi: "tarla" }, B).gecerli).toBe(false);
    d.askerToplamalar.push({ id: d.sonrakiToplamaId++, sehir: 1, devlet: 0, asker: 100, kalanGun: 5, bedel: 10 });
    d.insaatlar.push({ sehir: 1, devlet: 0, yapi: "tarla", hedef: 1, kalanGun: 5 });
    toplamalariIlerlet(d, B); insaatlariIlerlet(d); expect(d.askerToplamalar[0].kalanGun).toBe(5); expect(d.insaatlar[0].kalanGun).toBe(5);
    s.istikrar.ayaklanma = false; toplamalariIlerlet(d, B); insaatlariIlerlet(d);
    expect(d.askerToplamalar[0].kalanGun).toBe(4); expect(d.insaatlar[0].kalanGun).toBe(4);
  });
  it("değişim açıklaması hangi bileşenin kaç puan arttığını korur", () => {
    const d = yeni(), s = d.sehirler[1]; ay(d); d.devletler[0].hazine = -1; ay(d);
    expect(s.istikrar.degisim.find((x) => x.id === "ekonomi")?.puan).toBe(30);
    expect(s.istikrar.oncekiRisk).toBe(0); expect(s.istikrar.risk).toBe(30);
  });
});

describe("7c bağış, AI ve kayıt", () => {
  it("bağış kuyruğu para ayırır, borçlanamaz, tekrarlanamaz; aylar boyunca söner", () => {
    const d = kriz(); d.devletler[0].hazine = 300;
    expect(emirVer(d, { tur: "bagis", sehir: 1 }, B).gecerli).toBe(true);
    expect(kullanilabilirHazine(d, 0)).toBe(100); expect(d.devletler[0].hazine).toBe(300);
    expect(emirVer(d, { tur: "bagis", sehir: 1 }, B).gecerli).toBe(false);
    expect(emirVer(d, { tur: "harca", devlet: 0, miktar: 101, aciklama: "test" }, B).gecerli).toBe(false);
    emirleriUygula(d, B); expect(d.devletler[0].hazine).toBe(100); expect(d.sehirler[1].istikrar.bagis).toBe(20);
    ay(d); expect(puan(d, "bagis")).toBe(-15);
    for (let n = 0; n < 3; n++) ay(d); expect(d.sehirler[1].istikrar.bagis).toBe(0);
    d.devletler[0].hazine = -1; expect(emirVer(d, { tur: "bagis", sehir: 1 }, B).gecerli).toBe(false);
    expect(emirVer(d, { tur: "bagis", sehir: 2, devlet: 1 }, B).gecerli).toBe(false);
  });
  it("AI aynı bağış bedeli ve kurallarıyla riskli kendi şehrine yardım eder", () => {
    const d = yeni(); d.sehirler[2].istikrar.risk = 70;
    devletKarari(d, B, diplomasiOnHesap(d, B.ag), 1);
    expect(d.sehirler[2].istikrar.bagis).toBe(DENGE.IST_BAGIS_INDIRIM);
    expect(d.sehirler[2].istikrar.risk).toBe(70); // aylık hesap dışında risk değişmez
  });
  it("12→13 (ve sonrası) eski kayıt durumunu korur, fetih tarihini geçmişten taşır; bozuk risk reddedilir", () => {
    const d = yeni(); d.barislar.push({ savas: 1, devlet: 0, karsi: 1, sehirler: [1], birimler: [], gun: d.gun - 10, tazminat: 0 });
    const p = JSON.parse(kaydet(d)); p.sema = p.durum.sema = 12; for (const s of p.durum.sehirler) delete s.istikrar;
    const e = yukle(JSON.stringify(p)); expect(e.sema).toBe(SEMA_SURUMU); expect(e.ordular).toEqual(d.ordular); expect(e.devletler).toEqual(d.devletler);
    expect(e.sehirler[1].istikrar).toEqual({ ...bosIstikrar(), fetihGun: d.gun - 10 });
    const q = JSON.parse(kaydet(e)); q.durum.sehirler[1].istikrar.risk = 101; expect(() => yukle(JSON.stringify(q))).toThrow(/istikrar/);
  });
  it("riskli şehir ve yardım kayıt/yükle sonrası aynı deterministik sonuca devam eder", () => {
    const d = kriz(); ay(d); const e = yukle(kaydet(d));
    for (let n = 0; n < 5; n++) { ay(d); ay(e); }
    expect(durumOzeti(e)).toBe(durumOzeti(d)); expect(degismezler(d)).toEqual([]);
  });
});
