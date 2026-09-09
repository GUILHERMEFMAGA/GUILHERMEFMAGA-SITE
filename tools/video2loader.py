#!/usr/bin/env python3
"""
video2loader.py — transforma QUALQUER video numa tela de carregamento pronta pra web.

Ele faz o trabalho chato: corta o audio, reduz resolucao/bitrate pro loader carregar
instante no 4G, garante dimensoes pares (senao o H.264 quebra), gera poster, e —
o mais importante — faz o video virar um LOOP SEM EMENDA.

    python3 tools/video2loader.py MEU_VIDEO.mp4
    python3 tools/video2loader.py MEU_VIDEO.mp4 --loop pingpong --width 1080 --gif
    python3 tools/video2loader.py MEU_VIDEO.mov --alpha --trim 0.4,3.2

Saida em assets/loading/:  loader.mp4, loader.webm, loader-poster.jpg, loader.gif, loader.json
Dependencias: python3 + Pillow (o ffmpeg vem do pacote imageio-ffmpeg; pip install imageio-ffmpeg pillow).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# ---------------------------------------------------------------------------- ffmpeg
def find_ffmpeg() -> str:
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        sys.exit("ffmpeg nao encontrado.  Rode:  pip3 install imageio-ffmpeg")


def run(cmd, check=True):
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                       text=True, check=False)
    if check and p.returncode != 0:
        sys.exit(f"ffmpeg falhou:\n  {' '.join(cmd)}\n{p.stderr[-2000:]}")
    return p.stderr or ""


def probe(ffmpeg: str, path: str) -> dict:
    """Sem ffprobe no container: lê o stderr do proprio ffmpeg."""
    err = run([ffmpeg, "-hide_banner", "-i", path], check=False)   # -i sem saida retorna 1
    info = {"width": 0, "height": 0, "fps": 30.0, "duration": 0.0, "alpha": False,
            "raw": "", "audio": False}
    m = re.search(r"Stream #\d+:\d+.*?Video:.*?(\d{2,5})x(\d{2,5})", err)
    if m:
        info["width"], info["height"] = int(m.group(1)), int(m.group(2))
        info["raw"] = m.group(0)
        if re.search(r"yuva|argb|rgba|bgra|qtrle|png\b|vp9 \(.*alpha", m.group(0), re.I):
            info["alpha"] = True
    if re.search(r"Stream #\d+:\d+.*?Audio:", err):
        info["audio"] = True
    fm = re.search(r"([\d.]+) fps", err)
    if fm:
        info["fps"] = float(fm.group(1))
    dm = re.search(r"Duration: (\d+):(\d+):([\d.]+)", err)
    if dm:
        h, mi, s = int(dm.group(1)), int(dm.group(2)), float(dm.group(3))
        info["duration"] = h * 3600 + mi * 60 + s
    bm = re.search(r"bitrate=\s*(\d+)\s*kb/s", err)
    info["bitrate_kbps"] = int(bm.group(1)) if bm else 0
    if not info["width"]:
        sys.exit("Nao consegui ler o video. E um arquivo de video valido?")
    return info


# ---------------------------------------------------------------------------- filtros
def even(n: float) -> int:
    n = int(round(n))
    return n + (n % 2)


def build_vf(info, a) -> str:
    w = a.width or info["width"]
    if not a.width:                                   # limita sem esticar
        w = min(info["width"], a.max_width)
    w = even(w)
    h = even(info["height"] * (w / info["width"]))
    a.width, a.height = w, h

    parts = [f"fps={a.fps:g}"]
    if a.crop:
        parts.append(f"crop={a.crop}")
    parts.append(f"scale={w}:{h}:force_original_aspect_ratio=decrease:flags=lanczos")
    if a.fit == "pad":
        parts.append(f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color={a.bg}")
    elif a.fit == "cover":
        parts.append(f"scale={w}:{h}:force_original_aspect_ratio=increase")
        parts.append(f"crop={w}:{h}")
    if a.burn:
        parts.append("format=yuva420p,colorchannelmixer=aa=" + str(a.alpha))
    if a.contrast != 1.0 or a.bright != 0.0:
        parts.append(f"eq=contrast={a.contrast}:brightness={a.bright}")
    if a.saturation != 1.0:
        parts.append(f"hue=s={a.saturation}")
    if a.denoise:
        parts.append("hqdn3d=1.5:1.5:6:6")
    if a.posterize:                                     # visual pixel-art / 8-bit
        lv = max(2, 256 // max(2, a.posterize))
        parts.append(f"lutrgb=r={lv}:g={lv}:b={lv}")
    return ",".join(parts)


def concat_chain(vf: str, a) -> str:
    """pingpong = toca e depois toca ao contrario -> loop perfeito, sem corte."""
    if a.loop == "straight":
        return f"[0:v]{vf}[v]"
    if a.loop == "fade":
        k = a.fade
        return (f"[0:v]{vf}[a];"
                f"[a]split[s1][s2];"
                f"[s2]trim=start={a.duration - k:.3f},setpts=PTS-STARTPTS,"
                f"fade=t=in:st=0:d={k}[tail];"
                f"[s1]trim=0:{a.duration - k:.3f}[head];"
                f"[head][tail]overlay=enable='gte(t,0)'[v]")
    # pingpong
    return (f"[0:v]{vf}[fwd];"
            f"[fwd]split[p1][p2];"
            f"[p2]reverse[rev];"
            f"[p1][rev]concat=n=2:v=1:a=0[v]")


# ---------------------------------------------------------------------------- encode
def encode(ffmpeg: str, src: str, out: str, extra: list, label: str):
    cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error"] + extra + [out]
    print(f"  → {label} ...", flush=True)
    run(cmd)
    if os.path.exists(out):
        print(f"     {os.path.relpath(out, ROOT)}  ({os.path.getsize(out)/1024:.0f} KB)")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", help="arquivo .mp4/.mov/.webm/.mkv (ou URL)")
    ap.add_argument("--out", default=os.path.join(ROOT, "assets", "loading"))
    ap.add_argument("--name", default="loader")
    ap.add_argument("--width", type=int, default=0, help="largura final (0 = auto)")
    ap.add_argument("--max-width", type=int, default=1280, help="padrao 1280 (loader nao precisa de 4K)")
    ap.add_argument("--fps", type=float, default=30.0)
    ap.add_argument("--fit", choices=["pad", "cover", "stretch"], default="pad")
    ap.add_argument("--bg", default="0x0a0618", help="cor das bordas no modo pad")
    ap.add_argument("--loop", choices=["pingpong", "straight", "fade"], default="pingpong",
                    help="pingpong (padrao) da loop perfeito em qualquer video")
    ap.add_argument("--fade", type=float, default=0.5, help="segundos de crossfade (loop=fade)")
    ap.add_argument("--trim", default=None, help="inicio,duracao  ex.: 0.5,3.0")
    ap.add_argument("--crop", default=None, help="w:h:x:y  ex.: 1080:1080:0:0 (quadrado)")
    ap.add_argument("--crf", type=int, default=24, help="maior = mais leve (22..30)")
    ap.add_argument("--preset", default="slow")
    ap.add_argument("--poster-time", type=float, default=-1, help="-1 = 1a metade")
    ap.add_argument("--gif", action="store_true", help="gera tb um loader.gif (pesado, use p/ doc ou WhatsApp)")
    ap.add_argument("--gif-width", type=int, default=560)
    ap.add_argument("--gif-fps", type=float, default=15.0)
    ap.add_argument("--webp", action="store_true", help="gera tb loader.webp animado")
    ap.add_argument("--alpha", action="store_true", help="mantem transparencia (WebM)")
    ap.add_argument("--burn", action="store_true", help="forca canal alfa no mp4 (pro QuickTime)")
    ap.add_argument("--alpha-value", dest="alpha", type=float, default=1.0)
    ap.add_argument("--denoise", action="store_true", help="limpa granulado de video de celular")
    ap.add_argument("--contrast", type=float, default=1.0)
    ap.add_argument("--bright", type=float, default=0.0)
    ap.add_argument("--saturation", type=float, default=1.0)
    ap.add_argument("--posterize", type=int, default=0, help="ex.: 8 = visual 8-bit")
    ap.add_argument("--no-json", action="store_true")
    a = ap.parse_args()

    src = a.video
    tmp = None
    if re.match(r"^https?://", src):
        print("baixando video ...")
        tmp = tempfile.mktemp(suffix=".mp4")
        run(["curl", "-sSL", "--max-time", "300", "-o", tmp, src])
        if not os.path.exists(tmp) or os.path.getsize(tmp) < 1024:
            sys.exit("download falhou — baixe o video e passe o caminho local")
        src = tmp

    if not os.path.exists(src):
        sys.exit(f"arquivo nao encontrado: {a.video}")

    ffmpeg = find_ffmpeg()
    info = probe(ffmpeg, src)
    print(f"entrada: {info['width']}x{info['height']}  {info['duration']:.2f}s  "
          f"{info['fps']:g}fps  {'com audio' if info['audio'] else 'sem audio'}  "
          f"{info['bitrate_kbps']} kb/s")

    os.makedirs(a.out, exist_ok=True)
    if a.trim:
        st, du = a.trim.split(",")
        a.start, a.duration = float(st), float(du)
    else:
        a.start, a.duration = 0.0, info["duration"]

    vf = build_vf(info, a)
    filt = concat_chain(vf, a)
    out_dur = a.duration * (2 if a.loop == "pingpong" else 1)

    inputs = ["-ss", str(a.start), "-t", str(a.duration), "-i", src]
    graph = ["-filter_complex", filt, "-map", "[v]", "-an"]
    common = inputs + graph

    pix_mp4 = "yuva420p" if (a.alpha or a.burn) else "yuv420p"
    print("codificando:")
    encode(ffmpeg, src, os.path.join(a.out, f"{a.name}.mp4"),
           common + ["-c:v", "libx264", "-preset", a.preset, "-crf", str(a.crf),
                     "-profile:v", "high", "-pix_fmt", pix_mp4,
                     "-movflags", "+faststart", "-r", str(a.fps)],
           "loader mp4 (H.264)")

    encode(ffmpeg, src, os.path.join(a.out, f"{a.name}.webm"),
           common + ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", str(min(a.crf + 8, 50)),
                     "-row-mt", "1", "-cpu-used", "4",
                     "-pix_fmt", "yuva420p" if a.alpha else "yuv420p",
                     "-auto-alt-ref", "0" if a.alpha else "1"],
           "loader webm (VP9)")

    pt = a.poster_time if a.poster_time >= 0 else min(0.4, max(0.0, a.duration * 0.25))
    encode(ffmpeg, src, os.path.join(a.out, f"{a.name}-poster.jpg"),
           ["-ss", str(pt), "-i", src, "-frames:v", "1",
            "-vf", f"scale={a.width}:{a.height}:force_original_aspect_ratio=decrease,"
                   f"pad={a.width}:{a.height}:(ow-iw)/2:(oh-ih)/2:color={a.bg}",
            "-q:v", "3"],
           "poster (primeiro frame)")

    if a.gif:
        gif_graph = (["-filter_complex",
                      f"{filt};[v]fps={min(a.gif_fps, a.fps):g},scale={a.gif_width}:-2:flags=lanczos[gv];"
                      f"[gv]split[ga][gb];[ga]palettegen=max_colors=128:stats_mode=diff[gp];"
                      f"[gb][gp]paletteuse=dither=bayer:bayer_scale=4[vout]",
                      "-map", "[vout]", "-loop", "0"])
        encode(ffmpeg, src, os.path.join(a.out, f"{a.name}.gif"),
               inputs + gif_graph, "gif (preview/alternativa)")

    if a.webp:
        encode(ffmpeg, src, os.path.join(a.out, f"{a.name}.webp"),
               inputs + ["-filter_complex", f"{filt};[v]scale=640:-2:flags=lanczos[wv]",
                         "-map", "[wv]", "-an", "-c:v", "libwebp_anim",
                         "-loop", "0", "-quality", "60"],
               "webp animado")

    manifest = {
        "name": a.name,
        "width": a.width,
        "height": a.height,
        "fps": a.fps,
        "loopMode": a.loop,
        "durationSeconds": round(out_dur, 3),
        "files": {"mp4": f"{a.name}.mp4", "webm": f"{a.name}.webm",
                  "poster": f"{a.name}-poster.jpg"},
        "sizes": {},
        "generatedAt": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
    }
    if a.gif:
        manifest["files"]["gif"] = f"{a.name}.gif"
    if a.webp:
        manifest["files"]["webp"] = f"{a.name}.webp"
    for k, f in manifest["files"].items():
        p = os.path.join(a.out, f)
        manifest["sizes"][k] = round(os.path.getsize(p) / 1024, 1) if os.path.exists(p) else 0
    if not a.no_json:
        with open(os.path.join(a.out, f"{a.name}.json"), "w") as fh:
            json.dump(manifest, fh, indent=2, ensure_ascii=False)

    if tmp and os.path.exists(tmp):
        os.remove(tmp)

    total = sum(manifest["sizes"].values())
    print(f"\npronto! {total:.0f} KB no total")
    if a.gif and manifest["sizes"].get("gif", 0) > 1500:
        print(f"  aviso: o GIF ficou em {manifest['sizes']['gif']:.0f} KB — bom p/ mostrar o resultado,")
        print("        mas NAO use <img src=.gif> como loader. Use o MP4/WebM (ou --gif-width 400 --gif-fps 12).")
    print("""
Cole isto no <head> do site (antes do </head>):

  <link rel="stylesheet" href="assets/loading/loader.css">
  <script src="assets/loading/loader.js"
          data-src="assets/loading/loader.mp4"
          data-webm="assets/loading/loader.webm"
          data-poster="assets/loading/loader-poster.jpg"
          data-min="900"></script>
""")


if __name__ == "__main__":
    main()
