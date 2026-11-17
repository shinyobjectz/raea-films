// Swamp-Side Mayor's words as the 90 s cut sings them, each word at the second it starts, for the 16:9 sing-along
// (compositions/singalong.tsx; the director 11-16: "the 16:9 version with sing along lyrics at the bottom not counting the
// ones that are already on screen").
//
// The words are the song's own (assets/lyrics/swamp-side-mayor.txt, from its Suno page; the director pasted the same). The
// cut sings part of them: no intro, and verse 2 goes from "loud as a sneeze" to "with the pondweed dip, I'll bring the
// bread". The times are from two hearings of assets/music/swamp-side-mayor-90.wav: out/lyr/words.json, and Whisper
// large-v3-turbo (out/lyr/heard-turbo.json, and short spots heard again with the line written there). Chorus 2 is
// chorus 1's audio 34.64 s later, so its quacks sit at chorus 1's plus 34.64. "Webbed" is at the voice's onset (10.70).
//
// A line is "word@second ...". [word] is one compositions/ink.tsx paints in the frame as it's sung (SCHLOP, MUD FEET?,
// POP!, DUCK?, SOUP., the SWAMP-SIDE MAYOR title): it stays a blank in the line, and the painting fills it. Chorus 1's
// quacks are painted too and are their own shout, so they're left out of its lines. A leading + joins a word to the one
// before it with no space (Suction-pop, lily-pad, Quack-quack).

const SUNG = [
  "Webbed@10.70 feet@11.10 peel@11.56 off@11.94 the@12.12 pavement—@12.26 [schlop]@12.92",
  "Mud@13.60 on@14.00 my@14.16 cuffs@14.32 and@14.64 a@14.80 leaf@14.88 on@15.28 my@15.44 top.@15.60",
  "I@16.00 waddle@16.32 in@16.64 late@16.96 with@17.28 a@17.36 grin@17.52 and@17.92 a@18.08 spoon,@18.24",
  "Scoop@18.80 up@19.28 a@19.44 bubble,@19.60 it@20.00 burps@20.16 out@20.72 a@20.88 tune.@21.04",
  "You@21.52 guard@21.76 the@22.08 snacks?@22.16 Better@22.72 guard@23.12 that@23.36 plate;@23.52",
  "I’ve@23.92 got@24.16 one@24.32 beak@24.56 and@24.96 a@25.12 mighty@25.28 big@25.60 appetite.@25.90",
  "Left@26.96 foot,@27.28 right@27.68 foot,@27.92 shake@28.24 off@28.56 the@28.72 goo—@28.88",
  "Now@29.36 the@29.60 whole@29.68 dance@30.00 floor’s@30.32 sticking@30.80 to@31.36 you.@31.52",
  // chorus 1: QUACK QUACK painted after "party?", MUD FEET? and three QUACKs, POP!, DUCK?, SOUP. and the title
  "Who’s@32.24 got@32.64 the@32.80 pond@32.96 party?@33.44",
  "Who’s@34.88 got@35.28 the@35.44 [mud@35.68 feet?]@36.00",
  "Waddle@37.60 to@38.08 the@38.24 left,@38.32 then@38.64 slide@38.88 to@39.36 the@39.52 right,@39.68",
  "Suction-@40.00 +[pop]@40.64 shuffle@40.96 till@41.36 the@41.52 lily@41.60 pads@41.92 bite!@42.32",
  "You@42.56 say@42.72 [“duck!”]@43.04 I@43.84 say@44.00 [“soup?”]@44.32 No!@44.72",
  "I’m@45.12 the@45.36 [swamp-@45.52 +side@45.92 mayor]@46.24 in@46.50 a@46.82 feathered@46.90 raincoat!@47.36",
  // verse 2, as the cut sings it
  "A@52.64 frog’s@52.88 on@53.36 the@53.44 turnip,@53.60 the@54.16 heron’s@54.32 in@54.88 line,@55.04",
  "A@55.36 snail@55.52 brought@55.92 a@56.16 stopwatch—@56.32 still@56.84 doing@57.20 fine.@57.56",
  "I’m@58.00 slick@58.24 as@58.64 a@58.80 pickle,@58.96 loud@59.52 as@59.84 a@60.00 sneeze,@60.16",
  "With@60.64 the@60.80 pondweed@60.96 dip,@61.60 I’ll@62.08 bring@62.32 the@62.42 bread—@62.60",
  "We’ll@63.30 eat@63.66 till@63.92 the@64.08 moon’s@64.24 in@64.64 a@64.80 lily-@64.88 +pad@65.28 bed.@65.64",
  // chorus 2: only the first DUCK! is painted; its quacks, POP, SOUP and the title aren't
  "Who’s@66.88 got@67.28 the@67.44 pond@67.60 party?@68.08 (Quack-@68.56 +quack!)@68.96",
  "Who’s@69.52 got@69.92 the@70.08 mud@70.32 feet?@70.64 (Quack-@71.12 +quack-@71.52 +quack!)@71.84",
  "Waddle@72.24 to@72.72 the@72.88 left,@72.96 then@73.28 slide@73.52 to@73.92 the@74.08 right,@74.32",
  "Suction-@74.64 +pop@75.20 shuffle@75.52 till@76.00 the@76.08 lily@76.16 pads@76.56 bite!@76.96",
  "You@77.20 say@77.36 [“duck!”]@77.68 I@78.40 say@78.56 “soup?”@78.88 No!@79.36",
  "I’m@79.76 the@80.00 swamp-@80.16 +side@80.56 mayor@80.88 in@81.14 a@81.44 feathered@81.54 raincoat!@82.00",
  // outro
  "Schlop,@82.72 blup,@83.20 quack—@83.58 everybody@84.00 scoot!@84.56",
  "Leave@85.20 one@85.60 muddy@85.84 footprint@86.32 by@86.88 the@87.04 root.@87.20",
  "(Quack!)@87.88",
];

