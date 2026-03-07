/**
 * SYNERGY AURA COLOR INTEGRATION EXAMPLES
 * ========================================
 * Copy-paste ready patterns for integrating synergy-driven aura colors
 * 
 * Shows 6 different integration approaches with increasing complexity
 * Pick the one that fits your architecture best
 */

import * as THREE from 'three';
import {
  initializeSynergyAuraColors,
  registerNodeAuraForColorTracking,
  updateNodeAuraColor,
  updateAllNodeAuraColors,
  updateAuraColorsFromNodes,
  autoWireAllNodeAuras,
  getColorTrackingDiagnostics,
  synergyAuraColorConsole,
} from './SynergyAuraColorIntegrationPatch.js';

// ==============================================================================
// PATTERN 1: MINIMAL INTEGRATION (Easiest, recommended)
// ==============================================================================

/**
 * One-time initialization
 * Call this ONCE when world is ready
 */
export function initializeSynergyAuraColorsMinimal(scene) {
  console.log('[SynergyAuraColor] Minimal init...');

  // Enable the system
  initializeSynergyAuraColors({
    enabled: true,
    useBatchController: true,
  });

  // Auto-wire all auras in scene
  autoWireAllNodeAuras(scene);

  console.log('[SynergyAuraColor] Ready! Auto-wired all auras');
}

/**
 * Per-frame update
 * Call this EVERY FRAME in your animation loop
 */
export function updateSynergyAuraColorsMinimal(scene, time) {
  const seconds = time / 1000;

  // Update all node auras
  updateAuraColorsFromNodes(scene.children, seconds);
}

/**
 * Usage in main.js:
 *
 * import { initializeSynergyAuraColorsMinimal, updateSynergyAuraColorsMinimal } from './SynergyAuraColorIntegrationExample.js';
 *
 * // At startup
 * initializeSynergyAuraColorsMinimal(scene);
 *
 * // In render loop
 * function animate(time) {
 *   updateSynergyAuraColorsMinimal(scene, time);
 *   renderer.render(scene, camera);
 * }
 */

// ==============================================================================
// PATTERN 2: NODE LINKING INTEGRATION
// ==============================================================================

/**
 * Track when links are created/destroyed
 * Update color based on link state
 */
export class SynergyAuraColorNodeLinkingIntegration {
  constructor(scene, nodeSystem) {
    this.scene = scene;
    this.nodeSystem = nodeSystem;
    this.nodeColorMap = new Map();  // nodeId → lastSynergy
    this.updateInterval = 16;  // ~60fps
    this.lastUpdateTime = 0;
  }

  /**
   * Initialize integration
   */
  initialize() {
    initializeSynergyAuraColors({
      enabled: true,
      useBatchController: true,
      enablePulsing: true,
    });

    autoWireAllNodeAuras(this.scene);

    // Hook into link changes (pseudocode)
    // this.nodeSystem.on('link:created', this.onLinkCreated.bind(this));
    // this.nodeSystem.on('link:destroyed', this.onLinkDestroyed.bind(this));
    // this.nodeSystem.on('synergy:changed', this.onSynergyChanged.bind(this));

    console.log('[SynergyAuraColor] Node linking integration ready');
  }

  /**
   * Called when synergy changes on a link
   */
  onSynergyChanged(linkEvent) {
    const { sourceNodeId, targetNodeId, synergy } = linkEvent;

    // Update both nodes
    updateNodeAuraColor(sourceNodeId, synergy, performance.now() / 1000);
    updateNodeAuraColor(targetNodeId, synergy, performance.now() / 1000);

    this.nodeColorMap.set(sourceNodeId, synergy);
    this.nodeColorMap.set(targetNodeId, synergy);
  }

  /**
   * Per-frame update
   */
  update(time) {
    // Only update if enough time has passed
    if (time - this.lastUpdateTime < this.updateInterval) return;

    const seconds = time / 1000;
    updateAuraColorsFromNodes(this.scene.children, seconds);

    this.lastUpdateTime = time;
  }

