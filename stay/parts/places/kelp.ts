// Kelp Forest: its components (blender/components/kelp/*.py, media/models/kelp/*.glb), on the stand in library/kelp.tsx.
// The rig keys are each sidecar's: a clip in the .glb unless its sidecar says "in the scene".
export default {
  heading: "KELP FOREST",
  props: [
    { name: "sun", is: "light", where: "just under the surface, upper centre of the frame: the match cut's circle", rig: ["shimmer", "glow"] },
    { name: "surface", is: "shell", where: "12 m over the seabed, the bright window overhead", rig: ["swell", "glow"] },
    { name: "light shafts", is: "light", where: "fanning down from the sun's point on the surface", rig: ["sway", "glow"] },
    { name: "water", is: "shell", where: "round the whole forest: the blue distance", rig: ["glow"] },
    { name: "seabed", is: "shell", where: "the floor" },
    { name: "kelp a", is: "plant", where: "rooted on the reef and the sand, the tallest stipes, reaching the surface", rig: ["stand", "glow"] },
    { name: "kelp b", is: "plant", where: "between the tall plants", rig: ["stand", "glow"] },
    { name: "kelp c", is: "plant", where: "young plants low at the forest's edge, near the camera", rig: ["stand", "glow"] },
    { name: "canopy", is: "plant", where: "floating on the surface over the forest", rig: ["drift", "glow"] },
    { name: "reef", is: "rock", where: "the middle of the floor, the kelp's footing" },
    { name: "boulders", is: "rock", where: "scattered off the reef" },
    { name: "urchins", is: "animal", where: "on the sand and rock at the reef's foot", rig: ["bristle"] },
    { name: "sea stars", is: "animal", where: "on the rock and sand near the urchins" },
    { name: "anemones", is: "animal", where: "on the rock", rig: ["sway"] },
    { name: "sea fan", is: "animal", where: "on the rock, across the current", rig: ["sway"] },
    { name: "shells", is: "decor", where: "on the sand in the foreground" },
    { name: "garibaldi", is: "animal", where: "low over the reef, alone", rig: ["tail", "swim", "glow"] },
    { name: "sheephead", is: "animal", where: "cruising between the stipes", rig: ["tail", "swim"] },
    { name: "kelp bass", is: "animal", where: "hanging in the kelp, mid-water", rig: ["tail", "swim"] },
    { name: "school", is: "animal", where: "mid-water between the stipes, always in the open, never through the kelp", rig: ["swim", "turn"] },
    { name: "bubbles", is: "atmosphere", where: "rising from the sand", rig: ["rise", "glow"] },
    { name: "particles", is: "atmosphere", where: "through all the water", rig: ["drift", "glow"] },
  ],
};
