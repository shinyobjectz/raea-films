# Assets and their licences

The code in this folder and every asset made for this film are **Apache-2.0** (../LICENSE). The records the film is
built on are public domain or released under the Data licence Germany – Zero (dl-de/zero-2.0), which asks for nothing,
not even credit; they're credited here anyway. OpenHistoricalMap's data and the Poly Haven texture scans are CC0. The fonts are under
the SIL Open Font License, with each licence text beside its font. Nothing in the 3D city is anyone else's: its
buildings, rooms, props, trees, people's places, skies and textures were made in code or rendered in raea from the
records, apart from the CC0 texture scans. One thing the film uses isn't ours to pass on, the song, so it isn't in the download (see
[What isn't in the download](#what-isnt-in-the-download)).

`tools/get-assets.sh` fetches one archive (5.2 GB, 9.2 GB unpacked) into `assets/` and `map/1917/`. Everything under
those two folders below comes from it.

## The records (public domain)

| Asset | What it is | Source | Licence |
|---|---|---|---|
| `assets/rebuilt/src4/p0075.jpg`, `p0077.jpg` | The two photographs of the porter's flat at Ritterstraße 120, right side wing, one flight up: the Stube and Kammer (plate z2_1917_MP_0075) and the cooking room (z2_1917_MP_0077) | Allgemeine Ortskrankenkasse der Stadt Berlin, *Unsere Wohnungsuntersuchungen*, 1917; flash photographs by Heinr. Lichte & Co.; Zentral- und Landesbibliothek Berlin (ZLB), [digital.zlb.de](https://digital.zlb.de/viewer/image/34713152_1917/) | Public domain (published 1901–1920, photographer unnamed) |
| `assets/rebuilt/src4/p0057.jpg`, `p0083.jpg`, `p0089.jpg`, `p0093.jpg`, `p0095.jpg`, `p0097.jpg`, `p1691.jpg`, `p2081.jpg`, `porter-plates.jpg` | Other plates from the same survey: Ritterstraße 124 in 1912 (z4_1912_MP_0057), Höchstestraße 8 (z2_1917_MP_0083), Keibelstraße 41 (z2_1917_MP_0097), and rooms from the 1917 and 1919–1920 volumes (`p1691` and `p2081` are details of z2_1919_1920_MP_0089 and _0099); `porter-plates` sets 0075 and 0077 side by side | ZLB, the Ortskrankenkasse's volumes 34713152 and 34713154 | Public domain |
| `assets/rebuilt/src/adressbuch-4322.jpg` | A page of the 1917 address book, Part III | *Berliner Adreßbuch* 1917, ZLB (PPN 34115495_1917) | Public domain |
| `assets/rebuilt/src4/blatt04.jpg`, `blatt07.jpg`, `blatt16.jpg` | Plates 4, 7 and 16 of Hobrecht's sewer atlas: the radial system, the egg-shaped sections, the pumping station | James Hobrecht, *Die Canalisation von Berlin* (1884), atlas, e-rara, ETH-Bibliothek Zürich, [DOI 10.3931/e-rara-19774](https://doi.org/10.3931/e-rara-19774) | Public domain |
| `assets/rebuilt/src/leip-straube.jpg`, `reader-plan.jpg` | Tiles of Straube's plan of Berlin | *Straubes Übersichtsplan von Berlin*, 1910, 1:4,000, Geoportal Berlin (gdi.berlin.de, WMS `straubeplan`) | dl-de/zero-2.0 (and out of copyright) |

## Made for this film (Apache-2.0)

| Asset | What it is | How it was made |
|---|---|---|
| `assets/rebuilt/real/`, `real/rooms/`, `shots/`, `shots4/`, `shots5/` | The film's moving shots | Rendered in raea from the 3D city, the rooms and the sewers built from the records (the compositions in `compositions/`). Most were then finished by AI video: a Nano Banana 2 keyframe of the render's first frame, then Kling O3 Pro Edit over the render (the six rooms in `real/rooms/` were instead set moving from that keyframe by image-to-video, Kling 4 or Kling O3 Pro), then Topaz Starlight Precise 2.6 to bring back 1080p detail. The film labels these "Our 3D city, finished by AI video". The rest are the bare renders, labelled "Our 3D model, built from the record". |
| `assets/rebuilt/bare/`, `assets/rebuilt/shots5/bare/` | The bare 3D render under every AI-finished shot, before the finish, named as its finished shot: 17 clips in `bare/` for the earlier cuts' shots (`rb-dive` and `rb-leipziger` with their `.render.json`, the render's manifest), the render stills the six rooms were set moving from in `bare/rooms/`, and 22 clips in `shots5/bare/` for v5's new shots, each with its `.render.json`. Compare any of them with its finished shot to see exactly what the AI changed. The film cuts four of them in for its reveals from model to finish | raea |
| `assets/rebuilt/canvas/` | Stills of the 3D city, the gallery of rooms, the sewers and the pumping station, pinned on the records canvas | raea |
| `assets/rebuilt/src/city-1917.jpg`, `leip-businesses.jpg`, `reader-pred.jpg`, `column.png` | The whole 1917 city drawn from our map layers, Leipziger Straße's houses and businesses, the plan reader's prediction over a Straube tile, and an advertising column from the street kit | raea and the map tools, from the records above |
| `assets/rebuilt/vo4/v01.wav` … `v27.wav`, `dur.json`, `timeline.json`, `words.json` | The narration, one file per paragraph, and its timings | Generated with Fish Audio from `docs/narration.md`; `tools/vo4.py` and `tools/timeline4.py` |

### The 3D city (Apache-2.0)

| Asset | What it is | How it was made |
|---|---|---|
| `map/1917/` | The 1917 map layers: every building, the open ground, water, parks, rail, the Stadtbahn, bridges, the U-Bahn, trams, sewers, trees and their species, street names, spot heights, the ground at 1917 street level, boreholes, listed monuments and the businesses of seven streets, for the Friedrichstadt and Alt-Berlin slice (`sheets/` the same per 500 m sheet, `city/` the whole city's) | Read and drawn by `tools/map/` from the sources in `map/SOURCES.md`: the Geoportal Berlin's layers and Straube's plan (dl-de/zero-2.0), OpenHistoricalMap (CC0; elements with their own licence tag were left out), Hobrecht's atlas and the 1917 address book (public domain). The Denkmaldatenbank's entry texts are not shipped, only facts read from them. No OpenStreetMap data is in it |
| `assets/world/friedrichstadt/` | The baked city: each 250 m tile's ground, streets and buildings at three levels of detail, the Stadtbahn, bridges and skyline, the houses' rooms (`interiors/`), and the tiles' doors, props and chimneys (`*.json`) | `tools/world/bake.ts` and its neighbours, from `map/1917/`; the rooms from the interiors kit in `interiors/` |
| `assets/world/props/` | Street props: gas lanterns, arc lamps, advertising columns, pumps, manholes, handcarts and the bare winter limes | Modelled in code from the catalogue's dimensions (`tools/world/props.ts`, `tools/world/trees.ts`) |
| `assets/world/smoke/` | The chimney smoke's puff textures | ImageMagick plasma noise (`tools/world/smoke-puffs.sh`) |
| `assets/world/sections/`, `assets/world/sites/` | Cross-sections under Leipziger Straße and a site's layout, as data | `tools/world/section.ts`, `tools/world/site.ts` |
| `assets/graybox/friedrichstadt/` | The graybox city (every building at its height, untextured), the sewers and what's under the streets | Built from `map/1917/` |
| `assets/foliage/` | The street and park trees by species, at three levels of detail, with their leaf atlases, and each tree's species (`species.json`) | Grown by raea's foliage system, whose leaves and bark are drawn in code; species from `map/1917/tree_species.json` (`tools/foliage/props-species.ts`) |
| `assets/people/places.json`, `walks.json`, `avoid.json` | Where the city's people live, queue and walk, and the list of real 1917 surnames never to give a character | `tools/people/places.ts`, `tools/people/walks.ts`. The people themselves are stand-ins drawn in code (`components/people/Crowd.tsx`): no scanned bodies, skins, clothes or motion capture are used |
| `assets/env/ingame-*.hdr` | The skies' light as it reaches the street (day, dawn, dusk, night) | Captured in raea: six views from inside our own city, stitched into panoramas |
| `assets/interiors/array/` | The rooms seen through the city's windows, and the shop display cards | raea renders of the rooms kit and the shop displays, joined into a texture array |
| `assets/signs/` | The shop signs' font atlas and the signs' and enamel plates' data | `tools/signs/font.ts`, from four OFL fonts (below) |

The prompts for every AI-video shot are in `docs/kling/`, and the scripts that sent them are in `tools/`
(`kling*.sh`, `fal_run.py`, `upres1.sh`).

## Texture scans (CC0)

`assets/textures/cc0/`: street-tree bark (japanese_sycamore, jolcham_oak_bark_01, tree_bark_03, bark_willow_02,
bark_brown_01, bark_brown_02), cobblestones, granite tile and forest ground, 2K scans from
[Poly Haven](https://polyhaven.com) (CC0: no credit required; credited here).

## Fonts (SIL Open Font License 1.1)

| Font | Files | Licence text |
|---|---|---|
| League Gothic, The League Gothic Project Authors | `assets/fonts/LeagueGothic.ttf` | `assets/fonts/OFL-LeagueGothic.txt` |
| Old Standard, The Old Standard Project Authors | `assets/fonts/OldStandard-Bold.ttf` | `assets/fonts/OFL-OldStandard.txt` |
| Courier Prime, The Courier Prime Project Authors | `assets/fonts/CourierPrime-Regular.ttf`, `CourierPrime-Bold.ttf` | `assets/fonts/OFL-CourierPrime.txt` |

The shop signs' font atlas (`assets/signs/font.png`) is drawn from League Gothic, Old Standard, Abril Fatface (TypeTogether)
and UnifrakturMaguntia (j. 'mach' wust, Peter Wiegel), all under the OFL; their licence texts are in `assets/fonts/`
(`OFL-AbrilFatface.txt`, `OFL-UnifrakturMaguntia.txt`). The atlas is a modified version of those fonts and stays
under the OFL.

## What isn't in the download

**The song.** The score is *Count You Too*, arranged to the film from its stems by `tools/arrange4.py` into
`assets/rebuilt/stems/score-v4.wav`. Its licence doesn't clearly let us pass it on, so neither the stems nor the
arranged score are in the archive. The film composition still plays that file on its music bus, ducked under the
voice. To render the film with music, put your own in its place: any stereo 48 kHz WAV at
`assets/rebuilt/stems/score-v4.wav`, laid to film time (9:32). `tools/arrange4.py` shows how ours was cut to the
chapters (the song with its words over the 50-second cold open, instrumental mixes under the chapters, the vocals
back for the ending), and it will do the same with any song split into the same nine stems in
`assets/rebuilt/stems/wav/`. Without a score the film renders with the narration alone.

**The raw downloads the map was built from.** The Geoportal Berlin and OpenHistoricalMap downloads, and the address
book's page scans, aren't in the archive; `map/SOURCES.md` lists each service to fetch them again. What was made from
them is: `map/1917/`.

**Data the film doesn't use.** The graybox of the other districts (`assets/graybox/s-*`), the other foliage models,
the people's bodies, skins and crowd models from the project's other work, and its other sound and footage aren't in
the archive, because no composition here reads them.

**Sound effects.** The film has none: its sound is the narration and the song.
