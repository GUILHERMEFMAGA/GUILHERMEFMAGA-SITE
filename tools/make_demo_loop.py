#!/usr/bin/env python3
"""
Gera o loop de DEMONSTRACAO da tela de carregamento (pixel art, 1280x720, 30fps, 4s, loop perfeito).

Para que serve:
  1. o loader do site ja funciona e pode ser visto antes do video final chegar;
  2. define o formato alvo do video real: 720p, 30fps, sem audio, preto puro, loop suave.

Uso:
    python3 tools/make_demo_loop.py                  # frames + mp4/webm/gif/webp + poster
    python3 tools/make_demo_loop.py --frames-only    # so os PNGs
    python3 tools/make_demo_loop.py --only mp4,gif
"""
from __future__ import annotations

import argparse
import math
import os
import subprocess
import sys

W, H = 320, 180          # resolucao "logica" do pixel art
SCALE = 4                # 320x180 -> 1280x720
FPS = 30
SECONDS = 4.0
N = int(FPS * SECONDS)   # 120 frames

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "loading", "demo")
FRAMES_DIR = os.path.join(OUT_DIR, "frames")

# ---------------------------------------------------------------- fonte 5x7 (X = pixel ligado)
FONT = {
    "A": ".XXX.|X...X|X...X|XXXXX|X...X|X...X|X...X",
    "B": "XXXX.|X...X|X...X|XXXX.|X...X|X...X|XXXX.",
    "C": ".XXX.|X...X|X....|X....|X....|X...X|.XXX.",
    "D": "XXXX.|X...X|X...X|X...X|X...X|X...X|XXXX.",
    "E": "XXXXX|X....|X....|XXXX.|X....|X....|XXXXX",
    "F": "XXXXX|X....|X....|XXXX.|X....|X....|X....",
    "G": ".XXX.|X...X|X....|X.XXX|X...X|X...X|.XXX.",
    "H": "X...X|X...X|X...X|XXXXX|X...X|X...X|X...X",
    "I": "XXXXX|..X..|..X..|..X..|..X..|..X..|XXXXX",
    "J": "..XXX|...X.|...X.|...X.|...X.|X..X.|.XX..",
    "K": "X...X|X..X.|X.X..|XX...|X.X..|X..X.|X...X",
    "L": "X....|X....|X....|X....|X....|X....|XXXXX",
    "M": "X...X|XX.XX|X.X.X|X.X.X|X...X|X...X|X...X",
    "N": "X...X|XX..X|X.X.X|X..XX|X...X|X...X|X...X",
    "O": ".XXX.|X...X|X...X|X...X|X...X|X...X|.XXX.",
    "P": "XXXX.|X...X|X...X|XXXX.|X....|X....|X....",
    "Q": ".XXX.|X...X|X...X|X...X|X.X.X|X..X.|.XX.X",
    "R": "XXXX.|X...X|X...X|XXXX.|X.X..|X..X.|X...X",
    "S": ".XXXX|X....|X....|.XXX.|....X|....X|XXXX.",
    "T": "XXXXX|..X..|..X..|..X..|..X..|..X..|..X..",
    "U": "X...X|X...X|X...X|X...X|X...X|X...X|.XXX.",
    "V": "X...X|X...X|X...X|X...X|X...X|.X.X.|..X..",
    "W": "X...X|X...X|X...X|X.X.X|X.X.X|XX.XX|X...X",
    "X": "X...X|.X.X.|..X..|..X..|..X..|.X.X.|X...X",
    "Y": "X...X|.X.X.|..X..|..X..|..X..|..X..|..X..",
    "Z": "XXXXX|....X|...X.|..X..|.X...|X....|XXXXX",
    "0": ".XXX.|X...X|X..XX|X.X.X|XX..X|X...X|.XXX.",
    "1": "..X..|.XX..|..X..|..X..|..X..|..X..|.XXX.",
    "2": ".XXX.|X...X|....X|...X.|..X..|.X...|XXXXX",
    "3": "XXXX.|....X|....X|.XXX.|....X|....X|XXXX.",
    "4": "X..X.|X..X.|X..X.|XXXXX|...X.|...X.|...X.",
    "5": "XXXXX|X....|X....|XXXX.|....X|....X|XXXX.",
    "6": ".XXX.|X...X|X....|XXXX.|X...X|X...X|.XXX.",
    "7": "XXXXX|....X|...X.|..X..|.X...|.X...|.X...",
    "8": ".XXX.|X...X|X...X|.XXX.|X...X|X...X|.XXX.",
    "9": ".XXX.|X...X|X...X|.XXXX|....X|X...X|.XXX.",
    "!": "..X..|..X..|..X..|..X..|..X..|......|..X..",
    "?": ".XXX.|X...X|....X|..XX.|..X..|......|..X..",
    ".": "......|......|......|......|......|.XX..|.XX..",
    ",": "......|......|......|......|..X..|.X...|XX...",
    ":": "......|.XX..|.XX..|......|.XX..|.XX..|......",
    "-": "......|......|......|XXXXX|......|......|......",
    "_": "......|......|......|......|......|......|XXXXX",
    "+": "......|..X..|..X..|XXXXX|..X..|..X..|......",
    "/": "....X|...X.|...X.|..X..|.X...|.X...|X....",
    "%": "XX..X|XX.X.|...X.|..X..|.X...|.XX.X|X..XX",
    ">": ".X...|..X..|...X.|....X|...X.|..X..|.X...",
    "<": "...X.|..X..|.X...|X....|.X...|..X..|...X.",
    "'": "..X..|..X..|......|......|......|......|......",
    " ": ".....|......|......|......|......|......|.....",
}
ACUTE = {"Á": "A", "É": "E", "Í": "I", "Ó": "O", "Ú": "U"}


