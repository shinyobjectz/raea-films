// A whole house from cellar to roof: how you get in, how you get up, where people live and work. Every level is planned
// from the same footprint and seed (interiors/plan/flats.ts), so the walls stand on each other and the stairs run
// straight through, as a Mietskaserne's do; each level then gets its own uses and its own ways in.
//   the cellar     a slatted compartment for each flat, the coal, the house's corridors; on the street a Destille
//                  or a cellar shop down its own steps (Kellerhals), or a cellar flat
//   the ground     the hall or the carriage gateway (Durchfahrt) from the street door through the front building to
//                  the front stair and on into the court; the street rooms let as shops, each with the room behind it
//                  and the shopkeeper's flat behind that (live and work); the porter's flat by the gateway, its
//                  Loge looking onto it; workshops and stables in the court wings; each court stair its own door
//   the floors     the flats, the bel étage best; the workers' stairs carry a WC on each half landing
//   the attic      a maid's room for each good flat below, the drying loft, a wash kitchen, attic flats in the wings;
//                  a hatch over every stair's top flight, a ladder up to the roof and the sweep's boards
import { cellAt, type Facade, inFacade, outside, valAt } from "./bands";
import { adjacency, assignUses, type Flat, type Floor, type Klass, planFloor, rnd, type Room, type Use } from "./flats";
import { type Frame, type Grid, type Poly, type XY } from "./grid";

export type LevelKind = "cellar" | "ground" | "upper" | "attic";
export interface Level { n: number; kind: LevelKind; /** floor level, metres over the street */ y: number; h: number; floor: Floor }
export interface Stair {
  /** the stair's room id (the same on every level) */
  room: number;
  /** reached from the street through the hall or gateway (the front stair); the others from the court */
  front: boolean;
  /** WCs on its half landings, shared by the flats of two floors (the workers' stairs) */
  wc: boolean;
  /** what it serves on a typical floor */
  flats: Klass[];
}
export interface Entrance { kind: "street-door" | "gateway" | "shop-door" | "cellar-steps" | "court-door" | "roof-hatch"; level: number; room: number; facade: number }
export interface House { frame: Frame; grid: Grid; storeys: number; levels: Level[]; stairs: Stair[]; entrances: Entrance[] }
export interface HouseOpts {
  seed: number;
  /** full storeys over the street, the ground floor counted (the map's `storeys`) */
  storeys: number;
  /** 0-1, how good the district is (interiors/plan/flats.ts Opts) */
  district: number;
  /** of the street rooms on the ground floor, the share let as shops */
  shops: number;
  /** of the front flats on the floors, the share let as offices */
  offices: number;
  /** of the court flats on the ground floor, the share that are workshops */
  workshops: number;
  /** chance of a Destille (or cellar shop) under the street front */
  kneipe: number;
  /** from the directory, where it lists the house: its storefronts (street rooms let as shops), its households and its
   *  firms (offices, practices, banks): the flats are merged until they fit */
  shopRooms?: number; households?: number; firms?: number;
  /** the facade's doors (the world bake's tile.json, in the plan's frame): the house door decides where the hall or
   *  gateway runs, each shop door makes the room behind it a shop */
  doors?: { kind: "house" | "shop"; p: XY; w: number }[];
}

const HEIGHT = (n: number, top: number) => (n < 0 ? 2.4 : n === 0 ? 4.0 : n === top ? 2.8 : n === 1 ? 3.9 : Math.max(3.2, 3.6 - (n - 2) * 0.1));

