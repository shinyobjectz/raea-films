// Who a household is, past its occupation and size (households.ts): its faith and how much it shows, its politics and
// milieu, where it came from, the paper it takes, what it plays and does in its free hours, and what the war has done
// to it. interiors/plan/dress.ts turns this into the things in its rooms; the people layer will turn it into its days.
// Everything is drawn from the seed, so a house is the same household every time.
//
// The rates are Berlin's where a source gives them (SOURCES below) and marked ASSUMED where they're our estimate; an
// estimate is replaced, not argued with, when a source turns up. Add a confession, milieu or interest by adding it to
// its type and its rates here, and an overlay for it in dress.ts: nothing else needs to change.
import type { Klass } from "./flats";
import type { Occupant, Person } from "./households";

export type Confession = "protestant" | "catholic" | "jewish" | "jewish-orthodox" | "other-christian" | "free-religious";
export type Milieu =
  | "social-democrat" | "christian-worker" | "catholic" | "polish" | "patriot" | "official" | "officer" | "liberal"
  | "jewish-liberal" | "ostjude" | "orthodox" | "boheme" | "reform";
export type Origin = "berlin" | "brandenburg" | "silesia" | "east-prussia" | "posen" | "saxony" | "west" | "galicia" | "russia";
export type Interest =
  | "piano" | "gramophone" | "zither" | "accordion" | "violin" | "guitar" | "singing" | "skat" | "chess" | "reading"
  | "canaries" | "aquarium" | "pigeons" | "allotment" | "cycling" | "needlework" | "painting" | "photography" | "stamps"
  | "gymnastics";
/** work brought home: the Konfektion's sewing (a machine and its piles) or its coats (cut pieces in bundles),
 *  artificial flowers, cigars, or other people's washing */
export type Homework = "sewing" | "tailoring" | "flowers" | "cigars" | "laundry";

export interface Identity {
  confession: Confession;
  /** 0-1: how much the faith shows at home (a Berlin Protestant's home shows little; an orthodox one everything) */
  devout: number;
  milieu: Milieu;
  origin: Origin;
  /** the paper on the table: the people layer reads it as what they talk about */
  paper: string;
  interests: Interest[];
  war: { front: number; fallen: number; prisoner: number; decorated: boolean; munitions: boolean; widow: boolean };
  /** children under 14 and from 14 to 20: the guardian angel, the confirmation certificate, the guitar */
  children: { young: number; teens: number; infant: boolean; school: number };
  /** the work done at home, if any (heimarbeit-1906) */
  homework: Homework | null;
}

export const SOURCES: Record<string, string> = {
  "ghdi-710": "Confessional breakdown 1910 (Statistisches Jahrbuch für das Deutsche Reich 1913, p. 11), GHDI document 710: City of Berlin per 10,000: 8,155 Protestant, 1,173 Catholic, 53 other Christian, 434 Jewish",
  "ghdi-482": "Weber 1892, Wohnungen und Sonntagsbeschäftigung der deutschen Arbeiter (Saul et al., Arbeiterfamilien im Kaiserreich, 1982, pp. 149-50), GHDI document 482: oleographs, the soldier picture, Lassalle or Marx, the first Kaiser, confirmation pictures, saints for Catholics, Luther for Protestants, embroidered Social Democratic verses, flowers, bird keeping",
  "wahlen-berlin": "wahlen-in-deutschland.de, Reichstag 1867-1918, Stadt Berlin: 12 January 1912, SPD 75.3%, left liberals (FVP) 17.2%, Zentrum 2.1%, Polish 0.7%; SPD won five of Berlin's six seats, Berlin I (Friedrichstadt-Nord) went FVP by nine votes",
  "steinert-polen": "Steinert, 'Berlin - Polnischer Bahnhof!' (review, sehepunkte 4 (2004) 5): just under 40,000 Poles in Berlin at the 1910 census, mostly from Silesia, unskilled workers and craftsmen, no closed quarter, drawn to Social Democratic and German Catholic associations",
  "shofar-scheunenviertel": "Yiddish and Berlin's Scheunenviertel, Shofar (Project MUSE 470803), after Adler-Rudel 1959: about 21,000 East European Jews in Berlin in 1910, 15% of its Jews; the quarter between Linien-, Oranienburger Straße and Landsberger Allee",
  "lpb-roth": "LpB Baden-Württemberg, Ghettos (Mischket Liebermann's memoir): the Grenadierstraße's kosher shops, two prayer houses, the Sabbath fish",
  "laubenkolonien": "Univ. Kassel, Aktuelle Garteninitiativen: about 40,000 allotment colonists in Berlin by 1895; Gartenfreunde Treptow: wartime demand for allotments jumped",
  "radio-1923": "DRA and GHDI: German entertainment broadcasting began 29 October 1923 at the Vox-Haus; private reception was banned in the war",
  "heimarbeit-1906": "The Deutsche Heimarbeit-Ausstellung, Berlin 1906 (Gesellschaft für Soziale Reform): homework shown trade by trade, the Konfektion's seamstresses, the artificial-flower makers and the cigar rollers among them, with their hours and pay",
  "turnerschaft": "ASSUMED from the Deutsche Turnerschaft (about a million members before the war) and the Arbeiter-Turnerbund: gymnastics clubs in every Berlin quarter",
  "juden-1910": "Hentrich & Hentrich e-text 021351 (2023), after the 1910 count: Jews were 7.36% of Charlottenburg, 6.74% of Schöneberg, 8.84% of Wilmersdorf and under 1% of Wedding and Gesundbrunnen; Berlin 3.9% (144,007 of 3,734,258, Statistisches Handbuch für den Preußischen Staat)",
  "schlafgaenger": "Schauer, Die Entwicklung städtischen Arbeiterwohnens in Berlin (after Nipperdey 1990): 18% of Berlin households took Schlafgänger in 1885, 13% twenty years later; 44% of Berliners lived in a flat with one heated room in 1911",
};

