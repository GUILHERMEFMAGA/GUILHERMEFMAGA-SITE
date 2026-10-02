/**
 * Iluminação leve para o mundo em pixel art.
 * A posição aparente do sol percorre o céu em ciclo contínuo; o brilho é aplicado
 * somente à rua e ao sedã, mantendo legíveis os detalhes escuros da referência.
 */
const TAU = Math.PI * 2;
const LIGHT_CYCLE_MS = 150_000;
const clampLight = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

/** Retorna posição, temperatura e intensidade da luz para o instante do jogo. */
export function getSunlight(elapsed, width, height, road) {
  const phase = ((elapsed % LIGHT_CYCLE_MS) / LIGHT_CYCLE_MS) * TAU;
  const daylight = .5 + .5 * Math.sin(phase - Math.PI / 2);
  const x = width / 2 + Math.cos(phase) * width * .43;
  const y = height * (.2 + (.5 + .5 * Math.sin(phase)) * .58);
  return {
    x: clampLight(x, road.left, road.right),
    y: clampLight(y, 0, height),
    phase,
    intensity: .28 + daylight * .72,
    warmth: .5 + .5 * Math.sin(phase + .55),
  };
}

/** Desenha reflexos estreitos e animados no asfalto sem cobrir a cena-base. */
export function drawStreetLighting(ctx, elapsed, width, height, road) {
  const sun = getSunlight(elapsed, width, height, road);
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
  ctx.fillRect(road.left, 0, road.right - road.left, height);

  const roadCenter = (road.left + road.right) / 2;
  const reflectedX = roadCenter + (sun.x - roadCenter) * .16;
  for (let index = 0; index < 8; index += 1) {
    const y = (index * 137 + elapsed * .026) % height;
    const drift = Math.sin(elapsed * .0007 + index * 1.8) * 27;
    const pulse = .45 + .55 * Math.sin(elapsed * .002 + index * 1.4) ** 2;
    ctx.globalAlpha = .38 + pulse * .42;
    ctx.fillStyle = `rgba(255, ${green}, 183, ${.13 * sun.intensity})`;
    ctx.fillRect(Math.round(reflectedX + drift), Math.round(y), index % 3 === 0 ? 2 : 1, 5 + (index % 4) * 2);
  }
  ctx.restore();
  return sun;
}

/** Adiciona pequenos brilhos no capô e na lateral voltada para o sol. */
export function drawCarHighlights(ctx, car, sun) {
  if (!sun || !Number.isFinite(car.x) || !Number.isFinite(car.y)) return;
  const litSide = sun.x < car.x ? -1 : 1;
  ctx.save();
  ctx.translate(Math.round(car.x), Math.round(car.y));
  ctx.rotate(car.angle);
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = .55 + sun.intensity * .35;
  ctx.fillStyle = `rgba(255, 226, 162, ${.15 + sun.warmth * .1})`;
  ctx.fillRect(litSide < 0 ? -54 : 52, -79, 2, 122);
  ctx.fillRect(litSide < 0 ? -33 : 8, -105, 25, 2);
  ctx.restore();
}
