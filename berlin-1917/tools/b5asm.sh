#!/bin/zsh
export PATH=/opt/homebrew/bin:$PATH
rm -rf out/work/b5f/out
/opt/homebrew/bin/python3.12 tools/build5.py
ffmpeg -v error -y -framerate 24 -i out/work/b5f/out/%04d.png -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p -an ./assets/rebuilt/shots5/build-room.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 ./assets/rebuilt/shots5/build-room.mp4
