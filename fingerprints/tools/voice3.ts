// The v3 narration: each line voiced by Fish (the dry "Dottore" voice the director picked for a Dr House manner, drama-3), cached by what made it, then timed
// word by word with parakeet-mlx. Run: bun tools/voice3.ts, with FISH_API_KEY in the environment (injected at run time,
// never written down). Writes media/voice3/NN.mp3, NN.wav (48 kHz) and NN.json (parakeet's sentences and tokens), and
// media/voice3/lines.json.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
const OUT = path.join(ROOT, "media/voice3");
mkdirSync(OUT, { recursive: true });

const VOICE = { model: "drama-3", reference_id: "3dc35585d91b4fd992f6e34494984f20", speed: 1.45 };
const DIRECTION = "[dry, deadpan, unimpressed and quietly amused; a brilliant doctor talking to someone watching the same screen beside him]";

export const LINES = [
  "This is nothing. Colourful nothing. Most ideas start here. Most of them should have stayed.",
  "Ah. A hand. Somebody decided to make something. Bold.",
  "And this is where the trouble comes from. Don't touch it.",
  "You touched it.",
  "Fine. It does that on its own anyway.",
  "Creativity isn't lightning. It's this. Small decisions, looping, never quite repeating. Chaos, with opinions.",
  "Taste is the opinions. A thousand tiny refusals. Not that blue. Not that vase. That one. Why? You don't know. You just know.",
  "Do it long enough and it leaves a pattern. Nobody else has yours. That isn't flattery. It's biometrics.",
  "Now. You make videos. An AI cuts them in minutes and gets your taste exactly wrong. See the red ones? Too dark. Hiss under the voice. You've written those notes before.",
  "So raea made Fingerprint. It learns your eye from what you already do. The cuts you approve. The takes you pick. The notes you leave. In your words.",
  "Then it reads every cut before you do, finds what you'd flag, and has it fixed.",
  "And if a fix only hides the problem. There. It noticed. It always notices. It's insufferable.",
  "It all lives on your machine. Your footage never leaves. A team shares what it learned. Never the footage.",
  "So that's creativity. Chaos, refusals, and a pattern you can't help leaving.",
  "This is a cat. It's raea's. I wasn't consulted.",
  "Fingerprint. In raea. You can stop staring now.",
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
