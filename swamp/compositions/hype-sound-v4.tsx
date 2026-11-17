// The hype film's sound, v4: v3's sound to the share (real CC0 recordings on every action, swamp beds), the score
// now from frame 0 (a mysterious opening that swells at the Return and blooms on the pulse of light), then v4's ending:
// the ground shaking, cracking and blowing open, the beam charging, igniting and standing, the rise, the race up to
// the ship and the strike, the port, then silence but for the review room (its hum, the link's chime, the aliens'
// steps and seats, their murmur, the film, the wow, their voices), and the end: the robot's thruster and woosh past the
// lens, its sad warble, the horn theme home to the ship and the logo.
//
// The score is assets/audio/v4/score.wav (scripts/score_v4.py: a new opening to the agent, v2's score note for note
// to frame 1500, then the ending re-timed to v4, played by the same sampled instruments). The new effects are
// assets/audio/v4/fx (scripts/sfx_build_v4.py, sources in assets/audio/v4/SOURCES.md); v3's are reused where they
// still fit, every frame T-relative. Rendered to a WAV by `raea render ... --composition sound`.
import { Audio, Composition, Mix, Sequence, interpolate, registerRoot, staticFile } from "raea";
import { END, SIT, STEP, STEPS, T, WALK } from "../components/timeline";

type Cue = { at: number; src: string; db: number | ((f: number) => number); len?: number; from?: number; fadeIn?: number; fadeOut?: number };
const cues: Cue[] = [];
const r = (n: string) => staticFile(`audio/real/${n}.wav`);
const x = (n: string) => staticFile(`audio/v3/fx/${n}.wav`);
const y = (n: string) => staticFile(`audio/v4/fx/${n}.wav`);
const cue = (at: number, src: string, db: Cue["db"], o: Partial<Cue> = {}) => cues.push({ at, src: r(src), db, ...o });
const fx = (at: number, src: string, db: Cue["db"], o: Partial<Cue> = {}) => cues.push({ at, src: x(src), db, ...o });
const fx4 = (at: number, src: string, db: Cue["db"], o: Partial<Cue> = {}) => cues.push({ at, src: y(src), db, ...o });
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---- the score, from the first frame (none from the arrival to the end in space)
// The opening is written quiet (a dead swamp), so it's lifted: 6 dB over v3's level to the typing, easing down through
// the Return's swell to v3's level as it blooms on the pulse (T.pulse); v3's level for the theme; the ending's orchestra
// 3.5 dB under it from the tremor (4.5 from the crack to the orbit), and 1.5 dB further under through the strike and
// the port; 2 dB under it at the end in space, so the horn theme carries over the robot's thruster, woosh and warble.
const scoreLift = (m: number) =>
  interpolate(m, [0, 400, T.returnHit - 12, T.pulse, T.pulse + 34, T.tremor, T.tremor + 6, T.end - 1, T.end], [5, 5, 4, 1, -1, -1, -4.5, -4.5, -3], clamp) -
  // 1 dB more under the ground opening, the beam and the rise, so the effects carry them without pinning the limiter
  interpolate(m, [T.crack - 4, T.crack + 4, T.orbit - 8, T.orbit], [0, 1, 1, 0], clamp);
// 2 dB under while the ravens flee the trees (15-leaves), so their wings and croaks carry over the canopy's swell
const birdDip = (m: number) => interpolate(m, [894, 899, 926, 950], [0, 2, 2, 0], clamp);
const strikeDip = (m: number) => 1.5 * Math.min(1, Math.max(0, (m - (T.strike - 40)) / 20)) * Math.min(1, Math.max(0, (T.arrive + 10 - m) / 10));
cues.push({ at: 0, src: staticFile("audio/v4/score.wav"), db: (m) => scoreLift(m) - strikeDip(m) - birdDip(m) });

