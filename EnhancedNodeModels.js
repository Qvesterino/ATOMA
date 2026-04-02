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
  ringGeometry: null,
  latticeGeometry: null,
  latticePositions: null
};
const PRIME_V2_MATERIALS = new Map(); // keyed by color hex

// MYTHIC v2 caches
const MYTHIC_V2_CACHE = {
  coreGeometry: null,
  edgesGeometry: null,
  ringGeometry: null,
  shardGeometry: null,
  haloGeometry: null,
  runeGeometry: null,
  crownPositions: null
};
const MYTHIC_V2_MATERIALS = new Map(); // keyed by color hex

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
const SIGMA_V2_CACHE = {
  baseGeometry: null,
  edgesGeometry: null,
  ringGeometry: null
};
const SIGMA_V2_MATERIALS = new Map(); // keyed by color hex

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

// Enforce opaque, front-facing core materials for core meshes
function enforceOpaqueCoreMaterial(mat) {
  return mat;
}

// PRIME v2 helpers (geometry/material caches + lattice points)
function _getPrimeV2Geometries() {
  if (!PRIME_V2_CACHE.coreGeometry) {
    PRIME_V2_CACHE.coreGeometry = new THREE.IcosahedronGeometry(0.6, 1);
    PRIME_V2_CACHE.coreGeometry.computeBoundingSphere();
    PRIME_V2_CACHE.edgesGeometry = new THREE.EdgesGeometry(PRIME_V2_CACHE.coreGeometry, 18);
    PRIME_V2_CACHE.ringGeometry = new THREE.TorusGeometry(0.9, 0.05, 12, 64);
    const pinHeight = 0.18;
    const pinRadius = 0.05;
    const pinGeom = new THREE.CylinderGeometry(pinRadius, pinRadius, pinHeight, 6);
    pinGeom.translate(0, pinHeight * 0.5, 0); // lift so base sits at origin
    PRIME_V2_CACHE.latticeGeometry = pinGeom;
  }
  return PRIME_V2_CACHE;
}

function _getPrimeV2Materials(color) {
  const colorHex = typeof color === 'number' ? color : 0xffffff;
  if (PRIME_V2_MATERIALS.has(colorHex)) return PRIME_V2_MATERIALS.get(colorHex);

  const coreMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xc0c0c0),
    emissive: new THREE.Color(0x222222),
    emissiveIntensity: 0.3,
    metalness: 0.9,
    roughness: 0.25,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true
  });

  const edgesMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xffffff),
    transparent: true,
    opacity: 0.6,
    depthWrite: true
  });

  const ringMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xd9d9d9),
    emissive: new THREE.Color(0x111111),
    emissiveIntensity: 0.12,
    metalness: 1.0,
    roughness: 0.2,
    transparent: false,
    opacity: 0.9,
    depthWrite: true,
    depthTest: true,
    blending: THREE.NormalBlending
  });

  const latticeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xbfbfbf),
    emissive: new THREE.Color(0x111111),
    emissiveIntensity: 0.2,
    metalness: 0.7,
    roughness: 0.28,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    depthTest: true,
    blending: THREE.NormalBlending
  });

  const mats = { coreMat, edgesMat, ringMat, latticeMat };
  // Prime v2 must stay depth-occluding (no aura translucency patch mode).
  for (const mat of [coreMat, ringMat, latticeMat]) {
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
    MYTHIC_V2_CACHE.coreGeometry = new THREE.DodecahedronGeometry(0.65, 0);
    MYTHIC_V2_CACHE.coreGeometry.computeBoundingSphere();
    MYTHIC_V2_CACHE.edgesGeometry = new THREE.EdgesGeometry(MYTHIC_V2_CACHE.coreGeometry, 15);
    MYTHIC_V2_CACHE.ringGeometry = new THREE.TorusGeometry(0.95, 0.06, 14, 96);
    const shardGeom = new THREE.TetrahedronGeometry(0.16, 0);
    shardGeom.rotateX(Math.PI / 5);
    shardGeom.translate(0, 0.1, 0);
    MYTHIC_V2_CACHE.shardGeometry = shardGeom;

    const haloPositions = [];
    const haloCount = 80;
    for (let i = 0; i < haloCount; i++) {
      const angle = (i / haloCount) * Math.PI * 2;
      haloPositions.push(Math.cos(angle) * 1.32, Math.sin(angle) * 1.32, 0);
    }
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.Float32BufferAttribute(haloPositions, 3));
    MYTHIC_V2_CACHE.haloGeometry = haloGeometry;

    const runePositions = [];
    const runeCount = 100;
    for (let i = 0; i < runeCount; i++) {
      const a = (i / runeCount) * Math.PI * 2;
      const r = 1.15 + 0.05 * Math.sin(i * 0.7);
      runePositions.push(Math.cos(a) * r, 0.15 * Math.sin(i * 1.1), Math.sin(a) * r);
    }
    const runeGeometry = new THREE.BufferGeometry();
    runeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(runePositions, 3));
    MYTHIC_V2_CACHE.runeGeometry = runeGeometry;
  }
  return MYTHIC_V2_CACHE;
}

