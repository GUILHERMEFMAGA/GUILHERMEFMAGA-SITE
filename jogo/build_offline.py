#!/usr/bin/env python3
"""Build the self-contained, offline-playable Rua Vermelha HTML file."""

from __future__ import annotations

import base64
import json
import os
import re
from pathlib import Path
from tempfile import NamedTemporaryFile


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "jogo"
OUTPUT = ROOT / "Rua-Vermelha-offline.html"
ASSETS = {
    "gta-retro.png": "image/png",
    "rua-segmento-02.png": "image/png",
    "rua-segmento-03.png": "image/png",
    "rua-segmento-04.png": "image/png",
    "rua-segmento-05.png": "image/png",
}


def read_source(filename: str) -> str:
    path = GAME_DIR / filename
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as error:
        raise RuntimeError(f"Cannot read required source file: {path}") from error


def data_uri(filename: str, media_type: str) -> str:
    path = GAME_DIR / filename
    try:
        payload = path.read_bytes()
    except OSError as error:
        raise RuntimeError(f"Cannot read required game asset: {path}") from error
    encoded = base64.b64encode(payload).decode("ascii")
    return f"data:{media_type};base64,{encoded}"


def write_atomically(path: Path, content: str) -> None:
    temporary_path: Path | None = None
    try:
        try:
            output_mode = path.stat().st_mode & 0o777
        except FileNotFoundError:
            output_mode = 0o644
        with NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
            delete=False,
        ) as temporary_file:
            temporary_path = Path(temporary_file.name)
            temporary_file.write(content)
            temporary_file.flush()
            os.fsync(temporary_file.fileno())
        os.chmod(temporary_path, output_mode)
        temporary_path.replace(path)
    except (OSError, UnicodeError) as error:
        if temporary_path is not None:
            try:
                temporary_path.unlink(missing_ok=True)
            except OSError:
                pass
        raise RuntimeError(f"Cannot safely write offline game bundle: {path}") from error


def main() -> None:
    html = read_source("index.html")
    css = read_source("style.css")
    game = read_source("game.js")
    lighting = read_source("lighting.js")
    collision = read_source("collision.js")
    vehicle_physics = read_source("vehicle-physics.js")
    weather = read_source("weather.js")

    stylesheet_link = '  <link rel="stylesheet" href="./style.css">'
    module_script = '  <script type="module" src="./game.js"></script>'
    if html.count(stylesheet_link) != 1 or html.count(module_script) != 1:
        raise RuntimeError("index.html must contain exactly one stylesheet and one game module reference")

    html = html.replace(stylesheet_link, f"  <style>\n{css}\n  </style>")

    module_imports = (
        r"^import\s+\{\s*drawCarHighlights\s*,\s*drawStreetLighting\s*\}\s+from\s+['\"]\./lighting\.js['\"];\s*\n",
        r"^import\s+\{\s*resolveVehicleMotion\s*\}\s+from\s+['\"]\./collision\.js['\"];\s*\n",
        r"^import\s+\{\s*stepVehicle\s*\}\s+from\s+['\"]\./vehicle-physics\.js['\"];\s*\n",
        r"^import\s+\{\s*drawWeather\s*,\s*getWeatherState\s*\}\s+from\s+['\"]\./weather\.js['\"];\s*\n",
    )
    for import_pattern in module_imports:
        game, replacements = re.subn(import_pattern, "", game, count=1)
        if replacements != 1:
            raise RuntimeError(f"game.js is missing expected module import: {import_pattern}")
    if "import.meta" in game:
        asset_loader = "image.src = new URL(`./${filename}`, import.meta.url).href;"
        if asset_loader not in game:
            raise RuntimeError("game.js has an unhandled import.meta reference")
        game = game.replace(asset_loader, "image.src = EMBEDDED_ASSETS[filename];")
    elif "EMBEDDED_ASSETS[filename]" not in game:
        raise RuntimeError("game.js has neither a module asset URL nor the offline asset loader")

    bundled_lighting = re.sub(r"^export\s+", "", lighting, flags=re.MULTILINE)
    bundled_collision = re.sub(r"^export\s+", "", collision, flags=re.MULTILINE)
    bundled_vehicle_physics = re.sub(r"^export\s+", "", vehicle_physics, flags=re.MULTILINE)
    bundled_weather = re.sub(r"^export\s+", "", weather, flags=re.MULTILINE)
    embedded_assets = {
        filename: data_uri(filename, media_type)
        for filename, media_type in ASSETS.items()
    }

    def scoped_module(source: str, exports: tuple[str, ...]) -> str:
        exported_names = ", ".join(exports)
        return f"(() => {{\n{source}\nreturn {{ {exported_names} }};\n}})()"

    javascript = (
        "const EMBEDDED_ASSETS = Object.freeze("
        + json.dumps(embedded_assets, ensure_ascii=True, separators=(",", ":"))
        + ");\n\n"
        + f"const {{ drawCarHighlights, drawStreetLighting }} = {scoped_module(bundled_lighting, ('drawCarHighlights', 'drawStreetLighting'))};\n"
        + f"const {{ resolveVehicleMotion }} = {scoped_module(bundled_collision, ('resolveVehicleMotion',))};\n"
        + f"const {{ stepVehicle }} = {scoped_module(bundled_vehicle_physics, ('stepVehicle',))};\n"
        + f"const {{ drawWeather, getWeatherState }} = {scoped_module(bundled_weather, ('drawWeather', 'getWeatherState'))};\n\n"
        + game
    )
    html = html.replace(module_script, f"  <script type=\"module\">\n{javascript}\n  </script>")
    write_atomically(OUTPUT, html)
    print(f"Gerado: {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
