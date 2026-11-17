// Narrator casting for the tutorial (tutorial.script.ts): the cold open and two of its jokes, read by one Pocket voice
// each, on this Mac. Rendered to WAV only: raea render compositions/narrator.tsx --composition narrator-javert -o out.wav
// Pocket's own voices only: no clip of a real person's voice is cloned.
import { AbsoluteFill, Composition, registerRoot } from "raea";
import { Speech, speechDuration } from "raea/speech";

const FPS = 30;
const VOICES = ["javert", "marius", "jean"] as const;
/** each line, and the pause after it in seconds (a joke's beat is the longer pause) */
const LINES: [string, number][] = [
  ["This is Goose. Today, Goose will make a music video.", 0.5],
  ["And learn the new raea app on the way, from start to finish.", 1.6],
  ["Goose walked to the computer.", 1.4],
  ["To the computer.", 1.2],
  ["Thank you.", 1.8],
  ["Goose left loudness at minus fourteen.", 1.4],
  ["Goose left loudness at minus fourteen.", 1.8],
  ["It's a song about a duck.", 1.1],
  ["Goose is a goose.", 1.2],
  ["Goose has never once wondered what he is. It's saved him a great deal of time.", 1.0],
];
const TEMP = 0.5; // calmer and more even than Pocket's 0.7: a dry read

function plan(voice: string) {
  let at = Math.round(0.3 * FPS);
  return LINES.map(([text, gap], i) => {
    const line = { text, voice, seed: i === 6 ? 1 : 0, temperature: TEMP };
    const start = at;
    at = start + Math.ceil((speechDuration(line) + gap) * FPS);
    return { line, start, end: at };
  });
}

function Read({ voice }: { voice: string }) {
  const lines = plan(voice);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {lines.map((l, i) => (
        <Speech key={i} {...l.line} start={l.start} />
      ))}
    </AbsoluteFill>
  );
}

registerRoot(() => (
  <>
    {VOICES.map((v) => (
      <Composition
        key={v}
        id={`narrator-${v}`}
        width={320}
        height={180}
        fps={FPS}
        durationInFrames={plan(v).at(-1)!.end}
        component={() => <Read voice={v} />}
      />
    ))}
  </>
));
