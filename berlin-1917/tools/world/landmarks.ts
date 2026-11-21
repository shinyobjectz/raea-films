// The skyline: the towers, domes and spires the 1917 city is known by, as graybox solids in one mesh that City draws
// at every distance. A tile past its range isn't drawn at all, but a spire 3 km off is still the city's silhouette (an
// HLOD of the landmarks alone, a few thousand triangles).
//
// From map/1917/landmarks.geojson (the map lane's): each tall part's axis (`axis_from` says when it's assumed), its
// top above the street from its own records (`top_m`), the top of its masonry or balustrade where known (`body_m`),
// its kind (`part`) and the 1917 ground at the axis (`ground_m`). The heights are the records'. The layer has no
// widths, so every width below is ASSUMED, a graybox proportion named so a real figure can replace it. Landmarks with
// no recorded top are left out (the bake's log names them), and so is the gate, which is low and is its building.
//   used by bake.ts: skyline(...) -> assets/world/<slice>/skyline.glb
import { Builder } from "./glb";
import { P, N } from "./geom";
import { SURF } from "./facade";

/** Graybox widths, metres: all assumed (see the head). */
export const ASSUMED = {
  /** a square tower's side, under a spire or a pyramid cap */
  tower: 11,
  /** each of a pair of west towers, and the gap between them */
  twin: 8, twinGap: 3,
  /** a campanile's side */
  campanile: 7,
  /** Gontard's domed towers (the French and German Doms, 1780-85): the square base's side and its height as a share
   *  of the masonry's top; a hexastyle portico on each side not against the church (its depth, its columns' radius,
   *  the podium); the drum's radius, its ring of columns (count, radius out, a column's radius), the attic's share of
   *  what is left over the balustrade, the dome's rise over its radius, the lantern's radius; all assumed (no measured
   *  elevation read: the layer gives the top and, for the Französischer Dom, the balustrade at 40 m) */
  domedBase: 20, domedBaseShare: 0.55, portico: 4.5, porticoCol: 0.55, porticoPodium: 1.6,
  domedDrum: 8, drumCols: 24, drumColRing: 10.6, drumCol: 0.42, atticShare: 0.28, domeRise: 1.05, lanternR: 1.9,
  /** a dome's radius: this share of its building's short side, within these bounds */
  domeShare: 0.22, domeMin: 6, domeMax: 16,
  /** a column: the plinth's side, the shaft's radius */
  plinth: 14, column: 2.5,
  /** where the masonry stops when the records don't say, as a share of the top */
  body: { spire: 0.55, "twin spires": 0.6, tower: 0.8, campanile: 0.85, dome: 0.5, "domed tower": 0.57 } as Record<string, number>,
};

const lin = (hex: string) => [1, 3, 5].map((i) => {
  const s = parseInt(hex.slice(i, i + 2), 16) / 255;
  return Math.round((s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4) * 255);
});
// stone for the masonry, a dark metal for spires, caps and domes (graybox: no claim about any one roof's metal)
const STONE = [...lin("#a39886"), SURF.rustic], METAL = [...lin("#3e4044"), SURF.zinc];

type Pt = [number, number];
type Feature = { geometry: { type: string; coordinates: any }; properties: Record<string, any> };

/** The footprint's long-axis angle (map frame, radians) and its short side, from the narrowest box round it. */
function frameOf(ring: Pt[]): { rot: number; short: number } {
  let best = { area: Infinity, rot: 0, short: 0 };
  for (let i = 0; i + 1 < ring.length; i++) {
    const a = Math.atan2(ring[i + 1][1] - ring[i][1], ring[i + 1][0] - ring[i][0]), c = Math.cos(a), s = Math.sin(a);
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (const [x, y] of ring) { const u = x * c + y * s, v = -x * s + y * c; (u0 = Math.min(u0, u)), (u1 = Math.max(u1, u)), (v0 = Math.min(v0, v)), (v1 = Math.max(v1, v)); }
    const area = (u1 - u0) * (v1 - v0);
    if (area < best.area) best = { area, rot: u1 - u0 >= v1 - v0 ? a : a + Math.PI / 2, short: Math.min(u1 - u0, v1 - v0) };
  }
  return best;
}

