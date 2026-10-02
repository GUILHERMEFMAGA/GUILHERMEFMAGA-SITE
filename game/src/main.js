import { GameState } from './simulation.js';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#worldCanvas');
const context = canvas.getContext('2d', { alpha: false });
const imageError = $('#imageLoadError');
const image = new Image();
const game = new GameState();
const heldKeys = new Set();
const heldTouch = new Set();
const shell = $('#gameShell');

let paused = false;
let dragging = false;
let lastPointer = null;
let lookDX = 0;
let lookDY = 0;
let attackUntil = 0;
let animationStart = performance.now();
let lastFrame = animationStart;
let lastHud = 0;
let fpsStart = animationStart;
let fpsFrames = 0;
let fps = 60;

image.src = new URL('../../images/ashen-way-3d-pixel-game.png', import.meta.url).href;
image.addEventListener('load', () => {
  imageError.hidden = true;
  resizeCanvas();
});
image.addEventListener('error', () => { imageError.hidden = false; });

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  const width = Math.round(rect.width * ratio);
  const height = Math.round(rect.height * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.imageSmoothingEnabled = false;
}

function movement() {
  const down = (key, touch) => heldKeys.has(key) || heldTouch.has(touch);
  return {
    forward: Number(down('w', 'forward') || down('arrowup', 'forward')) - Number(down('s', 'back') || down('arrowdown', 'back')),
    side: Number(down('d', 'right') || down('arrowright', 'right')) - Number(down('a', 'left') || down('arrowleft', 'left')),
    run: heldKeys.has('shift') || heldTouch.has('run'),
  };
}

function updateHud(frame) {
  $('#distanceReadout').textContent = String(frame.metersToGate).padStart(2, '0');
  $('#progressLabel').textContent = `${Math.round(frame.progress * 100)}%`;
  $('#progressFill').style.width = `${frame.progress * 100}%`;
  $('#routeProgress').setAttribute('aria-valuenow', String(Math.round(frame.progress * 100)));

  if (frame.progress < 0.24) {
    $('#stageReadout').textContent = 'A FLORESTA';
    $('#detailReadout').textContent = 'MISTÉRIO À FRENTE';
  } else if (frame.progress < 0.58) {
    $('#stageReadout').textContent = 'A ESTRADA ANTIGA';
    $('#detailReadout').textContent = 'TORRES À VISTA';
  } else if (frame.progress < 0.88) {
    $('#stageReadout').textContent = 'A ÚLTIMA VIGÍLIA';
    $('#detailReadout').textContent = 'PEDRA E BRASA';
  } else {
    $('#stageReadout').textContent = 'O PORTÃO NEGRO';
    $('#detailReadout').textContent = 'QUASE LÁ';
  }

  $('#engineStatus').textContent = paused ? 'JORNADA PAUSADA' : frame.arrived ? 'PORTÃO ALCANÇADO' : frame.moving ? 'CAMINHANDO' : 'A ESTRADA AGUARDA';
  $('#pauseButton').textContent = paused ? '▶' : 'Ⅱ';
  shell.classList.toggle('is-paused', paused);
  shell.classList.toggle('is-playing', !paused);
  $('#arrivalScreen').hidden = !frame.arrived;
  $('#pauseScreen').hidden = !paused;
}

function drawFog(time, width, height) {
  const bands = 5;
  for (let i = 0; i < bands; i++) {
    const phase = time * (0.025 + i * 0.004) + i * 2.7;
    const y = height * (0.47 + i * 0.031 + Math.sin(phase) * 0.006);
    const bandWidth = width * (0.18 + ((i * 37) % 6) * 0.07);
    const x = ((Math.sin(phase * 0.73 + i) * 0.5 + 0.5) * (width + bandWidth)) - bandWidth * 0.5;
    context.fillStyle = `rgba(154, 179, 201, ${0.018 + i * 0.003})`;
    context.fillRect(Math.round(x / 6) * 6, Math.round(y / 6) * 6, Math.round(bandWidth / 6) * 6, Math.max(4, Math.round(height * 0.012 / 4) * 4));
  }
}

function drawEmbers(time, width, height, progress) {
  for (let i = 0; i < 13; i++) {
    const seed = i * 127.1;
    const drift = (time * (5 + (i % 4) * 2) + seed) % width;
    const x = Math.round((width * (0.36 + (i % 7) * 0.055) + drift * 0.12) / 4) * 4;
    const y = Math.round((height * (0.38 + ((i * 31) % 43) / 100) - Math.sin(time * 0.55 + i) * 9) / 4) * 4;
    const alpha = 0.16 + 0.20 * (0.5 + 0.5 * Math.sin(time * 2.1 + i * 5.3));
    context.fillStyle = `rgba(255, ${Math.round(118 + 54 * progress)}, 42, ${alpha})`;
    context.fillRect(x, y, i % 4 === 0 ? 4 : 3, i % 4 === 0 ? 4 : 3);
  }
}

function drawSwordArc(time, width, height) {
  const remaining = attackUntil - time;
  if (remaining <= 0) return;
  const strength = Math.min(1, remaining / 0.26);
  context.save();
  context.globalAlpha = strength * 0.72;
  const cells = [
    [0.665, 0.62], [0.69, 0.575], [0.715, 0.525], [0.74, 0.48],
    [0.77, 0.44], [0.80, 0.405], [0.825, 0.38],
  ];
  for (let i = 0; i < cells.length; i++) {
    const [x, y] = cells[i];
    context.fillStyle = i < 3 ? '#fff0b2' : '#f8c369';
    const side = Math.max(3, Math.round(Math.min(width, height) * 0.009));
    context.fillRect(Math.round(x * width / side) * side, Math.round(y * height / side) * side, side, side);
  }
  context.restore();
}

