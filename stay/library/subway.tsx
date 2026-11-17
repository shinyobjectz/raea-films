// The subway platform's components on the stand (parts/library.tsx): the station assembled from its shell parts,
// the train waiting 6 m inside the tunnel ("arrive" runs it 20 m in, alongside the platform).
//   raea render library/subway.tsx --composition library-subway --at 0,30 -o out/library/subway/
import { Composition, registerRoot } from "raea";
import { Place, type Part } from "../parts/library";
import { Q, DECK, MOUTH, SUBWAY } from "../sets/subway";

registerRoot(() => <Composition id="library-subway" component={() => <Place place="subway" parts={SUBWAY} eye={[1.3, 2.9, 4.6]} look={[0.5, 2.7, -18]} fov={50} wall={false} />} width={1350} height={1080} fps={30} durationInFrames={31} />);
