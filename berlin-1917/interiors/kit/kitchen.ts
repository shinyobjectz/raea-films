// Kitchen kit: a side-wing kitchen as the 1913-20 survey plates show them (research/interiors.md, "The kitchen").
// The kitchen is where a worker's family lives: range, dresser, table, a bed for the lodger, washing overhead.
import { crossSection, manifold, sdf, type Solid } from "raea/3d";
import { ball, zcone, zcyl, box, folds, hash, lathe, noise3, plate, post, rbox, rodX, rodZ, taper, union, ring, type V3 } from "./geo";
import { def, prop } from "./prop";

/** Paper lace: a scalloped strip w long hanging h below y, at depth z (the edging on every shelf, 5-10 cm). */
export function scallops(w: number, h: number, y: number, z: number, x = 0): Solid {
  const pts: [number, number][] = [[-w / 2, 0]];
  const n = Math.max(2, Math.round(w / 0.045));
  for (let i = 0; i <= n; i++) {
    const u = -w / 2 + (w * i) / n;
    pts.push([u, -h * 0.55]);
    if (i < n) pts.push([u + w / n / 2, -h]);
  }
  pts.push([w / 2, 0]);
  return plate(pts, 0.002, x, y, z);
}

prop({
  id: "range", items: ["range"], size: [1.0, 0.82, 0.66], place: "wall", tris: 7500,
  parts: () => {
    const w = 1.0, h = 0.78, d = 0.62;
    return [
      { mat: "tile-white", solid: rbox(w, h, d, 0.01, 0, 0, 0) },
      {
        mat: "iron",
        solid: union(
          box(w + 0.04, 0.025, d + 0.03, 0, h, 0.01),
          box(0.32, 0.26, 0.02, 0.22, 0.3, d / 2 + 0.005), // oven door
          box(0.2, 0.16, 0.02, -0.26, 0.48, d / 2 + 0.005), // fire door
          box(0.2, 0.1, 0.02, -0.26, 0.12, d / 2 + 0.005), // ash door
          post(0.065, 0.95, -0.3, h, -d / 2 + 0.08), // flue up from the back, into the chimney
          rodZ(0.065, 0.25, -0.3, h + 1.0, -d / 2 - 0.02),
        ),
      },
      { mat: "iron-rust", solid: union(ring(0.11, 0.008).rotate(90, 0, 0).move(-0.22, h + 0.027, 0.03), ring(0.07, 0.007).rotate(90, 0, 0).move(-0.22, h + 0.027, 0.03), ring(0.11, 0.008).rotate(90, 0, 0).move(0.2, h + 0.027, 0.03)) },
      { mat: "brass", solid: union(rodX(0.009, w + 0.04, 0, h - 0.06, d / 2 + 0.05), box(0.02, 0.02, 0.06, -w / 2 + 0.01, h - 0.07, d / 2 + 0.02), box(0.02, 0.02, 0.06, w / 2 - 0.01, h - 0.07, d / 2 + 0.02), rodX(0.006, 0.06, 0.28, 0.43, d / 2 + 0.03)) },
    ];
  },
  glow: [{ at: [-0.26, 0.5, 0.36], lumens: 25, color: "#ff8a3d", range: 3, flicker: 0.25 }],
});

prop({
  id: "kettle", items: ["enamelware"], size: [0.26, 0.26, 0.2], place: "on", tris: 1500,
  parts: () => [{
    mat: "enamel-blue",
    solid: union(
      lathe([[0, 0], [0.1, 0], [0.11, 0.03], [0.105, 0.11], [0.06, 0.15], [0.03, 0.16], [0, 0.16]]),
      zcyl(0.012, 0.13).rotate(0, 60, 0).move(0.13, 0.11, 0),
      ring(0.07, 0.007).trim(0, 1, 0, 0).move(0, 0.16, 0),
    ),
  }],
});
prop({
  id: "pot", items: ["enamelware"], size: [0.3, 0.18, 0.24], place: "on", tris: 1200,
  parts: () => [{ mat: "enamel", solid: union(lathe([[0, 0], [0.11, 0], [0.12, 0.02], [0.12, 0.15], [0.125, 0.155], [0, 0.155]]), box(0.05, 0.015, 0.03, 0.15, 0.12, 0), box(0.05, 0.015, 0.03, -0.15, 0.12, 0)) }],
});

