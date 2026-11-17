# Swamp-Side Mayor, and Goose Learns raea

**[Watch Swamp-Side Mayor](https://media.raea.io/#swamp-side-mayor)** (1:30, 2160×1080, 30 fps) ·
**[Watch Goose Learns raea](https://media.raea.io/#goose-learns-raea)** (5:50, 1920×1080, 30 fps)

Two films from one project. **Swamp-Side Mayor** is a music video: Goose runs for mayor of the swamp, in a rap, under a
flat blue sky in a painted world, with ruins, critters, a summoning circle and a giant beige computer that rises out
of the pond. **Goose Learns raea** is the tutorial for raea 0.1.5, shot in the same swamp: a dry narrator walks Goose
through the raea app from the first ask to the finished film, while Goose makes that same music video.

The goose was built from scratch, and every shot is code: React and TypeScript compositions that raea renders on the
GPU. This folder is the whole project, from the brief to the last note on the last cut. It's Apache-2.0: read it, take
it apart, make your own.

## How it was made

1. **A brief and a plan.** [`brief.ts`](brief.ts) says what each film is for and what it won't do.
   [`compositions/plan.ts`](compositions/plan.ts) holds the music video's shots on the song's beats, and
   [`plan.org`](plan.org) is the production log: every note on every cut, and what was done about it.
2. **The world.** The swamp is painted, not scanned: trees, grass and plants grown by Blender scripts
   ([`blender/`](blender)) and drawn in one look ([`compositions/world2.tsx`](compositions/world2.tsx)); the ruins built
   by [`blender/ruins_build.py`](blender/ruins_build.py); the critters (Quaternius, CC0) smoothed and recoloured by
   [`blender/critters_build.py`](blender/critters_build.py).
3. **Goose.** Built from scratch and posed by [`blender/goose_build.py`](blender/goose_build.py). Each move lands on
   its word of the song (`show.json`, `plan.ts`), with the stomps, the muddy footprints and the wet shake.
4. **Lettering.** The hook's words are painted with a dry brush in Archivo Black ([`tools/paint.py`](tools/paint.py));
   the keycaps' shortcut signs are drawn to match ([`tools/keycap.py`](tools/keycap.py)).
5. **The real app.** What the computer shows is the raea app itself, captured from raea's own window, one state at a
   time, and played back on the glass under the pointer.
6. **Sound.** The music video's foley is placed on the plan's own events ([`tools/foley.ts`](tools/foley.ts): 160
   sounds, each on its frame) and mixed under the song to −14 LUFS ([`tools/mix.sh`](tools/mix.sh)). The tutorial's
   narrator is a Fish Audio voice, a line at a time on its own beat; the swamp's bed and the gags' foley are Stable
   Audio Open takes made locally (`raea sao`); the score is written in code and played on sampled instruments
   ([`compositions/tutsound.tsx`](compositions/tutsound.tsx)).

## Make it yourself

You need [raea](https://raea.io) 0.1.6 or later, plus bun, ffmpeg, zstd and bc.

The media comes with a raea account, which is free: sign in on [the film's page](https://media.raea.io/#swamp-side-mayor),
press **Get the media**, and it gives you the `tools/get-assets.sh` line below with your own link (or the archive to
download, which `tools/get-assets.sh` takes as a path).

```sh
git clone https://github.com/shinyobjectz/raea-films && cd raea-films/swamp-side-mayor
tools/get-assets.sh LINK             # the world, the goose, the critters, the song, the app captures: about 1 GB

# the music video, rendered as stills 150 frames a call and joined with the song, then its foley mixed in
tools/film.sh out/goose-v5.mp4
tools/mix.sh out/goose-v5.mp4 out/swamp-side-mayor.mp4

# the tutorial: its soundtrack, then its picture a run at a time, then joined
raea render compositions/tutsound.tsx --composition tutsound -o out/tut/sound/tutsound.wav
tools/tutfilm.sh
tools/tutfilm.sh --join out/tut/goose-learns-raea.mp4
```

The tutorial's last chapter plays the finished music video on the screen: `assets/tut-song/goose-v5.mp4` links to
`out/goose-v5.mp4`, so render the music video first. The Python scripts under `tools/` and `blender/` made the
assets, which are already in the download; you only need them to change something. The `blender/` scripts run in
Blender (`raea blender run` or `blender -b --python`); no `.blend` files are kept.

## Layout

| | |
|---|---|
| `compositions/` | what renders: `film.tsx` (the music video, with Goose), `tutfilm.tsx` and `tutsound.tsx` (the tutorial), the plan, the cover, the checks; and the parts they share: the world (`world2.tsx`), the ruins and critters, the machine, the ink |
| `components/` | the clouds and the sing-along's lines; `components/tut/` is the tutorial's shots, set and sound |
| `tutorial/`, `tutorial*.script.ts` | the tutorial's lesson plan, its read sheet and the script, cut by cut |
| `blender/` | the scripts that built the trees, plants, ruins, critters and the goose |
| `tools/` | the scripts that made the assets and the sound, and rendered and mixed the films |
| `assets/` | fetched by `tools/get-assets.sh` |

## Licence

The code, Goose, the song and every asset made for these films are [Apache-2.0](../LICENSE). The rest keep their own
licences, all free to reuse: [`ASSETS.md`](ASSETS.md) lists each one. Four logos of AI agents that appear in the
tutorial belong to their companies and aren't in the download: grey cards stand in their place. The raea name and
logo are trademarks and aren't covered by the Apache licence.
