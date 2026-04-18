import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

function createRoundedPanelShape(width, height, radius) {
  const halfWidth = width * 0.5;
  const halfHeight = height * 0.5;
  const left = -halfWidth;
  const right = halfWidth;
  const top = halfHeight;
  const bottom = -halfHeight;

  const shape = new THREE.Shape();

  if (radius <= 0.001) {
    shape.moveTo(left, bottom);
    shape.lineTo(right, bottom);
    shape.lineTo(right, top);
    shape.lineTo(left, top);
    shape.lineTo(left, bottom);
    return shape;
  }

  shape.moveTo(left + radius, bottom);
  shape.lineTo(right - radius, bottom);
  shape.absarc(right - radius, bottom + radius, radius, -Math.PI / 2, 0, false);
  shape.lineTo(right, top - radius);
  shape.absarc(right - radius, top - radius, radius, 0, Math.PI / 2, false);
  shape.lineTo(left + radius, top);
  shape.absarc(left + radius, top - radius, radius, Math.PI / 2, Math.PI, false);
  shape.lineTo(left, bottom + radius);
  shape.absarc(left + radius, bottom + radius, radius, Math.PI, Math.PI * 1.5, false);

  return shape;
}

function normalizePanelUvs(geometry, width, height) {
  const uvAttribute = geometry.getAttribute('uv');
  if (!uvAttribute) {
    return;
  }

  const safeWidth = Math.max(0.001, Math.abs(width));
  const safeHeight = Math.max(0.001, Math.abs(height));

  for (let i = 0; i < uvAttribute.count; i++) {
    uvAttribute.setXY(
      i,
      (uvAttribute.getX(i) / safeWidth) + 0.5,
      (uvAttribute.getY(i) / safeHeight) + 0.5
    );
  }

  uvAttribute.needsUpdate = true;
}

export function createRoundedPanelGeometry(width, height, options = {}) {
  const safeWidth = Math.max(0.001, Math.abs(width));
  const safeHeight = Math.max(0.001, Math.abs(height));
  const curveSegments = options.curveSegments ?? 6;
  const radiusRatio = options.radiusRatio ?? 0.12;
  const maxRadius = Math.max(0, Math.min(safeWidth, safeHeight) * 0.5 - 0.001);
  const radius = Math.min(maxRadius, Math.max(0.001, Math.min(safeWidth, safeHeight) * radiusRatio));
  const shape = createRoundedPanelShape(safeWidth, safeHeight, radius);
  const geometry = new THREE.ShapeGeometry(shape, curveSegments);
  normalizePanelUvs(geometry, safeWidth, safeHeight);
  return geometry;
}

export function createRoundedBoxGeometry(width, height, depth, options = {}) {
  const safeWidth = Math.max(0.001, Math.abs(width));
  const safeHeight = Math.max(0.001, Math.abs(height));
  const safeDepth = Math.max(0.001, Math.abs(depth));
  const shortestSide = Math.min(safeWidth, safeHeight, safeDepth);
  const segments = options.segments ?? 2;
  const radiusRatio = options.radiusRatio ?? 0.18;
  const radius = Math.min(shortestSide * radiusRatio, shortestSide * 0.5 - 0.001);

  return new RoundedBoxGeometry(safeWidth, safeHeight, safeDepth, segments, radius);
}

export function normalizeEnvironmentGeometry(geometry, options = {}) {
  if (!geometry || typeof geometry !== 'object') {
    return geometry;
  }

  if (geometry.type === 'PlaneGeometry' || geometry.type === 'PlaneBufferGeometry') {
    const parameters = geometry.parameters ?? {};
    return createRoundedPanelGeometry(parameters.width ?? 1, parameters.height ?? 1, options.panel ?? {});
  }

  if (geometry.type === 'BoxGeometry') {
    const parameters = geometry.parameters ?? {};
    return createRoundedBoxGeometry(parameters.width ?? 1, parameters.height ?? 1, parameters.depth ?? 1, options.box ?? {});
  }

  return geometry;
}