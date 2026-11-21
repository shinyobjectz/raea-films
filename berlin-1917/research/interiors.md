# Indoors: rooms, shops and halls in winter 1917–18 (2026-11-17)

This note explains how to furnish a Berlin room of the winter of 1917–18 and where the evidence for each choice
comes from. The data lives in typed files:

- research/catalogue/interior.ts: 198 indoor items in 17 groups.
- research/catalogue/rooms.ts: room recipes.
- research/catalogue/trades.ts: which shop kit an address-book entry gets.
- research/catalogue/seen.ts: what was confirmed on dated photographs.
- research/catalogue.md: everything above as generated tables.
- research/scenes.md: the survey rooms as scene cards.

## The best evidence: 157 photographs of real rooms

Between 1901 and 1920 the Berlin Ortskrankenkasse photographed the homes of sick members to show how housing made
people ill. The flash photographs are by Heinr. Lichte & Co. and were published in *Unsere Wohnungs-Enquete* and
*Unsere Wohnungsuntersuchungen*, held by the ZLB. They are public domain. Each plate's caption gives:

- the address, the part of the house and the floor;
- who lives there and what they are ill with;
- usually the room's length, breadth and height, and the window sizes.

A Ritterstraße plate is stamped 18 October 1917, and one Weberstraße caption says its photograph was taken in June
1917. Fourteen plates fall on streets of the map slice: Ritterstraße 120 and 124, Zimmerstraße 47, Friedrichstraße
236, Möckernstraße 115, Großbeerenstraße 6 and Parochialstraße 13.

tools/refs reads these captions into research/rooms.tsv. The sizes, as 10% / median / 90%:

| Room | Length (m) | Breadth (m) | Height (m) | Rooms measured |
|---|---|---|---|---|
| Stube | 3.8 / 4.3 / 6.75 | 2.35 / 3.0 / 4.25 | 2.35 / 2.6 / 3.35 | 23 |
| Kitchen | 3.8 / 4.0 / 6.0 | 1.8 / 2.75 / 4.0 | 1.65 / 2.6 / 3.0 | 12 |
| Kammer | 2.1 / 3.0 / 3.6 | 2.0 / 2.0 / 2.9 | 2.1 / 2.55 / 2.6 | 3 |
| All rooms with a height | | | 1.85 / 2.55 / 3.1 | 53 |

A few more measurements from the captions:

- Cellar flats lie 1.5–1.95 m below the court (8 captions).
- Windows measure 50 × 80 cm to 90 × 100 cm.
- Households of 4 to 14 share a Stube; one cellar room held 11 people.

These are the rooms of the sick poor, so they set the floor of the city, not its average. The front building's flats
are larger and taller, and their sizes in rooms.ts are estimates until plans or the Titzenthaler interiors settle them.

## The house as a social map

A Mietskaserne is a front building on the street, side wings and one or more rear buildings around courts:

- **Front building, first floor** (the bel étage): the best flat, of five to eight rooms. It runs through the dim
  Berliner Zimmer into the side wing and has a maid's loft over the kitchen.
- **Front building, upper floors:** smaller households of two or three rooms (clerks, craftsmen, widows), each with a
  "gute Stube" kept for Sundays.
- **Side wings and rear buildings:** a Stube and a kitchen, sometimes a Kammer, often with lodgers. The toilet is on
  the half-landing or in the court.
- **Cellars and attics:** the poorest. Light comes from the court's level or down a shaft.
- **Ground floors:** shops on the street, workshops and stables in the courts. The porter's family lives wherever the
  house can spare a room (Ritterstraße 120: over the horse stable).

Rooms.ts holds a recipe for each household type and for the stair, the cellar and the porter's loft.

## The worker's Stube, as the photographs show it

The photographs settle what used to be guesses.

- **The lamp:** nearly every Stube of 1913–20 has the same lamp over the table. It is a pull-down lamp in a tall hoop
  frame, with a round font, a chimney and a flat white shade. The form served petroleum and gas alike.
- **Walls:** striped paper with small sprigs and a narrow border, or a big dark damask paper. The damask is not only in
  bourgeois rooms. Most of it is torn, stained and peeling where it is damp.
