# Replicating Berlin in 1917–18, through its seasons: what we have, how it fits, what's left (2026-11-17)

The target is a full-scale, walkable copy of the Friedrichstadt and Alt-Berlin slice, 3.5 × 3.5 km (EPSG:25833
389400–392900 E, 5817300–5820800 N). It is to be lit in every season and weather: spring, summer, autumn and winter,
snow, blizzard, rain and thunder. It is built from every public source we can get. The city stays the same through
the year; its light, ground, trees and weather change by date.

Around the slice, the whole of Straube's 1910 plan is now a graybox too: 19 sheets of 3.5 km on one shared tile cache
(`tools/map/city.sh`), about 14 × 12 km from Charlottenburg to Lichtenberg and Wedding to Tempelhof. The city is at a
coarser level of detail (a 4 m ground lattice, no lots), and the slice keeps its full detail inside it.

The method has three rules:

- **Dated sources only.** Every structure comes from a source dated to 1917 or before, placed on the 1917 map.
- **Graybox first.** Footprints, heights, streets and the underground are made right before any detail is added.
- **Each detail from its own source.** Materials, facades, signs, light and ground each come from their own source.
  Where no source says, the rule we used is written down and marked as an assumption (§7).

Everything below is measured from the files in `map/`, `research/` and `out/map/`. People are left out on purpose.

## 1. Where it stands

- **The whole city is a graybox (11-17).**
  - 65,672 buildings on all 19 sheets and the slice (`map/1917/city/*.parquet`), each plan building with its 1910
    block use.
  - 15,257 of them stand beyond the plan: today's buildings (ALKIS) in the blocks the Umweltatlas dates to 1917, a
    Gründerzeit block type or half the houses built by 1917 (`outside.sh`, ASSUMED to stand where 1917's did). A
    block cut by the plan's edge is filled whole, and the towns past the 1910 boundary come in: Wilmersdorf, Friedenau,
    Neukölln, Weißensee, Lichtenberg, Pankow.
  - Off the plan (340 of the 672 tiles), the rivers and lakes are today's (Stadtstruktur type 100, 1.54 km²), and the
    land no block or street takes is open ground, ASSUMED fields: parks, rail and works there are not drawn.
  - Open ground: 24.4 km² of street, 21.8 km² of courtyard, 3.1 km² built up beyond the plan's drawing, 82.7 km² open
    (most of it the fields off the plan).
  - The ground at 1917 street level and the 1887 code's heights on every sheet (16,426 of 52,566 city buildings
    front a street with a centreline). 672 tiles of 500 m, 1.3 GB (`compositions/city.tsx`: aerial and low).
  - 50,964 ground-floor shops, fudged from read streets (`shops.ts`, ASSUMED): 9,829 pubs, 6,458 shoemakers, 4,898
    butchers, 3,536 bakers. A tenement block's shops come from Ackerstraße 1917, 163 houses
    read in full: 51 pubs and drink sellers, 44 shoemakers, 34 butchers, 24 bakers. A mixed or core block's come from
    the read streets of the slice. A corner house gets the corner pub with chance 0.6.
  - The limits: the building-age map counts housing only, so a factory or barracks beyond the plan stays empty unless
    it is listed. Since 11-18 a listed monument that stood by 1917 brings in today's footprints half inside its outline
    on blank ground (every phase dated by 1917, the outline 6 ha at most, bridges and stations left out): 541
    buildings from 280 monuments, among them about 110 in works, factories and breweries, 62 schools, 48 churches and
    14 hospitals. Today's
    footprints stand in for 1917's there, post-war infill included.
  - **Monuments on every sheet (11-18):** 2,925 Denkmaldatenbank entries read across the 19 city sheets, none missing;
    2,108 dated to 1917 or before, 1,534 of them joined to a 1917 building. heights.ts gives a building the storeys its
    entry states (Tiergarten's sheet: 122 buildings), and landmarks.ts puts 27 towers from
    `research/landmarks-city-1917.tsv` on the sheets; the city skyline mesh now carries 53.
  - **Drums (11-18, graybox.ts):** a footprint 20 m or more across that is 0.9 round, or whose outline's distance from
    its centre varies by 6.5% or less (a square varies by 9-11%), is drawn as a brick drum with no window texture
    under a shallow dome: the gasholder houses and the water towers. A holder measured for itself keeps its own wall
    and crown (the Englische Gas-Anstalt's eight, `research/gasholders-1917.tsv`, five off the 1933 Mittelholzer
    aerials); the rest take the Fichtestraße holder's proportions (Schwedler, 1874-76: 56 m across, a 21 m brick wall,
    27 m to the crown; ASSUMED for them). 29 drums in all: the Fichtestraße, Danziger Straße and Charlottenburg works
    among them, and the 1877 water tower in Prenzlauer Berg.
