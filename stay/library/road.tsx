// The forest road's components on the stand (parts/library.tsx): one 40 m section of road with its paint, puddles and
// both verges, the trees and the verge's dressing where they belong, the car coming down its lane through the first
// puddle with the spray at its wheel, and the windscreen (the shot's first frame is from behind it) set by itself on
// the near shoulder.
//   raea render library/road.tsx --composition library-road --at 0,30 -o out/library/road/
//   and two closer looks at the rigs: --composition library-road-car -o out/library/road/car/, --composition library-road-seat -o out/library/road/seat/
// the car close to, for its rig: its wipers swept, a second car with its wheels steered, the spray at a wheel
// from the driver's seat: the windscreen's rain and the wipers' sweep over the road
import { Composition, registerRoot } from "raea";
import { Place, type Part } from "../parts/library";
import { Y, LANE, ROAD, CAR, SEAT } from "../sets/road";

registerRoot(() => (
  <>
    <Composition id="library-road" component={() => <Place place="road" parts={ROAD} wall={false} eye={[3.4, Y + 1.75, 9.4]} look={[-0.9, Y + 1.3, -6]} fov={55} />} width={1350} height={1080} fps={30} durationInFrames={31} />
    <Composition id="library-road-car" component={() => <Place place="road" parts={CAR} wall={false} eye={[1.6, 1.45, 14.2]} look={[-0.6, 0.75, 8.2]} fov={42} />} width={1350} height={1080} fps={30} durationInFrames={31} />
    <Composition id="library-road-seat" component={() => <Place place="road" parts={SEAT} wall={false} eye={[1.6 - 0.37, Y + 1.14, 6 + 0.02]} look={[1.6 - 0.2, Y + 1.0, -6]} fov={62} />} width={1350} height={1080} fps={30} durationInFrames={31} />
  </>
));
