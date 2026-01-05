/**
 * ============================================================================
 * LINK DEGRADATION SYSTEM - main.js INTEGRATION PATCH
 * ============================================================================
 * 
 * This file shows the exact changes needed to integrate LinkDegradationSystem
 * into main.js. Copy-paste friendly with clear insertion points.
 * 
 * Session: 88
 * Status: Ready for integration
 * 
 * ============================================================================
 */

// ============================================================================
// CHANGE 1: ADD IMPORT (approximately line 50-100, with other system imports)
// ============================================================================

// BEFORE (existing imports):
// import { LinkQualityCalculator } from './LinkQualityCalculator.js';
// import { LinkQualityFeedbackLoop1_0 } from './LinkQualityFeedbackLoop1_0.js';

// AFTER (add this line after LinkQualityFeedbackLoop import):
import { LinkDegradationSystem } from './LinkDegradationSystem.js';


// ============================================================================
// CHANGE 2: INITIALIZE IN CONSTRUCTOR (approximately line 2000-2100)
// ============================================================================

// Location: In GameSimulation constructor, after LinkQualityCalculator and 
//           LinkQualityFeedbackLoop initialization

// BEFORE (existing code):
// this.linkQualityCalculator = new LinkQualityCalculator(...);
// this.linkQualityFeedbackLoop = new LinkQualityFeedbackLoop1_0(...);

// AFTER (add initialization):

    // ===================================================================
    // [SESSION 88] LINK DEGRADATION SYSTEM INITIALIZATION
    // ===================================================================
    // Applies dynamic quality-based degradation to links as nodes approach
    // capacity limits. Links degrade gradually, not cut off abruptly.
    
    this.linkDegradationSystem = new LinkDegradationSystem(
      this.linkingSystem,
      this.linkQualityCalculator,
      {
        // Quality thresholds (0-100 scale, aligned with LinkQualityCalculator)
        fullQualityThreshold: 80,        // Links fully efficient
        degradedStartThreshold: 55,      // Degradation begins
        severeThreshold: 30,             // Heavy degradation
        criticalThreshold: 10,           // Near collapse
        
        // Visual effect scaling
        minVisualIntensity: 0.15,        // Don't go fully invisible
        minParticleEmission: 0.20,       // Some particles always spawn
        
        // Load noise (jitter on strained links)
        enableLoadNoise: true,
        maxLoadNoiseIntensity: 0.3,
        
        // Metrics contribution scaling
        enableMetricsScaling: true,
        minMetricsContribution: 0.1,
        
        // Degradation curve shaping
        enableExponentialFalloff: true,  // Use exponential curve (favor quality)
        exponentialPower: 1.5            // Shape: >1.0 = favor high quality
      }
    );
    
    console.log('[main.js] LinkDegradationSystem initialized ✓');


// ============================================================================
// CHANGE 3: UPDATE IN GAME LOOP (approximately line 2500-3000)
// ============================================================================

// Location: In the main game loop/update function, same place where:
//   - linkQualityCalculator.update(deltaTime) is called
//   - Other per-frame systems are updated

// BEFORE (existing code in game loop):
// this.linkQualityCalculator.update(deltaTime);
// this.linkQualityFeedbackLoop.update(deltaTime);

// AFTER (add degradation update):

    // [SESSION 88] Update link degradation system
    // MUST be called AFTER LinkQualityCalculator.update()
    if (this.linkDegradationSystem) {
      this.linkDegradationSystem.update(deltaTime);
    }


// ============================================================================
// OPTIONAL CHANGE 4: EXPOSE TO CONSOLE FOR DEBUGGING
// ============================================================================

// Location: In _initConsoleAPI() method or similar console setup

// ADD these lines to window global for debugging:

    // Link degradation system console API
    window.degradation = {
      system: this.linkDegradationSystem,
      
      debug: () => {
        this.linkDegradationSystem?.debugDumpAllDegradations();
      },
      
      stats: () => {
        const stats = this.linkDegradationSystem?.getDegradationStatistics();
        console.group('📊 Link Degradation Statistics');
        console.table(stats);
        console.groupEnd();
      },
      
      under_load: () => {
        const links = this.linkingSystem?.links?.filter(l => 
          this.linkDegradationSystem?.isUnderLoadPressure(l)
        ) ?? [];
        console.log(`⚠️  ${links.length} links under load pressure`);
        links.slice(0, 10).forEach(link => {
          const state = this.linkDegradationSystem?.getDegradationState(link);
          const src = link.source?.userData?.name ?? 'Node?';
          const tgt = link.target?.userData?.name ?? 'Node?';
          console.log(`  ${src} → ${tgt}: ${(state?.efficiency * 100).toFixed(0)}% efficiency`);
        });
      },
      
      critical: () => {
        const links = this.linkingSystem?.links?.filter(l => 
          this.linkDegradationSystem?.isCriticallyStrained(l)
        ) ?? [];
        console.log(`🚨 ${links.length} links CRITICALLY STRAINED`);
        links.forEach(link => {
          const state = this.linkDegradationSystem?.getDegradationState(link);
          const src = link.source?.userData?.name ?? 'Node?';
          const tgt = link.target?.userData?.name ?? 'Node?';
          console.log(`  ${src} → ${tgt}: STATE=${state?.state}, EFF=${(state?.efficiency * 100).toFixed(0)}%`);
        });
      },
      
      best: () => {
        const links = this.linkDegradationSystem?.getLinksSortedByDegradation(false); // Best first
        console.log(`✅ Best ${Math.min(10, links?.length ?? 0)} links:`);
        links?.slice(0, 10).forEach((link, i) => {
          const state = this.linkDegradationSystem?.getDegradationState(link);
          const src = link.source?.userData?.name ?? 'Node?';
          const tgt = link.target?.userData?.name ?? 'Node?';
          console.log(`  ${i+1}. ${src} → ${tgt}: ${(state?.efficiency * 100).toFixed(0)}% efficiency`);
        });
      },
      
      worst: () => {
        const links = this.linkDegradationSystem?.getLinksSortedByDegradation(true); // Worst first
        console.log(`🔴 Worst ${Math.min(10, links?.length ?? 0)} links:`);
        links?.slice(0, 10).forEach((link, i) => {
          const state = this.linkDegradationSystem?.getDegradationState(link);
          const src = link.source?.userData?.name ?? 'Node?';
          const tgt = link.target?.userData?.name ?? 'Node?';
          console.log(`  ${i+1}. ${src} → ${tgt}: ${(state?.efficiency * 100).toFixed(0)}% efficiency`);
        });
      }
    };
    
    console.log('✓ Degradation console API available: degradation.debug() | stats() | under_load() | critical() | best() | worst()');


