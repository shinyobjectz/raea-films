# FLOOR3

**[Watch the playthrough](https://media.raea.io/#floor3)** (5:05, 1920×1080, 30 fps, with sound)

A first-person liminal horror game. You wake face down on your desk on Floor 3 of a 1990s office tower. It's 11:52 PM,
the floor is empty, the lights are on sensors, and where your hands should be there are cursors. A voicemail from Dana
in IT explains the one rule: don't stand still. The film is Chapter One, "AFK", played through.

It's a real game, made in raea: React and TypeScript that raea runs live, reading your keys and mouse, or renders as a
film. [`design.md`](design.md) is the whole game's design, five chapters and about an hour long; this folder builds
and plays its opening. It's Apache-2.0: read it, play it, take it apart.

## How it was made

1. **One game, played or filmed.** [`compositions/floor3.tsx`](compositions/floor3.tsx) is the game. Played live, it
   reads the player's keys and mouse. With nobody at the keys it plays the recorded session
   ([`game/run.gen.json`](game/run.gen.json): only what a player's devices did, frame by frame, written by
   [`tools/record.ts`](tools/record.ts)), so a render of the same file is the playthrough.
2. **The rules in plain TypeScript.** [`game/step.ts`](game/step.ts) advances the game a frame at a time from that
   input; the level, the navigation, the bot that plays the session and the HUD are beside it in [`game/`](game).
3. **The building.** The office, corridors, copy room and stairwell are modelled in code by the Blender scripts in
   [`blender/`](blender), dressed with Poly Haven's CC0 textures and our own printed surfaces
   ([`tools/tex.sh`](tools/tex.sh)). The posters, prints, calendar and snapshots were generated to our prompts
   ([`tools/art.sh`](tools/art.sh)); the soft props were drawn, made 3D locally and carved into meshes
   ([`tools/idol.sh`](tools/idol.sh)). Each model's `.glb.json` sidecar says how it was made.
4. **Sound from the game itself.** [`tools/mix.ts`](tools/mix.ts) cues every footstep, light, phone, voice and breath
   from what the game did on that frame and places it around the player's head. The score is the building's own:
   the ballasts' hum as a slow chord that sags when the floor sleeps, the lights' strikes as notes, the phone's ring
   as the theme. Dana's lines are voiced by [`tools/voice.ts`](tools/voice.ts); the foley is Stable Audio Open, made
   locally ([`tools/foley.sh`](tools/foley.sh)).

## Play it, or make the film

You need [raea](https://raea.io) 0.1.6 or later, plus bun, ffmpeg and zstd.

The media comes with a raea account, which is free: sign in on [the film's page](https://media.raea.io/#floor3),
press **Get the media**, and it gives you the `tools/get-assets.sh` line below with your own link (or the archive to
download, which `tools/get-assets.sh` takes as a path).

```sh
git clone https://github.com/shinyobjectz/raea-films && cd raea-films/floor3
tools/get-assets.sh LINK                    # the building's models, textures, art, voices and sounds: about 0.4 GB

raea play compositions/floor3.tsx --input   # play it: WASD or the arrows to walk, the mouse to look, Shift to run

# the film: the picture (PNG frames fed to x264 as they finish), the sound, then the two together
bun tools/master.ts out/floor3-picture.mp4
bun tools/mix.ts
ffmpeg -i out/floor3-picture.mp4 -i out/floor3-mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest out/floor3.mp4
```

The scripts in `tools/` and `blender/` made the assets, which are already in the download; you need them only to
change something. `tools/voice.ts` needs a Fish Audio key (`FISH_API_KEY`), and `tools/art.sh` an image model.

## Layout

| | |
|---|---|
| `compositions/` | `floor3.tsx` (the game and the film), the covers and the inspection views |
| `game/` | the rules, the level, the session and its recording, Dana's lines, the HUD |
| `components/`, `controllers/` | the world's parts and the player's controls |
| `blender/` | the scripts that built every model; `blender/lib/` fetches Poly Haven's textures |
| `tools/` | the scripts that made the art, textures, voices and foley, recorded the session, and mixed and mastered the film |
| `design.md`, `brief.ts` | the game's design, and the film's brief |
| `assets/`, `blender/src/` | fetched by `tools/get-assets.sh` |

## Licence

The code and every asset made for the game are [Apache-2.0](../LICENSE). The rest are CC0: Poly Haven's textures and
models, and MakeHuman's people. [`ASSETS.md`](ASSETS.md) has the details. The raea name and logo are trademarks and
aren't covered by the Apache licence.
