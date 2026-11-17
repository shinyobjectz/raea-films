// v3's ending: the product itself. the director, 11-11: "the sea scenes are also too long we shoudl try to wrap up another way
// ... the outro actually being more ui product of the app itself with some cool depth of field shots of timelines and
// thigns and comments and then a wide of the platform the the logo".
// The picture is a real capture of the raea app (media/app/timeline.png, tools/capture-app.sh: this film in Watch, six
// notes and what the agent did about each), standing as a sheet in a dark space. Three moves over it:
//   ui-timeline  close along the timeline and its playhead, a fast lens, most of the frame out of focus
//   ui-notes     close down the notes, the focus on the note we are passing
//   ui-feed      up the sidebar to raea's mark at its head, the menu and the projects going by out of focus
//   platform     the whole window, pulled back from slowly
// then the card. These are the first words in the film.
import { AbsoluteFill, Img, staticFile } from "raea";
import { Canvas3D, DepthOfField, Screen, ToneMapping } from "raea/3d";
import { SolariLighting } from "raea/light";
import { Camera3d } from "raea/camera";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import type { V3 } from "../v2/math";
import { camAt, dolly, type Dolly } from "./cam";
import { FilmLook } from "./look";
import { shot as shotOf, type Shot } from "./plan";
import { tallShot } from "./tall";

const PW = 3.2, PH = 2.0;                                       // the sheet, metres (the capture is 3200 x 2000)
/** raea's mark at the sidebar's head, its middle (u, v): in the capture it is 100 x 36 px at (32, 30) */
const LOGO: [number, number] = [82 / 3200, 48 / 2000];
/** a point of the capture (u across, v down, 0..1) on the sheet */
const on = (u: number, v: number, off = 0): V3 => [(u - 0.5) * PW, (0.5 - v) * PH, off];
type Move = { cam: Dolly; focus: (t: number) => number; f: number };
/** the focus held on a point of the sheet as the lens moves: its depth along the view (the depth of field is a plane
 *  square to the view, so a point off the axis is nearer to it than its straight-line distance) */
const holdOn = (d: Dolly, p: V3, id: string) => (t: number) => {
  const c = tallShot(id, camAt(d, t), t), f = [c.look[0] - c.eye[0], c.look[1] - c.eye[1], c.look[2] - c.eye[2]], l = Math.hypot(...f);
  return ((p[0] - c.eye[0]) * f[0] + (p[1] - c.eye[1]) * f[1] + (p[2] - c.eye[2]) * f[2]) / l;
};
const FEED_CAM = dolly(on(0.085, 0.13, 0.15), on(0.045, 0.06, 0), [-0.025, 0.045, -0.015], 28);
const MOVES: Record<string, Move> = {
  // along the timeline's row of markers toward the playhead, the lens almost lying on the glass
  "ui-timeline": { cam: dolly(on(0.24, 0.985, 0.3), on(0.52, 0.86, 0), [0.15, 0.0, -0.004], 34), focus: () => 0.52, f: 0.4 },   // (aimed up the timeline into the viewer: lying flatter, most of the frame was empty black)
  // down the notes, close, looking a little along them
  "ui-notes": { cam: dolly(on(0.72, 0.16, 0.42), on(0.9, 0.3, 0), [0.0, -0.22, 0], 32), focus: () => 0.66, f: 0.45 },
  // up the sidebar to raea's mark at its head (the director, 11-11, on assembly 23: "this should be a different angle of comethign
  // else maybe the logo", and "i meant maybe worth showing the logo on the ui but idk maybe projects"; it had been the
  // viewer's dark corner): the lens low over the menu, looking up it at the mark, which is sharp, while Studio, the menu
  // and the projects pass under the lens out of focus, drifting up toward it
  // (aimed past the mark, down and right of it, so it stands in the frame's upper left third and the menu fills the rest)
  // (the focus on the mark itself the whole way: as a fixed pull, the mark had gone soft by the cut and "Studio" was sharp)
  "ui-feed": { cam: FEED_CAM, focus: holdOn(FEED_CAM, on(LOGO[0], LOGO[1], 0.0008), "ui-feed"), f: 0.5 },
  "ui-robot": { cam: dolly(on(0.42, 0.42, 0.75), on(0.46, 0.42, 0), [0.06, 0, -0.1], 34), focus: (t) => 0.75 - 0.1 * t, f: 0.9 },
  // the whole platform
  platform: { cam: dolly([0.5, 0.12, 2.9], [-0.05, 0, 0], [0.02, 0.0, 0.22], 40), focus: (t) => 2.95 + 0.22 * t, f: 2.4 },
};
export const OUTRO = Object.keys(MOVES);
const ROBOT_F0 = shotOf("ui-timeline").f0;   // (the frame the ending begins on: the robot's clip starts there)