function _getMythicV2Materials(color) {
  const colorHex = typeof color === 'number' ? color : 0xffdd00;
  if (MYTHIC_V2_MATERIALS.has(colorHex)) return MYTHIC_V2_MATERIALS.get(colorHex);

  const coreMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.6,
    roughness: 0.18,
    emissive: colorHex,
    emissiveIntensity: 0.4
  });

  const edgesMat = new THREE.LineBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.6,
    depthWrite: true
  });

  const ringMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.45,
    depthWrite: false
  });

  const shardMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.55,
    roughness: 0.12,
    emissive: colorHex,
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0.7,
    depthWrite: false
  });

  const haloMat = new THREE.PointsMaterial({
    color: colorHex,
    size: 0.06,
    transparent: true,
    opacity: 0.65,
    depthWrite: false
  });

  const mats = { coreMat, edgesMat, ringMat, shardMat, haloMat };
  MYTHIC_V2_MATERIALS.set(colorHex, mats);
  return mats;
}

function _getMythicV2CrownPositions(coreGeometry) {
  if (MYTHIC_V2_CACHE.crownPositions) return MYTHIC_V2_CACHE.crownPositions;

  const positions = [];
  const steps = 28;
  const radius = (coreGeometry.boundingSphere?.radius || 0.65) * 1.25;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const tilt = 0.22; // crown height
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = radius * tilt;
    positions.push(new THREE.Vector3(x, y, z));
  }
  MYTHIC_V2_CACHE.crownPositions = positions;
  return positions;
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
   * INPUT: DATA_GATEWAY (NEW - Session 63)
   * Threshold/gateway where data enters the system
   * - Outer ring gateway frame (octagonal, open in center)
   * - Inner float portal with data stream indicators
   * - Flowing segments suggesting direction of data ingestion
   * - Animation: Ring rotation + portal oscillation + segment flow
   * 
   * VISUAL MEANING: "Enter here."
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createInputDataGateway(group, color) {
    try {
      // Create outer octagonal gateway ring frame
      const ringGeometry = new THREE.TorusGeometry(0.65, 0.1, 8, 64);
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
        emissiveIntensity: 0.25

      });

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.userData.isGatewayRing = true;
      ring.userData.visualCoreImmutable = true;
      group.add(ring);

      // Create inner portal (floating icosahedron)
      const portalGeometry = new THREE.IcosahedronGeometry(0.25, 2);
      portalGeometry.scale(0.95, 1.15, 0.9); // Elongated vertically
      
      const portalMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.85,
        roughness: 0.1,
        transmission: 0, // Phase B.3.A: transmission disabled to prevent RenderTransmissionPass
        thickness: 0.35,
        ior: 1.48,
        emissive: color,
        emissiveIntensity: 0.4
      });

      const portal = new THREE.Mesh(portalGeometry, portalMaterial);
      portal.userData.isPortal = true;
      portal.userData.visualCoreImmutable = true;
      group.add(portal);

      // Create flowing data stream segments (7 boxes flowing inward)
      const streamCount = 7;
      const streamMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4
      });

      for (let i = 0; i < streamCount; i++) {
        const segmentGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.08);
        const segment = new THREE.Mesh(segmentGeometry, streamMaterial);
        
        // Position segments flowing inward along Z-axis
        const zPos = 0.8 - (i / streamCount) * 1.2;
        segment.position.z = zPos;
        
        // Add slight rotation for visual interest
        segment.rotation.y = (i / streamCount) * Math.PI / 2;
        segment.rotation.x = Math.sin(i * 0.4) * 0.1;
        
        segment.userData.isStreamSegment = true;
        segment.userData.segmentIndex = i;
        segment.userData.baseZ = zPos;
        segment.userData.visualCoreImmutable = true;
        group.add(segment);
      }

      // Store animation metadata
      group.userData.gatewayRingRotationSpeed = 0.2; // Steady rotation
      group.userData.portalOscillationAmplitude = 0.05; // 5% oscillation
      group.userData.portalOscillationSpeed = 0.8;
      group.userData.streamFlowSpeed = 0.6; // Data stream flow animation
      group.userData.streamCount = streamCount;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INPUT_DATA_GATEWAY';

      return group;
    } catch (err) {
      console.error('[NodeVisualAbort]', {
        model: 'createInputDataGateway',
        category: 'input',
        reason: 'Visual build failed — fallback visuals are forbidden',
        error: err
      });
      return null;
    }
  }

  /**
   * INPUT: INCOMING_FUNNEL (NEW - Session 63)
   * Funnel structure concentrating incoming data/signals
   * - Upper wide opening (capture area)
   * - Progressively narrowing channels
   * - Central concentration point (mesh)
   * - Animation: Slow funnel rotation + gentle width breathing
   * 
   * VISUAL MEANING: "Data flows through here."
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createInputIncomingFunnel(group, color) {
    try {
      // Create funnel shell using custom tapered geometry
      const funnelVertices = new Float32Array([
        // Top ring (wide opening)
        0.55, 0.5, 0.0,      // 0
        0.39, 0.5, 0.39,     // 1
        0.0, 0.5, 0.55,      // 2
        -0.39, 0.5, 0.39,    // 3
        -0.55, 0.5, 0.0,     // 4
        -0.39, 0.5, -0.39,   // 5
        0.0, 0.5, -0.55,     // 6
        0.39, 0.5, -0.39,    // 7
        
        // Middle ring (transition)
        0.32, 0.0, 0.0,      // 8
        0.23, 0.0, 0.23,     // 9
        0.0, 0.0, 0.32,      // 10
        -0.23, 0.0, 0.23,    // 11
        -0.32, 0.0, 0.0,     // 12
        -0.23, 0.0, -0.23,   // 13
        0.0, 0.0, -0.32,     // 14
        0.23, 0.0, -0.23,    // 15
        
        // Bottom point
        0.0, -0.5, 0.0       // 16
      ]);

      const funnelIndices = new Uint16Array([
        // Top surface
        0, 1, 2,
        2, 3, 4,
        4, 5, 6,
        6, 7, 0,
        0, 2, 4,
        4, 6, 0,
        
        // Top to middle ring
        0, 8, 1,
        1, 9, 2,
        2, 10, 3,
        3, 11, 4,
        4, 12, 5,
        5, 13, 6,
        6, 14, 7,
        7, 15, 0,
        1, 8, 9,
        2, 9, 10,
        3, 10, 11,
        4, 11, 12,
        5, 12, 13,
        6, 13, 14,
        7, 14, 15,
        0, 15, 8,
        
        // Middle to bottom (cone formation)
        8, 16, 9,
        9, 16, 10,
        10, 16, 11,
        11, 16, 12,
        12, 16, 13,
        13, 16, 14,
        14, 16, 15,
        15, 16, 8
      ]);

      const funnelGeometry = new THREE.BufferGeometry();
      funnelGeometry.setAttribute('position', new THREE.BufferAttribute(funnelVertices, 3));
      funnelGeometry.setIndex(new THREE.BufferAttribute(funnelIndices, 1));
      funnelGeometry.computeVertexNormals();

      const funnelMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.65,
        roughness: 0.3,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });

      const funnel = new THREE.Mesh(funnelGeometry, funnelMaterial);
      funnel.userData.isFunnelShell = true;
      funnel.userData.visualCoreImmutable = true;

      // Explicit factory wireframe for funnel shell (independent of global edge overlay).
      const funnelWire = new THREE.LineSegments(
        new THREE.EdgesGeometry(funnelGeometry, 8),
        new THREE.LineBasicMaterial({
          color: color,
          transparent: true,
          opacity: 1.9,
          depthWrite: false,
          depthTest: true
        })
      );
      funnelWire.name = 'FunnelShellWire';
      funnelWire.userData.isFactoryCage = true;
      funnelWire.userData.isEdgeCage = true;
      funnelWire.userData.allowNoFrustum = true;
      funnelWire.frustumCulled = false;
      funnel.add(funnelWire);

      group.add(funnel);

      // Create central concentration point (focal core)
      const focalGeometry = new THREE.OctahedronGeometry(0.18, 1);
      focalGeometry.scale(1.0, 0.7, 1.0); // Flatten slightly
      
      const focalMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.85,
        roughness: 0.12,
        transmission: 0, // Phase B.3.A: transmission disabled to prevent RenderTransmissionPass
        thickness: 0.25,
        ior: 1.5,
        emissive: color,
        emissiveIntensity: 0.45
      });

      const focal = new THREE.Mesh(focalGeometry, focalMaterial);
      focal.position.y = -0.35;
      focal.userData.isFocalCore = true;
      focal.userData.visualCoreImmutable = true;
      group.add(focal);

      // Create internal channel guides (subtle rings showing flow path)
      for (let i = 1; i < 4; i++) {
        const guideGeometry = new THREE.TorusGeometry(
          0.55 - (i * 0.12),
          0.03,
          8,
          32
        );
        const guideMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.2
        });
        const guide = new THREE.Mesh(guideGeometry, guideMaterial);
        
        guide.position.y = 0.5 - (i * 0.2);
        guide.userData.isFlowGuide = true;
        guide.userData.visualCoreImmutable = true;
        group.add(guide);
      }

      // Store animation metadata
      group.userData.funnelRotationSpeed = 0.1; // Slow rotation
      group.userData.funnelBreathingAmplitude = 0.03; // ±3% width breathing
      group.userData.funnelBreathingSpeed = 0.5;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'INPUT_INCOMING_FUNNEL';

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
  static createStorageNode3(group, color) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.22,
      metalness: 0.65,
      roughness: 0.25
    });

    // Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.05, 0.2, 10, 1), mat);
    base.position.y = -0.4;
    validateMeshGeometry(base, 'createStorageNode3:base');
    group.add(base);

    // Spine
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.4, 10, 1), mat);
    spine.position.y = 0.35;
    validateMeshGeometry(spine, 'createStorageNode3:spine');
    group.add(spine);

    // Core sphere
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), mat);
    core.position.y = 0.95;
    core.userData.isCore = true;
    validateMeshGeometry(core, 'createStorageNode3:core');
    group.add(core);

    // Orbit frame
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.05, 10, 28), mat);
    ring.position.y = 0.95;
    ring.rotation.x = Math.PI * 0.5;
    ring.rotation.y = Math.PI * 0.18;
    validateMeshGeometry(ring, 'createStorageNode3:ring');
    group.add(ring);

    // Shards (4)
    const shardGeo = new THREE.TetrahedronGeometry(0.25, 0);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const shard = new THREE.Mesh(shardGeo, mat);
      shard.position.set(Math.cos(angle) * 0.8, 0.1 + i * 0.05, Math.sin(angle) * 0.8);
      shard.rotation.y = angle + Math.PI * 0.2;
      shard.userData.isStorageShard = true;
      validateMeshGeometry(shard, `createStorageNode3:shard${i}`);
      group.add(shard);
    }

    group.userData.visualVariant = 'STORAGE_SHARD_V3';
    return group;
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
  static createSigmaNode2(group, color) {
    const nodeKey = group?.userData?.nodeId || group?.userData?.visualCode?.toString() || String(color || 0x00ffff);
    const seedValue = hashString(nodeKey);
    const seed = Math.abs(seedValue) || 1;
    const rng = _mythicSeededRng(seed);
    const sigmaRoot = new THREE.Group();
    sigmaRoot.name = 'SIGMA_ENTROPY_CROWN';
    sigmaRoot.userData.isSigmaLayer = true;

    const matBase = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.2,
      metalness: 0.55,
      roughness: 0.35,
      transparent: true,
      opacity: 0.9
    });

    // Base pedestal
    const baseGeo = new THREE.CylinderGeometry(0.95, 1.0, 0.16, 6, 1);
    const base = new THREE.Mesh(baseGeo, matBase);
    base.position.y = -0.45;
    base.rotation.y = Math.PI * 0.08;
    sigmaRoot.add(base);

    // Spine
    const spineGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 12, 1);
    const spine = new THREE.Mesh(spineGeo, matBase);
    spine.position.y = 0.0;
    spine.rotation.z = -Math.PI * 0.06;
    sigmaRoot.add(spine);

    // Core (collapse material)
    const coreGeo = new THREE.IcosahedronGeometry(0.55, 1);
    const coreMat = createSigmaCollapseMaterial(seed, color);
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.userData.isSigmaCore = true;
    coreMesh.userData.collapseUniforms = coreMat.uniforms;
    coreMesh.position.y = 0.32;
    coreMesh.rotation.y = Math.PI * 0.12;
    sigmaRoot.add(coreMesh);

    // Crossed fractured rings
    const ringGeo = new THREE.TorusGeometry(0.95, 0.06, 10, 26, Math.PI * 1.6);
    const ringA = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.45
    }));
    ringA.position.y = 0.1;
    ringA.rotation.set(Math.PI * 0.08, Math.PI * 0.25, Math.PI * 0.2);
    ringA.userData.isSigmaLayer = true;
    sigmaRoot.add(ringA);

    const ringB = ringA.clone();
    ringB.rotation.set(Math.PI * 0.5, Math.PI * 0.12, -Math.PI * 0.18);
    ringB.position.y = 0.18;
    sigmaRoot.add(ringB);

    // Floating entropy shards (minimal, spiral)
    const shardGroup = new THREE.Group();
    shardGroup.name = 'SigmaEntropyShards';
    const shardGeo = new THREE.TetrahedronGeometry(0.12, 0);
    for (let i = 0; i < 6; i++) {
      const shardMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.5,
        metalness: 0.4,
        roughness: 0.4
      });
      const shard = new THREE.Mesh(shardGeo, shardMat);
      const angle = (i / 6) * Math.PI * 2;
      const dist = 0.9 + rng() * 0.3;
      shard.position.set(Math.cos(angle) * dist, -0.05 + i * 0.1, Math.sin(angle) * dist);
      shard.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      shard.userData.isSigmaShard = true;
      shardGroup.add(shard);
    }
    sigmaRoot.add(shardGroup);

    // Shadow duplicate behind core
    const shadow = coreMesh.clone();
    shadow.position.z -= 0.08;
    shadow.scale.set(1.03, 1.03, 1.03);
    shadow.material = coreMat;
    sigmaRoot.add(shadow);

    group.add(sigmaRoot);
    return group;
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
   * SIGMA: Lattice Conductor (authority lattice)
   */
  static createSigmaLatticeConductor(group, color) {
    const nodeKey = group?.userData?.nodeId || group?.userData?.visualCode?.toString() || String(color || 0x00ffff);
    const seedValue = hashString(nodeKey);
    const seed = Math.abs(seedValue) || 1;
    const rng = _mythicSeededRng(seed);

    const sigmaRoot = new THREE.Group();
    sigmaRoot.name = 'SIGMA_LATTICE_CONDUCTOR';
    sigmaRoot.userData.isSigmaLayer = true;

    const matBase = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.22,
      metalness: 0.55,
      roughness: 0.35,
      transparent: true,
      opacity: 0.9
    });

    // Base square plinth
    const baseGeo = new THREE.BoxGeometry(1.0, 0.16, 1.0);
    const base = new THREE.Mesh(baseGeo, matBase);
    base.position.y = -0.44;
    base.rotation.y = Math.PI * 0.08;
    sigmaRoot.add(base);

    // V-spine
    const spineGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.85, 12, 1);
    const spineLeft = new THREE.Mesh(spineGeo, matBase);
    spineLeft.position.set(-0.15, -0.02, 0);
    spineLeft.rotation.z = Math.PI * 0.18;
    sigmaRoot.add(spineLeft);

    const spineRight = new THREE.Mesh(spineGeo, matBase);
    spineRight.position.set(0.15, -0.02, 0);
    spineRight.rotation.z = -Math.PI * 0.18;
    sigmaRoot.add(spineRight);

    // Core cube (collapse material)
    const coreGeo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
    const coreMat = createSigmaCollapseMaterial(seed, color);
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 0.32;
    core.rotation.y = Math.PI * 0.15;
    core.userData.isSigmaCore = true;
    core.userData.collapseUniforms = coreMat.uniforms;
    sigmaRoot.add(core);

    // Wireframe cube (slightly larger)
    const frameGeo = new THREE.BoxGeometry(0.68, 0.52, 0.68);
    const frameEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(frameGeo),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 })
    );
    frameEdges.position.y = 0.32;
    frameEdges.rotation.y = Math.PI * 0.26;
    sigmaRoot.add(frameEdges);

    // Open arc frame
    const arcGeo = new THREE.TorusGeometry(0.82, 0.05, 10, 24, Math.PI * 1.4);
    const arc = new THREE.Mesh(arcGeo, matBase);
    arc.position.y = 0.12;
    arc.rotation.set(Math.PI * 0.48, Math.PI * 0.2, Math.PI * 0.12);
    arc.userData.isSigmaLayer = true;
    sigmaRoot.add(arc);

    // Anchor studs
    const studGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.16, 8, 1);
    const studs = [
      [-0.42, -0.36, 0.42],
      [0.42, -0.36, -0.42],
      [0.42, -0.36, 0.42]
    ];
    studs.forEach(pos => {
      const stud = new THREE.Mesh(studGeo, matBase);
      stud.position.set(pos[0], pos[1], pos[2]);
      stud.rotation.y = Math.PI * 0.12;
      sigmaRoot.add(stud);
    });

    group.add(sigmaRoot);
    return group;
  }

  /**
   * SIGMA: Bloom Crown (rare crown form)
   */
  static createSigmaBloomCrown(group, color) {
    const nodeKey = group?.userData?.nodeId || group?.userData?.visualCode?.toString() || String(color || 0x00ffff);
    const seedValue = hashString(nodeKey);
    const seed = Math.abs(seedValue) || 1;
    const rng = _mythicSeededRng(seed);

    const sigmaRoot = new THREE.Group();
    sigmaRoot.name = 'SIGMA_BLOOM_CROWN';
    sigmaRoot.userData.isSigmaLayer = true;

    const matBase = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.24,
      metalness: 0.5,
      roughness: 0.3,
      transparent: true,
      opacity: 0.9
    });

    // Base ring
    const baseGeo = new THREE.TorusGeometry(0.9, 0.06, 10, 22, Math.PI * 1.7);
    const base = new THREE.Mesh(baseGeo, matBase);
    base.position.y = -0.4;
    base.rotation.x = Math.PI * 0.5;
    base.rotation.y = Math.PI * 0.1;
    sigmaRoot.add(base);

    // Spine
    const spineGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.75, 12, 1);
    const spine = new THREE.Mesh(spineGeo, matBase);
    spine.position.y = -0.02;
    sigmaRoot.add(spine);

    // Core sphere (collapse material)
    const coreGeo = new THREE.SphereGeometry(0.26, 12, 12);
    const coreMat = createSigmaCollapseMaterial(seed, color);
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 0.3;
    core.userData.isSigmaCore = true;
    core.userData.collapseUniforms = coreMat.uniforms;
    sigmaRoot.add(core);

    // Petal fins (6)
    const petalGeo = new THREE.BoxGeometry(0.16, 0.55, 0.08);
    for (let i = 0; i < 6; i++) {
      const petal = new THREE.Mesh(petalGeo, matBase);
      const angle = (i / 6) * Math.PI * 2;
      petal.position.set(Math.cos(angle) * 0.7, 0.0 + i * 0.02, Math.sin(angle) * 0.7);
      petal.rotation.y = angle + Math.PI * 0.22;
      petal.rotation.z = Math.PI * 0.18;
      sigmaRoot.add(petal);
    }

    // Inner halo ring
    const haloGeo = new THREE.TorusGeometry(0.45, 0.03, 8, 18);
    const halo = new THREE.Mesh(haloGeo, matBase);
    halo.position.y = 0.18;
    halo.rotation.x = Math.PI * 0.5;
    halo.rotation.y = Math.PI * 0.18;
    sigmaRoot.add(halo);

    // Top beacon
    const beaconGeo = new THREE.ConeGeometry(0.14, 0.18, 10, 1);
    const beacon = new THREE.Mesh(beaconGeo, matBase);
    beacon.position.y = 0.65;
    sigmaRoot.add(beacon);

    group.add(sigmaRoot);
    return group;
  }

  // ===== QUANTUM CUSTOM VARIANTS (registry 701-703) =====

  /**
   * QUANTUM: Bloom (rare crown-like bloom)
   */
  static createQuantumBloomNode(group, color) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.55,
      metalness: 0.6,
      roughness: 0.25
    });

    const baseGeo = new THREE.CylinderGeometry(0.9, 1.0, 0.12, 10, 1);
    const base = new THREE.Mesh(baseGeo, mat);
    base.position.y = -0.3;
    base.rotation.y = Math.PI * 0.1;
    validateMeshGeometry(base, 'createQuantumBloomNode:base');
    group.add(base);

    const spineGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 10, 1);
    const spine = new THREE.Mesh(spineGeo, mat);
    spine.position.y = 0.1;
    validateMeshGeometry(spine, 'createQuantumBloomNode:spine');
    group.add(spine);

    const coreGeo = new THREE.DodecahedronGeometry(0.35, 0);
    const core = new THREE.Mesh(coreGeo, mat);
    core.position.y = 0.45;
    core.rotation.y = Math.PI * 0.2;
    core.userData.isCore = true;
    validateMeshGeometry(core, 'createQuantumBloomNode:core');
    group.add(core);

    const petalGeo = new THREE.BoxGeometry(0.18, 0.6, 0.08);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, mat);
      petal.position.set(Math.cos(angle) * 0.75, 0.05 + i * 0.05, Math.sin(angle) * 0.75);
      petal.rotation.y = angle + Math.PI * 0.25;
      petal.rotation.z = Math.PI * 0.18;
      validateMeshGeometry(petal, `createQuantumBloomNode:petal${i}`);
      group.add(petal);
    }

    const ringGeo = new THREE.TorusGeometry(0.42, 0.03, 8, 18);
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.position.y = 0.28;
    ring.rotation.x = Math.PI * 0.5;
    ring.rotation.y = Math.PI * 0.18;
    validateMeshGeometry(ring, 'createQuantumBloomNode:ring');
    group.add(ring);

    group.userData.visualReady = true;
    return group;
  }

  /**
   * QUANTUM: Lattice (reuses extreme lattice archetype)
   */
  static createQuantumLattice(group, color) {
    try {
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();

      const extremeGroup = this.extremeNodePack.createQuantumLattice(tempNode, null);
      if (!extremeGroup) {
        if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
          console.error('[VisualBuildFail]', { archetype: 'quantum-lattice', category: 'quantum', reason: 'NoMesh' });
        }
        return group;
      }

      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 2;
      group.userData.visualReady = true;
      return group;
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
   * QUANTUM: Lotus (petal crown)
   */
  static createQuantumLotus(group, color) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.5,
      metalness: 0.55,
      roughness: 0.3
    });

    const baseGeo = new THREE.TorusGeometry(0.72, 0.05, 8, 20, Math.PI * 1.8);
    const base = new THREE.Mesh(baseGeo, mat);
    base.rotation.x = Math.PI * 0.5;
    base.rotation.y = Math.PI * 0.12;
    base.position.y = -0.28;
    validateMeshGeometry(base, 'createQuantumLotus:base');
    group.add(base);

    const spineGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 10, 1);
    const spine = new THREE.Mesh(spineGeo, mat);
    spine.position.y = 0.05;
    validateMeshGeometry(spine, 'createQuantumLotus:spine');
    group.add(spine);

    const petalGeo = new THREE.BoxGeometry(0.18, 0.6, 0.12);
    for (let p = 0; p < 6; p++) {
      const angle = (p / 6) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, mat);
      petal.position.set(Math.cos(angle) * 0.55, 0.12, Math.sin(angle) * 0.55);
      petal.rotation.y = angle + Math.PI * 0.2;
      petal.rotation.z = Math.PI * 0.18;
      validateMeshGeometry(petal, `createQuantumLotus:petal${p}`);
      group.add(petal);
    }

    const haloGeo = new THREE.TorusGeometry(0.32, 0.025, 8, 18);
    const halo = new THREE.Mesh(haloGeo, mat);
    halo.position.y = 0.28;
    halo.rotation.x = Math.PI * 0.5;
    validateMeshGeometry(halo, 'createQuantumLotus:halo');
    group.add(halo);

    const coreGeo = new THREE.OctahedronGeometry(0.22, 1);
    const core = new THREE.Mesh(coreGeo, mat);
    core.position.y = 0.34;
    core.userData.isCore = true;
    validateMeshGeometry(core, 'createQuantumLotus:core');
    group.add(core);

    group.userData.visualReady = true;
    return group;
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
    return this._createMythicGeometry(group, CanonicalGeometryFamilies.createMythicShardCluster, 'ShardCluster');
  }

  static createMythicBrokenMonolithNode(group, visualCode, color) {
    return this._createMythicGeometry(group, CanonicalGeometryFamilies.createMythicBrokenMonolith, 'BrokenMonolith');
  }

  static createMythicFloatingFragmentsNode(group, visualCode, color) {
    return this._createMythicGeometry(group, CanonicalGeometryFamilies.createMythicFloatingFragments, 'FloatingFragments');
  }

  static createMythicCrackedPrismNode(group, visualCode, color) {
    return this._createMythicGeometry(group, CanonicalGeometryFamilies.createMythicCrackedPrism, 'CrackedPrism');
  }

  static createMythicAncientCoreWithMissingNode(group, visualCode, color) {
    return this._createMythicGeometry(group, CanonicalGeometryFamilies.createMythicAncientCoreWithMissing, 'AncientCoreWithMissing');
  }

  static createMythicCollapsedCrownNode(group, visualCode, color) {
    return this._createMythicGeometry(group, CanonicalGeometryFamilies.createMythicCollapsedCrown, 'CollapsedCrown');
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
      mythicRoot.userData.visualVariant = 'MYTHIC_V2';

      // CORE
      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';
      const coreMesh = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      coreMesh.name = 'CoreMesh';
      
      // Ensure core is solid depth occluder
      coreMesh.material.transparent = false;
      coreMesh.material.opacity = 1.0;
      coreMesh.material.depthWrite = true;
      coreMesh.material.depthTest = true;
      coreMesh.material.blending = THREE.NormalBlending;
      
      // Render core BEFORE aura and effects
      coreMesh.renderOrder = 2;
      coreMesh.material.transparent = false;
      coreMesh.material.depthWrite = true;
      coreMesh.material.depthTest = true;
      coreMesh.material.blending = THREE.NormalBlending;
      
      const coreEdges = new THREE.LineSegments(geometries.edgesGeometry, materials.edgesMat);
      coreEdges.name = 'CoreEdges';
      coreGroup.add(coreMesh);
      coreGroup.add(coreEdges);
      mythicRoot.add(coreGroup);

      // RELIC
      const relicGroup = new THREE.Group();
      relicGroup.name = 'RELIC_GROUP';

      const glyphRing = new THREE.Mesh(geometries.ringGeometry, materials.ringMat);
      glyphRing.name = 'GlyphRing';
      glyphRing.scale.setScalar(1.08);
      relicGroup.add(glyphRing);

      const crownPositions = _getMythicV2CrownPositions(geometries.coreGeometry);
      const shardCount = crownPositions.length;
      const crown = new THREE.InstancedMesh(geometries.shardGeometry, materials.shardMat, shardCount);
      crown.name = 'CrownShards';
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
        const scale = 0.85 + rng() * 0.4;
        scratch.scale.setScalar(scale);
        scratch.updateMatrix();
        crown.setMatrixAt(i, scratch.matrix);
      });
      crown.instanceMatrix.needsUpdate = true;
      relicGroup.add(crown);

      // Floating runes (points cloud)
      const runes = new THREE.Points(geometries.runeGeometry, materials.haloMat);
      runes.name = 'FloatingRunes';
      runes.frustumCulled = false;
      relicGroup.add(runes);

      mythicRoot.add(relicGroup);

      // AURA
      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';

      const halo = new THREE.Points(geometries.haloGeometry, materials.haloMat);
      halo.name = 'HaloPoints';
      halo.frustumCulled = false;
      auraGroup.add(halo);

      const shell1 = createNodeHologramShell(coreMesh);
      if (shell1) {
        shell1.name = 'MythicShell_1';
        shell1.scale.setScalar(1.10);
        shell1.frustumCulled = false;
        shell1.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
        auraGroup.add(shell1);
      }
      const shell2 = createNodeHologramShell(coreMesh);
      if (shell2) {
        shell2.name = 'MythicShell_2';
        shell2.scale.setScalar(1.18);
        shell2.frustumCulled = false;
        shell2.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
        auraGroup.add(shell2);
      }

      const edgeShell = createNodeNeonEdgeGlowShell(coreMesh);
      if (edgeShell) {
        edgeShell.name = 'MythicEdgeGlow';
        edgeShell.frustumCulled = false;
        edgeShell.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
        auraGroup.add(edgeShell);
      }

      mythicRoot.add(auraGroup);

      mythicRoot.userData.visualReady = true;
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
   * PRIME v2 visual pipeline (structure-only, no spawn changes)
   * Hierarchy:
   * PRIME_NODE
   *   - CORE_GROUP (core mesh + edge lines)
   *   - STRUCTURE_GROUP (orbit rings + lattice instanced pins)
   *   - AURA_GROUP (dual hologram shells)
   */
  static createPrimeNodeStyled_v2(group, index, color) {
    try {
      const geometries = _getPrimeV2Geometries();
      const materials = _getPrimeV2Materials(color);
      const coreMatLocal = materials.coreMat.clone();
      const ringMatLocal = materials.ringMat.clone();
      const latticeMatLocal = materials.latticeMat.clone();
      coreMatLocal.userData = { ...(coreMatLocal.userData || {}), wavePatchMode: 'DEFAULT' };
      ringMatLocal.userData = { ...(ringMatLocal.userData || {}), wavePatchMode: 'DEFAULT' };
      latticeMatLocal.userData = { ...(latticeMatLocal.userData || {}), wavePatchMode: 'DEFAULT' };
      const primeRoot = new THREE.Group();
      primeRoot.name = 'PRIME_NODE';
      primeRoot.userData.visualVariant = 'PRIME_V2';

      // CORE
      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';
      const coreMesh = new THREE.Mesh(geometries.coreGeometry, coreMatLocal);
      coreMesh.name = 'PrimeCore';
      coreMesh.userData.ignoreWaveColor = true;
      
      // Ensure core is solid depth occluder
      coreMesh.material.transparent = false;
      coreMesh.material.opacity = 1.0;
      coreMesh.material.depthWrite = true;
      coreMesh.material.depthTest = true;
      coreMesh.material.blending = THREE.NormalBlending;
      coreMesh.material.side = THREE.FrontSide;
      
      // Render core BEFORE aura and effects
      coreMesh.renderOrder = 3;
      
      const coreEdges = new THREE.LineSegments(geometries.edgesGeometry, materials.edgesMat);
      coreEdges.name = 'CoreEdges';
      coreEdges.renderOrder = 4;
      coreEdges.material.depthTest = true;
      coreEdges.material.depthWrite = false;
      coreGroup.add(coreMesh);
      coreGroup.add(coreEdges);
      primeRoot.add(coreGroup);

      // STRUCTURE
      const structureGroup = new THREE.Group();
      structureGroup.name = 'STRUCTURE_GROUP';

      const ringA = new THREE.Mesh(geometries.ringGeometry, ringMatLocal);
      ringA.name = 'OrbitRing_A';
      ringA.rotation.set(0, 0, 0);
      ringA.renderOrder = 1;
      ringA.material.transparent = false;
      ringA.material.opacity = 0.9;
      ringA.material.depthWrite = true;
      ringA.material.depthTest = true;
      ringA.material.blending = THREE.NormalBlending;
      ringA.material.side = THREE.FrontSide;
      structureGroup.add(ringA);

      const ringB = new THREE.Mesh(geometries.ringGeometry, ringMatLocal.clone());
      ringB.name = 'OrbitRing_B';
      ringB.rotation.x = THREE.MathUtils.degToRad(35);
      ringB.rotation.z = THREE.MathUtils.degToRad(20);
      ringB.scale.setScalar(1.08);
      ringB.renderOrder = 1;
      ringB.material.transparent = false;
      ringB.material.opacity = 0.9;
      ringB.material.depthWrite = true;
      ringB.material.depthTest = true;
      ringB.material.blending = THREE.NormalBlending;
      ringB.material.side = THREE.FrontSide;
      structureGroup.add(ringB);

      const latticePositions = _getPrimeV2LatticePositions(geometries.coreGeometry);
      const latticeCount = Math.max(0, latticePositions.length);
      const lattice = new THREE.InstancedMesh(geometries.latticeGeometry, latticeMatLocal, latticeCount);
      lattice.name = 'LatticeInstances';
      lattice.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      lattice.renderOrder = 2;
      lattice.material.transparent = false;
      lattice.material.depthWrite = true;
      lattice.material.depthTest = true;
      lattice.material.blending = THREE.NormalBlending;

      const up = new THREE.Vector3(0, 1, 0);
      const scratch = new THREE.Object3D();
      latticePositions.forEach((pos, i) => {
        scratch.position.copy(pos);
        scratch.quaternion.setFromUnitVectors(up, pos.clone().normalize());
        scratch.scale.setScalar(1.0);
        scratch.updateMatrix();
        lattice.setMatrixAt(i, scratch.matrix);
      });
      lattice.instanceMatrix.needsUpdate = true;
      structureGroup.add(lattice);

      primeRoot.add(structureGroup);

      // AURA
      const auraGroup = new THREE.Group();
      auraGroup.name = 'AURA_GROUP';
      const shell1 = createNodeHologramShell(coreMesh, 0xc0c0c0);
      if (shell1) {
        shell1.name = 'PrimeShell_1';
        shell1.scale.setScalar(1.08);
        shell1.frustumCulled = false;
        shell1.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
        if (shell1.material) {
          shell1.material.depthTest = true;
          shell1.material.depthWrite = false;
          shell1.material.blending = THREE.NormalBlending;
          if (shell1.material.uniforms?.uOpacity) {
            shell1.material.uniforms.uOpacity.value = 0.06;
          }
        }
        auraGroup.add(shell1);
      }
      const shell2 = createNodeHologramShell(coreMesh, 0xc0c0c0);
      if (shell2) {
        shell2.name = 'PrimeShell_2';
        shell2.scale.setScalar(1.14);
        shell2.frustumCulled = false;
        shell2.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
        if (shell2.material) {
          shell2.material.depthTest = true;
          shell2.material.depthWrite = false;
          shell2.material.blending = THREE.NormalBlending;
          if (shell2.material.uniforms?.uOpacity) {
            shell2.material.uniforms.uOpacity.value = 0.045;
          }
        }
        auraGroup.add(shell2);
      }

      const edgeShell = createNodeNeonEdgeGlowShell(coreMesh);
      if (edgeShell) {
        edgeShell.name = 'PrimeEdgeGlow';
        edgeShell.frustumCulled = false;
        edgeShell.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
        auraGroup.add(edgeShell);
      }
      primeRoot.add(auraGroup);

      primeRoot.userData.visualReady = true;
      primeRoot.scale.setScalar(0.75);
      group.add(primeRoot);
      return group;
    } catch (err) {
      console.error('[PrimeV2Abort]', { reason: err?.message || err });
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
    return this._createPrimeGeometry(CanonicalGeometryFamilies.createPrimeNestedIcosahedron, 'NestedIcosahedron');
  }

  static createPrimePerfectDodecahedronNode(group, visualCode, color) {
    return this._createPrimeGeometry(CanonicalGeometryFamilies.createPrimePerfectDodecahedron, 'PerfectDodecahedron');
  }

  static createPrimeStellaOctangulaNode(group, visualCode, color) {
    return this._createPrimeGeometry(CanonicalGeometryFamilies.createPrimeStellaOctangula, 'StellaOctangula');
  }

  static createPrimePrecisionLatticeNode(group, visualCode, color) {
    return this._createPrimeGeometry(CanonicalGeometryFamilies.createPrimePrecisionLattice, 'PrecisionLattice');
  }

  static createPrimeTesseractProjectionNode(group, visualCode, color) {
    return this._createPrimeGeometry(CanonicalGeometryFamilies.createPrimeTesseractProjection, 'TesseractProjection');
  }

  static createPrimeSymmetryLockedCoreNode(group, visualCode, color) {
    return this._createPrimeGeometry(CanonicalGeometryFamilies.createPrimeSymmetryLockedCore, 'SymmetryLockedCore');
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
      // Ring rotation
      const ring = nodeGroup.children.find(c => c.userData && c.userData.isGatewayRing);
      if (ring) {
        ring.rotation.z += deltaTime * nodeGroup.userData.gatewayRingRotationSpeed;
      }
      
      // Portal oscillation (up/down bobbing)
      const portal = nodeGroup.children.find(c => c.userData && c.userData.isPortal);
      if (portal) {
        const oscillation = Math.sin(time * nodeGroup.userData.portalOscillationSpeed) * nodeGroup.userData.portalOscillationAmplitude;
        portal.position.y = oscillation;
      }
      
      // Stream flow animation (segments flowing inward)
      nodeGroup.children.forEach(child => {
        if (child.userData && child.userData.isStreamSegment) {
          const baseZ = child.userData.baseZ;
          const flowOffset = (time * nodeGroup.userData.streamFlowSpeed + child.userData.segmentIndex * 0.3) % 1.2;
          child.position.z = 0.8 - flowOffset;
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
