// Foley remade for the road, now one shot of 6.5 s seen from outside (the view from the car's seat was cut).
import { flow } from "raea/gen";
export default flow(({ audio }) => ({
  road: audio.sfx({ prompt: "steady rain on a forest road, wind in tall pines, a car approaching and driving through standing water with spray", x_text_prompt: "steady rain on a forest road, wind in tall pines, a car approaching and driving through standing water with spray", x_video_url: "https://v3b.fal.media/files/b/0ab204c3/r46J2cuz7qKQCJtZ3RUnt_road.mp4" }, { model: "fal:fal-ai/hunyuan-video-foley" }),
}));
