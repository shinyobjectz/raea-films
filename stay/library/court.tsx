// The outdoor court's components on the stand (parts/library.tsx): night, so the stand's sun is down to moonlight
// and the floodlight's own lens lights the court (Solari traces a glow as light).
//   raea render library/court.tsx --composition library-court --at 0,30 -o out/library/court/
//   raea render library/court.tsx --composition library-court-hoop --at 0,30 -o out/library/court/hoop/
//   also: library-court-gate (the gate, bin, bench and bag), library-court-fence (the sign, tyre and weeds)
import { Composition, registerRoot } from "raea";
import { Place, type Part, type V3 } from "../parts/library";
import { G, BASE, RIM, BACK, LAMP, AIM, COURT, view } from "../sets/court";

registerRoot(() => (
  <>
    {view("library-court", [6.2, 2.4, 6.8], [-2.5, 2.7, -6], 46)}
    {view("library-court-hoop", [-1.5, 1.75, -2.4], [0.15, 2.85, -5.5], 42)}
    {view("library-court-gate", [2.2, 1.7, -3.6], [6.6, 1.0, -8.6], 62)}
    {view("library-court-fence", [-1.2, 1.6, -4.6], [-5.2, 0.9, -9.4], 62)}
  </>
));
