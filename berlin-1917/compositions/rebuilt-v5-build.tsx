// Berlin, Winter 1917, v5 (the director on v4 at 2:24: "show a time lapse of building the room in 3D" while the voice asks
// whether we could stand in that room). The porter's Stube at Ritterstraße 120 (interiors/sets/porter.ts, from plate
// z2_1917_MP_0075) assembling: wireframe, the grey shell, the furniture arriving in waves, textures and light, and the
// finished room, on one camera path that never stops (CAM, in the sequence's seconds) and lands on rb-loft's first
// frame (compositions/rebuilt-v2-shots.tsx: porter-day's "stube" camera), so the last stage dissolves into the Kling loft.
// A render settles its 3D look on frame 1, so each stage is its own composition over its window of the path (T0..T1),
// put together in 2D afterwards (tools: tools/build5.py); inside a stage only transforms move (the furniture drops
// in by its transform, scaled from nothing).
//   build-wire   the bare shell, open-topped (no ceiling, no front wall), as lines (Bevy's global wireframe, dark faces)
//   build-clay   the same shell in grey, then the furniture arriving in four waves
//   build-tex    every surface and light, still open-topped, as the camera comes down over the front wall
//   build-final  porter-day itself, ceiling and front wall in, the camera inside, ending on the stube camera
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from "raea";
import { Camera3d, Canvas3D } from "raea/camera";
import { AmbientLight, RectLight } from "raea/light";
import { Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Bloom, ToneMapping } from "raea/post_process";
import { Quat, Transform } from "raea/transform";
import { WireframeConfigResource } from "raea/bevy-own";
import { LUM, Mat, SetView, build } from "../interiors/draw/set";
import { PORTER_DAY, STUBE_SHELL } from "../interiors/sets/porter";
import type { Room, Set } from "../interiors/sets/types";

const FPS = 24;
type V3 = [number, number, number];
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const BASE = PORTER_DAY.cams.find((c) => c.id === "stube")!;

// ---- the camera: Catmull-Rom through keys, eased only at the very start and end, so it never stops between ----
const KEYS: [number, V3, V3][] = [
  [0, [3.9, 4.2, 6.0], [1.9, 0.4, 1.4]],
  [4, [3.4, 3.8, 5.7], [1.85, 0.42, 1.3]],
  [8, [2.6, 3.3, 5.2], [1.8, 0.5, 1.15]],
  [11.5, [1.9, 2.6, 4.5], [1.7, 0.62, 0.9]],
  [13.8, [2.2, 1.85, 3.6], [1.62, 0.85, 0.35]],
  [15.2, [2.38, 1.5, 2.95], [1.57, 0.93, 0.08]],
  [17, BASE.eye as V3, BASE.at as V3],
];
const END = 17;
function cr(p0: number, p1: number, p2: number, p3: number, u: number) {
  return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
}
export function camAt(T: number): { eye: V3; at: V3; fov: number } {
  if (T > END) {
    const k = ease(Math.min(1, (T - END) / (7 - 1 / FPS)));
    return { eye: [BASE.eye[0] - 0.35 * k, BASE.eye[1] - 0.04 * k, BASE.eye[2] - 0.6 * k], at: [BASE.at[0] - 0.25 * k, BASE.at[1], BASE.at[2]], fov: BASE.fov };
  }
  // linear in time: the Catmull-Rom spline has no stops at its keys, and its doubled end keys slow it into the last
  const t = Math.min(END, Math.max(0, T));
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1][0]) i++;
  const k0 = KEYS[Math.max(0, i - 1)], k1 = KEYS[i], k2 = KEYS[i + 1], k3 = KEYS[Math.min(KEYS.length - 1, i + 2)];
  const u = Math.min(1, Math.max(0, (t - k1[0]) / (k2[0] - k1[0])));
  const P = (j: 1 | 2) => [0, 1, 2].map((a) => cr(k0[j][a], k1[j][a], k2[j][a], k3[j][a], u)) as V3;
  // the lens: 58 degrees over the open room, opening to the plate camera's 74 as it comes inside
  const fov = 58 + (BASE.fov - 58) * ease((t - 11.5) / 4.5);
  return { eye: P(1), at: P(2), fov };
}

// ---- the sets ----
const stubeRoom = PORTER_DAY.rooms.find((r) => r.id === "stube")!;
const OPEN: Room = { ...stubeRoom, shell: { ...STUBE_SHELL, ceiling: "none", skip: ["right", "front"] } };
const OPEN_SET: Set = { ...PORTER_DAY, id: "porter-build-open", rooms: [OPEN], fog: undefined };
const SHELL_SET: Set = { ...OPEN_SET, id: "porter-build-shell", rooms: [{ ...OPEN, props: [] }] };

/** the waves the furniture arrives in, by prop id, in the sequence's seconds (the clay stage runs about 4..11.5) */
const WAVE: Record<string, number> = {
  "window-50x80": 5.6, "curtain-plain": 5.9,
  "bed-wood": 6.6, "bed-iron": 7.0,
  "kitchen-table": 7.8, chair: 8.1, "potato-sack": 8.5, "coffee-mill": 8.8,
  "chest-drawers": 9.2, "chest-clutter": 9.6, "wall-shelf": 9.5, "mirror-small": 9.9, "petroleum-wall": 10.1, photos: 10.3, oleograph: 10.4,
};
const DROP = 0.7; // seconds each piece takes to drop in and settle

