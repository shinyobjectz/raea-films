// The war's small livestock, 1917-18 (catalogue rabbit-hutch: Kaninchenställe, Hühnerverschläge). As the rations
// shrank, those who could kept goats, rabbits and hens on balconies and in courts and cellars (Keith Allen, "Food and
// the German Home Front: Evidence from Berlin", 2003, as Everyday Lives in War cites it); the AOK sick fund's housing
// survey had already photographed hens penned in a Kreuzberg cellar flat (Lausitzer Straße 41, 1909; public domain).
//   rabbit-hutch         four boarded hutches in two tiers on legs, the usual city way of keeping rabbits ("placed one
//                        on top of another until as many as three tiers", "one whole side ... covered with wire mesh":
//                        C. C. Sherlock, Care and Management of Rabbits, 1920, public domain): each a lath door of
//                        square mesh on two strap hinges with a turn button, a board under it to hold the litter,
//                        straw inside, a roof of boards under tarred felt falling to the back
//   rabbit-hutch-single  one wider hutch on two blocks, for a balcony or a cellar
//   hen-coop             the pen of the 1909 photograph: a frame of square laths on legs, hexagonal netting on its front
//                        and ends, a board back and a board roof falling to the front, a netted door, a perch, straw
//   poultry-crate        the woven-rod crate of Müllerstraße 32b's court (AOK survey, 1908): upright rods bound by
//                        woven bands, a rim, a rod lid, kept against a wall for a few hens
// ASSUMED: the sizes (a hutch 0.8 x 0.5 x 0.6 m; the pen 1.2 x 0.6 m; the crate 1.1 x 0.55 x 0.62 m, read off the
// photograph against its door), the mesh's pitch (square 25 mm; the netting drawn as wires at plus and minus 60
// degrees every 40 mm, which reads as hexagons at a few metres), the felt. No animal is part of them.
// Frame: on the ground at y 0, the back at -z against a wall, the doors toward +z, centred on x.
import type { Solid } from "raea/3d";
import { side } from "./forms";
import { box, hash, lump, union } from "./geo";
import { bar } from "./porter";
import { type Part, prop } from "./prop";

const T = 0.02; // a board's thickness

/** A square wire mesh w x h in the x-y plane, centred at the origin, wires every pitch. */
function squareMesh(w: number, h: number, pitch: number, t = 0.0022): Solid[] {
  const s: Solid[] = [];
  for (let x = -w / 2 + pitch / 2; x < w / 2; x += pitch) s.push(box(t, h, t, x, -h / 2, 0));
  // the cross wires lie just in front of the uprights, not through them: a union of crossing wires cuts every crossing
  for (let y = -h / 2 + pitch / 2; y < h / 2; y += pitch) s.push(box(w, t, t, 0, y - t / 2, 1.1 * t));
  return s;
}

/** Hexagonal netting as it reads at a distance: two sets of wires at plus and minus 60 degrees, every pitch, clipped
 *  to a w x h rectangle in the x-y plane centred at the origin. */
function netting(w: number, h: number, pitch: number, t = 0.0018): Solid[] {
  const s: Solid[] = [];
  for (const [th, zo] of [[60, 0], [-60, 1.1 * t]]) {
    const a = (th * Math.PI) / 180, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, R = Math.hypot(w, h) / 2;
    for (let o = -R; o <= R; o += pitch) {
      let t0 = -Infinity, t1 = Infinity;
      for (const [p, dd, lo, hi] of [[o * nx, dx, -w / 2, w / 2], [o * ny, dy, -h / 2, h / 2]]) {
        const ta = (lo - p) / dd, tb = (hi - p) / dd;
        t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb));
      }
      if (t1 - t0 < 0.01) continue;
      const tm = (t0 + t1) / 2;
      s.push(box(t1 - t0, t, t, 0, -t / 2, 0).rotate(0, 0, th).move(o * nx + tm * dx, o * ny + tm * dy, zo));
    }
  }
  return s;
}

/** A lath frame w x h (outer) in the x-y plane, its bottom-left at the origin, laths l wide and d deep. */
function frame(w: number, h: number, l: number, d: number): Solid[] {
  return [box(l, h, d, l / 2, 0, 0), box(l, h, d, w - l / 2, 0, 0), box(w, l, d, w / 2, 0, 0), box(w, l, d, w / 2, h - l, 0)];
}

/** Straw on a floor: a thin bed and a few tufts. */
function straw(w: number, d: number, seed: number): Solid[] {
  const s: Solid[] = [box(w, 0.012, d, 0, 0, 0)];
  for (let i = 0; i < 4; i++) s.push(lump(0.05 + hash(seed, i) * 0.03, seed * 10 + i, 1.6, 0.45, 1.2).move((hash(seed, i, 1) - 0.5) * w * 0.8, 0.01, (hash(seed, i, 2) - 0.5) * d * 0.7));
  return s;
}

