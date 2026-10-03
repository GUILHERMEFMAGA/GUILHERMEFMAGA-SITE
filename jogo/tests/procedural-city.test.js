import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceSectionWindow,
  createStreetLayout,
  drawProceduralStreet,
  PROCEDURAL_CITY_LIMITS,
} from '../procedural-city.js';

function layoutSignature(layout) {
  return {
    name: layout.name,
    archetype: layout.archetype,
    road: [0, 120, 300, 480, 720, 900, 960].map((y) => Math.round(layout.roadCenterAt(y) * 100) / 100),
    buildings: layout.buildings.map(({ x, y, width, height, type }) => [x, y, width, height, type.name]),
    props: layout.props.map(({ kind, x, y, size }) => [kind, x, y, size]),
    lamps: layout.lampPosts.map(({ x, y }) => [x, y]),
    crosswalkY: layout.crosswalkY,
  };
}

class RecordingContext {
  constructor(failAt = Infinity) {
    this.failAt = failAt;
    this.rectCount = 0;
    this.stack = [];
    this.fillStyle = '#123456';
    this.strokeStyle = '#654321';
    this.globalAlpha = 1;
    this.lineWidth = 1;
    this.imageSmoothingEnabled = true;
  }
  save() {
    this.stack.push({
      fillStyle: this.fillStyle,
      strokeStyle: this.strokeStyle,
      globalAlpha: this.globalAlpha,
      lineWidth: this.lineWidth,
      imageSmoothingEnabled: this.imageSmoothingEnabled,
    });
  }
  restore() {
    const state = this.stack.pop();
    if (!state) throw new Error('unbalanced restore');
    Object.assign(this, state);
  }
  fillRect() {
    this.rectCount += 1;
    if (this.rectCount === this.failAt) throw new Error('simulated canvas failure');
  }
  beginPath() {}
  moveTo() {}
  lineTo() {}
  closePath() {}
  fill() {}
  stroke() {}
}

test('procedural streets are deterministic per world index and vary between blocks', () => {
  const first = createStreetLayout(12);
  const repeat = createStreetLayout(12);
  const next = createStreetLayout(13);
  assert.deepEqual(layoutSignature(first), layoutSignature(repeat));
  assert.notDeepEqual(layoutSignature(first), layoutSignature(next));

  const signatures = new Set(Array.from({ length: 24 }, (_, index) => JSON.stringify(layoutSignature(createStreetLayout(index - 12)))));
  assert.ok(signatures.size >= 20, 'nearby streets should have visibly different layouts');
});

test('generated road portals line up and buildings stay outside the sidewalk corridor', () => {
  for (let worldIndex = -8; worldIndex <= 8; worldIndex += 1) {
    const layout = createStreetLayout(worldIndex);
    assert.ok(Math.abs(layout.roadCenterAt(0) - layout.roadCenter) < 1e-8);
    assert.ok(Math.abs(layout.roadCenterAt(layout.height) - layout.roadCenter) < 1e-8);
    for (let y = 0; y <= layout.height; y += 24) {
      const center = layout.roadCenterAt(y);
      assert.ok(center - layout.halfRoad >= 0);
      assert.ok(center + layout.halfRoad <= layout.width);
    }
    for (const building of layout.buildings) {
      const samples = 8;
      for (let sample = 0; sample <= samples; sample += 1) {
        const y = building.y + building.height * sample / samples;
        const center = layout.roadCenterAt(y);
        const gap = building.side === 'west'
          ? center - layout.halfRoad - (building.x + building.width)
          : building.x - center - layout.halfRoad;
        assert.ok(gap >= layout.sidewalkWidth - 22, `${building.id} overlaps the road-side walkway`);
      }
    }
  }
});

test('section window can travel indefinitely both ways while retaining a bounded cache', () => {
  let sections = [{ worldIndex: 0 }, { worldIndex: 1 }];
  let firstWorldIndex = 0;
  let currentIndex = 0;
  const visit = (direction) => {
    const result = advanceSectionWindow(
      sections,
      currentIndex,
      firstWorldIndex,
      direction,
      (worldIndex) => ({ worldIndex }),
      PROCEDURAL_CITY_LIMITS.maxLoadedSections,
    );
    sections = result.sections;
    firstWorldIndex = result.firstWorldIndex;
    currentIndex = result.currentIndex;
    assert.ok(sections.length <= PROCEDURAL_CITY_LIMITS.maxLoadedSections);
    assert.equal(sections[currentIndex].worldIndex, firstWorldIndex + currentIndex);
    assert.deepEqual(sections.map((section) => section.worldIndex),
      Array.from({ length: sections.length }, (_, index) => firstWorldIndex + index));
  };

  for (let step = 0; step < 25; step += 1) visit(1);
  assert.equal(sections[currentIndex].worldIndex, 25);
  for (let step = 0; step < 27; step += 1) visit(-1);
  assert.equal(sections[currentIndex].worldIndex, -2);
});

test('procedural street art draws a detailed tile and restores normal state', () => {
  const context = new RecordingContext();
  drawProceduralStreet(context, createStreetLayout(-3));
  assert.ok(context.rectCount > 1000);
  assert.equal(context.stack.length, 0);
  assert.equal(context.fillStyle, '#123456');
  assert.equal(context.imageSmoothingEnabled, true);
});

test('procedural drawing restores canvas state if painting fails', () => {
  const layout = createStreetLayout(4);
  const context = new RecordingContext(55);
  assert.throws(() => drawProceduralStreet(context, layout), /simulated canvas failure/);
  assert.equal(context.stack.length, 0);
  assert.equal(context.fillStyle, '#123456');
  assert.equal(context.strokeStyle, '#654321');
  assert.equal(context.globalAlpha, 1);
  assert.equal(context.imageSmoothingEnabled, true);
});