export function planHouse(grid: Grid, f: Frame, poly: Poly, o: HouseOpts): House {
  const R = rnd(o.seed * 7 + 3), top = Math.max(1, o.storeys), levels: Level[] = [];
  let y = -HEIGHT(-1, top) + 1.0; // the cellar half sunk: its windows a metre over the pavement's foot
  const at = (n: number) => { let yy = 0; for (let k = 0; k < n; k++) yy += HEIGHT(k, top); return yy; };
  levels.push({ n: -1, kind: "cellar", y, h: HEIGHT(-1, top), floor: cellar(planFloor(grid, f, poly, { seed: o.seed, district: o.district, level: -1 }), R, o) });
  const typical = planFloor(grid, f, poly, { seed: o.seed, district: o.district, level: 2, offices: o.offices });
  const entrances: Entrance[] = [];
  const ground = groundFloor(planFloor(grid, f, poly, { seed: o.seed, district: o.district, level: 0 }), R, o, entrances);
  levels.push({ n: 0, kind: "ground", y: 0, h: HEIGHT(0, top), floor: ground.floor });
  for (let n = 1; n < top; n++) levels.push({ n, kind: "upper", y: at(n), h: HEIGHT(n, top), floor: n === 2 ? typical : planFloor(grid, f, poly, { seed: o.seed, district: o.district, level: n, offices: o.offices }) });
  const below = levels.filter((l) => l.kind === "upper").flatMap((l) => l.floor.flats);
  levels.push({ n: top, kind: "attic", y: at(top), h: HEIGHT(top, top), floor: attic(planFloor(grid, f, poly, { seed: o.seed, district: o.district, level: top }), below, R) });
  if (o.households !== undefined) fit(levels, o.households, o.firms ?? 0, R);
  // the stairs: the same rooms on every level
  const stairs: Stair[] = typical.stairs.map((s) => {
    const flats = typical.flats.filter((fl) => fl.stair === s).map((fl) => fl.klass);
    return { room: s, front: s === ground.front, wc: flats.length > 0 && flats.every((k) => k === "worker" || k === "petty"), flats };
  });
  for (const s of typical.stairs) {
    const r = typical.rooms.find((x) => x.id === s);
    if (r && r.facade >= 0 && typical.facades[r.facade].kind === "court") entrances.push({ kind: "court-door", level: 0, room: s, facade: r.facade });
    entrances.push({ kind: "roof-hatch", level: top, room: s, facade: -1 });
  }
  for (const r of levels[0].floor.rooms) if (r.use === "kneipe" && r.lit === "street") entrances.push({ kind: "cellar-steps", level: -1, room: r.id, facade: r.facade });
  return { frame: f, grid, storeys: top, levels, stairs, entrances };
}

/** The rooms as a lookup, the flats' rooms re-listed after cells moved. */
function tidy(fl: Floor) {
  fl.rooms = fl.rooms.filter((r) => r.cells.length);
  const live = new Set(fl.rooms.map((r) => r.id));
  for (const f of fl.flats) f.rooms = f.rooms.filter((r) => live.has(r));
  fl.flats = fl.flats.filter((f) => f.rooms.length);
}
const byId = (fl: Floor) => new Map(fl.rooms.map((r) => [r.id, r]));

/** Split a room whose cells fell into separate parts into one room per part. */
function splitParts(fl: Floor, r: Room) {
  const { grid, of } = fl, left = new Set(r.cells), parts: number[][] = [];
  while (left.size) {
    const s = left.values().next().value as number, part: number[] = [], st = [s];
    left.delete(s);
    while (st.length) {
      const c = st.pop()!; part.push(c);
      for (const n of [c - 1, c + 1, c - grid.nx, c + grid.nx]) if (left.has(n)) { left.delete(n); st.push(n); }
    }
    parts.push(part);
  }
  if (parts.length < 2) return;
  parts.sort((a, b) => b.length - a.length);
  r.cells = parts[0]; r.area = parts[0].length * grid.g * grid.g;
  let id = Math.max(...fl.rooms.map((x) => x.id)) + 1;
  for (const p of parts.slice(1)) {
    const nr: Room = { ...r, id, cells: p, area: p.length * grid.g * grid.g };
    for (const c of p) of[c] = id;
    fl.rooms.push(nr);
    fl.flats.find((x) => x.id === r.flat)?.rooms.push(id);
    id++;
  }
}

