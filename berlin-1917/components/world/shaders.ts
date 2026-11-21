// The world's surface shaders (WESL `surface` hooks over Bevy's lit StandardMaterial), one per baked material:
// facade, glass, ground, water (tools/world/bake.ts). They read the surface's kind from the vertex colour's alpha
// (facade.ts SURF and GLASS, bake.ts GSURF) and its frame from uv, so a whole tile is four draws.
// Every look the SOP asks for is here, and only here: soot streaks from the cornices, damp rising from the pavement,
// snow on every upward face, lit rooms behind lace (interior mapping), wet setts. Uniforms set the weather per shot.

const NOISE = /* wgsl */ `
fn h21(p: vec2<f32>) -> f32 {
  var q = fract(p * vec2<f32>(0.1031, 0.1030));
  q = q + dot(q, q.yx + 33.33);
  return fract((q.x + q.y) * q.x);
}
fn h22(p: vec2<f32>) -> vec2<f32> {
  var q = fract(vec3<f32>(p.x, p.y, p.x) * vec3<f32>(0.1031, 0.1030, 0.0973));
  q = q + dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy);
}
fn vn2(p: vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2<f32>(1.0, 0.0)), u.x), mix(h21(i + vec2<f32>(0.0, 1.0)), h21(i + vec2<f32>(1.0, 1.0)), u.x), u.y);
}
fn fbm2(p: vec2<f32>) -> f32 {
  var a = 0.5;
  var s = 0.0;
  var q = p;
  for (var k = 0; k < 4; k = k + 1) {
    s = s + a * vn2(q);
    q = q * 2.03 + vec2<f32>(1.7, 9.2);
    a = a * 0.5;
  }
  return s;
}
/** A slanted bump of the normal from a height field h sampled at p with its two neighbours along t and b. */
fn bumped(n: vec3<f32>, t: vec3<f32>, b: vec3<f32>, h0: f32, ht: f32, hb: f32, k: f32) -> vec3<f32> {
  return normalize(n - k * ((ht - h0) * t + (hb - h0) * b));
}
fn kind20(a: f32) -> i32 { return i32(floor(a * 255.0 / 20.0)); }
`;

/** Weather shared by every world shader. snow 0..1 (how much lies), wet 0..1 (how wet the stone is), soot 0..1. */
export type Weather = { snow: number; wet: number; soot: number; damp: number };
export const WINTER_DUSK: Weather = { snow: 0.8, wet: 0.5, soot: 0.8, damp: 0.7 };

