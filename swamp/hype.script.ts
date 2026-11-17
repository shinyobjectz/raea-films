import { script } from "raea/brief";

// The hype film for raea 0.1.5's new app. 84.8 s, 16:9, no narrator, no titles; one subtitle, and an end card in space.
// The robot is the cursor: wherever the app's pointer would be, the robot is, in front of the glass.
// The project it makes is the swamp itself. After one typed line it works four of the app's own controls, and each
// one changes the world round the monitor; then it leaves a note on its own picture, the agent answers with a new
// version, and the world takes the answer, until the whole world is a different one. Then it shares the film for review,
// and the review comes from orbit. It ends on the stars, raea's logo full size over them.
export default script({
  title: "Swamp",
  logline: "In a dead grey swamp, a small robot cursor wakes a giant monitor, opens the new raea app, redesigns the world it is standing in control by control, then draws a note on the picture and watches the agent answer it.",
  scenes: [
    {
      heading: "EXT. SWAMP - NO PARTICULAR HOUR. The wake.",
      payoff: "A muted viewer stops: a huge dead screen in a real, colourless swamp, and something small and alive heading for it.",
      beats: [
        {
          onScreen:
            "Under the black peat water, then up through its surface: the lens breaks out with the water sheeting and dripping off the glass (v5). Low over black water, through bare reeds. Everything is grey: bare trunks, flat sky, no leaf anywhere. Ahead, a monitor the size of a barn door stands half sunk, its bezel furred with dead moss, the glass dark. A small robot shaped like a pointer arrow darts across frame, leaving a ring on the water: a machine, beige armour plates bolted over a gunmetal frame, a camera lens, a steel nose, a nozzle and trim thrusters burning pale blue.",
          camera: "Rising out of the water as it drifts forward between reeds, already moving; the monitor on the right third, the robot crossing from the left.",
          cut: "opens in motion, no fade from black",
          cues: ["under the water: a dull roar and the camera's swish; the break: a slosh, then a trickle as the water runs off the glass and drops falling back into the swamp", "almost nothing: wind in dry reed, water lapping, one distant crow", "the robot: a small servo as it passes", "the score from the first frame, barely there: a low drone, a thin high violin note, single harp and piano notes, uncertain"],
          seconds: 3,
        },
        {
          onScreen:
            "The keyboard: a slab of keys lying in the bank under dry grass, pebbles and broken stone, keycaps showing through the blades. The robot drops in and bumps one key with its nose. The key sinks; a pebble rolls off it; grass twitches.",
          camera: "Close, tilted down over the keys, sliding left to right with the robot.",
          cut: "match on the robot's motion",
          cues: ["a key clack, muffled by moss", "pebble tick"],
          seconds: 2.5,
        },
        {
          onScreen:
            "The monitor wakes. Cool white light floods out of the glass, cuts shafts through the mist and lays a bright path on the water: the first light in this world. On the glass: the raea app, its rail of projects down the left, an empty chat.",
          camera: "From behind the keyboard, rising to face the screen as it lights; the robot rises with it.",
          cut: "hard cut on the clack",
          cues: ["an old CRT switching on", "the score's low D; the harp rolls up as the glass lights"],
          seconds: 2.5,
        },
        {
          onScreen: "Macro on the robot's lens as it turns its face to the glass: the iris opens, then stops down to focus, the screen's light sliding across the lens glass. It turns back.",
          camera: "Macro, tracking the lens.",
          cut: "cut in on the robot's turn to the glass",
          cues: ["a small servo as it turns"],
          seconds: 1,
        },
      ],
    },
    {
      heading: "THE SCREEN. One line.",
      payoff: "The new app is read at a glance: projects in a rail, the chat in front. One line goes in, and the agent builds from it.",
      beats: [
        {
          onScreen: "The robot glides to the rail and taps New project. The New project dialog opens: its heading, the title typed, and the description of what a project is. The tap sends a ring across the water below the screen.",
          camera: "Medium on the left half of the screen, following the robot at its pace, the rail readable; then pushing in close on the dialog until its words read.",
          cut: "push through the mist onto the glass",
          cues: ["tap: a glassy tick and a ripple"],
          seconds: 3,
        },
        {
          onScreen:
            "The robot waits by the chat box. Below, the keys under the grass press themselves in runs, blades shivering, as the line types on the screen: \"bring this swamp back to life.\"",
          camera: "Screen (the line growing, large enough to read), keys close up, screen again: each cut shorter.",
          cut: "cut on key runs",
          cues: ["key clacks in runs on an old mechanical board"],
          seconds: 5,
        },
        {
          onScreen: "The robot swings back, winds up, and hits Return on the buried keyboard hard enough to throw a little water. The line sends.",
          camera: "Close on the Return key, the robot dropping into frame.",
          cut: "hard cut on the hit",
          cues: ["one heavy clack and a splash", "the score's swell starts with the key: a timpani roll, rising strings"],
          seconds: 0.9,
        },
        {
          onScreen: "On the glass the typed line lands in the chat and the agent starts planning.",
          camera: "Close on the chat, the line large enough to read.",
          cut: "hard cut to the glass",
          cues: ["the swell building"],
          seconds: 0.9,
        },
        {
          onScreen: "The screen flares: a pulse of light leaves the glass and lights the dead bank and the black water (v5: no rings of light on the ground): the first sign of life.",
          camera: "Wide and low from the water, the monitor centre, its light running at the lens.",
          cut: "on the swell's crest",
          cues: ["the score blooms in D major: a harp glissando, the timpani, the piano sparkling down"],
          seconds: 1,
        },
        {
          onScreen: "Close on the agent's task list in the chat: each task ticks off in turn, its name legible.",
          camera: "Close on the tasks panel, easing down it.",
          cut: "hard cut to the glass",
          cues: ["each task ticking is a drip", "the theme's pulse under it"],
          seconds: 2.1,
        },
        {
          onScreen: "A new item lands in the feed beside the chat: the swamp itself, as a scene, grey as the world is. The robot bobs in front of it.",
          camera: "Slow arc round the monitor toward centre, the screen always in frame.",
          cut: "on the last tick",
          cues: ["a tick as the card lands", "the strings build slowly"],
          seconds: 1.1,
        },
      ],
    },
    {
      heading: "THE WORLD. Light.",
      payoff: "The first control. What the robot does on the glass happens to the world: the claim, shown.",
      beats: [
        {
          onScreen: "The panel turns to the project's Controllers. The robot takes the Sun slider's knob and drags it across.",
          camera: "Close on the slider and the robot, tracking right with the knob.",
          cut: "match on the robot's move to the panel",
          cues: ["a servo as the knob travels"],
          seconds: 1.7,
        },
        {
          onScreen:
            "As the knob travels, the real sun climbs behind the bare trunks. Warm shafts break through the mist and cross the screen's cool light; the grey sky takes colour. On the glass the scene's own sky warms with it.",
          camera: "Low from the water, the monitor against the light, the shafts arriving toward the lens.",
          cut: "cut mid-drag: the knob's motion carries into the sun's",
          cues: ["the first birds; the living swamp comes up", "the first swell: strings and horn bloom"],
          seconds: 1.7,
        },
      ],
    },
    {
      heading: "THE WORLD. Water.",
      payoff: "A second kind of control, a second layer of the world.",
      beats: [
        {
          onScreen: "Under Light, Water: a row of colours. The robot picks one.",
          camera: "Close on the swatches, pushing in as it picks.",
          cut: "hard cut, shorter than the last",
          cues: ["pick: a pebble into still water"],
          seconds: 1.1,
        },
        {
          onScreen:
            "From the monitor's foot outward, the black water clears to the picked colour, and lily pads unroll across it in a ring that passes under the camera, a few opening into flower. Frogs surface. Close to the lens a fish leaps clear, nose first, its body flexing, shedding drops, and falls back in with a splash and spreading rings.",
          camera: "Just above the surface, the ring coming at the lens, the monitor behind it.",
          cut: "on the drop",
          cues: ["the ring: water pouring", "frogs", "a fish's small splash out and its splash back in", "harp and piano over the pulse"],
          seconds: 1.4,
        },
      ],
    },
    {
      heading: "THE WORLD. Growth.",
      payoff: "Not a setting this time: the robot puts its hands on the scene itself.",
      beats: [
        {
          onScreen: "The robot goes to the Growth controller and drags its Canopy slider all the way up.",
          camera: "Close on the slider, following the drag.",
          cut: "hard cut on the click that opens it",
          cues: ["a tree creaking"],
          seconds: 1.1,
        },
        {
          onScreen:
            "Every real tree answers. Leaves break out along the bare canopy in a wave that rolls away from the monitor; moss on the bezel greens, the dry grass over the keyboard stands up green, ferns and grass come up along the monitor's top. Startled, ravens burst out of the crowns and beat away across the haze over the monitor.",
          camera: "Low and wide-angled beside the monitor, looking up into the canopy as the wave passes overhead.",
          cut: "match on the drag",
          cues: ["a gust through leaves", "wings clattering up and the ravens' croaks, the flock passing right to left", "the score's high point"],
          seconds: 1.5,
        },
      ],
    },
    {
      heading: "THE NOTE. Back and forth.",
      payoff: "How a person and the agent work on one picture: a note pinned and drawn on the frame, sent, answered with a new version, and the two versions compared. The world takes the answer.",
      beats: [
        {
          onScreen: "The robot opens the item full size: the swamp as the scene, under it the transport and timeline.",
          camera: "Medium on the glass, easing in.",
          cut: "on the leaves settling",
          cues: ["the ebb: the score falls away to a solo piano"],
          seconds: 0.9,
        },
        {
          onScreen: "Close on the picture's toolbar: the robot hovers over the Comment tool and clicks it, and the tool shows selected.",
          camera: "Close on the toolbar, the robot's nose on the icon.",
          cut: "hard cut to the glass",
          cues: ["a tick as it picks the tool"],
          seconds: 0.9,
        },
        {
          onScreen: "It pins a note on the water at the foot of the frame. A small composer opens beside the pin and the words type in: \"mist on the water.\"",
          camera: "Close on the pin and the composer, drifting right with the words.",
          cut: "none (v5): the shot on the Comment tool follows the robot on to the pin",
          cues: ["a tap on glass", "quiet key clacks"],
          seconds: 1.8,
        },
        {
          onScreen: "It picks the composer's Lasso and draws a loop round the water, button held; the loop stays as the note's mark. It taps the words, the note posts and stays as a pin, and it presses Send.",
          camera: "Close on the loop as it is drawn, then the corner where Send waits.",
          cut: "match on the robot's move",
          cues: ["a marker drawn on glass", "a tap: sent"],
          seconds: 2.1,
        },
        {
          onScreen: "Back in the project: the note is the person's message in the chat, the agent's Comment task chip comes up, and the feed card turns to Swamp v2, mist over the water.",
          camera: "The whole glass, slowly arcing.",
          cut: "on the Send tap",
          cues: ["a drip as the agent takes the note", "a drop as the new version lands"],
          seconds: 1.7,
        },
        {
          onScreen: "The answer happens to the world: a bank of mist rolls in over the water from the left, the sun cutting through it.",
          camera: "Wide and low across the water, the monitor small in the mist, held while it rolls in; on the screen the robot drags the compare divider across, v1 to v2, the clear water giving way to the mist (v5: seen in the wide, no cut in to the glass).",
          cut: "on the drop",
          cues: ["running water, a soft gust", "the score rises warm and wide"],
          seconds: 2.5,
        },
      ],
    },
    {
      heading: "THE WORLD. Time.",
      payoff: "The last control changes the hour, and the whole world with it. Nothing in frame is what the film opened on.",
      beats: [
        {
          onScreen: "Still comparing, the robot grabs the playhead and scrubs it forward; the light swings through the afternoon as it goes, on both versions and in the world. It lets go.",
          camera: "Close on the playhead, travelling with it, the scene's picture above it turning to dusk.",
          cut: "hard cut, the shortest yet",
          cues: ["a rush of wind and the score's crescendo with the scrub, landing on the release: the climax"],
          seconds: 2.7,
        },
        {
          onScreen:
            "Dusk. The scene plays, and fireflies light in the reeds at the monitor's foot and spread outward, hundreds, to the far trees. Lilies lie on coloured water under a full canopy. The robot loops once in the air.",
          camera: "Starts tight on the screen, then pulls back and up through the reeds as the fireflies spread, the monitor staying centre: the one big move of the film.",
          cut: "on the release",
          cues: ["a broad resolved chord and a slow cello and horn line", "dusk: frogs and crickets", "a swish as the robot loops"],
          seconds: 3.7,
        },
        {
          onScreen: "The robot comes back to the glass and opens Share: Review link, Share for review. It types the title on the page, \"Swamp, for the mothership\", and presses Create link. The link is made.",
          camera: "Close on the Share panel, drifting down it with the pointer.",
          cut: "hard cut to the glass",
          cues: ["the same clicks and keys as before", "a single drop into water as it sends"],
          seconds: 3,
        },
      ],
    },
    {
      heading: "THE REVIEW. Up.",
      payoff: "The send is answered from the sky: the film goes up for review, and the camera goes with it.",
      beats: [
        {
          onScreen: "In the bank beside the keyboard the ground trembles: the keys rattle, the water shivers, light leaks out of a jagged crack. The grass and ferns on the bank ride the ground as it swells, rising and tilting with the block each stands on, and bow away from the crack (v5). Then the bank blows open: chunks of earth and grass are thrown out, tumble and fall back, some into the water; a burst of torn leaves goes up with them and comes fluttering down, and a glowing pit is left.",
          camera: "From over the water, the bank and the keyboard filling the frame, shaking with the ground.",
          cut: "hard cut",
          cues: ["a rumble building, the keys rattling, grit trickling", "the crack, light sizzling out of it", "the blast; earth landing all round and splashing into the water"],
          seconds: 2.2,
        },
        {
          onScreen: "The beam stands up out of the pit's centre: a shaft of blue-white light in the air, filaments twisting round its core, pulses running up it, leaves and blocks of earth crossing in front of it. As it fires, the trees round the pit are thrown back from it and shudder, swing back, and tremble while it hums (v5).",
          camera: "Low by the pit, tilting up the beam as it rises.",
          cut: "on the blast's settle",
          cues: ["a charge rising out of the pit into the ignition", "the beam's hum standing"],
          seconds: 1.1,
        },
        {
          onScreen: "Up the beam: past the trunks, through the canopy, into open dusk sky, the beam a shaft running straight up into it, until the frame goes white.",
          camera: "Rising beside the beam, faster and faster, tipping up into the sky.",
          cut: "hard cut",
          cues: ["leaves rushing past", "wind climbing into the white", "horns entering"],
          seconds: 3,
        },
        {
          onScreen: "Space. The Earth's night side under the frame, the limb blue, the sun cresting it; the beam's head races straight up off the dark side to a massive ship hanging in orbit and strikes its port dead centre, which flares once.",
          camera: "Looking up at the ship, drifting, handheld.",
          cut: "out of the white",
          cues: ["the ship's low drone", "the beam's head racing up", "a deep strike, felt more than heard"],
          seconds: 4,
        },
        {
          onScreen: "Under the ship: the beam runs into the centre of the port's lit iris, and the camera pushes in along it until the frame goes white.",
          camera: "Push in along the beam.",
          cut: "hard cut",
          cues: ["a rush into the white"],
          seconds: 2,
        },
        {
          onScreen: "Out of the white, a dark room and a big screen, idling. The review link lands on it and opens on the paused film, its light filling the room. Alien silhouettes walk in, two past the lens from behind the camera and two from the front corners, and take their seats.",
          camera: "Behind the seats, the screen centre, easing in.",
          cut: "out of the white",
          cues: ["the room's hum", "a chime as the link lands", "their steps and their seats, each from its own side", "a murmur building"],
          seconds: 4,
        },
        {
          onScreen: "On the big screen the film plays, the swamp at sunrise; dark, out-of-focus alien heads in the foreground watch. They react: a clamor of wow, each head lifting with its own voice; then they turn to each other and talk over each other in their own language.",
          camera: "Behind the heads, medium on the screen.",
          cut: "on the film starting",
          cues: ["room tone", "the film's own score faintly from the room", "a crowd's wow", "their chatter, a language cut from real speech and animal calls, each voice from where its head sits"],
          seconds: 4.3,
        },
        {
          onScreen: "Alien hands type on an alien keyboard: wrinkled, mottled skin, creased knuckles, dark horn nails; each finger lifts, strikes and takes the load, its neighbours following, the keys springing back. The typist mutters its note under its breath as it types.",
          camera: "Close.",
          cut: "hard cut",
          cues: ["odd, glassy key clicks on its syllables", "the typist's mutter"],
          seconds: 0.8,
        },
        {
          onScreen: "Close on the comment on the screen: with each press the note's alien glyphs write themselves on, the caret at the pen. The box lights as it sends.",
          camera: "Close on the screen's comment box.",
          cut: "hard cut from the keys, on a press",
          cues: ["the keys on the typist's syllables, each one a stroke of glyphs", "the mutter going on"],
          seconds: 1.3,
        },
        {
          onScreen: "On the screen the note posts and pins to the film in the alien script. The subtitle: \"I'm not sure this is on brand for us.\"",
          camera: "On the screen and its note.",
          cut: "hard cut",
          cues: ["a small post sound", "one of them, unsure: a low hmm", "then quiet: room tone only while the subtitle holds"],
          seconds: 4,
        },
        {
          onScreen: "Space again: the ship over the Earth's night side, the sun on the limb. The robot rushes past the lens, lit, its thruster burning, and flies on in one arc, out to the right of the ship and back up into its port, with a small, sad, falling warble as it turns away. Then the camera tilts up off the ship, the Earth and the sun, into the stars: the Milky Way's dust lanes. raea's logo fades in, full size and centred over them, and holds to the end.",
          camera: "Near still, a breath of handheld; then a slow tilt up to the stars, held.",
          cut: "hard cut",
          cues: ["a whoosh as it passes the lens", "a sad droid warble, chirps falling into a long sigh", "the dusk theme on the horn; the strings rise with the tilt; D major on the logo"],
          seconds: 7.3,
        },
      ],
    },
  ],
});
