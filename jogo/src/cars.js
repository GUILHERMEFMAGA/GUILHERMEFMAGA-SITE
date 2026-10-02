// ============================================================
//  VEÍCULOS: carro do jogador (física arcade) + tráfego IA
// ============================================================
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CFG, clamp, lerp, damp } from './config.js';
import { makeGlowPoints } from './util.js';

const UP = new THREE.Vector3(0, 1, 0);

// ------------------------------------------------------------
//  geometrias compartilhadas dos carros
// ------------------------------------------------------------
function carGeoms() {
  if (carGeoms._c) return carGeoms._c;
  const body = new THREE.BoxGeometry(2.05, 0.66, 4.72); body.translate(0, 0.86, 0);
  const lower = new THREE.BoxGeometry(2.16, 0.34, 4.86); lower.translate(0, 0.52, 0);
  const hood = new THREE.BoxGeometry(1.94, 0.16, 1.5); hood.translate(0, 1.24, 1.45);
  const trunk = new THREE.BoxGeometry(1.94, 0.16, 1.2); trunk.translate(0, 1.24, -1.65);
  const cabin = new THREE.BoxGeometry(1.82, 0.62, 2.45); cabin.translate(0, 1.6, -0.2);
  cabin.scale(1, 1, 1);
  const roof = new THREE.BoxGeometry(1.72, 0.1, 2.2); roof.translate(0, 1.95, -0.2);
  const glass = new THREE.BoxGeometry(1.7, 0.5, 2.3); glass.translate(0, 1.62, -0.2);

  const wheel = new THREE.CylinderGeometry(0.46, 0.46, 0.34, 14);
  wheel.rotateZ(Math.PI / 2);
  const wheelParts = [];
  for (const [x, z] of [[0.94, 1.42], [-0.94, 1.42], [0.94, -1.5], [-0.94, -1.5]]) {
    const w = wheel.clone(); w.translate(x, 0.46, z); wheelParts.push(w);
  }
  const wheels = mergeGeometries(wheelParts, false);   // uma geometria só
  wheelParts.forEach(g => g.dispose());
  wheel.dispose();

  const hl = new THREE.BoxGeometry(0.44, 0.17, 0.09);
  const headL = hl.clone(); headL.translate(-0.63, 0.98, 2.44);
  const headR = hl.clone(); headR.translate(0.63, 0.98, 2.44);
  const tl = new THREE.BoxGeometry(0.5, 0.15, 0.09);
  const tailL = tl.clone(); tailL.translate(-0.62, 1.0, -2.44);
  const tailR = tl.clone(); tailR.translate(0.62, 1.0, -2.44);

  carGeoms._c = { body, lower, hood, trunk, cabin, roof, glass, wheels, headL, headR, tailL, tailR };
  return carGeoms._c;
}

// ------------------------------------------------------------
//  TRÁFEGO
// ------------------------------------------------------------
const CAR_COLORS = [
  0xd8d8dc, 0x1d1f24, 0x8e1f22, 0x1f3a63, 0x3d4249, 0xc9a227,
  0x2c6e49, 0x6d6f74, 0xa8a29a, 0x16324a, 0x7a2f4f, 0xe4e6ea,
];

