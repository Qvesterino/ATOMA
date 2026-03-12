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

function applyToMaterial(material, policy, overrides = {}) {
  if (!material) return;
  const target = { ...policy, ...overrides };
  if (target.transparent !== undefined) material.transparent = target.transparent;
  if (target.depthWrite !== undefined) material.depthWrite = target.depthWrite;
  if (target.depthTest !== undefined) material.depthTest = target.depthTest;
  if (target.blending !== undefined) material.blending = target.blending;
  if (target.side !== undefined) material.side = target.side;
  if (target.colorWrite !== undefined) material.colorWrite = target.colorWrite;
  if (target.polygonOffset !== undefined) material.polygonOffset = target.polygonOffset;
  if (target.polygonOffsetFactor !== undefined) material.polygonOffsetFactor = target.polygonOffsetFactor;
  if (target.polygonOffsetUnits !== undefined) material.polygonOffsetUnits = target.polygonOffsetUnits;
  material.needsUpdate = true;

  if (material.transparent === true && material.depthWrite === true) {
    warn('transparent + depthWrite true is forbidden', { material, target });
  }
  if (material.depthTest === false && target.allowDepthTestFalse !== true) {
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
