import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const gameDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceOrder = ['shaders', 'input', 'renderer', 'world', 'main'];
const bundledRuntime = sourceOrder.map((name) => {
  const path = resolve(gameDir, 'src', `${name}.js`);
  return readFileSync(path, 'utf8')
    .replace(/^import\s+.*?;\s*\n/gm, '')
    .replace(/^export\s+/gm, '');
}).join('\n\n');
const runtime = `(() => {\n${bundledRuntime}\n})();`;

// Fail the build early if concatenation leaves invalid classic-script syntax.
new vm.Script(runtime, { filename: 'ashen-way-preview.js' });

const htmlPath = resolve(gameDir, 'index.html');
const outputPath = resolve(gameDir, 'preview.html');
const css = readFileSync(resolve(gameDir, 'styles.css'), 'utf8');
let html = readFileSync(htmlPath, 'utf8');

html = html.replace(
  /\s*<link rel="stylesheet" href="\.\/styles\.css" \/>/,
  `\n    <style>\n${css}\n    </style>`,
);
html = html.replace(
  /\s*<script type="module" src="\.\/src\/main\.js"><\/script>/,
  `\n    <script>\n${runtime}\n    </script>`,
);

if (html.includes('./styles.css') || html.includes('./src/main.js')) {
  throw new Error('Could not replace the modular entrypoints in game/index.html.');
}

writeFileSync(outputPath, html);
console.log(`Built ${outputPath} (${Buffer.byteLength(html)} bytes).`);
