# FLOOR3 — game design

A first-person liminal horror game, about an hour long, in five chapters, made in raea engine. Chapter One, "AFK", is
the 5:00 playthrough in `out/floor3.mp4`. This document covers the whole game; the playthrough is its opening, built
and played as the real thing.

## The pitch

You wake up face down on your desk on Floor 3 of a 1990s office tower. It's 11:52 PM. The floor is empty and the
lights are on sensors. Where your hands should be there are cursors: an arrow while you look around, a pointing hand
over something you can use, a grabbing hand when you hold something, resize arrows on an edge you can drag, and an
hourglass while the building thinks. A voicemail from Dana in IT explains the one rule: don't stand still. When the
floor thinks nobody's there, it goes to sleep, and when it sleeps, something else wakes up.

You aren't awake. You're AFK: your body is still slumped at the desk, and what walks the floor is your presence,
the part the building counts as occupancy. The thing in the dark wants out of the building. It can't leave by
itself, but someone present can open a door for it.

## The twist (Chapter One, inside five minutes)

Dana's messages guide you east to the stairwell: a voicemail, a tape in the copy room, Dana's badge left on the
desk. Two things go wrong along the way:

1. **The photocopy.** The copier starts by itself and prints one page: a photo of your desk with your own body
   slumped at it, sent from Dana's extension at 11:52 PM. The game never explains it. The player keeps walking.
2. **The real Dana.** At the stairwell door the lobby phone rings, and the answering machine screens a frantic call:
   "If you've been getting messages from me, they are not from me. I never left any messages. It uses my voice. It
   walks you to the door, because the door is where it—" The line goes dead.

Every message you followed was the thing, in Dana's voice, leading you to the one door it can't open alone.

## The ending (Chapter One's cliffhanger)

Right behind your head, in Dana's voice, close and low: "Keep moving." The corridor's lights die one by one from the
far end. The wing's lights strike in a line toward you, set off by something you can't see. The lobby tube blows,
the exit sign goes dark, and the controls stop answering. In the black, at your left ear: "There you are." A system
dialog comes up in the dark: **Floor 3 — Are you still there? [Yes] [No]**. A pointer that isn't yours slides in from
the corner and clicks **Yes**. FLOOR3: end of Chapter One, AFK.

The question the player is left with: if it can answer for you, who is still at the desk?

## Structure: about an hour

| Chapter | Place | Length | What it's about |
|---|---|---|---|
| 1. Floor 3 | The bay, the corridor, the copy room, the unfinished east wing, the lobby | 5–8 min | Learn the rule and the cursor hands; follow Dana's messages; the photocopy; the real call; the door. |
| 2. Presence | Floor 3 again, from the pointer's side | 10–12 min | You come to as the arrow on a screen: a 1990s desktop on your own monitor, the floor seen through the building's cameras as windows you drag, resize and close. The thing is walking your body. You drag doors shut on it, resize corridors to cut it off, and learn the other floors are on the same system. |
| 3. Occupancy | Floors 4–7: payroll, a carpeted call centre, a mothballed cafeteria, a records floor | 15–18 min | Each floor has its own idle rule (the call centre sleeps if no phone is answered; records sleeps when you stop reading). Find the real Dana, alive in the stairwell between floors, who no longer knows which floor she's on. |
| 4. Maintenance | The plant floor, the lift shafts, the building management system | 12–15 min | Learn what the building is: an occupancy system that keeps people present, and keeps them. The thing is what it grew to fill empty floors. Shut down the floors one at a time, which puts out the light you need. |
| 5. Log off | Floor 3, your desk | 6–8 min | Get back to your body before the thing walks it out the lobby door. The last choice is the dialog from Chapter One, answered by you this time. Yes keeps you in the building, awake. No logs you off; the credits roll over your empty chair. |

## Core mechanics

- **Idle and sleep.** Every floor has an idle timer. Stand still (reading included) and the lights go out from the
  farthest fixture inward, the air handling spins down, and the hum sags in pitch. The thing comes up from the dark
  in proportion to how deep the sleep is. Any movement wakes the floor; tubes strike back one at a time, and the one
  that strikes first shows what was standing in the dark. Reading a document is the main temptation to stand still.
- **Cursor hands.** The hand is the interface. It shows what you can do before you do it: the arrow is idle, the link
  hand is press, the grab hand is take, resize arrows are drag, and the hourglass is busy, which means hands off while
  the building works. The hand reaches out toward what it's over, with its hotspot on the thing, and pulls in near
  walls so it never enters geometry.
- **Resize.** Some edges (door openings, partitions, later whole corridors) can be dragged wider or narrower. Dragging
  is slow and loud: the wall strains as it moves. In Chapter One it widens the copy room's doorway; later it cuts off
  the thing's route, or traps you.
- **Sensors.** In unfinished spaces the lights only come on for things that move. Your lights strike in tune. Its
  lights strike out of tune, and they come on where you aren't.
- **Papers and tapes.** Notices, printouts, tapes and voicemails carry the story. A paper is held up full screen for
  at least as long as its words take to read, and the floor keeps sleeping while you read it.
