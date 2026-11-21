// What a shop's fascia says. From the 1917 Adreßbuch's storefront entry ("Borchardt, Gebr., Zigarren-Imp T."): the
// firm as it was painted ("GEBR. BORCHARDT") and its trade with the book's abbreviations written out
// ("ZIGARREN-IMPORT"); a shop the book doesn't record gets its trade's plain sign ("KOLONIALWAREN"), never an invented
// name. The lettering and colours go by trade, as the street photographs show them: gilt fat-face capitals on black
// glass for the fine trades (jeweller, furrier, fashion, bank, Konditorei, wine), white condensed grotesque on dark green
// or oxblood for the everyday ones (grocer, tobacconist, dairy, shoes), black Antiqua on cream for the booksellers and
// the pharmacy, and Fraktur for the old trades (the Destille, the baker, the butcher). Pure data: no raea imports, so the
// world lane's bake (tools/world, bun) can read it.

export type Face = "fat" | "grotesk" | "antiqua" | "fraktur";
/** One line of a sign: its text, face and size against the sign's first line. */
export type Line = { text: string; face: Face; scale: number };
/** A sign: its lines, the ground (the fascia's paint, sRGB hex) and the letters' colour; `gilt` letters are gold leaf
 *  (metallic, catching the light) rather than paint. */
export type Sign = { lines: Line[]; ground: string; ink: string; gilt: boolean };

type Style = { face: Face; ground: string; ink: string; gilt: boolean; caps: boolean };
const GILT_BLACK: Style = { face: "fat", ground: "#14110e", ink: "#c9a24a", gilt: true, caps: true };
const GILT_BROWN: Style = { face: "fat", ground: "#2a1a10", ink: "#c9a24a", gilt: true, caps: true };
const WHITE_GREEN: Style = { face: "grotesk", ground: "#1f3a2c", ink: "#ece4d0", gilt: false, caps: true };
const WHITE_RED: Style = { face: "grotesk", ground: "#4a1a16", ink: "#ece4d0", gilt: false, caps: true };
const WHITE_BLUE: Style = { face: "grotesk", ground: "#1c2a44", ink: "#ece4d0", gilt: false, caps: true };
const BLACK_CREAM: Style = { face: "antiqua", ground: "#d9ceb2", ink: "#1a1612", gilt: false, caps: true };
const GILT_GREEN: Style = { face: "antiqua", ground: "#1f3a2c", ink: "#c9a24a", gilt: true, caps: true };
const FRAKTUR_BLACK: Style = { face: "fraktur", ground: "#14110e", ink: "#c9a24a", gilt: true, caps: false };
const FRAKTUR_CREAM: Style = { face: "fraktur", ground: "#d9ceb2", ink: "#2a1a10", gilt: false, caps: false };

