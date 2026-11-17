import { script } from "raea/brief";

// Storyboard draft 5 (11-11): the film as built in v3/, started over after the director's notes on assembly 8 and changed again
// on his notes on v3 itself (all verbatim in brief.ts). Drafts 2 to 4 are kept as docs/stay.script.draftN.ts.txt.
//  - "the first 30-40s econds right now is all ofcicie id rather not be there and shift into amny other places we can
//    build and center on something liek a door for match cuts", "we cant linger it gets boring otherwise": the opening
//    is one walk through eight new rooms, each crossed toward a door centred in its far wall.
//  - "the mouse shoudl be like animating in 3d space not 2d space", "make sure clicking on things ... show up in the
//    screen": the cursor is a solid in each place and its clicks are forced into the frame.
//  - "the sea scenes are also too long ... the outro actually being more ui product of the app itself with some cool
//    depth of field shots of timelines and thigns and comments and then a wide of the platform the the logo".
//  - "you dont show any text or prompts or anythign. just use only environment with mixtures of wirframes and things
//    like cursor moving objects and the native boxes that go over objects and mixtures of some 2d aniamtions ... no
//    text at all no logo until the end": nothing is read until the card. No prompt, no note card, no type, no app window.
//  - "the whole stills thing doesnt work. take these environements and try to do something completely different with
//    them": no held frames. The idea now: a place is a drawing until the cursor touches it.
//  - "you will have to completely rip out timing and camera": one straight camera move a shot at one speed (v3/cam.ts),
//    one event a shot.
//  - "cinematic vintage not home camera vitnage" and "think like an a24 trailer": a low-key print, no artefacts.
// Draft 8 (11-11, the director's notes on assembly 18, verbatim in brief.ts): the cursor moves as a hand does and everything it
// does is on the song's grid, heard as a clock (a tick, then tick and tock); each door opens on the next place, seen
// through it as that place will first be seen (colour through a drawn wall, a drawing through a real one); one of the
// doors stands in a garden; the living room's click changes the hour, not the drawing; the window opens on night; the
// outdoor places have grass; the montage is one circle handed from place to place, colour and drawing by turns; the
// boat has three beats. The draft before is docs/stay.script.draft7.ts.txt.
// And on his note while it was being made: grass and foliage are drawn as a mass's outline with a few clumps of texture,
// not every blade; the garden is first pencil on paper, the road charcoal on paper, two montage places pencil.
// Draft 9 (11-11, his notes on assembly 19): the opening is ONE take, a single camera move through every world's door,
// with no cut until the canyon; it begins in a black abyss with one door in it; outdoor shots carry a little bloom and
// the road a sky with clouds. (Draft 8 is docs/stay.script.draft8.ts.txt.)
// Kept: every cut on Stay's own beats (v3/plan.ts), the places and their rigs, the cursor that only moves things.
export default script({
  title: "Stay",
  logline: "A walk through doors. Each place is a drawing until the cursor touches it. No words until the product and its card.",
  scenes: [
    {
      heading: "INT. A HALLWAY - THE DARK",
      payoff: "It starts with a door.",
      beats: [
        {
          onScreen: "Out of black: a dark with a floor to it, and standing in it a door under one small light. We are already moving toward it. The cursor comes in past the lens, a small solid arrow in the place's own space, and clicks the door. It swings open on the white lines of a kitchen, and we go through.",
          camera: "The take begins: one dolly straight ahead that does not stop or cut until the canyon, in a doorway on each of the song's beats the walk was cut on",
          cut: "From black, the film's first frame",
          cues: ["The song's first notes","One tick, on the door"],
          seconds: 2.75,
        },
      ],
    },
    {
      heading: "INT. A HOME KITCHEN - A DRAWING",
      payoff: "What the cursor rests on is real.",
      beats: [
        {
          onScreen: "The lines of a kitchen: a stove, a table laid for tea, a lamp over it. The cursor goes to the clock on the far wall and clicks it, and inside the pick box round it the clock is real. Then the cursor clicks the door's knob and the door swings open ahead of us: through the doorway, in a wall that is still only lines, the next room stands in full colour, afternoon sun on its floor.",
          camera: "A dolly straight down the middle of the room toward its door at walking pace, the door at the centre of the frame",
          cut: "No cut: the same dolly carries through the doorway (2.75)",
          cues: ["The song","A tick as the cursor clicks the clock, a tick on the door, each on the beat; the latch"],
          seconds: 4.36,
        },
      ],
    },
    {
      heading: "INT. A LIVING ROOM - AFTERNOON, THEN DUSK",
      payoff: "The cursor can change the hour as well as the drawing.",
      beats: [
        {
          onScreen: "The living room we saw through the door, real: sofas, a console and its television, a tall clock, the afternoon lying on the boards. The cursor goes up to the ceiling lamp and clicks it: the sun goes down outside, the room falls to dusk and the lamp is what lights it. The cursor clicks the door, which swings open on a room that is still a drawing, white lines in the doorway of a real wall.",
          camera: "A dolly straight down the middle of the room toward its door at walking pace, the door at the centre of the frame",
          cut: "No cut: the same dolly carries through the doorway (7.11)",
          cues: ["The song","A tick on the lamp, a tick on the door; the latch"],
          seconds: 5.08,
        },
      ],
    },
    {
      heading: "INT. A STUDY - A DRAWING, THEN DUSK",
      payoff: "One click, and the drawing is a place.",
      beats: [
        {
          onScreen: "On the drop the cursor clicks, and the real study spreads out from the click in a growing circle: walls in deep green paint, a cabinet, a round table, a chandelier. The cursor takes the knob and the door swings open onto light.",
          camera: "A dolly straight down the middle of the room toward its door at walking pace, the door at the centre of the frame",
          cut: "No cut: the same dolly carries through the doorway, on the drop (12.19)",
          cues: ["The drop","A click; the room's air from the moment it is real; the latch"],
          seconds: 2.82,
        },
      ],
    },
    {
      heading: "INT. A GREENHOUSE - DAY",
      payoff: "In a real place the cursor moves real things.",
      beats: [
        {
          onScreen: "A greenhouse room in full sun: planters along the walls, a bench, a table of pots. The cursor picks a potted plant off the floor and carries it across to the planters. It clicks the door, which swings open on a meadow in daylight.",
          camera: "A dolly straight down the middle of the room toward its door at walking pace, the door at the centre of the frame",
          cut: "No cut: the same dolly carries through the doorway (15.01)",
          cues: ["Leaves and a room in the sun, low","A tick as the plant is picked up and a tock as it is put down; a tick on the door; the latch"],
          seconds: 3.35,
        },
      ],
    },
    {
      heading: "EXT. A DOOR IN A GARDEN - DAY",
      payoff: "A door can stand anywhere.",
      beats: [
        {
          onScreen: "A meadow under a sky with clouds in it: long grass and flowers, a jacaranda, small trees, firs all round. Standing in the middle of it, with nothing on either side, a length of white wall with a door in it. We cross the meadow toward it. The cursor picks a watering can out of the grass and sets it down by a tree. It clicks the door, which swings open on a dining room in lamplight.",
          camera: "A dolly straight across the meadow toward the door at twice walking pace, the door at the centre of the frame",
          cut: "No cut: the same dolly carries through the doorway (18.36)",
          cues: ["A meadow: birds, wind in the grass","A tick on the watering can, a tock where it is put down; a tick on the door; the latch"],
          seconds: 5.12,
        },
      ],
    },
    {
      heading: "INT. A DINING ROOM - EVENING",
      payoff: "One thing changes; the rest stays.",
      beats: [
        {
          onScreen: "A dining room in low evening sun: a table laid with a cake and a tea set, a cabinet, a tall clock. The cursor picks a chair and pulls it back to the table. It opens the door.",
          camera: "A dolly straight down the middle of the room toward its door at walking pace, the door at the centre of the frame",
          cut: "No cut: the same dolly carries through the doorway (23.48)",
          cues: ["A room in the evening, low","A click on the chair; the latch"],
          seconds: 4.22,
        },
      ],
    },
    {
      heading: "INT. A CELLAR - LAMPLIGHT, THEN A DRAWING",
      payoff: "And any place can go back to its drawing.",
      beats: [
        {
          onScreen: "A cellar under two bare lamps: barrels, crates, a chest. The cursor clicks, and the drawing spreads back over the room in a growing circle. In the drawing it pulls the last door open.",
          camera: "A dolly straight down the middle of the room toward its door at walking pace, the door at the centre of the frame",
          cut: "No cut: the same dolly carries through the doorway (27.70)",
          cues: ["A cellar's air, low, falling silent as the drawing returns","A click; the latch"],
          seconds: 6.07,
        },
      ],
    },
    {
      heading: "EXT. A SLOT CANYON - A DRAWING, THEN LATE AFTERNOON",
      payoff: "It works anywhere: the same touch, a different place.",
      beats: [
        {
          onScreen: "The lines of a slot canyon, travelled into. The cursor rests on a tumbleweed, which shows real in its pick box. On the drop it clicks and the real canyon opens from the click in a circle; the sun comes down the walls from noon to a low warm light as sand streams fall from the rim. The cursor picks the tumbleweed and pulls it out of our way.",
          camera: "A dolly down the slot at just under a metre a second, tilted a little up to the strip of sky",
          cut: "Match cut on the door (33.77): the cellar's open door, as lines, to the slot of the canyon, as lines. The circle opens on the drop at 38.62",
          cues: ["Silence, then a riser into the drop", "A click; wind in the slot from the moment it is real"],
          seconds: 9.32,
        },
      ],
    },
    {
      heading: "EXT. A GARDEN IN A WOOD - DUSK",
      payoff: "The thing in the cursor's hand is real before the place is.",
      beats: [
        {
          onScreen: "A pencil drawing of a garden in a clearing, graphite on paper, its shade hatched in: a picnic table, a bench, a jacaranda, firs behind. The cursor lifts a storm lantern from the grass, the lantern real inside its pick box while the garden is still lines, and stands it on the table. Where it is set down its flame comes up and the real garden spreads out in a circle, the low sun through the trees.",
          camera: "A slow push toward the table",
          cut: "Match cut on the collapse (43.09): the canyon's low sun down its walls to the garden's low sun through the trees",
          cues: ["A click on the lantern", "The garden's evening from the moment it is real: crickets, leaves"],
          seconds: 4.69,
        },
      ],
    },
    {
      heading: "INT. A KID'S BEDROOM - AFTERNOON INTO RAIN",
      payoff: "The cursor can draw the line between the two itself.",
      beats: [
        {
          onScreen: "A drawing of a kid's bedroom: a carved bed, a nightstand and its alarm clock, a dartboard by the door. The cursor takes hold at the left edge and drags a line across the frame; the real room is on its near side, afternoon sun lying across the white bed and the floorboards.",
          camera: "A slow push toward the bed",
          cut: "Match cut on the build (47.78): the sheet's drift from the dryer to the white sheets of the bed",
          cues: ["A click as the line is taken", "The room's air behind the line, a few birds outside"],
          seconds: 4.79,
        },
        {
          onScreen: "The same room's window at night, its blinds down, the door behind us, the room held by the faint glow of its desk lamp. The cursor picks the blinds and lifts them: rain is beaded and running on the glass, and through it, soft and out of focus, a yard at night, firs and a street lamp burning.",
          camera: "A push toward the window",
          cut: "Match cut on the light (52.57): the sun on the bed to the window it came through, hours later",
          cues: ["A tick on the blinds, a tock as they are let go", "Rain on the glass from the moment they are up"],
          seconds: 4.06,
        },
      ],
    },
    {
      heading: "EXT. A FOREST ROAD - RAIN",
      payoff: "The rain carries us out of the room and onto the road.",
      beats: [
        {
          onScreen: "A charcoal drawing of a road between tall trees, rubbed dark on paper; we are already driving down it, low in its lane. The cursor comes in past the lens and clicks the road ahead; the real place spreads from the click, wet and grey in the mist, the rain falling fine on the empty road, the firs standing off into the fog.",
          camera: "A low track forward down the lane at one speed, as if driving it, the firs passing on both sides",
          cut: "Match cut on the rain (56.63): rain on the window's glass to rain on the road",
          cues: ["Rain on the road and wind in the trees, from the moment it is real"],
          seconds: 6.53,
        },
      ],
    },
    {
      heading: "EXT. A HARBOUR - DUSK",
      payoff: "One click on one thing.",
      beats: [
        {
          onScreen: "A drawing of a wooden pier and a sailing ship moored along it, masts over the frame. The cursor slides a crate, real inside its pick box, out of the way down the planks. It clicks the ship's side: the real harbour opens from the click, still water under a burning sky, and the lantern on the pier is alight.",
          camera: "A slow dolly down the pier beside the hull",
          cut: "Match cut on the line (63.16): the road running away from the lens to the pier's planks running away from the lens",
          cues: ["A click on the crate, a click on the ship", "The harbour from the moment it is real: water on the piles, the ship's timbers"],
          seconds: 5.33,
        },
      ],
    },
    {
      heading: "MONTAGE - NINETEEN PLACES",
      payoff: "Any place at all: one circle, handed from place to place.",
      beats: [
        {
          onScreen: "Nineteen places, each framed on a round thing held at the centre of the frame at one size, the circle growing slowly through the whole run: a record on its turntable, a coffee cup from above, a koi pond's ripples, a clock tower's dial, a stairwell's eye, a dryer's window, a hoop's rim from under it, a train's face, the office's wall clock, a basketball, a ferris wheel, a pool's pace clock, a garage's mirror, a turbine's rotor, a lighthouse's lens, a rose window, the sun through a kelp forest, the moon, the sun on the sea. They are drawing and colour by turns, two and two: two places are white lines with the round thing real inside the circle, the next two are in full colour with the round thing drawn. The cursor rides the circle's edge and clicks on every cut.",
          camera: "Each a short push straight at the round thing, already moving, so the circle keeps its place and its size across the cut",
          cut: "On every beat from the drop at 68.49, quickening: twelve places at two a beat, three at three a beat, the last four at four a beat; a match cut on the circle at every one",
          cues: ["The song: its peak", "A tick and a tock by turns on every cut, the room round them opening as the cuts quicken"],
          seconds: 5.01,
        },
      ],
    },
    {
      heading: "EXT. THE OPEN SEA - DUSK",
      payoff: "And one real thing to arrive at.",
      beats: [
        {
          onScreen: "A fishing boat rides up a swell and over its crest, the water breaking white along its hull, the low sun behind it. No cursor, no drawing: a simulated sea, real from its first frame.",
          camera: "A low track beside the boat, a little faster than it",
          cut: "Match cut on the circle (73.50): the sun on the sea to the boat against the same light",
          cues: ["The sea: the hull through the swell", "The clock, far off"],
          seconds: 1.86,
        },
      ],
    },
    {
      heading: "THE RAEA APP - CLOSE",
      payoff: "All of that was made here.",
      beats: [
        {
          onScreen: "A capture of the real raea app, very close and mostly out of focus: we travel along the timeline under the film, its markers passing through the plane of focus toward the playhead.",
          camera: "A macro dolly along the timeline, a fast lens, the focus a hand's width deep",
          cut: "Match cut on the circle (75.36): the pool's pace clock to the playhead's round head",
          cues: ["The song", "Nothing else"],
          seconds: 2.48,
        },
        {
          onScreen: "The same capture, close on its notes: each a line someone wrote on the film (morning light through that window. darker walls. a room for reading. more green by the bench.) and under it what the agent did, each coming sharp as we pass it.",
          camera: "A macro dolly down the notes, the focus on the note we are passing",
          cut: "Cut on the downbeat (77.84)",
          cues: ["The song"],
          seconds: 2.48,
        },
        {
          onScreen: "The whole platform: the capture of the raea app at full width in the dark, the film in its viewer, the notes beside it, the timeline under it. We draw slowly back from it.",
          camera: "A slow pull back from the whole window",
          cut: "On the drop (80.32)",
          cues: ["The drop"],
          seconds: 2.49,
        },
      ],
    },
    {
      heading: "THE CARD",
      payoff: "raea 0.1.1.",
      beats: [
        {
          onScreen: "Black. raea's lockup, and under it: 0.1.1 · MAC · WINDOWS · LINUX.",
          camera: "None: a slow scale up on the lockup",
          cut: "Cut to black on the beat (82.81): the platform to its name",
          cues: ["The song's last bars", "The sea fading out"],
          seconds: 6.84,
        },
      ],
    },
  ],
});