// ---- beds: the dead swamp; the living one from the sunrise, with birds; mist; dusk crickets and frogs
cue(0, "bed-dead", -7, { len: 820, fadeIn: 0.2, fadeOut: 2.5 });
cue(60, "crow", -20);
cue(T.sunFrom + 10, "bed-alive", -9, { len: 600, fadeIn: 2, fadeOut: 2 });
cue(T.sunFrom + 20, "birds", -15, { len: T.scrubFrom - T.sunFrom - 10, fadeIn: 1.5, fadeOut: 1.2 });
cue(T.v2, "lap", -18, { len: 110, fadeIn: 1.2, fadeOut: 1.5 });
cue(T.v2 + 6, "gust", -20, { fadeOut: 1 });
// the dusk swamp holds to the tremor, then hushes as the ground shakes and is left below as the camera climbs the beam
const DUSK = T.scrubTo - 30;
const hush = (base: number, at: number) => (m: number) => base - Math.min(10, Math.max(0, at + m - (T.tremor + 6)) / 3);
cue(DUSK, "bed-dusk", hush(-9, DUSK), { len: T.rise + 28 - DUSK, fadeIn: 1, fadeOut: 0.9 });
cue(T.scrubTo, "shimmer", hush(-17, T.scrubTo), { len: T.rise + 20 - T.scrubTo, fadeIn: 2, fadeOut: 0.9 });

// ---- the robot and the keys
cue(22, "servo", -17);
cue(T.wakeBump - 1, "key", -11);
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
// a fish out of the water and back in (13-water; components/fish.tsx: close, a little right of centre)
fx4(T.fishOut, "fish-out", -12);
fx4(T.fishIn - 2, "fish-in", -13); // its splash is 0.08 s in
// the ravens the leaves scare out of the trees (15-leaves; components/birds.tsx): the flock's take-off from 898, the
// close pair's pass at 0.9 s, their croaks; it trails into the next shot as they go
fx4(897, "birds-flee", -1);
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
cue(T.scrubTo - 2, "gust", -9, { len: T.scrubTo - T.scrubFrom + 2, fadeOut: 0.04 });

// ---- dusk: the loop, Play, frogs and crickets while it plays; the robot comes back to the glass
cue(T.scrubTo + 4, "swish", -14);
cue(T.scrubTo + 18, "tap", -16);
[1362, 1408, 1440, 1488].forEach((at, i) => cue(at, ["frog", "frog-3", "frog-2", "frog"][i], -18));
[1380, 1430, 1500].forEach((at) => cue(at, "cricket", -22));
cue(T.back - 20, "servo-2", -19);

// ---- the send: Share, the title typed, Create link; sent like a pebble into the water
cue(T.shareHover, "tick", -19);
cue(T.share, "tap", -13);
cue(T.titleFocus, "tap-2", -15);
cue(T.titleFrom, "typing", -17, { len: T.titleTo - T.titleFrom + 4, fadeOut: 0.06 });
cue(T.createHover, "tick", -19);
cue(T.create, "tap", -12);
cue(T.create + 3, "drop", -15);

// ---- the ground opens at the monitor's foot: it shakes (the keys rattle, grit trickles, the water shivers), cracks
// with light sizzling out, groans, and blows open; chunks land all round and in the water, and the debris settles
fx4(T.tremor, "ground-tremor", -12);
cue(T.tremor + 6, "wash", -20, { fadeIn: 0.6, fadeOut: 0.5 });
fx4(T.crack, "ground-crack", -10);
fx4(T.blast, "ground-blast", -9.5);
cue(T.blast + 10, "splash", -12);
cue(T.blast + 14, "wash", -14, { fadeOut: 0.5 });
fx(T.blast + 6, "mud", -12, { len: 60, fadeOut: 0.8 });

// ---- the beam: its charge rising out of the pit into the ignition, then its hum standing, climbing from the rise
fx4(T.blast + 4, "beam-ignite", -9.5); // its hit is 0.533 s in, on T.beam
fx4(T.beam, "beam-sustain", -16.5, { len: T.orbit - T.beam, fadeOut: 0.03 });

// ---- up the beam: through the canopy's leaves, into the cloud's rushing air, white, then the quiet of space
fx(T.rise - 4, "canopy", -7);
fx(T.rise + 16, "wind-rise", -9, { len: T.orbit - (T.rise + 16) });

