// The heat look's shots, shared by the look tests and the reel: a line of type with heat drifting through it
// (the director's "blu" reference), and a stock clip (media/thermal/stock, Mixkit Stock Video Free License) with its recipe
// for where the heat is, optionally as the HUD'd heat map.
import { staticFile, useCurrentFrame } from "raea";
import { Plate, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Text3D } from "raea/text";
import { Transform } from "raea/transform";
import { layersFor } from "./depth";
import { Heat, type HeatPalette, type Recipe, type Trace } from "./heat";
import { heat } from "./temp";
import { Hud } from "./hud";

export const FPS = 30;

const FONTS = `@font-face { font-family: 'IBM Plex Mono'; font-weight: 500; src: url(${staticFile("fonts/IBMPlexMono-Medium.ttf")}); }`;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const outCubic = (x: number) => 1 - (1 - clamp01(x)) ** 3;
const inOut = (x: number) => { const k = clamp01(x); return k * k * (3 - 2 * k); };

/** A line of type lit by heat over `span` frames: a heat front sweeps through it (letters flare as it passes, then
 * settle white with a glow round them), it holds with a slow heat haze while the camera eases in, a crisp caption
 * types on under it, and at the end it cools out through orange and blue to black. */
export function TypeShot({ text, id, size = 0.95, span = 105, caption }: { text: string; id: string; size?: number; span?: number; caption?: string }) {
  const f = useCurrentFrame();
  const REVEAL = 28, OUT = 20;
  const r = outCubic(f / REVEAL);
  const front = 0.1 + 0.95 * r;
  const flare = 3.2 * (1 - inOut((f - REVEAL * 0.75) / 12));
  // the heat the front leaves: a hot halo that settles to a warm one, breathing
  const linger = 1.3 - 0.75 * inOut((f - REVEAL) / 40) + 0.12 * Math.sin(f * 0.13);
  const cool = 1 - inOut((f - (span - OUT)) / OUT) * 1.05 + 0.03 * Math.sin(f * 0.18);
  const z = 9 - 0.55 * inOut(f / span);
  const shown = caption ? Math.floor(caption.length * clamp01((f - REVEAL + 4) / 22)) : 0;
  const capK = clamp01((f - REVEAL + 4) / 6) * (1 - inOut((f - (span - OUT)) / (OUT * 0.6)));
  return (
    <>
      <Camera3d transform={Transform.fromXyz(0, 0.02 * Math.sin(f * 0.05), z).lookingAt([0, 0, 0])} />
      <Mesh3d name={`line-${id}`} transform={Transform.fromXyz(0, caption ? 0.18 : 0, 0)}>
        <Text3D size={size} depth={0.02} weight={700}>{text}</Text3D>
        <StandardMaterial base_color={heat(1)} unlit />
      </Mesh3d>
      <Heat frame={f} recipe={{ lum: 1, gamma: 1 }} floor={0.02} gain={1.05} haze={1} front={front} soft={0.025} flare={flare} cool={Math.max(0, cool)} linger={linger} type />
      <ToneMapping mode="none" />
      {caption ? (
        <div style={{ position: "absolute", left: 0, top: 540 + size * 150, width: 1920, textAlign: "center", fontFamily: "IBM Plex Mono", fontWeight: 500, fontSize: 30, letterSpacing: 10, color: "rgba(255,255,255,0.88)", opacity: capK, whiteSpace: "pre" }}>
          <style>{FONTS}</style>
          {caption.slice(0, shown).toUpperCase()}
          <span style={{ opacity: shown < caption.length && Math.floor(f / 4) % 2 === 0 ? 1 : 0 }}>▍</span>
        </div>
      ) : null}
    </>
  );
}

export type Clip = { slug: string; at: number; recipe: Recipe; palette?: HeatPalette; floor?: number; gain?: number; dots?: number; hud?: boolean };

