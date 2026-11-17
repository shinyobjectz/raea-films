#!/bin/bash
# Run chapter capture scripts in order, detached in their own session (as take-run.sh), stopping at the first that
# fails, so the whole stretch finishes even if the chat that started it is interrupted. Each writes logs/NAME.log and
# state/NAME.done (its exit code); logs/chain.log gets a line per chapter and a last line "chain ok" or "chain failed NAME".
S=/tmp/goose-tut-take
for n in "$@"; do [ -f "$S/${n%.mjs}.mjs" ] || { echo "no script $S/$n.mjs"; exit 2; }; done
rm -f /tmp/goose-tut-take/logs/chain.log
cd $S && nohup perl -MPOSIX -e 'POSIX::setsid(); exec @ARGV' -- bash -c '
  S=/tmp/goose-tut-take
  for n in "$@"; do n=${n%.mjs}; rm -f "/tmp/goose-tut-take/state/${n:?}.done"; echo "start $n $(date +%T)" >> $S/logs/chain.log
    node $S/$n.mjs > $S/logs/$n.log 2>&1; c=$?; echo $c > $S/state/$n.done; echo "end $n $c $(date +%T)" >> $S/logs/chain.log
    [ $c = 0 ] || { echo "chain failed $n" >> $S/logs/chain.log; exit 1; }
  done; echo "chain ok" >> $S/logs/chain.log' chain "$@" > /dev/null 2>&1 < /dev/null &
echo "chain running (detached): $*; progress in logs/chain.log"
