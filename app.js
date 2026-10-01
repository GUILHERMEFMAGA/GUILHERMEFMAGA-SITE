const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const canvas = $('#worldCanvas');
const shell = $('#gameShell');
const loading = $('#loadingScreen');

const ITEM_INFO = [
  { id: 'grass', name: 'GRAMA VÍVIDA', label: 'Grama vívida', icon: 'grass' },
  { id: 'stone', name: 'PEDRA DE RIO', label: 'Pedra de rio', icon: 'stone' },
  { id: 'wood', name: 'MADEIRA ANTIGA', label: 'Madeira antiga', icon: 'wood' },
  { id: 'amber', name: 'FAROL DE ÂMBAR', label: 'Farol de âmbar', icon: 'lantern' },
  { id: 'sand', name: 'AREIA DOURADA', label: 'Areia dourada', icon: 'sand' },
  { id: 'moss', name: 'MUSGO LUNAR', label: 'Musgo lunar', icon: 'moss' },
];
const inventory = { grass: 32, stone: 42, wood: 18, amber: 0, sand: 12, moss: 8 };
const blockForItem = { grass: 'grass', stone: 'stone', wood: 'wood', amber: 'lantern', sand: 'sand', moss: 'moss' };
const dropForBlock = { grass: 'grass', dirt: 'grass', stone: 'stone', rock: 'stone', brick: 'stone', wood: 'wood', leaves: 'moss', moss: 'moss', sand: 'sand', snow: 'moss', lantern: 'amber', flower: 'moss' };
const palette = {
  grass: [0.38, 0.55, 0.31], dirt: [0.40, 0.29, 0.20], stone: [0.47, 0.52, 0.49],
  rock: [0.38, 0.44, 0.43], sand: [0.72, 0.62, 0.41], snow: [0.78, 0.84, 0.80],
  moss: [0.37, 0.50, 0.34], wood: [0.43, 0.29, 0.17], leaves: [0.27, 0.43, 0.27],
  lantern: [0.98, 0.60, 0.24], brick: [0.42, 0.43, 0.37], flower: [0.78, 0.60, 0.62], cloud: [0.72, 0.80, 0.76],
};
const SEA_LEVEL = 3.5;
const WORLD_RADIUS = 53;
const WORLD_WIDTH = WORLD_RADIUS * 2 + 1;
const STRIDE = 10;

let gl = null;
let cubeProgram, waterProgram, skyProgram, shadowProgram, pointProgram;
let cubeVao, actorVao, skyVao, cubeVertexBuffer, staticInstanceBuffer, actorInstanceBuffer;
let waterVao, waterVertexBuffer, waterIndexBuffer, waterIndexCount = 0;
let shadowVao, shadowVertexBuffer, shadowInstanceBuffer;
let pointVao, pointBuffer;
let cubeUniforms = {}, waterUniforms = {}, skyUniforms = {}, shadowUniforms = {}, pointUniforms = {};
let worldSeed = 0;
let random = Math.random;
let randomState = 1;
let worldBlocks = new Map();
let terrainHeights = new Map();
let biomeAt = new Map();
let renderCount = 0;
let player = { x: 0, z: 12, y: 12, vy: 0, energy: 100, grounded: true, step: 0, swimming: false };
let yaw = 0.16;
let pitch = -0.06;
let cameraX = 0, cameraY = 12, cameraZ = 12;
let keys = Object.create(null);
let selectedSlot = 0;
let gameStarted = false;
let pointerLocked = false;
let currentPanel = null;
let lastFrame = 0;
let worldTime = 0.405;
let weatherIndex = 0;
let weatherNames = ['CLARO', 'CHUVA LEVE', 'NEBLINA', 'AURORA'];
let timeScale = 1;
let qualityScale = 1.35;
let sensitivity = 1;
let thirdPerson = false;
let cinematic = false;
let questRegions = new Set();
let exploredTiles = new Set();
let lastExploreMark = 0;
let lastHudUpdate = 0;
let toastTimer = 0;
let activeHit = null;
let landmarkPosition = null;
let animals = [];
let treeShadows = [];
let fireflies = [];
let rainDrops = [];
let clouds = [];
let spawnOrigin = { x: 0, z: 12 };
let lastBiomeId = '';
let minedCount = 0;
let placedCount = 0;
let rewarded = false;
let windStrength = 0.7;
let mapDirty = true;
let settingsSaved = false;
let mobileDrag = null;
let virtualMove = { x: 0, y: 0 };
let frameCounter = 0;

function safeStorageGet(key) {
  try { return localStorage.getItem(key); } catch (_) { return null; }
}
function safeStorageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (_) { /* private browsing */ }
}
function makeSeed() {
  return (Math.random() * 0xffffffff >>> 0) || 0x51e7a11;
}
function getInitialSeed() {
  const saved = safeStorageGet('voxel-realms-seed');
  const parsed = saved ? Number.parseInt(saved, 16) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed >>> 0 : makeSeed();
}
function seedText(seed = worldSeed) {
  const text = (seed >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(-6);
  return `${text.slice(0, 4)}-${text.slice(4)}`;
}
function setSeedLabels() {
  const label = seedText();
  $('#seedLabel').textContent = label;
  $('#introSeed').textContent = label;
  $('#mapSeed').textContent = `SEMENTE ${label}`;
}
function setRandomSource(seed) {
  randomState = (seed ^ 0x9e3779b9) >>> 0;
  random = () => {
    randomState = (randomState + 0x6D2B79F5) >>> 0;
    let value = randomState;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
function hashGrid(x, z) {
  let value = Math.imul((x | 0) ^ worldSeed, 0x45d9f3b) ^ Math.imul((z | 0) + 0x632be5, 0x27d4eb2d);
  value = Math.imul(value ^ (value >>> 15), 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967295;
}
function smooth(t) { return t * t * (3 - 2 * t); }
function mix(a, b, t) { return a + (b - a) * t; }
function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
function valueNoise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = smooth(x - ix), fz = smooth(z - iz);
  const a = hashGrid(ix, iz), b = hashGrid(ix + 1, iz);
  const c = hashGrid(ix, iz + 1), d = hashGrid(ix + 1, iz + 1);
  return mix(mix(a, b, fx), mix(c, d, fx), fz);
}
function fbm(x, z, frequency = 0.02, octaves = 4) {
  let total = 0, amplitude = 0.5, weight = 0, scale = frequency;
  for (let octave = 0; octave < octaves; octave++) {
    total += valueNoise(x * scale, z * scale) * amplitude;
    weight += amplitude;
    amplitude *= 0.5;
    scale *= 2.03;
  }
  return total / weight;
}
function coordKey(x, y, z) { return `${x},${y},${z}`; }
function surfaceKey(x, z) { return `${x},${z}`; }

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Falha ao compilar shader: ${message}`);
  }
  return shader;
}
function makeProgram(vertexSource, fragmentSource) {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Falha ao vincular shader: ${message}`);
  }
  return program;
}
function uniformMap(program, names) {
  const result = {};
  names.forEach(name => { result[name] = gl.getUniformLocation(program, name); });
  return result;
}

