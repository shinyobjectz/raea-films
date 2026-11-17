// Stay: the raea 0.1.1 film (brief.ts, storyboard stay.script.ts approved 11-11). This is its graybox: every shot
// blocked in grey (blender/blockout.py), on its camera and its beat of the song (parts/plan.ts, parts/cams.ts), the
// cursor in the space leaving its comments, the agent's changes landing on the beats, and the app's pictures as
// placeholders that say so until the real captures are made. The song is the only sound.
import { AbsoluteFill, Audio, Composition, Sequence, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Canvas3D, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { DirectionalLight, SolariLighting } from "raea/light";
import { Transform } from "raea/transform";
import { CAMS, camAt, fovOf } from "./parts/cams";
import { COMMENTS, FPS, FRAMES, H, SCREENS, SHOTS, SEGMENTS, SONG, W, shotAt, type Shot } from "./parts/plan";
import { Card, Cursor, type V3 } from "./parts/kit";
import { lightOf } from "./parts/light";
import { Pool, poolSun } from "./parts/pool";
import { SEA_SUN, Sea } from "./parts/sea";
import { AppDark, Burst, Hero } from "./parts/app";
import { Canyon, canyonSun } from "./parts/canyon";
import { GLASS_SUN, Glass } from "./parts/glass";
import { MOON, PAINT_MOON, Paint, Road } from "./parts/road";
import { CommentPlaceholder, EndCard, ScreenPlaceholder, WordPicture, Words } from "./parts/type";

const UNDER = { from: [0.3, -50, 0.2] as V3, to: [0, 0, 0] as V3 };

function sunOf(s: Shot, t: number): { from: V3; to: V3 } {
  switch (s.place) {
    case "pool": return poolSun(s.name, s.v!, t);
    case "sea": case "hero": return SEA_SUN;
    case "canyon": return canyonSun(t, s.name === "m-canyon" ? 6 : s.name === "m-canyon-r" ? 62 : undefined);
    case "glass": case "glass-app": return GLASS_SUN;
    case "road": return MOON;
    case "paint": return PAINT_MOON;
    default: return UNDER;
  }
}

function PlaceAt({ s, t }: { s: Shot; t: number }) {
  const m = s.name.startsWith("m-");
  switch (s.place) {
    case "pool": return <Pool shot={s.name} v={s.v!} t={t} />;
    case "sea": return <Sea t={t} held={s.name === "sea-held"} reroll={s.reroll} />;
    case "app-dark": return <AppDark t={t} />;
    case "burst": return <Burst t={t} from={s.t} />;
    case "canyon": return <Canyon v={s.v!} />;
    case "glass": return <Glass t={m ? 99 : t} reroll={s.reroll} />;
    case "glass-app": return <Glass t={t} app />;
    case "road": return <Road t={t} v={s.v!} reroll={s.reroll} montage={m} />;
    case "paint": return <Paint t={t} montage={m} />;
    case "hero": return <Hero t={t} />;
    default: return null;
  }
}

function Film({ silent = false }: { silent?: boolean }) {
  const f = useCurrentFrame();
  const t = f / FPS;
  const { s, since } = shotAt(t);
  const cam = camAt(t);
  const sun = sunOf(s, t);
  const L = lightOf(s);
  // a sun parked under the floor has no strength: at full strength it leaks light up through the floor. Its strength
  // holds from a render's first frame, and the sun is parked or in place for a whole segment (parts/plan.ts SEGMENTS)
  const lux = sun.from[1] < 0 ? 0 : L.lux;
  const cut = since < 0.5 / FPS;
  const comments = COMMENTS.filter((c) => c.shot === s.name);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {s.place !== "black" && s.place !== "card" && (
        <Canvas3D>
          <Camera3d transform={Transform.fromXyz(...cam.pos).lookingAt(cam.look)} projection={{ Perspective: { fov: fovOf(cam.mm), near: 0.03, far: 3000 } }}>
            <SolariLighting bounces={2} reset={cut} />
          </Camera3d>
          <ToneMapping mode="agx" exposure={L.ev} />
          <DirectionalLight name="sun" illuminance={lux} color="#ffd2a8" shadow_maps_enabled transform={Transform.fromXyz(...sun.from).lookingAt(sun.to)} />
          <PlaceAt s={s} t={t} />
          {comments.map((c) => <Cursor key={`cur-${c.n}`} c={c} t={t} cam={cam} />)}
          {comments.map((c) => <Card key={`card-${c.n}`} c={c} t={t} cam={cam} />)}
        </Canvas3D>
      )}
      {s.place === "card" && <EndCard t={t} from={s.t} />}
      <Words t={t} />
      {!silent && <Audio name="song" src={staticFile(SONG.file)} />}
    </AbsoluteFill>
  );
}

function Sound() {
  return <AbsoluteFill style={{ background: "#000" }}><Audio name="song" src={staticFile(SONG.file)} /></AbsoluteFill>;
}
/** a shot alone (silent): an engine render keeps some of its first frame's state (the sun's strength), so the film
 *  renders a shot a chunk (tools/film.sh) */
const chunk = (from: number) => () => (
  <Sequence from={-from} durationInFrames={FRAMES} layout="none">
    <Film silent />
  </Sequence>
);

registerRoot(() => (
  <>
    <Composition id="stay" component={Film} width={W} height={H} fps={FPS} durationInFrames={FRAMES} />
    <Composition id="stay-sound" component={Sound} width={W} height={H} fps={FPS} durationInFrames={FRAMES} />
    {SEGMENTS.map((g, i) => <Composition key={`seg-${i}`} id={`chunk-${String(i).padStart(2, "0")}`} component={chunk(g.from)} width={W} height={H} fps={FPS} durationInFrames={g.to - g.from} />)}
    {COMMENTS.map((c) => <Composition key={`ph-c${c.n}`} id={`ph-comment-${c.n}`} component={() => <CommentPlaceholder c={c} />} width={900} height={300} fps={FPS} durationInFrames={1} />)}
    {[...new Set(SCREENS.map((x) => x.file))].map((n) => <Composition key={`ph-${n}`} id={`ph-${n}`} component={() => <ScreenPlaceholder name={n} />} width={1920} height={1200} fps={FPS} durationInFrames={1} />)}
    <Composition id="word-wetter" component={() => <WordPicture text="wetter" />} width={1200} height={420} fps={FPS} durationInFrames={1} />
  </>
));
export { CAMS };