# letra -> 7 linhas (10 para com acento). Somente ÁÉÍÓÚ recebem o acento agudo.
def _rows(ch: str) -> list[str]:
    key = ch.upper()
    if key in ACUTE:
        base = FONT[ACUTE[key]].split("|")
        return ["..XX."] + base
    if key == "Ç":
        base = FONT["C"].split("|")
        return base + ["..XX."]
    base = FONT.get(key)
    return base.split("|") if base else FONT[" "].split("|")


def text_size(s: str, scale: int = 1, tracking: int = 1) -> tuple[int, int]:
    n = max(1, len(s))
    w = n * (5 + tracking) * scale - tracking * scale
    h = (8 if any(c.upper() in ACUTE for c in s) else 7) * scale
    return w, h


def draw_text(img, x: int, y: int, s: str, color, scale: int = 1, tracking: int = 1):
    """y = topo da caixa de glifo (1px extra reservado em cima se houver acento)."""
    cx = x
    for ch in s:
        rows = _rows(ch)
        for ry, r_ in enumerate(rows):
            for rx, px_ in enumerate(r_):
                if px_ == "X":
                    gx, gy = cx + rx * scale, y + ry * scale
                    img.paste(color, (gx, gy, gx + scale, gy + scale))
        cx += (5 + tracking) * scale
    return cx - tracking * scale


def stamp(img, sprite: list[str], x: int, y: int, mapping: dict, scale: int = 1):
    for ry, row in enumerate(sprite):
        for rx, ch in enumerate(row):
            col = mapping.get(ch)
            if col:
                gx, gy = x + rx * scale, y + ry * scale
                img.paste(col, (gx, gy, gx + scale, gy + scale))


# ------------------------------------------------------------------ sprites
HEART = ["XXXXXX.", "XOOXXXX", "XOOXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."]
COIN = [".XXX.", "XX.XX", "X.X.X", "X.X.X", "XX.XX", ".XXX."]
CUP = [".X.X.X.", "XXXXXXX", ".XXXXX.", "..XXX..", "..XXX..", ".XXXXX."]
DIAMOND = ["..X..", ".XXX.", "XXXXX", ".XXX.", "..X.."]


def _rng(seed=987654321):
    s = seed

    def nxt():
        nonlocal s
        s = (1103515245 * s + 12345) & 0x7FFFFFFF
        return s / 0x7FFFFFFF
    return nxt


r = _rng()
STARS = [(r() * (W - 1), r() * 112, r(), 1 + int(r() * 2)) for _ in range(90)]
DUST = [(r() * W, r() * H, 0.3 + r() * 0.7, r()) for _ in range(30)]


def ease_sine(t: float) -> float:
    return 0.5 - 0.5 * math.cos(2 * math.pi * t)


def mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


