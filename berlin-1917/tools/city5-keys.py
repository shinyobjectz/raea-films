# usage: city5-keys.py flow|kling ID...   (flow: writes keys5c/keys.flow.json for the ids; kling: writes kling5c/ID.json)
import json, sys, pathlib
G = (pathlib.Path(__file__).resolve().parent.parent)
K = G / 'out/rebuilt/real/keys5c'; KL = G / 'out/rebuilt/real/kling5c'
TAIL = (" Keep the exact framing, perspective and layout: every building, window, sign, lamp, tree, rail and person where it is "
        "and at its size. Make every surface real: weathered sandstone and stucco with soot and carved detail, real glass, slate "
        "and zinc, trampled grey snow and slush over cobbles. People of 1917 in long dark wool coats, hats and caps, soldiers in "
        "field grey, real faces, feet on the ground. The light as the render has it. A natural 35 mm film photograph with fine "
        "grain and true exposure, not computer graphics. No added text, nothing modern.")
WHAT = {
 'rb-dive': "an aerial view descending from high over central Berlin into Leipziger Strasse, the dense blocks of the Friedrichstadt with snow on the roofs, chimney smoke, the city to the winter haze",
 's5-smoke-aerial': "an aerial view at first light over the snowy roofs of the Friedrichstadt toward the two domes of the Gendarmenmarkt, coal smoke from thousands of chimneys leaning east in the cold air",
 's5-blocks-aerial': "high over the tenement blocks south of Leipziger Strasse, courtyard behind courtyard inside each block, snow on the slate and zinc roofs, chimney smoke",
 's5-shops-corner': "Friedrichstrasse at dusk: the ground-floor shops lit warm behind their plate glass, gas street lamps just lit, snow and slush on the roadway, the street running on into the blue cold",
 's5-facade-windows': "a five-storey stone house front on Friedrichstrasse at dusk, warm lamplight in some of its windows behind lace curtains, soot on the stucco, the blue cold sky",
 's5-skyline-dusk': "the skyline of Berlin at dusk seen from the south over miles of snowy roofs: the domes, towers and church spires, chimney smoke, the last light low in the west",
 's5-roof-copper': "low over the snowy slate and zinc roofs of the Friedrichstadt, brick chimney stacks smoking, the copper-green domes of the Gendarmenmarkt ahead",
 's5-queue': "a bread queue at dawn outside a bakery in a side street: women of 1917 in dark coats and shawls with baskets waiting along the house front, the wartime winter, snow on the pavement",
 's5-queue-wide': "a side street at dawn with a long bread queue of women of 1917 along the house fronts outside a bakery, the wartime winter, snow and slush",
 's5-wilhelm': "Wilhelmstrasse by day: the long classical stone fronts of the offices of state, the Foreign Office, a few people of 1917 on the pavements, snow at the kerbs",
 's5-ending-walk': "walking north up Wilhelmstrasse at dusk: gas street lamps lit, warm light in the office windows, people of 1917 walking home in the blue cold, snow and slush",
}
mode, ids = sys.argv[1], sys.argv[2:]
if mode == 'flow':
    st = {}
    for i in ids:
        st['src_' + i] = {"op": "media.load", "in": {"path": str(K / f'{i}-f0.png')}}
        st[i] = {"op": "image.edit", "model": "made:nano_banana_2", "in": {"image": "@src_" + i, "prompt": "Turn this 3D render into a real photograph taken in Berlin in the winter of 1917: " + WHAT[i] + "." + TAIL}}
    out = K / f'keys-{ids[0]}.flow.json' if len(ids) == 1 else K / 'keys.flow.json'
    json.dump({"flow": 1, "steps": st}, open(out, 'w'), indent=1); print(out)
else:
    KL.mkdir(parents=True, exist_ok=True); (KL / 'src').mkdir(exist_ok=True); (KL / 'out').mkdir(exist_ok=True)
    for i in ids:
        p = ("Re-render @Video1 so it looks exactly like @Image1: real 35 mm film footage shot in Berlin in the winter of 1917, " + WHAT[i] +
             ". Keep the camera move, the framing, the timing and every building, window, sign, lamp, rail and person exactly where it is, "
             "with the lettering of every sign unchanged. Replace every surface with the real stone, glass, wood, snow and slush of @Image1. "
             "Anyone walking walks naturally at a normal pace. Real footage with natural film grain and true exposure, not computer graphics. Add no text.")
        json.dump({"endpoint": "fal-ai/kling-video/o3/pro/video-to-video/edit", "video_file": f"src/{i}.mp4", "image_files": [str(K / f'{i}.png')], "keep_audio": False, "prompt": p}, open(KL / f'{i}.json', 'w'), indent=1)
        print(KL / f'{i}.json')
