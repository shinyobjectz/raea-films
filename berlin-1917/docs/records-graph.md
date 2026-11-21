# The records canvas: what each record was read into, and what it built

This is the graph drawn by `components/rebuilt/record-canvas.tsx` (tour: `compositions/rebuilt-v5-canvas.tsx`). It has four columns:

1. **The record:** the scans, in stacks.
2. **What we read out of it:** the fields we actually extracted.
3. **What it built:** the model and the finished shots.
4. **One room:** Ritterstraße 120, where the rows meet.

Every figure below is one the film already states, with its file. G/ is this folder.

## Row 1: Ortskrankenkasse plates (station `okk`, chapters ONE and FIVE)

**The record:** ten plates from the fund's surveys, 1901–1920 (ZLB, public domain), in G/assets/rebuilt/src4:

| Plate file | Accession, where the film gives one |
|---|---|
| p0075 | z2_1917_MP_0075 |
| p0077 | z2_1917_MP_0077 |
| p0057 | z4_1912_MP_0057, Ritterstraße 124 |
| p0083 | |
| p0089 | |
| p0093 | |
| p0095 | |
| p0097 | Keibelstraße 41 |
| p1691 | |
| p2081 | |

**Read out of plate z2_1917_MP_0075.** Its caption, field by field (G/research/rooms.tsv:131):
- Ritterstraße 120, rechter Seitenflügel, 1 Treppe
- Stube und Kammer, über einem Pferdestall
- eiserne Wendeltreppe
- Länge 3,90 · Breite 3,00 · Höhe 1,80 m
- Fenster je 80/50 cm

The date, 18 October 1917, is from G/research/scenes.md:7.

**Read out of plate z2_1917_MP_0077** (G/research/rooms.tsv:132):
- Kochraum
- zerfallener Kochherd, Kanonenofen

**Built:**
- interiors/sets/porter.ts, which gives the Stube (rb-loft) and the cooking room (rb-kochraum).
- The plates as a whole gave "127 rooms" (G/research/survey-tally.tsv:1-3, the narration's figure), which became s5-gallery. Note that rooms.tsv itself has 157 rows; the canvas uses the film's 127.

## Row 2: Straube's plan (station `straube`, chapter TWO)

**The record:** three scans:
- city-1917.jpg, the whole plan.
- reader-plan.jpg, a training tile.
- leip-straube.jpg, the Leipziger sheet.

The plan is Straube, Übersichtsplan von Berlin, 1910, 1:4,000 (Geoportal Berlin, dl-de/zero-2.0).

**Read out:** the network's reading (reader-pred.jpg). From G/research/map-p0.md:24-32:
- 12 tiles to learn from.
- 3 tiles it never saw.
- 86 in 100 pixels right.

Each house is set at its 1887 height (the v5 caption).

**Built:** the graybox city (s5-graybox-aerial).

## Row 2b: Statistisches Jahrbuch (station `jahrbuch`, cued on `straube-read`)

**The record:** Statistisches Jahrbuch der Stadt Berlin, 1913 and 1920, via Kholodilin, DIW 2015.

**Read out:** new homes finished (G/research/period.md:15-16):

| Year | New homes finished |
|---|---|
| 1913 | 4,519 |
| 1916 | 53 |
| 1918 | 13 |

**Built:** the conclusion that "the plan is, nearly, the city of 1917".

## Row 3: Berliner Adreßbuch 1917 (station `adressbuch`, chapter THREE)

**The record:** Part III, p. 474 (adressbuch-4322.jpg, ZLB, public domain), where Leipziger Straße begins. Its fourth column slides out of the page, and the entries for number 3 are highlighted.

**Read out:** Leipziger Straße 3, as transcribed in G/map/1917/businesses/leipziger.geojson, with each entry's role:

| Entry | Role |
|---|---|
| Herrenhaus. T. | state |
| E. Fiskus | owner |
| V. David E, Geh Rechn. Rat | manager |
| Böhme, O., Hausinspekt T | resident |
| Luthe, K, Pförtner. | resident |
| Reißner, R, Hauswart. T. | resident |

The card notes that this was "read by Claude, a column at a time" (G/tools/addr/transcribe.ts).

**Totals:** across G/map/1917/businesses/*.geojson, the transcription covers 7 streets, 647 houses and 7,334 entries. I counted these from the files; there are also 1,582 storefronts, which aren't shown.

**Built:** the rows placed on the 1917 fronts (leip-businesses.jpg), which became the shops (s5-shops-corner).

## Row 4: Hobrecht's sewer atlas (station `hobrecht`, chapter FOUR)

**The record:** Blatt 4, 7 and 16 of James Hobrecht, Die Canalisation von Berlin, 1884 (e-rara, ETH Zürich).

**Read out:** one system, traced by hand (the xray-sewers still), with:
- 57 plates.
- 56.4 km, mostly clay pipe.
- Brick egg, the largest 2.0 m.
- Pumpwerk III's chimney, 43.1 m.

These come from G/research/survey.md:66, G/map/SOURCES.md:29, G/research/replicate.md:104 and G/plan.org.

**Built:** the egg in 3D (rb-sewer) and the route to the pumping station (s5-sewers3d-station).

## The room (station `hub`, chapter FIVE)

The hub is Ritterstraße 120, rechter Seitenflügel, 1 Treppe, on 18 October 1917, shown with the Stube still. Threads run into it from each row, labelled with the narration's own words (prose-v2, chapter 1):

| Thread label | Row it comes from |
|---|---|
| the room itself | OKK |
| the house around it | Straube |
| the people next door | Adreßbuch |
| the pipes beneath it | Hobrecht |
