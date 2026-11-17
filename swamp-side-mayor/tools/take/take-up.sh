#!/bin/bash
# Start the scratch raea.app (port 7535) detached from whatever started it: its own session under launchd, so an
# interrupt in the chat that launched it can't stop it. Logs to logs/up.log; stop it with take-down.sh.
S=/tmp/goose-tut-take
if lsof -nP -iTCP:7535 -sTCP:LISTEN >/dev/null 2>&1; then echo "already up on 7535"; exit 0; fi
cd $S && nohup perl -MPOSIX -e 'POSIX::setsid(); exec @ARGV' -- \
  antsy run --name goose-tut-take --stall 3h --mem 4G --for "tutorial app take (scratch raea.app on 7535), detached" -- $S/run.sh \
  > $S/logs/up.log 2>&1 < /dev/null &
echo "started (detached): $S/logs/up.log"
