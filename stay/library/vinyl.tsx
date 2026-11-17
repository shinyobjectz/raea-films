// The record shop's components on the stand (parts/library.tsx): the shop assembled from its parts, less the ceiling
// (the stand's sun has to reach the floor).
//   raea render library/vinyl.tsx --composition library-vinyl --at 0,30 -o out/library/vinyl/
import { Composition, registerRoot } from "raea";
import { Place, type Part } from "../parts/library";
import { TOP, BAR, VINYL } from "../sets/vinyl";

registerRoot(() => <Composition id="library-vinyl" component={() => <Place place="vinyl" parts={VINYL} wall={false} eye={[1.6, 2.5, 6.4]} look={[-0.2, 0.95, -0.6]} />} width={1350} height={1080} fps={30} durationInFrames={31} />);
