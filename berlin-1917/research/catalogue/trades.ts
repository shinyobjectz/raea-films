// From an address-book entry to the shop kit that furnishes it. The Berliner Adreßbuch 1917 prints each business with
// an abbreviated trade ("Pelzwr. T." = Pelzwaren, with a telephone); tools/addr placed Leipziger Straße's 213 storefronts
// in compositions/leipziger-houses.json. The first rule whose pattern matches the entry wins, so specific trades come
// before general ones. `bun tools/refs/trades.ts` reports how many storefronts each kit gets and which are unmatched.
export const TRADES: [RegExp, string][] = [
  [/Kriegs|Kontrollstelle|Zentrale|Reichs/i, "office-room"],
  [/Bierquelle|Bierhall|Aschinger/i, "shop-aschinger"], // Aschinger's and every other beer hall (the Passage's)
  [/Möbel|gebog/i, "shop-furniture"],
  [/Optik|Optiker/i, "shop-optician"],
  [/Spielw/i, "shop-toys"],
  [/Volksküche(?!n)|Kriegsküche|Mittelstandsküche/, "war-kitchen"], // the war's public kitchens (interiors/warkitchen.ts); not the Volksküchen society's office
  [/Weinstub|Winzerstube|Kempinski|Restaur|Bierhaus|Ausschank/i, "shop-weinstube"],
  [/Weingroß ?h|Weinhdl|Weinh\.|Weinag|\bWein\./i, "shop-wine-merchant"],
  [/Konditor|Cafetier|Café|Cafe/i, "shop-konditorei"],
  [/\bHotel(?!portier|diener|bedarf|page|koch|agent|silber|wäsche)|Hospiz/i, "shop-hotel"], // the Linden's, Wilhelm- and Friedrichstraße's hotels (Adlon, Bristol, Central-Hotel), by name or their owner's entry; after the café, so Café Bauer stays one; not the people and firms who serve hotels (a porter's home, a hotel-supply house)
  [/Schokolad|Konfitür|Zuckerwar|Bonbon/i, "shop-chocolate"],
  [/Bäcker|Bäckerei/i, "shop-baker"],
  [/Schlächter|Fleischer|Fleischw|Wurst/i, "shop-butcher"],
  [/Milch|Meierei|Molkerei/i, "shop-dairy"],
  [/Butter|Delikat|Feinkost|Wildhdl|Geflügel/i, "shop-butter-deli"],
  [/Kolonialw|Kolonialwar|Materialw|Kaffeeh|Kaffeer|\bTee/i, "shop-grocer"],
  [/Kartoffel|Grünkram|Gemüse|Obst/i, "shop-greengrocer"],
  [/Kohlen/i, "coal-cellar-shop"],
  [/Destill|Schankw|Gastw|Likör/i, "shop-destille"],
  [/Zigarr|Tabak|Cigarr/i, "shop-tobacco"],
  [/Friseur|Frisör|Barbier/i, "shop-barber"],
  [/Apothek/i, "shop-pharmacy"],
  [/Drog|Seifen|Parfüm/i, "shop-drugstore"],
  [/Pelz/i, "shop-furs"],
  [/H[uü]t|Putz|Modist/i, "shop-hats"],
  [/Seidenw|Seide|Spitzen|Weißw|Leinen|Stoffe|Tuch/i, "shop-fabric"],
  [/Handschuh|Strumpf|Korsett|Wäsche|Krawatt|Schirm|Knöpfe|Posament|Kurzw/i, "shop-small-goods"],
  [/Herren ?mod|Herren ?bekleid|Herren ?schneid|Herren ?maßg|Herren ?kleid|Herrengard|Herren ?aus ?st|Herrenkonf|Herrenart|Hemden/i, "shop-menswear"],
  [/Damenkonf|Damenschneid|Damenmänt|Mäntel|Modehaus|Mode[- ]?salon|Kleider|Modeart|Modew|Mode ?Atel|Damen ?mod|Damenkleid|Konfekt|Confekt|Kostüm|Blusen|Morgenr|Kinderkonf/i, "shop-fashion"],
  [/Schuh|Stiefel/i, "shop-shoes"],
  [/Juwel|Goldschmied|Goldw|Uhren|Uhrm/i, "shop-jeweller"],
  [/Bijout|Galanter|Luxus/i, "shop-fancy"],
  [/Silberw|Silber\b|Bronze|Glasw|Porzell|Kristall|Kaffeemasch|Haushalt/i, "shop-glass-silver"],
  [/Teppich|Gardinen|Möbelst/i, "shop-carpets"],
  [/Lederw|Koffer|Reiseart/i, "shop-leather"],
  [/Musikal|Piano|Klavier|Grammophon/i, "shop-books-music"],
  [/Buchh(?!alt)|Buch- ?Hdl|Papier|Schreibw|Verlag|journal/i, "shop-books-music"], // not a Buchhalterei (accounts office)
  [/Kunsth|Kunstgew|Gemälde|Antiqu/i, "shop-art"],
  [/Photogr|Atelier|Porträt/i, "shop-photo"],
  [/Bank|Bankier|Wechsel/i, "shop-bank"],
  [/Pfand|Leihh/i, "shop-pawn"],
  [/Altw|Lumpen|Hadern|Produkten/i, "shop-rags"],
  [/Wäscher|Plätter|Färber/i, "shop-laundry"],
  [/Blumenfab|Kunstbl|Federn/i, "hw-flowers"], // artificial flowers, a home trade
  [/Blumen|Kranzbind|Gärtner/i, "shop-florist"],
  [/(?:^|[\s,.])(?:Warenh|Kaufh)/, "shop-department"], // the word on its own, not the names ("Tietz, H., Bürodien." and "Wertheim Grundstücks-Ges." aren't stores) nor a compound ("Schuhwarenhaus" is a shoe shop)
];

// An entry is "Surname, initials, trade. T.": rules are tried on what follows the surname first, so a name like
// "Huth" or "Anschütz" never reads as a trade, and on the whole entry only when that finds nothing.
const rule = (s: string) => TRADES.find(([re]) => re.test(s))?.[1];
export const kitFor = (entry: string) => { const i = entry.indexOf(","); return (i > 0 ? rule(entry.slice(i + 1)) : undefined) ?? rule(entry); };
