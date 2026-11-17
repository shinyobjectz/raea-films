// The thermal film's narration (thermal.script.ts): each line voiced by Fish ("Adrian", drama-3, at 1.1x and brisk: the director's pick for v2, 11-13, after "the VO is too deep and slow"), cached by what made it, then timed
// word by word with parakeet-mlx. Run: bun tools/voice-thermal.ts, with FISH_API_KEY in the environment (injected at run time,
// never written down). Writes media/voice-thermal/NN.mp3, NN.wav (48 kHz) and NN.json (parakeet's sentences and tokens), and
// media/voice-thermal/lines.json.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
const OUT = path.join(ROOT, "media/voice-thermal");
mkdirSync(OUT, { recursive: true });

const VOICE = { model: "drama-3", reference_id: "bf322df2096a46f18c579d0baa36f41d", speed: 1.1 };
const DIRECTION = "[cinematic and confident, with energy and forward momentum; a brisk pace, crisp phrasing, short pauses]";

export const LINES: [string, string][] = [
  ["01", "Every editor has a touch."],
  ["02", "The cuts you warm to. The notes you leave. The takes you throw away."],
  ["03", "raea's Fingerprint learns that touch: your eye for a good cut, written down from what you already do."],
  ["04", "It runs on your computer, and it learns there."],
  // v3 (the director, 11-13: "educational about what we are doing and the models and systems underneath without being
  // technical"): what it stands on, in plain words (the names ride on screen)
  ["04a", "Underneath, it stands on models that already understand pictures, sound and words."],
  ["04b", "One sees. Four frames every second, and what's in each."],
  ["04c", "Two listen: one to how it sounds, one to what happens. A voice. A door. A hum."],
  ["04d", "One reads: your notes, your scripts, your briefs."],
  ["04e", "And one sees depth, how far away everything is. Every line traced in this film comes from it."],
  ["04f", "Those models never change. On top sits something small, and it's only yours."],
  ["05", "Name what you care about, and it looks for it from day one, from your words alone."],
  ["06", "Approve a cut, and it learns what you like."],
  ["07", "Pick one version over another, and it learns why one wins."],
  ["08", "Fix something by hand, and your before and after teach it too."],
  ["09", "Leave a note in your own words, and it learns what you meant, and exactly when."],
  ["10", "Draw a box on the frame, and it learns where."],
  ["11", "Show it work you admire, and it learns the range you aim for."],
  ["11a", "Each of those trains a tiny judge for one thing you care about. In a blink, on your machine."],
  // "13" (the hiss and hum boxed on a spectrogram) is cut from v3: X caps a video at 2:20, and 04c says the listening plainly
  ["14", "Then, before you ever see a new cut, it marks the moments you'd flag, in your words."],
  ["15", "Your agent gets the moment and your words. Never a score to chase."],
  ["16", "It fixes them, and the fingerprint checks the work: fixed, still there, or only disguised."],
  ["17", "Keep a fingerprint with a project, and your whole team judges by the same taste. Your footage never leaves."],
  ["18", "Fingerprint, in raea. Your eye, on every cut."],
];

// how the narrator should say a word that's written otherwise
const SAY: [RegExp, string][] = []; // the tutorials let Fish read "raea" as written
const spoken = (t: string) => SAY.reduce((s, [re, to]) => s.replace(re, to), t);

async function voice(id: string, text: string): Promise<string> {
  const key = createHash("sha256").update(JSON.stringify({ ...VOICE, DIRECTION, text: spoken(text) })).digest("hex").slice(0, 12);
  const mp3 = path.join(OUT, `${id}.mp3`);
  const keyFile = path.join(OUT, `${id}.key`);
  if (existsSync(mp3) && existsSync(keyFile) && readFileSync(keyFile, "utf8") === key) return id;
  const own = process.env.FISH_API_KEY;
  if (!own) throw new Error("FISH_API_KEY is not set: set it to your own Fish Audio API key");
  const body = { reference_id: VOICE.reference_id, format: "mp3", prosody: { speed: VOICE.speed }, text: `${DIRECTION} ${spoken(text)}` };
  for (let attempt = 1; ; attempt++) {
    const res = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: { authorization: `Bearer ${own}`, "content-type": "application/json", model: VOICE.model },
      body: JSON.stringify(body),
    });
    if (res.ok && (res.headers.get("content-type") ?? "").startsWith("audio/")) {
      writeFileSync(mp3, Buffer.from(await res.arrayBuffer()));
      writeFileSync(keyFile, key);
      console.log(`voiced ${id}: ${text.slice(0, 60)}`);
      return id;
    }
    const why = `${res.status} ${(await res.text()).slice(0, 200)}`;
    if (attempt >= 3) throw new Error(`fish refused line ${id}: ${why}`);
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
}

const ids: string[] = [];
for (const [id, text] of LINES) ids.push(await voice(id, text));

// 48 kHz mono wavs, trimmed of leading and trailing silence, for the mix and for parakeet
for (const id of ids) {
  const mp3 = path.join(OUT, `${id}.mp3`);
  const wav = path.join(OUT, `${id}.wav`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", mp3, "-af",
    "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse",
    "-ar", "48000", "-ac", "1", wav]);
}
execFileSync("parakeet-mlx", [...ids.map((id) => path.join(OUT, `${id}.wav`)), "--output-format", "json", "--output-dir", OUT], { stdio: ["ignore", "ignore", "inherit"] });

const dur = (f: string) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).trim());
type Tok = { text: string; start: number; end: number };
const lines = ids.map((id, i) => {
  // parakeet writes a bare NaN for some tokens' confidence (11-13), which JSON can't hold: read it as null
  const d = JSON.parse(readFileSync(path.join(OUT, `${id}.json`), "utf8").replace(/:\s*NaN\b/g, ": null")) as { sentences: { tokens: Tok[] }[] };
  const words: [string, number, number][] = [];
  for (const s of d.sentences)
    for (const t of s.tokens) {
      if (t.text.startsWith(" ") || !words.length) words.push([t.text.trim(), t.start, t.end]);
      else { const w = words[words.length - 1]; w[0] += t.text; w[2] = t.end; }
    }
  return { id, text: LINES[i][1], seconds: dur(path.join(OUT, `${id}.wav`)), words };
});
writeFileSync(path.join(OUT, "lines.json"), JSON.stringify(lines, null, 1));
for (const l of lines) console.log(l.id, l.seconds.toFixed(2), l.words.map((w) => w[0]).join(" "));
