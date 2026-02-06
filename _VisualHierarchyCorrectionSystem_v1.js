/**
 * VISUAL HIERARCHY CORRECTION SYSTEM v1.0
 * 
 * Enforces strict visual hierarchy constraints to ensure core node geometry
 * is always dominant and never occluded by auxiliary visuals (rings, halos,
 * phase overlays, evolution layers, etc.).
 * 
 * RULES:
 * 1. Core geometry (EnhancedNodeModel) has highest renderOrder
 * 2. Auxiliary layers (rings, phase, evolution, aura) stay outside effective core radius
 * 3. Auxiliary visuals must scale down or move outward if they exceed allowed bounds
 * 4. Legacy or extreme visuals are suppressed if they dominate by default
 * 5. All constraints are adaptive based on node size, not hardcoded per category
 * 
 * INTEGRATION:
 *   const hierarchySystem = new VisualHierarchyCorrectionSystem_v1();
 *   hierarchySystem.registerNode(node, nodeCategory);  // On spawn
 *   hierarchySystem.update();  // Per frame (batch enforcement)
 *   hierarchySystem.unregisterNode(node);  // On removal
 */

import * as THREE from 'three';

/**
 * Per-node visual constraint data
 */
class NodeConstraintData {
  constructor(node) {
    this.node = node;
    this.effectiveCoreRadius = 0.8; // Default core radius (auto-calculated)
    this.maxAuxiliaryRadius = 1.5;  // Max extent of auxiliary visuals
    this.coreRenderOrder = 100;     // Core geometry renderOrder
    this.auxiliaryRenderOrder = 50; // All auxiliary layers
    
    // Track added auxiliary layers for enforcement
    this.auxiliaryLayers = {
      rings: [],      // OrbitRings (torus meshes)
      phase: [],      // Phase transition overlays
      evolution: [],  // Evolution VFX meshes
      aura: [],       // Aura/halo meshes
      glyph: [],      // Glyph overlays
      extreme: []     // Extreme mode geometries
    };
    
    // Enforcement flags
    this.enforced = false;
    this.suppressedLayers = []; // Types that were suppressed
  }
  
  /**
   * Register an auxiliary layer mesh
   * type: 'rings' | 'phase' | 'evolution' | 'aura' | 'glyph' | 'extreme'
   */
  registerAuxiliaryLayer(mesh, type = 'extreme') {
    if (!this.auxiliaryLayers[type]) {
      this.auxiliaryLayers[type] = [];
    }
    this.auxiliaryLayers[type].push(mesh);
  }
  
  /**
   * Calculate effective core radius from node's actual geometry
   * FIXED: Never mutate frozen geometries
   */
  calculateEffectiveCoreRadius() {
    if (!this.node || !this.node.children) return 0.8;
    
    let maxRadius = 0.3;
    const hasFinitePositions = (geometry) => {
      const arr = geometry?.attributes?.position?.array;
      if (!arr) return false;
      for (let i = 0; i < arr.length; i++) {
        if (!Number.isFinite(arr[i])) return false;
      }
      return true;
    };
    
    // Scan immediate children for core geometries
    for (const child of this.node.children) {
      if (!child.geometry) continue;
      
      // Check if geometry is frozen (immutable, pre-computed)
      const isFrozen = Object.isFrozen(child.geometry);
      
      // Use existing bounding sphere or reuse fallback
      if (child.geometry.boundingSphere) {
        const sphereRadius = child.geometry.boundingSphere.radius * child.scale.length();
        maxRadius = Math.max(maxRadius, sphereRadius);
      } else if (!isFrozen && hasFinitePositions(child.geometry)) {
        // ONLY compute if not frozen (frozen geometries must pre-compute)
        child.geometry.computeBoundingSphere();
        if (child.geometry.boundingSphere) {
          const sphereRadius = child.geometry.boundingSphere.radius * child.scale.length();
          maxRadius = Math.max(maxRadius, sphereRadius);
        }
      }
      
      // Skip if marked as auxiliary layer
      if (child.userData && child.userData.isAuxiliaryLayer) {
        continue;
      }
    }
    
    // Apply safety margin: auxiliary layers must stay outside core radius
    this.effectiveCoreRadius = Math.max(0.3, maxRadius * 1.1);
    this.maxAuxiliaryRadius = this.effectiveCoreRadius * 1.8;
    
    return this.effectiveCoreRadius;
  }
  
