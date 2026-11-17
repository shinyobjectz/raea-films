// The hype film's sound, v3: v2's sound to the dusk (real CC0 recordings on every action, swamp beds, the score),
// then the new ending: the send, the crack and the beam, the rise, space and the strike, the port, the review room
// (its hum, its audience, the film on its screen, their wow), the alien typing and the note in a held quiet, and
// the robot's thruster past the lens home to the ship.
//
// The score is assets/audio/v3/score.wav (scripts/score_v3.py: v2's score note for note to frame 1500, then the
// ending, played by the same sampled instruments). The ending's effects are assets/audio/v3/fx (scripts/sfx_build_v3.py,
// sources in assets/audio/v3/SOURCES.md). Rendered to a WAV by `raea render ... --composition sound`.
import { Audio, Composition, Mix, Sequence, registerRoot, staticFile } from "raea";
import { END, T } from "../components/timeline";

type Cue = { at: number; src: string; db: number | ((f: number) => number); len?: number; from?: number; fadeIn?: number; fadeOut?: number };
const cues: Cue[] = [];
const r = (n: string) => staticFile(`audio/real/${n}.wav`);
const x = (n: string) => staticFile(`audio/v3/fx/${n}.wav`);
const cue = (at: number, src: string, db: Cue["db"], o: Partial<Cue> = {}) => cues.push({ at, src: r(src), db, ...o });
const fx = (at: number, src: string, db: Cue["db"], o: Partial<Cue> = {}) => cues.push({ at, src: x(src), db, ...o });

// ---- the score, from the first frame (silent until the prompt is sent; no score in the review room)
// (v2's level to the dusk; the ending's orchestra 3.5 dB under it, so the space shots don't outshout the film's climax)
// (and 1.5 dB further under through the strike and the port, where its drums met the strike in the limiter)
const scoreDb = (m: number) => (m < 1518 ? -1 : m < 1524 ? -1 - (3.5 * (m - 1518)) / 6 : -4.5 - 1.5 * Math.min(1, Math.max(0, (m - (T.strike - 40)) / 20)) * Math.min(1, Math.max(0, (T.room + 10 - m) / 10)));
cues.push({ at: 0, src: staticFile("audio/v3/score.wav"), db: scoreDb });

// ---- beds: the dead swamp; the living one from the sunrise, with birds; mist; dusk crickets and frogs
cue(0, "bed-dead", -7, { len: 820, fadeIn: 0.2, fadeOut: 2.5 });
cue(60, "crow", -20);
cue(T.sunFrom + 10, "bed-alive", -9, { len: 600, fadeIn: 2, fadeOut: 2 });
cue(T.sunFrom + 20, "birds", -15, { len: T.scrubFrom - T.sunFrom - 10, fadeIn: 1.5, fadeOut: 1.2 });
cue(T.v2, "lap", -18, { len: 110, fadeIn: 1.2, fadeOut: 1.5 });
cue(T.v2 + 6, "gust", -20, { fadeOut: 1 });
// the dusk swamp holds to the crack, then hushes as the ground opens and is left below as the camera climbs the beam
const DUSK = T.scrubTo - 30;
const hush = (base: number, at: number) => (m: number) => base - Math.min(10, Math.max(0, at + m - T.crack) / 3);
cue(DUSK, "bed-dusk", hush(-9, DUSK), { len: 1608 - DUSK, fadeIn: 1, fadeOut: 0.9 });
cue(T.scrubTo, "shimmer", hush(-17, T.scrubTo), { len: 1600 - T.scrubTo, fadeIn: 2, fadeOut: 0.9 });

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

// ---- the crack at the monitor's foot, the water stirred, the beam standing up out of the ground
fx(T.crack, "crack", -7, { len: T.orbit - T.crack, fadeOut: 0.5 });
cue(T.crack + 3, "splash", -12);
cue(T.crack + 8, "wash", -14, { fadeOut: 0.5 });
fx(T.crack + 6, "mud", -12, { len: 60, fadeOut: 0.8 });
fx(T.beam - 15, "beam-up", -8); // its hit is 0.5 s in
fx(T.beam, "beam-hum", -13, { len: T.orbit - T.beam });

// ---- up the beam: through the canopy's leaves, into the cloud's rushing air, white, then the quiet of space
fx(T.rise - 4, "canopy", -7);
fx(1596, "wind-rise", -9, { len: T.orbit - 1596 });

// ---- space: the ship's drone, the beam's tip climbing to the port, the strike, the push into the port, white, cut
fx(T.orbit, "ship-drone", -13, { from: 45, len: T.room - T.orbit, fadeIn: 0.15, fadeOut: 0.03 });
fx(T.orbit, "beam-climb", -12, { len: T.strike - T.orbit });
fx(T.strike, "strike", -7, { len: T.room - T.strike, fadeOut: 0.03 }); // cut dead with the white
fx(T.port, "port-rush", -10, { len: T.room - T.port });

// ---- the review room: its hum; the audience murmuring, hushed as the film plays; the film from the screen; the wow;
// the murmur after; the alien typing; the note posting; then the room's hum alone under the caption
fx(T.room, "room-tone", -12, { len: T.end - T.room, fadeOut: 0.03 });
fx(T.room, "murmur", -16, { len: T.roomPlay - T.room + 10, fadeOut: 0.4 });
fx(T.roomPlay, "film-room", -12, { len: 1990 - T.roomPlay, fadeOut: 0.6 });
fx(T.wow - 3, "wow", -6, { len: 1952 - (T.wow - 3), fadeOut: 0.7 }); // its onset is 0.1 s in; it gives way to their talk
fx(T.wow + 30, "murmur", -20, { from: 60, len: 1990 - (T.wow + 30), fadeIn: 0.5, fadeOut: 0.6 });
// their own voices (scripts/alien_voice_v3.py: a language cut from real speech): the room talking over each other after
// the wow, each from where its head sits; the typist reading its note under its breath, the keys on its syllables; and
// one of them, unsure, as the note posts, before the quiet under the subtitle
fx(T.wow + 22, "alien-chatter", -7, { fadeOut: 0.3 });
fx(T.alienFrom - 4, "alien-mutter", -13);
fx(T.alienFrom - 4, "alien-keys", -6);
fx(T.notePost, "note-post", -19);
fx(T.notePost + 3, "alien-hmm", -11);

// ---- the end: space again, the ship's drone, the robot's thruster past the lens and home to the ship
fx(T.end, "ship-drone", -14, { from: 45, len: END - T.end, fadeIn: 0.6, fadeOut: 1.0 });
fx(T.end, "thruster-pass", -7);

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
