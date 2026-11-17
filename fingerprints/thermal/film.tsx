// Fingerprint, in thermal: the film for X (16:9, under X's 2:20). v2, after the director's note on v1 (11-13: "the VO is
// too deep and slow ... more motion graphics, less stock footage ... for every stock footage we also have something
// tracing the scene with da3 or moge and then interacts somehow with the physical objects"):
//   - the narrator is Fish's Adrian at 1.1x (tools/voice-thermal.ts), 107 s where v1 ran 139 s;
//   - half the lines are motion graphics drawn in heat (thermal/mograph.tsx): clips that warm and fall away, A and B,
//     a new cut's marks, what the agent is handed, fixed / still there / disguised;
//   - every stock shot is traced from its own depth (DA3-BASE on this Mac, tools/depth.py, thermal/depth.ts): a scan
//     plane wraps the real surfaces, contours and outlines stay behind it, and a ring spreads from the thing touched
//     (a fingertip, a thumb, a pen, a lens, an ear cup) across the hand, the face, the room in 3D.
// A score of MIDI on TokenSynth instruments (thermal/score.ts, no drones) and marks in a thin white HUD, words never
// scores. Every cut, ring and mark is timed from the narration's words (thermal/time.ts). The palette follows the
// line: flare for type and touch, black and white where it is private, ice for listening, ember for approval, jet
// for the marks.
// Render: tools/thermal-film.sh (frames to out/thermal-film/, then ffmpeg with the mixed sound).
import { AbsoluteFill, Audio, Mix, Sequence, staticFile } from "raea";
import { Box, Tag, Ticks } from "./marks";
import { Agent, Check, Events, Marks, Pick, Stack, Warm, Words } from "./mograph";
import { ClipShot, FPS, TypeShot } from "./shots";
import { BEAT, DURATION, LINES, START, ends, said } from "./time";

const F = (s: number) => Math.round(s * FPS);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { const k = clamp01(x); return k * k * (3 - 2 * k); };
/** a shot: when it starts, and what it draws given its start and length (seconds) */
type Shot = { at: number; el: (from: number, span: number) => React.ReactNode };
/** a word's frame inside the shot that starts at `from` */
const rel = (t: number, from: number) => F(t - from);
/** a pixel of the frame from a fraction across and down */
const P = (u: number, v: number) => ({ x: Math.round(u * 1920), y: Math.round(v * 1080) });

// the trace's moves, in frames of the shot
/** the scan plane sweeping from the nearest surface to the farthest over [a, b] */
const scan = (f: number, a: number, b: number) => (f < a ? 2 : 1.05 - 1.2 * ease((f - a) / (b - a)));
/** a ring spreading from [u, v] from frame a, out to `reach` over `dur` frames, fading as it goes */
const ring = (f: number, u: number, v: number, a: number, dur: number, reach = 1): [number, number, number, number] => {
  const k = clamp01((f - a) / dur);
  return [u, v, 0.03 + reach * ease(k) , f < a ? 0 : 1.2 * (1 - k)];
};

/** what a fingerprint stands on (docs/fingerprint.md "The stack"): each frozen model, by name and what it does for
 * it, as the stack shows them (04f, 11a) */
const MODELS: [string][] = [["Depth Anything 3 · how far"], ["EmbeddingGemma · reads"], ["YAMNet · what happens"], ["CLAP · how it sounds"], ["SigLIP 2 · sees"]];

