// ============================================================
//  Céu + ciclo de luz (hora dourada -> pôr do sol -> noite)
//  O céu também alimenta o environment map (reflexos PBR)
// ============================================================
import * as THREE from 'three';

const VERT = /* glsl */`
varying vec3 vDir;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vDir = wp.xyz - cameraPosition;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */`
precision highp float;
uniform vec3 uZenith, uHorizon, uGround, uSunColor, uCloud, uStarColor;
uniform vec3 uSunDir;
uniform float uSunSize, uSunIntensity, uTime, uStar;
varying vec3 vDir;

float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;

  vec3 col = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.42));
  col = mix(col, uGround, smoothstep(0.0, -0.16, h));

  // brilho espalhado em volta do sol
  float mu = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSunColor * (pow(mu, 6.0) * 0.20 + pow(mu, 90.0) * 0.45) * uSunIntensity;
  // disco solar
  float disc = smoothstep(uSunSize, uSunSize * 0.86, acos(clamp(mu, -1.0, 1.0)));
  col += uSunColor * disc * 3.2 * uSunIntensity;

  // nuvens em faixas (projeção no plano)
  if (h > 0.005) {
    vec2 uv = d.xz / (h + 0.16);
    float t = uTime * 0.006;
    float n = 0.0;
    n += sin(uv.x * 0.42 + t * 3.0) * sin(uv.y * 0.31 - t * 2.0);
    n += 0.55 * sin(uv.x * 1.13 - t * 5.0 + 1.7) * sin(uv.y * 0.87 + t * 3.3);
    n += 0.30 * sin(uv.x * 2.7 + uv.y * 2.1 + t * 7.0);
    float band = smoothstep(0.25, 1.15, n) * smoothstep(0.0, 0.22, h) * (1.0 - smoothstep(0.35, 0.95, h));
    float lit = 0.45 + 0.55 * pow(mu, 2.0);
    col = mix(col, uCloud * lit, band * 0.72);
  }

  // estrelas
  if (uStar > 0.01 && h > 0.0) {
    vec2 g = floor(d.xz / (h + 0.3) * 190.0);
    float s = h21(g);
    float tw = step(0.9965, s) * (0.55 + 0.45 * sin(uTime * 2.4 + s * 90.0));
    col += uStarColor * tw * uStar * smoothstep(0.0, 0.3, h);
  }

  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;

// --- keyframes do ciclo ---
const KEYS = [
  { // hora dourada (igual à imagem de referência)
    t: 0.00, elev: 11, azi: 118,
    zenith: 0x2f5f9e, horizon: 0xffa457, ground: 0x3a2b23,
    sun: 0xffd3a0, sunI: 1.0, sunSize: 0.055,
    cloud: 0xffc79a, star: 0.0,
    fog: 0xc98a58, fogD: 0.00058, fogY: 0.010,
    dirI: 2.6, hemiSky: 0xffbe86, hemiGnd: 0x2c2622, hemiI: 0.85, exp: 0.95,
  },
  { // pôr do sol
    t: 0.34, elev: 4.5, azi: 104,
    zenith: 0x1d3468, horizon: 0xff5e34, ground: 0x241a19,
    sun: 0xff9a52, sunI: 1.15, sunSize: 0.075,
    cloud: 0xff8a63, star: 0.15,
    fog: 0x7c4437, fogD: 0.00080, fogY: 0.012,
    dirI: 1.7, hemiSky: 0xa96a63, hemiGnd: 0x221d1e, hemiI: 0.7, exp: 1.03,
  },
  { // crepúsculo azulado
    t: 0.55, elev: -1.5, azi: 96,
    zenith: 0x0b1734, horizon: 0x51345c, ground: 0x120f14,
    sun: 0x8f6a86, sunI: 0.35, sunSize: 0.05,
    cloud: 0x4a3d55, star: 0.6,
    fog: 0x2b2740, fogD: 0.00115, fogY: 0.014,
    dirI: 0.55, hemiSky: 0x4a5a86, hemiGnd: 0x151519, hemiI: 0.5, exp: 1.08,
  },
  { // noite urbana
    t: 1.00, elev: -14, azi: 88,
    zenith: 0x04070f, horizon: 0x141d33, ground: 0x05060a,
    sun: 0x334466, sunI: 0.06, sunSize: 0.04,
    cloud: 0x1a2135, star: 1.0,
    fog: 0x0b1020, fogD: 0.00135, fogY: 0.016,
    dirI: 0.22, hemiSky: 0x2b3a5e, hemiGnd: 0x0d0e14, hemiI: 0.42, exp: 1.16,
  },
];

const cA = new THREE.Color(), cB = new THREE.Color();
function mixHex(a, b, t, out) { cA.setHex(a); cB.setHex(b); return out.copy(cA).lerp(cB, t); }
function mixNum(a, b, t) { return a + (b - a) * t; }

export class Sky {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.t = 0;                 // 0..1 ao longo do ciclo
    this.time = 0;
    this.night = 0;             // 0 = dia dourado, 1 = noite
    this._envAge = 99;