/** Boarded hutches, nx across and ny high, each cw x ch x cd inside, on legs `leg` high. */
function hutches(nx: number, ny: number, cw: number, ch: number, cd: number, leg: number, blocks = false): Part[] {
  const W = nx * cw + (nx + 1) * T, H = ny * ch + (ny + 1) * T, D = cd + T, z0 = -D / 2, zf = D / 2;
  const wood: Solid[] = [], iron: Solid[] = [], wire: Solid[] = [], hay: Solid[] = [], felt: Solid[] = [];
  wood.push(box(W, H, T, 0, leg, z0 + T / 2)); // the back
  for (let i = 0; i <= nx; i++) wood.push(box(T, H, D, -W / 2 + T / 2 + i * (cw + T), leg, 0)); // the ends and partitions
  for (let j = 0; j <= ny; j++) wood.push(box(W, T, D, 0, leg + j * (ch + T), 0)); // the floors and the top
  if (blocks) for (const x of [-W / 2 + 0.12, W / 2 - 0.12]) wood.push(box(0.12, leg, D - 0.04, x, 0, 0));
  else for (const x of [-W / 2 + 0.03, W / 2 - 0.03]) for (const z of [z0 + 0.03, zf - 0.03]) wood.push(box(0.05, leg + 0.02, 0.05, x, 0, z));
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x0 = -W / 2 + T + i * (cw + T), y0 = leg + T + j * (ch + T), kick = 0.08, dw = cw - 0.02, dh = ch - kick - 0.015;
    wood.push(box(cw, kick, T, x0 + cw / 2, y0, zf - T / 2)); // the board that holds the litter in
    // the door: a lath frame filling the rest of the front, square mesh behind it
    const dx = x0 + 0.01, dy = y0 + kick, z = zf + 0.012;
    wood.push(...frame(dw, dh, 0.035, 0.022).map((s) => s.move(dx, dy, z)));
    wire.push(...squareMesh(dw - 0.05, dh - 0.05, 0.025).map((s) => s.move(dx + dw / 2, dy + dh / 2, z - 0.012)));
    for (const y of [dy + 0.05, dy + dh - 0.07]) iron.push(box(0.09, 0.02, 0.004, dx + 0.04, y, z + 0.013)); // strap hinges
    iron.push(box(0.012, 0.012, 0.03, dx - 0.005, dy + 0.05, z), box(0.012, 0.012, 0.03, dx - 0.005, dy + dh - 0.07, z));
    wood.push(box(0.025, 0.08, 0.012, dx + dw + 0.005, dy + dh / 2 - 0.04, z + 0.017).rotate(0, 0, 0)); // the turn button
    hay.push(...straw(cw - 0.06, cd - 0.08, 11 + i + 5 * j).map((s) => s.move(x0 + cw / 2, y0, -0.02)));
  }
  // the roof: boards under tarred felt, falling to the back, overhanging
  const fall = -Math.atan(0.05 / D) * (180 / Math.PI), yr = leg + H + 0.03;
  wood.push(box(W + 0.1, T, D + 0.14, 0, 0, 0).rotate(fall, 0, 0).move(0, yr, 0.03));
  felt.push(box(W + 0.12, 0.004, D + 0.16, 0, 0, 0).rotate(fall, 0, 0).move(0, yr + T, 0.03));
  wood.push(box(W, 0.05, T, 0, leg + H, zf - T / 2), box(W, 0.02, T, 0, leg + H, z0 + T / 2)); // the wedge under the roof
  return [
    { mat: "wood-weathered", solid: union(...wood) },
    { mat: "zinc", solid: union(...wire), overlap: true },
    { mat: "iron", solid: union(...iron), overlap: true },
    { mat: "straw", solid: union(...hay), overlap: true },
    { mat: "felt", solid: union(...felt), overlap: true },
  ];
}

