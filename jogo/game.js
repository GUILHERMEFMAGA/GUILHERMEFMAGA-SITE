const WIDTH = 1568;
const HEIGHT = 960;
const CAR_CROP = { x: 708, y: 386, width: 154, height: 279 };
const CAR_PATCH = { x: 714, y: 392, width: 144, height: 270 };
const ROAD = { left: 548, right: 1018, center: 784, top: 0, bottom: HEIGHT };
const SAVE_KEY = 'rua-vermelha-reference-demo-v1';
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const distance = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const moneyText = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d', { alpha: false });
const loading = document.querySelector('#loading');
const hint = document.querySelector('#hint');
const toastElement = document.querySelector('#toast');
const helpPanel = document.querySelector('#helpPanel');
const keys = new Set();
const pressed = new Set();
const policeCars = [];

let sceneImage = null;
let streetCanvas = null;
let streetSprite = null;
let audioContext = null;
let engineOscillator = null;
let engineGain = null;
let sirenOscillator = null;
let sirenGain = null;
let lastFrame = 0;
let hintTimer = 0;
let toastTimer = 0;
let radioTimer = 0;
let radioStep = 0;
let toastMessage = '';
let soundEnabled = false;
let paused = false;
let elapsed = 0;
let wantedQuiet = 0;
let nearPoliceTime = 0;
let rainDust = [];

const phone = { x: 1100, y: 523 };
const radioTracks = [
  { title: 'FUNK DE GARAGEM', notes: [220, 277, 330, 277, 196, 247, 294, 247] },
  { title: 'ROCK DA MADRUGADA', notes: [165, 196, 220, 196, 147, 175, 196, 175] },
  { title: 'SINTETIZADOR 94.2', notes: [330, 392, 440, 392, 294, 349, 392, 349] },
];

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    return {
      money: Number.isFinite(Number(saved?.money)) ? Math.max(0, Number(saved.money)) : 250,
      reputation: Number.isFinite(Number(saved?.reputation)) ? Math.max(0, Number(saved.reputation)) : 0,
      missionIndex: Number.isFinite(Number(saved?.missionIndex)) ? clamp(Math.floor(Number(saved.missionIndex)), 0, 3) : 0,
    };
  } catch {
    return { money: 250, reputation: 0, missionIndex: 0 };
  }
}

const saved = loadProgress();
const state = {
  ready: false,
  driving: true,
  time: 0,
  money: saved.money,
  reputation: saved.reputation,
  missionIndex: saved.missionIndex,
  mission: null,
  wanted: 0,
  foot: { x: 1035, y: 526, angle: 0 },
  car: { x: 784, y: 527, angle: 0, speed: 0, health: 100, hitCooldown: 0 },
  toast: '',
  toastUntil: 0,
  cameraShake: 0,
  capture: 0,
};

const missions = [
  { id: 'delivery', title: 'Peça na hora', category: 'ENTREGA', description: 'Leve a peça até a oficina no fim da rua.', timer: 70, reward: 420, rep: 12, targets: [{ x: 784, y: 166, label: 'OFICINA' }] },
  { id: 'taxi', title: 'Último passageiro', category: 'CORRIDA DE TÁXI', description: 'Busque a passageira e leve-a até o terminal.', timer: 135, reward: 680, rep: 20, targets: [{ x: 784, y: 808, label: 'PASSAGEIRA' }, { x: 784, y: 166, label: 'TERMINAL' }] },
  { id: 'escape', title: 'Sumiu no mapa', category: 'FUGA', description: 'Despiste as viaturas e alcance o esconderijo.', timer: 115, reward: 900, rep: 30, targets: [{ x: 784, y: 808, label: 'ESCONDERIJO' }] },
];

const people = [
  { x: 435, y: 184, baseY: 184, range: 34, speed: 13, color: '#85725c', phase: 0.3 },
  { x: 497, y: 472, baseY: 472, range: 27, speed: 11, color: '#687d70', phase: 1.4 },
  { x: 1123, y: 290, baseY: 290, range: 26, speed: 14, color: '#7c6261', phase: 2.2 },
  { x: 1160, y: 721, baseY: 721, range: 28, speed: 12, color: '#7c805f', phase: 3.1 },
];

function seedRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function makeStreet(image) {
  const background = document.createElement('canvas');
  background.width = WIDTH;
  background.height = HEIGHT;
  const backgroundContext = background.getContext('2d', { alpha: false });
  backgroundContext.imageSmoothingEnabled = false;
  backgroundContext.drawImage(image, 0, 0, WIDTH, HEIGHT);

  // A imagem original já tem o carro no lugar certo. Copio o asfalto vizinho
  // para limpar somente a silhueta, permitindo que o carro se mova sem deixar rastro.
  backgroundContext.drawImage(image, 646, CAR_PATCH.y, 68, CAR_PATCH.height, CAR_PATCH.x, CAR_PATCH.y, 70, CAR_PATCH.height);
  backgroundContext.drawImage(image, 852, CAR_PATCH.y, 68, CAR_PATCH.height, 784, CAR_PATCH.y, 74, CAR_PATCH.height);

  const texture = seedRandom(1998);
  backgroundContext.save();
  backgroundContext.beginPath();
  backgroundContext.rect(CAR_PATCH.x, CAR_PATCH.y, CAR_PATCH.width, CAR_PATCH.height);
  backgroundContext.clip();
  for (let index = 0; index < 820; index += 1) {
    const x = CAR_PATCH.x + texture() * CAR_PATCH.width;
    const y = CAR_PATCH.y + texture() * CAR_PATCH.height;
    const width = 1 + Math.floor(texture() * 6);
    const height = 1 + Math.floor(texture() * 3);
    backgroundContext.fillStyle = texture() > 0.5 ? 'rgba(25, 27, 27, .11)' : 'rgba(212, 204, 180, .09)';
    backgroundContext.fillRect(x, y, width, height);
  }
  // A linha central continua por baixo do veículo, mantendo a rua alinhada.
  backgroundContext.fillStyle = 'rgba(194, 161, 69, .84)';
  for (const y of [400, 480, 580, 630]) backgroundContext.fillRect(781, y, 7, 24);
  backgroundContext.restore();
  return background;
}

function makeCarSprite(image) {
  const sprite = document.createElement('canvas');
  sprite.width = CAR_CROP.width;
  sprite.height = CAR_CROP.height;
  const spriteContext = sprite.getContext('2d');
  spriteContext.imageSmoothingEnabled = false;
  spriteContext.save();
  spriteContext.beginPath();
  const points = [
    [37, 14], [112, 14], [125, 20], [133, 37], [135, 71], [129, 82],
    [138, 93], [138, 241], [132, 256], [119, 265], [33, 265], [20, 257],
    [12, 242], [12, 94], [21, 82], [15, 71], [17, 38], [24, 21],
  ];
  spriteContext.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 1) spriteContext.lineTo(points[index][0], points[index][1]);
  spriteContext.closePath();
  spriteContext.clip();
  spriteContext.drawImage(image, -CAR_CROP.x, -CAR_CROP.y);
  spriteContext.restore();
  return sprite;
}

function finishLoading(image) {
  sceneImage = image;
  streetCanvas = makeStreet(image);
  streetSprite = makeCarSprite(image);
  state.ready = true;
  loading.classList.add('is-ready');
  hint.classList.add('is-visible');
  hintTimer = 8;
  window.setTimeout(() => hint.classList.remove('is-visible'), 6500);
  canvas.focus({ preventScroll: true });
}

function fallbackScene() {
  const fallback = document.createElement('canvas');
  fallback.width = WIDTH;
  fallback.height = HEIGHT;
  const fallbackContext = fallback.getContext('2d');
  fallbackContext.fillStyle = '#53554e';
  fallbackContext.fillRect(0, 0, WIDTH, HEIGHT);
  fallbackContext.fillStyle = '#555650';
  fallbackContext.fillRect(550, 0, 468, HEIGHT);
  fallbackContext.fillStyle = '#b4ac98';
  fallbackContext.fillRect(475, 0, 75, HEIGHT);
  fallbackContext.fillRect(1018, 0, 75, HEIGHT);
  fallbackContext.fillStyle = '#c4a751';
  for (let y = 0; y < HEIGHT; y += 112) fallbackContext.fillRect(780, y + 15, 8, 42);
  fallbackContext.fillStyle = '#77766a';
  for (let row = 0; row < 3; row += 1) {
    fallbackContext.fillRect(20, row * 330 + 18, 360, 274);
    fallbackContext.fillRect(1188, row * 330 + 18, 360, 274);
  }
  return fallback;
}

function showToast(message, duration = 2600) {
  toastMessage = message;
  state.toast = message;
  state.toastUntil = elapsed + duration;
  toastElement.textContent = message;
  toastElement.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastElement.classList.remove('is-visible'), duration);
  if (soundEnabled) playTone(560, .075, 'triangle', .022);
}

function saveProgress() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ money: state.money, reputation: state.reputation, missionIndex: state.missionIndex }));
  } catch {
    // O jogo ainda pode ser jogado se o navegador bloquear o localStorage.
  }
}

function playTone(frequency = 440, duration = .08, waveform = 'sine', volume = .03) {
  if (!soundEnabled) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = waveform;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    // Áudio é opcional; nunca bloqueia o jogo.
  }
}

