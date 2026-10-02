import assert from 'node:assert/strict';
import test from 'node:test';
import { obbOverlapsAabb, resolveVehicleMotion, sweepObbAabb } from '../collision.js';

const thinCurb = { id: 'thin-curb', x: 50, y: -80, width: 2, height: 160 };

function move(overrides = {}) {
  return resolveVehicleMotion({
    x: 0,
    y: 0,
    startAngle: 0,
    endAngle: 0,
    dx: 100,
    dy: 0,
    dt: 1,
    halfWidth: 10,
    halfLength: 20,
    colliders: [thinCurb],
    ...overrides,
  });
}

test('swept SAT catches a thin curb crossed at high speed', () => {
  const hit = sweepObbAabb({ x: 0, y: 0 }, { x: 100, y: 0 }, 0, 10, 20, thinCurb);
  assert.ok(hit);
  assert.ok(Math.abs(hit.time - .4) < .001);
  assert.equal(hit.normal.x, -1);
  assert.ok(Math.abs(hit.normal.y) < 1e-12);
});

test('vehicle stops before a curb instead of tunneling through it', () => {
  const result = move();
  assert.equal(result.collisions.length, 1);
  assert.ok(result.x + 10 < thinCurb.x);
  assert.ok(result.velocityX < 0);
  assert.equal(obbOverlapsAabb({ x: result.x, y: result.y, angle: 0 }, 10, 20, thinCurb), false);
});

test('collision resolution preserves tangential motion along a wall', () => {
  const result = move({
    dx: 100,
    dy: 80,
    colliders: [{ id: 'wall', x: 50, y: -500, width: 2, height: 1000 }],
  });
  assert.ok(result.x + 10 < 50);
  assert.ok(result.y > 60);
  assert.ok(result.collisions.length >= 1);
});

test('oriented collider avoids the false hit an axis-aligned vehicle box would report', () => {
  const obstacle = { id: 'corner-prop', x: 18, y: -3, width: 4, height: 6 };
  assert.equal(obbOverlapsAabb({ x: 0, y: 0, angle: 0 }, 5, 30, obstacle), false);
  assert.equal(obbOverlapsAabb({ x: 0, y: 0, angle: Math.PI / 2 }, 5, 30, obstacle), true);
});

test('initial penetration is separated and does not leave the car stuck', () => {
  const wall = { id: 'overlap-wall', x: 50, y: -100, width: 10, height: 200 };
  const result = resolveVehicleMotion({
    x: 55,
    y: 0,
    startAngle: 0,
    endAngle: 0,
    dx: 0,
    dy: 0,
    dt: 1 / 60,
    halfWidth: 10,
    halfLength: 20,
    colliders: [wall],
  });
  assert.ok(result.x < 40 || result.x > 70);
  assert.equal(obbOverlapsAabb({ x: result.x, y: result.y, angle: 0 }, 10, 20, wall), false);
});

test('angular sweep catches geometry between two clear endpoint poses', () => {
  const prop = { id: 'rotation-prop', x: -2, y: 17, width: 4, height: 4 };
  const start = { x: 0, y: 0, angle: -Math.PI / 4 };
  const end = { x: 0, y: 0, angle: Math.PI / 4 };
  assert.equal(obbOverlapsAabb(start, 5, 20, prop), false);
  assert.equal(obbOverlapsAabb(end, 5, 20, prop), false);
  const result = resolveVehicleMotion({
    x: 0,
    y: 0,
    startAngle: start.angle,
    endAngle: end.angle,
    dx: 0,
    dy: 0,
    dt: 1,
    halfWidth: 5,
    halfLength: 20,
    colliders: [prop],
  });
  assert.ok(result.collisions.some((collision) => collision.depenetration > 0));
  assert.equal(obbOverlapsAabb({ x: result.x, y: result.y, angle: end.angle }, 5, 20, prop), false);
});

test('sweeps remain non-penetrating across rotated vehicle headings', () => {
  const wall = { id: 'rotated-sweep-wall', x: 300, y: -500, width: 3, height: 1000 };
  for (let degrees = 0; degrees < 360; degrees += 15) {
    const angle = degrees * Math.PI / 180;
    const result = resolveVehicleMotion({
      x: 0,
      y: 0,
      startAngle: angle,
      endAngle: angle,
      dx: 800,
      dy: 0,
      dt: 1 / 60,
      halfWidth: 65,
      halfLength: 118,
      colliders: [wall],
    });
    assert.equal(obbOverlapsAabb({ x: result.x, y: result.y, angle }, 65, 118, wall), false);
  }
});

test('touching a curb while moving away is not treated as a new impact', () => {
  const result = move({ x: 40, dx: -10, dy: 0, dt: 1 });
  assert.equal(result.collisions.length, 0);
  assert.ok(result.x < 31);
});
