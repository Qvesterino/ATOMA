/**
 * PHASE 3C WEEK 6: PERSONALITY MATERIAL PROFILE REGISTRY
 * 
 * Automatically assigns shader distortion profiles to node materials
 * based on node category, with full extensibility and defensive coding.
 * 
 * PURPOSE:
 * - Auto-detect node categories and assign appropriate GPU distortion profiles
 * - Integrate PersonalityShaderAdvancedFX_v1 material registration
 * - Support dynamic node spawning during gameplay
 * - Provide extensible profile mapping system
 * 
 * SAFETY:
 * - Defensive: handles missing data gracefully
 * - Additive: no file modifications required
 * - Reversible: materials can be unregistered anytime
 * - Works with LowFX and HighFX modes
 * - Supports both single materials and material arrays
 * 
 * PROFILE MAPPING:
 * - control            → focus_warp
 * - integration        → resonance_wave
 * - analytics          → clarity_bloom
 * - storage            → default
 * - sigma              → chaos_distortion
 * - emotional          → energy_ripple
 * - corrupted          → corruption_fracture
 * - corrupted_node     → corruption_fracture
 * - mythical           → blended
 * - prime              → blended
 * - (default)          → default
 */

export class PersonalityMaterialProfileRegistry_v1 {
  constructor(options = {}) {
    // Reference to AdvancedFX system
    this.advancedFX = options.advancedFX || null;
    
    // Enable debug logging
    this.debugEnabled = options.debugEnabled === true;
    
    // Track registered nodes
    this.registeredNodes = new Map();
    this.materialToProfile = new WeakMap();
    
    // Default profile mapping (node category → distortion profile)
    this.profileMap = {
      'control': 'focus',
      'integration': 'resonance',
      'analytics': 'default',
      'storage': 'default',
      'sigma': 'chaos',
      'emotional': 'energy',
      'corrupted': 'corruption',
      'corrupted_node': 'corruption',
      'mythical': 'default',
      'prime': 'default',
    };
    
    // Allow custom profile mapping extension
    this.customProfileMap = options.profileMap || {};
    
    // Merge custom profile map
    this.profileMap = { ...this.profileMap, ...this.customProfileMap };
    
    if (this.debugEnabled) {
      console.log('[Registry] PersonalityMaterialProfileRegistry_v1 initialized', {
        advancedFXPresent: !!this.advancedFX,
        profileCount: Object.keys(this.profileMap).length,
      });
    }
  }

  /**
   * Extract node category from node object
   * Handles multiple naming conventions
   */
  _getNodeCategory(node) {
    if (!node) return null;
    
    // Direct category field (most common)
    if (node.category && typeof node.category === 'string') {
      return node.category.toLowerCase().trim();
    }
    
    // Check nodeType as fallback
    if (node.nodeType && typeof node.nodeType === 'string') {
      return node.nodeType.toLowerCase().trim();
    }
    
    // Check type as fallback
    if (node.type && typeof node.type === 'string') {
      return node.type.toLowerCase().trim();
    }
    
    return null;
  }

  /**
   * Map category to distortion profile
   * Returns 'default' as ultimate fallback
   */
  _getCategoryProfile(category) {
    if (!category) return 'default';
    
    const categoryLower = String(category).toLowerCase().trim();
    
    // Direct match in profile map
    if (this.profileMap[categoryLower]) {
      return this.profileMap[categoryLower];
    }
    
    // Partial matches for flexibility
    for (const [key, profile] of Object.entries(this.profileMap)) {
      if (categoryLower.includes(key) || key.includes(categoryLower)) {
        return profile;
      }
    }
    
    // Ultimate fallback
    return 'default';
  }

  /**
   * Extract materials from a node/mesh object
   * Handles: mesh.material, mesh.material[], mesh.materials
   * Returns array of materials
   */
  _extractMaterials(node) {
    const materials = [];
    
    if (!node) return materials;
    
    // Try common material property names
    const candidates = [
      node.material,
      node.materials,
      node.mesh?.material,
      node.mesh?.materials,
    ];
    
    for (const candidate of candidates) {
      if (!candidate) continue;
      
      // Material array
      if (Array.isArray(candidate)) {
        materials.push(...candidate.filter(m => m && typeof m === 'object'));
      }
      // Single material
      else if (typeof candidate === 'object') {
        materials.push(candidate);
      }
    }
    
    return materials;
  }

