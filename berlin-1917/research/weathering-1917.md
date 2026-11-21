# Weathering in Berlin, 1917–18

This note feeds raea/wear (raea's docs/wear.feature): what wears where, by material. Every row has a source or is
marked ASSUMED. The method is the literature's. The causes are traced through the geometry: rain, run-off, shelter,
sun, ground damp, and hands, feet and wheels. Each material answers each cause its own way.

## Method

- **Water flow.** Dorsey, J., Pedersen, H. K. and Hanrahan, P. (1996), "Flow and Changes in Appearance",
  SIGGRAPH 96. Drops of rain are traced over the surfaces. They absorb, dissolve and deposit, and leave washes and
  stains.
- **Aging particles.** Chen, Y., Xia, L., Wong, T.-T. et al. (2005), "Visual Simulation of Weathering by γ-ton
  Tracing", ACM TOG 24(3). Aging particles come from sources (rain, sun, the sky, a leaking pipe), pick up and deposit
  material, and so carry a stain from its cause ("stain bleeding").
- **Pollution.** Mérillou, S. and Ghazanfarpour, D. (2008), "A survey of aging and weathering phenomena in computer
  graphics", Computers & Graphics 32(2). The same authors later studied pollution weathering on buildings (2010,
  "flow accessibility").

## Causes and how materials answer them

| Cause | Material | What it does | Source |
| --- | --- | --- | --- |
| Shelter from rain | carbonate stone (sandstone with a carbonate matrix, limestone), lime mortar and plaster | Black crust: SO2 sulphates the surface to gypsum and soot settles in it, where rain does not wash it off | Bonazza, A., NABU MedShip conference, 2019 ("black crust formation on surfaces partially sheltered from rain wash-out") |
| Rain wash | the same materials | The surface recedes and stays light, "may be white" | same |
| Run-off from ledges | stone and plaster faces under sills, cornices, string courses | Washes and dark stains under ledges, set by the flow | Dorsey et al. 1996 |
| Metal run-off | stone and plaster under copper, iron or zinc | The stain bleeds downstream of the metal | Chen et al. 2005 |
| Ground damp | plaster and brick plinths | A splash band at the foot, damp rising to a tide line | ASSUMED heights: splash to 0.4 m, tide 0.6–1.2 m (world SOP §5 uses 0.6–1 m) |
| Touch | doors, rails, treads, gateway jambs | Polished or dirtied where held, kicked, trodden and scraped | ASSUMED bands: handle 0.95–1.1 m, kick 0–0.3 m, hub 0.4–0.9 m, shoulder 1.2–1.6 m |

## Berlin, 1917–18

### Copper seized

The KRA notice No. M. 2001.17 K.R.U. of **9 March 1917** seized and expropriated copper used for:

- lightning conductors;
- roof coverings;
- gutters (Dachrinnen) and downpipes (Abfallrohre);
- window and cornice coverings (Fenster- und Gesimsabdeckungen).

There were few exceptions. Source: de.wikipedia "Metallspende des deutschen Volkes", which cites the notice as held
at bildarchivaustria.at via europeana.eu. The Landesarchiv Berlin also holds file A Rep. 013-02-02 Nr. 116
(Metall-Bestandserhebungen, Beschlagnahme).

So winter 1917–18 has no copper gutters, downpipes or cornice coverings; they were taken down. What replaced them
(zinc, tarred felt, nothing) is ASSUMED until a source is read. There is no green run-off on facades either, except
where an exempt building kept its copper.

### Brass and copper fittings seized

The KRA notice No. Mc. 1/3. 17 of **20 June 1917** seized household fittings of copper and copper alloys (Messing,
Rotguss, Tombak, Bronze). They could be handed in voluntarily until 31 August, with the deadline extended in places
to 31 October. Source: same article.

- In Lünen, everyone who had handed in their door handles (Türklinken) was paid three marks a kilogram.
- On **26 March 1918**, all fittings of aluminium, copper, brass, nickel and tin were expropriated. Source:
  germanhistorydocs.org, the poster "Einrichtungsgegenstände aus Aluminium, Kupfer, Messing, Nickel, Zinn sind
  enteignet", Bekanntmachung No. M.8./1.18 KRA.
- So by winter 1917–18 brass door handles, nameplates and letterbox flaps are mostly gone or replaced. The
  replacement material (iron, zinc, wood) is ASSUMED.

The Landesarchiv Berlin's file A Rep. 013-04-04 Nr. 12 is "Metallmobilmachung – Einrichtungsgegenstände 1917". It is
not yet read.

### Bells

Church bells were seized in 1917, about half of all German church bells (evangelisch.de, 2018; welt.de, 2023). This
is for the sound designer, not the wear.

### Neglect

A repaint or repair before the war (1910–14 per building, by its seed), and none since, is ASSUMED. The labour and
material shortages of the war years are documented in general, but not yet for Berlin's facades.

### Bills

Bills go on Litfaß columns, hoardings, firewalls and lot walls, not on house fronts. A contract of 5 December 1854
between the police president Hinckeldey and the printer Ernst Litfaß put up the first column on 15 April 1855
(Münzstraße) and 100 columns in use from 1 July 1855; a police ordinance ended the free posting of private bills at the same time
(Deutsches Historisches Museum, "Strategien der Werbekunst", exhibit text; Berlin Museum, "Ernst Litfaß"). The
wear bake's bills therefore go only on plain walls (no opening within 3 m); where hoardings and columns stand is the
map's and the props' to say.

### Seasons

The city is built to run through every season and weather of 1917–18 (spring, summer, autumn, winter, snow, blizzard, rain,
thunder), not winter only. What years of weather left (this note's rules) is the same in every season; what a season
or a day adds is drawn over it at render time (raea's docs/wear.feature WR9). The weather by date comes from the
DWD's daily records for Berlin, still to read.

### Soot

Berlin heated with coal and briquettes. The level is ASSUMED "high" until a measured source is read.

### Wind

The prevailing wind direction for rain is ASSUMED to be west. The DWD's open climate data (dl-de/by-2-0, credit
required) for Berlin stations are the source to read. The wind that drives snow in a winter storm is ASSUMED to be east to
north-east (cold continental air) until the same records are read; the bake takes it as its own direction (causes3,
raea's docs/wear.feature WR9).

## Still to source

- What replaced seized copper gutters and downpipes in Berlin.
- The material of the street-name signs in 1917: enamel plates, or painted.
- Plinth damp heights in Berlin tenement plaster.
