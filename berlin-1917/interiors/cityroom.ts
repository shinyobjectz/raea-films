// The walkable city's rooms furnished at render time: a baked house's record (tools/city/bake.ts: each room's frame,
// windows and doors, each household's identity) turned into a Set the interiors' drawing code already knows
// (interiors/draw/set.tsx SetRooms with shells off: the house's GLB has the walls). Per room: its recipe for its use
// and class (plan/dress.ts recipeFor), the household's additions (dress), the dials for its house and flat, the
// furnisher (furnish.ts), then the additions with a place rule moved to it (over the bed, on the doorpost, on the
// east wall ...). Runs inside raea (it needs the kit); the choices before the furnisher run in bun (city.feature).
import { RECIPES } from "../research/catalogue/rooms";
import { kitFor } from "../research/catalogue/trades";
import { CORNER_TRADES, cornerProps } from "./corner";
import { PROFILES, shopProps } from "./shops";
import type { RoomRec } from "../tools/city/rooms";
import { furnish } from "./furnish";
import { def, ids } from "./kit/prop";
import type { Klass, Use } from "./plan/flats";
import { type Add, dialsFor, dress, OVERLAYS, recipeFor, roomSeed, takeRates, trisCap } from "./plan/dress";
import type { Identity } from "./plan/identity";
import type { Person } from "./plan/households";
import { dropFor, lifeItems } from "./plan/life";
import { burns, darkIn, dayOf, roomAt, type When } from "./plan/hours";
import { christmas, hanukkah, heating } from "./plan/sun";
import type { Place, Room, Set } from "./sets/types";
import type { Opening, Shell, Wall } from "./shell";
import { cityDoorId, type CityDoor, DOOR_H, DOOR_W, PAIR_W } from "./kit/door";

export interface FlatRec { level: number; id: number; klass: Klass; identity?: Identity | null; who?: { kind: string; what?: string; people?: Person[] } | null }
export interface HouseRec { key: string; rooms: RoomRec[]; flats: FlatRec[] }

type V3 = [number, number, number];
const BY_ID = new Map(RECIPES.map((r) => [r.id, r]));
const EVERYDAY = new Set(OVERLAYS.filter((o) => o.everyday).map((o) => o.id));
/** What a household owns one of: in its main room only (cityRoom). */
const ONE_PER_HOME = ["gramophone", "piano", "sewing-machine", "birdcage", "cuckoo-clock", "regulator", "zither", "sofa-plush"];

/** A point on a wall `u` along it and the way into the room from there, in the room's frame. */
function wallPoint(sh: Shell, w: Wall, u: number): { p: [number, number]; n: [number, number] } {
  if (w === "back") return { p: [u, 0], n: [0, 1] };
  if (w === "front") return { p: [sh.l - u, sh.d], n: [0, -1] };
  if (w === "left") return { p: [0, sh.d - u], n: [1, 0] };
  return { p: [sh.l, u], n: [-1, 0] };
}
const yawOf = (n: [number, number]) => Math.atan2(n[0], n[1]);
/** Each doorway's door as the house built it (kit/door.ts city doors): its leaf, shut, on the side it swings into, and
 *  only the architrave on the other. Brown oil paint grained like oak in the worker flats' rooms and every kitchen (the
 *  coats and the apron on one worker door in three), white lacquer in the petty and good flats, a frosted light in an
 *  office. */
function doors(sh: Shell, use: string, klass: Klass, seed: number): Place[] {
  const out: Place[] = [], near = (v: number, a: number[]) => a.reduce((b, x) => (Math.abs(x - v) < Math.abs(b - v) ? x : b));
  const brown = klass === "worker" || klass === "porter" || klass === "house" || klass === "workshop" || use === "kitchen";
  for (const [k, o] of (sh.openings ?? []).entries()) {
    if (o.kind !== "door" || !o.leaf || o.y > 0.05 || o.h < 1.9) continue;
    const W = o.w > 1.1 ? near(o.w, PAIR_W) : near(o.w, DOOR_W), H = W > 1.1 ? 2.7 : near(o.h, DOOR_H);
    const kind: CityDoor = klass === "office" || use === "office" ? "office" : brown ? (((seed >> 3) + k) % 3 === 0 && W < 1.1 ? "coats" : "brown") : "white";
    const id = cityDoorId(o.leaf === "here" ? kind : brown || kind === "office" ? "casing-brown" : "casing-white", W, H);
    if (!def(id)) continue;
    const { p, n } = wallPoint(sh, o.wall, o.u);
    out.push({ prop: id, at: [p[0] + n[0] * 0.05, 0, p[1] + n[1] * 0.05], yaw: yawOf(n) });
  }
  return out;
}

