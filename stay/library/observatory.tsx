// The observatory's components on the stand (parts/library.tsx). The room is turned on the stand so its slit faces
// the stand's sun, which stands in for the moon's light; the camera is inside, under the dome, and the room's own
// lamps (their glows traced as light by Solari) light the rest.
//   raea render library/observatory.tsx --composition library-observatory --at 0,30 -o out/library/observatory/
//   also: library-observatory-telescope (the telescope and pier alone, in daylight), library-observatory-moon (the moon, its phase)
import { Composition, registerRoot } from "raea";
import { Place, type Part, type V3 } from "../parts/library";
import { G, TURN, spin, turn, at, facing, on, wallAt, MOON, TABLE, TY, lamp, ROOM, view, SCOPE, FACE, stand } from "../sets/observatory";

registerRoot(() => (
  <>
    {view("library-observatory", [0.45, 1.5, 3.7], [-1.1, 2.9, -2.0], 66)}
    {view("library-observatory-floor", [-0.6, 2.3, 3.6], [1.2, 0.9, -1.2], 70)}
    {stand("library-observatory-telescope", SCOPE, [5.5, 2.6, 6.5], [0, 2.3, 0], 14000)}
    {stand("library-observatory-moon", FACE, [0, 2.2, 4.6], [0, 2.2, 0], 100)}
  </>
));
