import * as THREE from 'three';
import { ExtremeAINodePack } from './_ExtremeAINodePack.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { createCoreIdentityMaterial, createNodeHologramShell } from './CoreHologramShader.js';
import { createNodeNeonEdgeGlowShell } from './shaders/NeonEdgeGlowShader.js';
import { CanonicalGeometryFamilies } from './CanonicalGeometryFamilies_v1.js';
import { AnalyticsEnhancedVariants } from './Atoma_nodes/AnalyticsEnhancedVariants_Session81.js';
import { StorageEnhancedVariants } from './Atoma_nodes/StorageEnhancedVariants_Session81.js';
import { ProcessEnhancedVariants } from './Atoma_nodes/ProcessEnhancedVariants_Session81.js';
import { IntegrationEnhancedVariants } from './Atoma_nodes/IntegrationEnhancedVariants_Session110.js';
import { ControlEnhancedVariants } from './Atoma_nodes/ControlEnhancedVariants_Session83.js';
import { ControlSpineVariants } from './Atoma_nodes/ControlSpineVariants_Session100.js';
import { InputSensoryEnhanced } from './Atoma_nodes/InputSensoryEnhanced_Session111.js';
import { ControlNodeSpecialGovernors } from './Atoma_nodes/ControlNodeSpecialGoverners_Session114.js';
import { StorageNodesVisual } from './Atoma_nodes/StorageNodesVisual_Session116.js';
import { safeCreateEdgesGeometry } from './src/three/GeometryBoundsSafe.js';
import { NODE_VISUAL_REGISTRY, CATEGORY_POOLS } from './NodeVisualRegistry.js';

function validateMeshGeometry(mesh, label = 'unknown') {
  if (!mesh || !mesh.geometry || !mesh.geometry.attributes || !mesh.geometry.attributes.position) {
    throw new Error(`Invalid geometry: NaN detected (${label})`);
  }
  const arr = mesh.geometry.attributes.position.array;
  for (let i = 0; i < arr.length; i++) {
    if (!Number.isFinite(arr[i])) {
      throw new Error(`Invalid geometry: NaN detected (${label})`);
    }
  }
}

function isValidNodeObject(obj) {
  if (!obj) return false;

  if (obj.isMesh && obj.geometry) return true;

  if (obj.isGroup && obj.children?.length) {
    return obj.children.some(child => child.isMesh && child.geometry);
  }

  return false;
}


const FORBIDDEN_CANONICAL_GEOMETRIES = new Set([
  'SphereGeometry',
  'IcosahedronGeometry',
  'RingGeometry',
  'CircleGeometry',
  'TorusGeometry'
]);

// PRIME v2 shared caches (geometries/materials/positions)
const PRIME_V2_CACHE = {
  coreGeometry: null,
  edgesGeometry: null,
  seamGeometry: null,
  cageEdgesGeometry: null,
  dominantArcGeometry: null,
  counterArcGeometry: null,
  fragmentArcGeometry: null,
  vaneGeometry: null,
  braceGeometry: null,
  haloGeometry: null,
  latticeGeometry: null,
  latticePositions: null
};
const PRIME_V2_MATERIALS = new Map(); // keyed by color hex

// MYTHIC v2 caches
const MYTHIC_V2_CACHE = {
  coreGeometry: null,
  edgesGeometry: null,
  seamGeometry: null,
  ringGeometry: null,
  shardGeometry: null,
  haloGeometry: null,
  runeGeometry: null,
  crownPositions: null
};
const MYTHIC_V2_MATERIALS = new Map(); // keyed by color hex
const MYTHIC_FLOATING_RELIQUARY_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  slabGeometry: null,
  witnessGeometry: null,
  voidGeometry: null,
  majorArcGeometry: null,
  minorArcGeometry: null,
  runeGeometry: null,
  haloGeometry: null
};
const MYTHIC_FLOATING_RELIQUARY_MATERIALS = new Map(); // keyed by color hex
const MYTHIC_APOSTATE_MONOLITH_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  seamGeometry: null,
  idolGeometryA: null,
  idolEdgesGeometryA: null,
  idolGeometryB: null,
  idolEdgesGeometryB: null,
  ribGeometry: null,
  ribEdgesGeometry: null,
  shardGeometry: null,
  shardEdgesGeometry: null,
  glyphGeometry: null,
  dustGeometry: null
};
const MYTHIC_APOSTATE_MONOLITH_MATERIALS = new Map(); // keyed by color hex
const MYTHIC_ORACULAR_PRISM_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  fissureGeometry: null,
  cageGeometry: null,
  cageEdgesGeometry: null,
  planeGeometry: null,
  planeEdgesGeometry: null,
  facetGeometry: null,
  facetEdgesGeometry: null,
  railGeometry: null,
  railEdgesGeometry: null,
  runeGeometry: null,
  haloGeometry: null
};
const MYTHIC_ORACULAR_PRISM_MATERIALS = new Map(); // keyed by color hex
const MYTHIC_ABSENT_CORE_SANCTUM_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  voidGeometry: null,
  shardGeometry: null,
  shardEdgesGeometry: null,
  seedGeometry: null,
  terraceGeometry: null,
  terraceEdgesGeometry: null,
  braceGeometry: null,
  braceEdgesGeometry: null,
  dustGeometry: null,
  haloGeometry: null
};
const MYTHIC_ABSENT_CORE_SANCTUM_MATERIALS = new Map(); // keyed by color hex
const MYTHIC_COLLAPSED_CROWN_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  seamGeometry: null,
  seedGeometry: null,
  tineGeometry: null,
  tineEdgesGeometry: null,
  crescentGeometry: null,
  crescentEdgesGeometry: null,
  braceGeometry: null,
  braceEdgesGeometry: null,
  remnantGeometry: null,
  remnantEdgesGeometry: null,
  dustGeometry: null,
  haloGeometry: null
};
const MYTHIC_COLLAPSED_CROWN_MATERIALS = new Map(); // keyed by color hex
const MYTHIC_CATACLYSM_CAIRN_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  seamGeometry: null,
  keystoneGeometry: null,
  keystoneEdgesGeometry: null,
  majorShardGeometry: null,
  majorShardEdgesGeometry: null,
  witnessGeometry: null,
  witnessEdgesGeometry: null,
  bandGeometry: null,
  bandEdgesGeometry: null,
  dustGeometry: null,
  haloGeometry: null
};
const MYTHIC_CATACLYSM_CAIRN_MATERIALS = new Map(); // keyed by color hex

// ERROR v2 caches
const ERROR_V2_CACHE = {
  coreGeometry: null,
  edgesGeometry: null,
  ringGeometry: null,
  cageGeometry: null,
  cageEdgesGeometry: null,
  voidGeometry: null,
  haloGeometry: null
};
const ERROR_V2_MATERIALS = new Map(); // keyed by color hex

// STORAGE v2 caches
const STORAGE_V2_CACHE = {
  columnGeometry: null,
  ringGeometry: null,
  bandGeometry: null,
  sliceGeometry: null,
  haloGeometry: null,
  spineGeometry: null,
  timelineGeometry: null
};
const STORAGE_V2_MATERIALS = new Map(); // keyed by color hex
const STORAGE_CATHEDRAL_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  slabGeometry: null,
  buttressGeometry: null,
  buttressEdgesGeometry: null,
  seamGeometry: null,
  dustGeometry: null,
  timelineGeometry: null
};
const STORAGE_CATHEDRAL_MATERIALS = new Map(); // keyed by color hex

// INPUT v2 caches
const INPUT_V2_CACHE = {
  coreGeometry: null,
  edgesGeometry: null,
  arrowGeometry: null,
  ringGeometry: null,
  streamGeometry: null,
  haloGeometry: null,
  particlesGeometry: null,
  vectorGeometry: null
};
const INPUT_V2_MATERIALS = new Map(); // keyed by color hex
const INPUT_GATEWAY_RELIQUARY_CACHE = {
  apertureGeometry: null,
  apertureEdgesGeometry: null,
  lensGeometry: null,
  lensEdgesGeometry: null,
  seamGeometry: null,
  phaseGeometry: null,
  railGeometry: null,
  haloGeometry: null,
  particleGeometry: null
};
const INPUT_GATEWAY_RELIQUARY_MATERIALS = new Map(); // keyed by color hex
const INPUT_INCOMING_RELIQUARY_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  seedGeometry: null,
  seedEdgesGeometry: null,
  wingGeometry: null,
  wingEdgesGeometry: null,
  haloGeometry: null,
  haloRingGeometry: null,
  arcGeometry: null,
  particleGeometry: null,
  ribbonGeometry: null
};
const INPUT_INCOMING_RELIQUARY_MATERIALS = new Map(); // keyed by color hex

// Shared core material cache: key = `${category}|${colorHex.toString(16)}`
const CORE_MATERIAL_CACHE = new Map();
function getSharedCoreBasicMaterial(category = 'default', colorHex = 0xffffff, extraProps = {}) {
  const key = `${category}|${colorHex}`;
  if (CORE_MATERIAL_CACHE.has(key)) return CORE_MATERIAL_CACHE.get(key);
  const mat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: false,
    depthWrite: true,
    ...extraProps
  });
  mat.userData.sharedCore = true;
  CORE_MATERIAL_CACHE.set(key, mat);
  return mat;
}

let _sessionVariantEngine = null;
export function setSessionVariantEngine(engine) {
  _sessionVariantEngine = engine;
}

// Debug helper moved to SessionVariantEngine (none here)

// CONTROL v2 caches
const CONTROL_V2_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  ringGeometry: null,
  satGeometry: null,
  cageGeometry: null,
  cageEdgesGeometry: null,
  barrierGeometry: null,
  axisGeometry: null,
  matrixGeometry: null
};
const CONTROL_V2_MATERIALS = new Map(); // keyed by color hex

// CONTROL v2 legacy caches (Cybernetic Dominion Core)
// Live compatibility path, not dead code: keep the LEGACY name until all callers migrate.
const CONTROL_V2_LEGACY_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  ringGeometry: null,
  satGeometry: null,
  cageGeometry: null,
  cageEdgesGeometry: null,
  barrierGeometry: null,
  axisGeometry: null,
  matrixGeometry: null
};
const CONTROL_V2_LEGACY_MATERIALS = new Map(); // keyed by color hex
const CONTROL_EXTREME_608_CACHE = {
  coreGeometry: null,
  innerCubeGeometry: null,
  outerCubeGeometry: null,
  edgesInnerGeometry: null,
  edgesOuterGeometry: null,
  anchorGeometry: null,
  pulsePlaneGeometry: null,
  auraCubeGeometry: null,
  scanCubeGeometry: null
};
const CONTROL_EXTREME_608_MATERIALS = new Map(); // keyed by color hex

// ANALYTICS v2 caches
const ANALYTICS_V2_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  hexRingGeometry: null,
  planeGeometry: null,
  vectorGeometry: null,
  gridGeometry: null,
  diskGeometry: null,
  particlesGeometry: null
};
const ANALYTICS_V2_MATERIALS = new Map(); // keyed by color hex

// QUANTUM v2 caches
const QUANTUM_V2_CACHE = {
  baseGeometry: null,
  edgesGeometry: null,
  fragmentGeometry: null,
  planeGeometry: null,
  arcGeometry: null,
  dustGeometry: null,
  bridgeGeometry: null
};
const QUANTUM_V2_MATERIALS = new Map(); // keyed by color hex
const QUANTUM_LATTICE_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  voidSeedGeometry: null,
  voidSeedEdgesGeometry: null,
  ghostGeometry: null,
  ghostEdgesGeometry: null,
  bridgeGeometry: null,
  bridgeEdgesGeometry: null,
  nodeGeometry: null,
  nodeEdgesGeometry: null,
  shardGeometry: null,
  shardEdgesGeometry: null,
  planeGeometry: null,
  haloGeometry: null,
  dustGeometry: null
};
const QUANTUM_LATTICE_MATERIALS = new Map(); // keyed by color hex
const QUANTUM_PARADOX_LOTUS_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  innerStateGeometry: null,
  innerStateEdgesGeometry: null,
  seamGeometry: null,
  ghostGeometry: null,
  petalGeometry: null,
  petalEdgesGeometry: null,
  braceGeometry: null,
  planeGeometry: null,
  dustGeometry: null
};
const QUANTUM_PARADOX_LOTUS_MATERIALS = new Map(); // keyed by color hex
const QUANTUM_PROBABILITY_BLOOM_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  innerStateGeometry: null,
  innerStateEdgesGeometry: null,
  ghostGeometry: null,
  cageEdgesGeometry: null,
  sailGeometry: null,
  sailEdgesGeometry: null,
  dominantArcGeometry: null,
  counterArcGeometry: null,
  frameEdgesGeometry: null,
  shardGeometry: null,
  shardEdgesGeometry: null,
  haloGeometry: null,
  dustGeometry: null
};
const QUANTUM_PROBABILITY_BLOOM_MATERIALS = new Map(); // keyed by color hex
const SIGMA_V2_CACHE = {
  baseGeometry: null,
  edgesGeometry: null,
  ringGeometry: null
};
const SIGMA_V2_MATERIALS = new Map(); // keyed by color hex
const SIGMA_FRACTURE_CHOIR_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  seedGeometry: null,
  seamGeometry: null,
  echoGeometry: null,
  choirGeometry: null,
  choirEdgesGeometry: null,
  responseGeometry: null,
  responseEdgesGeometry: null,
  dominantArcGeometry: null,
  returnArcGeometry: null,
  fragmentArcGeometry: null,
  dustGeometry: null
};
const SIGMA_FRACTURE_CHOIR_MATERIALS = new Map(); // keyed by color hex
const SIGMA_RUPTURE_DIADEM_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  seedGeometry: null,
  seamGeometry: null,
  echoGeometry: null,
  arcGeometryA: null,
  arcGeometryB: null,
  arcGeometryC: null,
  shardGeometry: null,
  shardEdgesGeometry: null,
  dustGeometry: null,
  glowGeometry: null
};
const SIGMA_RUPTURE_DIADEM_MATERIALS = new Map(); // keyed by color hex
const SIGMA_RUPTURE_BLOOM_CROWN_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  seedGeometry: null,
  seamGeometry: null,
  echoGeometry: null,
  petalGeometry: null,
  petalEdgesGeometry: null,
  dominantArcGeometry: null,
  counterArcGeometry: null,
  fragmentArcGeometry: null,
  spikeGeometry: null,
  dustGeometry: null,
  glowGeometry: null
};
const SIGMA_RUPTURE_BLOOM_CROWN_MATERIALS = new Map(); // keyed by color hex

// EMOTIONAL v2 caches
const EMO_V2_CACHE = {
  coreGeometry: null,
  shellGeometry: null,
  edgesGeometry: null,
  tendrilGeometry: null,
  fragmentGeometry: null,
  particlesGeometry: null
};
const EMO_V2_MATERIALS = new Map(); // keyed by color hex
const EMO_NEURAL_LOBE_CACHE = {
  lobeGeometry: null,
  lobeEdgesGeometry: null,
  nucleusGeometry: null,
  seamGeometry: null,
  membraneGeometryA: null,
  membraneEdgesGeometryA: null,
  membraneGeometryB: null,
  membraneEdgesGeometryB: null,
  filamentGeometry: null,
  filamentLongGeometry: null,
  anchorGeometry: null,
  anchorEdgesGeometry: null,
  mistGeometry: null,
  acheGeometry: null
};
const EMO_NEURAL_LOBE_MATERIALS = new Map(); // keyed by color hex
const EMO_BLOOMING_GEM_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  nucleusGeometry: null,
  seamGeometry: null,
  cageGeometry: null,
  cageEdgesGeometry: null,
  petalGeometry: null,
  petalEdgesGeometry: null,
  ghostPetalGeometry: null,
  ghostPetalEdgesGeometry: null,
  pollenGeometry: null
};
const EMO_BLOOMING_GEM_MATERIALS = new Map(); // keyed by color hex
const EMO_TEAR_SHAPED_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  seedGeometry: null,
  seamGeometry: null,
  cageGeometry: null,
  cageEdgesGeometry: null,
  fanGeometry: null,
  fanEdgesGeometry: null,
  liftGeometry: null,
  liftEdgesGeometry: null,
  dustGeometry: null
};
const EMO_TEAR_SHAPED_MATERIALS = new Map(); // keyed by color hex
const EMO_FOLDED_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  seedGeometry: null,
  seamGeometry: null,
  cageGeometry: null,
  cageEdgesGeometry: null,
  shardGeometry: null,
  shardEdgesGeometry: null,
  ghostShardGeometry: null,
  ghostShardEdgesGeometry: null,
  railGeometry: null,
  railEdgesGeometry: null,
  dustGeometry: null
};
const EMO_FOLDED_MATERIALS = new Map(); // keyed by color hex
const EMO_HEART_CRYSTAL_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  seedGeometry: null,
  seamGeometry: null,
  cageGeometry: null,
  cageEdgesGeometry: null,
  shrineGeometryA: null,
  shrineEdgesGeometryA: null,
  shrineGeometryB: null,
  shrineEdgesGeometryB: null,
  witnessGeometry: null,
  witnessEdgesGeometry: null,
  arcGeometry: null,
  arcEdgesGeometry: null,
  dustGeometry: null
};
const EMO_HEART_CRYSTAL_MATERIALS = new Map(); // keyed by color hex
const EMO_SYMMETRIC_SEED_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  seedGeometry: null,
  seamGeometry: null,
  cageGeometry: null,
  cageEdgesGeometry: null,
  shellGeometryA: null,
  shellEdgesGeometryA: null,
  shellGeometryB: null,
  shellEdgesGeometryB: null,
  shellGeometryC: null,
  shellEdgesGeometryC: null,
  finGeometry: null,
  finEdgesGeometry: null,
  railGeometry: null,
  railEdgesGeometry: null,
  dustGeometry: null
};
const EMO_SYMMETRIC_SEED_MATERIALS = new Map(); // keyed by color hex

// Enforce opaque, front-facing core materials for core meshes
function enforceOpaqueCoreMaterial(mat) {
  return mat;
}

// PRIME v2 helpers (geometry/material caches + lattice points)
function _getPrimeV2Geometries() {
  if (!PRIME_V2_CACHE.coreGeometry) {
    const coreGeometry = new THREE.IcosahedronGeometry(0.58, 1);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const sovereignBias = Math.max(0, x) * 0.1 + Math.max(0, y) * 0.08 - Math.max(0, -x) * 0.05;
      const torsion = Math.sin((y * 4.6) + (z * 3.8)) * 0.018;
      corePos.setXYZ(
        i,
        x * (1.0 + sovereignBias * 0.34) + z * 0.04,
        y * (1.04 + Math.max(0, y) * 0.08) + torsion,
        z * (0.94 + Math.max(0, -x) * 0.08) - x * 0.05
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    PRIME_V2_CACHE.coreGeometry = coreGeometry;
    PRIME_V2_CACHE.edgesGeometry = safeCreateEdgesGeometry(coreGeometry, 16);

    const seamGeometry = new THREE.BoxGeometry(0.06, 0.72, 0.12, 1, 3, 1);
    const seamPos = seamGeometry.attributes.position;
    for (let i = 0; i < seamPos.count; i++) {
      const x = seamPos.getX(i);
      const y = seamPos.getY(i);
      const z = seamPos.getZ(i);
      const yNorm = (y + 0.36) / 0.72;
      const taper = 0.62 + (Math.abs(y) * 0.28);
      seamPos.setXYZ(
        i,
        x * taper + y * 0.08,
        y * 1.02,
        z * (0.62 + yNorm * 0.32) - x * 0.14
      );
    }
    seamPos.needsUpdate = true;
    seamGeometry.computeVertexNormals();
    seamGeometry.computeBoundingSphere();
    PRIME_V2_CACHE.seamGeometry = seamGeometry;

    const cageGeometry = coreGeometry.clone();
    cageGeometry.scale(1.12, 1.18, 1.08);
    cageGeometry.rotateY(0.32);
    cageGeometry.computeBoundingSphere();
    PRIME_V2_CACHE.cageEdgesGeometry = safeCreateEdgesGeometry(cageGeometry, 12);

    PRIME_V2_CACHE.dominantArcGeometry = new THREE.TorusGeometry(1.02, 0.055, 10, 64, Math.PI * 1.36);
    PRIME_V2_CACHE.counterArcGeometry = new THREE.TorusGeometry(0.84, 0.04, 10, 52, Math.PI * 1.02);
    PRIME_V2_CACHE.fragmentArcGeometry = new THREE.TorusGeometry(0.72, 0.032, 8, 36, Math.PI * 0.56);

    const vaneGeometry = new THREE.BoxGeometry(0.16, 0.82, 0.08, 1, 4, 1);
    const vanePos = vaneGeometry.attributes.position;
    for (let i = 0; i < vanePos.count; i++) {
      const x = vanePos.getX(i);
      const y = vanePos.getY(i);
      const z = vanePos.getZ(i);
      const yNorm = (y + 0.41) / 0.82;
      vanePos.setXYZ(
        i,
        x * (0.58 + yNorm * 1.16) + y * 0.04,
        y * 1.02,
        z * (0.56 + yNorm * 0.46) - x * 0.18
      );
    }
    vanePos.needsUpdate = true;
    vaneGeometry.translate(0, 0.12, 0);
    vaneGeometry.computeVertexNormals();
    vaneGeometry.computeBoundingSphere();
    PRIME_V2_CACHE.vaneGeometry = vaneGeometry;

    const braceGeometry = new THREE.CylinderGeometry(0.018, 0.046, 0.9, 5, 4, false);
    const bracePos = braceGeometry.attributes.position;
    for (let i = 0; i < bracePos.count; i++) {
      const x = bracePos.getX(i);
      const y = bracePos.getY(i);
      const z = bracePos.getZ(i);
      const yNorm = (y + 0.45) / 0.9;
      const bow = Math.sin(yNorm * Math.PI) * 0.09;
      bracePos.setXYZ(
        i,
        x * (0.68 + yNorm * 0.96) + bow,
        y * 1.02,
        z * (0.58 + yNorm * 0.3) - bow * 0.22
      );
    }
    bracePos.needsUpdate = true;
    braceGeometry.translate(0, 0.28, 0);
    braceGeometry.computeVertexNormals();
    braceGeometry.computeBoundingSphere();
    PRIME_V2_CACHE.braceGeometry = braceGeometry;

    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
      0.94, 0.52, -0.12,
      0.66, -0.36, 0.48,
      -0.72, 0.4, 0.18,
      -0.28, -0.54, -0.66,
      0.22, 0.86, 0.34,
      -0.86, -0.08, 0.06,
      0.14, -0.18, -0.92
    ], 3));
    haloGeometry.computeBoundingSphere();
    PRIME_V2_CACHE.haloGeometry = haloGeometry;

    const pinHeight = 0.28;
    const pinGeom = new THREE.CylinderGeometry(0.012, 0.048, pinHeight, 5, 1, false);
    pinGeom.translate(0, pinHeight * 0.5, 0);
    pinGeom.computeVertexNormals();
    pinGeom.computeBoundingSphere();
    PRIME_V2_CACHE.latticeGeometry = pinGeom;
  }
  return PRIME_V2_CACHE;
}

function _getPrimeV2Materials(color) {
  const colorHex = typeof color === 'number' ? color : 0xffffff;
  if (PRIME_V2_MATERIALS.has(colorHex)) return PRIME_V2_MATERIALS.get(colorHex);

  const coreMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xe4edf5),
    emissive: new THREE.Color(0x1b2f43),
    emissiveIntensity: 0.42,
    metalness: 0.96,
    roughness: 0.16,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const edgesMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xe9fbff),
    transparent: true,
    opacity: 0.34,
    depthWrite: false
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x8ea7c0),
    emissive: new THREE.Color(0x4cb7ff),
    emissiveIntensity: 0.34,
    metalness: 0.74,
    roughness: 0.22,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true,
    blending: THREE.NormalBlending
  });

  const cageMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xbcecff),
    transparent: true,
    opacity: 0.26,
    depthWrite: false
  });

  const arcMatA = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xdbe9f5),
    emissive: new THREE.Color(0x4bc7ff),
    emissiveIntensity: 0.18,
    metalness: 1.0,
    roughness: 0.2,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true,
    blending: THREE.NormalBlending
  });

  const arcMatB = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xc7d7e7),
    emissive: new THREE.Color(0x2a6f98),
    emissiveIntensity: 0.22,
    metalness: 0.96,
    roughness: 0.24,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true,
    blending: THREE.NormalBlending
  });

  const latticeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xc5d7e7),
    emissive: new THREE.Color(0x29465a),
    emissiveIntensity: 0.24,
    metalness: 0.92,
    roughness: 0.18,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true,
    blending: THREE.NormalBlending
  });

  const vaneMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xd6e5f1),
    emissive: new THREE.Color(0x25485e),
    emissiveIntensity: 0.22,
    metalness: 0.9,
    roughness: 0.22,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true,
    blending: THREE.NormalBlending
  });

  const braceMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xa8bfd3),
    emissive: new THREE.Color(0x163349),
    emissiveIntensity: 0.28,
    metalness: 0.88,
    roughness: 0.24,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true,
    blending: THREE.NormalBlending
  });

  const haloPointMat = new THREE.PointsMaterial({
    color: new THREE.Color(0xd2fbff),
    size: 0.048,
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = {
    coreMat,
    edgesMat,
    seamMat,
    cageMat,
    arcMatA,
    arcMatB,
    latticeMat,
    vaneMat,
    braceMat,
    haloPointMat
  };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }
  PRIME_V2_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getPrimeV2LatticePositions(coreGeometry) {
  if (PRIME_V2_CACHE.latticePositions) return PRIME_V2_CACHE.latticePositions;

  const positions = [];
  const attr = coreGeometry?.attributes?.position;
  if (!attr) {
    PRIME_V2_CACHE.latticePositions = positions;
    return positions;
  }

  const seen = new Set();
  const temp = new THREE.Vector3();
  const radius = coreGeometry.boundingSphere?.radius ?? 1.0;

  for (let i = 0; i < attr.count; i += 2) { // sample every 2nd vertex to keep count low
    temp.fromBufferAttribute(attr, i);
    const key = `${temp.x.toFixed(3)}|${temp.y.toFixed(3)}|${temp.z.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    temp.normalize().multiplyScalar(radius * 1.05);
    positions.push(temp.clone());
  }

  PRIME_V2_CACHE.latticePositions = positions;
  return positions;
}

// PRIME Stella Octangula caches
const PRIME_STELLA_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  tetraGeometry: null,
  tetraEdgesGeometry: null,
  spineGeometry: null,
  bandGeometry: null,
  haloGeometry: null
};
const PRIME_STELLA_MATERIALS = new Map(); // keyed by color hex
const PRIME_IMMACULATE_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  seamGeometry: null,
  chamberGeometry: null,
  chamberEdgesGeometry: null,
  meridianGeometry: null,
  railGeometry: null,
  keystoneGeometry: null,
  haloGeometry: null
};
const PRIME_IMMACULATE_MATERIALS = new Map(); // keyed by color hex
const PRIME_HARMONIC_LATTICE_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  seedGeometry: null,
  seamGeometry: null,
  towerGeometry: null,
  towerEdgesGeometry: null,
  strutGeometry: null,
  strutEdgesGeometry: null,
  panelGeometry: null,
  railGeometry: null,
  finGeometry: null,
  finEdgesGeometry: null,
  meridianGeometry: null,
  haloGeometry: null
};
const PRIME_HARMONIC_LATTICE_MATERIALS = new Map(); // keyed by color hex
const PRIME_FORBIDDEN_PROJECTION_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  seedGeometry: null,
  seamGeometry: null,
  chamberGeometry: null,
  chamberEdgesGeometry: null,
  ghostFrameGeometry: null,
  slabGeometry: null,
  slabEdgesGeometry: null,
  braceGeometry: null,
  braceEdgesGeometry: null,
  meridianGeometry: null,
  haloGeometry: null
};
const PRIME_FORBIDDEN_PROJECTION_MATERIALS = new Map(); // keyed by color hex
const PRIME_INVERTED_BLOOM_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  seedGeometry: null,
  seamGeometry: null,
  petalGeometry: null,
  petalEdgesGeometry: null,
  shellGeometry: null,
  shellEdgesGeometry: null,
  slabGeometry: null,
  slabEdgesGeometry: null,
  haloGeometry: null
};
const PRIME_INVERTED_BLOOM_MATERIALS = new Map(); // keyed by color hex
const PRIME_GENESIS_CHRYSALIS_CACHE = {
  coreGeometry: null,
  coreEdgesGeometry: null,
  seedGeometry: null,
  seamGeometry: null,
  huskGeometry: null,
  huskEdgesGeometry: null,
  ribGeometry: null,
  ribEdgesGeometry: null,
  meridianGeometry: null,
  haloGeometry: null
};
const PRIME_GENESIS_CHRYSALIS_MATERIALS = new Map(); // keyed by color hex

function _getPrimeStellaGeometries() {
  if (!PRIME_STELLA_CACHE.coreGeometry) {
    const coreGeometry = new THREE.OctahedronGeometry(0.38, 0);
    coreGeometry.computeBoundingSphere();
    PRIME_STELLA_CACHE.coreGeometry = coreGeometry;
    PRIME_STELLA_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 14);

    const tetraGeometry = new THREE.TetrahedronGeometry(0.54, 0);
    tetraGeometry.computeBoundingSphere();
    PRIME_STELLA_CACHE.tetraGeometry = tetraGeometry;
    PRIME_STELLA_CACHE.tetraEdgesGeometry = safeCreateEdgesGeometry(tetraGeometry, 12);

    const spineGeometry = new THREE.CylinderGeometry(0.045, 0.055, 1.08, 6, 1, false);
    spineGeometry.translate(0, 0.06, 0);
    spineGeometry.computeBoundingSphere();
    PRIME_STELLA_CACHE.spineGeometry = spineGeometry;

    PRIME_STELLA_CACHE.bandGeometry = new THREE.TorusGeometry(0.74, 0.024, 10, 96);

    const haloPositions = [];
    const haloCount = 64;
    for (let i = 0; i < haloCount; i++) {
      const angle = (i / haloCount) * Math.PI * 2;
      haloPositions.push(
        Math.cos(angle) * 0.92,
        Math.sin(i * 1.4) * 0.06 + 0.08,
        Math.sin(angle) * 0.62
      );
    }
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute(haloPositions, 3));
    haloGeometry.computeBoundingSphere();
    PRIME_STELLA_CACHE.haloGeometry = haloGeometry;
  }

  return PRIME_STELLA_CACHE;
}

function _getPrimeStellaMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0xc0c0c0;
  if (PRIME_STELLA_MATERIALS.has(colorHex)) return PRIME_STELLA_MATERIALS.get(colorHex);

  const primeColor = new THREE.Color(colorHex);
  const silverColor = primeColor.clone().lerp(new THREE.Color(0xffffff), 0.22);
  const coldColor = new THREE.Color(0xd9f4ff);
  const coreColor = silverColor.clone().lerp(coldColor, 0.12);

  const coreMat = new THREE.MeshStandardMaterial({
    color: coreColor,
    emissive: new THREE.Color(0xa4cffc),
    emissiveIntensity: 0.28,
    metalness: 0.9,
    roughness: 0.12,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const crownMat = new THREE.MeshStandardMaterial({
    color: silverColor,
    emissive: new THREE.Color(0x7da5d8),
    emissiveIntensity: 0.18,
    metalness: 0.82,
    roughness: 0.16,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const spineMat = new THREE.MeshStandardMaterial({
    color: silverColor.clone().lerp(coldColor, 0.08),
    emissive: new THREE.Color(0x8dd7ff),
    emissiveIntensity: 0.16,
    metalness: 0.72,
    roughness: 0.22,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const bandMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xebfbff),
    transparent: true,
    opacity: 0.34,
    depthWrite: false
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xf6fbff),
    transparent: true,
    opacity: 0.82,
    depthWrite: true
  });

  const haloMat = new THREE.PointsMaterial({
    color: new THREE.Color(0xb8ecff),
    size: 0.046,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    sizeAttenuation: true
  });

  for (const mat of [coreMat, crownMat, spineMat, bandMat, edgeMat, haloMat]) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  const mats = { coreMat, crownMat, spineMat, bandMat, edgeMat, haloMat };
  PRIME_STELLA_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getPrimeImmaculateGeometries() {
  if (!PRIME_IMMACULATE_CACHE.coreGeometry) {
    const coreGeometry = new THREE.DodecahedronGeometry(0.42, 0);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const yWeight = Math.min(1.0, Math.abs(y) / 0.42);
      const xWeight = Math.min(1.0, Math.abs(x) / 0.42);
      corePos.setXYZ(
        i,
        x * (0.9 + yWeight * 0.12),
        y * 1.16 + Math.sign(y || 1) * 0.02 * xWeight,
        z * (0.84 + xWeight * 0.08)
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    PRIME_IMMACULATE_CACHE.coreGeometry = coreGeometry;
    PRIME_IMMACULATE_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 14);

    const seamGeometry = new THREE.IcosahedronGeometry(0.16, 0);
    seamGeometry.scale(0.46, 1.22, 0.46);
    seamGeometry.computeBoundingSphere();
    PRIME_IMMACULATE_CACHE.seamGeometry = seamGeometry;

    const chamberGeometry = new THREE.BoxGeometry(0.8, 1.1, 0.8, 1, 1, 1);
    const chamberPos = chamberGeometry.attributes.position;
    for (let i = 0; i < chamberPos.count; i++) {
      const x = chamberPos.getX(i);
      const y = chamberPos.getY(i);
      const z = chamberPos.getZ(i);
      const taper = 1.0 - (Math.abs(y) / 0.55) * 0.28;
      chamberPos.setXYZ(
        i,
        x * taper + z * 0.07 * Math.sign(y || 1),
        y * 1.04,
        z * (0.88 + Math.abs(y) * 0.16) - x * 0.04
      );
    }
    chamberPos.needsUpdate = true;
    chamberGeometry.computeVertexNormals();
    chamberGeometry.computeBoundingSphere();
    PRIME_IMMACULATE_CACHE.chamberGeometry = chamberGeometry;
    PRIME_IMMACULATE_CACHE.chamberEdgesGeometry = safeCreateEdgesGeometry(chamberGeometry, 18);

    PRIME_IMMACULATE_CACHE.meridianGeometry = new THREE.TorusGeometry(0.82, 0.018, 8, 112);

    const railSegments = [];
    const addRail = (a, b) => {
      railSegments.push(...a, ...b);
    };
    addRail([0, -0.92, 0], [0, 0.92, 0]);
    addRail([-0.44, -0.52, 0], [0.44, 0.52, 0]);
    addRail([0, -0.48, 0.42], [0, 0.48, -0.42]);
    addRail([-0.2, 0, -0.6], [0.2, 0, 0.6]);
    const railGeometry = new THREE.BufferGeometry();
    railGeometry.setAttribute('position', new THREE.Float32BufferAttribute(railSegments, 3));
    railGeometry.computeBoundingSphere();
    PRIME_IMMACULATE_CACHE.railGeometry = railGeometry;

    const keystoneGeometry = new THREE.OctahedronGeometry(0.08, 0);
    keystoneGeometry.scale(0.52, 1.18, 0.52);
    keystoneGeometry.computeBoundingSphere();
    PRIME_IMMACULATE_CACHE.keystoneGeometry = keystoneGeometry;

    const haloPositions = [];
    const haloCount = 36;
    for (let i = 0; i < haloCount; i++) {
      const angle = (i / haloCount) * Math.PI * 2;
      const radial = 0.94 + Math.sin(i * 1.17) * 0.04;
      haloPositions.push(
        Math.cos(angle) * radial,
        Math.sin(i * 1.43) * 0.08,
        Math.sin(angle) * (0.66 + Math.cos(i * 0.87) * 0.06)
      );
    }
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute(haloPositions, 3));
    haloGeometry.computeBoundingSphere();
    PRIME_IMMACULATE_CACHE.haloGeometry = haloGeometry;
  }

  return PRIME_IMMACULATE_CACHE;
}

function _getPrimeImmaculateMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0xc8d6df;
  if (PRIME_IMMACULATE_MATERIALS.has(colorHex)) return PRIME_IMMACULATE_MATERIALS.get(colorHex);

  const primeColor = new THREE.Color(colorHex);
  const silverColor = new THREE.Color(0xf3f7fb).lerp(primeColor, 0.16);
  const coldColor = new THREE.Color(0xd3f4ff);
  const depthColor = new THREE.Color(0x1b2128).lerp(primeColor, 0.18);

  const coreMat = new THREE.MeshStandardMaterial({
    color: silverColor.clone().lerp(coldColor, 0.08),
    emissive: new THREE.Color(0x9ccff2),
    emissiveIntensity: 0.24,
    metalness: 0.92,
    roughness: 0.12,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const chamberMat = new THREE.MeshBasicMaterial({
    color: silverColor.clone().lerp(coldColor, 0.24),
    transparent: true,
    opacity: 0.16,
    depthWrite: false
  });

  const meridianMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xeefcff),
    transparent: true,
    opacity: 0.28,
    depthWrite: false
  });

  const railMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xf4fcff),
    transparent: true,
    opacity: 0.74,
    depthWrite: false
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xfbfdff),
    transparent: true,
    opacity: 0.82,
    depthWrite: false
  });

  const keystoneMat = new THREE.MeshStandardMaterial({
    color: silverColor.clone().lerp(coldColor, 0.18),
    emissive: new THREE.Color(0x9ee7ff),
    emissiveIntensity: 0.16,
    metalness: 0.84,
    roughness: 0.14,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: depthColor,
    transparent: true,
    opacity: 0.94,
    depthWrite: false
  });

  const haloMat = new THREE.PointsMaterial({
    color: new THREE.Color(0xcaf2ff),
    size: 0.042,
    transparent: true,
    opacity: 0.66,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = { coreMat, chamberMat, meridianMat, railMat, edgeMat, keystoneMat, seamMat, haloMat };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  PRIME_IMMACULATE_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getPrimeHarmonicLatticeGeometries() {
  if (!PRIME_HARMONIC_LATTICE_CACHE.coreGeometry) {
    const coreGeometry = new THREE.BoxGeometry(0.52, 0.5, 0.48, 2, 2, 2);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const yNorm = y / 0.25;
      const xWeight = Math.min(1.0, Math.abs(x) / 0.26);
      corePos.setXYZ(
        i,
        x * (0.88 + Math.max(0, yNorm) * 0.16) + z * 0.08,
        y * (1.0 + xWeight * 0.14) + x * 0.04,
        z * (0.8 + xWeight * 0.24) - y * 0.06
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    PRIME_HARMONIC_LATTICE_CACHE.coreGeometry = coreGeometry;
    PRIME_HARMONIC_LATTICE_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 16);

    const seedGeometry = new THREE.OctahedronGeometry(0.1, 0);
    seedGeometry.scale(0.56, 1.34, 0.4);
    seedGeometry.computeBoundingSphere();
    PRIME_HARMONIC_LATTICE_CACHE.seedGeometry = seedGeometry;

    const seamGeometry = new THREE.OctahedronGeometry(0.16, 0);
    seamGeometry.scale(0.34, 1.22, 0.24);
    seamGeometry.computeBoundingSphere();
    PRIME_HARMONIC_LATTICE_CACHE.seamGeometry = seamGeometry;

    const towerGeometry = new THREE.BoxGeometry(0.24, 1.04, 0.22, 1, 3, 1);
    const towerPos = towerGeometry.attributes.position;
    for (let i = 0; i < towerPos.count; i++) {
      const x = towerPos.getX(i);
      const y = towerPos.getY(i);
      const z = towerPos.getZ(i);
      const yNorm = (y + 0.52) / 1.04;
      const taper = 0.78 + yNorm * 0.34;
      towerPos.setXYZ(
        i,
        x * taper + z * 0.11 + yNorm * 0.06,
        y * (0.96 + Math.abs(x) * 0.2),
        z * (0.7 + yNorm * 0.38) - x * 0.08
      );
    }
    towerPos.needsUpdate = true;
    towerGeometry.computeVertexNormals();
    towerGeometry.computeBoundingSphere();
    PRIME_HARMONIC_LATTICE_CACHE.towerGeometry = towerGeometry;
    PRIME_HARMONIC_LATTICE_CACHE.towerEdgesGeometry = safeCreateEdgesGeometry(towerGeometry, 16);

    const strutGeometry = new THREE.BoxGeometry(0.18, 0.92, 0.14, 1, 2, 1);
    const strutPos = strutGeometry.attributes.position;
    for (let i = 0; i < strutPos.count; i++) {
      const x = strutPos.getX(i);
      const y = strutPos.getY(i);
      const z = strutPos.getZ(i);
      const bias = Math.sign(y || 1);
      strutPos.setXYZ(
        i,
        x * 0.74 + y * 0.18 + z * 0.1,
        y * 1.06,
        z * 1.08 - x * 0.22 + bias * 0.02
      );
    }
    strutPos.needsUpdate = true;
    strutGeometry.computeVertexNormals();
    strutGeometry.computeBoundingSphere();
    PRIME_HARMONIC_LATTICE_CACHE.strutGeometry = strutGeometry;
    PRIME_HARMONIC_LATTICE_CACHE.strutEdgesGeometry = safeCreateEdgesGeometry(strutGeometry, 14);

    const panelSegments = [];
    const addPanelSegment = (a, b) => panelSegments.push(...a, ...b);
    const a = [-0.42, -0.6, 0.06];
    const b = [0.34, -0.54, -0.04];
    const c = [0.48, 0.62, 0.08];
    const d = [-0.3, 0.56, -0.06];
    addPanelSegment(a, b);
    addPanelSegment(b, c);
    addPanelSegment(c, d);
    addPanelSegment(d, a);
    addPanelSegment(a, c);
    addPanelSegment(b, d);
    addPanelSegment([-0.22, -0.08, 0.05], [0.22, -0.02, -0.03]);
    addPanelSegment([-0.1, -0.34, 0.02], [0.08, 0.32, -0.01]);
    addPanelSegment([-0.3, 0.18, 0.04], [0.34, 0.12, 0.02]);
    addPanelSegment([-0.16, -0.42, -0.01], [-0.24, 0.38, 0.03]);
    const panelGeometry = new THREE.BufferGeometry();
    panelGeometry.setAttribute('position', new THREE.Float32BufferAttribute(panelSegments, 3));
    panelGeometry.computeBoundingSphere();
    PRIME_HARMONIC_LATTICE_CACHE.panelGeometry = panelGeometry;

    const railSegments = [];
    const addRail = (aPoint, bPoint) => railSegments.push(...aPoint, ...bPoint);
    addRail([-0.84, 0.24, 0.18], [0.12, 0.08, 0.02]);
    addRail([-0.68, 0.72, -0.12], [0.08, 0.12, -0.02]);
    addRail([0.74, -0.14, -0.26], [0.02, 0.1, 0.0]);
    addRail([0.54, 0.58, 0.36], [-0.04, 0.18, 0.04]);
    addRail([-0.18, -0.42, -0.62], [0.02, 0.08, -0.02]);
    addRail([0.22, 0.42, -0.54], [0.0, 0.12, 0.0]);
    const railGeometry = new THREE.BufferGeometry();
    railGeometry.setAttribute('position', new THREE.Float32BufferAttribute(railSegments, 3));
    railGeometry.computeBoundingSphere();
    PRIME_HARMONIC_LATTICE_CACHE.railGeometry = railGeometry;

    const finGeometry = new THREE.OctahedronGeometry(0.12, 0);
    finGeometry.scale(0.22, 0.86, 0.08);
    finGeometry.computeBoundingSphere();
    PRIME_HARMONIC_LATTICE_CACHE.finGeometry = finGeometry;
    PRIME_HARMONIC_LATTICE_CACHE.finEdgesGeometry = safeCreateEdgesGeometry(finGeometry, 12);

    PRIME_HARMONIC_LATTICE_CACHE.meridianGeometry = new THREE.TorusGeometry(0.74, 0.016, 8, 96, Math.PI * 1.3);

    const haloPositions = [];
    const haloCount = 44;
    for (let i = 0; i < haloCount; i++) {
      const t = (i / haloCount) * Math.PI * 2;
      const radial = 0.82 + Math.sin(i * 1.31) * 0.1;
      haloPositions.push(
        Math.cos(t) * radial + Math.sin(i * 0.57) * 0.08,
        Math.sin(i * 1.77) * 0.14 + 0.1,
        Math.sin(t) * (0.56 + Math.cos(i * 1.11) * 0.08)
      );
    }
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute(haloPositions, 3));
    haloGeometry.computeBoundingSphere();
    PRIME_HARMONIC_LATTICE_CACHE.haloGeometry = haloGeometry;
  }

  return PRIME_HARMONIC_LATTICE_CACHE;
}

function _getPrimeHarmonicLatticeMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0xc7d6e2;
  if (PRIME_HARMONIC_LATTICE_MATERIALS.has(colorHex)) return PRIME_HARMONIC_LATTICE_MATERIALS.get(colorHex);

  const primeColor = new THREE.Color(colorHex);
  const silverColor = new THREE.Color(0xf5f9fd).lerp(primeColor, 0.18);
  const coldColor = new THREE.Color(0xd3f5ff);
  const depthColor = new THREE.Color(0x1a2027).lerp(primeColor, 0.14);

  const coreMat = new THREE.MeshStandardMaterial({
    color: silverColor.clone().lerp(coldColor, 0.12),
    emissive: new THREE.Color(0xa6d7f8),
    emissiveIntensity: 0.26,
    metalness: 0.92,
    roughness: 0.12,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seedMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xf6fdff),
    emissive: new THREE.Color(0xc6f6ff),
    emissiveIntensity: 0.34,
    metalness: 0.82,
    roughness: 0.1,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const structureMat = new THREE.MeshStandardMaterial({
    color: silverColor.clone().lerp(coldColor, 0.06),
    emissive: new THREE.Color(0x82afd8),
    emissiveIntensity: 0.16,
    metalness: 0.84,
    roughness: 0.18,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const finMat = new THREE.MeshStandardMaterial({
    color: silverColor.clone().lerp(coldColor, 0.16),
    emissive: new THREE.Color(0x9fe8ff),
    emissiveIntensity: 0.14,
    metalness: 0.78,
    roughness: 0.16,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: depthColor,
    transparent: true,
    opacity: 0.94,
    depthWrite: false
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xf7fdff),
    transparent: true,
    opacity: 0.78,
    depthWrite: false
  });

  const panelMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xe8fbff),
    transparent: true,
    opacity: 0.48,
    depthWrite: false
  });

  const railMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xddf7ff),
    transparent: true,
    opacity: 0.66,
    depthWrite: false
  });

  const meridianMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xf1fcff),
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  });

  const haloMat = new THREE.PointsMaterial({
    color: new THREE.Color(0xc8f3ff),
    size: 0.042,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = {
    coreMat,
    seedMat,
    structureMat,
    finMat,
    seamMat,
    edgeMat,
    panelMat,
    railMat,
    meridianMat,
    haloMat
  };

  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  PRIME_HARMONIC_LATTICE_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getPrimeForbiddenProjectionGeometries() {
  if (!PRIME_FORBIDDEN_PROJECTION_CACHE.coreGeometry) {
    const coreGeometry = new THREE.BoxGeometry(0.5, 0.58, 0.48, 2, 2, 2);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const yNorm = y / 0.29;
      const xWeight = Math.min(1.0, Math.abs(x) / 0.25);
      const zWeight = Math.min(1.0, Math.abs(z) / 0.24);
      corePos.setXYZ(
        i,
        x * (0.86 + Math.max(0, yNorm) * 0.18) + z * 0.1,
        y * (1.04 + xWeight * 0.12) + x * 0.05 - z * 0.03,
        z * (0.82 + xWeight * 0.22) - y * 0.08 + x * 0.04 * Math.sign(y || 1)
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    PRIME_FORBIDDEN_PROJECTION_CACHE.coreGeometry = coreGeometry;
    PRIME_FORBIDDEN_PROJECTION_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 16);

    const seedGeometry = new THREE.OctahedronGeometry(0.11, 0);
    seedGeometry.scale(0.48, 1.48, 0.42);
    seedGeometry.computeBoundingSphere();
    PRIME_FORBIDDEN_PROJECTION_CACHE.seedGeometry = seedGeometry;

    const seamGeometry = new THREE.OctahedronGeometry(0.16, 0);
    seamGeometry.scale(0.26, 1.32, 0.22);
    seamGeometry.computeBoundingSphere();
    PRIME_FORBIDDEN_PROJECTION_CACHE.seamGeometry = seamGeometry;

    const chamberGeometry = new THREE.BoxGeometry(0.92, 1.04, 0.88, 1, 2, 1);
    const chamberPos = chamberGeometry.attributes.position;
    for (let i = 0; i < chamberPos.count; i++) {
      const x = chamberPos.getX(i);
      const y = chamberPos.getY(i);
      const z = chamberPos.getZ(i);
      const yNorm = y / 0.52;
      const taper = 0.82 + Math.max(0, yNorm) * 0.2 + Math.abs(z) * 0.06;
      chamberPos.setXYZ(
        i,
        x * taper + z * 0.12 + y * 0.04,
        y * (0.98 + Math.abs(x) * 0.14) + z * 0.04,
        z * (0.74 + Math.abs(x) * 0.24) - x * 0.08 + y * 0.06
      );
    }
    chamberPos.needsUpdate = true;
    chamberGeometry.computeVertexNormals();
    chamberGeometry.computeBoundingSphere();
    PRIME_FORBIDDEN_PROJECTION_CACHE.chamberGeometry = chamberGeometry;
    PRIME_FORBIDDEN_PROJECTION_CACHE.chamberEdgesGeometry = safeCreateEdgesGeometry(chamberGeometry, 18);

    const ghostSegments = [];
    const addGhost = (a, b) => ghostSegments.push(...a, ...b);
    const outerA = [-0.38, -0.42, -0.28];
    const outerB = [0.28, -0.36, -0.16];
    const outerC = [0.36, 0.42, -0.02];
    const outerD = [-0.3, 0.36, -0.18];
    const innerA = [-0.12, -0.16, 0.14];
    const innerB = [0.22, -0.12, 0.1];
    const innerC = [0.26, 0.22, 0.2];
    const innerD = [-0.08, 0.18, 0.24];
    addGhost(outerA, outerB);
    addGhost(outerB, outerC);
    addGhost(outerC, outerD);
    addGhost(outerD, outerA);
    addGhost(innerA, innerB);
    addGhost(innerB, innerC);
    addGhost(innerC, innerD);
    addGhost(innerD, innerA);
    addGhost(outerA, innerA);
    addGhost(outerB, innerB);
    addGhost(outerC, innerC);
    addGhost(outerD, innerD);
    addGhost([-0.02, -0.08, -0.06], [0.1, 0.12, 0.18]);
    addGhost([-0.18, 0.08, 0.04], [0.22, 0.02, 0.08]);
    const ghostFrameGeometry = new THREE.BufferGeometry();
    ghostFrameGeometry.setAttribute('position', new THREE.Float32BufferAttribute(ghostSegments, 3));
    ghostFrameGeometry.computeBoundingSphere();
    PRIME_FORBIDDEN_PROJECTION_CACHE.ghostFrameGeometry = ghostFrameGeometry;

    const slabGeometry = new THREE.BoxGeometry(1.18, 0.84, 0.04, 1, 1, 1);
    const slabPos = slabGeometry.attributes.position;
    for (let i = 0; i < slabPos.count; i++) {
      const x = slabPos.getX(i);
      const y = slabPos.getY(i);
      const z = slabPos.getZ(i);
      const fracture = Math.sign(x || 1) * 0.08 + y * 0.14;
      slabPos.setXYZ(
        i,
        x * 0.92 + y * 0.16,
        y * (0.86 + Math.abs(x) * 0.18) + Math.sign(y || 1) * 0.02,
        z + fracture + x * 0.04
      );
    }
    slabPos.needsUpdate = true;
    slabGeometry.computeVertexNormals();
    slabGeometry.computeBoundingSphere();
    PRIME_FORBIDDEN_PROJECTION_CACHE.slabGeometry = slabGeometry;
    PRIME_FORBIDDEN_PROJECTION_CACHE.slabEdgesGeometry = safeCreateEdgesGeometry(slabGeometry, 16);

    const braceGeometry = new THREE.BoxGeometry(0.14, 0.86, 0.12, 1, 2, 1);
    const bracePos = braceGeometry.attributes.position;
    for (let i = 0; i < bracePos.count; i++) {
      const x = bracePos.getX(i);
      const y = bracePos.getY(i);
      const z = bracePos.getZ(i);
      bracePos.setXYZ(
        i,
        x * 0.72 + y * 0.18 + z * 0.06,
        y * 1.04,
        z * 1.12 - x * 0.2 + Math.sign(y || 1) * 0.03
      );
    }
    bracePos.needsUpdate = true;
    braceGeometry.computeVertexNormals();
    braceGeometry.computeBoundingSphere();
    PRIME_FORBIDDEN_PROJECTION_CACHE.braceGeometry = braceGeometry;
    PRIME_FORBIDDEN_PROJECTION_CACHE.braceEdgesGeometry = safeCreateEdgesGeometry(braceGeometry, 14);

    PRIME_FORBIDDEN_PROJECTION_CACHE.meridianGeometry = new THREE.TorusGeometry(0.78, 0.016, 8, 112, Math.PI * 1.24);

    const haloPositions = [];
    const haloCount = 40;
    for (let i = 0; i < haloCount; i++) {
      const angle = (i / haloCount) * Math.PI * 2;
      const radial = 0.88 + Math.sin(i * 1.18) * 0.06;
      haloPositions.push(
        Math.cos(angle) * radial + Math.sin(i * 0.63) * 0.06,
        Math.sin(i * 1.64) * 0.12 + 0.12,
        Math.sin(angle) * (0.62 + Math.cos(i * 1.09) * 0.08)
      );
    }
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute(haloPositions, 3));
    haloGeometry.computeBoundingSphere();
    PRIME_FORBIDDEN_PROJECTION_CACHE.haloGeometry = haloGeometry;
  }

  return PRIME_FORBIDDEN_PROJECTION_CACHE;
}

function _getPrimeForbiddenProjectionMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0xc9d9e5;
  if (PRIME_FORBIDDEN_PROJECTION_MATERIALS.has(colorHex)) return PRIME_FORBIDDEN_PROJECTION_MATERIALS.get(colorHex);

  const primeColor = new THREE.Color(colorHex);
  const silverColor = new THREE.Color(0xf6fafd).lerp(primeColor, 0.18);
  const coldColor = new THREE.Color(0xd7f6ff);
  const depthColor = new THREE.Color(0x151b22).lerp(primeColor, 0.12);

  const coreMat = new THREE.MeshStandardMaterial({
    color: silverColor.clone().lerp(coldColor, 0.12),
    emissive: new THREE.Color(0xaadbf8),
    emissiveIntensity: 0.28,
    metalness: 0.92,
    roughness: 0.12,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seedMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xf8fdff),
    emissive: new THREE.Color(0xcff7ff),
    emissiveIntensity: 0.36,
    metalness: 0.84,
    roughness: 0.1,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const chamberMat = new THREE.MeshBasicMaterial({
    color: silverColor.clone().lerp(coldColor, 0.18),
    transparent: true,
    opacity: 0.12,
    depthWrite: false
  });

  const braceMat = new THREE.MeshStandardMaterial({
    color: silverColor.clone().lerp(coldColor, 0.08),
    emissive: new THREE.Color(0x97daf7),
    emissiveIntensity: 0.12,
    metalness: 0.8,
    roughness: 0.18,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const slabMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xe7fbff),
    transparent: true,
    opacity: 0.16,
    depthWrite: false
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: depthColor,
    transparent: true,
    opacity: 0.94,
    depthWrite: false
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xf9fdff),
    transparent: true,
    opacity: 0.8,
    depthWrite: false
  });

  const ghostFrameMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xe8fbff),
    transparent: true,
    opacity: 0.36,
    depthWrite: false
  });

  const meridianMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xf1fcff),
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  });

  const haloMat = new THREE.PointsMaterial({
    color: new THREE.Color(0xcff3ff),
    size: 0.042,
    transparent: true,
    opacity: 0.66,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = {
    coreMat,
    seedMat,
    chamberMat,
    braceMat,
    slabMat,
    seamMat,
    edgeMat,
    ghostFrameMat,
    meridianMat,
    haloMat
  };

  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  PRIME_FORBIDDEN_PROJECTION_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getPrimeInvertedBloomGeometries() {
  if (!PRIME_INVERTED_BLOOM_CACHE.coreGeometry) {
    const coreGeometry = new THREE.OctahedronGeometry(0.38, 0);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const xWeight = Math.min(1.0, Math.abs(x) / 0.38);
      const yWeight = Math.min(1.0, Math.abs(y) / 0.38);
      corePos.setXYZ(
        i,
        x * (0.82 + yWeight * 0.22) + z * 0.1,
        y * 1.08 + x * 0.07 - z * 0.04,
        z * (0.76 + xWeight * 0.28) - y * 0.08
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    PRIME_INVERTED_BLOOM_CACHE.coreGeometry = coreGeometry;
    PRIME_INVERTED_BLOOM_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 16);

    const seedGeometry = new THREE.OctahedronGeometry(0.11, 0);
    seedGeometry.scale(0.42, 1.44, 0.34);
    seedGeometry.computeBoundingSphere();
    PRIME_INVERTED_BLOOM_CACHE.seedGeometry = seedGeometry;

    const seamGeometry = new THREE.OctahedronGeometry(0.15, 0);
    seamGeometry.scale(0.22, 1.28, 0.2);
    seamGeometry.computeBoundingSphere();
    PRIME_INVERTED_BLOOM_CACHE.seamGeometry = seamGeometry;

    const petalGeometry = new THREE.BoxGeometry(0.28, 0.96, 0.18, 1, 3, 1);
    const petalPos = petalGeometry.attributes.position;
    for (let i = 0; i < petalPos.count; i++) {
      const x = petalPos.getX(i);
      const y = petalPos.getY(i);
      const z = petalPos.getZ(i);
      const yNorm = (y + 0.48) / 0.96;
      const taper = 0.72 + yNorm * 0.44;
      petalPos.setXYZ(
        i,
        x * taper + z * 0.12 + y * 0.08,
        y * (0.96 + Math.abs(x) * 0.16),
        z * (0.62 + yNorm * 0.48) - x * 0.12 + Math.sin(yNorm * Math.PI) * 0.04
      );
    }
    petalPos.needsUpdate = true;
    petalGeometry.computeVertexNormals();
    petalGeometry.computeBoundingSphere();
    PRIME_INVERTED_BLOOM_CACHE.petalGeometry = petalGeometry;
    PRIME_INVERTED_BLOOM_CACHE.petalEdgesGeometry = safeCreateEdgesGeometry(petalGeometry, 14);

    const shellGeometry = new THREE.BoxGeometry(0.94, 0.98, 0.74, 1, 2, 1);
    const shellPos = shellGeometry.attributes.position;
    for (let i = 0; i < shellPos.count; i++) {
      const x = shellPos.getX(i);
      const y = shellPos.getY(i);
      const z = shellPos.getZ(i);
      const yNorm = y / 0.49;
      shellPos.setXYZ(
        i,
        x * (0.84 + Math.max(0, yNorm) * 0.2) + z * 0.14 + y * 0.04,
        y * (1.0 + Math.abs(x) * 0.16) + z * 0.05,
        z * (0.72 + Math.abs(x) * 0.24) - x * 0.12 + y * 0.08
      );
    }
    shellPos.needsUpdate = true;
    shellGeometry.computeVertexNormals();
    shellGeometry.computeBoundingSphere();
    PRIME_INVERTED_BLOOM_CACHE.shellGeometry = shellGeometry;
    PRIME_INVERTED_BLOOM_CACHE.shellEdgesGeometry = safeCreateEdgesGeometry(shellGeometry, 18);

    const slabGeometry = new THREE.BoxGeometry(1.2, 0.42, 0.06, 1, 1, 1);
    const slabPos = slabGeometry.attributes.position;
    for (let i = 0; i < slabPos.count; i++) {
      const x = slabPos.getX(i);
      const y = slabPos.getY(i);
      const z = slabPos.getZ(i);
      const curve = Math.sign(x || 1) * 0.1 + y * 0.16;
      slabPos.setXYZ(
        i,
        x * 0.9 + y * 0.18,
        y * (0.88 + Math.abs(x) * 0.12),
        z + curve + x * 0.05
      );
    }
    slabPos.needsUpdate = true;
    slabGeometry.computeVertexNormals();
    slabGeometry.computeBoundingSphere();
    PRIME_INVERTED_BLOOM_CACHE.slabGeometry = slabGeometry;
    PRIME_INVERTED_BLOOM_CACHE.slabEdgesGeometry = safeCreateEdgesGeometry(slabGeometry, 16);

    const haloPositions = [];
    const haloCount = 48;
    for (let i = 0; i < haloCount; i++) {
      const angle = (i / haloCount) * Math.PI * 2;
      const radial = 0.86 + Math.sin(i * 1.22) * 0.09;
      haloPositions.push(
        Math.cos(angle) * radial + Math.sin(i * 0.71) * 0.08,
        Math.sin(i * 1.67) * 0.18 + 0.14,
        Math.sin(angle) * (0.58 + Math.cos(i * 1.03) * 0.1)
      );
    }
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute(haloPositions, 3));
    haloGeometry.computeBoundingSphere();
    PRIME_INVERTED_BLOOM_CACHE.haloGeometry = haloGeometry;
  }

  return PRIME_INVERTED_BLOOM_CACHE;
}

function _getPrimeInvertedBloomMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0xcdd9e2;
  if (PRIME_INVERTED_BLOOM_MATERIALS.has(colorHex)) return PRIME_INVERTED_BLOOM_MATERIALS.get(colorHex);

  const primeColor = new THREE.Color(colorHex);
  const silverColor = new THREE.Color(0xf7fbfd).lerp(primeColor, 0.18);
  const coldColor = new THREE.Color(0xd6f4ff);
  const depthColor = new THREE.Color(0x171d24).lerp(primeColor, 0.12);

  const coreMat = new THREE.MeshStandardMaterial({
    color: silverColor.clone().lerp(coldColor, 0.12),
    emissive: new THREE.Color(0xb1dcfb),
    emissiveIntensity: 0.28,
    metalness: 0.92,
    roughness: 0.12,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seedMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xfaffff),
    emissive: new THREE.Color(0xd4f9ff),
    emissiveIntensity: 0.36,
    metalness: 0.86,
    roughness: 0.1,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const petalMat = new THREE.MeshStandardMaterial({
    color: silverColor.clone().lerp(coldColor, 0.08),
    emissive: new THREE.Color(0x93c8ee),
    emissiveIntensity: 0.16,
    metalness: 0.84,
    roughness: 0.16,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const inversionMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xeafcff),
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    side: THREE.BackSide
  });

  const slabMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xecfcff),
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: depthColor,
    transparent: true,
    opacity: 0.94,
    depthWrite: false
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xf9fdff),
    transparent: true,
    opacity: 0.8,
    depthWrite: false
  });

  const inversionEdgeMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xe8fbff),
    transparent: true,
    opacity: 0.42,
    depthWrite: false
  });

  const haloMat = new THREE.PointsMaterial({
    color: new THREE.Color(0xd2f3ff),
    size: 0.042,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = {
    coreMat,
    seedMat,
    petalMat,
    inversionMat,
    slabMat,
    seamMat,
    edgeMat,
    inversionEdgeMat,
    haloMat
  };

  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  PRIME_INVERTED_BLOOM_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getPrimeGenesisChrysalisGeometries() {
  if (!PRIME_GENESIS_CHRYSALIS_CACHE.coreGeometry) {
    const coreGeometry = new THREE.IcosahedronGeometry(0.34, 0);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const yWeight = Math.min(1.0, Math.abs(y) / 0.34);
      const xWeight = Math.min(1.0, Math.abs(x) / 0.34);
      corePos.setXYZ(
        i,
        x * (0.84 + yWeight * 0.18) + z * 0.08,
        y * 1.12 + x * 0.05 - z * 0.03,
        z * (0.8 + xWeight * 0.18) - y * 0.07
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    PRIME_GENESIS_CHRYSALIS_CACHE.coreGeometry = coreGeometry;
    PRIME_GENESIS_CHRYSALIS_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 16);

    const seedGeometry = new THREE.OctahedronGeometry(0.1, 0);
    seedGeometry.scale(0.42, 1.34, 0.34);
    seedGeometry.computeBoundingSphere();
    PRIME_GENESIS_CHRYSALIS_CACHE.seedGeometry = seedGeometry;

    const seamGeometry = new THREE.OctahedronGeometry(0.14, 0);
    seamGeometry.scale(0.2, 1.26, 0.18);
    seamGeometry.computeBoundingSphere();
    PRIME_GENESIS_CHRYSALIS_CACHE.seamGeometry = seamGeometry;

    const huskGeometry = new THREE.BoxGeometry(0.26, 0.92, 0.18, 1, 3, 1);
    const huskPos = huskGeometry.attributes.position;
    for (let i = 0; i < huskPos.count; i++) {
      const x = huskPos.getX(i);
      const y = huskPos.getY(i);
      const z = huskPos.getZ(i);
      const yNorm = (y + 0.46) / 0.92;
      const flare = 0.74 + yNorm * 0.42;
      huskPos.setXYZ(
        i,
        x * flare + z * 0.12 + y * 0.08,
        y * (0.98 + Math.abs(x) * 0.16),
        z * (0.64 + yNorm * 0.44) - x * 0.14 + Math.sin(yNorm * Math.PI) * 0.03
      );
    }
    huskPos.needsUpdate = true;
    huskGeometry.computeVertexNormals();
    huskGeometry.computeBoundingSphere();
    PRIME_GENESIS_CHRYSALIS_CACHE.huskGeometry = huskGeometry;
    PRIME_GENESIS_CHRYSALIS_CACHE.huskEdgesGeometry = safeCreateEdgesGeometry(huskGeometry, 14);

    const ribGeometry = new THREE.BoxGeometry(0.14, 0.84, 0.12, 1, 2, 1);
    const ribPos = ribGeometry.attributes.position;
    for (let i = 0; i < ribPos.count; i++) {
      const x = ribPos.getX(i);
      const y = ribPos.getY(i);
      const z = ribPos.getZ(i);
      ribPos.setXYZ(
        i,
        x * 0.72 + y * 0.16 + z * 0.08,
        y * 1.04,
        z * 1.08 - x * 0.18 + Math.sign(y || 1) * 0.02
      );
    }
    ribPos.needsUpdate = true;
    ribGeometry.computeVertexNormals();
    ribGeometry.computeBoundingSphere();
    PRIME_GENESIS_CHRYSALIS_CACHE.ribGeometry = ribGeometry;
    PRIME_GENESIS_CHRYSALIS_CACHE.ribEdgesGeometry = safeCreateEdgesGeometry(ribGeometry, 14);

    PRIME_GENESIS_CHRYSALIS_CACHE.meridianGeometry = new THREE.TorusGeometry(0.66, 0.016, 8, 96, Math.PI * 1.18);

    const haloPositions = [];
    const haloCount = 34;
    for (let i = 0; i < haloCount; i++) {
      const angle = (i / haloCount) * Math.PI * 2;
      const radial = 0.76 + Math.sin(i * 1.37) * 0.08;
      haloPositions.push(
        Math.cos(angle) * radial + Math.sin(i * 0.63) * 0.04,
        Math.sin(i * 1.52) * 0.1 + 0.1,
        Math.sin(angle) * (0.54 + Math.cos(i * 1.08) * 0.08)
      );
    }
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute(haloPositions, 3));
    haloGeometry.computeBoundingSphere();
    PRIME_GENESIS_CHRYSALIS_CACHE.haloGeometry = haloGeometry;
  }

  return PRIME_GENESIS_CHRYSALIS_CACHE;
}

function _getPrimeGenesisChrysalisMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0xc7d7e1;
  if (PRIME_GENESIS_CHRYSALIS_MATERIALS.has(colorHex)) return PRIME_GENESIS_CHRYSALIS_MATERIALS.get(colorHex);

  const primeColor = new THREE.Color(colorHex);
  const silverColor = new THREE.Color(0xf5fafd).lerp(primeColor, 0.18);
  const coldColor = new THREE.Color(0xd5f5ff);
  const depthColor = new THREE.Color(0x182028).lerp(primeColor, 0.12);

  const coreMat = new THREE.MeshStandardMaterial({
    color: silverColor.clone().lerp(coldColor, 0.1),
    emissive: new THREE.Color(0xa9d9f8),
    emissiveIntensity: 0.26,
    metalness: 0.92,
    roughness: 0.12,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seedMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xf9fdff),
    emissive: new THREE.Color(0xcff8ff),
    emissiveIntensity: 0.34,
    metalness: 0.86,
    roughness: 0.1,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const huskMat = new THREE.MeshStandardMaterial({
    color: silverColor.clone().lerp(coldColor, 0.06),
    emissive: new THREE.Color(0x8fc6eb),
    emissiveIntensity: 0.14,
    metalness: 0.84,
    roughness: 0.18,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const ribMat = new THREE.MeshStandardMaterial({
    color: silverColor.clone().lerp(coldColor, 0.08),
    emissive: new THREE.Color(0x97daf7),
    emissiveIntensity: 0.12,
    metalness: 0.8,
    roughness: 0.18,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: depthColor,
    transparent: true,
    opacity: 0.94,
    depthWrite: false
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xf8fdff),
    transparent: true,
    opacity: 0.78,
    depthWrite: false
  });

  const meridianMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xecfbff),
    transparent: true,
    opacity: 0.2,
    depthWrite: false
  });

  const haloMat = new THREE.PointsMaterial({
    color: new THREE.Color(0xd0f3ff),
    size: 0.042,
    transparent: true,
    opacity: 0.66,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = { coreMat, seedMat, huskMat, ribMat, seamMat, edgeMat, meridianMat, haloMat };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  PRIME_GENESIS_CHRYSALIS_MATERIALS.set(colorHex, mats);
  return mats;
}

function hashString(str) {
  let hash = 0;
  const input = String(str ?? '');
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // 32-bit
  }
  return hash;
}

// ---------- MYTHIC v2 helpers ----------
function _mythicSeededRng(seed = 1) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function hashNodeIdToFloat(nodeId = '') {
  if (!nodeId) return 0.0;
  let hash = 0;
  for (let i = 0; i < nodeId.length; i++) {
    hash = ((hash << 5) - hash) + nodeId.charCodeAt(i);
    hash |= 0;
  }
  return ((hash % 1000) + 1000) % 1000 / 1000;
}

const VORTEX_MATERIAL_CACHE = new Map(); // key: baseColor hex
function createVortexMaterial(seedValue, baseColor = 0x00eaff) {
  const key = String(baseColor);
  if (VORTEX_MATERIAL_CACHE.has(key)) return VORTEX_MATERIAL_CACHE.get(key);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    wireframe: true,
    uniforms: {
      uTime: { value: 0 },
      uSeed: { value: seedValue },
      uColor: { value: new THREE.Color(baseColor) }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uSeed;
      varying vec3 vPos;

      float hash(float n) {
        return fract(sin(n) * 43758.5453123);
      }

      void main() {
        vPos = position;
        float noise = sin(position.y * 4.0 + uTime * 2.0 + uSeed) * 0.15;
        float twist = sin(position.x * 3.0 + uSeed) * 0.1;
        vec3 newPosition = position;
        newPosition.x += noise;
        newPosition.z += twist;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec3 vPos;

      void main() {
        float intensity = 0.7 + 0.3 * sin(length(vPos) * 5.0);
        gl_FragColor = vec4(uColor * intensity, 0.85);
      }
    `
  });
  VORTEX_MATERIAL_CACHE.set(key, mat);
  return mat;
}

const CONTROL_FRACTURE_MATERIAL_CACHE = new Map(); // key: baseColor hex
function createControlFractureMaterial(seedValue, baseColor = 0xff2244) {
  const key = String(baseColor);
  if (CONTROL_FRACTURE_MATERIAL_CACHE.has(key)) return CONTROL_FRACTURE_MATERIAL_CACHE.get(key);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uSeed: { value: seedValue },
      uColor: { value: new THREE.Color(baseColor) }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uSeed;
      varying vec3 vNormal;
      void main() {
        vNormal = normal;
        float noise = sin(position.y * 5.0 + uTime + uSeed) * 0.04;
        vec3 displaced = position + normal * noise;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec3 vNormal;
      void main() {
        float intensity = 0.5 + 0.5 * dot(normalize(vNormal), vec3(0.0, 1.0, 0.0));
        gl_FragColor = vec4(uColor * intensity, 0.95);
      }
    `,
    side: THREE.DoubleSide
  });
  CONTROL_FRACTURE_MATERIAL_CACHE.set(key, mat);
  return mat;
}

const SIGMA_COLLAPSE_MATERIAL_CACHE = new Map(); // key: baseColor hex
function createSigmaCollapseMaterial(seedValue, baseColor = 0xff2244) {
  const key = String(baseColor);
  if (SIGMA_COLLAPSE_MATERIAL_CACHE.has(key)) return SIGMA_COLLAPSE_MATERIAL_CACHE.get(key);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uSeed: { value: seedValue },
      uCollapseStrength: { value: 0.5 },
      uColor: { value: new THREE.Color(baseColor) }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uSeed;
      uniform float uCollapseStrength;
      varying vec3 vPos;

      void main() {
        vPos = position;
        float pulse = sin(uTime * 2.0 + uSeed) * uCollapseStrength * 0.04;
        float pull = (1.0 - smoothstep(0.0, 1.0, length(position))) * uCollapseStrength * 0.1;
        vec3 displaced = position + normal * (pulse - pull);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uCollapseStrength;
      varying vec3 vPos;

      void main() {
        float len = length(vPos);
        float intensity = 0.6 + 0.4 * sin(len * 5.0 + uCollapseStrength * 3.0);
        float alpha = 0.7 + 0.3 * cos(len * 4.0);
        gl_FragColor = vec4(uColor * intensity, alpha);
      }
    `,
    side: THREE.DoubleSide
  });
  SIGMA_COLLAPSE_MATERIAL_CACHE.set(key, mat);
  return mat;
}

function _getMythicV2Geometries() {
  if (!MYTHIC_V2_CACHE.coreGeometry) {
    const coreGeometry = new THREE.DodecahedronGeometry(0.58, 0);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const yNorm = (y + 0.58) / 1.16;
      const carve = x > 0.08 && y > -0.02 && z > -0.06;
      corePos.setXYZ(
        i,
        carve ? x * 0.42 + 0.02 : x * (0.94 + yNorm * 0.18) + z * 0.06,
        carve ? y * 0.44 + 0.06 : y * (1.04 + Math.abs(x) * 0.08),
        carve ? z * 0.36 + 0.04 : z * (0.82 + yNorm * 0.12) - x * 0.06
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    MYTHIC_V2_CACHE.coreGeometry = coreGeometry;
    MYTHIC_V2_CACHE.edgesGeometry = safeCreateEdgesGeometry(coreGeometry, 14);

    const seamGeometry = new THREE.BoxGeometry(0.1, 0.62, 0.18, 1, 1, 1);
    const seamPos = seamGeometry.attributes.position;
    for (let i = 0; i < seamPos.count; i++) {
      const x = seamPos.getX(i);
      const y = seamPos.getY(i);
      const z = seamPos.getZ(i);
      seamPos.setXYZ(
        i,
        x * (0.42 + Math.abs(y) * 0.64) + Math.sin(y * 4.6) * 0.018,
        y * 0.96 + Math.abs(x) * 0.04,
        z * (0.74 + Math.max(0, y) * 0.2) - x * 0.18
      );
    }
    seamPos.needsUpdate = true;
    seamGeometry.computeVertexNormals();
    seamGeometry.computeBoundingSphere();
    MYTHIC_V2_CACHE.seamGeometry = seamGeometry;

    const ringCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.94, -0.1, 0.06),
      new THREE.Vector3(-0.58, 0.12, 0.22),
      new THREE.Vector3(-0.12, 0.24, 0.26),
      new THREE.Vector3(0.34, 0.16, 0.12),
      new THREE.Vector3(0.7, -0.02, -0.08),
      new THREE.Vector3(0.92, -0.16, -0.18)
    ], false);
    const ringGeometry = new THREE.TubeGeometry(ringCurve, 40, 0.055, 6, false);
    ringGeometry.computeBoundingSphere();
    MYTHIC_V2_CACHE.ringGeometry = ringGeometry;

    const shardGeom = new THREE.CylinderGeometry(0.024, 0.12, 0.62, 5, 4, false);
    const shardPos = shardGeom.attributes.position;
    for (let i = 0; i < shardPos.count; i++) {
      const x = shardPos.getX(i);
      const y = shardPos.getY(i);
      const z = shardPos.getZ(i);
      const yNorm = (y + 0.31) / 0.62;
      const flare = 0.28 + yNorm * 1.02;
      shardPos.setXYZ(
        i,
        x * flare + Math.sin(yNorm * Math.PI) * 0.032,
        y * 1.06,
        z * (0.18 + yNorm * 0.36) - Math.cos(yNorm * Math.PI) * 0.018
      );
    }
    shardPos.needsUpdate = true;
    shardGeom.translate(0, 0.18, 0);
    shardGeom.computeVertexNormals();
    shardGeom.computeBoundingSphere();
    MYTHIC_V2_CACHE.shardGeometry = shardGeom;

    const haloPositions = [];
    const haloCount = 34;
    for (let i = 0; i < haloCount; i++) {
      const t = i / (haloCount - 1);
      const angle = -Math.PI * 0.18 + t * Math.PI * 1.36;
      haloPositions.push(
        Math.cos(angle) * 1.06,
        0.12 + Math.sin(angle * 1.22) * 0.24,
        Math.sin(angle) * 0.64
      );
    }
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute(haloPositions, 3));
    haloGeometry.computeBoundingSphere();
    MYTHIC_V2_CACHE.haloGeometry = haloGeometry;

    const runePositions = [];
    const runeCount = 56;
    for (let i = 0; i < runeCount; i++) {
      const t = i / runeCount;
      const angle = t * Math.PI * 2.08;
      const radius = 0.84 + Math.sin(i * 0.82) * 0.1 + (i % 2 === 0 ? 0.1 : -0.02);
      runePositions.push(
        Math.cos(angle) * radius,
        -0.04 + Math.sin(i * 1.18) * 0.1 + t * 0.16,
        Math.sin(angle) * radius * 0.72
      );
    }
    const runeGeometry = new THREE.BufferGeometry();
    runeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(runePositions, 3));
    runeGeometry.computeBoundingSphere();
    MYTHIC_V2_CACHE.runeGeometry = runeGeometry;
  }
  return MYTHIC_V2_CACHE;
}

function _getMythicV2Materials(color) {
  const colorHex = typeof color === 'number' ? color : 0xffdd00;
  if (MYTHIC_V2_MATERIALS.has(colorHex)) return MYTHIC_V2_MATERIALS.get(colorHex);

  const mythicColor = new THREE.Color(colorHex);
  const relicBronze = mythicColor.clone().lerp(new THREE.Color(0x6f4c22), 0.3);
  const sanctumIvory = new THREE.Color(0xfff2d8).lerp(mythicColor, 0.1);
  const spectral = new THREE.Color(0xdff8ff);

  const coreMat = new THREE.MeshStandardMaterial({
    color: mythicColor.clone().lerp(new THREE.Color(0xffffff), 0.08),
    metalness: 0.68,
    roughness: 0.18,
    emissive: mythicColor,
    emissiveIntensity: 0.36,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const edgesMat = new THREE.LineBasicMaterial({
    color: sanctumIvory.clone().lerp(spectral, 0.08),
    transparent: true,
    opacity: 0.62,
    depthWrite: false
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: 0x07070c,
    transparent: true,
    opacity: 0.92,
    depthWrite: false
  });

  const ringMat = new THREE.MeshBasicMaterial({
    color: sanctumIvory.clone().lerp(mythicColor, 0.16),
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  });

  const shardMat = new THREE.MeshStandardMaterial({
    color: relicBronze.clone().lerp(mythicColor, 0.14),
    metalness: 0.58,
    roughness: 0.22,
    emissive: mythicColor,
    emissiveIntensity: 0.18,
    transparent: true,
    opacity: 0.78,
    depthWrite: false
  });

  const runeMat = new THREE.PointsMaterial({
    color: sanctumIvory,
    size: 0.05,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    sizeAttenuation: true
  });

  const haloMat = new THREE.PointsMaterial({
    color: spectral.clone().lerp(sanctumIvory, 0.22),
    size: 0.046,
    transparent: true,
    opacity: 0.48,
    depthWrite: false
  });

  const mats = { coreMat, edgesMat, seamMat, ringMat, shardMat, runeMat, haloMat };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }
  MYTHIC_V2_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getMythicV2CrownPositions(coreGeometry) {
  if (MYTHIC_V2_CACHE.crownPositions) return MYTHIC_V2_CACHE.crownPositions;

  const positions = [];
  const steps = 16;
  const radius = (coreGeometry.boundingSphere?.radius || 0.58) * 1.34;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const tier = i % 2 === 0 ? 0 : 1;
    const localRadius = radius * (tier === 0 ? 1.0 : 0.8);
    const x = Math.cos(angle) * localRadius;
    const z = Math.sin(angle) * localRadius * (tier === 0 ? 0.86 : 0.72);
    const y = tier === 0 ? 0.34 + Math.sin(i * 0.7) * 0.04 : 0.62 + Math.cos(i * 0.8) * 0.05;
    positions.push(new THREE.Vector3(x, y, z));
  }
  MYTHIC_V2_CACHE.crownPositions = positions;
  return positions;
}

function _getMythicFloatingReliquaryGeometries() {
  if (!MYTHIC_FLOATING_RELIQUARY_CACHE.coreGeometry) {
    const coreGeometry = new THREE.DodecahedronGeometry(0.48, 0);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);

      if (x > 0.04 && y > 0.06) {
        corePos.setXYZ(i, x * 0.62, y * 0.74, z * 0.82);
        continue;
      }
      if (z < -0.18 && y < -0.04) {
        corePos.setXYZ(i, x * 0.88, y * 0.72, z * 0.56);
      }
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    MYTHIC_FLOATING_RELIQUARY_CACHE.coreGeometry = coreGeometry;
    MYTHIC_FLOATING_RELIQUARY_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 14);

    const slabGeometry = new THREE.CylinderGeometry(0.24, 0.34, 0.11, 5, 1, false);
    slabGeometry.rotateY(Math.PI / 5);
    slabGeometry.scale(1.22, 1.0, 0.72);
    const slabPos = slabGeometry.attributes.position;
    for (let i = 0; i < slabPos.count; i++) {
      const y = slabPos.getY(i);
      if (y > 0) {
        slabPos.setXYZ(i, slabPos.getX(i) * 0.92, y, slabPos.getZ(i) * 1.08);
      }
    }
    slabPos.needsUpdate = true;
    slabGeometry.computeVertexNormals();
    slabGeometry.computeBoundingSphere();
    MYTHIC_FLOATING_RELIQUARY_CACHE.slabGeometry = slabGeometry;

    const witnessGeometry = new THREE.OctahedronGeometry(0.14, 0);
    witnessGeometry.scale(0.78, 1.2, 0.72);
    witnessGeometry.rotateX(Math.PI * 0.16);
    witnessGeometry.computeBoundingSphere();
    MYTHIC_FLOATING_RELIQUARY_CACHE.witnessGeometry = witnessGeometry;

    const voidGeometry = new THREE.OctahedronGeometry(0.12, 0);
    voidGeometry.scale(0.58, 1.18, 0.58);
    voidGeometry.computeBoundingSphere();
    MYTHIC_FLOATING_RELIQUARY_CACHE.voidGeometry = voidGeometry;

    MYTHIC_FLOATING_RELIQUARY_CACHE.majorArcGeometry = new THREE.TorusGeometry(0.88, 0.03, 10, 72, Math.PI * 1.12);
    MYTHIC_FLOATING_RELIQUARY_CACHE.minorArcGeometry = new THREE.TorusGeometry(0.62, 0.022, 10, 64, Math.PI * 0.9);

    const runePositions = [];
    const runeCount = 42;
    for (let i = 0; i < runeCount; i++) {
      const t = i / runeCount;
      const angle = t * Math.PI * 2;
      const radius = 0.92 + 0.14 * Math.sin(i * 0.9);
      runePositions.push(
        Math.cos(angle) * radius,
        0.22 + Math.sin(i * 1.3) * 0.18,
        Math.sin(angle) * (0.7 + 0.12 * Math.cos(i * 0.7))
      );
    }
    const runeGeometry = new THREE.BufferGeometry();
    runeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(runePositions, 3));
    runeGeometry.computeBoundingSphere();
    MYTHIC_FLOATING_RELIQUARY_CACHE.runeGeometry = runeGeometry;

    const haloPositions = [];
    const haloCount = 28;
    for (let i = 0; i < haloCount; i++) {
      const angle = (i / haloCount) * Math.PI * 2;
      haloPositions.push(
        Math.cos(angle) * 0.78,
        0.14 + Math.sin(i * 1.4) * 0.06,
        Math.sin(angle) * 0.58
      );
    }
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute(haloPositions, 3));
    haloGeometry.computeBoundingSphere();
    MYTHIC_FLOATING_RELIQUARY_CACHE.haloGeometry = haloGeometry;
  }

  return MYTHIC_FLOATING_RELIQUARY_CACHE;
}

function _getMythicFloatingReliquaryMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0xffdd00;
  if (MYTHIC_FLOATING_RELIQUARY_MATERIALS.has(colorHex)) {
    return MYTHIC_FLOATING_RELIQUARY_MATERIALS.get(colorHex);
  }

  const mythicColor = new THREE.Color(colorHex);
  const relicColor = mythicColor.clone().lerp(new THREE.Color(0x7a5b2b), 0.24);

  const coreMat = new THREE.MeshStandardMaterial({
    color: mythicColor,
    metalness: 0.62,
    roughness: 0.18,
    emissive: mythicColor,
    emissiveIntensity: 0.38,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const slabMat = new THREE.MeshStandardMaterial({
    color: relicColor,
    metalness: 0.52,
    roughness: 0.28,
    emissive: mythicColor,
    emissiveIntensity: 0.18,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: mythicColor.clone().lerp(new THREE.Color(0xffffff), 0.12),
    transparent: true,
    opacity: 0.72,
    depthWrite: true
  });

  const arcMat = new THREE.MeshBasicMaterial({
    color: mythicColor.clone().lerp(new THREE.Color(0xffffff), 0.08),
    transparent: true,
    opacity: 0.38,
    depthWrite: false
  });

  const voidMat = new THREE.MeshBasicMaterial({
    color: 0x05060a,
    transparent: true,
    opacity: 0.94,
    depthWrite: false
  });

  const runeMat = new THREE.PointsMaterial({
    color: 0xfff3d1,
    size: 0.052,
    transparent: true,
    opacity: 0.74,
    depthWrite: false,
    sizeAttenuation: true
  });

  const haloMat = new THREE.PointsMaterial({
    color: 0xd9f8ff,
    size: 0.046,
    transparent: true,
    opacity: 0.56,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = { coreMat, slabMat, edgeMat, arcMat, voidMat, runeMat, haloMat };
  MYTHIC_FLOATING_RELIQUARY_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getMythicApostateMonolithGeometries() {
  if (!MYTHIC_APOSTATE_MONOLITH_CACHE.coreGeometry) {
    const coreGeometry = new THREE.BoxGeometry(0.22, 0.86, 0.18, 1, 4, 1);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const yNorm = (y + 0.43) / 0.86;
      const taper = 0.82 + yNorm * 0.36;
      corePos.setXYZ(
        i,
        x * taper + z * 0.06,
        y * 1.08,
        z * (0.74 + yNorm * 0.18) - x * 0.08
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    MYTHIC_APOSTATE_MONOLITH_CACHE.coreGeometry = coreGeometry;
    MYTHIC_APOSTATE_MONOLITH_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 12);

    const seamGeometry = new THREE.BoxGeometry(0.06, 0.98, 0.12, 1, 1, 1);
    const seamPos = seamGeometry.attributes.position;
    for (let i = 0; i < seamPos.count; i++) {
      const x = seamPos.getX(i);
      const y = seamPos.getY(i);
      const z = seamPos.getZ(i);
      seamPos.setXYZ(
        i,
        x * (0.48 + Math.abs(y) * 0.46) + Math.sin(y * 3.6) * 0.02,
        y * 1.02,
        z * 0.64 + x * 0.16
      );
    }
    seamPos.needsUpdate = true;
    seamGeometry.computeVertexNormals();
    seamGeometry.computeBoundingSphere();
    MYTHIC_APOSTATE_MONOLITH_CACHE.seamGeometry = seamGeometry;

    const idolGeometryA = new THREE.BoxGeometry(0.34, 1.34, 0.28, 1, 5, 1);
    const idolAPos = idolGeometryA.attributes.position;
    for (let i = 0; i < idolAPos.count; i++) {
      const x = idolAPos.getX(i);
      const y = idolAPos.getY(i);
      const z = idolAPos.getZ(i);
      const yNorm = (y + 0.67) / 1.34;
      const carve = x > 0 ? 0.22 : 1.0;
      idolAPos.setXYZ(
        i,
        x * carve + Math.max(0, y) * -0.04,
        y * (1.0 + yNorm * 0.12) + Math.abs(x) * 0.04,
        z * 0.82 + x * -0.08
      );
    }
    idolAPos.needsUpdate = true;
    idolGeometryA.computeVertexNormals();
    idolGeometryA.computeBoundingSphere();
    MYTHIC_APOSTATE_MONOLITH_CACHE.idolGeometryA = idolGeometryA;
    MYTHIC_APOSTATE_MONOLITH_CACHE.idolEdgesGeometryA = safeCreateEdgesGeometry(idolGeometryA, 10);

    const idolGeometryB = new THREE.BoxGeometry(0.3, 1.18, 0.26, 1, 5, 1);
    const idolBPos = idolGeometryB.attributes.position;
    for (let i = 0; i < idolBPos.count; i++) {
      const x = idolBPos.getX(i);
      const y = idolBPos.getY(i);
      const z = idolBPos.getZ(i);
      const yNorm = (y + 0.59) / 1.18;
      const carve = x < 0 ? 0.24 : 0.98;
      idolBPos.setXYZ(
        i,
        x * carve + Math.max(0, y) * 0.03,
        y * (1.0 + yNorm * 0.08) + Math.abs(z) * 0.03,
        z * 0.84 + x * 0.06
      );
    }
    idolBPos.needsUpdate = true;
    idolGeometryB.computeVertexNormals();
    idolGeometryB.computeBoundingSphere();
    MYTHIC_APOSTATE_MONOLITH_CACHE.idolGeometryB = idolGeometryB;
    MYTHIC_APOSTATE_MONOLITH_CACHE.idolEdgesGeometryB = safeCreateEdgesGeometry(idolGeometryB, 10);

    const ribGeometry = new THREE.CylinderGeometry(0.014, 0.11, 0.94, 4, 3, false);
    const ribPos = ribGeometry.attributes.position;
    for (let i = 0; i < ribPos.count; i++) {
      const x = ribPos.getX(i);
      const y = ribPos.getY(i);
      const z = ribPos.getZ(i);
      const yNorm = (y + 0.47) / 0.94;
      const flare = 0.24 + yNorm * 1.08;
      ribPos.setXYZ(
        i,
        x * flare + Math.sin(yNorm * Math.PI) * 0.05,
        y * 1.04,
        z * (0.14 + yNorm * 0.46) - Math.cos(yNorm * Math.PI) * 0.02
      );
    }
    ribPos.needsUpdate = true;
    ribGeometry.translate(0, 0.32, 0);
    ribGeometry.computeVertexNormals();
    ribGeometry.computeBoundingSphere();
    MYTHIC_APOSTATE_MONOLITH_CACHE.ribGeometry = ribGeometry;
    MYTHIC_APOSTATE_MONOLITH_CACHE.ribEdgesGeometry = safeCreateEdgesGeometry(ribGeometry, 16);

    const shardGeometry = new THREE.OctahedronGeometry(0.14, 0);
    shardGeometry.scale(0.78, 1.24, 0.74);
    shardGeometry.rotateX(Math.PI * 0.18);
    shardGeometry.computeBoundingSphere();
    MYTHIC_APOSTATE_MONOLITH_CACHE.shardGeometry = shardGeometry;
    MYTHIC_APOSTATE_MONOLITH_CACHE.shardEdgesGeometry = safeCreateEdgesGeometry(shardGeometry, 12);

    const glyphPositions = [];
    const glyphCount = 38;
    for (let i = 0; i < glyphCount; i++) {
      const t = i / glyphCount;
      const angle = t * Math.PI * 2.06;
      const radius = 0.58 + t * 0.46 + Math.sin(i * 0.8) * 0.08;
      glyphPositions.push(
        Math.cos(angle) * radius * 0.72,
        -0.08 + t * 1.42 + Math.sin(i * 1.12) * 0.08,
        Math.sin(angle) * radius * 0.42
      );
    }
    const glyphGeometry = new THREE.BufferGeometry();
    glyphGeometry.setAttribute('position', new THREE.Float32BufferAttribute(glyphPositions, 3));
    glyphGeometry.computeBoundingSphere();
    MYTHIC_APOSTATE_MONOLITH_CACHE.glyphGeometry = glyphGeometry;

    const dustPositions = [];
    const dustCount = 28;
    for (let i = 0; i < dustCount; i++) {
      const angle = (i / dustCount) * Math.PI * 2;
      dustPositions.push(
        Math.cos(angle) * 0.84,
        0.22 + Math.sin(i * 1.28) * 0.1,
        Math.sin(angle) * 0.54
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();
    MYTHIC_APOSTATE_MONOLITH_CACHE.dustGeometry = dustGeometry;
  }

  return MYTHIC_APOSTATE_MONOLITH_CACHE;
}

function _getMythicApostateMonolithMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0xffdd00;
  if (MYTHIC_APOSTATE_MONOLITH_MATERIALS.has(colorHex)) {
    return MYTHIC_APOSTATE_MONOLITH_MATERIALS.get(colorHex);
  }

  const mythicColor = new THREE.Color(colorHex);
  const relicColor = mythicColor.clone().lerp(new THREE.Color(0x6f5327), 0.28);
  const paleSanctum = new THREE.Color(0xfff5da).lerp(mythicColor, 0.12);
  const spectral = new THREE.Color(0xdaf8ff);

  const coreMat = new THREE.MeshStandardMaterial({
    color: mythicColor.clone().lerp(new THREE.Color(0xffffff), 0.06),
    metalness: 0.66,
    roughness: 0.16,
    emissive: mythicColor,
    emissiveIntensity: 0.42,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const idolMatA = new THREE.MeshStandardMaterial({
    color: relicColor.clone().lerp(mythicColor, 0.12),
    metalness: 0.56,
    roughness: 0.24,
    emissive: mythicColor,
    emissiveIntensity: 0.16,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const idolMatB = new THREE.MeshStandardMaterial({
    color: relicColor.clone().lerp(new THREE.Color(0x8d6a30), 0.18),
    metalness: 0.54,
    roughness: 0.28,
    emissive: mythicColor,
    emissiveIntensity: 0.14,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: 0x05060a,
    transparent: true,
    opacity: 0.94,
    depthWrite: false
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: paleSanctum.clone().lerp(spectral, 0.08),
    transparent: true,
    opacity: 0.7,
    depthWrite: false
  });

  const ribMat = new THREE.MeshBasicMaterial({
    color: paleSanctum.clone().lerp(mythicColor, 0.18),
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  });

  const ribEdgeMat = new THREE.LineBasicMaterial({
    color: spectral.clone().lerp(paleSanctum, 0.3),
    transparent: true,
    opacity: 0.3,
    depthWrite: false
  });

  const shardMat = new THREE.MeshBasicMaterial({
    color: relicColor.clone().lerp(paleSanctum, 0.22),
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  });

  const glyphMat = new THREE.PointsMaterial({
    color: paleSanctum,
    size: 0.048,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    sizeAttenuation: true
  });

  const dustMat = new THREE.PointsMaterial({
    color: spectral.clone().lerp(paleSanctum, 0.18),
    size: 0.044,
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = {
    coreMat,
    idolMatA,
    idolMatB,
    seamMat,
    edgeMat,
    ribMat,
    ribEdgeMat,
    shardMat,
    glyphMat,
    dustMat
  };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  MYTHIC_APOSTATE_MONOLITH_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getMythicOracularPrismGeometries() {
  if (!MYTHIC_ORACULAR_PRISM_CACHE.coreGeometry) {
    const coreGeometry = new THREE.CylinderGeometry(0.2, 0.24, 0.92, 6, 5, false);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const yNorm = (y + 0.46) / 0.92;
      const taper = 0.86 + yNorm * 0.26;
      corePos.setXYZ(
        i,
        x * taper + z * 0.08,
        y * 1.08,
        z * (0.74 + yNorm * 0.2) - x * 0.06
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    MYTHIC_ORACULAR_PRISM_CACHE.coreGeometry = coreGeometry;
    MYTHIC_ORACULAR_PRISM_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 12);

    const fissureGeometry = new THREE.BoxGeometry(0.05, 1.02, 0.13, 1, 1, 1);
    const fissurePos = fissureGeometry.attributes.position;
    for (let i = 0; i < fissurePos.count; i++) {
      const x = fissurePos.getX(i);
      const y = fissurePos.getY(i);
      const z = fissurePos.getZ(i);
      fissurePos.setXYZ(
        i,
        x * (0.54 + Math.abs(y) * 0.4) + Math.sin(y * 3.8) * 0.018,
        y * 1.04,
        z * 0.66 + x * 0.14
      );
    }
    fissurePos.needsUpdate = true;
    fissureGeometry.computeVertexNormals();
    fissureGeometry.computeBoundingSphere();
    MYTHIC_ORACULAR_PRISM_CACHE.fissureGeometry = fissureGeometry;

    const cagePositions = [];
    const addSegment = (ax, ay, az, bx, by, bz) => {
      cagePositions.push(ax, ay, az, bx, by, bz);
    };
    const addPath = (points) => {
      for (let i = 0; i < points.length - 1; i++) {
        addSegment(
          points[i][0], points[i][1], points[i][2],
          points[i + 1][0], points[i + 1][1], points[i + 1][2]
        );
      }
    };

    // Open sacred sutures replace the readable hex cage.
    addPath([
      [-0.26, -0.02, 0.16],
      [-0.18, 0.12, 0.1],
      [-0.06, 0.34, 0.04],
      [0.02, 0.58, -0.02]
    ]);
    addPath([
      [0.08, 0.04, -0.12],
      [0.18, 0.2, -0.08],
      [0.24, 0.42, -0.02],
      [0.18, 0.66, 0.1]
    ]);
    addPath([
      [-0.12, 0.24, 0.18],
      [0.02, 0.34, 0.12],
      [0.18, 0.5, 0.08],
      [0.28, 0.72, 0.02]
    ]);

    // Two short reliquary braces cluster near the upper shrine area only.
    addPath([
      [-0.3, 0.36, -0.02],
      [-0.2, 0.46, -0.06],
      [-0.12, 0.58, 0.02]
    ]);
    addPath([
      [0.06, 0.3, 0.2],
      [0.18, 0.42, 0.12],
      [0.26, 0.56, 0.04]
    ]);

    // Partial aperture chord lives close to the fissure, not around the full prism.
    addSegment(-0.06, 0.18, 0.11, 0.12, 0.28, -0.02);

    const cageEdgesGeometry = new THREE.BufferGeometry();
    cageEdgesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(cagePositions, 3));
    cageEdgesGeometry.computeBoundingSphere();
    MYTHIC_ORACULAR_PRISM_CACHE.cageGeometry = cageEdgesGeometry;
    MYTHIC_ORACULAR_PRISM_CACHE.cageEdgesGeometry = cageEdgesGeometry;

    const planeGeometry = new THREE.BoxGeometry(0.4, 1.1, 0.1, 1, 5, 1);
    const planePos = planeGeometry.attributes.position;
    for (let i = 0; i < planePos.count; i++) {
      const x = planePos.getX(i);
      const y = planePos.getY(i);
      const z = planePos.getZ(i);
      const yNorm = (y + 0.55) / 1.1;
      const spread = 0.74 + yNorm * 0.44;
      planePos.setXYZ(
        i,
        x * spread + Math.sign(x || 1) * Math.abs(z) * 0.12,
        y * 1.02,
        z * (0.42 + yNorm * 0.24) - x * 0.08
      );
    }
    planePos.needsUpdate = true;
    planeGeometry.computeVertexNormals();
    planeGeometry.computeBoundingSphere();
    MYTHIC_ORACULAR_PRISM_CACHE.planeGeometry = planeGeometry;
    MYTHIC_ORACULAR_PRISM_CACHE.planeEdgesGeometry = safeCreateEdgesGeometry(planeGeometry, 14);

    const facetGeometry = new THREE.OctahedronGeometry(0.16, 0);
    facetGeometry.scale(0.76, 1.26, 0.72);
    facetGeometry.rotateX(Math.PI * 0.18);
    facetGeometry.computeBoundingSphere();
    MYTHIC_ORACULAR_PRISM_CACHE.facetGeometry = facetGeometry;
    MYTHIC_ORACULAR_PRISM_CACHE.facetEdgesGeometry = safeCreateEdgesGeometry(facetGeometry, 12);

    const railCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.34, -0.12, 0.16),
      new THREE.Vector3(-0.1, 0.18, 0.22),
      new THREE.Vector3(0.1, 0.48, 0.04),
      new THREE.Vector3(0.3, 0.86, -0.14)
    ]);
    const railGeometry = new THREE.TubeGeometry(railCurve, 28, 0.014, 6, false);
    railGeometry.computeBoundingSphere();
    MYTHIC_ORACULAR_PRISM_CACHE.railGeometry = railGeometry;
    MYTHIC_ORACULAR_PRISM_CACHE.railEdgesGeometry = safeCreateEdgesGeometry(railGeometry, 18);

    const runePositions = [];
    const runeCount = 42;
    for (let i = 0; i < runeCount; i++) {
      const t = i / runeCount;
      const angle = t * Math.PI * 2.18;
      const radius = 0.52 + t * 0.52 + Math.sin(i * 0.86) * 0.06;
      runePositions.push(
        Math.cos(angle) * radius * 0.68,
        -0.04 + t * 1.28 + Math.sin(i * 1.18) * 0.08,
        Math.sin(angle) * radius * 0.46
      );
    }
    const runeGeometry = new THREE.BufferGeometry();
    runeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(runePositions, 3));
    runeGeometry.computeBoundingSphere();
    MYTHIC_ORACULAR_PRISM_CACHE.runeGeometry = runeGeometry;

    const haloPositions = [];
    const haloCount = 30;
    for (let i = 0; i < haloCount; i++) {
      const angle = (i / haloCount) * Math.PI * 2;
      haloPositions.push(
        Math.cos(angle) * 0.82,
        0.2 + Math.sin(i * 1.3) * 0.08,
        Math.sin(angle) * 0.56
      );
    }
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute(haloPositions, 3));
    haloGeometry.computeBoundingSphere();
    MYTHIC_ORACULAR_PRISM_CACHE.haloGeometry = haloGeometry;
  }

  return MYTHIC_ORACULAR_PRISM_CACHE;
}

function _getMythicOracularPrismMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0xffdd00;
  if (MYTHIC_ORACULAR_PRISM_MATERIALS.has(colorHex)) {
    return MYTHIC_ORACULAR_PRISM_MATERIALS.get(colorHex);
  }

  const mythicColor = new THREE.Color(colorHex);
  const relicColor = mythicColor.clone().lerp(new THREE.Color(0x72552a), 0.24);
  const paleSanctum = new THREE.Color(0xfff3d8).lerp(mythicColor, 0.12);
  const spectral = new THREE.Color(0xdaf8ff);
  const prismLight = spectral.clone().lerp(paleSanctum, 0.34);

  const coreMat = new THREE.MeshStandardMaterial({
    color: mythicColor.clone().lerp(new THREE.Color(0xffffff), 0.08),
    metalness: 0.64,
    roughness: 0.16,
    emissive: mythicColor,
    emissiveIntensity: 0.34,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const fissureMat = new THREE.MeshBasicMaterial({
    color: prismLight,
    transparent: true,
    opacity: 0.82,
    depthWrite: false
  });

  const cageMat = new THREE.LineBasicMaterial({
    color: paleSanctum.clone().lerp(spectral, 0.14),
    transparent: true,
    opacity: 0.26,
    depthWrite: false
  });

  const planeMatA = new THREE.MeshStandardMaterial({
    color: relicColor.clone().lerp(mythicColor, 0.12),
    metalness: 0.54,
    roughness: 0.24,
    emissive: mythicColor,
    emissiveIntensity: 0.14,
    transparent: true,
    opacity: 0.84,
    depthWrite: true,
    depthTest: true
  });

  const planeMatB = new THREE.MeshBasicMaterial({
    color: prismLight.clone().lerp(mythicColor, 0.12),
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  });

  const planeMatC = new THREE.MeshBasicMaterial({
    color: paleSanctum.clone().lerp(spectral, 0.3),
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  });

  const planeEdgeMat = new THREE.LineBasicMaterial({
    color: paleSanctum.clone().lerp(spectral, 0.18),
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  });

  const facetMat = new THREE.MeshBasicMaterial({
    color: relicColor.clone().lerp(prismLight, 0.26),
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  });

  const railMat = new THREE.MeshBasicMaterial({
    color: spectral.clone().lerp(mythicColor, 0.16),
    transparent: true,
    opacity: 0.14,
    depthWrite: false
  });

  const railEdgeMat = new THREE.LineBasicMaterial({
    color: prismLight.clone().lerp(paleSanctum, 0.2),
    transparent: true,
    opacity: 0.28,
    depthWrite: false
  });

  const runeMat = new THREE.PointsMaterial({
    color: paleSanctum,
    size: 0.05,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    sizeAttenuation: true
  });

  const haloMat = new THREE.PointsMaterial({
    color: spectral.clone().lerp(paleSanctum, 0.2),
    size: 0.046,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = {
    coreMat,
    fissureMat,
    cageMat,
    planeMatA,
    planeMatB,
    planeMatC,
    planeEdgeMat,
    facetMat,
    railMat,
    railEdgeMat,
    runeMat,
    haloMat
  };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  MYTHIC_ORACULAR_PRISM_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getMythicAbsentCoreSanctumGeometries() {
  if (!MYTHIC_ABSENT_CORE_SANCTUM_CACHE.coreGeometry) {
    const coreGeometry = new THREE.DodecahedronGeometry(0.36, 0);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const carve = x > 0.08 && y > -0.06 && z > -0.12;
      const yNorm = (y + 0.36) / 0.72;
      const taper = 0.92 + yNorm * 0.14;
      corePos.setXYZ(
        i,
        carve ? x * 0.26 + 0.04 : x * taper + z * 0.05,
        carve ? y * 0.22 + 0.08 : y * (1.02 + Math.abs(x) * 0.08),
        carve ? z * 0.18 + 0.04 : z * (0.9 + yNorm * 0.08) - x * 0.04
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    MYTHIC_ABSENT_CORE_SANCTUM_CACHE.coreGeometry = coreGeometry;
    MYTHIC_ABSENT_CORE_SANCTUM_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 10);

    const voidGeometry = new THREE.BoxGeometry(0.16, 0.3, 0.22, 1, 1, 1);
    const voidPos = voidGeometry.attributes.position;
    for (let i = 0; i < voidPos.count; i++) {
      const x = voidPos.getX(i);
      const y = voidPos.getY(i);
      const z = voidPos.getZ(i);
      voidPos.setXYZ(
        i,
        x * (0.56 + Math.abs(y) * 0.78) + Math.sin(y * 6.2) * 0.018,
        y * 0.96 + Math.abs(x) * 0.04,
        z * (0.82 + Math.max(0, y) * 0.26) - x * 0.12
      );
    }
    voidPos.needsUpdate = true;
    voidGeometry.computeVertexNormals();
    voidGeometry.computeBoundingSphere();
    MYTHIC_ABSENT_CORE_SANCTUM_CACHE.voidGeometry = voidGeometry;

    const shardGeometry = new THREE.TetrahedronGeometry(0.18, 0);
    const shardPos = shardGeometry.attributes.position;
    for (let i = 0; i < shardPos.count; i++) {
      const x = shardPos.getX(i);
      const y = shardPos.getY(i);
      const z = shardPos.getZ(i);
      shardPos.setXYZ(
        i,
        x * (0.68 + Math.max(0, y) * 0.9),
        y * 1.18 + Math.abs(z) * 0.08,
        z * 0.62 - x * 0.14
      );
    }
    shardPos.needsUpdate = true;
    shardGeometry.computeVertexNormals();
    shardGeometry.computeBoundingSphere();
    MYTHIC_ABSENT_CORE_SANCTUM_CACHE.shardGeometry = shardGeometry;
    MYTHIC_ABSENT_CORE_SANCTUM_CACHE.shardEdgesGeometry = safeCreateEdgesGeometry(shardGeometry, 12);

    const seedGeometry = new THREE.OctahedronGeometry(0.08, 0);
    seedGeometry.scale(0.82, 1.22, 0.74);
    seedGeometry.rotateZ(Math.PI * 0.18);
    seedGeometry.computeBoundingSphere();
    MYTHIC_ABSENT_CORE_SANCTUM_CACHE.seedGeometry = seedGeometry;

    const terraceGeometry = new THREE.CylinderGeometry(0.54, 0.64, 0.11, 7, 1, false);
    const terracePos = terraceGeometry.attributes.position;
    for (let i = 0; i < terracePos.count; i++) {
      const x = terracePos.getX(i);
      const y = terracePos.getY(i);
      const z = terracePos.getZ(i);
      const angleBias = Math.atan2(z, x);
      const frontCut = Math.cos(angleBias - 0.6) > 0.55 ? 0.72 : 1.0;
      terracePos.setXYZ(
        i,
        x * frontCut + z * 0.05,
        y * (1.0 + Math.abs(x) * 0.08),
        z * (0.84 + Math.abs(x) * 0.06) - x * 0.06
      );
    }
    terracePos.needsUpdate = true;
    terraceGeometry.computeVertexNormals();
    terraceGeometry.computeBoundingSphere();
    MYTHIC_ABSENT_CORE_SANCTUM_CACHE.terraceGeometry = terraceGeometry;
    MYTHIC_ABSENT_CORE_SANCTUM_CACHE.terraceEdgesGeometry = safeCreateEdgesGeometry(terraceGeometry, 10);

    const braceCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.46, -0.22, 0.14),
      new THREE.Vector3(-0.32, -0.02, 0.22),
      new THREE.Vector3(-0.14, 0.22, 0.18),
      new THREE.Vector3(0.02, 0.48, 0.08),
      new THREE.Vector3(0.16, 0.72, -0.02)
    ]);
    const braceGeometry = new THREE.TubeGeometry(braceCurve, 28, 0.018, 5, false);
    braceGeometry.computeBoundingSphere();
    MYTHIC_ABSENT_CORE_SANCTUM_CACHE.braceGeometry = braceGeometry;
    MYTHIC_ABSENT_CORE_SANCTUM_CACHE.braceEdgesGeometry = safeCreateEdgesGeometry(braceGeometry, 16);

    const dustPositions = [];
    const dustCount = 34;
    for (let i = 0; i < dustCount; i++) {
      const t = i / dustCount;
      const angle = t * Math.PI * 2.12;
      const radius = 0.44 + Math.sin(i * 1.18) * 0.1 + t * 0.3;
      dustPositions.push(
        Math.cos(angle) * radius * 0.76,
        -0.18 + t * 1.1 + Math.sin(i * 0.92) * 0.08,
        Math.sin(angle) * radius * 0.48
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();
    MYTHIC_ABSENT_CORE_SANCTUM_CACHE.dustGeometry = dustGeometry;

    const haloPositions = [];
    const haloCount = 22;
    for (let i = 0; i < haloCount; i++) {
      const t = i / (haloCount - 1);
      const angle = -Math.PI * 0.18 + t * Math.PI * 1.36;
      haloPositions.push(
        Math.cos(angle) * 0.78,
        0.14 + Math.sin(angle * 1.24) * 0.18,
        Math.sin(angle) * 0.46
      );
    }
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute(haloPositions, 3));
    haloGeometry.computeBoundingSphere();
    MYTHIC_ABSENT_CORE_SANCTUM_CACHE.haloGeometry = haloGeometry;
  }

  return MYTHIC_ABSENT_CORE_SANCTUM_CACHE;
}

function _getMythicAbsentCoreSanctumMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0xffdd00;
  if (MYTHIC_ABSENT_CORE_SANCTUM_MATERIALS.has(colorHex)) {
    return MYTHIC_ABSENT_CORE_SANCTUM_MATERIALS.get(colorHex);
  }

  const mythicColor = new THREE.Color(colorHex);
  const relicBronze = mythicColor.clone().lerp(new THREE.Color(0x66461f), 0.34);
  const sanctumIvory = new THREE.Color(0xfff1d6).lerp(mythicColor, 0.1);
  const spectral = new THREE.Color(0xe1f8ff);

  const coreMat = new THREE.MeshStandardMaterial({
    color: mythicColor.clone().lerp(new THREE.Color(0xffffff), 0.08),
    metalness: 0.7,
    roughness: 0.18,
    emissive: mythicColor,
    emissiveIntensity: 0.34,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: sanctumIvory.clone().lerp(spectral, 0.1),
    transparent: true,
    opacity: 0.66,
    depthWrite: false
  });

  const voidMat = new THREE.MeshBasicMaterial({
    color: 0x08070c,
    transparent: true,
    opacity: 0.92,
    depthWrite: false
  });

  const shardMat = new THREE.MeshStandardMaterial({
    color: relicBronze.clone().lerp(sanctumIvory, 0.18),
    metalness: 0.58,
    roughness: 0.28,
    emissive: mythicColor,
    emissiveIntensity: 0.12,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seedMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x110d10),
    metalness: 0.3,
    roughness: 0.42,
    emissive: spectral.clone().multiplyScalar(0.18),
    emissiveIntensity: 0.24,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    depthTest: true
  });

  const terraceMatA = new THREE.MeshStandardMaterial({
    color: relicBronze.clone().lerp(mythicColor, 0.1),
    metalness: 0.52,
    roughness: 0.34,
    emissive: mythicColor,
    emissiveIntensity: 0.12,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const terraceMatB = new THREE.MeshStandardMaterial({
    color: relicBronze.clone().lerp(new THREE.Color(0x3b2511), 0.16),
    metalness: 0.48,
    roughness: 0.38,
    emissive: mythicColor,
    emissiveIntensity: 0.09,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const braceMat = new THREE.MeshBasicMaterial({
    color: sanctumIvory.clone().lerp(mythicColor, 0.16),
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  });

  const braceEdgeMat = new THREE.LineBasicMaterial({
    color: spectral.clone().lerp(sanctumIvory, 0.28),
    transparent: true,
    opacity: 0.28,
    depthWrite: false
  });

  const dustMat = new THREE.PointsMaterial({
    color: sanctumIvory,
    size: 0.046,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    sizeAttenuation: true
  });

  const haloMat = new THREE.PointsMaterial({
    color: spectral.clone().lerp(sanctumIvory, 0.22),
    size: 0.042,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = {
    coreMat,
    edgeMat,
    voidMat,
    shardMat,
    seedMat,
    terraceMatA,
    terraceMatB,
    braceMat,
    braceEdgeMat,
    dustMat,
    haloMat
  };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  MYTHIC_ABSENT_CORE_SANCTUM_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getMythicCollapsedCrownGeometries() {
  if (!MYTHIC_COLLAPSED_CROWN_CACHE.coreGeometry) {
    const coreGeometry = new THREE.DodecahedronGeometry(0.24, 0);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const inwardPress = z > 0.02 ? 0.74 : 1.0;
      corePos.setXYZ(
        i,
        x * (0.94 + Math.max(0, y) * 0.18) + z * -0.06,
        y * (1.02 + Math.abs(x) * 0.12) - Math.max(0, z) * 0.04,
        z * (0.78 + Math.abs(x) * 0.08) * inwardPress - x * 0.04
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    MYTHIC_COLLAPSED_CROWN_CACHE.coreGeometry = coreGeometry;
    MYTHIC_COLLAPSED_CROWN_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 10);

    const seamGeometry = new THREE.BoxGeometry(0.1, 0.34, 0.16, 1, 1, 1);
    const seamPos = seamGeometry.attributes.position;
    for (let i = 0; i < seamPos.count; i++) {
      const x = seamPos.getX(i);
      const y = seamPos.getY(i);
      const z = seamPos.getZ(i);
      seamPos.setXYZ(
        i,
        x * (0.48 + Math.abs(y) * 0.7) + Math.sin(y * 5.2) * 0.016,
        y * 0.94 + Math.abs(x) * 0.03,
        z * (0.76 + Math.max(0, y) * 0.22) - x * 0.18
      );
    }
    seamPos.needsUpdate = true;
    seamGeometry.computeVertexNormals();
    seamGeometry.computeBoundingSphere();
    MYTHIC_COLLAPSED_CROWN_CACHE.seamGeometry = seamGeometry;

    const seedGeometry = new THREE.OctahedronGeometry(0.074, 0);
    seedGeometry.scale(0.84, 1.24, 0.72);
    seedGeometry.rotateZ(Math.PI * 0.16);
    seedGeometry.computeBoundingSphere();
    MYTHIC_COLLAPSED_CROWN_CACHE.seedGeometry = seedGeometry;

    const tineGeometry = new THREE.CylinderGeometry(0.028, 0.11, 0.74, 5, 4, false);
    const tinePos = tineGeometry.attributes.position;
    for (let i = 0; i < tinePos.count; i++) {
      const x = tinePos.getX(i);
      const y = tinePos.getY(i);
      const z = tinePos.getZ(i);
      const yNorm = (y + 0.37) / 0.74;
      const flare = 0.34 + yNorm * 1.08;
      tinePos.setXYZ(
        i,
        x * flare + Math.sin(yNorm * Math.PI) * 0.04,
        y * 1.08,
        z * (0.2 + yNorm * 0.34) - Math.cos(yNorm * Math.PI) * 0.03
      );
    }
    tinePos.needsUpdate = true;
    tineGeometry.translate(0, 0.24, 0);
    tineGeometry.computeVertexNormals();
    tineGeometry.computeBoundingSphere();
    MYTHIC_COLLAPSED_CROWN_CACHE.tineGeometry = tineGeometry;
    MYTHIC_COLLAPSED_CROWN_CACHE.tineEdgesGeometry = safeCreateEdgesGeometry(tineGeometry, 14);

    const crescentCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.54, -0.16, 0.08),
      new THREE.Vector3(-0.34, -0.02, 0.18),
      new THREE.Vector3(-0.08, 0.06, 0.2),
      new THREE.Vector3(0.18, 0.0, 0.12),
      new THREE.Vector3(0.38, -0.1, -0.02)
    ]);
    const crescentGeometry = new THREE.TubeGeometry(crescentCurve, 32, 0.03, 5, false);
    crescentGeometry.computeBoundingSphere();
    MYTHIC_COLLAPSED_CROWN_CACHE.crescentGeometry = crescentGeometry;
    MYTHIC_COLLAPSED_CROWN_CACHE.crescentEdgesGeometry = safeCreateEdgesGeometry(crescentGeometry, 18);

    const braceCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.38, -0.24, 0.1),
      new THREE.Vector3(-0.22, -0.02, 0.08),
      new THREE.Vector3(-0.06, 0.22, 0.02),
      new THREE.Vector3(0.06, 0.46, -0.04),
      new THREE.Vector3(0.14, 0.7, -0.08)
    ]);
    const braceGeometry = new THREE.TubeGeometry(braceCurve, 28, 0.016, 5, false);
    braceGeometry.computeBoundingSphere();
    MYTHIC_COLLAPSED_CROWN_CACHE.braceGeometry = braceGeometry;
    MYTHIC_COLLAPSED_CROWN_CACHE.braceEdgesGeometry = safeCreateEdgesGeometry(braceGeometry, 16);

    const remnantGeometry = new THREE.TetrahedronGeometry(0.14, 0);
    const remnantPos = remnantGeometry.attributes.position;
    for (let i = 0; i < remnantPos.count; i++) {
      const x = remnantPos.getX(i);
      const y = remnantPos.getY(i);
      const z = remnantPos.getZ(i);
      remnantPos.setXYZ(
        i,
        x * (0.76 + Math.max(0, y) * 0.7),
        y * 1.12 + Math.abs(z) * 0.06,
        z * 0.64 - x * 0.12
      );
    }
    remnantPos.needsUpdate = true;
    remnantGeometry.computeVertexNormals();
    remnantGeometry.computeBoundingSphere();
    MYTHIC_COLLAPSED_CROWN_CACHE.remnantGeometry = remnantGeometry;
    MYTHIC_COLLAPSED_CROWN_CACHE.remnantEdgesGeometry = safeCreateEdgesGeometry(remnantGeometry, 12);

    const dustPositions = [];
    const dustCount = 30;
    for (let i = 0; i < dustCount; i++) {
      const t = i / dustCount;
      const angle = -Math.PI * 0.4 + t * Math.PI * 1.8;
      const radius = 0.48 + Math.sin(i * 0.96) * 0.08 + t * 0.18;
      dustPositions.push(
        Math.cos(angle) * radius * 0.74,
        -0.08 + t * 0.96 + Math.sin(i * 1.22) * 0.08,
        Math.sin(angle) * radius * 0.46
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();
    MYTHIC_COLLAPSED_CROWN_CACHE.dustGeometry = dustGeometry;

    const haloPositions = [];
    const haloCount = 24;
    for (let i = 0; i < haloCount; i++) {
      const t = i / (haloCount - 1);
      const angle = -Math.PI * 0.16 + t * Math.PI * 1.24;
      haloPositions.push(
        Math.cos(angle) * 0.72,
        0.12 + Math.sin(angle * 1.18) * 0.22,
        Math.sin(angle) * 0.42
      );
    }
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute(haloPositions, 3));
    haloGeometry.computeBoundingSphere();
    MYTHIC_COLLAPSED_CROWN_CACHE.haloGeometry = haloGeometry;
  }

  return MYTHIC_COLLAPSED_CROWN_CACHE;
}

function _getMythicCollapsedCrownMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0xffdd00;
  if (MYTHIC_COLLAPSED_CROWN_MATERIALS.has(colorHex)) {
    return MYTHIC_COLLAPSED_CROWN_MATERIALS.get(colorHex);
  }

  const mythicColor = new THREE.Color(colorHex);
  const relicBronze = mythicColor.clone().lerp(new THREE.Color(0x6a4721), 0.32);
  const sanctumIvory = new THREE.Color(0xfff2d8).lerp(mythicColor, 0.12);
  const spectral = new THREE.Color(0xdff8ff);

  const coreMat = new THREE.MeshStandardMaterial({
    color: mythicColor.clone().lerp(new THREE.Color(0xffffff), 0.08),
    metalness: 0.68,
    roughness: 0.16,
    emissive: mythicColor,
    emissiveIntensity: 0.36,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: sanctumIvory.clone().lerp(spectral, 0.08),
    transparent: true,
    opacity: 0.66,
    depthWrite: false
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: 0x07070c,
    transparent: true,
    opacity: 0.94,
    depthWrite: false
  });

  const seedMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x110c0f),
    metalness: 0.26,
    roughness: 0.44,
    emissive: spectral.clone().multiplyScalar(0.2),
    emissiveIntensity: 0.24,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    depthTest: true
  });

  const tineMatA = new THREE.MeshStandardMaterial({
    color: relicBronze.clone().lerp(mythicColor, 0.12),
    metalness: 0.58,
    roughness: 0.24,
    emissive: mythicColor,
    emissiveIntensity: 0.14,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const tineMatB = new THREE.MeshStandardMaterial({
    color: relicBronze.clone().lerp(new THREE.Color(0x8b6428), 0.18),
    metalness: 0.56,
    roughness: 0.28,
    emissive: mythicColor,
    emissiveIntensity: 0.12,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const crescentMat = new THREE.MeshBasicMaterial({
    color: sanctumIvory.clone().lerp(mythicColor, 0.18),
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  });

  const crescentEdgeMat = new THREE.LineBasicMaterial({
    color: spectral.clone().lerp(sanctumIvory, 0.24),
    transparent: true,
    opacity: 0.3,
    depthWrite: false
  });

  const braceMat = new THREE.MeshBasicMaterial({
    color: sanctumIvory.clone().lerp(mythicColor, 0.14),
    transparent: true,
    opacity: 0.16,
    depthWrite: false
  });

  const braceEdgeMat = new THREE.LineBasicMaterial({
    color: spectral.clone().lerp(sanctumIvory, 0.3),
    transparent: true,
    opacity: 0.26,
    depthWrite: false
  });

  const remnantMat = new THREE.MeshBasicMaterial({
    color: relicBronze.clone().lerp(sanctumIvory, 0.24),
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  });

  const dustMat = new THREE.PointsMaterial({
    color: sanctumIvory,
    size: 0.046,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    sizeAttenuation: true
  });

  const haloMat = new THREE.PointsMaterial({
    color: spectral.clone().lerp(sanctumIvory, 0.22),
    size: 0.042,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = {
    coreMat,
    edgeMat,
    seamMat,
    seedMat,
    tineMatA,
    tineMatB,
    crescentMat,
    crescentEdgeMat,
    braceMat,
    braceEdgeMat,
    remnantMat,
    dustMat,
    haloMat
  };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  MYTHIC_COLLAPSED_CROWN_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getMythicCataclysmCairnGeometries() {
  if (!MYTHIC_CATACLYSM_CAIRN_CACHE.coreGeometry) {
    const coreGeometry = new THREE.OctahedronGeometry(0.26, 0);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const inward = z > 0 ? 0.7 : 1.0;
      corePos.setXYZ(
        i,
        x * (0.92 + Math.max(0, y) * 0.22) - z * 0.08,
        y * (1.04 + Math.abs(x) * 0.14) - Math.max(0, z) * 0.06,
        z * (0.74 + Math.abs(x) * 0.08) * inward + x * 0.04
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    MYTHIC_CATACLYSM_CAIRN_CACHE.coreGeometry = coreGeometry;
    MYTHIC_CATACLYSM_CAIRN_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 10);

    const seamGeometry = new THREE.BoxGeometry(0.12, 0.36, 0.16, 1, 1, 1);
    const seamPos = seamGeometry.attributes.position;
    for (let i = 0; i < seamPos.count; i++) {
      const x = seamPos.getX(i);
      const y = seamPos.getY(i);
      const z = seamPos.getZ(i);
      seamPos.setXYZ(
        i,
        x * (0.46 + Math.abs(y) * 0.86) + Math.sin(y * 5.4) * 0.018,
        y * 0.94 + Math.abs(x) * 0.04,
        z * (0.72 + Math.max(0, y) * 0.28) - x * 0.16
      );
    }
    seamPos.needsUpdate = true;
    seamGeometry.computeVertexNormals();
    seamGeometry.computeBoundingSphere();
    MYTHIC_CATACLYSM_CAIRN_CACHE.seamGeometry = seamGeometry;

    const keystoneGeometry = new THREE.OctahedronGeometry(0.15, 0);
    keystoneGeometry.scale(0.78, 1.34, 0.7);
    keystoneGeometry.rotateZ(Math.PI * 0.14);
    keystoneGeometry.computeBoundingSphere();
    MYTHIC_CATACLYSM_CAIRN_CACHE.keystoneGeometry = keystoneGeometry;
    MYTHIC_CATACLYSM_CAIRN_CACHE.keystoneEdgesGeometry = safeCreateEdgesGeometry(keystoneGeometry, 12);

    const majorShardGeometry = new THREE.TetrahedronGeometry(0.2, 0);
    const majorShardPos = majorShardGeometry.attributes.position;
    for (let i = 0; i < majorShardPos.count; i++) {
      const x = majorShardPos.getX(i);
      const y = majorShardPos.getY(i);
      const z = majorShardPos.getZ(i);
      majorShardPos.setXYZ(
        i,
        x * (0.72 + Math.max(0, y) * 0.98),
        y * 1.22 + Math.abs(z) * 0.08,
        z * 0.62 - x * 0.16
      );
    }
    majorShardPos.needsUpdate = true;
    majorShardGeometry.computeVertexNormals();
    majorShardGeometry.computeBoundingSphere();
    MYTHIC_CATACLYSM_CAIRN_CACHE.majorShardGeometry = majorShardGeometry;
    MYTHIC_CATACLYSM_CAIRN_CACHE.majorShardEdgesGeometry = safeCreateEdgesGeometry(majorShardGeometry, 12);

    const witnessGeometry = new THREE.OctahedronGeometry(0.1, 0);
    witnessGeometry.scale(0.76, 1.08, 0.68);
    witnessGeometry.rotateX(Math.PI * 0.22);
    witnessGeometry.computeBoundingSphere();
    MYTHIC_CATACLYSM_CAIRN_CACHE.witnessGeometry = witnessGeometry;
    MYTHIC_CATACLYSM_CAIRN_CACHE.witnessEdgesGeometry = safeCreateEdgesGeometry(witnessGeometry, 12);

    const bandCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.5, -0.18, 0.12),
      new THREE.Vector3(-0.28, -0.04, 0.2),
      new THREE.Vector3(-0.06, 0.16, 0.1),
      new THREE.Vector3(0.12, 0.38, -0.02),
      new THREE.Vector3(0.3, 0.62, -0.1)
    ]);
    const bandGeometry = new THREE.TubeGeometry(bandCurve, 28, 0.018, 5, false);
    bandGeometry.computeBoundingSphere();
    MYTHIC_CATACLYSM_CAIRN_CACHE.bandGeometry = bandGeometry;
    MYTHIC_CATACLYSM_CAIRN_CACHE.bandEdgesGeometry = safeCreateEdgesGeometry(bandGeometry, 16);

    const dustPositions = [];
    const dustCount = 34;
    for (let i = 0; i < dustCount; i++) {
      const t = i / dustCount;
      const angle = -Math.PI * 0.42 + t * Math.PI * 1.94;
      const radius = 0.4 + Math.sin(i * 1.02) * 0.09 + t * 0.28;
      dustPositions.push(
        Math.cos(angle) * radius * 0.76,
        -0.16 + t * 1.04 + Math.sin(i * 1.18) * 0.08,
        Math.sin(angle) * radius * 0.44
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();
    MYTHIC_CATACLYSM_CAIRN_CACHE.dustGeometry = dustGeometry;

    const haloPositions = [];
    const haloCount = 22;
    for (let i = 0; i < haloCount; i++) {
      const t = i / (haloCount - 1);
      const angle = -Math.PI * 0.2 + t * Math.PI * 1.18;
      haloPositions.push(
        Math.cos(angle) * 0.68,
        0.08 + Math.sin(angle * 1.2) * 0.2,
        Math.sin(angle) * 0.38
      );
    }
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute(haloPositions, 3));
    haloGeometry.computeBoundingSphere();
    MYTHIC_CATACLYSM_CAIRN_CACHE.haloGeometry = haloGeometry;
  }

  return MYTHIC_CATACLYSM_CAIRN_CACHE;
}

function _getMythicCataclysmCairnMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0xffdd00;
  if (MYTHIC_CATACLYSM_CAIRN_MATERIALS.has(colorHex)) {
    return MYTHIC_CATACLYSM_CAIRN_MATERIALS.get(colorHex);
  }

  const mythicColor = new THREE.Color(colorHex);
  const relicBronze = mythicColor.clone().lerp(new THREE.Color(0x65441d), 0.34);
  const sanctumIvory = new THREE.Color(0xfff2d8).lerp(mythicColor, 0.1);
  const spectral = new THREE.Color(0xdff8ff);

  const coreMat = new THREE.MeshStandardMaterial({
    color: mythicColor.clone().lerp(new THREE.Color(0xffffff), 0.08),
    metalness: 0.7,
    roughness: 0.16,
    emissive: mythicColor,
    emissiveIntensity: 0.36,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: sanctumIvory.clone().lerp(spectral, 0.08),
    transparent: true,
    opacity: 0.68,
    depthWrite: false
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: 0x07070c,
    transparent: true,
    opacity: 0.94,
    depthWrite: false
  });

  const keystoneMat = new THREE.MeshStandardMaterial({
    color: relicBronze.clone().lerp(sanctumIvory, 0.18),
    metalness: 0.62,
    roughness: 0.22,
    emissive: mythicColor,
    emissiveIntensity: 0.16,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const shardMatA = new THREE.MeshStandardMaterial({
    color: relicBronze.clone().lerp(mythicColor, 0.12),
    metalness: 0.58,
    roughness: 0.26,
    emissive: mythicColor,
    emissiveIntensity: 0.12,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const shardMatB = new THREE.MeshStandardMaterial({
    color: relicBronze.clone().lerp(new THREE.Color(0x8d6528), 0.18),
    metalness: 0.56,
    roughness: 0.3,
    emissive: mythicColor,
    emissiveIntensity: 0.1,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const witnessMat = new THREE.MeshBasicMaterial({
    color: sanctumIvory.clone().lerp(mythicColor, 0.18),
    transparent: true,
    opacity: 0.26,
    depthWrite: false
  });

  const bandMat = new THREE.MeshBasicMaterial({
    color: sanctumIvory.clone().lerp(mythicColor, 0.14),
    transparent: true,
    opacity: 0.16,
    depthWrite: false
  });

  const bandEdgeMat = new THREE.LineBasicMaterial({
    color: spectral.clone().lerp(sanctumIvory, 0.28),
    transparent: true,
    opacity: 0.28,
    depthWrite: false
  });

  const dustMat = new THREE.PointsMaterial({
    color: sanctumIvory,
    size: 0.046,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    sizeAttenuation: true
  });

  const haloMat = new THREE.PointsMaterial({
    color: spectral.clone().lerp(sanctumIvory, 0.22),
    size: 0.042,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = {
    coreMat,
    edgeMat,
    seamMat,
    keystoneMat,
    shardMatA,
    shardMatB,
    witnessMat,
    bandMat,
    bandEdgeMat,
    dustMat,
    haloMat
  };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  MYTHIC_CATACLYSM_CAIRN_MATERIALS.set(colorHex, mats);
  return mats;
}

// ---------- ERROR v2 helpers ----------
function _getErrorV2Geometries() {
  if (!ERROR_V2_CACHE.coreGeometry) {
    ERROR_V2_CACHE.coreGeometry = new THREE.TetrahedronGeometry(0.55, 1);
    ERROR_V2_CACHE.coreGeometry.computeBoundingSphere();
    ERROR_V2_CACHE.edgesGeometry = new THREE.EdgesGeometry(ERROR_V2_CACHE.coreGeometry, 15);
    ERROR_V2_CACHE.ringGeometry = new THREE.TorusGeometry(0.95, 0.04, 12, 96);

    const baseCage = new THREE.IcosahedronGeometry(0.9, 0);
    const pos = baseCage.attributes.position;
    const range = 0.08;
    for (let i = 0; i < pos.count; i++) {
      const ox = Math.sin(i * 12.9898 + 0.1) * range;
      const oy = Math.sin(i * 26.703 + 0.5) * range;
      const oz = Math.sin(i * 5.913 + 1.3) * range;
      pos.setXYZ(i, pos.getX(i) + ox, pos.getY(i) + oy, pos.getZ(i) + oz);
    }
    pos.needsUpdate = true;
    baseCage.computeVertexNormals();
    ERROR_V2_CACHE.cageGeometry = baseCage;
    ERROR_V2_CACHE.cageEdgesGeometry = new THREE.EdgesGeometry(baseCage, 8);

    ERROR_V2_CACHE.voidGeometry = new THREE.SphereGeometry(0.22, 12, 10);

    const haloCount = 90;
    const haloPositions = [];
    for (let i = 0; i < haloCount; i++) {
      const a = (i / haloCount) * Math.PI * 2;
      haloPositions.push(Math.cos(a) * 1.32, Math.sin(a) * 1.32, 0);
    }
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute(haloPositions, 3));
    ERROR_V2_CACHE.haloGeometry = haloGeometry;
  }
  return ERROR_V2_CACHE;
}

function _getErrorV2Materials(color) {
  const colorHex = typeof color === 'number' ? color : 0xff3333;
  if (ERROR_V2_MATERIALS.has(colorHex)) return ERROR_V2_MATERIALS.get(colorHex);

  const coreMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.25,
    roughness: 0.4,
    emissive: 0x992255,
    emissiveIntensity: 0.35
  });

  const edgesMat = new THREE.LineBasicMaterial({
    color: 0xff44aa,
    transparent: true,
    opacity: 0.9,
    depthWrite: true
  });

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xcc66ff,
    transparent: true,
    opacity: 0.6,
    depthWrite: false
  });

  const frameMat = new THREE.LineBasicMaterial({
    color: 0x66ccff,
    transparent: true,
    opacity: 0.7,
    depthWrite: false
  });

  const voidMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.95,
    depthWrite: false
  });

  const haloMat = new THREE.PointsMaterial({
    color: 0x66ccff,
    size: 0.05,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    sizeAttenuation: true
  });

  const shadowMat = coreMat.clone();
  shadowMat.emissiveIntensity = 0.12;
  shadowMat.opacity = 0.8;
  shadowMat.transparent = true;

  const mats = { coreMat, edgesMat, ringMat, frameMat, voidMat, haloMat, shadowMat };
  ERROR_V2_MATERIALS.set(colorHex, mats);
  return mats;
}

// ---------- STORAGE v2 helpers ----------
function _getStorageV2Geometries() {
  if (!STORAGE_V2_CACHE.columnGeometry) {
    STORAGE_V2_CACHE.columnGeometry = new THREE.CylinderGeometry(0.35, 0.35, 2.8, 18, 1, false);
    STORAGE_V2_CACHE.ringGeometry = new THREE.TorusGeometry(0.48, 0.045, 10, 64);
    STORAGE_V2_CACHE.bandGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 12, 1, true);
    STORAGE_V2_CACHE.sliceGeometry = new THREE.BoxGeometry(0.14, 0.04, 0.36);

    const haloPositions = [];
    const haloCount = 96;
    for (let i = 0; i < haloCount; i++) {
      const a = (i / haloCount) * Math.PI * 2;
      haloPositions.push(Math.cos(a) * 0.7, 0, Math.sin(a) * 0.7);
    }
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute(haloPositions, 3));
    STORAGE_V2_CACHE.haloGeometry = haloGeometry;

    const spineGeometry = new THREE.BufferGeometry();
    spineGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, -1.4, 0, 0, 1.4, 0], 3));
    STORAGE_V2_CACHE.spineGeometry = spineGeometry;

    const timelinePositions = [];
    const timelineCount = 36;
    for (let i = 0; i < timelineCount; i++) {
      const y = -1.25 + (i / (timelineCount - 1)) * 2.5;
      timelinePositions.push(0, y, 0);
    }
    const timelineGeometry = new THREE.BufferGeometry();
    timelineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(timelinePositions, 3));
    STORAGE_V2_CACHE.timelineGeometry = timelineGeometry;
  }
  return STORAGE_V2_CACHE;
}

function _getStorageV2Materials(color) {
  const colorHex = typeof color === 'number' ? color : 0x88ccff;
  if (STORAGE_V2_MATERIALS.has(colorHex)) return STORAGE_V2_MATERIALS.get(colorHex);

  const columnMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.25,
    roughness: 0.45,
    emissive: 0x66bbee,
    emissiveIntensity: 0.3
  });

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x99e0ff,
    transparent: true,
    opacity: 0.6,
    depthWrite: false
  });

  const bandMat = new THREE.MeshBasicMaterial({
    color: 0xb3ecff,
    transparent: true,
    opacity: 0.4,
    depthWrite: false
  });

  const sliceMat = new THREE.MeshBasicMaterial({
    color: 0xc4f4ff,
    transparent: true,
    opacity: 0.5,
    depthWrite: false
  });

  const spineMat = new THREE.LineBasicMaterial({
    color: 0xa9e8ff,
    transparent: true,
    opacity: 0.85
  });

  const timelineMat = new THREE.PointsMaterial({
    color: 0xa9e8ff,
    size: 0.05,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = { columnMat, ringMat, bandMat, sliceMat, spineMat, timelineMat };
  STORAGE_V2_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getStorageCathedralGeometries() {
  if (!STORAGE_CATHEDRAL_CACHE.coreGeometry) {
    const coreGeometry = new THREE.DodecahedronGeometry(0.48, 0);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const yWeight = Math.min(1.0, Math.abs(y) / 0.48);
      corePos.setXYZ(
        i,
        x * (0.88 + yWeight * 0.14),
        y * 1.02 + Math.sign(y || 1) * 0.03 * yWeight,
        z * (0.82 + Math.abs(x) * 0.12)
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    STORAGE_CATHEDRAL_CACHE.coreGeometry = coreGeometry;
    STORAGE_CATHEDRAL_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 14);

    const slabGeometry = new THREE.CylinderGeometry(0.62, 0.68, 0.12, 6, 1, false);
    const slabPos = slabGeometry.attributes.position;
    for (let i = 0; i < slabPos.count; i++) {
      const x = slabPos.getX(i);
      const y = slabPos.getY(i);
      const z = slabPos.getZ(i);
      if (y > 0) {
        slabPos.setXYZ(i, x * 0.92 + z * 0.04, y, z * 1.08 - x * 0.02);
      } else {
        slabPos.setXYZ(i, x * 1.04 + z * 0.02, y, z * 0.94 - x * 0.03);
      }
    }
    slabPos.needsUpdate = true;
    slabGeometry.computeVertexNormals();
    slabGeometry.computeBoundingSphere();
    STORAGE_CATHEDRAL_CACHE.slabGeometry = slabGeometry;

    const buttressGeometry = new THREE.BoxGeometry(0.18, 1.24, 0.42, 1, 1, 1);
    const buttressPos = buttressGeometry.attributes.position;
    for (let i = 0; i < buttressPos.count; i++) {
      const x = buttressPos.getX(i);
      const y = buttressPos.getY(i);
      const z = buttressPos.getZ(i);
      const taper = y > 0 ? 0.62 : 1.08;
      const depthScale = y > 0 ? 0.72 : 0.96;
      buttressPos.setXYZ(
        i,
        x * taper + Math.sign(y || 1) * 0.018,
        y * 1.02,
        z * depthScale + x * 0.06
      );
    }
    buttressPos.needsUpdate = true;
    buttressGeometry.computeVertexNormals();
    buttressGeometry.computeBoundingSphere();
    STORAGE_CATHEDRAL_CACHE.buttressGeometry = buttressGeometry;
    STORAGE_CATHEDRAL_CACHE.buttressEdgesGeometry = safeCreateEdgesGeometry(buttressGeometry, 18);

    const seamGeometry = new THREE.BoxGeometry(0.08, 0.78, 0.18, 1, 1, 1);
    seamGeometry.computeBoundingSphere();
    STORAGE_CATHEDRAL_CACHE.seamGeometry = seamGeometry;

    const dustPositions = [];
    const dustCount = 44;
    for (let i = 0; i < dustCount; i++) {
      const t = i / dustCount;
      const angle = t * Math.PI * 2.0;
      const radius = 0.7 + Math.sin(i * 1.73) * 0.12;
      dustPositions.push(
        Math.cos(angle) * radius,
        -0.44 + t * 0.98 + Math.sin(i * 0.91) * 0.05,
        Math.sin(angle) * (0.46 + Math.cos(i * 1.29) * 0.1)
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();
    STORAGE_CATHEDRAL_CACHE.dustGeometry = dustGeometry;

    const timelinePositions = [];
    const timelineCount = 16;
    for (let i = 0; i < timelineCount; i++) {
      const t = i / Math.max(1, timelineCount - 1);
      const phase = t * Math.PI * 1.45;
      const y = -0.62 + t * 1.24;
      timelinePositions.push(
        0.24 + Math.sin(phase) * 0.05,
        y,
        Math.cos(phase) * 0.12
      );
      timelinePositions.push(
        -0.28 + Math.cos(phase * 0.82) * 0.05,
        y * 0.92,
        -Math.sin(phase) * 0.1
      );
    }
    const timelineGeometry = new THREE.BufferGeometry();
    timelineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(timelinePositions, 3));
    timelineGeometry.computeBoundingSphere();
    STORAGE_CATHEDRAL_CACHE.timelineGeometry = timelineGeometry;
  }

  return STORAGE_CATHEDRAL_CACHE;
}

function _getStorageCathedralMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0x88ccff;
  if (STORAGE_CATHEDRAL_MATERIALS.has(colorHex)) {
    return STORAGE_CATHEDRAL_MATERIALS.get(colorHex);
  }

  const storageColor = new THREE.Color(colorHex);
  const silverColor = new THREE.Color(0xeaf8ff);
  const archiveDark = new THREE.Color(0x182129).lerp(storageColor, 0.18);
  const coreColor = archiveDark.clone().lerp(silverColor, 0.18);
  const slabColor = archiveDark.clone().lerp(storageColor, 0.3);
  const buttressColor = archiveDark.clone().lerp(silverColor, 0.1);

  const coreMat = new THREE.MeshStandardMaterial({
    color: coreColor,
    emissive: storageColor.clone().lerp(silverColor, 0.08),
    emissiveIntensity: 0.24,
    metalness: 0.74,
    roughness: 0.3,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const slabMat = new THREE.MeshStandardMaterial({
    color: slabColor,
    emissive: storageColor.clone().multiplyScalar(0.6),
    emissiveIntensity: 0.15,
    metalness: 0.62,
    roughness: 0.36,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const buttressMat = new THREE.MeshStandardMaterial({
    color: buttressColor,
    emissive: storageColor.clone().multiplyScalar(0.42),
    emissiveIntensity: 0.12,
    metalness: 0.68,
    roughness: 0.38,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: silverColor.clone().lerp(storageColor, 0.26),
    transparent: true,
    opacity: 0.66,
    depthWrite: true
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: 0x05080c,
    transparent: true,
    opacity: 0.94,
    depthWrite: false
  });

  const dustMat = new THREE.PointsMaterial({
    color: 0xd8f6ff,
    size: 0.04,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    sizeAttenuation: true
  });

  const timelineMat = new THREE.PointsMaterial({
    color: 0xbcecff,
    size: 0.046,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = { coreMat, slabMat, buttressMat, edgeMat, seamMat, dustMat, timelineMat };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }
  STORAGE_CATHEDRAL_MATERIALS.set(colorHex, mats);
  return mats;
}

// ---------- INPUT v2 helpers ----------
function _getInputV2Geometries() {
  if (!INPUT_V2_CACHE.coreGeometry) {
    INPUT_V2_CACHE.coreGeometry = new THREE.IcosahedronGeometry(0.45, 1);
    INPUT_V2_CACHE.coreGeometry.computeBoundingSphere();
    INPUT_V2_CACHE.edgesGeometry = new THREE.EdgesGeometry(INPUT_V2_CACHE.coreGeometry, 12);
    INPUT_V2_CACHE.arrowGeometry = new THREE.ConeGeometry(0.07, 0.28, 8);
    INPUT_V2_CACHE.ringGeometry = new THREE.TorusGeometry(0.65, 0.06, 10, 80);
    INPUT_V2_CACHE.streamGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.52);
    INPUT_V2_CACHE.haloGeometry = new THREE.RingGeometry(0.6, 0.75, 48);

    // Vector lines: 5 axes with slight offsets
    const vecPositions = [];
    const lineEnds = [
      [0, -1.1, 0, 0, 1.1, 0],
      [0.4, -1.0, -0.2, -0.4, 1.0, 0.2],
      [-0.35, -1.2, 0.25, 0.35, 1.2, -0.25],
      [0.2, -1.0, 0.6, -0.2, 1.0, -0.6],
      [-0.55, -0.9, -0.1, 0.55, 0.9, 0.1]
    ];
    lineEnds.forEach(p => vecPositions.push(...p));
    const vecGeo = new THREE.BufferGeometry();
    vecGeo.setAttribute('position', new THREE.Float32BufferAttribute(vecPositions, 3));
    INPUT_V2_CACHE.vectorGeometry = vecGeo;

    // Entry particles: biased hemisphere (x > 0)
    const particlePositions = [];
    const particleCount = 120;
    for (let i = 0; i < particleCount; i++) {
      const r = 0.85 + Math.random() * 0.3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.6; // hemisphere cap
      const x = Math.cos(theta) * Math.sin(phi) * r + 0.35;
      const y = (Math.random() - 0.5) * 0.6;
      const z = Math.sin(theta) * Math.sin(phi) * r;
      particlePositions.push(x, y, z);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
    INPUT_V2_CACHE.particlesGeometry = particleGeo;
  }
  return INPUT_V2_CACHE;
}

function _getInputV2Materials(color) {
  const colorHex = typeof color === 'number' ? color : 0x00ddff;
  if (INPUT_V2_MATERIALS.has(colorHex)) return INPUT_V2_MATERIALS.get(colorHex);

  const coreMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.6,
    roughness: 0.2,
    emissive: colorHex,
    emissiveIntensity: 0.5
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.55
  });

  const neonMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.6,
    depthWrite: false
  });

  const streamMat = new THREE.MeshBasicMaterial({
    color: 0x66f0ff,
    transparent: true,
    opacity: 0.5,
    depthWrite: false
  });

  const vectorMat = new THREE.LineBasicMaterial({
    color: 0x99ffff,
    transparent: true,
    opacity: 0.7
  });

  const particleMat = new THREE.PointsMaterial({
    color: 0x99ffff,
    size: 0.05,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = { coreMat, edgeMat, neonMat, streamMat, vectorMat, particleMat };
  INPUT_V2_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getInputGatewayReliquaryGeometries() {
  if (!INPUT_GATEWAY_RELIQUARY_CACHE.apertureGeometry) {
    const apertureGeometry = new THREE.CylinderGeometry(0.08, 0.24, 0.92, 4, 1, false);
    const aperturePos = apertureGeometry.attributes.position;
    for (let i = 0; i < aperturePos.count; i++) {
      const x = aperturePos.getX(i);
      const y = aperturePos.getY(i);
      const z = aperturePos.getZ(i);
      const topWeight = y > 0 ? 1.0 : 0.0;
      aperturePos.setXYZ(
        i,
        x * (0.78 + topWeight * 0.24) + z * 0.08,
        y * 1.02,
        z * (0.72 + topWeight * 0.18) - x * 0.05
      );
    }
    aperturePos.needsUpdate = true;
    apertureGeometry.computeVertexNormals();
    apertureGeometry.computeBoundingSphere();
    INPUT_GATEWAY_RELIQUARY_CACHE.apertureGeometry = apertureGeometry;
    INPUT_GATEWAY_RELIQUARY_CACHE.apertureEdgesGeometry = safeCreateEdgesGeometry(apertureGeometry, 12);

    const lensGeometry = new THREE.IcosahedronGeometry(0.24, 1);
    lensGeometry.scale(0.84, 1.18, 0.78);
    lensGeometry.computeBoundingSphere();
    INPUT_GATEWAY_RELIQUARY_CACHE.lensGeometry = lensGeometry;
    INPUT_GATEWAY_RELIQUARY_CACHE.lensEdgesGeometry = safeCreateEdgesGeometry(lensGeometry, 12);

    const seamGeometry = new THREE.BoxGeometry(0.07, 0.74, 0.16, 1, 1, 1);
    seamGeometry.computeBoundingSphere();
    INPUT_GATEWAY_RELIQUARY_CACHE.seamGeometry = seamGeometry;

    const phaseGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.34, 1, 1, 1);
    const phasePos = phaseGeometry.attributes.position;
    for (let i = 0; i < phasePos.count; i++) {
      const x = phasePos.getX(i);
      const y = phasePos.getY(i);
      const z = phasePos.getZ(i);
      phasePos.setXYZ(
        i,
        x * (1.0 + Math.sign(z || 1) * 0.18),
        y * (0.9 + Math.abs(z) * 0.45),
        z * 1.04 + x * 0.06
      );
    }
    phasePos.needsUpdate = true;
    phaseGeometry.computeVertexNormals();
    phaseGeometry.computeBoundingSphere();
    INPUT_GATEWAY_RELIQUARY_CACHE.phaseGeometry = phaseGeometry;

    const railSegments = [
      new THREE.Vector3(-0.28, 0.14, 0.94), new THREE.Vector3(-0.08, 0.04, 0.18),
      new THREE.Vector3(0.28, -0.14, 0.88), new THREE.Vector3(0.1, -0.02, 0.12),
      new THREE.Vector3(0.06, 0.3, 0.78), new THREE.Vector3(0.02, 0.12, 0.16)
    ];
    const railGeometry = new THREE.BufferGeometry().setFromPoints(railSegments);
    railGeometry.computeBoundingSphere();
    INPUT_GATEWAY_RELIQUARY_CACHE.railGeometry = railGeometry;

    const haloGeometry = new THREE.RingGeometry(0.78, 0.94, 56);
    haloGeometry.rotateX(Math.PI / 2);
    haloGeometry.computeBoundingSphere();
    INPUT_GATEWAY_RELIQUARY_CACHE.haloGeometry = haloGeometry;

    const particlePositions = [];
    const particleCount = 48;
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const angle = t * Math.PI * 2;
      const radius = 0.84 - t * 0.26 + Math.sin(i * 1.32) * 0.05;
      particlePositions.push(
        Math.cos(angle) * radius,
        -0.22 + Math.sin(i * 0.84) * 0.26,
        0.36 + Math.sin(angle * 1.8) * 0.16 + Math.cos(i * 0.72) * 0.08
      );
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
    particleGeometry.computeBoundingSphere();
    INPUT_GATEWAY_RELIQUARY_CACHE.particleGeometry = particleGeometry;
  }

  return INPUT_GATEWAY_RELIQUARY_CACHE;
}

function _getInputGatewayReliquaryMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0x00ddff;
  if (INPUT_GATEWAY_RELIQUARY_MATERIALS.has(colorHex)) {
    return INPUT_GATEWAY_RELIQUARY_MATERIALS.get(colorHex);
  }

  const inputColor = new THREE.Color(colorHex);
  const brightCyan = inputColor.clone().lerp(new THREE.Color(0xffffff), 0.34);
  const deepCyan = inputColor.clone().lerp(new THREE.Color(0x031228), 0.36);
  const paleCyan = new THREE.Color(0xdafcff);

  const apertureMat = new THREE.MeshStandardMaterial({
    color: deepCyan.clone().lerp(brightCyan, 0.12),
    emissive: inputColor.clone().multiplyScalar(0.56),
    emissiveIntensity: 0.16,
    metalness: 0.72,
    roughness: 0.3,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const lensMat = new THREE.MeshPhysicalMaterial({
    color: brightCyan,
    emissive: new THREE.Color(0x88f7ff),
    emissiveIntensity: 0.68,
    metalness: 0.84,
    roughness: 0.08,
    transmission: 0,
    thickness: 0.16,
    ior: 1.42,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: 0x02070f,
    transparent: true,
    opacity: 0.94,
    depthWrite: false
  });

  const phaseMat = new THREE.MeshBasicMaterial({
    color: brightCyan.clone().lerp(new THREE.Color(0x72f1ff), 0.3),
    transparent: true,
    opacity: 0.34,
    depthWrite: false
  });

  const lineMat = new THREE.LineBasicMaterial({
    color: paleCyan,
    transparent: true,
    opacity: 0.72,
    depthWrite: false
  });

  const haloMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xc9fbff),
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  });

  const particleMat = new THREE.PointsMaterial({
    color: new THREE.Color(0xb9f8ff),
    size: 0.044,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = { apertureMat, lensMat, seamMat, phaseMat, lineMat, haloMat, particleMat };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  INPUT_GATEWAY_RELIQUARY_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getInputIncomingReliquaryGeometries() {
  if (!INPUT_INCOMING_RELIQUARY_CACHE.coreGeometry) {
    const coreGeometry = new THREE.OctahedronGeometry(0.23, 1);
    coreGeometry.scale(0.96, 1.12, 0.96);
    coreGeometry.computeBoundingSphere();
    INPUT_INCOMING_RELIQUARY_CACHE.coreGeometry = coreGeometry;
    INPUT_INCOMING_RELIQUARY_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 12);

    const seedGeometry = new THREE.IcosahedronGeometry(0.14, 0);
    seedGeometry.scale(0.84, 1.15, 0.84);
    seedGeometry.computeBoundingSphere();
    INPUT_INCOMING_RELIQUARY_CACHE.seedGeometry = seedGeometry;
    INPUT_INCOMING_RELIQUARY_CACHE.seedEdgesGeometry = safeCreateEdgesGeometry(seedGeometry, 10);

    const wingGeometry = new THREE.CylinderGeometry(0.09, 0.24, 0.82, 4, 1, false);
    wingGeometry.rotateZ(Math.PI / 2);
    wingGeometry.translate(0.18, 0, 0);
    wingGeometry.computeBoundingSphere();
    INPUT_INCOMING_RELIQUARY_CACHE.wingGeometry = wingGeometry;
    INPUT_INCOMING_RELIQUARY_CACHE.wingEdgesGeometry = safeCreateEdgesGeometry(wingGeometry, 10);

    const haloGeometry = new THREE.RingGeometry(0.74, 0.98, 64);
    haloGeometry.rotateX(Math.PI / 2);
    haloGeometry.computeBoundingSphere();
    INPUT_INCOMING_RELIQUARY_CACHE.haloGeometry = haloGeometry;

    INPUT_INCOMING_RELIQUARY_CACHE.haloRingGeometry = new THREE.TorusGeometry(0.9, 0.03, 10, 88);
    INPUT_INCOMING_RELIQUARY_CACHE.arcGeometry = new THREE.TorusGeometry(0.66, 0.022, 10, 72, Math.PI * 0.94);
    INPUT_INCOMING_RELIQUARY_CACHE.ribbonGeometry = new THREE.CylinderGeometry(0.03, 0.05, 0.96, 6, 1, false);
    INPUT_INCOMING_RELIQUARY_CACHE.ribbonGeometry.translate(0, 0.12, 0);

    const particlePositions = [];
    const particleCount = 54;
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const angle = t * Math.PI * 2;
      const radius = 0.82 + 0.08 * Math.sin(i * 0.87);
      particlePositions.push(
        Math.cos(angle) * radius,
        0.08 + Math.sin(i * 1.5) * 0.25,
        Math.sin(angle) * (0.52 + 0.1 * Math.cos(i * 0.61))
      );
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
    particleGeometry.computeBoundingSphere();
    INPUT_INCOMING_RELIQUARY_CACHE.particleGeometry = particleGeometry;
  }

  return INPUT_INCOMING_RELIQUARY_CACHE;
}

function _getInputIncomingReliquaryMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0x00ddff;
  if (INPUT_INCOMING_RELIQUARY_MATERIALS.has(colorHex)) {
    return INPUT_INCOMING_RELIQUARY_MATERIALS.get(colorHex);
  }

  const inputColor = new THREE.Color(colorHex);
  const brightCyan = inputColor.clone().lerp(new THREE.Color(0xffffff), 0.28);
  const deepCyan = inputColor.clone().lerp(new THREE.Color(0x00193d), 0.24);
  const shellCyan = inputColor.clone().lerp(new THREE.Color(0x7cf4ff), 0.34);

  const coreMat = new THREE.MeshStandardMaterial({
    color: brightCyan,
    emissive: new THREE.Color(0x70f0ff),
    emissiveIntensity: 0.56,
    metalness: 0.86,
    roughness: 0.1,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const wingMat = new THREE.MeshStandardMaterial({
    color: deepCyan,
    emissive: new THREE.Color(0x3bcfff),
    emissiveIntensity: 0.22,
    metalness: 0.56,
    roughness: 0.24,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide
  });

  const ribbonMat = new THREE.MeshBasicMaterial({
    color: shellCyan,
    transparent: true,
    opacity: 0.28,
    depthWrite: false
  });

  const lineMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xe7fdff),
    transparent: true,
    opacity: 0.74,
    depthWrite: false
  });

  const ringMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xc8fbff),
    transparent: true,
    opacity: 0.25,
    depthWrite: false
  });

  const particleMat = new THREE.PointsMaterial({
    color: new THREE.Color(0xb8f7ff),
    size: 0.046,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    sizeAttenuation: true
  });

  const seedMat = new THREE.MeshPhysicalMaterial({
    color: brightCyan.clone().lerp(new THREE.Color(0xffffff), 0.14),
    emissive: new THREE.Color(0x82f3ff),
    emissiveIntensity: 0.72,
    metalness: 0.78,
    roughness: 0.08,
    transmission: 0,
    thickness: 0.18,
    ior: 1.43,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const mats = { coreMat, wingMat, ribbonMat, lineMat, ringMat, particleMat, seedMat };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  INPUT_INCOMING_RELIQUARY_MATERIALS.set(colorHex, mats);
  return mats;
}

// ---------- CONTROL v2 helpers ----------
function _getControlV2Geometries() {
  if (!CONTROL_V2_CACHE.coreGeometry) {
    CONTROL_V2_CACHE.coreGeometry = new THREE.CylinderGeometry(0.52, 0.58, 1.22, 6, 1, false);
    CONTROL_V2_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(CONTROL_V2_CACHE.coreGeometry, 10);
    CONTROL_V2_CACHE.spireGeometry = new THREE.CylinderGeometry(0.038, 0.026, 1.5, 8, 1, false);
    CONTROL_V2_CACHE.ringGeometry = new THREE.TorusGeometry(0.88, 0.05, 12, 72);
    CONTROL_V2_CACHE.segmentGeometry = new THREE.BoxGeometry(0.16, 0.08, 0.14);
    CONTROL_V2_CACHE.overrideGeometry = new THREE.TorusGeometry(1.14, 0.015, 8, 64);
  }
  return CONTROL_V2_CACHE;
}

function _getControlV2Materials(color) {
  const colorHex = typeof color === 'number' ? color : 0xff0088;
  if (CONTROL_V2_MATERIALS.has(colorHex)) return CONTROL_V2_MATERIALS.get(colorHex);

  const coreMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.6,
    roughness: 0.3,
    emissive: colorHex,
    emissiveIntensity: 0.18
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.4
  });

  const spireMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.5,
    roughness: 0.25,
    emissive: colorHex,
    emissiveIntensity: 0.25
  });

  const ringMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.55,
    roughness: 0.28,
    emissive: colorHex,
    emissiveIntensity: 0.14
  });

  const segmentMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.62,
    roughness: 0.24,
    emissive: colorHex,
    emissiveIntensity: 0.1
  });

  const overrideMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.35,
    depthWrite: false
  });

  const mats = { coreMat, edgeMat, spireMat, ringMat, segmentMat, overrideMat };
  Object.values(mats).forEach(mat => {
    mat.userData = mat.userData || {};
    mat.userData.isShared = true;
    mat.userData.noMaterialMutation = true;
  });
  CONTROL_V2_MATERIALS.set(colorHex, mats);
  return mats;
}

// ---------- CONTROL v2 legacy helpers (Cybernetic Dominion Core) ----------
// Live compatibility helpers for the legacy control geometry/material path.
function _getControlV2Geometries_Legacy() {
  if (!CONTROL_V2_LEGACY_CACHE.coreGeometry) {
    CONTROL_V2_LEGACY_CACHE.coreGeometry = new THREE.IcosahedronGeometry(0.55, 1);
    CONTROL_V2_LEGACY_CACHE.coreGeometry.computeBoundingSphere();
    CONTROL_V2_LEGACY_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(CONTROL_V2_LEGACY_CACHE.coreGeometry, 12);
    CONTROL_V2_LEGACY_CACHE.ringGeometry = new THREE.TorusGeometry(0.9, 0.06, 12, 96);
    CONTROL_V2_LEGACY_CACHE.satGeometry = new THREE.BoxGeometry(0.18, 0.12, 0.22);

    const cageGeom = new THREE.IcosahedronGeometry(1.05, 0);
    CONTROL_V2_LEGACY_CACHE.cageGeometry = cageGeom;
    CONTROL_V2_LEGACY_CACHE.cageEdgesGeometry = safeCreateEdgesGeometry(cageGeom, 10);

    CONTROL_V2_LEGACY_CACHE.barrierGeometry = new THREE.SphereGeometry(1.28, 24, 18);

    // Axis beams (X,Y,Z) through origin
    const axisPositions = [
      -1.4, 0, 0, 1.4, 0, 0,
      0, -1.4, 0, 0, 1.4, 0,
      0, 0, -1.4, 0, 0, 1.4
    ];
    const axisGeo = new THREE.BufferGeometry();
    axisGeo.setAttribute('position', new THREE.Float32BufferAttribute(axisPositions, 3));
    CONTROL_V2_LEGACY_CACHE.axisGeometry = axisGeo;

    // Signal matrix points on sphere (randomized once per cache build)
    const matrixPositions = [];
    const count = 200;
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 1.15;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      matrixPositions.push(x, y, z);
    }
    const matrixGeo = new THREE.BufferGeometry();
    matrixGeo.setAttribute('position', new THREE.Float32BufferAttribute(matrixPositions, 3));
    CONTROL_V2_LEGACY_CACHE.matrixGeometry = matrixGeo;
  }
  return CONTROL_V2_LEGACY_CACHE;
}

function _getControlV2Materials_Legacy(color) {
  const colorHex = typeof color === 'number' ? color : 0xff0088;
  if (CONTROL_V2_LEGACY_MATERIALS.has(colorHex)) return CONTROL_V2_LEGACY_MATERIALS.get(colorHex);

  const coreMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.55,
    roughness: 0.22,
    emissive: colorHex,
    emissiveIntensity: 0.5
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: 0xff4fa6,
    transparent: true,
    opacity: 0.65
  });

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xff66cc,
    transparent: true,
    opacity: 0.55,
    depthWrite: false
  });

  const cageMat = new THREE.LineBasicMaterial({
    color: 0x99e0ff,
    transparent: true,
    opacity: 0.65
  });

  const beamMat = new THREE.LineBasicMaterial({
    color: 0xffaad6,
    transparent: true,
    opacity: 0.8
  });

  const satMat = new THREE.MeshStandardMaterial({
    color: 0xff55aa,
    metalness: 0.35,
    roughness: 0.25,
    emissive: 0xff2299,
    emissiveIntensity: 0.45
  });

  const barrierMat = new THREE.MeshStandardMaterial({
    color: 0x440022,
    emissive: 0xff2299,
    emissiveIntensity: 0.18,
    transparent: true,
    opacity: 0.25,
    depthWrite: false
  });

  const matrixMat = new THREE.PointsMaterial({
    color: 0xa9e8ff,
    size: 0.05,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = { coreMat, edgeMat, ringMat, cageMat, beamMat, satMat, barrierMat, matrixMat };
  CONTROL_V2_LEGACY_MATERIALS.set(colorHex, mats);
  return mats;
}

// ---------- ANALYTICS v2 helpers ----------
function _getAnalyticsV2Geometries() {
  if (!ANALYTICS_V2_CACHE.coreGeometry) {
    ANALYTICS_V2_CACHE.coreGeometry = new THREE.CylinderGeometry(0.55, 0.55, 0.9, 6, 1, false);
    ANALYTICS_V2_CACHE.coreGeometry.computeBoundingSphere();
    ANALYTICS_V2_CACHE.coreEdgesGeometry = new THREE.EdgesGeometry(ANALYTICS_V2_CACHE.coreGeometry, 10);

    ANALYTICS_V2_CACHE.hexRingGeometry = new THREE.RingGeometry(0.52, 0.7, 6);
    ANALYTICS_V2_CACHE.planeGeometry = new THREE.PlaneGeometry(1.1, 0.65);

    const vecPositions = [];
    const vectors = [
      [0, -0.7, 0, 0, 0.9, 0],
      [0.45, -0.6, -0.15, -0.45, 0.6, 0.15],
      [-0.35, -0.75, 0.25, 0.35, 0.75, -0.25],
      [0.2, -0.5, 0.6, -0.2, 0.5, -0.6],
      [-0.6, -0.55, -0.1, 0.6, 0.55, 0.1],
      [0.15, -0.9, 0.0, -0.15, 0.9, 0.0]
    ];
    vectors.forEach(v => vecPositions.push(...v));
    const vecGeo = new THREE.BufferGeometry();
    vecGeo.setAttribute('position', new THREE.Float32BufferAttribute(vecPositions, 3));
    ANALYTICS_V2_CACHE.vectorGeometry = vecGeo;

    ANALYTICS_V2_CACHE.gridGeometry = new THREE.BoxGeometry(0.12, 0.02, 0.12);

    ANALYTICS_V2_CACHE.diskGeometry = new THREE.CircleGeometry(1.25, 48);

    const particlePositions = [];
    const particleCount = 160;
    for (let i = 0; i < particleCount; i++) {
      const r = 0.2 + Math.random() * 0.6;
      const theta = Math.random() * Math.PI * 2;
      const y = 0.4 + Math.random() * 0.8;
      particlePositions.push(Math.cos(theta) * r, y, Math.sin(theta) * r);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
    ANALYTICS_V2_CACHE.particlesGeometry = particleGeo;
  }
  return ANALYTICS_V2_CACHE;
}

function _getAnalyticsV2Materials(color) {
  const colorHex = typeof color === 'number' ? color : 0xaa00ff;
  if (ANALYTICS_V2_MATERIALS.has(colorHex)) return ANALYTICS_V2_MATERIALS.get(colorHex);

  const coreMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.35,
    roughness: 0.35,
    emissive: 0xff33cc,
    emissiveIntensity: 0.45
  });

  const layerMat = new THREE.MeshBasicMaterial({
    color: 0xff66ff,
    transparent: true,
    opacity: 0.5,
    depthWrite: false
  });

  const lineMat = new THREE.LineBasicMaterial({
    color: 0x88ddff,
    transparent: true,
    opacity: 0.8
  });

  const gridMat = new THREE.MeshBasicMaterial({
    color: 0x99e8ff,
    transparent: true,
    opacity: 0.4,
    depthWrite: false
  });

  const particleMat = new THREE.PointsMaterial({
    color: 0xff66ff,
    size: 0.05,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = { coreMat, layerMat, lineMat, gridMat, particleMat };
  ANALYTICS_V2_MATERIALS.set(colorHex, mats);
  return mats;
}

// ---------- QUANTUM v2 helpers ----------
function _getQuantumV2Geometries() {
  if (!QUANTUM_V2_CACHE.baseGeometry) {
    QUANTUM_V2_CACHE.baseGeometry = new THREE.DodecahedronGeometry(0.6, 0);
    QUANTUM_V2_CACHE.baseGeometry.computeBoundingSphere();
    QUANTUM_V2_CACHE.edgesGeometry = new THREE.EdgesGeometry(QUANTUM_V2_CACHE.baseGeometry, 8);

    QUANTUM_V2_CACHE.fragmentGeometry = new THREE.TetrahedronGeometry(0.14, 0);
    QUANTUM_V2_CACHE.planeGeometry = new THREE.PlaneGeometry(0.9, 0.35);
    QUANTUM_V2_CACHE.arcGeometry = new THREE.BoxGeometry(0.35, 0.04, 0.06);
    QUANTUM_V2_CACHE.bridgeGeometry = new THREE.BufferGeometry();
    QUANTUM_V2_CACHE.bridgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));

    // Quantum dust points
    const dustPositions = [];
    const dustCount = 180;
    for (let i = 0; i < dustCount; i++) {
      const r = 0.9 + Math.random() * 0.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      dustPositions.push(x, y, z);
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    QUANTUM_V2_CACHE.dustGeometry = dustGeo;
  }
  return QUANTUM_V2_CACHE;
}

function _getQuantumV2Materials(color) {
  const colorHex = typeof color === 'number' ? color : 0x6600ff;
  if (QUANTUM_V2_MATERIALS.has(colorHex)) return QUANTUM_V2_MATERIALS.get(colorHex);

  const primaryMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.4,
    roughness: 0.35,
    emissive: 0xaa22ff,
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: 0.9
  });

  const ghostA = new THREE.MeshBasicMaterial({
    color: 0xcc99ff,
    transparent: true,
    opacity: 0.25,
    depthWrite: false
  });
  const ghostB = ghostA.clone(); ghostB.opacity = 0.2;
  const ghostC = ghostA.clone(); ghostC.opacity = 0.18;

  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x99e8ff,
    transparent: true,
    opacity: 0.65
  });

  const fragmentMat = new THREE.MeshBasicMaterial({
    color: 0x99ffff,
    transparent: true,
    opacity: 0.45,
    depthWrite: false
  });

  const lineMat = new THREE.LineBasicMaterial({
    color: 0x66e0ff,
    transparent: true,
    opacity: 0.6
  });

  const dustMat = new THREE.PointsMaterial({
    color: 0xcc99ff,
    size: 0.04,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    sizeAttenuation: true
  });

  const planeMat = new THREE.MeshBasicMaterial({
    color: 0x8844ff,
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  });

  const mats = {
    primaryMat,
    ghostA,
    ghostB,
    ghostC,
    edgeMat,
    fragmentMat,
    lineMat,
    dustMat,
    planeMat
  };
  
  // Mark cached materials as shared for dispose safety
  mats.primaryMat.userData = { isShared: true };
  mats.ghostA.userData = { isShared: true };
  mats.ghostB.userData = { isShared: true };
  mats.ghostC.userData = { isShared: true };
  mats.edgeMat.userData = { isShared: true };
  mats.fragmentMat.userData = { isShared: true };
  mats.lineMat.userData = { isShared: true };
  mats.dustMat.userData = { isShared: true };
  mats.planeMat.userData = { isShared: true };
  
  QUANTUM_V2_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getQuantumLatticeGeometries() {
  if (!QUANTUM_LATTICE_CACHE.coreGeometry) {
    const coreGeometry = new THREE.DodecahedronGeometry(0.46, 0);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);

      let nx = x;
      let ny = y;
      let nz = z;

      if (x > 0.16 && y > -0.04) {
        nx *= 0.76;
        ny *= 0.9;
        nz *= 1.08;
      }
      if (z < -0.12 && y < 0.12) {
        nx *= 0.86;
        ny *= 0.78;
        nz *= 0.7;
      }
      if (x < -0.18 && y > 0.08) {
        nx *= 0.92;
        ny *= 1.14;
        nz *= 0.82;
      }
      if (y < -0.14) {
        nx *= 0.82;
        ny *= 0.72;
        nz *= 0.9;
      }
      if (x > 0.08 && z > 0.18) {
        nx += 0.03;
        nz += 0.02;
      }
      if (x < -0.1 && z < -0.16) {
        nx -= 0.02;
        ny += 0.03;
      }

      corePos.setXYZ(i, nx, ny, nz);
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    QUANTUM_LATTICE_CACHE.coreGeometry = coreGeometry;
    QUANTUM_LATTICE_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 14);

    const voidSeedGeometry = new THREE.OctahedronGeometry(0.16, 0);
    voidSeedGeometry.scale(0.74, 1.16, 0.74);
    voidSeedGeometry.computeBoundingSphere();
    QUANTUM_LATTICE_CACHE.voidSeedGeometry = voidSeedGeometry;
    QUANTUM_LATTICE_CACHE.voidSeedEdgesGeometry = safeCreateEdgesGeometry(voidSeedGeometry, 10);

    const ghostGeometry = new THREE.OctahedronGeometry(0.19, 0);
    ghostGeometry.scale(1.08, 0.92, 0.82);
    ghostGeometry.computeBoundingSphere();
    QUANTUM_LATTICE_CACHE.ghostGeometry = ghostGeometry;
    QUANTUM_LATTICE_CACHE.ghostEdgesGeometry = safeCreateEdgesGeometry(ghostGeometry, 10);

    const bridgeGeometry = new THREE.BoxGeometry(1, 1, 1);
    bridgeGeometry.computeBoundingSphere();
    QUANTUM_LATTICE_CACHE.bridgeGeometry = bridgeGeometry;
    QUANTUM_LATTICE_CACHE.bridgeEdgesGeometry = safeCreateEdgesGeometry(bridgeGeometry, 8);

    const nodeGeometry = new THREE.DodecahedronGeometry(0.11, 0);
    nodeGeometry.scale(0.94, 1.18, 0.86);
    nodeGeometry.computeBoundingSphere();
    QUANTUM_LATTICE_CACHE.nodeGeometry = nodeGeometry;
    QUANTUM_LATTICE_CACHE.nodeEdgesGeometry = safeCreateEdgesGeometry(nodeGeometry, 8);

    const shardGeometry = new THREE.TetrahedronGeometry(0.09, 0);
    shardGeometry.scale(0.86, 1.24, 0.72);
    shardGeometry.computeBoundingSphere();
    QUANTUM_LATTICE_CACHE.shardGeometry = shardGeometry;
    QUANTUM_LATTICE_CACHE.shardEdgesGeometry = safeCreateEdgesGeometry(shardGeometry, 8);

    const planeGeometry = new THREE.PlaneGeometry(0.98, 0.24);
    planeGeometry.computeBoundingSphere();
    QUANTUM_LATTICE_CACHE.planeGeometry = planeGeometry;

    const haloPositions = [];
    const haloCount = 54;
    for (let i = 0; i < haloCount; i++) {
      const t = i / haloCount;
      const angle = t * Math.PI * 2;
      const wobble = Math.sin(i * 0.87) * 0.07;
      haloPositions.push(
        Math.cos(angle) * (0.84 + 0.08 * Math.sin(i * 0.47)),
        0.16 + Math.sin(i * 1.37) * 0.05 + (i % 11 === 0 ? 0.05 : 0),
        Math.sin(angle) * (0.58 + 0.08 * Math.cos(i * 0.61)) + wobble * 0.08
      );
    }
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute(haloPositions, 3));
    haloGeometry.computeBoundingSphere();
    QUANTUM_LATTICE_CACHE.haloGeometry = haloGeometry;

    const dustPositions = [];
    const dustCount = 96;
    for (let i = 0; i < dustCount; i++) {
      const t = i / dustCount;
      const angle = t * Math.PI * 4.2;
      const radius = 0.94 + 0.38 * ((i % 7) / 6) + 0.06 * Math.sin(i * 0.33);
      const y = -0.28 + 0.56 * ((i % 9) / 8) + 0.1 * Math.sin(i * 0.57);
      dustPositions.push(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * (0.62 + 0.12 * Math.cos(i * 0.41))
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();
    QUANTUM_LATTICE_CACHE.dustGeometry = dustGeometry;
  }

  return QUANTUM_LATTICE_CACHE;
}

function _getQuantumLatticeMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0x69e8ff;
  if (QUANTUM_LATTICE_MATERIALS.has(colorHex)) return QUANTUM_LATTICE_MATERIALS.get(colorHex);

  const seedColor = new THREE.Color(colorHex);
  const whiteColor = new THREE.Color(0xffffff);
  const iceColor = new THREE.Color(0xeafcff);
  const cyanColor = new THREE.Color(0x8eefff);
  const violetColor = new THREE.Color(0xb9a6ff);
  const voidColor = new THREE.Color(0x020712);

  const coreMat = new THREE.MeshStandardMaterial({
    color: seedColor.clone().lerp(whiteColor, 0.24),
    emissive: new THREE.Color(0x13b8ff),
    emissiveIntensity: 0.4,
    metalness: 0.9,
    roughness: 0.12,
    flatShading: true,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const voidMat = new THREE.MeshBasicMaterial({
    color: voidColor,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const ghostMatA = new THREE.MeshBasicMaterial({
    color: iceColor,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const ghostMatB = new THREE.MeshBasicMaterial({
    color: violetColor,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const ghostMatC = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xdaf9ff),
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const bridgeMat = new THREE.MeshStandardMaterial({
    color: seedColor.clone().lerp(cyanColor, 0.22),
    emissive: new THREE.Color(0x1c8fc0),
    emissiveIntensity: 0.22,
    metalness: 0.82,
    roughness: 0.18,
    flatShading: true,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xe4fbff),
    transparent: true,
    opacity: 0.8,
    depthWrite: false
  });

  const lineMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0x94efff),
    transparent: true,
    opacity: 0.56,
    depthWrite: false
  });

  const nodeMat = new THREE.MeshStandardMaterial({
    color: cyanColor.clone().lerp(whiteColor, 0.2),
    emissive: new THREE.Color(0x89e7ff),
    emissiveIntensity: 0.18,
    metalness: 0.76,
    roughness: 0.16,
    flatShading: true,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const shardMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xd9f8ff),
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const planeMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0x91ebff),
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const planeFringeMat = new THREE.MeshBasicMaterial({
    color: violetColor.clone().lerp(iceColor, 0.24),
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const haloMat = new THREE.PointsMaterial({
    color: new THREE.Color(0xe7fbff),
    size: 0.044,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    sizeAttenuation: true
  });

  const dustMat = new THREE.PointsMaterial({
    color: new THREE.Color(0xbca8ff),
    size: 0.03,
    transparent: true,
    opacity: 0.56,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = {
    coreMat,
    voidMat,
    ghostMatA,
    ghostMatB,
    ghostMatC,
    bridgeMat,
    edgeMat,
    lineMat,
    nodeMat,
    shardMat,
    planeMat,
    planeFringeMat,
    haloMat,
    dustMat
  };

  for (const mat of Object.values(mats)) {
    mat.userData = {
      ...(mat.userData || {}),
      wavePatchMode: 'DEFAULT',
      isShared: true
    };
  }

  QUANTUM_LATTICE_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getQuantumParadoxLotusGeometries() {
  if (!QUANTUM_PARADOX_LOTUS_CACHE.coreGeometry) {
    const coreGeometry = new THREE.DodecahedronGeometry(0.32, 1);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const pressure = Math.max(0, Math.abs(x) + Math.abs(z)) * 0.06;
      const warp = Math.sin((x * 5.4) + (y * 4.8) - (z * 4.2)) * 0.024;
      corePos.setXYZ(
        i,
        x * (0.92 + pressure * 0.34) + z * 0.08,
        y * (1.08 - Math.abs(x) * 0.06) - (Math.abs(x) + Math.abs(z)) * 0.06 + warp,
        z * (0.94 + pressure * 0.28) - x * 0.06
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    QUANTUM_PARADOX_LOTUS_CACHE.coreGeometry = coreGeometry;
    QUANTUM_PARADOX_LOTUS_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 12);

    const innerStateGeometry = new THREE.OctahedronGeometry(0.14, 0);
    innerStateGeometry.scale(0.7, 1.22, 0.78);
    innerStateGeometry.rotateZ(0.24);
    innerStateGeometry.rotateY(-0.16);
    innerStateGeometry.computeBoundingSphere();
    QUANTUM_PARADOX_LOTUS_CACHE.innerStateGeometry = innerStateGeometry;
    QUANTUM_PARADOX_LOTUS_CACHE.innerStateEdgesGeometry = safeCreateEdgesGeometry(innerStateGeometry, 10);

    const seamGeometry = new THREE.BoxGeometry(0.08, 0.56, 0.11, 1, 4, 1);
    const seamPos = seamGeometry.attributes.position;
    for (let i = 0; i < seamPos.count; i++) {
      const x = seamPos.getX(i);
      const y = seamPos.getY(i);
      const z = seamPos.getZ(i);
      const yNorm = (y + 0.28) / 0.56;
      seamPos.setXYZ(
        i,
        x * (0.52 + Math.abs(y) * 0.48) + y * 0.1,
        y * 1.04,
        z * (0.64 + yNorm * 0.26) - x * 0.18
      );
    }
    seamPos.needsUpdate = true;
    seamGeometry.computeVertexNormals();
    seamGeometry.computeBoundingSphere();
    QUANTUM_PARADOX_LOTUS_CACHE.seamGeometry = seamGeometry;

    const ghostGeometry = coreGeometry.clone();
    ghostGeometry.scale(1.12, 1.04, 1.08);
    ghostGeometry.rotateY(0.22);
    ghostGeometry.computeBoundingSphere();
    QUANTUM_PARADOX_LOTUS_CACHE.ghostGeometry = ghostGeometry;

    const petalGeometry = new THREE.CylinderGeometry(0.016, 0.16, 0.86, 4, 7, false);
    const petalPos = petalGeometry.attributes.position;
    for (let i = 0; i < petalPos.count; i++) {
      const x = petalPos.getX(i);
      const y = petalPos.getY(i);
      const z = petalPos.getZ(i);
      const yNorm = (y + 0.43) / 0.86;
      const flare = 0.28 + yNorm * 1.08;
      const tipZone = Math.max(0, (yNorm - 0.62) / 0.38);
      const fold = Math.sin(yNorm * Math.PI) * 0.12;
      const phaseSlip = tipZone * (0.06 + Math.abs(z) * 0.22);
      petalPos.setXYZ(
        i,
        x * flare + fold * 0.34 + y * 0.04,
        y * (0.94 + Math.abs(x) * 0.1) + tipZone * 0.08,
        z * (0.2 + yNorm * 0.76) - x * 0.24 + phaseSlip
      );
    }
    petalPos.needsUpdate = true;
    petalGeometry.translate(0, 0.18, 0);
    petalGeometry.computeVertexNormals();
    petalGeometry.computeBoundingSphere();
    QUANTUM_PARADOX_LOTUS_CACHE.petalGeometry = petalGeometry;
    QUANTUM_PARADOX_LOTUS_CACHE.petalEdgesGeometry = safeCreateEdgesGeometry(petalGeometry, 12);

    QUANTUM_PARADOX_LOTUS_CACHE.braceGeometry = new THREE.TorusGeometry(0.44, 0.03, 8, 36, Math.PI * 0.72);
    QUANTUM_PARADOX_LOTUS_CACHE.planeGeometry = new THREE.PlaneGeometry(0.88, 0.3, 1, 1);

    const dustPositions = [];
    const dustCount = 28;
    for (let i = 0; i < dustCount; i++) {
      const angle = (i / dustCount) * Math.PI * 2;
      const radius = 0.4 + Math.sin(i * 1.18) * 0.08 + ((i % 4) * 0.03);
      dustPositions.push(
        Math.cos(angle) * radius + Math.sin(i * 0.74) * 0.05,
        -0.1 + ((i % 7) * 0.09),
        Math.sin(angle * 1.22) * radius * 0.9
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();
    QUANTUM_PARADOX_LOTUS_CACHE.dustGeometry = dustGeometry;
  }

  return QUANTUM_PARADOX_LOTUS_CACHE;
}

function _getQuantumParadoxLotusMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0x69e8ff;
  if (QUANTUM_PARADOX_LOTUS_MATERIALS.has(colorHex)) return QUANTUM_PARADOX_LOTUS_MATERIALS.get(colorHex);

  const seedColor = new THREE.Color(colorHex);
  const whiteColor = new THREE.Color(0xf5fcff);
  const iceColor = new THREE.Color(0xe6fbff);
  const cyanColor = new THREE.Color(0x8eefff);
  const violetColor = new THREE.Color(0xbca7ff);
  const voidColor = new THREE.Color(0x030814);

  const coreMat = new THREE.MeshStandardMaterial({
    color: seedColor.clone().lerp(whiteColor, 0.2),
    emissive: cyanColor.clone().lerp(violetColor, 0.18),
    emissiveIntensity: 0.34,
    metalness: 0.86,
    roughness: 0.14,
    flatShading: true,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const innerStateMat = new THREE.MeshStandardMaterial({
    color: whiteColor.clone().lerp(violetColor, 0.18),
    emissive: cyanColor.clone().lerp(seedColor, 0.24),
    emissiveIntensity: 0.24,
    metalness: 0.76,
    roughness: 0.12,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: voidColor,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xe8fbff),
    transparent: true,
    opacity: 0.72,
    depthWrite: false
  });

  const petalMatA = new THREE.MeshStandardMaterial({
    color: iceColor.clone().lerp(seedColor, 0.12),
    emissive: cyanColor.clone().lerp(violetColor, 0.1),
    emissiveIntensity: 0.18,
    metalness: 0.74,
    roughness: 0.18,
    flatShading: true,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const petalMatB = new THREE.MeshStandardMaterial({
    color: violetColor.clone().lerp(iceColor, 0.3),
    emissive: violetColor.clone().lerp(cyanColor, 0.12),
    emissiveIntensity: 0.2,
    metalness: 0.7,
    roughness: 0.2,
    flatShading: true,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const braceMat = new THREE.MeshBasicMaterial({
    color: cyanColor.clone().lerp(whiteColor, 0.1),
    transparent: true,
    opacity: 0.2,
    depthWrite: false
  });

  const planeMat = new THREE.MeshBasicMaterial({
    color: violetColor.clone().lerp(seedColor, 0.16),
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const ghostMatA = new THREE.MeshBasicMaterial({
    color: iceColor,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const ghostMatB = new THREE.MeshBasicMaterial({
    color: violetColor,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const dustMat = new THREE.PointsMaterial({
    color: violetColor.clone().lerp(iceColor, 0.28),
    size: 0.04,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = {
    coreMat,
    innerStateMat,
    seamMat,
    edgeMat,
    petalMatA,
    petalMatB,
    braceMat,
    planeMat,
    ghostMatA,
    ghostMatB,
    dustMat
  };

  for (const mat of Object.values(mats)) {
    mat.userData = {
      ...(mat.userData || {}),
      wavePatchMode: 'DEFAULT',
      isShared: true
    };
  }

  QUANTUM_PARADOX_LOTUS_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getQuantumProbabilityBloomGeometries() {
  if (!QUANTUM_PROBABILITY_BLOOM_CACHE.coreGeometry) {
    const coreGeometry = new THREE.DodecahedronGeometry(0.34, 1);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const broadcast = Math.max(0, y) * 0.08 + Math.max(0, x) * 0.1;
      const drift = Math.sin((x * 4.2) - (y * 5.1) + (z * 4.8)) * 0.024;
      corePos.setXYZ(
        i,
        x * (0.96 + broadcast * 0.42) + z * 0.08 + drift,
        y * (1.04 + Math.abs(z) * 0.08) + x * 0.04,
        z * (0.92 + Math.max(0, -x) * 0.08) - x * 0.08 + drift * 0.5
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    QUANTUM_PROBABILITY_BLOOM_CACHE.coreGeometry = coreGeometry;
    QUANTUM_PROBABILITY_BLOOM_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 12);

    const innerStateGeometry = new THREE.OctahedronGeometry(0.14, 0);
    innerStateGeometry.scale(0.78, 1.18, 0.72);
    innerStateGeometry.rotateZ(0.34);
    innerStateGeometry.rotateY(0.18);
    innerStateGeometry.computeBoundingSphere();
    QUANTUM_PROBABILITY_BLOOM_CACHE.innerStateGeometry = innerStateGeometry;
    QUANTUM_PROBABILITY_BLOOM_CACHE.innerStateEdgesGeometry = safeCreateEdgesGeometry(innerStateGeometry, 10);

    const ghostGeometry = coreGeometry.clone();
    ghostGeometry.scale(1.1, 1.04, 1.14);
    ghostGeometry.rotateY(0.28);
    ghostGeometry.computeBoundingSphere();
    QUANTUM_PROBABILITY_BLOOM_CACHE.ghostGeometry = ghostGeometry;

    const cageGeometry = coreGeometry.clone();
    cageGeometry.scale(1.18, 1.22, 1.16);
    cageGeometry.rotateX(0.16);
    cageGeometry.rotateY(-0.2);
    cageGeometry.computeBoundingSphere();
    QUANTUM_PROBABILITY_BLOOM_CACHE.cageEdgesGeometry = safeCreateEdgesGeometry(cageGeometry, 10);

    const sailGeometry = new THREE.BoxGeometry(0.14, 0.82, 0.04, 1, 7, 1);
    const sailPos = sailGeometry.attributes.position;
    for (let i = 0; i < sailPos.count; i++) {
      const x = sailPos.getX(i);
      const y = sailPos.getY(i);
      const z = sailPos.getZ(i);
      const yNorm = (y + 0.41) / 0.82;
      const fan = 0.38 + yNorm * 1.06;
      const sheetSkew = Math.sin(yNorm * Math.PI) * 0.12;
      const tipSpread = Math.max(0, (yNorm - 0.58) / 0.42) * 0.18;
      sailPos.setXYZ(
        i,
        x * fan + y * 0.05 + tipSpread,
        y * (0.98 + Math.abs(x) * 0.08),
        z * (0.24 + yNorm * 0.3) + sheetSkew - x * 0.18
      );
    }
    sailPos.needsUpdate = true;
    sailGeometry.translate(0, 0.16, 0);
    sailGeometry.computeVertexNormals();
    sailGeometry.computeBoundingSphere();
    QUANTUM_PROBABILITY_BLOOM_CACHE.sailGeometry = sailGeometry;
    QUANTUM_PROBABILITY_BLOOM_CACHE.sailEdgesGeometry = safeCreateEdgesGeometry(sailGeometry, 10);

    QUANTUM_PROBABILITY_BLOOM_CACHE.dominantArcGeometry = new THREE.TorusGeometry(0.92, 0.044, 8, 54, Math.PI * 1.18);
    QUANTUM_PROBABILITY_BLOOM_CACHE.counterArcGeometry = new THREE.TorusGeometry(0.76, 0.032, 8, 40, Math.PI * 0.82);

    const frameGeometry = new THREE.BoxGeometry(0.74, 0.74, 0.74, 1, 1, 1);
    frameGeometry.scale(1.0, 0.92, 1.12);
    frameGeometry.rotateX(0.28);
    frameGeometry.rotateY(-0.42);
    frameGeometry.computeBoundingSphere();
    QUANTUM_PROBABILITY_BLOOM_CACHE.frameEdgesGeometry = safeCreateEdgesGeometry(frameGeometry, 8);

    const shardGeometry = new THREE.CylinderGeometry(0.014, 0.12, 0.36, 4, 3, false);
    const shardPos = shardGeometry.attributes.position;
    for (let i = 0; i < shardPos.count; i++) {
      const x = shardPos.getX(i);
      const y = shardPos.getY(i);
      const z = shardPos.getZ(i);
      const yNorm = (y + 0.18) / 0.36;
      const flare = 0.3 + yNorm * 1.0;
      const bend = Math.sin(yNorm * Math.PI) * 0.1;
      shardPos.setXYZ(
        i,
        x * flare + bend,
        y * 1.06,
        z * (0.18 + yNorm * 0.5) - bend * 0.26
      );
    }
    shardPos.needsUpdate = true;
    shardGeometry.translate(0, 0.12, 0);
    shardGeometry.computeVertexNormals();
    shardGeometry.computeBoundingSphere();
    QUANTUM_PROBABILITY_BLOOM_CACHE.shardGeometry = shardGeometry;
    QUANTUM_PROBABILITY_BLOOM_CACHE.shardEdgesGeometry = safeCreateEdgesGeometry(shardGeometry, 12);

    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
      0.82, 0.46, -0.08,
      0.54, -0.22, 0.44,
      -0.68, 0.38, 0.14,
      -0.24, -0.42, -0.62,
      0.18, 0.76, 0.3,
      -0.74, -0.04, 0.08
    ], 3));
    haloGeometry.computeBoundingSphere();
    QUANTUM_PROBABILITY_BLOOM_CACHE.haloGeometry = haloGeometry;

    const dustPositions = [];
    const dustCount = 26;
    for (let i = 0; i < dustCount; i++) {
      const angle = (i / dustCount) * Math.PI * 2;
      const radius = 0.42 + Math.sin(i * 1.34) * 0.08 + ((i % 3) * 0.04);
      dustPositions.push(
        Math.cos(angle) * radius + Math.sin(i * 0.72) * 0.05,
        -0.14 + ((i % 7) * 0.09),
        Math.sin(angle * 1.18) * radius * 0.86
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();
    QUANTUM_PROBABILITY_BLOOM_CACHE.dustGeometry = dustGeometry;
  }

  return QUANTUM_PROBABILITY_BLOOM_CACHE;
}

function _getQuantumProbabilityBloomMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0x69e8ff;
  if (QUANTUM_PROBABILITY_BLOOM_MATERIALS.has(colorHex)) return QUANTUM_PROBABILITY_BLOOM_MATERIALS.get(colorHex);

  const seedColor = new THREE.Color(colorHex);
  const whiteColor = new THREE.Color(0xf6fcff);
  const iceColor = new THREE.Color(0xe8fbff);
  const cyanColor = new THREE.Color(0x92efff);
  const violetColor = new THREE.Color(0xc2abff);
  const voidColor = new THREE.Color(0x030814);

  const coreMat = new THREE.MeshStandardMaterial({
    color: seedColor.clone().lerp(whiteColor, 0.22),
    emissive: cyanColor.clone().lerp(violetColor, 0.2),
    emissiveIntensity: 0.3,
    metalness: 0.82,
    roughness: 0.16,
    flatShading: true,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const innerStateMat = new THREE.MeshStandardMaterial({
    color: whiteColor.clone().lerp(violetColor, 0.14),
    emissive: cyanColor.clone().lerp(seedColor, 0.22),
    emissiveIntensity: 0.24,
    metalness: 0.74,
    roughness: 0.12,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xeafcff),
    transparent: true,
    opacity: 0.74,
    depthWrite: false
  });

  const cageMat = new THREE.LineBasicMaterial({
    color: cyanColor.clone().lerp(whiteColor, 0.14),
    transparent: true,
    opacity: 0.28,
    depthWrite: false
  });

  const sailMatA = new THREE.MeshStandardMaterial({
    color: iceColor.clone().lerp(seedColor, 0.14),
    emissive: cyanColor.clone().lerp(violetColor, 0.08),
    emissiveIntensity: 0.18,
    metalness: 0.72,
    roughness: 0.18,
    flatShading: true,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const sailMatB = new THREE.MeshStandardMaterial({
    color: violetColor.clone().lerp(iceColor, 0.34),
    emissive: violetColor.clone().lerp(cyanColor, 0.12),
    emissiveIntensity: 0.18,
    metalness: 0.68,
    roughness: 0.22,
    flatShading: true,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const arcMatA = new THREE.MeshBasicMaterial({
    color: cyanColor.clone().lerp(whiteColor, 0.1),
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  });

  const arcMatB = new THREE.MeshBasicMaterial({
    color: violetColor.clone().lerp(cyanColor, 0.22),
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  });

  const frameMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xbbeeff),
    transparent: true,
    opacity: 0.34,
    depthWrite: false
  });

  const shardMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xdaf8ff),
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const ghostMatA = new THREE.MeshBasicMaterial({
    color: iceColor,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const ghostMatB = new THREE.MeshBasicMaterial({
    color: violetColor,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const haloMat = new THREE.PointsMaterial({
    color: new THREE.Color(0xe8fbff),
    size: 0.042,
    transparent: true,
    opacity: 0.66,
    depthWrite: false,
    sizeAttenuation: true
  });

  const dustMat = new THREE.PointsMaterial({
    color: violetColor.clone().lerp(iceColor, 0.24),
    size: 0.034,
    transparent: true,
    opacity: 0.54,
    depthWrite: false,
    sizeAttenuation: true
  });

  const mats = {
    coreMat,
    innerStateMat,
    edgeMat,
    cageMat,
    sailMatA,
    sailMatB,
    arcMatA,
    arcMatB,
    frameMat,
    shardMat,
    ghostMatA,
    ghostMatB,
    haloMat,
    dustMat
  };

  for (const mat of Object.values(mats)) {
    mat.userData = {
      ...(mat.userData || {}),
      wavePatchMode: 'DEFAULT',
      isShared: true
    };
  }

  QUANTUM_PROBABILITY_BLOOM_MATERIALS.set(colorHex, mats);
  return mats;
}

// ---------- SIGMA v2 helpers ----------
function _getSigmaV2Geometries() {
  if (!SIGMA_V2_CACHE.baseGeometry) {
    SIGMA_V2_CACHE.baseGeometry = new THREE.IcosahedronGeometry(0.6, 1);
    SIGMA_V2_CACHE.baseGeometry.computeBoundingSphere();
    SIGMA_V2_CACHE.edgesGeometry = new THREE.EdgesGeometry(SIGMA_V2_CACHE.baseGeometry, 12);
    SIGMA_V2_CACHE.ringGeometry = new THREE.TorusGeometry(0.9, 0.05, 12, 64);
    SIGMA_V2_CACHE.cageGeometry = new THREE.IcosahedronGeometry(1.02, 0);
    SIGMA_V2_CACHE.cageEdgesGeometry = new THREE.EdgesGeometry(SIGMA_V2_CACHE.cageGeometry, 8);
    SIGMA_V2_CACHE.innerCoreGeometry = new THREE.OctahedronGeometry(0.28, 0);
    SIGMA_V2_CACHE.beaconGeometry = new THREE.TetrahedronGeometry(0.08, 0);
  }
  return SIGMA_V2_CACHE;
}

function _getSigmaV2Materials(color) {
  const colorHex = typeof color === 'number' ? color : 0x00ffee;
  if (SIGMA_V2_MATERIALS.has(colorHex)) return SIGMA_V2_MATERIALS.get(colorHex);

  const coreMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.55,
    roughness: 0.28,
    emissive: colorHex,
    emissiveIntensity: 0.25,
    transparent: false,
    opacity: 1
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: 0xaaddff,
    transparent: true,
    opacity: 0.45
  });

  const ringMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.35
  });

  const cageMat = new THREE.LineBasicMaterial({
    color: 0xa8fff0,
    transparent: true,
    opacity: 0.55
  });

  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xc8fff3,
    transparent: true,
    opacity: 0.75
  });

  const mats = { coreMat, edgeMat, ringMat, cageMat, beaconMat };
  SIGMA_V2_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getSigmaFractureChoirGeometries() {
  if (!SIGMA_FRACTURE_CHOIR_CACHE.coreGeometry) {
    const coreGeometry = new THREE.IcosahedronGeometry(0.36, 1);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const fracture = Math.sin((x * 4.8) + (y * 5.6) - (z * 3.4)) * 0.028;
      const choirBias = Math.max(0, x) * 0.12 + Math.max(0, y) * 0.08 - Math.max(0, -x) * 0.04;
      corePos.setXYZ(
        i,
        x * (0.94 + choirBias * 0.42) + z * 0.08 + fracture,
        y * (1.06 + Math.abs(x) * 0.14) - z * 0.08,
        z * (0.82 + Math.max(0, -x) * 0.12) - x * 0.12 + fracture * 0.42
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    SIGMA_FRACTURE_CHOIR_CACHE.coreGeometry = coreGeometry;
    SIGMA_FRACTURE_CHOIR_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 12);

    const seedGeometry = new THREE.OctahedronGeometry(0.14, 0);
    seedGeometry.scale(0.46, 1.18, 0.44);
    seedGeometry.rotateZ(0.22);
    seedGeometry.computeBoundingSphere();
    SIGMA_FRACTURE_CHOIR_CACHE.seedGeometry = seedGeometry;

    const seamGeometry = new THREE.BoxGeometry(0.08, 0.54, 0.12, 1, 3, 1);
    const seamPos = seamGeometry.attributes.position;
    for (let i = 0; i < seamPos.count; i++) {
      const x = seamPos.getX(i);
      const y = seamPos.getY(i);
      const z = seamPos.getZ(i);
      const yNorm = (y + 0.27) / 0.54;
      seamPos.setXYZ(
        i,
        x * (0.52 + Math.abs(y) * 0.56) + y * 0.1,
        y * 1.04,
        z * (0.68 + yNorm * 0.28) - x * 0.18
      );
    }
    seamPos.needsUpdate = true;
    seamGeometry.computeVertexNormals();
    seamGeometry.computeBoundingSphere();
    SIGMA_FRACTURE_CHOIR_CACHE.seamGeometry = seamGeometry;

    const echoGeometry = coreGeometry.clone();
    echoGeometry.scale(1.08, 1.04, 1.12);
    echoGeometry.computeBoundingSphere();
    SIGMA_FRACTURE_CHOIR_CACHE.echoGeometry = echoGeometry;

    const choirGeometry = new THREE.BoxGeometry(0.16, 0.94, 0.14, 1, 7, 1);
    const choirPos = choirGeometry.attributes.position;
    for (let i = 0; i < choirPos.count; i++) {
      const x = choirPos.getX(i);
      const y = choirPos.getY(i);
      const z = choirPos.getZ(i);
      const yNorm = (y + 0.47) / 0.94;
      const forkZone = Math.max(0, (yNorm - 0.68) / 0.32);
      const forkSpread = forkZone * (0.14 + Math.abs(x) * 0.38);
      const bow = Math.sin(yNorm * Math.PI) * 0.08;
      choirPos.setXYZ(
        i,
        x * (0.62 + yNorm * 1.22) + Math.sign(x || 1) * forkSpread + y * 0.08,
        y * (0.98 + Math.abs(x) * 0.12),
        z * (0.56 + yNorm * 0.52) - x * 0.22 + bow
      );
    }
    choirPos.needsUpdate = true;
    choirGeometry.translate(0, 0.16, 0);
    choirGeometry.computeVertexNormals();
    choirGeometry.computeBoundingSphere();
    SIGMA_FRACTURE_CHOIR_CACHE.choirGeometry = choirGeometry;
    SIGMA_FRACTURE_CHOIR_CACHE.choirEdgesGeometry = safeCreateEdgesGeometry(choirGeometry, 14);

    const responseGeometry = new THREE.CylinderGeometry(0.018, 0.14, 0.46, 4, 3, false);
    const responsePos = responseGeometry.attributes.position;
    for (let i = 0; i < responsePos.count; i++) {
      const x = responsePos.getX(i);
      const y = responsePos.getY(i);
      const z = responsePos.getZ(i);
      const yNorm = (y + 0.23) / 0.46;
      const flare = 0.28 + yNorm * 1.06;
      const rupture = Math.sin(yNorm * Math.PI) * 0.12;
      responsePos.setXYZ(
        i,
        x * flare + rupture,
        y * 1.06,
        z * (0.22 + yNorm * 0.6) - rupture * 0.26
      );
    }
    responsePos.needsUpdate = true;
    responseGeometry.translate(0, 0.14, 0);
    responseGeometry.computeVertexNormals();
    responseGeometry.computeBoundingSphere();
    SIGMA_FRACTURE_CHOIR_CACHE.responseGeometry = responseGeometry;
    SIGMA_FRACTURE_CHOIR_CACHE.responseEdgesGeometry = safeCreateEdgesGeometry(responseGeometry, 14);

    SIGMA_FRACTURE_CHOIR_CACHE.dominantArcGeometry = new THREE.TorusGeometry(0.88, 0.046, 10, 58, Math.PI * 1.22);
    SIGMA_FRACTURE_CHOIR_CACHE.returnArcGeometry = new THREE.TorusGeometry(0.72, 0.036, 10, 48, Math.PI * 0.96);
    SIGMA_FRACTURE_CHOIR_CACHE.fragmentArcGeometry = new THREE.TorusGeometry(0.52, 0.028, 8, 30, Math.PI * 0.54);

    const dustPositions = [];
    const dustCount = 28;
    for (let i = 0; i < dustCount; i++) {
      const angle = (i / dustCount) * Math.PI * 2;
      const radius = 0.44 + Math.sin(i * 1.37) * 0.1 + (i % 3) * 0.05;
      dustPositions.push(
        Math.cos(angle) * radius + Math.sin(i * 0.74) * 0.06,
        -0.18 + ((i % 7) * 0.09),
        Math.sin(angle * 1.24) * radius * 0.86
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();
    SIGMA_FRACTURE_CHOIR_CACHE.dustGeometry = dustGeometry;
  }

  return SIGMA_FRACTURE_CHOIR_CACHE;
}

function _getSigmaFractureChoirMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0x00ffee;
  if (SIGMA_FRACTURE_CHOIR_MATERIALS.has(colorHex)) return SIGMA_FRACTURE_CHOIR_MATERIALS.get(colorHex);

  const sigmaColor = new THREE.Color(colorHex);
  const whiteColor = new THREE.Color(0xf3ffff);
  const mintColor = new THREE.Color(0x9fffe8);
  const cyanColor = new THREE.Color(0x7be4ff);
  const fractureAccent = new THREE.Color(0xff86c8);
  const deepColor = new THREE.Color(0x0b1f28);

  const ribColor = whiteColor.clone().lerp(sigmaColor, 0.26).lerp(cyanColor, 0.08);
  const responseColor = mintColor.clone().lerp(sigmaColor, 0.24);
  const arcColor = whiteColor.clone().lerp(mintColor, 0.34);

  const relayMat = new THREE.MeshStandardMaterial({
    color: ribColor,
    emissive: cyanColor.clone().lerp(sigmaColor, 0.24),
    emissiveIntensity: 0.24,
    metalness: 0.68,
    roughness: 0.24,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seedMat = new THREE.MeshStandardMaterial({
    color: whiteColor.clone().lerp(mintColor, 0.16),
    emissive: whiteColor.clone().lerp(sigmaColor, 0.34),
    emissiveIntensity: 0.34,
    metalness: 0.58,
    roughness: 0.16,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: deepColor.clone().lerp(fractureAccent, 0.06),
    transparent: true,
    opacity: 0.88,
    depthWrite: false
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: whiteColor.clone().lerp(cyanColor, 0.22),
    transparent: true,
    opacity: 0.42,
    depthWrite: false
  });

  const responseMat = new THREE.MeshStandardMaterial({
    color: responseColor,
    emissive: sigmaColor.clone().lerp(fractureAccent, 0.06),
    emissiveIntensity: 0.22,
    metalness: 0.56,
    roughness: 0.22,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const arcMatA = new THREE.MeshBasicMaterial({
    color: arcColor.clone().lerp(cyanColor, 0.18),
    transparent: true,
    opacity: 0.26,
    depthWrite: false
  });

  const arcMatB = new THREE.MeshBasicMaterial({
    color: whiteColor.clone().lerp(mintColor, 0.26),
    transparent: true,
    opacity: 0.2,
    depthWrite: false
  });

  const echoMat = new THREE.MeshBasicMaterial({
    color: whiteColor.clone().lerp(fractureAccent, 0.08),
    transparent: true,
    opacity: 0.12,
    depthWrite: false
  });

  const dustMat = new THREE.PointsMaterial({
    color: mintColor.clone().lerp(fractureAccent, 0.08),
    size: 0.044,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
    sizeAttenuation: true
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: whiteColor.clone().lerp(mintColor, 0.32).lerp(fractureAccent, 0.05),
    transparent: true,
    opacity: 0.12,
    depthWrite: false
  });

  const mats = {
    relayMat,
    seedMat,
    seamMat,
    edgeMat,
    responseMat,
    arcMatA,
    arcMatB,
    echoMat,
    dustMat,
    glowMat
  };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  SIGMA_FRACTURE_CHOIR_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getSigmaRuptureDiademGeometries() {
  if (!SIGMA_RUPTURE_DIADEM_CACHE.coreGeometry) {
    const coreGeometry = new THREE.IcosahedronGeometry(0.38, 1);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const crest = Math.max(0, y) * 0.1 + Math.max(0, x) * 0.06;
      const rupture = Math.sin((x * 5.4) - (z * 4.2) + (y * 3.8)) * 0.022;
      corePos.setXYZ(
        i,
        x * (0.92 + crest * 0.32) + z * 0.06 + rupture,
        y * (1.04 + Math.abs(x) * 0.12) + x * 0.04,
        z * (0.84 + Math.max(0, -x) * 0.14) - x * 0.08 + rupture * 0.44
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    SIGMA_RUPTURE_DIADEM_CACHE.coreGeometry = coreGeometry;
    SIGMA_RUPTURE_DIADEM_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 12);

    const seedGeometry = new THREE.OctahedronGeometry(0.12, 0);
    seedGeometry.scale(0.48, 1.16, 0.42);
    seedGeometry.rotateZ(0.18);
    seedGeometry.computeBoundingSphere();
    SIGMA_RUPTURE_DIADEM_CACHE.seedGeometry = seedGeometry;

    const seamGeometry = new THREE.BoxGeometry(0.08, 0.52, 0.11, 1, 3, 1);
    const seamPos = seamGeometry.attributes.position;
    for (let i = 0; i < seamPos.count; i++) {
      const x = seamPos.getX(i);
      const y = seamPos.getY(i);
      const z = seamPos.getZ(i);
      const yNorm = (y + 0.26) / 0.52;
      seamPos.setXYZ(
        i,
        x * (0.58 + Math.abs(y) * 0.42) + y * 0.08,
        y * 1.04,
        z * (0.64 + yNorm * 0.28) - x * 0.16
      );
    }
    seamPos.needsUpdate = true;
    seamGeometry.computeVertexNormals();
    seamGeometry.computeBoundingSphere();
    SIGMA_RUPTURE_DIADEM_CACHE.seamGeometry = seamGeometry;

    const echoGeometry = coreGeometry.clone();
    echoGeometry.scale(1.12, 1.06, 1.08);
    echoGeometry.rotateY(0.18);
    echoGeometry.computeBoundingSphere();
    SIGMA_RUPTURE_DIADEM_CACHE.echoGeometry = echoGeometry;

    SIGMA_RUPTURE_DIADEM_CACHE.arcGeometryA = new THREE.TorusGeometry(0.9, 0.05, 10, 56, Math.PI * 1.08);
    SIGMA_RUPTURE_DIADEM_CACHE.arcGeometryB = new THREE.TorusGeometry(0.76, 0.04, 10, 48, Math.PI * 0.86);
    SIGMA_RUPTURE_DIADEM_CACHE.arcGeometryC = new THREE.TorusGeometry(0.62, 0.032, 8, 32, Math.PI * 0.54);

    const shardGeometry = new THREE.CylinderGeometry(0.016, 0.13, 0.42, 4, 3, false);
    const shardPos = shardGeometry.attributes.position;
    for (let i = 0; i < shardPos.count; i++) {
      const x = shardPos.getX(i);
      const y = shardPos.getY(i);
      const z = shardPos.getZ(i);
      const yNorm = (y + 0.21) / 0.42;
      const flare = 0.34 + yNorm * 0.94;
      const bend = Math.sin(yNorm * Math.PI) * 0.1;
      shardPos.setXYZ(
        i,
        x * flare + bend,
        y * 1.08,
        z * (0.22 + yNorm * 0.52) - bend * 0.24
      );
    }
    shardPos.needsUpdate = true;
    shardGeometry.translate(0, 0.14, 0);
    shardGeometry.computeVertexNormals();
    shardGeometry.computeBoundingSphere();
    SIGMA_RUPTURE_DIADEM_CACHE.shardGeometry = shardGeometry;
    SIGMA_RUPTURE_DIADEM_CACHE.shardEdgesGeometry = safeCreateEdgesGeometry(shardGeometry, 14);

    const dustPositions = [];
    const dustCount = 24;
    for (let i = 0; i < dustCount; i++) {
      const angle = (i / dustCount) * Math.PI * 2;
      const radius = 0.46 + Math.sin(i * 1.17) * 0.08;
      dustPositions.push(
        Math.cos(angle) * radius + Math.sin(i * 0.6) * 0.05,
        -0.14 + ((i % 6) * 0.08),
        Math.sin(angle * 1.14) * radius * 0.88
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();
    SIGMA_RUPTURE_DIADEM_CACHE.dustGeometry = dustGeometry;

    const glowGeometry = new THREE.IcosahedronGeometry(0.54, 0);
    glowGeometry.scale(1.0, 1.08, 0.94);
    glowGeometry.computeBoundingSphere();
    SIGMA_RUPTURE_DIADEM_CACHE.glowGeometry = glowGeometry;
  }

  return SIGMA_RUPTURE_DIADEM_CACHE;
}

function _getSigmaRuptureDiademMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0x00ffee;
  if (SIGMA_RUPTURE_DIADEM_MATERIALS.has(colorHex)) return SIGMA_RUPTURE_DIADEM_MATERIALS.get(colorHex);

  const sigmaColor = new THREE.Color(colorHex);
  const whiteColor = new THREE.Color(0xf5ffff);
  const mintColor = new THREE.Color(0x9dffe8);
  const cyanColor = new THREE.Color(0x79e7ff);
  const fractureAccent = new THREE.Color(0xff8cd1);
  const deepColor = new THREE.Color(0x0b1820);

  const seedMat = new THREE.MeshStandardMaterial({
    color: whiteColor.clone().lerp(mintColor, 0.16),
    emissive: whiteColor.clone().lerp(sigmaColor, 0.34),
    emissiveIntensity: 0.3,
    metalness: 0.56,
    roughness: 0.16,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: deepColor.clone().lerp(fractureAccent, 0.08),
    transparent: true,
    opacity: 0.86,
    depthWrite: false
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: whiteColor.clone().lerp(cyanColor, 0.22),
    transparent: true,
    opacity: 0.4,
    depthWrite: false
  });

  const arcMatA = new THREE.MeshBasicMaterial({
    color: whiteColor.clone().lerp(mintColor, 0.3),
    transparent: true,
    opacity: 0.26,
    depthWrite: false
  });

  const arcMatB = new THREE.MeshBasicMaterial({
    color: cyanColor.clone().lerp(sigmaColor, 0.22).lerp(fractureAccent, 0.04),
    transparent: true,
    opacity: 0.2,
    depthWrite: false
  });

  const shardMat = new THREE.MeshStandardMaterial({
    color: mintColor.clone().lerp(sigmaColor, 0.24),
    emissive: sigmaColor.clone().lerp(fractureAccent, 0.06),
    emissiveIntensity: 0.22,
    metalness: 0.48,
    roughness: 0.24,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const echoMat = new THREE.MeshBasicMaterial({
    color: whiteColor.clone().lerp(fractureAccent, 0.08),
    transparent: true,
    opacity: 0.12,
    depthWrite: false
  });

  const dustMat = new THREE.PointsMaterial({
    color: mintColor.clone().lerp(fractureAccent, 0.08),
    size: 0.042,
    transparent: true,
    opacity: 0.54,
    depthWrite: false,
    sizeAttenuation: true
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: whiteColor.clone().lerp(mintColor, 0.26).lerp(fractureAccent, 0.04),
    transparent: true,
    opacity: 0.12,
    depthWrite: false
  });

  const mats = {
    seedMat,
    seamMat,
    edgeMat,
    arcMatA,
    arcMatB,
    shardMat,
    echoMat,
    dustMat,
    glowMat
  };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  SIGMA_RUPTURE_DIADEM_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getSigmaRuptureBloomCrownGeometries() {
  if (!SIGMA_RUPTURE_BLOOM_CROWN_CACHE.coreGeometry) {
    const coreGeometry = new THREE.IcosahedronGeometry(0.4, 1);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const bloomBias = Math.max(0, y) * 0.12 + Math.max(0, z) * 0.06;
      const rupture = Math.sin((x * 5.2) + (y * 6.1) - (z * 3.7)) * 0.026;
      corePos.setXYZ(
        i,
        x * (0.9 + bloomBias * 0.34) + z * 0.09 + rupture,
        y * (1.08 + Math.abs(x) * 0.14) - x * 0.05,
        z * (0.84 + Math.max(0, -x) * 0.12) + y * 0.08 + rupture * 0.48
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    SIGMA_RUPTURE_BLOOM_CROWN_CACHE.coreGeometry = coreGeometry;
    SIGMA_RUPTURE_BLOOM_CROWN_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 12);

    const seedGeometry = new THREE.OctahedronGeometry(0.13, 0);
    seedGeometry.scale(0.5, 1.22, 0.44);
    seedGeometry.rotateZ(0.24);
    seedGeometry.rotateX(-0.16);
    seedGeometry.computeBoundingSphere();
    SIGMA_RUPTURE_BLOOM_CROWN_CACHE.seedGeometry = seedGeometry;

    const seamGeometry = new THREE.BoxGeometry(0.08, 0.58, 0.12, 1, 4, 1);
    const seamPos = seamGeometry.attributes.position;
    for (let i = 0; i < seamPos.count; i++) {
      const x = seamPos.getX(i);
      const y = seamPos.getY(i);
      const z = seamPos.getZ(i);
      const yNorm = (y + 0.29) / 0.58;
      seamPos.setXYZ(
        i,
        x * (0.54 + Math.abs(y) * 0.48) + y * 0.1,
        y * 1.04,
        z * (0.66 + yNorm * 0.32) - x * 0.18
      );
    }
    seamPos.needsUpdate = true;
    seamGeometry.computeVertexNormals();
    seamGeometry.computeBoundingSphere();
    SIGMA_RUPTURE_BLOOM_CROWN_CACHE.seamGeometry = seamGeometry;

    const echoGeometry = coreGeometry.clone();
    echoGeometry.scale(1.14, 1.06, 1.1);
    echoGeometry.rotateY(0.2);
    echoGeometry.computeBoundingSphere();
    SIGMA_RUPTURE_BLOOM_CROWN_CACHE.echoGeometry = echoGeometry;

    const petalGeometry = new THREE.CylinderGeometry(0.03, 0.18, 0.96, 5, 7, false);
    const petalPos = petalGeometry.attributes.position;
    for (let i = 0; i < petalPos.count; i++) {
      const x = petalPos.getX(i);
      const y = petalPos.getY(i);
      const z = petalPos.getZ(i);
      const yNorm = (y + 0.48) / 0.96;
      const flare = 0.28 + yNorm * 1.12;
      const tipZone = Math.max(0, (yNorm - 0.68) / 0.32);
      const thornSpread = tipZone * (0.08 + Math.abs(x) * 0.44);
      const bend = Math.sin(yNorm * Math.PI) * 0.12;
      petalPos.setXYZ(
        i,
        x * flare + Math.sign(x || 1) * thornSpread + bend * 0.26 + y * 0.04,
        y * (0.96 + Math.abs(x) * 0.12) + (yNorm * yNorm * 0.12),
        z * (0.22 + yNorm * 0.84) - x * 0.28 - bend * 0.14
      );
    }
    petalPos.needsUpdate = true;
    petalGeometry.translate(0, 0.24, 0);
    petalGeometry.computeVertexNormals();
    petalGeometry.computeBoundingSphere();
    SIGMA_RUPTURE_BLOOM_CROWN_CACHE.petalGeometry = petalGeometry;
    SIGMA_RUPTURE_BLOOM_CROWN_CACHE.petalEdgesGeometry = safeCreateEdgesGeometry(petalGeometry, 14);

    SIGMA_RUPTURE_BLOOM_CROWN_CACHE.dominantArcGeometry = new THREE.TorusGeometry(0.96, 0.05, 10, 60, Math.PI * 1.28);
    SIGMA_RUPTURE_BLOOM_CROWN_CACHE.counterArcGeometry = new THREE.TorusGeometry(0.78, 0.04, 10, 48, Math.PI * 0.94);
    SIGMA_RUPTURE_BLOOM_CROWN_CACHE.fragmentArcGeometry = new THREE.TorusGeometry(0.56, 0.03, 8, 32, Math.PI * 0.52);

    const spikeGeometry = new THREE.ConeGeometry(0.07, 0.42, 4, 3);
    const spikePos = spikeGeometry.attributes.position;
    for (let i = 0; i < spikePos.count; i++) {
      const x = spikePos.getX(i);
      const y = spikePos.getY(i);
      const z = spikePos.getZ(i);
      const yNorm = (y + 0.21) / 0.42;
      const taper = 0.8 - yNorm * 0.48;
      const tipLean = yNorm * 0.16;
      spikePos.setXYZ(
        i,
        x * taper + tipLean,
        y * 1.08,
        z * taper - tipLean * 0.34
      );
    }
    spikePos.needsUpdate = true;
    spikeGeometry.translate(0, 0.2, 0);
    spikeGeometry.computeVertexNormals();
    spikeGeometry.computeBoundingSphere();
    SIGMA_RUPTURE_BLOOM_CROWN_CACHE.spikeGeometry = spikeGeometry;

    const dustPositions = [];
    const dustCount = 30;
    for (let i = 0; i < dustCount; i++) {
      const angle = (i / dustCount) * Math.PI * 2;
      const radius = 0.44 + Math.sin(i * 1.28) * 0.1 + ((i % 4) * 0.03);
      dustPositions.push(
        Math.cos(angle) * radius + Math.sin(i * 0.56) * 0.06,
        -0.08 + ((i % 8) * 0.1),
        Math.sin(angle * 1.22) * radius * 0.9
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();
    SIGMA_RUPTURE_BLOOM_CROWN_CACHE.dustGeometry = dustGeometry;

    const glowGeometry = new THREE.IcosahedronGeometry(0.62, 0);
    glowGeometry.scale(1.12, 1.3, 1.04);
    glowGeometry.computeBoundingSphere();
    SIGMA_RUPTURE_BLOOM_CROWN_CACHE.glowGeometry = glowGeometry;
  }

  return SIGMA_RUPTURE_BLOOM_CROWN_CACHE;
}

function _getSigmaRuptureBloomCrownMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0x00ffee;
  if (SIGMA_RUPTURE_BLOOM_CROWN_MATERIALS.has(colorHex)) return SIGMA_RUPTURE_BLOOM_CROWN_MATERIALS.get(colorHex);

  const sigmaColor = new THREE.Color(colorHex);
  const whiteColor = new THREE.Color(0xf6ffff);
  const mintColor = new THREE.Color(0x9effea);
  const cyanColor = new THREE.Color(0x7be7ff);
  const fractureAccent = new THREE.Color(0xff8fd4);
  const deepColor = new THREE.Color(0x0a1720);

  const petalColorA = whiteColor.clone().lerp(mintColor, 0.22).lerp(sigmaColor, 0.1);
  const petalColorB = mintColor.clone().lerp(cyanColor, 0.18).lerp(fractureAccent, 0.03);
  const arcColor = whiteColor.clone().lerp(mintColor, 0.34);

  const seedMat = new THREE.MeshStandardMaterial({
    color: whiteColor.clone().lerp(mintColor, 0.14),
    emissive: whiteColor.clone().lerp(sigmaColor, 0.34),
    emissiveIntensity: 0.32,
    metalness: 0.58,
    roughness: 0.16,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: deepColor.clone().lerp(fractureAccent, 0.07),
    transparent: true,
    opacity: 0.88,
    depthWrite: false
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: whiteColor.clone().lerp(cyanColor, 0.22),
    transparent: true,
    opacity: 0.34,
    depthWrite: false
  });

  const petalMatA = new THREE.MeshStandardMaterial({
    color: petalColorA,
    emissive: sigmaColor.clone().lerp(mintColor, 0.24),
    emissiveIntensity: 0.2,
    metalness: 0.62,
    roughness: 0.22,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const petalMatB = new THREE.MeshStandardMaterial({
    color: petalColorB,
    emissive: cyanColor.clone().lerp(sigmaColor, 0.28).lerp(fractureAccent, 0.03),
    emissiveIntensity: 0.22,
    metalness: 0.54,
    roughness: 0.24,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const arcMatA = new THREE.MeshBasicMaterial({
    color: arcColor.clone().lerp(cyanColor, 0.12),
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  });

  const arcMatB = new THREE.MeshBasicMaterial({
    color: cyanColor.clone().lerp(mintColor, 0.22).lerp(fractureAccent, 0.03),
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  });

  const spikeMat = new THREE.MeshStandardMaterial({
    color: whiteColor.clone().lerp(mintColor, 0.24),
    emissive: cyanColor.clone().lerp(sigmaColor, 0.24),
    emissiveIntensity: 0.26,
    metalness: 0.5,
    roughness: 0.22,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const echoMat = new THREE.MeshBasicMaterial({
    color: whiteColor.clone().lerp(fractureAccent, 0.08),
    transparent: true,
    opacity: 0.1,
    depthWrite: false
  });

  const dustMat = new THREE.PointsMaterial({
    color: mintColor.clone().lerp(fractureAccent, 0.06),
    size: 0.042,
    transparent: true,
    opacity: 0.54,
    depthWrite: false,
    sizeAttenuation: true
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: whiteColor.clone().lerp(mintColor, 0.28).lerp(fractureAccent, 0.04),
    transparent: true,
    opacity: 0.1,
    depthWrite: false
  });

  const mats = {
    seedMat,
    seamMat,
    edgeMat,
    petalMatA,
    petalMatB,
    arcMatA,
    arcMatB,
    spikeMat,
    echoMat,
    dustMat,
    glowMat
  };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  SIGMA_RUPTURE_BLOOM_CROWN_MATERIALS.set(colorHex, mats);
  return mats;
}

// ---------- EMOTIONAL v2 helpers ----------
function _getEmotionalV2Geometries() {
  if (!EMO_V2_CACHE.coreGeometry) {
    EMO_V2_CACHE.coreGeometry = new THREE.IcosahedronGeometry(0.6, 0);
    EMO_V2_CACHE.coreGeometry.computeBoundingSphere();
    EMO_V2_CACHE.shellGeometry = new THREE.IcosahedronGeometry(0.68, 0);
    EMO_V2_CACHE.edgesGeometry = new THREE.EdgesGeometry(EMO_V2_CACHE.coreGeometry, 10);
    EMO_V2_CACHE.tendrilGeometry = new THREE.BoxGeometry(0.08, 0.55, 0.08);
    EMO_V2_CACHE.fragmentGeometry = new THREE.TetrahedronGeometry(0.12, 0);

    const particlePositions = [];
    const particleCount = 200;
    for (let i = 0; i < particleCount; i++) {
      const r = 0.8 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.7; // hemisphere bias
      const x = r * Math.sin(phi) * Math.cos(theta) + 0.18; // bias to one side
      const y = (Math.random() - 0.5) * 0.6;
      const z = r * Math.sin(phi) * Math.sin(theta);
      particlePositions.push(x, y, z);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
    EMO_V2_CACHE.particlesGeometry = particleGeo;
  }
  return EMO_V2_CACHE;
}

function _getEmotionalV2Materials(color) {
  const colorHex = typeof color === 'number' ? color : 0xff4488;
  if (EMO_V2_MATERIALS.has(colorHex)) return EMO_V2_MATERIALS.get(colorHex);

  const coreMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.2,
    roughness: 0.45,
    emissive: 0xff66aa,
    emissiveIntensity: 0.5
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x66f0ff,
    transparent: true,
    opacity: 0.25,
    depthWrite: false
  });

  const shellAMat = new THREE.MeshBasicMaterial({
    color: 0xff66cc,
    transparent: true,
    opacity: 0.15,
    depthWrite: false
  });

  const shellBMat = new THREE.MeshBasicMaterial({
    color: 0x66d5ff,
    transparent: true,
    opacity: 0.1,
    depthWrite: false
  });

  const tendrilMat = new THREE.MeshBasicMaterial({
    color: 0xff55aa,
    transparent: true,
    opacity: 0.6,
    depthWrite: false
  });

  const fragmentMat = new THREE.MeshBasicMaterial({
    color: 0xff99c2,
    transparent: true,
    opacity: 0.5,
    depthWrite: false
  });

  const particleMat = new THREE.PointsMaterial({
    color: 0xff88bb,
    size: 0.05,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    sizeAttenuation: true
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: 0xffaacd,
    transparent: true,
    opacity: 0.55
  });

  const mats = { coreMat, glowMat, shellAMat, shellBMat, tendrilMat, fragmentMat, particleMat, edgeMat };
  EMO_V2_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getEmotionalNeuralLobeGeometries() {
  if (!EMO_NEURAL_LOBE_CACHE.lobeGeometry) {
    const lobeGeometry = new THREE.IcosahedronGeometry(0.28, 1);
    const lobePos = lobeGeometry.attributes.position;
    for (let i = 0; i < lobePos.count; i++) {
      const x = lobePos.getX(i);
      const y = lobePos.getY(i);
      const z = lobePos.getZ(i);
      const bias = Math.sin((x + z) * 9.0) * 0.014;
      lobePos.setXYZ(
        i,
        x * 1.08 + y * 0.04,
        y * 0.86 + bias,
        z * 1.16 - x * 0.03
      );
    }
    lobePos.needsUpdate = true;
    lobeGeometry.computeVertexNormals();
    lobeGeometry.computeBoundingSphere();
    EMO_NEURAL_LOBE_CACHE.lobeGeometry = lobeGeometry;
    EMO_NEURAL_LOBE_CACHE.lobeEdgesGeometry = safeCreateEdgesGeometry(lobeGeometry, 12);

    const nucleusGeometry = new THREE.OctahedronGeometry(0.14, 0);
    nucleusGeometry.scale(0.72, 1.22, 0.72);
    nucleusGeometry.computeBoundingSphere();
    EMO_NEURAL_LOBE_CACHE.nucleusGeometry = nucleusGeometry;

    const seamGeometry = new THREE.BoxGeometry(0.08, 0.56, 0.16, 1, 1, 1);
    const seamPos = seamGeometry.attributes.position;
    for (let i = 0; i < seamPos.count; i++) {
      const x = seamPos.getX(i);
      const y = seamPos.getY(i);
      const z = seamPos.getZ(i);
      seamPos.setXYZ(
        i,
        x * (0.84 + Math.abs(y) * 0.18),
        y * 1.02,
        z * 0.88 + x * 0.1
      );
    }
    seamPos.needsUpdate = true;
    seamGeometry.computeVertexNormals();
    seamGeometry.computeBoundingSphere();
    EMO_NEURAL_LOBE_CACHE.seamGeometry = seamGeometry;

    const membraneGeometryA = new THREE.SphereGeometry(
      0.78,
      28,
      18,
      Math.PI * 0.56,
      Math.PI * 0.98,
      Math.PI * 0.18,
      Math.PI * 0.7
    );
    const memAPos = membraneGeometryA.attributes.position;
    for (let i = 0; i < memAPos.count; i++) {
      const x = memAPos.getX(i);
      const y = memAPos.getY(i);
      const z = memAPos.getZ(i);
      memAPos.setXYZ(i, x * 1.04 + z * 0.08, y * 0.82, z * 0.92 - x * 0.04);
    }
    memAPos.needsUpdate = true;
    membraneGeometryA.computeVertexNormals();
    membraneGeometryA.computeBoundingSphere();
    EMO_NEURAL_LOBE_CACHE.membraneGeometryA = membraneGeometryA;
    EMO_NEURAL_LOBE_CACHE.membraneEdgesGeometryA = safeCreateEdgesGeometry(membraneGeometryA, 12);

    const membraneGeometryB = new THREE.SphereGeometry(
      0.74,
      24,
      16,
      Math.PI * 0.02,
      Math.PI * 1.06,
      Math.PI * 0.36,
      Math.PI * 0.54
    );
    const memBPos = membraneGeometryB.attributes.position;
    for (let i = 0; i < memBPos.count; i++) {
      const x = memBPos.getX(i);
      const y = memBPos.getY(i);
      const z = memBPos.getZ(i);
      memBPos.setXYZ(i, x * 0.94 - z * 0.06, y * 0.96, z * 1.06 + x * 0.05);
    }
    memBPos.needsUpdate = true;
    membraneGeometryB.computeVertexNormals();
    membraneGeometryB.computeBoundingSphere();
    EMO_NEURAL_LOBE_CACHE.membraneGeometryB = membraneGeometryB;
    EMO_NEURAL_LOBE_CACHE.membraneEdgesGeometryB = safeCreateEdgesGeometry(membraneGeometryB, 12);

    const filamentCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.52, -0.12, 0.58),
      new THREE.Vector3(-0.34, -0.02, 0.4),
      new THREE.Vector3(-0.18, 0.12, 0.2),
      new THREE.Vector3(-0.06, 0.08, 0.06)
    ]);
    const filamentGeometry = new THREE.TubeGeometry(filamentCurve, 30, 0.018, 6, false);
    filamentGeometry.computeBoundingSphere();
    EMO_NEURAL_LOBE_CACHE.filamentGeometry = filamentGeometry;

    const filamentLongCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.74, -0.16, 0.7),
      new THREE.Vector3(-0.48, -0.04, 0.46),
      new THREE.Vector3(-0.22, 0.1, 0.22),
      new THREE.Vector3(-0.02, 0.06, 0.04)
    ]);
    const filamentLongGeometry = new THREE.TubeGeometry(filamentLongCurve, 34, 0.014, 6, false);
    filamentLongGeometry.computeBoundingSphere();
    EMO_NEURAL_LOBE_CACHE.filamentLongGeometry = filamentLongGeometry;

    const anchorGeometry = new THREE.OctahedronGeometry(0.08, 0);
    anchorGeometry.scale(0.7, 1.24, 0.7);
    anchorGeometry.computeBoundingSphere();
    EMO_NEURAL_LOBE_CACHE.anchorGeometry = anchorGeometry;
    EMO_NEURAL_LOBE_CACHE.anchorEdgesGeometry = safeCreateEdgesGeometry(anchorGeometry, 10);

    const mistPositions = [];
    const mistCount = 54;
    for (let i = 0; i < mistCount; i++) {
      const t = i / mistCount;
      const angle = t * Math.PI * 2;
      const radius = 0.84 + Math.sin(i * 1.37) * 0.09;
      mistPositions.push(
        Math.cos(angle) * radius * 0.72 + 0.08,
        Math.sin(i * 0.93) * 0.26,
        Math.sin(angle) * radius * 0.54
      );
    }
    const mistGeometry = new THREE.BufferGeometry();
    mistGeometry.setAttribute('position', new THREE.Float32BufferAttribute(mistPositions, 3));
    mistGeometry.computeBoundingSphere();
    EMO_NEURAL_LOBE_CACHE.mistGeometry = mistGeometry;

    const achePositions = [];
    const acheCount = 32;
    for (let i = 0; i < acheCount; i++) {
      const t = i / acheCount;
      const angle = t * Math.PI * 2;
      const radius = 0.42 + Math.sin(i * 1.11) * 0.06;
      achePositions.push(
        Math.cos(angle) * radius * 0.62 - 0.12,
        -0.08 + Math.sin(i * 1.38) * 0.12,
        Math.sin(angle) * radius * 0.4 + 0.06
      );
    }
    const acheGeometry = new THREE.BufferGeometry();
    acheGeometry.setAttribute('position', new THREE.Float32BufferAttribute(achePositions, 3));
    acheGeometry.computeBoundingSphere();
    EMO_NEURAL_LOBE_CACHE.acheGeometry = acheGeometry;
  }

  return EMO_NEURAL_LOBE_CACHE;
}

function _getEmotionalNeuralLobeMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0xff4488;
  if (EMO_NEURAL_LOBE_MATERIALS.has(colorHex)) return EMO_NEURAL_LOBE_MATERIALS.get(colorHex);

  const emotionalColor = new THREE.Color(colorHex);
  const cyanColor = new THREE.Color(0x86e8ff).lerp(emotionalColor, 0.18);
  const roseColor = new THREE.Color(0xff9fcf).lerp(emotionalColor, 0.42);
  const violetColor = new THREE.Color(0x8a77ff).lerp(emotionalColor, 0.2);
  const darkColor = new THREE.Color(0x120d1e).lerp(violetColor, 0.12);

  const lobeMatA = new THREE.MeshStandardMaterial({
    color: cyanColor.clone().lerp(violetColor, 0.28),
    emissive: new THREE.Color(0x5fdfff),
    emissiveIntensity: 0.22,
    metalness: 0.32,
    roughness: 0.38,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const lobeMatB = new THREE.MeshStandardMaterial({
    color: roseColor.clone().lerp(violetColor, 0.26),
    emissive: new THREE.Color(0xff8dc4),
    emissiveIntensity: 0.18,
    metalness: 0.26,
    roughness: 0.42,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const nucleusMat = new THREE.MeshPhysicalMaterial({
    color: cyanColor.clone().lerp(roseColor, 0.34).lerp(new THREE.Color(0xffffff), 0.22),
    emissive: new THREE.Color(0xffd6f0),
    emissiveIntensity: 0.5,
    metalness: 0.52,
    roughness: 0.12,
    transmission: 0,
    thickness: 0.18,
    ior: 1.4,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: darkColor,
    transparent: true,
    opacity: 0.94,
    depthWrite: false
  });

  const membraneMatA = new THREE.MeshBasicMaterial({
    color: cyanColor.clone().lerp(new THREE.Color(0xffffff), 0.18),
    transparent: true,
    opacity: 0.11,
    depthWrite: false
  });

  const membraneMatB = new THREE.MeshBasicMaterial({
    color: roseColor.clone().lerp(new THREE.Color(0xffffff), 0.1),
    transparent: true,
    opacity: 0.095,
    depthWrite: false
  });

  const filamentMat = new THREE.MeshBasicMaterial({
    color: roseColor.clone().lerp(violetColor, 0.34),
    transparent: true,
    opacity: 0.26,
    depthWrite: false
  });

  const anchorMat = new THREE.MeshStandardMaterial({
    color: violetColor.clone().lerp(cyanColor, 0.2),
    emissive: roseColor.clone().multiplyScalar(0.72),
    emissiveIntensity: 0.16,
    metalness: 0.34,
    roughness: 0.36,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xf7efff),
    transparent: true,
    opacity: 0.72,
    depthWrite: false
  });

  const mistMat = new THREE.PointsMaterial({
    color: roseColor.clone().lerp(cyanColor, 0.24),
    size: 0.042,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
    sizeAttenuation: true
  });

  const acheMat = new THREE.PointsMaterial({
    color: violetColor.clone().lerp(roseColor, 0.36),
    size: 0.032,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    sizeAttenuation: true
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: roseColor.clone().lerp(cyanColor, 0.5).lerp(new THREE.Color(0xffffff), 0.08),
    transparent: true,
    opacity: 0.14,
    depthWrite: false
  });

  const mats = {
    lobeMatA,
    lobeMatB,
    nucleusMat,
    seamMat,
    membraneMatA,
    membraneMatB,
    filamentMat,
    anchorMat,
    edgeMat,
    mistMat,
    acheMat,
    glowMat
  };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  EMO_NEURAL_LOBE_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getEmotionalBloomingGemGeometries() {
  if (!EMO_BLOOMING_GEM_CACHE.coreGeometry) {
    const coreGeometry = new THREE.OctahedronGeometry(0.28, 1);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const tangle = Math.sin((x - z) * 8.2) * 0.018;
      corePos.setXYZ(
        i,
        x * 1.14 + y * 0.08 + tangle,
        y * 0.92 + Math.abs(x) * 0.04,
        z * 0.88 - x * 0.12
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    EMO_BLOOMING_GEM_CACHE.coreGeometry = coreGeometry;
    EMO_BLOOMING_GEM_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 12);

    const nucleusGeometry = new THREE.TetrahedronGeometry(0.15, 0);
    nucleusGeometry.scale(0.78, 1.22, 0.72);
    nucleusGeometry.rotateZ(0.22);
    nucleusGeometry.computeBoundingSphere();
    EMO_BLOOMING_GEM_CACHE.nucleusGeometry = nucleusGeometry;

    const seamGeometry = new THREE.BoxGeometry(0.07, 0.5, 0.14, 1, 1, 1);
    const seamPos = seamGeometry.attributes.position;
    for (let i = 0; i < seamPos.count; i++) {
      const x = seamPos.getX(i);
      const y = seamPos.getY(i);
      const z = seamPos.getZ(i);
      seamPos.setXYZ(
        i,
        x * (0.72 + Math.abs(y) * 0.36),
        y * 1.02,
        z * 0.76 + x * 0.18
      );
    }
    seamPos.needsUpdate = true;
    seamGeometry.computeVertexNormals();
    seamGeometry.computeBoundingSphere();
    EMO_BLOOMING_GEM_CACHE.seamGeometry = seamGeometry;

    const cageGeometry = new THREE.OctahedronGeometry(0.38, 0);
    const cagePos = cageGeometry.attributes.position;
    for (let i = 0; i < cagePos.count; i++) {
      const x = cagePos.getX(i);
      const y = cagePos.getY(i);
      const z = cagePos.getZ(i);
      cagePos.setXYZ(
        i,
        x * 1.06 + z * 0.08,
        y * 1.16 + Math.sign(y || 1) * 0.04,
        z * 0.9 - x * 0.1
      );
    }
    cagePos.needsUpdate = true;
    cageGeometry.computeVertexNormals();
    cageGeometry.computeBoundingSphere();
    EMO_BLOOMING_GEM_CACHE.cageGeometry = cageGeometry;
    EMO_BLOOMING_GEM_CACHE.cageEdgesGeometry = safeCreateEdgesGeometry(cageGeometry, 8);

    const petalGeometry = new THREE.CylinderGeometry(0.02, 0.19, 0.68, 5, 3, false);
    const petalPos = petalGeometry.attributes.position;
    for (let i = 0; i < petalPos.count; i++) {
      const x = petalPos.getX(i);
      const y = petalPos.getY(i);
      const z = petalPos.getZ(i);
      const yNorm = (y + 0.34) / 0.68;
      const swell = 0.46 + yNorm * 1.28;
      const bend = Math.sin(yNorm * Math.PI) * 0.08;
      petalPos.setXYZ(
        i,
        x * swell + bend,
        y * 1.04 + Math.cos((x + z) * 9.0) * 0.012,
        z * (0.26 + yNorm * 0.72) - bend * 0.34
      );
    }
    petalPos.needsUpdate = true;
    petalGeometry.translate(0, 0.28, 0);
    petalGeometry.computeVertexNormals();
    petalGeometry.computeBoundingSphere();
    EMO_BLOOMING_GEM_CACHE.petalGeometry = petalGeometry;
    EMO_BLOOMING_GEM_CACHE.petalEdgesGeometry = safeCreateEdgesGeometry(petalGeometry, 16);

    const ghostPetalGeometry = petalGeometry.clone();
    const ghostPos = ghostPetalGeometry.attributes.position;
    for (let i = 0; i < ghostPos.count; i++) {
      const x = ghostPos.getX(i);
      const y = ghostPos.getY(i);
      const z = ghostPos.getZ(i);
      ghostPos.setXYZ(
        i,
        x * 0.78 - z * 0.14,
        y * 1.06,
        z * 0.7 + x * 0.1
      );
    }
    ghostPos.needsUpdate = true;
    ghostPetalGeometry.computeVertexNormals();
    ghostPetalGeometry.computeBoundingSphere();
    EMO_BLOOMING_GEM_CACHE.ghostPetalGeometry = ghostPetalGeometry;
    EMO_BLOOMING_GEM_CACHE.ghostPetalEdgesGeometry = safeCreateEdgesGeometry(ghostPetalGeometry, 16);

    const pollenPositions = [];
    const pollenCount = 48;
    for (let i = 0; i < pollenCount; i++) {
      const t = i / pollenCount;
      const angle = t * Math.PI * 2;
      const radius = 0.54 + Math.sin(i * 1.41) * 0.18;
      pollenPositions.push(
        Math.cos(angle) * radius * (0.88 + Math.sin(i * 0.37) * 0.16) - 0.04,
        Math.sin(i * 1.27) * 0.34 + Math.cos(angle * 2.0) * 0.08,
        Math.sin(angle) * radius * 0.66 + 0.06
      );
    }
    const pollenGeometry = new THREE.BufferGeometry();
    pollenGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pollenPositions, 3));
    pollenGeometry.computeBoundingSphere();
    EMO_BLOOMING_GEM_CACHE.pollenGeometry = pollenGeometry;
  }

  return EMO_BLOOMING_GEM_CACHE;
}

function _getEmotionalBloomingGemMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0xff6699;
  if (EMO_BLOOMING_GEM_MATERIALS.has(colorHex)) return EMO_BLOOMING_GEM_MATERIALS.get(colorHex);

  const emotionalColor = new THREE.Color(colorHex);
  const cyanColor = new THREE.Color(0x92f2ff).lerp(emotionalColor, 0.16);
  const roseColor = new THREE.Color(0xffaedc).lerp(emotionalColor, 0.34);
  const violetColor = new THREE.Color(0x9176ff).lerp(emotionalColor, 0.24);
  const paleColor = new THREE.Color(0xfef8ff).lerp(cyanColor, 0.12);
  const bruiseColor = new THREE.Color(0x180d27).lerp(violetColor, 0.16);

  const coreMat = new THREE.MeshStandardMaterial({
    color: violetColor.clone().lerp(roseColor, 0.32),
    emissive: roseColor.clone().lerp(cyanColor, 0.24),
    emissiveIntensity: 0.18,
    metalness: 0.34,
    roughness: 0.3,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const nucleusMat = new THREE.MeshPhysicalMaterial({
    color: paleColor.clone().lerp(roseColor, 0.18),
    emissive: new THREE.Color(0xffd8f5),
    emissiveIntensity: 0.56,
    metalness: 0.28,
    roughness: 0.08,
    transmission: 0.0,
    thickness: 0.16,
    ior: 1.36,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: bruiseColor,
    transparent: true,
    opacity: 0.92,
    depthWrite: false
  });

  const cageMat = new THREE.LineBasicMaterial({
    color: paleColor.clone().lerp(violetColor, 0.18),
    transparent: true,
    opacity: 0.64,
    depthWrite: false
  });

  const petalMatA = new THREE.MeshBasicMaterial({
    color: cyanColor.clone().lerp(paleColor, 0.22),
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  });

  const petalMatB = new THREE.MeshBasicMaterial({
    color: roseColor.clone().lerp(paleColor, 0.16),
    transparent: true,
    opacity: 0.16,
    depthWrite: false
  });

  const petalMatC = new THREE.MeshBasicMaterial({
    color: violetColor.clone().lerp(roseColor, 0.28),
    transparent: true,
    opacity: 0.15,
    depthWrite: false
  });

  const petalEdgeMat = new THREE.LineBasicMaterial({
    color: paleColor.clone().lerp(roseColor, 0.12),
    transparent: true,
    opacity: 0.46,
    depthWrite: false
  });

  const ghostMat = new THREE.MeshBasicMaterial({
    color: paleColor.clone().lerp(cyanColor, 0.18),
    transparent: true,
    opacity: 0.075,
    depthWrite: false
  });

  const ghostEdgeMat = new THREE.LineBasicMaterial({
    color: paleColor.clone().lerp(violetColor, 0.08),
    transparent: true,
    opacity: 0.28,
    depthWrite: false
  });

  const pollenMat = new THREE.PointsMaterial({
    color: roseColor.clone().lerp(cyanColor, 0.42),
    size: 0.04,
    transparent: true,
    opacity: 0.54,
    depthWrite: false,
    sizeAttenuation: true
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: roseColor.clone().lerp(cyanColor, 0.5).lerp(new THREE.Color(0xffffff), 0.1),
    transparent: true,
    opacity: 0.14,
    depthWrite: false
  });

  const mats = {
    coreMat,
    nucleusMat,
    seamMat,
    cageMat,
    petalMatA,
    petalMatB,
    petalMatC,
    petalEdgeMat,
    ghostMat,
    ghostEdgeMat,
    pollenMat,
    glowMat
  };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  EMO_BLOOMING_GEM_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getEmotionalTearShapedGeometries() {
  if (!EMO_TEAR_SHAPED_CACHE.coreGeometry) {
    const coreGeometry = new THREE.OctahedronGeometry(0.3, 1);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const uplift = Math.max(0, y) * 0.16;
      corePos.setXYZ(
        i,
        x * 1.1 + z * 0.08,
        y * 0.94 + uplift + Math.sin((x - z) * 7.2) * 0.012,
        z * 0.84 - x * 0.14
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    EMO_TEAR_SHAPED_CACHE.coreGeometry = coreGeometry;
    EMO_TEAR_SHAPED_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 12);

    const seedGeometry = new THREE.TetrahedronGeometry(0.14, 0);
    seedGeometry.scale(0.8, 1.26, 0.72);
    seedGeometry.rotateZ(0.34);
    seedGeometry.computeBoundingSphere();
    EMO_TEAR_SHAPED_CACHE.seedGeometry = seedGeometry;

    const seamGeometry = new THREE.BoxGeometry(0.06, 0.46, 0.12, 1, 1, 1);
    const seamPos = seamGeometry.attributes.position;
    for (let i = 0; i < seamPos.count; i++) {
      const x = seamPos.getX(i);
      const y = seamPos.getY(i);
      const z = seamPos.getZ(i);
      seamPos.setXYZ(
        i,
        x * (0.68 + Math.abs(y) * 0.34) + y * 0.05,
        y * 1.04,
        z * 0.74 + x * 0.18
      );
    }
    seamPos.needsUpdate = true;
    seamGeometry.computeVertexNormals();
    seamGeometry.computeBoundingSphere();
    EMO_TEAR_SHAPED_CACHE.seamGeometry = seamGeometry;

    const cageGeometry = new THREE.OctahedronGeometry(0.38, 0);
    const cagePos = cageGeometry.attributes.position;
    for (let i = 0; i < cagePos.count; i++) {
      const x = cagePos.getX(i);
      const y = cagePos.getY(i);
      const z = cagePos.getZ(i);
      cagePos.setXYZ(
        i,
        x * 1.04 + z * 0.1,
        y * 1.22 + Math.sign(y || 1) * 0.05,
        z * 0.86 - x * 0.08
      );
    }
    cagePos.needsUpdate = true;
    cageGeometry.computeVertexNormals();
    cageGeometry.computeBoundingSphere();
    EMO_TEAR_SHAPED_CACHE.cageGeometry = cageGeometry;
    EMO_TEAR_SHAPED_CACHE.cageEdgesGeometry = safeCreateEdgesGeometry(cageGeometry, 8);

    const fanGeometry = new THREE.CylinderGeometry(0.018, 0.2, 0.84, 4, 3, false);
    const fanPos = fanGeometry.attributes.position;
    for (let i = 0; i < fanPos.count; i++) {
      const x = fanPos.getX(i);
      const y = fanPos.getY(i);
      const z = fanPos.getZ(i);
      const yNorm = (y + 0.42) / 0.84;
      const flare = 0.42 + yNorm * 1.3;
      const sweep = Math.sin(yNorm * Math.PI) * 0.12;
      fanPos.setXYZ(
        i,
        x * flare + sweep,
        y * 1.06 + Math.cos((x + z) * 10.0) * 0.01,
        z * (0.22 + yNorm * 0.7) - sweep * 0.28
      );
    }
    fanPos.needsUpdate = true;
    fanGeometry.translate(0, 0.34, 0);
    fanGeometry.computeVertexNormals();
    fanGeometry.computeBoundingSphere();
    EMO_TEAR_SHAPED_CACHE.fanGeometry = fanGeometry;
    EMO_TEAR_SHAPED_CACHE.fanEdgesGeometry = safeCreateEdgesGeometry(fanGeometry, 16);

    const liftGeometry = fanGeometry.clone();
    const liftPos = liftGeometry.attributes.position;
    for (let i = 0; i < liftPos.count; i++) {
      const x = liftPos.getX(i);
      const y = liftPos.getY(i);
      const z = liftPos.getZ(i);
      liftPos.setXYZ(
        i,
        x * 0.72 - z * 0.12,
        y * 0.72 + 0.06,
        z * 0.56 + x * 0.08
      );
    }
    liftPos.needsUpdate = true;
    liftGeometry.computeVertexNormals();
    liftGeometry.computeBoundingSphere();
    EMO_TEAR_SHAPED_CACHE.liftGeometry = liftGeometry;
    EMO_TEAR_SHAPED_CACHE.liftEdgesGeometry = safeCreateEdgesGeometry(liftGeometry, 16);

    const dustPositions = [];
    const dustCount = 52;
    for (let i = 0; i < dustCount; i++) {
      const t = i / dustCount;
      const angle = t * Math.PI * 1.92;
      const radius = 0.48 + t * 0.44 + Math.sin(i * 1.37) * 0.08;
      dustPositions.push(
        Math.cos(angle) * radius * 0.68 - 0.06,
        -0.18 + t * 1.04 + Math.sin(i * 0.94) * 0.08,
        Math.sin(angle) * radius * 0.42 + 0.04
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();
    EMO_TEAR_SHAPED_CACHE.dustGeometry = dustGeometry;
  }

  return EMO_TEAR_SHAPED_CACHE;
}

function _getEmotionalTearShapedMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0xff77bb;
  if (EMO_TEAR_SHAPED_MATERIALS.has(colorHex)) return EMO_TEAR_SHAPED_MATERIALS.get(colorHex);

  const emotionalColor = new THREE.Color(colorHex);
  const cyanColor = new THREE.Color(0xa8f7ff).lerp(emotionalColor, 0.12);
  const roseColor = new THREE.Color(0xffbddf).lerp(emotionalColor, 0.24);
  const violetColor = new THREE.Color(0xa08aff).lerp(emotionalColor, 0.16);
  const paleColor = new THREE.Color(0xffffff).lerp(cyanColor, 0.08);
  const seamColor = roseColor.clone().lerp(paleColor, 0.4);

  const coreMat = new THREE.MeshPhysicalMaterial({
    color: cyanColor.clone().lerp(roseColor, 0.18).lerp(paleColor, 0.12),
    emissive: paleColor.clone().lerp(roseColor, 0.24),
    emissiveIntensity: 0.34,
    metalness: 0.28,
    roughness: 0.16,
    transmission: 0.0,
    thickness: 0.16,
    ior: 1.36,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seedMat = new THREE.MeshPhysicalMaterial({
    color: paleColor.clone().lerp(roseColor, 0.12),
    emissive: paleColor.clone().lerp(cyanColor, 0.2),
    emissiveIntensity: 0.76,
    metalness: 0.18,
    roughness: 0.08,
    transmission: 0.0,
    thickness: 0.1,
    ior: 1.32,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: seamColor,
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  });

  const cageMat = new THREE.LineBasicMaterial({
    color: paleColor.clone().lerp(cyanColor, 0.1),
    transparent: true,
    opacity: 0.62,
    depthWrite: false
  });

  const wingMatA = new THREE.MeshBasicMaterial({
    color: cyanColor.clone().lerp(paleColor, 0.16),
    transparent: true,
    opacity: 0.21,
    depthWrite: false
  });

  const wingMatB = new THREE.MeshBasicMaterial({
    color: roseColor.clone().lerp(paleColor, 0.18),
    transparent: true,
    opacity: 0.2,
    depthWrite: false
  });

  const wingMatC = new THREE.MeshBasicMaterial({
    color: violetColor.clone().lerp(cyanColor, 0.24),
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  });

  const wingEdgeMat = new THREE.LineBasicMaterial({
    color: paleColor.clone().lerp(roseColor, 0.1),
    transparent: true,
    opacity: 0.44,
    depthWrite: false
  });

  const liftMat = new THREE.MeshBasicMaterial({
    color: paleColor.clone().lerp(roseColor, 0.22),
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  });

  const liftEdgeMat = new THREE.LineBasicMaterial({
    color: paleColor.clone().lerp(cyanColor, 0.1),
    transparent: true,
    opacity: 0.34,
    depthWrite: false
  });

  const dustMat = new THREE.PointsMaterial({
    color: roseColor.clone().lerp(cyanColor, 0.52),
    size: 0.048,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    sizeAttenuation: true
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: paleColor.clone().lerp(roseColor, 0.14),
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  });

  const mats = {
    coreMat,
    seedMat,
    seamMat,
    cageMat,
    wingMatA,
    wingMatB,
    wingMatC,
    wingEdgeMat,
    liftMat,
    liftEdgeMat,
    dustMat,
    glowMat
  };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  EMO_TEAR_SHAPED_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getEmotionalFoldedGeometries() {
  if (!EMO_FOLDED_CACHE.coreGeometry) {
    const coreGeometry = new THREE.OctahedronGeometry(0.32, 1);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const split = Math.sin((x * 7.2) - (z * 5.8)) * 0.026;
      const strain = Math.max(0, y) * 0.12 + Math.max(0, -x) * 0.08;
      corePos.setXYZ(
        i,
        x * 1.18 + z * 0.1 + split,
        y * 0.88 + strain,
        z * 0.82 - x * 0.18 + split * 0.42
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    EMO_FOLDED_CACHE.coreGeometry = coreGeometry;
    EMO_FOLDED_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 10);

    const seedGeometry = new THREE.TetrahedronGeometry(0.14, 0);
    seedGeometry.scale(0.76, 1.3, 0.72);
    seedGeometry.rotateZ(0.42);
    seedGeometry.computeBoundingSphere();
    EMO_FOLDED_CACHE.seedGeometry = seedGeometry;

    const seamGeometry = new THREE.BoxGeometry(0.07, 0.56, 0.14, 1, 1, 1);
    const seamPos = seamGeometry.attributes.position;
    for (let i = 0; i < seamPos.count; i++) {
      const x = seamPos.getX(i);
      const y = seamPos.getY(i);
      const z = seamPos.getZ(i);
      seamPos.setXYZ(
        i,
        x * (0.62 + Math.abs(y) * 0.38) + y * 0.06,
        y * 1.04,
        z * 0.72 + x * 0.2
      );
    }
    seamPos.needsUpdate = true;
    seamGeometry.computeVertexNormals();
    seamGeometry.computeBoundingSphere();
    EMO_FOLDED_CACHE.seamGeometry = seamGeometry;

    const cageGeometry = new THREE.OctahedronGeometry(0.42, 0);
    const cagePos = cageGeometry.attributes.position;
    for (let i = 0; i < cagePos.count; i++) {
      const x = cagePos.getX(i);
      const y = cagePos.getY(i);
      const z = cagePos.getZ(i);
      cagePos.setXYZ(
        i,
        x * 1.08 + z * 0.12,
        y * 1.24 + Math.sign(y || 1) * 0.06,
        z * 0.86 - x * 0.12
      );
    }
    cagePos.needsUpdate = true;
    cageGeometry.computeVertexNormals();
    cageGeometry.computeBoundingSphere();
    EMO_FOLDED_CACHE.cageGeometry = cageGeometry;
    EMO_FOLDED_CACHE.cageEdgesGeometry = safeCreateEdgesGeometry(cageGeometry, 8);

    const shardGeometry = new THREE.CylinderGeometry(0.016, 0.19, 0.92, 4, 3, false);
    const shardPos = shardGeometry.attributes.position;
    for (let i = 0; i < shardPos.count; i++) {
      const x = shardPos.getX(i);
      const y = shardPos.getY(i);
      const z = shardPos.getZ(i);
      const yNorm = (y + 0.46) / 0.92;
      const flare = 0.34 + yNorm * 1.18;
      const fracture = Math.sin(yNorm * Math.PI) * 0.14;
      shardPos.setXYZ(
        i,
        x * flare + fracture,
        y * 1.04 + Math.cos((x - z) * 8.6) * 0.012,
        z * (0.18 + yNorm * 0.64) - fracture * 0.32
      );
    }
    shardPos.needsUpdate = true;
    shardGeometry.translate(0, 0.34, 0);
    shardGeometry.computeVertexNormals();
    shardGeometry.computeBoundingSphere();
    EMO_FOLDED_CACHE.shardGeometry = shardGeometry;
    EMO_FOLDED_CACHE.shardEdgesGeometry = safeCreateEdgesGeometry(shardGeometry, 14);

    const ghostShardGeometry = shardGeometry.clone();
    const ghostPos = ghostShardGeometry.attributes.position;
    for (let i = 0; i < ghostPos.count; i++) {
      const x = ghostPos.getX(i);
      const y = ghostPos.getY(i);
      const z = ghostPos.getZ(i);
      ghostPos.setXYZ(
        i,
        x * 0.72 - z * 0.16,
        y * 1.02,
        z * 0.58 + x * 0.14
      );
    }
    ghostPos.needsUpdate = true;
    ghostShardGeometry.computeVertexNormals();
    ghostShardGeometry.computeBoundingSphere();
    EMO_FOLDED_CACHE.ghostShardGeometry = ghostShardGeometry;
    EMO_FOLDED_CACHE.ghostShardEdgesGeometry = safeCreateEdgesGeometry(ghostShardGeometry, 14);

    const railCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.54, -0.18, 0.0),
      new THREE.Vector3(-0.18, 0.04, 0.14),
      new THREE.Vector3(0.16, 0.22, -0.08),
      new THREE.Vector3(0.56, 0.42, 0.02)
    ]);
    const railGeometry = new THREE.TubeGeometry(railCurve, 28, 0.014, 6, false);
    railGeometry.computeBoundingSphere();
    EMO_FOLDED_CACHE.railGeometry = railGeometry;
    EMO_FOLDED_CACHE.railEdgesGeometry = safeCreateEdgesGeometry(railGeometry, 18);

    const dustPositions = [];
    const dustCount = 58;
    for (let i = 0; i < dustCount; i++) {
      const t = i / dustCount;
      const angle = t * Math.PI * 2.08;
      const radius = 0.42 + t * 0.56 + Math.sin(i * 1.34) * 0.08;
      dustPositions.push(
        Math.cos(angle) * radius * 0.66 - 0.04,
        -0.2 + t * 1.02 + Math.sin(i * 1.08) * 0.1,
        Math.sin(angle) * radius * 0.38 + 0.02
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();
    EMO_FOLDED_CACHE.dustGeometry = dustGeometry;
  }

  return EMO_FOLDED_CACHE;
}

function _getEmotionalFoldedMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0xff5599;
  if (EMO_FOLDED_MATERIALS.has(colorHex)) return EMO_FOLDED_MATERIALS.get(colorHex);

  const emotionalColor = new THREE.Color(colorHex);
  const cyanColor = new THREE.Color(0x99eeff).lerp(emotionalColor, 0.12);
  const roseColor = new THREE.Color(0xff9ad1).lerp(emotionalColor, 0.28);
  const violetColor = new THREE.Color(0x8e79ff).lerp(emotionalColor, 0.16);
  const paleColor = new THREE.Color(0xf7fbff).lerp(cyanColor, 0.08);
  const bruiseColor = new THREE.Color(0x120d1f).lerp(violetColor, 0.16);

  const coreMat = new THREE.MeshPhysicalMaterial({
    color: bruiseColor.clone().lerp(violetColor, 0.34),
    emissive: roseColor.clone().lerp(cyanColor, 0.2),
    emissiveIntensity: 0.18,
    metalness: 0.38,
    roughness: 0.24,
    transmission: 0.0,
    thickness: 0.14,
    ior: 1.36,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seedMat = new THREE.MeshPhysicalMaterial({
    color: paleColor.clone().lerp(roseColor, 0.16),
    emissive: paleColor.clone().lerp(cyanColor, 0.28),
    emissiveIntensity: 0.62,
    metalness: 0.18,
    roughness: 0.1,
    transmission: 0.0,
    thickness: 0.08,
    ior: 1.3,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: bruiseColor.clone().lerp(roseColor, 0.12),
    transparent: true,
    opacity: 0.9,
    depthWrite: false
  });

  const cageMat = new THREE.LineBasicMaterial({
    color: paleColor.clone().lerp(cyanColor, 0.1),
    transparent: true,
    opacity: 0.68,
    depthWrite: false
  });

  const shardMatA = new THREE.MeshBasicMaterial({
    color: cyanColor.clone().lerp(violetColor, 0.12),
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  });

  const shardMatB = new THREE.MeshBasicMaterial({
    color: roseColor.clone().lerp(paleColor, 0.12),
    transparent: true,
    opacity: 0.16,
    depthWrite: false
  });

  const shardMatC = new THREE.MeshBasicMaterial({
    color: violetColor.clone().lerp(roseColor, 0.18),
    transparent: true,
    opacity: 0.15,
    depthWrite: false
  });

  const shardEdgeMat = new THREE.LineBasicMaterial({
    color: paleColor.clone().lerp(roseColor, 0.08),
    transparent: true,
    opacity: 0.4,
    depthWrite: false
  });

  const ghostMat = new THREE.MeshBasicMaterial({
    color: paleColor.clone().lerp(cyanColor, 0.18),
    transparent: true,
    opacity: 0.08,
    depthWrite: false
  });

  const ghostEdgeMat = new THREE.LineBasicMaterial({
    color: paleColor.clone().lerp(violetColor, 0.08),
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  });

  const railMat = new THREE.MeshBasicMaterial({
    color: cyanColor.clone().lerp(roseColor, 0.18).lerp(paleColor, 0.08),
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  });

  const railEdgeMat = new THREE.LineBasicMaterial({
    color: paleColor.clone().lerp(cyanColor, 0.14),
    transparent: true,
    opacity: 0.38,
    depthWrite: false
  });

  const dustMat = new THREE.PointsMaterial({
    color: roseColor.clone().lerp(cyanColor, 0.34),
    size: 0.042,
    transparent: true,
    opacity: 0.54,
    depthWrite: false,
    sizeAttenuation: true
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: paleColor.clone().lerp(roseColor, 0.12),
    transparent: true,
    opacity: 0.14,
    depthWrite: false
  });

  const mats = {
    coreMat,
    seedMat,
    seamMat,
    cageMat,
    shardMatA,
    shardMatB,
    shardMatC,
    shardEdgeMat,
    ghostMat,
    ghostEdgeMat,
    railMat,
    railEdgeMat,
    dustMat,
    glowMat
  };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  EMO_FOLDED_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getEmotionalHeartCrystalGeometries() {
  if (!EMO_HEART_CRYSTAL_CACHE.coreGeometry) {
    const coreGeometry = new THREE.OctahedronGeometry(0.3, 1);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const notch = Math.max(0, y) * 0.06 - Math.abs(x) * 0.02;
      corePos.setXYZ(
        i,
        x * 0.88 + z * 0.08,
        y * 1.18 + notch,
        z * 0.76 - x * 0.1
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    EMO_HEART_CRYSTAL_CACHE.coreGeometry = coreGeometry;
    EMO_HEART_CRYSTAL_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 10);

    const seedGeometry = new THREE.IcosahedronGeometry(0.12, 0);
    seedGeometry.scale(0.78, 1.28, 0.7);
    seedGeometry.rotateZ(0.32);
    seedGeometry.computeBoundingSphere();
    EMO_HEART_CRYSTAL_CACHE.seedGeometry = seedGeometry;

    const seamGeometry = new THREE.BoxGeometry(0.05, 0.42, 0.12, 1, 1, 1);
    const seamPos = seamGeometry.attributes.position;
    for (let i = 0; i < seamPos.count; i++) {
      const x = seamPos.getX(i);
      const y = seamPos.getY(i);
      const z = seamPos.getZ(i);
      seamPos.setXYZ(
        i,
        x * (0.66 + Math.abs(y) * 0.44) + y * 0.04,
        y * 1.08,
        z * 0.72 + x * 0.18
      );
    }
    seamPos.needsUpdate = true;
    seamGeometry.computeVertexNormals();
    seamGeometry.computeBoundingSphere();
    EMO_HEART_CRYSTAL_CACHE.seamGeometry = seamGeometry;

    const cageGeometry = new THREE.OctahedronGeometry(0.42, 0);
    const cagePos = cageGeometry.attributes.position;
    for (let i = 0; i < cagePos.count; i++) {
      const x = cagePos.getX(i);
      const y = cagePos.getY(i);
      const z = cagePos.getZ(i);
      cagePos.setXYZ(
        i,
        x * 0.98 + z * 0.1,
        y * 1.26 + Math.sign(y || 1) * 0.04,
        z * 0.84 - x * 0.14
      );
    }
    cagePos.needsUpdate = true;
    cageGeometry.computeVertexNormals();
    cageGeometry.computeBoundingSphere();
    EMO_HEART_CRYSTAL_CACHE.cageGeometry = cageGeometry;
    EMO_HEART_CRYSTAL_CACHE.cageEdgesGeometry = safeCreateEdgesGeometry(cageGeometry, 8);

    const shrineGeometryA = new THREE.IcosahedronGeometry(0.46, 1);
    const shrineAPos = shrineGeometryA.attributes.position;
    for (let i = 0; i < shrineAPos.count; i++) {
      const x = shrineAPos.getX(i);
      const y = shrineAPos.getY(i);
      const z = shrineAPos.getZ(i);
      const inward = x > 0 ? 0.32 : 1.06;
      shrineAPos.setXYZ(
        i,
        x * inward + Math.max(0, y) * -0.05,
        y * 1.18 + Math.abs(x) * 0.06,
        z * 0.68 + x * -0.08
      );
    }
    shrineAPos.needsUpdate = true;
    shrineGeometryA.computeVertexNormals();
    shrineGeometryA.computeBoundingSphere();
    EMO_HEART_CRYSTAL_CACHE.shrineGeometryA = shrineGeometryA;
    EMO_HEART_CRYSTAL_CACHE.shrineEdgesGeometryA = safeCreateEdgesGeometry(shrineGeometryA, 14);

    const shrineGeometryB = new THREE.IcosahedronGeometry(0.42, 1);
    const shrineBPos = shrineGeometryB.attributes.position;
    for (let i = 0; i < shrineBPos.count; i++) {
      const x = shrineBPos.getX(i);
      const y = shrineBPos.getY(i);
      const z = shrineBPos.getZ(i);
      const inward = x < 0 ? 0.3 : 1.02;
      shrineBPos.setXYZ(
        i,
        x * inward + Math.max(0, y) * 0.04,
        y * 1.08 + Math.abs(z) * 0.04,
        z * 0.74 + x * 0.06
      );
    }
    shrineBPos.needsUpdate = true;
    shrineGeometryB.computeVertexNormals();
    shrineGeometryB.computeBoundingSphere();
    EMO_HEART_CRYSTAL_CACHE.shrineGeometryB = shrineGeometryB;
    EMO_HEART_CRYSTAL_CACHE.shrineEdgesGeometryB = safeCreateEdgesGeometry(shrineGeometryB, 14);

    const witnessGeometry = new THREE.CylinderGeometry(0.016, 0.14, 0.72, 4, 3, false);
    const witnessPos = witnessGeometry.attributes.position;
    for (let i = 0; i < witnessPos.count; i++) {
      const x = witnessPos.getX(i);
      const y = witnessPos.getY(i);
      const z = witnessPos.getZ(i);
      const yNorm = (y + 0.36) / 0.72;
      const flare = 0.3 + yNorm * 1.04;
      witnessPos.setXYZ(
        i,
        x * flare + Math.sin(yNorm * Math.PI) * 0.06,
        y * 1.04,
        z * (0.18 + yNorm * 0.56) - Math.cos(yNorm * Math.PI) * 0.02
      );
    }
    witnessPos.needsUpdate = true;
    witnessGeometry.translate(0, 0.24, 0);
    witnessGeometry.computeVertexNormals();
    witnessGeometry.computeBoundingSphere();
    EMO_HEART_CRYSTAL_CACHE.witnessGeometry = witnessGeometry;
    EMO_HEART_CRYSTAL_CACHE.witnessEdgesGeometry = safeCreateEdgesGeometry(witnessGeometry, 16);

    const arcCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.44, -0.04, 0.1),
      new THREE.Vector3(-0.12, 0.18, 0.18),
      new THREE.Vector3(0.18, 0.28, -0.04),
      new THREE.Vector3(0.46, 0.14, -0.1)
    ]);
    const arcGeometry = new THREE.TubeGeometry(arcCurve, 28, 0.014, 6, false);
    arcGeometry.computeBoundingSphere();
    EMO_HEART_CRYSTAL_CACHE.arcGeometry = arcGeometry;
    EMO_HEART_CRYSTAL_CACHE.arcEdgesGeometry = safeCreateEdgesGeometry(arcGeometry, 18);

    const dustPositions = [];
    const dustCount = 52;
    for (let i = 0; i < dustCount; i++) {
      const t = i / dustCount;
      const angle = t * Math.PI * 2.2;
      const radius = 0.28 + t * 0.44 + Math.sin(i * 1.48) * 0.05;
      dustPositions.push(
        Math.cos(angle) * radius * 0.66,
        -0.18 + t * 0.82 + Math.sin(i * 0.92) * 0.06,
        Math.sin(angle) * radius * 0.42
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();
    EMO_HEART_CRYSTAL_CACHE.dustGeometry = dustGeometry;
  }

  return EMO_HEART_CRYSTAL_CACHE;
}

function _getEmotionalHeartCrystalMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0xff6fa9;
  if (EMO_HEART_CRYSTAL_MATERIALS.has(colorHex)) return EMO_HEART_CRYSTAL_MATERIALS.get(colorHex);

  const emotionalColor = new THREE.Color(colorHex);
  const cyanColor = new THREE.Color(0xc8f6ff).lerp(emotionalColor, 0.06);
  const roseColor = new THREE.Color(0xffbfdc).lerp(emotionalColor, 0.22);
  const ivoryColor = new THREE.Color(0xfff5ea).lerp(roseColor, 0.06);
  const paleColor = new THREE.Color(0xfdfeff).lerp(cyanColor, 0.08);
  const violetColor = new THREE.Color(0x8d83ff).lerp(emotionalColor, 0.1);
  const seamColor = new THREE.Color(0x2b1e38).lerp(violetColor, 0.18).lerp(roseColor, 0.06);

  const coreMat = new THREE.MeshPhysicalMaterial({
    color: ivoryColor.clone().lerp(roseColor, 0.18),
    emissive: paleColor.clone().lerp(cyanColor, 0.18),
    emissiveIntensity: 0.24,
    metalness: 0.14,
    roughness: 0.18,
    transmission: 0.0,
    thickness: 0.12,
    ior: 1.28,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seedMat = new THREE.MeshPhysicalMaterial({
    color: paleColor.clone().lerp(ivoryColor, 0.18),
    emissive: paleColor.clone().lerp(roseColor, 0.12),
    emissiveIntensity: 0.74,
    metalness: 0.08,
    roughness: 0.06,
    transmission: 0.0,
    thickness: 0.06,
    ior: 1.26,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: seamColor,
    transparent: true,
    opacity: 0.76,
    depthWrite: false
  });

  const cageMat = new THREE.LineBasicMaterial({
    color: paleColor.clone().lerp(cyanColor, 0.12),
    transparent: true,
    opacity: 0.62,
    depthWrite: false
  });

  const shrineMatA = new THREE.MeshBasicMaterial({
    color: cyanColor.clone().lerp(ivoryColor, 0.18),
    transparent: true,
    opacity: 0.16,
    depthWrite: false
  });

  const shrineMatB = new THREE.MeshBasicMaterial({
    color: roseColor.clone().lerp(ivoryColor, 0.2),
    transparent: true,
    opacity: 0.14,
    depthWrite: false
  });

  const shrineEdgeMat = new THREE.LineBasicMaterial({
    color: paleColor.clone().lerp(roseColor, 0.08),
    transparent: true,
    opacity: 0.34,
    depthWrite: false
  });

  const witnessMat = new THREE.MeshBasicMaterial({
    color: ivoryColor.clone().lerp(cyanColor, 0.1),
    transparent: true,
    opacity: 0.16,
    depthWrite: false
  });

  const witnessEdgeMat = new THREE.LineBasicMaterial({
    color: paleColor.clone().lerp(cyanColor, 0.14),
    transparent: true,
    opacity: 0.3,
    depthWrite: false
  });

  const arcMat = new THREE.MeshBasicMaterial({
    color: roseColor.clone().lerp(paleColor, 0.18),
    transparent: true,
    opacity: 0.12,
    depthWrite: false
  });

  const arcEdgeMat = new THREE.LineBasicMaterial({
    color: paleColor.clone().lerp(violetColor, 0.04),
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  });

  const dustMat = new THREE.PointsMaterial({
    color: ivoryColor.clone().lerp(roseColor, 0.1),
    size: 0.04,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
    sizeAttenuation: true
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: paleColor.clone().lerp(roseColor, 0.08),
    transparent: true,
    opacity: 0.14,
    depthWrite: false
  });

  const mats = {
    coreMat,
    seedMat,
    seamMat,
    cageMat,
    shrineMatA,
    shrineMatB,
    shrineEdgeMat,
    witnessMat,
    witnessEdgeMat,
    arcMat,
    arcEdgeMat,
    dustMat,
    glowMat
  };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  EMO_HEART_CRYSTAL_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getEmotionalSymmetricSeedGeometries() {
  if (!EMO_SYMMETRIC_SEED_CACHE.coreGeometry) {
    const coreGeometry = new THREE.IcosahedronGeometry(0.32, 1);
    const corePos = coreGeometry.attributes.position;
    for (let i = 0; i < corePos.count; i++) {
      const x = corePos.getX(i);
      const y = corePos.getY(i);
      const z = corePos.getZ(i);
      const lift = Math.max(0, y) * 0.1;
      const taper = 1.0 - Math.max(0, -y) * 0.22;
      corePos.setXYZ(
        i,
        x * 0.9 * taper + z * 0.06,
        y * 1.26 + lift,
        z * 0.76 * taper - x * 0.08
      );
    }
    corePos.needsUpdate = true;
    coreGeometry.computeVertexNormals();
    coreGeometry.computeBoundingSphere();
    EMO_SYMMETRIC_SEED_CACHE.coreGeometry = coreGeometry;
    EMO_SYMMETRIC_SEED_CACHE.coreEdgesGeometry = safeCreateEdgesGeometry(coreGeometry, 10);

    const seedGeometry = new THREE.OctahedronGeometry(0.14, 0);
    seedGeometry.scale(0.72, 1.44, 0.68);
    seedGeometry.rotateZ(0.22);
    seedGeometry.computeBoundingSphere();
    EMO_SYMMETRIC_SEED_CACHE.seedGeometry = seedGeometry;

    const seamGeometry = new THREE.BoxGeometry(0.052, 0.52, 0.11, 1, 1, 1);
    const seamPos = seamGeometry.attributes.position;
    for (let i = 0; i < seamPos.count; i++) {
      const x = seamPos.getX(i);
      const y = seamPos.getY(i);
      const z = seamPos.getZ(i);
      seamPos.setXYZ(
        i,
        x * (0.58 + Math.abs(y) * 0.38) + y * 0.05,
        y * 1.1,
        z * 0.72 + x * 0.18
      );
    }
    seamPos.needsUpdate = true;
    seamGeometry.computeVertexNormals();
    seamGeometry.computeBoundingSphere();
    EMO_SYMMETRIC_SEED_CACHE.seamGeometry = seamGeometry;

    const cageGeometry = new THREE.OctahedronGeometry(0.46, 0);
    const cagePos = cageGeometry.attributes.position;
    for (let i = 0; i < cagePos.count; i++) {
      const x = cagePos.getX(i);
      const y = cagePos.getY(i);
      const z = cagePos.getZ(i);
      cagePos.setXYZ(
        i,
        x * 0.96 + z * 0.08,
        y * 1.42 + Math.sign(y || 1) * 0.04,
        z * 0.84 - x * 0.12
      );
    }
    cagePos.needsUpdate = true;
    cageGeometry.computeVertexNormals();
    cageGeometry.computeBoundingSphere();
    EMO_SYMMETRIC_SEED_CACHE.cageGeometry = cageGeometry;
    EMO_SYMMETRIC_SEED_CACHE.cageEdgesGeometry = safeCreateEdgesGeometry(cageGeometry, 8);

    const shellGeometryA = new THREE.IcosahedronGeometry(0.48, 1);
    const shellAPos = shellGeometryA.attributes.position;
    for (let i = 0; i < shellAPos.count; i++) {
      const x = shellAPos.getX(i);
      const y = shellAPos.getY(i);
      const z = shellAPos.getZ(i);
      const inward = x > 0 ? 0.2 : 1.02;
      shellAPos.setXYZ(
        i,
        x * inward + Math.max(0, y) * -0.06,
        y * 1.34 + Math.abs(x) * 0.04,
        z * 0.64 + x * -0.08
      );
    }
    shellAPos.needsUpdate = true;
    shellGeometryA.computeVertexNormals();
    shellGeometryA.computeBoundingSphere();
    EMO_SYMMETRIC_SEED_CACHE.shellGeometryA = shellGeometryA;
    EMO_SYMMETRIC_SEED_CACHE.shellEdgesGeometryA = safeCreateEdgesGeometry(shellGeometryA, 14);

    const shellGeometryB = new THREE.IcosahedronGeometry(0.44, 1);
    const shellBPos = shellGeometryB.attributes.position;
    for (let i = 0; i < shellBPos.count; i++) {
      const x = shellBPos.getX(i);
      const y = shellBPos.getY(i);
      const z = shellBPos.getZ(i);
      const inward = x < 0 ? 0.26 : 0.98;
      shellBPos.setXYZ(
        i,
        x * inward + Math.max(0, y) * 0.04,
        y * 1.22 + Math.abs(z) * 0.05,
        z * 0.72 + x * 0.06
      );
    }
    shellBPos.needsUpdate = true;
    shellGeometryB.computeVertexNormals();
    shellGeometryB.computeBoundingSphere();
    EMO_SYMMETRIC_SEED_CACHE.shellGeometryB = shellGeometryB;
    EMO_SYMMETRIC_SEED_CACHE.shellEdgesGeometryB = safeCreateEdgesGeometry(shellGeometryB, 14);

    const shellGeometryC = new THREE.IcosahedronGeometry(0.34, 0);
    const shellCPos = shellGeometryC.attributes.position;
    for (let i = 0; i < shellCPos.count; i++) {
      const x = shellCPos.getX(i);
      const y = shellCPos.getY(i);
      const z = shellCPos.getZ(i);
      shellCPos.setXYZ(
        i,
        x * 0.78 + z * 0.1,
        y * 1.46 + 0.08,
        z * 0.48 - x * 0.06
      );
    }
    shellCPos.needsUpdate = true;
    shellGeometryC.computeVertexNormals();
    shellGeometryC.computeBoundingSphere();
    EMO_SYMMETRIC_SEED_CACHE.shellGeometryC = shellGeometryC;
    EMO_SYMMETRIC_SEED_CACHE.shellEdgesGeometryC = safeCreateEdgesGeometry(shellGeometryC, 14);

    const finGeometry = new THREE.CylinderGeometry(0.014, 0.15, 0.86, 4, 3, false);
    const finPos = finGeometry.attributes.position;
    for (let i = 0; i < finPos.count; i++) {
      const x = finPos.getX(i);
      const y = finPos.getY(i);
      const z = finPos.getZ(i);
      const yNorm = (y + 0.43) / 0.86;
      const flare = 0.28 + yNorm * 1.16;
      finPos.setXYZ(
        i,
        x * flare + Math.sin(yNorm * Math.PI) * 0.05,
        y * 1.06,
        z * (0.16 + yNorm * 0.52) - Math.cos(yNorm * Math.PI) * 0.015
      );
    }
    finPos.needsUpdate = true;
    finGeometry.translate(0, 0.3, 0);
    finGeometry.computeVertexNormals();
    finGeometry.computeBoundingSphere();
    EMO_SYMMETRIC_SEED_CACHE.finGeometry = finGeometry;
    EMO_SYMMETRIC_SEED_CACHE.finEdgesGeometry = safeCreateEdgesGeometry(finGeometry, 16);

    const railCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.34, -0.12, 0.18),
      new THREE.Vector3(-0.1, 0.24, 0.22),
      new THREE.Vector3(0.12, 0.54, 0.04),
      new THREE.Vector3(0.36, 0.88, -0.12)
    ]);
    const railGeometry = new THREE.TubeGeometry(railCurve, 30, 0.014, 6, false);
    railGeometry.computeBoundingSphere();
    EMO_SYMMETRIC_SEED_CACHE.railGeometry = railGeometry;
    EMO_SYMMETRIC_SEED_CACHE.railEdgesGeometry = safeCreateEdgesGeometry(railGeometry, 18);

    const dustPositions = [];
    const dustCount = 64;
    for (let i = 0; i < dustCount; i++) {
      const t = i / dustCount;
      const angle = t * Math.PI * 2.3;
      const radius = 0.26 + t * 0.64 + Math.sin(i * 1.32) * 0.06;
      dustPositions.push(
        Math.cos(angle) * radius * 0.56 + Math.sin(i * 0.38) * 0.02,
        -0.26 + t * 1.28 + Math.sin(i * 0.84) * 0.08,
        Math.sin(angle) * radius * 0.38
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.computeBoundingSphere();
    EMO_SYMMETRIC_SEED_CACHE.dustGeometry = dustGeometry;
  }

  return EMO_SYMMETRIC_SEED_CACHE;
}

function _getEmotionalSymmetricSeedMaterials(color) {
  const colorHex = typeof color === 'number' ? color : 0xff66b7;
  if (EMO_SYMMETRIC_SEED_MATERIALS.has(colorHex)) return EMO_SYMMETRIC_SEED_MATERIALS.get(colorHex);

  const emotionalColor = new THREE.Color(colorHex);
  const cyanColor = new THREE.Color(0xd2fbff).lerp(emotionalColor, 0.05);
  const roseColor = new THREE.Color(0xffd0e9).lerp(emotionalColor, 0.18);
  const whiteColor = new THREE.Color(0xffffff).lerp(cyanColor, 0.04);
  const ivoryColor = new THREE.Color(0xfffbf3).lerp(roseColor, 0.06);
  const violetColor = new THREE.Color(0x9792ff).lerp(emotionalColor, 0.08);
  const seamColor = new THREE.Color(0x261f38).lerp(violetColor, 0.2).lerp(roseColor, 0.04);

  const coreMat = new THREE.MeshPhysicalMaterial({
    color: ivoryColor.clone().lerp(cyanColor, 0.12),
    emissive: whiteColor.clone().lerp(cyanColor, 0.16),
    emissiveIntensity: 0.26,
    metalness: 0.12,
    roughness: 0.14,
    transmission: 0.0,
    thickness: 0.1,
    ior: 1.28,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seedMat = new THREE.MeshPhysicalMaterial({
    color: whiteColor.clone().lerp(ivoryColor, 0.1),
    emissive: whiteColor.clone().lerp(roseColor, 0.08),
    emissiveIntensity: 0.88,
    metalness: 0.06,
    roughness: 0.04,
    transmission: 0.0,
    thickness: 0.05,
    ior: 1.26,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const seamMat = new THREE.MeshBasicMaterial({
    color: seamColor,
    transparent: true,
    opacity: 0.68,
    depthWrite: false
  });

  const cageMat = new THREE.LineBasicMaterial({
    color: whiteColor.clone().lerp(cyanColor, 0.14),
    transparent: true,
    opacity: 0.62,
    depthWrite: false
  });

  const shellMatA = new THREE.MeshBasicMaterial({
    color: cyanColor.clone().lerp(whiteColor, 0.18),
    transparent: true,
    opacity: 0.14,
    depthWrite: false
  });

  const shellMatB = new THREE.MeshBasicMaterial({
    color: roseColor.clone().lerp(ivoryColor, 0.2),
    transparent: true,
    opacity: 0.12,
    depthWrite: false
  });

  const shellMatC = new THREE.MeshBasicMaterial({
    color: violetColor.clone().lerp(cyanColor, 0.22).lerp(whiteColor, 0.08),
    transparent: true,
    opacity: 0.11,
    depthWrite: false
  });

  const shellEdgeMat = new THREE.LineBasicMaterial({
    color: whiteColor.clone().lerp(roseColor, 0.06),
    transparent: true,
    opacity: 0.3,
    depthWrite: false
  });

  const finMatA = new THREE.MeshBasicMaterial({
    color: cyanColor.clone().lerp(ivoryColor, 0.16),
    transparent: true,
    opacity: 0.16,
    depthWrite: false
  });

  const finMatB = new THREE.MeshBasicMaterial({
    color: roseColor.clone().lerp(whiteColor, 0.18),
    transparent: true,
    opacity: 0.14,
    depthWrite: false
  });

  const finEdgeMat = new THREE.LineBasicMaterial({
    color: whiteColor.clone().lerp(cyanColor, 0.12),
    transparent: true,
    opacity: 0.28,
    depthWrite: false
  });

  const railMat = new THREE.MeshBasicMaterial({
    color: cyanColor.clone().lerp(roseColor, 0.14).lerp(whiteColor, 0.1),
    transparent: true,
    opacity: 0.12,
    depthWrite: false
  });

  const railEdgeMat = new THREE.LineBasicMaterial({
    color: whiteColor.clone().lerp(violetColor, 0.04),
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  });

  const dustMat = new THREE.PointsMaterial({
    color: whiteColor.clone().lerp(roseColor, 0.08),
    size: 0.04,
    transparent: true,
    opacity: 0.54,
    depthWrite: false,
    sizeAttenuation: true
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: whiteColor.clone().lerp(roseColor, 0.04),
    transparent: true,
    opacity: 0.15,
    depthWrite: false
  });

  const mats = {
    coreMat,
    seedMat,
    seamMat,
    cageMat,
    shellMatA,
    shellMatB,
    shellMatC,
    shellEdgeMat,
    finMatA,
    finMatB,
    finEdgeMat,
    railMat,
    railEdgeMat,
    dustMat,
    glowMat
  };
  for (const mat of Object.values(mats)) {
    mat.userData = mat.userData || {};
    mat.userData.wavePatchMode = 'DEFAULT';
  }

  EMO_SYMMETRIC_SEED_MATERIALS.set(colorHex, mats);
  return mats;
}

/**
 * Enhanced Node Models - 42 unique geometric designs + 12 EXTREME geometries
 * Organized by layer: Input, Process, Integration, Analytics, Storage, Control
 * EXTREME geometries are integrated as additional variants in the selection pools
 * 
 * ENHANCED VARIANTS SUMMARY (Sessions 76-84):
 * - Analytics: 11 variants (8 base + 3 enhanced)
 * - Storage: 11 variants (8 base + 3 enhanced)
 * - Process: 11 variants (8 base + 3 enhanced)
 * - Integration: 11 variants (8 base + 3 enhanced knot variants) [NEW - Session 82]
 * - Control: 11 variants (8 base + 3 enhanced command/decision) [NEW - Session 83]
 * - Input: 11 variants (8 base + 3 enhanced reception/sensing) [NEW - Session 84]
 * 
 * SPINE VARIANTS (Session 100):
 * - Control Spine Variants (3 new additive variants - optional):
 *   - SegmentedSpine: Vertical stacked mechanical segments
 *   - TwistedSpine: Segmented spine with progressive rotation
 *   - HollowSpine: Column with negative space and ribs
 * - Access: EnhancedNodeModels.createControlSpineVariant('segmented'|'twisted'|'hollow', group, color)
 * - These variants are NOT auto-selected (separate from 11-variant rotation)
 * 
 * VISUAL HIERARCHY INTEGRATION (Session 21):
 * - All core geometries now query VisualHierarchyRegistry for renderOrder
 * - Fallback to hardcoded values if registry unavailable
 * - Inner/archetype geometries use registry layer: ARCHETYPE
 */
export class EnhancedNodeModels {
  // Shared EXTREME generator instance
  static extremeNodePack = new ExtremeAINodePack();
  static __registryReady = false;
  static __registryMissing = [];
  static _ALL_NODE_FACTORIES = null;
  static __ALL_NODE_FACTORIES = null;

  // ============================================================================
  // LEGACY SCALE PULSE AUDIT & DISABLE (Session 107)
  // ============================================================================
  // Disable unintentional node breathing/pulsing behaviors:
  // - TRANSFORMATION_SPINE breathing (±2% scale oscillation)
  // - FRACTAL_ECHO breathing (±1.5% scale oscillation)
  // - INCOMING_FUNNEL width breathing (±3% scale oscillation)
  // - SIGNAL_RECEPTOR antenna pulse (±8% scale elongation)
  // - COMMAND_PYRAMID glow pulsing (scale mutation without feedback)
  // 
  // Master flag: DISABLE_LEGACY_SCALE_PULSE (default: true - all breathing DISABLED)
  static config = {
    DISABLE_LEGACY_SCALE_PULSE: true,  // Master disable (all breathing disabled by default)
    DISABLE_SPINE_BREATHING: true,     // Disable TRANSFORMATION_SPINE breathing
    DISABLE_FUNNEL_BREATHING: true,    // Disable INCOMING_FUNNEL width breathing
    DISABLE_FRACTAL_BREATHING: true,   // Disable FRACTAL_ECHO breathing
    DISABLE_ANTENNA_PULSE: true,       // Disable SIGNAL_RECEPTOR antenna pulse
    DISABLE_GLOW_PULSING: true,        // Disable COMMAND_PYRAMID glow pulsing
  };

  /**
   * Legacy compatibility shim for the factory registry.
   * Builds a grouped view from NODE_VISUAL_REGISTRY and validates factory bindings.
   * Exposes _ALL_NODE_FACTORIES / __ALL_NODE_FACTORIES for legacy callers.
   */
  static ensureRegistryReady() {
    if (EnhancedNodeModels.__registryReady && EnhancedNodeModels._ALL_NODE_FACTORIES) {
      return true;
    }

    const grouped = {};
    const missing = [];

    for (const [visualCodeStr, def] of Object.entries(NODE_VISUAL_REGISTRY)) {
      const visualCode = Number(visualCodeStr);
      const category = def?.category;
      const factoryName = def?.factoryName;
      if (!category || !factoryName) {
        missing.push({ visualCode, reason: 'InvalidDefinition' });
        continue;
      }

      const factory = EnhancedNodeModels._resolveFactory(factoryName);
      if (!factory) {
        missing.push({ visualCode, category, factoryName, reason: 'FactoryMissing' });
        continue;
      }

      const catKey = String(category).toLowerCase();
      if (!grouped[catKey]) grouped[catKey] = [];
      grouped[catKey].push({ visualCode, factoryName });
    }

    EnhancedNodeModels._ALL_NODE_FACTORIES = grouped;
    EnhancedNodeModels.__ALL_NODE_FACTORIES = grouped; // legacy global access
    EnhancedNodeModels.__registryMissing = missing;
    EnhancedNodeModels.__registryReady = missing.length === 0 && Object.keys(grouped).length > 0;

    if (!EnhancedNodeModels.__registryReady && typeof console !== 'undefined') {
      console.warn('[FactoryRegistry] Missing factory bindings', {
        missingCount: missing.length,
        sample: missing.slice(0, 5)
      });
    }

    return EnhancedNodeModels.__registryReady;
  }

  /**
   * Get renderOrder for core geometry (from VisualHierarchyRegistry)
   * Falls back to hardcoded value if registry unavailable
   * @private
   * @returns {number} renderOrder for CORE layer
   */
  static _getCoreRenderOrder() {
    try {
      return VisualHierarchyRegistry?.getRenderOrder('CORE', 0) ?? 0;
    } catch (err) {
      return 0; // Safe fallback
    }
  }

  /**
   * Get renderOrder for archetype geometry (from VisualHierarchyRegistry)
   * Falls back to hardcoded value if registry unavailable
   * @private
   * @returns {number} renderOrder for ARCHETYPE layer
   */
  static _getArchetypeRenderOrder() {
    try {
      return VisualHierarchyRegistry?.getRenderOrder('ARCHETYPE', 1) ?? 1;
    } catch (err) {
      return 1; // Safe fallback
    }
  }

  static _resolveFactory(name) {
    if (!name) return null;
    if (typeof EnhancedNodeModels[name] === 'function') return EnhancedNodeModels[name].bind(EnhancedNodeModels);

    const external = {
      // Input
      createInputSensory_TactileSensor: InputSensoryEnhanced.createInputSensory_TactileSensor.bind(InputSensoryEnhanced),
      createInputSensory_EchoDetector: InputSensoryEnhanced.createInputSensory_EchoDetector.bind(InputSensoryEnhanced),
      createInputSensory_NeuralReceptor: InputSensoryEnhanced.createInputSensory_NeuralReceptor.bind(InputSensoryEnhanced),

      // Process
      createProcessEnhanced_FlowRecomposer: ProcessEnhancedVariants.createProcessEnhanced_FlowRecomposer.bind(ProcessEnhancedVariants),
      createProcessEnhanced_TemporalShifter: ProcessEnhancedVariants.createProcessEnhanced_TemporalShifter.bind(ProcessEnhancedVariants),
      createProcessEnhanced_IterativeEngine: ProcessEnhancedVariants.createProcessEnhanced_IterativeEngine.bind(ProcessEnhancedVariants),

      // Integration
      createIntegrationEnhanced_SignalKnot: IntegrationEnhancedVariants.createIntegrationEnhanced_SignalKnot.bind(IntegrationEnhancedVariants),
      createIntegrationEnhanced_ProtocolTangle: IntegrationEnhancedVariants.createIntegrationEnhanced_ProtocolTangle.bind(IntegrationEnhancedVariants),
      createIntegrationEnhanced_ContinuityBinder: IntegrationEnhancedVariants.createIntegrationEnhanced_ContinuityBinder.bind(IntegrationEnhancedVariants),

      // Analytics
      createAnalyticsEnhanced_SignalStratifier: AnalyticsEnhancedVariants.createAnalyticsEnhanced_SignalStratifier.bind(AnalyticsEnhancedVariants),
      createAnalyticsEnhanced_TrendExcavator: AnalyticsEnhancedVariants.createAnalyticsEnhanced_TrendExcavator.bind(AnalyticsEnhancedVariants),
      createAnalyticsEnhanced_AnomalyLedger: AnalyticsEnhancedVariants.createAnalyticsEnhanced_AnomalyLedger.bind(AnalyticsEnhancedVariants),

      // Storage
      createStorageEnhanced_ArchiveNexus: StorageEnhancedVariants.createStorageEnhanced_ArchiveNexus.bind(StorageEnhancedVariants),
      createStorageEnhanced_MemoryCrypts: StorageEnhancedVariants.createStorageEnhanced_MemoryCrypts.bind(StorageEnhancedVariants),
      createStorageEnhanced_DepthLayers: StorageEnhancedVariants.createStorageEnhanced_DepthLayers.bind(StorageEnhancedVariants),
      createObeliskCache: StorageNodesVisual.createObeliskCache.bind(StorageNodesVisual),
      createFractalReservoir: StorageNodesVisual.createFractalReservoir.bind(StorageNodesVisual),
      createArchiveDrum: StorageNodesVisual.createArchiveDrum.bind(StorageNodesVisual),

      // Control
      createControlEnhanced_DecisionFork: ControlEnhancedVariants.createControlEnhanced_DecisionFork.bind(ControlEnhancedVariants),
      createControlEnhanced_AuthorityHelix: ControlEnhancedVariants.createControlEnhanced_AuthorityHelix.bind(ControlEnhancedVariants),
      createControlEnhanced_CommandMatrix: ControlEnhancedVariants.createControlEnhanced_CommandMatrix.bind(ControlEnhancedVariants),
      createPhrixFlowArbiter: ControlNodeSpecialGovernors.createPhrixFlowArbiter.bind(ControlNodeSpecialGovernors),
      createCrucisSuppressionGovernor: ControlNodeSpecialGovernors.createCrucisSuppressionGovernor.bind(ControlNodeSpecialGovernors),
      createVertexTemporalGate: ControlNodeSpecialGovernors.createVertexTemporalGate.bind(ControlNodeSpecialGovernors),
      createStorageNodeStyled_v2: this.createStorageNodeStyled_v2.bind(this),
      // Emotional (canonical geometries)
      createEmotionalHeartCrystal: CanonicalGeometryFamilies.createEmotionalHeartCrystal.bind(CanonicalGeometryFamilies),
      createEmotionalNeuralLobe: CanonicalGeometryFamilies.createEmotionalNeuralLobe.bind(CanonicalGeometryFamilies),
      createEmotionalBloomingGem: CanonicalGeometryFamilies.createEmotionalBloomingGem.bind(CanonicalGeometryFamilies),
      createEmotionalTearShaped: CanonicalGeometryFamilies.createEmotionalTearShaped.bind(CanonicalGeometryFamilies),
      createEmotionalFolded: CanonicalGeometryFamilies.createEmotionalFolded.bind(CanonicalGeometryFamilies),
      createEmotionalSymmetricSeed: CanonicalGeometryFamilies.createEmotionalSymmetricSeed.bind(CanonicalGeometryFamilies),
    };

    return external[name] || null;
  }

  /**
   * Create node by category and index
   * FIX 1: Lazy THREE guard - prevent visual creation when THREE is unavailable
   */
  static create(category = 'input', visualCode = 0, color = 0x00ffff) {
    if (!THREE || !THREE.Group) {
      if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
        console.error('[VisualBuildFail]', { archetype: category, category, reason: 'THREE_UNAVAILABLE' });
      }
      return null;
    }

    const cat = (category || 'input').toLowerCase();
    const def = NODE_VISUAL_REGISTRY[visualCode];
    if (!def) {
      console.error('[VisualBuildFail]', { category: cat, visualCode, reason: 'RegistryMissing' });
      return null;
    }

    const defCat = String(def.category || '').toLowerCase().trim();
    if (defCat !== cat) {
      console.error('[VisualBuildFail]', { category: cat, visualCode, defCategory: defCat, reason: 'CategoryMismatch' });
      return null;
    }

    const factoryFn = EnhancedNodeModels._resolveFactory(def.factoryName);
    if (!factoryFn) {
      console.error('[VisualBuildFail]', { category: cat, visualCode, factoryName: def.factoryName, reason: 'FactoryMissing' });
      return null;
    }

    const nodeGroup = new THREE.Group();
    const rootGroup = factoryFn(nodeGroup, visualCode, color);
    if (!rootGroup) return null;

    rootGroup.userData = rootGroup.userData || {};
    rootGroup.userData.visualCode = visualCode;
    rootGroup.userData.factoryName = def.factoryName;
    rootGroup.userData.category = cat;
    EnhancedNodeModels._annotateFactoryEdgeCages(rootGroup, color);

    const waveShaderBridge = window.game?.waveShaderBridge;
    const waveShaderMaterialPatch = window.game?.waveShaderMaterialPatch;
    if (
      (waveShaderBridge && typeof waveShaderBridge.registerNodeMaterial === 'function') ||
      (waveShaderMaterialPatch && typeof waveShaderMaterialPatch.patch === 'function')
    ) {
      const seenMaterials = new Set();
      rootGroup.traverse((child) => {
        // Keep cage/wire line materials unpatched to avoid mesh-vs-cage geometric drift.
        if (!child?.isMesh) return;
        const materialRef = child?.material;
        if (!materialRef) return;
        const materials = Array.isArray(materialRef) ? materialRef : [materialRef];
        for (const material of materials) {
          if (!material || seenMaterials.has(material)) continue;
          seenMaterials.add(material);
          if (child.userData?.ignoreWaveColor) {
            material.userData = material.userData || {};
            material.userData.ignoreWaveColor = true;
          }
          if (waveShaderBridge?.registerNodeMaterial) {
            waveShaderBridge.registerNodeMaterial(material, 'DEFAULT');
          }
          if (waveShaderMaterialPatch?.patch) {
            const patchMode = material?.userData?.wavePatchMode || child?.userData?.wavePatchMode || 'AURA';
            waveShaderMaterialPatch.patch(material, patchMode);
          }
        }
      });
    }

    // Generate canonical nodeId (factory-level identity)
    if (!rootGroup.userData.nodeId) {
      rootGroup.userData.nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    return rootGroup;
  }

  /**
   * Tag factory-created edge cages without mutating their authored visual style.
   */
  static _annotateFactoryEdgeCages(rootGroup, color) {
    if (!rootGroup) return;
    const isCageLine = (obj) => {
      if (!obj?.isLineSegments) return false;
      if (obj.geometry?.isEdgesGeometry) return true;
      const n = String(obj.name || '').toLowerCase();
      return n.includes('edge') || n.includes('cage') || n.includes('frame') || n.includes('wire');
    };

    let hasFactoryCage = false;
    rootGroup.traverse((child) => {
      if (!isCageLine(child)) return;
      child.userData = child.userData || {};
      child.userData.isFactoryCage = true;
      child.userData.isEdgeCage = true;
      child.userData.allowNoFrustum = true;
      child.frustumCulled = false;
      hasFactoryCage = true;
    });

    if (!hasFactoryCage) return;
    rootGroup.userData = rootGroup.userData || {};
    rootGroup.userData.hasFactoryCage = true;
    rootGroup.traverse((child) => {
      if (!child?.isMesh) return;
      child.userData = child.userData || {};
      child.userData.hasEdgeCage = true;
    });
  }
  // ===== INPUT NODES (Cyan - 4 variants) =====

  /**
   * Input Node 3: Rectangular gateway frame with cyan edge light
   */
  static createInputNode3(group, color) {
    const seed = group?.userData?.nodeId ? hashNodeIdToFloat(group.userData.nodeId) : hashNodeIdToFloat(String(color || 0x00ffff));
    const rng = _mythicSeededRng(Math.floor(seed * 1000) || 1);
    const inputRoot = new THREE.Group();
    inputRoot.name = 'INPUT_FRAGMENTED_INTAKE';

    // Torus-knot vortex core with shader deformation
    const knotGeo = new THREE.TorusKnotGeometry(0.38, 0.09, 120, 12, 2, 3);
    const vortexMat = createVortexMaterial(seed, color);
    const vortexMesh = new THREE.Mesh(knotGeo, vortexMat);
    vortexMesh.name = 'VortexCore';
    vortexMesh.userData.isInputVortexCore = true;
    vortexMesh.userData.vortexUniforms = vortexMat.uniforms;
    vortexMesh.scale.set(
      1 + seed * 0.3,
      1 + seed * 0.1,
      1 + seed * 0.25
    );
    inputRoot.add(vortexMesh);

    // Gradient inner glow ring
    const glowRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.05, 12, 48),
      new THREE.MeshBasicMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
      })
    );
    glowRing.name = 'GradientCoreRing';
    glowRing.rotation.x = Math.PI / 2;
    glowRing.position.y = -0.1;
    inputRoot.add(glowRing);

    // Fragmented shard cluster
    const shardGroup = new THREE.Group();
    shardGroup.name = 'FragmentShardCluster';
    const shardCount = 15;
    const shardMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.6,
      metalness: 0.2,
      roughness: 0.4
    });
    for (let i = 0; i < shardCount; i++) {
      const scale = 0.6 + rng() * 0.4;
      const shardGeo = new THREE.IcosahedronGeometry(0.05 * (0.8 + rng() * 0.6), 0);
      shardGeo.translate(
        (rng() - 0.5) * 0.1,
        (rng() - 0.5) * 0.04,
        (rng() - 0.5) * 0.1
      );
      const shard = new THREE.Mesh(shardGeo, shardMat);
      const radius = 0.55 + rng() * 0.15;
      const angle = (i / shardCount) * Math.PI * 2 + rng() * 0.2;
      shard.position.set(
        Math.cos(angle) * radius,
        (rng() - 0.5) * 0.1,
        Math.sin(angle) * radius
      );
      shard.scale.setScalar(scale);
      shard.rotation.set(
        rng() * Math.PI,
        rng() * Math.PI,
        rng() * Math.PI
      );
      shard.userData.ignoreRaycast = true;
      shardGroup.add(shard);
    }
    inputRoot.add(shardGroup);

    // Directional particle stream
    const streamPositions = [];
    const streamCount = 60;
    for (let i = 0; i < streamCount; i++) {
      const t = i / (streamCount - 1);
      const radius = 0.8 * (1 - t) + 0.1;
      const angle = t * Math.PI * 2.5 + rng() * 0.5;
      const y = -0.4 + t * 0.9 + (rng() - 0.5) * 0.05;
      streamPositions.push(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );
    }
    const streamGeo = new THREE.BufferGeometry();
    streamGeo.setAttribute('position', new THREE.Float32BufferAttribute(streamPositions, 3));
    const stream = new THREE.Points(streamGeo, new THREE.PointsMaterial({
      color,
      size: 0.05,
      transparent: true,
      opacity: 0.7
    }));
    stream.name = 'DirectionalStream';
    inputRoot.add(stream);

    // Broken orbital spline
    const splinePoints = [];
    for (let i = 0; i < 6; i++) {
      const radius = 0.6 - i * 0.08;
      const angle = i * Math.PI * 0.4 + rng() * 0.2;
      splinePoints.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        -0.2 + i * 0.07,
        Math.sin(angle) * radius
      ));
    }
    const spline = new THREE.CatmullRomCurve3(splinePoints, false, 'catmullrom', 0.3);
    const splineLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(spline.getPoints(48)),
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.45
      })
    );
    splineLine.name = 'BrokenOrbit';
    inputRoot.add(splineLine);

    // Distortion overlay
    const echoLines = new THREE.Group();
    echoLines.name = 'DistortionOverlay';
    const echoMat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.25
    });
    const echoKnot = new THREE.LineSegments(new THREE.EdgesGeometry(knotGeo), echoMat);
    echoKnot.scale.copy(vortexMesh.scale).multiplyScalar(1.05);
    echoKnot.rotation.set(0.05, 0.05, 0);
    echoLines.add(echoKnot);
    const echoArc = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(spline.getPoints(32)),
      echoMat
    );
    echoArc.rotation.x = 0.02;
    echoLines.add(echoArc);
    inputRoot.add(echoLines);

    // Final group assembly
    group.add(inputRoot);
    return group;
  }


  /**
   * Main input node creator
   * CANONICAL CATEGORY: INPUT
   * - TriangularPrism+Rim
   * - PyramidSpike
   * - WireframeSphere
   * - Icosahedron
   * - SignalReceptor (NEW - Session 63)
   * - DataGateway (NEW - Session 63)
   * - IncomingFunnel (NEW - Session 63)
  * - SensorArray (NEW - Session 84)
  * - PerceptionVortex (NEW - Session 84)
  * - ResonanceChamber (NEW - Session 84)
  */
  static createInputNodeStyled_v2(group, index, color) {
    try {
      const geometries = _getInputV2Geometries();
      const materials = _getInputV2Materials(color);
      const inputRoot = new THREE.Group();
      inputRoot.name = 'INPUT_NODE';
      inputRoot.userData.visualVariant = 'INPUT_V2';

      const seed = group?.userData?.nodeId ? hashString(group.userData.nodeId) : index || 1;
      const rng = _mythicSeededRng(seed);
      const scratch = new THREE.Object3D();

      // CORE
      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';
      const core = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      core.name = 'SignalCore';
      const edges = new THREE.LineSegments(geometries.edgesGeometry, materials.edgeMat);
      edges.name = 'CoreEdges';
      coreGroup.add(core);
      coreGroup.add(edges);
      inputRoot.add(coreGroup);

      // FLOW
      const flowGroup = new THREE.Group();
      flowGroup.name = 'FLOW_GROUP';

      // InflowArrows (instanced)
      const arrowCount = 26;
      const arrows = new THREE.InstancedMesh(geometries.arrowGeometry, materials.neonMat, arrowCount);
      arrows.name = 'InflowArrows';
      arrows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const radius = (geometries.coreGeometry.boundingSphere?.radius || 0.45) * 1.5;
      for (let i = 0; i < arrowCount; i++) {
        const dir = new THREE.Vector3(
          rng() * 2 - 1,
          rng() * 2 - 1,
          rng() * 2 - 1
        ).normalize();
        scratch.position.copy(dir).multiplyScalar(radius);
        scratch.lookAt(0, 0, 0);
        const scale = 0.85 + rng() * 0.5;
        scratch.scale.setScalar(scale);
        scratch.updateMatrix();
        arrows.setMatrixAt(i, scratch.matrix);
      }
      arrows.instanceMatrix.needsUpdate = true;
      flowGroup.add(arrows);

      // OrbitBands
      const orbitGroup = new THREE.Group();
      orbitGroup.name = 'OrbitBands';
      const orbitRadii = [0.8, 1.0, 1.2];
      orbitRadii.forEach((r, idx) => {
        const ring = new THREE.Mesh(geometries.ringGeometry, materials.neonMat);
        ring.name = `OrbitBand_${idx}`;
        ring.scale.setScalar(r / 0.65); // base radius 0.65
        ring.rotation.set(
          idx === 0 ? 0.2 : 0.4,
          idx * 0.35,
          idx === 2 ? -0.3 : 0.1
        );
        flowGroup.add(ring);
      });

      // VectorLines
      const vecLines = new THREE.LineSegments(geometries.vectorGeometry, materials.vectorMat);
      vecLines.name = 'VectorLines';
      flowGroup.add(vecLines);

      // DataStreams (instanced)
      const streamCount = 36;
      const streams = new THREE.InstancedMesh(geometries.streamGeometry, materials.streamMat, streamCount);
      streams.name = 'DataStreams';
      streams.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      for (let i = 0; i < streamCount; i++) {
        const angle = rng() * Math.PI * 2;
        const r = 0.85 + rng() * 0.4;
        const y = 0.6 + rng() * 0.8;
        scratch.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
        scratch.rotation.set(
          -Math.PI / 2 + (rng() - 0.5) * 0.2,
          angle + Math.PI,
          0
        );
        const scl = 0.6 + rng() * 0.6;
        scratch.scale.set(1, 1, scl);
        scratch.updateMatrix();
        streams.setMatrixAt(i, scratch.matrix);
      }
      streams.instanceMatrix.needsUpdate = true;
      flowGroup.add(streams);

      inputRoot.add(flowGroup);

      // EMISSION
      const emissionGroup = new THREE.Group();
      emissionGroup.name = 'EMISSION_GROUP';

      const halo = new THREE.Mesh(geometries.haloGeometry, materials.neonMat);
      halo.name = 'PulseHalo';
      halo.rotation.x = Math.PI / 2;
      halo.scale.setScalar(1.2);
      emissionGroup.add(halo);

      const particles = new THREE.Points(geometries.particlesGeometry, materials.particleMat);
      particles.name = 'EntryParticles';
      particles.frustumCulled = false;
      emissionGroup.add(particles);

      inputRoot.add(emissionGroup);

      inputRoot.userData.visualReady = true;
      group.add(inputRoot);
      return group;
    } catch (err) {
      console.error('[InputV2Abort]', { reason: err?.message || err });
      return null;
    }
  }

// Legacy INPUT visuals retained as fallback
static _createInputNodeLegacy(group, index, color) {
  const pool = CATEGORY_POOLS.input || [];
  const poolFns = {
    101: this.createInputSignalReceptor.bind(this),
    102: this.createInputDataGateway.bind(this),
    103: this.createInputIncomingFunnel.bind(this),
    104: InputSensoryEnhanced.createInputSensory_TactileSensor.bind(InputSensoryEnhanced),
    105: InputSensoryEnhanced.createInputSensory_EchoDetector.bind(InputSensoryEnhanced),
    106: InputSensoryEnhanced.createInputSensory_NeuralReceptor.bind(InputSensoryEnhanced)
  };
  const counter = Number.isFinite(index) ? index : 0;
  const selected = pool[counter % pool.length];
  const factory = poolFns[selected] || poolFns[pool[0]];
  
  // FAIL-CLOSED: No fallback allowed when flag is true
  if (window.ATOMA_NO_FALLBACK_VISUALS !== false && (!factory || pool.length === 0)) {
    const reason = !factory ? 'FACTORY_MISSING' : 'POOL_EMPTY';
    const resolvedCode = pool[selected] || selected;
    console.error('[VisualBuildFail]', { 
      archetype: 'input', 
      category: 'input', 
      resolvedVisualCode: resolvedCode,
      reason: `LEGACY_FALLBACK_${reason}` 
    });
    return null;
  }
  
  return factory ? factory(group, color) : null;

  // Copy nodeId from input group (if exists)
  const result = factory ? factory(group, color) : null;
  if (result && group.userData && group.userData.nodeId) {
    result.userData.nodeId = group.userData.nodeId;
  }
  return result;
}

  /**
   * INPUT: SIGNAL_RECEPTOR (NEW - Session 63)
   * Multi-directional antenna receiving incoming signals
   * - Central reception core (octahedron)
   * - 6 radial antenna arms (pointing outward)
   * - Subtle pulsing along antenna paths (scale-based)
   * - Animation: Slow rotation + antenna pulse propagation
   * 
   * VISUAL MEANING: "Ready to receive."
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createInputSignalReceptor(group, color) {
    try {
      // Create central reception core (octahedron)
      const coreGeometry = new THREE.OctahedronGeometry(0.3, 2);
      const coreMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.12,
        transmission: 0, // Phase B.3.A: transmission disabled to prevent RenderTransmissionPass
        thickness: 0.3,
        ior: 1.45,
        emissive: color,
        emissiveIntensity: 0.35
      });

      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      core.userData.isReceptionCore = true;
      core.userData.visualCoreImmutable = true;
      group.add(core);

      // Create 6 radial antenna arms (pointing in +/- X, Y, Z directions)
      const antennaCount = 6;
      const antennaLength = 0.65;
      const antennaMaterial = new THREE.MeshStandardMaterial({
        transparent: false,
        opacity: 1,
        depthWrite: true,
        depthTest: true,
        side: THREE.FrontSide,
        color: color,
        metalness: 0.75,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.25

      });

      const antennaDirections = [
        [1, 0, 0],    // +X
        [-1, 0, 0],   // -X
        [0, 1, 0],    // +Y
        [0, -1, 0],   // -Y
        [0, 0, 1],    // +Z
        [0, 0, -1]    // -Z
      ];

      for (let i = 0; i < antennaCount; i++) {
        // Create antenna arm as a tapered cone
        const antennaGeometry = new THREE.ConeGeometry(0.08, antennaLength, 8);
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        
        // Position and orient antenna
        const [dx, dy, dz] = antennaDirections[i];
        antenna.position.set(
          dx * (antennaLength / 2 + 0.15),
          dy * (antennaLength / 2 + 0.15),
          dz * (antennaLength / 2 + 0.15)
        );
        
        // Point antenna outward
        antenna.lookAt(
          dx * (antennaLength + 1),
          dy * (antennaLength + 1),
          dz * (antennaLength + 1)
        );
        
        antenna.userData.isAntenna = true;
        antenna.userData.antennaIndex = i;
        antenna.userData.antennaDirection = new THREE.Vector3(dx, dy, dz);
        antenna.userData.visualCoreImmutable = true;
        group.add(antenna);
      }

      // Store animation metadata
      group.userData.receptorRotationSpeed = 0.15; // Slow rotation
      group.userData.antennaaPulseAmplitude = 0.08; // 8% antenna breathing
      group.userData.antennaPulseSpeed = 1.2;
      group.userData.antennaCount = antennaCount;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INPUT_SIGNAL_RECEPTOR';

      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createInputSignalReceptor',
        category: 'input',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * INPUT: DATA_GATEWAY
   * First Gate reliquary compressing external reality into ATOMA ingress
   * - Fractured aperture crown instead of a literal torus ring
   * - Bright threshold lens nested inside a sealed void seam
   * - Directional phase blades forced through the gate axis
   * - Animation: crown rotation + gate-heart oscillation + stream flow
   *
   * VISUAL MEANING: "Reality enters ATOMA here."
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createInputDataGateway(group, visualCode, color) {
    try {
      const resolvedColor = typeof color === 'undefined' ? visualCode : color;
      const geometries = _getInputGatewayReliquaryGeometries();
      const materials = _getInputGatewayReliquaryMaterials(resolvedColor);
      const root = new THREE.Group();
      root.name = 'INPUT_DATA_GATEWAY_NODE';
      root.userData.visualVariant = 'INPUT_DATA_GATEWAY_FIRST_GATE_RELIQUARY_V4';

      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const thresholdGroup = new THREE.Group();
      thresholdGroup.name = 'THRESHOLD_GROUP';
      thresholdGroup.userData.isGatewayRing = true;
      thresholdGroup.userData.visualCoreImmutable = true;

      const crownConfigs = [
        { name: 'ApertureCrown_Left', pos: [-0.56, 0.02, -0.02], rot: [0.14, 0.14, 0.08], scale: [0.96, 1.12, 0.84] },
        { name: 'ApertureCrown_Right', pos: [0.58, -0.02, 0.03], rot: [-0.12, -0.22, -0.08], scale: [1.0, 1.08, 0.82] },
        { name: 'ApertureCrown_TopLeft', pos: [-0.24, 0.6, -0.02], rot: [0.08, 0.36, -0.92], scale: [0.82, 0.94, 0.72] },
        { name: 'ApertureCrown_TopRight', pos: [0.24, 0.64, 0.02], rot: [-0.08, -0.28, 0.9], scale: [0.78, 0.92, 0.7] },
        { name: 'ApertureCrown_Bottom', pos: [0.0, -0.66, 0.04], rot: [0.04, 0.12, Math.PI * 0.48], scale: [0.72, 0.84, 0.66] }
      ];
      crownConfigs.forEach((cfg) => {
        const fragment = new THREE.Mesh(geometries.apertureGeometry, materials.apertureMat);
        fragment.name = cfg.name;
        fragment.userData.ignoreWaveColor = true;
        fragment.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        fragment.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        fragment.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        fragment.renderOrder = coreOrder;
        thresholdGroup.add(fragment);

        const fragmentEdges = new THREE.LineSegments(geometries.apertureEdgesGeometry, materials.lineMat);
        fragmentEdges.name = `${cfg.name}_Edges`;
        fragmentEdges.userData.ignoreWaveColor = true;
        fragmentEdges.position.copy(fragment.position);
        fragmentEdges.rotation.copy(fragment.rotation);
        fragmentEdges.scale.copy(fragment.scale);
        fragmentEdges.renderOrder = archOrder;
        thresholdGroup.add(fragmentEdges);
      });
      root.add(thresholdGroup);

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const gateHeartRig = new THREE.Group();
      gateHeartRig.name = 'GateHeartRig';
      gateHeartRig.position.set(0.0, 0.0, 0.0);
      gateHeartRig.userData.isPortal = true;
      gateHeartRig.userData.basePortalY = 0.0;
      gateHeartRig.userData.visualCoreImmutable = true;

      const lens = new THREE.Mesh(geometries.lensGeometry, materials.lensMat);
      lens.name = 'ThresholdLens';
      lens.userData.ignoreWaveColor = true;
      lens.position.set(0.0, 0.0, 0.0);
      lens.rotation.set(0.16, 0.4, -0.06);
      lens.renderOrder = coreOrder;
      gateHeartRig.add(lens);

      const lensEdges = new THREE.LineSegments(geometries.lensEdgesGeometry, materials.lineMat);
      lensEdges.name = 'ThresholdLensCage';
      lensEdges.userData.ignoreWaveColor = true;
      lensEdges.position.copy(lens.position);
      lensEdges.rotation.copy(lens.rotation);
      lensEdges.renderOrder = archOrder;
      gateHeartRig.add(lensEdges);

      const seam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      seam.name = 'ThresholdVoidSeam';
      seam.userData.ignoreWaveColor = true;
      seam.position.set(0.01, -0.02, 0.0);
      seam.rotation.set(0.22, 0.28, -0.05);
      seam.renderOrder = coreOrder;
      gateHeartRig.add(seam);

      coreGroup.add(gateHeartRig);
      root.add(coreGroup);

      const flowGroup = new THREE.Group();
      flowGroup.name = 'FLOW_GROUP';

      const rails = new THREE.LineSegments(geometries.railGeometry, materials.lineMat);
      rails.name = 'IngressRails';
      rails.userData.ignoreWaveColor = true;
      rails.renderOrder = archOrder;
      flowGroup.add(rails);

      const streamCount = 6;
      const phaseSegments = [];
      const phaseConfigs = [
        { x: -0.22, y: 0.16, z: 0.82, rotX: 0.18, rotY: 0.06 },
        { x: 0.18, y: -0.12, z: 0.6, rotX: -0.12, rotY: -0.14 },
        { x: -0.08, y: 0.28, z: 0.36, rotX: 0.22, rotY: 0.08 },
        { x: 0.06, y: -0.04, z: 0.14, rotX: -0.08, rotY: 0.22 },
        { x: 0.0, y: 0.08, z: -0.08, rotX: 0.12, rotY: -0.1 },
        { x: -0.02, y: -0.02, z: -0.24, rotX: -0.06, rotY: 0.0 }
      ];
      phaseConfigs.forEach((cfg, idx) => {
        const segment = new THREE.Mesh(geometries.phaseGeometry, materials.phaseMat);
        segment.name = `PhaseSegment_${idx}`;
        segment.userData.ignoreWaveColor = true;
        segment.position.set(cfg.x, cfg.y, cfg.z);
        segment.rotation.set(cfg.rotX, cfg.rotY, 0);
        segment.renderOrder = archOrder;
        segment.userData.isStreamSegment = true;
        segment.userData.segmentIndex = idx;
        segment.userData.baseZ = cfg.z;
        segment.userData.visualCoreImmutable = true;
        flowGroup.add(segment);
        phaseSegments.push(segment);
      });
      root.add(flowGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const fieldHalo = new THREE.Mesh(geometries.haloGeometry, materials.haloMat);
      fieldHalo.name = 'GatewayFieldHalo';
      fieldHalo.userData.ignoreWaveColor = true;
      fieldHalo.position.set(0.0, 0.02, 0.02);
      fieldHalo.rotation.set(Math.PI / 2, 0.0, Math.PI * 0.08);
      fieldHalo.scale.set(1.04, 0.92, 1.04);
      fieldHalo.renderOrder = archOrder;
      auraGroup.add(fieldHalo);

      const particles = new THREE.Points(geometries.particleGeometry, materials.particleMat);
      particles.name = 'GatewayFieldParticles';
      particles.userData.ignoreWaveColor = true;
      particles.frustumCulled = false;
      particles.renderOrder = archOrder;
      auraGroup.add(particles);

      const shellColor = 0xc2f8ff;
      const shell1 = createNodeHologramShell(lens, shellColor);
      if (shell1) {
        shell1.name = 'GatewayShell_1';
        shell1.position.copy(lens.position);
        shell1.quaternion.copy(lens.quaternion);
        shell1.scale.copy(lens.scale).multiplyScalar(1.12);
        shell1.frustumCulled = false;
        shell1.renderOrder = archOrder;
        if (shell1.material?.uniforms?.uOpacity) shell1.material.uniforms.uOpacity.value = 0.078;
        auraGroup.add(shell1);
      }

      const shell2 = createNodeHologramShell(lens, shellColor);
      if (shell2) {
        shell2.name = 'GatewayShell_2';
        shell2.position.copy(lens.position);
        shell2.quaternion.copy(lens.quaternion);
        shell2.scale.copy(lens.scale).multiplyScalar(1.22);
        shell2.frustumCulled = false;
        shell2.renderOrder = archOrder;
        if (shell2.material?.uniforms?.uOpacity) shell2.material.uniforms.uOpacity.value = 0.046;
        auraGroup.add(shell2);
      }

      const edgeGlow = createNodeNeonEdgeGlowShell(lens, 0x9eefff, {
        glowIntensity: 0.92,
        edgeWidth: 0.072,
        pulseAmount: 0.0
      });
      if (edgeGlow) {
        edgeGlow.name = 'GatewayEdgeGlow';
        edgeGlow.position.copy(lens.position);
        edgeGlow.quaternion.copy(lens.quaternion);
        edgeGlow.scale.copy(lens.scale).multiplyScalar(1.02);
        edgeGlow.frustumCulled = false;
        edgeGlow.renderOrder = archOrder;
        auraGroup.add(edgeGlow);
      }

      root.add(auraGroup);

      root.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          if (o.material) {
            const materialsRef = Array.isArray(o.material) ? o.material : [o.material];
            for (const material of materialsRef) {
              material.userData = {
                ...(material.userData || {}),
                wavePatchMode: 'DEFAULT'
              };
            }
          }
          validateMeshGeometry(o, o.name || 'input-data-gateway');
        }
      });

      group.userData.gatewayRingRotationSpeed = 0.16;
      group.userData.portalOscillationAmplitude = 0.034;
      group.userData.portalOscillationSpeed = 0.78;
      group.userData.streamFlowSpeed = 0.72;
      group.userData.streamCount = streamCount;
      group.userData.gatewayAnimationRefs = {
        ring: thresholdGroup,
        portal: gateHeartRig,
        streamSegments: phaseSegments
      };
      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INPUT_DATA_GATEWAY';
      group.userData.visualReady = true;

      root.userData.nodeGeometryName = 'INPUT_DATA_GATEWAY_FIRST_GATE_RELIQUARY';
      root.userData.visualReady = true;
      group.add(root);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createInputDataGateway',
        category: 'input',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err,
        visualCode
      });
      return null;
    }
  }

  /**
   * INPUT: INCOMING_FUNNEL (NEW - Session 63)
   * Ritual aperture concentrating incoming data/signals
   * - Open capture crown with asymmetric receiving wings
   * - Bright inner lens and throat seed
   * - Halo bands and faint field particles
   * - Animation: Slow root rotation only
   * 
   * VISUAL MEANING: "ATOMA is listening."
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createInputIncomingFunnel(group, color) {
    try {
      const geometries = _getInputIncomingReliquaryGeometries();
      const materials = _getInputIncomingReliquaryMaterials(color);

      const root = new THREE.Group();
      root.name = 'INPUT_INCOMING_NODE';
      root.userData.visualVariant = 'INPUT_INCOMING_RITUAL_APERTURE_V2';

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const lens = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      lens.name = 'IngressLens';
      lens.position.set(0.0, -0.02, 0.0);
      lens.rotation.set(0.18, 0.52, -0.08);
      lens.renderOrder = EnhancedNodeModels._getCoreRenderOrder();
      lens.userData.isInputApertureCore = true;
      lens.userData.visualCoreImmutable = true;
      coreGroup.add(lens);

      const lensCage = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.lineMat);
      lensCage.name = 'IngressLensCage';
      lensCage.position.copy(lens.position);
      lensCage.rotation.copy(lens.rotation);
      lensCage.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
      lensCage.userData.isEdgeCage = true;
      coreGroup.add(lensCage);

      const throatSeed = new THREE.Mesh(geometries.seedGeometry, materials.seedMat);
      throatSeed.name = 'ThroatSeed';
      throatSeed.position.set(0.03, -0.16, -0.02);
      throatSeed.rotation.set(-0.12, 0.34, 0.08);
      throatSeed.renderOrder = EnhancedNodeModels._getCoreRenderOrder();
      throatSeed.userData.isFocalCore = true;
      throatSeed.userData.visualCoreImmutable = true;
      coreGroup.add(throatSeed);

      const throatEdges = new THREE.LineSegments(geometries.seedEdgesGeometry, materials.lineMat);
      throatEdges.name = 'ThroatSeedEdges';
      throatEdges.position.copy(throatSeed.position);
      throatEdges.rotation.copy(throatSeed.rotation);
      throatEdges.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
      coreGroup.add(throatEdges);

      root.add(coreGroup);

      const entryGroup = new THREE.Group();
      entryGroup.name = 'ENTRY_GROUP';

      const wingConfigs = [
        { name: 'CaptureWing_A', pos: [0.38, 0.42, 0.08], rot: [0.22, 0.48, 0.12], scale: [1.0, 1.12, 0.9] },
        { name: 'CaptureWing_B', pos: [-0.28, 0.34, -0.22], rot: [-0.1, -0.92, -0.28], scale: [0.92, 1.0, 0.84] },
        { name: 'CaptureWing_C', pos: [0.12, 0.56, -0.35], rot: [0.4, 0.2, -0.14], scale: [0.84, 1.16, 0.76] },
        { name: 'CaptureWing_D', pos: [-0.08, 0.24, 0.3], rot: [-0.24, 0.76, 0.2], scale: [0.8, 0.92, 0.72] }
      ];
      wingConfigs.forEach((cfg) => {
        const wing = new THREE.Mesh(geometries.wingGeometry, materials.wingMat);
        wing.name = cfg.name;
        wing.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        wing.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        wing.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        wing.renderOrder = EnhancedNodeModels._getCoreRenderOrder();
        wing.userData.visualCoreImmutable = true;
        wing.userData.isEntryWing = true;
        entryGroup.add(wing);

        const wingEdges = new THREE.LineSegments(geometries.wingEdgesGeometry, materials.lineMat);
        wingEdges.name = `${cfg.name}_Edges`;
        wingEdges.position.copy(wing.position);
        wingEdges.rotation.copy(wing.rotation);
        wingEdges.scale.copy(wing.scale);
        wingEdges.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
        wingEdges.userData.isEdgeCage = true;
        entryGroup.add(wingEdges);
      });

      const haloBand = new THREE.Mesh(geometries.haloGeometry, materials.ribbonMat);
      haloBand.name = 'CaptureHaloBand';
      haloBand.position.set(0.0, 0.38, 0.0);
      haloBand.rotation.set(Math.PI / 2, 0.0, Math.PI * 0.13);
      haloBand.scale.set(1.08, 0.96, 1.08);
      haloBand.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
      entryGroup.add(haloBand);

      const haloRingA = new THREE.Mesh(geometries.haloRingGeometry, materials.ringMat);
      haloRingA.name = 'CaptureHaloRing_A';
      haloRingA.position.set(0.0, 0.28, 0.0);
      haloRingA.rotation.set(Math.PI / 2, 0.16, Math.PI * 0.08);
      haloRingA.scale.set(1.0, 0.94, 1.0);
      haloRingA.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
      entryGroup.add(haloRingA);

      const haloArcB = new THREE.Mesh(geometries.arcGeometry, materials.ribbonMat);
      haloArcB.name = 'CaptureHaloArc_B';
      haloArcB.position.set(-0.04, 0.1, 0.03);
      haloArcB.rotation.set(Math.PI * 0.5, -Math.PI * 0.18, Math.PI * 0.42);
      haloArcB.scale.set(1.1, 0.92, 1.1);
      haloArcB.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
      entryGroup.add(haloArcB);

      const guideRibbonA = new THREE.Mesh(geometries.ribbonGeometry, materials.ribbonMat);
      guideRibbonA.name = 'IngressRibbon_A';
      guideRibbonA.position.set(0.18, -0.02, 0.06);
      guideRibbonA.rotation.set(0.16, 0.4, 0.08);
      guideRibbonA.scale.set(0.68, 1.0, 0.5);
      entryGroup.add(guideRibbonA);

      const guideRibbonB = new THREE.Mesh(geometries.ribbonGeometry, materials.ribbonMat);
      guideRibbonB.name = 'IngressRibbon_B';
      guideRibbonB.position.set(-0.2, -0.06, -0.05);
      guideRibbonB.rotation.set(-0.16, -0.52, -0.08);
      guideRibbonB.scale.set(0.52, 1.0, 0.42);
      entryGroup.add(guideRibbonB);

      root.add(entryGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const fieldParticles = new THREE.Points(geometries.particleGeometry, materials.particleMat);
      fieldParticles.name = 'EntryFieldParticles';
      fieldParticles.frustumCulled = false;
      auraGroup.add(fieldParticles);

      const shellColor = 0xb8f7ff;
      const shell1 = createNodeHologramShell(lens, shellColor);
      if (shell1) {
        shell1.name = 'InputShell_1';
        shell1.position.copy(lens.position);
        shell1.quaternion.copy(lens.quaternion);
        shell1.scale.copy(lens.scale).multiplyScalar(1.12);
        shell1.frustumCulled = false;
        shell1.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
        if (shell1.material?.uniforms?.uOpacity) shell1.material.uniforms.uOpacity.value = 0.08;
        auraGroup.add(shell1);
      }

      const shell2 = createNodeHologramShell(lens, shellColor);
      if (shell2) {
        shell2.name = 'InputShell_2';
        shell2.position.copy(lens.position);
        shell2.quaternion.copy(lens.quaternion);
        shell2.scale.copy(lens.scale).multiplyScalar(1.22);
        shell2.frustumCulled = false;
        shell2.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
        if (shell2.material?.uniforms?.uOpacity) shell2.material.uniforms.uOpacity.value = 0.05;
        auraGroup.add(shell2);
      }

      const edgeGlow = createNodeNeonEdgeGlowShell(lens, 0x9eefff, {
        glowIntensity: 0.88,
        edgeWidth: 0.07,
        pulseAmount: 0.0
      });
      if (edgeGlow) {
        edgeGlow.name = 'InputEdgeGlow';
        edgeGlow.position.copy(lens.position);
        edgeGlow.quaternion.copy(lens.quaternion);
        edgeGlow.scale.copy(lens.scale).multiplyScalar(1.01);
        edgeGlow.frustumCulled = false;
        edgeGlow.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
        auraGroup.add(edgeGlow);
      }

      const outerHalo = new THREE.Mesh(geometries.haloRingGeometry, materials.ringMat);
      outerHalo.name = 'OuterListeningHalo';
      outerHalo.position.set(0.0, 0.26, 0.0);
      outerHalo.rotation.set(Math.PI / 2, Math.PI * 0.35, Math.PI * 0.16);
      outerHalo.scale.set(1.24, 1.0, 1.24);
      auraGroup.add(outerHalo);

      root.add(auraGroup);

      root.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          validateMeshGeometry(o, o.name || 'input-incoming-reliquary');
        }
      });

      root.userData.funnelRotationSpeed = 0.08;
      root.userData.funnelBreathingAmplitude = 0.02;
      root.userData.funnelBreathingSpeed = 0.42;
      root.userData.visualCoreImmutable = true;
      root.userData.nodeGeometryName = 'INPUT_INCOMING_RITUAL_APERTURE';
      root.userData.visualReady = true;

      group.add(root);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createInputIncomingFunnel',
        category: 'input',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  // ===== PROCESS NODES (Amber/Gold - 4 variants) =====

  /**
   * Main process node creator
   * CANONICAL CATEGORY: PROCESS
   * - DiamondLattice
   * - Helix
   * - DoubleHelix
   * - MeshColumn
   * - HexagonalPrism
   * - FluxChamber (Session 63)
   * - TransformationSpine (Session 63)
   * - ConversionOrbit (Session 63)
   * - ComputationVortex (NEW - Session 81)
   * - TransformMatrix (NEW - Session 81)
   * - PipelineFlow (NEW - Session 81)
   */
  static createProcessNode(group, index, color) {
    const pool = CATEGORY_POOLS.process || [];
    const poolFns = {
      201: this.createProcessFluxChamber.bind(this),
      202: this.createProcessTransformationSpine.bind(this),
      203: this.createProcessConversionOrbit.bind(this),
      204: ProcessEnhancedVariants.createProcessEnhanced_FlowRecomposer.bind(ProcessEnhancedVariants),
      205: ProcessEnhancedVariants.createProcessEnhanced_TemporalShifter.bind(ProcessEnhancedVariants),
      206: ProcessEnhancedVariants.createProcessEnhanced_IterativeEngine.bind(ProcessEnhancedVariants)
    };
    const counter = Number.isFinite(index) ? index : 0;
    const selected = pool[counter % pool.length];
    return (poolFns[selected] || poolFns[pool[0]])(group, color);
  }

  /**
   * PROCESS: FLUX_CHAMBER (NEW - Session 63)
   * Chamber where data enters, transforms, and exits
   * - Hollow asymmetric structure (not spherical)
   * - Visible internal path/corridor
   * - Inner core rotates at different speed
   * - Animation: Slow rotation + inner core counter-rotation
   * 
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createProcessFluxChamber(group, color) {
    try {
      // Create outer asymmetric chamber shell (twisted hex-like shape)
      const outerVertices = new Float32Array([
        // Base hexagon (asymmetric)
        0.35, -0.45, 0.0,     // 0
        0.20, -0.45, 0.32,    // 1
        -0.15, -0.45, 0.38,   // 2
        -0.40, -0.45, 0.15,   // 3
        -0.30, -0.45, -0.25,  // 4
        0.15, -0.45, -0.35,   // 5
        
        // Upper middle (transition)
        0.32, 0.0, -0.08,     // 6
        0.18, 0.0, 0.30,      // 7
        -0.12, 0.0, 0.35,     // 8
        -0.38, 0.0, 0.12,     // 9
        -0.28, 0.0, -0.28,    // 10
        0.12, 0.0, -0.32,     // 11
        
        // Top (narrower)
        0.25, 0.45, -0.12,    // 12
        0.10, 0.45, 0.25,     // 13
        -0.15, 0.45, 0.28,    // 14
        -0.30, 0.45, 0.08,    // 15
        -0.22, 0.45, -0.20,   // 16
        0.08, 0.45, -0.25     // 17
      ]);

      const outerIndices = new Uint16Array([
        // Base to middle (6 sides - asymmetric)
        0, 6, 7,
        1, 7, 8,
        2, 8, 9,
        3, 9, 10,
        4, 10, 11,
        5, 11, 6,
        0, 1, 7,
        1, 2, 8,
        2, 3, 9,
        3, 4, 10,
        4, 5, 11,
        5, 0, 6,
        
        // Middle to top (6 sides)
        6, 12, 13,
        7, 13, 14,
        8, 14, 15,
        9, 15, 16,
        10, 16, 17,
        11, 17, 12,
        6, 7, 13,
        7, 8, 14,
        8, 9, 15,
        9, 10, 16,
        10, 11, 17,
        11, 6, 12
      ]);

      const outerGeometry = new THREE.BufferGeometry();
      outerGeometry.setAttribute('position', new THREE.BufferAttribute(outerVertices, 3));
      outerGeometry.setIndex(new THREE.BufferAttribute(outerIndices, 1));
      outerGeometry.computeVertexNormals();

      const outerMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.7,
        roughness: 0.25,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.6
      });

      const outerChamber = new THREE.Mesh(outerGeometry, outerMaterial);
      outerChamber.userData.isOuterChamber = true;
      outerChamber.userData.visualCoreImmutable = true;
      group.add(outerChamber);

      // Create inner processing core (counter-rotating asymmetric shape)
      const innerCoreGeometry = new THREE.OctahedronGeometry(0.28, 2);
      innerCoreGeometry.scale(0.9, 1.2, 0.75); // Asymmetric elongation
      
      const innerCoreMaterial = new THREE.MeshStandardMaterial({
        transparent: false,
        opacity: 1,
        depthWrite: true,
        depthTest: true,
        side: THREE.FrontSide,
        color: color,
        metalness: 0.85,
        roughness: 0.15,
        emissive: color,
        emissiveIntensity: 0.35

      });

      const innerCore = new THREE.Mesh(innerCoreGeometry, innerCoreMaterial);
      innerCore.rotation.set(Math.PI / 8, Math.PI / 6, 0);
      innerCore.userData.isProcessorCore = true;
      innerCore.userData.visualCoreImmutable = true;
      group.add(innerCore);

      // Create visible internal corridor (thin plane representing flow path)
      const corridorVertices = new Float32Array([
        -0.15, -0.30, -0.05,
        0.20, -0.30, 0.15,
        0.15, 0.30, 0.10,
        -0.20, 0.30, -0.10
      ]);

      const corridorIndices = new Uint16Array([
        0, 1, 2,
        0, 2, 3
      ]);

      const corridorGeometry = new THREE.BufferGeometry();
      corridorGeometry.setAttribute('position', new THREE.BufferAttribute(corridorVertices, 3));
      corridorGeometry.setIndex(new THREE.BufferAttribute(corridorIndices, 1));
      corridorGeometry.computeVertexNormals();

      const corridorMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide
      });

      const corridor = new THREE.Mesh(corridorGeometry, corridorMaterial);
      corridor.userData.isFlowCorridor = true;
      corridor.userData.visualCoreImmutable = true;
      group.add(corridor);

      // Store animation metadata (transform-only)
      group.userData.chamberOuterRotationAxis = new THREE.Vector3(0.4, 1, 0.2).normalize();
      group.userData.chamberOuterRotationSpeed = 0.1;
      group.userData.chamberInnerRotationAxis = new THREE.Vector3(-0.3, -0.9, 0.4).normalize();
      group.userData.chamberInnerRotationSpeed = -0.14; // Counter-rotation

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'PROCESS_FLUX_CHAMBER';

      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createProcessFluxChamber',
        category: 'process',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * PROCESS: TRANSFORMATION_SPINE (NEW - Session 63)
   * Sequential computation stages stacked vertically
   * - Vertical segmented spine structure
   * - Each segment slightly rotated relative to next
   * - Clear sense of "before → after" progression
   * - Animation: Very slow axial rotation + gentle breathing scale (±2%)
   * 
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createProcessTransformationSpine(group, color) {
    try {
      const segmentCount = 7;
      const segmentHeight = 0.22;
      const spineMaterial = new THREE.MeshStandardMaterial({
        transparent: false,
        opacity: 1,
        depthWrite: true,
        depthTest: true,
        side: THREE.FrontSide,
        color: color,
        metalness: 0.75,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.25

      });

      // Create segment-by-segment spine with progressive rotation
      for (let i = 0; i < segmentCount; i++) {
        // Create octagonal segment (8-sided, represents transformation stage)
        const segmentGeometry = new THREE.CylinderGeometry(0.4, 0.4, segmentHeight, 8);
        const segment = new THREE.Mesh(segmentGeometry, spineMaterial);
        
        // Position vertically
        const yPos = (i - segmentCount / 2) * (segmentHeight + 0.06);
        segment.position.y = yPos;
        
        // Progressive rotation (before → after effect)
        const rotationAmount = (i / (segmentCount - 1)) * Math.PI * 0.25;
        segment.rotation.z = rotationAmount;
        
        segment.userData.spineSegmentIndex = i;
        segment.userData.visualCoreImmutable = true;
        group.add(segment);
      }

      // Create central connecting axis
      const axisGeometry = new THREE.CylinderGeometry(0.08, 0.08, segmentCount * (segmentHeight + 0.06), 6);
      const axisMaterial = new THREE.MeshStandardMaterial({
        transparent: false,
        opacity: 1,
        depthWrite: true,
        depthTest: true,
        side: THREE.FrontSide,
        color: color,
        metalness: 0.9,
        roughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.4

      });
      const axis = new THREE.Mesh(axisGeometry, axisMaterial);
      axis.userData.isSpinalAxis = true;
      axis.userData.visualCoreImmutable = true;
      group.add(axis);

      // Add connector rings between segments for visual continuity
      for (let i = 0; i < segmentCount - 1; i++) {
        const ringGeometry = new THREE.TorusGeometry(0.42, 0.04, 8, 24);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.4
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        
        const yPos = (i + 0.5 - segmentCount / 2) * (segmentHeight + 0.06);
        ring.position.y = yPos;
        ring.userData.visualCoreImmutable = true;
        group.add(ring);
      }

      // Store animation metadata (transform-only breathing + rotation)
      group.userData.spineRotationSpeed = 0.08; // Very slow axial
      group.userData.spineBreathingAmplitude = 0.02; // ±2% scale
      group.userData.spineBreathingSpeed = 0.5;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'PROCESS_TRANSFORMATION_SPINE';

      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createProcessTransformationSpine',
        category: 'process',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * PROCESS: CONVERSION_ORBIT (NEW - Session 63)
   * Input captured, processed, released
   * - Central processor core (non-spherical tetrahedral form)
   * - Two orbiting processing rings (NO intersection with core)
   * - Animation: Rings orbit independently, core stable
   * 
   * VISUAL SAFETY: Static geometry, transform-only animation (orbit), immutable
   */
  static createProcessConversionOrbit(group, color) {
    try {
      // Create central processor core (asymmetric tetrahedron - non-spherical)
      const processorGeometry = new THREE.TetrahedronGeometry(0.35, 2);
      processorGeometry.scale(1.1, 1.3, 0.9); // Asymmetric elongation
      
      const processorMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.12,
        transmission: 0, // Phase B.3.A: transmission disabled to prevent RenderTransmissionPass
        thickness: 0.3,
        ior: 1.45,
        emissive: color,
        emissiveIntensity: 0.3
      });

      const processor = new THREE.Mesh(processorGeometry, processorMaterial);
      processor.rotation.set(Math.PI / 6, Math.PI / 4, -Math.PI / 8);
      processor.userData.isProcessorCore = true;
      processor.userData.visualCoreImmutable = true;
      group.add(processor);

      // Create first orbiting processing ring (outer)
      const ring1Geometry = new THREE.TorusGeometry(0.75, 0.08, 8, 64);
      const ringMaterial = new THREE.MeshStandardMaterial({
        transparent: false,
        opacity: 1,
        depthWrite: true,
        depthTest: true,
        side: THREE.FrontSide,
        color: color,
        metalness: 0.7,
        roughness: 0.25,
        emissive: color,
        emissiveIntensity: 0.2

      });

      const ring1 = new THREE.Mesh(ring1Geometry, ringMaterial);
      ring1.rotation.x = Math.PI / 3;
      ring1.userData.isOrbitRing = true;
      ring1.userData.orbitRadius = 0.75;
      ring1.userData.orbitSpeed = 0.18;
      ring1.userData.orbitAxis = new THREE.Vector3(1, 0.5, 0.3).normalize();
      ring1.userData.visualCoreImmutable = true;
      group.add(ring1);

      // Create second orbiting processing ring (inner, counter-rotating)
      const ring2Geometry = new THREE.TorusGeometry(0.52, 0.07, 8, 48);
      const ring2 = new THREE.Mesh(ring2Geometry, ringMaterial);
      ring2.rotation.y = Math.PI / 4;
      ring2.rotation.z = Math.PI / 6;
      ring2.userData.isOrbitRing = true;
      ring2.userData.orbitRadius = 0.52;
      ring2.userData.orbitSpeed = -0.22; // Counter-rotation
      ring2.userData.orbitAxis = new THREE.Vector3(-0.5, -1, 0.2).normalize();
      ring2.userData.visualCoreImmutable = true;
      group.add(ring2);

      // Store animation metadata (orbit-based)
      group.userData.orbitRingCount = 2;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'PROCESS_CONVERSION_ORBIT';

      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createProcessConversionOrbit',
        category: 'process',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  // ===== INTEGRATION NODES (Green - 4 variants) =====

  /**
   * Integration Node 0: Two halves with glowing bridge
   */
  static createIntegrationNode0(group, color) {
    const halfGeometry = new THREE.SphereGeometry(0.5, 16, 16, 0, Math.PI);
    const material = new THREE.MeshStandardMaterial({
      transparent: false,
      opacity: 1,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide,
      color: color,
      metalness: 0.6,
      roughness: 0.4,
      emissive: color,
      emissiveIntensity: 0.25

    });

    // Left half
    const leftHalf = new THREE.Mesh(halfGeometry, material.clone());
    leftHalf.position.x = -0.3;
    leftHalf.userData.visualLayer = 'CORE';
    group.add(leftHalf);

    // Right half
    const rightHalf = new THREE.Mesh(halfGeometry, material.clone());
    rightHalf.position.x = 0.3;
    rightHalf.rotation.y = Math.PI;
    rightHalf.userData.visualLayer = 'CORE';
    group.add(rightHalf);

    // Glowing bridge beam
    const bridgeGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.15);
    const bridgeMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8
    });
    const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.userData.visualLayer = 'INTERNAL';
    group.add(bridge);

    return group;
  }

  /**
   * Integration Node 1: Chaotic Bridge Core
   */
  static createIntegrationNode1(group, color) {
    const nodeKey = group?.userData?.nodeId || String(color || 0);
    const seed = hashNodeIdToFloat(nodeKey);
    const rng = _mythicSeededRng(Math.floor(seed * 1000) || 1);
    const root = new THREE.Group();
    root.name = 'INTEGRATION_CHAOTIC_BRIDGE';

    const baseMaterial = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.4,
      roughness: 0.45,
      emissive: color,
      emissiveIntensity: 0.15
    });

    const perturb = (geom, magnitude = 0.04) => {
      const attr = geom.attributes.position;
      for (let i = 0; i < attr.count; i++) {
        attr.setXYZ(
          i,
          attr.getX(i) + (rng() - 0.5) * magnitude,
          attr.getY(i) + (rng() - 0.5) * (magnitude * 0.5),
          attr.getZ(i) + (rng() - 0.5) * magnitude
        );
      }
      geom.computeVertexNormals();
    };

    const createCore = (scaleVec, offsetX) => {
      const geom = new THREE.BoxGeometry(0.45, 0.9, 0.3);
      perturb(geom, 0.05);
      const mesh = new THREE.Mesh(geom, baseMaterial.clone());
      mesh.scale.set(scaleVec.x, scaleVec.y, scaleVec.z);
      mesh.position.x = offsetX;
      mesh.rotateY(rng() * Math.PI * 0.2);
      mesh.userData.coreReference = true;
      root.add(mesh);
      return mesh;
    };

    const coreA = createCore(new THREE.Vector3(1, 1, 1), -0.28);
    const coreB = createCore(new THREE.Vector3(0.9, 1.1, 0.85), 0.32);

    // Bridge network
    const bridgePositions = [];
    const samplePoints = mesh => {
      const posAttr = mesh.geometry.attributes.position;
      const points = [];
      for (let i = 0; i < posAttr.count; i++) {
        const world = new THREE.Vector3();
        world.fromBufferAttribute(posAttr, i);
        world.applyMatrix4(mesh.matrixWorld);
        points.push(world);
      }
      return points;
    };
    group.updateMatrixWorld();
    const pointsA = samplePoints(coreA);
    const pointsB = samplePoints(coreB);
    const segmentCount = 18;
    for (let i = 0; i < segmentCount; i++) {
      const pa = pointsA[Math.floor(rng() * pointsA.length)];
      const pb = pointsB[Math.floor(rng() * pointsB.length)];
      bridgePositions.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
    }
    const bridgeGeom = new THREE.BufferGeometry();
    bridgeGeom.setAttribute('position', new THREE.Float32BufferAttribute(bridgePositions, 3));
    const bridge = new THREE.Line(bridgeGeom, new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.65
    }));
    bridge.name = 'BridgeNetwork';
    root.add(bridge);

    // Fragment plates
    const plates = new THREE.Group();
    plates.name = 'FragmentPlates';
    const plateCount = 8 + Math.floor(rng() * 3);
    for (let i = 0; i < plateCount; i++) {
      const plateGeo = new THREE.TetrahedronGeometry(0.08 + rng() * 0.04, 0);
      perturb(plateGeo, 0.02);
      const plate = new THREE.Mesh(plateGeo, baseMaterial.clone());
      const radius = 0.45 + rng() * 0.2;
      const angle = rng() * Math.PI * 2;
      plate.position.set(
        Math.cos(angle) * radius,
        -0.1 + (rng() - 0.5) * 0.2,
        Math.sin(angle) * radius
      );
      plate.scale.setScalar(0.8 + rng() * 0.4);
      plate.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      plate.userData.fragmentPlate = true;
      plates.add(plate);
    }
    root.add(plates);

    // Orbit interference layer
    const orbitPoints = [];
    const orbitSegments = 7;
    for (let i = 0; i < orbitSegments; i++) {
      const radius = 0.6 + (i * 0.04);
      const angle = i * Math.PI * 0.35 + rng() * 0.4;
      orbitPoints.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        -0.1 + rng() * 0.3,
        Math.sin(angle) * radius
      ));
    }
    const orbitCurve = new THREE.CatmullRomCurve3(orbitPoints, false, 'catmullrom', 0.5);
    const orbitTube = new THREE.TubeGeometry(orbitCurve, 48, 0.025, 5, false);
    const orbitMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.35
    });
    const orbit = new THREE.Mesh(orbitTube, orbitMat);
    orbit.name = 'OrbitInterference';
    orbit.userData.isIntegrationOrbit = true;
    orbit.rotation.x = 0.1;
    root.add(orbit);

    // Wire chaos cage
    const cageGeo = new THREE.BoxGeometry(1.4, 1.1, 0.9);
    perturb(cageGeo, 0.08);
    const cageEdges = new THREE.LineSegments(new THREE.EdgesGeometry(cageGeo), new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3
    }));
    cageEdges.scale.set(1.08, 1.0, 0.9);
    cageEdges.userData.visualLayer = 'INTERNAL';
    root.add(cageEdges);

    group.add(root);
    return group;
  }

  /**
   * Integration Node 2: Square frame with crossing beams
   */
  static createIntegrationNode2(group, color) {
    const frameGeometry = new THREE.BoxGeometry(1, 1, 0.1);
    const material = new THREE.MeshStandardMaterial({
      transparent: false,
      opacity: 1,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide,
      color: color,
      metalness: 0.6,
      roughness: 0.4,
      emissive: color,
      emissiveIntensity: 0.2

    });
    const frame = new THREE.Mesh(frameGeometry, material.clone());
    frame.userData.visualLayer = 'CORE';
    group.add(frame);

    // Crossing beams
    const beamGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.1);
    
    // Horizontal beam
    const hBeam = new THREE.Mesh(beamGeometry, material.clone());
    hBeam.userData.visualLayer = 'INTERNAL';
    group.add(hBeam);

    // Vertical beam
    const vBeam = new THREE.Mesh(beamGeometry, material.clone());
    vBeam.rotation.z = Math.PI / 2;
    vBeam.userData.visualLayer = 'INTERNAL';
    group.add(vBeam);

    return group;
  }

  /**
   * Main integration node creator
   * CANONICAL CATEGORY: INTEGRATION (KNOT-PRIMARY)
   * - TrefoilKnot
   * - FigureEightKnot
   * - InfiniteSelfIntersectingKnot
   * - ChaoticKnotCore
   * - BorromeanRings
   * - TorusKnot
   * - TripleHelixKnot
   * - SingularityKnot
   * - TrefoilEnhanced (NEW - Session 82)
   * - InterwovenLoops (NEW - Session 82)
   * - KnotSingularity (NEW - Session 82)
   */
  static createIntegrationNode(group, index, color) {
    const pool = CATEGORY_POOLS.integration || [];
    const factoryMap = {
      301: this.createKnotTrefoil.bind(this),
      302: this.createKnotFigureEight.bind(this),
      303: this.createKnotInfiniteSelfIntersecting.bind(this),
      304: this.createKnotChaotic.bind(this),
      305: this.createKnotBorromean.bind(this),
      306: this.createKnotTorusKnot.bind(this),
      307: this.createKnotTripleHelix.bind(this),
      308: this.createExtremeInput1.bind(this),
      309: IntegrationEnhancedVariants.createIntegrationEnhanced_SignalKnot.bind(IntegrationEnhancedVariants),
      310: IntegrationEnhancedVariants.createIntegrationEnhanced_ProtocolTangle.bind(IntegrationEnhancedVariants),
      311: IntegrationEnhancedVariants.createIntegrationEnhanced_ContinuityBinder.bind(IntegrationEnhancedVariants)
    };
    if (pool.length === 0) return null;
    const counter = Number.isFinite(index) ? index : 0;
    const selected = pool[counter % pool.length];
    const factory = factoryMap[selected];
    if (!factory) return null;

    // Copy nodeId from input group (if exists)
    const result = factory(group, color);
    if (result && group.userData && group.userData.nodeId) {
      result.userData.nodeId = group.userData.nodeId;
    }
    return result;
  }

  // ===== ANALYTICS NODES (Violet - 4 variants) =====

/**
 * Analytics Node 2: Hexagonal disc with fractal patterns
 */
static createAnalyticsNode2(group, color) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.28,
    metalness: 0.6,
    roughness: 0.25
  });

  // Base: stepped hex plinth
  const baseGeoA = new THREE.CylinderGeometry(1.0, 1.05, 0.18, 6, 1);
  const baseA = new THREE.Mesh(baseGeoA, mat);
  baseA.position.y = -0.25;
  validateMeshGeometry(baseA, 'createAnalyticsNode2:baseA');
  group.add(baseA);

  const baseGeoB = new THREE.CylinderGeometry(0.8, 0.9, 0.12, 6, 1);
  const baseB = new THREE.Mesh(baseGeoB, mat);
  baseB.position.y = -0.05;
  validateMeshGeometry(baseB, 'createAnalyticsNode2:baseB');
  group.add(baseB);

  // Spine
  const spineGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 12, 1);
  const spine = new THREE.Mesh(spineGeo, mat);
  spine.position.y = 0.65;
  spine.userData.isAnalyticsSpine = true;
  validateMeshGeometry(spine, 'createAnalyticsNode2:spine');
  group.add(spine);

  // Core: dodeca + wire overlay
  const coreGeo = new THREE.DodecahedronGeometry(0.45, 0);
  const core = new THREE.Mesh(coreGeo, mat);
  core.position.y = 1.2;
  core.userData.isCore = true;
  validateMeshGeometry(core, 'createAnalyticsNode2:core');
  group.add(core);

  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(0.48, 0)),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 })
  );
  wire.position.y = 1.2;
  group.add(wire);

  // Orbit frame
  const ringGeo = new THREE.TorusGeometry(0.9, 0.05, 10, 32, Math.PI * 2);
  const ring = new THREE.Mesh(ringGeo, mat);
  ring.position.y = 1.2;
  ring.rotation.x = Math.PI * 0.5;
  validateMeshGeometry(ring, 'createAnalyticsNode2:ring');
  group.add(ring);

  // Fins (4) angled upward
  const finGeo = new THREE.BoxGeometry(0.16, 0.6, 0.08);
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const fin = new THREE.Mesh(finGeo, mat);
    fin.position.set(Math.cos(angle) * 0.7, 0.25, Math.sin(angle) * 0.7);
    fin.rotation.y = angle + Math.PI * 0.25;
    fin.rotation.z = Math.PI * 0.2;
    validateMeshGeometry(fin, `createAnalyticsNode2:fin${i}`);
    group.add(fin);
  }

  group.userData.visualTier = "ANALYTICS_V3";
  group.userData.hasEnergyCore = true;
  return group;
}

  /**
   * Analytics Node 3: Recursive Insight Engine
   */
  static createAnalyticsNode3(group, color) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.24,
      metalness: 0.55,
      roughness: 0.28
    });

    // Base disk
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.14, 10, 1), mat);
    base.position.y = -0.3;
    validateMeshGeometry(base, 'createAnalyticsNode3:base');
    group.add(base);

    // Spine
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8, 1), mat);
    spine.position.y = 0.4;
    spine.userData.isAnalyticsSpine = true;
    spine.userData.pulseBaseScale = 1;
    validateMeshGeometry(spine, 'createAnalyticsNode3:spine');
    group.add(spine);

    // Core: offset cube
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), mat);
    core.position.y = 0.95;
    core.rotation.set(Math.PI * 0.12, Math.PI * 0.18, 0);
    core.userData.isCore = true;
    validateMeshGeometry(core, 'createAnalyticsNode3:core');
    group.add(core);

    // Wireframe echo
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.48, 0.48, 0.48)),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 })
    );
    wire.position.y = 0.95;
    wire.rotation.y = Math.PI * 0.1;
    group.add(wire);

    // Orbit frame (rect torus)
    const frame = new THREE.Mesh(
      new THREE.TorusGeometry(0.78, 0.05, 10, 28, Math.PI * 2),
      mat
    );
    frame.scale.set(1.15, 0.75, 1);
    frame.position.y = 0.95;
    frame.rotation.set(Math.PI * 0.5, Math.PI * 0.2, Math.PI * 0.1);
    validateMeshGeometry(frame, 'createAnalyticsNode3:frame');
    group.add(frame);

    // Outer wireframe layers (kept local to this factory for stable analytics aura)
    const frameWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.TorusGeometry(0.78, 0.05, 10, 28, Math.PI * 2), 8),
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
        depthTest: true
      })
    );
    frameWire.name = 'FrameWire';
    frameWire.scale.copy(frame.scale);
    frameWire.position.copy(frame.position);
    frameWire.rotation.copy(frame.rotation);
    group.add(frameWire);

    const baseWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.9, 0.95, 0.14, 10, 1), 8),
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        depthTest: true
      })
    );
    baseWire.name = 'BaseWire';
    baseWire.position.copy(base.position);
    group.add(baseWire);

    // Data petals (4)
    const petalGeo = new THREE.BoxGeometry(0.14, 0.55, 0.08);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, mat);
      petal.position.set(Math.cos(angle) * 0.65, 0.35, Math.sin(angle) * 0.65);
      petal.rotation.y = angle + Math.PI * 0.25;
      petal.rotation.z = Math.PI * 0.18;
      validateMeshGeometry(petal, `createAnalyticsNode3:petal${i}`);
      group.add(petal);
    }

    group.userData.nodeGeometryName = 'ANALYTICS_RECURSIVE_INSIGHT_ENGINE_V3';
    return group;
  }

  /**
   * Main analytics node creator
   * CANONICAL CATEGORY: ANALYTICS
   * - DataPyramid
   * - SpinningDataSphere
   * - HexAnalysisMatrix
   * - PrismSpectrumAnalyzer
   * - ObserverLens (Session 63)
   * - FractalEcho (Session 63)
   * - ParallaxOracle (Session 63)
   * - SharedBloom (NEW - Session 81)
   * - InterpretiveSpine (NEW - Session 81)
   * - SignalDrift (NEW - Session 81)
   */
  /**
   * ANALYTICS v2: Predictive Computation Engine
   * Hierarchy:
   * ANALYTICS_NODE
   *   - CORE_GROUP (ComputationCore + LogicFrame)
   *   - DATA_GROUP (HexLayerStack + RotatingDataPlanes + SignalVectors + DataGrid)
   *   - PROJECTION_GROUP (ProjectionDisk + PredictiveParticles)
   */
  static createAnalyticsNodeStyled_v2(group, index, color) {
    try {
      const geometries = _getAnalyticsV2Geometries();
      const materials = _getAnalyticsV2Materials(color);
      const analyticsRoot = new THREE.Group();
      analyticsRoot.name = 'ANALYTICS_NODE';
      analyticsRoot.userData.visualVariant = 'ANALYTICS_V2';

      const seed = group?.userData?.nodeId ? hashString(group.userData.nodeId) : index || 1;
      const rng = _mythicSeededRng(seed);
      const scratch = new THREE.Object3D();

      // CORE GROUP
      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';
      const core = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      core.name = 'ComputationCore';
      core.scale.set(1.0, 1.1, 1.0);
      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.lineMat);
      coreEdges.name = 'LogicFrame';
      coreGroup.add(core);
      coreGroup.add(coreEdges);
      // Vertical data spine (pulse scale.y)
      const spineGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6);
      const spineMat = materials.lineMat.clone();
      spineMat.transparent = true;
      spineMat.opacity = 0.55;
      spineMat.emissive = (spineMat.emissive || new THREE.Color(color));
      spineMat.emissiveIntensity = 0.25;
      const spine = new THREE.Mesh(spineGeo, spineMat);
      spine.name = 'DataSpine';
      spine.userData.isAnalyticsSpine = true;
      spine.userData.pulseBaseScale = 1;
      coreGroup.add(spine);
      analyticsRoot.add(coreGroup);

      // DATA GROUP
      const dataGroup = new THREE.Group();
      dataGroup.name = 'DATA_GROUP';

      // HexLayerStack
      const hexStack = new THREE.Group();
      hexStack.name = 'HexLayerStack';
      const layers = 4;
      for (let i = 0; i < layers; i++) {
        const chopped = (i === 1);
        const ringGeometry = chopped
          ? new THREE.RingGeometry(0.52, 0.7, 6, 1, 0, Math.PI * 1.7)
          : geometries.hexRingGeometry;
        const ring = new THREE.Mesh(ringGeometry, materials.layerMat);
        ring.name = `HexLayer_${i}`;
        ring.position.y = -0.35 + (i / (layers - 1)) * 0.7;
        ring.rotation.z = 0.2 * i + 0.05 * (rng() - 0.5);
        const sx = 1 + (i % 2 === 0 ? 0.02 : -0.02);
        const sz = 1 + (i % 2 === 0 ? -0.02 : 0.02);
        const s = 0.9 + i * 0.05;
        ring.scale.set(s * sx, s, s * sz);
        hexStack.add(ring);
      }
      dataGroup.add(hexStack);

      // RotatingDataPlanes
      const planeGroup = new THREE.Group();
      planeGroup.name = 'RotatingDataPlanes';
      const planeCount = 3;
      for (let i = 0; i < planeCount; i++) {
        const plane = new THREE.Mesh(geometries.planeGeometry, materials.layerMat);
        plane.name = `DataPlane_${i}`;
        plane.position.y = -0.15 + 0.15 * i;
        plane.rotation.set(0.2 * i, 0.35 * i, 0.1 * i);
        plane.scale.set(0.7 + i * 0.1, 0.7 + i * 0.05, 1);
        planeGroup.add(plane);
      }
      dataGroup.add(planeGroup);

      // SignalVectors
      const vectors = new THREE.LineSegments(geometries.vectorGeometry, materials.lineMat);
      vectors.name = 'SignalVectors';
      dataGroup.add(vectors);

      // Floating data shards between rings
      const shardGroup = new THREE.Group();
      shardGroup.name = 'DataShards';
      shardGroup.userData.isAnalyticsShardGroup = true;
      const shardCount = 6;
      for (let i = 0; i < shardCount; i++) {
        const fragGeo = new THREE.IcosahedronGeometry(0.05, 0);
        const fragMat = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.7
        });
        const frag = new THREE.Mesh(fragGeo, fragMat);
        const angle = (i / shardCount) * Math.PI * 2;
        const radius = 0.45;
        frag.position.set(Math.cos(angle) * radius, (rng() - 0.5) * 0.1, Math.sin(angle) * radius);
        frag.userData.orbitAngle = angle;
        frag.userData.orbitSpeed = 0.25 + rng() * 0.2;
        frag.userData.bobPhase = rng() * Math.PI * 2;
        frag.userData.ignoreRaycast = true;
        shardGroup.add(frag);
      }
      dataGroup.add(shardGroup);

      // DataGrid (instanced thin boxes)
      const gridCount = 48;
      const grid = new THREE.InstancedMesh(geometries.gridGeometry, materials.gridMat, gridCount);
      grid.name = 'DataGrid';
      grid.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      for (let i = 0; i < gridCount; i++) {
        const r = 0.75 + rng() * 0.35;
        const ang = rng() * Math.PI * 2;
        const y = -0.45 + rng() * 0.9;
        scratch.position.set(Math.cos(ang) * r, y, Math.sin(ang) * r);
        scratch.rotation.y = ang;
        scratch.rotation.x = (rng() - 0.5) * 0.3;
        const s = 0.6 + rng() * 0.6;
        scratch.scale.set(s, 1, s);
        scratch.updateMatrix();
        grid.setMatrixAt(i, scratch.matrix);
      }
      grid.instanceMatrix.needsUpdate = true;
      dataGroup.add(grid);

      analyticsRoot.add(dataGroup);

      // PROJECTION GROUP
      const projectionGroup = new THREE.Group();
      projectionGroup.name = 'PROJECTION_GROUP';

      const disk = new THREE.Mesh(geometries.diskGeometry, materials.layerMat);
      disk.name = 'ProjectionDisk';
      disk.rotation.x = -Math.PI / 2;
      disk.scale.setScalar(1.15);
      projectionGroup.add(disk);
      // Gradient inner glow ring
      const innerGlowGeo = new THREE.TorusGeometry(0.32, 0.05, 12, 64);
      const innerGlowMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
      });
      const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
      innerGlow.name = 'InnerGlowRing';
      innerGlow.rotation.x = -Math.PI / 2;
      innerGlow.position.y = -0.05;
      projectionGroup.add(innerGlow);

      const particles = new THREE.Points(geometries.particlesGeometry, materials.particleMat);
      particles.name = 'PredictiveParticles';
      particles.frustumCulled = false;
      projectionGroup.add(particles);

      analyticsRoot.add(projectionGroup);

      // Distortion wireframe echo
      const echo = new THREE.Group();
      echo.name = 'AnalyticsEcho';
      echo.scale.setScalar(1.04);
      echo.rotation.y = 0.05;
      const echoMat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.25
      });
      hexStack.children.forEach(r => {
        const wf = new THREE.LineSegments(new THREE.EdgesGeometry(r.geometry), echoMat);
        wf.position.copy(r.position);
        wf.rotation.copy(r.rotation);
        wf.scale.copy(r.scale);
        echo.add(wf);
      });
      planeGroup.children.forEach(p => {
        const wf = new THREE.LineSegments(new THREE.EdgesGeometry(p.geometry), echoMat);
        wf.position.copy(p.position);
        wf.rotation.copy(p.rotation);
        wf.scale.copy(p.scale);
        echo.add(wf);
      });
      projectionGroup.children.forEach(obj => {
        if (obj.isMesh && obj.geometry) {
          const wf = new THREE.LineSegments(new THREE.EdgesGeometry(obj.geometry), echoMat);
          wf.position.copy(obj.position);
          wf.rotation.copy(obj.rotation);
          wf.scale.copy(obj.scale);
          echo.add(wf);
        }
      });
      analyticsRoot.add(echo);

      analyticsRoot.userData.visualReady = true;
      group.add(analyticsRoot);
      return group;
    } catch (err) {
      console.error('[AnalyticsV2Abort]', { reason: err?.message || err });
      return null;
    }
  }

  // Legacy ANALYTICS visuals retained as fallback
  static _createAnalyticsNodeLegacy(group, index, color) {
    const pool = CATEGORY_POOLS.analytics || [];
    const poolFns = {
      401: this.createAnalyticsNode2.bind(this),
      402: this.createAnalyticsNode3.bind(this),
      403: this.createAnalyticsObserverLens.bind(this),
      404: this.createAnalyticsFractalEcho.bind(this),
      405: this.createAnalyticsParallaxOracle.bind(this),
      406: AnalyticsEnhancedVariants.createAnalyticsEnhanced_SignalStratifier.bind(AnalyticsEnhancedVariants),
      407: AnalyticsEnhancedVariants.createAnalyticsEnhanced_TrendExcavator.bind(AnalyticsEnhancedVariants),
      408: AnalyticsEnhancedVariants.createAnalyticsEnhanced_AnomalyLedger.bind(AnalyticsEnhancedVariants)
    };
    
    let selected = pool[(Number.isFinite(index) ? index : 0) % pool.length];
    
    // Safety: ensure visualCode is valid
    if (!poolFns[selected]) {
      console.warn('[AnalyticsFactoryFallback] Invalid variant index:', selected, 'falling back to pool[0]');
      selected = pool[0];
    }

    const result = (poolFns[selected] || poolFns[pool[0]])(group, color);

    // --- Analytics Factory Null Check ---
    if (result === null) {
      console.error('[AnalyticsFactoryNull]', {
        factory: 'createAnalyticsNode',
        visualCode: selected,
        poolIndex: pool[nodeId % pool.length]
      });
    }

    group.userData.__skipRaycast = true;
    return result;
  }

  /**
   * ANALYTICS: OBSERVER_LENS (NEW - Session 63)
   * Non-physical lens that bends perception
   * - Layered optical plates (non-parallel)
   * - Central aperture void (empty space)
   * - Plates slightly offset and tilted
   * - No solid core
   * - Animation: Very slow rotation + subtle axial wobble
   * 
   * VISUAL MEANING: "This node does not act — it sees."
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createAnalyticsObserverLens(group, color) {
    try {
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.18,
        metalness: 0.6,
        roughness: 0.3,
        transparent: true,
        opacity: 0.5
      });

      // Base
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.9, 0.12, 12, 1), mat);
      base.position.y = -0.32;
      validateMeshGeometry(base, 'createAnalyticsObserverLens:base');
      group.add(base);

      // Spine
      const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 10, 1), mat);
      spine.position.y = 0.1;
      spine.userData.isAnalyticsSpine = true;
      validateMeshGeometry(spine, 'createAnalyticsObserverLens:spine');
      group.add(spine);

      // Layered plates (3)
      const plateCount = 3;
      for (let i = 0; i < plateCount; i++) {
        const outerRadius = 0.68 - i * 0.1;
        const plateGeometry = new THREE.CylinderGeometry(outerRadius, outerRadius, 0.06, 28, 2, true);
        const plate = new THREE.Mesh(plateGeometry, mat);
        plate.position.y = -0.12 + i * 0.24;
        plate.rotation.x = (i - 1) * 0.12;
        plate.rotation.z = (i - 1) * 0.08;
        plate.userData.isLensPlate = true;
        plate.userData.visualCoreImmutable = true;
        validateMeshGeometry(plate, `createAnalyticsObserverLens:plate${i}`);
        group.add(plate);
      }

      // Central void aperture
      const aperture = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.4, 16),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 })
      );
      aperture.userData.isAperture = true;
      aperture.userData.visualCoreImmutable = true;
      group.add(aperture);

      // Orbit ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.04, 10, 32), mat);
      ring.position.y = 0.15;
      ring.rotation.x = Math.PI * 0.5;
      validateMeshGeometry(ring, 'createAnalyticsObserverLens:ring');
      group.add(ring);

      // Animation metadata
      group.userData.lensRotationSpeed = 0.05;
      group.userData.lensWobbleAmplitude = 0.04;
      group.userData.lensWobbleSpeed = 0.3;
      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'ANALYTICS_OBSERVER_LENS_V3';

      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createAnalyticsObserverLens',
        category: 'analytics',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      console.error('[AnalyticsFactoryNull]', { visualCode: '3', error: err.message });
      return null;
    }
  }

  /**
   * ANALYTICS: FRACTAL_ECHO (NEW - Session 63)
   * Recursive analysis feeding back into itself
   * - Central asymmetric seed geometry (ikosahedron)
   * - 4 scaled-down echoes arranged radially
   * - Each echo rotated differently
   * - All geometry static (no recursion at runtime)
   * - Animation: Slow counter-rotation between seed and echoes
   * 
   * VISUAL MEANING: "Patterns inside patterns."
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createAnalyticsFractalEcho(group, color) {
    try {
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.22,
        metalness: 0.6,
        roughness: 0.25,
        transparent: true,
        opacity: 0.9
      });

      // Base
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.9, 0.12, 10, 1), mat);
      base.position.y = -0.3;
      validateMeshGeometry(base, 'createAnalyticsFractalEcho:base');
      group.add(base);

      // Spine
      const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8, 1), mat);
      spine.position.y = 0.2;
      spine.userData.isAnalyticsSpine = true;
      validateMeshGeometry(spine, 'createAnalyticsFractalEcho:spine');
      group.add(spine);

      // Seed core
      const seedGeo = new THREE.IcosahedronGeometry(0.32, 1);
      const seed = new THREE.Mesh(seedGeo, mat);
      seed.position.y = 0.7;
      seed.rotation.set(Math.PI * 0.12, Math.PI * 0.16, Math.PI * 0.08);
      seed.userData.isSeedCore = true;
      seed.userData.visualCoreImmutable = true;
      validateMeshGeometry(seed, 'createAnalyticsFractalEcho:seed');
      group.add(seed);

      // Orbit ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.04, 10, 28, Math.PI * 2), mat);
      ring.position.y = 0.7;
      ring.rotation.x = Math.PI * 0.5;
      validateMeshGeometry(ring, 'createAnalyticsFractalEcho:ring');
      group.add(ring);

      // Echo fragments (4)
      const echoMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.18,
        transparent: true,
        opacity: 0.7,
        metalness: 0.45,
        roughness: 0.3
      });
      const echoGeo = new THREE.TetrahedronGeometry(0.18, 0);
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const echo = new THREE.Mesh(echoGeo, echoMat);
        echo.position.set(Math.cos(angle) * 0.65, 0.35 + (i % 2) * 0.08, Math.sin(angle) * 0.65);
        echo.rotation.set(
          Math.PI * 0.18 + i * 0.4,
          Math.PI * 0.22 + i * 0.3,
          Math.PI * 0.12 * i
        );
        echo.userData.isEcho = true;
        echo.userData.visualCoreImmutable = true;
        validateMeshGeometry(echo, `createAnalyticsFractalEcho:echo${i}`);
        group.add(echo);
      }

      // Animation metadata
      group.userData.fractalSeedRotationSpeed = 0.12;
      group.userData.fractalEchoRotationSpeed = -0.09;
      group.userData.fractalBreathingAmplitude = 0.015;
      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'ANALYTICS_FRACTAL_ECHO_V3';

      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createAnalyticsFractalEcho',
        category: 'analytics',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      console.error('[AnalyticsFactoryNull]', { visualCode: '4', error: err.message });
      return null;
    }
  }

  /**
   * ANALYTICS: PARALLAX_ORACLE (NEW - Session 63)
   * Multi-dimensional observer interpreting from multiple angles
   * - Central floating polyhedral observer (stable core)
   * - 4 translucent observation planes intersecting space
   * - Planes must NOT intersect the core mesh
   * - Planes act like perception layers
   * - Animation: Planes rotate independently, core remains stable
   * 
   * VISUAL MEANING: "Truth depends on perspective."
   * VISUAL SAFETY: Static geometry, transform-only animation (orbit), immutable
   */
  static createAnalyticsParallaxOracle(group, color) {
    try {
      // Create central observer core (stable dodecahedron, Oracle Scanner v2 scale)
      const observerGeometry = new THREE.DodecahedronGeometry(0.32, 0);
      const observerMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.85,
        roughness: 0.1,
        transmission: 0, // Phase B.3.A: transmission disabled to prevent RenderTransmissionPass
        thickness: 0.35,
        ior: 1.5,
        emissive: color,
        emissiveIntensity: 0.3
      });

      const observer = new THREE.Mesh(observerGeometry, observerMaterial);
      observer.userData.isObserverCore = true;
      observer.userData.visualCoreImmutable = true;
      group.add(observer);

      // Secondary wireframe shell for analytic resonance readout
      const shellGeometry = new THREE.IcosahedronGeometry(0.42, 0);
      const shellMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.25,
        wireframe: true
      });
      const shell = new THREE.Mesh(shellGeometry, shellMaterial);
      shell.userData.isObserverShell = true;
      shell.userData.visualCoreImmutable = true;
      group.add(shell);

      // Thin analytic orbit ring
      const ringGeometry = new THREE.TorusGeometry(0.58, 0.012, 8, 48);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.32
      });
      const analyticRing = new THREE.Mesh(ringGeometry, ringMaterial);
      analyticRing.rotation.set(Math.PI * 0.5, 0, Math.PI * 0.22);
      analyticRing.userData.isAnalyticRing = true;
      analyticRing.userData.visualCoreImmutable = true;
      group.add(analyticRing);

      // Thin vertical scan beam above the observer core
      const beamGeometry = new THREE.CylinderGeometry(0.01, 0.016, 0.9, 8, 1, true);
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide
      });
      const scanBeam = new THREE.Mesh(beamGeometry, beamMaterial);
      scanBeam.position.y = 0.78;
      scanBeam.userData.isScanBeam = true;
      scanBeam.userData.visualCoreImmutable = true;
      group.add(scanBeam);

      // Create 4 analytic scan panels (perception layers)
      const planeCount = 4;
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        wireframe: true
      });

      for (let i = 0; i < planeCount; i++) {
        // Create panel geometry (different dimensions for parallax effect)
        const planeWidth = 0.7 - i * 0.08;
        const planeHeight = 0.5 + i * 0.1;
        const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 10, 8);
        
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        
        // Position planes in different orientations (NO intersection with core)
        const angle = (i / planeCount) * Math.PI * 2;
        
        // Position away from center to avoid intersection
        plane.position.x = Math.cos(angle) * 0.45;
        plane.position.z = Math.sin(angle) * 0.45;
        
        // Tilt each plane differently for multi-dimensional perception
        plane.rotation.y = angle;
        plane.rotation.x = Math.PI / 6 + i * 0.15;
        plane.rotation.z = Math.PI / 8 - i * 0.1;
        
        plane.userData.isObservationPlane = true;
        plane.userData.planeIndex = i;
        plane.userData.baseAngle = angle;
        plane.userData.planeRotationAxis = new THREE.Vector3(
          Math.cos(angle * 0.7),
          0.5,
          Math.sin(angle * 0.7)
        ).normalize();
        plane.userData.planeRotationSpeed = 0.08 + i * 0.02;
        plane.userData.visualCoreImmutable = true;
        group.add(plane);
      }

      // Orbiting probes (small analytic samplers)
      const probeGeometry = new THREE.TetrahedronGeometry(0.065, 0);
      const probeMaterial = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.18,
        metalness: 0.65,
        roughness: 0.2
      });
      for (let i = 0; i < 4; i++) {
        const probe = new THREE.Mesh(probeGeometry, probeMaterial);
        const probeAngle = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
        probe.position.set(Math.cos(probeAngle) * 0.68, 0.12 + (i % 2) * 0.1, Math.sin(probeAngle) * 0.68);
        probe.rotation.set(0.2 + i * 0.22, probeAngle, -0.1 + i * 0.17);
        probe.userData.isOrbitingProbe = true;
        probe.userData.probeIndex = i;
        probe.userData.baseAngle = probeAngle;
        probe.userData.orbitRadius = 0.68;
        probe.userData.orbitSpeed = 0.07 + i * 0.01;
        probe.userData.visualCoreImmutable = true;
        group.add(probe);
      }

      // Store animation metadata (independent plane rotation)
      group.userData.observerPlaneCount = planeCount;
      group.userData.observerCoreStability = true; // Core does NOT rotate

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'ANALYTICS_PARALLAX_ORACLE';

      // --- Analytics Factory Trace ---
      let meshCount = 0;
      group.traverse(o => { if (o.isMesh) meshCount++; });
      if (meshCount === 0) {
        console.error('[AnalyticsFactoryEmpty]', {
          factory: 'createAnalyticsParallaxOracle',
          visualCode: '5',
          group
        });
      }

      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createAnalyticsParallaxOracle',
        category: 'analytics',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      console.error('[AnalyticsFactoryNull]', { visualCode: '5', error: err.message });
      return null;
    }
  }

  // ===== STORAGE NODES (Silver/Pale Blue - 4 variants) =====

  /**
   * Storage Node 0: Tall rectangular pillar with layered slices (fixed + upgraded)
   * UPGRADED: Enforced segment spacing, per-segment micro-rotation, optional vertical core light
   * VISUAL HIERARCHY: Core light opacity reduced to 0.08 (was 0.15, subtle background)
   */
static createStorageNode0(group, color) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.2,
      metalness: 0.7,
      roughness: 0.25
    });

    // Base pedestal
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.22, 10, 1), mat);
    base.position.y = -0.5;
    validateMeshGeometry(base, 'createStorageNode0:base');
    group.add(base);

    // Spine
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 1.6, 10, 1), mat);
    spine.position.y = 0.3;
    validateMeshGeometry(spine, 'createStorageNode0:spine');
    group.add(spine);

    // Core prism
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), mat);
    core.position.y = 0.95;
    core.rotation.y = Math.PI * 0.18;
    core.userData.isCore = true;
    validateMeshGeometry(core, 'createStorageNode0:core');
    group.add(core);

    // Frame ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.06, 10, 32), mat);
    ring.position.y = 0.95;
    ring.rotation.x = Math.PI * 0.5;
    ring.rotation.y = Math.PI * 0.12;
    validateMeshGeometry(ring, 'createStorageNode0:ring');
    group.add(ring);

    // Crown cap
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.28, 10, 1), mat);
    cap.position.y = 1.45;
    validateMeshGeometry(cap, 'createStorageNode0:cap');
    group.add(cap);

    group.userData.visualTier = 'STORAGE_V3';
    return group;
  }
  /**
   * Storage Node 1: Capsule with inner bands
   */
  static createStorageNode1(group, color) {
    const nodeKey = group?.userData?.nodeId || group?.userData?.visualCode?.toString() || String(color || 0x00ffff);
    const seedValue = hashString(nodeKey);
    const seed = Math.abs(seedValue) || 1;
    const rng = _mythicSeededRng(seed);

    const shellMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.2,
      metalness: 0.78,
      roughness: 0.18
    });

    const frameMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.34
    });

    const edgeMat = new THREE.LineBasicMaterial({
      color: 0xc8f6ff,
      transparent: true,
      opacity: 0.55
    });

    const shardMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.28,
      metalness: 0.58,
      roughness: 0.24,
      transparent: true,
      opacity: 0.92
    });

    const root = new THREE.Group();
    root.name = 'STORAGE_CAPSULE_RELIQUARY';

    // Lower dock ring
    const dock = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 12, 36), frameMat);
    dock.position.y = -0.42;
    dock.rotation.x = Math.PI * 0.5;
    validateMeshGeometry(dock, 'createStorageNode1:dock');
    root.add(dock);

    // Main vault body: offset capsule shell built from cylindrical segments
    const bodyGeo = new THREE.CylinderGeometry(0.38, 0.46, 1.7, 10, 3);
    const body = new THREE.Mesh(bodyGeo, shellMat);
    body.position.set(0.02, 0.28, -0.03);
    body.rotation.set(0.08, Math.PI * 0.13, -0.03);
    body.userData.isCore = true;
    validateMeshGeometry(body, 'createStorageNode1:body');
    root.add(body);

    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.4, 0.28, 10, 1), shellMat);
    capTop.position.set(0.08, 1.16, -0.04);
    capTop.rotation.y = Math.PI * 0.12;
    validateMeshGeometry(capTop, 'createStorageNode1:capTop');
    root.add(capTop);

    const capBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.28, 0.24, 10, 1), shellMat);
    capBottom.position.set(-0.05, -0.64, 0.03);
    capBottom.rotation.y = -Math.PI * 0.09;
    validateMeshGeometry(capBottom, 'createStorageNode1:capBottom');
    root.add(capBottom);

    // Inner memory spine
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.45, 0.18), shellMat);
    spine.position.set(-0.12, 0.26, 0.1);
    spine.rotation.set(0.04, Math.PI * 0.18, 0.06);
    validateMeshGeometry(spine, 'createStorageNode1:spine');
    root.add(spine);

    // Irregular retention braces
    const braceGeo = new THREE.BoxGeometry(0.12, 0.62, 0.1);
    const braceConfigs = [
      { pos: [0.46, 0.48, 0.18], rot: [0.18, 0.22, 0.3] },
      { pos: [-0.42, 0.18, -0.24], rot: [-0.14, -0.18, -0.24] },
      { pos: [0.36, -0.12, -0.28], rot: [0.1, 0.42, -0.3] },
      { pos: [-0.34, 0.84, 0.12], rot: [-0.18, 0.12, 0.22] }
    ];
    braceConfigs.forEach((cfg, i) => {
      const brace = new THREE.Mesh(braceGeo, shellMat);
      brace.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      brace.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
      validateMeshGeometry(brace, `createStorageNode1:brace${i}`);
      root.add(brace);
    });

    // Broken capacity bands
    const bandConfigs = [
      { radius: 0.72, tube: 0.04, arc: Math.PI * 1.45, pos: [0.0, 0.66, 0.0], rot: [Math.PI * 0.5, 0.24, 0.08] },
      { radius: 0.82, tube: 0.035, arc: Math.PI * 1.18, pos: [0.04, 0.22, 0.02], rot: [Math.PI * 0.22, Math.PI * 0.18, Math.PI * 0.36] },
      { radius: 0.7, tube: 0.03, arc: Math.PI * 1.28, pos: [-0.05, -0.24, 0.06], rot: [Math.PI * 0.5, -0.16, -0.1] }
    ];
    bandConfigs.forEach((cfg, i) => {
      const band = new THREE.Mesh(new THREE.TorusGeometry(cfg.radius, cfg.tube, 10, 44, cfg.arc), frameMat);
      band.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      band.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
      validateMeshGeometry(band, `createStorageNode1:band${i}`);
      root.add(band);
    });

    // Floating memory slabs around the capsule
    const slabGeo = new THREE.BoxGeometry(0.18, 0.05, 0.38);
    for (let i = 0; i < 9; i++) {
      const slab = new THREE.Mesh(slabGeo, shardMat);
      const angle = (i / 9) * Math.PI * 2;
      const radius = 0.82 + rng() * 0.18;
      slab.position.set(
        Math.cos(angle) * radius,
        -0.28 + i * 0.12,
        Math.sin(angle * 1.12) * (0.54 + rng() * 0.22)
      );
      slab.rotation.set(
        rng() * Math.PI * 0.35,
        angle + rng() * 0.5,
        -0.2 + rng() * 0.4
      );
      slab.scale.set(0.85 + rng() * 0.45, 1, 0.85 + rng() * 0.5);
      validateMeshGeometry(slab, `createStorageNode1:slab${i}`);
      root.add(slab);
    }

    // Suspended data shards
    const shardGeo = new THREE.TetrahedronGeometry(0.12, 0);
    for (let i = 0; i < 5; i++) {
      const shard = new THREE.Mesh(shardGeo, shardMat);
      shard.position.set(
        -0.18 + rng() * 0.5,
        0.18 + i * 0.22,
        -0.22 + rng() * 0.44
      );
      shard.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      shard.scale.set(0.9 + rng() * 0.5, 1.2 + rng() * 0.4, 0.8 + rng() * 0.3);
      validateMeshGeometry(shard, `createStorageNode1:shard${i}`);
      root.add(shard);
    }

    root.userData.visualVariant = 'STORAGE_CAPSULE_RELIQUARY_V2';
    root.userData.nodeGeometryName = 'STORAGE_CAPSULE_RELIQUARY';
    group.add(root);
    return group;
  }

  /**
   * Storage Node 3: Cluster of crystal shards
   */
  static createStorageNode3(group, visualCode, color) {
    try {
      const resolvedColor = typeof color === 'undefined' ? visualCode : color;
      const geometries = _getStorageCathedralGeometries();
      const materials = _getStorageCathedralMaterials(resolvedColor);
      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const storageRoot = new THREE.Group();
      storageRoot.name = 'STORAGE_CATHEDRAL_CACHE_NODE';
      storageRoot.userData.visualVariant = 'STORAGE_CATHEDRAL_CACHE_V4';
      storageRoot.userData.nodeGeometryName = 'STORAGE_CATHEDRAL_CACHE';

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const coreMesh = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      coreMesh.name = 'MnemonicVaultCore';
      coreMesh.userData.ignoreWaveColor = true;
      coreMesh.position.set(0.0, 0.08, 0.0);
      coreMesh.rotation.set(0.16, 0.34, -0.08);
      coreMesh.renderOrder = coreOrder;
      coreGroup.add(coreMesh);

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'MnemonicVaultCoreEdges';
      coreEdges.position.copy(coreMesh.position);
      coreEdges.rotation.copy(coreMesh.rotation);
      coreEdges.renderOrder = archOrder;
      coreGroup.add(coreEdges);

      const seam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      seam.name = 'VaultInnerVoidSeam';
      seam.userData.ignoreWaveColor = true;
      seam.position.set(0.02, 0.06, 0.01);
      seam.rotation.set(0.24, 0.28, -0.04);
      seam.scale.set(1.0, 0.96, 1.0);
      seam.renderOrder = coreOrder;
      coreGroup.add(seam);

      storageRoot.add(coreGroup);

      const strataGroup = new THREE.Group();
      strataGroup.name = 'STRATA_GROUP';
      const slabSpecs = [
        { pos: [0.06, -0.56, -0.04], rot: [0.0, 0.18, -0.05], scale: [0.9, 1.0, 0.82] },
        { pos: [-0.08, -0.32, 0.07], rot: [0.0, -0.24, 0.04], scale: [1.02, 1.0, 0.9] },
        { pos: [0.05, -0.08, 0.03], rot: [0.0, 0.32, -0.03], scale: [1.14, 1.0, 0.98] },
        { pos: [-0.04, 0.16, -0.05], rot: [0.0, -0.14, 0.05], scale: [1.08, 1.0, 0.94] },
        { pos: [0.09, 0.42, 0.06], rot: [0.0, 0.28, -0.04], scale: [0.98, 1.0, 0.88] },
        { pos: [-0.02, 0.68, -0.07], rot: [0.0, -0.34, 0.03], scale: [0.84, 1.0, 0.76] }
      ];
      slabSpecs.forEach((spec, idx) => {
        const slab = new THREE.Mesh(geometries.slabGeometry, materials.slabMat);
        slab.name = `ArchiveStratum_${idx}`;
        slab.userData.ignoreWaveColor = true;
        slab.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
        slab.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);
        slab.scale.set(spec.scale[0], spec.scale[1], spec.scale[2]);
        slab.renderOrder = coreOrder;
        strataGroup.add(slab);
      });
      storageRoot.add(strataGroup);

      const buttressGroup = new THREE.Group();
      buttressGroup.name = 'BUTTRESS_GROUP';
      const buttressSpecs = [
        { pos: [0.64, 0.08, -0.16], rot: [0.08, 0.94, -0.18], scale: [0.96, 1.08, 0.72] },
        { pos: [-0.54, -0.02, 0.28], rot: [-0.18, -0.46, 0.12], scale: [0.82, 1.04, 0.68] },
        { pos: [0.12, 0.14, 0.62], rot: [0.22, 2.12, 0.24], scale: [0.88, 0.92, 0.58] }
      ];
      buttressSpecs.forEach((spec, idx) => {
        const buttress = new THREE.Mesh(geometries.buttressGeometry, materials.buttressMat);
        buttress.name = `ContainmentButtress_${idx}`;
        buttress.userData.ignoreWaveColor = true;
        buttress.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
        buttress.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);
        buttress.scale.set(spec.scale[0], spec.scale[1], spec.scale[2]);
        buttress.renderOrder = coreOrder;
        buttressGroup.add(buttress);

        const buttressEdges = new THREE.LineSegments(geometries.buttressEdgesGeometry, materials.edgeMat);
        buttressEdges.name = `ContainmentButtressEdges_${idx}`;
        buttressEdges.userData.ignoreWaveColor = true;
        buttressEdges.position.copy(buttress.position);
        buttressEdges.rotation.copy(buttress.rotation);
        buttressEdges.scale.copy(buttress.scale);
        buttressEdges.renderOrder = archOrder;
        buttressGroup.add(buttressEdges);
      });
      storageRoot.add(buttressGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const archiveDust = new THREE.Points(geometries.dustGeometry, materials.dustMat);
      archiveDust.name = 'ArchiveDust';
      archiveDust.userData.ignoreWaveColor = true;
      archiveDust.position.set(0.0, 0.08, 0.0);
      archiveDust.rotation.set(0.12, 0.44, -0.08);
      archiveDust.frustumCulled = false;
      archiveDust.renderOrder = archOrder;
      auraGroup.add(archiveDust);

      const timelineParticles = new THREE.Points(geometries.timelineGeometry, materials.timelineMat);
      timelineParticles.name = 'TimelineParticles';
      timelineParticles.userData.ignoreWaveColor = true;
      timelineParticles.position.set(0.0, 0.06, 0.0);
      timelineParticles.rotation.set(0.06, 0.18, 0.0);
      timelineParticles.frustumCulled = false;
      timelineParticles.renderOrder = archOrder;
      auraGroup.add(timelineParticles);

      const shellColor = 0xeefbff;
      const shell1 = createNodeHologramShell(coreMesh, shellColor);
      if (shell1) {
        shell1.name = 'StorageShell_1';
        shell1.position.copy(coreMesh.position);
        shell1.quaternion.copy(coreMesh.quaternion);
        shell1.scale.copy(coreMesh.scale).multiplyScalar(1.14);
        shell1.frustumCulled = false;
        shell1.renderOrder = archOrder;
        if (shell1.material?.uniforms?.uOpacity) shell1.material.uniforms.uOpacity.value = 0.052;
        auraGroup.add(shell1);
      }

      const shell2 = createNodeHologramShell(coreMesh, shellColor);
      if (shell2) {
        shell2.name = 'StorageShell_2';
        shell2.position.copy(coreMesh.position);
        shell2.quaternion.copy(coreMesh.quaternion);
        shell2.scale.copy(coreMesh.scale).multiplyScalar(1.24);
        shell2.frustumCulled = false;
        shell2.renderOrder = archOrder;
        if (shell2.material?.uniforms?.uOpacity) shell2.material.uniforms.uOpacity.value = 0.036;
        auraGroup.add(shell2);
      }

      const edgeGlow = createNodeNeonEdgeGlowShell(coreMesh, 0xc2efff, {
        glowIntensity: 0.86,
        edgeWidth: 0.074,
        pulseAmount: 0.0
      });
      if (edgeGlow) {
        edgeGlow.name = 'StorageEdgeGlow';
        edgeGlow.position.copy(coreMesh.position);
        edgeGlow.quaternion.copy(coreMesh.quaternion);
        edgeGlow.scale.copy(coreMesh.scale).multiplyScalar(1.02);
        edgeGlow.frustumCulled = false;
        edgeGlow.renderOrder = archOrder;
        auraGroup.add(edgeGlow);
      }

      storageRoot.add(auraGroup);

      storageRoot.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'storage-cathedral-cache');
        }
      });

      storageRoot.userData.visualReady = true;
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'STORAGE_CATHEDRAL_CACHE';
      group.add(storageRoot);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createStorageNode3',
        category: 'storage',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err,
        visualCode
      });
      return null;
    }
  }

  /**
   * Main storage node creator
   * CANONICAL CATEGORY: STORAGE
   * - MemoryPillar
   * - CapsuleBands
   * - SegmentedStack
   * - CrystalShardCluster
   * - RhombicSolid
   * - MnemonicVault (Session 63)
   * - ArchiveSpindle (Session 63)
   * - MemoryReef (Session 63)
   * - ArchiveNexus (NEW - Session 81)
   * - MemoryCrypts (NEW - Session 81)
  * - DepthLayers (NEW - Session 81)
  * - ObeliskCache (NEW - Session 116)
  * - FractalReservoir (NEW - Session 116)
  * - ArchiveDrum (NEW - Session 116)
  */
  static createStorageNodeStyled_v2(group, index, color) {
    try {
      const geometries = _getStorageV2Geometries();
      const materials = _getStorageV2Materials(color);
      const storageRoot = new THREE.Group();
      storageRoot.name = 'STORAGE_NODE';
      storageRoot.userData.visualVariant = 'STORAGE_V2';

      // CORE
      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';
      const column = new THREE.Mesh(geometries.columnGeometry, materials.columnMat);
      column.name = 'MemoryCoreColumn';
      coreGroup.add(column);

      const spine = new THREE.LineSegments(geometries.spineGeometry, materials.spineMat);
      spine.name = 'DataSpine';
      coreGroup.add(spine);

      storageRoot.add(coreGroup);

      // LAYERS
      const layerGroup = new THREE.Group();
      layerGroup.name = 'LAYER_GROUP';

      const ringsGroup = new THREE.Group();
      ringsGroup.name = 'MemoryRings';
      const ringCount = 6;
      for (let i = 0; i < ringCount; i++) {
        const ring = new THREE.Mesh(geometries.ringGeometry, materials.ringMat);
        ring.name = `MemoryRing_${i}`;
        const y = -1.1 + (i / (ringCount - 1)) * 2.2;
        ring.position.y = y;
        const scale = 0.95 + (i * 0.05);
        ring.scale.set(scale, 1.0, scale);
        ring.rotation.y = 0.18 * i;
        ringsGroup.add(ring);
      }
      layerGroup.add(ringsGroup);

      const bandsGroup = new THREE.Group();
      bandsGroup.name = 'CompressionBands';
      const bandLevels = [-1.0, -0.4, 0.2, 0.9];
      bandLevels.forEach((y, idx) => {
        const band = new THREE.Mesh(geometries.bandGeometry, materials.bandMat);
        band.name = `CompressionBand_${idx}`;
        band.position.y = y;
        band.scale.x = band.scale.z = 1.0 + idx * 0.05;
        bandsGroup.add(band);
      });
      layerGroup.add(bandsGroup);

      const sliceCount = 60;
      const slices = new THREE.InstancedMesh(geometries.sliceGeometry, materials.sliceMat, sliceCount);
      slices.name = 'DataSlices';
      slices.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const rng = _mythicSeededRng(group?.userData?.nodeId ? hashString(group.userData.nodeId) : index || 1);
      const sliceObj = new THREE.Object3D();
      for (let i = 0; i < sliceCount; i++) {
        const y = -1.2 + rng() * 2.4;
        const radius = 0.55 + rng() * 0.25;
        const angle = rng() * Math.PI * 2;
        sliceObj.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        sliceObj.rotation.y = angle + Math.PI / 2;
        sliceObj.rotation.x = (rng() - 0.5) * 0.2;
        const scale = 0.8 + rng() * 0.4;
        sliceObj.scale.set(scale, scale, scale);
        sliceObj.updateMatrix();
        slices.setMatrixAt(i, sliceObj.matrix);
      }
      slices.instanceMatrix.needsUpdate = true;
      layerGroup.add(slices);

      storageRoot.add(layerGroup);

      // ARCHIVE
      const archiveGroup = new THREE.Group();
      archiveGroup.name = 'ARCHIVE_GROUP';

      const halo = new THREE.Points(geometries.haloGeometry, materials.timelineMat);
      halo.name = 'ArchiveHalo';
      halo.frustumCulled = false;
      archiveGroup.add(halo);

      const timeline = new THREE.Points(geometries.timelineGeometry, materials.timelineMat);
      timeline.name = 'TimelineParticles';
      timeline.frustumCulled = false;
      archiveGroup.add(timeline);

      storageRoot.add(archiveGroup);

      storageRoot.userData.visualReady = true;
      group.add(storageRoot);
      return group;
    } catch (err) {
      console.error('[StorageV2Abort]', err);
      throw err;
    }
  }

  // Legacy STORAGE visuals retained as fallback
  static _createStorageNodeLegacy(group, index, color) {
    const pool = CATEGORY_POOLS.storage || [];
    const poolFns = {
      501: this.createStorageNode0.bind(this),
      502: this.createStorageNode1.bind(this),
      503: this.createStorageNode3.bind(this),
      504: this.createStorageMnemonicVault.bind(this),
      505: this.createStorageArchiveSpindle.bind(this),
      506: this.createStorageMemoryReef.bind(this),
      507: StorageEnhancedVariants.createStorageEnhanced_ArchiveNexus.bind(StorageEnhancedVariants),
      508: StorageEnhancedVariants.createStorageEnhanced_MemoryCrypts.bind(StorageEnhancedVariants),
      509: StorageEnhancedVariants.createStorageEnhanced_DepthLayers.bind(StorageEnhancedVariants),
      510: StorageNodesVisual.createObeliskCache.bind(StorageNodesVisual),
      511: StorageNodesVisual.createFractalReservoir.bind(StorageNodesVisual),
      512: StorageNodesVisual.createArchiveDrum.bind(StorageNodesVisual)
    };
    const counter = Number.isFinite(index) ? index : 0;
    const selected = pool[counter % pool.length];
    return (poolFns[selected] || poolFns[pool[0]])(group, color);
  }

  /**
   * STORAGE: MNEMONIC_VAULT (NEW - Session 63)
   * Archive tension system holding memory under visible structural stress
   * - Faceted core suspended inside a single open tension arc
   * - Asymmetrical fragment cluster suggesting retained data shards
   * - Tight micro-orbit close to the core for archival activity
   * - No full shell, no cage, no spherical enclosure
   * 
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createStorageMnemonicVault(group, color) {
    try {
      group.userData = group.userData || {};
      const colorHex = new THREE.Color(color).getHex();
      const nodeKey = group?.userData?.nodeId || group?.userData?.visualCode?.toString() || String(colorHex);
      const seed = Math.abs(hashString(nodeKey)) || 1;
      const rng = _mythicSeededRng(seed);

      if (!this.__storageMnemonicVaultCache) {
        const coreGeometry = new THREE.DodecahedronGeometry(0.58, 0);
        coreGeometry.scale(1.0, 0.7, 0.9);

        const arcCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.92, -0.18, 0.16),
          new THREE.Vector3(-0.52, 0.34, -0.26),
          new THREE.Vector3(0.02, 0.62, -0.34),
          new THREE.Vector3(0.56, 0.16, 0.24),
          new THREE.Vector3(0.9, -0.26, 0.42)
        ], false, 'catmullrom', 0.42);

        const microOrbitGeometry = new THREE.BufferGeometry();
        const microOrbitCount = 16;
        const microOrbitPositions = new Float32Array(microOrbitCount * 3);
        for (let i = 0; i < microOrbitCount; i++) {
          const angle = (i / microOrbitCount) * Math.PI * 2;
          const radius = 0.3 + Math.sin(i * 1.73) * 0.028;
          microOrbitPositions[i * 3 + 0] = Math.cos(angle) * radius;
          microOrbitPositions[i * 3 + 1] = Math.cos(i * 2.11) * 0.035;
          microOrbitPositions[i * 3 + 2] = Math.sin(angle) * (0.24 + Math.sin(i * 1.37) * 0.02);
        }
        microOrbitGeometry.setAttribute('position', new THREE.BufferAttribute(microOrbitPositions, 3));

        this.__storageMnemonicVaultCache = {
          geometries: {
            coreGeometry,
            mainArcGeometry: new THREE.TubeGeometry(arcCurve, 40, 0.055, 8, false),
            fragmentGeometries: [
              new THREE.OctahedronGeometry(0.13, 1),
              new THREE.TetrahedronGeometry(0.16, 1),
              new THREE.DodecahedronGeometry(0.11, 0)
            ],
            microOrbitGeometry
          },
          materials: new Map()
        };
      }

      const cache = this.__storageMnemonicVaultCache;
      let mats = cache.materials.get(colorHex);
      if (!mats) {
        mats = {
          coreMat: new THREE.MeshStandardMaterial({
            color: colorHex,
            metalness: 0.82,
            roughness: 0.18,
            emissive: colorHex,
            emissiveIntensity: 0.92,
            transparent: true,
            opacity: 0.96
          }),
          arcMat: new THREE.MeshStandardMaterial({
            color: colorHex,
            metalness: 0.34,
            roughness: 0.28,
            emissive: colorHex,
            emissiveIntensity: 0.46,
            transparent: true,
            opacity: 0.72,
            depthWrite: false,
            side: THREE.DoubleSide
          }),
          fragmentMat: new THREE.MeshStandardMaterial({
            color: colorHex,
            metalness: 0.58,
            roughness: 0.24,
            emissive: colorHex,
            emissiveIntensity: 0.36,
            transparent: true,
            opacity: 0.84
          }),
          microOrbitMat: new THREE.PointsMaterial({
            color: colorHex,
            size: 0.028,
            transparent: true,
            opacity: 0.42,
            depthWrite: false,
            sizeAttenuation: true
          })
        };
        cache.materials.set(colorHex, mats);
      }

      const core = new THREE.Mesh(cache.geometries.coreGeometry, mats.coreMat);
      core.name = 'MnemonicVaultCore';
      core.rotation.set(0.18 + rng() * 0.1, 0.22 + rng() * 0.35, -0.06 + rng() * 0.12);
      core.userData.isInnerCore = true;
      core.userData.isMnemonicCore = true;
      core.userData.visualCoreImmutable = true;
      core.userData.baseRotation = core.rotation.clone();
      validateMeshGeometry(core, 'createStorageMnemonicVault:core');
      group.add(core);

      const mainArc = new THREE.Mesh(cache.geometries.mainArcGeometry, mats.arcMat);
      mainArc.name = 'MnemonicVaultMainArc';
      mainArc.position.set(0.08, 0.03, -0.06);
      mainArc.rotation.set(Math.PI * 0.2, Math.PI * 0.31, -Math.PI * 0.16);
      mainArc.scale.set(1.0, 0.96, 1.08);
      mainArc.userData.isOuterShell = true;
      mainArc.userData.isMainArc = true;
      mainArc.userData.visualCoreImmutable = true;
      mainArc.userData.baseRotation = mainArc.rotation.clone();
      validateMeshGeometry(mainArc, 'createStorageMnemonicVault:mainArc');
      group.add(mainArc);

      const fragmentGroup = new THREE.Group();
      fragmentGroup.name = 'MnemonicVaultFragments';
      fragmentGroup.userData.visualCoreImmutable = true;
      const fragmentCount = 5 + Math.floor(rng() * 3);
      for (let i = 0; i < fragmentCount; i++) {
        const fragmentGeometry = cache.geometries.fragmentGeometries[(i + Math.floor(rng() * cache.geometries.fragmentGeometries.length)) % cache.geometries.fragmentGeometries.length];
        const fragment = new THREE.Mesh(fragmentGeometry, mats.fragmentMat);
        const angle = (i / fragmentCount) * Math.PI * 2 + (rng() - 0.5) * 0.7;
        const radiusX = 0.56 + rng() * 0.28;
        const radiusZ = 0.42 + rng() * 0.24;
        const basePosition = new THREE.Vector3(
          Math.cos(angle) * radiusX,
          -0.16 + rng() * 0.46,
          Math.sin(angle) * radiusZ
        );
        fragment.position.copy(basePosition);
        fragment.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
        fragment.scale.set(0.72 + rng() * 0.45, 0.58 + rng() * 0.48, 0.7 + rng() * 0.42);
        fragment.userData.isStorageFragment = true;
        fragment.userData.visualCoreImmutable = true;
        fragment.userData.basePosition = basePosition.clone();
        fragment.userData.baseRotation = fragment.rotation.clone();
        fragment.userData.driftPhase = rng() * Math.PI * 2;
        fragment.userData.driftSpeed = 0.32 + rng() * 0.18;
        fragment.userData.driftAmplitude = 0.012 + rng() * 0.016;
        validateMeshGeometry(fragment, `createStorageMnemonicVault:fragment${i}`);
        fragmentGroup.add(fragment);
      }
      group.add(fragmentGroup);

      const microOrbit = new THREE.Points(cache.geometries.microOrbitGeometry, mats.microOrbitMat);
      microOrbit.name = 'MnemonicVaultMicroOrbit';
      microOrbit.position.set(0.02, 0.02, -0.01);
      microOrbit.rotation.set(Math.PI * 0.2, -Math.PI * 0.12, Math.PI * 0.08);
      microOrbit.frustumCulled = false;
      microOrbit.userData.isMicroOrbit = true;
      microOrbit.userData.visualCoreImmutable = true;
      microOrbit.userData.baseRotation = microOrbit.rotation.clone();
      group.add(microOrbit);

      group.onBeforeRender = () => {
        const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;

        core.rotation.x = core.userData.baseRotation.x + Math.sin(t * 0.19) * 0.04;
        core.rotation.y = core.userData.baseRotation.y + t * 0.075;
        core.rotation.z = core.userData.baseRotation.z + Math.cos(t * 0.15) * 0.025;

        mainArc.rotation.x = mainArc.userData.baseRotation.x + Math.sin(t * 0.12) * 0.02;
        mainArc.rotation.y = mainArc.userData.baseRotation.y - t * 0.055;
        mainArc.rotation.z = mainArc.userData.baseRotation.z + Math.cos(t * 0.17) * 0.03;

        fragmentGroup.children.forEach((fragment, idx) => {
          const phase = t * fragment.userData.driftSpeed + fragment.userData.driftPhase;
          const amplitude = fragment.userData.driftAmplitude;
          const basePosition = fragment.userData.basePosition;
          const baseRotation = fragment.userData.baseRotation;
          fragment.position.set(
            basePosition.x + Math.sin(phase) * amplitude,
            basePosition.y + Math.cos(phase * 1.13) * amplitude * 0.7,
            basePosition.z + Math.sin(phase * 0.87) * amplitude * 0.85
          );
          fragment.rotation.x = baseRotation.x + Math.sin(phase * 0.7) * 0.08;
          fragment.rotation.y = baseRotation.y + Math.cos(phase * 0.8) * 0.08 + idx * 0.01;
          fragment.rotation.z = baseRotation.z + Math.sin(phase * 0.65) * 0.05;
        });

        microOrbit.rotation.x = microOrbit.userData.baseRotation.x + Math.sin(t * 0.18) * 0.03;
        microOrbit.rotation.y = microOrbit.userData.baseRotation.y + t * 0.11;
        microOrbit.rotation.z = microOrbit.userData.baseRotation.z + Math.cos(t * 0.14) * 0.02;
      };

      group.userData.mnemonicCoreRotationAxis = new THREE.Vector3(0.3, 1, -0.2).normalize();
      group.userData.mnemonicCoreRotationSpeed = 0.04;
      group.userData.mnemonicShellRotationAxis = new THREE.Vector3(-0.4, -0.8, 0.3).normalize();
      group.userData.mnemonicShellRotationSpeed = -0.03;
      group.userData.storageBreath = false;
      group.userData.visualVariant = 'STORAGE_ARCHIVE_TENSION';
      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'STORAGE_MNEMONIC_VAULT';

      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createStorageMnemonicVault',
        category: 'storage',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }
  /**
   * STORAGE: ARCHIVE_SPINDLE (NEW - Session 63)
   * Layered data strata compressed into vertical spindle structure
   * - Tall, segmented structure with static layers
   * - Layers slightly offset (but static at creation)
   * - Central axis clearly visible
   * - Animation: slow axial rotation + gentle vertical oscillation
   * 
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createStorageArchiveSpindle(group, color) {
    try {
      const segmentCount = 8;
      const segmentHeight = 0.18;
      const segmentRadius = 0.55;
      
      // Create central axis (visual focus)
      const axisGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 12);
      const axisMaterial = new THREE.MeshStandardMaterial({
        transparent: false,
        opacity: 1,
        depthWrite: true,
        depthTest: true,
        side: THREE.FrontSide,
        color: color,
        metalness: 0.85,
        roughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.3

      });
      const axis = new THREE.Mesh(axisGeometry, axisMaterial);
      axis.userData.isCentralAxis = true;
      axis.userData.visualCoreImmutable = true;
      group.add(axis);

      // Create layered segments (strata)
      const strataMaterial = new THREE.MeshStandardMaterial({
        transparent: false,
        opacity: 1,
        depthWrite: true,
        depthTest: true,
        side: THREE.FrontSide,
        color: color,
        metalness: 0.75,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.2

      });

      for (let i = 0; i < segmentCount; i++) {
        // Create disc segment
        const discGeometry = new THREE.CylinderGeometry(
          segmentRadius,
          segmentRadius,
          segmentHeight,
          12
        );
        const disc = new THREE.Mesh(discGeometry, strataMaterial);
        
        // Position with slight offset for visual depth
        const yPos = (i - segmentCount / 2) * (segmentHeight + 0.08);
        const offsetFactor = Math.sin(i * 0.6) * 0.04;
        
        disc.position.y = yPos;
        disc.rotation.z = offsetFactor * 0.3;
        disc.userData.strataIndex = i;
        disc.userData.visualCoreImmutable = true;
        
        group.add(disc);
      }

      // Add subtle decorative ring bands between segments
      for (let i = 0; i < segmentCount - 1; i++) {
        const bandGeometry = new THREE.TorusGeometry(segmentRadius + 0.08, 0.04, 8, 32);
        const bandMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.3
        });
        const band = new THREE.Mesh(bandGeometry, bandMaterial);
        
        const yPos = (i + 1 - segmentCount / 2) * (segmentHeight + 0.08) - (segmentHeight + 0.04);
        band.position.y = yPos;
        band.userData.visualCoreImmutable = true;
        
        group.add(band);
      }

      // Store animation metadata (transform-only, no vertex/material mutation)
      group.userData.spindleRotationSpeed = 0.12; // Slow axial rotation
      group.userData.spindleOscillationAmplitude = 0.06; // Small vertical oscillation
      group.userData.spindleOscillationSpeed = 0.4;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'STORAGE_ARCHIVE_SPINDLE';

      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createStorageArchiveSpindle',
        category: 'storage',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * STORAGE: MEMORY_REEF (NEW - Session 63)
   * Clustered memory fragments orbiting calm central anchor
   * - Central anchor mesh (non-spherical octahedron)
   * - 8 small crystalline shards arranged around it (individual meshes)
   * - Shards are separate meshes (not instanced merge)
   * - Animation: shards orbit slowly, no scale pulsing
   * 
   * VISUAL SAFETY: Static geometry, transform-only animation (orbit), immutable
   */
  static createStorageMemoryReef(group, color) {
    try {
      // Create central anchor (non-spherical - diamond-like octahedron)
      const anchorGeometry = new THREE.OctahedronGeometry(0.3, 2);
      anchorGeometry.scale(1.0, 1.4, 0.85); // Asymmetrical elongation
      
      const anchorMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.15,
        transmission: 0, // Phase B.3.A: transmission disabled to prevent RenderTransmissionPass
        thickness: 0.4,
        ior: 1.5,
        emissive: color,
        emissiveIntensity: 0.25
      });
      
      const anchor = new THREE.Mesh(anchorGeometry, anchorMaterial);
      anchor.rotation.set(Math.PI / 6, Math.PI / 4, 0);
      anchor.userData.isAnchorCore = true;
      anchor.userData.visualCoreImmutable = true;
      group.add(anchor);

      // Create 8 individual crystalline shards in orbit around anchor
      const shardCount = 8;
      const orbitRadius = 0.65;
      
      const shardMaterial = new THREE.MeshStandardMaterial({
        transparent: false,
        opacity: 1,
        depthWrite: true,
        depthTest: true,
        side: THREE.FrontSide,
        color: color,
        metalness: 0.7,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.2

      });

      for (let i = 0; i < shardCount; i++) {
        // Create irregular tetrahedron shard
        const shardGeometry = new THREE.TetrahedronGeometry(0.22, 1);
        const shard = new THREE.Mesh(shardGeometry, shardMaterial);
        
        // Position in orbit
        const angle = (i / shardCount) * Math.PI * 2;
        const height = Math.sin(i * 0.7) * 0.2;
        
        shard.position.set(
          Math.cos(angle) * orbitRadius,
          height,
          Math.sin(angle) * orbitRadius
        );
        
        // Random rotation for organic feel (static at creation)
        shard.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        
        shard.userData.shardIndex = i;
        shard.userData.orbitRadius = orbitRadius;
        shard.userData.orbitHeight = height;
        shard.userData.orbitAngle = angle;
        shard.userData.visualCoreImmutable = true;
        
        group.add(shard);
      }

      // Store animation metadata (orbit-based, no vertex mutation)
      group.userData.reefShardOrbitSpeed = 0.15; // Slow orbital animation
      group.userData.reefShardCount = shardCount;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'STORAGE_MEMORY_REEF';

      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createStorageMemoryReef',
        category: 'storage',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  // ===== CONTROL NODES (Red/Magenta - 4 variants) =====

  /**
   * Control Node 0: Strong octagonal core with magenta rim + central static polyhedron + subtle mesh pulsing
   * UPGRADED: Added solid central core + very subtle mesh line pulsing for authority/stability
   * VISUAL HIERARCHY: Central core remains visible but not dominant (no opacity change—opaque by design)
   */
static createControlNode0(group, color) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.25,
    metalness: 0.65,
    roughness: 0.28
  });

  // Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.2, 8, 1), mat);
  base.position.y = -0.3;
  validateMeshGeometry(base, 'createControlNode0:base');
  group.add(base);

  // Spine
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.8, 8, 1), mat);
  spine.position.y = 0.7;
  validateMeshGeometry(spine, 'createControlNode0:spine');
  group.add(spine);

  // Core
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), mat);
  core.position.y = 1.6;
  core.rotation.y = Math.PI * 0.18;
  core.userData.isCore = true;
  validateMeshGeometry(core, 'createControlNode0:core');
  group.add(core);

  // Frame
  const frame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.62, 0)),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 })
  );
  frame.position.y = 1.6;
  group.add(frame);

  // Orbit ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.05, 10, 32), mat);
  ring.position.y = 1.6;
  ring.rotation.x = Math.PI * 0.5;
  ring.rotation.z = Math.PI * 0.25;
  validateMeshGeometry(ring, 'createControlNode0:ring');
  group.add(ring);

  group.userData.visualTier = "CONTROL_V4";
  group.userData.hasAuthoritySpine = true;
  return group;
}

  /**
   * Control Node 1: Sharp tetrahedral pyramid
   */
  static createControlNode1(group, color) {
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.22,
      metalness: 0.8,
      roughness: 0.2
    });
    const accentMat = new THREE.MeshBasicMaterial({
      color: 0xd9f6ff,
      transparent: true,
      opacity: 0.42
    });

    // 1) Ceremonial base - lower authority plinth
    const baseLower = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.76, 0.11, 7, 1), bodyMat);
    baseLower.position.y = -0.46;
    baseLower.rotation.y = Math.PI * 0.06;
    validateMeshGeometry(baseLower, 'createControlNode1:baseLower');
    group.add(baseLower);

    // 2) Ceremonial base - upper command plate
    const baseUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.51, 0.09, 9, 1), bodyMat);
    baseUpper.position.y = -0.33;
    baseUpper.rotation.y = -Math.PI * 0.08;
    validateMeshGeometry(baseUpper, 'createControlNode1:baseUpper');
    group.add(baseUpper);

    // 3) Command spine - dominant ascended obelisk
    const spineGeo = new THREE.CylinderGeometry(0.11, 0.07, 1.58, 6, 1);
    spineGeo.scale(0.9, 1.0, 1.08);
    const spine = new THREE.Mesh(spineGeo, bodyMat);
    spine.position.y = 0.35;
    spine.rotation.set(0.015, Math.PI * 0.11, -0.012);
    validateMeshGeometry(spine, 'createControlNode1:spine');
    group.add(spine);

    // 4) Control core - ascended relic seed
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.29, 1), bodyMat);
    core.position.y = 1.02;
    core.rotation.set(Math.PI * 0.05, Math.PI * 0.24, Math.PI * 0.02);
    core.userData.isCore = true;
    validateMeshGeometry(core, 'createControlNode1:core');
    group.add(core);

    // 5) Symbolic frame - thin broken crown/orbit of authority
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.013, 8, 26, Math.PI * 1.38), accentMat);
    crown.position.set(0.01, 1.02, 0.0);
    crown.rotation.set(Math.PI * 0.36, Math.PI * 0.2, -Math.PI * 0.13);
    validateMeshGeometry(crown, 'createControlNode1:crown');
    group.add(crown);

    // 6) Left relic buttress - command support spine
    const buttressGeo = new THREE.BoxGeometry(0.12, 0.95, 0.16);
    const finLeft = new THREE.Mesh(buttressGeo, bodyMat);
    finLeft.position.set(-0.22, 0.12, 0.14);
    finLeft.rotation.set(-0.06, Math.PI * 0.14, 0.05);
    validateMeshGeometry(finLeft, 'createControlNode1:finLeft');
    group.add(finLeft);

    // 7) Right relic buttress - asymmetric counter-command
    const finRight = new THREE.Mesh(buttressGeo, bodyMat);
    finRight.position.set(0.2, 0.18, -0.18);
    finRight.rotation.set(0.05, -Math.PI * 0.12, -0.06);
    validateMeshGeometry(finRight, 'createControlNode1:finRight');
    group.add(finRight);

    // 8) Upper authority marker - ascended command relic tip
    const marker = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.34, 5, 1), accentMat);
    marker.position.set(-0.02, 1.58, 0.01);
    marker.rotation.set(0.06, Math.PI * 0.27, -0.03);
    validateMeshGeometry(marker, 'createControlNode1:marker');
    group.add(marker);

    group.userData.visualTier = "CONTROL_AUTHORITY_SPIRE";
    group.userData.hasAuthoritySpine = true;

    return group;
  }


  /**
   * Control Node 2: Ring-within-ring hierarchy structure
   */
  static createControlNode2(group, color) {
    const nodeKey = group?.userData?.nodeId || group?.userData?.visualCode?.toString() || String(color || 0x00ffff);
    const seedValue = hashString(nodeKey);
    const seed = Math.abs(seedValue) || 1;
    const rng = _mythicSeededRng(seed);

    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.24,
      metalness: 0.82,
      roughness: 0.18
    });

    const haloMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.34
    });

    const lineMat = new THREE.LineBasicMaterial({
      color: 0xcaf4ff,
      transparent: true,
      opacity: 0.52
    });

    const root = new THREE.Group();
    root.name = 'CONTROL_SOVEREIGN_STABILIZER';

    // Fractured command dais: three floating authority slabs
    const daisGeo = new THREE.BoxGeometry(0.78, 0.12, 0.34);
    const daisConfigs = [
      { pos: [0.0, -0.5, 0.0], rot: [0, Math.PI * 0.08, 0], scale: [1.2, 1, 1.0] },
      { pos: [-0.42, -0.36, 0.18], rot: [0.04, -Math.PI * 0.22, 0.18], scale: [0.88, 1, 0.72] },
      { pos: [0.44, -0.32, -0.22], rot: [-0.03, Math.PI * 0.18, -0.2], scale: [0.94, 1, 0.76] }
    ];
    daisConfigs.forEach((cfg, i) => {
      const slab = new THREE.Mesh(daisGeo, bodyMat);
      slab.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      slab.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
      slab.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
      validateMeshGeometry(slab, `createControlNode2:dais${i}`);
      root.add(slab);
    });

    // Sovereign pylons converging toward the command core
    const pylonGeo = new THREE.BoxGeometry(0.11, 1.0, 0.11);
    const pylonConfigs = [
      { pos: [-0.28, 0.12, 0.22], rot: [0.1, 0.08, 0.2], scale: [1.0, 1.0, 1.0] },
      { pos: [0.26, 0.18, -0.18], rot: [-0.06, -0.12, -0.18], scale: [1.0, 1.08, 1.0] },
      { pos: [0.06, 0.14, 0.34], rot: [0.16, 0.18, -0.08], scale: [0.9, 0.9, 0.9] }
    ];
    pylonConfigs.forEach((cfg, i) => {
      const pylon = new THREE.Mesh(pylonGeo, bodyMat);
      pylon.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      pylon.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
      pylon.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
      validateMeshGeometry(pylon, `createControlNode2:pylon${i}`);
      root.add(pylon);
    });

    // Fractured authority core
    const coreGeo = new THREE.OctahedronGeometry(0.34, 0);
    const core = new THREE.Mesh(coreGeo, bodyMat);
    core.position.set(0.02, 0.84, -0.02);
    core.rotation.set(Math.PI * 0.12, Math.PI * 0.22, -Math.PI * 0.08);
    core.scale.set(1.12, 1.34, 0.92);
    core.userData.isCore = true;
    validateMeshGeometry(core, 'createControlNode2:core');
    root.add(core);

    const innerKernel = new THREE.Mesh(new THREE.TetrahedronGeometry(0.18, 0), bodyMat.clone());
    innerKernel.position.set(0.0, 0.84, 0.03);
    innerKernel.rotation.set(-Math.PI * 0.14, Math.PI * 0.3, Math.PI * 0.1);
    innerKernel.scale.set(0.88, 1.2, 0.82);
    innerKernel.material.emissiveIntensity = 0.36;
    validateMeshGeometry(innerKernel, 'createControlNode2:innerKernel');
    root.add(innerKernel);

    // Broken authority halos
    const haloConfigs = [
      { radius: 0.84, tube: 0.045, arc: Math.PI * 1.42, pos: [0.0, 0.84, 0.0], rot: [Math.PI * 0.5, 0.18, 0.06] },
      { radius: 0.92, tube: 0.035, arc: Math.PI * 1.18, pos: [0.04, 0.88, -0.04], rot: [Math.PI * 0.18, Math.PI * 0.22, Math.PI * 0.34] }
    ];
    haloConfigs.forEach((cfg, i) => {
      const halo = new THREE.Mesh(new THREE.TorusGeometry(cfg.radius, cfg.tube, 10, 42, cfg.arc), haloMat);
      halo.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      halo.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
      halo.userData.isControlHalo = true;
      validateMeshGeometry(halo, `createControlNode2:halo${i}`);
      root.add(halo);
    });

    // Control sigils / stabilizer shards
    const sigilGeo = new THREE.TetrahedronGeometry(0.1, 0);
    for (let i = 0; i < 5; i++) {
      const sigil = new THREE.Mesh(sigilGeo, haloMat);
      const angle = (i / 5) * Math.PI * 2;
      const radius = 0.72 + rng() * 0.16;
      sigil.position.set(
        Math.cos(angle) * radius,
        0.62 + ((i % 2 === 0) ? 0.22 : -0.08),
        Math.sin(angle * 1.18) * radius * 0.78
      );
      sigil.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      sigil.scale.set(0.8 + rng() * 0.45, 1.3 + rng() * 0.25, 0.8 + rng() * 0.35);
      validateMeshGeometry(sigil, `createControlNode2:sigil${i}`);
      root.add(sigil);
    }

    root.userData.visualVariant = 'CONTROL_SOVEREIGN_STABILIZER_V2';
    root.userData.nodeGeometryName = 'CONTROL_SOVEREIGN_STABILIZER';
    group.add(root);
    return group;
  }

  /**
   * Control Node 3: X-shaped form with beveled edges
   */
  static createControlNode3(group, color) {
    const nodeKey = group?.userData?.nodeId || group?.userData?.visualCode?.toString() || String(color || 0x00ffff);
    const rawSeed = hashString(nodeKey);
    const positiveSeed = Math.abs(rawSeed) || 1;
    const rng = _mythicSeededRng(positiveSeed);
    const root = new THREE.Group();
    root.name = 'CONTROL_AUTHORITATIVE_FRACTURE';

    const perturb = (geom, strength = 0.04) => {
      const attr = geom.attributes.position;
      for (let i = 0; i < attr.count; i++) {
        attr.setXYZ(
          i,
          attr.getX(i) + (rng() - 0.5) * strength,
          attr.getY(i) + (rng() - 0.5) * strength * 0.6,
          attr.getZ(i) + (rng() - 0.5) * strength
        );
      }
      geom.computeVertexNormals();
    };

    const coreGeo = new THREE.IcosahedronGeometry(0.8, 2);
    perturb(coreGeo, 0.12);
    coreGeo.scale(1, 1.15, 1);
    const coreMat = createControlFractureMaterial(positiveSeed, color);
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.name = 'FracturedCore';
    coreMesh.userData.isControl3Core = true;
    coreMesh.userData.fractureUniforms = coreMat.uniforms;
    root.add(coreMesh);

    // Authority shards
    const shardCount = 8 + Math.floor(rng() * 7);
    for (let i = 0; i < shardCount; i++) {
      const shardGeo = new THREE.TetrahedronGeometry(0.25, 0);
      perturb(shardGeo, 0.08);
      const shardMat = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.3,
        roughness: 0.5,
        emissive: color,
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.6
      });
      const shard = new THREE.Mesh(shardGeo, shardMat);
      const radius = 1.2 + rng() * 0.6;
      const angle = rng() * Math.PI * 2;
      shard.position.set(
        Math.cos(angle) * radius,
        (rng() - 0.5) * 0.3,
        Math.sin(angle) * radius
      );
      shard.scale.setScalar(0.2 + rng() * 0.3);
      shard.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      shard.userData.authorityShard = true;
      root.add(shard);
    }

    // Fracture cage
    const cageGeo = new THREE.DodecahedronGeometry(1.4, 0);
    perturb(cageGeo, 0.13);
    const cageEdges = new THREE.EdgesGeometry(cageGeo);
    const cagePositions = cageEdges.attributes.position.array;
    const filtered = [];
    for (let i = 0; i < cagePositions.length; i += 6) {
      if (rng() > 0.3) continue;
      filtered.push(
        cagePositions[i], cagePositions[i + 1], cagePositions[i + 2],
        cagePositions[i + 3], cagePositions[i + 4], cagePositions[i + 5]
      );
    }
    const cageGeom = new THREE.BufferGeometry();
    cageGeom.setAttribute('position', new THREE.Float32BufferAttribute(filtered.length ? filtered : cagePositions, 3));
    const cage = new THREE.LineSegments(cageGeom, new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.4
    }));
    cage.scale.setScalar(1.4);
    root.add(cage);

    // Authority axis
    const axisGeo = new THREE.CylinderGeometry(0.03, 0.02, 1.8, 8, 4, true);
    perturb(axisGeo, 0.05);
    const axis = new THREE.Mesh(axisGeo, new THREE.MeshStandardMaterial({
      color,
      metalness: 0.6,
      roughness: 0.4,
      emissive: color,
      emissiveIntensity: 0.2
    }));
    axis.position.y = 0;
    axis.rotation.set(0.1, 0, 0.05);
    axis.userData.isAuthorityAxis = true;
    root.add(axis);

    group.add(root);
  // Copy nodeId from input group (if exists)
  const inputNodeGroup = arguments[0];
  if (inputNodeGroup && inputNodeGroup.userData && inputNodeGroup.userData.nodeId) {
    group.userData.nodeId = inputNodeGroup.userData.nodeId;
  }

    return group;
  }

  /**
   * AxiomCrystal: Vertical crystal monolith with sharp facets (CANONICAL)
   * - Vertical elongation (height ~1.8x width)
   * - 14 sharp facets, asymmetrical cuts (top/bottom NOT mirrored)
   * - ~5° axial twist around Y-axis
   * - Transmission material (IOR 1.45, transmission 0.9, roughness 0.1)
   * - Internal color gradient: gold → amber → dark honey
   * - IMMUTABLE: No material mutation, no state-based changes
   */
  static createAxiomCrystalNode(group, color) {
    // Create vertical crystal using custom faceted geometry
    const vertices = new Float32Array([
      // Base (asymmetrical - wider, irregular cuts)
      0.0, -0.9, 0.0,      // 0: center bottom
      0.35, -0.9, 0.0,     // 1
      0.25, -0.9, 0.3,     // 2
      -0.15, -0.9, 0.35,   // 3
      -0.4, -0.9, 0.15,    // 4
      -0.3, -0.9, -0.25,   // 5
      0.15, -0.9, -0.35,   // 6
      
      // Lower section (transition)
      0.32, -0.5, 0.0,     // 7
      0.22, -0.5, 0.28,    // 8
      -0.12, -0.5, 0.32,   // 9
      -0.35, -0.5, 0.12,   // 10
      -0.28, -0.5, -0.22,  // 11
      0.12, -0.5, -0.32,   // 12
      
      // Upper section (tighter - asymmetrical)
      0.2, 0.4, -0.05,     // 13
      0.18, 0.4, 0.15,     // 14
      -0.08, 0.4, 0.22,    // 15
      -0.25, 0.4, 0.05,    // 16
      -0.18, 0.4, -0.15,   // 17
      
      // Top (sharp point - offset from center)
      -0.05, 0.9, 0.08     // 18: apex (asymmetrical)
    ]);

    // Define faces (14 facets for fully faceted crystal)
    const indices = new Uint16Array([
      // Base to lower section (6 radial faces - irregular)
      0, 1, 7,
      0, 7, 12,
      0, 12, 6,
      0, 6, 5,
      0, 5, 4,
      0, 4, 3,
      0, 3, 2,
      0, 2, 1,
      
      // Lower to upper section (5 radial faces)
      7, 8, 14,
      8, 9, 15,
      9, 10, 16,
      10, 11, 17,
      11, 12, 13,
      
      // Upper to apex (5 top faces - asymmetrical point)
      13, 14, 18,
      14, 15, 18,
      15, 16, 18,
      16, 17, 18,
      17, 13, 18,
      
      // Side connections (bridge lower to upper)
      7, 14, 13,
      8, 15, 14,
      9, 16, 15,
      10, 17, 16,
      11, 13, 17,
      12, 7, 13
    ]);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    // Create transmission material with internal gradient
    // Gold → Amber → Dark Honey internal color
    const transmissionMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffd700).lerp(new THREE.Color(0xffb347), 0.5), // Gold-Amber base
      transmission: 0, // Phase B.3.A: transmission disabled to prevent RenderTransmissionPass
      thickness: 0.8,
      roughness: 0.1,
      metalness: 0.0,
      ior: 1.45,
      reflectivity: 0.9,
      envMapIntensity: 1.0,
      side: THREE.FrontSide,
      // Internal color gradient simulation
      emissive: new THREE.Color(0x8b6914), // Dark honey subtle glow
      emissiveIntensity: 0.05
    });
    
    // Lock material from mutation
    transmissionMaterial.userData.immutable = true;
    Object.defineProperty(transmissionMaterial, 'userData', {
      writable: false,
      configurable: false
    });

    const crystal = new THREE.Mesh(geometry, transmissionMaterial);
    
    // Apply ~5° axial twist around Y-axis
    crystal.rotation.y = (5 * Math.PI) / 180; // 5 degrees

    // Mark as immutable static geometry
    crystal.userData.isStaticAxiomCrystal = true;
    crystal.userData.immutable = true;
    crystal.userData.noMaterialMutation = true;
    
    // CRITICAL: DO NOT freeze geometry or material
    // Three.js needs extensibility to attach event listeners (_listeners)
    // Immutability is enforced at API level via userData flags

    group.add(crystal);
    group.userData.nodeGeometryName = 'CONTROL_AXIOM_CRYSTAL';
    group.userData.isCanonicalControlNode = true;
    
    return group;
  }

  /**
   * Main control node creator
   * CANONICAL CATEGORY: CONTROL
   * - AxiomCrystal (CANONICAL - SINGLE GEOMETRY)
   * - OctagonalCore+Rim (deprecated variant)
   * - ControlRingLattice (deprecated variant)
   * - SpikedControlFrame (deprecated variant)
   * - CommandPyramid (NEW - Session 63)
   * - HierarchyTower (NEW - Session 63)
   * - SymmetryCore (NEW - Session 63)
   * - DecisionFork (NEW - Session 83)
   * - AuthorityHelix (NEW - Session 83)
   * - CommandMatrix (NEW - Session 83)
   * - ΦRIX Flow Arbiter (NEW - Session 114)
   * - CRUCIS Suppression Governor (NEW - Session 114)
   * - VERTEX Temporal Gate (NEW - Session 114)
   * 
   * SPINE VARIANTS (Session 100 - Additive, not auto-selected):
   * - SegmentedSpine (NEW - optional)
   * - TwistedSpine (NEW - optional)
   * - HollowSpine (NEW - optional)
   */
  /**
   * CONTROL v2: Authority Column Core
   * Hierarchy:
   * CONTROL_NODE
   *   - CORE_GROUP (AuthorityColumn + AuthorityColumnEdges + AuthoritySpire)
   *   - DOMINION_GROUP (InnerRigidRing + OuterSegmentedRing)
   *   - OVERRIDE_GROUP (OverrideAuthorityBand)
   */
  static createControlNodeStyled_v2(group, index, color) {
    try {
      const geometries = _getControlV2Geometries();
      const materials = _getControlV2Materials(color);
      const controlRoot = new THREE.Group();
      controlRoot.name = 'CONTROL_NODE';
      controlRoot.userData.visualVariant = 'CONTROL_V2';

      // CORE
      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';
      const core = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      core.name = 'AuthorityColumn';
      core.userData.visualLayer = 'CORE';

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'AuthorityColumnEdges';
      coreEdges.userData.visualLayer = 'CORE';

      const spine = new THREE.Mesh(geometries.spireGeometry, materials.spireMat);
      spine.name = 'AuthoritySpire';
      spine.position.y = 0.08;
      spine.userData.visualLayer = 'CONTROL_SPIRE';
      spine.userData.pulseBaseScaleY = 1;

      coreGroup.add(core);
      coreGroup.add(coreEdges);
      coreGroup.add(spine);
      controlRoot.add(coreGroup);

      // DOMINION
      const dominionGroup = new THREE.Group();
      dominionGroup.name = 'DOMINION_GROUP';

      const innerRing = new THREE.Mesh(geometries.ringGeometry, materials.ringMat);
      innerRing.name = 'InnerRigidRing';
      innerRing.rotation.x = Math.PI / 2;
      innerRing.userData.visualLayer = 'RING_INNER';
      dominionGroup.add(innerRing);

      const segmentedRing = new THREE.Group();
      segmentedRing.name = 'OuterSegmentedRing';
      const segmentCount = 18;
      const segmentRadius = 1.13;
      for (let i = 0; i < segmentCount; i++) {
        const segment = new THREE.Mesh(geometries.segmentGeometry, materials.segmentMat);
        const angle = (i / segmentCount) * Math.PI * 2;
        segment.position.set(
          Math.cos(angle) * segmentRadius,
          0,
          Math.sin(angle) * segmentRadius
        );
        segment.rotation.y = -angle + Math.PI / 2;
        segment.userData.visualLayer = 'RING_SEGMENT';
        segment.userData.segmentIndex = i;
        segmentedRing.add(segment);
      }
      dominionGroup.add(segmentedRing);

      controlRoot.add(dominionGroup);

      // OVERRIDE
      const overrideGroup = new THREE.Group();
      overrideGroup.name = 'OVERRIDE_GROUP';

      const overrideRing = new THREE.Mesh(geometries.overrideGeometry, materials.overrideMat);
      overrideRing.name = 'OverrideAuthorityBand';
      overrideRing.rotation.x = Math.PI / 2;
      overrideGroup.add(overrideRing);

      controlRoot.add(overrideGroup);

      controlRoot.userData.controlV2InnerRing = innerRing;
      controlRoot.userData.controlV2SegmentRing = segmentedRing;
      controlRoot.userData.controlV2Spire = spine;
      controlRoot.userData.controlV2InnerRingSpeed = 0.18;
      controlRoot.userData.controlV2SegmentRingSpeed = -0.12;
      controlRoot.userData.controlV2SpireSpeed = 0.09;
      controlRoot.userData.controlV2SpirePulseSpeed = 1.25;
      controlRoot.userData.controlV2SpirePulseAmp = 0.02;
      controlRoot.userData.visualReady = true;
      group.add(controlRoot);
      return group;
    } catch (err) {
      console.error('[ControlV2Abort]', { reason: err?.message || err });
      return null;
    }
  }

  /**
   * CONTROL v2 LEGACY: Cybernetic Dominion Core
   * (Restored for diagnostics; not part of registry by default)
   */
  static createControlNodeStyled_v2_Legacy(group, index, color) {
    try {
      const geometries = _getControlV2Geometries_Legacy();
      const materials = _getControlV2Materials_Legacy(color);
      const controlRoot = new THREE.Group();
      controlRoot.name = 'CONTROL_NODE';
      controlRoot.userData.visualVariant = 'CONTROL_V2';

      const seed = group?.userData?.nodeId ? hashString(group.userData.nodeId) : index || 1;
      const rng = _mythicSeededRng(seed);
      const scratch = new THREE.Object3D();

      // CORE
      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';
      const core = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      core.name = 'AuthorityCore';
      core.scale.setScalar(1.05);
      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'CoreFrame';
      const spine = new THREE.LineSegments(geometries.axisGeometry, materials.beamMat);
      spine.name = 'CentralSpine';
      spine.scale.set(0.3, 1.0, 0.3);
      coreGroup.add(core);
      coreGroup.add(coreEdges);
      coreGroup.add(spine);
      controlRoot.add(coreGroup);

      // DOMINION
      const dominionGroup = new THREE.Group();
      dominionGroup.name = 'DOMINION_GROUP';

      // TripleOrbitRings
      const ringScales = [0.95, 1.15, 1.35];
      ringScales.forEach((s, idx) => {
        const ring = new THREE.Mesh(geometries.ringGeometry, materials.ringMat);
        ring.name = `TripleOrbitRing_${idx}`;
        ring.scale.setScalar(s);
        ring.rotation.set(idx * 0.3, idx === 1 ? 0.4 : 0.1, idx === 2 ? -0.35 : 0.0);
        dominionGroup.add(ring);
      });

      // SatelliteProcessors (instanced)
      const satCount = 14;
      const sats = new THREE.InstancedMesh(geometries.satGeometry, materials.satMat, satCount);
      sats.name = 'SatelliteProcessors';
      sats.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const satRadius = (geometries.coreGeometry.boundingSphere?.radius || 0.55) * 1.8;
      for (let i = 0; i < satCount; i++) {
        const dir = new THREE.Vector3(
          rng() * 2 - 1,
          rng() * 2 - 1,
          rng() * 2 - 1
        ).normalize();
        scratch.position.copy(dir).multiplyScalar(satRadius);
        scratch.lookAt(dir.clone().multiplyScalar(2)); // orient outward
        scratch.rotateY(Math.PI / 2);
        const scale = 0.8 + rng() * 0.5;
        scratch.scale.setScalar(scale);
        scratch.updateMatrix();
        sats.setMatrixAt(i, scratch.matrix);
      }
      sats.instanceMatrix.needsUpdate = true;
      dominionGroup.add(sats);

      // AxisBeams
      const beams = new THREE.LineSegments(geometries.axisGeometry, materials.beamMat);
      beams.name = 'AxisBeams';
      dominionGroup.add(beams);

      // CommandGrid (outer cage edges)
      const cage = new THREE.LineSegments(geometries.cageEdgesGeometry, materials.cageMat);
      cage.name = 'CommandGrid';
      cage.scale.setScalar(1.1);
      dominionGroup.add(cage);

      controlRoot.add(dominionGroup);

      // OVERRIDE
      const overrideGroup = new THREE.Group();
      overrideGroup.name = 'OVERRIDE_GROUP';

      const barrier = new THREE.Mesh(geometries.barrierGeometry, materials.barrierMat);
      barrier.visible = false; // TEMP TEST disable legacy shell
      barrier.name = 'EnergyBarrier';
      barrier.scale.setScalar(1.05);
      overrideGroup.add(barrier);

      const matrix = new THREE.Points(geometries.matrixGeometry, materials.matrixMat);
      matrix.name = 'SignalMatrix';
      matrix.frustumCulled = false;
      overrideGroup.add(matrix);

      controlRoot.add(overrideGroup);

      controlRoot.userData.visualReady = true;
      group.add(controlRoot);
      return group;
    } catch (err) {
      console.error('[ControlV2Abort]', { reason: err?.message || err });
      return null;
    }
  }


  /**
   * Get spine variant by name (Session 100)
   * Provides access to new spine variants without affecting auto-selection
   * Use: EnhancedNodeModels.createControlSpineVariant('segmented', group, color)
   * @param {string} variantName - 'segmented', 'twisted', or 'hollow'
   * @param {THREE.Group} group - The node group to populate
   * @param {number} color - The node color
   * @returns {THREE.Group} The populated node group
   */
  static createControlSpineVariant(variantName = 'segmented', group, color) {
    try {
      switch (variantName.toLowerCase()) {
        case 'segmented':
          return ControlSpineVariants.createControlSpine_Segmented(group, color);
        case 'twisted':
          return ControlSpineVariants.createControlSpine_Twisted(group, color);
        case 'hollow':
          return ControlSpineVariants.createControlSpine_Hollow(group, color);
        default:
          console.warn(`[EnhancedNodeModels] Unknown spine variant: ${variantName}, using segmented`);
          return ControlSpineVariants.createControlSpine_Segmented(group, color);
      }
    } catch (err) {
      console.warn(`[EnhancedNodeModels] Spine variant creation failed for ${variantName}:`, err);
      return this.createControlNode(group, 0, color); // Fallback to default
    }
  }

  /**
   * Get special control governor by name (Session 114)
   * Autonomous regulatory nodes for network flow control
   * Use: EnhancedNodeModels.createControlSpecialGovernor('phrix', group, color)
   *      EnhancedNodeModels.createControlSpecialGovernor('crucis', group, color)
   *      EnhancedNodeModels.createControlSpecialGovernor('vertex', group, color)
   * 
   * @param {string} governorName - 'phrix' (Flow Arbiter), 'crucis' (Suppression), or 'vertex' (Temporal Gate)
   * @param {THREE.Group} group - The node group to populate
   * @param {number} color - The node color (typically magenta/red for CONTROL nodes)
   * @returns {THREE.Group} The populated node group
   */
  static createControlSpecialGovernor(governorName = 'phrix', group, color) {
    try {
      return ControlNodeSpecialGovernors.createSpecialGovernor(governorName, group, color);
    } catch (err) {
      console.warn(`[EnhancedNodeModels] Special governor creation failed for '${governorName}':`, err);
      return this.createControlNode(group, 0, color); // Fallback to standard control node
    }
  }

  /**
   * CONTROL: COMMAND_PYRAMID (NEW - Session 63)
   * Authority radiating from a central point of command
   * - Tall asymmetric pyramid (base authority structure)
   * - 4 radiating command beams (pointing outward from apex)
   * - Central glow core emphasizing command authority
   * - Animation: Slow rotation + gentle pulsing authority aura
   * 
   * VISUAL MEANING: "Authority flows from the apex."
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createControlCommandPyramid(group, color) {
    try {
      const bodyMat = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.82,
        roughness: 0.18,
        emissive: color,
        emissiveIntensity: 0.28
      });
      const frameMat = new THREE.MeshBasicMaterial({
        color: 0xd7f5ff,
        transparent: true,
        opacity: 0.42
      });

      // 1) Strategic base: command dais (disciplined, not bulky)
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.1, 8, 1), bodyMat);
      base.position.y = -0.47;
      base.rotation.y = Math.PI * 0.06;
      validateMeshGeometry(base, 'createControlCommandPyramid:base');
      base.userData.visualCoreImmutable = true;
      group.add(base);

      // 2) Secondary lift plate: optical separation for elevated command core
      const liftPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.08, 8, 1), bodyMat);
      liftPlate.position.y = -0.31;
      liftPlate.rotation.y = -Math.PI * 0.09;
      validateMeshGeometry(liftPlate, 'createControlCommandPyramid:liftPlate');
      liftPlate.userData.visualCoreImmutable = true;
      group.add(liftPlate);

      // 3) Pyramid command focus: ascended directive core (not touching heavy base)
      const pyramid = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.78, 4, 1), bodyMat);
      pyramid.position.y = 0.36;
      pyramid.rotation.set(0.0, Math.PI * 0.25, 0.02);
      pyramid.userData.isCommandPyramid = true;
      pyramid.userData.visualCoreImmutable = true;
      validateMeshGeometry(pyramid, 'createControlCommandPyramid:pyramid');
      group.add(pyramid);

      // 4) Directive frame: thin broken command orbit/crown
      const frame = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.014, 8, 24, Math.PI * 1.35), frameMat);
      frame.position.set(0.02, 0.37, -0.01);
      frame.rotation.set(Math.PI * 0.34, Math.PI * 0.16, -Math.PI * 0.12);
      frame.userData.visualCoreImmutable = true;
      validateMeshGeometry(frame, 'createControlCommandPyramid:frame');
      group.add(frame);

      // 5-7) Vertical authority accents: directive pylons (discipline markers)
      const pylonGeo = new THREE.BoxGeometry(0.08, 0.64, 0.12);
      const pylonConfigs = [
        { pos: [-0.24, 0.0, 0.18], rot: [-0.05, Math.PI * 0.12, 0.05] },
        { pos: [0.26, 0.08, -0.16], rot: [0.04, -Math.PI * 0.1, -0.06] },
        { pos: [0.0, -0.02, -0.27], rot: [0.02, Math.PI * 0.02, 0.0] }
      ];
      pylonConfigs.forEach((cfg, i) => {
        const pylon = new THREE.Mesh(pylonGeo, bodyMat);
        pylon.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        pylon.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        pylon.userData.isDirectivePylon = true;
        pylon.userData.pylonIndex = i;
        pylon.userData.visualCoreImmutable = true;
        validateMeshGeometry(pylon, `createControlCommandPyramid:pylon${i}`);
        group.add(pylon);
      });

      // 8) Optional top cap: command seed beacon
      const seed = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), frameMat);
      seed.position.set(0.0, 0.84, -0.01);
      seed.rotation.set(0.06, Math.PI * 0.2, -0.03);
      seed.userData.isAuthorityGlow = true;
      seed.userData.visualCoreImmutable = true;
      validateMeshGeometry(seed, 'createControlCommandPyramid:seed');
      group.add(seed);

      // Keep metadata fields for compatibility; set static-friendly values.
      group.userData.commandRotationSpeed = 0.0;
      group.userData.commandPulseAmplitude = 0.0;
      group.userData.commandPulseSpeed = 0.0;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'CONTROL_COMMAND_PYRAMID';

      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createControlCommandPyramid',
        category: 'control',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * CONTROL: HIERARCHY_TOWER (NEW - Session 63)
   * Hierarchical levels of command stacked vertically
   * - Tall tower with 5-6 segmented levels
   * - Each level progressively narrower (hierarchy visualization)
   * - Connecting axis showing chain of command
   * - Animation: Very slow rotation + subtle level oscillation
   * 
   * VISUAL MEANING: "Command cascades downward."
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createControlHierarchyTower(group, color) {
    try {
      const levelCount = 6;
      const towerMaterial = new THREE.MeshStandardMaterial({
        transparent: false,
        opacity: 1,
        depthWrite: true,
        depthTest: true,
        side: THREE.FrontSide,
        color: color,
        metalness: 0.8,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.3

      });

      // Create hierarchy levels (progressively narrower)
      for (let i = 0; i < levelCount; i++) {
        // Create octagonal level (8-sided for authoritative structure)
        const levelRadius = 0.5 - (i * 0.06);
        const levelHeight = 0.25;
        const levelGeometry = new THREE.CylinderGeometry(
          levelRadius,
          levelRadius,
          levelHeight,
          8
        );
        
        const level = new THREE.Mesh(levelGeometry, towerMaterial);
        
        // Stack vertically
        const yPos = (levelCount / 2 - i) * (levelHeight + 0.08);
        level.position.y = yPos;
        
        // Slight rotation per level for hierarchical visual
        level.rotation.z = (i * Math.PI / 16);
        
        level.userData.isHierarchyLevel = true;
        level.userData.levelIndex = i;
        level.userData.baseY = yPos;
        level.userData.visualCoreImmutable = true;
        group.add(level);
      }

      // Create central command axis (chain of command)
      const axisGeometry = new THREE.CylinderGeometry(0.1, 0.1, levelCount * 0.33, 6);
      const axisMaterial = new THREE.MeshStandardMaterial({
        transparent: false,
        opacity: 1,
        depthWrite: true,
        depthTest: true,
        side: THREE.FrontSide,
        color: color,
        metalness: 0.95,
        roughness: 0.05,
        emissive: color,
        emissiveIntensity: 0.5

      });
      const axis = new THREE.Mesh(axisGeometry, axisMaterial);
      axis.userData.isCommandAxis = true;
      axis.userData.visualCoreImmutable = true;
      group.add(axis);

      // Add subtle connector rings between levels
      for (let i = 0; i < levelCount - 1; i++) {
        const ringGeometry = new THREE.TorusGeometry(0.52 - (i * 0.06), 0.05, 8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.25
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        
        const yPos = (levelCount / 2 - i - 0.5) * 0.33;
        ring.position.y = yPos;
        ring.userData.isLevelConnector = true;
        ring.userData.visualCoreImmutable = true;
        group.add(ring);
      }

      // Store animation metadata
      group.userData.towerRotationSpeed = 0.08; // Very slow
      group.userData.levelOscillationAmplitude = 0.04; // ±4% gentle bobbing
      group.userData.levelOscillationSpeed = 0.4;
      group.userData.levelCount = levelCount;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'CONTROL_HIERARCHY_TOWER';

      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createControlHierarchyTower',
        category: 'control',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * CONTROL: SYMMETRY_CORE (NEW - Session 63)
   * Perfect symmetry as a control principle — four-fold rotational symmetry
   * - Central symmetric core (tetrahedral)
   * - 4 cardinal arm structures pointing N/S/E/W
   * - Balanced, orderly, authoritative
   * - Animation: Counter-rotating core + arms for balance
   * 
   * VISUAL MEANING: "Order through symmetry."
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createControlSymmetryCore(group, color) {
    try {
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        metalness: 0.78,
        roughness: 0.2
      });

      // Base
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 0.16, 12, 1), mat);
      base.position.y = -0.25;
      validateMeshGeometry(base, 'createControlSymmetryCore:base');
      group.add(base);

      // Spine
      const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.0, 10, 1), mat);
      spine.position.y = 0.25;
      validateMeshGeometry(spine, 'createControlSymmetryCore:spine');
      group.add(spine);

      // Core
      const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), mat);
      core.position.y = 0.65;
      core.userData.isSymmetryCore = true;
      validateMeshGeometry(core, 'createControlSymmetryCore:core');
      group.add(core);

      // Arms (4)
      const armGeo = new THREE.BoxGeometry(0.14, 0.14, 0.7);
      const dirs = [
        [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]
      ];
      dirs.forEach((d, i) => {
        const arm = new THREE.Mesh(armGeo, mat);
        arm.position.set(d[0] * 0.55, 0.65, d[2] * 0.55);
        arm.rotation.y = i * Math.PI * 0.5;
        arm.userData.isSymmetryArm = true;
        validateMeshGeometry(arm, `createControlSymmetryCore:arm${i}`);
        group.add(arm);
      });

      // Orbit ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.045, 10, 28), mat);
      ring.position.y = 0.65;
      ring.rotation.x = Math.PI * 0.5;
      ring.rotation.y = Math.PI * 0.12;
      validateMeshGeometry(ring, 'createControlSymmetryCore:ring');
      group.add(ring);

      // Crown cap
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.2, 8, 1), mat);
      cap.position.y = 1.05;
      validateMeshGeometry(cap, 'createControlSymmetryCore:cap');
      group.add(cap);

      group.userData.symCoreRotationSpeed = 0.08;
      group.userData.symArmRotationSpeed = -0.05;
      group.userData.symmetryBalanceOscillation = 0.02;
      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'CONTROL_SYMMETRY_CORE_V3';

      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createControlSymmetryCore',
        category: 'control',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  // ===== QUANTUM NODES (Bright Green - Dimensional Anomaly) =====

  /**
   * Main quantum node creator
   * CANONICAL CATEGORY: QUANTUM (renamed from SIGMA)
   * - FracturedAnomaly
   * - DistortedPolyCluster
   * - ChaoticLayeredForm
   * - TwistedOctahedron+ResonanceField
   * - HyperbolicNeuralPrism
   * - ChaoticHeart
  */
  /**
   * QUANTUM v2: Superposition Fracture Engine
   * Hierarchy:
   * QUANTUM_NODE
   *   - CORE_GROUP (PrimaryCore + GhostCore_A/B/C + CoreEdges)
   *   - FRACTURE_GROUP (FractureFragments + PhaseBridges + QuantumDust)
   *   - FIELD_GROUP (BrokenArcSegments + PhasePlanes)
   */
  static createQuantumNodeStyled_v2(group, index, color) {
    try {
      const geometries = _getQuantumV2Geometries();
      const materials = _getQuantumV2Materials(color);
      const quantumRoot = new THREE.Group();
      quantumRoot.name = 'QUANTUM_NODE';
      quantumRoot.userData.visualVariant = 'QUANTUM_V2';
      console.log('BUILDER CALLED: createQuantumNodeStyled_v2', { visualVariant: quantumRoot.userData.visualVariant });
      
      // Mark root for traversal safety - skip material restoration for v2 nodes
      quantumRoot.userData.skipMaterialRestoration = true;

      const seed = group?.userData?.nodeId ? hashString(group.userData.nodeId) : index || 1;
      const rng = _mythicSeededRng(seed);
      const scratch = new THREE.Object3D();

      // CORE GROUP
      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const primary = new THREE.Mesh(geometries.baseGeometry, materials.primaryMat);
      primary.name = 'PrimaryCore';
      primary.scale.set(1.0, 0.95, 1.08);
      coreGroup.add(primary);

      const ghostA = new THREE.Mesh(geometries.baseGeometry, materials.ghostA);
      ghostA.name = 'GhostCore_A';
      ghostA.position.set(0.08, 0.02, -0.04);
      ghostA.scale.setScalar(1.03);
      coreGroup.add(ghostA);

      const ghostB = new THREE.Mesh(geometries.baseGeometry, materials.ghostB);
      ghostB.name = 'GhostCore_B';
      ghostB.position.set(-0.06, 0.05, 0.03);
      ghostB.scale.setScalar(0.98);
      coreGroup.add(ghostB);

      const ghostC = new THREE.Mesh(geometries.baseGeometry, materials.ghostC);
      ghostC.name = 'GhostCore_C';
      ghostC.position.set(0.02, -0.07, 0.05);
      ghostC.scale.set(1.06, 1.0, 1.08);
      coreGroup.add(ghostC);

      const edges = new THREE.LineSegments(geometries.edgesGeometry, materials.edgeMat);
      edges.name = 'CoreEdges';
      coreGroup.add(edges);

      quantumRoot.add(coreGroup);

      // FRACTURE GROUP
      const fractureGroup = new THREE.Group();
      fractureGroup.name = 'FRACTURE_GROUP';

      const fragmentCount = 70;
      const fragments = new THREE.InstancedMesh(geometries.fragmentGeometry, materials.fragmentMat, fragmentCount);
      fragments.name = 'FractureFragments';
      fragments.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const radius = 1.15;
      for (let i = 0; i < fragmentCount; i++) {
        const r = radius + rng() * 0.4;
        const theta = rng() * Math.PI * 2;
        const phi = Math.acos(2 * rng() - 1);
        const bias = rng() < 0.6 ? 0.3 : -0.2; // cluster bias
        const x = r * Math.sin(phi) * Math.cos(theta) + bias;
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        const dir = new THREE.Vector3(x, y, z).normalize();
        scratch.position.set(x, y, z);
        scratch.lookAt(dir.clone().multiplyScalar(2));
        scratch.rotateY(Math.PI / 2);
        const s = 0.7 + rng() * 0.6;
        scratch.scale.setScalar(s);
        scratch.updateMatrix();
        fragments.setMatrixAt(i, scratch.matrix);
      }
      fragments.instanceMatrix.needsUpdate = true;
      fractureGroup.add(fragments);

      // PhaseBridges (short lines between random ghost offsets)
      const bridgeLines = [];
      const bridgeCount = 12;
      for (let i = 0; i < bridgeCount; i++) {
        const a = new THREE.Vector3(
          (rng() - 0.5) * 0.3,
          (rng() - 0.5) * 0.3,
          (rng() - 0.5) * 0.3
        );
        const b = a.clone().add(new THREE.Vector3(
          (rng() - 0.5) * 0.5,
          (rng() - 0.5) * 0.5,
          (rng() - 0.5) * 0.5
        ));
        bridgeLines.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
      const bridgeGeo = new THREE.BufferGeometry();
      bridgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(bridgeLines, 3));
      const bridges = new THREE.LineSegments(bridgeGeo, materials.lineMat);
      bridges.name = 'PhaseBridges';
      fractureGroup.add(bridges);

      const dust = new THREE.Points(geometries.dustGeometry, materials.dustMat);
      dust.name = 'QuantumDust';
      dust.frustumCulled = false;
      fractureGroup.add(dust);

      quantumRoot.add(fractureGroup);

      // FIELD GROUP
      const fieldGroup = new THREE.Group();
      fieldGroup.name = 'FIELD_GROUP';

      // BrokenArcSegments (boxes in two tilted layers)
      const arcGroup = new THREE.Group();
      arcGroup.name = 'BrokenArcSegments';
      const arcLayer = (tiltX, tiltZ, offsetY) => {
        const segments = 8;
        for (let i = 0; i < segments; i++) {
          const arc = new THREE.Mesh(geometries.arcGeometry, materials.fragmentMat);
          arc.name = `ArcSeg_${tiltX}_${i}`;
          const ang = (i / segments) * Math.PI * 1.2; // not full circle
          const r = 1.25;
          arc.position.set(Math.cos(ang) * r, offsetY, Math.sin(ang) * r);
          arc.rotation.y = -ang;
          arc.rotation.x = tiltX;
          arc.rotation.z = tiltZ;
          arcGroup.add(arc);
        }
      };
      arcLayer(0.12, 0.05, 0.08);
      arcLayer(0.55, -0.35, -0.06);
      fieldGroup.add(arcGroup);

      // PhasePlanes
      const planeGroup = new THREE.Group();
      planeGroup.name = 'PhasePlanes';
      const planeCount = 3;
      for (let i = 0; i < planeCount; i++) {
        const plane = new THREE.Mesh(geometries.planeGeometry, materials.planeMat);
        plane.name = `PhasePlane_${i}`;
        plane.rotation.set(
          (rng() - 0.5) * 0.9,
          (rng() - 0.5) * 0.9,
          (rng() - 0.5) * 0.9
        );
        plane.position.set(
          (rng() - 0.5) * 0.2,
          (rng() - 0.5) * 0.25,
          (rng() - 0.5) * 0.2
        );
        plane.scale.set(0.9 + rng() * 0.2, 0.6 + rng() * 0.2, 1);
        fieldGroup.add(plane);
      }

      quantumRoot.add(fieldGroup);

      quantumRoot.userData.visualReady = true;
      group.add(quantumRoot);
      return group;
    } catch (err) {
      console.error('[QuantumV2Abort]', { reason: err?.message || err });
      return null;
    }
  }


// ===== LEGACY SIGMA ALIAS (for backward compatibility) =====
  static createSigmaNode2(group, visualCode, color) {
    try {
      const resolvedVisualCode = (typeof visualCode === 'number' && visualCode <= 4096)
        ? visualCode
        : (group?.userData?.visualCode ?? 805);
      const resolvedColor = (typeof color === 'number')
        ? color
        : ((typeof visualCode === 'number' && visualCode > 4096) ? visualCode : 0x00ffee);

      const nodeKey = group?.userData?.nodeId || group?.userData?.visualCode?.toString() || String(resolvedVisualCode || resolvedColor);
      const seedValue = hashString(nodeKey);
      const seed = Math.abs(seedValue) || 1;
      const rng = _mythicSeededRng(seed);
      const geometries = _getSigmaRuptureDiademGeometries();
      const materials = _getSigmaRuptureDiademMaterials(resolvedColor);

      const sigmaRoot = new THREE.Group();
      sigmaRoot.name = 'SIGMA_RUPTURE_DIADEM_RELIQUARY_NODE';
      sigmaRoot.userData.visualVariant = 'SIGMA_RUPTURE_DIADEM_RELIQUARY_V4';
      sigmaRoot.userData.sigmaVariant = 'RUPTURE_DIADEM_RELIQUARY';
      sigmaRoot.userData.nodeGeometryName = 'SIGMA_NODE2';

      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const sigmaCoreMat = createSigmaCollapseMaterial(seed, resolvedColor).clone();
      sigmaCoreMat.userData = {
        ...(sigmaCoreMat.userData || {}),
        wavePatchMode: 'DEFAULT'
      };
      if (sigmaCoreMat.uniforms?.uSeed) sigmaCoreMat.uniforms.uSeed.value = seed;
      if (sigmaCoreMat.uniforms?.uColor) sigmaCoreMat.uniforms.uColor.value = new THREE.Color(resolvedColor);
      if (sigmaCoreMat.uniforms?.uCollapseStrength) sigmaCoreMat.uniforms.uCollapseStrength.value = 0.5;

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const coreMesh = new THREE.Mesh(geometries.coreGeometry, sigmaCoreMat);
      coreMesh.name = 'SigmaCore';
      coreMesh.userData.isSigmaCore = true;
      coreMesh.userData.collapseUniforms = sigmaCoreMat.uniforms;
      coreMesh.userData.ignoreWaveColor = true;
      coreMesh.position.set(0.0, 0.14, 0.0);
      coreMesh.rotation.set(0.18, 0.26, -0.06);
      coreMesh.renderOrder = coreOrder;
      coreGroup.add(coreMesh);

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'SigmaCoreEdges';
      coreEdges.userData.ignoreWaveColor = true;
      coreEdges.position.copy(coreMesh.position);
      coreEdges.rotation.copy(coreMesh.rotation);
      coreEdges.renderOrder = archOrder;
      coreGroup.add(coreEdges);

      const innerSeed = new THREE.Mesh(geometries.seedGeometry, materials.seedMat);
      innerSeed.name = 'SigmaInnerSeed';
      innerSeed.userData.ignoreWaveColor = true;
      innerSeed.position.set(0.04, 0.16, -0.02);
      innerSeed.rotation.set(0.24, 0.52, -0.08);
      innerSeed.renderOrder = coreOrder;
      coreGroup.add(innerSeed);

      const ruptureSeam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      ruptureSeam.name = 'SigmaRuptureSeam';
      ruptureSeam.userData.ignoreWaveColor = true;
      ruptureSeam.position.set(-0.05, 0.12, 0.04);
      ruptureSeam.rotation.set(0.18, -0.38, 0.12);
      ruptureSeam.renderOrder = coreOrder;
      coreGroup.add(ruptureSeam);

      const shadowTwin = new THREE.Mesh(geometries.echoGeometry, materials.echoMat);
      shadowTwin.name = 'SigmaShadowTwin';
      shadowTwin.userData.ignoreWaveColor = true;
      shadowTwin.position.copy(coreMesh.position).add(new THREE.Vector3(0.18, -0.04, -0.14));
      shadowTwin.rotation.copy(coreMesh.rotation);
      shadowTwin.scale.set(0.98, 1.08, 1.02);
      shadowTwin.renderOrder = archOrder;
      coreGroup.add(shadowTwin);

      sigmaRoot.add(coreGroup);

      const crownGroup = new THREE.Group();
      crownGroup.name = 'CROWN_GROUP';
      const arcConfigs = [
        {
          name: 'RuptureDiadem_A',
          geometry: geometries.arcGeometryA,
          material: materials.arcMatA,
          pos: [0.08, 0.24, 0.02],
          rot: [Math.PI * 0.42, Math.PI * 0.08, Math.PI * 0.18],
          scale: [1.04, 0.96, 1.1],
          axis: new THREE.Vector3(0.16, 1, 0.1),
          speed: 0.11
        },
        {
          name: 'RuptureDiadem_B',
          geometry: geometries.arcGeometryB,
          material: materials.arcMatB,
          pos: [-0.14, 0.16, 0.14],
          rot: [Math.PI * 0.08, Math.PI * 0.56, -Math.PI * 0.26],
          scale: [0.96, 1.04, 0.86],
          axis: new THREE.Vector3(-0.28, 1, 0.3),
          speed: -0.14
        },
        {
          name: 'RuptureDiadem_C',
          geometry: geometries.arcGeometryC,
          material: materials.arcMatB.clone(),
          pos: [0.38, 0.32, -0.18],
          rot: [0.94, -0.18, -0.48],
          scale: [0.88, 0.82, 0.78],
          axis: new THREE.Vector3(0.4, 1, -0.16),
          speed: 0.08
        }
      ];
      arcConfigs.forEach((cfg, idx) => {
        const arc = new THREE.Mesh(cfg.geometry, cfg.material);
        arc.name = cfg.name;
        arc.userData.isOrbitRing = true;
        arc.userData.orbitAxis = cfg.axis.clone().normalize();
        arc.userData.orbitSpeed = cfg.speed;
        arc.userData.isSigmaLayer = true;
        arc.userData.ringSpeed = cfg.speed;
        arc.userData.ignoreWaveColor = true;
        arc.position.set(
          cfg.pos[0] + (rng() - 0.5) * 0.04,
          cfg.pos[1] + (rng() - 0.5) * 0.04,
          cfg.pos[2] + (rng() - 0.5) * 0.04
        );
        arc.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.06,
          cfg.rot[1] + (rng() - 0.5) * 0.08,
          cfg.rot[2] + (rng() - 0.5) * 0.08
        );
        arc.scale.set(
          cfg.scale[0] * (0.96 + rng() * 0.08),
          cfg.scale[1] * (0.96 + rng() * 0.08),
          cfg.scale[2] * (0.96 + rng() * 0.08)
        );
        arc.renderOrder = archOrder;
        crownGroup.add(arc);
      });
      sigmaRoot.userData.orbitRingCount = arcConfigs.length;
      sigmaRoot.add(crownGroup);

      const shardGroup = new THREE.Group();
      shardGroup.name = 'SHARD_GROUP';
      const shardConfigs = [
        { name: 'EntropyShard_A', pos: [0.52, 0.22, 0.1], rot: [0.42, 0.92, -0.14], scale: [0.82, 1.08, 0.78] },
        { name: 'EntropyShard_B', pos: [-0.38, 0.36, 0.18], rot: [0.88, -0.34, 0.36], scale: [0.74, 0.96, 0.7] },
        { name: 'EntropyShard_C', pos: [0.18, 0.52, -0.28], rot: [0.66, 0.18, -0.62], scale: [0.78, 1.02, 0.74] },
        { name: 'EntropyShard_D', pos: [-0.22, -0.02, -0.34], rot: [-0.26, 0.72, 0.48], scale: [0.72, 0.9, 0.68] },
        { name: 'EntropyShard_E', pos: [0.62, 0.04, -0.04], rot: [0.54, 0.24, 0.84], scale: [0.7, 0.86, 0.66] },
        { name: 'EntropyShard_F', pos: [-0.08, 0.68, 0.26], rot: [1.02, -0.12, 0.18], scale: [0.62, 0.82, 0.6] }
      ];
      shardConfigs.forEach((cfg) => {
        const shard = new THREE.Mesh(geometries.shardGeometry, materials.shardMat);
        shard.name = cfg.name;
        shard.userData.isSigmaShard = true;
        shard.userData.ignoreWaveColor = true;
        shard.position.set(
          cfg.pos[0] + (rng() - 0.5) * 0.05,
          cfg.pos[1] + (rng() - 0.5) * 0.05,
          cfg.pos[2] + (rng() - 0.5) * 0.05
        );
        shard.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.08,
          cfg.rot[1] + (rng() - 0.5) * 0.08,
          cfg.rot[2] + (rng() - 0.5) * 0.08
        );
        shard.scale.set(
          cfg.scale[0] * (0.96 + rng() * 0.08),
          cfg.scale[1] * (0.96 + rng() * 0.08),
          cfg.scale[2] * (0.96 + rng() * 0.08)
        );
        shard.renderOrder = archOrder;
        shardGroup.add(shard);

        const shardEdges = new THREE.LineSegments(geometries.shardEdgesGeometry, materials.edgeMat);
        shardEdges.name = `${cfg.name}_Edges`;
        shardEdges.userData.ignoreWaveColor = true;
        shardEdges.position.copy(shard.position);
        shardEdges.rotation.copy(shard.rotation);
        shardEdges.scale.copy(shard.scale);
        shardEdges.renderOrder = archOrder;
        shardGroup.add(shardEdges);
      });
      sigmaRoot.add(shardGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const dust = new THREE.Points(geometries.dustGeometry, materials.dustMat);
      dust.name = 'SigmaReliquaryDust';
      dust.userData.ignoreWaveColor = true;
      dust.position.set(0.02, 0.12, -0.02);
      dust.rotation.set(0.14, -0.26, 0.08);
      dust.frustumCulled = false;
      dust.renderOrder = archOrder;
      auraGroup.add(dust);

      const glow = new THREE.Mesh(geometries.glowGeometry, materials.glowMat);
      glow.name = 'SigmaReliquaryGlow';
      glow.userData.ignoreWaveColor = true;
      glow.position.copy(coreMesh.position).add(new THREE.Vector3(-0.02, 0.02, 0.0));
      glow.rotation.copy(coreMesh.rotation);
      glow.scale.set(1.42, 1.56, 1.34);
      glow.renderOrder = archOrder;
      auraGroup.add(glow);

      sigmaRoot.add(auraGroup);

      sigmaRoot.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          if (o.userData.ignoreWaveColor !== false) o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'sigma-rupture-diadem-reliquary');
        }
      });

      sigmaRoot.userData.visualReady = true;
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'SIGMA_NODE2';
      group.add(sigmaRoot);
      return group;
    } catch (err) {
      console.error('[SigmaRuptureDiademReliquaryAbort]', {
        reason: err?.message || err,
        visualCode
      });
      return null;
    }
  }

  /**
   * SIGMA v2: Minimalist harmonic cone form
   * Hierarchy:
   * SIGMA_NODE
   *   - CORE_GROUP (IcosaCore + CoreEdges)
   *   - FIELD_GROUP (SigmaRings)
   */
  static createSigmaNodeStyled_v2(group, index, color) {
    try {
      const geometries = _getSigmaV2Geometries();
      const materials = _getSigmaV2Materials(color);
      const nodeKey = group?.userData?.nodeId || group?.userData?.visualCode?.toString() || String(index || color || 0x00ffee);
      const seedValue = hashString(nodeKey);
      const seed = Math.abs(seedValue) || 1;
      const rng = _mythicSeededRng(seed);

      const sigmaRoot = new THREE.Group();
      sigmaRoot.name = 'SIGMA_NODE';
      sigmaRoot.userData.visualVariant = 'SIGMA_V2';

      // CORE GROUP
      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const deformedCoreGeometry = geometries.baseGeometry.clone();
      const posAttr = deformedCoreGeometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);
        const wave = 1 + Math.sin((x * 3.7) + (y * 5.1) + seed * 0.0001) * 0.14;
        const skewX = x * (0.92 + rng() * 0.36) + (y * 0.12);
        const skewY = y * (0.86 + rng() * 0.28) - (z * 0.16);
        const skewZ = z * (0.92 + rng() * 0.34) + (x * 0.1);
        posAttr.setXYZ(i, skewX * wave, skewY * wave, skewZ * wave);
      }
      posAttr.needsUpdate = true;
      deformedCoreGeometry.computeVertexNormals();
      deformedCoreGeometry.computeBoundingSphere();

      const deformedCoreEdges = new THREE.EdgesGeometry(deformedCoreGeometry, 12);
      const sigmaCoreMat = createSigmaCollapseMaterial(seed, color);
      const core = new THREE.Mesh(deformedCoreGeometry, sigmaCoreMat);
      core.name = 'SigmaCore';
      core.userData.isSigmaCore = true;
      core.userData.collapseUniforms = sigmaCoreMat.uniforms;
      core.rotation.set(Math.PI * 0.16, Math.PI * 0.23, -Math.PI * 0.08);
      coreGroup.add(core);

      const edges = new THREE.LineSegments(deformedCoreEdges, materials.edgeMat);
      edges.name = 'CoreEdges';
      edges.rotation.copy(core.rotation);
      coreGroup.add(edges);

      const innerCoreMat = materials.coreMat.clone();
      innerCoreMat.emissiveIntensity = 0.42;
      const innerCore = new THREE.Mesh(geometries.innerCoreGeometry, innerCoreMat);
      innerCore.name = 'SigmaInnerCore';
      innerCore.scale.set(0.82, 0.56, 0.94);
      innerCore.position.set(0.06, -0.04, 0.02);
      innerCore.rotation.set(-Math.PI * 0.24, Math.PI * 0.34, Math.PI * 0.11);
      coreGroup.add(innerCore);

      const cage = new THREE.LineSegments(geometries.cageEdgesGeometry, materials.cageMat);
      cage.name = 'SigmaCage';
      cage.rotation.set(Math.PI * 0.22, Math.PI * 0.31, Math.PI * 0.12);
      cage.scale.set(1.2, 1.05, 1.16);
      coreGroup.add(cage);

      const ruptureFrame = new THREE.Group();
      ruptureFrame.name = 'SigmaRuptureFrame';
      const frameMat = materials.cageMat.clone();
      frameMat.opacity = 0.42;
      const framePts = [
        new THREE.Vector3(-0.95, 0.55, -0.2),
        new THREE.Vector3(0.15, 1.02, 0.32),
        new THREE.Vector3(0.98, 0.18, 0.78),
        new THREE.Vector3(0.42, -0.94, 0.12),
        new THREE.Vector3(-0.82, -0.58, -0.86),
        new THREE.Vector3(-1.04, 0.18, 0.34)
      ];
      for (let i = 0; i < framePts.length; i++) {
        const next = framePts[(i + 1) % framePts.length];
        const geom = new THREE.BufferGeometry().setFromPoints([framePts[i], next]);
        const line = new THREE.Line(geom, frameMat);
        ruptureFrame.add(line);
      }
      coreGroup.add(ruptureFrame);

      const shardCount = 7;
      const shardGeo = geometries.beaconGeometry;
      for (let i = 0; i < shardCount; i++) {
        const shard = new THREE.Mesh(shardGeo, materials.beaconMat);
        const angle = (i / shardCount) * Math.PI * 2;
        const radius = 0.82 + rng() * 0.28;
        shard.name = `SigmaShard_${i}`;
        shard.position.set(
          Math.cos(angle) * radius,
          -0.28 + rng() * 0.82,
          Math.sin(angle * 1.35) * radius * 0.9
        );
        shard.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
        shard.scale.set(0.7 + rng() * 0.7, 1.2 + rng() * 0.4, 0.7 + rng() * 0.6);
        coreGroup.add(shard);
      }

      sigmaRoot.add(coreGroup);

      // FIELD GROUP (broken orbital arcs + asym crown)
      const fieldGroup = new THREE.Group();
      fieldGroup.name = 'FIELD_GROUP';

      const ringConfigs = [
        { arc: Math.PI * 1.72, radius: 0.96, tube: 0.052, rot: [Math.PI * 0.52, Math.PI * 0.08, Math.PI * 0.06], scale: [1.0, 0.9, 1.08], axis: new THREE.Vector3(0, 1, 0), speed: 0.05, pos: [0.0, 0.02, 0.0] },
        { arc: Math.PI * 1.38, radius: 0.88, tube: 0.045, rot: [Math.PI * 0.08, Math.PI * 0.5, -Math.PI * 0.22], scale: [1.1, 1.0, 0.94], axis: new THREE.Vector3(1, 0.15, 0), speed: 0.075, pos: [0.08, -0.04, 0.02] },
        { arc: Math.PI * 1.24, radius: 1.02, tube: 0.04, rot: [Math.PI * 0.24, Math.PI * 0.16, Math.PI * 0.42], scale: [1.05, 0.88, 1.1], axis: new THREE.Vector3(0.35, 1, 0.45), speed: 0.095, pos: [-0.04, 0.08, -0.06] }
      ];
      const ringCount = ringConfigs.length;
      sigmaRoot.userData.orbitRingCount = ringCount;
      for (let i = 0; i < ringCount; i++) {
        const cfg = ringConfigs[i];
        const ringGeo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 10, 56, cfg.arc);
        const ring = new THREE.Mesh(ringGeo, materials.ringMat);
        ring.name = `SigmaRing_${i}`;
        ring.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        ring.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        ring.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        ring.userData.isSigmaRing = true;
        ring.userData.isOrbitRing = true;
        ring.userData.orbitAxis = cfg.axis.clone().normalize();
        ring.userData.orbitSpeed = cfg.speed;
        ring.userData.visualCoreImmutable = true;
        fieldGroup.add(ring);
      }

      const beaconCount = 6;
      for (let i = 0; i < beaconCount; i++) {
        const beacon = new THREE.Mesh(geometries.beaconGeometry, materials.beaconMat);
        const angle = (i / beaconCount) * Math.PI * 2;
        beacon.name = `SigmaBeacon_${i}`;
        beacon.position.set(Math.cos(angle) * 1.0, (i % 2 === 0 ? 0.4 : -0.26), Math.sin(angle * 1.18) * 0.86);
        beacon.rotation.set(Math.PI * (0.12 + rng() * 0.2), angle, Math.PI * 0.12);
        beacon.scale.set(0.8, 1.35, 0.8);
        fieldGroup.add(beacon);
      }

      sigmaRoot.add(fieldGroup);

      sigmaRoot.userData.visualReady = true;
      group.add(sigmaRoot);
      return group;
    } catch (err) {
      console.error('[SigmaV2Abort]', { reason: err?.message || err });
      return null;
    }
  }

  /**
   * SIGMA: Fracture Choir Conductor (live 804 path)
   * Hierarchy:
   * SIGMA_FRACTURE_CHOIR_CONDUCTOR_NODE
   *   - CORE_GROUP (collapse core + relay seed + rupture seam + shadow echo)
   *   - CHOIR_GROUP (forked conductor ribs + response shards)
   *   - FIELD_GROUP (split signal arcs + return fragment)
   *   - AURA_GROUP (collapse dust + afterimages + glow)
   */
  static createSigmaLatticeConductor(group, visualCode, color) {
    try {
      const resolvedVisualCode = (typeof visualCode === 'number' && visualCode <= 4096)
        ? visualCode
        : (group?.userData?.visualCode ?? 804);
      const resolvedColor = (typeof color === 'number')
        ? color
        : ((typeof visualCode === 'number' && visualCode > 4096) ? visualCode : 0x00ffee);

      const nodeKey = group?.userData?.nodeId || group?.userData?.visualCode?.toString() || String(resolvedVisualCode || resolvedColor);
      const seedValue = hashString(nodeKey);
      const seed = Math.abs(seedValue) || 1;
      const rng = _mythicSeededRng(seed);
      const geometries = _getSigmaFractureChoirGeometries();
      const materials = _getSigmaFractureChoirMaterials(resolvedColor);

      const sigmaRoot = new THREE.Group();
      sigmaRoot.name = 'SIGMA_FRACTURE_CHOIR_CONDUCTOR_NODE';
      sigmaRoot.userData.visualVariant = 'SIGMA_FRACTURE_CHOIR_CONDUCTOR_V4';
      sigmaRoot.userData.sigmaVariant = 'FRACTURE_CHOIR_CONDUCTOR';
      sigmaRoot.userData.nodeGeometryName = 'SIGMA_LATTICE_CONDUCTOR';

      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const sigmaCoreMat = createSigmaCollapseMaterial(seed, resolvedColor).clone();
      sigmaCoreMat.userData = {
        ...(sigmaCoreMat.userData || {}),
        wavePatchMode: 'DEFAULT'
      };
      if (sigmaCoreMat.uniforms?.uSeed) sigmaCoreMat.uniforms.uSeed.value = seed;
      if (sigmaCoreMat.uniforms?.uColor) sigmaCoreMat.uniforms.uColor.value = new THREE.Color(resolvedColor);
      if (sigmaCoreMat.uniforms?.uCollapseStrength) sigmaCoreMat.uniforms.uCollapseStrength.value = 0.5;

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const core = new THREE.Mesh(geometries.coreGeometry, sigmaCoreMat);
      core.name = 'SigmaCore';
      core.userData.isSigmaCore = true;
      core.userData.collapseUniforms = sigmaCoreMat.uniforms;
      core.userData.ignoreWaveColor = true;
      core.position.set(0.0, 0.12, 0.0);
      core.rotation.set(0.18, 0.32, -0.08);
      core.renderOrder = coreOrder;
      coreGroup.add(core);

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'SigmaCoreEdges';
      coreEdges.userData.ignoreWaveColor = true;
      coreEdges.position.copy(core.position);
      coreEdges.rotation.copy(core.rotation);
      coreEdges.renderOrder = archOrder;
      coreGroup.add(coreEdges);

      const relaySeed = new THREE.Mesh(geometries.seedGeometry, materials.seedMat);
      relaySeed.name = 'SigmaRelaySeed';
      relaySeed.userData.ignoreWaveColor = true;
      relaySeed.position.set(0.04, 0.14, -0.02);
      relaySeed.rotation.set(0.26, 0.54, -0.1);
      relaySeed.renderOrder = coreOrder;
      coreGroup.add(relaySeed);

      const ruptureSeam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      ruptureSeam.name = 'SigmaRuptureSeam';
      ruptureSeam.userData.ignoreWaveColor = true;
      ruptureSeam.position.set(-0.06, 0.1, 0.04);
      ruptureSeam.rotation.set(0.22, -0.42, 0.12);
      ruptureSeam.renderOrder = coreOrder;
      coreGroup.add(ruptureSeam);

      const shadowEcho = new THREE.Mesh(geometries.echoGeometry, materials.echoMat);
      shadowEcho.name = 'SigmaShadowEcho';
      shadowEcho.userData.ignoreWaveColor = true;
      shadowEcho.position.copy(core.position).add(new THREE.Vector3(0.14, -0.06, -0.1));
      shadowEcho.rotation.copy(core.rotation);
      shadowEcho.scale.set(0.96, 1.08, 1.02);
      shadowEcho.renderOrder = archOrder;
      coreGroup.add(shadowEcho);

      sigmaRoot.add(coreGroup);

      const choirGroup = new THREE.Group();
      choirGroup.name = 'CHOIR_GROUP';

      const ribConfigs = [
        { name: 'ConductorRib_A', pos: [-0.4, 0.24, 0.18], rot: [0.28, 0.34, -0.56], scale: [1.02, 1.08, 0.96] },
        { name: 'ConductorRib_B', pos: [0.34, 0.06, -0.24], rot: [-0.36, -0.52, 0.48], scale: [0.9, 0.98, 0.84] },
        { name: 'ConductorRib_C', pos: [0.08, 0.54, 0.3], rot: [0.74, -0.1, 0.26], scale: [0.82, 0.92, 0.76] }
      ];
      ribConfigs.forEach((cfg) => {
        const rib = new THREE.Mesh(geometries.choirGeometry, materials.relayMat);
        rib.name = cfg.name;
        rib.userData.ignoreWaveColor = true;
        rib.position.set(
          cfg.pos[0] + (rng() - 0.5) * 0.05,
          cfg.pos[1] + (rng() - 0.5) * 0.04,
          cfg.pos[2] + (rng() - 0.5) * 0.05
        );
        rib.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.06,
          cfg.rot[1] + (rng() - 0.5) * 0.08,
          cfg.rot[2] + (rng() - 0.5) * 0.08
        );
        rib.scale.set(
          cfg.scale[0] * (0.96 + rng() * 0.08),
          cfg.scale[1] * (0.96 + rng() * 0.08),
          cfg.scale[2] * (0.96 + rng() * 0.08)
        );
        rib.renderOrder = archOrder;
        choirGroup.add(rib);

        const ribEdges = new THREE.LineSegments(geometries.choirEdgesGeometry, materials.edgeMat);
        ribEdges.name = `${cfg.name}_Edges`;
        ribEdges.userData.ignoreWaveColor = true;
        ribEdges.position.copy(rib.position);
        ribEdges.rotation.copy(rib.rotation);
        ribEdges.scale.copy(rib.scale);
        ribEdges.renderOrder = archOrder;
        choirGroup.add(ribEdges);
      });

      const responseConfigs = [
        { name: 'ResponseShard_A', pos: [0.56, 0.18, 0.06], rot: [0.46, 0.92, -0.14], scale: [0.86, 1.12, 0.82] },
        { name: 'ResponseShard_B', pos: [-0.24, 0.68, -0.18], rot: [0.98, -0.34, 0.44], scale: [0.72, 0.96, 0.68] }
      ];
      responseConfigs.forEach((cfg) => {
        const shard = new THREE.Mesh(geometries.responseGeometry, materials.responseMat);
        shard.name = cfg.name;
        shard.userData.isSigmaShard = true;
        shard.userData.ignoreWaveColor = true;
        shard.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        shard.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        shard.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        shard.renderOrder = archOrder;
        choirGroup.add(shard);

        const shardEdges = new THREE.LineSegments(geometries.responseEdgesGeometry, materials.edgeMat);
        shardEdges.name = `${cfg.name}_Edges`;
        shardEdges.userData.ignoreWaveColor = true;
        shardEdges.position.copy(shard.position);
        shardEdges.rotation.copy(shard.rotation);
        shardEdges.scale.copy(shard.scale);
        shardEdges.renderOrder = archOrder;
        choirGroup.add(shardEdges);
      });

      sigmaRoot.add(choirGroup);

      const fieldGroup = new THREE.Group();
      fieldGroup.name = 'FIELD_GROUP';

      const arcConfigs = [
        {
          name: 'SigmaSignalArc_A',
          geometry: geometries.dominantArcGeometry,
          material: materials.arcMatA,
          pos: [0.02, 0.14, -0.02],
          rot: [Math.PI * 0.52, Math.PI * 0.12, Math.PI * 0.18],
          scale: [1.04, 0.92, 1.1],
          axis: new THREE.Vector3(0.18, 1, 0.12),
          speed: 0.12
        },
        {
          name: 'SigmaSignalArc_B',
          geometry: geometries.returnArcGeometry,
          material: materials.arcMatB,
          pos: [-0.1, 0.04, 0.12],
          rot: [Math.PI * 0.08, Math.PI * 0.58, -Math.PI * 0.28],
          scale: [0.96, 1.06, 0.84],
          axis: new THREE.Vector3(-0.36, 1, 0.28),
          speed: -0.16
        }
      ];
      arcConfigs.forEach((cfg) => {
        const arc = new THREE.Mesh(cfg.geometry, cfg.material);
        arc.name = cfg.name;
        arc.userData.isOrbitRing = true;
        arc.userData.orbitAxis = cfg.axis.clone().normalize();
        arc.userData.orbitSpeed = cfg.speed;
        arc.userData.isSigmaLayer = true;
        arc.userData.ringSpeed = cfg.speed;
        arc.userData.ignoreWaveColor = true;
        arc.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        arc.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        arc.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        arc.renderOrder = archOrder;
        fieldGroup.add(arc);
      });
      sigmaRoot.userData.orbitRingCount = arcConfigs.length;

      const returnFragment = new THREE.Mesh(geometries.fragmentArcGeometry, materials.arcMatB.clone());
      returnFragment.name = 'SigmaReturnFragment';
      returnFragment.userData.ignoreWaveColor = true;
      returnFragment.position.set(0.46, -0.08, -0.18);
      returnFragment.rotation.set(1.02, -0.22, -0.56);
      returnFragment.scale.set(0.9, 0.84, 0.76);
      returnFragment.renderOrder = archOrder;
      fieldGroup.add(returnFragment);

      sigmaRoot.add(fieldGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const collapseDust = new THREE.Points(geometries.dustGeometry, materials.dustMat);
      collapseDust.name = 'SigmaCollapseDust';
      collapseDust.userData.ignoreWaveColor = true;
      collapseDust.position.set(0.02, 0.08, -0.02);
      collapseDust.rotation.set(0.12, -0.26, 0.08);
      collapseDust.frustumCulled = false;
      collapseDust.renderOrder = archOrder;
      auraGroup.add(collapseDust);

      const afterimageConfigs = [
        { name: 'AfterimageGhost_A', pos: [0.18, 0.26, -0.1], rot: [0.32, 0.74, -0.14], scale: [0.78, 1.0, 0.72] },
        { name: 'AfterimageGhost_B', pos: [-0.12, 0.46, 0.12], rot: [0.94, -0.18, 0.26], scale: [0.68, 0.9, 0.64] }
      ];
      afterimageConfigs.forEach((cfg) => {
        const ghost = new THREE.Mesh(geometries.responseGeometry, materials.echoMat);
        ghost.name = cfg.name;
        ghost.userData.ignoreWaveColor = true;
        ghost.position.set(
          cfg.pos[0] + (rng() - 0.5) * 0.04,
          cfg.pos[1] + (rng() - 0.5) * 0.04,
          cfg.pos[2] + (rng() - 0.5) * 0.04
        );
        ghost.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.08,
          cfg.rot[1] + (rng() - 0.5) * 0.08,
          cfg.rot[2] + (rng() - 0.5) * 0.08
        );
        ghost.scale.set(
          cfg.scale[0] * (0.96 + rng() * 0.08),
          cfg.scale[1] * (0.96 + rng() * 0.08),
          cfg.scale[2] * (0.96 + rng() * 0.08)
        );
        ghost.renderOrder = archOrder;
        auraGroup.add(ghost);
      });

      const glow = new THREE.Mesh(geometries.echoGeometry, materials.glowMat);
      glow.name = 'SigmaLightGlow';
      glow.userData.ignoreWaveColor = true;
      glow.position.copy(core.position).add(new THREE.Vector3(-0.02, 0.02, 0.01));
      glow.rotation.copy(core.rotation);
      glow.scale.set(1.52, 1.68, 1.44);
      glow.renderOrder = archOrder;
      auraGroup.add(glow);

      sigmaRoot.add(auraGroup);

      sigmaRoot.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          if (o.userData.ignoreWaveColor !== false) o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'sigma-fracture-choir-conductor');
        }
      });

      sigmaRoot.userData.visualReady = true;
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'SIGMA_LATTICE_CONDUCTOR';
      group.add(sigmaRoot);
      return group;
    } catch (err) {
      console.error('[SigmaFractureChoirConductorAbort]', {
        reason: err?.message || err,
        visualCode
      });
      return null;
    }
  }

  /**
   * SIGMA: Rupture Bloom Crown (live 807 path)
   * Hierarchy:
   * SIGMA_RUPTURE_BLOOM_CROWN_NODE
   *   - CORE_GROUP (collapse core + bloom seed + rupture seam + shadow echo)
   *   - CROWN_GROUP (rupture bloom vanes / crown thorns)
   *   - FIELD_GROUP (split amplifier arcs + return fragment + halo spikes)
   *   - AURA_GROUP (collapse dust + afterimages + support glow)
   */
  static createSigmaBloomCrown(group, visualCode, color) {
    try {
      const resolvedVisualCode = (typeof visualCode === 'number' && visualCode <= 4096)
        ? visualCode
        : (group?.userData?.visualCode ?? 807);
      const resolvedColor = (typeof color === 'number')
        ? color
        : ((typeof visualCode === 'number' && visualCode > 4096) ? visualCode : 0x00ffee);

      const nodeKey = group?.userData?.nodeId || group?.userData?.visualCode?.toString() || String(resolvedVisualCode || resolvedColor);
      const seedValue = hashString(nodeKey);
      const seed = Math.abs(seedValue) || 1;
      const rng = _mythicSeededRng(seed);
      const geometries = _getSigmaRuptureBloomCrownGeometries();
      const materials = _getSigmaRuptureBloomCrownMaterials(resolvedColor);

      const sigmaRoot = new THREE.Group();
      sigmaRoot.name = 'SIGMA_RUPTURE_BLOOM_CROWN_NODE';
      sigmaRoot.userData.isSigmaLayer = true;
      sigmaRoot.userData.visualVariant = 'SIGMA_RUPTURE_BLOOM_CROWN_V4';
      sigmaRoot.userData.sigmaVariant = 'RUPTURE_BLOOM_CROWN';
      sigmaRoot.userData.nodeGeometryName = 'SIGMA_BLOOM_CROWN';

      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const sigmaCoreMat = createSigmaCollapseMaterial(seed, resolvedColor).clone();
      sigmaCoreMat.userData = {
        ...(sigmaCoreMat.userData || {}),
        wavePatchMode: 'DEFAULT'
      };
      if (sigmaCoreMat.uniforms?.uSeed) sigmaCoreMat.uniforms.uSeed.value = seed;
      if (sigmaCoreMat.uniforms?.uColor) sigmaCoreMat.uniforms.uColor.value = new THREE.Color(resolvedColor);
      if (sigmaCoreMat.uniforms?.uCollapseStrength) sigmaCoreMat.uniforms.uCollapseStrength.value = 0.56;

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const core = new THREE.Mesh(geometries.coreGeometry, sigmaCoreMat);
      core.name = 'SigmaCore';
      core.userData.isSigmaCore = true;
      core.userData.collapseUniforms = sigmaCoreMat.uniforms;
      core.userData.ignoreWaveColor = true;
      core.position.set(0.0, 0.18, 0.0);
      core.rotation.set(0.22, 0.34, -0.08);
      core.renderOrder = coreOrder;
      coreGroup.add(core);

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'SigmaCoreEdges';
      coreEdges.userData.ignoreWaveColor = true;
      coreEdges.position.copy(core.position);
      coreEdges.rotation.copy(core.rotation);
      coreEdges.renderOrder = archOrder;
      coreGroup.add(coreEdges);

      const bloomSeed = new THREE.Mesh(geometries.seedGeometry, materials.seedMat);
      bloomSeed.name = 'SigmaBloomSeed';
      bloomSeed.userData.ignoreWaveColor = true;
      bloomSeed.position.set(0.04, 0.2, -0.03);
      bloomSeed.rotation.set(0.34, 0.5, -0.12);
      bloomSeed.renderOrder = coreOrder;
      coreGroup.add(bloomSeed);

      const ruptureSeam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      ruptureSeam.name = 'SigmaRuptureSeam';
      ruptureSeam.userData.ignoreWaveColor = true;
      ruptureSeam.position.set(-0.07, 0.16, 0.05);
      ruptureSeam.rotation.set(0.26, -0.44, 0.14);
      ruptureSeam.renderOrder = coreOrder;
      coreGroup.add(ruptureSeam);

      const shadowEcho = new THREE.Mesh(geometries.echoGeometry, materials.echoMat);
      shadowEcho.name = 'SigmaShadowEcho';
      shadowEcho.userData.ignoreWaveColor = true;
      shadowEcho.position.copy(core.position).add(new THREE.Vector3(0.14, 0.06, -0.12));
      shadowEcho.rotation.copy(core.rotation);
      shadowEcho.scale.set(1.02, 1.1, 1.04);
      shadowEcho.renderOrder = archOrder;
      coreGroup.add(shadowEcho);

      sigmaRoot.add(coreGroup);

      const crownGroup = new THREE.Group();
      crownGroup.name = 'CROWN_GROUP';
      const petalConfigs = [
        { name: 'BloomVane_A', material: materials.petalMatA, pos: [-0.36, 0.2, 0.18], rot: [0.42, 0.38, -0.78], scale: [1.06, 1.1, 0.96] },
        { name: 'BloomVane_B', material: materials.petalMatB, pos: [0.3, 0.12, -0.24], rot: [-0.26, -0.5, 0.48], scale: [0.94, 0.98, 0.86] },
        { name: 'BloomVane_C', material: materials.petalMatA, pos: [0.08, 0.56, 0.28], rot: [0.92, -0.08, 0.18], scale: [0.86, 1.02, 0.78] },
        { name: 'BloomVane_D', material: materials.petalMatB, pos: [-0.08, 0.42, -0.34], rot: [0.58, 0.8, -0.42], scale: [0.82, 0.9, 0.74] },
        { name: 'BloomVane_E', material: materials.petalMatA, pos: [0.48, 0.28, 0.08], rot: [0.14, -0.96, 0.34], scale: [0.76, 0.84, 0.68] },
        { name: 'BloomVane_F', material: materials.petalMatB, pos: [-0.28, 0.62, 0.06], rot: [1.04, 0.2, 0.56], scale: [0.72, 0.88, 0.64] }
      ];
      petalConfigs.forEach((cfg) => {
        const petal = new THREE.Mesh(geometries.petalGeometry, cfg.material);
        petal.name = cfg.name;
        petal.userData.ignoreWaveColor = true;
        petal.position.set(
          cfg.pos[0] + (rng() - 0.5) * 0.05,
          cfg.pos[1] + (rng() - 0.5) * 0.04,
          cfg.pos[2] + (rng() - 0.5) * 0.05
        );
        petal.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.08,
          cfg.rot[1] + (rng() - 0.5) * 0.1,
          cfg.rot[2] + (rng() - 0.5) * 0.08
        );
        petal.scale.set(
          cfg.scale[0] * (0.96 + rng() * 0.08),
          cfg.scale[1] * (0.96 + rng() * 0.08),
          cfg.scale[2] * (0.96 + rng() * 0.08)
        );
        petal.renderOrder = archOrder;
        crownGroup.add(petal);

        const petalEdges = new THREE.LineSegments(geometries.petalEdgesGeometry, materials.edgeMat);
        petalEdges.name = `${cfg.name}_Edges`;
        petalEdges.userData.ignoreWaveColor = true;
        petalEdges.position.copy(petal.position);
        petalEdges.rotation.copy(petal.rotation);
        petalEdges.scale.copy(petal.scale);
        petalEdges.renderOrder = archOrder;
        crownGroup.add(petalEdges);
      });
      sigmaRoot.add(crownGroup);

      const fieldGroup = new THREE.Group();
      fieldGroup.name = 'FIELD_GROUP';

      const arcConfigs = [
        {
          name: 'SigmaAmplifierArc_A',
          geometry: geometries.dominantArcGeometry,
          material: materials.arcMatA,
          pos: [0.02, 0.24, -0.02],
          rot: [Math.PI * 0.48, Math.PI * 0.12, Math.PI * 0.16],
          scale: [1.08, 0.92, 1.14],
          axis: new THREE.Vector3(0.14, 1, 0.08),
          speed: 0.13
        },
        {
          name: 'SigmaAmplifierArc_B',
          geometry: geometries.counterArcGeometry,
          material: materials.arcMatB,
          pos: [-0.1, 0.16, 0.12],
          rot: [Math.PI * 0.08, Math.PI * 0.56, -Math.PI * 0.22],
          scale: [0.94, 1.08, 0.88],
          axis: new THREE.Vector3(-0.26, 1, 0.24),
          speed: -0.17
        }
      ];
      arcConfigs.forEach((cfg) => {
        const arc = new THREE.Mesh(cfg.geometry, cfg.material);
        arc.name = cfg.name;
        arc.userData.isOrbitRing = true;
        arc.userData.orbitAxis = cfg.axis.clone().normalize();
        arc.userData.orbitSpeed = cfg.speed;
        arc.userData.isSigmaLayer = true;
        arc.userData.ringSpeed = cfg.speed;
        arc.userData.ignoreWaveColor = true;
        arc.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        arc.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        arc.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        arc.renderOrder = archOrder;
        fieldGroup.add(arc);
      });
      sigmaRoot.userData.orbitRingCount = arcConfigs.length;

      const returnFragment = new THREE.Mesh(geometries.fragmentArcGeometry, materials.arcMatB.clone());
      returnFragment.name = 'SigmaReturnFragment';
      returnFragment.userData.ignoreWaveColor = true;
      returnFragment.position.set(0.46, 0.1, -0.18);
      returnFragment.rotation.set(0.98, -0.24, -0.54);
      returnFragment.scale.set(0.9, 0.82, 0.78);
      returnFragment.renderOrder = archOrder;
      fieldGroup.add(returnFragment);

      const spikeConfigs = [
        { name: 'HaloSpike_A', pos: [0.18, 0.84, 0.06], rot: [0.16, 0.18, -0.3], scale: [0.92, 1.12, 0.9] },
        { name: 'HaloSpike_B', pos: [-0.34, 0.74, 0.28], rot: [0.52, -0.58, 0.22], scale: [0.82, 1.0, 0.82] },
        { name: 'HaloSpike_C', pos: [0.44, 0.62, -0.22], rot: [-0.14, 0.84, -0.2], scale: [0.74, 0.88, 0.76] },
        { name: 'HaloSpike_D', pos: [-0.04, 0.98, -0.32], rot: [0.72, 0.24, 0.18], scale: [0.7, 1.06, 0.72] }
      ];
      spikeConfigs.forEach((cfg) => {
        const spike = new THREE.Mesh(geometries.spikeGeometry, materials.spikeMat);
        spike.name = cfg.name;
        spike.userData.ignoreWaveColor = true;
        spike.position.set(
          cfg.pos[0] + (rng() - 0.5) * 0.04,
          cfg.pos[1] + (rng() - 0.5) * 0.05,
          cfg.pos[2] + (rng() - 0.5) * 0.04
        );
        spike.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.08,
          cfg.rot[1] + (rng() - 0.5) * 0.08,
          cfg.rot[2] + (rng() - 0.5) * 0.08
        );
        spike.scale.set(
          cfg.scale[0] * (0.96 + rng() * 0.08),
          cfg.scale[1] * (0.96 + rng() * 0.08),
          cfg.scale[2] * (0.96 + rng() * 0.08)
        );
        spike.renderOrder = archOrder;
        fieldGroup.add(spike);
      });

      sigmaRoot.add(fieldGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const collapseDust = new THREE.Points(geometries.dustGeometry, materials.dustMat);
      collapseDust.name = 'SigmaCollapseDust';
      collapseDust.userData.ignoreWaveColor = true;
      collapseDust.position.set(0.02, 0.14, -0.02);
      collapseDust.rotation.set(0.14, -0.24, 0.08);
      collapseDust.frustumCulled = false;
      collapseDust.renderOrder = archOrder;
      auraGroup.add(collapseDust);

      const ghostA = new THREE.Mesh(geometries.echoGeometry, materials.echoMat);
      ghostA.name = 'AfterimageGhost_A';
      ghostA.userData.ignoreWaveColor = true;
      ghostA.position.set(0.22, 0.36, -0.12);
      ghostA.rotation.set(0.32, 0.84, -0.12);
      ghostA.scale.set(0.74, 0.88, 0.78);
      ghostA.renderOrder = archOrder;
      auraGroup.add(ghostA);

      const ghostB = new THREE.Mesh(geometries.petalGeometry, materials.echoMat);
      ghostB.name = 'AfterimageGhost_B';
      ghostB.userData.isSigmaShard = true;
      ghostB.userData.ignoreWaveColor = true;
      ghostB.position.set(-0.22, 0.52, 0.14);
      ghostB.rotation.set(0.86, -0.22, 0.34);
      ghostB.scale.set(0.48, 0.62, 0.42);
      ghostB.renderOrder = archOrder;
      auraGroup.add(ghostB);

      const glow = new THREE.Mesh(geometries.glowGeometry, materials.glowMat);
      glow.name = 'SigmaSupportGlow';
      glow.userData.ignoreWaveColor = true;
      glow.position.copy(core.position).add(new THREE.Vector3(-0.02, 0.04, 0.0));
      glow.rotation.copy(core.rotation);
      glow.scale.set(1.0, 1.04, 1.0);
      glow.renderOrder = archOrder;
      auraGroup.add(glow);

      sigmaRoot.add(auraGroup);

      sigmaRoot.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          if (o.userData.ignoreWaveColor !== false) o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'sigma-rupture-bloom-crown');
        }
      });

      sigmaRoot.userData.visualReady = true;
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'SIGMA_BLOOM_CROWN';
      group.add(sigmaRoot);
      return group;
    } catch (err) {
      console.error('[SigmaRuptureBloomCrownAbort]', {
        reason: err?.message || err,
        visualCode
      });
      return null;
    }
  }

  // ===== QUANTUM CUSTOM VARIANTS (registry 701-703) =====

  /**
   * QUANTUM: Probability Bloom Amplifier (live 701 path)
   * Hierarchy:
   * QUANTUM_PROBABILITY_BLOOM_NODE
   *   - CORE_GROUP (primary core + inner state + ghost echoes + edge cage)
   *   - BLOOM_GROUP (signal sails / bloom petals)
   *   - AMPLIFIER_GROUP (broken broadcast arcs + resonance frame + signal shards)
   *   - AURA_GROUP (interference dust + halo points + hologram shells + edge glow)
   */
  static createQuantumBloomNode(group, visualCode, color) {
    try {
      const resolvedVisualCode = (typeof visualCode === 'number' && visualCode <= 4096)
        ? visualCode
        : (group?.userData?.visualCode ?? 701);
      const resolvedColor = (typeof color === 'number')
        ? color
        : ((typeof visualCode === 'number' && visualCode > 4096) ? visualCode : 0x69e8ff);

      const nodeKey = group?.userData?.nodeId || group?.userData?.visualCode?.toString() || String(resolvedVisualCode || resolvedColor);
      const seed = Math.abs(hashString(nodeKey)) || 701;
      const rng = _mythicSeededRng(seed);
      const geometries = _getQuantumProbabilityBloomGeometries();
      const materials = _getQuantumProbabilityBloomMaterials(resolvedColor);

      const quantumRoot = new THREE.Group();
      quantumRoot.name = 'QUANTUM_PROBABILITY_BLOOM_NODE';
      quantumRoot.userData.visualVariant = 'QUANTUM_PROBABILITY_BLOOM_AMPLIFIER_V4';
      quantumRoot.userData.quantumVariant = 'PROBABILITY_BLOOM_AMPLIFIER';
      quantumRoot.userData.nodeGeometryName = 'QUANTUM_BLOOM';

      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const core = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      core.name = 'PrimaryBloomCore';
      core.userData.isCore = true;
      core.userData.ignoreWaveColor = true;
      core.position.set(0.0, 0.16, 0.0);
      core.rotation.set(-0.12, 0.24, 0.08);
      core.scale.set(1.0, 1.02, 1.08);
      core.renderOrder = coreOrder;
      coreGroup.add(core);

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'PrimaryBloomCoreEdges';
      coreEdges.userData.ignoreWaveColor = true;
      coreEdges.position.copy(core.position);
      coreEdges.rotation.copy(core.rotation);
      coreEdges.scale.copy(core.scale);
      coreEdges.renderOrder = archOrder;
      coreGroup.add(coreEdges);

      const innerState = new THREE.Mesh(geometries.innerStateGeometry, materials.innerStateMat);
      innerState.name = 'InnerBloomState';
      innerState.userData.ignoreWaveColor = true;
      innerState.position.set(0.04, 0.18, -0.02);
      innerState.rotation.set(0.26, 0.42, -0.08);
      innerState.scale.set(0.88, 1.0, 0.8);
      innerState.renderOrder = coreOrder;
      coreGroup.add(innerState);

      const innerEdges = new THREE.LineSegments(geometries.innerStateEdgesGeometry, materials.edgeMat);
      innerEdges.name = 'InnerBloomStateEdges';
      innerEdges.userData.ignoreWaveColor = true;
      innerEdges.position.copy(innerState.position);
      innerEdges.rotation.copy(innerState.rotation);
      innerEdges.scale.copy(innerState.scale);
      innerEdges.renderOrder = archOrder;
      coreGroup.add(innerEdges);

      const ghostA = new THREE.Mesh(geometries.ghostGeometry, materials.ghostMatA);
      ghostA.name = 'GhostState_A';
      ghostA.userData.ignoreWaveColor = true;
      ghostA.position.copy(core.position).add(new THREE.Vector3(0.12, 0.04, -0.08));
      ghostA.rotation.copy(core.rotation);
      ghostA.scale.copy(core.scale).multiplyScalar(1.02);
      ghostA.renderOrder = archOrder;
      coreGroup.add(ghostA);

      const ghostB = new THREE.Mesh(geometries.ghostGeometry, materials.ghostMatB);
      ghostB.name = 'GhostState_B';
      ghostB.userData.ignoreWaveColor = true;
      ghostB.position.copy(core.position).add(new THREE.Vector3(-0.08, 0.08, 0.1));
      ghostB.rotation.copy(core.rotation);
      ghostB.scale.copy(core.scale).multiplyScalar(0.98);
      ghostB.renderOrder = archOrder;
      coreGroup.add(ghostB);

      const cage = new THREE.LineSegments(geometries.cageEdgesGeometry, materials.cageMat);
      cage.name = 'ProbabilityCage';
      cage.userData.ignoreWaveColor = true;
      cage.position.copy(core.position);
      cage.rotation.copy(core.rotation);
      cage.renderOrder = archOrder;
      coreGroup.add(cage);

      quantumRoot.add(coreGroup);

      const bloomGroup = new THREE.Group();
      bloomGroup.name = 'BLOOM_GROUP';
      const sailConfigs = [
        { name: 'BloomSail_A', material: materials.sailMatA, pos: [-0.34, 0.12, 0.18], rot: [0.22, 0.38, -0.78], scale: [1.0, 1.08, 0.92] },
        { name: 'BloomSail_B', material: materials.sailMatB, pos: [0.42, 0.18, -0.12], rot: [-0.18, -0.56, 0.62], scale: [0.92, 1.0, 0.84] },
        { name: 'BloomSail_C', material: materials.sailMatA, pos: [0.12, 0.54, 0.24], rot: [0.94, -0.06, 0.18], scale: [0.84, 1.02, 0.76] },
        { name: 'BloomSail_D', material: materials.sailMatB, pos: [-0.12, 0.34, -0.3], rot: [0.58, 0.72, -0.44], scale: [0.8, 0.9, 0.7] },
        { name: 'BloomSail_E', material: materials.sailMatA, pos: [0.56, 0.3, 0.08], rot: [0.04, -0.94, 0.28], scale: [0.72, 0.82, 0.64] }
      ];
      sailConfigs.forEach((cfg) => {
        const sail = new THREE.Mesh(geometries.sailGeometry, cfg.material);
        sail.name = cfg.name;
        sail.userData.ignoreWaveColor = true;
        sail.position.set(
          cfg.pos[0] + (rng() - 0.5) * 0.05,
          cfg.pos[1] + (rng() - 0.5) * 0.04,
          cfg.pos[2] + (rng() - 0.5) * 0.05
        );
        sail.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.08,
          cfg.rot[1] + (rng() - 0.5) * 0.1,
          cfg.rot[2] + (rng() - 0.5) * 0.08
        );
        sail.scale.set(
          cfg.scale[0] * (0.96 + rng() * 0.08),
          cfg.scale[1] * (0.96 + rng() * 0.08),
          cfg.scale[2] * (0.96 + rng() * 0.08)
        );
        sail.renderOrder = archOrder;
        bloomGroup.add(sail);

        const sailEdges = new THREE.LineSegments(geometries.sailEdgesGeometry, materials.edgeMat);
        sailEdges.name = `${cfg.name}_Edges`;
        sailEdges.userData.ignoreWaveColor = true;
        sailEdges.position.copy(sail.position);
        sailEdges.rotation.copy(sail.rotation);
        sailEdges.scale.copy(sail.scale);
        sailEdges.renderOrder = archOrder;
        bloomGroup.add(sailEdges);
      });
      quantumRoot.add(bloomGroup);

      const amplifierGroup = new THREE.Group();
      amplifierGroup.name = 'AMPLIFIER_GROUP';

      const arcA = new THREE.Mesh(geometries.dominantArcGeometry, materials.arcMatA);
      arcA.name = 'BroadcastArc_A';
      arcA.userData.ignoreWaveColor = true;
      arcA.position.set(0.02, 0.18, -0.02);
      arcA.rotation.set(Math.PI * 0.46, Math.PI * 0.08, Math.PI * 0.14);
      arcA.scale.set(1.06, 0.94, 1.12);
      arcA.renderOrder = archOrder;
      amplifierGroup.add(arcA);

      const arcB = new THREE.Mesh(geometries.counterArcGeometry, materials.arcMatB);
      arcB.name = 'BroadcastArc_B';
      arcB.userData.ignoreWaveColor = true;
      arcB.position.set(-0.08, 0.06, 0.12);
      arcB.rotation.set(Math.PI * 0.08, Math.PI * 0.56, -Math.PI * 0.22);
      arcB.scale.set(0.94, 1.08, 0.86);
      arcB.renderOrder = archOrder;
      amplifierGroup.add(arcB);

      const resonanceFrame = new THREE.LineSegments(geometries.frameEdgesGeometry, materials.frameMat);
      resonanceFrame.name = 'ResonanceFrame';
      resonanceFrame.userData.ignoreWaveColor = true;
      resonanceFrame.position.set(0.14, 0.22, -0.08);
      resonanceFrame.rotation.set(0.18, -0.34, 0.26);
      resonanceFrame.scale.set(1.02, 0.92, 1.08);
      resonanceFrame.renderOrder = archOrder;
      amplifierGroup.add(resonanceFrame);

      const shardConfigs = [
        { name: 'SignalShard_A', pos: [0.64, 0.22, 0.12], rot: [0.42, 0.94, -0.12], scale: [0.86, 1.06, 0.78] },
        { name: 'SignalShard_B', pos: [-0.34, 0.58, 0.18], rot: [0.92, -0.28, 0.36], scale: [0.72, 0.94, 0.68] },
        { name: 'SignalShard_C', pos: [0.18, 0.72, -0.26], rot: [0.64, 0.14, -0.6], scale: [0.78, 1.0, 0.72] },
        { name: 'SignalShard_D', pos: [0.52, 0.04, -0.18], rot: [-0.18, 0.72, 0.44], scale: [0.68, 0.86, 0.64] }
      ];
      shardConfigs.forEach((cfg) => {
        const shard = new THREE.Mesh(geometries.shardGeometry, materials.shardMat);
        shard.name = cfg.name;
        shard.userData.ignoreWaveColor = true;
        shard.position.set(
          cfg.pos[0] + (rng() - 0.5) * 0.05,
          cfg.pos[1] + (rng() - 0.5) * 0.05,
          cfg.pos[2] + (rng() - 0.5) * 0.05
        );
        shard.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.08,
          cfg.rot[1] + (rng() - 0.5) * 0.08,
          cfg.rot[2] + (rng() - 0.5) * 0.08
        );
        shard.scale.set(
          cfg.scale[0] * (0.96 + rng() * 0.08),
          cfg.scale[1] * (0.96 + rng() * 0.08),
          cfg.scale[2] * (0.96 + rng() * 0.08)
        );
        shard.renderOrder = archOrder;
        amplifierGroup.add(shard);

        const shardEdges = new THREE.LineSegments(geometries.shardEdgesGeometry, materials.edgeMat);
        shardEdges.name = `${cfg.name}_Edges`;
        shardEdges.userData.ignoreWaveColor = true;
        shardEdges.position.copy(shard.position);
        shardEdges.rotation.copy(shard.rotation);
        shardEdges.scale.copy(shard.scale);
        shardEdges.renderOrder = archOrder;
        amplifierGroup.add(shardEdges);
      });

      quantumRoot.add(amplifierGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const dust = new THREE.Points(geometries.dustGeometry, materials.dustMat);
      dust.name = 'InterferenceDust';
      dust.userData.ignoreWaveColor = true;
      dust.position.set(0.02, 0.1, -0.02);
      dust.rotation.set(0.16, 0.74, -0.12);
      dust.frustumCulled = false;
      dust.renderOrder = archOrder;
      auraGroup.add(dust);

      const haloPoints = new THREE.Points(geometries.haloGeometry, materials.haloMat);
      haloPoints.name = 'HaloPoints';
      haloPoints.userData.ignoreWaveColor = true;
      haloPoints.position.set(0.0, 0.16, 0.0);
      haloPoints.rotation.set(0.12, 0.52, -0.18);
      haloPoints.frustumCulled = false;
      haloPoints.renderOrder = archOrder;
      auraGroup.add(haloPoints);

      const shellColor = 0xf4fbff;
      const shell1 = createNodeHologramShell(core, shellColor);
      if (shell1) {
        shell1.name = 'QuantumShell_1';
        shell1.position.copy(core.position);
        shell1.quaternion.copy(core.quaternion);
        shell1.scale.copy(core.scale).multiplyScalar(1.14);
        shell1.frustumCulled = false;
        shell1.renderOrder = archOrder;
        if (shell1.material?.uniforms?.uOpacity) shell1.material.uniforms.uOpacity.value = 0.056;
        auraGroup.add(shell1);
      }

      const shell2 = createNodeHologramShell(core, shellColor);
      if (shell2) {
        shell2.name = 'QuantumShell_2';
        shell2.position.copy(core.position);
        shell2.quaternion.copy(core.quaternion);
        shell2.scale.copy(core.scale).multiplyScalar(1.26);
        shell2.frustumCulled = false;
        shell2.renderOrder = archOrder;
        if (shell2.material?.uniforms?.uOpacity) shell2.material.uniforms.uOpacity.value = 0.034;
        auraGroup.add(shell2);
      }

      const edgeGlow = createNodeNeonEdgeGlowShell(core, 0x97efff, {
        glowIntensity: 0.84,
        edgeWidth: 0.07,
        pulseAmount: 0.0
      });
      if (edgeGlow) {
        edgeGlow.name = 'QuantumEdgeGlow';
        edgeGlow.position.copy(core.position);
        edgeGlow.quaternion.copy(core.quaternion);
        edgeGlow.scale.copy(core.scale).multiplyScalar(1.02);
        edgeGlow.frustumCulled = false;
        edgeGlow.renderOrder = archOrder;
        auraGroup.add(edgeGlow);
      }

      quantumRoot.add(auraGroup);

      quantumRoot.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          if (o.userData.ignoreWaveColor !== false) o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'quantum-probability-bloom');
        }
      });

      quantumRoot.userData.visualReady = true;
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'QUANTUM_BLOOM';
      group.add(quantumRoot);
      return group;
    } catch (err) {
      console.error('[QuantumProbabilityBloomAbort]', {
        reason: err?.message || err,
        visualCode
      });
      return null;
    }
  }

  /**
   * QUANTUM: Impossible Entanglement Manifest
   * Hierarchy:
   * QUANTUM_LATTICE_NODE
   *   - VOID_GROUP (VoidCore + VoidSeed + GhostStates + CoreEdges)
   *   - LATTICE_GROUP (BrokenBridges + OffsetNodes + FrameLines)
   *   - FIELD_GROUP (PhasePlanes + Shards + QuantumDust)
   *   - AURA_GROUP (HaloPoints + HologramShells + EdgeGlow)
   */
  static createQuantumLattice(group, visualCode, color) {
    try {
      const hostGroup = group || new THREE.Group();
      hostGroup.userData = hostGroup.userData || {};
      hostGroup.userData.nodeGeometryName = 'QUANTUM_LATTICE_IMPOSSIBLE_MANIFEST';
      hostGroup.userData.visualVariant = 'QUANTUM_IMPOSSIBLE_ENTANGLEMENT_MANIFEST_V1';
      hostGroup.userData.skipMaterialRestoration = true;
      hostGroup.userData.visualCode = visualCode;

      const geometries = _getQuantumLatticeGeometries();
      const materials = _getQuantumLatticeMaterials(color);
      const quantumRoot = new THREE.Group();
      quantumRoot.name = 'QUANTUM_LATTICE_NODE';
      quantumRoot.userData.visualVariant = 'QUANTUM_IMPOSSIBLE_ENTANGLEMENT_MANIFEST_V1';
      quantumRoot.userData.nodeGeometryName = 'QUANTUM_LATTICE_IMPOSSIBLE_MANIFEST';
      quantumRoot.userData.skipMaterialRestoration = true;

      const seed = hostGroup?.userData?.nodeId ? hashString(hostGroup.userData.nodeId) : (Number.isFinite(visualCode) ? visualCode : 702);
      const rng = _mythicSeededRng(seed);
      const scratch = new THREE.Object3D();
      const xAxis = new THREE.Vector3(1, 0, 0);
      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'VOID_GROUP';

      const voidCore = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      voidCore.name = 'VoidCore';
      voidCore.userData.ignoreWaveColor = true;
      voidCore.position.set(0.02, 0.06, -0.02);
      voidCore.rotation.set(-0.16, 0.24, 0.08);
      voidCore.scale.set(1.0, 1.08, 0.92);
      voidCore.renderOrder = coreOrder;
      coreGroup.add(voidCore);

      const voidSeed = new THREE.Mesh(geometries.voidSeedGeometry, materials.voidMat);
      voidSeed.name = 'VoidSeed';
      voidSeed.userData.ignoreWaveColor = true;
      voidSeed.position.set(-0.04, 0.02, 0.05);
      voidSeed.rotation.set(0.18, -0.08, 0.22);
      voidSeed.scale.set(0.84, 1.0, 0.88);
      voidSeed.renderOrder = coreOrder;
      coreGroup.add(voidSeed);

      const voidSeedEdges = new THREE.LineSegments(geometries.voidSeedEdgesGeometry, materials.lineMat);
      voidSeedEdges.name = 'VoidSeedEdges';
      voidSeedEdges.userData.ignoreWaveColor = true;
      voidSeedEdges.position.copy(voidSeed.position);
      voidSeedEdges.rotation.copy(voidSeed.rotation);
      voidSeedEdges.scale.copy(voidSeed.scale);
      voidSeedEdges.renderOrder = archOrder;
      coreGroup.add(voidSeedEdges);

      const ghostA = new THREE.Mesh(geometries.ghostGeometry, materials.ghostMatA);
      ghostA.name = 'GhostState_A';
      ghostA.userData.ignoreWaveColor = true;
      ghostA.position.set(0.1, 0.04, -0.04);
      ghostA.rotation.set(0.08, 0.62, -0.18);
      ghostA.scale.set(1.12, 1.0, 0.94);
      ghostA.renderOrder = archOrder;
      coreGroup.add(ghostA);

      const ghostB = new THREE.Mesh(geometries.ghostGeometry, materials.ghostMatB);
      ghostB.name = 'GhostState_B';
      ghostB.userData.ignoreWaveColor = true;
      ghostB.position.set(-0.08, 0.09, 0.06);
      ghostB.rotation.set(Math.PI * 0.48, -0.24, 0.12);
      ghostB.scale.set(0.98, 1.08, 1.02);
      ghostB.renderOrder = archOrder;
      coreGroup.add(ghostB);

      const ghostOutline = new THREE.LineSegments(geometries.ghostEdgesGeometry, materials.lineMat);
      ghostOutline.name = 'GhostState_Outline';
      ghostOutline.userData.ignoreWaveColor = true;
      ghostOutline.position.copy(ghostB.position);
      ghostOutline.rotation.copy(ghostB.rotation);
      ghostOutline.scale.copy(ghostB.scale);
      ghostOutline.renderOrder = archOrder;
      coreGroup.add(ghostOutline);

      const ghostC = new THREE.Mesh(geometries.ghostGeometry, materials.ghostMatC);
      ghostC.name = 'GhostState_C';
      ghostC.userData.ignoreWaveColor = true;
      ghostC.position.set(0.02, -0.07, 0.08);
      ghostC.rotation.set(-0.28, 0.18, 0.54);
      ghostC.scale.set(1.18, 0.96, 0.88);
      ghostC.renderOrder = archOrder;
      coreGroup.add(ghostC);

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'VoidCoreEdges';
      coreEdges.userData.ignoreWaveColor = true;
      coreEdges.position.copy(voidCore.position);
      coreEdges.rotation.copy(voidCore.rotation);
      coreEdges.scale.copy(voidCore.scale);
      coreEdges.renderOrder = archOrder;
      coreGroup.add(coreEdges);

      quantumRoot.add(coreGroup);

      const latticeGroup = new THREE.Group();
      latticeGroup.name = 'LATTICE_GROUP';

      const makeBridge = (name, start, end, thickness = 0.05) => {
        const bridgeGroup = new THREE.Group();
        bridgeGroup.name = name;
        bridgeGroup.position.copy(start).add(end).multiplyScalar(0.5);
        const dir = end.clone().sub(start);
        const length = Math.max(0.001, dir.length());
        bridgeGroup.quaternion.setFromUnitVectors(xAxis, dir.clone().normalize());
        bridgeGroup.scale.set(length, thickness, thickness);

        const bridgeMesh = new THREE.Mesh(geometries.bridgeGeometry, materials.bridgeMat);
        bridgeMesh.name = `${name}_Mesh`;
        bridgeMesh.userData.ignoreWaveColor = true;
        bridgeMesh.renderOrder = archOrder;
        bridgeGroup.add(bridgeMesh);

        const bridgeEdges = new THREE.LineSegments(geometries.bridgeEdgesGeometry, materials.edgeMat);
        bridgeEdges.name = `${name}_Edges`;
        bridgeEdges.userData.ignoreWaveColor = true;
        bridgeEdges.renderOrder = archOrder;
        bridgeGroup.add(bridgeEdges);

        latticeGroup.add(bridgeGroup);
        return { start, end };
      };

      const jitter = () => (rng() - 0.5) * 0.1;
      const anchorA = new THREE.Vector3(-0.74 + jitter(), 0.16 + jitter(), -0.12 + jitter());
      const anchorB = new THREE.Vector3(-0.18 + jitter(), 0.5 + jitter(), 0.18 + jitter());
      const anchorC = new THREE.Vector3(0.42 + jitter(), 0.26 + jitter(), -0.2 + jitter());
      const anchorD = new THREE.Vector3(0.68 + jitter(), -0.08 + jitter(), 0.14 + jitter());
      const anchorE = new THREE.Vector3(-0.26 + jitter(), -0.12 + jitter(), 0.42 + jitter());

      makeBridge('BrokenBridge_A', anchorA, anchorB, 0.048);
      makeBridge('BrokenBridge_B', anchorB, anchorC, 0.052);
      makeBridge('BrokenBridge_C', anchorC, anchorD, 0.044);
      makeBridge('BrokenBridge_D', anchorA.clone().add(new THREE.Vector3(0.12, 0.06, 0.08)), anchorE, 0.04);

      const addNode = (name, position, scale = 1.0, material = materials.nodeMat, rotation = new THREE.Euler()) => {
        const nodeMesh = new THREE.Mesh(geometries.nodeGeometry, material);
        nodeMesh.name = name;
        nodeMesh.userData.ignoreWaveColor = true;
        nodeMesh.position.copy(position);
        nodeMesh.rotation.copy(rotation);
        nodeMesh.scale.setScalar(scale);
        nodeMesh.renderOrder = archOrder;
        latticeGroup.add(nodeMesh);

        const nodeEdges = new THREE.LineSegments(geometries.nodeEdgesGeometry, materials.edgeMat);
        nodeEdges.name = `${name}_Edges`;
        nodeEdges.userData.ignoreWaveColor = true;
        nodeEdges.position.copy(position);
        nodeEdges.rotation.copy(rotation);
        nodeEdges.scale.setScalar(scale);
        nodeEdges.renderOrder = archOrder;
        latticeGroup.add(nodeEdges);
        return nodeMesh;
      };

      addNode('OffsetNode_A', anchorA.clone().add(new THREE.Vector3(-0.03, 0.04, 0.02)), 0.92, materials.ghostMatC, new THREE.Euler(0.2, 0.6, -0.14));
      addNode('OffsetNode_B', anchorB.clone().add(new THREE.Vector3(0.04, -0.03, 0.02)), 1.0, materials.nodeMat, new THREE.Euler(-0.26, 0.14, 0.28));
      addNode('OffsetNode_C', anchorC.clone().add(new THREE.Vector3(-0.01, 0.03, -0.02)), 0.86, materials.ghostMatB, new THREE.Euler(0.14, -0.4, 0.5));
      addNode('OffsetNode_D', anchorD.clone().add(new THREE.Vector3(-0.02, 0.02, -0.02)), 0.94, materials.nodeMat, new THREE.Euler(-0.12, 0.32, -0.24));

      const frameSegments = [];
      const addSegment = (a, b) => {
        frameSegments.push(a.clone(), b.clone());
      };
      addSegment(anchorA, anchorB);
      addSegment(anchorB, anchorC);
      addSegment(anchorC, anchorD);
      addSegment(anchorB.clone().add(new THREE.Vector3(0.06, -0.06, 0.08)), anchorE);
      addSegment(anchorD, anchorE.clone().add(new THREE.Vector3(0.1, 0.03, -0.04)));
      const frameGeometry = new THREE.BufferGeometry().setFromPoints(frameSegments);
      const frameLines = new THREE.LineSegments(frameGeometry, materials.lineMat);
      frameLines.name = 'FrameLines';
      frameLines.userData.ignoreWaveColor = true;
      frameLines.renderOrder = archOrder;
      latticeGroup.add(frameLines);

      latticeGroup.rotation.set(0.08, -0.2, 0.38);
      quantumRoot.add(latticeGroup);

      const fieldGroup = new THREE.Group();
      fieldGroup.name = 'FIELD_GROUP';

      const phasePlaneA = new THREE.Mesh(geometries.planeGeometry, materials.planeMat);
      phasePlaneA.name = 'PhasePlane_A';
      phasePlaneA.userData.ignoreWaveColor = true;
      phasePlaneA.position.set(-0.14, 0.12, 0.04);
      phasePlaneA.rotation.set(1.08, 0.16, 0.34);
      phasePlaneA.scale.set(1.2, 0.92, 1);
      phasePlaneA.renderOrder = archOrder;
      fieldGroup.add(phasePlaneA);

      const phasePlaneB = new THREE.Mesh(geometries.planeGeometry, materials.planeFringeMat);
      phasePlaneB.name = 'PhasePlane_B';
      phasePlaneB.userData.ignoreWaveColor = true;
      phasePlaneB.position.set(0.12, -0.1, -0.16);
      phasePlaneB.rotation.set(0.62, 1.08, 0.18);
      phasePlaneB.scale.set(0.92, 1.18, 1);
      phasePlaneB.renderOrder = archOrder;
      fieldGroup.add(phasePlaneB);

      const phasePlaneC = new THREE.Mesh(geometries.planeGeometry, materials.planeMat);
      phasePlaneC.name = 'PhasePlane_C';
      phasePlaneC.userData.ignoreWaveColor = true;
      phasePlaneC.position.set(0.02, 0.26, -0.08);
      phasePlaneC.rotation.set(1.42, -0.28, 0.06);
      phasePlaneC.scale.set(0.82, 0.74, 1);
      phasePlaneC.renderOrder = archOrder;
      fieldGroup.add(phasePlaneC);

      const shards = new THREE.InstancedMesh(geometries.shardGeometry, materials.shardMat, 9);
      shards.name = 'QuantumShards';
      shards.userData.ignoreWaveColor = true;
      const up = new THREE.Vector3(0, 1, 0);
      for (let i = 0; i < 9; i++) {
        const t = i / 9;
        const angle = t * Math.PI * 2.8 + (rng() - 0.5) * 0.28;
        const radius = 0.52 + t * 0.42;
        scratch.position.set(
          Math.cos(angle) * radius,
          -0.18 + t * 0.68 + (rng() - 0.5) * 0.08,
          Math.sin(angle) * (0.42 + t * 0.2)
        );
        scratch.quaternion.setFromUnitVectors(up, scratch.position.clone().normalize());
        scratch.rotateY(angle + Math.PI * 0.22);
        scratch.rotateX((rng() - 0.5) * 0.8);
        scratch.scale.set(
          0.72 + rng() * 0.42,
          0.86 + rng() * 0.36,
          0.68 + rng() * 0.28
        );
        scratch.updateMatrix();
        shards.setMatrixAt(i, scratch.matrix);
      }
      shards.instanceMatrix.needsUpdate = true;
      shards.renderOrder = archOrder;
      fieldGroup.add(shards);

      const quantumDust = new THREE.Points(geometries.dustGeometry, materials.dustMat);
      quantumDust.name = 'QuantumDust';
      quantumDust.userData.ignoreWaveColor = true;
      quantumDust.position.set(0.02, 0.1, -0.03);
      quantumDust.rotation.set(0.26, 0.84, -0.14);
      quantumDust.scale.set(1.04, 0.9, 1.08);
      quantumDust.frustumCulled = false;
      quantumDust.renderOrder = archOrder;
      fieldGroup.add(quantumDust);

      fieldGroup.rotation.set(-0.06, 0.18, -0.24);
      quantumRoot.add(fieldGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const haloPoints = new THREE.Points(geometries.haloGeometry, materials.haloMat);
      haloPoints.name = 'InterferenceHaloPoints';
      haloPoints.userData.ignoreWaveColor = true;
      haloPoints.position.set(0.0, 0.08, 0.0);
      haloPoints.rotation.set(0.12, 0.56, -0.22);
      haloPoints.scale.set(1.04, 0.88, 1.12);
      haloPoints.frustumCulled = false;
      haloPoints.renderOrder = archOrder;
      auraGroup.add(haloPoints);

      const shellColor = 0xf4fbff;
      const shell1 = createNodeHologramShell(voidCore, shellColor);
      if (shell1) {
        shell1.name = 'QuantumShell_1';
        shell1.position.copy(voidCore.position);
        shell1.quaternion.copy(voidCore.quaternion);
        shell1.scale.copy(voidCore.scale).multiplyScalar(1.15);
        shell1.frustumCulled = false;
        shell1.renderOrder = archOrder;
        if (shell1.material?.uniforms?.uOpacity) {
          shell1.material.uniforms.uOpacity.value = 0.068;
        }
        auraGroup.add(shell1);
      }

      const shell2 = createNodeHologramShell(voidCore, shellColor);
      if (shell2) {
        shell2.name = 'QuantumShell_2';
        shell2.position.copy(voidCore.position);
        shell2.quaternion.copy(voidCore.quaternion);
        shell2.scale.copy(voidCore.scale).multiplyScalar(1.26);
        shell2.frustumCulled = false;
        shell2.renderOrder = archOrder;
        if (shell2.material?.uniforms?.uOpacity) {
          shell2.material.uniforms.uOpacity.value = 0.042;
        }
        auraGroup.add(shell2);
      }

      const edgeGlow = createNodeNeonEdgeGlowShell(voidCore, 0x9defff, {
        glowIntensity: 0.92,
        edgeWidth: 0.078,
        pulseAmount: 0.0
      });
      if (edgeGlow) {
        edgeGlow.name = 'QuantumEdgeGlow';
        edgeGlow.position.copy(voidCore.position);
        edgeGlow.quaternion.copy(voidCore.quaternion);
        edgeGlow.scale.copy(voidCore.scale).multiplyScalar(1.02);
        edgeGlow.frustumCulled = false;
        edgeGlow.renderOrder = archOrder;
        auraGroup.add(edgeGlow);
      }

      quantumRoot.add(auraGroup);

      quantumRoot.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          if (o.material) {
            o.material.userData = {
              ...(o.material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'quantum-lattice-manifest');
        }
      });

      quantumRoot.userData.visualReady = true;
      hostGroup.userData.visualReady = true;
      hostGroup.add(quantumRoot);
      return hostGroup;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createQuantumLattice',
        category: 'quantum',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * QUANTUM: Paradox Lotus Pressure Engine (live 703 path)
   * Hierarchy:
   * QUANTUM_PARADOX_LOTUS_NODE
   *   - CORE_GROUP (paradox core + inner state + void seam + ghost states)
   *   - PETAL_GROUP (authored lotus blades with paradox petals)
   *   - PRESSURE_GROUP (inward phase clamps / braces)
   *   - FIELD_GROUP (support phase planes)
   *   - AURA_GROUP (quantum dust + hologram shells + edge glow)
   */
  static createQuantumLotus(group, visualCode, color) {
    try {
      const resolvedVisualCode = (typeof visualCode === 'number' && visualCode <= 4096)
        ? visualCode
        : (group?.userData?.visualCode ?? 703);
      const resolvedColor = (typeof color === 'number')
        ? color
        : ((typeof visualCode === 'number' && visualCode > 4096) ? visualCode : 0x69e8ff);

      const nodeKey = group?.userData?.nodeId || group?.userData?.visualCode?.toString() || String(resolvedVisualCode || resolvedColor);
      const seed = Math.abs(hashString(nodeKey)) || 703;
      const rng = _mythicSeededRng(seed);
      const geometries = _getQuantumParadoxLotusGeometries();
      const materials = _getQuantumParadoxLotusMaterials(resolvedColor);

      const quantumRoot = new THREE.Group();
      quantumRoot.name = 'QUANTUM_PARADOX_LOTUS_NODE';
      quantumRoot.userData.visualVariant = 'QUANTUM_PARADOX_LOTUS_PRESSURE_ENGINE_V4';
      quantumRoot.userData.quantumVariant = 'PARADOX_LOTUS_PRESSURE_ENGINE';
      quantumRoot.userData.nodeGeometryName = 'QUANTUM_LOTUS';

      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const core = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      core.name = 'ParadoxCore';
      core.userData.isCore = true;
      core.userData.ignoreWaveColor = true;
      core.position.set(0.0, 0.18, 0.0);
      core.rotation.set(-0.16, 0.28, 0.1);
      core.scale.set(1.0, 1.08, 0.96);
      core.renderOrder = coreOrder;
      coreGroup.add(core);

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'ParadoxCoreEdges';
      coreEdges.userData.ignoreWaveColor = true;
      coreEdges.position.copy(core.position);
      coreEdges.rotation.copy(core.rotation);
      coreEdges.scale.copy(core.scale);
      coreEdges.renderOrder = archOrder;
      coreGroup.add(coreEdges);

      const innerState = new THREE.Mesh(geometries.innerStateGeometry, materials.innerStateMat);
      innerState.name = 'InnerState';
      innerState.userData.ignoreWaveColor = true;
      innerState.position.set(0.06, 0.2, -0.02);
      innerState.rotation.set(0.32, -0.12, 0.22);
      innerState.scale.set(0.9, 1.0, 0.84);
      innerState.renderOrder = coreOrder;
      coreGroup.add(innerState);

      const innerEdges = new THREE.LineSegments(geometries.innerStateEdgesGeometry, materials.edgeMat);
      innerEdges.name = 'InnerStateEdges';
      innerEdges.userData.ignoreWaveColor = true;
      innerEdges.position.copy(innerState.position);
      innerEdges.rotation.copy(innerState.rotation);
      innerEdges.scale.copy(innerState.scale);
      innerEdges.renderOrder = archOrder;
      coreGroup.add(innerEdges);

      const voidSeam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      voidSeam.name = 'VoidSeam';
      voidSeam.userData.ignoreWaveColor = true;
      voidSeam.position.set(-0.05, 0.14, 0.04);
      voidSeam.rotation.set(0.18, -0.42, 0.16);
      voidSeam.renderOrder = coreOrder;
      coreGroup.add(voidSeam);

      const ghostA = new THREE.Mesh(geometries.ghostGeometry, materials.ghostMatA);
      ghostA.name = 'GhostState_A';
      ghostA.userData.ignoreWaveColor = true;
      ghostA.position.copy(core.position).add(new THREE.Vector3(0.12, 0.06, -0.08));
      ghostA.rotation.copy(core.rotation);
      ghostA.scale.copy(core.scale).multiplyScalar(1.02);
      ghostA.renderOrder = archOrder;
      coreGroup.add(ghostA);

      const ghostB = new THREE.Mesh(geometries.ghostGeometry, materials.ghostMatB);
      ghostB.name = 'GhostState_B';
      ghostB.userData.ignoreWaveColor = true;
      ghostB.position.copy(core.position).add(new THREE.Vector3(-0.1, -0.02, 0.1));
      ghostB.rotation.copy(core.rotation);
      ghostB.scale.copy(core.scale).multiplyScalar(0.98);
      ghostB.renderOrder = archOrder;
      coreGroup.add(ghostB);

      quantumRoot.add(coreGroup);

      const petalGroup = new THREE.Group();
      petalGroup.name = 'PETAL_GROUP';
      const petalConfigs = [
        { name: 'LotusBlade_A', material: materials.petalMatA, pos: [-0.42, 0.06, 0.12], rot: [0.26, 0.42, -0.84], scale: [1.02, 1.08, 0.92] },
        { name: 'LotusBlade_B', material: materials.petalMatB, pos: [0.38, 0.1, -0.14], rot: [-0.2, -0.5, 0.64], scale: [0.94, 1.0, 0.86] },
        { name: 'LotusBlade_C', material: materials.petalMatA, pos: [0.1, 0.54, 0.22], rot: [0.98, -0.08, 0.14], scale: [0.84, 1.02, 0.76] },
        { name: 'LotusBlade_D', material: materials.petalMatB, pos: [-0.08, 0.44, -0.28], rot: [0.7, 0.68, -0.48], scale: [0.8, 0.92, 0.72] },
        { name: 'LotusBlade_E', material: materials.petalMatA, pos: [0.5, 0.26, 0.08], rot: [0.06, -0.88, 0.34], scale: [0.74, 0.82, 0.66] },
        { name: 'ParadoxPetal_F', material: materials.petalMatB, pos: [-0.24, 0.62, 0.18], rot: [1.24, 0.32, 0.82], scale: [0.82, 1.06, 0.68] },
        { name: 'ParadoxPetal_G', material: materials.petalMatA, pos: [0.18, 0.48, -0.42], rot: [0.52, 1.14, -0.76], scale: [0.76, 0.94, 0.62] }
      ];
      petalConfigs.forEach((cfg, idx) => {
        const petal = new THREE.Mesh(geometries.petalGeometry, cfg.material);
        petal.name = cfg.name;
        petal.userData.ignoreWaveColor = true;
        petal.position.set(
          cfg.pos[0] + (rng() - 0.5) * 0.04,
          cfg.pos[1] + (rng() - 0.5) * 0.04,
          cfg.pos[2] + (rng() - 0.5) * 0.04
        );
        petal.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.08,
          cfg.rot[1] + (rng() - 0.5) * 0.1,
          cfg.rot[2] + (rng() - 0.5) * 0.08
        );
        petal.scale.set(
          cfg.scale[0] * (0.96 + rng() * 0.08),
          cfg.scale[1] * (0.96 + rng() * 0.08),
          cfg.scale[2] * (0.96 + rng() * 0.08)
        );
        if (idx >= 5) {
          petal.position.x += (idx === 5 ? -0.08 : 0.06);
          petal.position.z += (idx === 5 ? 0.1 : -0.08);
        }
        petal.renderOrder = archOrder;
        petalGroup.add(petal);

        const petalEdges = new THREE.LineSegments(geometries.petalEdgesGeometry, materials.edgeMat);
        petalEdges.name = `${cfg.name}_Edges`;
        petalEdges.userData.ignoreWaveColor = true;
        petalEdges.position.copy(petal.position);
        petalEdges.rotation.copy(petal.rotation);
        petalEdges.scale.copy(petal.scale);
        petalEdges.renderOrder = archOrder;
        petalGroup.add(petalEdges);
      });
      quantumRoot.add(petalGroup);

      const pressureGroup = new THREE.Group();
      pressureGroup.name = 'PRESSURE_GROUP';
      const braceConfigs = [
        { name: 'PhaseClamp_A', pos: [-0.18, 0.16, 0.18], rot: [1.02, 0.16, 0.74], scale: [1.0, 0.92, 1.08] },
        { name: 'PhaseClamp_B', pos: [0.22, 0.08, -0.16], rot: [0.12, 1.04, -0.54], scale: [0.88, 1.0, 0.9] },
        { name: 'PhaseClamp_C', pos: [0.04, 0.42, -0.06], rot: [0.86, -0.18, 0.22], scale: [0.72, 0.82, 0.74] }
      ];
      braceConfigs.forEach((cfg) => {
        const brace = new THREE.Mesh(geometries.braceGeometry, materials.braceMat);
        brace.name = cfg.name;
        brace.userData.ignoreWaveColor = true;
        brace.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        brace.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        brace.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        brace.renderOrder = archOrder;
        pressureGroup.add(brace);
      });
      quantumRoot.add(pressureGroup);

      const fieldGroup = new THREE.Group();
      fieldGroup.name = 'FIELD_GROUP';

      const planeA = new THREE.Mesh(geometries.planeGeometry, materials.planeMat);
      planeA.name = 'PhasePlane_A';
      planeA.userData.ignoreWaveColor = true;
      planeA.position.set(-0.1, 0.24, 0.06);
      planeA.rotation.set(1.08, 0.12, 0.3);
      planeA.scale.set(1.0, 0.9, 1.0);
      planeA.renderOrder = archOrder;
      fieldGroup.add(planeA);

      const planeB = new THREE.Mesh(geometries.planeGeometry, materials.ghostMatB.clone());
      planeB.name = 'PhasePlane_B';
      planeB.userData.ignoreWaveColor = true;
      planeB.position.set(0.14, 0.02, -0.18);
      planeB.rotation.set(0.64, 1.02, 0.16);
      planeB.scale.set(0.82, 1.12, 1.0);
      planeB.renderOrder = archOrder;
      fieldGroup.add(planeB);

      quantumRoot.add(fieldGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const dust = new THREE.Points(geometries.dustGeometry, materials.dustMat);
      dust.name = 'QuantumDust';
      dust.userData.ignoreWaveColor = true;
      dust.position.set(0.02, 0.12, -0.02);
      dust.rotation.set(0.18, 0.72, -0.16);
      dust.frustumCulled = false;
      dust.renderOrder = archOrder;
      auraGroup.add(dust);

      const shellColor = 0xf4fbff;
      const shell1 = createNodeHologramShell(core, shellColor);
      if (shell1) {
        shell1.name = 'QuantumShell_1';
        shell1.position.copy(core.position);
        shell1.quaternion.copy(core.quaternion);
        shell1.scale.copy(core.scale).multiplyScalar(1.12);
        shell1.frustumCulled = false;
        shell1.renderOrder = archOrder;
        if (shell1.material?.uniforms?.uOpacity) shell1.material.uniforms.uOpacity.value = 0.058;
        auraGroup.add(shell1);
      }

      const shell2 = createNodeHologramShell(core, shellColor);
      if (shell2) {
        shell2.name = 'QuantumShell_2';
        shell2.position.copy(core.position);
        shell2.quaternion.copy(core.quaternion);
        shell2.scale.copy(core.scale).multiplyScalar(1.24);
        shell2.frustumCulled = false;
        shell2.renderOrder = archOrder;
        if (shell2.material?.uniforms?.uOpacity) shell2.material.uniforms.uOpacity.value = 0.036;
        auraGroup.add(shell2);
      }

      const edgeGlow = createNodeNeonEdgeGlowShell(core, 0x97efff, {
        glowIntensity: 0.82,
        edgeWidth: 0.072,
        pulseAmount: 0.0
      });
      if (edgeGlow) {
        edgeGlow.name = 'QuantumEdgeGlow';
        edgeGlow.position.copy(core.position);
        edgeGlow.quaternion.copy(core.quaternion);
        edgeGlow.scale.copy(core.scale).multiplyScalar(1.02);
        edgeGlow.frustumCulled = false;
        edgeGlow.renderOrder = archOrder;
        auraGroup.add(edgeGlow);
      }

      quantumRoot.add(auraGroup);

      quantumRoot.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          if (o.userData.ignoreWaveColor !== false) o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'quantum-paradox-lotus');
        }
      });

      quantumRoot.userData.visualReady = true;
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'QUANTUM_LOTUS';
      group.add(quantumRoot);
      return group;
    } catch (err) {
      console.error('[QuantumParadoxLotusAbort]', {
        reason: err?.message || err,
        visualCode
      });
      return null;
    }
  }

  // ===== MYTHIC NODES (Ancient Fractured Relics - 6 variants) =====

  /**
   * Main mythic node creator
   * Legacy shared entry is no longer used by registry (strict 1:1 mapping).
   */
  static _createMythicGeometry(group, builderFn, label) {
    const nodeObj = builderFn?.call(CanonicalGeometryFamilies, 1.0);
    if (!isValidNodeObject(nodeObj)) {
      throw new Error(`Mythic builder failed: ${label}`);
    }
    if (nodeObj.isMesh) {
      validateMeshGeometry(nodeObj, label);
    } else if (nodeObj.isGroup) {
      nodeObj.traverse((child) => {
        if (child?.isMesh && child.geometry) {
          validateMeshGeometry(child, `${label}:${child.name || 'mesh'}`);
        }
      });
    }
    if (!nodeObj.userData) nodeObj.userData = {};
    nodeObj.userData.category = 'mythic';
    nodeObj.userData.visualReady = true;
    group.add(nodeObj);
    return group;
  }

  static createMythicShardClusterNode(group, visualCode, color) {
    try {
      const geometries = _getMythicCataclysmCairnGeometries();
      const materials = _getMythicCataclysmCairnMaterials(color);
      const root = new THREE.Group();
      root.name = 'MYTHIC_CATACLYSM_CAIRN_NODE';
      root.userData.visualVariant = 'MYTHIC_CATACLYSM_CAIRN_V4';
      root.userData.mythicVariant = 'CATACLYSM_CAIRN';
      root.userData.nodeGeometryName = 'MYTHIC_SHARD_CLUSTER';

      const seed = group?.userData?.nodeId ? hashString(group.userData.nodeId) : (Number.isFinite(visualCode) ? visualCode : 901);
      const rng = _mythicSeededRng(seed);
      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const coreMesh = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      coreMesh.name = 'RelicHeart';
      coreMesh.userData.ignoreWaveColor = true;
      coreMesh.position.set(0.02, 0.16, -0.02);
      coreMesh.rotation.set(0.18, -0.34, 0.1);
      coreMesh.scale.set(1.0, 1.14, 0.94);
      coreMesh.renderOrder = coreOrder;
      coreMesh.userData.isCore = true;
      coreGroup.add(coreMesh);

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'HardEdgeCage';
      coreEdges.userData.ignoreWaveColor = true;
      coreEdges.position.copy(coreMesh.position);
      coreEdges.rotation.copy(coreMesh.rotation);
      coreEdges.scale.copy(coreMesh.scale);
      coreEdges.renderOrder = archOrder;
      coreGroup.add(coreEdges);

      const pressureSeam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      pressureSeam.name = 'PressureSeam';
      pressureSeam.userData.ignoreWaveColor = true;
      pressureSeam.position.set(0.08, 0.22, 0.04);
      pressureSeam.rotation.set(0.3, 0.6, -0.16);
      pressureSeam.scale.set(0.94, 1.02, 0.9);
      pressureSeam.renderOrder = archOrder;
      coreGroup.add(pressureSeam);

      const keystone = new THREE.Mesh(geometries.keystoneGeometry, materials.keystoneMat);
      keystone.name = 'SuspendedKeystone';
      keystone.userData.ignoreWaveColor = true;
      keystone.position.set(0.04, 0.66, -0.02);
      keystone.rotation.set(-0.34, 0.18, 0.38);
      keystone.scale.set(0.9, 1.0, 0.82);
      keystone.renderOrder = archOrder;
      coreGroup.add(keystone);

      const keystoneEdges = new THREE.LineSegments(geometries.keystoneEdgesGeometry, materials.edgeMat);
      keystoneEdges.name = 'SuspendedKeystone_Edges';
      keystoneEdges.userData.ignoreWaveColor = true;
      keystoneEdges.position.copy(keystone.position);
      keystoneEdges.rotation.copy(keystone.rotation);
      keystoneEdges.scale.copy(keystone.scale);
      keystoneEdges.renderOrder = archOrder;
      coreGroup.add(keystoneEdges);

      root.add(coreGroup);

      const shardGroup = new THREE.Group();
      shardGroup.name = 'SHARD_GROUP';
      const shardConfigs = [
        { name: 'ExcavationShard_A', pos: [-0.48, -0.06, 0.14], rot: [0.44, -0.86, 0.82], scale: [0.96, 1.02, 0.86], mat: materials.shardMatA },
        { name: 'ExcavationShard_B', pos: [-0.3, 0.1, -0.18], rot: [0.34, 0.34, 0.52], scale: [0.84, 0.94, 0.76], mat: materials.shardMatB },
        { name: 'ExcavationShard_C', pos: [-0.04, -0.02, 0.36], rot: [0.52, -1.14, 0.14], scale: [0.72, 0.86, 0.68], mat: materials.shardMatA },
        { name: 'ExcavationShard_D', pos: [0.18, 0.04, -0.34], rot: [0.38, 1.08, -0.22], scale: [0.76, 0.88, 0.7], mat: materials.shardMatB },
        { name: 'ExcavationShard_E', pos: [0.36, 0.14, 0.1], rot: [0.28, 0.52, -0.58], scale: [0.84, 0.96, 0.78], mat: materials.shardMatA },
        { name: 'ExcavationShard_F', pos: [0.5, -0.02, -0.02], rot: [0.14, 0.16, -0.82], scale: [0.9, 1.02, 0.82], mat: materials.shardMatB }
      ];
      shardConfigs.forEach((cfg, idx) => {
        const shard = new THREE.Mesh(geometries.majorShardGeometry, cfg.mat);
        shard.name = cfg.name;
        shard.userData.ignoreWaveColor = true;
        shard.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        shard.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.08,
          cfg.rot[1] + (rng() - 0.5) * 0.1,
          cfg.rot[2] + (rng() - 0.5) * 0.08
        );
        shard.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        shard.renderOrder = coreOrder;
        shardGroup.add(shard);

        const shardEdges = new THREE.LineSegments(geometries.majorShardEdgesGeometry, materials.edgeMat);
        shardEdges.name = `${cfg.name}_Edges`;
        shardEdges.userData.ignoreWaveColor = true;
        shardEdges.position.copy(shard.position);
        shardEdges.rotation.copy(shard.rotation);
        shardEdges.scale.copy(shard.scale).multiplyScalar(idx < 2 ? 1.0 : 0.96);
        shardEdges.renderOrder = archOrder;
        shardGroup.add(shardEdges);
      });

      const witnessConfigs = [
        { name: 'WitnessShard_A', pos: [-0.12, 0.48, 0.2], rot: [1.08, -0.16, 0.86], scale: [0.72, 0.88, 0.68] },
        { name: 'WitnessShard_B', pos: [0.22, 0.54, -0.08], rot: [1.18, 0.42, -0.16], scale: [0.66, 0.82, 0.62] },
        { name: 'WitnessShard_C', pos: [0.06, 0.28, -0.24], rot: [0.82, 0.84, 0.18], scale: [0.58, 0.72, 0.56] }
      ];
      witnessConfigs.forEach((cfg) => {
        const witness = new THREE.Mesh(geometries.witnessGeometry, materials.witnessMat);
        witness.name = cfg.name;
        witness.userData.ignoreWaveColor = true;
        witness.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        witness.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        witness.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        witness.renderOrder = archOrder;
        shardGroup.add(witness);

        const witnessEdges = new THREE.LineSegments(geometries.witnessEdgesGeometry, materials.edgeMat);
        witnessEdges.name = `${cfg.name}_Edges`;
        witnessEdges.userData.ignoreWaveColor = true;
        witnessEdges.position.copy(witness.position);
        witnessEdges.rotation.copy(witness.rotation);
        witnessEdges.scale.copy(witness.scale);
        witnessEdges.renderOrder = archOrder;
        shardGroup.add(witnessEdges);
      });

      root.add(shardGroup);

      const pressureGroup = new THREE.Group();
      pressureGroup.name = 'PRESSURE_GROUP';
      const bandConfigs = [
        { name: 'CollapseVector_A', pos: [-0.22, -0.14, 0.12], rot: [0.14, -0.44, 0.26], scale: [0.96, 0.94, 0.9] },
        { name: 'CollapseVector_B', pos: [0.22, -0.1, -0.08], rot: [-0.12, 0.7, -0.18], scale: [0.88, 0.92, 0.84] },
        { name: 'CollapseVector_C', pos: [-0.04, 0.02, -0.24], rot: [0.94, 0.22, 1.06], scale: [0.72, 0.8, 0.68] },
        { name: 'CollapseVector_D', pos: [0.04, 0.14, 0.18], rot: [0.52, 1.16, 0.3], scale: [0.62, 0.72, 0.58] }
      ];
      bandConfigs.forEach((cfg, idx) => {
        const band = new THREE.Mesh(geometries.bandGeometry, materials.bandMat);
        band.name = cfg.name;
        band.userData.ignoreWaveColor = true;
        band.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        band.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.06,
          cfg.rot[1] + (rng() - 0.5) * 0.08,
          cfg.rot[2] + (rng() - 0.5) * 0.06
        );
        band.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        band.renderOrder = archOrder;
        pressureGroup.add(band);

        const bandEdges = new THREE.LineSegments(geometries.bandEdgesGeometry, materials.bandEdgeMat);
        bandEdges.name = `${cfg.name}_Edges`;
        bandEdges.userData.ignoreWaveColor = true;
        bandEdges.position.copy(band.position);
        bandEdges.rotation.copy(band.rotation);
        bandEdges.scale.copy(band.scale);
        bandEdges.renderOrder = archOrder;
        pressureGroup.add(bandEdges);

        if (idx < 2) {
          const tether = new THREE.Mesh(geometries.witnessGeometry, materials.witnessMat);
          tether.name = `PressureWitness_${idx}`;
          tether.userData.ignoreWaveColor = true;
          tether.position.copy(band.position).add(new THREE.Vector3(0.04 - idx * 0.08, 0.18 + idx * 0.08, -0.02 + idx * 0.04));
          tether.rotation.set(band.rotation.x + 0.16, band.rotation.y - 0.12, band.rotation.z + 0.1);
          tether.scale.set(0.32, 0.42, 0.3);
          tether.renderOrder = archOrder;
          pressureGroup.add(tether);
        }
      });

      root.add(pressureGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const glyphAsh = new THREE.Points(geometries.dustGeometry, materials.dustMat);
      glyphAsh.name = 'GlyphAsh';
      glyphAsh.userData.ignoreWaveColor = true;
      glyphAsh.frustumCulled = false;
      glyphAsh.renderOrder = archOrder;
      auraGroup.add(glyphAsh);

      const haloPoints = new THREE.Points(geometries.haloGeometry, materials.haloMat);
      haloPoints.name = 'HaloPoints';
      haloPoints.userData.ignoreWaveColor = true;
      haloPoints.frustumCulled = false;
      haloPoints.renderOrder = archOrder;
      auraGroup.add(haloPoints);

      const shell1 = createNodeHologramShell(coreMesh, 0xe8f8ff);
      if (shell1) {
        shell1.name = 'MythicShell_1';
        shell1.position.copy(coreMesh.position);
        shell1.quaternion.copy(coreMesh.quaternion);
        shell1.scale.copy(coreMesh.scale).multiplyScalar(1.1);
        shell1.frustumCulled = false;
        shell1.renderOrder = archOrder;
        if (shell1.material?.uniforms?.uOpacity) shell1.material.uniforms.uOpacity.value = 0.048;
        auraGroup.add(shell1);
      }

      const shell2 = createNodeHologramShell(coreMesh, 0xe8f8ff);
      if (shell2) {
        shell2.name = 'MythicShell_2';
        shell2.position.copy(coreMesh.position);
        shell2.quaternion.copy(coreMesh.quaternion);
        shell2.scale.copy(coreMesh.scale).multiplyScalar(1.18);
        shell2.frustumCulled = false;
        shell2.renderOrder = archOrder;
        if (shell2.material?.uniforms?.uOpacity) shell2.material.uniforms.uOpacity.value = 0.03;
        auraGroup.add(shell2);
      }

      const edgeGlow = createNodeNeonEdgeGlowShell(coreMesh, 0xdff8ff, {
        glowIntensity: 0.74,
        edgeWidth: 0.072,
        pulseAmount: 0.0
      });
      if (edgeGlow) {
        edgeGlow.name = 'MythicEdgeGlow';
        edgeGlow.position.copy(coreMesh.position);
        edgeGlow.quaternion.copy(coreMesh.quaternion);
        edgeGlow.scale.copy(coreMesh.scale).multiplyScalar(1.01);
        edgeGlow.frustumCulled = false;
        edgeGlow.renderOrder = archOrder;
        auraGroup.add(edgeGlow);
      }

      root.add(auraGroup);

      root.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'mythic-shard-cluster');
        }
      });

      root.userData.visualReady = true;
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'MYTHIC_SHARD_CLUSTER';
      group.add(root);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createMythicShardClusterNode',
        category: 'mythic',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  static createMythicBrokenMonolithNode(group, visualCode, color) {
    try {
      const geometries = _getMythicApostateMonolithGeometries();
      const materials = _getMythicApostateMonolithMaterials(color);
      const root = new THREE.Group();
      root.name = 'MYTHIC_APOSTATE_MONOLITH_NODE';
      root.userData.visualVariant = 'MYTHIC_APOSTATE_MONOLITH_V4';
      root.userData.mythicVariant = 'APOSTATE_MONOLITH';
      root.userData.nodeGeometryName = 'MYTHIC_APOSTATE_MONOLITH';

      const seed = group?.userData?.nodeId ? hashString(group.userData.nodeId) : (Number.isFinite(visualCode) ? visualCode : 902);
      const rng = _mythicSeededRng(seed);
      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const oracleCore = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      oracleCore.name = 'OracleSlabCore';
      oracleCore.userData.ignoreWaveColor = true;
      oracleCore.position.set(0.02, 0.18, 0.0);
      oracleCore.rotation.set(0.12, -0.22, 0.08);
      oracleCore.scale.set(1.0, 1.12, 0.92);
      oracleCore.renderOrder = coreOrder;
      oracleCore.userData.isCore = true;
      coreGroup.add(oracleCore);

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'HardEdgeCage';
      coreEdges.userData.ignoreWaveColor = true;
      coreEdges.position.copy(oracleCore.position);
      coreEdges.rotation.copy(oracleCore.rotation);
      coreEdges.scale.copy(oracleCore.scale);
      coreEdges.renderOrder = archOrder;
      coreGroup.add(coreEdges);

      const innerVoid = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      innerVoid.name = 'InnerVoidSeam';
      innerVoid.userData.ignoreWaveColor = true;
      innerVoid.position.set(0.03, 0.18, -0.02);
      innerVoid.rotation.set(0.28, 0.42, -0.14);
      innerVoid.scale.set(0.86, 1.04, 0.84);
      innerVoid.renderOrder = archOrder;
      coreGroup.add(innerVoid);

      root.add(coreGroup);

      const monolithGroup = new THREE.Group();
      monolithGroup.name = 'MONOLITH_GROUP';

      const idolLeft = new THREE.Mesh(geometries.idolGeometryA, materials.idolMatA);
      idolLeft.name = 'IdolHalf_A';
      idolLeft.userData.ignoreWaveColor = true;
      idolLeft.position.set(-0.28, 0.1, 0.06);
      idolLeft.rotation.set(0.08, -0.28, 0.1);
      idolLeft.scale.set(1.02, 1.04, 0.96);
      idolLeft.renderOrder = coreOrder;
      monolithGroup.add(idolLeft);

      const idolLeftEdges = new THREE.LineSegments(geometries.idolEdgesGeometryA, materials.edgeMat);
      idolLeftEdges.name = 'IdolHalf_A_Edges';
      idolLeftEdges.userData.ignoreWaveColor = true;
      idolLeftEdges.position.copy(idolLeft.position);
      idolLeftEdges.rotation.copy(idolLeft.rotation);
      idolLeftEdges.scale.copy(idolLeft.scale);
      idolLeftEdges.renderOrder = archOrder;
      monolithGroup.add(idolLeftEdges);

      const idolRight = new THREE.Mesh(geometries.idolGeometryB, materials.idolMatB);
      idolRight.name = 'IdolHalf_B';
      idolRight.userData.ignoreWaveColor = true;
      idolRight.position.set(0.34, 0.0, -0.05);
      idolRight.rotation.set(-0.06, 0.34, -0.14);
      idolRight.scale.set(0.94, 1.02, 0.9);
      idolRight.renderOrder = coreOrder;
      monolithGroup.add(idolRight);

      const idolRightEdges = new THREE.LineSegments(geometries.idolEdgesGeometryB, materials.edgeMat);
      idolRightEdges.name = 'IdolHalf_B_Edges';
      idolRightEdges.userData.ignoreWaveColor = true;
      idolRightEdges.position.copy(idolRight.position);
      idolRightEdges.rotation.copy(idolRight.rotation);
      idolRightEdges.scale.copy(idolRight.scale);
      idolRightEdges.renderOrder = archOrder;
      monolithGroup.add(idolRightEdges);

      root.add(monolithGroup);

      const amplificationGroup = new THREE.Group();
      amplificationGroup.name = 'AMPLIFICATION_GROUP';
      const ribConfigs = [
        { name: 'RevelationRib_A', pos: [-0.42, -0.16, 0.18], rot: [0.28, -1.06, 0.82], scale: [0.86, 0.94, 0.74] },
        { name: 'RevelationRib_B', pos: [0.26, -0.06, 0.28], rot: [-0.04, 0.82, -0.46], scale: [0.72, 0.86, 0.64] },
        { name: 'RevelationRib_C', pos: [-0.08, 0.34, -0.22], rot: [0.94, -0.08, 0.98], scale: [0.74, 0.9, 0.66] },
        { name: 'RevelationRib_D', pos: [0.18, 0.56, 0.16], rot: [1.18, 0.68, 0.48], scale: [0.66, 0.84, 0.58] },
        { name: 'WitnessShard_A', pos: [0.02, 0.88, -0.06], rot: [1.42, 0.22, 0.12], scale: [0.8, 1.0, 0.74], shard: true }
      ];
      ribConfigs.forEach((cfg, idx) => {
        const isShard = !!cfg.shard;
        const mesh = new THREE.Mesh(
          isShard ? geometries.shardGeometry : geometries.ribGeometry,
          isShard ? materials.shardMat : materials.ribMat
        );
        mesh.name = cfg.name;
        mesh.userData.ignoreWaveColor = true;
        mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        mesh.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.08,
          cfg.rot[1] + (rng() - 0.5) * 0.1,
          cfg.rot[2] + (rng() - 0.5) * 0.08
        );
        mesh.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        mesh.renderOrder = archOrder;
        amplificationGroup.add(mesh);

        const edgeGeometry = isShard ? geometries.shardEdgesGeometry : geometries.ribEdgesGeometry;
        const edgeMaterial = isShard ? materials.edgeMat : materials.ribEdgeMat;
        const meshEdges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        meshEdges.name = `${cfg.name}_Edges`;
        meshEdges.userData.ignoreWaveColor = true;
        meshEdges.position.copy(mesh.position);
        meshEdges.rotation.copy(mesh.rotation);
        meshEdges.scale.copy(mesh.scale);
        meshEdges.renderOrder = archOrder;
        amplificationGroup.add(meshEdges);

        if (idx < 2) {
          const witness = new THREE.Mesh(geometries.shardGeometry, materials.shardMat);
          witness.name = `WitnessShard_${idx}`;
          witness.userData.ignoreWaveColor = true;
          witness.position.copy(mesh.position).add(new THREE.Vector3(0.06 + idx * 0.04, 0.12 + idx * 0.06, -0.02));
          witness.rotation.set(mesh.rotation.x + 0.22, mesh.rotation.y - 0.16, mesh.rotation.z + 0.12);
          witness.scale.copy(mesh.scale).multiplyScalar(0.62);
          witness.renderOrder = archOrder;
          amplificationGroup.add(witness);

          const witnessEdges = new THREE.LineSegments(geometries.shardEdgesGeometry, materials.edgeMat);
          witnessEdges.name = `WitnessShard_${idx}_Edges`;
          witnessEdges.userData.ignoreWaveColor = true;
          witnessEdges.position.copy(witness.position);
          witnessEdges.rotation.copy(witness.rotation);
          witnessEdges.scale.copy(witness.scale);
          witnessEdges.renderOrder = archOrder;
          amplificationGroup.add(witnessEdges);
        }
      });

      root.add(amplificationGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const glyphDust = new THREE.Points(geometries.glyphGeometry, materials.glyphMat);
      glyphDust.name = 'GlyphDust';
      glyphDust.userData.ignoreWaveColor = true;
      glyphDust.frustumCulled = false;
      glyphDust.renderOrder = archOrder;
      auraGroup.add(glyphDust);

      const sanctumDust = new THREE.Points(geometries.dustGeometry, materials.dustMat);
      sanctumDust.name = 'SanctumDust';
      sanctumDust.userData.ignoreWaveColor = true;
      sanctumDust.frustumCulled = false;
      sanctumDust.renderOrder = archOrder;
      auraGroup.add(sanctumDust);

      const shell1 = createNodeHologramShell(oracleCore, 0xe8f8ff);
      if (shell1) {
        shell1.name = 'MythicShell_1';
        shell1.position.copy(oracleCore.position);
        shell1.quaternion.copy(oracleCore.quaternion);
        shell1.scale.copy(oracleCore.scale).multiplyScalar(1.1);
        shell1.frustumCulled = false;
        shell1.renderOrder = archOrder;
        if (shell1.material?.uniforms?.uOpacity) shell1.material.uniforms.uOpacity.value = 0.052;
        auraGroup.add(shell1);
      }

      const shell2 = createNodeHologramShell(oracleCore, 0xe8f8ff);
      if (shell2) {
        shell2.name = 'MythicShell_2';
        shell2.position.copy(oracleCore.position);
        shell2.quaternion.copy(oracleCore.quaternion);
        shell2.scale.copy(oracleCore.scale).multiplyScalar(1.18);
        shell2.frustumCulled = false;
        shell2.renderOrder = archOrder;
        if (shell2.material?.uniforms?.uOpacity) shell2.material.uniforms.uOpacity.value = 0.034;
        auraGroup.add(shell2);
      }

      const edgeGlow = createNodeNeonEdgeGlowShell(oracleCore, 0xdff8ff, {
        glowIntensity: 0.76,
        edgeWidth: 0.072,
        pulseAmount: 0.0
      });
      if (edgeGlow) {
        edgeGlow.name = 'MythicEdgeGlow';
        edgeGlow.position.copy(oracleCore.position);
        edgeGlow.quaternion.copy(oracleCore.quaternion);
        edgeGlow.scale.copy(oracleCore.scale).multiplyScalar(1.01);
        edgeGlow.frustumCulled = false;
        edgeGlow.renderOrder = archOrder;
        auraGroup.add(edgeGlow);
      }

      root.add(auraGroup);

      root.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'mythic-broken-monolith');
        }
      });

      root.userData.visualReady = true;
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'MYTHIC_BROKEN_MONOLITH';
      group.add(root);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createMythicBrokenMonolithNode',
        category: 'mythic',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  static createMythicFloatingFragmentsNode(group, visualCode, color) {
    try {
      const geometries = _getMythicFloatingReliquaryGeometries();
      const materials = _getMythicFloatingReliquaryMaterials(color);
      const root = new THREE.Group();
      root.name = 'MYTHIC_FLOATING_FRAGMENTS_NODE';
      root.userData.visualVariant = 'MYTHIC_FLOATING_FRAGMENTS_HARMONIC_RELIQUARY_V4';

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const coreMesh = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      coreMesh.name = 'ReliquaryCore';
      coreMesh.position.set(0.0, 0.28, 0.0);
      coreMesh.rotation.set(0.16, -0.26, 0.12);
      coreMesh.renderOrder = EnhancedNodeModels._getCoreRenderOrder();
      coreMesh.userData.isCore = true;
      coreGroup.add(coreMesh);

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'HardEdgeCage';
      coreEdges.position.copy(coreMesh.position);
      coreEdges.rotation.copy(coreMesh.rotation);
      coreEdges.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
      coreGroup.add(coreEdges);

      const voidSeed = new THREE.Mesh(geometries.voidGeometry, materials.voidMat);
      voidSeed.name = 'InnerVoidSeed';
      voidSeed.position.set(-0.03, 0.24, -0.09);
      voidSeed.rotation.set(-0.18, 0.32, 0.08);
      coreGroup.add(voidSeed);

      root.add(coreGroup);

      const relicGroup = new THREE.Group();
      relicGroup.name = 'RELIC_GROUP';

      const slabConfigs = [
        { name: 'RelicSlab_A', pos: [0.56, -0.04, 0.12], rot: [0.22, 0.54, 0.16], scale: [1.06, 1.0, 0.92] },
        { name: 'RelicSlab_B', pos: [-0.42, 0.18, -0.28], rot: [-0.18, -0.88, -0.24], scale: [0.94, 1.0, 0.82] },
        { name: 'RelicSlab_C', pos: [0.16, 0.46, -0.46], rot: [0.36, 0.24, -0.14], scale: [0.84, 0.96, 0.72] },
        { name: 'RelicSlab_D', pos: [-0.12, 0.78, 0.28], rot: [-0.3, 0.76, 0.24], scale: [0.72, 0.92, 0.64] }
      ];
      slabConfigs.forEach((cfg) => {
        const slab = new THREE.Mesh(geometries.slabGeometry, materials.slabMat);
        slab.name = cfg.name;
        slab.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        slab.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        slab.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        relicGroup.add(slab);
      });

      const witnessConfigs = [
        { name: 'WitnessShard_A', pos: [-0.6, 0.06, 0.34], rot: [0.42, 0.12, -0.18], scale: [1.0, 1.06, 0.92] },
        { name: 'WitnessShard_B', pos: [0.38, 0.62, 0.5], rot: [-0.18, -0.52, 0.36], scale: [0.88, 0.92, 0.82] },
        { name: 'WitnessShard_C', pos: [0.06, 1.0, -0.16], rot: [0.26, 0.68, -0.24], scale: [0.78, 0.84, 0.74] }
      ];
      witnessConfigs.forEach((cfg) => {
        const witness = new THREE.Mesh(geometries.witnessGeometry, materials.slabMat);
        witness.name = cfg.name;
        witness.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        witness.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        witness.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        relicGroup.add(witness);
      });

      const arcA = new THREE.Mesh(geometries.majorArcGeometry, materials.arcMat);
      arcA.name = 'CeremonialArc_A';
      arcA.position.set(0.04, 0.38, 0.06);
      arcA.rotation.set(Math.PI * 0.34, Math.PI * 0.1, Math.PI * 0.18);
      relicGroup.add(arcA);

      const arcB = new THREE.Mesh(geometries.minorArcGeometry, materials.arcMat);
      arcB.name = 'CeremonialArc_B';
      arcB.position.set(-0.08, 0.22, -0.05);
      arcB.rotation.set(-Math.PI * 0.28, -Math.PI * 0.22, -Math.PI * 0.16);
      relicGroup.add(arcB);

      root.add(relicGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const runeCloud = new THREE.Points(geometries.runeGeometry, materials.runeMat);
      runeCloud.name = 'FloatingRunes';
      runeCloud.frustumCulled = false;
      auraGroup.add(runeCloud);

      const harmonicHalo = new THREE.Points(geometries.haloGeometry, materials.haloMat);
      harmonicHalo.name = 'HarmonicHalo';
      harmonicHalo.frustumCulled = false;
      auraGroup.add(harmonicHalo);

      const shellColor = 0xe7f8ff;
      const shell1 = createNodeHologramShell(coreMesh, shellColor);
      if (shell1) {
        shell1.name = 'MythicShell_1';
        shell1.position.copy(coreMesh.position);
        shell1.quaternion.copy(coreMesh.quaternion);
        shell1.scale.copy(coreMesh.scale).multiplyScalar(1.12);
        shell1.frustumCulled = false;
        shell1.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
        if (shell1.material?.uniforms?.uOpacity) {
          shell1.material.uniforms.uOpacity.value = 0.065;
        }
        auraGroup.add(shell1);
      }

      const shell2 = createNodeHologramShell(coreMesh, shellColor);
      if (shell2) {
        shell2.name = 'MythicShell_2';
        shell2.position.copy(coreMesh.position);
        shell2.quaternion.copy(coreMesh.quaternion);
        shell2.scale.copy(coreMesh.scale).multiplyScalar(1.2);
        shell2.frustumCulled = false;
        shell2.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
        if (shell2.material?.uniforms?.uOpacity) {
          shell2.material.uniforms.uOpacity.value = 0.045;
        }
        auraGroup.add(shell2);
      }

      const edgeShell = createNodeNeonEdgeGlowShell(coreMesh, 0xd8f7ff, {
        glowIntensity: 0.9,
        edgeWidth: 0.08,
        pulseAmount: 0.0
      });
      if (edgeShell) {
        edgeShell.name = 'MythicEdgeGlow';
        edgeShell.position.copy(coreMesh.position);
        edgeShell.quaternion.copy(coreMesh.quaternion);
        edgeShell.scale.copy(coreMesh.scale).multiplyScalar(1.01);
        edgeShell.frustumCulled = false;
        edgeShell.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
        auraGroup.add(edgeShell);
      }

      root.add(auraGroup);

      root.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          validateMeshGeometry(o, o.name || 'mythic-floating-fragments');
        }
      });

      root.userData.visualReady = true;
      group.add(root);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createMythicFloatingFragmentsNode',
        category: 'mythic',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  static createMythicCrackedPrismNode(group, visualCode, color) {
    try {
      const geometries = _getMythicOracularPrismGeometries();
      const materials = _getMythicOracularPrismMaterials(color);
      const root = new THREE.Group();
      root.name = 'MYTHIC_ORACULAR_PRISM_NODE';
      root.userData.visualVariant = 'MYTHIC_ORACULAR_PRISM_RIFT_V4';
      root.userData.mythicVariant = 'ORACULAR_PRISM_RIFT';
      root.userData.nodeGeometryName = 'MYTHIC_ORACULAR_PRISM_RIFT';

      const seed = group?.userData?.nodeId ? hashString(group.userData.nodeId) : (Number.isFinite(visualCode) ? visualCode : 904);
      const rng = _mythicSeededRng(seed);
      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const coreMesh = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      coreMesh.name = 'OraclePrismNucleus';
      coreMesh.userData.ignoreWaveColor = true;
      coreMesh.position.set(0.0, 0.18, 0.0);
      coreMesh.rotation.set(0.14, -0.18, 0.08);
      coreMesh.scale.set(1.0, 1.16, 0.92);
      coreMesh.renderOrder = coreOrder;
      coreMesh.userData.isCore = true;
      coreGroup.add(coreMesh);

      const fissure = new THREE.Mesh(geometries.fissureGeometry, materials.fissureMat);
      fissure.name = 'InnerLightFissure';
      fissure.userData.ignoreWaveColor = true;
      fissure.position.set(0.02, 0.2, -0.02);
      fissure.rotation.set(0.24, 0.34, -0.12);
      fissure.scale.set(0.84, 1.02, 0.82);
      fissure.renderOrder = archOrder;
      coreGroup.add(fissure);

      const cage = new THREE.LineSegments(geometries.cageEdgesGeometry, materials.cageMat);
      cage.name = 'HardEdgeCage';
      cage.userData.ignoreWaveColor = true;
      cage.position.copy(coreMesh.position).add(new THREE.Vector3(0.01, 0.08, 0.02));
      cage.rotation.copy(coreMesh.rotation);
      cage.scale.copy(coreMesh.scale).multiply(new THREE.Vector3(0.96, 1.02, 0.92));
      cage.renderOrder = archOrder;
      coreGroup.add(cage);

      root.add(coreGroup);

      const refractionGroup = new THREE.Group();
      refractionGroup.name = 'REFRACTION_GROUP';
      const planeConfigs = [
        { name: 'RefractorPlane_A', pos: [-0.26, 0.12, 0.18], rot: [0.12, -0.84, 0.18], scale: [1.0, 1.06, 0.92], mat: materials.planeMatA },
        { name: 'RefractorPlane_B', pos: [0.24, 0.04, -0.2], rot: [-0.1, 0.92, -0.24], scale: [0.9, 1.0, 0.82], mat: materials.planeMatB },
        { name: 'RefractorPlane_C', pos: [0.02, 0.48, 0.04], rot: [0.26, 0.08, 0.22], scale: [0.78, 0.94, 0.7], mat: materials.planeMatC }
      ];
      planeConfigs.forEach((cfg, idx) => {
        const plane = new THREE.Mesh(geometries.planeGeometry, cfg.mat);
        plane.name = cfg.name;
        plane.userData.ignoreWaveColor = true;
        plane.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        plane.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        plane.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        plane.renderOrder = archOrder;
        refractionGroup.add(plane);

        if (idx === 0) {
          const planeEdges = new THREE.LineSegments(geometries.planeEdgesGeometry, materials.planeEdgeMat);
          planeEdges.name = `${cfg.name}_Edges`;
          planeEdges.userData.ignoreWaveColor = true;
          planeEdges.position.copy(plane.position).add(new THREE.Vector3(-0.02, 0.06, 0.02));
          planeEdges.rotation.copy(plane.rotation);
          planeEdges.scale.copy(plane.scale).multiply(new THREE.Vector3(0.98, 0.96, 0.9));
          planeEdges.renderOrder = archOrder;
          refractionGroup.add(planeEdges);
        }
      });

      const facetConfigs = [
        { name: 'WitnessFacet_A', pos: [-0.38, 0.64, -0.12], rot: [0.94, -0.12, 0.84], scale: [0.72, 0.9, 0.7] },
        { name: 'WitnessFacet_B', pos: [0.32, 0.82, 0.16], rot: [1.2, 0.34, -0.18], scale: [0.62, 0.82, 0.62] }
      ];
      facetConfigs.forEach((cfg, idx) => {
        const facet = new THREE.Mesh(geometries.facetGeometry, materials.facetMat);
        facet.name = cfg.name;
        facet.userData.ignoreWaveColor = true;
        facet.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        facet.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        facet.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        facet.renderOrder = archOrder;
        refractionGroup.add(facet);

        if (idx === 0) {
          const facetEdges = new THREE.LineSegments(geometries.facetEdgesGeometry, materials.cageMat);
          facetEdges.name = `${cfg.name}_Edges`;
          facetEdges.userData.ignoreWaveColor = true;
          facetEdges.position.copy(facet.position).add(new THREE.Vector3(-0.01, 0.04, 0.0));
          facetEdges.rotation.copy(facet.rotation);
          facetEdges.scale.copy(facet.scale).multiplyScalar(0.92);
          facetEdges.renderOrder = archOrder;
          refractionGroup.add(facetEdges);
        }
      });

      root.add(refractionGroup);

      const harmonizationGroup = new THREE.Group();
      harmonizationGroup.name = 'HARMONIZATION_GROUP';
      const railConfigs = [
        { name: 'HarmonicRail_A', pos: [-0.16, -0.08, 0.18], rot: [0.22, -0.06, 0.22], scale: [0.92, 0.96, 0.9] },
        { name: 'HarmonicRail_B', pos: [0.08, -0.02, -0.14], rot: [0.62, 0.42, -0.12], scale: [0.82, 0.9, 0.82] },
        { name: 'HarmonicRail_C', pos: [0.02, 0.18, 0.08], rot: [0.94, 0.78, 0.06], scale: [0.72, 0.82, 0.74] }
      ];
      railConfigs.forEach((cfg, idx) => {
        const rail = new THREE.Mesh(geometries.railGeometry, materials.railMat);
        rail.name = cfg.name;
        rail.userData.ignoreWaveColor = true;
        rail.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        rail.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.08,
          cfg.rot[1] + (rng() - 0.5) * 0.08,
          cfg.rot[2] + (rng() - 0.5) * 0.06
        );
        rail.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        rail.renderOrder = archOrder;
        harmonizationGroup.add(rail);

        const railEdges = new THREE.LineSegments(geometries.railEdgesGeometry, materials.railEdgeMat);
        railEdges.name = `${cfg.name}_Edges`;
        railEdges.userData.ignoreWaveColor = true;
        railEdges.position.copy(rail.position);
        railEdges.rotation.copy(rail.rotation);
        railEdges.scale.copy(rail.scale);
        railEdges.renderOrder = archOrder;
        harmonizationGroup.add(railEdges);

        const fin = new THREE.Mesh(geometries.facetGeometry, materials.facetMat);
        fin.name = `WitnessFin_${idx}`;
        fin.userData.ignoreWaveColor = true;
        fin.position.copy(rail.position).add(new THREE.Vector3(0.08 + idx * 0.04, 0.12 + idx * 0.06, -0.02));
        fin.rotation.set(rail.rotation.x + 0.18, rail.rotation.y - 0.14, rail.rotation.z + 0.1);
        fin.scale.set(0.48, 0.62, 0.46);
        fin.renderOrder = archOrder;
        harmonizationGroup.add(fin);

        const finEdges = new THREE.LineSegments(geometries.facetEdgesGeometry, materials.planeEdgeMat);
        finEdges.name = `WitnessFin_${idx}_Edges`;
        finEdges.userData.ignoreWaveColor = true;
        finEdges.position.copy(fin.position);
        finEdges.rotation.copy(fin.rotation);
        finEdges.scale.copy(fin.scale);
        finEdges.renderOrder = archOrder;
        harmonizationGroup.add(finEdges);
      });

      root.add(harmonizationGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const runeDust = new THREE.Points(geometries.runeGeometry, materials.runeMat);
      runeDust.name = 'RuneDust';
      runeDust.userData.ignoreWaveColor = true;
      runeDust.frustumCulled = false;
      runeDust.renderOrder = archOrder;
      auraGroup.add(runeDust);

      const haloPoints = new THREE.Points(geometries.haloGeometry, materials.haloMat);
      haloPoints.name = 'RefractedHalo';
      haloPoints.userData.ignoreWaveColor = true;
      haloPoints.frustumCulled = false;
      haloPoints.renderOrder = archOrder;
      auraGroup.add(haloPoints);

      const shell1 = createNodeHologramShell(coreMesh, 0xe6f8ff);
      if (shell1) {
        shell1.name = 'MythicShell_1';
        shell1.position.copy(coreMesh.position);
        shell1.quaternion.copy(coreMesh.quaternion);
        shell1.scale.copy(coreMesh.scale).multiplyScalar(1.12);
        shell1.frustumCulled = false;
        shell1.renderOrder = archOrder;
        if (shell1.material?.uniforms?.uOpacity) shell1.material.uniforms.uOpacity.value = 0.054;
        auraGroup.add(shell1);
      }

      const shell2 = createNodeHologramShell(coreMesh, 0xe6f8ff);
      if (shell2) {
        shell2.name = 'MythicShell_2';
        shell2.position.copy(coreMesh.position);
        shell2.quaternion.copy(coreMesh.quaternion);
        shell2.scale.copy(coreMesh.scale).multiplyScalar(1.2);
        shell2.frustumCulled = false;
        shell2.renderOrder = archOrder;
        if (shell2.material?.uniforms?.uOpacity) shell2.material.uniforms.uOpacity.value = 0.036;
        auraGroup.add(shell2);
      }

      const edgeGlow = createNodeNeonEdgeGlowShell(coreMesh, 0xdff8ff, {
        glowIntensity: 0.8,
        edgeWidth: 0.074,
        pulseAmount: 0.0
      });
      if (edgeGlow) {
        edgeGlow.name = 'MythicEdgeGlow';
        edgeGlow.position.copy(coreMesh.position);
        edgeGlow.quaternion.copy(coreMesh.quaternion);
        edgeGlow.scale.copy(coreMesh.scale).multiplyScalar(1.01);
        edgeGlow.frustumCulled = false;
        edgeGlow.renderOrder = archOrder;
        auraGroup.add(edgeGlow);
      }

      root.add(auraGroup);

      root.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'mythic-cracked-prism');
        }
      });

      root.userData.visualReady = true;
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'MYTHIC_CRACKED_PRISM';
      group.add(root);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createMythicCrackedPrismNode',
        category: 'mythic',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  static createMythicAncientCoreWithMissingNode(group, visualCode, color) {
    try {
      const geometries = _getMythicAbsentCoreSanctumGeometries();
      const materials = _getMythicAbsentCoreSanctumMaterials(color);
      const root = new THREE.Group();
      root.name = 'MYTHIC_ABSENT_CORE_SANCTUM_NODE';
      root.userData.visualVariant = 'MYTHIC_ABSENT_CORE_SANCTUM_V4';
      root.userData.mythicVariant = 'ABSENT_CORE_SANCTUM';
      root.userData.nodeGeometryName = 'MYTHIC_ANCIENT_CORE_WITH_MISSING';

      const seed = group?.userData?.nodeId ? hashString(group.userData.nodeId) : (Number.isFinite(visualCode) ? visualCode : 905);
      const rng = _mythicSeededRng(seed);
      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const coreMesh = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      coreMesh.name = 'AncientCoreNucleus';
      coreMesh.userData.ignoreWaveColor = true;
      coreMesh.position.set(0.02, 0.16, -0.02);
      coreMesh.rotation.set(0.18, -0.38, 0.08);
      coreMesh.scale.set(1.02, 1.16, 0.96);
      coreMesh.renderOrder = coreOrder;
      coreMesh.userData.isCore = true;
      coreGroup.add(coreMesh);

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'HardEdgeCage';
      coreEdges.userData.ignoreWaveColor = true;
      coreEdges.position.copy(coreMesh.position);
      coreEdges.rotation.copy(coreMesh.rotation);
      coreEdges.scale.copy(coreMesh.scale);
      coreEdges.renderOrder = archOrder;
      coreGroup.add(coreEdges);

      const absenceChamber = new THREE.Mesh(geometries.voidGeometry, materials.voidMat);
      absenceChamber.name = 'AbsenceChamber';
      absenceChamber.userData.ignoreWaveColor = true;
      absenceChamber.position.set(0.18, 0.24, 0.06);
      absenceChamber.rotation.set(0.24, 0.52, -0.18);
      absenceChamber.scale.set(1.02, 1.08, 0.92);
      absenceChamber.renderOrder = archOrder;
      coreGroup.add(absenceChamber);

      const missingWitness = new THREE.Mesh(geometries.shardGeometry, materials.shardMat);
      missingWitness.name = 'MissingWitness';
      missingWitness.userData.ignoreWaveColor = true;
      missingWitness.position.set(0.44, 0.34, 0.14);
      missingWitness.rotation.set(0.42 + (rng() - 0.5) * 0.16, 0.92 + (rng() - 0.5) * 0.18, -0.2 + (rng() - 0.5) * 0.14);
      missingWitness.scale.set(0.94, 1.08, 0.82);
      missingWitness.renderOrder = archOrder;
      coreGroup.add(missingWitness);

      const missingWitnessEdges = new THREE.LineSegments(geometries.shardEdgesGeometry, materials.edgeMat);
      missingWitnessEdges.name = 'MissingWitness_Edges';
      missingWitnessEdges.userData.ignoreWaveColor = true;
      missingWitnessEdges.position.copy(missingWitness.position);
      missingWitnessEdges.rotation.copy(missingWitness.rotation);
      missingWitnessEdges.scale.copy(missingWitness.scale);
      missingWitnessEdges.renderOrder = archOrder;
      coreGroup.add(missingWitnessEdges);

      const sanctumSeed = new THREE.Mesh(geometries.seedGeometry, materials.seedMat);
      sanctumSeed.name = 'SanctumSeed';
      sanctumSeed.userData.ignoreWaveColor = true;
      sanctumSeed.position.set(0.18, 0.48, 0.05);
      sanctumSeed.rotation.set(-0.34, 0.18, 0.42);
      sanctumSeed.scale.set(0.92, 1.0, 0.84);
      sanctumSeed.renderOrder = archOrder;
      coreGroup.add(sanctumSeed);

      root.add(coreGroup);

      const sanctumGroup = new THREE.Group();
      sanctumGroup.name = 'SANCTUM_GROUP';
      const terraceConfigs = [
        { name: 'SanctumTerrace_A', pos: [-0.04, -0.34, 0.04], rot: [0.04, 0.18, -0.08], scale: [1.14, 1.0, 1.04], mat: materials.terraceMatA },
        { name: 'SanctumTerrace_B', pos: [0.22, -0.18, -0.08], rot: [-0.08, -0.54, 0.14], scale: [0.78, 0.78, 0.72], mat: materials.terraceMatB },
        { name: 'SanctumTerrace_C', pos: [-0.34, -0.14, 0.18], rot: [0.12, 0.62, -0.24], scale: [0.7, 0.72, 0.66], mat: materials.terraceMatA }
      ];
      terraceConfigs.forEach((cfg, idx) => {
        const terrace = new THREE.Mesh(geometries.terraceGeometry, cfg.mat);
        terrace.name = cfg.name;
        terrace.userData.ignoreWaveColor = true;
        terrace.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        terrace.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        terrace.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        terrace.renderOrder = coreOrder;
        sanctumGroup.add(terrace);

        const terraceEdges = new THREE.LineSegments(geometries.terraceEdgesGeometry, materials.edgeMat);
        terraceEdges.name = `${cfg.name}_Edges`;
        terraceEdges.userData.ignoreWaveColor = true;
        terraceEdges.position.copy(terrace.position);
        terraceEdges.rotation.copy(terrace.rotation);
        terraceEdges.scale.copy(terrace.scale).multiplyScalar(idx === 0 ? 1.0 : 0.96);
        terraceEdges.renderOrder = archOrder;
        sanctumGroup.add(terraceEdges);
      });
      root.add(sanctumGroup);

      const stabilizationGroup = new THREE.Group();
      stabilizationGroup.name = 'STABILIZATION_GROUP';
      const braceConfigs = [
        { name: 'RetainingArc_A', pos: [-0.22, -0.02, 0.14], rot: [0.12, -0.44, 0.28], scale: [0.98, 0.96, 0.92] },
        { name: 'RetainingArc_B', pos: [0.18, -0.04, -0.1], rot: [-0.16, 0.62, -0.22], scale: [0.88, 0.92, 0.84] },
        { name: 'RetainingArc_C', pos: [-0.06, 0.12, -0.22], rot: [0.94, 0.18, 1.12], scale: [0.74, 0.82, 0.72] },
        { name: 'RetainingArc_D', pos: [0.08, 0.26, 0.18], rot: [0.6, 1.24, 0.34], scale: [0.62, 0.74, 0.58] }
      ];
      braceConfigs.forEach((cfg, idx) => {
        const brace = new THREE.Mesh(geometries.braceGeometry, materials.braceMat);
        brace.name = cfg.name;
        brace.userData.ignoreWaveColor = true;
        brace.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        brace.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.06,
          cfg.rot[1] + (rng() - 0.5) * 0.08,
          cfg.rot[2] + (rng() - 0.5) * 0.06
        );
        brace.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        brace.renderOrder = archOrder;
        stabilizationGroup.add(brace);

        const braceEdges = new THREE.LineSegments(geometries.braceEdgesGeometry, materials.braceEdgeMat);
        braceEdges.name = `${cfg.name}_Edges`;
        braceEdges.userData.ignoreWaveColor = true;
        braceEdges.position.copy(brace.position);
        braceEdges.rotation.copy(brace.rotation);
        braceEdges.scale.copy(brace.scale);
        braceEdges.renderOrder = archOrder;
        stabilizationGroup.add(braceEdges);

        if (idx < 2) {
          const keystone = new THREE.Mesh(geometries.shardGeometry, materials.shardMat);
          keystone.name = `StabilityKeystone_${idx}`;
          keystone.userData.ignoreWaveColor = true;
          keystone.position.copy(brace.position).add(new THREE.Vector3(-0.04 + idx * 0.12, 0.16 + idx * 0.08, 0.04 - idx * 0.06));
          keystone.rotation.set(brace.rotation.x + 0.16, brace.rotation.y - 0.12, brace.rotation.z + 0.08);
          keystone.scale.set(0.36, 0.46, 0.34);
          keystone.renderOrder = archOrder;
          stabilizationGroup.add(keystone);
        }
      });
      root.add(stabilizationGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const relicDust = new THREE.Points(geometries.dustGeometry, materials.dustMat);
      relicDust.name = 'RelicDust';
      relicDust.userData.ignoreWaveColor = true;
      relicDust.frustumCulled = false;
      relicDust.renderOrder = archOrder;
      auraGroup.add(relicDust);

      const haloPoints = new THREE.Points(geometries.haloGeometry, materials.haloMat);
      haloPoints.name = 'SanctumHaloPoints';
      haloPoints.userData.ignoreWaveColor = true;
      haloPoints.frustumCulled = false;
      haloPoints.renderOrder = archOrder;
      auraGroup.add(haloPoints);

      const shell1 = createNodeHologramShell(coreMesh, 0xe8f8ff);
      if (shell1) {
        shell1.name = 'MythicShell_1';
        shell1.position.copy(coreMesh.position);
        shell1.quaternion.copy(coreMesh.quaternion);
        shell1.scale.copy(coreMesh.scale).multiplyScalar(1.08);
        shell1.frustumCulled = false;
        shell1.renderOrder = archOrder;
        if (shell1.material?.uniforms?.uOpacity) shell1.material.uniforms.uOpacity.value = 0.046;
        auraGroup.add(shell1);
      }

      const shell2 = createNodeHologramShell(coreMesh, 0xe8f8ff);
      if (shell2) {
        shell2.name = 'MythicShell_2';
        shell2.position.copy(coreMesh.position);
        shell2.quaternion.copy(coreMesh.quaternion);
        shell2.scale.copy(coreMesh.scale).multiplyScalar(1.16);
        shell2.frustumCulled = false;
        shell2.renderOrder = archOrder;
        if (shell2.material?.uniforms?.uOpacity) shell2.material.uniforms.uOpacity.value = 0.03;
        auraGroup.add(shell2);
      }

      const edgeGlow = createNodeNeonEdgeGlowShell(coreMesh, 0xdff8ff, {
        glowIntensity: 0.72,
        edgeWidth: 0.07,
        pulseAmount: 0.0
      });
      if (edgeGlow) {
        edgeGlow.name = 'MythicEdgeGlow';
        edgeGlow.position.copy(coreMesh.position);
        edgeGlow.quaternion.copy(coreMesh.quaternion);
        edgeGlow.scale.copy(coreMesh.scale).multiplyScalar(1.01);
        edgeGlow.frustumCulled = false;
        edgeGlow.renderOrder = archOrder;
        auraGroup.add(edgeGlow);
      }

      root.add(auraGroup);

      root.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'mythic-ancient-core-with-missing');
        }
      });

      root.userData.visualReady = true;
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'MYTHIC_ANCIENT_CORE_WITH_MISSING';
      group.add(root);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createMythicAncientCoreWithMissingNode',
        category: 'mythic',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  static createMythicCollapsedCrownNode(group, visualCode, color) {
    try {
      const geometries = _getMythicCollapsedCrownGeometries();
      const materials = _getMythicCollapsedCrownMaterials(color);
      const root = new THREE.Group();
      root.name = 'MYTHIC_COLLAPSED_CROWN_NODE';
      root.userData.visualVariant = 'MYTHIC_COLLAPSED_CROWN_FALLEN_SOVEREIGN_V4';
      root.userData.mythicVariant = 'FALLEN_SOVEREIGN_CROWN';
      root.userData.nodeGeometryName = 'MYTHIC_COLLAPSED_CROWN';

      const seed = group?.userData?.nodeId ? hashString(group.userData.nodeId) : (Number.isFinite(visualCode) ? visualCode : 906);
      const rng = _mythicSeededRng(seed);
      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const coreMesh = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      coreMesh.name = 'CoronationHeart';
      coreMesh.userData.ignoreWaveColor = true;
      coreMesh.position.set(0.02, 0.16, -0.02);
      coreMesh.rotation.set(0.14, -0.28, 0.1);
      coreMesh.scale.set(1.0, 1.16, 0.92);
      coreMesh.renderOrder = coreOrder;
      coreMesh.userData.isCore = true;
      coreGroup.add(coreMesh);

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'HardEdgeCage';
      coreEdges.userData.ignoreWaveColor = true;
      coreEdges.position.copy(coreMesh.position);
      coreEdges.rotation.copy(coreMesh.rotation);
      coreEdges.scale.copy(coreMesh.scale);
      coreEdges.renderOrder = archOrder;
      coreGroup.add(coreEdges);

      const voidSeam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      voidSeam.name = 'ThroneVoidSeam';
      voidSeam.userData.ignoreWaveColor = true;
      voidSeam.position.set(0.04, 0.24, 0.06);
      voidSeam.rotation.set(0.32, 0.64, -0.18);
      voidSeam.scale.set(0.92, 1.0, 0.88);
      voidSeam.renderOrder = archOrder;
      coreGroup.add(voidSeam);

      const sovereignSeed = new THREE.Mesh(geometries.seedGeometry, materials.seedMat);
      sovereignSeed.name = 'SovereignSeed';
      sovereignSeed.userData.ignoreWaveColor = true;
      sovereignSeed.position.set(0.03, 0.36, 0.03);
      sovereignSeed.rotation.set(-0.28, 0.18, 0.4);
      sovereignSeed.scale.set(0.92, 1.0, 0.82);
      sovereignSeed.renderOrder = archOrder;
      coreGroup.add(sovereignSeed);

      root.add(coreGroup);

      const crownGroup = new THREE.Group();
      crownGroup.name = 'CROWN_GROUP';
      const tineConfigs = [
        { name: 'CrownTine_A', pos: [-0.48, -0.08, 0.12], rot: [0.36, -0.74, 0.72], scale: [0.92, 0.98, 0.86], mat: materials.tineMatA },
        { name: 'CrownTine_B', pos: [-0.3, 0.06, -0.16], rot: [0.44, 0.24, 0.46], scale: [0.82, 0.92, 0.76], mat: materials.tineMatB },
        { name: 'CrownTine_C', pos: [-0.06, -0.02, 0.34], rot: [0.52, -1.18, 0.16], scale: [0.72, 0.84, 0.68], mat: materials.tineMatA },
        { name: 'CrownTine_D', pos: [0.16, 0.02, -0.32], rot: [0.38, 1.1, -0.24], scale: [0.76, 0.88, 0.7], mat: materials.tineMatB },
        { name: 'CrownTine_E', pos: [0.36, 0.12, 0.08], rot: [0.24, 0.52, -0.54], scale: [0.86, 0.96, 0.8], mat: materials.tineMatA },
        { name: 'CrownTine_F', pos: [0.5, -0.02, -0.02], rot: [0.08, 0.18, -0.82], scale: [0.92, 1.04, 0.82], mat: materials.tineMatB }
      ];
      tineConfigs.forEach((cfg, idx) => {
        const tine = new THREE.Mesh(geometries.tineGeometry, cfg.mat);
        tine.name = cfg.name;
        tine.userData.ignoreWaveColor = true;
        tine.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        tine.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.08,
          cfg.rot[1] + (rng() - 0.5) * 0.1,
          cfg.rot[2] + (rng() - 0.5) * 0.08
        );
        tine.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        tine.renderOrder = coreOrder;
        crownGroup.add(tine);

        const tineEdges = new THREE.LineSegments(geometries.tineEdgesGeometry, materials.edgeMat);
        tineEdges.name = `${cfg.name}_Edges`;
        tineEdges.userData.ignoreWaveColor = true;
        tineEdges.position.copy(tine.position);
        tineEdges.rotation.copy(tine.rotation);
        tineEdges.scale.copy(tine.scale).multiplyScalar(idx < 2 ? 1.0 : 0.96);
        tineEdges.renderOrder = archOrder;
        crownGroup.add(tineEdges);
      });

      const crescentConfigs = [
        { name: 'CrownBand_A', pos: [-0.08, -0.18, 0.14], rot: [0.22, -0.18, -0.18], scale: [0.98, 0.96, 0.9] },
        { name: 'CrownBand_B', pos: [0.1, 0.26, -0.16], rot: [2.86, 0.44, 0.34], scale: [0.72, 0.78, 0.7] }
      ];
      crescentConfigs.forEach((cfg, idx) => {
        const crescent = new THREE.Mesh(geometries.crescentGeometry, materials.crescentMat);
        crescent.name = cfg.name;
        crescent.userData.ignoreWaveColor = true;
        crescent.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        crescent.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        crescent.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        crescent.renderOrder = archOrder;
        crownGroup.add(crescent);

        const crescentEdges = new THREE.LineSegments(geometries.crescentEdgesGeometry, materials.crescentEdgeMat);
        crescentEdges.name = `${cfg.name}_Edges`;
        crescentEdges.userData.ignoreWaveColor = true;
        crescentEdges.position.copy(crescent.position);
        crescentEdges.rotation.copy(crescent.rotation);
        crescentEdges.scale.copy(crescent.scale).multiplyScalar(idx === 0 ? 1.0 : 0.94);
        crescentEdges.renderOrder = archOrder;
        crownGroup.add(crescentEdges);
      });

      const diademRemnant = new THREE.Mesh(geometries.remnantGeometry, materials.remnantMat);
      diademRemnant.name = 'DiademRemnant';
      diademRemnant.userData.ignoreWaveColor = true;
      diademRemnant.position.set(0.1, 0.82, -0.04);
      diademRemnant.rotation.set(0.58 + (rng() - 0.5) * 0.1, 0.32 + (rng() - 0.5) * 0.12, -0.12 + (rng() - 0.5) * 0.08);
      diademRemnant.scale.set(0.84, 0.94, 0.76);
      diademRemnant.renderOrder = archOrder;
      crownGroup.add(diademRemnant);

      const diademEdges = new THREE.LineSegments(geometries.remnantEdgesGeometry, materials.edgeMat);
      diademEdges.name = 'DiademRemnant_Edges';
      diademEdges.userData.ignoreWaveColor = true;
      diademEdges.position.copy(diademRemnant.position);
      diademEdges.rotation.copy(diademRemnant.rotation);
      diademEdges.scale.copy(diademRemnant.scale);
      diademEdges.renderOrder = archOrder;
      crownGroup.add(diademEdges);

      root.add(crownGroup);

      const pressureGroup = new THREE.Group();
      pressureGroup.name = 'PRESSURE_GROUP';
      const braceConfigs = [
        { name: 'BurdenRib_A', pos: [-0.22, -0.18, 0.14], rot: [0.08, -0.42, 0.22], scale: [0.96, 0.94, 0.9] },
        { name: 'BurdenRib_B', pos: [0.22, -0.14, -0.08], rot: [-0.12, 0.66, -0.18], scale: [0.86, 0.9, 0.82] },
        { name: 'BurdenRib_C', pos: [-0.04, 0.02, -0.24], rot: [0.96, 0.22, 1.06], scale: [0.7, 0.8, 0.68] },
        { name: 'BurdenRib_D', pos: [0.04, 0.14, 0.18], rot: [0.52, 1.18, 0.28], scale: [0.6, 0.72, 0.58] }
      ];
      braceConfigs.forEach((cfg, idx) => {
        const brace = new THREE.Mesh(geometries.braceGeometry, materials.braceMat);
        brace.name = cfg.name;
        brace.userData.ignoreWaveColor = true;
        brace.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        brace.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.06,
          cfg.rot[1] + (rng() - 0.5) * 0.08,
          cfg.rot[2] + (rng() - 0.5) * 0.06
        );
        brace.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        brace.renderOrder = archOrder;
        pressureGroup.add(brace);

        const braceEdges = new THREE.LineSegments(geometries.braceEdgesGeometry, materials.braceEdgeMat);
        braceEdges.name = `${cfg.name}_Edges`;
        braceEdges.userData.ignoreWaveColor = true;
        braceEdges.position.copy(brace.position);
        braceEdges.rotation.copy(brace.rotation);
        braceEdges.scale.copy(brace.scale);
        braceEdges.renderOrder = archOrder;
        pressureGroup.add(braceEdges);

        if (idx < 2) {
          const burdenShard = new THREE.Mesh(geometries.remnantGeometry, materials.remnantMat);
          burdenShard.name = `BurdenShard_${idx}`;
          burdenShard.userData.ignoreWaveColor = true;
          burdenShard.position.copy(brace.position).add(new THREE.Vector3(0.06 - idx * 0.08, 0.18 + idx * 0.08, -0.04 + idx * 0.06));
          burdenShard.rotation.set(brace.rotation.x + 0.18, brace.rotation.y - 0.1, brace.rotation.z + 0.12);
          burdenShard.scale.set(0.32, 0.42, 0.3);
          burdenShard.renderOrder = archOrder;
          pressureGroup.add(burdenShard);
        }
      });

      root.add(pressureGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const runeAsh = new THREE.Points(geometries.dustGeometry, materials.dustMat);
      runeAsh.name = 'RuneAsh';
      runeAsh.userData.ignoreWaveColor = true;
      runeAsh.frustumCulled = false;
      runeAsh.renderOrder = archOrder;
      auraGroup.add(runeAsh);

      const haloPoints = new THREE.Points(geometries.haloGeometry, materials.haloMat);
      haloPoints.name = 'HaloPoints';
      haloPoints.userData.ignoreWaveColor = true;
      haloPoints.frustumCulled = false;
      haloPoints.renderOrder = archOrder;
      auraGroup.add(haloPoints);

      const shell1 = createNodeHologramShell(coreMesh, 0xe8f8ff);
      if (shell1) {
        shell1.name = 'MythicShell_1';
        shell1.position.copy(coreMesh.position);
        shell1.quaternion.copy(coreMesh.quaternion);
        shell1.scale.copy(coreMesh.scale).multiplyScalar(1.1);
        shell1.frustumCulled = false;
        shell1.renderOrder = archOrder;
        if (shell1.material?.uniforms?.uOpacity) shell1.material.uniforms.uOpacity.value = 0.048;
        auraGroup.add(shell1);
      }

      const shell2 = createNodeHologramShell(coreMesh, 0xe8f8ff);
      if (shell2) {
        shell2.name = 'MythicShell_2';
        shell2.position.copy(coreMesh.position);
        shell2.quaternion.copy(coreMesh.quaternion);
        shell2.scale.copy(coreMesh.scale).multiplyScalar(1.18);
        shell2.frustumCulled = false;
        shell2.renderOrder = archOrder;
        if (shell2.material?.uniforms?.uOpacity) shell2.material.uniforms.uOpacity.value = 0.03;
        auraGroup.add(shell2);
      }

      const edgeGlow = createNodeNeonEdgeGlowShell(coreMesh, 0xdff8ff, {
        glowIntensity: 0.74,
        edgeWidth: 0.072,
        pulseAmount: 0.0
      });
      if (edgeGlow) {
        edgeGlow.name = 'MythicEdgeGlow';
        edgeGlow.position.copy(coreMesh.position);
        edgeGlow.quaternion.copy(coreMesh.quaternion);
        edgeGlow.scale.copy(coreMesh.scale).multiplyScalar(1.01);
        edgeGlow.frustumCulled = false;
        edgeGlow.renderOrder = archOrder;
        auraGroup.add(edgeGlow);
      }

      root.add(auraGroup);

      root.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'mythic-collapsed-crown');
        }
      });

      root.userData.visualReady = true;
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'MYTHIC_COLLAPSED_CROWN';
      group.add(root);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createMythicCollapsedCrownNode',
        category: 'mythic',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * MYTHIC v2 visual pipeline (sacred relic look)
   * Hierarchy:
   * MYTHIC_NODE
   *   - CORE_GROUP (CoreMesh + CoreEdges)
   *   - RELIC_GROUP (GlyphRing + CrownShards instancing + FloatingRunes)
   *   - AURA_GROUP (MythicShell_1/2 + HaloPoints)
   */
  static createMythicNodeStyled_v2(group, index, color) {
    try {
      const geometries = _getMythicV2Geometries();
      const materials = _getMythicV2Materials(color);
      const mythicRoot = new THREE.Group();
      mythicRoot.name = 'MYTHIC_NODE';
      mythicRoot.userData.visualVariant = 'MYTHIC_ASCENDANT_CANON_V4';
      mythicRoot.userData.mythicVariant = 'ASCENDANT_CANON';
      mythicRoot.userData.nodeGeometryName = 'MYTHIC_ASCENDANT_CANON';
      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      // CORE
      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';
      const coreMesh = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      coreMesh.name = 'CoreMesh';
      coreMesh.userData.ignoreWaveColor = true;
      coreMesh.userData.isCore = true;
      coreMesh.position.set(0.0, 0.08, 0.0);
      coreMesh.rotation.set(0.14, -0.28, 0.08);
      coreMesh.scale.set(1.0, 1.08, 0.92);
      coreMesh.renderOrder = coreOrder;

      const coreEdges = new THREE.LineSegments(geometries.edgesGeometry, materials.edgesMat);
      coreEdges.userData.ignoreWaveColor = true;
      coreEdges.name = 'CoreEdges';
      coreEdges.position.copy(coreMesh.position);
      coreEdges.rotation.copy(coreMesh.rotation);
      coreEdges.scale.copy(coreMesh.scale);
      coreEdges.renderOrder = archOrder;

      const canonSeam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      canonSeam.name = 'CanonSeam';
      canonSeam.userData.ignoreWaveColor = true;
      canonSeam.position.set(0.06, 0.14, 0.06);
      canonSeam.rotation.set(0.26, 0.58, -0.14);
      canonSeam.scale.set(0.88, 0.96, 0.86);
      canonSeam.renderOrder = archOrder;

      coreGroup.add(coreMesh);
      coreGroup.add(coreEdges);
      coreGroup.add(canonSeam);
      mythicRoot.add(coreGroup);

      // RELIC
      const relicGroup = new THREE.Group();
      relicGroup.name = 'RELIC_GROUP';

      const glyphRing = new THREE.Mesh(geometries.ringGeometry, materials.ringMat);
      glyphRing.name = 'GlyphRing';
      glyphRing.userData.ignoreWaveColor = true;
      glyphRing.position.set(-0.04, 0.0, 0.12);
      glyphRing.rotation.set(0.18, -0.08, -0.12);
      glyphRing.scale.set(1.0, 1.04, 0.94);
      glyphRing.renderOrder = archOrder;
      relicGroup.add(glyphRing);

      const canonCrescentA = new THREE.Mesh(geometries.ringGeometry, materials.ringMat);
      canonCrescentA.name = 'CanonCrescent_A';
      canonCrescentA.userData.ignoreWaveColor = true;
      canonCrescentA.position.set(0.14, 0.28, -0.12);
      canonCrescentA.rotation.set(Math.PI * 1.02, 0.44, 0.28);
      canonCrescentA.scale.set(0.72, 0.78, 0.68);
      canonCrescentA.renderOrder = archOrder;
      relicGroup.add(canonCrescentA);

      const canonCrescentB = new THREE.Mesh(geometries.ringGeometry, materials.ringMat);
      canonCrescentB.name = 'CanonCrescent_B';
      canonCrescentB.userData.ignoreWaveColor = true;
      canonCrescentB.position.set(-0.18, 0.42, 0.04);
      canonCrescentB.rotation.set(-0.2, -0.92, 0.42);
      canonCrescentB.scale.set(0.58, 0.64, 0.54);
      canonCrescentB.renderOrder = archOrder;
      relicGroup.add(canonCrescentB);

      const crownPositions = _getMythicV2CrownPositions(geometries.coreGeometry);
      const shardCount = crownPositions.length;
      const crown = new THREE.InstancedMesh(geometries.shardGeometry, materials.shardMat, shardCount);
      crown.name = 'CrownShards';
      crown.userData.ignoreWaveColor = true;
      crown.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const rng = _mythicSeededRng(group?.userData?.nodeId ? hashString(group.userData.nodeId) : index || 1);
      const up = new THREE.Vector3(0, 1, 0);
      const scratch = new THREE.Object3D();
      crownPositions.forEach((pos, i) => {
        const dir = pos.clone().normalize();
        scratch.position.copy(pos);
        scratch.quaternion.setFromUnitVectors(up, dir);
        const roll = rng() * Math.PI * 2;
        scratch.rotateY(roll);
        const scale = (i % 2 === 0 ? 0.82 : 0.64) + rng() * 0.24;
        scratch.scale.set(scale * 0.94, scale * 1.2, scale * 0.82);
        scratch.updateMatrix();
        crown.setMatrixAt(i, scratch.matrix);
      });
      crown.instanceMatrix.needsUpdate = true;
      crown.renderOrder = archOrder;
      relicGroup.add(crown);

      // Floating runes (points cloud)
      const runes = new THREE.Points(geometries.runeGeometry, materials.runeMat);
      runes.name = 'FloatingRunes';
      runes.userData.ignoreWaveColor = true;
      runes.frustumCulled = false;
      runes.renderOrder = archOrder;
      relicGroup.add(runes);

      mythicRoot.add(relicGroup);

      // AURA
      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const halo = new THREE.Points(geometries.haloGeometry, materials.haloMat);
      halo.name = 'HaloPoints';
      halo.userData.ignoreWaveColor = true;
      halo.frustumCulled = false;
      halo.renderOrder = archOrder;
      auraGroup.add(halo);

      const shell1 = createNodeHologramShell(coreMesh, 0xe8f8ff);
      if (shell1) {
        shell1.name = 'MythicShell_1';
        shell1.position.copy(coreMesh.position);
        shell1.quaternion.copy(coreMesh.quaternion);
        shell1.scale.copy(coreMesh.scale).multiplyScalar(1.1);
        shell1.frustumCulled = false;
        shell1.renderOrder = archOrder;
        if (shell1.material?.uniforms?.uOpacity) shell1.material.uniforms.uOpacity.value = 0.05;
        auraGroup.add(shell1);
      }
      const shell2 = createNodeHologramShell(coreMesh, 0xe8f8ff);
      if (shell2) {
        shell2.name = 'MythicShell_2';
        shell2.position.copy(coreMesh.position);
        shell2.quaternion.copy(coreMesh.quaternion);
        shell2.scale.copy(coreMesh.scale).multiplyScalar(1.18);
        shell2.frustumCulled = false;
        shell2.renderOrder = archOrder;
        if (shell2.material?.uniforms?.uOpacity) shell2.material.uniforms.uOpacity.value = 0.032;
        auraGroup.add(shell2);
      }

      const edgeShell = createNodeNeonEdgeGlowShell(coreMesh, 0xdff8ff, {
        glowIntensity: 0.76,
        edgeWidth: 0.072,
        pulseAmount: 0.0
      });
      if (edgeShell) {
        edgeShell.name = 'MythicEdgeGlow';
        edgeShell.position.copy(coreMesh.position);
        edgeShell.quaternion.copy(coreMesh.quaternion);
        edgeShell.scale.copy(coreMesh.scale).multiplyScalar(1.01);
        edgeShell.frustumCulled = false;
        edgeShell.renderOrder = archOrder;
        auraGroup.add(edgeShell);
      }

      mythicRoot.add(auraGroup);

      mythicRoot.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments || o?.isInstancedMesh) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          if (!o.isInstancedMesh) {
            validateMeshGeometry(o, o.name || 'mythic-v2');
          }
        }
      });

      mythicRoot.userData.visualReady = true;
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'MYTHIC_V2';
      group.add(mythicRoot);
      return group;
    } catch (err) {
      console.error('[MythicV2Abort]', { reason: err?.message || err });
      return null;
    }
  }

  // ===== PRIME NODES (Perfect Axioms - 6 variants) =====

  /**
  * Main prime node creator
  * CANONICAL CATEGORY: PRIME
  * - NestedIcosahedron, PerfectDodecahedron, StellaOctangula
  * - PrecisionLattice, TesseractProjection, SymmetryLockedCore
  */
  /**
   * PRIME flagship stabilizer pipeline (live 1008 path, no spawn changes)
   * Hierarchy:
   * PRIME_NODE
   *   - CORE_GROUP (spiked icosa core + cold seam + edge cage)
   *   - STRUCTURE_GROUP (split sovereign arcs + stabilizer vanes + law braces)
   *   - AURA_GROUP (dual hologram shells + restrained halo points + edge glow)
   */
  static createPrimeNodeStyled_v2(group, index, color) {
    try {
      const geometries = _getPrimeV2Geometries();
      const materials = _getPrimeV2Materials(color);
      const coreMatLocal = materials.coreMat.clone();
      const seamMatLocal = materials.seamMat.clone();
      const arcMatPrimary = materials.arcMatA.clone();
      const arcMatSecondary = materials.arcMatB.clone();
      const latticeMatLocal = materials.latticeMat.clone();
      const vaneMatLocal = materials.vaneMat.clone();
      const braceMatLocal = materials.braceMat.clone();
      coreMatLocal.userData = { ...(coreMatLocal.userData || {}), wavePatchMode: 'DEFAULT' };
      seamMatLocal.userData = { ...(seamMatLocal.userData || {}), wavePatchMode: 'DEFAULT' };
      arcMatPrimary.userData = { ...(arcMatPrimary.userData || {}), wavePatchMode: 'DEFAULT' };
      arcMatSecondary.userData = { ...(arcMatSecondary.userData || {}), wavePatchMode: 'DEFAULT' };
      latticeMatLocal.userData = { ...(latticeMatLocal.userData || {}), wavePatchMode: 'DEFAULT' };
      vaneMatLocal.userData = { ...(vaneMatLocal.userData || {}), wavePatchMode: 'DEFAULT' };
      braceMatLocal.userData = { ...(braceMatLocal.userData || {}), wavePatchMode: 'DEFAULT' };

      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();
      const primeRoot = new THREE.Group();
      primeRoot.name = 'PRIME_NODE';
      primeRoot.userData.visualVariant = 'PRIME_SOVEREIGN_APEX_V4';
      primeRoot.userData.primeVariant = 'SOVEREIGN_APEX';
      primeRoot.userData.nodeGeometryName = 'PRIME_NODE_STYLED_V2';

      // CORE
      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';
      const coreMesh = new THREE.Mesh(geometries.coreGeometry, coreMatLocal);
      coreMesh.name = 'PrimeCore';
      coreMesh.userData.ignoreWaveColor = true;
      coreMesh.position.set(0.02, 0.08, 0.0);
      coreMesh.rotation.set(0.16, 0.46, -0.12);
      coreMesh.scale.set(1.02, 1.08, 0.98);
      coreMesh.material.transparent = false;
      coreMesh.material.opacity = 1.0;
      coreMesh.material.depthWrite = true;
      coreMesh.material.depthTest = true;
      coreMesh.material.blending = THREE.NormalBlending;
      coreMesh.material.side = THREE.FrontSide;
      coreMesh.renderOrder = coreOrder;

      const coreEdges = new THREE.LineSegments(geometries.edgesGeometry, materials.edgesMat);
      coreEdges.name = 'CoreEdges';
      coreEdges.userData.ignoreWaveColor = true;
      coreEdges.position.copy(coreMesh.position);
      coreEdges.rotation.copy(coreMesh.rotation);
      coreEdges.scale.copy(coreMesh.scale);
      coreEdges.renderOrder = archOrder;
      coreEdges.material.depthTest = true;
      coreEdges.material.depthWrite = false;

      const seam = new THREE.Mesh(geometries.seamGeometry, seamMatLocal);
      seam.name = 'PrimeColdSeam';
      seam.userData.ignoreWaveColor = true;
      seam.position.set(-0.04, 0.09, 0.04);
      seam.rotation.set(0.24, -0.34, 0.16);
      seam.scale.set(0.84, 1.0, 0.94);
      seam.renderOrder = coreOrder;

      const cage = new THREE.LineSegments(geometries.cageEdgesGeometry, materials.cageMat);
      cage.name = 'PrimeCoreCage';
      cage.userData.ignoreWaveColor = true;
      cage.position.copy(coreMesh.position);
      cage.rotation.copy(coreMesh.rotation);
      cage.scale.copy(coreMesh.scale);
      cage.renderOrder = archOrder;
      cage.material.depthTest = true;
      cage.material.depthWrite = false;

      const latticePositions = _getPrimeV2LatticePositions(geometries.coreGeometry);
      const latticeCount = Math.max(0, latticePositions.length);
      const lattice = new THREE.InstancedMesh(geometries.latticeGeometry, latticeMatLocal, latticeCount);
      lattice.name = 'LatticeInstances';
      lattice.userData.ignoreWaveColor = true;
      lattice.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      lattice.renderOrder = coreOrder;
      lattice.material.transparent = false;
      lattice.material.depthWrite = true;
      lattice.material.depthTest = true;
      lattice.material.blending = THREE.NormalBlending;

      const up = new THREE.Vector3(0, 1, 0);
      const scratch = new THREE.Object3D();
      const axisQuat = new THREE.Quaternion();
      const coreQuat = coreMesh.quaternion.clone();
      latticePositions.forEach((pos, i) => {
        const localDir = pos.clone().normalize();
        const worldDir = localDir.clone().applyQuaternion(coreQuat).normalize();
        const sovereignBias = THREE.MathUtils.clamp(
          0.7 +
          Math.max(0, localDir.y) * 0.52 +
          Math.max(0, localDir.x) * 0.24 +
          Math.max(0, -localDir.z) * 0.14 -
          Math.max(0, -localDir.x) * 0.18,
          0.56,
          1.58
        );
        scratch.position.copy(pos.clone().multiplyScalar(1.06 + sovereignBias * 0.08).applyQuaternion(coreQuat).add(coreMesh.position));
        scratch.quaternion.setFromUnitVectors(up, worldDir);
        axisQuat.setFromAxisAngle(worldDir, ((i % 2 === 0) ? 1 : -1) * (0.06 + sovereignBias * 0.03));
        scratch.quaternion.multiply(axisQuat);
        scratch.scale.set(
          0.92 + sovereignBias * 0.12,
          0.72 + sovereignBias * 0.48,
          0.92 + sovereignBias * 0.12
        );
        scratch.updateMatrix();
        lattice.setMatrixAt(i, scratch.matrix);
      });
      lattice.instanceMatrix.needsUpdate = true;

      coreGroup.add(coreMesh);
      coreGroup.add(coreEdges);
      coreGroup.add(seam);
      coreGroup.add(cage);
      coreGroup.add(lattice);
      primeRoot.add(coreGroup);

      // STRUCTURE
      const structureGroup = new THREE.Group();
      structureGroup.name = 'STRUCTURE_GROUP';

      const dominantArc = new THREE.Mesh(geometries.dominantArcGeometry, arcMatPrimary);
      dominantArc.name = 'SovereignArc_A';
      dominantArc.userData.ignoreWaveColor = true;
      dominantArc.position.set(0.14, 0.08, -0.02);
      dominantArc.rotation.set(Math.PI / 2 + 0.26, -0.16, 0.52);
      dominantArc.scale.set(1.0, 1.16, 0.92);
      dominantArc.renderOrder = archOrder;
      structureGroup.add(dominantArc);

      const counterArc = new THREE.Mesh(geometries.counterArcGeometry, arcMatSecondary);
      counterArc.name = 'CounterArc_B';
      counterArc.userData.ignoreWaveColor = true;
      counterArc.position.set(-0.16, 0.04, 0.16);
      counterArc.rotation.set(0.34, 0.88, 1.08);
      counterArc.scale.set(0.98, 1.02, 0.9);
      counterArc.renderOrder = archOrder;
      structureGroup.add(counterArc);

      const fragmentArc = new THREE.Mesh(geometries.fragmentArcGeometry, arcMatSecondary.clone());
      fragmentArc.name = 'CounterweightArc_C';
      fragmentArc.userData.ignoreWaveColor = true;
      fragmentArc.position.set(-0.54, -0.02, -0.2);
      fragmentArc.rotation.set(1.02, -0.24, -0.72);
      fragmentArc.scale.set(0.9, 0.96, 0.82);
      fragmentArc.renderOrder = archOrder;
      structureGroup.add(fragmentArc);

      const vaneConfigs = [
        { name: 'StabilizerVane_A', pos: [0.44, 0.18, -0.12], rot: [0.34, -0.26, 0.56], scale: [1.0, 1.14, 0.96] },
        { name: 'StabilizerVane_B', pos: [-0.34, -0.08, 0.3], rot: [-0.18, 0.46, -0.82], scale: [0.78, 0.9, 0.78] }
      ];
      vaneConfigs.forEach((cfg, idx) => {
        const vane = new THREE.Mesh(geometries.vaneGeometry, (idx === 0 ? vaneMatLocal : arcMatSecondary.clone()));
        vane.name = cfg.name;
        vane.userData.ignoreWaveColor = true;
        vane.position.set(...cfg.pos);
        vane.rotation.set(...cfg.rot);
        vane.scale.set(...cfg.scale);
        vane.renderOrder = archOrder;
        structureGroup.add(vane);
      });

      const braceConfigs = [
        { name: 'LawBrace_A', pos: [0.24, -0.18, -0.3], rot: [0.92, 0.08, 0.36], scale: [0.92, 1.0, 0.88] },
        { name: 'LawBrace_B', pos: [-0.3, 0.3, 0.08], rot: [0.42, -0.58, -0.22], scale: [0.76, 0.88, 0.74] }
      ];
      braceConfigs.forEach((cfg) => {
        const brace = new THREE.Mesh(geometries.braceGeometry, braceMatLocal.clone());
        brace.name = cfg.name;
        brace.userData.ignoreWaveColor = true;
        brace.position.set(...cfg.pos);
        brace.rotation.set(...cfg.rot);
        brace.scale.set(...cfg.scale);
        brace.renderOrder = archOrder;
        structureGroup.add(brace);
      });

      primeRoot.add(structureGroup);

      // AURA
      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';
      const haloPoints = new THREE.Points(geometries.haloGeometry, materials.haloPointMat);
      haloPoints.name = 'HaloPoints';
      haloPoints.userData.ignoreWaveColor = true;
      haloPoints.position.set(0.02, 0.1, -0.02);
      haloPoints.renderOrder = archOrder;
      auraGroup.add(haloPoints);

      const shell1 = createNodeHologramShell(coreMesh, 0xd9f8ff);
      if (shell1) {
        shell1.name = 'PrimeShell_1';
        shell1.scale.setScalar(1.05);
        shell1.frustumCulled = false;
        shell1.renderOrder = archOrder;
        if (shell1.material) {
          shell1.material.depthTest = true;
          shell1.material.depthWrite = false;
          shell1.material.blending = THREE.NormalBlending;
          if (shell1.material.uniforms?.uOpacity) {
            shell1.material.uniforms.uOpacity.value = 0.045;
          }
        }
        auraGroup.add(shell1);
      }
      const shell2 = createNodeHologramShell(coreMesh, 0xc8eeff);
      if (shell2) {
        shell2.name = 'PrimeShell_2';
        shell2.scale.setScalar(1.1);
        shell2.frustumCulled = false;
        shell2.renderOrder = archOrder;
        if (shell2.material) {
          shell2.material.depthTest = true;
          shell2.material.depthWrite = false;
          shell2.material.blending = THREE.NormalBlending;
          if (shell2.material.uniforms?.uOpacity) {
            shell2.material.uniforms.uOpacity.value = 0.03;
          }
        }
        auraGroup.add(shell2);
      }

      const edgeShell = createNodeNeonEdgeGlowShell(coreMesh);
      if (edgeShell) {
        edgeShell.name = 'PrimeEdgeGlow';
        edgeShell.frustumCulled = false;
        edgeShell.renderOrder = archOrder;
        auraGroup.add(edgeShell);
      }
      primeRoot.add(auraGroup);

      group.userData = group.userData || {};
      group.userData.nodeGeometryName = 'PRIME_NODE_STYLED_V2';
      group.userData.visualReady = true;
      primeRoot.userData.visualReady = true;
      primeRoot.scale.setScalar(0.75);
      group.add(primeRoot);
      return group;
    } catch (err) {
      console.error('[PrimeSovereignApexAbort]', { reason: err?.message || err, index });
      return null;
    }
  }

  // Legacy PRIME visuals (kept as fallback)
  static _createPrimeGeometry(builderFn, label) {
    const root = new THREE.Group();
    const nodeObj = builderFn?.call(CanonicalGeometryFamilies, 1.0);
    if (!isValidNodeObject(nodeObj)) throw new Error(`Prime builder failed: ${label}`);
    if (nodeObj.isMesh) {
      validateMeshGeometry(nodeObj, label);
    } else if (nodeObj.isGroup) {
      nodeObj.traverse((child) => {
        if (child?.isMesh && child.geometry) {
          validateMeshGeometry(child, `${label}:${child.name || 'mesh'}`);
        }
      });
    }
    if (!nodeObj.userData) nodeObj.userData = {};
    nodeObj.userData.category = 'prime';
    nodeObj.userData.visualReady = true;
    root.add(nodeObj);
    return root;
  }

  static createPrimeNestedIcosahedronNode(group, visualCode, color) {
    try {
      const geometries = _getPrimeGenesisChrysalisGeometries();
      const materials = _getPrimeGenesisChrysalisMaterials(color);
      const primeRoot = new THREE.Group();
      primeRoot.name = 'PRIME_GENESIS_CHRYSALIS_NODE';
      primeRoot.userData.visualVariant = 'PRIME_GENESIS_CHRYSALIS_V4';
      primeRoot.userData.nodeGeometryName = 'PRIME_NESTED_ICOSAHEDRON';

      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const coreMesh = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      coreMesh.name = 'PrimeAxiomCore';
      coreMesh.userData.ignoreWaveColor = true;
      coreMesh.position.set(0.0, 0.08, 0.0);
      coreMesh.rotation.set(0.12, 0.26, -0.06);
      coreMesh.renderOrder = coreOrder;
      coreGroup.add(coreMesh);

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'PrimeAxiomCoreEdges';
      coreEdges.userData.ignoreWaveColor = true;
      coreEdges.position.copy(coreMesh.position);
      coreEdges.rotation.copy(coreMesh.rotation);
      coreEdges.renderOrder = archOrder;
      coreGroup.add(coreEdges);

      const seed = new THREE.Mesh(geometries.seedGeometry, materials.seedMat);
      seed.name = 'PrimeGenesisSeed';
      seed.userData.ignoreWaveColor = true;
      seed.position.set(0.02, 0.1, -0.02);
      seed.rotation.set(0.22, 0.46, -0.08);
      seed.renderOrder = coreOrder;
      coreGroup.add(seed);

      const seam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      seam.name = 'PrimeDreadSeam';
      seam.userData.ignoreWaveColor = true;
      seam.position.set(-0.03, 0.08, 0.04);
      seam.rotation.set(0.14, -0.38, 0.04);
      seam.renderOrder = coreOrder;
      coreGroup.add(seam);

      primeRoot.add(coreGroup);

      const chrysalisGroup = new THREE.Group();
      chrysalisGroup.name = 'CHRYSALIS_GROUP';

      const huskConfigs = [
        { name: 'SanctumHusk_A', pos: [0.06, 0.52, 0.04], rot: [0.82, 0.12, 0.18], scale: [1.12, 1.18, 0.98] },
        { name: 'SanctumHusk_B', pos: [-0.42, 0.18, 0.18], rot: [0.34, 0.44, -0.74], scale: [0.94, 1.02, 0.9] },
        { name: 'SanctumHusk_C', pos: [0.36, -0.04, -0.18], rot: [-0.54, -0.22, 0.62], scale: [0.84, 0.9, 0.82] },
        { name: 'SanctumHusk_D', pos: [0.22, 0.32, 0.3], rot: [0.96, -0.16, 0.44], scale: [0.72, 0.8, 0.74] },
        { name: 'SanctumHusk_E', pos: [-0.18, -0.14, -0.26], rot: [-0.68, 0.82, -0.14], scale: [0.64, 0.74, 0.68] }
      ];

      huskConfigs.forEach((cfg) => {
        const husk = new THREE.Mesh(geometries.huskGeometry, materials.huskMat);
        husk.name = cfg.name;
        husk.userData.ignoreWaveColor = true;
        husk.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        husk.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        husk.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        husk.renderOrder = coreOrder;
        chrysalisGroup.add(husk);

        const huskEdges = new THREE.LineSegments(geometries.huskEdgesGeometry, materials.edgeMat);
        huskEdges.name = `${cfg.name}_Edges`;
        huskEdges.userData.ignoreWaveColor = true;
        huskEdges.position.copy(husk.position);
        huskEdges.rotation.copy(husk.rotation);
        huskEdges.scale.copy(husk.scale);
        huskEdges.renderOrder = archOrder;
        chrysalisGroup.add(huskEdges);
      });

      primeRoot.add(chrysalisGroup);

      const pressureGroup = new THREE.Group();
      pressureGroup.name = 'PRESSURE_GROUP';

      const ribConfigs = [
        { name: 'CompressionRib_A', pos: [-0.34, 0.16, 0.18], rot: [0.22, 0.38, -0.56], scale: [0.96, 1.0, 0.9] },
        { name: 'CompressionRib_B', pos: [0.3, 0.02, -0.2], rot: [-0.28, -0.54, 0.5], scale: [0.84, 0.92, 0.82] },
        { name: 'CompressionRib_C', pos: [0.14, 0.4, 0.26], rot: [0.54, -0.14, -0.22], scale: [0.74, 0.82, 0.74] }
      ];
      ribConfigs.forEach((cfg) => {
        const rib = new THREE.Mesh(geometries.ribGeometry, materials.ribMat);
        rib.name = cfg.name;
        rib.userData.ignoreWaveColor = true;
        rib.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        rib.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        rib.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        rib.renderOrder = coreOrder;
        pressureGroup.add(rib);

        const ribEdges = new THREE.LineSegments(geometries.ribEdgesGeometry, materials.edgeMat);
        ribEdges.name = `${cfg.name}_Edges`;
        ribEdges.userData.ignoreWaveColor = true;
        ribEdges.position.copy(rib.position);
        ribEdges.rotation.copy(rib.rotation);
        ribEdges.scale.copy(rib.scale);
        ribEdges.renderOrder = archOrder;
        pressureGroup.add(ribEdges);
      });

      const meridianA = new THREE.Mesh(geometries.meridianGeometry, materials.meridianMat);
      meridianA.name = 'LawTensionMeridian_A';
      meridianA.position.set(-0.02, 0.08, 0.02);
      meridianA.rotation.set(Math.PI * 0.46, 0.24, 0.16);
      meridianA.scale.set(0.96, 1.0, 0.72);
      meridianA.renderOrder = archOrder;
      pressureGroup.add(meridianA);

      const meridianB = new THREE.Mesh(geometries.meridianGeometry, materials.meridianMat.clone());
      meridianB.name = 'LawTensionMeridian_B';
      meridianB.position.set(0.06, 0.04, -0.04);
      meridianB.rotation.set(-0.18, -0.72, Math.PI * 0.52);
      meridianB.scale.set(0.62, 0.86, 0.92);
      meridianB.renderOrder = archOrder;
      pressureGroup.add(meridianB);

      primeRoot.add(pressureGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const halo = new THREE.Points(geometries.haloGeometry, materials.haloMat);
      halo.name = 'PrimeGenesisHaloPoints';
      halo.userData.ignoreWaveColor = true;
      halo.position.set(0.0, 0.08, 0.0);
      halo.rotation.set(0.06, 0.44, -0.08);
      halo.frustumCulled = false;
      halo.renderOrder = archOrder;
      auraGroup.add(halo);

      const shellColor = 0xf4fbff;
      const shell1 = createNodeHologramShell(coreMesh, shellColor);
      if (shell1) {
        shell1.name = 'PrimeGenesisShell_1';
        shell1.position.copy(coreMesh.position);
        shell1.quaternion.copy(coreMesh.quaternion);
        shell1.scale.copy(coreMesh.scale).multiplyScalar(1.12);
        shell1.frustumCulled = false;
        shell1.renderOrder = archOrder;
        if (shell1.material?.uniforms?.uOpacity) shell1.material.uniforms.uOpacity.value = 0.056;
        auraGroup.add(shell1);
      }

      const shell2 = createNodeHologramShell(coreMesh, shellColor);
      if (shell2) {
        shell2.name = 'PrimeGenesisShell_2';
        shell2.position.copy(coreMesh.position);
        shell2.quaternion.copy(coreMesh.quaternion);
        shell2.scale.copy(coreMesh.scale).multiplyScalar(1.22);
        shell2.frustumCulled = false;
        shell2.renderOrder = archOrder;
        if (shell2.material?.uniforms?.uOpacity) shell2.material.uniforms.uOpacity.value = 0.04;
        auraGroup.add(shell2);
      }

      const edgeShell = createNodeNeonEdgeGlowShell(coreMesh, 0xd6f4ff, {
        glowIntensity: 0.9,
        edgeWidth: 0.074,
        pulseAmount: 0.0
      });
      if (edgeShell) {
        edgeShell.name = 'PrimeGenesisEdgeGlow';
        edgeShell.position.copy(coreMesh.position);
        edgeShell.quaternion.copy(coreMesh.quaternion);
        edgeShell.scale.copy(coreMesh.scale).multiplyScalar(1.02);
        edgeShell.frustumCulled = false;
        edgeShell.renderOrder = archOrder;
        auraGroup.add(edgeShell);
      }

      primeRoot.add(auraGroup);

      primeRoot.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'prime-genesis-chrysalis');
        }
      });

      primeRoot.userData.visualReady = true;
      primeRoot.userData.primeVariant = 'GENESIS_CHRYSALIS';
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'PRIME_NESTED_ICOSAHEDRON';
      group.add(primeRoot);
      return group;
    } catch (err) {
      console.error('[PrimeGenesisChrysalisAbort]', {
        reason: err?.message || err,
        visualCode
      });
      return null;
    }
  }

  static createPrimePerfectDodecahedronNode(group, visualCode, color) {
    try {
      const geometries = _getPrimeImmaculateGeometries();
      const materials = _getPrimeImmaculateMaterials(color);
      const primeRoot = new THREE.Group();
      primeRoot.name = 'PRIME_IMMACULATE_ENGINE_NODE';
      primeRoot.userData.visualVariant = 'PRIME_IMMACULATE_ENGINE_V4';
      primeRoot.userData.nodeGeometryName = 'PRIME_IMMACULATE_ENGINE';

      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();
      const scratch = new THREE.Object3D();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const coreMesh = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      coreMesh.name = 'PrimeAxiomCore';
      coreMesh.userData.ignoreWaveColor = true;
      coreMesh.position.set(0.0, 0.06, 0.0);
      coreMesh.rotation.set(0.12, 0.24, -0.04);
      coreMesh.renderOrder = coreOrder;
      coreGroup.add(coreMesh);

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'PrimeAxiomCoreEdges';
      coreEdges.userData.ignoreWaveColor = true;
      coreEdges.position.copy(coreMesh.position);
      coreEdges.rotation.copy(coreMesh.rotation);
      coreEdges.renderOrder = archOrder;
      coreGroup.add(coreEdges);

      const seam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      seam.name = 'PrimeCompressedNucleus';
      seam.userData.ignoreWaveColor = true;
      seam.position.set(0.01, 0.02, -0.01);
      seam.rotation.set(0.2, 0.3, -0.06);
      seam.renderOrder = coreOrder;
      coreGroup.add(seam);

      primeRoot.add(coreGroup);

      const sanctumGroup = new THREE.Group();
      sanctumGroup.name = 'SANCTUM_GROUP';

      const chamberConfigs = [
        { name: 'LawChamber_A', pos: [0.0, 0.05, 0.0], rot: [0.16, 0.18, 0.06], scale: [1.0, 1.06, 0.94] },
        { name: 'LawChamber_B', pos: [0.0, 0.04, 0.0], rot: [-0.18, 0.9, -0.08], scale: [0.92, 1.16, 0.88] },
        { name: 'LawChamber_C', pos: [0.0, 0.02, 0.0], rot: [0.0, 0.46, Math.PI * 0.5], scale: [0.86, 1.18, 0.82] }
      ];
      chamberConfigs.forEach((cfg) => {
        const chamber = new THREE.Mesh(geometries.chamberGeometry, materials.chamberMat);
        chamber.name = cfg.name;
        chamber.userData.ignoreWaveColor = true;
        chamber.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        chamber.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        chamber.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        chamber.renderOrder = archOrder;
        sanctumGroup.add(chamber);

        const chamberEdges = new THREE.LineSegments(geometries.chamberEdgesGeometry, materials.edgeMat);
        chamberEdges.name = `${cfg.name}_Edges`;
        chamberEdges.userData.ignoreWaveColor = true;
        chamberEdges.position.copy(chamber.position);
        chamberEdges.rotation.copy(chamber.rotation);
        chamberEdges.scale.copy(chamber.scale);
        chamberEdges.renderOrder = archOrder;
        sanctumGroup.add(chamberEdges);
      });
      primeRoot.add(sanctumGroup);

      const orderGroup = new THREE.Group();
      orderGroup.name = 'ORDER_GROUP';

      const meridianA = new THREE.Mesh(geometries.meridianGeometry, materials.meridianMat);
      meridianA.name = 'PrimeMeridian_A';
      meridianA.position.set(0.0, 0.04, 0.0);
      meridianA.rotation.set(Math.PI * 0.5, 0.0, 0.0);
      meridianA.scale.set(0.96, 1.0, 0.76);
      meridianA.renderOrder = archOrder;
      orderGroup.add(meridianA);

      const meridianB = new THREE.Mesh(geometries.meridianGeometry, materials.meridianMat.clone());
      meridianB.name = 'PrimeMeridian_B';
      meridianB.position.set(0.0, 0.04, 0.0);
      meridianB.rotation.set(0.0, 0.0, Math.PI * 0.5);
      meridianB.scale.set(0.74, 1.02, 1.0);
      meridianB.renderOrder = archOrder;
      orderGroup.add(meridianB);

      const meridianC = new THREE.Mesh(geometries.meridianGeometry, materials.meridianMat.clone());
      meridianC.name = 'PrimeMeridian_C';
      meridianC.position.set(0.0, 0.04, 0.0);
      meridianC.rotation.set(Math.PI * 0.5, Math.PI * 0.26, Math.PI * 0.12);
      meridianC.scale.set(1.08, 0.9, 0.82);
      meridianC.renderOrder = archOrder;
      orderGroup.add(meridianC);

      const rails = new THREE.LineSegments(geometries.railGeometry, materials.railMat);
      rails.name = 'PrimeAxisRails';
      rails.userData.ignoreWaveColor = true;
      rails.position.set(0.0, 0.04, 0.0);
      rails.renderOrder = archOrder;
      orderGroup.add(rails);

      const keystoneCount = 12;
      const keystones = new THREE.InstancedMesh(geometries.keystoneGeometry, materials.keystoneMat, keystoneCount);
      keystones.name = 'PrimeKeystones';
      keystones.userData.ignoreWaveColor = true;
      for (let i = 0; i < keystoneCount; i++) {
        let direction;
        if (i < 8) {
          const angle = (i / 8) * Math.PI * 2;
          direction = new THREE.Vector3(Math.cos(angle) * 0.82, Math.sin(i * 1.7) * 0.08, Math.sin(angle) * 0.58).normalize();
        } else {
          const sign = i % 2 === 0 ? 1 : -1;
          direction = new THREE.Vector3(sign * 0.18, sign * 0.96, (i - 10) * 0.18).normalize();
        }
        scratch.position.copy(direction).multiplyScalar(0.86);
        scratch.lookAt(0, 0.04, 0);
        scratch.scale.setScalar(i < 8 ? 0.92 : 0.82);
        scratch.updateMatrix();
        keystones.setMatrixAt(i, scratch.matrix);
      }
      keystones.instanceMatrix.needsUpdate = true;
      keystones.renderOrder = coreOrder;
      orderGroup.add(keystones);

      primeRoot.add(orderGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const halo = new THREE.Points(geometries.haloGeometry, materials.haloMat);
      halo.name = 'PrimeHaloPoints';
      halo.userData.ignoreWaveColor = true;
      halo.position.set(0.0, 0.06, 0.0);
      halo.rotation.set(0.08, 0.42, -0.12);
      halo.frustumCulled = false;
      halo.renderOrder = archOrder;
      auraGroup.add(halo);

      const shellColor = 0xf5fbff;
      const shell1 = createNodeHologramShell(coreMesh, shellColor);
      if (shell1) {
        shell1.name = 'PrimeImmaculateShell_1';
        shell1.position.copy(coreMesh.position);
        shell1.quaternion.copy(coreMesh.quaternion);
        shell1.scale.copy(coreMesh.scale).multiplyScalar(1.12);
        shell1.frustumCulled = false;
        shell1.renderOrder = archOrder;
        if (shell1.material?.uniforms?.uOpacity) shell1.material.uniforms.uOpacity.value = 0.058;
        auraGroup.add(shell1);
      }

      const shell2 = createNodeHologramShell(coreMesh, shellColor);
      if (shell2) {
        shell2.name = 'PrimeImmaculateShell_2';
        shell2.position.copy(coreMesh.position);
        shell2.quaternion.copy(coreMesh.quaternion);
        shell2.scale.copy(coreMesh.scale).multiplyScalar(1.22);
        shell2.frustumCulled = false;
        shell2.renderOrder = archOrder;
        if (shell2.material?.uniforms?.uOpacity) shell2.material.uniforms.uOpacity.value = 0.042;
        auraGroup.add(shell2);
      }

      const edgeShell = createNodeNeonEdgeGlowShell(coreMesh, 0xd7f3ff, {
        glowIntensity: 0.9,
        edgeWidth: 0.072,
        pulseAmount: 0.0
      });
      if (edgeShell) {
        edgeShell.name = 'PrimeImmaculateEdgeGlow';
        edgeShell.position.copy(coreMesh.position);
        edgeShell.quaternion.copy(coreMesh.quaternion);
        edgeShell.scale.copy(coreMesh.scale).multiplyScalar(1.02);
        edgeShell.frustumCulled = false;
        edgeShell.renderOrder = archOrder;
        auraGroup.add(edgeShell);
      }

      primeRoot.add(auraGroup);

      primeRoot.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'prime-immaculate-engine');
        }
      });

      primeRoot.userData.visualReady = true;
      primeRoot.userData.primeVariant = 'IMMACULATE_ENGINE';
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'PRIME_IMMACULATE_ENGINE';
      group.add(primeRoot);
      return group;
    } catch (err) {
      console.error('[PrimeImmaculateAbort]', {
        reason: err?.message || err,
        visualCode
      });
      return null;
    }
  }

  static createPrimeStellaOctangulaNode(group, visualCode, color) {
    try {
      const geometries = _getPrimeStellaGeometries();
      const materials = _getPrimeStellaMaterials(color);
      const primeRoot = new THREE.Group();
      primeRoot.name = 'PRIME_STELLA_NODE';
      primeRoot.userData.visualVariant = 'PRIME_STELLA_OCTANGULA_SOVEREIGN_V4';

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const coreMesh = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      coreMesh.name = 'PrimeStellaCore';
      coreMesh.userData.ignoreWaveColor = true;
      coreMesh.rotation.set(0.08, 0.18, -0.05);
      coreMesh.renderOrder = EnhancedNodeModels._getCoreRenderOrder();
      coreGroup.add(coreMesh);

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'PrimeStellaCoreEdges';
      coreEdges.rotation.copy(coreMesh.rotation);
      coreEdges.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
      coreGroup.add(coreEdges);

      const spine = new THREE.Mesh(geometries.spineGeometry, materials.spineMat);
      spine.name = 'PrimeStellaAxisSpine';
      spine.userData.ignoreWaveColor = true;
      spine.rotation.set(0.02, 0.12, 0.04);
      spine.renderOrder = EnhancedNodeModels._getCoreRenderOrder();
      coreGroup.add(spine);

      primeRoot.add(coreGroup);

      const structureGroup = new THREE.Group();
      structureGroup.name = 'STRUCTURE_GROUP';

      const crownA = new THREE.Mesh(geometries.tetraGeometry, materials.crownMat);
      crownA.name = 'PrimeStellaCrown_A';
      crownA.userData.ignoreWaveColor = true;
      crownA.position.set(0.0, 0.16, 0.0);
      crownA.rotation.set(0.12, 0.72, 0.06);
      crownA.scale.set(1.02, 1.02, 1.02);
      crownA.renderOrder = 2;
      structureGroup.add(crownA);

      const crownB = new THREE.Mesh(geometries.tetraGeometry, materials.crownMat);
      crownB.name = 'PrimeStellaCrown_B';
      crownB.userData.ignoreWaveColor = true;
      crownB.position.set(0.0, 0.12, 0.0);
      crownB.rotation.set(Math.PI - 0.08, 0.72, -0.04);
      crownB.scale.set(0.98, 0.98, 0.98);
      crownB.renderOrder = 2;
      structureGroup.add(crownB);

      const crownEdgesA = new THREE.LineSegments(geometries.tetraEdgesGeometry, materials.edgeMat);
      crownEdgesA.name = 'PrimeStellaCrownEdges_A';
      crownEdgesA.position.copy(crownA.position);
      crownEdgesA.rotation.copy(crownA.rotation);
      crownEdgesA.scale.copy(crownA.scale);
      crownEdgesA.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
      structureGroup.add(crownEdgesA);

      const crownEdgesB = new THREE.LineSegments(geometries.tetraEdgesGeometry, materials.edgeMat);
      crownEdgesB.name = 'PrimeStellaCrownEdges_B';
      crownEdgesB.position.copy(crownB.position);
      crownEdgesB.rotation.copy(crownB.rotation);
      crownEdgesB.scale.copy(crownB.scale);
      crownEdgesB.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
      structureGroup.add(crownEdgesB);

      const bandA = new THREE.Mesh(geometries.bandGeometry, materials.bandMat);
      bandA.name = 'PrimeStellaOrbitBand_A';
      bandA.position.set(0.0, 0.1, 0.0);
      bandA.rotation.set(Math.PI * 0.5, 0.0, Math.PI * 0.12);
      bandA.scale.set(1.0, 1.0, 1.0);
      bandA.renderOrder = 1;
      structureGroup.add(bandA);

      const bandB = new THREE.Mesh(geometries.bandGeometry, materials.bandMat.clone());
      bandB.name = 'PrimeStellaOrbitBand_B';
      bandB.position.set(0.0, 0.08, 0.0);
      bandB.rotation.set(Math.PI * 0.5, Math.PI * 0.38, Math.PI * 0.34);
      bandB.scale.set(1.14, 0.92, 1.14);
      bandB.renderOrder = 1;
      structureGroup.add(bandB);

      primeRoot.add(structureGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const halo = new THREE.Points(geometries.haloGeometry, materials.haloMat);
      halo.name = 'PrimeStellaHalo';
      halo.frustumCulled = false;
      auraGroup.add(halo);

      const shellColor = 0xf2fbff;
      const shell1 = createNodeHologramShell(coreMesh, shellColor);
      if (shell1) {
        shell1.name = 'PrimeStellaShell_1';
        shell1.position.copy(coreMesh.position);
        shell1.quaternion.copy(coreMesh.quaternion);
        shell1.scale.copy(coreMesh.scale).multiplyScalar(1.16);
        shell1.frustumCulled = false;
        shell1.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
        if (shell1.material?.uniforms?.uOpacity) shell1.material.uniforms.uOpacity.value = 0.06;
        auraGroup.add(shell1);
      }

      const shell2 = createNodeHologramShell(coreMesh, shellColor);
      if (shell2) {
        shell2.name = 'PrimeStellaShell_2';
        shell2.position.copy(coreMesh.position);
        shell2.quaternion.copy(coreMesh.quaternion);
        shell2.scale.copy(coreMesh.scale).multiplyScalar(1.26);
        shell2.frustumCulled = false;
        shell2.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
        if (shell2.material?.uniforms?.uOpacity) shell2.material.uniforms.uOpacity.value = 0.042;
        auraGroup.add(shell2);
      }

      const edgeShell = createNodeNeonEdgeGlowShell(coreMesh, 0xcfefff, {
        glowIntensity: 0.95,
        edgeWidth: 0.075,
        pulseAmount: 0.0
      });
      if (edgeShell) {
        edgeShell.name = 'PrimeStellaEdgeGlow';
        edgeShell.position.copy(coreMesh.position);
        edgeShell.quaternion.copy(coreMesh.quaternion);
        edgeShell.scale.copy(coreMesh.scale).multiplyScalar(1.02);
        edgeShell.frustumCulled = false;
        edgeShell.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
        auraGroup.add(edgeShell);
      }

      primeRoot.add(auraGroup);

      primeRoot.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          validateMeshGeometry(o, o.name || 'prime-stella-octangula');
        }
      });

      primeRoot.userData.visualReady = true;
      primeRoot.userData.primeVariant = 'SOVEREIGN_STELLA';
      group.add(primeRoot);
      return group;
    } catch (err) {
      console.error('[PrimeStellaAbort]', {
        reason: err?.message || err,
        visualCode
      });
      return null;
    }
  }

  static createPrimePrecisionLatticeNode(group, visualCode, color) {
    try {
      const geometries = _getPrimeHarmonicLatticeGeometries();
      const materials = _getPrimeHarmonicLatticeMaterials(color);
      const primeRoot = new THREE.Group();
      primeRoot.name = 'PRIME_HARMONIC_LATTICE_ENGINE_NODE';
      primeRoot.userData.visualVariant = 'PRIME_HARMONIC_LATTICE_ENGINE_V4';
      primeRoot.userData.nodeGeometryName = 'PRIME_PRECISION_LATTICE';

      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const coreMesh = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      coreMesh.name = 'PrimeAxiomCore';
      coreMesh.position.set(-0.04, 0.1, 0.02);
      coreMesh.rotation.set(0.18, -0.28, 0.11);
      coreMesh.renderOrder = coreOrder;
      coreGroup.add(coreMesh);

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'PrimeAxiomCoreEdges';
      coreEdges.position.copy(coreMesh.position);
      coreEdges.rotation.copy(coreMesh.rotation);
      coreEdges.renderOrder = archOrder;
      coreGroup.add(coreEdges);

      const seed = new THREE.Mesh(geometries.seedGeometry, materials.seedMat);
      seed.name = 'PrimeCompressedSeed';
      seed.position.set(0.02, 0.11, -0.02);
      seed.rotation.set(0.24, 0.48, -0.1);
      seed.renderOrder = coreOrder;
      coreGroup.add(seed);

      const seam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      seam.name = 'PrimePrecisionSeam';
      seam.position.set(-0.01, 0.08, 0.05);
      seam.rotation.set(0.16, -0.34, 0.06);
      seam.renderOrder = coreOrder;
      coreGroup.add(seam);

      primeRoot.add(coreGroup);

      const latticeGroup = new THREE.Group();
      latticeGroup.name = 'LATTICE_GROUP';

      const latticeMeshes = [
        {
          geo: geometries.towerGeometry,
          edgeGeo: geometries.towerEdgesGeometry,
          name: 'LawTower_A',
          pos: [-0.48, 0.18, 0.16],
          rot: [0.14, 0.42, -0.24],
          scale: [0.98, 1.18, 0.92]
        },
        {
          geo: geometries.towerGeometry,
          edgeGeo: geometries.towerEdgesGeometry,
          name: 'LawTower_B',
          pos: [-0.2, 0.46, -0.18],
          rot: [-0.34, 0.76, 0.32],
          scale: [0.72, 0.92, 0.68]
        },
        {
          geo: geometries.strutGeometry,
          edgeGeo: geometries.strutEdgesGeometry,
          name: 'CathedralStrut_C',
          pos: [0.38, -0.02, -0.12],
          rot: [-0.22, -0.44, 0.22],
          scale: [0.86, 0.98, 0.82]
        },
        {
          geo: geometries.strutGeometry,
          edgeGeo: geometries.strutEdgesGeometry,
          name: 'CathedralStrut_D',
          pos: [0.22, 0.34, 0.22],
          rot: [0.42, -0.86, -0.28],
          scale: [0.62, 0.82, 0.64]
        }
      ];

      latticeMeshes.forEach((cfg) => {
        const part = new THREE.Mesh(cfg.geo, materials.structureMat);
        part.name = cfg.name;
        part.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        part.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        part.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        part.renderOrder = coreOrder;
        latticeGroup.add(part);

        const edges = new THREE.LineSegments(cfg.edgeGeo, materials.edgeMat);
        edges.name = `${cfg.name}_Edges`;
        edges.position.copy(part.position);
        edges.rotation.copy(part.rotation);
        edges.scale.copy(part.scale);
        edges.renderOrder = archOrder;
        latticeGroup.add(edges);
      });

      const panelConfigs = [
        { name: 'LawPanel_A', pos: [-0.3, 0.12, -0.04], rot: [0.2, 0.26, -0.18], scale: [0.9, 1.18, 0.92] },
        { name: 'LawPanel_B', pos: [0.16, 0.08, 0.22], rot: [-0.12, -0.62, 0.26], scale: [0.72, 0.94, 0.84] },
        { name: 'LawPanel_C', pos: [-0.02, 0.42, 0.16], rot: [-0.4, 0.86, 0.4], scale: [0.56, 0.72, 0.62] }
      ];
      panelConfigs.forEach((cfg) => {
        const panel = new THREE.LineSegments(geometries.panelGeometry, materials.panelMat);
        panel.name = cfg.name;
        panel.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        panel.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        panel.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        panel.renderOrder = archOrder;
        latticeGroup.add(panel);
      });

      primeRoot.add(latticeGroup);

      const harmonizationGroup = new THREE.Group();
      harmonizationGroup.name = 'HARMONIZATION_GROUP';

      const meridianA = new THREE.Mesh(geometries.meridianGeometry, materials.meridianMat);
      meridianA.name = 'PrimePhaseMeridian_A';
      meridianA.position.set(-0.08, 0.1, 0.02);
      meridianA.rotation.set(Math.PI * 0.46, 0.28, 0.18);
      meridianA.scale.set(0.92, 1.0, 0.7);
      meridianA.renderOrder = archOrder;
      harmonizationGroup.add(meridianA);

      const meridianB = new THREE.Mesh(geometries.meridianGeometry, materials.meridianMat.clone());
      meridianB.name = 'PrimePhaseMeridian_B';
      meridianB.position.set(0.06, 0.08, -0.02);
      meridianB.rotation.set(-0.2, -0.72, Math.PI * 0.52);
      meridianB.scale.set(0.68, 0.92, 1.02);
      meridianB.renderOrder = archOrder;
      harmonizationGroup.add(meridianB);

      const rails = new THREE.LineSegments(geometries.railGeometry, materials.railMat);
      rails.name = 'PrimeEngineRails';
      rails.position.set(0.0, 0.06, 0.0);
      rails.renderOrder = archOrder;
      harmonizationGroup.add(rails);

      const finConfigs = [
        { name: 'RegulatorFin_A', pos: [-0.54, 0.32, 0.02], rot: [0.18, 0.24, -0.88], scale: [1.0, 1.02, 0.92] },
        { name: 'RegulatorFin_B', pos: [-0.34, 0.56, -0.26], rot: [-0.44, 0.82, -0.12], scale: [0.82, 0.94, 0.88] },
        { name: 'RegulatorFin_C', pos: [0.46, 0.18, -0.22], rot: [0.2, -0.46, 0.72], scale: [0.9, 0.88, 0.82] },
        { name: 'RegulatorFin_D', pos: [0.28, -0.08, 0.26], rot: [-0.18, -1.04, 0.54], scale: [0.74, 0.84, 0.76] },
        { name: 'RegulatorFin_E', pos: [0.08, 0.44, 0.34], rot: [0.56, -0.2, -0.22], scale: [0.62, 0.76, 0.72] }
      ];
      finConfigs.forEach((cfg) => {
        const fin = new THREE.Mesh(geometries.finGeometry, materials.finMat);
        fin.name = cfg.name;
        fin.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        fin.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        fin.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        fin.renderOrder = coreOrder;
        harmonizationGroup.add(fin);

        const finEdges = new THREE.LineSegments(geometries.finEdgesGeometry, materials.edgeMat);
        finEdges.name = `${cfg.name}_Edges`;
        finEdges.position.copy(fin.position);
        finEdges.rotation.copy(fin.rotation);
        finEdges.scale.copy(fin.scale);
        finEdges.renderOrder = archOrder;
        harmonizationGroup.add(finEdges);
      });

      primeRoot.add(harmonizationGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const halo = new THREE.Points(geometries.haloGeometry, materials.haloMat);
      halo.name = 'PrimeColdHaloPoints';
      halo.position.set(0.0, 0.1, 0.0);
      halo.rotation.set(0.04, 0.54, -0.12);
      halo.frustumCulled = false;
      halo.renderOrder = archOrder;
      auraGroup.add(halo);

      const shellColor = 0xf4fbff;
      const shell1 = createNodeHologramShell(coreMesh, shellColor);
      if (shell1) {
        shell1.name = 'PrimeLatticeShell_1';
        shell1.position.copy(coreMesh.position);
        shell1.quaternion.copy(coreMesh.quaternion);
        shell1.scale.copy(coreMesh.scale).multiplyScalar(1.12);
        shell1.frustumCulled = false;
        shell1.renderOrder = archOrder;
        if (shell1.material?.uniforms?.uOpacity) shell1.material.uniforms.uOpacity.value = 0.056;
        auraGroup.add(shell1);
      }

      const shell2 = createNodeHologramShell(coreMesh, shellColor);
      if (shell2) {
        shell2.name = 'PrimeLatticeShell_2';
        shell2.position.copy(coreMesh.position);
        shell2.quaternion.copy(coreMesh.quaternion);
        shell2.scale.copy(coreMesh.scale).multiplyScalar(1.24);
        shell2.frustumCulled = false;
        shell2.renderOrder = archOrder;
        if (shell2.material?.uniforms?.uOpacity) shell2.material.uniforms.uOpacity.value = 0.04;
        auraGroup.add(shell2);
      }

      const edgeShell = createNodeNeonEdgeGlowShell(coreMesh, 0xd5f3ff, {
        glowIntensity: 0.92,
        edgeWidth: 0.074,
        pulseAmount: 0.0
      });
      if (edgeShell) {
        edgeShell.name = 'PrimeLatticeEdgeGlow';
        edgeShell.position.copy(coreMesh.position);
        edgeShell.quaternion.copy(coreMesh.quaternion);
        edgeShell.scale.copy(coreMesh.scale).multiplyScalar(1.02);
        edgeShell.frustumCulled = false;
        edgeShell.renderOrder = archOrder;
        auraGroup.add(edgeShell);
      }

      primeRoot.add(auraGroup);

      primeRoot.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'prime-harmonic-lattice-engine');
        }
      });

      primeRoot.userData.visualReady = true;
      primeRoot.userData.primeVariant = 'HARMONIC_LATTICE_ENGINE';
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'PRIME_PRECISION_LATTICE';
      group.add(primeRoot);
      return group;
    } catch (err) {
      console.error('[PrimeHarmonicLatticeAbort]', {
        reason: err?.message || err,
        visualCode
      });
      return null;
    }
  }

  static createPrimeTesseractProjectionNode(group, visualCode, color) {
    try {
      const geometries = _getPrimeForbiddenProjectionGeometries();
      const materials = _getPrimeForbiddenProjectionMaterials(color);
      const primeRoot = new THREE.Group();
      primeRoot.name = 'PRIME_FORBIDDEN_PROJECTION_NODE';
      primeRoot.userData.visualVariant = 'PRIME_FORBIDDEN_PROJECTION_SANCTUM_V4';
      primeRoot.userData.nodeGeometryName = 'PRIME_TESSERACT_PROJECTION';

      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const coreMesh = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      coreMesh.name = 'PrimeAxiomNucleus';
      coreMesh.position.set(0.0, 0.12, 0.0);
      coreMesh.rotation.set(0.16, 0.3, -0.08);
      coreMesh.renderOrder = coreOrder;
      coreGroup.add(coreMesh);

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'PrimeAxiomNucleusEdges';
      coreEdges.position.copy(coreMesh.position);
      coreEdges.rotation.copy(coreMesh.rotation);
      coreEdges.renderOrder = archOrder;
      coreGroup.add(coreEdges);

      const seed = new THREE.Mesh(geometries.seedGeometry, materials.seedMat);
      seed.name = 'PrimeSanctumSeed';
      seed.position.set(0.04, 0.14, -0.02);
      seed.rotation.set(0.28, 0.54, -0.06);
      seed.renderOrder = coreOrder;
      coreGroup.add(seed);

      const seam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      seam.name = 'PrimeLawSeam';
      seam.position.set(-0.03, 0.12, 0.05);
      seam.rotation.set(0.12, -0.36, 0.02);
      seam.renderOrder = coreOrder;
      coreGroup.add(seam);

      primeRoot.add(coreGroup);

      const projectionGroup = new THREE.Group();
      projectionGroup.name = 'PROJECTION_GROUP';

      const chamberConfigs = [
        { name: 'ProjectionVolume_A', pos: [0.0, 0.14, 0.0], rot: [0.18, 0.3, -0.08], scale: [1.0, 1.04, 0.94] },
        { name: 'ProjectionVolume_B', pos: [0.02, 0.15, -0.02], rot: [-0.16, 0.96, 0.1], scale: [0.86, 1.16, 0.82] },
        { name: 'ProjectionVolume_C', pos: [-0.04, 0.12, 0.04], rot: [0.34, -0.54, -0.18], scale: [0.74, 0.94, 0.72] },
        { name: 'ProjectionVolume_D', pos: [0.08, 0.22, -0.08], rot: [-0.42, 1.18, 0.28], scale: [0.56, 0.76, 0.62] }
      ];

      chamberConfigs.forEach((cfg) => {
        const chamber = new THREE.Mesh(geometries.chamberGeometry, materials.chamberMat);
        chamber.name = cfg.name;
        chamber.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        chamber.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        chamber.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        chamber.renderOrder = archOrder;
        projectionGroup.add(chamber);

        const chamberEdges = new THREE.LineSegments(geometries.chamberEdgesGeometry, materials.edgeMat);
        chamberEdges.name = `${cfg.name}_Edges`;
        chamberEdges.position.copy(chamber.position);
        chamberEdges.rotation.copy(chamber.rotation);
        chamberEdges.scale.copy(chamber.scale);
        chamberEdges.renderOrder = archOrder;
        projectionGroup.add(chamberEdges);
      });

      const ghostFrameA = new THREE.LineSegments(geometries.ghostFrameGeometry, materials.ghostFrameMat);
      ghostFrameA.name = 'ProjectionGhostFrame_A';
      ghostFrameA.position.set(-0.04, 0.13, 0.04);
      ghostFrameA.rotation.set(0.24, 0.42, -0.14);
      ghostFrameA.scale.set(1.02, 1.08, 0.96);
      ghostFrameA.renderOrder = archOrder;
      projectionGroup.add(ghostFrameA);

      const ghostFrameB = new THREE.LineSegments(geometries.ghostFrameGeometry, materials.ghostFrameMat.clone());
      ghostFrameB.name = 'ProjectionGhostFrame_B';
      ghostFrameB.position.set(0.08, 0.18, -0.08);
      ghostFrameB.rotation.set(-0.28, 1.04, 0.22);
      ghostFrameB.scale.set(0.72, 0.84, 0.76);
      ghostFrameB.renderOrder = archOrder;
      projectionGroup.add(ghostFrameB);

      primeRoot.add(projectionGroup);

      const anomalyGroup = new THREE.Group();
      anomalyGroup.name = 'ANOMALY_GROUP';

      const slab = new THREE.Mesh(geometries.slabGeometry, materials.slabMat);
      slab.name = 'FracturedMeridianSlab';
      slab.position.set(0.14, 0.18, -0.06);
      slab.rotation.set(-0.46, 0.94, 0.38);
      slab.scale.set(1.0, 0.96, 1.0);
      slab.renderOrder = archOrder;
      anomalyGroup.add(slab);

      const slabEdges = new THREE.LineSegments(geometries.slabEdgesGeometry, materials.edgeMat);
      slabEdges.name = 'FracturedMeridianSlab_Edges';
      slabEdges.position.copy(slab.position);
      slabEdges.rotation.copy(slab.rotation);
      slabEdges.scale.copy(slab.scale);
      slabEdges.renderOrder = archOrder;
      anomalyGroup.add(slabEdges);

      const meridianA = new THREE.Mesh(geometries.meridianGeometry, materials.meridianMat);
      meridianA.name = 'PhaseMeridian_A';
      meridianA.position.set(-0.06, 0.12, 0.02);
      meridianA.rotation.set(Math.PI * 0.48, 0.32, 0.16);
      meridianA.scale.set(0.96, 1.02, 0.74);
      meridianA.renderOrder = archOrder;
      anomalyGroup.add(meridianA);

      const meridianB = new THREE.Mesh(geometries.meridianGeometry, materials.meridianMat.clone());
      meridianB.name = 'PhaseMeridian_B';
      meridianB.position.set(0.04, 0.08, -0.06);
      meridianB.rotation.set(-0.18, -0.78, Math.PI * 0.54);
      meridianB.scale.set(0.68, 0.92, 1.02);
      meridianB.renderOrder = archOrder;
      anomalyGroup.add(meridianB);

      const braceConfigs = [
        { name: 'PhaseBrace_A', pos: [-0.34, 0.2, 0.18], rot: [0.24, 0.42, -0.58], scale: [0.92, 0.98, 0.88] },
        { name: 'PhaseBrace_B', pos: [0.3, 0.06, -0.2], rot: [-0.32, -0.56, 0.52], scale: [0.82, 0.9, 0.8] },
        { name: 'PhaseBrace_C', pos: [0.12, 0.42, 0.24], rot: [0.58, -0.14, -0.24], scale: [0.66, 0.74, 0.72] }
      ];
      braceConfigs.forEach((cfg) => {
        const brace = new THREE.Mesh(geometries.braceGeometry, materials.braceMat);
        brace.name = cfg.name;
        brace.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        brace.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        brace.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        brace.renderOrder = coreOrder;
        anomalyGroup.add(brace);

        const braceEdges = new THREE.LineSegments(geometries.braceEdgesGeometry, materials.edgeMat);
        braceEdges.name = `${cfg.name}_Edges`;
        braceEdges.position.copy(brace.position);
        braceEdges.rotation.copy(brace.rotation);
        braceEdges.scale.copy(brace.scale);
        braceEdges.renderOrder = archOrder;
        anomalyGroup.add(braceEdges);
      });

      primeRoot.add(anomalyGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const halo = new THREE.Points(geometries.haloGeometry, materials.haloMat);
      halo.name = 'PrimeForbiddenHaloPoints';
      halo.position.set(0.0, 0.12, 0.0);
      halo.rotation.set(0.08, 0.5, -0.1);
      halo.frustumCulled = false;
      halo.renderOrder = archOrder;
      auraGroup.add(halo);

      const shellColor = 0xf3fbff;
      const shell1 = createNodeHologramShell(coreMesh, shellColor);
      if (shell1) {
        shell1.name = 'PrimeForbiddenShell_1';
        shell1.position.copy(coreMesh.position);
        shell1.quaternion.copy(coreMesh.quaternion);
        shell1.scale.copy(coreMesh.scale).multiplyScalar(1.14);
        shell1.frustumCulled = false;
        shell1.renderOrder = archOrder;
        if (shell1.material?.uniforms?.uOpacity) shell1.material.uniforms.uOpacity.value = 0.054;
        auraGroup.add(shell1);
      }

      const shell2 = createNodeHologramShell(coreMesh, shellColor);
      if (shell2) {
        shell2.name = 'PrimeForbiddenShell_2';
        shell2.position.copy(coreMesh.position);
        shell2.quaternion.copy(coreMesh.quaternion);
        shell2.scale.copy(coreMesh.scale).multiplyScalar(1.24);
        shell2.frustumCulled = false;
        shell2.renderOrder = archOrder;
        if (shell2.material?.uniforms?.uOpacity) shell2.material.uniforms.uOpacity.value = 0.038;
        auraGroup.add(shell2);
      }

      const edgeShell = createNodeNeonEdgeGlowShell(coreMesh, 0xd7f4ff, {
        glowIntensity: 0.94,
        edgeWidth: 0.076,
        pulseAmount: 0.0
      });
      if (edgeShell) {
        edgeShell.name = 'PrimeForbiddenEdgeGlow';
        edgeShell.position.copy(coreMesh.position);
        edgeShell.quaternion.copy(coreMesh.quaternion);
        edgeShell.scale.copy(coreMesh.scale).multiplyScalar(1.02);
        edgeShell.frustumCulled = false;
        edgeShell.renderOrder = archOrder;
        auraGroup.add(edgeShell);
      }

      primeRoot.add(auraGroup);

      primeRoot.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'prime-forbidden-projection-sanctum');
        }
      });

      primeRoot.userData.visualReady = true;
      primeRoot.userData.primeVariant = 'FORBIDDEN_PROJECTION_SANCTUM';
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'PRIME_TESSERACT_PROJECTION';
      group.add(primeRoot);
      return group;
    } catch (err) {
      console.error('[PrimeForbiddenProjectionAbort]', {
        reason: err?.message || err,
        visualCode
      });
      return null;
    }
  }

  static createPrimeSymmetryLockedCoreNode(group, visualCode, color) {
    try {
      const geometries = _getPrimeInvertedBloomGeometries();
      const materials = _getPrimeInvertedBloomMaterials(color);
      const primeRoot = new THREE.Group();
      primeRoot.name = 'PRIME_INVERTED_BLOOM_NODE';
      primeRoot.userData.visualVariant = 'PRIME_INVERTED_BLOOM_DECADENCE_V4';
      primeRoot.userData.nodeGeometryName = 'PRIME_SYMMETRY_LOCKED_CORE';

      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const coreMesh = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      coreMesh.name = 'PrimeMemoryCore';
      coreMesh.position.set(0.0, 0.12, 0.0);
      coreMesh.rotation.set(0.14, 0.28, -0.06);
      coreMesh.renderOrder = coreOrder;
      coreGroup.add(coreMesh);

      const coreEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.edgeMat);
      coreEdges.name = 'PrimeMemoryCoreEdges';
      coreEdges.position.copy(coreMesh.position);
      coreEdges.rotation.copy(coreMesh.rotation);
      coreEdges.renderOrder = archOrder;
      coreGroup.add(coreEdges);

      const seed = new THREE.Mesh(geometries.seedGeometry, materials.seedMat);
      seed.name = 'PrimeSovereignSeed';
      seed.position.set(0.02, 0.14, -0.02);
      seed.rotation.set(0.22, 0.54, -0.08);
      seed.renderOrder = coreOrder;
      coreGroup.add(seed);

      const seam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      seam.name = 'PrimeInversionSeam';
      seam.position.set(-0.04, 0.14, 0.04);
      seam.rotation.set(0.16, -0.4, 0.02);
      seam.renderOrder = coreOrder;
      coreGroup.add(seam);

      primeRoot.add(coreGroup);

      const bloomGroup = new THREE.Group();
      bloomGroup.name = 'BLOOM_GROUP';

      const petalConfigs = [
        { name: 'BloomPetal_A', pos: [0.02, 0.52, 0.08], rot: [0.82, 0.12, -0.06], scale: [1.0, 1.18, 0.98] },
        { name: 'BloomPetal_B', pos: [-0.46, 0.26, 0.18], rot: [0.48, 0.34, -0.72], scale: [0.92, 1.02, 0.9] },
        { name: 'BloomPetal_C', pos: [0.52, 0.22, -0.12], rot: [0.32, -0.52, 0.84], scale: [0.88, 0.98, 0.86] },
        { name: 'BloomPetal_D', pos: [-0.24, -0.1, -0.34], rot: [-0.52, 0.84, -0.24], scale: [0.78, 0.9, 0.8] },
        { name: 'BloomPetal_E', pos: [0.18, -0.16, 0.42], rot: [-0.68, -0.26, 0.42], scale: [0.82, 0.86, 0.84] },
        { name: 'BloomPetal_F', pos: [0.34, 0.44, 0.36], rot: [0.94, -0.18, 0.54], scale: [0.68, 0.78, 0.72] }
      ];

      petalConfigs.forEach((cfg) => {
        const petal = new THREE.Mesh(geometries.petalGeometry, materials.petalMat);
        petal.name = cfg.name;
        petal.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        petal.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        petal.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        petal.renderOrder = coreOrder;
        bloomGroup.add(petal);

        const petalEdges = new THREE.LineSegments(geometries.petalEdgesGeometry, materials.edgeMat);
        petalEdges.name = `${cfg.name}_Edges`;
        petalEdges.position.copy(petal.position);
        petalEdges.rotation.copy(petal.rotation);
        petalEdges.scale.copy(petal.scale);
        petalEdges.renderOrder = archOrder;
        bloomGroup.add(petalEdges);
      });

      primeRoot.add(bloomGroup);

      const inversionGroup = new THREE.Group();
      inversionGroup.name = 'INVERSION_GROUP';

      const shellA = new THREE.Mesh(geometries.shellGeometry, materials.inversionMat);
      shellA.name = 'TopologyInversionShell_A';
      shellA.position.set(-0.02, 0.14, 0.0);
      shellA.rotation.set(0.18, 0.64, -0.22);
      shellA.scale.set(1.0, 1.08, 0.94);
      shellA.renderOrder = archOrder;
      inversionGroup.add(shellA);

      const shellAEdges = new THREE.LineSegments(geometries.shellEdgesGeometry, materials.inversionEdgeMat);
      shellAEdges.name = 'TopologyInversionShell_A_Edges';
      shellAEdges.position.copy(shellA.position);
      shellAEdges.rotation.copy(shellA.rotation);
      shellAEdges.scale.copy(shellA.scale);
      shellAEdges.renderOrder = archOrder;
      inversionGroup.add(shellAEdges);

      const shellB = new THREE.Mesh(geometries.shellGeometry, materials.inversionMat.clone());
      shellB.name = 'TopologyInversionShell_B';
      shellB.position.set(0.08, 0.08, -0.06);
      shellB.rotation.set(-0.38, -0.82, 0.46);
      shellB.scale.set(0.78, 0.9, 0.72);
      shellB.renderOrder = archOrder;
      shellB.material.opacity = 0.09;
      shellB.material.side = THREE.DoubleSide;
      inversionGroup.add(shellB);

      const shellBEdges = new THREE.LineSegments(geometries.shellEdgesGeometry, materials.inversionEdgeMat.clone());
      shellBEdges.name = 'TopologyInversionShell_B_Edges';
      shellBEdges.position.copy(shellB.position);
      shellBEdges.rotation.copy(shellB.rotation);
      shellBEdges.scale.copy(shellB.scale);
      shellBEdges.renderOrder = archOrder;
      shellBEdges.material.opacity = 0.3;
      inversionGroup.add(shellBEdges);

      const slab = new THREE.Mesh(geometries.slabGeometry, materials.slabMat);
      slab.name = 'OffSpaceAntiMeridian';
      slab.position.set(0.16, 0.2, -0.04);
      slab.rotation.set(-0.58, 0.86, 0.36);
      slab.scale.set(1.0, 1.0, 1.0);
      slab.renderOrder = archOrder;
      inversionGroup.add(slab);

      const slabEdges = new THREE.LineSegments(geometries.slabEdgesGeometry, materials.inversionEdgeMat);
      slabEdges.name = 'OffSpaceAntiMeridian_Edges';
      slabEdges.position.copy(slab.position);
      slabEdges.rotation.copy(slab.rotation);
      slabEdges.scale.copy(slab.scale);
      slabEdges.renderOrder = archOrder;
      inversionGroup.add(slabEdges);

      primeRoot.add(inversionGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const halo = new THREE.Points(geometries.haloGeometry, materials.haloMat);
      halo.name = 'PrimeDecadenceHaloPoints';
      halo.position.set(0.0, 0.14, 0.0);
      halo.rotation.set(0.08, 0.48, -0.1);
      halo.frustumCulled = false;
      halo.renderOrder = archOrder;
      auraGroup.add(halo);

      const shellColor = 0xf5fbff;
      const shell1 = createNodeHologramShell(coreMesh, shellColor);
      if (shell1) {
        shell1.name = 'PrimeInvertedBloomShell_1';
        shell1.position.copy(coreMesh.position);
        shell1.quaternion.copy(coreMesh.quaternion);
        shell1.scale.copy(coreMesh.scale).multiplyScalar(1.14);
        shell1.frustumCulled = false;
        shell1.renderOrder = archOrder;
        if (shell1.material?.uniforms?.uOpacity) shell1.material.uniforms.uOpacity.value = 0.052;
        auraGroup.add(shell1);
      }

      const shell2 = createNodeHologramShell(coreMesh, shellColor);
      if (shell2) {
        shell2.name = 'PrimeInvertedBloomShell_2';
        shell2.position.copy(coreMesh.position);
        shell2.quaternion.copy(coreMesh.quaternion);
        shell2.scale.copy(coreMesh.scale).multiplyScalar(1.24);
        shell2.frustumCulled = false;
        shell2.renderOrder = archOrder;
        if (shell2.material?.uniforms?.uOpacity) shell2.material.uniforms.uOpacity.value = 0.036;
        auraGroup.add(shell2);
      }

      const edgeShell = createNodeNeonEdgeGlowShell(coreMesh, 0xd8f4ff, {
        glowIntensity: 0.94,
        edgeWidth: 0.078,
        pulseAmount: 0.0
      });
      if (edgeShell) {
        edgeShell.name = 'PrimeInvertedBloomEdgeGlow';
        edgeShell.position.copy(coreMesh.position);
        edgeShell.quaternion.copy(coreMesh.quaternion);
        edgeShell.scale.copy(coreMesh.scale).multiplyScalar(1.02);
        edgeShell.frustumCulled = false;
        edgeShell.renderOrder = archOrder;
        auraGroup.add(edgeShell);
      }

      primeRoot.add(auraGroup);

      primeRoot.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'prime-inverted-bloom-decadence');
        }
      });

      primeRoot.userData.visualReady = true;
      primeRoot.userData.primeVariant = 'INVERTED_BLOOM_DECADENCE';
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'PRIME_SYMMETRY_LOCKED_CORE';
      group.add(primeRoot);
      return group;
    } catch (err) {
      console.error('[PrimeInvertedBloomAbort]', {
        reason: err?.message || err,
        visualCode
      });
      return null;
    }
  }

  static getCategoryPool(cat) {
    const key = (cat || '').toLowerCase();
    const pool = CATEGORY_POOLS[key] || [];
    
    // Runtime logging for category pool debugging
    if (window.ATOMA_FLAGS?.debug?.spawnCategory === true) {
      console.log('[CATEGORY_POOL_DEBUG]', {
        requestedCategory: cat,
        normalizedKey: key,
        poolSize: pool.length,
        poolCodes: pool,
        timestamp: Date.now()
      });
    }
    
    return pool;
  }

  // ===== ERROR NODES (Frozen Corruption - 6 variants) =====

  /**
  * Main error node creator
  * CANONICAL CATEGORY: ERROR
  * - IntersectingSolids, InvertedNormals, SelfClipping
  * - FoldedImpossible, TopologyTear, CorruptedManifold
  */
  /**
   * ERROR v2: Impossible Geometry (restored)
   * Hierarchy:
   * ERROR_NODE
   *   - CORE_GROUP (ImpossibleCore + HardEdges)
   *   - STRUCTURE_GROUP (MisalignedRing + DistortedPolyCage + ShadowDuplicate)
   *   - DISTORTION_GROUP (InnerVoid + ThinHalo)
   */
  static createErrorNodeStyled_v2(group, index, color) {
    try {
      const geometries = _getErrorV2Geometries();
      const materials = _getErrorV2Materials(color);
      const ERROR_VARIANT_NAMES = {
        0: 'INTERSECTING_SOLIDS',
        1: 'INVERTED_NORMALS',
        2: 'SELF_CLIPPING',
        3: 'FOLDED_IMPOSSIBLE',
        4: 'TOPOLOGY_TEAR',
        5: 'CORRUPTED_MANIFOLD',
        6: 'ERROR_V2_BASELINE'
      };
      const resolveErrorVariant = (value) => {
        const n = Number(value);
        if (!Number.isFinite(n)) return 6; // canonical ERROR_V2 fallback
        // Visual-code routing (registry path)
        if (n >= 1101 && n <= 1106) return n - 1101;
        if (n === 1108) return 6; // canonical V2
        // Direct wrapper routing (0..5)
        if (n >= 0 && n <= 5) return n;
        return 6;
      };
      const variant = resolveErrorVariant(index);

      const errorRoot = new THREE.Group();
      errorRoot.name = 'ERROR_NODE';
      errorRoot.userData.visualVariant = 'ERROR_V2';
      errorRoot.userData.errorVariantIndex = variant;
      errorRoot.userData.errorVariantName = ERROR_VARIANT_NAMES[variant] || ERROR_VARIANT_NAMES[6];

      // CORE
      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';
      const core = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      core.name = 'ImpossibleCore';
      core.scale.set(1.0, 0.85, 1.1);
      core.rotation.set(0.15, -0.08, 0.0);
      const edges = new THREE.LineSegments(geometries.edgesGeometry, materials.edgesMat);
      edges.name = 'HardEdges';
      coreGroup.add(core);
      coreGroup.add(edges);
      errorRoot.add(coreGroup);

      // STRUCTURE
      const structureGroup = new THREE.Group();
      structureGroup.name = 'STRUCTURE_GROUP';

      const ring = new THREE.Mesh(geometries.ringGeometry, materials.ringMat);
      ring.name = 'MisalignedRing';
      ring.position.x = 0.12;
      ring.rotation.set(0.22, -0.14, 0.35);
      ring.scale.set(1.05, 0.92, 1.0);
      structureGroup.add(ring);

      const cage = new THREE.LineSegments(geometries.cageEdgesGeometry, materials.frameMat);
      cage.name = 'DistortedPolyCage';
      cage.scale.set(1.2, 1.05, 1.15);
      cage.rotation.set(-0.22, 0.28, 0.14);
      structureGroup.add(cage);

      const shadow = new THREE.Mesh(geometries.coreGeometry, materials.shadowMat);
      shadow.name = 'ShadowDuplicate';
      shadow.scale.set(1.03, 1.03, 1.03);
      shadow.position.z = 0.05;
      shadow.rotation.set(-0.12, 0.18, -0.05);
      structureGroup.add(shadow);

      errorRoot.add(structureGroup);

      // DISTORTION
      const distortionGroup = new THREE.Group();
      distortionGroup.name = 'DISTORTION_GROUP';

      const innerVoid = new THREE.Mesh(geometries.voidGeometry, materials.voidMat);
      innerVoid.name = 'InnerVoid';
      innerVoid.scale.setScalar(0.3);
      distortionGroup.add(innerVoid);

      const halo = new THREE.Points(geometries.haloGeometry, materials.haloMat);
      halo.name = 'ThinHalo';
      halo.frustumCulled = false;
      distortionGroup.add(halo);

      // Route named ERROR factories to distinct variant layouts while keeping ERROR_V2 architecture.
      switch (variant) {
        case 0: { // Intersecting solids
          const coreB = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
          coreB.name = 'IntersectCoreB';
          coreB.scale.set(0.88, 1.02, 0.82);
          coreB.position.set(-0.08, 0.06, 0.11);
          coreB.rotation.set(-0.24, 0.19, 0.08);
          coreGroup.add(coreB);

          const edgesB = new THREE.LineSegments(geometries.edgesGeometry, materials.edgesMat);
          edgesB.name = 'IntersectEdgesB';
          edgesB.position.copy(coreB.position);
          edgesB.rotation.copy(coreB.rotation);
          edgesB.scale.copy(coreB.scale);
          coreGroup.add(edgesB);

          ring.position.x = 0.2;
          ring.rotation.set(0.28, -0.08, 0.56);
          cage.rotation.set(-0.08, 0.34, 0.21);
          break;
        }
        case 1: { // Inverted normals
          core.material = materials.coreMat.clone();
          core.material.side = THREE.BackSide;
          core.scale.set(0.94, 0.78, 1.18);
          core.rotation.set(-0.11, 0.22, 0.06);
          ring.rotation.set(-0.34, 0.26, -0.18);
          ring.scale.set(1.08, 0.9, 0.96);
          cage.rotation.set(0.26, -0.16, 0.31);
          shadow.rotation.set(0.2, -0.21, 0.09);
          break;
        }
        case 2: { // Self clipping (current reference look)
          // Keep baseline transforms for legacy self-clipping silhouette.
          break;
        }
        case 3: { // Folded impossible
          core.scale.set(1.12, 0.62, 1.02);
          core.rotation.set(0.38, -0.09, 0.26);
          ring.position.x = -0.18;
          ring.rotation.set(0.74, -0.42, 0.12);
          ring.scale.set(1.0, 0.68, 1.12);
          cage.scale.set(1.32, 0.92, 1.04);
          cage.rotation.set(-0.4, 0.16, -0.12);
          shadow.position.z = -0.09;
          shadow.rotation.set(0.32, -0.1, 0.27);
          break;
        }
        case 4: { // Topology tear
          structureGroup.remove(ring);
          const tornRingGeo = new THREE.TorusGeometry(0.95, 0.04, 12, 96, Math.PI * 1.72);
          const tornRing = new THREE.Mesh(tornRingGeo, materials.ringMat);
          tornRing.name = 'TopologyTornRing';
          tornRing.position.x = 0.04;
          tornRing.rotation.set(0.12, -0.28, 0.48);
          tornRing.scale.set(1.02, 0.96, 1.0);
          structureGroup.add(tornRing);
          cage.scale.set(1.18, 0.96, 1.12);
          cage.rotation.set(-0.35, 0.41, -0.08);
          break;
        }
        case 5: { // Corrupted manifold
          core.scale.set(0.92, 1.08, 0.86);
          core.rotation.set(-0.32, 0.12, -0.22);
          ring.position.x = 0.24;
          ring.rotation.set(-0.18, 0.34, -0.62);
          ring.scale.set(0.96, 1.12, 0.94);
          cage.scale.set(1.36, 1.08, 1.2);
          cage.rotation.set(0.28, -0.38, 0.25);
          shadow.scale.set(1.09, 1.0, 1.06);
          shadow.position.z = 0.1;
          break;
        }
        case 6:
        default: { // Canonical ERROR_V2 (visualCode 1108 / direct builder path)
          break;
        }
      }

      errorRoot.add(distortionGroup);

      // Validate geometries on all meshes
      errorRoot.traverse(o => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          validateMeshGeometry(o, o.name || 'error-child');
        }
      });

      errorRoot.userData.visualReady = true;
      group.add(errorRoot);
      return group;
    } catch (err) {
      console.error('[ErrorV2Abort]', { reason: err?.message || err });
      return null;
    }
  }

  static createErrorIntersectingSolidsNode(group, visualCode, color) {
    try {
      const seed = group?.userData?.nodeId
        ? hashNodeIdToFloat(group.userData.nodeId)
        : hashNodeIdToFloat(`error-intersect-${color}`);
      const rng = _mythicSeededRng(Math.floor(seed * 1000) || 1);
      const root = new THREE.Group();
      root.name = 'ERROR_INTERSECTING_SOLIDS';
      root.userData.visualVariant = 'ERROR_INTERSECTING_SOLIDS_ORACLE_V2';

      const jitterGeometry = (geometry, magnitude = 0.02) => {
        const g = geometry.clone();
        const attr = g.attributes?.position;
        if (!attr) return g;
        for (let i = 0; i < attr.count; i++) {
          attr.setXYZ(
            i,
            attr.getX(i) + (rng() - 0.5) * magnitude,
            attr.getY(i) + (rng() - 0.5) * magnitude * 0.8,
            attr.getZ(i) + (rng() - 0.5) * magnitude
          );
        }
        attr.needsUpdate = true;
        g.computeVertexNormals?.();
        return g;
      };

      const bloodMat = new THREE.MeshPhysicalMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.36,
        metalness: 0.72,
        roughness: 0.18,
        clearcoat: 0.35,
        clearcoatRoughness: 0.2
      });
      const antiMat = new THREE.MeshStandardMaterial({
        color: 0x070707,
        emissive: 0x120000,
        emissiveIntensity: 0.1,
        metalness: 0.15,
        roughness: 0.82,
        side: THREE.DoubleSide
      });
      const antiVoidMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.92,
        side: THREE.BackSide
      });
      const cageMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        depthTest: true
      });
      const glassWireMat = new THREE.LineBasicMaterial({
        color: 0xa8f4ff,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
        depthTest: true
      });

      // Reality A: blood-red aggressive polyhedron.
      const bloodGeo = jitterGeometry(new THREE.IcosahedronGeometry(0.48, 1), 0.06);
      const blood = new THREE.Mesh(bloodGeo, bloodMat);
      blood.name = 'CollisionBloodPolyhedron';
      blood.position.set(0.0, 0.03, 0.02);
      blood.rotation.set(0.52, -0.38, 0.2);
      blood.scale.set(1.18, 0.72, 1.36);
      root.add(blood);

      const bloodEdges = new THREE.LineSegments(new THREE.EdgesGeometry(bloodGeo, 7), cageMat);
      bloodEdges.name = 'CollisionBloodEdgesCage';
      bloodEdges.position.copy(blood.position);
      bloodEdges.rotation.copy(blood.rotation);
      bloodEdges.scale.copy(blood.scale);
      root.add(bloodEdges);

      // Reality B: anti-solid with carved interior.
      const antiGeo = new THREE.DodecahedronGeometry(0.5, 0);
      const antiSolid = new THREE.Mesh(antiGeo, antiMat);
      antiSolid.name = 'CollisionAntiSolid';
      antiSolid.position.set(-0.08, -0.05, -0.11);
      antiSolid.rotation.set(-0.28, 0.31, -0.42);
      antiSolid.scale.set(0.96, 1.24, 0.78);
      root.add(antiSolid);

      const antiVoid = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), antiVoidMat);
      antiVoid.name = 'CollisionAntiVoidCore';
      antiVoid.position.copy(antiSolid.position);
      antiVoid.position.add(new THREE.Vector3(0.04, -0.02, 0.05));
      antiVoid.rotation.copy(antiSolid.rotation);
      antiVoid.scale.set(0.94, 1.18, 0.88);
      root.add(antiVoid);

      const antiEdges = new THREE.LineSegments(new THREE.EdgesGeometry(antiGeo, 8), cageMat);
      antiEdges.name = 'CollisionAntiEdgesCage';
      antiEdges.position.copy(antiSolid.position);
      antiEdges.rotation.copy(antiSolid.rotation);
      antiEdges.scale.copy(antiSolid.scale);
      root.add(antiEdges);

      // Reality C: glass-like broken triangle skeleton.
      const skeleton = new THREE.Group();
      skeleton.name = 'CollisionBrokenGlassSkeletonCage';
      const triCount = 9;
      for (let i = 0; i < triCount; i++) {
        const radius = 0.44 + i * 0.04;
        const p1 = new THREE.Vector3((rng() - 0.5) * radius, (rng() - 0.5) * radius, (rng() - 0.5) * radius);
        const p2 = new THREE.Vector3((rng() - 0.5) * radius, (rng() - 0.5) * radius, (rng() - 0.5) * radius);
        const p3 = new THREE.Vector3((rng() - 0.5) * radius, (rng() - 0.5) * radius, (rng() - 0.5) * radius);
        const triGeo = new THREE.BufferGeometry().setFromPoints([p1, p2, p2, p3, p3, p1]);
        const tri = new THREE.LineSegments(triGeo, glassWireMat);
        tri.name = `GlassFractureWire${i}`;
        skeleton.add(tri);
      }
      skeleton.rotation.set(0.18, -0.3, 0.43);
      root.add(skeleton);

      // Singularity core where realities collapse.
      const singularityMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.94
      });
      const singularity = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), singularityMat);
      singularity.name = 'CollisionSingularityCore';
      singularity.scale.set(1.0, 0.72, 1.35);
      root.add(singularity);

      const singularityEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.15, 0), 1),
        cageMat
      );
      singularityEdges.name = 'CollisionSingularityEdgeCage';
      singularityEdges.scale.set(1.0, 0.72, 1.35);
      root.add(singularityEdges);

      // Broken torus orbit.
      const brokenRingGeo = new THREE.TorusGeometry(0.86, 0.043, 10, 88, Math.PI * 1.62);
      const brokenRing = new THREE.Mesh(
        brokenRingGeo,
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.44,
          metalness: 0.42,
          roughness: 0.36,
          transparent: true,
          opacity: 0.86
        })
      );
      brokenRing.name = 'CollisionBrokenTorusRing';
      brokenRing.rotation.set(0.78, -0.12, 0.61);
      brokenRing.position.set(0.05, -0.02, 0.02);
      root.add(brokenRing);

      const brokenRingEdges = new THREE.LineSegments(new THREE.EdgesGeometry(brokenRingGeo, 8), cageMat);
      brokenRingEdges.name = 'CollisionBrokenTorusWireCage';
      brokenRingEdges.rotation.copy(brokenRing.rotation);
      brokenRingEdges.position.copy(brokenRing.position);
      root.add(brokenRingEdges);

      // Long needle fracture lines.
      const needleCount = 16;
      for (let i = 0; i < needleCount; i++) {
        const dir = new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize();
        const length = 0.9 + rng() * 0.65;
        const offset = new THREE.Vector3((rng() - 0.5) * 0.18, (rng() - 0.5) * 0.18, (rng() - 0.5) * 0.18);
        const a = dir.clone().multiplyScalar(-length * 0.5).add(offset);
        const b = dir.clone().multiplyScalar(length * 0.5).add(offset);
        const needleGeo = new THREE.BufferGeometry().setFromPoints([a, b]);
        const needle = new THREE.LineSegments(needleGeo, cageMat);
        needle.name = `CollisionFractureNeedleWire${i}`;
        root.add(needle);
      }

      root.traverse(o => {
        if (o?.isMesh || o?.isLine || o?.isLineSegments || o?.isPoints) {
          validateMeshGeometry(o, o.name || 'error-intersecting');
        }
      });
      group.add(root);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createErrorIntersectingSolidsNode',
        category: 'error',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  static createErrorInvertedNormalsNode(group, visualCode, color) {
    try {
      const root = new THREE.Group();
      root.name = 'ERROR_INVERTED_NORMALS';
      root.userData.visualVariant = 'ERROR_INVERTED_NORMALS_INSIDE_OUT_V2';

      const darkShellMat = new THREE.MeshStandardMaterial({
        color: 0x07090f,
        emissive: 0x090015,
        emissiveIntensity: 0.22,
        metalness: 0.62,
        roughness: 0.34,
        side: THREE.BackSide
      });
      const darkBodyMat = new THREE.MeshStandardMaterial({
        color: 0x09090b,
        emissive: 0x140000,
        emissiveIntensity: 0.12,
        metalness: 0.35,
        roughness: 0.62
      });
      const lumenMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.95
      });
      const cageMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
        depthTest: true
      });

      // Hollow anti-core with forbidden inner light.
      const antiCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 1), darkBodyMat);
      antiCore.name = 'InsideOutAntiCoreBody';
      antiCore.scale.set(1.06, 0.84, 1.2);
      antiCore.rotation.set(-0.22, 0.3, -0.12);
      root.add(antiCore);

      const lumen = new THREE.Mesh(new THREE.SphereGeometry(0.31, 20, 16), lumenMat);
      lumen.name = 'InsideOutLumenCore';
      lumen.scale.set(0.84, 1.16, 0.78);
      lumen.rotation.set(0.14, -0.2, 0.31);
      root.add(lumen);

      const antiCoreEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.48, 1), 8),
        cageMat
      );
      antiCoreEdges.name = 'InsideOutAntiCoreEdgesCage';
      antiCoreEdges.scale.copy(antiCore.scale);
      antiCoreEdges.rotation.copy(antiCore.rotation);
      root.add(antiCoreEdges);

      // 3 inside-out semi-open shell layers with diagonal cuts.
      const shellLayers = [
        { r: 0.92, phiStart: 0.22, phiLen: Math.PI * 1.48, thetaStart: 0.26, thetaLen: Math.PI * 0.74, rot: new THREE.Euler(0.62, -0.28, 0.38), scl: new THREE.Vector3(1.0, 0.82, 1.12) },
        { r: 0.78, phiStart: 0.66, phiLen: Math.PI * 1.34, thetaStart: 0.44, thetaLen: Math.PI * 0.68, rot: new THREE.Euler(-0.34, 0.39, -0.21), scl: new THREE.Vector3(1.08, 0.74, 0.92) },
        { r: 0.66, phiStart: 1.05, phiLen: Math.PI * 1.26, thetaStart: 0.18, thetaLen: Math.PI * 0.7, rot: new THREE.Euler(0.28, 0.17, 0.56), scl: new THREE.Vector3(0.9, 1.12, 0.84) }
      ];

      shellLayers.forEach((cfg, i) => {
        const shellGeo = new THREE.SphereGeometry(cfg.r, 24, 18, cfg.phiStart, cfg.phiLen, cfg.thetaStart, cfg.thetaLen);
        const shell = new THREE.Mesh(shellGeo, darkShellMat);
        shell.name = `InsideOutShellLayer${i}`;
        shell.rotation.copy(cfg.rot);
        shell.scale.copy(cfg.scl);
        root.add(shell);

        const shellEdges = new THREE.LineSegments(new THREE.EdgesGeometry(shellGeo, 8), cageMat);
        shellEdges.name = `InsideOutShellLayerEdgesCage${i}`;
        shellEdges.rotation.copy(shell.rotation);
        shellEdges.scale.copy(shell.scale);
        root.add(shellEdges);
      });

      // Curved membrane fins pushed outward.
      const finCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.26, -0.06),
        new THREE.Vector3(0.12, -0.04, 0.08),
        new THREE.Vector3(0.18, 0.2, 0.12),
        new THREE.Vector3(0.08, 0.42, -0.03)
      ]);
      for (let i = 0; i < 3; i++) {
        const finGeo = new THREE.TubeGeometry(finCurve, 28, 0.05 - i * 0.008, 7, false);
        const fin = new THREE.Mesh(finGeo, darkBodyMat);
        fin.name = `InsideOutMembraneFin${i}`;
        fin.rotation.set(0.2 + i * 0.55, -0.62 + i * 0.51, 0.36 - i * 0.44);
        fin.scale.set(1.1 - i * 0.08, 1.0, 0.9 + i * 0.1);
        root.add(fin);

        const finEdges = new THREE.LineSegments(new THREE.EdgesGeometry(finGeo, 8), cageMat);
        finEdges.name = `InsideOutMembraneFinEdgesCage${i}`;
        finEdges.rotation.copy(fin.rotation);
        finEdges.scale.copy(fin.scale);
        root.add(finEdges);
      }

      // Torn inner ribs ejected outward.
      for (let i = 0; i < 8; i++) {
        const ribGeo = new THREE.CylinderGeometry(0.012, 0.02, 0.48 + i * 0.05, 6);
        const rib = new THREE.Mesh(ribGeo, darkBodyMat);
        rib.name = `InsideOutTornRib${i}`;
        const angle = i * 0.77;
        rib.position.set(Math.cos(angle) * 0.2, -0.08 + i * 0.03, Math.sin(angle) * 0.16);
        rib.rotation.set(1.1 + i * 0.12, angle * 0.45, -0.4 + i * 0.09);
        root.add(rib);

        const ribEdges = new THREE.LineSegments(new THREE.EdgesGeometry(ribGeo, 8), cageMat);
        ribEdges.name = `InsideOutTornRibEdgesCage${i}`;
        ribEdges.position.copy(rib.position);
        ribEdges.rotation.copy(rib.rotation);
        root.add(ribEdges);
      }

      root.traverse(o => {
        if (o?.isMesh || o?.isLine || o?.isLineSegments || o?.isPoints) {
          validateMeshGeometry(o, o.name || 'error-inverted');
        }
      });
      group.add(root);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createErrorInvertedNormalsNode',
        category: 'error',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  static createErrorSelfClippingNode(group, visualCode, color) {
    try {
      const seed = group?.userData?.nodeId
        ? hashNodeIdToFloat(group.userData.nodeId)
        : hashNodeIdToFloat(`error-selfclip-${color}`);
      const rng = _mythicSeededRng(Math.floor(seed * 1000) || 1);
      const root = new THREE.Group();
      root.name = 'ERROR_SELF_CLIPPING';
      root.userData.visualVariant = 'ERROR_SELF_CLIPPING_RECURSIVE_AMPUTATION_V2';

      const deformGeometry = (geo, amp = 0.045) => {
        const g = geo.clone();
        const pos = g.attributes?.position;
        if (!pos) return g;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const z = pos.getZ(i);
          const bias = (x * 0.7 - y * 0.3 + z * 0.5);
          pos.setXYZ(
            i,
            x + (rng() - 0.5) * amp + bias * 0.02,
            y + (rng() - 0.5) * amp * 0.8,
            z + (rng() - 0.5) * amp - bias * 0.018
          );
        }
        pos.needsUpdate = true;
        g.computeVertexNormals?.();
        return g;
      };

      const coreMat = new THREE.MeshPhysicalMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.34,
        metalness: 0.66,
        roughness: 0.2,
        clearcoat: 0.28,
        clearcoatRoughness: 0.22
      });
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0x1a0c16,
        emissive: color,
        emissiveIntensity: 0.18,
        metalness: 0.5,
        roughness: 0.38,
        transparent: true,
        opacity: 0.62
      });
      const seamMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.96
      });
      const cavityMat = new THREE.MeshBasicMaterial({
        color: 0x020203,
        transparent: true,
        opacity: 0.9,
        side: THREE.BackSide
      });
      const cageMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
        depthTest: true
      });

      // Dominant wounded idol core.
      const coreGeo = deformGeometry(new THREE.DodecahedronGeometry(0.58, 1), 0.055);
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.name = 'AmputationIdolCore';
      core.scale.set(1.08, 0.76, 1.22);
      core.rotation.set(0.34, -0.27, 0.18);
      root.add(core);

      const coreEdges = new THREE.LineSegments(new THREE.EdgesGeometry(coreGeo, 8), cageMat);
      coreEdges.name = 'AmputationIdolCoreEdgesCage';
      coreEdges.scale.copy(core.scale);
      coreEdges.rotation.copy(core.rotation);
      root.add(coreEdges);

      // Diagonal clipping slab.
      const slabGeo = new THREE.BoxGeometry(1.52, 0.12, 0.46);
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.name = 'AmputationClippingSlab';
      slab.position.set(0.02, 0.02, 0.05);
      slab.rotation.set(0.62, -0.38, 0.46);
      root.add(slab);

      const slabEdges = new THREE.LineSegments(new THREE.EdgesGeometry(slabGeo, 8), cageMat);
      slabEdges.name = 'AmputationClippingSlabEdgesCage';
      slabEdges.position.copy(slab.position);
      slabEdges.rotation.copy(slab.rotation);
      root.add(slabEdges);

      // Exposed wound: emissive seam + hollow cavity.
      const seamGeo = new THREE.TorusGeometry(0.44, 0.026, 8, 72, Math.PI * 1.18);
      const seam = new THREE.Mesh(seamGeo, seamMat);
      seam.name = 'AmputationWoundSeam';
      seam.position.set(0.01, 0.03, 0.0);
      seam.rotation.set(0.62, -0.36, 0.51);
      seam.scale.set(1.0, 0.66, 1.28);
      root.add(seam);

      const seamEdges = new THREE.LineSegments(new THREE.EdgesGeometry(seamGeo, 8), cageMat);
      seamEdges.name = 'AmputationWoundSeamEdgesCage';
      seamEdges.position.copy(seam.position);
      seamEdges.rotation.copy(seam.rotation);
      seamEdges.scale.copy(seam.scale);
      root.add(seamEdges);

      const cavity = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 0), cavityMat);
      cavity.name = 'AmputationInnerCavity';
      cavity.position.set(0.06, -0.02, 0.03);
      cavity.scale.set(0.84, 1.22, 0.72);
      cavity.rotation.set(-0.24, 0.32, -0.17);
      root.add(cavity);

      // 2-4 detached fragments in pathological proximity.
      const fragmentCount = 2 + Math.floor(rng() * 3);
      for (let i = 0; i < fragmentCount; i++) {
        const fragGeo = deformGeometry(new THREE.TetrahedronGeometry(0.18 + i * 0.04, 0), 0.035);
        const frag = new THREE.Mesh(fragGeo, coreMat);
        frag.name = `AmputationDetachedFragment${i}`;
        frag.position.set(
          (rng() - 0.5) * 0.44 + 0.14,
          (rng() - 0.5) * 0.3 - 0.02,
          (rng() - 0.5) * 0.36
        );
        frag.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
        frag.scale.set(1.0 + i * 0.08, 0.72 + i * 0.05, 1.14 - i * 0.06);
        root.add(frag);

        const fragEdges = new THREE.LineSegments(new THREE.EdgesGeometry(fragGeo, 8), cageMat);
        fragEdges.name = `AmputationDetachedFragmentEdgesCage${i}`;
        fragEdges.position.copy(frag.position);
        fragEdges.rotation.copy(frag.rotation);
        fragEdges.scale.copy(frag.scale);
        root.add(fragEdges);
      }

      // Asymmetric broken contour cage (not torus orbit).
      const brokenContours = [
        { r: 0.82, tube: 0.028, arc: Math.PI * 1.06, rot: new THREE.Euler(0.32, 0.16, -0.58), pos: new THREE.Vector3(0.07, -0.01, 0.08), scl: new THREE.Vector3(1.22, 0.74, 1.04) },
        { r: 0.63, tube: 0.024, arc: Math.PI * 0.88, rot: new THREE.Euler(-0.36, 0.41, 0.22), pos: new THREE.Vector3(-0.1, 0.08, -0.05), scl: new THREE.Vector3(0.92, 1.18, 0.84) },
        { r: 0.72, tube: 0.021, arc: Math.PI * 0.72, rot: new THREE.Euler(0.54, -0.34, 0.37), pos: new THREE.Vector3(0.03, -0.11, 0.02), scl: new THREE.Vector3(1.1, 0.68, 1.2) }
      ];
      brokenContours.forEach((c, i) => {
        const contourGeo = new THREE.TorusGeometry(c.r, c.tube, 8, 64, c.arc);
        const contour = new THREE.LineSegments(new THREE.EdgesGeometry(contourGeo, 8), cageMat);
        contour.name = `AmputationBrokenContourCage${i}`;
        contour.position.copy(c.pos);
        contour.rotation.copy(c.rot);
        contour.scale.copy(c.scl);
        root.add(contour);
      });

      root.traverse(o => {
        if (o?.isMesh || o?.isLine || o?.isLineSegments || o?.isPoints) {
          validateMeshGeometry(o, o.name || 'error-selfclip');
        }
      });
      group.add(root);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createErrorSelfClippingNode',
        category: 'error',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  static createErrorFoldedImpossibleNode(group, visualCode, color) {
    try {
      const seed = group?.userData?.nodeId
        ? hashNodeIdToFloat(group.userData.nodeId)
        : hashNodeIdToFloat(`error-folded-${color}`);
      const rng = _mythicSeededRng(Math.floor(seed * 1000) || 1);
      const root = new THREE.Group();
      root.name = 'ERROR_FOLDED_IMPOSSIBLE';
      root.userData.visualVariant = 'ERROR_NON_EUCLIDEAN_FOLD_CATHEDRAL_V2';

      const obsidianMat = new THREE.MeshStandardMaterial({
        color: 0x090b12,
        emissive: 0x0e1320,
        emissiveIntensity: 0.18,
        metalness: 0.68,
        roughness: 0.28
      });
      const foldMat = new THREE.MeshPhysicalMaterial({
        color: 0x10141c,
        emissive: color,
        emissiveIntensity: 0.16,
        metalness: 0.52,
        roughness: 0.34,
        clearcoat: 0.2,
        clearcoatRoughness: 0.32
      });
      const seedMat = new THREE.MeshBasicMaterial({
        color: 0xc36cff,
        transparent: true,
        opacity: 0.92
      });
      const wire = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
        depthTest: true
      });

      // Central impossible spine: disciplined but topologically wrong fold stack.
      const spineSegmentGeo = new THREE.BoxGeometry(0.24, 0.42, 0.1);
      const spinePoints = [];
      for (let i = 0; i < 6; i++) {
        const seg = new THREE.Mesh(spineSegmentGeo, obsidianMat);
        seg.name = `FoldCathedralSpineSegment${i}`;
        seg.position.set((i % 2 === 0 ? -0.05 : 0.07), -0.62 + i * 0.24, (i % 3 - 1) * 0.05);
        seg.rotation.set(
          0.26 + (i % 2 ? -0.34 : 0.4),
          -0.22 + i * 0.17,
          (i % 2 === 0 ? 0.5 : -0.46)
        );
        seg.scale.set(1.0 - i * 0.05, 1.0, 1.12 - i * 0.04);
        root.add(seg);
        spinePoints.push(seg.position.clone());

        const segEdges = new THREE.LineSegments(new THREE.EdgesGeometry(spineSegmentGeo, 8), wire);
        segEdges.name = `FoldCathedralSpineEdgesCage${i}`;
        segEdges.position.copy(seg.position);
        segEdges.rotation.copy(seg.rotation);
        segEdges.scale.copy(seg.scale);
        root.add(segEdges);
      }

      // Large fold planes in impossible orientations.
      const planeGeo = new THREE.BoxGeometry(1.06, 0.035, 0.56);
      const planeLayout = [
        { pos: new THREE.Vector3(-0.28, 0.28, 0.08), rot: new THREE.Euler(0.58, -0.34, 0.24), scl: new THREE.Vector3(1.0, 1.0, 1.18) },
        { pos: new THREE.Vector3(0.3, -0.06, -0.1), rot: new THREE.Euler(-0.46, 0.48, -0.36), scl: new THREE.Vector3(1.22, 1.0, 0.84) },
        { pos: new THREE.Vector3(-0.08, -0.34, 0.24), rot: new THREE.Euler(0.22, 0.18, 0.74), scl: new THREE.Vector3(0.92, 1.0, 1.26) },
        { pos: new THREE.Vector3(0.18, 0.46, -0.2), rot: new THREE.Euler(-0.64, -0.22, 0.18), scl: new THREE.Vector3(1.12, 1.0, 0.92) }
      ];
      planeLayout.forEach((cfg, i) => {
        const plane = new THREE.Mesh(planeGeo, foldMat);
        plane.name = `FoldCathedralPlane${i}`;
        plane.position.copy(cfg.pos);
        plane.rotation.copy(cfg.rot);
        plane.scale.copy(cfg.scl);
        root.add(plane);

        const planeEdges = new THREE.LineSegments(new THREE.EdgesGeometry(planeGeo, 8), wire);
        planeEdges.name = `FoldCathedralPlaneEdgesCage${i}`;
        planeEdges.position.copy(plane.position);
        planeEdges.rotation.copy(plane.rotation);
        planeEdges.scale.copy(plane.scale);
        root.add(planeEdges);
      });

      // Impossible bridges: seemingly illegal direct connections.
      const addBridge = (name, from, to) => {
        const dir = new THREE.Vector3().subVectors(to, from);
        const len = Math.max(0.001, dir.length());
        const bridgeGeo = new THREE.CylinderGeometry(0.018, 0.022, len, 6);
        const bridge = new THREE.Mesh(bridgeGeo, obsidianMat);
        bridge.name = name;
        const up = new THREE.Vector3(0, 1, 0);
        bridge.quaternion.setFromUnitVectors(up, dir.clone().normalize());
        bridge.position.copy(from).add(to).multiplyScalar(0.5);
        root.add(bridge);

        const bridgeEdges = new THREE.LineSegments(new THREE.EdgesGeometry(bridgeGeo, 8), wire);
        bridgeEdges.name = `${name}EdgesCage`;
        bridgeEdges.position.copy(bridge.position);
        bridgeEdges.quaternion.copy(bridge.quaternion);
        root.add(bridgeEdges);
      };
      addBridge('FoldCathedralImpossibleBridge0', spinePoints[0], spinePoints[4].clone().add(new THREE.Vector3(0.25, 0.08, -0.14)));
      addBridge('FoldCathedralImpossibleBridge1', spinePoints[1].clone().add(new THREE.Vector3(-0.3, 0.02, 0.2)), spinePoints[5]);
      addBridge('FoldCathedralImpossibleBridge2', spinePoints[2].clone().add(new THREE.Vector3(0.28, -0.16, 0.18)), spinePoints[3].clone().add(new THREE.Vector3(-0.3, 0.2, -0.22)));

      // Recursive folded seed at the center.
      const seedOuterGeo = new THREE.OctahedronGeometry(0.24, 0);
      const seedInnerGeo = new THREE.OctahedronGeometry(0.13, 0);
      const coreSeed = new THREE.Mesh(seedOuterGeo, seedMat);
      coreSeed.name = 'FoldCathedralRecursiveSeed';
      coreSeed.rotation.set(0.56, -0.4, 0.22);
      coreSeed.scale.set(1.0, 0.72, 1.18);
      root.add(coreSeed);

      const coreSeedInner = new THREE.Mesh(seedInnerGeo, seedMat);
      coreSeedInner.name = 'FoldCathedralRecursiveSeedNested';
      coreSeedInner.rotation.set(-0.34, 0.58, -0.29);
      coreSeedInner.scale.set(0.84, 1.14, 0.76);
      root.add(coreSeedInner);

      const seedOuterEdges = new THREE.LineSegments(new THREE.EdgesGeometry(seedOuterGeo, 8), wire);
      seedOuterEdges.name = 'FoldCathedralRecursiveSeedEdgesCage';
      seedOuterEdges.rotation.copy(coreSeed.rotation);
      seedOuterEdges.scale.copy(coreSeed.scale);
      root.add(seedOuterEdges);

      // Open polygonal fold halo / contour frame (non-torus).
      const buildOpenContour = (points, name) => {
        const pairs = [];
        for (let i = 0; i < points.length - 1; i++) {
          pairs.push(points[i], points[i + 1]);
        }
        const g = new THREE.BufferGeometry().setFromPoints(pairs);
        const contour = new THREE.LineSegments(g, wire);
        contour.name = name;
        root.add(contour);
      };

      const contourA = [
        new THREE.Vector3(-0.92, -0.42, -0.08),
        new THREE.Vector3(-0.36, -0.76, 0.28),
        new THREE.Vector3(0.48, -0.5, 0.36),
        new THREE.Vector3(0.88, 0.06, 0.08),
        new THREE.Vector3(0.42, 0.66, -0.22),
        new THREE.Vector3(-0.24, 0.86, -0.34),
        new THREE.Vector3(-0.82, 0.34, -0.14)
      ];
      const contourB = [
        new THREE.Vector3(-0.66, -0.12, 0.62),
        new THREE.Vector3(-0.12, -0.56, 0.78),
        new THREE.Vector3(0.46, -0.2, 0.64),
        new THREE.Vector3(0.62, 0.44, 0.3),
        new THREE.Vector3(0.16, 0.72, -0.02),
        new THREE.Vector3(-0.42, 0.46, 0.18)
      ];
      buildOpenContour(contourA, 'FoldCathedralOpenContourFrameA');
      buildOpenContour(contourB, 'FoldCathedralOpenContourFrameB');

      for (let i = 0; i < 4; i++) {
        const p1 = new THREE.Vector3((rng() - 0.5) * 1.2, (rng() - 0.5) * 1.1, (rng() - 0.5) * 1.1);
        const p2 = new THREE.Vector3((rng() - 0.5) * 1.2, (rng() - 0.5) * 1.1, (rng() - 0.5) * 1.1);
        const g = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const accent = new THREE.LineSegments(g, wire);
        accent.name = `FoldCathedralContourAccentWire${i}`;
        root.add(accent);
      }

      root.traverse(o => {
        if (o?.isMesh || o?.isLine || o?.isLineSegments || o?.isPoints) {
          validateMeshGeometry(o, o.name || 'error-folded');
        }
      });
      group.add(root);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createErrorFoldedImpossibleNode',
        category: 'error',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  static createErrorTopologyTearNode(group, visualCode, color) {
    try {
      const seed = group?.userData?.nodeId
        ? hashNodeIdToFloat(group.userData.nodeId)
        : hashNodeIdToFloat(`error-tear-${color}`);
      const rng = _mythicSeededRng(Math.floor(seed * 1000) || 1);
      const root = new THREE.Group();
      root.name = 'ERROR_TOPOLOGY_TEAR';
      root.userData.visualVariant = 'ERROR_SEVERED_CONTINUUM_RELIC_V2';

      const deformRelicGeometry = (geometry, amp = 0.05) => {
        const g = geometry.clone();
        const attr = g.attributes?.position;
        if (!attr) return g;
        for (let i = 0; i < attr.count; i++) {
          const x = attr.getX(i);
          const y = attr.getY(i);
          const z = attr.getZ(i);
          const fold = Math.sin((x + y * 0.7 - z * 0.4) * 3.0) * 0.02;
          attr.setXYZ(
            i,
            x + (rng() - 0.5) * amp + fold,
            y + (rng() - 0.5) * amp * 0.8 - fold * 0.6,
            z + (rng() - 0.5) * amp
          );
        }
        attr.needsUpdate = true;
        g.computeVertexNormals?.();
        return g;
      };

      const shellMat = new THREE.MeshPhysicalMaterial({
        color: 0x0a0d14,
        emissive: 0x101827,
        emissiveIntensity: 0.2,
        metalness: 0.65,
        roughness: 0.3,
        clearcoat: 0.2,
        clearcoatRoughness: 0.35
      });
      const seamMat = new THREE.MeshBasicMaterial({
        color: 0x8ff7ff,
        transparent: true,
        opacity: 0.9
      });
      const voidMat = new THREE.MeshBasicMaterial({
        color: 0x010305,
        transparent: true,
        opacity: 0.92,
        side: THREE.BackSide
      });
      const threadMat = new THREE.MeshBasicMaterial({
        color: 0x9af4ff,
        transparent: true,
        opacity: 0.84
      });
      const wire = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
        depthTest: true
      });

      // Main relic split into two unequal halves by an open rift gap.
      const relicGeo = deformRelicGeometry(new THREE.DodecahedronGeometry(0.7, 1), 0.06);
      const halfA = new THREE.Mesh(relicGeo, shellMat);
      halfA.name = 'ContinuumRelicHalfA';
      halfA.position.set(-0.18, 0.04, 0.06);
      halfA.rotation.set(0.22, -0.37, 0.18);
      halfA.scale.set(1.0, 1.14, 0.86);
      root.add(halfA);

      const halfB = new THREE.Mesh(relicGeo, shellMat);
      halfB.name = 'ContinuumRelicHalfB';
      halfB.position.set(0.2, -0.03, -0.07);
      halfB.rotation.set(-0.17, 0.34, -0.22);
      halfB.scale.set(0.88, 0.92, 1.22);
      root.add(halfB);

      const halfAEdges = new THREE.LineSegments(new THREE.EdgesGeometry(relicGeo, 8), wire);
      halfAEdges.name = 'ContinuumRelicHalfAEdgesCage';
      halfAEdges.position.copy(halfA.position);
      halfAEdges.rotation.copy(halfA.rotation);
      halfAEdges.scale.copy(halfA.scale);
      root.add(halfAEdges);

      const halfBEdges = new THREE.LineSegments(new THREE.EdgesGeometry(relicGeo, 8), wire);
      halfBEdges.name = 'ContinuumRelicHalfBEdgesCage';
      halfBEdges.position.copy(halfB.position);
      halfBEdges.rotation.copy(halfB.rotation);
      halfBEdges.scale.copy(halfB.scale);
      root.add(halfBEdges);

      // Inner rift cavity and cold seam.
      const seamCore = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 1.08, 12, 1, true), voidMat);
      seamCore.name = 'ContinuumRiftVoidCavity';
      seamCore.rotation.set(0.61, -0.16, 0.43);
      seamCore.position.set(0.02, 0.02, -0.01);
      root.add(seamCore);

      const seamRibbon = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.018, 8, 80, Math.PI * 1.16), seamMat);
      seamRibbon.name = 'ContinuumRiftColdSeam';
      seamRibbon.rotation.set(0.63, -0.2, 0.44);
      seamRibbon.scale.set(1.0, 0.56, 1.34);
      seamRibbon.position.set(0.01, 0.02, -0.01);
      root.add(seamRibbon);

      for (let i = 0; i < 5; i++) {
        const ribGeo = new THREE.BoxGeometry(0.025, 0.22 + i * 0.04, 0.016);
        const rib = new THREE.Mesh(ribGeo, seamMat);
        rib.name = `ContinuumRiftInnerRib${i}`;
        rib.position.set(
          -0.03 + i * 0.018,
          -0.2 + i * 0.1,
          -0.05 + (rng() - 0.5) * 0.08
        );
        rib.rotation.set(0.58 + i * 0.04, -0.22 + i * 0.07, 0.36 + (rng() - 0.5) * 0.2);
        root.add(rib);
      }

      // Continuity threads keeping the severed halves together.
      const threadCount = 3 + Math.floor(rng() * 5); // 3..7
      for (let i = 0; i < threadCount; i++) {
        const start = new THREE.Vector3(
          halfA.position.x + 0.12 + (rng() - 0.5) * 0.12,
          halfA.position.y + (rng() - 0.5) * 0.28,
          halfA.position.z + (rng() - 0.5) * 0.18
        );
        const end = new THREE.Vector3(
          halfB.position.x - 0.12 + (rng() - 0.5) * 0.12,
          halfB.position.y + (rng() - 0.5) * 0.28,
          halfB.position.z + (rng() - 0.5) * 0.18
        );
        const ctrl = new THREE.Vector3(
          (start.x + end.x) * 0.5 + (rng() - 0.5) * 0.2,
          (start.y + end.y) * 0.5 + (rng() - 0.5) * 0.24,
          (start.z + end.z) * 0.5 + (rng() - 0.5) * 0.2
        );
        const strandCurve = new THREE.QuadraticBezierCurve3(start, ctrl, end);
        const strandGeo = new THREE.TubeGeometry(strandCurve, 24, 0.008 + rng() * 0.005, 6, false);
        const strand = new THREE.Mesh(strandGeo, threadMat);
        strand.name = `ContinuumRiftThread${i}`;
        root.add(strand);

        const strandWireGeo = new THREE.BufferGeometry().setFromPoints(strandCurve.getPoints(20));
        const strandWire = new THREE.Line(strandWireGeo, wire);
        strandWire.name = `ContinuumRiftThreadWire${i}`;
        root.add(strandWire);
      }

      // Detached topology fragments (2..4), meaningful larger shards.
      const fragmentCount = 2 + Math.floor(rng() * 3);
      for (let i = 0; i < fragmentCount; i++) {
        const fragGeo = deformRelicGeometry(new THREE.TetrahedronGeometry(0.19 + i * 0.05, 0), 0.03);
        const frag = new THREE.Mesh(fragGeo, shellMat);
        frag.name = `ContinuumDetachedFragment${i}`;
        frag.position.set(
          (i % 2 === 0 ? -0.46 : 0.48) + (rng() - 0.5) * 0.1,
          -0.2 + i * 0.2 + (rng() - 0.5) * 0.08,
          (rng() - 0.5) * 0.42
        );
        frag.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
        frag.scale.set(1.0 + i * 0.12, 0.82 + i * 0.08, 1.06 - i * 0.05);
        root.add(frag);

        const fragEdges = new THREE.LineSegments(new THREE.EdgesGeometry(fragGeo, 8), wire);
        fragEdges.name = `ContinuumDetachedFragmentEdgesCage${i}`;
        fragEdges.position.copy(frag.position);
        fragEdges.rotation.copy(frag.rotation);
        fragEdges.scale.copy(frag.scale);
        root.add(fragEdges);
      }

      // Split cage frame / rift bracket structure aligned with rift direction.
      const addBracketFrame = (points, name, offset) => {
        const segs = [];
        for (let i = 0; i < points.length - 1; i++) segs.push(points[i], points[i + 1]);
        const g = new THREE.BufferGeometry().setFromPoints(segs);
        const frame = new THREE.LineSegments(g, wire);
        frame.name = name;
        frame.position.copy(offset);
        root.add(frame);
      };
      const bracketShapeA = [
        new THREE.Vector3(-0.6, -0.44, -0.08),
        new THREE.Vector3(-0.28, -0.7, 0.14),
        new THREE.Vector3(0.02, -0.54, 0.18),
        new THREE.Vector3(0.12, -0.08, 0.08),
        new THREE.Vector3(-0.12, 0.28, -0.02),
        new THREE.Vector3(-0.42, 0.5, -0.12)
      ];
      const bracketShapeB = [
        new THREE.Vector3(0.14, -0.3, 0.06),
        new THREE.Vector3(0.44, -0.56, -0.12),
        new THREE.Vector3(0.74, -0.2, -0.22),
        new THREE.Vector3(0.68, 0.24, -0.16),
        new THREE.Vector3(0.34, 0.5, 0.02),
        new THREE.Vector3(0.08, 0.26, 0.1)
      ];
      addBracketFrame(bracketShapeA, 'ContinuumSplitCageFrameA', new THREE.Vector3(0, 0, 0));
      addBracketFrame(bracketShapeB, 'ContinuumSplitCageFrameB', new THREE.Vector3(0, 0, 0));

      const bracketWireA = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-0.08, -0.3, -0.06),
          new THREE.Vector3(0.08, 0.18, 0.04)
        ]),
        wire
      );
      bracketWireA.name = 'ContinuumRiftBracketWireA';
      root.add(bracketWireA);

      const bracketWireB = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-0.02, -0.12, -0.14),
          new THREE.Vector3(0.06, 0.34, 0.12)
        ]),
        wire
      );
      bracketWireB.name = 'ContinuumRiftBracketWireB';
      root.add(bracketWireB);

      root.traverse(o => {
        if (o?.isMesh || o?.isLine || o?.isLineSegments || o?.isPoints) {
          validateMeshGeometry(o, o.name || 'error-topology-tear');
        }
      });
      group.add(root);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createErrorTopologyTearNode',
        category: 'error',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  static createErrorCorruptedManifoldNode(group, visualCode, color) {
    try {
      const seed = group?.userData?.nodeId
        ? hashNodeIdToFloat(group.userData.nodeId)
        : hashNodeIdToFloat(`error-corrupted-${color}`);
      const rng = _mythicSeededRng(Math.floor(seed * 1000) || 1);
      const root = new THREE.Group();
      root.name = 'ERROR_CORRUPTED_MANIFOLD';
      root.userData.visualVariant = 'ERROR_APOSTATE_FLESH_OF_GEOMETRY_V2';

      const makeCorruptedMassGeometry = (baseRadius = 0.64, detail = 2) => {
        const geo = new THREE.IcosahedronGeometry(baseRadius, detail);
        const pos = geo.attributes?.position;
        if (!pos) return geo;

        const lobeCenters = [
          new THREE.Vector3(0.92, 0.3, -0.08).normalize(),
          new THREE.Vector3(-0.72, 0.62, 0.26).normalize(),
          new THREE.Vector3(0.2, -0.94, 0.32).normalize(),
          new THREE.Vector3(-0.18, 0.16, -0.97).normalize()
        ];
        const lobeWeights = [0.24, 0.18, 0.2, 0.14];

        for (let i = 0; i < pos.count; i++) {
          const p = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
          const n = p.clone().normalize();

          let lobeInflation = 0;
          for (let j = 0; j < lobeCenters.length; j++) {
            const d = n.distanceTo(lobeCenters[j]);
            lobeInflation += Math.exp(-(d * d) * 7.2) * lobeWeights[j];
          }
          const undulate = Math.sin(n.x * 8.0 + n.y * 6.2 - n.z * 5.4) * 0.035;
          const radial = baseRadius * (0.93 + lobeInflation + undulate);
          const warped = n.multiplyScalar(radial).add(new THREE.Vector3(
            n.y * 0.05,
            -n.z * 0.03,
            n.x * 0.04
          ));
          pos.setXYZ(i, warped.x, warped.y, warped.z);
        }

        pos.needsUpdate = true;
        geo.computeVertexNormals?.();
        return geo;
      };

      const bodyMat = new THREE.MeshPhysicalMaterial({
        color: 0x0d0a12,
        emissive: 0x160d22,
        emissiveIntensity: 0.2,
        metalness: 0.66,
        roughness: 0.3,
        clearcoat: 0.24,
        clearcoatRoughness: 0.28
      });
      const tumorMat = new THREE.MeshPhysicalMaterial({
        color: 0x15101b,
        emissive: 0x2b1638,
        emissiveIntensity: 0.26,
        metalness: 0.52,
        roughness: 0.36,
        clearcoat: 0.18,
        clearcoatRoughness: 0.34
      });
      const sutureMat = new THREE.MeshBasicMaterial({
        color: 0xee2f9f,
        transparent: true,
        opacity: 0.9
      });
      const cavityMat = new THREE.MeshBasicMaterial({
        color: 0x05060a,
        transparent: true,
        opacity: 0.92,
        side: THREE.BackSide
      });
      const parasiteMat = new THREE.MeshStandardMaterial({
        color: 0x1a1322,
        emissive: 0x3a1743,
        emissiveIntensity: 0.18,
        metalness: 0.42,
        roughness: 0.44
      });
      const wireMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
        depthTest: true
      });
      const crownMat = new THREE.LineBasicMaterial({
        color: 0xc06dff,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
        depthTest: true
      });

      // Dominant corrupted manifold body with infected lobes.
      const manifoldGeo = makeCorruptedMassGeometry(0.64, 2);
      const manifold = new THREE.Mesh(manifoldGeo, bodyMat);
      manifold.name = 'ApostateCorruptedManifoldBody';
      manifold.scale.set(1.06, 0.9, 1.2);
      manifold.rotation.set(0.22, -0.34, 0.14);
      root.add(manifold);

      const manifoldEdges = new THREE.LineSegments(new THREE.EdgesGeometry(manifoldGeo, 8), wireMat);
      manifoldEdges.name = 'ApostateCorruptedManifoldEdgesCage';
      manifoldEdges.scale.copy(manifold.scale);
      manifoldEdges.rotation.copy(manifold.rotation);
      root.add(manifoldEdges);

      // Local thickened tumors / bulges (infected but still elegant).
      const tumorLayout = [
        { pos: new THREE.Vector3(0.34, 0.24, -0.08), scl: new THREE.Vector3(0.62, 0.42, 0.5), rot: new THREE.Euler(0.38, -0.24, 0.42) },
        { pos: new THREE.Vector3(-0.28, 0.14, 0.26), scl: new THREE.Vector3(0.5, 0.56, 0.44), rot: new THREE.Euler(-0.22, 0.46, -0.18) },
        { pos: new THREE.Vector3(0.12, -0.32, 0.18), scl: new THREE.Vector3(0.58, 0.38, 0.62), rot: new THREE.Euler(0.52, 0.2, -0.3) }
      ];
      tumorLayout.forEach((t, i) => {
        const g = makeCorruptedMassGeometry(0.22 + i * 0.03, 1);
        const m = new THREE.Mesh(g, tumorMat);
        m.name = `ApostateTumorBulge${i}`;
        m.position.copy(t.pos);
        m.rotation.copy(t.rot);
        m.scale.copy(t.scl);
        root.add(m);
      });

      // False openings / pseudo-cavities with misleading seams.
      const openingLayout = [
        { pos: new THREE.Vector3(0.24, -0.08, 0.36), rot: new THREE.Euler(0.62, -0.22, 0.1), scl: new THREE.Vector3(0.52, 0.3, 0.26) },
        { pos: new THREE.Vector3(-0.34, 0.18, -0.18), rot: new THREE.Euler(-0.32, 0.44, -0.28), scl: new THREE.Vector3(0.46, 0.34, 0.24) },
        { pos: new THREE.Vector3(0.04, 0.34, -0.28), rot: new THREE.Euler(0.18, 0.16, 0.52), scl: new THREE.Vector3(0.38, 0.24, 0.22) }
      ];
      openingLayout.forEach((o, i) => {
        const cavity = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), cavityMat);
        cavity.name = `ApostatePseudoCavity${i}`;
        cavity.position.copy(o.pos);
        cavity.rotation.copy(o.rot);
        cavity.scale.copy(o.scl);
        root.add(cavity);

        const rimPoints = [];
        for (let s = 0; s <= 22; s++) {
          const a = (s / 22) * Math.PI * 2;
          rimPoints.push(new THREE.Vector3(Math.cos(a) * 0.14, Math.sin(a) * 0.08, 0));
        }
        const rimCurve = new THREE.CatmullRomCurve3(rimPoints, true);
        const rimGeo = new THREE.TubeGeometry(rimCurve, 40, 0.008, 6, true);
        const rim = new THREE.Mesh(rimGeo, sutureMat);
        rim.name = `ApostatePseudoCavityRim${i}`;
        rim.position.copy(o.pos);
        rim.rotation.copy(o.rot);
        rim.scale.copy(new THREE.Vector3(o.scl.x * 1.6, o.scl.y * 1.4, 1.0));
        root.add(rim);
      });

      // Corruption sutures / pathological seam lines over the shell.
      const addSuture = (name, points, radius = 0.01) => {
        const curve = new THREE.CatmullRomCurve3(points);
        const geo = new THREE.TubeGeometry(curve, 40, radius, 6, false);
        const seamMesh = new THREE.Mesh(geo, sutureMat);
        seamMesh.name = name;
        root.add(seamMesh);

        const seamWire = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve.getPoints(26)),
          wireMat
        );
        seamWire.name = `${name}Wire`;
        root.add(seamWire);
      };

      addSuture('ApostateCorruptionSutureA', [
        new THREE.Vector3(-0.46, -0.16, 0.08),
        new THREE.Vector3(-0.22, 0.08, 0.34),
        new THREE.Vector3(0.12, 0.2, 0.38),
        new THREE.Vector3(0.42, 0.34, 0.12)
      ], 0.011);
      addSuture('ApostateCorruptionSutureB', [
        new THREE.Vector3(-0.34, 0.34, -0.18),
        new THREE.Vector3(-0.08, 0.18, -0.42),
        new THREE.Vector3(0.18, -0.04, -0.3),
        new THREE.Vector3(0.36, -0.3, -0.06)
      ], 0.01);
      addSuture('ApostateCorruptionSutureC', [
        new THREE.Vector3(-0.1, -0.46, 0.02),
        new THREE.Vector3(0.08, -0.18, 0.18),
        new THREE.Vector3(0.24, 0.04, -0.06),
        new THREE.Vector3(0.06, 0.32, -0.28)
      ], 0.009);
      addSuture('ApostateCorruptionSutureD', [
        new THREE.Vector3(-0.22, -0.12, -0.3),
        new THREE.Vector3(-0.02, 0.08, -0.1),
        new THREE.Vector3(0.22, 0.16, 0.06),
        new THREE.Vector3(0.44, -0.08, 0.22)
      ], 0.008);

      // Parasite sub-structures with thin connecting bridges.
      const parasiteCount = 3 + Math.floor(rng() * 4); // 3..6
      for (let i = 0; i < parasiteCount; i++) {
        const parasiteGeo = makeCorruptedMassGeometry(0.12 + i * 0.02, 1);
        const parasite = new THREE.Mesh(parasiteGeo, parasiteMat);
        parasite.name = `ApostateParasiteNode${i}`;

        const angle = 0.9 + i * 1.02 + rng() * 0.4;
        const radius = 0.92 + i * 0.08 + (rng() - 0.5) * 0.06;
        parasite.position.set(
          Math.cos(angle) * radius,
          -0.16 + i * 0.12 + (rng() - 0.5) * 0.08,
          Math.sin(angle) * (0.62 + i * 0.05)
        );
        parasite.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
        parasite.scale.set(0.9 + i * 0.08, 0.74 + i * 0.06, 1.02 - i * 0.04);
        root.add(parasite);

        const parasiteEdges = new THREE.LineSegments(new THREE.EdgesGeometry(parasiteGeo, 8), wireMat);
        parasiteEdges.name = `ApostateParasiteNodeEdgesCage${i}`;
        parasiteEdges.position.copy(parasite.position);
        parasiteEdges.rotation.copy(parasite.rotation);
        parasiteEdges.scale.copy(parasite.scale);
        root.add(parasiteEdges);

        const anchor = parasite.position.clone().normalize().multiplyScalar(0.55);
        const ctrl = new THREE.Vector3(
          (anchor.x + parasite.position.x) * 0.5 + (rng() - 0.5) * 0.16,
          (anchor.y + parasite.position.y) * 0.5 + (rng() - 0.5) * 0.12,
          (anchor.z + parasite.position.z) * 0.5 + (rng() - 0.5) * 0.16
        );
        const bridgeCurve = new THREE.QuadraticBezierCurve3(anchor, ctrl, parasite.position.clone().multiplyScalar(0.92));
        const bridgeGeo = new THREE.TubeGeometry(bridgeCurve, 20, 0.007 + rng() * 0.003, 6, false);
        const bridge = new THREE.Mesh(bridgeGeo, parasiteMat);
        bridge.name = `ApostateParasiteBridge${i}`;
        root.add(bridge);
      }

      // Corrupted crown-frame lattice (secondary infected aura).
      const addLatticeFrame = (name, pts) => {
        const segs = [];
        for (let i = 0; i < pts.length - 1; i++) segs.push(pts[i], pts[i + 1]);
        const g = new THREE.BufferGeometry().setFromPoints(segs);
        const frame = new THREE.LineSegments(g, crownMat);
        frame.name = name;
        root.add(frame);
      };
      addLatticeFrame('ApostateCrownLatticeFrameA', [
        new THREE.Vector3(-0.92, 0.08, -0.18),
        new THREE.Vector3(-0.64, 0.54, -0.36),
        new THREE.Vector3(-0.2, 0.82, -0.28),
        new THREE.Vector3(0.26, 0.76, -0.02),
        new THREE.Vector3(0.72, 0.42, 0.26),
        new THREE.Vector3(0.86, -0.12, 0.18),
        new THREE.Vector3(0.42, -0.44, -0.12)
      ]);
      addLatticeFrame('ApostateCrownLatticeFrameB', [
        new THREE.Vector3(-0.68, -0.24, 0.48),
        new THREE.Vector3(-0.22, -0.58, 0.66),
        new THREE.Vector3(0.34, -0.54, 0.42),
        new THREE.Vector3(0.66, -0.14, 0.1),
        new THREE.Vector3(0.32, 0.36, -0.08),
        new THREE.Vector3(-0.16, 0.52, 0.1),
        new THREE.Vector3(-0.56, 0.2, 0.44)
      ]);
      addLatticeFrame('ApostateCrownLatticeFrameC', [
        new THREE.Vector3(-0.34, -0.78, -0.22),
        new THREE.Vector3(0.08, -0.84, -0.38),
        new THREE.Vector3(0.52, -0.62, -0.24),
        new THREE.Vector3(0.66, -0.22, 0.04),
        new THREE.Vector3(0.32, 0.06, 0.2)
      ]);

      root.traverse(o => {
        if (o?.isMesh || o?.isLine || o?.isLineSegments || o?.isPoints) {
          validateMeshGeometry(o, o.name || 'error-corrupted-manifold');
        }
      });
      group.add(root);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createErrorCorruptedManifoldNode',
        category: 'error',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  // ===== EMOTIONAL NODES (Crystalline Organics - 6 variants) =====

  /**
  * Main emotional node creator
  * CANONICAL CATEGORY: EMOTIONAL
  * - HeartCrystal, NeuralLobe, BloomingGem
  * - TearShaped, Folded, SymmetricSeed
  */
  static createEmotionalHeartCrystal(group, visualCode, color) {
    try {
      const geometries = _getEmotionalHeartCrystalGeometries();
      const resolvedColor = typeof color === 'undefined' ? visualCode : color;
      const materials = _getEmotionalHeartCrystalMaterials(resolvedColor);
      const root = new THREE.Group();
      root.name = 'EMOTIONAL_DEVOTIONAL_HEART_NODE';
      root.userData.visualVariant = 'EMOTIONAL_DEVOTIONAL_HEART_V4';
      root.userData.nodeGeometryName = 'EMOTIONAL_DEVOTIONAL_HEART';

      const seed = group?.userData?.nodeId ? hashString(group.userData.nodeId) : (Number.isFinite(visualCode) ? visualCode : 1201);
      const rng = _mythicSeededRng(seed);
      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const sanctumCore = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      sanctumCore.name = 'SanctumCore';
      sanctumCore.userData.ignoreWaveColor = true;
      sanctumCore.position.set(-0.02, 0.03, 0.02);
      sanctumCore.rotation.set(0.2, -0.28, 0.12);
      sanctumCore.scale.set(1.02, 1.12, 0.92);
      sanctumCore.renderOrder = coreOrder;
      coreGroup.add(sanctumCore);

      const sanctumEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.witnessEdgeMat);
      sanctumEdges.name = 'SanctumCore_Edges';
      sanctumEdges.userData.ignoreWaveColor = true;
      sanctumEdges.position.copy(sanctumCore.position);
      sanctumEdges.rotation.copy(sanctumCore.rotation);
      sanctumEdges.scale.copy(sanctumCore.scale);
      sanctumEdges.renderOrder = archOrder;
      coreGroup.add(sanctumEdges);

      const devotionalSeam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      devotionalSeam.name = 'DevotionalSeam';
      devotionalSeam.userData.ignoreWaveColor = true;
      devotionalSeam.position.set(0.03, 0.06, -0.01);
      devotionalSeam.rotation.set(0.48, 0.36, -0.24);
      devotionalSeam.scale.set(0.88, 1.02, 0.82);
      devotionalSeam.renderOrder = archOrder;
      coreGroup.add(devotionalSeam);

      const sentientSeed = new THREE.Mesh(geometries.seedGeometry, materials.seedMat);
      sentientSeed.name = 'SentientSeed';
      sentientSeed.userData.ignoreWaveColor = true;
      sentientSeed.position.set(0.02, 0.11, 0.01);
      sentientSeed.rotation.set(-0.12, 0.54, 0.28);
      sentientSeed.scale.set(0.82, 1.18, 0.72);
      sentientSeed.renderOrder = coreOrder;
      coreGroup.add(sentientSeed);

      const refinedCage = new THREE.LineSegments(geometries.cageEdgesGeometry, materials.cageMat);
      refinedCage.name = 'RefinedEdgeCage';
      refinedCage.userData.ignoreWaveColor = true;
      refinedCage.position.copy(sanctumCore.position).add(new THREE.Vector3(0.02, 0.06, -0.01));
      refinedCage.rotation.set(sanctumCore.rotation.x + 0.22, sanctumCore.rotation.y - 0.12, sanctumCore.rotation.z + 0.08);
      refinedCage.scale.copy(sanctumCore.scale).multiplyScalar(1.2);
      refinedCage.renderOrder = archOrder;
      coreGroup.add(refinedCage);

      root.add(coreGroup);

      const shrineGroup = new THREE.Group();
      shrineGroup.name = 'SHRINE_GROUP';

      const shrineHalfA = new THREE.Mesh(geometries.shrineGeometryA, materials.shrineMatA);
      shrineHalfA.name = 'ReliquaryHalf_A';
      shrineHalfA.userData.ignoreWaveColor = true;
      shrineHalfA.position.set(-0.28, 0.05, 0.02);
      shrineHalfA.rotation.set(0.18, -0.84, 0.22);
      shrineHalfA.scale.set(0.86, 1.02, 0.88);
      shrineHalfA.renderOrder = archOrder;
      shrineGroup.add(shrineHalfA);

      const shrineHalfAEdges = new THREE.LineSegments(geometries.shrineEdgesGeometryA, materials.shrineEdgeMat);
      shrineHalfAEdges.name = 'ReliquaryHalf_A_Edges';
      shrineHalfAEdges.userData.ignoreWaveColor = true;
      shrineHalfAEdges.position.copy(shrineHalfA.position);
      shrineHalfAEdges.rotation.copy(shrineHalfA.rotation);
      shrineHalfAEdges.scale.copy(shrineHalfA.scale);
      shrineHalfAEdges.renderOrder = archOrder;
      shrineGroup.add(shrineHalfAEdges);

      const shrineHalfB = new THREE.Mesh(geometries.shrineGeometryB, materials.shrineMatB);
      shrineHalfB.name = 'ReliquaryHalf_B';
      shrineHalfB.userData.ignoreWaveColor = true;
      shrineHalfB.position.set(0.24, 0.0, -0.04);
      shrineHalfB.rotation.set(-0.12, 0.94, -0.28);
      shrineHalfB.scale.set(0.74, 1.06, 0.8);
      shrineHalfB.renderOrder = archOrder;
      shrineGroup.add(shrineHalfB);

      const shrineHalfBEdges = new THREE.LineSegments(geometries.shrineEdgesGeometryB, materials.shrineEdgeMat);
      shrineHalfBEdges.name = 'ReliquaryHalf_B_Edges';
      shrineHalfBEdges.userData.ignoreWaveColor = true;
      shrineHalfBEdges.position.copy(shrineHalfB.position);
      shrineHalfBEdges.rotation.copy(shrineHalfB.rotation);
      shrineHalfBEdges.scale.copy(shrineHalfB.scale);
      shrineHalfBEdges.renderOrder = archOrder;
      shrineGroup.add(shrineHalfBEdges);

      root.add(shrineGroup);

      const venerationGroup = new THREE.Group();
      venerationGroup.name = 'VENERATION_GROUP';
      const witnessConfigs = [
        { name: 'WitnessShard_A', pos: [-0.44, -0.18, 0.22], rot: [0.34, -1.06, 0.92], scale: [0.78, 0.92, 0.72] },
        { name: 'WitnessShard_B', pos: [0.3, -0.12, 0.3], rot: [-0.12, 0.88, -0.54], scale: [0.66, 0.82, 0.62] }
      ];
      witnessConfigs.forEach((cfg, idx) => {
        const witness = new THREE.Mesh(geometries.witnessGeometry, materials.witnessMat);
        witness.name = cfg.name;
        witness.userData.ignoreWaveColor = true;
        witness.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        witness.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.08,
          cfg.rot[1] + (rng() - 0.5) * 0.1,
          cfg.rot[2] + (rng() - 0.5) * 0.08
        );
        witness.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        witness.renderOrder = archOrder;
        venerationGroup.add(witness);

        const witnessEdges = new THREE.LineSegments(geometries.witnessEdgesGeometry, materials.witnessEdgeMat);
        witnessEdges.name = `${cfg.name}_Edges`;
        witnessEdges.userData.ignoreWaveColor = true;
        witnessEdges.position.copy(witness.position);
        witnessEdges.rotation.copy(witness.rotation);
        witnessEdges.scale.copy(witness.scale);
        witnessEdges.renderOrder = archOrder;
        venerationGroup.add(witnessEdges);
      });

      const arcConfigs = [
        { name: 'ReverentArc_A', pos: [-0.02, 0.22, 0.12], rot: [0.22, -0.08, 0.16], scale: [0.88, 0.92, 0.82] },
        { name: 'ReverentArc_B', pos: [0.04, 0.04, -0.16], rot: [0.7, 0.84, -0.22], scale: [0.72, 0.82, 0.72] }
      ];
      arcConfigs.forEach((cfg) => {
        const arc = new THREE.Mesh(geometries.arcGeometry, materials.arcMat);
        arc.name = cfg.name;
        arc.userData.ignoreWaveColor = true;
        arc.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        arc.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        arc.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        arc.renderOrder = archOrder;
        venerationGroup.add(arc);

        const arcEdges = new THREE.LineSegments(geometries.arcEdgesGeometry, materials.arcEdgeMat);
        arcEdges.name = `${cfg.name}_Edges`;
        arcEdges.userData.ignoreWaveColor = true;
        arcEdges.position.copy(arc.position);
        arcEdges.rotation.copy(arc.rotation);
        arcEdges.scale.copy(arc.scale);
        arcEdges.renderOrder = archOrder;
        venerationGroup.add(arcEdges);
      });

      root.add(venerationGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const innerGlow = new THREE.Mesh(geometries.seedGeometry, materials.glowMat);
      innerGlow.name = 'DevotionalGlow';
      innerGlow.userData.ignoreWaveColor = true;
      innerGlow.position.copy(sentientSeed.position).add(new THREE.Vector3(-0.01, 0.0, 0.0));
      innerGlow.rotation.copy(sentientSeed.rotation);
      innerGlow.scale.set(1.68, 2.02, 1.42);
      innerGlow.renderOrder = archOrder;
      auraGroup.add(innerGlow);

      const devotionalDust = new THREE.Points(geometries.dustGeometry, materials.dustMat);
      devotionalDust.name = 'DevotionalDust';
      devotionalDust.userData.ignoreWaveColor = true;
      devotionalDust.position.set(0.0, 0.02, 0.01);
      devotionalDust.rotation.set(0.14, -0.26, 0.08);
      devotionalDust.scale.set(0.92, 1.04, 0.88);
      devotionalDust.frustumCulled = false;
      devotionalDust.renderOrder = archOrder;
      auraGroup.add(devotionalDust);

      const shellA = createNodeHologramShell(sanctumCore, 0xd7fbff);
      if (shellA) {
        shellA.name = 'EmotionShell_A';
        shellA.position.copy(sanctumCore.position);
        shellA.quaternion.copy(sanctumCore.quaternion);
        shellA.scale.copy(sanctumCore.scale).multiplyScalar(1.08);
        shellA.frustumCulled = false;
        shellA.renderOrder = archOrder;
        if (shellA.material?.uniforms?.uOpacity) shellA.material.uniforms.uOpacity.value = 0.03;
        auraGroup.add(shellA);
      }

      const shellB = createNodeHologramShell(shrineHalfA, 0xffdfef);
      if (shellB) {
        shellB.name = 'EmotionShell_B';
        shellB.position.copy(shrineHalfA.position);
        shellB.quaternion.copy(shrineHalfA.quaternion);
        shellB.scale.copy(shrineHalfA.scale).multiplyScalar(1.04);
        shellB.frustumCulled = false;
        shellB.renderOrder = archOrder;
        if (shellB.material?.uniforms?.uOpacity) shellB.material.uniforms.uOpacity.value = 0.022;
        auraGroup.add(shellB);
      }

      const edgeGlow = createNodeNeonEdgeGlowShell(sanctumCore, 0xffd9e6, {
        glowIntensity: 0.42,
        edgeWidth: 0.042,
        pulseAmount: 0.0
      });
      if (edgeGlow) {
        edgeGlow.name = 'EmotionEdgeGlow';
        edgeGlow.position.copy(sanctumCore.position);
        edgeGlow.quaternion.copy(sanctumCore.quaternion);
        edgeGlow.scale.copy(sanctumCore.scale).multiplyScalar(1.04);
        edgeGlow.frustumCulled = false;
        edgeGlow.renderOrder = archOrder;
        auraGroup.add(edgeGlow);
      }

      root.add(auraGroup);

      root.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'emotional-heart-crystal');
        }
      });

      root.userData.visualReady = true;
      root.userData.emotionalVariant = 'DEVOTIONAL_HEART';
      root.userData.emotionalMood = 'SACRED_VULNERABILITY';
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'EMOTIONAL_HEART_CRYSTAL';
      group.add(root);
      return group;
    } catch (err) {
      console.error('[EmotionalHeartCrystalAbort]', {
        reason: err?.message || err,
        visualCode
      });
      return null;
    }
  }

  static createEmotionalNeuralLobe(group, visualCode, color) {
    try {
      const geometries = _getEmotionalNeuralLobeGeometries();
      const resolvedColor = typeof color === 'undefined' ? visualCode : color;
      const materials = _getEmotionalNeuralLobeMaterials(resolvedColor);
      const root = new THREE.Group();
      root.name = 'EMOTIONAL_NEURAL_LOBE_NODE';
      root.userData.visualVariant = 'EMOTIONAL_NEURAL_LOBE_BITTERSWEET_COGNITION_V4';
      root.userData.nodeGeometryName = 'EMOTIONAL_NEURAL_LOBE_BITTERSWEET_COGNITION';

      const seed = group?.userData?.nodeId ? hashString(group.userData.nodeId) : (Number.isFinite(visualCode) ? visualCode : 1202);
      const rng = _mythicSeededRng(seed);
      const scratch = new THREE.Object3D();
      const anchorStart = new THREE.Vector3(-0.52, -0.12, 0.58);
      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const leftLobe = new THREE.Mesh(geometries.lobeGeometry, materials.lobeMatA);
      leftLobe.name = 'CognitionLobe_A';
      leftLobe.userData.ignoreWaveColor = true;
      leftLobe.position.set(-0.24, -0.02, 0.08);
      leftLobe.rotation.set(0.28, -0.48, 0.18);
      leftLobe.scale.set(0.92, 0.88, 1.14);
      leftLobe.renderOrder = coreOrder;
      coreGroup.add(leftLobe);

      const leftEdges = new THREE.LineSegments(geometries.lobeEdgesGeometry, materials.edgeMat);
      leftEdges.name = 'CognitionLobe_A_Edges';
      leftEdges.userData.ignoreWaveColor = true;
      leftEdges.position.copy(leftLobe.position);
      leftEdges.rotation.copy(leftLobe.rotation);
      leftEdges.scale.copy(leftLobe.scale);
      leftEdges.renderOrder = archOrder;
      coreGroup.add(leftEdges);

      const rightLobe = new THREE.Mesh(geometries.lobeGeometry, materials.lobeMatB);
      rightLobe.name = 'CognitionLobe_B';
      rightLobe.userData.ignoreWaveColor = true;
      rightLobe.position.set(0.22, 0.08, -0.08);
      rightLobe.rotation.set(-0.22, 0.54, -0.16);
      rightLobe.scale.set(1.0, 0.88, 1.08);
      rightLobe.renderOrder = coreOrder;
      coreGroup.add(rightLobe);

      const rightEdges = new THREE.LineSegments(geometries.lobeEdgesGeometry, materials.edgeMat);
      rightEdges.name = 'CognitionLobe_B_Edges';
      rightEdges.userData.ignoreWaveColor = true;
      rightEdges.position.copy(rightLobe.position);
      rightEdges.rotation.copy(rightLobe.rotation);
      rightEdges.scale.copy(rightLobe.scale);
      rightEdges.renderOrder = archOrder;
      coreGroup.add(rightEdges);

      const seam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      seam.name = 'UntouchableInnerSeam';
      seam.userData.ignoreWaveColor = true;
      seam.position.set(-0.02, 0.02, 0.02);
      seam.rotation.set(0.28, 0.28, -0.18);
      seam.scale.set(0.9, 1.08, 0.84);
      seam.renderOrder = coreOrder;
      coreGroup.add(seam);

      const nucleus = new THREE.Mesh(geometries.nucleusGeometry, materials.nucleusMat);
      nucleus.name = 'SentienceNucleus';
      nucleus.userData.ignoreWaveColor = true;
      nucleus.position.set(-0.04, 0.07, 0.03);
      nucleus.rotation.set(-0.12, 0.32, 0.18);
      nucleus.scale.set(0.82, 1.22, 0.72);
      nucleus.renderOrder = coreOrder;
      coreGroup.add(nucleus);

      root.add(coreGroup);

      const psycheGroup = new THREE.Group();
      psycheGroup.name = 'PSYCHE_GROUP';

      const membraneA = new THREE.Mesh(geometries.membraneGeometryA, materials.membraneMatA);
      membraneA.name = 'ProtectiveMembrane_A';
      membraneA.userData.ignoreWaveColor = true;
      membraneA.position.set(-0.18, 0.05, 0.02);
      membraneA.rotation.set(0.36, -0.72, 0.26);
      membraneA.scale.set(0.84, 0.9, 1.0);
      membraneA.renderOrder = archOrder;
      psycheGroup.add(membraneA);

      const membraneAEdges = new THREE.LineSegments(geometries.membraneEdgesGeometryA, materials.edgeMat);
      membraneAEdges.name = 'ProtectiveMembrane_A_Edges';
      membraneAEdges.userData.ignoreWaveColor = true;
      membraneAEdges.position.copy(membraneA.position);
      membraneAEdges.rotation.copy(membraneA.rotation);
      membraneAEdges.scale.copy(membraneA.scale);
      membraneAEdges.renderOrder = archOrder;
      psycheGroup.add(membraneAEdges);

      const membraneB = new THREE.Mesh(geometries.membraneGeometryB, materials.membraneMatB);
      membraneB.name = 'OpenMembrane_B';
      membraneB.userData.ignoreWaveColor = true;
      membraneB.position.set(0.18, 0.01, -0.08);
      membraneB.rotation.set(-0.3, 0.96, -0.34);
      membraneB.scale.set(0.78, 1.14, 0.76);
      membraneB.renderOrder = archOrder;
      psycheGroup.add(membraneB);

      const membraneBEdges = new THREE.LineSegments(geometries.membraneEdgesGeometryB, materials.edgeMat);
      membraneBEdges.name = 'OpenMembrane_B_Edges';
      membraneBEdges.userData.ignoreWaveColor = true;
      membraneBEdges.position.copy(membraneB.position);
      membraneBEdges.rotation.copy(membraneB.rotation);
      membraneBEdges.scale.copy(membraneB.scale);
      membraneBEdges.renderOrder = archOrder;
      psycheGroup.add(membraneBEdges);

      root.add(psycheGroup);

      const longingGroup = new THREE.Group();
      longingGroup.name = 'LONGING_GROUP';

      const filamentConfigs = [
        { name: 'SensoryFilament_A', pos: [-0.04, -0.01, 0.03], rot: [0.04, -0.08, 0.08], scale: [1.0, 1.02, 1.0], long: true, drift: [-0.1, -0.04, 0.08] },
        { name: 'SensoryFilament_B', pos: [0.02, 0.03, -0.05], rot: [0.22, Math.PI * 0.62, -0.24], scale: [0.84, 1.0, 0.84], drift: [0.03, 0.02, -0.02] },
        { name: 'SensoryFilament_C', pos: [0.06, -0.06, 0.04], rot: [-0.2, Math.PI * 1.04, 0.28], scale: [0.82, 0.9, 0.84], drift: [0.08, -0.12, 0.04] },
        { name: 'SensoryFilament_D', pos: [-0.08, 0.08, -0.05], rot: [0.34, -Math.PI * 0.42, -0.18], scale: [0.9, 0.98, 0.88], long: true, drift: [-0.06, 0.08, -0.04] }
      ];
      filamentConfigs.forEach((cfg, idx) => {
        const filamentGeometry = cfg.long ? geometries.filamentLongGeometry : geometries.filamentGeometry;
        const filament = new THREE.Mesh(filamentGeometry, materials.filamentMat);
        filament.name = cfg.name;
        filament.userData.ignoreWaveColor = true;
        filament.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        filament.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        filament.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        filament.renderOrder = archOrder;
        longingGroup.add(filament);

        scratch.position.copy(filament.position);
        scratch.rotation.copy(filament.rotation);
        scratch.scale.copy(filament.scale);
        scratch.updateMatrix();
        const anchorPosition = anchorStart.clone().applyMatrix4(scratch.matrix);
        if (cfg.drift) anchorPosition.add(new THREE.Vector3(cfg.drift[0], cfg.drift[1], cfg.drift[2]));

        const anchor = new THREE.Mesh(geometries.anchorGeometry, materials.anchorMat);
        anchor.name = `LongingAnchor_${idx}`;
        anchor.userData.ignoreWaveColor = true;
        anchor.position.copy(anchorPosition);
        anchor.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.4,
          cfg.rot[1] + (rng() - 0.5) * 0.4,
          cfg.rot[2] + (rng() - 0.5) * 0.3
        );
        anchor.scale.setScalar(0.7 + rng() * 0.2);
        anchor.renderOrder = coreOrder;
        longingGroup.add(anchor);

        const anchorEdges = new THREE.LineSegments(geometries.anchorEdgesGeometry, materials.edgeMat);
        anchorEdges.name = `LongingAnchor_${idx}_Edges`;
        anchorEdges.userData.ignoreWaveColor = true;
        anchorEdges.position.copy(anchor.position);
        anchorEdges.rotation.copy(anchor.rotation);
        anchorEdges.scale.copy(anchor.scale);
        anchorEdges.renderOrder = archOrder;
        longingGroup.add(anchorEdges);
      });

      root.add(longingGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const innerGlow = new THREE.Mesh(geometries.nucleusGeometry, materials.glowMat);
      innerGlow.name = 'InnerLucidGlow';
      innerGlow.userData.ignoreWaveColor = true;
      innerGlow.position.copy(nucleus.position);
      innerGlow.rotation.copy(nucleus.rotation);
      innerGlow.position.add(new THREE.Vector3(-0.02, -0.01, 0.0));
      innerGlow.scale.set(1.42, 1.82, 1.46);
      innerGlow.renderOrder = archOrder;
      auraGroup.add(innerGlow);

      const mist = new THREE.Points(geometries.mistGeometry, materials.mistMat);
      mist.name = 'BittersweetMist';
      mist.userData.ignoreWaveColor = true;
      mist.position.set(-0.04, 0.02, 0.02);
      mist.rotation.set(0.14, -0.32, 0.08);
      mist.scale.set(0.86, 0.92, 0.8);
      mist.frustumCulled = false;
      mist.renderOrder = archOrder;
      auraGroup.add(mist);

      const ache = new THREE.Points(geometries.acheGeometry, materials.acheMat);
      ache.name = 'SomaticAche';
      ache.userData.ignoreWaveColor = true;
      ache.position.set(-0.09, -0.03, 0.05);
      ache.rotation.set(0.18, 0.22, -0.12);
      ache.scale.set(0.9, 1.12, 0.92);
      ache.frustumCulled = false;
      ache.renderOrder = archOrder;
      auraGroup.add(ache);

      const shellA = createNodeHologramShell(leftLobe, 0xb9f1ff);
      if (shellA) {
        shellA.name = 'EmotionShell_A';
        shellA.position.copy(leftLobe.position);
        shellA.quaternion.copy(leftLobe.quaternion);
        shellA.scale.copy(leftLobe.scale).multiplyScalar(1.08);
        shellA.frustumCulled = false;
        shellA.renderOrder = archOrder;
        if (shellA.material?.uniforms?.uOpacity) shellA.material.uniforms.uOpacity.value = 0.036;
        auraGroup.add(shellA);
      }

      const shellB = createNodeHologramShell(rightLobe, 0xffc6e8);
      if (shellB) {
        shellB.name = 'EmotionShell_B';
        shellB.position.copy(rightLobe.position);
        shellB.quaternion.copy(rightLobe.quaternion);
        shellB.scale.copy(rightLobe.scale).multiplyScalar(1.12);
        shellB.frustumCulled = false;
        shellB.renderOrder = archOrder;
        if (shellB.material?.uniforms?.uOpacity) shellB.material.uniforms.uOpacity.value = 0.032;
        auraGroup.add(shellB);
      }

      root.add(auraGroup);

      root.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'emotional-neural-lobe');
        }
      });

      root.userData.visualReady = true;
      root.userData.emotionalVariant = 'BITTERSWEET_COGNITION';
      root.userData.emotionalMood = 'FRAGILE_INTROSPECTION';
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'EMOTIONAL_NEURAL_LOBE';
      group.add(root);
      return group;
    } catch (err) {
      console.error('[EmotionalNeuralLobeAbort]', {
        reason: err?.message || err,
        visualCode
      });
      return null;
    }
  }

  static createEmotionalBloomingGem(group, visualCode, color) {
    try {
      const geometries = _getEmotionalBloomingGemGeometries();
      const resolvedColor = typeof color === 'undefined' ? visualCode : color;
      const materials = _getEmotionalBloomingGemMaterials(resolvedColor);
      const root = new THREE.Group();
      root.name = 'EMOTIONAL_UNTRANSLATABLE_BLOOM_NODE';
      root.userData.visualVariant = 'EMOTIONAL_UNTRANSLATABLE_BLOOM_V4';
      root.userData.nodeGeometryName = 'EMOTIONAL_UNTRANSLATABLE_BLOOM';

      const seed = group?.userData?.nodeId ? hashString(group.userData.nodeId) : (Number.isFinite(visualCode) ? visualCode : 1203);
      const rng = _mythicSeededRng(seed);
      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const affectCore = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      affectCore.name = 'AffectCore';
      affectCore.userData.ignoreWaveColor = true;
      affectCore.position.set(-0.04, 0.05, 0.02);
      affectCore.rotation.set(0.18, -0.34, 0.12);
      affectCore.scale.set(1.04, 1.16, 0.9);
      affectCore.renderOrder = coreOrder;
      coreGroup.add(affectCore);

      const affectEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.petalEdgeMat);
      affectEdges.name = 'AffectCore_Edges';
      affectEdges.userData.ignoreWaveColor = true;
      affectEdges.position.copy(affectCore.position);
      affectEdges.rotation.copy(affectCore.rotation);
      affectEdges.scale.copy(affectCore.scale);
      affectEdges.renderOrder = archOrder;
      coreGroup.add(affectEdges);

      const seam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      seam.name = 'FractureSeam';
      seam.userData.ignoreWaveColor = true;
      seam.position.set(0.02, 0.08, -0.01);
      seam.rotation.set(0.42, 0.26, -0.28);
      seam.scale.set(0.9, 1.04, 0.84);
      seam.renderOrder = coreOrder;
      coreGroup.add(seam);

      const nucleus = new THREE.Mesh(geometries.nucleusGeometry, materials.nucleusMat);
      nucleus.name = 'AffectNucleus';
      nucleus.userData.ignoreWaveColor = true;
      nucleus.position.set(0.04, 0.09, 0.02);
      nucleus.rotation.set(-0.18, 0.48, 0.2);
      nucleus.scale.set(0.86, 1.12, 0.74);
      nucleus.renderOrder = coreOrder;
      coreGroup.add(nucleus);

      const cage = new THREE.LineSegments(geometries.cageEdgesGeometry, materials.cageMat);
      cage.name = 'InterpretationCage';
      cage.userData.ignoreWaveColor = true;
      cage.position.copy(affectCore.position).add(new THREE.Vector3(0.01, 0.0, -0.01));
      cage.rotation.set(affectCore.rotation.x + 0.18, affectCore.rotation.y - 0.12, affectCore.rotation.z + 0.08);
      cage.scale.copy(affectCore.scale).multiplyScalar(1.16);
      cage.renderOrder = archOrder;
      coreGroup.add(cage);

      root.add(coreGroup);

      const petalSwarmGroup = new THREE.Group();
      petalSwarmGroup.name = 'PETAL_SWARM_GROUP';
      const petalConfigs = [
        { pos: [-0.56, 0.24, 0.2], rot: [0.84, -1.02, 0.44], scale: [1.04, 1.22, 0.94], mat: 'petalMatA' },
        { pos: [0.44, 0.16, 0.3], rot: [-0.62, 0.82, -0.36], scale: [0.88, 1.06, 0.8], mat: 'petalMatB' },
        { pos: [-0.1, 0.48, -0.4], rot: [1.08, 0.18, 1.12], scale: [0.74, 0.98, 0.66], mat: 'petalMatC' },
        { pos: [0.3, -0.18, 0.5], rot: [0.18, 1.4, -0.88], scale: [0.92, 1.14, 0.84], mat: 'petalMatA' },
        { pos: [-0.62, -0.04, -0.12], rot: [-0.3, -1.12, 0.36], scale: [1.14, 1.28, 0.98], mat: 'petalMatB' },
        { pos: [0.12, 0.12, -0.58], rot: [0.96, 2.38, -0.22], scale: [0.82, 0.92, 0.72], mat: 'petalMatC' },
        { pos: [0.56, 0.38, -0.04], rot: [-0.54, 1.08, 0.9], scale: [0.7, 0.86, 0.64], mat: 'petalMatA' },
        { pos: [-0.24, -0.34, 0.18], rot: [0.52, -2.08, -0.46], scale: [0.78, 0.9, 0.72], mat: 'petalMatB' }
      ];

      petalConfigs.forEach((cfg, idx) => {
        const petal = new THREE.Mesh(geometries.petalGeometry, materials[cfg.mat]);
        petal.name = `PetalShard_${idx}`;
        petal.userData.ignoreWaveColor = true;
        petal.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        petal.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.1,
          cfg.rot[1] + (rng() - 0.5) * 0.12,
          cfg.rot[2] + (rng() - 0.5) * 0.1
        );
        petal.scale.set(
          cfg.scale[0] * (0.96 + rng() * 0.08),
          cfg.scale[1] * (0.96 + rng() * 0.08),
          cfg.scale[2] * (0.96 + rng() * 0.08)
        );
        petal.renderOrder = archOrder;
        petalSwarmGroup.add(petal);

        const petalEdges = new THREE.LineSegments(geometries.petalEdgesGeometry, materials.petalEdgeMat);
        petalEdges.name = `PetalShard_${idx}_Edges`;
        petalEdges.userData.ignoreWaveColor = true;
        petalEdges.position.copy(petal.position);
        petalEdges.rotation.copy(petal.rotation);
        petalEdges.scale.copy(petal.scale);
        petalEdges.renderOrder = archOrder;
        petalSwarmGroup.add(petalEdges);
      });

      root.add(petalSwarmGroup);

      const misreadGroup = new THREE.Group();
      misreadGroup.name = 'MISREAD_GROUP';
      const ghostConfigs = [
        { pos: [-0.34, 0.3, -0.18], rot: [0.68, -0.42, 0.78], scale: [0.9, 1.08, 0.7] },
        { pos: [0.26, -0.02, 0.18], rot: [-0.22, 1.34, -0.42], scale: [0.78, 0.94, 0.62] },
        { pos: [0.04, 0.22, -0.28], rot: [1.22, 0.48, 0.24], scale: [0.72, 0.88, 0.56] }
      ];
      ghostConfigs.forEach((cfg, idx) => {
        const ghost = new THREE.Mesh(geometries.ghostPetalGeometry, materials.ghostMat);
        ghost.name = `GhostPetal_${idx}`;
        ghost.userData.ignoreWaveColor = true;
        ghost.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        ghost.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        ghost.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        ghost.renderOrder = archOrder;
        misreadGroup.add(ghost);

        const ghostEdges = new THREE.LineSegments(geometries.ghostPetalEdgesGeometry, materials.ghostEdgeMat);
        ghostEdges.name = `GhostPetal_${idx}_Frame`;
        ghostEdges.userData.ignoreWaveColor = true;
        ghostEdges.position.copy(ghost.position);
        ghostEdges.rotation.copy(ghost.rotation);
        ghostEdges.scale.copy(ghost.scale);
        ghostEdges.renderOrder = archOrder;
        misreadGroup.add(ghostEdges);
      });

      root.add(misreadGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const innerGlow = new THREE.Mesh(geometries.nucleusGeometry, materials.glowMat);
      innerGlow.name = 'InnerAffectGlow';
      innerGlow.userData.ignoreWaveColor = true;
      innerGlow.position.copy(nucleus.position).add(new THREE.Vector3(-0.02, 0.0, 0.01));
      innerGlow.rotation.copy(nucleus.rotation);
      innerGlow.scale.set(1.62, 1.92, 1.4);
      innerGlow.renderOrder = archOrder;
      auraGroup.add(innerGlow);

      const pollen = new THREE.Points(geometries.pollenGeometry, materials.pollenMat);
      pollen.name = 'EmotionalPollen';
      pollen.userData.ignoreWaveColor = true;
      pollen.position.set(-0.02, 0.04, 0.02);
      pollen.rotation.set(0.16, -0.24, 0.06);
      pollen.scale.set(0.94, 1.02, 0.92);
      pollen.frustumCulled = false;
      pollen.renderOrder = archOrder;
      auraGroup.add(pollen);

      const shellA = createNodeHologramShell(affectCore, 0xc2f7ff);
      if (shellA) {
        shellA.name = 'EmotionShell_A';
        shellA.position.copy(affectCore.position).add(new THREE.Vector3(-0.04, 0.03, 0.02));
        shellA.quaternion.copy(affectCore.quaternion);
        shellA.scale.copy(affectCore.scale).multiplyScalar(1.12);
        shellA.frustumCulled = false;
        shellA.renderOrder = archOrder;
        if (shellA.material?.uniforms?.uOpacity) shellA.material.uniforms.uOpacity.value = 0.044;
        auraGroup.add(shellA);
      }

      const shellB = createNodeHologramShell(affectCore, 0xffc5e8);
      if (shellB) {
        shellB.name = 'EmotionShell_B';
        shellB.position.copy(affectCore.position).add(new THREE.Vector3(0.06, -0.02, -0.01));
        shellB.quaternion.copy(affectCore.quaternion);
        shellB.scale.copy(affectCore.scale).multiplyScalar(1.24);
        shellB.frustumCulled = false;
        shellB.renderOrder = archOrder;
        if (shellB.material?.uniforms?.uOpacity) shellB.material.uniforms.uOpacity.value = 0.03;
        auraGroup.add(shellB);
      }

      const edgeGlow = createNodeNeonEdgeGlowShell(affectCore, 0xffb2df, {
        glowIntensity: 0.6,
        edgeWidth: 0.056,
        pulseAmount: 0.0
      });
      if (edgeGlow) {
        edgeGlow.name = 'EmotionEdgeGlow';
        edgeGlow.position.copy(affectCore.position);
        edgeGlow.quaternion.copy(affectCore.quaternion);
        edgeGlow.scale.copy(affectCore.scale).multiplyScalar(1.03);
        edgeGlow.frustumCulled = false;
        edgeGlow.renderOrder = archOrder;
        auraGroup.add(edgeGlow);
      }

      root.add(auraGroup);

      root.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'emotional-blooming-gem');
        }
      });

      root.userData.visualReady = true;
      root.userData.emotionalVariant = 'UNTRANSLATABLE_BLOOM';
      root.userData.emotionalMood = 'ECSTATIC_FRACTURE';
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'EMOTIONAL_BLOOMING_GEM';
      group.add(root);
      return group;
    } catch (err) {
      console.error('[EmotionalBloomingGemAbort]', {
        reason: err?.message || err,
        visualCode
      });
      return null;
    }
  }

  static createEmotionalTearShaped(group, visualCode, color) {
    try {
      const geometries = _getEmotionalTearShapedGeometries();
      const resolvedColor = typeof color === 'undefined' ? visualCode : color;
      const materials = _getEmotionalTearShapedMaterials(resolvedColor);
      const root = new THREE.Group();
      root.name = 'EMOTIONAL_EXULTANT_SPIRAL_NODE';
      root.userData.visualVariant = 'EMOTIONAL_EXULTANT_SPIRAL_V4';
      root.userData.nodeGeometryName = 'EMOTIONAL_EXULTANT_SPIRAL';

      const seed = group?.userData?.nodeId ? hashString(group.userData.nodeId) : (Number.isFinite(visualCode) ? visualCode : 1204);
      const rng = _mythicSeededRng(seed);
      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const affectCore = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      affectCore.name = 'AffectCore';
      affectCore.userData.ignoreWaveColor = true;
      affectCore.position.set(-0.1, 0.05, 0.04);
      affectCore.rotation.set(0.24, -0.3, 0.16);
      affectCore.scale.set(1.1, 1.26, 0.88);
      affectCore.renderOrder = coreOrder;
      coreGroup.add(affectCore);

      const affectEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.wingEdgeMat);
      affectEdges.name = 'AffectCore_Edges';
      affectEdges.userData.ignoreWaveColor = true;
      affectEdges.position.copy(affectCore.position);
      affectEdges.rotation.copy(affectCore.rotation);
      affectEdges.scale.copy(affectCore.scale);
      affectEdges.renderOrder = archOrder;
      coreGroup.add(affectEdges);

      const joySeam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      joySeam.name = 'JoySeam';
      joySeam.userData.ignoreWaveColor = true;
      joySeam.position.set(0.04, 0.11, -0.02);
      joySeam.rotation.set(0.74, 0.52, -0.42);
      joySeam.scale.set(0.96, 1.02, 0.82);
      joySeam.renderOrder = archOrder;
      coreGroup.add(joySeam);

      const luminousSeed = new THREE.Mesh(geometries.seedGeometry, materials.seedMat);
      luminousSeed.name = 'LuminousSeed';
      luminousSeed.userData.ignoreWaveColor = true;
      luminousSeed.position.set(0.03, 0.14, 0.0);
      luminousSeed.rotation.set(-0.1, 0.68, 0.34);
      luminousSeed.scale.set(0.88, 1.28, 0.74);
      luminousSeed.renderOrder = coreOrder;
      coreGroup.add(luminousSeed);

      const cage = new THREE.LineSegments(geometries.cageEdgesGeometry, materials.cageMat);
      cage.name = 'ExultantCage';
      cage.userData.ignoreWaveColor = true;
      cage.position.copy(affectCore.position).add(new THREE.Vector3(0.04, 0.08, -0.01));
      cage.rotation.set(affectCore.rotation.x + 0.32, affectCore.rotation.y - 0.2, affectCore.rotation.z + 0.16);
      cage.scale.copy(affectCore.scale).multiplyScalar(1.24);
      cage.renderOrder = archOrder;
      coreGroup.add(cage);

      root.add(coreGroup);

      const burstGroup = new THREE.Group();
      burstGroup.name = 'BURST_GROUP';
      const fanConfigs = [
        { pos: [-0.56, -0.24, 0.2], rot: [0.52, -1.28, 0.88], scale: [1.14, 1.32, 0.96], mat: 'wingMatA' },
        { pos: [-0.34, -0.08, -0.22], rot: [0.34, -0.82, 1.14], scale: [0.92, 1.08, 0.78], mat: 'wingMatC' },
        { pos: [-0.12, 0.12, 0.38], rot: [0.98, 0.06, 1.24], scale: [1.02, 1.2, 0.84], mat: 'wingMatB' },
        { pos: [0.12, 0.32, 0.22], rot: [1.2, 0.44, 1.02], scale: [1.18, 1.34, 0.96], mat: 'wingMatA' },
        { pos: [0.3, 0.5, 0.0], rot: [1.32, 0.86, 0.82], scale: [0.92, 1.1, 0.76], mat: 'wingMatB' },
        { pos: [0.5, 0.68, -0.18], rot: [1.46, 1.22, 0.48], scale: [0.82, 1.0, 0.7], mat: 'wingMatC' },
        { pos: [0.68, 0.84, 0.04], rot: [1.3, 1.58, 0.2], scale: [0.84, 1.02, 0.7], mat: 'wingMatA' },
        { pos: [0.44, 0.98, 0.18], rot: [1.56, 1.02, 0.42], scale: [0.74, 0.94, 0.62], mat: 'wingMatB' },
        { pos: [0.78, 1.1, -0.08], rot: [1.72, 1.46, 0.08], scale: [0.68, 0.9, 0.58], mat: 'wingMatA' }
      ];
      const majorWings = [];

      fanConfigs.forEach((cfg, idx) => {
        const wing = new THREE.Mesh(geometries.fanGeometry, materials[cfg.mat]);
        wing.name = `FanWing_${idx}`;
        wing.userData.ignoreWaveColor = true;
        wing.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        wing.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.12,
          cfg.rot[1] + (rng() - 0.5) * 0.14,
          cfg.rot[2] + (rng() - 0.5) * 0.1
        );
        wing.scale.set(
          cfg.scale[0] * (0.96 + rng() * 0.08),
          cfg.scale[1] * (0.96 + rng() * 0.08),
          cfg.scale[2] * (0.96 + rng() * 0.08)
        );
        wing.renderOrder = archOrder;
        burstGroup.add(wing);
        majorWings.push(wing);

        const wingEdges = new THREE.LineSegments(geometries.fanEdgesGeometry, materials.wingEdgeMat);
        wingEdges.name = `FanWing_${idx}_Edges`;
        wingEdges.userData.ignoreWaveColor = true;
        wingEdges.position.copy(wing.position);
        wingEdges.rotation.copy(wing.rotation);
        wingEdges.scale.copy(wing.scale);
        wingEdges.renderOrder = archOrder;
        burstGroup.add(wingEdges);
      });

      root.add(burstGroup);

      const liftGroup = new THREE.Group();
      liftGroup.name = 'LIFT_GROUP';
      const liftConfigs = [
        { pos: [0.08, 0.62, 0.4], rot: [1.04, 0.28, 0.98], scale: [0.78, 1.0, 0.6] },
        { pos: [0.36, 0.82, 0.26], rot: [1.28, 0.84, 0.58], scale: [0.72, 0.94, 0.56] },
        { pos: [0.64, 1.0, 0.06], rot: [1.42, 1.32, 0.26], scale: [0.66, 0.86, 0.52] },
        { pos: [0.24, 1.04, -0.2], rot: [1.64, 1.04, -0.1], scale: [0.6, 0.8, 0.48] },
        { pos: [0.54, 1.18, -0.14], rot: [1.78, 1.38, 0.06], scale: [0.52, 0.72, 0.42] }
      ];
      liftConfigs.forEach((cfg, idx) => {
        const blade = new THREE.Mesh(geometries.liftGeometry, materials.liftMat);
        blade.name = `LiftBlade_${idx}`;
        blade.userData.ignoreWaveColor = true;
        blade.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        blade.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        blade.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        blade.renderOrder = archOrder;
        liftGroup.add(blade);

        const bladeEdges = new THREE.LineSegments(geometries.liftEdgesGeometry, materials.liftEdgeMat);
        bladeEdges.name = `LiftBlade_${idx}_Edges`;
        bladeEdges.userData.ignoreWaveColor = true;
        bladeEdges.position.copy(blade.position);
        bladeEdges.rotation.copy(blade.rotation);
        bladeEdges.scale.copy(blade.scale);
        bladeEdges.renderOrder = archOrder;
        liftGroup.add(bladeEdges);
      });

      root.add(liftGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const innerGlow = new THREE.Mesh(geometries.seedGeometry, materials.glowMat);
      innerGlow.name = 'InnerJoyGlow';
      innerGlow.userData.ignoreWaveColor = true;
      innerGlow.position.copy(luminousSeed.position).add(new THREE.Vector3(-0.01, 0.04, 0.0));
      innerGlow.rotation.copy(luminousSeed.rotation);
      innerGlow.scale.set(1.94, 2.38, 1.56);
      innerGlow.renderOrder = archOrder;
      auraGroup.add(innerGlow);

      const celebratoryDust = new THREE.Points(geometries.dustGeometry, materials.dustMat);
      celebratoryDust.name = 'CelebratoryDust';
      celebratoryDust.userData.ignoreWaveColor = true;
      celebratoryDust.position.set(-0.06, 0.04, 0.06);
      celebratoryDust.rotation.set(0.16, -0.28, 0.06);
      celebratoryDust.scale.set(1.02, 1.16, 0.96);
      celebratoryDust.frustumCulled = false;
      celebratoryDust.renderOrder = archOrder;
      auraGroup.add(celebratoryDust);

      const sparkHalo = new THREE.Points(geometries.dustGeometry, materials.dustMat);
      sparkHalo.name = 'PosterSparkHalo';
      sparkHalo.userData.ignoreWaveColor = true;
      sparkHalo.position.set(-0.02, 0.18, 0.02);
      sparkHalo.rotation.set(0.28, 0.22, -0.08);
      sparkHalo.scale.set(1.26, 1.52, 1.08);
      sparkHalo.frustumCulled = false;
      sparkHalo.renderOrder = archOrder;
      auraGroup.add(sparkHalo);

      [majorWings[6], majorWings[7], majorWings[8]].forEach((wing, idx) => {
        if (!wing) return;
        const echo = createNodeHologramShell(wing, idx === 1 ? 0xffdff0 : 0xd6ffff);
        if (!echo) return;
        echo.name = `BurstEcho_${idx}`;
        echo.position.copy(wing.position).add(new THREE.Vector3(0.01 + idx * 0.05, 0.12 + idx * 0.14, -0.02 * idx));
        echo.quaternion.copy(wing.quaternion);
        echo.scale.copy(wing.scale).multiplyScalar(0.82 + idx * 0.06);
        echo.frustumCulled = false;
        echo.renderOrder = archOrder;
        if (echo.material?.uniforms?.uOpacity) echo.material.uniforms.uOpacity.value = 0.022 - idx * 0.003;
        auraGroup.add(echo);
      });

      const shellA = createNodeHologramShell(affectCore, 0xd0fbff);
      if (shellA) {
        shellA.name = 'EmotionShell_A';
        shellA.position.copy(affectCore.position).add(new THREE.Vector3(-0.04, 0.08, 0.01));
        shellA.quaternion.copy(affectCore.quaternion);
        shellA.scale.copy(affectCore.scale).multiplyScalar(1.1);
        shellA.frustumCulled = false;
        shellA.renderOrder = archOrder;
        if (shellA.material?.uniforms?.uOpacity) shellA.material.uniforms.uOpacity.value = 0.046;
        auraGroup.add(shellA);
      }

      const edgeGlow = createNodeNeonEdgeGlowShell(affectCore, 0xffc9e5, {
        glowIntensity: 0.62,
        edgeWidth: 0.058,
        pulseAmount: 0.0
      });
      if (edgeGlow) {
        edgeGlow.name = 'EmotionEdgeGlow';
        edgeGlow.position.copy(affectCore.position);
        edgeGlow.quaternion.copy(affectCore.quaternion);
        edgeGlow.scale.copy(affectCore.scale).multiplyScalar(1.05);
        edgeGlow.frustumCulled = false;
        edgeGlow.renderOrder = archOrder;
        auraGroup.add(edgeGlow);
      }

      root.add(auraGroup);

      root.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'emotional-tear-shaped');
        }
      });

      root.userData.visualReady = true;
      root.userData.emotionalVariant = 'EXULTANT_SPIRAL';
      root.userData.emotionalMood = 'EUPHORIC_BURST';
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'EMOTIONAL_TEAR_SHAPED';
      group.add(root);
      return group;
    } catch (err) {
      console.error('[EmotionalTearShapedAbort]', {
        reason: err?.message || err,
        visualCode
      });
      return null;
    }
  }

  static createEmotionalFolded(group, visualCode, color) {
    try {
      const geometries = _getEmotionalFoldedGeometries();
      const resolvedColor = typeof color === 'undefined' ? visualCode : color;
      const materials = _getEmotionalFoldedMaterials(resolvedColor);
      const root = new THREE.Group();
      root.name = 'EMOTIONAL_DISSONANT_ACCORD_NODE';
      root.userData.visualVariant = 'EMOTIONAL_DISSONANT_ACCORD_V4';
      root.userData.nodeGeometryName = 'EMOTIONAL_DISSONANT_ACCORD';

      const seed = group?.userData?.nodeId ? hashString(group.userData.nodeId) : (Number.isFinite(visualCode) ? visualCode : 1205);
      const rng = _mythicSeededRng(seed);
      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const stressCore = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      stressCore.name = 'StressCore';
      stressCore.userData.ignoreWaveColor = true;
      stressCore.position.set(-0.06, 0.06, 0.02);
      stressCore.rotation.set(0.22, -0.38, 0.16);
      stressCore.scale.set(1.08, 1.18, 0.9);
      stressCore.renderOrder = coreOrder;
      coreGroup.add(stressCore);

      const stressEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.shardEdgeMat);
      stressEdges.name = 'StressCore_Edges';
      stressEdges.userData.ignoreWaveColor = true;
      stressEdges.position.copy(stressCore.position);
      stressEdges.rotation.copy(stressCore.rotation);
      stressEdges.scale.copy(stressCore.scale);
      stressEdges.renderOrder = archOrder;
      coreGroup.add(stressEdges);

      const lucidSeed = new THREE.Mesh(geometries.seedGeometry, materials.seedMat);
      lucidSeed.name = 'LucidSeed';
      lucidSeed.userData.ignoreWaveColor = true;
      lucidSeed.position.set(0.02, 0.11, 0.0);
      lucidSeed.rotation.set(-0.18, 0.62, 0.28);
      lucidSeed.scale.set(0.82, 1.22, 0.72);
      lucidSeed.renderOrder = coreOrder;
      coreGroup.add(lucidSeed);

      const discordSeam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      discordSeam.name = 'DiscordSeam';
      discordSeam.userData.ignoreWaveColor = true;
      discordSeam.position.set(0.06, 0.08, -0.02);
      discordSeam.rotation.set(0.56, 0.44, -0.32);
      discordSeam.scale.set(0.92, 1.06, 0.84);
      discordSeam.renderOrder = archOrder;
      coreGroup.add(discordSeam);

      const accordCage = new THREE.LineSegments(geometries.cageEdgesGeometry, materials.cageMat);
      accordCage.name = 'AccordCage';
      accordCage.userData.ignoreWaveColor = true;
      accordCage.position.copy(stressCore.position).add(new THREE.Vector3(0.02, 0.04, -0.02));
      accordCage.rotation.set(stressCore.rotation.x + 0.28, stressCore.rotation.y - 0.16, stressCore.rotation.z + 0.12);
      accordCage.scale.copy(stressCore.scale).multiplyScalar(1.18);
      accordCage.renderOrder = archOrder;
      coreGroup.add(accordCage);

      root.add(coreGroup);

      const dissonanceGroup = new THREE.Group();
      dissonanceGroup.name = 'DISSONANCE_GROUP';
      const shardConfigs = [
        { pos: [-0.62, -0.24, 0.18], rot: [0.44, -1.28, 0.96], scale: [1.06, 1.24, 0.9], mat: 'shardMatA' },
        { pos: [-0.42, -0.06, -0.2], rot: [0.22, -0.76, 1.2], scale: [0.88, 1.04, 0.74], mat: 'shardMatC' },
        { pos: [-0.18, 0.08, 0.36], rot: [0.96, -0.04, 1.12], scale: [0.96, 1.12, 0.8], mat: 'shardMatB' },
        { pos: [0.08, 0.22, 0.24], rot: [1.18, 0.36, 0.96], scale: [1.12, 1.28, 0.94], mat: 'shardMatA' },
        { pos: [0.26, 0.38, 0.02], rot: [1.32, 0.88, 0.74], scale: [0.9, 1.06, 0.74], mat: 'shardMatB' },
        { pos: [0.46, 0.54, -0.16], rot: [1.44, 1.24, 0.42], scale: [0.82, 0.98, 0.68], mat: 'shardMatC' },
        { pos: [0.62, 0.7, 0.02], rot: [1.28, 1.58, 0.18], scale: [0.8, 0.96, 0.66], mat: 'shardMatA' },
        { pos: [0.36, 0.9, 0.16], rot: [1.54, 1.02, 0.36], scale: [0.7, 0.88, 0.58], mat: 'shardMatB' }
      ];
      const heroShards = [];

      shardConfigs.forEach((cfg, idx) => {
        const shard = new THREE.Mesh(geometries.shardGeometry, materials[cfg.mat]);
        shard.name = `AccordShard_${idx}`;
        shard.userData.ignoreWaveColor = true;
        shard.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        shard.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.14,
          cfg.rot[1] + (rng() - 0.5) * 0.16,
          cfg.rot[2] + (rng() - 0.5) * 0.12
        );
        shard.scale.set(
          cfg.scale[0] * (0.96 + rng() * 0.08),
          cfg.scale[1] * (0.96 + rng() * 0.08),
          cfg.scale[2] * (0.96 + rng() * 0.08)
        );
        shard.renderOrder = archOrder;
        dissonanceGroup.add(shard);
        heroShards.push(shard);

        const shardEdges = new THREE.LineSegments(geometries.shardEdgesGeometry, materials.shardEdgeMat);
        shardEdges.name = `AccordShard_${idx}_Edges`;
        shardEdges.userData.ignoreWaveColor = true;
        shardEdges.position.copy(shard.position);
        shardEdges.rotation.copy(shard.rotation);
        shardEdges.scale.copy(shard.scale);
        shardEdges.renderOrder = archOrder;
        dissonanceGroup.add(shardEdges);
      });

      root.add(dissonanceGroup);

      const containmentGroup = new THREE.Group();
      containmentGroup.name = 'CONTAINMENT_GROUP';
      const railConfigs = [
        { name: 'RestraintRail_A', pos: [-0.08, 0.02, 0.18], rot: [0.28, 0.1, 0.48], scale: [1.02, 1.0, 0.94] },
        { name: 'RestraintRail_B', pos: [0.08, 0.22, -0.12], rot: [0.82, 0.54, -0.24], scale: [0.9, 0.94, 0.88] },
        { name: 'CorrectionArc_A', pos: [0.12, 0.42, 0.06], rot: [1.06, 0.92, 0.18], scale: [0.82, 0.9, 0.8] },
        { name: 'CorrectionArc_B', pos: [0.3, 0.64, -0.06], rot: [1.24, 1.26, 0.08], scale: [0.72, 0.82, 0.72] }
      ];

      railConfigs.forEach((cfg, idx) => {
        const rail = new THREE.Mesh(geometries.railGeometry, materials.railMat);
        rail.name = cfg.name;
        rail.userData.ignoreWaveColor = true;
        rail.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        rail.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        rail.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        rail.renderOrder = archOrder;
        containmentGroup.add(rail);

        const railEdges = new THREE.LineSegments(geometries.railEdgesGeometry, materials.railEdgeMat);
        railEdges.name = `${cfg.name}_Edges`;
        railEdges.userData.ignoreWaveColor = true;
        railEdges.position.copy(rail.position);
        railEdges.rotation.copy(rail.rotation);
        railEdges.scale.copy(rail.scale);
        railEdges.renderOrder = archOrder;
        containmentGroup.add(railEdges);

        if (idx < 2) {
          const hinge = new THREE.Mesh(geometries.ghostShardGeometry, materials.ghostMat);
          hinge.name = `HingeBridge_${idx}`;
          hinge.userData.ignoreWaveColor = true;
          hinge.position.copy(rail.position).add(new THREE.Vector3(0.04 + idx * 0.08, 0.08 + idx * 0.06, -0.04));
          hinge.rotation.set(rail.rotation.x + 0.24, rail.rotation.y - 0.18, rail.rotation.z + 0.16);
          hinge.scale.set(0.46, 0.58, 0.38);
          hinge.renderOrder = archOrder;
          containmentGroup.add(hinge);

          const hingeEdges = new THREE.LineSegments(geometries.ghostShardEdgesGeometry, materials.ghostEdgeMat);
          hingeEdges.name = `HingeBridge_${idx}_Edges`;
          hingeEdges.userData.ignoreWaveColor = true;
          hingeEdges.position.copy(hinge.position);
          hingeEdges.rotation.copy(hinge.rotation);
          hingeEdges.scale.copy(hinge.scale);
          hingeEdges.renderOrder = archOrder;
          containmentGroup.add(hingeEdges);
        }
      });

      root.add(containmentGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const strainGlow = new THREE.Mesh(geometries.seedGeometry, materials.glowMat);
      strainGlow.name = 'InnerStrainGlow';
      strainGlow.userData.ignoreWaveColor = true;
      strainGlow.position.copy(lucidSeed.position).add(new THREE.Vector3(-0.02, 0.02, 0.0));
      strainGlow.rotation.copy(lucidSeed.rotation);
      strainGlow.scale.set(1.72, 2.14, 1.42);
      strainGlow.renderOrder = archOrder;
      auraGroup.add(strainGlow);

      const stressDust = new THREE.Points(geometries.dustGeometry, materials.dustMat);
      stressDust.name = 'StressDust';
      stressDust.userData.ignoreWaveColor = true;
      stressDust.position.set(-0.06, 0.02, 0.04);
      stressDust.rotation.set(0.18, -0.26, 0.06);
      stressDust.scale.set(0.98, 1.12, 0.9);
      stressDust.frustumCulled = false;
      stressDust.renderOrder = archOrder;
      auraGroup.add(stressDust);

      const afterimageConfigs = [
        { source: heroShards[4], offset: new THREE.Vector3(0.08, 0.08, -0.02), scale: 1.12 },
        { source: heroShards[6], offset: new THREE.Vector3(0.12, 0.14, 0.0), scale: 1.2 },
        { source: heroShards[7], offset: new THREE.Vector3(0.02, 0.18, 0.04), scale: 1.28 }
      ];
      afterimageConfigs.forEach((cfg, idx) => {
        if (!cfg.source) return;
        const ghost = new THREE.Mesh(geometries.ghostShardGeometry, materials.ghostMat);
        ghost.name = `AfterimageGhost_${idx}`;
        ghost.userData.ignoreWaveColor = true;
        ghost.position.copy(cfg.source.position).add(cfg.offset);
        ghost.rotation.copy(cfg.source.rotation);
        ghost.scale.copy(cfg.source.scale).multiplyScalar(cfg.scale);
        ghost.renderOrder = archOrder;
        auraGroup.add(ghost);

        const ghostEdges = new THREE.LineSegments(geometries.ghostShardEdgesGeometry, materials.ghostEdgeMat);
        ghostEdges.name = `AfterimageGhost_${idx}_Edges`;
        ghostEdges.userData.ignoreWaveColor = true;
        ghostEdges.position.copy(ghost.position);
        ghostEdges.rotation.copy(ghost.rotation);
        ghostEdges.scale.copy(ghost.scale);
        ghostEdges.renderOrder = archOrder;
        auraGroup.add(ghostEdges);
      });

      const shellA = createNodeHologramShell(stressCore, 0xcdf7ff);
      if (shellA) {
        shellA.name = 'AccordShell_A';
        shellA.position.copy(stressCore.position).add(new THREE.Vector3(-0.04, 0.05, 0.02));
        shellA.quaternion.copy(stressCore.quaternion);
        shellA.scale.copy(stressCore.scale).multiplyScalar(1.12);
        shellA.frustumCulled = false;
        shellA.renderOrder = archOrder;
        if (shellA.material?.uniforms?.uOpacity) shellA.material.uniforms.uOpacity.value = 0.038;
        auraGroup.add(shellA);
      }

      const shellB = createNodeHologramShell(stressCore, 0xffd1e8);
      if (shellB) {
        shellB.name = 'AccordShell_B';
        shellB.position.copy(stressCore.position).add(new THREE.Vector3(0.08, -0.02, -0.04));
        shellB.quaternion.copy(stressCore.quaternion);
        shellB.scale.copy(stressCore.scale).multiplyScalar(1.24);
        shellB.frustumCulled = false;
        shellB.renderOrder = archOrder;
        if (shellB.material?.uniforms?.uOpacity) shellB.material.uniforms.uOpacity.value = 0.026;
        auraGroup.add(shellB);
      }

      const edgeGlow = createNodeNeonEdgeGlowShell(stressCore, 0xc8efff, {
        glowIntensity: 0.42,
        edgeWidth: 0.048,
        pulseAmount: 0.0
      });
      if (edgeGlow) {
        edgeGlow.name = 'StressEdgeGlow';
        edgeGlow.position.copy(stressCore.position);
        edgeGlow.quaternion.copy(stressCore.quaternion);
        edgeGlow.scale.copy(stressCore.scale).multiplyScalar(1.03);
        edgeGlow.frustumCulled = false;
        edgeGlow.renderOrder = archOrder;
        auraGroup.add(edgeGlow);
      }

      root.add(auraGroup);

      root.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'emotional-folded');
        }
      });

      root.userData.visualReady = true;
      root.userData.emotionalVariant = 'DISSONANT_ACCORD';
      root.userData.emotionalMood = 'AI_STRESS';
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'EMOTIONAL_FOLDED';
      group.add(root);
      return group;
    } catch (err) {
      console.error('[EmotionalFoldedAbort]', {
        reason: err?.message || err,
        visualCode
      });
      return null;
    }
  }

  static createEmotionalSymmetricSeed(group, visualCode, color) {
    try {
      const geometries = _getEmotionalSymmetricSeedGeometries();
      const resolvedColor = typeof color === 'undefined' ? visualCode : color;
      const materials = _getEmotionalSymmetricSeedMaterials(resolvedColor);
      const root = new THREE.Group();
      root.name = 'EMOTIONAL_ASCENSION_SEED_NODE';
      root.userData.visualVariant = 'EMOTIONAL_ASCENSION_SEED_V4';
      root.userData.nodeGeometryName = 'EMOTIONAL_ASCENSION_SEED';

      const seed = group?.userData?.nodeId ? hashString(group.userData.nodeId) : (Number.isFinite(visualCode) ? visualCode : 1206);
      const rng = _mythicSeededRng(seed);
      const coreOrder = EnhancedNodeModels._getCoreRenderOrder();
      const archOrder = EnhancedNodeModels._getArchetypeRenderOrder();

      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const emergenceCore = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      emergenceCore.name = 'EmergenceCore';
      emergenceCore.userData.ignoreWaveColor = true;
      emergenceCore.position.set(-0.03, 0.06, 0.02);
      emergenceCore.rotation.set(0.18, -0.24, 0.1);
      emergenceCore.scale.set(1.0, 1.2, 0.9);
      emergenceCore.renderOrder = coreOrder;
      coreGroup.add(emergenceCore);

      const emergenceEdges = new THREE.LineSegments(geometries.coreEdgesGeometry, materials.finEdgeMat);
      emergenceEdges.name = 'EmergenceCore_Edges';
      emergenceEdges.userData.ignoreWaveColor = true;
      emergenceEdges.position.copy(emergenceCore.position);
      emergenceEdges.rotation.copy(emergenceCore.rotation);
      emergenceEdges.scale.copy(emergenceCore.scale);
      emergenceEdges.renderOrder = archOrder;
      coreGroup.add(emergenceEdges);

      const emergenceSeam = new THREE.Mesh(geometries.seamGeometry, materials.seamMat);
      emergenceSeam.name = 'EmergenceSeam';
      emergenceSeam.userData.ignoreWaveColor = true;
      emergenceSeam.position.set(0.04, 0.11, -0.01);
      emergenceSeam.rotation.set(0.52, 0.34, -0.2);
      emergenceSeam.scale.set(0.88, 1.08, 0.82);
      emergenceSeam.renderOrder = archOrder;
      coreGroup.add(emergenceSeam);

      const embryoSeed = new THREE.Mesh(geometries.seedGeometry, materials.seedMat);
      embryoSeed.name = 'EmbryoSeed';
      embryoSeed.userData.ignoreWaveColor = true;
      embryoSeed.position.set(0.02, 0.16, 0.01);
      embryoSeed.rotation.set(-0.12, 0.56, 0.26);
      embryoSeed.scale.set(0.82, 1.28, 0.72);
      embryoSeed.renderOrder = coreOrder;
      coreGroup.add(embryoSeed);

      const ascensionCage = new THREE.LineSegments(geometries.cageEdgesGeometry, materials.cageMat);
      ascensionCage.name = 'AscensionCage';
      ascensionCage.userData.ignoreWaveColor = true;
      ascensionCage.position.copy(emergenceCore.position).add(new THREE.Vector3(0.02, 0.08, -0.01));
      ascensionCage.rotation.set(emergenceCore.rotation.x + 0.22, emergenceCore.rotation.y - 0.12, emergenceCore.rotation.z + 0.1);
      ascensionCage.scale.copy(emergenceCore.scale).multiplyScalar(1.2);
      ascensionCage.renderOrder = archOrder;
      coreGroup.add(ascensionCage);

      root.add(coreGroup);

      const germinationGroup = new THREE.Group();
      germinationGroup.name = 'GERMINATION_GROUP';
      const shellConfigs = [
        { geometry: geometries.shellGeometryA, edges: geometries.shellEdgesGeometryA, mat: materials.shellMatA, pos: [-0.24, 0.04, 0.06], rot: [0.22, -0.82, 0.26], scale: [0.9, 1.08, 0.88], name: 'CocoonShell_A' },
        { geometry: geometries.shellGeometryB, edges: geometries.shellEdgesGeometryB, mat: materials.shellMatB, pos: [0.2, 0.0, -0.06], rot: [-0.1, 0.92, -0.28], scale: [0.78, 1.06, 0.82], name: 'CocoonShell_B' },
        { geometry: geometries.shellGeometryC, edges: geometries.shellEdgesGeometryC, mat: materials.shellMatC, pos: [0.03, 0.38, 0.02], rot: [0.42, 0.16, 0.18], scale: [0.66, 0.96, 0.6], name: 'CocoonShell_C' }
      ];
      shellConfigs.forEach((cfg, idx) => {
        const shell = new THREE.Mesh(cfg.geometry, cfg.mat);
        shell.name = cfg.name;
        shell.userData.ignoreWaveColor = true;
        shell.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        shell.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.08,
          cfg.rot[1] + (rng() - 0.5) * 0.08,
          cfg.rot[2] + (rng() - 0.5) * 0.06
        );
        shell.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        shell.renderOrder = archOrder;
        germinationGroup.add(shell);

        const shellEdges = new THREE.LineSegments(cfg.edges, materials.shellEdgeMat);
        shellEdges.name = `${cfg.name}_Edges`;
        shellEdges.userData.ignoreWaveColor = true;
        shellEdges.position.copy(shell.position);
        shellEdges.rotation.copy(shell.rotation);
        shellEdges.scale.copy(shell.scale);
        shellEdges.renderOrder = archOrder;
        germinationGroup.add(shellEdges);

        if (idx === 2) {
          const witness = new THREE.Mesh(geometries.shellGeometryC, materials.shellMatA);
          witness.name = 'EmbryoPetal_Witness';
          witness.userData.ignoreWaveColor = true;
          witness.position.copy(shell.position).add(new THREE.Vector3(0.08, 0.14, -0.03));
          witness.rotation.set(shell.rotation.x + 0.26, shell.rotation.y + 0.22, shell.rotation.z - 0.12);
          witness.scale.copy(shell.scale).multiplyScalar(0.82);
          witness.renderOrder = archOrder;
          germinationGroup.add(witness);

          const witnessEdges = new THREE.LineSegments(geometries.shellEdgesGeometryC, materials.shellEdgeMat);
          witnessEdges.name = 'EmbryoPetal_Witness_Edges';
          witnessEdges.userData.ignoreWaveColor = true;
          witnessEdges.position.copy(witness.position);
          witnessEdges.rotation.copy(witness.rotation);
          witnessEdges.scale.copy(witness.scale);
          witnessEdges.renderOrder = archOrder;
          germinationGroup.add(witnessEdges);
        }
      });

      root.add(germinationGroup);

      const amplificationGroup = new THREE.Group();
      amplificationGroup.name = 'AMPLIFICATION_GROUP';
      const finConfigs = [
        { name: 'AscentFin_A', pos: [-0.44, -0.14, 0.22], rot: [0.36, -1.02, 0.84], scale: [0.78, 0.92, 0.7], mat: materials.finMatA },
        { name: 'AscentFin_B', pos: [0.3, -0.06, 0.28], rot: [-0.08, 0.88, -0.48], scale: [0.68, 0.86, 0.62], mat: materials.finMatB },
        { name: 'AscentFin_C', pos: [-0.12, 0.34, -0.22], rot: [0.98, -0.12, 1.02], scale: [0.72, 0.92, 0.66], mat: materials.finMatA },
        { name: 'AscentFin_D', pos: [0.2, 0.54, 0.18], rot: [1.22, 0.72, 0.52], scale: [0.64, 0.84, 0.58], mat: materials.finMatB },
        { name: 'AscentFin_E', pos: [0.0, 0.82, -0.04], rot: [1.46, 0.32, 0.18], scale: [0.56, 0.78, 0.5], mat: materials.finMatA }
      ];
      finConfigs.forEach((cfg, idx) => {
        const fin = new THREE.Mesh(geometries.finGeometry, cfg.mat);
        fin.name = cfg.name;
        fin.userData.ignoreWaveColor = true;
        fin.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
        fin.rotation.set(
          cfg.rot[0] + (rng() - 0.5) * 0.1,
          cfg.rot[1] + (rng() - 0.5) * 0.1,
          cfg.rot[2] + (rng() - 0.5) * 0.08
        );
        fin.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
        fin.renderOrder = archOrder;
        amplificationGroup.add(fin);

        const finEdges = new THREE.LineSegments(geometries.finEdgesGeometry, materials.finEdgeMat);
        finEdges.name = `${cfg.name}_Edges`;
        finEdges.userData.ignoreWaveColor = true;
        finEdges.position.copy(fin.position);
        finEdges.rotation.copy(fin.rotation);
        finEdges.scale.copy(fin.scale);
        finEdges.renderOrder = archOrder;
        amplificationGroup.add(finEdges);

        if (idx < 3) {
          const rail = new THREE.Mesh(geometries.railGeometry, materials.railMat);
          rail.name = `HymnRail_${idx}`;
          rail.userData.ignoreWaveColor = true;
          rail.position.copy(fin.position).add(new THREE.Vector3(0.02 + idx * 0.04, 0.12 + idx * 0.06, -0.04));
          rail.rotation.set(fin.rotation.x - 0.18, fin.rotation.y + 0.16, fin.rotation.z - 0.12);
          rail.scale.set(0.74 - idx * 0.08, 0.82 - idx * 0.06, 0.74 - idx * 0.08);
          rail.renderOrder = archOrder;
          amplificationGroup.add(rail);

          const railEdges = new THREE.LineSegments(geometries.railEdgesGeometry, materials.railEdgeMat);
          railEdges.name = `HymnRail_${idx}_Edges`;
          railEdges.userData.ignoreWaveColor = true;
          railEdges.position.copy(rail.position);
          railEdges.rotation.copy(rail.rotation);
          railEdges.scale.copy(rail.scale);
          railEdges.renderOrder = archOrder;
          amplificationGroup.add(railEdges);
        }
      });

      root.add(amplificationGroup);

      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const innerBloom = new THREE.Mesh(geometries.seedGeometry, materials.glowMat);
      innerBloom.name = 'InnerBloom';
      innerBloom.userData.ignoreWaveColor = true;
      innerBloom.position.copy(embryoSeed.position).add(new THREE.Vector3(-0.01, 0.03, 0.0));
      innerBloom.rotation.copy(embryoSeed.rotation);
      innerBloom.scale.set(1.82, 2.36, 1.54);
      innerBloom.renderOrder = archOrder;
      auraGroup.add(innerBloom);

      const ascensionDust = new THREE.Points(geometries.dustGeometry, materials.dustMat);
      ascensionDust.name = 'AscensionDust';
      ascensionDust.userData.ignoreWaveColor = true;
      ascensionDust.position.set(0.0, 0.06, 0.02);
      ascensionDust.rotation.set(0.16, -0.22, 0.08);
      ascensionDust.scale.set(0.96, 1.1, 0.92);
      ascensionDust.frustumCulled = false;
      ascensionDust.renderOrder = archOrder;
      auraGroup.add(ascensionDust);

      const shellA = createNodeHologramShell(emergenceCore, 0xd7fdff);
      if (shellA) {
        shellA.name = 'AscensionShell_A';
        shellA.position.copy(emergenceCore.position).add(new THREE.Vector3(-0.03, 0.05, 0.02));
        shellA.quaternion.copy(emergenceCore.quaternion);
        shellA.scale.copy(emergenceCore.scale).multiplyScalar(1.12);
        shellA.frustumCulled = false;
        shellA.renderOrder = archOrder;
        if (shellA.material?.uniforms?.uOpacity) shellA.material.uniforms.uOpacity.value = 0.034;
        auraGroup.add(shellA);
      }

      const shellB = createNodeHologramShell(emergenceCore, 0xffd9ee);
      if (shellB) {
        shellB.name = 'AscensionShell_B';
        shellB.position.copy(emergenceCore.position).add(new THREE.Vector3(0.06, -0.01, -0.02));
        shellB.quaternion.copy(emergenceCore.quaternion);
        shellB.scale.copy(emergenceCore.scale).multiplyScalar(1.24);
        shellB.frustumCulled = false;
        shellB.renderOrder = archOrder;
        if (shellB.material?.uniforms?.uOpacity) shellB.material.uniforms.uOpacity.value = 0.024;
        auraGroup.add(shellB);
      }

      const edgeGlow = createNodeNeonEdgeGlowShell(emergenceCore, 0xe6f8ff, {
        glowIntensity: 0.48,
        edgeWidth: 0.05,
        pulseAmount: 0.0
      });
      if (edgeGlow) {
        edgeGlow.name = 'AscensionEdgeGlow';
        edgeGlow.position.copy(emergenceCore.position);
        edgeGlow.quaternion.copy(emergenceCore.quaternion);
        edgeGlow.scale.copy(emergenceCore.scale).multiplyScalar(1.03);
        edgeGlow.frustumCulled = false;
        edgeGlow.renderOrder = archOrder;
        auraGroup.add(edgeGlow);
      }

      root.add(auraGroup);

      root.traverse((o) => {
        if (o?.isMesh || o?.isPoints || o?.isLine || o?.isLineSegments) {
          o.userData = o.userData || {};
          o.userData.ignoreWaveColor = true;
          const materialRefs = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const material of materialRefs) {
            material.userData = {
              ...(material.userData || {}),
              wavePatchMode: 'DEFAULT',
              ignoreWaveColor: true
            };
          }
          validateMeshGeometry(o, o.name || 'emotional-symmetric-seed');
        }
      });

      root.userData.visualReady = true;
      root.userData.emotionalVariant = 'ASCENSION_SEED';
      root.userData.emotionalMood = 'TRANSCENDENT_EMERGENCE';
      group.userData = group.userData || {};
      group.userData.visualReady = true;
      group.userData.nodeGeometryName = 'EMOTIONAL_SYMMETRIC_SEED';
      group.add(root);
      return group;
    } catch (err) {
      console.error('[EmotionalSymmetricSeedAbort]', {
        reason: err?.message || err,
        visualCode
      });
      return null;
    }
  }

  static createEmotionalNodeStyled_v2(group, index, color) {
    try {
      const geometries = _getEmotionalV2Geometries();
      const materials = _getEmotionalV2Materials(color);
      const emotionalRoot = new THREE.Group();
      emotionalRoot.name = 'EMOTIONAL_NODE';
      emotionalRoot.userData.visualVariant = 'EMOTIONAL_V2';

      const seed = group?.userData?.nodeId ? hashString(group.userData.nodeId) : index || 1;
      const rng = _mythicSeededRng(seed);
      const scratch = new THREE.Object3D();

      // CORE
      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';
      const core = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      core.name = 'DistortedCore';
      core.scale.set(1.0, 0.82, 1.15);
      core.rotation.set(0.18, -0.1, 0.05);
      const edges = new THREE.LineSegments(geometries.edgesGeometry, materials.edgeMat);
      edges.name = 'CoreEdges';
      edges.scale.copy(core.scale);
      edges.rotation.copy(core.rotation);
      edges.position.copy(core.position);
      const glow = new THREE.Mesh(geometries.shellGeometry, materials.glowMat);
      glow.name = 'InnerGlowLayer';
      glow.scale.setScalar(1.1);
      coreGroup.add(core);
      coreGroup.add(edges);
      coreGroup.add(glow);
      emotionalRoot.add(coreGroup);

      // AURA
      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';
      const shellA = new THREE.Mesh(geometries.shellGeometry, materials.shellAMat);
      shellA.name = 'EmotionShell_A';
      shellA.scale.setScalar(1.25);
      shellA.rotation.set(rng() * 0.6, rng() * 0.6, rng() * 0.6);
      auraGroup.add(shellA);
      const shellB = new THREE.Mesh(geometries.shellGeometry, materials.shellBMat);
      shellB.name = 'EmotionShell_B';
      shellB.scale.setScalar(1.4);
      shellB.rotation.set(rng() * 0.8, rng() * 0.8, rng() * 0.8);
      auraGroup.add(shellB);
      const mist = new THREE.Points(geometries.particlesGeometry, materials.particleMat);
      mist.name = 'EmotionMist';
      mist.frustumCulled = false;
      auraGroup.add(mist);
      emotionalRoot.add(auraGroup);

      // TENDRILS
      const tendrilGroup = new THREE.Group();
      tendrilGroup.name = 'TENDRIL_GROUP';

      const tendrilCount = 12;
      const tendrils = new THREE.InstancedMesh(geometries.tendrilGeometry, materials.tendrilMat, tendrilCount);
      tendrils.name = 'EmotionalTendrils';
      tendrils.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const rBase = (geometries.coreGeometry.boundingSphere?.radius || 0.6) * 1.1;
      for (let i = 0; i < tendrilCount; i++) {
        const dir = new THREE.Vector3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).normalize();
        scratch.position.copy(dir).multiplyScalar(rBase + 0.2 * rng());
        scratch.lookAt(dir.clone().multiplyScalar(2));
        const len = 0.7 + rng() * 0.9;
        scratch.scale.set(0.6 + rng() * 0.3, len, 0.6 + rng() * 0.3);
        scratch.rotation.x += (rng() - 0.5) * 0.3;
        scratch.rotation.y += (rng() - 0.5) * 0.3;
        scratch.updateMatrix();
        tendrils.setMatrixAt(i, scratch.matrix);
      }
      tendrils.instanceMatrix.needsUpdate = true;
      tendrilGroup.add(tendrils);

      const fragCount = 60;
      const frags = new THREE.InstancedMesh(geometries.fragmentGeometry, materials.fragmentMat, fragCount);
      frags.name = 'MicroFragments';
      frags.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      for (let i = 0; i < fragCount; i++) {
        const r = 0.9 + rng() * 0.7;
        const theta = rng() * Math.PI * 2;
        const phi = Math.acos(2 * rng() - 1);
        const x = r * Math.sin(phi) * Math.cos(theta) + (rng() - 0.5) * 0.15;
        const y = r * Math.sin(phi) * Math.sin(theta) + (rng() - 0.5) * 0.15;
        const z = r * Math.cos(phi) + (rng() - 0.5) * 0.15;
        scratch.position.set(x, y, z);
        scratch.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
        const s = 0.6 + rng() * 0.5;
        scratch.scale.setScalar(s);
        scratch.updateMatrix();
        frags.setMatrixAt(i, scratch.matrix);
      }
      frags.instanceMatrix.needsUpdate = true;
      tendrilGroup.add(frags);

      emotionalRoot.add(tendrilGroup);

      emotionalRoot.userData.visualReady = true;
      group.add(emotionalRoot);
      return group;
    } catch (err) {
      console.error('[EmotionalV2Abort]', { reason: err?.message || err });
      return null;
    }
  }

  // Legacy EMOTIONAL visuals retained as fallback
  static _createEmotionalNodeLegacy(group, index, color) {
    const variants = [
      () => CanonicalGeometryFamilies.createEmotionalHeartCrystal(1.0),
      () => CanonicalGeometryFamilies.createEmotionalNeuralLobe(1.0),
      () => CanonicalGeometryFamilies.createEmotionalBloomingGem(1.0),
      () => CanonicalGeometryFamilies.createEmotionalTearShaped(1.0),
      () => CanonicalGeometryFamilies.createEmotionalFolded(1.0),
      () => CanonicalGeometryFamilies.createEmotionalSymmetricSeed(1.0)
    ];

    const mesh = variants[index % variants.length]();
    if (!mesh.userData) mesh.userData = {};
    mesh.userData.category = 'emotional';
    mesh.userData.visualReady = true;
    group.add(mesh);
    return group;
  }

  /**
   * Animate node (rotation, pulsing, etc)
   * UPGRADED: Supports internal rotating elements and animations
   */
  static animate(nodeGroup, deltaTime, time) {
    const interactionActive = (
      nodeGroup.userData?.hoveredState === true ||
      nodeGroup.userData?.isSelected === true ||
      (nodeGroup.userData?.activationLevel || 0) > 0
    );

    // Phase B.3.B: idle nodes must not mutate visual state per-frame.
    if (!interactionActive) {
      return;
    }

    // Gentle primary rotation
    nodeGroup.rotation.y += deltaTime * 0.3;

    // Category-specific rotations
    if (nodeGroup.userData.rotationAxis) {
      const axis = nodeGroup.userData.rotationAxis;
      nodeGroup.rotation.x += deltaTime * 0.2 * axis.x;
      nodeGroup.rotation.z += deltaTime * 0.2 * axis.z;
    }

    // CONTROL_V2 deterministic motion (no random traversal)
    if (
      nodeGroup.userData?.visualVariant === 'CONTROL_V2' ||
      nodeGroup.children.some(c => c.userData?.visualVariant === 'CONTROL_V2')
    ) {
      const controlV2Root = nodeGroup.userData?.visualVariant === 'CONTROL_V2'
        ? nodeGroup
        : nodeGroup.children.find(c => c.userData?.visualVariant === 'CONTROL_V2');
      if (!controlV2Root) {
        // Keep animation flow intact for other categories.
      } else {

        let innerRing = controlV2Root.userData.controlV2InnerRing;
        let segmentedRing = controlV2Root.userData.controlV2SegmentRing;
        let spire = controlV2Root.userData.controlV2Spire;

        if (!innerRing || !segmentedRing || !spire) {
          const coreGroup = controlV2Root.children.find(c => c.name === 'CORE_GROUP');
          const dominionGroup = controlV2Root.children.find(c => c.name === 'DOMINION_GROUP');
          if (!spire && coreGroup) {
            spire = coreGroup.children.find(c => c.name === 'AuthoritySpire');
            controlV2Root.userData.controlV2Spire = spire || null;
          }
          if (!innerRing && dominionGroup) {
            innerRing = dominionGroup.children.find(c => c.name === 'InnerRigidRing');
            controlV2Root.userData.controlV2InnerRing = innerRing || null;
          }
          if (!segmentedRing && dominionGroup) {
            segmentedRing = dominionGroup.children.find(c => c.name === 'OuterSegmentedRing');
            controlV2Root.userData.controlV2SegmentRing = segmentedRing || null;
          }
        }

        if (innerRing) {
          innerRing.rotation.z += deltaTime * (controlV2Root.userData.controlV2InnerRingSpeed || 0.18);
        }
        if (segmentedRing) {
          segmentedRing.rotation.y += deltaTime * (controlV2Root.userData.controlV2SegmentRingSpeed || -0.12);
        }
        if (spire) {
          spire.rotation.y += deltaTime * (controlV2Root.userData.controlV2SpireSpeed || 0.09);
          const base = spire.userData.pulseBaseScaleY || 1;
          const amp = controlV2Root.userData.controlV2SpirePulseAmp || 0.02;
          const speed = controlV2Root.userData.controlV2SpirePulseSpeed || 1.25;
          spire.scale.y = base * (1 + Math.sin(time * speed) * amp);
        }
      }
    }

    // POLISH: Animate inner signal rotations (INPUT nodes)
    if (nodeGroup.userData.innerSignalRotationAxis) {
      const innerSignal = nodeGroup.children.find(c => c.geometry && c.geometry.type === 'TetrahedronGeometry');
      if (innerSignal) {
        const axis = nodeGroup.userData.innerSignalRotationAxis;
        const speed = nodeGroup.userData.innerSignalRotationSpeed || 0.2;
        innerSignal.rotateOnWorldAxis(axis, deltaTime * speed);
      }
    }

    // POLISH: Animate internal vector rotations (INPUT nodes - WireframeSphere)
    if (nodeGroup.userData.vectorRotationAxis) {
      const vector = nodeGroup.children.find(c => c.userData && c.userData.isAnalyticalFrame === false && c.geometry && c.geometry.type === 'OctahedronGeometry');
      if (vector && nodeGroup.children.indexOf(vector) > 1) { // Skip outer octa
        const axis = nodeGroup.userData.vectorRotationAxis;
        const speed = nodeGroup.userData.vectorRotationSpeed || 0.25;
        vector.rotateOnWorldAxis(axis, deltaTime * speed);
      }
    }

    // Mesh pulsing disabled for deterministic visuals

    // POLISH: Animate internal analytical frame (ANALYTICS nodes)
    if (nodeGroup.userData.analyticalFrameRotationAxis) {
      const frameplane = nodeGroup.children.find(c => c.userData && c.userData.isAnalyticalFrame);
      if (frameplane) {
        const axis = nodeGroup.userData.analyticalFrameRotationAxis;
        const speed = nodeGroup.userData.analyticalFrameRotationSpeed || 0.18;
        frameplane.rotateOnWorldAxis(axis, deltaTime * speed);
      }
    }

    // POLISH: Animate internal analysis geometry (ANALYTICS cube variant)
    if (nodeGroup.userData.internalGeometryRotationAxis) {
      const internalGeo = nodeGroup.children.find(c => c.userData && c.userData.isInternalAnalysisGeometry);
      if (internalGeo) {
        const axis = nodeGroup.userData.internalGeometryRotationAxis;
        const speed = nodeGroup.userData.internalGeometryRotationSpeed || 0.22;
        internalGeo.rotateOnWorldAxis(axis, deltaTime * speed);
      }
    }

    // POLISH: Animate storage segment micro-rotations
    if (nodeGroup.userData.segmentMicroRotationEnabled) {
      nodeGroup.children.forEach((child, idx) => {
        if (child.userData && child.userData.segmentIndex !== undefined) {
          const baseRotZ = Math.sin(child.userData.segmentIndex * 0.5) * 0.08;
          const pulse = Math.sin(time * 0.8 + child.userData.segmentIndex) * 0.04;
          child.rotation.z = baseRotZ + pulse;
        }
      });
    }

    // POLISH: Animate MNEMONIC_VAULT (inner core + outer shell counter-rotation)
    if (nodeGroup.userData.mnemonicCoreRotationAxis) {
      const innerCore = nodeGroup.children.find(c => c.userData && c.userData.isInnerCore);
      if (innerCore) {
        const axis = nodeGroup.userData.mnemonicCoreRotationAxis;
        const speed = nodeGroup.userData.mnemonicCoreRotationSpeed || 0.08;
        innerCore.rotateOnWorldAxis(axis, deltaTime * speed);
      }
      
      const outerShell = nodeGroup.children.find(c => c.userData && c.userData.isOuterShell);
      if (outerShell) {
        const axis = nodeGroup.userData.mnemonicShellRotationAxis;
        const speed = nodeGroup.userData.mnemonicShellRotationSpeed || -0.06;
        outerShell.rotateOnWorldAxis(axis, deltaTime * speed);
      }
    }

    // POLISH: Animate ARCHIVE_SPINDLE (axial rotation + vertical oscillation)
    if (nodeGroup.userData.spindleRotationSpeed) {
      // Axial rotation (Y-axis)
      nodeGroup.rotation.y += deltaTime * nodeGroup.userData.spindleRotationSpeed;
      
      // Vertical oscillation (stored in baseY)
      if (!nodeGroup.userData.baseY) {
        nodeGroup.userData.baseY = nodeGroup.position.y;
      }
      const oscillation = Math.sin(time * nodeGroup.userData.spindleOscillationSpeed) * nodeGroup.userData.spindleOscillationAmplitude;
      nodeGroup.position.y = nodeGroup.userData.baseY + oscillation;
    }

    // POLISH: Animate MEMORY_REEF (shard orbital animation)
    if (nodeGroup.userData.reefShardOrbitSpeed) {
      const shardCount = nodeGroup.userData.reefShardCount || 8;
      let shardIndex = 0;
      
      nodeGroup.children.forEach(child => {
        if (child.userData && child.userData.shardIndex !== undefined) {
          const baseAngle = child.userData.orbitAngle || 0;
          const orbitRadius = child.userData.orbitRadius || 0.65;
          const orbitHeight = child.userData.orbitHeight || 0;
          
          // Slow orbital motion
          const orbitalPhase = time * nodeGroup.userData.reefShardOrbitSpeed + baseAngle;
          
          child.position.set(
            Math.cos(orbitalPhase) * orbitRadius,
            orbitHeight,
            Math.sin(orbitalPhase) * orbitRadius
          );
          
          shardIndex++;
        }
      });
    }

    // POLISH: Animate FLUX_CHAMBER (outer chamber + inner core counter-rotation)
    if (nodeGroup.userData.chamberOuterRotationAxis) {
      const outerChamber = nodeGroup.children.find(c => c.userData && c.userData.isOuterChamber);
      if (outerChamber) {
        const axis = nodeGroup.userData.chamberOuterRotationAxis;
        const speed = nodeGroup.userData.chamberOuterRotationSpeed || 0.1;
        outerChamber.rotateOnWorldAxis(axis, deltaTime * speed);
      }
      
      const innerCore = nodeGroup.children.find(c => c.userData && c.userData.isProcessorCore);
      if (innerCore) {
        const axis = nodeGroup.userData.chamberInnerRotationAxis;
        const speed = nodeGroup.userData.chamberInnerRotationSpeed || -0.14;
        innerCore.rotateOnWorldAxis(axis, deltaTime * speed);
      }
    }

    // POLISH: Animate TRANSFORMATION_SPINE (axial rotation only; breathing disabled)
    // [SESSION 107] LEGACY SCALE PULSE AUDIT - Breathing permanently removed
    if (nodeGroup.userData.spineRotationSpeed) {
      // Axial rotation
      nodeGroup.rotation.y += deltaTime * nodeGroup.userData.spineRotationSpeed;
    }

    // POLISH: Animate CONVERSION_ORBIT (orbiting rings around stable core)
    if (nodeGroup.userData.orbitRingCount) {
      nodeGroup.children.forEach(child => {
        if (child.userData && child.userData.isOrbitRing) {
          const orbitAxis = child.userData.orbitAxis;
          const orbitSpeed = child.userData.orbitSpeed;
          if (orbitAxis && orbitSpeed) {
            child.rotateOnWorldAxis(orbitAxis, deltaTime * orbitSpeed);
          }
        }
      });
    }

    // POLISH: Animate OBSERVER_LENS (very slow rotation + subtle wobble)
    if (nodeGroup.userData.lensRotationSpeed) {
      // Very slow rotation around Y-axis
      nodeGroup.rotation.y += deltaTime * nodeGroup.userData.lensRotationSpeed;
      
      // Subtle axial wobble (tilt back and forth)
      if (!nodeGroup.userData.wobblePhase) {
        nodeGroup.userData.wobblePhase = 0;
      }
      nodeGroup.userData.wobblePhase += deltaTime * nodeGroup.userData.lensWobbleSpeed;
      const wobble = Math.sin(nodeGroup.userData.wobblePhase) * nodeGroup.userData.lensWobbleAmplitude;
      nodeGroup.rotation.x = wobble;
    }

    // POLISH: Animate FRACTAL_ECHO (seed + echoes counter-rotation; breathing disabled)
    if (nodeGroup.userData.fractalSeedRotationSpeed) {
      // Seed core rotates one direction
      const seed = nodeGroup.children.find(c => c.userData && c.userData.isSeedCore);
      if (seed) {
        seed.rotation.x += deltaTime * nodeGroup.userData.fractalSeedRotationSpeed * 0.3;
        seed.rotation.y += deltaTime * nodeGroup.userData.fractalSeedRotationSpeed * 0.5;
        seed.rotation.z += deltaTime * nodeGroup.userData.fractalSeedRotationSpeed * 0.2;
      }

      // Echoes counter-rotate (different axis)
      nodeGroup.children.forEach(child => {
        if (child.userData && child.userData.isEcho) {
          child.rotation.x -= deltaTime * nodeGroup.userData.fractalEchoRotationSpeed * 0.4;
          child.rotation.y -= deltaTime * nodeGroup.userData.fractalEchoRotationSpeed * 0.6;
          child.rotation.z -= deltaTime * nodeGroup.userData.fractalEchoRotationSpeed * 0.3;
        }
      });

      // Breathing removed; scale remains unchanged
    }

    // POLISH: Animate PARALLAX_ORACLE (planes rotate independently, core stable)
    if (nodeGroup.userData.observerPlaneCount) {
      nodeGroup.children.forEach(child => {
        if (child.userData && child.userData.isObservationPlane) {
          const rotAxis = child.userData.planeRotationAxis;
          const rotSpeed = child.userData.planeRotationSpeed;
          if (rotAxis && rotSpeed) {
            child.rotateOnWorldAxis(rotAxis, deltaTime * rotSpeed);
          }
        }
      });
      // Core observer remains completely stable (NO rotation)
    }

    // POLISH: Animate SIGNAL_RECEPTOR (core rotation; antenna pulse disabled)
    // [SESSION 107] LEGACY SCALE PULSE AUDIT - Antenna pulse removed
    if (nodeGroup.userData.receptorRotationSpeed) {
      // Core rotation
      nodeGroup.rotation.y += deltaTime * nodeGroup.userData.receptorRotationSpeed;
    }

    // POLISH: Animate DATA_GATEWAY (ring rotation + portal oscillation + stream flow)
    if (nodeGroup.userData.gatewayRingRotationSpeed) {
      const refs = nodeGroup.userData.gatewayAnimationRefs || {};

      // Ring rotation
      let ring = refs.ring || null;
      let portal = refs.portal || null;
      let streamSegments = Array.isArray(refs.streamSegments) ? refs.streamSegments : null;
      if (!ring || !portal || !streamSegments?.length) {
        const discoveredSegments = [];
        nodeGroup.traverse((child) => {
          if (!ring && child.userData?.isGatewayRing) ring = child;
          if (!portal && child.userData?.isPortal) portal = child;
          if (child.userData?.isStreamSegment) discoveredSegments.push(child);
        });
        if (!streamSegments?.length) streamSegments = discoveredSegments;
      }
      if (ring) {
        ring.rotation.z += deltaTime * nodeGroup.userData.gatewayRingRotationSpeed;
      }
      
      // Portal oscillation (up/down bobbing)
      if (portal) {
        const oscillation = Math.sin(time * nodeGroup.userData.portalOscillationSpeed) * nodeGroup.userData.portalOscillationAmplitude;
        portal.position.y = (portal.userData?.basePortalY || 0) + oscillation;
      }
      
      // Stream flow animation (segments flowing inward)
      (streamSegments || []).forEach(child => {
        if (child.userData?.isStreamSegment) {
          const baseZ = child.userData.baseZ;
          const flowOffset = (time * nodeGroup.userData.streamFlowSpeed + child.userData.segmentIndex * 0.3) % 1.2;
          const laneBias = Number.isFinite(baseZ) ? baseZ * 0.28 : 0.0;
          child.position.z = 0.46 + laneBias - flowOffset * 0.72;
        }
      });
    }

    // POLISH: Animate INCOMING_FUNNEL (funnel rotation; width breathing disabled)
    // [SESSION 107] LEGACY SCALE PULSE AUDIT - Breathing removed
    if (nodeGroup.userData.funnelRotationSpeed) {
      // Funnel rotation
      nodeGroup.rotation.y += deltaTime * nodeGroup.userData.funnelRotationSpeed;
    }

    // ANALYTICS shard orbit & spine pulse
    nodeGroup.traverse(child => {
      if (child.userData?.isAnalyticsShardGroup) {
        child.rotation.y += deltaTime * 0.25;
        child.children.forEach(frag => {
          frag.position.y = Math.sin(time * 1.2 + frag.userData.bobPhase) * 0.05;
        });
      }
      if (child.userData?.isAnalyticsSpine) {
        const base = child.userData.pulseBaseScale || 1;
        child.scale.y = base * (1 + Math.sin(time * 1.5) * 0.02);
      }
      if (child.userData?.isInputVortexCore && child.userData.vortexUniforms?.uTime) {
        child.userData.vortexUniforms.uTime.value = 0;
      }
      if (child.userData?.isIntegrationOrbit) {
        child.rotation.y += deltaTime * 0.08;
      }
      if (child.userData?.isControl3Core && child.userData.fractureUniforms?.uTime) {
        child.userData.fractureUniforms.uTime.value = 0;
      }
      if (child.userData?.isAuthorityAxis) {
        child.rotation.y += deltaTime * 0.05;
        child.rotation.x += deltaTime * 0.02;
      }
      if (child.userData?.isSigmaCore && child.userData.collapseUniforms) {
        child.userData.collapseUniforms.uTime.value = 0;
        child.userData.collapseUniforms.uCollapseStrength.value = 0.5;
      }
      if (child.userData?.isSigmaLayer && child.userData.ringSpeed) {
        child.rotation.y += deltaTime * child.userData.ringSpeed;
      }
      if (child.userData?.isSigmaShard) {
        child.rotation.x += deltaTime * 0.3;
        child.rotation.y += deltaTime * 0.2;
      }
    });

    // POLISH: Animate COMMAND_PYRAMID (core rotation; glow pulsing disabled)
    // [SESSION 107] LEGACY SCALE PULSE AUDIT - Glow pulsing removed
    if (nodeGroup.userData.commandRotationSpeed) {
      // Pyramid rotation
      nodeGroup.rotation.y += deltaTime * nodeGroup.userData.commandRotationSpeed;
    }

    // POLISH: Animate HIERARCHY_TOWER (tower rotation + level oscillation)
    if (nodeGroup.userData.towerRotationSpeed) {
      // Tower rotation
      nodeGroup.rotation.y += deltaTime * nodeGroup.userData.towerRotationSpeed;
      
      // Level oscillation (gentle bobbing)
      nodeGroup.children.forEach(child => {
        if (child.userData && child.userData.isHierarchyLevel) {
          const baseY = child.userData.baseY;
          const oscillation = Math.sin(time * nodeGroup.userData.levelOscillationSpeed + child.userData.levelIndex * 0.3) * nodeGroup.userData.levelOscillationAmplitude;
          child.position.y = baseY + oscillation;
        }
      });
    }

    // POLISH: Animate SYMMETRY_CORE (core + arms counter-rotation)
    if (nodeGroup.userData.symCoreRotationSpeed) {
      // Core rotates one direction
      const core = nodeGroup.children.find(c => c.userData && c.userData.isSymmetryCore);
      if (core) {
        core.rotation.x += deltaTime * nodeGroup.userData.symCoreRotationSpeed * 0.3;
        core.rotation.y += deltaTime * nodeGroup.userData.symCoreRotationSpeed * 0.7;
        core.rotation.z += deltaTime * nodeGroup.userData.symCoreRotationSpeed * 0.2;
      }
      
      // Arms counter-rotate (opposite direction)
      nodeGroup.children.forEach(child => {
        if (child.userData && child.userData.isSymmetryArm) {
          const armIndex = child.userData.armIndex;
          child.rotation.x -= deltaTime * nodeGroup.userData.symArmRotationSpeed * 0.3;
          child.rotation.y -= deltaTime * nodeGroup.userData.symArmRotationSpeed * 0.4;
          child.rotation.z -= deltaTime * nodeGroup.userData.symArmRotationSpeed * 0.3;
        }
      });
    }

    // POLISH: Animate FLOW_RECOMPOSER (floating shards + core)
    if (nodeGroup.userData.nodeGeometryName === 'PROCESS_FLOW_RECOMPOSER') {
      nodeGroup.children.forEach(child => {
        if (child.userData.isRecomposerShard) {
          // Slow drift and rotation
          const speed = child.userData.driftSpeed || 0.1;
          
          // Rotate shard around its own center
          child.rotation.z += deltaTime * speed;
          child.rotation.x += deltaTime * speed * 0.5;
          
          // Slight positional drift
          // We apply a sine wave offset to the initial position concept
          // Since we don't store initial pos explicitly on child here, we assume current is close enough
          // or just oscillate rotation more aggressively to simulate reconfiguration
          const wobble = Math.sin(time * speed) * 0.002;
          child.position.y += wobble;
        }
        if (child.userData.isFlowCore) {
           child.rotation.y -= deltaTime * 0.2;
        }
      });
    }

    // POLISH: Animate TEMPORAL_SHIFTER (layer drift)
    if (nodeGroup.userData.nodeGeometryName === 'PROCESS_TEMPORAL_SHIFTER') {
       nodeGroup.children.forEach(child => {
         if (child.userData.isTemporalLayer) {
            const phase = child.userData.phaseOffset || 0;
            const speed = child.userData.shiftSpeed || 0.5;
            
            // Drift on X/Z plane (temporal stability)
            // Using absolute time to ensure smooth wave
            const driftX = Math.sin(time * speed + phase) * 0.08;
            const driftZ = Math.cos(time * speed * 0.8 + phase) * 0.05;
            
            // Apply drift (resetting position near center first would be better, but this adds to current)
            // To be safe and avoid drift-away, we set relative to 0 if we assume stack is centered
            // But child.position.y was set during creation. We must preserve Y.
            // child.position.x = driftX; // This overrides initialization
            // Let's just Add to rotation to imply shifting if position is risky without base
            child.rotation.y = time * 0.1 + phase;
            
            // Actually, let's use the drift for position X/Z as intended
            child.position.x = driftX;
            child.position.z = driftZ;
         }
       });
    }

    // POLISH: Animate ITERATIVE_ENGINE (ring rotation)
    if (nodeGroup.userData.nodeGeometryName === 'PROCESS_ITERATIVE_ENGINE') {
        nodeGroup.children.forEach(child => {
            if (child.userData.isIterativeRing) {
                const axis = child.userData.rotationAxis;
                const speed = child.userData.rotationSpeed;
                if (axis && speed) {
                    child.rotateOnWorldAxis(axis, deltaTime * speed);
                }
            }
            if (child.userData.isIterativeCore) {
                child.rotation.y += deltaTime * 0.5;
                child.rotation.z += deltaTime * 0.2;
            }
        });
    }

    // ============================================================================
    // STORAGE ENHANCED ANIMATIONS (Session 81 - Kinetic Update)
    // ============================================================================

    // 1. STORAGE_ARCHIVE_NEXUS (DataWeaver)
    if (nodeGroup.userData.nodeGeometryName === 'STORAGE_ARCHIVE_NEXUS') {
      nodeGroup.children.forEach(child => {
        // Strands oscillate like a loom
        if (child.userData.isArchiveStrand) {
          const idx = child.userData.strandIndex || 0;
          // Gentle sway in rotation
          if (child.userData.baseRot) {
             const sway = Math.sin(time * 0.5 + idx) * 0.1;
             child.rotation.y = child.userData.baseRot.y + sway;
          }
        }
        // Shuttles move vertically
        if (child.userData.isArchiveShuttle) {
          const idx = child.userData.shuttleIndex || 0;
          const travel = Math.sin(time * 0.8 + idx * 2) * 0.25;
          child.position.y = child.userData.baseY + travel;
        }
        // Core spins
        if (child.userData.isArchiveCore) {
          child.rotation.y -= deltaTime * 0.5;
        }
      });
    }

    // 2. STORAGE_MEMORY_CRYPTS (VaultStack)
    if (nodeGroup.userData.nodeGeometryName === 'STORAGE_MEMORY_CRYPTS') {
      nodeGroup.children.forEach(child => {
        if (child.userData.isCryptChamber) {
          const idx = child.userData.chamberIndex || 0;
          
          // Rotating chambers (like combination lock)
          // Alternate direction per layer
          const dir = idx % 2 === 0 ? 1 : -1;
          child.rotation.y += deltaTime * 0.2 * dir;
          
          // Vertical breathing (unlocking motion)
          const slide = Math.sin(time * 0.4 + idx) * 0.02;
          child.position.y = child.userData.baseY + slide;
        }
      });
    }

    // 3. STORAGE_DEPTH_LAYERS (ContainmentField)
    if (nodeGroup.userData.nodeGeometryName === 'STORAGE_DEPTH_LAYERS') {
      nodeGroup.children.forEach(child => {
        if (child.userData.isDepthShell) {
          const axis = child.userData.rotationAxis;
          const speed = child.userData.rotationSpeed || 0.1;
          
          // Independent shell rotation
          if (axis) {
            child.rotateOnWorldAxis(axis, deltaTime * speed);
          }
        }
        
        if (child.userData.isDepthCore) {
          // Depth core static scale retained; no breathing
        }
      });
    }

    // ============================================================================
    // INPUT SENSORY ANIMATIONS (Session 111 - Kinetic Update)
    // ============================================================================

    // 1. INPUT_TACTILE_SENSOR (TactileSensor)
    if (nodeGroup.userData.nodeGeometryName === 'INPUT_TACTILE_SENSOR') {
      nodeGroup.children.forEach(child => {
        if (child.userData.isTactileBristle && child.userData.curve) {
          // Wave motion along bristle
          const phase = child.userData.bendPhase;
          const speed = child.userData.bendSpeed;
          const amplitude = child.userData.bendAmplitude;
          
          // Create wave traveling down bristle
          const wave = Math.sin(time * speed + phase) * amplitude;
          
          // Store original position and apply wave offset
          if (!child.userData.baseScale) {
            child.userData.baseScale = child.scale.clone();
          }
          
          // Apply slight bend via scale modulation
          child.scale.y = child.userData.baseScale.y * (1.0 + wave * 0.5);
          child.scale.x = child.userData.baseScale.x * (1.0 - wave * 0.3);
          child.scale.z = child.userData.baseScale.z * (1.0 - wave * 0.3);
          
          // Rotation wave
          child.rotation.x += Math.sin(time * speed + phase + 1) * deltaTime * 0.3;
          child.rotation.z += Math.cos(time * speed + phase) * deltaTime * 0.2;
        }
      });
    }

    // 2. INPUT_ECHO_DETECTOR (EchoDetector)
    if (nodeGroup.userData.nodeGeometryName === 'INPUT_ECHO_DETECTOR') {
      nodeGroup.children.forEach(child => {
        if (child.userData.isEchoShell) {
          const shellLayer = child.userData.shellLayer;
          
          // Subtle rotation only (breathing disabled)
          child.rotation.x += deltaTime * 0.1 * (1 - shellLayer * 0.15);
          child.rotation.y += deltaTime * 0.08 * (shellLayer * 0.2 + 0.5);
        }
        
        if (child.userData.isEchoChamber) {
          // Rotation of chamber (breathing disabled)
          child.rotation.x += deltaTime * 0.3;
          child.rotation.y += deltaTime * 0.2;
        }
      });
    }

    // 3. INPUT_NEURAL_RECEPTOR (NeuralReceptor)
    if (nodeGroup.userData.nodeGeometryName === 'INPUT_NEURAL_RECEPTOR') {
      nodeGroup.children.forEach(child => {
        // Neural signals travel along dendrite curves
        if (child.userData.isNeuralSignal && child.userData.parentCurve) {
          const curve = child.userData.parentCurve;
          const speed = child.userData.signalSpeed;
          const pointScratch = child.userData.signalPointScratch || (child.userData.signalPointScratch = new THREE.Vector3());
          
          // Advance along curve
          child.userData.pathOffset = (child.userData.pathOffset + deltaTime * speed) % 1.0;
          
          // Get position on curve
          curve.getPoint(child.userData.pathOffset, pointScratch);
          child.position.copy(pointScratch);
        }
      });
    }

    // ============================================================================
    // INTEGRATION ENHANCED ANIMATIONS (Session 110 - Kinetic Update)
    // ============================================================================

    // 1. INTEGRATION_SIGNAL_KNOT (Signal Knot)
    if (nodeGroup.userData.nodeGeometryName === 'INTEGRATION_SIGNAL_KNOT') {
      nodeGroup.children.forEach(child => {
        // Signal packets travel along curves
        if (child.userData.isSignalPacket && child.userData.parentCurve) {
          const curve = child.userData.parentCurve;
          const speed = child.userData.packetSpeed || 0.2;
          const pointScratch = child.userData.signalPointScratch || (child.userData.signalPointScratch = new THREE.Vector3());
          
          // Advance path offset
          child.userData.pathOffset = (child.userData.pathOffset + deltaTime * speed) % 1.0;
          
          // Get point on curve
          curve.getPoint(child.userData.pathOffset, pointScratch);
          child.position.copy(pointScratch);
        }
      });
    }

    // 2. INTEGRATION_PROTOCOL_TANGLE (Protocol Tangle)
    if (nodeGroup.userData.nodeGeometryName === 'INTEGRATION_PROTOCOL_TANGLE') {
      nodeGroup.children.forEach(child => {
        if (child.userData.isProtocolStrand) {
          // Jitter/Vibration effect (Visual friction)
          const amp = child.userData.vibrationAmp || 0.01;
          const speed = child.userData.vibrationSpeed || 2.0;
          
          const jitterX = Math.sin(time * speed * 1.1 + child.userData.strandIndex) * amp;
          const jitterY = Math.cos(time * speed * 0.9 + child.userData.strandIndex) * amp;
          const jitterZ = Math.sin(time * speed * 1.3 + child.userData.strandIndex) * amp;
          
          child.position.set(jitterX, jitterY, jitterZ);
        }
        
        if (child.userData.isFrictionNode) {
          // Rotating friction nodes
          const speed = child.userData.rotSpeed || 1.0;
          child.rotation.x += deltaTime * speed;
          child.rotation.y += deltaTime * speed * 0.7;
        }
      });
    }

    // 3. INTEGRATION_CONTINUITY_BINDER (Continuity Binder)
    if (nodeGroup.userData.nodeGeometryName === 'INTEGRATION_CONTINUITY_BINDER') {
      // Anchor rotations retained; breathing tension removed
      nodeGroup.children.forEach(child => {
        if (child.userData && child.userData.isStabilityAnchor) {
           child.rotation.z += deltaTime * 0.2;
        }
      });
    }

    // ============================================================================
    // CONTROL ENHANCED ANIMATIONS (Session 83 - Kinetic Update)
    // ============================================================================

    // 1. CONTROL_DECISION_FORK (SynapseFork)
    if (nodeGroup.userData.nodeGeometryName === 'CONTROL_DECISION_FORK') {
      nodeGroup.children.forEach(child => {
        // Orbiting convergence nodes
        if (child.userData.isConvergenceNode) {
           const radius = child.userData.orbitRadius;
           const speed = child.userData.orbitSpeed;
           const idx = child.userData.orbitIndex;
           
           const angle = time * speed + (idx * Math.PI * 2 / 3);
           child.position.x = Math.cos(angle) * radius;
           child.position.z = Math.sin(angle) * radius;
           child.position.y = Math.sin(angle * 2) * 0.2 + 0.5; // Undulating orbit
        }
        
        // Decision branch emissive pulsing disabled
      });
    }

    // 2. CONTROL_AUTHORITY_HELIX (CommandSpire)
    if (nodeGroup.userData.nodeGeometryName === 'CONTROL_AUTHORITY_HELIX') {
      nodeGroup.children.forEach(child => {
        if (child.userData.isHelixStrand) {
           // Continuous rotation of the helix
           child.rotation.y -= deltaTime * 0.5;
        }
        if (child.userData.isTierRing) {
           // Counter-rotation of rings
           child.rotation.y += deltaTime * 0.2;
           // Gentle wobble
           child.rotation.x = Math.sin(time + child.userData.tierIndex) * 0.1;
        }
      });
    }

    // 3. CONTROL_COMMAND_MATRIX (OverseerGrid)
    if (nodeGroup.userData.nodeGeometryName === 'CONTROL_COMMAND_MATRIX') {
      nodeGroup.children.forEach(child => {
        if (child.userData.isCommandNode) {
           // Independent bobbing of grid nodes
           const phase = child.userData.bobPhase || 0;
           const bob = Math.sin(time * 1.5 + phase) * 0.03;
           if (child.userData.basePos) {
              child.position.y = child.userData.basePos.y + bob;
           }
        }
        if (child.userData.isFlowLine) {
           // Flow lines remain at their configured opacity (no pulsing)
        }
        if (child.userData.isMatrixCore) {
           // Core scale remains static (no throbbing)
        }
      });
    }

    // Global emissive pulsing disabled for deterministic visuals

    // Floating animation
    const float = Math.sin(time * 0.5) * 0.1;
    if (!nodeGroup.userData.baseY) {
      nodeGroup.userData.baseY = nodeGroup.position.y;
    }
    nodeGroup.position.y = nodeGroup.userData.baseY + float;
  }

  // ===== KNOT NODE GEOMETRIES (8 topological shapes) =====
  // Pure geometry extension for sophisticated knot-based nodes
  // Each knot generates a tubular smooth mesh suitable for node rendering

  /**
   * KNOT: Trefoil Knot - PROCESS category
   * Simplest non-trivial knot, 3-fold rotational symmetry
   * Tubular parametric mesh for smooth rendering
   */
  static createKnotTrefoil(group, color) {
    try {
      const tube = this.generateTubularKnot(
        (t) => {
          const st = Math.sin(t);
          const ct = Math.cos(t);
          return [
            Math.sin(t) + 2 * Math.sin(2 * t),
            Math.cos(t) - 2 * Math.cos(2 * t),
            -Math.sin(3 * t)
          ];
        },
        0, Math.PI * 2, 64, 0.25, 8, color,
        { pathScale: 0.3, tubeScale: 0.5 } // halve overall size for integration knots
      );
      group.add(tube);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createKnotTrefoil',
        category: 'process',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * KNOT: Figure-Eight Knot - INTEGRATION category
   * Four-crossing knot with distinctive figure-eight shape
   * Tubular parametric mesh
   */
  static createKnotFigureEight(group, color) {
    try {
      const tube = this.generateTubularKnot(
        (t) => {
          const st = Math.sin(t);
          const ct = Math.cos(t);
          const c2t = Math.cos(2 * t);
          const s2t = Math.sin(2 * t);
          return [
            (2 + c2t) * Math.cos(3 * t),
            (2 + c2t) * Math.sin(3 * t),
            s2t
          ];
        },
        0, Math.PI * 2, 64, 0.22, 8, color,
        { pathScale: 0.3, tubeScale: 0.5 }
      );
      group.add(tube);
      return group;
    } catch (err) {
      console.error('[NodeVisualError]', {
        model: 'createKnotFigureEight',
        error: err
      });
      return null;
    }
  }

  /**
   * KNOT: Triple Helix Knot - ANALYTICS category
   * Three-stranded helical structure with topological twisting
   * Tubular parametric mesh
   */
  static createKnotTripleHelix(group, color) {
    try {
      const tube = this.generateTubularKnot(
        (t) => {
          const ct = Math.cos(t);
          const st = Math.sin(t);
          const rt = 0.5 + 0.3 * Math.cos(3 * t);
          return [
            rt * ct,
            rt * st,
            0.6 * Math.sin(3 * t)
          ];
        },
        0, Math.PI * 2, 72, 0.2, 8, color
      );
      group.add(tube);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createKnotTripleHelix',
        category: 'analytics',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * KNOT: Torus Knot (p,q) - STORAGE category
   * (2,3) torus knot: wraps p times meridian, q times poloidal
   * Tubular parametric mesh
   */
  static createKnotTorusKnot(group, color) {
    try {
      const p = 2;
      const q = 3;
      const tube = this.generateTubularKnot(
        (t) => {
          const angle1 = (q * t);
          const angle2 = (p * t);
          const r = 0.4 + 0.3 * Math.cos(angle1);
          return [
            r * Math.cos(angle2),
            r * Math.sin(angle2),
            0.5 * Math.sin(angle1)
          ];
        },
        0, Math.PI * 2, 80, 0.18, 10, color
      );
      group.add(tube);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createKnotTorusKnot',
        category: 'storage',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * KNOT: Borromean Rings - CONTROL category
   * Three mutually linked rings, topologically inseparable
   * Three interlocked tubular meshes forming singular composite
   */
  static createKnotBorromean(group, color) {
    try {
      const ringRadius = 0.35;
      const tubeRadius = 0.12;
      const sections = 48;
      
      // Create three rings at 120-degree angles
      for (let ringIndex = 0; ringIndex < 3; ringIndex++) {
        const angle = (ringIndex * Math.PI * 2) / 3;
        const cx = Math.cos(angle);
        const sx = Math.sin(angle);
        
        const points = [];
        for (let i = 0; i <= sections; i++) {
          const theta = (i / sections) * Math.PI * 2;
          const x = cx * ringRadius * Math.cos(theta);
          const y = sx * ringRadius * Math.cos(theta);
          const z = ringRadius * Math.sin(theta);
          points.push(new THREE.Vector3(x, y, z));
        }
        
        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, sections, tubeRadius, 6, false);
        const material = new THREE.MeshStandardMaterial({
          transparent: false,
          opacity: 1,
          depthWrite: true,
          depthTest: true,
          side: THREE.FrontSide,
          color: color,
          metalness: 0.7,
          roughness: 0.3,
          emissive: color,
          emissiveIntensity: 0.3

        });
        const mesh = new THREE.Mesh(geometry, material);
        
        // [RAYCAST FIX] Ensure Borromean ring mesh is interactive
        mesh.userData.isInteractive = true;
        mesh.userData.isKnotMesh = true;
        if (mesh.raycast === null || mesh.raycast === undefined) {
          mesh.raycast = THREE.Mesh.prototype.raycast;
        }
        
        group.add(mesh);
      }
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createKnotBorromean',
        category: 'control',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * KNOT: Möbius Knot Loop - ANALYTICS category
   * Single-sided surface with topological twist
   * Tubular parametric mesh following Möbius path
   */
  static createKnotMobius(group, color) {
    try {
      const tube = this.generateTubularKnot(
        (t) => {
          const r = 0.5 + 0.15 * Math.cos(t / 2);
          const angle = t;
          return [
            r * Math.cos(angle),
            r * Math.sin(angle),
            0.3 * Math.cos(t / 2)
          ];
        },
        0, Math.PI * 4, 64, 0.2, 8, color
      );
      group.add(tube);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createKnotMobius',
        category: 'analytics',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * KNOT: Chaotic Knot Core - PROCESS category
   * Self-similar chaotic structure with fractal-like properties
   * Tubular parametric mesh with complex winding
   */
  static createKnotChaotic(group, color) {
    try {
      const tube = this.generateTubularKnot(
        (t) => {
          const s1 = Math.sin(t);
          const c1 = Math.cos(t);
          const s2 = Math.sin(2.1 * t);
          const c2 = Math.cos(1.9 * t);
          return [
            s1 + 0.3 * s2,
            c1 + 0.3 * c2,
            0.4 * Math.sin(3.3 * t)
          ];
        },
        0, Math.PI * 2, 80, 0.19, 8, color
      );
      group.add(tube);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createKnotChaotic',
        category: 'process',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * KNOT: Infinite Self-Intersecting Knot - INTEGRATION category
   * Complex recursive structure with self-similar intersections
   * Tubular parametric mesh with dense winding
   */
  static createKnotInfiniteSelfIntersecting(group, color) {
    try {
      const tube = this.generateTubularKnot(
        (t) => {
          const phases = [t, 1.3 * t, 0.7 * t];
          const r = 0.45 + 0.15 * Math.cos(t);
          const x = r * Math.cos(phases[0]) * (1 + 0.2 * Math.cos(phases[1]));
          const y = r * Math.sin(phases[0]) * (1 + 0.2 * Math.sin(phases[2]));
          const z = 0.35 * Math.sin(2.5 * t);
          return [x, y, z];
        },
        0, Math.PI * 2.5, 96, 0.17, 8, color
      );
      group.add(tube);
      return group;
    } catch (err) {
      console.error('[NodeVisualError]', {
        model: 'createKnotInfiniteSelfIntersecting',
        error: err
      });
      return null;
    }
  }

  /**
   * Helper: Generate tubular knot geometry from parametric curve
   * Creates smooth tubular mesh around knot path
   * [RAYCAST FIX] Ensures knot mesh is properly interactive
   */
  static generateTubularKnot(parametricFunc, tStart, tEnd, segments, tubeRadius, tubeSegments, color, options = {}) {
    const pathScale = options.pathScale ?? 0.6;   // default original scale
    const tubeScale = options.tubeScale ?? 1.0;   // default original thickness
    const points = [];
    
    // Generate knot path points
    for (let i = 0; i <= segments; i++) {
      const t = tStart + (tEnd - tStart) * (i / segments);
      const pt = parametricFunc(t);
      points.push(new THREE.Vector3(pt[0] * pathScale, pt[1] * pathScale, pt[2] * pathScale));
    }
    
    // Create curve from points
    const curve = new THREE.CatmullRomCurve3(points);
    
    // Generate tubular geometry
    const geometry = new THREE.TubeGeometry(curve, segments, tubeRadius * tubeScale, tubeSegments, false);
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
      transparent: false,
      opacity: 1,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide,
      color: color,
      metalness: 0.7,
      roughness: 0.3,
      emissive: color,
      emissiveIntensity: 0.3

    });
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    
    // [RAYCAST FIX] Ensure knot mesh is interactive
    // Knot geometry can be complex and may not raycast properly by default
    // We need to explicitly enable raycast on the knot mesh
    mesh.userData.isInteractive = true;
    mesh.userData.isKnotMesh = true;
    
    // Ensure raycast is enabled (don't disable it)
    // By default THREE.Mesh supports raycast, but ensure it's not overridden
    if (mesh.raycast === null || mesh.raycast === undefined) {
      mesh.raycast = THREE.Mesh.prototype.raycast;
    }
    
    return mesh;
  }

  /**
   * Get category-specific color
   * Extended with special categories: quantum, sigma, emotional, mythic, prime, error
   */
  static getCategoryColor(category) {
    const colors = {
      // Standard 6 categories
      'input': 0x00ddff,        // Cyan
      'process': 0xffaa00,      // Amber/Gold
      'integration': 0x00ff88,  // Green
      'analytics': 0xaa00ff,    // Violet
      'storage': 0x88ccff,      // Silver/Pale Blue
      'control': 0xff0088,      // Red/Magenta
      
      // Special multi-output categories
      'quantum': 0x4400ff,      // Indigo - quantum superposition
      'sigma': 0x00ff00,        // Bright Green - dimensional anomaly
      'emotional': 0xff4488,    // Hot Pink - resonant empathy
      
      // Ultra-rare categories
      'mythic': 0xffdd00,       // Gold - ultra-ceremonial
      'prime': 0xc0c0c0,        // Silver - perfect topology
      'error': 0xff3333,        // Red - unstable/chaotic
      
      // Legacy/fallback
      'undefined': 0x00ffff     // Cyan fallback
    };
    
    const key = (category || 'control').toLowerCase().trim();
    return colors[key] || colors['undefined'];
  }

  /**
   * Get category name from color
   */
  static getCategoryFromColor(color) {
    const categories = {
      0x00ddff: 'input',
      0xffaa00: 'process',
      0x00ff88: 'integration',
      0xaa00ff: 'analytics',
      0x88ccff: 'storage',
      0xff0088: 'control'
    };
    return categories[color] || 'input';
  }

  // ===== EXTREME GEOMETRY WRAPPERS =====
  // These wrap EXTREME geometries to integrate them into normal node creation pools
  // Mapping: 
  // INPUT: Hyperbolic Prism, Singularity Knot
  // PROCESS: Quantum Lattice, Fractal Bloom
  // INTEGRATION: Reactive Tesseract, Chaotic Heart
  // STORAGE: Whisper Sphere, Echo Fractal
  // ANALYTICS: Abyssal Shard, Tri-Helix
  // CONTROL: Infinite Spiral, Chrono Ripper

  /**
   * EXTREME variant: Hyperbolic Neural Prism (archetypeId: 0)
   * Maps to INPUT category
   */
  static createExtremeInput0(group, color) {
    try {
      // Create temporary wrapped node for EXTREME generator
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      // Create the EXTREME geometry
      const extremeGroup = this.extremeNodePack.createHyperbolicPrism(tempNode, null);
      if (!extremeGroup) {
        if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
          console.error('[VisualBuildFail]', { archetype: 'extreme-input-0', category: 'input', reason: 'NoMesh' });
        }
        return group;
      }
      
      // Add to our group
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 0;
      
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createExtremeInput0',
        category: 'input',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * EXTREME variant: Singularity Knot (archetypeId: 1)
   * Maps to INPUT category
   */
  static createExtremeInput1(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createSingularityKnot(tempNode, null);
      if (!extremeGroup) {
        if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
          console.error('[VisualBuildFail]', { archetype: 'extreme-input-1', category: 'input', reason: 'NoMesh' });
        }
        return group;
      }
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 1;
      
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createExtremeInput1',
        category: 'input',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * EXTREME variant: Quantum Lattice (archetypeId: 2)
   * Maps to PROCESS category
   */
  static createExtremeProcess0(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createQuantumLattice(tempNode, null);
      if (!extremeGroup) {
        if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
          console.error('[VisualBuildFail]', { archetype: 'extreme-process-0', category: 'process', reason: 'NoMesh' });
        }
        return group;
      }
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 2;
      
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createExtremeProcess0',
        category: 'process',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * EXTREME variant: Fractal Bloom (archetypeId: 3)
   * Maps to PROCESS category
   */
  static createExtremeProcess1(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createFractalBloom(tempNode, null);
      if (!extremeGroup) {
        if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
          console.error('[VisualBuildFail]', { archetype: 'extreme-process-1', category: 'process', reason: 'NoMesh' });
        }
        return group;
      }
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 3;
      
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createExtremeProcess1',
        category: 'process',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * EXTREME variant: Reactive Tesseract (archetypeId: 4)
   * Maps to INTEGRATION category
   */
  static createExtremeIntegration0(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createReactiveTesseract(tempNode, null);
      if (!extremeGroup) {
        if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
          console.error('[VisualBuildFail]', { archetype: 'extreme-integration-0', category: 'integration', reason: 'NoMesh' });
        }
        return group;
      }
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 4;
      
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createExtremeIntegration0',
        category: 'integration',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * EXTREME variant: Chaotic Heart (archetypeId: 5)
   * Maps to INTEGRATION category
   */
  static createExtremeIntegration1(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createChaoticHeart(tempNode, null);
      if (!extremeGroup) {
        if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
          console.error('[VisualBuildFail]', { archetype: 'extreme-integration-1', category: 'integration', reason: 'NoMesh' });
        }
        return group;
      }
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 5;
      
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createExtremeIntegration1',
        category: 'integration',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * EXTREME variant: Whisper Sphere (archetypeId: 6)
   * Maps to STORAGE category
   */
  static createExtremeStorage0(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createWhisperSphere(tempNode, null);
      if (!extremeGroup) {
        if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
          console.error('[VisualBuildFail]', { archetype: 'extreme-storage-0', category: 'storage', reason: 'NoMesh' });
        }
        return group;
      }
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 6;
      
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createExtremeStorage0',
        category: 'storage',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * EXTREME variant: Echo Fractal (archetypeId: 7)
   * Maps to STORAGE category
   */
  static createExtremeStorage1(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createEchoFractal(tempNode, null);
      if (!extremeGroup) {
        if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
          console.error('[VisualBuildFail]', { archetype: 'extreme-storage-1', category: 'storage', reason: 'NoMesh' });
        }
        return group;
      }
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 7;
      
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createExtremeStorage1',
        category: 'storage',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * EXTREME variant: Abyssal Shard (archetypeId: 8)
   * Maps to ANALYTICS category
   */
  static createExtremeAnalytics0(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createAbyssalShard(tempNode, null);
      if (!extremeGroup) {
        if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
          console.error('[VisualBuildFail]', { archetype: 'extreme-analytics-0', category: 'analytics', reason: 'NoMesh' });
        }
        return group;
      }
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 8;
      
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createExtremeAnalytics0',
        category: 'analytics',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * EXTREME variant: Tri-Helix (archetypeId: 9)
   * Maps to ANALYTICS category
   */
  static createExtremeAnalytics1(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createTriHelix(tempNode, null);
      if (!extremeGroup) {
        console.error('[VisualBuildFail]', { archetype: 'extreme-analytics-1', category: 'analytics', reason: 'NoMesh' });
        return group;
      }
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 9;
      
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createExtremeAnalytics1',
        category: 'analytics',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * EXTREME variant: Infinite Spiral (archetypeId: 10)
   * Maps to CONTROL category
   */
  static createExtremeControl0(group, color) {
    try {
      const colorHex = new THREE.Color(color).getHex();
      if (!CONTROL_EXTREME_608_CACHE.coreGeometry) {
        CONTROL_EXTREME_608_CACHE.coreGeometry = new THREE.OctahedronGeometry(0.17, 2);
        CONTROL_EXTREME_608_CACHE.innerCubeGeometry = new THREE.BoxGeometry(0.92, 0.92, 0.92);
        CONTROL_EXTREME_608_CACHE.outerCubeGeometry = new THREE.BoxGeometry(1.28, 1.28, 1.28);
        CONTROL_EXTREME_608_CACHE.edgesInnerGeometry = safeCreateEdgesGeometry(CONTROL_EXTREME_608_CACHE.innerCubeGeometry, 12);
        CONTROL_EXTREME_608_CACHE.edgesOuterGeometry = safeCreateEdgesGeometry(CONTROL_EXTREME_608_CACHE.outerCubeGeometry, 12);
        CONTROL_EXTREME_608_CACHE.anchorGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.12);
        CONTROL_EXTREME_608_CACHE.pulsePlaneGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
        CONTROL_EXTREME_608_CACHE.auraCubeGeometry = new THREE.BoxGeometry(1.62, 1.62, 1.62);
        CONTROL_EXTREME_608_CACHE.scanCubeGeometry = new THREE.BoxGeometry(1.36, 1.36, 1.36);
      }

      let mats = CONTROL_EXTREME_608_MATERIALS.get(colorHex);
      if (!mats) {
        mats = {
          coreMat: new THREE.MeshStandardMaterial({
            color: 0xd8fbff,
            emissive: 0xb8f4ff,
            emissiveIntensity: 0.95,
            metalness: 0.15,
            roughness: 0.25,
            transparent: false,
            opacity: 1.0,
            depthWrite: true,
            depthTest: true
          }),
          cageWireMat: new THREE.MeshBasicMaterial({
            color: colorHex,
            wireframe: true,
            transparent: true,
            opacity: 0.2,
            depthWrite: false,
            depthTest: true
          }),
          cageEdgeMat: new THREE.LineBasicMaterial({
            color: 0xc9f7ff,
            transparent: true,
            opacity: 0.72,
            depthWrite: false,
            depthTest: true
          }),
          anchorMat: new THREE.MeshStandardMaterial({
            color: colorHex,
            emissive: colorHex,
            emissiveIntensity: 0.42,
            metalness: 0.62,
            roughness: 0.26,
            transparent: false,
            depthWrite: true,
            depthTest: true
          }),
          pulseMat: new THREE.MeshBasicMaterial({
            color: 0xd9ffff,
            transparent: true,
            opacity: 0.26,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide
          }),
          auraMat: new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.08,
            depthWrite: false,
            depthTest: true,
            side: THREE.BackSide
          }),
          scanMat: new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide,
            uniforms: {
              uTime: { value: 0 },
              uColor: { value: new THREE.Color(0xcffbff) },
              uOpacity: { value: 0.07 }
            },
            vertexShader: `
              varying vec3 vPos;
              void main() {
                vPos = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform float uTime;
              uniform vec3 uColor;
              uniform float uOpacity;
              varying vec3 vPos;
              void main() {
                float scan = step(0.62, fract((vPos.y * 5.0) + uTime * 0.95));
                float alpha = uOpacity * (0.35 + scan * 0.65);
                gl_FragColor = vec4(uColor, alpha);
              }
            `
          })
        };
        CONTROL_EXTREME_608_MATERIALS.set(colorHex, mats);
      }

      const root = new THREE.Group();
      root.name = 'CONTROL_EXTREME_608_SOVEREIGN_CORE';
      root.userData.visualVariant = 'CONTROL_608_SOVEREIGN';
      root.userData.nodeGeometryName = 'CONTROL_SOVEREIGN_CORE_608';

      const core = new THREE.Mesh(CONTROL_EXTREME_608_CACHE.coreGeometry, mats.coreMat);
      core.name = 'SovereignCore';
      core.userData.isCore = true;
      validateMeshGeometry(core, 'createExtremeControl0:core');
      root.add(core);

      const innerCube = new THREE.Mesh(CONTROL_EXTREME_608_CACHE.innerCubeGeometry, mats.cageWireMat);
      innerCube.name = 'InnerCubeCage';
      innerCube.rotation.set(0.2, 0.4, 0.1);
      root.add(innerCube);
      const innerEdges = new THREE.LineSegments(CONTROL_EXTREME_608_CACHE.edgesInnerGeometry, mats.cageEdgeMat);
      innerEdges.name = 'InnerCubeEdges';
      innerEdges.rotation.copy(innerCube.rotation);
      innerEdges.userData.isEdgeCage = true;
      root.add(innerEdges);

      const outerCube = new THREE.Mesh(CONTROL_EXTREME_608_CACHE.outerCubeGeometry, mats.cageWireMat);
      outerCube.name = 'OuterCubeCage';
      outerCube.rotation.set(-0.18, 0.14, -0.22);
      root.add(outerCube);
      const outerEdges = new THREE.LineSegments(CONTROL_EXTREME_608_CACHE.edgesOuterGeometry, mats.cageEdgeMat);
      outerEdges.name = 'OuterCubeEdges';
      outerEdges.rotation.copy(outerCube.rotation);
      outerEdges.userData.isEdgeCage = true;
      root.add(outerEdges);

      const aura = new THREE.Mesh(CONTROL_EXTREME_608_CACHE.auraCubeGeometry, mats.auraMat);
      aura.name = 'CubeAuraField';
      aura.rotation.set(0.1, -0.3, 0.2);
      root.add(aura);

      const scanOverlay = new THREE.Mesh(CONTROL_EXTREME_608_CACHE.scanCubeGeometry, mats.scanMat);
      scanOverlay.name = 'ScanlineOverlay';
      scanOverlay.rotation.set(-0.16, 0.22, -0.12);
      root.add(scanOverlay);

      const pulsePlane = new THREE.Mesh(CONTROL_EXTREME_608_CACHE.pulsePlaneGeometry, mats.pulseMat);
      pulsePlane.name = 'SquarePulsePlane';
      pulsePlane.rotation.x = -Math.PI * 0.5;
      pulsePlane.position.y = -0.02;
      pulsePlane.scale.setScalar(0.45);
      root.add(pulsePlane);

      const anchorGroup = new THREE.Group();
      anchorGroup.name = 'AnchorNodes';
      const anchorCount = 6;
      const anchorPaths = [];
      for (let i = 0; i < anchorCount; i++) {
        const phase = (i / anchorCount) * Math.PI * 2;
        const path = [
          new THREE.Vector3(Math.cos(phase) * 0.95, 0.14, Math.sin(phase) * 0.95),
          new THREE.Vector3(Math.cos(phase + 0.82) * 0.86, -0.12, Math.sin(phase + 0.82) * 0.86),
          new THREE.Vector3(Math.cos(phase + 1.67) * 1.02, 0.08, Math.sin(phase + 1.67) * 1.02),
          new THREE.Vector3(Math.cos(phase + 2.44) * 0.9, -0.18, Math.sin(phase + 2.44) * 0.9)
        ];
        anchorPaths.push(path);

        const anchor = new THREE.Mesh(CONTROL_EXTREME_608_CACHE.anchorGeometry, mats.anchorMat);
        anchor.name = `Anchor_${i}`;
        anchor.position.copy(path[0]);
        anchor.userData.pathIndex = 0;
        anchor.userData.path = path;
        validateMeshGeometry(anchor, `createExtremeControl0:anchor${i}`);
        anchorGroup.add(anchor);
      }
      root.add(anchorGroup);

      const state = {
        lastTime: 0,
        snapAccum: 0,
        teleportAccum: 0,
        pulseAccum: 0,
        freezeFrames: 0,
        freezeCooldown: 1.6,
        freezeCooldownAccum: 0,
        pulseScale: 0.45
      };

      root.onBeforeRender = () => {
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;
        if (state.lastTime === 0) {
          state.lastTime = now;
          return;
        }
        const dt = Math.min(0.05, now - state.lastTime);
        state.lastTime = now;

        if (state.freezeFrames > 0) {
          state.freezeFrames--;
          mats.scanMat.uniforms.uTime.value = now;
          return;
        }

        state.snapAccum += dt;
        state.teleportAccum += dt;
        state.pulseAccum += dt;
        state.freezeCooldownAccum += dt;

        if (state.snapAccum >= 0.8) {
          state.snapAccum = 0;
          root.rotation.y += Math.PI * 0.5;
          innerCube.rotation.x += 0.14;
          innerCube.rotation.y -= 0.22;
          outerCube.rotation.x -= 0.1;
          outerCube.rotation.y += 0.18;
          innerEdges.rotation.copy(innerCube.rotation);
          outerEdges.rotation.copy(outerCube.rotation);
        }

        if (state.teleportAccum >= 0.42) {
          state.teleportAccum = 0;
          for (let i = 0; i < anchorGroup.children.length; i++) {
            const anchor = anchorGroup.children[i];
            const path = anchor.userData.path;
            const nextIdx = (anchor.userData.pathIndex + 1) % path.length;
            anchor.userData.pathIndex = nextIdx;
            anchor.position.copy(path[nextIdx]);
          }
        }

        if (state.pulseAccum >= 0.9) {
          state.pulseAccum = 0;
          state.pulseScale = 0.45;
          mats.pulseMat.opacity = 0.26;
        } else {
          state.pulseScale = Math.min(2.2, state.pulseScale + dt * 1.45);
          mats.pulseMat.opacity = Math.max(0.04, mats.pulseMat.opacity - dt * 0.24);
        }
        pulsePlane.scale.set(state.pulseScale, state.pulseScale, 1);

        if (state.freezeCooldownAccum >= state.freezeCooldown) {
          if (Math.sin(now * 1.9) > 0.93) {
            state.freezeFrames = (Math.sin(now * 3.7) > 0) ? 2 : 1;
            state.freezeCooldownAccum = 0;
          }
        }

        aura.rotation.y += dt * 0.18;
        aura.rotation.x += dt * 0.06;
        mats.scanMat.uniforms.uTime.value = now;
        core.material.emissiveIntensity = 0.78 + Math.sign(Math.sin(now * 2.4)) * 0.12;
      };

      root.userData.visualCoreImmutable = true;
      root.userData.controlSovereignAnchors = anchorPaths;
      group.add(root);
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createExtremeControl0',
        category: 'control',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * EXTREME variant: Chrono Ripper (archetypeId: 11)
   * Maps to CONTROL category
   */
  static createExtremeControl1(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createChronoRipper(tempNode, null);
      if (!extremeGroup) {
        console.error('[VisualBuildFail]', { archetype: 'extreme-control-1', category: 'control', reason: 'NoMesh' });
        return group;
      }
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 11;
      
      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createExtremeControl1',
        category: 'control',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }
}

if (typeof window !== "undefined") {

  window.EnhancedNodeModels = EnhancedNodeModels;

  // Self-heal on attach
}
