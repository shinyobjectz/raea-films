// The oil painting's brush (v3/oil.tsx), in GLSL for raea's three shaders (ThreeShaderMaterial: naga translates it).
//
// Everything in that world is laid in strokes of thick paint, as a painter lays them, never a filter over a render:
//  - a FIELD paints a surface (the sky, the land) in its own 2D domain Q, fixed to the world so nothing swims as we
//    walk: a few layers of strokes, each layer a jittered grid of them (broad strokes first, finer over them), every
//    stroke one colour, the colour of what lies under its middle, and turned along the form (`sample` gives both);
//  - a BRUSH is one stroke in its own frame: s along it (put down at 0, lifted at 1), r across it (-1..1). It has the
//    round head a loaded brush leaves where it touches down, the bristles' grooves along it, a lip of paint pushed up
//    at each edge, a ridge where it was lifted, and toward the lift it runs dry bristle by bristle, so the paint under
//    shows through in streaks;
//  - the paint's relief is lit by one light from the upper left, as a canvas on a wall is: each ridge a little lighter
//    on its lit side, darker on the other, and a wet glint on the steepest (RELIEF).
// Colours are written as they show (sRGB), as a painter mixes them: the world's light (the sun's warmth, the shadows'
// violet) is in the colours, not lit by the engine.

export const NOISE = /* glsl */ `
float h11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec4 h42(vec2 p) { vec4 p4 = fract(vec4(p.xyxy) * vec4(0.1031, 0.1030, 0.0973, 0.1099)); p4 += dot(p4, p4.wzxy + 33.33); return fract((p4.xxyz + p4.yzzw) * p4.zywx); }
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) { float s = 0.0; float a = 0.5; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
float fbm3(vec2 p) { float s = 0.0; float a = 0.5; for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s * 1.1428; }
`;

/** one stroke: (cover, height, load) at (s, r); aaR and aaS are a pixel in r and in s */
export const BRUSH = /* glsl */ `
vec3 brush(float s, float r, float seed, float dry, float aaR, float aaS) {
  // the bristles: where across the brush, and how much paint each one carried
  float nb = 6.0 + 7.0 * seed;
  float q = (r * 0.5 + 0.5) * nb + seed * 57.0;
  float qi = floor(q); float qf = fract(q);
  float load = mix(h11(qi), h11(qi + 1.0), smoothstep(0.0, 1.0, qf));
  // the outline: a round head where it touched down, the full width, a little narrower as it's lifted; the edges wander
  float wob = 1.0 + 0.16 * (vnoise(vec2(s * 4.0, seed * 19.0)) - 0.5) + 0.07 * (vnoise(vec2(s * 21.0, seed * 7.0)) - 0.5);
  float hd = max(0.0, 0.1 - s) / 0.1;
  float head = sqrt(max(0.0, 1.0 - hd * hd));
  float w = head * mix(1.0, 0.72, smoothstep(0.5, 1.0, s)) * wob;
  float side = 1.0 - smoothstep(w - aaR, w + aaR, abs(r));
  float ends = smoothstep(-aaS, aaS, s) * (1.0 - smoothstep(1.0 - aaS * 2.0, 1.0, s));
  // dry brush: toward the lift the paint gives out bristle by bristle
  float run = smoothstep(0.25, 1.0, s) * dry;
  float gaps = smoothstep(run - 0.1, run + 0.06, load * 0.8 + 0.2 * vnoise(vec2(q * 1.7, s * 14.0 + seed * 9.0)));
  float cover = side * ends * gaps;
  // the relief: full along the middle, grooved by the bristles, a lip at each edge, a ridge where it was lifted
  float body = sqrt(max(0.0, 1.0 - (r * r) / max(w * w, 1e-3)));
  float groove = 0.5 + 0.5 * cos(qf * 6.2832);
  float lip = exp(-pow((abs(r) - w * 0.84) / (0.13 * w + 0.03), 2.0));
  float lift = exp(-pow((s - 0.9) / 0.07, 2.0)) * (1.0 - 0.6 * dry);
  float blob = exp(-pow((s - 0.06) / 0.07, 2.0));
  float h = (0.55 * body + 0.2 * lip + 0.1 * groove * load + 0.22 * lift + 0.2 * blob) * (1.0 - 0.35 * s) * (0.6 + 0.4 * load);
  return vec3(cover, h, load);
}
`;

