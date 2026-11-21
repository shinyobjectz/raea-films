# The walkable city: every house planned from cellar to roof

Every building on the 1917 map gets an interior you can walk: its stairs, its flats and their rooms, its shops,
workshops and offices, the people who live and work there. Nothing is a facade. The plan comes from three things we
have for every house: its footprint and what's around it (map/1917/buildings.geojson, open.geojson), how Berlin built
(the Bauordnung, the Mietskaserne's courts and stairs), and, where we've read it, the 1917 Adreßbuch's entries for the
house (map/1917/businesses: 647 houses, 7,334 entries on seven streets so far). The hero sets (interiors/sets) stay
hand-made; this is everything else, and the frame the hero sets sit in.

    bun tools/city/house.ts --key 3906255_58207496 -o out/city/house.svg   one house, every level, its households
    bun tools/city/plans.ts --at 390860,5817930 --r 60 --level 2 -o …       one floor of every house round a point

## How a house is planned

**Lit walls first** (interiors/plan/bands.ts). A Berlin room has a window unless it is a corridor, a pantry or a dark
Kammer, and a house has windows only where it faces a street or a court: its party walls are blind. So the footprint's
outline is cut into straight walls (Douglas-Peucker to 0.8 m, the survey's jogs), each sampled every half metre and
called street, court or blind by what lies 2 m beyond it. Unmapped ground by a wall counts as street when the street
lies within 12 m on that line, else as a court the map hasn't drawn. Each lit wall claims the house behind it along
rays square to it, as deep as a room goes: a front building lit both sides gives the street side 6.5 m and the court
side 5 m, with the corridor between; a wing 10 m deep or less splits in half; a wing against a neighbour's blind wall
gets 7.5 m, and the rest is dark core.

**Rooms and stairs** (interiors/plan/flats.ts). Each wall's strip is cut along its length into rooms a window or two
wide (street rooms 3.4 to 6.2 m, court rooms 2.6 to 4.4 m). The stairs are reserved first, 2.8 m slices of the court
walls, the longest walls first, with none within 13 m of another (a wing 20 to 30 m long had one stair). A stair is
two flights and a landing, 5.6 m deep at most; what lies behind it is a dark room. Any part of the house no stair
reaches gets one of its own, top-lit. Where the front building meets a wing, the dark corner behind the court rooms
becomes the Berliner Zimmer: one big room with a single corner window onto the court, the flat's through-room and a
good flat's dining room.

**Flats.** Each room goes to the nearest stair. Each stair's rooms split on its axis into the flat to its left and the
flat to its right (the Zweispänner, two flats a landing); a side under 20 m² joins the other side. A flat's class
comes from the district, its floor (the bel étage first, the attic last), whether it faces the street, and how many
lit rooms it has: a worker's flat is a kitchen, a Stube and a Kammer or two; a petty one adds the gute Stube to the
street; a good one has the salon, the dining room, the study, the bedrooms, the children's rooms, the bath, and the
maid's room by the kitchen.

**Levels** (interiors/plan/house.ts). Every level is planned from the same footprint and seed, so the walls stand on
each other and every stair runs straight from the cellar to the roof.
- **Cellar**, half sunk, its windows a metre over the pavement: a slatted compartment for each flat, the coal, the
  wash kitchen, the corridors. Under the street front there may be a Destille or a cellar shop, down its own steps from
  the pavement (the Kellerhals).
- **Ground floor**: the way in from the street. Where a line from the street front comes out in a court within 20 m,
  the house has a gateway (Durchfahrt), 3 m wide, put where it comes out soonest and nearest a stair, and it stops at
  the court. Otherwise there's a 2.2 m hall from the street door to the nearest stair. That stair is the front stair;
  each court stair has its own court door. The street rooms are let as shops, as many as the directory lists
  storefronts. Each shop has the room behind it as its back room and the shopkeeper's flat behind that: live and work.
  The porter's flat is by the gateway, its Loge looking onto it, and is just the Loge, a Stube and a kitchen. The court
  wings hold workshops and stables.
- **Floors**: the flats above. The workers' stairs carry a WC on each half landing, shared by two floors' flats.
- **Attic**: a maid's room for each good flat below, along the street side; the drying loft and a wash kitchen to the
  court; attic flats in the wings now and then. There is a hatch over every stair's top flight, and from it a ladder to
  the roof and the sweep's boards.

**Fitting the directory.** Where the Adreßbuch lists the house, its count decides. If it lists fewer households than
the plan has flats, two flats on the front stairs of the bel étage and the floor above become one, a flat with the
landing to itself, and the merged flat moves up a class. The wings stay small.

## Who lives there (interiors/plan/households.ts, occupations.ts)

Each listed resident heads a household. Their occupation word ("Kaufm.", "Wäscherin", "Rechtsanw.") gives a rank and
a people role (people/roles.ts). Each one goes, best first, to the free flat nearest their rank: a lawyer to the bel
étage, a worker to a wing. Firms, banks and practices take front flats as offices; hotels take whole floors; the shops
take the storefront rooms. **Names never leave the directory**: a household is known by its occupation and its
people. The district's residents a plot caps the households the directory doesn't list (38.4 in the Friedrichstadt in
1905, against 77 for the city): the rest of a wing is a workroom (the Konfektion's middlemen and their seamstresses
worked in the Friedrichstadt's courts), the rest of the attic lumber and drying, and a front flat with nobody listed
stands to let or is a firm's rooms.

A household is drawn from the rates in research/households.md. A man of 20 to 45 is at the front three times in four
(an officer's family 60%), and 8% of those have fallen by December 1917. A worker's wife works in munitions or sews at
home. Children are spaced like siblings, the eldest born when the mother was 20 to 28. One family in twelve has a
widowed mother or mother-in-law living with it. Worker flats take Schlafgänger, lodgers who rent a bed and not a room,
half of them on nights. Petty and good flats let a furnished room to a subtenant. A good flat keeps a maid, and a big
one a cook too. A shopkeeper may have an apprentice. Every person has a role, so their day comes from people/roles.ts:
the bread queue at half past five, the war kitchen at noon, the Destille after the shift.

## Who they are and what their rooms hold (interiors/plan/identity.ts, dress.ts)

A household is more than its occupation. interiors/plan/identity.ts gives each one:
- its confession, and how devout it is;
- its milieu, which is its politics and its circle: Social Democrat, Catholic or Christian worker, Polish, patriot,
  official, officer, liberal, Jewish liberal, German orthodox, Ostjude, Bohème, reform;
- where it came from, and the paper it takes;
- its pastimes;
- what the war has done to it, and its children.

The rates are sourced where a source exists. They sit in the file's SOURCES (the census, the 1912 vote, the Polish
parishes, the Scheunenviertel, the allotments, the 1923 start of broadcasting). Where none exists, a rate is marked
ASSUMED and is replaced when a source turns up.

The bake writes each flat's identity into its house record, beside its rooms. A room is written as a rectangle in its
own frame, with its windows and doors on its four walls (tools/city/rooms.ts). The rectangle is the largest one of
whole cells, so an L-shaped Berliner Zimmer is furnished in its main part. The front wall is the one with the most
window.

interiors/plan/dress.ts turns a room and its household into furniture:
- **The recipe** comes from the room's use and the flat's class (`recipeFor`), out of research/catalogue/rooms.ts.
- **The household's things** are `OVERLAYS`. Each is one record: when it applies (a confession, milieu, class,
  origin, interest, war or children), what it puts in which rooms, and at what chance. A thing may also have a place
  rule: over the bed, by the door, on the doorpost, on the east wall, on the sill, over the sofa, on the chest.
  - A faith's chances scale with devotion. A devout Catholic's crucifix is all but certain; a lukewarm one's isn't.
  - The war's chances scale with the war dial.
- **The dials** (`DIALS`) are five knobs from 0 to 1, with 0.5 the period's middle:
  - clutter: how much of a recipe's optional furniture comes;
  - personality: how strongly the household shows, from 0 (a showroom) to 1 (twice the rates);
  - detail: the heaviest prop allowed, the complexity budget;
  - war;
  - wear.

  They are set for the city and overridden by class, quarter, house or single flat. A worker's flat is more crowded
  and worn by default, as the survey plates show.

The furnisher (interiors/furnish.ts) takes the dials as options. With them left out, it furnishes the hero sets
exactly as before. interiors/cityroom.ts furnishes a baked house's rooms at render time, and SetRooms draws them with
`shells={false}`, since the house's GLB has the walls.

**To extend it**, add data, not code:
- a new faith, sect, culture, milieu or pastime is an `OVERLAYS` record (and an identity value if it is new);
- a new thing is a catalogue item, plus a prop in interiors/kit that lists the item;
- a new kind of room is a recipe and a `recipeFor` line;
- a new knob for one block or flat is a `DIALS` entry.

Each one comes with a scenario in interiors/dress.feature saying what it must and must never put in a room.
`bun tools/interiors/dress-check.ts` runs them, along with checks on Berlin's census against the baked households:
Berlin's Protestant majority, a Jewish share held under Wilmersdorf's 8.84% (the highest of 1910), and most worker
households Social Democrat.

No household has a wireless. Broadcasting began on 29 October 1923, and private receivers were banned in the war.
Music in 1917 is played or wound up: the piano, the zither, the accordion, the gramophone.

## The body, the work and the night (kit/body.ts, plan/life.ts, plan/uses.ts)

A room holds what its people's days use, not only what says who they are. These **everyday** overlays stay at
personality 0, because a showroom still has its chamber pot:
- the zinc tub on its nail in a worker's kitchen, filled from the range on Saturday night;
- the pot under the bed (the workers' WC was on the half landing);
- the work taken in (Heimarbeit): the Konfektion's coat bundles and the machine, flowers petal by petal, cigars;
- other people's washing for a laundress;
- a schoolchild's satchel and slate.

A good flat has its bathroom, with a tub on feet, the Badeofen and the high cistern. The house has its wash kitchen,
with the copper, the tubs, the mangle and the drying lines.

**Who sleeps where** (plan/life.ts, after the Ortskrankenkasse's survey photographs) is planned per household and
written into the rooms:
- two adults or three children to a bed, the baby's cradle by its mother;
- a mother alone takes the youngest in with her;
- a night-shift Schlafgänger sleeps by day in a day-shift man's bed;
- the maid sleeps by the kitchen;
- a worker family sleeps in the Stube and the kitchen;
- the petty household keeps its gute Stube free while other rooms have space;
- nobody sleeps in a salon, a dining room or a study.

A flat with no kitchen cooks on its Stube's iron stove and fetches water in a pail from the landing. The furnisher
places the plan's beds first (the recipe draws none for a household), then the everyday things, then the recipe.

**What each thing is for** (plan/uses.ts): each item names its activity, how many can use it at once and in what
posture. A bed is sleep for two; a kitchen table is eat for four, sew for one, school work for two. This is how the
people's days will find a place to do each thing. dress.feature already checks that every household with a framed
room can cook, fetch water, keep warm, sleep and relieve itself.

**The day at home** (plan/home.ts): each person's day, minute by minute, in the flat's own rooms. Their role's blocks
outside (people/roles.ts: the shift, school by class, the bread queue, errands) are painted first, then sleep, the pot
and the WC, washing at the washstand, sink or pail, meals (supper after the last one is home, the night shift's at its
own hours), the cook's day, the home worker's hours at the machine, the Sabbath, the Saturday tub queue in the
kitchen (twenty minutes each, in turn as people are free), and what fills the evening by faith, class and age.
home.feature (8 scenarios, `bun tools/interiors/home-check.ts`) holds it: whole days, beds slept in, nobody cooking
in a bedroom, everyone eating and washing, home workers working about eleven hours, the devout keeping the Sabbath,
and schoolchildren away in school hours. A room that isn't framed still gets its slot ("the WC on the half landing
(not framed)").

**Tiled stoves** (kit/stoves.ts): one generator for every Kachelofen. A stove is a body (its tile size, rows,
set-back, cornices, crown, warming niche, iron doors) in a glaze (tiles, joints, and optional mouldings and frieze in
a second glaze). Every body is made in every glaze of its kind: 7 bodies in 7 glazes stoked from the room, 3 in 4 for
the salon, stoked from the corridor. White is three of the seven room glazes, as in Berlin, but two of those carry
coloured mouldings, so rooms side by side rarely look alike. `tools/interiors/stove-sheet.sh N` draws the whole
family, a row a glaze, as out/city/stove-family-vN.png.

**Walls the box misses** (tools/city/rooms.ts): a room is furnished in its largest rectangle, which can stand short
of the house's real walls. Where the gap is shallow (under 0.6 m, a chimney breast or a jog), the bake lines the box's
edge with a wall face flush to the room, out to the side's end or halfway to the next step, so nothing stands
against air. Where it is deep, the stretch is listed as `bare` and becomes a full-height opening the furnisher keeps
clear.

## What the sheets show (out/city)

- house-f113-v1: Friedrichstraße 113, 24 entries and 9 storefronts. Shops along the street with their back rooms;
  the gateway beside the front stair; workshops in the wing; offices over the shops; good flats in the rear building;
  the maids' rooms in the attic over the front.
- house-v7: Friedrichstraße 8, 8 entries and no storefronts. The gateway with the porter's Loge on it; front flats
  merged to the directory's count; the Berliner Zimmer in each corner.
- plans-v4: one floor of every house in the south Friedrichstraße block, 36 houses, 173 flats.

## Not done yet

- **The people**: once the interiors are rich enough, the civilian simulation (schedules, needs, stories from
  sources, behaviour written as Gherkin) runs in these rooms.
- **Seasons** (raea docs/realism.feature D17): a room takes the world's day and hour (`when`, plan/hours.ts). Its
  lamps burn when it is dark and someone is up in the room, its fire while someone cooks or in the heating months,
  and the window wool lies between the casements from November to March. The calendar (plan/sun.ts) puts a war
  Christmas tree (kit/home.ts) in a Christian household's main room from Christmas Eve to Epiphany, keeps the Hanukkah
  lamp in the cabinet outside its eight days, and dries the kitchen's washing indoors only in the heating months. The
  day at home takes the day too: in the long evenings the poor sit up half an hour later, in the court or at the
  allotment, and a summer Sunday takes about half the households out (home.feature, 10 scenarios). Out of the heating
  months, by day, a quarter of the windows stand open (half in the long evenings' weeks), the inner pair swung in.
- **Streaming**. A house is only planned when the camera nears it (it is all seeded, so it plans the same every time)
  and dropped when it leaves. Only the window atlas draws from outside.
- **District** is still a constant 0.45. It should come per quarter from research/quarters.tsv, which isn't written
  yet: the Friedrichstadt's business, the Luisenstadt's workshops, the Spandauer Vorstadt's Scheunenviertel.
- **Everyday places**: the places people go every day get their own sets, the Kneipe and Destille, the baker, the
  grocer, Markthalle III and IV, Aschinger, a Kintopp, the Volksbad, the war kitchen, the church, the school, the post,
  the barber, the tobacconist and the pawnshop. Landmarks get unique ones.
- **Map gaps**. Some footprints are whole blocks with no courts drawn (Friedrichstraße 18 at 10,093 m², with dark
  cores of 3,500 m²). Some of the directory's houses join to a polygon behind the street front (Friedrichstraße
  249/250's front lies 16 m east of the building it is keyed to). Both are for the map lane.
