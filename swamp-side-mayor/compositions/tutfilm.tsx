// The tutorial, "Goose Learns raea" (brief.ts, tutorial-v9.script.ts): its picture, 1920 x 1080 at 30 fps, every beat a
// shot from components/tut/shots.ts on the tutorial's set (components/tut/), the take's real app on the giant glass. No
// slates and no burned-in captions (the SRT ships beside it). The keys Goose presses come up once as keycap stickers;
// his muddy foot lands on the Fingerprint page; at the end the finished music video plays on the glass, in time with
// the song in the soundtrack (components/tut/sound.tsx). Silent: the soundtrack (out/tut/sound/tutsound.wav) is muxed
// on after, so the film renders a chapter at a time (tutfilm-00 .. tutfilm-11, joined by tools/tutfilm.sh) as well as
// whole (tutfilm).
import { AbsoluteFill, Composition, Img, Sequence, Video, interpolate, registerRoot, staticFile, useCurrentFrame } from "raea";
import { AntiAliasing, FramePass, Model, Screen } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Transform } from "raea/transform";
import { SUN, TutWorld } from "../components/tut/world";
import { Emote, TutCritters, headOf, project } from "../components/tut/reviewers";
import { STICKER, stickerUniforms } from "./sticker";
import { STAGE, type V3 } from "./plan";
import { TutMachine, GLASS, TMON } from "../components/tut/machine";
import { BEATS, FPS, PECKS, SECONDS, SONG, STICKERS, S, appRun, appView, beatAt, filmRuns, fr, glassCam, gooseAt, stateAt, swampCam, type AppView, type Fx, type GooseAt, type Sticker } from "../components/tut/shots";
import { Desktop, DiscordCard, EndCard, FingerprintCheck, FingerprintGather, Fonts, GooseLabel, LearnHere, LogoRing, PowerOn, StandingRule } from "../components/tut/v9";


const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** the music video on the glass: letterboxed 2:1 inside the 16:9 screen, a hair in front of it */
function SongOnGlass() {
  const w = TMON.screen[0];
  return (
    <Screen name="song" crt={false} resolution={[1600, 800]} size={[w, w / 2]} position={[GLASS[0], GLASS[1], GLASS[2] + 0.004]} pass="ui" from={fr(SONG.at)}>
      <Video src={staticFile(SONG.src)} startFrom={fr(SONG.from)} muted style={{ width: 1600, height: 800, objectFit: "cover" }} />
    </Screen>
  );
}

/** the capture on the glass at a film second ("song" for the music video, null for the dark glass) */
function screenAt(t: number): string | null {
  const { part, local, partSeconds } = beatAt(t);
  if ("black" in part || "flat" in part) return null;
  if ("glass" in part || "app" in part) { const s = stateAt(part, local, partSeconds); return s && S(s); }
  return part.screen ?? null;
}
/** the next capture the glass will show, within the second ahead, to load it before it's needed */
function nextScreen(t: number, now: string | null): string | null {
  for (const d of [0.15, 0.4, 0.7, 1.0]) { const s = screenAt(t + d); if (s && s !== now && s !== "song") return s; }
  return null;
}

/** the pointer, drawn as the Mac draws it (white, black edge, a soft shadow), its tip on (x, y); pressed, it sinks */
function Pointer({ x, y, h, held }: { x: number; y: number; h: number; held: boolean }) {
  const s = (h / 19) * (held ? 0.88 : 1);
  return (
    <svg width={14 * s} height={21 * s} viewBox="-1 -1 14 21" style={{ position: "absolute", left: x - s, top: y - s, overflow: "visible", filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.45))" }}>
      <path d="M0 0 L0 16.2 L3.9 12.5 L6.6 18.6 L9.2 17.5 L6.6 11.6 L11.6 11.6 Z" fill="#fff" stroke="#000" strokeWidth={1.1} strokeLinejoin="round" />
    </svg>
  );
}

/** the app full-frame (an App part): the capture filling the frame (its 1600 x 900 at 1.2), the camera's zoom about its
 * centre, the take's pointer over it, and a ring where it clicks, so a viewer sees what was pressed */