  /**
   * Diagnostics
   */
  printStats() {
    const diag = getColorTrackingDiagnostics();
    console.log('[SynergyAuraColor] Integration stats:', diag);
  }
}

/**
 * Usage:
 *
 * const integration = new SynergyAuraColorNodeLinkingIntegration(scene, nodeSystem);
 * integration.initialize();
 *
 * // In render loop
 * integration.update(time);
 */

// ==============================================================================
// PATTERN 3: METRIC-DRIVEN UPDATES
// ==============================================================================

/**
 * Update colors based on computed metrics
 * Works with ComputeSynergyScore system
 */
export class MetricDrivenSynergyColorController {
  constructor(scene, metricSystem) {
    this.scene = scene;
    this.metricSystem = metricSystem;
    this.nodeMetrics = new Map();
  }

  initialize() {
    initializeSynergyAuraColors({ enabled: true });
    autoWireAllNodeAuras(this.scene);
  }

  /**
   * Recompute synergy for all nodes and update colors
   */
  updateFromMetrics(time) {
    const seconds = time / 1000;
    const nodeStates = [];

    this.scene.traverse(obj => {
      if (obj.data?.id) {
        // Query metric system for synergy
        const synergy = this.metricSystem.computeNodeSynergy(obj.data.id);

        if (synergy !== undefined) {
          nodeStates.push({
            nodeId: obj.data.id,
            synergy: synergy,
          });

          this.nodeMetrics.set(obj.data.id, synergy);
        }
      }
    });

    // Batch update all colors
    updateAllNodeAuraColors(nodeStates, seconds);

    return nodeStates.length;
  }

  /**
   * Get color state for a specific node
   */
  getNodeColorState(nodeId) {
    const synergy = this.nodeMetrics.get(nodeId);
    return {
      nodeId,
      synergy,
      state: this._resolveState(synergy),
    };
  }

  _resolveState(synergy) {
    if (synergy >= 0.85) return 'AWAKENED';
    if (synergy >= 0.75) return 'STRONG';
    if (synergy >= 0.50) return 'ACTIVE';
    return 'LOW';
  }
}

/**
 * Usage:
 *
 * const controller = new MetricDrivenSynergyColorController(scene, metricSystem);
 * controller.initialize();
 *
 * // In render loop
 * controller.updateFromMetrics(time);
 */

// ==============================================================================
// PATTERN 4: CATEGORY-AWARE COLORS
// ==============================================================================

/**
 * Custom colors per node category
 */
export class CategoryAwareSynergyColorController {
  constructor(scene) {
    this.scene = scene;
    this.categoryPalettes = this._initializeCategoryPalettes();
  }

  /**
   * Define color schemes per category
   */
  _initializeCategoryPalettes() {
    return {
      control: {
        LOW: new THREE.Color(0x554455),
        ACTIVE: new THREE.Color(0xff0080),
        STRONG: new THREE.Color(0xff33cc),
        AWAKENED: new THREE.Color(0xff66ff),
      },
      prime: {
        LOW: new THREE.Color(0x334455),
        ACTIVE: new THREE.Color(0x00aa00),
        STRONG: new THREE.Color(0x00dd00),
        AWAKENED: new THREE.Color(0x00ff00),
      },
      emotional: {
        LOW: new THREE.Color(0x554433),
        ACTIVE: new THREE.Color(0xff6666),
        STRONG: new THREE.Color(0xff8899),
        AWAKENED: new THREE.Color(0xffaadd),
      },
      // ... more categories ...
    };
  }

  initialize() {
    initializeSynergyAuraColors({ enabled: true });
    autoWireAllNodeAuras(this.scene);

    console.log('[CategoryAwareSynergy] Initialized with category palettes');
  }

