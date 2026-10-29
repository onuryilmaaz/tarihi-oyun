// 1453 YAKLAŞIK siyasi harita — TASK-0002 görsel prototipi için.
//
// UYARI (MASTER_SPEC §5.1, DEC-0016): Bu atamalar agent'ın genel tarih bilgisine dayanan
// TAHMİNLERDİR; kaynaklandırılmamış ve tarihçi tarafından doğrulanmamıştır. Sınırlar modern
// Natural Earth 1. düzey idari birimlerinin (il/eyalet) 1453 devletlerine atanmasıyla kabaca
// çizilir. Gerçek senaryo verisi değildir. Senaryo anı: Konstantiniyye'nin fethinden önce
// (AT-002); Gaskonya henüz İngiliz.

// hue: isteğe bağlı sabit ton (0–1); verilmezse komşulardan uzak ton otomatik seçilir.
export const DEVLETLER = [
  // Anadolu, Balkanlar, Doğu Akdeniz (tam ayrıntı bölgesi)
  { id: "osm", ad: "Osmanlı Devleti", hue: 0.02 },
  { id: "biz", ad: "Bizans İmparatorluğu", hue: 0.79 },
  { id: "mor", ad: "Mora Despotluğu", hue: 0.74 },
  { id: "atn", ad: "Atina Dükalığı" },
  { id: "trb", ad: "Trabzon İmparatorluğu", hue: 0.83 },
  { id: "kar", ad: "Karamanoğulları", hue: 0.58 },
  { id: "can", ad: "Candaroğulları" },
  { id: "dul", ad: "Dulkadiroğulları" },
  { id: "ram", ad: "Ramazanoğulları" },
  { id: "akk", ad: "Akkoyunlular", hue: 0.12 },
  { id: "kkk", ad: "Karakoyunlular", hue: 0.45 },
  { id: "mem", ad: "Memlûk Sultanlığı", hue: 0.15 },
  { id: "grc", ad: "Gürcistan Krallığı" },
  { id: "sir", ad: "Şirvanşahlar" },
  { id: "dag", ad: "Gazikumuk Şamhallığı" },
  { id: "cer", ad: "Çerkes Beylikleri" },
  { id: "ser", ad: "Sırp Despotluğu", hue: 0.66 },
  { id: "bos", ad: "Bosna Krallığı" },
  { id: "hrc", ad: "Hersek Dükalığı" },
  { id: "zet", ad: "Zeta Beyliği" },
  { id: "arn", ad: "Arnavut Beyleri Birliği" },
  { id: "rag", ad: "Ragusa Cumhuriyeti" },
  { id: "ven", ad: "Venedik Cumhuriyeti", hue: 0.52 },
  { id: "cen", ad: "Cenova Cumhuriyeti" },
  { id: "rod", ad: "Rodos Şövalyeleri" },
  { id: "kib", ad: "Kıbrıs Krallığı" },
  { id: "nax", ad: "Nakşa Dükalığı" },
  { id: "hun", ad: "Macaristan Krallığı", hue: 0.3 },
  { id: "efl", ad: "Eflak Voyvodalığı" },
  { id: "bog", ad: "Boğdan Voyvodalığı" },
  { id: "kir", ad: "Kırım Hanlığı" },
  { id: "teo", ad: "Teodoro Prensliği" },
  { id: "alt", ad: "Büyük Orda" },
  { id: "kaz", ad: "Kazan Hanlığı" },
  { id: "nog", ad: "Nogay Ordası" },
  // Avrupa
  { id: "lit", ad: "Litvanya Büyük Dükalığı", hue: 0.4 },
  { id: "pol", ad: "Lehistan Krallığı" },
  { id: "tos", ad: "Töton Şövalyeleri Devleti" },
  { id: "liv", ad: "Livonya Konfederasyonu" },
  { id: "mos", ad: "Moskova Büyük Knezliği", hue: 0.07 },
  { id: "nov", ad: "Novgorod Cumhuriyeti" },
  { id: "psk", ad: "Pskov Cumhuriyeti" },
  { id: "tvr", ad: "Tver Büyük Knezliği" },
  { id: "rya", ad: "Ryazan Büyük Knezliği" },
  { id: "pap", ad: "Papalık Devleti" },
  { id: "nap", ad: "Napoli Krallığı" },
  { id: "mil", ad: "Milano Dükalığı" },
  { id: "flo", ad: "Floransa Cumhuriyeti" },
  { id: "sie", ad: "Siena Cumhuriyeti" },
  { id: "fer", ad: "Ferrara Markizliği" },
  { id: "man", ad: "Mantova Markizliği" },
  { id: "sav", ad: "Savoya Dükalığı" },
  { id: "kas", ad: "Kastilya Krallığı" },
  { id: "ara", ad: "Aragon Krallığı" },
  { id: "por", ad: "Portekiz Krallığı" },
  { id: "gir", ad: "Gırnata Emirliği" },
  { id: "nav", ad: "Navarra Krallığı" },
  { id: "fra", ad: "Fransa Krallığı", hue: 0.6 },
  { id: "ing", ad: "İngiltere Krallığı" },
  { id: "isk", ad: "İskoçya Krallığı" },
  { id: "irl", ad: "İrlanda Lordlukları" },
  { id: "brg", ad: "Burgonya Dükalığı" },
  { id: "bre", ad: "Bretanya Dükalığı" },
  { id: "lor", ad: "Lorraine Dükalığı" },
  { id: "pro", ad: "Provence Kontluğu" },
  { id: "avs", ad: "Avusturya Arşidükalığı" },
  { id: "boh", ad: "Bohemya Krallığı" },
  { id: "bav", ad: "Bavyera Dükalıkları" },
  { id: "sak", ad: "Saksonya" },
  { id: "bra", ad: "Brandenburg" },
  { id: "pal", ad: "Pfalz" },
  { id: "pom", ad: "Pomeranya Dükalığı" },
  { id: "kra", ad: "Kutsal Roma İmparatorluğu (diğer)" },
  { id: "isv", ad: "İsviçre Konfederasyonu" },
  { id: "dan", ad: "Danimarka-Norveç" },
  { id: "isw", ad: "İsveç Krallığı" },
  // Afrika
  { id: "fas", ad: "Fas Sultanlığı" },
  { id: "tle", ad: "Tlemsen Sultanlığı" },
  { id: "haf", ad: "Hafsî Sultanlığı" },
  { id: "mli", ad: "Mali İmparatorluğu" },
  { id: "son", ad: "Songay" },
  { id: "kan", ad: "Kanem-Bornu" },
  { id: "bnn", ad: "Benin Krallığı" },
  { id: "kon", ad: "Kongo Krallığı" },
  { id: "mut", ad: "Mutapa" },
  { id: "kil", ad: "Kilva Sultanlığı" },
  { id: "etp", ad: "Habeşistan" },
  { id: "ada", ad: "Adal Sultanlığı" },
  // Asya
  { id: "ymn", ad: "Yemen (Tahirîler)" },
  { id: "hrm", ad: "Hürmüz Krallığı" },
  { id: "tim", ad: "Timurlular", hue: 0.33 },
  { id: "ozb", ad: "Özbek Hanlığı" },
  { id: "mgl", ad: "Moğolistan Hanlığı" },
  { id: "tum", ad: "Tümen Hanlığı" },
  { id: "oir", ad: "Oyrat Konfederasyonu" },
  { id: "jur", ad: "Cürçen Kabileleri" },
  { id: "tib", ad: "Tibet" },
  { id: "min", ad: "Ming Hanedanı", hue: 0.1 },
  { id: "jos", ad: "Joseon" },
  { id: "jap", ad: "Aşikaga Şogunluğu" },
  { id: "dai", ad: "Đại Việt" },
  { id: "cha", ad: "Champa" },
  { id: "khm", ad: "Khmer Krallığı" },
  { id: "lan", ad: "Lan Xang" },
  { id: "lnn", ad: "Lanna" },
  { id: "aut", ad: "Ayutthaya Krallığı" },
  { id: "ava", ad: "Ava Krallığı" },
  { id: "peg", ad: "Hanthawaddy" },
  { id: "ark", ad: "Arakan" },
  { id: "mlk", ad: "Malakka Sultanlığı" },
  { id: "bru", ad: "Brunei" },
  { id: "mjp", ad: "Majapahit" },
  { id: "del", ad: "Delhi Sultanlığı" },
  { id: "jau", ad: "Jaunpur Sultanlığı" },
  { id: "ben", ad: "Bengal Sultanlığı" },
  { id: "guc", ad: "Gucerat Sultanlığı" },
  { id: "mal", ad: "Malva Sultanlığı" },
  { id: "bah", ad: "Behmenî Sultanlığı" },
  { id: "vij", ad: "Vijayanagara" },
  { id: "mew", ad: "Mewar" },
  { id: "ori", ad: "Orissa" },
  { id: "ksm", ad: "Keşmir Sultanlığı" },
  { id: "mlt", ad: "Multan Sultanlığı" },
  { id: "sin", ad: "Sind" },
  { id: "ahm", ad: "Ahom Krallığı" },
  { id: "kot", ad: "Kotte Krallığı" },
  // Amerika
  { id: "azt", ad: "Aztek Üçlü İttifakı" },
  { id: "tlx", ad: "Tlaxcala" },
  { id: "pur", ad: "Purépecha" },
  { id: "may", ad: "Maya Şehir Devletleri" },
  { id: "inka", ad: "İnka (Kusko)" },
  { id: "chi", ad: "Chimú Krallığı" },
];

