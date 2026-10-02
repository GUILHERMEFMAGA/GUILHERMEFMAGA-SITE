import { drawCarHighlights, drawStreetLighting } from './lighting.js';
import { resolveVehicleMotion } from './collision.js';
import { stepVehicle } from './vehicle-physics.js';
import { drawWeather, getWeatherState } from './weather.js';

const WIDTH = 1568;
const HEIGHT = 960;
const FIXED_STEP = 1 / 60;
const MAX_FRAME_DELTA = .1;
const MAX_CATCH_UP_STEPS = 5;
const CAR_CROP = { x: 708, y: 345, width: 154, height: 280 };
// Silhueta do sedã na imagem normalizada. Cada linha define [y, x inicial, x final];
// os limites incluem a borda escura do carro, mas excluem a sombra projetada na rua.
const CAR_SILHOUETTE = [
  [22, 59, 95], [24, 59, 95], [25, 35, 119], [27, 33, 121], [28, 32, 122],
  [31, 31, 123], [35, 31, 123], [36, 28, 126], [42, 26, 130], [48, 24, 131],
  [56, 22, 132], [60, 21, 132], [76, 21, 132], [81, 22, 131], [85, 23, 130],
  [91, 23, 130], [92, 20, 138], [94, 16, 144], [96, 15, 144], [101, 15, 144],
  [103, 16, 143], [104, 23, 130], [110, 23, 130], [138, 23, 130], [144, 22, 130],
  [170, 22, 130], [190, 22, 130], [194, 20, 131], [202, 19, 132], [210, 19, 132],
  [218, 20, 132], [225, 21, 132], [232, 23, 131], [238, 25, 130], [240, 25, 130],
  [242, 26, 129], [245, 26, 129], [248, 27, 128], [251, 29, 127], [253, 30, 126],
  [255, 31, 125],
];
const CAR_PATCH = { x: 696, y: 340, width: 176, height: 300 };
const CAR_PATCH_FEATHER = 18;
const ROAD = { left: 548, right: 1018, center: 784, top: 0, bottom: HEIGHT };
const ROAD_CLEARANCE = 8;
const CURVE_ROAD_HALF_WIDTH = (ROAD.right - ROAD.left) / 2;
const CURVE_SOURCE_HALF_WIDTH = 180;
const CURVE_SWAY = 54;
// Bounds follow the opaque hand-traced sedan silhouette, excluding transparent crop margins.
const CAR_COLLIDER = Object.freeze({ halfWidth: 65, halfLength: 118 });
const CAR_SPAWN = { x: 784, y: 485 };
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

const sections = [];
let streetCanvas = null;
let streetSprite = null;
let audioContext = null;
let engineOscillator = null;
let engineGain = null;
let sirenOscillator = null;
let sirenGain = null;
let lastFrame = null;
let simulationAccumulator = 0;
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
  section: 0,
  time: 0,
  money: saved.money,
  reputation: saved.reputation,
  missionIndex: saved.missionIndex,
  mission: null,
  wanted: 0,
  foot: { x: 1035, y: 526, angle: 0 },
  car: { x: CAR_SPAWN.x, y: CAR_SPAWN.y, angle: 0, speed: 0, lateralSpeed: 0, health: 100, hitCooldown: 0, suspension: 0, curbCooldown: 0 },
  previousCar: { x: CAR_SPAWN.x, y: CAR_SPAWN.y, angle: 0, suspension: 0 },
  toast: '',
  toastUntil: 0,
  cameraShake: 0,
  capture: 0,
};

const renderCarPose = { x: CAR_SPAWN.x, y: CAR_SPAWN.y, angle: 0, health: 100, suspension: 0 };

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

function normalizeScene(image) {
  const reference = document.createElement('canvas');
  reference.width = WIDTH;
  reference.height = HEIGHT;
  const referenceContext = reference.getContext('2d', { alpha: false });
  referenceContext.imageSmoothingEnabled = false;
  referenceContext.drawImage(image, 0, 0, WIDTH, HEIGHT);
  return reference;
}

