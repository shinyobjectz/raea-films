// Reads Adreßbuch columns with Claude (vision): tesseract's Fraktur models misread too many house numbers and names
// in this print to parse (ocr.sh, compared on page 4322). Each text column (columns.ts) is cut into pieces of about
// 900 px at its emptiest rows, so no printed line is split, enlarged 1.5x, and read line by line. Each piece's reading
// is kept in cache/adressbuch/1917/read/ORDER-COL-K.txt and never asked for twice.
// The call goes through OpenRouter (the key this machine has) with Anthropic's SDK on OpenRouter's Messages endpoint.
//   bun transcribe.ts ORDER:COLS..   e.g. 4322:5-8 4323:1-8 4324:1-2
// Prints the pieces read and the tokens and dollars spent.
//   MODEL=anthropic/claude-haiku-5.5 OUT=read-haiku bun transcribe.ts ...   reads with another model into another
//   folder (to score a model against Opus's readings: score.ts).
//   MODEL=png OUT=pieces bun transcribe.ts ...   writes each piece's image (ORDER-COL-K.png) as a model would see it
//   and reads nothing, for a local reader (kraken.sh).
//   MODEL=cli:opus OUT=read bun transcribe.ts ...   reads through the Claude CLI (`claude -p`) on the signed-in plan
//   instead of the API: one turn per piece, the image in the message, no tools, no MCP servers, no settings or hooks,
//   from a folder with no CLAUDE.md or memory, so a piece costs about what the API call does (about 1,900 tokens in;
//   the CLI's total_cost_usd, which a plan doesn't bill, is printed as what it would have cost).
import Anthropic from "@anthropic-ai/sdk";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, "../.."), book = join(root, "cache/adressbuch/1917");
const out = join(book, process.env.OUT ?? "read");
mkdirSync(out, { recursive: true });
const key = process.env.OPENROUTER_API_KEY;
if (!key && !/^(png|cli:)/.test(process.env.MODEL ?? "")) throw new Error("OPENROUTER_API_KEY is not set (source ~/.raea/env)");
const client = new Anthropic({ baseURL: "https://openrouter.ai/api", authToken: key, apiKey: null });
const MODEL = process.env.MODEL ?? "anthropic/claude-opus-5.5", PIECE = 900, LIMIT = Number(process.env.LIMIT ?? Infinity);

const SYSTEM = `You transcribe scans from the Berliner Adreßbuch 1917, Part III (streets and their houses), printed in Fraktur.
Transcribe every printed line in reading order, one output line per printed line, in modern Latin letters: long s as s, ligatures as their letters, umlauts kept.
Keep every abbreviation, punctuation mark and number exactly as printed. Do not expand, correct or complete anything.
In a house's block the house number hangs at the left, each entry (a person, a firm, the owner E., the manager V.) starts at the text edge, and the second and later printed lines of one entry are indented further.
Write a house-number line as the number as printed (for example 12, 12a, 15-16), a space, then the rest of that line.
Write an entry's first line with two spaces in front, and each further line of the same entry with two spaces and "+ " in front.
Write a cross-street marker (a street or square name set between two arrows) as: <- Name ->
Write a heading (a street's name in large type, its postal district line, its history line) as: # text
Keep the telephone mark T or T. where it is printed.
Write an unreadable word as [?]. For a diagram, a map or a rule, write [diagram] once in its place.
Output only the transcription, no comments.`;

function sh(cmd: string[]): Uint8Array {
  const r = Bun.spawnSync(cmd);
  if (r.exitCode !== 0) throw new Error(`${cmd[0]} failed: ${r.stderr}`);
  return new Uint8Array(r.stdout);
}

/** Cut rows for a column image: every PIECE px, moved to the row with the least ink within 60 px. */
function cuts(img: string, h: number): number[] {
  const ink = sh(["magick", img, "-colorspace", "gray", "-negate", "-threshold", "50%", "-scale", `1x${h}!`, "-depth", "8", "gray:-"]);
  const at = [0];
  for (let y = PIECE; y < h - PIECE / 3; y += PIECE) {
    let best = y;
    for (let d = -60; d <= 60; d++) if (y + d > 0 && y + d < h && ink[y + d] < ink[best]) best = y + d;
    at.push(best);
    y = best;
  }
  at.push(h);
  return at;
}