export const SHOTS: Shot[] = [
  { at: 0, el: () => <TypeShot text="Every editor has a touch." id="t-open" span={F(START["02"])} /> },
  // the cuts you warm to / the notes you leave / the takes you throw away
  { at: START["02"], el: (from, span) => <Warm warm={rel(said("02", "warm"), from)} notes={rel(said("02", "notes"), from)} takes={rel(said("02", "takes"), from)} away={rel(said("02", "throw"), from)} span={F(span)} /> },
  // Fingerprint learns that touch: the hand traced, a ring from the fingertip on "touch"
  { at: START["03"], el: (from, span) => (
    <ClipShot name="sunset" at={6} span={span} trace={(f) => ({ scan: scan(f, 6, rel(said("03", "touch"), from)), contours: 0.55, outline: 0.9, density: 28, ripple: ring(f, 0.47, 0.08, rel(said("03", "touch"), from), 70, 0.95) })}>
      <Tag {...P(0.45, 0.62)} dx={260} dy={-200} text="your eye, written down" at={rel(said("03", "written"), from)} />
    </ClipShot>
  ) },
  // it runs on your computer, and it learns there
  { at: START["04"], el: (from, span) => (
    <ClipShot name="night" palette="mono" span={span} trace={(f) => ({ scan: scan(f, 0, 40), contours: 0.4, outline: 0.8, density: 14, ripple: ring(f, 0.34, 0.33, rel(said("04", "learns"), from), 40, 0.7) })}>
      <Tag {...P(0.53, 0.32)} dx={240} dy={-140} text="on this machine" at={rel(said("04", "computer"), from)} />
    </ClipShot>
  ) },
  // v3 (the director, 11-13: "educational about what we are doing and the models and systems underneath without being
  // technical"): underneath, models that already understand pictures, sound and words
  { at: START["04a"], el: (from, span) => <Stack blocks={[["pictures", rel(said("04a", "pictures"), from)], ["sound", rel(said("04a", "sound"), from)], ["words", rel(said("04a", "words"), from)]]} rise={[8, 30, 52]} span={F(span)} /> },
  // one sees, four frames every second (a ring from the pupil, the frames ticking off) ...
  { at: START["04b"], el: (from, span) => (
    <ClipShot name="eye" palette="ice" span={span} trace={(f) => ({ scan: scan(f, 0, 30), contours: 0.25, outline: 0.6, density: 10, ripple: ring(f, 0.52, 0.55, 8, 40, 0.5) })}>
      <Tag {...P(0.52, 0.55)} dx={260} dy={-300} text="SigLIP 2 · sees" at={rel(said("04b", "one"), from) + 6} solid />
      <Ticks at={rel(said("04b", "four"), from)} label="four frames every second" />
    </ClipShot>
  ) },
  // ... and what's in each: the glasses, an eye, a screen, named on the frame
  { at: said("04b", "and") - 0.15, el: (from, span) => (
    <ClipShot name="glasses" at={14.4} palette="ice" span={span} trace={(f) => ({ contours: 0.3, outline: 0.85, density: 12, scan: scan(f, 0, 24) })}>
      <Tag {...P(0.38, 0.38)} dx={-200} dy={-200} text="an eye" at={rel(said("04b", "what's"), from)} />
      <Tag {...P(0.77, 0.55)} dx={120} dy={-330} text="a screen" at={rel(said("04b", "in"), from)} />
      <Tag {...P(0.6, 0.3)} dx={40} dy={-150} text="glasses" at={rel(said("04b", "each"), from)} />
    </ClipShot>
  ) },
  // two listen: how it sounds (CLAP) and what happens (YAMNet): waves from the ear cup ...
  { at: START["04c"], el: (from, span) => (
    <ClipShot name="phones" palette="ice" span={span} trace={(f) => ({ contours: 0.3, outline: 0.7, density: 12, waves: 0.07, ripple: [0.3, 0.78, 0.05 + 1.4 * ease(f / 75), 0.45] })}>
      <Tag {...P(0.3, 0.78)} dx={-80} dy={-330} text="CLAP · how it sounds" at={rel(said("04c", "sounds"), from)} />
      <Tag {...P(0.7, 0.78)} dx={80} dy={-260} text="YAMNet · what happens" at={rel(said("04c", "happens"), from)} solid />
    </ClipShot>
  ) },
  // ... a voice, a door, a hum: each event boxed on the strip of sound as it's said
  { at: said("04c", "voice") - 0.45, el: (from, span) => <Events cues={[rel(said("04c", "voice"), from), rel(said("04c", "door"), from), rel(said("04c", "hum"), from)]} span={F(span)} /> },
  // one reads: a note, a script, a brief
  { at: START["04d"], el: (from, span) => <Words lines={["“the opening drags”", "INT. EDIT BAY. NIGHT.", "for: first-time editors"]} cues={[rel(said("04d", "notes"), from), rel(said("04d", "scripts"), from), rel(said("04d", "briefs"), from)]} caption="EmbeddingGemma · reads" span={F(span)} /> },
  // one sees depth: the hand again, its depth map shown as the model gives it (near white, far black), then turned
  // into the lines this film draws everywhere
  { at: START["04e"], el: (from, span) => {
    const shown = (f: number) => ease((f - rel(said("04e", "depth"), from)) / 16) * (1 - ease((f - rel(said("04e", "every"), from)) / 22));
    return (
      <ClipShot name="sunset" at={6.4} span={span} trace={(f) => ({ depth: shown(f), scan: scan(f, rel(said("04e", "line"), from), rel(said("04e", "film"), from)), contours: 0.55, outline: 0.9, density: 28, ripple: ring(f, 0.47, 0.1, rel(said("04e", "it"), from), 50, 0.9) })}>
        <Tag {...P(0.5, 0.45)} dx={300} dy={-250} text="Depth Anything 3 · how far" at={rel(said("04e", "depth"), from)} out={rel(said("04e", "every"), from)} solid />
        <Tag {...P(0.45, 0.7)} dx={-300} dy={60} text="near" at={rel(said("04e", "how"), from)} out={rel(said("04e", "every"), from)} />
        <Tag {...P(0.9, 0.2)} dx={-120} dy={-60} text="far" at={rel(said("04e", "far"), from)} out={rel(said("04e", "every"), from)} />
      </ClipShot>
    );
  } },
  // those never change; on top, something small that's only yours
  { at: START["04f"], el: (from, span) => <Stack blocks={MODELS.map(([m], i) => [m, 4 + i * 5] as [string, number])} top={rel(said("04f", "top"), from)} span={F(span)} /> },
  // name what you care about, and it looks for it from day one: axes in your own words
  { at: START["05"], el: (from, span) => <Words lines={["“a soft picture”", "“a cut that drags”", "“noise under the voice”"]} cues={[rel(said("05", "name"), from) + 4, rel(said("05", "looks"), from), rel(said("05", "day"), from)]} caption="your words · day one" span={F(span)} /> },
  // approve a cut: the approval spreads from one thumb across them all
  { at: START["06"], el: (from, span) => (
    <ClipShot name="thumbs" palette="ember" span={span} trace={(f) => ({ contours: 0.3, outline: 0.85, density: 10, scan: scan(f, 0, 24), ripple: ring(f, 0.46, 0.72, rel(said("06", "approve"), from) + 6, 60, 1.3) })}>
      <Tag {...P(0.46, 0.72)} dx={140} dy={-260} text="approved" at={rel(said("06", "cut"), from)} solid />
    </ClipShot>
  ) },
  // pick one version over another
  { at: START["07"], el: (from, span) => <Pick pick={rel(said("07", "pick"), from) + 4} why={rel(said("07", "why"), from)} span={F(span)} /> },
  // fix something by hand: the scan wipes from before to after across the desk
  { at: START["08"], el: (from, span) => (
    <ClipShot name="mouse" palette="ice" span={span} trace={(f) => ({ scan: scan(f, rel(said("08", "before"), from), rel(said("08", "after"), from) + 8), contours: 0.5, outline: 0.7, density: 16, ripple: ring(f, 0.38, 0.8, rel(said("08", "fix"), from) + 4, 30, 0.45) })}>
      <Tag {...P(0.33, 0.68)} dx={-200} dy={-240} text="before" at={rel(said("08", "before"), from)} />
      <Tag {...P(0.62, 0.8)} dx={160} dy={-260} text="after" at={rel(said("08", "after"), from)} solid />
    </ClipShot>
  ) },
  // a note in your own words, what you meant, and exactly when: rings from the pen
  { at: START["09"], el: (from, span) => (
    <ClipShot name="notebook" at={0} palette="mono" span={span} trace={(f) => ({ scan: scan(f, 0, 30), contours: 0.45, outline: 0.8, density: 18, ripple: f < rel(said("09", "when"), from) ? ring(f, 0.7, 0.48, rel(said("09", "words"), from), 45, 0.6) : ring(f, 0.7, 0.5, rel(said("09", "when"), from), 40, 0.6) })}>
      <Tag {...P(0.7, 0.48)} dx={-420} dy={-230} text="“the cut lands late”" at={rel(said("09", "words"), from)} />
      <Tag {...P(0.7, 0.48)} dx={-420} dy={-140} text="at 0:41" at={rel(said("09", "when"), from)} solid />
    </ClipShot>
  ) },
  // draw a box on the frame, and it learns where: the finger traced, the box round the heart it drew
  { at: START["10"], el: (from, span) => (
    <ClipShot name="fog" span={span} trace={(f) => ({ scan: scan(f, 0, 30), contours: 0.35, outline: 0.95, density: 12, ripple: ring(f, 0.27, 0.42, 4, 45, 0.6) })}>
      <Box x={540} y={190} w={660} h={470} at={rel(said("10", "box"), from)} label="here" />
    </ClipShot>
  ) },
  // work you admire, the range you aim for: rings from the lens holding the screen
  { at: START["11"], el: (from, span) => (
    <ClipShot name="glasses" palette="ember" span={span} trace={(f) => ({ scan: scan(f, 4, 50), contours: 0.45, outline: 0.8, density: 14, waves: 0.09, ripple: ring(f, 0.76, 0.52, rel(said("11", "range"), from) - 6, 60, 1.2) })}>
      <Tag {...P(0.76, 0.52)} dx={-380} dy={-330} text="work you admire" at={rel(said("11", "admire"), from)} />
    </ClipShot>
  ) },
  // each of those trains a tiny judge for one thing you care about, in a blink, on your machine
  { at: START["11a"], el: (from, span) => <Stack blocks={MODELS.map(([m]) => [m, -40] as [string, number])} top={-40} split={rel(said("11a", "trains"), from)} judges={["a soft picture", "a cut that drags", "noise under the voice"]} span={F(span)} /> },
  // before you see a new cut, it marks the moments you'd flag, in your words
  { at: START["14"], el: (from, span) => <Marks drops={[rel(said("14", "marks"), from), rel(said("14", "moments"), from), rel(said("14", "flag"), from)]} span={F(span)} /> },
  // your agent gets the moment and your words, never a score
  { at: START["15"], el: (from, span) => <Agent agent={rel(said("15", "agent"), from)} never={rel(said("15", "never"), from)} score={rel(said("15", "score"), from)} span={F(span)} /> },
  // it fixes them; fixed, still there, or only disguised
  { at: START["16"], el: (from, span) => <Check checks={rel(said("16", "checks"), from)} fixed={rel(said("16", "fixed"), from)} still={rel(said("16", "still"), from)} disguised={rel(said("16", "disguised"), from)} span={F(span)} /> },
  // a fingerprint kept with a project: the same taste spreads from the screen across the whole team
  { at: START["17"], el: (from, span) => (
    <ClipShot name="team" span={span} trace={(f) => ({ scan: scan(f, 0, 36), contours: 0.35, outline: 0.85, density: 12, waves: 0.08, ripple: ring(f, 0.7, 0.45, rel(said("17", "team"), from) - 8, 75, 1.4) })}>
      <Tag {...P(0.7, 0.42)} dx={-260} dy={-260} text="one fingerprint" at={rel(said("17", "fingerprint"), from)} />
      <Box x={1210} y={300} w={300} h={330} at={rel(said("17", "never"), from)} label="stays here" />
    </ClipShot>
  ) },
  // the title
  { at: START["18"] - BEAT, el: () => <TypeShot text="Fingerprint" id="t-title" size={1.9} caption="in raea · your eye, on every cut" span={DURATION - F(START["18"] - BEAT)} /> },
];

