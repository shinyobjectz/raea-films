// The closed fair's components on the stand (parts/library.tsx), put together as the place: the Ferris wheel on its
// platform behind the entrance arch, the ticket booth, two stalls, the high striker, poles with string lights and
// bunting, and what a fair leaves out overnight. Three views of the same parts: the whole fair, the midway at eye
// height, and the wheel alone square-on (the shot's own view of its circle). Frame 0 is rest (bulbs off, shutters
// down), frame 30 every rig at full travel (the wheel a whole turn round, every bulb lit).
//   raea render library/ferris.tsx --composition library-ferris --at 0,30 -o out/library/ferris/
//   ... --composition library-ferris-midway | library-ferris-wheel  -o out/library/ferris/NAME/
// Render frame 0 and frame 30 in separate processes for true light: a traced render holds its first frame's lights.
import { Composition, registerRoot } from "raea";
import { Place, type Part, type V3 } from "../parts/library";

export const rad = (d: number) => (d * Math.PI) / 180;
export const WZ = -6; // the wheel stands this far back
export const POLES: [number, number][] = [[-9, 3], [-1, 3], [7, 3], [-9, 10], [-1, 10], [7, 10]];
export const parts: Part[] = [
  { file: "ground", at: [0, 0.012, 0] },
  { file: "wheel", at: [0, 0, WZ], clip: "spin and light" },
  { file: "platform", at: [0, 0, WZ], clip: "gate" },
  { file: "controls", at: [3.9, 0, WZ + 3.1], yaw: rad(-25), clip: "lever" },
  { file: "gondola", at: [-8.2, 0, WZ + 5.2], yaw: rad(35), clip: "swing" },
  { file: "sign-arch", at: [0, 0, 13], clip: "bulbs" },
  { file: "ticket-booth", at: [-5.6, 0, 10.4], yaw: rad(20), clip: "shutter" },
  { file: "ticket-booth", at: [5.4, 0, 8.6], yaw: rad(-30), clip: "bulbs" },
  { file: "stall", at: [-11.2, 0, 4.2], yaw: rad(62), clip: "flap" },
  { file: "stall", at: [10.6, 0, 3.0], yaw: rad(-68) },
  { file: "high-striker", at: [7.2, 0, 5.6], yaw: rad(-40), clip: "strike" },
  { file: "prize-bear", at: [-9.9, 0, 5.0], yaw: rad(70), scale: 2.4, clip: "wave" },
  { file: "prize-bear", at: [-9.5, 0, 5.9], yaw: rad(40), clip: "slump" },
  { file: "prize-bear", at: [-9.3, 0, 4.4], yaw: rad(95), scale: 1.3, clip: "nod" },
  { file: "balloons", at: [-4.1, 0, 9.4], clip: "sway" },
  { file: "litter", at: [1.2, 0.012, 8.2], clip: "blow" },
  { file: "litter", at: [-6.5, 0.012, 5.6], yaw: rad(140) },
  { file: "barrier", at: [-2.6, 0, 1.6], yaw: rad(8), clip: "plate" },
  { file: "barrier", at: [-0.2, 0, 1.7], yaw: rad(-4) },
  { file: "barrier", at: [2.2, 0, 1.55], yaw: rad(5) },
  { file: "bench", at: [3.4, 0, 9.6], yaw: rad(200) },
  { file: "trash-can", at: [4.6, 0, 9.9], clip: "lid" },
  { file: "chair", at: [9.2, 0, 4.6], yaw: rad(-110) },
  { file: "snack-cart", at: [-2.2, 0, 6.0], yaw: rad(15) },
  { file: "generator", at: [8.6, 0, -1.2], yaw: rad(90) },
  { file: "cables", at: [8.2, 0.012, -1.2], yaw: rad(178) },
  ...POLES.map(([x, z]): Part => ({ file: "pole", at: [x, 0, z], clip: x === 7 && z === 3 ? "horn" : undefined })),
  { file: "string-lights", at: [-5, 3.48, 3], clip: "on" },
  { file: "string-lights", at: [3, 3.48, 3], clip: "sway" },
  { file: "bunting", at: [-5, 3.44, 10], clip: "flutter" },
  { file: "bunting", at: [3, 3.44, 10] },
  { file: "bunting", at: [-9, 3.44, 6.5], yaw: rad(90), scale: 0.875 },
  { file: "string-lights", at: [7, 3.48, 6.5], yaw: rad(90), scale: 0.875, clip: "on" },
];

export const view = (id: string, eye: V3, look: V3, fov: number) => <Composition id={id} component={() => <Place place="ferris" parts={parts} eye={eye} look={look} fov={fov} wall={false} sun={2600} />} width={1350} height={1080} fps={30} durationInFrames={31} />;
