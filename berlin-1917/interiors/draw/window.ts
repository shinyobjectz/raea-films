// Interior mapping: a window pane that shows a room behind it with true parallax, at the cost of one flat quad. The
// ray from the eye enters the pane and is cut against the room's real box (the shell the atlas room was rendered in,
// interiors/sets/gallery.ts); the direction from the room's centre to that hit picks the cubemap face, because the
// faces were rendered from the centre. What stands against a wall lands where it really is. The room's light is baked
// into its faces, so a lit window glows by its own emissive and a dark one shows the day inside.
//
// Per pane today (a uniform each): which room, its size, where the pane sits in the front wall, how bright, mirrored
// or not, lace or not. The city's bake gives the same per vertex instead (SYSTEM.md, "Windows").
import { RECIPES } from "../../research/catalogue/rooms";
import { ATLAS, isFlat } from "../atlas";
import { LOFT } from "../attic";
import { SLICE } from "../cellars";
import { STAIR_WINDOW, stairDims } from "../stair";
import { shellFor } from "../furnish";
import { SHOP_PANE, shopShell } from "../shops";
import { DEPT_PANE } from "../department";
import { hash, type V3 } from "../kit/geo";
import type { Room, Set } from "../sets/types";

// The ray-cast both shaders share: p is where the view ray meets the pane, in room space (x 0..l along the back
// wall, y up from the floor, z from the back wall (0) to the window wall (d)); d is the ray; sz the room (l, h, d).
const ROOM_RAY = /* wgsl */ `
fn room_ray(p: vec3<f32>, d: vec3<f32>, sz: vec3<f32>, cam_y: f32, layer: i32) -> vec3<f32> {
  let dx = select(-1e-4, 1e-4, d.x >= 0.0) + d.x;
  let dy = select(-1e-4, 1e-4, d.y >= 0.0) + d.y;
  let tx = (select(0.0, sz.x, dx > 0.0) - p.x) / dx;
  let ty = (select(0.0, sz.y, dy > 0.0) - p.y) / dy;
  let tz = -p.z / min(d.z, -1e-4);
  let h = p + d * min(tx, min(ty, tz));
  let q = h - vec3<f32>(sz.x * 0.5, cam_y, sz.z * 0.5);
  let a = abs(q);
  // the faces as rendered: back looks -z (right +x, up +y); left -x (right -z); right +x (right +z);
  // floor -y (right +x, up -z); ceiling +y (right +x, up +z). Laid out as a cross in thirds.
  var f = vec2<f32>(0.0);
  var cell = vec2<f32>(1.0, 1.0);
  if (q.z < 0.0 && a.z >= a.x && a.z >= a.y) {
    f = vec2<f32>(q.x, q.y) / -q.z;
  } else if (a.x >= a.y) {
    if (q.x < 0.0) { f = vec2<f32>(-q.z, q.y) / -q.x; cell = vec2<f32>(0.0, 1.0); }
    else { f = vec2<f32>(q.z, q.y) / q.x; cell = vec2<f32>(2.0, 1.0); }
  } else {
    if (q.y < 0.0) { f = vec2<f32>(q.x, -q.z) / -q.y; cell = vec2<f32>(1.0, 2.0); }
    else { f = vec2<f32>(q.x, q.z) / q.y; cell = vec2<f32>(1.0, 0.0); }
  }
  let fuv = clamp(vec2<f32>(0.5 + 0.5 * f.x, 0.5 - 0.5 * f.y), vec2<f32>(0.003), vec2<f32>(0.997));
  return textureSampleLevel(tex_rooms, samp_rooms, (cell + fuv) / 3.0, layer, 0.0).rgb;
}
// the lace half-curtain over the lower casements, lit by the room; the reveal's shade at the pane's edges (pu, pv 0..1)
fn pane_finish(col0: vec3<f32>, pu: f32, pv: f32, lace_on: f32, glow: f32) -> vec3<f32> {
  let mesh = 0.6 + 0.4 * sin(pu * 190.0) * sin(pv * 150.0);
  let lace = lace_on * (1.0 - smoothstep(0.38, 0.41, pv)) * mesh;
  let col = mix(col0, vec3<f32>(0.86, 0.83, 0.75) * (0.15 + dot(col0, vec3<f32>(0.33)) * 1.6), clamp(lace, 0.0, 0.75));
  let edge = smoothstep(0.0, 0.08, min(min(pu, 1.0 - pu), min(pv, 1.0 - pv)));
  return col * glow * (0.35 + 0.65 * edge);
}
`;

