// Where the foley is cut, and what each piece is shown (the director, 11-11: "we also have to figure out how to cut those 10
// seconds because it scould be dangerous across the whole video we have to be specific about where and what it has
// context for"). The foley is Hunyuan Video Foley on fal (fal-ai/hunyuan-video-foley), after picture lock.
//
// What the model does: it is given one clip and ONE line of text, and makes the clip's sound, timed to what it sees.
// It can't be told when a line stops being true, so:
//   1. A clip is one place. Never two: a clip across a cut hears the second place under the first one's line (kelp
//      bubbles under the clouds). The only clip with two shots, "bedroom", is one room seen twice.
//   2. A clip's context outside its own seconds is its own picture held still (its first frame before, its last after),
//      never a neighbour's frames. A held frame has no events in it, so the model makes only the place's air there.
//      EDGE seconds of that at each end are always thrown away: the model's own start and end (where it ramps in and
//      out) never fall on a second that is heard.
//   3. A place can be heard before it is seen: `lead` seconds of its held first frame are kept and laid under the
//      shot before. In the opening, each world is heard through its door from the moment the door is opened
//      (v3/times.ts ROOM_T door) to the crossing, the "through a door" sound. `tail` is the same after a clip: kept
//      seconds of its held last frame, laid over the shot after (the garden shrinking into its painting; the window's
//      rain running on into the road).
//   4. Places that have no sound of their own are not sent (NONE): the intro, the montage, the faces, the app and the
//      card. Each says why.
//   5. Each line names only things on screen, in the order they happen. The negative line keeps out what must never
//      come: music (the song is the music), voices, and the cursor as a computer sound.
// A place that starts as a drawing (canyon, bedroom, road, harbour) is near-silent until it is touched; the model hears
// line art as quiet, and the lines say so, so the world's sound arrives with its picture.
// tools/proxy.sh cuts the clips from the shots; the mix (after the run) lays each one at `at` (song seconds) with its
// lead faded in and its tail faded out.
import { FPS, INTRO_OVER, SHOTS, shot } from "./plan";
import { ROOM_T } from "./times";

/** seconds of held frame at each end that are generated and always thrown away */
export const EDGE = 0.5;
/** the most the model is sent in one clip */
export const MAX_SENT = 10;
/** the longest a world is heard through its door before it is crossed */
const DOOR_LEAD = 1.2;
export const NEGATIVE = "music, melody, singing, speech, voices, mouse clicks, computer beeps, electronic tones, noisy, harsh";

export type Cut = {
  id: string;
  /** the shots it covers, in order: one place */
  shots: string[];
  /** seconds into the first shot where it starts (default 0) */
  skip?: number;
  /** seconds of its held first frame heard before it (faded in) */
  lead: number;
  /** seconds of its held last frame heard after it (faded out) */
  tail: number;
  /** what is on screen, for the record */
  sees: string;
  /** the model's line */
  say: string;
  negative?: string;
  seed: number;
  /** dB from the level every clip is set to (tools/foley-mix.sh), where a place should sit lower or higher */
  level?: number;
};

/** heard through the door of the world before, from the moment that door is opened */
const through = (prev: string) => Math.min(DOOR_LEAD, +(shot(prev).seconds - ROOM_T[prev].door!).toFixed(2));
const CROSS = 0.1;                                                         // (a world's last sound, over the crossing)