  /**
   * Register a node for automatic profile assignment
   * Main entry point for new node spawning
   */
  registerNode(node) {
    if (!node) {
      if (this.debugEnabled) console.warn('[Registry] registerNode called with null node');
      return false;
    }
    
    // Check if already registered
    if (this.registeredNodes.has(node)) {
      if (this.debugEnabled) console.log('[Registry] Node already registered');
      return true; // Already done
    }
    
    // Detect category
    const category = this._getNodeCategory(node);
    
    // Get profile from category
    const profile = this._getCategoryProfile(category);
    
    if (this.debugEnabled) {
      console.log('[Registry] Registering node', {
        category: category || '(unknown)',
        profile: profile,
        hasAdvancedFX: !!this.advancedFX,
      });
    }
    
    // Extract materials from node
    const materials = this._extractMaterials(node);
    
    if (materials.length === 0) {
      if (this.debugEnabled) console.warn('[Registry] No materials found on node');
      return false;
    }
    
    // Register each material with AdvancedFX
    if (this.advancedFX && this.advancedFX.register) {
      let registeredCount = 0;
      
      for (const material of materials) {
        try {
          const registered = this.advancedFX.register(material, profile);
          if (registered) {
            this.materialToProfile.set(material, profile);
            registeredCount++;
          }
        } catch (err) {
          if (this.debugEnabled) console.warn('[Registry] Failed to register material:', err);
        }
      }
      
      if (this.debugEnabled) {
        console.log(`[Registry] Registered ${registeredCount}/${materials.length} materials with profile '${profile}'`);
      }
    } else {
      if (this.debugEnabled) console.warn('[Registry] AdvancedFX not available or no register method');
      return false;
    }
    
    // Track node as registered
    this.registeredNodes.set(node, {
      category: category,
      profile: profile,
      materialCount: materials.length,
      timestamp: Date.now(),
    });
    
    return true;
  }

  /**
   * Manually assign a profile to a node
   * Allows runtime profile changes
   */
  assignProfile(node, profileName) {
    if (!node || !profileName) {
      if (this.debugEnabled) console.warn('[Registry] assignProfile: invalid arguments');
      return false;
    }
    
    profileName = String(profileName).toLowerCase().trim();
    
    const materials = this._extractMaterials(node);
    
    if (materials.length === 0) {
      if (this.debugEnabled) console.warn('[Registry] No materials found for profile assignment');
      return false;
    }
    
    if (this.advancedFX && this.advancedFX.register) {
      let updatedCount = 0;
      
      for (const material of materials) {
        try {
          // Unregister current profile first
          if (this.advancedFX.unregister) {
            this.advancedFX.unregister(material);
          }
          
          // Register with new profile
          const registered = this.advancedFX.register(material, profileName);
          if (registered) {
            this.materialToProfile.set(material, profileName);
            updatedCount++;
          }
        } catch (err) {
          if (this.debugEnabled) console.warn('[Registry] Failed to update material profile:', err);
        }
      }
      
      if (this.debugEnabled) {
        console.log(`[Registry] Updated ${updatedCount}/${materials.length} materials to profile '${profileName}'`);
      }
      
      // Update registration record
      if (this.registeredNodes.has(node)) {
        const record = this.registeredNodes.get(node);
        record.profile = profileName;
        record.profileChangedAt = Date.now();
      }
      
      return updatedCount > 0;
    }
    
    return false;
  }

  /**
   * Unregister a node and remove all material registrations
   */
  unregisterNode(node) {
    if (!node) return false;
    
    if (!this.registeredNodes.has(node)) {
      if (this.debugEnabled) console.log('[Registry] Node not registered');
      return false;
    }
    
    const materials = this._extractMaterials(node);
    
    if (this.advancedFX && this.advancedFX.unregister) {
      let unregisteredCount = 0;
      
      for (const material of materials) {
        try {
          const unregistered = this.advancedFX.unregister(material);
          if (unregistered) {
            unregisteredCount++;
          }
        } catch (err) {
          if (this.debugEnabled) console.warn('[Registry] Failed to unregister material:', err);
        }
      }
      
      if (this.debugEnabled) {
        console.log(`[Registry] Unregistered ${unregisteredCount}/${materials.length} materials`);
      }
    }
    
    // Remove from tracking
    this.registeredNodes.delete(node);
    
    return true;
  }

