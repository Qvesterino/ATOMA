/**
 * SYNERGY INTEGRATION EXAMPLE - Complete main.js Setup
 * 
 * This shows exactly how to integrate all synergy systems into your main game loop.
 * Copy-paste the relevant sections into your main.js or game initialization code.
 */

// ============================================================================
// IMPORTS (add to top of main.js)
// ============================================================================

import * as THREE from 'three';
import { PlayerController, FirstPersonCameraController } from './rosie/controls/rosieControls.js';
import { World } from './World.js';
import { AINodes } from './AINodes.js';
import { NodeLinkingSystem } from './NodeLinkingSystem.js';

// NEW: Import synergy systems
import { SynergyVFX1_0 } from './SynergyVFX1_0.js';
// import { LinkCorrelationEngine1_0 } from './LinkCorrelationEngine1_0.js'; // Optional
// import { LinkRecommendationAI1_0 } from './LinkRecommendationAI1_0.js'; // Optional
// import { PriorityHistoryEngine1_0 } from './PriorityHistoryEngine1_0.js'; // Optional

// ============================================================================
// INITIALIZATION SECTION (in your setup function)
// ============================================================================

class AtomaGame {
  constructor() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.clock = new THREE.Clock();
    
    // Initialize game systems
    this.world = new World(this.scene);
    this.aiNodes = new AINodes(this.scene);
    this.nodeLinker = new NodeLinkingSystem(this.scene, this.camera, this.renderer, this.aiNodes);
    
    // ========================================================================
    // NEW: Initialize all synergy systems
    // ========================================================================
    this.synergyVFX = new SynergyVFX1_0(this.scene, this.camera);
    
    // Optional systems (uncomment if available)
    // this.correlationEngine = new LinkCorrelationEngine1_0();
    // this.recommendationAI = new LinkRecommendationAI1_0();
    // this.priorityHistory = new PriorityHistoryEngine1_0();
    
    // ========================================================================
    // NEW: Attach synergy systems to integration
    // ========================================================================
    this.nodeLinker.synergyIntegration.attachSynergyVFX(this.synergyVFX);
    
    // Attach optional systems if they exist
    // if (this.correlationEngine) {
    //   this.nodeLinker.synergyIntegration.attachCorrelationEngine(this.correlationEngine);
    // }
    // if (this.recommendationAI) {
    //   this.nodeLinker.synergyIntegration.attachRecommendationAI(this.recommendationAI);
    // }
    // if (this.priorityHistory) {
    //   this.nodeLinker.synergyIntegration.attachPriorityHistory(this.priorityHistory);
    // }
    
    // Setup console API for debugging
    this.synergyVFX.setupConsoleAPI();
    
    console.log('✅ Synergy systems initialized and integrated');
  }
  
  /**
   * Register a node for synergy effects
   * Call this when a new node is created
   */
  registerNode(node) {
    const nodeId = node.id || node.userData.id;
    this.synergyVFX.registerNode(node, nodeId);
  }
  
  /**
   * Register a link for synergy effects
   * Call this when a new link is created
   */
  registerLink(link) {
    const linkId = `${link.source.id}-${link.target.id}`;
    this.synergyVFX.registerLink(link, linkId);
  }
  
  /**
   * Unregister a link when it's removed
   */
  unregisterLink(link) {
    const linkId = `${link.source.id}-${link.target.id}`;
    this.synergyVFX.unregisterLink(linkId);
  }
  
  /**
   * Main animation loop
   * Call this in requestAnimationFrame
   */
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    
    // ====================================================================
    // UPDATE SYNERGY SYSTEMS (call update every frame)
    // ====================================================================
    this.nodeLinker.synergyIntegration.update(deltaTime);
    
    // Update all links
    for (const link of this.nodeLinker.links) {
      // The synergy integration is automatically called inside updateLinkCurve
      // via the handleSynergy() hook
      this.nodeLinker.updateLinkCurve(link);
    }
    
    // Update world
    this.world.update(deltaTime);
    
    // Update AI nodes
    this.aiNodes.update(deltaTime);
    
    // Render
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Cleanup on disposal
   */
  dispose() {
    this.nodeLinker.synergyIntegration.dispose();
    this.synergyVFX.dispose();
  }
}

// ============================================================================
// ALTERNATIVE: Modular Pattern (if not using class)
// ============================================================================

// This shows how to integrate synergy if you're using modular functions

let scene, camera, renderer, clock;
let nodeLinker, aiNodes, world;
let synergyVFX, synergyIntegration;

