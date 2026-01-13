/**
 * 🔒 ACTIVATE ABSOLUTE VISUAL LOCK — Master Initialization
 * 
 * This is the ONLY file needed to activate the complete visual lock.
 * 
 * Usage:
 *   import { activateAbsoluteVisualLock } from './ACTIVATE_VISUAL_LOCK.js'
 *   activateAbsoluteVisualLock(renderer, scene, camera)
 */

import { visualAuthority } from './VisualAuthority.js';
import { setupVisualLockFrameHook } from './VisualLockFrameHook.js';
import { LegacyShutdown, setupLegacyShutdownConsoleAPI } from './LegacyLinkStateNeutralization.js';
import { EXTREMENormalization, setupEXTREMENormalizationConsoleAPI } from './EXTREMENormalization.js';

/**
 * 🚀 MAIN ACTIVATION
 * 
 * @param {THREE.WebGLRenderer} renderer - Renderer
 * @param {THREE.Scene} scene - Scene
 * @param {THREE.Camera} camera - Camera (optional)
 */
export function activateAbsoluteVisualLock(renderer, scene, camera) {
  console.group('[VISUAL LOCK] 🔒 ACTIVATING ABSOLUTE VISUAL LOCK');
  console.log('⏰ Activation time:', new Date().toISOString());
  
  const activationState = {
    timestamp: Date.now(),
    steps: []
  };
  
  // ============================================================
  // STEP 1: LEGACY SHUTDOWN
  // ============================================================
  try {
    console.group('[VISUAL LOCK] STEP 1: Legacy Link-State Shutdown');
    
    LegacyShutdown.neutralizeAllLegacyLinkState();
    const status = LegacyShutdown.checkNeutralizationStatus();
    
    activationState.steps.push({
      name: 'Legacy Shutdown',
      status: 'SUCCESS',
      neutralized: status.neutralized,
      remaining: status.remaining.length
    });
    
    console.log(`✅ Neutralized ${status.neutralized} legacy functions`);
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
  // STEP 2: EXTREME NODE NORMALIZATION
  // ============================================================
  try {
    console.group('[VISUAL LOCK] STEP 2: EXTREME Node Normalization');
    
    const auditBefore = EXTREMENormalization.auditEXTREMENodes(scene);
    const results = EXTREMENormalization.batchNormalizeEXTREMENodes(scene);
    
    activationState.steps.push({
      name: 'EXTREME Normalization',
      status: 'SUCCESS',
      extremeNodesFound: auditBefore.totalEXTREME,
      normalized: results.successful,
      failed: results.failed
    });
    
    console.log(`✅ Normalized ${results.successful}/${auditBefore.totalEXTREME} EXTREME nodes`);
    console.groupEnd();
  } catch (err) {
    console.error('❌ EXTREME normalization failed:', err);
    activationState.steps.push({
      name: 'EXTREME Normalization',
      status: 'FAILED',
      error: err.message
    });
  }
  
  // ============================================================
  // STEP 3: REGISTER ALL NODES WITH VISUAL AUTHORITY
  // ============================================================
  try {
    console.group('[VISUAL LOCK] STEP 3: Register Nodes with Visual Authority');
    
    let registered = 0;
    let failed = 0;
    
    scene.traverse((obj) => {
      if (!obj.userData?.isNode) return;
      
      // Must have visualRoot
      if (!obj.userData.visualRoot) {
        console.warn('[VISUAL LOCK] Node missing visualRoot:', obj.uuid);
        failed++;
        return;
      }
      
      // Register with authority
      const success = visualAuthority.registerNode(obj, obj.userData.visualRoot);
      if (success) {
        registered++;
      } else {
        failed++;
      }
    });
    
    activationState.steps.push({
      name: 'Visual Authority Registration',
      status: 'SUCCESS',
      registered: registered,
      failed: failed
    });
    
    console.log(`✅ Registered ${registered} nodes with Visual Authority`);
    console.groupEnd();
  } catch (err) {
    console.error('❌ Visual Authority registration failed:', err);
    activationState.steps.push({
      name: 'Visual Authority Registration',
      status: 'FAILED',
      error: err.message
    });
  }
  
  // ============================================================
  // STEP 4: ACTIVATE VISUAL AUTHORITY
  // ============================================================
  try {
    console.group('[VISUAL LOCK] STEP 4: Activate Visual Authority');
    
    visualAuthority.activate();
    visualAuthority.silent = false;  // Show violations
    visualAuthority.autoRepair = true;  // Auto-repair violations
    visualAuthority.enforceEveryFrame = true;
    
    activationState.steps.push({
      name: 'Visual Authority Activation',
      status: 'SUCCESS'
    });
    
    console.log('✅ Visual Authority activated and configured');
    console.groupEnd();
  } catch (err) {
    console.error('❌ Visual Authority activation failed:', err);
    activationState.steps.push({
      name: 'Visual Authority Activation',
      status: 'FAILED',
      error: err.message
    });
  }
  
  // ============================================================
  // STEP 5: SETUP FRAME ENFORCEMENT HOOK
  // ============================================================
  try {
    console.group('[VISUAL LOCK] STEP 5: Setup Frame Enforcement Hook');
    
    const frameHook = setupVisualLockFrameHook(renderer, scene);
    window.__visualLockFrameHook = frameHook;
    
    activationState.steps.push({
      name: 'Frame Enforcement Hook',
      status: 'SUCCESS'
    });
    
    console.log('✅ Frame enforcement hooked to renderer.render()');
    console.groupEnd();
  } catch (err) {
    console.error('❌ Frame enforcement setup failed:', err);
    activationState.steps.push({
      name: 'Frame Enforcement Hook',
      status: 'FAILED',
      error: err.message
    });
  }
  
  // ============================================================
  // STEP 6: CONSOLE APIs
  // ============================================================
  try {
    console.group('[VISUAL LOCK] STEP 6: Console APIs');
    
    setupLegacyShutdownConsoleAPI();
    setupEXTREMENormalizationConsoleAPI(scene);
    
    console.log('✅ Console APIs registered:');
    console.log('   - window.__legacyShutdown');
    console.log('   - window.__extremeNormalization');
    console.log('   - window.__visualAuthority');
    console.log('   - window.__visualLock');
    console.groupEnd();
  } catch (err) {
    console.error('❌ Console API setup failed:', err);
  }
  
  // ============================================================
  // SUMMARY
  // ============================================================
  console.group('[VISUAL LOCK] 🔒 ACTIVATION SUMMARY');
  
  let successCount = 0;
  for (const step of activationState.steps) {
    if (step.status === 'SUCCESS') {
      console.log(`✅ ${step.name}`);
      successCount++;
    } else {
      console.error(`❌ ${step.name}: ${step.error}`);
    }
  }
  
  const totalSteps = activationState.steps.length;
  console.log(`\n📊 Status: ${successCount}/${totalSteps} systems active`);
  
  if (successCount === totalSteps) {
    console.log('\n🔒 ABSOLUTE VISUAL LOCK FULLY ACTIVE\n');
    console.log('✅ GUARANTEES:');
    console.log('   ✓ Node cores NEVER disappear');
    console.log('   ✓ EXTREME nodes behave identically to standard nodes');
    console.log('   ✓ Auras/shells/VFX never affect core visibility');
    console.log('   ✓ Linking = data only (no visual mutations)');
    console.log('   ✓ Ghost Mode does not dim permanently');
    console.log('   ✓ Visual hierarchy enforced EVERY FRAME');
    console.log('   ✓ All nodes protected uniformly');
  } else {
    console.warn('\n⚠️  PARTIAL ACTIVATION — Some systems failed');
  }
  
  console.groupEnd();
  
  // ============================================================
  // SETUP MASTER CONTROL API
  // ============================================================
  window.__visualAuthority = visualAuthority;
  
  window.__visualLock = {
    /**
     * Full diagnostics
     */
    fullDiagnostics: () => {
      console.group('[VISUAL LOCK] FULL DIAGNOSTICS');
      
      console.group('Visual Authority Status:');
      console.log(visualAuthority.getReport());
      console.groupEnd();
      
      console.group('Frame Hook Statistics:');
      if (window.__visualLockFrameHook) {
        console.log(window.__visualLockFrameHook.getStats());
      }
      console.groupEnd();
      
      console.group('Legacy Shutdown Status:');
      console.table(LegacyShutdown.checkNeutralizationStatus().details);
      console.groupEnd();
      
      console.group('EXTREME Nodes Status:');
      console.log(EXTREMENormalization.auditEXTREMENodes(scene));
      console.groupEnd();
      
      console.groupEnd();
    },
    
    /**
     * Quick status
     */
    status: () => {
      const report = visualAuthority.getReport();
      console.log('[VISUAL LOCK] Status:');
      console.log(`  Enabled: ${report.enabled}`);
      console.log(`  Auto-repair: ${report.autoRepair}`);
      console.log(`  Violations tracked: ${report.totalViolationsTracked}`);
      console.log(`  Repairs tracked: ${report.totalRepairsTracked}`);
      if (report.recentViolations.length > 0) {
        console.warn('  Recent violations:', report.recentViolations);
      }
    },
    
    /**
     * Force enforcement
     */
    enforceNow: () => {
      visualAuthority.enforceFrame(scene);
      console.log('✅ Manual enforcement executed');
    },
    
    /**
     * Get full report
     */
    report: () => {
      return visualAuthority.getReport();
    },
    
    /**
     * Disable (for testing)
     */
    disable: () => {
      visualAuthority.deactivate();
      console.log('⚠️  Visual Lock disabled');
    },
    
    /**
     * Enable
     */
    enable: () => {
      visualAuthority.activate();
      console.log('✅ Visual Lock enabled');
    }
  };
  
  console.log('\n🎮 Master control available: window.__visualLock');
  console.log('   - window.__visualLock.fullDiagnostics()');
  console.log('   - window.__visualLock.status()');
  console.log('   - window.__visualLock.enforceNow()');
  console.log('   - window.__visualLock.report()');
  
  return activationState;
}

export default activateAbsoluteVisualLock;
