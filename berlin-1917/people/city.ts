// The people around a camera for a day: everyone living within reach of it (each house door the residents of the floor
// area behind it, its court wings' too: tools/people/places.ts), working at any place in the slice, their days from
// people/roles.ts, deterministic by date. The street's walkers are drawn by who those days put on the sidewalks. The places are the baked
// tiles' doors and queue lines (assets/people/places.json, tools/people/places.ts). Shared by tools/people/city.ts and
// the previz crowd (components/people/Crowd.tsx).
import { cityDay, gridOf, passersBy, populate, streetMix, type Day, type Passer, type Place, type V3, type Walk } from "raea/people";
import placesJson from "../assets/people/places.json" with { type: "json" };
import walksJson from "../assets/people/walks.json" with { type: "json" };
import avoidJson from "../assets/people/avoid.json" with { type: "json" };
import { FOLK, MIX, ROLES } from "./roles";

type Row = (number | string)[];
const J = placesJson as unknown as { kinds: string[]; src: string[]; inside: string[]; rows: Row[] };
const INSIDE = new Set(J.inside);

/** Every place in the slice: id `<kind>-<row>`; homes, shops and workplaces are inside (their people hidden unless
 *  out at the door), corners, posts and courtyards are out of doors. */
export const PLACES: Place[] = J.rows.map((r, i) => {
  const kind = J.kinds[r[0] as number];
  const p: Place = { id: `${kind}-${i}`, kind, at: [r[1] as number, r[2] as number, r[3] as number], facing: r[4] as number };
  if (r[5]) p.holds = r[5] as number;
  if (INSIDE.has(kind)) p.inside = true;
  if (r.length > 7) p.line = { at: [r[7] as number, r[2] as number, r[8] as number], along: [r[9] as number, 0, r[10] as number] };
  return p;
});
/** A stand-in place or a trade drawn by a share (not the Adreßbuch's) */
export const placeSource = (id: string) => J.src[J.rows[Number(id.slice(id.lastIndexOf("-") + 1))][6] as number];

const printed = new Set((avoidJson as { words: string[] }).words);
export const FOLK_CITY = { ...FOLK, avoid: (_g: string, family: string) => printed.has(family) };

const HOMES = PLACES.filter((p) => p.kind === "home"), WORK = PLACES.filter((p) => p.kind !== "home");

export interface Around {
  /** where the camera is (the shot) */
  eye: V3;
  /** "1917-12-03" (a Monday) unless said */
  date?: string;
  /** who lives within this many metres of the camera (1200) */
  reach?: number;
  /** the share of the residents lived (1: everyone behind each door, places.json's holds); or a fixed number a house
   *  door (perDoor), as before the doors held their floor area */
  share?: number;
  perDoor?: number;
  /** how cold (0 mild to 1 bitter; 0.8, December 1917) */
  cold?: number;
}

const days = new Map<string, Day>();
/** The day of everyone living near the camera; the same inputs give the same people and days (cached). */
export function cityAround(a: Around): Day {
  const date = a.date ?? "1917-12-03", reach = a.reach ?? 1200, per = a.perDoor ?? 0, share = a.share ?? 1;
  // the camera's cell (100 m), so the cameras of one shot share a population
  const cx = Math.round(a.eye[0] / 100) * 100, cz = Math.round(a.eye[2] / 100) * 100;
  const key = `${cx},${cz},${date},${reach},${per},${share},${a.cold ?? 0.8}`;
  let d = days.get(key);
  if (d) return d;
  const homes = gridOf(HOMES).within([cx, 0, cz], reach);
  const places = [...homes, ...WORK];
  const lives = per ? homes.length * per : Math.round(share * homes.reduce((n, h) => n + (h.holds ?? 0), 0));
  const people = populate({ roles: ROLES, places, folk: FOLK_CITY, mix: MIX, people: lives, seed: `gambit-${cx},${cz}` });
  d = cityDay(people, ROLES, places, { key: date, weekday: new Date(`${date}T12:00:00Z`).getUTCDay() }, undefined, a.cold ?? 0.8);
  days.set(key, d);
  return d;
}

/** The sidewalks (assets/world/friedrichstadt tiles' walks, tools/people/walks.ts): avenues 0.3 walkers a metre at
 *  5 pm, side streets 0.08. */
export const WALKS: Walk[] = (() => {
  const J = walksJson as { rings?: { legs: [number, number][]; doors: number[]; pts: number[] }[]; rows?: number[][] };
  const pts = (f: number[], from: number) => { const p: V3[] = []; for (let k = from; k + 2 < f.length; k += 3) p.push([f[k], f[k + 1], f[k + 2]]); return p; };
  // rings round the blocks (tools/people/walks.ts): each leg its own busyness, doors where walkers come and go
  if (J.rings) return J.rings.map((r, i) => ({ id: `r${i}`, path: pts(r.pts, 0), closed: true, width: 4, perMetre: r.legs[0]?.[1] ?? 0.08, legs: r.legs.map(([to, perMetre]) => ({ to, perMetre })), doors: r.doors }));
  // the older open walks: a row [walkers a metre at 5 pm, width, x, y, z, ...]
  return (J.rows ?? []).map((r, i) => ({ id: `w${i}`, path: pts(r, 2), perMetre: r[0], width: r[1] }));
})();

const mixes = new WeakMap<Day, ReturnType<typeof streetMix>>();
/** The people passing along the sidewalks within `within` metres of the camera at minute `m` (fractional minutes are
 *  seconds), as raea/people's passersBy draws them: each round of a walker a person of the role the hour puts on foot
 *  (streetMix of the day around the camera: the soldiers on leave and the women at the shop windows at noon, the
 *  children going home at one), at their own pace, keeping right. */
export function passersAround(eye: V3, m: number, within = 250, busy = 1, cold = 0.8, date?: string): Passer[] {
  const day = cityAround({ eye, date, cold });
  let mixAt = mixes.get(day);
  if (!mixAt) mixes.set(day, (mixAt = streetMix(day)));
  return passersBy(WALKS, m, { roles: ROLES, folk: FOLK_CITY, mix: MIX, mixAt, seed: "gambit-street", cold, busy, near: eye, within })
    .filter((p) => Math.hypot(p.at[0] - eye[0], p.at[2] - eye[2]) <= within);
}
