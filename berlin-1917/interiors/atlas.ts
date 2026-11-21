// The room atlas: what the city's windows show. Each entry is a generated room (a recipe, a seed), rendered from its
// centre as five 90-degree faces (back, left, right, floor, ceiling) into assets/interiors/rooms/NN.png, a horizontal
// cross the world lane's glass shader ray-casts into (interior mapping). The index is stable: append, never reorder,
// because assets/interiors/windows/<tile>.json names rooms by it.
/** `shop`: a shop of that trade (interiors/shops.ts shopSet) in place of a room recipe; its window is the shopfront's
 *  left display window. */
/** `stair`: a stairwell of that kind (interiors/stair.ts stairSet), one storey of it round the middle half-landing,
 *  seen through the half-landing's window. */
export type AtlasRoom = { n: number; recipe: string; seed: number; lit: boolean; note: string; shop?: string; stair?: "front" | "rear"; cellar?: true; loft?: true; office?: true };
/** A flat's room (not a shop, not a stairwell): the pools an ordinary window's lit or day room comes from. */
export const isFlat = (a: AtlasRoom) => !a.shop && !a.stair && !a.cellar && !a.loft && !a.office;

export const ATLAS: AtlasRoom[] = [
  { n: 0, recipe: "worker-stube", seed: 1, lit: true, note: "side wing Stube, lamp lit" },
  { n: 1, recipe: "worker-stube", seed: 2, lit: false, note: "side wing Stube by day" },
  { n: 2, recipe: "worker-stube", seed: 3, lit: true, note: "Stube with damask paper" },
  { n: 3, recipe: "worker-kitchen", seed: 1, lit: true, note: "kitchen, lamp lit" },
  { n: 4, recipe: "worker-kitchen", seed: 2, lit: false, note: "kitchen by day" },
  { n: 5, recipe: "kammer", seed: 1, lit: false, note: "Kammer: beds" },
  { n: 6, recipe: "petty-stube", seed: 1, lit: true, note: "gute Stube, front building" },
  { n: 7, recipe: "petty-stube", seed: 2, lit: false, note: "gute Stube by day" },
  { n: 8, recipe: "attic-flat", seed: 1, lit: true, note: "attic room under the slope" },
  { n: 9, recipe: "cellar-flat", seed: 1, lit: true, note: "cellar flat, half below the court" },
  // the shops (11-17): Leipziger Straße's trades, lit; after closing the tile shader dims them (glow_dark)
  { n: 10, recipe: "shop", shop: "shop-fabric", seed: 0.13, lit: true, note: "draper: cloth shelves, the counter" },
  { n: 11, recipe: "shop", shop: "shop-fashion", seed: 0.3, lit: true, note: "ladies' fashion: forms, vitrines" },
  { n: 12, recipe: "shop", shop: "shop-furs", seed: 0.47, lit: true, note: "furrier" },
  { n: 13, recipe: "shop", shop: "shop-hats", seed: 0.64, lit: true, note: "milliner, hatter" },
  { n: 14, recipe: "shop", shop: "shop-menswear", seed: 0.81, lit: true, note: "men's outfitter" },
  { n: 15, recipe: "shop", shop: "shop-shoes", seed: 0.98, lit: true, note: "shoe shop: boxes to the ceiling" },
  { n: 16, recipe: "shop", shop: "shop-small-goods", seed: 1.15, lit: true, note: "gloves, ties, small goods" },
  // the side streets' shops (11-17, interiors/corner.ts): the trades of every block off the main streets
  { n: 17, recipe: "shop", shop: "shop-grocer", seed: 0.21, lit: true, note: "grocer (Kolonialwaren): drawer wall, coffee mill, sacks" },
  { n: 18, recipe: "shop", shop: "shop-butcher", seed: 0.4, lit: true, note: "butcher: tiled, the meat rail near bare" },
  { n: 19, recipe: "shop", shop: "shop-dairy", seed: 0.59, lit: true, note: "dairy (Milchgeschäft): churns, the cold-room door" },
  { n: 20, recipe: "shop", shop: "shop-tobacco", seed: 0.78, lit: true, note: "tobacconist: cigar cabinet, the lighter on the counter" },
  { n: 21, recipe: "shop", shop: "shop-barber", seed: 0.97, lit: true, note: "barber: chairs at the mirrors, the gas heater" },
  { n: 22, recipe: "shop", shop: "shop-destille", seed: 1.16, lit: true, note: "Destille: the bar, casks, plank tables" },
  { n: 23, recipe: "shop", shop: "coal-cellar-shop", seed: 1.35, lit: true, note: "coal merchant's cellar: bins, the decimal scale (a cellar window, no display)" },
  { n: 24, recipe: "shop", shop: "shop-baker", seed: 1.54, lit: true, note: "baker: bread shelves near bare, the scale, an empty cake case" },
  { n: 25, recipe: "stair", stair: "front", seed: 0.37, lit: true, note: "front stair at dusk: the half-landing under the leaded light, gas burning on the landings" },
  { n: 26, recipe: "stair", stair: "front", seed: 0.61, lit: false, note: "front stair by day: the runner, the oxblood dado, light through the leaded glass" },
  { n: 27, recipe: "stair", stair: "rear", seed: 0.53, lit: true, note: "rear stair at dusk: the WC door, a gas jet on the landing" },
  { n: 28, recipe: "stair", stair: "rear", seed: 0.82, lit: false, note: "rear stair by day: worn treads, flaking limewash, the court's grey light" },
  { n: 29, recipe: "house-cellar", cellar: true, seed: 0.29, lit: false, note: "the house's storage cellar under its window: one flat's compartment, coal and potatoes, the slats, dark beyond" },
  { n: 30, recipe: "house-cellar", cellar: true, seed: 0.47, lit: true, note: "a storage cellar at dusk: someone fetching coal, a candle on an upturned pail" },
  // behind the street fronts' dormers (interiors/attic.ts): the drying loft, a maid's room, an attic flat by day (8 is it lit)
  { n: 31, recipe: "drying-loft", loft: true, seed: 0.31, lit: false, note: "the drying loft behind a dormer: rafters, lattice store rooms, sheets on lines" },
  { n: 32, recipe: "maid-room", seed: 0.52, lit: true, note: "a maid's room under the mansard, her lamp lit" },
  { n: 33, recipe: "attic-flat", seed: 2, lit: false, note: "an attic flat under the mansard by day" },
  // the Kontor behind the commercial houses' and the ministries' windows (map kind commercial, public): wired, so lit late
  { n: 34, recipe: "office", office: true, seed: 1, lit: true, note: "an office at dusk: desks under green shades, files to the ceiling" },
  { n: 35, recipe: "office", office: true, seed: 2, lit: false, note: "an office by day: the standing desks, the copying press, the safe" },
  // the trades read from the Adreßbuch that showed through a stand-in (11-17, interiors/kit/trade.ts)
  { n: 36, recipe: "shop", shop: "shop-books-music", seed: 1.73, lit: true, note: "book and paper shop: books to the cornice, the ladder, field-post cards" },
  { n: 37, recipe: "shop", shop: "shop-jeweller", seed: 1.92, lit: true, note: "jeweller and watchmaker: the clock wall, iron rings for gold" },
  { n: 38, recipe: "shop", shop: "shop-florist", seed: 2.11, lit: true, note: "florist in the war winter: mourning wreaths, fir in buckets, pot plants" },
  // the Konditorei, 34 storefronts and the chocolatiers
  { n: 39, recipe: "shop", shop: "shop-konditorei", seed: 2.29, lit: true, note: "Konditorei-café: the buffet and its empty cake case, marble tables, bentwood chairs, the plush banquette, chocolate for the front in the window" },
  // the department stores (Wertheim, Leipziger Straße 126-137; Tietz, 46-50a; interiors/department.ts): Leipziger Straße at noon
  { n: 40, recipe: "shop", shop: "shop-department", seed: 2.47, lit: true, note: "department store hall: cast-iron columns, counters down both sides, stock to the cornice, the windows dressed for the war" },
  { n: 41, recipe: "shop", shop: "dept-floor", seed: 2.65, lit: true, note: "department store upper floor: confection and furs on forms, counters, the columns" },
  { n: 42, recipe: "shop", shop: "shop-department", seed: 2.83, lit: true, note: "department store hall, a second seed: a 71 m front shows two halls, not one repeated" },
  { n: 43, recipe: "shop", shop: "war-kitchen", seed: 3.01, lit: true, note: "war kitchen (Kriegsküche, Mittelstandsküche): kettles, counter, the queue rail; open at midday" },
  { n: 44, recipe: "shop", shop: "shop-weinstube", seed: 3.19, lit: true, note: "Weinstube and wine restaurant: panelling, clothed tables, booths, the racks and casks; the wine merchants' tasting rooms too" },
  { n: 45, recipe: "shop", shop: "shop-bank", seed: 3.37, lit: true, note: "bank counter hall: the counter under brass grilles, the clerks' desks, the strongroom door; war-loan placards" },
  { n: 46, recipe: "shop", shop: "shop-pharmacy", seed: 3.53, lit: true, note: "Apotheke (Offizin): shelving of porcelain jars over drawers, the Rezeptur with its glazed top and balance, the poison cabinet" },
  { n: 47, recipe: "shop", shop: "shop-drugstore", seed: 3.61, lit: true, note: "Drogerie: the drawers, tins, packets and bottles on the shelves, the counter with its scale" },
  { n: 48, recipe: "shop", shop: "shop-photo", seed: 3.71, lit: true, note: "photographer: portraits in field grey on the walls and on easels in the window, the studio behind (backdrop, column, camera)" },
  // the goods shops and the hotel hall (11-17), which stood in on small-goods and the Weinstube till v9 was final
  { n: 49, recipe: "shop", shop: "shop-optician", seed: 1.66, lit: true, note: "optician: the lens cabinet, field glasses and a trench periscope in the window, the sight-test chart" },
  { n: 50, recipe: "shop", shop: "shop-leather", seed: 1.83, lit: true, note: "leather goods: suitcases stacked to the cornice, officers' map cases and belts, trunks" },
  { n: 51, recipe: "shop", shop: "shop-glass-silver", seed: 2.0, lit: true, note: "glass and silver: crystal on the étagères, silver trays, cutlery cases" },
  { n: 52, recipe: "shop", shop: "shop-hotel", seed: 4.07, lit: true, note: "hotel hall: marble and damask, columns, two chandeliers, the porter's desk and its key board" },
  // the palaces' offices of state (11-17): the ministries, court offices, the Landtag, the Palais and the embassies (use "state")
  { n: 53, recipe: "ministry", seed: 4, lit: true, office: true, note: "office of state at dusk: the lamp on the partners' desk, the chandelier, the monarch in a gilt frame, a globe" },
  { n: 54, recipe: "ministry", seed: 2, lit: false, office: true, note: "office of state by day: the General Staff's map of the front, the double door, the bookcases" },
  // the hotels' guest rooms over their halls (11-17): use "hotel", floors 1 up
  { n: 55, recipe: "hotel-room", seed: 1, lit: true, note: "hotel guest room at dusk: the brass bed made up white under the electric light, the washstand, a suitcase on its stand" },
  { n: 56, recipe: "hotel-room", seed: 3, lit: false, note: "hotel guest room by day: an officer on leave, his greatcoat, cap and sabre on the stand by the door" },
  { n: 57, recipe: "salon", seed: 1, lit: true, note: "salon of the bel étage at dusk: the chandelier lit over plush and damask, the black piano with music open, a vitrine of porcelain, the tiled stove, a Mark lake in a gilt frame, the son's photographs" },
  { n: 58, recipe: "salon", seed: 3, lit: false, note: "salon of the bel étage by day: the Norfolk pine on its stand, a Makart bouquet, the front map with its little flags over the piano, the sofa under a gilt landscape" },
];
/** Which atlas rooms a window may show, by where it is (the world lane's pane kind, floor and building part). */
/** `use`: the building's map kind. A commercial house (hotel, bank, business house) shows offices behind three windows
 *  in four and a hotel's or a flat's good room behind the fourth; a public building (a ministry, an office) offices. */