    this.uniforms = {
      uZenith: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uGround: { value: new THREE.Color() },
      uSunColor: { value: new THREE.Color() },
      uCloud: { value: new THREE.Color() },
      uStarColor: { value: new THREE.Color(0xdfe8ff) },
      uSunDir: { value: new THREE.Vector3(0.4, 0.2, 0.9) },
      uSunSize: { value: 0.055 },
      uSunIntensity: { value: 1 },
      uTime: { value: 0 },
      uStar: { value: 0 },
    };

    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, uniforms: this.uniforms,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1000;
    this.mesh.scale.setScalar(4500);
    scene.add(this.mesh);

    this.sun = new THREE.DirectionalLight(0xffd3a0, 3.5);
    this.sun.castShadow = false;
    this.sun.shadow.mapSize.set(2048, 2048);
    const s = 460;
    Object.assign(this.sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 60, far: 3000 });
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.9;
    this.sun.shadow.radius = 2.2;
    scene.add(this.sun);
    scene.add(this.sun.target);

    this.hemi = new THREE.HemisphereLight(0xffbe86, 0x2c2622, 0.85);
    scene.add(this.hemi);

    // luz de preenchimento vinda do céu (suaviza sombras duras)
    this.fill = new THREE.DirectionalLight(0xbcd6ff, 0.35);
    this.fill.position.set(-0.5, 0.85, -0.35);
    scene.add(this.fill);

    this.sunDir = new THREE.Vector3();
    this.skyScene = new THREE.Scene();
    this.skyScene.fog = null;
    const skyForEnv = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 20), this.mat);
    skyForEnv.scale.setScalar(1);
    this.skyScene.add(skyForEnv);

    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.pmrem.compileEquirectangularShader();
    this.envRT = null;

    scene.fog = new THREE.FogExp2(0xd09060, 0.00072);
    this.apply(0, true);
  }

  setQuality(q) {
    if (q.shadow > 0) {
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(q.shadow, q.shadow);
      if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
    } else {
      this.sun.castShadow = false;
    }
  }

  // t: 0..1 ; force: regenera environment map
  apply(t, force = false) {
    this.t = t;
    let i = 0;
    while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
    const A = KEYS[i], B = KEYS[i + 1];
    const k = THREE.MathUtils.clamp((t - A.t) / (B.t - A.t), 0, 1);
    const e = k * k * (3 - 2 * k); // smoothstep

    const u = this.uniforms;
    mixHex(A.zenith, B.zenith, e, u.uZenith.value);
    mixHex(A.horizon, B.horizon, e, u.uHorizon.value);
    mixHex(A.ground, B.ground, e, u.uGround.value);
    mixHex(A.sun, B.sun, e, u.uSunColor.value);
    mixHex(A.cloud, B.cloud, e, u.uCloud.value);
    u.uSunSize.value = mixNum(A.sunSize, B.sunSize, e);
    u.uSunIntensity.value = mixNum(A.sunI, B.sunI, e);
    u.uStar.value = mixNum(A.star, B.star, e);

    const elev = THREE.MathUtils.degToRad(mixNum(A.elev, B.elev, e));
    const azi = THREE.MathUtils.degToRad(mixNum(A.azi, B.azi, e));
    this.sunDir.set(
      Math.cos(elev) * Math.cos(azi),
      Math.sin(elev),
      Math.cos(elev) * Math.sin(azi)
    ).normalize();
    u.uSunDir.value.copy(this.sunDir);

    this.sun.color.copy(u.uSunColor.value);
    this.sun.intensity = mixNum(A.dirI, B.dirI, e);
    this.hemi.color.setHex(0xffffff);
    mixHex(A.hemiSky, B.hemiSky, e, this.hemi.color);
    mixHex(A.hemiGnd, B.hemiGnd, e, this.hemi.groundColor);
    this.hemi.intensity = mixNum(A.hemiI, B.hemiI, e);
    this.fill.intensity = mixNum(A.dirI, B.dirI, e) * 0.16;
    this.fill.color.copy(u.uZenith.value).lerp(new THREE.Color(0xffffff), 0.35);

    mixHex(A.fog, B.fog, e, this.scene.fog.color);
    this.scene.fog.density = mixNum(A.fogD, B.fogD, e);
    this.renderer.toneMappingExposure = mixNum(A.exp, B.exp, e);

    // 0 no início dourado, 1 na noite
    this.night = THREE.MathUtils.clamp((t - 0.22) / 0.42, 0, 1);
  }

  update(dt, focus, forceEnv = false) {
    this.time += dt;
    this.uniforms.uTime.value = this.time;
    this.mesh.position.copy(focus);
    this.skyScene.children[0].position.set(0, 0, 0);

    const dist = 1150;
    this.sun.position.copy(focus).addScaledVector(this.sunDir, dist);
    this.sun.target.position.copy(focus);
    this.sun.target.updateMatrixWorld();

    this._envAge += dt;
    if (forceEnv || this._envAge > 6) {
      this._envAge = 0;
      this.renderer.setRenderTarget(null);
      const rt = this.pmrem.fromScene(this.skyScene, 0, 1, 4000);
      if (this.envRT) this.envRT.dispose();
      this.envRT = rt;
      this.scene.environment = rt.texture;
    }
  }
}
