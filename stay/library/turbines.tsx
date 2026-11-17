// The wind ridge's components on the stand (parts/library.tsx): the valley floor is the stand's floor, the ridge's
// level crest 30 m above it; three turbines stand along it 100 m apart, the nearest (the shot's rotor) at the origin.
//   raea render library/turbines.tsx --composition library-turbines --at 0,30 -o out/library/turbines/
// the rigs the place's frame doesn't run: the blades' pitch, the nacelle's yaw, the windsock filling, the mast's vane
// library-turbines is the place; -near is the first turbine's foot and its dressing, -hub the shot's rotor close to,
// -rigs the clips the place's frame doesn't run.
import { Composition, registerRoot } from "raea";
import { Place, type Part } from "../parts/library";
import { CREST, ROW, TURBINES, ONE, RIGS } from "../sets/turbines";

registerRoot(() => (
  <>
    <Composition id="library-turbines" component={() => <Place place="turbines" parts={TURBINES} wall={false} eye={[60, 42, 170]} look={[-56.7, 66.4, 9.4]} fov={54} />} width={1350} height={1080} fps={30} durationInFrames={31} />
    <Composition id="library-turbines-near" component={() => <Place place="turbines" parts={TURBINES} wall={false} eye={[34, 36, 34]} look={[4, 31.5, -2]} fov={42} />} width={1350} height={1080} fps={30} durationInFrames={31} />
    <Composition id="library-turbines-rigs" component={() => <Place place="turbines" parts={RIGS} wall={false} eye={[0, 50, 230]} look={[0, 58, 0]} fov={50} />} width={1350} height={1080} fps={30} durationInFrames={31} />
    <Composition id="library-turbines-hub" component={() => <Place place="turbines" parts={ONE} wall={false} eye={[14, 74, 38]} look={[0, 80, 2]} fov={40} />} width={1350} height={1080} fps={30} durationInFrames={31} />
  </>
));
