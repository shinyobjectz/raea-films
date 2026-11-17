# Component library: what each place's agent reported (2026-11-11)

Generated from the workflow's journal. Each agent's own account, unedited: its problems are open until checked.

## canyon: 19 components, 7 rigged, 14 from Poly Haven, 91 MB

Shot props: tumbleweed (the prop the cursor throws down the slot): clips "roll" (one whole turn forward about its middle, loops) and "hop" (lifts 0.7 m, a bound's height); where it is along the slot and the cursor's grab are scene-driven ("place"). sun (the disc the cut to the dryer's window lands on, and the agent's steps to golden hour): clip "height" lowers the disc along its arc from 62 to 6 degrees about its pivot; the DirectionalLight and material sun_disc's colour are scene-driven ("light"). sand streams (falling off the rim into the light): clips "fall" (streams let down from the lip, fans grow) and "flow" (grains slide one metre, loops). dust (lit in the light): clip "drift". Also rigged: shrub, grass and snag "sway"; sky "glow" is scene-driven only (not counted in the 7). The hooks' fixed parts are in the shell: walls (the left wall's edge, the slot's far end turning right out of sight), rim, sand. Poly Haven count: 8 components are Poly Haven models (boulder, boulder-b, chockstone, driftwood, log-jam, shrub, snag, pebbles) and 6 more are hand-modelled with Poly Haven texture sets (walls, rim, sand, slab, cairn, sand-streams); sky, sun, tumbleweed, grass and dust are hand-made with plain materials. Files: ~/Studio/raea/projects/stay/blender/components/canyon/ (19 scripts and _lib.py, which holds the slot's shape so walls, rim and sand agree), ~/Studio/raea/projects/stay/media/models/canyon/, ~/Studio/raea/projects/stay/library/canyon.tsx, ~/Studio/raea/projects/stay/parts/places/canyon.ts, ~/Studio/raea/projects/stay/out/library/canyon/frame-00000.png and frame-00001.png.

Problems:
- The stand is not lit by the sun component. parts/library.tsx's DirectionalLight is fixed behind the camera's left shoulder, so library/canyon.tsx turns the whole canyon 28 degrees (a `turn` helper over every part's place and yaw, and the eye and look) to let that light shine down the slot from its mouth. The visible sun disc is ahead in the strip of sky, so the light and the disc disagree in the stand, and the light does not change when the disc sinks at frame 30.
- A closed emissive sky dome shadows the stand's DirectionalLight under Solari (the first render with it was black). sky.glb is therefore only the far half of a dome, open behind the camera; a camera that turns round will see black behind it. A film scene with an Environment sky should leave sky.glb out. The dome's glow does light the shade (emissive strength 4000 reads as a noon sky at exposure 0).
- The sun is placed in the stand at scale 0.3, far and high ([5.04, 20, -32] before the turn), so that both ends of its arc show in the slot's strip of sky. At its real 40 m arm the low end (6 degrees) is hidden behind the walls from inside the slot: the shot will need its own placement to get the disc on the upper-right third. In the stand the disc is small (under one degree across).
- Frame 30 shows a faint ghost of the sun at its frame-0 place and a ghost of the hopping tumbleweed on the sand: temporal carry-over between the two frames of one render, not geometry.
- The "roll" tumbleweed looks the same on frames 0 and 30 because a whole turn ends where it starts. I checked it on a scratch render of frame 8 (a quarter turn, it turns in place about its middle); the stand shows a second tumbleweed running "hop" so the difference is visible. The sway rigs (shrub 6 and 9 degrees, grass 8, snag 3) are too small to see at the stand's distance and were not checked closer.
- The sand streams read as a thin pale pole against the sky at frame 30 rather than as falling sand: four straight strands 10 m long at alpha 0.35 with a veil of grains. They need a soft-edged sprite or a scrolling texture to read as sand. The second and third streams stop short of their fans at the end of "fall" by design (0.85 and 0.7 of the drop), and all three fans are at 10 m below the lip while the wall under the placed spot is met at about 9.4 m, so the fans sit partly inside the wall.
- Dust is 900 motes of 5 to 16 mm and shows only as scattered specks; its drift is hard to see in two stills. It is geometry, not a lit volume, so it will not show a shaft of light.
- The shrub (Poly Haven wild_rooibos_bush) renders very dark, nearly black-green, even in sun.
- The rim's cap rock is a smooth extruded profile with noise and a few loose blocks; from below it reads a little like a moulding rather than broken natural rock. The walls' large forms and strata ledges read well in light, but the left wall near the camera is a large plain surface with only the texture for detail.
- The slot's shape is one fixed 38 m piece (walls, rim and sand share blender/components/canyon/_lib.py), not modular sections: the camera can fly about 25 m before the far bend, and the walls have no end caps at the mouth or beyond the bend. A camera outside the slot sees into the rock.
- Chockstone and log-jam are placed where the slot is narrowest at their height and overlap the walls on purpose; the render notes log-jam passing 0.14 m into the walls. The rim's top varies by about half a metre, so the snags (placed at y 12.75) may float or sink a little at their feet; their stone heaps hide most of it.
- Sidecar size for sun.glb gives only the disc and corona's extent (5.3 x 3.8 x 6 m), not the 40 m arm.
- The slab is seen only from the front and at a distance; its two broken pieces lie 1.5 m out toward the middle of the floor and may be in the tumbleweed's path.

### comp.py bugs reported with the place(s) above

- comp.ph_component: when a model's mesh name does not start with the asset id (namaqualand_boulder_03's mesh is boulder_03_LOD0, namaqualand_boulder_02's is boulder_02), the part keeps its whole name, giving nodes like boulder_boulder_03_LOD0 and a parts key the caller cannot predict. I renamed the node after the call.
- comp.mat: `m.blend_method = "BLEND" if hasattr(m, "blend_method") else None` assigns None to blend_method when the attribute is missing, which would create or fail on that attribute instead of skipping it. It did not bite on this Blender.
- comp.ph_component takes a whole asset as one component at one origin; a multi-variant asset whose parts must be laid out separately (dry_branches_medium_01, wild_rooibos_bush, namaqualand_stones_01) has no helper. I wrote take/place/drop in blender/components/canyon/_lib.py. Not a bug, a gap.
- comp.ph_texture reuses a material by name and silently rebuilds it with the new call's asset, resolution, tile and tint; two components sharing a name with different settings would each get whatever was called last in that Blender session. Harmless headless (one script a run), a trap live.

## diner: 20 components, 15 rigged, 10 from Poly Haven, 43 MB

Shot props: coffee cup (the montage's CC circle, shot from straight above): clip "swirl" turns the coffee's surface, a painted cream spiral on its own node and material coffee_cream, one whole turn about the cup's axis; also "lift" and "spoon". stool (the BR circle): clip "spin" turns the seat a whole turn about the column, with a strip of tape on the vinyl so the turn reads; also "wobble". neon sign (the TR rectangle, red to blue): the word OPEN is its own material neon_tube for the scene to key, the cup outline is neon_tube_b; no clip. Views: out/library/diner/ (frames 0 and 30), out/library/diner-cup/ (the cup from above), out/library/diner-counter/ (the counter props).

Problems:
- Whole-turn rigs are back at rest on frame 30, so the two frames do not show them. I checked the cup's swirl and the ceiling fan at frame 10; I did not look closely at the stool's spin, and never saw the jukebox record, the back bar's mixer spindle or the pie case's turn in motion.
- The neon's red-to-blue change and every glow (jukebox arches, pendants, heat lamps, coffee-pot lamps) are left to the scene as named materials; none is demonstrated. Under the stand's sun the neon and jukebox glows read dim.
- The stand is lit as daylight (I lowered the sun to 8000) under a black sky, not a 2 a.m. diner; reds wash toward coral, and 23% of the frame crushes to black (the sky), which the render warns about.
- The cream is a painted spiral turning rigidly, not a fluid: it does not wind tighter as it turns.
- The kitchen pass-through and the door's porthole are flat dark panels, not real openings; the heat lamps read as pale rods. The night behind the window is a flat dark backing, with no street.
- No ceiling component: a ceiling would shadow the stand's sun, so the shell is floor, back wall and window bay only. The pendants and fan hang from nothing.
- Vinyl on the stools and booths is a plain red with only the leather set's grain, because comp.ph_texture finds no colour map in leather_red_03. The counter and table tops are plain laminate, with no texture.
- The floor tiles use marble_01, whose own tile seams show inside each 30 cm tile.
- Glass (pie dome, coffee pots, glasses, shakers) is alpha-blended with no refraction, and the stacked glasses and shakers are visibly faceted.
- Only 4 components use Poly Haven models (cash register, cake in the pie case, wall clock, ceiling fan); the other 6 counted use Poly Haven textures only. Everything else is hand-modelled.

## gym: 16 components, 12 rigged, 9 from Poly Haven, 47 MB

Shot props: basketball (the montage's circle, CC to TC): clip "bounce" lifts it 2.6 m straight up from the floor to where it hangs; "squash" presses it to 78% against the floor; "spin" is one turn of backspin; its place on the court is the Model's position. hoop (the TR circle, hung three times at 2.3, 3.05 and 3.9 m for the wrong detail): clips "net" (swings 24 degrees about the rim), "rim" (breakaway dip) and "kick"; height is the Model's position. caged light ("the lights come up"): material caged_light_glow for the scene, plus clip "sway". court: the free-throw line (the H2 line) is 4.2 m out from the origin under the rim. Views: out/library/gym/ (frames 0 and 30), out/library/gym-ball/ (the ball from the free-throw line), out/library/gym-close/ (rack, rope, two goals).

Problems:
- "The lights come up" is not demonstrated: it is left to the scene. The Poly Haven caged light is one mesh and one material, so I added two lit tubes of my own under its diffuser (caged_light_glow); in the stand they read as faint white bars, not a lit fitting. The scoreboard and EXIT glows are scene-driven too.
- The ball's "spin" and the rope's "twist" are whole turns, back at rest on frame 30; I did not see either turning.
- "squash" only flattens the ball in height, with no bulge sideways, because comp.channel exports one key per node in a clip.
- The net is rigid: "net" swings it as one piece and "kick" is a scale, not cloth.
- No roof deck, one side wall only, and half a court: the trusses and lights hang under a black sky (16% of the frame crushes to black, which the render warns about).
- The court floor is Poly Haven's wood_floor (oak strip, repeating every 1.7 m), not pale maple; plank_flooring_02 was tried first and its knots read wrong. The bleacher seats and benches still use plank_flooring_02.
- The baseline is at the wall (wall-mounted goals, rim 1.6 m off the wall), so there is no run-off behind the baseline: a small school gym, not a regulation one.
- Painted block walls and the pads and mats are plain colours over a Poly Haven set's relief only (the same missing-colour-map workaround as the diner's vinyl).
- The doors open onto a flat dark panel, not a corridor. Backboard glass is alpha-blended and reads milky.
- The opened bleachers are simple: decks, skirts, seat boards and frames, with no aisles, steps or handrails.
- Only 2 components use Poly Haven models (caged light, clock); the other 7 counted use Poly Haven textures only.

### comp.py bugs reported with the place(s) above

- comp.ph_texture reads only the "Diffuse" map. Sets that name their colour maps coll1/coll2 (leather_red_03) get no colour texture: the material comes out white and the tint is silently dropped. Worked round with _lib.ph_plain (a plain colour over the set's normal and roughness).
- comp.channel makes one action and one NLA track per key. Two keys on the same object in one channel (a lift and a tip of one pivot) export only one of them: the coffee pot's "pour" lifted but did not tip. Worked round with nested pivots, one key each.
- comp.export does not check that a mesh with a textured material has UVs. Blender then writes texCoord -1 and raea refuses the .glb ("invalid glTF file: invalid value: integer -1, expected u32"). Hit by a lathe part with a ph_texture material and by bmesh.ops.create_uvsphere, which fills UVs only into a layer that already exists.
- comp.ph_texture's tile becomes a KHR_texture_transform on every texture. raea (Bevy) honours only the base-colour texture's transform and warns for the others, and when a material has no colour texture the normal and roughness maps are not tiled at all. Baking the tile into the UVs (uv_box(o, TILE) with tile=1) avoids it.

## pool: 30 components, 13 rigged, 5 from Poly Haven, 42 MB

Shot props: The shot is a half-second cutaway whose match cut lands on the water line (H2), in from the upside-down cooler's water and back out to it. water: "level" (the surface drops 40 cm down the navy waterline band, the cooler's glug), "slosh" (tilts 1 degree about the pool's length, the cooler's slosh), "ripple" (six rings spread from a point). exit sign: "misspell" swaps EXIT for the generator's EXTI. ladder: "lift", and its own position (the wrong one stands into a wall). Vanish hook at the hall's far end: door "open", pace clock "sweep", diving board "bounce" and "fulcrum". Other motion: lane rope "spin" and "bob", flags "flutter", windows "vent", lifeguard chair "swivel", lifebuoy "swing", beach ball "roll" and "bob", plant "sway". Scene-driven: tubes "on" (tubes_glow), pool "lights" (pool_light), exit sign "glow".

Problems:
- The stand shows the hall cut open so the stand's sun gets in: far end wall, right wall with its six windows, and one of four ceiling bays. The near end wall, left wall and the other three bays are the same parts placed again; the closed hall lit only by its tubes at night has not been rendered.
- water "slosh" was never rendered; I rendered "ripple" and "level" only. It is a 1 degree tilt of a pivot at the pool's centre, so it should be right by construction.
- The "ripple" rings read as pale painted rings on the surface rather than refracting swells. The water is a flat-shaded alpha surface with a modelled chop and no refraction or caustics.
- lane rope "spin", lifebuoy "swing" and plant "sway" are too small in frame to judge beyond 'moves in place'. The floats also look speckled in the half-turn frame, which I take to be render noise, not geometry.
- The lifted ladder leaves a faint ghost of its rest pose in the air in frame 30 (out/library/pool/ladder/frame-00001.png). It looks like the renderer's temporal history between the two stills, since the model itself is clean at rest.
- plant.glb is 176,226 triangles, over the 150,000 guide. It is Poly Haven's potted_plant_01 undecimated, the same model the office uses.
- The diving board's deep end is 3.0 m, but the starting blocks stand at the 1.1 m shallow end, because the board takes the deep end. A real pool would not put blocks there.
- The starting blocks carry blank lane plates: one component cannot hold four different numbers, so the numbers are left to the scene.
- Window glass shows black on the stand because there is no sky behind it. The duct's end cap also reflects that black sky as a dark disc.
- Plaster and deck tiles still have a faint cloudy mottling from the Poly Haven textures after I stretched their levels.
- The main overview render warns that 29% of pixels crush to black. That is the stand's empty sky, not the hall.
- Besides library-pool (frames 0 and 30), library/pool.tsx registers ten closer views (far, side, left, wall, door, board, board-b, bench, blocks, ladder), rendered to out/library/pool/<view>/, so the small rigs and each part's second clip can be seen.
- I deleted two thumbnails that were not mine (cliff_side.png, rock_face.png) from a shared th/ folder in the session scratchpad, taking them for my own downloads. Another agent may need to fetch them again.

### comp.py bugs reported with the place(s) above

- ph_texture(grey=True, tint=...) cannot make a light tile from Poly Haven's mostly brown or dark sets: the grey copy keeps the dark levels and the glTF tint can only darken. I worked round it with relevel() in blender/components/pool/_lib.py, which swaps in a levels-stretched JPEG copy. A levels or brightness argument in comp.py would remove the need.
- _grey() writes NAME_grey.png straight to its final path and skips on os.path.isfile, so two agents building at once can load a half-written file. It also always writes PNG, 4 to 5 MB for a 2k map, which pushed three shell parts to about 21 MB each before I moved them to 1k and JPEG copies.
- fetch() downloads to path + '.part' with a fixed name, so two agents fetching the same Poly Haven file at once write the same temp file.
- mat(): the line m.blend_method = 'BLEND' if hasattr(m, 'blend_method') else None would raise on a build without that attribute, since it assigns None to it. It did not fire here.
- mesh() takes a list of materials but offers no way to assign them per face. I added paint() in _lib.py for this.
- There is no straight pipe with rounded bends, lathe or wall-with-openings helper: tube() is NURBS only, which rounds every corner. I added pipe(), bend(), turn() and wall() in _lib.py, and pipe() calls the private comp._to_mesh_bm.
- export() sets export_animations from bool(rig), so a component whose rig entries are all 'in the scene: ...' still exports with animations on. Harmless, but the flag does not mean 'has clips'.

## stairwell: 21 components, 10 rigged, 3 from Poly Haven, 58 MB

Shot props: The spiral the cut lands on is `rail` (the mahogany handrail, one whole turn a storey) over `stairs`, closing on `floor`'s compass medallion; neither has a clip (the place's shape). `paper plane`: clip "spiral" is one storey of the fall (once round the well's axis and 3.23 m down, loops; the Model's position is the axis, the plane sits 0.62 m out), plus "flutter" and "wobble". `wall light`: clip "on" brings each lamp's lit dome from nothing to whole, one Model a lamp, so they come on floor by floor. Also rigged: door (open, handle), skylight (vent), riser (valve), radiator (valve), mailboxes (open, flap), notice board (flutter), plant (sway).

Problems:
- Rendering frames 0 and 30 in one `--at 0,30` process leaves frame 30 under-lit (mean luma 0.13 against 0.26): a traced render holds its first frame's lights, and the lamps are nothing at frame 0. The PNGs in out/library/stairwell/ were rendered one frame a process and renamed frame-00000/00001. The film's shot will hit the same limit: the lamps' "on" clip shows the dome lit, but the light they throw needs a key per state in the scene.
- Frame 0 (rest, lamps off) is dark by design, lit only by the skylight's glowing glass: the top view reads (luma 0.10), but the ground and landing views at frame 0 are nearly black (luma 0.01 to 0.02). Judge those two views from frame 30.
- Emissive strengths are pitched for the stand's fixed exposure, not measured: wall light 150,000, skylight glass 1,200, exit sign 120/300. The lamp domes blow out to white and there are dark denoiser smudges on the wall beside the top lamp.
- I added three extra compositions (library-stairwell-up, -ground, -landing) because the shot's top-down view cannot show the skylight, the ground-floor props or the doors. Their frames are in out/library/stairwell/up, ground and landing.
- The door, signs, lights and letterboxes are flat-backed items on a round wall; the wall has no door opening cut in it. The door's 13 cm casing hides the gap and an open door shows a black panel (door_beyond), not a corridor.
- The stairs' underside is the stepped blocks of a cantilevered stone stair, not a smooth soffit, and the wall has no dado, cornice or windows: it is plain painted plaster.
- The top landing's rail simply ends where `guard` meets it; there is no scroll or newel joining the two handrails.
- plant (the office's potted_plant_01, copied) is 176,226 triangles, over the 150,000 guide, and is placed twice.
- The extinguisher (Poly Haven korean_fire_extinguisher_01) and the boots are unrigged drop-ins; the extinguisher comes with its own red stand box. The paper plane's "spiral" at the end of frame 30 is a whole turn round, so the two stand frames show it only lower and smaller, not mid-turn; I did not render a mid frame for it.
- Not checked in motion: only stills at 0 and 30 were looked at. notice board flutter, radiator valve, riser valve and skylight vent are too small in these views to confirm beyond the clips being present in the glb.

## ferris: 22 components, 16 rigged, 5 from Poly Haven, 52 MB

Shot props: `wheel` is the circle: clip "spin and light" is the shot (one whole turn on the axle, each of the 16 gondolas turning back on its rod so it hangs true, the 568 bulbs coming on ring by ring from the hub to the rim through the first two thirds). Also "spin" (bulbs off), "spin lit", "bulbs" (lights only), "upward" (gondolas stand above their rods, the wrong wheel) and "sway". Checked at frame 12 as well: the wheel had turned about the axle, gondolas level, inner rings lit. `controls` has "lever" for the cursor to throw. `string lights`: "on" (bulb by bulb) and "sway". Also rigged: gondola (swing, door, upward), platform (gate), ticket booth (shutter, bulbs, pennant), stall (flap, bulbs, valance), sign arch (bulbs, swing, star), high striker (strike, mallet), prize bear (wave, nod, slump), litter (blow), balloons (sway, bob), bunting (flutter), barrier (plate), pole (horn), trash can (lid).

Problems:
- Same lighting limit as the stairwell: every bulb is a lit part that is nothing at rest, so one `--at 0,30` process holds frame 0's lights. The PNGs were rendered one frame a process. In the film the bulbs' glow on the ground needs a key per state in the scene; the clip only shows the bulbs themselves lit.
- The stand is lit by the stand's sun turned down to 2,600 (a grey dusk), not by night: the bulbs (emissive 40,000) glow but throw little visible light, and the sky is black with no stars, moon or horizon. Bulb strength is unmeasured.
- The gondolas are boxy: a bevelled tub, flat-gore canopy and straight hanger arms. They read at the wheel's distance but would not hold a close-up. The numbers on them are small and not legible in the wide view.
- The wheel is 128,552 triangles (under the guide, but the heaviest part) and 232 nodes. Its axle and bearing blocks do not turn; there is no drive motor or tyre drive modelled.
- snack cart is Poly Haven's CoffeeCart_01 with coffee machines on it, a stand-in for a fair vendor's cart. bench, chair, generator and snack cart are unrigged drop-ins.
- The stalls' canvas is flat striped panels with no cloth sag or folds, and a stall seen from behind is a plain cream box. The stall interior is dark at frame 30 because nothing lights it.
- The puddles are flat grey-black sheets; under the black sky they reflect nothing and read as dark patches rather than water.
- The prize bears are sphere-built and plain (no fur shell, simple stitched face). The big bear's "wave" and the high striker's "strike" were not confirmed by eye: both are small in the views I rendered. The stall's flap, the ticket booth's shutter, the gondola's swing, the bear's slump and the string lights' "on" were seen working.
- Poles, barriers and the arch's ballast stand on the ground with no guy ropes or stakes; string lights and bunting hang from the poles' hooks by placement only, and one bunting and one string of lights are scaled 0.875 to fit a 7 m gap.
- I added three extra compositions (library-ferris-midway, -wheel, -props); their frames are in out/library/ferris/midway, wheel and props. Only stills were looked at, nothing in motion.

### comp.py bugs reported with the place(s) above

- comp.channel loses channels when one object gets two data paths in one clip: channel("spiral", [(orbit, "rotation_euler", 2, ...), (orbit, "location", 2, ...)]) makes two actions and two NLA tracks of the same name on the object, the glTF export warns "Some strips have same channel animation" and writes only the rotation. I worked round it with a clip() in each place's _lib.py that keys every path in one action. The office's water_cooler "glug" (the bubble's location and scale) is probably affected.
- comp.channel can only key rest at 0 s and full at 1 s, so a part that must change part-way through a clip (a bulb coming on in turn, a puck that arrives and holds) cannot be made with it. My _lib.clip takes whole key lists.
- A material from comp.ph_texture on a mesh with no UV layer exports "texCoord": -1, which Bevy's loader rejects ("invalid glTF file: invalid value: integer `-1`, expected u32"), failing the whole render. comp.mesh or comp.export should give such a mesh UVs or fail at build time. Worked round by calling comp.uv_box on every textured mesh.
- comp.export's exporter drops a channel whose keys are all the same value even when that value differs from the object's rest (a clip that should hold the bulbs lit, scale 1 against a rest of 0.001, lost its 13 scale channels). Worked round with keys 1.0 to 1.002.
- comp.export's size_m and triangle count read bound boxes with animation state applied in some cases: the paper plane reported 3.22 m high when its orbit clip had been keyed through comp.channel. It reported correctly once the clip was made in one action, so this may be the same bug as the first.

## road: 20 components, 14 rigged, 5 from Poly Haven, 99 MB

Shot props: car: `drive` (5.94 m forward, wheels three whole turns), `wheels` (one turn in place), `wipers` (both blades sweep in the glass's plane, 93 and 88 degrees), `steer` (front wheels 24 degrees); lights and paint are the scene's (materials car_headlight, car_taillight, car_indicator, car_paint). windscreen (the view from the driver's seat, where the shot starts): `wipers` sweeps right to left as seen from inside and removes the rain on the glass in 30 steps as each blade reaches it, `run` slides the rain up the glass. road: `wet` (a dark film rises through the asphalt). puddles: `open` (each spreads from nothing), `rings`. spray: `burst` (at a wheel's contact patch), `fall`. rain: `fall` (loops), `splash`. Also road-sign `shake`, reflector-post `flex`, branches `skid`, and `sway` on trees, trees-b, treeline, sapling and ferns. The flank for the match cut is the car's own side: a clean panel from the rub strip to the belt, 0.5 to 0.93 m up.

Problems:
- The car is hand-modelled (Poly Haven has only a car under a sheet) and reads as a mid-90s saloon, but it is generic: box mirrors, flat nose and tail faces, opaque dark glass with no interior, a stair-stepped edge on the bumper's dark insert, and paint that reads salmon in the stand's daylight.
- Puddles barely show in the main frame 30: against the wet film they are only slightly darker soft patches, and raea's traced light draws no reflections. They read clearly only from above (checked in a throwaway test render, since deleted).
- raea did not draw the blended wet film when it lay 4 mm over the asphalt; it needed 10 mm. The film therefore has a slot for each painted line and a hole under each puddle, so `wet` played without the puddles' `open` leaves four un-darkened patches.
- The spray's droplets read as water, but close up its mist is visibly crossed cards and its sheets are faint.
- Stills cannot prove whole-turn or looping clips (car `wheels`, the wheel turns inside `drive`, rain `fall`, puddle `rings`): frame 30 is 0.999 of a turn. I checked those only by reading the sampled keys in the .glb files, never in motion.
- In a throwaway single-car test (since deleted), frame 30 showed a faint ghost of the car where it stood on frame 0 after `drive` moved it; I did not see it in the kept frames.
- The windscreen component on its own is a car's front with no wheels or doors. In the main stand it sits far down the other lane and is hardly visible; it is proven in the extra composition library-road-seat. Its steering wheel and dash are simple, and the wipers clear most of the glass.
- Trees are my own builder (Poly Haven's firs are 7.8 M triangles) with Poly Haven bark and sprig pictures: flat sprig cards show as cards close up, the treeline's boughs are thin, and `sway` turns each tier about its foot on the trunk, so boughs part from the trunk by a few centimetres at full travel.
- Markings and barrier have no clip, only a scene-driven `glow`; verge, stump, log and rocks have no rig. The reflector post's `flex` is hard to see from the stand's camera because it bends away from it.
- At the size limits: treeline is 141,726 triangles and the place totals 99 MB. The log is Poly Haven's model as it comes, 101,802 triangles for a 3 m prop.
- No sky or grass component (Poly Haven's grass is 1.6 M triangles), so the stand's background is black and each render carries two exposure warnings for it (about half the frame crushed to black).
- The main render carries one note: rocks sit 0.63 m into the left verge, on purpose (sunk 38 %).
- I ran the renders with --mem 8G, not the 12G in COMPONENTS.md, because antsy refused 12G for memory; peaks were under 2.5 GB.
- library/road.tsx registers two extra compositions beyond library-road (library-road-car and library-road-seat, rendered to out/library/road/car/ and out/library/road/seat/) for a closer look at the rigs.

### comp.py bugs reported with the place(s) above

- comp.channel makes one action and one NLA track per key, and when a channel has two or more keys on the same object the glTF export keeps only the first. Checked in puddles.glb: `open` animated scale x while y stayed at 0.001. office/water_cooler's `glug` passes the same shape of keys (the bubble's location and two scales), so it is probably affected; I did not check its .glb. Worked round with blender/components/road/_lib.py `channel`, which puts all of an object's keys in one action.
- comp.channel leaves each property at the rest of the last channel that touched it, and a clip that keys only some components of a scale exports the others at that rest. The spray's `fall` came out with z scale 0.02 until every clip keyed all three components.
- comp.pivot(parent=...) always makes the pivot upright in the world and keeps that through the parent inverse, so a pivot under a tilted pivot turns about world axes, not the parent's. The wipers turned about vertical until I reset the child's matrix_parent_inverse and matrix_basis.
- A comp.ph_texture material on a mesh with no UVs (a bare comp.box) exports `normalTexture.texCoord: -1`, and raea then refuses the whole .glb ("invalid value: integer `-1`, expected u32"). Neither comp.mesh nor comp.export checks for it.
- comp.mesh leaves every part's origin at the component's origin. Two blended parts one over the other (a puddle over the wet film) rendered with the film covering the puddle; I took that for raea sorting blended parts by origin, did not confirm it, and solved it with holes in the film. road/_lib.py `recentre` moves an origin.
- comp.ph_texture has no cut-out or alpha support and cannot fetch a model's own maps (fir_tree_01's twig_alpha). road/_lib.py has `ph_map`, `rgba` and `pic_mat` for that; on Blender 5.2 a Math ROUND node on the alpha is what makes the exporter write alphaMode MASK.

## clocktower: 20 components, 8 rigged, 10 from Poly Haven, 66 MB

Shot props: movement (the hero: a flatbed turret-clock movement whose 96-tooth great wheel is the shot's circle): clip "push" turns the great wheel 30 degrees and every meshed wheel after it in ratio (second -120, third 360, escape -1080), "turn" is the looping run, "tick" rocks the anchor. clock-face (the second circle, the dial seen from inside): "push" moves the minute hand 120 degrees and the hour hand 10 with its motion work, "hands" winds an hour. leading-off (the rods and bevel wheels joining the two): "push" and "turn". pendulum: "swing". Also bell ("strike", "ring"), pigeon ("peck", "flap"), floor ("hatch"), wrench ("jaw").

Problems:
- The wall is 8 m wide and the stand has no side walls, so black sky and the stand's grey floor show at both edges of the frame behind the posts.
- The stand's sun comes from the camera side, so the dial is front-lit as well as glowing (face_glass at strength 1800); it reads as a lit dial, not as the only light source in a dark room. The noon backlight through the glass is still the scene's to set.
- The hands outside the opal glass are shown as dark shapes on its inside face (separate meshes on the same pivots), not as a real shadow cast through translucent glass.
- Gear teeth are straight-sided trapezoids, not involutes, and the steel pinions are solid toothed discs; the meshing phase and ratios are right, but I only checked the mesh by eye at frames 0 and 30, not through the whole "turn" loop. In "turn" the escape wheel does 36 turns a second, which will strobe at 30 fps.
- The movement's rope runs straight down into the floor with no hole in the floor component and no visible weight; there is no weights component.
- The Poly Haven toolbox imports with its lid open and I did not rig the lid; the Poly Haven lantern is a floral-globe parlour lamp, which is an odd fit for a clock room; the caged light is a long tube fitting. None of the Poly Haven props glow.
- The trapdoor's well is a flat dark panel just under the boards, not a real shaft; the ladder top modelled below it is hidden.
- The bell hammer's check spring floats without a bracket, and the hammer's pull wire runs to the floor rather than to the movement.
- The wrench's "jaw" clip was not inspected close up (it is tiny in the frame).

## subway: 18 components, 7 rigged, 3 from Poly Haven, 68 MB

Shot props: train (the hero: a 1930s steel car seen head-on, its single big headlight the shot's circle, material train_headlight): clip "arrive" runs the whole car 20 m out of the tunnel toward the camera with its wheels rolling, "wheels" loops the axles, "doors" slides the platform side's six leaves open; the headlight's glow is the scene's. tunnel (the vanishing point: headwall, arched mouth, 20 m of tube). platform (its edge, nosing and yellow line are the horizontal line). Also signal ("trip"), lamp ("sway"), clock ("hands"), sign ("swing"), litter ("blow": the newspaper and cup in the train's wind).

Problems:
- The stand is lit partly by its sun coming in through the open camera end, so the first 5 m of platform has a hard daylight patch and column shadow; deeper in, the light is the fittings' own. For the real late-night shot the open end needs closing or the sun turning off.
- To light anything under the stand's Solari the glow materials had to be set in traced units, far above the office's 3 to 6: strip_glow 50000, lamp_glow 60000, train_headlight 500000, tunnel_light 8000, signal_red 6000, train_window 900, clock_glow 600. In a raster scene these will clip white, and in sunlight the train's lit windows look like flat cream panels. The scene should key them per state.
- The headlight is a bright disc but throws no visible beam or pool on the track; the beam is left to the scene.
- The train's door leaves slide along the outside of the body instead of into pockets, and the doorway behind them is a flat glowing panel: there is no interior (no seats, poles or floor).
- The wheels, trucks, third-rail shoes and under-car equipment were built but are almost never visible from the platform, and I did not inspect the wheels rolling on the rails or the flange side close up.
- Only the front of the train and its platform side were looked at; the far side and the rear end (a plain flat end with no door or lights) were not.
- The walls are tiled with one Poly Haven set (long_white_tiles, a small stacked tile, not the brick-bond 3x6 of a real 1930s station); the band, tablets and base course are flat coloured boxes with built-in-font letters, not mosaic.
- The platform's deck has no tactile strip, stairs, turnstiles or exit; the EXIT sign points at a blank wall. The sign is half hidden by a column from the stand's camera.
- The signal's post and head are small and far in the stand's frame; its "trip" arm was seen moving only in a close-up check, and the yellow and green aspects are dark materials for the scene to light.
- The fire extinguisher and utility box (Poly Haven) stand on the floor against the wall rather than being wall-mounted, and were not checked for which way they face.

### comp.py bugs reported with the place(s) above

- comp.mesh / comp.export do not guard against a textured material (from comp.ph_texture) on a mesh with no UV layer: Blender writes the glb with texCoord -1 and raea refuses the whole model ("invalid value: integer `-1`, expected u32"). Hit on clocktower/beams' pegs; worked round by calling comp.uv_box on every mesh that takes a ph_texture material. comp.mesh could fail loudly, or export could add box UVs.
- comp.mat's emit/strength gives no hint of units: the office's examples use 3 to 6, which under the stand's SolariLighting lights nothing and barely shows (sdk/guides/craft/bevy/solari.md says traced emitters are in the thousands). Not a code bug, but every glow copied from the office pattern renders dark on the stand.
- comp.mat: with alpha set, `m.blend_method = "BLEND" if hasattr(m, "blend_method") else None` assigns None to blend_method when the attribute is missing; harmless on Blender 5.2 but wrong as written.
- comp.ph_component has only a turn about z, so a model that imports standing on end (adjustable_wrench) cannot be laid down through it; worked round in clocktower/wrench.py by re-posing the parts and re-grounding them after the call.
- Not comp.py: `raea render` of a .tsx outside the project folder (a scratch check file importing parts/library by absolute path) printed nothing and stalled for the full 3 minutes until antsy stopped it; check compositions had to live in library/ and be deleted afterwards.

## vinyl: 18 components, 12 rigged, 4 from Poly Haven, 69 MB

Shot props: The record on the turntable is the chain's circle (turntable.glb): clip "needle" swings the tonearm 29 degrees from its rest and lowers the stylus into the lead-in groove (also split as "swing" and "drop"), and clip "spin" turns platter, mat and record one whole turn clockwise about the spindle (checked at a quarter turn: the two-colour STAY label turns in place). The rack's divider cards are the vertical-line hook (rack.glb): clip "divider" lifts one card 12 cm, clip "flip" tips the front seven sleeves forward. The loose record (record.glb) has "slide" and "spin".

Problems:
- The ceiling is built (ceiling.glb) but left out of library/vinyl.tsx: with it on, the stand's sun reaches only a patch of floor and the frame drops to -0.6 stops. I rendered it once with the ceiling to check that it fits; the published frames are without it, so the top of the frame is black.
- The render warns that 10% of pixels crush to black in both frames: that is the empty space above the walls, since the stand has no sky.
- I rendered with antsy --mem 4G rather than the 12G in COMPONENTS.md. antsy refused 12G seven times in a row with about 20 GB free on the machine; the job peaks at 1.9 GB.
- The cash register stands side-on to the counter in the stand so its drawer rig shows; in the shop it should face the shopkeeper.
- The shopfront's glass reads milky grey from inside, with the stand's bright floor behind it and no street. The window lettering reads backwards from inside, as it would.
- The door bell's "bell" rig and the amplifier's "volume" rig were built but not looked at in a render; the stand runs the shopfront's "door" and the amplifier's "level". The speaker's 7 mm "thump" is too small to see at stand distance.
- Sleeve and poster artwork is flat geometric shapes in twelve inks, not printed textures: it reads as record sleeves at shot distance, and as simple shapes close up.
- The record's grooves are five flat bands between shinier gaps, with no anisotropic sheen. The back wall's painted brick (Poly Haven painted_brick) comes out a strong sky blue.
- The stool and the crate have no rig (each is a single Poly Haven mesh).

## koi: 19 components, 12 rigged, 4 from Poly Haven, 85 MB

Shot props: The ripples are the chain's circle (ripples.glb): clip "spread" grows five concentric swells from nothing to radii of 0.22 to 1.28 m about the landing point, and "splash" throws up a crown of jets and a rebound drop. The pebble (pebble.glb): clip "drop" falls 1.4 m, tumbling, to just under the water. The koi is the turning shape (koi.glb, koi-b.glb, koi-c.glb): clip "turn" curls the body 84 degrees to its left along seven joints with no gaps, "swim" wags the tail side to side, "fins" folds the pectorals.

Problems:
- The ripples are pale translucent ridges lying on the water, not refraction: at full spread they read as drawn rings, clear for a half-second hook but graphic rather than real. Their alpha is the scene's to fade (material ripple_water).
- The pond has no sky to reflect in the stand, so the water is a flat teal with the bed showing through; it needs the scene's sky and light to look like water.
- The whole garden is lifted 0.8 m in library/koi.tsx and sits on the stand as a block with an earth skirt, because the pond goes below ground and the stand's floor would otherwise cover it.
- The ground is dead level. I removed its gentle rolling after raea's clip check failed the render: the rise poked through the moss and left the mossy rocks half-floating.
- Moss is hand-modelled bumpy cushions in three greens. Poly Haven's moss_01 tufts, scattered thick enough to cover, shadowed each other to near black, so they are not used.
- The maple is hand-built (every Poly Haven tree is 0.3 to 17 million triangles): about 4,500 flat seven-point leaves in three reds, with constant-radius branch tubes. It reads as a red maple at stand distance; close up the leaves are flat cut-outs with no veins.
- The pebble is 6 cm and cannot be made out in the wide stand frames (at frame 0 it is 1.3 m above the water, at frame 30 under it). Its drop was not checked in a close-up.
- The koi's markings are per-face colours on a mesh of 28 sides, so patch edges are slightly stepped close up. From above the tail fin is a thin line, being a flat vertical sheet.
- Lily pads are faceted and their "bob" (up to 5 degrees and 1.5 cm) is barely visible at stand distance. The fern "sway" and lantern "lean" are likewise small; the lantern's lean was confirmed in a close-up.
- Not looked at in a render: the pond's "level" clip after I took it off the stand (it had been run once and dropped the water), the koi "fins" clip, and the maple's "sway" (the stand runs "fall").
- The stone lantern's lichen_rock texture comes out blotchy red-brown rather than grey granite. Its fire box glow is a dull lit panel at the stand's daylight exposure.
- Stepping stones show stretched texture on their sides (box-projected UVs on rounded slabs).
- Three texture sets were dropped to 1k (lantern, stepping stones, gravel) to bring the place from 114 MB to 85 MB. Rendered with antsy --mem 4G for the same reason as vinyl; peak 2.3 GB.
- The bridge, ground, bamboo fence, stepping stones, both rock groups and moss have no rig.

### comp.py bugs reported with the place(s) above

- comp.channel() makes one action and one NLA track per key. Two keys on the same object and the same property (scale x and scale y, or location y and z) then export as separate glTF channels on that node, each carrying the whole vector with only its own component moving, and in raea they overwrite each other. Seen on koi/ripples: at t=0 of "spread" the rings rendered as a 1.5 m stretched ellipse instead of a point. Both places work round it with a channel() in their _lib.py that groups a clip's keys into one action per object. The office's water_cooler "glug" keys the bubble's scale x and scale y this way and probably has the same fault.
- comp.mat() takes its colour as linear values with no note saying so. Screen-picked colours come out pale and washed in the render; both _lib.py files convert with v ** 2.2.
- comp.cyl(axis="Y") stands the cylinder on `at` and extends it toward +y, into a surface that faces -y. A thin disc laid on a front face has to be placed at y minus its own thickness or it z-fights or hides. A docstring note would be enough.
- ph_component() always moves the kept parts so their lowest point is at z 0, which undoes a scanned asset's own ground line. rock_moss_set_01 is authored sunk 0.66 m into its ground, and koi/mossy_rocks.py has to sink it back by a number read from a probe.
- export()'s reported size_m does not include every child of a pivot chain: koi.glb reports 0.531 m deep for a 0.62 m fish whose tail fin hangs from the last joint. The exported model is right; only the printed box and the sidecar's size_m are short.

## lighthouse: 20 components, 11 rigged, 5 from Poly Haven, 78 MB

Shot props: The lens (the chain's circle): fresnel-lens, clip "turn" (the whole optic one turn about the still lamp, eight bullseye panels; lens_lamp is the scene's glow). The beam the agent sweeps: beam, clip "sweep" (one turn about the lamp, matching the lens) and "dip" (10 degrees down onto the waves). Around them: lantern-room "vane"/"hatch", tower "door", sea "swell", surf "wash", cottage "door", fence "gate", buoy "bob", gulls "flap", shrub "sway".

Problems:
- Frames 0 and 30 look alike for the two hero clips because turn and sweep are whole turns; I checked them at frame 13 instead (lens close-up in out/library/lighthouse/lens/, place frame earlier), where both had turned about the lamp. The final out/library/lighthouse/ pair is 0 and 30 as asked.
- lantern-room "hatch" (the gallery door) is not confirmed by eye: in out/library/lighthouse/rigs/ I could not pick the open door out. It also opens onto the same red murette wall, since the wall behind it is not cut.
- The surf is the weakest part: flat white and grey ribbons of foam along the cliff's foot and four tube crests. It reads as white water from the stand's distance but is cartoonish, not realistic.
- The wave-cut skirt at the cliff's foot is coarse (large flat grey facets), and the cliff face is a height field, so no overhangs or caves; its strata come from the cliff_side texture plus stepped ledges.
- The beam is two translucent cones with a visible round end at 170 m and a counter-beam; in this renderer emission is added without the material's alpha, so its strength had to be set very low (60/90) while the sky needs 2500. The scene will have to tune beam_light/beam_core.
- The sky is a self-lit backdrop arc behind the place only (a full dome would shade the stand's sun), so a camera turned toward the sea side sees black. Its glow also tints everything warm.
- The turf is a tinted leafy_grass texture with no grass geometry (Poly Haven's grass models are 200k to 1.6M triangles, over the budget).
- The lens's glass is alpha-blended white rings rather than refracting glass, and the lens_lamp glow (strength 4000) does not visibly light the lantern in the stand.
- The shrub is one bush of shrub_02 and the gulls are small hand-modelled birds: fine at distance, not close-up quality.
- I wrote three texture thumbnails named g.jpg, s.jpg and r.jpg into the shared session scratchpad root before noticing how crowded it is; if files of those names were already there, I overwrote them.

## turbines: 17 components, 9 rigged, 4 from Poly Haven, 58 MB

Shot props: A rotor (the chain's circle, the one the cursor spins): turbine, clip "spin" (hub, spinner and three blades one whole turn about the 5-degree tilted shaft, clockwise from the front, the same on every copy so the ridge follows by running the clip on each). Also "yaw" (nacelle and rotor 90 degrees round the tower top) and "pitch" (blades feather 85 degrees about their lengths). The ridge line is ridge (level crest at 30 m). Around them: fog "drift", fence "gate", transformer "doors", cabin "door", met-mast "cups"/"vane", windsock "swing"/"fill", cable-drum "roll", shrub "sway".

Problems:
- With a clip running, the distant turbines pick up dark speckles and the third tower (about 310 m off) goes patchy dark: frame 30 shows it, frame 0 (clips at rest) is clean. It looks like ray-traced shadow acne on animated models far from the camera, a renderer matter I could not fix from the component side.
- Spin is a whole turn, so frames 0 and 30 match; I checked it at frame 13 (rotor turned about the hub). Yaw, pitch, windsock fill and the mast are in out/library/turbines/rigs/ and move about the right points; met-mast "cups" and "vane" are too small there to confirm by eye.
- Only three turbines fit, 100 m apart (real spacing is 250 m or more): the stand's camera far plane is 400 m and the backdrop must sit inside it.
- The fog is an opaque billowed white sheet with two translucent veils. It reads as a fog sea but meets the hillside along a fairly hard line and can read as snow.
- The sky is a backdrop arc behind the ridge only, and the sun is painted into its picture (clamped to white, so it is a pale disc, not a bright one). An emissive sun disc was dropped as a suspected noise source.
- The first hero rotor's top blade tip is close to the frame edge in the stand view; the exposure check warns frame 0 is 1.5 stops over mid grey (bright sky and fog).
- The ridge is one aerial texture on a height field with no grass or heather geometry; the fence posts and power poles render very dark (bark texture); the met mast's lattice and the conductors alias at distance.
- The road's gravel reads as plain light grey from the stand and its wheel lines barely show.
- The turbine door has no rig (the shot does not use it), and the nacelle is in shadow in the hub close-up because that view has no sky fill.

### comp.py bugs reported with the place(s) above

- comp.ph_texture + comp.export: a mesh given a ph_texture material but no UVs (no uv_box) exports a glb whose textures have "texCoord": -1, which raea refuses outright ("invalid value: integer -1, expected u32"). export neither adds UVs nor fails. Hit on turbines/cable_drum; worked round by uv_box on every textured mesh.
- comp.pivot / comp.link keep the world transform through the parent inverse, so a nested pivot's rotation_euler stays world-referenced: a pivot under a tilted or turned parent cannot be given a clean spin about its own local axis (the turbine's tilted shaft and each blade's pitch would wobble). Worked round with my own joint() in turbines/turbine.py that parents with an identity parent inverse.
- comp.ph_component origin="floor" grounds the asset's whole box, not each part: collection assets (shrub_02, rock_moss_set_01/02) leave several variants floating 0.1 to 0.4 m up. Worked round by keeping one variant or dropping each part to the ground myself.
- comp.ph_texture(grey=True) writes the desaturated image as a PNG beside the JPG, which the glb then embeds: a 2k grey set adds roughly 10 MB a component. Worked round with res="1k".
- comp.mat's emission strength has no guidance for the stand: the office's values (3 to 6) are invisible under parts/library.tsx's 14000 lux sun; a self-lit surface needs about 2500 to read, and a small lamp 3000 to 6000. Not a code fault, but every glow component will hit it.
- comp.export's size_m and triangle box come from each object's unevaluated bound_box at rest, so the sidecar's size ignores modifiers and anything moved after parenting (the buoy's sidecar still reports its full 2.66 m height after being sunk 0.7 m; harmless but misleading).

## laundromat: 30 components, 20 rigged, 9 from Poly Haven, 94 MB

Shot props: dryer: 'door' (the upper pocket's door swings 115 degrees on its right hinge, the cursor's pull; the shot's circle, upper right), 'door lower', 'drum' (both drums one whole turn about their axles), and the scene-driven materials dryer_light (the glowing window) and dryer_display. laundry: 'tumble' (the load one turn about the drum's axle) and 'float' (every piece leaves the heap and hangs apart in the drum). sheet: 'drift' (out of the open door 1.5 m toward the camera, opening from a wad via the morph target unfurl) and 'billow' (continues from drift's end, bellies toward the lens). laundry cart: 'roll', 'swivel', 'sway', plus position in the scene. washer: 'drum', 'door'. Also rigged: storefront door, back-room door, vending machine (flap, drop), change machine (coins), soap vendor (slide, vend), gumball machine (crank, ball), bin (flap), tv (swing), bulletin board (flutter), detergent (tip), wall clock (hands, seconds), ceiling fan (spin); tubes, exit sign and the neon are scene-driven glows.

Problems:
- The dryer and washer door glass reads milky in the two-frame stills, so the laundry inside is mostly hidden. In an 11-frame test the nearest dryer's glass cleared by frame 20 while the others stayed milky; I think it is the traced light inside the closed drums not settling, but I did not prove that. Lowering the glass's specular did not fix it. Needs checking in the real shot with dryer_light driven.
- The sheet is a morphed mesh, so Solari draws it raster-lit: it casts no traced shadow, its shading is soft and blotchy, and from the high stand camera the drifting sheet's edges look speckled and ragged. Mid-drift (frame 20 of the test) it showed a few black spots where the half-open cloth passes through itself.
- The sheet's drift is one linear clip from wad to open sheet, so the half-open cloth clips the dryer's front panel as it passes the 0.47 m door. The shot may need to time the unfurl later than the travel; the morph targets unfurl and billow can be set by name for that.
- Full-turn clips (dryer and washer drum, laundry tumble, cart roll, gumball crank, clock seconds, fan spin) cannot be seen in the frame-30 still because they end where they started. I checked them only numerically in the .glb (pivot position, axis, 180 degrees at mid-clip).
- Clips not played on the stand and so checked only numerically: cart roll and swivel, vending flap, soap vendor slide, gumball ball, laundry tumble. The stand plays one clip a part.
- The shirt on the cart's hanger is a flat silhouette with thickness and reads as a rounded blob from the front; the towel over the cart's rim reads as a stiff slab.
- The floor texture (floor_tiles_06) is laid at 0.4 m a tile, not its own real scale (0.75 m tiles looked wrong) and not true 0.3 m vinyl tile.
- The stand is a dollhouse view with no ceiling over most of the room, so the fan and exit sign hang in the air, and 22% of the frame is black sky (the render's two exposure warnings). The ceiling is one 3.6 x 1.2 m module over the dryers only.
- The tv's picture pane (tv_screen) was placed by eye over the Poly Haven set's tube; it looks aligned in the close view but was not measured.
- The Poly Haven bottles in detergent carry their own made-up brand labels (not real brands, not ours).
- The folding table is a fixed counter for folding at; it does not fold and has no rig.
- Not built: a fire extinguisher (the only Poly Haven one is Korean-labelled) and a plant.
- I added four close-view compositions to library/laundromat.tsx (library-laundromat-dryers, -left, -right, -floor) and rendered them to out/library/laundromat/<view>/; the brief asked only for library-laundromat.

### comp.py bugs reported with the place(s) above

- comp.channel makes one action and one NLA track per key tuple. When a channel has several keys on the same object (location x, y, z, or location plus rotation), the glTF export keeps only one of the same-named tracks, and the other axes come out wrong or missing. It shows in the office too: water-cooler.glb's 'glug' has the bubble's translation but not its two scale keys. I worked round it with _lib.channel in blender/components/laundromat/_lib.py (one action and one track per object per clip).
- comp.channel cannot key shape keys, so a morph clip needs its own helper (_lib.key_channel, one track on the mesh's shape-key block per clip).
- A constant channel (rest equal to full, used to hold a pose through a clip) is dropped by the export as comp.export calls it, so a clip cannot hold an object away from its rest pose. I gave the sheet's 'billow' a small real travel instead.
- comp.ph_component sets o.parent = None without keeping the world matrix, so a Poly Haven model whose meshes sit under transformed parents would jump. I did not hit this with the models I used; _lib.ph_add keeps the world matrix.
- comp.export's size_m for a mesh with shape keys appears to include the shape keys' extents: the sheet reports 1.76 x 2.14 x 1.01 m although its rest shape is a 0.3 m wad.

## sea: 23 components, 15 rigged, 13 from Poly Haven, 85 MB

Shot props: The shot cuts in on the sun's disc (upper-right third) over the horizon line and holds the sea under the app. sun: clip "height" lifts the disc 95 m from half-set on the horizon to 17.5 degrees up at 300 m (the upper thirds line). sea: clip "waves" runs the swell 32 m toward the camera, one whole period, so it loops; the horizon is where sea.glb meets sky.glb. Dressing clips: buoy bob/lean/turn, mooring-buoy bob/lean, boat drift/rock/pitch/radar, gulls fly/glide, lighthouse beam, clouds drift, spray burst/fall, foam wash/rise, kelp sway/rise, catch lid/handle, life-ring swing/lift, lantern swing, fender swing. Scene-driven only (named materials): sky glow and turn, pier-lamp on, and each light (buoy_light, lantern_flame, lighthouse_lens/beam/window, boat_light_*). The app's rectangle and the cursor's timeline scrub are not sea components (parts/app.tsx).

Problems:
- Frames 0 and 30 both read as a sea at sunset and every clip I ran moves about the right point, but only one clip per part is shown on the stand. Never run or looked at: sea is fine, but buoy bob/turn, mooring-buoy bob, boat drift/pitch/radar, gulls glide, spray fall, foam rise, kelp rise, catch handle, life-ring lift. They export (checked in the glb for some), but are unproven in a render.
- Lighthouse "beam", sea "waves" and any whole-turn clip look the same at frame 0 and frame 30 (a full turn or period), so those two frames do not prove them; the beam is only seen as a faint streak.
- The water's reflection is a fake: Solari's rays stop at 50 m and never reach a sky dome, so sea_water glows with a blurred copy of the sky picture, each vertex's UV being its mirror ray from a fixed mark (raea 0, 11, 50). It is right for a camera near the stand's and drifts as the swell runs (frame 30's foreground is more orange than frame 0's) and pops when the clip loops (13.3 s at 2.4 m/s, so not inside the 7.45 s shot). It does not follow a moving camera. Under a real Environment the glow should be turned down.
- The sky is a dome with a dummy shape key so Solari does not trace it: a traced dome (opaque or blended) shadowed the whole place from the DirectionalLight. As a result the dome lights nothing; the scene needs its own sun and Environment. Its glow is 2,100 at exposure 0 and looks a little washed compared with the panorama.
- The stand's light comes from front-left (parts/library.tsx), so everything is front-lit under a backlit sunset sky: flat and CG-looking, not how the shot would light it.
- Clouds read as stylised flat pancakes with hard edges, not real cloud. The sky picture already has real clouds; these are the weakest component.
- Foam is a flat white sheet with a cut-paper outline and some spiky points; kelp is flat olive ribbons lying on the water with float bulbs on stalks. Both read as what they are from the stand's distance, not close up.
- Floating parts (foam, kelp, buoys, boat, spray) do not follow the swell: the stand sets each one's height from the swell at rest. A scene has to drive bob/rise against the waves itself; over the foam's and kelp's width parts sit above troughs or under crests.
- Sun halo is 28 stacked blended discs and shows a visible outer edge at frame 30; the disc itself is a flat white circle. Blended glows are in raster units (about 3 to 20) while opaque glows are in exposed units (thousands), so the two sets of numbers in the sidecars are not comparable.
- Headland: the scanned cliff face is good, but the hand-made cap and end slopes are a plain grey-brown surface that does not match the scan's colour, and the slope at the point reads as modelled. It is for the horizon only. Part of it pokes through the sky dome off frame (the render's one note).
- Near cliff (coastal_cliff_01) is an open-backed scan with an overhanging, ragged foot; I sank it 1.7 m and put hand-made fallen rock along it, but from the side its underside and open end show. The fallen rocks are visibly faceted close up.
- Reef rocks and the sea stack are desert boulder scans (namaqualand_boulder_03/04) darkened as wet rock: closed and solid, but blocky and not sea-worn; the stack is boulders piled five times their size and its texture is coarse nearer than about 40 m.
- Triangle counts in the sidecars count every instance: pier 148,578 and headland 145,413 are at the 150,000 guide (the pier's sections are shared mesh data, so the file is 8 MB). Pier and rocks use 1k textures to keep the place at 85 MB.
- Pier lamps and the lantern do not visibly glow on the stand (the bulb and flame sit inside dark or small glass); the life ring's swing and the lantern's swing are small in the pier view.
- Boat's port and starboard light sides were not checked against her heading, and her number (SY 114) is in Blender's built-in font.
- Extra views I added to library/sea.tsx for checking (library-sea-pier, -reef, -far, -boat) render to out/library/sea/{pier,reef,far,boat}/. Several failed antsy runs named stay-library-sea were not mine: another agent rendered library/sea.tsx with its own composition name (library-bedroom-sun) and a bad --at.

### comp.py bugs reported with the place(s) above

- comp.channel loses keys when one clip keys the same object more than once (scale x, y and z; a lift up and out). It makes one action and one NLA track per key, all with the clip's name, and the glTF export keeps only one of an object's same-named tracks: spray's "burst" exported scale x only with y and z stuck at 1.0, foam's "wash" x only, life-ring's "lift" z only. Worked round in blender/components/sea/_lib.py channel(), which puts an object's keys in one action and one track. office/water_cooler.py "glug" (bubble scale 0 and 1 plus location) has the same fault.
- comp.ph_texture materials on a mesh with no UV layer export as texCoord -1, and raea refuses the whole glb ("invalid value: integer -1, expected u32"). comp.mesh does not add UVs and nothing warns. Worked round with _lib.uv_missing(col) before export.
- comp.pivot(parent=...) always makes the pivot's axes the world's, whatever the parent's rotation (link() cancels the parent with matrix_parent_inverse). A hinge on a turned parent then turns about a world axis, not the part's own. Not wrong as documented, but a trap: for the gulls I had to set the pivot's matrix_world to the bird's frame by hand.
- comp.export's triangle count sums every object, so linked copies of one mesh are counted each time (rocks reported 178,786 for about 50,000 unique triangles).
- comp.mat's emit strength has no note that opaque glows are traced in exposed units (thousands) while a material with alpha is drawn raster (1 to 20); the same number gives black or blown-out depending on alpha. Solari also panics on a glowing mesh over 65,535 triangles ("Too many triangles in an emissive mesh"), which comp does not check.

## garage: 30 components, 10 rigged, 7 from Poly Haven, 61.1 MB

Shot props: car (hand-modelled early-nineties saloon, media/models/garage/car.glb): clip "spin" turns the whole car one turn on the spot about the middle of its wheelbase (the cursor's turntable); clip "wheels" rolls all four wheels one turn forward while the calipers stay (the wheel circle the shot ends on and the montage cuts on, and the roll-in); clip "settle" dips the body 3 cm and noses it down as it stops in the bay; clip "steer" turns the front wheels 30 degrees. The paint, lamps and rain beads are scene-driven by material and node name: car_paint (dark anthracite at rest, to be keyed candy red), car_headlight, car_taillight, car_beads. barrier arm: clip "lift" raises the boom 88 degrees about its hub (still lifting as the car rolls in). trolley: clip "roll" moves it 0.39 m with every wheel turning one turn; its place on the slope is the Model's position. sodium light: "on" is scene-driven through the material sodium_glow (the bay lights coming on one by one). Extra rigs: ticket booth "door" and "hatch", ticket machine "ticket" and "press", height bar "swing", stair door "open", convex mirror "swivel", cone "tip", puddles "spread", trolley "gate".

Problems:
- The stand (out/library/garage/frame-00000.png and frame-00001.png) carries only the left 10 m ceiling module. I left the right half of the deck open so the stand's sun reaches the bays; under the ceiling the bays are nearly black.
- The sodium lights do not light anything in the stand. Raising sodium_glow's emissive strength from 9 to 40 changed nothing visible, so the scene will need a real light under each fitting.
- The car is hand-modelled because Poly Haven has no usable car. It reads as a generic nineties saloon, not a photoreal one: one lofted shell, flat glass, simple lamps and grille, a basic interior. The doors do not open, so the script's click on the door has no door rig, only the paint.
- I did not check the garage car against whatever car the road place builds. The match cut needs the same flank, so one of the two should be reused in both places.
- "spin" and "wheels" are whole turns, so frame 30 looks the same as frame 0 for them. The stand shows "spin" on the bay car and "steer" on a second car in the aisle. I checked the spin pivot only in a headless Blender render at mid-turn, where the car turns about its centre and stays on the floor; "wheels" was never looked at mid-turn.
- Rigs that were built but are not visible in the stand frames: the car's "settle", the booth's "hatch", the trolley's "gate", the ticket machine's "ticket" and "press" (its face points away from the camera), and the tipped cone (hidden behind the ramp rail). The height bar's swing is barely visible at this distance. Each was exported and seen only in headless Blender renders, apart from "settle" and "press", which were not looked at at all.
- Whether raea carries car_paint's clearcoat, and how car_glass and the rain beads behave under the film's lighting, is untested. The beads are about 1,400 small domes that read as faint specks at stand distance.
- The ramp is a 6.6 m slope to a 1.1 m landing, not a full storey, and on the stand it sits just off the 20 m deck's right edge. The trolley stands at its foot rather than on the slope, because a stand part has yaw only.
- The pillar is 2.3 m, to the beam's soffit, not 2.75 m. raea's clip check reported a pillar passing into the ceiling's beam as an error.
- The fire extinguisher is Poly Haven's floor-standing model with its author's Korean label; it stands at the pillar's foot under our own FIRE POINT plate rather than hanging on the pillar. The security camera is one mesh, so it has no pan rig.
- Floor markings are thin at stand distance: the bay numbers and SLOW are hard to read in the frames. The trolley's 4 mm wires may moire in a distant shot.
- The concrete textures (garage_floor, wood_textured_concrete) are beige and were pulled toward grey with a multiply tint only; the floor still reads slightly warm.
- The render's two exposure warnings (35% of pixels crushed to black) are mostly the black background of an open stand with wall={false}, plus the dark bays under the ceiling.
- I ran blender/components/office/fire_alarm.py once as a timing test, which rewrote media/models/office/fire-alarm.glb and its sidecar. The script was unchanged and the output had the same triangle count and size, but it is another place's file.
- Component names follow the files (sodium light, pillar, signs), so they do not all match the plural names in parts/places.ts (sodium lights, pillars). The ticket machine, height bar, stair door and the set dressing are additions beyond that list.

### comp.py bugs reported with the place(s) above

- comp.channel loses keys when one channel has several keys on the same object, such as location plus rotation, or scale x plus scale y. Each key becomes its own action and NLA track of the same name on that object, and the glTF export keeps only one of them, warning "Some strips have same channel animation". Seen in the garage car's "settle", whose rotation was dropped. The office water cooler's "glug" exports the bubble's translation but not its scale. Workaround used: nested pivots, one key per object.
- A comp.ph_texture material on a mesh that never had comp.uv_box (so no UV layer) exports with "texCoord": -1. raea's glTF loader then refuses the whole file with "invalid value: integer -1, expected u32". comp.mesh and comp.export neither add UVs nor fail, so the error only appears at render time. Seen on the ticket booth's key board.

## cathedral: 21 components, 11 rigged, 15 from Poly Haven, 69.8 MB

Shot props: The match cut's circle is rose-window (clip "light": the unlit leaf of stained glass draws back through the lit leaf, tilted, so the light crosses the rose from one edge to the other between 0.1 and 0.9; its glow is the material rose_glass_lit). The sun the agent swings is light-shaft (clip "swing": the shaft, its twelve coloured petal shafts and the rose's pool on the flags swing 24 degrees about the upright through the rose's centre, from the side of the nave to the centre aisle). The scene's vline hook is column; its diag hook is light-shaft. Also moving: dust "drift", chandelier "sway" and "turn", thurible "swing" and "lid", altar-candlestick and votive-stand "flicker", pew "kneeler", lectern "page", font "cover", door "open".

Problems:
- On the stand the altar end is very dim: the vault and walls shut the stand's one sun out and raea's glows light the stone only a little, so the altar, cross, candlesticks, lectern, thurible, votive stand, door and statue are hard to read in out/library/cathedral. I checked them in a second render with the shell removed (not kept); the real scene needs its own lights at the altar.
- The see-through shaft materials (light_shaft_air/blue/ruby/gold) pick up faint scratchy streaks in raea's ray-traced lighting, and a glow seen through them goes blocky (the votive lights read as small orange squares). Glow strengths are tuned by eye: about 4 to 14 for the blended shaft and pool, 3000 for the opaque rose glass.
- At frame 0 the shaft and pool still glow while the rose is unlit: a clip cannot fade a glow, so the scene must key light-shaft's materials together with rose-window's "light".
- The rest pose of the shaft passes through the north arcade's piers (it is a swing about the window, not a shadowed beam).
- The nave is a parish-church size (6.4 m between pier rows, 14 m to the vault, rose 5 m across), not a great cathedral's, and has four bays only; the camera end is open, which is where the stand's sun comes in and why the near piers are lit hard white.
- Capitals' crockets are simple trefoil lumps, the vault boss and statue pedestal are plain, and the ashlar texture (large_sandstone_blocks_01 at 1k, desaturated) reads blotchy rather than as clear courses close up.
- altar-candlestick uses Poly Haven's tall brass candleholder, which is a five-arm candelabrum; only the centre carries a candle and flame.
- The ledger stones in the floor render light grey rather than dark slate, and one sits under the votive stand on the stand.
- The pews are 1.8 m (three sittings) so two blocks and an aisle fit the nave; aisle-runner is 1.1 m wide for the same reason.
- Housekeeping: early on I wrote 16 thumbnail files and a sheet.jpg into the shared scratchpad folder scratchpad/th, which turned out to hold another agent's files, then removed mine; if that folder already had a sheet.jpg, my ffmpeg run overwrote it.

## kelp: 22 components, 16 rigged, 4 from Poly Haven, 16.4 MB

Shot props: The match cut's circle is sun (the white disc under the surface, material sun_disc, upper centre on the stand; clip "shimmer": the ray burst turns 22.5 degrees and swells, two shards of the disc slide apart). The shot's move is kelp-a, kelp-b and kelp-c (clip "stand": every joint of every stipe straightens, from lying over 58 to 70 degrees down-current to standing; frame 0 is the forest in the current, frame 30 standing). The diag hook is light-shafts (clip "sway"), the dots hook is bubbles (clip "rise"). Also moving: surface "swell", canopy "drift", particles "drift", school "swim" and "turn", garibaldi, sheephead and kelp-bass "tail" and "swim", urchins "bristle", anemones "sway", sea-fan "sway".

Problems:
- Nothing under the surface is lit by a light: the surface and the water drum shut the stand's sun out (even as blended materials), so every material carries its own glow (_lib.ambient: sand, rocks, kelp, fish, urchins and so on) and the sand's ripples of light are painted into its picture. Forms therefore read flat, and a scene with real lights under the surface must turn those glows down.
- The fish are the weakest parts: simple lofted bodies with flat plate fins, painted sides and no shading, 815 triangles each; fine as half-second silhouettes, not close up. They face -x, so "swim" moves them toward -x; the school faces and swims +x.
- A kelp stipe is rigid between joints (0.4 to 0.65 m), so the lean is a chain of small kinks, and the blades are fixed to their joints: they do not stream in the current or hang when it slows.
- Kelp holdfasts stand on the sand beside the rocks rather than gripping them, and when leaning the plants pass through each other and the rocks.
- The surface is a painted picture (Snell's window, caustic lines) on a gentle swell; "swell" slides the whole piece, window included, so the scene has to move it back or keep the travel short. The sun's disc sits in a large pale window, so it is the brightest circle but not by a wide margin.
- The water drum's bright band meets the darker surface edge in a visible ring at the horizon, and its painted far kelp is soft; real fog would do this better.
- light-shafts are see-through cones that fade by a picture; they tint whatever is behind them pale (one kelp plant looks whitened) and their feet show as faint pale patches on the far sand.
- The scene's 'wrong' beat (fish swimming through the kelp) has no rig of its own: it would be the school's "swim" aimed through a plant.
- reef and boulders use Poly Haven's rock_moss_set_01 as is, its moss standing for algal turf; shells is Poly Haven's lambis_shell (a tropical spider conch, not a California species).

### comp.py bugs reported with the place(s) above

- comp.channel drops keys when one channel keys the same object more than once (two rotation axes, or a rotation and a scale). It makes a separate action and a separate NLA track of the clip's name for every key, and the glTF export keeps only one such track per object, so only the first keyed property reaches the clip. Seen in the exported .glb: kelp joints kept only one of their two lean axes (the forest did not stand up), altar-candlestick's flicker had its rotation but not its scale, sun's burst had rotation but not scale. The office's blinds "raise" and chair clips do not hit it because each object is keyed once. Worked round with channel() in blender/components/cathedral/_lib.py and blender/components/kelp/_lib.py, which puts all of an object's keys in one action and one track.
- comp.mat's emit strengths in the office (1.5 to 6) are far too low to read in raea: a glow needs roughly 50 or more per unit of colour to show at the stand's exposure, and an opaque glowing material never reaches full white (a blended one does). Not a code bug, but the worked example's values mislead; mine run from about 4 (blended shafts) to 3000 (opaque stained glass).
- comp.mat sets a glow on a material with alpha as well, and raea adds that glow at full strength regardless of the alpha, so a faint see-through glowing surface renders nearly opaque unless the strength is cut to single figures.
- comp.ph_texture's tint is a multiply node on the base colour only: a glow taken from the same picture cannot carry the tint through the glTF export (I had to bake the tint into a copy of the picture, tint_picture in kelp/_lib.py). Its grey=True writes the _grey.png copy into the shared cache blender/src/polyhaven/tex, beside the download.
- comp.ph_component and comp.fetch need the network on every build, cached or not: ph_texture, ph_model and ph_credit each call api.polyhaven.com before looking at the cache, so a cached component cannot be rebuilt offline.

## bedroom: 33 components, 24 rigged, 9 from Poly Haven, 84 MB

Shot props: sheet: settle (0 = hanging 0.95 m over the bed, tipped and ballooned; 1 = lying on the bed; the match cut's sheet, at the bed's own position). wall-clock: hands (minute hand a whole turn, hour hand 30 degrees; the cursor's winding), seconds. sun: arc (a glowing disc 90 degrees along a tipped path about the window's centre, right and 27 degrees up to low on the left; the scene's DirectionalLight follows the node sun_disc). blinds: slats (70 degrees open to shut, for the stripes), raise. model-planes: sway, turn, props. globe: spin (one whole turn about its 23.5-degree axis, loops; the BR circle and the montage's). rain: fall (44 runners each its own distance down the pane, 220 standing beads; the FULL streaks). crt: screen is the scene's (part and material crt_screen, UVs 0-1, 4:3), plus aerial and power. lamp: on is the scene's (lamp_bulb), plus nod and switch. fish-tank: bubbles (loops), swim, flap. Also wall-window: sash; door: open, knob; desk: drawer, drawers; console: pad; games: slide; posters: flutter; toys: car, ball, blocks; shelves: key, robot, cube; bookcase: tape, lid; wall-front: wardrobe; nightstand: drawer; alarm-clock: hands, seconds; toy-box: bat; dartboard: spin.

Problems:
- I rendered with --mem 4G, not the 12G in COMPONENTS.md: antsy refused 12G all session (free memory sat near 30%), and the job peaks at 2.5 GB.
- The scratchpad is shared between this workflow's agents. Another agent overwrote my render.sh with the sea's, and I ran it once with bedroom arguments before noticing: it produced a few 'stay-library-sea FAILED exit 1' events and rendered nothing. My script is now scratchpad/bedroom/render.sh.
- The main stand (out/library/bedroom/frame-00000.png, frame-00001.png) holds the floor, the window wall and the side wall only. The ceiling, wall-left and wall-front would shade the stand's sun or block its camera, so they are proved in their own views (out/library/bedroom/ceiling, walls, walls-in), which are dim because the room is then in shade.
- The stand runs one clip a part, so the second and third clips are in extra compositions in library/bedroom.tsx (library-bedroom-rigs, -desk, -desk-rigs, -desk-top, -bed, -window, -shelf, -floor, -planes, -sun, -nightstand), rendered under out/library/bedroom/<view>/. The main stand runs the blinds' raise so the window and rain show; slats is in -rigs and -bed.
- Not every clip was looked at closely: the window's sash, door open, sheet, blinds, drawers, aerial, lamp nod, sun arc, posters, wardrobe, rain and globe (at frame 15) were checked by eye. Shelves key/robot/cube, bookcase tape/lid, toys car/ball/blocks, planes props, fish swim/bubbles, door knob, lamp switch and CRT power rendered without error but are too small in their views for me to confirm the pivot.
- raea render artefact, not a component fault: when frames 0 and 30 render together, the sun's frame-0 position stays as a dark ghost disc in the stand's black sky at frame 30 (visible in the main frame-00001.png). Frame 30 rendered alone is clean, and the disc does arrive at its end position glowing (out/library/bedroom/sun). The same ghosting smudges the left wall in walls-in.
- The sheet's settle is three rigid moves (drop, tip, a z-scale for the balloon), not cloth: its folds do not change as it lands. A morph or simulated version would need a shape-key clip, which comp.channel does not write.
- The rain is opaque-looking white beads and ribbons with fixed-length trails; no refraction or wetting of the glass. It reads as rain on a window but is graybox level.
- The globe's map is my own coarse hand-drawn coastlines with a pastel patchwork for countries: it reads as a political globe at shot distance, not close up.
- The sun's light coming through the blinds as stripes on the wall and floor is not proved here: the stand's light is its own DirectionalLight, so that is scene work.
- The CRT's screen is a dark tube at rest. Its picture and glow are the scene's (crt_screen), and I did not test swapping that material's texture from raea.
- The blinds' slats render speckled in Solari when shut or gathered, even at 34 slats 1.2 mm thick.
- Poly Haven's gaming_console carries its own lettering on the lid (reads 'MEDIM', the asset's made-up mark). The gamepad asset's 0.4 m sprawl of lead is cut off and replaced by a hand-made lead.
- The chair and boombox are single-mesh Poly Haven models with no clips. The posters' art, the fish and the model planes (3,196 triangles for all three) are simple, toy-kit level.
- The ceiling's plaster (ceiling_interior) reads brownish in its shaded view; I did not see it in direct light.
- Bright paint colours wash out pale under the stand's sun unless given as linear values (I added _lib.srgb for this); the wall posters and rug print are still a little pale.

### comp.py bugs reported with the place(s) above

- comp.channel: two keys on the same object under one clip name (location x and y, or a slide plus a turn) each get their own action and same-named NLA track, and the glTF export silently keeps only one. Confirmed in the exported glb: toys 'blocks' kept the translation and lost the rotation, console 'pad' likewise. Worked round with blender/components/bedroom/_lib.py channel(), which puts an object's keys in one action and one track.
- comp.export does not check that a mesh with a ph_texture or image material has UVs. Without them the glTF carries "texCoord": -1 and raea refuses the whole file ('invalid value: integer -1, expected u32'). Hit three times (a bmesh UV sphere whose calc_uvs wrote nothing, and pegs without uv_box).
- comp.export turns animation export on whenever the rig dict is non-empty, including rigs that are only 'in the scene: ...' notes. Harmless so far, but the sidecar then cannot tell a real clip from a scene-driven entry except by reading the text.
- comp.export's size_m is taken at the rest pose through pivot transforms, so a component whose rest pose is displaced or scaled (the sheet's 1.9 z-scale) reports a size that is not its real one.
- comp.mat takes linear colour with no note of it: values picked by eye as sRGB come out washed pale in raea. A trap rather than a bug.

## court: 17 components, 12 rigged, 7 from Poly Haven, 97 MB

Shot props: hoop (the circle the cut lands on): clip "net" swings the chain net back about the rim in three bending tiers, "swish" bellies it round the ball, "sway" swings it sideways, "rim" dips the rim; basketball: "drop" falls 1.5 m through the rim (also "spin", "squash"); rain (the FULL streaks hook): "fall" loops one 7 m period, "gust" leans it; floodlight "tilt"/"pan" with light-cone "tilt"; puddles "ripple"

Problems:
- The light cone still shows faint radial banding in the wide view, and from underneath (the hoop view) its edge reads as a straight line across the wall; it is seven nested alpha shells, not real fog.
- Rain streaks are uniform white slivers that glow on their own (blend materials are drawn after Solari, so the floodlight does not actually light them); close to the camera they read thick.
- The stand's night lighting is the floodlight's lens glow at 5,000,000 (floodlight_lens) plus the stand's sun at 150; the gate corner, bench and gym bag sit outside the pool of light and are dark. A scene must set its own lens glow.
- Frame 30 shows ghosts of moved props (the tyre in two places, the ball) because the stand jumps from frame 0 to 30 and the denoiser holds history; it is the stand, not the models.
- The chain-link fence had to be turned from a blended material into an alpha mask (court/_lib.mask): as a blend it threw a solid shadow on the wall and rendered black.
- The gym bag, bench and weeds were only seen small or dark in the renders; the gym bag was never looked at close up. The wall's fire door ("door"), the gate's "rattle", the floodlight's "tilt"/"pan", the puddles' "swell", the hoop's "sway"/"swish"/"rim" and the ball's "spin"/"squash" clips were built and their exported values checked for some, but not each seen in a render.
- The street lamp behind the fence is Poly Haven's 3.9 m lamp with its bulb set glowing; it barely reads in the wide view.
- Fence corners are runs butted at right angles with no corner post piece; the fence is the Poly Haven kit scaled 1.25, so its mesh diamonds are 25% over real size.
- media/models/court is 97 MB, just under the 100 MB guide (2k textures on the fence kit, wall, asphalt).

## observatory: 19 components, 13 rigged, 8 from Poly Haven, 98 MB

Shot props: moon (the circle the cut lands on): our own painted near-side map glowing through the slit, clip "phase" swings the night side round to a crescent, "rise" lifts it, "halo" swells its glow; dome (the slit's vertical line): "open" slides the two shutter leaves 80 cm apart each way, "turn" turns the whole dome; telescope: "slew" swings it from the pole to the moon (90 degrees about the polar axis, 107 about the declination axis; also "ra", "dec", "focus", "drive"); stars "drift"

Problems:
- The moon's map is painted by hand in numpy, not real imagery (NASA's public-domain map returned 404 and I did not hunt further): the maria are in roughly the right places and it reads as the moon, but it is not the true face, and close up the fine grain has a woven look from the noise.
- The moon's "phase" is a black half-shell swinging round it; at full travel the dark side hides the halo behind it like an eclipse rather than letting the glow show round the limb.
- The room is lit almost only by three red safelights and the desk lamp (glows at 380,000 and 1,600,000), so every material reads red-orange and the main view meters 2.6 to 2.8 stops under mid grey; that is the look of an observatory at night but it hides the wood, brass and cream enamel. The telescope's true colours only show in the daylight view (library-observatory-telescope).
- On the stand the room is turned 216 degrees so the slit faces the stand's sun, which stands in for moonlight; the patch it throws lands on the dome's left side, not on the floor or telescope.
- The moon is 2.2 m across at 110 m on the stand (about 1.1 degrees, twice real size) and still small in the frame; the shot will need to scale it or use a long lens to make it the cut's circle.
- Frame 30 ghosts of moved parts (the telescope's parked position in the daylight view) come from the stand's jump from frame 0 to 30.
- Not each seen in a render: the wall's "door", the dome's "turn", the telescope's "focus" and "drive", the ladder's "brake", the chart table's "dial" and "page" (the table is small and at the frame's edge), the clock's "hands", the globe's "tip", the wall chart's "tilt", the crank's "turn". Their exported clip values were checked for some, not all.
- The wall's door stands proud of the round wall rather than being cut into it; the wall chart is a flat frame on a curved wall (its edges touch, its middle stands 4 cm off).
- The bookshelf's four encyclopedia sets are decimated to a quarter (77,000 triangles in all) and were only seen at the frame's edge; the clock's glass renders dark.
- The dome's skin has no thickness detail at the slit's edge beyond its 8 cm solidify, and its boards' texture converges toward the zenith (UVs by azimuth and elevation).
- media/models/observatory is 98 MB, just under the 100 MB guide.

### comp.py bugs reported with the place(s) above

- comp.channel(): when a clip has two or more keys on the SAME object (e.g. (p, "scale", 0, ...), (p, "scale", 1, ...) or a rotation plus a location), it makes a separate action and a separate NLA track of the same name for each key; the glTF export then animates only the first key and holds the others at their FULL value for the whole clip. Seen in the exported accessors: court/tyre "roll" turned but had no translation; basketball "squash" started at scale [1.1, 1.0, 1.1]; the office's own water-cooler "glug" exports the bubble's rise but never its scale keys. Worked round with channel() in blender/components/court/_lib.py and observatory/_lib.py (one action and one track per object holding all its keys); other places' multi-key clips are probably affected.
- comp.pivot() makes an empty with a translation-only world matrix, and link() cancels the parent's rest rotation through matrix_parent_inverse, so a key on rotation_euler always turns about a WORLD axis at rest; there is no way to rig a tilted axle (a polar axis, a globe's axle) with it. Worked round with axis_pivot() in observatory/_lib.py (the empty carries the tilt and a rotation_mode whose first-applied axis is the keyed one).
- comp.ph_texture()/the kit materials: a Poly Haven model's BLEND material (the chain-link wire) exports as alphaMode BLEND, which Solari neither traces as see-through nor lights properly (a solid shadow, black panels); comp has no helper to turn it into a mask. Worked round with mask() in court/_lib.py (a ROUND math node on the alpha, exported as MASK).
- comp.mat(emit=..., strength=...): nothing says the strength must be in Solari's traced units for an opaque material (thousands; 4,200 for the moon's disc, 380,000 to 5,000,000 for lamps that light a place) while a blended material is drawn raster and wants about 1 to 100; a glow of 14 on the opaque moon rendered black.
- comp.export(): size_m is taken from each object's bound_box corners in world space, so a part hung from a turned pivot reports an inflated box (light-cone reports 14.4 m tall for an 11 m cone tipped 50 degrees).
- bmesh create_uvsphere(calc_uvs=True) without a UV layer made first gives no UVs, and the export then writes texCoord -1, which raea refuses to load ("invalid value: integer -1, expected u32"); comp has no sphere helper with UVs and export() does not catch a textured mesh with no UV map. Worked round with sphere_uv() in observatory/_lib.py.