function Rooms({ set, T, wire, arrive, clay }: { set: Set; T: number; wire?: boolean; arrive?: boolean; clay?: boolean }) {
  const b = build(set);
  const ink = <StandardMaterial base_color="#0b0e13" unlit />;
  // the grey pass drawn here, not with --clay (which reframed the camera against the textured render)
  const grey = <StandardMaterial base_color="#a9a7a2" perceptual_roughness={0.92} />;
  return (
    <>
      {b.shells.map((s) => (
        <Mesh3d key={s.key} name={`shell-${s.key}`} shape={s.solid} transform={Transform.fromXyz(...s.at).withRotation(Quat.fromEuler("XYZ", 0, s.yaw, 0))}>
          {wire ? ink : clay ? grey : <Mat id={s.mat} wear={set.wear} />}
        </Mesh3d>
      ))}
      {[...b.groups.entries()].flatMap(([id, g]) =>
        g.at.flatMap((a, k) => {
          const w0 = (WAVE[id] ?? 10.5) + k * 0.25, p = arrive ? ease((T - w0) / DROP) : 1;
          // shrunk to nothing until its wave, then dropping 0.5 m into place as it grows (never unmounted)
          const sc = Math.max(0.001, p) * a.scale, dy = (1 - p) * 0.5;
          return g.prop.parts.map((q, i) => (
            <Mesh3d key={`${id}-${k}-${i}`} name={`prop-${id}-${k}-${i}`} shape={q.solid} allowOverlap={q.overlap} transform={Transform.fromXyz(a.position[0], a.position[1] + dy, a.position[2]).withRotation(Quat.fromEuler("XYZ", 0, a.rotation[1] + (1 - p) * 0.6, 0)).withScale([sc, sc, sc])}>
              {wire ? ink : clay ? grey : <Mat id={q.mat} wear={set.wear} dark={g.dark} />}
            </Mesh3d>
          ));
        }),
      )}
    </>
  );
}

/** an open-topped stage: the camera on the path, soft light from above (a sky panel over the open room) and the set's own */
function OpenStage({ T, set, wire, arrive, clay, exposure = 0 }: { T: number; set: Set; wire?: boolean; arrive?: boolean; clay?: boolean; exposure?: number }) {
  const c = camAt(T);
  return (
    <AbsoluteFill style={{ background: wire ? "#0b0e13" : "#1a1c20" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...c.eye).lookingAt(c.at)} projection={{ Perspective: { fov: (c.fov * Math.PI) / 180, near: 0.05, far: 200 } }} />
        {wire ? <WireframeConfigResource value={{ global: true, default_color: { LinearRgba: { red: 0.55, green: 0.8, blue: 1.0, alpha: 1 } }, default_line_width: 1.4 }} /> : null}
        <AmbientLight brightness={wire ? 0 : set.ambient.brightness * 1.6} color={set.ambient.color} />
        {!wire ? <RectLight name="sky-over" transform={Transform.fromXyz(1.9, 6, 1.5).lookingAt([1.9, 0, 1.5])} intensity={260 * LUM} width={5} height={4} color="#d8dde6" /> : null}
        {!wire ? <RectLight name="flash" transform={Transform.fromXyz(c.eye[0], c.eye[1] - 0.2, c.eye[2]).lookingAt(c.at)} intensity={120 * LUM} width={0.6} height={0.6} color="#ffe8c8" /> : null}
        <Rooms set={set} T={T} wire={wire} arrive={arrive} clay={clay} />
        {!wire ? <Bloom intensity={0.1} /> : null}
        <ToneMapping mode={wire ? "none" : "agx"} exposure={wire ? 0 : set.exposure + exposure} />
      </Canvas3D>
    </AbsoluteFill>
  );
}

function FinalStage({ T }: { T: number }) {
  const c = camAt(T);
  return (
    <AbsoluteFill style={{ background: "#050506" }}>
      <Canvas3D>
        <SetView set={PORTER_DAY} cam={{ ...BASE, eye: c.eye, at: c.at, fov: c.fov }} />
      </Canvas3D>
    </AbsoluteFill>
  );
}

// each stage: its window [T0, T1] of the sequence (overlapping its neighbours for the transitions)
type Stage = { id: string; T0: number; T1: number; draw: (T: number) => JSX.Element };
const STAGES: Stage[] = [
  // the line pass is an edge-detect of build-clay's first seconds (tools/build5.py): Bevy's global wireframe
  // (WireframeConfigResource) drew nothing in a raea render, so the `wire` path above is kept only for a later try
  { id: "build-clay", T0: 0, T1: 12.0, draw: (T) => <OpenStage T={T} set={OPEN_SET} arrive clay /> },
  { id: "build-tex", T0: 11.0, T1: 15.8, draw: (T) => <OpenStage T={T} set={OPEN_SET} /> },
  { id: "build-final", T0: 15.0, T1: 18.0, draw: (T) => <FinalStage T={T} /> },
];

registerRoot(() => (
  <>
    {STAGES.map((s) => (
      <Composition key={s.id} id={s.id} width={1920} height={1080} fps={FPS} durationInFrames={Math.round((s.T1 - s.T0) * FPS)} component={() => {
        const T = s.T0 + useCurrentFrame() / FPS;
        return s.draw(T);
      }} />
    ))}
  </>
));
