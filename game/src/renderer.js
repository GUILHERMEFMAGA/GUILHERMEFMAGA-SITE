import { fragmentShader, vertexShader } from './shaders.js';

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('The browser could not allocate a WebGL shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Unknown shader compilation error.';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
  const program = gl.createProgram();
  if (!program) throw new Error('The browser could not allocate a WebGL program.');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || 'Unknown shader link error.';
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    if (!this.gl) throw new Error('WebGL 2 is unavailable. Try a current version of Chrome, Edge, Firefox, or Safari.');

    const gl = this.gl;
    this.program = createProgram(gl);
    this.uniforms = Object.fromEntries([
      'uResolution', 'uCamera', 'uAngles', 'uTime', 'uStride', 'uDetail', 'uSeed', 'uCastleZ',
    ].map((name) => [name, gl.getUniformLocation(this.program, name)]));
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    gl.useProgram(this.program);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const scale = Math.min(0.54, 760 / rect.width, 440 / rect.height);
    const width = Math.max(160, Math.round(rect.width * scale));
    const height = Math.max(160, Math.round(rect.height * scale));
    if (this.canvas.width === width && this.canvas.height === height) return;
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  render(frame) {
    const gl = this.gl;
    const u = this.uniforms;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.uniform2f(u.uResolution, this.canvas.width, this.canvas.height);
    gl.uniform3f(u.uCamera, frame.x, frame.cameraY, frame.z);
    gl.uniform2f(u.uAngles, frame.yaw, frame.pitch);
    gl.uniform1f(u.uTime, frame.time);
    gl.uniform1f(u.uStride, frame.stride);
    gl.uniform1f(u.uDetail, frame.detail);
    gl.uniform1f(u.uSeed, frame.seed);
    gl.uniform1f(u.uCastleZ, frame.castleZ);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    this.resizeObserver?.disconnect();
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteProgram(this.program);
  }
}
