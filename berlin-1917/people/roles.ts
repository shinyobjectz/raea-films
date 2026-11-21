// Who lives and works in the inner city in winter 1917-18, as roles for the character SDK's people model (raea/people,
// docs/character.feature CH50-CH53). Dress, kit and ranks are ids in research/catalogue/people.ts; every uniform there
// is sourced or waits on a photo. The mix is the share of each role among the residents: women, the old, children and
// soldiers at home or on leave; few men of fighting age who are not in uniform. Who is on the street at an hour comes
// from their days (raea/people's streetMix: people/city.ts), not from the mix.
import type { Folk, Role } from "raea/people";

const H = (h: number, m = 0) => h * 60 + m;
const WEEKDAYS = [1, 2, 3, 4, 5, 6]; // the working week ran Monday to Saturday

export const ROLES: Role[] = [
  {
    id: "housewife", title: "Housewife", women: 1, ages: [20, 75], traits: { conscientiousness: 0.6 },
    dress: { "coat-woman": 3, shawl: 2 }, carry: { basket: 0.85 }, modes: { walk: 1 },
    day: [
      // the queues began before dawn and lasted hours (bread, potatoes, fat): the bread queue first
      { what: "queue for bread", at: "bakery", from: H(5, 30), minutes: 150, jitter: 40, acts: ["wait in the queue", "stamp the feet", "talk low"], days: WEEKDAYS, outside: true },
      { what: "queue at the butcher", at: "butcher", from: H(9), minutes: 90, jitter: 30, chance: 0.4, days: WEEKDAYS, outside: true },
      { what: "greengrocer", at: "greengrocer", from: H(11), minutes: 40, chance: 0.5, days: WEEKDAYS },
      // the district's market hall (Markthalle II, tools/people/places.ts: the open-air markets closed in 1886)
      { what: "the market hall", at: "market-hall", from: H(9, 30), minutes: 60, jitter: 40, chance: 0.15, days: WEEKDAYS, acts: ["buy at the stands"] },
      { what: "war kitchen", at: "war-kitchen", from: H(12), minutes: 45, chance: 0.25, days: WEEKDAYS, acts: ["wait with a can"], outside: true },
    ],
    habits: [
      { id: "church", act: "church", from: H(9, 30), to: H(11, 30), at: "church", minutes: 75, chance: 0.6, days: [0], leans: { conscientiousness: 0.8 } },
      { id: "carpet", act: "beat a carpet in the court", from: H(10), to: H(15), at: "hinterhof", minutes: 30, chance: 0.5, days: [6] },
      { id: "talk-at-door", act: "talk with a neighbour at the house door", from: H(15), to: H(18), at: "home", minutes: 20, chance: 0.4, leans: { extraversion: 1.2 }, outside: true },
    ],
  },
  {
    id: "munitions-worker", title: "Munitions worker", women: 0.8, ages: [16, 50], traits: { conscientiousness: 0.55 },
    dress: { "work-cap-apron": 1 }, modes: { walk: 1, tram: 3 }, work: { at: "works" },
    day: [{ what: "shift", at: "work", from: H(6), to: H(18), jitter: 6, days: WEEKDAYS, acts: ["work the shell line"] }],
    habits: [{ id: "cinema", act: "cinema", from: H(19), to: H(22), at: "cinema", minutes: 100, chance: 0.15, leans: { extraversion: 1, openness: 0.6 } }],
  },
  {
    id: "schaffnerin", title: "Tram conductress", women: 1, ages: [18, 45], traits: { conscientiousness: 0.7, extraversion: 0.6 },
    dress: { schaffnerin: 1 }, modes: { walk: 1, tram: 2 }, work: { at: "tram-depot" }, vehicle: { kind: "tram", station: "rear-platform" },
    day: [{ what: "on the tram", at: "work", from: H(5), to: H(14), jitter: 4, acts: ["sell tickets", "ring the bell", "call the stops"] }],
  },
  {
    id: "tram-driver", title: "Tram driver", women: 0.25, ages: [40, 66], traits: { conscientiousness: 0.75 },
    dress: { "invalid-coat": 1 }, modes: { walk: 1, tram: 2 }, work: { at: "tram-depot" }, vehicle: { kind: "tram", station: "front-platform" },
    day: [{ what: "driving the tram", at: "work", from: H(5), to: H(14), jitter: 3, acts: ["drive the tram"] }],
  },
  {
    id: "schutzmann", title: "Schutzmann", women: 0, ages: [32, 58], traits: { conscientiousness: 0.75, agreeableness: 0.35 }, rank: "schutzmann",
    dress: { "schupo-rock": 1 }, carry: {}, modes: { walk: 1 }, gait: "proud",
    // a beat walked in a round of corners, early or late turn
    day: [{ what: "on the beat", at: "beat-corner", from: H(6), to: H(14), round: { stops: 10, dwell: 40 }, jitter: 2, acts: ["stand and watch the street", "walk the beat"], outside: true }],
  },
  {
    id: "landsturm-sentry", title: "Landsturm sentry", women: 0, ages: [39, 45], traits: { conscientiousness: 0.65, neuroticism: 0.55 }, rank: "landsturmmann",
    // the oilcloth cap until June 1918; far fewer caps than men, so also the M15 helmet and the field cap issued for it
    // (catalogue landsturm-cap, pickelhaube-m15; altearmee.de)
    // the Gew 88, not the Gew 98 (Landsturm at home had old or captured rifles: catalogue gew88); no lantern until a
    // dated photograph shows a guard with one (catalogue lantern, at "photo")
    dress: { "mantel-m15": 1 }, head: { "landsturm-cap": 2, "pickelhaube-m15": 1, feldmuetze: 1 }, carry: { gew88: 1 }, modes: { walk: 1, tram: 1 }, gait: "tired",
    // two hours on, four off, at their own guard post (the Works' gate, a bridge, a depot: a post holds its reliefs)
    work: { at: "guard-post" },
    day: [
      { what: "on guard", at: "work", from: H(6), minutes: 120, jitter: 1, acts: ["stand at the post", "stamp the feet", "walk the round"], outside: true },
      // (the guard room at the post itself: a post's own room is not placed apart yet, and a man without a post has
      // no duty that day)
      { what: "guard room", at: "work", from: H(8, 3), minutes: 237, jitter: 1, acts: ["sit by the stove"] },
      { what: "on guard", at: "work", from: H(12), minutes: 120, jitter: 1, acts: ["stand at the post"], outside: true },
    ],
  },
  {
    id: "depot-soldier", title: "Depot soldier", women: 0, ages: [18, 42], traits: { extraversion: 0.6 }, rank: "musketier",
    dress: { "bluse-m15": 2, "rock-m10": 1 }, head: { feldmuetze: 1 }, carry: {}, modes: { walk: 2, tram: 2 },
    day: [
      { what: "drill", at: "barracks", from: H(6), to: H(17), jitter: 3, days: WEEKDAYS, acts: ["drill"] },
      { what: "evening out", at: "destille", from: H(18, 30), minutes: 120, chance: 0.35, jitter: 30 },
    ],
  },
  {
    id: "gunner", title: "Foot-artillery gunner", women: 0, ages: [20, 40], traits: { conscientiousness: 0.65 }, rank: "kanonier",
    dress: { "bluse-m15": 1 }, head: { feldmuetze: 3, "stahlhelm-m16": 1 }, carry: {}, modes: { walk: 1 }, work: { at: "works" },
    day: [{ what: "gun drill", at: "work", from: H(6), to: H(18), jitter: 3, acts: ["serve the gun"] }],
  },
  {
    id: "officer", title: "Officer", women: 0, ages: [22, 50], traits: { conscientiousness: 0.75, extraversion: 0.55, agreeableness: 0.4 }, rank: "leutnant",
    dress: { "bluse-m15": 1 }, head: { "schirmmuetze-nco": 1 }, carry: { whistle: 1 }, modes: { walk: 2, cab: 1, tram: 1 }, gait: "proud", work: { at: "works" },
    day: [{ what: "duty", at: "work", from: H(7), to: H(18), jitter: 10, acts: ["inspect", "give orders"] }],
    habits: [{ id: "cafe", act: "café", from: H(19), to: H(22), at: "konditorei", minutes: 90, chance: 0.4, leans: { extraversion: 1 } }],
  },
  {
    id: "organ-grinder", title: "Organ grinder", women: 0, ages: [24, 60], traits: { neuroticism: 0.6, extraversion: 0.45 },
    dress: { "invalid-coat": 1 }, carry: { "barrel-organ": 1 }, modes: { walk: 1 }, gait: "tired",
    // a round of courtyards, a few minutes in each, pennies thrown down from the windows
    day: [{ what: "play in a courtyard", at: "hinterhof", from: H(10), to: H(16), round: { stops: 9, dwell: 25 }, jitter: 20, acts: ["turn the crank", "look up at the windows", "pick up a coin"] }],
  },
  {
    id: "shopkeeper", title: "Shopkeeper", women: 0.55, ages: [28, 70], traits: { conscientiousness: 0.7 },
    dress: { "coat-woman": 1 }, modes: { walk: 1 }, work: { at: "shop", within: 400 },
    day: [{ what: "keep the shop", at: "work", from: H(6, 30), to: H(19), jitter: 5, days: WEEKDAYS, acts: ["serve"] }],
  },
  {
    id: "clerk", title: "Clerk", women: 0.5, ages: [17, 68], traits: { conscientiousness: 0.7, extraversion: 0.4 },
    dress: { "coat-woman": 1 }, modes: { walk: 1, tram: 2 }, work: { at: "office" },
    day: [{ what: "office", at: "work", from: H(8), to: H(17), jitter: 8, days: WEEKDAYS }],
  },
  {
    id: "pensioner", title: "Old man", women: 0, ages: [65, 85], traits: { openness: 0.45 },
    dress: { "invalid-coat": 1 }, modes: { walk: 1 }, gait: "old",
    // the official notices on a Litfaß column (catalogue litfass: "in the war the official notices"), the nearest few
    day: [{ what: "read the notices on a Litfaß column", at: "litfass", from: H(10), minutes: 15, jitter: 40, chance: 0.7, acts: ["read the notices"] }],
    // (a bench on a square in the noon sun: few sat out in a December, 0.1 assumed)
    habits: [{ id: "bench", act: "sit on a bench", from: H(12), to: H(15), at: "square", minutes: 45, chance: 0.1 }],
  },
  {
    id: "child", title: "Child", women: 0.5, ages: [6, 13], traits: { extraversion: 0.65, neuroticism: 0.45 },
    dress: { "flat-cap": 1 }, modes: { walk: 1 }, gait: "hurried",
    day: [
      // the women queued from the night, and "in the morning, when they had to go to work, the children came to
      // relieve them" (Berliner Zeitung, 15.2.2018, "Als der Erste Weltkrieg den Hunger nach Berlin brachte",
      // https://www.berliner-zeitung.de/article/steckruebenwinter-als-der-erste-weltkrieg-den-hunger-nach-berlin-brachte-1385696)
      { what: "stand in the bread queue for the family", at: "bakery", from: H(6, 45), minutes: 60, jitter: 10, chance: 0.3, days: WEEKDAYS, acts: ["wait in the queue", "stamp the feet"], outside: true },
      // out at one: the street fills with children going home (the peer's beat, children running past a queue)
      { what: "school", at: "school", from: H(8), to: H(13), jitter: 4, days: WEEKDAYS },
      { what: "play in the court", at: "hinterhof", from: H(14), minutes: 120, chance: 0.7, acts: ["play", "chase", "watch"] },
    ],
  },
  {
    id: "coachman", title: "Cab driver", women: 0.05, ages: [45, 72], traits: { agreeableness: 0.4 },
    // (from rank to rank on his own cab's box; on foot only from home to the rank)
    dress: { "invalid-coat": 1 }, modes: { walk: 1, cab: 8 }, work: { at: "cab-rank" }, vehicle: { kind: "horse-cab", station: "box" },
    day: [{ what: "on the rank", at: "cab-rank", from: H(7), to: H(20), round: { stops: 8, dwell: 80 }, jitter: 20, acts: ["wait on the box", "blanket the horse"] }],
  },
  {
    id: "coal-carrier", title: "Coal carrier", women: 0.3, ages: [35, 65], traits: {},
    dress: { "invalid-coat": 1 }, modes: { walk: 1 }, gait: "tired",
    day: [{ what: "carry coal", at: "home", from: H(7), to: H(15), round: { stops: 12, dwell: 30 }, jitter: 15, days: WEEKDAYS, acts: ["carry a sack up the stairs"], outside: true }],
  },
  {
    id: "postwoman", title: "Postwoman", women: 0.9, ages: [18, 50], traits: { conscientiousness: 0.75 },
    dress: { "coat-woman": 1 }, modes: { walk: 1 },
    day: [
      { what: "first round", at: "home", from: H(7), to: H(11), round: { stops: 14, dwell: 15 }, jitter: 5, days: WEEKDAYS, acts: ["hand in letters"], outside: true },
      { what: "second round", at: "home", from: H(14), to: H(17), round: { stops: 10, dwell: 15 }, jitter: 5, days: WEEKDAYS, outside: true },
    ],
  },
  {
    // A soldier home from the front on leave: two weeks after a year at the front (1914-1918-online, "Soldiers on
    // Leave", https://encyclopedia.1914-1918-online.net/article/soldiers-on-leave/), his pass stamped at the station's
    // Bahnhofskommandantur on arrival; in uniform, since from spring 1916 an enlisted man on leave could wear civilian
    // clothes only with his superiors' permission noted on the pass (Packheiser, Heimaturlaub, Göttingen 2020, ch.
    // "Gäste im eigenen Land", https://api.pageplace.de/preview/DT0400.9783835344907_A39507348/preview-9783835344907_A39507348.pdf).
    // His days are his own: out walking the shop streets at midday, a Destille at night. (Not yet: his wife or a girl
    // on his arm, which waits on the people model walking two together; a café, while the Konditoreien after the
    // cake-baking ban of 11 March 1916 are unsourced.)
    id: "soldier-on-leave", title: "Soldier on leave", women: 0, ages: [19, 40], traits: { extraversion: 0.6, openness: 0.55 }, rank: "musketier",
    dress: { "mantel-m15": 3, "bluse-m15": 2, "rock-m10": 1 }, head: { feldmuetze: 1 }, modes: { walk: 3, tram: 1 },
    day: [
      { what: "walk out", at: "shop", from: H(11), to: H(13, 30), round: { stops: 7, dwell: 6 }, jitter: 30, chance: 0.75, acts: ["stroll", "look in a shop window"], outside: true },
      { what: "evening out", at: "destille", from: H(19), minutes: 150, jitter: 40, chance: 0.5 },
    ],
  },
  {
    // A better-off woman out at midday along the shop windows, in a hat (catalogue hat-woman: "better-off women, the
    // street crowd"). (Men of her kind wait on a sourced man's coat and hat: catalogue felt-hat is at "photo".)
    id: "promenader", title: "Woman out walking", women: 1, ages: [20, 65], traits: { openness: 0.6, extraversion: 0.55 },
    dress: { "coat-woman": 1 }, head: { "hat-woman": 1 }, carry: { basket: 0.2 }, modes: { walk: 2, tram: 1 },
    day: [
      { what: "the shop windows", at: "shop", from: H(11), to: H(13, 30), round: { stops: 8, dwell: 5 }, jitter: 30, chance: 0.8, acts: ["look in a shop window", "stroll"], outside: true },
    ],
  },
];