function widenRoadToReference(reference, centerAtY, sourceHalfWidth = CURVE_SOURCE_HALF_WIDTH) {
  const expanded = document.createElement('canvas');
  expanded.width = WIDTH;
  expanded.height = HEIGHT;
  const expandedContext = expanded.getContext('2d', { alpha: false });
  expandedContext.imageSmoothingEnabled = false;
  const targetHalfWidth = (ROAD.right - ROAD.left) / 2;
  const sampleEdges = (y) => {
    const centerSample = centerAtY(y);
    const requestedCenter = Number.isFinite(centerSample) ? centerSample : ROAD.center;
    const minCenter = Math.max(sourceHalfWidth, targetHalfWidth) + 1;
    const center = clamp(requestedCenter, minCenter, WIDTH - minCenter);
    return {
      sourceLeft: Math.round(center - sourceHalfWidth),
      sourceRight: Math.round(center + sourceHalfWidth),
      targetLeft: Math.round(center - targetHalfWidth),
      targetRight: Math.round(center + targetHalfWidth),
    };
  };
  const sameEdges = (a, b) => a && b
    && a.sourceLeft === b.sourceLeft && a.sourceRight === b.sourceRight
    && a.targetLeft === b.targetLeft && a.targetRight === b.targetRight;

  // Expand only the road band and gently compress the sidewalks. Reuse each
  // quantized horizontal transform for its full row run to keep loading cheap.
  let bandY = 0;
  let bandEdges = sampleEdges(0);
  for (let y = 1; y <= HEIGHT; y += 1) {
    const nextEdges = y < HEIGHT ? sampleEdges(y) : null;
    if (sameEdges(bandEdges, nextEdges)) continue;
    const bandHeight = y - bandY;
    expandedContext.drawImage(reference, 0, bandY, bandEdges.sourceLeft, bandHeight, 0, bandY, bandEdges.targetLeft, bandHeight);
    expandedContext.drawImage(
      reference,
      bandEdges.sourceLeft,
      bandY,
      bandEdges.sourceRight - bandEdges.sourceLeft,
      bandHeight,
      bandEdges.targetLeft,
      bandY,
      bandEdges.targetRight - bandEdges.targetLeft,
      bandHeight,
    );
    expandedContext.drawImage(
      reference,
      bandEdges.sourceRight,
      bandY,
      WIDTH - bandEdges.sourceRight,
      bandHeight,
      bandEdges.targetRight,
      bandY,
      WIDTH - bandEdges.targetRight,
      bandHeight,
    );
    bandY = y;
    bandEdges = nextEdges;
  }
  return expanded;
}

function makeStreet(reference, removeReferenceSedan = false) {
  if (!removeReferenceSedan) return reference;
  const background = document.createElement('canvas');
  background.width = WIDTH;
  background.height = HEIGHT;
  const backgroundContext = background.getContext('2d', { alpha: false });
  backgroundContext.imageSmoothingEnabled = false;
  backgroundContext.drawImage(reference, 0, 0);

  // Clona o asfalto dos dois lados da área do carro; as bordas são mescladas
  // para não deixar um retângulo evidente quando o sedã se afasta.
  const patch = document.createElement('canvas');
  patch.width = CAR_PATCH.width;
  patch.height = CAR_PATCH.height;
  const patchContext = patch.getContext('2d');
  patchContext.imageSmoothingEnabled = false;
  const halfPatch = Math.floor(CAR_PATCH.width / 2);
  patchContext.drawImage(reference, CAR_PATCH.x - halfPatch, CAR_PATCH.y, halfPatch, CAR_PATCH.height, 0, 0, halfPatch, CAR_PATCH.height);
  patchContext.drawImage(reference, CAR_PATCH.x + CAR_PATCH.width, CAR_PATCH.y, halfPatch, CAR_PATCH.height, halfPatch, 0, halfPatch, CAR_PATCH.height);

  const texture = seedRandom(1998);
  for (let index = 0; index < 1050; index += 1) {
    const x = texture() * patch.width;
    const y = texture() * patch.height;
    const width = 1 + Math.floor(texture() * 5);
    const height = 1 + Math.floor(texture() * 3);
    patchContext.fillStyle = texture() > 0.5 ? 'rgba(25, 27, 27, .075)' : 'rgba(212, 204, 180, .06)';
    patchContext.fillRect(x, y, width, height);
  }
  patchContext.fillStyle = 'rgba(194, 161, 69, .84)';
  for (const y of [400, 480, 580, 630]) {
    patchContext.fillRect(ROAD.center - CAR_PATCH.x - 3, y - CAR_PATCH.y, 7, 24);
  }

  const fade = CAR_PATCH_FEATHER;
  const mask = document.createElement('canvas');
  mask.width = patch.width;
  mask.height = patch.height;
  const maskContext = mask.getContext('2d');
  const horizontalFade = maskContext.createLinearGradient(0, 0, patch.width, 0);
  horizontalFade.addColorStop(0, 'rgba(255, 255, 255, 0)');
  horizontalFade.addColorStop(fade / patch.width, 'rgba(255, 255, 255, 1)');
  horizontalFade.addColorStop(1 - fade / patch.width, 'rgba(255, 255, 255, 1)');
  horizontalFade.addColorStop(1, 'rgba(255, 255, 255, 0)');
  maskContext.fillStyle = horizontalFade;
  maskContext.fillRect(0, 0, mask.width, mask.height);
  maskContext.globalCompositeOperation = 'destination-in';
  const verticalFade = maskContext.createLinearGradient(0, 0, 0, patch.height);
  verticalFade.addColorStop(0, 'rgba(255, 255, 255, 0)');
  verticalFade.addColorStop(fade / patch.height, 'rgba(255, 255, 255, 1)');
  verticalFade.addColorStop(1 - fade / patch.height, 'rgba(255, 255, 255, 1)');
  verticalFade.addColorStop(1, 'rgba(255, 255, 255, 0)');
  maskContext.fillStyle = verticalFade;
  maskContext.fillRect(0, 0, mask.width, mask.height);
  patchContext.globalCompositeOperation = 'destination-in';
  patchContext.drawImage(mask, 0, 0);
  backgroundContext.drawImage(patch, CAR_PATCH.x, CAR_PATCH.y);
  return background;
}