function draw(time) {
  const width = canvas.width;
  const height = canvas.height;
  const frame = game.snapshot();
  context.imageSmoothingEnabled = false;
  context.fillStyle = '#0b101a';
  context.fillRect(0, 0, width, height);

  if (image.complete && image.naturalWidth) {
    const cover = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const baseWidth = image.naturalWidth * cover;
    const baseHeight = image.naturalHeight * cover;
    const baseX = (width - baseWidth) * 0.5;
    const baseY = (height - baseHeight) * 0.5;
    const scale = frame.zoom;
    const focusX = width * 0.51;
    const focusY = height * 0.53;
    const drawX = focusX + (baseX - focusX) * scale + frame.panX * width - frame.bobX * width;
    const drawY = focusY + (baseY - focusY) * scale + frame.panY * height - frame.bobY * height;
    context.drawImage(image, drawX, drawY, baseWidth * scale, baseHeight * scale);

    drawFog(time, width, height);
    drawEmbers(time, width, height, frame.progress);
    drawSwordArc(time, width, height);
  }
}

function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  const time = (now - animationStart) / 1000;
  if (!paused) {
    game.update(movement(), dt);
    if (lookDX || lookDY) game.look(lookDX, lookDY);
  }
  lookDX = 0;
  lookDY = 0;
  draw(time);

  fpsFrames++;
  if (now - fpsStart > 500) {
    fps = Math.round(fpsFrames * 1000 / (now - fpsStart));
    fpsFrames = 0;
    fpsStart = now;
  }
  if (now - lastHud > 80) {
    updateHud(game.snapshot());
    lastHud = now;
  }
  requestAnimationFrame(frame);
}

function togglePause(force) {
  paused = typeof force === 'boolean' ? force : !paused;
  if (paused && document.pointerLockElement === canvas) document.exitPointerLock?.();
  updateHud(game.snapshot());
}

function restart() {
  game.reset();
  attackUntil = 0;
  togglePause(false);
  updateHud(game.snapshot());
}

function attack() {
  if (!paused) attackUntil = (performance.now() - animationStart) / 1000 + 0.30;
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift', ' '].includes(key)) event.preventDefault();
  if (key === 'escape') { togglePause(true); return; }
  if (key === 'r') { restart(); return; }
  if (key === ' ' && !event.repeat) { attack(); return; }
  heldKeys.add(key);
});
window.addEventListener('keyup', (event) => heldKeys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => {
  heldKeys.clear();
  heldTouch.clear();
  dragging = false;
});

canvas.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || document.pointerLockElement === canvas) return;
  dragging = true;
  lastPointer = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture?.(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging && document.pointerLockElement !== canvas) return;
  let dx = event.movementX || 0;
  let dy = event.movementY || 0;
  if (dragging && event.pointerType !== 'mouse' && lastPointer) {
    dx = event.clientX - lastPointer.x;
    dy = event.clientY - lastPointer.y;
    lastPointer = { x: event.clientX, y: event.clientY };
  }
  lookDX += dx;
  lookDY += dy;
});
const stopDrag = () => { dragging = false; lastPointer = null; };
canvas.addEventListener('pointerup', stopDrag);
canvas.addEventListener('pointercancel', stopDrag);
canvas.addEventListener('contextmenu', (event) => event.preventDefault());
function capturePointer() {
  if (!canvas.requestPointerLock) {
    $('#lookLabel').textContent = 'ARRASTE PARA OLHAR';
    return;
  }
  try {
    const request = canvas.requestPointerLock();
    request?.catch?.(() => { $('#lookLabel').textContent = 'ARRASTE PARA OLHAR'; });
  } catch {
    $('#lookLabel').textContent = 'ARRASTE PARA OLHAR';
  }
}

canvas.addEventListener('click', () => {
  if (!paused && document.pointerLockElement !== canvas) capturePointer();
});
$('#lookButton').addEventListener('click', capturePointer);
document.addEventListener('pointerlockchange', () => {
  $('#lookLabel').textContent = document.pointerLockElement === canvas ? 'ESC PARA LIBERAR' : 'CLIQUE PARA OLHAR';
});
document.addEventListener('pointerlockerror', () => { $('#lookLabel').textContent = 'ARRASTE PARA OLHAR'; });
$('#restartButton').addEventListener('click', restart);
$('#pauseButton').addEventListener('click', () => togglePause());
$('#resumeButton').addEventListener('click', () => togglePause(false));
$('#pauseRestartButton').addEventListener('click', restart);
$('#arrivalRestartButton').addEventListener('click', restart);

for (const button of document.querySelectorAll('[data-action]')) {
  const action = button.dataset.action;
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    button.setPointerCapture?.(event.pointerId);
    if (action === 'attack') attack();
    else heldTouch.add(action);
    button.classList.add('is-held');
  });
  const release = (event) => {
    event.preventDefault();
    event.stopPropagation();
    heldTouch.delete(action);
    button.classList.remove('is-held');
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
}

const resizeObserver = new ResizeObserver(resizeCanvas);
resizeObserver.observe(canvas);
window.addEventListener('resize', resizeCanvas, { passive: true });
resizeCanvas();
updateHud(game.snapshot());
requestAnimationFrame(frame);

window.ashenWay = Object.freeze({
  get state() { return game.snapshot(); },
  restart,
  pause: () => togglePause(true),
  resume: () => togglePause(false),
  attack,
  get fps() { return fps; },
});
