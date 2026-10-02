/**
 * Continuous collision helpers for an oriented vehicle box against static AABBs.
 * Coordinates are canvas pixels. AABB colliders use { id, x, y, width, height }.
 */
const EPSILON = 1e-8;
const MIN_MOVE = 1e-7;
const MAX_ANGLE_STEP = .02;
const MAX_ANGLE_SLICES = 160;
const DEFAULT_MAX_IMPACTS = 4;

const dot = (a, b) => a.x * b.x + a.y * b.y;
const shortestAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));

function getAabb(obstacle) {
  if (!obstacle || !Number.isFinite(obstacle.x) || !Number.isFinite(obstacle.y)
    || !Number.isFinite(obstacle.width) || !Number.isFinite(obstacle.height)
    || obstacle.width <= 0 || obstacle.height <= 0) return null;
  return {
    left: obstacle.x,
    right: obstacle.x + obstacle.width,
    top: obstacle.y,
    bottom: obstacle.y + obstacle.height,
    centerX: obstacle.x + obstacle.width / 2,
    centerY: obstacle.y + obstacle.height / 2,
    halfWidth: obstacle.width / 2,
    halfHeight: obstacle.height / 2,
  };
}

function vehicleAxes(angle) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  return [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: cos, y: sin },
    { x: sin, y: -cos },
  ];
}

function projectedVehicleRadius(axis, angle, halfWidth, halfLength) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const widthAxis = { x: cos, y: sin };
  const lengthAxis = { x: sin, y: -cos };
  return halfWidth * Math.abs(dot(widthAxis, axis))
    + halfLength * Math.abs(dot(lengthAxis, axis));
}

function projectedAabbRadius(axis, aabb) {
  return aabb.halfWidth * Math.abs(axis.x) + aabb.halfHeight * Math.abs(axis.y);
}

function overlapOnAxis(center, angle, halfWidth, halfLength, aabb, axis, margin = 0) {
  const relative = {
    x: center.x - aabb.centerX,
    y: center.y - aabb.centerY,
  };
  const centerDistance = dot(relative, axis);
  const radius = projectedVehicleRadius(axis, angle, halfWidth, halfLength)
    + projectedAabbRadius(axis, aabb)
    + margin;
  const penetration = radius - Math.abs(centerDistance);
  if (penetration <= EPSILON) return null;
  const sign = centerDistance >= 0 ? 1 : -1;
  return {
    penetration,
    normal: { x: axis.x * sign, y: axis.y * sign },
  };
}

/** True when the oriented vehicle rectangle has positive-area overlap with an AABB. */
export function obbOverlapsAabb(pose, halfWidth, halfLength, obstacle, margin = 0) {
  const aabb = getAabb(obstacle);
  if (!aabb || !pose || !Number.isFinite(pose.x) || !Number.isFinite(pose.y)
    || !Number.isFinite(pose.angle) || !Number.isFinite(halfWidth) || !Number.isFinite(halfLength)) return false;
  for (const axis of vehicleAxes(pose.angle)) {
    if (!overlapOnAxis(pose, pose.angle, halfWidth, halfLength, aabb, axis, margin)) return false;
  }
  return true;
}

/**
 * Sweeps an oriented rectangle along a translation against one static AABB.
 * Returns the earliest time of impact in [0, 1], or null when there is no hit.
 */
export function sweepObbAabb(start, displacement, angle, halfWidth, halfLength, obstacle, margin = 0) {
  const aabb = getAabb(obstacle);
  if (!aabb || !start || !displacement || !Number.isFinite(start.x) || !Number.isFinite(start.y)
    || !Number.isFinite(displacement.x) || !Number.isFinite(displacement.y)
    || !Number.isFinite(angle) || !Number.isFinite(halfWidth) || !Number.isFinite(halfLength)) return null;

  const relative = { x: start.x - aabb.centerX, y: start.y - aabb.centerY };
  let entry = -Infinity;
  let exit = Infinity;
  let entryAxis = null;
  let entryVelocity = 0;

  for (const axis of vehicleAxes(angle)) {
    const position = dot(relative, axis);
    const velocity = dot(displacement, axis);
    const radius = projectedVehicleRadius(axis, angle, halfWidth, halfLength)
      + projectedAabbRadius(axis, aabb)
      + Math.max(0, margin);

    if (Math.abs(velocity) <= EPSILON) {
      if (Math.abs(position) > radius + EPSILON) return null;
      continue;
    }

    const first = (-radius - position) / velocity;
    const second = (radius - position) / velocity;
    const near = Math.min(first, second);
    const far = Math.max(first, second);
    if (near > entry) {
      entry = near;
      entryAxis = axis;
      entryVelocity = velocity;
    }
    exit = Math.min(exit, far);
    if (entry - exit > EPSILON) return null;
  }

  if (!entryAxis || entry < -EPSILON || entry > 1 + EPSILON || exit < -EPSILON) return null;
  const time = Math.max(0, Math.min(1, entry));
  const signedDistance = dot(relative, entryAxis) + entryVelocity * time;
  const side = Math.abs(signedDistance) > EPSILON ? Math.sign(signedDistance) : -Math.sign(entryVelocity);
  const normal = { x: entryAxis.x * side, y: entryAxis.y * side };
  // Touching while moving away or parallel is not a blocking impact.
  if (dot(displacement, normal) >= -EPSILON) return null;

  return { time, normal, obstacle };
}

