/**
 * PHASE 3C WEEK 6: MATERIAL PROFILE REGISTRY — INTEGRATION SNIPPET
 * 
 * Copy-paste ready code for integrating PersonalityMaterialProfileRegistry_v1
 * into your game. DO NOT modify main.js — use these snippets as reference.
 * 
 * ============================================================================
 * STEP 1: IMPORT (optional, if not using global window access)
 * ============================================================================
 * 
 * import { PersonalityMaterialProfileRegistry_v1 } from './PersonalityMaterialProfileRegistry_v1.js';
 * 
 * ============================================================================
 * STEP 2: CONSTRUCTOR FIELD (in AtomaGame class)
 * ============================================================================
 * 
 * this.materialRegistry = null;
 * 
 * ============================================================================
 * STEP 3: INITIALIZATION (in init() method, after AdvancedFX init)
 * ============================================================================
 * 
 * // Initialize Material Profile Registry
 * // This auto-assigns GPU distortion profiles to node materials by category
 * try {
 *     this.materialRegistry = new PersonalityMaterialProfileRegistry_v1({
 *         advancedFX: this.advancedShaderFX,
 *         debugEnabled: false, // Set to true for console logging
 *     });
 *     console.log('[main.js] MaterialRegistry initialized ✓');
 * } catch (err) {
 *     console.warn('[main.js] MaterialRegistry init error:', err);
 * }
 * 
 * ============================================================================
 * STEP 4: REGISTER NODES ON SPAWN (modify your node creation function)
 * ============================================================================
 * 
 * // Option A: Single node registration
 * function createNode(nodeData) {
 *     const node = createNodeMesh(nodeData);
 *     
 *     // Auto-assign material profile based on category
 *     this.materialRegistry?.registerNode(node);
 *     
 *     return node;
 * }
 * 
 * // Option B: Batch registration (for level load)
 * function loadLevel(levelData) {
 *     // ... create all nodes ...
 *     
 *     // Register all existing nodes
 *     if (this.aiNodes && this.aiNodes.nodes) {
 *         this.materialRegistry?.registerNodes(this.aiNodes.nodes);
 *     }
 * }
 * 
 * ============================================================================
 * STEP 5: CLEANUP (in dispose() method)
 * ============================================================================
 * 
 * // Dispose Material Registry (unregister all nodes)
 * if (this.materialRegistry) {
 *     this.materialRegistry.dispose();
 *     this.materialRegistry = null;
 * }
 * 
 * ============================================================================
 * COMPLETE INTEGRATION EXAMPLE
 * ============================================================================
 * 
 * class AtomaGame {
 *     constructor(canvas) {
 *         // ... existing fields ...
 *         this.advancedShaderFX = null;
 *         this.materialRegistry = null;  // Add this
 *     }
 * 
 *     init() {
 *         // ... existing init ...
 *         
 *         // Initialize AdvancedFX (Week 5)
 *         this.advancedShaderFX = new PersonalityShaderAdvancedFX_v1({...});
 *         
 *         // Initialize Material Registry (Week 6)  NEW
 *         this.materialRegistry = new PersonalityMaterialProfileRegistry_v1({
 *             advancedFX: this.advancedShaderFX,
 *             debugEnabled: false,
 *         });
 *         console.log('[main.js] MaterialRegistry initialized ✓');
 *     }
 * 
 *     createNode(nodeData) {
 *         const node = createNodeMesh(nodeData);
 *         
 *         // NEW: Auto-register profile
 *         this.materialRegistry?.registerNode(node);
 *         
 *         return node;
 *     }
 * 
 *     loadLevel(levelData) {
 *         // ... load nodes ...
 *         
 *         // NEW: Batch register all
 *         this.materialRegistry?.registerNodes(this.aiNodes.nodes);
 *     }
 * 
 *     dispose() {
 *         // ... existing cleanup ...
 *         
 *         // NEW: Cleanup registry
 *         if (this.materialRegistry) {
 *             this.materialRegistry.dispose();
 *         }
 *     }
 * }
 * 
 * ============================================================================
 * CUSTOM PROFILE MAP
 * ============================================================================
 * 
 * // If you want to customize profile assignments:
 * 
 * this.materialRegistry = new PersonalityMaterialProfileRegistry_v1({
 *     advancedFX: this.advancedShaderFX,
 *     debugEnabled: false,
 *     profileMap: {
 *         'control': 'focus',
 *         'integration': 'resonance',
 *         'boss': 'chaos',           // Custom
 *         'minion': 'energy',        // Custom
 *         'treasure': 'resonance',   // Custom
 *     },
 * });
 * 
 * ============================================================================
 * CATEGORY → PROFILE MAPPING (DEFAULT)
 * ============================================================================
 * 
 * control         → focus
 * integration     → resonance
 * analytics       → default
 * storage         → default
 * sigma           → chaos
 * emotional       → energy
 * corrupted       → corruption
 * corrupted_node  → corruption
 * mythical        → default
 * prime           → default
 * (unknown)       → default
 * 
 * ============================================================================
 * RUNTIME PROFILE CHANGES
 * ============================================================================
 * 
 * // Change a node's profile anytime:
 * this.materialRegistry?.assignProfile(node, 'chaos');
 * 
 * // Add new category mapping:
 * this.materialRegistry?.updateProfileMap({ 'exotic': 'energy' });
 * 
 * // Get node info:
 * const info = this.materialRegistry?.getNodeInfo(node);
 * 
 * ============================================================================
 * DEBUG MODE
 * ============================================================================
 * 
 * // Enable debug logging during development:
 * this.materialRegistry?.setDebugEnabled(true);
 * 
 * // Console will show:
 * // [Registry] Registering node { category: 'control', profile: 'focus', ... }
 * // [Registry] Registered 3/3 materials with profile 'focus'
 * 
 * // Inspect state:
 * console.log(this.materialRegistry?.getDebugInfo());
 * console.log(this.materialRegistry?.getSummary());
 * 
 * ============================================================================
 * API METHODS (Quick Reference)
 * ============================================================================
 * 
 * // Registration
 * registry.registerNode(node);              // Single node
 * registry.registerNodes(array);            // Batch
 * registry.assignProfile(node, 'chaos');    // Change profile
 * registry.unregisterNode(node);            // Remove node
 * 
 * // Query
 * registry.getMaterialProfile(material);    // Get profile
 * registry.getNodeInfo(node);               // Get info
 * registry.getRegisteredCount();            // Total nodes
 * registry.getProfileMap();                 // All mappings
 * 
 * // Control
 * registry.updateProfileMap(mappings);      // Add mappings
 * registry.setAdvancedFX(advancedFX);       // Set FX ref
 * registry.setDebugEnabled(true);           // Toggle debug
 * registry.getDebugInfo();                  // Debug info
 * registry.getSummary();                    // Summary
 * registry.dispose();                       // Cleanup
 * 
 * ============================================================================
 * HANDLING EDGE CASES
 * ============================================================================
 * 
 * // Safe to call with null/undefined:
 * registry.registerNode(null);              // No crash, logs warning
 * registry.assignProfile(node, null);       // No crash, returns false
 * 
 * // Safe to register same node multiple times:
 * registry.registerNode(node);              // First time: success
 * registry.registerNode(node);              // Second time: already registered
 * 
 * // Works with missing AdvancedFX:
 * const registry = new PersonalityMaterialProfileRegistry_v1({});
 * registry.setAdvancedFX(advancedFX);       // Add reference later
 * 
 * // Works with any material location:
 * node.material                             // Single material
 * node.material[]                           // Material array
 * node.materials                            // Alternative name
 * node.mesh.material                        // Nested
 * 
 * ============================================================================
 * PERFORMANCE TIPS
 * ============================================================================
 * 
 * • Per node: <1ms (fast enough for runtime)
 * • Batch: 50-100ms per 100 nodes (safe for level load)
 * • Memory: WeakMap prevents leaks, old nodes auto-cleanup
 * • CPU: Negligible impact, GPU work happens in shaders
 * 
 * ============================================================================
 * TROUBLESHOOTING
 * ============================================================================
 * 
 * Materials not getting effects:
 *   1. Check: registry.advancedFX !== null
 *   2. Check: registry.getRegisteredCount() > 0
 *   3. Enable: registry.setDebugEnabled(true)
 *   4. Inspect: registry.getNodeInfo(node)
 * 
 * Profile not applied:
 *   1. Check: registry.getProfileMap().chaos (profile exists)
 *   2. Check: registry.getMaterialProfile(mat) (material registered)
 *   3. Try: registry.assignProfile(node, 'chaos') (manual)
 * 
 * Debug logging not working:
 *   1. Enable: registry.setDebugEnabled(true)
 *   2. Open: Browser Dev Tools > Console
 *   3. Look for: [Registry] prefix
 * 
 * ============================================================================
 * MIGRATION CHECKLIST
 * ============================================================================
 * 
 * Week 5 (AdvancedFX deployed):
 *   ✓ All nodes have materials
 *   ✓ PersonalityShaderAdvancedFX_v1 working
 * 
 * Week 6 (Registry deployment):
 *   ☐ Create instance: new PersonalityMaterialProfileRegistry_v1(...)
 *   ☐ Register nodes on spawn: registerNode(node)
 *   ☐ Register existing nodes: registerNodes(nodeArray)
 *   ☐ Test: console shows [Registry] messages
 *   ☐ Nodes display distortion profiles automatically
 *   ☐ Deploy to production
 * 
 * ============================================================================
 * GLOBAL ACCESS (Console / DevTools)
 * ============================================================================
 * 
 * From browser console:
 * 
 * // Access class
 * window.PersonalityMaterialProfileRegistry_v1
 * 
 * // Check game state
 * game.materialRegistry.getSummary()
 * game.materialRegistry.getDebugInfo()
 * 
 * // Enable debug
 * game.materialRegistry.setDebugEnabled(true)
 * 
 * // Register nodes dynamically
 * game.materialRegistry.registerNode(game.aiNodes.nodes[0])
 * 
 * // Change profile
 * game.materialRegistry.assignProfile(game.aiNodes.nodes[0], 'chaos')
 * 
 * ============================================================================
 * NEXT STEPS
 * ============================================================================
 * 
 * 1. Copy PersonalityMaterialProfileRegistry_v1.js to project
 * 2. Add field: this.materialRegistry = null (in constructor)
 * 3. Init registry: in init() after AdvancedFX
 * 4. Register on spawn: in node creation function
 * 5. Test: nodes should display distortion automatically
 * 6. Deploy: to production
 * 
 * ============================================================================
 */

// Example usage in console:
/*
const registry = game.materialRegistry;
console.log(registry.getSummary());
// { status: 'active', registeredNodes: 156, advancedFXIntegrated: true, ... }

registry.setDebugEnabled(true);
// [Registry] Debug logging enabled

const node = game.aiNodes.nodes[0];
registry.registerNode(node);
// [Registry] Registering node { category: 'control', profile: 'focus', ... }

registry.getDebugInfo();
// { registeredNodes: 157, profileCounts: { focus: 45, chaos: 32, ... }, ... }
*/
