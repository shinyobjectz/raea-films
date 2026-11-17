// More seeds for the pluck roots no take passed (curate.py, 11-13: C5 and D#5 came out hissy or still ringing at the
// file's end). Rendered like thermal-instruments.tsx, then curate.py again.
import { AbsoluteFill, Composition, registerRoot } from "raea";
import * as Tone from "raea/tone";
import { INSTRUMENTS, noteName } from "./thermal/instruments";

const AGAIN: [keyof typeof INSTRUMENTS, number[]][] = [["pluck", [72, 75]]];
let at = 0;
for (const [name, midis] of AGAIN) {
  const inst = INSTRUMENTS[name];
  for (const seed of [4, 5, 6]) {
    const notes = midis.map(noteName);
    const s = new Tone.Sampler({ urls: Tone.tokensynth(inst.timbre, notes, { seconds: inst.seconds, seed }) }).connect(Tone.buses.music);
    for (const n of notes) { s.triggerAttackRelease(n, 0.5, at); at += 0.05; }
  }
}
Tone.getTransport().start();

registerRoot(() => <Composition id="thermal-reseed" width={320} height={180} fps={30} durationInFrames={Math.ceil((at + 3) * 30)} component={() => <AbsoluteFill style={{ background: "#000" }} />} />);
