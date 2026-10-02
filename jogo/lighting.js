/**
 * Lightweight, deterministic lighting for the top-down pixel-art streets.
 * The sun follows a continuous day/night cycle; diffuse tint, asphalt glints,
 * curbside lamp pools, and bar signage layer over the untouched artwork.
 */
const TAU = Math.PI * 2;
const LIGHT_CYCLE_MS = 150_000;
const clampLight = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

/** Return the sun's screen position, color temperature, and daylight fraction. */
export function getSunlight(elapsed, width, height, road) {
  const clock = Number.isFinite(elapsed) ? elapsed : 0;
  const phase = ((((clock % LIGHT_CYCLE_MS) + LIGHT_CYCLE_MS) % LIGHT_CYCLE_MS) / LIGHT_CYCLE_MS) * TAU;
  const daylight = .5 + .5 * Math.sin(phase - Math.PI / 2);
  const x = width / 2 + Math.cos(phase) * width * .43;
  const y = height * (.2 + (.5 + .5 * Math.sin(phase)) * .58);
  return {
    x: clampLight(x, road.left, road.right),
    y: clampLight(y, 0, height),
    phase,
    daylight,
    intensity: .28 + daylight * .72,
    warmth: .5 + .5 * Math.sin(phase + .55),
  };
}

function drawCurbsideLampPools(ctx, elapsed, height, road, night) {
  if (night <= .015) return;
  const clock = Number.isFinite(elapsed) ? elapsed : 0;
  const lampRows = 5;
  const spacing = height / lampRows;
  const radius = 92;
  const lampXPositions = [road.left - 18, road.right + 18];

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let row = 0; row < lampRows; row += 1) {
    const y = Math.round((row + .5) * spacing);
    for (let side = 0; side < lampXPositions.length; side += 1) {
      const x = Math.round(lampXPositions[side]);
      const flicker = .96 + .04 * Math.sin(clock * .0017 + row * 1.31 + side * .73);
      const pool = ctx.createRadialGradient(x, y, 3, x, y, radius);
      pool.addColorStop(0, 'rgba(255, 208, 142, .42)');
      pool.addColorStop(.38, 'rgba(255, 181, 108, .17)');
      pool.addColorStop(1, 'rgba(255, 166, 89, 0)');
      ctx.globalAlpha = night * .34 * flicker;
      ctx.fillStyle = pool;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  }
  ctx.restore();
}

function drawBarGlow(ctx, elapsed, width, height, road, night) {
  const flicker = .9 + .1 * Math.sin(elapsed * .006) ** 2;
  const glowX = width * .815;
  const glowY = height * .555;
  const emission = (.07 + night * .34) * flicker;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = emission;
  const facadeGlow = ctx.createRadialGradient(glowX, glowY, 3, glowX, glowY, 210);
  facadeGlow.addColorStop(0, 'rgba(255, 146, 58, .72)');
  facadeGlow.addColorStop(.34, 'rgba(241, 96, 50, .22)');
  facadeGlow.addColorStop(1, 'rgba(241, 96, 50, 0)');
  ctx.fillStyle = facadeGlow;
  ctx.fillRect(glowX - 210, glowY - 210, 420, 420);

  // Broken, narrow highlights suggest the neon awning reflected by damp asphalt.
  const reflectedX = road.right - 83;
  ctx.globalAlpha = .12 + night * .42;
  ctx.fillStyle = 'rgba(255, 151, 69, .45)';
  const pulse = .65 + .35 * Math.sin(elapsed * .003 + .7) ** 2;
  ctx.fillRect(Math.round(reflectedX), Math.round(glowY - 43), 2, Math.round(34 * pulse));
  ctx.fillRect(Math.round(reflectedX - 9), Math.round(glowY + 7), 1, Math.round(23 * pulse));
  ctx.fillRect(Math.round(reflectedX + 7), Math.round(glowY + 31), 2, Math.round(18 * pulse));
  ctx.restore();
}