BG_TOP = (8, 6, 26)
BG_BOT = (30, 12, 52)
PINK = (255, 61, 152)
CYAN = (56, 232, 232)
PURPLE = (124, 58, 237)
CREAM = (255, 246, 224)
GOLD = (255, 208, 92)
HORIZON = 132


def render(i: int):
    from PIL import Image

    p = i / N                                    # 0..1 (fase global -> loop continuo)
    img = Image.new("RGB", (W, H), BG_TOP)
    px = img.load()

    # ---------------- fundo: gradiente
    grad = [mix(BG_TOP, BG_BOT, y / (H - 1)) for y in range(H)]
    for y in range(H):
        c = grad[y]
        for x in range(W):
            px[x, y] = c

    # ---------------- estrelas (twinkle com periodo inteiro)
    for sx, sy, ph, sz in STARS:
        tw = 0.35 + 0.65 * (0.5 + 0.5 * math.sin(2 * math.pi * (3 * p + ph)))
        v = min(255, int(255 * tw))
        col = (v, min(255, int(v * 0.95)), min(255, int(v * 1.0)))
        x, y = int(sx), int(sy)
        px[x, y] = col
        if sz > 2 and tw > 0.93:
            if x + 1 < W:
                px[x + 1, y] = col
            if x + 1 < W and y - 1 >= 0:
                px[x + 1, y - 1] = (v, v, v)

    # ---------------- poeira subindo
    for dx, dy, sp, ph in DUST:
        # cada grao sobe exatamente H px por loop -> a costura do loop fecha
        y = int((dy - H * p) % H)
        x = int((dx + 5 * math.sin(2 * math.pi * (p + ph))) % W)
        px[x, y] = mix(grad[y], CYAN, 0.2 + 0.35 * sp)

    # ---------------- grade em perspectiva (rolando; 2 linhas por loop -> fecha o ciclo)
    for k in range(14):
        phase = (k + p * 14 * 2) / 14.0
        phase %= 1.0
        yy = int(HORIZON + (H - HORIZON) * (phase ** 2.2))
        if yy >= H:
            continue
        t = (yy - HORIZON) / max(1, (H - 1 - HORIZON))
        col = mix(PINK, PURPLE, 0.75 * t)
        for x in range(1, W - 1):
            px[x, yy] = mix(grad[yy], col, 0.35 + 0.55 * t)
    vx = W / 2
    for s_ in range(-11, 12):
        x_bottom = vx + s_ * 13
        y = H - 1
        step = 1
        while y > HORIZON:
            prog_ = (y - HORIZON) / (H - 1 - HORIZON)
            x = int(round(vx + (x_bottom - vx) * prog_))
            if 1 <= x < W - 1:
                px[x, y] = mix(px[x, y], PURPLE, 0.45 * prog_ + 0.15)
            y -= step
    for x in range(1, W - 1):
        px[x, HORIZON] = mix(CREAM, PINK, 0.45)
        px[x, HORIZON + 1] = mix(grad[HORIZON + 1], PINK, 0.5)

    # ---------------- brilho central atras da marca
    for y in range(0, H):
        for x in range(0, W, 2):
            d = math.hypot((x - W / 2) / (W * 0.42), (y - 66) / (H * 0.42))
            if d < 1:
                g = (1 - d) ** 2 * (0.10 + 0.05 * math.sin(2 * math.pi * p))
                if g > 0.004:
                    px[x, y] = mix(px[x, y], PURPLE, g)

    # ---------------- titulo
    title = "TITULO GAMES"
    for sc, off, col in ((2, 2, mix(PINK, (0, 0, 0), 0.55)), (2, 1, PINK), (2, 0, CREAM)):
        w_, _ = text_size(title, sc, 2)
        draw_text(img, (W - w_) // 2, 18 - off, title, col, sc, 2)
    sub = "PIXEL ARCADE"
    w_, _ = text_size(sub, 1, 2)
    draw_text(img, (W - w_) // 2, 37, sub, mix(CREAM, CYAN, 0.55), 1, 2)

    # ---------------- fileira de icones "pulando" (loader classico)
    ICO_SC, ICO_W, GAP = 2, 7, 6
    icons = (HEART, COIN, CUP, DIAMOND)
    total_w = len(icons) * ICO_W * ICO_SC + (len(icons) - 1) * GAP
    x0 = (W - total_w) // 2
    base_y, ground_y = 48, 64
    for k, spr in enumerate(icons):
        hop = abs(math.sin(math.pi * ((2 * p + k / len(icons)) % 1.0)))
        yy = base_y + int(round(4 * (1 - hop)))
        xx = x0 + k * (ICO_W * ICO_SC + GAP)
        # sombra no chao
        sh_w = int(ICO_W * ICO_SC * (0.55 + 0.45 * (1 - hop)))
        sx = xx + (ICO_W * ICO_SC - sh_w) // 2
        for x in range(sx, sx + sh_w):
            if 0 <= ground_y + 2 < H:
                px[x, ground_y + 2] = mix(px[x, ground_y + 2], (0, 0, 0), 0.45 * (1 - hop) + 0.2)
        if spr is HEART:
            pal = {".": None, "X": mix(PINK, (255, 170, 215), 0.45 * (1 - hop)), "O": (255, 255, 255)}
        elif spr is COIN:
            pal = {".": None, "X": mix(GOLD, (255, 250, 210), 0.45 * hop), "O": None}
        elif spr is CUP:
            pal = {".": None, "X": mix((255, 214, 120), CREAM, 0.35 * hop), "O": None}
        else:
            pal = {".": None, "X": mix(CYAN, (255, 255, 255), 0.4 * hop), "O": None}
        stamp(img, spr, xx + ICO_SC, yy + ICO_SC, {".": None, "X": (0, 0, 0), "O": None}, ICO_SC)
        stamp(img, spr, xx, yy, pal, ICO_SC)

    # ---------------- barra de progresso
    prog = ease_sine(p)
    bw, bh = 196, 13
    bx, by = (W - bw) // 2, 88
    for x in range(bx - 2, bx + bw + 2):
        for yy in (by - 2, by + bh + 1):
            if 0 <= yy < H:
                px[x, yy] = (0, 0, 0)
    for y in range(by - 2, by + bh + 2):
        for xx in (bx - 2, bx + bw + 1):
            if 0 <= xx < W:
                px[xx, y] = (0, 0, 0)
    filled = int(round(prog * bw))
    seg = 12
    for y in range(by, by + bh):
        for x in range(bx, bx + bw):
            if x - bx < filled:
                k = (x - bx) / max(1, filled - 1) if filled > 1 else 0.0
                base = mix(CYAN, PINK, k)
                if y < by + 3:
                    base = mix(base, (255, 255, 255), 0.45)
                if y >= by + bh - 2:
                    base = mix(base, (0, 0, 0), 0.25)
                if (x - bx) % seg >= seg - 1:
                    base = mix(base, (8, 6, 26), 0.85)
                head = x - bx
                if filled and head >= filled - 2 and y >= by + 3:
                    base = (255, 255, 255)
            else:
                base = mix(grad[y], (255, 255, 255), 0.05) if y >= by + 3 else mix(grad[y], (255, 255, 255), 0.12)
                base = mix(base, (12, 10, 32), 0.55)
                if (x - bx) % seg >= seg - 1:
                    base = mix(base, (0, 0, 0), 0.5)
            px[x, y] = base

    lbl = "CARREGANDO"
    dots = "." * (int(p * 8) % 4)
    txt = lbl + dots
    w_, _ = text_size(txt, 1, 2)
    draw_text(img, (W - w_) // 2, by - 12, txt, CREAM, 1, 2)
    pct = f"{int(round(prog * 100))}%"
    w2, _ = text_size(pct, 1, 1)
    in_fill = w2 + 4 < filled
    draw_text(img, bx + (bw - w2) // 2, by + 3, pct, (0, 0, 0) if in_fill else mix(CREAM, CYAN, 0.4), 1, 1)

    # ---------------- "pressione start" piscando (4 piscadas exatas por loop)
    if int(p * 8) % 2 == 0:
        s2 = "PRESSIONE START"
        w3, _ = text_size(s2, 1, 2)
        draw_text(img, (W - w3) // 2, 112, s2, mix(CREAM, PINK, 0.15), 1, 2)

    # ---------------- moldura
    for x in range(W):
        for yy in (0, 1, H - 1, H - 2):
            px[x, yy] = (0, 0, 0)
    for y in range(H):
        for xx in (0, 1, W - 1, W - 2):
            px[xx, y] = (0, 0, 0)

    # ---------------- scanlines + vinheta + flicker (varredura varrida 1x)
    out = Image.new("RGB", (W, H))
    out.putdata([
        tuple(int(c * (0.80 if (y % 3) == 1 else 1.0) *
                max(0.5, 1 - max(0.0, math.hypot((x - W / 2) / (W / 2), (y - H / 2) / (H / 2)) - 0.92) * 1.4) *
                (1 + 0.02 * math.sin(2 * math.pi * 3 * p))) for c in px[x, y])
        for y in range(H) for x in range(W)
    ])
    return out  # logica 320x180; o upscale sem perdas acontece no ffmpeg


# ------------------------------------------------------------------ encoding
def ffmpeg_exe() -> str:
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


UP = f"scale={W * SCALE}:{H * SCALE}:flags=neighbor"   # 320x180 -> 1280x720 sem borrar
UP_HALF = f"scale={W * 2}:{H * 2}:flags=neighbor"      # -> 640x360 (GIF/WebP)

JOBS = {
    "mp4": lambda src, out: ["-i", src, "-vf", UP, "-c:v", "libx264", "-preset", "slow", "-crf", "20",
                             "-profile:v", "high", "-pix_fmt", "yuv420p",
                             "-movflags", "+faststart", "-an"],
    "webm": lambda src, out: ["-i", src, "-vf", UP, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "34",
                              "-row-mt", "1", "-cpu-used", "4", "-pix_fmt", "yuv420p", "-an"],
    "gif": lambda src, out: ["-i", src, "-vf",
                             UP_HALF + ",fps=20[x];[x]split[a][b];"
                             "[a]palettegen=max_colors=128:stats_mode=diff[p];"
                             "[b][p]paletteuse=dither=bayer:bayer_scale=4"],
    "webp": lambda src, out: ["-i", src, "-vf", UP_HALF,
                              "-c:v", "libwebp_anim", "-loop", "0", "-quality", "58"],
}
EXT = {"mp4": "mp4", "webm": "webm", "gif": "gif", "webp": "webp"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames-only", action="store_true")
    ap.add_argument("--only", default=",".join(JOBS), help="subconjunto: mp4,webm,gif,webp")
    ap.add_argument("--name", default="demo-loader")
    ap.add_argument("--keep-frames", action="store_true")
    ap.add_argument("--out", default=OUT_DIR)
    args = ap.parse_args()

    os.makedirs(FRAMES_DIR, exist_ok=True)
    os.makedirs(args.out, exist_ok=True)
    print(f"renderizando {N} frames @ {W*SCALE}x{H*SCALE} ...", flush=True)
    for i in range(N):
        render(i).save(os.path.join(FRAMES_DIR, f"f{i:04d}.png"), optimize=True)
    print("frames ->", FRAMES_DIR, flush=True)
    if args.frames_only:
        return

    ff = ffmpeg_exe()
    src = os.path.join(FRAMES_DIR, "f%04d.png")
    pat = "-framerate"
    for key in [k.strip() for k in args.only.split(",") if k.strip()]:
        out = os.path.join(args.out, f"{args.name}.{EXT[key]}")
        cmd = [ff, "-y", "-hide_banner", "-loglevel", "error", "-framerate", str(FPS)] + JOBS[key](src, out) + [out]
        print("encoding", key, "...", flush=True)
        subprocess.run(cmd, check=True)
        print(f"  -> {os.path.relpath(out, ROOT)}  {os.path.getsize(out)/1024:.0f} KB", flush=True)

    subprocess.run([ff, "-y", "-hide_banner", "-loglevel", "error",
                    "-i", os.path.join(FRAMES_DIR, "f0000.png"), "-vf", UP,
                    "-frames:v", "1", os.path.join(args.out, f"{args.name}-poster.jpg"),
                    "-q:v", "3"], check=True)
    print("poster ->", os.path.relpath(os.path.join(args.out, f"{args.name}-poster.jpg"), ROOT))

    if not args.keep_frames:
        import shutil
        shutil.rmtree(FRAMES_DIR, ignore_errors=True)
        print("frames temporarios removidos")


if __name__ == "__main__":
    sys.exit(main())
