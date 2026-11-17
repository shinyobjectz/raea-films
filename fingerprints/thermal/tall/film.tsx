// Fingerprint, in thermal, for a phone held upright (1080x1920: TikTok, Instagram Reels). Not the 16:9 film cropped:
// the same 25 shots on the same clock and the same sound (thermal/film.tsx says what each is and why), each laid out
// again for the tall frame:
//   - the type breaks into lines that fill the width; the captions are 60 px;
//   - each stock shot is a 9:16 window on its clip, placed on what the line is about, and moving between two subjects
//     where the wide shot held both (the glasses, the headphones, the mouse), the trace read from the clip's depth;
//   - the motion graphics run down the frame instead of across it (thermal/tall/mograph.tsx);
//   - every word stands inside both networks' safe zones (x 65..940, y 269..1248) at 60 px (thermal/tall/frame.ts),
//     a tag's label placed there and its leader run to the thing; pictures may run on into the bottom, where the
//     networks' own captions and buttons sit.
import { AbsoluteFill } from "raea";
import { SHOTS } from "../film";
import { FPS } from "../shots";
import { BEAT, DURATION, START, said } from "../time";
import { AgentT, CheckT, EventsT, MarksT, PickT, StackT, WarmT, WordsT } from "./mograph";
import { ClipShotT, TypeShotT, type ToFrame } from "./shots";
import { BoxT, TagT, TicksT } from "./marks";

const F = (s: number) => Math.round(s * FPS);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { const k = clamp01(x); return k * k * (3 - 2 * k); };
const rel = (t: number, from: number) => F(t - from);
const scan = (f: number, a: number, b: number) => (f < a ? 2 : 1.05 - 1.2 * ease((f - a) / (b - a)));
const ring = (f: number, u: number, v: number, a: number, dur: number, reach = 1): [number, number, number, number] => {
  const k = clamp01((f - a) / dur);
  return [u, v, 0.03 + reach * ease(k), f < a ? 0 : 1.2 * (1 - k)];
};
/** a still window: the clip's u, v at the frame's middle, at the clip's full height */
const hold = (u: number, v = 0.5, zoom = 1) => () => [u, v, zoom] as [number, number, number];
/** a window panning from u0 to u1 over frames [a, a + dur] */
const pan = (u0: number, u1: number, a: number, dur: number, v = 0.5) => (f: number) => [u0 + (u1 - u0) * ease((f - a) / dur), v, 1] as [number, number, number];
/** a clip point on the frame, as a tag's dot */
const on = (to: ToFrame, u: number, v: number) => to(u, v);

const MODELS: [string][] = [["Depth Anything 3 · how far"], ["EmbeddingGemma · reads"], ["YAMNet · what happens"], ["CLAP · how it sounds"], ["SigLIP 2 · sees"]];