export const CUTS_FOLEY: Cut[] = [
  // the opening: a world a clip, each one's door heard opening in it, and the next world heard through that door
  {
    // (8 dB under the rest: it is under the song's first, quietest bars)
    id: "hallway", shots: ["hallway"], skip: INTRO_OVER / FPS, lead: 0, tail: CROSS, seed: 101, level: -8,
    sees: "a stone archway's double doors, a drawing until the cursor takes the torch's fire; it pushes the doors open on a rock in the sea",
    say: "a torch flame catching and crackling in a stone archway, then a heavy old wooden double door groaning open on iron hinges",
  },
  {
    id: "kitchen", shots: ["kitchen"], lead: through("hallway"), tail: CROSS, seed: 102,
    sees: "a rock in the open sea with a wooden door in it; a slider raises a storm, rain slanting in and lightning striking twice, and a wave bursts up under the cursor's flame and puts it out; the storm breaks and the door opens on a kelp forest",
    say: "open sea around a lone rock, a storm building, wind rising and heavy rain coming on, two cracks of thunder, a wave bursting up and splashing, a small flame hissing out, the rain easing, then a wooden door in the rock creaking open",
  },
  {
    id: "living", shots: ["living"], lead: through("kitchen"), tail: CROSS, seed: 103,
    sees: "a kelp forest underwater; a click bursts a cloud of bubbles and scatters a school of fish; a bulkhead door's wheel is turned, shedding bubbles, and the door opens on white cloud",
    say: "underwater in a kelp forest, muffled deep water, a burst of bubbles rushing up, a school of fish darting away, a rusted metal wheel turned with a grinding creak and bubbling, a heavy steel hatch opening",
  },
  {
    id: "study", shots: ["study"], lead: through("living"), tail: CROSS, seed: 104,
    sees: "white cloud, then a blue door standing on the clouds; a click bursts a flock of birds out of the cloud; the door opens on a pixel-art lake at sunset",
    say: "high wind above the clouds, a flock of birds bursting out with a flurry of wing flaps, then a wooden door opening",
  },
  {
    // (seed 105 made a weak take, assembly 23)
    id: "greenhouse", shots: ["greenhouse"], lead: through("study"), tail: CROSS, seed: 205,
    sees: "a pixel-art lake at sunset among pines; a click on the water sends ripples out; an arched wooden door opens on a cottage garden",
    say: "a calm lake at sunset, a light breeze in pine trees, a drop plopping into the water and ripples lapping, then a wooden door opening",
  },
  {
    id: "gardendoor", shots: ["gardendoor"], lead: through("greenhouse"), tail: CROSS, seed: 106,
    sees: "a Craftsman cottage's front garden; the cursor carries a watering can up the stone path and sets it on the porch; the front door opens on a dark cathedral",
    say: "a cottage garden in the afternoon, birdsong and rustling leaves, a metal watering can carried and set down on brick, then a front door unlatched and opened",
  },
  {
    id: "dining", shots: ["dining"], lead: through("gardendoor"), tail: CROSS, seed: 107,
    sees: "a dark cathedral nave; a click lights one candle, then the whole nave takes fire at once; a great oak door opens on a painted summer field",
    say: "the hush of a vast stone cathedral, a candle wick catching, then hundreds of candle flames whooshing alight at once, then a great oak door groaning open",
  },
  {
    id: "cellar", shots: ["cellar"], lead: through("dining"), tail: CROSS, seed: 108,
    sees: "an impressionist painted field of grass with a bare white door; a brush sweeps red paint down the door; the door opens on a line drawing of a canyon",
    say: "wind in a summer field of tall grass, distant birds, a wet paintbrush sweeping thick paint down a wooden door, then a door handle turned and the door swung open",
  },
  // the canyon: a drawing (the tumbleweed taken, drawn back and thrown up at the right wall), real from the moment it
  // strikes the rock (the art spreads from there); it is heard only a moment through the painted door (a drawing makes
  // no sound)
  {
    id: "canyon", shots: ["canyon"], lead: 0.4, tail: 0.05, seed: 109,
    sees: "a line drawing of a slot canyon; a real tumbleweed is taken up, drawn back and thrown up at the right wall; it strikes the rock and the real red sandstone canyon spreads out from the strike as the tumbleweed drops onto a boulder and bounds away down the slot",
    say: "near silence, a dry tumbleweed crackling as it is taken and thrown, a hard thump as it hits a rock wall, then wind rushing through a narrow red sandstone canyon, the tumbleweed bouncing and scraping down rocks, sand blowing",
  },
  // the garden, and its sound held on its last frame through the pull-out (its air shrinks into the painting under the
  // bedroom's)
  {
    id: "garden", shots: ["garden"], lead: 0.05, tail: shot("painting").seconds, seed: 110,
    sees: "a picnic table in a forest garden; STAY is painted across the frame in thick white dripping strokes",
    say: "a quiet forest garden, birdsong and leaves rustling in a light breeze, thick wet paint brushed on in strokes and dripping",
  },
  // the bedroom: from the moment the canvas is a small picture inside the drawn room (0.9 s into "painting"; before
  // that the garden fills most of the frame and would bring its birds in), through the drawing, its reveal and the
  // real room
  {
    id: "bedroom", shots: ["painting", "bedroom"], skip: 0.9, lead: 0.3, tail: 0.1, seed: 111, level: -3,
    sees: "a line drawing of a child's bedroom with the painting on its wall; a wipe turns it into the real room, heaped with old toys, books and boxes",
    say: "near silence in an empty room, then a quiet cluttered bedroom, soft room tone, a few things settling with small wooden knocks, light rain beginning outside",
  },
  {
    id: "window", shots: ["window"], lead: 0.05, tail: 0.4, seed: 112,
    sees: "a dark bedroom window with closed blinds; the cursor pulls the blinds up on rain; a jump cut to the glass, rain running down it",
    say: "venetian blinds rattling as they are pulled up, then heavy rain on a window, raindrops tapping and running down the glass",
  },
  {
    id: "glade", shots: ["fern", "floor", "wide"], lead: 0.05, tail: 0.1, seed: 113,
    sees: "a fern frond close up with water drops hanging at its tips, one falling; a mossy fallen log on a dense forest floor; a misty pine forest with sun shafts, the camera turning up into the sun",
    say: "a quiet forest at dawn, a single water drop falling onto leaves, soft birdsong, a light breeze in the pines, still air",
  },
  {
    id: "harbour", shots: ["harbour"], lead: 0.05, tail: 0.15, seed: 114,
    sees: "a line drawing of a dock beside a tall ship; a crate is picked up and set down; a click makes it a real harbour at dusk",
    say: "a wooden crate lifted and set down on a wooden dock, then a calm harbour at dusk, water lapping at the pier, a wooden ship creaking, distant gulls",
  },
  // the sea: the storm built by its slider; it stops dead on the cut to the app
  {
    id: "sea", shots: ["sea"], lead: 0.05, tail: 0.03, seed: 115, level: 4,
    sees: "a figure on a sea stack at sunrise; the storm's slider is dragged: rain, wind and big waves, the figure's cloak flying",
    say: "calm open sea at sunrise, then wind rising to a gale, rain lashing, big waves crashing against a sea rock, a cloak flapping hard in the wind",
  },
];

