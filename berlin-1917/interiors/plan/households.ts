// Who lives, works and sleeps in each flat of a planned house (interiors/plan/house.ts) in December 1917.
//
// Where the 1917 Adreßbuch lists the house (map/1917/businesses, 647 houses, 7,334 entries), its entries decide the
// house: each listed resident heads a household and takes the flat that fits their rank (occupations.ts), the
// porter takes the porter's flat; practices, firms, banks and offices of state take front flats as offices, hotels
// whole floors, shops the street rooms. By 1917 the inner city was mostly business (the Friedrichstadt had 38.4
// residents a plot in 1905, the city 77), so what the entries don't fill is a firm's workroom or store, not a home.
// Where the directory isn't read yet, the district's residents a plot set the number of households.
//
// The households themselves (ASSUMED rates marked; the rest from research/households.md):
//   lodgers      13% of Berlin households took Schlafgänger (1905), 88% of them in flats of 2-3 rooms (1900); 1.58 a
//                lodging household, 74% men (1900): a worker's flat 18%, a petty one 8%
//   servants     56,775 servants lived in their employers' homes (1907): a good flat keeps a maid; a big one a cook
//                too (ASSUMED 30%)
//   the war      287,000 Berlin families drew soldiers' family support in July 1917: a married man of 20-45 is at
//                the front (ASSUMED 75%; officers' families 60%); of those, 8% have fallen by December (ASSUMED)
//   children     ASSUMED means: workers 2.6, petty 1.9, good society 1.7 (Berlin's birth rate was Germany's lowest)
//   the old      a widowed mother or mother-in-law in 8% of families (ASSUMED), minding the children
//   subtenants   a furnished room let in 15% of petty and good flats (ASSUMED; the Friedrichstadt's Vermieterinnen)
import type { Flat, Klass } from "./flats";
import type { House } from "./house";
import { occupation } from "./occupations";

export interface Entry { text: string; kind: string; role: string | null }
export type Relation = "head" | "wife" | "husband" | "child" | "grandmother" | "lodger" | "subtenant" | "maid" | "cook" | "apprentice";
export interface Person { relation: Relation; sex: "m" | "f"; age: number; work: string; role: string; status: "home" | "front" | "fallen" | "night-shift" }
export type Occupant =
  | { kind: "household"; head: string; listed: boolean; people: Person[] }
  | { kind: "office" | "practice" | "hotel" | "shop" | "workroom" | "store"; what: string; listed: boolean };