const cubeVertexShader = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec3 aOffset;
layout(location=3) in vec3 aScale;
layout(location=4) in vec3 aTint;
layout(location=5) in float aKind;
uniform mat4 uView;
uniform mat4 uProjection;
uniform float uTime;
uniform float uWind;
out vec3 vWorld;
out vec3 vNormal;
out vec3 vTint;
out vec3 vLocal;
out float vKind;
void main(){
  vec3 local = aPosition * aScale;
  if (aKind > 0.5 && aKind < 1.5) {
    float sway = sin(uTime * 1.12 + aOffset.x * 0.17 + aOffset.z * 0.13 + local.y * 0.6) * 0.026 * uWind;
    local.x += sway * max(local.y + aScale.y * 0.52, 0.0);
    local.z += sway * 0.48 * max(local.y + aScale.y * 0.52, 0.0);
  }
  if (aKind > 2.5) {
    local.x += sin(uTime * 0.045 + aOffset.z * 0.07) * 0.55;
    local.z += cos(uTime * 0.035 + aOffset.x * 0.06) * 0.18;
  }
  vec3 world = aOffset + local;
  vWorld = world;
  vNormal = aNormal;
  vTint = aTint;
  vLocal = aPosition;
  vKind = aKind;
  gl_Position = uProjection * uView * vec4(world, 1.0);
}`;
const cubeFragmentShader = `#version 300 es
precision highp float;
in vec3 vWorld;
in vec3 vNormal;
in vec3 vTint;
in vec3 vLocal;
in float vKind;
uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform vec3 uFogColor;
uniform vec3 uEye;
uniform float uAmbient;
uniform float uSunStrength;
uniform float uFogDensity;
uniform float uNight;
uniform float uTime;
out vec4 outColor;
float hash(vec3 p){p=fract(p*0.3183099+vec3(.17,.31,.13));p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
void main(){
  vec3 n = normalize(vNormal);
  float face = n.y > 0.5 ? 1.12 : (n.y < -0.5 ? 0.57 : 0.82);
  float diffuse = max(dot(n, normalize(uSunDirection)), 0.0);
  float light = uAmbient + diffuse * uSunStrength * 0.78;
  vec3 base = vTint;
  vec3 uv = abs(n.y) > 0.5 ? vWorld.xzy : (abs(n.x) > 0.5 ? vWorld.zyx : vWorld.xyz);
  float grain = hash(floor(uv * vec3(7.0, 8.0, 7.0)));
  float fine = hash(floor(uv * vec3(19.0, 16.0, 18.0)));
  float pixel = (grain - 0.5) * 0.105 + (fine - 0.5) * 0.055;
  float fleck = smoothstep(0.87, 0.99, fine) * 0.11;
  base *= (0.93 + pixel + fleck) * face;
  if (vKind > 1.5 && vKind < 2.5) base += vTint * (0.22 + 0.10 * sin(uTime * 2.2 + vWorld.y));
  if (vKind > 2.5) { base = mix(base, vec3(0.84, 0.90, 0.87), 0.32); light = max(light, 0.78); }
  vec3 color = base * light;
  color += uSunColor * diffuse * 0.085;
  float distanceToEye = length(vWorld - uEye);
  float fog = 1.0 - exp(-pow(distanceToEye * uFogDensity, 1.42));
  fog = clamp(fog, 0.0, 0.94);
  color = mix(color, uFogColor, fog);
  color = color / (color + vec3(0.62));
  color = pow(max(color, vec3(0.0)), vec3(0.91));
  outColor = vec4(color, 1.0);
}`;
const skyVertexShader = `#version 300 es
precision highp float;
out vec2 vUv;
void main(){
  vec2 position = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = position;
  gl_Position = vec4(position * 2.0 - 1.0, 1.0, 1.0);
}`;
const skyFragmentShader = `#version 300 es
precision highp float;
in vec2 vUv;
uniform mat4 uInvProjection;
uniform mat4 uInvView;
uniform vec3 uSkyTop;
uniform vec3 uSkyHorizon;
uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform float uNight;
uniform float uTwilight;
uniform float uWeather;
uniform float uTime;
out vec4 outColor;
float hash(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}
void main(){
  vec2 ndc = vUv * 2.0 - 1.0;
  vec4 eyeRay = uInvProjection * vec4(ndc, 1.0, 1.0);
  vec3 ray = normalize((uInvView * vec4(normalize(eyeRay.xyz / max(eyeRay.w, 0.0001)), 0.0)).xyz);
  float height = clamp(ray.y, -0.15, 1.0);
  float blendSky = smoothstep(-0.12, 0.77, height);
  vec3 color = mix(uSkyHorizon, uSkyTop, blendSky);
  float sunDot = max(dot(ray, normalize(uSunDirection)), 0.0);
  float disk = pow(sunDot, 1100.0) * (1.0 - uNight);
  float halo = pow(sunDot, 24.0) * (0.17 + 0.14 * uTwilight) * (1.0 - uNight * 0.4);
  color = mix(color, uSunColor, clamp(disk, 0.0, 1.0));
  color += uSunColor * halo;
  vec3 moonDir = -normalize(uSunDirection);
  float moon = pow(max(dot(ray, moonDir), 0.0), 760.0) * uNight;
  color = mix(color, vec3(0.74, 0.84, 0.86), clamp(moon, 0.0, 1.0));
  float stars = step(0.9988, hash(floor(ray * 320.0))) * smoothstep(-0.02, 0.4, ray.y) * uNight;
  color += vec3(0.43, 0.66, 0.72) * stars * 0.9;
  float auroraWave = sin(ray.x * 13.0 + uTime * 0.24) * 0.5 + 0.5;
  float auroraBand = exp(-pow((ray.y - 0.39 - 0.05 * sin(ray.x * 4.0 + uTime * 0.14)) * 12.0, 2.0));
  color += vec3(0.08, 0.35, 0.27) * auroraWave * auroraBand * uWeather * (0.24 + 0.76 * uNight);
  float mist = smoothstep(-0.12, 0.08, ray.y) * uWeather;
  color = mix(color, vec3(0.42, 0.58, 0.57), mist * 0.16);
  color = pow(max(color, vec3(0.0)), vec3(0.91));
  outColor = vec4(color, 1.0);
}`;
const waterVertexShader = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
uniform mat4 uView;
uniform mat4 uProjection;
uniform float uTime;
out vec3 vWorld;
out float vRipple;
void main(){
  vec3 p = aPosition;
  float w1 = sin(p.x * 0.17 + uTime * 0.72) * 0.075;
  float w2 = cos(p.z * 0.14 - uTime * 0.62) * 0.065;
  float w3 = sin((p.x + p.z) * 0.085 + uTime * 0.46) * 0.045;
  p.y += w1 + w2 + w3;
  vWorld = p;
  vRipple = w1 + w2 + w3;
  gl_Position = uProjection * uView * vec4(p, 1.0);
}`;
const waterFragmentShader = `#version 300 es
precision highp float;
in vec3 vWorld;
in float vRipple;
uniform vec3 uEye;
uniform vec3 uSunDirection;
uniform vec3 uSkyColor;
uniform vec3 uFogColor;
uniform float uTime;
uniform float uFogDensity;
uniform float uSunStrength;
uniform float uWeather;
out vec4 outColor;
void main(){
  vec3 viewDir = normalize(uEye - vWorld);
  vec3 normal = normalize(vec3(-cos(vWorld.x * 0.17 + uTime * .72) * .012, 1.0, sin(vWorld.z * .14 - uTime * .62) * .011));
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.1);
  float wave = sin(vWorld.x * .34 + uTime * .75) * cos(vWorld.z * .24 - uTime * .52);
  vec3 deep = vec3(.035, .24, .25);
  vec3 shallow = vec3(.19, .48, .43);
  vec3 color = mix(deep, shallow, clamp(.48 + wave * .14 + vRipple * 1.8, .12, .84));
  color = mix(color, uSkyColor * .76 + vec3(.08,.11,.08), fresnel * .68);
  vec3 halfVector = normalize(normalize(uSunDirection) + viewDir);
  float specular = pow(max(dot(normal, halfVector), 0.0), 96.0) * uSunStrength;
  float glint = smoothstep(.72, .97, sin(vWorld.x * .65 + vWorld.z * .41 + uTime * 1.2) * .5 + .5) * .1;
  color += vec3(.72, .79, .63) * (specular * .7 + glint) * (1.0 - uWeather * .28);
  float fog = clamp(1.0 - exp(-length(vWorld - uEye) * uFogDensity * .9), 0.0, .82);
  color = mix(color, uFogColor, fog);
  color = color / (color + vec3(.55));
  color = pow(max(color, vec3(0.0)), vec3(.92));
  outColor = vec4(color, .94);
}`;
const shadowVertexShader = `#version 300 es
precision highp float;
layout(location=0) in vec2 aPosition;
layout(location=1) in vec3 aCenter;
layout(location=2) in vec2 aScale;
layout(location=3) in float aAngle;
uniform mat4 uView;
uniform mat4 uProjection;
uniform vec2 uSunXZ;
out vec2 vLocal;
void main(){
  vLocal = aPosition;
  float angle = aAngle + atan(uSunXZ.y, uSunXZ.x);
  float c = cos(angle), s = sin(angle);
  vec2 local = aPosition * aScale;
  vec2 rotated = vec2(local.x*c - local.y*s, local.x*s + local.y*c);
  vec3 p = aCenter + vec3(rotated.x, 0.0, rotated.y);
  gl_Position = uProjection * uView * vec4(p, 1.0);
}`;
const shadowFragmentShader = `#version 300 es
precision highp float;
in vec2 vLocal;
uniform float uOpacity;
out vec4 outColor;
void main(){
  float r = length(vLocal);
  float alpha = (1.0 - smoothstep(.08, 1.0, r)) * uOpacity;
  outColor = vec4(.035, .075, .055, alpha);
}`;
const pointVertexShader = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aColor;
layout(location=2) in float aSize;
layout(location=3) in float aKind;
uniform mat4 uView;
uniform mat4 uProjection;
uniform vec3 uEye;
uniform float uPixelRatio;
uniform float uNight;
uniform float uRain;
out vec3 vColor;
out float vKind;
out float vFade;
void main(){
  vec4 viewPos = uView * vec4(aPosition, 1.0);
  gl_Position = uProjection * viewPos;
  float depth = max(2.0, -viewPos.z);
  gl_PointSize = clamp(aSize * uPixelRatio * (70.0 / depth), 1.0, 11.0);
  vColor = aColor;
  vKind = aKind;
  vFade = aKind < .5 ? uNight : uRain;
}`;
const pointFragmentShader = `#version 300 es
precision highp float;
in vec3 vColor;
in float vKind;
in float vFade;
out vec4 outColor;
void main(){
  vec2 p = gl_PointCoord - .5;
  float alpha;
  if(vKind > .5){
    alpha = (1.0 - smoothstep(.10, .25, abs(p.x))) * (1.0 - smoothstep(.28, .49, abs(p.y))) * .48;
  }else{
    float d = length(p);
    alpha = (1.0 - smoothstep(.15, .50, d)) * .95;
  }
  alpha *= vFade;
  if(alpha < .015) discard;
  vec3 color = vColor + (vKind < .5 ? vec3(.12,.13,.04) : vec3(0.0));
  outColor = vec4(color, alpha);
}`;

function cubeGeometryData() {
  const vertices = [];
  const face = (normal, corners) => {
    const order = [0, 1, 2, 0, 2, 3];
    for (const index of order) vertices.push(...corners[index], ...normal);
  };
  face([0, 0, 1], [[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]);
  face([0, 0, -1], [[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]);
  face([1, 0, 0], [[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5]]);
  face([-1, 0, 0], [[-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]]);
  face([0, 1, 0], [[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]]);
  face([0, -1, 0], [[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]]);
  return new Float32Array(vertices);
}
function attachInstanceAttributes(vao, buffer) {
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const stride = STRIDE * 4;
  for (let location = 2; location <= 5; location++) gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 0);
  gl.vertexAttribPointer(3, 3, gl.FLOAT, false, stride, 12);
  gl.vertexAttribPointer(4, 3, gl.FLOAT, false, stride, 24);
  gl.vertexAttribPointer(5, 1, gl.FLOAT, false, stride, 36);
  for (let location = 2; location <= 5; location++) gl.vertexAttribDivisor(location, 1);
  gl.bindVertexArray(null);
}
function createCubeVao() {
  cubeVao = gl.createVertexArray();
  cubeVertexBuffer = gl.createBuffer();
  gl.bindVertexArray(cubeVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeGeometryData(), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
  staticInstanceBuffer = gl.createBuffer();
  actorInstanceBuffer = gl.createBuffer();
  attachInstanceAttributes(cubeVao, staticInstanceBuffer);
  gl.bindVertexArray(null);
  actorVao = gl.createVertexArray();
  attachInstanceAttributes(actorVao, actorInstanceBuffer);
}
function createWaterMesh() {
  const cells = 104, half = 170, verts = [], indices = [];
  for (let z = 0; z <= cells; z++) {
    for (let x = 0; x <= cells; x++) {
      const px = -half + (x / cells) * half * 2;
      const pz = -half + (z / cells) * half * 2;
      verts.push(px, SEA_LEVEL, pz);
    }
  }
  const row = cells + 1;
  for (let z = 0; z < cells; z++) for (let x = 0; x < cells; x++) {
    const a = z * row + x, b = a + 1, c = a + row, d = c + 1;
    indices.push(a, c, b, b, c, d);
  }
  waterIndexCount = indices.length;
  waterVao = gl.createVertexArray();
  gl.bindVertexArray(waterVao);
  waterVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, waterVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
  waterIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, waterIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
  gl.bindVertexArray(null);
}
function createShadowVao() {
  shadowVao = gl.createVertexArray();
  shadowVertexBuffer = gl.createBuffer();
  shadowInstanceBuffer = gl.createBuffer();
  gl.bindVertexArray(shadowVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, shadowVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, 1,1, -1,-1, 1,1, -1,1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, shadowInstanceBuffer);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 0); gl.vertexAttribDivisor(1, 1);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 24, 12); gl.vertexAttribDivisor(2, 1);
  gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 24, 20); gl.vertexAttribDivisor(3, 1);
  gl.bindVertexArray(null);
}
function createPointVao() {
  pointVao = gl.createVertexArray();
  pointBuffer = gl.createBuffer();
  gl.bindVertexArray(pointVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, 4 * 8 * 4, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 32, 24);
  gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 32, 28);
  gl.bindVertexArray(null);
}
function setupGraphics() {
  gl = canvas.getContext('webgl2', { alpha: false, antialias: true, depth: true, powerPreference: 'high-performance' });
  if (!gl) return false;
  cubeProgram = makeProgram(cubeVertexShader, cubeFragmentShader);
  waterProgram = makeProgram(waterVertexShader, waterFragmentShader);
  skyProgram = makeProgram(skyVertexShader, skyFragmentShader);
  shadowProgram = makeProgram(shadowVertexShader, shadowFragmentShader);
  pointProgram = makeProgram(pointVertexShader, pointFragmentShader);
  cubeUniforms = uniformMap(cubeProgram, ['uView','uProjection','uTime','uWind','uSunDirection','uSunColor','uFogColor','uEye','uAmbient','uSunStrength','uFogDensity','uNight']);
  waterUniforms = uniformMap(waterProgram, ['uView','uProjection','uTime','uEye','uSunDirection','uSkyColor','uFogColor','uFogDensity','uSunStrength','uWeather']);
  skyUniforms = uniformMap(skyProgram, ['uInvProjection','uInvView','uSkyTop','uSkyHorizon','uSunDirection','uSunColor','uNight','uTwilight','uWeather','uTime']);
  shadowUniforms = uniformMap(shadowProgram, ['uView','uProjection','uSunXZ','uOpacity']);
  pointUniforms = uniformMap(pointProgram, ['uView','uProjection','uEye','uPixelRatio','uNight','uRain']);
  createCubeVao();
  createWaterMesh();
  createShadowVao();
  createPointVao();
  skyVao = gl.createVertexArray();
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.disable(gl.CULL_FACE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0.12, 0.2, 0.2, 1);
  resize();
  return true;
}

function mat4Perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return new Float32Array([
    f / aspect,0,0,0,
    0,f,0,0,
    0,0,(far + near) * nf,-1,
    0,0,2 * far * near * nf,0,
  ]);
}
function mat4LookAt(eye, target, up = [0,1,0]) {
  let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
  let length = Math.hypot(zx, zy, zz) || 1; zx /= length; zy /= length; zz /= length;
  let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
  length = Math.hypot(xx, xy, xz) || 1; xx /= length; xy /= length; xz /= length;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  return new Float32Array([
    xx,yx,zx,0,
    xy,yy,zy,0,
    xz,yz,zz,0,
    -(xx*eye[0]+xy*eye[1]+xz*eye[2]),
    -(yx*eye[0]+yy*eye[1]+yz*eye[2]),
    -(zx*eye[0]+zy*eye[1]+zz*eye[2]),1,
  ]);
}
function mat4Invert(a) {
  const out = new Float32Array(16);
  const a00=a[0],a01=a[1],a02=a[2],a03=a[3],a10=a[4],a11=a[5],a12=a[6],a13=a[7],a20=a[8],a21=a[9],a22=a[10],a23=a[11],a30=a[12],a31=a[13],a32=a[14],a33=a[15];
  const b00=a00*a11-a01*a10,b01=a00*a12-a02*a10,b02=a00*a13-a03*a10,b03=a01*a12-a02*a11,b04=a01*a13-a03*a11,b05=a02*a13-a03*a12;
  const b06=a20*a31-a21*a30,b07=a20*a32-a22*a30,b08=a20*a33-a23*a30,b09=a21*a32-a22*a31,b10=a21*a33-a23*a31,b11=a22*a33-a23*a32;
  let det=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;
  if(!det)return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  det=1/det;
  out[0]=(a11*b11-a12*b10+a13*b09)*det;out[1]=(a02*b10-a01*b11-a03*b09)*det;out[2]=(a31*b05-a32*b04+a33*b03)*det;out[3]=(a22*b04-a21*b05-a23*b03)*det;
  out[4]=(a12*b08-a10*b11-a13*b07)*det;out[5]=(a00*b11-a02*b08+a03*b07)*det;out[6]=(a32*b02-a30*b05-a33*b01)*det;out[7]=(a20*b05-a22*b02+a23*b01)*det;
  out[8]=(a10*b10-a11*b08+a13*b06)*det;out[9]=(a01*b08-a00*b10-a03*b06)*det;out[10]=(a30*b04-a31*b02+a33*b00)*det;out[11]=(a21*b02-a20*b04-a23*b00)*det;
  out[12]=(a11*b07-a10*b09-a12*b06)*det;out[13]=(a00*b09-a01*b07+a02*b06)*det;out[14]=(a31*b01-a30*b03-a32*b00)*det;out[15]=(a20*b03-a21*b01+a22*b00)*det;
  return out;
}
function resize() {
  if (!gl) return;
  const ratio = Math.min((window.devicePixelRatio || 1) * qualityScale, 1.8);
  const width = Math.max(1, Math.floor(innerWidth * ratio));
  const height = Math.max(1, Math.floor(innerHeight * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width; canvas.height = height;
    gl.viewport(0, 0, width, height);
  }
}

function addBlock(x, y, z, type, options = {}) {
  const ix = Math.round(x), iy = Math.round(y), iz = Math.round(z);
  const key = coordKey(ix, iy, iz);
  const color = palette[type] || palette.stone;
  const variation = options.variation ?? (0.91 + random() * 0.16);
  const block = {
    x: Number(x), y: Number(y), z: Number(z), type,
    sx: options.sx ?? 1, sy: options.sy ?? 1, sz: options.sz ?? 1,
    r: color[0] * variation, g: color[1] * variation, b: color[2] * variation,
    kind: options.kind ?? (type === 'leaves' ? 1 : type === 'lantern' ? 2 : type === 'cloud' ? 3 : 0),
    solid: options.solid ?? (type !== 'cloud' && type !== 'flower'),
  };
  worldBlocks.set(key, block);
  return block;
}
function heightAt(x, z) {
  const gx = clamp(Math.round(x), -WORLD_RADIUS, WORLD_RADIUS);
  const gz = clamp(Math.round(z), -WORLD_RADIUS, WORLD_RADIUS);
  return terrainHeights.get(surfaceKey(gx, gz)) ?? 0;
}
function biomeInfoAt(x, z) {
  const gx = clamp(Math.round(x), -WORLD_RADIUS, WORLD_RADIUS);
  const gz = clamp(Math.round(z), -WORLD_RADIUS, WORLD_RADIUS);
  return biomeAt.get(surfaceKey(gx, gz)) || { id: 'valley', name: 'VALE DE VÍRIDA', temperature: 0.64 };
}
function terrainSurfaceType(x, z, height) {
  const biome = biomeInfoAt(x, z);
  if (height <= 4) return 'sand';
  if (height >= 18 && biome.temperature < 0.43) return 'snow';
  if (height >= 17) return 'rock';
  if (biome.id === 'ember') return height > 12 ? 'rock' : 'sand';
  if (biome.id === 'tundra') return height > 14 ? 'snow' : 'moss';
  if (biome.id === 'marsh') return 'moss';
  return 'grass';
}
function terrainHeightFor(x, z, centerContinental, centerDetail) {
  const continental = fbm(x, z, 0.014, 4);
  const detail = fbm(x + 91, z - 37, 0.065, 3);
  const ridgedNoise = fbm(x - 58, z + 73, 0.023, 4);
  const ridge = 1 - Math.abs(ridgedNoise * 2 - 1);
  const peaks = Math.pow(Math.max(0, (ridge - 0.69) / 0.31), 2) * 17;
  return clamp(Math.round(8 + (continental - centerContinental) * 16 + (detail - centerDetail) * 4.5 + peaks), 0, 25);
}
function assignBiome(x, z, height) {
  const moisture = fbm(x + 237, z - 119, 0.029, 3);
  const heat = fbm(x - 83, z + 317, 0.017, 3) - (height - 8) * 0.021;
  if (height <= 4) return { id: 'coast', name: 'COSTA VELADA', temperature: heat, moisture };
  if (height > 18 && heat < 0.48) return { id: 'tundra', name: 'TUNDRA DE VIDRO', temperature: heat, moisture };
  if (moisture < 0.34 && heat > 0.48) return { id: 'ember', name: 'ERMOS DE ÂMBAR', temperature: heat, moisture };
  if (moisture > 0.67) return { id: 'marsh', name: 'BREJO DAS LANTERNAS', temperature: heat, moisture };
  if (moisture > 0.53) return { id: 'forest', name: 'MATA DE VÍRIDA', temperature: heat, moisture };
  if (heat < 0.36) return { id: 'tundra', name: 'TUNDRA DE VIDRO', temperature: heat, moisture };
  if (moisture < 0.43) return { id: 'golden', name: 'CAMPOS DOURADOS', temperature: heat, moisture };
  return { id: 'valley', name: 'VALE DE VÍRIDA', temperature: heat, moisture };
}
function setBiomeAt(x, z, biome) { biomeAt.set(surfaceKey(x, z), biome); }
function buildTerrain() {
  terrainHeights.clear(); biomeAt.clear(); worldBlocks.clear(); treeShadows = []; clouds = [];
  const centerContinental = fbm(0, 0, 0.014, 4);
  const centerDetail = fbm(91, -37, 0.065, 3);
  for (let z = -WORLD_RADIUS; z <= WORLD_RADIUS; z++) {
    for (let x = -WORLD_RADIUS; x <= WORLD_RADIUS; x++) {
      const height = terrainHeightFor(x, z, centerContinental, centerDetail);
      terrainHeights.set(surfaceKey(x, z), height);
      let biome = assignBiome(x, z, height);
      if ((x - 7) ** 2 + (z - 7) ** 2 < 24 ** 2 && height > 4 && biome.id !== 'tundra') {
        biome = { ...biome, id: 'forest', name: 'MATA DE VÍRIDA' };
      }
      setBiomeAt(x, z, biome);
      const topType = terrainSurfaceType(x, z, height);
      for (let y = 0; y <= height; y++) {
        let type = y === height ? topType : (y >= height - (topType === 'sand' ? 2 : 3) ? (topType === 'sand' ? 'sand' : 'dirt') : 'stone');
        if (topType === 'rock' && y >= height - 1) type = 'rock';
        if (topType === 'snow' && y === height - 1) type = 'rock';
        addBlock(x, y, z, type);
      }
    }
  }
}
function buildTrees() {
  for (let z = -48; z <= 48; z += 3) {
    for (let x = -48; x <= 48; x += 3) {
      const jitterX = x + Math.floor(random() * 3 - 1);
      const jitterZ = z + Math.floor(random() * 3 - 1);
      const biome = biomeInfoAt(jitterX, jitterZ);
      const height = heightAt(jitterX, jitterZ);
      const distanceToSpawn = Math.hypot(jitterX - spawnOrigin.x, jitterZ - spawnOrigin.z);
      let chance = biome.id === 'forest' ? 0.49 : biome.id === 'marsh' ? 0.38 : biome.id === 'valley' ? 0.22 : biome.id === 'tundra' ? 0.13 : 0.025;
      if (distanceToSpawn < 5.5 || height < 6 || random() > chance) continue;
      const trunkHeight = biome.id === 'tundra' ? 4 + Math.floor(random() * 2) : 3 + Math.floor(random() * 3);
      const top = height;
      for (let y = 1; y <= trunkHeight; y++) addBlock(jitterX, top + y, jitterZ, 'wood', { variation: 0.86 + random() * 0.22 });
      const pine = biome.id === 'tundra' || random() < 0.24;
      if (pine) {
        for (let layer = 0; layer < 4; layer++) {
          const radius = Math.max(1, 2 - Math.floor(layer / 2));
          const centerY = top + trunkHeight - 1 + layer;
          for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) {
            if (Math.abs(dx) + Math.abs(dz) <= radius * 2 && (Math.abs(dx) !== radius || Math.abs(dz) !== radius || random() > 0.27)) {
              addBlock(jitterX + dx, centerY, jitterZ + dz, 'leaves', { variation: 0.78 + random() * 0.34 });
            }
          }
        }
      } else {
        const radius = 2;
        for (let dy = -1; dy <= 2; dy++) {
          for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) {
            const distance = dx * dx + dz * dz + (dy < 1 ? 0.85 : 1.15) * dy * dy;
            if (distance <= 6.4 && !(Math.abs(dx) === radius && Math.abs(dz) === radius && random() < 0.48)) {
              addBlock(jitterX + dx, top + trunkHeight + dy - 1, jitterZ + dz, 'leaves', { variation: 0.77 + random() * 0.36 });
            }
          }
        }
      }
      treeShadows.push({ x: jitterX, z: jitterZ, y: top + 0.53, radius: pine ? 1.35 : 1.65, angle: random() * Math.PI });
    }
  }
}
function buildGroundDetails() {
  for (let z = -47; z <= 47; z += 4) for (let x = -47; x <= 47; x += 4) {
    if (random() > 0.20) continue;
    const px = x + (random() - 0.5) * 2, pz = z + (random() - 0.5) * 2;
    const height = heightAt(px, pz), biome = biomeInfoAt(px, pz);
    if (height < 5 || biome.id === 'forest' || biome.id === 'marsh' || biome.id === 'coast') continue;
    for (let i = 0; i < 2 + Math.floor(random() * 3); i++) {
      const rx = Math.round(px + (random() - 0.5) * 2), rz = Math.round(pz + (random() - 0.5) * 2);
      addBlock(rx, height + (i > 1 ? 1 : 0), rz, 'rock', { sx: 0.76 + random() * 0.27, sy: 0.72 + random() * 0.36, sz: 0.75 + random() * 0.3 });
    }
  }
  for (let z = -44; z <= 44; z += 3) for (let x = -44; x <= 44; x += 3) {
    if (random() > 0.075) continue;
    const px = x + Math.floor(random() * 2), pz = z + Math.floor(random() * 2);
    const biome = biomeInfoAt(px, pz), height = heightAt(px, pz);
    if (height > 5 && (biome.id === 'valley' || biome.id === 'golden' || biome.id === 'forest')) {
      addBlock(px, height + 1, pz, 'flower', { sx: 0.22, sy: 0.55, sz: 0.22, solid: false, variation: 0.82 + random() * 0.25 });
    }
  }
}
function buildRuin(cx, cz, variant = 0) {
  let cy = heightAt(cx, cz);
  if (cy <= 4) {
    let best = null;
    for (let r = 1; r < 23; r++) for (let a = 0; a < 8; a++) {
      const x = Math.round(cx + Math.cos(a * Math.PI / 4) * r), z = Math.round(cz + Math.sin(a * Math.PI / 4) * r);
      if (heightAt(x, z) > 7) { best = { x, z }; break; }
    }
    if (best) { cx = best.x; cz = best.z; cy = heightAt(cx, cz); }
  }
  const stone = variant ? 'rock' : 'brick';
  for (let z = -3; z <= 3; z++) for (let x = -3; x <= 3; x++) {
    if (Math.abs(x) === 3 || Math.abs(z) === 3 || (Math.abs(x) < 2 && Math.abs(z) < 2)) addBlock(cx + x, cy + 1, cz + z, stone, { variation: 0.8 + random() * 0.28 });
  }
  const towers = [[-3,-3,4],[3,-3,3],[-3,3,2],[3,3,4]];
  for (const [dx,dz,h] of towers) {
    for (let y = 2; y <= h; y++) addBlock(cx + dx, cy + y, cz + dz, stone, { variation: 0.82 + random() * 0.22 });
    addBlock(cx + dx, cy + h + 1, cz + dz, 'lantern', { variation: 0.95 });
  }
  for (let x = -2; x <= 2; x++) {
    if (x !== 0 || variant) addBlock(cx + x, cy + 2, cz - 3, stone, { variation: 0.88 + random() * 0.2 });
    if (x !== 1) addBlock(cx + x, cy + 2, cz + 3, stone, { variation: 0.82 + random() * 0.2 });
  }
  for (let y = 2; y <= 4; y++) {
    addBlock(cx - 3, cy + y, cz, stone, { variation: 0.78 + random() * 0.24 });
    addBlock(cx + 3, cy + y, cz + 1, stone, { variation: 0.78 + random() * 0.24 });
  }
  addBlock(cx, cy + 2, cz, 'lantern', { sx: 0.82, sy: 1.35, sz: 0.82 });
  addBlock(cx, cy + 3, cz, 'lantern', { sx: 0.48, sy: 0.8, sz: 0.48 });
  if (!variant) landmarkPosition = { x: cx, z: cz, y: cy + 0.5 };
}
function buildClouds() {
  for (let i = 0; i < 10; i++) {
    const cx = Math.round((random() - 0.5) * 86), cz = Math.round((random() - 0.5) * 86);
    const cy = 25 + Math.floor(random() * 7);
    const count = 4 + Math.floor(random() * 4);
    clouds.push({ x: cx, z: cz, speed: (random() - 0.5) * 0.45, phase: random() * Math.PI * 2 });
    for (let j = 0; j < count; j++) {
      const dx = Math.round((random() - 0.5) * 5), dz = Math.round((random() - 0.5) * 3);
      addBlock(cx + dx, cy + (random() > 0.7 ? 1 : 0), cz + dz, 'cloud', { sx: 1.8 + random() * 2.9, sy: 0.62 + random() * 0.65, sz: 1.5 + random() * 2.8, solid: false, variation: 0.88 + random() * 0.16 });
    }
  }
}
function createAnimal(x, z, type = 0) {
  const ground = heightAt(x, z) + 0.5;
  animals.push({
    x, z, y: ground, direction: random() * Math.PI * 2, targetX: x, targetZ: z,
    timer: random() * 3, phase: random() * Math.PI * 6, state: 'wander',
    speed: 0.55 + random() * 0.5, type, flee: 0,
  });
}
function findCreatureSpot(offset = 0) {
  for (let attempt = 0; attempt < 70; attempt++) {
    const x = Math.round((random() - 0.5) * 34 + offset * 2);
    const z = Math.round(-4 - random() * 29);
    const biome = biomeInfoAt(x, z);
    if (heightAt(x, z) > 5 && (biome.id === 'forest' || biome.id === 'valley' || biome.id === 'marsh') && Math.hypot(x - spawnOrigin.x, z - spawnOrigin.z) > 7) return { x, z };
  }
  return { x: 9 + offset, z: -8 };
}
function buildAnimals() {
  animals = [];
  for (let i = 0; i < 7; i++) {
    const spot = findCreatureSpot(i - 3);
    createAnimal(spot.x, spot.z, i % 3);
  }
}
function buildFireflies() {
  fireflies = [];
  for (let i = 0; i < 38; i++) {
    const x = Math.round((random() - 0.5) * 64), z = Math.round((random() - 0.5) * 64);
    fireflies.push({ x, z, y: Math.max(6, heightAt(x, z) + 1 + random() * 3), phase: random() * Math.PI * 2, radius: 0.25 + random() * 0.65, color: random() > 0.42 ? [0.75, 0.91, 0.5] : [0.62, 0.88, 0.87] });
  }
}
function markExplored(x, z, radius = 3) {
  const cx = Math.round(x), cz = Math.round(z);
  for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
    if (dx * dx + dz * dz <= radius * radius) {
      exploredTiles.add(`${Math.floor((cx + dx) / 2)},${Math.floor((cz + dz) / 2)}`);
    }
  }
  mapDirty = true;
}

function isSolidAt(x, y, z) {
  const block = worldBlocks.get(coordKey(Math.round(x), Math.round(y), Math.round(z)));
  return !!block?.solid;
}
function isBlockVisible(block) {
  if (!block.solid) return true;
  const x = Math.round(block.x), y = Math.round(block.y), z = Math.round(block.z);
  return !isSolidAt(x + 1, y, z) || !isSolidAt(x - 1, y, z) || !isSolidAt(x, y + 1, z) || !isSolidAt(x, y - 1, z) || !isSolidAt(x, y, z + 1) || !isSolidAt(x, y, z - 1);
}
function packBlock(block, target, offset) {
  target[offset] = block.x; target[offset + 1] = block.y; target[offset + 2] = block.z;
  target[offset + 3] = block.sx; target[offset + 4] = block.sy; target[offset + 5] = block.sz;
  target[offset + 6] = block.r; target[offset + 7] = block.g; target[offset + 8] = block.b;
  target[offset + 9] = block.kind;
}
function rebuildInstances() {
  const visible = [];
  for (const block of worldBlocks.values()) if (isBlockVisible(block)) visible.push(block);
  const data = new Float32Array(visible.length * STRIDE);
  let offset = 0;
  for (const block of visible) { packBlock(block, data, offset); offset += STRIDE; }
  gl.bindBuffer(gl.ARRAY_BUFFER, staticInstanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  renderCount = visible.length;
  mapDirty = true;
}
function addAnimalInstances(target, offset) {
  let index = offset;
  for (const actor of animals) {
    const colors = [[0.67,0.48,0.28],[0.54,0.63,0.43],[0.64,0.60,0.42]];
    const tint = colors[actor.type];
    const legSwing = Math.sin(actor.phase) * 0.13;
    const forwardX = Math.sin(actor.direction), forwardZ = -Math.cos(actor.direction);
    const rightX = Math.cos(actor.direction), rightZ = Math.sin(actor.direction);
    const addPart = (lx, y, lz, sx, sy, sz, color = tint, kind = 0) => {
      const x = actor.x + rightX * lx + forwardX * lz;
      const z = actor.z + rightZ * lx + forwardZ * lz;
      const part = { x, y: actor.y + y, z, sx, sy, sz, r: color[0], g: color[1], b: color[2], kind };
      packBlock(part, target, index); index += STRIDE;
    };
    addPart(0, 0.74, 0.03, 0.91, 0.49, 0.52);
    addPart(0, 1.02, -0.47, 0.42, 0.39, 0.39, [tint[0] * 1.12, tint[1] * 1.08, tint[2] * 1.02]);
    addPart(-0.1, 1.24, -0.49, 0.09, 0.21, 0.09, [0.81,0.66,0.47]);
    addPart(0.1, 1.24, -0.49, 0.09, 0.21, 0.09, [0.81,0.66,0.47]);
    addPart(0, 0.78, 0.34, 0.18, 0.2, 0.23, [tint[0] * 0.72, tint[1] * 0.74, tint[2] * 0.72]);
    const leg = [
      [-0.27, 0.21 + legSwing, -0.16], [0.27, 0.21 - legSwing, -0.16],
      [-0.27, 0.21 - legSwing, 0.18], [0.27, 0.21 + legSwing, 0.18],
    ];
    for (const [lx, ly, lz] of leg) addPart(lx, ly, lz, 0.14, 0.4, 0.14, [0.35,0.30,0.22]);
  }
  return index;
}
function refreshActorBuffer() {
  if (!animals.length) return;
  const data = new Float32Array(animals.length * 10 * STRIDE);
  const count = addAnimalInstances(data, 0) / STRIDE;
  gl.bindBuffer(gl.ARRAY_BUFFER, actorInstanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, count * STRIDE), gl.DYNAMIC_DRAW);
  animals.instanceCount = count;
}
function shadowData() {
  const data = new Float32Array(treeShadows.length * 6);
  let i = 0;
  for (const shadow of treeShadows) {
    data[i++] = shadow.x; data[i++] = shadow.y; data[i++] = shadow.z;
    data[i++] = shadow.radius * 1.12; data[i++] = shadow.radius * 1.95;
    data[i++] = shadow.angle;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, shadowInstanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
}

function generateWorld(seed, initial = false) {
  worldSeed = seed >>> 0;
  setRandomSource(worldSeed);
  setSeedLabels();
  safeStorageSet('voxel-realms-seed', (worldSeed >>> 0).toString(16));
  $('#loadingStatus').textContent = 'MOLDANDO A PAISAGEM PROCEDURAL';
  if (!initial) {
    $('#loadingStatus').textContent = 'GERANDO UMA NOVA FRONTEIRA';
    loading.classList.remove('done');
  }
  questRegions = new Set(); exploredTiles = new Set(); landmarkPosition = null;
  animals = []; treeShadows = []; clouds = []; fireflies = [];
  buildTerrain();
  buildTrees();
  buildGroundDetails();
  buildRuin(-25, -31, 0);
  buildRuin(30, -37, 1);
  buildClouds();
  buildAnimals();
  buildFireflies();
  player.x = spawnOrigin.x;
  player.z = spawnOrigin.z;
  player.y = heightAt(player.x, player.z) + 2.15;
  cameraX = player.x; cameraY = player.y; cameraZ = player.z;
  Object.assign(inventory, { grass: 32, stone: 42, wood: 18, amber: 0, sand: 12, moss: 8 });
  player.vy = 0; player.energy = 100; player.grounded = true;
  yaw = 0.16; pitch = -0.06;
  worldTime = 0.405; weatherIndex = 0;
  selectedSlot = 0; minedCount = 0; placedCount = 0; rewarded = false;
  questRegions.add(biomeInfoAt(player.x, player.z).id);
  lastBiomeId = biomeInfoAt(player.x, player.z).id;
  markExplored(player.x, player.z, 11);
  rebuildInstances();
  shadowData();
  renderHotbar();
  updateWeatherUi();
  updateHud(true);
  updateQuest();
  drawMap();
  if (!initial) showToast('Uma nova fronteira surgiu. A semente foi salva neste dispositivo.');
  setTimeout(() => loading.classList.add('done'), initial ? 360 : 700);
}

function biomeColor(biome, height) {
  if (height <= 4) return [58, 111, 113];
  if (biome?.id === 'forest') return [59, 99, 66];
  if (biome?.id === 'marsh') return [75, 104, 77];
  if (biome?.id === 'tundra') return [157, 174, 156];
  if (biome?.id === 'ember') return [169, 129, 77];
  if (biome?.id === 'golden') return [150, 143, 86];
  const shade = Math.max(0, Math.min(50, (height - 9) * 5));
  return [88 + shade * .3, 126 + shade * .35, 87 + shade * .25];
}
function drawMap() {
  const mapCanvas = $('#mapCanvas');
  if (!mapCanvas || !mapDirty || !terrainHeights.size) return;
  const ctx = mapCanvas.getContext('2d');
  const width = 160, height = 110;
  const image = ctx.createImageData(width, height);
  for (let py = 0; py < height; py++) for (let px = 0; px < width; px++) {
    const wx = Math.round((px / (width - 1) * 2 - 1) * WORLD_RADIUS);
    const wz = Math.round((py / (height - 1) * 2 - 1) * WORLD_RADIUS);
    const tile = `${Math.floor(wx / 2)},${Math.floor(wz / 2)}`;
    const offset = (py * width + px) * 4;
    if (!exploredTiles.has(tile)) {
      const hatch = (px + py) % 7 === 0 ? 12 : 0;
      image.data[offset] = 15 + hatch; image.data[offset + 1] = 29 + hatch; image.data[offset + 2] = 27 + hatch; image.data[offset + 3] = 255;
      continue;
    }
    const terrain = terrainHeights.get(surfaceKey(wx, wz)) ?? 0;
    const base = biomeColor(biomeAt.get(surfaceKey(wx, wz)), terrain);
    const heightShade = terrain > 16 ? (terrain - 16) * 2.3 : 0;
    image.data[offset] = Math.min(255, base[0] + heightShade);
    image.data[offset + 1] = Math.min(255, base[1] + heightShade);
    image.data[offset + 2] = Math.min(255, base[2] + heightShade);
    image.data[offset + 3] = 255;
  }
  const tiny = document.createElement('canvas'); tiny.width = width; tiny.height = height;
  tiny.getContext('2d').putImageData(image, 0, 0);
  ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tiny, 0, 0, mapCanvas.width, mapCanvas.height);
  ctx.strokeStyle = 'rgba(223,240,219,.10)'; ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const gx = mapCanvas.width * i / 4, gy = mapCanvas.height * i / 4;
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, mapCanvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(mapCanvas.width, gy); ctx.stroke();
  }
  const px = (player.x / (WORLD_RADIUS * 2) + 0.5) * mapCanvas.width;
  const py = (player.z / (WORLD_RADIUS * 2) + 0.5) * mapCanvas.height;
  ctx.save(); ctx.translate(px, py); ctx.rotate(yaw);
  ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6, 7); ctx.lineTo(0, 4); ctx.lineTo(-6, 7); ctx.closePath();
  ctx.fillStyle = '#d5efaa'; ctx.shadowColor = '#ceeb9c'; ctx.shadowBlur = 12; ctx.fill(); ctx.restore();
  if (landmarkPosition) {
    const lx = (landmarkPosition.x / (WORLD_RADIUS * 2) + .5) * mapCanvas.width;
    const lz = (landmarkPosition.z / (WORLD_RADIUS * 2) + .5) * mapCanvas.height;
    if (exploredTiles.has(`${Math.floor(landmarkPosition.x / 2)},${Math.floor(landmarkPosition.z / 2)}`)) {
      ctx.fillStyle = '#edca7d'; ctx.beginPath(); ctx.arc(lx, lz, 3, 0, Math.PI * 2); ctx.fill();
    }
  }
  $('#mapBiome').textContent = biomeInfoAt(player.x, player.z).name.toLowerCase().replace(/(^|\s)\S/g, letter => letter.toUpperCase());
  $('#mapPosition').textContent = `X ${Math.round(player.x).toString().padStart(3,'0')} · Z ${Math.round(player.z).toString().padStart(3,'0')} · ALT ${Math.round(player.y).toString().padStart(2,'0')}`;
  mapDirty = false;
}

function getCount(itemId) { return inventory[itemId] || 0; }
function renderHotbar() {
  const bar = $('#hotbar');
  bar.innerHTML = '';
  ITEM_INFO.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = `hotbar-slot${index === selectedSlot ? ' selected' : ''}`;
    button.dataset.slot = index; button.title = `${index + 1} · ${item.label}`; button.setAttribute('aria-label', `${index + 1}: ${item.label}, ${getCount(item.id)}`);
    button.innerHTML = `<span class="slot-key">${index + 1}</span><i class="voxel-icon ${item.icon}"></i><span class="slot-count">${getCount(item.id)}</span>`;
    button.addEventListener('click', () => selectSlot(index));
    bar.appendChild(button);
  });
  updateSelectedLabel();
}
function selectSlot(index) {
  selectedSlot = (index + ITEM_INFO.length) % ITEM_INFO.length;
  $$('.hotbar-slot').forEach((slot, i) => slot.classList.toggle('selected', i === selectedSlot));
  $$('.hotbar-slot').forEach((slot, i) => slot.setAttribute('aria-label', `${i + 1}: ${ITEM_INFO[i].label}, ${getCount(ITEM_INFO[i].id)}`));
  updateSelectedLabel();
}
function updateSelectedLabel() {
  const item = ITEM_INFO[selectedSlot];
  if (!item) return;
  $('#selectedName').textContent = item.name;
  $('#selectedCount').textContent = `× ${getCount(item.id)}`;
}
function renderInventory() {
  const grid = $('#inventoryGrid');
  grid.innerHTML = '';
  ITEM_INFO.forEach(item => {
    const cell = document.createElement('div');
    cell.className = 'inventory-cell';
    cell.innerHTML = `<b>× ${getCount(item.id)}</b><i class="voxel-icon ${item.icon}"></i><span>${item.label}</span>`;
    grid.appendChild(cell);
  });
  const canCraft = inventory.wood >= 3 && inventory.stone >= 2;
  $('#craftButton').disabled = !canCraft;
  $('#craftCost').textContent = canCraft ? '3 MADEIRA · 2 PEDRA' : 'MATERIAIS INSUFICIENTES';
  $('#inventoryCapacity').textContent = `${Object.keys(inventory).length} TIPOS DE RECURSO`;
  mapDirty = true;
}
function updateQuest() {
  const count = Math.min(questRegions.size, 3);
  const pct = Math.round(count / 3 * 100);
  $('#questProgressBar').style.width = `${pct}%`;
  $('#questProgressText').textContent = `${count} / 3 regiões`;
  $('#questPercent').textContent = `${pct}%`;
  if (count >= 3) {
    $('#questDescription').textContent = 'Três paisagens foram registradas. O mundo já conhece seu primeiro caminho.';
    $('#questProgressText').textContent = 'REGIÕES MAPEADAS';
    if (!rewarded) {
      rewarded = true;
      inventory.amber += 3;
      renderHotbar();
      showToast('Atlas atualizado. Você encontrou 3 fragmentos de luz.');
    }
  } else {
    $('#questDescription').textContent = `Explore a região e registre ${3 - count} nova${count === 1 ? 's' : ''} paisagem${count === 1 ? 'm' : 's'} no seu atlas.`;
  }
}
function updateHud(force = false) {
  const now = performance.now();
  if (!force && now - lastHudUpdate < 180) return;
  lastHudUpdate = now;
  const health = 100;
  const energy = Math.round(player.energy);
  $('#healthMeter').style.width = `${health}%`;
  $('#energyMeter').style.width = `${energy}%`;
  $('#healthValue').textContent = `${health}`;
  $('#energyValue').textContent = `${energy}`;
  const biome = biomeInfoAt(player.x, player.z);
  const label = biome.name;
  $('#biomeName').textContent = label;
  $('#coordinates').textContent = `X ${Math.round(player.x).toString().padStart(3,'0')} · Z ${Math.round(player.z).toString().padStart(3,'0')}`;
  const temperature = Math.round(23 - (heightAt(player.x, player.z) - 8) * 0.8 - (weatherIndex === 1 ? 2 : 0));
  $('#temperatureLabel').textContent = `${temperature}°`;
  $('#hungerLabel').textContent = `${Math.max(0, 96 - Math.floor(minedCount / 12))}%`;
  if (biome.id !== lastBiomeId) {
    lastBiomeId = biome.id;
    if (!questRegions.has(biome.id)) {
      questRegions.add(biome.id);
      showToast(`REGIÃO MAPEADA · ${biome.name}`);
      updateQuest();
    }
  }
  if (now - lastExploreMark > 550) {
    lastExploreMark = now;
    markExplored(player.x, player.z, 3);
  }
  if (currentPanel === 'mapOverlay') drawMap();
  $('#mapBiome').textContent = label.toLowerCase().replace(/(^|\s)\S/g, letter => letter.toUpperCase());
  $('#mapPosition').textContent = `X ${Math.round(player.x).toString().padStart(3,'0')} · Z ${Math.round(player.z).toString().padStart(3,'0')} · ALT ${Math.round(player.y).toString().padStart(2,'0')}`;
}
function showToast(message) {
  $('#toastMessage').textContent = message;
  const toast = $('#toast');
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2700);
}
function formatWorldTime() {
  const totalMinutes = Math.floor(((worldTime % 1 + 1) % 1) * 24 * 60);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2,'0')}:${String(totalMinutes % 60).padStart(2,'0')}`;
}
function updateWeatherUi() {
  $('#weatherLabel').textContent = weatherNames[weatherIndex];
  const icon = $('#weatherIcon');
  if (weatherIndex === 1) icon.innerHTML = '<path d="M7 15a4 4 0 1 1 1.1-7.8A5.5 5.5 0 0 1 19 9.5a3.2 3.2 0 0 1-.5 6.3H7Z"/><path d="m9 18-1 2m6-2-1 2m6-2-1 2"/>';
  else if (weatherIndex === 2) icon.innerHTML = '<path d="M3 8h12M2 12h16M5 16h15M7 4h10"/>';
  else if (weatherIndex === 3) icon.innerHTML = '<path d="M5 16a7 7 0 0 1 13.5-2.5A4 4 0 0 1 18 21H7a5 5 0 0 1-2-9.6Z"/><path d="m12 9 1-2m4 2 1-2"/>';
  else icon.innerHTML = '<circle cx="12" cy="12" r="3.6"/><path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2.5 12h2m15 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
}

