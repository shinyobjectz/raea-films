// FLOOR3's built geometry besides the placed models: the wall pieces, the cove base along them, the casings round the
// openings and the corridor's doors, the columns, and the ceiling and wall fittings. Engine-free, so the renderer
// (world.tsx) draws exactly what the clip check (tools/clips.ts, blender/clips.py) tests.
import { DOOR_H, FIXTURES, H, NOTICE, PROPS, ROOMS, WALLS, wallAxis, wallSolids, type Prop, type Solid, type V3 } from "./level";

export interface Box { name: string; min: V3; max: V3 }
export const WALL_PIECES: Solid[] = wallSolids();

/** a placed thing's local point (x, y, z in its own frame, turned by its yaw) in the world */
export function toWorld(p: { at: V3; yaw: number }, lx: number, ly: number, lz: number): V3 {
  const c = Math.cos(p.yaw), s = Math.sin(p.yaw);
  return [p.at[0] + lx * c + lz * s, p.at[1] + ly, p.at[2] - lx * s + lz * c];
}

/** the painted casing round a closed corridor door. hallway/door's leaf has its origin at its bottom left, is 42 mm
 * thick and centred on the wall's face; the casing stands 34 mm proud, a few millimetres clear of the leaf all round */
export function doorCasing(p: Prop): Box[] {
  const box = (k: string, x0: number, x1: number, y0: number, y1: number): Box => {
    const a = toWorld(p, x0, 0, 0), b = toWorld(p, x1, 0, 0.034);
    return { name: `${p.name}-${k}`, min: [Math.min(a[0], b[0]), y0, Math.min(a[2], b[2])], max: [Math.max(a[0], b[0]), y1, Math.max(a[2], b[2])] };
  };
  return [box("case-a", -0.072, 0.0, 0, 2.08), box("case-b", 0.95, 1.022, 0, 2.08), box("case-top", -0.072, 1.022, 2.08, 2.152)];
}

/** a wing column: its shaft standing on its plinth rather than passing through it */
export function columnBoxes(p: Prop): Box[] {
  const [x, , z] = p.at;
  return [
    { name: p.name, min: [x - 0.25, 0.1, z - 0.25], max: [x + 0.25, H, z + 0.25] },
    { name: `${p.name}-base`, min: [x - 0.262, 0, z - 0.262], max: [x + 0.262, 0.1, z + 0.262] },
  ];
}

/** the casings round the walls' door openings. Each runs LINER into the opening, so it covers the wall's end face
 * instead of sharing its plane; the copy room's east jamb has none (the wall the player pulls stands against it), and the
 * stair door brings its own frame */
export const CASINGS: Box[] = WALLS.flatMap((w) => w.openings.filter((o) => o.h <= DOOR_H + 0.01 && o.name !== "stair-door").flatMap((o) => {
  const ax = wallAxis(w) === "x";
  const c = 0.05, t = (ax ? w.z1 - w.z0 : w.x1 - w.x0) + 0.03, LINER = 0.015;
  const lb = o.name === "copy-door" ? 0 : LINER;
  const mid = ax ? (w.z0 + w.z1) / 2 : (w.x0 + w.x1) / 2;
  const piece = (a0: number, a1: number, y0: number, y1: number, k: string): Box =>
    ({ name: `case-${o.name}-${k}`, min: ax ? [a0, y0, mid - t / 2] : [mid - t / 2, y0, a0], max: ax ? [a1, y1, mid + t / 2] : [mid + t / 2, y1, a1] });
  return [piece(o.a - c, o.a + LINER, 0, o.h - LINER, "a"), piece(o.b - lb, o.b + c, 0, o.h - LINER, "b"), piece(o.a - c, o.b + c, o.h - LINER, o.h + c, "top")];
}));

/** the rubber cove base along every wall that reaches the floor, 12 mm proud and 100 mm high, stopping half a
 * millimetre short of any casing standing on that wall (it never runs into one) */
export const COVES: Box[] = (() => {
  const PAD = 0.012, GAP = 0.0005;
  // a corridor door stops it across its whole casing (leaf and both jambs), not jamb by jamb
  const doorSpan = (p: Prop): Box => { const c = doorCasing(p); return { name: p.name, min: [Math.min(...c.map((b) => b.min[0])), 0, Math.min(...c.map((b) => b.min[2]))], max: [Math.max(...c.map((b) => b.max[0])), 0.1, Math.max(...c.map((b) => b.max[2]))] }; };
  // the stair door's frame (1.28 m wide, 246 mm deep from its back) stands on the lobby floor in front of its wall
  const stair = PROPS.filter((p) => p.name === "stair-door").map((p): Box => {
    const a = toWorld(p, -0.64, 0, 0), b = toWorld(p, 0.64, 0, 0.246);
    return { name: p.name, min: [Math.min(a[0], b[0]), 0, Math.min(a[2], b[2])], max: [Math.max(a[0], b[0]), 0.1, Math.max(a[2], b[2])] };
  });
  const stops: Box[] = [...CASINGS.filter((b) => b.min[1] < 0.1), ...PROPS.filter((p) => p.file === "hallway/door").map(doorSpan), ...stair];
  return WALL_PIECES.filter((w) => w.y0 === 0).flatMap((w) => {
    const ax = w.x1 - w.x0 >= w.z1 - w.z0;
    const lo = ax ? w.z0 - PAD : w.x0 - PAD, hi = ax ? w.z1 + PAD : w.x1 + PAD;   // the cove's extent across the wall
    let spans: [number, number][] = [[ax ? w.x0 : w.z0, ax ? w.x1 : w.z1]];
    for (const b of stops) {
      const b0 = ax ? b.min[2] : b.min[0], b1 = ax ? b.max[2] : b.max[0];
      if (b1 <= lo || b0 >= hi) continue;                                         // not on this wall
      const c0 = (ax ? b.min[0] : b.min[2]) - GAP, c1 = (ax ? b.max[0] : b.max[2]) + GAP;
      spans = spans.flatMap(([a, e]): [number, number][] => (c1 <= a || c0 >= e ? [[a, e]] : ([[a, c0], [c1, e]] as [number, number][]).filter(([u, v]) => v - u > 0.005)));
    }
    return spans.map(([a, e], i): Box => (ax
      ? { name: `base-${w.name}-${i}`, min: [a, 0, w.z0 - PAD], max: [e, 0.1, w.z1 + PAD] }
      : { name: `base-${w.name}-${i}`, min: [w.x0 - PAD, 0, a], max: [w.x1 + PAD, 0.1, e] }));
  });
})();