/** The Berlin kitchen dresser: a base of drawers and doors, an open recess, a glazed top behind paper lace. */
prop({
  id: "dresser", items: ["kitchen-dresser"], size: [1.2, 2.05, 0.52], place: "wall", tris: 9000,
  parts: () => {
    const w = 1.2, d = 0.5, ud = 0.32, base = 0.86, upY = 1.08, upH = 0.88;
    const wood = union(
      box(w, base, d, 0, 0, 0),
      box(w + 0.03, 0.03, d + 0.02, 0, base, 0.01),
      box(w, upH, ud, 0, upY, -(d - ud) / 2),
      box(w + 0.08, 0.08, ud + 0.06, 0, upY + upH, -(d - ud) / 2 + 0.02), // the cornice
      box(w, upY - base - 0.03, 0.02, 0, base + 0.03, -d / 2 + 0.01), // recess back
      box(0.04, upY - base, 0.08, -w / 2 + 0.02, base, -d / 2 + 0.1), box(0.04, upY - base, 0.08, w / 2 - 0.02, base, -d / 2 + 0.1),
    ).minus(union(box(0.52, 0.8, 0.3, -0.29, upY + 0.04, -d / 2 + ud + 0.02), box(0.52, 0.8, 0.3, 0.29, upY + 0.04, -d / 2 + ud + 0.02)));
    const fronts: Solid[] = [];
    for (const x of [-0.29, 0.29]) {
      fronts.push(box(0.54, 0.15, 0.015, x, base - 0.2, d / 2 + 0.006), box(0.54, 0.6, 0.015, x, 0.06, d / 2 + 0.006)); // drawer, door
      fronts.push(box(0.54, 0.035, 0.03, x, upY + 0.04, -d / 2 + ud), box(0.54, 0.035, 0.03, x, upY + 0.81, -d / 2 + ud), box(0.035, 0.8, 0.03, x - 0.25, upY + 0.04, -d / 2 + ud), box(0.035, 0.8, 0.03, x + 0.25, upY + 0.04, -d / 2 + ud), box(0.02, 0.8, 0.02, x, upY + 0.04, -d / 2 + ud), box(0.5, 0.02, 0.02, x, upY + 0.44, -d / 2 + ud));
    }
    const shelves: Solid[] = [], lace: Solid[] = [], plates: Solid[] = [], knobs: Solid[] = [];
    for (const y of [upY + 0.3, upY + 0.58]) {
      shelves.push(box(w - 0.04, 0.015, ud - 0.04, 0, y, -(d - ud) / 2 - 0.01));
      lace.push(scallops(w - 0.06, 0.06, y + 0.015, -d / 2 + ud - 0.04));
      for (let i = 0; i < 7; i++) if (hash(y * 10, i) > 0.25) plates.push(zcyl(0.1, 0.012).rotate(-12, 0, 0).move(-0.48 + i * 0.16, y + 0.115, -d / 2 + 0.06));
    }
    lace.push(scallops(w - 0.04, 0.07, base + 0.03, d / 2 + 0.008)); // on the worktop's edge too
    for (const x of [-0.29, 0.29]) knobs.push(post(0.012, 0.02, x, base - 0.13, d / 2 + 0.02).rotate(0, 0, 0), ball(0.012).move(x + 0.2, 0.42, d / 2 + 0.02));
    return [
      { mat: "paint-white", solid: union(wood, ...fronts, ...shelves) },
      { mat: "glass", solid: union(box(0.48, 0.38, 0.004, -0.29, upY + 0.05, -d / 2 + ud), box(0.48, 0.38, 0.004, -0.29, upY + 0.45, -d / 2 + ud), box(0.48, 0.38, 0.004, 0.29, upY + 0.05, -d / 2 + ud), box(0.48, 0.38, 0.004, 0.29, upY + 0.45, -d / 2 + ud)) },
      { mat: "paper", solid: union(...lace) },
      { mat: "enamel", solid: union(...plates) },
      { mat: "brass", solid: union(...knobs) },
    ];
  },
});

/** A wall shelf with its paper edging and cups on hooks underneath. */
prop({
  id: "wall-shelf", items: ["plate-rack"], size: [0.9, 0.3, 0.2], place: "hung", tris: 12500,
  parts: () => {
    const cups: Solid[] = [], hooks: Solid[] = [];
    for (let i = 0; i < 5; i++) {
      const x = -0.34 + i * 0.17;
      hooks.push(post(0.003, 0.03, x, -0.03, 0.06));
      cups.push(union(lathe([[0, 0], [0.03, 0], [0.04, 0.07], [0, 0.07]]), ring(0.018, 0.004).rotate(0, 90, 0).move(0.045, 0.035, 0)).rotate(180, 0, 0).move(x, -0.035, 0.06));
    }
    return [
      { mat: "wood-soft", solid: union(box(0.9, 0.022, 0.2, 0, 0, 0), box(0.02, 0.14, 0.14, -0.4, -0.14, -0.03), box(0.02, 0.14, 0.14, 0.4, -0.14, -0.03)) },
      { mat: "paper", solid: scallops(0.88, 0.07, 0.022, 0.101) },
      { mat: "enamel", solid: union(...cups) },
      { mat: "iron", solid: union(...hooks) },
    ];
  },
});

