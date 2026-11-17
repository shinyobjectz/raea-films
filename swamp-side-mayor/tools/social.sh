#!/bin/bash
# Exports for the networks that refused the masters (the director 11-16: the tutorial "keeps failing to upload", and the
# sing-along "also wont send to X"). Both masters are clean files; what failed was their limits (raea's Publish
# specs, reference/platforms.md, and X's upload guidance):
#   - the tutorial runs 5:50: X takes 140 s, Bluesky 3 min and 100 MB, Threads 5 min. So it goes out in three parts,
#     cut where a chapter starts (04 Watch it work, 07 Set it once), each under 140 s and 100 MB, for a thread.
#   - the sing-along is 2160 x 1080 at about 25.5 Mbps: X takes at most 1920 wide and 25 Mbps. So it goes out at
#     1920 x 960 (the same 2:1), at 16 Mbps at most (10 lost too much going into X's own encode), its sound copied.
# One encode each, H.264 High 4.1, yuv420p, 30 fps, a keyframe every 2 s (closed), BT.709, the index first.
#
#   tools/social.sh [tutorial|singalong]     all four into out/social/, or one set
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH=/opt/homebrew/bin:$PATH
O=out/social; mkdir -p "$O"
H264=(-c:v libx264 -preset slow -profile:v high -level:v 4.1 -pix_fmt yuv420p -r 30 -g 60 -keyint_min 60 -sc_threshold 0 -bf 2
      -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -movflags +faststart)

# ---- the tutorial, in three parts: frames from components/tut/beats.json's chapter starts (04 at 3339, 07 at 6463)
TUT=out/tut/goose-learns-raea-v11.mp4 SND=out/tut/sound/tutsound.wav
part() { # n first_frame end_frame (exclusive) fade_out(0|1)
  local n=$1 a=$2 b=$3 fo=$4
  local len; len=$(python3 -c "print(($b-$a)/30)")
  local vf="trim=start_frame=$a:end_frame=$b,setpts=PTS-STARTPTS" af="atrim=start=$(python3 -c "print($a/30)"):end=$(python3 -c "print($b/30)"),asetpts=PTS-STARTPTS"
  [ "$a" -gt 0 ] && af="$af,afade=t=in:d=0.05"
  # a part that stops at a chapter break fades out (picture a third of a second, sound 0.4 s); the last ends as the film does
  if [ "$fo" = 1 ]; then
    vf="$vf,fade=t=out:st=$(python3 -c "print($len-0.33)"):d=0.33"
    af="$af,afade=t=out:st=$(python3 -c "print($len-0.4)"):d=0.4"
  fi
  ffmpeg -v error -y -i "$TUT" -i "$SND" -filter_complex "[0:v]$vf[v];[1:a]$af[a]" -map "[v]" -map "[a]" \
    "${H264[@]}" -crf 18 -maxrate 5000k -bufsize 10000k -c:a aac_at -b:a 256k -ar 48000 -ac 2 "$O/goose-learns-raea-v11-part${n}of3.mp4"
  echo "part $n: frames $a-$b, $len s"
}
if [ "${1:-tutorial}" = tutorial ] || [ -z "${1:-}" ]; then
  part 1 0 3339 1
  part 2 3339 6463 1
  part 3 6463 10510 0
fi

# ---- the sing-along for X
[ "${1:-singalong}" = singalong ] || [ -z "${1:-}" ] || exit 0
ffmpeg -v error -y -i out/goose-v9-singalong.mp4 -map 0:v -map 0:a \
  -vf "scale=1920:960:flags=lanczos:in_color_matrix=bt709:out_color_matrix=bt709:in_range=tv:out_range=tv" \
  "${H264[@]}" -crf 16 -maxrate 16000k -bufsize 32000k -c:a copy "$O/swamp-side-mayor-v9-singalong-x.mp4"
echo "sing-along for X: done"
