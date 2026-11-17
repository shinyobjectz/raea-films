// Before the song: a photocopier, seen from under its glass. the director, 11-12, on assembly 24: "the intro text sucks ass i
// dont want that i want somethign cleaner sexier and with some sound to thit but the point of the text was to tlook liek
// that film reels looking photocopy text where its warped and have it warped in the begnnning. and maybe we could do the
// intor like a phocopier like a legitimate looking photocopier aniamtion and sound effect", and a frame of a xerox
// collage, "› make it pop", as the look: "the text i was thinking of was liek this but at the mbegginning of made in".
// The sheet on the glass is that collage (tools/copy-page.sh, media/title/copy-page.png): the threshold's archway xeroxed
// hard, a strip of label across its doors, "› made in" in a typewriter's mono and "raea" a bitmap blown up until the
// toner rounds its pixels. Its door is where the next shot has the door, so the cut is a match.
//   f 0-17   the lid is up: the room's light comes through the paper from behind, the print a silhouette in it, and the
//            sheet, just laid down, is still curled off the glass (the words warped in the curl), sliding the last of the
//            way and settling; the lid comes down over it from the hinge, its shadow sweeping down the sheet, and presses
//            it flat (the thump, f17)
//   f 17-21  dark; the lamp strikes, a flicker, off the left edge
//   f 20-44  the carriage sweeps across under the glass, its cold lamp lighting a band of the sheet, the words read out
//            as it passes them, the dust on the glass catching it
//   f 43-60  the exposure: the whole sheet floods with the copier's light and holds, square to the lens, the words read
//            whole; the cut to the door (f60) is on the song's first sound
// The lens is square under the sheet from the first frame, still, easing slowly in toward it the whole way (the director, 11-12:
// "for the intro dont have a camer tilt just static witha slow ease into the the poush in form the beginning").
import { AbsoluteFill, staticFile, track } from "raea";
import { AntiAliasing, Bloom, Canvas3D, DepthOfField, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { LinearRgba, Srgba } from "raea/color";
import { AmbientLight, DirectionalLight, PointLight } from "raea/light";
import { BufferMesh, Cylinder, Mesh3d, Plane3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Quat, Transform } from "raea/transform";
import { clamp01, ease, ramp, type V3 } from "../v2/math";
import { FilmLook } from "./look";
import { FPS, INTRO_OVER, PAD } from "./plan";

/** the intro's frames: the seconds before the song, and the song's silent first frames (v3/plan.ts PAD) */
export const INTRO_FRAMES = Math.round(PAD * FPS) + INTRO_OVER;

// --- the sheet: 0.165 x 0.132 m, its printed face down on the glass (toward the lens, +z), the glass's top at z 0.
// The lens sees its middle 0.15 x 0.12 m at the end, the film's frame. It is N strips across, hinged each on the one
// below it, so it can curl off the glass (each strip's geometry fixed; only their transforms move)
const PW = 0.165, PH = 0.132, N = 28, SH = PH / N;
const PAGE = staticFile("title/copy-page.png");
const strip = (i: number) => {
  const v0 = 1 - i / N, v1 = 1 - (i + 1) / N;   // (the picture's v runs down from its top)
  return { positions: [-PW / 2, 0, 0, PW / 2, 0, 0, PW / 2, SH, 0, -PW / 2, SH, 0], normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], uvs: [0, v0, 1, v0, 1, v1, 0, v1], indices: [0, 1, 2, 0, 2, 3] };
};
const STRIPS = Array.from({ length: N }, (_, i) => strip(i));

/** the curl, frame f: how far strip i (0 at the sheet's foot) is turned off the glass, radians. The top two thirds
 *  rolled back off it, most at the top edge; it falls (as a weight does, slow then fast), rebounds a little, and the
 *  lid presses it flat; a ripple runs up it as it lands */
