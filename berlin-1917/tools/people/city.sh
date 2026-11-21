#!/usr/bin/env bash
# tools/people/city.ts with the SDK's import names (raea/people); bun's override prints a harmless internal note.
cd "$(dirname "$0")/../.." && bun --tsconfig-override "$HOME/raea/sdk/tsconfig.base.json" tools/people/city.ts "$@" 2> >(grep -v "directory mismatch" >&2)
