// The lighthouse's components on the stand (parts/library.tsx): sea level is the stand's floor, the headland's
// plateau 20 m above it, the tower's gallery deck 18 m above that.
//   raea render library/lighthouse.tsx --composition library-lighthouse --at 0,30 -o out/library/lighthouse/
// the rigs the place's frame doesn't run: the lantern's gallery door, the beam's dip
// library-lighthouse is the place; -lens is the shot's hero (the lens the cut lands on) close to, -rigs the lantern with
// the clips the place's frame doesn't run.
import { Composition, registerRoot } from "raea";
import { Place, type Part } from "../parts/library";
import { TOP, DECK, HOUSE, LIGHTHOUSE, LENS, RIGS } from "../sets/lighthouse";

registerRoot(() => (
  <>
    <Composition id="library-lighthouse" component={() => <Place place="lighthouse" parts={LIGHTHOUSE} wall={false} eye={[50, 27, 96]} look={[-8, 21, 0]} />} width={1350} height={1080} fps={30} durationInFrames={31} />
    <Composition id="library-lighthouse-rigs" component={() => <Place place="lighthouse" parts={RIGS} wall={false} eye={[7, 4.5, 15]} look={[0, 3.2, 0]} />} width={1350} height={1080} fps={30} durationInFrames={31} />
    <Composition id="library-lighthouse-lens" component={() => <Place place="lighthouse" parts={LENS} eye={[1.2, 2.6, 5.2]} look={[0, 1.9, 0]} />} width={1350} height={1080} fps={30} durationInFrames={31} />
  </>
));