function groundFloor(fl: Floor, R: (k: number) => number, o: HouseOpts, entrances: Entrance[]): { floor: Floor; front: number } {
  const rooms = byId(fl);
  const street = fl.rooms.filter((r) => r.lit === "street" && r.use !== "stair");
  let front = -1;
  if (street.length) {
    // The passage from the street. Where a ray from the street front comes out in a court within 20 m, the house has a
    // gateway (Durchfahrt), 3 m wide, straight through to the court, put where it comes out soonest and nearest a
    // stair; else a 2.2 m hall from the street door to the nearest stair. The front stair is the one it leads to.
    const g = fl.grid, cx = (r: Room): XY => {
      let sx = 0, sz = 0;
      for (const c of r.cells) { sx += g.x0 + ((c % g.nx) + 0.5) * g.g; sz += g.z0 + (Math.floor(c / g.nx) + 0.5) * g.g; }
      return [sx / r.cells.length, sz / r.cells.length];
    };
    const stairsAt = fl.stairs.map((s) => ({ s, p: cx(rooms.get(s)!) }));
    const ray = (F: Facade, s: number) => {
      const x0 = F.p[0] + F.t[0] * s, z0 = F.p[1] + F.t[1] * s;
      let T = 0, seen = false;
      for (let d = 0.25; d < 30; d += 0.25) {
        const v = valAt(g, x0 - F.n[0] * d, z0 - F.n[1] * d);
        if (v === 0) { seen = true; T = d; } else if (seen) break;
      }
      const court = seen && outside(g, x0 - F.n[0] * (T + 0.25), z0 - F.n[1] * (T + 0.25), [-F.n[0], -F.n[1]]) === "court";
      return { T, court, end: [x0 - F.n[0] * T, z0 - F.n[1] * T] as XY };
    };
    const near = (p: XY) => stairsAt.map((x) => ({ ...x, d: Math.hypot(x.p[0] - p[0], x.p[1] - p[1]) })).sort((a, b) => a.d - b.d)[0];
    let best: { F: Facade; s: number; T: number; gate: boolean; score: number; stair: number } | null = null;
    // the facade's own house door, where it has one: the passage runs in from it
    const hd = o.doors?.find((d) => d.kind === "house");
    const onDoor = (F: Facade, s: number) => !!hd && Math.abs((hd.p[0] - F.p[0]) * F.t[0] + (hd.p[1] - F.p[1]) * F.t[1] - s) < 0.3 && Math.abs((hd.p[0] - F.p[0]) * F.n[0] + (hd.p[1] - F.p[1]) * F.n[1]) < 1.5;
    // (a door the plan finds on no street front: searched freely)
    for (const useDoor of hd ? [true, false] : [false]) for (const F of useDoor || !best ? fl.facades.filter((x) => x.kind === "street") : []) for (let s = 1.5; s <= F.len - 1.5; s += 0.5) {
      if (useDoor && !onDoor(F, s)) continue;
      const r = ray(F, s);
      const st = near(r.end);
      if (r.court && r.T <= 20) {
        const score = r.T + 0.5 * (st?.d ?? 0);
        if (!best || !best.gate || score < best.score) best = { F, s, T: r.T, gate: true, score, stair: st?.s ?? -1 };
      } else if (st && (!best || (!best.gate && st.d < best.score))) {
        // a hall: as far in as the stair stands
        const depth = Math.min(r.T, (st.p[0] - F.p[0]) * -F.n[0] + (st.p[1] - F.p[1]) * -F.n[1] + 1.0);
        best = { F, s, T: depth, gate: false, score: st.d, stair: st.s };
      }
    }
    if (best) {
      const { F } = best, w = best.gate ? 3.0 : 2.2, s0 = best.s - w / 2;
      // each column of the strip runs as deep as its own ray, so it stops at the court and doesn't cut on into the
      // rear building beyond it
      const Ts = new Map<number, number>();
      for (let s = s0; s < s0 + w; s += 0.25) Ts.set(Math.round(s * 4), best.gate ? Math.min(ray(F, s).T, best.T) : best.T);
      const take: number[] = [];
      for (let c = 0; c < fl.of.length; c++) {
        const r = rooms.get(fl.of[c]);
        if (!r || r.use === "stair") continue;
        const [a, d] = inFacade(g, F, c);
        if (a < s0 || a >= s0 + w || d < 0) continue;
        const T = Ts.get(Math.round(a * 4)) ?? best.T;
        if (d <= T + 0.25) take.push(c);
      }
      if (take.length) {
        const kind: Use = best.gate ? "gateway" : "hall";
        const id = Math.max(...fl.rooms.map((x) => x.id)) + 1, touched = new Set<number>();
        for (const c of take) { touched.add(fl.of[c]); fl.of[c] = id; }
        for (const t of touched) { const r = rooms.get(t)!; r.cells = r.cells.filter((c) => fl.of[c] === t); r.area = r.cells.length * g.g ** 2; }
        fl.rooms.push({ id, facade: F.id, cells: take, s0, s1: s0 + w, use: kind, flat: -1, area: take.length * g.g ** 2, lit: "street" });
        for (const t of touched) { const r = rooms.get(t)!; if (r.cells.length) splitParts(fl, r); }
        tidy(fl);
        entrances.push({ kind: best.gate ? "gateway" : "street-door", level: 0, room: id, facade: F.id });
        front = best.stair;
      }
    }
  }
  const A2 = adjacency(fl.grid, fl.of), rooms2 = byId(fl);
  const passage = fl.rooms.find((r) => r.use === "gateway" || r.use === "hall");
  // the shops: the directory's count of storefronts where it lists the house, the biggest street rooms first; else a
  // chance a room
  const shopSet = new Set<number>();
  const streetRooms = fl.rooms.filter((r) => r.lit === "street" && r.flat >= 0 && r.use !== "stair").sort((a, b) => b.area - a.area);
  const shopDoors = o.doors?.filter((d) => d.kind === "shop") ?? [];
  if (shopDoors.length) {
    // the room a metre behind each shop door
    const g = fl.grid;
    for (const d of shopDoors) {
      const F = fl.facades.filter((x) => x.kind === "street").map((x) => ({ x, dist: Math.abs((d.p[0] - x.p[0]) * x.n[0] + (d.p[1] - x.p[1]) * x.n[1]) })).sort((a, b) => a.dist - b.dist)[0]?.x;
      if (!F) continue;
      const c = cellAt(g, d.p[0] - F.n[0] * 1.2, d.p[1] - F.n[1] * 1.2), r = c >= 0 ? fl.of[c] : -1;
      const room = fl.rooms.find((x) => x.id === r);
      if (room && room.flat >= 0 && room.use !== "stair" && room.use !== "gateway" && room.use !== "hall") shopSet.add(r);
    }
  } else   if (o.shopRooms !== undefined) for (const r of streetRooms.slice(0, o.shopRooms)) shopSet.add(r.id);
  else for (const r of streetRooms) if (R(r.id * 13 + 1) < o.shops) shopSet.add(r.id);
  for (const f of fl.flats.slice()) {
    const rs = f.rooms.map((r) => rooms2.get(r)!).filter(Boolean);
    const shopRooms = rs.filter((r) => shopSet.has(r.id));
    if (shopRooms.length) {
      // a shop to the street, the room behind it its back room, the rest the shopkeeper's flat
      f.klass = "shop";
      for (const r of shopRooms) { r.use = "shop"; entrances.push({ kind: "shop-door", level: 0, room: r.id, facade: r.facade }); }
      for (const r of rs) if (r.use !== "shop" && r.use !== "stair" && shopRooms.some((s) => A2.get(s.id)?.has(r.id))) r.use = "back-room";
      relabelLiving(rs.filter((r) => !["shop", "back-room"].includes(r.use)), "worker");
      continue;
    }
    if (passage && rs.some((r) => A2.get(passage.id)?.has(r.id)) && !fl.flats.some((x) => x.klass === "porter")) {
      // the porter: the room on the gateway is his Loge, with a Stube and a kitchen behind it; the rest of the
      // stair's side is a flat of its own (the Parterre flat)
      f.klass = "porter";
      const loge = rs.find((r) => A2.get(passage.id)?.has(r.id))!;
      loge.use = "loge";
      const mine = new Set([loge.id]), q = [loge.id];
      let lit = 0;
      while (q.length && lit < 2) {
        const r = q.shift()!;
        for (const n of (A2.get(r) ?? new Map()).keys()) {
          const room = rooms2.get(n);
          if (!room || mine.has(n) || !f.rooms.includes(n) || lit >= 2) continue;
          mine.add(n); q.push(n); if (room.facade >= 0) lit++;
        }
      }
      const rest = rs.filter((r) => !mine.has(r.id));
      f.rooms = [...mine]; f.area = f.rooms.reduce((t, id) => t + (rooms2.get(id)?.area ?? 0), 0);
      relabelLiving(rs.filter((r) => mine.has(r.id) && r !== loge), "worker");
      if (rest.some((r) => r.facade >= 0)) {
        const id = Math.max(...fl.flats.map((x) => x.id)) + 1;
        for (const r of rest) r.flat = id;
        fl.flats.push({ id, stair: f.stair, rooms: rest.map((r) => r.id), klass: "petty", front: rest.some((r) => r.lit === "street"), area: rest.reduce((t, r) => t + r.area, 0), entry: rest[0].id });
        relabelLiving(rest, "petty");
      }
      continue;
    }
    if (!f.front && R(f.id * 17 + 5) < o.workshops) {
      f.klass = "workshop";
      for (const r of rs) if (r.facade >= 0) r.use = passage && A2.get(passage.id)?.has(r.id) && R(r.id) < 0.5 ? "stable" : "workroom";
    }
  }
  return { floor: fl, front };
}

