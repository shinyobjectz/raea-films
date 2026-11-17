// The koi pond's components (blender/components/koi, media/models/koi, library/koi.tsx). The montage's hook is the
// ripples (the circle, lower left spreading to the centre) as the pebble lands, and a koi turning under them.
export default {
  heading: "KOI POND",
  props: [
    { name: "ripples", is: "water", where: "on the pond's water where the pebble lands, the shot's circle", rig: ["spread", "splash", "fade"] },
    { name: "pebble", is: "stone", where: "in the cursor's grip over the pond, then under the water", rig: ["drop"] },
    { name: "koi", is: "fish", where: "a hand's depth under the pond's water, the shot's turning shape", rig: ["turn", "swim", "fins"] },
    { name: "koi b", is: "fish", where: "under the pond's water, a second, gold one", rig: ["turn", "swim", "fins"] },
    { name: "koi c", is: "fish", where: "under the pond's water, the biggest, black and red", rig: ["turn", "swim", "fins"] },
    { name: "pond", is: "shell", where: "the garden's middle, sunk in the ground", rig: ["level", "water"] },
    { name: "ground", is: "shell", where: "the garden's floor, its hole round the pond" },
    { name: "lily pads", is: "plant", where: "floating on the pond near the bridge", rig: ["bob"] },
    { name: "stone lantern", is: "ornament", where: "on the far bank, by the rocks", rig: ["lean", "glow"] },
    { name: "maple", is: "tree", where: "at the back, leaning over the pond", rig: ["sway", "fall"] },
    { name: "bridge", is: "structure", where: "across the pond's narrow end" },
    { name: "deer scarer", is: "ornament", where: "on the near bank, its basin by the water", rig: ["tip", "water"] },
    { name: "bucket", is: "garden item", where: "by the deer scarer's basin", rig: ["handle"] },
    { name: "stepping stones", is: "path", where: "from the gravel court to the pond's edge" },
    { name: "mossy rocks", is: "rock", where: "on the far bank" },
    { name: "mossy rocks b", is: "rock", where: "on the near bank and beside the path" },
    { name: "ferns", is: "plant", where: "at the rocks' feet and on the banks", rig: ["sway"] },
    { name: "moss", is: "plant", where: "in cushions on the banks and round the stones" },
    { name: "bamboo fence", is: "shell", where: "in panels along the garden's back" },
  ],
};