/** Shares of the residents by role (populate). Who is on the street at an hour follows from their days. */
export const MIX: Record<string, number> = {
  housewife: 30, "munitions-worker": 12, schaffnerin: 2, "tram-driver": 2, schutzmann: 1, "landsturm-sentry": 1,
  "depot-soldier": 5, gunner: 1, officer: 1, "organ-grinder": 0.3, shopkeeper: 5, clerk: 8, pensioner: 6, child: 16,
  coachman: 1, "coal-carrier": 1.5, postwoman: 1.5, "soldier-on-leave": 2, promenader: 4,
};

/** Names common in Berlin among people born 1840-1911; a name a resident of the 1917 Adreßbuch carries is never given
 *  (world/SOP.md §4): tools/people/city.ts fills `avoid` from the map's Adreßbuch entries. */
export const FOLK: Omit<Folk, "avoid"> = {
  names: {
    given: {
      f: ["Anna", "Martha", "Frieda", "Emma", "Marie", "Gertrud", "Elisabeth", "Margarete", "Hedwig", "Charlotte", "Klara", "Luise", "Auguste", "Berta", "Minna", "Helene", "Erna", "Käthe", "Else", "Ida"],
      m: ["Karl", "Wilhelm", "Friedrich", "Otto", "Paul", "Hermann", "Ernst", "Max", "Richard", "August", "Gustav", "Heinrich", "Franz", "Walter", "Fritz", "Emil", "Albert", "Bruno", "Kurt", "Willi"],
    },
    family: ["Schulze", "Müller", "Schmidt", "Krause", "Meyer", "Lehmann", "Neumann", "Schröder", "Hoffmann", "Krüger", "Wolff", "Koch", "Richter", "Zimmermann", "Klein", "Hahn", "Fischer", "Wagner", "Becker", "Lange", "Braun", "Weber", "Köhler", "Fiedler", "Thiele", "Pohl", "Ziegler", "Jahn", "Brandt", "Kunze"],
  },
  hairStyles: { f: { "pinned-bun": 6, "low-bun": 3, "braided-crown": 1 }, m: { "short-sides": 5, "cropped": 3, "parted-flat": 2 } },
  hairColours: { "dark-brown": 4, "mid-brown": 4, "light-brown": 3, "dark-blond": 3, blond: 1, black: 1, red: 0.4 },
  // men: moustaches were near universal among the middle-aged and old; the young increasingly clean-shaven
  facialHair: {
    young: { none: 6, "moustache-short": 3, "moustache-toothbrush": 1 },
    middle: { none: 2, "moustache-short": 3, "moustache-walrus": 2, "moustache-kaiser": 2 },
    old: { "moustache-walrus": 3, "moustache-kaiser": 1, "beard-full": 2, "beard-mutton": 1, none: 1 },
  },
  irises: { blue: 4, grey: 3, green: 1.2, hazel: 1.5, brown: 2.5 },
  // the fourth war winter: the turnip winter behind them, rations near 1,000 kcal a day; people were thin
  build: [-0.9, 0.6],
  heights: { f: [1.59, 0.06], m: [1.69, 0.065] },
};