/** Give a set of rooms a kitchen, a Stube and Kammern again (after the shop or the Loge took some). */
function relabelLiving(rs: Room[], _k: Klass) {
  const lit = rs.filter((r) => r.facade >= 0).sort((a, b) => a.area - b.area);
  for (const r of rs) if (r.facade < 0) r.use = r.area < 3 ? "pantry" : "corridor";
  if (!lit.length) return;
  lit[0].use = "kitchen";
  if (lit.length > 1) lit[lit.length - 1].use = "stube";
  for (const r of lit.slice(1, -1)) r.use = "kammer";
}

function cellar(fl: Floor, R: (k: number) => number, o: HouseOpts): Floor {
  let bar = false, coal = 0;
  for (const r of fl.rooms) {
    if (r.use === "stair") continue;
    if (r.facade < 0) { r.use = "corridor"; continue; }
    if (r.lit === "street" && !bar && R(r.id * 3 + 11) < o.kneipe) { r.use = "kneipe"; bar = true; continue; }
    r.use = coal++ === 0 ? "coal" : R(r.id * 5) < 0.12 && r.lit === "court" ? "wash-kitchen" : "cellar-store";
  }
  for (const f of fl.flats) f.klass = "house";
  return fl;
}

function attic(fl: Floor, below: Flat[], R: (k: number) => number): Floor {
  // one maid's room for each good flat below; the rest of the street side storerooms, the court side drying loft;
  // in the wings now and then an attic flat
  let maids = below.filter((f) => f.klass === "bourgeois").length, wash = false;
  for (const f of fl.flats) {
    const rs = f.rooms.map((id) => fl.rooms.find((r) => r.id === id)!).filter(Boolean);
    if (!f.front && R(f.id * 29 + 2) < 0.35) { f.klass = "worker"; relabelLiving(rs, "worker"); continue; }
    f.klass = "house";
    for (const r of rs) {
      if (r.facade < 0) { r.use = "loft-store"; continue; }
      if (r.lit === "street" && maids > 0) { r.use = "maid"; maids--; continue; }
      if (!wash && r.lit === "court") { r.use = "wash-kitchen"; wash = true; continue; }
      r.use = r.lit === "court" ? "drying-loft" : "loft-store";
    }
  }
  return fl;
}