function bend(i: number, f: number) {
  const s = i / N, c = clamp01((s - 0.3) / 0.7) ** 1.6;
  const k = f <= 10 ? 1 - (f / 10) ** 2 : f <= 16 ? 0.09 * Math.sin((Math.PI * (f - 10)) / 6) : 0;
  const rip = 0.05 * Math.sin(9 * s - 0.8 * f) * Math.exp(-f / 7) * clamp01(s / 0.4) * (f < 17 ? 1 : 0);
  return Math.max(0, 1.0 * c * k + rip);
}
/** where the lid's shadow is, frame f: 1 open, 0 shut, for strip i (the hinge at the sheet's top: its top goes dark first) */
const lidOpen = (i: number, f: number) => { const d0 = 10 + 6 * (1 - (i + 0.5) / N); return 1 - ease(ramp(f, d0, d0 + 2.5)); };
/** the sheet's slide into place and its drop onto the glass */
const slide = (f: number) => -0.01 * (1 - ease(ramp(f, 0, 11)));
const drop = (f: number) => -0.004 * (1 - ease(ramp(f, 0, 9)));

// --- the light. The room through the paper while the lid is up (an emissive of the sheet's own picture: the toner
// stops it); the lamp under the glass; the exposure's flood
const ROOM = LinearRgba.from(Srgba.hex("#ffe6c8"));
const ROOM_NITS = 140;                                  // (700 burned the paper out and the print with it)
const LAMP = "#d9ffe9";                                 // (a copier's cold lamp, a little green)
const LAMP_E = LinearRgba.from(Srgba.hex(LAMP));
/** the lamp, 0..1: it strikes with a flicker at f17 and burns until the flood takes over, then dies off the right edge */
const FLICK = [0.25, 0, 0.6, 0.15, 0.85];
const lamp = (f: number) => (f < 17 ? 0 : f < 22 ? FLICK[Math.floor(f - 17)] : 1) * (1 - ease(ramp(f, 47, 54)));
const X0 = -0.09, X1 = 0.09;
/** the carriage, frame f: parked off the left edge, then across (a quick pull up to speed, then even) to off the right */
function carriage(f: number) {
  const u = ramp(f, 20, 44), a = 0.14, v = 1 / (1 - a / 2);
  return X0 + (X1 - X0) * (u < a ? (v * u * u) / (2 * a) : v * (u - a / 2));
}
/** the flood, 0..: up from f43 to a flash that burns the sheet out at f45-46, settled to 1 by f53
 *  (a peak of 4 was hardly a flash: the paper was already near its white, and only the darks lifted) */
const flood = (f: number) => (f < 43 ? 0 : f < 45 ? 14 * ease(ramp(f, 43, 45)) : 1 + 13 * (1 - ease(ramp(f, 46, 53))) ** 1.6);
const FLOOD_LUX = 8500;                                 // (5000 left the paper a grey)

const FRAMES = Array.from({ length: INTRO_FRAMES + 1 }, (_, f) => f);
const keysOf = <V,>(v: (f: number) => V) => Object.fromEntries(FRAMES.map((f) => [f, v(f)])) as Record<number, V>;
/** each strip's glow through the paper, frame by frame (its own material: the lid's shadow reaches it at its own time) */
const GLOW = STRIPS.map((_, i) => track(keysOf((f) => ROOM.mul(ROOM_NITS * ease(ramp(f, 0, 2.5)) * lidOpen(i, f) * (0.7 + 0.3 * Math.cos(bend(i, f))))), "linear"));
const TUBE = track(keysOf((f) => LAMP_E.mul(40000 * lamp(f))), "linear");   // (9000 was a hard white line, no glow)

