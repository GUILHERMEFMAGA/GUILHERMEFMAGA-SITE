export const WORLD_CONFIG = Object.freeze({
  seed: 1907,
  castleZ: 84,
  goalZ: 78,
  walkSpeed: 5.5,
  sprintMultiplier: 1.55,
});

export function pathCenter(z) {
  return 0.86 * Math.sin(z * 0.052) + 0.34 * Math.sin(z * 0.117);
}

function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export class World {
  constructor() {
    this.reset();
  }

  reset() {
    this.z = 0;
    this.lateral = 0;
    this.yaw = 0;
    this.pitch = -0.025;
    this.stride = 0;
    this.moving = 0;
  }

  update(input, deltaSeconds) {
    const dt = Math.min(Math.max(deltaSeconds, 0), 0.05);
    const move = input.movement();
    const length = Math.hypot(move.forward, move.strafe);
    const normalizer = length > 1 ? 1 / length : 1;
    const speed = WORLD_CONFIG.walkSpeed * (move.sprint ? WORLD_CONFIG.sprintMultiplier : 1);
    const pace = length ? length * normalizer : 0;

    const forwardStep = move.forward * normalizer * speed * dt;
    const strafeStep = move.strafe * normalizer * speed * dt;
    this.z = clamp(this.z + forwardStep * Math.cos(this.yaw) - strafeStep * Math.sin(this.yaw), 0, WORLD_CONFIG.goalZ);
    this.lateral = clamp(this.lateral + forwardStep * Math.sin(this.yaw) + strafeStep * Math.cos(this.yaw), -6.5, 6.5);
    this.moving = Math.min(1, pace * (move.sprint ? 1.0 : 0.76));
    this.stride += pace * dt * (move.sprint ? 12.5 : 9.0);

    const look = input.consumeLook();
    this.yaw = wrapAngle(this.yaw + look.x * 0.00235);
    this.pitch = clamp(this.pitch - look.y * 0.0021, -0.42, 0.34);

    return this.snapshot();
  }

  snapshot() {
    return {
      x: pathCenter(this.z) + this.lateral,
      z: this.z,
      cameraY: 1.57 + Math.sin(this.stride * 2.0) * 0.018 * this.moving,
      yaw: this.yaw,
      pitch: this.pitch,
      stride: this.stride,
      moving: this.moving,
      detail: smoothstep(18, 72, this.z),
      progress: this.z / WORLD_CONFIG.goalZ,
      remaining: Math.max(0, WORLD_CONFIG.goalZ - this.z),
      castleDistance: Math.max(0, WORLD_CONFIG.castleZ - this.z),
      seed: WORLD_CONFIG.seed,
      castleZ: WORLD_CONFIG.castleZ,
    };
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function wrapAngle(value) {
  const tau = Math.PI * 2;
  return ((value + Math.PI) % tau + tau) % tau - Math.PI;
}
