// FLOOR3's renderer: one frame of the game's state drawn by raea's Bevy engine, path traced (Solari). Every value comes
// from the state the game's step made this frame; nothing here decides anything.
import { staticFile } from "raea";
import { Bloom, Grade, Model, ToneMapping } from "raea/3d";
import { StandardMaterial } from "raea/pbr";
import { BufferMesh, Cuboid, Cylinder, Mesh3d } from "raea/mesh";
import { DirectionalLight, SolariLighting } from "raea/light";
import { LinearRgba } from "raea/color";
import { Affine2 } from "raea/math";
import { Quat, Transform } from "raea/transform";
import { Camera3d } from "raea/camera";
import {
  BADGE, COPY_OPEN, DOOR_H, FIXTURES, H, NOTICE, PROPS, ROOMS, TRAY,
  type Fixture, type Prop, type Room, type V3,
} from "./level";
import { COPY_MAX, FPS, PRINT_SLIDE, blackout, eyeOf, exitGlow, forward, interactAt, itOf, lightOf, rightOf, type Game } from "./step";
import { INTERACTS } from "./level";
import { CASINGS, COVES, FITS, NOTICE_PINS, WALL_FITS, WALL_PIECES, columnBoxes, doorCasing } from "./build";
import { fovOf, useShape } from "./frame";

const tex = (n: string) => staticFile(`tex/${n}`);
const model = (f: string) => staticFile(`models/${f}.glb`);

// ---- surfaces -----------------------------------------------------------------------------------------------------
type Surf = { diff: string; nor: string; rough: string; size: number; tint?: string; matte?: number };
const SURF: Record<string, Surf> = {
  carpet: { diff: "carpet_lit_diff.jpg", nor: "dirty_carpet_nor.jpg", rough: "dirty_carpet_arm.jpg", size: 0.6 },
  lino: { diff: "lino_lit_diff.jpg", nor: "old_linoleum_flooring_01_nor.jpg", rough: "old_linoleum_flooring_01_arm.jpg", size: 2.0 },
  concrete: { diff: "concrete_lit_diff.jpg", nor: "concrete_floor_worn_001_nor.jpg", rough: "concrete_floor_worn_001_arm.jpg", size: 3.0 },
  // painted drywall: the grain kept, stains and patches taken out (tools/cleantex.sh), which under traced light read as
  // blotchy light. The corridor's paint is a shade darker and greyer than the bay's
  // and flat paint: one roughness all over (0.9), not the source's roughness map, whose old stains survive in it as rough
  // and glossy patches; at its 0.62 the walls took noisy glossy reflections of the lights that the denoiser smeared
  beige: { diff: "beige_clean_diff.jpg", nor: "beige_wall_001_nor.jpg", rough: "beige_wall_001_arm.jpg", size: 3.0, matte: 0.9 },
  paper: { diff: "beige_clean_diff.jpg", nor: "beige_wall_001_nor.jpg", rough: "beige_wall_001_arm.jpg", size: 3.0, tint: "#f4f2f4", matte: 0.9 },
  white: { diff: "white_clean_diff.jpg", nor: "beige_wall_001_nor.jpg", rough: "beige_wall_001_arm.jpg", size: 3.0, matte: 0.9 },
};
function SurfMat({ s, u, v, rough = 1 }: { s: Surf; u: number; v: number; rough?: number }) {
  return (
    <StandardMaterial base_color={s.tint ?? "#ffffff"} base_color_texture={tex(s.diff)} normal_map_texture={tex(s.nor)}
      {...(s.matte ? {} : { metallic_roughness_texture: tex(s.rough) })} perceptual_roughness={s.matte ?? rough} metallic={0} uv_transform={Affine2.fromScale([u / s.size, v / s.size])} />
  );
}

