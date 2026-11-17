// The outdoor court's components on the stand (parts/library.tsx): night, so the stand's sun is down to moonlight
// and the floodlight's own lens lights the court (Solari traces a glow as light).
//   raea render library/court.tsx --composition library-court --at 0,30 -o out/library/court/
//   raea render library/court.tsx --composition library-court-hoop --at 0,30 -o out/library/court/hoop/
//   also: library-court-gate (the gate, bin, bench and bag), library-court-fence (the sign, tyre and weeds)
import { Composition, registerRoot } from "raea";
import { Place, type Part, type V3 } from "../parts/library";

export const G = 0.02; // the slab's top above the stand's floor
export const BASE = -7; // the baseline's z
export const RIM: V3 = [0, G + 3.05, BASE - 0.9 + 2.479]; // the rim's centre
export const BACK = BASE - 2.6; // the back fence
export const LAMP: V3 = [-8.2, G, -1.5]; // the floodlight's foot
export const AIM = 2.02; // its turn, toward the hoop
export const COURT: Part[] = [
  { file: "court", at: [0, G, BASE] },
  { file: "puddles", at: [0, G, BASE], clip: "ripple" },
  { file: "hoop", at: [0, G, BASE - 0.9], clip: "net" },
  { file: "basketball", at: [RIM[0], RIM[1] + 0.3, RIM[2]], clip: "drop" },
  { file: "basketball", at: [-1.9, G, -1.4], clip: "spin", name: "basketball-2" },
  { file: "floodlight", at: LAMP, yaw: AIM },
  { file: "light-cone", at: [LAMP[0] + 0.55 * Math.sin(AIM), G + 7.53, LAMP[2] + 0.55 * Math.cos(AIM)], yaw: AIM },
  { file: "rain", at: [0, G, -2.5], clip: "fall" },
  { file: "wall", at: [0, 0, BACK - 1.5], clip: "door" },
  { file: "street-lamp", at: [-3.2, 0, BACK - 0.8] },
  { file: "fence", at: [-4.95, G, BACK] },
  { file: "fence", at: [2.55, G, BACK], name: "fence-2" },
  { file: "fence-gate", at: [7.5, G, BACK], clip: "swing" },
  { file: "fence", at: [-8.7, G, BACK + 3.75], yaw: Math.PI / 2, name: "fence-3" },
  { file: "fence", at: [-8.7, G, BACK + 11.25], yaw: Math.PI / 2, name: "fence-4" },
  { file: "fence", at: [8.7, G, BACK + 3.75], yaw: Math.PI / 2, name: "fence-5" },
  { file: "sign", at: [-3.4, G + 2.05, BACK + 0.05], clip: "swing" },
  { file: "bench", at: [7.9, G, -4.6], yaw: -Math.PI / 2 },
  { file: "gym-bag", at: [7.3, G, -2.9], yaw: 0.5 },
  { file: "trash-can", at: [5.4, G, BACK + 0.7], yaw: 0.4, clip: "lid" },
  { file: "tyre", at: [-6.6, G, BACK + 0.5], yaw: 0.3, clip: "roll" },
  { file: "weeds", at: [-1.5, G, BACK + 0.12], clip: "sway" },
  { file: "weeds", at: [3.6, G, BACK + 0.1], yaw: Math.PI, clip: "sway", name: "weeds-2" },
  { file: "weeds", at: [-8.5, G, -5.6], yaw: Math.PI / 2, clip: "sway", name: "weeds-3" },
];
export const view = (id: string, eye: V3, look: V3, fov: number) => <Composition id={id} component={() => <Place place="court" parts={COURT} wall={false} sun={150} eye={eye} look={look} fov={fov} />} width={1350} height={1080} fps={30} durationInFrames={31} />;

