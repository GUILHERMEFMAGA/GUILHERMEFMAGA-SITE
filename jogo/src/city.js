// ============================================================
//  CIDADE procedural: prédios (shader triplanar), ruas molhadas,
//  calçadas, postes, neons, pedestres, parques e marcadores
// ============================================================
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CFG, QUALITY, mulberry32, clamp } from './config.js';
import {
  makeFacades, makeRoadTexture, makeRippleNormal, makeAsphaltRoughness,
  makeSignTexture, SIGN_COLORS,
} from './textures.js';
import { makeGlowPoints } from './util.js';

const D = new THREE.Vector3();

// ------------------------------------------------------------
//  SHADER DOS PRÉDIOS (triplanar + janelas acesas + vidro)
// ------------------------------------------------------------
const B_VERT = /* glsl */`
attribute vec4  aPar;    // xyz = centro do prédio (mundo) , w = altura
attribute float aVar;    // qual fachada usar (0..3)
attribute float aLit;    // chance de janela acesa
attribute vec3  aTint;   // cor da parede
attribute vec3  aTint2;  // cor da cobertura
varying vec3  vN;
varying vec3  vW;
varying float vVar, vLit, vH;
varying vec3  vTint, vTint2, vOff;
void main() {
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vW    = wp.xyz;
  vN    = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vVar  = aVar;  vLit = aLit;  vH = aPar.w;
  vTint = aTint; vTint2 = aTint2; vOff = aPar.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const B_FRAG = /* glsl */`
precision highp float;
uniform sampler2D uF0, uF1, uF2, uF3;
uniform vec3  uFogColor;
uniform vec3  uSunDir, uSunColor;
uniform float uSunI, uAmbI;
uniform float uFogDensity, uNight, uTime, uBright;
varying vec3  vN;  varying vec3  vW;
varying float vVar, vLit, vH;
varying vec3  vTint, vTint2, vOff;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

vec3 triMask(vec3 p, vec3 n, float s, int v){
  vec3 w = pow(abs(n), vec3(4.0));
  w /= (w.x + w.y + w.z + 1e-5);
  vec2 uvp = p.xy * s + vOff.xy * 0.11;
  vec2 uvz = p.zy * s + vOff.zy * 0.11;
  vec2 uvx = p.xz * s + vOff.xz * 0.11;
  float m = 0.0;
  if (v == 0)      m = texture2D(uF0, uvz).r * w.x + texture2D(uF0, uvx).r * w.y + texture2D(uF0, uvp).r * w.z;
  else if (v == 1) m = texture2D(uF1, uvz).r * w.x + texture2D(uF1, uvx).r * w.y + texture2D(uF1, uvp).r * w.z;
  else if (v == 2) m = texture2D(uF2, uvz).r * w.x + texture2D(uF2, uvx).r * w.y + texture2D(uF2, uvp).r * w.z;
  else             m = texture2D(uF3, uvz).r * w.x + texture2D(uF3, uvx).r * w.y + texture2D(uF3, uvp).r * w.z;
  return vec3(m);
}

