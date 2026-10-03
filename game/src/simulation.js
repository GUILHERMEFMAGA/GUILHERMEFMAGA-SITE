export const CASTLE_DISTANCE_METERS = 84;
export const ROUTE_METERS = CASTLE_DISTANCE_METERS;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.progress = 0;
    this.strafe = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.stride = 0;
    this.moving = false;
  }

  update(controls, deltaSeconds) {
    const dt = clamp(deltaSeconds, 0, 0.05);
    let forward = controls.forward || 0;
    let side = controls.side || 0;
    const length = Math.hypot(forward, side);
    if (length > 1) {
      forward /= length;
      side /= length;
    }

    const pace = controls.run ? 1.65 : 1;
    const step = 0.075 * pace * dt;
    this.progress = clamp(this.progress + forward * step, 0, 1);
    this.strafe = clamp(this.strafe + side * 0.34 * dt, -0.42, 0.42);
    this.moving = length > 0;
    if (this.moving) this.stride += dt * (controls.run ? 13 : 8.5);
    return this.snapshot();
  }

  look(deltaX, deltaY) {
    this.yaw = clamp(this.yaw + deltaX * 0.0021, -1.15, 1.15);
    this.pitch = clamp(this.pitch - deltaY * 0.0017, -0.35, 0.35);
    return this.snapshot();
  }

  snapshot() {
    const metersToGate = Math.round(CASTLE_DISTANCE_METERS - this.progress * ROUTE_METERS);
    return {
      progress: this.progress,
      metersToGate,
      arrived: this.progress >= 1,
      zoom: 1 + this.progress * 0.72,
      panX: clamp(this.strafe * 0.10 + this.yaw * 0.028, -0.11, 0.11),
      panY: clamp(this.pitch * 0.055, -0.02, 0.02),
      bobX: this.moving ? Math.sin(this.stride) * 0.0055 : 0,
      bobY: this.moving ? Math.abs(Math.sin(this.stride * 2)) * 0.012 : 0,
      moving: this.moving,
      stride: this.stride,
    };
  }
}
