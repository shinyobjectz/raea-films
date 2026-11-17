// A look at each new room from where the walk enters it, and from above with its ceiling off, to check the layouts.
//   raea render v3/rooms-look.tsx --composition look-kitchen --frame 20 -o out/v3/t/kitchen.png   (top-kitchen: from above)
import { Composition, registerRoot } from "raea";
import { ROOMS, roomItems } from "../sets/rooms";
import { Scene } from "./scene";

const View = ({ place, top }: { place: string; top?: boolean }) => (
  <Scene items={roomItems(place, 0.3).filter((p) => !top || p.file !== "ceiling")}
    cam={top ? { eye: [0.01, 9.5, 0.6], look: [0, 0, 0], fov: 46 } : { eye: [0, 1.5, 3.0], look: [0, 1.25, -3.2], fov: 52 }}
    sun={{ lux: 60000, from: [30, 16, 8], to: [0, 0.8, 0], color: "#ffd9b0" }} env={{ src: "kloofendal_48d_partly_cloudy_puresky", intensity: 1.2, rotation: 1.2 }} ev={top ? 0 : 2.6}
    look={{ base: 0, warm: 0.3 }} />
);
registerRoot(() => (
  <>
    {ROOMS.map((r) => <Composition key={r} id={`look-${r}`} component={() => <View place={r} />} width={1350} height={1080} fps={30} durationInFrames={40} />)}
    {ROOMS.map((r) => <Composition key={`t${r}`} id={`top-${r}`} component={() => <View place={r} top />} width={1350} height={1080} fps={30} durationInFrames={40} />)}
  </>
));