  /**
   * Get constraint status for this node
   */
  getConstraintStatus() {
    const status = {
      coreRadius: this.effectiveCoreRadius,
      maxRadius: this.maxAuxiliaryRadius,
      auxiliaryCount: Object.values(this.auxiliaryLayers).flat().length,
      suppressedCount: this.suppressedLayers.length,
      enforced: this.enforced
    };
    return status;
  }
}

/**
 * Main Visual Hierarchy Correction System
 */
export class VisualHierarchyCorrectionSystem_v1 {
  constructor(config = {}) {
    this.nodeConstraints = new WeakMap(); // node -> NodeConstraintData
    this.nodeRegistry = []; // Track all registered nodes (for iteration)
    
    // Configuration
    this.config = {
      enableAutoEnforcement: config.enableAutoEnforcement !== false,
      enableDebug: config.enableDebug === true,
      enforcementMode: config.enforcementMode || 'constrain', // 'constrain' | 'suppress' | 'relocate'
      radiusScaleFactor: config.radiusScaleFactor || 1.8,
      auxiliaryOpacityMin: config.auxiliaryOpacityMin || 0.3,
      auxiliaryOpacityMax: config.auxiliaryOpacityMax || 0.7,
      coreRenderOrderBase: config.coreRenderOrderBase || 100,
      auxiliaryRenderOrderBase: config.auxiliaryRenderOrderBase || 50,
      suppressLegacyExtremes: config.suppressLegacyExtremes !== false
    };
    
    // Performance tracking
    this.stats = {
      nodesRegistered: 0,
      constraintsEnforced: 0,
      layersRelocated: 0,
      layersSuppressed: 0,
      updateTime: 0
    };
  }
  
  /**
   * Register a node for visual hierarchy enforcement
   */
  registerNode(node, nodeCategory = 'input') {
    if (!node) return null;
    
    // Create constraint data
    const constraints = new NodeConstraintData(node);
    constraints.calculateEffectiveCoreRadius();
    
    this.nodeConstraints.set(node, constraints);
    this.nodeRegistry.push(node);
    
    // Mark core geometry with renderOrder
    this._setNodeCoreRenderOrder(node, this.config.coreRenderOrderBase);
    
    // Auto-scan for auxiliary layers added during node creation
    this._scanNodeAuxiliaryLayers(node, constraints);
    
    // Enforce constraints immediately if enabled
    if (this.config.enableAutoEnforcement) {
      this._enforceNodeConstraints(node, constraints);
    }
    
    this.stats.nodesRegistered++;
    
    if (this.config.enableDebug) {
      console.log(`[VisualHierarchyCorrection] Registered node (core radius: ${constraints.effectiveCoreRadius.toFixed(3)}, max: ${constraints.maxAuxiliaryRadius.toFixed(3)})`);
    }
    
    return constraints;
  }
  
  /**
   * Unregister a node when it's removed
   */
  unregisterNode(node) {
    if (!node) return;
    
    const idx = this.nodeRegistry.indexOf(node);
    if (idx >= 0) {
      this.nodeRegistry.splice(idx, 1);
    }
    
    this.nodeConstraints.delete(node);
  }
  
  /**
   * Register an auxiliary visual layer (called by external systems)
   * Example: EvolutionRegistry calls this when adding evolution VFX
   */
  registerAuxiliaryMesh(node, mesh, type = 'evolution') {
    if (!node || !mesh) return;
    
    let constraints = this.nodeConstraints.get(node);
    if (!constraints) {
      constraints = this.registerNode(node);
    }
    
    // Mark mesh as auxiliary
    mesh.userData.isAuxiliaryLayer = true;
    mesh.userData.auxiliaryType = type;
    
    constraints.registerAuxiliaryLayer(mesh, type);
    
    // Phase B.3.B: runtime renderOrder mutation and auto-enforcement disabled.
  }
  
