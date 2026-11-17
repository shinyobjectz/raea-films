// The canyon's components on the stand (parts/library.tsx): the slot assembled from its parts and seen from its mouth,
// as the shot sees it. Outdoors, so no wall: the sky's half dome is the backdrop and fills the shade.
//   raea render library/canyon.tsx --composition library-canyon --at 0,30 -o out/library/canyon/
// The stand's sun is fixed (parts/library.tsx: from behind the camera's left shoulder), so the whole canyon is turned
// 28 degrees to let it shine down the slot from the mouth; `turn` moves a part's place and its yaw together.
import { Composition, registerRoot } from "raea";
import { Place, type Part } from "../parts/library";
import { S, TURN, spot, turn, CANYON } from "../sets/canyon";

registerRoot(() => <Composition id="library-canyon" component={() => <Place place="canyon" parts={CANYON} wall={false} fov={62} eye={spot([-0.4, 1.7, 6.5])} look={spot([0.9, 3.6, -10])} />} width={1350} height={1080} fps={30} durationInFrames={31} />);
