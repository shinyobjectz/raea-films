// The office's four shots (chain 2 to 5) as one continuous take (v2/office.shots.ts), drawn on the room in
// sets/office-room.ts. What the room's parts don't carry is here: the air, the light in the fittings, the sky outside.
import type React from "react";
import { AbsoluteFill, Composition, Img, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Environment, FogVolume, ImagePlane, VolumetricFog } from "raea/3d";
import { LinearRgba } from "raea/color";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import { ROOM, ROWS } from "../sets/office-room";
import { CommentCard } from "./card";
import { BEATS, OFFICE, SCREEN, WALL, WINDOW, officeAt, startOf } from "./office.shots";
import { reach } from "./path";
import { FPS, H, W } from "./plan";
import { Stage, clamp01, ease, ramp, type V3 } from "./stage";
import { Prompt, Word3D } from "./type";
import { Cursor, PickBox, project } from "./ui";

function Air({ sky, tubes, haze, lamps }: { sky: number; tubes: (row: number) => number; haze: number; lamps: { at: V3; on: boolean }[] }) {
  const { x, z0, z1, h } = ROOM, mid = (z0 + z1) / 2, half = (z0 - z1) / 2;
  return (
    <>
      {/* a slab over the suspended ceiling keeps the sky out of the room */}
      <Mesh3d name="roof" transform={Transform.fromXyz(0, h + 0.3, mid)}><Cuboid half_size={[x + 1, 0.1, half + 1]} /><StandardMaterial base_color="#202020" /></Mesh3d>
      {/* the room's air: dust the morning sun shows as shafts through the slats */}
      <VolumetricFog ambient={0} />
      <FogVolume name="air" position={[0, h / 2, mid]} scale={[x * 2, h, half * 2]} density={haze} scattering={0.6} anisotropy={0.7} />
      {/* the fittings' light: a glowing panel in each (Solari lights from emissive surfaces), named by its level, since a render keeps a material's first values */}
      {ROWS.flatMap((z, r) => [-3.4, 0, 3.4].map((cx) => {
        const lum = tubes(r);
        return (
          <Mesh3d key={`glow-${r}-${cx}-${lum}`} name={`glow-${r}-${cx}-${lum}`} castShadow={false} transform={Transform.fromXyz(cx, h - 0.012, z - 0.4)}>
            <Cuboid half_size={[0.26, 0.004, 0.56]} />
            <StandardMaterial base_color="#ffffff" emissive={new LinearRgba(lum, lum * 0.98, lum * 0.94, 1)} />
          </Mesh3d>
        );
      }))}
      {/* the desk lamps: a small warm glow under each shade, lit when the second note is taken up */}
      {lamps.map((l, i) => (
        <Mesh3d key={`lamp-glow-${i}-${l.on}`} name={`lamp-glow-${i}-${l.on}`} castShadow={false} transform={Transform.fromXyz(l.at[0], l.at[1] + 0.36, l.at[2])}>
          <Cuboid half_size={[0.035, 0.012, 0.035]} />
          <StandardMaterial base_color="#ffffff" emissive={l.on ? new LinearRgba(160000, 96000, 40000, 1) : new LinearRgba(0, 0, 0, 1)} />
        </Mesh3d>
      ))}
      {/* what is outside the windows: the sky, at the shot's level (a panel out there would shade the sun) */}
      <Environment src={staticFile("hdri/kloofendal_48d_partly_cloudy_puresky.hdr")} intensity={sky} rotation={1.2} background />
    </>
  );
}

/** the cursor through the take: in after the answer, to the chair, holding it across the aisle, to the window to
 *  leave the first note, to a partition to leave the second, and away. Every move is a reach, never a slide. */
function cursorAt(T: number, s: ReturnType<typeof officeAt>): { at: [number, number]; press: number; ring: number; holds: "chair" | null } | null {
  if (T < BEATS.cursorIn || T >= startOf(3)) return null;
  const chair = project(s.cam, [s.chair[0], 0.95, s.chair[2]]);
  const P = (p: { x: number; y: number }): [number, number] => [p.x, p.y];
  const win = P(project(s.cam, WINDOW)), wall = P(project(s.cam, WALL));
  const [c0, c1] = BEATS.chair, n = BEATS.note, n2 = BEATS.note2;
  const ring = (at: number) => (T >= at && T < at + 0.4 ? (T - at) / 0.4 : -1);
  const click = (at: number) => (Math.abs(T - at) < 0.08 ? 1 : 0);
  if (T < c0) return { at: reach(T, [W * 0.97, H * 0.98], P(chair), BEATS.cursorIn, c0), press: 0, ring: -1, holds: null };
  if (T < c1) return { at: P(chair), press: 1, ring: ring(c0), holds: "chair" };
  if (T < n.sent + 0.4) return { at: reach(T, P(chair), win, c1 + 0.05, n.open), press: click(n.open), ring: ring(n.open), holds: null };
  if (T < n2.sent + 0.4) return { at: reach(T, win, wall, n2.open - 1.3, n2.open), press: click(n2.open), ring: ring(n2.open), holds: null };
  return { at: reach(T, wall, [W * 0.98, H * 0.9], n2.sent + 0.4, n2.sent + 1.4), press: 0, ring: -1, holds: null };
}

