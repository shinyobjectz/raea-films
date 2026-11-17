// Fingerprint, v3: two minutes in space with a narrator who'd rather not be impressed. Everything in the picture is
// a gaussian splat (media/splats: two trained from real footage with raea, the rest written by tools/splats.ts,
// sampled from real scans and frames or grown from mathematics), drawn by raea's <Splat> and moved by its own effects (assemble, explode, reveal, morph, wave,
// twist, pulse) on the narrator's words. One camera, one take, at 24 fps and 96 beats a minute.
// Render: raea render fingerprint3.tsx -o out/fingerprint3-vN.mp4
import { AbsoluteFill, Audio, Composition, Mix, Sequence, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Splat } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Transform } from "raea/transform";
import { Over } from "./v3/over";
import "./v3/score";
import { AT, camAt, type V3 } from "./v3/space";
import { BEAT, CUE, DURATION, FPS, LINES, LINE_AT, bump, hold, lineEnd, ramp } from "./v3/time";

const S = (n: string) => staticFile(`splats/${n}.ply`);
// raea keeps a splat's data by the order splats were first drawn in: one that leaves and another that arrives swap
// data (v3's first render drew the hand where the neurons were). So every splat is in the tree from the first frame
// to the last, and one that isn't on stage is parked far below and drawn clear.
// the turn that takes a splat's own +z to each axis (a splat sorts by a point along its +z: tools/splats.ts sixfold)
const ROT: V3[] = [[0, Math.PI / 2, 0], [0, -Math.PI / 2, 0], [-Math.PI / 2, 0, 0], [Math.PI / 2, 0, 0], [0, 0, 0], [0, Math.PI, 0]];
const AXES: V3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const HIDE = { position: [0, -900, 0] as V3, opacity: 0 };
const SHOWN = { opacity: 1 }; // said every frame it's on stage: a prop left out keeps its last value
const near = (t: number, a: number, b: number, pad = 2.5) => t > a - pad && t < b + pad; // a splat is drawn only while the camera can see it