  /**
   * Update colors with category-specific palettes
   */
  update(time) {
    const seconds = time / 1000;

    this.scene.traverse(obj => {
      if (obj.userData?.isAura && obj.parent?.data) {
        const parentNode = obj.parent;
        const category = parentNode.data.category;
        const synergy = parentNode.data.synergy ?? 0;

        // Resolve state
        const state = this._resolveState(synergy);

        // Get category-specific color
        const palette = this.categoryPalettes[category];
        if (palette && palette[state]) {
          // Manually set color
          if (obj.material?.uniforms?.uAuraColor) {
            obj.material.uniforms.uAuraColor.value.copy(palette[state]);
          }
        }
      }
    });
  }

  _resolveState(synergy) {
    if (synergy >= 0.85) return 'AWAKENED';
    if (synergy >= 0.75) return 'STRONG';
    if (synergy >= 0.50) return 'ACTIVE';
    return 'LOW';
  }
}

/**
 * Usage:
 *
 * const controller = new CategoryAwareSynergyColorController(scene);
 * controller.initialize();
 *
 * // In render loop
 * controller.update(time);
 */

// ==============================================================================
// PATTERN 5: PERFORMANCE-OPTIMIZED BATCH
// ==============================================================================

/**
 * Maximum performance for large networks (1000+ nodes)
 */
export class OptimizedBatchSynergyColorUpdater {
  constructor(scene, updateInterval = 16) {
    this.scene = scene;
    this.updateInterval = updateInterval;
    this.lastUpdate = 0;
    this.batchSize = 100;  // Process in chunks
    this.nodeQueue = [];
  }

  initialize() {
    initializeSynergyAuraColors({
      enabled: true,
      useBatchController: true,
      enablePulsing: true,
    });

    autoWireAllNodeAuras(this.scene);
    this._buildNodeQueue();
  }

  /**
   * Pre-build list of updateable nodes
   */
  _buildNodeQueue() {
    this.nodeQueue = [];
    this.scene.traverse(obj => {
      if (obj.data?.id && obj.data?.synergy !== undefined) {
        this.nodeQueue.push(obj);
      }
    });
  }

  /**
   * Update with adaptive batching
   */
  update(time) {
    if (time - this.lastUpdate < this.updateInterval) return;

    const seconds = time / 1000;

    // Build batch in chunks
    const nodeStates = [];
    for (let i = 0; i < this.nodeQueue.length; i += this.batchSize) {
      const batch = this.nodeQueue.slice(i, i + this.batchSize);
      for (const node of batch) {
        nodeStates.push({
          nodeId: node.data.id,
          synergy: node.data.synergy,
        });
      }
    }

    // Single batch update
    const stats = updateAllNodeAuraColors(nodeStates, seconds);

    this.lastUpdate = time;
    return stats;
  }

  /**
   * Rebuild queue when nodes added/removed
   */
  invalidateCache() {
    this._buildNodeQueue();
  }
}

/**
 * Usage:
 *
 * const updater = new OptimizedBatchSynergyColorUpdater(scene);
 * updater.initialize();
 *
 * // In render loop
 * updater.update(time);
 */

// ==============================================================================
// PATTERN 6: DEBUG/VISUALIZATION
// ==============================================================================

/**
 * Visualize color state distribution
 */
export class SynergyColorDebugVisualizer {
  constructor(scene) {
    this.scene = scene;
    this.stateDistribution = {};
  }

  initialize() {
    initializeSynergyAuraColors({ enabled: true });
    autoWireAllNodeAuras(this.scene);
  }

  /**
   * Compute and display state distribution
   */
  updateVisualization(time) {
    const seconds = time / 1000;
    updateAuraColorsFromNodes(this.scene.children, seconds);

    // Tally state distribution
    const dist = {
      LOW: 0,
      ACTIVE: 0,
      STRONG: 0,
      AWAKENED: 0,
    };

    this.scene.traverse(obj => {
      if (obj.data?.synergy !== undefined) {
        const synergy = obj.data.synergy;
        if (synergy >= 0.85) dist.AWAKENED++;
        else if (synergy >= 0.75) dist.STRONG++;
        else if (synergy >= 0.50) dist.ACTIVE++;
        else dist.LOW++;
      }
    });

    this.stateDistribution = dist;
  }

