// The clock tower's components (blender/components/clocktower/*.py -> media/models/clocktower/*.glb), on the stand in
// library/clocktower.tsx. name = the file's name with spaces for hyphens; rig = the keys of its sidecar's rig.
export default {
  heading: "CLOCK TOWER",
  props: [
    { name: "movement", is: "clockwork", where: "the middle of the room, on its iron stand; its great wheel is the shot's circle", rig: ["push", "turn", "tick"] },
    { name: "clock face", is: "dial", where: "in the wall's round opening, 2.95 m up, seen from behind (the upper-right circle)", rig: ["hands", "push", "light"] },
    { name: "leading off", is: "clockwork", where: "up from the movement's bevel wheel and back along the beams to the dial", rig: ["turn", "push"] },
    { name: "pendulum", is: "clockwork", where: "behind the movement on its A-frame, its rod in the crutch's fork", rig: ["swing"] },
    { name: "bell", is: "bell", where: "right of the movement, in its timber frame with the clock hammer", rig: ["strike", "ring"] },
    { name: "pigeon", is: "bird", where: "on the floor, the stool and the bell's headstock", rig: ["peck", "flap"] },
    { name: "wall", is: "shell", where: "the tower's front wall, brick, the dial's opening in it" },
    { name: "floor", is: "shell", where: "the room's boards, a trapdoor left of the middle", rig: ["hatch"] },
    { name: "beams", is: "shell", where: "the oak frame: four posts, tie beams, braces and three joists overhead" },
    { name: "crank", is: "tool", where: "on the crate, lifted off the movement's winding square" },
    { name: "wrench", is: "tool", where: "on the crate", rig: ["jaw"] },
    { name: "oil can", is: "tool", where: "on the crate" },
    { name: "crate", is: "furniture", where: "front right, the tools laid out on it" },
    { name: "toolbox", is: "tool", where: "on the floor, front left, open" },
    { name: "stool", is: "furniture", where: "in front of the movement, a pigeon on it" },
    { name: "ladder", is: "furniture", where: "by the left post" },
    { name: "bucket", is: "furniture", where: "far left, by the wall" },
    { name: "lantern", is: "light", where: "on the floor, left" },
    { name: "broom", is: "tool", where: "against the wall, right" },
    { name: "caged light", is: "light", where: "hung on chains from the right joist" },
  ],
};