function openPanel(id) {
  if (currentPanel === id) { closePanel(); return; }
  if (currentPanel) $(`#${currentPanel}`).classList.remove('visible');
  currentPanel = id;
  $(`#${id}`).classList.add('visible');
  $(`#${id}`).setAttribute('aria-hidden', 'false');
  if (pointerLocked && document.exitPointerLock) document.exitPointerLock();
  if (id === 'mapOverlay') drawMap();
  if (id === 'inventoryOverlay') renderInventory();
}
function closePanel() {
  if (!currentPanel) return;
  const id = currentPanel;
  $(`#${id}`).classList.remove('visible');
  $(`#${id}`).setAttribute('aria-hidden', 'true');
  currentPanel = null;
  if (gameStarted) requestLock();
}
function requestLock() {
  shell.classList.add('is-playing');
  if (matchMedia('(pointer: coarse)').matches) return;
  if (canvas.requestPointerLock) {
    try { canvas.requestPointerLock(); } catch (_) { shell.classList.add('is-playing'); }
  }
}
function startExpedition() {
  gameStarted = true;
  $('#introPanel').setAttribute('aria-hidden', 'true');
  requestLock();
  showToast('Expedição iniciada · WASD mover · clique para escavar');
}
function setPauseVisible(visible) {
  const pause = $('#pausePanel');
  pause.classList.toggle('visible', visible);
  pause.setAttribute('aria-hidden', visible ? 'false' : 'true');
}

