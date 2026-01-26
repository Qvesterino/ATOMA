/**
 * ============================================================================
 * PARTICLE EMISSION INTEGRATION PATCH v1.0
 * ============================================================================
 * 
 * RESPONSIBILITY:
 * Integrate ParticleEmissionScaler with existing particle systems:
 * - NeonLinkVisuals (link particles)
 * - NodeAuraSystem (aura particles)
 * - Other particle emitters
 * 
 * PATTERN:
 * Get emission multiplier from scaler and apply to particle systems
 * 
 * USAGE:
 * import { setupParticleEmissionIntegration } from './ParticleEmissionIntegrationPatch.js';
 * setupParticleEmissionIntegration(main);
 * 
 * ============================================================================
 */

/**
 * Setup particle emission integration
 * Call once during initialization
 * @param {Object} main - Main game instance
 */
export function setupParticleEmissionIntegration(main) {
  if (!main.particleEmissionScaler) {
    console.warn('[ParticleEmissionIntegrationPatch] Scaler not initialized');
    return;
  }
  
  // Hook NeonLinkVisuals particle generation
  if (main.neonLinkVisuals) {
    hookNeonLinkVisualsParticles(main);
  }
  
  // Hook NodeAuraSystem if available
  if (main.aiNodes?.auraSystem) {
    hookNodeAuraSystemParticles(main);
  }
  
  console.log('[ParticleEmissionIntegrationPatch] Integration setup complete');
}

/**
 * Hook NeonLinkVisuals to use emission scaler
 * @private
 */
function hookNeonLinkVisualsParticles(main) {
  const neonLinkVisuals = main.neonLinkVisuals;
  const emissionScaler = main.particleEmissionScaler;
  
  // Store original updateParticles method
  const originalUpdateParticles = neonLinkVisuals.updateParticles.bind(neonLinkVisuals);
  
  // Replace with scaler-aware version
  neonLinkVisuals.updateParticles = function(deltaTime) {
    if (!main.frameScheduler?.shouldRunVisual?.()) return;
    
    // Get network-wide emission multiplier
    const networkMultiplier = emissionScaler.getEmissionMultiplier();
    
    // Store original config
    const originalParticleConfig = { ...this.config };
    
    // Apply multiplier to particle count
    this.config.particleCount *= networkMultiplier;
    this.config.particleSpeed *= Math.sqrt(networkMultiplier); // Speed increases with sqrt
    
    // Call original update
    originalUpdateParticles(deltaTime);
    
    // Restore config
    this.config = originalParticleConfig;
  };
  
  console.log('[ParticleEmissionIntegrationPatch] NeonLinkVisuals hooked');
}

/**
 * Hook NodeAuraSystem to use emission scaler
 * @private
 */
function hookNodeAuraSystemParticles(main) {
  const auraSystem = main.aiNodes.auraSystem;
  const emissionScaler = main.particleEmissionScaler;
  
  if (!auraSystem || !auraSystem.update) {
    return;
  }
  
  // Store original update
  const originalAuraUpdate = auraSystem.update.bind(auraSystem);
  
  // Replace with scaler-aware version
  auraSystem.update = function(deltaTime) {
    if (!main.frameScheduler?.shouldRunVisual?.()) return;
    
    // Get network emission multiplier
    const networkMultiplier = emissionScaler.getEmissionMultiplier();
    
    // Call original update
    originalAuraUpdate(deltaTime);
    
    // Apply emission scaling to active auras
    if (this.auras) {
      for (const [nodeKey, aura] of this.auras) {
        if (!aura.material || !aura.material.uniforms) continue;
        
        // Scale particle emission in shader uniforms
        const nodeMultiplier = emissionScaler.getNodeEmissionMultiplier(aura.node);
        const combinedMultiplier = networkMultiplier * nodeMultiplier;
        
        // Apply to shader uniform if it exists
        if (aura.material.uniforms.uParticleEmission) {
          aura.material.uniforms.uParticleEmission.value = combinedMultiplier;
        }
      }
    }
  };
  
  console.log('[ParticleEmissionIntegrationPatch] NodeAuraSystem hooked');
}

/**
 * Apply emission multiplier to a link's particle generation
 * Call per-frame if custom logic needed
 * @param {Object} link - Link to scale
 * @param {Object} emissionScaler - ParticleEmissionScaler instance
 * @param {number} baseParticleCount - Base number of particles
 * @returns {number} Scaled particle count
 */
export function getScaledParticleCount(link, emissionScaler, baseParticleCount) {
  if (!emissionScaler || !link) return baseParticleCount;
  
  const networkMultiplier = emissionScaler.getEmissionMultiplier();
  const linkMultiplier = emissionScaler.getLinkEmissionMultiplier(link);
  const combinedMultiplier = networkMultiplier * linkMultiplier;
  
  return Math.round(baseParticleCount * combinedMultiplier);
}

/**
 * Apply emission multiplier to a node's particle generation
 * @param {Object} node - Node to scale
 * @param {Object} emissionScaler - ParticleEmissionScaler instance
 * @param {number} baseParticleCount - Base particle count
 * @returns {number} Scaled particle count
 */
export function getScaledNodeParticleCount(node, emissionScaler, baseParticleCount) {
  if (!emissionScaler || !node) return baseParticleCount;
  
  const networkMultiplier = emissionScaler.getEmissionMultiplier();
  const nodeMultiplier = emissionScaler.getNodeEmissionMultiplier(node);
  const combinedMultiplier = networkMultiplier * nodeMultiplier;
  
  return Math.round(baseParticleCount * combinedMultiplier);
}

/**
 * Create a particle emitter controller that uses emission scaler
 * @param {Object} emissionScaler - ParticleEmissionScaler instance
 * @param {Object} options - Emitter configuration
 * @returns {Object} Emitter controller
 */
export function createScaledParticleEmitter(emissionScaler, options = {}) {
  return {
    baseEmissionRate: options.baseEmissionRate ?? 10,
    maxEmissionRate: options.maxEmissionRate ?? 50,
    emissionScaler,
    
    // Get current scaled emission rate
    getEmissionRate() {
      const networkMultiplier = this.emissionScaler.getEmissionMultiplier();
      const scaled = this.baseEmissionRate * networkMultiplier;
      return Math.min(this.maxEmissionRate, scaled);
    },
    
    // Get emission rate for specific link
    getLinkEmissionRate(link) {
      const networkMultiplier = this.emissionScaler.getEmissionMultiplier();
      const linkMultiplier = this.emissionScaler.getLinkEmissionMultiplier(link);
      const scaled = this.baseEmissionRate * networkMultiplier * linkMultiplier;
      return Math.min(this.maxEmissionRate, scaled);
    },
    
    // Get emission rate for specific node
    getNodeEmissionRate(node) {
      const networkMultiplier = this.emissionScaler.getEmissionMultiplier();
      const nodeMultiplier = this.emissionScaler.getNodeEmissionMultiplier(node);
      const scaled = this.baseEmissionRate * networkMultiplier * nodeMultiplier;
      return Math.min(this.maxEmissionRate, scaled);
    },
  };
}
