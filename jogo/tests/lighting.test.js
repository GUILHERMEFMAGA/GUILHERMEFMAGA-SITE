import assert from 'node:assert/strict';
import test from 'node:test';
import { drawCarHighlights, drawStreetLighting, getSunlight } from '../lighting.js';

const road = { left: 548, right: 1018 };

class GradientStub {
  constructor() { this.stops = []; }
  addColorStop(offset, color) { this.stops.push({ offset, color }); }
}

class ContextStub {
  constructor() {
    this.stack = [];
    this.fillRects = [];
    this.clipCount = 0;
    this.globalAlpha = 1;
    this.globalCompositeOperation = 'source-over';
  }
  save() { this.stack.push({ alpha: this.globalAlpha, composite: this.globalCompositeOperation }); }
  restore() {
    const previous = this.stack.pop();
    this.globalAlpha = previous.alpha;
    this.globalCompositeOperation = previous.composite;
  }
  beginPath() {}
  rect() {}
  clip() { this.clipCount += 1; }
  translate() {}
  rotate() {}
  fillRect(...rect) { this.fillRects.push({ rect, alpha: this.globalAlpha, fillStyle: this.fillStyle }); }
  createRadialGradient() { return new GradientStub(); }
}

test('sun position and intensity are periodic and stay on the road', () => {
  const dawn = getSunlight(0, 1568, 960, road);
  const midday = getSunlight(75_000, 1568, 960, road);
  const nextDawn = getSunlight(150_000, 1568, 960, road);
  assert.ok(dawn.x >= road.left && dawn.x <= road.right);
  assert.ok(midday.x >= road.left && midday.x <= road.right);
  assert.equal(midday.intensity, 1);
  assert.equal(dawn.intensity, nextDawn.intensity);
  assert.equal(dawn.x, nextDawn.x);
  assert.notEqual(dawn.x, midday.x);
});

test('street lighting clips its glow and restores canvas state', () => {
  const ctx = new ContextStub();
  const light = drawStreetLighting(ctx, 18_000, 1568, 960, road);
  assert.equal(ctx.clipCount, 1);
  assert.equal(ctx.fillRects.length, 9);
  assert.equal(ctx.stack.length, 0);
  assert.equal(ctx.globalAlpha, 1);
  assert.equal(ctx.globalCompositeOperation, 'source-over');
  assert.ok(light.intensity >= .28 && light.intensity <= 1);
});

test('car highlights are bounded to valid car state and restore canvas state', () => {
  const ctx = new ContextStub();
  drawCarHighlights(ctx, { x: 0, y: 0, angle: 0 }, getSunlight(0, 1568, 960, road));
  assert.equal(ctx.fillRects.length, 2);
  assert.equal(ctx.stack.length, 0);
  assert.equal(ctx.globalAlpha, 1);
  drawCarHighlights(ctx, { x: Number.NaN, y: 0, angle: 0 }, null);
  drawCarHighlights(ctx, null, null);
  assert.equal(ctx.fillRects.length, 2);
});