export function roomsFor(kind: string, floor: number, part: "front" | "wing" | "rear", use?: string): number[] {
  if (kind === "shop") return ATLAS.filter((a) => a.shop && a.shop !== "coal-cellar-shop").map((a) => a.n);
  if (kind === "cellar") return [29, 30, 9, 23]; // the house's storage cellar (dark, or a candle in it), a cellar flat, a coal merchant's (tools/interiors/windows.ts weighs them)
  if (kind === "stair") return ATLAS.filter((a) => a.stair === (part === "front" ? "front" : "rear")).map((a) => a.n); // the front building's stair, or a wing's and the rear building's
  if (kind === "dormer") return [8, 32, 33, 31]; // lit: the attic flat or a maid's room; dark: the flat by day or the drying loft
  // the palaces' offices of state (map/1917/buildings.geojson `institution`): the ministry rooms, the plain offices until the atlas has them
  if (use === "state") { const m = ATLAS.filter((a) => a.recipe === "ministry").map((a) => a.n); return m.length ? m : [34, 35]; }
  // a hotel's guest rooms over its hall, on the street and the court (use "hotel": a hotel storefront in the house, or the
  // map's `institution`); until the atlas has them, the house's rooms as for any other
  if (use === "hotel" && floor >= 1) { const h = ATLAS.filter((a) => a.recipe === "hotel-room").map((a) => a.n); if (h.length) return h; }
  if (use === "public") return [34, 35];
  if (use === "commercial") return [34, 35, 34, 35, 34, 35, 6, 7];
  // the bel étage: the front building's first floor, the good flat; half its street rooms the salon, half a gute Stube
  if (part === "front" && floor === 1) { const s = ATLAS.filter((a) => a.recipe === "salon").map((a) => a.n); if (s.length) return [...s, 6, 7]; }
  if (part === "front" && floor >= 1) return [6, 7, 0, 1];
  return floor === 0 ? [0, 1, 5] : [0, 1, 2, 3, 4, 5];
}
