// The stairwell's components (blender/components/stairwell/*.py -> media/models/stairwell/*.glb), on the stand in
// library/stairwell.tsx. name = the file's name with spaces for hyphens; rig = the keys of its sidecar's rig.
export default {
  heading: "STAIRWELL",
  props: [
    { name: "stairs", is: "shell", where: "each storey: 18 stone treads from the wall to the well, one whole turn up" },
    { name: "landing", is: "shell", where: "each storey, at the door: the 60 degree slab and its length of balustrade" },
    { name: "floor", is: "shell", where: "the bottom of the well: mosaic, with the compass medallion under the eye" },
    { name: "wall", is: "shell", where: "each storey: the round drum, 2.4 m in radius" },
    { name: "skylight", is: "shell", where: "over the top storey: the ceiling ring and the glazed lantern", rig: ["vent", "moon"] },
    { name: "rail", is: "rail", where: "each storey, along the well's edge of the flight: the spiral the circle is" },
    { name: "wall rail", is: "rail", where: "each storey, on the wall side of the flight" },
    { name: "guard", is: "rail", where: "the top landing's open end" },
    { name: "paper plane", is: "prop", where: "dropped down the well from the top landing, spiralling", rig: ["position", "spiral", "flutter", "wobble"] },
    { name: "wall light", is: "light", where: "two a storey on the wall over the flight, coming on floor by floor", rig: ["on", "glow"] },
    { name: "door", is: "door", where: "each landing, in the wall", rig: ["open", "handle", "light"] },
    { name: "exit sign", is: "light", where: "hung under the flight over each door", rig: ["glow"] },
    { name: "riser", is: "fitting", where: "each landing, on the wall beside the door", rig: ["valve"] },
    { name: "stair sign", is: "sign", where: "each landing, on the wall the other side of the door" },
    { name: "extinguisher", is: "fitting", where: "each landing, on the floor under the sign" },
    { name: "doormat", is: "dressing", where: "before each door" },
    { name: "boots", is: "dressing", where: "beside two of the doors" },
    { name: "plant", is: "dressing", where: "the ground floor under the flight, and the first landing", rig: ["sway"] },
    { name: "radiator", is: "fitting", where: "the ground floor, against the wall", rig: ["valve"] },
    { name: "mailboxes", is: "fitting", where: "the ground floor's wall", rig: ["open", "flap"] },
    { name: "notice board", is: "dressing", where: "the ground floor's wall, beside the letterboxes", rig: ["flutter"] },
  ],
};
