#!/usr/bin/env bash
# The Hochbahn and the band it clears, run to rest. hochbahn.ts moves the traced line to its street's middle and
# draws it (map/1917/city/hochbahn.geojson); bands.sh drops the plan's misread pieces on that line and stations.sh brings
# the stations' own buildings beside the deck; and a dropped or added piece moves the street's middle, which can bring the
# next piece onto the band. So they run in turn, on the slice and the sheets the drawn line crosses, until a pass
# changes nothing (at most PASSES; past that it fails).
# The last line lists the sheets whose layers changed: rebuild their surfaces and graybox (city.sh run surfaces and
# graybox for a sheet; graybox.sh and graybox.ts for the slice), then city.sh merge.
#   viaduct.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/../.." && pwd)"
PASSES=6
changed=()
for ((pass = 1; pass <= PASSES; pass++)); do
  bun "$here/hochbahn.ts" | tail -1
  # the sheets whose frame the drawn line comes within 30 m of
  crossed=()
  while IFS= read -r p; do crossed+=("$p"); done < <(bun -e '
    const [drawn, ...paths] = process.argv.slice(1);
    const pts = (await Bun.file(drawn).json()).features.flatMap((f) => f.geometry.coordinates);
    for (const p of paths) {
      const [a, b, c, d] = (await Bun.file(p).json()).bbox;
      if (pts.some(([x, y]) => x > a - 30 && x < c + 30 && y > b - 30 && y < d + 30)) console.log(p);
    }' "$root/map/1917/city/hochbahn.geojson" "$here/slice.json" "$here"/sheets/*.json)
  dropped=0
  for s in "${crossed[@]}"; do
    out=$("$here/bands.sh" "$s" | grep -o "bands: .*" | tail -1)
    n=$(sed -E 's/bands: ([0-9]+) pieces of the viaduct and ([0-9]+) station halls.*/\1 \2/' <<<"$out" | awk '{print $1 + $2}')
    st=$("$here/stations.sh" "$s" 2>/dev/null | grep -o "stations: .*" | tail -1)
    m=$(sed -E 's/stations: ([0-9]+) station buildings.* and ([0-9]+) stair houses.*/\1 \2/' <<<"$st" | awk '{print $1 + $2}')
    if ((m > 0)); then out="$out; $st"; fi
    n=$((n + m))
    if ((n > 0)); then
      dropped=$((dropped + n))
      changed+=("$(jq -r .name "$s")")
      echo "pass $pass: $(jq -r .name "$s"): $out"
    fi
  done
  if ((dropped == 0)); then
    echo "viaduct: settled on pass $pass (${#crossed[@]} sheets on the line)"
    echo "changed: $( ((${#changed[@]})) && printf '%s\n' "${changed[@]}" | sort -u | tr '\n' ' ')"
    exit 0
  fi
done
echo "viaduct: FAILED, still dropping pieces after $PASSES passes" >&2
exit 1
