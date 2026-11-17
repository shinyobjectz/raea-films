// The canyon's components (blender/components/canyon/*.py -> media/models/canyon/*.glb), on the stand in
// library/canyon.tsx. name = the file's name with spaces for hyphens; rig = the keys of its sidecar's rig.
export default {
  heading: "CANYON",
  props: [
    { name: "walls", is: "rock", where: "either side of the slot, 38 m of it, 12 m deep" },
    { name: "rim", is: "rock", where: "the walls' tops: the cap rock and the loose blocks on it" },
    { name: "sand", is: "ground", where: "the slot's floor, rippled, banked against both walls" },
    { name: "sky", is: "sky", where: "ahead of and over the slot, behind the rim", rig: ["glow"] },
    { name: "sun", is: "light", where: "the sky, in the slot's strip of it", rig: ["height", "light"] },
    { name: "boulder", is: "rock", where: "fallen on the floor against a wall" },
    { name: "boulder b", is: "rock", where: "on the floor by the other wall, low and flat" },
    { name: "chockstone", is: "rock", where: "wedged between the walls overhead" },
    { name: "slab", is: "rock", where: "a spalled flake leaning on a wall" },
    { name: "pebbles", is: "rock", where: "scattered on the sand" },
    { name: "cairn", is: "rock", where: "stacked at the foot of a wall, at a bend" },
    { name: "driftwood", is: "debris", where: "caught against a boulder" },
    { name: "log jam", is: "debris", where: "flood logs wedged across the slot overhead, further in" },
    { name: "shrub", is: "plant", where: "in a crack low on a wall, or at its foot", rig: ["sway"] },
    { name: "grass", is: "plant", where: "in clumps at the walls' feet", rig: ["sway"] },
    { name: "snag", is: "plant", where: "dead on the rim, against the sky", rig: ["sway"] },
    { name: "tumbleweed", is: "plant", where: "rolling along the floor", rig: ["roll", "hop", "place"] },
    { name: "dust", is: "effect", where: "in the air of the slot", rig: ["drift"] },
    { name: "sand streams", is: "effect", where: "falling off the rim", rig: ["fall", "flow"] },
  ],
};
