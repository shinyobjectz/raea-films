// How a room's furniture stands together, as the housing survey's photographs show it (research/survey-tally.tsv,
// research/catalogue/seen.ts): not each thing alone on a free stretch of wall, but groups that belong together and
// keep the floor in front of them free to be used. interiors/layout/plan.ts places them, best first, and keeps a way
// through from the door to each. the director's notes on v7 (a review note): "we need much more sophisticated procedural
// furniture placements", "some way of making sure rooms don't just clutter".
//
// Data only. A new arrangement is a GROUPS record: its anchor's items, how and where the anchor stands, the floor its
// use needs, and the pieces that come with it when the room has them. A thing that sits on another is an ON record.

/** How a piece stands: back to a wall; in a corner; a bed's head to the wall, or its long side; free in the room
 *  before a wall (the table at the window, the iron stove off the wall on its pipe). */
export type Stand = "wall" | "corner" | "head" | "side" | "free";
/** Which walls a group likes, best first: one with a window, one without (the inner walls: the chimney's, the
 *  wardrobe's), the door's wall, a wall without a door, the room's long wall, the pier between two windows. */
export type Like = "window" | "inner" | "door" | "nodoor" | "long" | "pier";

export type Member =
  /** along the wall next to the anchor, on whichever side is free (the coal box by the stove) */
  | { items: string[]; at: "beside"; gap?: number }
  /** free in front of the anchor, centred on it (the sofa's table) */
  | { items: string[]; at: "front"; gap: number }
  /** round the front piece's (or a free anchor's) open sides, facing it: chairs; n the most; `bring`: they come with
   *  the table though the room's list has none (the survey's kitchens had chairs; the recipes never listed them) */
  | { items: string[]; at: "around"; n: number; bring?: boolean }
  /** at a bed's foot or by its side (the pram-cradle by the parents' bed) */
  | { items: string[]; at: "foot" };

export interface GroupDef {
  id: string;
  /** the items, any of which (the first the room has) forms the group */
  anchor: string[];
  /** how the anchor may stand, tried in this order */
  stand: Stand[];
  likes?: Like[];
  /** + near the door, - away from it, 0 neither */
  door?: number;
  /** the clear floor needed before it (m): to open a wardrobe, to stand at the washstand */
  use: number;
  with?: Member[];
  /** groups go in by rank (low first); within a rank, in the room's order */
  rank: number;
  /** a free piece's gap from its wall, tried in order (m) */
  gaps?: number[];
}

