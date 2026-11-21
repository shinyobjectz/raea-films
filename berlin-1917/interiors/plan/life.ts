// Who sleeps where, and where the household cooks: a flat's rooms given to its people. The bake (tools/city/bake.ts)
// writes it into each room record (RoomRec.sleep, .cook), the furnisher (interiors/cityroom.ts) turns it into beds,
// and the people's days (the coming civilian simulation) read each person's bed from it.
//
// The rules are the survey photographs' (research/interiors.md, the Ortskrankenkasse's Wohnungs-Enquete 1901-1920):
// two adults to a bed, three children to a bed, the baby's cradle by the mother; a worker family sleeps in the Stube
// and the kitchen, one to four in the kitchen; the Schlafgänger rents a bed, and a night-shift lodger shares one with
// a day-shift one; the good flat's maid sleeps by the kitchen, its children in their own room; the petty household
// keeps its gute Stube for Sundays and sleeps in it only when the rest is full. A flat without a kitchen cooks on the
// Stube's iron stove, and fetches water from the tap on the landing.
import type { Klass } from "./flats";
import type { Person } from "./households";

/** A room as the plan sees it: its id in the flat, its use, its floor area (m2). */
export interface LifeRoom { id: number; use: string; area: number }
/** Each bed: the people (indices into the household's `people`) who sleep in it; a lone infant's is a cradle. */
export type Bed = number[];
export interface Life { sleep: Map<number, Bed[]>; cook: number | null }

const BED_M2 = 3.2; // a bed and the floor beside it (ASSUMED: a 1 x 2 m bed and a strip to get in)
/** The rooms each class sleeps in, first choice first; a room not listed is never slept in. */
const SLEEPS: Record<string, string[]> = {
  bourgeois: ["bedroom", "children", "maid", "kammer"],
  petty: ["bedroom", "kammer", "children", "stube", "kitchen", "gute-stube"],
  worker: ["stube", "kammer", "kitchen", "bedroom", "children"],
};
const order = (k: Klass) => SLEEPS[k] ?? SLEEPS.worker;

/** How many beds a room takes before it is full: the kitchen keeps its range, dresser and table. */
export function bedsFit(r: LifeRoom): number {
  const free = r.use === "kitchen" ? r.area - 6 : r.area - 4;
  return Math.max(1, Math.floor(free / BED_M2));
}

/** Who sleeps at home tonight (the men at the front and the fallen don't), paired into beds. */
export function beds(people: Person[], klass: Klass): { bed: Bed; kind: "parents" | "children" | "infant" | "lodger" | "servant" | "single" }[] {
  const home = people.map((p, i) => ({ p, i })).filter(({ p }) => p.status === "home" || p.status === "night-shift");
  const out: ReturnType<typeof beds> = [];
  const head = home.find((x) => x.p.relation === "head"), wife = home.find((x) => x.p.relation === "wife");
  const infants = home.filter((x) => x.p.relation === "child" && x.p.age < 2);
  const kids = home.filter((x) => x.p.relation === "child" && x.p.age >= 2 && x.p.age < 14).sort((a, b) => a.p.age - b.p.age);
  const teens = home.filter((x) => x.p.relation === "child" && x.p.age >= 14);
  // the parents' bed; a mother alone (the man at the front, or a widow) takes the youngest child in with her
  const mother = wife ?? (head?.p.sex === "f" ? head : undefined);
  const parents: Bed = [head, wife].filter((x) => x).map((x) => x!.i);
  if (parents.length) {
    if (parents.length === 1 && mother && kids.length && klass !== "bourgeois") parents.push(kids.shift()!.i);
    out.push({ bed: parents, kind: "parents" });
  }
  for (const x of infants) out.push({ bed: [x.i], kind: "infant" });
  // children three to a bed, the good flat's one or two to a bed; older ones two to a bed, boys with boys
  const per = klass === "bourgeois" ? 1 : klass === "petty" ? 2 : 3;
  for (let j = 0; j < kids.length; j += per) out.push({ bed: kids.slice(j, j + per).map((x) => x.i), kind: "children" });
  for (const sex of ["m", "f"] as const) {
    const t = teens.filter((x) => x.p.sex === sex);
    for (let j = 0; j < t.length; j += klass === "bourgeois" ? 1 : 2) out.push({ bed: t.slice(j, j + (klass === "bourgeois" ? 1 : 2)).map((x) => x.i), kind: "children" });
  }
  const gran = home.filter((x) => x.p.relation === "grandmother");
  for (const x of gran) out.push({ bed: [x.i], kind: "single" });
  // Schlafgänger: a night-shift man sleeps by day in a day-shift man's bed
  const lodgers = home.filter((x) => x.p.relation === "lodger"), day = lodgers.filter((x) => x.p.status !== "night-shift"), night = lodgers.filter((x) => x.p.status === "night-shift");
  for (const x of day) out.push({ bed: [x.i, ...(night.length && night[0].p.sex === x.p.sex ? [night.shift()!.i] : [])], kind: "lodger" });
  for (let j = 0; j < night.length; j += 2) out.push({ bed: night.slice(j, j + 2).map((x) => x.i), kind: "lodger" });
  for (const x of home.filter((x) => x.p.relation === "subtenant")) out.push({ bed: [x.i], kind: "single" });
  for (const x of home.filter((x) => ["maid", "cook", "apprentice"].includes(x.p.relation))) out.push({ bed: [x.i], kind: "servant" });
  // anyone else at home (a relation the household code adds later) gets a bed of their own
  const placed = new Set(out.flatMap((b) => b.bed));
  for (const x of home) if (!placed.has(x.i)) out.push({ bed: [x.i], kind: "single" });
  return out;
}