const STYLES: Record<string, Style[]> = {
  "shop-jeweller": [GILT_BLACK, GILT_BROWN], "shop-furs": [GILT_BLACK, GILT_BROWN], "shop-fashion": [GILT_BLACK, BLACK_CREAM, GILT_GREEN],
  "shop-menswear": [GILT_BLACK, WHITE_BLUE], "shop-hats": [GILT_BLACK, BLACK_CREAM], "shop-bank": [GILT_BLACK, GILT_GREEN],
  "shop-konditorei": [GILT_BROWN, FRAKTUR_CREAM], "shop-wine-merchant": [GILT_BLACK, FRAKTUR_BLACK], "shop-weinstube": [FRAKTUR_BLACK, GILT_BROWN],
  "shop-glass-silver": [GILT_BLACK, BLACK_CREAM], "shop-fancy": [GILT_BLACK, GILT_GREEN], "shop-art": [GILT_BLACK, BLACK_CREAM], "shop-photo": [GILT_BLACK, BLACK_CREAM],
  "shop-grocer": [WHITE_GREEN, WHITE_RED, GILT_GREEN], "shop-tobacco": [WHITE_RED, WHITE_GREEN, GILT_BROWN], "shop-dairy": [WHITE_BLUE, WHITE_GREEN],
  "shop-shoes": [WHITE_GREEN, WHITE_RED, GILT_BLACK], "shop-small-goods": [WHITE_GREEN, BLACK_CREAM, GILT_BLACK], "shop-fabric": [BLACK_CREAM, GILT_GREEN, GILT_BLACK],
  "shop-barber": [WHITE_BLUE, WHITE_RED], "shop-drugstore": [WHITE_BLUE, BLACK_CREAM], "shop-laundry": [WHITE_BLUE], "shop-greengrocer": [WHITE_GREEN],
  "shop-books-music": [BLACK_CREAM, GILT_GREEN, GILT_BLACK], "shop-pharmacy": [BLACK_CREAM, GILT_BLACK], "shop-optician": [BLACK_CREAM, GILT_BLACK],
  "shop-florist": [WHITE_GREEN, BLACK_CREAM], "shop-leather": [GILT_BROWN, WHITE_RED],
  "shop-destille": [FRAKTUR_BLACK, FRAKTUR_CREAM, WHITE_RED], "shop-baker": [FRAKTUR_CREAM, WHITE_RED, GILT_BROWN], "shop-butcher": [WHITE_RED, FRAKTUR_CREAM],
  "coal-cellar-shop": [WHITE_RED, FRAKTUR_BLACK], "shop-aschinger": [WHITE_RED], "shop-hotel": [GILT_BLACK, FRAKTUR_BLACK], "shop-chocolate": [GILT_BROWN], "shop-butter-deli": [WHITE_BLUE, WHITE_GREEN],
};
const DEFAULT = [WHITE_GREEN, BLACK_CREAM, GILT_BLACK];