/** rates: the confession of a household by class, Berlin 1910's shares (ghdi-710) bent by who held which work. */
const CONFESSION = {
  base: { protestant: 0.8155, catholic: 0.1173, "other-christian": 0.0053, jewish: 0.0434, "free-religious": 0.0185 },
  // ASSUMED: Berlin's Jews were 4.3% of its people but crowded into commerce and the professions, few in manual work;
  // held so that a rich commercial quarter comes out under Wilmersdorf's 8.84%, the highest share of 1910 (juden-1910)
  jewish: { merchant: 3.6, profession: 3, bourgeois: 1.4, petty: 0.7, worker: 0.25 } as Record<string, number>,
  // ASSUMED: the Catholic migrants from Silesia and Posen came as workers (steinert-polen)
  catholic: { worker: 1.25, petty: 1, bourgeois: 0.8, merchant: 0.8, profession: 0.9 } as Record<string, number>,
  // the dissidents who had left the church: mostly Social Democratic workers (ASSUMED share of the 1.85% remainder)
  free: { worker: 1.6, petty: 0.8, bourgeois: 0.4, merchant: 0.3, profession: 0.8 } as Record<string, number>,
  // shofar-scheunenviertel: 15% of Berlin's Jews were from the east in 1910; in the Scheunenviertel most were
  ostjude: { "spandauer-vorstadt": 0.6, friedrichstadt: 0.06, default: 0.12 } as Record<string, number>,
  // steinert-polen: 40,000 of about 2.07 million, a sixth of the Catholics; mostly workers and craftsmen
  polish: { worker: 0.24, petty: 0.12, bourgeois: 0.03, merchant: 0.03, profession: 0.05 } as Record<string, number>,
};
/** how much the faith shows, a mean for each (ASSUMED: Berlin was the least churchgoing city in Germany) */
const DEVOUT: Record<Confession, number> = { protestant: 0.3, catholic: 0.6, jewish: 0.35, "jewish-orthodox": 0.95, "other-christian": 0.7, "free-religious": 0 };

/** The work an occupation word stands for, for the class rates: a merchant, a profession or an official. */
const KIND: [RegExp, string][] = [
  [/kaufm|fabrik|konfekt|händl|hdlr|hdlg|bank|makler|agent|grossist|inh\./i, "merchant"],
  [/rechtsanw|anwalt|arzt|ärzt|notar|zahn|apothek|architekt|ingen|dr\.|prof/i, "profession"],
  [/rat\b|rät|sekr|inspekt|beamt|assist|kanzl|oberpost|postsekr|lehrer|pfarr|prediger|schutzm|wachtm/i, "official"],
  [/offiz|major|hauptm|leutn|oberst|general|rittm/i, "officer"],
  [/maler|bildh|schriftst|redakt|musik|schausp|sänger|kunst/i, "artist"],
];
export const kindOf = (head: string) => KIND.find(([re]) => re.test(head))?.[1] ?? null;