  /**
   * Get profile assignment for a material
   */
  getMaterialProfile(material) {
    if (!material) return null;
    return this.materialToProfile.get(material) || null;
  }

  /**
   * Get registration info for a node
   */
  getNodeInfo(node) {
    if (!node) return null;
    
    if (!this.registeredNodes.has(node)) {
      return null;
    }
    
    return this.registeredNodes.get(node);
  }

  /**
   * Get all registered nodes count
   */
  getRegisteredCount() {
    return this.registeredNodes.size;
  }

  /**
   * Get profile mapping (read-only copy)
   */
  getProfileMap() {
    return { ...this.profileMap };
  }

  /**
   * Update profile mapping (extend or override)
   */
  updateProfileMap(newMappings) {
    if (!newMappings || typeof newMappings !== 'object') {
      if (this.debugEnabled) console.warn('[Registry] updateProfileMap: invalid argument');
      return false;
    }
    
    const prevMap = { ...this.profileMap };
    this.profileMap = { ...this.profileMap, ...newMappings };
    
    if (this.debugEnabled) {
      console.log('[Registry] Profile map updated', {
        previous: Object.keys(prevMap).length,
        current: Object.keys(this.profileMap).length,
        added: Object.keys(newMappings).length,
      });
    }
    
    return true;
  }

  /**
   * Set AdvancedFX reference (if not provided at init)
   */
  setAdvancedFX(advancedFX) {
    if (!advancedFX) {
      if (this.debugEnabled) console.warn('[Registry] setAdvancedFX called with null');
      return false;
    }
    
    this.advancedFX = advancedFX;
    
    if (this.debugEnabled) {
      console.log('[Registry] AdvancedFX reference updated', {
        hasRegister: !!advancedFX.register,
        hasUnregister: !!advancedFX.unregister,
      });
    }
    
    return true;
  }

  /**
   * Get debug info
   */
  getDebugInfo() {
    const profileCounts = {};
    
    for (const info of this.registeredNodes.values()) {
      const profile = info.profile || 'unknown';
      profileCounts[profile] = (profileCounts[profile] || 0) + 1;
    }
    
    return {
      registeredNodes: this.registeredNodes.size,
      profileCounts: profileCounts,
      profileMapSize: Object.keys(this.profileMap).length,
      advancedFXPresent: !!this.advancedFX,
      debugEnabled: this.debugEnabled,
    };
  }

  /**
   * Set debug logging
   */
  setDebugEnabled(enabled) {
    this.debugEnabled = enabled === true;
    if (this.debugEnabled) {
      console.log('[Registry] Debug logging enabled');
    }
    return this.debugEnabled;
  }

  /**
   * Batch register multiple nodes
   */
  registerNodes(nodes) {
    if (!Array.isArray(nodes)) {
      if (this.debugEnabled) console.warn('[Registry] registerNodes: expected array');
      return 0;
    }
    
    let registeredCount = 0;
    
    for (const node of nodes) {
      if (this.registerNode(node)) {
        registeredCount++;
      }
    }
    
    if (this.debugEnabled) {
      console.log(`[Registry] Batch registered ${registeredCount}/${nodes.length} nodes`);
    }
    
    return registeredCount;
  }

  /**
   * Cleanup: unregister all nodes
   */
  dispose() {
    const nodeArray = Array.from(this.registeredNodes.keys());
    
    for (const node of nodeArray) {
      this.unregisterNode(node);
    }
    
    this.registeredNodes.clear();
    
    if (this.debugEnabled) {
      console.log('[Registry] All nodes unregistered, registry disposed');
    }
  }

  /**
   * Get summary info
   */
  getSummary() {
    return {
      status: 'active',
      registeredNodes: this.registeredNodes.size,
      advancedFXIntegrated: !!this.advancedFX,
      profileMappings: Object.keys(this.profileMap).length,
      debugMode: this.debugEnabled,
    };
  }
}

// Export both named and default
export { PersonalityMaterialProfileRegistry_v1 };
export default PersonalityMaterialProfileRegistry_v1;

// Attach to window for global access
if (typeof window !== 'undefined') {
  window.PersonalityMaterialProfileRegistry_v1 = PersonalityMaterialProfileRegistry_v1;
}
