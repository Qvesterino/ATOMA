/**
 * STORAGE ENHANCED VARIANTS - Session 81 (Updated for KINETIC/AI-GROWN)
 * Three NEW production-ready Storage node variants
 * 
 * UPGRADE GOAL: Kinetic, "AI-Grown" behaviors (Tier 2)
 * - ArchiveNexus -> "Memory Cathedral" (Context vault)
 * - MemoryCrypts -> "VaultStack" (Sliding/Rotating chambers)
 * - DepthLayers -> "Memory Well" (Archive reservoir)
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from '../VisualHierarchyRegistry.js';

const STORAGE_MEMORY_CATHEDRAL_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  naveGeometry: null,
  naveEdgesGeometry: null,
  buttressGeometry: null,
  buttressEdgesGeometry: null,
  stratumGeometry: null,
  stratumEdgesGeometry: null,
  relicGeometry: null,
  relicEdgesGeometry: null,
  indexGeometry: null,
  indexEdgesGeometry: null,
  shellGeometry: null,
  shellEdgesGeometry: null,
  dustGeometry: null,
  witnessGeometry: null
};

const STORAGE_MEMORY_CATHEDRAL_MATERIALS = new Map();
const STORAGE_MEMORY_WELL_CACHE = {
  kernelGeometry: null,
  kernelEdgesGeometry: null,
  wellBandGeometry: null,
  wellBandEdgesGeometry: null,
  retrievalGeometry: null,
  retrievalEdgesGeometry: null,
  relicGeometry: null,
  relicEdgesGeometry: null,
  indexGeometry: null,
  indexEdgesGeometry: null,
  dustGeometry: null,
  witnessGeometry: null
};

const STORAGE_MEMORY_WELL_MATERIALS = new Map();

function _setStorageWaveDefaults(material, ignoreWaveColor = false) {
  material.userData = { ...(material.userData || {}), wavePatchMode: 'DEFAULT' };
  if (ignoreWaveColor) {
    material.userData.ignoreWaveColor = true;
  }
  return material;
}

function _distortGeometry(geometry, transform) {
  const position = geometry.attributes.position;
  if (!position) return geometry;

  const scratch = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    scratch.set(position.getX(i), position.getY(i), position.getZ(i));
    transform(scratch, i);
    position.setXYZ(i, scratch.x, scratch.y, scratch.z);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function _getStorageMemoryCathedralGeometries() {
  if (!STORAGE_MEMORY_CATHEDRAL_CACHE.coreGeometry) {
    const coreGeometry = new THREE.CylinderGeometry(0.42, 0.54, 0.8, 6, 1, false);
    _distortGeometry(coreGeometry, (v) => {
      const yWeight = Math.min(1, Math.abs(v.y) / 0.4);
      const taper = 0.92 + (1 - yWeight) * 0.12;
      v.x = v.x * taper + v.z * 0.028 * Math.sign(v.y || 1);
      v.y = v.y * 1.02 + Math.sign(v.y || 1) * 0.028 * (1 - yWeight);
      v.z = v.z * (0.9 + (1 - yWeight) * 0.08) - v.x * 0.02;
    });
    STORAGE_MEMORY_CATHEDRAL_CACHE.coreGeometry = coreGeometry;
    STORAGE_MEMORY_CATHEDRAL_CACHE.coreEdgesGeometry = new THREE.EdgesGeometry(coreGeometry, 16);

    const naveGeometry = new THREE.CylinderGeometry(0.24, 0.36, 1.82, 6, 1, false);
    _distortGeometry(naveGeometry, (v) => {
      const yWeight = Math.min(1, Math.abs(v.y) / 0.91);
      v.x = v.x * (0.84 + (1 - yWeight) * 0.16) + v.z * 0.018;
      v.y = v.y * 1.0 + Math.sign(v.y || 1) * 0.018 * (1 - yWeight);
      v.z = v.z * (0.94 + (1 - yWeight) * 0.06) - v.x * 0.012;
    });
    STORAGE_MEMORY_CATHEDRAL_CACHE.naveGeometry = naveGeometry;
    STORAGE_MEMORY_CATHEDRAL_CACHE.naveEdgesGeometry = new THREE.EdgesGeometry(naveGeometry, 14);

    const buttressGeometry = new THREE.BoxGeometry(0.18, 1.16, 0.42, 1, 1, 1);
    _distortGeometry(buttressGeometry, (v) => {
      const yNorm = (v.y + 0.58) / 1.16;
      const lowerMass = 0.12 + (1 - yNorm) * 0.28;
      v.x = v.x * (0.62 + yNorm * 0.26) + Math.sign(v.x || 1) * 0.028 * lowerMass;
      v.y = v.y * 1.0;
      v.z = v.z * (0.72 + yNorm * 0.18) + v.x * 0.045;
    });
    STORAGE_MEMORY_CATHEDRAL_CACHE.buttressGeometry = buttressGeometry;
    STORAGE_MEMORY_CATHEDRAL_CACHE.buttressEdgesGeometry = new THREE.EdgesGeometry(buttressGeometry, 20);

    const stratumGeometry = new THREE.CylinderGeometry(0.72, 0.8, 0.1, 6, 1, false);
    _distortGeometry(stratumGeometry, (v) => {
      const yBias = v.y * 0.3;
      v.x = v.x * 0.96 + v.z * 0.04;
      v.y = v.y + yBias * 0.02;
      v.z = v.z * 0.94 - v.x * 0.03;
    });
    STORAGE_MEMORY_CATHEDRAL_CACHE.stratumGeometry = stratumGeometry;
    STORAGE_MEMORY_CATHEDRAL_CACHE.stratumEdgesGeometry = new THREE.EdgesGeometry(stratumGeometry, 16);

    const relicGeometry = new THREE.CapsuleGeometry(0.05, 0.24, 4, 6);
    STORAGE_MEMORY_CATHEDRAL_CACHE.relicGeometry = relicGeometry;
    STORAGE_MEMORY_CATHEDRAL_CACHE.relicEdgesGeometry = new THREE.EdgesGeometry(relicGeometry, 14);

    const indexGeometry = new THREE.CylinderGeometry(0.045, 0.07, 0.18, 6, 1, false);
    _distortGeometry(indexGeometry, (v) => {
      v.x = v.x * 0.86 + v.z * 0.05;
      v.y = v.y * 1.0;
      v.z = v.z * 0.84 - v.x * 0.03;
    });
    STORAGE_MEMORY_CATHEDRAL_CACHE.indexGeometry = indexGeometry;
    STORAGE_MEMORY_CATHEDRAL_CACHE.indexEdgesGeometry = new THREE.EdgesGeometry(indexGeometry, 14);

    const shellGeometry = new THREE.CylinderGeometry(1.02, 1.1, 2.56, 6, 1, true);
    _distortGeometry(shellGeometry, (v) => {
      const yWeight = Math.min(1, Math.abs(v.y) / 1.28);
      v.x = v.x * (0.94 + yWeight * 0.08) + v.z * 0.012;
      v.z = v.z * (0.96 + yWeight * 0.06) - v.x * 0.01;
    });
    STORAGE_MEMORY_CATHEDRAL_CACHE.shellGeometry = shellGeometry;
    STORAGE_MEMORY_CATHEDRAL_CACHE.shellEdgesGeometry = new THREE.EdgesGeometry(shellGeometry, 14);

    const dustPositions = [];
    const dustCount = 56;
    for (let i = 0; i < dustCount; i++) {
      const t = i / dustCount;
      const angle = t * Math.PI * 2.0;
      const radius = 0.78 + Math.sin(i * 1.73) * 0.11;
      dustPositions.push(
        Math.cos(angle) * radius,
        -0.86 + t * 1.74 + Math.sin(i * 0.91) * 0.05,
        Math.sin(angle) * (0.48 + Math.cos(i * 1.29) * 0.08)
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();
    STORAGE_MEMORY_CATHEDRAL_CACHE.dustGeometry = dustGeometry;

    const witnessPoints = [
      new THREE.Vector3(-0.62, -0.72, -0.04),
      new THREE.Vector3(-0.4, -0.32, 0.08),
      new THREE.Vector3(-0.16, 0.04, 0.02),
      new THREE.Vector3(0.08, 0.36, -0.02),
      new THREE.Vector3(0.34, 0.7, 0.06),
      new THREE.Vector3(0.5, 0.98, -0.02)
    ];
    const witnessGeometry = new THREE.BufferGeometry().setFromPoints(witnessPoints);
    witnessGeometry.computeBoundingSphere();
    STORAGE_MEMORY_CATHEDRAL_CACHE.witnessGeometry = witnessGeometry;
  }

  return STORAGE_MEMORY_CATHEDRAL_CACHE;
}

function _getStorageMemoryCathedralMaterials(color) {
  const colorHex = typeof color === 'number' ? color : new THREE.Color(color || 0x9ccfe5).getHex();
  if (STORAGE_MEMORY_CATHEDRAL_MATERIALS.has(colorHex)) {
    return STORAGE_MEMORY_CATHEDRAL_MATERIALS.get(colorHex);
  }

  const storageColor = new THREE.Color(colorHex);
  const coldSteel = new THREE.Color(0x1a222b);
  const archiveIce = new THREE.Color(0xe9fbff);
  const archiveTint = storageColor.clone().lerp(new THREE.Color(0x97bfd2), 0.82);
  const archiveSilver = new THREE.Color(0xbfd8e6);

  const coreMat = _setStorageWaveDefaults(new THREE.MeshStandardMaterial({
    color: coldSteel.clone().lerp(archiveSilver, 0.22),
    emissive: archiveTint.clone().lerp(archiveIce, 0.16),
    emissiveIntensity: 0.16,
    metalness: 0.76,
    roughness: 0.28,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  }));

  const naveMat = _setStorageWaveDefaults(new THREE.MeshStandardMaterial({
    color: coldSteel.clone().lerp(archiveSilver, 0.34),
    emissive: archiveTint.clone().lerp(archiveIce, 0.08),
    emissiveIntensity: 0.12,
    metalness: 0.68,
    roughness: 0.34,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  }));

  const buttressMat = _setStorageWaveDefaults(new THREE.MeshStandardMaterial({
    color: coldSteel.clone().lerp(archiveSilver, 0.12),
    emissive: archiveTint.clone().multiplyScalar(0.28),
    emissiveIntensity: 0.08,
    metalness: 0.6,
    roughness: 0.42,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  }));

  const stratumMat = _setStorageWaveDefaults(new THREE.MeshStandardMaterial({
    color: coldSteel.clone().lerp(archiveSilver, 0.25),
    emissive: archiveTint.clone().lerp(archiveIce, 0.04),
    emissiveIntensity: 0.09,
    metalness: 0.66,
    roughness: 0.32,
    transparent: false,
    opacity: 0.98,
    depthWrite: true,
    depthTest: true
  }));

  const relicMat = _setStorageWaveDefaults(new THREE.MeshStandardMaterial({
    color: coldSteel.clone().lerp(archiveTint, 0.38),
    emissive: archiveTint.clone().lerp(archiveIce, 0.22),
    emissiveIntensity: 0.24,
    metalness: 0.74,
    roughness: 0.24,
    transparent: true,
    opacity: 0.92,
    depthWrite: true,
    depthTest: true
  }), true);

  const indexMat = _setStorageWaveDefaults(new THREE.MeshStandardMaterial({
    color: archiveIce.clone().lerp(archiveTint, 0.2),
    emissive: archiveIce.clone().lerp(archiveTint, 0.1),
    emissiveIntensity: 0.3,
    metalness: 0.48,
    roughness: 0.18,
    transparent: true,
    opacity: 0.95,
    depthWrite: true,
    depthTest: true
  }), true);

  const edgeMat = _setStorageWaveDefaults(new THREE.LineBasicMaterial({
    color: archiveSilver.clone().lerp(archiveIce, 0.28),
    transparent: true,
    opacity: 0.56,
    depthWrite: true
  }));

  const dustMat = _setStorageWaveDefaults(new THREE.PointsMaterial({
    color: archiveIce.clone().lerp(archiveTint, 0.12),
    size: 0.034,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    sizeAttenuation: true
  }));

  const shellMat = _setStorageWaveDefaults(new THREE.MeshBasicMaterial({
    color: archiveIce.clone().lerp(archiveTint, 0.04),
    transparent: true,
    opacity: 0.05,
    depthWrite: false,
    side: THREE.DoubleSide
  }));

  const witnessMat = _setStorageWaveDefaults(new THREE.LineBasicMaterial({
    color: archiveIce.clone().lerp(archiveTint, 0.18),
    transparent: true,
    opacity: 0.2,
    depthWrite: false
  }));

  const mats = {
    coreMat,
    naveMat,
    buttressMat,
    stratumMat,
    relicMat,
    indexMat,
    edgeMat,
    dustMat,
    shellMat,
    witnessMat
  };
  STORAGE_MEMORY_CATHEDRAL_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getStorageMemoryWellGeometries() {
  if (!STORAGE_MEMORY_WELL_CACHE.kernelGeometry) {
    const deformGeometry = (geometry, deformFn) => {
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const next = deformFn(x, y, z, i);
        pos.setXYZ(i, next[0], next[1], next[2]);
      }
      pos.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      return geometry;
    };

    const kernelGeometry = new THREE.DodecahedronGeometry(0.18, 1);
    deformGeometry(kernelGeometry, (x, y, z) => {
      const yWeight = Math.min(1, Math.abs(y) / 0.18);
      const sinkBias = Math.max(0, 0.18 - Math.abs(y)) * 0.08;
      return [
        x * (0.94 + yWeight * 0.02) + Math.sign(x || 1) * 0.008 * (1 - yWeight),
        y * 1.08 + Math.sign(y || 1) * 0.01 * (1 - yWeight),
        z * (0.9 + yWeight * 0.04) - sinkBias
      ];
    });
    STORAGE_MEMORY_WELL_CACHE.kernelGeometry = kernelGeometry;
    STORAGE_MEMORY_WELL_CACHE.kernelEdgesGeometry = new THREE.EdgesGeometry(kernelGeometry, 12);

    const wellBandGeometry = new THREE.CylinderGeometry(0.62, 0.78, 0.15, 6, 1, true);
    deformGeometry(wellBandGeometry, (x, y, z, i) => {
      const yWeight = Math.min(1, Math.abs(y) / 0.075);
      const notch = Math.sin((x * 6.1) + (z * 4.4) + i * 0.12) * 0.015;
      return [
        x * (0.95 + yWeight * 0.05) + z * 0.02 + notch,
        y * 1.0,
        z * (0.92 + yWeight * 0.06) - x * 0.015
      ];
    });
    STORAGE_MEMORY_WELL_CACHE.wellBandGeometry = wellBandGeometry;
    STORAGE_MEMORY_WELL_CACHE.wellBandEdgesGeometry = new THREE.EdgesGeometry(wellBandGeometry, 14);

    const retrievalGeometry = deformGeometry(
      new THREE.BoxGeometry(0.1, 0.78, 0.07, 1, 2, 1),
      (x, y, z) => [
        x * (0.88 + Math.abs(y) * 0.06) + Math.sign(x || 1) * 0.006,
        y,
        z * 0.82 + Math.sin((y + x) * 5.2) * 0.003
      ]
    );
    STORAGE_MEMORY_WELL_CACHE.retrievalGeometry = retrievalGeometry;
    STORAGE_MEMORY_WELL_CACHE.retrievalEdgesGeometry = new THREE.EdgesGeometry(retrievalGeometry, 8);

    const relicGeometry = new THREE.CapsuleGeometry(0.042, 0.17, 4, 6);
    STORAGE_MEMORY_WELL_CACHE.relicGeometry = relicGeometry;
    STORAGE_MEMORY_WELL_CACHE.relicEdgesGeometry = new THREE.EdgesGeometry(relicGeometry, 12);

    const indexGeometry = deformGeometry(
      new THREE.CylinderGeometry(0.036, 0.054, 0.14, 6, 1, false),
      (x, y, z) => [x * 0.84 + z * 0.04, y, z * 0.8 - x * 0.02]
    );
    STORAGE_MEMORY_WELL_CACHE.indexGeometry = indexGeometry;
    STORAGE_MEMORY_WELL_CACHE.indexEdgesGeometry = new THREE.EdgesGeometry(indexGeometry, 12);

    const dustPositions = [];
    const dustCount = 48;
    for (let i = 0; i < dustCount; i++) {
      const t = i / dustCount;
      const angle = t * Math.PI * 2.0;
      const radius = 0.68 + Math.sin(i * 1.41) * 0.06 + (i % 4) * 0.012;
      dustPositions.push(
        Math.cos(angle) * radius,
        -0.82 + t * 1.58 + Math.sin(i * 0.73) * 0.036,
        Math.sin(angle * 1.12) * (0.36 + Math.cos(i * 0.51) * 0.07)
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();
    STORAGE_MEMORY_WELL_CACHE.dustGeometry = dustGeometry;

    const witnessPoints = [
      new THREE.Vector3(-0.58, -0.82, -0.03),
      new THREE.Vector3(-0.34, -0.46, 0.08),
      new THREE.Vector3(-0.12, -0.1, 0.02),
      new THREE.Vector3(0.08, 0.28, -0.03),
      new THREE.Vector3(0.26, 0.64, 0.06),
      new THREE.Vector3(0.42, 0.94, -0.01)
    ];
    const witnessGeometry = new THREE.BufferGeometry().setFromPoints(witnessPoints);
    witnessGeometry.computeBoundingSphere();
    STORAGE_MEMORY_WELL_CACHE.witnessGeometry = witnessGeometry;
  }

  return STORAGE_MEMORY_WELL_CACHE;
}

function _getStorageMemoryWellMaterials(color) {
  const colorHex = typeof color === 'number' ? color : new THREE.Color(color || 0x9ccfe5).getHex();
  if (STORAGE_MEMORY_WELL_MATERIALS.has(colorHex)) {
    return STORAGE_MEMORY_WELL_MATERIALS.get(colorHex);
  }

  const storageColor = new THREE.Color(colorHex);
  const archiveIce = new THREE.Color(0xe9fbff);
  const archiveTint = storageColor.clone().lerp(new THREE.Color(0x9bc0d4), 0.78);
  const archiveSilver = new THREE.Color(0xc7dce8);
  const coldSteel = new THREE.Color(0x1b2430);

  const kernelMat = _setStorageWaveDefaults(new THREE.MeshPhysicalMaterial({
    color: archiveIce.clone().lerp(archiveTint, 0.18),
    metalness: 0.9,
    roughness: 0.16,
    emissive: archiveIce.clone().lerp(archiveTint, 0.26),
    emissiveIntensity: 0.34,
    transparent: true,
    opacity: 0.95,
    transmission: 0,
    thickness: 0.14
  }));

  const wellBandMat = _setStorageWaveDefaults(new THREE.MeshPhysicalMaterial({
    color: archiveSilver.clone().lerp(archiveTint, 0.14),
    metalness: 0.82,
    roughness: 0.18,
    emissive: archiveIce.clone().lerp(archiveTint, 0.08),
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.56,
    transmission: 0,
    thickness: 0.08,
    side: THREE.DoubleSide
  }));

  const retrievalMat = _setStorageWaveDefaults(new THREE.MeshStandardMaterial({
    color: coldSteel.clone().lerp(archiveSilver, 0.28),
    metalness: 0.88,
    roughness: 0.2,
    emissive: archiveIce.clone().lerp(archiveTint, 0.06),
    emissiveIntensity: 0.18,
    transparent: true,
    opacity: 0.8
  }));

  const relicMat = _setStorageWaveDefaults(new THREE.MeshPhysicalMaterial({
    color: archiveIce.clone().lerp(archiveTint, 0.06),
    metalness: 0.74,
    roughness: 0.12,
    emissive: archiveIce.clone().lerp(archiveTint, 0.26),
    emissiveIntensity: 0.42,
    transparent: true,
    opacity: 0.98,
    transmission: 0,
    thickness: 0.05
  }), true);

  const indexMat = _setStorageWaveDefaults(new THREE.MeshPhysicalMaterial({
    color: archiveIce.clone().lerp(archiveTint, 0.02),
    metalness: 0.84,
    roughness: 0.1,
    emissive: archiveIce.clone().lerp(archiveTint, 0.32),
    emissiveIntensity: 0.54,
    transparent: true,
    opacity: 0.98,
    transmission: 0,
    thickness: 0.04
  }), true);

  const dustMat = _setStorageWaveDefaults(new THREE.PointsMaterial({
    color: archiveIce.clone().lerp(archiveTint, 0.24),
    size: 0.03,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    sizeAttenuation: true
  }));

  const witnessMat = _setStorageWaveDefaults(new THREE.LineBasicMaterial({
    color: archiveSilver.clone().lerp(archiveTint, 0.16),
    transparent: true,
    opacity: 0.32,
    depthWrite: false
  }));

  const mats = {
    kernelMat,
    wellBandMat,
    retrievalMat,
    relicMat,
    indexMat,
    dustMat,
    witnessMat
  };

  STORAGE_MEMORY_WELL_MATERIALS.set(colorHex, mats);
  return mats;
}

function _createStorageMemoryWellNode(group, color) {
  group.userData = group.userData || {};
  const colorHex = new THREE.Color(color).getHex();
  const geometries = _getStorageMemoryWellGeometries();
  const materials = _getStorageMemoryWellMaterials(colorHex);
  const coreOrder = VisualHierarchyRegistry.getRenderOrder('CORE');
  const archOrder = VisualHierarchyRegistry.getRenderOrder('ARCHETYPE');
  const phase = ((colorHex & 0xffff) / 0xffff) * Math.PI * 2;

  group.name = 'STORAGE_MEMORY_WELL_NODE';
  group.userData.visualVariant = 'STORAGE_MEMORY_WELL_V4';
  group.userData.storageVariant = 'MEMORY_WELL';
  group.userData.nodeGeometryName = 'STORAGE_MEMORY_WELL';
  group.userData.visualReady = true;
  group.userData.visualCoreImmutable = true;
  group.userData.memoryWellPhase = phase;
  group.userData.memoryWellSpinSpeed = 0.0021;

  const coreGroup = new THREE.Group();
  coreGroup.name = 'CORE_GROUP';
  coreGroup.userData.isMemoryWellCoreGroup = true;

  const kernel = new THREE.Mesh(geometries.kernelGeometry, materials.kernelMat);
  kernel.name = 'MemoryKernel';
  kernel.position.set(0.0, 0.02, 0.01);
  kernel.rotation.set(0.12, 0.28, -0.08);
  kernel.scale.set(1.0, 1.08, 0.96);
  kernel.renderOrder = coreOrder;
  kernel.userData.isMemoryWellKernel = true;
  kernel.userData.visualCoreImmutable = true;
  coreGroup.add(kernel);

  const kernelEdges = new THREE.LineSegments(geometries.kernelEdgesGeometry, materials.witnessMat);
  kernelEdges.name = 'MemoryKernelEdges';
  kernelEdges.position.copy(kernel.position);
  kernelEdges.rotation.copy(kernel.rotation);
  kernelEdges.scale.copy(kernel.scale);
  kernelEdges.renderOrder = archOrder;
  kernelEdges.userData.isMemoryWellKernel = true;
  coreGroup.add(kernelEdges);

  const innerVoidSeam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.64, 6, 1, false), materials.retrievalMat);
  innerVoidSeam.name = 'MemoryWellInnerVoidSeam';
  innerVoidSeam.position.set(0.02, -0.1, -0.01);
  innerVoidSeam.rotation.set(0.04, 0.18, -0.02);
  innerVoidSeam.renderOrder = coreOrder;
  innerVoidSeam.userData.isMemoryWellVoidSeam = true;
  innerVoidSeam.userData.visualCoreImmutable = true;
  coreGroup.add(innerVoidSeam);

  const indexSeed = new THREE.Mesh(geometries.indexGeometry, materials.indexMat);
  indexSeed.name = 'MemoryIndexSeed';
  indexSeed.position.set(0.14, 0.14, 0.04);
  indexSeed.rotation.set(0.12, 0.22, -0.06);
  indexSeed.scale.set(0.9, 1.1, 0.9);
  indexSeed.renderOrder = coreOrder;
  indexSeed.userData.isMemoryWellIndex = true;
  indexSeed.userData.ignoreWaveColor = true;
  indexSeed.userData.visualCoreImmutable = true;
  coreGroup.add(indexSeed);

  group.add(coreGroup);

  const wellGroup = new THREE.Group();
  wellGroup.name = 'WELL_GROUP';
  wellGroup.userData.isMemoryWellBandGroup = true;

  const bandSpecs = [
    { name: 'WellBand_Aperture', pos: [0.0, 0.48, 0.0], rot: [0.04, 0.14, -0.02], scale: [1.14, 1.0, 1.14], speed: 0.0048 },
    { name: 'WellBand_Retention_A', pos: [0.0, 0.18, 0.0], rot: [-0.03, -0.18, 0.04], scale: [0.96, 0.98, 0.96], speed: 0.006 },
    { name: 'WellBand_Retention_B', pos: [0.0, -0.14, 0.0], rot: [0.02, 0.24, -0.03], scale: [0.8, 0.96, 0.8], speed: -0.0054 },
    { name: 'WellBand_ArchiveSink', pos: [0.0, -0.48, 0.0], rot: [-0.05, -0.26, 0.03], scale: [0.62, 0.94, 0.62], speed: 0.0042 }
  ];

  bandSpecs.forEach((spec, idx) => {
    const band = new THREE.Mesh(geometries.wellBandGeometry, materials.wellBandMat);
    band.name = spec.name;
    band.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    band.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);
    band.scale.set(spec.scale[0], spec.scale[1], spec.scale[2]);
    band.renderOrder = coreOrder;
    band.userData.isMemoryWellBand = true;
    band.userData.bandIndex = idx;
    band.userData.bandPhase = phase + idx * 0.83;
    band.userData.bandSpinSpeed = spec.speed;
    band.userData.baseRotation = band.rotation.clone();
    band.userData.baseScale = band.scale.clone();
    band.userData.visualCoreImmutable = true;
    wellGroup.add(band);

    const bandEdges = new THREE.LineSegments(geometries.wellBandEdgesGeometry, materials.witnessMat);
    bandEdges.name = `${spec.name}_Edges`;
    bandEdges.position.copy(band.position);
    bandEdges.rotation.copy(band.rotation);
    bandEdges.scale.copy(band.scale);
    bandEdges.renderOrder = archOrder;
    bandEdges.userData.isMemoryWellBand = true;
    bandEdges.userData.bandIndex = idx;
    bandEdges.userData.bandPhase = phase + idx * 0.83;
    bandEdges.userData.bandSpinSpeed = spec.speed;
    bandEdges.userData.baseRotation = band.rotation.clone();
    bandEdges.userData.baseScale = band.scale.clone();
    bandEdges.userData.visualCoreImmutable = true;
    wellGroup.add(bandEdges);
  });

  group.add(wellGroup);

  const retrievalGroup = new THREE.Group();
  retrievalGroup.name = 'RETRIEVAL_GROUP';
  retrievalGroup.userData.isMemoryWellRetrievalGroup = true;

  const retrievalSpecs = [
    { name: 'RecallBrace_A', pos: [-0.54, -0.1, 0.12], rot: [0.22, 0.48, 0.18], scale: [1.0, 0.92, 1.0], pulse: 0.72 },
    { name: 'RecallBrace_B', pos: [0.46, 0.08, -0.14], rot: [-0.14, -0.34, -0.16], scale: [0.92, 1.0, 0.92], pulse: 0.88 },
    { name: 'RecallBrace_C', pos: [-0.1, 0.22, 0.34], rot: [0.08, 0.92, -0.08], scale: [0.84, 0.88, 0.84], pulse: 1.04 }
  ];

  retrievalSpecs.forEach((spec, idx) => {
    const brace = new THREE.Mesh(geometries.retrievalGeometry, materials.retrievalMat);
    brace.name = spec.name;
    brace.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    brace.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);
    brace.scale.set(spec.scale[0], spec.scale[1], spec.scale[2]);
    brace.renderOrder = coreOrder;
    brace.userData.isMemoryWellRetrieval = true;
    brace.userData.retrievalIndex = idx;
    brace.userData.retrievalPulseSpeed = spec.pulse;
    brace.userData.retrievalPulseAmp = 0.008 + idx * 0.0015;
    brace.userData.basePosition = brace.position.clone();
    brace.userData.baseRotation = brace.rotation.clone();
    brace.userData.visualCoreImmutable = true;
    retrievalGroup.add(brace);

    const braceEdges = new THREE.LineSegments(geometries.retrievalEdgesGeometry, materials.witnessMat);
    braceEdges.name = `${spec.name}_Edges`;
    braceEdges.position.copy(brace.position);
    braceEdges.rotation.copy(brace.rotation);
    braceEdges.scale.copy(brace.scale);
    braceEdges.renderOrder = archOrder;
    braceEdges.userData.isMemoryWellRetrieval = true;
    braceEdges.userData.retrievalIndex = idx;
    braceEdges.userData.retrievalPulseSpeed = spec.pulse;
    braceEdges.userData.retrievalPulseAmp = 0.008 + idx * 0.0015;
    braceEdges.userData.basePosition = brace.position.clone();
    braceEdges.userData.baseRotation = brace.rotation.clone();
    braceEdges.userData.visualCoreImmutable = true;
    retrievalGroup.add(braceEdges);
  });

  group.add(retrievalGroup);

  const relicGroup = new THREE.Group();
  relicGroup.name = 'RELIC_GROUP';
  relicGroup.userData.isMemoryWellRelicGroup = true;

  const relicSpecs = [
    { pos: [0.16, -0.02, 0.06], rot: [0.18, 0.16, -0.08], scale: [0.9, 0.94, 0.9], speed: 0.016 },
    { pos: [0.2, -0.24, -0.04], rot: [-0.12, 0.58, 0.06], scale: [0.84, 0.9, 0.84], speed: 0.019 },
    { pos: [0.04, -0.46, 0.1], rot: [0.08, 0.92, -0.1], scale: [0.78, 0.86, 0.78], speed: 0.022 },
    { pos: [-0.08, -0.66, -0.06], rot: [0.14, 1.14, 0.08], scale: [0.72, 0.82, 0.72], speed: 0.025 }
  ];

  relicSpecs.forEach((spec, idx) => {
    const relic = new THREE.Mesh(geometries.relicGeometry, materials.relicMat);
    relic.name = `MemoryRelic_${idx}`;
    relic.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    relic.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);
    relic.scale.set(spec.scale[0], spec.scale[1], spec.scale[2]);
    relic.renderOrder = archOrder;
    relic.userData.isMemoryWellRelic = true;
    relic.userData.orbitPhase = phase + idx * 0.9;
    relic.userData.orbitSpeed = spec.speed;
    relic.userData.orbitRadius = 0.028 + idx * 0.003;
    relic.userData.basePosition = relic.position.clone();
    relic.userData.baseRotation = relic.rotation.clone();
    relic.userData.ignoreWaveColor = true;
    relic.userData.visualCoreImmutable = true;
    relicGroup.add(relic);

    const relicEdges = new THREE.LineSegments(geometries.relicEdgesGeometry, materials.witnessMat);
    relicEdges.name = `${relic.name}_Edges`;
    relicEdges.position.copy(relic.position);
    relicEdges.rotation.copy(relic.rotation);
    relicEdges.scale.copy(relic.scale);
    relicEdges.renderOrder = archOrder;
    relicEdges.userData.isMemoryWellRelic = true;
    relicEdges.userData.orbitPhase = relic.userData.orbitPhase;
    relicEdges.userData.orbitSpeed = relic.userData.orbitSpeed;
    relicEdges.userData.orbitRadius = relic.userData.orbitRadius;
    relicEdges.userData.basePosition = relic.userData.basePosition.clone();
    relicEdges.userData.baseRotation = relic.userData.baseRotation.clone();
    relicEdges.userData.ignoreWaveColor = true;
    relicEdges.userData.visualCoreImmutable = true;
    relicGroup.add(relicEdges);
  });

  group.add(relicGroup);

  const auraGroup = new THREE.Group();
  auraGroup.name = 'AURA_GROUP';
  auraGroup.userData.isMemoryWellAuraGroup = true;

  const dust = new THREE.Points(geometries.dustGeometry, materials.dustMat);
  dust.name = 'MemoryWellDust';
  dust.position.set(0.0, 0.0, 0.0);
  dust.rotation.set(0.06, 0.22, -0.02);
  dust.frustumCulled = false;
  dust.renderOrder = archOrder;
  dust.userData.isMemoryWellDust = true;
  dust.userData.visualCoreImmutable = true;
  auraGroup.add(dust);

  const witnessLine = new THREE.Line(geometries.witnessGeometry, materials.witnessMat);
  witnessLine.name = 'MemoryWellWitnessLine';
  witnessLine.frustumCulled = false;
  witnessLine.position.set(0.0, 0.0, 0.0);
  witnessLine.rotation.set(0.02, 0.18, -0.02);
  witnessLine.renderOrder = archOrder;
  witnessLine.userData.isMemoryWellWitness = true;
  witnessLine.userData.visualCoreImmutable = true;
  auraGroup.add(witnessLine);

  group.add(auraGroup);

  group.traverse((o) => {
    if (!o) return;
    o.userData = o.userData || {};
    if (o.isMesh || o.isLine || o.isLineSegments || o.isPoints) {
      o.userData.wavePatchMode = 'DEFAULT';
      if (o.userData.isMemoryWellRelic || o.userData.isMemoryWellIndex) {
        o.userData.ignoreWaveColor = true;
      }
      const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
      for (const material of materialRefs) {
        if (!material) continue;
        material.userData = {
          ...(material.userData || {}),
          wavePatchMode: 'DEFAULT'
        };
        if (o.userData.ignoreWaveColor) {
          material.userData.ignoreWaveColor = true;
        }
      }
    }
  });

  group.userData.visualReady = true;
  return group;
}

      const layerCount = 3; // Reduced count for better visibility of rotation

export class StorageEnhancedVariants {
  
  /**
   * STORAGE ENHANCED: ARCHIVE_NEXUS (Memory Cathedral Archive)
   * 
   * Description:
   * - Monumental archive cathedral with a tall memory nave
   * - Load-bearing buttresses and layered cache strata
   * - Suspended relic shards and context beads
   * - Visual metaphor: memory preserved so the network does not hallucinate
   */
  static createStorageEnhanced_ArchiveNexus(group, color) {
    try {
      group.userData = group.userData || {};
      const colorHex = new THREE.Color(color).getHex();
      const geometries = _getStorageMemoryCathedralGeometries();
      const materials = _getStorageMemoryCathedralMaterials(colorHex);
      const coreOrder = VisualHierarchyRegistry.getRenderOrder('CORE');
      const archOrder = VisualHierarchyRegistry.getRenderOrder('ARCHETYPE');
      const phase = ((colorHex & 0xffff) / 0xffff) * Math.PI * 2;

      const storageRoot = new THREE.Group();
      storageRoot.name = 'STORAGE_MEMORY_CATHEDRAL_NODE';
      storageRoot.userData.visualVariant = 'STORAGE_MEMORY_CATHEDRAL_V4';
      storageRoot.userData.storageVariant = 'MEMORY_CATHEDRAL';
      storageRoot.userData.nodeGeometryName = 'STORAGE_MEMORY_CATHEDRAL';
      storageRoot.userData.visualCoreImmutable = true;
      storageRoot.userData.memoryCathedralPhase = phase;
      storageRoot.userData.memoryCathedralSpinSpeed = 0.0018;

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';
      coreGroup.userData.isMemoryCathedralCoreGroup = true;
      coreGroup.userData.baseRotation = new THREE.Euler(0.14, 0.34, -0.06);
      coreGroup.userData.baseScale = new THREE.Vector3(1, 1, 1);

      const archiveHeart = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      archiveHeart.name = 'ArchiveHeart';
      archiveHeart.userData.isMemoryCathedralCoreMesh = true;
      archiveHeart.userData.baseRotation = new THREE.Euler(0.16, 0.34, -0.08);
      archiveHeart.userData.baseScale = archiveHeart.scale.clone();
      archiveHeart.position.set(0.0, 0.06, 0.02);
      archiveHeart.rotation.copy(archiveHeart.userData.baseRotation);
      archiveHeart.scale.set(1.02, 1.05, 0.96);
      archiveHeart.renderOrder = coreOrder;
      coreGroup.add(archiveHeart);

      const heartEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      heartEdges.name = 'ArchiveHeartEdges';
      heartEdges.userData.isMemoryCathedralCoreMesh = true;
      heartEdges.position.copy(archiveHeart.position);
      heartEdges.rotation.copy(archiveHeart.rotation);
      heartEdges.scale.copy(archiveHeart.scale);
      heartEdges.renderOrder = archOrder;
      coreGroup.add(heartEdges);

      const innerVoidSeam = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.46, 0.16, 1, 1, 1), materials.buttressMat);
      innerVoidSeam.name = 'VaultInnerVoidSeam';
      innerVoidSeam.userData.isMemoryCathedralSeam = true;
      innerVoidSeam.userData.baseRotation = new THREE.Euler(0.2, 0.42, -0.02);
      innerVoidSeam.position.set(0.02, 0.02, -0.01);
      innerVoidSeam.rotation.copy(innerVoidSeam.userData.baseRotation);
      innerVoidSeam.scale.set(1, 1.02, 1);
      innerVoidSeam.renderOrder = coreOrder;
      coreGroup.add(innerVoidSeam);

      const indexSeed = new THREE.Mesh(geometries.indexGeometry, materials.indexMat);
      indexSeed.name = 'ArchiveIndexSeed';
      indexSeed.userData.isMemoryCathedralIndex = true;
      indexSeed.userData.ignoreWaveColor = true;
      indexSeed.userData.baseRotation = new THREE.Euler(0.08, 0.26, -0.03);
      indexSeed.userData.basePosition = new THREE.Vector3(0.19, 0.12, 0.07);
      indexSeed.position.copy(indexSeed.userData.basePosition);
      indexSeed.rotation.copy(indexSeed.userData.baseRotation);
      indexSeed.scale.set(0.88, 1.06, 0.88);
      indexSeed.renderOrder = coreOrder;
      coreGroup.add(indexSeed);

      storageRoot.add(coreGroup);

      const naveGroup = new THREE.Group();
      naveGroup.name = 'NAVE_GROUP';
      naveGroup.userData.isMemoryCathedralNaveGroup = true;
      naveGroup.userData.baseRotation = new THREE.Euler(0.02, 0.14, -0.03);

      const naveAxis = new THREE.Mesh(geometries.naveGeometry, materials.naveMat);
      naveAxis.name = 'MemoryNaveAxis';
      naveAxis.userData.isMemoryCathedralNaveMesh = true;
      naveAxis.userData.baseRotation = new THREE.Euler(0.03, 0.16, -0.03);
      naveAxis.position.set(0.04, 0.08, -0.03);
      naveAxis.rotation.copy(naveAxis.userData.baseRotation);
      naveAxis.scale.set(1.0, 1.0, 0.94);
      naveAxis.renderOrder = coreOrder;
      naveGroup.add(naveAxis);

      const naveEdges = new THREE.LineSegments(geometries.naveEdgesGeometry, materials.edgeMat);
      naveEdges.name = 'MemoryNaveEdges';
      naveEdges.userData.isMemoryCathedralNaveMesh = true;
      naveEdges.position.copy(naveAxis.position);
      naveEdges.rotation.copy(naveAxis.rotation);
      naveEdges.scale.copy(naveAxis.scale);
      naveEdges.renderOrder = archOrder;
      naveGroup.add(naveEdges);

      storageRoot.add(naveGroup);

      const buttressGroup = new THREE.Group();
      buttressGroup.name = 'BUTTRESS_GROUP';
      buttressGroup.userData.isMemoryCathedralButtressGroup = true;
      buttressGroup.userData.baseRotation = new THREE.Euler(0, 0, 0);

      const buttressSpecs = [
        { pos: [0.56, 0.04, -0.2], rot: [0.06, 0.92, -0.08], scale: [1.06, 1.1, 0.76] },
        { pos: [-0.5, -0.06, 0.28], rot: [-0.12, -0.54, 0.12], scale: [0.9, 1.02, 0.68] },
        { pos: [0.12, 0.18, 0.62], rot: [0.2, 2.08, 0.18], scale: [0.86, 0.94, 0.58] },
        { pos: [-0.18, 0.28, -0.6], rot: [0.14, 0.32, -0.16], scale: [0.8, 0.88, 0.56] }
      ];

      buttressSpecs.forEach((spec, idx) => {
        const buttress = new THREE.Mesh(geometries.buttressGeometry, materials.buttressMat);
        buttress.name = `MemoryButtress_${idx}`;
        buttress.userData.isMemoryCathedralButtressMesh = true;
        buttress.userData.baseRotation = new THREE.Euler(spec.rot[0], spec.rot[1], spec.rot[2]);
        buttress.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
        buttress.rotation.copy(buttress.userData.baseRotation);
        buttress.scale.set(spec.scale[0], spec.scale[1], spec.scale[2]);
        buttress.renderOrder = coreOrder;
        buttressGroup.add(buttress);

        const buttressEdges = new THREE.LineSegments(geometries.buttressEdgesGeometry, materials.edgeMat);
        buttressEdges.name = `MemoryButtressEdges_${idx}`;
        buttressEdges.userData.isMemoryCathedralButtressMesh = true;
        buttressEdges.position.copy(buttress.position);
        buttressEdges.rotation.copy(buttress.rotation);
        buttressEdges.scale.copy(buttress.scale);
        buttressEdges.renderOrder = archOrder;
        buttressGroup.add(buttressEdges);
      });

      storageRoot.add(buttressGroup);

      const strataGroup = new THREE.Group();
      strataGroup.name = 'STRATA_GROUP';
      strataGroup.userData.isMemoryCathedralStrataGroup = true;
      strataGroup.userData.baseRotation = new THREE.Euler(0, 0.04, 0);

      const slabSpecs = [
        { pos: [-0.04, -0.68, 0.06], rot: [0.0, 0.12, -0.04], scale: [0.94, 1.0, 0.86] },
        { pos: [0.06, -0.42, -0.02], rot: [0.0, -0.2, 0.03], scale: [1.04, 1.0, 0.94] },
        { pos: [-0.08, -0.14, 0.08], rot: [0.0, 0.26, -0.03], scale: [1.16, 1.0, 1.0] },
        { pos: [0.08, 0.14, -0.06], rot: [0.0, -0.16, 0.04], scale: [1.08, 1.0, 0.92] },
        { pos: [-0.02, 0.42, 0.04], rot: [0.0, 0.28, -0.05], scale: [0.98, 1.0, 0.88] },
        { pos: [0.1, 0.72, -0.04], rot: [0.0, -0.3, 0.03], scale: [0.86, 1.0, 0.76] }
      ];

      slabSpecs.forEach((spec, idx) => {
        const slab = new THREE.Mesh(geometries.stratumGeometry, materials.stratumMat);
        slab.name = `MemoryStratum_${idx}`;
        slab.userData.isMemoryCathedralStratumMesh = true;
        slab.userData.baseRotation = new THREE.Euler(spec.rot[0], spec.rot[1], spec.rot[2]);
        slab.userData.basePosition = new THREE.Vector3(spec.pos[0], spec.pos[1], spec.pos[2]);
        slab.position.copy(slab.userData.basePosition);
        slab.rotation.copy(slab.userData.baseRotation);
        slab.scale.set(spec.scale[0], spec.scale[1], spec.scale[2]);
        slab.renderOrder = coreOrder;
        strataGroup.add(slab);

        const slabEdges = new THREE.LineSegments(geometries.stratumEdgesGeometry, materials.edgeMat);
        slabEdges.name = `MemoryStratumEdges_${idx}`;
        slabEdges.userData.isMemoryCathedralStratumMesh = true;
        slabEdges.position.copy(slab.position);
        slabEdges.rotation.copy(slab.rotation);
        slabEdges.scale.copy(slab.scale);
        slabEdges.renderOrder = archOrder;
        strataGroup.add(slabEdges);
      });

      storageRoot.add(strataGroup);

      const relicGroup = new THREE.Group();
      relicGroup.name = 'RELIC_GROUP';
      relicGroup.userData.isMemoryCathedralRelicGroup = true;
      relicGroup.userData.baseRotation = new THREE.Euler(0.01, 0.24, -0.01);

      const relicSpecs = [
        { pos: [0.62, -0.3, 0.12], rot: [0.18, 0.42, 0.12], scale: [0.92, 1.0, 0.92], speed: 0.009 },
        { pos: [0.68, -0.02, 0.22], rot: [0.08, 0.82, -0.18], scale: [0.88, 1.08, 0.92], speed: 0.012 },
        { pos: [0.56, 0.24, -0.14], rot: [0.22, 1.12, 0.16], scale: [1.0, 0.96, 0.86], speed: 0.014 },
        { pos: [0.4, 0.5, 0.18], rot: [-0.16, 0.26, -0.12], scale: [0.84, 1.04, 0.84], speed: 0.016 },
        { pos: [0.32, 0.82, -0.08], rot: [0.14, 0.58, 0.04], scale: [0.78, 0.9, 0.78], speed: 0.018 },
        { pos: [0.18, 1.02, 0.12], rot: [0.18, 1.0, -0.16], scale: [0.72, 0.86, 0.72], speed: 0.02 }
      ];

      relicSpecs.forEach((spec, idx) => {
        const relic = new THREE.Mesh(geometries.relicGeometry, materials.relicMat);
        relic.name = `MnemonicRelic_${idx}`;
        relic.userData.isMemoryCathedralRelicMesh = true;
        relic.userData.ignoreWaveColor = true;
        relic.userData.baseRotation = new THREE.Euler(spec.rot[0], spec.rot[1], spec.rot[2]);
        relic.userData.basePosition = new THREE.Vector3(spec.pos[0], spec.pos[1], spec.pos[2]);
        relic.userData.orbitPhase = idx * 0.83;
        relic.userData.orbitSpeed = spec.speed;
        relic.userData.orbitRadius = 0.032 + idx * 0.003;
        relic.position.copy(relic.userData.basePosition);
        relic.rotation.copy(relic.userData.baseRotation);
        relic.scale.set(spec.scale[0], spec.scale[1], spec.scale[2]);
        relic.renderOrder = coreOrder;
        relicGroup.add(relic);

        const relicEdges = new THREE.LineSegments(geometries.relicEdgesGeometry, materials.edgeMat);
        relicEdges.name = `MnemonicRelicEdges_${idx}`;
        relicEdges.userData.isMemoryCathedralRelicMesh = true;
        relicEdges.userData.ignoreWaveColor = true;
        relicEdges.position.copy(relic.position);
        relicEdges.rotation.copy(relic.rotation);
        relicEdges.scale.copy(relic.scale);
        relicEdges.renderOrder = archOrder;
        relicGroup.add(relicEdges);
      });

      storageRoot.add(relicGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';
      auraGroup.userData.isMemoryCathedralAuraGroup = true;
      auraGroup.userData.baseRotation = new THREE.Euler(0.01, 0.02, 0.0);

      const archiveDust = new THREE.Points(geometries.dustGeometry, materials.dustMat);
      archiveDust.name = 'ArchiveDust';
      archiveDust.userData.isMemoryCathedralDust = true;
      archiveDust.position.set(0.0, 0.02, 0.0);
      archiveDust.rotation.set(0.08, 0.44, -0.02);
      archiveDust.frustumCulled = false;
      archiveDust.renderOrder = archOrder;
      auraGroup.add(archiveDust);

      const witnessLine = new THREE.Line(geometries.witnessGeometry, materials.witnessMat);
      witnessLine.name = 'MemoryWitnessLine';
      witnessLine.userData.isMemoryCathedralWitness = true;
      witnessLine.frustumCulled = false;
      witnessLine.position.set(0.0, 0.0, 0.0);
      witnessLine.rotation.set(0.02, 0.2, -0.01);
      witnessLine.renderOrder = archOrder;
      auraGroup.add(witnessLine);

      storageRoot.add(auraGroup);

      storageRoot.traverse((o) => {
        if (!o) return;
        o.userData = o.userData || {};
        if (o.isMesh || o.isLine || o.isLineSegments || o.isPoints) {
          o.userData.wavePatchMode = 'DEFAULT';
          if (o.userData.isMemoryCathedralRelicMesh || o.userData.isMemoryCathedralIndex) {
            o.userData.ignoreWaveColor = true;
          }
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            if (!material) continue;
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT'
            };
            if (o.userData.ignoreWaveColor) {
              material.userData.ignoreWaveColor = true;
            }
          }
        }
      });

      storageRoot.userData.visualReady = true;
      group.userData.visualVariant = 'STORAGE_MEMORY_CATHEDRAL_V4';
      group.userData.storageVariant = 'MEMORY_CATHEDRAL';
      group.userData.nodeGeometryName = 'STORAGE_MEMORY_CATHEDRAL';
      group.userData.visualReady = true;
      group.userData.visualCoreImmutable = true;
      group.userData.memoryCathedralPhase = phase;
      group.userData.memoryCathedralSpinSpeed = 0.0018;

      group.add(storageRoot);
      return group;
    } catch (err) {
      console.warn('[StorageEnhancedVariants] MemoryCathedral creation failed:', err);
      return group;
    }
  }

  /**
   * STORAGE ENHANCED: MEMORY_CRYPTS (VaultStack)
   * 
   * Description:
   * - Stacked asymmetric chambers that rotate and slide vertically
   * - Like a locking mechanism constantly re-configuring
   */
  static createStorageEnhanced_MemoryCrypts(group, color) {
    try {
      const chamberCount = 5;
      const accentColor = new THREE.Color(color).multiplyScalar(1.3);
      
      const chamberMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.85,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.8
      });

      const accentMaterial = new THREE.MeshStandardMaterial({
        color: accentColor.getHex(),
        metalness: 0.95,
        roughness: 0.1,
        emissive: accentColor.getHex(),
        emissiveIntensity: 0.4
      });

      // Create stacked chambers
      for (let i = 0; i < chamberCount; i++) {
        // Create asymmetric chamber (hexagonal prism with offset)
        const radius = 0.4 - (i % 2) * 0.05; // Alternating widths
        const chamberGeo = new THREE.CylinderGeometry(radius, radius, 0.18, 6);
        
        const chamber = new THREE.Mesh(chamberGeo, chamberMaterial);
        
        // Initial position
        const yPos = (i - chamberCount / 2) * 0.25;
        chamber.position.set(0, yPos, 0);
        
        // Alternating rotation
        chamber.rotation.y = i * (Math.PI / 6);

        chamber.userData.isCryptChamber = true;
        chamber.userData.chamberIndex = i;
        chamber.userData.baseY = yPos;
        chamber.userData.visualCoreImmutable = true;
        group.add(chamber);

        // Add "Locking Pins" to each chamber
        for (let j = 0; j < 3; j++) {
            const pinGeo = new THREE.BoxGeometry(0.1, 0.05, 0.1);
            const pin = new THREE.Mesh(pinGeo, accentMaterial);
            const angle = (j / 3) * Math.PI * 2;
            
            pin.position.set(Math.cos(angle) * (radius + 0.05), 0, Math.sin(angle) * (radius + 0.05));
            pin.rotation.y = -angle;
            
            // Attach pins to chamber
            chamber.add(pin);
        }
      }

      // Central Axis
      const axisGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.4, 8);
      const axis = new THREE.Mesh(axisGeo, chamberMaterial);
      group.add(axis);

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'STORAGE_MEMORY_CRYPTS';

      return group;
    } catch (err) {
      console.warn('[StorageEnhancedVariants] MemoryCrypts creation failed:', err);
      return group;
    }
  }

  /**
   * STORAGE ENHANCED: DEPTH_LAYERS (Memory Well)
   * 
   * Description:
   * - Deep archive reservoir
   * - Layered retention bands
   * - Quiet retrieval and relic motion
   */
  static createStorageEnhanced_DepthLayers(group, color) {
    try {
      return _createStorageMemoryWellNode(group, color);
    } catch (err) {
      console.warn('[StorageEnhancedVariants] MemoryWell creation failed:', err);
      return group;
    }
  }
}

export default StorageEnhancedVariants;
