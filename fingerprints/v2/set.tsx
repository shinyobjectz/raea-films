// The set: an artist's desk. A wooden top (Poly Haven's wood_table_001), a studio's light (the artist_workshop
// panorama) with a window's worth of soft key and a cool edge, and real scanned things behind the work, where the
// lens's depth of field leaves them soft: a desk lamp, a stills camera, a cine camera, a vase, a clock (all Poly
// Haven, CC0). Everything is ten times life size, as the hand is; the desk's top is y = 0.
import { staticFile } from "raea";
import { Environment, Model } from "raea/3d";
import { LinearRgba, Srgba } from "raea/color";
import { Affine2 } from "raea/math";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";

export const K = 10;
const WARM = LinearRgba.from(Srgba.hex("#ffe1c2"));
const COOL = LinearRgba.from(Srgba.hex("#9cc4ff"));

/** light strengths in the traced light's units; `g` scales the lot */
export function Lights({ g = 1 }: { g?: number }) {
  return (
    <>
      <Environment src={staticFile("set/artist_workshop_2k.hdr")} intensity={0.35} rotation={2.2} />
      {/* the window: a big soft key, high on the hand's thumb side */}
      <Mesh3d name="key" transform={Transform.fromXyz(16, 17, 6).lookingAt([0, 0, 0])}>
        <Cuboid half_size={[7, 7, 0.1]} />
        <StandardMaterial base_color="#000000" emissive={WARM.mul(5200 * g)} />
      </Mesh3d>
      {/* the edge: a cool strip low behind the work */}
      <Mesh3d name="rim" transform={Transform.fromXyz(-14, 7, 14).lookingAt([0, 0.5, 0])}>
        <Cuboid half_size={[1.6, 5, 0.1]} />
        <StandardMaterial base_color="#000000" emissive={COOL.mul(4200 * g)} />
      </Mesh3d>
    </>
  );
}

export function Desk() {
  return (
    <>
      <Mesh3d name="desk" transform={Transform.fromXyz(0, -0.5, 4)}>
        <Cuboid half_size={[26, 0.5, 20]} />
        <StandardMaterial base_color="#ffffff" base_color_texture={staticFile("set/wood_table_001_diff_2k.jpg")} normal_map_texture={staticFile("set/wood_table_001_nor_gl_2k.jpg")} metallic_roughness_texture={staticFile("set/wood_table_001_rough_2k.jpg")} perceptual_roughness={1} uv_transform={Affine2.fromScale([5, 3.8])} />
      </Mesh3d>
      {/* the room behind, far and dark, so the frame has an end */}
      <Mesh3d name="wall" transform={Transform.fromXyz(0, 14, 30)}>
        <Cuboid half_size={[60, 30, 0.5]} />
        <StandardMaterial base_color="#2a2622" perceptual_roughness={0.9} />
      </Mesh3d>
      <Model src={staticFile("set/desk_lamp_arm_01.glb")} position={[-9.5, 0, 12.5]} rotation={[0, 2.5, 0]} scale={K} />
      <Model src={staticFile("set/Camera_01.glb")} position={[5.5, 0, 12]} rotation={[0, 2.2, 0]} scale={K} />
      <Model src={staticFile("set/ceramic_vase_01.glb")} position={[-3, 0, 15.5]} scale={K} />
      <Model src={staticFile("set/vintage_video_camera.glb")} position={[11.5, 0, 9]} rotation={[0, -2.4, 0]} scale={K} />
      <Model src={staticFile("set/alarm_clock_01.glb")} position={[1.6, 0.66, 14.2]} rotation={[0, 3.0, 0]} scale={K} />
    </>
  );
}

/** a sheet of paper lying on the desk: its top face is at y = PAPER */
export const PAPER = 0.012;
export function Paper({ x, z, w = 2.97, d = 2.1, turn = 0, name = "paper", color = "#f3efe6" }: { x: number; z: number; w?: number; d?: number; turn?: number; name?: string; color?: string }) {
  return (
    <Mesh3d name={name} transform={Transform.fromXyz(x, PAPER / 2, z).withRotation([0, Math.sin(turn / 2), 0, Math.cos(turn / 2)])}>
      <Cuboid half_size={[w / 2, PAPER / 2, d / 2]} />
      <StandardMaterial base_color={color} base_color_texture={staticFile("textures/Paper001/Paper001_2K-JPG_Color.jpg")} perceptual_roughness={0.92} />
    </Mesh3d>
  );
}