/** Six canisters, Mehl, Zucker, Salz, Kaffee, Gries, Reis: white enamel with a blue label band. */
prop({
  id: "canisters", items: ["canisters"], size: [0.7, 0.2, 0.12], place: "on", tris: 3000,
  parts: () => {
    const c: Solid[] = [], l: Solid[] = [];
    for (let i = 0; i < 6; i++) {
      const x = -0.29 + i * 0.116, h = 0.17 - (i % 3) * 0.02;
      c.push(post(0.045, h, x, 0, 0), post(0.047, 0.015, x, h, 0), ball(0.012).move(x, h + 0.02, 0));
      l.push(post(0.0455, 0.035, x, h * 0.45, 0));
    }
    return [{ mat: "enamel", solid: union(...c) }, { mat: "enamel-blue", solid: union(...l) }];
  },
});

prop({
  id: "spice-cabinet", items: ["spice-cabinet"], size: [0.42, 0.5, 0.15], place: "hung", tris: 3000,
  parts: () => {
    const fronts: Solid[] = [], labels: Solid[] = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      const x = -0.13 + c * 0.13, y = 0.03 + r * 0.1;
      fronts.push(box(0.115, 0.085, 0.012, x, y, 0.075));
      labels.push(box(0.05, 0.02, 0.004, x, y + 0.05, 0.083), ball(0.007).move(x, y + 0.025, 0.085));
    }
    return [{ mat: "wood-soft", solid: union(box(0.42, 0.42, 0.14, 0, 0, 0), box(0.46, 0.05, 0.17, 0, 0.42, 0.005), ...fronts) }, { mat: "enamel", solid: union(...labels) }];
  },
});

prop({
  id: "kitchen-table", items: ["kitchen-table", "oilcloth"], size: [1.0, 0.77, 0.66], place: "floor", tris: 2500,
  parts: () => {
    const legs: Solid[] = [];
    for (const [x, z] of [[-0.44, -0.27], [0.44, -0.27], [-0.44, 0.27], [0.44, 0.27]]) legs.push(taper(0.028, 0.022, 0.72, x, 0, z));
    // oilcloth over the top: it hangs a hand's width over the edge and creases at the corners
    const cloth = box(1.12, 0.006, 0.78, 0, 0.765, 0).union(box(1.12, 0.08, 0.004, 0, 0.69, 0.39)).union(box(1.12, 0.08, 0.004, 0, 0.69, -0.39)).union(box(0.004, 0.08, 0.78, 0.56, 0.69, 0)).union(box(0.004, 0.08, 0.78, -0.56, 0.69, 0));
    return [{ mat: "wood-soft", solid: union(box(1.0, 0.035, 0.66, 0, 0.73, 0), box(0.9, 0.1, 0.56, 0, 0.63, 0), ...legs) }, { mat: "oilcloth", solid: cloth }];
  },
});

prop({
  id: "chair", items: ["chairs-bent"], size: [0.42, 0.9, 0.45], place: "floor", tris: 1500,
  parts: () => [{
    mat: "wood-mid",
    solid: union(
      box(0.42, 0.03, 0.42, 0, 0.44, 0.01),
      post(0.018, 0.44, -0.18, 0, 0.19), post(0.018, 0.44, 0.18, 0, 0.19),
      post(0.02, 0.9, -0.18, 0, -0.18), post(0.02, 0.9, 0.18, 0, -0.18),
      box(0.36, 0.09, 0.02, 0, 0.78, -0.18), box(0.36, 0.05, 0.02, 0, 0.62, -0.18),
      rodX(0.01, 0.36, 0, 0.16, 0.19), rodX(0.01, 0.36, 0, 0.16, -0.18),
    ),
  }],
});
prop({
  id: "stool", items: ["stool"], size: [0.34, 0.47, 0.34], place: "floor", tris: 800,
  parts: () => [{ mat: "wood-soft", solid: union(post(0.17, 0.03, 0, 0.44, 0), taper(0.02, 0.016, 0.44, -0.11, 0, -0.11).rotate(4, 0, -4), taper(0.02, 0.016, 0.44, 0.11, 0, -0.11).rotate(4, 0, 4), taper(0.02, 0.016, 0.44, 0, 0, 0.13).rotate(-5, 0, 0)) }],
});

