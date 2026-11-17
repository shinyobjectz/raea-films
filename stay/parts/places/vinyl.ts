// The record shop's components (blender/components/vinyl, media/models/vinyl, library/vinyl.tsx). The montage's
// first hook is the record on the turntable (the circle, lower left): the needle drops, it spins up.
export default {
  heading: "RECORD SHOP",
  props: [
    { name: "turntable", is: "electronics", where: "on the listening console, its record the shot's circle", rig: ["spin", "swing", "drop", "needle", "lid", "pitch", "lamp"] },
    { name: "record", is: "record", where: "lying on the counter or by the deck, half out of its sleeve", rig: ["slide", "spin"] },
    { name: "rack", is: "furniture", where: "in rows down the shop floor, its divider cards the shot's vertical line", rig: ["flip", "divider"] },
    { name: "crate", is: "storage", where: "on the floor at a rack's foot" },
    { name: "console", is: "furniture", where: "the listening station, by the window", rig: ["door"] },
    { name: "amplifier", is: "electronics", where: "on the console beside the turntable", rig: ["level", "volume", "glow"] },
    { name: "speaker", is: "electronics", where: "on its stand either side of the console", rig: ["thump"] },
    { name: "headphones", is: "wall item", where: "on a hook on the wall by the listening station", rig: ["swing", "lift"] },
    { name: "stool", is: "furniture", where: "at the listening station" },
    { name: "counter", is: "furniture", where: "near the door, facing the shop", rig: ["hatch"] },
    { name: "cash register", is: "appliance", where: "on the counter, facing the shopkeeper", rig: ["drawer"] },
    { name: "posters", is: "wall item", where: "on the back wall", rig: ["flutter"] },
    { name: "wall display", is: "wall item", where: "on the back wall over the racks" },
    { name: "pendant", is: "lighting", where: "hung from the ceiling over the console and the racks", rig: ["swing", "on"] },
    { name: "floor", is: "shell", where: "the shop's floor, 6 x 5 m" },
    { name: "wall back", is: "shell", where: "the back wall, on the floor's far edge" },
    { name: "shopfront", is: "shell", where: "the street wall with the window and the door, on the floor's left edge", rig: ["door", "bell"] },
    { name: "ceiling", is: "shell", where: "over the floor at 3 m" },
  ],
};