/** a box between two corners */
function Slab({ name, min, max, children, shadow = true }: { name: string; min: V3; max: V3; children: React.ReactNode; shadow?: boolean }) {
  const t = Transform.fromXyz((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
  return (
    <Mesh3d name={name} transform={t} {...(shadow ? {} : { castShadow: false })}>
      <Cuboid half_size={[(max[0] - min[0]) / 2, (max[1] - min[1]) / 2, (max[2] - min[2]) / 2]} />
      {children}
    </Mesh3d>
  );
}

// ---- the architecture, built once from the level's data ----------------------------------------------------------------
const WALL_ROOM: Record<string, Room["wall"]> = { bay: "beige", cor: "paper", copy: "beige", wing: "white", lobby: "beige" };
function wallSurf(name: string): Surf {
  const id = name.split("-")[0];
  return SURF[WALL_ROOM[id] ?? "beige"];
}

/** the suspended ceiling's T-bar grid for a room, as flat triangles: runners every `mx` along x and `mz` along z, offset
 * so the room's fixtures sit in its openings */
function gridMesh(r: Room, mx: number, mz: number, ox: number, oz: number): number[] {
  const pos: number[] = [];
  const w = 0.024, d = 0.032, y1 = H - 0.001, y0 = H - d;
  const quad = (a: V3, b: V3, c: V3, e: V3) => pos.push(...a, ...b, ...c, ...a, ...c, ...e);
  const bar = (x0: number, x1: number, z0: number, z1: number) => {
    // the bottom face (seen from below: counter-clockwise from below), and the two sides
    quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
    if (x1 - x0 > z1 - z0) { quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]); quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]); }
    else { quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]); quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]); }
  };
  for (let x = r.x0 + (((ox - r.x0) % mx) + mx) % mx; x < r.x1 - 0.05; x += mx) bar(x - w / 2, x + w / 2, r.z0, r.z1);
  for (let z = r.z0 + (((oz - r.z0) % mz) + mz) % mz; z < r.z1 - 0.05; z += mz) bar(r.x0, r.x1, z - w / 2, z + w / 2);
  // the wall angle round the edge
  bar(r.x0, r.x1, r.z0, r.z0 + w); bar(r.x0, r.x1, r.z1 - w, r.z1); bar(r.x0, r.x0 + w, r.z0, r.z1); bar(r.x1 - w, r.x1, r.z0, r.z1);
  return pos;
}
const GRID_OFF: Record<string, [number, number, number, number]> = {
  bay: [1.2, 0.6, 0.6, 0.4], cor: [1.2, 0.6, 0.6, 0.2], copy: [0.6, 1.2, 18.3, -4.6], wing: [1.2, 0.6, 0.6, 0.2], lobby: [1.2, 0.6, 0.0, 0.2],
};
const GRIDS = ROOMS.map((r) => ({ id: r.id, pos: gridMesh(r, ...GRID_OFF[r.id]) }));

// the fittings (FITS, WALL_FITS), wall pieces, coves and casings are in build.ts, shared with the clip check

// ---- one fixture -----------------------------------------------------------------------------------------------------
const TUBE = new LinearRgba(1, 0.98, 0.9, 1);
const LENS_NITS = 4500;
function Fixture3d({ fx, v }: { fx: Fixture; v: number }) {
  const along = fx.along === "x";
  const yaw = along ? Math.PI / 2 : 0;
  // a dead tube still shows a grey-green cast; a lit one glows by the light it gives
  const glow = TUBE.mul(LENS_NITS * v + (fx.kind === "dead" ? 0 : 0.4));
  return (
    <>
      <Model name={`troffer-${fx.id}`} src={model("fit/troffer")} position={[fx.x, H, fx.z]} rotation={[0, yaw, 0]} />
      <Mesh3d name={`lens-${fx.id}`} castShadow={false} transform={Transform.fromXyz(fx.x, H - 0.012, fx.z)}>
        <Cuboid half_size={along ? [0.575, 0.004, 0.275] : [0.275, 0.004, 0.575]} />
        <StandardMaterial base_color="#e9ebe6" perceptual_roughness={0.4} emissive={glow} />
      </Mesh3d>
    </>
  );
}