function findEarliestHit(position, displacement, angle, halfWidth, halfLength, colliders, margin) {
  const radius = Math.hypot(halfWidth, halfLength) + margin;
  const minX = Math.min(position.x, position.x + displacement.x) - radius;
  const maxX = Math.max(position.x, position.x + displacement.x) + radius;
  const minY = Math.min(position.y, position.y + displacement.y) - radius;
  const maxY = Math.max(position.y, position.y + displacement.y) + radius;
  let earliest = null;

  for (const obstacle of colliders) {
    const aabb = getAabb(obstacle);
    if (!aabb || aabb.right < minX || aabb.left > maxX || aabb.bottom < minY || aabb.top > maxY) continue;
    const hit = sweepObbAabb(position, displacement, angle, halfWidth, halfLength, obstacle, margin);
    if (hit && (!earliest || hit.time < earliest.time)) earliest = hit;
  }
  return earliest;
}

function findSweptHits(position, displacement, angle, halfWidth, halfLength, colliders, margin) {
  const radius = Math.hypot(halfWidth, halfLength) + margin;
  const minX = Math.min(position.x, position.x + displacement.x) - radius;
  const maxX = Math.max(position.x, position.x + displacement.x) + radius;
  const minY = Math.min(position.y, position.y + displacement.y) - radius;
  const maxY = Math.max(position.y, position.y + displacement.y) + radius;
  const hits = [];

  for (const obstacle of colliders) {
    const aabb = getAabb(obstacle);
    if (!aabb || aabb.right < minX || aabb.left > maxX || aabb.bottom < minY || aabb.top > maxY) continue;
    const hit = sweepObbAabb(position, displacement, angle, halfWidth, halfLength, obstacle, margin);
    if (hit) hits.push(hit);
  }
  return hits.sort((a, b) => a.time - b.time);
}

function separateInitialOverlaps(position, angle, halfWidth, halfLength, colliders, skin, maxPasses = 8) {
  const contacts = [];
  for (let pass = 0; pass < maxPasses; pass += 1) {
    let best = null;
    for (const obstacle of colliders) {
      const aabb = getAabb(obstacle);
      if (!aabb) continue;
      let minimumOverlap = null;
      let separated = false;
      for (const axis of vehicleAxes(angle)) {
        const overlap = overlapOnAxis(position, angle, halfWidth, halfLength, aabb, axis);
        if (!overlap) {
          separated = true;
          break;
        }
        if (!minimumOverlap || overlap.penetration < minimumOverlap.penetration) minimumOverlap = overlap;
      }
      if (!separated && minimumOverlap && (!best || minimumOverlap.penetration < best.penetration)) {
        best = { ...minimumOverlap, obstacle };
      }
    }
    if (!best) break;
    const correction = best.penetration + skin;
    position.x += best.normal.x * correction;
    position.y += best.normal.y * correction;
    contacts.push({
      obstacle: best.obstacle,
      normal: best.normal,
      impactSpeed: 0,
      depenetration: correction,
    });
  }
  return contacts;
}

function dampVelocity(velocity, normal, restitution, tangentialFriction) {
  const normalSpeed = dot(velocity, normal);
  if (normalSpeed >= -EPSILON) return velocity;
  const tangent = {
    x: velocity.x - normal.x * normalSpeed,
    y: velocity.y - normal.y * normalSpeed,
  };
  const tangentScale = 1 - tangentialFriction;
  const reflectedNormalSpeed = -normalSpeed * restitution;
  return {
    x: tangent.x * tangentScale + normal.x * reflectedNormalSpeed,
    y: tangent.y * tangentScale + normal.y * reflectedNormalSpeed,
  };
}

/**
 * Resolves a vehicle's complete fixed-step motion, including rotation, against
 * static AABBs. Low colliders marked kind='curb' emit one step/bump event but do
 * not block the vehicle; all other colliders remain solid. Translation is swept
 * continuously with SAT, angular motion uses conservative slices, and solid
 * impacts slide along surfaces while initial overlaps are depenetrated.
 */
