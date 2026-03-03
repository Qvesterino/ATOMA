/**
 * PHASE 3C WEEK 5: INTEGRATION SNIPPET FOR main.js
 * 
 * Copy-paste ready code blocks for integrating PersonalityShaderAdvancedFX_v1
 * into the AtomaGame class.
 * 
 * SAFE MODE: NO file modifications required. Optional integration only.
 * 
 * ============================================================================
 * STEP 1: ADD IMPORT (Line ~124, after other Phase 3c imports)
 * ============================================================================
 * 
 * import { PersonalityShaderAdvancedFX_v1 } from './PersonalityShaderAdvancedFX_v1.js';
 * 
 * ============================================================================
 * STEP 2: ADD CONSTRUCTOR FIELD (Line ~341, in constructor after other fields)
 * ============================================================================
 * 
 * this.advancedShaderFX = null;
 * 
 * ============================================================================
 * STEP 3: ADD INITIALIZATION (Line ~1410, in init() method)
 * ============================================================================
 * 
 * // Initialize Advanced Shader FX System
 * this.advancedShaderFX = new PersonalityShaderAdvancedFX_v1({
 *   enabled: true,
 *   lowFXMode: false,
 *   updateFrequency: 1, // Update every frame
 * });
 * 
 * ============================================================================
 * STEP 4: ADD UPDATE LOOP (Line ~1988, in animate() method)
 * ============================================================================
 * 
 * // Update Advanced Shader FX with personality signals
 * if (this.advancedShaderFX?.update) {
 *   this.advancedShaderFX.update(deltaTime, {
 *     entropy: this.personalityShaderBridge?.getSignal('entropy') ?? 0,
 *     corruption: this.personalityShaderBridge?.getSignal('corruption') ?? 0,
 *     focus: this.personalityShaderBridge?.getSignal('focus') ?? 0,
 *     energy: this.personalityShaderBridge?.getSignal('energy') ?? 0,
 *     resonance: this.personalityShaderBridge?.getSignal('resonance') ?? 0,
 *     quality: this.fxPerformanceController?.currentQuality ?? 1.0,
 *   });
 * }
 * 
 * ============================================================================
 * STEP 5: ADD CLEANUP (In dispose() method, at end)
 * ============================================================================
 * 
 * // Cleanup Advanced Shader FX
 * if (this.advancedShaderFX) {
 *   this.advancedShaderFX.dispose();
 * }
 * 
 * ============================================================================
 * STEP 6: REGISTER MATERIALS (After mesh creation, e.g., in loadLevel())
 * ============================================================================
 * 
 * // Example: Register node material
 * const nodeMaterial = new THREE.MeshStandardMaterial({ ... });
 * this.advancedShaderFX?.register(nodeMaterial, 'chaos');
 * 
 * // Example: Register link material
 * const linkMaterial = new THREE.LineBasicMaterial({ ... });
 * this.advancedShaderFX?.register(linkMaterial, 'link_flux');
 * 
 * ============================================================================
 * DISTORTION PROFILES (Choose appropriate for your materials)
 * ============================================================================
 * 
 * 'chaos'       - Random wobble (high entropy nodes)
 * 'energy'      - Radial waves (energetic nodes)
 * 'resonance'   - Standing waves (resonant links)
 * 'focus'       - UV warp distortion (focused nodes)
 * 'corruption'  - Jittery breaks (corrupted nodes)
 * 'link_flux'   - Pulsing energy flow (link visualizations)
 * 'default'     - Blended multi-effect (general purpose)
 * 
 * ============================================================================
 * CONTROL API (Can be used anytime during runtime)
 * ============================================================================
 * 
 * // Set master quality (0–1)
 * this.advancedShaderFX?.setQuality(0.75);
 * 
 * // Toggle LowFX mode (reduces visual complexity)
 * this.advancedShaderFX?.setLowFXMode(false);
 * 
 * // Enable/disable entire system
 * this.advancedShaderFX?.setEnabled(true);
 * 
 * // Get debug information
 * console.log(this.advancedShaderFX?.getDebugInfo());
 * 
 * // Unregister a specific material
 * this.advancedShaderFX?.unregister(material);
 * 
 * ============================================================================
 * COMPLETE INTEGRATION EXAMPLE
 * ============================================================================
 * 
 * Here's a full working example showing all integration points:
 * 
 * class AtomaGame {
 *   constructor(canvas) {
 *     // ... existing code ...
 *     this.advancedShaderFX = null; // Step 2
 *   }
 * 
 *   init() {
 *     // ... existing initialization ...
 *     
 *     // Step 3: Initialize Advanced Shader FX
 *     this.advancedShaderFX = new PersonalityShaderAdvancedFX_v1({
 *       enabled: true,
 *       lowFXMode: false,
 *       updateFrequency: 1,
 *     });
 *   }
 * 
 *   loadLevel() {
 *     // ... create meshes ...
 *     
 *     // Step 6: Register materials
 *     this.advancedShaderFX?.register(nodeMaterial, 'chaos');
 *     this.advancedShaderFX?.register(linkMaterial, 'link_flux');
 *   }
 * 
 *   animate(deltaTime) {
 *     // ... existing animation code ...
 *     
 *     // Step 4: Update Advanced Shader FX
 *     if (this.advancedShaderFX?.update) {
 *       this.advancedShaderFX.update(deltaTime, {
 *         entropy: this.personalityShaderBridge?.getSignal('entropy') ?? 0,
 *         corruption: this.personalityShaderBridge?.getSignal('corruption') ?? 0,
 *         focus: this.personalityShaderBridge?.getSignal('focus') ?? 0,
 *         energy: this.personalityShaderBridge?.getSignal('energy') ?? 0,
 *         resonance: this.personalityShaderBridge?.getSignal('resonance') ?? 0,
 *         quality: this.fxPerformanceController?.currentQuality ?? 1.0,
 *       });
 *     }
 *   }
 * 
 *   dispose() {
 *     // ... existing cleanup ...
 *     
 *     // Step 5: Cleanup Advanced Shader FX
 *     if (this.advancedShaderFX) {
 *       this.advancedShaderFX.dispose();
 *     }
 *   }
 * }
 * 
 * ============================================================================
 * CONSOLE API (For debugging and manual control)
 * ============================================================================
 * 
 * // In browser console:
 * 
 * // Get debug info
 * game.advancedShaderFX.getDebugInfo()
 * 
 * // Set quality dynamically
 * game.advancedShaderFX.setQuality(0.5)
 * 
 * // Toggle LowFX mode
 * game.advancedShaderFX.setLowFXMode(true)
 * 
 * // Get material count
 * game.advancedShaderFX.getMaterialCount()
 * 
 * ============================================================================
 * PERSONALITY SIGNAL SOURCES
 * ============================================================================
 * 
 * These signals come from existing systems (Week 1–4):
 * 
 * entropy      ← this.personalityShaderBridge.getSignal('entropy')
 * corruption   ← this.personalityShaderBridge.getSignal('corruption')
 * focus        ← this.personalityShaderBridge.getSignal('focus')
 * energy       ← this.personalityShaderBridge.getSignal('energy')
 * resonance    ← this.personalityShaderBridge.getSignal('resonance')
 * quality      ← this.fxPerformanceController.currentQuality
 * 
 * ============================================================================
 * TROUBLESHOOTING
 * ============================================================================
 * 
 * Effects not visible?
 *   1. Check getMaterialCount() > 0
 *   2. Verify signals are non-zero
 *   3. Check LowFXMode is false
 *   4. Verify quality > 0
 * 
 * Shader errors?
 *   1. Check browser console for warnings
 *   2. Verify material is valid THREE.Material
 *   3. Graceful fallback preserves original behavior
 * 
 * Performance issues?
 *   1. Reduce updateFrequency: { updateFrequency: 2 }
 *   2. Lower quality: setQuality(0.5)
 *   3. Enable LowFX: setLowFXMode(true)
 *   4. Unregister non-critical materials
 * 
 * ============================================================================
 */

// DO NOT EXECUTE THIS FILE — USE THE CODE SNIPPETS IN YOUR main.js
console.warn('WEEK5_INTEGRATION_SNIPPET.js is a reference document only. Copy snippets to main.js.');
