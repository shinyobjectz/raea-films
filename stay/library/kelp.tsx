// The kelp forest's components on the stand (parts/library.tsx): the seabed under 12 m of water, looking up through
// the kelp at the sun in the surface. Frame 0 is the forest lying over in the current, frame 30 standing.
//   raea render library/kelp.tsx --composition library-kelp --at 0,30 -o out/library/kelp/
import { Composition, registerRoot } from "raea";
import { Place, type Part, type V3 } from "../parts/library";
import { TOP, sand, on, SUN, KELP } from "../sets/kelp";

registerRoot(() => <Composition id="library-kelp" component={() => <Place place="kelp" parts={KELP} wall={false} eye={[0.2, 0.95, 9.2]} look={[0, 4.9, -1.5]} fov={70} />} width={1350} height={1080} fps={30} durationInFrames={31} />);
