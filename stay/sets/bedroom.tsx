// The bedroom's components on the stand (parts/library.tsx): the room's own floor, its window wall and its side wall,
// and everything in its place. No ceiling stands here (the stand's sun has to reach the room), so the model planes
// hang at ceiling height in the air.
//   raea render library/bedroom.tsx --composition library-bedroom --at 0,30 -o out/library/bedroom/
// The stand runs one clip a part, so library-bedroom-rigs runs each part's second clip (the blinds' slats, the
// window's sash, the fish, ...), and the close views (-desk, -desk-rigs, -bed, -window, -shelf, -floor, -planes)
// look at the small things, -ceiling stands the ceiling on and -walls and -walls-in the other two walls (they shade the stand's sun, so only there):  --composition library-bedroom-desk -o out/library/bedroom/desk/
import { Composition, registerRoot } from "raea";
import { Place, type Part } from "../parts/library";

export const F = 0.02; // the floor component's top
export const BACK = -1.8, RIGHT = 2.1; // the window wall's face (z) and the side wall's face (x)
export const SIDE = -Math.PI / 2; // a thing against the side wall faces -x
export const WIN: [number, number] = [-0.6, F + 1.6]; // the window's centre on the back wall
export const BED: [number, number, number] = [-0.52, F, BACK + 0.56];
export const DESK_Z = -0.6, DESK_X = RIGHT - 0.345, TOP = F + 0.75; // the desk on the side wall; its local +x runs toward the camera
export const d = (along: number, out: number, up = 0): [number, number, number] => [DESK_X - out, TOP + up, DESK_Z + along]; // a spot on the desk: along it, out from its middle toward the room
export const CASE = F + 0.8; // the bookcase's top
export const SHELF = F + 1.62;
export const BEDROOM: Part[] = [
  { file: "floor", at: [0, F, 0] },
  { file: "wall-window", at: [0, F, BACK] },
  { file: "wall-side", at: [RIGHT, F, 0], yaw: SIDE },
  { file: "door", at: [RIGHT, F, 0.85], yaw: SIDE, clip: "open" },
  { file: "sun", at: [WIN[0], WIN[1], BACK], clip: "arc" },
  { file: "blinds", at: [WIN[0], F + 2.31, BACK], clip: "raise" },
  { file: "rain", at: [WIN[0], WIN[1], BACK - 0.048], clip: "fall" },
  { file: "bed", at: BED, yaw: Math.PI / 2 },
  { file: "sheet", at: BED, yaw: Math.PI / 2, clip: "settle" },
  { file: "nightstand", at: [-1.83, F, BACK + 0.3], clip: "drawer" },
  { file: "alarm-clock", at: [-1.8, F + 0.616, BACK + 0.2], yaw: 0.25, clip: "hands" },
  { file: "boombox", at: [-1.55, F, BACK + 1.45], yaw: 0.5 },
  { file: "pennant", at: [0.47, F + 1.95, BACK] },
  { file: "bookcase", at: [1.33, F, BACK + 0.19], clip: "tape" },
  { file: "fish-tank", at: [1.1, CASE, BACK + 0.2], clip: "bubbles" },
  { file: "shelves", at: [1.4, SHELF, BACK], clip: "robot" },
  { file: "desk", at: [DESK_X, F, DESK_Z], yaw: SIDE, clip: "drawer" },
  { file: "chair", at: [1.05, F, DESK_Z - 0.15], yaw: Math.PI / 2 + 0.5 },
  { file: "crt", at: d(-0.02, -0.06), yaw: SIDE },
  { file: "console", at: d(-0.46, -0.145), yaw: SIDE, clip: "pad" },
  { file: "games", at: d(0.34, -0.2), yaw: SIDE, clip: "slide" },
  { file: "lamp", at: d(-0.665, 0.24), yaw: 0.25, clip: "nod" },
  { file: "globe", at: d(0.5, 0.13), yaw: SIDE, clip: "spin" },
  { file: "wall-clock", at: [RIGHT, F + 2.0, -1.45], yaw: SIDE, clip: "hands" },
  { file: "posters", at: [RIGHT, F + 1.72, -0.42], yaw: SIDE, clip: "flutter" },
  { file: "dartboard", at: [RIGHT, F + 1.6, 1.55], yaw: SIDE, clip: "spin" },
  { file: "model-planes", at: [0.1, F + 2.5, 0.1], clip: "sway" },
  { file: "rug", at: [0.0, F, 0.45] },
  { file: "toys", at: [0.05, F + 0.012, 0.45], clip: "car" },
  { file: "toy-box", at: [-1.5, F, 0.9], yaw: 0.4, clip: "bat" },
];

// Each part's other clips, for the second and third stands.
export const OTHER: Record<string, string> = { "wall-window": "sash", door: "knob", blinds: "slats", "alarm-clock": "seconds", bookcase: "lid", "fish-tank": "swim", shelves: "cube", desk: "drawers", crt: "aerial", lamp: "switch", "wall-clock": "seconds", "model-planes": "turn", toys: "ball" };
export const RIGS: Part[] = BEDROOM.filter((p) => p.file !== "rain").map((p) => (OTHER[p.file] ? { ...p, clip: OTHER[p.file] } : p));
export const THIRD: Record<string, string> = { "fish-tank": "flap", shelves: "key", "model-planes": "props", toys: "blocks", crt: "power" };
export const RIGS3: Part[] = BEDROOM.map((p) => (THIRD[p.file] ? { ...p, clip: THIRD[p.file] } : p));

// The ceiling stands only in its own view: on the stand it would shade the room from the stand's sun.
export const CEILED: Part[] = [...BEDROOM, { file: "ceiling", at: [0, F + 2.5, 0] }];
// The other two walls stand only in -walls, seen from above: one is between the stand's sun and the room, the stand's camera looks through the other.
export const WALLED: Part[] = [...BEDROOM, { file: "wall-left", at: [-RIGHT, F, 0], yaw: Math.PI / 2 }, { file: "wall-front", at: [0, F, -BACK], yaw: Math.PI, clip: "wardrobe" }];

type V = [number, number, number];
export const view = (id: string, parts: Part[], eye: V, look: V, fov = 42) => <Composition key={id} id={id} component={() => <Place place="bedroom" parts={parts} wall={false} eye={eye} look={look} fov={fov} />} width={1350} height={1080} fps={30} durationInFrames={31} />;
