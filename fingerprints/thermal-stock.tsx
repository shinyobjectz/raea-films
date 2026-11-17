// Look test: Mixkit stock (media/thermal/stock, Mixkit Stock Video Free License) through the heat pass
// (thermal/heat.tsx), two seconds a clip, each with its own recipe for where the heat is.
// Stills: raea render thermal-stock.tsx --at 30,90,... (the middle of each clip)
import { AbsoluteFill, Composition, Sequence, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Plate, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Transform } from "raea/transform";
import { Heat, type HeatPalette, type Recipe } from "./thermal/heat";
import { Hud } from "./thermal/hud";

const FPS = 30;
const EACH = 60;

export const CLIPS: { slug: string; at: number; recipe: Recipe; palette?: HeatPalette; floor?: number; gain?: number; dots?: number; hud?: boolean }[] = [
  { slug: "drawing-a-heart-on-a-foggy-window-on-a-rainy-18308", at: 8, recipe: { inv: 1.0, gamma: 2.2 }, floor: 0.12 },
  { slug: "silhouette-of-a-hand-being-held-up-in-front-of-46762", at: 8, recipe: { inv: 1.0, gamma: 1.8 }, floor: 0.1 },
  { slug: "eye-of-a-woman-looking-at-a-tablet-41180", at: 6, recipe: { skin: 0.5, lum: 0.6, gamma: 2.0 }, floor: 0.18 },
  { slug: "reflection-of-a-screen-in-glasses-221", at: 10, recipe: { skin: 0.55, lum: 0.55, gamma: 1.3 } },
  { slug: "video-editor-working-on-a-large-screen-21546", at: 8, recipe: { lum: 1.0, gamma: 1.6 } },
  { slug: "silhouette-of-a-womans-hands-moving-them-gently-40938", at: 6, recipe: { inv: 1.0, gamma: 2.5 }, palette: "jet", floor: 0.05, dots: 14, hud: true },
  { slug: "close-up-a-hand-writing-notes-on-a-notebook-with-99890", at: 4, recipe: { skin: 0.8, lum: 0.3, gamma: 1.2 } },
];

function Clip({ i }: { i: number }) {
  const f = useCurrentFrame();
  const c = CLIPS[i];
  return (
    <>
      <Camera3d transform={Transform.fromXyz(0, 0, 5).lookingAt([0, 0, 0])} />
      <Plate src={staticFile(`thermal/stock/${c.slug}.mp4`)} time={c.at + f / FPS} name={`plate-${i}`} />
      <Heat frame={f + i * 100} recipe={c.recipe} palette={c.palette} floor={c.floor} gain={c.gain} dots={c.dots} />
      <ToneMapping mode="none" />
      {c.hud ? <Hud rows={[["WATCHING", "ON"], ["LISTENING", "ON"], ["YOUR WORDS", "READ"]]} pick={2} tabs={["TOUCH", "NOTES", "PICKS", "MARKS"]} arcs={[[[0.42, 0.4], [0.62, 0.62]], [[0.62, 0.62], [0.85, 0.55]], [[0.42, 0.4], [0.85, 0.55]]]} /> : null}
    </>
  );
}

function Board() {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {CLIPS.map((_, i) => (
        <Sequence key={i} from={i * EACH} durationInFrames={EACH}>
          <Clip i={i} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="thermal-stock" width={1920} height={1080} fps={FPS} durationInFrames={CLIPS.length * EACH} component={Board} />);