export const GROUPS: GroupDef[] = [
  // The stove at the inner wall by the door: Berlin's flues ran in the inner walls, and a room's stove was stoked
  // from beside its door (the salon's Hinterlader from the corridor through the wall)
  { id: "stove", anchor: ["tiled-stove", "stove-hinterlader"], stand: ["corner"], likes: ["inner", "door"], door: 1, use: 0.6, rank: 0,
    with: [{ items: ["coal-box"], at: "beside", gap: 0.08 }] },
  // the iron stove stands off the wall on its pipe (the survey's Kanonenofen, "ohne Schutzbekleidung")
  { id: "iron-stove", anchor: ["iron-stove"], stand: ["free"], gaps: [0.3, 0.45], likes: ["inner"], door: 0.5, use: 0.5, rank: 0,
    with: [{ items: ["coal-box"], at: "beside", gap: 0.15 }] },
  // the kitchen's range on the chimney wall, the coal box beside it, the sink near
  { id: "range", anchor: ["range", "brick-range", "gas-cooker"], stand: ["wall", "corner"], likes: ["inner"], door: 0.5, use: 0.8, rank: 0,
    with: [{ items: ["coal-box"], at: "beside", gap: 0.05 }] },
  // the beds: head to a wall away from the door, or the long side to it where the room is tight; a cradle by them
  { id: "bed", anchor: ["bed-iron", "bed-wood", "lodger-bed", "hotel-bed"], stand: ["head", "side"], likes: ["nodoor", "inner"], door: -1, use: 0.45, rank: 1,
    with: [{ items: ["cradle"], at: "foot" }] },
  // the kitchen dresser on a long wall
  { id: "dresser", anchor: ["kitchen-dresser"], stand: ["wall"], likes: ["long", "inner"], use: 0.7, rank: 2 },
  { id: "wardrobe", anchor: ["wardrobe"], stand: ["wall", "corner"], likes: ["inner", "door"], door: 0.3, use: 0.7, rank: 2 },
  // the sofa corner: the sofa on a long wall, its table before it, chairs round the table's other sides
  { id: "sofa", anchor: ["sofa-plush"], stand: ["wall"], likes: ["long", "inner", "nodoor"], use: 0, rank: 3,
    with: [{ items: ["table-round"], at: "front", gap: 0.28 }, { items: ["chairs-bent", "salon-suite"], at: "around", n: 3, bring: true }] },
  // without a sofa, the table at the window (the light to eat and sew by), chairs round it
  { id: "table", anchor: ["table-round"], stand: ["free"], gaps: [0.12, 0.45, 0.8], likes: ["window", "long"], use: 0, rank: 4,
    with: [{ items: ["chairs-bent"], at: "around", n: 3, bring: true }] },
  // the kitchen table against the wall under or by the window, chairs or a stool on its open sides
  { id: "kitchen-table", anchor: ["kitchen-table"], stand: ["wall"], likes: ["window", "long"], use: 0, rank: 4,
    with: [{ items: ["chairs-bent", "stool"], at: "around", n: 2, bring: true }] },
  { id: "sink", anchor: ["kitchen-sink"], stand: ["wall", "corner"], likes: ["door", "inner"], door: 0.5, use: 0.6, rank: 5 },
  { id: "washstand", anchor: ["washstand"], stand: ["wall"], likes: ["nodoor", "inner"], use: 0.55, rank: 5 },
  // the chest and the Vertiko: the photographs and the good things on them, the mirror over them
  { id: "chest", anchor: ["chest-drawers", "vertiko"], stand: ["wall"], likes: ["pier", "inner"], use: 0.5, rank: 6 },
  // the pier mirror on its console between two windows, else on a wall of its own
  { id: "pier-mirror", anchor: ["pier-mirror"], stand: ["wall"], likes: ["pier", "inner"], use: 0.4, rank: 6 },
  // work by the light: the sewing machine beside a window, facing into the room with the window on its left
  { id: "sewing", anchor: ["sewing-machine"], stand: ["wall"], likes: ["window"], use: 0.6, rank: 7,
    with: [{ items: ["chairs-bent"], at: "around", n: 1 }] },
  { id: "piano", anchor: ["piano"], stand: ["wall"], likes: ["inner", "nodoor"], use: 0.7, rank: 7 },
  { id: "desk", anchor: ["writing-table", "rolltop-desk", "high-desk"], stand: ["wall"], likes: ["window"], use: 0.7, rank: 7,
    with: [{ items: ["chairs-bent"], at: "around", n: 1 }] },
  // a ministry's desk free in the room, the official's side to the windows, two callers' chairs before it
  { id: "partners-desk", anchor: ["partners-desk"], stand: ["free"], gaps: [1.1, 0.8], likes: ["window"], use: 0, rank: 4,
    with: [{ items: ["leather-chair"], at: "around", n: 3 }] },
  // plants in the window's corner
  { id: "plant", anchor: ["fan-palm", "araucaria", "aspidistra", "makart-bouquet"], stand: ["corner"], likes: ["window"], use: 0.2, rank: 8 },
];

/** Where a thing that sits on another goes, best host first (by item). Unlisted: a table, else a chest, else a
 *  washstand. A thing with no host in the room is left out. */
export const ON: Record<string, string[]> = {
  kettle: ["range"], pot: ["range"], enamelware: ["range", "kitchen-dresser"],
  canisters: ["kitchen-dresser"], "coffee-mill": ["kitchen-dresser", "kitchen-table"], "ersatz-goods": ["kitchen-dresser", "kitchen-table"],
  gramophone: ["vertiko", "chest-drawers", "table-round"], samovar: ["table-round", "vertiko", "chest-drawers"],
  birdcage: ["chest-drawers", "vertiko", "kitchen-dresser"], "knick-knacks": ["vertiko", "chest-drawers"],
  "box-camera": ["vertiko", "chest-drawers"], "reservist-stein": ["vertiko", "chest-drawers", "kitchen-dresser"],
  "petroleum-lamp": ["table-round", "kitchen-table", "chest-drawers", "washstand"], candle: ["chest-drawers", "washstand", "table-round", "kitchen-table"],
  typewriter: ["rolltop-desk", "writing-table"], "desk-lamp": ["partners-desk", "writing-table"],
};
/** The props whose tops things go on: the top's height and the usable part of it (x0, z0, x1, z1 in the prop's own
 *  frame), where it isn't the whole top (the dresser's counter before its upper cupboard, the range's hob). */
export const TOPS: Record<string, { y: number; r?: [number, number, number, number] }> = {
  dresser: { y: 0.89, r: [-0.55, -0.24, 0.55, -0.02] },
  range: { y: 0.805, r: [-0.45, -0.25, 0.45, 0.28] },
};