function makeCarSprite(reference) {
  const sprite = document.createElement('canvas');
  sprite.width = CAR_CROP.width;
  sprite.height = CAR_CROP.height;
  const spriteContext = sprite.getContext('2d', { willReadFrequently: true });
  spriteContext.imageSmoothingEnabled = false;
  spriteContext.drawImage(reference, -CAR_CROP.x, -CAR_CROP.y);

  // A clip path antialiases its perimeter, blending road pixels into the car
  // when the sprite rotates. Apply a one-bit alpha mask instead: car pixels are
  // fully opaque and everything outside the hand-traced silhouette is cleared.
  const imageData = spriteContext.getImageData(0, 0, sprite.width, sprite.height);
  const firstRow = CAR_SILHOUETTE[0][0];
  const lastRow = CAR_SILHOUETTE[CAR_SILHOUETTE.length - 1][0];
  let anchorIndex = 0;

  for (let y = 0; y < sprite.height; y += 1) {
    let left = -1;
    let right = -1;
    if (y >= firstRow && y <= lastRow) {
      while (anchorIndex < CAR_SILHOUETTE.length - 2 && y > CAR_SILHOUETTE[anchorIndex + 1][0]) {
        anchorIndex += 1;
      }
      const [startY, startLeft, startRight] = CAR_SILHOUETTE[anchorIndex];
      const [endY, endLeft, endRight] = CAR_SILHOUETTE[anchorIndex + 1];
      const progress = endY === startY ? 0 : (y - startY) / (endY - startY);
      left = Math.round(startLeft + (endLeft - startLeft) * progress);
      right = Math.round(startRight + (endRight - startRight) * progress);
    }

    for (let x = 0; x < sprite.width; x += 1) {
      const offset = (y * sprite.width + x) * 4;
      if (x < left || x > right) {
        // Clear hidden RGB too, so no road-colored fringe can leak at the edge.
        imageData.data[offset] = 0;
        imageData.data[offset + 1] = 0;
        imageData.data[offset + 2] = 0;
        imageData.data[offset + 3] = 0;
      } else {
        imageData.data[offset + 3] = 255;
      }
    }
  }

  spriteContext.putImageData(imageData, 0, 0);
  return sprite;
}

function curveRoadCenterX(y) {
  const progress = clamp(y / HEIGHT, 0, 1);
  return ROAD.center - CURVE_SWAY * Math.sin(progress * Math.PI * 2);
}

function createCurvedLampPosts() {
  const posts = [];
  for (let row = 0; row < 5; row += 1) {
    const y = (row + .5) * HEIGHT / 5;
    const offset = CURVE_ROAD_HALF_WIDTH + 20;
    const center = curveRoadCenterX(y);
    posts.push({ x: center - offset, y }, { x: center + offset, y });
  }
  return posts;
}

function createCurvedRoadCurbs(sectionIndex) {
  const colliders = [];
  const slices = 12;
  const sliceHeight = HEIGHT / slices;
  for (let slice = 0; slice < slices; slice += 1) {
    const y = slice * sliceHeight;
    const nextY = Math.min(HEIGHT, y + sliceHeight);
    const startCenter = curveRoadCenterX(y);
    const endCenter = curveRoadCenterX(nextY);
    const westStart = startCenter - CURVE_ROAD_HALF_WIDTH;
    const westEnd = endCenter - CURVE_ROAD_HALF_WIDTH;
    const eastStart = startCenter + CURVE_ROAD_HALF_WIDTH - ROAD_CLEARANCE;
    const eastEnd = endCenter + CURVE_ROAD_HALF_WIDTH - ROAD_CLEARANCE;
    colliders.push(
      {
        id: `section-${sectionIndex}-west-curb-${slice}`,
        kind: 'curb',
        x: Math.min(westStart, westEnd) - ROAD_CLEARANCE / 2,
        y,
        width: Math.abs(westEnd - westStart) + ROAD_CLEARANCE,
        height: nextY - y,
        stepHeight: 6,
      },
      {
        id: `section-${sectionIndex}-east-curb-${slice}`,
        kind: 'curb',
        x: Math.min(eastStart, eastEnd),
        y,
        width: Math.abs(eastEnd - eastStart) + ROAD_CLEARANCE,
        height: nextY - y,
        stepHeight: 6,
      },
    );
  }
  return colliders;
}

