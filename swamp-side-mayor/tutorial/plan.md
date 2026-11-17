# Goose Learns raea: lesson plan

The director, 11-16: "forget the mayor of the swamp. just say this is goose": the goose is Goose, by name, and the
project on the glass is Swamp Goose. Then: no mouse, the pointer follows Goose's head (a peck clicks), and a few honks
here and there. Then: the song's hook calls him a duck ("Quack, quack, quack", "You say duck?"), and Goose, a goose,
has no idea: set up in 01, paid off in 11. Goose is he. Then: no sundial; five minutes is the length, never said.

A tutorial of the new raea app (0.1.5), under five minutes, in the music video's swamp. A dry narrator
tells the story of Goose, a goose with other plans, learning the app while he makes his own music video. The lines
and the picture are in `../tutorial.script.ts`; the read sheet `vo.md` is made from it (`python3 -I tools/vo.py`, which
also prints the timing below).

Written with the `tutorial-script` method. The 0.1.1 tutorial (`projects/orientation/tutorial`) runs about 23 minutes
over 21 chapters and teaches the old app (the sidebar, Inbox, the feed's composer). This one keeps its order of work
(make, review, fix, ship, then make it yours) and its single running project, and is rewritten for the new app's
places: the rail, the chat, the panel's four tabs, and the four doors at the rail's foot.

## Who's watching

People who've just installed 0.1.5, or are deciding, and make video with an AI agent. Most never used the old app; some
have cut in a video editor; few read code. Sound on, on YouTube and raea.io/docs.

**The teacher** is the narrator: plain when he teaches (what it is, where it is, what it does), dry when he doesn't.

## The goal

Make a piece in the new app with your own AI, review it, fix it by hand, and ship it.

## Objectives: by the end you can

1. Find your way: the rail, a project, its chat and agent, the panel and its feed.
2. Connect the AI you already pay for, in Connections.
3. Start a project, ask its agent for the work in the chat, stop it, and give it a goal.
4. Open what the agent made, full size, and get back.
5. Pin a note on the exact spot and send it, and find the plan it becomes in Tasks.
6. Get the next version and compare it with the last.
7. Cut the film by hand on its timeline and send your edits.
8. Set a controller, and make a new one in words.
9. Search any tab, look through Source, and find a shot in your libraries by what's in it.
10. Export, share a review link, and find your posts and reviews in Publish.
11. Know where Settings keeps your agents and your fingerprint.

## The running project

**The music video** this project made (`out/goose-v4.mp4`). In the app it is one project, Swamp Goose, with the
cut as one item, versions 2, 3 and 4. The note Goose pins is the real fix between v3 and v4: v3's wings were flat
planks, v4's are drawn wings (`out/tut/wings-close.jpg`, frame 1560 of each). Every step on the glass happens in that
project.

## The words

Six before the first click, all on the glass at once in chapter 01: **rail, project, chat, agent, panel, feed**. The rest
arrive where they're first used: goal (03), item (04), note, Edit and Note, Tasks, version, Compare (05), timeline,
Blade, edits (06), controller (07), Source, library (08), review link, Publish (09), fingerprint (10).

## Sequence

| # | Chapter | Obj. | Opens with (why you'd want it) | Double taps | The gag, and what it teaches |
|---|---|---|---|---|---|
| 00 | Cold open | | Goose will make a music video, and learn the app on the way | | Goose walks away, and comes back in his own time |
| 01 | The map | 1 | where everything is | | the pointer follows Goose's head and a peck clicks, never explained (the pointer is real); a duck in the rail ("DUCK?") shows the emoji watching the pointer, and sets up that Goose doesn't care for ducks |
| 02 | Connect your AI | 2 | the agent needs an AI | rail ("the foot of the rail") | four stone doors are the rail's four; Goose takes the wrong one |
| 03 | Start the project | 3 | ask for what you want | rail, chat, agent | the goose emoji; /goal honk, then /goal every shot has me in it |
| 04 | Open what comes back | 4 | the work arrives | feed | full size is big enough to frighten a goose into the water |
| 05 | Point at it | 5, 6 | by v3 the wings are still planks | panel (its Tasks tab) | Goose's own wings are planks until v4 lands |
| 06 | Fix it yourself | 7 | quicker by hand | Edit (as "edits"), chat | the shot without Goose goes, per its goal; ⌘Z not pressed |
| 07 | Decide once | 8 | stop repeating yourself | agent | loudness cranked; the narrator repeats himself until it's back at -14 |
| 08 | Find anything | 9 | where's that shot | the doors, agent, chat | a lot of goose in Source; the library's sentence is "mine." |
| 09 | Ship it | 10 | done | the doors, note (comment on the frame) | the swamp's first review: a frog leaves |
| 10 | Make it yours | 11 | your own agents and eye | agent, note | a footprint for a fingerprint |
| 11 | The loop | | the loop, in four steps; the finished video, whole for the first time | chat, feed, timeline, Publish | the hook is about a duck and Goose nods along, a goose who has never wondered what he is; Goose cuts the narrator off |

**Order test.** No chapter uses a word or control an earlier one hasn't shown:
- The rail and its foot are shown in 01; the doors (02) are named from it before any of them is used.
- The chat is met in 01 and used for real in 03. The panel is met in 01 and its other tabs open in 05 (Tasks),
  07 (Controllers) and 08 (Source).
- Note and Edit are taught in 05 before "your edits" in 06.
- The version is named on the glass ("v3") in 05's first beat and explained two lines later.
- Libraries is first a door in 02 (the wrong one) and taught in 08: the setup is a joke, not a use.

**Timing** (tools/vo.py): 4:50.0, 610 words, 2.10 words a second over the whole, every chapter
near 2.3 or under with its gags' silent beats counted (08 is the fullest, at 2.33). A measured read is about 2.3. The
margin under five minutes is 10.0 s: if the recorded read runs long, 08's "There's a lot of goose in it" goes first.

| at | secs | words | chapter |
|---|---|---|---|
| 0:00 | 18.5 | 33 | 00 Cold open |
| 0:18 | 28.5 | 58 | 01 The map |
| 0:47 | 19.5 | 40 | 02 Connect your AI |
| 1:06 | 32.5 | 72 | 03 Start the project |
| 1:39 | 16.0 | 34 | 04 Open what comes back |
| 1:55 | 36.0 | 82 | 05 Point at it |
| 2:31 | 25.5 | 52 | 06 Fix it yourself |
| 2:56 | 24.5 | 53 | 07 Decide once |
| 3:21 | 27.5 | 64 | 08 Find anything |
| 3:48 | 20.0 | 44 | 09 Ship it |
| 4:08 | 12.5 | 26 | 10 Make it yours |
| 4:21 | 29.0 | 52 | 11 The loop |

## Left out, on purpose (the cheat sheet and the docs keep them)

Everything, Edit workspace, nesting a project by dragging it onto another, the session pill and + for a second agent in
a project, voice in the chat's box, a session from the terminal as a dashed slot, the ⓘ help on a controller, the
timeline's Add menu, magnet and keyframes, the right-click menu on pictures and video, connecting a library (Add), Google
Drive, Pro's search across Macs, posting to networks. Each is one line in a cheat sheet beside the film. Five minutes
holds the loop and one door each; these don't change whether a viewer can make, review, fix and ship.

## Truth

Every label and behaviour the narrator names was read in the 0.1.5 app's source and docs (`~/raea-014/apps/app`:
`docs/shell.md`, `src/plugins/catalog.ts` for Connections' Agents list, `src/share/LinkPanel.tsx` and
`src/publish/Reviews.tsx` for review links, and the 0.1.5 release notes for /goal, notes becoming a plan, and Libraries).
Before previz, each is captured from raea's own window in a scratch workspace. These need the take to confirm:

- The goose emoji (U+1FABF) is in raea's 3D emoji library, and a duck (U+1F986) for the rail's gag.
- The film item's timeline takes a Blade cut and a delete on the music video, and shows "Send 2 edits".
- A Delivery controller draws Loudness as a knob, Shape as a selector, Captions as a switch, with its lamp.
- The notes rail shows Edit | Note for an item whose agent takes edits.
- Libraries' search answers "a goose in the mud" with Goose's frames and a video's moment, once the renders are in
  a library.
- Connections lists Claude and ChatGPT under Agents with Connect, then "Signed in".
- /goal's line sits over the composer.

If one isn't so, the line changes to what the app does, not the other way round.

## Open

- **Narrator.** A dry British read, our own character, on local TTS (Pocket TTS) or a recorded read. Not a clone of
  any actor. Samples of chapter 00 for each voice go to the director before previz.
- **The goose's licence** (plan task t-dul05m0j) is still open: it gates posting, not making.
- **Shape**: 16:9 1920x1080 is assumed for YouTube and the docs; the music video was 18:9.