function Film() {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cam = camAt(t);
  // which axis the camera faces most
  const fwd = [cam.at[0] - cam.eye[0], cam.at[1] - cam.eye[1], cam.at[2] - cam.eye[2]];
  let facing = 0;
  AXES.forEach((u, k) => { if (u[0] * fwd[0] + u[1] * fwd[1] + u[2] * fwd[2] > AXES[facing][0] * fwd[0] + AXES[facing][1] * fwd[1] + AXES[facing][2] * fwd[2]) facing = k; });
  const beat = Math.pow(1 - ((t / BEAT) % 1), 3); // the pulse everything breathes on
  const all = t > CUE.creativity - 1.5 && t < CUE.cat + 1; // the pull-back sees everything at once
  const spin = (rate: number, phase = 0): V3 => [0, t * rate + phase, 0];
  const show = (a: number, b: number, pad = 2.5) => all || near(t, a, b, pad);
  return (
    <AbsoluteFill style={{ background: "#04050a" }}>
      <Camera3d transform={Transform.fromXyz(...cam.eye).lookingAt(cam.at)} projection={{ Perspective: { fov: (cam.fov * Math.PI) / 180, near: 0.05, far: 400 } }} />


      {/* nothing, colourful: it thins as the hand takes it */}
      <Splat name="dust" src={S("dust")} position={AT.nothing} rotation={spin(0.05)} disperse={all ? 0 : ramp(t, CUE.hand - 0.6, CUE.bold + 1.2) * 0.92} wave={{ amplitude: 0.03, wavelength: 0.9, phase: t * 1.4 }} pulse={beat} pulseScale={0.06} seed={3} {...((show(0, CUE.trouble)) ? SHOWN : HIDE)} />
      <Splat name="hand" src={S("hand")} position={[AT.nothing[0], AT.nothing[1] - 0.05, AT.nothing[2] + 0.3]} rotation={[-0.5, 0.6 + t * 0.06, 0.2]} assemble={all ? 1 : ramp(t, CUE.hand - 0.7, CUE.hand + 1.5)} seed={5} {...((show(CUE.hand - 0.7, CUE.trouble + 2, 0)) ? SHOWN : HIDE)} />

      {/* the brain: do not touch */}
      <Splat name="brain" src={S("brain")} position={AT.brain} rotation={spin(0.12, 0.4)} explode={all ? 0 : ramp(t, CUE.pop, CUE.pop + 2.2) * 0.8 * (1 - ramp(t, CUE.fine + 0.2, CUE.anyway + 0.6))} pulse={beat} pulseScale={0.035} seed={8} {...((show(CUE.trouble - 2, CUE.this)) ? SHOWN : HIDE)} />

      {/* thought, and the loop it runs in */}
      <Splat name="neurons" src={S("neurons")} position={AT.neurons} rotation={spin(0.1)} reveal={all ? 1 : ramp(t, CUE.lightning - 0.6, CUE.this + 0.8)} revealGlow={0.8} glowColor="#ffffff" pulse={beat} pulseGlow={0.5} pulseScale={0.04} seed={2} {...((show(CUE.lightning, CUE.taste)) ? SHOWN : HIDE)} />
      <Splat name="loop" src={S("attractor")} position={AT.loop} rotation={[0.3, t * 0.22, 0.2]} reveal={all ? 1 : ramp(t, CUE.looping - 0.5, CUE.chaos + 0.6)} revealAxis={[1, 0, 0]} revealGlow={0.6} seed={4} {...((show(CUE.looping - 1.5, CUE.refusals)) ? SHOWN : HIDE)} />

      {/* taste: not that blue, not that vase, that one */}
      <Splat name="paint" src={S("palette")} position={AT.paint} rotation={spin(0.16)} assemble={all ? 1 : ramp(t, CUE.taste - 0.4, CUE.refusals)} tint={t > CUE.blue - 0.25 && t < CUE.blue + 0.55 ? "#2b5cff" : "#ffffff"} twist={0.5 * bump(t, CUE.blue + 0.75, 0.7)} seed={9} {...((show(CUE.taste, CUE.pattern)) ? SHOWN : HIDE)} />
      <Splat name="vase" src={S("vase-a")} position={AT.vase} rotation={spin(0.2)} assemble={all ? 1 : ramp(t, CUE.blue + 0.2, CUE.notVase + 0.5)} morph={{ to: S("vase-b"), amount: ramp(t, CUE.thatOne - 0.05, CUE.thatOne + 0.3) }} pulse={bump(t, CUE.thatOne + 0.25, 0.5)} pulseScale={0.22} pulseGlow={0.9} brightness={1 + 1.5 * bump(t, CUE.thatOne + 0.15, 0.4)} seed={6} {...((show(CUE.blue + 0.2, CUE.pattern + 1, 0)) ? SHOWN : HIDE)} />

      {/* the pattern it leaves */}
      <Splat name="whorl" src={S("whorl")} position={AT.whorl} rotation={[0.1 * Math.sin(t * 0.4), 0.4 * Math.sin(t * 0.5), 0]} scale={1.25} reveal={all ? 1 : ramp(t, CUE.pattern - 0.15, CUE.pattern + 0.45)} revealGlow={1} glowColor="#fff4d6" pulse={Math.max(beat * 0.25, bump(t, CUE.pattern + 0.4, 0.5))} pulseScale={0.14} pulseGlow={0.8} seed={1} {...((show(CUE.pattern - 2, CUE.videos + 1)) ? SHOWN : HIDE)} />

      {/* the cut: a camera, and its frames in a helix; Fingerprint in the middle of them */}
      <Splat name="camera" src={S("camera")} position={AT.camera} rotation={spin(0.25, 2.2)} assemble={all ? 1 : ramp(t, CUE.videos - 1.6, CUE.videos + 0.4)} seed={7} {...((show(CUE.videos - 1.6, CUE.red, 0)) ? SHOWN : HIDE)} />
      <Splat name="film" src={S("film")} position={AT.film} assemble={all ? 1 : ramp(t, CUE.ai - 0.4, CUE.wrong)} morph={{ to: S("film-fixed"), amount: ramp(t, CUE.flag + 0.5, CUE.fixed + 0.5) }} seed={11} {...((show(CUE.ai - 0.4, CUE.fixed + 0.5, 0) && !(all && t >= CUE.fixed)) ? SHOWN : HIDE)} />
      <Splat name="film-b" src={S("film-fixed")} position={AT.film} morph={{ to: S("film-told"), amount: all ? 1 : ramp(t, CUE.there - 0.25, CUE.there + 0.35) }} seed={11} {...((t >= CUE.fixed + 0.5 && show(CUE.fixed, CUE.machine + 2, 0)) ? SHOWN : HIDE)} />
      <Splat name="print" src={S("whorl")} position={AT.film} rotation={[0, 0.7 * Math.sin(t * 0.35), 0]} scale={0.72 * (1 + 1.6 * (1 - ramp(t, CUE.name + 0.05, CUE.name + 0.75)))} brightness={1 + 1.2 * bump(t, CUE.name + 0.3, 0.6)} reveal={all ? 1 : ramp(t, CUE.name - 0.05, CUE.name + 0.4)} revealGlow={1} glowColor="#ffffff" pulse={Math.max(beat * 0.5, 1.6 * bump(t, CUE.name + 0.35, 0.5), bump(t, CUE.approve + 0.2, 0.7), bump(t, CUE.pick + 0.2, 0.7), bump(t, CUE.leave + 0.2, 0.7), bump(t, CUE.there + 0.3, 0.8))} pulseScale={0.1} pulseGlow={0.3} seed={1} {...((show(CUE.name - 1, CUE.machine + 2)) ? SHOWN : HIDE)} />

      {/* your machine: your footage (a real place, trained from drone footage), kept in; and the one who just knows */}
      <Splat name="farm" src={S("farmhouse")} position={[AT.machine[0], AT.machine[1] + 0.05, AT.machine[2]]} scale={0.55} crop={2.5} assemble={all ? 1 : ramp(t, CUE.machine - 1.8, CUE.machine + 0.6)} seed={12} {...((show(CUE.machine - 1.8, CUE.creativity, 0)) ? SHOWN : HIDE)} />
      <Splat name="galaxy" src={S("galaxy")} position={AT.sky} rotation={[0.9, t * 0.12, 0.3]} scale={3.2} reveal={ramp(t, CUE.name - 1, CUE.name + 3)} seed={15} {...((t > CUE.name - 1) ? SHOWN : HIDE)} />
      <Splat name="buddha" src={S("buddha")} position={[AT.vase[0] + 1.75, AT.vase[1] + 0.15, AT.vase[2] + 0.2]} rotation={[0, -1.15 + 0.12 * Math.sin(t * 1.3), 0]} scale={1.5} reveal={all ? 1 : ramp(t, CUE.know - 0.9, CUE.know)} revealGlow={0.8} glowColor="#fff4d6" pulse={bump(t, CUE.know + 0.5, 0.6)} pulseScale={0.06} seed={16} {...((show(CUE.know - 0.9, CUE.pattern + 1, 0)) ? SHOWN : HIDE)} />
      <Splat name="machine" src={S("machine")} position={AT.machine} reveal={all ? 1 : ramp(t, CUE.machine - 0.6, CUE.leaves)} revealAxis={[0, 1, 0]} revealGlow={0.8} pulse={bump(t, CUE.leaves + 0.2, 0.8)} pulseGlow={0.9} pulseScale={0.02} seed={13} {...((show(CUE.machine - 1, CUE.creativity)) ? SHOWN : HIDE)} />

      {/* a cat */}
      <Splat name="cat" src={S("cat")} position={AT.cat} rotation={[0, -0.5 + 0.15 * Math.sin(t * 0.8), 0]} assemble={all ? 1 : ramp(t, CUE.cat - 1.4, CUE.cat + 0.3)} pulse={bump(t, CUE.consulted + 0.5, 0.6)} pulseScale={0.06} seed={14} {...((show(CUE.cat - 1.4, 200, 0)) ? SHOWN : HIDE)} />
      <Splat name="mark" src={S("whorl")} position={[AT.cat[0] - 2.0, AT.cat[1] + 0.85, AT.cat[2] - 0.2]} rotation={[0, 0.2 + 0.1 * Math.sin(t * 0.6), 0]} scale={0.55} reveal={ramp(t, CUE.end - 0.5, CUE.end + 0.9)} revealGlow={1} glowColor="#ffffff" pulse={beat * 0.6} pulseScale={0.03} seed={1} {...((show(CUE.end - 1.5, 200)) ? SHOWN : HIDE)} />

      {/* the backdrop: six copies of each, the one the camera faces shown (tools/splats.ts sixfold) */}
      {AXES.map((_u, k) => (
        <Splat key={`s${k}`} name={`stars-${k}`} src={S(`stars-${k}`)} rotation={ROT[k]} scale={20} opacity={k === facing ? 1 : 0} />
      ))}
      {AXES.map((_u, k) => (
        <Splat key={`n${k}`} name={`nebulae-${k}`} src={S(`nebulae-${k}`)} rotation={ROT[k]} scale={20} opacity={k === facing ? 0.8 : 0} />
      ))}

      <Over t={t} cam={cam} />
      {LINES.map((l) => (
        <Sequence key={l.id} from={Math.round(LINE_AT[l.id] * FPS)} durationInFrames={Math.round((lineEnd(l.id) - LINE_AT[l.id]) * FPS)} layout="none">
          <Audio src={staticFile(`voice3/${l.id}.mix.wav`)} bus="voice" />
        </Sequence>
      ))}
      <Mix lufs={-14} ceiling={-3} />
    </AbsoluteFill>
  );
}
void hold;

registerRoot(() => <Composition id="fingerprint3" width={1920} height={1080} fps={FPS} durationInFrames={DURATION} component={Film} />);