export const FACADE = NOISE + /* wgsl */ `
fn snowOn(n: vec3<f32>, wp: vec3<f32>) -> f32 {
  let cover = smoothstep(0.3, 0.6, fbm2(wp.xz * 1.9) * 0.7 + 0.45 * u_snow());
  return u_snow() * smoothstep(0.55, 0.85, n.y) * cover;
}
fn surface(in: VertexOutput, pbr: ptr<function, PbrInput>) {
  if (dot(in.world_position.xyz, u_clip().xyz) > u_clip().w) { discard; } // a section's cut (City clip): what lies on the camera's side of the plane goes
  let bc = in.color; // the vertex colour itself: an opaque material's base_color has its alpha forced to 1
  let kind = kind20(bc.a);
  let uv = in.uv;
  let wp = in.world_position.xyz;
  var n = normalize((*pbr).N);
  let up = vec3<f32>(0.0, 1.0, 0.0);
  var t = cross(up, n);
  if (length(t) < 0.1) { t = vec3<f32>(1.0, 0.0, 0.0); }
  t = normalize(t);
  let b = normalize(cross(n, t));
  var col = bc.rgb;
  var rough = 0.92;
  var metal = 0.0;
  var emit = vec3<f32>(0.0);
  let big = fbm2(uv * vec2<f32>(0.21, 0.17));
  let streakN = fbm2(vec2<f32>(uv.x * 2.3, uv.y * 0.09));
  let streak = smoothstep(0.5, 0.78, streakN) * (0.2 + 0.4 * smoothstep(3.0, 20.0, uv.y));
  let dampEdge = 1.1 + 0.8 * vn2(vec2<f32>(uv.x * 1.1, 7.0));
  let damp = (1.0 - smoothstep(0.35, dampEdge, uv.y)) * 0.5;
  let crown = smoothstep(14.0, 21.5, uv.y) * 0.25 * fbm2(uv * vec2<f32>(0.9, 0.6));
  let grime = clamp(u_soot() * (streak + crown) + u_damp() * damp, 0.0, 0.72);
  if (kind <= 1 || kind == 9) {
    // lime plaster: mottled, repaired in patches, with a fine trowel grain
    let fine = vn2(uv * 11.0) * 0.6 + vn2(uv * 37.0) * 0.4;
    let patchy = smoothstep(0.62, 0.66, fbm2(uv * 0.45 + vec2<f32>(3.1, 1.3)));
    col = col * (0.84 + 0.22 * big + 0.1 * (fine - 0.5)) * (1.0 - 0.08 * patchy);
    col = col * (1.0 - grime);
    let h0 = vn2(uv * 23.0);
    n = bumped(n, t, b, h0, vn2(uv * 23.0 + vec2<f32>(0.04, 0.0)), vn2(uv * 23.0 + vec2<f32>(0.0, 0.04)), 0.9);
    if (kind == 1) {
      // rustication: a groove every 0.42 m, the blocks' joints staggered
      let row = uv.y / 0.42;
      let fy = fract(row);
      let jx = fract(uv.x / 1.15 + 0.5 * floor(row));
      let gy = 1.0 - smoothstep(0.0, 0.07, min(fy, 1.0 - fy));
      let gx = 1.0 - smoothstep(0.0, 0.03, min(jx, 1.0 - jx));
      let groove = max(gy, gx);
      col = col * (1.0 - 0.5 * groove);
      n = normalize(n + 0.6 * groove * (select(-b, b, fy < 0.5)));
    }
    if (kind == 9) {
      // a distant front: its window grid drawn, a share of the rooms lit
      let cell = vec2<f32>(uv.x / 2.8, (uv.y - 1.3) / 3.8);
      let id = floor(cell);
      let f = fract(cell);
      let isWin = step(abs(f.x - 0.5), 0.21) * step(0.22, f.y) * step(f.y, 0.82) * step(1.6, uv.y) * step(uv.y, 20.0);
      let lit = step(h21(id + vec2<f32>(17.0, 3.0)), u_lit());
      col = mix(col, vec3<f32>(0.02, 0.022, 0.026), isWin);
      rough = mix(rough, 0.15, isWin);
      emit = isWin * lit * u_lamp() * 0.5 * vec3<f32>(1.0, 0.62, 0.3) * (0.6 + 0.4 * h21(id));
    }
  } else if (kind == 2) {
    // sandstone and stucco trim
    let m = vn2(uv * 5.0) * 0.5 + vn2(uv * 19.0) * 0.5;
    col = col * (0.88 + 0.2 * m) * (1.0 - 0.8 * grime);
    rough = 0.82;
    n = bumped(n, t, b, m, vn2(uv * 19.0 + vec2<f32>(0.05, 0.0)), vn2(uv * 19.0 + vec2<f32>(0.0, 0.05)), 0.4);
  } else if (kind == 3) {
    // brick: Berlin's yellow and red stock in English bond, sooted
    let bw = 0.25;
    let bh = 0.0775;
    let row = floor(uv.y / bh);
    let off = select(0.0, 0.5, i32(row) % 2 == 1);
    let bx = uv.x / bw + off;
    let id = vec2<f32>(floor(bx), row);
    let f = vec2<f32>(fract(bx), fract(uv.y / bh));
    let joint = max(1.0 - smoothstep(0.0, 0.05, min(f.x, 1.0 - f.x)), 1.0 - smoothstep(0.0, 0.14, min(f.y, 1.0 - f.y)));
    let tone = 0.8 + 0.35 * h21(id) - 0.15 * vn2(uv * 3.0);
    col = mix(col * tone, vec3<f32>(0.32, 0.31, 0.29), joint) * (1.0 - 0.9 * grime);
    rough = 0.9;
    n = normalize(n - 0.35 * joint * n + 0.0 * t);
  } else if (kind == 4 || kind == 8 || kind == 10) {
    // painted wood: frames, shopfronts, doors, fascias; worn at the bottom rail
    let grain = vn2(vec2<f32>(uv.x * 3.0, uv.y * 40.0));
    col = col * (0.92 + 0.12 * grain) * (1.0 - 0.4 * grime);
    rough = select(0.48, 0.38, kind == 8);
    if (kind == 10) { col = col * (1.0 + 0.15 * smoothstep(0.45, 0.5, fract(uv.y * 2.0))); }
  } else if (kind == 5) {
    col = vec3<f32>(0.02, 0.02, 0.022);
    rough = 0.55;
    metal = 0.7;
  } else if (kind == 6) {
    // natural slate in courses, 0.22 m to the weather
    let row = floor(uv.y / 0.22);
    let sx = uv.x / 0.32 + 0.5 * (row % 2.0);
    let f = vec2<f32>(fract(sx), fract(uv.y / 0.22));
    let id = vec2<f32>(floor(sx), row);
    let edge = max(1.0 - smoothstep(0.0, 0.04, min(f.x, 1.0 - f.x)), 1.0 - smoothstep(0.0, 0.08, f.y));
    col = col * (0.75 + 0.4 * h21(id)) * (1.0 - 0.5 * edge);
    rough = 0.55 + 0.2 * h21(id + vec2<f32>(3.0, 1.0));
    n = normalize(n + 0.25 * edge * b);
  } else if (kind == 7) {
    col = col * (0.8 + 0.3 * fbm2(wp.xz * 0.7));
    rough = 0.8;
  } else if (kind == 11) {
    col = col * (0.85 + 0.2 * vn2(uv * 4.0));
    rough = 0.45;
    metal = 0.6;
  }
  let s = snowOn(n, wp) * step(-0.5, uv.y); // uv.y = -1 marks rails and wires: traffic keeps them clear
  col = mix(col, vec3<f32>(0.78, 0.8, 0.84) * (0.92 + 0.08 * vn2(wp.xz * 9.0)), s);
  rough = mix(rough, 0.62, s);
  metal = mix(metal, 0.0, s);
  (*pbr).material.base_color = vec4<f32>(col, 1.0);
  (*pbr).material.perceptual_roughness = rough;
  (*pbr).material.metallic = metal;
  (*pbr).material.emissive = vec4<f32>(emit * u_nits(), 1.0);
  (*pbr).N = n;
}
`;

