import { script } from "raea/brief";

// The tutorial of the raea app (0.1.5), v9, after the director's 33 notes on v8 a feed post, 11-16): "the whole video
// needs to be way more balanced toward telling a workflow and being patient and careful about how and what you show;
// don't just skip ahead. The use case has to be explained and consistent."
//
// The use case, held start to finish: Goose makes a music video of himself, in a swamp, with raea, and ships it. The
// film follows his workflow in the order he does it: open the app, connect an AI, make a project, ask for the video,
// watch the agent make it, review it and ask for a change, get the next version, finish it, share it, and let raea
// learn his eye. Each chapter says why he needs the step before it shows how.
//
// What changed from v8:
// - Cold open at the computer: no walk away and back a note. The monitor powers on as it opens a note;
//   "This is Goose" written on screen with an arrow at him a note.
// - Opening the app from a Mac desktop and its Dock a note.
// - The app shown whole, a part named by an outline round it, not a zoom a note; a close-up only to see a click
//   ("Open one", a note, and back out before the line moves on a note, a note, a note.
// - No doors or arches a note, a note: Connections and Publish are shown where they are, at the rail's foot.
//   The AIs named over a ring of their logos round Goose's head a note.
// - The goal: a held beat before "'Honk' is not a condition" a note, then what a good goal is a note.
// - The agent seen working: its steps in the chat and each thing landing in the feed as it's made a note, and
//   where version 2 came from a note. "Click anything in the feed", never "press one" a note.
// - "With me so far?", a honk, and the community on Discord in place of the startle and Esc a note, a note.
// - Note and Edit each clicked as named a note; going back to an earlier version in place of Compare and "miss
//   the planks" a note, a note.
// - The timeline section is gone: Export and CapCut instead a note.
// - Controllers get a chapter of their own: what one is, the agent's own Delivery, changing it, making one
// a note, a note.
// - The panel's four tabs gone through in place of slash a note.
// - The fingerprint explained: what it learns, from what, and what it does with it a note.
// - The end cap is cut: the film closes on the workflow and where to go next a note.
//
// Pictures. APP: the app's capture filling the frame, whole; OUTLINE: a ring round the part a line names, the rest
// dimmed a little; CLOSE: pushed in, only to see a click or text too small to read, and out again before the next
// line. SWAMP: Goose's world. GRAPHIC: drawn over the swamp. A line marked "keep" keeps its approved take; the rest are
// new and need a read.
export default script({
  title: "Goose Learns raea",
  logline:
    "A dry narrator walks Goose, a goose, through making his own music video with the raea app, one step of the work at a time, from opening the app to shipping the film.",
  scenes: [
    {
      heading: "00 · Cold open. EXT. THE SWAMP, MORNING",
      payoff: "Who Goose is and the deal: one music video, made in raea, and the app learned on the way.",
      beats: [
        {
          onScreen:
            "Goose stands at the giant keyboard in front of the beige computer. The screen powers on as the line begins: a line of light opens into the app's window. On \"This is Goose\", hand-lettered words, This is Goose, with an arrow curving down to him.",
          camera: "SWAMP: medium, a little low, Goose and the computer both in frame, a slow push in.",
          cut: "opens on the power-on",
          lines: [{ who: "narrator", says: "This is Goose. Today, Goose will make a music video." }], // keep
          seconds: 6,
        },
        {
          onScreen: "Goose turns to the lens and strikes a star's pose, wings out, the lit app behind him.",
          camera: "SWAMP: medium, low.",
          cut: "cut on the wings opening",
          lines: [{ who: "narrator", says: "And learn the new raea app on the way, from start to finish." }], // keep
          seconds: 4.6,
        },
      ],
    },
    {
      heading: "01 · Find your way. THE APP",
      payoff: "The three parts used all film: the rail (projects), a project's chat (where you ask), its feed (where the work lands).",
      beats: [
        {
          onScreen: "A Mac's desktop, the swamp as its wallpaper, the Dock along the bottom. The pointer goes to raea's icon in the Dock and clicks; the icon bounces and the app's window opens out of it.",
          camera: "DESKTOP: the whole screen, still.",
          lines: [{ who: "narrator", says: "raea is an app on your Mac. Open it from the Dock." }],
          seconds: 4.5,
        },
        {
          onScreen: "The app, whole. An outline rises round the rail on the left as it's named; the pointer runs down the projects in it.",
          camera: "APP, OUTLINE on the rail.",
          lines: [{ who: "narrator", says: "The app has three parts. Down the left, the rail: your projects." }], // keep
          seconds: 6,
        },
        {
          onScreen: "The pointer clicks a project in the rail.",
          camera: "CLOSE on the project's tile as it's clicked, the click's ring; then straight back out to the whole app.",
          lines: [{ who: "narrator", says: "Open one." }],
          seconds: 2.2,
        },
        {
          onScreen: "The project open: an outline round the chat in the middle, then round its box at the bottom.",
          camera: "APP, OUTLINE on the chat, then its box.",
          lines: [{ who: "narrator", says: "In the middle is its chat, where you ask its agent, the AI doing the work, for what you want." }],
          seconds: 6.5,
        },
        {
          onScreen: "An outline round the panel on the right, its feed; the pointer goes to it.",
          camera: "APP, OUTLINE on the panel.",
          lines: [{ who: "narrator", says: "On the right, its feed. Everything the agent makes lands there." }], // keep
          seconds: 5.7,
        },
      ],
    },
    {
      heading: "02 · Connect your AI. CONNECTIONS",
      payoff: "Connect the AI you already pay for, in Connections, at the rail's foot.",
      beats: [
        {
          onScreen:
            "Goose from behind, by the water. Over his head, a ring of the AIs' logos hangs in the air. Each lights as it's named, and Goose turns his head to it: Claude, ChatGPT, Gemini, Kimi.",
          camera: "SWAMP: behind Goose and a little above, headroom for the ring; a slow drift round him.",
          lines: [{ who: "narrator", says: "First, raea needs an AI to do the work: the one you already pay for, like Claude, ChatGPT, Gemini or Kimi." }],
          seconds: 8,
        },
        {
          onScreen: "The app. The pointer goes down to the rail's foot; an outline on Connections as it's named; a click, and Connections opens.",
          camera: "APP, OUTLINE on Connections.",
          lines: [{ who: "narrator", says: "You connect it in Connections, at the foot of the rail." }],
          seconds: 4,
        },
        {
          onScreen: "Connections, its Agents rows. The pointer clicks Connect on Claude; its sign-in opens beside it.",
          camera: "APP, OUTLINE on the Agents rows; CLOSE on the Claude row for the click; back out.",
          lines: [{ who: "narrator", says: "Under Agents, click Connect on yours, and sign in with your own account." }],
          seconds: 6,
        },
      ],
    },
    {
      heading: "03 · Ask for it. THE CHAT",
      payoff: "Make a project, pick its AI, ask for the work the way you'd ask a person, and give it a goal it can check.",
      beats: [
        {
          onScreen: "The + in the rail, outlined; New project; \"Swamp Goose\" typed; Make clicked. The project opens.",
          camera: "APP, OUTLINE on the +, then on the form as the name goes in and Make is clicked.",
          lines: [{ who: "narrator", says: "Goose's video needs a project. The plus in the rail makes one: give it a name, and click Make." }],
          seconds: 8.3,
        },
        {
          onScreen:
            "Under the box, Pick an AI: Kimi picked. Then Goose stomps out the line on the giant keyboard, key by key; the box fills: \"make me a music video. me, in a swamp, summoning ancient magic\". Send.",
          camera: "APP, OUTLINE on the AI picker; SWAMP over the keys with Goose, wide; APP as the box fills.",
          lines: [{ who: "narrator", says: "Under the box, pick the AI to run it. Then say what you want, the way you'd tell a person, and send." }], // keep
          cues: ["a clack a stomp", "Send: one heavy clack"],
          seconds: 8,
        },
        {
          onScreen: "The agent's answer arriving; \"1 running\" folded over the box, outlined; then Stop beside Send, outlined.",
          camera: "APP, OUTLINE on \"1 running\", then on Stop.",
          lines: [{ who: "narrator", says: "While it works, what it's running shows over the box. If it wanders, Stop is right beside it." }], // keep
          seconds: 7.6,
        },
        {
          onScreen: "Slash goal typed in the box. Then Goose types \"honk\" after it. Nothing happens for a beat.",
          camera: "APP, the box outlined; held still on \"/goal honk\" for the beat.",
          lines: [
            { who: "narrator", says: "To keep it going until the job's really done, type slash goal and a condition. It works until that's true." }, // keep
            { who: "narrator", says: "\"Honk\" is not a condition.", how: "after a held beat on /goal honk" }, // keep
          ],
          cues: ["after \"not a condition\": Goose honks back, once, offended"],
          seconds: 11,
        },
        {
          onScreen: "Goose stomps Delete until it's gone, and types \"/goal every shot has me in it\". The goal settles over the box.",
          camera: "SWAMP: one cut to Goose's foot on Delete; APP as the goal is typed and settles.",
          lines: [
            { who: "narrator", says: "A good goal is something the agent can check in the work itself. Not \"make it good\", but \"every shot has me in it\"." },
            { who: "narrator", says: "That is.", how: "after the goal lands" }, // keep
          ],
          seconds: 9.5,
        },
      ],
    },
    {
      heading: "04 · Watch it work. THE FEED",
      payoff: "The agent works in front of you: its steps in the chat, each thing it makes landing in the feed as it's made; any of it opens with a click.",
      beats: [
        {
          onScreen:
            "In real time: the agent's plan appears, then its steps one after another in the chat (Building the swamp…). In the feed, the stills land one by one, then the first cut.",
          camera: "APP, whole, so the chat and the feed are both seen filling; OUTLINE on the feed as the cut lands.",
          lines: [{ who: "narrator", says: "Then it gets to work, and you can watch: each step shows in the chat as it happens, and each thing it makes lands in the feed. First the stills, then the cut." }],
          cues: ["a soft drip for each card"],
          seconds: 10,
        },
        {
          onScreen: "The cut's card changes to v2, \"the summoning longer\"; the goal's check in the chat: \"GOAL MET: Goose is in every shot of version 2.\"",
          camera: "APP, OUTLINE on the card's v2, then on the goal's line in the chat.",
          lines: [{ who: "narrator", says: "It made a second version on its own, with a longer summoning. Then the goal checked it, shot by shot: Goose is in every one." }],
          seconds: 8.5,
        },
        {
          onScreen: "The pointer clicks the cut's card; it grows to full size.",
          camera: "APP, whole.",
          lines: [{ who: "narrator", says: "Click anything in the feed to open it." }],
          seconds: 3.5,
        },
        {
          onScreen: "Goose in the swamp turns to the lens.",
          camera: "SWAMP: medium, Goose square to the lens.",
          lines: [{ who: "narrator", says: "With me so far?" }],
          cues: ["Goose honks back, once: yes"],
          seconds: 3,
        },
        {
          onScreen:
            "Goose settles by the water. Beside him, a card: raea's community on Discord, discord.gg/ZCfeKDPgXX.",
          camera: "SWAMP: wide and calm; GRAPHIC: the Discord card.",
          lines: [{ who: "narrator", says: "It's fine if this is a lot at first. Everyone's new to it once. If you get stuck, ask in raea's community on Discord. The link's on screen." }],
          seconds: 8,
        },
      ],
    },
    {
      heading: "05 · Ask for a change. NOTES AND VERSIONS",
      payoff: "Pin a note where it's wrong; know Note from Edit; send it; watch the agent make the next version; go back to any earlier one.",
      beats: [
        {
          onScreen:
            "The cut open at version 2, playing to 0:58: Goose spread-winged over the keyboard, his wings flat planks; an outline round the wings. In the swamp Goose flaps his own: planks, and they clack.",
          camera: "APP, OUTLINE on the wings; SWAMP, Goose medium, the planks across the frame.",
          lines: [{ who: "narrator", says: "Back to the cut. It's a music video about Goose, so he watched himself first. His wings looked like planks." }],
          cues: ["two wooden clacks"],
          seconds: 8,
        },
        {
          onScreen: "The pointer clicks Comment, then the wing in the picture; a pin; the box: \"my wings look like planks\".",
          camera: "APP, OUTLINE on Comment; CLOSE on the wing as the pin lands; back out as the note's typed.",
          lines: [{ who: "narrator", says: "He chose Comment, clicked on the wing, and said so." }],
          seconds: 5,
        },
        {
          onScreen: "Under the note, Edit | Note. The pointer clicks Note as it's named, then Edit as it's named, then rests on Edit.",
          camera: "APP, OUTLINE on Edit | Note; CLOSE enough to read them, held while the pointer moves between them.",
          lines: [
            { who: "narrator", says: "A note can do one of two things. Note keeps it for you, as a reminder." },
            { who: "narrator", says: "Edit asks the agent to make the change. Goose wants a change, so: Edit." },
          ],
          seconds: 10,
        },
        {
          onScreen: "Send. The panel goes to Tasks: the agent's tasks, each linked to the note.",
          camera: "APP, OUTLINE on Send, then on Tasks.",
          lines: [{ who: "narrator", says: "Send, and your notes become the agent's plan in Tasks, each task pointing back at its note." }], // keep
          seconds: 7.2,
        },
        {
          onScreen: "In real time: the agent at work in the chat, its task ticked off, and the cut's card in the feed turning to v3; the wings drawn as wings.",
          camera: "APP, whole; OUTLINE on the card as it turns to v3.",
          lines: [{ who: "narrator", says: "When it's done, the fix comes back as the next version, on the same card." }],
          seconds: 7,
        },
        {
          onScreen: "The version menu beside the title, outlined; it opens: v3, v2, v1. The pointer picks v2: the planks again. Then v3: feathers. In the swamp, Goose's planks turn to feathers and he flaps, lifting off the mud for a moment.",
          camera: "APP, OUTLINE on the version menu; SWAMP, Goose low against the sky for the flap.",
          lines: [{ who: "narrator", says: "Every version is kept. To go back to one, pick it from the version menu, next to the title." }],
          cues: ["a soft whoomph of feathers"],
          seconds: 8,
        },
      ],
    },
    {
      heading: "06 · Finish it. EXPORT",
      // truth pass (0.1.5): the ⋯ menu at the timeline's right end offers To CapCut only for an item made from footage
      // in raea (item.source); an agent's render has only Show in Finder, so the line says what Export gives and where
      // the file goes, and doesn't promise a CapCut project
      payoff: "Take the film out of raea as a video file, ready for CapCut or any other editor.",
      beats: [
        {
          onScreen: "The film's header, Export outlined; the pointer clicks it: \"Exported to Swamp Goose.mp4\".",
          camera: "APP, OUTLINE on Export, then on the line it leaves.",
          lines: [{ who: "narrator", says: "When it's right, Export, top right, saves the film to your Mac." }],
          seconds: 5,
        },
        {
          onScreen: "The ⋯ at the timeline's right end opens its menu: Show in Finder, outlined; clicked.",
          camera: "APP, OUTLINE on the ⋯, then on Show in Finder.",
          lines: [{ who: "narrator", says: "Show in Finder, under the dots at the end of the timeline, takes you to the file. From there it goes into CapCut, or any editor you like." }],
          seconds: 7,
        },
      ],
    },
    {
      heading: "07 · Set it once. CONTROLLERS",
      payoff: "A controller: settings you'd otherwise repeat in every chat, set once, that every agent reads. What one is, the one Goose's agent made, changing it, making one.",
      beats: [
        {
          onScreen: "The Controllers tab: one controller, Delivery. Outlines on Shape (18:9), Loudness (-14) and Captions as each is named.",
          camera: "APP, OUTLINE on each field as it's named.",
          lines: [
            { who: "narrator", says: "Some choices hold for every film Goose makes: the shape, eighteen by nine; the loudness, minus fourteen; captions on." },
            { who: "narrator", says: "Instead of saying them in every chat, they live in a controller: a panel of settings every agent reads before it starts. Goose's agent made this one when it began." },
          ],
          seconds: 14,
        },
        {
          onScreen: "Goose pecks the Loudness knob and holds on, twisting his whole neck: the knob turns with it, up to -6, its top. In the swamp, the frogs get louder.",
          camera: "APP, OUTLINE on the knob; one cut to the swamp.",
          lines: [{ who: "narrator", says: "Change one, and whatever an agent makes next follows it." }],
          cues: ["the knob's ratchet", "the frogs louder"],
          seconds: 5,
        },
        {
          onScreen: "The knob goes slowly back to -14; the frogs settle.",
          camera: "APP, OUTLINE on the knob.",
          lines: [{ who: "narrator", says: "Goose left loudness at minus fourteen." }], // keep
          seconds: 4,
        },
        {
          onScreen: "The + in the tab's bar; New controller opens: \"Describe what it should decide, in a sentence.\" A sentence typed; Create; the new controller builds itself in.",
          camera: "APP, OUTLINE on the +, then on the form's sentence; whole as it builds.",
          lines: [{ who: "narrator", says: "To make your own, click the plus and describe in a sentence what it should decide. raea builds it as settings you can set." }],
          seconds: 8,
        },
      ],
    },
    {
      heading: "08 · Find your way round a project. THE PANEL'S TABS",
      payoff: "The panel's four tabs, each in a line: Feed, Source, Tasks, Controllers.",
      beats: [
        {
          onScreen: "The panel's tabs, outlined; the pointer clicks each as it's named, and the panel changes with it: Feed's cards; Source, the project's files; Tasks, the plan; Controllers, Delivery.",
          camera: "APP, OUTLINE on each tab and the panel under it.",
          lines: [{ who: "narrator", says: "The panel has four tabs. Feed is the work. Source is everything it's made of. Tasks is the agent's plan. Controllers, its settings." }],
          seconds: 10,
        },
      ],
    },
    {
      heading: "09 · Share it. REVIEW LINKS AND PUBLISH",
      payoff: "Share a review link so others can watch, comment and approve; their reviews come back in Publish.",
      beats: [
        {
          onScreen:
            "Share, beside Export, outlined: its panel opens on Review link. Then the link goes out to the swamp's reviewers: the frog on its stone, the heron in the shallows and the deer by the drum each turn to the giant glass.",
          camera: "APP, OUTLINE on Share and the panel's Review link; then SWAMP, the three reviewers, one quick shot each.",
          lines: [{ who: "narrator", says: "For other people's notes, Share makes a review link. On Pro, anyone can watch, comment on the frame and approve, with no account." }], // keep
          seconds: 10,
        },
        {
          onScreen: "The rail's foot: Publish outlined, clicked; Publish opens on its tabs, Needs you first.",
          camera: "APP, OUTLINE on Publish in the rail, then on its tabs.",
          lines: [{ who: "narrator", says: "Their reviews come back in Publish, at the foot of the rail, with what needs you on top." }],
          seconds: 6,
        },
        {
          onScreen:
            "The heron cranes its neck right out at the glass, a \"!\" over its head (a note); the deer nods, a heart over its head (an approval); the frog looks at the glass a moment longer, and hops off its stone into the water.",
          camera: "SWAMP: the heron, then the deer, each with the glass behind it; then close on the frog.",
          lines: [
            { who: "narrator", says: "The heron had notes. The deer approved." }, // keep
            { who: "narrator", says: "Reviews were mixed.", how: "after the frog's gone" }, // keep
          ],
          cues: ["a heron's croak on its note", "plop"],
          seconds: 7.5,
        },
      ],
    },
    {
      heading: "10 · Teach it your eye. FINGERPRINT",
      payoff: "What a fingerprint is (raea's model of what you look for, learned from your notes and approvals), what an agent does with it (checks its cut before you see it), and where it's made (Settings, on your Mac).",
      beats: [
        {
          onScreen:
            "GRAPHIC over the swamp: this film's notes drift in, each in its own words (\"my wings look like planks\", the heron's \"!\", the deer's heart), and gather into a fingerprint's whorls.",
          camera: "GRAPHIC, over a soft swamp.",
          lines: [{ who: "narrator", says: "Every note you leave teaches raea what you look for: what you flag, and what you approve. Together, that's your fingerprint." }],
          seconds: 8,
        },
        {
          onScreen:
            "GRAPHIC: a new cut's strip; the fingerprint passes along it and marks two moments, each labelled in the note's own words (\"wings look like planks\"); they're fixed, and the strip goes to the feed clean.",
          camera: "GRAPHIC.",
          lines: [{ who: "narrator", says: "Before an agent shows you a cut, it checks it against your fingerprint, and fixes what you'd have flagged. So the same note doesn't come up twice." }],
          seconds: 9,
        },
        {
          onScreen: "Settings, Fingerprint outlined; the page: This Mac, Make it.",
          camera: "APP, OUTLINE on Fingerprint, then on Make it.",
          lines: [{ who: "narrator", says: "It's made here, on your Mac, in Settings, under Fingerprint." }],
          seconds: 5,
        },
        {
          onScreen: "Goose's orange foot comes up and slaps flat on the glass over the Fingerprint page, and lifts away: a muddy webbed print.",
          camera: "From inside the glass, the foot coming at the lens.",
          lines: [{ who: "narrator", says: "Close enough." }], // keep
          cues: ["a wet slap"],
          seconds: 3,
        },
      ],
    },
    {
      heading: "11 · The workflow. THE FINISHED VIDEO",
      payoff: "The whole workflow, once, in the viewer's own steps, over the finished video; where to go next.",
      beats: [
        {
          onScreen: "The finished music video plays on the giant monitor, the first time we see it whole; Goose watches it, bobbing.",
          camera: "SWAMP: low behind Goose, the glass beyond, drifting round him.",
          lines: [{ who: "narrator", says: "That's the workflow. Ask in the chat. Watch it land in the feed. Point at what's wrong, and get the next version. Then ship it." }],
          cues: ["the song comes up as the voice ends"],
          seconds: 10,
        },
        {
          onScreen: "On black: raea's mark, raea.io/docs, and the Discord link.",
          camera: "None.",
          cues: ["one honk, off"],
          seconds: 3.5,
        },
      ],
    },
  ],
});