- **On the walls:**
  - a carved Black Forest clock, 60–80 cm with its weights, high up and often with fir twigs behind it;
  - photographs in black frames, and a row of round and oval frames at one height;
  - coloured prints;
  - sometimes a board with a Fraktur text ("Danket dem Herrn, denn er ist freundlich").
- **Furniture:**
  - two or three beds, made up high with checked feather beds;
  - a table with a white fringed or crochet cloth to the floor;
  - bentwood or turned chairs;
  - a dark two-door wardrobe with a carved swan-neck crest touching the low ceiling;
  - a tall mirror with a crest between the windows;
  - often a sofa with a lace antimacassar, and a Vertiko with knick-knacks on top.
- **Life:**
  - a treadle sewing machine at the window;
  - a wicker pram used as the baby's cradle;
  - a birdcage by the window;
  - lace curtains, even in the poorest rooms, with a fan palm or a geranium on the sill.

## The kitchen

The kitchen is where a worker's family lives. The surveys find one to four people sleeping in it.

- **Range:** white-tiled and waist high, with an iron hob and an oven door in the tiles. A kettle and pots are always
  on it.
- **Dresser:** glazed upper doors with scalloped paper lace on every shelf behind the glass.
- **Walls:** every shelf has a scalloped edging, cut paper or crochet, hanging 5–10 cm, with cups on hooks beneath.
  There is a row of white canisters (Mehl, Zucker, Salz, Kaffee), and in Weberstraße 18 (1917) a wall cabinet of a
  dozen small spice drawers.
- **Washing:** a zinc tub, a basin hung on a nail, and a line of washing across the room under the ceiling.
- **The poorest:**
  - a brick-built range with a ring plate laid on top (Parochialstraße 13);
  - a petroleum cooker where there is no range at all (Ritterstraße 124);
  - a small iron stove pushed into a broken range (Ritterstraße 120, October 1917).

## Fabrics

- **Windows:**
  - machine lace and net curtains in nearly every window, tied back;
  - plush over-curtains and portières in better rooms;
  - in winter, rags stuffed in the cracks and nailed over.
- **Seats and tables:**
  - plush in wine red, bottle green, brown or gold on sofas, tablecloths, album covers and frames;
  - oilcloth on kitchen tables and shelves.
- **Beds:** feather beds and pillows in blue-and-white or red-and-white check over red ticking. Show pillows with lace
  edges and embroidered "Gute Nacht" go on the best bed. Mattresses are of seagrass and straw for the poor, horsehair
  for the better off.
