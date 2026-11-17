// The tutorial's narration alone (no score, no foley), mastered as the soundtrack is: to tell what the fingerprint hears
// in the voice from what it hears in the music (the stems of compositions/tutsound.tsx; the score alone is its
// tutsound-score).
//   raea render compositions/tutsound-voice.tsx --composition tutsound-voice -o out/tut/sound/stem-voice.wav
import { AbsoluteFill, Composition, Mix, registerRoot } from "raea";
import { Soundtrack } from "../components/tut/sound";
import { FPS, SECONDS, fr } from "../components/tut/shots";

registerRoot(() => (
  <Composition id="tutsound-voice" width={1920} height={1080} fps={FPS} durationInFrames={fr(SECONDS)} component={() => (
    <>
      <AbsoluteFill style={{ background: "#000" }} />
      <Soundtrack only="voice" />
      <Mix lufs={-14} ceiling={-1.5} />
    </>
  )} />
));
