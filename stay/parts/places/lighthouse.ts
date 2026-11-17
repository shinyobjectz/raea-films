// Lighthouse: the place's components (blender/components/lighthouse/, media/models/lighthouse/). `rig` lists each
// sidecar's rig keys: a clip in the .glb, or a thing the scene drives (the sidecar says which).
export default {
  heading: "LIGHTHOUSE",
  props: [
    { name: "tower", is: "building", where: "on the headland's plateau, 16 m back from the cliff's point, its door toward the sea", rig: ["door", "windows"] },
    { name: "gallery", is: "ironwork", where: "on the tower's deck, 18 m up, round the lantern" },
    { name: "lantern room", is: "building", where: "on the tower's deck inside the gallery, the lens inside it", rig: ["vane", "hatch", "glass"] },
    { name: "fresnel lens", is: "optic", where: "on the lantern room's floor at the tower's axis: the circle the cut lands on", rig: ["turn", "lamp"] },
    { name: "beam", is: "light", where: "from the lens's lamp, 2.1 m above the lantern's floor, out over the sea", rig: ["sweep", "dip", "glow"] },
    { name: "cliff", is: "ground", where: "the whole headland: sea level under the tower's foot, the plateau 20 m up" },
    { name: "sea", is: "water", where: "round the headland at the cliff's origin, out to the sky", rig: ["swell", "colour"] },
    { name: "surf", is: "water", where: "on the sea along the cliff's foot", rig: ["wash", "foam"] },
    { name: "sea stacks", is: "rock", where: "in the sea off the promontory's point" },
    { name: "sky", is: "backdrop", where: "behind the headland, 250 m off", rig: ["dusk"] },
    { name: "cottage", is: "building", where: "on the plateau behind and left of the tower, its door toward the path", rig: ["door", "windows"] },
    { name: "path", is: "ground", where: "on the turf from the tower's steps to the cottage's door, two lengths end to end" },
    { name: "fence", is: "barrier", where: "across the tower's front between it and the cliff's edge, its gate before the door", rig: ["gate"] },
    { name: "fence run", is: "barrier", where: "carrying the fence on along the cliff's edge either side, turned to follow it" },
    { name: "buoy", is: "sea mark", where: "afloat off the point, on the swell", rig: ["bob"] },
    { name: "lifebuoy", is: "wall item", where: "on the cottage's front wall by the door" },
    { name: "bench", is: "furniture", where: "against the cottage's front wall" },
    { name: "rocks", is: "rock", where: "on the turf near the cliff's lip" },
    { name: "shrub", is: "plant", where: "on the plateau by the fence and in the cottage's lee", rig: ["sway"] },
    { name: "gulls", is: "birds", where: "in the air off the cliff and round the lantern", rig: ["flap", "position"] },
  ],
};
