// The stairwell's components on the stand (parts/library.tsx), put together as the place: four storeys of the round
// stair under its skylight. Four views of the same parts: down the well from under the skylight (the shot's own
// view), up from the ground floor to the skylight, the ground floor's wall, and a landing from across the well.
// Frame 0 is rest (the lamps off, lit by the skylight's moonlit glass alone), frame 30 every rig at full travel.
// Render frame 0 and frame 30 in separate processes for true light: a traced render holds its first frame's lights,
// so in one --at 0,30 run the lamps that come on by frame 30 light the well only dimly.
//   raea render library/stairwell.tsx --composition library-stairwell --at 0,30 -o out/library/stairwell/
//   ... --composition library-stairwell-up | library-stairwell-ground | library-stairwell-landing  -o out/library/stairwell/NAME/
import { Composition, registerRoot } from "raea";
import { Place, type Part, type V3 } from "../parts/library";
import { H, RW, STOREYS, TOP, rad, at, wall, parts, view } from "../sets/stairwell";

registerRoot(() => (
  <>
    {view("library-stairwell", [0.1, TOP + 2.7, 0.25], [0, 0, 0], 74)}
    {view("library-stairwell-up", [0.2, 0.5, 0.4], [0, TOP + 3, 0], 80)}
    {view("library-stairwell-ground", [1.7, 1.5, 0.3], [-2.3, 1.05, 0.2], 78)}
    {view("library-stairwell-landing", [0.3, 2 * H + 1.7, -2.0], [0, 2 * H + 1.2, 2.4], 66)}
  </>
));
