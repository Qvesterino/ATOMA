/**
 * STORAGE ENHANCED VARIANTS - Session 81 (Updated for KINETIC/AI-GROWN)
 * Three NEW production-ready Storage node variants
 * 
 * UPGRADE GOAL: Kinetic, "AI-Grown" behaviors (Tier 2)
 * - ArchiveNexus -> "Memory Cathedral" (Context vault)
 * - MemoryCrypts -> "VaultStack" (Sliding/Rotating chambers)
 * - DepthLayers -> "ContainmentField" (Breathing/Rotating shells)
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

      const shell1 = new THREE.Mesh(geometries.shellGeometry, materials.shellMat);
      shell1.name = 'MemoryShell_1';
      shell1.userData.isMemoryCathedralShellMesh = true;
      shell1.position.set(0.02, 0.0, 0.0);
      shell1.rotation.set(0.04, 0.14, -0.02);
      shell1.scale.set(1.02, 1.0, 0.96);
      shell1.renderOrder = archOrder;
      auraGroup.add(shell1);

      const shell2 = new THREE.Mesh(geometries.shellGeometry, materials.shellMat);
      shell2.name = 'MemoryShell_2';
      shell2.userData.isMemoryCathedralShellMesh = true;
      shell2.position.set(-0.03, 0.02, 0.02);
      shell2.rotation.set(-0.03, -0.16, 0.03);
      shell2.scale.set(1.18, 1.06, 1.0);
      shell2.renderOrder = archOrder;
      auraGroup.add(shell2);

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
   * STORAGE ENHANCED: DEPTH_LAYERS (ContainmentField)
   * 
   * Description:
   * - Concentric shells rotating on different axes
   * - "Breathing" expansion/contraction
   * - Erosion details orbiting the surface
   */
  static createStorageEnhanced_DepthLayers(group, color) {
    try {
      const layerCount = 3; // Reduced count for better visibility of rotation
      
      for (let layer = 0; layer < layerCount; layer++) {
        const seed = layer * 4.32;
        
        // Distinct material for each layer
        const layerOpacity = 0.5 + (layer * 0.15);
        const layerMaterial = new THREE.MeshPhysicalMaterial({
          color: color,
          metalness: 0.8,
          roughness: 0.2,
          emissive: color,
          emissiveIntensity: 0.2,
          transparent: true,
          opacity: layerOpacity,
          transmission: 0, // Phase B.3.A: transmission disabled to prevent RenderTransmissionPass
          thickness: 0.1
        });

        // Create shell (Icosahedron based)
        const radius = 0.8 - (layer * 0.25);
        const shellGeo = new THREE.IcosahedronGeometry(radius, 1);
        
        // Distort geometry slightly
        const posAttribute = shellGeo.attributes.position;
        for (let i = 0; i < posAttribute.count; i++) {
            const x = posAttribute.getX(i);
            const y = posAttribute.getY(i);
            const z = posAttribute.getZ(i);
            // Noise-like distortion
            const scale = 1.0 + Math.sin(x * 5 + seed) * 0.05;
            posAttribute.setXYZ(i, x * scale, y * scale, z * scale);
        }
        shellGeo.computeVertexNormals();

        const shell = new THREE.Mesh(shellGeo, layerMaterial);
        
        shell.userData.isDepthShell = true;
        shell.userData.layerIndex = layer;
        // Random rotation axis for each shell
        shell.userData.rotationAxis = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();
        shell.userData.rotationSpeed = 0.1 + (layer * 0.15); // Outer slower, inner faster
        shell.userData.visualCoreImmutable = true;
        
        group.add(shell);

        // Add "Data Particulates" orbiting this shell
        const partCount = 4;
        for (let p=0; p<partCount; p++) {
            const partGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
            const part = new THREE.Mesh(partGeo, layerMaterial);
            
            const angle = (p / partCount) * Math.PI * 2;
            const r = radius + 0.1;
            
            part.position.set(Math.cos(angle)*r, Math.sin(angle)*r * 0.5, Math.sin(angle)*r);
            
            // Attach to shell so they rotate with it (or could be separate for complex orbit)
            shell.add(part);
        }
      }

      // Core Singularity
      const coreGeo = new THREE.SphereGeometry(0.15, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.userData.isDepthCore = true;
      group.add(core);

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'STORAGE_DEPTH_LAYERS';

      return group;
    } catch (err) {
      console.warn('[StorageEnhancedVariants] DepthLayers creation failed:', err);
      return group;
    }
  }
}

export default StorageEnhancedVariants;