/** A shop the book doesn't record: its trade's plain sign, several per trade. */
const GENERIC: Record<string, string[][]> = {
  "shop-grocer": [["Kolonialwaren"], ["Kolonialwaren", "Delikatessen"], ["Kaffee · Tee · Kakao"]],
  "shop-baker": [["Bäckerei"], ["Bäckerei und Konditorei"], ["Brot- und Feinbäckerei"]],
  "shop-destille": [["Destillation"], ["Destillation", "Frühstücksstube"], ["Ausschank"]],
  "shop-tobacco": [["Zigarren"], ["Zigarren · Zigaretten · Tabake"], ["Zigarrenhandlung"]],
  "shop-barber": [["Friseur"], ["Friseur", "Rasier- und Frisierstube"]],
  "shop-butcher": [["Fleischerei"], ["Schlächterei"], ["Fleisch- und Wurstwaren"]],
  "shop-dairy": [["Milchhandlung"], ["Milch · Butter · Eier"], ["Meierei-Verkaufsstelle"]],
  "shop-small-goods": [["Kurz-, Weiß- und Wollwaren"], ["Handschuhe · Krawatten"], ["Weißwaren · Wäsche"]],
  "shop-shoes": [["Schuhwaren"], ["Schuhhaus"], ["Schuhwaren-Lager"]],
  "shop-fabric": [["Tuche · Seidenwaren"], ["Manufakturwaren"], ["Leinen- und Wäschehaus"]],
  "shop-menswear": [["Herrenmoden"], ["Herren-Konfektion"], ["Herren- und Knabenkleidung"]],
  "shop-fashion": [["Damenmoden"], ["Damen-Konfektion"], ["Modewaren"]],
  "shop-hats": [["Putz · Modewaren"], ["Hüte · Mützen"], ["Damenhüte"]],
  "shop-furs": [["Pelzwaren"], ["Kürschnerei"]],
  "shop-books-music": [["Buch- und Papierhandlung"], ["Schreibwaren"], ["Papier · Schreib- und Zeichenwaren"]],
  "shop-jeweller": [["Uhren · Gold · Silber"], ["Uhrmacher"], ["Juwelier"]],
  "shop-florist": [["Blumen"], ["Blumenhandlung", "Kranzbinderei"], ["Kränze · Blumen"]],
  "coal-cellar-shop": [["Kohlen · Koks · Briketts"], ["Kohlenhandlung"]],
  // the rest of the book's trades, so an estimated or pinned shop of any of them is lettered for its trade (with none
  // a shop reads "Handlung"); Aschinger's and the department stores always come from the book
  "shop-konditorei": [["Konditorei"], ["Konditorei", "Café"], ["Konditorei und Café"]],
  "shop-chocolate": [["Schokoladen"], ["Schokoladen", "Konfitüren"], ["Schokoladen · Pralinen"]],
  "shop-weinstube": [["Weinstube"], ["Weinstuben"], ["Wein-Restaurant"]],
  "shop-aschinger": [["Bierhalle"], ["Bier-Ausschank"]], // a beer hall the book doesn't letter: never Aschinger's own name
  "shop-hotel": [["Hotel"], ["Hotel-Restaurant"]],
  "shop-wine-merchant": [["Weinhandlung"], ["Weine · Spirituosen"], ["Weingroßhandlung"]],
  "shop-butter-deli": [["Butter · Käse · Eier"], ["Feinkost"], ["Delikatessen"]],
  "shop-greengrocer": [["Grünkram"], ["Obst und Gemüse"], ["Gemüse · Obst · Kartoffeln"]],
  "shop-pharmacy": [["Apotheke"]],
  "shop-drugstore": [["Drogerie"], ["Drogen · Farben"], ["Drogen- und Farbenhandlung"]],
  "shop-optician": [["Optiker"], ["Optisches Institut"]],
  "shop-photo": [["Photograph"], ["Photographisches Atelier"]],
  "shop-toys": [["Spielwaren"]],
  "shop-furniture": [["Möbel"], ["Möbel-Magazin"]],
  "shop-fancy": [["Galanteriewaren"], ["Kurz- und Galanteriewaren"]],
  "shop-glass-silver": [["Glas · Porzellan"], ["Silberwaren"], ["Glas- und Porzellanhandlung"]],
  "shop-carpets": [["Teppiche"], ["Teppiche · Gardinen"]],
  "shop-leather": [["Lederwaren"], ["Lederwaren · Reiseartikel"]],
  "shop-art": [["Kunsthandlung"], ["Bilder · Rahmen"]],
  "shop-bank": [["Bankgeschäft"], ["Wechselstube"]],
  "shop-pawn": [["Pfandleihe"], ["Leihhaus"]],
  "shop-rags": [["Produktenhandlung"], ["Altwaren"]],
  "shop-laundry": [["Wäscherei"], ["Plätterei"], ["Wäscherei und Plätterei"]],
  // the city's public kitchens took over shops and restaurants: the sign is often painted over the old trade's
  "war-kitchen": [["Kriegsküche"], ["Volksküche"], ["Städtische Kriegsküche"]],
};

