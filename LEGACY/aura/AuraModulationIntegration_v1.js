/**
 * AURA MODULATION INTEGRATION v1.0 (Session 27)
 * 
 * Auto-patches EventVisualSuppression to redirect event intensity to aura modulation.
 * Non-invasive integration via observer pattern.
 * 
 * Auto-hooks on:
 * - Node spawn (capture baseline)
 * - Link creation (capture baseline)
 * - Event intensity (apply modulation)
 */

import * as THREE from 'three';

export class AuraModulationIntegration_v1 {
  constructor(auraModulationSystem, eventVisualSuppression, scene) {
    this.auraModulationSystem = auraModulationSystem;
    this.eventVisualSuppression = eventVisualSuppression;
    this.scene = scene;
    
    // Track which nodes have been hooked
    this.hookedNodes = new WeakSet();
    
    // Original EventVisualSuppression redirect function
    this.originalRedirectToAura = null;
  }
  
  /**
   * Initialize integration (call once after systems are created)
   */
  initialize() {
    // Patch EventVisualSuppression's redirectToAura method
    this.patchEventVisualSuppression();
    
    // Setup observers for node lifecycle
    this.setupNodeSpawnObserver();
    this.setupLinkObserver();
  }
  
  /**
   * Patch EventVisualSuppression to use aura modulation
   */
  patchEventVisualSuppression() {
    const originalRedirect = this.eventVisualSuppression.redirectToAura?.bind(this.eventVisualSuppression);
    
    this.eventVisualSuppression.redirectToAura = (node, eventType, intensity) => {
      // Call original if it exists
      if (originalRedirect) {
        originalRedirect(node, eventType, intensity);
      }
      
      // Now apply aura modulation
      const aura = this.findAura(node);
      if (aura) {
        const modulationType = this.auraModulationSystem.getModulationTypeForEvent(eventType);
        const duration = 0.5 + intensity * 0.5; // 0.5-1.0 second
        this.auraModulationSystem.pushModulation(aura, modulationType, intensity, duration);
      }
    };
  }
  
  /**
   * Find aura for a node (handles multiple aura implementations)
   */
  findAura(node) {
    if (!node) return null;
    
    // Strategy 1: Check children for aura by name
    for (const child of node.children) {
      if (this.isAuraByName(child)) return child;
    }
    
    // Strategy 2: Check hierarchy for aura-like properties
    for (const child of node.children) {
      if (this.isAuraByHierarchy(child)) return child;
    }
    
    // Strategy 3: Check for material properties indicating aura
    for (const child of node.children) {
      if (this.isAuraByMaterial(child)) return child;
    }
    
    return null;
  }
  
  /**
   * Check if object is aura by name
   */
  isAuraByName(obj) {
    const name = obj.name?.toLowerCase() || '';
    return name.includes('aura') || 
           name.includes('halo') ||
           name.includes('glow') ||
           name.includes('corona');
  }
  
  /**
   * Check if object is aura by hierarchy (has sibling core)
   */
  isAuraByHierarchy(obj) {
    if (!obj.parent) return false;
    
    const siblings = obj.parent.children;
    const hasCore = siblings.some(s => 
      s !== obj && (
        s.name?.toLowerCase().includes('core') ||
        s.name?.toLowerCase().includes('node') ||
        s.geometry instanceof THREE.IcosahedronGeometry ||
        s.geometry instanceof THREE.SphereGeometry
      )
    );
    
    return hasCore && (
      obj.geometry instanceof THREE.SphereGeometry ||
      obj.geometry instanceof THREE.BufferGeometry
    );
  }
  
  /**
   * Check if object is aura by material properties
   */
  isAuraByMaterial(obj) {
    if (!obj.material) return false;
    
    const material = obj.material;
    
    // Auras typically have:
    // - High transparency
    // - Emissive materials
    // - Soft/bloom effect
    // - Larger scale than core
    
    const hasTransparency = material.transparent && material.opacity < 0.8;
    const hasEmissive = material.emissive && material.emissive.getHex() !== 0x000000;
    const isLarge = obj.scale.length() > 1.5;
    
    return hasTransparency || (hasEmissive && isLarge);
  }
  
