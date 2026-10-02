// utilitário compartilhado: nuvem de pontos aditiva (brilho barato)
import * as THREE from 'three';
import { clamp } from './config.js';
import { makeGlowTexture } from './textures.js';

let sharedGlow = null;

export function makeGlowPoints(positions, color, size, scene, opacity = 1) {
  if (!sharedGlow) sharedGlow = makeGlowTexture();
  const g = new THREE.BufferGeometry();
  const pos = positions instanceof Float32Array ? positions : new Float32Array(positions);
  const attr = new THREE.BufferAttribute(pos, 3);
  attr.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('position', attr);
  const m = new THREE.PointsMaterial({
    size, map: sharedGlow, color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    toneMapped: false, fog: true,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  scene.add(pts);
  return {
    mesh: pts,
    attr,
    setIntensity(v) { m.opacity = clamp(v, 0, 1.8); pts.visible = v > 0.02; },
    setSize(v) { m.size = v; },
    setColor(c) { m.color.copy(c); },
  };
}