const tablo = (nesne) => (p) => nesne[p.name];
const hepsi = (id) => () => id;

const TUR = {
  Edirne: "osm", Kirklareli: "osm", Tekirdag: "osm", "Çanakkale": "osm", Kocaeli: "osm", Yalova: "osm",
  Sakarya: "osm", Bursa: "osm", Bilecik: "osm", Balikesir: "osm", Izmir: "osm", Manisa: "osm", Aydin: "osm",
  Mugla: "osm", Denizli: "osm", Usak: "osm", "Kütahya": "osm", Afyonkarahisar: "osm", Eskisehir: "osm",
  Ankara: "osm", Bolu: "osm", "Düzce": "osm", Zinguldak: "osm", "Çankiri": "osm", "Çorum": "osm",
  Amasya: "osm", Tokat: "osm", Samsun: "osm", Ordu: "osm", Sivas: "osm", Yozgat: "osm", Kinkkale: "osm",
  Isparta: "osm", Burdur: "osm", Antalya: "osm",
  "Bartın": "can", "Karabük": "can", Kastamonu: "can", Sinop: "can",
  Giresun: "trb", Trabzon: "trb", Rize: "trb",
  Artvin: "grc", Ardahan: "grc",
  Kars: "kkk", "Iğdir": "kkk", Agri: "kkk", Van: "kkk", Hakkari: "kkk", Erzincan: "kkk",
  "Gümüshane": "akk", Bayburt: "akk", Erzurum: "akk", Bitlis: "akk", Mus: "akk", Tunceli: "akk",
  "Bingöl": "akk", Elazig: "akk", Diyarbakir: "akk", Batman: "akk", Siirt: "akk", Mardin: "akk",
  Sirnak: "akk", Sanliurfa: "akk",
  Adiyaman: "mem", Malatya: "mem", Hatay: "mem", Gaziantep: "mem", Kilis: "mem",
  "K. Maras": "dul", Kayseri: "dul",
  Osmaniye: "ram", Adana: "ram",
  Mersin: "kar", Kirsehir: "kar", Nevsehir: "kar", Aksaray: "kar", Nigde: "kar", Karaman: "kar", Konya: "kar",
  Istanbul: "osm", // Konstantiniyye ayrıca bölünür
};

