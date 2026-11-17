// The hype film's sound, v2: real recordings (CC0 field and foley, assets/audio/real, cut by scripts/sfx_build.py) on
// every action, swamp beds that change with the world, and the score (assets/audio/score.wav: composed as MIDI in
// scripts/score.py and played by sampled strings, horn, harp, piano and timpani). The score keeps out until the
// prompt is sent; the swamp has the first and the last word. Rendered to a WAV and joined to the picture by
// scripts/render_film.sh.
import { Audio, Composition, Mix, Sequence, registerRoot, staticFile } from "raea";
import { END, T } from "../components/timeline";

const r = (n: string) => staticFile(`audio/real/${n}.wav`);
type Cue = { at: number; src: string; db: number; len?: number; fadeIn?: number; fadeOut?: number };
const cues: Cue[] = [];
const cue = (at: number, src: string, db: number, o: Partial<Cue> = {}) => cues.push({ at, src: r(src), db, ...o });

// ---- the score, from the first frame (it is silent until the prompt is sent)
cues.push({ at: 0, src: staticFile("audio/score.wav"), db: -1 });

// ---- beds: the dead swamp; the living one from the sunrise, with birds; mist; dusk crickets and frogs
cue(0, "bed-dead", -7, { len: 820, fadeIn: 0.2, fadeOut: 2.5 });
cue(60, "crow", -20);
cue(T.sunFrom + 10, "bed-alive", -9, { len: 600, fadeIn: 2, fadeOut: 2 });
cue(T.sunFrom + 20, "birds", -15, { len: T.scrubFrom - T.sunFrom - 10, fadeIn: 1.5, fadeOut: 1.2 });
cue(T.v2, "lap", -18, { len: 110, fadeIn: 1.2, fadeOut: 1.5 });
cue(T.v2 + 6, "gust", -20, { fadeOut: 1 });
cue(T.scrubTo - 30, "bed-dusk", -9, { len: END - T.scrubTo + 30, fadeIn: 1, fadeOut: 2.5 });
cue(T.scrubTo, "shimmer", -17, { len: END - T.scrubTo, fadeIn: 2, fadeOut: 2.5 });

// ---- the robot and the keys
cue(22, "servo", -17);
cue(T.wakeBump - 1, "key", -9);
cue(T.wakeBump + 1, "pebble", -16);
cue(T.wake, "wake", -11, { fadeOut: 0.5 });
cue(252, "servo-2", -19);
cue(T.newTap, "tap", -13);
[328, 332, 336, 340, 344].forEach((at, i) => cue(at, i % 2 ? "key" : "key-2", -17));
cue(T.made, "tick", -15);
cue(364, "tap-2", -15);
cue(T.typeFrom, "typing", -10, { len: T.typeTo - T.typeFrom + 6, fadeOut: 0.08 });
cue(T.returnHit - 1, "slam", -5);
cue(T.returnHit + 1, "splash", -13);

// ---- the agent's tasks: a drip each, the panel's tabs a tap
[608, 628, 638, 646].forEach((at, i) => cue(at, `drip-${i}`, -19));
for (const at of [T.task0, 618, T.card, T.controls]) cue(at, "tick", -18);

// ---- the three controls
cue(T.sunFrom, "servo-3", -20);
cue(T.pick, "drop", -9);
cue(T.pick + 6, "wash", -13, { fadeOut: 0.5 });
cue(T.growFrom - 2, "creak", -11, { fadeOut: 0.3 });
cue(896, "leaves", -11, { fadeOut: 0.8 });
for (let at = 850; at < T.scrubFrom; at += 70) cue(at, ["frog", "frog-2", "frog-3"][(at / 70) % 3 | 0], -21);
for (const at of [941, T.open]) cue(at, "tick", -18);

// ---- the note: a pin, its words, a loop drawn round the water, posted, sent; the answer; the two versions compared
cue(T.pin - 12, "tick", -19);
cue(T.pin, "tap", -14);
cue(T.noteFrom, "typing", -17, { len: T.noteTo - T.noteFrom + 4, fadeOut: 0.06 });
cue(T.drawFrom - 8, "tick", -19);
cue(T.drawFrom, "marker", -10, { len: T.drawTo - T.drawFrom + 2, fadeOut: 0.12 });
cue(T.field, "tap-2", -17);
cue(T.posted, "drip-2", -19);
cue(T.send, "tap", -12);
cue(T.working, "drip-1", -20);
cue(T.v2, "drop", -15);
cue(T.cardOpen, "tick", -18);
cue(T.compare, "tick", -18);
cue(T.wipeFrom, "reeds", -16, { len: T.wipeTo - T.wipeFrom + 8, fadeOut: 0.4 });

// ---- the scrub: day to dusk in two seconds, a rush that stops dead on the release
cue(T.scrubFrom - 2, "gust", -9, { len: T.scrubTo - T.scrubFrom + 2, fadeOut: 0.04 });

// ---- dusk: the loop, Play, frogs, the robot sitting down
cue(T.scrubTo + 4, "swish", -14);
cue(T.scrubTo + 18, "tap", -16);
[1362, 1408, 1452, 1520].forEach((at, i) => cue(at, ["frog", "frog-3", "frog-2", "frog"][i], -18));
[1380, 1430, 1500].forEach((at) => cue(at, "cricket", -22));
cue(T.seat - 18, "servo-2", -18);

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