/** A city room's openings for its shell: its doors and windows, and each bare stretch of its box (no wall of the room
 *  behind it, tools/city/rooms.ts) as a hole the full height, so the furnisher stands nothing against air. */
const openingsOf = (r: RoomRec): Opening[] => [...(r.open as Opening[]), ...(r.bare ?? []).map((b) => ({ wall: b.wall, u: +((b.u0 + b.u1) / 2).toFixed(2), w: +(b.u1 - b.u0).toFixed(2), y: 0, h: r.h, kind: "hole" as const }))];

/** Move each added thing with a place rule to it; returns the places. */
function hint(places: Place[], adds: Add[], sh: Shell, east: Wall): Place[] {
  const out = places.slice(), stacked = new Map<string, number>();
  const placeOf = (item: string) => out.findIndex((q) => def(q.prop)?.items.includes(item));
  const propFor = (item: string, i: number) => (i >= 0 ? out[i].prop : undefined);
  const free = (w: Wall, u: number, wd: number) => !(sh.openings ?? []).some((o) => o.wall === w && Math.abs(o.u - u) < (o.w + wd) / 2 + 0.05);
  // a thing's box in the room (a quarter turn swaps its width and depth), and whether a spot for thing j hits anything
  // already placed or leaves the room: a crucifix never hangs over the cuckoo clock (the director, a review note)
  const boxOf = (prop: string, at: V3, yaw: number) => {
    const s = def(prop)!.size, q = Math.abs(Math.sin(yaw)) > 0.7, w = q ? s[2] : s[0], d = q ? s[0] : s[2];
    return { x0: at[0] - w / 2, x1: at[0] + w / 2, z0: at[2] - d / 2, z1: at[2] + d / 2, y0: at[1], y1: at[1] + s[1] };
  };
  const clash = (j: number, prop: string, at: V3, yaw: number) => {
    const a = boxOf(prop, at, yaw), e = 0.01;
    if (a.x0 < -e || a.x1 > sh.l + e || a.z0 < -e || a.z1 > sh.d + e || a.y1 > sh.h) return true;
    return out.some((q, k) => {
      if (k === j) return false;
      const b = boxOf(q.prop, q.at, q.yaw ?? 0);
      return a.x0 < b.x1 - e && b.x0 < a.x1 - e && a.z0 < b.z1 - e && b.z0 < a.z1 - e && a.y0 < b.y1 - e && b.y0 < a.y1 - e;
    });
  };
  for (const a of adds) {
    if (!a.hint) continue;
    // a thing for the table where the furnisher found none to put it on (a crowded kitchen given to beds): on a chest of
    // drawers, else the foot of a bed (the work came home in bundles, and lay
    // wherever there was room)
    if (a.hint === "on-table") {
      if (placeOf(a.item) >= 0) continue;
      const id = ids().find((x) => def(x)!.items.includes(a.item) && def(x)!.where !== "set"), host = out.find((q) => q.prop === "chest-drawers") ?? out.find((q) => /^bed-/.test(q.prop));
      if (!id || !host) continue;
      const hs = def(host.prop)!.size, bed = /^bed-/.test(host.prop), n: [number, number] = [Math.sin(host.yaw ?? 0), Math.cos(host.yaw ?? 0)];
      // a bed's foot is its front half; anything else, its top's middle
      const c: V3 = bed ? [host.at[0] + n[0] * hs[2] * 0.3, Math.min(hs[1], 0.62), host.at[2] + n[1] * hs[2] * 0.3] : [host.at[0], host.at[1] + hs[1], host.at[2]];
      out.push({ prop: id, at: c, yaw: host.yaw ?? 0 });
      continue;
    }
    // the furnisher may have found no free wall for it: the place rule puts it anyway
    let i = placeOf(a.item), fresh = false;
    if (i < 0) {
      const id = ids().find((x) => def(x)!.items.includes(a.item) && def(x)!.where !== "set");
      if (!id) continue;
      out.push({ prop: id, at: [0, 0, 0], yaw: 0 }); i = out.length - 1; fresh = true;
    }
    const prop = propFor(a.item, i)!;
    const size = def(prop)!.size;
    let at: V3 | null = null, yaw = 0;
    if (a.hint === "over-bed" || a.hint === "over-sofa") {
      const host = out.find((q) => (a.hint === "over-bed" ? /^bed-/.test(q.prop) : /sofa/.test(q.prop)));
      if (host) {
        const hs = def(host.prop)!.size, n: [number, number] = [Math.sin(host.yaw ?? 0), Math.cos(host.yaw ?? 0)], k = stacked.get(host.prop) ?? 0;
        stacked.set(host.prop, k + 1);
        // side by side along the wall over it, the first in the middle (a crucifix between the Sacred Hearts), each in
        // the first slot from its turn on that hits nothing already hung
        const back = hs[2] / 2 + 0.01, off = size[2] / 2 + 0.01, x: [number, number] = [n[1], -n[0]], y = Math.min(sh.h - size[1] - 0.1, Math.max(1.25, hs[1] + 0.3));
        const SLOTS = [0, -0.5, 0.5, -1.0, 1.0, -1.5, 1.5];
        for (let t = 0; t < SLOTS.length && !at; t++) {
          const dx = SLOTS[(k + t) % SLOTS.length], c: V3 = [host.at[0] - n[0] * (back - off) + x[0] * dx, y, host.at[2] - n[1] * (back - off) + x[1] * dx];
          if (!clash(i, prop, c, host.yaw ?? 0)) at = c;
        }
        yaw = host.yaw ?? 0;
      }
    } else if (a.hint === "by-door" || a.hint === "doorpost") {
      const d = (sh.openings ?? []).find((o) => o.kind === "door");
      if (d) {
        const L = d.wall === "back" || d.wall === "front" ? sh.l : sh.d, gap = a.hint === "doorpost" ? 0.07 : 0.3;
        const u = d.u + d.w / 2 + gap + size[0] / 2 <= L ? d.u + d.w / 2 + gap + size[0] / 2 : d.u - d.w / 2 - gap - size[0] / 2;
        const { p, n } = wallPoint(sh, d.wall, u);
        at = [p[0] + n[0] * (size[2] / 2 + 0.01), a.hint === "doorpost" ? 1.45 : 1.3, p[1] + n[1] * (size[2] / 2 + 0.01)];
        yaw = yawOf(n);
      }
    } else if (a.hint === "east-wall") {
      const L = east === "back" || east === "front" ? sh.l : sh.d;
      for (const f of [0.5, 0.3, 0.7, 0.15, 0.85, 0.4, 0.6]) {
        if (at || !free(east, f * L, size[0])) continue;
        const { p, n } = wallPoint(sh, east, f * L), c: V3 = [p[0] + n[0] * (size[2] / 2 + 0.01), 1.55, p[1] + n[1] * (size[2] / 2 + 0.01)];
        if (!clash(i, prop, c, yawOf(n))) { at = c; yaw = yawOf(n); }
      }
    } else if (a.hint === "on-sill") {
      const o = (sh.openings ?? []).find((q) => q.kind === "window");
      if (o) { const { p, n } = wallPoint(sh, o.wall, o.u); at = [p[0] + n[0] * 0.15, o.y, p[1] + n[1] * 0.15]; yaw = yawOf(n); }
    } else if (a.hint === "under-bed") {
      // at the bed's head on its open side, half under the frame's edge (a bed whose frame reaches the floor would hide it)
      const host = out.find((q) => /^bed-/.test(q.prop));
      if (host) {
        const hs = def(host.prop)!.size, n: [number, number] = [Math.sin(host.yaw ?? 0), Math.cos(host.yaw ?? 0)], x: [number, number] = [n[1], -n[0]];
        const side = [1, -1].find((s) => { const p = [host.at[0] + x[0] * s * (hs[0] / 2 + 0.2), host.at[2] + x[1] * s * (hs[0] / 2 + 0.2)]; return p[0] > 0.15 && p[0] < sh.l - 0.15 && p[1] > 0.15 && p[1] < sh.d - 0.15; }) ?? 1;
        at = [host.at[0] + x[0] * side * (hs[0] / 2 + 0.17) - n[0] * (hs[2] / 2 - 0.3), 0, host.at[2] + x[1] * side * (hs[0] / 2 + 0.17) - n[1] * (hs[2] / 2 - 0.3)];
        yaw = host.yaw ?? 0;
      }
    } else if (a.hint === "on-chest") {
      const host = out.find((q) => /vertiko|chest-drawers|dresser|sideboard|salon-vitrine/.test(q.prop));
      if (host) { const hs = def(host.prop)!.size; at = [host.at[0], host.at[1] + hs[1], host.at[2]]; yaw = host.yaw ?? 0; }
    }
    if (at) out[i] = { ...out[i], at, yaw };
    else if (fresh) out.splice(i, 1);
  }
  return out;
}