const GRC = {
  "Dytiki Makedonia": "osm", Ipeiros: "osm", "Kentriki Makedonia": "osm", "Anatoliki Makedonia kai Thraki": "osm",
  "Ayion Oros": "osm", Thessalia: "osm", "Stereá Elláda": "osm", Attiki: "atn", Peloponnisos: "mor",
  "Dytiki Ellada": "osm", Kriti: "ven", "Notio Aigaio": "nax", "Voreio Aigaio": "cen", "Ionioi Nisoi": "ven",
};

const SRB_HUN = ["Severno-Backi", "Zapadno-Backi", "Južno-Backi", "Severno-Banatski", "Srednje-Banatski",
  "Južno-Banatski", "Sremski", "Grad Beograd"];
const SRB_OSM = ["Pcinjski", "Pirotski", "Nišavski", "Jablanicki"];

const ROU_EFL = ["Mehedinti", "Gorj", "Vâlcea", "Arges", "Dâmbovita", "Prahova", "Buzau", "Braila", "Ialomita",
  "Calarasi", "Giurgiu", "Teleorman", "Olt", "Dolj", "Ilfov", "Bucharest"];
const ROU_BOG = ["Suceava", "Botosani", "Iasi", "Neamt", "Bacau", "Vaslui", "Vrancea", "Galati"];

const UKR = {
  "L'viv": "pol", "Ternopil'": "pol", "Ivano-Frankivs'k": "pol", "Khmel'nyts'kyy": "pol", Transcarpathia: "hun",
  Chernivtsi: "bog", Volyn: "lit", Rivne: "lit", Zhytomyr: "lit", Kiev: "lit", "Kiev City": "lit", Chernihiv: "lit",
  Sumy: "lit", Poltava: "lit", Cherkasy: "lit", Vinnytsya: "lit", Odessa: "lit", Kirovohrad: "lit",
  Kharkiv: "alt", "Luhans'k": "alt", "Donets'k": "alt",
  "Dnipropetrovs'k": "kir", "Zaporizhzhya": "kir", Kherson: "kir", Mykolayiv: "kir",
};

const RUS = {
  Moskva: "mos", Moskovskaya: "mos", Vladimir: "mos", "Yaroslavl'": "mos", Kostroma: "mos", Ivanovo: "mos",
  Nizhegorod: "mos", Vologda: "mos", Tula: "mos", Kirov: "mos", "Perm'": "mos",
  Novgorod: "nov", Leningrad: "nov", "City of St. Petersburg": "nov", Karelia: "nov", "Arkhangel'sk": "nov",
  Murmansk: "nov", Nenets: "nov", Komi: "nov",
  Smolensk: "lit", Bryansk: "lit", Kaluga: "lit", Orel: "lit", Kursk: "lit",
  "Tver'": "tvr", "Ryazan'": "rya", Pskov: "psk", Kaliningrad: "tos",
  Tatarstan: "kaz", Chuvash: "kaz", "Mariy-El": "kaz", Udmurt: "kaz", "Ul'yanovsk": "kaz", Mordovia: "kaz",
  Volgograd: "alt", "Astrakhan'": "alt", Saratov: "alt", Samara: "alt", Penza: "alt", Tambov: "alt",
  Voronezh: "alt", Belgorod: "alt", Rostov: "alt", Kalmyk: "alt", Lipetsk: "alt", "Stavropol'": "alt",
  Krasnodar: "cer", Adygey: "cer", "Karachay-Cherkess": "cer", "Kabardin-Balkar": "cer",
  Dagestan: "dag", Chechnya: "dag", Ingush: "dag", "North Ossetia": "grc",
  Bashkortostan: "nog", Orenburg: "nog", Chelyabinsk: "nog",
  "Tyumen'": "tum", Kurgan: "tum", Omsk: "tum", Sverdlovsk: "tum",
  Crimea: "kir", Sevastopol: "kir",
};

const POL = {
  Pomeranian: "tos", "Warmian-Masurian": "tos", "Kuyavian-Pomeranian": "tos", "West Pomeranian": "pom",
  Lubusz: "bra", Silesian: "boh", "Lower Silesian": "boh", Opole: "boh",
};

const DEU = {
  Bayern: "bav", Sachsen: "sak", "Thüringen": "sak", "Sachsen-Anhalt": "sak", Brandenburg: "bra", Berlin: "bra",
  "Rheinland-Pfalz": "pal", "Mecklenburg-Vorpommern": "pom",
};

const FRA_ING = ["Gironde", "Landes"];
const FRA_BRG = ["Nord", "Pas-de-Calais", "Somme", "Côte-d'Or", "Saône-et-Loire", "Yonne", "Nièvre", "Doubs", "Jura",
  "Haute-Saône", "Territoire de Belfort"];
