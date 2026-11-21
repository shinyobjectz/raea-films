// Dressing a planned room for the household that lives in it: which recipe (research/catalogue/rooms.ts) a room of
// this use and class is furnished from, and what the household adds to it (identity.ts): its faith's things, its
// politics on the wall, its instruments and pastimes, what the war has left. Pure data and pure functions, so the
// checks (interiors/city.feature) run it in bun; the furnisher (interiors/furnish.ts) places the props at render time.
//
// It is meant to be extended without touching code that isn't data:
//   - a new culture, faith, sect, milieu or hobby is an OVERLAYS record: when it applies, what it puts where;
//   - a new thing is a catalogue item (research/catalogue/interior.ts) and a kit prop that lists it (interiors/kit);
//   - a new kind of room is a recipe in rooms.ts and a line in RECIPE;
//   - how full, how personal, how detailed and how worn the rooms are is DIALS, set for the city and overridden by
//     class, quarter, house or single flat.
import type { Klass, Use } from "./flats";
import type { Confession, Homework, Identity, Interest, Milieu, Origin } from "./identity";
import { hash } from "./hash";

/** The knobs, each 0-1 with 0.5 the period's middle:
 *  clutter: how much of a recipe's optional furniture and small things a room gets (0 the bare must, 1 everything);
 *  personality: how strongly a household's identity shows (0 none of its overlays, 1 twice the rates);
 *  detail: how heavy a prop may be (0 under 600 triangles, 0.5 under 4,000, 1 anything): the complexity budget;
 *  war: how much the war shows (its recipe lists and the war's overlays);
 *  wear: soot, damp and wear on the shells and props (the sets' Wear recipe scales by it). */
export interface Dials { clutter: number; personality: number; detail: number; war: number; wear: number }
export const DIALS: {
  city: Dials;
  klass: Partial<Record<Klass, Partial<Dials>>>;
  quarter: Record<string, Partial<Dials>>;
  house: Record<string, Partial<Dials>>;
  /** "house:level:flat" */
  flat: Record<string, Partial<Dials>>;
} = {
  city: { clutter: 0.5, personality: 0.5, detail: 1, war: 0.5, wear: 0.5 },
  // the survey plates: the poor flat crammed, the good flat ordered (research/interiors.md)
  klass: { worker: { clutter: 0.65, wear: 0.7 }, bourgeois: { clutter: 0.45, wear: 0.3 }, office: { clutter: 0.4, personality: 0.2 } },
  quarter: {},
  house: {},
  flat: {},
};
export function dialsFor(o: { klass?: Klass; quarter?: string; house?: string; flat?: string }): Dials {
  return { ...DIALS.city, ...(o.klass ? DIALS.klass[o.klass] : {}), ...(o.quarter ? DIALS.quarter[o.quarter] : {}), ...(o.house ? DIALS.house[o.house] : {}), ...(o.flat ? DIALS.flat[o.flat] : {}) };
}
/** The furnisher's chances for a recipe's lists at these dials: at 0.5 they are the ones the sets were dressed with. */
export const takeRates = (d: Dials) => ({ must: 1, often: Math.min(1, 0.2 + 0.8 * d.clutter), some: Math.min(1, 0.4 * d.clutter), war: Math.min(1, d.war) });
/** The heaviest prop the detail dial allows, in triangles. */
export const trisCap = (d: Dials) => (d.detail >= 0.99 ? Infinity : d.detail >= 0.5 ? 600 + (d.detail - 0.5) * 2 * 3400 + (d.detail > 0.75 ? 20000 : 0) : 600 * Math.max(0.25, d.detail * 2));

/** Where a thing goes in its room, past its prop's own place rule:
 *  over-bed (a crucifix, the heart prints), by-door (the holy-water font, a coat stand), doorpost (the mezuzah, on the
 *  right as one comes in), east-wall (the Misrach: Berlin's Jews faced Jerusalem, east-south-east), on-sill (the
 *  Hanukkah lamp, a geranium), over-sofa (the leader's portrait), on-table, on-chest (the gramophone). */
