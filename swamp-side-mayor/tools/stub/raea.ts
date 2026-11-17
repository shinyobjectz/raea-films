// A bun preload that stands in for raea's packages, so a tool can read the tutorial's tables (components/tut/shots.ts
// and what it imports) outside the renderer: every name the project imports from raea, as a harmless function. Nothing
// here draws; a tool that calls one of these gets nothing back.  bun --preload ./tools/stub/raea.ts tools/tut_root.ts
import { plugin } from "bun";
const NAMES: Record<string, string[]> = {
  raea: ["AbsoluteFill", "Audio", "Composition", "Mix", "Sequence", "Video", "interpolate", "registerRoot", "staticFile", "useCurrentFrame", "Img"],
  "raea/3d": ["BufferMesh", "Fog", "FramePass", "Grass", "ImagePlane", "Instances", "Look", "Model", "Outline", "Screen", "Shadows", "ToneMapping", "Vec3", "Volume", "VolumeProps", "crossSection", "manifold", "scatter", "sdf"],
  "raea/pbr": ["ExtendedMaterial", "PaintExtension", "StandardMaterial"],
  "raea/light": ["AmbientLight", "DirectionalLight"],
  "raea/transform": ["Quat", "Transform"],
  "raea/mesh": ["Capsule3d", "Cuboid", "Cylinder", "Mesh3d", "Sphere"],
  "raea/speech": ["Speech", "speechDuration"],
  "raea/camera": ["Camera3d"],
};
// a stand-in that can be called, chained and constructed without failing (manifold.union(...).minus(...), Quat.fromAxisAngle)
const inert: any = new Proxy(function () {}, { get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : inert), apply: () => inert, construct: () => inert });
plugin({
  name: "raea-stub",
  setup(build) {
    for (const [mod, names] of Object.entries(NAMES)) build.module(mod, () => ({ exports: Object.fromEntries(names.map((n) => [n, n === "staticFile" ? (p: string) => p : inert])), loader: "object" }));
    build.module("react/jsx-runtime", () => ({ exports: { jsx: inert, jsxs: inert, Fragment: inert }, loader: "object" }));
    build.module("react/jsx-dev-runtime", () => ({ exports: { jsxDEV: inert, Fragment: inert }, loader: "object" }));
    build.module("react", () => ({ exports: { default: inert, useMemo: (f: () => unknown) => f(), createElement: inert, Fragment: inert }, loader: "object" }));
  },
});
