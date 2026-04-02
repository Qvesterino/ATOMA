import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

const LAYER_POLICY = {
  LINK_CORE: {
    registryKey: 'LINK_CORE',
    transparent: false,
    depthWrite: true,
    depthTest: true,
    blending: THREE.NormalBlending
  },
  LINK_CORE_OVERLAY: {
    registryKey: 'LINK_CORE_OVERLAY',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending
  },
  LINK_STRANDS: {
    registryKey: 'LINK_STRANDS',
    transparent: false,
    depthWrite: true,
    depthTest: true,
    blending: THREE.NormalBlending
  },
  LINK_SKIN: {
    registryKey: 'LINK_SKIN',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending
  },
  LINK_DIRECTIONAL: {
    registryKey: 'LINK_DIRECTIONAL',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending
  },
  LINK_RING: {
    registryKey: 'LINK_RING',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending
  },
  LINK_PULSE: {
    registryKey: 'LINK_PULSE',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending
  },
  LINK_GLOW: {
    registryKey: 'LINK_GLOW',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending
  },
  LINK_ARCS: {
    registryKey: 'LINK_ARCS',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending
  },
  LINK_WAVES: {
    registryKey: 'LINK_WAVES',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending
  },
  LINK_CASCADE: {
    registryKey: 'LINK_CASCADE',
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending
  },
  LINK_RESONANCE: {
    registryKey: 'LINK_RESONANCE',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending
  },
  LINK_PICTOGRAMS: {
    registryKey: 'LINK_PICTOGRAMS',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending
  },
  LINK_PICTO: {
    registryKey: 'LINK_PICTO',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending
  },
  LINK_BEADS: {
    registryKey: 'LINK_BEADS',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending
  },
  LINK_BEAD_TRAILS: {
    registryKey: 'LINK_BEAD_TRAILS',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending
  },
  LINK_SPARKS: {
    registryKey: 'LINK_SPARKS',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending
  },
  LINK_IMPACTS: {
    registryKey: 'LINK_IMPACTS',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending
  },
  LINK_PARTICLES: {
    registryKey: 'LINK_PARTICLES',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending
  }
};

const LINK_BOOTSTRAP_POLICY = {
  minBudget: 1,
  maxBudget: 4,
  perLinkSlope: 0.18,
  heavyTickBias: 1.35,
  visualTickBias: 1.0
};

const LINK_EFFECT_CADENCE_POLICY = {
  harmonic: 1,
  resonanceFlow: 1,
  dock: 1,
  sourceInjection: 1,
  beads: 1,
  beadTrails: 1,
  energyRingSystem: 1,
  directionalStreaks: 2,
  pulseRing: 1,
  arcDischarges: 1,
  ringPulseDustEmitter: 1,
  particleSystem: 1,
  sparks: 1,
  trailParticles: 1,
  healingParticles: 1,
  corruptionParticles: 1,
  corruptionSpread: 1,
  trailEmitter: 1,
  healingEmitter: 1
};

