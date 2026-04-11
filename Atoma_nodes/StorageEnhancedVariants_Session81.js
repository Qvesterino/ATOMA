/**
 * STORAGE ENHANCED VARIANTS - Session 81 (Updated for KINETIC/AI-GROWN)
 * Four NEW production-ready Storage node variants
 * 
 * UPGRADE GOAL: Kinetic, "AI-Grown" behaviors (Tier 2)
 * - ArchiveNexus -> "Memory Cathedral" (Context vault)
 * - MemoryCrypts -> "VaultStack" (Sliding/Rotating chambers)
 * - DepthLayers -> "Memory Well" (Archive reservoir)
 * - MnemonicChoirReliquary -> "Mnemonic Choir Reliquary" (Ceremonial storage flagship)
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
const STORAGE_MNEMONIC_CHOIR_RELIQUARY_CACHE = {
  coreGeometry: null,
  coreAccentGeometry: null,
  shellFrontGeometry: null,
  shellWingGeometry: null,
  choirPlateGeometry: null,
  echoRibbonGeometry: null,
  echoShardGeometry: null,
  echoBeadGeometry: null,
  haloFragmentGeometry: null,
  haloShimmerGeometry: null,
  dustGeometry: null,
  glowGeometry: null,
  lockGeometry: null
};

const STORAGE_MNEMONIC_CHOIR_RELIQUARY_MATERIALS = new Map();

function hashString(str) {
  let hash = 0;
  const input = String(str ?? '');
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function _mythicSeededRng(seed = 1) {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

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
   * STORAGE ENHANCED: MNEMONIC_CHOIR_RELIQUARY (Ceremonial Choir Reliquary)
   *
   * Description:
   * - Preserved memory heart suspended in a sacred storage shell
   * - Broken halo crown and asymmetric choir plates hold the silhouette open
   * - Sparse echo ribbons and memory beads drift with restraint
   */
  static createStorageMnemonicChoirReliquary(group, visualCode, color) {
    try {
      return _createStorageMnemonicChoirReliquaryNode(group, visualCode, color);
    } catch (err) {
      console.warn('[StorageEnhancedVariants] MnemonicChoirReliquary creation failed:', err);
      return null;
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

function _resolveStorageMnemonicChoirReliquaryColor(group, visualCode, color, fallback = 0x9fd6e6) {
  const legacyColor = typeof group?.userData?.color === 'number' ? group.userData.color : undefined;

  if (typeof color === 'number') {
    return new THREE.Color(color).getHex();
  }

  if (typeof visualCode === 'number' && visualCode > 4095) {
    return new THREE.Color(visualCode).getHex();
  }

  if (typeof legacyColor === 'number') {
    return new THREE.Color(legacyColor).getHex();
  }

  return new THREE.Color(fallback).getHex();
}

function _getStorageMnemonicChoirReliquaryRenderOrders() {
  const api = globalThis?.EnhancedNodeModels;
  return {
    coreOrder: api && typeof api._getCoreRenderOrder === 'function' ? api._getCoreRenderOrder() : 0,
    archOrder: api && typeof api._getArchetypeRenderOrder === 'function' ? api._getArchetypeRenderOrder() : 1
  };
}

function _deformStorageMnemonicChoirReliquaryGeometry(geometry, transformFn) {
  const position = geometry?.attributes?.position;
  if (!position) {
    return geometry;
  }

  const scratch = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    scratch.set(position.getX(i), position.getY(i), position.getZ(i));
    transformFn(scratch, i);
    position.setXYZ(i, scratch.x, scratch.y, scratch.z);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function _getStorageMnemonicChoirReliquaryGeometries() {
  if (!STORAGE_MNEMONIC_CHOIR_RELIQUARY_CACHE.coreGeometry) {
    const coreGeometry = new THREE.DodecahedronGeometry(0.18, 0);
    _deformStorageMnemonicChoirReliquaryGeometry(coreGeometry, (v, i) => {
      const frontBias = Math.max(0, v.z) * 0.08;
      const topBias = Math.max(0, v.y) * 0.06;
      const sideBias = Math.abs(v.x) * 0.02;
      v.x = v.x * (0.92 + topBias) + Math.sign(v.x || 1) * 0.006 * (1 - sideBias);
      v.y = v.y * (0.9 + frontBias * 0.5);
      v.z = v.z * (0.86 + frontBias) + Math.sin(i * 0.21) * 0.003;
    });
    STORAGE_MNEMONIC_CHOIR_RELIQUARY_CACHE.coreGeometry = coreGeometry;

    const coreAccentGeometry = new THREE.CylinderGeometry(0.026, 0.04, 0.1, 6, 1, false);
    _deformStorageMnemonicChoirReliquaryGeometry(coreAccentGeometry, (v) => {
      const yWeight = Math.min(1, Math.abs(v.y) / 0.05);
      v.x = v.x * (0.82 + yWeight * 0.08) + v.z * 0.012;
      v.y = v.y * 1.0;
      v.z = v.z * (0.84 + yWeight * 0.04) - v.x * 0.01;
    });
    STORAGE_MNEMONIC_CHOIR_RELIQUARY_CACHE.coreAccentGeometry = coreAccentGeometry;

    const shellFrontGeometry = new THREE.BoxGeometry(0.68, 1.24, 0.14, 1, 6, 1);
    _deformStorageMnemonicChoirReliquaryGeometry(shellFrontGeometry, (v, i) => {
      const yWeight = Math.min(1, Math.abs(v.y) / 0.62);
      const frontBias = Math.max(0, v.z) * 0.18;
      v.x = v.x * (0.92 + (1 - yWeight) * 0.08) + v.z * 0.02;
      v.y = v.y * (0.96 + (1 - yWeight) * 0.04);
      v.z = v.z * (0.88 + frontBias) + Math.sin(i * 0.18) * 0.0025;
    });
    STORAGE_MNEMONIC_CHOIR_RELIQUARY_CACHE.shellFrontGeometry = shellFrontGeometry;

    const shellWingGeometry = new THREE.BoxGeometry(0.2, 0.96, 0.08, 1, 4, 1);
    _deformStorageMnemonicChoirReliquaryGeometry(shellWingGeometry, (v, i) => {
      const yWeight = Math.min(1, Math.abs(v.y) / 0.48);
      const flankBias = Math.max(0, -v.x) * 0.09;
      v.x = v.x * (0.78 + yWeight * 0.06) + v.z * 0.018 + Math.sin(i * 0.17) * 0.0015;
      v.y = v.y * (0.96 + (1 - yWeight) * 0.03);
      v.z = v.z * (0.9 + flankBias) - v.x * 0.014;
    });
    STORAGE_MNEMONIC_CHOIR_RELIQUARY_CACHE.shellWingGeometry = shellWingGeometry;

    const choirPlateGeometry = new THREE.BoxGeometry(0.12, 0.82, 0.06, 1, 5, 1);
    _deformStorageMnemonicChoirReliquaryGeometry(choirPlateGeometry, (v, i) => {
      const yWeight = Math.min(1, Math.abs(v.y) / 0.41);
      const bow = Math.sin((v.y * 7.5) + i * 0.28) * 0.012;
      v.x = v.x * (0.84 + (1 - yWeight) * 0.1) + bow + v.z * 0.024;
      v.y = v.y * 1.0;
      v.z = v.z * (0.9 + yWeight * 0.04) - v.x * 0.018;
    });
    STORAGE_MNEMONIC_CHOIR_RELIQUARY_CACHE.choirPlateGeometry = choirPlateGeometry;

    const echoRibbonGeometry = new THREE.BoxGeometry(0.03, 0.46, 0.016, 1, 4, 1);
    _deformStorageMnemonicChoirReliquaryGeometry(echoRibbonGeometry, (v, i) => {
      const yWeight = Math.min(1, Math.abs(v.y) / 0.23);
      v.x = v.x * (0.82 + yWeight * 0.08) + Math.sin((v.y + i) * 6.2) * 0.004;
      v.y = v.y * 1.0;
      v.z = v.z * (0.88 + yWeight * 0.08) - v.x * 0.014;
    });
    STORAGE_MNEMONIC_CHOIR_RELIQUARY_CACHE.echoRibbonGeometry = echoRibbonGeometry;

    const echoShardGeometry = new THREE.TetrahedronGeometry(0.05, 0);
    STORAGE_MNEMONIC_CHOIR_RELIQUARY_CACHE.echoShardGeometry = echoShardGeometry;

    const echoBeadGeometry = new THREE.IcosahedronGeometry(0.033, 0);
    STORAGE_MNEMONIC_CHOIR_RELIQUARY_CACHE.echoBeadGeometry = echoBeadGeometry;

    const haloFragmentGeometry = new THREE.TetrahedronGeometry(0.043, 0);
    STORAGE_MNEMONIC_CHOIR_RELIQUARY_CACHE.haloFragmentGeometry = haloFragmentGeometry;

    const haloShimmerPositions = [];
    const haloShimmerCount = 18;
    for (let i = 0; i < haloShimmerCount; i++) {
      const t = i / haloShimmerCount;
      const angle = -0.72 + t * 1.46;
      const radius = 0.74 + Math.sin(i * 1.19) * 0.05;
      haloShimmerPositions.push(
        Math.cos(angle) * radius,
        0.72 + Math.sin(i * 0.71) * 0.035,
        Math.sin(angle) * (0.3 + Math.cos(i * 0.83) * 0.06)
      );
    }
    const haloShimmerGeometry = new THREE.BufferGeometry();
    haloShimmerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(haloShimmerPositions, 3));
    haloShimmerGeometry.computeBoundingSphere();
    STORAGE_MNEMONIC_CHOIR_RELIQUARY_CACHE.haloShimmerGeometry = haloShimmerGeometry;

    const dustPositions = [];
    const dustCount = 50;
    for (let i = 0; i < dustCount; i++) {
      const t = i / dustCount;
      const angle = t * Math.PI * 2.0;
      const radius = 0.72 + Math.sin(i * 1.37) * 0.08;
      dustPositions.push(
        Math.cos(angle) * radius,
        -0.86 + t * 1.68 + Math.sin(i * 0.73) * 0.04,
        Math.sin(angle) * (0.34 + Math.cos(i * 1.01) * 0.06)
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();
    STORAGE_MNEMONIC_CHOIR_RELIQUARY_CACHE.dustGeometry = dustGeometry;

    const glowGeometry = new THREE.IcosahedronGeometry(0.08, 0);
    STORAGE_MNEMONIC_CHOIR_RELIQUARY_CACHE.glowGeometry = glowGeometry;

    const lockGeometry = new THREE.CylinderGeometry(0.024, 0.032, 0.14, 6, 1, false);
    _deformStorageMnemonicChoirReliquaryGeometry(lockGeometry, (v, i) => {
      const yWeight = Math.min(1, Math.abs(v.y) / 0.07);
      v.x = v.x * (0.8 + yWeight * 0.08) + Math.sin(i * 0.29) * 0.001;
      v.y = v.y * 1.0;
      v.z = v.z * (0.82 + yWeight * 0.04) - v.x * 0.008;
    });
    STORAGE_MNEMONIC_CHOIR_RELIQUARY_CACHE.lockGeometry = lockGeometry;
  }

  return STORAGE_MNEMONIC_CHOIR_RELIQUARY_CACHE;
}

function _getStorageMnemonicChoirReliquaryMaterials(colorHex = 0x9fd6e6) {
  const key = String(colorHex >>> 0);
  if (STORAGE_MNEMONIC_CHOIR_RELIQUARY_MATERIALS.has(key)) {
    return STORAGE_MNEMONIC_CHOIR_RELIQUARY_MATERIALS.get(key);
  }

  const storageColor = new THREE.Color(colorHex);
  const pearl = new THREE.Color(0xf6fbff);
  const silver = new THREE.Color(0xc7d8df);
  const dusk = new THREE.Color(0x162029);
  const tint = storageColor.clone().lerp(new THREE.Color(0xc8edf8), 0.68);
  const haloTint = storageColor.clone().lerp(pearl, 0.86);
  const shellTint = storageColor.clone().lerp(silver, 0.42);
  const choirTint = storageColor.clone().lerp(pearl, 0.52);

  const coreMat = _setStorageWaveDefaults(new THREE.MeshStandardMaterial({
    color: dusk.clone().lerp(shellTint, 0.28),
    emissive: tint.clone().lerp(pearl, 0.14),
    emissiveIntensity: 0.18,
    metalness: 0.72,
    roughness: 0.26,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  }));

  const shellMat = _setStorageWaveDefaults(new THREE.MeshPhysicalMaterial({
    color: dusk.clone().lerp(shellTint, 0.46),
    emissive: shellTint.clone().lerp(pearl, 0.1),
    emissiveIntensity: 0.1,
    metalness: 0.62,
    roughness: 0.28,
    transparent: true,
    opacity: 0.9,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide
  }));

  const choirMat = _setStorageWaveDefaults(new THREE.MeshStandardMaterial({
    color: dusk.clone().lerp(choirTint, 0.34),
    emissive: choirTint.clone().lerp(pearl, 0.08),
    emissiveIntensity: 0.12,
    metalness: 0.58,
    roughness: 0.3,
    transparent: true,
    opacity: 0.86,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide
  }));

  const echoMat = _setStorageWaveDefaults(new THREE.MeshStandardMaterial({
    color: dusk.clone().lerp(tint, 0.28),
    emissive: tint.clone().lerp(pearl, 0.18),
    emissiveIntensity: 0.16,
    metalness: 0.48,
    roughness: 0.24,
    transparent: true,
    opacity: 0.8,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide
  }));

  const markerMat = _setStorageWaveDefaults(new THREE.MeshBasicMaterial({
    color: haloTint.clone().lerp(pearl, 0.12),
    transparent: true,
    opacity: 0.94,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide
  }), true);

  const haloMat = _setStorageWaveDefaults(new THREE.MeshBasicMaterial({
    color: haloTint.clone().lerp(pearl, 0.16),
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide
  }));

  const shimmerMat = _setStorageWaveDefaults(new THREE.PointsMaterial({
    color: haloTint.clone().lerp(pearl, 0.08),
    size: 0.03,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    sizeAttenuation: true
  }));

  const dustMat = _setStorageWaveDefaults(new THREE.PointsMaterial({
    color: pearl.clone().lerp(choirTint, 0.18),
    size: 0.026,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    sizeAttenuation: true
  }));

  const glowMat = _setStorageWaveDefaults(new THREE.MeshBasicMaterial({
    color: haloTint.clone().lerp(pearl, 0.24),
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide
  }));

  const mats = {
    coreMat,
    shellMat,
    choirMat,
    echoMat,
    markerMat,
    haloMat,
    shimmerMat,
    dustMat,
    glowMat
  };

  STORAGE_MNEMONIC_CHOIR_RELIQUARY_MATERIALS.set(key, mats);
  return mats;
}

function _createStorageMnemonicChoirReliquaryNode(group, visualCode, color) {
  try {
    const root = group || new THREE.Group();
    root.userData = root.userData || {};

    const resolvedVisualCode = Number.isFinite(visualCode) && visualCode <= 4095
      ? visualCode
      : (Number.isFinite(root.userData.visualCode) ? root.userData.visualCode : 516);
    const resolvedColorHex = _resolveStorageMnemonicChoirReliquaryColor(root, visualCode, color);
    const nodeKey = root.userData.nodeId || root.uuid || String(resolvedVisualCode || resolvedColorHex);
    const seed = Math.abs(hashString(`516|${nodeKey}|${resolvedColorHex}`)) || 516;
    const rng = _mythicSeededRng(seed);
    const geometries = _getStorageMnemonicChoirReliquaryGeometries();
    const materials = _getStorageMnemonicChoirReliquaryMaterials(resolvedColorHex);
    const { coreOrder, archOrder } = _getStorageMnemonicChoirReliquaryRenderOrders();

    root.name = 'STORAGE_MNEMONIC_CHOIR_RELIQUARY_NODE';
    root.rotation.set(0.05, 0.12, -0.03);
    root.userData.color = resolvedColorHex;
    root.userData.visualVariant = 'STORAGE_MNEMONIC_CHOIR_RELIQUARY_V4';
    root.userData.storageVariant = 'MNEMONIC_CHOIR_RELIQUARY';
    root.userData.nodeGeometryName = 'STORAGE_MNEMONIC_CHOIR_RELIQUARY_V4';
    root.userData.visualReady = true;
    root.userData.visualCoreImmutable = true;
    root.userData.mnemonicChoirReliquaryPhase = rng() * Math.PI * 2;
    root.userData.mnemonicChoirReliquaryCoreSpeed = 0.012 + rng() * 0.0025;
    root.userData.mnemonicChoirReliquaryShellSpeed = 0.008 + rng() * 0.0018;
    root.userData.mnemonicChoirReliquaryChoirSpeed = 0.007 + rng() * 0.0016;
    root.userData.mnemonicChoirReliquaryEchoSpeed = 0.006 + rng() * 0.0012;
    root.userData.mnemonicChoirReliquaryAuraSpeed = 0.005 + rng() * 0.0011;
    root.userData.mnemonicChoirReliquaryHaloSpeed = 0.004 + rng() * 0.0009;
    root.userData.mnemonicChoirReliquaryBaseRotation = root.rotation.clone();
    root.userData.mnemonicChoirReliquaryBaseScale = root.scale.clone();
    root.userData.mnemonicChoirReliquaryBaseY = root.position.y;
    root.userData.nodeId = root.userData.nodeId || root.uuid;

    const refs = {
      coreGroup: null,
      reliquaryGroup: null,
      choirGroup: null,
      echoGroup: null,
      auraGroup: null,
      coreHeart: null,
      coreAccent: null,
      shellPieces: [],
      haloFragments: [],
      choirPlates: [],
      echoRibbons: [],
      echoShards: [],
      echoBeads: [],
      haloShimmer: null,
      dustPoints: null,
      supportGlow: null
    };

    const makeMesh = (parent, geometry, material, name, options = {}) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = name;
      mesh.userData = mesh.userData || {};
      mesh.userData.visualCoreImmutable = true;
      mesh.userData.wavePatchMode = 'DEFAULT';
      if (options.ignoreWaveColor) {
        mesh.userData.ignoreWaveColor = true;
      }
      if (options.interactive !== false) {
        mesh.userData.isInteractive = true;
        if (mesh.raycast == null) {
          mesh.raycast = THREE.Mesh.prototype.raycast;
        }
      }
      if (options.position) {
        mesh.position.set(options.position[0], options.position[1], options.position[2]);
      }
      if (options.rotation) {
        mesh.rotation.set(options.rotation[0], options.rotation[1], options.rotation[2]);
      }
      if (options.scale) {
        mesh.scale.set(options.scale[0], options.scale[1], options.scale[2]);
      }
      mesh.renderOrder = options.renderOrder ?? coreOrder;
      mesh.userData.basePosition = mesh.position.clone();
      mesh.userData.baseRotation = mesh.rotation.clone();
      mesh.userData.baseScale = mesh.scale.clone();
      parent.add(mesh);
      return mesh;
    };

    const makeGroup = (parent, name, baseRotation, baseScale) => {
      const nodeGroup = new THREE.Group();
      nodeGroup.name = name;
      nodeGroup.userData = nodeGroup.userData || {};
      nodeGroup.userData.baseRotation = baseRotation.clone();
      nodeGroup.userData.baseScale = baseScale.clone();
      parent.add(nodeGroup);
      return nodeGroup;
    };

    const coreGroup = makeGroup(root, 'CORE_GROUP', new THREE.Euler(0.12, 0.2, -0.04), new THREE.Vector3(1, 1, 1));
    refs.coreGroup = coreGroup;

    const coreHeart = makeMesh(coreGroup, geometries.coreGeometry, materials.coreMat, 'MemoryHeart', {
      position: [0.01, 0.05, 0.03],
      rotation: [0.18, 0.34, -0.08],
      scale: [1.0, 1.06, 0.94],
      renderOrder: coreOrder
    });
    refs.coreHeart = coreHeart;

    const coreAccent = makeMesh(coreGroup, geometries.coreAccentGeometry, materials.markerMat, 'MemoryHeartAccent', {
      position: [0.11, 0.1, 0.0],
      rotation: [0.24, -0.16, 0.08],
      scale: [0.78, 0.86, 0.78],
      renderOrder: coreOrder,
      ignoreWaveColor: true
    });
    refs.coreAccent = coreAccent;

    const reliquaryGroup = makeGroup(root, 'RELIQUARY_GROUP', new THREE.Euler(0.02, 0.12, -0.02), new THREE.Vector3(1, 1, 1));
    refs.reliquaryGroup = reliquaryGroup;

    const shellPieces = [
      { name: 'ReliquarySanctumFront', position: [0.02, 0.02, 0.14], rotation: [0.04, 0.18, -0.02], scale: [1.0, 1.0, 0.98] },
      { name: 'ReliquarySanctumFlank_L', position: [-0.3, -0.02, -0.04], rotation: [0.08, -0.44, 0.18], scale: [0.92, 1.02, 0.84] },
      { name: 'ReliquarySanctumFlank_R', position: [0.3, 0.0, -0.08], rotation: [-0.06, 0.42, -0.14], scale: [0.9, 1.0, 0.82] },
      { name: 'ReliquaryApertureCap', position: [0.02, 0.54, 0.04], rotation: [0.16, 0.04, 0.12], scale: [0.98, 0.82, 0.86] }
    ];
    shellPieces.forEach((spec, idx) => {
      const shell = makeMesh(reliquaryGroup, idx === 0 ? geometries.shellFrontGeometry : geometries.shellWingGeometry, materials.shellMat, spec.name, {
        position: spec.position,
        rotation: spec.rotation,
        scale: spec.scale,
        renderOrder: coreOrder
      });
      shell.userData.shellIndex = idx;
      refs.shellPieces.push(shell);
    });

    const lockMarker = makeMesh(reliquaryGroup, geometries.lockGeometry, materials.markerMat, 'ReliquaryLockMarker', {
      position: [0.06, -0.08, 0.12],
      rotation: [0.18, 0.1, -0.04],
      scale: [0.9, 0.96, 0.9],
      renderOrder: coreOrder,
      ignoreWaveColor: true
    });
    lockMarker.userData.isMnemonicLockMarker = true;

    const haloFragmentSpecs = [
      { name: 'HaloCrown_A', position: [-0.32, 0.72, 0.08], rotation: [0.18, 0.26, 0.22], scale: [0.88, 1.0, 0.86] },
      { name: 'HaloCrown_B', position: [0.26, 0.78, -0.02], rotation: [-0.14, -0.34, -0.18], scale: [0.82, 0.94, 0.8] },
      { name: 'HaloCrown_C', position: [0.0, 0.92, 0.12], rotation: [0.22, 0.5, 0.08], scale: [0.7, 0.84, 0.7] },
      { name: 'HaloCrown_D', position: [-0.08, 0.64, -0.16], rotation: [0.42, 0.12, -0.34], scale: [0.66, 0.8, 0.68] },
      { name: 'HaloCrown_E', position: [0.38, 0.58, 0.16], rotation: [-0.08, 0.82, 0.18], scale: [0.62, 0.76, 0.64] }
    ];
    haloFragmentSpecs.forEach((spec, idx) => {
      const haloFragment = makeMesh(reliquaryGroup, geometries.haloFragmentGeometry, materials.haloMat, spec.name, {
        position: spec.position,
        rotation: spec.rotation,
        scale: spec.scale,
        renderOrder: archOrder
      });
      haloFragment.userData.haloFragmentIndex = idx;
      haloFragment.userData.haloFragmentPhase = root.userData.mnemonicChoirReliquaryPhase + idx * 0.61;
      refs.haloFragments.push(haloFragment);
    });

    const choirGroup = makeGroup(root, 'CHOIR_GROUP', new THREE.Euler(-0.02, 0.2, 0.04), new THREE.Vector3(1, 1, 1));
    refs.choirGroup = choirGroup;

    const choirSpecs = [
      { name: 'ChoirPlate_A', position: [-0.46, 0.22, 0.16], rotation: [0.26, 0.34, -0.44], scale: [1.06, 1.12, 0.8] },
      { name: 'ChoirPlate_B', position: [0.38, 0.08, -0.2], rotation: [-0.22, -0.5, 0.34], scale: [0.92, 0.98, 0.76] },
      { name: 'ChoirPlate_C', position: [-0.18, 0.6, 0.22], rotation: [0.56, -0.16, 0.18], scale: [0.76, 0.94, 0.68] },
      { name: 'ChoirPlate_D', position: [0.16, -0.02, -0.28], rotation: [0.14, 0.24, -0.24], scale: [0.62, 0.84, 0.66] },
      { name: 'ChoirPlate_E', position: [0.24, 0.42, 0.04], rotation: [-0.08, 0.62, -0.08], scale: [0.58, 0.74, 0.6] }
    ];
    choirSpecs.forEach((spec, idx) => {
      const choirPlate = makeMesh(choirGroup, geometries.choirPlateGeometry, materials.choirMat, spec.name, {
        position: spec.position,
        rotation: spec.rotation,
        scale: spec.scale,
        renderOrder: archOrder
      });
      choirPlate.userData.choirPlateIndex = idx;
      choirPlate.userData.choirPlatePhase = root.userData.mnemonicChoirReliquaryPhase + idx * 0.47;
      refs.choirPlates.push(choirPlate);
    });

    const echoGroup = makeGroup(root, 'ECHO_GROUP', new THREE.Euler(0.01, -0.08, -0.02), new THREE.Vector3(1, 1, 1));
    refs.echoGroup = echoGroup;

    const echoRibbonSpecs = [
      { name: 'EchoRibbon_A', position: [-0.18, -0.34, 0.16], rotation: [0.22, 0.16, 0.28], scale: [0.98, 1.0, 0.92] },
      { name: 'EchoRibbon_B', position: [0.18, -0.16, -0.18], rotation: [-0.16, -0.22, -0.26], scale: [0.84, 0.96, 0.82] }
    ];
    echoRibbonSpecs.forEach((spec, idx) => {
      const ribbon = makeMesh(echoGroup, geometries.echoRibbonGeometry, materials.echoMat, spec.name, {
        position: spec.position,
        rotation: spec.rotation,
        scale: spec.scale,
        renderOrder: archOrder
      });
      ribbon.userData.echoRibbonIndex = idx;
      ribbon.userData.echoRibbonPhase = root.userData.mnemonicChoirReliquaryPhase + idx * 0.72;
      refs.echoRibbons.push(ribbon);
    });

    const echoShardSpecs = [
      { name: 'EchoShard_A', position: [-0.26, -0.18, 0.28], rotation: [0.38, 0.28, -0.08], scale: [0.82, 0.86, 0.8] },
      { name: 'EchoShard_B', position: [0.34, 0.04, -0.12], rotation: [-0.24, 0.62, 0.16], scale: [0.72, 0.8, 0.68] },
      { name: 'EchoShard_C', position: [0.04, -0.44, 0.02], rotation: [0.16, -0.28, 0.22], scale: [0.64, 0.72, 0.62] }
    ];
    echoShardSpecs.forEach((spec, idx) => {
      const shard = makeMesh(echoGroup, geometries.echoShardGeometry, materials.echoMat, spec.name, {
        position: spec.position,
        rotation: spec.rotation,
        scale: spec.scale,
        renderOrder: archOrder
      });
      shard.userData.echoShardIndex = idx;
      shard.userData.echoShardPhase = root.userData.mnemonicChoirReliquaryPhase + idx * 0.58;
      refs.echoShards.push(shard);
    });

    const echoBeadSpecs = [
      { name: 'EchoBead_A', position: [-0.08, -0.56, 0.22], rotation: [0.08, 0.12, -0.04], scale: [0.96, 0.96, 0.96] },
      { name: 'EchoBead_B', position: [0.22, -0.42, -0.06], rotation: [-0.08, 0.24, 0.08], scale: [0.88, 0.88, 0.88] }
    ];
    echoBeadSpecs.forEach((spec, idx) => {
      const bead = makeMesh(echoGroup, geometries.echoBeadGeometry, materials.markerMat, spec.name, {
        position: spec.position,
        rotation: spec.rotation,
        scale: spec.scale,
        renderOrder: archOrder,
        ignoreWaveColor: true
      });
      bead.userData.echoBeadIndex = idx;
      bead.userData.echoBeadPhase = root.userData.mnemonicChoirReliquaryPhase + idx * 0.83;
      refs.echoBeads.push(bead);
    });

    const auraGroup = makeGroup(root, 'AURA_GROUP', new THREE.Euler(0.02, 0.08, 0.0), new THREE.Vector3(1, 1, 1));
    refs.auraGroup = auraGroup;

    const haloShimmer = new THREE.Points(geometries.haloShimmerGeometry, materials.shimmerMat);
    haloShimmer.name = 'HaloShimmer';
    haloShimmer.frustumCulled = false;
    haloShimmer.renderOrder = archOrder;
    haloShimmer.userData = haloShimmer.userData || {};
    haloShimmer.userData.visualCoreImmutable = true;
    haloShimmer.userData.wavePatchMode = 'DEFAULT';
    haloShimmer.userData.baseRotation = haloShimmer.rotation.clone();
    auraGroup.add(haloShimmer);
    refs.haloShimmer = haloShimmer;

    const supportGlow = makeMesh(auraGroup, geometries.glowGeometry, materials.glowMat, 'SupportGlow', {
      position: [0.02, 0.04, -0.02],
      rotation: [0.0, 0.0, 0.0],
      scale: [1.08, 1.08, 1.08],
      renderOrder: archOrder,
      interactive: false
    });
    supportGlow.userData.isMnemonicSupportGlow = true;
    refs.supportGlow = supportGlow;

    const dustPositions = [];
    const dustCount = 44;
    for (let i = 0; i < dustCount; i++) {
      const t = i / dustCount;
      const angle = t * Math.PI * 2.0;
      const radius = 0.62 + Math.sin(i * 1.31) * 0.06;
      dustPositions.push(
        Math.cos(angle) * radius,
        -0.72 + t * 1.44 + Math.sin(i * 0.87) * 0.028,
        Math.sin(angle) * (0.28 + Math.cos(i * 1.09) * 0.05)
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();

    const dustPoints = new THREE.Points(dustGeometry, materials.dustMat);
    dustPoints.name = 'MemoryDust';
    dustPoints.frustumCulled = false;
    dustPoints.renderOrder = archOrder;
    dustPoints.userData = dustPoints.userData || {};
    dustPoints.userData.visualCoreImmutable = true;
    dustPoints.userData.wavePatchMode = 'DEFAULT';
    dustPoints.userData.baseRotation = dustPoints.rotation.clone();
    auraGroup.add(dustPoints);
    refs.dustPoints = dustPoints;

    root.userData.mnemonicChoirReliquaryRefs = refs;

    root.traverse((o) => {
      if (!o) return;
      o.userData = o.userData || {};
      if (o.isMesh || o.isPoints) {
        o.userData.wavePatchMode = 'DEFAULT';
        if (o.isMesh && o.raycast == null) {
          o.raycast = THREE.Mesh.prototype.raycast;
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

    return root;
  } catch (err) {
    console.error('[StorageEnhancedVariants] MnemonicChoirReliquary creation failed:', err);
    return null;
  }
}