class Solid {
  constructor(readonly F: Builder, readonly e: number, readonly n: number, readonly g: number, readonly rot: number) {}
  /** An n-sided frustum about (de, dn) off the axis, radius r0 at z0 to r1 at z1 (heights above the street), with
   *  a lid when `lid`. Faces outward; uv is the facade's frame (metres round, metres above the street). */
  ring(sides: number, r0: number, r1: number, z0: number, z1: number, col: number[], { phase = 0, de = 0, dn = 0, lid = true } = {}) {
    const cx = this.e + de, cy = this.n + dn, k = (r0 - r1) / Math.max(1e-6, z1 - z0);
    const at = (a: number, r: number, z: number) => P(cx + r * Math.cos(a), cy + r * Math.sin(a), this.g + z);
    for (let i = 0; i < sides; i++) {
      const a0 = this.rot + phase + (2 * Math.PI * i) / sides, a1 = a0 + (2 * Math.PI) / sides, m = (a0 + a1) / 2;
      const l = Math.hypot(1, k), arc0 = r0 * (a0 - this.rot), arc1 = r0 * (a1 - this.rot);
      this.F.quad(at(a0, r0, z0), at(a1, r0, z0), at(a1, r1, z1), at(a0, r1, z1), N(Math.cos(m) / l, Math.sin(m) / l, k / l), col, [[arc0, z0], [arc1, z0], [arc1, z1], [arc0, z1]]);
    }
    if (lid && r1 > 0.01) {
      const c0 = this.F.vertex(P(cx, cy, this.g + z1), N(0, 0, 1), col, [0, z1]);
      const rim = Array.from({ length: sides }, (_, i) => {
        const a = this.rot + phase + (2 * Math.PI * i) / sides;
        return this.F.vertex(at(a, r1, z1), N(0, 0, 1), col, [r1 * Math.cos(a), z1 + r1 * Math.sin(a)]);
      });
      for (let i = 0; i < sides; i++) this.F.tri(c0, rim[i], rim[(i + 1) % sides]);
    }
  }
  /** A square prism of side w (faces square to the building) from z0 to z1. */
  box(w: number, z0: number, z1: number, col: number[], at: { de?: number; dn?: number } = {}) {
    this.ring(4, w / Math.SQRT2, w / Math.SQRT2, z0, z1, col, { phase: Math.PI / 4, ...at });
  }
  /** A box in the building's frame (u along `rot`, v across it, metres from the axis), z0 to z1 over the street. */
  rect(u0: number, u1: number, v0: number, v1: number, z0: number, z1: number, col: number[], faces = "nsewt") {
    const c = Math.cos(this.rot), sn = Math.sin(this.rot);
    const at = (u: number, v: number, z: number) => P(this.e + u * c - v * sn, this.n + u * sn + v * c, this.g + z);
    const dir = (du: number, dv: number) => N(du * c - dv * sn, du * sn + dv * c, 0);
    const side = (a: [number, number], b: [number, number], n: number[], k: string) => faces.includes(k) &&
      this.F.quad(at(a[0], a[1], z0), at(b[0], b[1], z0), at(b[0], b[1], z1), at(a[0], a[1], z1), n, col, [[0, z0], [Math.hypot(b[0] - a[0], b[1] - a[1]), z0], [Math.hypot(b[0] - a[0], b[1] - a[1]), z1], [0, z1]]);
    side([u1, v0], [u1, v1], dir(1, 0), "e");
    side([u0, v1], [u0, v0], dir(-1, 0), "w");
    side([u1, v1], [u0, v1], dir(0, 1), "n");
    side([u0, v0], [u1, v0], dir(0, -1), "s");
    if (faces.includes("t")) this.F.quad(at(u0, v0, z1), at(u1, v0, z1), at(u1, v1, z1), at(u0, v1, z1), N(0, 0, 1), col, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
  }
  /** A pediment over a portico on the side `du` (+1 or -1 along u, or along v when `alongV`): a triangular prism from
   *  the wall at w0 out to w1, span s0..s1 across it, base z0, apex z0 + h. */
  pediment(w0: number, w1: number, s0: number, s1: number, z0: number, h: number, col: number[], alongV = false) {
    const c = Math.cos(this.rot), sn = Math.sin(this.rot);
    const at = (w: number, s: number, z: number) => { const [u, v] = alongV ? [s, w] : [w, s]; return P(this.e + u * c - v * sn, this.n + u * sn + v * c, this.g + z); };
    const out = Math.sign(w1 - w0), nrm = (du: number, dv: number, dz: number) => { const [a, b] = alongV ? [dv, du] : [du, dv]; const l = Math.hypot(a, b, dz) || 1; return N((a * c - b * sn) / l, (a * sn + b * c) / l, dz / l); };
    const m = (s0 + s1) / 2, half = (s1 - s0) / 2;
    // the front triangle (two triangles' worth as a quad with its apex doubled), the two roof slopes
    this.F.quad(at(w1, s0, z0), at(w1, s1, z0), at(w1, m, z0 + h), at(w1, m, z0 + h), nrm(out, 0, 0), col, [[s0, z0], [s1, z0], [m, z0 + h], [m, z0 + h]]);
    this.F.quad(at(w0, s0, z0), at(w1, s0, z0), at(w1, m, z0 + h), at(w0, m, z0 + h), nrm(0, -h, half), col, [[w0, z0], [w1, z0], [w1, z0 + h], [w0, z0 + h]]);
    this.F.quad(at(w1, s1, z0), at(w0, s1, z0), at(w0, m, z0 + h), at(w1, m, z0 + h), nrm(0, h, half), col, [[w1, z0], [w0, z0], [w0, z0 + h], [w1, z0 + h]]);
  }
  /** A column at (u, v) in the building's frame: an octagonal shaft, base to capital. */
  column(u: number, v: number, r: number, z0: number, z1: number, col: number[]) {
    const c = Math.cos(this.rot), sn = Math.sin(this.rot);
    this.ring(8, r, r * 0.88, z0, z1, col, { de: u * c - v * sn, dn: u * sn + v * c, lid: false });
  }
  /** A dome of radius r springing at z0, h high, in rings. */
  dome(r: number, z0: number, h: number, col: number[]) {
    const R = 6;
    for (let j = 0; j < R; j++) {
      const p0 = (Math.PI / 2) * (j / R), p1 = (Math.PI / 2) * ((j + 1) / R);
      this.ring(16, r * Math.cos(p0), j + 1 === R ? 0 : r * Math.cos(p1), z0 + h * Math.sin(p0), z0 + h * Math.sin(p1), col, { lid: false });
    }
  }
}

export type Skyline = { F: Builder; built: string[]; left: string[] };

/** Build every landmark in the layer whose axis is inside `bbox` (EPSG:25833) into one facade builder. */
export function skyline(landmarks: Feature[], buildings: Map<string, Pt[]>, bbox: number[]): Skyline {
  const F = new Builder(0, true), built: string[] = [], left: string[] = [];
  for (const f of landmarks) {
    const p = f.properties, [e, n] = f.geometry.coordinates as number[];
    if (e < bbox[0] || e > bbox[2] || n < bbox[1] || n > bbox[3]) continue;
    if (p.top_m == null) { left.push(`${p.name} (no recorded top)`); continue; }
    if (p.part === "gate") { left.push(`${p.name} (a gate: its building)`); continue; }
    const ring = buildings.get(p.building);
    const { rot, short } = ring ? frameOf(ring) : { rot: 0, short: 30 };
    const top: number = p.top_m, body: number = p.body_m ?? top * (ASSUMED.body[p.part] ?? 0.6);
    const s = new Solid(F, e, n, p.ground_m, rot);
    switch (p.part) {
      case "spire": {
        const w = ASSUMED.tower;
        s.box(w, 0, body, STONE);
        s.ring(8, (w / 2) * 0.92, 0, body, top, METAL, { phase: Math.PI / 8 });
        break;
      }
      case "twin spires":
      case "twin towers": {
        const w = ASSUMED.twin, off = (w + ASSUMED.twinGap) / 2, ax = -Math.sin(rot), ay = Math.cos(rot);
        for (const k of [-1, 1]) {
          const at = { de: ax * off * k, dn: ay * off * k };
          if (p.part === "twin towers") s.box(w, 0, top, STONE, at);
          else (s.box(w, 0, body, STONE, at), s.ring(8, (w / 2) * 0.92, 0, body, top, METAL, { phase: Math.PI / 8, ...at }));
        }
        break;
      }
      case "tower":
      case "campanile": {
        const w = p.part === "tower" ? ASSUMED.tower : ASSUMED.campanile;
        s.box(w, 0, body, STONE);
        s.ring(4, (w / Math.SQRT2) * 0.96, 0, body, top, METAL, { phase: Math.PI / 4 });
        break;
      }
      case "domed tower": {
        // Gontard's towers: a square base with a temple front on each free side, a drum ringed by a colonnade up to
        // the balustrade (the record's body_m), an attic, the dome, a lantern to the top (ASSUMED's proportions)
        const A = ASSUMED, w = A.domedBase / 2, h1 = body * A.domedBaseShare, r = A.domedDrum;
        s.rect(-w, w, -w, w, 0, h1, STONE);
        s.rect(-w - 0.6, w + 0.6, -w - 0.6, w + 0.6, h1 - 1.4, h1, STONE); // the cornice
        // the side against the church takes no portico: the one facing the footprint's centre, when that is off the axis
        const cx = ring ? ring.reduce((t, q) => t + q[0], 0) / ring.length - e : 0, cy = ring ? ring.reduce((t, q) => t + q[1], 0) / ring.length - n : 0;
        const cu = cx * Math.cos(rot) + cy * Math.sin(rot), cv = -cx * Math.sin(rot) + cy * Math.cos(rot), off = Math.hypot(cu, cv) > 6;
        const colTop = h1 - 3.2, ped = 3.2;
        for (const [side, alongV] of [[1, false], [-1, false], [1, true], [-1, true]] as [number, boolean][]) {
          const toward = alongV ? cv * side : cu * side;
          if (off && toward > Math.abs(alongV ? cu : cv)) continue; // against the church
          const w0 = side * w, w1 = side * (w + A.portico), sp = w * 0.8;
          // podium and steps, six columns, the entablature, the pediment
          if (alongV) s.rect(-sp - 1, sp + 1, Math.min(w0, w1 + side), Math.max(w0, w1 + side), 0, A.porticoPodium, STONE);
          else s.rect(Math.min(w0, w1 + side), Math.max(w0, w1 + side), -sp - 1, sp + 1, 0, A.porticoPodium, STONE);
          for (let k = 0; k < 6; k++) {
            const t = -sp + (2 * sp * k) / 5, at = side * (w + A.portico - A.porticoCol - 0.3);
            if (alongV) s.column(t, at, A.porticoCol, A.porticoPodium, colTop, STONE);
            else s.column(at, t, A.porticoCol, A.porticoPodium, colTop, STONE);
          }
          if (alongV) s.rect(-sp - 0.7, sp + 0.7, Math.min(w0, w1), Math.max(w0, w1), colTop, h1 - 0.2, STONE);
          else s.rect(Math.min(w0, w1), Math.max(w0, w1), -sp - 0.7, sp + 0.7, colTop, h1 - 0.2, STONE);
          s.pediment(w0, w1, -sp - 0.7, sp + 0.7, h1 - 0.2, ped, STONE, alongV);
        }
        // the drum and its colonnade, on a podium, under an entablature and the balustrade at body
        const ringR = A.drumColRing;
        s.ring(24, ringR + 0.8, ringR + 0.8, h1, h1 + 1.6, STONE);
        s.ring(24, r, r, h1 + 1.6, body, STONE, { lid: false });
        for (let k = 0; k < A.drumCols; k++) {
          const a = (2 * Math.PI * k) / A.drumCols;
          s.column(ringR * Math.cos(a), ringR * Math.sin(a), A.drumCol, h1 + 1.6, body - 2.6, STONE);
        }
        s.ring(24, ringR + 0.7, ringR + 0.7, body - 2.6, body - 1.0, STONE); // the entablature
        s.ring(24, ringR + 0.5, ringR + 0.5, body - 1.0, body, STONE); // the balustrade
        // the attic, the dome, the lantern with its own small dome, a figure stand-in to the record's top
        const avail = top - body, attic = avail * A.atticShare, dome = Math.min(r * A.domeRise, avail - attic - 8);
        const lantern = Math.max(3, avail - attic - dome - 4);
        s.ring(24, r * 0.98, r * 0.98, body, body + attic, STONE);
        s.ring(24, r + 0.4, r + 0.4, body + attic - 0.8, body + attic, STONE);
        s.dome(r, body + attic, dome, METAL);
        const lz = body + attic + dome * 0.96;
        s.ring(8, A.lanternR, A.lanternR, lz, lz + lantern * 0.65, STONE);
        s.dome(A.lanternR * 1.1, lz + lantern * 0.65, lantern * 0.35, METAL);
        s.ring(6, 0.5, 0.35, lz + lantern, top, METAL); // the figure (the record's top includes it)
        break;
      }
      case "dome": {
        const r = Math.max(ASSUMED.domeMin, Math.min(ASSUMED.domeMax, short * ASSUMED.domeShare)), avail = top - body;
        const lantern = Math.max(3, Math.min(14, avail * 0.15)), dome = Math.min(r * 1.1, avail - lantern), drum = Math.max(0, avail - lantern - dome);
        s.box(2 * r + 2, 0, body, STONE);
        if (drum > 0.1) s.ring(16, r, r, body, body + drum, STONE);
        s.dome(r, body + drum, dome, METAL);
        s.ring(8, r * 0.2, r * 0.1, top - lantern, top, METAL);
        break;
      }
      case "column": {
        const base = top * 0.14;
        s.box(ASSUMED.plinth, 0, base, STONE);
        s.ring(16, ASSUMED.column, ASSUMED.column * 0.85, base, top * 0.85, STONE);
        s.ring(8, ASSUMED.column * 0.5, 0, top * 0.85, top, METAL);
        break;
      }
      default:
        left.push(`${p.name} (part "${p.part}" has no rule)`);
        continue;
    }
    built.push(`${p.name} ${top} m`);
  }
  return { F, built, left };
}