function startSound() {
  if (!soundEnabled || !audioContext) return;
  if (!engineOscillator) {
    engineOscillator = audioContext.createOscillator();
    engineGain = audioContext.createGain();
    engineOscillator.type = 'sawtooth';
    engineOscillator.frequency.value = 55;
    engineGain.gain.value = .0001;
    engineOscillator.connect(engineGain);
    engineGain.connect(audioContext.destination);
    engineOscillator.start();
  }
  if (!sirenOscillator) {
    sirenOscillator = audioContext.createOscillator();
    sirenGain = audioContext.createGain();
    sirenOscillator.type = 'triangle';
    sirenOscillator.frequency.value = 660;
    sirenGain.gain.value = .0001;
    sirenOscillator.connect(sirenGain);
    sirenGain.connect(audioContext.destination);
    sirenOscillator.start();
  }
}

function updateSound(dt) {
  if (!soundEnabled || !audioContext || paused) {
    if (engineGain && audioContext) engineGain.gain.setTargetAtTime(.0001, audioContext.currentTime, .08);
    if (sirenGain && audioContext) sirenGain.gain.setTargetAtTime(.0001, audioContext.currentTime, .08);
    return;
  }
  startSound();
  const revs = state.driving ? Math.abs(state.car.speed) : 0;
  engineOscillator.frequency.setTargetAtTime(48 + revs * .58, audioContext.currentTime, .06);
  engineGain.gain.setTargetAtTime(state.driving ? .002 + Math.min(revs, 230) * .000035 : .0001, audioContext.currentTime, .08);
  sirenOscillator.frequency.setTargetAtTime(560 + Math.sin(elapsed * .008) * 230, audioContext.currentTime, .07);
  sirenGain.gain.setTargetAtTime(state.wanted > 0 ? .005 : .0001, audioContext.currentTime, .12);

  if (state.driving && keys.has('space') && revs > 80 && !state.skidAt) {
    state.skidAt = elapsed + 480;
    playTone(145, .08, 'sawtooth', .013);
  }
  if (state.skidAt && elapsed > state.skidAt) state.skidAt = 0;

  radioTimer -= dt;
  if (radioTimer <= 0) {
    const track = radioTracks[state.radioIndex || 0];
    playTone(track.notes[radioStep % track.notes.length], .15, 'square', .0035);
    radioStep += 1;
    radioTimer = .38;
  }
}

function playerPosition() {
  return state.driving ? state.car : state.foot;
}

function vehicleHalfExtents(angle = state.car.angle) {
  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));
  return {
    x: 61 * cos + 137 * sin,
    y: 137 * cos + 61 * sin,
  };
}

function drive(dt) {
  const car = state.car;
  const forward = keys.has('w') || keys.has('arrowup');
  const backward = keys.has('s') || keys.has('arrowdown');
  const left = keys.has('a') || keys.has('arrowleft');
  const right = keys.has('d') || keys.has('arrowright');
  const handbrake = keys.has('space');

  if (forward) car.speed = Math.min(236, car.speed + 246 * dt);
  else if (backward) car.speed = car.speed > 0 ? Math.max(0, car.speed - 440 * dt) : Math.max(-92, car.speed - 170 * dt);
  else car.speed += Math.sign(-car.speed) * Math.min(Math.abs(car.speed), 86 * dt);
  if (handbrake) car.speed *= Math.max(0, 1 - dt * 1.4);

  const steer = (right ? 1 : 0) - (left ? 1 : 0);
  if (steer) {
    const pace = clamp(Math.abs(car.speed) / 95, 0, 1);
    car.angle += steer * 1.35 * (.22 + pace * .78) * Math.sign(car.speed || 1) * dt;
    if (handbrake && Math.abs(car.speed) > 50) car.angle += steer * .35 * dt;
  }

  const nextX = car.x + Math.sin(car.angle) * car.speed * dt;
  const nextY = car.y - Math.cos(car.angle) * car.speed * dt;
  const bounds = vehicleHalfExtents(car.angle);
  const insideRoad = nextX - bounds.x > ROAD.left + 8
    && nextX + bounds.x < ROAD.right - 8
    && nextY - bounds.y > 12
    && nextY + bounds.y < HEIGHT - 12;

  if (!insideRoad) {
    car.speed *= -.16;
    car.health = Math.max(0, car.health - (car.hitCooldown <= 0 ? 6 : 0));
    car.hitCooldown = .65;
    state.cameraShake = Math.min(7, state.cameraShake + 3.2);
    if (elapsed > (state.lastBump || 0) + 850) {
      state.lastBump = elapsed;
      showToast('MEIO-FIO · DEVAGAR NA CURVA', 1500);
      playTone(120, .11, 'triangle', .028);
    }
  } else {
    car.x = nextX;
    car.y = nextY;
  }
  car.hitCooldown = Math.max(0, car.hitCooldown - dt);
}

function blockedOnFoot(x, y) {
  const buildings = [
    { x: 0, y: 0, w: 356, h: 303 }, { x: 0, y: 335, w: 352, h: 232 }, { x: 0, y: 697, w: 352, h: 227 },
    { x: 1200, y: 34, w: 350, h: 299 }, { x: 1199, y: 368, w: 351, h: 298 }, { x: 1205, y: 704, w: 345, h: 225 },
  ];
  return buildings.some((building) => x > building.x && x < building.x + building.w && y > building.y && y < building.y + building.h);
}

