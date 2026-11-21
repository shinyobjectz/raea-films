# keyframe flow (Nano Banana 2 over each bare render's first frame) and the Kling specs; run with python3.12 -I
import json, subprocess, os
G = __import__('pathlib').Path(__file__).resolve().parent.parent.as_posix()
K = f"{G}/out/rebuilt/real/keys5d"; os.makedirs(K, exist_ok=True)
tail = (" Keep the exact framing, perspective and layout: every wall, beam, door, window, step and object where it is and at its size."
        " Make every surface real: old lime-washed plaster with damp stains and soot, worn timber, brick, iron, glass, cloth."
        " Framed pictures on the walls are old photographs and prints. A natural 35 mm film photograph with fine grain and true exposure,"
        " in natural colour, not computer graphics. No people. No added text, nothing modern.")
P = {
 "s5-court-dusk": "a real photograph taken in Berlin in October 1917: the second courtyard of a tenement, five storeys of plastered walls with windows all round, brick paving, a handcart, a low brick bunker, the side wing's door. Grey autumn afternoon light, wet cobbles, no snow.",
 "s5-court-privy": "a real photograph taken in Berlin in the winter of 1917: a tenement's rear courtyard in snow, the arched passage through the rear building, a carpet-beating rack, a dust chest, a handcart, trampled snow on the brick paving, grey winter light.",
 "s5-cellar": "a real photograph taken in Berlin in 1917: a tenement's house cellar under a brick vault, slatted wooden cellar compartments, crates and sacks of potatoes behind the slats, lit by one lantern, dust hanging in the air.",
 "s5-cellar-coal": "a real photograph taken in Berlin in the winter of 1917: sacks of coal against a tenement courtyard's wall by the cellar entrance, a handcart, trampled snow on the brick paving, grey winter light.",
 "s5-kitchen-room": "a real photograph taken in Berlin in 1917: the side-wing kitchen of a worker's flat, a white tiled kitchen range, a white kitchen dresser with paper lace on its shelves, the iron bed where the lodger sleeps, a kitchen table, a chair, washing hung under the ceiling, lime-washed walls with a green oil-paint dado, grey daylight.",
 "s5-kitchen-window": "a real photograph taken in Berlin in 1917: looking out of the open double casement window of a third-floor kitchen in a tenement, lace curtains at both sides, onto the plastered walls and windows of the courtyard below, grey daylight.",
 "s5-kitchen-lamp": "a real photograph taken in Berlin in the winter of 1917: a worker's kitchen at evening, lit only by a hanging oil lamp and the glow of the range's fire door, a brass kettle, a copper pan hung on the wall, washing hung overhead, an iron bed.",
 "s5-salon": "a real photograph taken in Berlin in 1917: the salon of a bel étage flat, patterned wallpaper, a green tiled stove, a white double door, an upholstered sofa, a table with chairs, a framed landscape painting, potted plants, parquet floor, a lit chandelier at dusk.",
 "s5-warkitchen": "a real photograph taken in Berlin in 1917: seen from the pavement through a shop window, a public war kitchen, white tiled walls, large steel cooking kettles, a serving counter, benches, warm lamplight inside at dusk.",
 "s5-room-best": "a real photograph taken in Berlin in the winter of 1917: the salon of a well-to-do first-floor flat, deep red walls, a tall white double door, an upholstered sofa, an armchair, a lamp on a side table, shelves, grey winter daylight.",
 "s5-room-clerk": "a real photograph taken in Berlin in the winter of 1917: an upper-floor tenement flat where a family sews coats for the clothing trade at home, a white kitchen dresser, two iron beds, a table, light blue walls, grey winter daylight.",
 "s5-room-wing": "a real photograph taken in Berlin in the winter of 1917: a crowded room in a tenement's side wing where six people sleep, an iron bed, a dark wardrobe, a washstand with a basin, framed pictures on pale walls, an iron stove, a chair, grey winter daylight.",
}
steps = {}
for id, p in P.items():
    src = f"{K}/{id}-f0.png"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{G}/assets/rebuilt/shots5/bare/{id}.mp4", "-frames:v", "1", src], check=True)
    s = id.replace("s5-", "").replace("-", "_")
    steps[f"src_{s}"] = {"op": "media.load", "in": {"path": src}}
    steps[s] = {"op": "image.edit", "model": "made:nano_banana_2", "in": {"image": f"@src_{s}", "prompt": "Turn this 3D render into " + p + tail}}
json.dump({"flow": 1, "steps": steps}, open(f"{K}/keys5d.flow.json", "w"), indent=1)
json.dump(P, open(f"{K}/prompts.json", "w"), indent=1)
print(len(P), "keyframes in", K)
