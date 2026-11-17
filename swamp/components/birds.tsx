// v4, 15-leaves: ravens burst out of the trees as the leaves break, scared off. A real model ("Flying Raven" by Google
// Data Arts Team, CC BY 3.0, via Poly Pizza: assets/models/raven/LICENSE.md), its wingbeat a flipbook of 11 morph
// targets, set here frame by frame (each bird its own beat and phase) rather than by its clip. The flight is
// birds-path.ts's.
import { staticFile } from "raea";
import { Model, eulerOf } from "raea/3d";
import { BIRDS, birdAt, wingWeights } from "./birds-path";
import { qa, qm } from "./quat";

const SRC = staticFile("models/raven/raven.glb");
/** 0.57 m long, 1.2 m across: a raven's size */
const SCALE = 0.013;
/** a bird waits where it will burst from, shrunk to nothing. In a video render a model mounted mid-shot never draws,
 *  nor does a node hidden (hide) on the first frame once it's shown, so they're all mounted, drawn, from the shot's
 *  first frame (checked in a probe render: hidden, none show; shrunk or shown, all do) */
const WAITING = SCALE * 1e-3;
const REST = wingWeights(0);

export function Birds({ f }: { f: number }) {
  return (
    <>
      {BIRDS.map((b, i) => {
        const s = birdAt(b, f);
        if (!s) return <Model key={i} name={`raven-${i}`} src={SRC} position={b.at} scale={WAITING} morphs={REST} />;
        // its beak (+z) along its heading, nose up by its climb, banked into its turn
        const q = qm(qm(qa([0, 1, 0], s.yaw), qa([1, 0, 0], -s.pitch)), qa([0, 0, 1], s.roll));
        return <Model key={i} name={`raven-${i}`} src={SRC} position={s.pos} rotation={eulerOf(q)} scale={SCALE} morphs={wingWeights(s.wing)} />;
      })}
    </>
  );
}