function createSectionCurbs(index) {
  if (index === 4) return createCurvedRoadCurbs(index);
  if (index === 3) {
    const crossStreetTop = Math.round(HEIGHT * .39);
    const crossStreetBottom = Math.round(HEIGHT * .61);
    const westTop = ROAD.left;
    const eastTop = ROAD.right;
    const crosswalkCurbs = [];
    for (const [row, y] of [['north', crossStreetTop], ['south', crossStreetBottom - ROAD_CLEARANCE]]) {
      crosswalkCurbs.push(
        { id: `section-${index}-cross-curb-west-${row}`, kind: 'curb', x: 0, y, width: westTop, height: ROAD_CLEARANCE, stepHeight: 6 },
        { id: `section-${index}-cross-curb-east-${row}`, kind: 'curb', x: eastTop, y, width: WIDTH - eastTop, height: ROAD_CLEARANCE, stepHeight: 6 },
      );
    }
    return [
      { id: `section-${index}-west-curb-north`, kind: 'curb', x: ROAD.left, y: -HEIGHT, width: ROAD_CLEARANCE, height: HEIGHT + crossStreetTop, stepHeight: 6 },
      { id: `section-${index}-west-curb-south`, kind: 'curb', x: ROAD.left, y: crossStreetBottom, width: ROAD_CLEARANCE, height: HEIGHT * 2, stepHeight: 6 },
      { id: `section-${index}-east-curb-north`, kind: 'curb', x: ROAD.right - ROAD_CLEARANCE, y: -HEIGHT, width: ROAD_CLEARANCE, height: HEIGHT + crossStreetTop, stepHeight: 6 },
      { id: `section-${index}-east-curb-south`, kind: 'curb', x: ROAD.right - ROAD_CLEARANCE, y: crossStreetBottom, width: ROAD_CLEARANCE, height: HEIGHT * 2, stepHeight: 6 },
      ...crosswalkCurbs,
    ];
  }
  return [
    { id: `section-${index}-west-curb`, kind: 'curb', x: ROAD.left, y: -HEIGHT, width: ROAD_CLEARANCE, height: HEIGHT * 3, stepHeight: 6 },
    { id: `section-${index}-east-curb`, kind: 'curb', x: ROAD.right - ROAD_CLEARANCE, y: -HEIGHT, width: ROAD_CLEARANCE, height: HEIGHT * 3, stepHeight: 6 },
  ];
}

