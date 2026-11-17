// The review room's shots alone at their film frames, for stills while they're made (the film renders them from
// hype.tsx).
import { Composition, registerRoot, useCurrentFrame } from "raea";
import { ROOM_SHOTS, RoomShot } from "../components/room";

const SHOTS = ROOM_SHOTS(1850, 1980, 2045, 2165);
function Frame({ i, debug = "" }: { i: number; debug?: string }) {
  const s = SHOTS[i];
  return <RoomShot f={useCurrentFrame() + s.from} s={s} debug={debug} />;
}
registerRoot(() => (
  <>
    {SHOTS.map((s, i) => (
      <Composition key={s.id} id={`p${s.id}`} component={() => <Frame i={i} />} width={960} height={540} fps={30} durationInFrames={s.to - s.from} />
    ))}
    {SHOTS.map((s, i) => (
      <Composition key={`${s.id}-hd`} id={`h${s.id}`} component={() => <Frame i={i} />} width={1920} height={1080} fps={30} durationInFrames={s.to - s.from} />
    ))}
    {SHOTS.map((s, i) => (
      <Composition key={`${s.id}-nodof`} id={`n${s.id}`} component={() => <Frame i={i} debug="nodof" />} width={960} height={540} fps={30} durationInFrames={s.to - s.from} />
    ))}
  </>
));
