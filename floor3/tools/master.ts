// The picture master without VideoToolbox (it starves near-black of bits and blotches the dark): raea renders PNG
// frames into a folder, and this feeds each finished frame to x264 (crf 12, aq-mode 3 for the darks, BT.709 like the
// engine's own export) and deletes it, so the whole film never sits on disk as PNGs. If x264 falls behind, the render is
// paused (SIGSTOP) until the backlog drains.
// Usage: bun tools/master.ts [out.mp4] [composition id: floor3 | floor3-tall | floor3-turn] [frames: the first N only]
import { spawn } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, rmSync, statSync, unlinkSync, watch } from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = process.argv[2] ?? `${ROOT}out/floor3-picture.mp4`;
const COMP = process.argv[3] ?? "floor3";
const DIR = `${ROOT}.cache/frames-${COMP}`;
/** every frame of the recorded session (the composition's own length), or the first N */
const ALL: number = JSON.parse(readFileSync(`${ROOT}game/run.gen.json`, "utf8")).frames;
const TOTAL = process.argv[4] ? Math.min(ALL, Number(process.argv[4])) : ALL;
// frames waiting on disk (about 2.6 MB each): at most about 3 GB, or PAUSE_AT frames when the disk is short
const PAUSE_AT = Number(process.env.PAUSE_AT ?? 1200), RESUME_AT = Math.round(PAUSE_AT / 3);

rmSync(DIR, { recursive: true, force: true });
mkdirSync(DIR, { recursive: true });
const log = (m: string) => console.log(`${(performance.now() / 1000).toFixed(1).padStart(7)} s  ${m}`);

const render = spawn("raea", ["render", `${ROOT}compositions/floor3.tsx`, "--composition", COMP, ...(TOTAL < ALL ? ["--frames", String(TOTAL)] : []),
  "-o", `${DIR}/`, "--manifest", `${ROOT}out/render-${COMP}.json`], {
  env: { ...process.env, RAEA_READBACK: "rgba" }, stdio: ["ignore", "inherit", "inherit"],
});
let rendered = false, renderCode = 0;
render.on("exit", (code) => { rendered = true; renderCode = code ?? 1; log(`render exited ${code}`); wake(); });

const enc = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-c:v", "png", "-framerate", "60", "-i", "-",
  "-vf", "scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p",
  "-c:v", "libx264", "-preset", "slow", "-crf", "12", "-x264-params", "aq-mode=3:aq-strength=0.9:deblock=-1,-1",
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
  "-r", "60", "-movflags", "+faststart", OUT], { stdio: ["pipe", "inherit", "inherit"] });
const encDone = new Promise<number>((res) => enc.on("exit", (c) => res(c ?? 1)));

const name = (i: number) => `${DIR}/frame-${String(i).padStart(5, "0")}.png`;
/** a PNG is whole once it ends in its IEND chunk */
function whole(p: string): boolean {
  if (!existsSync(p)) return false;
  const n = statSync(p).size;
  if (n < 64) return false;
  const fd = openSync(p, "r"), b = Buffer.alloc(8);
  readSync(fd, b, 0, 8, n - 8);
  closeSync(fd);
  return b.toString("hex") === "49454e44ae426082";
}

let waiter: (() => void) | null = null;
function wake() { const w = waiter; waiter = null; w?.(); }
const watcher = watch(DIR, () => wake());
const next = () => new Promise<void>((res) => { waiter = res; setTimeout(wake, 250); });

let paused = false, i = 0;
while (true) {
  const p = name(i);
  if (whole(p)) {
    const buf = readFileSync(p);
    if (!enc.stdin.write(buf)) await new Promise<void>((res) => enc.stdin.once("drain", () => res()));
    unlinkSync(p);
    i++;
    if (i % 600 === 0) log(`${i} of ${TOTAL} frames encoded`);
    const backlog = readdirSync(DIR).length;
    if (!paused && !rendered && backlog > PAUSE_AT) { render.kill("SIGSTOP"); paused = true; log(`paused the render: ${backlog} frames waiting`); }
    if (paused && backlog < RESUME_AT) { render.kill("SIGCONT"); paused = false; log("resumed the render"); }
    continue;
  }
  if (rendered && !existsSync(p)) break;
  await next();
}
watcher.close();
enc.stdin.end();
const code = await encDone;
rmSync(DIR, { recursive: true, force: true });
log(`encoded ${i} frames to ${OUT} (render ${renderCode}, x264 ${code})`);
if (renderCode !== 0 || code !== 0 || i !== TOTAL) { console.error(`master failed: ${i} of ${TOTAL} frames`); process.exit(1); }
