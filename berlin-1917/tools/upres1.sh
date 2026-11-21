#!/bin/zsh
# restore one Kling clip's detail with Topaz Starlight Precise 2.6: 540p in, 2x out, verify, swap in (original kept)
export PATH=/opt/homebrew/bin:$PATH
G="$(cd "$(dirname "$0")/.." && pwd)"
rel=$1                                  # rebuilt/.../ID.mp4 (under assets/)
id=${${rel//\//_}%.mp4}
W=$G/out/rebuilt/v5/upres/work/$id; mkdir -p $W
src=$G/assets/$rel
[ -f $W/DONE ] && { echo "skip $rel"; exit 0; }
sw=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 $src)
if [ "$sw" = 1280 ]; then f=1.5; ffmpeg -v error -y -i $src -c:v libx264 -crf 10 -pix_fmt yuv420p -an $W/in540.mp4 || exit 1
else f=2; ffmpeg -v error -y -i $src -vf scale=960:540:flags=area -c:v libx264 -crf 10 -pix_fmt yuv420p -an $W/in540.mp4 || exit 1; fi
cat > $W/spec.json <<J
{"endpoint":"topaz/upscale/video/generative","video_file":"$W/in540.mp4","model":"Starlight Precise 2.6","upscale_factor":$f,"H264_output":true}
J
python3.12 tools/fal_run.py $W/spec.json $W/out > $W/log 2>&1
out=$(ls $W/out/*.mp4 2>/dev/null | head -1)
[ -n "$out" ] || { echo "FAIL $rel: no output ($(tail -1 $W/log))"; exit 1; }
a=$(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 $src)
b=$(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets,width,height,r_frame_rate -of csv=p=0 $out)
[ "$b" = "1920,1080,24/1,$a" ] || { echo "FAIL $rel: got $b want 1920,1080,24/1,$a"; exit 1; }
mkdir -p $G/assets/rebuilt/_soft/$(dirname $rel)
[ -f $G/assets/rebuilt/_soft/$rel ] || cp $src $G/assets/rebuilt/_soft/$rel
cp $out $src && touch $W/DONE && echo "ok $rel ($a frames)"