/** Apply changing ambient light, sun glow, asphalt reflections, and scene lights. */
export function drawStreetLighting(ctx, elapsed, width, height, road, scene = {}) {
  const clock = Number.isFinite(elapsed) ? elapsed : 0;
  const sun = getSunlight(clock, width, height, road);
  const night = 1 - sun.daylight;

  // Very restrained blue ambient shift keeps rooftops readable at night while
  // allowing the hand-painted scene and its existing shadows to remain intact.
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = night * .18;
  ctx.fillStyle = '#172137';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(road.left, 0, road.right - road.left, height);
  ctx.clip();
  ctx.globalCompositeOperation = 'screen';

  const green = Math.round(206 + sun.warmth * 27);
  const glow = ctx.createRadialGradient(sun.x, sun.y, 8, sun.x, sun.y, 430);
  glow.addColorStop(0, `rgba(255, ${green}, 150, ${.12 * sun.intensity})`);
  glow.addColorStop(.42, `rgba(255, ${green}, 150, ${.045 * sun.intensity})`);
  glow.addColorStop(1, 'rgba(255, 220, 145, 0)');
  ctx.fillStyle = glow;
  ctx.globalAlpha = 1;
  ctx.fillRect(road.left, 0, road.right - road.left, height);

  const roadCenter = (road.left + road.right) / 2;
  const reflectedX = roadCenter + (sun.x - roadCenter) * .16;
  const wetness = .22 + night * .34;
  for (let index = 0; index < 8; index += 1) {
    const y = (index * 137 + clock * .026) % height;
    const drift = Math.sin(clock * .0007 + index * 1.8) * 27;
    const pulse = .45 + .55 * Math.sin(clock * .002 + index * 1.4) ** 2;
    ctx.globalAlpha = wetness * (.38 + pulse * .42);
    ctx.fillStyle = `rgba(255, ${green}, 183, ${.13 * sun.intensity})`;
    ctx.fillRect(Math.round(reflectedX + drift), Math.round(y), index % 3 === 0 ? 2 : 1, 5 + (index % 4) * 2);
  }
  ctx.restore();

  // The map artwork already places matching lamp posts along both curbs;
  // these restrained pools make their warm light visible after dusk.
  drawCurbsideLampPools(ctx, clock, height, road, night);

  const barLight = scene.bar
    ? { x: width * .815, y: height * .555, intensity: .07 + night * .34 }
    : null;
  if (scene.bar) drawBarGlow(ctx, clock, width, height, road, night);
  return { ...sun, night, barLight };
}

/** Add small, sun-facing pixel glints to the sedan's hood and flank. */
export function drawCarHighlights(ctx, car, sun) {
  if (!ctx || !car || !sun
    || !Number.isFinite(car.x) || !Number.isFinite(car.y) || !Number.isFinite(car.angle)
    || !Number.isFinite(sun.x) || !Number.isFinite(sun.intensity) || !Number.isFinite(sun.warmth)) return;
  const litSide = sun.x < car.x ? -1 : 1;
  const suspensionBounce = Math.sin((1 - clampLight(car.suspension || 0, 0, 1)) * Math.PI) * 1.5;
  const renderY = car.y - suspensionBounce;
  ctx.save();
  ctx.translate(Math.round(car.x), Math.round(renderY));
  ctx.rotate(car.angle);
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = .55 + sun.intensity * .35;
  ctx.fillStyle = `rgba(255, 226, 162, ${.15 + sun.warmth * .1})`;
  ctx.fillRect(litSide < 0 ? -54 : 52, -79, 2, 122);
  ctx.fillRect(litSide < 0 ? -33 : 8, -105, 25, 2);

  if (sun.barLight && Number.isFinite(sun.barLight.x) && Number.isFinite(sun.barLight.y)) {
    const distanceToBar = Math.hypot(car.x - sun.barLight.x, renderY - sun.barLight.y);
    const proximity = clampLight(1 - distanceToBar / 520, 0, 1);
    if (proximity > 0) {
      ctx.globalAlpha = proximity * sun.barLight.intensity * .75;
      ctx.fillStyle = 'rgba(255, 139, 62, .42)';
      ctx.fillRect(litSide < 0 ? -56 : 54, -35, 2, 62);
    }
  }
  ctx.restore();
}