/** Two flats on one stair and floor made one, a flat a landing to itself: where the directory lists fewer households
 *  than the plan has flats, the good flats took both sides of the stair. The bigger flat moves up a class. */
function merge(fl: Floor, a: Flat, b: Flat, R: (k: number) => number) {
  const rooms = byId(fl);
  a.rooms.push(...b.rooms); a.area += b.area; a.front ||= b.front;
  fl.flats = fl.flats.filter((x) => x !== b);
  for (const id of a.rooms) { const r = rooms.get(id); if (!r) continue; r.flat = a.id; r.use = r.facade < 0 ? "corridor" : "kammer"; }
  a.klass = a.klass === "worker" ? "petty" : "bourgeois";
  const list: Room[] = []; for (const r of fl.rooms) list[r.id] = r;
  assignUses(a, list, adjacency(fl.grid, fl.of), R);
}

/** Merge flats, the bel étage first, until the house's flats fit `want` households (and `firms` offices). */
function fit(levels: Level[], want: number, firms: number, R: (k: number) => number) {
  const lettable = (k: Klass) => k === "worker" || k === "petty" || k === "bourgeois";
  const slots = () => levels.reduce((t, L) => t + L.floor.flats.filter((f) => lettable(f.klass) || f.klass === "office").length, 0);
  // only the front building's best floors: a wing's small flats stayed small, and the directory missed many of their
  // households (ASSUMED: lodgers and short tenancies went unlisted), so they aren't merged to fit its count
  const order = levels.filter((L) => L.kind === "upper" && L.n <= 2).sort((x, y) => x.n - y.n);
  let changed = true;
  while (slots() > want + firms && changed) {
    changed = false;
    for (const L of order) {
      const byStair = new Map<number, Flat[]>();
      for (const f of L.floor.flats) if (lettable(f.klass)) (byStair.get(f.stair) ?? byStair.set(f.stair, []).get(f.stair)!).push(f);
      const pair = [...byStair.values()].filter((v) => v.length >= 2 && v.some((f) => f.front))[0];
      if (!pair) continue;
      pair.sort((x, y) => y.area - x.area);
      merge(L.floor, pair[0], pair[1], R);
      changed = true;
      if (slots() <= want + firms) return;
    }
  }
}
