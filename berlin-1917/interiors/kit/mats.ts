// The interior kit's materials: one table, so a tile's static geometry merges to one draw per material (SOP §8) and
// every room shares the same few surfaces. Colours are sRGB hex; worn, sooted and faded, never new (SOP §1.2).
// `glow` marks a flame or a mantle: emissive, and the set adds its light.

// Reflections: `coat` is a clear layer over the colour (varnish, coach lacquer, enamel, a wet film) with its own
// `coatRough`, so a glossy panel reflects the street sharply over a duller paint; `reflect` is the base's reflectance
// (Bevy's 0.5 is a dielectric's 4%; 0.35 for dry matte stuff, 0.6 for glazes).
export type Mat = { color: string; rough: number; metal?: number; alpha?: number; glow?: string; glowMul?: number; coat?: number; coatRough?: number; reflect?: number };

export const MATS = {
  // walls and shells
  "lime-wash": { color: "#b9b29f", rough: 0.97 }, // distemper (Leimfarbe), yellowed by gas and coal
  "lime-dirty": { color: "#8f877a", rough: 0.98 },
  "lime-damp": { color: "#9d9583", rough: 0.97 }, // lime wash over a wall that never dries: black mould in blotches (0075)
  "oil-dado": { color: "#4f5b4a", rough: 0.55 }, // oil-painted lower wall, kitchens and stairs
  "paper-stripe": { color: "#a79a7c", rough: 0.9 },
  "paper-damask": { color: "#5d4334", rough: 0.85 },
  "ceiling-boards": { color: "#6d5a44", rough: 0.85 },
  "boards-painted": { color: "#7f7a6b", rough: 0.6 }, // an outbuilding's plank ceiling in oil paint, yellowed (Ritterstraße 120)
  "plaster-ceiling": { color: "#c4bcaa", rough: 0.97 },
  brick: { color: "#6f4433", rough: 0.92 },
  "brick-wash": { color: "#9d9586", rough: 0.95 }, // whitewashed cellar brick, flaking
  "brick-raw": { color: "#8a5440", rough: 0.9 }, // the fresh break: unweathered inner brick
  mortar: { color: "#8f8676", rough: 0.98 },
  earth: { color: "#3f352b", rough: 0.98 },
  "floor-boards": { color: "#7d6247", rough: 0.75 }, // scrubbed softwood
  parquet: { color: "#7a5532", rough: 0.42 }, // waxed oak, the palaces' and the good flats' floors
  "parquet-turned": { color: "#684628", rough: 0.46 }, // the same oak across the grain: a parquet square turned a quarter reads darker
  "floor-cellar": { color: "#4b443b", rough: 0.95 }, // brick-on-edge, swept
  "tile-floor": { color: "#8c7f6c", rough: 0.4 }, // Mettlach tiles, shop
  "tile-white": { color: "#dcd8cc", rough: 0.25 }, // range and shop wall tiles
  "stove-glaze": { color: "#e2d6ba", rough: 0.16 }, // a good flat's tiled stove: cream glaze, each tile raised (kit/salon.ts salon-stove)
  "stove-joint": { color: "#b3a78e", rough: 0.7 }, // the pale joints between its tiles
  // the other glazes of kit/stoves.ts: Berlin's white (melt-glazed) most of all, then manganese brown, green, a grey
  // blue and ochre; dark joints with the coloured ones
  "glaze-white": { color: "#e4e1d6", rough: 0.12 },
  "glaze-brown": { color: "#5b3a26", rough: 0.14 },
  "glaze-green": { color: "#41594a", rough: 0.13 },
  "glaze-blue": { color: "#6c7c88", rough: 0.14 },
  "glaze-ochre": { color: "#b08a4c", rough: 0.15 },
  "glaze-cream": { color: "#dcc590", rough: 0.14 }, // an ivory-yellow cream, warmer than stove-glaze
  "glaze-bordeaux": { color: "#6a2c29", rough: 0.14 }, // mouldings and friezes on a white stove
  "joint-dark": { color: "#5d554b", rough: 0.75 },
  // a photograph's albumen print and the figure on it (kit/stube.ts photos)
  "photo-sepia": { color: "#9a8466", rough: 0.55 },
  "photo-dark": { color: "#3b3129", rough: 0.6 },
  iron: { color: "#1d1c1b", rough: 0.55, metal: 0.7 },
  "iron-rust": { color: "#46301f", rough: 0.85, metal: 0.3 },
  zinc: { color: "#858a8e", rough: 0.45, metal: 0.8 },
  tin: { color: "#a3a6a3", rough: 0.38, metal: 0.65 }, // tinned sheet: milk cans, mess tins, lamp bodies
  brass: { color: "#9c7f3f", rough: 0.35, metal: 1 },
  glass: { color: "#c9d3d2", rough: 0.05, alpha: 0.18 },
  "glass-dark": { color: "#3c4644", rough: 0.08, alpha: 0.5 },
  "glass-plate": { color: "#2a3236", rough: 0.03, alpha: 0.07 }, // a shop's plate glass and its cases: clear, so the goods show
  "glass-frost": { color: "#d6dad4", rough: 0.6, alpha: 0.8 }, // an office door's light, acid-etched
  "enamel-black": { color: "#121212", rough: 0.3, coat: 0.6, coatRough: 0.12 }, // a bicycle's frame, a railing's and a bench's iron, stove-enamelled or painted
  granite: { color: "#8b8782", rough: 0.85 }, // kerbs and plinths: the grey Lusatian granite
  // wood
  "wood-dark": { color: "#35231a", rough: 0.5 }, // stained and polished, Gründerzeit furniture
  "wood-mid": { color: "#5a3c26", rough: 0.6 },
  "wood-soft": { color: "#86684a", rough: 0.75 }, // plain softwood, kitchen
  "wood-raw": { color: "#8d7559", rough: 0.92 }, // cellar slats, crates
  "wood-grey": { color: "#625a4f", rough: 0.95 }, // old weathered boards
  "wood-split": { color: "#9c7f5c", rough: 0.92 }, // split firewood a few weeks in a court: pale faces gone grey-brown
  "wood-weathered": { color: "#6f6a61", rough: 0.92 }, // boards left out for decades: silver-grey, no varnish (a pump's housing, a hutch, a privy)
  bark: { color: "#3f3226", rough: 0.97 }, // pine and beech bark on firewood
  "paint-white": { color: "#cfc8b6", rough: 0.6 }, // painted dresser, window frames
  "paint-green": { color: "#2d3a30", rough: 0.55 }, // shop fittings
  // textiles
  linen: { color: "#d2ccbc", rough: 0.92 },
  "linen-grey": { color: "#a8a293", rough: 0.95 },
  "check-blue": { color: "#5f6f8c", rough: 0.92 },
  "check-red": { color: "#8c4a44", rough: 0.92 },
  plush: { color: "#561d1f", rough: 0.97 },
  lace: { color: "#ddd6c4", rough: 0.9, alpha: 0.85 },
  // a net half-curtain on a door's glass (kit/door.ts): finer and thinner than a runner's lace, so the shop shows through it
  "lace-net": { color: "#cfc8b6", rough: 0.9, alpha: 0.5 },
  wool: { color: "#4a463f", rough: 0.98 },
  jute: { color: "#86704c", rough: 0.97 },
  oilcloth: { color: "#5f6e64", rough: 0.35 },
  "cloth-floral": { color: "#4a3a2c", rough: 0.85 }, // a dark printed cloth to the floor over a kitchen table
  straw: { color: "#a68a52", rough: 0.95 },
  hay: { color: "#7d7448", rough: 0.95 },
  paper: { color: "#e0d8c4", rough: 0.85 },
  "paper-poster": { color: "#c9b991", rough: 0.85 },
  // the shops' goods (war stock: dark, drab and few; feldgrau everywhere; paper yarn "Ersatz" cloth in cream)
  "cloth-navy": { color: "#2b3346", rough: 0.95 },
  "cloth-field": { color: "#5d6152", rough: 0.95 },
  "cloth-brown": { color: "#5a4434", rough: 0.95 },
  "cloth-black": { color: "#23211f", rough: 0.95 },
  "cloth-cream": { color: "#cbbf9f", rough: 0.9 },
  felt: { color: "#3a3530", rough: 0.95 },
  fur: { color: "#3b2a1e", rough: 1 },
  leather: { color: "#4a2e1e", rough: 0.55, coat: 0.2, coatRough: 0.4 },
  card: { color: "#b6a585", rough: 0.9 },
  mirror: { color: "#a9b0b4", rough: 0.1, metal: 0.65 }, // no environment map in a set: a full metal mirror shows black, so a grey sheen
  // things
  enamel: { color: "#ddd9cd", rough: 0.25 },
  // the Works: a brewery cellar turned shell works (interiors/kit/works.ts)
  cement: { color: "#56534d", rough: 0.85 },
  "brick-dark": { color: "#5a3729", rough: 0.93 }, // sooty brick, dark mortar: a works' walls (light mortar strobes at a distance)
  "lime-sooty": { color: "#5e574d", rough: 0.95 }, // a works' limewashed vault under years of smoke
  // a gallery's timber
  sand: { color: "#9c8662", rough: 0.97 }, // Berlin's sand, run in through the lagging
  lagging: { color: "#6b5a46", rough: 0.9 }, // close boards behind the timber sets
  "steel-bright": { color: "#8a8c8a", rough: 0.32, metal: 1 }, // a shell body fresh from the lathe
  copper: { color: "#9a5b3a", rough: 0.38, metal: 1 }, // driving bands
  "gun-grey": { color: "#5a5d55", rough: 0.6 }, // field-grey paint: the gun, the crane, finished shells
  "paint-red": { color: "#7b2b22", rough: 0.5 }, // fire buckets, the no-smoking plate
  canvas: { color: "#857a62", rough: 0.95 }, // tarpaulins, vent ducts, the gallery's curtains
  "enamel-blue": { color: "#2e4867", rough: 0.25 },
  stoneware: { color: "#8f8064", rough: 0.45 },
  terracotta: { color: "#94533a", rough: 0.9 },
  coal: { color: "#121212", rough: 0.45 },
  briquette: { color: "#1c1a18", rough: 0.85 },
  potato: { color: "#8b6d45", rough: 0.9 },
  turnip: { color: "#a08a5a", rough: 0.8 },
  bread: { color: "#4a3020", rough: 0.85 }, // K-Brot: dark war bread
  leaf: { color: "#33492a", rough: 0.75 },
  "leaf-dead": { color: "#6b4a2a", rough: 0.85 }, // fallen leaves, brown and sodden, in gutters and gully slots
  fir: { color: "#24392a", rough: 0.85 }, // a Christmas fir's needles, darker and bluer than a leaf
  wax: { color: "#eee6cf", rough: 0.6 }, // candle wax
  "apple-red": { color: "#8a2a1e", rough: 0.4 }, // a polished apple on a tree
  flower: { color: "#a4302b", rough: 0.8 },
  marble: { color: "#cfcac0", rough: 0.3 },
  // the side streets' shops (interiors/kit/corner.ts)
  "paper-blue": { color: "#2b4166", rough: 0.9 }, // the sugar loaf's wrapper
  pulses: { color: "#a88f55", rough: 0.85 }, // peas and lentils in the open sack (war: more often groats and swedes)
  meat: { color: "#7a2f2a", rough: 0.6 },
  fat: { color: "#d8c7aa", rough: 0.55 },
  sausage: { color: "#5e2a1f", rough: 0.45 },
  cheese: { color: "#c9a85a", rough: 0.6 },
  egg: { color: "#ddcfb6", rough: 0.6 },
  coke: { color: "#3a3936", rough: 0.95 }, // gas-works coke: grey, porous, lighter than coal
  ember: { color: "#e2561c", rough: 1, glow: "#ff4a10", glowMul: 1.6 }, // coke burning through, about 900 C: orange-red
  "tile-blue": { color: "#3d5a7a", rough: 0.25 }, // a dairy's band of blue tiles
  // the stairwells (interiors/kit/stair.ts)
  "dado-brown": { color: "#5a3b2b", rough: 0.5 }, // a front stair's oil-painted dado, oxblood brown
  stencil: { color: "#8c6d3e", rough: 0.6 }, // the stencilled band along its top
  "tread-worn": { color: "#a58d6c", rough: 0.85 }, // treads worn pale where the feet go, or where the runner lay
  "paint-brown": { color: "#4a3326", rough: 0.55 }, // a rear stair's woodwork: rail, balusters, strings, frames in brown oil paint
  runner: { color: "#5e2b24", rough: 0.95 }, // the stair runner, a red-brown wool
  "glass-amber": { color: "#b07a2a", rough: 0.1, alpha: 0.55 }, // the half-landings' leaded lights
  "glass-green": { color: "#4a6e3e", rough: 0.1, alpha: 0.55 },
  "glass-ruby": { color: "#7e2b2b", rough: 0.1, alpha: 0.55 },
  wax: { color: "#e3d9c0", rough: 0.6 },
  rubble: { color: "#7c6b5b", rough: 0.98 },
  snow: { color: "#d4d8dc", rough: 0.85 }, // trodden at the edges, grey with ash where the stoves are emptied
  // lights
  flame: { color: "#ffd9a0", rough: 1, glow: "#ffb15c", glowMul: 6 },
  mantle: { color: "#fff1d6", rough: 1, glow: "#ffd9a8", glowMul: 4 }, // gas mantle, about 2,000 K through the glass
  "lamp-shade": { color: "#e8e1cf", rough: 0.6, glow: "#ffcf96", glowMul: 0.35 }, // white opal shade lit from inside
  // ── outdoors (kit/tram.ts, vehicles.ts, military.ts, lamps.ts, street-acc.ts, patriot.ts) ──────────────────────────
  // the Große Berliner's cars: fir-green side panels and ivory (de.wikipedia GBS Sommer-Winter-Wagen: "tannengrün und
  // elfenbeinfarben"), three winters into the war without a repaint
  // Coach paint was varnished: the cars' panels still throw back the street through three winters' grime. Each has a
  // worn twin (faded, the varnish gone dull, edges rubbed to primer) for the cars that haven't been to the shops.
  "tram-green": { color: "#2c3f31", rough: 0.5, coat: 0.45, coatRough: 0.22 },
  "tram-ivory": { color: "#cfc6a8", rough: 0.5, coat: 0.45, coatRough: 0.22 },
  "tram-green-worn": { color: "#3a4a3c", rough: 0.68, coat: 0.15, coatRough: 0.5 },
  "tram-ivory-worn": { color: "#b3a98a", rough: 0.68, coat: 0.15, coatRough: 0.5 },
  "tram-roof": { color: "#3d3a35", rough: 0.85, reflect: 0.35 }, // canvas over boards, painted and sooted
  "lacquer-black": { color: "#141413", rough: 0.3, coat: 0.85, coatRough: 0.12 }, // a cab's, a hearse's coachwork
  "lacquer-black-worn": { color: "#1e1d1b", rough: 0.5, coat: 0.35, coatRough: 0.35 }, // a cab horse's third winter
  "paint-field": { color: "#5b6050", rough: 0.6, coat: 0.1, coatRough: 0.45 }, // field-grey on the army's lorries, wagons and kitchens
  "paint-field-worn": { color: "#62665a", rough: 0.75, reflect: 0.4 }, // field-grey sun-faded and scrubbed, chalky
  "canvas-field": { color: "#6a6a58", rough: 0.95, reflect: 0.3 }, // a lorry's tilt
  rubber: { color: "#1b1b1a", rough: 0.9, reflect: 0.35 }, // solid tyres, worn grey at the tread
  "wheel-red": { color: "#6e2a20", rough: 0.5, coat: 0.35, coatRough: 0.3 }, // a dray's wheels and undercarriage, varnished
  "wheel-yellow": { color: "#9c7d3a", rough: 0.5, coat: 0.35, coatRough: 0.3 },
  "post-blue": { color: "#283f63", rough: 0.45, coat: 0.3, coatRough: 0.3 }, // the Reichspost's letter boxes (MSPT 4.0.451: blue)
  "iron-bright": { color: "#4a4844", rough: 0.22, metal: 0.95 }, // iron rubbed bright by hands: grab rails, a controller's handle, a rail's head
  "wood-varnish": { color: "#7a5434", rough: 0.4, coat: 0.5, coatRough: 0.25 }, // a tram's slatted seats and saloon panelling, varnished ash
  "wood-varnish-worn": { color: "#6d4a2e", rough: 0.55, coat: 0.2, coatRough: 0.45 }, // the same, sat bare along the edges
  "wheel-red-worn": { color: "#6a3428", rough: 0.68, coat: 0.12, coatRough: 0.5 }, // faded toward brick, the varnish gone
  "fire-red": { color: "#8c1f17", rough: 0.35, coat: 0.6, coatRough: 0.15 }, // the fire brigade's varnished vermilion
  "fire-red-worn": { color: "#7a3328", rough: 0.6, coat: 0.15, coatRough: 0.45 },
  "iron-cast": { color: "#423f3a", rough: 0.55, metal: 0.45 }, // painted cast iron out of doors: the Kreuzberg monument, railings, lamp masts
  "poster-red": { color: "#9a3a2b", rough: 0.88 }, // posters on a Litfaß column, matte printed paper
  "poster-green": { color: "#4d6548", rough: 0.88 },
  "poster-yellow": { color: "#c7a54c", rough: 0.88 },
  "wheel-yellow-worn": { color: "#94804e", rough: 0.68, coat: 0.12, coatRough: 0.5 },
  "paint-brown-worn": { color: "#56402f", rough: 0.72, reflect: 0.4 },
  "leather-worn": { color: "#56392a", rough: 0.7, coat: 0.08, coatRough: 0.5 }, // cracked and dried, rubbed pale where sat on
  "leather-black": { color: "#1c1b1a", rough: 0.5, coat: 0.35, coatRough: 0.35 }, // a cab hood's and seat's black hide
  "leather-black-worn": { color: "#2b2825", rough: 0.68, coat: 0.1, coatRough: 0.5 }, // cracked grey along the folds
  "leather-green": { color: "#26302a", rough: 0.6, coat: 0.18, coatRough: 0.4 }, // an invalid chair's oilcloth-leather upholstery
  cane: { color: "#b5965e", rough: 0.75 }, // woven rattan cane, a chair's seat and back
  wicker: { color: "#8f6f48", rough: 0.8 }, // boiled willow (gesottene Weide), a market basket
  "wicker-weathered": { color: "#7a6f60", rough: 0.9 }, // willow left out in a court for years: greyed, the bark gone
  silver: { color: "#8e8a82", rough: 0.35, metal: 1 }, // a walking stick's knob, worn bright where the hand goes
  malacca: { color: "#6e4a2c", rough: 0.4 }, // polished cane, an umbrella's or a stick's crook
  "hide-calf": { color: "#8a6c50", rough: 0.95 }, // a satchel flap of calfskin with the hair on, brown and white
  "tar-wood": { color: "#2b2722", rough: 0.8 }, // a barge's tarred planking
  slate: { color: "#30353a", rough: 0.55 }, // a school slate, written grey-white with a slate pencil
  sponge: { color: "#c2a25c", rough: 1 },
  "paper-kraft": { color: "#9a7b55", rough: 0.88 }, // brown wrapping paper
  "cloth-navy-worn": { color: "#33394a", rough: 0.97 }, // the cab's cloth: shiny where sat, stained, faded at the windows
  "granite-red": { color: "#7b4b40", rough: 0.45, reflect: 0.55 }, // Swedish red granite, the steps dressed, the pedestal polished
  "ice-grey": { color: "#9aa6ab", rough: 0.08, coat: 0.8, coatRough: 0.05 }, // a basin frozen over, dull where snow dusted it
  // street life (kit/life.ts): what people and horses leave on the street, the news and the market
  newsprint: { color: "#c3bba6", rough: 0.85 }, // a newspaper's page: columns of grey type on cheap war paper
  "newsprint-wet": { color: "#8a8376", rough: 0.45 }, // a sheet lying in the slush, soaked dark and flat
  dung: { color: "#5e4e31", rough: 0.55 }, // fresh horse dung, wet; straw in it
  ash: { color: "#8c8981", rough: 0.97 }, // stove ash tipped on the ice for grit
  "snow-dirty": { color: "#85827b", rough: 0.55 }, // slush shovelled to the kerb: grey, wet, ash and soot in it
  "board-chalk": { color: "#25282a", rough: 0.92 }, // a slate or blackboard
  chalk: { color: "#dcd9cf", rough: 0.98 }, // the price chalked on it
  cabbage: { color: "#7d9660", rough: 0.6 }, // white cabbage's pale outer leaves
  herring: { color: "#8e959a", rough: 0.22, reflect: 0.7 }, // salt herring, silver
  "cabbage-old": { color: "#7c7746", rough: 0.6 }, // a leaf a day on the setts: yellowed and browning
  "enamel-yellow": { color: "#c39b33", rough: 0.22, coat: 0.5, coatRough: 0.1 }, // a street sign's stove enamel
  "enamel-red": { color: "#8f2a22", rough: 0.22, coat: 0.5, coatRough: 0.1 },
  "awning-stripe": { color: "#8b6f5a", rough: 0.93 }, // a market awning in faded red and cream stripes
  bronze: { color: "#3e4637", rough: 0.55, metal: 0.65 }, // statues: dark patina, green in the runs
  alder: { color: "#9b7a55", rough: 0.85 }, // the Iron Hindenburg's carved alder
  "nail-iron": { color: "#2a2826", rough: 0.5, metal: 0.8 },
  "nail-silver": { color: "#8f9294", rough: 0.35, metal: 1 },
  "nail-gold": { color: "#a88a3e", rough: 0.3, metal: 1 },
  "flag-black": { color: "#151515", rough: 0.9 },
  "flag-white": { color: "#dedad0", rough: 0.9 },
  "flag-red": { color: "#9a2a26", rough: 0.9 },
  "sign-white": { color: "#e2dfd6", rough: 0.4, coat: 0.6, coatRough: 0.1 }, // enamel and painted sheet: a tram's roof number, a stop plate
  "stripe-black": { color: "#1a1a1a", rough: 0.6 }, // a sentry box's Prussian stripes
  "stripe-white": { color: "#d6d3ca", rough: 0.6 },
  "glass-signal": { color: "#d9d2b8", rough: 0.2, alpha: 0.6, glow: "#ffe2b0", glowMul: 0.5 }, // a tram's signal lantern
  sandstone: { color: "#a39a86", rough: 0.92 }, // Silesian and Elbe sandstone: balcony slabs, consoles, sills, plinths
  "mud-road": { color: "#4a4237", rough: 0.85 }, // road mud and slush thrown up from the setts: dull where it dried, wet in the runs
} satisfies Record<string, Mat>;

export type MatId = keyof typeof MATS;
