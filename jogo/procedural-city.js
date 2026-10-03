const TAU = Math.PI * 2;
const DISTRICT_NAMES = [
  'VILA DOS IPÊS',
  'BAIRRO DO CEDRO',
  'JARDINS DA ESTAÇÃO',
  'AVENIDA DAS OFICINAS',
  'QUADRAS DO MERCADO',
  'PARQUE DA VÁRZEA',
  'MORRO DA PEDREIRA',
  'VILA NOVA AURORA',
];

const BUILDING_STYLES = [
  { name: 'terracotta', roof: '#895a43', roofLight: '#ad7958', roofDark: '#5f4438', wall: '#817969', trim: '#343530', window: '#394b50', pattern: 'tile' },
  { name: 'metal', roof: '#6c7471', roofLight: '#a09e8e', roofDark: '#4c514f', wall: '#847f70', trim: '#30332f', window: '#34454a', pattern: 'metal' },
  { name: 'concrete', roof: '#777970', roofLight: '#aaa795', roofDark: '#555850', wall: '#817c6d', trim: '#31332f', window: '#36474a', pattern: 'grid' },
  { name: 'blue-tile', roof: '#52636a', roofLight: '#829096', roofDark: '#39484e', wall: '#887e70', trim: '#30322f', window: '#35494e', pattern: 'tile' },
  { name: 'old-brick', roof: '#785044', roofLight: '#9a6955', roofDark: '#523a34', wall: '#857766', trim: '#34312c', window: '#38464b', pattern: 'tile' },
  { name: 'modern', roof: '#847f76', roofLight: '#b5aa96', roofDark: '#5b5b55', wall: '#777c76', trim: '#343733', window: '#344b51', pattern: 'grid' },
];

const TREE_COLORS = [
  ['#43553a', '#62784a', '#84915a', '#a29b63'],
  ['#3e5039', '#536a43', '#758351', '#9c9760'],
  ['#4c5737', '#687548', '#899052', '#b0a06a'],
];

function createRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function integer(random, minimum, maximum) {
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function roadExtents(centerAt, startY, endY, samples, halfWidth, sidewalkWidth) {
  let minimumCenter = Infinity;
  let maximumCenter = -Infinity;
  for (let sample = 0; sample <= samples; sample += 1) {
    const y = startY + (endY - startY) * sample / samples;
    const center = centerAt(y);
    minimumCenter = Math.min(minimumCenter, center);
    maximumCenter = Math.max(maximumCenter, center);
  }
  return {
    westBuildingEdge: minimumCenter - halfWidth - sidewalkWidth - 12,
    eastBuildingEdge: maximumCenter + halfWidth + sidewalkWidth + 12,
  };
}

/** Create a deterministic city block; the same world index always gives the same layout. */
export function createStreetLayout(worldIndex, options = {}) {
  const width = Number.isFinite(options.width) && options.width > 0 ? options.width : 1568;
  const height = Number.isFinite(options.height) && options.height > 0 ? options.height : 960;
  const roadLeft = Number.isFinite(options.roadLeft) ? options.roadLeft : 548;
  const roadRight = Number.isFinite(options.roadRight) ? options.roadRight : 1018;
  const roadCenter = (roadLeft + roadRight) / 2;
  const halfRoad = (roadRight - roadLeft) / 2;
  const sidewalkWidth = 136;
  const sectionId = Number.isFinite(worldIndex) ? Math.trunc(worldIndex) : 0;
  const seed = (Math.imul(sectionId | 0, 0x45d9f3b) ^ 0x9e3779b9) >>> 0;
  const random = createRandom(seed);
  const amplitudeChoices = [0, 38, 62, 82, 104];
  const amplitude = amplitudeChoices[integer(random, 0, amplitudeChoices.length - 1)];
  const waves = random() < .74 ? 1 : 2;
  const phase = random() * TAU;
  const direction = random() < .5 ? -1 : 1;
  const roadCenterAt = (y) => {
    const progress = Math.max(0, Math.min(1, y / height));
    const edgeEase = Math.sin(Math.PI * progress) ** 2;
    const bend = Math.sin(TAU * waves * progress + phase);
    return roadCenter + direction * amplitude * edgeEase * bend;
  };

  const styleIndex = integer(random, 0, BUILDING_STYLES.length - 1);
  const groundColors = ['#62694f', '#686a53', '#5d674e', '#706b54'];
  const sidewalkColors = ['#aca794', '#b6ad98', '#a49f8d', '#b4aa91'];
  const roadColors = ['#4b4d49', '#50514d', '#494c49', '#53534d'];
  const accentColors = ['#a14d3e', '#b36c4a', '#6d8173', '#77869a', '#c0a45d'];
  const palette = {
    ground: groundColors[integer(random, 0, groundColors.length - 1)],
    sidewalk: sidewalkColors[integer(random, 0, sidewalkColors.length - 1)],
    road: roadColors[integer(random, 0, roadColors.length - 1)],
    accent: accentColors[integer(random, 0, accentColors.length - 1)],
    grass: ['#45543a', '#556344', '#69714a'][integer(random, 0, 2)],
    curb: '#c3b9a1',
    line: '#c6a84f',
  };

  const buildings = [];
  const props = [];
  const district = DISTRICT_NAMES[positiveModulo(sectionId + integer(random, 0, DISTRICT_NAMES.length - 1), DISTRICT_NAMES.length)];
  const rowCount = 3;
  const rowHeight = height / rowCount;

  for (let row = 0; row < rowCount; row += 1) {
    const rowTop = row * rowHeight + 14;
    const rowBottom = Math.min(height - 12, (row + 1) * rowHeight - 14);
    const extents = roadExtents(roadCenterAt, rowTop, rowBottom, 8, halfRoad, sidewalkWidth);
    const westStart = 12;
    const westEnd = Math.max(westStart + 140, Math.min(width * .44, extents.westBuildingEdge));
    const eastStart = Math.min(width - 140, Math.max(width * .56, extents.eastBuildingEdge));
    const eastEnd = width - 12;
    const blockHeight = rowBottom - rowTop;

    for (const side of ['west', 'east']) {
      const start = side === 'west' ? westStart : eastStart;
      const end = side === 'west' ? westEnd : eastEnd;
      const available = Math.max(140, end - start);
      const split = available > 285 && random() < .42;
      const gap = split ? integer(random, 8, 17) : 0;
      const firstWidth = split
        ? Math.floor((available - gap) * (.43 + random() * .12))
        : Math.floor(available * (.88 + random() * .1));
      const widths = split ? [firstWidth, Math.max(116, available - gap - firstWidth)] : [firstWidth];
      let x = start + (side === 'west' ? random() * 5 : random() * 5);

      for (let buildingIndex = 0; buildingIndex < widths.length; buildingIndex += 1) {
        const buildingWidth = Math.max(108, Math.min(widths[buildingIndex], end - x));
        const y = rowTop + integer(random, 0, 8);
        const buildingHeight = Math.max(174, blockHeight - integer(random, 22, 48));
        const type = BUILDING_STYLES[integer(random, 0, BUILDING_STYLES.length - 1)];
        buildings.push({
          id: `city-${sectionId}-${side}-${row}-${buildingIndex}`,
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(buildingWidth),
          height: Math.round(Math.min(buildingHeight, height - y - 8)),
          type,
          seed: integer(random, 0, 0x7fffffff),
          side,
        });
        x += buildingWidth + gap;
      }
    }

    // A few street trees and small sidewalk details vary independently per block.
    for (let item = 0; item < 3; item += 1) {
      const y = rowTop + 22 + random() * Math.max(24, blockHeight - 54);
      const center = roadCenterAt(y);
      const side = random() < .5 ? -1 : 1;
      const distanceFromRoad = halfRoad + 24 + random() * (sidewalkWidth - 46);
      const kind = item === 0 || random() < .64 ? 'tree' : (random() < .5 ? 'bench' : 'bin');
      props.push({
        id: `city-${sectionId}-prop-${row}-${item}`,
        kind,
        x: Math.round(center + side * distanceFromRoad),
        y: Math.round(y),
        size: integer(random, 22, 36),
        variant: integer(random, 0, 2),
        solid: kind !== 'bin',
      });
    }
  }

  const lampPosts = [];
  for (let y = 92; y < height; y += 174) {
    const center = roadCenterAt(y);
    lampPosts.push({ x: center - halfRoad - 12, y }, { x: center + halfRoad + 12, y });
  }
  const crosswalkY = random() < .62 ? integer(random, 150, height - 185) : null;
  const archetypes = ['RESIDENCIAL', 'COMERCIAL', 'INDUSTRIAL', 'VILA JARDIM', 'CENTRO ANTIGO'];
  const archetype = archetypes[positiveModulo(sectionId + styleIndex, archetypes.length)];

  return {
    worldIndex: sectionId,
    seed,
    name: `${district} · ${archetype}`,
    archetype,
    width,
    height,
    roadLeft,
    roadRight,
    roadCenter,
    halfRoad,
    sidewalkWidth,
    roadCenterAt,
    palette,
    buildings,
    props,
    lampPosts,
    crosswalkY,
  };
}

function fillRibbon(ctx, firstEdge, secondEdge, height, step = 32) {
  ctx.beginPath();
  for (let y = 0; y <= height; y += step) {
    const sampleY = Math.min(height, y);
    if (y === 0) ctx.moveTo(firstEdge(sampleY), sampleY);
    else ctx.lineTo(firstEdge(sampleY), sampleY);
  }
  if (height % step !== 0) ctx.lineTo(firstEdge(height), height);
  for (let y = height; y >= 0; y -= step) {
    const sampleY = Math.max(0, y);
    ctx.lineTo(secondEdge(sampleY), sampleY);
  }
  if (height % step !== 0) ctx.lineTo(secondEdge(0), 0);
  ctx.closePath();
  ctx.fill();
}

function drawBuilding(ctx, building, random) {
  const { x, y, width, height, type } = building;
  const right = x + width;
  const bottom = y + height;
  ctx.fillStyle = 'rgba(17, 19, 17, .36)';
  ctx.fillRect(x + 7, y + 10, width, height);
  ctx.fillStyle = type.trim;
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = type.wall;
  ctx.fillRect(x + 3, y + 3, width - 6, height - 6);
  ctx.fillStyle = type.roof;
  ctx.fillRect(x + 8, y + 8, width - 16, height - 26);

  // South and east walls keep the same chunky top-down outline as the reference tiles.
  ctx.fillStyle = type.trim;
  ctx.fillRect(x + 5, bottom - 21, width - 10, 13);
  ctx.fillRect(right - 15, y + 8, 7, height - 29);
  ctx.fillStyle = type.roofLight;
  ctx.fillRect(x + 9, y + 9, width - 18, 3);

  if (type.pattern === 'tile') {
    for (let row = y + 24; row < bottom - 32; row += 18) {
      ctx.fillStyle = row % 2 ? type.roofDark : type.roofLight;
      ctx.fillRect(x + 10, row, width - 21, 2);
      const stagger = Math.floor((row - y) / 18) % 2 ? 9 : 0;
      for (let column = x + 14 + stagger; column < right - 16; column += 28) {
        ctx.fillRect(column, row - 5, 1, 7);
      }
    }
  } else if (type.pattern === 'metal') {
    for (let column = x + 17; column < right - 15; column += 12) {
      ctx.fillStyle = column % 2 ? type.roofLight : type.roofDark;
      ctx.fillRect(column, y + 14, 2, height - 42);
    }
    for (let rust = 0; rust < 3; rust += 1) {
      const rustX = x + 18 + random() * Math.max(1, width - 45);
      const rustY = y + 18 + random() * Math.max(1, height - 58);
      ctx.fillStyle = 'rgba(155, 94, 60, .56)';
      ctx.fillRect(rustX, rustY, 5 + random() * 11, 2 + random() * 5);
    }
  } else {
    for (let column = x + 25; column < right - 28; column += 42) {
      ctx.fillStyle = type.roofDark;
      ctx.fillRect(column, y + 16, 2, height - 42);
    }
    for (let row = y + 28; row < bottom - 34; row += 38) {
      ctx.fillStyle = type.roofLight;
      ctx.fillRect(x + 12, row, width - 29, 2);
    }
  }

  // Air conditioners, tanks and roof access add block-to-block silhouettes.
  const equipmentCount = 2 + Math.floor(random() * 4);
  for (let item = 0; item < equipmentCount; item += 1) {
    const equipmentX = x + 18 + random() * Math.max(1, width - 52);
    const equipmentY = y + 19 + random() * Math.max(1, height - 70);
    const equipmentWidth = 14 + Math.floor(random() * 17);
    const equipmentHeight = 9 + Math.floor(random() * 13);
    ctx.fillStyle = 'rgba(28, 31, 29, .7)';
    ctx.fillRect(equipmentX + 2, equipmentY + 3, equipmentWidth, equipmentHeight);
    ctx.fillStyle = random() < .5 ? '#777b74' : '#938d7a';
    ctx.fillRect(equipmentX, equipmentY, equipmentWidth, equipmentHeight);
    ctx.fillStyle = type.trim;
    ctx.fillRect(equipmentX + 3, equipmentY + 3, equipmentWidth - 6, 2);
  }

  // Repeated window bays are visible along the south-facing facade.
  const windowStep = Math.max(24, Math.floor((width - 26) / Math.max(3, Math.floor(width / 34))));
  for (let windowX = x + 14; windowX < right - 21; windowX += windowStep) {
    ctx.fillStyle = '#262b2b';
    ctx.fillRect(windowX, bottom - 17, 11, 7);
    ctx.fillStyle = type.window;
    ctx.fillRect(windowX + 1, bottom - 16, 8, 4);
    ctx.fillStyle = 'rgba(205, 195, 164, .58)';
    ctx.fillRect(windowX + 2, bottom - 16, 1, 4);
  }
  ctx.fillStyle = type.trim;
  ctx.fillRect(x + 12, y + 10, 17, 8);
}

function drawTree(ctx, prop) {
  const size = prop.size;
  const x = prop.x;
  const y = prop.y;
  const colors = TREE_COLORS[prop.variant % TREE_COLORS.length];
  ctx.fillStyle = 'rgba(24, 24, 20, .34)';
  ctx.fillRect(x - size / 2 + 8, y - size / 2 + 12, size + 8, size + 7);
  ctx.fillStyle = '#554333';
  ctx.fillRect(x - 4, y - 2, 9, size * .72);
  ctx.fillStyle = colors[0];
  ctx.fillRect(x - size / 2, y - size / 2 + 5, size, size - 3);
  ctx.fillRect(x - size / 2 + 4, y - size / 2, size - 8, size + 4);
  ctx.fillStyle = colors[1];
  ctx.fillRect(x - size / 2 + 4, y - size / 2 + 5, size - 9, size - 8);
  ctx.fillRect(x - size / 2 + 8, y - size / 2 + 1, size - 15, size - 2);
  ctx.fillStyle = colors[2];
  for (let leaf = 0; leaf < 5; leaf += 1) {
    const leafX = x - size / 2 + 4 + ((leaf * 13 + prop.variant * 7) % Math.max(7, size - 12));
    const leafY = y - size / 2 + 5 + ((leaf * 17 + prop.variant * 3) % Math.max(7, size - 12));
    ctx.fillRect(leafX, leafY, 5, 4);
  }
  ctx.fillStyle = colors[3];
  ctx.fillRect(x - 3, y - size / 2 + 5, 5, 3);
}

function drawSidewalkProp(ctx, prop, palette) {
  if (prop.kind === 'tree') {
    drawTree(ctx, prop);
    return;
  }
  const x = prop.x;
  const y = prop.y;
  ctx.fillStyle = 'rgba(20, 21, 19, .35)';
  ctx.fillRect(x - 12, y + 8, 27, 8);
  if (prop.kind === 'bench') {
    ctx.fillStyle = '#43382f';
    ctx.fillRect(x - 12, y - 6, 26, 13);
    ctx.fillStyle = palette.accent;
    ctx.fillRect(x - 10, y - 5, 22, 4);
    ctx.fillStyle = '#2e302d';
    ctx.fillRect(x - 9, y + 5, 3, 7);
    ctx.fillRect(x + 6, y + 5, 3, 7);
  } else {
    ctx.fillStyle = '#353c39';
    ctx.fillRect(x - 9, y - 9, 18, 21);
    ctx.fillStyle = '#627365';
    ctx.fillRect(x - 7, y - 7, 14, 4);
    ctx.fillStyle = '#252a28';
    ctx.fillRect(x - 3, y - 2, 6, 8);
  }
}

function drawLampPost(ctx, post) {
  const x = Math.round(post.x);
  const y = Math.round(post.y);
  ctx.fillStyle = 'rgba(17, 19, 17, .32)';
  ctx.fillRect(x - 3, y + 5, 9, 8);
  ctx.fillStyle = '#41423d';
  ctx.fillRect(x - 2, y - 5, 4, 13);
  ctx.fillStyle = '#242825';
  ctx.fillRect(x - 6, y - 7, 12, 4);
  ctx.fillStyle = '#aaa58f';
  ctx.fillRect(x - 4, y - 8, 8, 2);
}

/** Draw a complete, curved top-down street tile with reusable pixel-art building motifs. */
export function drawProceduralStreet(ctx, layout) {
  if (!ctx || !layout || typeof ctx.save !== 'function' || typeof ctx.restore !== 'function'
    || typeof ctx.fillRect !== 'function' || typeof ctx.beginPath !== 'function'
    || typeof ctx.moveTo !== 'function' || typeof ctx.lineTo !== 'function'
    || typeof ctx.closePath !== 'function' || typeof ctx.fill !== 'function'
    || typeof ctx.stroke !== 'function') {
    throw new TypeError('drawProceduralStreet requires a valid 2D canvas context and street layout');
  }

  const { width, height, roadCenterAt, halfRoad, sidewalkWidth, palette } = layout;
  const random = createRandom(layout.seed ^ 0x6d2b79f5);
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = palette.ground;
    ctx.fillRect(0, 0, width, height);

    // Sparse yard texture stays underneath the buildings and paved sidewalks.
    for (let patch = 0; patch < 470; patch += 1) {
      const x = random() * width;
      const y = random() * height;
      const center = roadCenterAt(y);
      if (Math.abs(x - center) < halfRoad + sidewalkWidth) continue;
      ctx.fillStyle = random() < .56 ? palette.grass : 'rgba(185, 164, 118, .18)';
      ctx.fillRect(x, y, 2 + random() * 10, 1 + random() * 5);
    }

    ctx.fillStyle = palette.sidewalk;
    fillRibbon(ctx, (y) => roadCenterAt(y) - halfRoad - sidewalkWidth, (y) => roadCenterAt(y) - halfRoad, height);
    fillRibbon(ctx, (y) => roadCenterAt(y) + halfRoad, (y) => roadCenterAt(y) + halfRoad + sidewalkWidth, height);

    // Concrete slabs, worn seams and curb shadows follow the road's local bend.
    for (let y = 18; y < height; y += 42) {
      const center = roadCenterAt(y);
      ctx.fillStyle = 'rgba(64, 62, 55, .31)';
      ctx.fillRect(center - halfRoad - sidewalkWidth, y, sidewalkWidth, 2);
      ctx.fillRect(center + halfRoad, y, sidewalkWidth, 2);
      ctx.fillStyle = 'rgba(231, 220, 194, .25)';
      ctx.fillRect(center - halfRoad - sidewalkWidth + 38, y + 3, 1, 34);
      ctx.fillRect(center + halfRoad + sidewalkWidth - 43, y + 3, 1, 34);
    }

    ctx.fillStyle = palette.road;
    fillRibbon(ctx, (y) => roadCenterAt(y) - halfRoad, (y) => roadCenterAt(y) + halfRoad, height, 24);

    // Fine, deterministic asphalt flecks add texture without expensive filters.
    const asphaltColors = ['rgba(25, 27, 27, .17)', 'rgba(188, 181, 157, .16)', 'rgba(207, 194, 159, .12)'];
    for (let mark = 0; mark < 720; mark += 1) {
      const y = random() * height;
      const center = roadCenterAt(y);
      const x = center + (random() * 2 - 1) * (halfRoad - 13);
      ctx.fillStyle = asphaltColors[integer(random, 0, asphaltColors.length - 1)];
      ctx.fillRect(x, y, 1 + random() * 6, 1 + random() * 4);
    }

    ctx.beginPath();
    for (let y = 0; y <= height; y += 24) {
      const sampleY = Math.min(height, y);
      if (y === 0) ctx.moveTo(roadCenterAt(sampleY) - halfRoad, sampleY);
      else ctx.lineTo(roadCenterAt(sampleY) - halfRoad, sampleY);
    }
    for (let y = height; y >= 0; y -= 24) {
      const sampleY = Math.max(0, y);
      ctx.lineTo(roadCenterAt(sampleY) + halfRoad, sampleY);
    }
    ctx.closePath();
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(31, 33, 32, .76)';
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(205, 194, 166, .76)';
    ctx.stroke();

    ctx.fillStyle = palette.line;
    for (let y = 21; y < height; y += 78) {
      const center = roadCenterAt(y);
      ctx.fillRect(Math.round(center - 3), y, 6, 37);
    }
    if (layout.crosswalkY !== null) {
      const y = layout.crosswalkY;
      const center = roadCenterAt(y);
      for (let offset = -halfRoad + 28; offset < halfRoad - 20; offset += 35) {
        ctx.fillStyle = 'rgba(210, 205, 187, .74)';
        ctx.fillRect(Math.round(center + offset), y, 21, 8);
      }
    }

    for (const building of layout.buildings) {
      drawBuilding(ctx, building, createRandom(building.seed));
    }
    for (const prop of layout.props) drawSidewalkProp(ctx, prop, palette);
    for (const post of layout.lampPosts) drawLampPost(ctx, post);

    // A few chipped curb marks tie the generated block back to the reference art.
    for (let y = 10; y < height; y += 31) {
      const center = roadCenterAt(y);
      if (random() < .3) {
        ctx.fillStyle = 'rgba(167, 93, 70, .58)';
        ctx.fillRect(center - halfRoad - 4, y, 7, 8);
      }
      if (random() < .3) {
        ctx.fillStyle = 'rgba(167, 93, 70, .58)';
        ctx.fillRect(center + halfRoad - 3, y, 7, 8);
      }
    }
  } finally {
    ctx.restore();
  }
  return layout;
}

