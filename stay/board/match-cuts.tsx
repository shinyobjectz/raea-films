// Stay: the match cuts on the thirds, and the scene library to pick from. Drawn from board/chain.ts (the film as a
// chain of shots, each taking the eye in where the last left it) and board/scenes.ts (fifty places). the director picks the
// places he wants and sends them back with notes (app.result).
import { useMemo, useState } from "react";
import { app, useItem } from "@raea/app";
import { CHAIN, type Shot } from "./chain";
import { SCENES, type Hook, type Scene } from "./scenes";
import { NAMES, centreOf, type At } from "./thirds";

const W = 125, H = 100;
const IN = "#e8a33d", OUT = "#2bb3a6", EYE = "#d65a7a";
const TITLE: Record<string, string> = { black: "Black: the prompt", card: "The card", ...Object.fromEntries(SCENES.map((s) => [s.id, s.title])) };
const fmt = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, "0")}`;
const xy = (at: At): [number, number] => { const [x, y] = centreOf(at); return [x * W, y * H]; };

/** one hook drawn on the frame: its shape at its place on the thirds */
function Glyph({ hook, colour, filled }: { hook: Hook; colour: string; filled?: boolean }) {
  const [x, y] = xy(hook.at);
  const full = hook.at === "FULL";
  const common = { stroke: colour, strokeWidth: 1.6, fill: filled ? colour : "none", fillOpacity: 0.28, strokeDasharray: filled ? undefined : "3 2" };
  switch (hook.glyph) {
    case "circle": return <circle cx={x} cy={y} r={full ? 40 : 9} {...common} />;
    case "rect": return full ? <rect x={6} y={6} width={W - 12} height={H - 12} rx={3} {...common} /> : <rect x={x - 14} y={y - 9} width={28} height={18} rx={2} {...common} />;
    case "hline": return <line x1={6} x2={W - 6} y1={y} y2={y} {...common} strokeWidth={2.4} />;
    case "vline": return <line x1={x} x2={x} y1={6} y2={H - 6} {...common} strokeWidth={2.4} />;
    case "diag": return <line x1={x - 18} y1={y - 18} x2={x + 18} y2={y + 18} {...common} strokeWidth={2.4} />;
    case "vanish": return <g {...common} fill="none">{[[0, 0], [W, 0], [0, H], [W, H]].map(([a, b], i) => <line key={i} x1={a} y1={b} x2={x} y2={y} />)}<circle cx={x} cy={y} r={2.2} fill={colour} /></g>;
    case "blob": return full ? <path d={`M8 ${H * 0.55} C ${W * 0.25} ${H * 0.2}, ${W * 0.7} ${H * 0.85}, ${W - 8} ${H * 0.4} L ${W - 8} ${H - 8} L 8 ${H - 8} Z`} {...common} /> : <ellipse cx={x} cy={y} rx={14} ry={9} {...common} />;
    case "streaks": return <g {...common}>{Array.from({ length: full ? 14 : 6 }, (_, i) => { const sx = full ? 10 + ((i * 37) % (W - 20)) : x - 12 + (i % 3) * 12; const sy = full ? 10 + ((i * 23) % (H - 30)) : y - 8 + Math.floor(i / 3) * 10; return <line key={i} x1={sx} y1={sy} x2={sx - 4} y2={sy + 12} />; })}</g>;
    case "dots": return <g fill={colour}>{Array.from({ length: full ? 22 : 9 }, (_, i) => <circle key={i} cx={full ? 8 + ((i * 29) % (W - 16)) : x - 10 + (i % 3) * 10} cy={full ? 8 + ((i * 17) % (H - 16)) : y - 10 + Math.floor(i / 3) * 10} r={1.4} />)}</g>;
  }
}

/** a 5:4 frame with its thirds, the in hook (dashed) and the out hook (filled), and the eye's way between them */
function Frame({ hooks, inHook, outHook, className = "" }: { hooks?: Hook[]; inHook?: Hook; outHook?: Hook; className?: string }) {
  const [ax, ay] = inHook ? xy(inHook.at) : [0, 0];
  const [bx, by] = outHook ? xy(outHook.at) : [0, 0];
  const moves = inHook && outHook && (Math.abs(ax - bx) > 1 || Math.abs(ay - by) > 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`block w-full rounded-md border border-line text-ink ${className}`} style={{ aspectRatio: "5 / 4" }}>
      <rect width={W} height={H} fill="currentColor" fillOpacity={0.05} />
      {[W / 3, (2 * W) / 3].map((x) => <line key={x} x1={x} x2={x} y1={0} y2={H} stroke="currentColor" strokeOpacity={0.22} strokeDasharray="1.5 2" />)}
      {[H / 3, (2 * H) / 3].map((y) => <line key={y} x1={0} x2={W} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.22} strokeDasharray="1.5 2" />)}
      {[1, 2].flatMap((i) => [1, 2].map((j) => <circle key={`${i}${j}`} cx={(i * W) / 3} cy={(j * H) / 3} r={1.1} fill="currentColor" fillOpacity={0.35} />))}
      {hooks?.map((k, i) => <Glyph key={i} hook={k} colour={OUT} filled />)}
      {inHook && <Glyph hook={inHook} colour={IN} />}
      {outHook && <Glyph hook={outHook} colour={OUT} filled />}
      {moves && (
        <g stroke={EYE} strokeWidth={1.4} fill="none">
          <line x1={ax} y1={ay} x2={bx} y2={by} />
          <circle cx={bx} cy={by} r={2.4} fill={EYE} />
        </g>
      )}
    </svg>
  );
}

/** every shot's in and out points joined in order: where the eye goes through the whole film */
function EyePath() {
  const pts = CHAIN.slice(1).flatMap((s) => [xy(s.in.at), xy(s.out.at)]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-lg border border-line text-ink" style={{ aspectRatio: "5 / 4" }}>
      <rect width={W} height={H} fill="currentColor" fillOpacity={0.05} />
      {[W / 3, (2 * W) / 3].map((x) => <line key={x} x1={x} x2={x} y1={0} y2={H} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="1.5 2" />)}
      {[H / 3, (2 * H) / 3].map((y) => <line key={y} x1={0} x2={W} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="1.5 2" />)}
      <polyline points={pts.map(([x, y], i) => `${x + ((i % 5) - 2) * 0.6},${y + ((i % 7) - 3) * 0.6}`).join(" ")} fill="none" stroke={EYE} strokeWidth={0.8} strokeOpacity={0.75} />
      {(["TL", "TC", "TR", "CC", "BL", "BC", "BR", "FULL"] as At[]).map((at) => {
        const n = CHAIN.filter((s, i) => i > 0 && s.in.at === at).length;
        if (!n) return null;
        const [x, y] = at === "FULL" ? [W - 46, 10] : xy(at);
        return (
          <g key={at}>
            <circle cx={x} cy={y} r={2.2 + n * 0.55} fill={OUT} fillOpacity={0.5} stroke={OUT} />
            <text x={x + 4 + n * 0.55} y={at === "FULL" ? y + 1.5 : y - 3} fontSize={4.2} fill="currentColor">{at === "FULL" ? `fills the frame ×${n}` : `${at} ×${n}`}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ShotCard({ s, i }: { s: Shot; i: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{i + 1}. {TITLE[s.scene] ?? s.scene}</span>
        <span className="whitespace-nowrap font-mono text-xs text-ink-3">{fmt(s.from)} · {s.seconds.toFixed(2)} s</span>
      </div>
      <div className="text-xs text-ink-3">{s.cut}</div>
      <Frame inHook={s.in} outHook={s.out} />
      <div className="text-xs leading-snug">
        <span style={{ color: IN }}>in</span> {s.in.what} <span className="text-ink-3">({NAMES[s.in.at]})</span><br />
        <span style={{ color: OUT }}>out</span> {s.out.what} <span className="text-ink-3">({NAMES[s.out.at]})</span>
      </div>
      <div className="text-xs leading-snug text-ink-3">{s.eye}</div>
    </div>
  );
}

function SceneCard({ s, on, toggle, used }: { s: Scene; on: boolean; toggle: () => void; used: boolean }) {
  return (
    <label className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-3 ${on ? "border-accent" : "border-line"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{s.title}</div>
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink-3">{s.slug}{s.time ? ` · ${s.time}` : ""}{used ? " · in the chain" : ""}</div>
        </div>
        <input type="checkbox" checked={on} onChange={toggle} className="mt-1" />
      </div>
      <Frame hooks={s.hooks} />
      <div className="text-xs leading-snug text-ink-3">{s.real}</div>
      {s.wrong !== "-" && <div className="text-xs leading-snug"><span className="font-semibold">Generator:</span> {s.wrong}</div>}
      <div className="text-xs leading-snug"><span className="font-semibold">raea ({s.by}):</span> {s.directed}</div>
      <div className="text-[11px] leading-snug text-ink-3">Hooks: {s.hooks.map((k) => `${k.what} (${NAMES[k.at]})`).join("; ")}</div>
      <div className="flex flex-wrap gap-1">{s.props.map((p) => <span key={p} className="rounded border border-line px-1.5 py-0.5 text-[10px] text-ink-3">{p}</span>)}</div>
    </label>
  );
}

export default function MatchCuts() {
  const item = useItem();
  const inChain = useMemo(() => new Set(CHAIN.map((s) => s.scene)), []);
  const [picked, setPicked] = useState<Set<string>>(() => new Set(SCENES.filter((s) => inChain.has(s.id)).map((s) => s.id)));
  const [show, setShow] = useState<"all" | "picked" | "rest">("all");
  const [notes, setNotes] = useState("");
  const [sent, setSent] = useState(false);
  const list = SCENES.filter((s) => show === "all" || (show === "picked") === picked.has(s.id));
  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const send = () => {
    const ids = SCENES.filter((s) => picked.has(s.id));
    const added = ids.filter((s) => !inChain.has(s.id)).map((s) => s.title);
    const dropped = SCENES.filter((s) => inChain.has(s.id) && !picked.has(s.id)).map((s) => s.title);
    app.result(`Scenes picked (${ids.length}): ${ids.map((s) => s.title).join(", ")}.${added.length ? ` Added to the chain: ${added.join(", ")}.` : ""}${dropped.length ? ` Dropped: ${dropped.join(", ")}.` : ""}${notes.trim() ? ` Notes: ${notes.trim()}` : ""}`).then(() => setSent(true));
  };
  if (!item) return null;
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 p-6 text-ink">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Stay: match cuts on the thirds</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-ink-3">
          Every cut lands the eye where the last shot left it. Each shot takes the eye in at a point on the thirds, on a thing
          of the same shape, motion or texture as the one it cut from, and its action (the cursor's drag, the camera's move,
          the light's sweep) carries the eye to the point where the next cut happens. {CHAIN.length} shots, {inChain.size - 2} places,
          {" "}{fmt(CHAIN[CHAIN.length - 1].from + CHAIN[CHAIN.length - 1].seconds)}, on Stay's beats.
        </p>
        <div className="flex flex-wrap gap-4 text-xs">
          <span><span style={{ color: IN }}>- - -</span> in: where the eye arrives</span>
          <span><span style={{ color: OUT }}>■</span> out: where the next cut leaves</span>
          <span><span style={{ color: EYE }}>●—</span> the eye's way through the shot</span>
          <span className="text-ink-3">dotted lines: the thirds</span>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-3">The eye through the whole film</h2>
          <EyePath />
        </div>
        <div className="flex flex-col gap-2 text-sm leading-relaxed">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-3">The structure</h2>
          <p><b>Act one, the generator:</b> the eye is held dead centre on the aisle's vanishing point while every reroll changes the room around it. The pool cutaway rides the lower thirds line, on the water.</p>
          <p><b>The directed office:</b> the first time the eye is moved on purpose: the dragged chair along the lower third, up to the blinds and the sun on the upper right.</p>
          <p><b>The middle, place to place:</b> the upper-right third is the sun's corner (the office's flare, the canyon's sun, the dryer's window); a frame-filling thing (the screen, the sheet, the rain, the car's flank) carries every other cut.</p>
          <p><b>The montage:</b> one circle handed on each beat, travelling from the lower-left third through the centre to the upper right, so it lands on the sun over the sea.</p>
          <p><b>The end:</b> the app at the centre, and the lockup where it was.</p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-3">The chain, shot by shot</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{CHAIN.map((s, i) => <ShotCard key={i} s={s} i={i} />)}</div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-3">The scene library: {SCENES.length} places, {picked.size} picked</h2>
          <div className="flex gap-1 text-xs">
            {(["all", "picked", "rest"] as const).map((k) => (
              <button key={k} onClick={() => setShow(k)} className={`rounded border px-2 py-1 ${show === k ? "border-accent" : "border-line text-ink-3"}`}>{k === "all" ? "All" : k === "picked" ? "Picked" : "Not picked"}</button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{list.map((s) => <SceneCard key={s.id} s={s} on={picked.has(s.id)} toggle={() => toggle(s.id)} used={inChain.has(s.id)} />)}</div>
      </section>

      <footer className="sticky bottom-0 flex flex-col gap-2 rounded-lg border border-line bg-ground p-4">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes on the chain, the thirds or any place" className="w-full rounded border border-line bg-ground p-2 text-sm text-ink" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-ink-3">{picked.size} places picked. Ticking one that isn't in the chain asks for it to be worked in.</span>
          <button disabled={sent || item.answered} onClick={send} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-ground disabled:opacity-50">{sent || item.answered ? "Sent" : "Send picks and notes"}</button>
        </div>
      </footer>
    </main>
  );
}
