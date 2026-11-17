// The film's picture from its shots (DIR/ID.mp4), in the plan's order, as one file. The opening's worlds are one take:
// each is rendered TAIL frames past its join (v3/plan.ts), and here those frames are blended into the first frames of
// the world that follows, so the take has no cut in it. Everything else is laid end to end.
//   bun tools/join.ts DIR OUT.mp4 [CRF=14]
// The intro (DIR/intro.mp4: the threshold itself before the song, v3/film.tsx IntroPlay) goes first, and stands in for
// the hallway's first INTRO_OVER frames. It is the same scene on the same clock, so it runs straight on into the
// hallway's frames with no cut and no blend (the director, 11-12: "we literally dont distingush two scenes ... theres no
// creative cur or crossfade").
import { INTRO_OVER, SHOTS, TAIL, tailOf } from "../v3/plan";
const [dir, out, crf = "14"] = process.argv.slice(2);
const ins: string[] = ["-i", `${dir}/intro.mp4`], seq: string[] = ["[intro]"];
const f: string[] = ["[0:v]setpts=PTS-STARTPTS[intro]"];
let carry = "";                                                              // the last shot's tail, waiting to be blended in
SHOTS.forEach((s, n) => {
  const i = n + 1;                                                           // (input 0 is the intro)
  ins.push("-i", `${dir}/${s.id}.mp4`);
  const tail = tailOf(s.id);
  let body = `[${i}:v]`;
  if (n === 0) { f.push(`[${i}:v]trim=start_frame=${INTRO_OVER},setpts=PTS-STARTPTS[from${i}]`); body = `[from${i}]`; }
  if (tail) { f.push(`[${i}:v]split[b${i}][t${i}]`, `[t${i}]trim=start_frame=${s.frames}:end_frame=${s.frames + tail},setpts=PTS-STARTPTS[tail${i}]`); body = `[b${i}]`; }
  if (carry) {
    f.push(`${body}split[h${i}][r${i}]`, `[h${i}]trim=end_frame=${TAIL},setpts=PTS-STARTPTS[head${i}]`, `[r${i}]trim=start_frame=${TAIL}:end_frame=${s.frames},setpts=PTS-STARTPTS[rest${i}]`,
      `${carry}[head${i}]blend=all_expr='A*(1-(N+1)/${TAIL + 1})+B*(N+1)/${TAIL + 1}'[mix${i}]`);
    seq.push(`[mix${i}]`, `[rest${i}]`);
  } else { f.push(`${body}trim=end_frame=${s.frames},setpts=PTS-STARTPTS[v${i}]`); seq.push(`[v${i}]`); }
  carry = tail ? `[tail${i}]` : "";
});
f.push(`${seq.join("")}concat=n=${seq.length}:v=1:a=0,format=yuv420p[v]`);
const r = Bun.spawnSync(["ffmpeg", "-y", "-loglevel", "error", ...ins, "-filter_complex", f.join(";"), "-map", "[v]", "-r", "30", "-c:v", "libx264", "-preset", "fast", "-crf", crf, "-colorspace", "bt709", "-color_trc", "bt709", "-color_primaries", "bt709", out], { stderr: "inherit" });
process.exit(r.exitCode ?? 1);
