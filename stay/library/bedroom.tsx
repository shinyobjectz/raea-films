// The bedroom's components on the stand (parts/library.tsx): the room's own floor, its window wall and its side wall,
// and everything in its place. No ceiling stands here (the stand's sun has to reach the room), so the model planes
// hang at ceiling height in the air.
//   raea render library/bedroom.tsx --composition library-bedroom --at 0,30 -o out/library/bedroom/
// The stand runs one clip a part, so library-bedroom-rigs runs each part's second clip (the blinds' slats, the
// window's sash, the fish, ...), and the close views (-desk, -desk-rigs, -bed, -window, -shelf, -floor, -planes)
// look at the small things, -ceiling stands the ceiling on and -walls and -walls-in the other two walls (they shade the stand's sun, so only there):  --composition library-bedroom-desk -o out/library/bedroom/desk/
// Each part's other clips, for the second and third stands.
// The ceiling stands only in its own view: on the stand it would shade the room from the stand's sun.
// The other two walls stand only in -walls, seen from above: one is between the stand's sun and the room, the stand's camera looks through the other.
import { Composition, registerRoot } from "raea";
import { Place, type Part } from "../parts/library";
import { F, BACK, SIDE, WIN, BED, DESK_Z, d, CASE, SHELF, BEDROOM, OTHER, RIGS, THIRD, RIGS3, CEILED, WALLED, view } from "../sets/bedroom";

registerRoot(() => (
  <>
    {view("library-bedroom", BEDROOM, [-2.5, 2.25, 5.0], [0.3, 1.05, -0.9])}
    {view("library-bedroom-rigs", RIGS, [-2.5, 2.25, 5.0], [0.3, 1.05, -0.9])}
    {view("library-bedroom-desk", BEDROOM, [0.5, 1.5, 0.3], [2.0, 0.92, -0.6], 50)}
    {view("library-bedroom-desk-rigs", RIGS, [0.5, 1.5, 0.3], [2.0, 0.92, -0.6], 50)}
    {view("library-bedroom-desk-top", RIGS3, [1.5, 2.3, -0.6], [1.76, 0.77, -0.6], 50)}
    {view("library-bedroom-nightstand", RIGS, [-1.3, 1.2, -0.7], [-1.84, 0.62, -1.5], 45)}
    {view("library-bedroom-bed", RIGS, [-0.9, 1.7, 0.9], [-0.9, 1.1, -1.8], 55)}
    {view("library-bedroom-window", BEDROOM, [-0.6, 1.5, -0.2], [-0.6, 1.62, -1.8], 50)}
    {view("library-bedroom-shelf", RIGS3, [1.1, 1.6, -0.35], [1.35, 1.35, -1.8], 55)}
    {view("library-bedroom-floor", RIGS3, [-0.9, 1.5, 2.2], [-0.1, 0.1, 0.5], 50)}
    {view("library-bedroom-sun", BEDROOM, [-2.5, 2.25, 5.0], [-1.6, 2.5, -4.0])}
    {view("library-bedroom-ceiling", CEILED, [-1.9, 0.5, 2.6], [0.4, 2.5, -0.3], 60)}
    {view("library-bedroom-walls", WALLED, [-1.2, 7.2, 3.4], [0, 0.6, 0.1], 48)}
    {view("library-bedroom-walls-in", WALLED, [1.6, 1.5, -1.3], [-1.0, 1.15, 1.4], 70)}
    {view("library-bedroom-planes", RIGS, [0.1, 1.75, 1.4], [0.1, 2.1, 0.1], 50)}
  </>
));
