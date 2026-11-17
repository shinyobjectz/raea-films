// Review stills of the photoreal set: named views at named frames of the film's clock. Not the film.
import { AbsoluteFill, Composition, registerRoot } from "raea";
import { Page } from "../components/page";
import { Shot, worldAt } from "../components/shot";
import { robotAt2 } from "../components/take";
import { KB, MON, type V3 } from "../components/timeline";
const RB = robotAt2(300), RK = robotAt2(150), RA = robotAt2(1000);

const HERO = { pos: [-3.4, 0.55, 9.6] as V3, look: [0.9, 2.3, 0] as V3, fov: 38 };
const VIEWS: Record<string, { frame: number; pos: V3; look: V3; fov: number; debug?: string; focus?: number; stop?: number }> = {
  "hero-dead": { frame: 60, ...HERO },
  "hero-lit": { frame: 230, ...HERO },
  "hero-sun": { frame: 800, ...HERO },
  "hero-water": { frame: 868, ...HERO },
  "hero-alive": { frame: 1000, ...HERO },
  "hero-mist": { frame: 1245, ...HERO },
  "hero-dusk": { frame: 1450, ...HERO },
  "ivy-dead": { frame: 300, pos: [-3.9, 2.0, 3.2], look: [-1.7, 1.9, 0], fov: 40 },
  "ivy-alive": { frame: 1000, pos: [-3.9, 2.0, 3.2], look: [-1.7, 1.9, 0], fov: 40 },
  "ivy-close": { frame: 1000, pos: [-2.9, 1.9, 1.7], look: [-2.05, 1.9, 0.1], fov: 40 },
  "monitor": { frame: 1000, pos: [1.6, 1.6, 4.6], look: [0.6, MON[1] + 0.3, 0], fov: 40 },
  "keyboard": { frame: 230, pos: [KB[0] - 0.5, 0.95, KB[2] + 1.25], look: [KB[0] + 0.05, 0.22, KB[2]], fov: 40 },
  "keyboard-alive": { frame: 1000, pos: [KB[0] - 0.5, 0.95, KB[2] + 1.25], look: [KB[0] + 0.05, 0.22, KB[2]], fov: 40 },
  "robot": { frame: 240, pos: [0.25, 1.2, 1.9], look: [-0.15, 1.2, 0.5], fov: 30 },
  "robot-front": { frame: 300, pos: [RB[0] + 0.12, RB[1] - 0.2, RB[2] + 0.75], look: [RB[0] + 0.12, RB[1] - 0.2, RB[2]], fov: 40 },
  "robot-34": { frame: 300, pos: [RB[0] + 0.7, RB[1] + 0.05, RB[2] + 0.55], look: [RB[0] + 0.1, RB[1] - 0.2, RB[2]], fov: 40 },
  "robot-key": { frame: 150, pos: [RK[0] - 0.45, RK[1] + 0.3, RK[2] + 0.75], look: [RK[0] + 0.05, RK[1] + 0.15, RK[2]], fov: 40 },
  "robot-alive": { frame: 1000, pos: [RA[0] + 0.5, RA[1] - 0.05, RA[2] + 0.7], look: [RA[0] + 0.1, RA[1] - 0.2, RA[2]], fov: 40 },
  "plate-dead": { frame: 100, pos: [-2.6, 1.6, 8.8], look: [0.3, 1.4, 0], fov: 44, debug: "plate" },
  "plate-sun": { frame: 800, pos: [-2.6, 1.6, 8.8], look: [0.3, 1.4, 0], fov: 44, debug: "plate" },
  "plate-water": { frame: 868, pos: [-2.6, 1.6, 8.8], look: [0.3, 1.4, 0], fov: 44, debug: "plate" },
  "plate-alive": { frame: 1000, pos: [-2.6, 1.6, 8.8], look: [0.3, 1.4, 0], fov: 44, debug: "plate" },
  "plate-mist": { frame: 1245, pos: [-2.6, 1.6, 8.8], look: [0.3, 1.4, 0], fov: 44, debug: "plate" },
  "plate-dusk": { frame: 1450, pos: [-2.6, 1.6, 8.8], look: [0.3, 1.4, 0], fov: 44, debug: "plate" },
  "top": { frame: 1000, pos: [0, 22, 6], look: [0, 0, 2], fov: 50, debug: "nofog" },
};
const v = (name: string) => () => {
  const s = VIEWS[name];
  return <Shot frame={s.frame} debug={s.debug} still={{ pos: s.pos, look: s.look, fov: (s.fov * Math.PI) / 180, focus: s.focus, stop: s.stop }} page={s.debug === "plate" ? <AbsoluteFill style={{ background: "#0b0d0d" }} /> : <Page w={worldAt(s.frame)} />} />;
};
registerRoot(() => <>{Object.keys(VIEWS).map((n) => <Composition key={n} id={n} component={v(n)} width={1280} height={720} fps={30} durationInFrames={30} />)}</>);
