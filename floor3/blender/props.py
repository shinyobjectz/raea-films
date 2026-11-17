# AFK's own props, modelled for floor 3 (late-90s office): the CRT monitors on every desk, Dana's cassette recorder,
# her badge, the stairwell's card reader, the copy room's copier, the security desk's answering machine. Each is one
# component (blender/lib/comp.py): standing on its base at the origin, its front toward Blender -y (raea +z), exported
# to assets/models/afk/NAME.glb. Materials the game lights or changes are named for it (crt_screen, crt_led,
# reader_led, copier_display, copier_scan, machine_display, machine_led, recorder_window).
#   raea blender run blender/props.py [NAME ...]
import bpy, bmesh, sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import comp as C
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
PLACE = "afk"

# linear colours (sRGB hex read by eye, decoded)
def hexc(h):
    h = h.lstrip("#")
    def lin(c):
        c = int(c, 16) / 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin(h[0:2]), lin(h[2:4]), lin(h[4:6]))

BEIGE = hexc("#cfc7b2"); BEIGE_D = hexc("#b5ad97"); DARK = hexc("#2a2a2c"); CHAR = hexc("#3a3b3e"); OFFW = hexc("#e2e0d8")


def rbox(size, at=(0, 0, 0)):
    """a box standing on `at` (its base centre)"""
    return C.box(size, (at[0], at[1], at[2] + size[2] / 2))


def frustum(w0, h0, w1, h1, depth, at=(0, 0, 0), drop=0.0):
    """a box whose front (Blender -y) is w0 x h0 and back w1 x h1, `depth` long, its front's base centre at `at`; the
    back's centre dropped by `drop` (a CRT's tube sits low)"""
    bm = bmesh.new()
    vs = []
    for (y, w, h, dz) in ((0, w0, h0, 0), (depth, w1, h1, -drop)):
        for sx, sz in ((-1, 0), (1, 0), (1, 1), (-1, 1)):
            cz = h0 / 2 + dz
            vs.append(bm.verts.new((at[0] + sx * w / 2, at[1] + y, at[2] + cz + (sz - 0.5) * h)))
    for q in ((0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)):
        bm.faces.new([vs[i] for i in q])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def bulge(w, h, amount, at, nx=12, ny=10):
    """a curved glass face w x h facing -y, its centre pushed `amount` toward -y, at `at` (centre)"""
    bm = C.grid(w, h, nx, ny)
    for v in bm.verts:
        u, t = v.co.x / (w / 2), v.co.z / (h / 2)
        v.co.y -= amount * (1 - 0.55 * u * u) * (1 - 0.55 * t * t)
    C.xf(bm, C.T(*at))
    return bm


def keycap_row(n, w, d, h, gap, at):
    return [rbox((w, d, h), (at[0] + (i - (n - 1) / 2) * (w + gap), at[1], at[2])) for i in range(n)]


# ---- the CRT ---------------------------------------------------------------------------------------------------------
def crt():
    col, root = C.fresh("crt")
    plastic = C.mat("crt_plastic", BEIGE, rough=0.55)
    plastic_d = C.mat("crt_plastic_dark", BEIGE_D, rough=0.6)
    glass = C.mat("crt_screen", hexc("#1a2220"), rough=0.08)
    led = C.mat("crt_led", hexc("#1f3a1f"), rough=0.3)
    slot = C.mat("crt_vent", hexc("#141414"), rough=0.9)
    # the swivel base and its neck
    C.mesh(col, root, "crt_base", C.cyl(0.125, 0.018, (0, 0.02, 0), seg=40), plastic_d, smooth=True)
    C.mesh(col, root, "crt_neck", C.cyl(0.07, 0.03, (0, 0.03, 0.018), seg=32, r2=0.055), plastic_d, smooth=True)
    # the bezel and the tube's housing
    bz = C.mesh(col, root, "crt_bezel", rbox((0.41, 0.045, 0.37), (0, -0.165, 0.045)), plastic)
    C.bevel(bz, 0.012, 3, 30)
    hs = C.mesh(col, root, "crt_housing", frustum(0.39, 0.35, 0.25, 0.22, 0.37, (0, -0.145, 0.055), drop=0.03), plastic)
    C.bevel(hs, 0.018, 3, 25)
    # the screen's recess (a dark rim) and the curved glass
    C.mesh(col, root, "crt_recess", rbox((0.33, 0.012, 0.255), (0, -0.19, 0.105)), plastic_d)
    C.mesh(col, root, "crt_glass", bulge(0.305, 0.232, 0.009, (0, -0.1965, 0.2325)), glass, smooth=True)
    # the chin: a power button and its light, three small knobs
    C.mesh(col, root, "crt_power", C.cyl(0.008, 0.006, (0.165, -0.19, 0.066), seg=20, axis="Y"), plastic_d, smooth=True)
    C.mesh(col, root, "crt_led", C.cyl(0.0028, 0.003, (0.145, -0.19, 0.066), seg=12, axis="Y"), led, smooth=True)
    for i, x in enumerate((-0.12, -0.1, -0.08)):
        C.mesh(col, root, f"crt_knob_{i}", C.cyl(0.0045, 0.005, (x, -0.19, 0.066), seg=14, axis="Y"), plastic_d, smooth=True)
    # vents across the top, toward the back
    for i in range(9):
        C.mesh(col, root, f"crt_vent_{i}", rbox((0.16, 0.007, 0.002), (0, 0.02 + i * 0.016, 0.398 - i * 0.0016)), slot)
    C.export(col, root, PLACE, "crt", "blender/props.py", "own geometry (a generic 15-inch office CRT)", "ours", "",
             rig={"screen": "in the scene: the material crt_screen's glow (a screen on)", "led": "in the scene: crt_led's glow"})