  /**
   * Setup observer for node spawning
   */
  setupNodeSpawnObserver() {
    // Listen for node creation via custom event
    window.addEventListener('nodeSpawned', (event) => {
      const node = event.detail?.node;
      if (node) {
        this.onNodeSpawned(node);
      }
    });
  }
  
  /**
   * Setup observer for link creation
   */
  setupLinkObserver() {
    // Listen for link creation
    window.addEventListener('linkCreated', (event) => {
      const link = event.detail?.link;
      if (link) {
        this.onLinkCreated(link);
      }
    });
  }
  
  /**
   * Handle node spawn
   */
  onNodeSpawned(node) {
    if (this.hookedNodes.has(node)) return;
    this.hookedNodes.add(node);
    
    // Capture baseline aura state
    const aura = this.findAura(node);
    if (aura) {
      this.auraModulationSystem.captureBaseline(aura);
    }
  }
  
  /**
   * Handle link creation
   */
  onLinkCreated(link) {
    // Capture baselines for both nodes
    if (link.node1) {
      const aura1 = this.findAura(link.node1);
      if (aura1) {
        this.auraModulationSystem.captureBaseline(aura1);
      }
    }
    
    if (link.node2) {
      const aura2 = this.findAura(link.node2);
      if (aura2) {
        this.auraModulationSystem.captureBaseline(aura2);
      }
    }
  }
  
  /**
   * Manual hook for existing nodes
   */
  hookExistingNodes() {
    this.scene.traverse((obj) => {
      // Find all node containers
      if (obj.userData?.nodeId || obj.userData?.isNode) {
        if (!this.hookedNodes.has(obj)) {
          this.onNodeSpawned(obj);
        }
      }
    });
  }
  
  /**
   * Update modulations (call in render loop)
   */
  update(deltaTime) {
    this.auraModulationSystem.update(deltaTime);
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
  }
}

/**
 * Setup console API for integration
 */
export function setupAuraModulationRedirection(integration) {
  if (!window.debugAuraModulationIntegration) {
    window.debugAuraModulationIntegration = {};
  }
  
  Object.assign(window.debugAuraModulationIntegration, {
    hookExistingNodes: () => {
      integration.hookExistingNodes();
      console.log('🔗 Hooked all existing nodes for aura modulation');
    },
    
    findAura: (node) => {
      const aura = integration.findAura(node);
      console.log('🎨 Found aura:', aura);
      return aura;
    },
    
    testModulation: (aura, type, intensity = 1.0) => {
      if (!aura) {
        console.warn('⚠️ No aura provided');
        return;
      }
      
      integration.auraModulationSystem.captureBaseline(aura);
      integration.auraModulationSystem.pushModulation(aura, type, intensity, 1.0);
      console.log(`✅ Test modulation applied: ${type}`);
    },
  });
}

/**
 * Setup integration console API
 */
export function setupAuraModulationIntegrationConsoleAPI(integration) {
  if (!window.debugAuraModulationIntegration) {
    window.debugAuraModulationIntegration = {};
  }
  
  Object.assign(window.debugAuraModulationIntegration, {
    hookExistingNodes: () => {
      integration.hookExistingNodes();
      console.log('🔗 Hooked all existing nodes for aura modulation');
    },
    
    findAura: (node) => {
      const aura = integration.findAura(node);
      console.log('🎨 Found aura:', aura);
      return aura;
    },
    
    testModulation: (aura, type, intensity = 1.0) => {
      if (!aura) {
        console.warn('⚠️ No aura provided');
        return;
      }
      
      integration.auraModulationSystem.captureBaseline(aura);
      integration.auraModulationSystem.pushModulation(aura, type, intensity, 1.0);
      console.log(`✅ Test modulation applied: ${type}`);
    },
  });
  
  console.log('✅ Aura Modulation Integration console API ready: debugAuraModulationIntegration.*');
}
