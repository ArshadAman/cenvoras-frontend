import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_SPRING,
  backdropVariants,
  modalSurfaceVariants,
  commandPaletteVariants,
  popoverVariants,
} from '../src/utils/motion.js';

const FORBIDDEN_LAYOUT_PROPS = new Set(['width', 'height', 'top', 'left', 'right', 'bottom', 'margin', 'padding']);

test('operational durations stay snappy (<= 250ms) per DESIGN.md', () => {
  assert.ok(MOTION_DURATION.instant <= 0.1, 'instant must be <= 100ms');
  assert.ok(MOTION_DURATION.fast <= 0.15, 'fast must be <= 150ms');
  assert.ok(MOTION_DURATION.standard <= 0.18, 'standard must be <= 180ms');
  assert.ok(MOTION_DURATION.deliberate <= 0.25, 'deliberate must be <= 250ms');
});

test('easing curves are valid 4-point cubic beziers', () => {
  for (const [name, curve] of Object.entries(MOTION_EASE)) {
    assert.equal(Array.isArray(curve), true, `${name} must be an array`);
    assert.equal(curve.length, 4, `${name} must have 4 control points`);
  }
});

test('springs are critically or near-critically damped (damping ratio >= 0.78, no playful bounce)', () => {
  for (const [name, spring] of Object.entries(MOTION_SPRING)) {
    assert.equal(spring.type, 'spring', `${name} must be a spring`);
    // Damping ratio zeta = c / (2 * sqrt(k * m))
    const zeta = spring.damping / (2 * Math.sqrt(spring.stiffness * spring.mass));
    assert.ok(zeta >= 0.78, `${name} damping ratio ${zeta.toFixed(3)} is too bouncy (< 0.78)`);
  }
});

test('variants animate only GPU-composited properties (no layout-thrashing props)', () => {
  const variantSets = {
    backdropVariants,
    modalSurfaceVariants,
    commandPaletteVariants,
    popoverVariants,
  };

  for (const [name, variants] of Object.entries(variantSets)) {
    for (const [state, config] of Object.entries(variants)) {
      for (const prop of Object.keys(config)) {
        assert.equal(
          FORBIDDEN_LAYOUT_PROPS.has(prop),
          false,
          `${name}.${state} animates forbidden layout property "${prop}"`
        );
      }
    }
  }
});
