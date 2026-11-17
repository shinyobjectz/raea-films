// A test of generated foley from the picture (the director, 11-11: "utilize hunyan foley at the end for scenes from an api on
// fal or made.app"): one shot's clip in, its sound out. Quote with `raea gen plan gen/foley-test.ts` before any run.
import { flow } from "raea/gen";
export default flow(({ audio }) => ({
  kitchen: audio.sfx({ prompt: "quiet footsteps on a tiled kitchen floor, soft room tone, a wooden door creaking open at the end", x_text_prompt: "quiet footsteps on a tiled kitchen floor, soft room tone, a wooden door creaking open at the end", x_video_url: "https://v3b.fal.media/files/b/0ab202a8/OmCZMHGUUdD6JOhgSJuFE_kitchen-small.mp4" }, { model: "fal:fal-ai/hunyuan-video-foley" }),
}));