const LINK_DISTANCE_LOD_POLICY = {
  0: {
    visualScale: 1.0,
    particleScale: 1.0,
    motionScale: 1.0,
    cadenceScale: 1.0,
    allowDockSpray: true,
    allowSourceInjection: true,
    allowBeads: true,
    allowBeadTrails: true,
    allowEnergyRingSystem: true,
    allowDirectionalStreaks: true,
    allowPulseRing: true,
    allowArcDischarges: true,
    allowRingPulseDustEmitter: true,
    allowParticleSystem: true,
    allowSparks: true,
    allowTrailParticles: true,
    allowHealingParticles: true,
    allowCorruptionParticles: true,
    allowCorruptionSpread: true,
    allowTrailEmitter: true,
    allowHealingEmitter: true,
    allowHarmonic: true
  },
  1: {
    visualScale: 0.78,
    particleScale: 0.65,
    motionScale: 0.82,
    cadenceScale: 1.5,
    allowDockSpray: true,
    allowSourceInjection: true,
    allowBeads: true,
    allowBeadTrails: true,
    allowEnergyRingSystem: true,
    allowDirectionalStreaks: true,
    allowPulseRing: true,
    allowArcDischarges: true,
    allowRingPulseDustEmitter: true,
    allowParticleSystem: true,
    allowSparks: true,
    allowTrailParticles: true,
    allowHealingParticles: true,
    allowCorruptionParticles: true,
    allowCorruptionSpread: true,
    allowTrailEmitter: true,
    allowHealingEmitter: true,
    allowHarmonic: true
  },
  2: {
    visualScale: 0.68,
    particleScale: 0.45,
    motionScale: 0.72,
    cadenceScale: 2.0,
    allowDockSpray: false,
    allowSourceInjection: false,
    allowBeads: true,
    allowBeadTrails: true,
    allowEnergyRingSystem: true,
    allowDirectionalStreaks: true,
    allowPulseRing: true,
    allowArcDischarges: true,
    allowRingPulseDustEmitter: true,
    allowParticleSystem: true,
    allowSparks: true,
    allowTrailParticles: true,
    allowHealingParticles: true,
    allowCorruptionParticles: true,
    allowCorruptionSpread: true,
    allowTrailEmitter: true,
    allowHealingEmitter: true,
    allowHarmonic: true
  },
  3: {
    visualScale: 0.35,
    particleScale: 0.15,
    motionScale: 0.45,
    cadenceScale: 4.0,
    allowDockSpray: false,
    allowSourceInjection: false,
    allowBeads: true,
    allowBeadTrails: false,
    allowEnergyRingSystem: true,
    allowDirectionalStreaks: false,
    allowPulseRing: true,
    allowArcDischarges: false,
    allowRingPulseDustEmitter: false,
    allowParticleSystem: true,
    allowSparks: true,
    allowTrailParticles: true,
    allowHealingParticles: true,
    allowCorruptionParticles: true,
    allowCorruptionSpread: false,
    allowTrailEmitter: false,
    allowHealingEmitter: false,
    allowHarmonic: false
  }
};

function warn(message, details) {
  if (!(typeof window !== 'undefined' && window.ATOMA_FLAGS?.debug?.renderDiscipline === true)) return;
  console.warn(`[LinkRenderLayerPolicy] ${message}`, details || '');
}

function getPolicy(layerKey) {
  const policy = LAYER_POLICY[layerKey];
  if (!policy) {
    throw new Error(`Unknown link render layer: ${layerKey}`);
  }
  return policy;
}

export function getLinkBootstrapBudget(linkCount, frameFlags = {}) {
  const count = Math.max(0, Number(linkCount) || 0);
  if (count <= 0) return 0;

  const heavyTick = frameFlags.heavyTick !== false;
  const run30 = frameFlags.run30 !== false;
  if (!run30) return 0;

  const base = LINK_BOOTSTRAP_POLICY.minBudget;
  const scaled = base + Math.floor(Math.max(0, count - 1) * LINK_BOOTSTRAP_POLICY.perLinkSlope);
  const biased = Math.round(scaled * (heavyTick ? LINK_BOOTSTRAP_POLICY.heavyTickBias : LINK_BOOTSTRAP_POLICY.visualTickBias));
  return Math.max(LINK_BOOTSTRAP_POLICY.minBudget, Math.min(LINK_BOOTSTRAP_POLICY.maxBudget, biased));
}