/** One furnished room of a house, or null when its use isn't furnished. */
export function cityRoom(h: HouseRec, r: RoomRec, o: { quarter?: string; lights?: boolean; when?: When } = {}): Room | null {
  const flat = h.flats.find((f) => f.level === r.lv && f.id === r.flat);
  const klass: Klass = flat?.klass ?? "house";
  // a shop room: its trade's fittings and stock (interiors/shops.ts, corner.ts) in the baked room, without their
  // shopfront (the world's facade is the front); a trade with no kit of its own stays a recipe room
  const trade = r.use === "shop" && flat?.who?.kind === "shop" && flat.who.what ? kitFor(flat.who.what) : undefined;
  if (trade && (PROFILES[trade] || CORNER_TRADES.includes(trade))) {
    const seed = roomSeed(h.key, r.lv, r.id) % 100000 / 100000;
    const shell: Shell = { l: r.l, d: r.d, h: r.h, t: 0.12, walls: "paper-stripe", floor: "boards", ceiling: "plaster", openings: openingsOf(r), seed: 1 };
    const props = (PROFILES[trade] ? shopProps(trade, shell, seed, o.lights !== false) : cornerProps(trade, shell, seed, o.lights !== false)).filter((p) => !p.prop.startsWith("shopfront"));
    return { id: `${h.key}-${r.lv}-${r.id}`, shell, at: r.at, yaw: r.yaw, props };
  }
  const rid = recipeFor(r.use as Use, klass, !!r.berl), recipe = rid ? BY_ID.get(rid) : undefined;
  if (!recipe) return null;
  const seed = roomSeed(h.key, r.lv, r.id), d = dialsFor({ klass, quarter: o.quarter, house: h.key, flat: `${h.key}:${r.lv}:${r.flat}` });
  const adds = dress(r.use as Use, klass, flat?.identity ?? null, d, seed);
  const shell: Shell = { l: r.l, d: r.d, h: r.h, t: 0.12, walls: "paper-stripe", floor: "boards", ceiling: "plaster", openings: openingsOf(r), seed };
  // the household's beds for who sleeps here, and a kitchenless flat's stove and pail (plan/life.ts)
  const count = flat?.who?.people ? lifeItems(flat.who.people, klass, r.sleep, !!r.cook, r.use === "kitchen") : {};
  // the household's everyday things and work (the pot, the tub, the work taken in) claim their place before the recipe's extras
  for (const a of adds) if (EVERYDAY.has(a.from)) count[a.item] = Math.max(count[a.item] ?? 0, 1);
  // the calendar (plan/sun.ts): a Christian household's tree in its main room from Christmas Eve to Epiphany (and,
  // ASSUMED, seven free-religious households in ten and the odd assimilated Jewish one's Weihnukka)
  const seasonal: string[] = [];
  if (o.when && christmas(o.when.day) && flat?.who?.kind === "household" && r.id === mainRoom(h, r, klass)) {
    const c = flat.identity?.confession, u = (seed % 1000) / 1000;
    if (c === "protestant" || c === "catholic" || c === "other-christian" || (c === "free-religious" && u < 0.7) || (c === "jewish" && u < 0.15)) seasonal.push("christmas-tree");
  }
  // what a household owns one of stands in its main room only, never in each of its rooms (the director on v7: "i dont want
  // to go to every room and see a cuckoo clock"): its clock, its gramophone, its piano, its bird; a good flat had a
  // clock in more than one room. A home worker's machine stays where she works (counted above).
  const main = flat?.who?.kind !== "household" || r.id === mainRoom(h, r, klass);
  const one = main ? [] : (klass === "bourgeois" ? ["gramophone", "piano", "birdcage", "cuckoo-clock"] : ONE_PER_HOME).filter((it) => !count[it]);
  const extra = [...adds.map((a) => a.item), ...Object.keys(count), ...seasonal].filter((it) => !one.includes(it));
  let props = furnish(recipe, shell, seed, { rates: takeRates(d), trisCap: trisCap(d), extra, count, drop: [...(flat?.who?.people ? dropFor(count) ?? [] : []), ...one], gallery: false, when: o.when, leaves: false, windowsUpTo: 2.0, clutter: d.clutter });
  props = hint(props, adds.filter((a) => !one.includes(a.item)), shell, r.east);
  props.push(...doors(shell, r.use, klass, seed));
  // out of season: the Hanukkah lamp back in the cabinet after its eight days, the washing in the court or the loft
  // once the stoves are out
  if (o.when) props = props.filter((p) => !(p.prop === "hanukkah-lamp" && !hanukkah(o.when!.day)) && !(p.prop.startsWith("washing") && r.use === "kitchen" && !heating(o.when!.day)));
  if (o.lights === false) props = props.map((p) => ({ ...p, lit: false }));
  else if (o.when) {
    // lit by the season and the hour (plan/hours.ts): the household's day says who is up in here and who cooks
    const w = o.when, slots = flat ? dayOf(h.key, flat, h.rooms.filter((x) => x.lv === r.lv && x.flat === r.flat), w.day) : null;
    const at = slots ? roomAt(slots, r.id, Math.floor(w.hour * 60)) : null, dark = darkIn(w, r.open.filter((x) => x.kind === "window").length);
    props = props.map((p) => (def(p.prop)?.glow ? { ...p, lit: burns(p.prop, w, dark, at) } : p));
  }
  return { id: `${h.key}-${r.lv}-${r.id}`, shell, at: r.at, yaw: r.yaw, props };
}

