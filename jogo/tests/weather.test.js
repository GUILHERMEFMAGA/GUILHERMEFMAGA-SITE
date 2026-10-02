import assert from 'node:assert/strict';
import test from 'node:test';
import { drawWeather, getWeatherState } from '../weather.js';

const CYCLE = 120_000;

class ContextStub {
  constructor() {
    this.stack = [];
    this.rects = [];
    this.globalAlpha = 1;
    this.globalCompositeOperation = 'source-over';
  }
  save() {
    this.stack.push({ alpha: this.globalAlpha, composite: this.globalCompositeOperation });
  }
  restore() {
    const previous = this.stack.pop();
    this.globalAlpha = previous.alpha;
    this.globalCompositeOperation = previous.composite;
  }
  fillRect(...rect) {
    this.rects.push({ rect, alpha: this.globalAlpha, fillStyle: this.fillStyle });
  }
}

test('weather cycles smoothly through clear, breeze, rain and mist and repeats', () => {
  const clear = getWeatherState(0);
  const breeze = getWeatherState(CYCLE * .24);
  const rain = getWeatherState(CYCLE * .51);
  const mist = getWeatherState(CYCLE * .78);
  const nextCycle = getWeatherState(CYCLE);
  assert.equal(clear.kind, 'clear');
  assert.equal(breeze.kind, 'breeze');
  assert.ok(rain.rain > .8);
  assert.equal(rain.kind, 'rain');
  assert.ok(mist.fog > .2);
  assert.equal(mist.kind, 'mist');
  assert.deepEqual(nextCycle, clear);
  for (const weather of [clear, breeze, rain, mist]) {
    assert.ok(weather.rain >= 0 && weather.rain <= 1);
    assert.ok(weather.fog >= 0 && weather.fog <= 1);
    assert.ok(weather.wind >= 0 && weather.wind <= 1);
  }
});

test('weather overlay is deterministic, pixel-scale, and restores canvas state', () => {
  const weather = getWeatherState(CYCLE * .51);
  const first = new ContextStub();
  const second = new ContextStub();
  drawWeather(first, CYCLE * .51, 1568, 960, weather);
  drawWeather(second, CYCLE * .51, 1568, 960, weather);
  assert.ok(first.rects.length > 80);
  assert.deepEqual(first.rects, second.rects);
  assert.equal(first.stack.length, 0);
  assert.equal(first.globalAlpha, 1);
  assert.equal(first.globalCompositeOperation, 'source-over');
});

test('breeze moves leaves without forcing rain or fog', () => {
  const time = CYCLE * .24;
  const weather = getWeatherState(time);
  const context = new ContextStub();
  drawWeather(context, time, 1568, 960, weather);
  assert.equal(weather.rain, 0);
  assert.equal(weather.fog, 0);
  assert.ok(context.rects.length > 0);
  assert.ok(context.rects.every(({ alpha }) => alpha > 0 && alpha <= 1));
});

test('invalid surfaces are ignored safely', () => {
  const weather = getWeatherState(Number.NaN);
  assert.equal(weather.kind, 'clear');
  assert.equal(drawWeather(null, 0, 1568, 960, weather), weather);
  assert.equal(drawWeather(new ContextStub(), 0, 0, 960, weather), weather);
});

test('weather overlay restores canvas state when a draw operation throws', () => {
  const context = new ContextStub();
  context.fillRect = () => { throw new Error('simulated canvas failure'); };
  assert.throws(
    () => drawWeather(context, CYCLE * .51, 1568, 960, getWeatherState(CYCLE * .51)),
    /simulated canvas failure/,
  );
  assert.equal(context.stack.length, 0);
  assert.equal(context.globalAlpha, 1);
  assert.equal(context.globalCompositeOperation, 'source-over');
});
