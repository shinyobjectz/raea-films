// Fingerprint v2's sound alone: the narration, the score and the foley, mastered. The picture is rendered a frame a
// process (tools/film.sh), so the sound is rendered here and joined to it.
// Run: raea render fingerprint2-audio.tsx -o out/fingerprint2-mix.wav   (RAW=1 in the id "…-raw" leaves the master off)
import { AbsoluteFill, Audio, Composition, Mix, Sequence, registerRoot, staticFile } from "raea";
import "./v2/score";
import { DURATION, FPS, LINES, LINE_AT, lineEnd } from "./v2/time";

const Sound = ({ master }: { master: boolean }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    {LINES.map((l) => (
      <Sequence key={l.id} from={Math.round(LINE_AT[l.id] * FPS)} durationInFrames={Math.round((lineEnd(l.id) - LINE_AT[l.id]) * FPS)} layout="none">
        <Audio src={staticFile(`voice2/${l.id}.mix.wav`)} bus="voice" />
      </Sequence>
    ))}
    {master ? <Mix lufs={-14} ceiling={-1.5} /> : null}
  </AbsoluteFill>
);
registerRoot(() => (
  <>
    <Composition id="fingerprint2-audio" width={320} height={180} fps={FPS} durationInFrames={DURATION} component={() => <Sound master />} />
    <Composition id="fingerprint2-raw" width={320} height={180} fps={FPS} durationInFrames={DURATION} component={() => <Sound master={false} />} />
  </>
));
