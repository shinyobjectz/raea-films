#!/bin/bash
# Build raea with this project's Bevy plugin (package.json's raea.plugins: the FFT ocean in vendor/bevy_fft) into
# vendor/bin/raea-sea, then put the engine's shared plugin files and its own raea-bevy-sdk back as they were, so no
# other session sees the film's plugin in its tree. Refuses to start while another cargo build runs in ~/raea.
set -euo pipefail
P=$(cd "$(dirname "$0")/.." && pwd); R=${RAEA_SRC:-~/raea}; B=$(mktemp -d); L="$B/build.log"
if pgrep -f "cargo (build|test|check|clippy)" >/dev/null; then echo "sea-plugin: another cargo job is running; try again when it's done" >&2; exit 1; fi
cd "$R"
[ -z "$(git status --short engine/bevy-plugins)" ] || { echo "sea-plugin: engine/bevy-plugins has someone's changes; not touching it" >&2; exit 1; }
cp engine/bevy-plugins/Cargo.toml "$B/Cargo.toml"; cp engine/bevy-plugins/src/declared.rs engine/bevy-plugins/src/lib.rs Cargo.lock "$B/"
[ -f target/release/raea-bevy-sdk ] && cp target/release/raea-bevy-sdk "$B/raea-bevy-sdk"
back() {
  cp "$B/Cargo.toml" engine/bevy-plugins/Cargo.toml; cp "$B/declared.rs" "$B/lib.rs" engine/bevy-plugins/src/; cp "$B/Cargo.lock" Cargo.lock
  [ -f "$B/raea-bevy-sdk" ] && cp "$B/raea-bevy-sdk" target/release/raea-bevy-sdk
  rm -rf "$B"
}
trap back EXIT
jq --arg p "$P/vendor/bevy_fft" '.raea.plugins.sea.versions["0.20"].path = $p' "$P/package.json" > "$B/package.json"
tools/bevy-plugins.sh sync sdk/ui/package.json sdk/character/package.json sdk/render/package.json sdk/audio/package.json sdk/raea/bench/bevy-plugins/package.json "$B/package.json" | grep synced
if ! antsy run --name stay-sea-plugin --stall 6m --mem 7G --for "Stay sea: prebuilt Bevy FFT water in raea" -- lane build -- cargo build --release -p raea-cli --bin raea-bevy-sdk --features bevy-plugins,raea-bevy-plugins/sea -j 6 >"$L" 2>&1; then
  grep -E "^error|^ +--> |could not compile|antsy" "$L" | head -40 >&2; echo "sea-plugin: the build failed" >&2; exit 1
fi
grep -q "Finished" "$L" || { tail -5 "$L" >&2; echo "sea-plugin: the build did not finish" >&2; exit 1; }
cp target/release/raea-bevy-sdk "$P/vendor/bin/raea-sea"
echo "sea-plugin: vendor/bin/raea-sea"
