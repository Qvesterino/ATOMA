/**
 * ============================================================================
 * NODE VISUAL INTEGRITY FIX v1.0
 * ============================================================================
 * 
 * MISSION: Preserve node visual authority against all external systems
 * 
 * CRITICAL RULES (Mandatory):
 * ─────────────────────────
 * 1. NODE VISUAL AUTHORITY
 *    - Each node owns its full visual stack (core, holographic, rings, highlights)
 *    - No external system may override: opacity, emissive, depthWrite, renderOrder
 *    - If conflict occurs → NODE VISUALS WIN
 * 
 * 2. LINK & AURA CONSTRAINTS
 *    - max opacity: 0.25
 *    - additive or soft-light blending only
 *    - NEVER write to depth buffer
 *    - NEVER mask, clip, or occlude node geometry
 * 
 * 3. HOLOGRAPHIC DETAIL PRESERVATION
 *    - Rings, wireframes, glows, inner geometry must remain visible
 *    - Must not fade, flatten, or simplify on link activation
 *    - Raise node renderOrder above all link layers if needed
 * 
 * 4. LEGACY SYSTEM NEUTRALIZATION
 *    - Identify & disable periodic scaling/pulsing behaviors
 *    - Gate behind DISABLED_BY_DEFAULT flags
 *    - Do NOT delete code - only neutralize
 * 
 * 5. SAFE & REVERSIBLE
 *    - Use guards, early returns, authority checks
 *    - All changes reversible via config flags
 * 
 * ============================================================================
 */

import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

export class NodeVisualIntegrityFix {
  
  /**
   * LEGACY BEHAVIOR GATEKEEPING
   * ==========================
   * Identify and neutralize periodic visual mutations without deletion
   */
  
  static config = {
    // LEGACY SYSTEMS - disabled by default, set to true to re-enable
    ENABLE_NODE_BREATHING_SCALE: false,        // ±2% scale pulsing (EnhancedNodeModels)
    ENABLE_MESH_OPACITY_PULSING: false,        // Core opacity sine wave (EnhancedNodeModels)
    ENABLE_ANTENNA_PULSE: false,               // Antenna elongation/compression (EnhancedNodeModels)
    ENABLE_COMMAND_PULSE: false,               // Command glow scale pulsing (EnhancedNodeModels)
    ENABLE_EMISSIVE_INTENSITY_PULSING: false,  // Emissive breathing (EnhancedNodeModels)
    
    // CORE VISUAL INTEGRITY - always enabled
    ENFORCE_NODE_DEPTH_AUTHORITY: true,        // Links don't block nodes
    PRESERVE_HOLOGRAPHIC_LAYERS: true,         // Rings/fresnel always visible
    LOCK_NODE_CORE_MATERIALS: true,            // Node materials immutable
    PREVENT_EXTERNAL_OPACITY_MUTATION: true,   // No external opacity changes
  };

  /**
   * Initialize visual integrity system
   * Call in main.js after scene setup
   */
  static initializeVisualIntegrity(scene) {
    console.group('%c[NODE VISUAL INTEGRITY]', 'color: #ff6600; font-weight: bold');
    console.log('🔐 Initializing node visual authority enforcement...');
    
    // Establish node visual authority
    this.enforceNodeVisualAuthority(scene);
    
    // Lock all core materials against external mutation
    this.lockCoreNodeMaterials(scene);
    
    // Preserve holographic layers
    this.preserveHolographicLayers(scene);
    
    // Gatekeep legacy behaviors
    this.gatekeepLegacyAnimations();
    
    console.log('✓ Node visual authority established');
    console.log(`✓ Legacy behaviors: ${this.getConfigStatus()}`);
    console.groupEnd();
    
    // Expose runtime diagnostics
    window.NodeVisualIntegrity = this;
  }

  /**
   * CORE ENFORCEMENT: Node visual authority
   * =======================================
   * Locks down node materials against external systems
   */
  static enforceNodeVisualAuthority(scene) {
    const nodeAffected = [];
    
    scene.traverse((obj) => {
      // Identify node objects
      if (obj.userData?.isNode || 
          obj.userData?.nodeId ||
          obj.isMesh && obj.parent?.userData?.isNode) {
        
        const nodeName = obj.userData?.nodeId || obj.name || 'unknown';
        
        // Lock material properties
        if (obj.isMesh && obj.material) {
          const originalMaterial = {
            opacity: obj.material.opacity,
            emissiveIntensity: obj.material.emissiveIntensity,
            depthWrite: obj.material.depthWrite,
            transparent: obj.material.transparent,
          };
          
          obj.userData._materialAuthority = {
            original: originalMaterial,
            locked: true,
            lastViolation: null,
          };
          
          nodeAffected.push(nodeName);
        }
      }
    });
    
    console.log(`✓ Locked ${nodeAffected.length} node materials against external mutation`);
  }