# ---- the cassette recorder ----------------------------------------------------------------------------------------------
def recorder():
    col, root = C.fresh("recorder")
    body = C.mat("recorder_body", hexc("#34353a"), rough=0.45)
    trim = C.mat("recorder_trim", hexc("#8a8c90"), rough=0.3, metal=0.8)
    window = C.mat("recorder_window", hexc("#0e0f12"), rough=0.06)
    keyc = C.mat("recorder_key", hexc("#b9babd"), rough=0.35, metal=0.5)
    red = C.mat("recorder_rec", hexc("#8f1f1a"), rough=0.4)
    grille = C.mat("recorder_grille", hexc("#18181a"), rough=0.7)
    label = C.mat("recorder_label", hexc("#d9d2bd"), rough=0.8)
    reel = C.mat("recorder_reel", hexc("#e8e6e0"), rough=0.5)
    b = C.mesh(col, root, "recorder_body", rbox((0.26, 0.15, 0.052)), body)
    C.bevel(b, 0.008, 3, 30)
    # a metal band round the top edge
    C.mesh(col, root, "recorder_band", rbox((0.262, 0.152, 0.004), (0, 0, 0.044)), trim)
    # the speaker: a grille of raised dots on the left of the top
    C.mesh(col, root, "recorder_grille_plate", rbox((0.09, 0.09, 0.002), (-0.075, 0.012, 0.052)), grille)
    dots = []
    for i in range(9):
        for j in range(9):
            x, y = -0.111 + i * 0.009, -0.024 + j * 0.009
            if (x + 0.075) ** 2 + (y - 0.012) ** 2 < 0.04 ** 2:
                dots.append(C.cyl(0.0022, 0.0018, (x, y, 0.054), seg=8))
    C.mesh(col, root, "recorder_dots", C.merge(*dots), body)
    # the cassette door: a dark window, the tape's label and its two reels under it
    C.mesh(col, root, "recorder_door", rbox((0.11, 0.07, 0.003), (0.058, 0.02, 0.052)), body)
    C.mesh(col, root, "recorder_label", rbox((0.08, 0.018, 0.0012), (0.058, 0.044, 0.0552)), label)
    rp = C.pivot(col, root, "recorder_reels", (0.058, 0.012, 0.0552))
    for k, x in enumerate((0.038, 0.078)):
        C.mesh(col, root, f"recorder_reel_{k}", C.cyl(0.009, 0.0014, (x, 0.012, 0.0552), seg=6), reel, parent=rp)
    C.mesh(col, root, "recorder_window", rbox((0.096, 0.03, 0.0012), (0.058, 0.012, 0.0566)), window)
    # the keys along the front edge: rec (red), play, rewind, fast forward, stop, pause
    keys = keycap_row(6, 0.026, 0.034, 0.012, 0.004, (0.0, -0.058, 0.046))
    names = ["rec", "play", "rew", "ff", "stop", "pause"]
    play = None
    for name, bm in zip(names, keys):
        if name == "play":
            pv = C.pivot(col, root, "recorder_play_pivot", (-0.0425, -0.058, 0.052))
            play = C.mesh(col, root, "recorder_key_play", bm, keyc, parent=pv)
            C.bevel(play, 0.002, 2, 30)
        else:
            k = C.mesh(col, root, f"recorder_key_{name}", bm, red if name == "rec" else keyc)
            C.bevel(k, 0.002, 2, 30)
    # a carrying handle at the back
    C.mesh(col, root, "recorder_handle", C.tube([(-0.1, 0.066, 0.05), (-0.09, 0.075, 0.074), (0.0, 0.078, 0.08), (0.09, 0.075, 0.074), (0.1, 0.066, 0.05)], 0.005, res=8), body, smooth=True)
    C.channel("play", [(bpy.data.objects["recorder_play_pivot"], "location", 2, bpy.data.objects["recorder_play_pivot"].location[2], bpy.data.objects["recorder_play_pivot"].location[2] - 0.007)])
    C.channel("reels", [(rp, "rotation_euler", 2, 0.0, -2 * math.pi)])
    C.export(col, root, PLACE, "recorder", "blender/props.py", "own geometry (a generic portable cassette recorder)", "ours", "",
             rig={"play": "the play key goes down 7 mm", "reels": "both reels one whole turn"})