function getCameraDirection() {
  const cp = Math.cos(pitch);
  return [Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp];
}
function raycastBlocks(maxDistance = 7) {
  const direction = getCameraDirection();
  let x = Math.floor(cameraX + 0.5), y = Math.floor(cameraY + 0.5), z = Math.floor(cameraZ + 0.5);
  const stepX = Math.sign(direction[0]), stepY = Math.sign(direction[1]), stepZ = Math.sign(direction[2]);
  const deltaX = stepX ? Math.abs(1 / direction[0]) : Infinity;
  const deltaY = stepY ? Math.abs(1 / direction[1]) : Infinity;
  const deltaZ = stepZ ? Math.abs(1 / direction[2]) : Infinity;
  let maxX = stepX > 0 ? (x + 0.5 - cameraX) / direction[0] : stepX < 0 ? (x - 0.5 - cameraX) / direction[0] : Infinity;
  let maxY = stepY > 0 ? (y + 0.5 - cameraY) / direction[1] : stepY < 0 ? (y - 0.5 - cameraY) / direction[1] : Infinity;
  let maxZ = stepZ > 0 ? (z + 0.5 - cameraZ) / direction[2] : stepZ < 0 ? (z - 0.5 - cameraZ) / direction[2] : Infinity;
  let distance = 0, normal = [0, 0, 0];
  while (distance <= maxDistance) {
    const block = worldBlocks.get(coordKey(x, y, z));
    if (block?.solid) return { block, key: coordKey(x,y,z), normal, distance };
    if (maxX < maxY && maxX < maxZ) { distance = maxX; maxX += deltaX; x += stepX; normal = [-stepX, 0, 0]; }
    else if (maxY < maxZ) { distance = maxY; maxY += deltaY; y += stepY; normal = [0, -stepY, 0]; }
    else { distance = maxZ; maxZ += deltaZ; z += stepZ; normal = [0, 0, -stepZ]; }
  }
  return null;
}
function handleMine() {
  const hit = raycastBlocks(7);
  if (!hit) { showToast('Nada ao alcance · aproxime-se de um bloco'); return; }
  const block = hit.block;
  const drop = dropForBlock[block.type];
  if (drop) inventory[drop] = (inventory[drop] || 0) + 1;
  worldBlocks.delete(hit.key);
  const ix = Math.round(block.x), iz = Math.round(block.z);
  if (terrainHeights.has(surfaceKey(ix, iz)) && Math.round(block.y) === terrainHeights.get(surfaceKey(ix, iz))) {
    let next = Math.round(block.y) - 1;
    while (next >= 0 && !worldBlocks.has(coordKey(ix, next, iz))) next--;
    terrainHeights.set(surfaceKey(ix, iz), Math.max(0, next));
  }
  minedCount++;
  rebuildInstances();
  updateHud(true);
  renderHotbar();
  if (currentPanel === 'inventoryOverlay') renderInventory();
  if (minedCount === 1 || minedCount % 6 === 0) showToast(`${block.type === 'leaves' ? 'Vegetação' : block.type === 'lantern' ? 'Fragmento de luz' : 'Recurso'} coletado · ${drop ? inventory[drop] : ''}`);
}
function handlePlace() {
  const item = ITEM_INFO[selectedSlot];
  if (!item || getCount(item.id) < 1) { showToast('Sem unidades deste material · abra a mochila para criar recursos'); return; }
  const hit = raycastBlocks(7);
  if (!hit) { showToast('Aponte para uma superfície próxima para construir'); return; }
  const x = Math.round(hit.block.x + hit.normal[0]);
  const y = Math.round(hit.block.y + hit.normal[1]);
  const z = Math.round(hit.block.z + hit.normal[2]);
  const centerY = player.y - 1.1;
  if (Math.hypot(x - player.x, z - player.z) < 0.9 && Math.abs(y - centerY) < 1.7) { showToast('Há pouco espaço para construir aqui'); return; }
  const key = coordKey(x, y, z);
  if (worldBlocks.has(key)) { showToast('Este espaço já está ocupado'); return; }
  const type = blockForItem[item.id];
  addBlock(x, y, z, type, { variation: 0.98 });
  inventory[item.id]--;
  if (terrainHeights.has(surfaceKey(x, z)) && y > terrainHeights.get(surfaceKey(x, z))) terrainHeights.set(surfaceKey(x, z), y);
  placedCount++;
  rebuildInstances(); updateHud(true); renderHotbar();
  if (currentPanel === 'inventoryOverlay') renderInventory();
  showToast(item.id === 'amber' ? 'Farol de âmbar colocado · a luz muda com o mundo' : `${item.label} colocado`);
}

