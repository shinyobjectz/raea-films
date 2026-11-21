// The trams' overhead line in winter 1917-18 (catalogue tram-wire): the contact wire at TRAM.wire (5.35 m) over each
// track, hung from span wires across the street, which end at iron masts on wide streets and at rosettes on the
// house fronts where the street is narrow. The GBS ran on roller collectors, so each track has one contact wire.
//   tram-rosette    the wall rosette: a cast-iron plate anchored in the facade, its eye bolt and a turnbuckle, the span
//                   wire leaving toward +z (ASSUMED shape: an eight-lobed plate 0.32 m across)
//   tram-mast       a span mast: a riveted iron tube in three tapering lengths on a fluted cast base, collars at the
//                   joints, a ball finial; the span wire's eye at 7.0 m (ASSUMED heights)
//   tram-mast-arm   the same mast with a bracket arm 2.8 m out over a track by the kerb, the contact wire hung from its
//                   end, for a line along one side of a street
//   tram-hanger     where a contact wire hangs from a span wire: two insulated bobbins, the ear clamping the wire
// wireBetween(a, b, sag) draws a span or a run of contact wire between two points, sagging at its middle, for the
// world lane to string between the pieces it places.
// Frames: the rosette on the wall's face at its centre (z 0, out to +z); masts on the pavement at their foot, the arm
// toward +x; the hanger at the contact wire's point, the wire along z, the span along x.
import { crossSection, type Solid } from "raea/3d";
import { ball, box, lathe, post, taper, union, type V3 } from "./geo";
import type { MatId } from "./mats";
import { rod } from "./outgeo";
import { prop } from "./prop";
import { TRAM } from "./tram";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };
const parts = (...p: [MatId, Solid | Solid[]][]): Part[] => p.map(([mat, s], i) => ({ mat, solid: Array.isArray(s) ? union(...s) : s, overlap: i > 0 }));

/** The span's eye on a mast and the wire's height over the rail. */
export const OVERHEAD = { spanEye: 7.0, wire: TRAM.wire, arm: 2.8 };

/** A wire from a to b sagging `sag` metres at its middle (a parabola in 8 straight runs), radius r. */
export function wireBetween(a: V3, b: V3, sag = 0.15, r = 0.0045): Solid {
  const pts: V3[] = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - 4 * sag * t * (1 - t), a[2] + (b[2] - a[2]) * t]); }
  return union(...pts.slice(1).map((p, i) => rod(pts[i], p, r)));
}

function rosette(): Part[] {
  const lobes: [number, number][] = [];
  for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2, r = 0.13 + 0.03 * Math.cos(a * 8); lobes.push([r * Math.cos(a), r * Math.sin(a)]); }
  // the lobed plate flat on the wall, a domed boss on it
  const plate = crossSection.polygon(lobes).extrude(0.02);
  const boss = lathe([[0, 0], [0.07, 0], [0.06, 0.025], [0.035, 0.05], [0, 0.06]], 0, 0, 0, 14).rotate(90, 0, 0).move(0, 0, 0.02);
  const iron = [plate, boss,rod([0, 0, 0.06], [0, 0, 0.16], 0.012), lathe([[0.015, -0.02], [0.03, -0.02], [0.03, 0.02], [0.015, 0.02]], 0, 0, 0, 10).rotate(0, 90, 0).move(0, 0, 0.19)];
  // the turnbuckle: a slotted body between two threaded rods, then the wire's thimble
  iron.push(rod([0, 0, 0.21], [0, 0, 0.3], 0.007), box(0.03, 0.018, 0.12, 0, -0.009, 0.36), rod([0, 0, 0.42], [0, 0, 0.5], 0.007));
  return parts(["iron", iron]);
}