/** A shop's window display stands just behind its glass, in front of where the cubemap sees from, so it's a card: the
 *  display rendered head-on with alpha (tools/interiors/displays.sh), drawn DISPLAY_DEPTH behind the glass over the room. A shader takes one texture array,
 *  so the cards ride in the rooms array after the rooms (tools/interiors/array.sh): ROOMS_LAYERS in all. `layer` in
    display() is the shop's card, cardLayer(atlas index). */
export const DISPLAY_DEPTH = 0.55;
export const FIRST_SHOP = ATLAS.find((a) => a.shop)!.n;
/** A shop room's display card: its place among the atlas's shops, in atlas order as array.sh stacks the cards (0 for
 *  a room that isn't a shop). Not `n - FIRST_SHOP`: the shops aren't numbered in one run (36-38 come after the
 *  offices), and that sent every bookshop, jeweller and florist in the city to the last card until 11-17. */
export const cardLayer = (n: number) => Math.max(0, ATLAS.filter((a) => a.shop).findIndex((a) => a.n === n));
export const SHOPS_IN_ATLAS = ATLAS.filter((a) => a.shop).length;
/** The rooms array's layer count. */
export const ROOMS_LAYERS = ATLAS.length + SHOPS_IN_ATLAS;
/** The rooms array as one file a layer, 768 px (tools/interiors/array.sh, assets/interiors/array/NN.png). Bind it as
 *  `{ layers: ROOMS_LAYER_FILES.map((f) => staticFile(f)) }`: nothing tall is made, so there's no cap on the count
 *  (t-iatlas040). The stacked `{ src: staticFile("interiors/rooms-array.png"), layers: ROOMS_LAYERS }` still works
 *  while it fits 32768 px, at a resolution that falls as rooms are added. */
export const ROOMS_LAYER_FILES = Array.from({ length: ROOMS_LAYERS }, (_, i) => `interiors/array/${String(i).padStart(2, "0")}.png`);
const DISPLAY_FN = /* wgsl */ `
fn display(p: vec3<f32>, d: vec3<f32>, sz: vec3<f32>, pane: vec2<f32>, sill: f32, layer: i32) -> vec4<f32> {
  let h = p + d * (${DISPLAY_DEPTH.toFixed(2)} / max(-d.z, 1e-4));
  let uv = vec2<f32>((h.x - sz.x * 0.5) / pane.x + 0.5, 1.0 - (h.y - sill) / pane.y);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { return vec4<f32>(0.0); }
  return textureSampleLevel(tex_rooms, samp_rooms, uv, ${ATLAS.length} + layer, 0.0);
}
`;

/** Per pane, a shop's: the room as WINDOW_WGSL, the display card over it (uniform `disp`: its layer). Texture: rooms. */
export const SHOP_WINDOW_WGSL = ROOM_RAY + DISPLAY_FN + /* wgsl */ `
fn surface(in: VertexOutput, pbr: ptr<function, PbrInput>) {
  let n = normalize(in.world_normal);
  let up = vec3<f32>(0.0, 1.0, 0.0);
  let t = normalize(cross(up, n));
  let wp = in.world_position.xyz;
  let v = normalize(wp - view.world_position);
  let sz = u_size();
  let pane = u_pane();
  let rel = wp - u_center();
  let lx = dot(rel, t) * u_flip();
  let ly = dot(rel, up);
  let p = vec3<f32>(sz.x * 0.5 + lx, u_sill() + pane.y * 0.5 + ly, sz.z);
  let d = vec3<f32>(dot(v, t) * u_flip(), dot(v, up), dot(v, n));
  let room = room_ray(p, d, sz, u_cam_y(), i32(u_room() + 0.5));
  let card = display(p, d, sz, pane, u_sill(), i32(u_disp() + 0.5));
  let col = mix(room, card.rgb, card.a);
  (*pbr).material.base_color = vec4<f32>(0.015, 0.016, 0.02, 1.0);
  (*pbr).material.emissive = vec4<f32>(pane_finish(col, lx / pane.x + 0.5, ly / pane.y + 0.5, 0.0, u_glow()) * u_tint(), 1.0);
}
`;

