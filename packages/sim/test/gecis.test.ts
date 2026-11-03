import { describe, expect, it } from "vitest";
import { agHazirla, baslangicDurumu, degismezler, diplomasiOnHesap, durumOzeti, emirleriUygula, emirVer, gecisleriDenetle, gecisVer, kaydet, rotaBul, yukle, yzDiplomatikBaglar, type SenaryoVerisi } from "../src";
const S: SenaryoVerisi = {
 id:"gecis",surum:"1",baslangic:{yil:1453,ay:4,gun:1},varsayilanOyuncu:"a",
 devletler:["a","b","c"].map(id=>({id,ad:id})),birimler:["a","b","c"].map(devlet=>({devlet})),
 sehirler:["a","b","c"].map((devlet,i)=>({ad:devlet,devlet,birim:i,dugum:i,baskent:true,nufus:10000,x:i*10000,y:0})),
 ordular:[{ad:"A",devlet:"a",asker:1000,dugum:0,x:0,y:0}],
 ag:{dugumler:[0,1,2].map(b=>({b,x:b*10000,y:0,z:100,kx:10000,ky:10000})),kenarlar:[0,1].map(a=>({a,b:a+1,mx:a*10000+5000,my:0,da:5000,db:5000,n:0,g:0}))}
};
const B={ag:agHazirla(S.ag!)};
const yeni=()=>baslangicDurumu(S,{tohum:42});
const hedef={dugum:2,x:20000,y:0};
describe("askerî geçiş",()=>{
 it("izin gerçek üçüncü devlet koridorunu açar; karşı yönde veya mülkiyette hak vermez",()=>{
  const d=yeni(),o=d.ordular[0];d.savaslar=[{id:1,saldiran:0,savunan:2,baslangic:d.gun}];d.sonrakiSavasId=2;
  expect(rotaBul(d,B.ag,o,hedef).gecerli).toBe(false);
  gecisVer(d,1,0,12);expect(rotaBul(d,B.ag,o,hedef).gecerli).toBe(true);
  expect(d.birimler[1]).toMatchObject({sahip:1,kontrol:1});
  expect(d.gecisIzinleri.some(g=>g.veren===0&&g.alan===1)).toBe(false);
  expect(degismezler(d)).toEqual([]);
 });
 it("istek turda değerlendirilir; ret ve ittifakla kabul, kuyruk tekrarı ve geçersiz süre",()=>{
  const d=yeni(),e={tur:"gecisIzin" as const,hedef:1,eylem:"iste" as const,ay:12};
  expect(emirVer(d,{...e,ay:1},B).gecerli).toBe(false);
  expect(emirVer(d,e,B).gecerli).toBe(true);expect(d.gecisIzinleri).toEqual([]);
  expect(emirVer(d,e,B).gecerli).toBe(false);emirleriUygula(d,B);expect(d.gecisIzinleri).toEqual([]);
  d.ittifaklar.push({a:0,b:1,baslangic:d.gun});expect(emirVer(d,e,B).gecerli).toBe(true);emirleriUygula(d,B);
  expect(d.gecisIzinleri).toHaveLength(1);
  const k=yukle(kaydet(d));expect(durumOzeti(k)).toBe(durumOzeti(d));
  expect(emirVer(d,{tur:"gecisIzin",hedef:1,eylem:"vazgec"},B).gecerli).toBe(true);emirleriUygula(d,B);expect(d.gecisIzinleri).toEqual([]);
 });
 it("süre bitince yürüyüş konumu korunur ve rota durur; savaş izni düşürür",()=>{
  const d=yeni(),o=d.ordular[0];gecisVer(d,1,0,12);o.rota=[{d:1,x:10000,y:0,m:10000}];o.ilerleme=2500;
  d.gun=d.gecisIzinleri[0].bitis;gecisleriDenetle(d,B);expect(o.x).toBe(2500);expect(o.rota).toEqual([]);
  gecisVer(d,1,0,12);d.savaslar=[{id:1,saldiran:0,savunan:1,baslangic:d.gun}];gecisleriDenetle(d,B);expect(d.gecisIzinleri).toEqual([]);
 });
 it("AI çiftleri oyuncu adına anlaşma kurmaz; kabul koşullarıyla gerçek yeni bağ kurar",()=>{
  let kuruldu=false;
  for(let seed=1;seed<=100&&!kuruldu;seed++){
   const d=baslangicDurumu(S,{tohum:seed});d.iliskiEtkileri=[{a:1,b:2,neden:"tarih",deger:80}];
   while((d.gun+1)%180)d.gun++;const on=diplomasiOnHesap(d,B.ag);yzDiplomatikBaglar(d,on,1);
   if(d.ittifaklar.length){kuruldu=true;expect(d.ittifaklar).toEqual([{a:1,b:2,baslangic:d.gun}]);expect(degismezler(d)).toEqual([]);}
  }
  expect(kuruldu).toBe(true);
 });
});