export const CLIPS: Record<string, Clip> = {
  fog: { slug: "drawing-a-heart-on-a-foggy-window-on-a-rainy-18308", at: 8, recipe: { inv: 1.0, gamma: 2.2 }, floor: 0.12 },
  sunset: { slug: "silhouette-of-a-hand-being-held-up-in-front-of-46762", at: 8, recipe: { inv: 1.0, gamma: 1.8 }, floor: 0.1 },
  eye: { slug: "eye-of-a-woman-looking-at-a-tablet-41180", at: 6, recipe: { skin: 0.5, lum: 0.6, gamma: 2.0 }, floor: 0.18 },
  glasses: { slug: "reflection-of-a-screen-in-glasses-221", at: 10, recipe: { skin: 0.55, lum: 0.55, gamma: 1.3 } },
  editor: { slug: "video-editor-working-on-a-large-screen-21546", at: 2, recipe: { lum: 1.0, gamma: 1.6 } },
  shadows: { slug: "silhouette-of-a-womans-hands-moving-them-gently-40938", at: 6, recipe: { inv: 1.0, gamma: 2.5 }, palette: "jet", floor: 0.05, dots: 14, hud: true },
  notebook: { slug: "close-up-a-hand-writing-notes-on-a-notebook-with-99890", at: 3, recipe: { skin: 0.55, lum: 0.45, gamma: 1.3 }, gain: 0.95 },
  cursor: { slug: "cursor-working-on-a-video-editing-software-close-up-shot-50605", at: 1, recipe: { lum: 1.0, gamma: 1.5 } },
  laptop: { slug: "hands-of-a-girl-working-on-a-computer-4938", at: 2, recipe: { skin: 0.7, lum: 0.35, gamma: 1.3 } },
  typing: { slug: "fingers-typing-extreme-close-up-41268", at: 3, recipe: { lum: 1.0, gamma: 1.0 }, floor: 0.03, gain: 1.3 },
  night: { slug: "pixabay-editor-night-345077", at: 2, recipe: { lum: 0.7, skin: 0.4, gamma: 1.4 } },
  thumbs: { slug: "pixabay-thumbs-up-20855", at: 4, recipe: { skin: 1.0, gamma: 1.0 }, floor: 0.04 },
  studio: { slug: "man-editing-a-video-in-a-studio-44075", at: 4, recipe: { lum: 1.0, gamma: 1.7 } },
  mouse: { slug: "close-shot-of-a-guy-editing-a-video-on-a-44074", at: 4, recipe: { lum: 1.0, gamma: 0.9, lift: 0.04 }, floor: 0.03, gain: 1.5 },
  grade: { slug: "color-correction-close-up-of-the-process-47208", at: 10, recipe: { lum: 1.0, gamma: 1.5 } },
  phones: { slug: "editing-a-video-on-an-audiovisual-workstation-41276", at: 6, recipe: { lum: 1.0, gamma: 1.15 }, floor: 0.04, gain: 1.3 },
  spectrum: { slug: "spectrogram", at: 14, recipe: { lum: 1.0, gamma: 1.3 }, palette: "jet", floor: 0.06, dots: 12 },
  scopes: { slug: "view-to-a-monitor-when-editing-a-video-in-a-44054", at: 3, recipe: { lum: 1.0, gamma: 1.5 } },
  team: { slug: "young-creatives-making-working-on-video-editing-23148", at: 4, recipe: { lum: 0.8, skin: 0.3, gamma: 1.1 }, floor: 0.03, gain: 1.3 },
};

/** what a shot's trace does on frame f: the scan, contours, outline and ripple (thermal/heat.tsx Trace) */
export type TraceAt = (f: number) => Omit<Trace, "layers" | "frame" | "inv">;

/** a stock clip through the heat pass, from `at` seconds into it (the clip's own start unless given), in its
 * palette unless given, with marks drawn over it; with `trace` (and `span`, the shot's seconds), the scene is traced
 * from its depth (thermal/depth.ts) */
export function ClipShot({ name, at, palette, hud, trace, span = 6, children }: { name: keyof typeof CLIPS | string; at?: number; palette?: HeatPalette; hud?: boolean; trace?: TraceAt; span?: number; children?: React.ReactNode }) {
  const f = useCurrentFrame();
  const c = CLIPS[name];
  const from = at ?? c.at;
  const t = from + f / FPS;
  const d = trace ? layersFor(name, from, span) : null;
  return (
    <>
      <Camera3d transform={Transform.fromXyz(0, 0, 5).lookingAt([0, 0, 0])} />
      <Plate src={staticFile(`thermal/stock/${c.slug}.mp4`)} time={t} name={`plate-${name}`} />
      <Heat frame={f} recipe={c.recipe} palette={palette ?? c.palette} floor={c.floor} gain={c.gain} dots={c.dots} trace={d && trace ? { layers: d.layers, frame: d.index(t), inv: d.inv, ...trace(f) } : undefined} />
      <ToneMapping mode="none" />
      {hud ?? c.hud ? <Hud rows={[["WATCHING", "ON"], ["LISTENING", "ON"], ["YOUR WORDS", "READ"]]} pick={2} tabs={["TOUCH", "NOTES", "PICKS", "MARKS"]} arcs={[[[0.42, 0.4], [0.62, 0.62]], [[0.62, 0.62], [0.85, 0.55]], [[0.42, 0.4], [0.85, 0.55]]]} /> : null}
      {children}
    </>
  );
}