export const GLASS = NOISE + /* wgsl */ `
fn surface(in: VertexOutput, pbr: ptr<function, PbrInput>) {
  if (dot(in.world_position.xyz, u_clip().xyz) > u_clip().w) { discard; } // a section's cut (City clip): what lies on the camera's side of the plane goes
  let bc = in.color; // the vertex colour itself: an opaque material's base_color has its alpha forced to 1
  let gk = i32(floor(bc.a * 255.0 / 40.0)); // 0 room, 1 shop, 2 stair, 3 cellar, 4 dormer, 5 door
  let seed = bc.rgb;
  let n = normalize(in.world_normal);
  let V = normalize((*pbr).V);
  var t = cross(vec3<f32>(0.0, 1.0, 0.0), n);
  if (length(t) < 0.1) { t = vec3<f32>(1.0, 0.0, 0.0); }
  t = normalize(t);
  let bv = vec3<f32>(0.0, 1.0, 0.0);
  let uv = in.uv;
  // window size in metres by kind (the room is drawn in the window's own units)
  var size = vec2<f32>(1.3, 2.3);
  if (gk == 1) { size = vec2<f32>(2.4, 2.8); }
  if (gk == 3) { size = vec2<f32>(0.9, 0.5); }
  if (gk == 4) { size = vec2<f32>(1.1, 1.6); }
  if (gk == 5) { size = vec2<f32>(1.7, 0.7); }
  let d = -V;
  let dt = vec3<f32>(dot(d, t) / size.x, dot(d, bv) / size.y, max(dot(d, -n), 0.02) / size.x);
  let o = vec3<f32>(uv.x, uv.y, 0.0);
  // the room behind: wider and taller than the window, 3.5 windows deep
  let lo = vec3<f32>(-0.9, -0.42, 0.0);
  let hi = vec3<f32>(1.9, 1.22, 3.5);
  let tx = (select(lo.x, hi.x, dt.x > 0.0) - o.x) / dt.x;
  let ty = (select(lo.y, hi.y, dt.y > 0.0) - o.y) / dt.y;
  let tz = (hi.z - o.z) / dt.z;
  let tm = min(tx, min(ty, tz));
  let h = o + dt * tm;
  let lit = h21(seed.xy * 97.0) < select(u_lit(), u_lit_shop(), gk == 1);
  let warm = vec3<f32>(1.0, 0.6, 0.28);
  // wallpaper, floor, ceiling
  let hue = h21(seed.yz * 31.0);
  var paper = mix(vec3<f32>(0.32, 0.36, 0.26), vec3<f32>(0.5, 0.36, 0.22), hue);
  paper = mix(paper, vec3<f32>(0.42, 0.22, 0.2), step(0.75, h21(seed.zx * 13.0)));
  var c = vec3<f32>(0.0);
  if (tm == tz) {
    let stripe = 0.86 + 0.14 * step(0.5, fract(h.x * 5.0));
    c = paper * stripe;
    // a picture frame and a dark sideboard on the back wall
    let pic = step(abs(h.x - 0.5 - (seed.x - 0.5)), 0.22) * step(abs(h.y - 0.72), 0.14);
    c = mix(c, vec3<f32>(0.08, 0.06, 0.04), pic * 0.8);
    c = mix(c, vec3<f32>(0.05, 0.035, 0.025), step(h.y, -0.05) * step(0.4, seed.y));
  } else if (tm == tx) {
    c = paper * 0.7 * (0.86 + 0.14 * step(0.5, fract(h.z * 1.5)));
    c = mix(c, vec3<f32>(0.04, 0.03, 0.02), step(h.y, 0.15) * step(fract(h.z * 0.6 + seed.z), 0.5));
  } else if (dt.y < 0.0) {
    c = vec3<f32>(0.2, 0.12, 0.06) * (0.8 + 0.3 * step(0.5, fract(h.x * 6.0)));
  } else {
    c = vec3<f32>(0.6, 0.58, 0.54);
  }
  var light = 0.0;
  if (lit) {
    // one lamp hanging in the middle of the room; its light falls off to the corners
    let lamp = vec3<f32>(0.5, 1.0, 1.6);
    let dl = length((h - lamp) * vec3<f32>(1.0, 1.8, 0.7));
    light = u_lamp() * (0.25 + 1.1 / (1.0 + dl * dl * 1.5));
  } else {
    light = u_dark();
  }
  var room = c * light * select(vec3<f32>(0.6, 0.7, 0.9), warm, lit);
  // a wartime shop: bare shelves with a few goods (bread, tins, paper packets), a dark counter; dim, rationed light
  if (gk == 1) {
    let shelfY = fract(h.y * 3.2);
    let cell = floor(vec2<f32>(h.x * 6.0 + h.z * 6.0, h.y * 3.2)) + seed.xy * 17.0;
    let stocked = step(h21(cell), 0.3) * step(0.12, shelfY) * step(shelfY, 0.62);
    let goods = mix(vec3<f32>(0.3, 0.18, 0.08), vec3<f32>(0.5, 0.47, 0.4), h21(cell + vec2<f32>(5.0, 1.0)));
    var shop = mix(vec3<f32>(0.2, 0.17, 0.13), vec3<f32>(0.12, 0.08, 0.05), step(0.88, shelfY));
    shop = mix(shop, goods, stocked * select(0.0, 1.0, tm == tz || tm == tx));
    shop = mix(shop, vec3<f32>(0.06, 0.04, 0.03), step(h.z, 1.0) * step(h.y, 0.2)); // the counter
    room = shop * light * select(vec3<f32>(0.6, 0.7, 0.9), warm, lit) * 0.7;
  }
  // lace in the middle, drapes at the sides (not in shops, cellars or doors)
  if (gk == 0 || gk == 4) {
    let lace = 0.55 + 0.45 * vn2(uv * vec2<f32>(60.0, 90.0)) * vn2(uv * 9.0);
    let drapeW = 0.12 + 0.08 * seed.z;
    let drape = step(uv.x, drapeW) + step(1.0 - drapeW, uv.x);
    let laceCol = select(vec3<f32>(0.5, 0.52, 0.55) * u_dark() * 2.0, warm * light * 0.9, lit);
    room = mix(room, laceCol * lace, 0.55 * (1.0 - drape) * step(0.3, seed.y));
    let drapeCol = mix(vec3<f32>(0.25, 0.08, 0.06), vec3<f32>(0.12, 0.16, 0.1), seed.x) * select(u_dark(), light * 0.5, lit);
    room = mix(room, drapeCol * (0.7 + 0.3 * sin(uv.x * 90.0)), drape);
  }
  if (gk == 3) { room = vec3<f32>(0.0); }
  if (gk == 5) { room = room * 0.3; }
  // the glazing bars (drawn as well as built: the far levels have no bars of their own)
  let bar = max(step(abs(uv.x - 0.5), 0.022), step(abs(uv.y - 0.72), 0.02)) * select(1.0, 0.0, gk == 1 || gk == 3);
  room = mix(room, vec3<f32>(0.02), bar);
  // the sky and the street reflected, by Fresnel
  let cosT = clamp(dot(n, V), 0.0, 1.0);
  let F = 0.04 + 0.96 * pow(1.0 - cosT, 5.0);
  let r = reflect(-V, n);
  var sky = mix(u_sky_hor().rgb, u_sky_top().rgb, clamp(r.y * 2.5, 0.0, 1.0));
  sky = mix(sky * 0.18, sky, smoothstep(0.05, 0.3, r.y));
  let wave = 0.97 + 0.06 * vn2(uv * vec2<f32>(3.0, 1.5) + seed.xy * 10.0); // old cylinder glass isn't flat
  let outc = room * (1.0 - F) + sky * F * wave;
  (*pbr).material.base_color = vec4<f32>(0.0, 0.0, 0.0, 1.0);
  (*pbr).material.perceptual_roughness = 0.06;
  (*pbr).material.metallic = 0.0;
  (*pbr).material.emissive = vec4<f32>(outc * u_nits(), 1.0); // into the scene's light units (cd/m2)
}
`;