- **Doors and badges.** Doors are the only things the thing cannot do itself. Every unlock you earn is one it can use.

## The monster

Two metres tall, thin, hunched, with arms that hang past its knees and a head fallen to one side. It's built from the
same office as everything else: grey, dressed in what was left on the floor. It's rarely seen and mostly heard. It
breathes, it walks barefoot on carpet, it uses Dana's voice, and it sets off sensors. Its rules:

- It moves only while the floor sleeps, or in the dark beyond the sensors.
- It's never seen in the same place twice, and never closer than four metres until the end of a chapter.
- It speaks only in voices it has heard on the building's phones.

## Look

- **Liminal office, 1990s.** Beige walls, grey carpet tiles, drop ceilings with 2×4 troffers, CRT monitors,
  partitions, an unfinished wing of bare concrete and columns with carpet rolls left by the fitters. Rooms are a
  little too long and a little too empty, and the doors are closed. The references are backrooms photography,
  empty-office-at-night photography and real 1990s office catalogues.
- **Light is the threat.** The only light comes from fixtures, which are real emissive lights in the path tracer
  (Solari, with ReSTIR and three bounces, so the bounce off the beige holds steady from frame to frame): pools under
  each troffer, black between them. Walls are clean painted drywall; a stained texture under traced light reads as
  blotchy light. Sleep takes the light away. Darkness is never total: the dying tube spasms, the exit sign glows, a
  CRT stays lit.
- **Real camera.** The view is a head: walk bob, strafe lean, look sway in the hand. There's no motion blur, the game
  runs at 60 fps, and the only post effects are tone mapping, a little bloom and a slight vignette. Mouse look is raw
  input at a fine count (a 3200-count mouse at a low sensitivity), so a slow turn moves evenly every frame.
- **Boot.** The game opens on raea engine's splash: the mark strikes like one of the floor's tubes over a ballast's
  hum, "MADE IN RAEA ENGINE" under it, then the title, FLOOR3, over the corridor.

## Sound

Everything is placed in 3D around the player's head (binaural, with interaural delay, head shadow, distance and air
absorption, and walls muffling what's behind them) and in the reverb of the room it's in.

- **The building is the score.** Every lit ballast hums at 120 Hz with its overtones, each a fraction of a hertz
  off the next, so the floor beats slowly. The score is that hum series on 60 Hz (the 2nd, 3rd, 4th and 5th
  harmonics calm, with the 7th, 11th and 13th coming in with fear) and it sags in pitch when the floor sleeps. Lights
  striking back sing notes from the same series. Your sensors strike in tune, and its sensors strike a beating
  minor second. The phone's two ring tones are the theme. The score cuts out completely when Dana says the messages
  weren't from her, and doesn't come back until the lights start dying.
- **Silence as a mechanic.** When the floor sleeps the air handling spins down with it, and what's left is the
  clocks, your breath and whatever is breathing in the dark.
- **Voices through things.** Voicemails play through a desk phone's speaker, the tape through a cassette recorder
  (with wow, flutter and hiss), and the real call through an answering machine's speaker. The thing's own lines are
  dry and close behind the head, pitched down, with an octave-down layer under them.
- **Captions** are timed to the recorded words, and never shorter than their words take to read (0.3 s a word, at
  least a second): a caption too short to read joins the next one, and a line cut off mid-word keeps its last caption
  up until it can be read. The hand's prompts hold the same way: a prompt comes up when the cursor is on a thing (or,
  at arm's length, nearly on it), stays up at least its reading time, and the next one waits for it. Every piece of
  type stays out of the top and bottom 140 px of the frame, where a player's controls and title sit.

## Chapter One, beat by beat (the playthrough)

| Time | Beat |
|---|---|
| 0:00 | The engine's splash: Made in raea engine. |
| 0:03 | Title screen, FLOOR3, over the corridor; a phone rings far off. New Game. |
| 0:08 | Wake at the desk; the bay's lights strike one by one. Look around: arrow hands. |
| 0:23 | Step away from the desk; the next desk's phone rings. Play the voicemail: Dana and the rule. |
| 0:44 | Objective: get to the east stairwell. The corridor: the tired tube, dead tubes at the west end, something in the dark. |
| 1:26 | A locked office door. The facilities notice: reading it lets the floor sleep, and it comes up the corridor. The first strike shows it standing there; then it's gone. |
| 1:57 | The copy room's doorway is too narrow: resize it wider while the wall strains. The tape: "You've noticed your hands." Take Dana's badge. |
| 2:31 | The copier starts by itself and prints the photo of your own body at your desk, from Dana's extension. |
| 2:54 | Knocking from inside the office across the corridor, then the handle tried from the other side. |
| 3:18 | The unfinished wing: sensor lights. One strikes far off with nobody under it. It's there, then not. Run. |
| 3:51 | The lobby. Badge in the reader. The phone rings; the machine picks up: the real Dana. |
| 4:28 | "They are not from me." The score stops. |
| 4:39 | "Keep moving," behind you. The lights go, toward you. Blackout. "There you are." |
| 4:51 | "Are you still there?" A pointer that isn't yours clicks Yes. FLOOR3: end of Chapter One, AFK. |