// The book's abbreviations, written out (first match wins; whole words and word endings)
const EXPAND: [RegExp, string][] = [
  [/G\.?\s?m\.?\s?b\.?\s?H\.?/g, "G.m.b.H."], [/\bm\.\s?b\.\s?H\.?/g, "m.b.H."], [/\s+hdlg\.?/g, "handlung"],
  [/Schuhmmstr\.?/g, "Schuhmachermeister"], [/Schuhm\.?(?=\W|$)/g, "Schuhmacher"], [/mstr\.?(?=\W|$)/g, "meister"], [/hdlg\.?(?=\W|$)|hdl\.?(?=\W|$)/g, "handlung"],
  [/(G|g)esch\.?(?![a-zäöüß])/g, "$1eschäft"], // not (?=\W): JS's \W takes "ä", and "Bankgeschäft" read "-geschäftäft" [/(G|g)esellsch\.?(?=\W|$)/g, "$1esellschaft"], [/fabrk\.?(?=\W|$)|fbrk\.?(?=\W|$)|fabr\.?(?=\W|$)|fbr\.?(?=\W|$)/g, "fabrik"],
  [/wr\.?(?=\W|$)/g, "waren"], [/wr(?=handlung|haus|fabrik|geschäft|lager)/g, "waren"], [/kommiss\.?(?=\W|$)/g, "kommissions"], [/Hypothek\.?(?=\W|$)/g, "Hypotheken"],
  [/\bKonditor\b(?!ei)/g, "Konditorei"], [/Verwertg\.?(?=\W|$)/g, "Verwertung"], [/\bz\. (?=\p{L}+(?:ung|ei|heit|keit|schaft|ion)\b)/gu, "zur "], [/\bz\. /g, "zum "], [/Pelzw\.?(?=\W|$)/g, "Pelzwaren"], [/Herrengard\.?(?=\W|$)/g, "Herrengarderobe"],
  [/\s*\bi\. ?Liqu\.?/g, ""],
  [/-Imp\.?(?=\W|$)/g, "-Import"], [/Konfekt\.?(?=\W|$)/g, "Konfektion"], [/Uhrm\.?(?=\W|$)/g, "Uhrmacher"], [/Kondit\.?(?=\W|$)/g, "Konditorei"],
  [/Restaur\.?(?=\W|$)/g, "Restaurant"], [/Gastw\.?(?=\W|$)/g, "Gastwirtschaft"], [/Destill\.?(?=\W|$)/g, "Destillation"], [/Photogr\.?(?=\W|$)/g, "Photograph"],
  [/Drog\.?(?=\W|$)/g, "Drogerie"], [/Delikat\.?(?=\W|$)/g, "Delikatessen"], [/Herrenart\.?(?=\W|$)/g, "Herrenartikel"], [/Juwel\.?(?=\W|$)/g, "Juwelier"],
  [/Atel\.?(?=\W|$)/g, "Atelier"], [/Verl\.\s?Buch/g, "Verlagsbuch"], [/Verl\.?(?=\W|$)/g, "Verlag"], [/Ges\.?(?=\W|$)/g, "Gesellschaft"], [/usw\.?/g, ""],
];
// what a trade part says that no fascia said
const NOT_TRADE = /^(Kfm|Rentier|Eigent|Inh\b|vw\.|Wwe\b|Dr\b|Direkt|Prok|Vertr|Agent)/i;
// a qualifier after the surname: initials, a first name, a firm's form
const INITIALS = /^(?:(?:[A-ZÄÖÜ][a-zäöü]{0,3}\.|[a-z]\.|[A-ZÄÖÜ](?=\s|$))\s?)+$/, FIRM_BEFORE = /^(Gebr|Geschw|Wwe|Ww)\.?$/, FIRM_AFTER = /^(G\. ?m\. ?b\. ?H\.?|& Co\.?|Nachf\.?|Akt\.? ?Ges\.?|A\.-?G\.?|Söhne)$/;

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return ((h >>> 0) % 100000) / 100000; };
const up = (t: string, st: Style) => (st.caps ? t.toLocaleUpperCase("de-DE") : t);
const style = (kit: string | undefined, seed: string) => { const s = (kit && STYLES[kit]) || DEFAULT; return s[Math.floor(hash(seed + "s") * s.length)]; };
const tidy = (t: string) => t.replace(/\s+/g, " ").replace(/\s+([.,])/g, "$1").trim();

/** The firm and its trade from a storefront entry: "Borchardt, Gebr., Zigarren-Imp T." -> "Gebr. Borchardt",
 *  "Zigarren-Import". */
