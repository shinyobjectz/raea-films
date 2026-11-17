#!/usr/bin/env bash
# The JSON chunk of a .glb: its nodes, its clips (name, channels, length) and its images. Usage: tools/glb-info.sh F.glb
set -euo pipefail
f=$1
len=$(od -An -tu4 -j12 -N4 "$f" | tr -d ' ')
dd if="$f" bs=1 skip=20 count="$len" 2>/dev/null | jq -c '{nodes: [.nodes[].name], clips: [(.animations // [])[] | {name, channels: (.channels|length)}], images: ((.images // [])|length), materials: [(.materials // [])[].name]}'