function initializeSynergySystem() {
  // Create synergy systems
  synergyVFX = new SynergyVFX1_0(scene, camera);
  
  // Attach to integration
  nodeLinker.synergyIntegration.attachSynergyVFX(synergyVFX);
  
  // Setup console API
  synergyVFX.setupConsoleAPI();
  
  console.log('✅ Synergy system ready');
}

function registerLinkForSynergy(link) {
  const linkId = `${link.source.id}-${link.target.id}`;
  
  // Register with VFX
  synergyVFX.registerLink(link, linkId);
}

function animationLoop() {
  requestAnimationFrame(animationLoop);
  
  const deltaTime = clock.getDelta();
  
  // ====================================================================
  // SYNERGY LOOP UPDATE (add this one line)
  // ====================================================================
  nodeLinker.synergyIntegration.update(deltaTime);
  
  // Update links (synergy handled automatically via integration hook)
  for (const link of nodeLinker.links) {
    nodeLinker.updateLinkCurve(link);
  }
  
  // Render
  renderer.render(scene, camera);
}

// ============================================================================
// EXAMPLE: In NodeLinkingSystem.createLink()
// ============================================================================

/**
 * Example of how createLink() should call synergy integration
 * (This is already built into NodeSynergyIntegration1_0)
 */
function createLinkExample(sourceNode, targetNode) {
  // ... existing link creation code ...
  
  const link = {
    source: sourceNode,
    target: targetNode,
    // ... other properties ...
  };
  
  // Add to scene
  this.scene.add(link.group);
  this.links.push(link);
  
  // Update curve
  this.updateLinkCurve(link);
  
  // INTEGRATION HOOK: Trigger synergy effects
  // This is called automatically by the integration system
  this.synergyIntegration?.handleSynergy(link);
}

// ============================================================================
// EXAMPLE: In NodeLinkingSystem.updateLinkCurve()
// ============================================================================

/**
 * Example of where synergy integration is called in update loop
 * (Added at the end of updateLinkCurve method)
 */
function updateLinkCurveExample(link) {
  // ... existing curve update code ...
  
  const start = link.source.position;
  const end = link.target.position;
  
  // Update geometry
  const distance = start.distanceTo(end);
  const midPoint = new THREE.Vector3(
    (start.x + end.x) / 2,
    Math.max(start.y, end.y) + distance * 0.2,
    (start.z + end.z) / 2
  );
  
  // Update all curves...
  // ... existing update code ...
  
  // INTEGRATION HOOK: Automatic synergy updates
  // Called every frame for smooth animations
  this.synergyIntegration?.handleSynergy(link);
}

// ============================================================================
// CONSOLE API: Available Commands
// ============================================================================

/**
 * Run these in browser console (F12) to debug/adjust:
 */

// View synergy configuration
// window.game.synergyIntegration.getConfig();

// Adjust synergy thresholds
// window.game.synergyIntegration.setConfig('auraThreshold', 0.3);
// window.game.synergyIntegration.setConfig('highwayThreshold', 0.6);

// Check system status
// window.game.synergyIntegration.getStatus();

// Trigger burst effect on first link
// const link = window.nodeLinker.links[0];
// window.game.synergyVFX.triggerBurst(link, "#44ff44");

// Enable/disable subsystems
// window.game.synergyIntegration.setConfig('enableVFX', true);
// window.game.synergyIntegration.setConfig('enableHighways', true);

// ============================================================================
// QUICK START: Copy-Paste Checklist
// ============================================================================

/*
To integrate synergy into your game:

1. ✅ Add imports at top of main.js:
   import { SynergyVFX1_0 } from './SynergyVFX1_0.js';

2. ✅ In initialization:
   synergyVFX = new SynergyVFX1_0(scene, camera);
   nodeLinker.synergyIntegration.attachSynergyVFX(synergyVFX);
  // Highways are handled by the active SynergyHighways2_0 runtime path.

3. ✅ In animation loop:
   nodeLinker.synergyIntegration.update(deltaTime);

4. ✅ No other changes needed!
   Everything else is automatic.

The synergy systems will:
  - Automatically compute link synergy
  - Automatically update VFX effects
  - Automatically render highways
  - Automatically trigger bursts on changes
  - Automatically register nodes/links
  - Automatically handle all edge cases

Zero additional work required!
*/

// ============================================================================
// EXPORT (if using ES modules)
// ============================================================================

export { AtomaGame };
