// OHM ilişki kimliği → proje devlet kimliği (yalnızca "ice-aktar" kayıtlar kullanılır).
// Ada göre değil kimliğe göre eşlenir; OHM'de ad değişse de eşleme bozulmaz.
// Not: alt düzey kayıtlar (4: dükalık, eyalet) üst devlete bağlanır; oyunun ilk sürümünde
// ayrı devlet olarak modellenmezler.

export const OHM_DEVLET = {
  2850427: "osm", // Ottoman Empire 1354–1456
  2960096: "mem", // Mamluk Sultanate
  2850426: "trb", // Empire of Trebizond
  2800988: "kib", // Kingdom of Cyprus
  2861791: "rod", // Knights Hospitaller
  2809440: "atn", // Duchy of Athens
  2929115: "efl", // Principality of Wallachia
  2849500: "kir", // Crimean Khanate
  2849209: "teo", // Principality of Theodoro
  2849210: "cen", // Gazaria (Cenova'nın Kırım kolonileri)
  2851376: "cen", // Republic of Genoa 1354–1453
  2849494: "alt", // Great Horde
  2849493: "nog", // Nogai Horde
  2965979: "cer", // Circassia
  2800700: "ven", // Republic of Venice 1449–1482
  2799688: "ven", // Margraviate of Istria (kıyı İstirya Venedik'te; iç kesim Habsburg — düşük kesinlik)
  2806821: "avs", // Triest (Habsburg)
  2830843: "avs", // Duchy of Carniola
  2830504: "boh", // Moravia (Bohemya tacı)
  2888200: "pap", // Papal States
  2795688: "pap", // Republic of Ancona (Papalık'a bağlı)
  2800702: "pap", // Lordship of Rimini (Papalık vekili)
  2750737: "pap", // Republic of Cospaia (çok küçük)
  2692734: "pap", // San Marino (çok küçük; ilk sürümde ayrı devlet değil)
  2800633: "flo", // Duchy of Florence
  2826187: "nap", // Aprutium beyond the Pescara (Napoli Krallığı)
  2751179: "ara", // Crown of Aragon
  2849131: "kas", // Crown of Castile
  2696429: "pol", // Podole Voivodeship
  2696431: "pol", // Ruthenian Voivodeship
  2852598: "kra", // Prince-Archbishopric of Salzburg
  2809505: "kra", // Prince-Bishopric of Passau
  2809511: "kra", // Prince-Bishopric of Regensburg
  2809510: "kra", // Free Imperial City of Regensburg
  2830492: "kra", // County of Abensberg
  2830494: "kra", // Imperial Abbey of Berchtesgaden
};

// Agent incelemesiyle reddedilen kayıtlar (DEC-0021 doğrulaması): uzun bir dönemi tek poligonla
// gösteren ve 1453 durumunu yansıtmayan kayıtlar. Bu birimler tahmin kuralıyla kalır.
export const OHM_RED = {
  2850427: "Osmanlı 1354–1456 kaydının poligonu yalnızca Bitinya ve Gelibolu'yu kapsıyor (1354 durumu); 1453 için geçersiz.",
  2850426: "Trabzon 1204–1461 kaydı Kırım'daki Perateia'yı içeriyor (13. yy durumu); 1453'te Trabzon yalnızca Doğu Karadeniz kıyısındaydı.",
};

// Kullanıcı kararıyla düzeltilen OHM atamaları (DEC-0022). Koşul, OHM'den gelen parçanın ait olduğu
// Natural Earth birimine bakar (b.kod: ülke, b.bolge: bölge, b.neAd: Natural Earth adı).
// devlet: null → OHM ataması geri alınır, birim tahmin kuralıyla kalır.
export const OHM_DUZELTME = [
  {
    ohm: 2751179, devlet: "nap", neden: "Napoli ayrı devlet (DEC-0022/1)",
    kosul: (b) => b.kod === "ITA" && !["Sicily", "Sardegna"].includes(b.bolge),
  },
  {
    ohm: 2849494, devlet: null, neden: "Dağıstan Gazikumuk Şamhallığı'nda kalır (DEC-0022/2)",
    kosul: (b) => b.kod === "RUS" && ["Dagestan", "Chechnya", "Ingush"].includes(b.neAd),
  },
  {
    ohm: 2960096, devlet: null, neden: "Urfa Akkoyunlu'ya döner (DEC-0022/3)",
    kosul: (b) => b.kod === "TUR" && b.neAd === "Sanliurfa",
  },
];
