# Made in raea: the source

The films on [media.raea.io](https://media.raea.io) were made in [raea](https://raea.io), and this is how. Each folder
is one project, the way it was made: the compositions raea renders, the scripts that made the assets and the sound, the
brief, the script and the production log. Clone it, render a frame, change something, make your own.

| | Film | What it is | Folder |
|---|---|---|---|
| [▶](https://media.raea.io/#swamp-side-mayor) | **Swamp-Side Mayor** | A goose runs for mayor of the swamp, in a rap. Music video, 1:30 | [`swamp-side-mayor/`](swamp-side-mayor) |
| [▶](https://media.raea.io/#goose-learns-raea) | **Goose Learns raea** | A dry narrator walks Goose through the raea app while he makes that music video. Tutorial, 5:50 | [`swamp-side-mayor/`](swamp-side-mayor) (same project) |
| [▶](https://media.raea.io/#swamp) | **Swamp** | A robot cursor on a monitor sunk in a dead swamp brings the world back. Film, 1:25 | [`swamp/`](swamp) |
| [▶](https://media.raea.io/#floor3) | **FLOOR3** | A liminal horror game; its first chapter, played through. Game, 5:05 | [`floor3/`](floor3) |
| [▶](https://media.raea.io/#fingerprints) | **Fingerprints** | Models that see, hear and read every cut learn your eye from your own notes. Explainer, 2:19 | [`fingerprints/`](fingerprints) |
| [▶](https://media.raea.io/#stay) | **Stay** | Every door opens on a new world, every shot ray traced. Music video, 1:31 | [`stay/`](stay) |

All six render on raea 0.1.6: one frame of each was rendered from a fresh clone of this repository and its downloads.

## Make one yourself

You need [raea](https://raea.io) (free, on your own computer), plus ffmpeg and zstd. Most of these films are lit by
ray tracing, so they render on a GPU raea can ray trace on; they were made on Apple silicon Macs.

```sh
git clone https://github.com/shinyobjectz/raea-films && cd raea-films/swamp
tools/get-assets.sh LINK                # the media, with a free account: media.raea.io/#swamp, Get the media
raea render compositions/hype.tsx --composition s11-sun --frame 30 -o sun.png
```

Code lives here in git. The heavy media (models, textures, sound, captures) is one archive per film, for anyone with
a raea account, which is free: Get the media on a film's page at media.raea.io gives you the line that fetches it
with that film's `tools/get-assets.sh`, which checks it against its sha256 and unpacks it. Each film's README says
how to render the whole thing, and its `ASSETS.md` says where every piece of media came from.

Or skip the code: paste this into your AI agent and it sets raea up for you.

```
Install raea from https://raea.io/install and show me what it can make.
```

## Licence

The code, and every asset made for these films, is [Apache-2.0](LICENSE): read it, take it apart, reuse it. Assets
made by others keep their own licences (CC0 for most, a few CC BY that need their credit kept), listed in each film's
`ASSETS.md`. A few things the films used aren't ours to pass on: stock footage, other people's ads, models whose
licences don't allow sharing them, and one song whose licence isn't settled. Those aren't in the downloads, and each
`ASSETS.md` says what's missing and what to put in its place.

The raea name and logo are trademarks and aren't covered by the Apache licence: put your own mark in their place in
anything you make from this. Other companies' logos that appear in a film belong to them.

Questions, or show us what you made: [raea.io/discord](https://raea.io/discord).