/** what is not sent, and why */
export const NONE: { shots: string[]; why: string }[] = [
  { shots: ["vinyl", "diner", "koi", "clocktower", "stairwell", "laundromat", "court", "subway", "hotel", "school", "vault", "torii"], why: "the montage: twelve places at a third of a second each, the last four corridors flown down at the train's speed. None stays long enough to have a sound, and one clip across them is one line over twelve places, the smear itself. The song is at its fullest here; the cuts' accents are made, not generated" },
  { shots: ["faces"], why: "close faces, no action: the model would find breaths or voices in them" },
  { shots: ["ui-timeline", "ui-notes", "ui-feed", "ui-robot", "platform"], why: "the app on screen: nothing physical makes a sound; its clicks are the cursor's clock (tools/ticks.ts), made" },
  { shots: ["card"], why: "the card: its two clicks, the flood and the typed address are made to the frame, not generated" },
];

export type Resolved = Cut & { /** song frames, [f0, f1) */ f0: number; f1: number; seconds: number; /** held seconds sent before and after */ pre: number; post: number; sent: number; /** song seconds where its kept sound starts and ends */ at: number; until: number; file: string };

export function resolved(): Resolved[] {
  const seen = new Map<string, string>();
  const out = CUTS_FOLEY.map((c) => {
    const ss = c.shots.map(shot);
    ss.forEach((s, i) => { if (i > 0 && s.n !== ss[i - 1].n + 1) throw new Error(`${c.id}: ${c.shots.join(", ")} are not consecutive shots`); });
    for (const s of c.shots) { if (seen.has(s)) throw new Error(`${s} is in ${seen.get(s)} and ${c.id}`); seen.set(s, c.id); }
    const f0 = ss[0].f0 + Math.round((c.skip ?? 0) * FPS), f1 = ss[ss.length - 1].f1;
    const seconds = (f1 - f0) / FPS, pre = EDGE + c.lead, post = EDGE + c.tail, sent = pre + seconds + post;
    if (sent > MAX_SENT + 1e-6) throw new Error(`${c.id}: ${sent.toFixed(2)} s sent, over ${MAX_SENT}`);
    return { ...c, f0, f1, seconds, pre, post, sent, at: f0 / FPS - c.lead, until: f1 / FPS + c.tail, file: `out/v3/proxy/${c.id}.mp4` };
  });
  for (const n of NONE) for (const s of n.shots) { shot(s); if (seen.has(s)) throw new Error(`${s} is in ${seen.get(s)} and NONE`); seen.set(s, "none"); }
  const missed = SHOTS.filter((s) => !seen.has(s.id)).map((s) => s.id);
  if (missed.length) throw new Error(`no foley decision for ${missed.join(", ")}`);
  return out;
}
