// The parking garage's components on the stand (parts/library.tsx): one deck of the multi-storey, assembled from its
// parts. Positions are written as the deck's plan (x across, y back from the aisle, z up, as the components were
// built in Blender) and turned into raea's frame by `at`.
//   raea render library/garage.tsx --composition library-garage --at 0,30 -o out/library/garage/
import { Composition, registerRoot } from "raea";
import { Place, type Part, type V3 } from "../parts/library";
import { LIFT, at, H, WALL, PILLARS, PILLAR_Y, QUARTER, GARAGE } from "../sets/garage";

registerRoot(() => <Composition id="library-garage" component={() => <Place place="garage" parts={GARAGE} eye={[-8, 5.6, 19]} look={[-0.2, 0.6, 1.7]} fov={57} wall={false} />} width={1350} height={1080} fps={30} durationInFrames={31} />);
