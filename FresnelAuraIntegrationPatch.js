/**
 * FRESNEL AURA INTEGRATION PATCH
 * ===============================
 * Seamlessly integrates fresnel-based rim-lighting into existing aura system
 * 
 * Integration Points:
 * 1. Replace outerGlow material with fresnel shader
 * 2. Keep all existing aura logic (strength, opacity, pulse)
 * 3. Zero breaking changes to node creation flow
 * 4. Easy enable/disable via config
 * 
 * Usage:
 * ```
 * import { patchAINodesToUseFresnelAuras } from './FresnelAuraIntegrationPatch.js';
 * patchAINodesToUseFresnelAuras(AINodes, { enabled: true });
 * ```
 */

import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';
import {
  createFresnelRimLightAuraMaterial,
  createFresnelRimLightAuraMaterialWithDistance,
  createMultiBandFresnelRimAura,
} from './FresnelRimLightAuraShader.js';

/**
 * Global patch configuration
 */
const patchConfig = {
  enabled: false,
  variant: 'basic', // 'basic' | 'distance' | 'multiband'
  rimPower: 2.0,
  rimScale: 1.5,
  fresnelMin: 0.3,
  fresnelMax: 1.0,
};

/**
 * Configure the patch before applying
 */
export function configureFresnelAuraPatch(options) {
  Object.assign(patchConfig, options);
}

/**
 * Apply patch to AINodes class
 * 
 * @param {Object} AINodesModule The AINodes module/class
 * @param {Object} options Configuration options
 * @returns {Object} Patch info for verification
 */
export function patchAINodesToUseFresnelAuras(AINodesModule, options = {}) {
  configureFresnelAuraPatch(options);

  if (!patchConfig.enabled) {
    console.log('[FresnelAuraPatch] Disabled - skipping integration');
    return { applied: false, reason: 'disabled' };
  }

  // Store original factory if not already patched
  if (!AINodesModule._originalCreateAura) {
    AINodesModule._originalCreateAura = AINodesModule.createAura || createDefaultAura;
  }

  // Replace createAura method with fresnel-aware version
  AINodesModule.createAura = function(nodeData, options = {}) {
    return createFresnelAura(nodeData, options);
  };

  console.log('[FresnelAuraPatch] Applied successfully', {
    variant: patchConfig.variant,
    rimPower: patchConfig.rimPower,
    rimScale: patchConfig.rimScale,
  });

  return {
    applied: true,
    variant: patchConfig.variant,
    config: { ...patchConfig },
  };
}

/**
 * Create an aura mesh with fresnel rim-lighting
 * Replaces the default static aura with physics-based fresnel shader
 * 
 * @param {Object} nodeData Node data object
 * @param {Object} options Creation options
 * @returns {THREE.Mesh} Aura mesh with fresnel shader
 */
export function createFresnelAura(nodeData, options = {}) {
  const {
    radius = 1.0,
    auraColor = new THREE.Color(0x7fffd4),
    nodeCategory = 'neutral',
  } = options;

  // Create aura geometry (IcosahedronGeometry for smooth appearance)
  const geometry = new THREE.IcosahedronGeometry(radius * 1.2, 4);

  // Select shader variant based on config
  let material;
  switch (patchConfig.variant) {
    case 'distance':
      material = createFresnelRimLightAuraMaterialWithDistance({
        auraColor,
        rimPower: patchConfig.rimPower,
        rimScale: patchConfig.rimScale,
        fresnelMin: patchConfig.fresnelMin,
        fresnelMax: patchConfig.fresnelMax,
      });
      break;

    case 'multiband':
      material = createMultiBandFresnelRimAura({
        auraColor,
        edgeColor: computeEdgeColorForCategory(nodeCategory),
        rimPower1: patchConfig.rimPower * 0.75,
        rimPower2: patchConfig.rimPower,
      });
      break;

    case 'basic':
    default:
      material = createFresnelRimLightAuraMaterial({
        auraColor,
        rimPower: patchConfig.rimPower,
        rimScale: patchConfig.rimScale,
        fresnelMin: patchConfig.fresnelMin,
        fresnelMax: patchConfig.fresnelMax,
      });
  }

  // Create mesh
  const aura = new THREE.Mesh(geometry, material);

  // Configuration matching existing system
  aura.userData = {
    isAura: true,
    nodeId: nodeData.id,
    category: nodeCategory,
    rimPower: patchConfig.rimPower,
  };

  // Render order (behind core)
  aura.renderOrder = -1;

  // Disable shadow casting for performance
  aura.castShadow = false;
  aura.receiveShadow = false;

  return aura;
}

/**
 * Compute edge color based on node category for multi-band variant
 * Creates visually distinct edge highlights per archetype
 * 
 * @param {string} category Node category
 * @returns {THREE.Color} Edge highlight color
 */
function computeEdgeColorForCategory(category) {
  const colorMap = {
    control: new THREE.Color(0xff0080),      // Magenta
    prime: new THREE.Color(0x00ff00),        // Lime
    axiom: new THREE.Color(0xffff00),        // Yellow
    emotional: new THREE.Color(0xff69b4),    // Hot pink
    error: new THREE.Color(0xff4444),        // Red
    mythic: new THREE.Color(0x9933ff),       // Purple
    harmonic: new THREE.Color(0x00ffff),     // Cyan
    resonance: new THREE.Color(0x00dddd),    // Teal
    ritual: new THREE.Color(0xff8800),       // Orange
    sage: new THREE.Color(0x88ff00),         // Lime-green
    ephemeral: new THREE.Color(0xccccff),    // Light purple
    neutral: new THREE.Color(0x7fffd4),      // Aquamarine
  };

  return colorMap[category] || new THREE.Color(0x7fffd4);
}

