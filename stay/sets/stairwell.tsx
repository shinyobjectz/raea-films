// The stairwell's components on the stand (parts/library.tsx), put together as the place: four storeys of the round
// stair under its skylight. Four views of the same parts: down the well from under the skylight (the shot's own
// view), up from the ground floor to the skylight, the ground floor's wall, and a landing from across the well.
// Frame 0 is rest (the lamps off, lit by the skylight's moonlit glass alone), frame 30 every rig at full travel.
// Render frame 0 and frame 30 in separate processes for true light: a traced render holds its first frame's lights,
// so in one --at 0,30 run the lamps that come on by frame 30 light the well only dimly.
//   raea render library/stairwell.tsx --composition library-stairwell --at 0,30 -o out/library/stairwell/
//   ... --composition library-stairwell-up | library-stairwell-ground | library-stairwell-landing  -o out/library/stairwell/NAME/
import { Composition, registerRoot } from "raea";
import { Place, type Part, type V3 } from "../parts/library";

export const H = 3.23; // a storey
export const RW = 2.4; // the wall's radius
export const STOREYS = 4;
export const TOP = STOREYS * H;
export const rad = (d: number) => (d * Math.PI) / 180;
/** on the floor r metres out from the well's axis at an angle (degrees, anticlockwise from +x seen from above), h up */
export const at = (deg: number, r: number, h: number): V3 => [r * Math.cos(rad(deg)), h, -r * Math.sin(rad(deg))];
/** a wall item on the round wall at an angle, h up, facing the well */
export const wall = (file: string, deg: number, h: number, clip?: string): Part => ({ file, at: at(deg, RW, h), yaw: rad(deg - 90), clip });

export const parts: Part[] = [
  { file: "floor", at: [0, 0, 0] },
  wall("mailboxes", 198, 1.3, "open"),
  wall("notice-board", 166, 1.5, "flutter"),
  wall("radiator", 224, 0, "valve"),
  { file: "plant", at: at(140, 1.95, 0), clip: "sway" },
  // 7 cm clear of the tread beside them (the render's clip note, 11-11)
  { file: "boots", at: ((p: [number, number, number]): [number, number, number] => [p[0] - 0.071, p[1], p[2]])(at(-69, 1.8, 0)), yaw: rad(160) },
  { file: "skylight", at: [0, TOP + H - 0.215, 0], clip: "vent" },
  { file: "guard", at: [0, TOP, 0] },
  { file: "paper-plane", at: [0, TOP - 0.6, 0], clip: "spiral" },
];
for (let k = 0; k <= STOREYS; k++) {
  const y = k * H;
  parts.push({ file: "wall", at: [0, y, 0] });
  if (k > 0) parts.push({ file: "landing", at: [0, y, 0] });
  parts.push({ ...wall("door", -90, y, k === 2 ? "open" : k === 4 ? "handle" : undefined) }, { file: "doormat", at: at(-90, 1.95, y) });
  parts.push(wall("riser", -64.5, y, k === 4 ? "valve" : undefined), { file: "extinguisher", at: at(-113, 2.22, y), yaw: rad(30) }, wall("stair-sign", -112.5, y + 1.65));
  parts.push(wall("wall-light", 0, y + 2.9, "on"), wall("wall-light", 180, y + 4.75 - (k === STOREYS ? 2.6 : 0), "on"));
  if (k === STOREYS) continue;
  parts.push({ file: "stairs", at: [0, y, 0] }, { file: "rail", at: [0, y, 0] }, { file: "wall-rail", at: [0, y, 0] });
  parts.push({ file: "exit-sign", at: at(-90, 1.85, y + H - 0.215) });
}
parts.push({ file: "plant", at: at(-115.5, 1.75, H), clip: "sway", scale: 0.8 }, { file: "boots", at: at(-71, 1.8, 2 * H + 0.005), yaw: rad(150) });

export const view = (id: string, eye: V3, look: V3, fov: number) => <Composition id={id} component={() => <Place place="stairwell" parts={parts} eye={eye} look={look} fov={fov} wall={false} />} width={1350} height={1080} fps={30} durationInFrames={31} />;
