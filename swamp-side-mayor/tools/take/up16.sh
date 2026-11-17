#!/bin/bash
# start the 0.1.6-rc0 copy on its scratch world (port 7536), detached; stop with: antsy stop goose-tut-take16-...
T=/tmp/goose-tut-take16
if lsof -nP -iTCP:7536 -sTCP:LISTEN >/dev/null 2>&1; then echo "already up on 7536"; exit 0; fi
cd $T && nohup perl -MPOSIX -e 'POSIX::setsid(); exec @ARGV' -- antsy run --name goose-tut-take16 --stall 1h --mem 5G --for "v11: 0.1.6 rail capture (scratch raea 0.1.6-rc0 copy on 7536)" -- $T/run.sh > $T/logs/up.log 2>&1 < /dev/null &
echo started
