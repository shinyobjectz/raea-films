// The tall film's frame (1080x1920, for TikTok and Instagram Reels) and the rules its layouts are drawn to.
// Where words go: inside both networks' safe zones at once (TikTok covers the top 7%, the bottom 25%, the left 5% and
// the right 13% with its own buttons and caption; Reels the top 14%, the bottom 35% and 6% each side), so every word
// stands in x 65..940, y 269..1248. Pictures may run to the frame's edges; words never leave that box.
// How big: words to be read are 60 px (raea's floor: at least 60 px at 1080 wide), the small heading over a shot 48 px,
// and no line of a label runs past 22 characters, so the longest fits the box's 875 px across (IBM Plex Mono's advance
// is 0.6 em: 60 px type with 2 px tracking is 38 px a character).
export const W = 1080, H = 1920;
export const SAFE = { x0: 65, x1: 940, y0: 269, y1: 1248 };
/** the safe box's middle: what the 3D layouts centre on */
export const MID = { x: (SAFE.x0 + SAFE.x1) / 2, y: (SAFE.y0 + SAFE.y1) / 2 };
export const TYPE = { label: 60, head: 48, aside: 44, track: 2 };
/** a mono line's width in pixels at `size` with `track` px between characters */
export const monoW = (s: string, size = TYPE.label, track = TYPE.track) => s.length * (0.6 * size + track);

// The 3D layouts' camera: 45 degrees vertical, at (cx, cy, cz) looking down -z, placed so the world's origin lands on
// the safe box's middle at any distance (so a slow push in stays centred on the words).
export const TAN = Math.tan(Math.PI / 8);
/** pixels per world unit on the plane z, the camera at cz */
export const kAt = (cz: number, z = 0) => H / 2 / ((cz - z) * TAN);
/** the camera's x and y for distance cz */
export const camXY = (cz: number): [number, number] => [(W / 2 - MID.x) / kAt(cz), -(H / 2 - MID.y) / kAt(cz)];
/** where a world point lands on the tall frame, in pixels */
export function px(x: number, y: number, cz: number, z = 0): [number, number] {
  const [cx, cy] = camXY(cz), k = kAt(cz, z);
  return [W / 2 + (x - cx) * k, H / 2 - (y - cy) * k];
}