function updateAnimals(dt) {
  for (const animal of animals) {
    animal.timer -= dt;
    animal.phase += dt * (animal.state === 'flee' ? 11 : 4.3) * animal.speed;
    const distance = Math.hypot(animal.x - player.x, animal.z - player.z);
    if (distance < 9) {
      animal.state = 'flee';
      animal.timer = 0.65;
      const dx = animal.x - player.x, dz = animal.z - player.z;
      const length = Math.hypot(dx, dz) || 1;
      animal.targetX = animal.x + dx / length * 10 + (random() - .5) * 4;
      animal.targetZ = animal.z + dz / length * 10 + (random() - .5) * 4;
    } else if (animal.timer <= 0 || Math.hypot(animal.targetX - animal.x, animal.targetZ - animal.z) < .75) {
      animal.state = 'wander';
      animal.timer = 3 + random() * 6;
      animal.targetX = clamp(animal.x + (random() - .5) * 15, -WORLD_RADIUS + 2, WORLD_RADIUS - 2);
      animal.targetZ = clamp(animal.z + (random() - .5) * 15, -WORLD_RADIUS + 2, WORLD_RADIUS - 2);
    }
    const dx = animal.targetX - animal.x, dz = animal.targetZ - animal.z;
    const length = Math.hypot(dx, dz);
    if (length > 0.05) {
      const speed = animal.state === 'flee' ? 3.4 : animal.speed;
      const move = Math.min(length, speed * dt);
      animal.x += dx / length * move; animal.z += dz / length * move;
      animal.direction = Math.atan2(dx, -dz);
    }
    animal.x = clamp(animal.x, -WORLD_RADIUS + 1, WORLD_RADIUS - 1);
    animal.z = clamp(animal.z, -WORLD_RADIUS + 1, WORLD_RADIUS - 1);
    animal.y = heightAt(animal.x, animal.z) + 0.5;
  }
  refreshActorBuffer();
}
function updatePlayer(dt) {
  if (!gameStarted || (!pointerLocked && !matchMedia('(pointer: coarse)').matches)) return;
  const forward = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) + (-virtualMove.y);
  const strafe = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + virtualMove.x;
  const isMoving = Math.hypot(forward, strafe) > 0.01;
  const wantsRun = (keys.ShiftLeft || keys.ShiftRight) && player.energy > 4 && !player.swimming;
  let speed = player.swimming ? 3.2 : wantsRun ? 8.7 : 5.6;
  if (wantsRun && isMoving) player.energy = Math.max(0, player.energy - dt * 24);
  else player.energy = Math.min(100, player.energy + dt * 14);
  if (isMoving) {
    const length = Math.hypot(forward, strafe) || 1;
    const f = forward / length, s = strafe / length;
    const dx = Math.sin(yaw) * f + Math.cos(yaw) * s;
    const dz = -Math.cos(yaw) * f + Math.sin(yaw) * s;
    const nx = clamp(player.x + dx * speed * dt, -WORLD_RADIUS + 1, WORLD_RADIUS - 1);
    const nz = clamp(player.z + dz * speed * dt, -WORLD_RADIUS + 1, WORLD_RADIUS - 1);
    if (!isSolidAt(Math.round(nx), Math.round(player.y - 1.55), Math.round(player.z))) player.x = nx;
    if (!isSolidAt(Math.round(player.x), Math.round(player.y - 1.55), Math.round(nz))) player.z = nz;
    player.step += dt * (wantsRun ? 14 : 9);
  }
  const ground = heightAt(player.x, player.z) + 2.15;
  player.swimming = heightAt(player.x, player.z) + 0.5 < SEA_LEVEL;
  if (player.swimming) {
    if (keys.Space) player.vy = Math.min(player.vy + dt * 8, 3.0);
    if (keys.ShiftLeft || keys.ShiftRight) player.vy = Math.max(player.vy - dt * 7, -2.8);
    player.vy -= dt * 4.6;
    player.vy *= Math.max(0.82, 1 - dt * 1.5);
    player.y += player.vy * dt;
    player.y = clamp(player.y, SEA_LEVEL + 0.35, SEA_LEVEL + 2.8);
    if (!keys.Space && player.y > SEA_LEVEL + 1.8) player.y -= dt * 1.6;
  } else {
    if (keys.Space && player.grounded) { player.vy = 7.2; player.grounded = false; }
    player.vy -= dt * 19.5;
    player.y += player.vy * dt;
    if (player.y <= ground) { player.y = ground; player.vy = 0; player.grounded = true; }
  }
  const bob = isMoving && player.grounded ? Math.sin(player.step) * 0.045 : 0;
  if (thirdPerson) {
    const dir = getCameraDirection();
    cameraX = player.x - dir[0] * 4.5;
    cameraY = player.y + 1.1 - dir[1] * 1.8;
    cameraZ = player.z - dir[2] * 4.5;
  } else {
    cameraX = player.x; cameraY = player.y + bob; cameraZ = player.z;
  }
  shell.classList.toggle('is-underwater', player.swimming && player.y < SEA_LEVEL + 1.1);
  if (frameCounter % 9 === 0) updateHud();
}
function updateWeather(dt) {
  const weather = weatherIndex;
  if (weather !== 1) return;
  for (const drop of rainDrops) {
    drop.y -= dt * (13 + drop.speed);
    drop.x += dt * 1.7;
    if (drop.y < cameraY - 3) {
      drop.y = cameraY + 20 + random() * 6;
      drop.x = cameraX + (random() - .5) * 44;
      drop.z = cameraZ + (random() - .5) * 44;
    }
  }
}
function createRain() {
  rainDrops = [];
  for (let i = 0; i < 220; i++) {
    rainDrops.push({ x: (random() - .5) * 42, y: 8 + random() * 25, z: (random() - .5) * 42, speed: random() * 7 });
  }
}
function makePointData() {
  const list = [];
  const now = worldTime * Math.PI * 2;
  const sunHeight = Math.sin(now - Math.PI / 2);
  const night = clamp(1 - (sunHeight + .12) / .28, 0, 1);
  if (night > .03) {
    for (const mote of fireflies) {
      const phase = now * .18 + mote.phase;
      list.push(mote.x + Math.cos(phase) * mote.radius, mote.y + Math.sin(phase * 1.3) * .38, mote.z + Math.sin(phase) * mote.radius,
        mote.color[0], mote.color[1], mote.color[2], 5.5, 0);
    }
  }
  if (weatherIndex === 1) {
    for (const drop of rainDrops) list.push(drop.x, drop.y, drop.z, .45, .66, .72, 5.0, 1);
  }
  return { data: new Float32Array(list), count: list.length / 8, night };
}
function updateLocationAndQuest() {
  const biome = biomeInfoAt(player.x, player.z);
  if (biome.id !== lastBiomeId) {
    lastBiomeId = biome.id;
    if (!questRegions.has(biome.id)) {
      questRegions.add(biome.id);
      showToast(`REGIÃO MAPEADA · ${biome.name}`);
      updateQuest();
    }
  }
}