/** the paper a milieu takes (ASSUMED readerships of the period's papers; the Morgenpost was the mass paper) */
const PAPER: Record<Milieu, string[]> = {
  "social-democrat": ["Vorwärts", "Vorwärts", "Berliner Morgenpost"],
  "christian-worker": ["Berliner Morgenpost", "Berliner Lokal-Anzeiger"],
  catholic: ["Germania", "Berliner Morgenpost"],
  polish: ["Dziennik Berliński", "Vorwärts"],
  patriot: ["Berliner Lokal-Anzeiger", "B.Z. am Mittag"],
  official: ["Berliner Lokal-Anzeiger", "Tägliche Rundschau"],
  officer: ["Neue Preußische (Kreuz-)Zeitung"],
  liberal: ["Berliner Tageblatt", "Vossische Zeitung"],
  "jewish-liberal": ["Berliner Tageblatt", "Vossische Zeitung"],
  ostjude: ["a Yiddish weekly", "Berliner Morgenpost"],
  // German orthodoxy's paper (Mainz, from 1906 Frankfurt), for the Adass Jisroel households
  orthodox: ["Der Israelit", "Berliner Tageblatt"],
  boheme: ["Die Aktion", "Berliner Tageblatt"],
  reform: ["Vossische Zeitung", "Der Wandervogel"],
};

/** Interests by class, chance a household has each (ASSUMED estimates except where a source is named). */
const INTEREST: Record<Interest, Partial<Record<"worker" | "petty" | "bourgeois", number>>> = {
  gymnastics: { worker: 0.07, petty: 0.1, bourgeois: 0.06 }, // turnerschaft
  piano: { worker: 0.02, petty: 0.15, bourgeois: 0.7 },
  gramophone: { worker: 0.07, petty: 0.2, bourgeois: 0.35 },
  zither: { worker: 0.06, petty: 0.08, bourgeois: 0.02 },
  accordion: { worker: 0.12, petty: 0.06 },
  violin: { worker: 0.03, petty: 0.06, bourgeois: 0.1 },
  guitar: {},
  singing: { worker: 0.2, petty: 0.15, bourgeois: 0.1 },
  skat: { worker: 0.5, petty: 0.45, bourgeois: 0.2 },
  chess: { worker: 0.05, petty: 0.1, bourgeois: 0.2 },
  reading: { worker: 0.2, petty: 0.3, bourgeois: 0.8 },
  canaries: { worker: 0.25, petty: 0.25, bourgeois: 0.1 }, // ghdi-482: "auch Vogelzucht betrieben"
  aquarium: { petty: 0.06, bourgeois: 0.08 },
  pigeons: { worker: 0.03, petty: 0.02 },
  allotment: { worker: 0.2, petty: 0.15, bourgeois: 0.02 }, // laubenkolonien
  cycling: { worker: 0.15, petty: 0.15, bourgeois: 0.05 },
  needlework: { worker: 0.5, petty: 0.6, bourgeois: 0.5 },
  painting: {},
  photography: { petty: 0.03, bourgeois: 0.15 },
  stamps: { petty: 0.08, bourgeois: 0.12 },
};

