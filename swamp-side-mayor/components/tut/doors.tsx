// The tutorial's three doors (tutorial.script.ts 02, 09, 10): the rail's foot in the app is three doors (Publish,
// Connections and Settings over the account; libraries are under Search at the rail's top), so the swamp has three, stone doorways in the ruins' own hand (blender/doors_build.py, assets/glb/ruin-door-K.glb), each with
// its name painted on the lintel in the music video's dry brush (tools/paint.py, assets/tut-ink/door-NAME-K.png).
// They stand in a row on the near-left grass, the swamp's own bottom-left as the rail's foot is the app's, each turned
// to the keyboard Goose walks from, clear of every ruin and of the stone ring's line of sight (the tutorial's world
// grows no bush there, components/tut/world.tsx). Read from the keyboard they go Publish, Connections, Settings,
// left to right, as the rail has them top to bottom.
import { Img, staticFile } from "raea";
import { Model, Screen } from "raea/3d";
import { height } from "../../compositions/set";

export type V3 = [number, number, number];
export const DOOR_NAMES = ["publish", "connections", "settings"] as const;
export type DoorName = (typeof DOOR_NAMES)[number];
const ROW = { c: [-12, 5] as [number, number], gap: 3.3 };
/** what the doors face: the keyboard (components/tut/machine.tsx TKB) */
export const DOORS_FACE: [number, number] = [0, 0.4];
// the row runs across the line from the keyboard to its middle, so each door is side on to its neighbours
export const TOWARD = (() => { const dx = DOORS_FACE[0] - ROW.c[0], dz = DOORS_FACE[1] - ROW.c[1], l = Math.hypot(dx, dz); return [dx / l, dz / l] as [number, number]; })();
const left: [number, number] = [-TOWARD[1], TOWARD[0]];   // the left, looking at the row from the keyboard
const face = (x: number, z: number) => Math.atan2(DOORS_FACE[0] - x, DOORS_FACE[1] - z);
/** the lintel's painted face, in the door's own frame: centre height and how far forward of the door's middle */
const WORD = { y: 2.375, z: 0.3, mPerPx: 2.45 / 1833 };   // CONNECTIONS, the longest, 2.45 m across a 2.75 m lintel
const WORD_PX: Record<DoorName, [number, number]> = { connections: [1833, 195], publish: [1089, 189], settings: [1254, 198] };

export const DOORS = DOOR_NAMES.map((name, i) => {
  const k = (DOOR_NAMES.length - 1) / 2 - i, x = ROW.c[0] + left[0] * k * ROW.gap, z = ROW.c[1] + left[1] * k * ROW.gap, yaw = face(x, z);
  const y = height(x, z) - 0.1;
  return { name, k: i, at: [x, y, z] as V3, yaw,
    /** the middle of the opening, for Goose to walk through: a point a step in front of it and one a step behind */
    front: [x + Math.sin(yaw) * 1.2, y, z + Math.cos(yaw) * 1.2] as V3, back: [x - Math.sin(yaw) * 1.2, y, z - Math.cos(yaw) * 1.2] as V3,
    word: [x + Math.sin(yaw) * WORD.z, y + WORD.y, z + Math.cos(yaw) * WORD.z] as V3 };
});
export const door = (name: DoorName) => DOORS.find((d) => d.name === name)!;
/** the ground the doors need clear of bushes: the row, a few metres behind it, and the whole approach from the keyboard */
export const doorsClear = (x: number, z: number) => {
  const dx = x - ROW.c[0], dz = z - ROW.c[1], along = dx * TOWARD[0] + dz * TOWARD[1], across = dx * left[0] + dz * left[1];
  return along > -3.5 && along < Math.hypot(DOORS_FACE[0] - ROW.c[0], DOORS_FACE[1] - ROW.c[1]) && Math.abs(across) < 2 * ROW.gap + 2.5;
};

/** frame: the film's frame, for the lettering's boil (a new take every 4 frames, as the music video's ink) */
export function Doors({ frame }: { frame: number }) {
  const take = Math.floor(frame / 4) % 3;
  return (
    <>
      {DOORS.map((d) => (
        <Model key={d.name} name={`door-${d.name}`} pass="hero" flat src={staticFile(`glb/ruin-door-${d.k}.glb`)} position={d.at} rotation={[0, d.yaw, 0]} scale={1} />
      ))}
      {/* each name on a transparent Screen holding an Img: an Img waits for its picture every frame, in a video too,
          where an ImagePlane's texture isn't awaited and the boiling takes never showed (the v6 cut's doors were bare) */}
      {DOORS.map((d) => { const [w, h] = WORD_PX[d.name]; return (
        <Screen key={`word-${d.name}`} name={`word-${d.name}`} crt={false} background="transparent" resolution={[w, h]} size={[w * WORD.mPerPx, h * WORD.mPerPx]} position={d.word} rotation={[0, d.yaw, 0]} pass="ui">
          <Img src={staticFile(`tut-ink/door-${d.name}-${take}.png`)} style={{ width: w, height: h }} />
        </Screen>
      ); })}
    </>
  );
}