export function advanceSectionWindow(sections, currentIndex, firstWorldIndex, direction, createSection, maximum = 7) {
  if (!Array.isArray(sections) || typeof createSection !== 'function') {
    throw new TypeError('advanceSectionWindow requires a section array and generator');
  }
  if (!sections.length) throw new RangeError('The active section window cannot be empty');
  const nextSections = sections.slice();
  const maxSections = Number.isFinite(maximum) ? Math.max(2, Math.trunc(maximum)) : 7;
  const step = Math.sign(Number.isFinite(direction) ? direction : 0);
  let nextFirstWorldIndex = Number.isFinite(firstWorldIndex) ? Math.trunc(firstWorldIndex) : 0;
  let nextIndex = Math.max(0, Math.min(nextSections.length - 1, Math.trunc(currentIndex) || 0));
  if (!step) return { sections: nextSections, currentIndex: nextIndex, firstWorldIndex: nextFirstWorldIndex };

  if (step > 0) {
    if (nextIndex === nextSections.length - 1) {
      const worldIndex = nextFirstWorldIndex + nextSections.length;
      nextSections.push(createSection(worldIndex));
      if (nextSections.length > maxSections) {
        nextSections.shift();
        nextFirstWorldIndex += 1;
        nextIndex -= 1;
      }
    }
    nextIndex = Math.min(nextSections.length - 1, nextIndex + 1);
  } else {
    if (nextIndex === 0) {
      const worldIndex = nextFirstWorldIndex - 1;
      nextSections.unshift(createSection(worldIndex));
      nextFirstWorldIndex = worldIndex;
      nextIndex += 1;
      if (nextSections.length > maxSections) nextSections.pop();
    }
    nextIndex = Math.max(0, nextIndex - 1);
  }

  return { sections: nextSections, currentIndex: nextIndex, firstWorldIndex: nextFirstWorldIndex };
}

export const PROCEDURAL_CITY_LIMITS = Object.freeze({ maxLoadedSections: 7 });
