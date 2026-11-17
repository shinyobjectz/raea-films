// FLOOR3's spoken lines and on-screen words. Engine-free. Each voice line's captions carry their own start and end
// (seconds from the line's start), taken from the recording's word times (tools/voice.ts writes lines.gen.json), so a
// caption is on screen for as long as its words take to say.
import gen from "./lines.gen.json";

export type LineId = "vm1" | "tape2" | "vm3" | "behind" | "there";
export interface Caption { text: string; t0: number; t1: number }
export interface Line { id: LineId; speaker: string; text: string; seconds: number; captions: Caption[] }

const SCRIPT: Record<LineId, { speaker: string; text: string }> = {
  vm1: {
    speaker: "DANA",
    text: "Hey. It's Dana, from I.T. If you're hearing this, you're still on three. Okay. One rule. Don't stand still. When the floor thinks nobody's here, it goes to sleep. And when it sleeps, something else wakes up. Get to the east stairwell. I'll leave you messages on the way. Keep moving.",
  },
  tape2: {
    speaker: "DANA",
    text: "Dana again. You've noticed your hands. Don't think about it. Everyone on three has them now. The stairwell is badge-locked, so take mine. It's on the desk. And the next part is dark. The lights only come on for things that move. So if one comes on, and it isn't you. Run.",
  },
  vm3: {
    speaker: "DANA",
    text: "Hello? Is somebody on three? Pick up. Please pick up. This is Dana Okafor, I'm in the stairwell, I don't know which floor anymore. Listen to me. If you've been getting messages from me, they are not from me. I never left any messages. It uses my voice. It walks you to the door, because the door is where it",
  },
  behind: { speaker: "", text: "Keep moving." },
  there: { speaker: "", text: "There you are." },
};

const G = gen as Record<string, { seconds: number; captions: Caption[] } | undefined>;
/** a stand-in timing until the recording exists: 2.6 words a second, captions of up to nine words */
function standIn(text: string): { seconds: number; captions: Caption[] } {
  const sentences = text.match(/[^.?!]+[.?!]*/g)!.map((s) => s.trim()).filter(Boolean);
  const caps: Caption[] = [];
  let t = 0.3;
  for (const s of sentences) {
    const words = s.split(/\s+/);
    for (let i = 0; i < words.length; i += 9) {
      const part = words.slice(i, i + 9);
      const d = Math.max(1.0, part.length / 2.6);
      caps.push({ text: part.join(" "), t0: t, t1: t + d });
      t += d;
    }
    t += 0.35;
  }
  return { seconds: t + 0.2, captions: caps };
}
export const LINES: Record<LineId, Line> = Object.fromEntries(
  (Object.keys(SCRIPT) as LineId[]).map((id) => [id, { id, ...SCRIPT[id], ...(G[id] ?? standIn(SCRIPT[id].text)) }]),
) as Record<LineId, Line>;
export const SCRIPT_TEXT = SCRIPT;

/** the least time words stay up to be read: 0.3 s a word, never under a second */
export const readNeed = (text: string) => Math.max(1.0, 0.3 * text.split(/\s+/).length);
/** a line's captions as the screen shows them: one too short to read joins the next when the voice runs straight on into
 * it, and the last stays up until its words can be read even after the voice stops (a line cut off mid-word). The
 * recorded captions in LINES stay as they are: they time the playthrough and the mix */
export const SHOWN: Record<LineId, Caption[]> = Object.fromEntries((Object.keys(SCRIPT) as LineId[]).map((id) => {
  const caps = LINES[id].captions, out: Caption[] = [];
  for (let i = 0; i < caps.length; i++) {
    let c = { ...caps[i] };
    while (c.t1 - c.t0 < readNeed(c.text) && i + 1 < caps.length && caps[i + 1].t0 - c.t1 < 0.2) { c = { text: `${c.text} ${caps[i + 1].text}`, t0: c.t0, t1: caps[i + 1].t1 }; i++; }
    out.push(c);
  }
  return [id, out.map((c, i) => ({ ...c, t1: i + 1 < out.length ? Math.max(c.t1, Math.min(out[i + 1].t0, c.t0 + readNeed(c.text) + 0.1)) : Math.max(c.t1, c.t0 + readNeed(c.text) + 0.1) }))];
})) as Record<LineId, Caption[]>;

/** the papers the player can read: what's printed on them (the page images are made from these by tools/papers.sh) */
export const PAPERS = {
  notice: {
    title: "FACILITIES NOTICE",
    body: "Occupancy lighting is now active on Floor 3. Lights switch off when no movement is detected. Staff working late: please keep moving. Do not answer phones at desks other than your own.",
    sign: "Building Management",
  },
  printout: {
    header: "FROM: OKAFOR, D.  IT-3F  EXT 314     NOV 13  11:52 PM     P.01",
  },
} as const;
export type PaperId = keyof typeof PAPERS;
/** how long a paper must stay up to be read: its words */
export const paperWords = (id: PaperId) => id === "notice" ? `${PAPERS.notice.title} ${PAPERS.notice.body} ${PAPERS.notice.sign}` : PAPERS.printout.header;

/** how long words stay up when no voice times them: 0.33 s a word and 0.9 s to find them, never under 1.4 s */
export const readSeconds = (text: string) => Math.max(1.4, 0.9 + 0.33 * text.split(/\s+/).length);