export type Layer = {
  /** the grid's cell, in Q units */ cell: number;
  /** a stroke's length and width in cells (length at most 2.2: a stroke must stay inside its 3 x 3 cells) */ len: [number, number]; wid: number;
  /** how far each stroke turns off the form's way, radians */ spread: number;
  /** how much it runs dry toward its end, 0..1 */ dry: number;
  /** how much each stroke's colour wanders: its value, and its hue (toward lilac one way, turquoise the other) */ vary: number; hue?: number;
  /** drawn only where the sample asks for detail (its way's angle carries 20 x 8ths of it: v3/oil-land.ts's skyAt) */ masked?: boolean;
  /** a grid of long cells (width, height in Q) for strokes all one way (`orient`, radians): long straight strokes down a
   *  door's stiles; the layer draws only the strokes whose form runs within 0.4 radians of that way. `cell` is unused */
  cellXY?: [number, number]; orient?: number;
};

/**
 * `draw`, when given, names a `vec2 draw(vec2 c)`: how much of the stroke whose middle is c is laid yet (0 none, 1 all:
 * it is drawn from its head to its tail, as a brush lays it) and how wet it still is (the field leaves that in gWet,
 * which the shader declares).
 * A field: `vec4 NAME(vec2 Q, vec3 base)` paints the point Q over `base` (the underpainting) and gives (rgb, height).
 * `sample` names a `vec4 sample(vec2 c)` the caller defines: what lies under the stroke whose middle is c, its colour
 * (rgb) and the way its form runs there (w, radians). Each stroke's colour is the one under its middle: so a shadow's
 * or a field's edge falls between strokes, as it does in a painting, instead of cutting across them.
 */
export function field(name: string, sample: string, layers: Layer[], draw?: string): string {
  const body = layers.map((L, l) => {
    const cx = L.cellXY ? L.cellXY[0] : L.cell, cy = L.cellXY ? L.cellXY[1] : L.cell;
    const cl = Math.max(cx, cy), cs = Math.min(cx, cy);
    const only = L.orient === undefined ? "" : `{ float dv = abs(mod(sm.w - 20.0 * kq - ${L.orient.toFixed(4)} + 1.5708, 3.14159) - 1.5708); if (dv > 0.4) { continue; } }`;
    return /* glsl */ `
  {
    vec2 c2 = vec2(${cx.toFixed(5)}, ${cy.toFixed(5)});
    vec2 gi = floor(Q / c2);
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 cell = gi + vec2(float(i), float(j));
        vec4 hh = h42(cell + vec2(${(l * 17.31 + 3.7).toFixed(2)}, ${(l * 5.13 + 1.1).toFixed(2)}));
        vec2 cen = (cell + 0.5 + (hh.xy - 0.5) * 0.85) * c2;
        ${draw ? `vec2 dw = ${draw}(cen); if (dw.x <= 0.0) { continue; }` : ""}
        vec4 sm = ${sample}(cen);
        float kq = floor(sm.w / 20.0 + 0.5);
        ${only}
        ${L.masked ? "if (kq / 8.0 < fract(hh.y * 5.31 + hh.w)) { continue; }" : ""}
        float ang = sm.w - 20.0 * kq + (hh.z - 0.5) * ${L.spread.toFixed(3)};
        float len = ${cl.toFixed(5)} * (${L.len[0].toFixed(3)} + ${(L.len[1] - L.len[0]).toFixed(3)} * hh.w);
        float wid = ${cs.toFixed(5)} * ${L.wid.toFixed(3)} * (0.85 + 0.3 * fract(hh.z * 7.13));
        vec2 ax = vec2(cos(ang), sin(ang));
        vec2 dd = Q - cen;
        float s = dot(dd, ax) / len + 0.5;
        float r = dot(dd, vec2(-ax.y, ax.x)) / (wid * 0.5);
        if (s < -0.05 || s > 1.05 || abs(r) > 1.25) { continue; }
        float seed = fract(hh.w * 13.7 + hh.x * 3.1);
        vec3 b = brush(s, r, seed, ${L.dry.toFixed(3)}, px / (wid * 0.5), px / len);
        ${draw ? "b.x *= 1.0 - smoothstep(dw.x * 1.15 - 0.08, dw.x * 1.15, s);" : ""}
        if (b.x < 0.004) { continue; }
        float v = (fract(hh.y * 9.37) - 0.5) * ${L.vary.toFixed(3)};
        float hv2 = (fract(hh.x * 4.71 + hh.z * 2.3) - 0.5) * ${(L.hue ?? 0).toFixed(3)};
        vec3 col = sm.rgb * (1.0 + v) + (hv2 > 0.0 ? vec3(0.5, -0.2, 0.6) : vec3(-0.5, 0.25, 0.15)) * abs(hv2);
        col *= 0.95 + 0.1 * b.z;
        float pr = ${l.toFixed(1)} + fract(hh.x * 31.7 + hh.y * 17.3);
        float hgt = b.y * wid * 0.16;
        float wt = ${draw ? "dw.y" : "0.0"};
        if (pr > bP) { sC = bC; sA = bA; sH = bH; sP = bP; sW = bW; bC = col; bA = b.x; bH = hgt; bP = pr; bW = wt; }
        else if (pr > sP) { sC = col; sA = b.x; sH = hgt; sP = pr; sW = wt; }
      }
    }
  }`;
  }).join("\n");
  return /* glsl */ `
vec4 ${name}(vec2 Q, vec3 base, float px) {
  vec3 bC = base; float bA = 0.0; float bH = 0.0; float bP = -1.0; float bW = 0.0;
  vec3 sC = base; float sA = 0.0; float sH = 0.0; float sP = -1.0; float sW = 0.0;
  ${body}
  vec3 col = mix(mix(base, sC, sA), bC, bA);
  float hgt = mix(sH * sA, bH, bA);
  ${draw ? "gWet = mix(sW * sA, bW, bA);" : ""}
  return vec4(col, hgt);
}`;
}