function Office({ shot, guide }: { shot: number; guide?: boolean }) {
  const T = startOf(shot) + useCurrentFrame() / FPS;
  const s = officeAt(T);
  const c = cursorAt(T, s);
  const [r0, r1] = BEATS.raea;
  const pop = 1 - (1 - clamp01((T - r0) / 0.22)) ** 3, fade = 1 - ease(ramp(T, r1 - 0.5, r1));
  const over = (
    <>
      {/* the person at the generator, each line over a held frame: the office they asked for, a nicer one (no better), then what they really want */}
      <Prompt lines={[{ text: "a boring office", from: -9 }, { text: "a nicer office", from: BEATS.nicer }, { text: "a new way to be creative", from: BEATS.creative }]} busy={[[BEATS.nicer + 1.1, BEATS.reroll], [BEATS.creative + 1.6, r0]]} t={T} until={r0} />
      {/* the answer, on the drop: raea */}
      {T >= r0 && T < r1 && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", pointerEvents: "none" }}>
          <Img src={staticFile("brand/raea-lockup.png")} style={{ width: 620, height: (620 * 596) / 1664, opacity: pop * fade, transform: `scale(${(0.86 + 0.14 * pop + 0.03 * (T - r0)).toFixed(4)})` }} />
        </AbsoluteFill>
      )}
      {c?.holds === "chair" && <PickBox cam={s.cam} at={[s.chair[0], 0.56, s.chair[2]]} half={[0.36, 0.56, 0.36]} />}
      <CommentCard text="let the morning in." t={T - BEATS.note.open} sent={BEATS.note.sent - BEATS.note.open} at={[W * 0.2, H * 0.4]} />
      <CommentCard text="somewhere worth staying." t={T - BEATS.note2.open} sent={BEATS.note2.sent - BEATS.note2.open} at={[W * 0.16, H * 0.24]} />
      {c && <Cursor x={c.at[0]} y={c.at[1]} press={c.press} ring={c.ring} />}
    </>
  );
  const sh = OFFICE[shot];
  return (
    <Stage pieces={s.pieces} cam={s.cam} sun={s.sun} ev={s.ev} guide={guide} over={over} reset={s.cut} look={{ warm: s.warm, wire: s.wire }} wire seed={Math.round(startOf(shot) * FPS)} hooks={[{ at: sh.in.at, label: "in" }, { at: sh.out.at, label: "out", out: true }]}>
      <Air sky={s.sky} tubes={s.tubes} haze={s.haze} lamps={s.pieces.filter((p) => p.name.startsWith("lamp-")).map((p) => ({ at: p.at, on: s.nice }))} />
      {/* the film's sentence starts here, on the wall behind where we came in, the room's own things in front of it */}
      <Word3D text="NOW IT'S A PLACE." t={T} from={BEATS.word} at={[0, 1.42, ROOM.z0 - 0.06]} wide={12.8} turn={Math.PI} color="#fff3dc" />
      {/* the screen wakes on the app (a capture of Watch); there from the first frame at no size, grown by its scale */}
      <ImagePlane name="screen" src={staticFile("app/watch-canyon.png")} width={0.529} scale={s.wake > 0 ? 1 : 1e-4} position={[SCREEN[0] - 0.006, SCREEN[1], SCREEN[2]]} rotation={[0, -Math.PI / 2, 0]} shadow={false} />
    </Stage>
  );
}

/** the same shot at the film's full size: the page drawn at twice its scale, the 3D at the full frame */
const Full = ({ children }: { children: React.ReactNode }) => <AbsoluteFill style={{ width: W, height: H, transform: "scale(2)", transformOrigin: "0 0" }}>{children}</AbsoluteFill>;
registerRoot(() => (
  <>
    {OFFICE.map((sh, i) => <Composition key={`x${i}`} id={`v2x-office-${i + 1}`} component={() => <Full><Office shot={i} /></Full>} width={W * 2} height={H * 2} fps={FPS} durationInFrames={Math.round(sh.seconds * FPS)} />)}
    {OFFICE.map((sh, i) => <Composition key={i} id={`v2-office-${i + 1}`} component={() => <Office shot={i} />} width={W} height={H} fps={FPS} durationInFrames={Math.round(sh.seconds * FPS)} />)}
    {OFFICE.map((sh, i) => <Composition key={`g${i}`} id={`v2g-office-${i + 1}`} component={() => <Office shot={i} guide />} width={W} height={H} fps={FPS} durationInFrames={Math.round(sh.seconds * FPS)} />)}
  </>
));