# ---- the badge, lying on the desk --------------------------------------------------------------------------------------
def badge():
    col, root = C.fresh("badge")
    card = C.mat("badge_card", hexc("#efeee9"), rough=0.35)
    band = C.mat("badge_band", hexc("#2c5d8f"), rough=0.4)
    photo = C.mat("badge_photo", hexc("#6b6660"), rough=0.6)
    ink = C.mat("badge_ink", hexc("#1d1d1f"), rough=0.6)
    strap = C.mat("badge_strap", hexc("#23324a"), rough=0.85)
    clip = C.mat("badge_clip", hexc("#a9abae"), rough=0.25, metal=1.0)
    c = C.mesh(col, root, "badge_card", rbox((0.054, 0.086, 0.0009)), card)
    C.bevel(c, 0.0035, 4, 60)
    C.mesh(col, root, "badge_band", rbox((0.054, 0.016, 0.0002), (0, -0.033, 0.0009)), band)
    C.mesh(col, root, "badge_photo", rbox((0.022, 0.028, 0.0002), (-0.012, -0.007, 0.0009)), photo)
    for i, (body, size) in enumerate((("D. OKAFOR", 0.0045), ("I.T.  3", 0.0035), ("STAFF", 0.003))):
        t = C.text(body, size, depth=0.0002, align="LEFT")
        C.xf(t, C.R(-90, "X"))
        C.xf(t, C.T(0.003, -0.012 + i * 0.008, 0.001))
        C.mesh(col, root, f"badge_text_{i}", t, ink)
    C.mesh(col, root, "badge_slot", rbox((0.012, 0.0025, 0.0003), (0, 0.037, 0.0009)), photo)
    C.mesh(col, root, "badge_clip", rbox((0.012, 0.016, 0.003), (0, 0.048, 0.0)), clip)
    # the lanyard, a flat strap curling away on the desk
    pts = [(0, 0.056, 0.002), (0.004, 0.09, 0.002), (0.03, 0.13, 0.002), (0.075, 0.14, 0.002), (0.105, 0.11, 0.002), (0.1, 0.07, 0.002)]
    s = C.tube(pts, 0.005, res=10, sides=1)
    C.xf(s, Matrix.Diagonal((1, 1, 0.25, 1)))
    C.mesh(col, root, "badge_strap", s, strap, smooth=True)
    C.export(col, root, PLACE, "badge", "blender/props.py", "own geometry (a generic staff ID badge)", "ours", "")


