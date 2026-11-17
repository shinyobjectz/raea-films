// The gym's components on the stand (parts/library.tsx): half the court under the baseline wall, its three goals at
// three heights (the place's wrong detail), the bleachers folded on the side wall, the roof's joists and caged lights.
// The court's origin (under the middle rim) is the stand's.
//   raea render library/gym.tsx --composition library-gym --at 0,30 -o out/library/gym/
// library-gym-ball is the montage's circle on its own: the ball from the free-throw line, bounced to the upper third;
// library-gym-close is a closer look at the ball rack, the rope and two of the goals.
import { Composition, registerRoot } from "raea";
import { Place, type Part } from "../parts/library";
import { WALL, SIDE, ROOF, HUNG, Q, GYM } from "../sets/gym";

registerRoot(() => (
  <>
    <Composition id="library-gym" component={() => <Place place="gym" parts={GYM} eye={[-8.5, 3.6, 16.5]} look={[1.2, 3.1, -1]} fov={46} wall={false} />} width={1350} height={1080} fps={30} durationInFrames={31} />
    <Composition id="library-gym-ball" component={() => <Place place="gym" parts={GYM} eye={[0.9, 1.3, 8.6]} look={[0.9, 1.55, 0]} fov={40} wall={false} />} width={1350} height={1080} fps={30} durationInFrames={31} />
    <Composition id="library-gym-close" component={() => <Place place="gym" parts={GYM} eye={[-6.5, 1.7, 6.2]} look={[-3.2, 1.2, 0]} fov={40} wall={false} />} width={1350} height={1080} fps={30} durationInFrames={31} />
  </>
));
