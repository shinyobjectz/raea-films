import { script } from "raea/brief";

// The tutorial of the new raea app (0.1.5), in the music video's swamp: v7, after the director's notes on the finished cut
// a feed post, 11-16): "this is a tutorial, so don't bring up emojis watching your pointer; close-ups of the
// platform when relevant, or cut to a full screen of the app when it's important to see; much more helpful camera
// angles; make sure it stays on track and doesn't just mention a bunch of things in an order. It should be educational."
//
// What changed from v6 (tutorial.script.ts):
// - No emoji anywhere a note: the pointer-watching rail, the duck and "A goose. Bold." are gone.
// - Every chapter is a step of making Goose's music video, and opens on why he needs it: an AI to run on, a project to
//   ask in, the work to look at, a note, a fix by hand, a setting made once, a shot found, the film shipped.
// - Each teaching line is what you press, where, and what happens. Lines that named things in a row are gone: the emoji
//   that watch the pointer and the duck that doesn't, Command-backslash, the libraries (the scratch app can't show one
//   without this Mac's own folders), "your own agents", Publish as a list of what it keeps.
// - The camera field marks every beat's picture. APP FULL: the capture fills the frame, so the whole app is readable.
//   CLOSE: pushed in on the control the line names, the pointer on it as it's used. SWAMP: Goose's world. The giant
//   monitor carries the app only in SWAMP shots; it never stands in for a teaching shot.
// - The cold open is restaged around Goose (same lines): we follow him in, and nothing holds once he's gone.
// Lines marked "v7" in a comment are new and need a re-read; the rest keep their approved takes.
//
// The pointer follows Goose's head, and a peck is a click; nobody mentions it.
export default script({
  title: "Goose Learns raea",
  logline:
    "A dry narrator walks Goose, a goose with other plans, through the new raea app from start to finish, while he makes his own music video.",
  scenes: [
    {
      heading: "00 · Cold open. EXT. THE SWAMP, MORNING",
      payoff: "Who Goose is, who the narrator is, and the deal: a music video made, and the whole app learned on the way. The first laugh before the first lesson.",
      beats: [
        {
          onScreen:
            "Goose walks along the mud toward the giant keyboard, the beige computer beyond it, its screen dark. A purposeful walk: head forward on each step, tail going.",
          camera: "SWAMP: following Goose in, low, behind and to one side of him, keeping pace; the keyboard and the computer grow ahead of him.",
          cut: "opens in motion",
          lines: [{ who: "narrator", says: "This is Goose. Today, Goose will make a music video." }],
          seconds: 6,
        },
        {
          onScreen: "At the keyboard Goose turns to the lens and strikes a star's pose, wings out. Behind him the glass wakes: the app's dark window.",
          camera: "SWAMP: medium, a little low, Goose and the waking glass both in frame.",
          cut: "cut on the wings opening",
          lines: [{ who: "narrator", says: "And learn the new raea app on the way, from start to finish." }],
          seconds: 4.6,
        },
        {
          onScreen: "Goose turns his back on the computer and waddles off toward the water.",
          camera: "SWAMP: wide and side-on, so he walks across the frame; cut as he reaches its edge.",
          lines: [{ who: "narrator", says: "Goose walked to the computer." }],
          seconds: 3.9,
        },
        {
          onScreen: "At the water's edge Goose stops, and looks back over his shoulder at the lens.",
          camera: "SWAMP: low on the bank, nothing between the lens and Goose; the computer far behind him.",
          lines: [{ who: "narrator", says: "To the computer.", how: "flat" }],
          cues: ["a frog, once"],
          seconds: 5,
        },
        {
          onScreen: "A honk. He waddles back to the computer, taking his time about it.",
          camera: "SWAMP: tracking beside him as he waddles back, the computer growing behind him.",
          lines: [{ who: "narrator", says: "Thank you.", how: "dry" }],
          cues: ["honk"],
          seconds: 3,
        },
      ],
    },
    {
      heading: "01 · Find your way. THE APP",
      payoff: "Objective 1: the three parts you'll use all film: the rail (projects), a project's chat (where you ask its agent), its feed (where the work lands). Each named as it's shown, close.",
      beats: [
        {
          onScreen: "Goose steps up to the glass and cocks his head; on the glass the pointer swings with it.",
          camera: "SWAMP: over Goose's shoulder, his head and the glass in frame; cut to APP FULL.",
          cut: "cut from the glass to the app full-screen",
          cues: ["a small curious honk"],
          seconds: 3,
        },
        {
          onScreen: "The app, Everything open. The rail down the left; the pointer runs down it, each project's name showing as it passes.",
          camera: "APP FULL, then CLOSE on the rail as the pointer runs down it.",
          // v7
          lines: [{ who: "narrator", says: "The app has three parts. Down the left, the rail: your projects." }],
          seconds: 6,
        },
        {
          onScreen: "A peck on a project: it opens to its chat, the box at the bottom waiting.",
          camera: "APP FULL as it opens, then CLOSE on the chat box.",
          // v7
          lines: [{ who: "narrator", says: "Open one, and in the middle is its chat, where you ask its agent, the AI doing the work, for what you want." }],
          seconds: 8.9,
        },
        {
          onScreen: "The panel on the right, Feed lit, its cards.",
          camera: "CLOSE on the panel, Feed's tab and its cards.",
          // v7
          lines: [{ who: "narrator", says: "On the right, its feed. Everything the agent makes lands there." }],
          seconds: 5.7,
        },
      ],
    },
    {
      heading: "02 · Connect your AI. THE THREE DOORS",
      payoff: "Objective 2: connect the AI you already pay for, in Connections. Sets up the three doors for later.",
      beats: [
        {
          onScreen: "On the bank, three stone doorways in a row, each lettered on its lintel: PUBLISH, CONNECTIONS, SETTINGS. Goose comes into frame in front of them.",
          camera: "SWAMP: wide enough for all three doors, Goose entering.",
          // v7
          lines: [{ who: "narrator", says: "First, the agent needs an AI to run on: the one you already pay for, like Claude or ChatGPT." }],
          seconds: 7.7,
        },
        {
          onScreen: "On the glass, the same three doors at the rail's foot, the pointer on Connections.",
          camera: "CLOSE on the rail's foot: its three icons and the pointer.",
          // v7
          lines: [{ who: "narrator", says: "You connect it behind the second of three doors at the foot of the rail. Goose went through Connections." }],
          seconds: 7.7,
        },
        {
          onScreen: "Goose goes through SETTINGS. A beat of empty doorway. He comes back out, and goes through CONNECTIONS.",
          camera: "SWAMP: locked off on the doors, the one place the camera stands still, because the stillness is the joke.",
          lines: [{ who: "narrator", says: "Goose went through Connections.", how: "patiently" }],
          seconds: 4.2,
        },
        {
          onScreen: "Connections, its Agents rows: Claude, ChatGPT, Kimi, Gemini. Goose pecks Connect on Claude; its sign-in opens beside it.",
          camera: "APP FULL on Connections, then CLOSE on the Claude row as Connect is pressed and its sign-in opens.",
          // v7
          lines: [{ who: "narrator", says: "Under Agents, press Connect on yours, and sign in with your own account." }],
          seconds: 6,
        },
      ],
    },
    {
      heading: "03 · Ask for it. THE CHAT",
      payoff: "Objective 3: make a project, pick its AI, ask for the work in the chat, see what's running, stop it, and set a goal.",
      beats: [
        {
          onScreen: "The + in the rail; New project; \"Swamp Goose\" typed; Make. The new project lands in the rail, and opens.",
          camera: "CLOSE on the +, then on the new project's form as the name goes in and Make is pressed; CLOSE on the rail's new tile.",
          // v7 (no emoji: the director, 11-16, a note, "dont comment on emojis or watching your pointer")
          lines: [{ who: "narrator", says: "Goose's video needs a project. The plus in the rail makes one: give it a name, and press Make." }],
          seconds: 8.3,
        },
        {
          onScreen:
            "Under the box, Pick an AI: Kimi picked. Then Goose stomps out the line on the giant keyboard, key by key; the box fills: \"make me a music video. me, in a swamp, summoning ancient magic\". Return, stomped with both feet.",
          camera: "CLOSE on the AI picker under the box; SWAMP over the keys with Goose; CLOSE on the box as it fills, cutting shorter as he types.",
          cut: "cut on the stomps",
          // v7
          lines: [{ who: "narrator", says: "Under the box, pick the AI to run it. Then say what you want, the way you'd tell a person, and send." }],
          cues: ["a clack a stomp", "Return: one heavy clack"],
          seconds: 8,
        },
        {
          onScreen: "The agent's answer arriving; \"1 running\" folded over the box; the pointer on Stop beside Send.",
          camera: "CLOSE on the box: \"1 running\" over it, Stop beside Send.",
          // v7
          lines: [{ who: "narrator", says: "While it works, what it's running shows over the box. If it wanders, Stop is right beside it." }],
          seconds: 7.6,
        },
        {
          onScreen:
            "Goose types \"/goal honk\". A beat. He stomps Delete until it's gone, and types \"/goal every shot has me in it\". The goal settles over the box.",
          camera: "CLOSE on the box, large; one cut to Goose's foot on Delete.",
          lines: [
            // v7
            { who: "narrator", says: "To keep it going until the job's really done, type slash goal and a condition. It works until that's true." },
            { who: "narrator", says: "\"Honk\" is not a condition." },
            { who: "narrator", says: "That is.", how: "after the second goal lands" },
          ],
          cues: ["after \"not a condition\": Goose honks at the narrator, once, in protest"],
          seconds: 11.9,
        },
      ],
    },
    {
      heading: "04 · See what it made. THE FEED",
      payoff: "Objective 4: work arrives in the feed as items; an item opens full size, and Back returns you where you were.",
      beats: [
        {
          onScreen: "Cards landing in the feed: the stills, the first cut, version two.",
          camera: "CLOSE on the feed as each card lands.",
          // v7
          lines: [{ who: "narrator", says: "What the agent makes lands in the feed: stills, cuts, and questions it needs you to answer." }],
          cues: ["a soft drip for each card"],
          seconds: 6.7,
        },
        {
          onScreen: "Goose pecks the cut's card; it grows to full size over the chat and the panel.",
          camera: "APP FULL as the item grows; then SWAMP, the whole monitor, Goose's own face giant on it.",
          lines: [{ who: "narrator", says: "Press one, and it opens full size." }],
          seconds: 3.2,
        },
        {
          onScreen: "Goose, face to face with himself, backs up, and backs straight into the water. The music video's crown splash.",
          camera: "SWAMP: side-on, low, the monitor's face and Goose's both in frame.",
          cues: ["the splash, then a single drip"],
          seconds: 2.5,
        },
        {
          onScreen: "Esc (sticker): the item shrinks back to its card; the chat and panel just as they were.",
          camera: "APP FULL.",
          lines: [{ who: "narrator", says: "Escape, or Back, takes you back to where you were." }],
          seconds: 4.2,
        },
      ],
    },
    {
      heading: "05 · Point at what's wrong. VERSION THREE",
      payoff: "Objectives 5 and 6: pin a note on the exact spot and send it; see it become the agent's tasks; get the next version and compare.",
      beats: [
        {
          onScreen: "The cut at version 2 (the picker says v2) at 0:58, Goose spread-winged over the keyboard: flat planks for wings. In the swamp, Goose flaps his own: planks, and they clack.",
          camera: "APP FULL on the picture, pushing in on the wings; then SWAMP, Goose medium, the planks filling the frame's width.",
          lines: [{ who: "narrator", says: "By version two, the wings were still planks." }],
          cues: ["two wooden clacks"],
          seconds: 4,
        },
        {
          onScreen: "Goose pecks Comment, then pecks right on the wing in the picture; a pin; the box: \"my wings look like planks\".",
          camera: "CLOSE on Comment, then on the wing as the pin lands and the note is typed.",
          lines: [{ who: "narrator", says: "Goose pressed Comment, clicked on the wing, and said so." }],
          seconds: 5,
        },
        {
          onScreen: "The notes rail: the note under its anchor chip, Edit | Note above it, Edit on.",
          camera: "CLOSE on the notes rail: Edit | Note.",
          lines: [{ who: "narrator", says: "That's a note, pinned to the exact spot. Edit sends it to the agent; Note keeps it for you." }],
          seconds: 7.6,
        },
        {
          onScreen: "Send. The chat: the note as it went to the agent. The panel goes to Tasks: the agent's tasks, each linked to the note.",
          camera: "CLOSE on Send; then APP FULL as the chat and Tasks fill; CLOSE on Tasks.",
          lines: [{ who: "narrator", says: "Send, and your notes become the agent's plan in Tasks, each task pointing back at its note." }],
          seconds: 7.2,
        },
        {
          onScreen: "The item's version picker: v3. Compare, on the film's toolbar: a wipe from v2's planks to v3's drawn wings. In the swamp the planks pop into feathers; Goose flaps and lifts clear of the mud for a moment.",
          camera: "CLOSE on the version picker and Compare; APP FULL for the wipe; SWAMP, Goose low against the sky for the flap.",
          cut: "match the wipe's edge to the wing's",
          lines: [{ who: "narrator", says: "The fix comes back as the next version. Compare, up top, wipes between them." }],
          cues: ["a soft whoomph of feathers"],
          seconds: 7.5,
        },
        {
          onScreen: "Goose lands, pleased with himself.",
          camera: "SWAMP: medium, Goose settling.",
          lines: [{ who: "narrator", says: "The old one stays, in case you miss the planks." }],
          cues: ["one proud honk, before the line"],
          seconds: 4,
        },
      ],
    },
    {
      heading: "06 · Fix it by hand. THE TIMELINE",
      payoff: "Objective 7: play, blade and remove a clip by hand, undo, and send the edits as done.",
      beats: [
        {
          onScreen: "The film full size, the timeline under the picture, its one row of tools.",
          camera: "APP FULL; then CLOSE on the timeline as Space plays it.",
          lines: [{ who: "narrator", says: "Some fixes are quicker by hand. Under every film is its timeline. Space plays it." }],
          seconds: 7.4,
        },
        {
          onScreen:
            "The playhead stops on the one shot with no goose in it: the frog's. B (sticker), the Blade lit: a cut at each end; the clip picked; Delete; the track closes up. In the swamp, Goose stomps once a cut.",
          camera: "CLOSE on the timeline at the frog's clip, the blade's cuts and the gap closing; one cut to Goose's stomping foot.",
          cut: "cut on the stomps",
          lines: [
            { who: "narrator", says: "B is the blade. Goose found the one shot without Goose in it," },
            { who: "narrator", says: "and removed it." },
          ],
          cues: ["a snip a cut", "a stomp a cut"],
          seconds: 7.5,
        },
        {
          onScreen: "Goose's foot hovers over ⌘Z on the giant keyboard. And puts it down somewhere else.",
          camera: "SWAMP: close on the foot over the keys.",
          lines: [
            { who: "narrator", says: "Command-Z would undo that." },
            { who: "narrator", says: "He won't.", how: "after a beat" },
          ],
          seconds: 4.5,
        },
        {
          onScreen: "\"Send 1 edit\" in the timeline's bar; Goose pecks it; the edits arrive in the chat, and the agent's reply.",
          camera: "CLOSE on Send in the bar, then on the chat as the reply comes.",
          lines: [{ who: "narrator", says: "Send hands your edits to the agent as done, and it carries on from them." }],
          seconds: 5.1,
        },
      ],
    },
    {
      heading: "07 · Set it once. CONTROLLERS",
      payoff: "Objective 8: what you'd repeat on every piece is set once, in a controller every agent reads; set one; make a new one in words.",
      beats: [
        {
          onScreen: "The Controllers tab, the rack. One module, Delivery: Shape on 18:9, a Loudness knob at -14, a Captions switch.",
          camera: "APP FULL on the rack; then CLOSE on Delivery's Shape and Loudness.",
          lines: [
            // v7
            { who: "narrator", says: "Goose wants every cut delivered the same way: eighteen by nine, at minus fourteen loudness." },
            // v7
            { who: "narrator", says: "So he set it once, in a controller: settings every agent reads before it starts." },
          ],
          seconds: 13.6,
        },
        {
          onScreen: "Goose pecks the Loudness knob and holds on, twisting his whole neck: the knob turns with it, up to -6, its top. In the swamp, the frogs get louder.",
          camera: "CLOSE on the knob; one cut to the swamp.",
          lines: [{ who: "narrator", says: "Goose left loudness at minus fourteen." }],
          cues: ["the knob's ratchet", "the frogs louder"],
          seconds: 4,
        },
        {
          onScreen: "The knob goes further. Then, slowly, back to -14; the frogs settle.",
          camera: "CLOSE on the knob.",
          lines: [{ who: "narrator", says: "Goose left loudness at minus fourteen.", how: "the same words, slower" }],
          seconds: 5,
        },
        {
          onScreen: "New controller, in the tab's bar: a line typed, and a new module builds itself into the rack.",
          camera: "CLOSE on New controller and the line typed; APP FULL as the module builds into the rack.",
          // v7
          lines: [{ who: "narrator", says: "To make your own, press New controller and describe it in words. The agent builds it." }],
          seconds: 6.7,
        },
      ],
    },
    {
      heading: "08 · Find a shot. SOURCE",
      payoff: "Objective 9: slash searches the tab you're on; Source is everything the project is made of. (Libraries are left to the docs: the scratch app can't show one without this Mac's own folders.)",
      beats: [
        {
          onScreen: "/ (sticker): the panel's search opens, its cursor waiting.",
          camera: "CLOSE on the panel's search as / opens it.",
          // v7
          lines: [{ who: "narrator", says: "To find anything in a project, press slash. It searches the tab you're on." }],
          seconds: 5.7,
        },
        {
          onScreen: "Source: its chips (All, Files, Images, 3D). \"goose\" typed: a long list.",
          camera: "CLOSE on the search as \"goose\" is typed; then on the list, scrolling.",
          // v7
          lines: [{ who: "narrator", says: "Goose searched Source, everything his video is made of, for goose. There's a lot of goose in it." }],
          seconds: 8.5,
        },
      ],
    },
    {
      heading: "09 · Ship it. EXPORT AND SHARE",
      payoff: "Objective 10: export the film; share a review link so others can watch, comment and approve; their reviews come back in Publish.",
      beats: [
        {
          onScreen: "The film's header; Goose pecks Export.",
          camera: "CLOSE on the film's header: Export.",
          lines: [{ who: "narrator", says: "Done? Export is at the top of the film." }],
          seconds: 3.8,
        },
        {
          onScreen:
            "Share, beside Export: its panel opens on Review link. Then the link goes out to the swamp's outside reviewers: the frog on its stone, the heron in the shallows and the deer by the drum each turn to the giant glass as \"anyone\" is said.",
          camera: "CLOSE on Share and the panel's Review link tab; then SWAMP, the three reviewers, one quick shot each, each looking up at the glass.",
          // v7
          lines: [{ who: "narrator", says: "For other people's notes, Share makes a review link. On Pro, anyone can watch, comment on the frame and approve, with no account." }],
          seconds: 10,
        },
        {
          onScreen: "Goose through PUBLISH. On the glass: Publish, its tabs (All, Needs you, Scheduled, Posted, In review).",
          camera: "SWAMP: the doorway; then CLOSE on Publish's tabs, Needs you and In review.",
          // v7
          lines: [{ who: "narrator", says: "Their reviews come back behind the first door, Publish, with what needs you on top." }],
          seconds: 6,
        },
        {
          onScreen:
            "Its first reviews: the heron cranes its neck right out at the glass, a \"!\" over its head (a note on the frame); the deer nods, a heart over its head (an approval); the frog looks at the glass a moment longer, and hops off its stone into the water.",
          camera: "SWAMP: the heron, then the deer, each with the glass behind it; then close on the frog.",
          lines: [
            { who: "narrator", says: "The heron had notes. The deer approved." },
            { who: "narrator", says: "Reviews were mixed.", how: "after the frog's gone" },
          ],
          cues: ["a heron's croak on its note", "plop"],
          seconds: 7.5,
        },
      ],
    },
    {
      heading: "10 · Make it yours. SETTINGS",
      payoff: "Objective 11: raea learns your eye from your notes; Settings, Fingerprint is where it's made, on your Mac.",
      beats: [
        {
          onScreen: "Goose through SETTINGS, on purpose this time. On the glass: Settings; Fingerprint: This Mac's checks, and Make it.",
          camera: "SWAMP: the doorway; then CLOSE on the Fingerprint page: This Mac, Make it.",
          // v7
          lines: [{ who: "narrator", says: "Every note you leave teaches raea your eye. In Settings, Fingerprint makes it, here on your Mac." }],
          seconds: 7.8,
        },
        {
          onScreen: "Goose's orange foot comes up and slaps flat on the glass over the Fingerprint page, and lifts away: a muddy webbed print.",
          camera: "From inside the glass, the foot coming at the lens.",
          lines: [{ who: "narrator", says: "Close enough." }],
          cues: ["a wet slap"],
          seconds: 3,
        },
      ],
    },
    {
      heading: "11 · The loop. THE FINISHED VIDEO",
      payoff: "The close, in the viewer's terms: the whole loop in four steps, and the finished music video at last. Goose, a goose, has made a music video about a duck, and will never know. Goose gets the last word.",
      beats: [
        {
          onScreen: "The finished music video plays on the giant monitor, the first time we see it whole; Goose dances in front of it.",
          camera: "SWAMP: low, Goose and the glass beyond, drifting round him.",
          lines: [{ who: "narrator", says: "That's the loop. Say it in the chat. Point at it in the feed. Fix it by hand. Ship it." }],
          cues: ["the song comes up as the voice ends"],
          seconds: 8,
        },
        {
          onScreen: "The finished video reaches its hook: \"Who's got the mud feet? Quack, quack, quack.\" Goose, wings out, mouths every quack with total conviction.",
          camera: "SWAMP: medium on Goose, the glass behind him, holding on his face.",
          cut: "cut on the first quack",
          cues: ["the song's hook up full, nothing over it", "the narrator waits for the last quack"],
          seconds: 3.5,
        },
        {
          onScreen: "Goose dances on, delighted, to a song about a duck. In the gap after \"Goose is a goose\", the lyric \"You say duck?\" comes through; Goose nods along, hard: yes. Not a flicker of doubt.",
          camera: "SWAMP: a slow push in on Goose's face as he bobs, the glass soft behind him.",
          lines: [
            { who: "narrator", says: "It's a song about a duck." },
            { who: "narrator", says: "Goose is a goose.", how: "a beat after" },
            { who: "narrator", says: "Goose has never once wondered what he is. It's saved him a great deal of time." },
          ],
          cues: ["the song under the voice, and up in the gaps", "\"You say duck?\" lands in the gap after \"Goose is a goose\""],
          seconds: 11.6,
        },
        {
          onScreen: "Goose, still nodding, stomps the giant power key. Black.",
          camera: "SWAMP: close on Goose and the key.",
          cut: "hard cut to black on the stomp",
          lines: [{ who: "narrator", says: "Goose would now like to thank—" }],
          cues: ["the stomp, the song cut dead"],
          seconds: 3,
        },
        {
          onScreen: "On black: raea's mark and raea.io/docs.",
          camera: "None.",
          cues: ["one honk, off"],
          seconds: 2.5,
        },
      ],
    },
  ],
});
