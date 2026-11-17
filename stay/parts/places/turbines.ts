// Wind Ridge: the place's components (blender/components/turbines/, media/models/turbines/). `rig` lists each
// sidecar's rig keys: a clip in the .glb, or a thing the scene drives (the sidecar says which).
export default {
  heading: "WIND RIDGE",
  props: [
    { name: "turbine", is: "machine", where: "along the ridge's crest 100 m apart, rotors toward the valley and the camera: the nearest one's rotor is the circle the cut lands on", rig: ["spin", "yaw", "pitch", "beacon"] },
    { name: "ridge", is: "ground", where: "the whole ridge: the valley floor under the first turbine, the level crest 30 m up" },
    { name: "fog", is: "weather", where: "in the valleys either side of the ridge, at the ridge's origin", rig: ["drift", "thickness"] },
    { name: "sky", is: "backdrop", where: "behind the ridge, 225 m off, the sun low between the first two turbines", rig: ["sunrise"] },
    { name: "access road", is: "ground", where: "on the crest, one length at each turbine's foot, joining into one road in front of the towers" },
    { name: "transformer", is: "electrical", where: "beside each tower's foot, by the road", rig: ["doors"] },
    { name: "cabin", is: "building", where: "on the crest past the first turbine's crane pad", rig: ["door", "lamp"] },
    { name: "met mast", is: "instrument", where: "on the crest between the first two turbines", rig: ["cups", "vane", "beacon"] },
    { name: "power pole", is: "electrical", where: "along the crest behind the towers, 90 m apart, the line running the ridge's length" },
    { name: "fence", is: "barrier", where: "along the crest's front edge beside the road, a gate before each turbine", rig: ["gate"] },
    { name: "warning sign", is: "sign", where: "by the road at the gate" },
    { name: "windsock", is: "instrument", where: "at the crane pad's corner", rig: ["swing", "fill"] },
    { name: "cable drum", is: "site kit", where: "on the crane pad, on its chocks", rig: ["roll"] },
    { name: "generator", is: "site kit", where: "on the crane pad" },
    { name: "barrier", is: "barrier", where: "end to end closing the crane pad's far edge" },
    { name: "boulders", is: "rock", where: "on the crest's edge where the road was cut" },
    { name: "shrub", is: "plant", where: "on the ridge's shoulders below the fence", rig: ["sway"] },
  ],
};