void main(){
  vec3 n = normalize(vN);
  float s = 0.26;

  float wallN = hash(floor(vW.xz * 0.06) + vOff.xz * 0.013);
  vec3 col;

  if (n.y > 0.55) {
    // ---------- cobertura ----------
    float g = hash(floor(vW.xz * 1.6));
    col = vTint2 * (0.70 + 0.42 * g);
    // cascalho / manta asfáltica
    col *= 0.86 + 0.18 * hash(floor(vW.xz * 22.0));
    // iluminação simples: sol direcional + céu ambiente (dá volume às caixas)
    float ndl = max(dot(n, normalize(uSunDir)), 0.0);
    vec3 amb = mix(vec3(0.30, 0.27, 0.25), vec3(0.62, 0.66, 0.75), n.y * 0.5 + 0.5);
    col *= (amb * uAmbI + uSunColor * uSunI * (0.28 + 0.85 * ndl));
  } else {
    // ---------- fachada ----------
    float mask = clamp(triMask(vW, n, s, int(vVar + 0.5)).r, 0.0, 1.0);

    vec2 cell = floor((n.y > 0.5 ? vW.xz : (abs(n.x) > abs(n.z) ? vW.zy : vW.xy)) * s);
    float r1 = hash(cell + vOff.xz * 0.31 + vVar * 7.7);
    float r2 = hash(cell * 1.7 - vOff.zx * 0.17 + vVar * 3.1);

    // vidro apaga reflexo do céu durante o dia
    float refl = 0.28 + 0.5 * pow(clamp(n.y * 0.55 + 0.5, 0.0, 1.0), 1.6);
    vec3 glassDay = mix(vec3(0.085, 0.105, 0.135), vec3(0.62, 0.47, 0.33), refl);

    float lit = step(1.0 - vLit, r1) * step(0.22, r2);
    float flick = 0.88 + 0.12 * sin(uTime * (0.5 + r2 * 2.2) + r1 * 40.0);
    vec3 warm = mix(vec3(1.0, 0.66, 0.30), vec3(1.0, 0.88, 0.64), r2);
    vec3 cool = mix(vec3(0.55, 0.82, 1.0), vec3(0.86, 0.94, 1.0), r2);
    vec3 emit = mix(warm, cool, step(0.86, r1)) * (1.15 + 1.5 * r2) * flick;

    // albedo recebe luz do sol/ambiente; janelas acesas são emissivas (não apagam à noite)
    float litAmt = clamp(uNight * lit, 0.0, 1.0);
    vec3 baseCol = mix(vTint * (0.84 + 0.3 * wallN), glassDay, mask);
    vec3 emisCol = emit * litAmt * mask;
    float ndl2 = max(dot(n, normalize(uSunDir)), 0.0);
    vec3 amb2 = mix(vec3(0.30, 0.27, 0.25), vec3(0.62, 0.66, 0.75), n.y * 0.5 + 0.5);
    col = baseCol * (amb2 * uAmbI + uSunColor * uSunI * (0.26 + 0.9 * ndl2)) + emisCol;

    // térreo mais escuro (lojas/sombra da rua)
    float ground = 1.0 - smoothstep(0.0, 15.0, vW.y);
    col *= (1.0 - 0.30 * ground);
    // vitrines acesas no nível da rua
    col += vec3(1.0, 0.72, 0.42) * ground * uNight * 0.30 * step(0.45, mask);
    // sujeira e claridade atmosférica conforme a altura
    float hh = vW.y / max(vH, 1.0);
    col *= 0.94 + 0.10 * hh;
    col *= 1.0 - 0.10 * hash(floor(vW.xy * 0.25) + vVar);
  }

  // ---------- névoa exponencial ----------
  float depth = length(vW - cameraPosition);
  float f = 1.0 - exp(-uFogDensity * uFogDensity * depth * depth);
  col = mix(col, uFogColor, clamp(f, 0.0, 1.0));
  col *= uBright;

  // (o tone mapping é aplicado no OutputPass, junto com o resto da cena)
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;

// ------------------------------------------------------------
//  paletas de fachada
// ------------------------------------------------------------
const WALLS = [
  [0x8b8b86, 0x6e6f72], [0x7d7469, 0x5d564e], [0x9a9389, 0x726a61],
  [0x5f6672, 0x474d57], [0x8d7f70, 0x655b50], [0xa9a49b, 0x7d7a74],
  [0x6b5d55, 0x4e443e], [0x77808c, 0x565e68],
];

export function buildCity(scene, renderer, q, seed = 20261002) {
  const rnd = mulberry32(seed);
  const m4 = new THREE.Matrix4();
  const tq = new THREE.Quaternion();
  const tv1 = new THREE.Vector3();
  const tv2 = new THREE.Vector3();
  const upY = new THREE.Vector3(0, 1, 0);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const city = {
    colliders: [],        // AABBs de prédios {minX,maxX,minZ,maxZ}
    lanes: [],            // faixas de tráfego p/ IA
    coinSpots: [],        // posições de fichas
    markers: null,        // grupo de marcadores de missão
    pedSpots: [],
    update: null,
  };

  // ============================ CHÃO ============================
  const ripple = makeRippleNormal();
  const rough = makeAsphaltRoughness();

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0a0b0e, roughness: 1, metalness: 0,
  });
  const far = new THREE.Mesh(new THREE.PlaneGeometry(24000, 24000), groundMat);
  far.rotation.x = -Math.PI / 2; far.position.y = -0.6; far.receiveShadow = q.shadow > 0;
  scene.add(far);

  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x101114, roughness: 0.46, metalness: 0.10,
    roughnessMap: rough, normalMap: ripple,
    normalScale: new THREE.Vector2(0.10, 0.10),
    envMapIntensity: 0.85,
  });
  const roadSize = CFG.HALF * 2;
  const road = new THREE.Mesh(new THREE.PlaneGeometry(roadSize, roadSize), roadMat);
  road.rotation.x = -Math.PI / 2; road.position.y = 0; road.receiveShadow = q.shadow > 0;
  scene.add(road);

  // marcas viárias (mesma textura vira alphaMap)
  const markTex = makeRoadTexture();
  const markMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, map: markTex, alphaMap: markTex, transparent: true,
    roughness: 0.52, metalness: 0.04, depthWrite: false, envMapIntensity: 0.9,
  });
  const marks = new THREE.Mesh(new THREE.PlaneGeometry(roadSize, roadSize), markMat);
  marks.rotation.x = -Math.PI / 2; marks.position.y = 0.035; marks.renderOrder = 2;
  scene.add(marks);

  // ======================= QUARTEIRÕES =========================
  const inner = CFG.SPACING / 2 - CFG.ROAD_HALF;   // meia-largura útil do quarteirão
  const lotHalf = inner - CFG.SIDEWALK;

  // --- calçadas (4 anéis por quarteirão, tudo num mesh só) ---
  const swParts = [];
  const swGeo = new THREE.BoxGeometry(1, 1, 1);
  function pushBox(list, cx, cy, cz, sx, sy, sz) {
    const g = swGeo.clone();
    g.applyMatrix4(new THREE.Matrix4().makeScale(sx, sy, sz));
    g.translate(cx, cy, cz);
    list.push(g);
  }
  const blocks = [];
  for (let i = 0; i < CFG.BLOCKS; i++) {
    for (let j = 0; j < CFG.BLOCKS; j++) {
      const cx = -CFG.SPAN / 2 + CFG.SPACING / 2 + i * CFG.SPACING;
      const cz = -CFG.SPAN / 2 + CFG.SPACING / 2 + j * CFG.SPACING;
      blocks.push({ cx, cz, i, j });
      const t = CFG.SIDEWALK;
      pushBox(swParts, cx, 0.09, cz - inner + t / 2, inner * 2, 0.18, t);
      pushBox(swParts, cx, 0.09, cz + inner - t / 2, inner * 2, 0.18, t);
      pushBox(swParts, cx - inner + t / 2, 0.09, cz, t, 0.18, inner * 2 - t * 2);
      pushBox(swParts, cx + inner - t / 2, 0.09, cz, t, 0.18, inner * 2 - t * 2);
      // meio-fio
      const curb = 0.34;
      pushBox(swParts, cx, 0.12, cz - inner + curb / 2, inner * 2, 0.24, curb);
      pushBox(swParts, cx, 0.12, cz + inner - curb / 2, inner * 2, 0.24, curb);
      pushBox(swParts, cx - inner + curb / 2, 0.12, cz, curb, 0.24, inner * 2);
      pushBox(swParts, cx + inner - curb / 2, 0.12, cz, curb, 0.24, inner * 2);
    }
  }
  const swMat = new THREE.MeshStandardMaterial({
    color: 0x6d6d68, roughness: 0.94, metalness: 0.02, envMapIntensity: 0.55,
  });
  const sidewalks = new THREE.Mesh(mergeGeometries(swParts, false), swMat);
  sidewalks.receiveShadow = q.shadow > 0;
  sidewalks.castShadow = false;
  scene.add(sidewalks);
  swParts.forEach(g => g.dispose());

  // --- parques (alguns quarteirões viram praça) ---
  const parkIdx = new Set();
  while (parkIdx.size < 4) parkIdx.add(Math.floor(rnd() * blocks.length));

  // ========================= PRÉDIOS ===========================
  const facades = makeFacades();
  facades.forEach(t => { t.anisotropy = Math.min(8, maxAniso); });

  const parts = [];          // caixas de prédio
  const roofParts = [];      // detalhes de cobertura
  const attrs = [];          // {center,h,varIdx,lit,tint,tint2}

  const antennaList = [];
  const waterList = [];

  function addTower(cx, cz, w, d, h, tier) {
    parts.push({ cx, cz, w, d, h });
    const A = {
      center: new THREE.Vector3(cx, h / 2, cz), h,
      varIdx: Math.floor(rnd() * 4),
      lit: 0.16 + rnd() * 0.5,
      tint: new THREE.Color(WALLS[Math.floor(rnd() * WALLS.length)][0]),
      tint2: new THREE.Color(WALLS[Math.floor(rnd() * WALLS.length)][1]),
    };
    A.tint.offsetHSL(0, (rnd() - 0.5) * 0.05, (rnd() - 0.5) * 0.12);
    attrs.push(A);

    // parapeito
    const pt = 0.9;
    pushBox(roofParts, cx, h + 0.55, cz - d / 2 + pt / 2, w, 1.1, pt);
    pushBox(roofParts, cx, h + 0.55, cz + d / 2 - pt / 2, w, 1.1, pt);
    pushBox(roofParts, cx - w / 2 + pt / 2, h + 0.55, cz, pt, 1.1, d - pt * 2);
    pushBox(roofParts, cx + w / 2 - pt / 2, h + 0.55, cz, pt, 1.1, d - pt * 2);
    // casa de máquinas
    if (rnd() < 0.8) {
      const mw = w * (0.2 + rnd() * 0.25), md = d * (0.2 + rnd() * 0.25);
      pushBox(roofParts, cx + (rnd() - 0.5) * (w - mw) * 0.6, h + 3.1,
        cz + (rnd() - 0.5) * (d - md) * 0.6, mw, 6.2, md);
    }
    // antena + baliza
    if (h > 55 && rnd() < 0.55) {
      antennaList.push({ x: cx + (rnd() - 0.5) * w * 0.4, y: h, z: cz + (rnd() - 0.5) * d * 0.4, hh: 8 + rnd() * 22 });
    }
    // caixa d'água
    if (h < 70 && rnd() < 0.3) {
      waterList.push({ x: cx + (rnd() - 0.5) * w * 0.5, y: h + 1.1, z: cz + (rnd() - 0.5) * d * 0.5 });
    }
    void tier;
  }

  for (let bi = 0; bi < blocks.length; bi++) {
    const b = blocks[bi];
    if (parkIdx.has(bi)) continue;

    const dc = Math.hypot(b.cx, b.cz) / (CFG.SPAN / 2);
    const downtown = clamp(1.15 - dc, 0.05, 1);

    // subdivisão do lote (guilhotina)
    let lots = [{ x0: -lotHalf, x1: lotHalf, z0: -lotHalf, z1: lotHalf }];
    // mais subdivisões no centro => cidade adensada e skyline variado
    const splits = downtown > 0.55 ? 3 : downtown > 0.25 ? 2 : (rnd() < 0.5 ? 2 : 1);
    for (let s = 0; s < splits; s++) {
      const next = [];
      for (const l of lots) {
        const w = l.x1 - l.x0, d = l.z1 - l.z0;
        if (w > 88 && (d < 70 || rnd() < 0.5)) {
          const t = l.x0 + w * (0.34 + rnd() * 0.32);
          next.push({ x0: l.x0, x1: t, z0: l.z0, z1: l.z1 }, { x0: t, x1: l.x1, z0: l.z0, z1: l.z1 });
        } else if (d > 88) {
          const t = l.z0 + d * (0.34 + rnd() * 0.32);
          next.push({ x0: l.x0, x1: l.x1, z0: l.z0, z1: t }, { x0: l.x0, x1: l.x1, z0: t, z1: l.z1 });
        } else next.push(l);
      }
      lots = next;
    }

    for (const l of lots) {
      const w0 = l.x1 - l.x0, d0 = l.z1 - l.z0;
      if (w0 < 14 || d0 < 14) continue;
      const r = rnd();
      if (r < 0.07) continue;                       // terreno vazio
      const shrink = 1.5 + rnd() * 4;
      const w = Math.max(12, w0 - shrink * 2);
      const d = Math.max(12, d0 - shrink * 2);
      const cx = b.cx + (l.x0 + l.x1) / 2 + (rnd() - 0.5) * 3;
      const cz = b.cz + (l.z0 + l.z1) / 2 + (rnd() - 0.5) * 3;

      const area = w * d;
      const tall = downtown > 0.6 && area > 5200 && rnd() < 0.22;
      let h = tall ? 92 + rnd() * 175
        : 11 + rnd() * (16 + downtown * 132);
      if (downtown > 0.82 && rnd() < 0.05) h = 210 + rnd() * 80;   // marco da cidade
      h = clamp(h, 9, 300);
      h = Math.min(h, 16 + area * 0.075);

      const footprint = { minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 };
      city.colliders.push(footprint);

      const style = rnd();
      if (style < 0.2 && h > 34) {                    // torre escalonada
        const h1 = h * 0.52;
        addTower(cx, cz, w, d, h1, 0);
        addTower(cx, cz, w * 0.7, d * 0.7, h, 1);
      } else if (style < 0.34 && h > 26 && w > 40 && d > 40) {  // pódio + torre
        addTower(cx, cz, w, d, Math.min(h * 0.34, 26), 0);
        addTower(cx + (rnd() - 0.5) * w * 0.2, cz + (rnd() - 0.5) * d * 0.2,
          w * 0.52, d * 0.52, h, 1);
      } else {
        addTower(cx, cz, w, d, h, 0);
      }

      // toldos / lojas no nível da rua
      if (rnd() < 0.55) {
        const aw = w * (0.3 + rnd() * 0.4);
        const side = Math.floor(rnd() * 4);
        const ax = side === 0 ? cx - w / 2 + 1.4 : side === 1 ? cx + w / 2 - 1.4 : cx + (rnd() - 0.5) * w * 0.5;
        const az = side === 2 ? cz - d / 2 + 1.4 : side === 3 ? cz + d / 2 - 1.4 : cz + (rnd() - 0.5) * d * 0.5;
        pushBox(roofParts, ax, 4.4, az, side < 2 ? 2.6 : aw, 0.3, side < 2 ? aw : 2.6);
      }
    }
  }

  // --- InstancedMesh dos prédios ---
  const count = parts.length;
  const box = new THREE.BoxGeometry(1, 1, 1);
  box.translate(0, 0.5, 0);
  const bMat = new THREE.ShaderMaterial({
    vertexShader: B_VERT, fragmentShader: B_FRAG,
    uniforms: {
      uF0: { value: facades[0] }, uF1: { value: facades[1] },
      uF2: { value: facades[2] }, uF3: { value: facades[3] },
      uFogColor: { value: new THREE.Color(0xd09060) },
      uFogDensity: { value: 0.00072 },
      uNight: { value: 0 }, uTime: { value: 0 }, uBright: { value: 1.0 },
      uSunDir: { value: new THREE.Vector3(0.4, 0.2, 0.9) },
      uSunColor: { value: new THREE.Color(1, 0.83, 0.63) },
      uSunI: { value: 1.0 }, uAmbI: { value: 0.55 },
    },
  });
  const bMesh = new THREE.InstancedMesh(box, bMat, count);
  bMesh.frustumCulled = false;
  bMesh.castShadow = q.shadow > 0;
  bMesh.receiveShadow = false;

  const aPar = new Float32Array(count * 4);
  const aVar = new Float32Array(count);
  const aLit = new Float32Array(count);
  const aTint = new Float32Array(count * 3);
  const aTint2 = new Float32Array(count * 3);
  for (let k = 0; k < count; k++) {
    const p = parts[k], A = attrs[k];
    m4.makeScale(p.w, p.h, p.d);
    m4.setPosition(p.cx, 0.18, p.cz);
    bMesh.setMatrixAt(k, m4);
    aPar.set([A.center.x, A.center.y, A.center.z, A.h], k * 4);
    aVar[k] = A.varIdx; aLit[k] = A.lit;
    aTint.set([A.tint.r, A.tint.g, A.tint.b], k * 3);
    aTint2.set([A.tint2.r, A.tint2.g, A.tint2.b], k * 3);
  }
  bMesh.geometry.setAttribute('aPar', new THREE.InstancedBufferAttribute(aPar, 4));
  bMesh.geometry.setAttribute('aVar', new THREE.InstancedBufferAttribute(aVar, 1));
  bMesh.geometry.setAttribute('aLit', new THREE.InstancedBufferAttribute(aLit, 1));
  bMesh.geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(aTint, 3));
  bMesh.geometry.setAttribute('aTint2', new THREE.InstancedBufferAttribute(aTint2, 3));
  bMesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 90, 0), CFG.HALF * 1.5);
  bMesh.customDepthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
  });
  scene.add(bMesh);

  // --- detalhes de cobertura ---
  if (roofParts.length) {
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x4b4b50, roughness: 0.86, metalness: 0.14, envMapIntensity: 0.7,
    });
    const roofMesh = new THREE.Mesh(mergeGeometries(roofParts, false), roofMat);
    roofMesh.castShadow = q.shadow > 0;
    roofMesh.receiveShadow = q.shadow > 0;
    scene.add(roofMesh);
    roofParts.forEach(g => g.dispose());
  }

  // --- antenas + balizas piscantes ---
  if (antennaList.length) {
    const ag = new THREE.CylinderGeometry(0.16, 0.4, 1, 5);
    ag.translate(0, 0.5, 0);
    const am = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.5, metalness: 0.85 });
    const aMesh = new THREE.InstancedMesh(ag, am, antennaList.length);
    antennaList.forEach((a, k) => {
      m4.makeScale(1, a.hh, 1); m4.setPosition(a.x, a.y, a.z);
      aMesh.setMatrixAt(k, m4);
    });
    aMesh.instanceMatrix.needsUpdate = true;
    aMesh.frustumCulled = false;
    scene.add(aMesh);

    const bg = new THREE.SphereGeometry(0.85, 8, 6);
    const bm = new THREE.MeshBasicMaterial({ color: 0xff3344, toneMapped: false, fog: true });
    const bMesh2 = new THREE.InstancedMesh(bg, bm, antennaList.length);
    antennaList.forEach((a, k) => {
      m4.identity(); m4.setPosition(a.x, a.y + a.hh, a.z);
      bMesh2.setMatrixAt(k, m4);
    });
    bMesh2.instanceMatrix.needsUpdate = true;
    bMesh2.frustumCulled = false;
    scene.add(bMesh2);
    city._beacons = bMesh2;
  }

  // --- caixas d'água ---
  if (waterList.length) {
    const wg = new THREE.CylinderGeometry(3.2, 3.2, 5.4, 12);
    const wm = new THREE.MeshStandardMaterial({ color: 0x7a6a55, roughness: 0.8, metalness: 0.2 });
    const wMesh = new THREE.InstancedMesh(wg, wm, waterList.length);
    waterList.forEach((a, k) => {
      m4.identity(); m4.setPosition(a.x, a.y + 4.4, a.z);
      wMesh.setMatrixAt(k, m4);
    });
    wMesh.instanceMatrix.needsUpdate = true;
    wMesh.castShadow = q.shadow > 0;
    scene.add(wMesh);
  }

  // ========================== PARQUES ===========================
  const treePos = [];
  const grassParts = [];
  for (const bi of parkIdx) {
    const b = blocks[bi];
    pushBox(grassParts, b.cx, 0.2, b.cz, lotHalf * 2, 0.22, lotHalf * 2);
    // caminhos
    pushBox(grassParts, b.cx, 0.32, b.cz, lotHalf * 2, 0.06, 7);
    pushBox(grassParts, b.cx, 0.32, b.cz, 7, 0.06, lotHalf * 2);
    for (let k = 0; k < 26; k++) {
      const a = rnd() * Math.PI * 2, r = 22 + rnd() * (lotHalf - 30);
      treePos.push({ x: b.cx + Math.cos(a) * r, z: b.cz + Math.sin(a) * r, s: 0.8 + rnd() * 0.7 });
    }
  }
  if (grassParts.length) {
    const gm = new THREE.MeshStandardMaterial({ color: 0x35502c, roughness: 1, metalness: 0 });
    const grass = new THREE.Mesh(mergeGeometries(grassParts, false), gm);
    grass.receiveShadow = q.shadow > 0;
    scene.add(grass);
    grassParts.forEach(g => g.dispose());
  }
  if (treePos.length) {
    const tg = new THREE.CylinderGeometry(0.35, 0.55, 1, 6); tg.translate(0, 0.5, 0);
    const tm = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 1 });
    const trunks = new THREE.InstancedMesh(tg, tm, treePos.length);
    const cg = new THREE.IcosahedronGeometry(1, 1);
    const cm = new THREE.MeshStandardMaterial({ color: 0x2f5a2a, roughness: 0.95, flatShading: true });
    const crowns = new THREE.InstancedMesh(cg, cm, treePos.length);
    const col = new THREE.Color();
    treePos.forEach((t, k) => {
      const h = 6.5 * t.s;
      m4.makeScale(1, h, 1); m4.setPosition(t.x, 0.3, t.z);
      trunks.setMatrixAt(k, m4);
      m4.makeScale(3.4 * t.s, 4.2 * t.s, 3.4 * t.s); m4.setPosition(t.x, h + 1.4 * t.s, t.z);
      crowns.setMatrixAt(k, m4);
      col.setHSL(0.27 + rnd() * 0.08, 0.45 + rnd() * 0.25, 0.24 + rnd() * 0.16);
      crowns.setColorAt(k, col);
    });
    trunks.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
    trunks.castShadow = crowns.castShadow = q.shadow > 0;
    crowns.receiveShadow = q.shadow > 0;
    trunks.frustumCulled = crowns.frustumCulled = false;
    scene.add(trunks, crowns);
  }

  // ===================== POSTES DE ILUMINAÇÃO ====================
  const lampPos = [];
  const step = 46;
  for (const b of blocks) {
    for (const s of [-1, 1]) {
      for (let t = -inner + 14; t < inner - 10; t += step) {
        lampPos.push({ x: b.cx + t, z: b.cz + s * (inner - 1.6), rot: s > 0 ? Math.PI : 0 });
        lampPos.push({ x: b.cx + s * (inner - 1.6), z: b.cz + t, rot: s > 0 ? -Math.PI / 2 : Math.PI / 2 });
      }
    }
  }
  const nLamp = Math.floor(lampPos.length * q.lamps);
  {
    const pg = [];
    pushBox(pg, 0, 0.5, 0, 0.9, 1.0, 0.9);                 // base
    const pole = new THREE.CylinderGeometry(0.17, 0.26, 9.6, 6); pole.translate(0, 5.8, 0); pg.push(pole);
    const arm = new THREE.CylinderGeometry(0.13, 0.15, 3.4, 5);
    arm.rotateZ(Math.PI / 2); arm.translate(1.7, 10.4, 0); pg.push(arm);
    const head = new THREE.BoxGeometry(2.3, 0.42, 0.95); head.translate(3.05, 10.22, 0); pg.push(head);
    const lg = mergeGeometries(pg, false);
    pg.forEach(g => g.dispose());
    const lm = new THREE.MeshStandardMaterial({ color: 0x2c2f34, roughness: 0.45, metalness: 0.85 });
    const lamps = new THREE.InstancedMesh(lg, lm, nLamp);
    const glow = new Float32Array(nLamp * 3);
    for (let k = 0; k < nLamp; k++) {
      const L = lampPos[k];
      tq.setFromAxisAngle(upY, L.rot);
      tv1.set(L.x, 0.18, L.z); tv2.set(1, 1, 1);
      m4.compose(tv1, tq, tv2);
      lamps.setMatrixAt(k, m4);
      // cabeça do poste em coordenadas de mundo
      const hp = new THREE.Vector3(3.05, 10.2, 0).applyQuaternion(tq).add(tv1);
      glow[k * 3] = hp.x; glow[k * 3 + 1] = hp.y; glow[k * 3 + 2] = hp.z;
    }
    lamps.instanceMatrix.needsUpdate = true;
    lamps.frustumCulled = false;
    lamps.castShadow = false;
    scene.add(lamps);
    city.lampGlow = makeGlowPoints(glow, 0xffcf9a, 7.4, scene, 0.9);
  }

  // ========================= SEMÁFOROS ==========================
  const tlPos = [];
  for (let a = 0; a < CFG.ROADS.length; a++) {
    for (let bIx = 0; bIx < CFG.ROADS.length; bIx++) {
      if ((a + bIx) % 2) continue;
      const x = CFG.ROADS[a], z = CFG.ROADS[bIx];
      const o = CFG.ROAD_HALF + 2.6;
      tlPos.push({ x: x + o, z: z + o, rot: Math.PI * 0.75, g: 0 });
      tlPos.push({ x: x - o, z: z - o, rot: -Math.PI * 0.25, g: 0 });
      tlPos.push({ x: x + o, z: z - o, rot: Math.PI * 0.25, g: 1 });
      tlPos.push({ x: x - o, z: z + o, rot: -Math.PI * 0.75, g: 1 });
    }
  }
  let tlLights = null;
  if (tlPos.length) {
    const pg = [];
    const pole = new THREE.CylinderGeometry(0.14, 0.18, 6.2, 6); pole.translate(0, 3.1, 0); pg.push(pole);
    const bx = new THREE.BoxGeometry(0.85, 2.5, 0.7); bx.translate(0, 6.6, 0); pg.push(bx);
    const vis = new THREE.BoxGeometry(1.0, 0.16, 0.5); vis.translate(0, 7.75, -0.4); pg.push(vis);
    const base = mergeGeometries(pg, false); pg.forEach(g => g.dispose());
    const paint = (g, hex) => {
      const c = new THREE.Color(hex);
      const n = g.attributes.position.count, arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
      return g;
    };
    paint(base, 0x22252a);
    const bulbs = [];
    for (let i = 0; i < 3; i++) {
      const s = new THREE.SphereGeometry(0.22, 8, 6);
      s.translate(0, 7.35 - i * 0.72, -0.42);
      bulbs.push(paint(s, 0xffffff));
    }
    const all = mergeGeometries([base, ...bulbs], false);
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.4, metalness: 0.3,
      emissive: 0xffffff, emissiveIntensity: 2.4,
    });
    // apenas as lâmpadas emitem: guardamos o índice inicial delas
    const bulbStart = base.attributes.position.count;
    tlLights = new THREE.InstancedMesh(all, mat, tlPos.length);
    tlLights.userData = { bulbStart, perBulb: bulbs[0].attributes.position.count };
    tlPos.forEach((t, k) => {
      tq.setFromAxisAngle(upY, t.rot);
      m4.compose(tv1.set(t.x, 0.18, t.z), tq, tv2.set(1, 1, 1));
      tlLights.setMatrixAt(k, m4);
      tlLights.setColorAt(k, new THREE.Color(1, 1, 1));
    });
    tlLights.instanceMatrix.needsUpdate = true;
    tlLights.frustumCulled = false;
    scene.add(tlLights);
  }

  // ====================== LETREIROS DE NEON =====================
  const signs = [];
  const signGroup = new THREE.Group();
  scene.add(signGroup);
  const glowSign = [];
  const cand = parts.filter((p) => p.h > 12 && p.h < 130);
  for (let k = 0; k < Math.min(q.signs, cand.length); k++) {
    const p = cand[Math.floor(rnd() * cand.length)];
    const words = ['TÁXI 24H', 'BAR', 'HOTEL', 'FARMÁCIA', 'LANCHES', 'CAFÉ', 'PIZZA',
      'MERCADO', 'OPEN', 'CINE', 'RAMEN', 'BURGER', 'MODAS', 'GAMES', 'PADARIA', 'ÓTICA'];
    const word = words[Math.floor(rnd() * words.length)];
    const color = SIGN_COLORS[Math.floor(rnd() * SIGN_COLORS.length)];
    const t = makeSignTexture(word, color);
    const w = clamp(p.w * (0.4 + rnd() * 0.35), 7, 26);
    const h = w * 0.28;
    const g = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      map: t, transparent: true, side: THREE.DoubleSide,
      depthWrite: false, toneMapped: false, fog: true, color: 0x111111,
    });
    const mesh = new THREE.Mesh(g, mat);
    const side = Math.floor(rnd() * 4);
    const y = 6 + rnd() * Math.min(26, p.h - 8);
    const off = 0.35;
    if (side === 0) { mesh.position.set(p.cx + (rnd() - 0.5) * p.w * 0.4, y, p.cz - p.d / 2 - off); }
    if (side === 1) { mesh.position.set(p.cx + (rnd() - 0.5) * p.w * 0.4, y, p.cz + p.d / 2 + off); mesh.rotation.y = Math.PI; }
    if (side === 2) { mesh.position.set(p.cx - p.w / 2 - off, y, p.cz + (rnd() - 0.5) * p.d * 0.4); mesh.rotation.y = -Math.PI / 2; }
    if (side === 3) { mesh.position.set(p.cx + p.w / 2 + off, y, p.cz + (rnd() - 0.5) * p.d * 0.4); mesh.rotation.y = Math.PI / 2; }
    signGroup.add(mesh);
    signs.push({ mesh, mat, color: new THREE.Color(color), flick: rnd() * 10 });
    glowSign.push(mesh.position.x, mesh.position.y, mesh.position.z);
  }
  const signGlow = makeGlowPoints(new Float32Array(glowSign), 0xffffff, 12, scene, 1.0);

  // ========================= PEDESTRES ==========================
  const pedMat = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.05 });
  const pedGeo = new THREE.CapsuleGeometry(0.42, 1.05, 3, 8);
  pedGeo.translate(0, 0.95, 0);
  const peds = new THREE.InstancedMesh(pedGeo, pedMat, q.peds);
  const pedData = [];
  const pcol = new THREE.Color();
  for (let k = 0; k < q.peds; k++) {
    const b = blocks[Math.floor(rnd() * blocks.length)];
    const edge = Math.floor(rnd() * 4);
    const s = inner - CFG.SIDEWALK / 2;
    const along = (rnd() * 2 - 1) * (s - 20);
    let x, z, dx, dz;
    if (edge === 0) { x = b.cx + along; z = b.cz - s; dx = 1; dz = 0; }
    else if (edge === 1) { x = b.cx + along; z = b.cz + s; dx = -1; dz = 0; }
    else if (edge === 2) { x = b.cx - s; z = b.cz + along; dx = 0; dz = 1; }
    else { x = b.cx + s; z = b.cz + along; dx = 0; dz = -1; }
    pedData.push({
      x, z, dx, dz, len: s - 18, o: along,
      sp: 1.0 + rnd() * 0.9, ph: rnd() * 10, b: b, rev: rnd() < 0.5,
      sc: 0.9 + rnd() * 0.28,
    });
    pcol.setHSL(rnd(), 0.28 + rnd() * 0.4, 0.16 + rnd() * 0.3);
    peds.setColorAt(k, pcol);
  }
  peds.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  peds.frustumCulled = false;
  peds.castShadow = q.shadow > 0;
  scene.add(peds);

  // ============================ FICHAS ==========================
  for (let k = 0; k < q.coins; k++) {
    const b = blocks[Math.floor(rnd() * blocks.length)];
    const onRoad = rnd() < 0.45;
    if (onRoad) {
      const horiz = rnd() < 0.5;
      const r = CFG.ROADS[Math.floor(rnd() * CFG.ROADS.length)];
      const t = (rnd() * 2 - 1) * (CFG.SPAN / 2 - 40);
      const lane = (rnd() < 0.5 ? -1 : 1) * CFG.LANE;
      city.coinSpots.push(horiz ? { x: t, z: r + lane } : { x: r + lane, z: t });
    } else {
      const s = inner - CFG.SIDEWALK / 2;
      const edge = Math.floor(rnd() * 4);
      const along = (rnd() * 2 - 1) * (s - 14);
      if (edge === 0) city.coinSpots.push({ x: b.cx + along, z: b.cz - s });
      else if (edge === 1) city.coinSpots.push({ x: b.cx + along, z: b.cz + s });
      else if (edge === 2) city.coinSpots.push({ x: b.cx - s, z: b.cz + along });
      else city.coinSpots.push({ x: b.cx + s, z: b.cz + along });
    }
  }
  const coinGeo = new THREE.CylinderGeometry(1.15, 1.15, 0.22, 18);
  coinGeo.rotateX(Math.PI / 2);
  const coinMat = new THREE.MeshBasicMaterial({ color: 0xffc23c, toneMapped: false, fog: true });
  const coins = new THREE.InstancedMesh(coinGeo, coinMat, city.coinSpots.length);
  coins.frustumCulled = false;
  scene.add(coins);
  const coinState = city.coinSpots.map(() => ({ taken: false, t: 0 }));
  const coinGlowPos = new Float32Array(city.coinSpots.length * 3);
  city.coinSpots.forEach((c, k) => {
    coinGlowPos[k * 3] = c.x; coinGlowPos[k * 3 + 1] = 1.5; coinGlowPos[k * 3 + 2] = c.z;
  });
  const coinGlow = makeGlowPoints(coinGlowPos, 0xffb43c, 4.2, scene, 0.8);

  // ========================= MARCADORES =========================
  const markers = new THREE.Group();
  scene.add(markers);
  city.markers = markers;
  function makeMarker(color) {
    const g = new THREE.Group();
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 4.6, 120, 20, 1, true),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide, depthWrite: false, fog: false, toneMapped: false,
      })
    );
    beam.position.y = 60;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(4.6, 7.4, 34),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.75, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
      })
    );
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.12;
    const ring2 = new THREE.Mesh(
      new THREE.RingGeometry(2.0, 2.6, 26),
      ring.material.clone()
    );
    ring2.rotation.x = -Math.PI / 2; ring2.position.y = 0.14;
    g.add(beam, ring, ring2);
    g.visible = false;
    markers.add(g);
    return { group: g, beam, ring, ring2, mat: beam.material };
  }
  city.markerPick = makeMarker(0x35e6ff);
  city.markerDrop = makeMarker(0xff8a2b);

  // passageiro
  const ped = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.45, 1.1, 4, 10),
    new THREE.MeshStandardMaterial({ color: 0x2b6cb0, roughness: 0.8 })
  );
  body.position.y = 1.05;
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xc99a76, roughness: 0.7 })
  );
  head.position.y = 2.05;
  const bag = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.85, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x8a4b2a, roughness: 0.9 })
  );
  bag.position.set(0.62, 0.5, 0.1);
  ped.add(body, head, bag);
  ped.visible = false;
  ped.castShadow = q.shadow > 0;
  scene.add(ped);
  city.passenger = ped;

  // ===================== FAIXAS DE TRÁFEGO ======================
  const half = CFG.SPAN / 2 + CFG.ROAD_HALF + 40;
  for (let i = 0; i < CFG.ROADS.length; i++) {
    const r = CFG.ROADS[i];
    city.lanes.push({ axis: 0, c: r, off: CFG.LANE, dir: 1, h: 0, a: -half, b: half });
    city.lanes.push({ axis: 0, c: r, off: -CFG.LANE, dir: -1, h: Math.PI, a: -half, b: half });
    city.lanes.push({ axis: 1, c: r, off: -CFG.LANE, dir: 1, h: -Math.PI / 2, a: -half, b: half });
    city.lanes.push({ axis: 1, c: r, off: CFG.LANE, dir: -1, h: Math.PI / 2, a: -half, b: half });
  }

  // ========================= UPDATE =============================
  const tmpM = new THREE.Matrix4();
  const tmpQ = new THREE.Quaternion();
  const tmpS = new THREE.Vector3();
  const tmpV = new THREE.Vector3();
  const tmpV2 = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const colRed = new THREE.Color(1, 0.12, 0.14);
  const colYel = new THREE.Color(1, 0.72, 0.1);
  const colGrn = new THREE.Color(0.16, 1, 0.36);
  const colOff = new THREE.Color(0.1, 0.06, 0.05);

  const roadDay = new THREE.Color(0x15161a), roadNight = new THREE.Color(0x0a0b0e);
  const swDay = new THREE.Color(0x75767a), swNight = new THREE.Color(0x3a3b40);
  const farDay = new THREE.Color(0x0a0b0e), farNight = new THREE.Color(0x05060a);

  city.update = function (dt, time, camPos, night, player) {
    bMat.uniforms.uNight.value = night;
    bMat.uniforms.uTime.value = time;
    // de dia o shader não tem iluminação real: compensa; à noite deixa escurecer
    bMat.uniforms.uBright.value = 1.05 - night * 0.55;
    roadMat.color.copy(roadDay).lerp(roadNight, night);
    roadMat.envMapIntensity = 0.85 - night * 0.45;
    swMat.color.copy(swDay).lerp(swNight, night);
    groundMat.color.copy(farDay).lerp(farNight, night);

    // pedestres
    for (let k = 0; k < pedData.length; k++) {
      const p = pedData[k];
      p.o += p.sp * dt * (p.rev ? -1 : 1);
      if (p.o > p.len) { p.o = p.len; p.rev = true; }
      if (p.o < -p.len) { p.o = -p.len; p.rev = false; }
      const bob = Math.abs(Math.sin(time * 5.2 * p.sp + p.ph)) * 0.09;
      const px = p.dx !== 0 ? p.b.cx + p.o : p.x;
      const pz = p.dz !== 0 ? p.b.cz + p.o : p.z;
      const face = Math.atan2(p.dx, p.dz) + (p.rev ? Math.PI : 0);
      tmpQ.setFromAxisAngle(up, face + Math.sin(time * 5 * p.sp + p.ph) * 0.06);
      tmpS.set(p.sc, p.sc * (1 - bob * 0.14), p.sc);
      tmpV2.set(px, 0.18 + bob, pz);
      tmpM.compose(tmpV2, tmpQ, tmpS);
      peds.setMatrixAt(k, tmpM);
    }
    peds.instanceMatrix.needsUpdate = true;

    // fichas
    let anyCoin = false;
    for (let k = 0; k < city.coinSpots.length; k++) {
      const st = coinState[k], c = city.coinSpots[k];
      if (st.taken) {
        st.t += dt;
        if (st.t > 26) { st.taken = false; }
        tmpM.makeScale(0.0001, 0.0001, 0.0001);
        tmpM.setPosition(c.x, -50, c.z);
      } else {
        anyCoin = true;
        const bob = Math.sin(time * 2.4 + k) * 0.32;
        tmpQ.setFromAxisAngle(up, time * 2.1 + k);
        tmpM.compose(tmpV2.set(c.x, 1.55 + bob, c.z), tmpQ, tmpS.set(1, 1, 1));
        if (player) {
          const dx = c.x - player.x, dz = c.z - player.z;
          if (dx * dx + dz * dz < 16 && Math.abs(player.y - 1.5) < 6) {
            st.taken = true; st.t = 0; player.onCoin && player.onCoin();
          }
        }
      }
      coins.setMatrixAt(k, tmpM);
    }
    coins.instanceMatrix.needsUpdate = true;
    coinGlow.mesh.visible = anyCoin && night > 0.15;

    // semáforos
    if (tlLights) {
      const ph = time % 15;
      for (let k = 0; k < tlPos.length; k++) {
        const g0 = tlPos[k].g === 0;
        let c = colRed;
        if (g0) {
          if (ph < 6.4) c = colGrn; else if (ph < 7.5) c = colYel;
        } else {
          if (ph >= 7.5 && ph < 13.9) c = colGrn;
          else if (ph >= 13.9 || ph < 0.6) c = colYel;
        }
        tlLights.setColorAt(k, c);
      }
      if (tlLights.instanceColor) tlLights.instanceColor.needsUpdate = true;
    }

    // postes / neons / faróis conforme a noite cai
    city.lampGlow.setIntensity(0.06 + night * 1.25);
    signGlow.setIntensity(night * 1.15);
    for (const s of signs) {
      const fl = 0.82 + 0.18 * Math.sin(time * 9 + s.flick) * Math.sin(time * 2.3 + s.flick * 2);
      const v = (0.10 + night * 1.5) * fl;
      s.mat.color.copy(s.color).multiplyScalar(v);
      s.mat.opacity = 0.35 + night * 0.65;
    }

    // balizas das antenas
    if (city._beacons) {
      const blink = (Math.sin(time * 2.4) > 0.55) ? 3.2 : 0.06;
      city._beacons.material.color.setRGB(blink, blink * 0.16, blink * 0.2);
    }

    // marcadores de missão
    for (const mk of [city.markerPick, city.markerDrop]) {
      if (!mk.group.visible) continue;
      mk.ring.rotation.z += dt * 0.9;
      mk.ring2.rotation.z -= dt * 1.6;
      const pu = 0.72 + 0.28 * Math.sin(time * 3.2);
      mk.mat.opacity = (0.10 + 0.14 * pu) * (0.55 + night * 0.75);
      mk.ring.material.opacity = 0.45 + 0.35 * pu;
      mk.ring.scale.setScalar(1 + 0.06 * Math.sin(time * 2.2));
    }
    if (city.passenger.visible) {
      city.passenger.rotation.y += dt * 0.5;
      city.passenger.position.y = Math.sin(time * 2) * 0.05;
    }
  };

  city.setSun = function (dir, color, intensity, amb) {
    bMat.uniforms.uSunDir.value.copy(dir);
    bMat.uniforms.uSunColor.value.copy(color);
    bMat.uniforms.uSunI.value = intensity;
    bMat.uniforms.uAmbI.value = amb;
  };

  city.setFog = function (color, density) {
    bMat.uniforms.uFogColor.value.copy(color);
    bMat.uniforms.uFogDensity.value = density;
  };

  city.mats = { road: roadMat, sidewalk: swMat, building: bMat, far: groundMat };
  city.coinCount = () => city.coinSpots.length;
  return city;
}

export { makeGlowPoints } from './util.js';