function updateEnvironmentUniforms(view, projection, invView, invProjection, time, sunDirection) {
  const sunHeight = sunDirection[1];
  const night = clamp(1 - (sunHeight + 0.13) / 0.34, 0, 1);
  const dayStrength = clamp((sunHeight + 0.14) * 1.25, 0.04, 1);
  const twilight = Math.exp(-Math.abs(sunHeight) * 12) * (1 - night * .55);
  const dayTop = [0.13, 0.27, 0.30], nightTop = [0.025, 0.075, 0.10];
  const dayHorizon = [0.53, 0.64, 0.57], nightHorizon = [0.075, 0.14, 0.17];
  const top = dayTop.map((value, i) => mix(nightTop[i], value, 1 - night));
  let horizon = dayHorizon.map((value, i) => mix(nightHorizon[i], value, 1 - night));
  const dusk = [0.68, 0.39, 0.26];
  horizon = horizon.map((value, i) => mix(value, dusk[i], twilight * 0.65));
  const fogColor = weatherIndex === 2 ? [0.39, 0.55, 0.53] : horizon;
  const sunColor = [1.0, mix(.79, .92, dayStrength), mix(.55, .78, dayStrength)];
  const weatherSky = weatherIndex === 1 ? .28 : weatherIndex === 2 ? .85 : weatherIndex === 3 ? 1 : 0;
  gl.useProgram(skyProgram);
  gl.uniformMatrix4fv(skyUniforms.uInvProjection, false, invProjection);
  gl.uniformMatrix4fv(skyUniforms.uInvView, false, invView);
  gl.uniform3fv(skyUniforms.uSkyTop, top);
  gl.uniform3fv(skyUniforms.uSkyHorizon, horizon);
  gl.uniform3fv(skyUniforms.uSunDirection, sunDirection);
  gl.uniform3fv(skyUniforms.uSunColor, sunColor);
  gl.uniform1f(skyUniforms.uNight, night);
  gl.uniform1f(skyUniforms.uTwilight, twilight);
  gl.uniform1f(skyUniforms.uWeather, weatherSky);
  gl.uniform1f(skyUniforms.uTime, time);
  gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
  gl.bindVertexArray(skyVao);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindVertexArray(null);
  gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
  gl.clear(gl.DEPTH_BUFFER_BIT);

  const fogDensity = weatherIndex === 1 ? 0.005 : weatherIndex === 2 ? 0.0095 : 0.0044;
  const sunStrength = dayStrength * (weatherIndex === 1 ? .68 : weatherIndex === 2 ? .78 : 1);
  gl.useProgram(waterProgram);
  gl.uniformMatrix4fv(waterUniforms.uView, false, view);
  gl.uniformMatrix4fv(waterUniforms.uProjection, false, projection);
  gl.uniform1f(waterUniforms.uTime, time);
  gl.uniform3f(waterUniforms.uEye, cameraX, cameraY, cameraZ);
  gl.uniform3fv(waterUniforms.uSunDirection, sunDirection);
  gl.uniform3fv(waterUniforms.uSkyColor, horizon);
  gl.uniform3fv(waterUniforms.uFogColor, fogColor);
  gl.uniform1f(waterUniforms.uFogDensity, fogDensity);
  gl.uniform1f(waterUniforms.uSunStrength, sunStrength);
  gl.uniform1f(waterUniforms.uWeather, weatherIndex === 1 ? .9 : weatherIndex === 2 ? .55 : 0);
  gl.bindVertexArray(waterVao);
  gl.drawElements(gl.TRIANGLES, waterIndexCount, gl.UNSIGNED_INT, 0);

  gl.useProgram(cubeProgram);
  gl.uniformMatrix4fv(cubeUniforms.uView, false, view);
  gl.uniformMatrix4fv(cubeUniforms.uProjection, false, projection);
  gl.uniform1f(cubeUniforms.uTime, time);
  gl.uniform1f(cubeUniforms.uWind, windStrength + (weatherIndex === 1 ? .8 : 0));
  gl.uniform3fv(cubeUniforms.uSunDirection, sunDirection);
  gl.uniform3fv(cubeUniforms.uSunColor, sunColor);
  gl.uniform3fv(cubeUniforms.uFogColor, fogColor);
  gl.uniform3f(cubeUniforms.uEye, cameraX, cameraY, cameraZ);
  gl.uniform1f(cubeUniforms.uAmbient, .33 + dayStrength * .27 + night * .035);
  gl.uniform1f(cubeUniforms.uSunStrength, sunStrength);
  gl.uniform1f(cubeUniforms.uFogDensity, fogDensity);
  gl.uniform1f(cubeUniforms.uNight, night);
  gl.depthMask(true); gl.disable(gl.BLEND);
  gl.bindVertexArray(cubeVao);
  gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, renderCount);
  if (animals.instanceCount) {
    gl.bindVertexArray(actorVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, actorInstanceBuffer);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, animals.instanceCount);
  }
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);
  if (treeShadows.length && sunHeight > -0.12) {
    gl.useProgram(shadowProgram);
    gl.uniformMatrix4fv(shadowUniforms.uView, false, view);
    gl.uniformMatrix4fv(shadowUniforms.uProjection, false, projection);
    gl.uniform2f(shadowUniforms.uSunXZ, sunDirection[0], sunDirection[2]);
    gl.uniform1f(shadowUniforms.uOpacity, .22 * dayStrength);
    gl.bindVertexArray(shadowVao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, treeShadows.length);
  }
  const pointData = makePointData();
  if (pointData.count) {
    gl.useProgram(pointProgram);
    gl.uniformMatrix4fv(pointUniforms.uView, false, view);
    gl.uniformMatrix4fv(pointUniforms.uProjection, false, projection);
    gl.uniform3f(pointUniforms.uEye, cameraX, cameraY, cameraZ);
    gl.uniform1f(pointUniforms.uPixelRatio, Math.min(devicePixelRatio || 1, 1.8));
    gl.uniform1f(pointUniforms.uNight, pointData.night);
    gl.uniform1f(pointUniforms.uRain, weatherIndex === 1 ? 1 : 0);
    gl.bindVertexArray(pointVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pointData.data, gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.POINTS, 0, pointData.count);
  }
  gl.depthMask(true);
  gl.enable(gl.BLEND);
  gl.bindVertexArray(null);
}
function render(timeSeconds) {
  if (!gl) return;
  resize();
  const direction = getCameraDirection();
  let target;
  if (thirdPerson) target = [player.x, player.y + 0.55, player.z];
  else target = [cameraX + direction[0], cameraY + direction[1], cameraZ + direction[2]];
  const eye = [cameraX, cameraY, cameraZ];
  const view = mat4LookAt(eye, target);
  const projection = mat4Perspective(Math.PI / 2.86, canvas.width / canvas.height, 0.12, 320);
  const invView = mat4Invert(view), invProjection = mat4Invert(projection);
  const angle = worldTime * Math.PI * 2 - Math.PI / 2;
  const rawSun = [Math.cos(angle) * .48, Math.sin(angle), -.58];
  const sunLength = Math.hypot(...rawSun);
  const sunDirection = rawSun.map(value => value / sunLength);
  updateEnvironmentUniforms(view, projection, invView, invProjection, timeSeconds, sunDirection);
}