let input = 0, output = 0, read = 0, planCost = 0;
// One piece through `claude -p` (MODEL=cli:NAME). The CLI trims the answer's leading spaces, which mark an entry's
// first line, so the first line gets them back unless it is a house number, a heading, a marker or a note.
const cliHome = join(tmpdir(), "addr-cli");
mkdirSync(cliHome, { recursive: true });
function cli(model: string, png: Uint8Array, note: string, file: string): string {
  const msg = { type: "user", message: { role: "user", content: [
    { type: "image", source: { type: "base64", media_type: "image/png", data: Buffer.from(png).toString("base64") } },
    { type: "text", text: note },
  ] } };
  const r = Bun.spawnSync(["claude", "-p", "--input-format", "stream-json", "--output-format", "stream-json", "--verbose",
    "--model", model, "--effort", "low", "--system-prompt", SYSTEM, "--tools", "", "--strict-mcp-config", "--setting-sources", "",
    "--no-session-persistence"], { cwd: cliHome, stdin: Buffer.from(JSON.stringify(msg) + "\n") });
  const result = new TextDecoder().decode(r.stdout).split("\n").filter((l) => l.startsWith("{")).map((l) => JSON.parse(l)).find((e) => e.type === "result");
  if (!result || result.is_error || result.subtype !== "success") throw new Error(`${file}: the CLI failed (${result?.subtype ?? `exit ${r.exitCode}`}): ${new TextDecoder().decode(r.stderr).slice(0, 300)}`);
  planCost += result.total_cost_usd ?? 0;
  const [first, ...rest] = (result.result as string).split("\n");
  const f = first.trimStart();
  return [/^(\d|#|<-|\[)/.test(f) ? f : `  ${f}`, ...rest].join("\n");
}
for (const arg of process.argv.slice(2)) {
  const [order, cols] = arg.split(":"), [c0, c1] = cols.split("-").map(Number);
  const page = join(book, `${order}.jpg`);
  const columns = new TextDecoder().decode(sh(["bun", join(here, "columns.ts"), page])).trim().split("\n").map((l) => l.split(" ").map(Number));
  const [w, h] = new TextDecoder().decode(sh(["identify", "-format", "%w %h", page])).split(" ").map(Number);
  for (let c = c0; c <= (c1 || c0); c++) {
    const [x0, x1] = columns[c - 1], a = Math.max(0, x0 - 16), b = Math.min(w, x1 + 4);
    const col = join(out, `.col-${order}-${c}.png`);
    if (MODEL === "png") console.error(`${order}:${c}`); // progress, so a long cut of many columns is seen to be alive
    sh(["magick", page, "-crop", `${b - a}x${h}+${a}+0`, "+repage", col]);
    const rows = cuts(col, h);
    for (let k = 0; k + 1 < rows.length; k++) {
      const file = join(out, `${order}-${c}-${k + 1}.txt`);
      if (existsSync(MODEL === "png" ? file.replace(/\.txt$/, ".png") : file)) continue; // a piece already read (or cut)
      if (read >= LIMIT) break;
      const png = sh(["magick", col, "-crop", `${b - a}x${rows[k + 1] - rows[k]}+0+${rows[k]}`, "+repage", "-filter", "Lanczos", "-resize", "150%", "png:-"]);
      if (MODEL === "png") { await Bun.write(file.replace(/\.txt$/, ".png"), png); read++; continue; }
      if (MODEL.startsWith("cli:")) {
        const text = cli(MODEL.slice(4), png, `Page ${order}, column ${c}, piece ${k + 1} of ${rows.length - 1}.`, file);
        await Bun.write(file, text.trimEnd() + "\n");
        read++;
        console.error(`${order}-${c}-${k + 1}: ${text.split("\n").length} lines`);
        continue;
      }
      const res = await client.messages.create({
        model: MODEL, max_tokens: 16000, system: SYSTEM, output_config: { effort: "low" },
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: "image/png", data: Buffer.from(png).toString("base64") } },
          { type: "text", text: `Page ${order}, column ${c}, piece ${k + 1} of ${rows.length - 1}.` },
        ] }],
      });
      if (res.stop_reason === "refusal" || res.stop_reason === "max_tokens") throw new Error(`${file}: stopped (${res.stop_reason})`);
      const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
      await Bun.write(file, text.trimEnd() + "\n");
      input += res.usage.input_tokens; output += res.usage.output_tokens; read++;
      console.error(`${order}-${c}-${k + 1}: ${text.split("\n").length} lines`);
    }
    await Bun.file(col).delete();
  }
}
// dollars per million tokens in and out, by model (OpenRouter's list, 2026-11-17)
const PRICE: Record<string, [number, number]> = {
  "anthropic/claude-opus-5.5": [4, 20], "anthropic/claude-sonnet-5.5": [2, 10], "anthropic/claude-haiku-5.5": [0.1, 0.5],
};
const [pin, pout] = PRICE[MODEL.replace(/:batch$/, "")] ?? [NaN, NaN], half = MODEL.endsWith(":batch") ? 0.5 : 1;
if (MODEL.startsWith("cli:")) console.log(`${MODEL}: ${read} pieces read on the plan, $${planCost.toFixed(3)} at API prices (not billed)`);
else console.log(`${MODEL}: ${read} pieces read, ${input} tokens in, ${output} out, $${(((input * pin + output * pout) * half) / 1e6).toFixed(3)}`);
