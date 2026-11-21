// A floor's stairs, flats and rooms. The stairs stand on the court walls, lit from the court, one to about 16 m of court
// front (the front building's, the side wing's at its corner, the rear building's), 2.8 m wide; a stair's landing
// opens on two flats, left and right of it (the Zweispänner), and its corridor, where the house has one, is split
// between them. Rooms no stair reaches get one of their own. Then each flat's rooms get their use by its class:
//   worker    the kitchen is the way in (the Wohnküche), then the Stube, any more a Kammer
//   petty     kitchen, the gute Stube (to the street where it can), the bedroom, a Kammer
//   bourgeois kitchen and maid's room to the court, the salon, dining room, gentleman's room to the street, the
//             bedrooms, the bath; the corridor
import { claim, type Cells, type Facade, facades, inFacade, rooms } from "./bands";
import { type Frame, type Grid, type Poly, STEP, type XY } from "./grid";

export type Use =
  | "stair" | "corridor" | "kitchen" | "stube" | "kammer" | "gute-stube" | "bedroom" | "salon" | "dining" | "study"
  | "children" | "maid" | "bath" | "pantry" | "office" | "shop" | "back-room" | "workroom" | "dark"
  // the ground floor, the cellar and the attic (interiors/plan/house.ts)
  | "hall" | "gateway" | "loge" | "stable" | "cellar-store" | "coal" | "kneipe" | "wash-kitchen" | "drying-loft" | "loft-store";
export type Klass = "worker" | "petty" | "bourgeois" | "office" | "shop" | "porter" | "workshop" | "house";

export interface Room extends Cells { use: Use; flat: number; area: number; lit: "street" | "court" | null; /** a court room grown into the dark corner behind it */ berliner?: boolean }
export interface Flat { id: number; stair: number; rooms: number[]; klass: Klass; front: boolean; area: number; entry: number }
export interface Floor { grid: Grid; facades: Facade[]; rooms: Room[]; flats: Flat[]; of: Int32Array; stairs: number[] }

/** the knobs that make one house unlike its neighbour; everything else follows from the footprint */
export interface Opts {
  seed: number;
  /** 0 (a rear court of the Luisenstadt) to 1 (the Tiergarten's villas): how good the district is; the floor and the
   *  street front add to it */
  district: number;
  /** storey: 0 ground, 1 the bel étage, ... */
  level: number;
  /** a shop and office street: front flats become offices with this chance */
  offices?: number;
}

/** Which rooms touch which, and along how many cell edges. */
export function adjacency(grid: Grid, of: Int32Array): Map<number, Map<number, number>> {
  const m = new Map<number, Map<number, number>>();
  for (let c = 0; c < of.length; c++) {
    const r = of[c];
    if (r < 0) continue;
    const i = c % grid.nx, j = Math.floor(c / grid.nx);
    for (const [dx, dz] of STEP) {
      const ii = i + dx, jj = j + dz;
      if (ii < 0 || jj < 0 || ii >= grid.nx || jj >= grid.nz) continue;
      const q = of[jj * grid.nx + ii];
      if (q >= 0 && q !== r) { const e = m.get(r) ?? m.set(r, new Map()).get(r)!; e.set(q, (e.get(q) ?? 0) + 1); }
    }
  }
  return m;
}

