/**
 * EMERGENCY AURA KILL SWITCH v1.0
 * ================================
 * [HOTFIX] Hard disable ALL aura, halo, field, and influence rendering
 * 
 * MODE: Direct override, no exceptions
 * PRIORITY: Immediate visual stabilization
 * 
 * Implementation:
 * 1. Global kill switch flag
 * 2. Scene.add() interceptor
 * 3. Runtime scene sweep
 * 4. Forced cleanup on demand
 */

import * as THREE from 'three';

/**
 * Aura keywords that identify overlay meshes
 */
const AURA_IDENTIFIERS = [
  'aura',
  'halo', 
  'field',
  'influence',
  'zone',
  'harmony',
  'mythic',
  'overlay',
  'shell',
  'envelope',
  'glow',
  'radiance'
];

/**
 * Check if object matches aura profile
 */
function isAuraLike(obj) {
  if (!obj) return false;
  
  const nameLower = (obj.name || '').toLowerCase();
  const userDataType = (obj.userData?.type || '').toLowerCase();
  const userDataVisualLayer = (obj.userData?.visualLayer || '').toLowerCase();
  
  // Check by name/type/layer
  for (const keyword of AURA_IDENTIFIERS) {
    if (nameLower.includes(keyword) || 
        userDataType.includes(keyword) ||
        userDataVisualLayer.includes(keyword)) {
      return true;
    }
  }
  
  // Check by material properties (translucent, additive blend)
  if (obj.material) {
    const mat = obj.material;
    if (mat.transparent && mat.opacity !== undefined && mat.opacity < 0.9) {
      if (mat.blending === THREE.AdditiveBlending) {
        return true;  // Likely aura
      }
    }
  }
  
  // Check by geometry (large sphere/halo)
  if (obj.geometry) {
    const geo = obj.geometry;
    if (geo.type === 'IcosahedronGeometry' || geo.type === 'SphereGeometry') {
      // Likely aura shell
      return true;
    }
  }
  
  return false;
}

/**
 * Emergency Aura Kill Switch
 */
export class EmergencyAuraKillSwitch_v1 {
  constructor() {
    this.enabled = true;
    this.interceptorActive = false;
    this.stats = {
      removed: 0,
      intercepted: 0,
      sweeps: 0
    };
    
    // Global flag
    window.__DISABLE_ALL_NODE_AURAS__ = true;
    
    console.log('[EmergencyAuraKillSwitch] Initialized - All node auras will be removed');
  }

  /**
   * Install scene.add() interceptor
   * Prevents aura meshes from ever being added to scene
   */
  installSceneInterceptor(scene) {
    if (this.interceptorActive) return;
    
    const originalAdd = scene.add.bind(scene);
    const self = this;
    
    scene.add = function(...args) {
      const results = [];
      
      for (const obj of args) {
        // Check if this looks like an aura
        if (isAuraLike(obj)) {
          console.log(`[EMERGENCY] Aura intercepted (not added): ${obj.name || obj.uuid}`);
          self.stats.intercepted++;
          continue;  // ← SKIP adding this object
        }
        
        // Add non-aura objects normally
        results.push(obj);
      }
      
      // Add all non-aura objects
      if (results.length > 0) {
        return originalAdd(...results);
      }
    };
    
    this.interceptorActive = true;
    console.log('[EmergencyAuraKillSwitch] Scene.add() interceptor installed');
  }

  /**
   * Runtime scene sweep - removes existing auras
   */
  sweepScene(scene) {
    if (!scene) {
      console.warn('[EmergencyAuraKillSwitch] No scene provided for sweep');
      return 0;
    }
    
    const removed = [];
    
    scene.traverse((obj) => {
      if (isAuraLike(obj)) {
        removed.push(obj);
      }
    });
    
    // Remove auras
    for (const obj of removed) {
      if (obj.parent) {
        obj.parent.remove(obj);
      }
      
      // Dispose
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose?.());
        } else {
          obj.material.dispose();
        }
      }
      
      console.log(`[EMERGENCY] Aura removed: ${obj.name || obj.uuid}`);
      this.stats.removed++;
    }
    
    this.stats.sweeps++;
    console.log(`[EmergencyAuraKillSwitch] Sweep complete: ${removed.length} auras removed`);
    
    return removed.length;
  }

  /**
   * Continuous monitoring mode - removes auras as they appear
   * Call from animation loop
   */
  monitor(scene) {
    if (!this.enabled || !scene) return;
    
    // Quick check for aura-like objects
    let found = 0;
    scene.traverse((obj) => {
      if (obj.parent && isAuraLike(obj)) {
        obj.parent.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose?.();
        found++;
      }
    });
    
    if (found > 0) {
      console.log(`[EmergencyAuraKillSwitch] Monitoring: removed ${found} auras`);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Full reset: sweep + monitor
   */
  fullReset(scene) {
    console.log('[EmergencyAuraKillSwitch] FULL RESET');
    this.sweepScene(scene);
    this.installSceneInterceptor(scene);
  }
}

export default EmergencyAuraKillSwitch_v1;
