import { describe, expect, it } from "vitest";
import { agHazirla, arastirmalariIlerlet, arastirmaHizlari, baslangicDurumu, degismezler, DENGE, durumOzeti, emirleriUygula, emirVer, insanGucuTavani, insaatlariIlerlet, kaynakAyi, kaynakUretimleri, kaydet, kullanilabilirKaynak, sehirYapiGeliri, toplamaSuresi, yukle, type SenaryoVerisi } from "../src";
import { TEST_SENARYOSU } from "./yardimci";
const S: SenaryoVerisi = { ...TEST_SENARYOSU, sehirler: TEST_SENARYOSU.sehirler.map(s=>({...s,dugum:s.birim,x:s.birim*10000,y:0})),
 ag:{dugumler:TEST_SENARYOSU.birimler.map((_,b)=>({b,x:b*10000,y:0,z:100,kx:10000,ky:10000})),kenarlar:Array.from({length:11},(_,a)=>({a,b:a+1,mx:a*10000+5000,my:0,da:5000,db:5000,n:0,g:0}))}};
const B={ag:agHazirla(S.ag!)};
const yeni=()=>{const d=baslangicDurumu(S,{tohum:1});d.devletler[0].hazine=20000;return d;};
describe("kaynak ve yeni yapılar",()=>{
 it("üretim gerçek stok ekler; tarla/atölye/teknoloji artırır, ayaklanma ve kuşatma keser",()=>{
  const d=yeni(),s=d.sehirler[0];d.ordular=[];s.gelirKaynagi="tarim";
  const u=kaynakUretimleri(d,B)[0].tahil;expect(u).toBeGreaterThan(0);
  s.yapilar.tarla=1;s.ekYapilar.atolye=1;d.devletler[0].teknolojiler=["tarimDonusumu"];
  const artan=kaynakUretimleri(d,B)[0].tahil;expect(artan).toBeGreaterThan(u);
  const once=d.devletler[0].kaynaklar.tahil;kaynakAyi(d,B);expect(d.devletler[0].kaynaklar.tahil).toBe(once+artan);
  s.istikrar.ayaklanma=true;expect(kaynakUretimleri(d,B)[0].tahil).toBe(0);
 });
 it("yeni inşaat para ve kaynak ayırır; tekrarlı emir stok aşamaz; biten atölye gelir üretir",()=>{
  const d=yeni();d.devletler[0].kaynaklar.kereste=25;
  const e={tur:"insaat" as const,sehir:0,yapi:"atolye" as const};
  expect(emirVer(d,e,B).gecerli).toBe(true);expect(d.devletler[0].kaynaklar.kereste).toBe(25);expect(kullanilabilirKaynak(d,0).kereste).toBe(5);
  expect(emirVer(d,{...e,sehir:1},B).gecerli).toBe(false);emirleriUygula(d,B);expect(d.devletler[0].kaynaklar.kereste).toBe(5);
  const kayit=yukle(kaydet(d));for(const x of [d,kayit])for(let i=0;i<DENGE.YAPI_SURE_GUN.atolye;i++)insaatlariIlerlet(x);
  expect(durumOzeti(d)).toBe(durumOzeti(kayit));expect(d.sehirler[0].ekYapilar.atolye).toBe(1);expect(sehirYapiGeliri(d,d.sehirler[0])).toBeGreaterThan(0);expect(degismezler(d)).toEqual([]);
 });
 it("okul araştırmayı gerçekten hızlandırır; kışla süre ve havuzu değiştirir",()=>{
  const d=yeni(),s=d.sehirler[0];const eski=insanGucuTavani(d,0);s.ekYapilar.kisla=2;s.ekYapilar.okul=3;
  expect(insanGucuTavani(d,0)).toBeGreaterThan(eski);expect(toplamaSuresi(d,0,0)).toBeLessThan(DENGE.TOPLAMA_GUN);
  d.devletler[0].teknolojiler=["matbaa"];expect(arastirmaHizlari(d)[0]).toBe(130);
  d.arastirmalar=[{devlet:0,teknoloji:"sulama",kalanGun:100}];
  for(let i=0;i<77;i++)arastirmalariIlerlet(d);expect(d.devletler[0].teknolojiler).toContain("sulama");expect(d.arastirmalar).toEqual([]);
 });
 it("kaynak alımı anlaşma/açık yol ister; para ve kaynak iki tarafa gerçek aktarılır; ambargo ve rezerv korunur",()=>{
  const d=yeni(),e={tur:"kaynakAl" as const,hedef:1,kaynak:"demir" as const,miktar:40};
  expect(emirVer(d,e,B).gecerli).toBe(false);d.ticaretAnlasmalari=[{a:0,b:1,baslangic:d.gun}];
  expect(emirVer(d,e,B).gecerli).toBe(true);expect(emirVer(d,e,B).gecerli).toBe(false); // 50 birim ihracat, 40 ayrıldı
  const stok=d.devletler.map(v=>v.kaynaklar.demir),para=d.devletler.map(v=>v.hazine);emirleriUygula(d,B);
  expect(d.devletler[0].kaynaklar.demir).toBe(stok[0]+40);expect(d.devletler[1].kaynaklar.demir).toBe(stok[1]-40);
  expect(d.devletler[0].hazine+d.devletler[1].hazine).toBe(para[0]+para[1]);
  d.ambargolar=[{devlet:0,hedef:1}];expect(emirVer(d,{...e,miktar:1},B).gecerli).toBe(false);
  d.ambargolar=[];d.devletler[0].hazine=-1;expect(emirVer(d,{...e,miktar:1},B).gecerli).toBe(false);
 });
 it("tahıl açlığı stokları eksiye düşürmez ve asker moraline görünür etki yapar",()=>{
  const d=yeni(),o=d.ordular[0];d.devletler[o.devlet].kaynaklar.tahil=0;for(const s of d.sehirler)s.istikrar.ayaklanma=true;
  const moral=o.moral;kaynakAyi(d,B);expect(d.devletler[o.devlet].kaynaklar.tahil).toBe(0);expect(o.moral).toBeLessThan(moral);
 });
});
