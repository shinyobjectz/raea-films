# A meadow, for the outdoor places (the director, 11-11, assembly 18: "in all the outfoor forrest, park scenes theres no gradss
# showing really"). The garden's lawn was forest dirt with forty-six tufts on it. This builds, from Poly Haven's scanned
# grass and flowers (CC0):
#   garden/lawn.glb        a 60 m ground in a grass texture
#   garden/meadow.glb      a 4 m by 4 m tile of grass, about 220 clumps of every size standing through each other, to be
#                          laid edge to edge (the clumps near an edge lean over it, so the joins don't show)
#   garden/meadow-flowers.glb   the same tile with gazanias, ursinias and dandelions standing in it
#   forest/verge.glb       a 4 m by 4 m tile of longer, thinner grass and ferns for the road's verges
#   raea blender run blender/meadow.py
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import comp, bpy
from mathutils import Matrix, Vector

def variants(asset, res="1k"):
    objs = [o for o in comp.ph_model(asset, res)]
    meshes = [o for o in objs if o.type == "MESH" and "LOD0" in o.name or (o.type == "MESH" and "LOD" not in o.name)]
    for o in objs:
        if o not in meshes:
            bpy.data.objects.remove(o, do_unlink=True)
    for o in meshes:
        mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
    bpy.context.view_layer.update()
    return meshes

def foot(o):
    lo, hi = comp.box_of(o)
    return Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z)), max(hi.x - lo.x, hi.y - lo.y)

def tile(place, name, sources, n, size, seed, tall=1.0, extra=(), long=1.0):
    """`sources`: [(objects, weight, scale range)]; `extra`: [(objects, count, scale range)]"""
    rng = random.Random(seed)
    col, root = comp.fresh(name)
    made = []
    def stand(src, x, y, k):
        at, _ = foot(src)
        c = src.copy(); c.data = src.data
        bpy.context.scene.collection.objects.link(c)
        c.matrix_world = Matrix.Translation((x, y, -0.012)) @ Matrix.Rotation(rng.uniform(0, 6.283), 4, "Z") @ Matrix.Diagonal((k, k, k * tall, 1)) @ Matrix.Translation(-at) @ src.matrix_world
        made.append(c)
    pool = [(o, w, rng_) for objs, w, rng_ in sources for o in objs]
    weights = [w for _, w, _ in pool]
    for _ in range(n):
        o, _, (a, b) = rng.choices(pool, weights)[0]
        stand(o, rng.uniform(-size * long / 2, size * long / 2), rng.uniform(-size / 2, size / 2), rng.uniform(a, b))
    for objs, count, (a, b) in extra:
        for _ in range(count):
            stand(rng.choice(objs), rng.uniform(-size / 2, size / 2), rng.uniform(-size / 2, size / 2), rng.uniform(a, b))
    bpy.ops.object.select_all(action="DESELECT")
    for c in made:
        c.select_set(True)
    bpy.context.view_layer.objects.active = made[0]
    bpy.ops.object.join()
    body = bpy.context.view_layer.objects.active
    comp.link(col, root, body, name=f"{name}_grass")
    return col, root

def done(col, root, place, name, source):
    comp.export(col, root, place, name, made="blender/meadow.py", source=source, license="CC0", credit="Poly Haven")
    for o in list(col.all_objects):
        me = o.data if o.type == "MESH" else None
        bpy.data.objects.remove(o, do_unlink=True)
        if me and me.users == 0:
            bpy.data.meshes.remove(me)

want = [a for a in sys.argv if a in ("meadow", "flowers", "verge", "lawn", "bed", "path")] or ["meadow", "flowers", "verge", "lawn", "bed", "path"]
print("want", want, flush=True)
g1, g2 = variants("grass_medium_01"), variants("grass_medium_02")
gaz, urs = variants("flower_gazania"), variants("flower_ursinia")
try:
    dan = variants("dandelion_01")
except Exception as e:
    print("no dandelion_01", repr(e)[:80]); dan = []
