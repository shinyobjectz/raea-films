// The thermal film's TokenSynth instruments as candidates (raea guide music, "build a library, don't trust a take"):
// each timbre's roots every 3 semitones over the range it plays, three seeds, every root played once through a Sampler
// so each take is rendered into assets/. Then: uv run --with numpy --with soundfile python3 -I
// ~/raea/tools/tokensynth/curate.py . --out thermal/instruments.gen.json  (the score builds its Samplers from that).
// The instruments are thermal/instruments.ts; a root no seed passes gets more in thermal-reseed.tsx.
import { AbsoluteFill, Composition, registerRoot } from "raea";
import * as Tone from "raea/tone";
import { INSTRUMENTS, SEEDS, noteName, roots } from "./thermal/instruments";

let at = 0;
for (const inst of Object.values(INSTRUMENTS)) {
  for (const seed of SEEDS) {
    const notes = roots(inst.lo, inst.hi).map(noteName);
    const s = new Tone.Sampler({ urls: Tone.tokensynth(inst.timbre, notes, { seconds: inst.seconds, seed }) }).connect(Tone.buses.music);
    for (const n of notes) { s.triggerAttackRelease(n, 0.5, at); at += 0.05; }
  }
}
Tone.getTransport().start();

registerRoot(() => <Composition id="thermal-instruments" width={320} height={180} fps={30} durationInFrames={Math.ceil((at + 5) * 30)} component={() => <AbsoluteFill style={{ background: "#000" }} />} />);