function AppFrame({ v, t }: { v: AppView; t: number }) {
  const s = 1.2 * v.z, tx = 960 - v.cx * s, ty = 540 - v.cy * s;
  const x = tx + v.px * s, y = ty + v.py * s, h = 22 * Math.max(1, s / 1.2);
  const click = PECKS.find((p) => t >= p - 0.02 && t < p + 0.45);
  const u = click != null ? (t - click + 0.02) / 0.47 : 0;
  return (
    <AbsoluteFill style={{ background: "#0b0b0c", overflow: "hidden" }}>
      <Img src={staticFile(S(v.state))} style={{ position: "absolute", left: 0, top: 0, width: 1600, height: 900, transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(4)})`, transformOrigin: "0 0" }} />
      {v.spot && (() => {   // the spotlight: four dark panes round the control the line names, and a ring on it
        const [rx, ry, rw, rh] = v.spot.rect, x0 = tx + rx * s, y0 = ty + ry * s, x1 = x0 + rw * s, y1 = y0 + rh * s, a = (v.spot.dim * v.spot.o).toFixed(3), dim = `rgba(6, 6, 8, ${a})`;
        return (
          <>
            <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: Math.max(0, y0), background: dim }} />
            <div style={{ position: "absolute", left: 0, top: y1, width: 1920, height: Math.max(0, 1080 - y1), background: dim }} />
            <div style={{ position: "absolute", left: 0, top: y0, width: Math.max(0, x0), height: y1 - y0, background: dim }} />
            <div style={{ position: "absolute", left: x1, top: y0, width: Math.max(0, 1920 - x1), height: y1 - y0, background: dim }} />
            <div style={{ position: "absolute", left: x0 - 3, top: y0 - 3, width: x1 - x0 + 6, height: y1 - y0 + 6, borderRadius: 10, border: `3px solid rgba(255, 214, 74, ${(0.95 * v.spot.o).toFixed(3)})`, boxShadow: `0 0 18px rgba(255, 214, 74, ${(0.35 * v.spot.o).toFixed(3)})` }} />
          </>
        );
      })()}
      {click != null && (
        <div style={{ position: "absolute", left: x - 34 * u - 8, top: y - 34 * u - 8, width: 2 * (34 * u + 8), height: 2 * (34 * u + 8), borderRadius: "50%", border: `${(4 * (1 - u) + 1).toFixed(2)}px solid rgba(255, 214, 74, ${(0.9 * (1 - u)).toFixed(3)})` }} />
      )}
      <Pointer x={x} y={y} h={h} held={v.held || (click != null && u < 0.25)} />
    </AbsoluteFill>
  );
}

function Shot() {
  const frame = useCurrentFrame(), t = frame / FPS;
  const { b, part, k, local, partSeconds } = beatAt(t);
  // under an app shot, a 3D camera that sees nothing (the app's frame is opaque): raea puts the ink pass on the cameras
  // there when a run of frames loads and turns their multisampling off for its depth; a camera first made at a cut from
  // the app kept it on, and the GPU refused the pass (chapter 07, frame 747, the cut to the frogs)
  if ("app" in part) return (
    <>
      <Camera3d transform={Transform.fromXyz(0, 2, 10).lookingAt([0, 1, 0], [0, 1, 0])} projection={{ Perspective: { fov: (40 * Math.PI) / 180, far: 900 } }} />
      <AntiAliasing mode="none" />
      <AppFrame v={appView(part, local, partSeconds, appRun(t))} t={t} />
    </>
  );
  if ("flat" in part) return part.flat === "desktop" ? <Desktop local={local} click={part.click} open={part.open} fill={part.fill} end={part.end} /> : <EndCard u={local} />;
  if ("black" in part) {
    const o = interpolate(t - (b.start), [0.2, 0.7], [0, 1], clamp);
    return (
      <AbsoluteFill style={{ background: "#000", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 34, opacity: o }}>
        <img src={staticFile("logo/raea-lockup.png")} style={{ width: 560 }} />
        <div style={{ color: "#fff", font: "500 40px/1 Inter, sans-serif", letterSpacing: 0.5 }}>raea.io/docs</div>
      </AbsoluteFill>
    );
  }
  let eye: V3, at: V3, fov = 30, screen: string | null = null, frogs: "hop" | "jump" | undefined;
  const goose = gooseAt(t);
  const cast = "cast" in part ? part.cast : undefined, emote = "emote" in part ? part.emote : undefined;
  if ("glass" in part) {
    ({ eye, at } = glassCam(part.focus, 0.035 * k));
    screen = stateAt(part, local, partSeconds);
    screen = screen && S(screen);
  } else {
    ({ eye, at } = swampCam(part, k, goose?.p)); fov = part.fov ?? 40; screen = part.screen ?? null; frogs = part.frogs;
  }
  const song = screen === "song";
  const onGlass = "glass" in part;
  const fx: Fx[] = "fx" in part ? part.fx ?? [] : [];
  return (
    <>
      <Camera3d transform={Transform.fromXyz(...eye).lookingAt(at, [0, 1, 0])} projection={{ Perspective: { fov: (fov * Math.PI) / 180, far: 900 } }} />
      {/* no multisampling, said on every frame: the ink's depth and normals can't be read from a multisampled camera, and
          raea turned it off only on the cameras there when a run of frames loaded (chapter 07 stopped at the cut to the
          frogs). The frames before had it off already, so the look doesn't change */}
      <AntiAliasing mode="none" />
      <TutWorld t={t} wind={0.1} rings={[]} motes={0} moteCount={onGlass ? 0 : 200} />
      <TutMachine screen={song ? null : screen} next={nextScreen(t, screen)} t={t} />
      {song && <SongOnGlass />}
      {fx.map((f, i) => f.fx === "power" ? <PowerOn key={i} u={local - f.at} /> : null)}
      <TutCritters t={t} look={cast ? GLASS : STAGE} cast={cast} local={local} hop={frogs === "hop" ? 1 : 0.2} />
      {emote && (() => { const q = project(headOf(emote.who, t, cast, local, GLASS), eye, at, fov); return q && <Emote n={emote.n} u={(local - emote.from) / (emote.to - emote.from)} x={q.x} y={q.y - 0.22 * q.ppm} ppm={q.ppm} t={t} />; })()}
      {/* Goose: his own clip (assets/glb/goose-tut.glb, blender/tut_goose_build.py) at film time, placed and turned as
          gooseAt says, so his planted feet land where the film puts him */}
      {goose && <Model name={goose.planks ? "goose-planks" : "goose"} pass="hero" flat src={staticFile(goose.planks ? "glb/goose-tut-planks.glb" : "glb/goose-tut.glb")} position={goose.p} rotation={[0, goose.yaw, 0]} scale={1.7} graph={{ blend: [{ clip: "show", time: t, weight: 1 }] }} />}
      {fx.length > 0 && <Overlays fx={fx} goose={goose} local={local} left={partSeconds - local} eye={eye} at={at} fov={fov} />}
    </>
  );
}

/** v9's graphics drawn over a swamp shot (components/tut/v9.tsx), each on its own clock from the part's: "This is Goose"
 * pointing at his neck, the AIs' ring over his head, the community's card, the fingerprint's two moments */
function Overlays({ fx, goose, local, left, eye, at, fov }: { fx: Fx[]; goose: GooseAt | null; local: number; left: number; eye: V3; at: V3; fov: number }) {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {fx.map((f, i) => {
        switch (f.fx) {
          case "label": {
            if (!goose) return null;
            const q = project([goose.p[0], goose.p[1] + 0.85, goose.p[2]], eye, at, fov);
            return q && <GooseLabel key={i} x={q.x} y={q.y} u={local - f.at} left={left} side={f.side ?? -1} />;
          }
          case "ring": return goose && <LogoRing key={i} u={local - f.from} named={f.named.map((n) => n - f.from)} head={[goose.p[0], goose.p[1] + 1.1, goose.p[2]]} yaw={goose.yaw} eye={eye} at={at} fov={fov} />;
          case "discord": return <DiscordCard key={i} u={local - f.from} left={left} />;
          case "fp1": return <FingerprintGather key={i} u={local} flag={f.flag} approve={f.approve} print={f.print} left={left} />;
          case "fp2": return <FingerprintCheck key={i} u={local} scan={f.scan} fix={f.fix} left={left} />;
          case "rule": return <StandingRule key={i} u={local} ask={f.ask} card={f.card} twice={f.twice} standing={f.standing} place={f.place} left={left} />;
          case "learn": return <LearnHere key={i} u={local} here={f.here} mem={f.mem} disk={f.disk} learn={f.learn} left={left} eye={eye} at={at} fov={fov} />;
          default: return null;
        }
      })}
    </AbsoluteFill>
  );
}

/** a key Goose presses: the giant keyboard's caps as a sticker, bottom right, each sinking and going yellow in turn */
function Keycaps({ s }: { s: Sticker }) {
  const t = useCurrentFrame() / FPS + s.at;   // the Sequence starts 0.25 s before s.at
  const hold = s.hold ?? 1.1, rel = t - s.at;
  const pop = interpolate(rel, [-0.25, -0.1, 0], [0.6, 1.08, 1], clamp) * interpolate(rel, [hold, hold + 0.18], [1, 0.7], clamp);
  const o = interpolate(rel, [-0.25, -0.12, hold, hold + 0.18], [0, 1, 1, 0], clamp);
  const H = 150;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", right: 130, bottom: 130, display: "flex", gap: 14, alignItems: "flex-end", opacity: o, transform: `scale(${pop})`, transformOrigin: "100% 100%" }}>
        {s.keys.map((key, i) => {
          const down = s.press !== false && rel >= 0.12 + i * 0.16 && rel < Math.max(0.12 + i * 0.16 + 0.3, hold - 0.25 + i * 0.05);
          return <img key={key} src={staticFile(`tut-keys/cap-${key}-${down ? "down" : "up"}.png`)} style={{ height: H, width: key === "space" ? (H * 871) / 271 : H }} />;
        })}
      </div>
    </AbsoluteFill>
  );
}

function Film() {
  return (
    <AbsoluteFill style={{ background: "#3896d4" }}>
      <Fonts />
      <Shot />
      {/* the ink (compositions/sticker.ts) on every frame, app shots included, not only inside a swamp shot: a pass
          that first appeared partway through a render came without its source (raea refused chapter 05 at frame 213,
          the cut from the app to the planks), so it is there from a render's first frame */}
      <FramePass wesl={STICKER} prepass={{ depth: true, normal: true }} uniforms={stickerUniforms(SUN)} />
      {STICKERS.map((s, i) => (
        <Sequence key={`k${i}`} name={`keys-${s.keys.join("-")}`} from={fr(s.at - 0.25)} durationInFrames={fr((s.hold ?? 1.1) + 0.5)} layout="none">
          <Keycaps s={s} />
        </Sequence>
      ))}
      {/* v10: the footprint over the Fingerprint page is gone with the page (the director on v9, a note */}
    </AbsoluteFill>
  );
}

// the chapters, each its own composition for rendering a piece at a time: frames [start, next start) of the whole
const CHAPTERS = [...new Set(BEATS.map((b) => b.chapter))].map((ch, i, all) => {
  const start = fr(BEATS.find((b) => b.chapter === ch)!.start);
  const next = i + 1 < all.length ? fr(BEATS.find((b) => b.chapter === all[i + 1])!.start) : fr(SECONDS);
  return { ch, start, frames: next - start };
});

// v11: the runs tools/tutfilm.sh renders, each all app or all swamp (components/tut/shots.ts filmRuns): a chapter that
// opened on the app lost the ink on every swamp shot after it (the director on v10, a note
const RUNS = filmRuns();

registerRoot(() => (
  <>
    <Composition id="tutfilm" component={Film} width={1920} height={1080} fps={FPS} durationInFrames={fr(SECONDS)} />
    {CHAPTERS.map((c) => (
      <Composition key={c.ch} id={`tutfilm-${c.ch}`} width={1920} height={1080} fps={FPS} durationInFrames={c.frames}
        component={() => <Sequence from={-c.start} layout="none"><Film /></Sequence>} />
    ))}
    {RUNS.map((r) => (
      <Composition key={r.id} id={`tutfilm-${r.id}`} width={1920} height={1080} fps={FPS} durationInFrames={r.frames}
        component={() => <Sequence from={-r.start} layout="none"><Film /></Sequence>} />
    ))}
  </>
));
