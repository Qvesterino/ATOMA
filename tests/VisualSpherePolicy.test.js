import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  validateObject3D,
  tagSphere,
  clampSphere,
  isIllegalVisibleSphere,
} from '../VisualSpherePolicy.js';

function makeSphere(radius = 1, opacity = 1) {
  const geometry = new THREE.SphereGeometry(radius, 8, 8);
  const material = new THREE.MeshBasicMaterial({
    transparent: opacity < 1,
    opacity,
  });
  return new THREE.Mesh(geometry, material);
}

// 1) Kills untagged visible sphere.
{
  const root = new THREE.Group();
  const mesh = makeSphere(1, 1);
  root.add(mesh);
  const result = validateObject3D(root, { test: 'untagged-visible' });
  assert.equal(result.removed, 1);
}

// 2) Preserves invisible collider.
{
  const root = new THREE.Group();
  const mesh = makeSphere(1, 0);
  mesh.visible = false;
  tagSphere(mesh, { role: 'collider', source: 'test' });
  root.add(mesh);
  const result = validateObject3D(root, { test: 'invisible-collider' });
  assert.equal(result.removed, 0);
}

// 3) Clamps highlight sphere.
{
  const mesh = makeSphere(1, 0.4);
  mesh.scale.setScalar(10);
  tagSphere(mesh, { role: 'highlight', source: 'test' });
  const changed = clampSphere(mesh);
  assert.equal(changed, true);
}

// 4) Preserves canonical sphere.
{
  const root = new THREE.Group();
  const mesh = makeSphere(1, 1);
  tagSphere(mesh, { role: 'canonicalSphere', source: 'test' });
  root.add(mesh);
  const result = validateObject3D(root, { test: 'canonical' });
  assert.equal(result.removed, 0);
  assert.equal(isIllegalVisibleSphere(mesh), false);
}

// 5) Does not remove invisible interaction proxy.
{
  const root = new THREE.Group();
  const mesh = makeSphere(1, 0);
  tagSphere(mesh, { role: 'interactionProxy', source: 'test' });
  root.add(mesh);
  const result = validateObject3D(root, { test: 'proxy' });
  assert.equal(result.removed, 0);
}

console.log('VisualSpherePolicy tests passed');

