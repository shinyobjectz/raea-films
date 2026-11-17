#!/bin/bash
# Stops the scratch app, wipes the scratch world and makes an empty workspace "My studio" with the bundled raea CLI.
# (The app's own Make workspace also adds a Get Started project; the CLI makes the workspace alone.)
set -u
J=$(antsy board | grep -o "goose-tut-take-[0-9a-f]*" | head -1)
[ -n "$J" ] && antsy stop "$J" | tail -1
until ! pgrep -f "raea-window.*goose-tut-take" >/dev/null && ! lsof -nP -iTCP:7535 -sTCP:LISTEN >/dev/null; do :; done
rm -rf /tmp/goose-tut-take/home /tmp/goose-tut-take/data /tmp/goose-tut-take/state /tmp/goose-tut-take/logs /tmp/goose-tut-take/update /tmp/goose-tut-take/agent
mkdir -p /tmp/goose-tut-take/home/Documents/raea /tmp/goose-tut-take/data /tmp/goose-tut-take/logs /tmp/goose-tut-take/update /tmp/goose-tut-take/state /tmp/goose-tut-take/agent
. /tmp/goose-tut-take/env.sh
R=/Applications/raea.app/Contents/Resources
export PATH="$R/raea/bin:$R/node/bin:/usr/bin:/bin:/usr/sbin:/sbin" RAEA_HOME=$R/raea/share/raea
cd /tmp/goose-tut-take/home/Documents/raea && raea workspace init "My studio"
