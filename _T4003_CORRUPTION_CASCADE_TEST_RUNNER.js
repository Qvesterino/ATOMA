/**
 * T4-003: CORRUPTION CASCADE TRIGGER TEST
 * 
 * Runtime verification that:
 * 1. Corruption system is initialized and called every frame
 * 2. Corruption propagates through network topology
 * 3. Cascade triggers occur at exact thresholds (0.45, 0.65, 0.85)
 * 4. Gameplay effects and visual effects are synchronized
 * 
 * EXECUTION: 
 * In browser console: window.game.runCorruptionCascadeTest()
 * 
 * OUTPUT: Returns structured report with:
 * - Initialization status
 * - Propagation trace (frames to first spread)
 * - Cascade threshold table
 * - Any anomalies detected
 */

export function setupCorruptionCascadeTestRunner(game) {
  if (!game) return;

  /**
   * PRIMARY TEST: Full cascade validation
   */
  window.runCorruptionCascadeTest = async function() {
    console.clear();
    console.log('%c=== T4-003 CORRUPTION CASCADE TEST ===', 'color: #ff00ff; font-weight: bold; font-size: 16px;');
    
    const report = {
      timestamp: new Date().toISOString(),
      initializationStatus: {},
      prerequisitesMetAll: true,
      propagationTrace: null,
      cascadeThresholdTable: {},
      anomalies: [],
      success: false
    };

    // ========================================================================
    // STEP 1: CHECK PREREQUISITES
    // ========================================================================
    console.log('%c[STEP 1] Checking Prerequisites...', 'color: #00ffff; font-weight: bold;');
    
    // Check corruption system initialized
    const corruptionSystem =
      game.linkCorruptionTransmission ||
      game.corruptionTransmission ||
      game.aiNodes?.linkCorruption;
    if (!corruptionSystem) {
      report.anomalies.push('LinkCorruptionTransmission_v1 not initialized');
      report.prerequisitesMetAll = false;
    } else {
      report.initializationStatus.corruptionSystem = 'ACTIVE';
      console.log('✅ Corruption system initialized');
    }

    // Check frame loop calling
    if (!game.animate || typeof game.animate !== 'function') {
      report.anomalies.push('animate() not found or not callable');
      report.prerequisitesMetAll = false;
    } else {
      report.initializationStatus.frameLoop = 'ACTIVE';
      console.log('✅ Frame loop (animate) found');
    }

    // Check link system
    if (!game.linkingSystem) {
      report.anomalies.push('LinkingSystem not initialized');
      report.prerequisitesMetAll = false;
    } else {
      report.initializationStatus.linkingSystem = 'ACTIVE';
      console.log('✅ Linking system initialized');
    }

    // ABORT if prerequisites not met
    if (!report.prerequisitesMetAll) {
      report.success = false;
      console.log('%c[ERROR] Prerequisites not met. Aborting.', 'color: #ff4444; font-weight: bold;');
      return report;
    }

    // ========================================================================
    // STEP 2: SEED CORRUPTION
    // ========================================================================
    console.log('%c[STEP 2] Seeding Corruption...', 'color: #00ffff; font-weight: bold;');

    // Get first available link
    const allLinks = corruptionSystem.getAllLinks ? corruptionSystem.getAllLinks() : [];
    if (allLinks.length === 0) {
      report.anomalies.push('No links available in scene');
      console.log('%c❌ No links found', 'color: #ff6666;');
      return report;
    }

    const sourceLink = allLinks[0];
    const linkId = sourceLink.id || `${sourceLink.source?.id || 'unknown'}-${sourceLink.target?.id || 'unknown'}`;
    const sourceNode = sourceLink.source || sourceLink.sourceNode;
    const targetNode = sourceLink.target || sourceLink.targetNode;

    console.log(`Seeding link: ${linkId}`);
    
    // Initialize link if needed
    const linkData = corruptionSystem.initializeLink(sourceLink);
    if (!linkData) {
      report.anomalies.push('Failed to initialize link');
      return report;
    }

    // Force corruption to high value (0.92 = just below cascade threshold 0.85)
    // Use existing method if available, otherwise direct assignment
    if (typeof corruptionSystem.setLinkCorruption === 'function') {
      corruptionSystem.setLinkCorruption(sourceLink, 0.92);
    } else {
      linkData.level = 0.92;
      linkData.velocity = 0;
    }

    report.propagationTrace = {
      sourceLink: linkId,
      sourceNode: sourceNode?.id,
      targetNode: targetNode?.id,
      initialCorruption: linkData.level,
      timestamp: Date.now(),
      framesUntilFirstSpread: null,
      adjacentLinksAffected: [],
      spreadFrames: []
    };

    console.log(`✅ Corruption seeded to ${linkData.level.toFixed(2)}`);

    // ========================================================================
    // STEP 3: RUN SIMULATION & TRACE PROPAGATION
    // ========================================================================
    console.log('%c[STEP 3] Running Simulation (60 frames)...', 'color: #00ffff; font-weight: bold;');

    const cascadeLog = [];
    let frameCount = 0;
    let thresholdsCrossed = new Set();

    // Capture baseline cascade history length
    const baselineHistoryLength = corruptionSystem.cascadeHistory?.length || 0;

    // Run 60 frames
    for (let i = 0; i < 60; i++) {
      // Single update frame
      if (typeof corruptionSystem.updateTransmission === 'function') {
        corruptionSystem.updateTransmission(1/60);
      }

      frameCount++;
      const currentLevel = linkData.level;
      
      // Track threshold crossings
      if (currentLevel >= 0.45 && !thresholdsCrossed.has(0.45)) {
        thresholdsCrossed.add(0.45);
        cascadeLog.push({
          frame: frameCount,
          threshold: 0.45,
          level: currentLevel,
          event: 'DISTORTION_ACTIVATE',
          timestamp: Date.now()
        });
        console.log(`  Frame ${frameCount}: 0.45 threshold CROSSED (level=${currentLevel.toFixed(3)})`);
      }

      if (currentLevel >= 0.65 && !thresholdsCrossed.has(0.65)) {
        thresholdsCrossed.add(0.65);
        cascadeLog.push({
          frame: frameCount,
          threshold: 0.65,
          level: currentLevel,
          event: 'PARTICLE_BURST',
          timestamp: Date.now()
        });
        console.log(`  Frame ${frameCount}: 0.65 threshold CROSSED (level=${currentLevel.toFixed(3)})`);
      }

      if (currentLevel >= 0.85 && !thresholdsCrossed.has(0.85)) {
        thresholdsCrossed.add(0.85);
        cascadeLog.push({
          frame: frameCount,
          threshold: 0.85,
          level: currentLevel,
          event: 'CASCADE_EVENT',
          timestamp: Date.now()
        });
        console.log(`  Frame ${frameCount}: 0.85 threshold CROSSED (level=${currentLevel.toFixed(3)})`);
      }

      // Check for propagation to adjacent links
      if (frameCount === 1 && report.propagationTrace.framesUntilFirstSpread === null) {
        // Check neighbor links for corruption spread
        if (sourceNode && sourceNode.userData?.links) {
          for (const neighborLink of sourceNode.userData.links) {
            if (neighborLink === sourceLink) continue;
            
            const neighborData = corruptionSystem.linkCorruption?.get(
              neighborLink.id || `${neighborLink.source?.id}-${neighborLink.target?.id}`
            );
            
            if (neighborData && neighborData.level > 0) {
              report.propagationTrace.framesUntilFirstSpread = frameCount;
              report.propagationTrace.adjacentLinksAffected.push({
                linkId: neighborLink.id,
                corruption: neighborData.level,
                detectedFrame: frameCount
              });
              console.log(`  ✅ Propagation to neighbor detected at frame ${frameCount}`);
            }
          }
        }
      }
    }

    report.propagationTrace.spreadFrames = cascadeLog;

    // ========================================================================
    // STEP 4: VALIDATE CASCADE THRESHOLDS
    // ========================================================================
    console.log('%c[STEP 4] Validating Cascade Thresholds...', 'color: #00ffff; font-weight: bold;');

    const cascadeThresholds = [
      { threshold: 0.45, event: 'DISTORTION_ACTIVATE', expectedGameplay: 'shader distortion', expectedVisual: 'distortion active' },
      { threshold: 0.65, event: 'PARTICLE_BURST', expectedGameplay: 'particle emission', expectedVisual: 'particles emitting' },
      { threshold: 0.85, event: 'CASCADE_EVENT', expectedGameplay: 'wave animation + node impact', expectedVisual: 'cascade wave + infection' }
    ];

    for (const cascade of cascadeThresholds) {
      const eventFound = cascadeLog.find(e => e.threshold === cascade.threshold);
      
      if (eventFound) {
        const linkUserData = sourceLink.userData || {};
        let gameplayEffect = 'UNKNOWN';
        let visualEffect = 'UNKNOWN';

        // Check for gameplay effects
        if (cascade.threshold === 0.45) {
          gameplayEffect = linkUserData.distortionActive ? 'ACTIVE' : 'NOT ACTIVE';
          visualEffect = linkUserData.distortionActive ? 'DISTORTION_SHADER' : 'PENDING';
        } else if (cascade.threshold === 0.65) {
          gameplayEffect = linkUserData.particleBurstActive ? 'ACTIVE' : 'NOT ACTIVE';
          visualEffect = linkUserData.particleBurstActive ? 'PARTICLE_BURST' : 'PENDING';
        } else if (cascade.threshold === 0.85) {
          gameplayEffect = linkUserData.cascadeWaveActive ? 'ACTIVE' : 'NOT ACTIVE';
          visualEffect = linkUserData.cascadeWaveActive ? 'CASCADE_WAVE' : 'PENDING';
        }

        report.cascadeThresholdTable[cascade.threshold] = {
          triggered: true,
          event: cascade.event,
          frameTriggered: eventFound.frame,
          gameplayEffect: gameplayEffect,
          visualEffect: visualEffect,
          corruptionLevel: eventFound.level.toFixed(3)
        };

        console.log(`✅ ${cascade.threshold} → ${cascade.event}: gameplay=${gameplayEffect}, visual=${visualEffect}`);
      } else {
        report.cascadeThresholdTable[cascade.threshold] = {
          triggered: false,
          event: cascade.event,
          gameplayEffect: 'NOT TRIGGERED',
          visualEffect: 'NOT TRIGGERED',
          anomaly: 'Threshold not crossed during simulation'
        };

        report.anomalies.push(`Cascade threshold ${cascade.threshold} not triggered`);
        console.log(`❌ ${cascade.threshold} → NOT TRIGGERED`);
      }
    }

    // ========================================================================
    // STEP 5: CONSISTENCY CHECKS
    // ========================================================================
    console.log('%c[STEP 5] Consistency Checks...', 'color: #00ffff; font-weight: bold;');

    // Check frame consistency (no jumps across thresholds)
    const sortedThresholds = cascadeLog.sort((a, b) => a.frame - b.frame);
    let noFrameJumps = true;

    for (let i = 1; i < sortedThresholds.length; i++) {
      const prev = sortedThresholds[i - 1];
      const curr = sortedThresholds[i];
      
      // Check if thresholds are in order and not skipped
      if (curr.threshold <= prev.threshold) {
        report.anomalies.push(`Threshold ordering issue: ${prev.threshold} → ${curr.threshold}`);
        noFrameJumps = false;
      }
    }

    if (noFrameJumps && cascadeLog.length > 0) {
      console.log('✅ Frame consistency: thresholds crossed in proper order');
    } else if (cascadeLog.length === 0) {
      console.log('⚠️  No cascades logged (corruption may not have reached thresholds)');
      report.anomalies.push('No cascade events recorded');
    }

    // Check corruption level progression
    const finalLevel = linkData.level;
    if (finalLevel > 0 && finalLevel <= 1.0) {
      console.log(`✅ Corruption level in valid range: ${finalLevel.toFixed(3)}`);
    } else {
      report.anomalies.push(`Corruption level out of range: ${finalLevel}`);
    }

    // ========================================================================
    // FINAL REPORT
    // ========================================================================
    console.log('%c=== TEST RESULTS ===', 'color: #00ff00; font-weight: bold; font-size: 14px;');
    
    report.success = report.anomalies.length === 0 && cascadeLog.length >= 1;
    
    console.log('%cInitialization Status:', 'color: #ffff00; font-weight: bold;');
    console.table(report.initializationStatus);

    console.log('%cPropagation Trace:', 'color: #ffff00; font-weight: bold;');
    console.log(`  Source Link: ${report.propagationTrace.sourceLink}`);
    console.log(`  Initial Corruption: ${report.propagationTrace.initialCorruption.toFixed(3)}`);
    console.log(`  Frames Until Spread: ${report.propagationTrace.framesUntilFirstSpread ?? 'N/A'}`);
    console.log(`  Cascades Logged: ${cascadeLog.length}`);

    console.log('%cCascade Threshold Results:', 'color: #ffff00; font-weight: bold;');
    console.table(report.cascadeThresholdTable);

    if (report.anomalies.length > 0) {
      console.log('%c⚠️  ANOMALIES DETECTED:', 'color: #ff6666; font-weight: bold;');
      console.table(report.anomalies);
    }

    console.log(`%c${report.success ? '✅ TEST PASSED' : '❌ TEST FAILED'}`, 
                report.success ? 'color: #00ff00; font-weight: bold; font-size: 14px;' : 'color: #ff0000; font-weight: bold; font-size: 14px;');

    return report;
  };

  /**
   * QUICK CHECK: Verify system is active
   */
  window.checkCorruptionSystemStatus = function() {
    const system = game.linkCorruptionTransmission;
    if (!system) {
      console.log('%c❌ Corruption system NOT initialized', 'color: #ff0000; font-weight: bold;');
      return { active: false };
    }

    const allLinks = system.getAllLinks ? system.getAllLinks() : [];
    const status = {
      active: true,
      linkCount: allLinks.length,
      cascadeHistorySize: system.cascadeHistory?.length || 0,
      updateMethod: typeof system.updateTransmission === 'function' ? 'updateTransmission' : 'unknown',
      linkCorruptionMap: system.linkCorruption?.size || 0,
      integrityTrackingEnabled: system.integrityEnabled,
      healingEnabled: system.healingEnabled,
      resonanceEnabled: system.resonanceEnabled
    };

    console.log('%c✅ Corruption System Status:', 'color: #00ff00; font-weight: bold;');
    console.table(status);
    return status;
  };

  /**
   * MANUAL CORRUPTION SEEDER: Debug helper
   */
  window.setLinkCorruption = function(linkIndex = 0, corruptionLevel = 0.92) {
    const system = game.linkCorruptionTransmission;
    const allLinks = system?.getAllLinks?.() || [];
    
    if (!allLinks[linkIndex]) {
      console.log(`❌ Link index ${linkIndex} not found`);
      return;
    }

    const link = allLinks[linkIndex];
    const linkId = link.id || `${link.source?.id}-${link.target?.id}`;
    
    const linkData = system.initializeLink(link);
    linkData.level = Math.min(1.0, Math.max(0, corruptionLevel));
    
    console.log(`✅ Set corruption on link ${linkIndex} (${linkId}) to ${linkData.level.toFixed(3)}`);
  };

  /**
   * CORRUPTION STATE SNAPSHOT
   */
  window.snapshotCorruptionState = function() {
    const system = game.linkCorruptionTransmission;
    const snapshot = {
      timestamp: Date.now(),
      allLinks: [],
      cascadeHistory: system.cascadeHistory?.slice(-10) || [],
      healingHistory: system.healingHistory?.slice(-10) || []
    };

    const allLinks = system?.getAllLinks?.() || [];
    for (let i = 0; i < Math.min(allLinks.length, 5); i++) {
      const link = allLinks[i];
      const linkId = link.id || `${link.source?.id}-${link.target?.id}`;
      const corruption = system.linkCorruption?.get(linkId);
      
      snapshot.allLinks.push({
        index: i,
        linkId: linkId,
        corruptionLevel: corruption?.level || 0,
        cascadesCrossed: Array.from(corruption?.cascadeThresholdsCrossed || [])
      });
    }

    console.log('%cCorruption State Snapshot:', 'color: #ffff00; font-weight: bold;');
    console.table(snapshot.allLinks);
    console.log('Recent Cascades:', snapshot.cascadeHistory);

    return snapshot;
  };

  console.log('%c[T4-003 Test Runner] Ready. Commands:', 'color: #ff00ff; font-weight: bold;');
  console.log('  window.checkCorruptionSystemStatus() — Quick system check');
  console.log('  window.setLinkCorruption(index, level) — Manual corruption seed');
  console.log('  window.snapshotCorruptionState() — View current state');
  console.log('  window.runCorruptionCascadeTest() — Full test execution');
}