// ---- props ---------------------------------------------------------------------------------------------------------------
function PropModel({ p, s }: { p: Prop; s: Game }) {
  const f = s.f;
  if (p.file === "afk/column") {
    const [shaft, base] = columnBoxes(p);
    return (
      <>
        <Slab name={shaft.name} min={shaft.min} max={shaft.max}><SurfMat s={SURF.white} u={0.5} v={H - 0.1} /></Slab>
        <Slab name={base.name} min={base.min} max={base.max}><StandardMaterial base_color="#2d2b29" perceptual_roughness={0.55} /></Slab>
      </>
    );
  }
  if (p.file === "afk/carpet-roll") {
    return (
      <Mesh3d name={p.name} transform={Transform.fromXyz(p.at[0], 0.18, p.at[2]).withRotation(Quat.fromEuler("YXZ", p.yaw, Math.PI / 2, 0))}>
        <Cylinder radius={0.18} half_height={1.6} />
        <SurfMat s={SURF.carpet} u={1.13} v={3.2} />
      </Mesh3d>
    );
  }
  if (p.file === "hallway/door") {
    // a closed door in its painted casing (build.ts)
    return (
      <>
        <Model name={p.name} src={model(p.file)} position={p.at} rotation={[0, p.yaw, 0]} />
        {doorCasing(p).map((b) => (
          <Slab key={b.name} name={b.name} min={b.min} max={b.max}><StandardMaterial base_color="#cdc6b4" perceptual_roughness={0.45} /></Slab>
        ))}
      </>
    );
  }
  let pos: V3 = p.at, extra: React.ReactNode = null, anim: { animation: string; time: number } | null = null, scale = p.scale ?? 1;
  if (p.name === "copy-copier" || p.file === "afk/copier") {
    const on = s.st.copier >= 0 ? Math.max(0, 1 - (f - s.st.copier) / (FPS * 22)) : 0;
    const pulse = on > 0 ? 0.6 + 0.4 * Math.sin((f - s.st.copier) / 9) : 0;
    extra = (
      <>
        <StandardMaterial material="copier_display" emissive={new LinearRgba(0.3, 1, 0.55, 1).mul(on > 0 ? 9 : 0.6)} />
        <StandardMaterial material="copier_scan" emissive={new LinearRgba(0.4, 1, 0.6, 1).mul(on * pulse * 60)} />
      </>
    );
  }
  if (p.file === "afk/crt") {
    // screens left on: a dim blue standby glow; the player's own shows its desktop
    const own = p.name === "bay-crt-s0";
    const dark = blackout(s) ? 0 : 1;
    extra = (
      <>
        <StandardMaterial material="crt_screen" emissive={(own ? new LinearRgba(0.25, 0.42, 0.75, 1).mul(14) : new LinearRgba(0.06, 0.1, 0.22, 1).mul(6)).mul(dark)} />
        <StandardMaterial material="crt_led" emissive={new LinearRgba(0.2, 1, 0.25, 1).mul(4 * dark)} />
      </>
    );
  }
  if (p.file === "afk/recorder") {
    const t = s.st.tape2;
    const playing = t >= 0 && f >= t - 40;
    anim = { animation: playing ? "reels" : "play", time: playing ? ((f - t + 40) / FPS) * 0.35 % 1 : 0 };
  }
  if (p.file === "afk/reader") {
    const ok = s.st.swipe >= 0;
    const lockedNow = s.st.behind >= 0 && s.f - s.st.behind > FPS * 8;
    extra = <StandardMaterial material="reader_led" emissive={ok && !lockedNow ? new LinearRgba(0.1, 1, 0.2, 1).mul(25) : new LinearRgba(1, 0.06, 0.04, 1).mul(lockedNow && (f >> 4) % 2 ? 0 : 25)} />;
  }
  if (p.file === "afk/answering") {
    const msg = s.st.ring2 >= 0;
    extra = (
      <>
        <StandardMaterial material="machine_display" emissive={new LinearRgba(1, 0.18, 0.08, 1).mul(msg ? 10 : 4)} />
        <StandardMaterial material="machine_led" emissive={new LinearRgba(1, 0.08, 0.05, 1).mul(msg && (f >> 4) % 2 ? 18 : 0)} />
      </>
    );
  }
  if (p.file === "office/phone") {
    const ringing = (p.name === "phone-1" && s.st.ring1 >= 0 && s.st.vm1 < 0) || (p.name === "phone-2" && s.st.ring2 >= 0 && s.st.vm3 < 0);
    extra = <StandardMaterial material="phone_line" emissive={new LinearRgba(1, 0.25, 0.1, 1).mul(ringing && (f >> 3) % 2 ? 22 : 0)} />;
  }
  if (p.file === "stairwell/exit-sign" || p.file === "office/exit-sign") {
    const g = p.name === "lobby-exit" ? exitGlow(s) : blackout(s) ? 0 : 1;
    extra = (
      <>
        <StandardMaterial material="exit_glow" emissive={new LinearRgba(0.15, 1, 0.3, 1).mul(30 * g)} />
        <StandardMaterial material="exit_letters" emissive={new LinearRgba(0.15, 1, 0.3, 1).mul(60 * g)} />
      </>
    );
  }
  return (
    <Model name={p.name} src={model(p.file)} position={pos} rotation={[0, p.yaw, 0]} scale={scale} {...(anim ? { ...anim, loop: false } : {})}>
      {extra}
    </Model>
  );
}

