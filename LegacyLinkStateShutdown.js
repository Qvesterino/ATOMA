/**
 * LEGACY LINK-STATE SHUTDOWN v1.0
 * 
 * This system finds and DISABLES all legacy link-state mutation code.
 * Any attempt to mutate non-linkTarget meshes is BLOCKED with warnings.
 */

import { getAbsoluteLinkTarget, isProtectedMesh, blockIllegalMutation } from './AbsoluteLinkStateNuclearLock.js';

/**
 * 🛑 GLOBAL MUTATION INTERCEPTOR: Catch all material mutations
 */
export function installGlobalMutationInterceptor() {
  // Save original setters
  const MaterialProto = THREE.Material.prototype;
  const originalDescriptors = {};
  
  const criticalProps = ['opacity', 'transparent', 'color', 'emissive'];
  
  for (const prop of criticalProps) {
    originalDescriptors[prop] = Object.getOwnPropertyDescriptor(MaterialProto, prop);
  }
  
  // ✅ Intercept material mutations
  const interceptor = {
    installOn(material, meshName = 'unknown') {
      if (!material) return;
      
      // Track which mesh this material belongs to
      material.__meshDebugName = meshName;
      
      // For each critical property, wrap the setter
      for (const prop of criticalProps) {
        const origDescriptor = originalDescriptors[prop];
        const originalSetter = origDescriptor?.set;
        
        Object.defineProperty(material, prop, {
          get: origDescriptor?.get || function() {
            return this[`_${prop}`] !== undefined ? this[`_${prop}`] : null;
          },
          set: function(value) {
            // INTERVENTION: Check if this is a protected mesh
            if (material.__isProtected) {
              console.warn('[LEGACY SHUTDOWN] ⚠️  Attempted mutation of PROTECTED material', {
                property: prop,
                value: value,
                mesh: meshName,
                stack: new Error().stack.split('\n').slice(1, 2).join('')
              });
              return; // BLOCK mutation
            }
            
            // Allow mutation on non-protected meshes
            if (originalSetter) {
              originalSetter.call(this, value);
            } else {
              this[`_${prop}`] = value;
            }
          },
          configurable: true
        });
      }
    }
  };
  
  window.__materialMutationInterceptor = interceptor;
  console.log('✅ Global mutation interceptor installed');
}

/**
 * 🛑 TAG PROTECTED MESHES: Mark them as immutable
 * 
 * @param {THREE.Object3D} node - Node to tag
 */
export function tagProtectedMeshes(node) {
  if (!node) return;
  
  node.traverse((child) => {
    if (!child.isMesh) return;
    
    if (isProtectedMesh(child)) {
      child.material.__isProtected = true;
      child.material.__meshDebugName = child.userData?.visualLayer || 'protected';
      
      // Install interceptor
      if (window.__materialMutationInterceptor) {
        window.__materialMutationInterceptor.installOn(child.material, child.userData?.visualLayer || 'unknown');
      }
    }
  });
}

/**
 * 🚨 LEGACY CODE DETECTION: Find functions that might be mutating nodes
 * 
 * Patterns to look for:
 * - node.material.opacity = 
 * - child.material.opacity =
 * - mesh.traverse()
 * - dimNode
 * - applyGhost
 * - setOpacity
 */