/** The lodger's bed in the kitchen corner: iron, black, made up high under a checked featherbed. */
prop({
  id: "bed-iron", items: ["bed-iron", "featherbed-check", "lodger-bed"], size: [0.98, 1.1, 1.96], place: "corner", tris: 18000,
  parts: () => {
    const w = 0.94, l = 1.92, iron: Solid[] = [];
    for (const [z, hh] of [[-l / 2, 1.08], [l / 2, 0.82]] as const) {
      iron.push(post(0.016, hh, -w / 2, 0, z), post(0.016, hh, w / 2, 0, z), rodX(0.012, w, 0, hh - 0.04, z), rodX(0.012, w, 0, 0.42, z));
      for (let i = 1; i < 6; i++) iron.push(post(0.007, hh - 0.46, -w / 2 + (w * i) / 6, 0.42, z));
    }
    iron.push(rodZ(0.014, l, -w / 2, 0.38, 0), rodZ(0.014, l, w / 2, 0.38, 0));
    const tick = rbox(w - 0.04, 0.16, l - 0.06, 0.05, 0, 0.36, 0);
    const feather = sdf.box(w + 0.02, 0.2, l * 0.68, 0.08).move(0, 0.62, 0.26).displace(0.018, 3, 3, 7).solid(0.05).simplify(0.0125);
    const pillow = sdf.box(w - 0.08, 0.2, 0.5, 0.08).move(0, 0.66, -l / 2 + 0.32).displace(0.012, 4, 3, 8).solid(0.04).simplify(0.01);
    return [
      { mat: "iron", solid: union(...iron) },
      { mat: "brass", solid: union(ball(0.028).move(-w / 2, 1.1, -l / 2), ball(0.028).move(w / 2, 1.1, -l / 2), ball(0.024).move(-w / 2, 0.84, l / 2), ball(0.024).move(w / 2, 0.84, l / 2)) },
      { mat: "linen-grey", solid: tick },
      { mat: "check-red", solid: feather },
      { mat: "linen", solid: pillow },
    ];
  },
});

prop({
  // the zinc tub on its nail by one end's handle, as it hung between Saturdays: the rim to the wall and the bottom to
  // the room, its long axis upright, the stamped rings on the bottom and the rolled rim catching the light (the director on
  // v7, "what's this floating thing": hung rim out, it read as a ring in the air)
  id: "tub-hung", items: ["tub"], size: [0.5, 0.86, 0.32], place: "hung", tris: 2600,
  parts: () => {
    const up = (s: Solid) => s.scale(1.15, 1, 0.7).rotate(-90, 0, 0).rotate(0, 0, 90).move(0, 0.43, 0.14);
    const body = lathe([[0, 0], [0.28, 0], [0.33, 0.28], [0.34, 0.29], [0.31, 0.29], [0.27, 0.02], [0, 0.02]], 0, 0, 0, 28);
    const rings = union(...[0.1, 0.18].map((r) => lathe([[r, 0], [r + 0.006, -0.006], [r + 0.012, 0]], 0, 0, 0, 28)));
    const rim = lathe([[0.335, 0.28], [0.352, 0.285], [0.352, 0.3], [0.335, 0.3]], 0, 0, 0, 28);
    const handles = union(box(0.07, 0.025, 0.04, 0.41, 0.25, 0), box(0.07, 0.025, 0.04, -0.41, 0.25, 0));
    return [
      { mat: "zinc", solid: union(up(body), up(rim), up(handles)) },
      { mat: "zinc", solid: up(rings), overlap: true },
      // the nail through the top handle, into the wall
      { mat: "iron", solid: rodZ(0.004, 0.09, 0, 0.84, -0.13), overlap: true },
    ];
  },
});

prop({
  // an enamel basin on its nail by the hole in its rim, the rim to the wall and the white bottom to the room, its blue
  // edge showing round it (the director on v7, "what's this oval thing": tipped out from the wall, it read as a plate in the air)
  id: "basin-hung", items: ["basin-wall", "enamelware"], size: [0.38, 0.38, 0.1], place: "hung", tris: 900,
  parts: () => {
    const out = (s: Solid) => s.rotate(-90, 0, 0).move(0, 0.19, 0.04);
    return [
      { mat: "enamel", solid: out(lathe([[0, 0], [0.12, 0], [0.17, 0.08], [0.18, 0.085], [0.165, 0.085], [0.11, 0.012], [0, 0.012]])) },
      { mat: "enamel-blue", solid: out(lathe([[0.168, 0.078], [0.186, 0.083], [0.186, 0.092], [0.168, 0.09]])), overlap: true },
      { mat: "iron", solid: rodZ(0.003, 0.06, 0, 0.36, -0.04), overlap: true },
    ];
  },
});

