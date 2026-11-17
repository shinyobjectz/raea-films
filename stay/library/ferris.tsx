// The closed fair's components on the stand (parts/library.tsx), put together as the place: the Ferris wheel on its
// platform behind the entrance arch, the ticket booth, two stalls, the high striker, poles with string lights and
// bunting, and what a fair leaves out overnight. Three views of the same parts: the whole fair, the midway at eye
// height, and the wheel alone square-on (the shot's own view of its circle). Frame 0 is rest (bulbs off, shutters
// down), frame 30 every rig at full travel (the wheel a whole turn round, every bulb lit).
//   raea render library/ferris.tsx --composition library-ferris --at 0,30 -o out/library/ferris/
//   ... --composition library-ferris-midway | library-ferris-wheel  -o out/library/ferris/NAME/
// Render frame 0 and frame 30 in separate processes for true light: a traced render holds its first frame's lights.
import { Composition, registerRoot } from "raea";
import { Place, type Part, type V3 } from "../parts/library";
import { rad, WZ, POLES, parts, view } from "../sets/ferris";

registerRoot(() => (
  <>
    {view("library-ferris", [13, 9.5, 27], [0, 7.2, -2], 52)}
    {view("library-ferris-midway", [-1.5, 1.7, 12.2], [-2.5, 2.4, 0], 70)}
    {view("library-ferris-wheel", [0, 3.2, 11.6], [0, 10.2, WZ], 62)}
    {view("library-ferris-props", [-3.5, 2.6, 9.5], [-10, 1.0, 4.6], 58)}
  </>
));