  /**
   * Update loop: enforce constraints on all registered nodes
   */
  update(deltaTime = 0.016) {
    // Phase B.3.B: disable per-frame hierarchy correction mutations.
    return;
  }
  
  /**
   * Manually enforce constraints for a single node
   */
  enforceNode(node) {
    // Phase B.3.B: explicit runtime visual enforcement disabled.
    return false;
  }
  
  /**
   * INTERNAL: Scan node tree for auxiliary layers and register them
   */
  _scanNodeAuxiliaryLayers(node, constraints) {
    if (!node.children) return;
    
    for (const child of node.children) {
      const userData = child.userData || {};
      
      // Detect auxiliary layer type from userData
      if (userData.vfxType) {
        const type = this._mapVfxTypeToLayerType(userData.vfxType);
        if (type) {
          constraints.registerAuxiliaryLayer(child, type);
          child.userData.isAuxiliaryLayer = true;
        }
      }
      
      // Recursively scan children
      this._scanNodeAuxiliaryLayers(child, constraints);
    }
  }
  
  /**
   * INTERNAL: Map vfxType string to layer type
   */
  _mapVfxTypeToLayerType(vfxType) {
    if (vfxType.includes('ring') || vfxType.includes('orbit')) return 'rings';
    if (vfxType.includes('phase')) return 'phase';
    if (vfxType.includes('evolution')) return 'evolution';
    if (vfxType.includes('aura') || vfxType.includes('halo')) return 'aura';
    if (vfxType.includes('glyph')) return 'glyph';
    if (vfxType.includes('extreme')) return 'extreme';
    return null;
  }
  
  /**
   * INTERNAL: Set core renderOrder recursively
   */
  _setNodeCoreRenderOrder(node, baseOrder) {
    // Only set renderOrder on core geometry, not auxiliary layers
    if (node.userData && node.userData.isAuxiliaryLayer) {
      return; // Skip auxiliary layers
    }
    
    if (node.isMesh) {
      node.renderOrder = baseOrder;
    }
    
    if (node.children) {
      for (const child of node.children) {
        if (child.userData && child.userData.isAuxiliaryLayer) {
          continue; // Skip auxiliary children
        }
        this._setNodeCoreRenderOrder(child, baseOrder);
      }
    }
  }
  
  /**
   * INTERNAL: Enforce constraints on a single node
   */
  _enforceNodeConstraints(node, constraints) {
    // Phase B.3.B: disable runtime visual hierarchy mutations.
    return;

    // Step 1: Verify core radius is current
    constraints.calculateEffectiveCoreRadius();
    
    // Step 2: Check and suppress legacy/extreme visuals if enabled
    if (this.config.suppressLegacyExtremes) {
      this._checkSuppressLegacyExtremes(node, constraints);
    }
    
    // Step 3: Enforce constraints on each auxiliary layer type
    Object.entries(constraints.auxiliaryLayers).forEach(([type, meshes]) => {
      meshes.forEach(mesh => {
        this._enforceAuxiliaryMesh(mesh, constraints);
      });
    });
    
    // Step 4: Ensure renderOrder hierarchy is correct
    this._enforceRenderOrderHierarchy(node, constraints);
    
    constraints.enforced = true;
  }
  