export type Hint = "over-bed" | "by-door" | "doorpost" | "east-wall" | "on-sill" | "over-sofa" | "on-table" | "on-chest" | "under-bed";

/** Which households an overlay applies to; every field given must match. */
export interface When {
  confession?: Confession[]; milieu?: Milieu[]; klass?: Klass[]; origin?: Origin[]; interest?: Interest;
  war?: "front" | "fallen" | "decorated" | "munitions" | "prisoner" | "widow";
  children?: "young" | "teens" | "infant" | "school";
  homework?: Homework;
}
/** A thing an overlay puts in a room: its catalogue item, the chance, the rooms it goes in, where in them. */
export interface Put { item: string; p: number; rooms: Use[]; hint?: Hint }
/** `faith`: its chances scale with how devout the household is; `war`: with the war dial; `everyday`: the household's
 *  equipment and work (a chamber pot, the zinc tub, the homework), there whatever the personality dial says. */
export interface Overlay { id: string; note: string; src?: string[]; when: When; put: Put[]; faith?: boolean; war?: boolean; everyday?: boolean }

const LIVING: Use[] = ["stube", "gute-stube", "salon", "dining"];
const SLEEP: Use[] = ["bedroom", "kammer", "stube", "children", "maid"];
const WALLED: Use[] = ["stube", "gute-stube", "salon", "dining", "study", "bedroom", "kammer", "kitchen", "children"];