export function resolveVehicleMotion({
  x,
  y,
  startAngle,
  endAngle,
  dx,
  dy,
  dt,
  halfWidth,
  halfLength,
  colliders = [],
  skin = .2,
  restitution = .035,
  tangentialFriction = .08,
  maxImpacts = DEFAULT_MAX_IMPACTS,
} = {}) {
  const finiteInputs = [x, y, startAngle, endAngle, dx, dy, dt, halfWidth, halfLength].every(Number.isFinite);
  if (!finiteInputs || halfWidth <= 0 || halfLength <= 0 || !Array.isArray(colliders)) {
    throw new TypeError('resolveVehicleMotion received an invalid pose, extent, or collider list');
  }

  const safeSkin = Number.isFinite(skin) ? Math.max(0, skin) : .2;
  const safeRestitution = Number.isFinite(restitution) ? Math.max(0, Math.min(1, restitution)) : .035;
  const safeFriction = Number.isFinite(tangentialFriction) ? Math.max(0, Math.min(1, tangentialFriction)) : .08;
  const impactLimit = Number.isInteger(maxImpacts) ? Math.max(1, Math.min(12, maxImpacts)) : DEFAULT_MAX_IMPACTS;
  const position = { x, y };
  const curbs = colliders.filter((obstacle) => obstacle?.kind === 'curb');
  const solidColliders = colliders.filter((obstacle) => obstacle?.kind !== 'curb');
  const collisions = separateInitialOverlaps(position, startAngle, halfWidth, halfLength, solidColliders, safeSkin);
  const curbEvents = [];
  const contactedCurbs = new Set();
  const validStep = dt > 0;
  let velocity = validStep ? { x: dx / dt, y: dy / dt } : { x: 0, y: 0 };
  if (!Number.isFinite(velocity.x) || !Number.isFinite(velocity.y)) velocity = { x: 0, y: 0 };

  if (validStep) {
    const rotation = shortestAngle(endAngle - startAngle);
    const slices = Math.max(1, Math.min(MAX_ANGLE_SLICES, Math.ceil(Math.abs(rotation) / MAX_ANGLE_STEP)));
    const sliceTime = dt / slices;
    const cornerRadius = Math.hypot(halfWidth, halfLength);

    for (let slice = 0; slice < slices; slice += 1) {
      const sliceRotation = rotation / slices;
      const angleMid = startAngle + rotation * ((slice + .5) / slices);
      const angleEnd = startAngle + rotation * ((slice + 1) / slices);
      // Upper bound for corner travel relative to the midpoint orientation.
      const rotationMargin = 2 * cornerRadius * Math.sin(Math.abs(sliceRotation) / 4);
      let remainingTime = sliceTime;

      for (let impact = 0; impact < impactLimit && remainingTime > MIN_MOVE; impact += 1) {
        const movement = { x: velocity.x * remainingTime, y: velocity.y * remainingTime };
        if (Math.hypot(movement.x, movement.y) <= MIN_MOVE) break;
        const margin = safeSkin + rotationMargin;
        const hit = findEarliestHit(
          position,
          movement,
          angleMid,
          halfWidth,
          halfLength,
          solidColliders,
          margin,
        );
        const curbHits = findSweptHits(
          position,
          movement,
          angleMid,
          halfWidth,
          halfLength,
          curbs,
          margin,
        );
        for (const curbHit of curbHits) {
          if (hit && curbHit.time > hit.time + EPSILON) break;
          if (contactedCurbs.has(curbHit.obstacle)) continue;
          contactedCurbs.add(curbHit.obstacle);
          curbEvents.push({
            obstacle: curbHit.obstacle,
            normal: curbHit.normal,
            impactSpeed: Math.max(0, -dot(velocity, curbHit.normal)),
          });
        }
        if (!hit) {
          position.x += movement.x;
          position.y += movement.y;
          remainingTime = 0;
          break;
        }

        const impactSpeed = Math.max(0, -dot(velocity, hit.normal));
        const travelTime = remainingTime * hit.time;
        position.x += velocity.x * travelTime;
        position.y += velocity.y * travelTime;
        collisions.push({ obstacle: hit.obstacle, normal: hit.normal, impactSpeed, depenetration: 0 });
        velocity = dampVelocity(velocity, hit.normal, safeRestitution, safeFriction);
        remainingTime -= travelTime;

        // Re-sweep the remaining time after redirecting velocity so a car can
        // slide along this surface and still hit a second obstacle this tick.
      }

      collisions.push(...separateInitialOverlaps(position, angleEnd, halfWidth, halfLength, solidColliders, safeSkin));
    }
  }

  return { x: position.x, y: position.y, velocityX: velocity.x, velocityY: velocity.y, collisions, curbEvents };
}
