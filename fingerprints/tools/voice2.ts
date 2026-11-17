// The v2 narration: each line voiced by Fish (the French-accented voice the director picked, drama-3), cached by what made it, then timed
// word by word with parakeet-mlx. Run: bun tools/voice2.ts, with FISH_API_KEY in the environment (injected at run time,
// never written down). Writes media/voice2/NN.mp3, NN.wav (48 kHz) and NN.json (parakeet's sentences and tokens), and
// media/voice2/lines.json.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
const OUT = path.join(ROOT, "media/voice2");
mkdirSync(OUT, { recursive: true });

const VOICE = { model: "drama-3", reference_id: "24acd8b19365435995ab0935a958814d", speed: 1 };
const DIRECTION = "[a proud, theatrical artist talking about himself: dry, amused, unhurried, sure of his own genius]";

export const LINES = [
  "I am an artist. This is my hand.",
  "It draws.",
  "It paints.",
  "It conducts. Badly. But with feeling.",
  "And lately, it writes notes to a machine. Too dark. There is a hiss. Too soft. Every day, the same notes.",
  "The machine is very fast. It has the taste of a boiled potato.",
  "So raea made Fingerprint.",
  "It learns my taste from what I already do. The cuts I approve. The takes I pick. The notes I leave. In my words. Not a score out of ten. I am not a hotel.",
  "Now, before a cut reaches me, it finds what I would hate, and has it fixed first.",
  "And if a fix only hides the problem, it can tell. Frankly, I am a little jealous.",
  "It lives on my machine. My footage never leaves. My team shares what it has learned. Never the footage.",
  "So my hand goes back to its real work.",
  "Fingerprint. In raea.",
];

// how the narrator should say a word that's written otherwise
const SAY: [RegExp, string][] = []; // the tutorials let Fish read "raea" as written
const spoken = (t: string) => SAY.reduce((s, [re, to]) => s.replace(re, to), t);

async function voice(i: number, text: string): Promise<string> {
  const key = createHash("sha256").update(JSON.stringify({ ...VOICE, DIRECTION, text: spoken(text) })).digest("hex").slice(0, 12);
  const id = String(i + 1).padStart(2, "0");
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
for (let i = 0; i < LINES.length; i++) ids.push(await voice(i, LINES[i]));

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
  const d = JSON.parse(readFileSync(path.join(OUT, `${id}.json`), "utf8")) as { sentences: { tokens: Tok[] }[] };
  const words: [string, number, number][] = [];
  for (const s of d.sentences)
    for (const t of s.tokens) {
      if (t.text.startsWith(" ") || !words.length) words.push([t.text.trim(), t.start, t.end]);
      else { const w = words[words.length - 1]; w[0] += t.text; w[2] = t.end; }
    }
  return { id, text: LINES[i], seconds: dur(path.join(OUT, `${id}.wav`)), words };
});
writeFileSync(path.join(OUT, "lines.json"), JSON.stringify(lines, null, 1));
for (const l of lines) console.log(l.id, l.seconds.toFixed(2), l.words.map((w) => w[0]).join(" "));
