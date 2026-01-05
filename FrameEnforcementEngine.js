/**
 * FRAME ENFORCEMENT ENGINE v1.0
 * 
 * Runs EVERY FRAME to FORCE OVERRIDE any mutations to render settings.
 * No node can escape the hierarchy.
 * 
 * Performance: Zero mercy, all checks, every frame
 */

import { enforceRenderHierarchy, isProtectedMesh } from './AbsoluteLinkStateNuclearLock.js';

/**
 * 🎬 FRAME ENFORCEMENT: Run every render frame
 * 
 * @param {THREE.Scene} scene - Scene to enforce
 */
export function enforceFrameHierarchy(scene) {
  if (!scene) return;
  
  scene.traverse((obj) => {
    // Only process nodes
    if (!obj.userData?.isNode) return;
    
    // FORCE render hierarchy
    enforceRenderHierarchy(obj);
    
    // FORCE all protected meshes stay visible
    obj.traverse((child) => {
      if (!child.isMesh) return;
      
      // Protected meshes MUST be visible
      if (isProtectedMesh(child)) {
        child.visible = true;
        child.frustumCulled = false; // Never cull
      }
      
      // Core MUST render first
      if (child.userData?.visualLayer === 'CORE' || child.userData?.isCoreMesh) {
        child.renderOrder = 0;
        child.visible = true;
        
        // FORCE depth settings every frame
        if (child.material) {
          child.material.depthTest = false;
          child.material.depthWrite = false;
          child.material.transparent = true;
        }
      }
      
      // Shells MUST render after core and never be culled
      if (child.userData?.visualLayer === 'CORE_SHELL' || child.userData?.isHologramShell) {
        child.renderOrder = 5;
        child.visible = true;
        child.frustumCulled = false; // ✅ CRITICAL EVERY FRAME
        
        if (child.material) {
          child.material.depthTest = false;
          child.material.depthWrite = false;
          child.material.transparent = true;
        }
      }
      
      // Auras MUST render last
      if (child.userData?.visualLayer === 'AURA' || child.userData?.isAura) {
        child.renderOrder = 10;
        child.visible = true;
        
        if (child.material) {
          child.material.transparent = true;
        }
      }
      
      // VFX MUST never be culled
      if (child.userData?.visualLayer === 'VFX' || child.userData?.isNonLinkableVisual) {
        child.visible = true;
        child.frustumCulled = false; // ✅ Never cull VFX
      }
    });
  });
}

/**
 * 🔍 DETECT: Find any mutations that escaped
 * 
 * @param {THREE.Scene} scene - Scene to audit
 * @returns {Array} Violations found
 */
export function detectHierarchyViolations(scene) {
  const violations = [];
  
  if (!scene) return violations;
  
  scene.traverse((obj) => {
    if (!obj.userData?.isNode) return;
    
    obj.traverse((child) => {
      if (!child.isMesh) return;
      
      // Check core
      if (child.userData?.isCoreMesh) {
        if (child.renderOrder !== 0) {
          violations.push({
            type: 'CORE_RENDERORDER',
            meshId: child.uuid,
            expected: 0,
            actual: child.renderOrder
          });
        }
        
        if (child.material?.depthTest !== false) {
          violations.push({
            type: 'CORE_DEPTHTEST',
            meshId: child.uuid,
            expected: false,
            actual: child.material.depthTest
          });
        }
        
        if (child.visible !== true) {
          violations.push({
            type: 'CORE_VISIBILITY',
            meshId: child.uuid,
            expected: true,
            actual: child.visible
          });
        }
      }
      
      // Check shells
      if (child.userData?.isHologramShell) {
        if (child.renderOrder !== 5) {
          violations.push({
            type: 'SHELL_RENDERORDER',
            meshId: child.uuid,
            expected: 5,
            actual: child.renderOrder
          });
        }
        
        if (child.frustumCulled !== false) {
          violations.push({
            type: 'SHELL_FRUSTUMCULL',
            meshId: child.uuid,
            expected: false,
            actual: child.frustumCulled,
            severity: 'CRITICAL'
          });
        }
        
        if (child.visible !== true) {
          violations.push({
            type: 'SHELL_VISIBILITY',
            meshId: child.uuid,
            expected: true,
            actual: child.visible
          });
        }
      }
    });
  });
  
  return violations;
}

/**
 * 🚨 VIOLATION REPORTER: Log and track violations
 */
export class ViolationReporter {
  constructor() {
    this.violations = [];
    this.maxHistory = 1000;
  }
  
  report(violation) {
    this.violations.push({
      ...violation,
      timestamp: Date.now()
    });
    
    // Keep history bounded
    if (this.violations.length > this.maxHistory) {
      this.violations.shift();
    }
    
    // Warn on critical violations
    if (violation.severity === 'CRITICAL') {
      console.error('[FRAME ENFORCEMENT] CRITICAL VIOLATION DETECTED', violation);
    }
  }
  