export const OVERLAYS: Overlay[] = [
  // ---- faith ----
  {
    id: "catholic", faith: true, src: ["ghdi-482"], when: { confession: ["catholic"] },
    note: "The crucifix over the bed with Palm Sunday's sprig behind it, the font by the door, the Sacred Hearts over the marriage bed, the Madonna in the living room, the guardian angel over the children",
    put: [
      { item: "crucifix", p: 0.85, rooms: SLEEP, hint: "over-bed" },
      { item: "holy-water-font", p: 0.45, rooms: ["stube", "bedroom", "kitchen"], hint: "by-door" },
      { item: "heart-prints", p: 0.45, rooms: ["bedroom", "stube"], hint: "over-bed" },
      { item: "madonna-print", p: 0.35, rooms: ["stube", "kitchen", "gute-stube"] },
    ],
  },
  { id: "catholic-children", faith: true, when: { confession: ["catholic"], children: "young" }, note: "The guardian angel over the children's bed", put: [{ item: "guardian-angel", p: 0.5, rooms: ["children", "kammer", "stube"], hint: "over-bed" }] },
  { id: "polish", faith: true, src: ["steinert-polen"], when: { milieu: ["polish"] }, note: "The Black Madonna of Częstochowa: the Polish Catholics of St. Marien-Liebfrauen carried her picture in their 1906 petition for a Polish mass", put: [{ item: "black-madonna", p: 0.7, rooms: ["stube", "kitchen"] }] },
  {
    id: "protestant", faith: true, src: ["ghdi-482"], when: { confession: ["protestant", "other-christian"] },
    note: "Luther's portrait, the embroidered blessing over the kitchen door, the hymnal and Bible on the Vertiko",
    put: [
      { item: "luther-print", p: 0.2, rooms: ["stube", "gute-stube"] },
      { item: "haussegen", p: 0.35, rooms: ["kitchen", "stube"] },
      { item: "bible", p: 0.5, rooms: ["stube", "gute-stube"], hint: "on-chest" },
    ],
  },
  { id: "confirmed", faith: true, src: ["ghdi-482"], when: { confession: ["protestant", "other-christian"], children: "teens" }, note: "A child's confirmation certificate, framed in the good room", put: [{ item: "confirmation-cert", p: 0.6, rooms: ["stube", "gute-stube"] }] },
  {
    id: "jewish", faith: true, when: { confession: ["jewish"] },
    note: "A liberal Jewish household: the Sabbath candlesticks on the sideboard, the Hanukkah lamp (winter 1917), a mezuzah on the flat's door in perhaps one home in three",
    put: [
      { item: "sabbath-candlesticks", p: 0.55, rooms: ["dining", "stube", "gute-stube"], hint: "on-chest" },
      { item: "hanukkah-lamp", p: 0.4, rooms: ["dining", "stube", "gute-stube", "salon"], hint: "on-sill" },
      { item: "mezuzah", p: 0.35, rooms: ["corridor", "kitchen", "stube"], hint: "doorpost" },
    ],
  },
  {
    id: "orthodox", faith: true, src: ["lpb-roth", "shofar-scheunenviertel"], when: { confession: ["jewish-orthodox"] },
    note: "An orthodox household, from Galicia or Russia or of German orthodoxy: a mezuzah on every door, the Misrach on the east wall, the Sabbath and Hanukkah lights, the holy books, the two sets of dishes, the samovar",
    put: [
      { item: "mezuzah", p: 0.95, rooms: [...WALLED, "corridor"], hint: "doorpost" },
      { item: "misrach", p: 0.7, rooms: ["stube", "gute-stube", "dining", "salon"], hint: "east-wall" },
      { item: "sabbath-candlesticks", p: 0.95, rooms: ["stube", "gute-stube", "dining", "salon"], hint: "on-chest" },
      { item: "hanukkah-lamp", p: 0.9, rooms: ["stube", "gute-stube", "dining", "salon"], hint: "on-sill" },
      { item: "seforim", p: 0.75, rooms: ["stube", "gute-stube", "study", "salon"] },
      { item: "two-dish-sets", p: 0.9, rooms: ["kitchen"] },
    ],
  },
  { id: "samovar", when: { origin: ["russia", "galicia"] }, note: "The samovar brought from the east", put: [{ item: "samovar", p: 0.45, rooms: ["kitchen", "stube"], hint: "on-table" }] },

  // ---- politics and the state ----
  {
    id: "social-democrat", src: ["ghdi-482", "wahlen-berlin"], when: { milieu: ["social-democrat"] },
    note: "The party on the wall: Bebel (black-ribboned since 1913), Lassalle or Marx over the sofa; an embroidered verse in red; the Vorwärts read to pieces",
    put: [
      { item: "spd-portrait", p: 0.45, rooms: ["stube", "gute-stube"], hint: "over-sofa" },
      { item: "spd-spruch", p: 0.12, rooms: ["stube", "kitchen"] },
      { item: "newspaper", p: 0.3, rooms: ["stube", "kitchen"], hint: "on-table" },
    ],
  },
  { id: "paper", when: {}, note: "The household's paper (identity.paper) on the table: nearly every Berlin home took one", put: [{ item: "newspaper", p: 0.5, rooms: ["stube", "kitchen", "dining", "study"], hint: "on-table" }] },
  {
    id: "loyal", src: ["ghdi-482"], when: { milieu: ["patriot", "christian-worker", "official", "officer", "catholic"] },
    note: "The Kaiser and, since Tannenberg, Hindenburg; the officials' and officers' homes all but always",
    put: [
      { item: "kaiser-print", p: 0.4, rooms: ["stube", "gute-stube", "study", "dining"] },
      { item: "hindenburg-print", p: 0.35, rooms: ["stube", "gute-stube", "study", "kitchen"] },
    ],
  },
  { id: "official", when: { milieu: ["official", "officer"] }, note: "The state's servant: the Kaiser in his study, the war map with its pins", put: [{ item: "kaiser-print", p: 0.85, rooms: ["study", "gute-stube", "stube"] }, { item: "war-map", p: 0.4, rooms: ["study", "dining"] }] },
  { id: "officer", when: { milieu: ["officer"] }, note: "The officer's helmet and sabre on their hook", put: [{ item: "officer-kit", p: 0.8, rooms: ["study", "bedroom"] }] },
  { id: "reservist", src: ["ghdi-482"], when: { klass: ["worker", "petty", "porter"] }, note: "The man's picture from his service: the Reservistenbild", put: [{ item: "reservist-print", p: 0.35, rooms: ["stube", "gute-stube"] }, { item: "reservist-stein", p: 0.3, rooms: ["stube", "gute-stube", "kitchen"], hint: "on-chest" }] },
  { id: "veterans", when: { milieu: ["patriot", "christian-worker"], klass: ["worker", "petty", "porter"] }, note: "The Kriegerverein's certificate of membership, framed", put: [{ item: "veterans-cert", p: 0.25, rooms: ["stube", "gute-stube"] }] },
  { id: "freethinker", when: { confession: ["free-religious"] }, note: "Out of the church: Haeckel, the Monist League's grand old man, where a saint or Luther would hang", put: [{ item: "freethinker-print", p: 0.3, rooms: ["stube", "gute-stube", "study"] }] },
  { id: "boheme", when: { milieu: ["boheme"] }, note: "The artist's or writer's room: books in piles, an easel", put: [{ item: "books-shelf", p: 0.8, rooms: ["stube", "study", "gute-stube"] }] },

  // ---- the war at home ----
  { id: "fallen", war: true, when: { war: "fallen" }, note: "The fallen son or husband in a black-ribboned frame", put: [{ item: "mourning-crape", p: 0.95, rooms: ["stube", "gute-stube", "dining"] }] },
  { id: "at-front", war: true, when: { war: "front" }, note: "Photographs of the one at the front", put: [{ item: "soldier-portrait", p: 0.8, rooms: ["stube", "gute-stube", "bedroom", "kitchen"] }] },
  { id: "decorated", war: true, when: { war: "decorated" }, note: "The Iron Cross in its frame", put: [{ item: "iron-cross", p: 0.7, rooms: ["stube", "gute-stube", "dining", "study"] }] },
  { id: "rationed", war: true, when: {}, note: "Every kitchen: the ration cards on their nail, the calendar", put: [{ item: "ration-cards", p: 0.8, rooms: ["kitchen"] }, { item: "calendar", p: 0.5, rooms: ["kitchen"] }] },

  // ---- music and pastimes (no wireless: radio-1923) ----
  { id: "piano", when: { interest: "piano" }, note: "The piano against the good room's wall", put: [{ item: "piano", p: 1, rooms: ["salon", "gute-stube", "dining", "stube"] }] },
  { id: "gramophone", src: ["radio-1923"], when: { interest: "gramophone" }, note: "A horn gramophone on the Vertiko", put: [{ item: "gramophone", p: 1, rooms: ["salon", "gute-stube", "stube", "dining"], hint: "on-chest" }] },
  { id: "zither", when: { interest: "zither" }, note: "A zither on the table", put: [{ item: "zither", p: 1, rooms: ["stube", "gute-stube", "kitchen"], hint: "on-table" }] },
  { id: "accordion", when: { interest: "accordion" }, note: "An accordion on the chest", put: [{ item: "accordion", p: 1, rooms: ["stube", "kammer", "kitchen"], hint: "on-chest" }] },
  { id: "violin", when: { interest: "violin" }, note: "A violin in its case", put: [{ item: "violin", p: 1, rooms: ["stube", "gute-stube", "children", "bedroom"], hint: "on-chest" }] },
  { id: "guitar", when: { interest: "guitar" }, note: "The Wandervogel's guitar with its ribbons, in the young one's room", put: [{ item: "guitar", p: 1, rooms: ["children", "kammer", "stube"] }] },
  { id: "skat", when: { interest: "skat" }, note: "Cards and the slate on the table", put: [{ item: "skat", p: 0.6, rooms: ["kitchen", "stube"], hint: "on-table" }] },
  { id: "chess", when: { interest: "chess" }, note: "A game of chess standing", put: [{ item: "chess", p: 0.7, rooms: ["study", "stube", "gute-stube", "dining"], hint: "on-table" }] },
  { id: "reading", when: { interest: "reading", klass: ["worker", "petty", "porter"] }, note: "A hanging shelf of books from the party or union library", put: [{ item: "books-shelf", p: 0.8, rooms: ["stube", "gute-stube", "kammer"] }] },
  { id: "library", when: { interest: "reading", klass: ["bourgeois"] }, note: "The glazed bookcase", put: [{ item: "bookcase", p: 0.9, rooms: ["study", "salon", "dining"] }] },
  { id: "canaries", src: ["ghdi-482"], when: { interest: "canaries" }, note: "A canary in its cage by the window", put: [{ item: "birdcage", p: 1, rooms: ["stube", "kitchen", "gute-stube"] }] },
  { id: "aquarium", when: { interest: "aquarium" }, note: "An aquarium on the chest", put: [{ item: "aquarium", p: 1, rooms: ["stube", "gute-stube", "study", "children"], hint: "on-chest" }] },
  { id: "pigeons", when: { interest: "pigeons" }, note: "The pigeon basket (the loft is on the roof)", put: [{ item: "pigeons", p: 1, rooms: ["kammer", "kitchen"] }] },
  { id: "allotment", src: ["laubenkolonien"], when: { interest: "allotment" }, note: "Spade, rake and can for the allotment, the war's vegetables", put: [{ item: "allotment", p: 1, rooms: ["kammer", "kitchen", "corridor"] }] },
  { id: "cycling", when: { interest: "cycling" }, note: "A bicycle in the hall or the Kammer, its tyres given up; the cycling club on the wall", put: [{ item: "bicycle", p: 1, rooms: ["corridor", "kammer"] }, { item: "club-photo", p: 0.15, rooms: ["stube", "kammer"] }] },
  { id: "needlework", when: { interest: "needlework" }, note: "Needlework on the table", put: [{ item: "needlework", p: 0.7, rooms: ["stube", "gute-stube", "kitchen"], hint: "on-table" }] },
  { id: "painting", when: { interest: "painting" }, note: "An easel and a canvas", put: [{ item: "easel", p: 1, rooms: ["stube", "study", "gute-stube", "kammer"] }] },
  { id: "infant", when: { children: "infant" }, note: "The baby's cradle", put: [{ item: "cradle", p: 0.9, rooms: ["kitchen", "stube", "bedroom"] }] },
  { id: "singing", when: { interest: "singing" }, note: "The choir's group photograph (the Arbeiter-Sängerbund or the church choir)", put: [{ item: "club-photo", p: 0.55, rooms: ["stube", "gute-stube", "kammer"] }] },
  { id: "gymnastics", src: ["turnerschaft"], when: { interest: "gymnastics" }, note: "The Turnverein: the clubs by the wall, the team on the wall", put: [{ item: "indian-clubs", p: 0.6, rooms: ["kammer", "stube", "children"] }, { item: "club-photo", p: 0.3, rooms: ["stube", "gute-stube", "kammer"] }] },
  { id: "stamps", when: { interest: "stamps" }, note: "The stamp album open on the table", put: [{ item: "stamp-album", p: 0.8, rooms: ["stube", "gute-stube", "study", "dining"], hint: "on-table" }] },
  { id: "photography", when: { interest: "photography" }, note: "The amateur's folding plate camera", put: [{ item: "box-camera", p: 0.8, rooms: ["stube", "gute-stube", "study", "salon"], hint: "on-chest" }] },

  // ---- the body, the household's work, school (everyday: there whatever the personality) ----
  { id: "night", everyday: true, when: {}, note: "The chamber pot under the bed for the night (the workers' WC is on the half landing)", put: [{ item: "chamber-pot", p: 0.7, rooms: ["bedroom", "kammer", "stube", "maid", "children"], hint: "under-bed" }] },
  { id: "saturday-bath", everyday: true, when: { klass: ["worker", "petty", "porter"] }, note: "The zinc tub on its nail, filled from the range on Saturday night in the kitchen", put: [{ item: "zinc-tub", p: 0.65, rooms: ["kitchen"] }] },
  { id: "hw-sewing", everyday: true, src: ["heimarbeit-1906"], when: { homework: "sewing" }, note: "Sewing for the Konfektion at home: the machine by the window, the piles of blouses and linen", put: [{ item: "hw-sewing", p: 1, rooms: ["kitchen", "stube", "kammer"] }] },
  { id: "hw-tailoring", everyday: true, src: ["heimarbeit-1906"], when: { homework: "tailoring" }, note: "Coats for the Konfektion: the cut pieces fetched in bundles from the middleman, sewn up at home", put: [{ item: "konfektion-bundles", p: 1, rooms: ["kitchen", "stube"], hint: "on-table" }, { item: "hw-sewing", p: 0.9, rooms: ["kitchen", "stube", "kammer"] }] },
  { id: "hw-flowers", everyday: true, src: ["heimarbeit-1906"], when: { homework: "flowers" }, note: "Artificial flowers made at the kitchen table, petal by petal", put: [{ item: "hw-flowers", p: 1, rooms: ["kitchen", "stube"], hint: "on-table" }] },
  { id: "hw-cigars", everyday: true, src: ["heimarbeit-1906"], when: { homework: "cigars" }, note: "Cigars rolled at home: the board, the leaves, the mould", put: [{ item: "hw-cigars", p: 1, rooms: ["kitchen", "stube"], hint: "on-table" }] },
  { id: "hw-laundry", everyday: true, when: { homework: "laundry" }, note: "Other people's washing: the tub and board and the mangle in the kitchen", put: [{ item: "washtub", p: 1, rooms: ["kitchen"] }, { item: "mangle", p: 0.6, rooms: ["kitchen", "stube"] }] },
  { id: "school", everyday: true, when: { children: "school" }, note: "The school satchel on its hook, the slate and its sponge on a cord", put: [{ item: "school-things", p: 0.9, rooms: ["children", "kammer", "kitchen", "stube"] }] },
  { id: "war-toys", war: true, when: { children: "young" }, note: "The war's toys: a tin cannon, tin soldiers, a toy spiked helmet", put: [{ item: "war-toys", p: 0.45, rooms: ["children", "stube", "kammer"] }] },
  { id: "nursery", when: { klass: ["bourgeois"], children: "young" }, note: "A good nursery's rocking horse", put: [{ item: "rocking-horse", p: 0.5, rooms: ["children"] }] },
];

