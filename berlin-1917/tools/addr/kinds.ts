// What kind of place an Adreßbuch entry is, by the words the directory uses for it (parse.ts, score.ts).
export const KINDS: [string, RegExp][] = [
  ["state", /Botschaft|Gesandtsch|Konsulat|Ministeri|Fiskus|fiskus|Kgl\.?\s|Königl|Reichs(?!hallen)|Abgeordnetenhaus|Herrenhaus|Amt\b|amt\b|Polizei|Post(amt|hilf)/],
  ["bank", /Bank|Wechsel|Sparkass|Kredit|Versicher|Lebensvers|Feuervers/],
  ["hotel", /Hotel|Pension(?![a-zäöüß])|Gasthof/],
  ["food", /Restaur|Volksküche(?!n)|Kriegsküche|Mittelstandsküche|Caf[eé]|Konditor|Wein|Bier|Brauerei|Ausschank|Delikat|Kolonialw|Bäcker|Fleisch|Schlächt|Butter|Kaffee|Schokol|Zigarr|Tabak|Feinkost|Likör|Spirituos|Konserv|Gastw|Destill|Schankw|Kneip|Grünkr|Milch|Molkerei|Obst|Gemüse|Kartoffel|Viktual|Fisch|Wurst|Materialw|Lebensm/],
  ["shop", /Mode(?!ll)|Konfekt|Damen|Herren|Wäsche|Weißw|Seide|Tuch|Teppich|Möbel|Porzellan|Glas|Kunsth|Buchh|Musikal|Photogr|Friseur|Parfüm|Drog|Apothek|Optik|Opt\.|Juwel|Uhr|Gold|Silber|Schuh|Hut|Handsch|Pelz|Leder|Koffer|Spielw|Papier|Schreibw|Blumen|Lampen|Waffen|Schirm|Korset|Strumpf|Trikot|Spitzen|Bettw|Hdlg|Handl|Verkaufs|Laden|Ba[sz]ar|Warenh|Kaufh|Magazin|Kunstgew|Galanter|Bronze|Kristall|Stoff|Bijout|Kohlen|Seifen/],
  ["firm", /G\.\s?m\.\s?b\.\s?H|Ges\.|Gesellsch|A\.-G\.|Akt\.|&\s?Co|&\s?Sohn|Söhne|Gebr\.|Verlag|Fabrik|[Ff]brk|Exped|Agentur|Kontor|Vertret|Bureau|Büro|Annoncen|Druckerei|Werk/],
  ["practice", /Rechtsanw|Justizr|Notar|Arzt|Ärzt|Dr\.\s?med|Zahnarzt|Zahntechn|Patentanw|Architekt|Ingen|Sanitätsr|Hebamme/],
];
// A person's entry is "Name, Initials, trade": only the trade is matched, so a Blumenthal is not a florist. A firm (&, GmbH, AG)
// or an entry without a comma is matched whole.
export const FIRM = /&|G\.?\s?m\.?\s?b\.?\s?H|\bA\.?\s?-?G\b|\bGes\b|Gesellsch|Akt\./;
// A person is never a state office ("Kgl. Baurat" and "Kgl. Gärtner" are titles), and a person who works for someone is a
// resident, not the trade's bank, shop or firm: a clerk ("Bankbeamt.", "Buchhalt."), a hand ("Fabrikarb."), a shop
// assistant ("Handlgsgeh."), a foreman ("Werkmstr."), a seamstress at home ("Näherin"), a cigar maker ("Zigarrenm.").
// JavaScript's \b counts an umlaut as a word's edge, so "Pension\b" had filed every "Pensionär" (a pensioner; 42 on
// Friedrichstraße) as a hotel: the letters a word goes on with are spelled out instead.
export const WORKER = /[Bb]eamt|[Aa]rb(?![a-zäöüß])|[Aa]rbtr|[Aa]rbeit|[Gg]eh(?![a-zäöüß])|[Gg]ehilf|Buchhalt|Kontorist|Bürod|Expedient|Werkm|Werkf|Lagerist|Reisend|Kassier|Verkäuf|Hoteldien|Hausdien|Pensionär|Wäscherin|Plätterin|Näherin|Zigarrenm|Zigarrensort/;
export const kind = (t: string) => {
  const person = !(FIRM.test(t) || !t.includes(","));
  const s = person ? t.slice(t.indexOf(",") + 1) : t;
  if (person && WORKER.test(s)) return "resident"; // works for someone, elsewhere or at home
  return KINDS.find(([k, re]) => !(person && k === "state") && re.test(s))?.[0] ?? "resident";
};
