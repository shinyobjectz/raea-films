// What the monitor's glass shows: the real app, state by state as it was captured (assets/app-take), with the film's
// own picture of the swamp in the places the take's item media was flat magenta. Comparing two versions, the picture
// left of the wipe's divider is v1 (no mist) and right of it v2 (the note answered: mist over the water).
import { AbsoluteFill, Img, interpolate } from "raea";
import alive from "../assets/plates/alive.png";
import dead from "../assets/plates/dead.png";
import dusk from "../assets/plates/dusk.png";
import mist from "../assets/plates/mist.png";
import sun from "../assets/plates/sun.png";
import water from "../assets/plates/water.png";
import { STATES } from "./app-states";
import type { World } from "./set";
import { stateAt } from "./take";
import { END, PH, PW, T, clamp } from "./timeline";

type Box = [number, number, number, number];

/** the swamp as the app's item shows it: the same world the monitor stands in, at the film's values; `m` the mist */
function Plate({ w, m, box, clip, zoom }: { w: World; m: number; box: Box; /** the part of the box shown, in page x */ clip?: [number, number]; zoom: number }) {
  const [x, y, bw, bh] = box;
  const layer = (src: string, opacity: number) => (opacity <= 0 ? null : <Img src={src} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover", opacity, transform: `scale(${zoom})` }} />);
  const [c0, c1] = clip ?? [x - 1, x + bw + 1];
  return (
    <div style={{ position: "absolute", left: c0, top: y - 1, width: Math.max(0, c1 - c0), height: bh + 2, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: x - 1 - c0, top: 0, width: bw + 2, height: bh + 2, background: "#0b0d0d" }}>
        {layer(dead, 1)}
        {layer(sun, w.sun)}
        {layer(water, w.water)}
        {layer(alive, w.grow)}
        {layer(mist, m)}
        {layer(dusk, w.dusk)}
      </div>
    </div>
  );
}

/** the new version's own views: its item open, its card in the feed */
const isV2 = (name: string) => name >= "239b" && name < "270";

export function Page({ w }: { w: World }) {
  const f = w.f;
  const name = stateAt(f);
  if (!name) return <AbsoluteFill style={{ background: "#020303" }} />;
  const s = STATES[name] ?? STATES["230-item-open"];
  // the glass comes up over a few frames as it wakes
  const up = interpolate(f, [T.wake, T.wake + 10], [0, 1], clamp);
  // once the item plays, its picture moves: a slow push
  const zoom = 1 + 0.07 * interpolate(f, [T.scrubTo + 18, END], [0, 1], clamp);
  const m = isV2(name) ? 1 : (w.mist ?? 0);
  // the biggest box is the picture; comparing, it splits at the divider
  const main = s.media.reduce((a, b, i) => (b[2] * b[3] > s.media[a][2] * s.media[a][3] ? i : a), 0);
  return (
    <AbsoluteFill style={{ background: "#020303" }}>
      <AbsoluteFill style={{ opacity: up, background: "#24413c" }}>
        {s.media.map((box, i) =>
          i === main && s.wipe !== undefined ? (
            <div key={i}>
              <Plate w={w} m={0} box={box} clip={[box[0] - 1, s.wipe]} zoom={zoom} />
              <Plate w={w} m={1} box={box} clip={[s.wipe, box[0] + box[2] + 1]} zoom={zoom} />
            </div>
          ) : (
            <Plate key={i} w={w} m={m} box={box} zoom={zoom} />
          ),
        )}
        <Img src={s.src} style={{ position: "absolute", left: 0, top: 0, width: PW, height: PH }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