// ---- space: the ship's drone, the beam's head racing up to the port, the strike, the push into the port, cut dead
// into the white
fx(T.orbit, "ship-drone", -13, { from: 45, len: T.arrive - T.orbit, fadeIn: 0.15, fadeOut: 0.03 });
fx4(T.orbit, "beam-race", -13, { len: T.strike - T.orbit });
fx(T.strike, "strike", -7, { len: T.arrive - T.strike, fadeOut: 0.03 });
fx(T.port, "port-rush", -10, { len: T.arrive - T.port });

// ---- the review room, no score: its hum from the white; the link chimes on the screen; they walk in and sit (each step
// and seat from its own side, timeline WALK); their murmur builds into the film on the screen; the wow; the murmur
// after; their voices; the alien typing; the note posting; then the room's hum alone under the caption
fx4(T.arrive, "room-tone-v4", -12, { len: T.end - T.arrive, fadeIn: 0.2, fadeOut: 0.03 });
fx4(T.linkIn, "link-chime", -17);
fx4(T.arrive, "alien-steps", -9); // its steps at WALK[i].from + s * STEP, the seats STEPS-1 steps on, + SIT
const SAT = Math.max(...WALK.map((w) => w.from + (STEPS - 1) * STEP + SIT));
fx(SAT - 40, "murmur", (m) => -26 + 10 * Math.min(1, m / (T.room - (SAT - 40))), { len: T.roomPlay + 10 - (SAT - 40), fadeIn: 1, fadeOut: 0.4 });
fx(T.roomPlay, "film-room", -12, { len: T.hands + 10 - T.roomPlay, fadeOut: 0.6 });
fx(T.wow - 3, "wow", -6, { len: T.wow + 40 - (T.wow - 3), fadeOut: 0.7 }); // its onset is 0.1 s in; it gives way to their talk
fx(T.wow + 30, "murmur", -20, { from: 60, len: T.hands + 10 - (T.wow + 30), fadeIn: 0.5, fadeOut: 0.6 });
// their own voices (scripts/alien_voice_v3.py, re-timed by components/room-voice.ts): the room talking over each other
// after the wow, each from where its head sits; the typist reading its note under its breath, the keys on its
// syllables; and one of them, unsure, as the note posts, before the quiet under the subtitle
fx(T.wow + 22, "alien-chatter", -7, { fadeOut: 0.3 });
fx(T.alienFrom - 4, "alien-mutter", -13);
fx(T.alienFrom - 4, "alien-keys", -8); // 2 dB under v3: a key at 2183 sat at the limiter and overshot after AAC
fx(T.notePost, "note-post", -19);
fx(T.notePost + 3, "alien-hmm", -11);

// ---- the end: space again, the ship's drone, the robot's thruster past the lens (closest at T.pass) with a woosh, its
// sad warble as it turns away, and home to the ship
fx(T.end, "ship-drone", -14, { from: 45, len: END - T.end, fadeIn: 0.6, fadeOut: 1.0 });
fx4(T.end, "thruster-v4", -7);
fx4(T.pass - 30, "robot-woosh", -8); // its peak is 1.00 s in, on T.pass
fx4(T.sad, "droid-sad", -17);

cues.sort((a, b) => a.at - b.at);
function Sound() {
  return (
    <>
      {cues.map((c, i) => (
        <Sequence key={i} from={c.at} durationInFrames={c.len} layout="none" name={`cue-${i}`}>
          <Audio src={c.src} gainDb={c.db} startFrom={c.from} fadeIn={c.fadeIn} fadeOut={c.fadeOut} />
        </Sequence>
      ))}
      {/* raea's limiter trims this mix's transients (the crack, the strike, the typing) by about 0.3 LU after it sets the
          gain, so it's aimed 0.3 over: measured with ffmpeg's ebur128 it comes out at -14 LUFS */}
      <Mix lufs={-13.7} ceiling={-1.5} />
    </>
  );
}
registerRoot(() => <Composition id="sound" component={Sound} width={320} height={180} fps={30} durationInFrames={END} />);