function walk(dt) {
  const horizontal = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
  const vertical = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
  const magnitude = Math.hypot(horizontal, vertical);
  if (!magnitude) return;
  const speed = keys.has('shift') ? 178 : 126;
  const dx = horizontal / magnitude * speed * dt;
  const dy = vertical / magnitude * speed * dt;
  const nextX = clamp(state.foot.x + dx, 365, 1190);
  const nextY = clamp(state.foot.y + dy, 34, HEIGHT - 34);
  if (!blockedOnFoot(nextX, state.foot.y)) state.foot.x = nextX;
  if (!blockedOnFoot(state.foot.x, nextY)) state.foot.y = nextY;
  state.foot.angle = Math.atan2(dy, dx);
}

function nearPhone() {
  return !state.driving && distance(state.foot.x, state.foot.y, phone.x, phone.y) < 78;
}

function interact() {
  if (state.driving) {
    if (Math.abs(state.car.speed) > 48) {
      showToast('FREIE O CARRO ANTES DE SAIR', 1800);
      return;
    }
    state.driving = false;
    const side = state.car.x > ROAD.center ? -1 : 1;
    state.foot.x = clamp(state.car.x + side * 250, 365, 1190);
    state.foot.y = state.car.y;
    state.foot.angle = state.car.angle;
    showToast('A PÉ · APROXIME-SE DO ORELHÃO AMARELO');
    return;
  }

  if (nearPhone() && !state.mission && state.missionIndex < missions.length) {
    startMission();
    return;
  }

  if (distance(state.foot.x, state.foot.y, state.car.x, state.car.y) < 300) {
    state.driving = true;
    state.car.speed = 0;
    showToast('SEU SEDÃ VERMELHO · PRONTO PARA PARTIR');
    return;
  }

  if (nearPhone() && state.mission) {
    showToast('TERMINE O SERVIÇO ATUAL PRIMEIRO');
    return;
  }
  if (nearPhone() && state.missionIndex >= missions.length) {
    showToast('CAMPANHA CONCLUÍDA · MODO LIVRE');
    return;
  }
  const person = people.find((pedestrian) => distance(state.foot.x, state.foot.y, pedestrian.x, pedestrian.baseY) < 40);
  if (person) {
    showToast('“O trânsito pesa depois das seis.”');
    return;
  }
  showToast('APROXIME-SE DO CARRO OU DO ORELHÃO');
}

function shove() {
  if (state.driving) {
    state.car.speed *= .67;
    if (Math.abs(state.car.speed) > 65) showToast('FREIO DE MÃO', 900);
    return;
  }
  const pedestrian = people.find((person) => distance(state.foot.x, state.foot.y, person.x, person.baseY + Math.sin(elapsed * .001 + person.phase) * person.range) < 38);
  if (pedestrian) {
    state.wanted = clamp(state.wanted + 1, 0, 5);
    showToast('EMPURRÃO DE DESENHO ANIMADO · SEM FERIMENTOS');
  } else {
    showToast('VOCÊ FAZ UM GESTO PARA CHAMAR ATENÇÃO', 1200);
  }
}

function startMission() {
  const mission = missions[state.missionIndex];
  if (!mission) return;
  state.mission = { index: state.missionIndex, stage: 0, timeLeft: mission.timer };
  if (mission.id === 'escape') state.wanted = Math.max(state.wanted, 4);
  showToast(`${mission.category} ACEITA · ${mission.title.toUpperCase()}`, 3300);
  playTone(760, .16, 'square', .026);
}

function getTarget() {
  if (!state.mission) return null;
  return missions[state.mission.index].targets[state.mission.stage];
}

function completeMissionStep() {
  const missionState = state.mission;
  const mission = missions[missionState.index];
  if (mission.id === 'taxi' && missionState.stage === 0) {
    missionState.stage = 1;
    showToast('PASSAGEIRA A BORDO · SIGA ATÉ O TERMINAL', 3300);
    return;
  }
  state.money += mission.reward;
  state.reputation += mission.rep;
  state.missionIndex = Math.min(missions.length, state.missionIndex + 1);
  state.mission = null;
  if (mission.id === 'escape') state.wanted = 0;
  saveProgress();
  showToast(`SERVIÇO CONCLUÍDO · +${moneyText(mission.reward)} · +${mission.rep} REP`, 3800);
  playTone(880, .2, 'triangle', .032);
}

function failMission() {
  const mission = state.mission;
  state.mission = null;
  if (mission && missions[mission.index].id === 'escape') state.wanted = Math.max(0, state.wanted - 1);
  showToast('TEMPO ESGOTADO · O TRABALHO CONTINUA NO ORELHÃO', 3300);
}

