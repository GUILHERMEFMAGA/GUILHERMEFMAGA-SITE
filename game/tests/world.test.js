import test from 'node:test';
import assert from 'node:assert/strict';
import { pathCenter, WORLD_CONFIG, World } from '../src/world.js';

const still = {
  movement: () => ({ forward: 0, strafe: 0, sprint: false }),
  consumeLook: () => ({ x: 0, y: 0 }),
};

test('the world seed and route remain deterministic', () => {
  assert.equal(pathCenter(0), 0);
  assert.equal(pathCenter(42), pathCenter(42));
  assert.equal(WORLD_CONFIG.seed, 1907);
  assert.equal(WORLD_CONFIG.castleZ - WORLD_CONFIG.goalZ, 6);
});

test('the player advances along the fixed path and progress stays bounded', () => {
  const world = new World();
  const forward = { ...still, movement: () => ({ forward: 1, strafe: 0, sprint: false }) };
  for (let i = 0; i < 20; i++) world.update(forward, 0.05);
  assert.ok(Math.abs(world.z - WORLD_CONFIG.walkSpeed) < 1e-9);
  assert.ok(world.snapshot().progress > 0);
  for (let i = 0; i < 400; i++) world.update(forward, 0.05);
  assert.equal(world.z, WORLD_CONFIG.goalZ);
  assert.equal(world.snapshot().progress, 1);
});

test('strafe is bounded and camera position follows the winding road', () => {
  const world = new World();
  const right = { ...still, movement: () => ({ forward: 0, strafe: 1, sprint: false }) };
  for (let i = 0; i < 100; i++) world.update(right, 0.05);
  assert.equal(world.lateral, 6.5);
  assert.equal(world.snapshot().x, pathCenter(world.z) + world.lateral);
});

test('look input is consumed once and pitch is clamped', () => {
  const world = new World();
  let look = { x: 120, y: -900 };
  const input = { ...still, consumeLook: () => { const next = look; look = { x: 0, y: 0 }; return next; } };
  const first = world.update(input, 0.016);
  const second = world.update(input, 0.016);
  assert.ok(first.yaw > 0);
  assert.equal(first.pitch, 0.34);
  assert.equal(second.yaw, first.yaw);
});

test('forward movement follows the first-person heading', () => {
  const world = new World();
  const lookRight = { ...still, consumeLook: () => ({ x: Math.PI / (2 * 0.00235), y: 0 }) };
  world.update(lookRight, 0.016);
  const forward = { ...still, movement: () => ({ forward: 1, strafe: 0, sprint: false }) };
  world.update(forward, 0.05);
  assert.ok(world.z < 0.01);
  assert.ok(world.lateral > 0.2);
});

test('the near-castle detail ramp and distance stay continuous', () => {
  const world = new World();
  const forward = { ...still, movement: () => ({ forward: 1, strafe: 0, sprint: false }) };
  for (let i = 0; i < 182; i++) world.update(forward, 0.05);
  const early = world.snapshot();
  for (let i = 0; i < 18; i++) world.update(forward, 0.05);
  const later = world.snapshot();
  assert.ok(later.detail > early.detail);
  assert.ok(later.castleDistance < early.castleDistance);
  assert.ok(later.detail < 1);
});
