// The closed fair's components (blender/components/ferris/*.py -> media/models/ferris/*.glb), on the stand in
// library/ferris.tsx. name = the file's name with spaces for hyphens; rig = the keys of its sidecar's rig.
export default {
  heading: "CLOSED FAIR",
  props: [
    { name: "wheel", is: "ride", where: "the back of the fair, on its platform: the circle the cut lands on", rig: ["spin", "bulbs", "spin and light", "spin lit", "upward", "sway", "glow"] },
    { name: "gondola", is: "ride", where: "one off the wheel on a service trestle, beside it", rig: ["swing", "door", "upward"] },
    { name: "platform", is: "ride", where: "under the wheel: the loading deck, steps and gates", rig: ["gate"] },
    { name: "controls", is: "ride", where: "beside the platform: the operator's console", rig: ["lever", "needle", "key", "lamp"] },
    { name: "ground", is: "shell", where: "the hardstanding the fair is pitched on, with its puddles" },
    { name: "sign arch", is: "sign", where: "the entrance, a chain and a CLOSED board across it", rig: ["bulbs", "swing", "star", "glow"] },
    { name: "ticket booth", is: "stall", where: "inside the entrance, either side of the way", rig: ["shutter", "bulbs", "pennant", "glow"] },
    { name: "stall", is: "stall", where: "both sides of the midway", rig: ["flap", "bulbs", "valance", "glow"] },
    { name: "high striker", is: "stall", where: "on the midway, by the right-hand stall", rig: ["strike", "mallet"] },
    { name: "string lights", is: "light", where: "strung pole to pole over the midway", rig: ["on", "sway", "glow"] },
    { name: "bunting", is: "dressing", where: "strung pole to pole across the entrance and down the left", rig: ["flutter"] },
    { name: "pole", is: "fitting", where: "six along the midway, carrying the lights and bunting", rig: ["horn"] },
    { name: "prize bear", is: "prop", where: "three on the ground before the left stall, the big one the top prize", rig: ["wave", "nod", "slump"] },
    { name: "balloons", is: "prop", where: "tied to a sandbag by the left ticket booth", rig: ["sway", "bob"] },
    { name: "litter", is: "dressing", where: "two patches on the midway", rig: ["blow"] },
    { name: "barrier", is: "fitting", where: "a run of three closing the wheel off", rig: ["plate"] },
    { name: "cables", is: "fitting", where: "from the generator across to the wheel" },
    { name: "generator", is: "fitting", where: "behind the right-hand stall" },
    { name: "snack cart", is: "stall", where: "on the midway before the wheel" },
    { name: "bench", is: "dressing", where: "by the right ticket booth" },
    { name: "trash can", is: "dressing", where: "by the bench", rig: ["lid"] },
    { name: "chair", is: "dressing", where: "before the right-hand stall" },
  ],
};