/** A riveted tube mast in three lengths r0 to r1, H high, on a fluted base; `arm` adds the bracket arm. */
function mast(arm: boolean): Part[] {
  const H = 8.2, iron: Solid[] = [];
  iron.push(lathe([[0, 0], [0.24, 0], [0.24, 0.1], [0.2, 0.16], [0.18, 1.2], [0.2, 1.26], [0.14, 1.36], [0, 1.36]], 0, 0, 0, 16));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; iron.push(post(0.018, 0.95, Math.cos(a) * 0.185, 0.2, Math.sin(a) * 0.185)); } // the flutes
  const L = [[1.36, 3.9, 0.11, 0.1], [3.9, 6.2, 0.09, 0.08], [6.2, H, 0.07, 0.065]];
  for (const [y0, y1, r0, r1] of L) {
    iron.push(taper(r0, r1, y1 - y0, 0, y0, 0));
    iron.push(lathe([[0, -0.03], [r0 + 0.035, -0.03], [r0 + 0.035, 0.03], [0, 0.03]], 0, y0 + 0.03, 0, 16)); // the collar
  }
  iron.push(lathe([[0, 0], [0.08, 0], [0.08, 0.04], [0, 0.04]], 0, H, 0, 12), ball(0.075).move(0, H + 0.11, 0), post(0.015, 0.12, 0, H + 0.18, 0));
  // the span's eye band at 7 m, with an eye toward +x
  const E = OVERHEAD.spanEye;
  iron.push(lathe([[0.065, -0.04], [0.09, -0.04], [0.09, 0.04], [0.065, 0.04]], 0, E, 0, 14), rod([0.09, E, 0], [0.16, E, 0], 0.012));
  if (arm) {
    // the bracket: a tube out along +x at the wire's height plus 0.3, a tie rod from higher up the mast to its end,
    // scrollwork in the angle, the hanger's eye at the end
    const Y = OVERHEAD.wire + 0.35, A = OVERHEAD.arm;
    iron.push(rod([0, Y, 0], [A, Y, 0], 0.035), rod([0, Y + 1.3, 0], [A - 0.1, Y + 0.04, 0], 0.016));
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 1.6; iron.push(rod([0.35 + 0.2 * Math.cos(a), Y + 0.25 + 0.2 * Math.sin(a), 0], [0.35 + 0.2 * Math.cos(a + 0.5), Y + 0.25 + 0.2 * Math.sin(a + 0.5), 0], 0.008)); }
    iron.push(lathe([[0.035, -0.04], [0.055, -0.04], [0.055, 0.04], [0.035, 0.04]], 0, 0, 0, 10).rotate(0, 0, 90).move(0.25, Y, 0));
  }
  const parts0 = parts(["iron", iron]);
  if (arm) parts0.push(...hangerAt(OVERHEAD.arm - 0.05, OVERHEAD.wire));
  return parts0;
}

/** The hanger at (x, y): the span (or the arm) over it at +0.35, two bobbin insulators, the ear on the wire. */
function hangerAt(x: number, y: number): Part[] {
  const iron: Solid[] = [], ins: Solid[] = [];
  iron.push(rod([x, y + 0.35, 0], [x, y + 0.3, 0], 0.008));
  ins.push(lathe([[0, 0], [0.025, 0], [0.03, 0.03], [0.025, 0.06], [0, 0.06]], x, y + 0.22, 0, 12), lathe([[0, 0], [0.025, 0], [0.03, 0.03], [0.025, 0.06], [0, 0.06]], x, y + 0.11, 0, 12));
  iron.push(rod([x, y + 0.22, 0], [x, y + 0.17, 0], 0.007), rod([x, y + 0.11, 0], [x, y + 0.03, 0], 0.008));
  iron.push(box(0.03, 0.03, 0.22, x, y - 0.01, 0)); // the ear, gripping the wire along z
  return [{ mat: "iron", solid: union(...iron), overlap: true }, { mat: "rubber", solid: union(...ins), overlap: true }];
}

prop({ id: "tram-rosette", items: ["tram-wire"], size: [0.38, 0.38, 0.55], place: "wall", where: "set", tris: 2500, parts: rosette });
prop({ id: "tram-mast", items: ["tram-wire"], size: [0.5, 8.5, 0.5], place: "floor", where: "set", tris: 6000, parts: () => mast(false) });
prop({ id: "tram-mast-arm", items: ["tram-wire"], size: [3.4, 8.5, 0.5], place: "floor", where: "set", tris: 8000, parts: () => mast(true) });
prop({ id: "tram-hanger", items: ["tram-wire"], size: [0.08, 0.42, 0.25], place: "floor", where: "set", tris: 1200, parts: () => hangerAt(0, 0).map((p, i) => ({ ...p, overlap: i > 0 })) });

export const KIT_OVERHEAD = true;
