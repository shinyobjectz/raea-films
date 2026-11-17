# Studies (11-11): what works, what doesn't, what to use in graybox v2

## 1. Type behind things (studies/occlusion.tsx) — works
- Flat 2D type (a page: Geist 900, letters rising) on `<Screen crt={false} background="transparent">` standing just
  off the back wall. Furniture occludes it by real depth and it slides behind things as the camera moves.
- Gaps: two `<Canvas3D layered>` in one frame are drawn as one scene (no page layer between them), so "shell, word,
  furniture" as three layers isn't possible that way. The clear screen's quad shows a faint outline at its edge, and
  a faint dotted ghost right of the full stop (frame 80). Both to report.
- To use it: stage the word where tall things cross it (it sat too high here: only the lamp cuts it).

## The app's own components in the page (ui/test.tsx) — works
- See ui/kit/env.ts and memory app-components-native. `<Screen app>` is not drawn in this engine build.


## 2. Lettra type (studies/lettra/lettra.tsx) — works
- lettra 0.3.0's MSDF text through `<R3F>`, with its `wipe` (the line typed in) and `scramble` (a reroll breaking the
  line into its own glyphs, settling back) driven from the clock. For the generator's prompt line on each reroll.
- Geist atlases baked into studies/lettra/fonts (400 and 700, printable ASCII). Baking: instance the variable font to a
  static weight (`uvx --from fonttools fonttools varLib.instancer Geist.ttf wght=700 -o Geist-700.ttf`); in a scratch
  folder `bun add lettra@0.3.0 msdf-bmfont-xml@2.7.0 opentype.js@1.3.4 maxrects-packer@2.7.3` (msdf-bmfont-xml 2.8
  fails with "outlinesFormat"), link Homebrew's arm64 msdfgen over `node_modules/msdf-bmfont-xml/bin/darwin/msdfgen.osx`,
  move the nested maxrects-packer aside, then `node node_modules/lettra/dist/cli.mjs bake Geist-700.ttf --charset "..." --out out/Geist-700`.
- Gaps: a render of several stills (`--at 0,10,22`) draws the lettra text in none of them; one still a render works
  (so does a film render, by raea's own fixture). An atlas only has the glyphs it was baked with: missing ones are
  skipped silently. The packages live in studies/lettra (its own package.json), not the project root.

## Next: Rune layer effects on the card, physics (sheet, papers, tumbleweed), a shape as the mask of a match cut.

## Not an engine gap: the sea's "library-bedroom-sun" failures (11-11)
The sea's render failed several times asking for the bedroom's composition. I first read that as two renders in one
project crossing wires. It was not: the agents shared one scratchpad, the sea's agent overwrote the bedroom agent's
render.sh, and the bedroom agent ran it with its own arguments (its report says so). Concurrent renders in one
project worked all session. Lesson: give each agent its own scratch folder.

## 3. Open sea and a boat (studies/ocean.tsx, blender/studies/ocean.py) — first pass, 11-11
- Works: Blender's FFT ocean (JONSWAP swell + a small Phillips chop tile) displacing our own grid (18 cm under the
  boat, coarse to 300 m), baked to `.rseq` (raw from Blender, zstd by tools/rseq-zstd.ts; 150 frames = 175 MB) and
  drawn by `<MeshSequence>`; the boat's heave, pitch and roll read off the same waves; 21 ms a frame.
- Found: `<MeshSequence>` has a clear coat by default (set `clearcoat={0}`); Blender's own foam layer comes out
  flat (~0.1 everywhere) in DISPLACE mode, so foam is computed from the fold (Jacobian) in the script; under Solari
  the sea drew black with mirror patches (no glossy reflections on Metal), so this study is rasterised with a sky
  panorama; a flat far-sea slab must sit below the deepest trough.