const FRA_SAV = ["Savoie", "Haute-Savoie", "Ain", "Alpes-Maritimes"];
const FRA_PRO = ["Bouches-du-Rhône", "Var", "Alpes-de-Haute-Provence"];
const FRA_LOR = ["Moselle", "Meurthe-et-Moselle", "Vosges", "Meuse"];
const FRA_KRA = ["Bas-Rhin", "Haut-Rhin"];

const ITA_BOLGE = {
  Piemonte: "sav", "Valle d'Aosta": "sav", Liguria: "cen", Lombardia: "mil", Veneto: "ven",
  "Friuli-Venezia Giulia": "ven", "Trentino-Alto Adige": "avs", Toscana: "flo", Marche: "pap", Umbria: "pap",
  Lazio: "pap", Abruzzo: "nap", Molise: "nap", Campania: "nap", Apulia: "nap", Basilicata: "nap", Calabria: "nap",
  Sicily: "ara", Sardegna: "ara",
};
const ITA_IL = {
  Novara: "mil", "Verbano-Cusio-Ossola": "mil", Alessandria: "mil", Bergamo: "ven", Brescia: "ven", Cremona: "ven",
  Mantova: "man", Trieste: "avs", Gorizia: "avs", Modena: "fer", "Reggio Emilia": "fer", Ferrara: "fer",
  Parma: "mil", Piacenza: "mil", Bologna: "pap", Ravenna: "pap", "Forlì-Cesena": "pap", Rimini: "pap",
  Siena: "sie", Grosseto: "sie",
};

const ESP_BOLGE = {
  "Aragón": "ara", "Cataluña": "ara", Valenciana: "ara", "Islas Baleares": "ara", "Foral de Navarra": "nav",
};
const ESP_GIR = ["Granada", "Málaga", "Almería"];

const IND = {
  Delhi: "del", Haryana: "del", Punjab: "del", Chandigarh: "del", Uttarakhand: "del", "Jammu and Kashmir": "ksm",
  Ladakh: "tib", Rajasthan: "mew", Gujarat: "guc", "Dadra and Nagar Haveli and Daman and Diu": "guc",
  "Madhya Pradesh": "mal", Bihar: "jau", Jharkhand: "jau", "West Bengal": "ben", Assam: "ahm", Odisha: "ori",
  Maharashtra: "bah", Telangana: "bah", Goa: "bah", "Andhra Pradesh": "vij", "Tamil Nadu": "vij",
  Kerala: "vij", Puducherry: "vij",
};

const CHN_DIS = { Xinjiang: "mgl", Xizang: "tib", Qinghai: "tib", "Inner Mongol": "oir", Heilongjiang: "jur",
  Jilin: "jur", Taiwan: null, "Paracel Islands": null };

const MEX = { "Distrito Federal": "azt", "México": "azt", Morelos: "azt", Hidalgo: "azt", Puebla: "azt",
  Veracruz: "azt", Guerrero: "azt", Tlaxcala: "tlx", "Michoacán": "pur", "Yucatán": "may", Campeche: "may",
  "Quintana Roo": "may" };

const PER = { Cusco: "inka", "Apurímac": "inka", Ayacucho: "inka", Huancavelica: "inka", "Junín": "inka",
  Puno: "inka", "La Libertad": "chi", Lambayeque: "chi", Piura: "chi", Tumbes: "chi", Cajamarca: "chi",
  "Áncash": "chi" };

const AZE_KKK = ["Naxçıvan Autonomous Republic", "Ganja-Gazakh Economic Region", "Kalbajar-Lachin Economic Region",
  "Yukhari Garabakh Economic Region"];