export class Traffic {
  constructor(scene, lanes, count, q) {
    this.scene = scene;
    this.q = q;
    this.count = count;
    this.lanes = lanes;
    this.cars = [];

    const G = carGeoms();
    const cast = q.shadow > 0;

    this.bodyMat = new THREE.MeshStandardMaterial({
      roughness: 0.3, metalness: 0.55, envMapIntensity: 1.3, flatShading: false,
    });
    this.glassMat = new THREE.MeshStandardMaterial({
      color: 0x12161c, roughness: 0.06, metalness: 0.9, envMapIntensity: 1.9,
    });
    this.tireMat = new THREE.MeshStandardMaterial({ color: 0x101012, roughness: 0.92, metalness: 0.05 });
    this.tailMat = new THREE.MeshStandardMaterial({
      color: 0x300a0c, emissive: 0xff2222, emissiveIntensity: 0.6,
      roughness: 0.3, metalness: 0.1, toneMapped: true,
    });
    this.headMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a26, emissive: 0xfff0d2, emissiveIntensity: 0.2, roughness: 0.2, metalness: 0.4,
    });

    this.iBody = new THREE.InstancedMesh(G.body, this.bodyMat, count);
    this.iLower = new THREE.InstancedMesh(G.lower, this.bodyMat, count);
    this.iHood = new THREE.InstancedMesh(G.hood, this.bodyMat, count);
    this.iCabin = new THREE.InstancedMesh(G.cabin, this.bodyMat, count);
    this.iRoof = new THREE.InstancedMesh(G.roof, this.bodyMat, count);
    this.iGlass = new THREE.InstancedMesh(G.glass, this.glassMat, count);
    this.iWheels = new THREE.InstancedMesh(G.wheels, this.tireMat, count);
    this.iTail = new THREE.InstancedMesh(G.tailL, this.tailMat, count);
    this.iTail2 = new THREE.InstancedMesh(G.tailR, this.tailMat, count);
    this.iHead = new THREE.InstancedMesh(G.headL, this.headMat, count);
    this.iHead2 = new THREE.InstancedMesh(G.headR, this.headMat, count);

    for (const m of [this.iBody, this.iLower, this.iHood, this.iCabin, this.iRoof,
      this.iGlass, this.iWheels, this.iTail, this.iTail2, this.iHead, this.iHead2]) {
      m.frustumCulled = false;
      m.castShadow = cast;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(m);
    }

    const span = CFG.SPAN / 2 + CFG.ROAD_HALF;
    for (let i = 0; i < count; i++) {
      const lane = lanes[i % lanes.length];
      const car = {
        lane,
        s: (i / count) * (lane.b - lane.a) + Math.random() * 40,
        v: 11 + Math.random() * 8,
        brake: 0,
        x: 0, z: 0, h: lane.h,
      };
      this.cars.push(car);
      const c = new THREE.Color(CAR_COLORS[i % CAR_COLORS.length]);
      c.offsetHSL(0, (Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.1);
      this.iBody.setColorAt(i, c);
      this.iLower.setColorAt(i, c.clone().multiplyScalar(0.8));
      this.iHood.setColorAt(i, c);
      this.iCabin.setColorAt(i, c);
      this.iRoof.setColorAt(i, c);
    }
    for (const m of [this.iBody, this.iLower, this.iHood, this.iCabin, this.iRoof]) {
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }

    // agrupa por faixa p/ IA barata
    this.byLane = new Map();
    for (const car of this.cars) {
      if (!this.byLane.has(car.lane)) this.byLane.set(car.lane, []);
      this.byLane.get(car.lane).push(car);
    }
    for (const arr of this.byLane.values()) arr.sort((a, b) => (a.s - b.s) * (a.lane.dir || 1));

    // brilhos: faróis (branco quente) e lanternas (vermelho)
    this.headPts = makeGlowPoints(new Float32Array(count * 6), 0xffe6bd, 2.6, scene, 0);
    this.tailPts = makeGlowPoints(new Float32Array(count * 6), 0xff3a2a, 2.2, scene, 0);
    this.brakePts = makeGlowPoints(new Float32Array(count * 6), 0xff1a1a, 4.2, scene, 0);

    this.m4 = new THREE.Matrix4();
    this.qq = new THREE.Quaternion();
    this.v1 = new THREE.Vector3();
    this.v2 = new THREE.Vector3(1, 1, 1);
  }

  posOf(car) {
    const L = car.lane;
    if (L.axis === 0) return { x: car.s, z: L.c + L.off, h: L.dir > 0 ? 0 : Math.PI };
    return { x: L.c + L.off, z: car.s, h: L.dir > 0 ? -Math.PI / 2 : Math.PI / 2 };
  }

  update(dt, time, player, night) {
    this._sort = (this._sort || 0) + dt;
    if (this._sort > 1.0) {
      this._sort = 0;
      for (const arr of this.byLane.values()) arr.sort((a, b) => (a.s - b.s) * (a.lane.dir || 1));
    }
    const hp = this.headPts.attr.array;
    const tp = this.tailPts.attr.array;
    const bp = this.brakePts.attr.array;

    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      const L = car.lane;
      const p = this.posOf(car);
      car.x = p.x; car.z = p.z; car.h = p.h;
      const fx = Math.sin(car.h), fz = Math.cos(car.h);

      // --- obstáculos à frente (só vizinhos da mesma faixa) ---
      let brake = 0;
      const near = this.byLane.get(L);
      if (near && near.length > 1) {
        const idx = near.indexOf(car);
        for (let d0 = 1; d0 <= 2; d0++) {
          const o = near[(idx + d0) % near.length];
          let d = (o.s - car.s) * L.dir;
          if (d < -1) d += (L.b - L.a);
          if (d > -1 && d < 14) brake = Math.max(brake, clamp((14 - d) / 9, 0, 1));
        }
      }
      // jogador na frente
      let pd = Infinity;
      if (player) {
        const dx = player.x - car.x, dz = player.z - car.z;
        const fwd = dx * fx + dz * fz;
        const lat = Math.abs(-dx * fz + dz * fx);
        if (fwd > 0 && fwd < 14 && lat < 2.6) pd = fwd;
      }
      if (pd < 14) brake = Math.max(brake, clamp((14 - pd) / 10, 0, 1));

      // --- cruzamentos: reduz / para no vermelho ---
      const ph = time % 15;
      const green = L.axis === 0 ? ph < 7.5 : (ph >= 7.5 && ph < 15);
      for (const r of CFG.ROADS) {
        const d = Math.abs(car.s - r);
        if (d > 46) continue;
        if (!green) {
          const stop = r - L.dir * (CFG.ROAD_HALF + 2.5);
          const ds = (stop - car.s) * L.dir;
          if (ds > -2 && ds < 26) brake = Math.max(brake, clamp((26 - ds) / 16, 0, 1));
          if (ds < 3.5 && ds > -3) brake = 1;
        } else if (d < CFG.ROAD_HALF + 6) {
          brake = Math.max(brake, 0.28);
        }
      }

      car.brake = brake;
      const target = car.v * (1 - 0.92 * brake);
      const a = brake > 0.05 ? -22 * brake : 9;
      car.speed = car.speed === undefined ? car.v : car.speed;
      car.speed = clamp(car.speed + a * dt, 0, car.v);
      car.speed = damp(car.speed, Math.max(target, 0), 4, dt);

      car.s += L.dir * car.speed * dt;
      if (car.s > L.b) car.s = L.a;
      if (car.s < L.a) car.s = L.b;

      // --- matriz ---
      this.qq.setFromAxisAngle(UP, car.h);
      this.v1.set(car.x, 0.0, car.z);
      this.m4.compose(this.v1, this.qq, this.v2);
      this.iBody.setMatrixAt(i, this.m4);
      this.iLower.setMatrixAt(i, this.m4);
      this.iHood.setMatrixAt(i, this.m4);
      this.iCabin.setMatrixAt(i, this.m4);
      this.iRoof.setMatrixAt(i, this.m4);
      this.iGlass.setMatrixAt(i, this.m4);
      this.iWheels.setMatrixAt(i, this.m4);
      this.iTail.setMatrixAt(i, this.m4);
      this.iTail2.setMatrixAt(i, this.m4);
      this.iHead.setMatrixAt(i, this.m4);
      this.iHead2.setMatrixAt(i, this.m4);

      // --- luzes ---
      const k6 = i * 6;
      hp[k6]     = car.x - fz * 0.66 + fx * 2.45; hp[k6 + 1] = 1.0;
      hp[k6 + 2] = car.z + fx * 0.66 + fz * 2.45;
      hp[k6 + 3] = car.x + fz * 0.66 + fx * 2.45; hp[k6 + 4] = 1.0;
      hp[k6 + 5] = car.z - fx * 0.66 + fz * 2.45;

      tp[k6]     = car.x - fz * 0.64 - fx * 2.45; tp[k6 + 1] = 1.02;
      tp[k6 + 2] = car.z + fx * 0.64 - fz * 2.45;
      tp[k6 + 3] = car.x + fz * 0.64 - fx * 2.45; tp[k6 + 4] = 1.02;
      tp[k6 + 5] = car.z - fx * 0.64 - fz * 2.45;
      bp[k6] = tp[k6]; bp[k6 + 1] = tp[k6 + 1]; bp[k6 + 2] = tp[k6 + 2];
      bp[k6 + 3] = tp[k6 + 3]; bp[k6 + 4] = tp[k6 + 4]; bp[k6 + 5] = tp[k6 + 5];
    }

    for (const m of [this.iBody, this.iLower, this.iHood, this.iCabin, this.iRoof,
      this.iGlass, this.iWheels, this.iTail, this.iTail2, this.iHead, this.iHead2]) {
      m.instanceMatrix.needsUpdate = true;
    }
    this.headPts.attr.needsUpdate = true;
    this.tailPts.attr.needsUpdate = true;
    this.brakePts.attr.needsUpdate = true;

    this.headPts.setIntensity(night * 1.15);
    this.tailPts.setIntensity(0.25 + night * 0.95);
    this.brakePts.setIntensity(night * 0.5);
    this.headMat.emissiveIntensity = 0.15 + night * 3.4;
    this.tailMat.emissiveIntensity = 0.35 + night * 2.2;
  }
}