const hashOf = (seed: number) => (k: number) => {
  let h = (seed * 2654435761 + k * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const draw = <K extends string>(w: Record<K, number>, r: number): K => {
  const t = Object.values<number>(w).reduce((a, b) => a + b, 0);
  let s = 0;
  for (const [k, v] of Object.entries<number>(w)) { s += v / t; if (r < s) return k as K; }
  return Object.keys(w)[0] as K;
};

/** The identity of the household in a flat: its class (the flat's), the head's occupation, its people, the quarter. */
export function identify(occ: Occupant | null, klass: Klass, o: { seed: number; quarter?: string }): Identity | null {
  if (!occ || occ.kind !== "household") return null;
  const R = hashOf(o.seed);
  const cls: "worker" | "petty" | "bourgeois" = klass === "bourgeois" ? "bourgeois" : klass === "worker" || klass === "porter" ? "worker" : "petty";
  const kind = kindOf(occ.head), row = kind === "merchant" || kind === "profession" ? kind : cls;
  const B = CONFESSION.base;
  let confession = draw({
    protestant: B.protestant, catholic: B.catholic * (CONFESSION.catholic[row] ?? 1), "other-christian": B["other-christian"],
    jewish: B.jewish * (CONFESSION.jewish[row] ?? 1), "free-religious": B["free-religious"] * (CONFESSION.free[row] ?? 1),
  }, R(1)) as Confession;
  if (confession === "jewish" && R(2) < (CONFESSION.ostjude[o.quarter ?? ""] ?? CONFESSION.ostjude.default)) confession = "jewish-orthodox";
  const polish = confession === "catholic" && R(3) < (CONFESSION.polish[row] ?? 0.1);
  const devout = Math.max(0, Math.min(1, DEVOUT[confession] + (R(4) - 0.5) * 0.5));

  // milieu: the faith and the work first, then the vote (wahlen-berlin: three in four Berlin voters went SPD in 1912)
  const mr = R(5);
  const milieu: Milieu =
    // the poor orthodox were mostly from Galicia and Russia; a good flat's orthodox family belonged to German orthodoxy
    // (Adass Jisroel, founded 1869), from Berlin or Posen
    confession === "jewish-orthodox" ? (cls === "worker" || (cls === "petty" && mr < 0.7) ? "ostjude" : "orthodox")
    // the more devout, the likelier the Polish societies and the Catholic workers' clubs than the party
    : polish ? (mr < 0.3 + 0.4 * devout ? "polish" : "social-democrat")
    : kind === "officer" ? "officer"
    : kind === "official" ? "official"
    : kind === "artist" && mr < 0.6 ? "boheme"
    : confession === "jewish" ? (mr < 0.8 ? "jewish-liberal" : "patriot")
    : cls === "worker" ? (confession === "free-religious" || mr < (confession === "catholic" ? 0.95 - 0.8 * devout : 0.85 - 0.3 * devout) ? "social-democrat" : confession === "catholic" ? "catholic" : "christian-worker")
    : cls === "petty" ? (mr < 0.35 ? "social-democrat" : mr < 0.75 ? (confession === "catholic" && mr < 0.45 ? "catholic" : "patriot") : "liberal")
    : mr < 0.5 ? "liberal" : mr < 0.88 ? "patriot" : mr < 0.94 ? "reform" : "boheme";

  // origin (ASSUMED: about two Berliners in five were born there; the east and Silesia sent the most)
  const origin: Origin = milieu === "ostjude" ? (R(6) < 0.6 ? "galicia" : "russia")
    : milieu === "orthodox" ? (R(6) < 0.5 ? "berlin" : R(6) < 0.8 ? "posen" : "west")
    : polish ? (R(6) < 0.7 ? "silesia" : "posen")
    : draw({ berlin: 0.4, brandenburg: 0.2, silesia: confession === "catholic" ? 0.25 : 0.1, "east-prussia": 0.1, posen: confession === "catholic" ? 0.1 : 0.06, saxony: 0.07, west: 0.07 }, R(6)) as Origin;
  const papers = PAPER[milieu];
  const paper = papers[Math.floor(R(7) * papers.length)];

  const people = occ.people;
  const kin = people.filter((p) => !["lodger", "subtenant", "maid", "cook", "apprentice"].includes(p.relation));
  const young = kin.filter((p) => p.relation === "child" && p.age < 14).length, teens = kin.filter((p) => p.relation === "child" && p.age >= 14 && p.age <= 20).length;
  const women = kin.some((p) => p.sex === "f"), menHome = kin.some((p) => p.sex === "m" && p.age >= 16 && p.status !== "front" && p.status !== "fallen");
  const interests: Interest[] = [];
  (Object.keys(INTEREST) as Interest[]).forEach((it, k) => {
    let p = INTEREST[it][cls] ?? 0;
    if (it === "guitar") p = teens && (cls !== "worker" || milieu === "reform") ? 0.3 : 0; // the Wandervogel was middle-class youth
    if (it === "painting") p = milieu === "boheme" ? 0.7 : 0;
    if (it === "needlework" && !women) p = 0;
    if (it === "skat" && !menHome) p *= 0.3; // the players are at the front
    if (it === "reading" && milieu === "social-democrat") p += 0.15; // the party and union libraries
    if (it === "piano" && confession === "jewish") p = Math.min(0.9, p * 1.2);
    if (R(20 + k) < p) interests.push(it);
  });

  const front = kin.filter((p) => p.status === "front").length, fallen = kin.filter((p) => p.status === "fallen").length;
  const war = {
    front, fallen,
    // ASSUMED: about one in twenty-five at the front was a prisoner by the end of 1917
    prisoner: front && R(40) < 0.04 * front ? 1 : 0,
    // about 5.2 million Iron Crosses, second class, were awarded in the war (ASSUMED: a quarter of the serving by 1917)
    decorated: front + fallen > 0 && R(41) < 0.25 * (front + fallen),
    munitions: kin.some((p) => /munition|granat|rüstung/i.test(p.work)),
    widow: kin.some((p) => p.relation === "head" && p.sex === "f") && fallen > 0,
  };
  // homework (heimarbeit-1906): who sews or launders at home, and in the Friedrichstadt mostly for the Konfektion
  // (ASSUMED split: the machine's sewing, the coats, artificial flowers, cigars)
  const hw = kin.find((p) => /heimarbeit|näherin|schneiderin|wäscherin|plätterin/i.test(p.work ?? ""));
  const homework: Homework | null = !hw ? null : /wäscherin|plätterin/i.test(hw.work) ? "laundry"
    : (draw({ sewing: 0.55, tailoring: 0.3, flowers: 0.1, cigars: 0.05 }, R(50)) as Homework);
  const school = kin.filter((p) => p.relation === "child" && p.age >= 6 && p.age < 14).length;
  return { confession, devout: +devout.toFixed(2), milieu, origin, paper, interests, war, children: { young, teens, infant: kin.some((p) => p.relation === "child" && p.age < 2), school }, homework };
}

export type { Person };
