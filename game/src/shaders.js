export const vertexShader = `#version 300 es
precision highp float;
const vec2 TRIANGLE[3] = vec2[3](
  vec2(-1.0, -1.0),
  vec2( 3.0, -1.0),
  vec2(-1.0,  3.0)
);
void main() {
  gl_Position = vec4(TRIANGLE[gl_VertexID], 0.0, 1.0);
}`;

export const fragmentShader = `#version 300 es
precision highp float;
precision highp int;
out vec4 outColor;

uniform vec2 uResolution;
uniform vec3 uCamera;
uniform vec2 uAngles;
uniform float uTime;
uniform float uStride;
uniform float uDetail;
uniform float uSeed;

uniform float uCastleZ;
const float FAR_LIMIT = 145.0;

float hash11(float n) {
  return fract(sin(n * 127.1 + uSeed * 0.013) * 43758.5453123);
}
float hash21(vec2 p) {
  return fract(sin(dot(p + uSeed * 0.001, vec2(127.1, 311.7))) * 43758.5453123);
}
float cross2(vec2 a, vec2 b) { return a.x * b.y - a.y * b.x; }

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
float sdBox2(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}
float sdRoundBox2(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float sdCappedCylinder(vec3 p, float halfHeight, float radius) {
  vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(radius, halfHeight);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a;
  vec3 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
float sdConeY(vec3 p, float height, float baseRadius) {
  float side = length(p.xz) - baseRadius * clamp(0.5 - p.y / height, 0.0, 1.0);
  float cap = abs(p.y) - height * 0.5;
  return max(side, cap);
}
float sdSegment2(vec2 p, vec2 a, vec2 b, float radius) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.00001), 0.0, 1.0);
  return length(pa - ba * h) - radius;
}
float sdTriangle2(vec2 p, vec2 a, vec2 b, vec2 c) {
  float d = min(sdSegment2(p, a, b, 0.0), min(sdSegment2(p, b, c, 0.0), sdSegment2(p, c, a, 0.0)));
  float winding = sign(cross2(b - a, c - a));
  float e0 = winding * cross2(b - a, p - a);
  float e1 = winding * cross2(c - b, p - b);
  float e2 = winding * cross2(a - c, p - c);
  return min(e0, min(e1, e2)) >= 0.0 ? -d : d;
}
float sdTrianglePrism(vec3 p, float halfWidth, float height, float halfDepth) {
  float triangle = sdTriangle2(p.xy, vec2(-halfWidth, -height * 0.5), vec2(halfWidth, -height * 0.5), vec2(0.0, height * 0.5));
  vec2 d = vec2(triangle, abs(p.z) - halfDepth);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float pathCenter(float z) {
  return 0.86 * sin(z * 0.052) + 0.34 * sin(z * 0.117);
}

float treeShape(vec3 q, float height, float seed) {
  float angle = hash11(seed + 4.7) * 6.2831853;
  float ca = cos(angle);
  float sa = sin(angle);
  vec2 xz = vec2(ca * q.x - sa * q.z, sa * q.x + ca * q.z);
  q.x = xz.x;
  q.z = xz.y;

  float lean = (hash11(seed + 9.2) - 0.5) * 0.65;
  float d = sdCapsule(q, vec3(0.0, -0.35, 0.0), vec3(lean, height, 0.08), 0.20);
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float layer = 0.42 + fk * 0.15 + hash11(seed + fk * 5.0) * 0.06;
    float branchLen = 0.95 + hash11(seed + fk * 8.1 + 1.0) * 0.8;
    float a = fk * 2.0943951 + seed * 0.21;
    vec3 start = vec3(lean * layer, height * layer, 0.0);
    vec3 tip = start + vec3(cos(a) * branchLen, 0.38 + fk * 0.10, sin(a) * branchLen);
    d = min(d, sdCapsule(q, start, tip, 0.125 - fk * 0.018));
  }
  return d;
}

float mapTrees(vec3 p) {
  float result = 1000.0;
  float rowId = floor(p.z / 7.4);
  for (int row = -1; row <= 1; row++) {
    float cell = rowId + float(row);
    for (int sideIndex = 0; sideIndex < 2; sideIndex++) {
      float side = sideIndex == 0 ? -1.0 : 1.0;
      float seed = cell * 17.0 + side * 3.7;
      float tz = cell * 7.4 + 1.0 + hash11(seed + 1.0) * 3.5;
      if (tz < uCastleZ - 11.0) {
        float offset = 4.4 + hash11(seed + 2.0) * 2.8;
        float tx = pathCenter(tz) + side * offset;
        vec3 q = p - vec3(tx, 0.0, tz);
        if (abs(q.x) < 2.7 && abs(q.z) < 2.6 && q.y < 15.0) {
          float h = 8.0 + hash11(seed + 3.0) * 5.4;
          result = min(result, treeShape(q, h, seed));
        }
      }
    }
  }
  return result;
}

vec2 mapCastle(vec3 p) {
  float castleX = pathCenter(uCastleZ);
  vec3 q = p - vec3(castleX, 0.0, uCastleZ);
  float d = 1000.0;
  float material = 3.0;

  // Main curtain wall, the keep behind it, and five unequal towers.
  d = sdBox(q - vec3(0.0, 4.5, 0.0), vec3(11.0, 4.5, 0.92));
  d = min(d, sdBox(q - vec3(0.0, 8.0, 3.0), vec3(5.2, 8.0, 2.7)));

  for (int i = 0; i < 5; i++) {
    float x = -10.0 + float(i) * 5.0;
    float h = (i == 2) ? 21.0 : ((i == 0 || i == 4) ? 13.0 : 15.0);
    float z = (i == 2) ? 2.1 : -0.12;
    float radius = (i == 2) ? 1.55 : 1.48;
    float shaft = sdCappedCylinder(q - vec3(x, h * 0.5, z), h * 0.5, radius);
    d = min(d, shaft);
    float roofH = (i == 2) ? 6.2 : 4.4;
    float roof = sdConeY(q - vec3(x, h + roofH * 0.5 - 0.12, z), roofH, radius * 1.28);
    d = min(d, roof);
  }

  // Surface detail grows in world space as the player approaches the keep.
  float gable = sdTrianglePrism(q - vec3(0.0, 17.3, 5.5), 4.7, 8.8, 2.35);
  d = min(d, gable);
  vec2 hit = vec2(d, material);
  if (uDetail > 0.02) {
    vec3 crenelP = q;
    crenelP.x = mod(crenelP.x + 0.55, 1.10) - 0.55;
    float crenel = sdBox(crenelP - vec3(0.0, 9.0, -0.08), vec3(0.34, 0.42, 0.88) * uDetail);
    if (crenel < hit.x) hit = vec2(crenel, material);

    if (abs(q.x) < 12.0 && q.y > -0.5 && q.y < 24.0) {
      float repeatedX = mod(q.x + 0.90, 1.80) - 0.90;
      float wallWindow = sdBox(vec3(repeatedX, q.y - 4.1, q.z + 0.965), vec3(0.16, 0.72, 0.045) * uDetail);
      float wallArch = sdTrianglePrism(vec3(repeatedX, q.y - 5.02, q.z + 0.965), 0.16 * uDetail, 0.36 * uDetail, 0.05 * uDetail);
      float keepX = mod(q.x + 0.78, 1.56) - 0.78;
      float keepWindow = sdBox(vec3(keepX, q.y - 11.1, q.z - 0.255), vec3(0.16, 0.88, 0.045) * uDetail);
      float door = sdBox(q - vec3(0.0, 2.55, -0.97), vec3(1.28, 2.55, 0.055) * uDetail);
      float window = min(min(wallWindow, wallArch), min(keepWindow, door));
      if (window < hit.x) hit = vec2(window, 4.0);
    }
  }
  return hit;
}

vec2 mapScene(vec3 p) {
  vec2 result = vec2(p.y, 1.0); // unbroken soil plane
  if (p.y > -1.2 && p.y < 15.5 && abs(p.x - pathCenter(p.z)) < 17.5) {
    float trees = mapTrees(p);
    if (trees < result.x) result = vec2(trees, 2.0);
  }
  if (p.z > uCastleZ - 34.0 && p.z < uCastleZ + 24.0 && abs(p.x - pathCenter(uCastleZ)) < 25.0 && p.y < 30.0) {
    vec2 castle = mapCastle(p);
    if (castle.x < result.x) result = castle;
  }
  return result;
}

vec3 calcNormal(vec3 p) {
  const float e = 0.004;
  vec2 k = vec2(1.0, -1.0);
  return normalize(
    k.xyy * mapScene(p + k.xyy * e).x +
    k.yyx * mapScene(p + k.yyx * e).x +
    k.yxy * mapScene(p + k.yxy * e).x +
    k.xxx * mapScene(p + k.xxx * e).x
  );
}

float softShadow(vec3 ro, vec3 rd, float tMax) {
  float res = 1.0;
  float t = 0.045;
  for (int i = 0; i < 10; i++) {
    float h = mapScene(ro + rd * t).x;
    res = min(res, 9.0 * h / max(t, 0.02));
    t += clamp(h, 0.08, 1.65);
    if (res < 0.025 || t > tMax) break;
  }
  return clamp(res, 0.0, 1.0);
}

vec3 skyColor(vec3 rd) {
  float h = clamp(rd.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 zenith = mix(vec3(0.018, 0.030, 0.090), vec3(0.15, 0.105, 0.22), smoothstep(0.15, 0.68, h));
  vec3 horizon = mix(vec3(0.10, 0.13, 0.23), vec3(0.78, 0.245, 0.075), smoothstep(-0.13, 0.20, rd.y));
  vec3 sky = mix(horizon, zenith, smoothstep(0.02, 0.50, rd.y));
  float sunset = exp(-pow((rd.y - 0.105) * 7.0, 2.0)) * exp(-pow((rd.x + 0.12) * 1.7, 2.0));
  sky += vec3(0.64, 0.20, 0.035) * sunset * 0.55;
  float cloudNoise = sin(rd.x * 18.0 + sin(rd.z * 7.0) * 2.5 + uTime * 0.012) * sin(rd.y * 31.0 + rd.x * 4.0);
  float cloudBand = smoothstep(0.20, 0.82, cloudNoise) * (1.0 - smoothstep(0.22, 0.70, rd.y));
  sky = mix(sky, vec3(0.12, 0.105, 0.20), cloudBand * 0.32);
  vec3 sunDir = normalize(vec3(-0.08, 0.13, 1.0));
  float sun = pow(max(dot(rd, sunDir), 0.0), 180.0);
  float halo = pow(max(dot(rd, sunDir), 0.0), 16.0);
  sky += vec3(1.8, 0.74, 0.22) * sun + vec3(0.50, 0.16, 0.035) * halo;
  return sky;
}

vec3 groundAlbedo(vec3 p) {
  float pathDist = abs(p.x - pathCenter(p.z));
  float road = 1.0 - smoothstep(2.05, 2.64, pathDist);
  vec2 tile = vec2((p.x - pathCenter(p.z)) * 1.38, p.z * 1.52);
  float row = floor(tile.y);
  tile.x += mod(row, 2.0) * 0.5;
  vec2 cell = floor(tile);
  vec2 local = fract(tile);
  float edge = min(min(local.x, 1.0 - local.x), min(local.y, 1.0 - local.y));
  float grout = 1.0 - smoothstep(0.026, 0.075, edge);
  float stoneNoise = hash21(cell);
  vec3 stones = mix(vec3(0.105, 0.125, 0.17), vec3(0.245, 0.245, 0.26), stoneNoise);
  stones *= 0.78 + 0.30 * hash21(cell + 19.0);
  stones = mix(stones, vec3(0.030, 0.044, 0.071), grout * 0.80);
  float dirtNoise = hash21(floor(p.xz * 2.6));
  vec3 earth = mix(vec3(0.022, 0.040, 0.057), vec3(0.068, 0.083, 0.083), dirtNoise);
  float moss = smoothstep(0.74, 0.94, hash21(floor(p.xz * 4.1))) * 0.23;
  earth += vec3(0.035, 0.080, 0.050) * moss;
  float verge = smoothstep(2.25, 2.62, pathDist);
  return mix(stones, earth, max(1.0 - road, verge));
}

vec3 materialAlbedo(vec3 p, float material) {
  if (material < 1.5) return groundAlbedo(p);
  if (material < 2.5) {
    float bark = sin(p.y * 8.5 + sin(p.x * 2.0 + p.z) * 1.6) * 0.5 + 0.5;
    float barkPixel = hash21(floor(vec2(p.y * 5.0, p.x * 4.0 + p.z * 2.0)));
    return mix(vec3(0.016, 0.027, 0.047), vec3(0.080, 0.078, 0.095), bark * 0.46 + barkPixel * 0.20);
  }
  if (material < 3.5) {
    vec2 block = floor(vec2(p.x * 1.7, p.y * 1.45));
    vec2 local = fract(vec2(p.x * 1.7, p.y * 1.45));
    float seam = 1.0 - smoothstep(0.025, 0.075, min(min(local.x, 1.0 - local.x), min(local.y, 1.0 - local.y)));
    float stone = hash21(block + floor(p.z * 1.4));
    vec3 masonry = mix(vec3(0.045, 0.052, 0.083), vec3(0.155, 0.142, 0.16), stone);
    masonry *= 1.0 - seam * mix(0.55, 0.20, uDetail);
    float fineCut = step(0.90, hash21(floor(p.xy * 7.5))) * uDetail;
    masonry *= 1.0 - fineCut * 0.17;
    return masonry;
  }
  float windowCell = hash21(floor(vec2(p.x * 0.23, p.y * 0.18)));
  vec3 dark = vec3(0.008, 0.018, 0.040);
  float candle = smoothstep(0.76, 0.97, windowCell) * uDetail;
  return dark + vec3(0.76, 0.205, 0.035) * candle * (0.68 + 0.32 * sin(uTime * 3.2 + p.y));
}

vec3 renderWorld(vec2 screenUV, out float hitDistance, out vec3 rayDir) {
  float aspect = uResolution.x / uResolution.y;
  vec2 screen = (screenUV - 0.5) * vec2(aspect, 1.0);
  float yaw = uAngles.x;
  float pitch = uAngles.y;
  vec3 forward = normalize(vec3(sin(yaw) * cos(pitch), sin(pitch), cos(yaw) * cos(pitch)));
  vec3 right = normalize(vec3(cos(yaw), 0.0, -sin(yaw)));
  vec3 up = normalize(cross(forward, right));
  rayDir = normalize(forward + right * screen.x * 1.10 + up * screen.y * 1.10);

  float travel = 0.0;
  vec2 hit = vec2(0.0);
  bool found = false;
  for (int stepIndex = 0; stepIndex < 112; stepIndex++) {
    vec3 samplePoint = uCamera + rayDir * travel;
    hit = mapScene(samplePoint);
    if (hit.x < 0.0018) { found = true; break; }
    travel += max(hit.x * 0.86, 0.008);
    if (travel > FAR_LIMIT) break;
  }
  hitDistance = travel;
  vec3 background = skyColor(rayDir);
  if (!found || travel > FAR_LIMIT) return background;

  vec3 p = uCamera + rayDir * travel;
  vec3 n = calcNormal(p);
  float timeDrift = sin(uTime * 0.035) * 0.035;
  vec3 lightDir = normalize(vec3(-0.44 + timeDrift, 0.78, 0.49));
  float diffuse = max(dot(n, lightDir), 0.0);
  float steppedLight = floor((diffuse * 0.84 + 0.12) * 5.0) / 5.0;
  float shadow = travel < 52.0 ? softShadow(p + n * 0.045, lightDir, 20.0) : 0.84;
  vec3 ambient = mix(vec3(0.055, 0.074, 0.13), vec3(0.22, 0.205, 0.25), clamp(n.y * 0.72 + 0.23, 0.0, 1.0));
  vec3 warmLight = vec3(1.28, 0.72, 0.34);
  vec3 base = materialAlbedo(p, hit.y);
  vec3 color = base * (ambient + warmLight * steppedLight * shadow * 0.82);

  float rim = pow(1.0 - max(dot(n, -rayDir), 0.0), 3.0);
  color += vec3(0.105, 0.15, 0.29) * rim * 0.30;
  if (hit.y < 1.5) {
    float wet = pow(max(dot(reflect(-lightDir, n), -rayDir), 0.0), 22.0);
    color += vec3(0.74, 0.36, 0.12) * wet * 0.22;
  }
  if (hit.y > 3.5) color += vec3(1.2, 0.30, 0.045) * exp(-length(p.xz - vec2(pathCenter(uCastleZ), uCastleZ)) * 0.08) * 0.13;

  float sunShaft = pow(max(dot(rayDir, lightDir), 0.0), 20.0) * 0.07;
  color += vec3(1.0, 0.35, 0.08) * sunShaft;
  vec3 fogColor = skyColor(rayDir) * 0.78 + vec3(0.012, 0.018, 0.036);
  float density = 0.009 + 0.011 * exp(-max(p.y - 0.5, 0.0) * 0.48);
  float fog = 1.0 - exp(-travel * density);
  fog *= 0.92 + 0.08 * sin(p.z * 0.11 + uTime * 0.10);
  color = mix(color, fogColor, clamp(fog, 0.0, 0.90));
  return color;
}

float sdRotBox2(vec2 p, vec2 b, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  p = vec2(c * p.x + s * p.y, -s * p.x + c * p.y);
  return sdRoundBox2(p, b, min(b.x, b.y) * 0.20);
}
float bladeDistance(vec2 p, vec2 a, vec2 b, out float along, out float side, out float width) {
  vec2 axis = normalize(b - a);
  vec2 normal = vec2(-axis.y, axis.x);
  vec2 q = p - a;
  float len = length(b - a);
  along = dot(q, axis);
  side = dot(q, normal);
  float t = clamp(along / len, 0.0, 1.0);
  width = mix(0.043, 0.001, t);
  return max(max(-along, along - len), abs(side) - width);
}
float maskFor(float d) { return 1.0 - smoothstep(0.0, 0.0045, d); }
void paint(inout vec3 color, float d, vec3 ink) {
  color = mix(color, ink, maskFor(d));
}

vec3 drawKnight(vec3 color, vec2 p) {
  float stride = uStride;
  vec2 armP = p - vec2(0.010 * sin(stride), 0.009 * abs(sin(stride * 2.0)));

  // Arm silhouette, layered vambrace and shoulder plate.
  paint(color, sdRotBox2(armP - vec2(0.43, -0.405), vec2(0.178, 0.355), 0.36), vec3(0.012, 0.021, 0.038));
  paint(color, sdRotBox2(armP - vec2(0.43, -0.405), vec2(0.146, 0.326), 0.36), vec3(0.115, 0.158, 0.205));
  paint(color, sdRotBox2(armP - vec2(0.433, -0.410), vec2(0.096, 0.284), 0.36), vec3(0.205, 0.255, 0.295));
  paint(color, sdRotBox2(armP - vec2(0.44, -0.422), vec2(0.033, 0.25), 0.36), vec3(0.075, 0.112, 0.155));
  paint(color, sdRotBox2(armP - vec2(0.425, -0.29), vec2(0.139, 0.046), 0.36), vec3(0.035, 0.055, 0.080));
  paint(color, sdRotBox2(armP - vec2(0.43, -0.29), vec2(0.127, 0.019), 0.36), vec3(0.38, 0.315, 0.19));
  paint(color, sdRotBox2(armP - vec2(0.47, -0.47), vec2(0.133, 0.050), 0.36), vec3(0.035, 0.054, 0.078));
  paint(color, sdRotBox2(armP - vec2(0.47, -0.47), vec2(0.120, 0.020), 0.36), vec3(0.34, 0.285, 0.18));
  paint(color, sdRotBox2(armP - vec2(0.50, -0.505), vec2(0.226, 0.135), 0.25), vec3(0.012, 0.021, 0.036));
  paint(color, sdRotBox2(armP - vec2(0.50, -0.495), vec2(0.195, 0.108), 0.25), vec3(0.13, 0.18, 0.225));
  paint(color, sdRotBox2(armP - vec2(0.50, -0.478), vec2(0.145, 0.069), 0.25), vec3(0.23, 0.275, 0.30));
  paint(color, sdRotBox2(armP - vec2(0.50, -0.485), vec2(0.065, 0.015), 0.25), vec3(0.51, 0.35, 0.16));

  // Rivets catch the sword's warm light.
  float rivet1 = length(armP - vec2(0.365, -0.34)) - 0.012;
  float rivet2 = length(armP - vec2(0.51, -0.51)) - 0.012;
  paint(color, rivet1, vec3(0.84, 0.52, 0.20));
  paint(color, rivet2, vec3(0.84, 0.52, 0.20));

  // Hilt sits behind the hand; the hand is built from small plated shapes.
  vec2 bladeBase = vec2(0.205, -0.155);
  vec2 bladeTip = vec2(0.435, 0.420);
  vec2 swordAxis = normalize(bladeTip - bladeBase);
  vec2 gripEnd = bladeBase - swordAxis * 0.176;
  paint(color, sdSegment2(armP, gripEnd, bladeBase + swordAxis * 0.012, 0.030), vec3(0.025, 0.030, 0.040));
  paint(color, sdSegment2(armP, gripEnd, bladeBase + swordAxis * 0.012, 0.018), vec3(0.20, 0.105, 0.050));
  for (int i = 0; i < 4; i++) {
    float t = float(i) * 0.036 + 0.025;
    vec2 at = gripEnd + swordAxis * t;
    paint(color, sdSegment2(armP, at - vec2(0.012, 0.0), at + vec2(0.012, 0.0), 0.004), vec3(0.57, 0.36, 0.14));
  }
  paint(color, length(armP - gripEnd) - 0.027, vec3(0.055, 0.075, 0.10));
  paint(color, length(armP - gripEnd) - 0.014, vec3(0.72, 0.42, 0.13));

  paint(color, sdRotBox2(armP - vec2(0.222, -0.190), vec2(0.090, 0.094), -0.32), vec3(0.020, 0.031, 0.048));
  paint(color, sdRotBox2(armP - vec2(0.222, -0.180), vec2(0.071, 0.072), -0.32), vec3(0.21, 0.25, 0.27));
  paint(color, sdRotBox2(armP - vec2(0.258, -0.205), vec2(0.059, 0.026), 0.26), vec3(0.34, 0.35, 0.32));
  paint(color, sdRotBox2(armP - vec2(0.204, -0.237), vec2(0.061, 0.022), -0.04), vec3(0.28, 0.31, 0.31));

  vec2 guardNormal = vec2(-swordAxis.y, swordAxis.x);
  vec2 guardA = bladeBase - guardNormal * 0.133;
  vec2 guardB = bladeBase + guardNormal * 0.133;
  paint(color, sdSegment2(armP, guardA, guardB, 0.026), vec3(0.026, 0.031, 0.040));
  paint(color, sdSegment2(armP, guardA, guardB, 0.014), vec3(0.68, 0.38, 0.10));
  paint(color, sdSegment2(armP, guardA + swordAxis * 0.006, guardB + swordAxis * 0.006, 0.005), vec3(1.0, 0.70, 0.25));

  float along;
  float side;
  float bladeWidth;
  float blade = bladeDistance(armP, bladeBase, bladeTip, along, side, bladeWidth);
  paint(color, blade + 0.012, vec3(0.016, 0.028, 0.045));
  float inside = maskFor(blade);
  float edgeLight = smoothstep(bladeWidth * 0.72, bladeWidth * 0.91, abs(side));
  float centerLine = 1.0 - smoothstep(0.004, 0.018, abs(side));
  float bladePixel = floor(max(along, 0.0) * 64.0 + floor(armP.x * 40.0)) * 0.5;
  vec3 steel = mix(vec3(0.25, 0.39, 0.55), vec3(0.68, 0.76, 0.79), edgeLight);
  steel = mix(steel, vec3(1.0, 0.80, 0.39), edgeLight * 0.78);
  steel = mix(steel, vec3(0.90, 0.96, 0.91), centerLine * 0.82);
  steel *= 0.94 + 0.06 * sin(bladePixel);
  color = mix(color, steel, inside);
  float glow = exp(-max(blade, 0.0) * 52.0) * (0.12 + 0.025 * sin(uTime * 4.0));
  color += vec3(0.96, 0.40, 0.07) * glow;

  // A narrow fuller and bright tip make the blade read clearly at low resolution.
  float fuller = sdSegment2(armP, bladeBase + swordAxis * 0.10, bladeTip - swordAxis * 0.09, 0.0035);
  paint(color, fuller, vec3(0.20, 0.29, 0.39));
  return color;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float travel;
  vec3 ray;
  vec3 color = renderWorld(uv, travel, ray);

  vec2 pixel = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  color = drawKnight(color, pixel);

  // Sparse motes drift through the near fog. Their fixed world cells prevent visual popping.
  float motes = 0.0;
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float cell = floor((uCamera.z + fi * 2.7) / 18.0);
    float z = cell * 18.0 + mod(fi * 5.17 + 3.2, 16.0);
    vec3 mote = vec3(pathCenter(z) + (hash11(fi + cell * 9.0) - 0.5) * 9.0,
                     0.65 + hash11(fi + cell * 2.4) * 2.2,
                     z);
    mote.y += sin(uTime * 0.55 + fi * 2.3) * 0.18;
    vec3 toMote = mote - uCamera;
    float alongRay = dot(toMote, ray);
    float miss = length(toMote - ray * alongRay);
    if (alongRay > 0.0 && alongRay < min(travel, 36.0)) {
      motes += exp(-miss * miss * 95.0) * (0.08 + 0.12 * hash11(fi + cell * 4.0));
    }
  }
  color += vec3(0.95, 0.34, 0.055) * motes;

  float vignette = 1.0 - 0.34 * smoothstep(0.22, 0.88, length((uv - 0.5) * vec2(uResolution.x / uResolution.y, 0.90)));
  color *= vignette;
  float grain = hash21(floor(gl_FragCoord.xy) + floor(uTime * 9.0)) - 0.5;
  color += grain * 0.012;

  // Compact palette and gentle filmic mapping keep the image close to a crisp pixel-art plate.
  color = max(color, 0.0);
  color = color / (color + vec3(0.88));
  color = pow(color, vec3(0.4545));
  float levels = 27.0;
  color = floor(color * levels + 0.5) / levels;
  outColor = vec4(color, 1.0);
}`;