  /**
   * INTERNAL: Check and suppress legacy/extreme visuals
   */
  _checkSuppressLegacyExtremes(node, constraints) {
    // If node has extreme flag and visuals are dominating, suppress them
    if (node.userData && node.userData.isExtreme) {
      // Check if extreme rings are too large
      const extremeRings = constraints.auxiliaryLayers.extreme || [];
      for (const ring of extremeRings) {
        if (!ring.userData) ring.userData = {};
        
        // If ring is default-enabled without explicit user activation, suppress
        if (!ring.userData.userActivated && ring.visible !== false) {
          if (this.config.enableDebug) {
            console.log('[VisualHierarchyCorrection] Suppressing default-enabled extreme ring');
          }
          ring.visible = false;
          constraints.suppressedLayers.push('extreme-ring');
          this.stats.layersSuppressed++;
        }
      }
    }
  }
  
  /**
   * INTERNAL: Enforce constraints on a single auxiliary mesh
   */
  _enforceAuxiliaryMesh(mesh, constraints) {
    // Phase B.3.B: disable runtime visual hierarchy mutations.
    return;
    if (!mesh) return;
    
    const layerType = mesh.userData?.auxiliaryType || 'unknown';
    
    switch (this.config.enforcementMode) {
      case 'constrain':
        this._constrainAuxiliaryScale(mesh, constraints);
        break;
      
      case 'suppress':
        this._suppressAuxiliaryIfExcessive(mesh, constraints);
        break;
      
      case 'relocate':
        this._relocateAuxiliaryIfExcessive(mesh, constraints);
        break;
    }
    
    // Always enforce opacity bounds
    this._enforceAuxiliaryOpacity(mesh, layerType);
    
    // Always enforce renderOrder
    mesh.renderOrder = this.config.auxiliaryRenderOrderBase;
  }
  
  /**
   * INTERNAL: Constrain auxiliary mesh scale (default mode)
   */
  _constrainAuxiliaryScale(mesh, constraints) {
    const hasFinitePositions = (geometry) => {
      const arr = geometry?.attributes?.position?.array;
      if (!arr) return false;
      for (let i = 0; i < arr.length; i++) {
        if (!Number.isFinite(arr[i])) return false;
      }
      return true;
    };

    if (!mesh.geometry || !mesh.geometry.boundingSphere) {
      if (hasFinitePositions(mesh.geometry)) {
        mesh.geometry?.computeBoundingSphere();
      } else {
        return;
      }
    }
    
    if (!mesh.geometry?.boundingSphere) return;
    
    const meshRadius = mesh.geometry.boundingSphere.radius * mesh.scale.length();
    const maxAllowed = constraints.maxAuxiliaryRadius;
    
    // If mesh exceeds max radius, scale it down
    if (meshRadius > maxAllowed) {
      const scaleFactor = maxAllowed / meshRadius;
      
      // Apply scaling
      mesh.scale.multiplyScalar(scaleFactor);
      
      // Also reduce opacity slightly for layers that are being constrained
      if (mesh.material && typeof mesh.material.opacity === 'number') {
        mesh.material.opacity *= 0.8;
      }
      
      this.stats.layersRelocated++;
      
      if (this.config.enableDebug) {
        console.log(`[VisualHierarchyCorrection] Constrained ${mesh.userData?.auxiliaryType || 'unknown'} scale by ${(1 - scaleFactor).toFixed(2)}`);
      }
    }
  }
  
  /**
   * INTERNAL: Move auxiliary mesh outward if it intersects core
   */
  _relocateAuxiliaryIfExcessive(mesh, constraints) {
    if (!mesh.position) return;
    
    // Calculate current distance from node center
    const distance = mesh.position.length();
    
    // If too close to core, push outward
    if (distance < constraints.effectiveCoreRadius * 1.2) {
      const direction = mesh.position.normalize();
      const targetDistance = constraints.maxAuxiliaryRadius * 1.1;
      
      mesh.position.copy(direction.multiplyScalar(targetDistance));
      
      this.stats.layersRelocated++;
    }
  }
  
