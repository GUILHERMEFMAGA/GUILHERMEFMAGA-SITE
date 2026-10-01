// =====================================================================
// RENDERIZADOR 3D — mundo instanciado, ciclo dia/noite, clima volumétrico,
// iluminação urbana, telões animados, água, vegetação e LOD.
// =====================================================================
import * as THREE from '../../vendor/three.module.js';
import { clamp, faixa, chance, escolher, lerp } from '../util/nucleo.js';
import { TAM_MUNDO, TIPOS, DISTRITOS } from './gerador.js';

const COR_CEU_DIA = new THREE.Color(0x87b6e8);
const COR_CEU_NOITE = new THREE.Color(0x070b16);
const COR_CEU_POR_SOL = new THREE.Color(0xff9a52);
const COR_NEBLINA_DIA = new THREE.Color(0xa8c4de);
const COR_NEBLINA_NOITE = new THREE.Color(0x0a0f1c);

export class Renderizador {
  constructor(jogo, canvas) {
    this.jogo = jogo;
    this.canvas = canvas;
    this.relogioLuz = 0;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.cena = new THREE.Scene();
    this.cena.fog = new THREE.Fog(COR_NEBLINA_DIA.getHex(), 180, 1500);

    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.3, 6000);
    this.camera.position.set(0, 12, 20);

    this.orbita = { dist: 9, altura: 3.4, yaw: 0, pitch: 0.22, primeiraPessoa: false };

    this.luzSol = new THREE.DirectionalLight(0xfff2d8, 2.4);
    this.luzSol.castShadow = true;
    this.luzSol.shadow.mapSize.set(2048, 2048);
    const s = 140;
    this.luzSol.shadow.camera.left = -s; this.luzSol.shadow.camera.right = s;
    this.luzSol.shadow.camera.top = s; this.luzSol.shadow.camera.bottom = -s;
    this.luzSol.shadow.camera.near = 1; this.luzSol.shadow.camera.far = 600;
    this.luzSol.shadow.bias = -0.0008;
    this.cena.add(this.luzSol);
    this.cena.add(this.luzSol.target);

    this.luzAmbiente = new THREE.HemisphereLight(0xbcd7ff, 0x44403a, 0.9);
    this.cena.add(this.luzAmbiente);

    this.luzesRua = [];
    for (let i = 0; i < 6; i++) {
      const p = new THREE.PointLight(0xffc27a, 0, 55, 2);
      this.cena.add(p); this.luzesRua.push(p);
    }
    this.farol = new THREE.SpotLight(0xfff6e0, 0, 90, 0.5, 0.4, 1.4);
    this.cena.add(this.farol); this.cena.add(this.farol.target);