  getSummary() {
    const summary = {
      total: this.violations.length,
      byType: {},
      critical: 0,
      recent: []
    };
    
    for (const v of this.violations) {
      summary.byType[v.type] = (summary.byType[v.type] || 0) + 1;
      if (v.severity === 'CRITICAL') summary.critical++;
    }
    
    summary.recent = this.violations.slice(-10);
    
    return summary;
  }
  
  reset() {
    this.violations = [];
  }
}

/**
 * 🎯 FRAME ENFORCEMENT LOOP: Attach to renderer
 * 
 * @param {THREE.WebGLRenderer} renderer - Renderer
 * @param {THREE.Scene} scene - Scene
 * @param {Function} originalRender - Original render function
 * @returns {Function} Wrapped render function
 */
export function wrapRendererForFrameEnforcement(renderer, scene, originalRender) {
  const reporter = new ViolationReporter();
  let enforceCounter = 0;
  
  return function wrappedRender(...args) {
    // Every frame: enforce hierarchy
    enforceFrameHierarchy(scene);
    enforceCounter++;
    
    // Every 60 frames: detect violations
    if (enforceCounter % 60 === 0) {
      const violations = detectHierarchyViolations(scene);
      if (violations.length > 0) {
        for (const v of violations) {
          reporter.report(v);
        }
      }
    }
    
    // Call original render
    return originalRender.apply(renderer, args);
  };
}

/**
 * 🚀 SETUP: Attach frame enforcement to renderer
 * 
 * @param {THREE.WebGLRenderer} renderer - Renderer
 * @param {THREE.Scene} scene - Scene
 */
export function setupFrameEnforcement(renderer, scene) {
  if (!renderer || !scene) {
    console.error('[FRAME ENFORCEMENT] Missing renderer or scene');
    return null;
  }
  
  const reporter = new ViolationReporter();
  
  // Save original render
  const originalRender = renderer.render.bind(renderer);
  
  // Create enforcement hook
  const enforcementHook = {
    update() {
      // Every frame
      enforceFrameHierarchy(scene);
    },
    
    checkViolations() {
      const violations = detectHierarchyViolations(scene);
      if (violations.length > 0) {
        for (const v of violations) {
          reporter.report(v);
        }
      }
      return violations;
    },
    
    getReport() {
      return reporter.getSummary();
    },
    
    reset() {
      reporter.reset();
    }
  };
  
  // Wrap render loop
  renderer.render = function(s, c) {
    // Enforce BEFORE render
    enforcementHook.update();
    
    // Render
    originalRender(s, c);
    
    // Check violations AFTER render
    enforcementHook.checkViolations();
  };
  
  window.__frameEnforcement = enforcementHook;
  console.log('✅ Frame enforcement attached to renderer');
  
  return enforcementHook;
}

/**
 * 📊 DIAGNOSTICS: Check frame enforcement health
 */
export function diagnosticsReport() {
  if (!window.__frameEnforcement) {
    return { status: 'INACTIVE', message: 'Frame enforcement not active' };
  }
  
  const report = window.__frameEnforcement.getReport();
  
  console.group('[FRAME ENFORCEMENT] DIAGNOSTICS REPORT');
  console.log(`Total violations tracked: ${report.total}`);
  console.log(`Critical violations: ${report.critical}`);
  console.log(`Violations by type:`, report.byType);
  
  if (report.recent.length > 0) {
    console.group('Recent violations (last 10):');
    for (const v of report.recent) {
      console.warn(`  [${new Date(v.timestamp).toISOString()}] ${v.type}:`, v);
    }
    console.groupEnd();
  }
  
  console.groupEnd();
  
  return report;
}

/**
 * 🎬 CONSOLE API
 */
export function setupFrameEnforcementConsoleAPI() {
  if (!window.__frameEnforcementConsole) {
    window.__frameEnforcementConsole = {};
  }
  
  Object.assign(window.__frameEnforcementConsole, {
    /**
     * Get status: window.__frameEnforcementConsole.status()
     */
    status: () => {
      return diagnosticsReport();
    },
    
    /**
     * Check violations: window.__frameEnforcementConsole.check()
     */
    check: () => {
      if (!window.__frameEnforcement) {
        console.log('Frame enforcement not active');
        return [];
      }
      return window.__frameEnforcement.checkViolations();
    },
    
    /**
     * Reset reporter: window.__frameEnforcementConsole.reset()
     */
    reset: () => {
      if (window.__frameEnforcement) {
        window.__frameEnforcement.reset();
        console.log('Frame enforcement reporter reset');
      }
    }
  });
  
  console.log('✅ Frame enforcement console API: window.__frameEnforcementConsole');
}

export const FrameEnforcement = {
  enforceFrameHierarchy,
  detectHierarchyViolations,
  ViolationReporter,
  wrapRendererForFrameEnforcement,
  setupFrameEnforcement,
  diagnosticsReport,
  setupFrameEnforcementConsoleAPI
};