/** The netted hen pen after the 1909 photograph. */
function henCoop(): Part[] {
  const W = 1.2, D = 0.6, L = 0.4, hf = 0.6, hb = 0.75, l = 0.035, z0 = -D / 2, zf = D / 2;
  const wood: Solid[] = [], wire: Solid[] = [], iron: Solid[] = [], hay: Solid[] = [];
  for (const x of [-W / 2 + l / 2, W / 2 - l / 2]) {
    wood.push(box(l, L + hf, l, x, 0, zf - l / 2), box(l, L + hb, l, x, 0, z0 + l / 2));
    wood.push(box(l, l, D, x, L + hf - l, 0).rotate(0, 0, 0)); // the end's top rail (the roof's fall above it is boards)
  }
  wood.push(box(W, T, D, 0, L, 0), box(W, hb, T, 0, L, z0 + T / 2)); // floor and back
  wood.push(box(W, l, l, 0, L + T, zf - l / 2), box(W, l, l, 0, L + hf - l, zf - l / 2), box(l, hf, l, 0.05, L, zf - l / 2)); // front rails, the door post
  const fall = Math.atan((hb - hf) / D) * (180 / Math.PI);
  wood.push(box(W + 0.08, T, Math.hypot(D, hb - hf) + 0.08, 0, 0, 0).rotate(fall, 0, 0).move(0, L + (hf + hb) / 2 + 0.01, 0));
  // the ends: netting below the top rail, a board triangle above it
  for (const x of [-W / 2 + l / 2, W / 2 - l / 2]) {
    wire.push(...netting(D - 2 * l, hf - l - T, 0.04).map((s) => s.rotate(0, 90, 0).move(x, L + T + (hf - l - T) / 2, 0)));
    wood.push(side([[zf - l, 0], [z0 + l, hb - hf], [z0 + l, 0]], T).move(x, L + hf, 0));
  }
  // the front: the netted door on the left on two hinges, a fixed netted panel on the right
  const dw = W / 2 + 0.05 - 2 * l, dh = hf - 2 * l - T;
  wood.push(...frame(dw, dh, 0.03, 0.022).map((s) => s.move(-W / 2 + l, L + T + l, zf + 0.012)));
  wire.push(...netting(dw - 0.05, dh - 0.05, 0.04).map((s) => s.move(-W / 2 + l + dw / 2, L + T + l + dh / 2, zf)));
  wire.push(...netting(W / 2 - 0.05 - 1.5 * l, dh, 0.04).map((s) => s.move(0.05 + (W / 2 - 0.05) / 2, L + T + l + dh / 2, zf - l / 2)));
  for (const y of [L + T + l + 0.04, L + T + l + dh - 0.06]) iron.push(box(0.08, 0.018, 0.004, -W / 2 + l + 0.04, y, zf + 0.025));
  wood.push(box(0.022, 0.07, 0.012, 0.05 + l / 2 + 0.006, L + T + l + dh / 2 - 0.035, zf + 0.012)); // the turn button
  wood.push(bar([-W / 2 + l, L + 0.3, -0.06], [W / 2 - l, L + 0.3, -0.06], 0.016)); // the perch
  hay.push(...straw(W - 0.08, D - 0.08, 31).map((s) => s.move(0, L + T, 0)));
  return [
    { mat: "wood-weathered", solid: union(...wood) },
    { mat: "zinc", solid: union(...wire), overlap: true },
    { mat: "iron", solid: union(...iron), overlap: true },
    { mat: "straw", solid: union(...hay), overlap: true },
  ];
}

/** The woven-rod crate: upright rods every 35 mm round it, bound by woven bands, a rim, a rod lid. */
function poultryCrate(): Part[] {
  const W = 1.1, D = 0.55, H = 0.62, p = 0.035, r = 0.011, s: Solid[] = [];
  for (let x = -W / 2 + p / 2; x < W / 2; x += p) for (const z of [-D / 2, D / 2]) s.push(box(r, H, r, x, 0, z));
  for (let z = -D / 2 + p; z < D / 2 - p / 2; z += p) for (const x of [-W / 2, W / 2]) s.push(box(r, H, r, x, 0, z));
  // the woven bands lie round the outside of the rods (not through them), the sides' bands butting the ends'
  for (const y of [0.02, 0.16, 0.3, 0.44, H - 0.035]) {
    const b = y > H - 0.05 ? 0.035 : 0.028, t = y > H - 0.05 ? 0.03 : 0.022, o = r / 2 + t / 2 + 0.0005;
    s.push(box(W + r + 2 * t, b, t, 0, y, -D / 2 - o), box(W + r + 2 * t, b, t, 0, y, D / 2 + o), box(t, b, D + r, -W / 2 - o, y, 0), box(t, b, D + r, W / 2 + o, y, 0));
  }
  for (let x = -W / 2 + 0.06; x < W / 2; x += 0.06) s.push(box(r, r, D, x, H, 0)); // the lid's rods across, on the uprights
  for (const x of [-W / 4, W / 4]) s.push(box(0.025, 0.014, D + 0.03, x, H + r + 0.0005, 0)); // its bands, on the rods
  s.push(box(W - 0.02, 0.012, D - 0.02, 0, 0, 0)); // the floor
  return [{ mat: "wicker-weathered", solid: union(...s) }, { mat: "straw", solid: union(...straw(W - 0.1, D - 0.1, 51).map((q) => q.move(0, 0.012, 0))), overlap: true }];
}

const P = (id: string, size: [number, number, number], tris: number, f: () => Part[]) => prop({ id, items: ["rabbit-hutch"], size, place: "floor", where: "set", tris, parts: f });
P("rabbit-hutch", [1.78, 1.5, 0.84], 4500, () => hutches(2, 2, 0.8, 0.5, 0.6, 0.35));
P("rabbit-hutch-single", [1.11, 0.75, 0.8], 1400, () => hutches(1, 1, 0.95, 0.5, 0.55, 0.12, true));
P("hen-coop", [1.28, 1.2, 0.72], 2700, henCoop);
P("poultry-crate", [1.14, 0.66, 0.59], 2300, poultryCrate);

export const KIT_COOPS = true;