export function parseEntry(entry: string, prev?: string): { name: string; trade: string } {
  let t = entry.replace(/=/g, "-").replace(/\s+/g, " ").trim();
  // "—" is the book's ditto: the surname of the entry before
  if (/^[—–-]\s/.test(t) && prev) {
    // the firm before, without its telephone mark; a comma before initials ("— H., Friseurin" is "Seidel, H., ...")
    const firm = prev.split(",")[0].replace(/^[—–-]\s*/, "").replace(/\s*\bT\.?\s*$/, "").trim(), rest = t.replace(/^[—–-]\s*/, "");
    t = firm + (/^(?:[A-ZÄÖÜ][a-zäöü]{0,3}\.\s?)+,|^Gebr\.?,/.test(rest) ? ", " : " ") + rest;
  }
  t = t.replace(/\s?\.\.\s?/g, ", ");
  for (let i = 0; i < 3; i++) t = t.replace(/[\s,]*(\bT\.?|(?<=[a-zäöü])T\.?|\bS\.|\bB\. ?\d+\.?)\s*$/, "").trim();
  t = t.replace(/\.$/, "");
  // a word the line broke: "Hof- Möbelfabrk." is one word, "Kriegs- rohstoff" too; "Fleisch- und Wurst" stays
  t = t.replace(/(\p{L})- (?=\p{Lu})/gu, "$1-").replace(/(\p{L})- (?!und\b|u\.|oder\b)(?=\p{Ll})/gu, "$1");
  const parts = t.split(/,\s*/).filter(Boolean);
  // a missing comma after an initial: "W Kolonialwrhdlg" is "W.", "Kolonialwrhdlg"
  for (let k = 1; k < parts.length; k++) { const m = parts[k].match(/^((?:[A-ZÄÖÜ]\s)+)(\p{L}{3,}.*)$/u); if (m) parts.splice(k, 1, m[1].trim(), m[2]); }
  const before: string[] = [], after: string[] = [];
  let i = 1;
  for (; i < parts.length; i++) {
    const p = parts[i].trim();
    if (FIRM_BEFORE.test(p) || INITIALS.test(p)) before.push(p.endsWith(".") || !FIRM_BEFORE.test(p) ? p : p + ".");
    else if (FIRM_AFTER.test(p) || /^(?:[A-ZÄÖÜ]\.\s?)+[A-ZÄÖÜ][a-zäöüß]+$/.test(p)) after.push(p); // "G. Schenck": a partner in the firm's name
    else if (/^[A-ZÄÖÜ][a-zäöü]+$/.test(p) && i + 1 < parts.length && i === 1) before.push(p); // a first name: "Arndt, Herta, Blumen"
    else break;
  }
  const dot = (p: string) => (/^[A-ZÄÖÜa-z]$/.test(p) ? p.toUpperCase() + "." : p.replace(/^[a-z]\./, (c) => c.toUpperCase()));
  let name = tidy([...before.map(dot), parts[0], ...after].join(" ")).replace(/\s*Inh\..*$/, "");
  let trade = parts.slice(i).filter((p) => !NOT_TRADE.test(p.trim())).join(" · ");
  for (const [re, s] of EXPAND) { trade = trade.replace(re, s); name = name.replace(re, s); }
  return { name: tidy(name), trade: tidy(trade.replace(/\.(?=\s|$)/g, "").replace(/ · $/, "")) };
}

/** A recorded shop's sign, from its entry and the kit its trade maps to (research/catalogue/trades.ts kitFor); `prev`,
 *  the house's entry before it, for a ditto. */
export function signFor(entry: string, kit: string | undefined, prev?: string): Sign {
  const { name, trade } = parseEntry(entry, prev), st = style(kit, entry);
  const lines: Line[] = [{ text: up(name, st), face: st.face, scale: 1 }];
  if (trade && trade.length > 2) lines.push({ text: up(trade, st), face: st.face === "fraktur" ? "fraktur" : st.face === "fat" ? "antiqua" : st.face, scale: 0.58 });
  return { lines, ground: st.ground, ink: st.ink, gilt: st.gilt };
}

/** An unrecorded shop's sign: its trade's plain lettering, chosen by the shop's unit. */
export function genericSign(kit: string, unit: string): Sign {
  const opts = GENERIC[kit] ?? [["Handlung"]], pick = opts[Math.floor(hash(unit + "g") * opts.length)], st = style(kit, unit);
  return { lines: pick.map((t, i) => ({ text: up(t, st), face: st.face, scale: i ? 0.6 : 1 })), ground: st.ground, ink: st.ink, gilt: st.gilt };
}

/** A shop's run of bays (a recorded storefront takes several): what bay `part` of `parts` shows. One bay shows the whole
 *  sign; on a run the firm's name goes over the first bay and the trade over the next, and so on along the run, as a
 *  shopfront of several windows was lettered. */
export function signPart(s: Sign, part: number, parts: number): Sign {
  if (parts <= 1 || s.lines.length < 2) return s;
  const line = s.lines[part % 2 === 0 ? 0 : 1];
  return { ...s, lines: [{ ...line, scale: 1 }] };
}
