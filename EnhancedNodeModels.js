import * as THREE from 'three';
import { ExtremeAINodePack } from './_ExtremeAINodePack.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { createCoreIdentityMaterial, createNodeHologramShell } from './CoreHologramShader.js';
import { CanonicalGeometryFamilies } from './CanonicalGeometryFamilies_v1.js';
import { AnalyticsEnhancedVariants } from './AnalyticsEnhancedVariants_Session81.js';
import { StorageEnhancedVariants } from './StorageEnhancedVariants_Session81.js';
import { ProcessEnhancedVariants } from './ProcessEnhancedVariants_Session81.js';
import { IntegrationEnhancedVariants } from './IntegrationEnhancedVariants_Session110.js';
import { ControlEnhancedVariants } from './ControlEnhancedVariants_Session83.js';
import { ControlSpineVariants } from './ControlSpineVariants_Session100.js';
import { InputSensoryEnhanced } from './InputSensoryEnhanced_Session111.js';
import { ControlNodeSpecialGovernors } from './ControlNodeSpecialGoverners_Session114.js';
import { StorageNodesVisual } from './StorageNodesVisual_Session116.js';
import { AINodeModel } from './AINodeModel.js';
import { NODE_VISUAL_REGISTRY, CATEGORY_POOLS } from './NodeVisualRegistry.js';


const FORBIDDEN_CANONICAL_GEOMETRIES = new Set([
  'SphereGeometry',
  'IcosahedronGeometry',
  'RingGeometry',
  'CircleGeometry',
  'TorusGeometry'
]);

// PRIME visual toggle (v2 pipeline)
const USE_PRIME_V2 = true;

// PRIME v2 shared caches (geometries/materials/positions)
const PRIME_V2_CACHE = {
  coreGeometry: null,
  edgesGeometry: null,
  ringGeometry: null,
  latticeGeometry: null,
  latticePositions: null
};
const PRIME_V2_MATERIALS = new Map(); // keyed by color hex

// MYTHIC visual toggle (v2 pipeline)
const USE_MYTHIC_V2 = true;

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

// ERROR visual toggle (v2 pipeline)
const USE_ERROR_V2 = true;

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

// STORAGE visual toggle (v2 pipeline)
const USE_STORAGE_V2 = true;

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

// INPUT visual toggle (v2 pipeline)
const USE_INPUT_V2 = true;

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

// CONTROL visual toggle (v2 pipeline)
const USE_CONTROL_V2 = true;
const USE_CONTROL_V2_LEGACY = false;

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

// ANALYTICS visual toggle (v2 pipeline)
const USE_ANALYTICS_V2 = true;

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

  // QUANTUM visual toggle (v2 pipeline) - HARD LOCKED TO V2
  const USE_QUANTUM_V2 = true;
  const USE_SIGMA_V2 = true;

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

// EMOTIONAL visual toggle (v2 pipeline)
const USE_EMOTIONAL_V2 = true;

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
    color: colorHex,
    metalness: 0.7,
    roughness: 0.2,
    emissive: colorHex,
    emissiveIntensity: 0.35
  });

  const edgesMat = new THREE.LineBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.55,
    depthWrite: true
  });

  const ringMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.4,
    depthWrite: false
  });

  const latticeMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.5,
    roughness: 0.1,
    emissive: colorHex,
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: 0.65,
    depthWrite: false
  });

  const mats = { coreMat, edgesMat, ringMat, latticeMat };
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