// ------------------------------------------------------------
//  MARCAS DE PNEU
// ------------------------------------------------------------
class SkidMarks {
  constructor(scene, max = 260) {
    this.max = max; this.k = 0; this.dirtyM = false; this.dirtyC = false;
    const g = new THREE.PlaneGeometry(0.42, 1.5);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0.42, depthWrite: false, fog: true,
    });
    this.mesh = new THREE.InstancedMesh(g, m, max);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 3;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mesh);
    this.life = new Float32Array(max);
    this.m4 = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.col = new THREE.Color();
    for (let i = 0; i < max; i++) {
      this.m4.makeScale(0.001, 1, 0.001); this.m4.setPosition(0, -50, 0);
      this.mesh.setMatrixAt(i, this.m4);
      this.mesh.setColorAt(i, this.col.setRGB(0, 0, 0));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
  add(x, z, h, s = 1) {
    const i = this.k = (this.k + 1) % this.max;
    this.q.setFromAxisAngle(UP, h);
    this.m4.compose(new THREE.Vector3(x, 0.05, z), this.q, new THREE.Vector3(1, 1, s));
    this.mesh.setMatrixAt(i, this.m4);
    this.mesh.setColorAt(i, this.col.setRGB(0.24, 0.23, 0.22));
    this.life[i] = 1;
    this.dirtyM = true; this.dirtyC = true;
  }
  fade(dt) {
    let dirty = false;
    if (this.dirtyM) { this.mesh.instanceMatrix.needsUpdate = true; this.dirtyM = false; }
    if (this.dirtyC) { this.dirtyC = false; dirty = true; }
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] > 0) {
        this.life[i] -= dt * 0.055;
        if (this.life[i] <= 0) {
          this.life[i] = 0;
          this.mesh.setColorAt(i, this.col.setRGB(0, 0, 0));
          dirty = true;
        }
      }
    }
    if (dirty && this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

// ------------------------------------------------------------
//  CARRO DO JOGADOR
// ------------------------------------------------------------
export class Player {
  constructor(scene, city, q, audio) {
    this.scene = scene; this.city = city; this.q = q; this.audio = audio;
    this.x = CFG.ROADS[0]; this.y = 0; this.z = CFG.ROADS[1] + CFG.LANE;
    this.h = 0; this.speed = 0; this.steer = 0; this.slip = 0;
    this.distance = 0; this.topSpeed = 0;
    this.throttle = 0; this.braking = false; this.hand = false;
    this.crashCool = 0;

    this.group = new THREE.Group();
    scene.add(this.group);
    this.buildModel(scene, q);

    this.skid = new SkidMarks(scene);
    this.spray = makeSpray(scene);

    // sombra "bolha" embaixo do carro (barata e sempre presente)
    this.blob = makeBlob(scene);
    this.blob.mesh.renderOrder = 4;
    this.group2 = this.blob.mesh;
  }

  buildModel(scene, q) {
    const cast = q.shadow > 0;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf2b01e, roughness: 0.26, metalness: 0.62, envMapIntensity: 1.5,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x1a1c20, roughness: 0.35, metalness: 0.7, envMapIntensity: 1.2,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0d1117, roughness: 0.05, metalness: 0.92, envMapIntensity: 2.2,
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xcfd4da, roughness: 0.12, metalness: 1.0, envMapIntensity: 2.0,
    });

    // OBS: não pode se chamar "add" — colidiria com Object3D.add(child)
    const part = (geo, mat, px = 0, py = 0, pz = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(px, py, pz);
      m.castShadow = cast; m.receiveShadow = cast;
      this.group.add(m);
      return m;
    };

    part(new THREE.BoxGeometry(2.1, 0.36, 4.9), darkMat, 0, 0.52, 0);
    part(new THREE.BoxGeometry(2.02, 0.68, 4.7), bodyMat, 0, 0.9, 0);
    part(new THREE.BoxGeometry(1.9, 0.14, 1.6), bodyMat, 0, 1.28, 1.5);
    part(new THREE.BoxGeometry(1.9, 0.14, 1.3), bodyMat, 0, 1.28, -1.7);
    // cabine
    part(new THREE.BoxGeometry(1.8, 0.66, 2.5), bodyMat, 0, 1.62, -0.18);
    part(new THREE.BoxGeometry(1.66, 0.52, 2.32), glassMat, 0, 1.64, -0.18);
    part(new THREE.BoxGeometry(1.74, 0.09, 2.3), bodyMat, 0, 1.97, -0.18);
    // para-brisas inclinados
    const ws = new THREE.BoxGeometry(1.62, 0.62, 0.09);
    const wsf = part(ws, glassMat, 0, 1.6, 1.06); wsf.rotation.x = -0.42;
    const wsb = part(ws.clone(), glassMat, 0, 1.6, -1.42); wsb.rotation.x = 0.44;
    // vidros laterais
    const sw = new THREE.BoxGeometry(0.06, 0.42, 2.1);
    part(sw, glassMat, 0.91, 1.66, -0.18);
    part(sw.clone(), glassMat, -0.91, 1.66, -0.18);
    // para-choques
    part(new THREE.BoxGeometry(2.14, 0.3, 0.34), chromeMat, 0, 0.62, 2.44);
    part(new THREE.BoxGeometry(2.14, 0.3, 0.34), chromeMat, 0, 0.62, -2.44);
    // faróis / lanternas
    this.headMat = new THREE.MeshStandardMaterial({
      color: 0xf6f2e6, emissive: 0xfff2d6, emissiveIntensity: 0.6,
      roughness: 0.15, metalness: 0.3,
    });
    this.tailMat = new THREE.MeshStandardMaterial({
      color: 0x3b0d10, emissive: 0xff2b2b, emissiveIntensity: 0.8,
      roughness: 0.25, metalness: 0.2,
    });
    part(new THREE.BoxGeometry(0.5, 0.2, 0.1), this.headMat, -0.66, 1.0, 2.46);
    part(new THREE.BoxGeometry(0.5, 0.2, 0.1), this.headMat, 0.66, 1.0, 2.46);
    part(new THREE.BoxGeometry(0.56, 0.18, 0.1), this.tailMat, -0.64, 1.02, -2.46);
    part(new THREE.BoxGeometry(0.56, 0.18, 0.1), this.tailMat, 0.64, 1.02, -2.46);
    // retrovisores
    part(new THREE.BoxGeometry(0.3, 0.16, 0.12), darkMat, 1.12, 1.5, 0.86);
    part(new THREE.BoxGeometry(0.3, 0.16, 0.12), darkMat, -1.12, 1.5, 0.86);
    // letreiro TÁXI
    const c = document.createElement('canvas'); c.width = 256; c.height = 96;
    const x = c.getContext('2d');
    x.fillStyle = '#141414'; x.fillRect(0, 0, 256, 96);
    x.fillStyle = '#ffc21a'; x.fillRect(6, 6, 244, 84);
    x.fillStyle = '#141005';
    x.font = 'bold 62px "Trebuchet MS", system-ui, sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('TÁXI', 128, 52);
    const signTex = new THREE.CanvasTexture(c);
    signTex.colorSpace = THREE.SRGBColorSpace;
    this.signMat = new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false, fog: true });
    part(new THREE.BoxGeometry(1.25, 0.34, 0.42), this.signMat, 0, 2.16, -0.18);

    // faixas pretas do capô (estilo táxi)
    part(new THREE.BoxGeometry(0.34, 0.02, 1.5), darkMat, 0, 1.36, 1.5);

    // rodas
    const wg = new THREE.CylinderGeometry(0.47, 0.47, 0.36, 16);
    wg.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x0e0e10, roughness: 0.95 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xb9bec6, roughness: 0.25, metalness: 0.95 });
    this.wheels = [];
    for (const [wx, wz, front] of [[0.95, 1.44, 1], [-0.95, 1.44, 1], [0.95, -1.52, 0], [-0.95, -1.52, 0]]) {
      const holder = new THREE.Group();
      holder.position.set(wx, 0.47, wz);
      const tire = new THREE.Mesh(wg, tireMat);
      tire.castShadow = cast;
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.38, 10), rimMat);
      rim.rotation.z = Math.PI / 2;
      holder.add(tire, rim);
      this.group.add(holder);
      this.wheels.push({ holder, tire, rim, front });
    }

    // faróis reais (só em qualidade alta/média)
    this.lights = [];
    if (q.carShadow >= 0 && q.qualityName !== 'low') {
      for (const sx of [-0.66, 0.66]) {
        const sp = new THREE.SpotLight(0xffe9c4, 0, 150, 0.46, 0.55, 1.4);
        sp.position.set(sx, 1.0, 2.4);
        sp.target.position.set(sx * 2.4, -1.2, 34);
        this.group.add(sp); this.group.add(sp.target);
        if (q.carShadow > 0) {
          sp.castShadow = true;
          sp.shadow.mapSize.set(q.carShadow, q.carShadow);
          sp.shadow.bias = -0.0012;
          sp.shadow.camera.near = 1;
          sp.shadow.camera.far = 150;
        }
        this.lights.push(sp);
      }
      this.tailLight = new THREE.PointLight(0xff2a1e, 0, 16, 2);
      this.tailLight.position.set(0, 1.0, -2.6);
      this.group.add(this.tailLight);
    }

    this.headGlow = makeGlowPoints(new Float32Array([0, 1, 2.5, 0, 1, 2.5]), 0xffe6bd, 3.4, scene, 0);
    this.tailGlow = makeGlowPoints(new Float32Array([0, 1, -2.5, 0, 1, -2.5]), 0xff3a2a, 3.0, scene, 0);
    this.hp = this.headGlow.attr.array;
    this.tp = this.tailGlow.attr.array;
  }

  reset(x, z, h) {
    this.x = x; this.z = z; this.h = h;
    this.speed = 0; this.steer = 0; this.slip = 0;
    this.crashCool = 0;
  }

  update(dt, input, traffic, camShake) {
    const C = CFG;
    this.throttle = input.gas ? 1 : 0;
    const rev = input.brake && this.speed < 0.6;
    this.braking = input.brake && !rev;
    this.hand = input.hand;

    // ---- direção ----
    const steerTarget = (input.left ? 1 : 0) - (input.right ? 1 : 0);
    const spdF = clamp(Math.abs(this.speed) / C.MAX_SPEED, 0, 1);
    const authority = lerp(1, 0.42, spdF);
    this.steer = damp(this.steer, steerTarget * authority, 9, dt);

    // ---- aceleração ----
    const maxF = this.hand ? C.MAX_SPEED * 0.55 : C.MAX_SPEED;
    if (this.throttle) {
      this.speed += C.ACCEL * (1 - clamp(Math.abs(this.speed) / maxF, 0, 1) * 0.92) * dt;
    } else if (this.braking) {
      this.speed -= C.BRAKE * dt * Math.sign(this.speed || 1);
      if (Math.abs(this.speed) < 0.4) this.speed = 0;
    } else if (rev) {
      this.speed = Math.max(this.speed - C.ACCEL * 0.6 * dt, C.REVERSE_MAX);
    }
    // arrasto
    const drag = C.DRAG * this.speed * Math.abs(this.speed) * 0.02 + C.ROLL * Math.sign(this.speed);
    this.speed -= drag * dt;
    if (!this.throttle && !this.braking && !rev && Math.abs(this.speed) < 0.35) this.speed = 0;
    this.speed = clamp(this.speed, C.REVERSE_MAX, maxF);

    // ---- deriva (drift) ----
    const grip = this.hand ? 3.2 : 11;
    const slipTarget = this.hand && Math.abs(this.speed) > 6
      ? clamp(this.steer * Math.abs(this.speed) * 0.026, -0.55, 0.55) : 0;
    this.slip = damp(this.slip, slipTarget, grip, dt);

    // ---- integração ----
    const turn = this.steer * C.STEER_MAX * clamp(this.speed / 9, -1, 1) * dt *
      (1 - 0.35 * spdF);
    this.h += turn + this.slip * dt * 1.6;

    const moveH = this.h + this.slip * 0.55;
    const dx = Math.sin(moveH) * this.speed * dt;
    const dz = Math.cos(moveH) * this.speed * dt;
    const nx = this.x + dx, nz = this.z + dz;

    // ---- colisão com prédios ----
    let hitX = nx, hitZ = nz, crashed = 0;
    const hw = 1.35, hl = 2.55;
    const minX = nx - hw, maxX = nx + hw, minZ = nz - hl, maxZ = nz + hl;
    for (const c of this.city.colliders) {
      if (maxX < c.minX || minX > c.maxX || maxZ < c.minZ || minZ > c.maxZ) continue;
      const px1 = maxX - c.minX, px2 = c.maxX - minX;
      const pz1 = maxZ - c.minZ, pz2 = c.maxZ - minZ;
      const m = Math.min(px1, px2, pz1, pz2);
      if (m === px1) hitX = c.minX - hw;
      else if (m === px2) hitX = c.maxX + hw;
      else if (m === pz1) hitZ = c.minZ - hl;
      else hitZ = c.maxZ + hl;
      crashed = Math.abs(this.speed);
      break;
    }
    // limites do mundo
    const lim = CFG.HALF - 6;
    if (Math.abs(hitX) > lim) { hitX = Math.sign(hitX) * lim; crashed = Math.max(crashed, Math.abs(this.speed)); }
    if (Math.abs(hitZ) > lim) { hitZ = Math.sign(hitZ) * lim; crashed = Math.max(crashed, Math.abs(this.speed)); }

    // ---- colisão com o tráfego ----
    if (traffic && this.crashCool <= 0) {
      for (const car of traffic.cars) {
        const ddx = car.x - hitX, ddz = car.z - hitZ;
        const d2 = ddx * ddx + ddz * ddz;
        if (d2 < 15.5) {
          const d = Math.sqrt(d2) || 0.001;
          const push = (3.95 - d);
          hitX -= (ddx / d) * push;
          hitZ -= (ddz / d) * push;
          car.speed *= 0.35;
          car.s -= car.lane.dir * push * 0.8;
          crashed = Math.max(crashed, Math.abs(this.speed) * 0.9);
          break;
        }
      }
    }

    if (crashed > 5 && this.crashCool <= 0) {
      this.crashCool = 0.5;
      camShake && camShake(clamp(crashed / 26, 0.15, 1));
      this.audio && this.audio.crash(clamp(crashed / 30, 0.2, 1));
      this.speed *= -0.18;
      this.onCrash && this.onCrash(crashed);
    } else if (crashed > 0.5) {
      this.speed *= 0.55;
    }
    this.crashCool -= dt;

    this.x = hitX; this.z = hitZ;
    this.distance += Math.hypot(dx, dz);
    this.topSpeed = Math.max(this.topSpeed, Math.abs(this.speed));

    // ---- modelo ----
    this.group.position.set(this.x, 0, this.z);
    this.group.rotation.y = this.h;
    this.group.rotation.z = -this.steer * 0.045 * clamp(Math.abs(this.speed) / 14, 0, 1) - this.slip * 0.09;
    this.group.rotation.x = clamp((this.throttle ? -0.012 : 0) + (this.braking ? 0.02 : 0), -0.03, 0.03);

    const spin = this.speed * dt / 0.47;
    for (const w of this.wheels) {
      w.tire.rotation.x -= spin;
      w.rim.rotation.x -= spin;
      if (w.front) w.holder.rotation.y = this.steer * 0.52;
    }

    // ---- marcas de pneu / fumaça ----
    const drifting = Math.abs(this.slip) > 0.09 || (this.hand && Math.abs(this.speed) > 5) ||
      (this.braking && Math.abs(this.speed) > 12);
    if (drifting) {
      const bh = this.h;
      for (const [ox, oz] of [[0.95, -1.52], [-0.95, -1.52]]) {
        const wx = this.x + Math.cos(bh) * ox + Math.sin(bh) * oz;
        const wz = this.z - Math.sin(bh) * ox + Math.cos(bh) * oz;
        this.skid.add(wx, wz, bh, clamp(Math.abs(this.speed) / 22, 0.4, 1.4));
      }
      this.spray.emit(this.x, this.z, this.h, this.speed, 3);
    }
    this.skid.fade(dt);
    this.spray.update(dt);

    // ---- luzes ----
    const night = this.night === undefined ? 0 : this.night;
    const headI = 0.35 + night * 3.2;
    this.headMat.emissiveIntensity = headI;
    this.tailMat.emissiveIntensity = 0.35 + night * (this.braking ? 5.5 : 1.8);
    this.signMat.color.setScalar(0.25 + night * 1.6);
    for (const sp of this.lights) sp.intensity = night * (this.throttle ? 620 : 480);
    if (this.tailLight) this.tailLight.intensity = night * (this.braking ? 26 : 8);

    const cs = Math.cos(this.h), sn = Math.sin(this.h);
    this.hp[0] = this.x - cs * 0.66 + sn * 2.5; this.hp[1] = 1.0; this.hp[2] = this.z + sn * 0.66 + cs * 2.5;
    this.hp[3] = this.x + cs * 0.66 + sn * 2.5; this.hp[4] = 1.0; this.hp[5] = this.z - sn * 0.66 + cs * 2.5;
    this.tp[0] = this.x - cs * 0.64 - sn * 2.5; this.tp[1] = 1.02; this.tp[2] = this.z + sn * 0.64 - cs * 2.5;
    this.tp[3] = this.x + cs * 0.64 - sn * 2.5; this.tp[4] = 1.02; this.tp[5] = this.z - sn * 0.64 - cs * 2.5;
    this.headGlow.attr.needsUpdate = true;
    this.tailGlow.attr.needsUpdate = true;
    this.headGlow.setIntensity(night * 1.5);
    this.tailGlow.setIntensity((0.2 + night) * (this.braking ? 1.8 : 1));
    this.headGlow.setSize(3.2 + (this.throttle ? 0.5 : 0));

    // sombra bolha
    this.blob.mesh.position.set(this.x, 0.06, this.z);
    this.blob.mesh.rotation.z = -this.h;
    this.blob.set(0.62 + night * 0.2);

    // áudio do motor
    if (this.audio) {
      this.audio.engine(
        clamp(Math.abs(this.speed) / C.MAX_SPEED, 0, 1),
        this.throttle,
        drifting ? clamp(Math.abs(this.slip) * 3, 0, 1) : 0
      );
    }
    this.drifting = drifting;
  }

  kmh() { return Math.abs(this.speed) * 3.6; }
}