function animate(timestamp) {
  requestAnimationFrame(animate);
  if (!lastFrame) lastFrame = timestamp;
  const dt = Math.min((timestamp - lastFrame) / 1000, 0.05);
  lastFrame = timestamp;
  frameCounter++;
  worldTime = (worldTime + dt * timeScale / 520) % 1;
  $('#clockLabel').textContent = formatWorldTime();
  updatePlayer(dt);
  if (frameCounter % 3 === 0) updateAnimals(dt * 3);
  updateWeather(dt);
  render(timestamp / 1000);
  if (frameCounter % 90 === 0 && mapDirty && currentPanel === 'mapOverlay') drawMap();
}

function toggleCinematic() {
  cinematic = !cinematic;
  shell.classList.toggle('cinematic', cinematic);
  $('#cinemaToggle').setAttribute('aria-pressed', cinematic ? 'true' : 'false');
  showToast(cinematic ? 'Modo contemplativo · C para mostrar a interface' : 'Interface de expedição restaurada');
}
function cycleWeather() {
  weatherIndex = (weatherIndex + 1) % weatherNames.length;
  updateWeatherUi();
  if (weatherIndex === 1 && rainDrops.length === 0) createRain();
  showToast(`CLIMA ATUALIZADO · ${weatherNames[weatherIndex]}`);
}
function advanceTime() {
  worldTime = (worldTime + 0.17) % 1;
  $('#clockLabel').textContent = formatWorldTime();
  showToast(`HORÁRIO AVANÇADO · ${formatWorldTime()}`);
}
function regenerateWorld() {
  if (pointerLocked && document.exitPointerLock) document.exitPointerLock();
  gameStarted = false; shell.classList.remove('is-playing');
  $('#introPanel').removeAttribute('aria-hidden');
  if (currentPanel) { $(`#${currentPanel}`).classList.remove('visible'); currentPanel = null; }
  generateWorld(makeSeed());
}
function setNewWorldFromMenu() {
  regenerateWorld();
}
function interact() {
  if (!landmarkPosition) return;
  const distance = Math.hypot(player.x - landmarkPosition.x, player.z - landmarkPosition.z);
  if (distance < 4.8) showToast('O marco pulsa em resposta à sua presença. Um mapa antigo desperta.');
  else showToast('Nada responde por perto. Siga os rastros entre as árvores.');
}
function updateInteractionPrompt() {
  if (!landmarkPosition || !gameStarted) return;
  const distance = Math.hypot(player.x - landmarkPosition.x, player.z - landmarkPosition.z);
  $('#interactionPrompt').classList.toggle('visible', distance < 5);
}
function handleKeyDown(event) {
  const target = event.target;
  if (target && ['INPUT','TEXTAREA','SELECT'].includes(target.tagName)) return;
  if (event.code === 'Escape') {
    if (currentPanel) { closePanel(); event.preventDefault(); return; }
    if (pointerLocked && document.exitPointerLock) { document.exitPointerLock(); event.preventDefault(); return; }
  }
  if (event.code.startsWith('Arrow') || event.code === 'Space') event.preventDefault();
  keys[event.code] = true;
  if (event.repeat) return;
  if (event.code.startsWith('Digit')) {
    const digit = Number(event.code.slice(5)); if (digit >= 1 && digit <= 6) selectSlot(digit - 1);
  }
  if (event.code === 'KeyE') openPanel('inventoryOverlay');
  if (event.code === 'KeyM') openPanel('mapOverlay');
  if (event.code === 'KeyC') toggleCinematic();
  if (event.code === 'KeyV') { thirdPerson = !thirdPerson; showToast(thirdPerson ? 'Câmera em terceira pessoa' : 'Câmera em primeira pessoa'); }
  if (event.code === 'KeyF') interact();
}
function handleKeyUp(event) { keys[event.code] = false; }
function onPointerLockChange() {
  pointerLocked = document.pointerLockElement === canvas;
  shell.classList.toggle('is-playing', pointerLocked || (gameStarted && matchMedia('(pointer: coarse)').matches));
  if (pointerLocked) { setPauseVisible(false); $('#introPanel').setAttribute('aria-hidden','true'); }
  else if (gameStarted && !currentPanel && !matchMedia('(pointer: coarse)').matches) setPauseVisible(true);
}
function onMouseMove(event) {
  if (pointerLocked) {
    yaw -= event.movementX * 0.0023 * sensitivity;
    pitch = clamp(pitch - event.movementY * 0.0021 * sensitivity, -1.38, 1.38);
    return;
  }
  if (mobileDrag) {
    const dx = event.clientX - mobileDrag.x, dy = event.clientY - mobileDrag.y;
    yaw -= dx * 0.006 * sensitivity;
    pitch = clamp(pitch - dy * 0.005 * sensitivity, -1.25, 1.25);
    mobileDrag.x = event.clientX; mobileDrag.y = event.clientY;
  }
}
function setupTouchControls() {
  if (!matchMedia('(pointer: coarse)').matches) return;
  const root = document.createElement('div');
  root.className = 'touch-controls';
  root.innerHTML = `<div class="touch-stick" id="touchStick"><i></i><span></span></div><button class="touch-action touch-mine" id="touchMine" type="button" aria-label="Escavar">⌕<small>MINERAR</small></button><button class="touch-action touch-build" id="touchBuild" type="button" aria-label="Construir">▧<small>COLOCAR</small></button><button class="touch-jump" id="touchJump" type="button">↑<small>PULAR</small></button>`;
  shell.appendChild(root);
  const stick = $('#touchStick');
  const knob = $('span', stick);
  stick.addEventListener('pointerdown', event => { event.preventDefault(); stick.setPointerCapture(event.pointerId); stick.dataset.active = '1'; });
  stick.addEventListener('pointermove', event => {
    if (stick.dataset.active !== '1') return;
    const rect = stick.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width/2), dy = event.clientY - (rect.top + rect.height/2);
    const magnitude = Math.min(30, Math.hypot(dx,dy));
    const angle = Math.atan2(dy, dx);
    const x = Math.cos(angle) * magnitude, y = Math.sin(angle) * magnitude;
    knob.style.transform = `translate(${x}px, ${y}px)`;
    virtualMove.x = x / 30; virtualMove.y = y / 30;
  });
  const release = () => { stick.dataset.active = '0'; knob.style.transform = ''; virtualMove = { x: 0, y: 0 }; };
  stick.addEventListener('pointerup', release); stick.addEventListener('pointercancel', release);
  const jump = $('#touchJump');
  jump.addEventListener('pointerdown', event => { event.preventDefault(); keys.Space = true; });
  jump.addEventListener('pointerup', () => { keys.Space = false; });
  jump.addEventListener('pointercancel', () => { keys.Space = false; });
  $('#touchMine').addEventListener('pointerdown', event => { event.preventDefault(); handleMine(); });
  $('#touchBuild').addEventListener('pointerdown', event => { event.preventDefault(); handlePlace(); });
  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' && !event.target.closest('.touch-controls')) {
      mobileDrag = { x: event.clientX, y: event.clientY };
      try { canvas.setPointerCapture(event.pointerId); } catch (_) { /* touch may leave the canvas */ }
    }
  });
  canvas.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch' || !mobileDrag) return;
    const dx = event.clientX - mobileDrag.x, dy = event.clientY - mobileDrag.y;
    yaw -= dx * 0.006 * sensitivity;
    pitch = clamp(pitch - dy * 0.005 * sensitivity, -1.25, 1.25);
    mobileDrag.x = event.clientX; mobileDrag.y = event.clientY;
  });
  canvas.addEventListener('pointerup', () => { mobileDrag = null; });
  canvas.addEventListener('pointercancel', () => { mobileDrag = null; });
}
function initUi() {
  $('#enterWorldButton').addEventListener('click', startExpedition);
  $('#resumeButton').addEventListener('click', requestLock);
  $('#newWorldButton').addEventListener('click', setNewWorldFromMenu);
  $('#clockButton').addEventListener('click', advanceTime);
  $('#weatherButton').addEventListener('click', cycleWeather);
  $('#settingsButton').addEventListener('click', () => openPanel('settingsOverlay'));
  $('#mapButton').addEventListener('click', () => openPanel('mapOverlay'));
  $('#pauseMapButton').addEventListener('click', () => { setPauseVisible(false); openPanel('mapOverlay'); });
  $('#inventoryButton').addEventListener('click', () => openPanel('inventoryOverlay'));
  $('#cinematicButton').addEventListener('click', toggleCinematic);
  $('#cinemaToggle').addEventListener('click', toggleCinematic);
  $('#questCollapse').addEventListener('click', () => $('#questCard').classList.toggle('is-collapsed'));
  $('#craftButton').addEventListener('click', () => {
    if (inventory.wood < 3 || inventory.stone < 2) return;
    inventory.wood -= 3; inventory.stone -= 2; inventory.amber += 1;
    renderHotbar(); renderInventory(); showToast('Farol de âmbar criado · selecione no atalho 4');
  });
  $('#qualitySelect').addEventListener('change', event => {
    qualityScale = Number(event.target.value) || 1;
    settingsSaved = true; resize();
  });
  $('#sensitivitySlider').addEventListener('input', event => { sensitivity = Number(event.target.value) || 1; });
  $$('[data-close]').forEach(button => button.addEventListener('click', () => closePanel()));
  $$('.modal-backdrop').forEach(backdrop => backdrop.addEventListener('click', event => {
    if (event.target === backdrop) closePanel();
  }));
  $('#worldCanvas').addEventListener('mousedown', event => {
    if (!pointerLocked || currentPanel) return;
    if (event.button === 0) handleMine();
    if (event.button === 2) handlePlace();
  });
  $('#worldCanvas').addEventListener('contextmenu', event => event.preventDefault());
  $('#worldCanvas').addEventListener('mousemove', onMouseMove);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  window.addEventListener('resize', resize);
  setupTouchControls();
}