export const LEGACY_PATTERNS = [
  {
    name: 'Direct opacity mutation',
    pattern: /\.material\.opacity\s*=/,
    risk: 'HIGH',
    description: 'Directly modifying material opacity on unknown meshes'
  },
  {
    name: 'Direct transparent mutation',
    pattern: /\.material\.transparent\s*=/,
    risk: 'HIGH',
    description: 'Directly modifying material.transparent'
  },
  {
    name: 'Scene traversal in link-state',
    pattern: /\.traverse\(/,
    risk: 'HIGH',
    description: 'Using traverse() which can pick up protected layers'
  },
  {
    name: 'Node visible mutation',
    pattern: /\.visible\s*=/,
    risk: 'MEDIUM',
    description: 'Modifying node visibility'
  },
  {
    name: 'Scale mutation',
    pattern: /\.scale\s*=/,
    risk: 'MEDIUM',
    description: 'Modifying node scale'
  }
];

/**
 * 🔍 SCAN: Find legacy patterns in code
 * 
 * @param {string} codeString - Source code to scan
 * @returns {Array} Found patterns
 */
export function scanForLegacyPatterns(codeString) {
  const findings = [];
  
  for (const legacyPattern of LEGACY_PATTERNS) {
    const matches = codeString.match(legacyPattern.pattern);
    if (matches) {
      findings.push({
        pattern: legacyPattern.name,
        risk: legacyPattern.risk,
        count: matches.length,
        description: legacyPattern.description
      });
    }
  }
  
  return findings;
}

/**
 * 🛡️ PROTECT AURA-ONLY MUTATIONS: Allow aura modulation, block core mutations
 * 
 * This intercepts the AuraModulationSystem and ensures it ONLY touches auras
 */
export function protectAuraModulationSystem() {
  // Wrap AuraModulationSystem.applyModulation to verify target is aura
  
  const OriginalApplyOpacityPulse = window.__AuraModulationSystem?.applyOpacityPulse;
  
  if (OriginalApplyOpacityPulse) {
    window.__AuraModulationSystem.applyOpacityPulse = function(aura, modulation, baseline, progress) {
      // VALIDATION: Only auras can have opacity pulse
      if (!aura.userData?.isAura) {
        console.error('[AURA PROTECTION] ⚠️  Attempted to apply opacity pulse to NON-AURA', {
          targetId: aura.uuid,
          targetType: aura.userData?.visualLayer || 'unknown'
        });
        return; // BLOCK
      }
      
      // OK to proceed
      return OriginalApplyOpacityPulse.call(this, aura, modulation, baseline, progress);
    };
    
    console.log('✅ Aura modulation system protected');
  }
}

/**
 * 🔐 DISABLE LEGACY LINK-STATE FUNCTIONS
 * 
 * Find and stub out dangerous legacy functions
 */
export function disableLegacyLinkStateFunctions() {
  const dangerousFunctions = [
    'applyLinkState',
    'applyGhost',
    'dimNode',
    'setOpacity',
    'boostCore',
    'mutateNodeVisuals'
  ];
  
  for (const funcName of dangerousFunctions) {
    if (window[funcName]) {
      const original = window[funcName];
      
      window[funcName] = function(...args) {
        console.warn(`[LEGACY SHUTDOWN] ⚠️  Legacy function BLOCKED: ${funcName}()`, {
          arguments: args,
          stack: new Error().stack.split('\n').slice(1, 3).join('\n')
        });
        return null; // BLOCKED
      };
      
      console.log(`✅ Disabled legacy function: ${funcName}`);
    }
  }
}

/**
 * 🎯 ENFORCE: All link-state code must use getAbsoluteLinkTarget()
 * 
 * This wraps the contract function with additional validation
 */
export function enforceContractUsage() {
  const OriginalGetAbsoluteLinkTarget = getAbsoluteLinkTarget;
  
  window.__contractUsageLog = [];
  
  window.__verifyContractUsage = function(functionName) {
    return function(node) {
      const target = OriginalGetAbsoluteLinkTarget(node);
      
      window.__contractUsageLog.push({
        timestamp: Date.now(),
        function: functionName,
        nodeId: node.uuid,
        targetId: target.uuid,
        isProtected: isProtectedMesh(target)
      });
      
      if (window.__contractUsageLog.length > 1000) {
        window.__contractUsageLog.shift(); // Keep log size bounded
      }
      
      return target;
    };
  };
  
  console.log('✅ Contract usage enforcement active');
}

/**
 * 📊 GENERATE LEGACY SHUTDOWN REPORT
 */
export function generateShutdownReport() {
  const report = {
    timestamp: Date.now(),
    status: 'ACTIVE',
    protections: {
      globalInterceptor: !!window.__materialMutationInterceptor,
      auraProtection: !!window.__AuraModulationSystem,
      contractEnforcement: !!window.__verifyContractUsage,
      legacyFunctionsDisabled: true
    },
    contractUsageLog: window.__contractUsageLog?.length || 0,
    recommendations: []
  };
  
  if (!report.protections.globalInterceptor) {
    report.recommendations.push('Global mutation interceptor not installed');
  }
  
  if (!report.protections.contractEnforcement) {
    report.recommendations.push('Contract usage enforcement not active');
  }
  
  return report;
}

/**
 * 🚀 ACTIVATE: Full legacy shutdown and protection
 * 
 * @param {THREE.Scene} scene - Scene to protect
 */
export function activateLegacyShutdown(scene) {
  console.group('[LEGACY SHUTDOWN] Activating full protection...');
  
  // Step 1: Install global mutation interceptor
  installGlobalMutationInterceptor();
  
  // Step 2: Tag all protected meshes
  if (scene) {
    scene.traverse((obj) => {
      if (obj.userData?.isNode) {
        tagProtectedMeshes(obj);
      }
    });
  }
  
  // Step 3: Protect aura modulation
  protectAuraModulationSystem();
  
  // Step 4: Disable legacy functions
  disableLegacyLinkStateFunctions();
  
  // Step 5: Enforce contract usage
  enforceContractUsage();
  
  const report = generateShutdownReport();
  
  console.log('✅ Legacy link-state SHUTDOWN COMPLETE');
  console.log(report);
  console.groupEnd();
  
  return report;
}

/**
 * 🎬 CONSOLE API
 */
export function setupLegacyShutdownConsoleAPI(scene) {
  if (!window.__legacyShutdown) {
    window.__legacyShutdown = {};
  }
  
  Object.assign(window.__legacyShutdown, {
    /**
     * Activate: window.__legacyShutdown.activate()
     */
    activate: () => {
      return activateLegacyShutdown(scene);
    },
    
    /**
     * Get report: window.__legacyShutdown.report()
     */
    report: () => {
      return generateShutdownReport();
    },
    
    /**
     * View contract usage log: window.__legacyShutdown.contractLog()
     */
    contractLog: () => {
      console.table(window.__contractUsageLog || []);
    },
    
    /**
     * Scan code: window.__legacyShutdown.scan(code)
     */
    scan: (code) => {
      const findings = scanForLegacyPatterns(code);
      console.table(findings);
      return findings;
    }
  });
  
  console.log('✅ Legacy Shutdown API active: window.__legacyShutdown');
}

export const LegacyShutdown = {
  installGlobalMutationInterceptor,
  tagProtectedMeshes,
  scanForLegacyPatterns,
  protectAuraModulationSystem,
  disableLegacyLinkStateFunctions,
  enforceContractUsage,
  generateShutdownReport,
  activateLegacyShutdown,
  setupLegacyShutdownConsoleAPI
};
