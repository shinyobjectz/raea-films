// Review stills of the set: named views at named frames of the film's clock. Not the film.
import { AbsoluteFill, Composition, registerRoot } from "raea";
import { Film } from "../components/film";
import { KB, MON, type V3 } from "../components/timeline";

const VIEWS: Record<string, { frame: number; pos: V3; look: V3; fov: number; debug?: string; focus?: number; stop?: number }> = {
  "hero-alive": { frame: 1100, pos: [-3.4, 0.55, 9.6], look: [0.9, 2.3, 0], fov: 38 },
  "ha": { frame: 1100, pos: [-3.4, 0.55, 9.6], look: [0.9, 2.3, 0], fov: 38, debug: "nostroke" },
  "hb": { frame: 1100, pos: [-3.4, 0.55, 9.6], look: [0.9, 2.3, 0], fov: 38, debug: "nodapple" },
  "hero-dead": { frame: 60, pos: [-3.4, 0.55, 9.6], look: [0.9, 2.3, 0], fov: 38, focus: 9.5, stop: 4 },
  "hero-dusk": { frame: 1400, pos: [-3.4, 0.55, 9.6], look: [0.9, 2.3, 0], fov: 38, focus: 9.5, stop: 4 },
  "hero-sun": { frame: 830, pos: [-3.4, 0.55, 9.6], look: [0.9, 2.3, 0], fov: 38, focus: 9.5, stop: 4 },
  "dbg-nofog": { frame: 1100, pos: [-2.9, 0.9, 8.4], look: [0.3, 1.3, 0], fov: 48, debug: "" },
  "dbg-c": { frame: 1100, pos: [-2.9, 0.9, 8.4], look: [0.3, 1.3, 0], fov: 48, debug: "nofog" },
  "dbg-d": { frame: 1100, pos: [-2.9, 0.9, 8.4], look: [0.3, 1.3, 0], fov: 48, debug: "sunnear" },
  "dbg-nolook": { frame: 1100, pos: [-2.9, 0.9, 8.4], look: [0.3, 1.3, 0], fov: 48, debug: "sky nofog" },
  "wide-dead": { frame: 60, pos: [-2.9, 0.9, 8.4], look: [0.3, 1.3, 0], fov: 48 },
  "wide-lit": { frame: 230, pos: [-2.9, 0.9, 8.4], look: [0.3, 1.3, 0], fov: 48 },
  "wide-sun": { frame: 830, pos: [-2.9, 0.9, 8.4], look: [0.3, 1.3, 0], fov: 48 },
  "wide-alive": { frame: 1100, pos: [-2.9, 0.9, 8.4], look: [0.3, 1.3, 0], fov: 48 },
  "wide-dusk": { frame: 1400, pos: [-2.9, 0.9, 8.4], look: [0.3, 1.3, 0], fov: 48 },
  "monitor": { frame: 1100, pos: [1.6, 1.6, 4.6], look: [0.6, MON[1] + 0.3, 0], fov: 40 },
  "keyboard": { frame: 230, pos: [KB[0] - 0.5, 0.95, KB[2] + 1.25], look: [KB[0] + 0.05, 0.22, KB[2]], fov: 40 },
  "keyboard-alive": { frame: 1100, pos: [KB[0] - 0.5, 0.95, KB[2] + 1.25], look: [KB[0] + 0.05, 0.22, KB[2]], fov: 40 },
  "robot": { frame: 240, pos: [0.25, 1.2, 1.9], look: [-0.15, 1.2, 0.5], fov: 30 },
};
const v = (name: string) => () => {
  const s = VIEWS[name];
  return <Film frame={s.frame} debug={s.debug} still={{ pos: s.pos, look: s.look, fov: (s.fov * Math.PI) / 180, focus: s.focus, stop: s.stop }} page={<AbsoluteFill style={{ background: "#eef0f2" }} />} />;
};
registerRoot(() => <>{Object.keys(VIEWS).map((n) => <Composition key={n} id={n} component={v(n)} width={1280} height={720} fps={30} durationInFrames={30} />)}</>);
