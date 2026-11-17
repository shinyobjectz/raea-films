// Ties each brightness jump the proof lists (frame numbers on stdin) to what the game did on that frame: a fixture's
// light changing, the camera turning fast, or a scripted event; anything else is printed as unexplained.
import { F, LIGHT } from "./mixcore";
import { FIXTURES } from "../game/level";
const ks = (await Bun.stdin.text()).split(/\s+/).filter(Boolean).map(Number);
const DEG = 180 / Math.PI;
const counts: Record<string, number> = {};
for (const k of ks) {
  const a = F[k - 1], b = F[k];
  let dl = 0, which = "";
  FIXTURES.forEach((fx, i) => { const d = Math.abs(LIGHT[i][k] - LIGHT[i][k - 1]); const near = Math.hypot(fx.x - b.pos[0], fx.z - b.pos[2]) < 14; if (near && d > dl) { dl = d; which = `${fx.room}/${fx.kind}`; } });
  const turn = (Math.abs(b.yaw - a.yaw) + Math.abs(b.pitch - a.pitch)) * DEG;
  const ev = [-2, -1, 0, 1].flatMap((o) => F[k + o]?.ev ?? []).filter((e) => !/^step|^foot/.test(e));
  const why = dl > 0.15 ? `light ${which} ${dl.toFixed(2)}` : turn > 1.5 ? `turn ${turn.toFixed(1)} deg` : ev.length ? `event ${ev.slice(0, 3).join(",")}` : b.menu !== a.menu ? "menu->game" : "UNEXPLAINED";
  const kind = why.split(" ")[0]; counts[kind] = (counts[kind] ?? 0) + 1;
  if (kind !== "light") console.log(`${(k / 60).toFixed(2)} s f${k} ${b.room} sleep=${b.g.sleep?.toFixed?.(2)} ${why}`);
}
console.log(JSON.stringify(counts));