// Ülke kodu → atama fonksiyonu. p: Natural Earth özellikleri (lon/lat = etiket noktası).
const ULKE = {
  TUR: tablo(TUR),
  GRC: (p) => {
    if (p.name === "Dytiki Ellada") return null; // aşağıda enleme göre bölünür
    if (p.name === "Notio Aigaio") return null; // boylama göre bölünür
    return GRC[p.name];
  },
  CYP: hepsi("kib"), BGR: hepsi("osm"), MKD: hepsi("osm"), KOS: hepsi("ser"),
  SRB: (p) => (SRB_HUN.includes(p.name) ? "hun" : SRB_OSM.includes(p.name) ? "osm" : "ser"),
  ALB: (p) => (["Shkodër", "Lezhë", "Durrës"].includes(p.name) ? "ven"
    : ["Tiranë", "Dibër", "Kukës"].includes(p.name) ? "arn" : "osm"),
  MNE: (p) => (["Kotor", "Budva", "Tivat", "Bar", "Ulcinj"].includes(p.name) ? "ven"
    : ["Herceg Novi", "Pljevlja", "Plužine", "Žabljak", "Šavnik"].includes(p.name) ? "hrc"
    : ["Rožaje", "Berane", "Plav", "Andrijevica", "Bijelo Polje"].includes(p.name) ? "ser" : "zet"),
  BIH: (p) => (["Herzegovina-Neretva", "West Herzegovina", "Trebinje", "Foča"].includes(p.name) ? "hrc" : "bos"),
  HRV: (p) => (p.name === "Dubrovacko-Neretvanska" ? "rag"
    : ["Splitsko-Dalmatinska", "Šibensko-Kninska", "Zadarska", "Istarska"].includes(p.name) ? "ven" : "hun"),
  SVN: (p) => (p.region === "Pomurska" ? "hun" : p.region === "Obalno-kraška" ? "ven" : "avs"),
  HUN: hepsi("hun"), SVK: hepsi("hun"),
  ROU: (p) => (ROU_EFL.includes(p.name) ? "efl" : ROU_BOG.includes(p.name) ? "bog"
    : ["Tulcea", "Constanta"].includes(p.name) ? "osm" : "hun"),
  MDA: (p) => (["Stîngă Nistrului", "Transnistria", "Camenca", "Grigoriopol"].includes(p.name) ? "lit" : "bog"),
  UKR: tablo(UKR),
  RUS: (p) => RUS[p.name] ?? null,
  BLR: hepsi("lit"),
  LTU: (p) => (p.name.startsWith("Klaip") ? "tos" : "lit"),
  LVA: hepsi("liv"), EST: hepsi("liv"),
  POL: (p) => POL[p.name] ?? "pol",
  DEU: (p) => DEU[p.name] ?? "kra",
  AUT: (p) => (p.name === "Salzburg" ? "kra" : "avs"),
  CHE: (p) => (p.name === "Ticino" ? "mil" : ["Genève", "Vaud"].includes(p.name) ? "sav" : "isv"),
  LIE: hepsi("kra"), CZE: hepsi("boh"),
  FRA: (p) => {
    if (p.region === "Bretagne") return "bre";
    if (p.region === "Corse") return "cen";
    if (["Guyane française", "Martinique", "Guadeloupe", "Réunion", "Mayotte"].includes(p.region)) return null;
    if (FRA_ING.includes(p.name)) return "ing";
    if (FRA_BRG.includes(p.name)) return "brg";
    if (FRA_SAV.includes(p.name)) return "sav";
    if (FRA_PRO.includes(p.name)) return "pro";
    if (FRA_LOR.includes(p.name)) return "lor";
    if (FRA_KRA.includes(p.name)) return "kra";
    if (p.name === "Vaucluse") return "pap";
    if (p.name === "Pyrénées-Orientales") return "ara";
    return "fra";
  },
  MCO: hepsi("cen"), AND: hepsi("ara"),
  BEL: hepsi("brg"), LUX: hepsi("brg"),
  NLD: (p) => (["Groningen", "Friesland", "Drenthe"].includes(p.name) ? "kra" : "brg"),
  GBR: (p) => (p.geonunit === "Scotland" ? "isk" : p.geonunit === "Northern Ireland" ? "irl" : "ing"),
  IMN: hepsi("ing"),
  IRL: (p) => (["Dublin", "Meath", "Louth", "Kildare", "Fingal", "South Dublin", "Dún Laoghaire–Rathdown"]
    .includes(p.name) ? "ing" : "irl"),
  ESP: (p) => {
    if (["Ceuta", "Melilla", "Canary Is."].includes(p.region)) return p.region === "Canary Is." ? "kas" : null;
    if (ESP_GIR.includes(p.name)) return "gir";
    return ESP_BOLGE[p.region] ?? "kas";
  },
  PRT: hepsi("por"),
  ITA: (p) => ITA_IL[p.name] ?? ITA_BOLGE[p.region] ?? "pap",
  SMR: hepsi("pap"), VAT: hepsi("pap"), MLT: hepsi("ara"),
  DNK: hepsi("dan"), NOR: hepsi("dan"), ISL: hepsi("dan"), FRO: hepsi("dan"),
  SWE: hepsi("isw"), FIN: hepsi("isw"), ALD: hepsi("isw"),
  GEO: hepsi("grc"), ARM: hepsi("kkk"),
  AZE: (p) => (AZE_KKK.includes(p.region) ? "kkk" : "sir"),
  IRN: (p) => (["Hormozgan"].includes(p.name) ? "hrm" : p.longitude < 56 ? "kkk" : "tim"),
  IRQ: hepsi("kkk"),
  SYR: (p) => (p.name.startsWith("Hasaka") ? "akk" : "mem"),
  LBN: hepsi("mem"), ISR: hepsi("mem"), PSX: hepsi("mem"), JOR: hepsi("mem"), EGY: hepsi("mem"),
  SAU: (p) => (["Makkah", "Al Madinah", "Tabuk", "Al Bahah"].includes(p.name) ? "mem"
    : ["`Asir", "Jizan", "Najran"].includes(p.name) ? "ymn" : null),
  YEM: hepsi("ymn"), OMN: hepsi("hrm"), ARE: hepsi("hrm"), QAT: hepsi("hrm"), BHR: hepsi("hrm"),
  LBY: (p) => (p.longitude > 19 ? (p.latitude > 29 ? "mem" : null) : p.latitude > 30 ? "haf" : null),
  TUN: hepsi("haf"),
  DZA: (p) => (p.latitude < 33 ? null : p.longitude > 3.5 ? "haf" : "tle"),
  MAR: hepsi("fas"),
  MLI: (p) => (p.longitude > -2 ? "son" : "mli"),
  SEN: hepsi("mli"), GMB: hepsi("mli"), GIN: hepsi("mli"),
  NER: (p) => (p.longitude > 8 ? "kan" : p.longitude < 4 ? "son" : null),
  TCD: (p) => (p.latitude > 12 && p.latitude < 16 ? "kan" : null),
  NGA: (p) => (["Borno", "Yobe"].includes(p.name) ? "kan" : ["Edo", "Delta"].includes(p.name) ? "bnn" : null),
  ETH: (p) => (["Somali", "Afar", "Harari People", "Dire Dawa"].includes(p.name) ? "ada"
    : ["Amhara", "Tigray", "Addis Ababa"].includes(p.name) ? "etp" : null),
  ERI: hepsi("etp"), DJI: hepsi("ada"),
  SOM: (p) => (p.latitude > 9 ? "ada" : null), SOL: hepsi("ada"),
  AGO: (p) => (p.latitude > -8 && p.longitude < 17 ? "kon" : null),
  COD: (p) => (p.name.startsWith("Kongo") || p.name === "Bas-Congo" ? "kon" : null),
  ZWE: hepsi("mut"),
  TZA: (p) => (p.longitude > 38.5 && p.latitude > -11 ? "kil" : null),
  AFG: hepsi("tim"), TKM: hepsi("tim"), UZB: hepsi("tim"), TJK: hepsi("tim"),
  KAZ: (p) => (["East Kazakhstan", "Almaty", "Almaty City", "Zhambyl"].includes(p.name) ? "mgl"
    : ["West Kazakhstan", "Atyrau", "Mangghystau"].includes(p.name) ? "nog" : "ozb"),
  KGZ: hepsi("mgl"), MNG: hepsi("oir"),
  CHN: (p) => (p.name in CHN_DIS ? CHN_DIS[p.name] : "min"),
  KOR: hepsi("jos"), PRK: hepsi("jos"),
  JPN: (p) => (p.name === "Hokkaido" ? null : "jap"),
  VNM: (p) => (p.latitude > 16 ? "dai" : p.latitude > 10.8 ? "cha" : "khm"),
  LAO: hepsi("lan"), KHM: hepsi("khm"),
  THA: (p) => (p.latitude > 17.5 ? "lnn" : "aut"),
  MMR: (p) => (p.name === "Rakhine" ? "ark" : ["Yangon", "Bago", "Mon", "Ayeyarwady", "Kayin"].includes(p.name)
    ? "peg" : ["Tanintharyi"].includes(p.name) ? "aut" : "ava"),
  MYS: (p) => (["Sabah", "Sarawak", "Labuan"].includes(p.name) ? "bru" : "mlk"),
  BRN: hepsi("bru"), SGP: hepsi("mlk"),
  IDN: (p) => (/Jawa|Jakarta|Banten|Yogyakarta|Bali/.test(p.name) ? "mjp" : null),
  IND: (p) => (p.name === "Uttar Pradesh" ? (p.longitude < 80.5 ? "del" : "jau")
    : p.name === "Karnataka" ? (p.latitude > 15.5 ? "bah" : "vij") : IND[p.name] ?? null),
  BGD: hepsi("ben"),
  PAK: (p) => (p.name === "Punjab" ? "mlt" : p.name === "Sind" ? "sin" : p.name === "Azad Kashmir" ? "ksm" : null),
  LKA: hepsi("kot"),
  MEX: (p) => MEX[p.name] ?? null,
  GTM: hepsi("may"), BLZ: hepsi("may"),
  PER: (p) => PER[p.name] ?? null,
  BOL: (p) => (p.name === "La Paz" ? "inka" : null),
};