// ---- the papers -----------------------------------------------------------------------------------------------------
/** the facilities notice pinned on the corridor's board, and the copier's page sliding out into its tray */
function Papers({ s }: { s: Game }) {
  const st = s.st;
  const k = st.printed >= 0 ? Math.min(1, (s.f - st.printed) / PRINT_SLIDE) : 0;
  const e = 1 - Math.pow(1 - k, 2);
  const out = st.printed >= 0 && st.printout < 0;
  // the page leaves the engine's side at its middle and slides out over the tray
  const px = TRAY[0] + 0.2 * (1 - e);
  return (
    <>
      <Mesh3d name="notice" castShadow={false} transform={Transform.fromXyz(NOTICE[0], NOTICE[1], NOTICE[2] + 0.002)}>
        <Cuboid half_size={[0.105, 0.1485, 0.0007]} />
        {/* a cuboid's front face runs its u right to left as seen: drawn from the mirrored page, so the notice reads */}
        <StandardMaterial base_color="#ffffff" base_color_texture={staticFile("papers/notice-m.png")} perceptual_roughness={0.9} />
      </Mesh3d>
      {NOTICE_PINS.map((p) => (
        <Mesh3d key={p.name} name={p.name} transform={Transform.fromXyz(...p.at).withRotation(Quat.fromEuler("XYZ", Math.PI / 2, 0, 0))}>
          <Cylinder radius={p.r} half_height={p.hh} />
          <StandardMaterial base_color="#a3221b" perceptual_roughness={0.35} />
        </Mesh3d>
      ))}
      <Mesh3d name="printout" castShadow={false} transform={Transform.fromXyz(px, out ? TRAY[1] + 0.006 : -5, TRAY[2]).withRotation(Quat.fromEuler("YXZ", Math.PI / 2, -Math.PI / 2, 0.14))}>
        <Cuboid half_size={[0.105, 0.1485, 0.0007]} />
        <StandardMaterial base_color="#ffffff" base_color_texture={staticFile("papers/printout.png")} perceptual_roughness={0.9} />
      </Mesh3d>
    </>
  );
}

// ---- the hand ------------------------------------------------------------------------------------------------------
const HANDS = ["arrow", "link", "grab", "resize", "busy"] as const;
const HAND_SCALE = 0.115;
function qmul(a: [number, number, number, number], b: [number, number, number, number]): [number, number, number, number] {
  const [ax, ay, az, aw] = a, [bx, by, bz, bw] = b;
  return [aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx, aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz];
}
function qeuler(order: "YXZ", y: number, x: number, z: number): [number, number, number, number] {
  const qy: [number, number, number, number] = [0, Math.sin(y / 2), 0, Math.cos(y / 2)];
  const qx: [number, number, number, number] = [Math.sin(x / 2), 0, 0, Math.cos(x / 2)];
  const qz: [number, number, number, number] = [0, 0, Math.sin(z / 2), Math.cos(z / 2)];
  return qmul(qmul(qy, qx), qz);
}
function rotate(q: [number, number, number, number], v: V3): V3 {
  const [x, y, z, w] = q;
  const ix = w * v[0] + y * v[2] - z * v[1], iy = w * v[1] + z * v[0] - x * v[2], iz = w * v[2] + x * v[1] - y * v[0], iw = -x * v[0] - y * v[1] - z * v[2];
  return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x];
}
const inv = (q: [number, number, number, number]): [number, number, number, number] => [-q[0], -q[1], -q[2], q[3]];