/** a seeded hash in [0, 1): the same house plans the same on every machine */
export const rnd = (seed: number) => (k: number) => {
  let h = (seed * 374761393 + k * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export function planFloor(grid: Grid, f: Frame, poly: Poly, o: Opts): Floor {
  const R = rnd(o.seed), g = grid.g, fs = facades(grid, f, poly), cl = claim(grid, fs);
  // the stairs' slices on the court fronts
  // A wing 20-30 m long had one stair, so the candidates go longest court front first and one is dropped within 13 m
  // of a stair already kept (a jog in a rear wing's outline is not a stair of its own).
  const reserve = new Map<number, [number, number][]>();
  const SW = 2.8, kept: XY[] = [];
  const cands: { F: Facade; a: number }[] = [];
  for (const F of fs) {
    if (F.kind !== "court" || F.len < 6) continue;
    const n = Math.max(1, Math.round(F.len / 16));
    for (let k = 0; k < n; k++) {
      const mid = ((k + 0.5) / n) * F.len + (R(F.id * 31 + k) - 0.5) * 2;
      cands.push({ F, a: Math.max(0, Math.min(F.len - SW, mid - SW / 2)) });
    }
  }
  cands.sort((x, y) => y.F.len - x.F.len);
  for (const { F, a } of cands) {
    const p: XY = [F.p[0] + F.t[0] * (a + SW / 2) - F.n[0] * 2.8, F.p[1] + F.t[1] * (a + SW / 2) - F.n[1] * 2.8];
    if (kept.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 13)) continue;
    kept.push(p);
    (reserve.get(F.id) ?? reserve.set(F.id, []).get(F.id)!).push([a, a + SW]);
  }
  const cut = rooms(grid, fs, cl, R, reserve);
  // a stair is two flights and its landing, 5.6 m deep at most: behind it, a dark room for the flats beside it
  for (const c of cut.list.slice()) {
    if (!c.stair) continue;
    const back = c.cells.filter((q) => cl.depth[q] > 5.6);
    if (!back.length) continue;
    c.cells = c.cells.filter((q) => cl.depth[q] <= 5.6);
    const id = cut.list.length;
    for (const q of back) cut.of[q] = id;
    cut.list.push({ id, facade: -1, cells: back, s0: 0, s1: 0 });
  }
  const list: Room[] = cut.list.map((c) => ({
    ...c, use: (c.stair ? "stair" : c.facade < 0 ? "corridor" : "kammer") as Use, flat: -1,
    area: c.cells.length * g * g, lit: c.facade >= 0 ? fs[c.facade].kind : null,
  }));
  const of = cut.of;
  // drop slivers into a neighbour: under 2 m² is a jog in the wall, not a room
  const adj = () => adjacency(grid, of);
  let A = adj();
  for (const r of list) {
    if (r.area >= 2 || r.use === "stair" || !r.cells.length) continue;
    const best = [...(A.get(r.id) ?? new Map()).entries()].filter(([q]) => list[q].use !== "stair").sort((x, y) => y[1] - x[1])[0];
    if (!best) continue;
    const into = list[best[0]];
    for (const c of r.cells) of[c] = into.id;
    into.cells.push(...r.cells); into.area += r.area; r.cells = []; r.area = 0;
  }
  A = adj();
  // the Berliner Zimmer: where the front building meets a wing, the corner behind the court rooms gets no window of
  // its own. Berlin built it as one big room lit by a single window in the corner onto the court, the flat's
  // through-room (the dining room of a good flat). A dark part over 8 m2 joins the court room it shares most wall
  // with, up to 28 m2 of it (the cells nearest that room first); the rest stays the corridor.
  for (const r of list) {
    if (r.facade >= 0 || r.use === "stair" || r.area < 8 || !r.cells.length) continue;
    const best = [...(A.get(r.id) ?? new Map()).entries()].filter(([q]) => list[q].lit === "court" && list[q].use !== "stair").sort((x, y) => y[1] - x[1])[0];
    if (!best || best[1] < 4) continue;
    const into = list[best[0]], mine = new Set(r.cells), got: number[] = [];
    let ring = into.cells.slice();
    const cap = Math.round(28 / (g * g)), keep = r.area > 28 + 4;
    while (ring.length && got.length < cap) {
      const next: number[] = [];
      for (const c of ring) for (const n of [c - 1, c + 1, c - grid.nx, c + grid.nx]) if (mine.has(n) && got.length < cap) { mine.delete(n); got.push(n); next.push(n); }
      ring = next;
    }
    if (!keep) for (const c of mine) got.push(c);
    for (const c of got) of[c] = into.id;
    into.cells.push(...got); into.area = into.cells.length * g * g; into.berliner = true;
    r.cells = r.cells.filter((c) => of[c] === r.id); r.area = r.cells.length * g * g;
  }
  // rooms no stair reaches within the house (a block with no court front, a cut-off wing): the core, else the
  // narrowest room, becomes its stair (a dark stair lit from above)
  let stairs = list.filter((r) => r.use === "stair" && r.cells.length).map((r) => r.id);
  const hops = new Int32Array(list.length).fill(-1), near = new Int32Array(list.length).fill(-1);
  const spread = () => {
    hops.fill(-1); near.fill(-1);
    const q: number[] = [];
    for (const s of stairs) { hops[s] = 0; near[s] = s; q.push(s); }
    while (q.length) {
      const r = q.shift()!;
      for (const n of (A.get(r) ?? new Map()).keys()) if (hops[n] < 0 && list[n].use !== "stair") { hops[n] = hops[r] + 1; near[n] = near[r]; q.push(n); }
    }
  };
  spread();
  for (;;) {
    const lost = list.find((r) => r.cells.length && hops[r.id] < 0);
    if (!lost) break;
    // its connected part, and in it the best stand-in
    const part: number[] = [], seen = new Set([lost.id]), q = [lost.id];
    while (q.length) { const r = q.shift()!; part.push(r); for (const n of (A.get(r) ?? new Map()).keys()) if (!seen.has(n)) { seen.add(n); q.push(n); } }
    const pick = part.map((id) => list[id]).sort((x, y) => (x.facade < 0 ? 0 : 1) - (y.facade < 0 ? 0 : 1) || x.area - y.area)[0];
    pick.use = "stair";
    stairs.push(pick.id);
    spread();
  }
  stairs = stairs.filter((s) => list[s].cells.length);
  // each stair's rooms, split by its axis into the flat to its left and the flat to its right
  const flats: Flat[] = [];
  const sOf = (F: Facade | undefined, c: number) => (F ? inFacade(grid, F, c)[0] : c % grid.nx);
  for (const s of stairs) {
    const S = list[s], F = S.facade >= 0 ? fs[S.facade] : undefined;
    const mid = S.cells.reduce((t, c) => t + sOf(F, c), 0) / S.cells.length;
    const sides: number[][] = [[], []];
    for (const r of list) {
      if (!r.cells.length || r.use === "stair" || near[r.id] !== s) continue;
      const left = r.cells.filter((c) => sOf(F, c) < mid);
      if (r.facade < 0 && left.length && left.length < r.cells.length) {
        // a corridor running past the stair: the wall between the two flats' halls stands on the stair's axis
        const right = r.cells.filter((c) => sOf(F, c) >= mid), id = list.length;
        list.push({ ...r, id, cells: right, area: right.length * g * g });
        for (const c of right) of[c] = id;
        r.cells = left; r.area = left.length * g * g;
        sides[0].push(r.id); sides[1].push(id);
        continue;
      }
      sides[left.length * 2 >= r.cells.length ? 0 : 1].push(r.id);
    }
    // a side under 20 m2 is no flat (the smallest let was a Stube and kitchen of some 30 m2): it joins the other side
    const sz = (side: number[]) => side.reduce((t, r) => t + list[r].area, 0);
    if (sides[0].length && sides[1].length && Math.min(sz(sides[0]), sz(sides[1])) < 20) { sides[0].push(...sides[1]); sides[1] = []; }
    for (const side of sides) {
      if (!side.length) continue;
      const area = side.reduce((t, r) => t + list[r].area, 0);
      flats.push({ id: flats.length, stair: s, rooms: side, klass: "worker", front: side.some((r) => list[r].lit === "street"), area, entry: side[0] });
    }
  }
  A = adj();
  // class, then uses
  for (const f of flats) {
    for (const r of f.rooms) list[r].flat = f.id;
    const n = f.rooms.filter((r) => list[r].facade >= 0).length;
    let v = o.district * 2 + (f.front ? 1 : -0.6) + (({ 0: -0.4, 1: 1.2, 2: 0.7, 3: 0.2 } as Record<number, number>)[o.level] ?? -0.2);
    v += Math.min(2, (n - 2) * 0.45) + (R(900 + f.id) - 0.5) * 0.8;
    f.klass = v > 2.4 ? "bourgeois" : v > 1.1 ? "petty" : "worker";
    if (o.offices && f.front && R(950 + f.id) < o.offices) f.klass = "office";
    // the way in: the room touching the stair, the court's first
    const touching = f.rooms.filter((r) => A.get(r)?.has(f.stair)).sort((x, y) => (list[x].lit === "court" ? 0 : 1) - (list[y].lit === "court" ? 0 : 1));
    f.entry = touching[0] ?? f.rooms[0];
    assignUses(f, list, A, R);
  }
  return { grid, facades: fs, rooms: list.filter((r) => r.cells.length), flats, of, stairs };
}

export function assignUses(f: Flat, list: Room[], A: Map<number, Map<number, number>>, R: (k: number) => number) {
  const rooms = f.rooms.map((r) => list[r]);
  const lit = rooms.filter((r) => r.facade >= 0), dark = rooms.filter((r) => r.facade < 0);
  const byArea = (a: Room, b: Room) => b.area - a.area;
  const court = lit.filter((r) => r.lit === "court").sort((a, b) => a.area - b.area), street = lit.filter((r) => r.lit === "street").sort(byArea);
  const take = (r: Room | undefined, u: Use) => { if (r && r.use === "kammer") r.use = u; return r; };
  for (const r of dark) r.use = r.area < 3 ? (A.get(r.id)?.has(f.entry) ? "pantry" : "dark") : "corridor";
  if (f.klass === "office") {
    for (const r of lit) r.use = "office";
    return;
  }
  const entry = list[f.entry];
  if (f.klass === "worker") {
    // the worker's kitchen is the room off the stair (a Stube and kitchen), unless that is a sliver
    const side = (r: Room) => { const w = r.s1 - r.s0; return w > 0 ? Math.min(w, r.area / w) : 0; };
    const ok = (r: Room) => !r.berliner && side(r) >= 1.8;
    take(entry.facade >= 0 && ok(entry) ? entry : court.find(ok) ?? lit.find(ok) ?? (entry.facade >= 0 && !entry.berliner ? entry : court.find((r) => !r.berliner) ?? lit[0]), "kitchen");
    take(lit.filter((r) => r.use === "kammer").sort(byArea)[0], "stube");
    return;
  }
  // the kitchen: a court room a range, a dresser and a table fit in, at least 2 m on its short side, nearest 12 m2 (a
  // thin slice of a court wing is a pantry, not a kitchen); else the old rule
  const side = (r: Room) => { const w = r.s1 - r.s0; return w > 0 ? Math.min(w, r.area / w) : 0; };
  const fit = (rs: Room[]) => rs.filter((r) => !r.berliner && r.use === "kammer" && side(r) >= 2 && r.area >= 7).sort((a, b) => Math.abs(a.area - 12) - Math.abs(b.area - 12))[0];
  const kitchen = take(fit(court) ?? fit(lit) ?? court.find((r) => r.area >= 6 && !r.berliner) ?? court[0] ?? lit.slice().sort((a, b) => a.area - b.area)[0], "kitchen");
  const berl = court.find((r) => r.berliner && r.use === "kammer");
  if (f.klass === "petty") {
    take(berl, "stube"); // the everyday room; the gute Stube is kept for Sundays on the street
    take((street.find((r) => r.use === "kammer") ?? lit.filter((r) => r.use === "kammer").sort(byArea)[0]), "gute-stube");
    take(lit.filter((r) => r.use === "kammer").sort(byArea)[0], "bedroom");
    return;
  }
  take(berl, "dining");
  // bourgeois: the maid sleeps by the kitchen, the bath beside it
  const nearKitchen = (r: Room) => (kitchen && A.get(kitchen.id)?.has(r.id) ? 0 : 1);
  take(court.filter((r) => r.use === "kammer").sort((a, b) => nearKitchen(a) - nearKitchen(b) || a.area - b.area)[0], "maid");
  const free = () => street.filter((r) => r.use === "kammer");
  take(free()[0], "salon");
  if (!berl) take(free()[0], "dining");
  take(free()[0], "study");
  take(lit.filter((r) => r.use === "kammer").sort(byArea)[0], "bedroom");
  const small = dark.find((r) => r.use === "pantry" || r.use === "dark") ?? court.find((r) => r.use === "kammer" && r.area < 9);
  if (small) small.use = "bath";
  for (const r of lit) if (r.use === "kammer") r.use = R(r.id * 7) < 0.6 ? "children" : "bedroom";
}
