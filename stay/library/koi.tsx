// The koi pond's components on the stand (parts/library.tsx): the garden assembled from its parts. The pond goes
// below its ground, so the whole garden is lifted LIFT above the stand's floor and sits on it as a block.
//   raea render library/koi.tsx --composition library-koi --at 0,30 -o out/library/koi/
import { Composition, registerRoot } from "raea";
import { Place, type Part } from "../parts/library";
import { LIFT, W, up, KOI } from "../sets/koi";

registerRoot(() => <Composition id="library-koi" component={() => <Place place="koi" parts={KOI} wall={false} eye={[2.4, 5.2, 9.0]} look={[0, 0.9, -0.6]} />} width={1350} height={1080} fps={30} durationInFrames={31} />);
