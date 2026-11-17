// Every comment staged in frame, checked without a render: the point it's on, its card at full size while it's up
// (inside the title-safe frame), and the cursor's way in (from outside the frame or its edge). Exits 1 on any miss.
//   bun tools/aim.ts
import { camAt } from "../parts/cams";
import { COMMENTS, shotAt } from "../parts/plan";
import { SAFE, cardCorners, cardSide, cardUntil, cursorAt, project } from "../parts/aim";

const pct = (v: number) => `${Math.round(v * 100)}%`;
const inSafe = (q: { x: number; y: number; front: boolean }) => q.front && q.x >= SAFE.lo && q.x <= SAFE.hi && q.y >= SAFE.lo && q.y <= SAFE.hi;
let bad = 0;
for (const c of COMMENTS) {
  const clickCam = camAt(c.click);
  const { side, fits } = cardSide(c, clickCam);
  const pt = project(clickCam, c.at);
  const lines: string[] = [];
  if (shotAt(c.click).s.name !== c.shot) lines.push(`click ${c.click} is in ${shotAt(c.click).s.name}, not ${c.shot}`);
  if (!inSafe(pt)) lines.push(`the point is out of frame at the click (${pct(pt.x)}, ${pct(pt.y)})`);
  if (!fits) lines.push("no side of the point holds the whole card in frame");
  // while it's up, in its own shot (the camera may move under it)
  const until = cardUntil(c);
  for (let t = c.click + 0.2; t < until - 0.25; t += 0.1) {
    // a cut after the send takes the card with it (the change landing on the cut); before it, the card is lost
    if (shotAt(t).s.name !== c.shot) { if (shotAt(t).s.t < c.sent) lines.push(`its shot cuts at ${shotAt(t).s.t}, before the send`); break; }
    const cam = camAt(t);
    const out = cardCorners(c, cam, clickCam).map((p) => project(cam, p)).filter((q) => !inSafe(q));
    if (out.length) { lines.push(`its card leaves the frame at ${t.toFixed(2)} (${out.map((q) => `${pct(q.x)},${pct(q.y)}`).join(" ")})`); break; }
  }
  const enter = cursorAt(c, c.enter, camAt(c.enter))!;
  const e = project(camAt(c.enter), enter);
  const from = e.x > 0.85 || e.y < 0.1 ? "from the edge" : `from inside the frame (${pct(e.x)}, ${pct(e.y)})`;
  bad += lines.length;
  console.log(`${lines.length ? "FAIL" : "ok  "} comment ${c.n} (${c.shot}): on ${pct(pt.x)},${pct(pt.y)}; card ${side.s > 0 ? "right" : "left"} ${side.up ? "above" : "below"}; cursor in ${from}`);
  for (const l of lines) console.log(`       ${l}`);
}
process.exit(bad ? 1 : 0);
