// ============================================================
//  CHUVA: riscas 3D, respingos no chão e gotas na "lente"
// ============================================================
import * as THREE from 'three';
import { clamp } from './config.js';

export class Rain {
  constructor(scene, count, splashCount = 240) {
    this.count = count;
    this.group = new THREE.Group();
    scene.add(this.group);

    // ---------- riscas ----------
    const pos = new Float32Array(count * 6);
    const vel = new Float32Array(count);
    const BOX = 170, TOP = 95;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * BOX;
      const y = Math.random() * TOP;
      const z = (Math.random() - 0.5) * BOX;
      const l = 1.4 + Math.random() * 2.4;
      const v = 78 + Math.random() * 48;
      vel[i] = v;
      const k = i * 6;
      pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
      pos[k + 3] = x; pos[k + 4] = y - l; pos[k + 5] = z;
    }
    this.vel = vel; this.len = BOX; this.top = TOP;
    const g = new THREE.BufferGeometry();
    this.attr = new THREE.BufferAttribute(pos, 3);
    this.attr.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.attr);
    const m = new THREE.LineBasicMaterial({
      color: 0xbcd4ee, transparent: true, opacity: 0.3, depthWrite: false, fog: false,
    });
    this.lines = new THREE.LineSegments(g, m);
    this.lines.frustumCulled = false;
    this.group.add(this.lines);

    // ---------- respingos ----------
    this.splashN = splashCount;
    if (splashCount > 0) {
      const sp = new Float32Array(splashCount * 3);
      for (let i = 0; i < splashCount; i++) sp[i * 3 + 1] = -99;
      const sg = new THREE.BufferGeometry();
      this.sAttr = new THREE.BufferAttribute(sp, 3);
      this.sAttr.setUsage(THREE.DynamicDrawUsage);
      sg.setAttribute('position', this.sAttr);
      this.sMat = new THREE.PointsMaterial({
        size: 0.9, color: 0xcfe0f2, transparent: true, opacity: 0.35,
        depthWrite: false, sizeAttenuation: true, fog: true,
      });
      this.splash = new THREE.Points(sg, this.sMat);
      this.splash.frustumCulled = false;
      this.group.add(this.splash);
      this.sLife = new Float32Array(splashCount);
      this.sK = 0;
    }

    // ---------- gotas na lente (tela) ----------
    this.lens = new THREE.Group();
    this.lensN = 90;
    const lp = new Float32Array(this.lensN * 3);
    this.lensData = [];
    for (let i = 0; i < this.lensN; i++) {
      lp[i * 3] = (Math.random() - 0.5) * 2;
      lp[i * 3 + 1] = (Math.random() - 0.5) * 2;
      lp[i * 3 + 2] = -1;
      this.lensData.push({ v: 0.12 + Math.random() * 0.5, ph: Math.random() * 10, s: 0.4 + Math.random() });
    }
    const lg = new THREE.BufferGeometry();
    this.lAttr = new THREE.BufferAttribute(lp, 3);
    this.lAttr.setUsage(THREE.DynamicDrawUsage);
    lg.setAttribute('position', this.lAttr);
    this.lMat = new THREE.PointsMaterial({
      size: 9, color: 0xdfeaff, transparent: true, opacity: 0.14,
      depthWrite: false, depthTest: false, sizeAttenuation: false, fog: false,
    });
    this.lensPts = new THREE.Points(lg, this.lMat);
    this.lensPts.frustumCulled = false;
    this.lensPts.renderOrder = 999;
    this.lens.add(this.lensPts);
  }

  attachLens(camera) { camera.add(this.lens); }

  setIntensity(v) {
    const k = clamp(v, 0, 1);
    this.lines.material.opacity = 0.3 * k;
    this.lines.visible = k > 0.02;
    if (this.splash) { this.sMat.opacity = 0.38 * k; this.splash.visible = k > 0.02; }
    this.lMat.opacity = 0.15 * k;
    this.lensPts.visible = k > 0.02;
    this.k = k;
  }

  update(dt, time, camPos) {
    const k = this.k === undefined ? 1 : this.k;
    if (k <= 0.02) return;
    const a = this.attr.array;
    const BOX = this.len;
    const active = Math.floor(this.count * (0.35 + 0.65 * k));
    for (let i = 0; i < active; i++) {
      const d = this.vel[i] * dt;
      const k6 = i * 6;
      a[k6 + 1] -= d; a[k6 + 4] -= d;
      if (a[k6 + 1] < 0.2) {
        const x = (Math.random() - 0.5) * BOX;
        const z = (Math.random() - 0.5) * BOX;
        const y = this.top * (0.6 + Math.random() * 0.4);
        const l = 1.4 + Math.random() * 2.4;
        a[k6] = x; a[k6 + 1] = y; a[k6 + 2] = z;
        a[k6 + 3] = x; a[k6 + 4] = y - l; a[k6 + 5] = z;
        if (this.splash && Math.random() < 0.2) this.addSplash(x, z);
      }
    }
    // esconde o excedente
    for (let i = active; i < this.count; i++) {
      const k6 = i * 6;
      if (a[k6 + 1] > -500) { a[k6 + 1] = -999; a[k6 + 4] = -999; }
    }
    this.attr.needsUpdate = true;
    this.group.position.set(camPos.x, 0, camPos.z);

    // respingos
    if (this.splash) {
      const sp = this.sAttr.array;
      for (let i = 0; i < this.splashN; i++) {
        if (this.sLife[i] > 0) {
          this.sLife[i] -= dt * 3.4;
          const y = (1 - this.sLife[i]) * 0.85;
          sp[i * 3 + 1] = y > 0 ? y : -99;
        } else sp[i * 3 + 1] = -99;
      }
      this.sAttr.needsUpdate = true;
    }

    // gotas na lente
    const lp = this.lAttr.array;
    for (let i = 0; i < this.lensN; i++) {
      const d = this.lensData[i];
      lp[i * 3 + 1] -= d.v * dt * 0.55;
      lp[i * 3] += Math.sin(time * 1.6 + d.ph) * dt * 0.02;
      if (lp[i * 3 + 1] < -1.05) {
        lp[i * 3 + 1] = 1.05;
        lp[i * 3] = (Math.random() - 0.5) * 2;
      }
    }
    this.lAttr.needsUpdate = true;
  }

  addSplash(x, z) {
    const i = this.sK = (this.sK + 1) % this.splashN;
    const sp = this.sAttr.array;
    sp[i * 3] = x + (Math.random() - 0.5) * 0.7;
    sp[i * 3 + 1] = 0.12;
    sp[i * 3 + 2] = z + (Math.random() - 0.5) * 0.7;
    this.sLife[i] = 1;
  }
}
