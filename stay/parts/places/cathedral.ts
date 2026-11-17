// Cathedral Nave: its components (blender/components/cathedral/*.py, media/models/cathedral/*.glb), on the stand in library/cathedral.tsx.
// The rig keys are each sidecar's: a clip in the .glb unless its sidecar says "in the scene".
export default {
  heading: "CATHEDRAL NAVE",
  props: [
    { name: "rose window", is: "shell", where: "the nave's end wall, the rose high in it over the altar: the match cut's circle, upper centre", rig: ["light", "glow"] },
    { name: "light shaft", is: "light", where: "from the rose's centre down to the flags before the altar steps", rig: ["swing", "glow"] },
    { name: "dust", is: "atmosphere", where: "in the air along the shaft", rig: ["drift", "glow"] },
    { name: "flagstones", is: "shell", where: "the floor of the nave and aisles" },
    { name: "column", is: "shell", where: "in two rows down the nave, 4.5 m apart, 6.4 m across" },
    { name: "arcade bay", is: "shell", where: "on the columns, bay after bay, both sides of the nave, facing it", rig: ["glow"] },
    { name: "vault", is: "shell", where: "over each bay of the nave, 14.3 m up" },
    { name: "aisle wall", is: "shell", where: "the outer wall of each aisle, a bay a piece, and the aisles' ends", rig: ["glow"] },
    { name: "aisle roof", is: "shell", where: "over each aisle bay, leaning on the nave wall" },
    { name: "altar", is: "furniture", where: "on its dais under the rose" },
    { name: "altar cross", is: "altar item", where: "on the altar, at the back, in the middle" },
    { name: "altar candlestick", is: "lighting", where: "two on the altar either side of the cross, two on the top step", rig: ["flicker", "glow"] },
    { name: "votive stand", is: "lighting", where: "by a pier near the altar steps", rig: ["flicker", "glow"] },
    { name: "chandelier", is: "lighting", where: "hung from the vault's bosses over the centre aisle", rig: ["sway", "turn", "glow"] },
    { name: "thurible", is: "altar item", where: "on its stand at the foot of the altar steps", rig: ["swing", "lid", "glow"] },
    { name: "lectern", is: "furniture", where: "on the lowest altar step, to one side", rig: ["page"] },
    { name: "pew", is: "furniture", where: "in rows either side of the centre aisle, facing the altar", rig: ["kneeler"] },
    { name: "aisle runner", is: "decor", where: "down the centre aisle from the door to the altar steps" },
    { name: "font", is: "furniture", where: "by the door, at the back of the nave", rig: ["cover"] },
    { name: "door", is: "shell", where: "in the end of an aisle", rig: ["open"] },
    { name: "statue", is: "decor", where: "in the end of the other aisle" },
  ],
};