  /**
   * INTERNAL: Suppress auxiliary if it exceeds constraints
   */
  _suppressAuxiliaryIfExcessive(mesh, constraints) {
    if (!mesh.geometry || !mesh.geometry.boundingSphere) {
      mesh.geometry?.computeBoundingSphere();
    }
    
    const meshRadius = mesh.geometry?.boundingSphere?.radius || 0;
    const scaledRadius = meshRadius * mesh.scale.length();
    
    if (scaledRadius > constraints.maxAuxiliaryRadius * 1.5) {
      mesh.visible = false;
      this.stats.layersSuppressed++;
      
      if (this.config.enableDebug) {
        console.log(`[VisualHierarchyCorrection] Suppressed oversized auxiliary layer`);
      }
    }
  }
  
  /**
   * INTERNAL: Enforce opacity bounds on auxiliary layers
   */
  _enforceAuxiliaryOpacity(mesh, layerType) {
    // Apply opacity bounds based on layer type
    let targetOpacity = this.config.auxiliaryOpacityMax;
    
    if (layerType === 'rings') {
      targetOpacity = Math.min(0.5, this.config.auxiliaryOpacityMax);
    } else if (layerType === 'extreme') {
      targetOpacity = Math.min(0.4, this.config.auxiliaryOpacityMax);
    } else if (layerType === 'aura') {
      targetOpacity = Math.min(0.6, this.config.auxiliaryOpacityMax);
    }
    
    // Apply to mesh and children
    const applyOpacity = (m) => {
      if (m.material && typeof m.material.opacity === 'number') {
        // Clamp between min and max
        m.material.opacity = Math.max(
          this.config.auxiliaryOpacityMin,
          Math.min(targetOpacity, m.material.opacity)
        );
      }
      if (m.children) {
        m.children.forEach(applyOpacity);
      }
    };
    
    applyOpacity(mesh);
  }
  
  /**
   * INTERNAL: Enforce renderOrder hierarchy
   */
  _enforceRenderOrderHierarchy(node, constraints) {
    const enforceRO = (n, baseRO) => {
      if (n.userData?.isAuxiliaryLayer) {
        n.renderOrder = this.config.auxiliaryRenderOrderBase;
      } else {
        n.renderOrder = baseRO;
      }
      
      if (n.children) {
        n.children.forEach(child => enforceRO(child, baseRO));
      }
    };
    
    enforceRO(node, this.config.coreRenderOrderBase);
  }
  
  /**
   * Get statistics and status
   */
  getStats() {
    return {
      ...this.stats,
      nodesTracked: this.nodeRegistry.length
    };
  }
  
  /**
   * Get detailed constraint report for a node
   */
  getNodeReport(node) {
    const constraints = this.nodeConstraints.get(node);
    if (!constraints) {
      return { error: 'Node not registered' };
    }
    
    return {
      nodeId: node.uuid || node.userData?.id || 'unknown',
      coreRadius: constraints.effectiveCoreRadius,
      maxAuxiliaryRadius: constraints.maxAuxiliaryRadius,
      auxiliaryLayers: Object.entries(constraints.auxiliaryLayers).reduce(
        (acc, [type, meshes]) => {
          acc[type] = meshes.length;
          return acc;
        },
        {}
      ),
      totalAuxiliaryMeshes: Object.values(constraints.auxiliaryLayers).flat().length,
      suppressedLayers: constraints.suppressedLayers,
      enforced: constraints.enforced
    };
  }
  
  /**
   * Disable enforcement on a node (allow visual clutter if desired)
   */
  disableEnforcement(node) {
    const constraints = this.nodeConstraints.get(node);
    if (constraints) {
      constraints.enforced = false;
    }
  }
  
  /**
   * Re-enable enforcement
   */
  enableEnforcement(node) {
    const constraints = this.nodeConstraints.get(node);
    if (constraints) {
      this._enforceNodeConstraints(node, constraints);
    }
  }
  
  /**
   * Dispose system
   */
  dispose() {
    this.nodeRegistry = [];
    this.nodeConstraints = new WeakMap();
    this.stats = {
      nodesRegistered: 0,
      constraintsEnforced: 0,
      layersRelocated: 0,
      layersSuppressed: 0,
      updateTime: 0
    };
  }
}
