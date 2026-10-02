import { InputController } from './input.js';
import { Renderer } from './renderer.js';
import { WORLD_CONFIG, World } from './world.js';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#worldCanvas');
const pauseScreen = $('#pauseScreen');
const errorScreen = $('#errorScreen');
const errorMessage = $('#errorMessage');
const startButton = $('#startButton');
const resumeButton = $('#resumeButton');
const engineStatus = $('#engineStatus');
const lookLabel = $('#lookLabel');
const journeyProgress = $('#journeyProgress');
const progressFill = $('#progressFill');
const distanceReadout = $('#distanceReadout');
const stageReadout = $('#stageReadout');
const detailReadout = $('#detailReadout');
const fpsReadout = $('#fpsReadout');

let renderer;
let world = new World();
let playing = false;
let paused = false;
let timeOrigin = performance.now();
let previousFrame = timeOrigin;
let lastHudUpdate = 0;
let fpsWindowStart = timeOrigin;
let fpsFrames = 0;
let fps = 60;
let input;

try {
  renderer = new Renderer(canvas);
} catch (error) {
  errorMessage.textContent = error.message || 'This prototype needs a browser with WebGL 2 enabled.';
  errorScreen.hidden = false;
  $('#statusLed').classList.add('is-error');
  engineStatus.textContent = 'ENGINE OFFLINE';
}

if (renderer) {
  input = new InputController(canvas, () => {
    if (playing && !paused) setPaused(true);
  });
  requestAnimationFrame(frame);
}

function frame(now) {
  const elapsed = Math.min((now - previousFrame) / 1000, 0.05);
  previousFrame = now;
  if (playing && !paused) world.update(input, elapsed);

  const snapshot = world.snapshot();
  renderer.render({ ...snapshot, time: (now - timeOrigin) / 1000 });
  fpsFrames += 1;
  if (now - fpsWindowStart >= 500) {
    fps = Math.round(fpsFrames * 1000 / (now - fpsWindowStart));
    fpsFrames = 0;
    fpsWindowStart = now;
  }
  if (now - lastHudUpdate > 80) {
    updateHud(snapshot);
    lastHudUpdate = now;
  }
  requestAnimationFrame(frame);
}

function updateHud(state) {
  const castleDistance = Math.max(0, Math.round(state.castleDistance));
  distanceReadout.textContent = String(castleDistance).padStart(2, '0');
  const progress = Math.round(state.progress * 1000) / 10;
  progressFill.style.width = `${progress}%`;
  journeyProgress.setAttribute('aria-valuenow', String(Math.round(state.z)));
  journeyProgress.setAttribute('aria-valuetext', `${Math.round(state.z)} metres along the road`);

  if (state.z < 14) stageReadout.textContent = 'THE WOODLINE';
  else if (state.z < 39) stageReadout.textContent = 'THE SUNKEN ROAD';
  else if (state.z < 64) stageReadout.textContent = 'THE LAST WATCH';
  else stageReadout.textContent = 'THE BLACK KEEP';

  if (state.detail < 0.18) detailReadout.textContent = 'DISTANT SILHOUETTE';
  else if (state.detail < 0.73) detailReadout.textContent = 'STONE EMERGING';
  else detailReadout.textContent = 'ETCHED IN STONE';

  engineStatus.textContent = paused ? 'WORLD HELD IN THE MIST' : playing ? 'WORLD IN MOTION' : 'WORLD STANDING BY';
  fpsReadout.textContent = `${fps} FPS`;
}

function begin() {
  if (world.z >= WORLD_CONFIG.goalZ) world.reset();
  playing = true;
  paused = false;
  document.body.classList.add('is-playing');
  document.body.classList.remove('is-paused');
  pauseScreen.hidden = true;
  canvas.focus({ preventScroll: true });
  updateHud(world.snapshot());
}

function setPaused(value) {
  paused = value;
  pauseScreen.hidden = !value;
  document.body.classList.toggle('is-paused', value);
  if (value && document.pointerLockElement === canvas) document.exitPointerLock?.();
  if (value) engineStatus.textContent = 'WORLD HELD IN THE MIST';
}

function restart() {
  world.reset();
  begin();
}

startButton.addEventListener('click', begin);
resumeButton.addEventListener('click', () => setPaused(false));
$('#resetButton').addEventListener('click', restart);
$('#pauseResetButton').addEventListener('click', restart);
$('#lookButton').addEventListener('click', () => {
  if (!playing || paused) return;
  if (canvas.requestPointerLock) canvas.requestPointerLock();
  else lookLabel.textContent = 'DRAG TO LOOK';
});
canvas.addEventListener('click', () => {
  if (!playing || paused || document.pointerLockElement === canvas) return;
  if (canvas.requestPointerLock) canvas.requestPointerLock();
  else lookLabel.textContent = 'DRAG TO LOOK';
});
document.addEventListener('pointerlockchange', () => {
  lookLabel.textContent = document.pointerLockElement === canvas ? 'ESC TO RELEASE' : 'CLICK TO LOOK';
});
document.addEventListener('pointerlockerror', () => {
  lookLabel.textContent = 'DRAG TO LOOK';
});
$('#brandLink').addEventListener('click', (event) => event.preventDefault());

// ResizeObserver drives the low-resolution render target; resize once for browsers with older support.
window.addEventListener('resize', () => renderer?.resize(), { passive: true });

// Keep a concise API on the page for experiments in the browser console.
window.ashenWay = Object.freeze({
  get state() { return world.snapshot(); },
  restart,
  pause: () => setPaused(true),
  resume: () => setPaused(false),
  get fps() { return fps; },
});
