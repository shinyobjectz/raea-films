#!/bin/zsh
xargs -P 5 -n 1 tools/upres1.sh < out/work/uplist.txt; echo BATCH-END