// ============================================================================
// SAMPLE USAGE IN OTHER SYSTEMS
// ============================================================================

// ---- Example 1: In NeonLinkVisuals.js or link rendering system ----

updateLinkMaterial(link) {
  // Get degradation state
  const degradationState = gameSimulation.linkDegradationSystem?.getDegradationState(link);
  
  if (degradationState) {
    // Scale visual intensity by efficiency
    const visualIntensity = degradationState.visualIntensity;
    
    // Apply to material emissive
    this.material.emissive.multiplyScalar(visualIntensity);
    
    // Optional: Color tint for strained/critical links
    if (degradationState.state === 'strained') {
      this.material.emissive.addScaledVector(new THREE.Color(1, 0.2, 0.2), 0.3);
    } else if (degradationState.state === 'critical') {
      this.material.emissive.addScaledVector(new THREE.Color(1, 0.2, 0.2), 0.6);
    }
  }
}


// ---- Example 2: In CoreMetricsCalculator.js ----

calculateLinkMetricsContribution(link) {
  const baseContribution = this.computeBaseSynergy(link);
  
  // Scale by degradation efficiency
  const metricsWeight = gameSimulation.linkDegradationSystem?.getMetricsWeight(link) ?? 1.0;
  const scaledContribution = baseContribution * metricsWeight;
  
  return scaledContribution;
}


// ---- Example 3: In particle emission system ----

updateLinkParticles(link) {
  const emissionRate = gameSimulation.linkDegradationSystem?.getParticleEmissionRate(link) ?? 1.0;
  
  // Spawn fewer particles under load
  const particleCount = Math.ceil(this.baseParticleCount * emissionRate);
  
  for (let i = 0; i < particleCount; i++) {
    this.spawnParticleAlongLink(link);
  }
}


// ============================================================================
// COMPLETE INTEGRATION CHECKLIST
// ============================================================================

/*

✅ STEP 1: Add import at top of main.js
   import { LinkDegradationSystem } from './LinkDegradationSystem.js';

✅ STEP 2: Initialize in constructor
   this.linkDegradationSystem = new LinkDegradationSystem(...);

✅ STEP 3: Call update() in game loop
   this.linkDegradationSystem.update(deltaTime);

✅ STEP 4: Apply visual intensity in link rendering
   const intensity = degradationState.visualIntensity;
   material.emissive.multiplyScalar(intensity);

✅ STEP 5: Apply metrics weight in metrics calculation
   const weight = degradationState.metricsWeight;
   contribution *= weight;

✅ STEP 6: Apply particle rate in particle emission
   const rate = degradationState.particleEmissionRate;
   particleCount *= rate;

✅ OPTIONAL: Expose console API for debugging
   window.degradation = { debug, stats, under_load, critical, best, worst }

✅ TEST: Verify with console
   degradation.stats()          // Show statistics
   degradation.worst()          // Show most degraded links
   degradation.under_load()     // Show links under pressure

✅ VALIDATE: Check that:
   - Links still creatable until capacity reached
   - No hard cutoffs (gradual degradation)
   - Visual effects scale smoothly
   - Console API works
   - Performance acceptable

*/


// ============================================================================
// CONSOLE API QUICK REFERENCE
// ============================================================================

/*

After integration, use these commands:

// View all link degradation states
degradation.debug();

// Get comprehensive statistics
degradation.stats();

// Find links under load pressure (efficiency < 90%)
degradation.under_load();

// Find CRITICALLY strained links (near collapse)
degradation.critical();

// Show best 10 links (highest efficiency)
degradation.best();

// Show worst 10 links (lowest efficiency)
degradation.worst();

// Manual access to full API
const state = gameSimulation.linkDegradationSystem.getDegradationState(link);
const efficiency = gameSimulation.linkDegradationSystem.getLinkEfficiency(link);
const stats = gameSimulation.linkDegradationSystem.getDegradationStatistics();

*/

