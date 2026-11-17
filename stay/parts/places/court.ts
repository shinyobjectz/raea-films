// The court's components (blender/components/court/*.py -> media/models/court/*.glb), on the stand in
// library/court.tsx. name = the file's name with spaces for hyphens; rig = the keys of its sidecar's rig.
export default {
  heading: "COURT",
  props: [
    { name: "court", is: "ground", where: "the half court's slab: wet asphalt, its lines, the red key, a kerb round it" },
    { name: "hoop", is: "goal", where: "behind the baseline, its board 1.2 m in over the court, the rim at 3.05 m", rig: ["net", "sway", "swish", "rim"] },
    { name: "basketball", is: "ball", where: "dropping through the rim; another left on the key", rig: ["drop", "spin", "squash"] },
    { name: "floodlight", is: "light", where: "on its 8 m column at the court's side, aimed at the hoop", rig: ["tilt", "pan", "on"] },
    { name: "light cone", is: "effect", where: "the wet air in the floodlight's beam, from the lamp", rig: ["tilt", "glow"] },
    { name: "rain", is: "effect", where: "the air over the whole court", rig: ["fall", "gust", "glow"] },
    { name: "puddles", is: "water", where: "the slab's low places, in the key and beyond it", rig: ["ripple", "swell", "wet"] },
    { name: "fence", is: "fence", where: "7.5 m runs round the court, 3.15 m high" },
    { name: "fence gate", is: "fence", where: "in the back fence's corner", rig: ["swing", "rattle"] },
    { name: "wall", is: "building", where: "the building behind the back fence: brick, three barred windows, a fire door, a bulkhead light", rig: ["door", "on"] },
    { name: "street lamp", is: "light", where: "in the alley between the fence and the wall", rig: ["on"] },
    { name: "sign", is: "sign", where: "wired to the back fence at head height", rig: ["swing"] },
    { name: "bench", is: "seat", where: "at the side fence" },
    { name: "gym bag", is: "litter", where: "on the ground by the bench, a bottle and a towel with it" },
    { name: "trash can", is: "litter", where: "by the gate, its lid leaning on it", rig: ["lid"] },
    { name: "tyre", is: "litter", where: "against the back fence", rig: ["roll"] },
    { name: "weeds", is: "plant", where: "along the fences' feet", rig: ["sway"] },
  ],
};