/** where the hand is, in the camera's frame (x right, y up, -z ahead), and how it is turned there. Tall, it rests just
 * right of the middle (the narrow view would put the wide rest at its edge), is a tenth smaller (the tall view draws it
 * a third larger), and lags the look less, since the same lag crosses more of a narrow frame */
export function handPose(s: Game, tall = false): { local: V3; roll: number; yaw: number; pitch: number; scale: number } {
  const h = s.hand, e = eyeOf(s);
  const q = qeuler("YXZ", e.yaw, e.pitch, e.roll);
  const ph = s.p.stride * Math.PI * 2;
  // at rest: low and to the right, bobbing with the stride, lagging the look
  const rest: V3 = tall
    ? [0.03 + h.swx * 0.6 + Math.sin(ph / 2) * 0.005 * s.p.bob, -0.155 - h.swy * 0.6 + Math.abs(Math.sin(ph)) * 0.007 * s.p.bob, -h.out]
    : [0.165 + h.swx * 1.6 + Math.sin(ph / 2) * 0.006 * s.p.bob, -0.15 - h.swy * 1.2 + Math.abs(Math.sin(ph)) * 0.008 * s.p.bob, -h.out];
  let local = rest;
  if (h.reach > 0.001) {
    const t = h.to;
    const tl = rotate(inv(q), [t[0] - e.pos[0], t[1] - e.pos[1], t[2] - e.pos[2]]);
    // stop just short of the surface, along the ray from the eye
    const d = Math.hypot(...tl), k = Math.max(0, (d - 0.035) / d);
    const aim: V3 = [tl[0] * k, tl[1] * k, tl[2] * k];
    const r = h.reach * h.reach * (3 - 2 * h.reach);
    local = [rest[0] + (aim[0] - rest[0]) * r, rest[1] + (aim[1] - rest[1]) * r, rest[2] + (aim[2] - rest[2]) * r];
  }
  // a poke on a press
  if (h.press >= 0) {
    const a = (s.f - h.press) / 10;
    const poke = a < 0.5 ? a * 2 : Math.max(0, 1 - (a - 0.5) * 1.4);
    local = [local[0], local[1], local[2] - 0.022 * poke];
  }
  const swap = Math.min(1, (s.f - h.modeF) / 7);
  const pop = 0.82 + 0.18 * (1 - Math.pow(1 - swap, 3));
  return { local, roll: 0.32 - h.swx * 2.5, yaw: -0.38 + h.swx * 1.5, pitch: 0.12 - h.swy * 1.5, scale: HAND_SCALE * pop * (tall ? 0.9 : 1) };
}