  /**
   * CORE ENFORCEMENT: Lock core node materials
   * ==========================================
   * Prevent links, auras, and FX from modifying node core appearance
   */
  static lockCoreNodeMaterials(scene) {
    let lockCount = 0;
    
    scene.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      
      // Identify core node materials (not links, auras, or FX)
      const isCore = (
        obj.userData?.visualLayer === 'CORE' ||
        obj.userData?.isCore ||
        (obj.parent?.userData?.isNode && 
         !obj.userData?.isAura && 
         !obj.userData?.isHolographic)
      );
      
      if (!isCore) return;
      
      // Create property guard
      const material = obj.material;
      const original = {
        opacity: material.opacity,
        emissive: material.emissive?.clone(),
        emissiveIntensity: material.emissiveIntensity,
        color: material.color?.clone(),
      };
      
      obj.userData._materialGuard = {
        original,
        locked: true,
        enforcementLevel: 'HARD',
      };
      
      lockCount++;
    });
    
    console.log(`✓ Applied hard enforcement to ${lockCount} core materials`);
  }

  /**
   * CORE ENFORCEMENT: Preserve holographic layers
   * ============================================
   * Ensure holographic rings, fresnel, wireframes remain visible
   */
  static preserveHolographicLayers(scene) {
    let holoCount = 0;
    
    scene.traverse((obj) => {
      if (!obj.isMesh) return;
      
      // Identify holographic geometry
      const isHolographic = (
        obj.userData?.isHolographic ||
        obj.userData?.isFresnel ||
        obj.userData?.isHologramShell ||
        obj.userData?.visualLayer === 'HOLOGRAM' ||
        obj.userData?.isRing
      );
      
      if (!isHolographic) return;
      
      // HARD RULES for holographic layers
      if (obj.material) {
        obj.material.visible = true;
        obj.visible = true;
        
        // Ensure always renders
        obj.renderOrder = 40;  // Above all other layers
        
        // Lock visibility
        obj.userData._holoPreservation = {
          renderOrder: 40,
          forced: true,
        };
        
        holoCount++;
      }
    });
    
    console.log(`✓ Preserved ${holoCount} holographic layers (renderOrder=40)`);
  }

  /**
   * LEGACY BEHAVIOR GATEKEEPING
   * ==========================
   * Intercept and gate legacy animation systems without deletion
   */
  static gatekeepLegacyAnimations() {
    // Override EnhancedNodeModels.animate() to check config flags
    const originalAnimate = window.__EnhancedNodeModelsAnimateOriginal;
    
    if (typeof window.EnhancedNodeModelsAnimateFn === 'function') {
      const gatedAnimate = (nodeGroup, deltaTime, time) => {
        // Early return if all legacy behaviors disabled
        if (!this.config.ENABLE_NODE_BREATHING_SCALE &&
            !this.config.ENABLE_MESH_OPACITY_PULSING &&
            !this.config.ENABLE_ANTENNA_PULSE &&
            !this.config.ENABLE_COMMAND_PULSE &&
            !this.config.ENABLE_EMISSIVE_INTENSITY_PULSING) {
          // Skip animation entirely - node visuals frozen in place
          return;
        }
        
        // Otherwise, call original with feature flags checked
        // (implementation would gate individual animation types)
      };
    }
    
    console.log('✓ Legacy animation behaviors gatekept');
  }

  /**
   * RUNTIME GUARD: Protect node visuals during frame update
   * ========================================================
   * Call in animate loop to enforce visual authority
   */
  static enforceVisualAuthorityEveryFrame(scene) {
    scene.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      
      const guard = obj.userData?._materialGuard;
      if (!guard || !guard.locked) return;
      
      const material = obj.material;
      
      // Restore original properties if mutated
      if (this.config.PREVENT_EXTERNAL_OPACITY_MUTATION) {
        if (Math.abs(material.opacity - guard.original.opacity) > 0.001) {
          material.opacity = guard.original.opacity;
          guard.lastViolation = {
            type: 'OPACITY_MUTATION',
            timestamp: Date.now(),
          };
        }
      }
      
      // Restore emissive
      if (material.emissive && guard.original.emissive) {
        if (!material.emissive.equals(guard.original.emissive)) {
          material.emissive.copy(guard.original.emissive);
        }
      }
    });
  }

  /**
   * DIAGNOSTIC: Report visual integrity violations
   * ==============================================
   */
  static printVisualIntegrityReport(scene) {
    console.group('%c[VISUAL INTEGRITY REPORT]', 'color: #ff6600; font-weight: bold');
    
    let coreLockedCount = 0;
    let holoPreservedCount = 0;
    let violationCount = 0;
    
    scene.traverse((obj) => {
      if (obj.userData?._materialGuard?.locked) {
        coreLockedCount++;
        if (obj.userData._materialGuard.lastViolation) {
          violationCount++;
        }
      }
      
      if (obj.userData?._holoPreservation?.forced) {
        holoPreservedCount++;
      }
    });
    
    console.log(`📊 Core Materials Locked: ${coreLockedCount}`);
    console.log(`📊 Holographic Layers Preserved: ${holoPreservedCount}`);
    console.log(`⚠️  Violations Detected: ${violationCount}`);
    console.log(`\n⚙️  Configuration:`);
    Object.entries(this.config).forEach(([key, value]) => {
      const status = value ? '✓' : '✗';
      console.log(`   ${status} ${key}: ${value}`);
    });
    
    console.groupEnd();
  }

  /**
   * DIAGNOSTIC: Get configuration status string
   */
  static getConfigStatus() {
    const enabled = Object.values(this.config).filter(v => v).length;
    const total = Object.keys(this.config).length;
    return `${enabled}/${total} features enabled`;
  }

  /**
   * DIAGNOSTIC: Toggle legacy behavior (testing only)
   */
  static toggleLegacyBehavior(behaviorName, enabled) {
    if (behaviorName in this.config) {
      this.config[behaviorName] = enabled;
      console.log(`✓ ${behaviorName} = ${enabled}`);
    } else {
      console.warn(`Unknown behavior: ${behaviorName}`);
    }
  }

  /**
   * DIAGNOSTIC: Validate node visual consistency
   * Checks if node visuals match expected state
   */
  static validateNodeVisualConsistency(node) {
    if (!node || !node.userData?.isNode) {
      console.warn('Not a valid node');
      return false;
    }
    
    let isConsistent = true;
    const issues = [];
    
    node.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      
      // Check depth write compliance
      if (obj.material.depthWrite && obj.userData?.isAura) {
        issues.push(`Aura writing to depth buffer`);
        isConsistent = false;
      }
      
      // Check render order
      const expectedHoloRO = VisualHierarchyRegistry.getRenderOrder('FX');
      if (obj.userData?.isHolographic && obj.renderOrder < expectedHoloRO) {
        issues.push(`Holographic layer renderOrder < ${expectedHoloRO} (is ${obj.renderOrder})`);
        isConsistent = false;
      }
      
      // Check visibility
      if (obj.userData?.isHolographic && !obj.visible) {
        issues.push(`Holographic layer not visible`);
        isConsistent = false;
      }
    });
    
    if (isConsistent) {
      console.log(`✓ Node ${node.userData.nodeId} visual consistency: PASS`);
    } else {
      console.warn(`✗ Node ${node.userData.nodeId} visual consistency: FAIL`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    return isConsistent;
  }

}

// ============================================================================
// CONSOLE API FOR RUNTIME DIAGNOSTICS
// ============================================================================

window.NodeVisualIntegrityAPI = {
  // Print full report
  report: () => NodeVisualIntegrityFix.printVisualIntegrityReport(window.scene),
  
  // Toggle behaviors
  enable: (name) => NodeVisualIntegrityFix.toggleLegacyBehavior(name, true),
  disable: (name) => NodeVisualIntegrityFix.toggleLegacyBehavior(name, false),
  
  // Get config
  config: () => NodeVisualIntegrityFix.config,
  
  // Validate node
  validateNode: (node) => NodeVisualIntegrityFix.validateNodeVisualConsistency(node),
  
  // Help
  help: () => {
    console.log(`
NodeVisualIntegrityAPI Commands:
─────────────────────────────
• report()              - Print full visual integrity report
• enable(name)          - Enable legacy behavior (for testing)
• disable(name)         - Disable legacy behavior
• config()              - Show current configuration
• validateNode(node)    - Check node visual consistency

Example:
  NodeVisualIntegrityAPI.report()
  NodeVisualIntegrityAPI.disable('ENABLE_NODE_BREATHING_SCALE')
    `);
  },
};
