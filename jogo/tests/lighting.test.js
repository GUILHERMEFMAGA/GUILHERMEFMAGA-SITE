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
  assert.equal(dawn.daylight, nextDawn.daylight);
  assert.equal(dawn.x, nextDawn.x);
  assert.notEqual(dawn.x, midday.x);
  assert.ok(dawn.daylight >= 0 && dawn.daylight <= 1);
});

test('street lighting clips its glow and restores canvas state', () => {
  const ctx = new ContextStub();
  const light = drawStreetLighting(ctx, 18_000, 1568, 960, road);
  assert.equal(ctx.clipCount, 1);
  assert.equal(ctx.fillRects.length, 20);
  assert.equal(ctx.stack.length, 0);
  assert.equal(ctx.globalAlpha, 1);
  assert.equal(ctx.globalCompositeOperation, 'source-over');
  assert.ok(light.intensity >= .28 && light.intensity <= 1);
});

test('aligned curbside lamps cast warm pools at night and fade out at noon', () => {
  const nightCtx = new ContextStub();
  const night = drawStreetLighting(nightCtx, 0, 1568, 960, road);
  const dayCtx = new ContextStub();
  const day = drawStreetLighting(dayCtx, 75_000, 1568, 960, road);
  assert.equal(night.night, 1);
  assert.equal(nightCtx.fillRects.length, 20);
  assert.equal(day.night, 0);
  assert.equal(dayCtx.fillRects.length, 10);
  assert.equal(nightCtx.stack.length, 0);
  assert.equal(dayCtx.stack.length, 0);
});

test('rain increases the street reflections without changing daytime sun values', () => {
  const dryContext = new ContextStub();
  const wetContext = new ContextStub();
  const dry = drawStreetLighting(dryContext, 75_000, 1568, 960, road);
  const wet = drawStreetLighting(wetContext, 75_000, 1568, 960, road, { rain: .9 });
  assert.equal(wet.intensity, dry.intensity);
  assert.ok(wetContext.fillRects[2].alpha > dryContext.fillRects[2].alpha);
  assert.equal(wetContext.stack.length, 0);
});

test('asphalt glints can follow a curved road centerline', () => {
  const straightContext = new ContextStub();
  const curveContext = new ContextStub();
  drawStreetLighting(straightContext, 75_000, 1568, 960, road);
  drawStreetLighting(curveContext, 75_000, 1568, 960, road, { roadCenterAt: () => 900 });
  assert.notEqual(curveContext.fillRects[2].rect[0], straightContext.fillRects[2].rect[0]);
  assert.equal(curveContext.stack.length, 0);
});

test('streetlamp pools accept map-specific positions for curved sidewalks', () => {
  const ctx = new ContextStub();
  const lampPosts = [{ x: 470, y: 180 }, { x: 1090, y: 780 }];
  drawStreetLighting(ctx, 0, 1568, 960, road, { lampPosts });
  assert.equal(ctx.fillRects.length, 12);
  assert.ok(ctx.fillRects.some(({ rect }) => rect[0] === 378 && rect[1] === 88));
  assert.ok(ctx.fillRects.some(({ rect }) => rect[0] === 998 && rect[1] === 688));
  assert.equal(ctx.stack.length, 0);
});

test('bar neon adds warm facade glow and road reflections without leaking canvas state', () => {
  const ctx = new ContextStub();
  const result = drawStreetLighting(ctx, 75_000, 1568, 960, road, { bar: true });
  assert.equal(result.night, 0);
  assert.equal(ctx.fillRects.length, 14);
  assert.equal(ctx.stack.length, 0);
  assert.equal(ctx.globalAlpha, 1);
  assert.equal(ctx.globalCompositeOperation, 'source-over');
  assert.ok(result.barLight);
  drawCarHighlights(ctx, { x: 950, y: 533, angle: 0 }, result);
  assert.equal(ctx.fillRects.length, 17);
  assert.equal(ctx.stack.length, 0);
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
