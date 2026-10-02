#!/usr/bin/env python3
"""Build the self-contained, offline-playable Rua Vermelha HTML file."""

from __future__ import annotations

import base64
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAME_DIR = ROOT / "jogo"
OUTPUT = ROOT / "Rua-Vermelha-offline.html"
ASSETS = {
    "gta-retro.png": "image/png",
    "rua-segmento-02.png": "image/png",
    "rua-segmento-03.png": "image/png",
}


def data_uri(filename: str, media_type: str) -> str:
    encoded = base64.b64encode((GAME_DIR / filename).read_bytes()).decode("ascii")
    return f"data:{media_type};base64,{encoded}"


def main() -> None:
    html = (GAME_DIR / "index.html").read_text(encoding="utf-8")
    css = (GAME_DIR / "style.css").read_text(encoding="utf-8")
    game = (GAME_DIR / "game.js").read_text(encoding="utf-8")
    lighting = (GAME_DIR / "lighting.js").read_text(encoding="utf-8")
    collision = (GAME_DIR / "collision.js").read_text(encoding="utf-8")
    vehicle_physics = (GAME_DIR / "vehicle-physics.js").read_text(encoding="utf-8")

    stylesheet_link = '  <link rel="stylesheet" href="./style.css">'
    module_script = '  <script type="module" src="./game.js"></script>'
    if stylesheet_link not in html or module_script not in html:
        raise RuntimeError("index.html no longer has the expected stylesheet or game module references")

    html = html.replace(stylesheet_link, f"  <style>\n{css}\n  </style>")

    module_imports = (
        r"^import\s+\{\s*drawCarHighlights\s*,\s*drawStreetLighting\s*\}\s+from\s+['\"]\./lighting\.js['\"];\s*\n",
        r"^import\s+\{\s*resolveVehicleMotion\s*\}\s+from\s+['\"]\./collision\.js['\"];\s*\n",
        r"^import\s+\{\s*stepVehicle\s*\}\s+from\s+['\"]\./vehicle-physics\.js['\"];\s*\n",
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
    embedded_assets = {
        filename: data_uri(filename, media_type)
        for filename, media_type in ASSETS.items()
    }
    javascript = (
        "const EMBEDDED_ASSETS = Object.freeze("
        + json.dumps(embedded_assets, ensure_ascii=True, separators=(",", ":"))
        + ");\n\n"
        + bundled_lighting
        + "\n\n"
        + bundled_collision
        + "\n\n"
        + bundled_vehicle_physics
        + "\n\n"
        + game
    )
    html = html.replace(module_script, f"  <script>\n{javascript}\n  </script>")
    OUTPUT.write_text(html, encoding="utf-8")
    print(f"Gerado: {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
