// NOT FOR DELIVERY: fingerprint.tsx without the master <Mix>, rendered to a WAV only, to measure the voice against
// the bed at their raw levels (tools/mixcheck.sh). Delete with the test files once the mix is signed off.
// Fingerprint: an 80 s explainer of raea's Fingerprint for creators who edit with AI, made as a desk of paper, ink,
// photos and film: drawn on by hand, moved on twos and threes, collaged from CC0 scans and Pixabay stock.
// The plan is fingerprint.script.ts; the voice is Fish (media/voice, timed by parakeet), the score is tools/compose.ts
// played by parts/score.tsx, and every cue in picture and score reads the same clock (parts/timeline.ts).
import { AbsoluteFill, Audio, Composition, Img, Mix, Sequence, registerRoot, staticFile, useCurrentFrame } from "raea";
import { FONTS } from "./parts/draw";
import { TEX, Vignette } from "./parts/paper";
import "./parts/score";
import { LEAD, SlideIn } from "./parts/stage";
import { DURATION, FPS, LINE_AT, SCENES, type SceneName, lineEnd } from "./parts/timeline";
import { EyeScene } from "./parts/scenes/eye";
import { NotesScene } from "./parts/scenes/notes";
import { PrintScene } from "./parts/scenes/print";
import { WordsScene } from "./parts/scenes/words";
import { CheckScene } from "./parts/scenes/check";
import { YoursScene } from "./parts/scenes/yours";
import { EndScene } from "./parts/scenes/end";

const ORDER: { name: SceneName; C: (p: { g: number }) => JSX.Element; from: "right" | "left" | "bottom" | "top" }[] = [
  { name: "eye", C: EyeScene, from: "right" },
  { name: "notes", C: NotesScene, from: "right" },
  { name: "print", C: PrintScene, from: "bottom" },
  { name: "words", C: WordsScene, from: "top" },
  { name: "check", C: CheckScene, from: "left" },
  { name: "yours", C: YoursScene, from: "right" },
  { name: "end", C: EndScene, from: "bottom" },
];

function Scene({ name, C, from }: (typeof ORDER)[number]) {
  const lf = useCurrentFrame();
  const lead = name === "eye" ? 0 : LEAD;
  const g = lf + SCENES[name].from - lead;
  if (name === "eye") return <C g={g} />;
  return (
    <SlideIn lf={lf} from={from}>
      <C g={g} />
    </SlideIn>
  );
}

/** the paper's tooth over everything, shifted on twos like a new exposure, and the lamp's falloff */
function Grade() {
  const f = useCurrentFrame();
  const s = Math.floor(f / 2);
  return (
    <>
      <Img src={TEX.white} style={{ position: "absolute", left: -((s * 37) % 160), top: -((s * 23) % 120), width: 2200, height: 2200, mixBlendMode: "multiply", opacity: 0.16 }} />
      <Vignette />
    </>
  );
}

function Fingerprint() {
  return (
    <AbsoluteFill style={{ background: "#2a2118" }}>
      <style>{FONTS}</style>
      {ORDER.map((s) => {
        const lead = s.name === "eye" ? 0 : LEAD;
        const start = SCENES[s.name].from - lead;
        const end = SCENES[s.name].to;
        return (
          <Sequence key={s.name} name={s.name} from={start} durationInFrames={end - start}>
            <Scene {...s} />
          </Sequence>
        );
      })}
      <Grade />
      {Object.entries(LINE_AT).map(([id, at]) => (
        <Sequence key={id} name={`voice ${id}`} from={at} durationInFrames={lineEnd(id) - at} layout="none">
          <Audio name={`voice ${id}`} src={staticFile(`voice/${id}.mix.wav`)} bus="voice" />
        </Sequence>
      ))}

    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="fingerprint-rawmix" component={Fingerprint} width={1920} height={1080} fps={FPS} durationInFrames={DURATION} />);