export function Outro({ s, t }: { s: Shot; t: number }) {
  const m = MOVES[s.id], c = tallShot(s.id, camAt(m.cam, t), t);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...c.eye).lookingAt(c.look)} projection={{ Perspective: { fov: (c.fov * Math.PI) / 180, near: 0.01, far: 100 } }}>
          <DepthOfField focal_distance={m.focus(t)} aperture_f_stops={m.f} max_circle_of_confusion_diameter={30} mode={"Bokeh" as never} />
          {/* (ray traced, as every shot is: the director, 11-12, "we should have solari for every shot") */}
          <SolariLighting bounces={2} />
        </Camera3d>
        <ToneMapping mode="none" exposure={0} />
        <Screen name="app" crt={false} brightness={1.9} background="#050506" resolution={[3200, 2000]} size={[PW, PH]} position={[0, 0, 0]}>
          <Img src={staticFile("app/timeline.png")} style={{ width: 3200, height: 2000 }} />
          {/* in the viewer, the musical's robot scene playing (the director, 11-11: "have this be the robot scene from the musical"):
              150 frames of the 0.1.1 release's stage-musical film, one clock across all the ending's cuts */}
          <div style={{ position: "absolute", left: 480, top: 96, width: 2080, height: 1660, background: "#050506" }} />
          <Img src={staticFile(`app/robot/r-${String(Math.min(152, Math.max(1, s.f0 - ROBOT_F0 + Math.round(t * 30) + 1))).padStart(3, "0")}.jpg`)} style={{ position: "absolute", left: 530, top: 369, width: 1980, height: 1114, borderRadius: 10 }} />
        </Screen>
        {/* the mark itself at ten times the capture's pixels, over its place in the capture (raea-lockup.png is the same mark,
            1664 x 596): seen as close as ui-feed sees it, the capture's 100 px of it were soft */}
        {s.id === "ui-feed" && (
          <Screen name="app-logo" crt={false} brightness={1.9} background="#050505" resolution={[1200, 520]} size={[0.12, 0.052]} position={on(LOGO[0], LOGO[1], 0.0008)}>
            <Img src={staticFile("brand/raea-lockup.png")} style={{ position: "absolute", left: 100, top: 80, width: 1000, height: 358 }} />
          </Screen>
        )}
        {/* the dark the window stands in: a floor far below and a wall behind, so the blur has something to fall off into */}
        <Mesh3d name="back" transform={Transform.fromXyz(0, 0, -0.6)}><Cuboid half_size={[30, 30, 0.05]} /><StandardMaterial base_color="#020203" perceptual_roughness={1} /></Mesh3d>
        {/* (no grain on the app: the director, 11-12, "the film gain when showing the ui platform shoudl be non existent i think its
            way too strong"; any grain but 0 is the film's whole grain in Finish) */}
        <FilmLook look={{ base: 0, warm: 0, sat: 1, contrast: 0, print: 0, vignette: 0.3, halation: 0.2, grain: 0 }} seed={s.f0} lines={false} />
      </Canvas3D>
    </AbsoluteFill>
  );
}
