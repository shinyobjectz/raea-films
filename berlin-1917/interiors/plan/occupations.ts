// The Adreßbuch's occupation words (Part III, map/1917/businesses: "Schulze, C., Wäscherin.") read as a social rank,
// the class of flat its household would take, and the people role (people/roles.ts) its head goes about as. Ordered:
// the first rule that matches wins. Rank: 3 the good society, 2 the middle (masters, officials, shopkeepers, clerks),
// 1 the workers and the house's servants. The widows, wives and spinsters the directory lists by their state alone
// take the rank of the flat they hold (null).
export interface Occ { de: string; rank: number | null; role?: string; woman?: boolean; widow?: boolean; trade?: string }

const R: [RegExp, Occ][] = [
  [/\bw+w\b|wwe|witwe/, { de: "Witwe", rank: null, woman: true, widow: true }],
  [/rentiere|privatiere|pensionärin/, { de: "Rentiere", rank: 2.6, woman: true, role: "pensioner" }],
  [/rentier|privatier|pensionär/, { de: "Rentier", rank: 2.6, role: "pensioner" }],
  [/rechtsanw|just\.? ?rat|notar|landger|amtsger|kammerger/, { de: "Rechtsanwalt", rank: 3, role: "clerk" }],
  [/\bdr\b|arzt|sanit\.?rat|zahnarzt/, { de: "Arzt", rank: 3, role: "clerk" }],
  [/fabrk|fabrik|direkt|bankgesch|bankier|kommerz|geh\.|prokurist|architekt|ingen|hotelbes|verleger|redakt|profess|major|hauptm|oberst|leutn|offiz|konsul/, { de: "Herr", rank: 3, role: "clerk" }],
  [/schneidermstr|schuhmmstr|tischlermstr|schlossermstr|bäckermstr|fleischermstr|uhrm|juwel|goldschm|photogr|buchhdl|kunsthdlg|antiquit|gastw|restaur|hotel/, { de: "Meister", rank: 2.2, role: "shopkeeper" }],
  [/kfm|kaufm|export|agent|vertret|geschäftsf|makler|händler|hdlg|hdl\b/, { de: "Kaufmann", rank: 2.3, role: "shopkeeper" }],
  [/beamt|sekr|insp|kassier|buchh|lehrer|kastellan|verwalt|rendant|assist|kanzl|registr|bureau|büro/, { de: "Beamter", rank: 2, role: "clerk" }],
  [/modistin|putzm|vermieterin|pension|lehrerin|verkäuferin|direktrice|stütze/, { de: "Frau im Erwerb", rank: 1.7, woman: true }],
  [/schneiderin|näherin|wäscherin|plätterin|aufwärterin|arbeiterin|portierfr|hausdien|köchin|frau\b|frl\b/, { de: "Arbeiterin", rank: 1, woman: true, role: "housewife" }],
  [/portier|hauswart|hausmstr|pförtner/, { de: "Portier", rank: 1, role: "coal-carrier" }],
  [/kutscher|kraftwag|chauff|fuhr/, { de: "Kutscher", rank: 1, role: "coachman" }],
  [/schaffn|straßenb/, { de: "Straßenbahner", rank: 1, role: "tram-driver" }],
  [/schneider|schuhm|tischler|schlosser|tapez|maler|maurer|monteur|heizer|kellner|bote|packer|arb\b|arbeiter|drucker|setzer|gärtner|klempner|sattler/, { de: "Arbeiter", rank: 1, role: "munitions-worker" }],
];

/** The occupation part of an entry ("Name, I., occupation. T.") read by the rules above; a word they don't know is
 *  the middle. */
export function occupation(text: string): Occ & { word: string } {
  const t = text.replace(/\s*T\.\s*$/, "").replace(/\.$/, ""), parts = t.split(/,\s*/);
  const word = (parts.length > 2 ? parts.slice(2).join(", ") : parts[1] ?? "").trim().toLowerCase();
  for (const [re, o] of R) if (re.test(word)) return { ...o, word };
  return { de: word || "?", rank: 2, word };
}
