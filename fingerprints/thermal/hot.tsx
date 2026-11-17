// The thermal film's things, drawn in temperature (sensor.tsx reads brightness as heat): unlit greys, 0 the cold room
// and 1 the hottest skin. Temperatures are linear (the pass reads the linear frame), so greys given as colours go
// through sRGB() first.
//
// The hand (the 60s scan, posed by v2/rig.ts): warm at the wrist and palm, cooler toward the fingertips, a little
// cooler where the skin turns away from the camera (skin gives off less heat sideways), and the thumb's pad cooler
// for a while after it has pressed the glass (the glass took its heat). Glass is near-opaque to a thermal camera and
// a weak mirror: it shows the hand faintly reflected, which is drawn as the hand mirrored under a glass that lets a
// fifth of it through. The print is the heat the thumb left: sharp ridges that fade fast and a soft patch that
// spreads and fades slower.
import { staticFile } from "raea";
import { Srgba } from "raea/color";
import { BufferMesh, Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { BevyComponent } from "raea/3d";
import { Quat, Transform } from "raea/transform";
import { MESH, MESH_LEFT, REST, type Pose, type V3, skin } from "../v2/rig";

import { heat } from "./temp";
export { heat };

export const ROOM = 0.1; // the cold room and the glass
export const SKIN = 0.78; // the palm and wrist

const smooth = (a: number, b: number, x: number) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

// the hand's own heat at rest, a vertex at a time (the camera's angle is added each frame)
const REST_SKIN = skin(REST);
const N = MESH.count;
const zs = Array.from({ length: N }, (_, v) => REST_SKIN.positions[v * 3 + 2]);
const Z_TIP = Math.max(...zs);
const Z_ARM = Math.min(...zs);
/** where the thumb's pad is at rest (v2/act.ts TPAD, on the thumb's last bone), in the rest skin's space */
export const TPAD: V3 = [0.78, -0.27, 0.4];
const OWN: number[] = (() => {
  const out = new Array<number>(N);
  for (let v = 0; v < N; v++) {
    const x = REST_SKIN.positions[v * 3], y = REST_SKIN.positions[v * 3 + 1], z = zs[v];
    const ny = REST_SKIN.normals[v * 3 + 1];
    let t = SKIN;
    t -= 0.24 * smooth(Z_TIP - 1.0, Z_TIP, z); // fingers cool toward their tips
    t += 0.04 * smooth(Z_ARM + 0.6, Z_ARM, z); // the wrist's blood runs warm
    t += 0.03 * Math.max(0, -ny); // the palm a touch warmer than the back
    // the back's veins: a slow ripple along the hand, faint
    t += 0.025 * Math.max(0, ny) * Math.sin(x * 9.0 + Math.sin(z * 3.1) * 2.0) * Math.sin(z * 4.3);
    void y;
    out[v] = t;
  }
  return out;
})();
const PAD_NEAR: number[] = (() => {
  // how close each vertex is to the thumb's pad at rest (1 on it, 0 a few centimetres off)
  const p = [1.08, -0.42, 0.62]; // near TPAD in the whole hand's rest space (thumb tip, palm side)
  return Array.from({ length: N }, (_, v) => {
    const d = Math.hypot(REST_SKIN.positions[v * 3] - p[0], REST_SKIN.positions[v * 3 + 1] - p[1], REST_SKIN.positions[v * 3 + 2] - p[2]);
    return 1 - smooth(0.05, 0.28, d);
  });
})();

function temps(normals: number[], positions: number[], eye: V3, padCool: number): number[] {
  const c: number[] = new Array(N * 4);
  for (let v = 0; v < N; v++) {
    const px = positions[v * 3], py = positions[v * 3 + 1], pz = positions[v * 3 + 2];
    let dx = eye[0] - px, dy = eye[1] - py, dz = eye[2] - pz;
    const l = Math.hypot(dx, dy, dz) || 1;
    dx /= l; dy /= l; dz /= l;
    const facing = Math.abs(normals[v * 3] * dx + normals[v * 3 + 1] * dy + normals[v * 3 + 2] * dz);
    const t = OWN[v] * (0.82 + 0.18 * facing) - padCool * PAD_NEAR[v];
    c[v * 4] = t; c[v * 4 + 1] = t; c[v * 4 + 2] = t; c[v * 4 + 3] = 1;
  }
  return c;
}

/** the hand in a pose, warm, and its faint reflection in glass lying at y = 0 */
export function HotHand({ pose, eye, padCool = 0, reflect = true, tag = "" }: { pose: Pose; eye: V3; padCool?: number; reflect?: boolean; tag?: string }) {
  const s = skin(pose);
  const col = temps(s.normals, s.positions, eye, padCool);
  const mp = reflect ? s.positions.map((x, i) => (i % 3 === 1 ? -x : x)) : null;
  const mn = reflect ? s.normals.map((x, i) => (i % 3 === 1 ? -x : x)) : null;
  return (
    <>
      <Mesh3d key={`h${tag}`} name={`hot-hand${tag}`}>
        <BufferMesh positions={s.positions} normals={s.normals} uvs={MESH.uvs} indices={MESH.indices} colors={col} />
        <StandardMaterial base_color="#ffffff" unlit />
          <BevyComponent type="bevy_camera::visibility::NoFrustumCulling" value={{}} />
      </Mesh3d>
      {mp && mn ? (
        <Mesh3d key={`m${tag}`} name={`hot-hand-mirror${tag}`}>
          <BufferMesh positions={mp} normals={mn} uvs={MESH.uvs} indices={MESH_LEFT.indices} colors={col} />
          <StandardMaterial base_color="#ffffff" unlit />
          <BevyComponent type="bevy_camera::visibility::NoFrustumCulling" value={{}} />
        </Mesh3d>
      ) : null}
    </>
  );
}

/** the glass: a big sheet lying at y = 0, cold, letting `mirror` of the reflected hand through */
export function Glass({ mirror = 0.2, w = 40, d = 40 }: { mirror?: number; w?: number; d?: number }) {
  return (
    <Mesh3d name="glass" transform={Transform.fromXyz(0, -0.001, 0)}>
      <Cuboid half_size={[w / 2, 0.0005, d / 2]} />
      <StandardMaterial base_color={heat(ROOM, 1 - mirror)} unlit alpha_mode="Blend" />
    </Mesh3d>
  );
}

/** the heat a thumb left at (x, z): `age` seconds since it lifted (negative: not yet) */
export function Print({ x, z, age, turn = 0, peak = 0.62 }: { x: number; z: number; age: number; turn?: number; peak?: number }) {
  if (age < 0) return null;
  const sharp = Math.exp(-age / 1.7);
  const soft = Math.exp(-age / 3.2) * Math.min(1, age / 0.15 + 0.4);
  const grow = 1 + 0.12 * age;
  const S = 0.62; // the print's side, as the thumb's pad (x10 scale)
  const rot = Quat.fromRotationY(turn);
  return (
    <>
      <Mesh3d name="print-soft" transform={Transform.fromXyz(x, 0.002, z).withRotation(rot)}>
        <Cuboid half_size={[(S * 1.15 * grow) / 2, 0.0002, (S * 1.15 * grow) / 2]} />
        <StandardMaterial base_color={heat(ROOM + peak * 0.75, soft)} base_color_texture={staticFile("thermal/print-soft.png")} unlit alpha_mode="Blend" />
      </Mesh3d>
      {sharp > 0.02 ? (
        <Mesh3d name="print-sharp" transform={Transform.fromXyz(x, 0.003, z).withRotation(rot)}>
          <Cuboid half_size={[(S * (1 + 0.04 * age)) / 2, 0.0002, (S * (1 + 0.04 * age)) / 2]} />
          <StandardMaterial base_color={heat(ROOM + peak, sharp)} base_color_texture={staticFile("thermal/print.png")} unlit alpha_mode="Blend" />
        </Mesh3d>
      ) : null}
    </>
  );
}