function updateMission(dt) {
  if (!state.mission) return;
  state.mission.timeLeft -= dt;
  if (state.mission.timeLeft <= 0) {
    failMission();
    return;
  }
  const target = getTarget();
  const position = playerPosition();
  if (target && distance(position.x, position.y, target.x, target.y) < 72) completeMissionStep();
}

function spawnPolice() {
  const position = playerPosition();
  const y = position.y > HEIGHT / 2 ? 150 : HEIGHT - 150;
  const x = clamp(ROAD.center + (Math.random() - .5) * 120, 660, 910);
  policeCars.push({ x, y, angle: y < position.y ? Math.PI : 0, speed: 0, blink: Math.random() * 1000 });
}

function updatePolice(dt) {
  if (state.wanted === 0) {
    policeCars.length = 0;
    state.capture = 0;
    return;
  }
  const count = Math.min(3, 1 + Math.floor((state.wanted - 1) / 2));
  while (policeCars.length < count) spawnPolice();
  const target = playerPosition();
  let nearest = Infinity;
  for (const police of policeCars) {
    const vertical = target.y - police.y;
    const horizontal = target.x - police.x;
    police.speed = Math.min(206, police.speed + 82 * dt);
    if (Math.abs(vertical) > 45) {
      police.y += Math.sign(vertical) * police.speed * dt;
      police.angle = vertical > 0 ? Math.PI : 0;
    }
    police.x += clamp(horizontal, -52 * dt, 52 * dt);
    police.x = clamp(police.x, 628, 940);
    nearest = Math.min(nearest, distance(police.x, police.y, target.x, target.y));
  }
  if (nearest < (state.driving ? 102 : 54) && (!state.driving || Math.abs(state.car.speed) < 105)) {
    state.capture += dt;
    if (state.capture > 2.2) arrestPlayer();
  } else {
    state.capture = Math.max(0, state.capture - dt * 1.4);
  }

  if (nearest > 550) wantedQuiet += dt;
  else wantedQuiet = 0;
  if (wantedQuiet > 19) {
    state.wanted = Math.max(0, state.wanted - 1);
    wantedQuiet = 0;
    if (state.wanted === 0) policeCars.length = 0;
    showToast(state.wanted ? 'A PROCURA DIMINUIU' : 'A POLÍCIA PERDEU SEU RASTRO');
  }
}

function arrestPlayer() {
  state.money = Math.floor(state.money * .82);
  if (state.mission) state.mission = null;
  state.wanted = 0;
  policeCars.length = 0;
  state.capture = 0;
  state.driving = true;
  state.car.x = 784;
  state.car.y = 527;
  state.car.angle = 0;
  state.car.speed = 0;
  state.foot.x = 1035;
  state.foot.y = 526;
  saveProgress();
  showToast(`DE VOLTA À RUA · MULTA PAGA · ${moneyText(state.money)}`, 3600);
}

