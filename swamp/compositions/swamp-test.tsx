// Scouting stills of the swamp for the v3 send and beam: one composition a view, each a still lens at a frame.
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from "raea";
import { Page } from "../components/page";
import { type Lens, Shot, worldAt } from "../components/shot";

const HI: Lens = { pos: [0.97, 58, 3.54], look: [0.25, 65.4, 2.62], fov: 0.8 };
const VIEWS: Record<string, { f: number; cam: Lens; dbg?: string }> = {
  hi: { f: 1640, cam: HI },
  hinofog: { f: 1640, cam: HI, dbg: "nofog" },
  higrade: { f: 1640, cam: HI, dbg: "nofog nograde" },
  top: { f: 1522, cam: { pos: [0.3, 7.5, 5.5], look: [0.3, 0, 2.2], fov: 0.9 } },
  foot: { f: 1522, cam: { pos: [2.2, 0.9, 5.2], look: [0.6, 0.3, 1.8], fov: 0.75 } },
  wide: { f: 1552, cam: { pos: [-1.5, 1.6, 7.5], look: [0.25, 3, 2.6], fov: 0.9 } },
  wide2: { f: 1562, cam: { pos: [-1.5, 1.6, 7.5], look: [0.25, 3, 2.6], fov: 0.9 } },
};
function View({ v }: { v: string }) {
  const f = VIEWS[v].f + useCurrentFrame();
  return (
    <AbsoluteFill>
      <Shot frame={f} still={VIEWS[v].cam} page={<Page w={worldAt(f)} />} debug={VIEWS[v].dbg} />
    </AbsoluteFill>
  );
}
registerRoot(() => (
  <>
    {Object.keys(VIEWS).map((v) => (
      <Composition key={v} id={v} component={() => <View v={v} />} width={960} height={540} fps={30} durationInFrames={30} />
    ))}
  </>
));