- v2 (item a feed post: a third ripple tile and a 10 cm grid (115,600 verts a frame, 120 frames = 256 MB);
  foam streaked down the wind and lingering; spray as a second sequence (8,000 droplets, off breaking crests and the
  bow when it drops); night made by hand (the moonrise panorama at 3.5%, a 1,400 lux moon, a warm PointLight and lamp
  on deck): Poly Haven's "moon" skies are long exposures that look like day. 43 ms a frame.
- Not right yet: the droplets cast hard dark specks of shadow in sun (MeshSequence has no shadow switch); foam is
  still colour only (no roughness change); no wake or water breaking on the hull; no fine ripple shader (MeshSequence
  takes no normal map or surface hook: an engine gap); the sea does not loop; the boat's number reads mirrored on
  its port side (the sea agent's component); not ray traced (Solari drew the sea black on Metal).
- v3 (item a feed post, built from what the open FFT oceans do rather than guesses:
  - Foam as `saturate((threshold - J) / 0.4)` on the fold's Jacobian, built up and decayed exponentially (about 3 s),
    carried aft with the water (GodotOceanWaves, Crest, webgpu-ocean, poseidon all do this).
  - Lace by thresholding a Worley lattice with the foam amount (MengTo's ultra-realistic-water skill): only where the
    grid is fine enough; far foam is its smooth amount. Still fills in solid where foam is thick.
  - The ship: nine sample points under the hull, targets scaled down (pitch 0.85, roll 0.6), a damped spring each
    (heave 5/3.2, pitch 3.6/2.6, roll 2/1.7): the same recipe two three.js ocean write-ups use.
  - The hull in the water: the sea pushed down under the hull (Crest's "push water under convex hull"), a foam band
    hugging it, a bow wave, a trough alongside, a Kelvin wedge (tan 19.47 deg = 0.354, transverse length 2 pi U^2 / g)
    and a propeller wash; the boat makes 6 knots, so the grid rides with it and foam slides aft.
  - Light through crests as a height-keyed green lift in the vertex colour (a stand-in for the view-dependent
    subsurface term those shaders compute per pixel); `<Fog>` into the sky's horizon colour to hide the patch's edge.
- Still open after v3: `raea check` flags blotching in the dark frames of the joined mp4 (encode dark shots with
  --quality master or from PNGs); thick foam is solid white, not lace; roughness can't vary (foam matte, far water
  rougher); droplets are meshes with hard shadows, where the references use billboards that dissolve; the wake is a
  fixed analytic shape, not a simulated one (the references run an iWave or spectral height field for a true Kelvin
  wake); one sea state shared by all three skies; no loop; not ray traced.
- Engine asks this study produced: a surface hook or normal map on `<MeshSequence>` (or vertex displacement in
  `ShaderExtension`), a shadow switch on `<MeshSequence>`, per-vertex roughness, and FFT waves in the SDK
  (`mate-h/bevy_fft`), which would replace the 250 MB bake with a shader.

## Graybox v2 harness (v2/, 11-11)
- v2/plan.ts (shots from board/chain.ts), v2/stage.tsx (pieces from sets/, one camera, sun, thirds guide with the
  shot's in and out hooks), v2/ui.tsx (2D cursor and pick box placed by projecting scene points), sets/PLACE.tsx (each
  place's layout, split out of library/PLACE.tsx), sets/office-room.ts (the office as a 14 x 26 m floor).
- ToneMapping exposure: higher is brighter. A panel outside a window shades a directional sun under Solari: use an
  Environment for the sky outside. Emissive tubes at glb strength do not light a room; a dark room wants sky through
  the windows. A model's named material is switched with <Refinish materials={[{ material, emissive, emissiveIntensity }]}>
  ("raea/three" is not importable at run time).
- Shot 5 (v2/office.tsx, v2-05 and v2-05-guide) is blocked with cursor and pick box. Dark first half needs --quality
  master or raea check flags blotching.
- 11-11, assemblies 1-3 (out/stay-graybox-v2-aN.mp4): v2/take.tsx plays any set with its library stand's light;
  v2/film.tsx holds a spec a shot (views, rigs, a `hook`: the scene point the cut is made on, which v2/aim.ts turns the
  camera to so it lands on the chain's in and out places); guide compositions are `v2g-ID`. tools/v2.sh renders a shot
  a render and prints each shot's clip notes. Hooks verified by guide stills: montage 14-27, laundromat, both bedroom
  shots, garage, sea. Not yet: the canyon's sun (its disc's end position isn't known to the spec), the road, shots
  2/4/6's hooks, the pool's water line.
- Clip notes left as meant: rocks bedded in the road's verge, the headland through the sky backdrop (both unseen).
- 11-11, assembly 4: v2/card.tsx is the app's own InlineComposer and PinThread (v2/kit, built in the capture clone with
  vite.parts.config.ts; neither is in this repository, as the app's source isn't public), 2.4x the app's size (comment text about 3% of the frame's
  height), typed by frame, posted with "the director" and the agent's "Kimi is on it" badge. In shots 4, 7, 9, 11, 12, 13.
  Found: the app's stylesheet paints html/body, which covers a 3D canvas under the page (the scene went black): clear
  it after the CSS. A textarea's first value is not drawn in a single still, only once it changes (clips are right;
  check cards from a clip). A file outside the composition's folder can't import back into that folder (the kit had
  to live beside the film code).

## Broken in assembly 6 (from frame strips of every shot, 11-11) and what was done
- 02 office: a ceiling fan lying on its side in the aisle (my "wrong reroll" gag) read as a broken prop. Removed; the
  rerolls' mistakes are now every chair to the wall, every monitor swung off, every drawer open, then the cooler.
- 04 office: the last second blew out grey (exposure opened while the near tubes were still on). Opens later now.
- 05 office: morning had little impact. Now a low warm sun (#ffbf7a, 70,000 lux) and dust in the air, so the light
  comes through the slats as shafts.
- 08 canyon: "golden hour" changed nothing but a disc: the scene's sun never moved. Now the sun comes down the slot,
  warms to orange and the exposure opens; the slam is warped and gold and leaves after 2.5 s. The low disc was a white
  ball in frame (also in 28): the disc stops at 0.8 of its fall.
- 09 laundromat: the sheet shatters half-way through its drift clip (a morph through itself). Held in the drum, then
  the last quarter of the clip only. Still a pop: needs a cloth sim or a better clip. OPEN.
- 11 bedroom: the camera whipped across the room past the fish tank. The end point is now back in the room. Still a
  wide pan in 4 s. OPEN to judge in motion.
- 12 road: the opened puddle read as a black hole (it mirrors a black sky). Opens to 40% only. OPEN: needs a sky.
- 13 garage: the camera began against a covered car in the next bay. Moved clear; the car now turns candy red when
  "deeper red." is sent (it changed nothing before).
- 15 koi: the bridge swings through frame as the camera turns from the lower left to the centre. OPEN.
- 24 lighthouse, 25 turbines: a lens on a grey stand, a rotor on black: stands, not places. OPEN.
- Copy: "lose the tubes" meant nothing to a viewer. The generator is now asked in plain lines a reroll ("an office at
  night", "again.", "no. the same office.", "the SAME one.", "that is a swimming pool.", "...close enough.") and the
  comment is "turn the lights off. let the morning in."
- Cursor: holds can be turns round a ring handle (dryer door, globe, car), not only drags.

## Engine gaps found on the full run (11-11)

- **Bevy's wireframe draws nothing.** `<BevyResource type="bevy_pbr::wireframe::WireframeConfig" value={{ global: true, ... }}>`
  is accepted and the frame is unchanged (studies/wire.tsx): the host has the type but, it seems, not the plugin. The
  film's wireframe is a frame pass instead: edges from the depth and normal prepass (v2/look.tsx).
- **A frame pass with `prepass` fails on a camera without Solari.** The ocean shot (plain raster, 4x multisampled):
  "raea_frame_pass: Texture binding 13 expects multisampled = false, but given a view with samples = 4". framepass.tsx
  says prepass turns multisampling off; here it doesn't, and a `bevy_render::view::Msaa` "Off" inside the camera
  didn't either. The ocean shot has the film look without the drawing.
- **Solari draws an alpha-blended puddle as a black patch** (road/puddles.glb: puddle_water, BLEND). Left out of the
  road shot.
- **A single still under Solari is darker than the same frame in a clip** (no accumulated bounce light). Judge
  exposure on a rendered clip's strip, not on `--frame`.
- A place's painted sky dome keeps an `<Environment>`'s light out: the canyon went black until its dome was left out.

## Engine gaps found building v3 (11-11)

- **An inline `<FramePass wgsl uniforms>` keeps its first frame's uniforms for the whole clip.** Only a pass given as
  a shader `file` follows its uniforms frame by frame (systems/framepass: `follow` runs for written passes only), and
  a file pass can't have the prepass. Stills render each frame fresh, so they show the change and the clip doesn't:
  assembly 8's "wireframe flashes" never played. v3 uses two passes: an inline one with the prepass that writes the
  edge lines into the frame's alpha, then a file pass that animates the mix (v3/look.tsx, media/shaders/stay.wgsl).
- **`raea gen` sends a generic fal endpoint only `prompt`**: an `audio.sfx` step's `video` and `seconds` are dropped.
  Hunyuan's video-to-audio needs `x_video_url` (a URL: tools/fal-upload.sh puts the clip in fal's storage) and
  `x_text_prompt`. Its plan says 10 cents per 10 s; its run reports 0 cents.
- Bevy's `DepthOfField` on a Solari camera works (`focal_distance`, `aperture_f_stops`); f 0.12 softens the whole
  frame at room distances, 0.7 is slight.
- A Screen with an `<Img>` child is a good way to stand a capture in a scene (v3/outro.tsx), unlit, with depth of field.

- Alpha-BLENDED leaf cards (Poly Haven trees as they come) render as pale opaque sheets under Solari; set the material
  to an alpha MASK and they cut out properly (tools/glb-alpha-mask.ts, 11-11). A big matte ground plane also goes
  bright at the horizon (grazing reflection of the sky) whatever its colour: put something between the lens and it.

- A baked moving water surface (`<MeshSequence>` of Blender's ocean model, blender/studies/harbour-water.py) does render
  under Solari and moves, but seen low across it (5 to 10 degrees) it draws hard-edged dark blotches shaped like the
  wave field's contours. Tried and ruled out on 11-11: wave height (13 cm down to 3 cm), chop and ripple removed, the
  body colour (dark, then sky-pale), roughness 0.1 to 0.38, the sun at 5 and 18 degrees, the flat sheet under it lowered
  3 m, the mesh raised 10 cm. So it is the shading of the sequence's mesh itself, not the set. The harbour stays on a
  flat sheet. media/ocean/harbour.rseq was deleted (105 MB); the script rebakes it in seconds.

## 11-11: the drawing on the mesh (three routes tried)

- `<SurfaceShader>` (a `surface` hook over every lit material) does not reach opaque surfaces under `SolariLighting`:
  only the forward-drawn ones (glass, blended) took it. Out.
- An inline `<FramePass prepass>` holds its first frame for the whole render: its uniforms, a `key` that changes every
  frame, and even its source text changed every frame all stayed as frame one. It has no `globals`.
- What works: an inline prepass pass that only writes `depth(uv)` (metres along the ray) into the frame's ALPHA, then
  the file pass, whose uniforms do follow each frame, given the camera (eye, forward, right, up, tan of half the field).
  It rebuilds each pixel's world position as `eye + ray * alpha` and its normal from `cross(dpdx(p), dpdy(p))`; both
  are clean (the frame is float once a `<Bloom>` makes the camera HDR). So masks can be shapes in the world (a sphere
  from the click, a box round a thing, the half-space beyond a door) and hatching can be laid in world space.

## 11-11: off-the-shelf water and clouds for Bevy

- Clouds: evroon's bevy-volumetric-clouds (MIT, Bevy 0.19). Its shader (Horizon Zero Dawn method, Frostbite lighting)
  is carried into media/shaders/stay.wgsl `sky`; its two noise textures are baked by tools/cloud-noise.py. No engine work.
- Water: sayhisam1's bevy-aqua (Apache-2.0, Bevy 0.19; FFT cascades, persistent whitecaps, optics, reflections).
  `cargo check -p bevy-aqua` passes on Bevy 0.20 with studies/bevy-aqua-bevy-0.20.patch (against its commit 98d755f):
  `#[extract_app(bevy::render::RenderApp)]` on ten ExtractResource/ExtractComponent derives, glam 0.33,
  MeshAabb::get_aabb for Mesh::compute_aabb, MeshTag::new, ShaderBuffer::with_size takes u64,
  ViewPrepassTextures::depth_only_view. Not yet built into raea: that is a plugin declaration
  (sdk/raea/docs/bevy-plugins.md) and a plugin build of the engine through the lane.
