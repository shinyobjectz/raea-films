// The observatory's components on the stand (parts/library.tsx). The room is turned on the stand so its slit faces
// the stand's sun, which stands in for the moon's light; the camera is inside, under the dome, and the room's own
// lamps (their glows traced as light by Solari) light the rest.
//   raea render library/observatory.tsx --composition library-observatory --at 0,30 -o out/library/observatory/
//   also: library-observatory-telescope (the telescope and pier alone, in daylight), library-observatory-moon (the moon, its phase)
import { Composition, registerRoot } from "raea";
import { Place, type Part, type V3 } from "../parts/library";

export const G = 0.03; // the boards' top above the stand's floor
export const TURN = Math.PI + 0.63; // the room's turn on the stand: its slit (the room's -z) toward the stand's sun
export const spin = ([x, y, z]: V3, a: number): V3 => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
export const turn = (p: V3) => spin(p, TURN);
/** a part where it stands in the room (x right, z toward the camera and north, the slit and the moon toward -z) */
export const at = (file: string, p: V3, o: Partial<Part> = {}): Part => ({ file, ...o, at: turn([p[0], p[1] + G, p[2]]), yaw: (o.yaw ?? 0) + TURN });
/** the turn that faces a thing at (x, z) to the room's middle */
export const facing = (x: number, z: number) => Math.atan2(-x, -z);
/** a point given in a thing's own frame, for a thing standing at p turned yaw */
export const on = (p: V3, yaw: number, local: V3): V3 => { const q = spin(local, yaw); return [p[0] + q[0], p[1] + q[1], p[2] + q[2]]; };
export const wallAt = (deg: number, y: number, r = 4.49): V3 => [r * Math.sin((deg * Math.PI) / 180), y, -r * Math.cos((deg * Math.PI) / 180)]; // degrees round from the slit, clockwise from above
export const MOON: V3 = [0, 2.74 + Math.sin(0.576) * 110, -Math.cos(0.576) * 110]; // 33 degrees up, due -z, 110 m off

export const TABLE: V3 = [3.0, 0, -2.2];
export const TY = facing(TABLE[0], TABLE[2]);
export const lamp = (deg: number): Part => { const p = wallAt(deg, 2.1); return at("wall-lamp", p, { yaw: facing(p[0], p[2]), name: `wall-lamp-${deg}` }); };
export const ROOM: Part[] = [
  at("floor", [0, 0, 0], { clip: "hatch" }),
  at("wall", [0, 0, 0], { clip: "door" }),
  at("dome", [0, 2.74, 0], { clip: "open" }),
  at("pier", [0, 0, 0]),
  at("telescope", [0, 1.55, 0], { clip: "slew" }),
  at("moon", MOON, { clip: "halo", scale: 2.2 }),
  at("stars", [0, 1.6, 0], { clip: "drift" }),
  at("ladder", [-3.05, 0, 1.75], { clip: "roll", yaw: 0.2 }),
  at("chart-table", TABLE, { yaw: TY, clip: "dial" }),
  at("desk-lamp", on([TABLE[0], 0.71, TABLE[2]], TY, [-0.4, 0, -0.31]), { yaw: TY + 0.5 }),
  at("stool", on(TABLE, TY, [0.1, 0, 0.75])),
  at("chart-cabinet", [3.55, 0, 0.9], { yaw: facing(3.55, 0.9), clip: "drawers" }),
  at("globe", [1.9, 0, 0.7], { clip: "spin" }),
  at("clock", [-4.0, 0, -1.0], { yaw: facing(-4.0, -1.0), clip: "hands" }),
  at("bookshelf", [-4.05, 0, 0.9], { yaw: facing(-4.05, 0.9) }),
  at("step-ladder", [-2.3, 0, -3.3], { yaw: facing(-2.3, -3.3) }),
  at("wall-chart", wallAt(25, 1.8, 4.455), { yaw: facing(...(wallAt(25, 0).filter((_, i) => i !== 1) as [number, number])), clip: "tilt" }),
  at("crank", wallAt(12, 1.05), { yaw: facing(...(wallAt(12, 0).filter((_, i) => i !== 1) as [number, number])), clip: "turn" }),
  lamp(-20), lamp(75), lamp(-150),
];
export const view = (id: string, eye: V3, look: V3, fov: number) => <Composition id={id} component={() => <Place place="observatory" parts={ROOM} wall={false} sun={2500} eye={turn(eye)} look={turn(look)} fov={fov} />} width={1350} height={1080} fps={30} durationInFrames={31} />;
export const SCOPE: Part[] = [{ file: "pier", at: [0, 0, 0] }, { file: "telescope", at: [0, 1.55, 0], clip: "slew" }];
export const FACE: Part[] = [{ file: "moon", at: [0, 2.2, 0], clip: "phase", scale: 2 }];
export const stand = (id: string, parts: Part[], eye: V3, look: V3, sun: number) => <Composition id={id} component={() => <Place place="observatory" parts={parts} wall={false} sun={sun} eye={eye} look={look} fov={40} />} width={1350} height={1080} fps={30} durationInFrames={31} />;

