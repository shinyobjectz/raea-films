# Stay

**[Watch the film](https://media.raea.io/#stay)** (1:31, 1350×1080, 30 fps, with sound)

Every door opens on a new world: a music video for the song *Stay*, every shot ray traced. A hallway of doors, and
behind each one a bedroom, a canyon, a cathedral, a cellar, a diner, dunes, a forest, a harbour, the open sea, cut on
the song's own beats.

It was the launch film for raea 0.1.1, about one idea: making with AI rerolls the whole place every time you ask; in
raea you point at one thing in the scene, say what you want, and the agent changes only that. Every shot is code:
React and TypeScript compositions that raea renders on the GPU under ray-traced light (raea's Solari). This folder is
the whole project, with the two cuts before it. It's Apache-2.0: read it, take it apart, make your own.

## How it was made

1. **A brief, a script and a plan on the song's beats.** [`brief.ts`](brief.ts) and
   [`stay.script.ts`](stay.script.ts) say what the film is for and what's in it. [`v3/plan.ts`](v3/plan.ts) places
   every cut on the song's beat map ([`parts/song.gen.ts`](parts/song.gen.ts), from `media/music/stay.song.json`).
2. **The worlds.** Each room and landscape is built by a Blender script in [`blender/`](blender), from Poly Haven's
   CC0 scans, models and textures and our own geometry. Every model has a `.glb.json` sidecar saying how it was made,
   its source and its licence. [`docs/asset-sources.md`](docs/asset-sources.md) is the survey of where free models
   can come from, and why most of them couldn't.
3. **The shots.** [`v3/`](v3) has a composition per world: the doors and the hallway, the dust (a Mantaflow
   simulation, baked and raymarched), the sea (an FFT ocean from a Bevy plugin, [`vendor/`](vendor)), the faces.
4. **Sound.** The song, and under it the rooms, the rain, the sea and the cursor's clicks
   ([`tools/sound3.ts`](tools/sound3.ts)), each well under the song. The foley was generated from the shots' own
   pictures; the transitions are short generated effects ([`v3/transitions.ts`](v3/transitions.ts)).
5. **Render.** [`tools/v3.sh`](tools/v3.sh) renders each shot and joins them on the plan's cuts with the sound.

[`plan.org`](plan.org) is the production log, and [`gaps.md`](gaps.md) the gaps in raea we hit and how each was
worked around.

## Make it yourself

You need [raea](https://raea.io) 0.1.6 or later, plus bun, ffmpeg and zstd. It renders on a GPU raea can ray trace on.

The media comes with a raea account, which is free: sign in on [the film's page](https://media.raea.io/#stay),
press **Get the media**, and it gives you the `tools/get-assets.sh` line below with your own link (or the archive to
download, which `tools/get-assets.sh` takes as a path).

```sh
git clone https://github.com/shinyobjectz/raea-films && cd raea-films/stay
tools/get-assets.sh LINK       # the worlds' models, skies, foley and captures: a 4.9 GB download

# the song isn't in the download (below): your own track, or 90 s of silence to render with
ffmpeg -f lavfi -i anullsrc=r=48000:cl=stereo -t 90 media/music/stay.wav

raea render v3/film.tsx --composition v3-wide --frame 20 -o glade.png
bash tools/v3.sh               # every shot, then the film: out/v3/film.mp4
JOIN=0 bash tools/v3.sh fern floor wide harbour    # or just the shots you name
```

**The song.** *Stay* isn't in this repository: its licence isn't settled. The cut is timed to its beat map
(`media/music/stay.song.json`), which is here, so any track at `media/music/stay.wav` plays under the picture.

**Some shots need more than raea.** The sea is an FFT ocean from a Bevy plugin
([`vendor/bevy_fft`](vendor/bevy_fft)), and four shots show it (the intro, the hallway, the kitchen and the sea), so
`tools/v3.sh` renders those with a build of raea that has the plugin compiled in
([`tools/sea-plugin.sh`](tools/sea-plugin.sh) makes one from raea's source). Without that build those four fail and
the join stops; render the others by name. The faces' last stage is a neural pass, MLX-DLSS, which isn't part of this
repository; without it, [`tools/faces.sh`](tools/faces.sh) keeps the plain render.

## Layout

| | |
|---|---|
| `v3/` | the film: a composition per world, the plan, the doors, the dust, the sea, the faces, the transitions |
| `parts/`, `sets/`, `library/`, `props.tsx` | the parts every cut shares: the song's beats, the sets, the props |
| `blender/` | the scripts that built every world and model, and how the assets are made (`COMPONENTS.md`) |
| `tools/` | the scripts that made the sound and rendered the film |
| `vendor/` | the two Bevy crates behind the sea (bevy_fft, MIT; bevy-aqua, MIT or Apache-2.0), with their licences |
| `stay.tsx`, `v2/`, `studies/`, `board/` | the first two cuts and the studies, kept as history |
| `media/`, `blender/src/` | fetched by `tools/get-assets.sh` |

## Licence

The code and every asset made for the film are [Apache-2.0](../LICENSE). Everything else in the download is CC0:
[`ASSETS.md`](ASSETS.md) has the details. The vendored crates keep their own licences. The raea name and logo are
trademarks and aren't covered by the Apache licence.
