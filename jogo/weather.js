/** Lightweight, deterministic weather and foliage overlays for the top-down map. */
const WEATHER_CYCLE_MS = 120_000;
const WEATHER_KEYFRAMES = [
  { at: 0, rain: 0, fog: 0, wind: .12 },
  { at: .16, rain: 0, fog: 0, wind: .35 },
  { at: .28, rain: 0, fog: 0, wind: .78 },
  { at: .36, rain: .25, fog: 0, wind: .82 },
  { at: .47, rain: .9, fog: .02, wind: .92 },
  { at: .55, rain: 1, fog: .06, wind: .86 },
  { at: .64, rain: .6, fog: .18, wind: .7 },
  { at: .73, rain: .12, fog: .3, wind: .42 },
  { at: .82, rain: 0, fog: .22, wind: .3 },
  { at: .9, rain: 0, fog: .04, wind: .68 },
  { at: 1, rain: 0, fog: 0, wind: .12 },
];
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const wrap = (value, size) => ((value % size) + size) % size;
const smoothstep = (value) => value * value * (3 - 2 * value);

/** Return deterministic, smoothly blended rain, fog and wind intensities. */
export function getWeatherState(elapsed) {
  const clock = Number.isFinite(elapsed) ? elapsed : 0;
  const phase = wrap(clock, WEATHER_CYCLE_MS) / WEATHER_CYCLE_MS;
  let lower = WEATHER_KEYFRAMES[0];
  let upper = WEATHER_KEYFRAMES[WEATHER_KEYFRAMES.length - 1];
  for (let index = 1; index < WEATHER_KEYFRAMES.length; index += 1) {
    if (phase <= WEATHER_KEYFRAMES[index].at) {
      lower = WEATHER_KEYFRAMES[index - 1];
      upper = WEATHER_KEYFRAMES[index];
      break;
    }
  }

  const progress = (phase - lower.at) / Math.max(1e-9, upper.at - lower.at);
  const blend = smoothstep(clamp(progress, 0, 1));
  const rain = lower.rain + (upper.rain - lower.rain) * blend;
  const fog = lower.fog + (upper.fog - lower.fog) * blend;
  const wind = lower.wind + (upper.wind - lower.wind) * blend;
  const kind = rain > .55 ? 'rain' : fog > .16 && rain < .2 ? 'mist' : rain > .035 ? 'drizzle' : wind > .58 ? 'breeze' : 'clear';
  return { phase, rain, fog, wind, kind };
}

/** Draw pixel-scale rain, mist and wind-blown leaves without leaking canvas state. */
export function drawWeather(ctx, elapsed, width, height, weather = getWeatherState(elapsed)) {
  if (!ctx || typeof ctx.save !== 'function' || typeof ctx.restore !== 'function'
    || typeof ctx.fillRect !== 'function' || !Number.isFinite(width) || !Number.isFinite(height)
    || width <= 0 || height <= 0) return weather;

  const clock = Number.isFinite(elapsed) ? elapsed : 0;
  const rain = clamp(Number.isFinite(weather?.rain) ? weather.rain : 0, 0, 1);
  const fog = clamp(Number.isFinite(weather?.fog) ? weather.fog : 0, 0, 1);
  const wind = clamp(Number.isFinite(weather?.wind) ? weather.wind : 0, 0, 1);
  if (rain < .005 && fog < .005 && wind < .36) return weather;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  if (fog > .005) {
    ctx.globalAlpha = fog * .16;
    ctx.fillStyle = '#c5c8bf';
    ctx.fillRect(0, 0, width, height);
  }

  if (rain > .005) {
    ctx.globalAlpha = .22 + rain * .28;
    ctx.fillStyle = '#c6d6df';
    const count = Math.round(200 * rain);
    const drift = Math.floor(clock * (.012 + wind * .038));
    const fall = Math.floor(clock * .72);
    for (let index = 0; index < count; index += 1) {
      const x = wrap(index * 197 + drift, width);
      const y = wrap(index * 283 + fall, height);
      ctx.fillRect(x, y, index % 9 === 0 ? 2 : 1, 4 + (index % 4));
    }
  }

  const leafCount = wind < .36 ? 0 : Math.round(18 * ((wind - .36) / .64) * (1 - rain * .72));
  const leafColors = ['#a3a45d', '#bd8050', '#778c54', '#b6a05d'];
  ctx.globalAlpha = .72;
  for (let index = 0; index < leafCount; index += 1) {
    const drift = Math.floor(clock * (.018 + wind * .09));
    const fall = Math.floor(clock * (.025 + wind * .035));
    const x = wrap(index * 113 + drift, width);
    const y = wrap(index * 157 + fall, height);
    ctx.fillStyle = leafColors[index % leafColors.length];
    ctx.fillRect(x, y, 3, 1);
    ctx.fillRect(wrap(x + 1, width), wrap(y + 1, height), 1, 2);
  }
  ctx.restore();
  return weather;
}