export const GROUND = NOISE + /* wgsl */ `
// The street floor in winter (world/SOP.md §3, §5.2). The bake writes, per vertex: r = metres in from the building
// line over 12, g/b = cos/sin of twice the street's direction, a = the kind (0 setts, 1 asphalt, 2 sidewalk, 3 kerb,
// 4 court, 5 green, 6 rail, 7 quay, 8 bridge, 9 bed). Snow is banked in the gutters, trodden to slush along the
// traffic, swept off the sidewalks (the porters' duty) and gritted with ash; courts keep theirs, paths trodden.
fn surface(in: VertexOutput, pbr: ptr<function, PbrInput>) {
  if (dot(in.world_position.xyz, u_clip().xyz) > u_clip().w) { discard; } // a section's cut (City clip): what lies on the camera's side of the plane goes
  let vc = in.color;
  let kind = kind20(vc.a);
  let p = in.world_position.xz;
  let inM = vc.r * 12.0;
  let th = 0.5 * atan2(vc.b * 2.0 - 1.0, vc.g * 2.0 - 1.0);
  let dir = vec2<f32>(cos(th), -sin(th)); // map (e, n) to scene (x, z)
  let along = dot(p, dir);
  let across = dot(p, vec2<f32>(-dir.y, dir.x));
  var col = vec3<f32>(0.3);
  var rough = 0.85;
  var snow = 0.0;
  var slush = 0.0;
  if (kind == 0 || kind == 8) {
    // granite setts in courses across the street, 0.16 along by 0.2 across, staggered
    let q = vec2<f32>(across / 0.2, along / 0.16);
    let row = floor(q.y);
    let id = vec2<f32>(floor(q.x + 0.5 * (row % 2.0)), row);
    let f = fract(vec2<f32>(q.x + 0.5 * (row % 2.0), q.y)) - 0.5;
    let crown = 1.0 - smoothstep(0.34, 0.5, max(abs(f.x), abs(f.y)));
    col = mix(vec3<f32>(0.19, 0.19, 0.2), vec3<f32>(0.33, 0.31, 0.29), h21(id)) * (0.85 + 0.2 * vn2(p * 0.5));
    col = mix(vec3<f32>(0.07, 0.065, 0.06), col, crown);
    rough = mix(0.95, 0.55, crown);
  } else if (kind == 1) {
    col = vec3<f32>(0.08, 0.078, 0.08) * (0.85 + 0.3 * fbm2(p * 0.7));
    rough = 0.7;
  } else if (kind == 2 || kind == 7) {
    // granite slabs, 1.0 by 0.66, with the Berlin mosaic strip between them and the house
    let q = vec2<f32>(across / 1.0, along / 0.66);
    let f = fract(q);
    let joint = max(1.0 - smoothstep(0.0, 0.012, min(f.x, 1.0 - f.x)), 1.0 - smoothstep(0.0, 0.018, min(f.y, 1.0 - f.y)));
    col = vec3<f32>(0.4, 0.39, 0.38) * (0.86 + 0.2 * h21(floor(q))) * (0.9 + 0.15 * vn2(p * 4.0));
    let mosaic = 1.0 - step(1.1, inM);
    col = mix(col, vec3<f32>(0.22, 0.22, 0.23) * (0.7 + 0.6 * h21(floor(p * 9.0))), mosaic);
    col = mix(col, vec3<f32>(0.14, 0.13, 0.12), joint * (1.0 - mosaic));
    rough = 0.8;
  } else if (kind == 3) {
    col = vec3<f32>(0.48, 0.48, 0.47) * (0.85 + 0.2 * vn2(p * 3.0));
    rough = 0.7;
  } else if (kind == 4) {
    let q = p / 0.18;
    let crown = 1.0 - smoothstep(0.3, 0.5, max(abs(fract(q.x) - 0.5), abs(fract(q.y) - 0.5)));
    col = mix(vec3<f32>(0.1, 0.09, 0.08), vec3<f32>(0.28, 0.27, 0.25) * (0.8 + 0.4 * h21(floor(q))), crown);
  } else if (kind == 5) {
    col = mix(vec3<f32>(0.16, 0.14, 0.08), vec3<f32>(0.1, 0.11, 0.06), vn2(p * 2.0));
    rough = 0.95;
  } else if (kind == 6) {
    col = vec3<f32>(0.22, 0.2, 0.18) * (0.7 + 0.5 * vn2(p * 12.0));
    rough = 0.95;
  } else {
    col = vec3<f32>(0.05, 0.045, 0.04);
  }
  let S = u_snow();
  if (kind == 0 || kind == 1 || kind == 8) {
    // the carriageway: a bank along each gutter, then trodden snow streaked along the traffic, slush in the ruts
    let bank = smoothstep(2.9, 3.7, inM) * (1.0 - smoothstep(4.3, 6.2 + 1.5 * vn2(vec2<f32>(along * 0.15, 3.0)), inM));
    let streak = fbm2(vec2<f32>(along * 0.035, inM * 1.3));
    let ruts = smoothstep(0.42, 0.62, streak);
    snow = max(bank * (0.75 + 0.25 * vn2(p * 1.3)), (1.0 - ruts) * 0.55 * smoothstep(5.0, 6.5, inM));
    slush = ruts * smoothstep(4.5, 6.0, inM);
    // horse droppings, trodden in, on the traffic lanes (who left it: the city's horses)
    let dung = step(0.985, h21(floor(vec2<f32>(along * 1.6, inM * 2.2)))) * smoothstep(5.0, 7.0, inM);
    col = mix(col, vec3<f32>(0.12, 0.08, 0.04), dung * 0.8);
  } else if (kind == 2 || kind == 7) {
    // swept, the sweepings heaped at the kerb and against the house; ash strewn on what froze
    let heap = max(1.0 - smoothstep(0.15, 0.5, inM), smoothstep(2.6, 3.2, inM) * (1.0 - smoothstep(3.4, 3.6, inM)));
    snow = heap * (0.6 + 0.4 * vn2(p * 2.0));
    let ash = smoothstep(0.62, 0.7, fbm2(p * 1.7 + vec2<f32>(4.0, 9.0))) * (1.0 - heap);
    col = mix(col, vec3<f32>(0.11, 0.105, 0.1), ash * 0.7);
  } else if (kind == 3) {
    snow = 0.5 * smoothstep(0.4, 0.6, vn2(p * 3.0));
  } else if (kind == 4) {
    // a Hinterhof: snow lies but for the paths to the doors and the bins
    snow = 1.0 - 0.8 * smoothstep(0.45, 0.6, fbm2(p * 0.6 + vec2<f32>(2.0, 7.0)));
  } else if (kind == 5 || kind == 6) {
    snow = 0.95;
  }
  snow = snow * S;
  slush = slush * S;
  let wet = u_wet();
  col = col * mix(1.0, 0.6, wet);
  let dirty = mix(vec3<f32>(0.82, 0.83, 0.86), vec3<f32>(0.55, 0.53, 0.5), 0.35 + 0.4 * vn2(p * 0.8));
  col = mix(col, dirty * (0.92 + 0.08 * vn2(p * 11.0)), snow);
  col = mix(col, vec3<f32>(0.2, 0.19, 0.17), slush * 0.7);
  let puddle = wet * slush * smoothstep(0.55, 0.65, fbm2(p * 0.9 + vec2<f32>(11.0, 4.0)));
  rough = mix(rough * mix(1.0, 0.6, wet), 0.7, snow);
  rough = mix(rough, 0.25, slush * wet);
  rough = mix(rough, 0.04, puddle);
  (*pbr).material.base_color = vec4<f32>(col, 1.0);
  (*pbr).material.perceptual_roughness = clamp(rough, 0.03, 1.0);
  (*pbr).material.metallic = 0.0;
}
`;

