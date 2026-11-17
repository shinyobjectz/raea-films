// What lies on the desk and what the hand leaves there: the sheet, a pencil's line and a brush's stroke (ribbons of
// their own, drawn as far as the tool has got; a frame is rendered on its own, so a shape that grows keeps its name), sticky notes that fill in as they are written, prints, the contact
// strip, the thumb's print. The viewer sits at -z, so their left is +x.
import { staticFile } from "raea";
import { BufferMesh, Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Quat, Transform } from "raea/transform";

export const PAPER = 0.012;
const PAPER_TEX = "textures/Paper001/Paper001_2K-JPG_Color.jpg";
const yTurn = (a: number) => Quat.fromRotationY(a);

/** a flat thing on the desk, its picture reading upright to the viewer at -z: (x, z) its middle, y its underside */
export function Flat({ name, x, z, w, d, y = 0, h = PAPER, turn = 0, src, color = "#ffffff", rough = 0.9, cut = false }: { name: string; x: number; z: number; w: number; d: number; y?: number; h?: number; turn?: number; src?: string; color?: string; rough?: number; cut?: boolean }) {
  return (
    <Mesh3d name={name} transform={Transform.fromXyz(x, y + h / 2, z).withRotation(yTurn(Math.PI + turn))}>
      <Cuboid half_size={[w / 2, h / 2, d / 2]} />
      <StandardMaterial base_color={color} base_color_texture={src ? staticFile(src) : undefined} perceptual_roughness={rough} alpha_mode={cut ? { Mask: 0.35 } : undefined} />
    </Mesh3d>
  );
}
export const Sheet = ({ x, z, w, d, turn = 0, name = "sheet" }: { x: number; z: number; w: number; d: number; turn?: number; name?: string }) => <Flat name={name} x={x} z={z} w={w} d={d} turn={turn} src={PAPER_TEX} color="#f6f2ea" />;

/** a line on a surface: points (x, z), drawn as a strip `width` wide at height y; `taper` thins its two ends */
export function Ribbon({ name, pts, width, y, color, rough = 0.8, taper = 0, coat = 0 }: { name: string; pts: [number, number][]; width: number; y: number; color: string; rough?: number; taper?: number; coat?: number }) {
  if (pts.length < 2) return null;
  const P: number[] = [], N: number[] = [], I: number[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], tz = b[1] - a[1];
    const l = Math.hypot(tx, tz) || 1;
    tx /= l; tz /= l;
    const u = i / (n - 1);
    const w = (width / 2) * (taper ? Math.min(1, u / taper + 0.25, (1 - u) / taper + 0.25) : 1);
    P.push(pts[i][0] - tz * w, y, pts[i][1] + tx * w, pts[i][0] + tz * w, y, pts[i][1] - tx * w);
    N.push(0, 1, 0, 0, 1, 0);
    if (i < n - 1) { const k = i * 2; I.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  return (
    <Mesh3d name={name}>
      <BufferMesh positions={P} normals={N} indices={I} />
      <StandardMaterial base_color={color} perceptual_roughness={rough} double_sided cull_mode={null} clearcoat={coat} />
    </Mesh3d>
  );
}

/** a sticky note whose words appear as they are written: `shown` 0 to 1, from the viewer's left (+x) */
export function Sticky({ i, x, z, shown, side = 0.76, turn = 0 }: { i: number; x: number; z: number; shown: number; side?: number; turn?: number }) {
  const left = side * (1 - shown); // what's still blank, on the viewer's right (-x)
  return (
    <>
      <Flat name={`note-${i}`} x={x} z={z} w={side} d={side} y={PAPER} h={0.004} turn={turn} src={`v2/note-${i}.png`} />
      {left > 0.004 ? <Flat name={`note-${i}-blank`} x={x - side / 2 + left / 2} z={z} w={left} d={side} y={PAPER + 0.004} h={0.0015} turn={turn} color="#f1dc6e" /> : null}
    </>
  );
}
