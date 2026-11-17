// The pool hall's components on the stand (parts/library.tsx): the hall assembled from its parts with its near end, its
// left wall and three of its four ceiling bays left off so the stand's sun gets in. The deck stands 3.4 m over the
// stand's floor (the basin is 3 m deep under it).
//   raea render library/pool.tsx --composition library-pool --at 0,30 -o out/library/pool/
// library-pool-far and library-pool-side are closer looks (the far end; the right wall) and run each two-clip part's
// other clip, so every rig is seen; -left, -wall, -door, -board, -board-b, -bench, -blocks and -ladder are closer still:
//   --composition library-pool-far --at 0,15,30 -o out/library/pool/far/ (or side/, left/, wall/, door/).
import { Composition, registerRoot } from "raea";
import { Place, type Part, type V3 } from "../parts/library";
import { D, Q, WIN_Z, hall, view } from "../sets/pool";

registerRoot(() => (
  <>
    {view("library-pool", false, [-5.5, D + 4.4, 22], [1.4, D + 0.9, -6], 44)}
    {view("library-pool-far", true, [-2.4, D + 2.3, -1.5], [1.6, D + 1.5, -14], 50)}
    {view("library-pool-side", true, [-3.0, D + 2.4, 5.5], [6.5, D + 0.6, -3.5], 50)}
    {view("library-pool-left", false, [3.2, D + 2.0, 2.2], [-5.6, D + 0.8, 0.6], 50)}
    {view("library-pool-wall", false, [-3.0, D + 1.8, -9.0], [-3.3, D + 1.9, -15], 58)}
    {view("library-pool-door", false, [4.3, D + 1.7, -10.8], [5.5, D + 1.75, -15], 55)}
    {view("library-pool-board", false, [5.2, D + 1.9, -8.6], [0, D + 0.8, -11.4], 45)}
    {view("library-pool-board-b", true, [-3.4, D + 1.3, -9.6], [-0.2, D + 0.7, -11.2], 40)}
    {view("library-pool-bench", false, [5.3, D + 1.3, -3.0], [7.7, D + 0.35, -4.4], 45)}
    {view("library-pool-blocks", false, [-1.2, D + 1.5, 13.4], [1.2, D + 0.3, 9.8], 45)}
    {view("library-pool-ladder", false, [1.2, D + 1.2, -4.2], [4.2, D + 0.1, -6.4], 45)}
  </>
));
