// The cathedral's components on the stand (parts/library.tsx): four bays of the nave assembled from its shell parts,
// looking down the centre aisle at the rose window.
//   raea render library/cathedral.tsx --composition library-cathedral --at 0,30 -o out/library/cathedral/
import { Composition, registerRoot } from "raea";
import { Place, type Part, type V3 } from "../parts/library";
import { F, H, BAYS, PIERS, MENSA, SHELL, PEWS, CATHEDRAL } from "../sets/cathedral";

registerRoot(() => <Composition id="library-cathedral" component={() => <Place place="cathedral" parts={CATHEDRAL} wall={false} eye={[0.25, 1.7, 11.6]} look={[0, 6.0, -9]} fov={62} sun={9000} />} width={1350} height={1080} fps={30} durationInFrames={31} />);
