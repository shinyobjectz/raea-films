// Dana's lines, voiced: each line of game/lines.ts's script through Fish (drama-3, one voice, a direction per line),
// timed word by word with parakeet, and the script's words aligned to what it heard. Writes the raw takes to
// assets/voice/<id>.wav and game/lines.gen.json (each line's length and its captions, each caption up from its first
// word's start to its last word's end, so it is on screen exactly as long as it is said).
//   FISH_API_KEY=... bun tools/voice.ts [ids...]
// A take is cached by what made it (text, voice, direction, speed), so a rerun voices only what changed.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { SCRIPT_TEXT, type Caption, type LineId } from "../game/lines";

const ROOT = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(ROOT, ".cache/voice");
const OUT = path.join(ROOT, "assets/voice");
const GEN = path.join(ROOT, "game/lines.gen.json");
mkdirSync(CACHE, { recursive: true });
mkdirSync(OUT, { recursive: true });

// one woman's voice for Dana, and for the thing that borrows it
const VOICE = "57d4a7fa3d944ca5b2407f916ce5f4d5";
const DIRECT: Record<LineId, { how: string; speed: number }> = {
  vm1: { how: "[tired and hushed, urgent but holding it together, speaking low into a desk phone late at night]", speed: 1.0 },
  tape2: { how: "[whispering close to a cassette recorder's microphone, nervous, quick, glancing around]", speed: 1.04 },
  vm3: { how: "[panicked and out of breath, terrified, whispering fast, voice breaking, on the edge of tears]", speed: 1.08 },
  behind: { how: "[flat, calm, emotionless, a slow close whisper]", speed: 0.86 },
  there: { how: "[flat, calm, emotionless, a slow close whisper, almost pleased]", speed: 0.86 },
};
// the last message is cut off mid-sentence: the take ends where this word starts
const CUT_BEFORE: Partial<Record<LineId, string>> = { vm3: "it" };

type Word = [string, number, number];
const keyOf = (id: LineId) => createHash("sha256").update(JSON.stringify({ VOICE, ...DIRECT[id], text: SCRIPT_TEXT[id].text })).digest("hex").slice(0, 20);

async function take(id: LineId): Promise<string> {
  const file = path.join(CACHE, `${id}-${keyOf(id)}.mp3`);
  if (existsSync(file)) return file;
  const key = process.env.FISH_API_KEY;
  if (!key) throw new Error("FISH_API_KEY is not set");
  const body = { reference_id: VOICE, format: "mp3", prosody: { speed: DIRECT[id].speed }, text: `${DIRECT[id].how} ${SCRIPT_TEXT[id].text}` };
  for (let attempt = 1; ; attempt++) {
    const res = await fetch("https://api.fish.audio/v1/tts", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json", model: "drama-3" }, body: JSON.stringify(body) });
    if (res.ok && (res.headers.get("content-type") ?? "").startsWith("audio/")) {
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      return file;
    }
    const why = `${res.status} ${(await res.text()).slice(0, 200)}`;
    if (attempt >= 3) throw new Error(`fish refused ${id}: ${why}`);
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
}

function heard(json: string): { w: string; t0: number; t1: number }[] {
  const d = JSON.parse(readFileSync(json, "utf8")) as { sentences: { tokens: { text: string; start: number; end: number }[] }[] };
  const out: { w: string; t0: number; t1: number }[] = [];
  for (const s of d.sentences)
    for (const tk of s.tokens) {
      if (tk.text.startsWith(" ") || !out.length) out.push({ w: tk.text.trim(), t0: tk.start, t1: tk.end });
      else { const last = out[out.length - 1]; last.w += tk.text; last.t1 = tk.end; }
    }
  return out.filter((x) => x.w);
}
const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
function align(script: string, got: { w: string; t0: number; t1: number }[], length: number): Word[] {
  const words = script.split(/\s+/).filter(Boolean);
  const a = words.map(norm), b = got.map((g) => norm(g.w));
  const n = a.length, m = b.length;
  const D = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  const sub = (x: string, y: string) => (x === y ? 0 : x && y && (x.startsWith(y) || y.startsWith(x)) ? 0.5 : 1);
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + sub(a[i - 1], b[j - 1]));
  const at: (number | null)[] = Array(n).fill(null);
  for (let i = n, j = m; i > 0 && j > 0; ) {
    if (D[i][j] === D[i - 1][j - 1] + sub(a[i - 1], b[j - 1])) { if (sub(a[i - 1], b[j - 1]) < 1) at[i - 1] = j - 1; i--, j--; }
    else if (D[i][j] === D[i - 1][j] + 1) i--;
    else j--;
  }
  const out: Word[] = words.map((w, i) => (at[i] != null ? [w, got[at[i]!].t0, got[at[i]!].t1] : [w, NaN, NaN]));
  for (let i = 0; i < n; ) {
    if (!Number.isNaN(out[i][1])) { i++; continue; }
    let k = i;
    while (k < n && Number.isNaN(out[k][1])) k++;
    const from = i > 0 ? out[i - 1][2] : 0, to = k < n ? out[k][1] : length;
    const letters = words.slice(i, k).map((w) => Math.max(1, norm(w).length));
    const total = letters.reduce((x, y) => x + y, 0);
    let t = from;
    for (let j = i; j < k; j++) { const d = ((to - from) * letters[j - i]) / total; out[j] = [words[j], t, t + d]; t += d; }
    i = k;
  }
  return out;
}

/** captions: a sentence per caption; a sentence over eight words splits at the comma nearest its middle, else at its
 * middle, so no caption is left with a word or two. Each is up from its first word's start to its last word's end. */
function captions(words: Word[]): Caption[] {
  const sentences: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) { cur.push(w); if (/[.?!]$/.test(w[0])) { sentences.push(cur); cur = []; } }
  if (cur.length) sentences.push(cur);
  const split = (g: Word[]): Word[][] => {
    if (g.length <= 8) return [g];
    const mid = g.length / 2;
    let at = -1;
    g.forEach((w, i) => { if (/,$/.test(w[0]) && i + 1 >= 3 && g.length - i - 1 >= 3 && (at < 0 || Math.abs(i + 1 - mid) < Math.abs(at - mid))) at = i + 1; });
    if (at < 0) at = Math.ceil(mid);
    return [...split(g.slice(0, at)), ...split(g.slice(at))];
  };
  return sentences.flatMap(split).map((g) => ({ text: g.map((w) => w[0]).join(" "), t0: +g[0][1].toFixed(3), t1: +g[g.length - 1][2].toFixed(3) }));
}