const hash = (seed: number) => (k: number) => {
  let h = (seed * 2654435761 + k * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const poisson = (mean: number, r: number) => { let k = 0, p = Math.exp(-mean), s = p; while (r > s && k < 9) { k++; p *= mean / k; s += p; } return k; };

const VALUE: Record<Klass, number> = { bourgeois: 3, office: 2.6, petty: 2, shop: 1.9, worker: 1, porter: 0.9, workshop: 0.3, house: 0 };
/** the trade word of an entry, never a name: "Butsch, O, Papierhdlg. T." -> "papierhdlg" */
export const trade = (text: string) => occupation(text).word || "firm";

/** The school a child of six or more goes to, by the household's rank, or null once they work. The Gemeindeschule
 *  was free and ran to fourteen, and most Berlin children went to it; the Mittelschule charged fees and ran a year or
 *  two longer; a good household's boys went to a Gymnasium (from nine, after its Vorschule) and its girls to a Lyzeum,
 *  both past sixteen. The petty household's Mittelschule share is ASSUMED. */
export function schoolOf(rank: number, sex: "m" | "f", age: number, u: number): string | null {
  if (rank >= 3) return sex === "m" ? (age < 9 ? "Vorschule" : "Gymnasium") : "Lyzeum";
  if (rank >= 2 && u < 0.35) return age < 16 ? "Mittelschule" : null;
  return age < 14 ? "Gemeindeschule" : null;
}

/** A working fourteen-year-old's day: an errand boy keeps a firm's office hours; a worker's apprentice goes where the
 *  metal trades went in 1917, the war works. */
export const teenRole = (rank: number, job: string) => (job === "Lehrling" && rank <= 1 ? "munitions-worker" : "clerk");

/** A household of rank `rank` (3, 2, 1), headed as `head` says, from the rates above. */
export function household(R: (k: number) => number, k: number, rank: number, head: { de: string; woman?: boolean; widow?: boolean; role?: string }, big: boolean): Person[] {
  const p: Person[] = [], r = (j: number) => R(k * 37 + j);
  const woman = !!head.woman, widow = !!head.widow || (woman && r(1) < 0.5);
  const age = woman && widow ? 40 + Math.floor(r(2) * 35) : 26 + Math.floor(r(2) * 34);
  const roleOf = (rk: number) => (rk >= 3 ? "clerk" : rk >= 2 ? "clerk" : "munitions-worker");
  if (woman) {
    p.push({ relation: "head", sex: "f", age, work: head.de, role: head.role ?? "housewife", status: "home" });
  } else {
    // the man of the house: at the front, fallen, or at home (over 45, or kept in a war industry)
    const fighting = age <= 45 && r(3) < (rank >= 3 ? 0.6 : 0.75);
    const status = fighting ? (r(4) < 0.08 ? "fallen" : "front") : "home";
    p.push({ relation: "head", sex: "m", age, work: head.de, role: head.role ?? roleOf(rank), status });
    if (r(5) < 0.88) p.push({ relation: "wife", sex: "f", age: age - 2 - Math.floor(r(6) * 6), work: rank <= 1 ? (r(7) < 0.45 ? "Munitionsarbeiterin" : "Heimarbeit (Näherin)") : "Hausfrau", role: rank <= 1 && r(7) < 0.45 ? "munitions-worker" : "housewife", status: "home" });
  }
  const mother = p.find((x) => x.sex === "f");
  if (mother && mother.age < 55) {
    // the eldest born when the mother was 20-28, the rest 1-4 years apart; those over 16 have left home
    const n = poisson(rank >= 3 ? 1.7 : rank >= 2 ? 1.9 : 2.6, r(8));
    let a = mother.age - 20 - Math.floor(r(9) * 8);
    for (let c = 0; c < n && a >= 0; c++, a -= 1 + Math.floor(r(10 + c) * 3.5)) {
      if (a > 16) { c--; continue; }
      const sex = r(20 + c) < 0.5 ? "m" : "f", job = r(30 + c) < 0.5 ? "Laufbursche" : "Lehrling", school = schoolOf(rank, sex, a, r(40 + c));
      p.push({ relation: "child", sex, age: a, work: a < 6 ? "" : school ?? job, role: a < 6 || school ? "child" : teenRole(rank, job), status: "home" });
    }
  }
  if (p.length > 1 && r(40) < 0.08) p.push({ relation: "grandmother", sex: "f", age: 62 + Math.floor(r(41) * 18), work: "Witwe", role: "pensioner", status: "home" });
  if (rank <= 1 && r(42) < 0.18) {
    const n = r(43) < 0.58 ? 1 : 2;
    for (let j = 0; j < n; j++) p.push({ relation: "lodger", sex: r(44 + j) < 0.74 ? "m" : "f", age: 16 + Math.floor(r(46 + j) * 30), work: "Schlafgänger", role: "munitions-worker", status: r(48 + j) < 0.5 ? "night-shift" : "home" });
  }
  if (rank >= 2 && rank < 3 && r(50) < 0.08) p.push({ relation: "lodger", sex: "m", age: 18 + Math.floor(r(51) * 20), work: "Schlafgänger", role: "clerk", status: "home" });
  if (rank >= 2 && r(52) < 0.15) p.push({ relation: "subtenant", sex: r(53) < 0.6 ? "m" : "f", age: 19 + Math.floor(r(54) * 25), work: r(55) < 0.4 ? "Student" : r(55) < 0.7 ? "Kontorist" : "Schauspielerin", role: "clerk", status: "home" });
  if (rank >= 3) {
    if (r(56) < 0.9) p.push({ relation: "maid", sex: "f", age: 16 + Math.floor(r(57) * 14), work: "Dienstmädchen", role: "housewife", status: "home" });
    if (big && r(58) < 0.3) p.push({ relation: "cook", sex: "f", age: 30 + Math.floor(r(59) * 25), work: "Köchin", role: "housewife", status: "home" });
  }
  if (head.role === "shopkeeper" && r(60) < 0.3) p.push({ relation: "apprentice", sex: "m", age: 14 + Math.floor(r(61) * 3), work: "Lehrling", role: "child", status: "home" });
  return p;
}

const key = (level: number, flat: number) => `${level}:${flat}`;

/** Every flat of the house filled. `entries`: the house's Adreßbuch rows, or null where it isn't read; `residents`:
 *  the district's residents a plot (38.4 the Friedrichstadt), used only then. */
export function occupy(house: House, entries: Entry[] | null, o: { seed: number; residents: number; footprint: number }): Map<string, Occupant> {
  const R = hash(o.seed), out = new Map<string, Occupant>();
  const flats: { level: number; f: Flat; v: number }[] = [];
  for (const L of house.levels) for (const f of L.floor.flats) {
    if (f.klass === "house") continue;
    flats.push({ level: L.n, f, v: VALUE[f.klass] + (L.n === 1 ? 0.4 : L.n === 2 ? 0.2 : L.kind === "attic" ? -0.5 : 0) + f.area / 150 });
  }
  flats.sort((a, b) => b.v - a.v);
  const free = new Set(flats);
  const takeFlat = (pred: (x: (typeof flats)[0]) => boolean) => { for (const x of flats) if (free.has(x) && pred(x)) { free.delete(x); return x; } return null; };
  // the ground floor's shops and porter keep their places
  for (const x of flats) if (x.f.klass === "shop") { free.delete(x); out.set(key(x.level, x.f.id), { kind: "shop", what: "shop and the shopkeeper's flat", listed: false }); }
  const list = entries ?? [];
  let shopNo = 0;
  const shops = [...out.entries()].filter(([, v]) => v.kind === "shop");
  for (const e of list.filter((e) => e.kind === "shop" || e.kind === "food")) {
    if (shopNo < shops.length) { const [k] = shops[shopNo++]; out.set(k, { kind: "shop", what: trade(e.text), listed: true }); }
  }
  for (const e of list) {
    if (e.role === "owner") continue;
    if (["practice", "firm", "bank", "state"].includes(e.kind)) {
      const x = takeFlat((y) => y.f.front && y.level >= 1) ?? takeFlat((y) => y.level >= 0);
      if (x) out.set(key(x.level, x.f.id), { kind: e.kind === "practice" ? "practice" : "office", what: trade(e.text), listed: true });
    } else if (e.kind === "hotel") {
      for (let n = 0; n < 3; n++) { const x = takeFlat((y) => y.level >= 1); if (x) out.set(key(x.level, x.f.id), { kind: "hotel", what: trade(e.text), listed: true }); }
    }
  }
  // households. The listed residents, best first, each into the free flat nearest their rank (a worker to a wing
  // flat, a lawyer to the bel étage); the porter to the porter's flat. Then the flats the directory leaves empty:
  // a wing's, the attic's and the ground floor's small flats get households it didn't list (ASSUMED: lodgers, short
  // tenancies and the poorest went unlisted); a front flat over the ground floor stands to let (big flats emptied in
  // the war as households shrank: ASSUMED), or in a business house is a firm's rooms.
  const KR: Record<Klass, number> = { bourgeois: 3, office: 2.6, petty: 2, shop: 1.9, worker: 1, porter: 1, workshop: 0.5, house: 0 };
  const residents = list.filter((e) => e.kind === "resident" && e.role !== "owner").map((e) => ({ ...occupation(e.text), listed: true }));
  residents.sort((a, b) => (b.rank ?? 1.8) - (a.rank ?? 1.8));
  let k = 0;
  const put = (x: (typeof flats)[0], head: { de: string; rank: number | null; woman?: boolean; widow?: boolean; role?: string }, listed: boolean) => {
    const rank = head.rank ?? KR[x.f.klass];
    out.set(key(x.level, x.f.id), { kind: "household", head: head.de || "?", listed, people: household(R, k++, Math.max(1, Math.min(3, Math.round(rank))), head, x.f.area > 110) });
  };
  for (const h of residents) {
    const porter = h.de === "Portier";
    const rank = h.rank ?? 1.8;
    let x = porter ? takeFlat((y) => y.f.klass === "porter") : null;
    if (!x) {
      let best: (typeof flats)[0] | null = null, bc = 1e9;
      for (const y of free) { const c = Math.abs(KR[y.f.klass] - rank) + (y.level === 0 ? 0.3 : 0) + y.level * 0.01; if (c < bc) { bc = c; best = y; } }
      if (best) { free.delete(best); x = best; }
    }
    if (!x) break;
    put(x, h, true);
  }
  // how many more households the house holds: the district's residents a plot (the Friedrichstadt 38.4 in 1905)
  // scaled by the footprint (a plot's house some 450 m2: ASSUMED), less the people listed; where the directory lists
  // the house, most of what it leaves are a firm's rooms, a workshop (the Konfektion's middlemen and their seamstresses
  // worked in the Friedrichstadt's courts) or a flat to let
  const business = list.some((e) => ["firm", "practice", "bank", "shop", "food", "hotel", "state"].includes(e.kind));
  const at = () => [...out.values()].reduce((t, o) => t + (o.kind === "household" ? o.people.length : 0), 0);
  let budget = Math.max(0, Math.round((o.residents * (o.footprint / 450) - at()) / 3.6));
  for (const x of [...free].sort((a, b) => Number(a.f.klass !== "porter") - Number(b.f.klass !== "porter"))) {
    free.delete(x);
    if (x.f.klass === "porter") { put(x, { de: "Portier", rank: 1, role: "coal-carrier" }, false); continue; }
    const small = !x.f.front || x.level === 0 || house.levels.find((L) => L.n === x.level)?.kind === "attic" || x.f.klass === "worker";
    if ((small || !entries) && budget-- > 0) {
      const rank = KR[x.f.klass], woman = R(k * 5 + 2) < 0.12;
      put(x, { de: rank >= 3 ? "Kaufmann" : rank >= 2 ? "Beamter" : woman ? "Arbeiterin" : "Arbeiter", rank, woman, widow: woman }, false);
    } else if (small && house.levels.find((L) => L.n === x.level)?.kind === "attic") out.set(key(x.level, x.f.id), { kind: "store", what: "lumber and drying", listed: false });
    else if (small) out.set(key(x.level, x.f.id), { kind: "workroom", what: x.level === 0 ? "a workshop" : "a workroom (sewing for the Konfektion)", listed: false });
    else out.set(key(x.level, x.f.id), business ? { kind: "workroom", what: "a firm's rooms", listed: false } : { kind: "store", what: "to let", listed: false });
  }
  return out;
}
