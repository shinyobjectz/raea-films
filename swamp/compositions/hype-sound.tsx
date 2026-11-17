// The hype film's sound, alone: swamp beds, foley on each action, a rhythm made of the swamp's own sounds that builds
// from the first task to the scrub and stops dead on its release, a chord under the dusk. Rendered to a WAV and
// joined to the picture by scripts/render_film.sh. All of it was made on this computer (scripts/sound.sh).
import { Audio, Composition, Mix, Sequence, registerRoot, staticFile } from "raea";
import { END, T } from "../components/timeline";

const a = (n: string) => staticFile(`audio/${n}.wav`);
type Cue = { at: number; src: string; db: number; len?: number; fadeIn?: number; fadeOut?: number };
const cues: Cue[] = [];
const cue = (at: number, src: string, db: number, o: Partial<Cue> = {}) => cues.push({ at, src: a(src), db, ...o });

// beds, tiled with crossfades: the dead swamp, the living one from the sunrise, the dusk
for (const at of [0, 300, 600]) cue(at, "bed-dead", -9, { len: 345, fadeIn: at ? 1.5 : 0.3, fadeOut: 1.5 });
for (const at of [770, 1070]) cue(at, "bed-alive", at === 770 ? -13 : -10, { len: at === 770 ? 345 : 150, fadeIn: 1.5, fadeOut: 1.5 });
cue(775, "birds", -11, { fadeIn: 0.8, fadeOut: 1.5 });
cue(1046, "birds", -13, { len: 150, fadeIn: 0.8, fadeOut: 1.5 });
cue(1180, "bed-dusk", -11, { len: 240, fadeIn: 1.5, fadeOut: 1.5 });
cue(1385, "bed-dusk", -11, { len: END - 1385, fadeIn: 1.5, fadeOut: 2 });

// the robot and the keys
cue(22, "chirp", -7);
cue(T.wakeBump - 1, "key", -8);
cue(T.wakeBump + 1, "pebble", -12);
cue(T.wake, "wake", -10, { fadeOut: 0.6 });
cue(255, "chirp", -10);
for (const at of [T.newTap, T.made, 364]) cue(at, "tap", -9);
[328, 332, 336, 340, 344].forEach((at) => cue(at, "key", -13));
cue(T.typeFrom, "typing", -5, { len: T.typeTo - T.typeFrom + 6, fadeOut: 0.05 });
cue(T.returnHit - 1, "slam", -4);

// the agent's tasks: a drip each
[608, 628, 638, 646].forEach((at, i) => cue(at, "drip", -14 + i));
for (const at of [T.task0, 618, T.card, T.controls]) cue(at, "tap", -10);

// the four controls
cue(T.sunFrom - 2, "glass", -13, { fadeOut: 0.4 });
cue(T.pick, "drop", -6);
cue(T.pick + 5, "wash", -7, { fadeOut: 0.5 });
cue(T.growFrom - 2, "creak", -7, { fadeOut: 0.3 });
cue(1040, "leaves", -8, { fadeOut: 0.8 });
for (const at of [1084, T.open]) cue(at, "tap", -10);
cue(T.scrubFrom - 2, "scrub", -7, { len: T.scrubTo - T.scrubFrom + 2, fadeOut: 0.02 });

// the rhythm: a low thump on the beat (20 frames: 90 a minute) from the agent's first step, frogs between from the
// water, crickets on the halves from the leaves; it doubles through the scrub and stops dead on the release
for (let f = T.agent; f < T.scrubFrom; f += 20) cue(f, "thump", -17 + 8 * Math.min(1, (f - T.agent) / 450));
for (let f = 915; f < T.scrubFrom; f += 40) cue(f + 10, "frog", -12);
for (let f = 1045; f < T.scrubFrom; f += 10) cue(f + 5, "cricket", -15);
for (let f = T.scrubFrom, step = 10; f < T.scrubTo - 2; f += step, step = Math.max(4, step - 1)) {
  cue(f, "thump", -13);
  cue(f + 2, "cricket", -13);
}

// the dusk: one warm chord, bells where the fireflies light, a last chirp from the bezel
["C3", "G3", "E4", "B4", "D5"].forEach((n, i) => cues.push({ at: T.scrubTo + 2 + i * 3, src: staticFile(`audio/pad/${n}.wav`), db: -20, fadeIn: 0.5, fadeOut: 3.5 }));
cue(1206, "tap", -10);
cue(1212, "chirp", -10);
cue(1204, "bells", -25, { fadeIn: 0.5, fadeOut: 1.5 });
cue(1445, "chirp", -8);

cues.sort((x, y) => x.at - y.at);
function Sound() {
  return (
    <>
      {cues.map((c, i) => (
        <Sequence key={i} from={c.at} durationInFrames={c.len} layout="none" name={`cue-${i}`}>
          <Audio src={c.src} gainDb={c.db} fadeIn={c.fadeIn} fadeOut={c.fadeOut} />
        </Sequence>
      ))}
      <Mix lufs={-14} ceiling={-1.5} />
    </>
  );
}
registerRoot(() => <Composition id="sound" component={Sound} width={320} height={180} fps={30} durationInFrames={END} />);
