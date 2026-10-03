import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const mapAssets = [
  'gta-retro.png',
  'rua-segmento-02.png',
];

test('the two hand-painted opening street tiles remain available as detailed PNGs', () => {
  const dimensions = mapAssets.map((filename) => {
    const path = new URL(`../${filename}`, import.meta.url);
    const image = readFileSync(fileURLToPath(path));
    assert.deepEqual(image.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), filename);
    const width = image.readUInt32BE(16);
    const height = image.readUInt32BE(20);
    assert.ok(width >= 1200 && height >= 800, `${filename} should retain detailed map artwork`);
    assert.ok(width / height >= 1.45 && width / height <= 1.7, `${filename} should be landscape`);
    return { width, height };
  });
  assert.equal(dimensions.length, 2);
});

test('only the two reference tiles are loaded before endless procedural streets', () => {
  const game = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
  assert.match(game, /loadImageAsset\('gta-retro\.png'\)/);
  assert.match(game, /loadImageAsset\('rua-segmento-02\.png'\)/);
  for (const retiredTile of ['rua-segmento-03.png', 'rua-segmento-04.png', 'rua-segmento-05.png']) {
    assert.ok(!game.includes(`loadImageAsset('${retiredTile}')`), `${retiredTile} should no longer be part of the route`);
  }
  assert.match(game, /function createProceduralSection\(/);
  assert.match(game, /advanceSectionWindow\(/);
});