/**
 * Stub for default aura creation (used if not already defined)
 */
function createDefaultAura(nodeData, options = {}) {
  const { radius = 1.0 } = options;
  const geometry = new THREE.IcosahedronGeometry(radius * 1.2, 4);
  const material = new THREE.MeshBasicMaterial({
    color: 0x7fffd4,
    transparent: true,
    opacity: 0.3,
  });
  return new THREE.Mesh(geometry, material);
}

/**
 * Update aura uniforms per-frame
 * Call this in the main render loop for animation
 * 
 * @param {THREE.Mesh} auraMesh The aura mesh
 * @param {number} time Current time in seconds
 * @param {Object} state Node state (strength, opacity, etc.)
 */
let _fresnelAuraTimeOrigin;

export function updateFresnelAuraUniforms(auraMesh, time, state = {}) {
  if (!auraMesh || !auraMesh.material || !auraMesh.material.uniforms) {
    return;
  }

  const uniforms = auraMesh.material.uniforms;
  const {
    auraStrength = 0.5,
    auraOpacity = 0.3,
    auraRadius = 1.0,
    auraPulse = 1.0,
  } = state;

  // Update time for animations
  if (uniforms.uTime) {
    if (_fresnelAuraTimeOrigin === undefined) {
      _fresnelAuraTimeOrigin = VisualTime.now;
    }
    const currentVisualTime = VisualTime.now - _fresnelAuraTimeOrigin; // Phase 2A: canonical VisualTime source (behavior-preserving)
    uniforms.uTime.value = currentVisualTime;
  }

  // Update aura state
  if (uniforms.uAuraStrength) uniforms.uAuraStrength.value = auraStrength;
  if (uniforms.uAuraOpacity) uniforms.uAuraOpacity.value = auraOpacity;
  if (uniforms.uAuraRadius) uniforms.uAuraRadius.value = auraRadius;
  if (uniforms.uAuraPulse) uniforms.uAuraPulse.value = auraPulse;

  // Update camera position for distance falloff (if using distance variant)
  if (uniforms.uCameraPosition) {
    // NOTE: Camera object must be in scope; update this with actual camera
    // This is a placeholder - integrate with your camera instance
    // uniforms.uCameraPosition.value.copy(camera.position);
  }
}

/**
 * Batch update multiple aura uniforms (performance optimized)
 * 
 * @param {Array<THREE.Mesh>} auraMeshes Array of aura meshes
 * @param {number} time Current time
 * @param {Array<Object>} states Array of state objects (one per mesh)
 */
export function batchUpdateFresnelAuraUniforms(auraMeshes, time, states = []) {
  for (let i = 0; i < auraMeshes.length; i++) {
    const state = states[i] || states[0] || {};
    updateFresnelAuraUniforms(auraMeshes[i], time, state);
  }
}

/**
 * Verify fresnel aura is properly integrated
 * 
 * @param {THREE.Mesh} auraMesh The aura mesh to verify
 * @returns {Object} Verification report
 */
export function verifyFresnelAuraIntegration(auraMesh) {
  const report = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (!auraMesh) {
    report.valid = false;
    report.errors.push('Aura mesh is null/undefined');
    return report;
  }

  if (!auraMesh.material) {
    report.valid = false;
    report.errors.push('Aura mesh missing material');
    return report;
  }

  if (auraMesh.material.type !== 'ShaderMaterial') {
    report.warnings.push('Aura material is not a ShaderMaterial (expected for fresnel shader)');
  }

  const uniforms = auraMesh.material.uniforms || {};

  // Check required uniforms
  const requiredUniforms = [
    'uTime',
    'uAuraStrength',
    'uAuraOpacity',
    'uAuraRadius',
    'uAuraPulse',
    'uAuraColor',
    'uRimPower',
    'uRimScale',
  ];

  for (const uniform of requiredUniforms) {
    if (!(uniform in uniforms)) {
      report.errors.push(`Missing uniform: ${uniform}`);
      report.valid = false;
    }
  }

  if (!auraMesh.userData.isAura) {
    report.warnings.push('Aura userData.isAura not set');
  }

  if (auraMesh.renderOrder !== -1) {
    report.warnings.push(`Aura renderOrder is ${auraMesh.renderOrder} (expected -1)`);
  }

  return report;
}

/**
 * Console diagnostics for fresnel aura patch
 */
export function printFresnelAuraDiagnostics() {
  console.log('=== FRESNEL AURA PATCH DIAGNOSTICS ===');
  console.log('Patch Config:', patchConfig);
  console.log('Variant:', patchConfig.variant);
  console.log('Rim Power:', patchConfig.rimPower);
  console.log('Rim Scale:', patchConfig.rimScale);
  console.log('Fresnel Range:', [patchConfig.fresnelMin, patchConfig.fresnelMax]);
  console.log('=====================================');
}

// Export everything
export default {
  patch: patchAINodesToUseFresnelAuras,
  configure: configureFresnelAuraPatch,
  create: createFresnelAura,
  updateUniforms: updateFresnelAuraUniforms,
  batchUpdate: batchUpdateFresnelAuraUniforms,
  verify: verifyFresnelAuraIntegration,
  diagnostics: printFresnelAuraDiagnostics,
};