- **The graybox is mapped.**
  - 12,401 buildings standing in 1917, each with its use in 1910 (housing, shops, core, industry, public, military),
    and state or municipal told from commercial as the plan draws them.
  - The streets told from the courtyards: 2.89 km² of street and 5,938 courtyards (3.10 km²).
  - The streets with their 1900 names and house numbers.
  - Water, parks, and rail (the railway yards from the plan's own tint).
  - The ground at 1917 street level on a 2 m grid.
  - Ten of ten landmarks are present, and the 1930s buildings are absent.
  - The world lane bakes this into 196 tiles of 250 m at three levels of detail.
- **The underground is partly mapped.**
  - The U-Bahn of 1917 on the paths the plan draws: 15 stretches in the slice, plus the halted Nord-Süd-Bahn works.
  - 56.4 km of Radial System III's sewers from Hobrecht's 1884 atlas, with 1,416 manholes.
  - 851 boreholes drilled before 1946.
- **Materials are in hand for 484 buildings.** 651 listed monuments were read. 536 are dated to 1917 or before, and
  484 of those are joined to 1917 buildings.
- **Businesses are read for six streets.** All come from the 1917 Adreßbuch.
  - Leipziger Straße: 99 houses and 213 storefronts.
  - Friedrichstraße: 225 houses placed, with 608 shops, cafés, hotels and banks.
  - Jerusalemer Straße: 46 houses and 103 storefronts.
  - Unter den Linden: all 70 houses, 169 storefronts: the Adlon (1), the Hotel Bristol (5-6), the Russian embassy (7),
    HAPAG's travel bureau (8), Kranzler (25) and Café Bauer (26) across Friedrichstraße, the Passage with its
    Panoptikum (22), 26 bank entries, and the Niederländisches and Königliches Palais (36, 37).
  - Wilhelmstraße: 132 of 149 houses placed (the 17 on the bend into Belle-Alliance-Platz are left out), 43 state
    entries: the Kriegsministerium (81-85), Reichs-Schatz-Amt (60-61), Reichskolonialamt (62), Staatsministerium (63),
    Hausministerium (73), Reichsamt des Innern (74), Auswärtiges Amt (75-76) and Reichskanzlei (77).
  - Neue Wilhelmstraße: all 13 houses.
  - Separately, all 63 of Berlin's breweries.
  - Where the plan drew neighbours as one mass, the read houses cut it into lots (68 masses, 196 lots), so the
    Reichskanzlei, the Auswärtiges Amt and the Hausministerium are separate buildings with their own names. The lot
    lines run perpendicular to the street (assumed: no lot map of 1917 is in hand; the 1900 map's lots cover only the
    east of the slice).
- **The light rules are written** (world/SOP.md §3, §6): gaslit streets, arc lamps on the main avenues, a third of
  the windows lit at dusk, a low winter sun.

## 2. Layer by layer

| Layer | Count | Source (licence) | How exact | Next |
| --- | --- | --- | --- | --- |
| Building footprints, `buildings.geojson` | 12,376 (10,908 private, 219 commercial, 1,249 public; 13 dropped by eye, not-built.tsv) | 3,140 from "Berlin um 1900" vectors (dl-de/zero); 9,142 read off Straube's 1910 plan by our network; 94 built 1910-17, from today's ALKIS footprints of listed buildings | Vectors exact; the reading scores 0.84 IoU on held-out tiles; the scan sits within 1.5 m of today's survey on 46 of 49 tiles; public or commercial by the plan's own greys (`drawn.ts`) | A few courtyards read as buildings |
| Building use, `use` on each building | Mixed 3,847, residential 3,714, core 2,725, public 912, industry 485, military 66, the other 764 (rail, green, utility, special, water, or no vote) | "Berlin um 1910" land-use map (dl-de/zero), read by colour (`use1910.ts`) | The map is generalised and sits 2–13 m off per tile; the fit on our streets takes that off. A small building at a block's edge can take the next block's use | Shop fronts and the businesses' fudge (`mixed`, `core`) |
| Heights | 219 from listed buildings' own entries (122 of them lower than the rule, 2-4 storeys); 294 from today's survivors (ALKIS); the rest by rule; every street front's width and the 1887 code's eaves cap | Denkmaldatenbank, ALKIS (dl-de/zero), the Baupolizeiordnung of 1887 | The rule is an assumption: 5 storeys private, 4 public (the 22 m eaves line). The 1928 photos' shadows were measured and do not resolve storeys | Churches and towers by hand |
| Open ground, `open.geojson` | 5,729 street pieces (2.89 km²) and 5,938 courtyards (3.10 km²) | The slice minus everything built; split by the plan's roadway tint (`roadway.ts`), with the 1910 map's streets where the U-Bahn band hides it | On OpenHistoricalMap's 1917 street lines, open ground is street 97.9% of the time (`checkstreets.ts`) | Gardens the reader misses stay courtyard |
| Names | 252 street labels, 2,385 house numbers, 114 named buildings | 1900 survey; OHM features dated to 1917 (CC0) | Names of 1899–1913 | Check against the 1917 Adreßbuch street list |
| Water, parks, rail | Rail land 0.37 km² in 626 pieces | As buildings; the yards from the plan's lilac tint | Water 0.90–0.94 after the colour gate; parks 0.19 IoU (weak). Rail: the yards follow the tint, which takes none of the truth tiles' streets or buildings | Parks |
| Ground, `ground1917_2m` | 2 m grid, 21.8–42.2 m in the core (to 48.8 m on the Tempelhofer Berg) | DGM1 (dl-de/zero), kept on 1917 streets | 276 of Straube's spot heights read off the plan (`spots.geojson`): 260 of the 266 on streets within 1 m of the grid, half within 0.13 m; the ground is bent to the other 6, where today's ground was raised (the Alsenviertel, the Urbanhafen) | The rest of the figures, by eye where the reader misses them |
| U-Bahn, `underground` and `city/ubahn` | 13 stations and 15 stretches in the slice; 40 stations and 39 stretches citywide (tunnel, viaduct, ramp) | OHM dated stations (CC0); paths from the Straube plan | Each stretch is the cheapest route over the plan, where its dashed "Untergrundbahn" band and the viaduct cost least (`tunnels.ts`); 12 stretches beyond the plan's edge are straight | Tunnel sections from the period's publications |
| Trams, `trams.geojson` | 129 lines, 42.8 km | OHM `railway=tram` valid in 1917 (CC0); 5 from the Straube plan | As OHM | — |
| Sewers, `sewers.geojson` and `sewer_points.geojson` | 56.4 km (9.8 km brick egg profile, 46.5 km stoneware pipe; 4.9 km of it joins over gaps in the trace), 1,416 manholes and gullies, 2 pumping stations | Hobrecht, *Die Canalisation von Berlin*, 1884, Atlas Blatt 4 (e-rara, PD) | Routes and kinds as drawn. The plate is fitted on 68 blocks (median 4.0 m off, 90% within 7.2 m) and then bent locally onto our street edges; 94% of the sewer's length lies outside buildings. Sizes are Hobrecht's standard sections (Blatt 7: 22 canal profiles from the 0.6 x 0.9 m egg to the 3.1 x 2.0 m main, and 5 storm-outlet arches; Blatt 8: ten stoneware bores 0.21-0.48 m; `research/sewer-profiles-1884.tsv`, with bricks per metre), but which section a sewer gets is modelled from the length it drains, as are inverts and falls (assumed). Depth below the street is 2.0–8.2 m (median 3.3 m) | Blatt 9 gullies and sand traps; thin pipes; Systems I, II and V |
| Boreholes | 851 before 1946, read into layers | Bohrdaten WFS (dl-de/zero) | Apple Vision on typeset logs; 840 of 851 pair up fully | Soil grids between holes |
| Monuments, `denkmale.geojson` | 651 read; 536 built by 1917; 484 joined to 1917 buildings | Denkmaldatenbank Berlin. The map carries facts and links only; the entry texts stay in `cache/` | Facts are read by word lists, so a fact is evidence, not proof | Facts onto the facade grammar |
| Businesses, `businesses/*.geojson` | Leipziger 99 houses: 175 shops, 32 food, 6 banks. Friedrichstraße 225 houses: 396 shops, 143 food, 43 hotels, 26 banks | Berliner Adreßbuch 1917, Part III (ZLB, PD); read by Claude from the scans | Leipziger: 28 houses on their 1900 lot numbers, the rest about 16 m off on average. Friedrichstraße: all spread by share of numbers (assumed) | The other streets (§4.5) |
| Breweries, `research/breweries-1917.tsv` | 63 firms | Adreßbuch 1917, Part IV p. 38 (PD), read by eye | As printed | — |
| 3D tiles (world lane) | 196 tiles; LOD0 up to 574k triangles a tile, LOD1 61k, LOD2 about 5k | `tools/world/bake.ts` from the layers above | A Friedrichstraße camera holds 273 MB of a 640 MB budget | Streaming; materials from §4.1 |
| City graybox, `map/1917/city/*.parquet` | 65,672 buildings (15,257 beyond the plan), 51,243 open-ground pieces, 7,411 green, 761 rail, 288 water (43 of them today's, off the plan), 3,310 labels | Straube 1910 plan (PD) traced on its 332 drawn tiles; 1910 block use from "Berlin um 1910" (dl-de/zero); beyond the plan, Umweltatlas Stadtstruktur 2024 and Gebäudealter (dl-de/zero) with ALKIS | As the slice's trace; beyond the plan, today's footprints and water | Monuments; works and barracks beyond the plan |
| Shops, `city/shops.parquet` | 50,711 on 25,596 fronts: 9,755 pubs, 6,421 shoemakers, 4,882 butchers, 3,520 bakers | Weights from Adreßbuch 1917 (PD): Ackerstraße, and the slice's read streets | ASSUMED: kind and sign word only, no names | Read more streets |
| Street dressing (world lane) | 3,321 gas lanterns, 39 arc lamps on Leipziger Straße, 442 Litfaß columns, 117 pumps, 601 manholes | `props.json`, placed by the bake | Rules in the bake | Shop signs from the Adreßbuch |

## 3. Graybox first: what still reads wrong, in the order to fix it

Done on 11-17:

- **Railway yards.** The Anhalter and Potsdamer goods yards read as open ground, with 0.12 km² of rail. Rail now
  follows the plan's lilac tint: 0.37 km².
- **The U-Bahn's paths and band.** The tunnels follow the plan's band. The band pieces the reader took for thin
  buildings (12, including the strip under the Leipziger Platz garden) are now open ground.
- **Street or courtyard.** Open ground was split by piece size, so most courtyards came out as street. It is now
  split by the plan's tan roadway tint. The strips between tram rails and the U-Bahn band go to the street.
- **Block use.** Each building carries its 1910 use from the land-use map, which tells the shop streets (mixed, core)
  from the housing behind them.
- **The sewers' fit.** The plate was fitted on lines alone, which left Friedrichstadt 10-17 m off and 29% of the
  sewer under houses. It is now fitted on blocks and bent locally onto our street edges: 6% under houses.
- **Public or commercial.** The plan draws state and municipal buildings dark grey and commercial ones hatched;
  both had been read as public. 232 hatched buildings (hotels, banks, theatres, the Reichsbank) are now commercial.
- **Lettering read as houses.** Street names and marks on the roadway that the reader took for buildings (68 pieces)
  are gone.
- **The scan's offset** is now a smooth field: tiles measured surely against today's buildings (22, the east edge
  among them, up to 2.1 m from the median) keep their own shift, blended between tile centres so seams stay whole.

Still to do:

1. **Heights.** Done as far as the sources go: listed buildings take the storeys their entries state, survivors
   today's, every street front its street's width and the 1887 code's cap (no front above the street's width, never
   over 22 m). The 1928 photos were measured for shadows on all 49 tiles and do not tell storeys apart (correlation
   0.07 with the survivors': the sun was high, so a storey is 2 m of shadow, about the prints' blur). Churches, domes and
   towers come from their own records (§4.8, `landmarks.geojson`).
2. **The ground.** Done: 276 of the plan's spot heights read off the scan on this Mac. Today's streets are at the
   1910 levels almost everywhere (260 of 266 within 1 m); the six that are not mark ground raised since, and the 1917
   grid is bent to them.

Later on 11-17:

- **The pale pieces** filed as public: done (19 by eye: nine dropped as courtyards, a parterre, a planned line;
  three set private, three halls named; four more from the world lane's eye-height check).
- **Pumpwerk III**, the sewers' pumping station at Hallesches Ufer: Hobrecht's Blatt 16 outlines and dimensions it.
  The reader had run its engine hall into the fire brigade depot as one 4-storey block; now 8 buildings with the
  plate's storeys and heights, and its 43.1 m chimney on the skyline.
- **The plan's printed house numbers as a witness**: 3,283 read; the 133 lying more than 8 m from any building were
  checked by eye and none is a missed house (spot heights, railway arches, yards, the cleared Spreedreieck).
- **The Bethlehemskirche** placed and on the skyline (36.4 m).

The graybox has every landmark's height (29): St. Hedwig's 49.9 m measured on an 1886 photo, the Dom's corner towers 78 and
66 m from today's surface model plus the 16 m they lost. The gasworks' eight holders are in as
circles with heights measured on the 1933 aerials (research/gasholders-1917.tsv)
(the English gas works' are mapped as plain 5-storey blocks). Everything after that adds detail.

## 4. The intricacies, and how each is replicated

### 4.1 Wall materials

The listed monuments are our only building-by-building record of materials. Here is what their texts name, for the
536 dated to 1917 or before (one monument can name several):

| Class | n | Render | Stucco | Sandstone | Brick | Limestone | Terracotta | Stripped later |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Housing | 186 | 69 | 46 | 20 | 42 | 2 | 7 | 11 |
| Commerce | 110 | 12 | 8 | 33 | 37 | 24 | 3 | 7 |
| Churches | 22 | 4 | 2 | 2 | 15 | 0 | 6 | 6 |
| Public and other | 218 | 41 | 14 | 40 | 81 | 13 | 23 | 14 |

Other facts across all 536: classicist 161, historicism 116, war damage 117, baroque 64, Jugendstil 51,
neo-baroque 50, storeys added later 50, tower 47, copper 36, dome 34, steel frame 34, granite 34, glazed ceramic 31,
mansard 30.

How they're used:

- **A building a monument covers** (484 of them) takes its facts directly: material, colour, roof and style.
- **A fact marked "rebuilt", "stripped" or "storeys added"** means today's front is not the 1917 front. That
  building's look comes from a dated photograph instead.
- **Every other building** takes a rule from the shares above. The rule is an assumption, and these are its terms:
  - A house on a residential street is rendered or stuccoed, with brick on about a quarter.
  - A commercial building on Leipziger Straße or Friedrichstraße faces the street in sandstone or limestone, or in
    brick for the older and plainer ones.
  - A public building is brick or sandstone, with terracotta trim.
  - The listed buildings are a biased sample: notable buildings that survived the war. So the rule's shares are a
    starting point, to be checked against the photo matcher's street photographs.

### 4.2 Facades and roofs

- **The grammar.** The world lane's facade grammar (`tools/world/facade.ts`) builds each front from its footprint
  edge: bays, then windows, trim, shopfronts, portals, balconies, cornice and roof.
- **The era picks the bay templates.** A monument's style fact, or for unlisted houses the block's age, chooses
  them:
  - classicist for the 18th-century and early-19th-century Friedrichstadt houses (161 monuments name it);
  - historicism and neo-baroque for 1870–1900;
  - the steel-frame Geschäftshaus, with its large glass and stone piers, for the 1900–1914 commercial streets
    (34 name a steel frame).
- **Roofs.** Monuments name mansards (30), hipped roofs (22), slate (12) and copper on domes and towers (36). The
  Berliner Dach, steep on the street and flat toward the court, is the world lane's next roof step.

### 4.3 Textures

- **Base surfaces are CC0 scans.** ambientCG and Poly Haven have plaster, brick, sandstone, granite setts, asphalt,
  slate, zinc and patinated copper. On the tiles they are tinted and aged by the procedural soot, grime and wet
  layers in `components/world/shaders.ts`.
- **Everything specific to Berlin is ours**, made from public-domain sources:
  - shop names and sign lettering, set in Fraktur and grotesque type from the period's own printing;
  - facade ornament traced from dated photographs (CC0 or PD only);
  - the Straube sheet itself, which becomes the cab's paper chart.
- No texture is taken from a photograph whose licence is unclear (SOP §2 and our licence rule).

### 4.4 Streets and ground

- The street surfaces, kerbs, setts and gutters are in the catalogue (`research/catalogue.md`, "The ground").
- The street levels come from `ground1917_2m`.
- The season and the day's weather are a layer on top, never baked into the ground. It holds dust and dry setts in
  summer, leaves in the gutters in autumn, and snow banked at kerbs, slush and frozen ruts in winter. It holds
  puddles in hollows under rain and thunder, and drifts against walls in a blizzard (raea's docs/wear.feature, WR9).
  The weather by date for 1917–18 is still to be read from the record (plan task).

### 4.5 Businesses and signs

**The pipeline is built and runs end to end** (`tools/addr/`):

1. `fetch.sh` gets the scans.
2. `transcribe.ts` reads each column with Claude.
3. `parse.ts` turns the text into houses, with misread numbers corrected and flagged.
4. `place.ts` places them on the 1917 fronts between the corners the directory lists.
5. `streets.sh` reruns every street read so far.

**What reading costs.** Leipziger Straße's 14 columns cost $0.73 to read. Friedrichstraße took 56 columns. Unter den
Linden, Wilhelmstraße and Neue Wilhelmstraße took 42 columns (175 pieces) for $2.21, about $0.05 a column.

**Placing a new street** takes a config (`tools/addr/streets/NAME.json`): `axis.ts` drafts its axis from OHM (refitted
on its straight part), from the 1900 house numbers (`--numbers`), or through two known points (`--through`); the
corners are the openings in the 1917 fronts, named in the directory's order. A wide street sets `reach` (the Linden:
45 m). The 1900 map prints no house numbers west of x 390,897, so the Linden and Wilhelmstraße are spread by share of
numbers (assumed).

**What's left.** Part III lists every house of every street, so the other streets need reading, not fudging:

1. Unter den Linden, Wilhelmstraße and Neue Wilhelmstraße are read (11-17). Potsdamer Straße next (only its first few
   hundred metres are in the slice), and the bend of Wilhelmstraße into Belle-Alliance-Platz.
2. Then the slice's side streets.
3. Where a street is not read yet, its shops are generated from the read streets' trade mix and flagged as made up.

**Signs.** A sign carries the firm's name as printed. The trade decides the shop kit (interiors lane).

### 4.6 The underground

- **U-Bahn.**
  - Lines in service: the 1902 Stammstrecke (part viaduct, part tunnel) and the Spittelmarkt line.
  - The Nord-Süd-Bahn works under Friedrichstraße were halted in 1917.
  - The tunnels and viaduct are graybox meshes (`tools/map/under.ts`). Their sections are sourced: 6.24 m clear
    width, 3.30 m clear height, the ceiling at most 1.20 m below the street (Deutsche Bauzeitung 1901; Schöneberger
    Untergrundbahn 1911), and the Spree tunnel about 11 m down (Hochbahngesellschaft 1913).
  - Measured off the 1902 Festschrift's tunnel plates (11-18), each by its own dimensions: columns on the line every
    4.5 m; a station 80 m long and 12.64 m clear between its walls (the plate scaled by its 11 m street), a side
    platform 3.5 m wide against each wall with 2.465 m clear over it, so 0.835 m over the rail, and the tracks 3.24 m
    apart. The tunnel slice's viaduct now takes hochbahn.ts's measured deck, girders and frame spacing.
  - Assumed until measured: which stations have side and which island platforms (before 1908 side, as the plate; from
    1908 an island 4 m wide), the later stations' widths, and the Nord-Süd-Bahn pit.
  - **The Hochbahn citywide (11-17, `tools/map/hochbahn.ts`):** the 11 viaduct stretches and 3 ramps of the city
    U-Bahn layer, 9.7 km, drawn into the city graybox with 13 raised stations open in winter 1917-18. Siemens &
    Halske's standard viaduct came in spans of 12, 16.5 and 21 m, cantilevered and suspended girders on portal frames
    (Fischer and Lorenz, BTU Cottbus 2002, after Eiselen in the Deutsche Bauzeitung 1901); every frame here stands at
    16.5 m (15 m at stations), since which span stands where is not read. The traced line ran along a kerb, so
    `streetmiddle.ts` moves it to the middle of its street, between the first building or water on either side.
  - **The viaduct measured (11-18):** Siemens & Halske's Festschrift for the opening (February 1902; Zentral- und
    Landesbibliothek Berlin, Public Domain Mark, digital.zlb.de PPN 34947903) gives the numbers and plates the drawing
    now takes. The line: 10,141 m, of it 7,300 m iron viaducts and bridges, 960 m stone, 1,700 m tunnel, 570 m ramps;
    curves down to 80 m radius; the streets it runs in 31 to 52 m wide. The clear heights prescribed under it: 4.55 m
    over a carriageway, 2.8 m over a central walk, 4.8 m over state railway tracks, 5.85 m over the Ringbahn. The
    regular spans: 12, 15 (at stations), 16.5 and 21 m, of 1.5 m panels; the main girders 1.7 m deep (system). The big
    bridges: 77 and 65 m over the Landwehrkanal and the Anhalter Bahn (a through truss, photographed), 84 m and a
    continuous 60 + 82 m over the Potsdam goods station. The stations: 900 m apart on average, platforms 80 m long and
    3 to 3.5 m wide, roofed for a train's length (about 45 m), 6.6 m over the ground on average. Measured off its
    plates, scaled by their own dimensions: the deck 7.1 m between railings, the tracks 3.0 m apart, a portal's legs
    splayed from feet 5.15 to 5.32 m apart, a platform 0.85 m over the rails, the hall 13.0 m clear. The photographs
    show the halls differed: arched at Prinzenstraße and Möckernbrücke, glazed and gabled at Hallesches Tor, gabled on
    the Weststrecke's plate. One rail level (4.55 m + 1.7 m) and one barrel hall for all are ASSUMED; the stations'
    mean (6.6 m to the platform) puts their rails about 0.5 m lower, on shallower girders. Drawn: 492 portal frames
    (18 left out where both feet would stand in water or on railway land), 13 stations with their platforms and hall,
    and 2 trussed crossings, 94 m over the Potsdam yards and 42 m over the Landwehrkanal: shorter than the
    Festschrift's, as the plan draws only part of the yards under the line. Along Hallesches and Tempelhofer Ufer the
    traced canal reaches under the line; the photographs show its frames on the quay, so one foot in the water keeps
    its frame.
  - **The band cleared (11-18, `tools/map/bands.sh`):** the plan draws the elevated line and its stations over the
    streets, and the reader took some of that for buildings: Prinzenstraße's hall stood in Gitschiner Straße as a
    60 by 16 m public building, four storeys from the station's own monument entry, and as a wall it pushed the
    traced line off the street's middle. Measured against the line hochbahn.ts draws (moved to the street's middle,
    its raised runs only), a building lying 60% or more within 8 m of it is dropped, and so is one within 15 m of a
    station open in 1917 and half within 20 m of the line; their ground becomes street. 104 pieces, 0.9 ha, among them the halls
    of Prinzenstraße, Nollendorfplatz and Bülowstraße, which hochbahn.ts draws instead. Each big one was checked by
    hand: a strip 11 to 17 m wide along the line with its storeys from the default rule, and only the halls overlap a
    building today. The first rule had taken a whole ramp stretch, tunnel and all, and dropped Wittenbergplatz's 1913
    entrance hall; a ramp now counts only at its ramp. `viaduct.sh` runs hochbahn.ts, the band and the station
    buildings in turn until a pass changes nothing, since a cleared street moves its middle.
  - **The stations' own buildings (11-18, `tools/map/stations.sh`):** the Festschrift's photographs show buildings
    at street level beside the viaduct: Schlesisches Tor's station building, Prinzenstraße's domed stair house with a
    covered bridge to its platforms, Hallesches Tor's stair building. Today's footprints of a station's own kind
    (Bahnhofsgebäude, Gebäude zum U-Bahnhof, railway works) inside the listed monument of an elevated station that
    stood by 1917 come in beside the deck, the deck's width cut out: Schlesisches Tor's 1901 building and Warschauer
    Brücke's station, stair tower and works (5 buildings, 7,800 m²). Prinzenstraße's stair house is gone today; the
    plan's 47 m² piece of it stays, held to two storeys from the station's four (ASSUMED off the plate).
  - **Station bases:** the plates show Nollendorfplatz's station closed from the street to its dome, and Bülowstraße's
    hall on an enclosed base in the street's middle. The plan draws both as buildings (778 and 619 m²), which the band
    had taken for misreads. bands.sh now keeps the piece a station point falls in at those two, and stations.sh holds
    it to two storeys, up to the platform. streetmiddle.ts does not count the line's own held buildings as the
    street's walls, so the line stays where it settled without them. A drop is one way: the stair house had been
    dropped on a pass whose line was later moved back, so it and the two bases were restored from the version before
    the band; after a change to streetmiddle.ts the line's sheets are rebuilt fresh.
  - **Stairs (11-18, `tools/map/stairs.ts`):** Prometheus (13, no. 639, 1902, p. 231) gives Möckernbrücke as the
    typical station. At one head end of the platforms a 5 m stair rises to a landing with the ticket office, and there
    divides to the departure and the arrival platform; the Festschrift gives each platform's flight 2 to 2.5 m wide,
    platforms 6.6 m over the street on average, and its Möckernbrücke plate shows the flights roofed beside the deck at
    the hall's end. So at Möckernbrücke, Kottbusser Tor, Oranienstraße, Danziger Straße and Nordring each platform's
    2.5 m flight runs on down beyond its end outside the girders, roofed, 32 steps of 0.16 by 0.30 m (ASSUMED), to a
    landing 2 m over the street (ASSUMED: headroom under the deck's 4.55 m) with its ticket booth, and a 5 m stair runs
    on down the line's axis to the street. Which end is not given: the one with more open ground across the line,
    taken for the crossing street the station stood at (ASSUMED; Nordring's may be wrong, its exit today is at the
    Ringbahn end). Prometheus names the stations built otherwise (Stralauer Tor, Schlesisches Tor, Hallesches Tor,
    Bülowstraße, Nollendorfplatz), and with Prinzenstraße, Warschauer Brücke and Gleisdreieck their access is their own
    buildings. Prinzenstraße's stair house gets its covered bridge at the platform's level, 13 m long. Hallesches
    Tor's glazed stair building against its hall and Stralauer Tor's stair on the Oberbaumbrücke are not drawn yet.
  - **Ramps end beyond the stations:** the plan's stretches run station to station, so a ramp and the viaduct it
    rises to met at the plan's station point, each bending into it; at Nollendorfplatz the two hooked back on each
    other, and the hall drawn over the hook showed as ribs. hochbahn.ts now chains a ramp into the viaduct it meets
    (where only the two meet), so the line runs through the station and is despiked there. And a station stands at
    full height with its ramp beginning beyond the platform: Prometheus (1902) has Nollendorfplatz's ramp into the
    tunnel begin in front of its domed hall, where the plan put the ramp's top at the station point, half the
    station on the slope. Nollendorfplatz and Danziger Straße change; the ramps' raised parts reach about 40 m further.
  - **The line in its street's middle:** the trace runs along a kerb, up to 20 m off the axis in the 42 to 52 m wide
    Skalitzer Straße, so `streetmiddle.ts` walks up to 45 m each way, starts from the nearest street when a sample
    falls on a front, and shifts up to 22 m (the street 60 m wide at most, so a square still moves nothing). Where the
    first wall either way is water it keeps the plan's line: on Hallesches Ufer the frames stood on the canal quay, as
    photographed. 2,254 of 6,239 samples move, 3.2 m on average.
    The round blocks beside Gitschiner Straße are the Englische Gas-Anstalt's holders (see the drums below).
- **Sewers.**
  - The routes are Hobrecht's.
  - Every size is one of Blatt 7's and 8's standard sections; which one a sewer gets is modelled from the length it
    drains.
  - Blatt 9 (11-17) gives the shafts (0.95 m round, corbelled to a 0.556 m opening under a 0.716 m iron frame), the
    gullies (0.65 m square chambers, a 1.0 m silt pot, a cast-iron water seal, a 0.50 x 0.40 m grate), and III's sand
    trap (7.53 m radius, 5.0 m deep): the trunk enters it at +30.25 m NN, and the inverts now rise from there.
  - Blatt 16-18 give Pumpstation III and its machinery.
  - Systems I, II and V, the rest of the slice, are on Blatt 3 and 6.
- **Soil.** Read: map/1917/soil.geojson has the 851 pre-1946 boreholes as layers (840 complete), and
  soil_grid.json spreads them over the slice on a 25 m grid. Made ground is 2.1 m thick at the median and 4.9 m at
  p90, peat or lake mud turns up in 244 holes (along the Spree and the Museumsinsel), and the boulder clay starts
  about 11 m down. The logs give no water level, and groundwater depth is only known for 2009 and later, so a 1917 water
  table is still an assumption.
- **Cellars.** Every Mietshaus has one. No source gives the depth house by house, so their depth is an assumption
  until the Bauakten or plans are found.

### 4.7 Light

The world SOP's rules (§3 and §6) hold for every scene:

- **The lamps.**
  - Gas lanterns with incandescent mantles light every street, at about 2,000 K.
  - Electric arc lamps light Leipziger Straße and Potsdamer Platz: cold, blue-white, hissing.
  - At most a third of the windows are lit at dusk, warm and low, because coal is rationed.
- **The sky and the sun by date.** At 52.5° N the noon sun stands about 14° in late December, 37° at the
  equinoxes and 61° in late June (from the latitude and the sun's declination). Most winter days are grey overcast.
  The realism lane sets each season's look: trees bare or leafed, ground dry, wet or snowed, and that day's sun
  (docs/realism.feature in raea, D17 and LT16).
- **Every light is a thing in the world.** No lamp changes by more than 0.2 of its level a frame.
- **Units.** Glass and lamps glow in scene units, and dusk is real twilight (sun 30 lux, EV 6.6).
- **Still open:** the sky (flat for now), and the actual weather by date across the year. Thunder's flash belongs
  to the light, and its rain to the wear.

### 4.8 Landmarks

The landmarks are built one by one from their own records: monument entries, dated photographs and public-domain
publications. Never from today's state.

- **The city's skyline (11-17, `research/landmarks-city-1917.tsv`):** 32 towers, domes and spires beyond the slice's
  own table: every Berlin church over 75 m in en.wikipedia's list of tallest church buildings that stood by 1917, the
  taller ones under 75 m, and the town halls of Charlottenburg, Schöneberg and Neukölln, each height checked in its own
  de.wikipedia article. The 1917 heights, not today's: the Kaiser-Wilhelm-Gedächtniskirche 113 m (a 71 m ruin
  now), St. Matthias 93 m (60), the Reformationskirche 82 m (50), Heilig-Kreuz 81 m (59.3); the Georgenkirche 105 m,
  the Versöhnungskirche, Himmelfahrtkirche, Melanchthonkirche and Kaiser-Friedrich-Gedächtniskirche, all gone. Three
  stand in the slice and were missing from its table: the Georgenkirche, Heilig-Kreuz and St. Simeon. A tower's axis
  is the article's point (ASSUMED). `tools/map/skyline.ts` draws all of them with the world lane's shapes into one
  mesh over the city graybox. Left out: the Schöneberg gasholder (78 m, a lattice drum) and the Prenzlauer Berg water
  tower; Gethsemanekirche and Rathaus Lichtenberg until a height is found.
- **Checked present on the 1917 map:** the Reichstag, Dom, Zeughaus, Rotes Rathaus, Französischer and Deutscher Dom,
  Schauspielhaus, Kunstgewerbemuseum, Abgeordnetenhaus and Herrenhaus.
- **Schauspielhaus (11-17):** heights of its four masses from today's LoD2, since the exterior was rebuilt to
  Schinkel's form: the central block's pediments at 32.8 m (cornice 29.0), the portico's at 22.8 m (19.8), the wings'
  at 24.5 and 24.3 m (about 20.1). The figures over the pediments (Apollo's griffin chariot, Pegasus) have no height
  yet; Schinkel's Sammlung architektonischer Entwürfe, plates 7-12 (elevation and sections with a scale), would give
  them and check the rest.
- **1910 against 1917 (11-17):** the plan is seven years older than the setting. Buildings torn down in between
  stay on it: Friedrichstraße 138-141 (the Kaiser-Wilhelms-Akademie, 1913/14, and a Geschäftshaus, 1915/16) were
  found by the world lane's eye-height check and confirmed by the 1917 Adreßbuch ("Baustelle"). Each street read
  from the Adreßbuch is scanned for Baustelle entries; a demolition goes in `tools/map/not-built.tsv` with its source.
  Buildings put up between 1910 and 1917 are not on the plan at all: a listed building dated 1910-17 that stood in
  1917 stands as built, so its ALKIS footprints replace what the plan draws there (94 footprints from 61 monuments,
  among them the Admiralspalast, Zollernhof, Haus der Gesundheit, Allianz, Langenbeck-Virchow-Haus, the Landgericht II
  extension, the Jugendsynagoge; five older ones the reader missed added by hand; the Pergamonmuseum, a building site,
  left as the plan has it). Unlisted houses of 1910-17 are still missing; the Adressbuch's Baustelle scan finds the
  sites as each street is read.
- **The Stadtbahn and Bahnhof Friedrichstrasse (11-17, `stadtbahn.geojson`):** the viaduct's axis from
  OpenHistoricalMap, 23 bridges over streets and water found where the axis leaves the plan's rail band, rail 6 m over
  the ground (5.0-5.4 m clear under every street bridge, against 4.4 m required in 1882), and the 1882 hall from the
  Zeitschrift fuer Bauwesen of 1885: 144 m on the 285 m curve, 34-37.5 m wide, 16 pairs of three-hinged trusses,
  7 m brick side walls. Still to read: plate 17 for the crown (19.7 m assumed from Alexanderplatz) and how far the
  rebuilding begun in 1914 had gone by winter 1917-18 (Bauwelt 1915-16 has articles on it).
- **Bridges (11-17, `bridges.geojson`):** 38 street bridges found as street laid across gaps in the water, named from
  the plan's lettering, with the structure that stood in 1917 where a source gives it (25 so far; several of today's
  bridges are post-war replacements). The Weidendammer Brücke was not there: its superstructure came down in 1914 for
  the North-South U-Bahn's tunnel under the Spree, the north piers were rebuilt with the tunnel's first section in
  1914-16, the rest waited for the peace (all U-Bahn work stopped in 1917), and traffic crossed on a steel truss
  temporary bridge just downstream until 19 December 1923. The Kaiser-Wilhelm-Brücke and the Kurfürstenbrücke have
  their piers, abutments, openings and bays laid out from the period publications (`bridge_parts.geojson`), with the
  Great Elector on his bay; the same table takes the other bridges as they are read.
- **Trees (11-17, `trees.geojson`):** read from the 1928 aerial, in leaf, as crowns on parks and streets; the Linden's
  and the Tiergarten's trees of 1917 were still the ones standing in 1928. In December they are bare, so the bake
  draws branches to the crown's spread. Street trees count only in rows (as Berlin planted them), which leaves
  Friedrichstrasse bare, as it was. Still to read: "Die Straßenbrücken der Stadt Berlin"
  (1902) for the older bridges' spans and ornament.
- **Heights and axes (11-17, `landmarks.geojson`):** 19 towers, domes and spires from their own records: the Dom 114 m
  (16 m lower since 1975-81), the Petrikirche 111 m (gone 1964), the Stadthaus 101 m, the Rathaus 94 m (74 m to the
  balustrade), the Marienkirche 90 m, the Nikolaikirche 80 m, the Reichstag's dome just under 75 m, the Schloss dome
  70 m, the two Gendarmenmarkt domes 70 m, the Parochialkirche 65 m, the Siegessäule 60.5 m on the Königsplatz,
  the Jerusalemkirche over 70 m (Knoblauch in the Deutsche Bauzeitung, 1879), the Dreifaltigkeitskirche's dome 57 m,
  St. Michael 56 m, the Brandenburger Tor 26 m. Today's measured models (LoD2) cut spires short and leave some towers
  out, so they place an axis and check, never set a height. Still to find: St. Hedwig's lantern of 1887. The plate
  (compositions/skyline.tsx) draws them all from the south.
- **Next:** the Stadtschloss, the Brandenburger Tor, the Anhalter and Potsdamer stations, Bahnhof Friedrichstraße,
  the Admiralspalast (Friedrichstraße 101–102, in the directory) and the department stores on Leipziger Straße.

### 4.9 Weathering and wear

A city three winters into a war is dirty in particular places, not evenly. The wear is therefore worked out from its
causes, never scattered as noise. The method is the literature's (research/weathering-1917.md has the citations):
water drops are traced over each tile's geometry (Dorsey, Pedersen and Hanrahan, 1996), and they carry what they pick
up downstream (Chen et al., 2005). raea/wear (raea's docs/wear.feature, WR1–WR8) holds the general part. This
project holds the Berlin rules.

- **Done (WR1, WR2).** The cause maps are baked from each tile's geometry: open sky, winter sun, cavity, edge, height
  over the ground and openness. Run-off is traced over them. This gives tears under the ends of sills and rust bleeding
  below iron. A tile takes 4.9 s, plus 0.4 s for the run-off, and each map is 22 MB uncompressed. The recipes are
  prototyped on the world lane's shaders (components/wear/look.ts). The test pieces are a front, a firewall, rubble
  and a kerb (compositions wear-look and wear-testbed, posted as a review note).
- **Done (WR3).** Touch and spots are found by rules over the geometry, never placed by hand. Doors are held on
  their lock side and kicked at the foot; treads are dished; rail tops, passage walls at the shoulder and gateway
  jambs at hub height are worn. The spots are where a thing belongs, each with who put it there. Bills go on plain
  walls only: Berlin's Litfaß columns, from 1855, were brought in to keep bills off house fronts. Street plates go on
  corners, nameplates beside doors, and debris under soaked plaster. On a city tile the rules take 0.45 s and find
  1,398 door leaves (test bed posted as a review note).
- **How each material answers.**
  - Lime plaster and sandstone turn black where sheltered from rain and stay light where washed (Bonazza, 2019).
  - Brick loses its mortar where washed and blooms white below ledges.
  - Painted wood fades and peels on its south and west faces.
  - Iron rusts and stains the stone below it.
  - Plinths carry a splash band and a damp tide line. Their heights are ASSUMED until a Berlin source is read.
- **What is Berlin's own in 1917–18.**
  - **Copper.** It was seized from roofs, gutters, downpipes and cornice coverings by the notice of 9 March 1917, so
    the city has no green run-off except where an exempt building kept its copper.
  - **Brass.** Brass fittings were seized from June 1917 and expropriated in March 1918, so door handles, nameplates
    and letterbox flaps are mostly gone or replaced.
  - **Repairs.** No repair since 1914 (ASSUMED).
  - **Soot and wind.** Soot is high and the rain wind is from the west (both ASSUMED; the DWD's open data is the
    source to read).
- **Every season and weather (WR9).** What years of weather left stays the same through the year: soot, crust,
  fading, peeling, rust and touch. What a season or a day does is drawn over the same maps from the look's values,
  never baked:
  - **Spring:** damp and algae.
  - **Summer:** dust.
  - **Autumn:** leaves where the litter channel gathers them.
  - **Winter:** frost where the winter sun misses.
  - **Snow:** lying on faces open above, gone where feet pass.
  - **Blizzard:** driven snow on faces the storm wind reaches.
  - **Rain:** wet faces, rivulets down the run-off paths and puddles in hollows.
  - **Thunder:** heavy rain; its flash belongs to the light.

  The bake therefore changes in two ways. The sun channel becomes the year's sun, which is what fades and dries.
  A fourth map holds the December sun (where snow lingers), the storm wind's reach and the litter traps. The storm
  wind is ASSUMED east to north-east until the DWD records are read.
- **Done (WR9's bake half).** The year's sun and the fourth map are in the bake. The same test-bed corner is
  prototyped under all eight conditions with nothing baked per season: leaves gather in the gutter and at the wall's
  foot, the storm plasters the wall that faces it, and rain puddles in the hollows (posted as a review note).
- **Next.**
  - WR4 is the `raea wear bake` verb, and WR5 moves the recipes into the SDK part, with WR9's eight conditions.
  - WR6 is crumbling geometry for rubble and blown plaster.
  - Then a real Leipziger Straße corner, judged against dated photographs, and the hand-off to the world lane's tile
    bake.
- **Open.** Under the ray-traced renderer, the deferred pass skips surface hooks, so wear does not draw there yet
  (raea's realism plan, LT2).

## 5. Sources we have not used yet

| Source | What it gives | Licence | State |
| --- | --- | --- | --- |
| 1928 aerial photos (WMS `luftbild_1928_04`) | Checking the map; roof colour and texture | dl-de/zero | Shadows measured on all tiles (`shadows.ts`): they do not resolve storeys |
| Berlin um 1910 land use (`staedtebauliche_entwicklung`, `berlin_1910`) | Block use: housing, industry, military, government | dl-de/zero | Read: each building's use, and streets under the U-Bahn band |
| Gebäudealter 1992/93 (same service) | Which surviving buildings predate 1918 | dl-de/zero | Not read |
| 3D buildings LoD2 (CityGML) | Measured height and roof of every surviving building | dl-de/zero | Sampled in the survey |
| Adreßbuch 1917, Part III, every other street; Part IV, trades | Owners and businesses for every house | PD | Two streets read |
| Hobrecht atlas, Blatt 3, 6, 7, 8, 9, 16–18, 25, 26 | Profiles, structures, pumping stations, Systems I, II and V | PD | Blatt 4 read |
| Wikimedia Commons photographs, PD (the catalogue's harvest) | Facades, shopfronts, street furniture by date | PD and CC0 only | Matcher built; review pending |
| Deutsche Fotothek, Architekturmuseum TU Berlin, Europeana | Dated photographs and building plans | Mixed: licences first | Not started |
| Period engineering publications on the U-Bahn and the sewers | Stations, platforms, the viaduct, sewer profiles | PD where the author died before 1956 | Tunnel sections read (Deutsche Bauzeitung 1901, Hochbahngesellschaft 1913); the rest to find |
| Weather records, 1917–18 (DWD daily climate data, dl-de/by-2-0, credit required) | Snow, frost, ice, rain, thunder, wind and sunshine by date | Open data; to read | Plan task |

## 6. What's left, in order

1. The graybox is complete as far as the sources reach; what it waits on is the world lane's rules (chimney, round
   holders, reading eaves_m) when the city tiles unpark. Then weathering
   by cause (raea/wear, research/weathering-1917.md): cause maps and run-off are baked per tile; touch, the SDK part
   and crumbling are next.
2. Materials onto the facade grammar: the monuments' facts for their 484 buildings, and the §4.1 rule for the rest.
3. Unter den Linden, Wilhelmstraße and Potsdamer Straße from the Adreßbuch, then the side streets.
4. Shop signs and awnings on the 3D street, from the placed houses.
5. The landmarks of §4.8.
6. Sewer profiles and structures (Blatt 7, 8 and 9); Systems I, II and V.
7. Soil from the borehole logs.
8. The U-Bahn's stations, platforms and viaduct from the period's publications, replacing the assumed sizes.
9. The season and weather by date (all eight conditions), and the sky.
10. Streaming the tiles, so the whole slice can be walked.

## 7. Assumptions in the current build

Each one is listed so it can be replaced when a source turns up:

- **Storeys** where no survivor or monument says: 5 for private buildings, 4 for public.
- **House positions** on Friedrichstraße, and on Leipziger Straße away from the 28 lot numbers: spread along the
  block by share of house numbers.
  - On Leipziger Straße, where this can be checked, it is 16 m off on average and 79 m at most.
  - Some of Friedrichstraße's corners are estimates: Puttkamerstraße, the Zufahrtstraße, Ziegelstraße and
    Johannisstraße.
- **Sewer sizes and falls**: sizes from the length of street each sewer drains; falls fitted (1:762 pipes, 1:4572
  brick) between Blatt 9's +30.25 at the station and 1.0 m of cover at every junction. Hobrecht's text volume would
  give the real falls.
- **Wall materials** on unlisted buildings: the §4.1 rule.
- **The 1917 water table and cellar depths**: no source yet.
