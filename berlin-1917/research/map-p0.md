# Map P0: the first slice of 1917 Berlin

**Built:** a 3.5 × 3.5 km map of Friedrichstadt and Alt-Berlin as it stood in winter 1917–18, made only from
public sources. It contains every building, street, courtyard, river, park and the U-Bahn of the time. It is drawn
as a 1:4,000-style sheet and checked against the 1928 aerial photos. These layers are the base for the soil, the
sewers, the 3D city and the paper chart in the cab.

## What's in it

| Layer | Count | Where it comes from |
| --- | --- | --- |
| Buildings | 12,521: 11,025 private, 1,496 public | 3,177 from the "Berlin um 1900" vectors (exact, Alt-Berlin only); 9,344 read off Straube's 1910 plan |
| Courtyards | 4,944 | Open ground closed in by buildings |
| Names | 114 buildings, 252 street labels, 2,385 house numbers | 1900 survey; OpenHistoricalMap features dated to 1917 |
| U-Bahn | 13 stations of 1917; the 1902 elevated line, the Spittelmarkt line, the halted Nord-Süd-Bahn works | OpenHistoricalMap dates |
| Ground | 2 m grid at 1917 street level, 21.8–42.2 m above sea level | Today's terrain kept on 1917 streets, filled between |
| Boreholes | 536 drilled before 1946 (soil logs) | Geoportal Berlin |

Files: `map/1917/*.geojson` and `ground1917_2m.png`. Sources and licences are in `map/SOURCES.md`; all are
dl-de/zero-2.0 or CC0.

## How the west half was read

The exact 1900 vectors cover only Alt-Berlin (the east of the slice). For everything else, a small neural network
was trained on those vectors to read Straube's plan. It learned from 12 tiles where both exist and was tested on 3
tiles it never saw:

- **Buildings:** 0.84 overlap (IoU) with the truth for built-up area. Private 0.80, public 0.80. 86% of pixels
  right.
- **Water:** 0.60 from the network alone. Gating it by the plan's own blue raises it to 0.90 and 0.94 on the tiles
  with rivers. Without the gate, the network called the Königsplatz lawns and the Tiergarten water.
- **Parks and railway land:** weak (0.19, 0.24), because the training tiles hold little of either.

The network marks whole blocks as built, so private buildings are split into single houses along the plan's
party-wall lines. On a test tile this gives 410 pieces for 416 real houses. Public buildings are kept whole, and the
plan's cross-hatching inside them is filled. Pieces narrower than 2 m, or small and ringed by park, are dropped:
these are garden paths, which the plan draws in the same tan as houses.

## Checks (out/map/checks.txt)

| Check | Result |
| --- | --- |
| Landmarks standing in 1917: Französischer and Deutscher Dom, Schauspielhaus, Kunstgewerbemuseum, Abgeordnetenhaus, Herrenhaus, Reichstag, Zeughaus, Dom, Rotes Rathaus | All 10 present as public buildings, covering 75–99% of today's footprint |
| The Reich Air Ministry (built 1935–36) must be absent | Absent: no 1917 building shares its shape (best overlap 0.09); in 1917 the Kriegsministerium stood on that site |
| Voßstraße's north side must be separate houses (the Neue Reichskanzlei of 1939 is one building) | 27 separate buildings |
| Straube's plan against today's survey | Within 1.5 m on 46 of 49 tiles (median 0.5 m east, 0.5 m south). Two tiles at the east edge measure 2–3 m; the Tiergarten tile, with few buildings to match, measures 7 m. The tracing takes off the median only |

## Not right yet

- **Railway yards.** The Anhalter and Potsdamer goods yards come out mostly as open ground. Railway land is
  0.12 km², far less than the yards hold.
- **Public or private.** On the plan, many ordinary houses near Wilhelmstraße and the Potsdamer Bahnhof look like
  public buildings, and some are classed public.
- **One tunnel band left.** The U-Bahn diagonal under the Leipziger Platz garden still shows as a thin public strip.
- **U-Bahn paths.** They run straight from station to station; the true curves are on the plan and still need
  tracing.
- **Heights.** 267 buildings take their storeys from a survivor of today; the rest use the eaves rule (5 storeys
  private, 4 public). Churches and towers need their own heights.

## Next

1. Fix the railway yards from the plan's lilac tint, and trace the U-Bahn's real curves.
2. Block use from the 1910 land-use map: housing, industry, military, government.
3. Sewers: Radial System III from Hobrecht's plates, on the 1917 ground.
4. Soil from the 536 pre-1946 boreholes.
5. 3D blocks from buildings and storeys: the first walk through the slice.
