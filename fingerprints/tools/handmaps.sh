#!/bin/bash
# The hand scan's maps, as raea reads them: colour and normal at 4K, and a roughness map made from the scan's specular
# map (roughness = 1.27 - 4 x spec: the scan's mean spec 0.18 lands at 0.55, shinier where the skin is oilier), saved as
# RGB since Bevy reads roughness from green. Writes media/hand/maps/. Usage: tools/handmaps.sh
set -euo pipefail
cd "$(dirname "$0")/../media/hand"
mkdir -p maps
T="src/Textures"
magick "$T/Colour/8k JPG/White_Male_60's_Hand_Colour_8k.jpg" -resize 4096x4096 -quality 93 maps/colour.jpg
magick "$T/Normal/White_Male_60's_Hand_Normal.tga" -resize 4096x4096 -type TrueColor PNG24:maps/normal.png
magick "$T/Spec/White_Male_60's_Hand_Spec.tga" -resize 4096x4096 -evaluate Multiply -4 -evaluate Add 127% -type TrueColor -quality 93 maps/rough.jpg
ls -la maps
magick maps/rough.jpg -format "rough mean %[fx:mean] sd %[fx:standard_deviation]\n" info:
