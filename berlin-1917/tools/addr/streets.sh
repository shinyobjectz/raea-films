#!/usr/bin/env bash
# Every street read from the 1917 Adreßbuch, parsed and placed: cache/adressbuch/1917/STREET.json (the houses as read)
# and map/1917/businesses/STREET.geojson (on the 1917 fronts), then the composition data the plates draw.
#   tools/addr/streets.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"; root="$here/../.."; book="$root/cache/adressbuch/1917"
cd "$here"
bun parse.ts "Leipziger Str" --turn Spittelmarkt --until "Alte Leipziger" 4322:5-8 4323:1-8 4324:1-2 > "$book/leipziger.json"
bun parse.ts 'Friedrichstraße\.' --turn Elsasser --until "Neue Friedrichst" 4096:1-8 4097:1-8 4098:1-8 4099:1-8 4100:1-8 4101:1-8 4102:1-8 \
  | jq '.street = "Friedrichstraße" | .source = "Berliner Adreßbuch 1917, Part III pp. 248-254 (ZLB 34115495_1917, scans 4096-4102, public domain), read by Claude from the page scans"' \
  > "$book/friedrichstrasse.json"
bun parse.ts "Jerusalemer Str" --turn Mohrenstr --until Iffland 4228:1-7 > "$book/jerusalemer.json"
# Unter den Linden: Part III p. 489-490 (scans 4337-4338). The next street's running head ("# Lindower Str.") sits in
# column 7, so the parse ends at its real heading ("N 39 Lindower").
bun parse.ts "Unter den Linden" --turn "Kaiser-Franz-Josef" --until "N 39 Lindower" 4337:4-8 4338:1-8 > "$book/linden.json"
# Wilhelmstraße p. 905-908 (scans 4752-4755) and Neue Wilhelmstraße after it (4755, columns 6-7).
bun parse.ts 'Wilhelmstraße\.' --turn "Unter den Linden" --until "Neue Wilhelmstr" 4752:3-8 4753:1-8 4754:1-8 4755:1-6 \
  | jq '.street = "Wilhelmstraße" | .source = "Berliner Adreßbuch 1917, Part III pp. 905-908 (ZLB 34115495_1917, scans 4752-4755, public domain), read by Claude from the page scans"' \
  > "$book/wilhelmstrasse.json"
bun parse.ts "Neue Wilhelmstr" --turn "Unter den Linden" --until "Wilhelmufer" 4755:6-7 > "$book/neue-wilhelmstrasse.json"
# Potsdamer Straße p. 642-643 (scans 4490-4491: 1-23a, then the canal) and p. 646-647 (4494-4495: 124-141 back from the
# canal). The houses between (24-123b) are beyond the Landwehrkanal, in Schöneberg and outside the slice, so each side is
# parsed on its own (the second after 123) and the run between them is left out.
bun parse.ts "Potsdamer St" --turn "Königin-Augusta" --until "Prager Str" 4490:5-8 4491:1-2 > "$book/potsdamer.west.json"
bun parse.ts "Potsdamer St" --turn "Königin-Augusta" --until "Prager Str" --after 123 4494:7-8 4495:1-2 > "$book/potsdamer.east.json"
jq -s '{street: "Potsdamer Straße", source: "Berliner Adreßbuch 1917, Part III pp. 642-643 and 646-647 (ZLB 34115495_1917, scans 4490-4491 and 4494-4495, public domain), read by Claude from the page scans; 24-123b, beyond the Landwehrkanal, left out", turn: .[0].turn, sides: [.[0].sides[0], .[1].sides[1]]}
  | .counts = {houses: ([.sides[].houses[]] | length), entries: ([.sides[].houses[].entries[]] | length), flagged: ([.sides[].houses[] | select(.flags | length > 0)] | length)}' \
  "$book/potsdamer.west.json" "$book/potsdamer.east.json" > "$book/potsdamer.json"
for n in leipziger friedrichstrasse jerusalemer linden wilhelmstrasse neue-wilhelmstrasse potsdamer; do
  echo "$n: $(jq -c .counts "$book/$n.json")"
  bun place.ts "$book/$n.json" "$root/map/1917/businesses/$n.geojson" "streets/$n.json" | tail -1
  jq -c '{type, source, placement, features: [.features[] | {g: .geometry.coordinates, p: (.properties | {side, house, placed, numbers, front, owner, flags, storefronts, offices: ([.entries[] | select(.kind == "state" and .role != "owner") | .text] | .[0:3]), n: (.entries | length)})}]}' \
    "$root/map/1917/businesses/$n.geojson" > "$root/compositions/$n-houses.json"
done
