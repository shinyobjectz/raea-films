// The diner's components (blender/components/diner/*.py -> media/models/diner/*.glb), on the stand in
// library/diner.tsx. name = the file's name with spaces for hyphens; rig = the keys of its sidecar's rig.
export default {
  heading: "DINER",
  props: [
    { name: "floor", is: "architecture", where: "the diner's floor: 30 cm black and white tiles" },
    { name: "wall", is: "architecture", where: "the back wall behind the counter: tile, the pass-through to the kitchen, the kitchen door", rig: ["heat lamp"] },
    { name: "window", is: "window", where: "the street wall, a bay beside each booth", rig: ["night"] },
    { name: "neon sign", is: "sign", where: "hung in the window, inside the glass (the TR rectangle)", rig: ["colour", "position"] },
    { name: "counter", is: "furniture", where: "before the back wall, its overhang toward the room" },
    { name: "stool", is: "furniture", where: "bolted to the floor along the counter's front, 90 cm apart (the BR circle)", rig: ["spin", "wobble"] },
    { name: "back bar", is: "furniture", where: "against the back wall under the pass-through: the mixer, toaster, syrups, glasses", rig: ["mix", "toast", "cup"] },
    { name: "coffee cup", is: "tableware", where: "on the counter before a stool, or on a booth's table (the montage's circle, from above)", rig: ["swirl", "lift", "spoon", "position"] },
    { name: "coffee pot", is: "appliance", where: "on the counter's back edge or the back bar", rig: ["pour", "level", "lamps"] },
    { name: "pie case", is: "tableware", where: "on the counter near its end", rig: ["lid", "turn"] },
    { name: "plate", is: "tableware", where: "on the counter or a booth's table, beside a cup", rig: ["fork"] },
    { name: "condiments", is: "tableware", where: "on the counter every few stools and at each booth table's window end", rig: ["pull"] },
    { name: "cash register", is: "appliance", where: "on the counter's end by the door", rig: ["drawer"] },
    { name: "menu board", is: "wall item", where: "on the back wall over the pass-through (the place's wrong detail: no language)" },
    { name: "wall clock", is: "wall item", where: "high on the back wall", rig: ["hands", "seconds"] },
    { name: "jukebox", is: "appliance", where: "on the floor against a wall, facing the room", rig: ["record", "arm", "glow"] },
    { name: "booth seat", is: "furniture", where: "under the window, two facing each other across a table" },
    { name: "booth table", is: "furniture", where: "between two booth seats, its end to the window" },
    { name: "pendant", is: "lighting", where: "from the ceiling in a row over the counter", rig: ["sway", "on"] },
    { name: "ceiling fan", is: "fixture", where: "in the ceiling over the floor between counter and booths", rig: ["spin"] },
  ],
};