const dur = (f: string) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).trim());

const ids = (process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(DIRECT)) as LineId[];
const mp3s = await Promise.all(ids.map(take));
const untimed = mp3s.filter((f) => !existsSync(f.replace(/\.mp3$/, ".json")));
if (untimed.length) execFileSync("parakeet-mlx", [...untimed, "--output-format", "json", "--output-dir", CACHE], { stdio: ["ignore", "ignore", "inherit"] });

const gen = existsSync(GEN) ? JSON.parse(readFileSync(GEN, "utf8")) : {};
ids.forEach((id, i) => {
  const mp3 = mp3s[i];
  const len = dur(mp3);
  let words = align(SCRIPT_TEXT[id].text, heard(mp3.replace(/\.mp3$/, ".json")), len);
  // the take's own start: trim the lead silence to 0.12 s before the first word
  const lead = Math.max(0, words[0][1] - 0.12);
  let end = Math.min(len, words[words.length - 1][2] + 0.35);
  const cut = CUT_BEFORE[id];
  if (cut) {
    const last = words.length - 1 - [...words].reverse().findIndex((w) => norm(w[0]) === cut);
    end = words[last][1] + 0.05; // a breath of the word, then the line drops
    words = words.slice(0, last + 1).map((w, k) => (k === last ? [w[0], w[1], end] : w));
  }
  words = words.map(([w, a, b]) => [w, +(a - lead).toFixed(3), +(b - lead).toFixed(3)]);
  const seconds = +(end - lead).toFixed(3);
  // the take, trimmed, as 48 kHz mono float WAV; a cut line ends on a 4 ms ramp, not a click
  const fade = cut ? `,afade=t=out:st=${(seconds - 0.004).toFixed(3)}:d=0.004` : `,afade=t=out:st=${(seconds - 0.08).toFixed(3)}:d=0.08`;
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", mp3, "-af", `atrim=start=${lead.toFixed(3)}:end=${end.toFixed(3)},asetpts=PTS-STARTPTS,aresample=48000${fade}`, "-ac", "1", "-c:a", "pcm_f32le", path.join(OUT, `${id}.wav`)]);
  gen[id] = { seconds, captions: captions(words), words };
  console.log(`${id}: ${seconds.toFixed(2)} s, ${words.length} words, ${gen[id].captions.length} captions`);
  for (const c of gen[id].captions) console.log(`   ${c.t0.toFixed(2)}-${c.t1.toFixed(2)}  ${c.text}`);
});
writeFileSync(GEN, JSON.stringify(gen, null, 1));
