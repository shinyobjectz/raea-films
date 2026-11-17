// The hype film, photoreal: one composition a shot (each renders in its own process, as ray-traced light asks), named
// by the shot's id. scripts/render_film_v3.sh renders and joins them. v3: the swamp, then up the beam to the ship in
// orbit, the review room, and back out to space for the end.
import { AbsoluteFill, Composition, Img, interpolate, registerRoot, useCurrentFrame, useVideoConfig } from "raea";
import mark from "../assets/brand/raea-mark-paper.png";
import { CUT } from "../components/cut";
import { OrbitShot, isOrbit } from "../components/orbit";
import { Page } from "../components/page";
import { RoomShot, isRoom } from "../components/room";
import { Shot, worldAt } from "../components/shot";
import type { Shot2 } from "../components/take";
import { T, clamp } from "../components/timeline";

function Frame({ s }: { s: Shot2 }) {
  const f = useCurrentFrame() + s.from;
  // v4: the logomark full size over the stars, centred, as the tilt settles: in over a second, a breath larger as it
  // comes, and it stays (the brand's own picture, drawn 1:1 at 1080: its pixels stay square)
  const m = interpolate(f, [T.mark, T.mark + 30], [0, 1], clamp);
  const { width } = useVideoConfig();
  const z = width / 1920;
  const size = 480 * z * (0.97 + 0.03 * m);
  // up the beam into the cloud: white over the rise's last frames, the orbit opening out of it
  const white = interpolate(f, [T.orbit - 30, T.orbit - 8], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      {isOrbit(s.id) ? <OrbitShot f={f} s={s} /> : isRoom(s.id) ? <RoomShot f={f} s={s} /> : <Shot frame={f} page={<Page w={worldAt(f)} />} />}
      {white > 0 && f < T.orbit && <AbsoluteFill style={{ background: "#f4fbff", opacity: white }} />}
      {m > 0 && (
        <AbsoluteFill>
          <Img src={mark} style={{ position: "absolute", left: (1920 * z - size) / 2, top: (1080 * z - size) / 2, width: size, height: size, opacity: m }} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
const W = 1920, H = 1080;
registerRoot(() => (
  <>
    {CUT.map((s) => (
      <Composition key={s.id} id={`s${s.id}`} component={() => <Frame s={s} />} width={W} height={H} fps={30} durationInFrames={s.to - s.from} />
    ))}
    {CUT.map((s) => (
      <Composition key={`p-${s.id}`} id={`p${s.id}`} component={() => <Frame s={s} />} width={960} height={540} fps={30} durationInFrames={s.to - s.from} />
    ))}
  </>
));
