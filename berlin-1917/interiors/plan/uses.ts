// What each thing in a room is for: the bridge from the interiors to the people's days. A person's schedule asks for
// an activity (sleep, eat, wash, the toilet, sew, school work ...) and finds the things in their flat, house or street
// that serve it, how many at once, and in what posture. Keyed by catalogue item (research/catalogue/interior.ts), so a
// prop serves every item it lists; pure data, read in bun by the checks (interiors/dress.feature) and at run time by
// the furnished rooms (interiors/cityroom.ts affordances).
//
// Shared beds are the period's: a worker couple in one bed, two or three children in another, a Schlafgänger renting
// a bed by the shift (research/households.md). The flat's WC was on the workers' half landing; the night's was the pot.

export type Activity =
  | "sleep" | "eat" | "cook" | "warm" | "wash" | "bathe" | "toilet" | "launder" | "iron" | "dress" | "sew" | "trade"
  | "study" | "read" | "write" | "music" | "listen" | "games" | "pray" | "sit" | "tend" | "exercise" | "hobby"
  | "store" | "water" | "fuel" | "play";
export type Pose = "lie" | "sit" | "stand" | "kneel" | "squat";
/** One use of a thing: the activity, how many at once, the posture; `who` narrows it (a cradle is an infant's). */
export interface Use { act: Activity; n: number; pose: Pose; who?: "infant" | "child" | "adult" }

const u = (act: Activity, n: number, pose: Pose, who?: Use["who"]): Use => ({ act, n, pose, ...(who ? { who } : {}) });

