// The diner's components on the stand (parts/library.tsx): the counter and its stools before the back wall, a booth
// under the window with the neon in it, the jukebox at the left.
//   raea render library/diner.tsx --composition library-diner --at 0,30 -o out/library/diner/
// library-diner-cup is the montage's circle on its own: the coffee cup from straight above (the cream's turn);
// library-diner-counter is a closer look along the counter (the small props and their rigs).
// (the counter's top a centimetre over the stand's floor, so the two don't fight)
import { Composition, registerRoot } from "raea";
import { Place, type Part } from "../parts/library";
import { TOP, TABLE, WALL, DINER, CUP } from "../sets/diner";

registerRoot(() => (
  <>
    <Composition id="library-diner" component={() => <Place place="diner" parts={DINER} eye={[2.3, 2.5, 7.4]} look={[0.1, 1.2, -1.4]} wall={false} sun={8000} />} width={1350} height={1080} fps={30} durationInFrames={31} />
    <Composition id="library-diner-cup" component={() => <Place place="diner" parts={CUP} eye={[0, 0.43, 0.001]} look={[0, 0.01, 0]} wall={false} sun={8000} />} width={1350} height={1080} fps={30} durationInFrames={31} />
    <Composition id="library-diner-counter" component={() => <Place place="diner" parts={DINER} eye={[-0.3, 1.75, 1.3]} look={[-1.25, 1.05, -1.3]} wall={false} sun={8000} />} width={1350} height={1080} fps={30} durationInFrames={31} />
  </>
));