function drawPhone() {
  const pulse = .5 + Math.sin(elapsed * .004) * .13;
  ctx.save();
  ctx.globalAlpha = .22;
  ctx.fillStyle = '#e8c46b';
  ctx.beginPath();
  ctx.arc(phone.x, phone.y, 27 + pulse * 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(20, 22, 20, .42)';
  ctx.fillRect(phone.x - 13, phone.y + 20, 27, 8);
  ctx.fillStyle = '#4b4030';
  ctx.fillRect(phone.x - 10, phone.y - 30, 20, 51);
  ctx.fillStyle = '#d3b354';
  ctx.fillRect(phone.x - 8, phone.y - 28, 16, 46);
  ctx.fillStyle = '#344346';
  ctx.fillRect(phone.x - 5, phone.y - 24, 10, 13);
  ctx.fillStyle = '#aab3a4';
  ctx.fillRect(phone.x - 3, phone.y - 22, 6, 2);
  ctx.fillStyle = '#6f5c3c';
  ctx.fillRect(phone.x - 3, phone.y - 7, 6, 10);
  ctx.fillStyle = '#40372a';
  ctx.fillRect(phone.x - 12, phone.y - 32, 24, 4);
}

function drawPerson(person, isPlayer = false) {
  const bob = Math.sin(elapsed * .012 + (person.phase || 0)) * 1.1;
  const x = Math.round(person.x);
  const y = Math.round((isPlayer ? person.y : person.baseY + Math.sin(elapsed * .001 + person.phase) * person.range) + bob);
  ctx.fillStyle = 'rgba(8, 10, 9, .36)';
  ctx.fillRect(x - 8, y + 8, 17, 5);
  ctx.fillStyle = '#262824';
  ctx.fillRect(x - 5, y + 2, 4, 10);
  ctx.fillRect(x + 1, y + 2, 4, 10);
  ctx.fillStyle = isPlayer ? '#b64b42' : person.color;
  ctx.fillRect(x - 7, y - 7, 14, 11);
  ctx.fillRect(x - 9, y - 4, 3, 7);
  ctx.fillRect(x + 6, y - 4, 3, 7);
  ctx.fillStyle = '#c19b78';
  ctx.fillRect(x - 5, y - 15, 11, 9);
  ctx.fillStyle = '#342d28';
  ctx.fillRect(x - 6, y - 17, 13, 4);
}

function drawPlayerCar() {
  if (!streetSprite) return;
  ctx.save();
  ctx.translate(Math.round(state.car.x), Math.round(state.car.y));
  ctx.rotate(state.car.angle);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(streetSprite, -CAR_CROP.width / 2, -CAR_CROP.height / 2);
  if (state.car.health < 38) {
    ctx.globalAlpha = .35 + Math.sin(elapsed * .01) * .12;
    ctx.fillStyle = '#272924';
    ctx.fillRect(-13, -120, 24, 14);
  }
  ctx.restore();
}

function drawPoliceCar(police) {
  ctx.save();
  ctx.translate(Math.round(police.x), Math.round(police.y));
  ctx.rotate(police.angle);
  const flash = Math.floor((elapsed + police.blink) / 160) % 2;
  ctx.fillStyle = 'rgba(6, 8, 8, .45)';
  ctx.fillRect(-26, -47, 57, 116);
  ctx.fillStyle = '#1b2020';
  ctx.fillRect(-25, -56, 50, 112);
  ctx.fillStyle = '#d7d7cb';
  ctx.fillRect(-22, -53, 44, 105);
  ctx.fillStyle = '#344047';
  ctx.fillRect(-17, -33, 34, 20);
  ctx.fillRect(-17, 13, 34, 20);
  ctx.fillStyle = '#56616a';
  ctx.fillRect(-15, -30, 6, 15);
  ctx.fillRect(-15, 16, 6, 14);
  ctx.fillStyle = '#646960';
  ctx.fillRect(-21, -12, 42, 23);
  ctx.fillStyle = flash ? '#dc6356' : '#536bb4';
  ctx.fillRect(-14, -47, 12, 6);
  ctx.fillStyle = flash ? '#526bbd' : '#dc6356';
  ctx.fillRect(2, -47, 12, 6);
  ctx.fillStyle = '#e9dfb3';
  ctx.fillRect(-19, -54, 9, 4);
  ctx.fillRect(10, -54, 9, 4);
  ctx.fillStyle = '#bd5c50';
  ctx.fillRect(-19, 49, 9, 4);
  ctx.fillRect(10, 49, 9, 4);
  ctx.restore();
}

function drawHelicopter() {
  if (state.wanted < 4) return;
  const position = playerPosition();
  const x = position.x + Math.sin(elapsed * .00055) * 185;
  const y = position.y - 165 + Math.cos(elapsed * .00055) * 62;
  ctx.save();
  ctx.globalAlpha = .11;
  ctx.fillStyle = '#f0df9c';
  ctx.beginPath();
  ctx.ellipse(position.x, position.y, 104, 74, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(11, 13, 14, .58)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#585e59';
  ctx.fillRect(-10, -5, 21, 10);
  ctx.fillRect(9, -2, 12, 4);
  ctx.fillRect(-2, -22, 4, 44);
  ctx.fillStyle = '#272c2b';
  ctx.fillRect(-20, -1, 40, 2);
  ctx.restore();
}

function drawTarget(target) {
  if (!target) return;
  const pulse = (elapsed % 1100) / 1100;
  ctx.save();
  ctx.globalAlpha = .35 * (1 - pulse);
  ctx.strokeStyle = '#e7c361';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(target.x, target.y, 21 + pulse * 42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = 'rgba(10, 13, 11, .78)';
  ctx.beginPath();
  ctx.arc(target.x, target.y, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e7c361';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(target.x, target.y, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#e7c361';
  ctx.beginPath();
  ctx.moveTo(target.x, target.y - 9);
  ctx.lineTo(target.x + 6, target.y + 6);
  ctx.lineTo(target.x, target.y + 2);
  ctx.lineTo(target.x - 6, target.y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.font = 'bold 13px "Courier New", monospace';
  const labelWidth = ctx.measureText(target.label).width + 19;
  ctx.fillStyle = 'rgba(12, 15, 13, .85)';
  ctx.fillRect(target.x - labelWidth / 2, target.y - 46, labelWidth, 20);
  ctx.fillStyle = '#f1e9d4';
  ctx.textAlign = 'center';
  ctx.fillText(target.label, target.x, target.y - 32);
  ctx.textAlign = 'left';
}

function drawHud() {
  if (state.mission) {
    const mission = missions[state.mission.index];
    ctx.fillStyle = 'rgba(9, 12, 10, .72)';
    ctx.fillRect(20, 19, 333, 77);
    ctx.fillStyle = '#c56a50';
    ctx.fillRect(20, 19, 4, 77);
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillStyle = '#d6b95f';
    ctx.fillText(mission.category, 36, 39);
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.fillStyle = '#eee6d2';
    ctx.fillText(mission.title.toUpperCase(), 36, 59);
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = '#bdb9a8';
    const stageText = mission.id === 'taxi' && state.mission.stage === 1 ? 'LEVE A PASSAGEIRA AO TERMINAL' : mission.description.toUpperCase();
    ctx.fillText(stageText.slice(0, 43), 36, 78);
    const seconds = Math.max(0, Math.ceil(state.mission.timeLeft));
    ctx.textAlign = 'right';
    ctx.fillStyle = '#e4d9bb';
    ctx.fillText(`${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`, 339, 39);
    ctx.textAlign = 'left';
  }

  if (state.wanted > 0) {
    ctx.fillStyle = 'rgba(9, 12, 10, .66)';
    ctx.fillRect(WIDTH - 232, 19, 211, 52);
    ctx.textAlign = 'right';
    ctx.font = '9px "Courier New", monospace';
    ctx.fillStyle = '#c6bfac';
    ctx.fillText('NÍVEL DE PROCURA', WIDTH - 33, 37);
    ctx.font = 'bold 17px "Courier New", monospace';
    ctx.fillStyle = '#e1c06a';
    ctx.fillText(`${'★'.repeat(state.wanted)}${'☆'.repeat(5 - state.wanted)}`, WIDTH - 33, 59);
    ctx.textAlign = 'left';
  }

  if (state.money !== 250 || state.reputation > 0) {
    ctx.fillStyle = 'rgba(9, 12, 10, .70)';
    ctx.fillRect(20, HEIGHT - 62, 184, 39);
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = '#e8e0cb';
    ctx.fillText(moneyText(state.money), 32, HEIGHT - 38);
    ctx.font = '9px "Courier New", monospace';
    ctx.fillStyle = '#c3b678';
    ctx.fillText(`${String(state.reputation).padStart(2, '0')} REP`, 125, HEIGHT - 38);
  }

  if (paused) {
    ctx.fillStyle = 'rgba(4, 6, 5, .62)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.fillStyle = '#eee5ce';
    ctx.fillText('PAUSADO', WIDTH / 2, HEIGHT / 2);
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#c2bda9';
    ctx.fillText('APERTE ESC PARA VOLTAR À RUA', WIDTH / 2, HEIGHT / 2 + 34);
    ctx.textAlign = 'left';
  }
}

function drawInteractionPrompt() {
  let text = '';
  if (state.driving) {
    text = Math.abs(state.car.speed) > 48 ? 'SOLTE O ACELERADOR PARA SAIR' : 'E  ·  SAIR DO CARRO';
  } else if (nearPhone()) {
    text = state.mission ? 'TRABALHO EM ANDAMENTO' : 'E  ·  USAR O ORELHÃO';
  } else if (distance(state.foot.x, state.foot.y, state.car.x, state.car.y) < 300) {
    text = 'E  ·  ENTRAR NO SEDÃ';
  }
  if (!text) return;
  ctx.font = 'bold 12px "Courier New", monospace';
  const width = ctx.measureText(text).width + 26;
  const x = (WIDTH - width) / 2;
  const y = HEIGHT - 38;
  ctx.fillStyle = 'rgba(10, 13, 11, .82)';
  ctx.fillRect(x, y, width, 25);
  ctx.strokeStyle = 'rgba(234, 221, 189, .28)';
  ctx.strokeRect(x + .5, y + .5, width - 1, 24);
  ctx.fillStyle = '#f0e7cf';
  ctx.textAlign = 'center';
  ctx.fillText(text, WIDTH / 2, y + 17);
  ctx.textAlign = 'left';
}

function render() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  if (!state.ready || !streetCanvas) {
    ctx.fillStyle = '#090b09';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    return;
  }
  ctx.imageSmoothingEnabled = false;
  const shakeX = state.cameraShake ? (Math.random() - .5) * state.cameraShake : 0;
  const shakeY = state.cameraShake ? (Math.random() - .5) * state.cameraShake : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);
  ctx.drawImage(streetCanvas, 0, 0);

  // Pedestres só aparecem depois que o jogador sai do carro, mantendo a cena inicial igual à referência.
  if (!state.driving || state.mission) {
    for (const pedestrian of people) drawPerson(pedestrian);
  }
  if (!state.driving || state.mission) drawPhone();

  const target = getTarget();
  if (target) drawTarget(target);
  for (const police of policeCars) drawPoliceCar(police);
  drawHelicopter();
  drawPlayerCar();
  if (!state.driving) drawPerson(state.foot, true);
  drawHud();
  drawInteractionPrompt();
  ctx.restore();
}

function keyName(key) {
  if (key === ' ') return 'space';
  return key.toLowerCase();
}

function toggleHelp() {
  helpPanel.hidden = !helpPanel.hidden;
  paused = !helpPanel.hidden;
  if (!paused) canvas.focus({ preventScroll: true });
}

function handleActionKeys() {
  if (pressed.has('e') || pressed.has('f')) interact();
  if (pressed.has('space')) shove();
  if (pressed.has('h')) {
    showToast('BÉÉÉM · A VIZINHANÇA OUVIU', 1300);
    playTone(215, .19, 'sawtooth', .05);
  }
  if (pressed.has('r')) {
    state.radioIndex = ((state.radioIndex || 0) + 1) % radioTracks.length;
    showToast(`RÁDIO · ${radioTracks[state.radioIndex].title}`);
    playTone(410 + state.radioIndex * 100, .11, 'square', .025);
  }
  if (pressed.has('v')) {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      try {
        audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
        audioContext.resume();
        startSound();
      } catch { /* navegador sem áudio */ }
      showToast('SOM SINTETIZADO LIGADO');
    } else {
      showToast('SOM DESLIGADO');
    }
  }
}

function update(dt) {
  if (!state.driving) walk(dt);
  else drive(dt);

  for (const pedestrian of people) {
    const personY = pedestrian.baseY + Math.sin(elapsed * .001 + pedestrian.phase) * pedestrian.range;
    if (state.driving && Math.abs(state.car.speed) > 90 && distance(state.car.x, state.car.y, pedestrian.x, personY) < 42 && elapsed > (pedestrian.hitAt || 0)) {
      pedestrian.hitAt = elapsed + 2600;
      state.wanted = clamp(state.wanted + 1, 0, 5);
      state.car.speed *= .65;
      showToast('O PEDESTRE SE LEVANTOU E SAIU CORRENDO', 2300);
    }
  }

  if (state.mission) {
    state.mission.timeLeft -= dt;
    if (state.mission.timeLeft <= 0) failMission();
    else {
      const target = getTarget();
      const position = playerPosition();
      if (target && distance(position.x, position.y, target.x, target.y) < 72) completeMissionStep();
    }
  }

  updatePolice(dt);
  state.cameraShake = Math.max(0, state.cameraShake - dt * 11);
  if (state.toast && elapsed > state.toastUntil) state.toast = '';
}

function frame(timestamp) {
  const dt = Number.isFinite(lastFrame) ? clamp((timestamp - lastFrame) / 1000, 0, .05) : 0;
  lastFrame = timestamp;
  if (!paused && state.ready) {
    elapsed += dt * 1000;
    handleActionKeys();
    update(dt);
    updateSound(dt);
  } else if (paused) {
    updateSound(0);
  }
  render();
  pressed.clear();
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (event) => {
  const key = keyName(event.key);
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space'].includes(key)) event.preventDefault();
  const wasDown = keys.has(key);
  if (!wasDown) pressed.add(key);
  keys.add(key);
  if (!wasDown && key === 'escape') {
    if (!helpPanel.hidden) {
      helpPanel.hidden = true;
      paused = false;
    } else {
      paused = !paused;
    }
  }
  if (!wasDown && (key === '?' || key === 'f1')) toggleHelp();
});
window.addEventListener('keyup', (event) => keys.delete(keyName(event.key)));
window.addEventListener('blur', () => keys.clear());
canvas.addEventListener('pointerdown', () => canvas.focus({ preventScroll: true }));

for (const button of document.querySelectorAll('[data-key]')) {
  const key = button.dataset.key;
  const release = (event) => {
    event?.preventDefault();
    keys.delete(key);
    button.classList.remove('is-down');
  };
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    keys.add(key);
    pressed.add(key);
    button.classList.add('is-down');
    button.setPointerCapture?.(event.pointerId);
  });
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
}

document.querySelector('#helpButton').addEventListener('click', toggleHelp);
document.querySelector('#closeHelp').addEventListener('click', toggleHelp);
document.querySelector('#resumeButton').addEventListener('click', toggleHelp);
helpPanel.addEventListener('pointerdown', (event) => {
  if (event.target === helpPanel) toggleHelp();
});

const backgroundImage = new Image();
backgroundImage.onload = () => finishLoading(backgroundImage);
backgroundImage.onerror = () => {
  const fallback = fallbackScene();
  sceneImage = fallback;
  streetCanvas = makeStreet(fallback);
  streetSprite = makeCarSprite(fallback);
  state.ready = true;
  loading.classList.add('is-ready');
  hint.classList.add('is-visible');
  window.setTimeout(() => hint.classList.remove('is-visible'), 6500);
  showToast('ARTE DE REFERÊNCIA INDISPONÍVEL · USANDO CENA DE CONTINGÊNCIA');
};
backgroundImage.src = new URL('./gta-retro.png', import.meta.url).href;
window.setTimeout(() => {
  if (!state.ready) showToast('CARREGANDO A CENA DE NOVA AURORA…', 4000);
}, 2400);

requestAnimationFrame(frame);
