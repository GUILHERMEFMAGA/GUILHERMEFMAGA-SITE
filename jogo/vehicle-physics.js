/**
 * Kinematics for the top-down sedan.
 *
 * Distances are canvas pixels, time is seconds and angles are radians. Angle 0
 * points north; positive steering turns clockwise. The model combines a bicycle
 * steering response with lateral tire grip, allowing stable cornering and a
 * controlled handbrake drift without changing the established pixel-art render.
 */

const clampVehicle = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const VEHICLE_TAU = Math.PI * 2;
const MAX_INTEGRATION_STEP = 1 / 30;

/** Tuned arcade-realistic parameters expressed in canvas units. */
export const VEHICLE_TUNING = Object.freeze({
  maxForwardSpeed: 236,
  maxReverseSpeed: 92,
  engineAcceleration: 246,
  reverseAcceleration: 170,
  serviceBrakeDeceleration: 440,
  rollingDeceleration: 86,
  handbrakeDeceleration: 128,
  wheelbase: 112,
  maximumSteeringAngle: .52,
  normalLateralGrip: 12,
  handbrakeLateralGrip: 3.2,
  handbrakeYawMultiplier: 1.32,
  maximumLateralSpeed: 105,
});

function approachZero(value, amount) {
  if (value > 0) return Math.max(0, value - amount);
  if (value < 0) return Math.min(0, value + amount);
  return 0;
}

function wrapAngle(angle) {
  return ((angle + Math.PI) % VEHICLE_TAU + VEHICLE_TAU) % VEHICLE_TAU - Math.PI;
}

/**
 * Advances one vehicle simulation step and returns its world-space displacement.
 * Invalid/non-positive time steps are safely ignored; large steps are capped to
 * prevent a caller hiccup from teleporting the vehicle across the road.
 *
 * @param {{x:number,y:number,angle:number,speed:number,lateralSpeed?:number}} car
 * @param {{forward?:boolean,backward?:boolean,steer?:number,handbrake?:boolean}} controls
 * @param {number} dt Seconds since the previous physics step.
 * @returns {{dx:number,dy:number,yawRate:number}}
 */
export function stepVehicle(car, controls, dt) {
  if (!car || typeof car !== 'object') throw new TypeError('stepVehicle requires a mutable car state');
  if (!Number.isFinite(dt) || dt <= 0) return { dx: 0, dy: 0, yawRate: 0 };

  const step = Math.min(dt, MAX_INTEGRATION_STEP);
  const input = controls && typeof controls === 'object' ? controls : {};
  const forward = Boolean(input.forward);
  const backward = Boolean(input.backward);
  const handbrake = Boolean(input.handbrake);
  const steer = clampVehicle(Number.isFinite(input.steer) ? input.steer : 0, -1, 1);
  let speed = clampVehicle(
    Number.isFinite(car.speed) ? car.speed : 0,
    -VEHICLE_TUNING.maxReverseSpeed,
    VEHICLE_TUNING.maxForwardSpeed,
  );
  let lateralSpeed = clampVehicle(
    Number.isFinite(car.lateralSpeed) ? car.lateralSpeed : 0,
    -VEHICLE_TUNING.maximumLateralSpeed,
    VEHICLE_TUNING.maximumLateralSpeed,
  );
  let angle = Number.isFinite(car.angle) ? car.angle : 0;

  if (forward && backward) {
    speed = approachZero(speed, VEHICLE_TUNING.serviceBrakeDeceleration * step);
  } else if (forward) {
    speed = Math.min(VEHICLE_TUNING.maxForwardSpeed, speed + VEHICLE_TUNING.engineAcceleration * step);
  } else if (backward) {
    speed = speed > 0
      ? Math.max(0, speed - VEHICLE_TUNING.serviceBrakeDeceleration * step)
      : Math.max(-VEHICLE_TUNING.maxReverseSpeed, speed - VEHICLE_TUNING.reverseAcceleration * step);
  } else {
    speed = approachZero(speed, VEHICLE_TUNING.rollingDeceleration * step);
  }

  if (handbrake) speed = approachZero(speed, VEHICLE_TUNING.handbrakeDeceleration * step);

  const steeringAngle = steer * VEHICLE_TUNING.maximumSteeringAngle;
  const handbrakeYaw = handbrake && Math.abs(speed) > 35 ? VEHICLE_TUNING.handbrakeYawMultiplier : 1;
  const yawRate = (speed / VEHICLE_TUNING.wheelbase) * Math.tan(steeringAngle) * handbrakeYaw;
  angle = wrapAngle(angle + yawRate * step);

  // Inertial lateral force grows with speed and yaw rate. Tire grip damps it;
  // lowering rear grip under the handbrake produces a recoverable slide.
  const lateralAcceleration = -yawRate * speed;
  const lateralGrip = handbrake ? VEHICLE_TUNING.handbrakeLateralGrip : VEHICLE_TUNING.normalLateralGrip;
  lateralSpeed = (lateralSpeed + lateralAcceleration * step) * Math.exp(-lateralGrip * step);
  lateralSpeed = clampVehicle(lateralSpeed, -VEHICLE_TUNING.maximumLateralSpeed, VEHICLE_TUNING.maximumLateralSpeed);

  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  car.speed = speed;
  car.lateralSpeed = lateralSpeed;
  car.angle = angle;

  return {
    dx: (sin * speed + cos * lateralSpeed) * step,
    dy: (-cos * speed + sin * lateralSpeed) * step,
    yawRate,
  };
}