// Birim bölmeleri: [ülke, ad, kesici poligon (lon/lat), içeride kalan devlet, dışarıda kalan devlet]
export const BOLMELER = [
  // Konstantiniyye ve yakın çevresi: doğu sınırı Boğaz'ın Avrupa yakası. Natural Earth kıyısı bu ölçekte
  // kaba olduğundan sur içi tek başına seçilemeyecek kadar küçük kalıyor; oyun ölçeğinde genişletildi.
  ["TUR", "Istanbul", [[28.79, 40.95], [29.0, 40.95], [29.0, 41.03], [29.03, 41.07], [29.05, 41.14],
    [28.96, 41.15], [28.87, 41.13], [28.81, 41.08], [28.84, 41.03], [28.79, 40.95]], "biz", "osm"],
  ["GRC", "Dytiki Ellada", [[19, 36], [24, 36], [24, 38.32], [19, 38.32], [19, 36]], "mor", "osm"],
  ["GRC", "Notio Aigaio", [[26.6, 34], [30, 34], [30, 38], [26.6, 38], [26.6, 34]], "rod", "nax"],
];

// Çok küçük birimli ülkeler: birimler bu anahtara (ve devlete) göre birleştirilir.
// "bolge" → Natural Earth region alanı; "ulke" → ülkenin tamamı.
export const BIRLESTIR = {
  GBR: "bolge", SVN: "bolge", LVA: "bolge", PHL: "bolge", UGA: "bolge", MKD: "bolge", AZE: "bolge",
  THA: "bolge", KOS: "bolge", MLT: "ulke", BFA: "bolge", MDA: "ulke", MNE: "ulke",
};

export function ata(p) {
  const f = ULKE[p.adm0_a3];
  if (!f) return null;
  return f(p) ?? null;
}

