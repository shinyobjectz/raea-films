// The laundromat's components on the stand (parts/library.tsx): the room assembled from its parts, 9 x 6.4 m, the
// dryers along the back wall, the shopfront on the left, the washers along the right. Frame 0 is rest, frame 30 every
// rig at the end of its clip.
//   raea render library/laundromat.tsx --composition library-laundromat --at 0,30 -o out/library/laundromat/
import { Composition, registerRoot } from "raea";
import { Place, type Part, type V3 } from "../parts/library";
import { Q, BACK, LEFT, RIGHT, DRY, DRYERS, OPEN, TABLE, WASH, WASHERS, SHELF, LAUNDROMAT, VIEWS } from "../sets/laundromat";

registerRoot(() => (
  <>
    {Object.entries(VIEWS).map(([id, v]) => (
      <Composition key={id} id={id} component={() => <Place place="laundromat" parts={LAUNDROMAT} wall={false} {...v} />} width={1350} height={1080} fps={30} durationInFrames={31} />
    ))}
  </>
));