export const WATER = NOISE + /* wgsl */ `
fn surface(in: VertexOutput, pbr: ptr<function, PbrInput>) {
  if (dot(in.world_position.xyz, u_clip().xyz) > u_clip().w) { discard; } // a section's cut (City clip): what lies on the camera's side of the plane goes
  let p = in.world_position.xz;
  let ice = smoothstep(0.5, 0.56, fbm2(p * 0.08) * 0.7 + fbm2(p * 0.6) * 0.3 + 0.25 * u_ice() - 0.12);
  let ripple = vec3<f32>(vn2(p * 3.0 + vec2<f32>(0.0, 1.0)) - 0.5, 0.0, vn2(p * 3.0 + vec2<f32>(7.0, 2.0)) - 0.5);
  var n = normalize(vec3<f32>(0.0, 1.0, 0.0) + 0.06 * ripple * (1.0 - ice));
  let iceCol = vec3<f32>(0.55, 0.6, 0.64) * (0.8 + 0.25 * vn2(p * 2.0)) + vec3<f32>(0.2) * smoothstep(0.6, 0.8, fbm2(p * 1.3));
  (*pbr).material.base_color = vec4<f32>(mix(vec3<f32>(0.012, 0.02, 0.024), iceCol, ice), 1.0);
  (*pbr).material.perceptual_roughness = mix(0.04, 0.45, ice);
  (*pbr).material.metallic = 0.0;
  (*pbr).N = n;
}
`;