/** A house's rooms as a Set (ambient and exposure are the shot's: SetRooms takes rooms and props only). */
export function houseSet(h: HouseRec, o: { only?: (r: RoomRec) => boolean; quarter?: string; lights?: boolean; when?: When; id?: string } = {}): Set {
  const rooms = h.rooms.filter((r) => !o.only || o.only(r)).flatMap((r) => { const x = cityRoom(h, r, o); return x ? [x] : []; });
  return { id: o.id ?? `city-${h.key}`, title: h.key, use: "the walkable city", rooms, cams: [], ambient: { color: "#b9c2cc", brightness: 0 }, exposure: 0 };
}

/** What a room says about its household, for a caption: the recipe, the identity and each added thing, placed or not. */
export function explain(h: HouseRec, r: RoomRec, room: Room | null) {
  const flat = h.flats.find((f) => f.level === r.lv && f.id === r.flat);
  const klass: Klass = flat?.klass ?? "house", id = flat?.identity ?? null;
  const d = dialsFor({ klass, house: h.key, flat: `${h.key}:${r.lv}:${r.flat}` });
  const adds = dress(r.use as Use, klass, id, d, roomSeed(h.key, r.lv, r.id));
  const has = (item: string) => !!room?.props.some((p) => def(p.prop)?.items.includes(item));
  return { klass, recipe: recipeFor(r.use as Use, klass, !!r.berl), id, adds: adds.map((a) => ({ item: a.item, from: a.from, placed: has(a.item) })) };
}

/** A household's main room, where its tree stands and its visitors sit: the salon (else the dining room) in a good flat,
 *  the gute Stube in a petty one, else the Stube, else the kitchen. */
function mainRoom(h: HouseRec, r: RoomRec, klass: Klass): number | null {
  const mine = h.rooms.filter((x) => x.lv === r.lv && x.flat === r.flat), use = (u: string) => mine.find((x) => x.use === u)?.id ?? null;
  return klass === "bourgeois" ? use("salon") ?? use("dining") : use("gute-stube") ?? use("stube") ?? use("kitchen");
}