/** The household's beds put into its rooms, and the room it cooks in. */
export function plan(people: Person[], klass: Klass, rooms: LifeRoom[]): Life {
  const sleep = new Map<number, Bed[]>(), left = new Map(rooms.map((r) => [r.id, bedsFit(r)]));
  const pref = order(klass);
  const can = rooms.filter((r) => pref.includes(r.use));
  // where each kind of bed goes first: the parents in the first room of the class's order, the servants and lodgers
  // by the kitchen, a subtenant in a Kammer of his own, children after the parents
  const first: Record<string, string[]> = {
    parents: pref, infant: pref, children: klass === "bourgeois" ? ["children", "kammer", "bedroom"] : pref.slice(1).concat(pref[0]),
    servant: ["maid", "kitchen", "kammer"], lodger: ["kammer", "kitchen", "stube"], single: ["kammer", "children", ...pref],
  };
  const put = (b: Bed, room: LifeRoom) => { sleep.set(room.id, [...(sleep.get(room.id) ?? []), b]); left.set(room.id, (left.get(room.id) ?? 0) - 1); };
  const all = beds(people, klass);
  let parentsRoom: LifeRoom | undefined;
  for (const { bed, kind } of all) {
    // the cradle stands by the parents' bed and takes no bed's floor
    if (kind === "infant" && parentsRoom) { sleep.set(parentsRoom.id, [...(sleep.get(parentsRoom.id) ?? []), bed]); continue; }
    const want = first[kind] ?? pref;
    // a servant sleeps in the maid's room, the kitchen or a Kammer, even where the family never sleeps in its kitchen
    const pool = kind === "servant" ? rooms.filter((r) => pref.includes(r.use) || r.use === "kitchen") : can;
    const pick = want.map((u) => pool.filter((r) => r.use === u && (left.get(r.id) ?? 0) > 0).sort((a, b) => b.area - a.area)[0]).find((r) => r)
      // full everywhere: into the room with the most floor left (crowding is the survey's subject, not an error); the
      // good flat's maid never into the family's bedrooms (unframed: the Hängeboden, the loft over the kitchen passage)
      ?? (kind === "servant" && klass === "bourgeois" ? undefined : can.slice().sort((a, b) => (left.get(b.id) ?? 0) - (left.get(a.id) ?? 0) || b.area - a.area)[0]);
    // no room the class sleeps in was framed (a flat planned in slivers): the bed stays unplaced, never in a salon
    if (!pick) continue;
    put(bed, pick);
    if (kind === "parents") parentsRoom = pick;
  }
  const kitchen = rooms.find((r) => r.use === "kitchen");
  // only a poor flat cooks in its Stube: a good flat whose kitchen is too narrow to walk still has one (unframed)
  const cook = kitchen ? kitchen.id : klass === "bourgeois" ? null : (rooms.find((r) => r.use === "stube") ?? rooms.filter((r) => !["corridor", "pantry", "dark"].includes(r.use)).sort((a, b) => b.area - a.area)[0])?.id ?? null;
  return { sleep, cook };
}

/** The things a bed can be, and the bedding the bed props stand for (a checked featherbed is a made bed): a household's
 *  rooms take their beds from its sleeping plan, never from the recipe's draw. */
export const BED_ITEMS = ["bed-iron", "bed-wood", "lodger-bed", "straw-bed", "cradle", "featherbed-check", "show-pillows", "straw-sack"];
/** What of the recipe's draw a household's room leaves out: every bed its plan doesn't put there. */
export const dropFor = (count: Record<string, number>) => BED_ITEMS.filter((b) => !count[b]);

/** The bed item a household's bed is: a cradle, the lodger's narrow bed, the good flat's wooden bed, else the iron one. */
export function bedItem(people: Person[], bed: Bed, klass: Klass): string {
  if (bed.length === 1 && people[bed[0]]?.relation === "child" && people[bed[0]].age < 2) return "cradle";
  if (people[bed[0]]?.relation === "lodger") return "lodger-bed";
  return klass === "bourgeois" || klass === "petty" ? "bed-wood" : "bed-iron";
}

/** What a room's part of the plan adds to its furnishing: item -> how many (the beds), and what a kitchenless
 *  household's cooking room needs (the iron stove to cook on, the pail of water from the landing). */
export function lifeItems(people: Person[], klass: Klass, sleep: Bed[] | undefined, cooks: boolean, isKitchen: boolean): Record<string, number> {
  const out: Record<string, number> = {};
  for (const b of sleep ?? []) { const it = bedItem(people, b, klass); out[it] = (out[it] ?? 0) + 1; }
  // the night's pot under a bed of adults
  if ((sleep ?? []).some((b) => b.some((i) => (people[i]?.age ?? 0) >= 14))) out["chamber-pot"] = 1;
  if (cooks && !isKitchen) { out["iron-stove"] = 1; out["water-pail"] = 1; }
  return out;
}