/** Per pane by uniforms: one material a pane (the test facade, a hero shot's few windows). */
export const WINDOW_WGSL = ROOM_RAY + /* wgsl */ `
fn surface(in: VertexOutput, pbr: ptr<function, PbrInput>) {
  let n = normalize(in.world_normal);
  let up = vec3<f32>(0.0, 1.0, 0.0);
  let t = normalize(cross(up, n));
  let wp = in.world_position.xyz;
  let v = normalize(wp - view.world_position);
  let sz = u_size();
  let pane = u_pane();
  let rel = wp - u_center();
  let lx = dot(rel, t) * u_flip();
  let ly = dot(rel, up);
  let p = vec3<f32>(sz.x * 0.5 + lx, u_sill() + pane.y * 0.5 + ly, sz.z);
  let d = vec3<f32>(dot(v, t) * u_flip(), dot(v, up), dot(v, n));
  let col = room_ray(p, d, sz, u_cam_y(), i32(u_room() + 0.5));
  (*pbr).material.base_color = vec4<f32>(0.015, 0.016, 0.02, 1.0);
  (*pbr).material.emissive = vec4<f32>(pane_finish(col, lx / pane.x + 0.5, ly / pane.y + 0.5, u_lace(), u_glow()) * u_tint(), 1.0);
}
`;

/** `tint`: the lamplight's colour over a lit room (petroleum and gas burn amber; the atlas faces read cream under AgX) */
export type PaneUniforms = { room: number; size: [number, number, number]; cam_y: number; sill: number; pane: [number, number]; glow: number; flip: number; lace: number; tint: [number, number, number] };
/** A lit window's lamplight over its room (a day or dark room takes white). */
export const LAMP_TINT: [number, number, number] = [1.0, 0.8, 0.56];

/** A pane's uniforms for atlas room `n`: the size and window of the very shell the atlas rendered (same recipe, seed). */
export function paneFor(n: number, glow: number, flip = 1, lace = 1): PaneUniforms {
  const a = ATLAS.find((x) => x.n === n)!;
  if (a.shop) {
    // the city's shop pane (SHOP_PANE: one bay of the world lane's shopfront), seen centred on the shop: tier 0 doesn't
    // place it off-centre, which a passer-by can't tell. The coal merchant's cellar is seen through its own window.
    const s = shopShell(a.shop, a.seed), w = (s.openings ?? []).find((o) => o.kind === "window");
    // a department store's rooms are rendered for the store's own glass (department.ts DEPT_PANE)
    const dp = DEPT_PANE[a.shop];
    const [sill, pw, ph] = dp ? [dp.sill, dp.w, dp.h] : w ? [w.y, w.w, w.h] : [SHOP_PANE.sill, SHOP_PANE.w, SHOP_PANE.h];
    return { room: n, size: [s.l, s.h, s.d], cam_y: 1.5, sill, pane: [pw, ph], glow, flip, lace: 0, tint: a.lit ? LAMP_TINT : [1, 1, 1] };
  }
  if (a.cellar) {
    // the compartment under a cellar window (interiors/cellars.ts SLICE): the window high in the front face
    const S = SLICE;
    return { room: n, size: [S.l, S.h, S.d], cam_y: S.cam_y, sill: S.window.sill, pane: [S.window.w, S.window.h], glow, flip, lace, tint: a.lit ? LAMP_TINT : [1, 1, 1] };
  }
  if (a.loft) {
    // the drying loft behind a dormer (interiors/attic.ts LOFT): the dormer low in the front, the cube's centre mid-room
    const L = LOFT;
    return { room: n, size: [L.l, L.h, L.d], cam_y: L.cam_y, sill: L.dormer.y, pane: [L.dormer.w, L.dormer.h], glow, flip, lace, tint: a.lit ? LAMP_TINT : [1, 1, 1] };
  }
  if (a.stair) {
    // the box the atlas rendered (interiors/sets/gallery.ts): one storey from the middle half-landing up, the window 0.9 m
    // over it. lace stays as given: the tile table reads 1 - lace as "a shop" (a display card), and a stair has none.
    const { B, d, H } = stairDims(a.stair, a.seed), w = STAIR_WINDOW[a.stair];
    return { room: n, size: [B, H, d], cam_y: 1.3, sill: 0.9, pane: [w.w, w.h], glow, flip, lace, tint: a.lit ? LAMP_TINT : [1, 1, 1] };
  }
  const sh = shellFor(RECIPES.find((r) => r.id === a.recipe)!, a.seed, true);
  const win = (sh.openings ?? []).find((o) => o.kind === "window")!;
  return { room: n, size: [sh.l, sh.h, sh.d], cam_y: Math.min(1.5, sh.h / 2), sill: win.y, pane: [win.w, win.h], glow, flip, lace, tint: a.lit ? LAMP_TINT : [1, 1, 1] };
}

