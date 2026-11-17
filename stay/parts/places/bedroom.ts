// The bedroom's component library (blender/components/bedroom/*.py -> media/models/bedroom/*.glb, shown by
// library/bedroom.tsx). name = the file's name with spaces for hyphens; rig = the sidecar's rig keys.
export default {
  heading: "BEDROOM",
  props: [
    // the shell
    { name: "floor", is: "shell", where: "the room's floor, 4.2 x 3.6 m of worn oak boards, its top 2 cm up" },
    { name: "wall window", is: "shell", where: "along the floor's far edge, the bed under its sash window", rig: ["sash", "glass"] },
    { name: "wall side", is: "shell", where: "along the floor's right edge, the desk against it, the doorway in it" },
    { name: "wall left", is: "shell", where: "along the floor's left edge, behind the bed's head (off the stand: it would shade it)" },
    { name: "wall front", is: "shell", where: "along the floor's near edge, the wardrobe's louvred doors in it (off the stand: the camera looks through it)", rig: ["wardrobe"] },
    { name: "ceiling", is: "shell", where: "on the walls' top, 2.5 m up (left off the stand so its sun reaches the room)", rig: ["light"] },
    { name: "door", is: "shell", where: "in the side wall's doorway", rig: ["open", "knob"] },
    // the shots' props
    { name: "bed", is: "furniture", where: "against the window wall, under the window, its head to the left" },
    { name: "sheet", is: "textile", where: "over the bed, at the bed's own position (the match cut's sheet)", rig: ["settle"] },
    { name: "wall clock", is: "wall item", where: "on the side wall over the desk (the cursor winds it)", rig: ["hands", "seconds"] },
    { name: "sun", is: "light", where: "outside the window, about the window's centre", rig: ["arc", "light"] },
    { name: "blinds", is: "window", where: "on the window's casing, hanging down the window", rig: ["slats", "raise"] },
    { name: "model planes", is: "toy", where: "hung from the ceiling on threads, over the middle of the room", rig: ["sway", "turn", "props"] },
    { name: "globe", is: "decor", where: "on the desk's near corner (the cursor flicks it; the cut's circle)", rig: ["spin"] },
    { name: "desk", is: "furniture", where: "against the side wall", rig: ["drawer", "drawers"] },
    { name: "crt", is: "electronics", where: "on the desk's middle, facing the room", rig: ["screen", "aerial", "power"] },
    { name: "console", is: "electronics", where: "on the desk beside the crt, its pad in front of it", rig: ["pad"] },
    { name: "games", is: "toy", where: "stacked on the desk beside the crt", rig: ["slide"] },
    { name: "lamp", is: "lighting", where: "on the desk's far end, bent over the console's pad", rig: ["on", "nod", "switch"] },
    { name: "rain", is: "effect", where: "on the window's glass, room side", rig: ["fall"] },
    { name: "fish tank", is: "decor", where: "on the bookcase by the door wall's corner", rig: ["bubbles", "swim", "flap", "light"] },
    { name: "posters", is: "wall item", where: "on the side wall over the desk", rig: ["flutter"] },
    { name: "shelves", is: "furniture", where: "on the window wall over the bookcase", rig: ["key", "robot", "cube"] },
    { name: "rug", is: "textile", where: "on the floor in the middle of the room" },
    { name: "toys", is: "toy", where: "scattered on the rug", rig: ["car", "ball", "blocks"] },
    // dressing
    { name: "bookcase", is: "furniture", where: "against the window wall, right of the bed, under the shelves", rig: ["tape", "lid"] },
    { name: "chair", is: "furniture", where: "pulled out from the desk", rig: ["position"] },
    { name: "nightstand", is: "furniture", where: "at the bed's head, in the room's left corner", rig: ["drawer"] },
    { name: "alarm clock", is: "decor", where: "on the nightstand", rig: ["hands", "seconds"] },
    { name: "boombox", is: "electronics", where: "on the floor by the bed's head" },
    { name: "toy box", is: "toy", where: "on the floor at the front left", rig: ["bat"] },
    { name: "pennant", is: "wall item", where: "on the window wall between the window and the shelves", rig: ["glow"] },
    { name: "dartboard", is: "wall item", where: "on the side wall beyond the door", rig: ["spin"] },
  ],
};