/** The recipe a room of this use in a flat of this class is furnished from (null: left as built). */
export function recipeFor(use: Use, klass: Klass, berliner = false): string | null {
  if (klass === "office") return ["corridor", "stair", "bath", "pantry", "dark"].includes(use) ? null : "office";
  if (klass === "workshop") return use === "workroom" ? "workroom" : null;
  if (klass === "shop") return use === "back-room" ? "back-room" : null;
  const good = klass === "bourgeois";
  switch (use) {
    case "stube": return good ? "dining-good" : klass === "petty" ? "petty-living" : "worker-stube";
    case "gute-stube": return "petty-stube";
    case "kitchen": return good ? "kitchen-good" : "worker-kitchen";
    case "kammer": case "dark": return "kammer";
    case "bedroom": return good ? "bedroom-good" : klass === "petty" ? "bedroom-petty" : "kammer";
    case "children": return good || klass === "petty" ? "children" : "kammer";
    case "salon": return "salon";
    case "dining": return berliner || good ? "dining-good" : "petty-stube";
    case "study": return "study-good";
    case "maid": return "maid-room";
    case "corridor": return good ? "corridor-good" : null;
    case "workroom": return "workroom";
    case "back-room": return "back-room";
    case "loge": return "porter-loge";
    case "bath": return good ? "bathroom" : null;
    case "wash-kitchen": return "wash-kitchen";
    default: return null;
  }
}