function createVortexMaterial(seedValue, baseColor = 0x00eaff) {
  return new THREE.ShaderMaterial({
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
}

function createControlFractureMaterial(seedValue, baseColor = 0xff2244) {
  return new THREE.ShaderMaterial({
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
}

function createSigmaCollapseMaterial(seedValue, baseColor = 0xff2244) {
  return new THREE.ShaderMaterial({
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
    CONTROL_V2_CACHE.coreEdgesGeometry = new THREE.EdgesGeometry(CONTROL_V2_CACHE.coreGeometry, 10);
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
function _getControlV2Geometries_Legacy() {
  if (!CONTROL_V2_LEGACY_CACHE.coreGeometry) {
    CONTROL_V2_LEGACY_CACHE.coreGeometry = new THREE.IcosahedronGeometry(0.55, 1);
    CONTROL_V2_LEGACY_CACHE.coreGeometry.computeBoundingSphere();
    CONTROL_V2_LEGACY_CACHE.coreEdgesGeometry = new THREE.EdgesGeometry(CONTROL_V2_LEGACY_CACHE.coreGeometry, 12);
    CONTROL_V2_LEGACY_CACHE.ringGeometry = new THREE.TorusGeometry(0.9, 0.06, 12, 96);
    CONTROL_V2_LEGACY_CACHE.satGeometry = new THREE.BoxGeometry(0.18, 0.12, 0.22);

    const cageGeom = new THREE.IcosahedronGeometry(1.05, 0);
    CONTROL_V2_LEGACY_CACHE.cageGeometry = cageGeom;
    CONTROL_V2_LEGACY_CACHE.cageEdgesGeometry = new THREE.EdgesGeometry(cageGeom, 10);

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

  const mats = { coreMat, edgeMat, ringMat };
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
  // Master registry for discovery/debug (not used for weighting)
  static _ALL_NODE_FACTORIES = {
    input: [],
    process: [],
    integration: [],
    storage: [],
    analytics: [],
    control: [],
    quantum: [],
    sigma: [],
    mythic: [],
    prime: [],
    error: [],
    emotional: []
  };
  static __EXTRA_FACTORIES = {
    // Legacy AINodeModel visuals made reachable via pools
    input: [AINodeModel.createCoreNode.bind(AINodeModel)],
    process: [AINodeModel.createLogicNode.bind(AINodeModel)],
    integration: [AINodeModel.createNeuralNode.bind(AINodeModel)],
    storage: [AINodeModel.createMemoryNode.bind(AINodeModel)],
    analytics: [AINodeModel.createDataNode.bind(AINodeModel)],
    control: [],
    quantum: [],
    sigma: [],
    mythic: [],
    prime: [],
    error: [],
    emotional: []
  };
  static _ensureRegistry(category, variantList) {
    const reg = EnhancedNodeModels._ALL_NODE_FACTORIES?.[category];
    if (!reg || !Array.isArray(variantList)) return;
    for (const fn of variantList) {
      if (typeof fn !== 'function') continue;
      if (!reg.includes(fn)) reg.push(fn);
    }
  }

  static _isRegistryValid() {
    const reg = this._ALL_NODE_FACTORIES;
    if (!reg || typeof reg !== 'object') return false;

    // at least one category must have factories
    return Object.values(reg).some(arr => Array.isArray(arr) && arr.length > 0);
  }

  static ensureRegistryReady() {
    if (!THREE || !THREE.Group) {
      if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
        console.error('[VisualBuildFail]', { archetype: 'registry', category: 'all', reason: 'SafeModeNoTHREE' });
      }
      return false;
    }
    if (this._isRegistryValid()) return true; // already OK

    if (this._registryInitialized === true) {
      if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
        console.error('[VisualBuildFail]', { archetype: 'registry', category: 'all', reason: 'RegistryInvalidLate' });
      }
      return false;
    }

    console.warn("[EnhancedNodeModels] Registry invalid → rebuilding");

    try {
      this._registerAllFactories();
      this._registryInitialized = true;
    } catch (e) {
      console.error("[EnhancedNodeModels] Registry rebuild failed", e);
      return false;
    }

    return this._isRegistryValid();
  }
  

  static _registerAllFactories() {

    // Always recreate registry container (safe + deterministic)
    this._ALL_NODE_FACTORIES = {
      input: [],
      process: [],
      integration: [],
      storage: [],
      analytics: [],
      control: [],
      quantum: [],
      sigma: [],
      mythic: [],
      prime: [],
      error: [],
      emotional: []
    };
    // INPUT
    EnhancedNodeModels._ensureRegistry('input', [
      this.createInputSignalReceptor.bind(this),
      this.createInputDataGateway.bind(this),
      this.createInputIncomingFunnel.bind(this),
      InputSensoryEnhanced.createInputSensory_TactileSensor.bind(InputSensoryEnhanced),
      InputSensoryEnhanced.createInputSensory_EchoDetector.bind(InputSensoryEnhanced),
      InputSensoryEnhanced.createInputSensory_NeuralReceptor.bind(InputSensoryEnhanced),
      ...(this.__EXTRA_FACTORIES?.input || [])
    ]);

    // PROCESS
    EnhancedNodeModels._ensureRegistry('process', [
      this.createProcessFluxChamber.bind(this),
      this.createProcessTransformationSpine.bind(this),
      this.createProcessConversionOrbit.bind(this),
      ProcessEnhancedVariants.createProcessEnhanced_FlowRecomposer.bind(ProcessEnhancedVariants),
      ProcessEnhancedVariants.createProcessEnhanced_TemporalShifter.bind(ProcessEnhancedVariants),
      ProcessEnhancedVariants.createProcessEnhanced_IterativeEngine.bind(ProcessEnhancedVariants),
      ...(this.__EXTRA_FACTORIES?.process || [])
    ]);

    // INTEGRATION
    EnhancedNodeModels._ensureRegistry('integration', [
      this.createKnotTrefoil.bind(this),
      this.createKnotFigureEight.bind(this),
      this.createKnotInfiniteSelfIntersecting.bind(this),
      this.createKnotChaotic.bind(this),
      this.createKnotBorromean.bind(this),
      this.createKnotTorusKnot.bind(this),
      this.createKnotTripleHelix.bind(this),
      this.createExtremeInput1.bind(this),
      IntegrationEnhancedVariants.createIntegrationEnhanced_SignalKnot.bind(IntegrationEnhancedVariants),
      IntegrationEnhancedVariants.createIntegrationEnhanced_ProtocolTangle.bind(IntegrationEnhancedVariants),
      IntegrationEnhancedVariants.createIntegrationEnhanced_ContinuityBinder.bind(IntegrationEnhancedVariants),
      ...(this.__EXTRA_FACTORIES?.integration || [])
    ]);

    // ANALYTICS
    EnhancedNodeModels._ensureRegistry('analytics', [
      this.createAnalyticsNode2.bind(this),
      this.createAnalyticsNode3.bind(this),
      this.createAnalyticsObserverLens.bind(this),
      this.createAnalyticsFractalEcho.bind(this),
      this.createAnalyticsParallaxOracle.bind(this),
      AnalyticsEnhancedVariants.createAnalyticsEnhanced_SignalStratifier.bind(AnalyticsEnhancedVariants),
      AnalyticsEnhancedVariants.createAnalyticsEnhanced_TrendExcavator.bind(AnalyticsEnhancedVariants),
      AnalyticsEnhancedVariants.createAnalyticsEnhanced_AnomalyLedger.bind(AnalyticsEnhancedVariants),
      ...(this.__EXTRA_FACTORIES?.analytics || [])
    ]);

    // STORAGE
    EnhancedNodeModels._ensureRegistry('storage', [
      this.createStorageNode0.bind(this),
      this.createStorageNode1.bind(this),
      this.createStorageNode3.bind(this),
      this.createStorageMnemonicVault.bind(this),
      this.createStorageArchiveSpindle.bind(this),
      this.createStorageMemoryReef.bind(this),
      StorageEnhancedVariants.createStorageEnhanced_ArchiveNexus.bind(StorageEnhancedVariants),
      StorageEnhancedVariants.createStorageEnhanced_MemoryCrypts.bind(StorageEnhancedVariants),
      StorageEnhancedVariants.createStorageEnhanced_DepthLayers.bind(StorageEnhancedVariants),
      StorageNodesVisual.createObeliskCache.bind(StorageNodesVisual),
      StorageNodesVisual.createFractalReservoir.bind(StorageNodesVisual),
      StorageNodesVisual.createArchiveDrum.bind(StorageNodesVisual),
      ...(this.__EXTRA_FACTORIES?.storage || [])
    ]);

    // CONTROL
    EnhancedNodeModels._ensureRegistry('control', [
      this.createAxiomCrystalNode.bind(this),
      this.createControlNode0.bind(this),
      this.createControlNode2.bind(this),
      this.createControlNode1.bind(this),
      this.createControlCommandPyramid.bind(this),
      this.createControlHierarchyTower.bind(this),
      this.createControlSymmetryCore.bind(this),
      this.createExtremeControl0.bind(this),
      ControlEnhancedVariants.createControlEnhanced_DecisionFork.bind(ControlEnhancedVariants),
      ControlEnhancedVariants.createControlEnhanced_AuthorityHelix.bind(ControlEnhancedVariants),
      ControlEnhancedVariants.createControlEnhanced_CommandMatrix.bind(ControlEnhancedVariants),
      ControlNodeSpecialGovernors.createPhrixFlowArbiter.bind(ControlNodeSpecialGovernors),
      ControlNodeSpecialGovernors.createCrucisSuppressionGovernor.bind(ControlNodeSpecialGovernors),
      ControlNodeSpecialGovernors.createVertexTemporalGate.bind(ControlNodeSpecialGovernors),
      ...(this.__EXTRA_FACTORIES?.control || [])
    ]);

    // QUANTUM (sigma alias shares same pool)
    EnhancedNodeModels._ensureRegistry('quantum', [
      this.createSigmaNode0.bind(this),
      this.createSigmaNode1.bind(this),
      this.createSigmaNode3.bind(this),
      this.createExtremeIntegration1.bind(this),
      ...(this.__EXTRA_FACTORIES?.quantum || [])
    ]);
    EnhancedNodeModels._ensureRegistry('sigma', EnhancedNodeModels._ALL_NODE_FACTORIES.quantum);

    // MYTHIC
    EnhancedNodeModels._ensureRegistry('mythic', [
      this.createMythicNode.bind(this),
      ...(this.__EXTRA_FACTORIES?.mythic || [])
    ]);

    // PRIME
    EnhancedNodeModels._ensureRegistry('prime', [
      this.createPrimeNode.bind(this),
      ...(this.__EXTRA_FACTORIES?.prime || [])
    ]);

    // ERROR
    EnhancedNodeModels._ensureRegistry('error', [
      this.createErrorNode.bind(this),
      ...(this.__EXTRA_FACTORIES?.error || [])
    ]);

    // EMOTIONAL
    EnhancedNodeModels._ensureRegistry('emotional', [
      this.createEmotionalNode.bind(this),
      ...(this.__EXTRA_FACTORIES?.emotional || [])
    ]);

  }

  static get __ALL_NODE_FACTORIES() {
    return this._ALL_NODE_FACTORIES;
  }

  static set __ALL_NODE_FACTORIES(value) {
    this._ALL_NODE_FACTORIES = value;
  }

  static __registerAllFactories() {
    return this._registerAllFactories();
  }

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

  /**
   * Create node by category and index
   * FIX 1: Lazy THREE guard - prevent visual creation when THREE is unavailable
   */
  static create(category = 'input', visualCode = 0, color = 0x00ffff) {
    // FIX 1: Direct THREE guard before any visual creation
    if (!THREE || !THREE.Group) {
      if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
        console.error('[VisualBuildFail]', { archetype: category, category, reason: 'THREE_UNAVAILABLE' });
      }
      return null;
    }
    
    const registryReady = this.ensureRegistryReady();
    if (!registryReady || !this._isRegistryValid()) {
      if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
        console.error('[VisualBuildFail]', { archetype: category, category, reason: 'RegistryInvalid' });
      }
      return null;
    }
    const nodeGroup = new THREE.Group();
    const cat = (category || 'input').toLowerCase();
    const pool = CATEGORY_POOLS[cat] || [];

    if (pool.length === 0) {
      console.warn(`[EnhancedNodeModels] Empty visual pool for category '${cat}'.`);
      return null;
    }

    const resolvedVisualCode = _sessionVariantEngine
      ? _sessionVariantEngine.getNext(cat, pool.join(','), pool)
      : pool[visualCode % pool.length];
    if (resolvedVisualCode == null) {
      console.warn(`[EnhancedNodeModels] No visual code available for category '${cat}'.`);
      return null;
    }

    const registryEntry = NODE_VISUAL_REGISTRY[resolvedVisualCode];
    if (!registryEntry) {
      console.warn(`[EnhancedNodeModels] Missing registry entry for visualCode ${resolvedVisualCode}`);
      return null;
    }

    const resolveFactory = (name) => {
      if (typeof this[name] === 'function') return this[name].bind(this);
      switch (name) {
        case 'createInputSensory_TactileSensor': return InputSensoryEnhanced.createInputSensory_TactileSensor.bind(InputSensoryEnhanced);
        case 'createInputSensory_EchoDetector': return InputSensoryEnhanced.createInputSensory_EchoDetector.bind(InputSensoryEnhanced);
        case 'createInputSensory_NeuralReceptor': return InputSensoryEnhanced.createInputSensory_NeuralReceptor.bind(InputSensoryEnhanced);
        case 'createProcessEnhanced_FlowRecomposer': return ProcessEnhancedVariants.createProcessEnhanced_FlowRecomposer.bind(ProcessEnhancedVariants);
        case 'createProcessEnhanced_TemporalShifter': return ProcessEnhancedVariants.createProcessEnhanced_TemporalShifter.bind(ProcessEnhancedVariants);
        case 'createProcessEnhanced_IterativeEngine': return ProcessEnhancedVariants.createProcessEnhanced_IterativeEngine.bind(ProcessEnhancedVariants);
        case 'createIntegrationEnhanced_SignalKnot': return IntegrationEnhancedVariants.createIntegrationEnhanced_SignalKnot.bind(IntegrationEnhancedVariants);
        case 'createIntegrationEnhanced_ProtocolTangle': return IntegrationEnhancedVariants.createIntegrationEnhanced_ProtocolTangle.bind(IntegrationEnhancedVariants);
        case 'createIntegrationEnhanced_ContinuityBinder': return IntegrationEnhancedVariants.createIntegrationEnhanced_ContinuityBinder.bind(IntegrationEnhancedVariants);
        case 'createAnalyticsEnhanced_SignalStratifier': return AnalyticsEnhancedVariants.createAnalyticsEnhanced_SignalStratifier.bind(AnalyticsEnhancedVariants);
        case 'createAnalyticsEnhanced_TrendExcavator': return AnalyticsEnhancedVariants.createAnalyticsEnhanced_TrendExcavator.bind(AnalyticsEnhancedVariants);
        case 'createAnalyticsEnhanced_AnomalyLedger': return AnalyticsEnhancedVariants.createAnalyticsEnhanced_AnomalyLedger.bind(AnalyticsEnhancedVariants);
        case 'createStorageEnhanced_ArchiveNexus': return StorageEnhancedVariants.createStorageEnhanced_ArchiveNexus.bind(StorageEnhancedVariants);
        case 'createStorageEnhanced_MemoryCrypts': return StorageEnhancedVariants.createStorageEnhanced_MemoryCrypts.bind(StorageEnhancedVariants);
        case 'createStorageEnhanced_DepthLayers': return StorageEnhancedVariants.createStorageEnhanced_DepthLayers.bind(StorageEnhancedVariants);
        case 'createObeliskCache': return StorageNodesVisual.createObeliskCache.bind(StorageNodesVisual);
        case 'createFractalReservoir': return StorageNodesVisual.createFractalReservoir.bind(StorageNodesVisual);
        case 'createArchiveDrum': return StorageNodesVisual.createArchiveDrum.bind(StorageNodesVisual);
        case 'createControlEnhanced_DecisionFork': return ControlEnhancedVariants.createControlEnhanced_DecisionFork.bind(ControlEnhancedVariants);
        case 'createControlEnhanced_AuthorityHelix': return ControlEnhancedVariants.createControlEnhanced_AuthorityHelix.bind(ControlEnhancedVariants);
        case 'createControlEnhanced_CommandMatrix': return ControlEnhancedVariants.createControlEnhanced_CommandMatrix.bind(ControlEnhancedVariants);
        case 'createPhrixFlowArbiter': return ControlNodeSpecialGovernors.createPhrixFlowArbiter.bind(ControlNodeSpecialGovernors);
        case 'createCrucisSuppressionGovernor': return ControlNodeSpecialGovernors.createCrucisSuppressionGovernor.bind(ControlNodeSpecialGovernors);
        case 'createVertexTemporalGate': return ControlNodeSpecialGovernors.createVertexTemporalGate.bind(ControlNodeSpecialGovernors);
        default:
          return null;
      }
    };

    const factoryFn = resolveFactory(registryEntry.factoryName);
    if (cat === 'quantum') {
      console.log(`[EnhancedNodeModels.create] QUANTUM using factory: ${registryEntry.factoryName}`);
    }
    if (!factoryFn) {
      console.warn(`[EnhancedNodeModels] Factory not found for ${registryEntry.factoryName} (visualCode ${resolvedVisualCode})`);
      return null;
    }

    const rootGroup = factoryFn(nodeGroup, resolvedVisualCode, color);

    if (rootGroup) {
      nodeGroup.userData = nodeGroup.userData || {};
      nodeGroup.userData.visualCode = resolvedVisualCode;
      if (!rootGroup.userData) rootGroup.userData = {};
      rootGroup.userData.visualCode = resolvedVisualCode;
    }

    const clearPartialVisuals = (group) => {
      if (!group || !group.children) return;
      while (group.children.length > 0) {
        const child = group.children[group.children.length - 1];
        group.remove(child);
      }
    };

    // FIX 3: Full visual validation - reject simple/fallback visuals
    // Hard stop: do not auto-inject fallback materials; log for diagnostics.
    if (rootGroup) {
      let meshFound = false;
      let materialMissing = false;
      let meshCount = 0;
      let hasOnlySpheres = true;
      let geometryTypes = new Set();
      
      rootGroup.traverse(obj => {
        if (obj.isMesh) {
          meshFound = true;
          meshCount++;
          
          if (!obj.material) materialMissing = true;
          
          // Track geometry types for primitive detection
          if (obj.geometry) {
            const geoType = obj.geometry.type || obj.geometry.constructor?.name || 'unknown';
            geometryTypes.add(geoType);
            if (geoType !== 'SphereGeometry' && 
                geoType !== 'IcosahedronGeometry' &&
                geoType !== 'OctahedronGeometry') {
              hasOnlySpheres = false;
            }
          }
        }
      });
      
      if (!meshFound || materialMissing) {
        if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
          console.error('[VisualBuildFail]', {
            archetype: rootGroup.userData?.archetype || category,
            category: category,
            reason: meshFound ? 'NoMaterial' : 'NoMesh',
          });
        }
      }
      
      // FIX 3: Reject simple visuals (mesh count < 2 or only primitive spheres)
      // BYPASSED FOR VISUAL-REJECTION-BYPASS PHASE
      if (false && meshFound && !materialMissing) {
        if (false && meshCount < 2) {
          console.warn('[VisualBuildReject][SimpleVisual]', { 
            archetype: rootGroup.userData?.archetype || category,
            category: category,
            reason: 'MeshCountLessThan2',
            meshCount: meshCount,
            geometryTypes: Array.from(geometryTypes)
          });
          clearPartialVisuals(rootGroup);
          return null;
        }
        
        if (false && hasOnlySpheres && meshCount <= 2) {
          console.warn('[VisualBuildReject][SimpleVisual]', { 
            archetype: rootGroup.userData?.archetype || category,
            category: category,
            reason: 'PrimitiveSphereOnly',
            meshCount: meshCount,
            geometryTypes: Array.from(geometryTypes)
          });
          clearPartialVisuals(rootGroup);
          return null;
        }
      }

      const forbiddenMeshes = [];
      rootGroup.traverse(obj => {
        if (!obj?.isMesh) return;
        const g = obj.geometry?.type;
        if (FORBIDDEN_CANONICAL_GEOMETRIES.has(g)) {
          forbiddenMeshes.push({ obj, g });
        }
      });

      if (false && forbiddenMeshes.length > 0) {
        for (const hit of forbiddenMeshes) {
          console.warn('[NODE_VISUAL_KILL] Primitive removed:', hit.g);
          hit.obj.visible = false;
          hit.obj.parent?.remove(hit.obj);
        }
        console.warn('[NODE_REJECT] Canonical visual missing — node not spawned');
        clearPartialVisuals(rootGroup);
        return null;
      }

      if (false && (rootGroup.children?.length || 0) === 0) {
        console.warn('[NODE_REJECT] Empty visual root');
        clearPartialVisuals(rootGroup);
        return null;
      }
    }
    return rootGroup;
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
  static createInputNode(group, index, color) {
    if (USE_INPUT_V2) {
      const v2 = this.createInputNodeStyled_v2(group, index, color);
      if (v2) return v2;
    }
    return this._createInputNodeLegacy(group, index, color);
  }

  /**
   * INPUT v2: Data Singularity Intake
   * Hierarchy:
   * INPUT_NODE
   *   - CORE_GROUP (SignalCore + CoreEdges)
   *   - FLOW_GROUP (InflowArrows + OrbitBands + VectorLines + DataStreams)
   *   - EMISSION_GROUP (PulseHalo + EntryParticles)
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
    EnhancedNodeModels._ensureRegistry('input', Object.values(poolFns));
    return (poolFns[selected] || poolFns[pool[0]])(group, color);
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
    EnhancedNodeModels._ensureRegistry('process', Object.values(poolFns));
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
    EnhancedNodeModels._ensureRegistry('integration', Object.values(factoryMap));
    if (pool.length === 0) return null;
    const counter = Number.isFinite(index) ? index : 0;
    const selected = pool[counter % pool.length];
    const factory = factoryMap[selected];
    if (!factory) return null;
    return factory(group, color);
  }

  // ===== ANALYTICS NODES (Violet - 4 variants) =====

  /**
   * Analytics Node 2: Hexagonal disc with fractal patterns
   */
  static createAnalyticsNode2(group, color) {
    // Hexagonal disc
    const hexGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 6);
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
    const hex = new THREE.Mesh(hexGeometry, material);
    group.add(hex);

    // Fractal cut patterns (nested hexagons)
    for (let i = 1; i <= 2; i++) {
      const innerHexGeometry = new THREE.CylinderGeometry(0.8 - i * 0.25, 0.8 - i * 0.25, 0.25, 6);
      const innerHex = new THREE.Mesh(innerHexGeometry, material);
      innerHex.position.y = i * 0.05;
      group.add(innerHex);
    }

    // --- Analytics Factory Trace ---
    let meshCount = 0;
    group.traverse(o => { if (o.isMesh) meshCount++; });
    if (meshCount === 0) {
      console.error('[AnalyticsFactoryEmpty]', {
        factory: 'createAnalyticsNode2',
        visualCode: '2',
        group
      });
    }

    return group;
  }

  /**
   * Analytics Node 3: Recursive Insight Engine
   */
  static createAnalyticsNode3(group, color) {
    // Layered ring stack with subtle imperfections.
    const stackGroup = new THREE.Group();
    const ringConfigs = [
      { radius: 0.34, tube: 0.055, y: -0.28, rotX: 0.12, rotZ: -0.08, sx: 1.02, sz: 0.98, arc: Math.PI * 2 },
      { radius: 0.47, tube: 0.06, y: 0.00, rotX: -0.06, rotZ: 0.11, sx: 0.98, sz: 1.02, arc: Math.PI * 2 },
      { radius: 0.62, tube: 0.05, y: 0.31, rotX: 0.09, rotZ: 0.05, sx: 1.02, sz: 0.98, arc: Math.PI * 1.72 }
    ];

    ringConfigs.forEach((cfg, i) => {
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.55,
        roughness: 0.35,
        emissive: color,
        emissiveIntensity: i === 1 ? 0.24 : 0.18
      });
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(cfg.radius, cfg.tube, 12, 48, cfg.arc),
        ringMaterial
      );
      ring.position.y = cfg.y;
      ring.rotation.x = cfg.rotX;
      ring.rotation.z = cfg.rotZ;
      ring.scale.set(cfg.sx, 1, cfg.sz);
      stackGroup.add(ring);

      if (i === 1) {
        const glowRing = new THREE.Mesh(
          new THREE.TorusGeometry(cfg.radius * 0.97, cfg.tube * 0.75, 10, 48),
          new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          })
        );
        glowRing.position.copy(ring.position);
        glowRing.rotation.copy(ring.rotation);
        stackGroup.add(glowRing);
      }
    });

    // Vertical data axis with transform-only pulse in animate().
    const spine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6),
      new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.25,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.38
      })
    );
    spine.userData.isAnalyticsSpine = true;
    spine.userData.pulseBaseScale = 1;
    stackGroup.add(spine);

    group.add(stackGroup);

    // Overthinking echo: wireframe clone of the stack with slight offset.
    const echo = stackGroup.clone(true);
    echo.scale.setScalar(1.04);
    echo.rotation.y = 0.05;
    echo.traverse(obj => {
      if (obj.isMesh) {
        obj.material = new THREE.MeshBasicMaterial({
          color: color,
          wireframe: true,
          transparent: true,
          opacity: 0.25,
          depthWrite: false
        });
      }
    });
    group.add(echo);

    // Floating data shards with slow orbital movement + bob.
    const shardGroup = new THREE.Group();
    shardGroup.userData.isAnalyticsShardGroup = true;
    const shardCount = 6;
    for (let i = 0; i < shardCount; i++) {
      const shard = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.05, 0),
        new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.75
        })
      );
      const angle = (i / shardCount) * Math.PI * 2;
      const radius = 0.5 + (i % 2 === 0 ? 0.04 : -0.03);
      shard.position.set(
        Math.cos(angle) * radius,
        -0.18 + i * 0.07,
        Math.sin(angle) * radius
      );
      shard.userData.bobPhase = i * 0.9;
      shard.userData.ignoreRaycast = true;
      shardGroup.add(shard);
    }
    group.add(shardGroup);
    group.userData.nodeGeometryName = 'ANALYTICS_RECURSIVE_INSIGHT_ENGINE';

    // --- Analytics Factory Trace ---
    let meshCount = 0;
    group.traverse(o => { if (o.isMesh) meshCount++; });
    if (meshCount === 0) {
      console.error('[AnalyticsFactoryEmpty]', {
        factory: 'createAnalyticsNode3',
        visualCode: '3',
        group
      });
    }

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
  static createAnalyticsNode(group, index, color) {
    if (USE_ANALYTICS_V2) {
      const v2 = this.createAnalyticsNodeStyled_v2(group, index, color);
      if (v2) return v2;
    }
    return this._createAnalyticsNodeLegacy(group, index, color);
  }

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
    
    EnhancedNodeModels._ensureRegistry('analytics', Object.values(poolFns));
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
      const lensCount = 5;
      const lensMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.6,
        roughness: 0.3,
        emissive: color,
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.45
      });

      // Create layered optical plates (non-parallel, slightly offset and tilted)
      for (let i = 0; i < lensCount; i++) {
        // Create annular ring/plate geometry (disc with hole)
        const outerRadius = 0.65 - i * 0.08;
        const innerRadius = 0.2;
        
        const plateGeometry = new THREE.CylinderGeometry(
          outerRadius,
          outerRadius,
          0.06,
          32,
          4,
          true
        );

        const plate = new THREE.Mesh(plateGeometry, lensMaterial);
        
        // Position vertically with slight stagger
        const yPos = (i - lensCount / 2) * 0.12;
        plate.position.y = yPos;
        
        // Progressive tilt for optical lens effect
        const tiltAngle = (i / lensCount) * Math.PI * 0.15;
        plate.rotation.x = tiltAngle;
        plate.rotation.z = Math.sin(i * 0.7) * 0.1;
        
        plate.userData.isLensPlate = true;
        plate.userData.plateIndex = i;
        plate.userData.visualCoreImmutable = true;
        group.add(plate);
      }

      // Create central void aperture (visual focus)
      const apertureGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.4, 16);
      const apertureMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.3,
        wireframe: false
      });
      const aperture = new THREE.Mesh(apertureGeometry, apertureMaterial);
      aperture.userData.isAperture = true;
      aperture.userData.visualCoreImmutable = true;
      group.add(aperture);

      // Store animation metadata (very slow rotation + subtle wobble)
      group.userData.lensRotationSpeed = 0.05; // Very slow
      group.userData.lensWobbleAmplitude = 0.04; // Subtle axial tilt
      group.userData.lensWobbleSpeed = 0.3;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'ANALYTICS_OBSERVER_LENS';

      // --- Analytics Factory Trace ---
      let meshCount = 0;
      group.traverse(o => { if (o.isMesh) meshCount++; });
      if (meshCount === 0) {
        console.error('[AnalyticsFactoryEmpty]', {
          factory: 'createAnalyticsObserverLens',
          visualCode: '3',
          group
        });
      }

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
      // Create central seed geometry (asymmetric icosahedron)
      const seedGeometry = new THREE.IcosahedronGeometry(0.35, 3);
      seedGeometry.scale(1.1, 0.85, 1.0); // Asymmetric elongation
      
      const seedMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.75,
        roughness: 0.15,
        transmission: 0, // Phase B.3.A: transmission disabled to prevent RenderTransmissionPass
        thickness: 0.4,
        ior: 1.48,
        emissive: color,
        emissiveIntensity: 0.25
      });

      const seed = new THREE.Mesh(seedGeometry, seedMaterial);
      seed.rotation.set(Math.PI / 8, Math.PI / 6, Math.PI / 12);
      seed.userData.isSeedCore = true;
      seed.userData.visualCoreImmutable = true;
      group.add(seed);

      // Create 4 scaled-down echoes (fractal copies)
      const echoCount = 4;
      const echoMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.65,
        roughness: 0.25,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.65
      });

      for (let i = 0; i < echoCount; i++) {
        // Create echo geometry (scaled tetrahedron, different from seed)
        const echoGeometry = new THREE.TetrahedronGeometry(0.18, 2);
        echoGeometry.scale(0.9 + i * 0.05, 1.1 - i * 0.08, 0.95);
        
        const echo = new THREE.Mesh(echoGeometry, echoMaterial);
        
        // Position radially around center
        const angle = (i / echoCount) * Math.PI * 2;
        const radius = 0.55;
        const height = Math.sin(i * 0.8) * 0.15;
        
        echo.position.set(
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        );
        
        // Each echo rotated differently
        echo.rotation.set(
          (i * Math.PI / 3) + Math.PI / 4,
          (i * Math.PI / 2.5) + Math.PI / 6,
          (i * Math.PI / 4)
        );
        
        echo.userData.isEcho = true;
        echo.userData.echoIndex = i;
        echo.userData.baseAngle = angle;
        echo.userData.baseRadius = radius;
        echo.userData.baseHeight = height;
        echo.userData.visualCoreImmutable = true;
        group.add(echo);
      }

      // Store animation metadata (counter-rotation)
      group.userData.fractalSeedRotationSpeed = 0.12;
      group.userData.fractalEchoRotationSpeed = -0.09; // Counter-rotation
      group.userData.fractalBreathingAmplitude = 0.015; // ±1.5% subtle breathing

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'ANALYTICS_FRACTAL_ECHO';

      // --- Analytics Factory Trace ---
      let meshCount = 0;
      group.traverse(o => { if (o.isMesh) meshCount++; });
      if (meshCount === 0) {
        console.error('[AnalyticsFactoryEmpty]', {
          factory: 'createAnalyticsFractalEcho',
          visualCode: '4',
          group
        });
      }

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
      // Create central observer core (stable dodecahedron)
      const observerGeometry = new THREE.DodecahedronGeometry(0.28, 0);
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

      // Create 4 translucent observation planes (perception layers)
      const planeCount = 4;
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        wireframe: false
      });

      for (let i = 0; i < planeCount; i++) {
        // Create plane geometry (different dimensions for parallax effect)
        const planeWidth = 0.7 - i * 0.08;
        const planeHeight = 0.5 + i * 0.1;
        const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        
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
    // Main pillar (optional background reference, mostly transparent)
    const pillarGeometry = new THREE.BoxGeometry(0.5, 1.2, 0.5);
    const pillarMaterial = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.8,
      roughness: 0.2,
      emissive: color,
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.15
    });
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.renderOrder = 0;  // Core layer
    group.add(pillar);

    // Memory slices - FIXED: Enforced spacing, no merging
    const sliceCount = 6;
    const sliceHeight = 0.15;
    const sliceSpacing = 0.32; // Ensure clear gaps between slices
    
    for (let i = 0; i < sliceCount; i++) {
      const sliceGeometry = new THREE.BoxGeometry(0.50, sliceHeight, 0.50);
      const sliceMaterial = new THREE.MeshStandardMaterial({
        transparent: false,
        opacity: 1,
        depthWrite: true,
        depthTest: true,
        side: THREE.FrontSide,
        color: color,
        metalness: 0.8,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.25

      });
      const slice = new THREE.Mesh(sliceGeometry, sliceMaterial);
      
      // POLISH: Consistent vertical spacing, per-segment micro-rotation for visual interest
      slice.position.y = (i - sliceCount / 2) * sliceSpacing;
      slice.rotation.z = (Math.sin(i * 0.5) * 0.08); // Subtle micro-rotation per segment
      slice.renderOrder = 0;  // Core layer
      slice.userData = { segmentIndex: i };
      
      group.add(slice);
    }

    // POLISH: Optional faint vertical core light (visualization of memory flow)
    // VISUAL HIERARCHY: Reduced opacity from 0.15 to 0.08 (very subtle inner glow)
    const coreLightGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 8);
    const coreLightMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.08,  // Reduced from 0.15
      emissive: color,
      emissiveIntensity: 0.3
    });
    const coreLight = new THREE.Mesh(coreLightGeo, coreLightMat);
    coreLight.renderOrder = 1;  // Inner layer
    coreLight.userData = { isCoreLightVFX: true };
    group.add(coreLight);

    group.userData.segmentCount = sliceCount;
    group.userData.segmentMicroRotationEnabled = true;

    return group;
  }

  /**
   * Storage Node 1: Capsule with inner bands
   */
  static createStorageNode1(group, color) {
    group.userData = group.userData || {};
    const colorHex = new THREE.Color(color).getHex();

    if (!this.__storageCapsuleV2Cache) {
      const outerGeometry = new THREE.CapsuleGeometry(0.35, 1.0, 8, 16);
      const lineCount = 8;
      const lineRadius = 0.17;
      const halfHeight = 0.48;
      const flowPositions = new Float32Array(lineCount * 2 * 3);
      for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        const x = Math.cos(angle) * lineRadius;
        const z = Math.sin(angle) * lineRadius;
        const idx = i * 6;
        flowPositions[idx] = x;
        flowPositions[idx + 1] = -halfHeight;
        flowPositions[idx + 2] = z;
        flowPositions[idx + 3] = x;
        flowPositions[idx + 4] = halfHeight;
        flowPositions[idx + 5] = z;
      }
      const flowGeometry = new THREE.BufferGeometry();
      flowGeometry.setAttribute('position', new THREE.BufferAttribute(flowPositions, 3));

      this.__storageCapsuleV2Cache = {
        geometries: {
          outerGeometry,
          innerGeometry: new THREE.CapsuleGeometry(0.31, 0.86, 8, 16),
          edgeGeometry: new THREE.EdgesGeometry(outerGeometry),
          flowGeometry,
          ringGeometryA: new THREE.TorusGeometry(0.43, 0.02, 8, 48),
          ringGeometryB: new THREE.TorusGeometry(0.33, 0.018, 8, 40),
          pulseBandGeometry: new THREE.TorusGeometry(0.36, 0.014, 8, 48)
        },
        materials: new Map()
      };
    }

    const cache = this.__storageCapsuleV2Cache;
    let mats = cache.materials.get(colorHex);
    if (!mats) {
      mats = {
        outerMat: new THREE.MeshStandardMaterial({
          color: colorHex,
          metalness: 0.65,
          roughness: 0.28,
          emissive: colorHex,
          emissiveIntensity: 0.08,
          transparent: true,
          opacity: 0.25
        }),
        innerMat: new THREE.MeshStandardMaterial({
          color: colorHex,
          metalness: 0.72,
          roughness: 0.18,
          emissive: colorHex,
          emissiveIntensity: 0.42
        }),
        edgeMat: new THREE.LineBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 0.35
        }),
        flowMat: new THREE.LineBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 0.5
        }),
        ringMat: new THREE.MeshBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 0.3,
          depthWrite: false
        }),
        pulseMat: new THREE.MeshBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 0.45,
          depthWrite: false
        })
      };
      cache.materials.set(colorHex, mats);
    }

    const outerShell = new THREE.Mesh(cache.geometries.outerGeometry, mats.outerMat);
    group.add(outerShell);

    const innerShell = new THREE.Mesh(cache.geometries.innerGeometry, mats.innerMat);
    group.add(innerShell);

    const edgeOverlay = new THREE.LineSegments(cache.geometries.edgeGeometry, mats.edgeMat);
    group.add(edgeOverlay);

    const flowLines = new THREE.LineSegments(cache.geometries.flowGeometry, mats.flowMat);
    flowLines.userData.isStorageFlow = true;
    group.add(flowLines);

    const ringA = new THREE.Mesh(cache.geometries.ringGeometryA, mats.ringMat);
    ringA.rotation.x = Math.PI * 0.5;
    ringA.rotation.z = 0.22;
    ringA.position.y = 0.2;
    group.add(ringA);

    const ringB = new THREE.Mesh(cache.geometries.ringGeometryB, mats.ringMat);
    ringB.rotation.x = Math.PI * 0.5;
    ringB.rotation.z = -0.2;
    ringB.position.y = -0.22;
    group.add(ringB);

    const pulseBand = new THREE.Mesh(cache.geometries.pulseBandGeometry, mats.pulseMat);
    pulseBand.rotation.x = Math.PI * 0.5;
    group.add(pulseBand);

    // Localized animation hook for this capsule variant only.
    innerShell.onBeforeRender = () => {
      const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;
      ringA.rotation.y = t * 0.22;
      ringB.rotation.y = -t * 0.18;
      const pulse = 1 + Math.sin(t * 1.4) * 0.04;
      pulseBand.scale.set(pulse, 1, pulse);
    };

    group.userData.visualVariant = 'STORAGE_CAPSULE_V2';
    return group;
  }

  /**
   * Storage Node 3: Cluster of crystal shards
   */
  static createStorageNode3(group, color) {
    group.userData = group.userData || {};
    const colorHex = new THREE.Color(color).getHex();
    const shardRadius = 0.35;
    const orbitRadius = 0.58;

    if (!this.__storageShardV2Cache) {
      this.__storageShardV2Cache = {
        geometries: {
          shardGeometry: new THREE.TetrahedronGeometry(shardRadius, 1),
          coreGeometry: new THREE.SphereGeometry(shardRadius, 16, 16),
          ringGeometry: new THREE.TorusGeometry(orbitRadius + 0.08, 0.03, 10, 48),
          particleGeometry: new THREE.BoxGeometry(0.06, 0.06, 0.06)
        },
        materials: new Map()
      };
    }

    const cache = this.__storageShardV2Cache;
    let mats = cache.materials.get(colorHex);
    if (!mats) {
      mats = {
        shardMat: new THREE.MeshStandardMaterial({
          transparent: false,
          opacity: 1,
          depthWrite: true,
          depthTest: true,
          side: THREE.FrontSide,
          color: colorHex,
          metalness: 0.8,
          roughness: 0.25,
          emissive: colorHex,
          emissiveIntensity: 0.22
        }),
        coreMat: new THREE.MeshStandardMaterial({
          color: colorHex,
          metalness: 0.35,
          roughness: 0.15,
          emissive: colorHex,
          emissiveIntensity: 0.62
        }),
        ringMat: new THREE.MeshBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 0.25,
          depthWrite: false
        }),
        particleMat: new THREE.MeshStandardMaterial({
          color: colorHex,
          metalness: 0.45,
          roughness: 0.35,
          emissive: colorHex,
          emissiveIntensity: 0.3
        })
      };
      cache.materials.set(colorHex, mats);
    }

    const shardOrbit = new THREE.Group();
    const shardCount = 4;
    for (let i = 0; i < shardCount; i++) {
      const angle = (i / shardCount) * Math.PI * 2;
      const shard = new THREE.Mesh(cache.geometries.shardGeometry, mats.shardMat);
      shard.position.set(
        Math.cos(angle) * orbitRadius,
        0,
        Math.sin(angle) * orbitRadius
      );
      shard.rotation.set(0.2, angle + Math.PI * 0.25, -0.15);
      shard.userData.isStorageShard = true;
      shard.userData.orbitAngle = angle;
      shard.userData.orbitRadius = orbitRadius;
      shardOrbit.add(shard);
    }
    group.add(shardOrbit);

    const core = new THREE.Mesh(cache.geometries.coreGeometry, mats.coreMat);
    core.scale.setScalar(0.4); // 40% of shard radius basis geometry
    group.add(core);

    const containmentRing = new THREE.Mesh(cache.geometries.ringGeometry, mats.ringMat);
    containmentRing.rotation.x = Math.PI * 0.5;
    group.add(containmentRing);

    const particleGroup = new THREE.Group();
    const particleCount = 6;
    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(cache.geometries.particleGeometry, mats.particleMat);
      const angle = (i / particleCount) * Math.PI * 2;
      const r = 0.2 + (i % 2 === 0 ? 0.04 : -0.02);
      p.position.set(Math.cos(angle) * r, (i % 3 - 1) * 0.08, Math.sin(angle) * r);
      p.userData.isStorageParticle = true;
      p.userData.baseY = p.position.y;
      p.userData.phase = i * 0.9;
      particleGroup.add(p);
    }
    group.add(particleGroup);

    // Localized animation hook for this shard variant only.
    core.onBeforeRender = () => {
      const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;
      shardOrbit.rotation.y = t * 0.18;
      shardOrbit.children.forEach((shard, idx) => {
        const phase = t * 0.75 + idx * 0.6;
        shard.position.y = Math.sin(phase) * 0.03;
      });
      particleGroup.rotation.y = -t * 0.22;
      particleGroup.children.forEach((p, idx) => {
        p.position.y = (p.userData.baseY || 0) + Math.sin(t * 1.2 + (p.userData.phase || idx)) * 0.02;
      });
    };

    group.userData.visualVariant = 'STORAGE_SHARD_V2';
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
  static createStorageNode(group, index, color) {
    if (USE_STORAGE_V2) {
      const v2 = this.createStorageNodeStyled_v2(group, index, color);
      if (v2) return v2;
    }
    return this._createStorageNodeLegacy(group, index, color);
  }

  /**
   * STORAGE v2: Memory Monolith
   * Hierarchy:
   * STORAGE_NODE
   *   - CORE_GROUP (MemoryCoreColumn + DataSpine)
   *   - LAYER_GROUP (MemoryRings + CompressionBands + DataSlices)
   *   - ARCHIVE_GROUP (ArchiveHalo + TimelineParticles)
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
      console.error('[StorageV2Abort]', { reason: err?.message || err });
      return null;
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
    EnhancedNodeModels._ensureRegistry('storage', Object.values(poolFns));
    return (poolFns[selected] || poolFns[pool[0]])(group, color);
  }

  /**
   * STORAGE: MNEMONIC_VAULT (NEW - Session 63)
   * Protected memory core suspended inside faceted containment shell
   * - Inner core: irregular crystal (not symmetric)
   * - Outer shell: faceted containment frame (NOT a sphere)
   * - Visible gap between core and shell
   * - Core animation: very slow rotation
   * - Shell animation: subtle counter-rotation
   * 
   * VISUAL SAFETY: Static geometry, transform-only animation, immutable
   */
  static createStorageMnemonicVault(group, color) {
    try {
      group.userData = group.userData || {};
      const colorHex = new THREE.Color(color).getHex();

      if (!this.__storageMnemonicVaultCache) {
        const mainGeometry = new THREE.DodecahedronGeometry(0.72, 0);
        this.__storageMnemonicVaultCache = {
          geometries: {
            mainGeometry,
            edgesGeometry: new THREE.EdgesGeometry(mainGeometry),
            ringGeometryA: new THREE.TorusGeometry(0.82, 0.028, 10, 48),
            ringGeometryB: new THREE.TorusGeometry(0.58, 0.022, 10, 40),
            particleGeometry: new THREE.BoxGeometry(0.07, 0.07, 0.07),
            auraGeometry: new THREE.SphereGeometry(0.95, 16, 16)
          },
          materials: new Map()
        };
      }

      const cache = this.__storageMnemonicVaultCache;
      let mats = cache.materials.get(colorHex);
      if (!mats) {
        mats = {
          shellMat: new THREE.MeshStandardMaterial({
            color: colorHex,
            metalness: 0.78,
            roughness: 0.22,
            emissive: colorHex,
            emissiveIntensity: 0.16,
            transparent: true,
            opacity: 0.52
          }),
          innerCoreMat: new THREE.MeshStandardMaterial({
            color: colorHex,
            metalness: 0.62,
            roughness: 0.16,
            emissive: colorHex,
            emissiveIntensity: 0.6
          }),
          edgeMat: new THREE.LineBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.34
          }),
          ringMat: new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.38,
            depthWrite: false
          }),
          particleMat: new THREE.MeshStandardMaterial({
            color: colorHex,
            metalness: 0.55,
            roughness: 0.3,
            emissive: colorHex,
            emissiveIntensity: 0.28
          }),
          auraMat: new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.08,
            depthWrite: false,
            side: THREE.BackSide
          })
        };
        cache.materials.set(colorHex, mats);
      }

      const outerShell = new THREE.Mesh(cache.geometries.mainGeometry, mats.shellMat);
      outerShell.userData.isOuterShell = true;
      outerShell.userData.visualCoreImmutable = true;
      group.add(outerShell);

      // Inner emissive core based on the main shell geometry (scaled to 60%).
      const innerCore = new THREE.Mesh(cache.geometries.mainGeometry, mats.innerCoreMat);
      innerCore.scale.setScalar(0.6);
      innerCore.userData.isInnerCore = true;
      innerCore.userData.visualCoreImmutable = true;
      group.add(innerCore);

      const edgeOverlay = new THREE.LineSegments(cache.geometries.edgesGeometry, mats.edgeMat);
      edgeOverlay.userData.visualCoreImmutable = true;
      group.add(edgeOverlay);

      const ringA = new THREE.Mesh(cache.geometries.ringGeometryA, mats.ringMat);
      ringA.rotation.x = Math.PI * 0.5;
      ringA.userData.visualCoreImmutable = true;
      group.add(ringA);

      const ringB = new THREE.Mesh(cache.geometries.ringGeometryB, mats.ringMat);
      ringB.rotation.z = Math.PI * 0.5;
      ringB.userData.visualCoreImmutable = true;
      group.add(ringB);

      const particleOrbit = new THREE.Group();
      const particleCount = 6;
      for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(cache.geometries.particleGeometry, mats.particleMat);
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 0.33 + (i % 2 === 0 ? 0.05 : -0.03);
        particle.position.set(
          Math.cos(angle) * radius,
          (i % 2 === 0 ? 0.08 : -0.08),
          Math.sin(angle) * radius
        );
        particle.userData.isStorageParticle = true;
        particle.userData.baseY = particle.position.y;
        particle.userData.phase = i * 0.7;
        particle.userData.visualCoreImmutable = true;
        particleOrbit.add(particle);
      }
      group.add(particleOrbit);

      const aura = new THREE.Mesh(cache.geometries.auraGeometry, mats.auraMat);
      aura.userData.visualCoreImmutable = true;
      group.add(aura);

      // Local animation hook: only affects this builder's meshes.
      outerShell.onBeforeRender = () => {
        const t = ((typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001);

        ringA.rotation.y = t * 0.28;
        ringB.rotation.y = -t * 0.22;

        particleOrbit.rotation.y = t * 0.18;
        particleOrbit.children.forEach((p, idx) => {
          const phase = t * 1.05 + (p.userData.phase || idx * 0.5);
          p.position.y = (p.userData.baseY || 0) + Math.sin(phase) * 0.02;
          p.rotation.x = phase * 0.25;
          p.rotation.z = -phase * 0.2;
        });

        if (group.userData.storageBreath) {
          if (group.userData.storageBreathBaseScale == null) {
            group.userData.storageBreathBaseScale = group.scale.x || 1;
          }
          const base = group.userData.storageBreathBaseScale || 1;
          const breath = 1 + Math.sin(t * 0.85) * 0.02;
          group.scale.setScalar(base * breath);
        }
      };

      group.userData.mnemonicCoreRotationAxis = new THREE.Vector3(0.3, 1, -0.2).normalize();
      group.userData.mnemonicCoreRotationSpeed = 0.08;
      group.userData.mnemonicShellRotationAxis = new THREE.Vector3(-0.4, -0.8, 0.3).normalize();
      group.userData.mnemonicShellRotationSpeed = -0.06;
      group.userData.storageBreath = true;
      group.userData.visualVariant = 'STORAGE_V2';
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
    // Octagonal core
    const octGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.8, 8);
    const material = new THREE.MeshStandardMaterial({
      transparent: false,
      opacity: 1,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide,
      color: color,
      metalness: 0.8,
      roughness: 0.2,
      emissive: color,
      emissiveIntensity: 0.35

    });
    const oct = new THREE.Mesh(octGeometry, material);
    oct.renderOrder = 0;  // Core layer
    group.add(oct);

    // Magenta rim glow
    const rimGeometry = new THREE.TorusGeometry(1.0, 0.1, 8, 32);
    const rimMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.renderOrder = 0;  // Core layer
    group.add(rim);

    // POLISH: Central static polyhedron (solid authority core)
    // Note: This core is intentionally opaque—it's a design feature (authority symbol)
    const coreGeometry = new THREE.DodecahedronGeometry(0.25, 0);
    const coreMaterial = new THREE.MeshStandardMaterial({
      transparent: false,
      opacity: 1,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide,
      color: color,
      metalness: 0.95,
      roughness: 0.05,
      emissive: color,
      emissiveIntensity: 0.7

    });
    const centralCore = new THREE.Mesh(coreGeometry, coreMaterial);
    centralCore.renderOrder = 1;  // Inner layer (visible, intentional)
    group.add(centralCore);

    // POLISH: Subtle pulsing mesh lines for authority (stored as animation metadata)
    group.userData.meshPulsePhase = 0;
    group.userData.meshPulseAmplitude = 0.08; // Very subtle (8% amplitude)
    group.userData.meshPulseSpeed = 0.5;

    return group;
  }

  /**
   * Control Node 1: Sharp tetrahedral pyramid
   */
  static createControlNode1(group, color) {
    if (window.ATOMA_DEBUG_VISUAL_BUILD === true) {
      console.error('[VisualBuildFail]', { archetype: 'control-1', category: 'control', reason: 'NoMesh' });
    }
    return group;
  }


  /**
   * Control Node 2: Ring-within-ring hierarchy structure
   */
  static createControlNode2(group, color) {
    const material = new THREE.MeshStandardMaterial({
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

    // Three concentric rings
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(0.5 + i * 0.35, 0.12, 16, 100);
      const ring = new THREE.Mesh(ringGeometry, material);
      ring.rotation.x = (i % 2) * Math.PI / 2;
      ring.rotation.z = (i === 1) * Math.PI / 3;
      group.add(ring);
    }

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
  static createControlNode(group, index, color) {
    if (USE_CONTROL_V2_LEGACY) {
      const legacy = this.createControlNodeStyled_v2_Legacy(group, index, color);
      if (legacy) return legacy;
    }
    if (USE_CONTROL_V2) {
      const v2 = this.createControlNodeStyled_v2(group, index, color);
      if (v2) return v2;
    }
    if (!this.__controlLegacyRedirectWarned) {
      console.warn('[ControlLegacyRedirect] Falling back to CONTROL_V2 visual builder.');
      this.__controlLegacyRedirectWarned = true;
    }
    const redirected = this.createControlNodeStyled_v2(group, index, color);
    if (redirected) return redirected;

    // Safety fallback only if CONTROL_V2 fails unexpectedly.
    const pool = CATEGORY_POOLS.control || [];
    const factoryMap = {
      601: this.createAxiomCrystalNode.bind(this),
      602: this.createControlNode0.bind(this),
      603: this.createControlNode2.bind(this),
      604: this.createControlNode1.bind(this),
      605: this.createControlCommandPyramid.bind(this),
      606: this.createControlHierarchyTower.bind(this),
      607: this.createControlSymmetryCore.bind(this),
      608: this.createExtremeControl0.bind(this),
      609: ControlEnhancedVariants.createControlEnhanced_DecisionFork.bind(ControlEnhancedVariants),
      610: ControlEnhancedVariants.createControlEnhanced_AuthorityHelix.bind(ControlEnhancedVariants),
      611: ControlEnhancedVariants.createControlEnhanced_CommandMatrix.bind(ControlEnhancedVariants),
      612: ControlNodeSpecialGovernors.createPhrixFlowArbiter.bind(ControlNodeSpecialGovernors),
      613: ControlNodeSpecialGovernors.createCrucisSuppressionGovernor.bind(ControlNodeSpecialGovernors),
      614: ControlNodeSpecialGovernors.createVertexTemporalGate.bind(ControlNodeSpecialGovernors)
    };
    const counter = Number.isFinite(index) ? index : 0;
    const selected = pool[counter % pool.length];
    const factory = factoryMap[selected];
    if (!factory) return null;
    EnhancedNodeModels._ensureRegistry('control', Object.values(factoryMap));
    return factory(group, color);
  }

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
      // Create tall asymmetric pyramid base (authority structure)
      const pyramidVertices = new Float32Array([
        // Base (wide rectangular)
        -0.45, -0.4, -0.35,   // 0
        0.45, -0.4, -0.35,    // 1
        0.45, -0.4, 0.45,     // 2
        -0.45, -0.4, 0.45,    // 3
        
        // Apex (tall, slightly offset - asymmetric authority)
        0.08, 0.65, -0.05     // 4
      ]);

      const pyramidIndices = new Uint16Array([
        // Base
        0, 2, 1,
        0, 3, 2,
        
        // Sides to apex
        0, 1, 4,
        1, 2, 4,
        2, 3, 4,
        3, 0, 4
      ]);

      const pyramidGeometry = new THREE.BufferGeometry();
      pyramidGeometry.setAttribute('position', new THREE.BufferAttribute(pyramidVertices, 3));
      pyramidGeometry.setIndex(new THREE.BufferAttribute(pyramidIndices, 1));
      pyramidGeometry.computeVertexNormals();

      const pyramidMaterial = new THREE.MeshStandardMaterial({
        transparent: false,
        opacity: 1,
        depthWrite: true,
        depthTest: true,
        side: THREE.FrontSide,
        color: color,
        metalness: 0.85,
        roughness: 0.15,
        emissive: color,
        emissiveIntensity: 0.3

      });

      const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
      pyramid.userData.isCommandPyramid = true;
      pyramid.userData.visualCoreImmutable = true;
      group.add(pyramid);

      // Create 4 radiating command beams (pointing outward from apex)
      const beamCount = 4;
      const beamLength = 0.55;
      const beamMaterial = new THREE.MeshStandardMaterial({
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

      const beamDirections = [
        [1, 0.3, 0],      // Forward-up
        [-1, 0.3, 0],     // Back-up
        [0, 0.3, 1],      // Right-up
        [0, 0.3, -1]      // Left-up
      ];

      for (let i = 0; i < beamCount; i++) {
        // Create beam as thin elongated box
        const beamGeometry = new THREE.BoxGeometry(0.08, 0.08, beamLength);
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        
        // Position beam originating from apex
        const [dx, dy, dz] = beamDirections[i];
        const normalized = new THREE.Vector3(dx, dy, dz).normalize();
        beam.position.set(
          normalized.x * (beamLength / 2 + 0.1),
          0.65 + normalized.y * (beamLength / 2),
          normalized.z * (beamLength / 2)
        );
        
        // Point beam outward
        beam.lookAt(
          normalized.x * (beamLength + 1),
          0.65 + normalized.y * (beamLength + 1),
          normalized.z * (beamLength + 1)
        );
        
        beam.userData.isCommandBeam = true;
        beam.userData.beamIndex = i;
        beam.userData.visualCoreImmutable = true;
        group.add(beam);
      }

      // Create central authority glow core
      const glowGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.set(0.08, 0.65, -0.05); // At apex
      glow.userData.isAuthorityGlow = true;
      glow.userData.visualCoreImmutable = true;
      group.add(glow);

      // Store animation metadata
      group.userData.commandRotationSpeed = 0.18;
      group.userData.commandPulseAmplitude = 0.08; // 8% glow pulsing
      group.userData.commandPulseSpeed = 1.0;

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
      // Create central symmetric core (dodecahedron - perfect symmetry)
      const coreGeometry = new THREE.DodecahedronGeometry(0.3, 0);
      const coreMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.1,
        transmission: 0, // Phase B.3.A: transmission disabled to prevent RenderTransmissionPass
        thickness: 0.3,
        ior: 1.45,
        emissive: color,
        emissiveIntensity: 0.4
      });

      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      core.userData.isSymmetryCore = true;
      core.userData.visualCoreImmutable = true;
      group.add(core);

      // Create 4 cardinal arm structures (N/S/E/W symmetry)
      const armCount = 4;
      const armLength = 0.6;
      const armMaterial = new THREE.MeshStandardMaterial({
        transparent: false,
        opacity: 1,
        depthWrite: true,
        depthTest: true,
        side: THREE.FrontSide,
        color: color,
        metalness: 0.8,
        roughness: 0.15,
        emissive: color,
        emissiveIntensity: 0.3

      });

      const armDirections = [
        [1, 0, 0],    // +X (East)
        [-1, 0, 0],   // -X (West)
        [0, 0, 1],    // +Z (North)
        [0, 0, -1]    // -Z (South)
      ];

      for (let i = 0; i < armCount; i++) {
        // Create arm structure (box-like for orderly structure)
        const armGeometry = new THREE.BoxGeometry(0.12, 0.15, armLength);
        const arm = new THREE.Mesh(armGeometry, armMaterial);
        
        const [dx, dz] = [armDirections[i][0], armDirections[i][2]];
        arm.position.set(
          dx * (armLength / 2 + 0.15),
          0,
          dz * (armLength / 2 + 0.15)
        );
        
        // Arm points outward along its axis
        if (dx !== 0) {
          arm.rotation.z = Math.PI / 2;
        } else {
          arm.rotation.x = Math.PI / 2;
        }
        
        arm.userData.isSymmetryArm = true;
        arm.userData.armIndex = i;
        arm.userData.armDirection = armDirections[i];
        arm.userData.visualCoreImmutable = true;
        group.add(arm);

        // Add small terminal nodes at arm ends (symmetry markers)
        const markerGeometry = new THREE.OctahedronGeometry(0.1, 1);
        const markerMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.6
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        
        marker.position.set(
          dx * (armLength + 0.25),
          0,
          dz * (armLength + 0.25)
        );
        
        marker.userData.isSymmetryMarker = true;
        marker.userData.markerIndex = i;
        marker.userData.visualCoreImmutable = true;
        group.add(marker);
      }

      // Store animation metadata (counter-rotating core + arms)
      group.userData.symCoreRotationSpeed = 0.2;
      group.userData.symArmRotationSpeed = -0.15; // Counter-rotation
      group.userData.symArmCount = armCount;

      group.userData.visualCoreImmutable = true;
      group.userData.nodeGeometryName = 'CONTROL_SYMMETRY_CORE';

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
  static createQuantumNode(group, index, color) {
    // HARD REDIRECT: QUANTUM always uses v2 builder
    // Legacy path is quarantined with dev-only warning
    if (USE_QUANTUM_V2) {
      const v2 = this.createQuantumNodeStyled_v2(group, index, color);
      console.log('BUILDER CALLED: createQuantumNode (dispatch to v2)', { variant: 'QUANTUM_V2' });
      if (v2) return v2;
    }
    
    // LEGACY QUARANTINE: This path should never be reached
    // If reached, log warning with stack trace for debugging
    console.warn(
      "[LEGACY VISUAL] QUANTUM v2 builder failed, falling back to legacy. " +
      "This should never happen - v2 is hard-locked. Stack:",
      new Error().stack
    );
    
    // Hard fallback to v2 even if legacy was attempted
    const v2Fallback = this.createQuantumNodeStyled_v2(group, index, color);
    if (v2Fallback) return v2Fallback;
    
    // Final fallback: return minimal placeholder for dev visibility
    const placeholder = new THREE.Group();
    placeholder.name = 'QUANTUM_FALLBACK_LEGACY';
    placeholder.userData.visualVariant = 'QUANTUM_V2_FALLBACK';
    const placeholderGeo = new THREE.DodecahedronGeometry(0.5, 0);
    const placeholderMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true
    });
    const placeholderMesh = new THREE.Mesh(placeholderGeo, placeholderMat);
    placeholder.add(placeholderMesh);
    group.add(placeholder);
    return group;
  }

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
  static createSigmaNode(group, index, color) {
    if (USE_SIGMA_V2) {
      const v2 = this.createSigmaNodeStyled_v2(group, index, color);
      console.log('BUILDER CALLED: createSigmaNode (dispatch to v2)', { variant: 'SIGMA_V2' });
      if (v2) return v2;
    }
    return this.createQuantumNode(group, index, color);
  }

  static createSigmaNode2(group, color) {
    const nodeKey = group?.userData?.nodeId || group?.userData?.visualCode?.toString() || String(color || 0x00ffff);
    const seedValue = hashString(nodeKey);
    const seed = Math.abs(seedValue) || 1;
    const rng = _mythicSeededRng(seed);
    const sigmaRoot = new THREE.Group();
    sigmaRoot.name = 'SIGMA_ENTROPY_COLLAPSE';
    sigmaRoot.userData.isSigmaLayer = true;

    const perturb = (geom, magnitude = 0.1) => {
      const attr = geom.attributes.position;
      for (let i = 0; i < attr.count; i++) {
        attr.setXYZ(
          i,
          attr.getX(i) + (rng() - 0.5) * magnitude,
          attr.getY(i) + (rng() - 0.5) * magnitude * 0.6,
          attr.getZ(i) + (rng() - 0.5) * magnitude
        );
      }
      geom.computeVertexNormals();
    };

    // Layer A: fractured torus skeleton (wireframe)
    const torusGeo = new THREE.TorusGeometry(0.75, 0.1, 64, 32);
    perturb(torusGeo, 0.08);
    const edgesGeom = new THREE.EdgesGeometry(torusGeo);
    const filtered = [];
    const posArray = edgesGeom.attributes.position.array;
    for (let i = 0; i < posArray.length; i += 6) {
      if (rng() < 0.3) continue; // remove some segments
      filtered.push(
        posArray[i], posArray[i + 1], posArray[i + 2],
        posArray[i + 3], posArray[i + 4], posArray[i + 5]
      );
    }
    const torusWire = new THREE.LineSegments(
      filtered.length
        ? new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(filtered, 3))
        : edgesGeom,
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.7
      })
    );
    torusWire.scale.set(1.1, 0.95, 0.85);
    torusWire.userData.isSigmaLayer = true;
    sigmaRoot.add(torusWire);

    // Layer B: ruptured icosa core
    const coreGeo = new THREE.IcosahedronGeometry(0.6, 2);
    perturb(coreGeo, 0.18);
    const coreMat = createSigmaCollapseMaterial(seed, color);
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.userData.isSigmaCore = true;
    coreMesh.userData.collapseUniforms = coreMat.uniforms;
    sigmaRoot.add(coreMesh);

    // Layer C: vertical dislocation rings
    const layersGroup = new THREE.Group();
    layersGroup.name = 'SigmaDislocationLayers';
    const layerCount = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < layerCount; i++) {
      const ringGeo = new THREE.TorusGeometry(0.5 + i * 0.12, 0.05 + rng() * 0.03, 16, 40);
      perturb(ringGeo, 0.02);
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.25 + rng() * 0.2,
        blending: THREE.AdditiveBlending
      }));
      ring.position.y = -0.2 + i * 0.12 + (rng() - 0.5) * 0.08;
      ring.rotation.z = rng() * 0.4 - 0.2;
      ring.userData.isSigmaLayer = true;
      ring.userData.ringSpeed = 0.02 + rng() * 0.05;
      layersGroup.add(ring);
    }
    sigmaRoot.add(layersGroup);

    // Layer D: entropy shards
    const shardGroup = new THREE.Group();
    shardGroup.name = 'SigmaEntropyShards';
    const shardCount = 10 + Math.floor(rng() * 9);
    for (let i = 0; i < shardCount; i++) {
      const shardGeo = new THREE.TetrahedronGeometry(0.1 + rng() * 0.05, 0);
      perturb(shardGeo, 0.06);
      const shardMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: 0.45 + rng() * 0.15,
        metalness: 0.3,
        roughness: 0.5
      });
      const shard = new THREE.Mesh(shardGeo, shardMat);
      const dist = 1.0 + rng() * 0.8;
      const angle = rng() * Math.PI * 2;
      shard.position.set(
        Math.cos(angle) * dist,
        (rng() - 0.5) * 0.4,
        Math.sin(angle) * dist
      );
      shard.scale.setScalar(0.2 + rng() * 0.3);
      shard.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      shard.userData.isSigmaShard = true;
      shardGroup.add(shard);
    }
    sigmaRoot.add(shardGroup);

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

      const sigmaRoot = new THREE.Group();
      sigmaRoot.name = 'SIGMA_NODE';
      sigmaRoot.userData.visualVariant = 'SIGMA_V2';
      console.log('BUILDER CALLED: createSigmaNodeStyled_v2', { visualVariant: sigmaRoot.userData.visualVariant });

      // CORE GROUP
      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';

      const core = new THREE.Mesh(geometries.baseGeometry, materials.coreMat);
      core.name = 'SigmaCore';
      coreGroup.add(core);

      const edges = new THREE.LineSegments(geometries.edgesGeometry, materials.edgeMat);
      edges.name = 'CoreEdges';
      coreGroup.add(edges);

      sigmaRoot.add(coreGroup);

      // FIELD GROUP (orthogonal rings)
      const fieldGroup = new THREE.Group();
      fieldGroup.name = 'FIELD_GROUP';

      const ringCount = 2;
      sigmaRoot.userData.orbitRingCount = ringCount;
      for (let i = 0; i < ringCount; i++) {
        const ring = new THREE.Mesh(geometries.ringGeometry, materials.ringMat);
        ring.name = `SigmaRing_${i}`;
        ring.rotation.x = i === 0 ? Math.PI / 2 : 0;
        ring.rotation.y = i === 1 ? Math.PI / 2 : 0;
        ring.userData.isSigmaRing = true;
        ring.userData.isOrbitRing = true;
        ring.userData.orbitAxis = (i === 0 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)).normalize();
        ring.userData.orbitSpeed = 0.05 + i * 0.02; // slow rotation
        ring.userData.visualCoreImmutable = true;
        fieldGroup.add(ring);
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
   * Sigma Node 0: Soft elliptical form [LEGACY - QUARANTINED]
   * This legacy builder should never be called.
   * SIGMA nodes now use QUANTUM v2 builder via hard redirect.
   */
  static createSigmaNode0(group, color) {
    // LEGACY QUARANTINE WARNING
    console.warn(
      "[LEGACY VISUAL] SigmaNode0 (legacy builder) called. " +
      "SIGMA nodes should use QUANTUM v2 builder. " +
      "Redirecting to v2. Stack:",
      new Error().stack
    );
    
    // Hard redirect to v2 builder
    return this.createQuantumNodeStyled_v2(group, 0, color);
  }

  /**
   * Sigma Node 1: Rotating dimensional rings [LEGACY - QUARANTINED]
   * This legacy builder should never be called.
   * SIGMA nodes now use QUANTUM v2 builder via hard redirect.
   */
  static createSigmaNode1(group, color) {
    // LEGACY QUARANTINE WARNING
    console.warn(
      "[LEGACY VISUAL] SigmaNode1 (legacy builder) called. " +
      "SIGMA nodes should use QUANTUM v2 builder. " +
      "Redirecting to v2. Stack:",
      new Error().stack
    );
    
    // Hard redirect to v2 builder
    return this.createQuantumNodeStyled_v2(group, 1, color);
  }

  /**
   * Sigma Node 3: Twisted anomaly [LEGACY - QUARANTINED]
   * This legacy builder should never be called.
   * SIGMA nodes now use QUANTUM v2 builder via hard redirect.
   */
  static createSigmaNode3(group, color) {
    // LEGACY QUARANTINE WARNING
    console.warn(
      "[LEGACY VISUAL] SigmaNode3 (legacy builder) called. " +
      "SIGMA nodes should use QUANTUM v2 builder. " +
      "Redirecting to v2. Stack:",
      new Error().stack
    );
    
    // Hard redirect to v2 builder
    return this.createQuantumNodeStyled_v2(group, 3, color);
  }

  // ===== MYTHIC NODES (Ancient Fractured Relics - 6 variants) =====

  /**
   * Main mythic node creator
   * CANONICAL CATEGORY: MYTHIC
   * - ShardCluster, BrokenMonolith, FloatingFragments
   * - CrackedPrism, AncientCoreWithMissing, CollapsedCrown
   */
  static createMythicNode(group, index, color) {
    if (USE_MYTHIC_V2) {
      const v2 = this.createMythicNodeStyled_v2(group, index, color);
      if (v2) return v2;
    }
    return this._createMythicNodeLegacy(group, index, color);
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

      mythicRoot.add(auraGroup);

      mythicRoot.userData.visualReady = true;
      group.add(mythicRoot);
      return group;
    } catch (err) {
      console.error('[MythicV2Abort]', { reason: err?.message || err });
      return null;
    }
  }

  // Legacy MYTHIC visuals retained as fallback
  static _createMythicNodeLegacy(group, index, color) {
    const variants = [
      () => CanonicalGeometryFamilies.createMythicShardCluster(1.0),
      () => CanonicalGeometryFamilies.createMythicBrokenMonolith(1.0),
      () => CanonicalGeometryFamilies.createMythicFloatingFragments(1.0),
      () => CanonicalGeometryFamilies.createMythicCrackedPrism(1.0),
      () => CanonicalGeometryFamilies.createMythicAncientCoreWithMissing(1.0),
      () => CanonicalGeometryFamilies.createMythicCollapsedCrown(1.0)
    ];
    EnhancedNodeModels._ensureRegistry('mythic', variants);
    if (EnhancedNodeModels.__EXTRA_FACTORIES?.mythic) {
      variants.push(...EnhancedNodeModels.__EXTRA_FACTORIES.mythic);
    }
    
    const mesh = variants[index % variants.length]();
    if (!mesh.userData) mesh.userData = {};
    mesh.userData.category = 'mythic';
    mesh.userData.visualReady = true;
    group.add(mesh);
    return group;
  }

  // ===== PRIME NODES (Perfect Axioms - 6 variants) =====

  /**
   * Main prime node creator
   * CANONICAL CATEGORY: PRIME
   * - NestedIcosahedron, PerfectDodecahedron, StellaOctangula
   * - PrecisionLattice, TesseractProjection, SymmetryLockedCore
   */
  static createPrimeNode(group, index, color) {
    if (USE_PRIME_V2) {
      const v2 = this.createPrimeNodeStyled_v2(group, index, color);
      if (v2) return v2;
    }
    return this._createPrimeNodeLegacy(group, index, color);
  }

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
      const primeRoot = new THREE.Group();
      primeRoot.name = 'PRIME_NODE';
      primeRoot.userData.visualVariant = 'PRIME_V2';

      // CORE
      const coreGroup = new THREE.Group();
      coreGroup.name = 'CORE_GROUP';
      const coreMesh = new THREE.Mesh(geometries.coreGeometry, materials.coreMat);
      coreMesh.name = 'PrimeCore';
      const coreEdges = new THREE.LineSegments(geometries.edgesGeometry, materials.edgesMat);
      coreEdges.name = 'CoreEdges';
      coreGroup.add(coreMesh);
      coreGroup.add(coreEdges);
      primeRoot.add(coreGroup);

      // STRUCTURE
      const structureGroup = new THREE.Group();
      structureGroup.name = 'STRUCTURE_GROUP';

      const ringA = new THREE.Mesh(geometries.ringGeometry, materials.ringMat);
      ringA.name = 'OrbitRing_A';
      ringA.rotation.set(0, 0, 0);
      ringA.renderOrder = EnhancedNodeModels._getCoreRenderOrder();
      structureGroup.add(ringA);

      const ringB = new THREE.Mesh(geometries.ringGeometry, materials.ringMat);
      ringB.name = 'OrbitRing_B';
      ringB.rotation.x = THREE.MathUtils.degToRad(35);
      ringB.rotation.z = THREE.MathUtils.degToRad(20);
      ringB.scale.setScalar(1.08);
      ringB.renderOrder = EnhancedNodeModels._getCoreRenderOrder();
      structureGroup.add(ringB);

      const latticePositions = _getPrimeV2LatticePositions(geometries.coreGeometry);
      const latticeCount = Math.max(0, latticePositions.length);
      const lattice = new THREE.InstancedMesh(geometries.latticeGeometry, materials.latticeMat, latticeCount);
      lattice.name = 'LatticeInstances';
      lattice.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

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
      const shell1 = createNodeHologramShell(coreMesh);
      if (shell1) {
        shell1.name = 'PrimeShell_1';
        shell1.scale.setScalar(1.08);
        shell1.frustumCulled = false;
        shell1.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
        auraGroup.add(shell1);
      }
      const shell2 = createNodeHologramShell(coreMesh);
      if (shell2) {
        shell2.name = 'PrimeShell_2';
        shell2.scale.setScalar(1.14);
        shell2.frustumCulled = false;
        shell2.renderOrder = EnhancedNodeModels._getArchetypeRenderOrder();
        auraGroup.add(shell2);
      }
      primeRoot.add(auraGroup);

      primeRoot.userData.visualReady = true;
      group.add(primeRoot);
      return group;
    } catch (err) {
      console.error('[PrimeV2Abort]', { reason: err?.message || err });
      return null;
    }
  }

  // Legacy PRIME visuals (kept as fallback)
  static _createPrimeNodeLegacy(group, index, color) {
    const variants = [
      () => CanonicalGeometryFamilies.createPrimeNestedIcosahedron(1.0),
      () => CanonicalGeometryFamilies.createPrimePerfectDodecahedron(1.0),
      () => CanonicalGeometryFamilies.createPrimeStellaOctangula(1.0),
      () => CanonicalGeometryFamilies.createPrimePrecisionLattice(1.0),
      () => CanonicalGeometryFamilies.createPrimeTesseractProjection(1.0),
      () => CanonicalGeometryFamilies.createPrimeSymmetryLockedCore(1.0)
    ];
    EnhancedNodeModels._ensureRegistry('prime', variants);
    if (EnhancedNodeModels.__EXTRA_FACTORIES?.prime) {
      variants.push(...EnhancedNodeModels.__EXTRA_FACTORIES.prime);
    }
    
    const mesh = variants[index % variants.length]();
    if (!mesh.userData) mesh.userData = {};
    mesh.userData.category = 'prime';
    mesh.userData.visualReady = true;
    group.add(mesh);
    return group;
  }

  // ===== ERROR NODES (Frozen Corruption - 6 variants) =====

  /**
   * Main error node creator
   * CANONICAL CATEGORY: ERROR
   * - IntersectingSolids, InvertedNormals, SelfClipping
   * - FoldedImpossible, TopologyTear, CorruptedManifold
   */
  static createErrorNode(group, index, color) {
    if (USE_ERROR_V2) {
      const v2 = this.createErrorNodeStyled_v2(group, index, color);
      if (v2) return v2;
    }
    return this._createErrorNodeLegacy(group, index, color);
  }

  /**
   * ERROR v2: Impossible Geometry
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

      const errorRoot = new THREE.Group();
      errorRoot.name = 'ERROR_NODE';
      errorRoot.userData.visualVariant = 'ERROR_V2';

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

      errorRoot.add(distortionGroup);

      errorRoot.userData.visualReady = true;
      group.add(errorRoot);
      return group;
    } catch (err) {
      console.error('[ErrorV2Abort]', { reason: err?.message || err });
      return null;
    }
  }

  // Legacy ERROR visuals retained as fallback
  static _createErrorNodeLegacy(group, index, color) {
    const variants = [
      () => CanonicalGeometryFamilies.createErrorIntersectingSolids(1.0),
      () => CanonicalGeometryFamilies.createErrorInvertedNormals(1.0),
      () => CanonicalGeometryFamilies.createErrorSelfClipping(1.0),
      () => CanonicalGeometryFamilies.createErrorFoldedImpossible(1.0),
      () => CanonicalGeometryFamilies.createErrorTopologyTear(1.0),
      () => CanonicalGeometryFamilies.createErrorCorruptedManifold(1.0)
    ];
    EnhancedNodeModels._ensureRegistry('error', variants);
    if (EnhancedNodeModels.__EXTRA_FACTORIES?.error) {
      variants.push(...EnhancedNodeModels.__EXTRA_FACTORIES.error);
    }
    
    const mesh = variants[index % variants.length]();
    if (!mesh.userData) mesh.userData = {};
    mesh.userData.category = 'error';
    mesh.userData.isError = true;
    mesh.userData.visualReady = true;
    group.add(mesh);
    return group;
  }

  // ===== EMOTIONAL NODES (Crystalline Organics - 6 variants) =====

  /**
   * Main emotional node creator
   * CANONICAL CATEGORY: EMOTIONAL
   * - HeartCrystal, NeuralLobe, BloomingGem
   * - TearShaped, Folded, SymmetricSeed
   */
  static createEmotionalNode(group, index, color) {
    if (USE_EMOTIONAL_V2) {
      const v2 = this.createEmotionalNodeStyled_v2(group, index, color);
      if (v2) return v2;
    }
    return this._createEmotionalNodeLegacy(group, index, color);
  }

  /**
   * EMOTIONAL v2: Affective Distortion Core
   * Hierarchy:
   * EMOTIONAL_NODE
   *   - CORE_GROUP (DistortedCore + CoreEdges + InnerGlowLayer)
   *   - AURA_GROUP (EmotionShell_A + EmotionShell_B + EmotionMist)
   *   - TENDRIL_GROUP (EmotionalTendrils + MicroFragments)
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
    
    EnhancedNodeModels._ensureRegistry('emotional', variants);
    if (EnhancedNodeModels.__EXTRA_FACTORIES?.emotional) {
      variants.push(...EnhancedNodeModels.__EXTRA_FACTORIES.emotional);
    }
    
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
        child.userData.vortexUniforms.uTime.value = performance.now() * 0.001;
      }
      if (child.userData?.isIntegrationOrbit) {
        child.rotation.y += deltaTime * 0.08;
      }
      if (child.userData?.isControl3Core && child.userData.fractureUniforms?.uTime) {
        child.userData.fractureUniforms.uTime.value = performance.now() * 0.001;
      }
      if (child.userData?.isAuthorityAxis) {
        child.rotation.y += deltaTime * 0.05;
        child.rotation.x += deltaTime * 0.02;
      }
      if (child.userData?.isSigmaCore && child.userData.collapseUniforms) {
        child.userData.collapseUniforms.uTime.value = performance.now() * 0.001;
        const strength = 0.4 + 0.2 * Math.sin(performance.now() * 0.0015);
        child.userData.collapseUniforms.uCollapseStrength.value = strength;
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
          
          // Advance along curve
          child.userData.pathOffset = (child.userData.pathOffset + deltaTime * speed) % 1.0;
          
          // Get position on curve
          const point = curve.getPoint(child.userData.pathOffset);
          child.position.copy(point);
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
          
          // Advance path offset
          child.userData.pathOffset = (child.userData.pathOffset + deltaTime * speed) % 1.0;
          
          // Get point on curve
          const point = curve.getPoint(child.userData.pathOffset);
          child.position.copy(point);
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
        0, Math.PI * 2, 64, 0.25, 8, color
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
        0, Math.PI * 2, 64, 0.22, 8, color
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
  static generateTubularKnot(parametricFunc, tStart, tEnd, segments, tubeRadius, tubeSegments, color) {
    const points = [];
    
    // Generate knot path points
    for (let i = 0; i <= segments; i++) {
      const t = tStart + (tEnd - tStart) * (i / segments);
      const pt = parametricFunc(t);
      points.push(new THREE.Vector3(pt[0] * 0.6, pt[1] * 0.6, pt[2] * 0.6));
    }
    
    // Create curve from points
    const curve = new THREE.CatmullRomCurve3(points);
    
    // Generate tubular geometry
    const geometry = new THREE.TubeGeometry(curve, segments, tubeRadius, tubeSegments, false);
    
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
      'prime': 0xffffff,        // White - perfect topology
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
      const tempNode = new THREE.Group();
      tempNode.visualGroup = new THREE.Group();
      
      const extremeGroup = this.extremeNodePack.createInfiniteSpiral(tempNode, null);
      if (!extremeGroup) {
        console.error('[VisualBuildFail]', { archetype: 'extreme-control-0', category: 'control', reason: 'NoMesh' });
        return group;
      }
      
      group.add(extremeGroup);
      tempNode.userData.extremeArchetype = 10;
      
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
  EnhancedNodeModels.ensureRegistryReady();

  // Dev helper
  window.ensureNodeRegistry = () => {
    EnhancedNodeModels.ensureRegistryReady();
    return EnhancedNodeModels._ALL_NODE_FACTORIES;
  };

  // ===== DEV ONLY: spawn-all factory smoke test =====
  window.debugSpawnAllNodes = function() {
    EnhancedNodeModels.ensureRegistryReady();
    const results = [];
    const categories = EnhancedNodeModels._ALL_NODE_FACTORIES || {};
    for (const [category, factories] of Object.entries(categories)) {
      const list = factories || [];
      list.forEach((factory, i) => {
        try {
          const group = new THREE.Group();
          const node = factory(group, i, 0x00ffff);
          if (!node) {
            results.push({ category, index: i, status: 'NULL_NODE' });
            return;
          }
          results.push({ category, index: i, status: 'OK' });
        } catch (e) {
          results.push({ category, index: i, status: 'ERROR', error: e.message });
        }
      });
    }
    console.table(results);
    return results;
  };

  // DEV: Factory registry diagnostics
  window.debugFactoryCounts = function() {
    EnhancedNodeModels.ensureRegistryReady();
    const out = {};
    const categories = EnhancedNodeModels._ALL_NODE_FACTORIES || {};
    for (const [cat, arr] of Object.entries(categories)) {
      out[cat] = Array.isArray(arr) ? arr.length : 0;
    }
    return out;
  };

  window.debugFactoryList = function(category) {
    EnhancedNodeModels.ensureRegistryReady();
    const categories = EnhancedNodeModels._ALL_NODE_FACTORIES || {};
    const list = categories[category] || [];
    // Try to surface function names when available
    return list.map((fn, idx) => fn?.name || `factory_${idx}`);
  };

  window.debugRegistrySummary = function() {
    EnhancedNodeModels.ensureRegistryReady();
    const rows = [];
    const categories = EnhancedNodeModels._ALL_NODE_FACTORIES || {};
    for (const [cat, arr] of Object.entries(categories)) {
      rows.push({ category: cat, count: Array.isArray(arr) ? arr.length : 0 });
    }
    console.table(rows);
    return rows;
  };
}
