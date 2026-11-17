#!/bin/bash
# Run one chapter's capture script detached (its own session, as take-up.sh), so it finishes even if the chat that
# started it is interrupted. Writes logs/NAME.log and, when it ends, state/NAME.done holding its exit code.
S=/tmp/goose-tut-take; N=${1%.mjs}
[ -n "$N" ] && [ -f "$S/$N.mjs" ] || { echo "no script $S/$N.mjs"; exit 2; }
rm -f "${S:?}/state/${N:?}.done"
cd $S && nohup perl -MPOSIX -e 'POSIX::setsid(); exec @ARGV' -- \
  bash -c "node $S/$N.mjs > $S/logs/$N.log 2>&1; echo \$? > $S/state/$N.done" > /dev/null 2>&1 < /dev/null &
echo "running $N (detached): logs/$N.log, done file state/$N.done"