export interface Add { item: string; hint?: Hint; from: string }
const R = (seed: number, k: number) => {
  let h = (seed * 2654435761 + k * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
export function matches(w: When, id: Identity, klass: Klass): boolean {
  if (w.confession && !w.confession.includes(id.confession)) return false;
  if (w.milieu && !w.milieu.includes(id.milieu)) return false;
  if (w.klass && !w.klass.includes(klass)) return false;
  if (w.origin && !w.origin.includes(id.origin)) return false;
  if (w.interest && !id.interests.includes(w.interest)) return false;
  if (w.children === "young" && !id.children.young) return false;
  if (w.children === "teens" && !id.children.teens) return false;
  if (w.children === "infant" && !id.children.infant) return false;
  if (w.children === "school" && !id.children.school) return false;
  if (w.homework && id.homework !== w.homework) return false;
  if (w.war === "front" && !id.war.front) return false;
  if (w.war === "fallen" && !id.war.fallen) return false;
  if (w.war === "decorated" && !id.war.decorated) return false;
  if (w.war === "munitions" && !id.war.munitions) return false;
  if (w.war === "prisoner" && !id.war.prisoner) return false;
  if (w.war === "widow" && !id.war.widow) return false;
  return true;
}

/** What a household adds to one of its rooms: each overlay that matches, each of its things for this kind of room, by
 *  its chance scaled by the dials (personality; war for the war's; devotion for faith's). A thing comes once a room. */
export function dress(use: Use, klass: Klass, id: Identity | null, d: Dials, seed: number): Add[] {
  if (!id) return [];
  const out: Add[] = [], seen = new Set<string>();
  OVERLAYS.forEach((o, i) => {
    if (!matches(o.when, id, klass)) return;
    o.put.forEach((p, j) => {
      if (!p.rooms.includes(use) || seen.has(p.item)) return;
      let q = p.p * d.personality * 2;
      if (o.faith) q *= 0.4 + 1.2 * id.devout;
      if (o.war) q = p.p * d.war * 2;
      if (o.everyday) q = p.p;
      if (R(seed, i * 31 + j) < Math.min(1, q)) { out.push({ item: p.item, hint: p.hint, from: o.id }); seen.add(p.item); }
    });
  });
  return out;
}

/** A room's seed from its house key, level and id: the same room furnishes the same everywhere. */
export function roomSeed(key: string, lv: number, id: number): number {
  let h = 2166136261;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (Math.imul(h ^ (lv + 3), 2654435761) ^ Math.imul(id + 1, 2246822519)) >>> 0;
}

/** A recipe's lists (research/catalogue/rooms.ts Recipe) */
export interface Lists { must: string[]; often: string[]; some: string[]; war: string[]; rates?: Record<string, number> }
/** The items a room of this recipe gets, in the furnisher's order: every must, each of often, some and war by its
 *  chance (takeRates), then the household's additions. furnish.ts draws exactly these; the checks read them. */
export function wants(r: Lists, seed: number, rate = { must: 1, often: 0.6, some: 0.2, war: 0.5 }, extra: string[] = []): string[] {
  const R = (k: number, j = 0) => hash(seed, k, j, 202);
  const want: string[] = [];
  const take = (list: string[], p: number, k: number) => list.forEach((it, i) => { if (R(k, i) < (r.rates?.[it] ?? p)) want.push(it); });
  take(r.must, rate.must, 1); take(r.often, rate.often, 2); take(r.some, rate.some, 3); take(r.war, rate.war, 4);
  want.push(...extra);
  return want;
}