/** The atlas rooms' boxes and windows, compiled into the tile shader (a function-scope array: WGSL indexes it at run
 *  time). Appending an atlas room changes this table; rebuild the materials that use it. */
function roomTable(drapes = false) {
  const rows = ATLAS.map((a) => paneFor(a.n, 1));
  // drapes (windowTileWgsl `drapes`): an office of state's or a hotel room's pane is w -1, its lined velvet and no lace; a
  // gute Stube's is w -2, the plush over-curtain each side of its lace
  const style = (i: number) => (!drapes ? null : ["ministry", "hotel-room"].includes(ATLAS[i].recipe ?? "") ? "-1.000" : ["petty-stube", "salon"].includes(ATLAS[i].recipe ?? "") ? "-2.000" : null); // -2: the gute Stube's and the bel étage salon's plush over lace
  const f = (x: number) => x.toFixed(3);
  return {
    n: rows.length,
    room: rows.map((r) => `vec4<f32>(${f(r.size[0])}, ${f(r.size[1])}, ${f(r.size[2])}, ${f(r.cam_y)})`).join(", "),
    win: rows.map((r, i) => `vec4<f32>(${f(r.sill)}, ${f(r.pane[0])}, ${f(r.pane[1])}, ${style(i) ?? f(1 - r.lace)})`).join(", "), // w: 1 for a shop (no lace)
  };
}

/** Per vertex, for the city's merged tile meshes (the world lane's bake). The glass's attributes:
 *    UV_0   pane-local: u 0 at the pane's left seen from the street, 1 at its right; v 0 at the sill, 1 at the head
 *    COLOR  r = atlas index / 255, g = lit-from hour / 24, b = lit-to hour / 24 (0, 0: dark all night),
 *           a = the bake's kind code (room 20, shop 60, stair 100, cellar 140, dormer 180, door 220; floor(a*255/40))
 *  Uniforms: hour (the clock at time 0), rate (hours per second of globals.time), glow_lit, glow_dark (lit hours over, or never lit, after dusk), glow_day (8:00-15:30).
 *  Mirroring and lace come from a hash of the pane (its colour and its normal). */
/** By day an open shop's window is lit by the day, not by its lamp: the display stands in the window's daylight just
 *  behind the glass, and the shop behind it is dimmer, as daylight falls off into a deep room. Both are glow_day
 *  times these (a dwelling's room by day is glow_day alone: lace and a deep room, so it reads dark from the street).
 *  Set by eye on the noon city (compositions/interior-noon.tsx), against a sunlit facade. */
export const DAY_SHOP_ROOM = 5, DAY_SHOP_CARD = 14;
/** `litCards`: the display card by day as the window's lit surface instead of a glow (windowTileWgsl), its albedo the card
 *  times this. Set on compositions/interior-windows.tsx facade-shops-noon-lit and -shade-lit against the wall's lime. */
export const CARD_ALBEDO = 4.0;
/** How far a room pane's glass stands back in the wall: tools/world/facade.ts window() builds a reveal of 0.22-0.25 m
 *  and sets the glass 5 cm out of its back, so 0.17-0.2 m. The reflection clears it, and LOD1 draws it (windowTileWgsl). */
export const REVEAL = 0.18;
/** `displays`: shops draw their display card (the cards are in the rooms array: give it ROOMS_LAYERS).
 *  `reflect`: the glass reflects the sky and the street by Fresnel, as the facade shader's own glazing does
 *  (components/world/shaders.ts), so a room's pane and an unassigned one read alike by day. It needs three more
 *  uniforms, the glass's own: sky_top and sky_hor (vec4, linear rgb), and nits (the sky's scale in cd/m2).
 *  `litCards`: by day a shop's display card is lit by the scene as a surface (CARD_ALBEDO), not a fixed glow, so it
 *  follows the facade into sun or shade. */
