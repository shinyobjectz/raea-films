#!/bin/bash
# Stop the scratch app started by take-up.sh.
antsy stop goose-tut-take 2>&1 | tail -1
