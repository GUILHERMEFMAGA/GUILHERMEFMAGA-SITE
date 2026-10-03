import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import test from 'node:test';

const bundlePath = new URL('../../Rua-Vermelha-offline.html', import.meta.url);

test('offline HTML contains one self-contained JavaScript module that parses cleanly', () => {
  const html = readFileSync(bundlePath, 'utf8');
  const embeddedModules = [...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];

  assert.equal(embeddedModules.length, 1);
  assert.doesNotMatch(html, /(?:src|href)="\.\/(?:game|lighting|collision|vehicle-physics|weather|procedural-city)\.js"/);
  assert.doesNotThrow(() => new Script(embeddedModules[0][1]));
});