/** The washing line under the ceiling: L long, sagging, with what dries on it in winter (it takes days indoors). */
export function washing(len: number, seed: number) {
  const sag = 0.06 + len * 0.015;
  const yAt = (x: number) => -sag * (1 - (2 * x / len) ** 2);
  const white: Solid[] = [], grey: Solid[] = [], blue: Solid[] = [], pegs: Solid[] = [];
  let x = -len / 2 + 0.2, i = 0;
  while (x < len / 2 - 0.45) {
    // three kinds, as the court photographs hang them: shirts by the tails with the sleeves down, long johns by the
    // waist, sheets and towels folded over the line; all pegged, creased in vertical folds, flared a little at the hem
    const kind = hash(seed, i, 3), w = kind < 0.35 ? 0.42 : kind < 0.55 ? 0.38 : 0.35 + hash(seed, i) * 0.5, h = kind < 0.55 ? 0.6 + hash(seed, i, 1) * 0.15 : 0.4 + hash(seed, i, 1) * 0.45;
    const parts: Solid[] = [];
    if (kind < 0.35) parts.push(box(w * 0.78, h, 0.008, 0, -h, 0), box(0.12, h * 0.85, 0.008, -w * 0.5, -h * 0.98, 0), box(0.12, h * 0.85, 0.008, w * 0.5, -h * 0.98, 0));
    else if (kind < 0.55) parts.push(box(w, 0.14, 0.008, 0, -0.14, 0), box(0.15, h * 1.2, 0.008, -0.1, -h * 1.2, 0), box(0.15, h * 1.2, 0.008, 0.1, -h * 1.2, 0));
    else parts.push(box(w, h, 0.008, 0, -h, 0), box(w, 0.09, 0.012, 0, -0.09, 0.006));
    const ph = hash(seed, i, 5) * 6;
    const g = (parts.length === 1 ? parts[0] : union(...parts)).refineToLength(0.05).warp((px, py, pz) => {
      const t = Math.min(1, -py / h);
      return [px * (1 + 0.06 * t), py, pz + Math.sin(px * 17 + ph) * 0.02 * (0.35 + t) + noise3(px * 5, py * 5, i, seed) * 0.02];
    });
    const cx = x + w / 2, yy = yAt(cx);
    const tilt = (yAt(cx + 0.1) - yAt(cx - 0.1)) / 0.2;
    const placed = g.rotate(0, 0, (Math.atan(tilt) * 180) / Math.PI).move(cx, yy + 0.005, 0);
    (kind < 0.35 ? white : kind < 0.55 ? grey : hash(seed, i, 6) < 0.25 ? blue : white).push(placed);
    for (const px of [-w * 0.42, w * 0.42]) pegs.push(box(0.014, 0.075, 0.022, cx + px, yAt(cx + px) - 0.045, 0));
    x += w + 0.06 + hash(seed, i, 2) * 0.22;
    i++;
  }
  const segs: Solid[] = [];
  for (let k = 0; k < 8; k++) {
    const a = -len / 2 + (len * k) / 8, b = a + len / 8, ya = yAt(a), yb = yAt(b);
    segs.push(zcyl(0.003, Math.hypot(b - a, yb - ya)).rotate(0, 90, 0).rotate(0, 0, (Math.atan2(yb - ya, b - a) * 180) / Math.PI).move((a + b) / 2, (ya + yb) / 2, 0));
  }
  const many = (a: Solid[]) => (a.length === 0 ? null : a.length === 1 ? a[0] : manifold.compose(...a));
  return { line: union(...segs), white: many(white), grey: many(grey), blue: many(blue), pegs: many(pegs) };
}
for (const len of [2.5, 3.5])
  prop({
    id: `washing-${len}`, items: ["drying-line-indoor"], size: [len, 1.0, 0.1], place: "ceiling", tris: 10000,
    parts: () => {
      const w = washing(len, len * 3);
      return ([["linen-grey", w.line], ["linen", w.white], ["linen-grey", w.grey], ["check-blue", w.blue], ["wood-soft", w.pegs]] as const).filter(([, s]) => s).map(([mat, s]) => ({ mat, solid: s! }));
    },
  });

/** The hoop lamp over the table (research/interiors.md): ceiling hook at y = 0, the lamp hangs below. */
prop({
  id: "hoop-lamp", items: ["gas-pendant", "petroleum-lamp"], size: [0.42, 1.05, 0.42], place: "ceiling", tris: 4000,
  parts: () => {
    const hoop = crossSection.circle(1).scale(0.16, 0.42).minus(crossSection.circle(1).scale(0.148, 0.408)).extrude(0.012).move(0, -0.5, -0.006);
    return [
      { mat: "brass", solid: union(hoop, post(0.03, 0.03, 0, -0.03, 0), rodX(0.006, 0.02, 0, -0.06, 0).union(post(0.004, 0.05, 0, -0.1, 0)), lathe([[0, 0], [0.05, 0], [0.07, 0.05], [0.04, 0.09], [0.015, 0.1], [0, 0.1]], 0, -0.98, 0), lathe([[0, 0], [0.025, 0], [0.035, 0.06], [0.02, 0.1], [0, 0.1]], 0, -0.2, 0)) },
      { mat: "glass", solid: taper(0.022, 0.016, 0.2, 0, -0.86, 0) },
      { mat: "lamp-shade", solid: lathe([[0.03, 0.04], [0.2, 0], [0.205, 0.006], [0.035, 0.05]], 0, -0.87, 0, 40) },
      { mat: "mantle", solid: post(0.013, 0.025, 0, -0.875, 0) },
    ];
  },
  // under the shade's rim (-0.87), clear of the mantle: inside it, the rim drew a ring of shadow round the walls
  // traced light's emitter just under the font (body): at -0.91 it sat inside the brass font, and over it, at the mantle,
  // the font (7 cm wide, 1.3 cm under the mantle here; a real burner stands higher) shaded the whole table
  glow: [{ at: [0, -0.91, 0], body: [0, -1.0, 0], lumens: 350, color: "#ffc98a", range: 9, shadow: true }, { at: [0, -0.7, 0], lumens: 70, color: "#ffd9a8", range: 5, fill: true }],
});