// ------------------------------------------------------------
//  sombra falsa (blob) + spray d'água
// ------------------------------------------------------------
function makeBlob(scene) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 31);
  g.addColorStop(0, 'rgba(0,0,0,0.8)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.34)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 8.2),
    new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0.7, fog: true })
  );
  m.rotation.x = -Math.PI / 2;
  scene.add(m);
  return { mesh: m, set(v) { m.material.opacity = clamp(v, 0, 1); } };
}

function makeSpray(scene, max = 90) {
  const pos = new Float32Array(max * 3);
  const g = new THREE.BufferGeometry();
  const attr = new THREE.BufferAttribute(pos, 3);
  attr.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('position', attr);
  const m = new THREE.PointsMaterial({
    size: 2.2, color: 0xbfc9d4, transparent: true, opacity: 0.0,
    depthWrite: false, blending: THREE.NormalBlending, sizeAttenuation: true, fog: true,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  scene.add(pts);
  const P = [];
  for (let i = 0; i < max; i++) P.push({ life: 0, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0 });
  let k = 0, used = 0;
  return {
    emit(x, z, h, speed, n) {
      for (let i = 0; i < n; i++) {
        const p = P[k = (k + 1) % max];
        const back = -2.4;
        p.x = x + Math.sin(h) * back + (Math.random() - 0.5) * 1.9;
        p.z = z + Math.cos(h) * back + (Math.random() - 0.5) * 1.9;
        p.y = 0.35;
        p.vx = -Math.sin(h) * speed * 0.12 + (Math.random() - 0.5) * 2;
        p.vz = -Math.cos(h) * speed * 0.12 + (Math.random() - 0.5) * 2;
        p.vy = 1.6 + Math.random() * 2.6;
        p.life = 0.5 + Math.random() * 0.45;
        used = Math.min(max, used + 1);
      }
    },
    update(dt) {
      let alive = 0;
      for (let i = 0; i < max; i++) {
        const p = P[i];
        if (p.life > 0) {
          p.life -= dt;
          p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
          p.vy -= 6.5 * dt; p.vx *= 0.96; p.vz *= 0.96;
          if (p.life > 0) alive++;
          pos[i * 3] = p.x; pos[i * 3 + 1] = Math.max(p.y, 0.05); pos[i * 3 + 2] = p.z;
        } else {
          pos[i * 3 + 1] = -99;
        }
      }
      attr.needsUpdate = true;
      m.opacity = clamp(alive / 26, 0, 0.55);
      pts.visible = alive > 0;
      void used;
    },
  };
}