function hashLinkEffectKey(linkKey) {
  const value = String(linkKey || 'link');
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function shouldRunLinkEffect(linkKey, effectKey, frameFlags = {}, effectFrameIndex = 0) {
  const run30 = frameFlags.run30 !== false;
  if (!run30) return false;

  const cadence = Math.max(1, Number(LINK_EFFECT_CADENCE_POLICY[effectKey]) || 1);
  if (cadence <= 1) return true;

  const frameIndex = Math.max(0, Number(effectFrameIndex) || 0);
  const phase = hashLinkEffectKey(`${linkKey || 'link'}:${effectKey || 'effect'}`) % cadence;
  return ((frameIndex + phase) % cadence) === 0;
}

function getDistancePolicyLevel(lodLevel = 0) {
  const level = Math.max(0, Math.min(3, Number.isFinite(lodLevel) ? Math.floor(lodLevel) : 0));
  return LINK_DISTANCE_LOD_POLICY[level] || LINK_DISTANCE_LOD_POLICY[3];
}

export function getLinkDistancePolicy(lodLevel = 0) {
  const level = Math.max(0, Math.min(3, Number.isFinite(lodLevel) ? Math.floor(lodLevel) : 0));
  const policy = getDistancePolicyLevel(level);
  return {
    ...policy,
    lodLevel: level,
    allowParticles: policy.particleScale > 0 && policy.allowParticleSystem !== false,
    allowSecondaryVfx: policy.allowDirectionalStreaks || policy.allowBeadTrails || policy.allowArcDischarges || policy.allowRingPulseDustEmitter || level >= 3,
    allowDecorativeVfx: policy.allowDockSpray || policy.allowSourceInjection || policy.allowTrailEmitter || policy.allowHealingEmitter,
    allowCoreVfx: true
  };
}

export function getLinkDistanceScale(lodLevel = 0) {
  return getLinkDistancePolicy(lodLevel).visualScale;
}

export function getLinkDistanceParticleScale(lodLevel = 0) {
  return getLinkDistancePolicy(lodLevel).particleScale;
}

function applyToMaterial(material, policy, overrides = {}) {
  if (!material) return;
  const target = { ...policy, ...overrides };
  let changed = false;

  const assignIfDifferent = (key, value) => {
    if (value === undefined) return;
    if (material[key] !== value) {
      material[key] = value;
      changed = true;
    }
  };

  assignIfDifferent('transparent', target.transparent);
  assignIfDifferent('depthWrite', target.depthWrite);
  assignIfDifferent('depthTest', target.depthTest);
  assignIfDifferent('blending', target.blending);
  assignIfDifferent('side', target.side);
  assignIfDifferent('colorWrite', target.colorWrite);
  assignIfDifferent('polygonOffset', target.polygonOffset);
  assignIfDifferent('polygonOffsetFactor', target.polygonOffsetFactor);
  assignIfDifferent('polygonOffsetUnits', target.polygonOffsetUnits);

  if (changed) {
    material.needsUpdate = true;
  }

  if (material.transparent === true && material.depthWrite === true) {
    warn('transparent + depthWrite true is forbidden', { material, target });
  }
  if (material.depthTest === false && policy.depthTest !== false && target.allowDepthTestFalse !== true) {
    warn('depthTest false is forbidden for normal link layers', { material, target });
  }
}

export function applyLinkRenderLayer(target, layerKey, options = {}) {
  const policy = getPolicy(layerKey);
  const renderOrder = VisualHierarchyRegistry.getRenderOrder(policy.registryKey);
  const materialOverrides = options.materialOverrides || {};
  const orderOverride = options.renderOrder;

  if (target?.isMaterial) {
    applyToMaterial(target, policy, materialOverrides);
    if (orderOverride !== undefined) {
      warn('manual renderOrder override ignored for material-only target', { layerKey, orderOverride });
    }
    return renderOrder;
  }

  if (!target) return renderOrder;

  if (target.material) {
    if (Array.isArray(target.material)) {
      target.material.forEach((mat) => applyToMaterial(mat, policy, materialOverrides));
    } else {
      applyToMaterial(target.material, policy, materialOverrides);
    }
  }

  const finalOrder = orderOverride ?? renderOrder;
  target.renderOrder = finalOrder;

  if (orderOverride !== undefined && orderOverride !== renderOrder) {
    warn('manual renderOrder override used outside canonical registry value', {
      layerKey,
      renderOrder,
      orderOverride
    });
  }

  return finalOrder;
}

export function getLinkRenderLayerOrder(layerKey) {
  const policy = getPolicy(layerKey);
  return VisualHierarchyRegistry.getRenderOrder(policy.registryKey);
}

export function validateLinkRenderObject(target, layerKey, options = {}) {
  if (!target?.material) return true;
  const policy = getPolicy(layerKey);
  const expectedOrder = options.renderOrder ?? VisualHierarchyRegistry.getRenderOrder(policy.registryKey);
  const materials = Array.isArray(target.material) ? target.material : [target.material];
  let valid = target.renderOrder === expectedOrder;

  if (!valid) {
    warn('renderOrder mismatch', { target, layerKey, expectedOrder, actual: target.renderOrder });
  }

  materials.forEach((material) => {
    if (material.transparent !== policy.transparent ||
        material.depthWrite !== policy.depthWrite ||
        material.depthTest !== policy.depthTest ||
        material.blending !== policy.blending) {
      valid = false;
      warn('material policy mismatch', { target, layerKey, material, expected: policy });
    }
  });

  return valid;
}

export default applyLinkRenderLayer;