/** The Kastenfenster: two casement pairs a wall's depth apart. Origin: the opening's bottom middle on the room face;
 *  the wall runs from z = 0 back to z = -depth. */
export function kastenfenster(w: number, h: number, depth: number): { frame: Solid; glass: Solid; sill: Solid; wool: Solid } {
  const fr: Solid[] = [], gl: Solid[] = [];
  for (const z of [-0.06, -depth + 0.06]) {
    fr.push(box(w, 0.06, 0.06, 0, 0, z), box(w, 0.06, 0.06, 0, h - 0.06, z), box(0.06, h, 0.06, -w / 2 + 0.03, 0, z), box(0.06, h, 0.06, w / 2 - 0.03, 0, z), box(0.07, h, 0.05, 0, 0, z), box(w, 0.06, 0.06, 0, h * 0.68, z));
    gl.push(box(w - 0.08, h - 0.08, 0.004, 0, 0.04, z));
  }
  const handles = union(box(0.015, 0.12, 0.02, 0.03, h * 0.45, -0.02), box(0.015, 0.12, 0.02, 0.03, h * 0.85, -0.02));
  const sill = box(w + 0.14, 0.035, 0.26, 0, -0.035, 0.09); // the inner sill board: where the plants stand in winter
  // between the casements in winter: cotton wool laid along the lower sill, with paper flowers on it
  const wool = sdf.box(w - 0.1, 0.05, depth - 0.2, 0.025).move(0, 0.03, -depth / 2).displace(0.012, 12, 3, 3).solid(0.015).simplify(0.00375);
  return { frame: union(...fr, handles), glass: union(...gl), sill, wool };
}
prop({
  id: "window-kasten", items: ["window-double"], size: [1.05, 1.55, 0.38], place: "hung", tris: 16000,
  parts: () => { const k = kastenfenster(1.05, 1.55, 0.38); return [{ mat: "paint-white", solid: union(k.frame, k.sill) }, { mat: "glass", solid: k.glass }]; },
});
/** The winter's cotton wool between the casements, with the window's own origin: laid in November, taken out in March
 *  (interiors/furnish.ts places it with every Kastenfenster in those months; a hand-dressed winter set places it itself). */
prop({
  id: "window-wool", items: ["draught-proofing"], where: "set", size: [1.05, 1.55, 0.38], place: "hung", tris: 12000,
  parts: () => [{ mat: "linen", solid: kastenfenster(1.05, 1.55, 0.38).wool }],
});

/** The box window opened: the inner pair swung into the room, the outer pair out over the court (hinged at the jambs),
 *  for the shot that leans out to the organ grinder. Same origin as window-kasten. Not a catalogue item of its own. */
export function kastenOpen(w: number, h: number, depth: number, inner = 75, outer = 60) {
  const fr: Solid[] = [], gl: Solid[] = [], lw = w / 2 - 0.06;
  const leaf = () => union(box(lw, 0.05, 0.05, lw / 2, 0.06, 0), box(lw, 0.05, 0.05, lw / 2, h - 0.11, 0), box(0.05, h - 0.12, 0.05, 0.025, 0.06, 0), box(0.05, h - 0.12, 0.05, lw - 0.025, 0.06, 0), box(lw, 0.04, 0.04, lw / 2, h * 0.68, 0));
  const pane = () => box(lw - 0.08, h - 0.2, 0.004, lw / 2, 0.1, 0);
  for (const [z, deg] of [[-0.06, -inner], [-depth + 0.06, outer]] as const) {
    fr.push(box(w, 0.06, 0.06, 0, 0, z), box(w, 0.06, 0.06, 0, h - 0.06, z), box(0.06, h, 0.06, -w / 2 + 0.03, 0, z), box(0.06, h, 0.06, w / 2 - 0.03, 0, z));
    // left leaf hinged at the left jamb, right leaf (turned 180) at the right; +deg about y swings a +x leaf toward -z
    fr.push(leaf().rotate(0, deg, 0).move(-w / 2 + 0.06, 0, z), leaf().rotate(0, 180 - deg, 0).move(w / 2 - 0.06, 0, z));
    gl.push(pane().rotate(0, deg, 0).move(-w / 2 + 0.06, 0, z), pane().rotate(0, 180 - deg, 0).move(w / 2 - 0.06, 0, z));
  }
  const sill = box(w + 0.14, 0.035, 0.26, 0, -0.035, 0.09);
  return { frame: union(...fr, sill), glass: union(...gl) };
}
prop({
  id: "window-kasten-open", items: [], size: [1.05, 1.55, 0.38], place: "hung", tris: 3000,
  parts: () => { const k = kastenOpen(1.05, 1.55, 0.38); return [{ mat: "paint-white", solid: k.frame }, { mat: "glass", solid: k.glass }]; },
});