function createSectionColliders(index) {
  const colliders = [
    { id: `section-${index}-west-world-edge`, kind: 'barrier', x: -32, y: -HEIGHT, width: 32, height: HEIGHT * 3 },
    { id: `section-${index}-east-world-edge`, kind: 'barrier', x: WIDTH, y: -HEIGHT, width: 32, height: HEIGHT * 3 },
    ...createSectionCurbs(index),
  ];

  // Open north/south portals connect all five map tiles into a closed route;
  // solid footprints still protect buildings beside the sidewalk.
  if (index < 2) {
    colliders.push(
      { id: `section-${index}-building-west-1`, kind: 'building', x: 0, y: 0, width: 356, height: 303 },
      { id: `section-${index}-building-west-2`, kind: 'building', x: 0, y: 335, width: 352, height: 232 },
      { id: `section-${index}-building-west-3`, kind: 'building', x: 0, y: 697, width: 352, height: 227 },
      { id: `section-${index}-building-east-1`, kind: 'building', x: 1200, y: 34, width: 350, height: 299 },
      { id: `section-${index}-building-east-2`, kind: 'building', x: 1199, y: 368, width: 351, height: 298 },
      { id: `section-${index}-building-east-3`, kind: 'building', x: 1205, y: 704, width: 345, height: 225 },
    );
  }

  if (index === 2) {
    // Building footprint and patio props remain solid after the traversable curb.
    colliders.push(
      { id: 'bar-building', kind: 'building', x: 1130, y: 332, width: 410, height: 342 },
      { id: 'bar-patio-planter-north', kind: 'prop', x: 1082, y: 395, width: 24, height: 26 },
      { id: 'bar-patio-stool-1', kind: 'prop', x: 1085, y: 440, width: 20, height: 20 },
      { id: 'bar-patio-stool-2', kind: 'prop', x: 1085, y: 482, width: 20, height: 20 },
      { id: 'bar-patio-stool-3', kind: 'prop', x: 1085, y: 524, width: 20, height: 20 },
      { id: 'bar-patio-planter-south', kind: 'prop', x: 1082, y: 567, width: 24, height: 26 },
    );
  }

  if (index === 3) {
    colliders.push(
      { id: 'junction-building-northwest', kind: 'building', x: 0, y: 0, width: 468, height: 294 },
      { id: 'junction-building-northeast', kind: 'building', x: 1115, y: 0, width: 453, height: 292 },
      { id: 'junction-building-southwest', kind: 'building', x: 0, y: 646, width: 468, height: 314 },
      { id: 'junction-building-southeast', kind: 'building', x: 1115, y: 646, width: 453, height: 314 },
      { id: 'junction-bench-northwest', kind: 'prop', x: 274, y: 326, width: 54, height: 18 },
      { id: 'junction-trash-northwest', kind: 'prop', x: 358, y: 326, width: 22, height: 24 },
      { id: 'junction-planter-southeast', kind: 'prop', x: 1120, y: 584, width: 32, height: 34 },
      { id: 'junction-bench-southeast', kind: 'prop', x: 1210, y: 584, width: 54, height: 18 },
    );
  }

  if (index === 4) {
    colliders.push(
      { id: 'curve-building-northwest', kind: 'building', x: 0, y: 0, width: 418, height: 262 },
      { id: 'curve-building-northeast', kind: 'building', x: 1160, y: 0, width: WIDTH - 1160, height: 270 },
      { id: 'curve-building-west-middle', kind: 'building', x: 0, y: 294, width: 408, height: 332 },
      { id: 'curve-building-east-middle', kind: 'building', x: 1180, y: 288, width: WIDTH - 1180, height: 350 },
      { id: 'curve-building-southwest', kind: 'building', x: 0, y: 686, width: 438, height: HEIGHT - 686 },
      { id: 'curve-building-southeast', kind: 'building', x: 1162, y: 678, width: WIDTH - 1162, height: HEIGHT - 678 },
      { id: 'curve-plaza-bench-1', kind: 'prop', x: 1092, y: 194, width: 52, height: 18 },
      { id: 'curve-plaza-bin-1', kind: 'prop', x: 1048, y: 186, width: 22, height: 26 },
      { id: 'curve-plaza-bench-2', kind: 'prop', x: 1092, y: 238, width: 52, height: 18 },
      { id: 'curve-plaza-bin-2', kind: 'prop', x: 1048, y: 232, width: 22, height: 26 },
    );
  }
  return colliders;
}

function finishLoading(image, marketImage = null, barImage = null, junctionImage = null, curveImage = null) {
  const reference = normalizeScene(image);
  const marketReference = normalizeScene(marketImage || fallbackScene());
  const barReference = normalizeScene(barImage || fallbackScene());
  const junctionReference = normalizeScene(junctionImage || fallbackScene());
  const curveReference = normalizeScene(curveImage || fallbackScene());
  sections.length = 0;
  sections.push(
    { name: 'RUA VERMELHA', background: makeStreet(reference, true), colliders: createSectionColliders(0) },
    { name: 'BAIRRO DO MERCADO', background: marketReference, colliders: createSectionColliders(1) },
    { name: 'RUA DO BAR', background: barReference, colliders: createSectionColliders(2) },
    {
      name: 'CRUZAMENTO DA ESTAÇÃO',
      background: widenRoadToReference(junctionReference, () => ROAD.center),
      colliders: createSectionColliders(3),
    },
    {
      name: 'CURVAS DO BOSQUE',
      background: widenRoadToReference(curveReference, curveRoadCenterX),
      colliders: createSectionColliders(4),
      lampPosts: createCurvedLampPosts(),
      lightingRoad: { ...ROAD, left: ROAD.left - CURVE_SWAY, right: ROAD.right + CURVE_SWAY },
      roadCenterAt: curveRoadCenterX,
    },
  );
  state.section = 0;
  streetCanvas = sections[0].background;
  streetSprite = makeCarSprite(reference);
  state.ready = true;
  loading.classList.add('is-ready');
  hint.classList.add('is-visible');
  hintTimer = 8;
  window.setTimeout(() => hint.classList.remove('is-visible'), 6500);
  canvas.focus({ preventScroll: true });
}

function changeSection(index, x, y) {
  const nextSection = sections[index];
  if (!nextSection) return false;
  state.section = index;
  streetCanvas = nextSection.background;
  state.car.x = x;
  state.car.y = y;
  state.car.lateralSpeed = 0;
  syncPreviousCarPose();
  policeCars.length = 0;
  state.capture = 0;
  state.cameraShake = Math.max(state.cameraShake, 1.4);
  showToast(`TRECHO · ${nextSection.name}`, 3200);
  return true;
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
    x: CAR_COLLIDER.halfWidth * cos + CAR_COLLIDER.halfLength * sin,
    y: CAR_COLLIDER.halfLength * cos + CAR_COLLIDER.halfWidth * sin,
  };
}