# ---- the card reader by the stair door (a wall item: its back at y 0, its front toward -y) -------------------------
def reader():
    col, root = C.fresh("reader")
    body = C.mat("reader_body", hexc("#2b2c2f"), rough=0.4)
    face = C.mat("reader_face", hexc("#1a1b1d"), rough=0.15)
    led = C.mat("reader_led", hexc("#3a1010"), rough=0.3)
    keyc = C.mat("reader_key", hexc("#5a5c60"), rough=0.5)
    b = C.mesh(col, root, "reader_body", C.box((0.085, 0.03, 0.13), (0, -0.015, 0.0)), body)
    C.bevel(b, 0.006, 3, 30)
    C.mesh(col, root, "reader_face", C.box((0.068, 0.002, 0.05), (0, -0.031, 0.03)), face)
    C.mesh(col, root, "reader_led", C.box((0.04, 0.003, 0.004), (0, -0.031, 0.051)), led)
    for i in range(3):
        for j in range(4):
            k = C.mesh(col, root, f"reader_key_{i}_{j}", C.box((0.014, 0.004, 0.009), (-0.019 + i * 0.019, -0.031, -0.008 - j * 0.013)), keyc)
            C.bevel(k, 0.0015, 2, 30)
    C.export(col, root, PLACE, "reader", "blender/props.py", "own geometry (a generic access-card reader)", "ours", "",
             rig={"led": "in the scene: reader_led's glow (red locked, green open)"})


# ---- the copier ----------------------------------------------------------------------------------------------------------
def copier():
    col, root = C.fresh("copier")
    shell = C.mat("copier_shell", OFFW, rough=0.5)
    grey = C.mat("copier_grey", hexc("#5f6266"), rough=0.5)
    dark = C.mat("copier_dark", hexc("#26272a"), rough=0.6)
    disp = C.mat("copier_display", hexc("#10201a"), rough=0.15)
    scan = C.mat("copier_scan", hexc("#20302a"), rough=0.3)
    paper = C.mat("copier_paper", hexc("#f2f1ec"), rough=0.85)
    # the paper cabinet: three drawers with recessed grips
    cab = C.mesh(col, root, "copier_cabinet", rbox((0.62, 0.6, 0.52), (0.08, 0, 0.04)), shell)   # on its plinth
    C.bevel(cab, 0.006, 2, 40)
    for i in range(3):
        z = 0.06 + i * 0.165
        d = C.mesh(col, root, f"copier_drawer_{i}", rbox((0.58, 0.012, 0.15), (0.08, -0.302, z)), shell)
        C.bevel(d, 0.004, 2, 40)
        C.mesh(col, root, f"copier_grip_{i}", rbox((0.16, 0.01, 0.018), (0.08, -0.31, z + 0.115)), dark)
    C.mesh(col, root, "copier_plinth", rbox((0.58, 0.54, 0.04), (0.08, 0.01, 0)), dark)   # a toe kick set in under the cabinet
    # the engine and the scanner over it, the output tray out of the left side
    eng = C.mesh(col, root, "copier_engine", rbox((0.66, 0.62, 0.36), (0.08, 0.0, 0.56)), shell)
    C.bevel(eng, 0.012, 3, 40)
    C.mesh(col, root, "copier_seam", rbox((0.664, 0.624, 0.006), (0.08, 0.0, 0.7)), grey)
    C.mesh(col, root, "copier_gap", rbox((0.52, 0.62, 0.08), (0.04, 0.0, 0.92)), dark)
    sc = C.mesh(col, root, "copier_scanner", rbox((0.66, 0.6, 0.09), (0.08, 0.0, 1.0)), shell)
    C.bevel(sc, 0.008, 3, 40)
    # the scan bar's light under the platen's front edge, seen through a slot
    C.mesh(col, root, "copier_scan", rbox((0.5, 0.004, 0.006), (0.06, -0.302, 1.02)), scan)
    lp = C.pivot(col, root, "copier_lid_hinge", (0.08, 0.29, 1.09))
    lid = C.mesh(col, root, "copier_lid", rbox((0.64, 0.58, 0.03), (0.08, 0.0, 1.09)), shell, parent=lp)
    C.bevel(lid, 0.006, 2, 40)
    C.mesh(col, root, "copier_lid_tray", rbox((0.4, 0.3, 0.012), (0.04, 0.04, 1.12)), grey, parent=lp)
    # the control panel, tipped toward whoever stands there, with its display and buttons
    pn = rbox((0.24, 0.14, 0.035))
    C.xf(pn, C.R(-18, "X"))
    C.xf(pn, C.T(0.28, -0.32, 1.05))
    C.mesh(col, root, "copier_panel", pn, grey)
    dp = rbox((0.1, 0.06, 0.004))
    C.xf(dp, C.R(-18, "X"))
    C.xf(dp, C.T(0.24, -0.335, 1.088))
    C.mesh(col, root, "copier_display", dp, disp)
    btns = []
    for i in range(3):
        for j in range(4):
            bb = rbox((0.016, 0.012, 0.006))
            C.xf(bb, C.R(-18, "X"))
            C.xf(bb, C.T(0.315 + i * 0.022, -0.36 + j * 0.016, 1.074 + j * 0.005))
            btns.append(bb)
    C.mesh(col, root, "copier_buttons", C.merge(*btns), dark)
    go = rbox((0.03, 0.025, 0.008))
    C.xf(go, C.R(-18, "X"))
    C.xf(go, C.T(0.37, -0.31, 1.1))
    C.mesh(col, root, "copier_start", go, C.mat("copier_start", hexc("#2f7a4a"), rough=0.4))
    tray = rbox((0.26, 0.34, 0.012))
    C.xf(tray, C.R(-8, "Y"))
    C.xf(tray, C.T(-0.38, 0.0, 0.8))
    C.mesh(col, root, "copier_tray", tray, grey)
    C.mesh(col, root, "copier_sheets", rbox((0.21, 0.297, 0.004), (-0.37, 0.0, 0.82)), paper)
    C.channel("lid", [(lp, "rotation_euler", 0, 0.0, math.radians(-62))])
    C.export(col, root, PLACE, "copier", "blender/props.py", "own geometry (a generic office photocopier)", "ours", "",
             rig={"lid": "the platen lid opens 62 degrees", "display": "in the scene: copier_display", "scan": "in the scene: copier_scan"})