/** a word: its text, the second it's sung from, how long its fill takes, whether the film paints it (a blank here),
 * and whether it joins the word before with no space */
export type Tok = { w: string; t: number; dur: number; painted: boolean; join: boolean };
/** a line: its words, and the seconds it shows from and until */
export type Line = { toks: Tok[]; show: number; hide: number };

function parse(s: string): Omit<Tok, "dur">[] {
  let inside = false;
  return s.split(" ").map((raw) => {
    const at = raw.lastIndexOf("@"), t = Number(raw.slice(at + 1));
    let w = raw.slice(0, at), join = false;
    if (w.startsWith("+")) { join = true; w = w.slice(1); }
    const opens = w.startsWith("["), closes = w.endsWith("]");
    if (opens) { inside = true; w = w.slice(1); }
    if (closes) w = w.slice(0, -1);
    const painted = inside;
    if (closes) inside = false;
    return { w, t, painted, join };
  });
}

/** a painted phrase (MUD FEET?, SWAMP-SIDE MAYOR) as one blank, filling from its first word to the end of its last */
function mergePainted(toks: Tok[]): Tok[] {
  const out: Tok[] = [];
  for (const k of toks) {
    const last = out[out.length - 1];
    if (last && last.painted && k.painted) out[out.length - 1] = { ...last, w: last.w + (k.join ? "" : " ") + k.w, dur: k.t + k.dur - last.t };
    else out.push({ ...k });
  }
  return out;
}

const LEAD = 0.45, AFTER = 1.1, GAP = 0.3;
export const LINES: Line[] = (() => {
  const raw = SUNG.map(parse), out: Line[] = [];
  raw.forEach((toks, i) => {
    const next = raw[i + 1]?.[0]?.t ?? Infinity;
    const full = toks.map((k, j) => ({ ...k, dur: Math.min(0.6, Math.max(0.12, (toks[j + 1]?.t ?? Math.min(next, k.t + 0.45)) - k.t)) }));
    const prevLast = i > 0 ? raw[i - 1][raw[i - 1].length - 1].t : -Infinity;
    out.push({ toks: mergePainted(full), show: Math.max(toks[0].t - LEAD, prevLast + GAP), hide: 0 });
  });
  out.forEach((l, i) => { const last = l.toks[l.toks.length - 1]; l.hide = Math.min(out[i + 1]?.show ?? Infinity, last.t + last.dur + AFTER); });
  return out;
})();