function vehicleSpeedMagnitude(car = state.car) {
  const forward = Number.isFinite(car.speed) ? car.speed : 0;
  const lateral = Number.isFinite(car.lateralSpeed) ? car.lateralSpeed : 0;
  return Math.hypot(forward, lateral);
}

function syncPreviousCarPose() {
  state.previousCar.x = state.car.x;
  state.previousCar.y = state.car.y;
  state.previousCar.angle = state.car.angle;
  state.previousCar.suspension = state.car.suspension || 0;
}

function drive(dt) {
  const car = state.car;
  const startX = car.x;
  const startY = car.y;
  const startAngle = car.angle;
  const forward = keys.has('w') || keys.has('arrowup');
  const backward = keys.has('s') || keys.has('arrowdown');
  const steer = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
  const handbrake = keys.has('space');
  const movement = stepVehicle(car, { forward, backward, steer, handbrake }, dt);
  const nextX = startX + movement.dx;
  const nextY = startY + movement.dy;
  const bounds = vehicleHalfExtents(car.angle);
  const fitsPortal = nextX - bounds.x >= 0 && nextX + bounds.x <= WIDTH;
  const movingNorth = movement.dy < 0;
  const movingSouth = movement.dy > 0;
  const routeLength = sections.length;
  const nextSection = routeLength ? (state.section + 1) % routeLength : state.section;
  const previousSection = routeLength ? (state.section - 1 + routeLength) % routeLength : state.section;
  const enteringNextStreet = routeLength > 1
    && movingNorth
    && fitsPortal
    && nextY - bounds.y <= 12;
  const returningToPreviousStreet = routeLength > 1
    && movingSouth
    && fitsPortal
    && nextY + bounds.y >= HEIGHT - 12;

  if (enteringNextStreet) {
    changeSection(nextSection, nextX, HEIGHT - bounds.y - 13);
  } else if (returningToPreviousStreet) {
    changeSection(previousSection, nextX, bounds.y + 13);
  } else {
    const motion = resolveVehicleMotion({
      x: startX,
      y: startY,
      startAngle,
      endAngle: car.angle,
      dx: movement.dx,
      dy: movement.dy,
      dt,
      halfWidth: CAR_COLLIDER.halfWidth,
      halfLength: CAR_COLLIDER.halfLength,
      colliders: sections[state.section]?.colliders || [],
    });
    car.x = motion.x;
    car.y = motion.y;

    if (motion.collisions.length) {
      const forwardAxis = { x: Math.sin(car.angle), y: -Math.cos(car.angle) };
      const lateralAxis = { x: Math.cos(car.angle), y: Math.sin(car.angle) };
      car.speed = motion.velocityX * forwardAxis.x + motion.velocityY * forwardAxis.y;
      car.lateralSpeed = motion.velocityX * lateralAxis.x + motion.velocityY * lateralAxis.y;

      const impact = motion.collisions.reduce((maximum, collision) => Math.max(maximum, collision.impactSpeed || 0), 0);
      if (impact > 18) {
        if (car.hitCooldown <= 0) {
          const damage = clamp(Math.round(impact * .045), 2, 14);
          car.health = Math.max(0, car.health - damage);
          car.hitCooldown = .65;
        }
        state.cameraShake = Math.min(7, state.cameraShake + Math.min(5, impact * .035));
        if (elapsed > (state.lastBump || 0) + 850) {
          state.lastBump = elapsed;
          showToast('OBSTÁCULO · REDUZA A VELOCIDADE', 1500);
          playTone(120, .11, 'triangle', .028);
        }
      }
    }

    const curbImpact = motion.curbEvents.reduce((maximum, event) => Math.max(maximum, event.impactSpeed || 0), 0);
    const curbSeverity = motion.curbEvents.reduce((maximum, event) => {
      const height = Number.isFinite(event.obstacle?.stepHeight) ? event.obstacle.stepHeight : 6;
      const heightScale = clamp(height / 6, .5, 1.5);
      return Math.max(maximum, clamp((event.impactSpeed || 0) / 190 * heightScale, 0, 1));
    }, 0);
    if (curbImpact > 2) {
      car.speed *= 1 - (.035 + curbSeverity * .11);
      car.lateralSpeed *= 1 - (.06 + curbSeverity * .16);
      car.suspension = Math.max(car.suspension || 0, .62 + curbSeverity * .33);
      if (car.curbCooldown <= 0 && curbImpact > 48) {
        car.curbCooldown = .28;
        playTone(155, .055, 'triangle', .012);
      }
    }
  }
  car.hitCooldown = Math.max(0, car.hitCooldown - dt);
}

function blockedOnFoot(x, y) {
  const colliders = sections[state.section]?.colliders || [];
  return colliders.some((obstacle) => ['building', 'prop', 'barrier'].includes(obstacle.kind)
    && x > obstacle.x && x < obstacle.x + obstacle.width
    && y > obstacle.y && y < obstacle.y + obstacle.height);
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
  return state.section === 0 && !state.driving && distance(state.foot.x, state.foot.y, phone.x, phone.y) < 78;
}