/**
 * The paint's relief, lit: `vec3 relief(vec3 col, float hgt, vec2 Q, float wet)`. The height's slope in Q (from its
 * screen derivatives, so it holds at any resolution) tilts the canvas's normal; one light from the upper left (Q's x
 * right, y up) lights each ridge's near side and shades its far one, and a wet glint where it faces the light.
 */
export const RELIEF = /* glsl */ `
vec3 relief(vec3 col, float hgt, vec2 Q, float wet) {
  vec2 qx = dFdx(Q); vec2 qy = dFdy(Q);
  float hx = dFdx(hgt); float hy = dFdy(hgt);
  float det = qx.x * qy.y - qx.y * qy.x;
  vec2 g = vec2(0.0);
  if (abs(det) > 1e-14) { g = vec2(hx * qy.y - hy * qx.y, hy * qx.x - hx * qy.x) / det; }
  g = clamp(g, vec2(-2.5), vec2(2.5));
  vec3 n = normalize(vec3(-g.x, -g.y, 1.0));
  vec3 L = normalize(vec3(-0.55, 0.6, 0.62));
  float diff = dot(n, L) - L.z;
  vec3 hv = normalize(L + vec3(0.0, 0.0, 1.0));
  float sp = pow(max(dot(n, hv), 0.0), 36.0);
  float lum = dot(col, vec3(0.3, 0.55, 0.15));
  return col * (1.0 + 0.5 * diff) + vec3(1.0, 0.97, 0.9) * sp * wet * (0.2 + 0.3 * lum);
}
`;

/** the canvas's weave, where the paint is thin: a fine linen, a hair lighter on the threads' tops */
export const WEAVE = /* glsl */ `
float weave(vec2 p) {
  vec2 f = fract(p); vec2 i = floor(p);
  float a = mod(i.x + i.y, 2.0);
  float th = mix(sin(f.x * 3.1416), sin(f.y * 3.1416), a);
  return th * (0.85 + 0.3 * h21(i));
}
`;
