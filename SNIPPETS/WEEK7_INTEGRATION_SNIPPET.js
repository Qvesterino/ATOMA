/**
 * PHASE 3C WEEK 7: PERSONALITY SIGNAL SMOOTHER — INTEGRATION SNIPPET
 * 
 * Copy-paste ready code for integrating PersonalitySignalSmoother_v1
 * into your game. DO NOT modify main.js — use these snippets as reference.
 * 
 * ============================================================================
 * STEP 1: IMPORT (optional, if not using global window access)
 * ============================================================================
 * 
 * import { PersonalitySignalSmoother_v1 } from './PersonalitySignalSmoother_v1.js';
 * 
 * ============================================================================
 * STEP 2: CONSTRUCTOR FIELD (in AtomaGame class)
 * ============================================================================
 * 
 * this.signalSmoother = null;
 * 
 * ============================================================================
 * STEP 3: INITIALIZATION (in init() method)
 * ============================================================================
 * 
 * // Initialize Personality Signal Smoother
 * // Applies EMA smoothing to eliminate jitter and flicker
 * try {
 *     this.signalSmoother = new PersonalitySignalSmoother_v1({
 *         debugEnabled: false, // Set to true for logging
 *         // Optional custom alpha factors:
 *         clarity: 0.15,
 *         resonance: 0.25,
 *         entropy: 0.10,
 *         focus: 0.18,
 *         corruption: 0.12,
 *     });
 *     console.log('[main.js] SignalSmoother initialized ✓');
 * } catch (err) {
 *     console.warn('[main.js] SignalSmoother init error:', err);
 * }
 * 
 * ============================================================================
 * STEP 4: UPDATE IN GAME LOOP (in animate() method)
 * ============================================================================
 * 
 * // Update personality signal smoothing (should be after personality updates)
 * // This applies EMA smoothing to reduce jitter and flicker
 * if (this.signalSmoother && this.aiNodes?.nodes) {
 *     this.signalSmoother.updateAll(this.aiNodes.nodes);
 * }
 * 
 * ============================================================================
 * STEP 5: CLEANUP (in dispose() method)
 * ============================================================================
 * 
 * // Dispose Personality Signal Smoother
 * if (this.signalSmoother) {
 *     this.signalSmoother.dispose();
 *     this.signalSmoother = null;
 * }
 * 
 * ============================================================================
 * COMPLETE INTEGRATION EXAMPLE
 * ============================================================================
 * 
 * class AtomaGame {
 *     constructor(canvas) {
 *         // ... existing fields ...
 *         this.signalSmoother = null;  // Add this
 *     }
 * 
 *     init() {
 *         // ... existing init ...
 *         
 *         // Initialize signal smoother (after personality systems init)
 *         this.signalSmoother = new PersonalitySignalSmoother_v1({
 *             debugEnabled: false,
 *         });
 *         console.log('[main.js] SignalSmoother initialized ✓');
 *     }
 * 
 *     animate(deltaTime) {
 *         // ... existing animation code ...
 *         
 *         // UPDATE: Apply personality signal smoothing
 *         if (this.signalSmoother && this.aiNodes?.nodes) {
 *             this.signalSmoother.updateAll(this.aiNodes.nodes);
 *         }
 *         
 *         // Now use smoothed signals from: node.userData.personalityVisualSmoothed
 *     }
 * 
 *     dispose() {
 *         // ... existing cleanup ...
 *         
 *         // Cleanup signal smoother
 *         if (this.signalSmoother) {
 *             this.signalSmoother.dispose();
 *         }
 *     }
 * }
 * 
 * ============================================================================
 * USING SMOOTHED VALUES
 * ============================================================================
 * 
 * // Access smoothed signals:
 * 
 * const smoothed = node.userData.personalityVisualSmoothed;
 * 
 * if (smoothed) {
 *     console.log('Smoothed signals:', {
 *         clarity:    smoothed.clarity,      // 0–1
 *         resonance:  smoothed.resonance,    // 0–1
 *         entropy:    smoothed.entropy,      // 0–1
 *         focus:      smoothed.focus,        // 0–1
 *         corruption: smoothed.corruption,   // 0–1
 *         lastUpdate: smoothed.lastUpdate,   // timestamp
 *     });
 * }
 * 
 * // Use in visual effects:
 * function updateNodeVisuals(node) {
 *     const smoothed = node.userData.personalityVisualSmoothed;
 *     if (smoothed) {
 *         node.material.emissiveIntensity = smoothed.clarity;
 *         node.material.opacity = 1 - smoothed.entropy * 0.2;
 *         // ... etc
 *     }
 * }
 * 
 * ============================================================================
 * CUSTOM ALPHA FACTORS
 * ============================================================================
 * 
 * // If you want to customize smoothing factors:
 * 
 * const smoother = new PersonalitySignalSmoother_v1({
 *     debugEnabled: false,
 *     clarity:    0.20,      // More responsive
 *     resonance:  0.30,      // Much faster
 *     entropy:    0.08,      // More smoothing
 *     focus:      0.15,      // Less responsive
 *     corruption: 0.10,      // Heavier filtering
 * });
 * 
 * // Or change at runtime:
 * this.signalSmoother.setAlphaOverrides({
 *     clarity: 0.25,
 *     entropy: 0.05,
 * });
 * 
 * ============================================================================
 * DEBUGGING
 * ============================================================================
 * 
 * // Enable debug logging:
 * this.signalSmoother.setDebugEnabled(true);
 * 
 * // Get debug info:
 * console.log(this.signalSmoother.getDebugInfo());
 * // { processedNodes, nodesProcessed, signalsSmoothed, ... }
 * 
 * // Compare raw vs smoothed values:
 * const comparison = this.signalSmoother.getSmoothnessComparison(node);
 * console.log('Raw:', comparison.raw);
 * console.log('Smoothed:', comparison.smoothed);
 * console.log('Differences:', comparison.differences);
 * 
 * // Get current alpha factors:
 * const alphas = this.signalSmoother.getAlphaFactors();
 * console.log('Current alphas:', alphas);
 * 
 * ============================================================================
 * EMA SMOOTHING FORMULA
 * ============================================================================
 * 
 * newValue = α × rawValue + (1 - α) × oldValue
 * 
 * α (alpha) = smoothing factor (0–1)
 *   Low α (0.05–0.15):  Heavy smoothing, slow response
 *   Med α (0.15–0.25):  Balanced
 *   High α (0.25–0.50): Fast response, less smoothing
 * 
 * ============================================================================
 * INPUT/OUTPUT MAPPING
 * ============================================================================
 * 
 * INPUT (Read from):
 *   node.userData.personalityVisual
 *   {
 *     clarityBoost:     0–1  → maps to 'clarity'
 *     resonanceBoost:   0–1  → maps to 'resonance'
 *     entropyPenalty:   0–1  → maps to 'entropy'
 *     focusShift:       0–1  → maps to 'focus'
 *     corruptionSignal: 0–1  → maps to 'corruption'
 *   }
 * 
 * OUTPUT (Write to):
 *   node.userData.personalityVisualSmoothed
 *   {
 *     clarity:    0–1,
 *     resonance:  0–1,
 *     entropy:    0–1,
 *     focus:      0–1,
 *     corruption: 0–1,
 *     lastUpdate: timestamp
 *   }
 * 
 * ============================================================================
 * DEFAULT ALPHA FACTORS
 * ============================================================================
 * 
 * Signal        Default α   Characteristics
 * clarity       0.15        Smooth + stable
 * resonance     0.25        Faster motion
 * entropy       0.10        Heavy smoothing
 * focus         0.18        Moderate responsive
 * corruption    0.12        Avoid flicker
 * 
 * ============================================================================
 * API METHODS
 * ============================================================================
 * 
 * // Update
 * smoother.updateNode(node)                    // Single node
 * smoother.updateAll(nodes)                    // All nodes
 * 
 * // Reset
 * smoother.resetNode(node)                     // Reset single
 * smoother.resetAll(nodes)                     // Reset all
 * 
 * // Get values
 * smoother.getSmoothedSignal(node, 'clarity') // Get one signal
 * smoother.getSmoothedSignals(node)           // Get all signals
 * smoother.getSmoothnessComparison(node)      // Compare raw vs smoothed
 * 
 * // Control
 * smoother.setAlphaOverrides({...})           // Change alpha factors
 * smoother.setDebugEnabled(true)              // Toggle debug
 * 
 * // Info
 * smoother.getAlphaFactors()                  // Get current alphas
 * smoother.getDebugInfo()                     // Get debug data
 * smoother.getSummary()                       // Get status
 * 
 * // Cleanup
 * smoother.dispose()                          // Cleanup all
 * 
 * ============================================================================
 * EXAMPLE: ADAPTIVE SMOOTHING BY GAME STATE
 * ============================================================================
 * 
 * function adjustSmoothingForGameState(state) {
 *     if (state === 'intense_combat') {
 *         // Snappier response for action
 *         game.signalSmoother.setAlphaOverrides({
 *             clarity:    0.25,  // More responsive
 *             resonance:  0.35,  // Much faster
 *             entropy:    0.12,  // Less smoothing
 *         });
 *     } else if (state === 'calm_exploration') {
 *         // Smoother, calmer visuals
 *         game.signalSmoother.setAlphaOverrides({
 *             clarity:    0.10,  // More smoothing
 *             entropy:    0.08,  // Heavy smoothing
 *             corruption: 0.10,  // Anti-flicker
 *         });
 *     } else if (state === 'menus') {
 *         // Default balanced
 *         game.signalSmoother.setAlphaOverrides({
 *             clarity:    0.15,
 *             resonance:  0.25,
 *             entropy:    0.10,
 *             focus:      0.18,
 *             corruption: 0.12,
 *         });
 *     }
 * }
 * 
 * ============================================================================
 * EXAMPLE: MONITOR SMOOTHING QUALITY
 * ============================================================================
 * 
 * function debugSmoothing() {
 *     const node = game.aiNodes.nodes[0];
 *     const comp = game.signalSmoother.getSmoothnessComparison(node);
 *     
 *     console.log('Smoothing comparison:', {
 *         raw:         comp.raw,
 *         smoothed:    comp.smoothed,
 *         differences: comp.differences,
 *     });
 *     
 *     // Check max difference
 *     const maxDiff = Math.max(...Object.values(comp.differences));
 *     console.log('Max difference:', maxDiff);
 *     
 *     // Check debug info
 *     console.log('Smoother status:', game.signalSmoother.getDebugInfo());
 * }
 * 
 * ============================================================================
 * PERFORMANCE TIPS
 * ============================================================================
 * 
 * • Call updateAll() once per frame (after personality updates)
 * • Don't create multiple smoothers
 * • Use default alpha factors initially
 * • Enable debug only during development
 * • Monitor with getDebugInfo() periodically
 * 
 * Performance:
 *   Per node:    <0.005ms
 *   100 nodes:   ~0.5ms
 *   200 nodes:   ~1.0ms ✓
 *   500 nodes:   ~2.5ms
 * 
 * ============================================================================
 * NEXT STEPS
 * ============================================================================
 * 
 * 1. Copy PersonalitySignalSmoother_v1.js to project
 * 2. Add field: this.signalSmoother = null (in constructor)
 * 3. Init smoother: in init() method
 * 4. Update each frame: smoother.updateAll(nodes) in animate()
 * 5. Use smoothed values: node.userData.personalityVisualSmoothed
 * 6. Test: enable debug mode, check getDebugInfo()
 * 7. Deploy: to production
 * 
 * ============================================================================
 */

// Example usage in console:
/*
const smoother = game.signalSmoother;
console.log(smoother.getSummary());
// { status: 'active', processedNodes: 156, ... }

smoother.setDebugEnabled(true);
// [Smoother] Debug logging enabled

smoother.updateAll(game.aiNodes.nodes);
// [Smoother] Updated 156/156 nodes

const comp = smoother.getSmoothnessComparison(game.aiNodes.nodes[0]);
console.log('Max smoothing difference:', Math.max(...Object.values(comp.differences)));

const alphas = smoother.getAlphaFactors();
console.log('Current alpha factors:', alphas);

smoother.setAlphaOverrides({ clarity: 0.20, entropy: 0.08 });
// Alpha factors updated
*/