/** A half curtain of machine lace on a rod across the lower casements, and a tied-back pair (research: lace even in the
 *  poorest rooms). Origin as the window's. */
prop({
  id: "lace-curtain", items: ["lace-curtains"], size: [1.3, 1.7, 0.08], place: "hung", tris: 14000,
  parts: () => {
    const half = folds(1.0, 0.62, 0.003, 38, 0.012).move(0, 0.3, 0.05);
    const tie = (dir: number) => (x: number, y: number, z: number): [number, number, number] => [x + dir * (1 - Math.min(1, y / 0.9)) * 0.06, y, z];
    const sideL = folds(0.28, 1.58, 0.003, 30, 0.02, 12).move(-0.52, 0.05, 0.07).warp(tie(1));
    const sideR = folds(0.28, 1.58, 0.003, 30, 0.02, 12).move(0.52, 0.05, 0.07).warp(tie(-1));
    const valance = folds(1.3, 0.2, 0.003, 34, 0.012).move(0, 1.47, 0.08);
    return [{ mat: "lace", solid: union(half, sideL, sideR, valance) }, { mat: "brass", solid: union(rodX(0.006, 1.04, 0, 0.92, 0.05), rodX(0.008, 1.36, 0, 1.67, 0.08)) }];
  },
});

/** The lace for a window w by h: the half curtain over the lower casements on its rod, the tied-back pair from a rod
 *  over the head to the sill, the valance across the head. Origin as the window's. */
function laceFor(w: number, h: number) {
  const hy = 0.19 * h, hh = 0.4 * h, sw = Math.min(0.42, 0.27 * w);
  const tie = (dir: number) => (x: number, y: number, z: number): [number, number, number] => [x + dir * (1 - Math.min(1, y / (0.58 * h))) * 0.06, y, z];
  const half = folds(w - 0.05, hh, 0.003, 38, 0.012).move(0, hy, 0.05);
  const sideL = folds(sw, h + 0.03, 0.003, 30, 0.02, 12).move(-w / 2 + 0.005, 0.05, 0.07).warp(tie(1));
  const sideR = folds(sw, h + 0.03, 0.003, 30, 0.02, 12).move(w / 2 - 0.005, 0.05, 0.07).warp(tie(-1));
  const valance = folds(w + 0.25, 0.2, 0.003, 34, 0.012).move(0, h - 0.08, 0.08);
  return [{ mat: "lace" as const, solid: union(half, sideL, sideR, valance) }, { mat: "brass" as const, solid: union(rodX(0.006, w - 0.01, 0, hy + hh, 0.05), rodX(0.008, w + 0.31, 0, h + 0.12, 0.08)) }];
}
/** The window things fitted to an opening w by h (to 5 cm), registered on first use: the city's windows run from a
 *  cellar's 0.8 by 0.6 to a good flat's 1.9 by 2.6, and a 1.05 by 1.55 window stood in a 1.1 by 2.1 opening left the
 *  head open to the street and hung the curtain's rod across the middle of the glass (the director on v7, "does this curtain
 *  make sense", "is this authentic" of the salon's open window heads). */
export function fitWindow(kind: "kasten" | "kasten-open" | "wool" | "lace", w0: number, h0: number): string {
  const w = Math.round(w0 * 20) / 20, h = Math.round(h0 * 20) / 20, id = `window-${kind}-${Math.round(w * 100)}x${Math.round(h * 100)}`;
  if (def(id)) return id;
  const size: V3 = [kind === "lace" ? w + 0.35 : w + 0.14, h + 0.15, kind === "lace" ? 0.1 : 0.38];
  const tris = Math.round((kind === "lace" ? 14000 : kind === "wool" ? 12000 : kind === "kasten" ? 16000 : 3000) * Math.max(1, (w * h) / (1.05 * 1.55)));
  const parts = kind === "lace" ? () => laceFor(w, h)
    : kind === "wool" ? () => [{ mat: "linen" as const, solid: kastenfenster(w, h, 0.38).wool }]
    : kind === "kasten-open" ? () => { const k = kastenOpen(w, h, 0.38); return [{ mat: "paint-white" as const, solid: k.frame }, { mat: "glass" as const, solid: k.glass }]; }
    : () => { const k = kastenfenster(w, h, 0.38); return [{ mat: "paint-white" as const, solid: union(k.frame, k.sill) }, { mat: "glass" as const, solid: k.glass }]; };
  prop({ id, items: [], size, place: "hung", where: "set", tris, parts });
  return id;
}

