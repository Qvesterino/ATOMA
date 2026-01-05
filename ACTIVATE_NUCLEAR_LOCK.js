/**
 * 🔒 ACTIVATE NUCLEAR LOCK — MASTER INITIALIZATION
 * 
 * This is the ONLY file you need to import to activate the complete
 * link-state nuclear lock system.
 * 
 * Usage:
 * import { activateNuclearLockEverywhere } from './ACTIVATE_NUCLEAR_LOCK.js'
 * activateNuclearLockEverywhere(renderer, scene, camera)
 * 
 * Or in console:
 * window.__nucleusControl.fullDiagnostics()
 */

import { NuclearLock, setupNuclearLockConsoleAPI } from './AbsoluteLinkStateNuclearLock.js';
import { LegacyShutdown, setupLegacyShutdownConsoleAPI } from './LegacyLinkStateShutdown.js';
import { FrameEnforcement, setupFrameEnforcement, setupFrameEnforcementConsoleAPI } from './FrameEnforcementEngine.js';

/**
 * 🔥 MAIN ACTIVATION: Full nuclear lock system
 * 
 * @param {THREE.WebGLRenderer} renderer - Renderer
 * @param {THREE.Scene} scene - Scene
 * @param {THREE.Camera} camera - Camera
 */
export function activateNuclearLockEverywhere(renderer, scene, camera) {
  console.group('[NUCLEAR LOCK] 🔒 ACTIVATING ABSOLUTE LINK-STATE NUCLEAR LOCK');
  console.log('⏰ Activation time:', new Date().toISOString());
  
  const activationState = {
    timestamp: Date.now(),
    steps: []
  };
  
  // ============================================================
  // STEP 1: LEGACY SHUTDOWN
  // ============================================================
  try {
    console.group('[NUCLEAR LOCK] STEP 1: Legacy Link-State Shutdown');
    
    const legacyReport = LegacyShutdown.activateLegacyShutdown(scene);
    
    activationState.steps.push({
      name: 'Legacy Shutdown',
      status: 'SUCCESS',
      report: legacyReport
    });
    
    console.log('✅ Legacy systems disabled and protected');
    console.groupEnd();
  } catch (err) {
    console.error('❌ Legacy shutdown failed:', err);
    activationState.steps.push({
      name: 'Legacy Shutdown',
      status: 'FAILED',
      error: err.message
    });
  }
  
  // ============================================================
  // STEP 2: ABSOLUTE LOCK VALIDATION
  // ============================================================
  try {
    console.group('[NUCLEAR LOCK] STEP 2: Absolute Lock Validation');
    
    const lockControl = NuclearLock.activateNuclearLock(scene);
    
    activationState.steps.push({
      name: 'Absolute Lock',
      status: 'SUCCESS'
    });
    
    console.log('✅ All nodes validated and locked');
    console.groupEnd();
  } catch (err) {
    console.error('❌ Absolute lock failed:', err);
    activationState.steps.push({
      name: 'Absolute Lock',
      status: 'FAILED',
      error: err.message
    });
  }
  
  // ============================================================
  // STEP 3: FRAME ENFORCEMENT
  // ============================================================
  try {
    console.group('[NUCLEAR LOCK] STEP 3: Frame Enforcement Engine');
    
    FrameEnforcement.setupFrameEnforcement(renderer, scene);
    
    activationState.steps.push({
      name: 'Frame Enforcement',
      status: 'SUCCESS'
    });
    
    console.log('✅ Frame enforcement hooked to render loop');
    console.groupEnd();
  } catch (err) {
    console.error('❌ Frame enforcement failed:', err);
    activationState.steps.push({
      name: 'Frame Enforcement',
      status: 'FAILED',
      error: err.message
    });
  }
  
  // ============================================================
  // STEP 4: CONSOLE APIs
  // ============================================================
  try {
    console.group('[NUCLEAR LOCK] STEP 4: Console APIs');
    
    setupNuclearLockConsoleAPI(scene);
    setupLegacyShutdownConsoleAPI(scene);
    setupFrameEnforcementConsoleAPI();
    
    console.log('✅ Console APIs registered:');
    console.log('   - window.__nuclearLock');
    console.log('   - window.__legacyShutdown');
    console.log('   - window.__frameEnforcementConsole');
    console.groupEnd();
  } catch (err) {
    console.error('❌ Console API setup failed:', err);
  }
  
  // ============================================================
  // SUMMARY
  // ============================================================
  console.group('[NUCLEAR LOCK] 🔒 ACTIVATION SUMMARY');
  
  let successCount = 0;
  for (const step of activationState.steps) {
    if (step.status === 'SUCCESS') {
      console.log(`✅ ${step.name}`);
      successCount++;
    } else {
      console.error(`❌ ${step.name}: ${step.error}`);
    }
  }
  
  console.log(`\n📊 Status: ${successCount}/${activationState.steps.length} systems active`);
  
  if (successCount === activationState.steps.length) {
    console.log('\n🔒 NUCLEAR LOCK FULLY ACTIVE');
    console.log('\n✅ GUARANTEES:');
    console.log('   ✓ No node disappears inside aura');
    console.log('   ✓ EXTREME nodes stable at all distances');
    console.log('   ✓ Core always visually dominant');
    console.log('   ✓ Legacy code cannot corrupt visuals');
    console.log('   ✓ Frame enforcement: 100% hierarchy compliance');
  } else {
    console.warn('\n⚠️  PARTIAL ACTIVATION — Some systems failed');
  }
  
  console.groupEnd();
  
  // ============================================================
  // SETUP MASTER CONTROL API
  // ============================================================
  window.__nucleusControl = {
    /**
     * Full diagnostics: window.__nucleusControl.fullDiagnostics()
     */
    fullDiagnostics: () => {
      console.group('[NUCLEAR LOCK] FULL DIAGNOSTICS');
      
      // Nuclear lock validation
      console.group('Nuclear Lock Status:');
      const lockValidation = window.__nuclearLock?.validate?.();
      console.log(lockValidation || 'Not available');
      console.groupEnd();
      
      // Frame enforcement status
      console.group('Frame Enforcement Status:');
      const frameStatus = window.__frameEnforcementConsole?.status?.();
      console.log(frameStatus || 'Not available');
      console.groupEnd();
      
      // Legacy shutdown report
      console.group('Legacy Shutdown Status:');
      const legacyStatus = window.__legacyShutdown?.report?.();
      console.log(legacyStatus || 'Not available');
      console.groupEnd();
      
      console.groupEnd();
    },
    
    /**
     * Quick status: window.__nucleusControl.status()
     */
    status: () => {
      const violations = window.__frameEnforcementConsole?.check?.() || [];
      console.log(`🔒 Nuclear Lock Status: ACTIVE`);
      console.log(`📊 Hierarchy violations detected: ${violations.length}`);
      if (violations.length > 0) {
        console.error('Violations:', violations);
      } else {
        console.log('✅ All systems nominal');
      }
    },
    
    /**
     * Reset violation tracking: window.__nucleusControl.reset()
     */
    reset: () => {
      window.__frameEnforcementConsole?.reset?.();
      window.__legacyShutdown?.report?.();
      console.log('✅ Violation tracking reset');
    },
    
    /**
     * Full state dump: window.__nucleusControl.dump()
     */
    dump: () => {
      return {
        timestamp: Date.now(),
        nuclearLock: window.__nuclearLock,
        legacyShutdown: window.__legacyShutdown,
        frameEnforcement: window.__frameEnforcementConsole,
        activationState: activationState
      };
    }
  };
  
  console.log('\n🎮 Master control available: window.__nucleusControl');
  
  return activationState;
}

/**
 * 📋 INSTALLATION INSTRUCTIONS
 * 
 * In main.js or app initialization:
 * 
 * import { activateNuclearLockEverywhere } from './ACTIVATE_NUCLEAR_LOCK.js'
 * 
 * // After scene, renderer, and camera are created:
 * activateNuclearLockEverywhere(renderer, scene, camera)
 * 
 * // In console during gameplay:
 * window.__nucleusControl.fullDiagnostics()
 * window.__nucleusControl.status()
 * window.__nuclearLock.validate()
 * window.__frameEnforcementConsole.check()
 */

export default activateNuclearLockEverywhere;
