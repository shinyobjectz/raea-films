// The glade shots (v3/glade.tsx) on their own, to look at before they are in the plan: m-ID, each its length in the cut.
//   raea render v3/macro-test.tsx --composition m-fern --frame 30 -o x.png
import { Composition, registerRoot, useCurrentFrame } from "raea";
import { FERN_LEN, FernShot, FernSurvey, FLOOR_LEN, FloorShot, WIDE_LEN, WideShot } from "./glade";
import { FPS, H, W } from "./plan";

const SHOTS: Record<string, { n: number; C: (p: { t: number }) => JSX.Element }> = {
  fern: { n: FERN_LEN, C: FernShot },
  survey: { n: 1, C: FernSurvey },
  floor: { n: FLOOR_LEN, C: FloorShot },
  wide: { n: WIDE_LEN, C: WideShot },
};
const Play = ({ id }: { id: string }) => { const { C } = SHOTS[id]; return <C t={useCurrentFrame() / FPS} />; };
registerRoot(() => (
  <>
    {Object.entries(SHOTS).map(([id, { n }]) => <Composition key={id} id={`m-${id}`} component={() => <Play id={id} />} width={W} height={H} fps={FPS} durationInFrames={n} />)}
  </>
));
