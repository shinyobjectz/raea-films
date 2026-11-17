#!/bin/bash
# FLOOR3's printed art, drawn by an image model to our prompts: the corridor's framed prints, the bay's posters and
# calendar, the snapshots on desks, and the reference images Idol turns into soft props. Each lands in
# .cache/art/NAME/ (every take kept); the picked take is copied to assets/art/NAME.png by hand after looking.
#   tools/art.sh [NAME ...]     (no names: all)
set -euo pipefail
cd "$(dirname "$0")/.."
ERA="Late 1990s American office. Printed matter only, shown flat and square-on, filling the whole image edge to edge, no frame, no wall, no border beyond the print's own, no hands, no watermark."
# Idol's inputs: one object, three-quarter view, unlit (its own colours only), on plain grey
OBJ="Shown as one object, three-quarter view from slightly above, the whole object in frame with a margin, centred. UNLIT: a flat albedo pass, every material in its own true colour with no shadows, no shading gradients, no highlights, no reflections. Plain solid light grey background (#C8C8C8), no floor, no ground shadow, no text."
ALL="sign-wet print-lake print-teamwork poster-exits calendar snap-dog snap-beach idol-coat idol-backpack idol-cardigan"

# spec NAME: sets PROMPT, MODEL and ASPECT
spec() {
  MODEL=flux_2_pro; ASPECT=1:1
  case $1 in
    print-lake) ASPECT=4:5
      PROMPT="A sun-faded framed-art photograph print: a misty lake at dawn, dark pines on the far shore, a wooden jetty, muted teal and grey, slightly washed out from years on a corridor wall. $ERA" ;;
    print-teamwork) MODEL=gpt_image_2; ASPECT=3:4
      PROMPT="A 1990s motivational office poster. Black background with a thin white keyline. A photograph of a rowing crew in an eight on a still, misty river at dawn fills the upper two thirds. Beneath it the word TEAMWORK in widely spaced white serif capitals, and under that one small line in white italic serif: Together everyone achieves more. $ERA" ;;
    poster-exits) MODEL=gpt_image_2; ASPECT=3:4
      PROMPT="A 1990s workplace fire-safety poster, screen printed in three flat colours (red, black, cream paper). Headline KNOW YOUR NEAREST EXIT in bold condensed sans capitals. A simple pictogram of a figure walking toward a door under an EXIT sign. Three short numbered lines below: 1. Do not use the elevators. 2. Close doors behind you. 3. Report to your floor warden. Small footer: Building Services - Floor 3. $ERA" ;;
    calendar) MODEL=gpt_image_2; ASPECT=2:3
      PROMPT="A 1997 wall calendar, the November page. Top half: a photograph of a red covered bridge over a stream in autumn woods. Bottom half: the month grid NOVEMBER 1997 with weekday headings and dates 1 to 30, plain black sans numerals, a few dates circled in blue ballpoint and one note scribbled in pen. $ERA" ;;
    snap-dog) ASPECT=3:2
      PROMPT="A 1990s 4x6 inch drugstore film print snapshot: a golden retriever sitting on a suburban lawn in afternoon sun, film grain, warm faded colours, orange date stamp 97 11 02 in the corner. $ERA" ;;
    snap-beach) ASPECT=3:2
      PROMPT="A 1990s 4x6 inch film print snapshot: an empty beach with a striped umbrella and a cooler under an overcast sky, faded colours, film grain. $ERA" ;;
    sign-wet) MODEL=gpt_image_2; ASPECT=9:16
      PROMPT="Flat print artwork for one panel of a yellow plastic A-frame wet floor sign, seen square-on and filling the whole image: bright safety yellow background, the word CAUTION in heavy black condensed capitals at the top, a black pictogram of a person slipping on a wet floor with a few drops under their feet in the middle, WET FLOOR in heavy black capitals below it, and CUIDADO PISO MOJADO smaller underneath. Slightly scuffed plastic print. No sign shape, no perspective, no background beyond the panel." ;;
    idol-coat)
      PROMPT="A long charcoal wool overcoat and a beige scarf hanging from a bentwood coat stand with a round base. $OBJ" ;;
    idol-backpack)
      PROMPT="A worn navy blue canvas backpack with a brown leather bottom, slumped as if set down on the floor, straps loose. $OBJ" ;;
    idol-cardigan)
      PROMPT="A grey knitted cardigan lying folded over itself in a loose soft heap, nothing under it, on its own. $OBJ" ;;
    *) echo "no art named $1" >&2; exit 2 ;;
  esac
}

names="$*"; [ -n "$names" ] || names=$ALL
for n in $names; do
  spec "$n"
  mkdir -p ".cache/art/$n"
  raea gen image "$PROMPT" --model "$MODEL" --aspect "$ASPECT" -o ".cache/art/$n" --max-cents 25 &
done
wait
for n in $names; do ls -1 ".cache/art/$n"; done