function drawFallback() {
  const context = canvas.getContext('2d');
  if (!context) return;
  const paint = () => {
    canvas.width = innerWidth * (devicePixelRatio || 1); canvas.height = innerHeight * (devicePixelRatio || 1);
    const ctx = context; ctx.scale(devicePixelRatio || 1, devicePixelRatio || 1);
    const w = innerWidth, h = innerHeight;
    const sky = ctx.createLinearGradient(0,0,0,h); sky.addColorStop(0,'#26555a'); sky.addColorStop(.55,'#b3c7a3'); sky.addColorStop(1,'#667c5c');
    ctx.fillStyle = sky; ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#f4dda0'; ctx.beginPath(); ctx.arc(w*.72,h*.25,48,0,Math.PI*2); ctx.fill();
    for(let layer=0;layer<3;layer++){
      const base=h*(.60+layer*.13); ctx.fillStyle=['#698a70','#4b715b','#315448'][layer];
      ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(0,base);
      for(let x=0;x<=w+60;x+=30){const n=Math.sin(x*.012+layer*3)*28+Math.cos(x*.025+layer)*18;ctx.lineTo(x,base+n)}
      ctx.lineTo(w,h);ctx.closePath();ctx.fill();
    }
  };
  paint(); window.addEventListener('resize',paint);
  $('#loadingStatus').textContent='RENDERIZAÇÃO 3D INDISPONÍVEL NESTE NAVEGADOR';
  $('#loadingTitle')?.remove();
  setTimeout(() => loading.classList.add('done'), 1200);
}

function boot() {
  initUi();
  if (!setupGraphics()) { drawFallback(); return; }
  worldSeed = getInitialSeed();
  try { generateWorld(worldSeed, true); }
  catch (error) {
    console.error(error);
    $('#loadingStatus').textContent = 'ALGO INTERROMPEU A GERAÇÃO — ATUALIZE PARA TENTAR NOVAMENTE';
    setTimeout(() => loading.classList.add('done'), 1800);
  }
  createRain();
  requestAnimationFrame(animate);
  setInterval(updateInteractionPrompt, 180);
}

boot();
