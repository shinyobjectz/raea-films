// What the game prints over the picture: the voice's captions (each up for exactly as long as its words are said), the
// prompt for what the hand is over, the first controls, the objective when it changes, and the ending's dialog. All of
// it is opaque type with a hard shadow, drawn from the state. Laid out for the picture's shape (frame.ts): the tall
// picture's type is larger and keeps out of the bands a phone app draws over.
import { Img, staticFile } from "raea";
import { FIN, FPS, blackout, type Game } from "./step";
import { INTERACTS } from "./level";
import { LINES, SHOWN, readSeconds, type LineId } from "./lines";
import { useShape, type Shape } from "./frame";

const FONT = "Inter";

/** a voice line playing this frame: which, since when (seconds), and the speaker's tag */
export interface Playing { id: LineId; t: number; tag: string }
export function playing(s: Game): Playing[] {
  const out: Playing[] = [];
  const at = (id: LineId, f0: number, tag: string) => {
    if (f0 < 0) return;
    const t = (s.f - f0) / FPS;
    if (t >= 0 && t <= Math.max(LINES[id].seconds + 0.1, SHOWN[id][SHOWN[id].length - 1].t1)) out.push({ id, t, tag });
  };
  at("vm1", s.st.vm1, "DANA  ·  voicemail");
  at("tape2", s.st.tape2, "DANA  ·  tape");
  at("vm3", s.st.vm3, "DANA  ·  answering machine");
  if (s.st.behind >= 0) {
    at("behind", s.st.behind, "");
    at("there", s.st.behind + FIN.there, "");
  }
  return out;
}

const shadow = "0 2px 0 #000, 0 0 6px #000, 0 0 2px #000";

/** the type's sizes: the tall picture's are larger, since a phone shows its 1080 px about 390 points across */
const sizeOf = (sh: Shape) => (sh.tall ? 1.15 : 1);
/** the band captions and hints stand on: the safe band (wide: a player's controls and title sit there) */
const bandOf = (sh: Shape) => sh.safe.bottom;
/** how far a hint rises when a caption is up under it */
const aboveOf = (sh: Shape) => (sh.tall ? 210 : 110);

function Caption({ p, sh }: { p: Playing; sh: Shape }) {
  const cap = SHOWN[p.id].find((c) => p.t >= c.t0 && p.t < c.t1);
  if (!cap) return null;
  // tall: centred between the side bands (a phone app's buttons stand on the right)
  const left = sh.tall ? sh.safe.left : 0, width = sh.tall ? sh.w - sh.safe.left - sh.safe.right : sh.w;
  return (
    <div style={{ position: "absolute", left, width, bottom: bandOf(sh), display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      {p.tag ? <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: sh.tall ? 28 : 26, letterSpacing: 3, color: "#c9c2a8", textShadow: shadow }}>{p.tag}</div> : null}
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: sh.tall ? 50 : 44, color: "#f4f1e6", textShadow: shadow, maxWidth: sh.tall ? width : 1500, textAlign: "center", lineHeight: 1.25 }}>{cap.text}</div>
    </div>
  );
}

function Key({ k, sh }: { k: string; sh: Shape }) {
  const u = sizeOf(sh);
  return <span style={{ display: "inline-block", minWidth: 40 * u, padding: sh.tall ? "5px 14px" : "4px 12px", marginRight: 14 * u, border: "2px solid #e8e3d0", borderRadius: 6, fontFamily: FONT, fontWeight: 700, fontSize: 24 * u, color: "#e8e3d0", textAlign: "center", background: "#14140f" }}>{k}</span>;
}

/** the prompt beside the hand, as the game holds it (step.ts): up at least as long as its words take to read, and fading
 * out over its last frames; a paper held up covers it */
function Prompt({ s, sh }: { s: Game; sh: Shape }) {
  const { key, since } = s.prompt;
  if (!key || (s.st.read && s.f >= s.st.readF)) return null;
  const [, k, label] = key.split("|");
  const a = Math.min(1, (s.f - since + 1) / 5);
  return (
    <div style={{ position: "absolute", left: sh.w / 2 + (sh.tall ? 56 : 70), top: sh.h / 2 + (sh.tall ? 40 : 30), display: "flex", alignItems: "center", opacity: a > 0.999 ? 1 : a }}>
      <Key k={k} sh={sh} />
      <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 30 * sizeOf(sh), color: "#f4f1e6", textShadow: shadow }}>{label}</span>
    </div>
  );
}

