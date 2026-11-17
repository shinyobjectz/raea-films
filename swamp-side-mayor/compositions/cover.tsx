// The post's cover, 9:16, laid out for it (not a crop of the film): the mayor striding at a low lens under the blue
// sky, the stones and the pond behind, the title in brush across the top and the made-in-raea sticker below; the
// words sit inside the middle 3:4 the profile grid shows.
import { AbsoluteFill, Composition, registerRoot, staticFile } from "raea";
import { FramePass, Model } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Transform } from "raea/transform";
import { G, GS, bodyAt, camera, root, toScreen, type V3 } from "./plan";
import { SUN, World2 } from "./world2";
import { Critters } from "./ruins";
import { STICKER, stickerUniforms } from "./sticker";
const B = 69.2, T = G(B);
function Cover() {
  const r = root(T), head = bodyAt(T, "head", r), eye: V3 = [r.p[0] + 0.55, 0.3, r.p[2] + 2.5], at: V3 = [head[0], head[1] - 0.05, head[2]];
  // v6: the crown it wears on SWAMP-SIDE MAYOR (film.tsx draws it the same way: above the head, tilted along the neck)
  const cam = { ...camera(T), eye, at, fov: 58, roll: 0, up: [0, 1, 0] as V3 }, AS = 1080 / 1920;
  const top = toScreen([head[0], head[1] + 0.1 * GS / 1.7, head[2]], T, AS, cam), tip = toScreen(bodyAt(T, "tip", r), T, AS, cam), hd = toScreen(head, T, AS, cam);
  const fl = Math.hypot(at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]), zc = ((head[0] - eye[0]) * (at[0] - eye[0]) + (head[1] - eye[1]) * (at[1] - eye[1]) + (head[2] - eye[2]) * (at[2] - eye[2])) / fl;
  const px = 960 / (zc * Math.tan((58 * Math.PI) / 360));   // cover pixels a metre at the head spans
  // floating a hand clear of the highest of its crown and its bill tip (the director 11-16: "above the head not over it")
  const crown = top && hd ? { x: top[0] * 1080, base: Math.min(top[1], tip ? tip[1] : 9) * 1920 - 0.07 * px, w: Math.max(140, 0.42 * px), tilt: Math.max(-12, Math.min(12, Math.atan2((top[0] - hd[0]) * 1080, (hd[1] - top[1]) * 1920) * 57)) } : null;
  return (
    <AbsoluteFill style={{ background: "#3896d4" }}>
      <Camera3d transform={Transform.fromXyz(...eye).lookingAt(at)} projection={{ Perspective: { fov: (58 * Math.PI) / 180, far: 900 } }} />
      <World2 t={T} wind={0.1} />
      <Critters t={T} look={r.p} />
      <FramePass wesl={STICKER} prepass={{ depth: true, normal: true }} uniforms={stickerUniforms(SUN)} />
      <Model name="goose" pass="hero" flat src={staticFile("glb/goose.glb")} position={r.p} rotation={[r.pitch, r.yaw, r.roll]} scale={r.s} graph={{ blend: [{ clip: "show", time: T, weight: 1 }] }} />
      <img src={staticFile("ink/title1-0.png")} style={{ position: "absolute", left: 90, top: 270, width: 900, transform: "rotate(-4deg)" }} />
      <img src={staticFile("ink/title2-0.png")} style={{ position: "absolute", left: 120, top: 430, width: 840, transform: "rotate(3deg)" }} />
      {crown && <img src={staticFile("ink/crown-0.png")} style={{ position: "absolute", left: crown.x - crown.w / 2, top: crown.base - crown.w * 0.687, width: crown.w, height: crown.w * 0.687, transform: `rotate(${crown.tilt - 4}deg)`, transformOrigin: "50% 100%" }} />}
      <img src={staticFile("ink/made-0.png")} style={{ position: "absolute", left: 300, top: 1660, height: 70 }} />
      <img src={staticFile("logo/raea-sticker.png")} style={{ position: "absolute", left: 320, top: 1720, width: 440 }} />
    </AbsoluteFill>
  );
}
registerRoot(() => <Composition id="cover" component={Cover} width={1080} height={1920} fps={30} durationInFrames={1} />);
