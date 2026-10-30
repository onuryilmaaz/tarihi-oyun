// TASK-0009/6b: AI ekonomi ve ordu hazırlığı (DEC-0039)
import { describe, expect, it } from "vitest";
import {
  agHazirla, baslangicDurumu, butceOzeti, degismezler, DENGE, devletKarari, diplomasiOnHesap, durumOzeti, emirVer, gundenTarih,
  gunIlerlet, kaydet, SEMA_SURUMU, tehditNedeni, turSuresiAyarla, turuIlerlet, yukle, type DunyaDurumu, type SenaryoVerisi,
} from "../src";
import { yeniDurum } from "./yardimci";

const A = 0, B = 1;
const yedek = (d: DunyaDurumu, i: number) => Math.max(DENGE.YZ_YEDEK_EN_AZ, DENGE.YZ_YEDEK_AY * butceOzeti(d, i).aylikMaas);

describe("AI ekonomi (6b)", () => {
  it("barışta araştırır ve yatırım yapar; gönüllü harcama yedeğin altına inmez", () => {
    const d = yeniDurum();
    d.devletler[B].hazine = yedek(d, B) + 3000;
    devletKarari(d, { ag: null }, diplomasiOnHesap(d, null), B);
    expect(d.arastirmalar.filter((a) => a.devlet === B)).toHaveLength(1);
    expect(d.insaatlar.filter((i) => i.devlet === B).length).toBeGreaterThan(0);
    expect(d.devletler[B].hazine).toBeGreaterThanOrEqual(yedek(d, B));
    expect(d.yzSayac.arastirma).toBe(1);
    // Parası yedeğin altındaysa hiçbir şey yapmaz (borç yok, DEC-0002)
    const e = yeniDurum();
    e.devletler[B].hazine = yedek(e, B) - 1;
    const once = durumOzeti(e);
    devletKarari(e, { ag: null }, diplomasiOnHesap(e, null), B);
    expect(durumOzeti(e)).toBe(once);
    expect(degismezler(d)).toEqual([]);
  });

  it("oyuncunun devletine karar vermez; oyuncu başka devlet adına emir veremez", () => {
    const d = yeniDurum();
    for (const v of d.devletler) v.hazine = 100000;
    for (let i = 0; i < DENGE.YZ_KARAR_ARALIGI; i++) gunIlerlet(d);
    expect(d.arastirmalar.some((a) => a.devlet === A)).toBe(false);
    expect(d.insaatlar.some((i) => i.devlet === A)).toBe(false);
    expect(d.arastirmalar.some((a) => a.devlet === B)).toBe(true); // her AI 30 günde bir sırası gelir
    expect(emirVer(d, { tur: "arastir", teknoloji: "yargi", devlet: B }).gecerli).toBe(false);
    expect(emirVer(d, { tur: "insaat", sehir: 2, yapi: "tarla", devlet: B }).gecerli).toBe(false);
  });

  it("savaştaki devlet tehdit görür ve önce asker toplar (yalnızca görünür bilgiyle)", () => {
    const S: SenaryoVerisi = {
      id: "yz-test", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
      devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }],
      birimler: ["a", "b", "b"].map((devlet) => ({ devlet })),
      sehirler: [
        { ad: "A1", devlet: "a", birim: 0, dugum: 0, x: 0, y: 0, baskent: true, nufus: 40000 },
        { ad: "B1", devlet: "b", birim: 1, dugum: 1, x: 10000, y: 0, baskent: true, nufus: 40000 },
      ],
      ag: { dugumler: [0, 1, 2].map((b) => ({ b, x: b * 10000, y: 0, kx: 10000, ky: 10000, z: 100 })),
        kenarlar: [0, 1].map((a) => ({ a, b: a + 1, mx: a * 10000 + 5000, my: 0, da: 5000, db: 5000, n: 0, g: 0 })) },
    };
    const ag = agHazirla(S.ag!);
    const d = baslangicDurumu(S, { tohum: 1 });
    d.ordular = d.ordular.filter((o) => o.devlet !== B); // ordusu yok: hedef büyüklüğün altında
    d.devletler[B].hazine = 5000;
    const on = diplomasiOnHesap(d, ag);
    expect(tehditNedeni(d, on, B)).toBeNull();
    d.savaslar.push({ id: d.sonrakiSavasId++, saldiran: A, savunan: B, baslangic: d.gun });
    expect(tehditNedeni(d, on, B)).toMatch(/A ile savaşta/);
    devletKarari(d, { ag }, on, B);
    expect(d.askerToplamalar.filter((t) => t.devlet === B).length).toBe(1);
    expect(d.devletler[B].hazine).toBeGreaterThanOrEqual(yedek(d, B));
    expect(degismezler(d)).toEqual([]);
    // TASK-0021 (3/4): tehdit altındaki AI artık süvari toplar (piyadeden daha pahalı/hızlı/saldırgan)
    expect(d.askerToplamalar.find((t) => t.devlet === B)!.birim).toBe("suvari");
  });

  it("barışta AI zamanla hem okçu hem piyade toplar (TASK-0021 3/4)", () => {
    const S: SenaryoVerisi = {
      id: "yz-test-2", surum: "1", baslangic: { yil: 1453, ay: 4, gun: 1 }, varsayilanOyuncu: "a",
      devletler: [{ id: "a", ad: "A" }, { id: "b", ad: "B" }],
      birimler: ["a", "b", "b"].map((devlet) => ({ devlet })),
      sehirler: [
        { ad: "A1", devlet: "a", birim: 0, dugum: 0, x: 0, y: 0, baskent: true, nufus: 40000 },
        { ad: "B1", devlet: "b", birim: 1, dugum: 1, x: 10000, y: 0, baskent: true, nufus: 40000 },
      ],
      ag: { dugumler: [0, 1, 2].map((b) => ({ b, x: b * 10000, y: 0, kx: 10000, ky: 10000, z: 100 })),
        kenarlar: [0, 1].map((a) => ({ a, b: a + 1, mx: a * 10000 + 5000, my: 0, da: 5000, db: 5000, n: 0, g: 0 })) },
    };
    const ag = agHazirla(S.ag!);
    const gorulenler = new Set<string>();
    for (let tohum = 1; tohum < 60 && gorulenler.size < 2; tohum++) {
      const d = baslangicDurumu(S, { tohum });
      d.ordular = d.ordular.filter((o) => o.devlet !== B); // ordusu yok: hedef büyüklüğün altında
      d.devletler[B].hazine = 20000;
      const on = diplomasiOnHesap(d, ag);
      devletKarari(d, { ag }, on, B);
      const t = d.askerToplamalar.find((x) => x.devlet === B);
      if (t) gorulenler.add(t.birim);
      expect(degismezler(d)).toEqual([]);
    }
    expect(gorulenler.has("okcu")).toBe(true);
    expect(gorulenler.has("piyade")).toBe(true);
    expect(gorulenler.has("suvari")).toBe(false); // barışta süvari toplamaz
  });

  it("yıllık dünya özeti oyuncuya yalnızca toplu sayı verir", () => {
    const d = yeniDurum();
    for (const v of d.devletler) v.hazine = 100000;
    while (gundenTarih(d.gun).yil === 1453) gunIlerlet(d);
    const o = d.gunluk.find((x) => x.tur === "dunya-ozeti");
    expect(o?.metin).toMatch(/1453 yılında dünyada: \d+ yeni inşaat, \d+ araştırma/);
    expect(o?.metin).not.toMatch(/Devlet B|Devlet C/);
    expect(d.yzSayac).toEqual({ insaat: 0, arastirma: 0, asker: 0 });
  });

  it("AI kararlarıyla kayıt/yükleme ve tur süresi sonucu değiştirmez; şema 8 kaydı dönüştürülür", () => {
    const d = yeniDurum(), e = yeniDurum();
    for (const v of [...d.devletler, ...e.devletler]) v.hazine = 20000;
    turSuresiAyarla(d, "ay");
    turuIlerlet(d);
    const f = yukle(kaydet(d), d.senaryo);
    for (let i = 0; i < 5; i++) { turuIlerlet(d); turuIlerlet(f); }
    expect(durumOzeti(f)).toBe(durumOzeti(d));
    turSuresiAyarla(e, "yil");
    turuIlerlet(e);
    while (d.gun < e.gun) gunIlerlet(d);
    expect(d.arastirmalar).toEqual(e.arastirmalar);
    expect(d.insaatlar).toEqual(e.insaatlar);
    const p = JSON.parse(kaydet(yeniDurum()));
    p.sema = 8; p.durum.sema = 8;
    delete p.durum.yzSayac;
    const g = yukle(JSON.stringify(p));
    expect(g.sema).toBe(SEMA_SURUMU);
    expect(g.yzSayac).toEqual({ insaat: 0, arastirma: 0, asker: 0 });
  });
});
