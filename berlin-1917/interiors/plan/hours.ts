// What is lit in the city's rooms at a day of the year and an hour, the same pair as the world's CityLook (day 1-366,
// hour 0-24; docs/realism.feature D17 in raea: the world has seasons). The sun over Berlin by 1917's clocks (summer
// time from 16 April to 17 September), the heating months, and each household's day at home (plan/home.ts): a room's
// lamps burn while it is dark in it and someone is up in it; a fire burns while someone cooks on it, or in the
// heating months while anyone is up in its room.
import { ROLES } from "../../people/roles";
import { homeDay, type HomeRoom, outsOf, type Slot } from "./home";
import type { Klass } from "./flats";
import type { Identity } from "./identity";
import type { Person } from "./households";

export type When = { day: number; hour: number };

import { heating, sun, weekdayOf } from "./sun";
export { hanukkah, heating, longEvening, sun, weekdayOf } from "./sun";
/** Dark indoors: half an hour after sunset, half an hour before sunrise, a room facing a court an hour (its light
 *  comes off the court's walls); a room with no window is always dark. */
export function darkIn(w: When, windows: number, court = false): boolean {
  if (!windows) return true;
  const s = sun(w.day), m = court ? 1 : 0.5;
  return w.hour < s.rise + m || w.hour > s.set - m;
}

/** A household as the bake writes it (assets/world/<city>/interiors/<key>.json, flats[]). */
export type HouseholdRec = { level: number; id: number; klass: Klass; identity?: Identity | null; who?: { kind: string; people?: Person[] } | null };

const seedOf = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const days = new Map<string, Slot[][]>();

/** Each person's day at home for a household on a day of the year (as tools/interiors/home-check.ts draws it). */
export function dayOf(key: string, fl: HouseholdRec, rooms: HomeRoom[], day: number): Slot[][] | null {
  if (fl.who?.kind !== "household" || !fl.identity || !fl.who.people?.length) return null;
  const k = `${key}:${fl.level}:${fl.id}:${day}`, have = days.get(k);
  if (have) return have;
  const people = fl.who.people, seed = seedOf(`${key}:${fl.level}:${fl.id}`), weekday = weekdayOf(day);
  const out = homeDay({ people, klass: fl.klass, identity: fl.identity, rooms, weekday, week: Math.floor((day - 1) / 7), day, seed, outs: (i) => outsOf(ROLES.find((r) => r.id === people[i].role), weekday, seed + i * 7919) });
  days.set(k, out);
  return out;
}

/** Who is in a room at a minute: anyone up in it, and anyone cooking in it. */
export function roomAt(slots: Slot[][], room: number, minute: number): { up: boolean; cooking: boolean } {
  let up = false, cooking = false;
  for (const d of slots) {
    const s = d.find((x) => x.from <= minute && minute < x.to);
    if (!s || s.room !== room || s.act === "out") continue;
    if (s.act !== "sleep") up = true;
    if (s.act === "cook") cooking = true;
  }
  return { up, cooking };
}

/** The props whose glow is a fire (an iron door's glow), not a lamp. */
export const FIRES = new Set(["range", "iron-stove", "range-broken"]);

/** Whether a glowing prop burns: a fire by cooking and the heating months, a lamp by the dark; in a household's room
 *  only while someone is up in it, elsewhere (the stair, the cellar) between 6 and 22. */
export function burns(prop: string, w: When, dark: boolean, at: { up: boolean; cooking: boolean } | null): boolean {
  const up = at ? at.up : w.hour >= 6 && w.hour < 22;
  if (FIRES.has(prop)) return (at?.cooking ?? false) || (heating(w.day) && up);
  return dark && up;
}