// --- the lens: square under the sheet, still, pushing in from 9% further out (the whole sheet in frame) to its middle
// 0.15 x 0.12 m filling the frame on the last frame, eased in and out so it starts and lands without a jolt
const D = 0.2, FOV_END = 2 * Math.atan(0.06 / D);
const CAM0 = { eye: [0, 0, D * 1.09] as V3, look: [0, 0, 0] as V3, fov: FOV_END };
const CAM1 = { eye: [0, 0, D] as V3, look: [0, 0, 0] as V3, fov: FOV_END };
const lerp = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/** the intro, `t` seconds in */
export function Intro({ t }: { t: number }) {
  const f = t * FPS;
  const q = ramp(f, 0, INTRO_FRAMES - 1), k = q * q * (3 - 2 * q);
  const eye = lerp(CAM0.eye, CAM1.eye, k), look = lerp(CAM0.look, CAM1.look, k), fov = CAM0.fov + (CAM1.fov - CAM0.fov) * k;
  const focus = Math.hypot(eye[0] - look[0], eye[1] - look[1], eye[2] - look[2]);
  // the strips, each from the top edge of the one below
  const sx = slide(f);
  let y = -PH / 2, z = drop(f);
  const strips = STRIPS.map((m, i) => {
    const th = bend(i, f), at: V3 = [sx, y, z];
    y += SH * Math.cos(th); z -= SH * Math.sin(th);
    return (
      <Mesh3d key={i} name={`sheet-${i}`} transform={Transform.fromXyz(...at).withRotation(Quat.fromRotationX(-th))}>
        <BufferMesh {...m} />
        <StandardMaterial base_color_texture={PAGE} emissive_texture={PAGE} perceptual_roughness={0.92} reflectance={0.25} animate={{ emissive: GLOW[i] }} />
      </Mesh3d>
    );
  });
  const L = lamp(f), cx = carriage(f), fl = flood(f);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...eye).lookingAt(look)} projection={{ Perspective: { fov, near: 0.002, far: 5 } }}>
          <DepthOfField focal_distance={focus} aperture_f_stops={1.6 + 3.4 * k} max_circle_of_confusion_diameter={22} mode={"Bokeh" as never} />
        </Camera3d>
        <AntiAliasing mode="smaa" />
        <ToneMapping mode="agx" exposure={0} />
        <Bloom intensity={0.3} threshold={0.85} />
        {/* (no light but these: Bevy's default ambient greyed the whole sheet, and the lamp's band was lost in it) */}
        <AmbientLight color="#000000" brightness={0} />
        {strips}
        {/* the glass's dust, on its underside, 6 mm nearer the lens than the sheet: grey, so the flood hardly shows it and
            the lamp, passing 4 mm from it, makes it sparkle (white, it was snow over the whole sheet) */}
        <Mesh3d name="glass-dust" transform={Transform.fromXyz(0, 0, 0.006)}>
          <Plane3d normal={[0, 0, 1]} half_size={[PW / 2, PH / 2]} />
          <StandardMaterial base_color="#3a3a3a" base_color_texture={staticFile("title/copier-dust.png")} alpha_mode="Blend" perceptual_roughness={1} />
        </Mesh3d>
        {/* the carriage's lamp, a tube under the glass, seen bare */}
        <Mesh3d name="lamp-tube" transform={Transform.fromXyz(cx, 0, 0.0105)}>
          <Cylinder radius={0.0014} half_height={0.075} />
          <StandardMaterial base_color="#000000" emissive={LAMP} animate={{ emissive: TUBE }} />
        </Mesh3d>
        {Array.from({ length: 7 }, (_, j) => (
          <PointLight key={j} name={`lamp-${j}`} transform={Transform.fromXyz(cx, -0.066 + j * 0.022, 0.0098)} intensity={30 * L + 1e-4} range={0.25} radius={0.0014} color={LAMP} />
        ))}
        {/* the exposure: the sheet flooded from below */}
        <DirectionalLight illuminance={FLOOD_LUX * fl + 1e-4} color="#eef8f2" transform={Transform.fromXyz(0.02, -0.03, 1).lookingAt([0, 0, 0])} />
        {/* (print 0: the film's toe lifted the copier's black to a teal; the intro's black is black, and its flood's flash
            hides the change at the cut) */}
        <FilmLook look={{ base: 0, print: 0, warm: 0, sat: 1, contrast: 0.5, halation: 0.6, vignette: 0.32, grain: 0 }} seed={1} lines={false} />
      </Canvas3D>
    </AbsoluteFill>
  );
}