/** each shot's tall picture, in the wide film's order (its start and length are the wide shot's) */
const TALL: ((from: number, span: number) => React.ReactNode)[] = [
  () => <TypeShotT lines={["Every editor", "has a touch."]} id="t-open" size={0.54} span={F(START["02"])} />,
  (from, span) => <WarmT warm={rel(said("02", "warm"), from)} notes={rel(said("02", "notes"), from)} takes={rel(said("02", "takes"), from)} away={rel(said("02", "throw"), from)} span={F(span)} />,
  // the hand: the window on the palm and the fingertip the ring starts from
  (from, span) => (
    <ClipShotT name="sunset" at={6} span={span} view={hold(0.47)} trace={(f) => ({ scan: scan(f, 6, rel(said("03", "touch"), from)), contours: 0.55, outline: 0.9, density: 28, ripple: ring(f, 0.47, 0.08, rel(said("03", "touch"), from), 70, 0.95) })}
      marks={(to) => <TagT {...on(to, 0.45, 0.62)} lx={420} ly={880} text={"your eye,\nwritten down"} at={rel(said("03", "written"), from)} />} />
  ),
  // the editor at night: the window on his glasses (the screen in them) and the fingers on the frame
  (from, span) => (
    <ClipShotT name="night" palette="mono" span={span} view={hold(0.5)} trace={(f) => ({ scan: scan(f, 0, 40), contours: 0.4, outline: 0.8, density: 14, ripple: ring(f, 0.4, 0.28, rel(said("04", "learns"), from), 40, 0.7) })}
      marks={(to) => <TagT {...on(to, 0.5, 0.28)} lx={110} ly={290} text={"on this\nmachine"} at={rel(said("04", "computer"), from)} />} />
  ),
  (from, span) => <StackT blocks={[["pictures", rel(said("04a", "pictures"), from)], ["sound", rel(said("04a", "sound"), from)], ["words", rel(said("04a", "words"), from)]]} rise={[8, 30, 52]} span={F(span)} />,
  // the eye: the window on the pupil, the frames it sees ticking off under it
  (from, span) => (
    <ClipShotT name="eye" palette="ice" span={span} view={hold(0.49)} trace={(f) => ({ scan: scan(f, 0, 30), contours: 0.25, outline: 0.6, density: 10, ripple: ring(f, 0.49, 0.5, 8, 40, 0.5) })}
      marks={(to) => (
        <>
          <TagT {...on(to, 0.49, 0.5)} lx={110} ly={600} text="SigLIP 2 · sees" at={rel(said("04b", "one"), from) + 6} solid />
          <TicksT at={rel(said("04b", "four"), from)} label={"four frames\nevery second"} x={80} y={1030} />
        </>
      )} />
  ),
  // the glasses: the window on her left lens, the eye in it, the screen it holds, the frame
  (from, span) => (
    <ClipShotT name="glasses" at={14.4} palette="ice" span={span} view={hold(0.7)} trace={(f) => ({ contours: 0.3, outline: 0.85, density: 12, scan: scan(f, 0, 24) })}
      marks={(to) => (
        <>
          <TagT {...on(to, 0.727, 0.37)} lx={300} ly={420} align="l" text="an eye" at={rel(said("04b", "what's"), from)} />
          <TagT {...on(to, 0.83, 0.45)} lx={920} ly={950} align="r" text="a screen" at={rel(said("04b", "in"), from)} />
          <TagT {...on(to, 0.6, 0.22)} lx={110} ly={290} text="glasses" at={rel(said("04b", "each"), from)} />
        </>
      )} />
  ),
  // the headphones: the window on the left cup (how it sounds), then across to the right one (what happens)
  (from, span) => {
    const happens = rel(said("04c", "happens"), from);
    return (
      <ClipShotT name="phones" palette="ice" span={span} view={pan(0.36, 0.64, happens - 16, 18)} trace={(f) => ({ contours: 0.3, outline: 0.7, density: 12, waves: 0.07, ripple: [0.3, 0.78, 0.05 + 1.4 * ease(f / 75), 0.45] })}
        marks={(to) => (
          <>
            <TagT {...on(to, 0.3, 0.78)} lx={100} ly={640} text={"CLAP\nhow it sounds"} at={rel(said("04c", "sounds"), from)} out={happens - 16} />
            <TagT {...on(to, 0.7, 0.78)} lx={920} ly={640} align="r" text={"YAMNet\nwhat happens"} at={happens} solid />
          </>
        )} />
    );
  },
  (from, span) => <EventsT cues={[rel(said("04c", "voice"), from), rel(said("04c", "door"), from), rel(said("04c", "hum"), from)]} span={F(span)} />,
  (from, span) => <WordsT lines={["“the opening drags”", "INT. EDIT BAY. NIGHT.", "for: first-time editors"]} cues={[rel(said("04d", "notes"), from), rel(said("04d", "scripts"), from), rel(said("04d", "briefs"), from)]} caption="EmbeddingGemma · reads" span={F(span)} />,
  // the hand's depth, shown and then drawn as lines
  (from, span) => {
    const shown = (f: number) => ease((f - rel(said("04e", "depth"), from)) / 16) * (1 - ease((f - rel(said("04e", "every"), from)) / 22));
    const out = rel(said("04e", "every"), from);
    return (
      <ClipShotT name="sunset" at={6.4} span={span} view={hold(0.48)} trace={(f) => ({ depth: shown(f), scan: scan(f, rel(said("04e", "line"), from), rel(said("04e", "film"), from)), contours: 0.55, outline: 0.9, density: 28, ripple: ring(f, 0.47, 0.1, rel(said("04e", "it"), from), 50, 0.9) })}
        marks={(to) => (
          <>
            <TagT {...on(to, 0.5, 0.45)} lx={110} ly={560} text={"Depth Anything 3\nhow far"} at={rel(said("04e", "depth"), from)} out={out} solid />
            <TagT {...on(to, 0.45, 0.7)} lx={110} ly={1090} text="near" at={rel(said("04e", "how"), from)} out={out} />
            <TagT {...on(to, 0.36, 0.1)} lx={110} ly={300} text="far" at={rel(said("04e", "far"), from)} out={out} />
          </>
        )} />
    );
  },
  (from, span) => <StackT blocks={MODELS.map(([m], i) => [m, 4 + i * 5] as [string, number])} top={rel(said("04f", "top"), from)} span={F(span)} />,
  (from, span) => <WordsT lines={["“a soft picture”", "“a cut that drags”", "“noise under the voice”"]} cues={[rel(said("05", "name"), from) + 4, rel(said("05", "looks"), from), rel(said("05", "day"), from)]} caption="your words · day one" span={F(span)} />,
  // the thumbs: the window on the clip's lower half, where the hands are (at its full height they filled only the
  // frame's bottom 40%, under the networks' captions)
  (from, span) => (
    <ClipShotT name="thumbs" palette="ember" span={span} view={hold(0.46, 0.75, 2)} trace={(f) => ({ contours: 0.3, outline: 0.85, density: 10, scan: scan(f, 0, 24), ripple: ring(f, 0.46, 0.72, rel(said("06", "approve"), from) + 6, 60, 1.3) })}
      marks={(to) => <TagT {...on(to, 0.46, 0.72)} lx={380} ly={480} text="approved" at={rel(said("06", "cut"), from)} solid />} />
  ),
  (from, span) => <PickT pick={rel(said("07", "pick"), from) + 4} why={rel(said("07", "why"), from)} span={F(span)} />,
  // the mouse: the window moves with the scan, from before to after
  (from, span) => {
    const before = rel(said("08", "before"), from), after = rel(said("08", "after"), from);
    return (
      <ClipShotT name="mouse" palette="ice" span={span} view={pan(0.37, 0.6, before, after + 8 - before)} trace={(f) => ({ scan: scan(f, before, after + 8), contours: 0.5, outline: 0.7, density: 16, ripple: ring(f, 0.38, 0.8, rel(said("08", "fix"), from) + 4, 30, 0.45) })}
        marks={(to) => (
          <>
            <TagT {...on(to, 0.33, 0.68)} lx={100} ly={880} text="before" at={before} out={after - 4} />
            <TagT {...on(to, 0.62, 0.8)} lx={920} ly={980} align="r" text="after" at={after} solid />
          </>
        )} />
    );
  },
  // the pen: the window on the hand writing
  (from, span) => (
    <ClipShotT name="notebook" at={0} palette="mono" span={span} view={hold(0.66)} trace={(f) => ({ scan: scan(f, 0, 30), contours: 0.45, outline: 0.8, density: 18, ripple: f < rel(said("09", "when"), from) ? ring(f, 0.7, 0.48, rel(said("09", "words"), from), 45, 0.6) : ring(f, 0.7, 0.5, rel(said("09", "when"), from), 40, 0.6) })}
      marks={(to) => (
        <>
          <TagT {...on(to, 0.7, 0.48)} lx={100} ly={420} text={"“the cut\nlands late”"} at={rel(said("09", "words"), from)} />
          <TagT {...on(to, 0.7, 0.5)} lx={100} ly={640} text="at 0:41" at={rel(said("09", "when"), from)} solid />
        </>
      )} />
  ),
  // the heart on the fogged window: the finger and the heart both in the window, the box round the heart (the window
  // a little right of the clip's middle, so the heart's right stroke clears the frame's edge)
  (from, span) => (
    <ClipShotT name="fog" span={span} view={hold(0.48)} trace={(f) => ({ scan: scan(f, 0, 30), contours: 0.35, outline: 0.95, density: 12, ripple: ring(f, 0.33, 0.27, 4, 45, 0.6) })}
      marks={(to) => {
        const a = to(0.44, 0.19), b = to(0.6, 0.47);
        return <BoxT x={a.x} y={a.y} w={Math.min(b.x, 1000) - a.x} h={b.y - a.y} at={rel(said("10", "box"), from)} label="here" below />;
      }} />
  ),
  // the lens holding the screen
  (from, span) => (
    <ClipShotT name="glasses" palette="ember" span={span} view={hold(0.7)} trace={(f) => ({ scan: scan(f, 4, 50), contours: 0.45, outline: 0.8, density: 14, waves: 0.09, ripple: ring(f, 0.76, 0.52, rel(said("11", "range"), from) - 6, 60, 1.2) })}
      marks={(to) => <TagT {...on(to, 0.76, 0.52)} lx={110} ly={560} text={"work you\nadmire"} at={rel(said("11", "admire"), from)} />} />
  ),
  (from, span) => <StackT blocks={MODELS.map(([m]) => [m, -40] as [string, number])} top={-40} split={rel(said("11a", "trains"), from)} judges={["a soft\npicture", "a cut that\ndrags", "noise under\nthe voice"]} span={F(span)} low />,
  (from, span) => <MarksT drops={[rel(said("14", "marks"), from), rel(said("14", "moments"), from), rel(said("14", "flag"), from)]} span={F(span)} />,
  (from, span) => <AgentT agent={rel(said("15", "agent"), from)} never={rel(said("15", "never"), from)} score={rel(said("15", "score"), from)} span={F(span)} />,
  (from, span) => <CheckT checks={rel(said("16", "checks"), from)} fixed={rel(said("16", "fixed"), from)} still={rel(said("16", "still"), from)} disguised={rel(said("16", "disguised"), from)} span={F(span)} />,
  // the team: the window on the screen and the editor at it, the box round the screen
  (from, span) => (
    <ClipShotT name="team" span={span} view={hold(0.64)} trace={(f) => ({ scan: scan(f, 0, 36), contours: 0.35, outline: 0.85, density: 12, waves: 0.08, ripple: ring(f, 0.7, 0.45, rel(said("17", "team"), from) - 8, 75, 1.4) })}
      marks={(to) => {
        const a = to(0.61, 0.3), b = to(0.76, 0.58);
        return (
          <>
            <TagT {...on(to, 0.69, 0.42)} lx={100} ly={290} text={"one\nfingerprint"} at={rel(said("17", "fingerprint"), from)} />
            <BoxT x={a.x} y={a.y} w={b.x - a.x} h={b.y - a.y} at={rel(said("17", "never"), from)} label="stays here" />
          </>
        );
      }} />
  ),
  () => <TypeShotT lines={["Fingerprint"]} id="t-title" size={0.58} caption={"in raea\nyour eye, on every cut"} span={DURATION - F(START["18"] - BEAT)} />,
];

if (TALL.length !== SHOTS.length) throw new Error(`thermal/tall/film: ${TALL.length} tall shots for ${SHOTS.length} wide ones`);

/** shot i of the tall film alone, as its own composition (tools/thermal-tall.sh renders each in its own process, as
 * the wide film's are: a FramePass keeps its first mount's shader and textures) */
export function ShotOnlyT({ i }: { i: number }) {
  const from = F(SHOTS[i].at);
  const to = i + 1 < SHOTS.length ? F(SHOTS[i + 1].at) : DURATION;
  return <AbsoluteFill style={{ background: "#000" }}>{TALL[i](SHOTS[i].at, (to - from) / FPS)}</AbsoluteFill>;
}
