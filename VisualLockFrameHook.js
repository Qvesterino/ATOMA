/**
 * VISUAL LOCK FRAME HOOK v1.0 — Per-Frame Enforcement
 * 
 * Hooks into renderer.render() to enforce visual authority EVERY FRAME.
 * Zero trust. Zero assumptions. Every property checked and restored.
 */

import { visualAuthority } from './VisualAuthority.js';

/**
 * 🎬 SETUP: Hook into renderer.render
 * 
 * @param {THREE.WebGLRenderer} renderer - Renderer
 * @param {THREE.Scene} scene - Scene
 * @returns {Object} Control API
 */
export function setupVisualLockFrameHook(renderer, scene) {
  if (!renderer || !scene) {
    throw new Error('[VisualLockFrameHook] Missing renderer or scene');
  }
  
  const originalRender = renderer.render.bind(renderer);
  let frameCount = 0;
  let violations = 0;
  let repairs = 0;
  
  /**
   * WRAPPED RENDER: Enforce before and after
   */
  const wrappedRender = function(s, c, renderTarget, forceClear) {
    frameCount++;
    
    // ✅ ENFORCE BEFORE RENDER
    const report = visualAuthority.enforceFrame(scene);
    
    if (report) {
      violations += report.nodesRepaired;
      repairs += report.repairs.length;
    }
    
    // RENDER
    const result = originalRender.call(renderer, s, c, renderTarget, forceClear);
    
    return result;
  };
  
  // Replace renderer.render
  renderer.render = wrappedRender;
  
  // Return control API
  return {
    getStats: () => ({
      framesRun: frameCount,
      totalViolations: violations,
      totalRepairs: repairs
    }),
    
    forceEnforcement: () => {
      visualAuthority.enforceFrame(scene);
    },
    
    getReport: () => {
      return visualAuthority.getReport();
    }
  };
}

export const VisualLockFrameHook = {
  setupVisualLockFrameHook
};