    window.addEventListener('resize', () => this.redimensionar());
  }

  redimensionar() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ==================================================================
  construir() {
    const mundo = this.jogo.mundo;
    this.criarCeu();
    this.criarChao(mundo);
    this.criarAgua(mundo);
    this.criarEdificios(mundo);
    this.criarVegetacao(mundo);
    this.criarPostes(mundo);
    this.criarTeloes(mundo);
    this.criarVeiculos();
    this.criarPessoas();
    this.criarAnimais();
    this.criarJogador();
    this.criarChuva();
  }

  // --- Céu ----------------------------------------------------------
  criarCeu() {
    const geo = new THREE.SphereGeometry(3400, 32, 20);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: {
        topo: { value: new THREE.Color(0x3b7fd4) },
        base: { value: new THREE.Color(0xbcd9f2) },
        solDir: { value: new THREE.Vector3(0, 1, 0) },
        corSol: { value: new THREE.Color(0xffd9a0) },
        intensidade: { value: 1 },
      },
      vertexShader: `varying vec3 vPos; void main(){ vPos = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 topo; uniform vec3 base; uniform vec3 solDir; uniform vec3 corSol; uniform float intensidade;
        varying vec3 vPos;
        void main(){
          float h = clamp(vPos.y*0.5+0.5, 0.0, 1.0);
          vec3 cor = mix(base, topo, pow(h, 0.65));
          float d = max(dot(normalize(vPos), normalize(solDir)), 0.0);
          cor += corSol * pow(d, 48.0) * 1.6 * intensidade;
          cor += corSol * pow(d, 6.0) * 0.18 * intensidade;
          // estrelas simples
          float est = step(0.9992, fract(sin(dot(vPos.xy*vec2(91.3,47.7)+vPos.z*13.1, vec2(12.98,78.23)))*43758.5453));
          cor += vec3(est) * (1.0 - intensidade) * 0.9;
          gl_FragColor = vec4(cor, 1.0);
        }`,
    });
    this.ceu = new THREE.Mesh(geo, mat);
    this.ceu.frustumCulled = false;
    this.cena.add(this.ceu);
  }

  // --- Chão (textura do mapa gerada por canvas) ----------------------
  criarChao(mundo) {
    const N = 4096;
    const cv = document.createElement('canvas');
    cv.width = N; cv.height = N;
    const g = cv.getContext('2d');
    const esc = N / TAM_MUNDO;
    const T = (v) => (v + TAM_MUNDO / 2) * esc;

    // base: campo
    g.fillStyle = '#4e6b3c'; g.fillRect(0, 0, N, N);
    // variação de terreno
    for (let i = 0; i < 2600; i++) {
      const x = Math.random() * N, y = Math.random() * N, r = 40 + Math.random() * 260;
      g.fillStyle = `rgba(${60 + Math.random() * 40 | 0},${85 + Math.random() * 40 | 0},${45 + Math.random() * 30 | 0},0.25)`;
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    // florestas
    for (const f of mundo.florestas) {
      const grd = g.createRadialGradient(T(f.x), T(f.z), f.r * esc * 0.2, T(f.x), T(f.z), f.r * esc);
      grd.addColorStop(0, 'rgba(32,58,30,0.95)'); grd.addColorStop(1, 'rgba(40,66,34,0)');
      g.fillStyle = grd; g.beginPath(); g.arc(T(f.x), T(f.z), f.r * esc, 0, 7); g.fill();
    }
    // praia
    g.fillStyle = '#d9c89a';
    g.fillRect(T(mundo.praia.x0), 0, N - T(mundo.praia.x0), N);
    g.fillStyle = '#1d4e6b';
    g.fillRect(T(mundo.praia.x0 + 150), 0, N - T(mundo.praia.x0 + 150), N);
    // lagos
    g.fillStyle = '#1f5674';
    for (const l of mundo.agua) { g.beginPath(); g.arc(T(l.x), T(l.z), l.r * esc, 0, 7); g.fill(); }
    // rio
    g.strokeStyle = '#1f5674'; g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 0; i < mundo.rio.length - 1; i++) {
      const a = mundo.rio[i], b = mundo.rio[i + 1];
      g.lineWidth = a.largura * esc;
      g.beginPath(); g.moveTo(T(a.x), T(a.z)); g.lineTo(T(b.x), T(b.z)); g.stroke();
    }
    // parques
    for (const p of mundo.parques) {
      g.fillStyle = '#3f6b36';
      g.fillRect(T(p.x - p.meia), T(p.z - p.meia), p.meia * 2 * esc, p.meia * 2 * esc);
      g.strokeStyle = '#9b8b63'; g.lineWidth = 2.2 * esc;
      g.beginPath(); g.arc(T(p.x), T(p.z), p.meia * 0.55 * esc, 0, 7); g.stroke();
    }
    // calçadas (traço largo claro) e asfalto
    for (const passo of [0, 1]) {
      for (const ar of mundo.arestas) {
        const a = mundo.nos[ar.a], b = mundo.nos[ar.b];
        g.lineWidth = (ar.largura + (passo === 0 ? 10 : 0)) * esc;
        g.strokeStyle = passo === 0 ? '#8e8e88' : (ar.tipo === 'rodovia' ? '#2b2b2f' : '#333338');
        g.beginPath(); g.moveTo(T(a.x), T(a.z)); g.lineTo(T(b.x), T(b.z)); g.stroke();
      }
    }
    // faixas centrais
    g.setLineDash([6 * esc, 7 * esc]);
    g.strokeStyle = 'rgba(230,220,140,0.75)';
    for (const ar of mundo.arestas) {
      if (ar.tipo === 'rua') continue;
      const a = mundo.nos[ar.a], b = mundo.nos[ar.b];
      g.lineWidth = Math.max(1, 0.5 * esc);
      g.beginPath(); g.moveTo(T(a.x), T(a.z)); g.lineTo(T(b.x), T(b.z)); g.stroke();
    }
    g.setLineDash([]);
    // lotes (piso/estacionamento)
    for (const l of mundo.lotes) {
      const t = l.tam * esc;
      g.save();
      g.translate(T(l.x), T(l.z)); g.rotate(l.rot);
      g.fillStyle = l.tipo === 'fazenda' ? '#6c6a3a' : '#5b5b58';
      g.fillRect(-t / 2 - 2, -t / 2 - 2, t + 4, t + 4);
      if (l.estacionamento) {
        g.fillStyle = '#44444a';
        g.fillRect(-t / 2, t * 0.2, t, t * 0.3);
      }
      g.restore();
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0.02 });
    this.matChao = mat;
    const chao = new THREE.Mesh(new THREE.PlaneGeometry(TAM_MUNDO, TAM_MUNDO, 1, 1), mat);
    chao.rotation.x = -Math.PI / 2;
    chao.receiveShadow = true;
    this.cena.add(chao);
    this.texturaMapa = cv;
  }

  criarAgua(mundo) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2b6f93, roughness: 0.08, metalness: 0.75, transparent: true, opacity: 0.82,
    });
    this.matAgua = mat;
    const grupo = new THREE.Group();
    for (const l of mundo.agua) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(l.r, 28), mat);
      m.rotation.x = -Math.PI / 2; m.position.set(l.x, 0.35, l.z);
      grupo.add(m);
    }
    // rio como faixa
    const forma = [];
    for (const p of mundo.rio) forma.push(new THREE.Vector3(p.x, 0.35, p.z));
    for (let i = 0; i < mundo.rio.length - 1; i++) {
      const a = mundo.rio[i], b = mundo.rio[i + 1];
      const comp = Math.hypot(b.x - a.x, b.z - a.z);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(comp * 1.1, a.largura), mat);
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = -Math.atan2(b.z - a.z, b.x - a.x);
      m.position.set((a.x + b.x) / 2, 0.35, (a.z + b.z) / 2);
      grupo.add(m);
    }
    // mar
    const mar = new THREE.Mesh(new THREE.PlaneGeometry(900, TAM_MUNDO), mat);
    mar.rotation.x = -Math.PI / 2;
    mar.position.set(mundo.praia.x0 + 450, 0.3, 0);
    grupo.add(mar);
    this.cena.add(grupo);
    this.grupoAgua = grupo;
  }

  // --- Texturas de fachada ------------------------------------------
  texturaFachada(cols, rows, corBase, corJanela) {
    const cv = document.createElement('canvas');
    cv.width = 128; cv.height = 128;
    const g = cv.getContext('2d');
    g.fillStyle = corBase; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 300; i++) {
      g.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`;
      g.fillRect(Math.random() * 128, Math.random() * 128, 6, 6);
    }
    const pw = 128 / cols, ph = 128 / rows;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const on = Math.random();
        g.fillStyle = corJanela;
        g.globalAlpha = 0.35 + on * 0.5;
        g.fillRect(i * pw + pw * 0.22, j * ph + ph * 0.2, pw * 0.56, ph * 0.52);
        g.globalAlpha = 1;
      }
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  texturaJanelasAcesas(cols, rows) {
    const cv = document.createElement('canvas');
    cv.width = 128; cv.height = 128;
    const g = cv.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, 128, 128);
    const pw = 128 / cols, ph = 128 / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      if (Math.random() < 0.45) continue;
      const q = Math.random();
      g.fillStyle = q < 0.6 ? '#ffd9a0' : q < 0.85 ? '#cfe4ff' : '#ffeec9';
      g.fillRect(i * pw + pw * 0.22, j * ph + ph * 0.2, pw * 0.56, ph * 0.52);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // --- Edifícios instanciados ---------------------------------------
  criarEdificios(mundo) {
    const classes = {
      baixo: { lotes: [], cols: 3, rows: 2, rep: [2, 1] },
      medio: { lotes: [], cols: 4, rows: 6, rep: [3, 4] },
      alto: { lotes: [], cols: 6, rows: 14, rep: [4, 10] },
    };
    for (const l of mundo.lotes) {
      const c = l.altura > 48 ? 'alto' : l.altura > 15 ? 'medio' : 'baixo';
      classes[c].lotes.push(l);
    }
    this.gruposEdificios = [];
    const dummy = new THREE.Object3D();
    const cor = new THREE.Color();

    for (const chave of Object.keys(classes)) {
      const def = classes[chave];
      if (!def.lotes.length) continue;
      const mat = new THREE.MeshStandardMaterial({
        map: this.texturaFachada(def.cols, def.rows, '#b9b9b4', '#6d7b86'),
        emissiveMap: this.texturaJanelasAcesas(def.cols, def.rows),
        emissive: new THREE.Color(0xffffff), emissiveIntensity: 0,
        roughness: 0.72, metalness: 0.08,
      });
      mat.map.repeat.set(def.rep[0], def.rep[1]);
      mat.emissiveMap.repeat.set(def.rep[0], def.rep[1]);
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const inst = new THREE.InstancedMesh(geo, mat, def.lotes.length);
      inst.castShadow = true; inst.receiveShadow = true;
      inst.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      for (let i = 0; i < def.lotes.length; i++) {
        const l = def.lotes[i];
        const larg = l.tam * 0.82;
        dummy.position.set(l.x, l.altura / 2, l.z);
        dummy.rotation.set(0, l.rot, 0);
        dummy.scale.set(larg, l.altura, larg * faixa(this.jogo.rng, 0.8, 1.05));
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
        cor.setHex(l.cor);
        cor.offsetHSL(0, faixa(this.jogo.rng, -0.03, 0.03), faixa(this.jogo.rng, -0.08, 0.08));
        inst.setColorAt(i, cor);
        l.indiceRender = { classe: chave, i };
      }
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      this.cena.add(inst);
      this.gruposEdificios.push(inst);
    }

    // telhados e detalhes para casas (volume extra)
    const casas = mundo.lotes.filter((l) => l.tipo === 'casa' || l.tipo === 'mansao' || l.tipo === 'fazenda');
    const geoT = new THREE.ConeGeometry(0.72, 0.5, 4);
    const matT = new THREE.MeshStandardMaterial({ color: 0x8a4b3c, roughness: 0.85 });
    const telhados = new THREE.InstancedMesh(geoT, matT, casas.length);
    telhados.castShadow = true;
    for (let i = 0; i < casas.length; i++) {
      const l = casas[i];
      const larg = l.tam * 0.82;
      dummy.position.set(l.x, l.altura + l.tam * 0.14, l.z);
      dummy.rotation.set(0, l.rot + Math.PI / 4, 0);
      dummy.scale.set(larg * 1.5, l.tam * 0.55, larg * 1.5);
      dummy.updateMatrix();
      telhados.setMatrixAt(i, dummy.matrix);
    }
    telhados.instanceMatrix.needsUpdate = true;
    this.cena.add(telhados);
  }

  // --- Vegetação -----------------------------------------------------
  criarVegetacao(mundo) {
    const rng = this.jogo.rng;
    const pos = [];
    for (const f of mundo.florestas) {
      const n = Math.round(f.r * f.r / 950);
      for (let i = 0; i < n; i++) {
        const ang = rng() * Math.PI * 2, r = Math.sqrt(rng()) * f.r;
        const x = f.x + Math.cos(ang) * r, z = f.z + Math.sin(ang) * r;
        if (mundo.emAgua(x, z, 6)) continue;
        pos.push([x, z, faixa(rng, 5, 13)]);
      }
    }
    for (const p of mundo.parques) {
      for (let i = 0; i < 16; i++) pos.push([p.x + faixa(rng, -p.meia, p.meia), p.z + faixa(rng, -p.meia, p.meia), faixa(rng, 4, 9)]);
    }
    // arborização urbana nas calçadas
    for (const ar of mundo.arestas) {
      if (ar.tipo === 'rodovia' || !chance(rng, 0.35)) continue;
      const a = mundo.nos[ar.a], b = mundo.nos[ar.b];
      const t = faixa(rng, 0.2, 0.8);
      const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1;
      const lado = chance(rng, 0.5) ? 1 : -1;
      const x = a.x + dx * t + (-dz / L) * (ar.largura / 2 + 3) * lado;
      const z = a.z + dz * t + (dx / L) * (ar.largura / 2 + 3) * lado;
      if (!mundo.emAgua(x, z, 3)) pos.push([x, z, faixa(rng, 4, 7)]);
    }

    const dummy = new THREE.Object3D();
    const geoTronco = new THREE.CylinderGeometry(0.18, 0.26, 1, 5);
    const matTronco = new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 1 });
    const geoCopa = new THREE.IcosahedronGeometry(1, 0);
    const matCopa = new THREE.MeshStandardMaterial({ color: 0x33612c, roughness: 0.95, flatShading: true });

    const troncos = new THREE.InstancedMesh(geoTronco, matTronco, pos.length);
    const copas = new THREE.InstancedMesh(geoCopa, matCopa, pos.length);
    copas.castShadow = true; troncos.castShadow = true;
    const cor = new THREE.Color();
    for (let i = 0; i < pos.length; i++) {
      const [x, z, h] = pos[i];
      dummy.position.set(x, h / 2, z); dummy.scale.set(1, h, 1); dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix(); troncos.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, h * 0.95, z);
      const s = h * faixa(this.jogo.rng, 0.3, 0.46);
      dummy.scale.set(s, s * 0.9, s);
      dummy.rotation.set(faixa(this.jogo.rng, 0, 1), faixa(this.jogo.rng, 0, 6), 0);
      dummy.updateMatrix(); copas.setMatrixAt(i, dummy.matrix);
      cor.setHSL(0.26 + faixa(this.jogo.rng, -0.04, 0.05), 0.42, faixa(this.jogo.rng, 0.17, 0.3));
      copas.setColorAt(i, cor);
    }
    troncos.instanceMatrix.needsUpdate = true; copas.instanceMatrix.needsUpdate = true;
    if (copas.instanceColor) copas.instanceColor.needsUpdate = true;
    this.cena.add(troncos); this.cena.add(copas);
    this.arvores = { troncos, copas, total: pos.length };
  }

  // --- Postes de iluminação -----------------------------------------
  criarPostes(mundo) {
    const pontos = [];
    for (const ar of mundo.arestas) {
      if (!chance(this.jogo.rng, ar.tipo === 'rua' ? 0.25 : 0.6)) continue;
      const a = mundo.nos[ar.a], b = mundo.nos[ar.b];
      const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1;
      for (const t of [0.3, 0.7]) {
        const lado = t > 0.5 ? 1 : -1;
        pontos.push([a.x + dx * t + (-dz / L) * (ar.largura / 2 + 1.2) * lado,
          a.z + dz * t + (dx / L) * (ar.largura / 2 + 1.2) * lado]);
      }
    }
    const dummy = new THREE.Object3D();
    const poste = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.12, 0.16, 8, 5),
      new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.7, metalness: 0.5 }), pontos.length);
    const lamp = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.42, 7, 6),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: new THREE.Color(0xffc27a), emissiveIntensity: 0 }), pontos.length);
    for (let i = 0; i < pontos.length; i++) {
      const [x, z] = pontos[i];
      dummy.position.set(x, 4, z); dummy.scale.set(1, 1, 1); dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix(); poste.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, 8.1, z); dummy.updateMatrix(); lamp.setMatrixAt(i, dummy.matrix);
    }
    poste.instanceMatrix.needsUpdate = true; lamp.instanceMatrix.needsUpdate = true;
    poste.castShadow = true;
    this.cena.add(poste); this.cena.add(lamp);
    this.postes = { poste, lamp, pontos };
  }

  // --- Telões e publicidade -----------------------------------------
  criarTeloes(mundo) {
    this.teloes = [];
    const candidatos = mundo.lotes.filter((l) => l.altura > 25 && (l.distrito === 'centro' || l.distrito === 'financeiro' || l.distrito === 'comercial'));
    const escolhidos = [];
    for (let i = 0; i < Math.min(26, candidatos.length); i++) escolhidos.push(escolher(this.jogo.rng, candidatos));
    for (const l of escolhidos) {
      const cv = document.createElement('canvas');
      cv.width = 512; cv.height = 256;
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
      const larg = l.tam * 0.7;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(larg, larg * 0.5), mat);
      const h = Math.min(l.altura * 0.8, 40);
      const ang = l.rot;
      m.position.set(l.x + Math.sin(ang) * (l.tam * 0.42), h, l.z + Math.cos(ang) * (l.tam * 0.42));
      m.rotation.y = ang;
      this.cena.add(m);
      this.teloes.push({ mesh: m, cv, ctx: cv.getContext('2d'), tex, fase: this.jogo.rng() * 100, lote: l });
    }
  }

  // --- Entidades móveis ---------------------------------------------
  criarVeiculos() {
    const MAX = 620;
    const matCarro = new THREE.MeshStandardMaterial({ roughness: 0.38, metalness: 0.65 });
    const matVidro = new THREE.MeshStandardMaterial({ color: 0x101418, roughness: 0.12, metalness: 0.9 });
    this.instCarro = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), matCarro, MAX);
    this.instCabine = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), matVidro, MAX);
    this.instCarro.castShadow = true;
    this.instCarro.frustumCulled = false; this.instCabine.frustumCulled = false;
    this.cena.add(this.instCarro); this.cena.add(this.instCabine);
    // faróis / lanternas
    const matLuz = new THREE.MeshBasicMaterial({ color: 0xfff1c9, toneMapped: false });
    this.instFarol = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), matLuz, MAX * 2);
    this.instFarol.frustumCulled = false;
    this.cena.add(this.instFarol);
  }

  criarPessoas() {
    const MAX = 460;
    this.instCorpo = new THREE.InstancedMesh(
      new THREE.CapsuleGeometry(0.26, 0.85, 3, 7),
      new THREE.MeshStandardMaterial({ roughness: 0.85 }), MAX);
    this.instCabeca = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.21, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xc89a72, roughness: 0.9 }), MAX);
    this.instCorpo.castShadow = true;
    this.instCorpo.frustumCulled = false; this.instCabeca.frustumCulled = false;
    this.cena.add(this.instCorpo); this.cena.add(this.instCabeca);
  }

  criarAnimais() {
    const MAX = 260;
    this.instAnimal = new THREE.InstancedMesh(
      new THREE.CapsuleGeometry(0.3, 0.7, 3, 6),
      new THREE.MeshStandardMaterial({ roughness: 0.95 }), MAX);
    this.instAnimal.frustumCulled = false;
    this.instAnimal.castShadow = true;
    this.cena.add(this.instAnimal);
  }

  criarJogador() {
    const g = new THREE.Group();
    const corpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.95, 4, 10),
      new THREE.MeshStandardMaterial({ color: 0x2f4f7f, roughness: 0.7 }));
    corpo.position.y = 1.0; corpo.castShadow = true;
    const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10),
      new THREE.MeshStandardMaterial({ color: 0xd9a97f, roughness: 0.85 }));
    cabeca.position.y = 1.75; cabeca.castShadow = true;
    g.add(corpo); g.add(cabeca);
    this.jogadorMesh = g;
    this.cena.add(g);

    // carro do jogador
    const carro = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.75, 4.5),
      new THREE.MeshStandardMaterial({ color: 0x8c2f2f, roughness: 0.3, metalness: 0.7 }));
    base.position.y = 0.72; base.castShadow = true;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.62, 2.1),
      new THREE.MeshStandardMaterial({ color: 0x14181d, roughness: 0.1, metalness: 0.9 }));
    cab.position.set(0, 1.35, -0.2);
    carro.add(base); carro.add(cab);
    for (const [dx, dz] of [[0.95, 1.5], [-0.95, 1.5], [0.95, -1.5], [-0.95, -1.5]]) {
      const roda = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.25, 10),
        new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.95 }));
      roda.rotation.z = Math.PI / 2; roda.position.set(dx, 0.36, dz);
      carro.add(roda);
    }
    carro.visible = false;
    this.carroMesh = carro;
    this.cena.add(carro);
  }

  criarChuva() {
    const N = 7000;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = faixa(this.jogo.rng, -45, 45);
      pos[i * 3 + 1] = faixa(this.jogo.rng, 0, 45);
      pos[i * 3 + 2] = faixa(this.jogo.rng, -45, 45);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xbcd4e6, size: 0.12, transparent: true, opacity: 0.55, depthWrite: false });
    this.chuva = new THREE.Points(geo, mat);
    this.chuva.frustumCulled = false;
    this.chuva.visible = false;
    this.cena.add(this.chuva);
  }

  // ==================================================================
  atualizar(dt) {
    const jogo = this.jogo, t = jogo.tempo, j = jogo.jogador;
    const clima = t.infoInterp();

    // ---- Sol / lua / céu ----
    const anguloSol = ((t.hora - 6) / 24) * Math.PI * 2;
    const altura = Math.sin(anguloSol);
    const dirSol = new THREE.Vector3(Math.cos(anguloSol) * 0.6, altura, Math.cos(anguloSol) * 0.4 + 0.3).normalize();
    const diurno = clamp(altura * 1.6 + 0.12, 0, 1);
    const crepusculo = clamp(1 - Math.abs(altura) * 5, 0, 1);

    this.luzSol.position.set(j.x + dirSol.x * 220, Math.max(14, dirSol.y * 220), j.z + dirSol.z * 220);
    this.luzSol.target.position.set(j.x, 0, j.z);
    this.luzSol.target.updateMatrixWorld();
    const nublado = 1 - clima.nuvem * 0.75;
    this.luzSol.intensity = (altura > 0 ? 2.6 * diurno : 0.05) * nublado;
    this.luzSol.color.setHex(crepusculo > 0.5 ? 0xffb070 : 0xfff2d8);
    this.luzAmbiente.intensity = lerp(0.18, 1.0, diurno) * (0.6 + clima.nuvem * 0.5);
    this.luzAmbiente.color.setHex(diurno > 0.3 ? 0xbcd7ff : 0x2a3550);

    const corCeu = new THREE.Color().copy(COR_CEU_NOITE).lerp(COR_CEU_DIA, diurno);
    corCeu.lerp(COR_CEU_POR_SOL, crepusculo * 0.55);
    corCeu.lerp(new THREE.Color(0x6a7079), clima.nuvem * 0.6);
    if (this.ceu) {
      this.ceu.material.uniforms.topo.value.copy(corCeu).multiplyScalar(0.85);
      this.ceu.material.uniforms.base.value.copy(corCeu).lerp(new THREE.Color(0xffffff), 0.25 * diurno);
      this.ceu.material.uniforms.solDir.value.copy(dirSol);
      this.ceu.material.uniforms.intensidade.value = diurno;
      this.ceu.position.set(j.x, 0, j.z);
    }
    const corNeb = new THREE.Color().copy(COR_NEBLINA_NOITE).lerp(COR_NEBLINA_DIA, diurno).lerp(corCeu, 0.5);
    this.cena.fog.color.copy(corNeb);
    this.cena.fog.near = lerp(140, 25, clima.neblina);
    this.cena.fog.far = lerp(1500, 220, clima.neblina) * (1 - clima.chuva * 0.35);
    this.renderer.setClearColor(corNeb);

    // Janelas acesas e postes
    const acende = clamp(1 - diurno * 2.2, 0, 1);
    for (const inst of this.gruposEdificios) inst.material.emissiveIntensity = acende * 1.1;
    if (this.postes) this.postes.lamp.material.emissiveIntensity = acende * 2.4;

    // Piso molhado
    if (this.matChao) {
      this.matChao.roughness = lerp(0.95, 0.22, t.molhado);
      this.matChao.metalness = lerp(0.02, 0.45, t.molhado);
    }
    if (this.matAgua) this.matAgua.opacity = 0.75 + clima.vento * 0.1;

    // Chuva
    if (this.chuva) {
      this.chuva.visible = clima.chuva > 0.08;
      if (this.chuva.visible) {
        this.chuva.position.set(j.x, 0, j.z);
        this.chuva.material.opacity = 0.2 + clima.chuva * 0.5;
        const p = this.chuva.geometry.attributes.position;
        const vel = 38 * dt * (0.7 + clima.chuva);
        for (let i = 0; i < p.count; i++) {
          let y = p.getY(i) - vel;
          if (y < 0) { y = 45; p.setX(i, faixa(this.jogo.rng, -45, 45)); p.setZ(i, faixa(this.jogo.rng, -45, 45)); }
          p.setY(i, y);
        }
        p.needsUpdate = true;
      }
    }

    this.atualizarVeiculos(acende);
    this.atualizarPessoas();
    this.atualizarAnimais();
    this.atualizarTeloes(dt);
    this.atualizarLuzesLocais(acende);
    this.atualizarJogador();
    this.atualizarCamera(dt);

    this.renderer.render(this.cena, this.camera);
  }

  atualizarVeiculos(acende) {
    const dummy = new THREE.Object3D();
    const cor = new THREE.Color();
    const veics = this.jogo.transito.veiculos;
    const px = this.jogo.jogador.x, pz = this.jogo.jogador.z;
    let n = 0, nf = 0;
    const MAX = this.instCarro.count;
    for (const v of veics) {
      if (n >= MAX) break;
      if (Math.abs(v.x - px) > 420 || Math.abs(v.z - pz) > 420) continue;
      const c = CLASSE_DIM[v.tipo] || CLASSE_DIM.carro;
      dummy.position.set(v.x, c.alt * 0.42, v.z);
      dummy.rotation.set(0, v.ang, v.danificado ? 0.12 : 0);
      dummy.scale.set(c.larg, c.alt * 0.62, c.comp);
      dummy.updateMatrix();
      this.instCarro.setMatrixAt(n, dummy.matrix);
      cor.setHex(v.emergencia ? (Math.floor(performance.now() / 180) % 2 ? 0x2244ff : 0xff2222) : v.cor);
      this.instCarro.setColorAt(n, cor);
      dummy.position.set(v.x, c.alt * 0.82, v.z);
      dummy.scale.set(c.larg * 0.88, c.alt * 0.38, c.comp * 0.45);
      dummy.updateMatrix();
      this.instCabine.setMatrixAt(n, dummy.matrix);
      // faróis
      if (acende > 0.2 && nf < this.instFarol.count - 2) {
        for (const lado of [-1, 1]) {
          const fx = v.x + Math.sin(v.ang) * c.comp * 0.48 + Math.cos(v.ang) * lado * c.larg * 0.35;
          const fz = v.z + Math.cos(v.ang) * c.comp * 0.48 - Math.sin(v.ang) * lado * c.larg * 0.35;
          dummy.position.set(fx, c.alt * 0.5, fz);
          dummy.rotation.set(0, v.ang, 0);
          dummy.scale.set(0.22, 0.14, 0.1);
          dummy.updateMatrix();
          this.instFarol.setMatrixAt(nf++, dummy.matrix);
        }
      }
      n++;
    }
    for (let i = n; i < MAX; i++) {
      dummy.scale.set(0, 0, 0); dummy.updateMatrix();
      this.instCarro.setMatrixAt(i, dummy.matrix); this.instCabine.setMatrixAt(i, dummy.matrix);
    }
    for (let i = nf; i < this.instFarol.count; i++) {
      dummy.scale.set(0, 0, 0); dummy.updateMatrix();
      this.instFarol.setMatrixAt(i, dummy.matrix);
    }
    this.instCarro.instanceMatrix.needsUpdate = true;
    this.instCabine.instanceMatrix.needsUpdate = true;
    this.instFarol.instanceMatrix.needsUpdate = true;
    if (this.instCarro.instanceColor) this.instCarro.instanceColor.needsUpdate = true;
  }

  atualizarPessoas() {
    const dummy = new THREE.Object3D();
    const cor = new THREE.Color();
    const lista = this.jogo.agentes.proximos;
    const MAX = this.instCorpo.count;
    const tempoAnim = performance.now() / 260;
    let n = 0;
    for (const a of lista) {
      if (n >= MAX) break;
      if (a.estado === 'dormindo' || a.estado === 'preso') continue;
      const andando = a.estado === 'viajando';
      const bob = andando ? Math.abs(Math.sin(tempoAnim + a.id)) * 0.09 : 0;
      dummy.position.set(a.x, 0.92 + bob, a.z);
      dummy.rotation.set(0, Math.atan2(a.dx - a.x, a.dz - a.z), andando ? Math.sin(tempoAnim * 2 + a.id) * 0.05 : 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      this.instCorpo.setMatrixAt(n, dummy.matrix);
      cor.setHSL((a.id % 20) / 20, 0.35, 0.42);
      this.instCorpo.setColorAt(n, cor);
      dummy.position.set(a.x, 1.72 + bob, a.z);
      dummy.updateMatrix();
      this.instCabeca.setMatrixAt(n, dummy.matrix);
      n++;
    }
    for (let i = n; i < MAX; i++) {
      dummy.scale.set(0, 0, 0); dummy.updateMatrix();
      this.instCorpo.setMatrixAt(i, dummy.matrix); this.instCabeca.setMatrixAt(i, dummy.matrix);
    }
    this.instCorpo.instanceMatrix.needsUpdate = true;
    this.instCabeca.instanceMatrix.needsUpdate = true;
    if (this.instCorpo.instanceColor) this.instCorpo.instanceColor.needsUpdate = true;
  }

  atualizarAnimais() {
    const dummy = new THREE.Object3D();
    const cor = new THREE.Color();
    const lista = this.jogo.natureza.proximos(this.jogo.jogador.x, this.jogo.jogador.z, 240);
    const MAX = this.instAnimal.count;
    let n = 0;
    for (const a of lista) {
      if (n >= MAX) break;
      const s = a.def.tam;
      dummy.position.set(a.x, s * 0.55, a.z);
      dummy.rotation.set(Math.PI / 2, 0, a.ang);
      dummy.scale.set(s, s * 1.3, s);
      dummy.updateMatrix();
      this.instAnimal.setMatrixAt(n, dummy.matrix);
      cor.setHex(a.def.cor);
      this.instAnimal.setColorAt(n, cor);
      n++;
    }
    for (let i = n; i < MAX; i++) { dummy.scale.set(0, 0, 0); dummy.updateMatrix(); this.instAnimal.setMatrixAt(i, dummy.matrix); }
    this.instAnimal.instanceMatrix.needsUpdate = true;
    if (this.instAnimal.instanceColor) this.instAnimal.instanceColor.needsUpdate = true;
  }

  atualizarTeloes(dt) {
    if (!this.teloes) return;
    const anuncios = this.jogo.noticias.anuncios;
    if (!anuncios.length) return;
    const px = this.jogo.jogador.x, pz = this.jogo.jogador.z;
    for (let i = 0; i < this.teloes.length; i++) {
      const tl = this.teloes[i];
      const d = Math.abs(tl.mesh.position.x - px) + Math.abs(tl.mesh.position.z - pz);
      tl.mesh.visible = d < 700;
      if (!tl.mesh.visible) continue;
      tl.fase += dt * 60;
      const an = anuncios[i % anuncios.length];
      const g = tl.ctx;
      const hue = (tl.fase * 0.6) % 360;
      g.fillStyle = `hsl(${hue}, 60%, 12%)`;
      g.fillRect(0, 0, 512, 256);
      g.fillStyle = `hsl(${(hue + 60) % 360}, 90%, 60%)`;
      g.fillRect(0, 200 + Math.sin(tl.fase * 0.05) * 8, 512, 10);
      g.font = 'bold 42px system-ui, sans-serif';
      g.fillStyle = '#ffffff';
      const texto = an.texto;
      const larg = g.measureText(texto).width;
      const x = 512 - ((tl.fase * 2.4) % (larg + 640));
      g.fillText(texto, x, 120);
      g.font = '22px system-ui, sans-serif';
      g.fillStyle = 'rgba(255,255,255,0.65)';
      g.fillText('CIDADE VIVA • ' + this.jogo.tempo.rotulo, 16, 40);
      tl.tex.needsUpdate = true;
    }
  }

  atualizarLuzesLocais(acende) {
    const j = this.jogo.jogador;
    if (!this.postes) return;
    // acende os 6 postes mais próximos do jogador
    const pts = this.postes.pontos;
    const candidatos = [];
    for (let i = 0; i < pts.length; i += 1) {
      const dx = pts[i][0] - j.x, dz = pts[i][1] - j.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < 70 * 70) candidatos.push([d2, pts[i]]);
    }
    candidatos.sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < this.luzesRua.length; i++) {
      const c = candidatos[i];
      const L = this.luzesRua[i];
      if (c && acende > 0.15) {
        L.position.set(c[1][0], 8, c[1][1]);
        L.intensity = acende * 60;
      } else L.intensity = 0;
    }
    // faróis do carro do jogador
    if (j.estado === 'dirigindo') {
      this.farol.position.set(j.x, 1.1, j.z);
      this.farol.target.position.set(j.x + Math.sin(j.ang) * 30, 0.2, j.z + Math.cos(j.ang) * 30);
      this.farol.target.updateMatrixWorld();
      this.farol.intensity = acende * 220;
    } else this.farol.intensity = 0;
  }

  atualizarJogador() {
    const j = this.jogo.jogador;
    const dirigindo = j.estado === 'dirigindo';
    this.jogadorMesh.visible = !dirigindo;
    this.jogadorMesh.position.set(j.x, 0, j.z);
    this.jogadorMesh.rotation.y = j.ang;
    this.carroMesh.visible = dirigindo;
    if (dirigindo) {
      this.carroMesh.position.set(j.x, 0, j.z);
      this.carroMesh.rotation.y = j.ang;
    }
  }

  atualizarCamera(dt) {
    const j = this.jogo.jogador;
    const o = this.orbita;
    const alvoY = j.estado === 'dirigindo' ? 1.5 : 1.6;
    if (o.primeiraPessoa) {
      this.camera.position.set(j.x, alvoY + 0.2, j.z);
      const lx = j.x + Math.sin(o.yaw) * 10;
      const lz = j.z + Math.cos(o.yaw) * 10;
      this.camera.lookAt(lx, alvoY + 0.2 - o.pitch * 10, lz);
      return;
    }
    const d = o.dist * (j.estado === 'dirigindo' ? 1.5 : 1);
    const alvo = new THREE.Vector3(
      j.x - Math.sin(o.yaw) * d * Math.cos(o.pitch),
      alvoY + o.altura + Math.sin(o.pitch) * d,
      j.z - Math.cos(o.yaw) * d * Math.cos(o.pitch));
    this.camera.position.lerp(alvo, clamp(dt * 9, 0, 1));
    this.camera.lookAt(j.x, alvoY + 0.6, j.z);
  }
}

const CLASSE_DIM = {
  carro: { comp: 4.4, larg: 1.9, alt: 1.45 }, suv: { comp: 4.9, larg: 2.0, alt: 1.75 },
  moto: { comp: 2.1, larg: 0.8, alt: 1.25 }, van: { comp: 5.6, larg: 2.1, alt: 2.3 },
  caminhao: { comp: 9.5, larg: 2.5, alt: 3.3 }, onibus: { comp: 12, larg: 2.6, alt: 3.1 },
  taxi: { comp: 4.5, larg: 1.9, alt: 1.5 }, policia: { comp: 4.8, larg: 2.0, alt: 1.6 },
  ambulancia: { comp: 6.0, larg: 2.2, alt: 2.5 }, bombeiro: { comp: 8.5, larg: 2.5, alt: 3.2 },
  guincho: { comp: 6.5, larg: 2.3, alt: 2.6 },
};
