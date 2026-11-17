// The space shots alone at their film frames, for stills while they're made (the film renders them from hype.tsx).
import { Composition, registerRoot, useCurrentFrame } from "raea";
import { ORBIT_SHOTS, OrbitShot } from "../components/orbit";

const SHOTS = ORBIT_SHOTS(1670, 1790, 1850, 2165, 2325);
function Frame({ i, debug = "" }: { i: number; debug?: string }) {
  const s = SHOTS[i];
  return <OrbitShot f={useCurrentFrame() + s.from} s={s} debug={debug} />;
}
registerRoot(() => (
  <>
    {SHOTS.map((s, i) => (
      <Composition key={s.id} id={`p${s.id}`} component={() => <Frame i={i} />} width={960} height={540} fps={30} durationInFrames={s.to - s.from} />
    ))}
    {SHOTS.map((s, i) => (
      <Composition key={`${s.id}-hd`} id={`h${s.id}`} component={() => <Frame i={i} />} width={1920} height={1080} fps={30} durationInFrames={s.to - s.from} />
    ))}
  </>
));