function interact() {
  if (state.driving) {
    if (vehicleSpeedMagnitude() > 48) {
      showToast('FREIE O CARRO ANTES DE SAIR', 1800);
      return;
    }
    state.driving = false;
    const side = state.car.x > ROAD.center ? -1 : 1;
    state.foot.x = clamp(state.car.x + side * 250, 365, 1190);
    state.foot.y = state.car.y;
    state.foot.angle = state.car.angle;
    syncPreviousCarPose();
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
    state.car.lateralSpeed = 0;
    syncPreviousCarPose();
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
  const person = state.section === 0
    ? people.find((pedestrian) => distance(state.foot.x, state.foot.y, pedestrian.x, pedestrian.baseY) < 40)
    : null;
  if (person) {
    showToast('“O trânsito pesa depois das seis.”');
    return;
  }
  showToast('APROXIME-SE DO CARRO OU DO ORELHÃO');
}

function shove() {
  if (state.driving) {
    state.car.speed *= .67;
    state.car.lateralSpeed *= .67;
    if (vehicleSpeedMagnitude() > 65) showToast('FREIO DE MÃO', 900);
    return;
  }
  const pedestrian = state.section === 0
    ? people.find((person) => distance(state.foot.x, state.foot.y, person.x, person.baseY + Math.sin(elapsed * .001 + person.phase) * person.range) < 38)
    : null;
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
  if (nearest < (state.driving ? 102 : 54) && (!state.driving || vehicleSpeedMagnitude() < 105)) {
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
  state.car.x = CAR_SPAWN.x;
  state.car.y = CAR_SPAWN.y;
  state.car.angle = 0;
  state.car.speed = 0;
  state.car.lateralSpeed = 0;
  state.car.suspension = 0;
  state.car.curbCooldown = 0;
  syncPreviousCarPose();
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

function interpolateCarPose(alpha) {
  const previous = state.previousCar;
  const current = state.car;
  const blend = clamp(alpha, 0, 1);
  const angleDelta = Math.atan2(Math.sin(current.angle - previous.angle), Math.cos(current.angle - previous.angle));
  renderCarPose.x = previous.x + (current.x - previous.x) * blend;
  renderCarPose.y = previous.y + (current.y - previous.y) * blend;
  renderCarPose.angle = previous.angle + angleDelta * blend;
  renderCarPose.health = current.health;
  const previousSuspension = Number.isFinite(previous.suspension) ? previous.suspension : 0;
  const currentSuspension = Number.isFinite(current.suspension) ? current.suspension : 0;
  renderCarPose.suspension = previousSuspension + (currentSuspension - previousSuspension) * blend;
  return renderCarPose;
}

function drawPlayerCar(car = state.car) {
  if (!streetSprite) return;
  ctx.save();
  const suspensionBounce = Math.sin((1 - clamp(car.suspension || 0, 0, 1)) * Math.PI) * 1.5;
  ctx.translate(Math.round(car.x), Math.round(car.y - suspensionBounce));
  ctx.rotate(car.angle);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(streetSprite, -CAR_CROP.width / 2, -CAR_CROP.height / 2);
  if (car.health < 38) {
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
  const weather = getWeatherState(elapsed);
  const weatherLabel = {
    breeze: 'VENTO',
    drizzle: 'GAROA',
    rain: 'CHUVA',
    mist: 'NEBLINA',
  }[weather.kind];
  if (weatherLabel) {
    ctx.fillStyle = 'rgba(9, 12, 10, .72)';
    ctx.fillRect(WIDTH / 2 - 72, 19, 144, 26);
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillStyle = weather.kind === 'rain' || weather.kind === 'drizzle' ? '#a8c8d4' : '#c9bd83';
    ctx.textAlign = 'center';
    ctx.fillText(`CLIMA · ${weatherLabel}`, WIDTH / 2, 36);
    ctx.textAlign = 'left';
  }

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
    text = vehicleSpeedMagnitude() > 48 ? 'SOLTE O ACELERADOR PARA SAIR' : 'E  ·  SAIR DO CARRO';
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

function render(interpolation = 1) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  if (!state.ready || !streetCanvas) {
    ctx.fillStyle = '#090b09';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    return;
  }
  ctx.imageSmoothingEnabled = false;
  const renderCar = interpolateCarPose(interpolation);
  const shakeX = state.cameraShake ? (Math.random() - .5) * state.cameraShake : 0;
  const shakeY = state.cameraShake ? (Math.random() - .5) * state.cameraShake : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);
  ctx.drawImage(streetCanvas, 0, 0);
  const section = sections[state.section];
  const weather = getWeatherState(elapsed);
  const sunlight = drawStreetLighting(ctx, elapsed, WIDTH, HEIGHT, section?.lightingRoad || ROAD, {
    bar: state.section === 2,
    lampPosts: section?.lampPosts,
    roadCenterAt: section?.roadCenterAt,
    rain: weather.rain,
  });

  // Atividades e pedestres permanecem no primeiro quarteirão, onde foram posicionados.
  if (state.section === 0 && (!state.driving || state.mission)) {
    for (const pedestrian of people) drawPerson(pedestrian);
  }
  if (state.section === 0 && (!state.driving || state.mission)) drawPhone();

  const target = getTarget();
  if (target) drawTarget(target);
  for (const police of policeCars) drawPoliceCar(police);
  drawHelicopter();
  drawPlayerCar(renderCar);
  drawCarHighlights(ctx, renderCar, sunlight);
  if (!state.driving) drawPerson(state.foot, true);
  drawWeather(ctx, elapsed, WIDTH, HEIGHT, weather);
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

  if (state.section === 0) {
    for (const pedestrian of people) {
      const personY = pedestrian.baseY + Math.sin(elapsed * .001 + pedestrian.phase) * pedestrian.range;
      if (state.driving && vehicleSpeedMagnitude() > 90 && distance(state.car.x, state.car.y, pedestrian.x, personY) < 42 && elapsed > (pedestrian.hitAt || 0)) {
        pedestrian.hitAt = elapsed + 2600;
        state.wanted = clamp(state.wanted + 1, 0, 5);
        state.car.speed *= .65;
        state.car.lateralSpeed *= .45;
        showToast('O PEDESTRE SE LEVANTOU E SAIU CORRENDO', 2300);
      }
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
  state.car.suspension = Math.max(0, (state.car.suspension || 0) - dt * 5.5);
  state.car.curbCooldown = Math.max(0, (state.car.curbCooldown || 0) - dt);
  state.cameraShake = Math.max(0, state.cameraShake - dt * 11);
  if (state.toast && elapsed > state.toastUntil) state.toast = '';
}

function frame(timestamp) {
  const currentFrame = Number.isFinite(timestamp) ? timestamp : performance.now();
  const frameDelta = lastFrame === null ? 0 : clamp((currentFrame - lastFrame) / 1000, 0, MAX_FRAME_DELTA);
  lastFrame = currentFrame;

  if (!paused && state.ready) {
    handleActionKeys();
    simulationAccumulator = Math.min(simulationAccumulator + frameDelta, FIXED_STEP * MAX_CATCH_UP_STEPS);
    let steps = 0;
    while (simulationAccumulator >= FIXED_STEP && steps < MAX_CATCH_UP_STEPS) {
      syncPreviousCarPose();
      elapsed += FIXED_STEP * 1000;
      update(FIXED_STEP);
      simulationAccumulator -= FIXED_STEP;
      steps += 1;
    }
    updateSound(frameDelta);
  } else {
    // Do not simulate a burst of stale time after a pause, load, or tab switch.
    simulationAccumulator = 0;
    if (paused) {
      syncPreviousCarPose();
      updateSound(0);
    }
  }

  render(!state.ready || paused ? 1 : simulationAccumulator / FIXED_STEP);
  pressed.clear();
  requestAnimationFrame(frame);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    lastFrame = null;
    simulationAccumulator = 0;
    keys.clear();
    pressed.clear();
    syncPreviousCarPose();
  }
});

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

function loadImageAsset(filename) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      console.warn(`Não foi possível carregar o asset: ${filename}`);
      resolve(null);
    };
    image.src = new URL(`./${filename}`, import.meta.url).href;
  });
}

async function startLoading() {
  try {
    const [mainScene, marketScene, barScene, junctionScene, curveScene] = await Promise.all([
      loadImageAsset('gta-retro.png'),
      loadImageAsset('rua-segmento-02.png'),
      loadImageAsset('rua-segmento-03.png'),
      loadImageAsset('rua-segmento-04.png'),
      loadImageAsset('rua-segmento-05.png'),
    ]);
    finishLoading(mainScene || fallbackScene(), marketScene, barScene, junctionScene, curveScene);
    if (![mainScene, marketScene, barScene, junctionScene, curveScene].every(Boolean)) {
      showToast('UM TRECHO ESTÁ INDISPONÍVEL · USANDO CENA DE CONTINGÊNCIA');
    }
  } catch (error) {
    console.error('Falha ao preparar a cena do jogo:', error);
    finishLoading(fallbackScene());
    showToast('FALHA AO CARREGAR A CENA · USANDO CONTINGÊNCIA');
  }
}

void startLoading();
window.setTimeout(() => {
  if (!state.ready) showToast('CARREGANDO A CENA DE NOVA AURORA…', 4000);
}, 2400);

requestAnimationFrame(frame);
