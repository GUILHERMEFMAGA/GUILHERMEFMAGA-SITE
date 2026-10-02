import test from 'node:test';
import assert from 'node:assert/strict';
import { CASTLE_DISTANCE_METERS, GameState, ROUTE_METERS } from '../src/simulation.js';

const neutral = { forward: 0, side: 0, run: false };

test('the opening frame starts on the chosen artwork, at the beginning of the route', () => {
  const state = new GameState().snapshot();
  assert.equal(state.progress, 0);
  assert.equal(state.metersToGate, CASTLE_DISTANCE_METERS);
  assert.equal(state.zoom, 1);
  assert.equal(state.arrived, false);
});

test('forward movement approaches the keep and stops at the gate', () => {
  const game = new GameState();
  for (let i = 0; i < 500; i++) game.update({ ...neutral, forward: 1 }, 0.05);
  assert.equal(game.progress, 1);
  assert.equal(game.snapshot().arrived, true);
  assert.equal(game.snapshot().metersToGate, 0);
  assert.equal(game.snapshot().metersToGate, CASTLE_DISTANCE_METERS - ROUTE_METERS);
});

test('backward movement returns along the same route', () => {
  const game = new GameState();
  for (let i = 0; i < 180; i++) game.update({ ...neutral, forward: 1 }, 0.05);
  const near = game.snapshot().progress;
  for (let i = 0; i < 60; i++) game.update({ ...neutral, forward: -1 }, 0.05);
  assert.ok(game.snapshot().progress < near);
  assert.ok(game.snapshot().progress >= 0);
});

test('look and strafe are bounded for stable image framing', () => {
  const game = new GameState();
  game.look(9000, -9000);
  for (let i = 0; i < 100; i++) game.update({ ...neutral, side: 1 }, 0.05);
  const state = game.snapshot();
  assert.ok(Math.abs(state.panX) <= 0.11);
  assert.ok(Math.abs(state.panY) <= 0.02);
  assert.ok(state.zoom <= 1.22);
});

test('running increases travel speed but frame time is safely clamped', () => {
  const walking = new GameState();
  const running = new GameState();
  walking.update({ ...neutral, forward: 1 }, 0.05);
  running.update({ ...neutral, forward: 1, run: true }, 0.05);
  assert.ok(running.snapshot().progress > walking.snapshot().progress);
  assert.ok(running.snapshot().progress < 0.01);

  const longFrame = new GameState();
  const cappedFrame = new GameState();
  longFrame.update({ ...neutral, forward: 1, run: true }, 5);
  cappedFrame.update({ ...neutral, forward: 1, run: true }, 0.05);
  assert.equal(longFrame.snapshot().progress, cappedFrame.snapshot().progress);
});