export const USES: Record<string, Use[]> = {
  // sleeping: a double bed takes two adults or three children (ASSUMED from the survey plates' crowded beds)
  "bed-iron": [u("sleep", 2, "lie")], "bed-wood": [u("sleep", 2, "lie")], "lodger-bed": [u("sleep", 1, "lie")],
  "straw-bed": [u("sleep", 2, "lie")], cradle: [u("sleep", 1, "lie", "infant")], "sofa-plush": [u("sit", 3, "sit"), u("sleep", 1, "lie", "child")],
  // eating, cooking, warmth
  "kitchen-table": [u("eat", 4, "sit"), u("sew", 1, "sit"), u("trade", 2, "sit"), u("study", 2, "sit"), u("games", 4, "sit"), u("write", 1, "sit")],
  "table-round": [u("eat", 4, "sit"), u("read", 2, "sit"), u("games", 4, "sit"), u("study", 2, "sit"), u("trade", 2, "sit")],
  "dining-suite": [u("eat", 8, "sit")], "chairs-bent": [u("sit", 1, "sit")], fauteuil: [u("sit", 1, "sit"), u("read", 1, "sit")],
  range: [u("cook", 1, "stand"), u("warm", 3, "sit")], "gas-cooker": [u("cook", 1, "stand")], haybox: [u("cook", 1, "stand")],
  "coffee-mill": [u("cook", 1, "sit")], enamelware: [u("eat", 6, "sit")], canisters: [u("store", 1, "stand")],
  "tiled-stove": [u("warm", 4, "sit")], "stove-hinterlader": [u("warm", 6, "sit")], "iron-stove": [u("warm", 3, "sit"), u("cook", 1, "stand")],
  "coal-box": [u("fuel", 1, "stand")], briquettes: [u("fuel", 1, "stand")], bucket: [u("water", 1, "stand"), u("fuel", 1, "stand")],
  // water, washing and the toilet
  "kitchen-sink": [u("water", 1, "stand"), u("wash", 1, "stand")], "water-tap": [u("water", 1, "stand")], "water-pail": [u("water", 1, "stand"), u("wash", 1, "stand")],
  washstand: [u("wash", 1, "stand")], "zinc-tub": [u("bathe", 1, "kneel")], tub: [u("bathe", 1, "kneel"), u("launder", 1, "stand")],
  bathroom: [u("bathe", 1, "lie")], bathtub: [u("bathe", 1, "lie")], "bath-heater": [u("bathe", 1, "stand")],
  "toilet-in-room": [u("toilet", 1, "sit")], wc: [u("toilet", 1, "sit")], "chamber-pot": [u("toilet", 1, "squat")],
  // laundry
  "wash-copper": [u("launder", 2, "stand")], washtub: [u("launder", 1, "stand")], washboard: [u("launder", 1, "stand")],
  mangle: [u("launder", 1, "stand")], "drying-line-indoor": [u("launder", 1, "stand")], "flat-iron": [u("iron", 1, "stand")],
  // dressing and storing
  wardrobe: [u("dress", 1, "stand"), u("store", 1, "stand")], "chest-drawers": [u("dress", 1, "stand"), u("store", 1, "stand")],
  "coat-stand": [u("dress", 2, "stand")], mirror: [u("dress", 1, "stand")], "pier-mirror": [u("dress", 1, "stand")],
  "kitchen-dresser": [u("store", 1, "stand")], vertiko: [u("store", 1, "stand")], trunk: [u("store", 1, "kneel")],
  // work at home
  "sewing-machine": [u("sew", 1, "sit")], "hw-sewing": [u("sew", 1, "sit"), u("trade", 1, "sit")], "hw-tailor": [u("trade", 1, "sit")],
  "konfektion-bundles": [u("trade", 2, "sit")], "hw-flowers": [u("trade", 3, "sit")], "hw-cigars": [u("trade", 2, "sit")],
  needlework: [u("sew", 1, "sit"), u("hobby", 1, "sit")], "knitting-front": [u("sew", 1, "sit")],
  "rolltop-desk": [u("write", 1, "sit")], "high-desk": [u("write", 1, "stand")], typewriter: [u("write", 1, "sit")],
  // school, reading, music, games
  "school-things": [u("study", 1, "sit", "child")], "books-shelf": [u("read", 1, "sit")], bookcase: [u("read", 1, "sit")],
  newspaper: [u("read", 1, "sit")], bible: [u("read", 1, "sit"), u("pray", 1, "sit")], seforim: [u("read", 1, "sit"), u("pray", 1, "stand")],
  piano: [u("music", 1, "sit")], zither: [u("music", 1, "sit")], accordion: [u("music", 1, "sit")], violin: [u("music", 1, "stand")],
  guitar: [u("music", 1, "sit")], gramophone: [u("listen", 4, "sit")], singing: [], skat: [u("games", 3, "sit")], chess: [u("games", 2, "sit")],
  "war-toys": [u("play", 2, "kneel", "child")], "rocking-horse": [u("play", 1, "sit", "child")],
  // faith
  crucifix: [u("pray", 2, "kneel")], "prayer-desk": [u("pray", 1, "stand")], misrach: [u("pray", 2, "stand")],
  "sabbath-candlesticks": [u("pray", 4, "stand")], "hanukkah-lamp": [u("pray", 4, "stand")], "torah-ark": [u("pray", 10, "stand")],
  "prayer-bench": [u("sit", 4, "sit"), u("pray", 4, "sit")],
  // pastimes and the animals
  birdcage: [u("tend", 1, "stand")], aquarium: [u("tend", 1, "stand")], pigeons: [u("tend", 1, "stand")], allotment: [u("tend", 1, "stand")],
  "indian-clubs": [u("exercise", 1, "stand")], "stamp-album": [u("hobby", 1, "sit")], "box-camera": [u("hobby", 1, "stand")],
  easel: [u("hobby", 1, "stand")], bicycle: [u("exercise", 1, "sit")],
};

/** What one room's things offer, slots per activity: its draw (plan/dress.ts wants) and the counted things (the beds
 *  of plan/life.ts), added `into` a running total (a flat's, over its rooms). */
export function offers(items: string[], count: Record<string, number> = {}, into: Partial<Record<Activity, number>> = {}): Partial<Record<Activity, number>> {
  for (const it of new Set([...items, ...Object.keys(count)])) {
    const n = Math.max(count[it] ?? 0, items.includes(it) ? 1 : 0);
    for (const x of USES[it] ?? []) into[x.act] = (into[x.act] ?? 0) + x.n * n;
  }
  return into;
}