# ---- the answering machine ------------------------------------------------------------------------------------------------
def answering():
    col, root = C.fresh("answering")
    body = C.mat("machine_body", hexc("#2e2f33"), rough=0.4)
    dark = C.mat("machine_dark", hexc("#141416"), rough=0.6)
    disp = C.mat("machine_display", hexc("#200c08"), rough=0.15)
    led = C.mat("machine_led", hexc("#2a0808"), rough=0.3)
    keyc = C.mat("machine_key", hexc("#7c7e82"), rough=0.45)
    bm = frustum(0.2, 0.028, 0.2, 0.05, 0.16, (0, -0.08, 0.0))
    b = C.mesh(col, root, "machine_body", bm, body)
    C.bevel(b, 0.006, 3, 30)
    # the top slopes from 2.8 cm at the front to 5 cm at the back: things on it lie along that slope
    tilt = math.degrees(math.atan2(0.022, 0.16))
    def on_top(bm, x, y, lift=0.0):
        C.xf(bm, C.R(tilt, "X"))
        z = 0.028 + (y + 0.08) / 0.16 * 0.022
        C.xf(bm, C.T(x, y, z + lift))
        return bm
    C.mesh(col, root, "machine_grille", on_top(rbox((0.07, 0.07, 0.002)), -0.055, 0.02), dark)
    C.mesh(col, root, "machine_window", on_top(rbox((0.06, 0.04, 0.002)), 0.045, 0.035), dark)
    C.mesh(col, root, "machine_display", on_top(rbox((0.036, 0.016, 0.002)), 0.05, -0.02), disp)
    C.mesh(col, root, "machine_led", on_top(C.cyl(0.003, 0.003), 0.085, -0.02), led)
    pb = C.cyl(0.012, 0.006, seg=28)
    C.mesh(col, root, "machine_play", on_top(pb, 0.0, -0.035), keyc, smooth=True)
    keys = [on_top(rbox((0.014, 0.009, 0.004)), x, -0.058) for x in (-0.07, -0.05, -0.03, 0.03, 0.05, 0.07)]
    C.mesh(col, root, "machine_keys", C.merge(*keys), keyc)
    C.export(col, root, PLACE, "answering", "blender/props.py", "own geometry (a generic answering machine)", "ours", "",
             rig={"display": "in the scene: machine_display", "led": "in the scene: machine_led blinks for a message"})


BUILD = {"crt": crt, "recorder": recorder, "badge": badge, "reader": reader, "copier": copier, "answering": answering}
try:
    for name in (argv or list(BUILD)):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        BUILD[name]()
    print("DONE")
except Exception as e:
    import traceback
    traceback.print_exc()
    print("FAILED", e)
    sys.exit(1)
