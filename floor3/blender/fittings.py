# The building's fittings: what every office ceiling and wall has and nobody looks at. A lay-in acoustic tile's
# picture (fissured mineral fibre, 600 mm, its edge shadow; diffuse and normal), and small components: the troffer's
# housing (the lens is drawn by the game, lit), a square supply diffuser, a sprinkler head, a smoke detector, a duplex
# outlet, a light switch, a thermostat. Ceiling items hang from their top (origin at the ceiling plane, z 0); wall items
# stand on their back (y 0) facing -y.
#   raea blender run blender/fittings.py
import bpy, bmesh, sys, os, math
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import comp as C

PLACE = "fit"
TEX = os.path.join(C.PROJECT, "assets", "tex")

def save_png(name, arr):
    h, w, _ = arr.shape
    im = bpy.data.images.new(name, w, h, alpha=True)
    rgba = np.concatenate([arr, np.ones((h, w, 1), np.float32)], axis=2) if arr.shape[2] == 3 else arr
    im.pixels.foreach_set(np.flipud(rgba).astype(np.float32).ravel())
    im.filepath_raw = os.path.join(TEX, name)
    im.file_format = "PNG"
    im.save()

def tile_textures(n=1024):
    rng = np.random.default_rng(7)
    def noise(scale, octaves=4):
        out = np.zeros((n, n), np.float32)
        amp, tot = 1.0, 0.0
        for o in range(octaves):
            s = max(2, int(scale * 2 ** o))
            g = rng.random((s + 1, s + 1)).astype(np.float32)
            g[-1, :] = g[0, :]; g[:, -1] = g[:, 0]
            xs = np.linspace(0, s, n, endpoint=False)
            i = xs.astype(int); f = xs - i; f = f * f * (3 - 2 * f)
            a = g[np.ix_(i, i)]; b = g[np.ix_(i, i + 1)]; c = g[np.ix_(i + 1, i)]; d = g[np.ix_(i + 1, i + 1)]
            fx = f[None, :]; fy = f[:, None]
            out += amp * ((a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy)
            tot += amp; amp *= 0.5
        return out / tot
    height = 0.55 * noise(24, 4) + 0.45 * noise(90, 2)
    # fissures: short worm-like pits
    pits = np.zeros((n, n), np.float32)
    for _ in range(2600):
        x, y = rng.random() * n, rng.random() * n
        a = rng.random() * math.pi * 2
        L = rng.integers(3, 14)
        for k in range(L):
            xi, yi = int(x) % n, int(y) % n
            pits[yi, xi] = 1.0
            pits[(yi + 1) % n, xi] = max(pits[(yi + 1) % n, xi], 0.5)
            a += (rng.random() - 0.5) * 1.1
            x += math.cos(a) * 1.3; y += math.sin(a) * 1.3
    height -= 0.35 * pits
    # the tile's edge: a bevelled lip falling away into the shadow of the grid
    u = np.minimum(np.arange(n), n - 1 - np.arange(n)) / n
    edge = np.minimum(u[None, :], u[:, None])
    lip = np.clip(edge / 0.012, 0, 1)
    height = height * lip - (1 - lip) * 0.6
    base = np.array([0.80, 0.785, 0.745], np.float32)
    shade = 0.86 + 0.14 * (height - height.mean()) / (height.std() * 3 + 1e-6)
    shade = np.clip(shade, 0.35, 1.05) * (0.45 + 0.55 * lip)
    stain = noise(3, 3)
    tint = 1.0 - 0.06 * np.clip((stain - 0.62) / 0.2, 0, 1)
    diff = np.clip(base[None, None, :] * (shade * tint)[:, :, None], 0, 1)
    # to sRGB for the picture
    srgb = np.where(diff <= 0.0031308, diff * 12.92, 1.055 * np.power(diff, 1 / 2.4) - 0.055)
    save_png("tile_diff.png", srgb.astype(np.float32))
    gy, gx = np.gradient(height * 3.0)
    nz = np.ones_like(gx)
    nrm = np.stack([-gx, gy, nz], axis=2)
    nrm /= np.linalg.norm(nrm, axis=2, keepdims=True)
    save_png("tile_nor.png", (nrm * 0.5 + 0.5).astype(np.float32))

def white_metal():
    return C.mat("fit_white", (0.82, 0.82, 0.8), rough=0.35, metal=0.0)

def troffer():
    col, root = C.fresh("troffer")
    m = white_metal()
    inner = C.mat("fit_troffer_inner", (0.7, 0.7, 0.68), rough=0.5)
    # a 600 x 1200 lay-in housing: its flange sits on the grid, the lens frame 15 mm inside, the body above
    W, L, F = 0.6, 1.2, 0.022
    parts = [C.box((W, F, 0.012), (0, -L / 2 + F / 2, -0.006)), C.box((W, F, 0.012), (0, L / 2 - F / 2, -0.006)),
             C.box((F, L, 0.012), (-W / 2 + F / 2, 0, -0.006)), C.box((F, L, 0.012), (W / 2 - F / 2, 0, -0.006))]
    C.mesh(col, root, "troffer_flange", C.merge(*parts), m)
    C.mesh(col, root, "troffer_body", C.box((W - 0.02, L - 0.02, 0.1), (0, 0, 0.05)), inner)
    C.export(col, root, PLACE, "troffer", "blender/fittings.py", "own geometry (a 2x4 lay-in troffer housing)", "ours", "")

def diffuser():
    col, root = C.fresh("diffuser")
    m = white_metal()
    dark = C.mat("fit_duct_dark", (0.05, 0.05, 0.05), rough=0.9)
    # a square plaque diffuser: stepped cones of louvres in a 600 frame
    rings = []
    for i, s in enumerate((0.58, 0.48, 0.38, 0.28)):
        t = 0.018
        rings += [C.box((s, t, 0.01), (0, -s / 2 + t / 2, -0.012 - i * 0.012)), C.box((s, t, 0.01), (0, s / 2 - t / 2, -0.012 - i * 0.012)),
                  C.box((t, s, 0.01), (-s / 2 + t / 2, 0, -0.012 - i * 0.012)), C.box((t, s, 0.01), (s / 2 - t / 2, 0, -0.012 - i * 0.012))]
    C.mesh(col, root, "diffuser_rings", C.merge(*rings), m)
    C.mesh(col, root, "diffuser_core", C.box((0.2, 0.2, 0.012), (0, 0, -0.06)), m)
    C.mesh(col, root, "diffuser_throat", C.box((0.56, 0.56, 0.02), (0, 0, 0.01)), dark)
    C.export(col, root, PLACE, "diffuser", "blender/fittings.py", "own geometry (a square ceiling supply diffuser)", "ours", "")

def sprinkler():
    col, root = C.fresh("sprinkler")
    chrome = C.mat("fit_chrome", (0.75, 0.75, 0.75), rough=0.18, metal=1.0)
    red = C.mat("fit_bulb", (0.6, 0.05, 0.03), rough=0.1)
    C.mesh(col, root, "sprinkler_escutcheon", C.cyl(0.032, 0.006, (0, 0, -0.006), seg=24), chrome, smooth=True)
    C.mesh(col, root, "sprinkler_body", C.cyl(0.009, 0.03, (0, 0, -0.036), seg=12), chrome, smooth=True)
    C.mesh(col, root, "sprinkler_bulb", C.cyl(0.003, 0.016, (0, 0, -0.05), seg=8), red, smooth=True)
    C.mesh(col, root, "sprinkler_deflector", C.cyl(0.014, 0.002, (0, 0, -0.054), seg=16), chrome, smooth=True)
    C.export(col, root, PLACE, "sprinkler", "blender/fittings.py", "own geometry (a pendent sprinkler head)", "ours", "")

def smoke():
    col, root = C.fresh("smoke")
    p = C.mat("fit_plastic", (0.85, 0.84, 0.8), rough=0.5)
    led = C.mat("smoke_led", (0.15, 0.02, 0.02), rough=0.3)
    C.mesh(col, root, "smoke_body", C.cyl(0.065, 0.035, (0, 0, -0.035), seg=40, r2=0.055), p, smooth=True)
    for i in range(12):
        a = i / 12 * math.pi * 2
        s = C.box((0.03, 0.004, 0.012), (0, 0, 0))
        C.xf(s, C.R(math.degrees(a), "Z"))
        C.xf(s, C.T(math.cos(a) * 0.045, math.sin(a) * 0.045, -0.02))
        C.mesh(col, root, f"smoke_slot_{i}", s, C.mat("fit_slot", (0.1, 0.1, 0.1), rough=0.9))
    C.mesh(col, root, "smoke_led", C.cyl(0.003, 0.002, (0.03, 0, -0.037), seg=10), led, smooth=True)
    C.export(col, root, PLACE, "smoke", "blender/fittings.py", "own geometry (a ceiling smoke detector)", "ours", "",
             rig={"led": "in the scene: smoke_led blinks"})

def plate(name, kind):
    col, root = C.fresh(name)
    p = C.mat("fit_plate", (0.78, 0.76, 0.7), rough=0.45)
    d = C.mat("fit_slot", (0.1, 0.1, 0.1), rough=0.9)
    w, h = (0.07, 0.115) if kind != "thermostat" else (0.12, 0.085)
    b = C.mesh(col, root, f"{name}_plate", C.box((w, 0.006 if kind != "thermostat" else 0.026, h), (0, -0.003 if kind != "thermostat" else -0.013, 0)), p)
    C.bevel(b, 0.003, 2, 30)
    if kind == "outlet":
        for z in (0.025, -0.025):
            C.mesh(col, root, f"{name}_face_{z>0}", C.box((0.034, 0.004, 0.03), (0, -0.007, z)), p)
            for x in (-0.006, 0.006):
                C.mesh(col, root, f"{name}_slot_{z>0}_{x>0}", C.box((0.0025, 0.002, 0.009), (x, -0.009, z + 0.003)), d)
            C.mesh(col, root, f"{name}_ground_{z>0}", C.cyl(0.0022, 0.002, (0, -0.009, z - 0.008), seg=10, axis="Y"), d)
    elif kind == "switch":
        t = C.box((0.012, 0.012, 0.022), (0, -0.01, 0))
        C.mesh(col, root, f"{name}_toggle", t, p)
    else:
        C.mesh(col, root, f"{name}_display", C.box((0.05, 0.002, 0.022), (-0.02, -0.027, 0.012)), C.mat("thermo_display", (0.12, 0.16, 0.12), rough=0.15))
        for i in range(3):
            C.mesh(col, root, f"{name}_btn_{i}", C.box((0.012, 0.004, 0.008), (0.03, -0.027, 0.02 - i * 0.014)), d)
    C.export(col, root, PLACE, name, "blender/fittings.py", f"own geometry (a wall {kind})", "ours", "")

try:
    os.makedirs(TEX, exist_ok=True)
    tile_textures()
    print("wrote tile textures")
    for f in (troffer, diffuser, sprinkler, smoke):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        f()
    for name, kind in (("outlet", "outlet"), ("switch", "switch"), ("thermostat", "thermostat")):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        plate(name, kind)
    print("DONE")
except Exception as e:
    import traceback
    traceback.print_exc()
    print("FAILED", e)
    sys.exit(1)
