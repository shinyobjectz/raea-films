// Goose Learns raea, the soundtrack: the narrator, the swamp, the foley and the end song (components/tut/sound.tsx) over
// the score (components/tut/score.ts), mastered to -14 LUFS. Rendered to out/tut/sound/tutsound.wav and muxed under the
// picture by tools/tutfilm.sh --join.
//
//   raea render compositions/tutsound.tsx --composition tutsound -o out/tut/sound/tutsound.wav
//   tutsound-score: the score alone, unmastered and unducked, to measure it against the narration
import { AbsoluteFill, Composition, Mix, registerRoot } from "raea";
// the score builds its Tone graph when imported (a bare `import "./score"` isn't bundled, so a name is taken from it)
import { SCORE_NOTES } from "../components/tut/score";
import { Soundtrack } from "../components/tut/sound";
import { FPS, SECONDS, fr } from "../components/tut/shots";

const Black = () => <AbsoluteFill name={`score-${SCORE_NOTES}-notes`} style={{ background: "#000" }} />;

registerRoot(() => (
  <>
    <Composition id="tutsound" width={1920} height={1080} fps={FPS} durationInFrames={fr(SECONDS)} component={() => (
      <>
        <Black />
        <Soundtrack />
        <Mix lufs={-14} ceiling={-1.5} />
      </>
    )} />
    <Composition id="tutsound-score" width={1920} height={1080} fps={FPS} durationInFrames={fr(SECONDS)} component={Black} />
  </>
));