export function windowTileWgsl(opts: { displays?: boolean; reflect?: boolean; litCards?: boolean; drapes?: boolean } = {}): string {
  // since 11-17 10:45 the drapes and the lit display cards are the city's (City.tsx passes neither); a test passes false to compare
  opts = { litCards: true, drapes: true, ...opts };
  const t = roomTable(opts.drapes);
  return ROOM_RAY + (opts.displays ? DISPLAY_FN : "") + /* wgsl */ `
fn pane_hash(c: vec3<f32>, n: vec3<f32>) -> f32 {
  return fract(sin(dot(c * 97.0 + n * 13.0, vec3<f32>(12.9898, 78.233, 37.719))) * 43758.5453);
}
fn surface(in: VertexOutput, pbr: ptr<function, PbrInput>) {
  var rooms = array<vec4<f32>, ${t.n}>(${t.room});
  var wins = array<vec4<f32>, ${t.n}>(${t.win});
  var cards = array<i32, ${t.n}>(${Array.from({ length: t.n }, (_, i) => cardLayer(i)).join(", ")});
  let idx = clamp(i32(round(in.color.r * 255.0)), 0, ${t.n - 1});
  let room = rooms[idx];
  let win = wins[idx];
  let n = normalize(in.world_normal);
  let up = vec3<f32>(0.0, 1.0, 0.0);
  let t = normalize(cross(up, n));
  let v = normalize(in.world_position.xyz - view.world_position);
  let hsh = pane_hash(in.color.rgb, n);
  let flip = select(1.0, -1.0, hsh < 0.5);
  let lace = select(0.0, 1.0, fract(hsh * 7.0) < 0.8) * ${opts.drapes ? "clamp(1.0 - win.w, 0.0, 1.0) * select(1.0, 0.0, win.w < -0.5 && win.w > -1.5)" : "(1.0 - win.w)"};
  let lx = (in.uv.x - 0.5) * win.y * flip;
  let ly = (in.uv.y - 0.5) * win.z;
  let p = vec3<f32>(room.x * 0.5 + lx, win.x + win.z * 0.5 + ly, room.z);
  let d = vec3<f32>(dot(v, t) * flip, dot(v, up), dot(v, n));
  let col = room_ray(p, d, room.xyz, room.w, idx);
  ${opts.displays ? `let card = select(vec4<f32>(0.0), display(p, d, room.xyz, win.yz, win.x, cards[idx]), win.w > 0.5);` : "let card = vec4<f32>(0.0);"}
  let hr = fract((u_hour() + globals.time * u_rate()) / 24.0) * 24.0; // the clock: a start hour and hours per second (a uniform that changes per frame doesn't reach a built material)
  let lit_from = in.color.g * 24.0;
  let lit_to = in.color.b * 24.0;
  let day = hr >= 8.0 && hr < 15.5;
  // a room is lit from lit_from to lit_to. A shop's row gives its opening hours instead (tools/interiors/windows.ts),
  // and it's lit while open in the dark: before eight (a bakery opens at six in the queue years) and from its own dusk,
  // 15:30 to 16:15 by the pane
  let shop = win.w > 0.5;
  let open_now = lit_to > 0.0 && hr >= lit_from && hr < lit_to;
  let dark = hr < 8.0 || hr >= 15.5 + 0.75 * fract(hsh * 5.0);
  let lit_now = select(open_now, open_now && dark, shop);
  let glow = select(select(select(u_glow_dark(), u_glow_day(), day), u_glow_day(), shop), u_glow_lit(), lit_now); // an open shop is daylit until its dusk
  // a shop's roller shutter (Rollladen), down while it's shut and all day on a shop closed for want of goods (no
  // hours): slats 5.5 cm, wood or iron by the pane's hash, lit by the street, not glowing
  if (shop && !open_now) {
    let slat = fract((in.uv.y * win.z) / 0.055);
    let groove = smoothstep(0.0, 0.14, slat) * (1.0 - smoothstep(0.8, 1.0, slat));
    let iron = fract(hsh * 3.0) < 0.55;
    let c = select(vec3<f32>(0.2, 0.12, 0.07), vec3<f32>(0.16, 0.17, 0.17), iron) * (0.45 + 0.55 * groove) * (0.8 + 0.2 * fract(hsh * 11.0));
    (*pbr).material.base_color = vec4<f32>(c, 1.0);
    (*pbr).material.emissive = vec4<f32>(0.0, 0.0, 0.0, 1.0);
    (*pbr).material.perceptual_roughness = select(0.8, 0.55, iron);
    return;
  }
  // a paper taped inside the glass of one shop pane in two, at eye height by one edge: a printed notice (the permit
  // rule, a Bekanntmachung: a heading and rows of type) or, one in three, a war-bond poster (a printed picture over
  // its line of type). Lit by the street through the glass, and from behind by the shop's lamp after dark.
  let nx0 = in.uv.x * win.y;
  let nx = select(win.y - nx0, nx0, fract(hsh * 13.0) < 0.5);
  let ny = in.uv.y * win.z;
  if (shop && fract(hsh * 17.0) < 0.5 && nx > 0.12 && nx < 0.44 && ny > 0.85 && ny < 1.3) {
    let tx = (nx - 0.12) / 0.32;
    let ty = (1.3 - ny) / 0.45; // 0 at the top
    var c = vec3<f32>(0.8, 0.77, 0.68);
    let word = step(0.3, fract(sin(floor(tx * 7.0) * 12.9898 + floor(ty * 14.0) * 78.233 + hsh * 50.0) * 43758.5453));
    let rows = step(0.5, fract(ty * 14.0)) * step(0.24, ty) * step(ty, 0.92) * step(0.08, tx) * step(tx, 0.92) * word;
    let head = step(0.06, ty) * step(ty, 0.15) * step(0.12, tx) * step(tx, 0.88);
    if (fract(hsh * 23.0) < 0.33) {
      // the poster: the picture's colour field and its dark figure over the top 60%, its line of type below
      let pic = step(ty, 0.6) * step(0.05, ty) * step(0.06, tx) * step(tx, 0.94);
      let fig = step(abs(tx - 0.5 + 0.1 * sin(ty * 9.0 + hsh * 6.0)), 0.16 - 0.1 * ty) * step(0.15, ty);
      c = mix(c, mix(vec3<f32>(0.62, 0.2, 0.12), vec3<f32>(0.2, 0.22, 0.2), fig), pic);
      c = mix(c, vec3<f32>(0.1, 0.08, 0.07), step(0.68, ty) * step(ty, 0.8) * step(0.12, tx) * step(tx, 0.88) * word * 0.9);
    } else {
      c = mix(c, vec3<f32>(0.08, 0.07, 0.06), max(rows * 0.75, head));
    }
    (*pbr).material.base_color = vec4<f32>(c, 1.0);
    (*pbr).material.perceptual_roughness = 0.9;
    (*pbr).material.emissive = vec4<f32>(c * select(0.0, u_glow_lit() * 0.08, lit_now), 1.0);
    return;
  }
  ${opts.drapes ? `// an office of state's curtains (the table's w -1: atlas rooms of the "ministry" recipe). The palaces hung heavy
  // velvet each side of a window, tied back, under a pelmet; from the street you see their lining. Two panels from the
  // pane's edges, narrowest at the tieback (42% up), with vertical folds, and the pelmet's scalloped hem across the top.
  // Lit by the street as a surface, and glowing faintly through when the room's lamp is on.
  if (win.w < -0.5) {
    let du = in.uv.x;
    let dv = in.uv.y;
    let edge_d = min(du, 1.0 - du);
    let tie = 0.42;
    // full from the rod and sweeping in to the tie (the fabric's fall bellies toward the glass), flaring a little below it
    let up = clamp((dv - tie) / (0.9 - tie), 0.0, 1.0);
    // a gute Stube's plush (w -2) hangs narrower over its lace
    let plush = win.w < -1.5;
    let wv = select(0.1 + 0.05 * clamp((tie - dv) / tie, 0.0, 1.0), 0.1 + 0.17 * pow(up, 0.55), dv > tie) * select(1.0, 0.75, plush);
    let pelmet = dv > 0.9 - 0.025 * abs(sin(du * 3.14159 * 6.0));
    if (edge_d < wv || pelmet) {
      let fold = 0.6 + 0.4 * pow(sin(edge_d * win.y * 40.0 + hsh * 9.0), 2.0);
      let shade = select(fold * (0.75 + 0.25 * smoothstep(0.0, wv, edge_d)), 0.85, pelmet);
      // the palace's lining, or the back of a Stube's plush: wine in three panes in five, olive in the rest
      let c = select(vec3<f32>(0.4, 0.35, 0.28), select(vec3<f32>(0.24, 0.07, 0.06), vec3<f32>(0.17, 0.18, 0.09), fract(hsh * 31.0) < 0.4), plush) * shade;
      (*pbr).material.base_color = vec4<f32>(c, 1.0);
      (*pbr).material.perceptual_roughness = 0.92;
      (*pbr).material.emissive = vec4<f32>(c * select(0.0, u_glow_lit() * select(0.035, 0.05, plush), lit_now) * vec3<f32>(1.0, 0.8, 0.55), 1.0);
      return;
    }
  }
` : ""}  // an open shop by day: the display in the window's daylight, the shop behind dimmer and a little cooler than the
  // lamp it was rendered under (DAY_SHOP_ROOM, DAY_SHOP_CARD)
  let daylit = shop && !dark;
  ${opts.litCards ? `// litCards: by day the display is a surface in the window's daylight, lit as the facade round it is (the sun, its
  // shadow, the sky), so a shop in shade shows a display in shade and one in sun a display in sun. The card is its
  // albedo, darker toward the pane's edges where the reveal shades it; the shop behind keeps its dim day glow.
  let card_day = select(0.0, card.a, daylit);
  let col2 = mix(col * select(vec3<f32>(1.0), vec3<f32>(${(DAY_SHOP_ROOM * 0.92).toFixed(3)}, ${(DAY_SHOP_ROOM * 0.97).toFixed(3)}, ${(DAY_SHOP_ROOM * 1.06).toFixed(3)}), daylit), card.rgb * select(1.0, 0.0, daylit), card.a);
  let cpu = lx * flip / win.y + 0.5;
  let cpv = ly / win.z + 0.5;
  let cedge = 0.35 + 0.65 * smoothstep(0.0, 0.08, min(min(cpu, 1.0 - cpu), min(cpv, 1.0 - cpv)));
  (*pbr).material.base_color = vec4<f32>(mix(vec3<f32>(0.015, 0.016, 0.02), min(card.rgb * ${CARD_ALBEDO.toFixed(2)}, vec3<f32>(0.9)) * cedge, card_day), 1.0);
  (*pbr).material.perceptual_roughness = mix((*pbr).material.perceptual_roughness, 0.85, card_day);
` : `let col2 = mix(col * select(vec3<f32>(1.0), vec3<f32>(${(DAY_SHOP_ROOM * 0.92).toFixed(3)}, ${(DAY_SHOP_ROOM * 0.97).toFixed(3)}, ${(DAY_SHOP_ROOM * 1.06).toFixed(3)}), daylit), card.rgb * select(1.0, ${DAY_SHOP_CARD.toFixed(1)}, daylit), card.a);
  (*pbr).material.base_color = vec4<f32>(0.015, 0.016, 0.02, 1.0);
`}  let tint = select(vec3<f32>(1.0), vec3<f32>(${LAMP_TINT.map((x) => x.toFixed(2)).join(", ")}), lit_now);
  var em = pane_finish(col2, lx * flip / win.y + 0.5, ly / win.z + 0.5, lace, glow) * tint;
  // LOD1 draws the pane flush with the wall (tools/world/facade.ts window(): its glass kind made odd, kind + 1), so the
  // shader stands in for what LOD0 builds. Where the eye sees past the wall's edge into the recess, the reveal's inner
  // faces show: the jamb on the far side, the lintel's soffit from below, the sill from above. The glass is shifted
  // within them, and on it the Berlin cross window's frame: 7 cm bars, a transom at 72%. Shop panes are plate glass,
  // so they get no frame. gu, gv are the glass's own 0..1 (the uv at LOD0, where the geometry does all this).
  let lod1 = (i32(round(in.color.a * 255.0)) & 1) == 1;
  let rv = select(0.0, ${REVEAL}, lod1) / max(dot(n, -v), 0.03);
  let gu = in.uv.x + rv * dot(v, t) / win.y;
  let gv = in.uv.y + rv * v.y / win.z;
  let in_reveal = lod1 && (gu < 0.0 || gu > 1.0 || gv < 0.0 || gv > 1.0);
  let fx = gu * win.y;
  let fy = gv * win.z;
  let bw = 0.07;
  let bar = lod1 && !shop && !in_reveal && (fx < bw || fx > win.y - bw || fy < bw * 1.4 || fy > win.z - bw || (abs(fx - win.y * 0.5) < bw * 0.5 && fy < win.z * 0.72) || abs(fy - win.z * 0.72) < bw * 0.5);
  ${opts.reflect ? `// the sky and the street reflected by Fresnel, as components/world/shaders.ts's glazing (old cylinder glass isn't flat)
  let cos_t = clamp(dot(n, -v), 0.0, 1.0);
  let fres = 0.04 + 0.96 * pow(1.0 - cos_t, 5.0);
  let r = reflect(v, n);
  var sky = mix(u_sky_hor().rgb, u_sky_top().rgb, clamp(r.y * 2.5, 0.0, 1.0));
  sky = mix(sky * 0.18, sky, smoothstep(0.05, 0.3, r.y));
  // the glass stands ${REVEAL} m back in the wall: a reflected ray has to clear the jamb it runs toward and the lintel
  // above before it sees the sky. At a grazing angle most of the pane sees the reveal in its shade instead, so the
  // windows along a street read dark with the sky in a sliver, as they do, not as white cards (11-17 day7)
  let rt = dot(r, t);
  let to_jamb = select(clamp(gu, 0.0, 1.0), 1.0 - clamp(gu, 0.0, 1.0), rt > 0.0) * win.y;
  let to_lintel = (1.0 - clamp(gv, 0.0, 1.0)) * win.z;
  let reach = ${REVEAL} / max(cos_t, 0.03);
  let clear = (1.0 - smoothstep(-0.015, 0.015, reach * abs(rt) - to_jamb)) * (1.0 - smoothstep(-0.015, 0.015, reach * max(r.y, 0.0) - to_lintel));
  sky = mix(u_sky_hor().rgb * 0.16, sky, clear);
  let wave = 0.97 + 0.06 * (0.5 + 0.5 * sin(in.uv.x * 9.0 + hsh * 20.0) * sin(in.uv.y * 5.0 + hsh * 7.0));
  em = em * (1.0 - fres) + sky * fres * wave * u_nits();` : ""}
  (*pbr).material.emissive = vec4<f32>(em, 1.0);
  if (in_reveal) {
    // the reveal's plaster, lit as the wall is (it has the pane's normal), darker for its own shade
    (*pbr).material.base_color = vec4<f32>(0.2, 0.19, 0.17, 1.0);
    (*pbr).material.emissive = vec4<f32>(0.0, 0.0, 0.0, 1.0);
    (*pbr).material.perceptual_roughness = 0.9;
  } else if (bar) {
    // the frame's oil paint: cream in a little over half the windows, dark brown in the rest
    (*pbr).material.base_color = vec4<f32>(select(vec3<f32>(0.22, 0.14, 0.09), vec3<f32>(0.66, 0.63, 0.55), fract(hsh * 29.0) < 0.55), 1.0);
    (*pbr).material.emissive = vec4<f32>(0.0, 0.0, 0.0, 1.0);
    (*pbr).material.perceptual_roughness = 0.6;
  }
}
`;
}