/** A geranium cut back for the winter in a clay pot: woody stems, a few leaves, one late flower. */
prop({
  id: "geranium", items: ["geraniums"], size: [0.3, 0.38, 0.3], place: "on", tris: 4000,
  parts: () => {
    const stems: Solid[] = [], leaves: Solid[] = [];
    for (let i = 0; i < 6; i++) {
      const a = i * 2.4, tilt = 12 + hash(i, 31) * 22, l = 0.14 + hash(i, 32) * 0.12;
      const s = zcyl(0.005, l).move(0, 0, l / 2).rotate(-90 + tilt, (a * 180) / Math.PI, 0).move(0, 0.13, 0);
      stems.push(s);
      const tip: [number, number, number] = [Math.sin(a) * Math.sin((tilt * Math.PI) / 180) * l, 0.13 + Math.cos((tilt * Math.PI) / 180) * l, Math.cos(a) * Math.sin((tilt * Math.PI) / 180) * l];
      if (hash(i, 33) < 0.7) leaves.push(zcyl(0.035, 0.004).rotate(70 + hash(i, 34) * 30, (a * 180) / Math.PI, 0).move(...tip));
    }
    return [
      { mat: "terracotta", solid: lathe([[0, 0], [0.065, 0], [0.085, 0.12], [0.095, 0.125], [0.095, 0.14], [0.08, 0.14], [0, 0.13]]) },
      { mat: "earth", solid: post(0.078, 0.005, 0, 0.13, 0) },
      { mat: "wood-mid", solid: union(...stems) },
      { mat: "leaf", solid: union(...leaves) },
      { mat: "flower", solid: ball(0.025).scale(1, 0.7, 1).move(0.05, 0.36, 0.03) },
    ];
  },
});

/** The embroidered hanging behind the range: white linen, a blue cross-stitch border and a saying. */
prop({
  id: "wall-hanging", items: ["wall-hanging"], size: [0.8, 0.5, 0.02], place: "hung", tris: 600,
  parts: () => [
    { mat: "linen", solid: box(0.76, 0.46, 0.004, 0, 0, 0.004) },
    { mat: "enamel-blue", solid: union(box(0.7, 0.012, 0.002, 0, 0.42, 0.007), box(0.7, 0.012, 0.002, 0, 0.03, 0.007), box(0.45, 0.03, 0.002, 0, 0.21, 0.007), box(0.3, 0.03, 0.002, 0, 0.27, 0.007)) },
    { mat: "wood-soft", solid: rodX(0.006, 0.8, 0, 0.47, 0.008) },
  ],
});

prop({
  id: "coffee-mill", items: ["coffee-mill", "ersatz-goods"], size: [0.14, 0.24, 0.14], place: "on", tris: 600,
  parts: () => [{ mat: "wood-mid", solid: box(0.12, 0.12, 0.12) }, { mat: "brass", solid: union(lathe([[0, 0], [0.05, 0], [0.045, 0.03], [0.01, 0.04], [0, 0.04]], 0, 0.12, 0), post(0.004, 0.06, 0, 0.16, 0), rodX(0.004, 0.08, 0.04, 0.215, 0)) }],
});

/** Ration cards on their nail by the door, and the bread card on top (research: war, ration-cards). */
prop({
  id: "ration-cards", items: ["ration-cards"], size: [0.16, 0.12, 0.01], place: "hung", tris: 200,
  parts: () => [{ mat: "paper", solid: union(box(0.11, 0.075, 0.002, 0, 0, 0.002).rotate(0, 0, 3), box(0.1, 0.07, 0.002, 0.01, 0.01, 0.004).rotate(0, 0, -4), box(0.105, 0.065, 0.002, -0.005, 0.02, 0.006)) }, { mat: "iron", solid: rodZ(0.002, 0.03, 0, 0.07, 0.01) }],
});

prop({
  id: "iron-stove", items: ["iron-stove"], size: [0.5, 0.75, 0.5], place: "floor", tris: 2500,
  parts: () => [
    { mat: "iron", solid: union(lathe([[0, 0], [0.2, 0], [0.2, 0.06], [0.17, 0.08], [0.17, 0.6], [0.2, 0.64], [0.12, 0.7], [0, 0.7]]), post(0.06, 0.6, 0, 0.7, -0.05)) },
    { mat: "iron-rust", solid: box(0.12, 0.1, 0.03, 0, 0.18, 0.17) },
  ],
  glow: [{ at: [0, 0.25, 0.22], lumens: 20, color: "#ff7a30", range: 3, flicker: 0.3 }],
});

export const KIT_KITCHEN = true;