function Hand({ s, tall }: { s: Game; tall: boolean }) {
  const e = eyeOf(s);
  const q = qeuler("YXZ", e.yaw, e.pitch, e.roll);
  const hp = handPose(s, tall);
  const w = rotate(q, hp.local);
  const at: V3 = [e.pos[0] + w[0], e.pos[1] + w[1], e.pos[2] + w[2]];
  const hq = qmul(q, qeuler("YXZ", hp.yaw, hp.pitch, hp.roll));
  const mode = s.hand.mode;
  const holding = (s.st.badge >= 0 && s.st.pocket < 0) || (s.st.swipe >= 0 && s.f - s.st.swipe < 50);
  const away: V3 = [e.pos[0], e.pos[1] + 50, e.pos[2]];
  const badgeAt = rotate(hq, [0.0, -0.05, 0.02]);
  return (
    <>
      {HANDS.map((n) => (
        <Model key={n} name={`hand-${n}`} src={model(`cursor/${n}`)} position={n === mode ? at : away}
          rotation={eulerXYZ(hq)} scale={n === mode ? hp.scale : 0.0001} />
      ))}
      <Model name="badge-held" src={model("afk/badge")} position={holding ? [at[0] + badgeAt[0], at[1] + badgeAt[1], at[2] + badgeAt[2]] : away}
        rotation={eulerXYZ(qmul(hq, qeuler("YXZ", 0.2, 1.25, 0.1)))} scale={holding ? 1 : 0.0001} />
    </>
  );
}
/** a quaternion as Bevy's XYZ Euler angles (what Model's rotation takes) */
function eulerXYZ(q: [number, number, number, number]): V3 {
  const [x, y, z, w] = q;
  // rotation matrix
  const m00 = 1 - 2 * (y * y + z * z), m01 = 2 * (x * y - z * w), m02 = 2 * (x * z + y * w);
  const m12 = 2 * (y * z - x * w), m22 = 1 - 2 * (x * x + y * y);
  const m10 = 2 * (x * y + z * w), m11 = 1 - 2 * (x * x + z * z);
  // R = Rx(a) Ry(b) Rz(c)
  const b = Math.asin(Math.max(-1, Math.min(1, m02)));
  let a: number, c: number;
  if (Math.abs(m02) < 0.9999) { a = Math.atan2(-m12, m22); c = Math.atan2(-m01, m00); }
  else { a = Math.atan2(m10 === 0 ? 0 : m10, m11); c = 0; }
  return [a, b, c];
}

// ---- the world -----------------------------------------------------------------------------------------------------------
/** a camera that isn't the player's eye (the menu's, the copier's page), the hand left out, things added or left out */
export interface View { pos: V3; yaw: number; pitch: number; roll?: number; fov?: number }
/** how the light is traced: ReSTIR's reuse of light samples between pixels and frames (cleaner light from many tubes)
 * and the bounces */