- **Needlework:** crochet doilies, antimacassars, runners and shelf edgings everywhere in worker and petty-bourgeois
  homes. Embroidered wall hangings in red or blue cross-stitch on white linen carry sayings ("Eigner Herd ist Goldes
  wert") and hang behind the range and the washstand.
- **The war:** cotton is gone after 1916, and paper cloth (aprons, sacks, string, curtains) replaces it; paper yarn
  itself was seized in October 1917. Black mourning crape appears on photographs and sleeves.

## Styles by class

- **Workers:** whatever came secondhand, mostly cheap late-Gründerzeit pieces in stained softwood with machine-carved
  crests.
- **Petty bourgeois:** a matched set for the gute Stube (sofa, table, Vertiko, pier mirror, a regulator clock), used
  on Sundays.
- **Bourgeois:**
  - a dark Neo-Renaissance ("altdeutsch") dining room with a massive carved buffet and leather chairs;
  - a Neo-Rococo or Empire salon with a piano, a palm and portières;
  - a Herrenzimmer with a desk, books, leather chairs and a bust of Bismarck or the Kaiser;
  - after about 1905, a lighter Neo-Biedermeier Damenzimmer;
  - in newer flats in the West, plain Werkbund reform furniture (rare in the old centre).
- **Electric light:** about one flat in twenty in 1914, mostly in the West.

## Heat and light

- **Stoves:** a tiled stove in each heated room, fed from inside the room. Most are white, from the Velten works,
  which sent 100,000 tiled stoves to Berlin in 1905 alone.
- **Coal:** short and rationed in the winter of 1917–18. Briquettes are worth more than money.
- **Gas:** lights most flats, sometimes through a coin meter.
- **Petroleum:** lights the poorest, but it ran short in the war.
- **War substitutes:** carbide lamps (check how common they were at home), candles, and the Hindenburglicht, a 5–8 cm
  pasteboard dish of tallow.

## Plants and flowers

- **Window and corner plants:**
  - fan palms (in workers' windows too);
  - cast-iron plants (aspidistra) in dark rooms and stairs;
  - rubber plants;
  - the house lime;
  - Norfolk pines;
  - ivy trained round windows and pictures;
  - asparagus fern.
- **Sills:** geraniums and fuchsias, cut back for the winter. A bride's myrtle in a pot.
- **Winter flowers:** hyacinths forced in hourglass glasses (January–February), cyclamen, azaleas, primulas and
  Christmas roses as gifts. Christmas cactus in flower in December.
- **Advent and Christmas:**
  - fir branches over the pictures;
  - Barbara twigs cut on 4 December to flower at Christmas;
  - a small tree in 1917, with stearin candles, glass baubles, paper chains, apples, nuts, and iron crosses and
    soldiers among the ornaments.
- **Made flowers:** artificial flowers in silk, paper and wax, a Berlin trade (Leipziger Straße lists several
  "Blumenfabriken"). Funeral wreaths of fir and laurel with ribbons.

## The war at home

- **Rations:**
  - ration cards on a nail by the door (bread cards from 22 February 1915);
  - dark war bread and swede turnips after the turnip winter of 1916–17;
  - substitutes: coffee from barley and chicory, synthetic honey, clay soap, saccharine.
- **The front:**
  - field-post letters and parcels being packed;
  - grey wool and half-knitted socks;
  - an iron ring given for gold;
  - a newspaper map of the fronts with pins;
  - a son's portrait in field-grey, sometimes with a black ribbon across the corner.
- **Making do:** rabbits and hens in kitchens and on balconies, hoarded potatoes, and gaps where brass and copper were
  handed in.

## Shops

Every storefront the address book lists gets a kit. Trades.ts maps the book's abbreviations to kits: "Pelzwr." to
furs, "Damenkonfekt." to the fashion house, "Hof-Juweliere" to the jeweller. On Leipziger Street it furnishes 212 of
the 213 storefronts that tools/addr placed; the one left is an unreadable entry.

Leipziger Straße is a luxury street. By number of storefronts its kits are:

| Kit | Storefronts |
|---|---|
| Fabrics (silks and lace) | 24 |
| Fashion houses | 22 |
| Furs | 15 |
| Hats | 13 |
| Gloves, hosiery and corsets | 12 |
| Menswear | 11 |
| Shoes | 10 |

Glass, china and silver, jewellers, fancy goods, books and music, wine merchants and banks follow. The old centre's
side streets need the everyday kits instead:

- grocer, baker, butcher, dairy;
- the greengrocer's and the coal merchant's cellar;
- the Destille on the corner, the barber, the tobacconist.

Two Leipziger Straße entries show the war economy in the street:

- "Kontrollstelle für freigegebene Leder", a control office for leather released by the state;
- the Kriegs-Rohstoffgesellschaft's company for using textile waste.

Both get the office kit.

## Public rooms

The catalogue covers the rooms a mission may enter:

- the post office hall and the police station;
- a classroom (some schools became reserve hospitals) and a hospital ward;
- the war kitchen hall;
- a station waiting room by class;
- a church with its memorial boards;
- a cinema;
- a factory floor in a commercial court;
- an office.

None of these has a dated photograph yet. They stay "to confirm" until the Commons harvest or another archive turns
one up.

## What is still open

- **Front-building sizes:** the rooms of the front building and the bel étage. Read them from plans and from
  Titzenthaler's interiors (Landesarchiv F Rep. 290, reference only).
- **Unconfirmed items:**
  - the coin gas meter;
  - the haybox;
  - the carbide lamp at home;
  - which brass and copper household items the collections required;
  - the stair lighting hours.
- **Bourgeois, shop and public interiors:** the Commons harvest's photographs, once matched, should confirm or correct
  them the way the surveys did the worker's flat.
