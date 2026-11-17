#!/bin/bash
# game/sizes.gen.json: every model's box (w, h, d in metres, before any turn), read from its .glb.json sidecar, so the
# level's solids and checks use the size the model really has.
#   tools/sizes.sh
set -euo pipefail
cd "$(dirname "$0")/.."
cd assets/models
for j in $(find . -name "*.glb.json" | sort); do
  k=${j#./}; k=${k%.glb.json}
  jq -c --arg k "$k" '{($k): .size_m}' "$j"
done | jq -s 'add' > ../../game/sizes.gen.json
echo "wrote game/sizes.gen.json: $(jq length ../../game/sizes.gen.json) models"
