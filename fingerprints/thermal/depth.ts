// Each traced stock shot's DA3 depth (tools/depth-all.sh -> media/thermal/depth/NAME): the clip second its layers
// start at, how many there are, and the shot's inverse-depth range. layersFor() hands a shot only the layers it shows,
// so a pass holds a few seconds of depth, never the whole take.
import { staticFile } from "raea";
import eye from "../media/thermal/depth/eye/cams.json";
import fog from "../media/thermal/depth/fog/cams.json";
import glasses from "../media/thermal/depth/glasses/cams.json";
import mouse from "../media/thermal/depth/mouse/cams.json";
import night from "../media/thermal/depth/night/cams.json";
import notebook from "../media/thermal/depth/notebook/cams.json";
import phones from "../media/thermal/depth/phones/cams.json";
import sunset from "../media/thermal/depth/sunset/cams.json";
import team from "../media/thermal/depth/team/cams.json";
import thumbs from "../media/thermal/depth/thumbs/cams.json";

type Cams = { start: number; fps: number; frames: number; near_far_inv: number[] };
const DEPTH: Record<string, Cams> = { eye, fog, glasses, mouse, night, notebook, phones, sunset, team, thumbs };

export const hasDepth = (name: string) => name in DEPTH;

/** the layers for a shot showing clip seconds [from, from + seconds), and the layer index of clip second t */
export function layersFor(name: string, from: number, seconds: number) {
  const d = DEPTH[name];
  const first = Math.max(0, Math.floor((from - d.start) * d.fps));
  const last = Math.min(d.frames - 1, Math.ceil((from + seconds - d.start) * d.fps) + 1);
  const layers = Array.from({ length: last - first + 1 }, (_, i) => staticFile(`thermal/depth/${name}/d${String(first + i).padStart(4, "0")}.png`));
  return {
    layers,
    inv: [d.near_far_inv[0], d.near_far_inv[1]] as [number, number],
    index: (t: number) => Math.max(0, Math.min(layers.length - 1, Math.round((t - d.start) * d.fps) - first)),
  };
}