// Önemli şehirler (yaklaşık konum). baskent: devletin merkezi.
export const SEHIRLER = [
  ["Konstantiniyye", 28.97, 41.01, "biz", 1], ["Edirne", 26.56, 41.68, "osm", 1], ["Bursa", 29.06, 40.19, "osm"],
  ["İznik", 29.72, 40.43, "osm"], ["Ankara", 32.86, 39.93, "osm"], ["Amasya", 35.83, 40.65, "osm"],
  ["Sivas", 37.02, 39.75, "osm"], ["Selanik", 22.94, 40.64, "osm"], ["Üsküp", 21.43, 42.0, "osm"],
  ["Sofya", 23.32, 42.7, "osm"], ["Filibe", 24.75, 42.15, "osm"], ["Gelibolu", 26.67, 40.41, "osm"],
  ["İzmir", 27.14, 38.42, "osm"], ["Antalya", 30.71, 36.9, "osm"], ["Tırnova", 25.63, 43.08, "osm"],
  ["Larende", 33.22, 37.18, "kar", 1], ["Konya", 32.49, 37.87, "kar"],
  ["Kastamonu", 33.78, 41.38, "can"], ["Sinop", 35.15, 42.03, "can", 1], // başkent: Wikidata Q2096678 (1453)
  ["Trabzon", 39.72, 41.0, "trb", 1], ["Elbistan", 37.19, 38.21, "dul", 1], ["Maraş", 36.94, 37.58, "dul"],
  ["Adana", 35.32, 37.0, "ram", 1], ["Diyarbakır", 40.23, 37.91, "akk", 1], ["Mardin", 40.74, 37.31, "akk"],
  ["Erzurum", 41.27, 39.9, "akk"],
  ["Tebriz", 46.29, 38.08, "kkk", 1], ["Bağdat", 44.36, 33.31, "kkk"], ["İsfahan", 51.67, 32.65, "kkk"],
  ["Şiraz", 52.53, 29.59, "kkk"], ["Van", 43.38, 38.49, "kkk"],
  ["Kahire", 31.24, 30.04, "mem", 1], ["İskenderiye", 29.92, 31.2, "mem"], ["Şam", 36.29, 33.51, "mem"],
  ["Halep", 37.16, 36.2, "mem"], ["Kudüs", 35.23, 31.78, "mem"], ["Mekke", 39.83, 21.42, "mem"],
  ["Medine", 39.61, 24.47, "mem"], ["Trablusşam", 35.84, 34.44, "mem"],
  ["Tiflis", 44.79, 41.72, "grc", 1], ["Şamahı", 48.64, 40.63, "sir", 1], ["Gazikumuk", 47.1, 42.0, "dag", 1],
  ["Semendire", 20.93, 44.66, "ser", 1], ["Novo Brdo", 21.43, 42.61, "ser"],
  ["Belgrad", 20.46, 44.82, "hun"], ["Buda", 19.04, 47.5, "hun", 1], ["Zagreb", 15.98, 45.81, "hun"],
  ["Pojon", 17.11, 48.15, "hun"], ["Kolojvar", 23.59, 46.77, "hun"],
  ["Bobovac", 18.27, 44.15, "bos", 1], ["Blagay", 17.88, 43.26, "hrc", 1], ["Jabljak", 19.15, 42.32, "zet", 1],
  ["Akçahisar", 19.79, 41.51, "arn", 1], ["Ragusa", 18.09, 42.65, "rag", 1],
  ["Mistra", 22.37, 37.07, "mor", 1], ["Atina", 23.73, 37.98, "atn"], ["Teb", 23.32, 38.32, "atn", 1], // başkent: Wikidata Q334714 (1453)
  ["Venedik", 12.34, 45.44, "ven", 1], ["Kandiye", 25.13, 35.34, "ven"], ["Zara", 15.23, 44.12, "ven"],
  ["Korfu", 19.92, 39.62, "ven"], ["Padova", 11.88, 45.41, "ven"],
  ["Cenova", 8.93, 44.41, "cen", 1], ["Sakız", 26.14, 38.37, "cen"], ["Kefe", 35.38, 45.03, "cen"],
  ["Rodos", 28.22, 36.43, "rod", 1], ["Lefkoşa", 33.36, 35.17, "kib", 1], ["Nakşa", 25.38, 37.1, "nax", 1],
  ["Tırgovişte", 25.46, 44.93, "efl", 1], ["Suçava", 26.25, 47.65, "bog", 1], ["Akkirman", 30.35, 46.2, "bog"],
  ["Kırkyer", 33.93, 44.74, "kir", 1], ["Mangup", 33.8, 44.59, "teo", 1], ["Saray", 45.17, 48.56, "alt", 1], ["Kazan", 49.11, 55.79, "kaz", 1],
  ["Saraycık", 51.48, 47.49, "nog", 1],
  ["Vilnius", 25.28, 54.69, "lit", 1], ["Kiev", 30.52, 50.45, "lit"], ["Smolensk", 32.04, 54.78, "lit"],
  ["Krakov", 19.94, 50.06, "pol", 1], ["Lviv", 24.03, 49.84, "pol"], ["Varşova", 21.01, 52.23, "pol"],
  ["Marienburg", 19.03, 54.04, "tos", 1], ["Danzig", 18.65, 54.35, "tos"], ["Riga", 24.11, 56.95, "liv", 1],
  ["Moskova", 37.62, 55.75, "mos", 1], ["Novgorod", 31.27, 58.52, "nov", 1], ["Pskov", 28.33, 57.82, "psk", 1],
  ["Tver", 35.91, 56.86, "tvr", 1], ["Ryazan", 39.74, 54.63, "rya", 1],
  ["Roma", 12.5, 41.9, "pap", 1], ["Napoli", 14.27, 40.85, "nap", 1], ["Milano", 9.19, 45.46, "mil", 1],
  ["Floransa", 11.26, 43.77, "flo", 1], ["Siena", 11.33, 43.32, "sie", 1], ["Ferrara", 11.62, 44.84, "fer", 1],
  ["Mantova", 10.79, 45.16, "man", 1], ["Chambéry", 5.92, 45.57, "sav", 1], ["Palermo", 13.36, 38.12, "ara"],
  ["Saragosa", -0.88, 41.65, "ara", 1], ["Barselona", 2.17, 41.39, "ara"], ["Valensiya", -0.38, 39.47, "ara"],
  ["Valladolid", -4.72, 41.65, "kas", 1], ["Sevilla", -5.98, 37.39, "kas"], ["Toledo", -4.02, 39.86, "kas"],
  ["Lizbon", -9.14, 38.72, "por", 1], ["Gırnata", -3.6, 37.18, "gir", 1], ["Pamplona", -1.64, 42.81, "nav", 1],
  ["Paris", 2.35, 48.86, "fra", 1], ["Lyon", 4.84, 45.76, "fra"], ["Bordo", -0.58, 44.84, "ing"],
  ["Londra", -0.13, 51.51, "ing", 1], ["Edinburgh", -3.19, 55.95, "isk", 1], ["Dublin", -6.26, 53.35, "ing"],
  ["Dijon", 5.04, 47.32, "brg", 1], ["Brugge", 3.22, 51.21, "brg"], ["Nantes", -1.55, 47.22, "bre", 1],
  ["Nancy", 6.18, 48.69, "lor", 1], ["Aix", 5.45, 43.53, "pro", 1],
  ["Viyana", 16.37, 48.21, "avs", 1], ["Prag", 14.42, 50.08, "boh", 1], ["Münih", 11.58, 48.14, "bav", 1],
  ["Meissen", 13.47, 51.16, "sak", 1], ["Berlin", 13.4, 52.52, "bra", 1], ["Heidelberg", 8.69, 49.4, "pal", 1],
  ["Stettin", 14.55, 53.43, "pom", 1], ["Köln", 6.96, 50.94, "kra"], ["Nürnberg", 11.08, 49.45, "kra"],
  ["Lübeck", 10.69, 53.87, "kra"], ["Bern", 7.45, 46.95, "isv", 1],
  ["Kopenhag", 12.57, 55.68, "dan", 1], ["Bergen", 5.32, 60.39, "dan"], ["Stockholm", 18.07, 59.33, "isw", 1],
  ["Fes", -5.0, 34.03, "fas", 1], ["Tlemsen", -1.32, 34.88, "tle", 1], ["Tunus", 10.17, 36.81, "haf", 1],
  ["Niani", -8.9, 11.4, "mli", 1], ["Timbuktu", -3.0, 16.77, "mli"], ["Gao", -0.04, 16.27, "son", 1],
  ["Ngazargamu", 11.53, 13.21, "kan", 1], ["Benin", 5.62, 6.34, "bnn", 1], ["Mbanza Kongo", 14.24, -6.27, "kon", 1],
  ["Büyük Zimbabve", 30.93, -20.27, "mut", 1], ["Kilva", 39.51, -8.96, "kil", 1],
  ["Debre Berhan", 39.53, 9.68, "etp", 1], ["Zeyla", 43.47, 11.35, "ada", 1],
  ["Zebid", 43.32, 14.2, "ymn", 1], ["Hürmüz", 56.46, 27.1, "hrm", 1],
  ["Herat", 62.2, 34.35, "tim", 1], ["Semerkant", 66.96, 39.65, "tim"], ["Buhara", 64.42, 39.77, "tim"],
  ["Sığnak", 68.27, 44.09, "ozb", 1], ["Kaşgar", 75.99, 39.47, "mgl", 1], ["Tümen", 65.53, 57.15, "tum", 1],
  ["Karakurum", 102.83, 47.2, "oir", 1], ["Nedong", 91.75, 29.24, "tib", 1],
  ["Pekin", 116.4, 39.9, "min", 1], ["Nankin", 118.8, 32.06, "min"], ["Kanton", 113.26, 23.13, "min"],
  ["Hanseong", 126.98, 37.57, "jos", 1], ["Kyoto", 135.77, 35.01, "jap", 1],
  ["Thăng Long", 105.85, 21.03, "dai", 1], ["Vijaya", 109.1, 13.9, "cha", 1], ["Phnom Penh", 104.92, 11.56, "khm", 1],
  ["Luang Prabang", 102.14, 19.89, "lan", 1], ["Chiang Mai", 98.98, 18.79, "lnn", 1],
  ["Ayutthaya", 100.57, 14.36, "aut", 1], ["Ava", 95.98, 21.86, "ava", 1], ["Pegu", 96.48, 17.34, "peg", 1],
  ["Mrauk U", 93.19, 20.59, "ark", 1], ["Malakka", 102.25, 2.19, "mlk", 1], ["Brunei", 114.94, 4.89, "bru", 1],
  ["Trowulan", 112.38, -7.56, "mjp", 1],
  ["Delhi", 77.21, 28.61, "del", 1], ["Jaunpur", 82.68, 25.75, "jau", 1], ["Gaur", 88.13, 24.87, "ben", 1],
  ["Ahmedabad", 72.57, 23.02, "guc", 1], ["Mandu", 75.4, 22.36, "mal", 1], ["Bidar", 77.52, 17.91, "bah", 1],
  ["Vijayanagara", 76.46, 15.33, "vij", 1], ["Chittor", 74.65, 24.88, "mew", 1], ["Srinagar", 74.8, 34.08, "ksm", 1],
  ["Multan", 71.47, 30.2, "mlt", 1], ["Thatta", 67.92, 24.75, "sin", 1], ["Kotte", 79.9, 6.89, "kot", 1],
  ["Cuttack", 85.88, 20.46, "ori", 1], ["Charaideo", 94.8, 26.95, "ahm", 1],
  ["Tenochtitlan", -99.13, 19.43, "azt", 1], ["Tlaxcala", -98.24, 19.32, "tlx", 1],
  ["Tzintzuntzan", -101.58, 19.63, "pur", 1], ["Mani", -89.39, 20.38, "may", 1],
  ["Kusko", -71.97, -13.53, "inka", 1], ["Chan Chan", -79.07, -8.11, "chi", 1],
];
