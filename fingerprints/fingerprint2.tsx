// Fingerprint, v2: a launch film for raea's Fingerprint. An artist's hand (a scan, rigged and posed in the film's own
// code: v2/rig.ts, v2/act.ts) draws, paints, conducts and leaves notes at a desk of real scanned things, lit by
// Solari. 97.5 s at 24 fps, a waltz at 144. Render: raea render fingerprint2.tsx -o out/fingerprint2-vN.mp4
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from "raea";
import { ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { SolariLighting } from "raea/light";
import { DepthOfField } from "raea/post_process";
import { Transform } from "raea/transform";
import { ARC, CUE, NOTE, NOTES, PICKED, PRINTS, PRINT_AT, SHEET, STRIP, UNDERLINE, act, arcAt, offHand, drawn, painted, printShown, slipAt, spiralAt, underlined, written } from "./v2/act";
import { camAt } from "./v2/cam";
import { Hand } from "./v2/hand";
import { Over } from "./v2/over";
import { STICK } from "./v2/poses";
import { Flat, PAPER, Ribbon, Sheet, Sticky } from "./v2/props";
import { apply, boneAt } from "./v2/rig";
import { Desk, Lights } from "./v2/set";
import { DURATION, FPS } from "./v2/time";
import { Baton, Brush, Pencil } from "./v2/tools";

const sample = (fn: (u: number) => [number, number], to: number, n: number) => { const c = Math.max(2, Math.ceil(n * to) + 1); return Array.from({ length: c }, (_, i) => fn((to * i) / (c - 1))); };
void ARC;

function Film() {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cam = camAt(t, FPS);
  const s = act(t);
  const shot = s.shot;
  const m = s.pose && s.tool ? boneAt("hand", s.pose) : null;
  const tip = m ? apply(m, STICK.tip) : null;
  const back = m ? apply(m, STICK.back) : null;
  const onSheet = shot === "draw" || shot === "work" || shot === "paint" || shot === "print" || shot === "end";
  const drawing = shot === "draw" || shot === "work";
  const painting = shot === "paint" || shot === "print" || shot === "end";
  const slip = slipAt(t);
  const off = offHand(t);
  return (
    <AbsoluteFill style={{ background: "#020304" }}>
      <Camera3d transform={Transform.fromXyz(...cam.eye).lookingAt(cam.at)} projection={{ Perspective: { fov: (cam.fov * Math.PI) / 180, near: 0.05, far: 300 } }}>
        <DepthOfField focal_distance={cam.focus} aperture_f_stops={cam.fstop} />
        <SolariLighting bounces={2} reset={cam.first} />
      </Camera3d>
      <ToneMapping exposure={0.4} />
      <Lights />
      <Desk />

      {onSheet ? <Sheet x={SHEET.x} z={SHEET.z + (painting ? 0.25 : 0.35)} w={SHEET.w} d={SHEET.d + 0.5} turn={SHEET.turn * (painting ? -1 : 1)} name={painting ? "sheet-paint" : "sheet-draw"} /> : null}
      {drawing ? <Ribbon name="graphite" pts={sample(spiralAt, drawn(t), 260)} width={0.02} y={PAPER + 0.0015} color="#3a3a40" rough={0.55} /> : null}
      {shot === "work" ? <Ribbon name="underline" pts={sample((u) => [UNDERLINE.a[0] + (UNDERLINE.b[0] - UNDERLINE.a[0]) * u, UNDERLINE.a[1] + (UNDERLINE.b[1] - UNDERLINE.a[1]) * u + 0.03 * Math.sin(u * 5)], underlined(t), 40)} width={0.022} y={PAPER + 0.0015} color="#3a3a40" rough={0.55} /> : null}
      {painting ? <Ribbon name="paint" pts={sample(arcAt, painted(t), 90)} width={0.2} y={PAPER + 0.004} color="#b3261c" rough={0.22} taper={0.12} coat={0.6} /> : null}
      {(shot === "print" || shot === "end") && printShown(t) > 0 ? (
        <Mesh3dPrint />
      ) : null}

      {shot === "notes" ? NOTES.map((n, i) => <Sticky key={i} i={i} x={n.at[0]} z={n.at[1]} shown={written(i, t)} turn={(i - 1) * 0.07} />) : null}

      {shot === "pick" ? (
        <>
          {PRINTS.map(([x, z], i) => <Flat key={i} name={`take-${i}`} x={x} z={z} w={1.2} d={0.8} y={0} h={PAPER} turn={(i - 1) * -0.09} src={`v2/print-${i}.png`} rough={0.35} />)}
          <Flat name="slip" x={slip[0]} z={slip[1]} w={NOTE} d={NOTE} y={0} h={0.004} turn={0.06} src="v2/note-0.png" />
        </>
      ) : null}
      {shot === "strip" || shot === "cover" ? <Flat name="strip" x={STRIP.x} z={STRIP.z} w={STRIP.w} d={STRIP.d * (320 / 2440) * (STRIP.w / STRIP.d)} y={0} h={PAPER} src={t >= CUE.fixed + 0.5 ? "v2/strip-fixed.png" : "v2/strip.png"} rough={0.4} /> : null}

      {s.pose ? <Hand pose={s.pose} /> : null}
      {off ? <Hand pose={off} left /> : null}
      {tip && back && s.tool === "pencil" ? <Pencil tip={tip} back={back} /> : null}
      {tip && back && s.tool === "brush" ? <Brush tip={tip} back={back} /> : null}
      {tip && back && s.tool === "baton" ? <Baton tip={tip} back={back} /> : null}
      <Over t={t} cam={cam} pose={s.pose} />
    </AbsoluteFill>
  );
}

// the thumb's print in red paint on the sheet
function Mesh3dPrint() {
  return <Flat name="thumbprint" x={PRINT_AT[0]} z={PRINT_AT[1]} w={0.34} d={0.34} y={PAPER + 0.001} h={0.001} turn={0.25} src="v2/thumb.png" cut />;
}
void PICKED;

registerRoot(() => <Composition id="fingerprint2" width={1920} height={1080} fps={FPS} durationInFrames={DURATION} component={Film} />);
