# Berlin long cut v5: new footage (the director on v4: no cold-open clips in the body; triple the new visuals)

Every clip: 1920x1080, 24 fps, no audio, a camera moving from first frame to last, delivered to
assets/rebuilt/shots5/ID.mp4. "real" = finished by Kling O3 Pro Edit from a Nano Banana 2 keyframe of the render's first
frame (on screen: "Our 3D city, finished by AI video"); "model" = the bare render, on purpose (on screen: "Our 3D model,
built from the record"). Each fork also writes assets/rebuilt/shots5/ID.json {id, seconds, kind, what, line} and keeps
the bare render as assets/rebuilt/shots5/bare/ID.mp4 for real shots (for model-to-finish reveals).

Cold-open clips never used in the body: rb-fly rb-walk rb-leipziger rb-friedrich rb-forecourt rb-roofs rb-people rb-dusk
rb-dom bakery-dawn cafe warkitchen pharmacy.

## City exteriors (fork C: CityShot / baked city, compositions/rebuilt-v5-city.tsx)
| id | sec | kind | what | for |
|---|---|---|---|---|
| s5-smoke-aerial | 7 | real | the winter city from the air, chimney smoke (world-smoke's aerial) | v05 "the winter outside" |
| s5-graybox-aerial | 7 | model | the graybox Friedrichstadt, every building at its 1887 height, slow aerial | v06 "drew every building" |
| s5-stream-run | 7 | model | the city's tiles streaming in along Leipziger (world-stream) | v08 "we needed the buildings themselves" |
| rb-dive | 7 | real | the existing dive render (assets/rebuilt/shots/rb-dive.mp4), finished by Kling | v09 Hobrecht's blocks |
| s5-blocks-aerial | 7 | real | high over a block's courtyards, one behind another, slow crane | v09 "one courtyard after another" |
| s5-shops-corner | 6 | real | ground-floor shopfronts at dusk, lit (world-shops' corner), slow track | v12 "which shops were on the ground floor" |
| s5-facade-windows | 6 | real | a tenement front at dusk, windows lighting one by one, slow tilt up | v12 "who rented the flats above" |
| s5-skyline-dusk | 7 | real | the skyline from the south at dusk (world-skyline / skyline.tsx) | v21 "the city above" |
| s5-roof-copper | 6 | real | close over roofs, domes and copper flashing, slow lateral (not rb-roofs' camera) | v22 "copper ordered off the roofs" |
| s5-queue | 6 | real | the 07:15 bread queue at the side-street bakery (people-street's stop) | v05 "the people next door" |
| s5-queue-wide | 6 | real | the same street wider (people-street's wide) | v22 "By December…" |
| s5-wilhelm | 6 | real | Wilhelmstraße's offices of state (world-wilhelm) | coda |
| s5-ending-walk | 10 | real | a walk at dusk down a street other than Leipziger (Friedrichstraße south or Wilhelmstraße), people of 1917 walking at a normal pace | the ending title |

## Interiors, cutaways, under (fork D: SetView / city-house / sewers, compositions/rebuilt-v5-rooms.tsx)
| id | sec | kind | what | for |
|---|---|---|---|---|
| s5-court-dusk | 7 | real | a tenement's rear court (interiors/sets/court.ts), slow push toward the side-wing door | v01 opening |
| s5-court-privy | 6 | real | the same court from another corner, the yard door (court set door/ledge cams) | v20 "a privy in the yard" |
| s5-cellar | 6 | real | a house cellar compartment: coal, potato sacks, a candle (cellar.ts compartment) | v03 "cellars" |
| s5-cellar-coal | 6 | real | down the cellar passage (cellar.ts chain cam, without the breakthrough story) | v22 "coal was short" |
| s5-kitchen-room | 6 | real | the side-wing kitchen (kitchen.ts room cam), a bed in the kitchen if the recipe has one | v03 "kitchens with beds", v14 |
| s5-kitchen-window | 6 | real | the kitchen window over the court, lace curtain (kitchen.ts window/tilt) | v14 "lace curtains" |
| s5-kitchen-lamp | 6 | real | evening in the kitchen, the lamp, brass and copper things (kitchen.ts lamp) | v22 "brass and copper… from homes" |
| s5-gallery | 8 | model | a slow track along the generated rooms side by side (gallery.ts) | v14 "a hundred and twenty-seven rooms… furnishing the city" |
| s5-house-cutaway | 10 | model | one house cut away level by level (city-house.tsx), slow orbit, cellar to roof | v03 / v10 the floors by class |
| s5-room-best | 6 | real | a first-floor front flat furnished for its class (city-rooms) | v10 "the best flat" |
| s5-room-clerk | 6 | real | an upper-floor flat of a clerk or craftsman (city-rooms) | v10 "clerks, craftsmen and widows" |
| s5-room-wing | 6 | real | a room and kitchen in a side wing, a lodger's bed (city-rooms) | v10 "a room and a kitchen, often with a lodger" |
| s5-salon | 6 | real | the salon set (interior-salon.tsx), moving, not the existing rooms/salon clip's camera | v16 |
| s5-warkitchen | 6 | real | the war kitchen set (interior-warkitchen.tsx), a new camera, not the cold open's | v22 "public kitchens" |
| s5-sewers3d-crossing | 7 | model | Radial System III in 3D, the ground left out, slow orbit (sewers3d crossing) | v18 / v19 |
| s5-sewers3d-station | 7 | model | the system's mains converging on the pumping station (sewers3d station) | v19 "a pumping station" |
| s5-sewer-shaft | 6 | model | up the shaft from the egg sewer (underground-sewer shaft), lantern-lit | v19 |
| s5-xray | 9 | model | the city at dusk with the sewers glowing through it: out/xray/city-move.mp4 + sewers-move.mp4 composited (no burned-in text) | v17 "ran another city" |
