// tools/tut_runs.ts: the tutorial's render runs (components/tut/shots.ts filmRuns), one a line: id kind start frames beat
//   bun --preload ./tools/stub/raea.ts tools/tut_runs.ts
import { filmRuns } from "../components/tut/shots";
for (const r of filmRuns()) console.log(r.id, r.kind, r.start, r.frames, r.beat);