/** The uniforms each world shader reads, for a shot's light and weather. sky colours are linear rgb times nits. */
/** nits: what 1.0 of a window's light is in the scene's units (cd/m2), so a lit room reads against walls lit by the
 *  shot's sun and ambient: about 150 at dusk, 800 at an overcast noon (the sky in the glass). */
export function worldUniforms(w: Weather & { lit: number; litShop: number; lamp: number; dark: number; skyTop: number[]; skyHor: number[]; ice: number; nits: number }, clip: number[] = NO_CLIP) {
  return {
    facade: { snow: w.snow, soot: w.soot, damp: w.damp, lit: w.lit, lamp: w.lamp, nits: w.nits, clip },
    glass: { lit: w.lit, lit_shop: w.litShop, lamp: w.lamp, dark: w.dark, sky_top: [...w.skyTop, 1], sky_hor: [...w.skyHor, 1], nits: w.nits, clip },
    ground: { snow: w.snow, wet: w.wet, clip },
    water: { ice: w.ice, clip },
  };
}
/** A section's cut, as every world shader reads it: (normal, d), and a fragment with dot(world position, normal) > d is
 *  dropped. This one drops nothing. */
export const NO_CLIP = [0, 0, 0, 1];
/** The plane through `at` facing `toward` (a horizontal direction): what lies on that side of it is cut away. */
export function clipPlane(at: [number, number, number], toward: [number, number, number]): number[] {
  const l = Math.hypot(toward[0], toward[1], toward[2]), n = toward.map((v) => v / l);
  return [n[0], n[1], n[2], n[0] * at[0] + n[1] * at[1] + n[2] * at[2]];
}