/** a hint up from frame `from` for at least its reading time, and until `done` (when given) */
function Hint({ s, sh, from, done, keys, above }: { s: Game; sh: Shape; from: number; done?: number; keys: [string, string][]; above: boolean }) {
  if (from < 0 || s.f < from) return null;
  const text = keys.map((k) => k.join(" ")).join(" ");
  const min = from + Math.round(readSeconds(text) * FPS);
  const end = Math.max(min, done !== undefined && done >= 0 ? done + 30 : min);
  if (done !== undefined && done < 0 && s.f >= min) { /* still waiting: stay */ }
  else if (s.f >= end) return null;
  const left = sh.tall ? sh.safe.left : 0, width = sh.tall ? sh.w - sh.safe.left - sh.safe.right : sh.w;
  return (
    <div style={{ position: "absolute", left, width, bottom: above ? bandOf(sh) + aboveOf(sh) : bandOf(sh), display: "flex", justifyContent: "center", gap: sh.tall ? 40 : 48 }}>
      {keys.map(([k, does]) => (
        <div key={k} style={{ display: "flex", alignItems: "center" }}>
          <Key k={k} sh={sh} />
          <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 28 * sizeOf(sh), color: "#e8e3d0", textShadow: shadow }}>{does}</span>
        </div>
      ))}
    </div>
  );
}

function Objective({ s, sh }: { s: Game; sh: Shape }) {
  const goals: [number, string][] = [];
  const vmCap = (id: LineId, has: string, f0: number) => f0 < 0 ? -1 : f0 + Math.round((LINES[id].captions.find((c) => c.text.toLowerCase().includes(has))?.t1 ?? 0) * FPS);
  goals.push([vmCap("vm1", "stairwell", s.st.vm1), "Get to the east stairwell"]);
  // the badge as a goal only if it's still on the desk when the tape says where it is
  const onDesk = vmCap("tape2", "on the desk", s.st.tape2);
  if (onDesk >= 0 && (s.st.badge < 0 || s.st.badge > onDesk)) goals.push([onDesk, "Take Dana's badge"]);
  goals.push([s.st.pocket >= 0 ? s.st.pocket + 20 : -1, "Get to the east stairwell"]);
  let best: [number, string] | null = null;
  for (const g of goals) if (g[0] >= 0 && s.f >= g[0] && (!best || g[0] > best[0])) best = g;
  if (!best) return null;
  const dur = Math.round((readSeconds(best[1]) + 2.2) * FPS);
  const age = s.f - best[0];
  if (age > dur || s.st.behind >= 0) return null;
  const a = Math.min(1, age / 12) * Math.min(1, (dur - age) / 12);
  const u = sizeOf(sh);
  return (
    <div style={{ position: "absolute", left: sh.safe.left, top: sh.safe.top, opacity: a > 0.999 ? 1 : a }}>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20 * u, letterSpacing: 4, color: "#a9a38c", textShadow: shadow }}>OBJECTIVE</div>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 32 * u, color: "#f4f1e6", textShadow: shadow, marginTop: 6 }}>{best[1]}</div>
    </div>
  );
}

/** a paper held up to read: the room dimmed behind it, the page, and how to put it down once it has been up a moment.
 * Tall, the page is wider (820 px of the 1080, against 707 of the wide 1920) and the hint sits under its left edge,
 * clear of the hand (which rests just right of the middle) and of the bottom 420 px a phone app covers (raea check's
 * safe-area rule) */
function Paper({ s, sh }: { s: Game; sh: Shape }) {
  const id = s.st.read;
  if (!id) return null;
  const t = s.f - s.st.readF;
  if (t < 0) return null;
  const a = Math.min(1, t / 9);
  const e = 1 - Math.pow(1 - a, 3);
  const h = sh.tall ? Math.round(820 * 1754 / 1240) : 1000, w = sh.tall ? 820 : Math.round(h * 1240 / 1754);
  const top = sh.tall ? 236 : 40;
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: sh.w, height: sh.h, background: "#000", opacity: 0.74 * e }} />
      <Img src={staticFile(`papers/${id}.png`)} style={{ position: "absolute", left: (sh.w - w) / 2, top: top + (1 - e) * 60, width: w, height: h, opacity: a > 0.999 ? 1 : e, boxShadow: "0 12px 40px #000" }} />
      {t > 30 ? (
        <div style={sh.tall
          ? { position: "absolute", left: (sh.w - w) / 2, top: top + h + 30, display: "flex", alignItems: "center" }
          : { position: "absolute", right: 96, bottom: sh.safe.bottom, display: "flex", alignItems: "center" }}>
          <Key k="LMB" sh={sh} />
          <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 28 * sizeOf(sh), color: "#e8e3d0", textShadow: shadow }}>Put down</span>
        </div>
      ) : null}
    </>
  );
}

