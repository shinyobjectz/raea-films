// A sprite stack: a thing's horizontal slices (tools/stacks.py), each a flat plane, stacked a little apart. Turned as
// one, it reads as a solid made of pixels.
import { staticFile } from "raea";
import { ImagePlane } from "raea/3d";
import stacks from "./stacks.json";
import type { V3 } from "./plan";
export function Stack({ name, id, at, size = 1, tall = 1, turn = 0, tip = 0, pass }: { name: keyof typeof stacks; id: string; at: V3; size?: number; tall?: number; turn?: number; tip?: number; pass?: string }) {
  const n = stacks[name], c = Math.cos(tip), s = Math.sin(tip);
  // turned about the upright first, then laid flat (and tipped): q = Ry(turn) * Rx(tip - 90 degrees)
  const hx = (tip - Math.PI / 2) / 2, hy = turn / 2, q: [number, number, number, number] = [Math.cos(hy) * Math.sin(hx), Math.sin(hy) * Math.cos(hx), -Math.sin(hy) * Math.sin(hx), Math.cos(hy) * Math.cos(hx)];
  return <>{Array.from({ length: n }, (_, k) => { const h = (k / n) * tall * size;
    return <ImagePlane key={`${id}-${k}`} name={`${id}-${k}`} src={staticFile(`stack/${name}.png`)} grid={[n, 1]} frame={k} cutout shadow={false} pass={pass} width={size} height={size}
      position={[at[0] + h * s * Math.sin(turn), at[1] + h * c, at[2] + h * s * Math.cos(turn)]} quaternion={q} />; })}</>;
}