/** One window of a stand-in wall as a room: where its pane sits (the set's frame), which way it faces, its uniforms. */
export type StandPane = { key: string; at: V3; yaw: number; w: number; h: number; u: PaneUniforms; lit: boolean };

/** A `panes` room's windows (a court's far walls) as rooms from the atlas. Each opening's pane sits 12 cm back in its
 *  reveal, facing into the room it is a wall of (the court), so the room it shows lies behind the wall. The set's
 *  `windows.lit` share get a lamp-lit room at `glow`; the rest a day room at `dark`, all seeded per opening. */
export function standInPanes(room: Room, w: NonNullable<Set["windows"]>, origin: V3 = [0, 0, 0]): StandPane[] {
  const s = room.shell, R = 0.12, ry = room.yaw ?? 0, c = Math.cos(ry), sn = Math.sin(ry);
  const lit = ATLAS.filter((a) => a.lit && isFlat(a)).map((a) => a.n), day = ATLAS.filter((a) => !a.lit && isFlat(a)).map((a) => a.n);
  return (s.openings ?? []).flatMap((o, i) => {
    if (o.kind !== "window") return [];
    const y = o.y + o.h / 2;
    const local: V3 = o.wall === "front" ? [s.l - o.u, y, s.d + R] : o.wall === "left" ? [-R, y, s.d - o.u] : o.wall === "right" ? [s.l + R, y, o.u] : [o.u, y, -R];
    const yaw = o.wall === "front" ? Math.PI : o.wall === "left" ? Math.PI / 2 : o.wall === "right" ? -Math.PI / 2 : 0;
    const at: V3 = [origin[0] + room.at[0] + local[0] * c + local[2] * sn, origin[1] + room.at[1] + local[1], origin[2] + room.at[2] - local[0] * sn + local[2] * c];
    const on = hash(w.seed, i, 1) < w.lit, pool = on ? lit : day;
    const n = pool[Math.floor(hash(w.seed, i, 2) * pool.length)];
    const u: PaneUniforms = { ...paneFor(n, on ? w.glow : w.dark, hash(w.seed, i, 3) < 0.5 ? 1 : -1, hash(w.seed, i, 4) < 0.8 ? 1 : 0), pane: [o.w, o.h] };
    return [{ key: `${room.id}-pane-${i}`, at, yaw: ry + yaw, w: o.w, h: o.h, u, lit: on }];
  });
}
