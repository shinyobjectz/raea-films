// The sea's components on the stand (parts/library.tsx): the still-water level at Y (above the stand's grey floor, so
// the swell's troughs clear it), the camera low over the water looking out to sea, the sun on the right.
//   raea render library/sea.tsx --composition library-sea --at 0,30 -o out/library/sea/
// the swell's height at rest over a point of the water (sea.py's waves), so what floats sits on the surface it is on
// the whole place, and three closer looks at the same parts (the pier's deck, the reef, the horizon)
import { Composition, registerRoot } from "raea";
import { Place, type Part } from "../parts/library";
import { Y, DECK, PIER, px, pz, WAVES, swell, afloat, HEAD, SEA, VIEWS } from "../sets/sea";

registerRoot(() => (
  <>
    {VIEWS.map((v) => (
      <Composition key={v.id} id={v.id} component={() => <Place place="sea" parts={SEA} eye={v.eye} look={v.look} fov={v.fov} wall={false} sun={6000} />} width={1350} height={1080} fps={30} durationInFrames={31} />
    ))}
  </>
));