export function Film() {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SHOTS.map((s, i) => {
        const from = F(s.at);
        const to = i + 1 < SHOTS.length ? F(SHOTS[i + 1].at) : DURATION;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            {s.el(s.at, (to - from) / FPS)}
          </Sequence>
        );
      })}
      {/* the sound, in time order: hits where Fingerprint is named, a riser into the marks, the narration */}
      {LINES.map((l) => (
        <Sequence key={l.id} from={F(START[l.id])} durationInFrames={F(l.seconds + 0.6)}>
          <Audio src={staticFile(`voice-thermal/${l.id}.wav`)} bus="voice" />
        </Sequence>
      ))}
      <Sequence from={F(said("03", "fingerprint") - 0.05)} durationInFrames={F(5)}>
        <Audio src={staticFile("score-thermal/hit-1.wav")} gainDb={-12} fadeOut={1.5} />
      </Sequence>
      <Sequence from={F(START["14"] - 6)} durationInFrames={F(6)}>
        <Audio src={staticFile("score-thermal/riser-1.wav")} gainDb={-16} fadeIn={2} />
      </Sequence>
      <Sequence from={F(said("18", "fingerprint") - 0.05)} durationInFrames={F(6)}>
        <Audio src={staticFile("score-thermal/hit-1.wav")} gainDb={-8} fadeOut={2} />
      </Sequence>
      <Mix lufs={-14} ceiling={-1.5} />
    </AbsoluteFill>
  );
}


/** shot i's first frame and length in frames */
export function shotFrames(i: number) {
  const from = F(SHOTS[i].at);
  const to = i + 1 < SHOTS.length ? F(SHOTS[i + 1].at) : DURATION;
  return { from, frames: to - from };
}

/** shot i alone, as its own composition (tools/thermal-film.sh renders each shot in its own process: a FramePass
 * keeps the shader and textures of its first mount for the whole render, so in one render every shot after the
 * first drew with the first shot's pass and none was traced; raea gap, 11-13) */
export function ShotOnly({ i }: { i: number }) {
  const s = SHOTS[i];
  const { frames } = shotFrames(i);
  return <AbsoluteFill style={{ background: "#000" }}>{s.el(s.at, frames / FPS)}</AbsoluteFill>;
}
