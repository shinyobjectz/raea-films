// The pool hall's components (blender/components/pool/*.py, media/models/pool/*.glb; library/pool.tsx stands them up).
// name = the file's name with spaces for hyphens; rig = the sidecar's rig keys.
export default {
  heading: "POOL",
  props: [
    // the shell
    { name: "pool", is: "architecture", where: "the hall's floor: the deck and the tiled basin in it", rig: ["lights"] },
    { name: "water", is: "surface", where: "in the pool, 15 cm under the coping", rig: ["level", "slosh", "ripple", "colour"] },
    { name: "wall end", is: "architecture", where: "each end of the hall; the far one has the doorway" },
    { name: "wall side", is: "architecture", where: "each long side of the hall, turned a quarter" },
    { name: "windows", is: "window", where: "high along a long wall, one in each of its six openings", rig: ["vent", "sky"] },
    { name: "ceiling", is: "architecture", where: "over the hall, four bays end to end" },
    { name: "tubes", is: "lighting", where: "on the soffit in three rows down the hall", rig: ["on"] },
    { name: "door", is: "door", where: "in the far wall's doorway, over the deck", rig: ["open"] },
    // fixtures
    { name: "exit sign", is: "sign", where: "over the far door", rig: ["misspell", "glow"] },
    { name: "ladder", is: "fixture", where: "at the pool's edge, a pair either side", rig: ["lift", "position"] },
    { name: "diving board", is: "fixture", where: "at the deep end, its tip over the water", rig: ["bounce", "fulcrum"] },
    { name: "starting block", is: "fixture", where: "at the head of each lane", rig: ["lane number"] },
    { name: "lifeguard chair", is: "furniture", where: "on the deck beside the pool, facing it", rig: ["swivel", "position"] },
    { name: "lane rope", is: "fixture", where: "along the water between the lanes, three of them", rig: ["spin", "bob"] },
    { name: "flags", is: "fixture", where: "across the pool 5 m from each end, over the water", rig: ["flutter"] },
    { name: "drain", is: "fixture", where: "in the pool's floor at the deep end, a pair" },
    { name: "shower", is: "fixture", where: "on the deck by a wall", rig: ["position"] },
    // on the walls
    { name: "pace clock", is: "wall item", where: "high on the far wall", rig: ["sweep"] },
    { name: "lifebuoy", is: "wall item", where: "on a wall at shoulder height, on its backboard", rig: ["swing"] },
    { name: "rescue pole", is: "wall item", where: "on the far wall, in its brackets" },
    { name: "rules sign", is: "sign", where: "on the far wall by the door" },
    { name: "hose", is: "wall item", where: "on the far wall by the door, coiled on its bracket" },
    // dressing
    { name: "bench", is: "furniture", where: "on the deck against the long wall" },
    { name: "towel", is: "textile", where: "over a bench, and folded on it" },
    { name: "flip flops", is: "dressing", where: "on the deck before a bench" },
    { name: "deck chair", is: "furniture", where: "on the deck, facing the pool", rig: ["position"] },
    { name: "kickboards", is: "equipment", where: "on its trolley at the far end's deck", rig: ["position"] },
    { name: "beach ball", is: "dressing", where: "floating in a near lane", rig: ["roll", "bob", "position"] },
    { name: "wet floor sign", is: "sign", where: "on the deck by a ladder" },
    { name: "plant", is: "decor", where: "in the far corners", rig: ["sway"] },
  ],
};
