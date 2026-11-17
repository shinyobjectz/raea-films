// What every place is built from: the Blender blockouts (media/models), glows (Solari has no point lights: a lamp is
// an emissive box), the cursor in the space, a comment's card and the app's screen. Every picture of the app is a
// capture once the app's lane delivers it to media/app, and a placeholder that says so until then (captures.gen.ts).
import { staticFile } from "raea";
import { ImagePlane, Model } from "raea/3d";
import { LinearRgba } from "raea/color";
import { Cuboid, Mesh3d, Plane3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Quat, Transform } from "raea/transform";
import { PICTURES } from "./captures.gen";
import { cardAt, cursorAt, cursorSize, yawTo } from "./aim";
import { camAt, type Cam } from "./cams";
import type { Comment } from "./plan";

export type V3 = [number, number, number];

/** a blockout (blender/blockout.py) or a model, by its file in media/models */
export function Glb({ file, at = [0, 0, 0], yaw = 0, scale = 1, name }: { file: string; at?: V3; yaw?: number; scale?: number; name?: string }) {
  return <Model name={name ?? file} src={staticFile(`models/${file}.glb`)} position={at} rotation={[0, yaw, 0]} scale={[scale, scale, scale]} />;
}

/** a glowing box: a tube, a lamp, a headlight */
export function Glow({ name, at, half, lum, rgb = [1, 0.97, 0.92] }: { name: string; at: V3; half: V3; lum: number; rgb?: V3 }) {
  return (
    <Mesh3d name={name} castShadow={false} transform={Transform.fromXyz(...at)}>
      <Cuboid half_size={half} />
      <StandardMaterial base_color="#ffffff" emissive={new LinearRgba(lum * rgb[0], lum * rgb[1], lum * rgb[2], 1)} />
    </Mesh3d>
  );
}

/** a picture of the app: its capture (media/app/NAME.png) if the app's lane has delivered it, else its placeholder */
export const picture = (name: string) => staticFile(PICTURES[name]?.capture ? `app/${name}.png` : `ph/${name}.png`);

/** the cursor in the space (media/models/cursor.glb, its origin at its tip): turned to the camera, a constant size on
 *  the frame, pressed for a moment on a click (parts/aim.ts places it) */
export function Cursor({ c, t, cam }: { c: Comment; t: number; cam: Cam }) {
  const tip = cursorAt(c, t, cam);
  if (!tip) return null;
  const press = Math.abs(t - c.click) < 0.1 || Math.abs(t - c.sent) < 0.08 ? 0.85 : 1;
  const size = cursorSize(cam, tip) * press;
  return <Model name="cursor" src={staticFile("models/cursor.glb")} position={tip} rotation={[0.12, yawTo(tip, cam.pos), 0]} scale={[size, size, size]} />;
}

/** a comment's card in the air beside what it's on, from the click until its change has landed (parts/aim.ts places
 *  it on the side of the point the frame has room for, as the camera sees it at the click). It is in the scene for its
 *  whole shot at one width, grown and folded by its scale: a card made mid-render would keep its first size */
export function Card({ c, t, cam }: { c: Comment; t: number; cam: Cam }) {
  const k = cardAt(c, t, cam, camAt(c.click));
  return <ImagePlane name={`card-${c.n}`} src={picture(`comment-${c.n}`)} width={k.base} scale={k.scale} position={k.at} rotation={[0, k.yaw, 0]} shadow={false} />;
}

/** the app's screen at `at` (1.92 by 1.2), facing +z turned by `yaw`: a dark slab, its picture glowing on its face so
 *  it lights what's round it (Solari) */
export function Screen({ at, yaw = 0, file, glow = 12 }: { at: V3; yaw?: number; file: string; glow?: number }) {
  const src = picture(file);
  return (
    <>
      <Glb file="gb-screen-a" at={at} yaw={yaw} name="screen-body" />
      {/* named by its picture: the engine keeps a material's first texture under its name */}
      <Mesh3d key={file} name={`screen-face-${file}`} castShadow={false} transform={Transform.fromXyz(at[0], at[1], at[2]).withRotation(Quat.fromEuler("YXZ", yaw, Math.PI / 2, 0))}>
        <Plane3d half_size={[0.96, 0.6]} />
        <StandardMaterial base_color="#000000" emissive_texture={src} emissive={new LinearRgba(glow, glow, glow, 1)} perceptual_roughness={0.2} />
      </Mesh3d>
    </>
  );
}

/** a flat grey floor box */
export function Slab({ name, lo, hi, color = "#808080", rough = 0.8, reflect = 0.5 }: { name: string; lo: V3; hi: V3; color?: string; rough?: number; reflect?: number }) {
  const c: V3 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  return (
    <Mesh3d name={name} transform={Transform.fromXyz(...c)}>
      <Cuboid half_size={[(hi[0] - lo[0]) / 2, (hi[1] - lo[1]) / 2, (hi[2] - lo[2]) / 2]} />
      <StandardMaterial base_color={color} perceptual_roughness={rough} reflectance={reflect} />
    </Mesh3d>
  );
}
