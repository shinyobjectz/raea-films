// The office's components on the stand (parts/library.tsx).
//   raea render library/office.tsx --composition library-office --at 0,30 -o out/library/office/
import { Composition, registerRoot } from "raea";
import { Place, type Part } from "../parts/library";
import { TOP, OFFICE } from "../sets/office";

registerRoot(() => <Composition id="library-office" component={() => <Place place="office" parts={OFFICE} eye={[2.6, 2.0, 5.6]} look={[0.2, 1.05, -0.8]} />} width={1350} height={1080} fps={30} durationInFrames={31} />);