/** the facilities notice, an A4 sheet pinned over the corridor board's other papers, and its two pins' heads (their
 * points pass through it into the cork, out of sight) */
export const NOTICE_SHEET: Box = { name: "notice", min: [NOTICE[0] - 0.105, NOTICE[1] - 0.1485, NOTICE[2] + 0.0013], max: [NOTICE[0] + 0.105, NOTICE[1] + 0.1485, NOTICE[2] + 0.0027] };
export const NOTICE_PINS = [-0.085, 0.085].map((dx, i) => ({ name: `notice-pin-${i}`, at: [NOTICE[0] + dx, NOTICE[1] + 0.128, NOTICE_SHEET.max[2] + 0.0005 + 0.0035] as V3, r: 0.0045, hh: 0.0035 }));

// ---- fittings -----------------------------------------------------------------------------------------------------------
export type Fit = { file: string; at: V3; yaw?: number };
/** ceiling fittings placed in grid cells clear of the lights: diffusers, sprinklers, smoke detectors */
export const FITS: Fit[] = [];
{
  const nearLight = (x: number, z: number, d: number) => FIXTURES.some((f) => Math.abs(f.x - x) < d && Math.abs(f.z - z) < d);
  for (const [x, z] of [[4.2, 5.0], [7.8, 5.0], [10.8, 8.8], [1.2, 1.3]] as [number, number][]) FITS.push({ file: "fit/diffuser", at: [x, H, z] });
  for (const [x, z] of [[3.6, 4.9], [-0.6, -1.3], [12.6, -1.3], [21.6, -1.3]] as [number, number][]) if (!nearLight(x, z, 0.5)) FITS.push({ file: "fit/diffuser", at: [x, H, z] });
  FITS.push({ file: "fit/diffuser", at: [36.0, H, -4.1] }, { file: "fit/diffuser", at: [43.2, H, 1.1] }, { file: "fit/diffuser", at: [51.0, H, -0.1] });
  // sprinkler heads on a 3 m grid, clear of the lights and of the diffusers' faces
  const nearDiffuser = (x: number, z: number) => FITS.some((f) => Math.abs(f.at[0] - x) < 0.5 && Math.abs(f.at[2] - z) < 0.5);
  for (const r of ROOMS) for (let x = r.x0 + 1.5; x < r.x1 - 0.5; x += 3.0) for (let z = r.z0 + 1.1; z < r.z1 - 0.3; z += 3.0) if (!nearLight(x, z, 0.75) && !nearDiffuser(x, z)) FITS.push({ file: "fit/sprinkler", at: [x, H, z] });
  for (const [x, z] of [[6.0, 5.0], [16.8, -1.3], [18.6, -3.4], [39.6, 1.1], [51.0, -2.8]] as [number, number][]) FITS.push({ file: "fit/smoke", at: [x, H, z] });
}
/** wall fittings: outlets by the desks, switches by the doors, a thermostat. Each model's back is its origin and its
 * face its +z, so each sits half a millimetre off its wall's face, turned to face the room */
const FLUSH = 0.0005;
export const WALL_FITS: Fit[] = [
  { file: "fit/outlet", at: [FLUSH, 0.32, 6.6], yaw: Math.PI / 2 }, { file: "fit/outlet", at: [12 - FLUSH, 0.32, 7.0], yaw: -Math.PI / 2 },
  { file: "fit/switch", at: [9.75, 1.2, FLUSH], yaw: 0 }, { file: "fit/thermostat", at: [7.6, 1.5, FLUSH], yaw: 0 },
  { file: "fit/switch", at: [17.65, 1.2, -2.6 - FLUSH], yaw: Math.PI }, { file: "fit/outlet", at: [21 - FLUSH, 0.32, -6.0], yaw: -Math.PI / 2 },
  { file: "fit/switch", at: [30.2 + FLUSH, 1.2, -2.75], yaw: Math.PI / 2 }, { file: "fit/outlet", at: [48.2 + FLUSH, 0.32, -2.8], yaw: Math.PI / 2 },
  { file: "fit/switch", at: [54 - FLUSH, 1.2, -2.3], yaw: -Math.PI / 2 }, { file: "fit/outlet", at: [24.6, 0.32, -0.2 - FLUSH], yaw: Math.PI },
];