/** the ending, after the lights: a system dialog in the dark, and a pointer that isn't the player's going to it */
function Ending({ s, sh }: { s: Game; sh: Shape }) {
  const B = s.st.behind;
  if (B < 0) return null;
  const t = s.f - B;
  if (t < FIN.ask) return null;
  const W = sh.w, HGT = sh.h;
  if (t >= FIN.title) {
    const k = (t - FIN.title) / FPS;
    const out = Math.max(0, Math.min(1, (t - FIN.titleOut) / (FIN.end - FIN.titleOut - 30)));
    const a = Math.min(1, k / 1.2) * (1 - out);
    return (
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: HGT, background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22 }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 132, letterSpacing: 20, color: mix("#000000", "#e9e4d2", a), paddingLeft: 20 }}>FLOOR3</div>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 26, letterSpacing: 8, paddingLeft: 8, color: mix("#000000", "#8d8875", Math.max(0, Math.min(1, (k - 0.6) / 1.0)) * (1 - out)) }}>END OF CHAPTER ONE  ·  AFK</div>
      </div>
    );
  }
  // the dialog: a grey box, a title bar, the question, Yes and No (tall: the same box a third larger)
  const u = sh.tall ? 1.3 : 1;
  const bx = W / 2 - 260 * u, by = HGT / 2 - 110 * u;
  const yes = { x: bx + 300 * u, y: by + 160 * u };
  const k = Math.max(0, Math.min(1, (t - FIN.askMove) / (FIN.askClick - FIN.askMove - 12)));
  const e = k * k * k * (10 - 15 * k + 6 * k * k);
  const from = sh.tall ? { x: W / 2 + 290, y: HGT / 2 + 360 } : { x: W / 2 + 330, y: HGT / 2 + 250 };
  const cx = from.x + (yes.x + 22 * u - from.x) * e + Math.sin(e * Math.PI) * 30, cy = from.y + (yes.y + 14 * u - from.y) * e - Math.sin(e * Math.PI) * 18;
  const pressed = t >= FIN.askClick && t < FIN.askClick + 8;
  return (
    <>
      <div style={{ position: "absolute", left: bx, top: by, width: 520 * u, height: 220 * u, background: "#c3c3c3", borderTop: "2px solid #ffffff", borderLeft: "2px solid #ffffff", borderRight: "2px solid #404040", borderBottom: "2px solid #404040" }}>
        <div style={{ height: 32 * u, background: "#000080", display: "flex", alignItems: "center", paddingLeft: 10 * u, fontFamily: FONT, fontWeight: 700, fontSize: 20 * u, color: "#ffffff" }}>Floor 3</div>
        <div style={{ padding: `${30 * u}px 0 0 ${34 * u}px`, fontFamily: FONT, fontWeight: 500, fontSize: 30 * u, color: "#000000" }}>Are you still there?</div>
        {[["Yes", 300], ["No", 410]].map(([label, x]) => (
          <div key={label as string} style={{ position: "absolute", left: (x as number) * u, top: 150 * u, width: 92 * u, height: 38 * u, background: "#c3c3c3",
            borderTop: `2px solid ${pressed && label === "Yes" ? "#404040" : "#ffffff"}`, borderLeft: `2px solid ${pressed && label === "Yes" ? "#404040" : "#ffffff"}`,
            borderRight: `2px solid ${pressed && label === "Yes" ? "#ffffff" : "#404040"}`, borderBottom: `2px solid ${pressed && label === "Yes" ? "#ffffff" : "#404040"}`,
            display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 22 * u, color: "#000" }}>{label as string}</div>
        ))}
      </div>
      {t >= FIN.askMove - 20 ? <Pointer x={cx} y={cy} u={u} /> : null}
    </>
  );
}
function Pointer({ x, y, u }: { x: number; y: number; u: number }) {
  return (
    <svg style={{ position: "absolute", left: x, top: y }} width={34 * u} height={52 * u} viewBox="0 0 22 34">
      <path d="M1 1 L1 27 L7.2 21.2 L11.6 31.5 L15.4 29.8 L11.1 19.8 L19.6 19.8 Z" fill="#ffffff" stroke="#000000" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
}
function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.max(0, Math.min(1, t))).toString(16).padStart(2, "0")).join("");
}

export function Hud({ s }: { s: Game }) {
  const sh = useShape();
  const dark = blackout(s);
  const fadeIn = s.f < 36;
  const voiced = playing(s).length > 0;
  const u = sizeOf(sh);
  return (
    <>
      {dark ? <div style={{ position: "absolute", left: 0, top: 0, width: sh.w, height: sh.h, background: "#000" }} /> : null}
      {fadeIn ? <div style={{ position: "absolute", left: 0, top: 0, width: sh.w, height: sh.h, background: "#000", opacity: 1 - s.f / 36 }} /> : null}
      {s.f >= 40 && s.f < 40 + Math.round(readSeconds("FLOOR 3 11:52 PM") * FPS) + 30 ? (
        <div style={{ position: "absolute", left: sh.safe.left, top: sh.safe.top }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 22 * u, letterSpacing: 5, color: "#a9a38c", textShadow: shadow }}>FLOOR 3</div>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 34 * u, color: "#f4f1e6", textShadow: shadow, marginTop: 6 }}>11:52 PM</div>
        </div>
      ) : null}
      <Objective s={s} sh={sh} />
      <Hint s={s} sh={sh} from={Math.round(4.2 * FPS)} done={s.moved} keys={[["W A S D", "Move"], ["Mouse", "Look"]]} above={voiced} />
      <Hint s={s} sh={sh} from={s.st.wing >= 0 ? s.st.wing + 30 : -1} keys={[["Shift", "Run"]]} above={voiced} />
      <Prompt s={s} sh={sh} />
      <Paper s={s} sh={sh} />
      {playing(s).map((p) => <Caption key={p.id} p={p} sh={sh} />)}
      <Ending s={s} sh={sh} />
    </>
  );
}
export { INTERACTS };