  /**
   * Print HUD-friendly status
   */
  printStatus() {
    const dist = this.stateDistribution;
    const total = Object.values(dist).reduce((a, b) => a + b, 0);

    console.clear();
    console.log('╔══════════════════════════════════════╗');
    console.log('║ SYNERGY COLOR STATE DISTRIBUTION    ║');
    console.log('╠══════════════════════════════════════╣');
    console.log(`║ LOW:      ${dist.LOW.toString().padEnd(25)} ║`);
    console.log(`║ ACTIVE:   ${dist.ACTIVE.toString().padEnd(25)} ║`);
    console.log(`║ STRONG:   ${dist.STRONG.toString().padEnd(25)} ║`);
    console.log(`║ AWAKENED: ${dist.AWAKENED.toString().padEnd(25)} ║`);
    console.log('╠══════════════════════════════════════╣');
    console.log(`║ TOTAL:    ${total.toString().padEnd(25)} ║`);
    console.log('╚══════════════════════════════════════╝');
  }

  /**
   * Log performance diagnostics
   */
  printDiagnostics() {
    const diag = getColorTrackingDiagnostics();
    console.log('[SynergyAuraColor] Performance:', {
      tracked: diag.totalTracked,
      stateDistribution: diag.stateDistribution,
      avgTimePerNode: `${diag.avgTimePerNode?.toFixed(3)}ms`,
    });
  }
}

/**
 * Usage:
 *
 * const viz = new SynergyColorDebugVisualizer(scene);
 * viz.initialize();
 *
 * // In render loop
 * viz.updateVisualization(time);
 * viz.printStatus();  // Every N frames for HUD display
 */

// ==============================================================================
// COMPLETE MAIN.JS EXAMPLE
// ==============================================================================

export const COMPLETE_MAIN_JS_EXAMPLE = `
import { patchAINodesToUseFresnelAuras } from './LEGACY/aura/FresnelAuraIntegrationPatch.js';
import { initializeSynergyAuraColors, updateAuraColorsFromNodes, autoWireAllNodeAuras } from './SynergyAuraColorIntegrationPatch.js';
import { initializeSynergyAuraColorsMinimal, updateSynergyAuraColorsMinimal } from './SynergyAuraColorIntegrationExample.js';

// Setup renderer
const scene = new THREE.Scene();
const camera = new THREE.Camera();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Initialize world (pseudocode)
const world = createWorld(scene);

// 1. Apply fresnel aura shader
patchAINodesToUseFresnelAuras(AINodes, {
  enabled: true,
  variant: 'basic',
  rimPower: 2.0,
});

// 2. Apply synergy-driven colors
initializeSynergyAuraColorsMinimal(scene);

// 3. Animation loop
function animate(time) {
  // Update colors
  updateSynergyAuraColorsMinimal(scene, time);
  
  // Render
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Start
requestAnimationFrame(animate);
`;

// ==============================================================================
// EXPORT ALL PATTERNS
// ==============================================================================

export default {
  // Pattern 1: Minimal
  initializeMinimal: initializeSynergyAuraColorsMinimal,
  updateMinimal: updateSynergyAuraColorsMinimal,

  // Pattern 2: Node linking
  SynergyAuraColorNodeLinkingIntegration,

  // Pattern 3: Metric-driven
  MetricDrivenSynergyColorController,

  // Pattern 4: Category-aware
  CategoryAwareSynergyColorController,

  // Pattern 5: Optimized batch
  OptimizedBatchSynergyColorUpdater,

  // Pattern 6: Debug
  SynergyColorDebugVisualizer,

  // Main.js template
  COMPLETE_MAIN_JS_EXAMPLE,

  // Console API
  console: synergyAuraColorConsole,
};
