// The laundromat's component library (blender/components/laundromat/*.py -> media/models/laundromat/*.glb, shown by
// library/laundromat.tsx). name = the file's name with spaces for hyphens; rig = the sidecar's rig keys.
export default {
  heading: "LAUNDROMAT",
  props: [
    // the shell
    { name: "floor", is: "shell", where: "the room's floor, 9 x 6.4 m of checkered tile, its top at 0" },
    { name: "wall back", is: "shell", where: "along the floor's far edge, behind the dryers" },
    { name: "wall side", is: "shell", where: "along the floor's right edge, behind the washers", rig: ["door"] },
    { name: "storefront", is: "shell", where: "along the floor's left edge, the car park behind it", rig: ["door", "neon"] },
    { name: "ceiling", is: "shell", where: "3 m up, module beside module over the whole room" },
    // the shot's props
    { name: "dryer", is: "appliance", where: "in a stacked row along the back wall", rig: ["drum", "door", "door lower", "light", "display"] },
    { name: "duct", is: "fixture", where: "over each dryer, joining into one trunk under the ceiling" },
    { name: "laundry", is: "textile", where: "inside a drum, at its axle", rig: ["tumble", "float"] },
    { name: "sheet", is: "textile", where: "in the open dryer's drum, then the room's air", rig: ["drift", "billow"] },
    { name: "washer", is: "appliance", where: "in a row along the side wall, facing the room", rig: ["drum", "door", "display"] },
    { name: "laundry cart", is: "furniture", where: "alone on the floor by the folding table", rig: ["position", "roll", "swivel", "sway"] },
    // the room's dressing
    { name: "plastic chair", is: "furniture", where: "in a row under the storefront's window" },
    { name: "folding table", is: "furniture", where: "in the middle of the floor" },
    { name: "basket", is: "container", where: "on the folding table or a chair" },
    { name: "shelf", is: "wall item", where: "on the side wall over the washers" },
    { name: "detergent", is: "container", where: "on the shelf over the washers", rig: ["tip"] },
    { name: "vending machine", is: "appliance", where: "against the back wall by the corner", rig: ["glow", "flap", "drop"] },
    { name: "change machine", is: "appliance", where: "on the back wall beside the vending machine", rig: ["glow", "coins"] },
    { name: "soap vendor", is: "appliance", where: "on the back wall between the dryers and the change machine", rig: ["slide", "vend"] },
    { name: "gumball machine", is: "decor", where: "by the storefront, near the door", rig: ["crank", "ball"] },
    { name: "bin", is: "container", where: "at the end of the dryers' row", rig: ["flap"] },
    { name: "tv", is: "electronics", where: "on a bracket high in the back corner", rig: ["screen", "swing"] },
    { name: "posters", is: "wall item", where: "on the side wall, over the washers' end" },
    { name: "bulletin board", is: "wall item", where: "on the back wall by the storefront", rig: ["flutter"] },
    { name: "wall clock", is: "wall item", where: "high on the back wall", rig: ["hands", "seconds"] },
    { name: "fire alarm", is: "wall item", where: "on the back wall at the dryers' end" },
    { name: "wet floor sign", is: "floor item", where: "on the floor before the washers" },
    { name: "tubes", is: "lighting", where: "in the ceiling's openings, in rows", rig: ["on", "flicker"] },
    { name: "ceiling fan", is: "fixture", where: "in the ceiling over the middle of the floor", rig: ["spin"] },
    { name: "exit sign", is: "lighting", where: "hung from the ceiling inside the storefront's door", rig: ["glow"] },
  ],
};