export interface Look { restir: boolean; bounces: number }
// ReSTIR on: without it the walls' indirect light wandered between frames in soft blotches; three bounces fill the
// corners. Checked on the corridor and on the finale, where it fades out with the tubes exactly as the plain trace does.
export const LOOK: Look = { restir: true, bounces: 3 };
export function World({ s, view, noHand = false, extra = null, hide = [], look = LOOK }: { s: Game; view?: View; noHand?: boolean; extra?: React.ReactNode; hide?: string[]; look?: Look }) {
  const { tall } = useShape();
  const e = view ? { pos: view.pos, yaw: view.yaw, pitch: view.pitch, roll: view.roll ?? 0 } : eyeOf(s);
  const it = itOf(s);
  const lights = FIXTURES.map((fx) => lightOf(s, fx));
  const copyFill = COPY_MAX - s.st.copyW;
  const dark = blackout(s);
  return (
    <>
      <Camera3d transform={Transform.fromXyz(...e.pos).withRotation(Quat.fromEuler("YXZ", e.yaw, e.pitch, e.roll))} projection={{ Perspective: { fov: view?.fov ?? fovOf(tall), near: 0.05 } }}>
        <SolariLighting bounces={look.bounces} restir={look.restir} />
      </Camera3d>
      <ToneMapping mode="agx" exposure={1.4} />
      <Bloom intensity={0.16} threshold={0.95} />
      <Grade saturation={0.9} vignette={0.16} />
      {/* Solari wants a sun in the tree from the first frame: this one points up from under the floor and lights nothing */}
      <DirectionalLight illuminance={0.0001} transform={Transform.fromXyz(20, -30, 0).lookingAt([20.1, 0, 0])} />
      {ROOMS.map((r) => (
        <Slab key={`floor-${r.id}`} name={`floor-${r.id}`} min={[r.x0 - 0.2, -0.2, r.z0 - 0.2]} max={[r.x1 + 0.2, 0, r.z1 + 0.2]}>
          <SurfMat s={SURF[r.floor]} u={r.x1 - r.x0 + 0.4} v={r.z1 - r.z0 + 0.4} />
        </Slab>
      ))}
      {ROOMS.map((r) => (
        <Slab key={`ceil-${r.id}`} name={`ceil-${r.id}`} min={[r.x0 - 0.2, H, r.z0 - 0.2]} max={[r.x1 + 0.2, H + 0.25, r.z1 + 0.2]}>
          <StandardMaterial base_color="#ffffff" base_color_texture={tex("tile_diff.png")} normal_map_texture={tex("tile_nor.png")} perceptual_roughness={0.92}
            uv_transform={Affine2.fromScaleAngleTranslation([(r.x1 - r.x0 + 0.4) / 0.6, (r.z1 - r.z0 + 0.4) / 0.6], 0, [((r.x0 - 0.2 - GRID_OFF[r.id][2]) / 0.6) % 1, ((r.z0 - 0.2 - GRID_OFF[r.id][3]) / 0.6) % 1])} />
        </Slab>
      ))}
      {GRIDS.map((g) => (
        <Mesh3d key={`grid-${g.id}`} name={`grid-${g.id}`} castShadow={false}>
          <BufferMesh positions={g.pos} />
          <StandardMaterial base_color="#e4e2dc" perceptual_roughness={0.4} />
        </Mesh3d>
      ))}
      {WALL_PIECES.map((w) => {
        const s0 = wallSurf(w.name), long = Math.max(w.x1 - w.x0, w.z1 - w.z0);
        return (
          <Slab key={w.name} name={`wall-${w.name}`} min={[w.x0, w.y0, w.z0]} max={[w.x1, w.y1, w.z1]}>
            <SurfMat s={s0} u={long} v={w.y1 - w.y0} />
          </Slab>
        );
      })}
      {/* rubber cove base along every wall that reaches the floor */}
      {COVES.map((b) => (
        <Slab key={b.name} name={b.name} min={b.min} max={b.max}><StandardMaterial base_color="#2d2b29" perceptual_roughness={0.55} /></Slab>
      ))}
      {/* door casings round the openings (build.ts) */}
      {CASINGS.map((b) => (
        <Slab key={b.name} name={b.name} min={b.min} max={b.max}><StandardMaterial base_color="#cdc6b4" perceptual_roughness={0.45} /></Slab>
      ))}
      {/* the copy room's opening: the wall standing in it, east of the edge the player pulls */}
      <Mesh3d name="copy-fill" transform={Transform.fromXyz(COPY_OPEN.b - copyFill / 2, DOOR_H / 2, -2.5).withScale([Math.max(copyFill, 0.0005), 1, 1])}>
        <Cuboid half_size={[0.5, DOOR_H / 2, 0.09]} />
        <SurfMat s={SURF.paper} u={1} v={DOOR_H} />
      </Mesh3d>
      {FIXTURES.map((fx, i) => <Fixture3d key={fx.id} fx={fx} v={lights[i]} />)}
      {FITS.map((ft, i) => <Model key={`fit-${i}`} name={`fit-${i}`} src={model(ft.file)} position={ft.at} rotation={[0, ft.yaw ?? 0, 0]} />)}
      {WALL_FITS.map((ft, i) => <Model key={`wfit-${i}`} name={`wfit-${i}`} src={model(ft.file)} position={ft.at} rotation={[0, ft.yaw ?? 0, 0]} />)}
      {PROPS.map((p) => (hide.includes(p.name) ? null : <PropModel key={p.name} p={p} s={s} />))}
      <Papers s={s} />
      <Model name="badge-desk" src={model("afk/badge")} position={s.st.badge < 0 ? BADGE : [BADGE[0], -5, BADGE[2]]} rotation={[0, -1.2, 0]} />
      <Model name="it" src={model("it/it")} position={it.seen && !dark ? [it.x, 0, it.z] : [it.x, -10, it.z]} rotation={[0, it.yaw, 0]} />
      {noHand ? null : <Hand s={s} tall={tall} />}
      {extra}
    </>
  );
}
export { INTERACTS, interactAt, forward, rightOf };
