// The faces shot's stages (v3/faces.tsx draws them; tools/faces.sh reads them for the DLSS pass). the director, 11-12: "i want
// to change the face scene so the circle of the hallway mathc cuts formas the wireframe of the first person, we only show
// him, and as we slowly pull out the face starts to form features and clay and textyre and the basic look then the dlss
// look to the piano until it gets to the next scee."
// One man (turbo), one pull-out, no cuts. Each stage comes on a beat of the song in the shot (stay.song.json: 72.88 the
// downbeat and its kick, 73.50, 74.12; the sea cuts in at 74.76), as frames of the shot (it starts at 72.261 s):
//   0       the torii's drawn circle is his head in the film's line drawing; his triangles settle in (the features form)
//   CLAY    clay sweeps over him from the nose back, the drawing's edge crossing his head as a line of light
//   SKIN    his own skin and clothes: the plain render
//   DLSS    the DLSS pass fades in over DLSS_FADE frames and holds to the cut
// (it was six match cuts between five people and their styles, the director, 11-11; the other four are out of the shot)
import { shot } from "./plan";
export const FPS = 30;
export const LEN = shot("faces").frames;
const at = (s: number) => Math.round((s - shot("faces").from) * FPS);
export const CLAY = at(72.88), SKIN = at(73.5), DLSS = at(74.12), DLSS_FADE = 6;
