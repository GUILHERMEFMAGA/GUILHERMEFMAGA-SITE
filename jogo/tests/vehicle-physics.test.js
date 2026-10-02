import assert from 'node:assert/strict';
import test from 'node:test';
import { stepVehicle, VEHICLE_TUNING } from '../vehicle-physics.js';

function makeCar(overrides = {}) {
  return {
    x: 0,
    y: 0,
    angle: 0,
    speed: 0,
    lateralSpeed: 0,
    ...overrides,
  };
}

test('forward acceleration is bounded and moves north at heading zero', () => {
  const car = makeCar();
  for (let frame = 0; frame < 240; frame += 1) {
    const movement = stepVehicle(car, { forward: true }, 1 / 60);
    car.x += movement.dx;
    car.y += movement.dy;
    if (frame === 0) assert.ok(movement.dy < 0);
  }
  assert.equal(car.speed, VEHICLE_TUNING.maxForwardSpeed);
  assert.ok(car.y < -500);
});

test('service braking reaches zero before reverse acceleration begins', () => {
  const car = makeCar({ speed: 80 });
  for (let frame = 0; frame < 6; frame += 1) stepVehicle(car, { backward: true }, 1 / 60);
  assert.ok(car.speed > 0);
  for (let frame = 0; frame < 6; frame += 1) stepVehicle(car, { backward: true }, 1 / 60);
  assert.ok(car.speed <= 0);
  for (let frame = 0; frame < 120; frame += 1) stepVehicle(car, { backward: true }, 1 / 60);
  assert.equal(car.speed, -VEHICLE_TUNING.maxReverseSpeed);
});

test('bicycle steering rotates smoothly and adds bounded lateral slip', () => {
  const car = makeCar({ speed: 180 });
  let totalX = 0;
  for (let frame = 0; frame < 60; frame += 1) {
    totalX += stepVehicle(car, { steer: 1 }, 1 / 60).dx;
  }
  assert.ok(car.angle > 0 && car.angle < Math.PI);
  assert.ok(totalX > 0);
  assert.ok(car.lateralSpeed < 0);
  assert.ok(Math.abs(car.lateralSpeed) <= VEHICLE_TUNING.maximumLateralSpeed);
});

test('handbrake loosens lateral grip for a controlled drift', () => {
  const normal = makeCar({ speed: 180 });
  const drifting = makeCar({ speed: 180 });
  for (let frame = 0; frame < 30; frame += 1) {
    stepVehicle(normal, { steer: 1 }, 1 / 60);
    stepVehicle(drifting, { steer: 1, handbrake: true }, 1 / 60);
  }
  assert.ok(Math.abs(drifting.lateralSpeed) > Math.abs(normal.lateralSpeed));
  assert.ok(Math.abs(drifting.lateralSpeed) <= VEHICLE_TUNING.maximumLateralSpeed);
});

test('invalid time steps are ignored and large steps are bounded', () => {
  const car = makeCar({ speed: 42 });
  const before = { ...car };
  assert.deepEqual(stepVehicle(car, { forward: true }, Number.NaN), { dx: 0, dy: 0, yawRate: 0 });
  assert.deepEqual(car, before);
  const movement = stepVehicle(car, { forward: true }, 1);
  assert.ok(Math.hypot(movement.dx, movement.dy) <= VEHICLE_TUNING.maxForwardSpeed / 30);
});

test('invalid vehicle state is rejected explicitly', () => {
  assert.throws(() => stepVehicle(null, {}, 1 / 60), TypeError);
});
