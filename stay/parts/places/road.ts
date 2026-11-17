// The forest road's components (blender/components/road/*.py -> media/models/road/*.glb; library/road.tsx stands them
// up). A rig key is a clip in the .glb unless its sidecar says "in the scene".
export default {
  heading: "FOREST ROAD",
  props: [
    { name: "road", is: "ground", where: "through the trees: 40 m sections of two-lane asphalt, end to end", rig: ["wet", "roughness"] },
    { name: "markings", is: "surface", where: "on the road: double yellow, fog lines, raised markers", rig: ["glow"] },
    { name: "puddles", is: "surface", where: "in the road's four dips", rig: ["open", "rings"] },
    { name: "verge", is: "ground", where: "either side of the road: shoulder, ditch, bank, forest floor" },
    { name: "car", is: "vehicle", where: "on the road, in its lane", rig: ["drive", "wheels", "wipers", "steer", "lights", "paint"] },
    { name: "windscreen", is: "vehicle part", where: "the car's front from the driver's seat, at the car's origin", rig: ["wipers", "run", "rain"] },
    { name: "trees", is: "plant", where: "either side of the road, the front rank: 30 m Douglas firs", rig: ["sway"] },
    { name: "trees b", is: "plant", where: "between and before the tall firs: 18 m, crowned lower", rig: ["sway"] },
    { name: "treeline", is: "plant", where: "14 m off each side and across the road's far end: the wall of forest behind", rig: ["sway"] },
    { name: "sapling", is: "plant", where: "on the bank and at the road's edge", rig: ["sway"] },
    { name: "ferns", is: "plant", where: "on the verge and the ditch's bank", rig: ["sway"] },
    { name: "rain", is: "effect", where: "the air over the road and the camera", rig: ["fall", "splash"] },
    { name: "spray", is: "effect", where: "at a front wheel as it goes through a puddle", rig: ["burst", "fall"] },
    { name: "road sign", is: "sign", where: "on the verge, facing the traffic", rig: ["shake", "glow"] },
    { name: "barrier", is: "fixture", where: "along a bend, on the shoulder, its face to the road", rig: ["glow"] },
    { name: "reflector post", is: "fixture", where: "on the shoulder by the fog line, every 20 m", rig: ["flex", "glow"] },
    { name: "branches", is: "debris", where: "windfall on the road's edge", rig: ["skid"] },
    { name: "stump", is: "plant", where: "on the verge near the road" },
    { name: "log", is: "debris", where: "fallen on the verge by the ditch" },
    { name: "rocks", is: "rock", where: "on the bank beyond the ditch" },
  ],
};