fern = variants("fern_02")
print("variants", len(g1), len(g2), len(gaz), len(urs), len(dan), len(fern), flush=True)
src = "https://polyhaven.com/a/grass_medium_01, grass_medium_02, flower_gazania, flower_ursinia, dandelion_01, fern_02 (scattered by blender/meadow.py)"
if "meadow" in want:
    col, root = tile("garden", "meadow", [(g1, 3, (0.8, 1.5)), (g2, 2, (0.8, 1.4))], 220, 4.0, 11)
    done(col, root, "garden", "meadow", src)
if "flowers" in want:
    col, root = tile("garden", "meadow_flowers", [(g1, 3, (0.8, 1.5)), (g2, 2, (0.8, 1.4))], 190, 4.0, 23, extra=[(gaz, 12, (0.8, 1.2)), (urs, 14, (0.8, 1.3))] + ([(dan, 10, (0.8, 1.2))] if dan else []))
    done(col, root, "garden", "meadow_flowers", src)
if "bed" in want:
    # a flower bed (the director, 11-11: "show me flower beds and garden path dense grass"): 3 m by 1.2 m, thick with gazanias,
    # ursinias and dandelions through short grass
    col, root = tile("garden", "flowerbed", [(gaz, 4, (0.9, 1.5)), (urs, 4, (0.9, 1.5))] + ([(dan, 2, (0.9, 1.4))] if dan else []) + [(g2, 2, (0.6, 1.0))], 150, 1.0, 51, long=3.0)
    done(col, root, "garden", "flowerbed", src)
if "verge" in want:
    col, root = tile("forest", "verge", [(g1, 3, (1.0, 1.8)), (g2, 2, (1.0, 1.7))], 170, 4.0, 37, tall=1.5, extra=[(fern, 6, (0.5, 0.9))])
    done(col, root, "forest", "verge", src)
for o in g1 + g2 + gaz + urs + dan + fern:
    try: bpy.data.objects.remove(o, do_unlink=True)
    except Exception: pass
comp.purge()
if "path" in want:
    # a garden path: a strip of paving, 1.3 m by 16 m
    ptex = None
    for cand in ("cobblestone_floor_08", "cobblestone_floor_04", "cobblestone_05", "stone_tiles_02", "brick_pavement_02", "gravel_floor"):
        try:
            comp.api("info/" + cand); ptex = cand; break
        except Exception:
            continue
    print("path texture", ptex, flush=True)
    col, root = comp.fresh("path")
    g = comp.mesh(col, root, "path_stones", comp.box((1.3, 16, 0.05), at=(0, 0, -0.025)), comp.ph_texture("garden_path", ptex, tile=1.3, res="2k"))
    comp.uv_box(g, 1.0)
    comp.export(col, root, "garden", "path", made="blender/meadow.py", source=f"own geometry; paving: https://polyhaven.com/a/{ptex}", license="ours; texture CC0", credit=f"Poly Haven ({ptex})")
    for o in list(col.all_objects):
        bpy.data.objects.remove(o, do_unlink=True)
# the lawn: a ground in a grass texture
if "lawn" not in want:
    print("meadow done"); sys.exit(0)
tex = None
for cand in ("leafy_grass", "sparse_grass", "aerial_grass_rock", "grass_path_2"):
    try:
        comp.api("info/" + cand); tex = cand; break
    except Exception:
        continue
print("lawn texture", tex, flush=True)
col, root = comp.fresh("lawn")
g = comp.mesh(col, root, "lawn_floor", comp.box((60, 60, 0.05), at=(0, 0, -0.025)), comp.ph_texture("garden_lawn", tex, tile=2.5, res="2k"))
comp.uv_box(g, 1.0)
comp.export(col, root, "garden", "lawn", made="blender/meadow.py", source=f"own geometry; ground: https://polyhaven.com/a/{tex}", license="ours; texture CC0", credit=f"Poly Haven ({tex})")
print("meadow done")
