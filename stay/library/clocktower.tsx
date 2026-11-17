// The clock tower's components on the stand (parts/library.tsx): the clock room behind the dial.
//   raea render library/clocktower.tsx --composition library-clocktower --at 0,30 -o out/library/clocktower/
import { Composition, registerRoot } from "raea";
import { Place, type Part } from "../parts/library";
import { MX, DIAL, CRATE, CLOCKTOWER } from "../sets/clocktower";

registerRoot(() => <Composition id="library-clocktower" component={() => <Place place="clocktower" parts={CLOCKTOWER} eye={[0.7, 2.7, 8.6]} look={[-0.1, 1.75, -1.0]} fov={36} wall={false} />} width={1350} height={1080} fps={30} durationInFrames={31} />);
