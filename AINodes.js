import * as THREE from 'three';
import { filterRaycastIntersections } from './CanonicalInteractionFilter.js';
import { EnhancedNodeModels } from './EnhancedNodeModels.js';
import { freezeNodeCoreState } from './NodeCoreMaterialAuthority.js';

function isLinkSpawnEnabled() {
  if (typeof window === 'undefined') return false;
  return window.ATOMA_LINK_SPAWN_ENABLED === true; // OPT-IN only
}

if (typeof window !== "undefined") {
  window.EnhancedNodeModels = EnhancedNodeModels;
  // FIX 1: Remove top-level registry initialization to prevent THREE race condition
  // Registry now initializes lazily inside runtime paths (create(), factory calls)
}
// Debug/guard flag: disable all visual fallbacks (legacy simple spheres, etc.)
if (typeof window !== 'undefined' && window.ATOMA_NO_FALLBACK_SPHERES === undefined) {
  window.ATOMA_NO_FALLBACK_SPHERES = false;
}

const ALLOWED_GEOMETRIES = new Set([
  'BufferGeometry'
]);

const FORBIDDEN_NODE_GEOMETRIES = new Set([
  'SphereGeometry',
  'IcosahedronGeometry',
  'RingGeometry',
  'CircleGeometry',
  'TorusGeometry'
]);

// ===== DEV-ONLY HELPERS: spawn pool vs registry diagnostics =====
if (typeof window !== 'undefined') {
  window.debugSpawnPools = function() {
    const ai = window.game?.aiNodes;
    const pools = {
      categories: ai?.nodeCategories ? [...ai.nodeCategories] : null,
      specialNodeTypes: ai?.specialNodeTypes ? [...ai.specialNodeTypes] : null,
      newNodeCategories: ai?.newNodeCategories ? [...ai.newNodeCategories] : null
    };
    console.table([
      { pool: 'categories', count: pools.categories?.length ?? 0, values: pools.categories },
      { pool: 'specialNodeTypes', count: pools.specialNodeTypes?.length ?? 0, values: pools.specialNodeTypes },
      { pool: 'newNodeCategories', count: pools.newNodeCategories?.length ?? 0, values: pools.newNodeCategories }
    ]);
    return pools;
  };

  window.debugComparePoolsVsRegistry = function() {
    window.EnhancedNodeModels?.ensureRegistryReady?.();
    const registry = window.EnhancedNodeModels?.__ALL_NODE_FACTORIES || {};
    const categories = Object.keys(registry);
    const rows = categories.map(cat => {
      const registryCount = Array.isArray(registry[cat]) ? registry[cat].length : 0;
      // In this pipeline, spawn pools pull directly from EnhancedNodeModels variant arrays; use registry as proxy
      const poolCount = registryCount;
      return {
        category: cat,
        poolCount,
        registryCount,
        missingInPool: Math.max(registryCount - poolCount, 0)
      };
    });
    console.table(rows);
    return rows;
  };
}

import { SafeMetricsDNAIntegration1_0 } from './SafeMetricsDNAIntegration1_0.js';
import { applyMetricCompatibility } from './MetricCompatibilityLayer.js';
import { atomaNamingEngine } from './_AtomaNamingEngine.js';
import { isEmissiveCapable, safeSetEmissive } from './_EmissiveUtils.js';
import { NodeSpawnLogger } from './_NodeSpawnLogger4_0.js';
import { NodeVisualBootstrap3_0 } from './_NodeVisualBootstrap3_0.js';
import { NODE_VISUAL_REGISTRY, CATEGORY_POOLS } from './NodeVisualRegistry.js';
// LEGACY SPAWN MODULE REMOVED – HARD DISABLED
// import { ExtremeAINodePack } from './_ExtremeAINodePack.js';
// import { ExtremeNodeArchetypes_SafePack } from './_ExtremeNodeArchetypes_SafePack.js';
import { spawnCycleValidator } from './SpawnCycleValidator.js';
import { updateHologramShellMaterial, reassertNodeHologramShell } from './CoreHologramShader.js';
import { NodeCategoryAudit, auditNodeVisuals } from './NodeCategoryAudit.js';
import { assignLinkTarget } from './LinkTargetContract.js';
import { AuraLODCulling } from './AuraLODCulling.js';
import { LegacyNodeModelFilter } from './LegacyNodeModelFilter.js';
import { NodeVisualAuthorityRuntime } from './NodeVisualAuthorityRuntime.js';
import { uniqueSpawnRegistry } from './UniqueSpawnRegistry.js';
import { uniqueSpawnService } from './UniqueSpawnService.js';

function vfxFlag(name, def = true) {
  const v = (typeof window !== 'undefined') ? window[name] : undefined;
  return (v === undefined) ? def : !!v;
}
import { spawnAuthorityComplianceGate } from './SpawnAuthorityComplianceGate.js';
import { nodeSpawnRegistry } from './NodeSpawnRegistry.js';
import { NodeDepthAndHoloPreservationFix } from './NodeDepthAndHoloPreservationFix.js';
import { initNodeMetrics, onNodeSpawn } from './src/metrics/NodeMetricEngine.js';
// import { validateObject3D as validateSpherePolicyObject3D } from './VisualSpherePolicy.js';

// === SPAWN DIAGNOSTICS (temporary, minimal overhead) ===
const __ensureSpawnDiag = () => {
  if (typeof window === 'undefined') return null;
  window.__SPAWN_DIAG = window.__SPAWN_DIAG || {
    createNodesEnter: 0,
    createNodesSkip: 0,
    spawnNodeEnter: 0,
    spawnNodeAbort: {},
    finalizeNull: {},
    logged: 0
  };
  return window.__SPAWN_DIAG;
};
const __SPAWN_DIAG_ONCE = typeof Set !== 'undefined' ? new Set() : { has: () => false, add: () => {} };
const __diagOnce = (key, msg) => {
  if (__SPAWN_DIAG_ONCE.has(key)) return;
  __SPAWN_DIAG_ONCE.add(key);
  try {
    console.error(msg);
  } catch (e) {
    /* no-op */
  }
};

// Debug flag helper for spawn logging
const shouldLogSpawn = () => (typeof window !== 'undefined' && window.ATOMA_DEBUG_SPAWN_LOGS === true);

function findSpawnIdentity(node){
  let src = null;
  if (node && typeof node.traverse === 'function') {
    node.traverse(o=>{
      if (!src && o.userData && (o.userData.visualCode != null || o.userData.factoryName)) src = o;
    });
  }
  return (src && src.userData) ? src.userData : (node?.userData || {});
}

// Preserve visual identity between wrappers
function copySpawnIdentity(fromObj, toObj) {
  if (!fromObj || !toObj) return;
  const src = fromObj.userData || {};
  toObj.userData = toObj.userData || {};
  ['visualCode', 'factoryName', 'category'].forEach((k) => {
    if (src[k] !== undefined && toObj.userData[k] === undefined) {
      toObj.userData[k] = src[k];
    }
  });
}

function hasRenderableVisual(object3D) {
  if (!object3D) return false;
  const stack = [object3D];
  while (stack.length) {
    const obj = stack.pop();
    if (obj.isMesh || obj.isLine || obj.isPoints) {
      return true;
    }
    if (obj.children && obj.children.length) {
      stack.push(...obj.children);
    }
  }
  return false;
}

function validateNodeVisualIntegrity(root) {
  const result = {
    meshCount: 0,
    materiallessMeshes: [],
    geometrylessMeshes: [],
    hasLinesPoints: false,
  };
  if (!root) return result;
  root.traverse((obj) => {
    if (!obj || obj.isObject3D !== true) return;
    if (obj.isMesh === true) {
      result.meshCount++;
      if (!obj.material) result.materiallessMeshes.push(obj.uuid || obj.id || 'unknown');
      if (!obj.geometry) result.geometrylessMeshes.push(obj.uuid || obj.id || 'unknown');
    } else if (obj.isLine === true || obj.isPoints === true) {
      result.hasLinesPoints = true;
    }
  });
  return result;
}

function purgeForbiddenNodePrimitives(visualRoot) {
  if (!visualRoot) return { removed: 0 };
  let removed = 0;
  const strictMode = typeof window !== 'undefined' && window.ATOMA_STRICT_NODE_GEOMETRY_MODE === true;
  const toRemove = [];

  visualRoot.traverse(obj => {
    if (!obj?.isMesh) return;
    const g = obj.geometry?.type;
    const geometryForbidden = FORBIDDEN_NODE_GEOMETRIES.has(g);
    const strictBlocked = strictMode && !ALLOWED_GEOMETRIES.has(g);
    if (!geometryForbidden && !strictBlocked) return;
    // BYPASSED FOR VISUAL-REJECTION-BYPASS PHASE - allow all primitives
    if (window.ATOMA_DEBUG_VISUAL_KILL === true) {
      console.warn('[NODE_VISUAL_KILL] Primitive bypassed (would be removed):', g || 'unknown');
    }
    // toRemove.push(obj); // DISABLED
  });

  // BYPASSED - no primitives will be removed
  // for (const obj of toRemove) {
  //   obj.visible = false;
  //   obj.parent?.remove(obj);
  //   removed++;
  // }
  return { removed };
}

// ============================================================
// ATOMA EMISSIVE SAFETY GUARD 4.0
// Globally prevents MeshBasicMaterial emissive warnings
// Non-breaking: only strips unsupported keys from setValues()
// ============================================================
(function patchMeshBasicEmissiveGuard() {
  if (!THREE || !THREE.MeshBasicMaterial) return;

  const proto = THREE.MeshBasicMaterial.prototype;
  if (proto.__atomaEmissiveGuardPatched) return;
  proto.__atomaEmissiveGuardPatched = true;

  const originalSetValues = proto.setValues;

  proto.setValues = function patchedSetValues(values) {
    if (values && (values.emissive !== undefined || values.emissiveIntensity !== undefined)) {
      // Create copy without unsupported keys to prevent THREE warnings
      const cleaned = Object.assign({}, values);
      if ('emissive' in cleaned) delete cleaned.emissive;
      if ('emissiveIntensity' in cleaned) delete cleaned.emissiveIntensity;
      return originalSetValues.call(this, cleaned);
    }
    return originalSetValues.call(this, values);
  };
})();

// ============================================================
// LUCY MEGA PATCH 1.0 - LINE MATERIAL EMISSIVE GUARDS
// Prevents LineBasicMaterial and LineDashedMaterial warnings
// ============================================================
(function patchLineEmissiveGuard() {
  if (!THREE) return;

  // Patch LineBasicMaterial
  if (THREE.LineBasicMaterial && !THREE.LineBasicMaterial.prototype.__atomaLineEmissiveGuardPatched) {
    const lineProto = THREE.LineBasicMaterial.prototype;
    lineProto.__atomaLineEmissiveGuardPatched = true;
    const originalLineSetValues = lineProto.setValues;
    
    lineProto.setValues = function(values) {
      if (!values) return originalLineSetValues.call(this, values);
      if ('emissive' in values) delete values.emissive;
      if ('emissiveIntensity' in values) delete values.emissiveIntensity;
      return originalLineSetValues.call(this, values);
    };
  }

  // Patch LineDashedMaterial
  if (THREE.LineDashedMaterial && !THREE.LineDashedMaterial.prototype.__atomaLineDashedEmissiveGuardPatched) {
    const dashedProto = THREE.LineDashedMaterial.prototype;
    dashedProto.__atomaLineDashedEmissiveGuardPatched = true;
    const originalDashedSetValues = dashedProto.setValues;
    
    dashedProto.setValues = function(values) {
      if (!values) return originalDashedSetValues.call(this, values);
      if ('emissive' in values) delete values.emissive;
      if ('emissiveIntensity' in values) delete values.emissiveIntensity;
      return originalDashedSetValues.call(this, values);
    };
  }

  // ============================================================
  // MATERIAL SAFETY 4.0: Shader Material Emissive Guards
  // Prevents warnings for ShaderMaterial and RawShaderMaterial
  // ============================================================
  
  // Patch ShaderMaterial
  if (THREE.ShaderMaterial && !THREE.ShaderMaterial.prototype.__atomaShaderEmissiveGuardPatched) {
    const shaderProto = THREE.ShaderMaterial.prototype;
    shaderProto.__atomaShaderEmissiveGuardPatched = true;
    const originalShaderSetValues = shaderProto.setValues;
    
    shaderProto.setValues = function(values) {
      if (!values) return originalShaderSetValues.call(this, values);
      if ('emissive' in values) delete values.emissive;
      if ('emissiveIntensity' in values) delete values.emissiveIntensity;
      return originalShaderSetValues.call(this, values);
    };
  }

  // Patch RawShaderMaterial
  if (THREE.RawShaderMaterial && !THREE.RawShaderMaterial.prototype.__atomaRawShaderEmissiveGuardPatched) {
    const rawShaderProto = THREE.RawShaderMaterial.prototype;
    rawShaderProto.__atomaRawShaderEmissiveGuardPatched = true;
    const originalRawShaderSetValues = rawShaderProto.setValues;
    
    rawShaderProto.setValues = function(values) {
      if (!values) return originalRawShaderSetValues.call(this, values);
      if ('emissive' in values) delete values.emissive;
      if ('emissiveIntensity' in values) delete values.emissiveIntensity;
      return originalRawShaderSetValues.call(this, values);
    };
  }
})();

/**
 * AI Node System - Interactive nodes that respond to player proximity
 * Unified system that works across all ATOMA environments
 */
export class AINodes {
  constructor(scene, player, variantEngine = null) {
    this.scene = scene;
    this.player = player;
    this.variantEngine = variantEngine || (typeof window !== 'undefined' ? window.sessionVariantEngine : null);
    this.nodes = [];
    this.nodesMap = new Map();
    this.connections = [];
    this.activationDistance = 8;
    this.activationHysteresis = 2; // PHASE VD-3 FIX: Prevent flickering at threshold
    this.connectionDistance = 15;
    this.debugMode = false;  // Set to true for spawn debug logging

    // Spawn range helpers for fallback recovery
    this.minSpawnDistance = 15;
    this.maxSpawnDistance = 55;
    
    // [INTERACTION AUTHORITY] Disable raycasting on visual-only meshes
    // This ensures visual meshes NEVER block node selection raycasts
    this._disableRaycastOnVisualMeshes();
    
    // VISUAL BOOTSTRAP 3.0: Synchronous visual initialization on spawn
    this.visualBootstrap = new NodeVisualBootstrap3_0({ debugMode: false });
    
    // Complete the rest of constructor initialization
    this._finishConstructorInit();
  }
  
  /**
   * [INTERACTION AUTHORITY] Disable raycasting on visual-only meshes
   * Ensures that auras, shells, particles, and other visual layers
   * NEVER intercept raycasts for node selection
   * 
   * @private
   */
  _disableRaycastOnVisualMeshes() {
    // Global handler: Override raycast function for known visual-only types
    const visualOnlyTypes = [
      'isAura', 'isShell', 'isHologramShell', 'isFX', 'isParticle',
      'isGlyph', 'isLinkVisual', 'isLinkGlow', 'isSelectionGlow',
      'isSelectionHighlight', 'isHover', 'visualLayer'
    ];
    
    // Every time a mesh is added to scene, ensure visual meshes don't raycast
    if (!this.scene) return;
    
    // Traverse existing scene and disable visual raycasts
    this.scene.traverse(obj => {
      if (!obj.isMesh) return;
      
      // Check if object is marked as visual-only
      const userData = obj.userData || {};
      const isVisualOnly = 
        userData.isAura === true ||
        userData.isShell === true ||
        userData.isHologramShell === true ||
        userData.isFX === true ||
        userData.isParticle === true ||
        userData.isGlyph === true ||
        userData.isLinkVisual === true ||
        userData.isLinkGlow === true ||
        userData.isSelectionGlow === true ||
        userData.isSelectionHighlight === true ||
        userData.nonInteractive === true ||
        userData.visualLayer === 'AURA' ||
        userData.visualLayer === 'SHELL' ||
        userData.visualLayer === 'VISUAL_ONLY';
      
      // Disable raycasting on visual-only meshes
      if (isVisualOnly) {
        obj.raycast = () => null;
      }
    });
  }
  
  /**
   * Hook: Called after any node is added to scene
   * Ensures visual meshes don't participate in raycasts
   * @private
   */
  _enforceNodeRaycastAuthority(node) {
    if (!node) return;
    
    node.traverse(child => {
      if (!child.isMesh) return;
      
      // If marked as visual-only, disable raycasting
      const userData = child.userData || {};
      if (userData.isAura === true ||
          userData.isShell === true ||
          userData.isHologramShell === true ||
          userData.isFX === true ||
          userData.isParticle === true ||
          userData.isGlyph === true ||
          userData.isLinkVisual === true ||
          userData.visualLayer === 'AURA' ||
          userData.visualLayer === 'SHELL') {
        child.raycast = () => null;
      }
    });
  }
  
  /**
   * CONTINUE: Finish initializing the rest of the constructor properties
   * This completes what the original constructor started
   * @private
   */
  _finishConstructorInit() {
    // ========== AURA LOD CULLING v2.0 (Session 74) ==========
    // Distance-based aura visibility gating (rendering only, not logic)
    this.auraLOD = new AuraLODCulling({
      distanceThreshold: 30,
      hysteresis: 3,
      updateInterval: 100,
      keepVisibleWhenSelected: true,
    });
    
    // ========== EXTREME SYSTEMS ACTIVATION v1.0 ==========
    // Initialize EXTREME node packs (visual + archetype definitions)
    // LEGACY SPAWN MODULE REMOVED – HARD DISABLED
    this.extremeNodePack = null;
    this.extremeArchetypesPack = null;
    
    // ========== EXTENDED SPAWN SYSTEM 1.0 ==========
    // 6 standard node categories with 4 variants each
    this.nodeCategories = [
      'input','process','integration','analytics','storage','control',
      'mythic','prime','error','emotional'
    ];
    
    // Special multi-output node types (10% chance of appearing)
    this.specialNodeTypes = ['sigma', 'quantum', 'emotional'];
    
    // NEW CATEGORIES (v1.0): Mythic, Prime, Error
    this.newNodeCategories = ['mythic', 'prime', 'error'];

    // Per-category variant counters (deterministic, no cross-category coupling)
    this._variantCounterByCategory = {};
    this.spawnStats = {
      attempts: 0,
      success: 0,
      skippedCap: 0,
      lastSpawnAt: 0
    };
    this.spawnState = {
      lastSpawnTime: 0,
      cooldownMs: 1000
    };
    this.pendingLinkJobs = [];
    this._linkJobStats = { pending: 0, processed: 0, created: 0 };
    this.pendingDensityIntent = null;
    this._missingFactoryLogged = new Set();
    this._factoryReadyLogged = false;
    this._factoryMissingStreak = 0;
    this._factoryMissingDumped = false;
    this._factoryMissingPausedLogged = false;
    this._lastSpawnResult = { ok: false, reason: 'INIT' };
    this._spawnFromUpdate = false;
    this._spawnPauseLogged = false;
    if (typeof window !== 'undefined') {
      window.ATOMA_DEBUG = window.ATOMA_DEBUG || {};
      if (window.ATOMA_DEBUG_SPAWN_LOGS === undefined) {
        window.ATOMA_DEBUG_SPAWN_LOGS = false;
      }
      window.ATOMA_DEBUG.getNodeCount = () => this.getNodeCount();
      window.ATOMA_DEBUG.getSpawnStats = () => this.getSpawnStats();
      window.ATOMA_DEBUG.spawnGates = () => {
        const cap = this.spawningConfig?.targetPopulation ?? this.getTargetPopulation();
        const nodeCount = this.getNodeCount();
        const cooldownRemaining = Math.max(
          0,
          this.spawnState.cooldownMs - (Date.now() - this.spawnState.lastSpawnTime)
        );
        const seedDelayPending =
          this.spawningConfig?.seedDelayMs !== undefined && this._runtimeSpawnIndex === 0;
        return {
          cap,
          nodeCount,
          lastSpawnTime: this.spawnState.lastSpawnTime,
          nextTimeSpawn: this.spawningConfig?.nextTimeSpawn,
          skippedCap: this.spawnStats.skippedCap,
          counters: this._spawnAbortCounters,
          gates: {
            spawnMode: this.spawnMode,
            seedDelayPending,
            needsRearm: !!this.spawningConfig?.needsRearm,
            capBlocked: nodeCount >= cap,
            cooldownRemaining
          }
        };
      };
    }

    // Spawn mode gate: INIT during batch creation, RUNTIME after explicit enablement.
    this.spawnMode = 'INIT'; // 'INIT' | 'RUNTIME' | 'DISABLED'
    this._spawnModeLogged = false;
    
    // EXTREME ARCHETYPES (49 total standardized types)
    // Format: ORIGIN-PATTERN-SIGNATURE (e.g., CORE-HARMONIC-RESONANT)
    this.extremeArchetypes = {
      // CORE layer (12 archetypes)
      'CORE-HARMONIC-RESONANT': 'process',
      'CORE-QUANTUM-ENTANGLED': 'quantum',
      'CORE-CHAOS-FRACTURED': 'error',
      'CORE-STELLAR-ASCENDED': 'mythic',
      'CORE-PRIME-PERFECT': 'prime',
      'CORE-VOID-SILENT': 'control',
      'CORE-FLUX-ADAPTIVE': 'integration',
      'CORE-NEXUS-CONVERGENT': 'storage',
      'CORE-ECHO-RECURSIVE': 'analytics',
      'CORE-SURGE-DYNAMIC': 'input',
      'CORE-STATIC-ANCHORED': 'storage',
      'CORE-WHISPER-SUBTLE': 'integration',
      
      // OUTER layer (12 archetypes)
      'OUTER-RADIANT-EXPANSIVE': 'input',
      'OUTER-SPIRAL-TEMPORAL': 'analytics',
      'OUTER-VOID-ABSORBING': 'error',
      'OUTER-CROWN-SOVEREIGN': 'mythic',
      'OUTER-LATTICE-PERFECT': 'prime',
      'OUTER-PULSE-RHYTHMIC': 'control',
      'OUTER-TIDE-FLOWING': 'integration',
      'OUTER-DEPTH-PROFOUND': 'storage',
      'OUTER-SPARK-VIVID': 'process',
      'OUTER-SHADOW-VEILED': 'analytics',
      'OUTER-STORM-TURBULENT': 'error',
      'OUTER-LIGHT-ETERNAL': 'mythic',
      
      // EXTREME layer (13 archetypes)
      'EXTREME-SINGULARITY-DENSE': 'prime',
      'EXTREME-ENTROPY-CHAOTIC': 'error',
      'EXTREME-INFINITY-BOUNDLESS': 'mythic',
      'EXTREME-NEXUS-INFINITE': 'process',
      'EXTREME-VOID-ABSOLUTE': 'error',
      'EXTREME-APOTHEOSIS-ASCENDED': 'mythic',
      'EXTREME-PARADOX-UNSTABLE': 'error',
      'EXTREME-ZENITH-PINNACLE': 'prime',
      'EXTREME-VOID-CONSUMING': 'error',
      'EXTREME-HARMONIC-PERFECT': 'prime',
      'EXTREME-CHAOS-PRIMORDIAL': 'error',
      'EXTREME-TRANSCENDENT-ETERNAL': 'mythic',
      'EXTREME-BALANCE-EQUILIBRIUM': 'integration',
      
      // SPECIAL layer (12 archetypes - multi-output compatible)
      'SPECIAL-SIGMA-DIMENSIONAL': 'sigma',
      'SPECIAL-QUANTUM-SUPERPOSED': 'quantum',
      'SPECIAL-EMOTIONAL-RESONANT': 'emotional',
      'SPECIAL-MYTHIC-CEREMONIAL': 'mythic',
      'SPECIAL-PRIME-CRYSTALLINE': 'prime',
      'SPECIAL-ERROR-ANOMALY': 'error',
      'SPECIAL-SIGMA-ANOMALY': 'sigma',
      'SPECIAL-QUANTUM-ENTANGLED': 'quantum',
      'SPECIAL-EMOTIONAL-EMPATHIC': 'emotional',
      'SPECIAL-UNITY-CONVERGENT': 'integration',
      'SPECIAL-APEX-SUPREME': 'control',
      'SPECIAL-GENESIS-PRIMORDIAL': 'input'
    };
    
    this.activeNodes = new Set();
    this.nodeCounter = 0; // For variant selection

    // Activity model (iteration control) - default all ACTIVE
    this.activityStateEnum = Object.freeze({
      ACTIVE: 'ACTIVE',
      SEMI_ACTIVE: 'SEMI_ACTIVE',
      DORMANT: 'DORMANT'
    });
    this._activityPools = {
      active: new Set(),
      semiActive: new Set(),
      dormant: new Set()
    };
    this._activityState = new WeakMap();
    this._activitySemiInterval = 0.1; // ~10 Hz
    this._activitySemiAccumulator = 0;
    this.activityCounters = { active: 0, semiActive: 0, dormant: 0 };

    // Runtime spawn intent rotation to avoid INPUT lock-in
    this._runtimeSpawnIndex = 0;
    this._spawnIntentLogged = false;
    this._spawnAbortCounters = {};
    this._spawnAbortLastReport = Date.now();
    this._spawnAbortStreak = 0;

    // Spawn-cycle state (deterministic cyclic runtime category intent)
    this.spawnCycleState = {
       order: [
    'input','process','storage','analytics','integration','control',
    'quantum','sigma','mythic','prime','error','emotional'],
      cursor: 0,
      lastAdvancedAt: 0,
      skippedSinceSuccess: 0,
    };
    this._pendingCyclicCandidate = null;

    // Unique-spawn registry (archetype-level single instance)
    this.uniqueSpawnRegistry = uniqueSpawnRegistry;

    // Single post-spawn observer pipeline (ordered)
    this.postSpawnObservers = new Map();
    this.visualAuthorityRuntime = new NodeVisualAuthorityRuntime({
      debugMode: false,
      allowRootFrustumDisable: false,
    });
    this.registerPostSpawnObserver(
      'visual-authority-runtime',
      (node, context) => this.visualAuthorityRuntime.applyBaseline(node, context),
      10
    );
  }

  /**
   * Queue heavy visual tasks to spread work across frames (Spawn Visual Burst Gate).
   * Falls back to immediate execution if queue unavailable.
   */
  _queueSpawnVisual(node, type, fn) {
    if (!this.spawnVisualQueue) {
      fn();
      return;
    }
    this.spawnVisualQueue.push({ node, type, fn });
    if (this.spawnVisualStats) this.spawnVisualStats.queued++;
  }

  /**
   * Drain queued visual tasks with a small per-frame budget.
   */
  _drainSpawnVisualQueue() {
    if (!this.spawnVisualQueue || this.spawnVisualQueue.length === 0) return;
    const BUDGET_MS = 4;
    const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    while (this.spawnVisualQueue.length) {
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      if (now - start >= BUDGET_MS) break;
      const task = this.spawnVisualQueue.shift();
      try {
        task.fn();
        if (this.spawnVisualStats) this.spawnVisualStats.executed++;
      } catch (err) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[SpawnVisualGate] task failed', err);
        }
      }
    }
  }

  registerPostSpawnObserver(name, fn, order = 100) {
    if (!name || typeof fn !== 'function') return false;
    this.postSpawnObservers.set(name, { fn, order: Number(order) || 100 });
    return true;
  }

  unregisterPostSpawnObserver(name) {
    if (!name) return false;
    return this.postSpawnObservers.delete(name);
  }

  _runPostSpawnObservers(node, context = {}) {
    if (!node || !this.postSpawnObservers || this.postSpawnObservers.size === 0) return;
    const ordered = Array.from(this.postSpawnObservers.entries())
      .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

    for (const [name, observer] of ordered) {
      try {
        observer.fn(node, context);
      } catch (err) {
        console.warn(`[AINodes] post-spawn observer '${name}' failed:`, err?.message || err);
      }
    }
  }

  _getUniqueArchetypeKey(category, archetype) {
    const archetypeKey = String(archetype || category || '').trim().toLowerCase();
    return archetypeKey || null;
  }

  getNodeCount() {
    return Array.isArray(this.nodes) ? this.nodes.length : 0;
  }

  getSpawnStats() {
    return { ...this.spawnStats, nodeCount: this.getNodeCount() };
  }

  getTargetPopulation() {
    // Prefer configured cap; fallback to mode-based default
    if (this.spawningConfig && Number.isFinite(this.spawningConfig.targetPopulation)) {
      return this.spawningConfig.targetPopulation;
    }
    const mode = (typeof window !== 'undefined' ? window.game?.currentMode : null) || this.currentMode || null;
    return mode === 'chamber' ? 80 : 120;
  }

  _processLinkJobs() {
    const BUDGET = 50;
    const MAX_LINKS_PER_NODE = 8;
    let processed = 0;
    let created = 0;
    while (this.pendingLinkJobs.length && processed < BUDGET) {
      const job = this.pendingLinkJobs[0];
      const newNode =
        this.nodesMap?.get(job.newNodeId) ||
        this.nodes.find(
          (n) =>
            (n.userData?.nodeId || n.userData?.id || n.uuid) === job.newNodeId
        );
      if (!newNode) {
        this.pendingLinkJobs.shift();
        continue;
      }
      while (job.startIndex < this.nodes.length && processed < BUDGET) {
        const existingNode = this.nodes[job.startIndex];
        job.startIndex++;
        processed++;
        if (!existingNode || existingNode === newNode) continue;
        const distance = newNode.position.distanceTo(existingNode.position);
        if (distance < this.connectionDistance && Math.random() < 0.3) {
          if (!this._linkExists(newNode, existingNode)) {
            this.nodeLinkingSystem?.createLink?.(newNode, existingNode);
            job.linksCreated++;
            created++;
            if (job.linksCreated >= MAX_LINKS_PER_NODE) break;
          }
        }
      }
      if (job.startIndex >= this.nodes.length || job.linksCreated >= MAX_LINKS_PER_NODE) {
        this.pendingLinkJobs.shift();
      } else {
        break; // budget hit
      }
    }
    this._linkJobStats = {
      pending: this.pendingLinkJobs.length,
      processed,
      created
    };
    if (shouldLogSpawn()) {
      console.log('[LinkJobs]', this._linkJobStats);
    }
  }

  _linkExists(a, b) {
    const links = this.nodeLinkingSystem?.links || [];
    const ida = this.nodeLinkingSystem?.getNodeId?.(a) || a.userData?.nodeId || a.uuid;
    const idb = this.nodeLinkingSystem?.getNodeId?.(b) || b.userData?.nodeId || b.uuid;
    for (const link of links) {
      const la = link.sourceNodeId || link.source?.userData?.nodeId || link.source?.uuid;
      const lb = link.targetNodeId || link.target?.userData?.nodeId || link.target?.uuid;
      if ((la === ida && lb === idb) || (la === idb && lb === ida)) return true;
    }
    return false;
  }

  getSpawnCycleState() {
    return {
      order: [...this.spawnCycleState.order],
      cursor: this.spawnCycleState.cursor,
      lastAdvancedAt: this.spawnCycleState.lastAdvancedAt,
      skippedSinceSuccess: this.spawnCycleState.skippedSinceSuccess,
    };
  }

  getNextCyclicSpawnCategory() {
    if (this._pendingCyclicCandidate) {
      return this._pendingCyclicCandidate.category;
    }

    const state = this.spawnCycleState;
    const order = state.order || [];
    if (order.length === 0) return null;

    let cursor = state.cursor % order.length;
    for (let i = 0; i < order.length; i++) {
      const candidate = order[cursor];
      const validation = this.validateCategory(candidate);

      if (validation?.valid === true && validation.category) {
        this._pendingCyclicCandidate = {
          category: validation.category,
          cursor,
          nextCursor: (cursor + 1) % order.length,
        };
        state.cursor = cursor;
        state.lastAdvancedAt = Date.now();
        state.skippedSinceSuccess = 0;
        return validation.category;
      }

      cursor = (cursor + 1) % order.length;
      state.cursor = cursor;
      state.skippedSinceSuccess += 1;
    }

    return null;
  }

  _commitSpawnCycleSuccess(category) {
    const pending = this._pendingCyclicCandidate;
    if (!pending || pending.category !== category) return false;
    const state = this.spawnCycleState;
    state.cursor = pending.nextCursor;
    state.lastAdvancedAt = Date.now();
    state.skippedSinceSuccess = 0;
    this._pendingCyclicCandidate = null;
    return true;
  }

  releaseUniqueSpawn(node) {
    if (!node) return false;
    const nodeId = node.userData?.nodeId || node.userData?.id || node.uuid;
    if (!nodeId) return false;
    return uniqueSpawnService.releaseByNodeId(nodeId);
  }

  isUniqueSpawnAllowed(archetypeKey) {
    return this.uniqueSpawnRegistry.isUniqueSpawnAllowed(archetypeKey);
  }

  registerUniqueSpawn(nodeId, archetypeKey, metadata = {}) {
    return this.uniqueSpawnRegistry.registerUniqueSpawn(nodeId, archetypeKey, metadata);
  }

  requestVisualRepair(nodeId, reason = 'manual') {
    if (!this.visualAuthorityRuntime) return false;
    const node =
      this.nodesMap?.get?.(nodeId) ||
      this.nodes.find(n => (n.userData?.nodeId || n.userData?.id || n.uuid) === nodeId);
    if (!node) return false;
    return this.visualAuthorityRuntime.requestRepair(node, reason);
  }

  /**
   * VISUAL BOOTSTRAP 3.0: Register external visual systems
   * Must be called once during scene initialization
   */
  registerVisualSystems(visualsSystem, profileSystem, shaderSystem, effectsSystem) {
    this.visualBootstrap.registerSystems(visualsSystem, profileSystem, shaderSystem, effectsSystem);
    console.log('[AINodes] Visual systems registered for bootstrap');
  }

  /**
   * Set camera reference for LOD culling
   * Call once after camera is initialized (in main.js setup)
   */
  setCamera(camera) {
    this.camera = camera;
    if (camera) {
      console.log('[AINodes] Camera registered for Aura LOD culling');
    }
  }

  /**
   * MATERIAL SAFETY: MeshBasicMaterial does not support emissive properties
   */
  ensureEmissiveSafe(mat) {
    if (!mat || typeof mat !== 'object') return false;
    return (
      mat.isMeshStandardMaterial ||
      mat.isMeshLambertMaterial ||
      mat.isMeshPhongMaterial ||
      mat.isMeshToonMaterial
    );
  }
  
  /**
   * Create nodes based on environment
   */
  createNodes(environment, count = 15) {
    const __diag = __ensureSpawnDiag();
    if (__diag) __diag.createNodesEnter++;
    if (this.spawnMode !== 'INIT') {
      if (__diag) __diag.createNodesSkip++;
      __diagOnce('createNodesSkip', `[SpawnMode] createNodes skipped; mode=${this.spawnMode}\n${new Error().stack}`);
      console.warn(`[SpawnMode] createNodes skipped; mode=${this.spawnMode}`);
      return;
    }
    const positions = this.getNodePositions(environment, count);
    
    positions.forEach((pos, index) => {
      // 10% chance of special multi-output node
      let category;
      let isSpecial = false;
      
      if (Math.random() < 0.1 && index > 0) {
        category = this.specialNodeTypes[Math.floor(Math.random() * this.specialNodeTypes.length)];
        isSpecial = true;
      } else {
        category = this.nodeCategories[Math.floor(Math.random() * this.nodeCategories.length)];
      }
      
      // ========== EXTREME SPAWN SYSTEM v1.0 (HOISTED) ==========
      // Determine Extreme status BEFORE creation to check uniqueness
      const EXTREME_SPAWN_CHANCE = 0.15;
      const isExtreme = Math.random() < EXTREME_SPAWN_CHANCE;
      let extremeArchetype = null;
      let archetypeKey = null;

      if (isExtreme) {
        extremeArchetype = Math.floor(Math.random() * 12);
        // Map ID to string key for registry (e.g. "EXTREME-SINGULARITY-DENSE")
        // We need a helper to get the key from ID, or just use the ID as part of key
        // For now, let's use the ID as a proxy or find the name from the map if possible
        // The map activeNodes uses strings. 
        // Let's assume the registry handles "EXTREME:12" or similar if we pass ID.
        // But better: let's use the actual archetype NAME if we can access it.
        // AINodes has extremeArchetypes map which is NAME -> Category.
        // It doesn't have ID -> Name map easily accessible here without iterating.
        // So we'll use "EXTREME-" + ID for the key.
        archetypeKey = `EXTREME-${extremeArchetype}`;
      } else {
        // For non-extreme, archetype is usually the category or generic
        archetypeKey = category; 
      }

      // ========== SPAWN AUTHORITY: UNIQUENESS CHECK ==========
      // Single-instance enforcement is centralized in UniqueSpawnService.
      const unifiedKey = uniqueSpawnService.makeKey({
          category: isExtreme ? 'extreme' : category,
          archetype: archetypeKey,
          forceArchetype: archetypeKey,
          registryKeyMode: 'createNodes',
      });

      const decision = uniqueSpawnService.check({ key: unifiedKey });

      if (!decision.allowed) {
          // DUPLICATE DETECTED: Upgrade existing instead
          const existingNodeId = decision.existingNodeId;
          if (__diag) __diag.spawnNodeAbort.unique_denied = (__diag.spawnNodeAbort.unique_denied || 0) + 1;
          
          if (existingNodeId) {
             const existingNode = this.nodes.find(n => n.userData.nodeId === existingNodeId || n.uuid === existingNodeId);
             if (existingNode) {
                 this.triggerUpgradePulse(existingNode);
                 console.log(`[SpawnAuthority] Denied duplicate spawn ${archetypeKey}. Upgraded existing node.`);
             }
          }
          return; // SKIP CREATION
      }

      const options = {
          isExtreme: isExtreme,
          extremeArchetype: extremeArchetype,
          extremeTier: 1,
          archetypeKey: archetypeKey
      };

      const node = this.createNode(category, pos, index, isSpecial, options);
      if (!node) {
        if (__diag) __diag.spawnNodeAbort.createNode_null = (__diag.spawnNodeAbort.createNode_null || 0) + 1;
        // Spawn failed – skip safely
        return;
      }
      if (node.userData?.visualFailed === true) {
        if (!window.ATOMA_SILENT_WARNINGS) {
          console.warn('[NodeSpawnSkipped] Visual build failed, skipping node');
        }
        return;
      }
      const finalized = this._finalizeSpawnedNode(node, category, pos);
      if (!finalized || !finalized.node) {
        if (__diag) __diag.spawnNodeAbort.finalize_null = (__diag.spawnNodeAbort.finalize_null || 0) + 1;
      } else {
          const finalizedNode = finalized.node;
          this._runPostSpawnObservers(finalizedNode, {
            source: 'createNodes',
            category,
            position: pos,
            archetype: archetypeKey,
          });

          // Register the unique spawn
          const registerId = finalizedNode.userData.nodeId || finalizedNode.uuid;
          const registerKey = unifiedKey || this._getUniqueArchetypeKey(category, archetypeKey);
          if (registerKey) {
            uniqueSpawnService.register({
              key: registerKey,
              nodeId: registerId,
              meta: { category, source: 'createNodes' }
            });
          }

          // NODE SPAWN LOGGER v4.0: Log spawn with full validation (object format for visualCode/factoryName)
          const ud = finalizedNode.userData || {};
          const visualCodeSelected = ud.visualCode;
          if (visualCodeSelected == null) {
            console.warn('[SPAWN_SKIP] visualCode undefined, skipping spawn', {
              category,
              poolLen: Array.isArray(CATEGORY_POOLS?.[category]) ? CATEGORY_POOLS[category].length : 0
            });
            return null;
          }
          const factoryName = ud.factoryName;
          NodeSpawnLogger.logSpawn({
            category,
            visualCode: visualCodeSelected,
            factoryName,
            nodeId: finalizedNode.userData?.id,
            source: 'AINodes.createNodes'
          });
          if (__diag) __diag.logged++;

          // === REGISTRY TRACE (createNodes path) ===
          if (finalizedNode) {
            nodeSpawnRegistry.registerSpawn(finalizedNode, 'AINodes.createNodes');
          }
      }
    });
    
    // Transition to runtime (or disabled) after batch init completes.
    if (this.spawnMode === 'INIT') {
      this.setSpawnMode('RUNTIME');
    }

    // Create potential connections between nearby nodes
    this.createNodeConnections();

    // Mark that spawning needs re-arming (updateSpawning() will handle it)
    if (this.spawningConfig) {
      this.spawningConfig.needsRearm = true;
    }
  }

  /**
   * Get node positions based on environment
   */
  getNodePositions(environment, count) {
    const positions = [];
    
    for (let i = 0; i < count; i++) {
      let pos;
      
      switch(environment) {
        case 'chamber':
          // Around chamber in circular pattern
          const chamberAngle = (i / count) * Math.PI * 2;
          const chamberRadius = 12 + Math.random() * 8;
          pos = new THREE.Vector3(
            Math.cos(chamberAngle) * chamberRadius,
            3 + Math.random() * 8,
            Math.sin(chamberAngle) * chamberRadius
          );
          break;
          
        case 'quantum':
          // Around quantum island
          const quantumAngle = (i / count) * Math.PI * 2;
          const quantumRadius = 10 + Math.random() * 8;
          pos = new THREE.Vector3(
            Math.cos(quantumAngle) * quantumRadius,
            2 + Math.random() * 6,
            Math.sin(quantumAngle) * quantumRadius
          );
          break;
          
        case 'desert':
          // Scattered across desert
          const desertAngle = Math.random() * Math.PI * 2;
          const desertRadius = 15 + Math.random() * 35;
          pos = new THREE.Vector3(
            Math.cos(desertAngle) * desertRadius,
            2 + Math.random() * 5,
            Math.sin(desertAngle) * desertRadius
          );
          break;
          
        case 'fractal':
          // Throughout valley
          const fractalAngle = Math.random() * Math.PI * 2;
          const fractalRadius = 20 + Math.random() * 50;
          pos = new THREE.Vector3(
            Math.cos(fractalAngle) * fractalRadius,
            1 + Math.random() * 8,
            Math.sin(fractalAngle) * fractalRadius
          );
          break;
          
        case 'memory':
          // Along memory lane corridor
          const side = Math.random() > 0.5 ? 1 : -1;
          pos = new THREE.Vector3(
            (Math.random() - 0.5) * 18,
            2 + Math.random() * 5,
            (i - count / 2) * 20
          );
          break;
          
        default:
          pos = new THREE.Vector3(
            (Math.random() - 0.5) * 40,
            2 + Math.random() * 6,
            (Math.random() - 0.5) * 40
          );
      }
      
      positions.push(pos);
    }
    
    return positions;
  }
  
  /**
   * CATEGORY WHITELIST - Production-safe categories only
   * [TASK 2 SAFE FIX] All 11 categories now fully implemented:
   * - MYTHIC, PRIME, EMOTIONAL, ERROR: Geometries in CanonicalGeometryFamilies
   * - INPUT, PROCESS, INTEGRATION, ANALYTICS, STORAGE, CONTROL, QUANTUM: Direct factories
   * No UNSAFE_CATEGORIES remain
   */
  static get SAFE_CATEGORIES() {
    return ['input', 'process', 'integration', 'analytics', 'storage', 'control', 'quantum', 'sigma', 'mythic', 'prime', 'error', 'emotional'];
  }

  static get UNSAFE_CATEGORIES() {
    return [];  // [TASK 2] All categories now safe — no unsafe categories
  }


  /**
   * VALIDATE: Check category against whitelist
   * Returns: { valid, category, reason }
   * - valid: true if safe to spawn
   * - category: final category to use (may be redirected)
   * - reason: explanation for validation result
   */
  validateCategory(requestedCategory) {
    const requested = (requestedCategory || 'input').toLowerCase().trim();
    
    // Check if SAFE (allow)
    if (AINodes.SAFE_CATEGORIES.includes(requested)) {
      return {
        valid: true,
        category: requested,
        reason: `Category '${requested}' is production-ready`,
        redirected: false
      };
    }
    
    // Check if UNSAFE (block)
    if (AINodes.UNSAFE_CATEGORIES.includes(requested)) {
      return {
        valid: false,
        category: 'input',  // Fallback
        reason: `Category '${requested}' is NOT implemented (geometry missing). Falling back to 'input'. Reason: No create${requested}Node() factory in EnhancedNodeModels.`,
        blocked: true
      };
    }
    
    // Unknown category (treat as unsafe)
    return {
      valid: false,
      category: 'input',  // Fallback
      reason: `Unknown category '${requested}'. Falling back to 'input'. Use one of: ${AINodes.SAFE_CATEGORIES.join(', ')}`,
      unknown: true
    };
  }

  /**
   * ULTRA NODE EDITION - Create advanced AI nodes with multi-core structure
   * Features: 3-core holographic structure, orbit rings, intense glow, smart animation
   * 
   * [SPAWN AUTHORITY FIX] ENFORCE EnhancedNodeModel as SINGLE SOURCE OF TRUTH
   * 
   * CATEGORY WHITELIST VALIDATION:
   * - SAFE_CATEGORIES: Allowed to spawn (full implementation)
   * - UNSAFE_CATEGORIES: Blocked (geometry not implemented, fallback to input)
   * - DEPRECATED_CATEGORIES: Redirected to safe equivalent
   */
  createNode(category, position, index, isSpecial = false, options = {}) {
    let finalVisualCode = null;
    const canonicalCategory = String(category || 'input').toLowerCase().trim();
    // ============================================================
    // [LINK-SPAWN-TRACE] Debug instrumentation
    // ============================================================
    if (window.ATOMA_DEBUG_LINK_SPAWN === true) {
      console.warn('[LINK-SPAWN] createNode called', {
        category,
        canonicalCategory,
        position,
        index,
        isSpecial,
        options,
        stack: new Error().stack
      });
    }

    // ========================================================================
    // [SPAWN AUTHORITY] VALIDATE AGAINST EnhancedNodeModel
    // Enforce that ONLY EnhancedNodeModel-supported categories can spawn
    // ========================================================================
    const requestedCategory = canonicalCategory;
    let resolvedCategory = requestedCategory;
    
    // Check if this category has an EnhancedNodeModel.create() implementation
    const enhancedNodeModelsCategories = ['input', 'process', 'integration', 'analytics', 'storage', 'control', 'quantum', 'sigma', 'mythic', 'prime', 'error', 'emotional'];
    
    // If requested category is not in EnhancedNodeModel, apply hard fallback
    if (!enhancedNodeModelsCategories.includes(requestedCategory)) {
      // Unknown category - use hard fallback to first available EnhancedNodeModel category
      resolvedCategory = 'input';
    }
    
    // ========== LEGACY NODE MODEL FILTER v1.0 ==========
    // Block legacy models that use aura-as-body visuals
    const legacyCheck = LegacyNodeModelFilter.validateSpawn(resolvedCategory, true);
    let filteredCategory = resolvedCategory;
    
    if (legacyCheck.redirected) {
      // Legacy model with safe replacement - use replacement
      filteredCategory = legacyCheck.category;
    } else if (legacyCheck.blocked) {
      // Unstable model - fallback to input
      filteredCategory = 'input';
    }

    // ========== SPAWN-TIME CATEGORY VALIDATION ==========
    // Validate category against whitelist before proceeding
    const validation = this.validateCategory(filteredCategory);
    
    if (!validation.valid) {
      // Fallback applied - use it silently
      filteredCategory = 'input';
    }
    
    // Use validated category (may be redirected from unsafe)
    const safeCategory = validation.valid ? validation.category : 'input';
    this._poolGuardLog = this._poolGuardLog || new Set();
    if (!this.ensureFactoriesReady()) {
      return null;
    }
    EnhancedNodeModels.ensureRegistryReady();
    const coreColor = EnhancedNodeModels.getCategoryColor(safeCategory);
    
    // ========================================================================
    // [SPAWN AUTHORITY] ABORT IF EnhancedNodeModel UNAVAILABLE
    // Prevent spawning when source of truth is unreachable
    // ========================================================================
    if (!EnhancedNodeModels) {
      return null;
    }
    
    // Fail-closed helper: mark visual failure and abort without fallback visuals
    const failClosedVisual = (node, reason) => {
      this._lastSpawnResult = { ok: false, reason: reason || 'VISUAL_FAIL', category: safeCategory };
      const target = node || { userData: {} };
      if (typeof target === 'object') {
        target.userData = target.userData || {};
        target.userData.visualFailed = true;
        target.userData.__visualFailed = true;
        target.visible = false;
      }
      console.warn('[NODE_REJECT] Canonical visual missing - node not spawned');
      if (reason && window?.ATOMA_DEBUG_LINK_SPAWN === true) {
        console.warn('[NodeSpawnSkipped][reason]', reason);
      }
      return null;
    };

    // ========== VISUAL CODE SELECTION: deterministic per-category counter ==========
    let poolCategory = String(safeCategory || '').toLowerCase().trim();
    let pool = EnhancedNodeModels.getCategoryPool(poolCategory);
    if (!Array.isArray(pool) || pool.length === 0) {
      console.error('[SPAWN_FATAL] Invalid pool', {
        rawCategory: category,
        safeCategory,
        normalized: poolCategory,
        pool
      });
      return null;
    }
    if (!pool || pool.length === 0) {
      // Fallback mapping to keep game alive
      const fallbackCategory = poolCategory === 'process' ? 'input' : 'process';
      const fallbackPool = EnhancedNodeModels.getCategoryPool(fallbackCategory);
      if (fallbackPool && fallbackPool.length > 0) {
        poolCategory = fallbackCategory;
        pool = fallbackPool;
        filteredCategory = fallbackCategory;
      } else {
        this._lastSpawnResult = { ok: false, reason: 'FACTORY_MISSING', category: poolCategory };
        const logKey = `POOL_EMPTY:${poolCategory}`;
        if (!this._poolGuardLog.has(logKey)) {
          console.error('[SpawnVisualError]', { category: poolCategory, reason: 'POOL_EMPTY' });
          this._poolGuardLog.add(logKey);
        }
        return null;
      }
    }
    const counterKey = String(poolCategory || canonicalCategory || 'input');
    if (this._variantCounterByCategory[counterKey] === undefined) {
      this._variantCounterByCategory[counterKey] = 0;
    }
    const counter = this._variantCounterByCategory[counterKey];

    const idx =
      Number.isFinite(counter)
        ? counter % pool.length
        : 0;

    console.log('[SPAWN_DEBUG]', {
      category,
      counter,
      poolLen: pool.length,
      idx,
      poolValue: pool[idx],
      pool
    });

    const selectedVisualCode = pool[idx];
    finalVisualCode = selectedVisualCode;

    this._variantCounterByCategory[counterKey] = counter + 1;
    const validatedCategory = spawnCycleValidator.validateCategory(
      safeCategory,
      Object.keys(CATEGORY_POOLS)
    );
    const debugCheckGeometry = (mesh, stage) => {
      if (!mesh || !mesh.geometry) return;

      const pos = mesh.geometry.attributes?.position?.array;
      if (!pos || pos.length === 0) {
        console.error('[NODE_GEOM_EMPTY]', {
          stage,
          category,
          index,
          isSpecial,
          archetype: mesh.userData?.archetype
        });
        return;
      }

      for (let i = 0; i < pos.length; i++) {
        if (!Number.isFinite(pos[i])) {
          console.error('[NODE_GEOM_NAN]', {
            stage,
            value: pos[i],
            idx: i,
            category,
            index,
            isSpecial,
            archetype: mesh.userData?.archetype
          });
          break;
        }
      }
    };

    if (typeof window !== 'undefined' && !window.__SPAWN_TRACE_DUMPED && (finalVisualCode == null)) {
      window.__SPAWN_TRACE_DUMPED = true;
      console.error('[SPAWN_TRACE]', {
        categoryRaw: category,
        categoryNorm: String(category || '').toLowerCase().trim(),
        visualCodeRaw: finalVisualCode,
        visualCodeType: typeof finalVisualCode,
        createArg: finalVisualCode,
        createArgType: typeof finalVisualCode,
        spawnMode: this.spawnMode,
        pendingIntent: this.pendingDensityIntent,
        poolExists: !!pool,
        poolLen: Array.isArray(pool) ? pool.length : null,
        poolSample: Array.isArray(pool) ? pool.slice(0, 10) : null,
        hasRegistryEntry: finalVisualCode != null ? !!NODE_VISUAL_REGISTRY?.[String(finalVisualCode)] : false,
        registryHasNumericKey: finalVisualCode != null ? !!NODE_VISUAL_REGISTRY?.[Number(finalVisualCode)] : false,
      }, new Error('STACK').stack);
    }

    if (finalVisualCode == null) {
      const poolLen = Array.isArray(pool) ? pool.length : null;
      const logKey = `VISUALCODE_UNDEFINED:${poolCategory || category || 'unknown'}`;
      if (!this._poolGuardLog.has(logKey)) {
        console.error('[SpawnVisualError]', {
          category: poolCategory || category,
          poolLen,
          selectedVisualCode: finalVisualCode,
          reason: 'VISUALCODE_UNDEFINED'
        });
        this._poolGuardLog.add(logKey);
      }
      return null;
    }

    let nodeModel = null;
    try {
      nodeModel = EnhancedNodeModels.create(poolCategory, finalVisualCode, coreColor);
      // === SPAWN VISUAL DEBUG TRACE (NON-DESTRUCTIVE) ===
      if (nodeModel) {
        copySpawnIdentity(nodeModel, nodeModel);
        const visualCodeLog = nodeModel.userData?.visualCode ?? 'UNKNOWN';
        const factoryName = nodeModel.userData?.factoryName ?? 'UNKNOWN';
        const childCount = nodeModel.children?.length ?? 0;

        console.log(
          '[SPAWN_TRACE]',
          {
            category,
            visualCode: visualCodeLog,
            factoryName,
            childCount,
            nodeId: nodeModel.userData?.nodeId ?? nodeModel.uuid
          }
        );
      } else {
        console.warn('[SPAWN_TRACE_NULL]', { category });
      }
    } catch (err) {
      return failClosedVisual(null, err?.message || 'EnhancedNodeModels.create threw');
    }
    if (!nodeModel) {
      if (!this._spawnPauseLogged) {
        const poolLen = Array.isArray(pool) ? pool.length : null;
        console.warn('[SPAWN_PAUSE] factory resolve failed', {
          category,
          poolLen,
          selectedVisualCode: finalVisualCode,
          reason: 'CREATE_RETURNED_NULL'
        });
        this._spawnPauseLogged = true;
      }
      return failClosedVisual(null, 'No canonical visual available');
    }
    nodeModel.userData.visualCode = finalVisualCode;
    debugCheckGeometry(nodeModel, 'after_model_create');
    if (!hasRenderableVisual(nodeModel)) {
      return failClosedVisual(nodeModel, 'Visual has no renderable content');
    }
    const purgeResult = purgeForbiddenNodePrimitives(nodeModel);
    if (!hasRenderableVisual(nodeModel) || nodeModel.userData?.__visualFailed === true) {
      return failClosedVisual(nodeModel, `Visual invalid after primitive purge (removed=${purgeResult.removed})`);
    }
    if ((nodeModel.children?.length || 0) === 0) {
      console.warn('[NODE_REJECT] Empty visual root');
      return failClosedVisual(nodeModel, 'Empty visual root');
    }
    nodeModel.position.copy(position);
    nodeModel.scale.setScalar(0.9); // Slightly larger for visibility
    debugCheckGeometry(nodeModel, 'after_scale');
    
    // [SPAWN AUTHORITY] Apply pre-determined spawn options
    if (options && options.isExtreme) {
        nodeModel.userData = nodeModel.userData || {};
        nodeModel.userData.isExtreme = true;
        nodeModel.userData.extremeArchetype = options.extremeArchetype;
        nodeModel.userData.extremeTier = options.extremeTier;
    }
    debugCheckGeometry(nodeModel, 'before_children_setup');
    
    // ========================================================================
    // [SPAWN AUTHORITY] BIND TO EnhancedNodeModel
    // Permanent metadata proving this node came from EnhancedNodeModel
    // ========================================================================
    nodeModel.userData = nodeModel.userData || {};
    nodeModel.userData.enhancedNodeModelBinding = {
      sourceModel: 'EnhancedNodeModel',
      category: safeCategory,
      visualCode: finalVisualCode,
      spawnTime: Date.now()
    };
    
    // ========== MARK NODE ROOT AS PROTECTED (cannot be mutated by link-state) ==========
    nodeModel.userData.isNodeRoot = true;
    nodeModel.userData.visualLayer = 'NODE_ROOT';
    
    // ========== OVERLAY DUPLICATION GUARD (PHASE VD-2) ==========
    // Initialize overlay tracking to prevent duplicate visual layers
    if (!nodeModel.userData.overlays) {
      nodeModel.userData.overlays = {};
    }
    
    // Store cycle information on node for debugging/inspection
    nodeModel.userData = nodeModel.userData || {};
    nodeModel.userData.spawnCycle = {
      category: validatedCategory,
      visualCode: finalVisualCode
    };
    
    // Get layer-specific colors for VFX
    const layerColors = this.getLayerColorScheme(safeCategory);
    
    // ========== ULTRA EDITION: INTERACTION-ONLY PROXY ==========
    // Minimal object reserved for selection/raycast/link targeting
    const linkTarget = new THREE.Object3D();
    linkTarget.name = 'interaction-proxy';
    linkTarget.userData = {
      isInteractionProxy: true,
      isCoreMesh: true,
      visualLayer: 'CORE',
      neutralized: true,
      neutralizedRole: 'interaction-proxy'
    };
    // Guard: Only add interaction proxy if not already present
    if (!nodeModel.userData.overlays['interaction-proxy']) {
      nodeModel.add(linkTarget);
      nodeModel.userData.overlays['interaction-proxy'] = linkTarget;
    }
    let linkTargetMesh = linkTarget;
    
    // ========== ULTRA EDITION: DYNAMIC ORBIT RINGS (1-3 thin rings) ==========
    const ringCount = 0;
    const orbitRings = [];
    
    for (let r = 0; r < ringCount; r++) {
      const ringRadius = 0.7 + r * 0.35;
      const ringThickness = 0.02 + Math.random() * 0.01;
      
      const ringGeometry = new THREE.TorusGeometry(ringRadius, ringThickness, 12, 64);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: r === 0 ? layerColors.primary : layerColors.secondary,
        transparent: true,
        opacity: 0.5 - r * 0.1,
        fog: false
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      ring.rotation.z = Math.random() * Math.PI * 0.5;
      
      ring.userData = {
        vfxType: 'ultraRing',
        isVFX: true,
        isNonLinkableVisual: true,  // ✅ PROTECTED: VFX rings — immutable to link-state
        visualLayer: 'VFX',
        ringIndex: r,
        rotationSpeed: 0.3 + Math.random() * 0.4,
        rotationAxis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
        baseOpacity: 0.5 - r * 0.1
      };
      
      ring.visible = false; // Neutralize decorative orbit rings
      ring.userData.neutralized = true;
      // Guard: Only add ring if not already present (track by ring index)
      const ringKey = `orbit-ring-${r}`;
      if (!nodeModel.userData.overlays[ringKey]) {
        nodeModel.add(ring);
        nodeModel.userData.overlays[ringKey] = ring;
        orbitRings.push(ring);
      }
    }
    
    // ========== ULTRA EDITION: INTENSE OUTER GLOW (200% boost) ==========
    // Primary glow (2× larger and brighter)
    let outerGlow = null;
    if (false && vfxFlag('ATOMA_VFX_ENABLE_NODE_GLOW', true)) {
      const outerGlowGeometry = new THREE.IcosahedronGeometry(1.2, 4);
      const outerGlowMaterial = new THREE.MeshBasicMaterial({
        color: layerColors.primary,
        transparent: true,
        opacity: 0.5,  // 200% boost from 0.25
        // FIX: MeshBasicMaterial does NOT support emissive properties
        fog: false
      });
      outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
      outerGlow.userData = {
        vfxType: 'ultraOuterGlow',
        isVFX: true,
        isAura: true,  // ✅ PROTECTED: Cannot be mutated by link-state
        visualLayer: 'AURA',
        pulsePhase: Math.random() * Math.PI * 2
      };
      outerGlow.renderOrder = 10;  // ✅ Aura renders last (behind core)
      outerGlow.visible = false; // Neutralize decorative glow
      outerGlow.userData.neutralized = true;
      // Guard: Only add outer glow if not already present
      if (!nodeModel.userData.overlays['outer-glow']) {
        nodeModel.add(outerGlow);
        nodeModel.userData.overlays['outer-glow'] = outerGlow;
      }
    }
    
    // Secondary halo (even larger, very soft)
    // [Halo Cleanup v1.0] Reduced scale from 1.5→1.15 and opacity from 0.15→0.22 for better readability
    let haloGlow = null;
    if (false && vfxFlag('ATOMA_VFX_ENABLE_NODE_HALO', true)) {
      const haloGeometry = new THREE.IcosahedronGeometry(1.15, 3);
      const haloMaterial = new THREE.MeshBasicMaterial({
        color: layerColors.secondary,
        transparent: true,
        opacity: 0.22,
        fog: false
      });
      haloGlow = new THREE.Mesh(haloGeometry, haloMaterial);
      haloGlow.userData = {
        vfxType: 'ultraHalo',
        isVFX: true,
        isAura: true,  // ✅ PROTECTED: Cannot be mutated by link-state
        visualLayer: 'AURA'
      };
      haloGlow.renderOrder = 10;  // ✅ Aura renders last (behind core)
      haloGlow.visible = false; // Neutralize decorative halo
      haloGlow.userData.neutralized = true;
      // Guard: Only add halo glow if not already present
      if (!nodeModel.userData.overlays['halo-glow']) {
        nodeModel.add(haloGlow);
        nodeModel.userData.overlays['halo-glow'] = haloGlow;
      }
    }
    
    // ============ SAFE VFX LAYER 5: HOLOGRAPHIC EDGE HIGHLIGHTS ============
    // FIX 2: EdgesGeometry NaN discard - prevent invalid geometries from entering scene
    if (vfxFlag('ATOMA_VFX_ENABLE_NODE_EDGE_GLOW', true)) {
      // Local guard for safe EdgesGeometry creation
      function hasFinitePositions(geometry) {
          const arr = geometry?.attributes?.position?.array;
          if (!arr) return false;
          for (let i = 0; i < arr.length; i++) {
              if (!Number.isFinite(arr[i])) return false;
          }
          return true;
      }
      
      function safeEdgesGeometry(sourceGeo) {
          // ===== EDGES-SOURCE-IDENTIFICATION: Diagnostic Logging =====
          const posAttr = sourceGeo?.attributes?.position;
          const arr = posAttr?.array;

          let invalidReason = null;

          if (!posAttr) {
              invalidReason = 'NO_POSITION_ATTR';
          }
          else if (!arr || arr.length === 0) {
              invalidReason = 'EMPTY_POSITION_ARRAY';
          }
          else {
              for (let i = 0; i < arr.length; i++) {
                  if (!Number.isFinite(arr[i])) {
                      invalidReason = 'NaN_AT_INDEX_' + i;
                      break;
                  }
              }
          }

          if (invalidReason) {
              console.error('[EdgesSourceInvalid]', {
                  nodeId: nodeModel?.userData?.id,
                  archetype: nodeModel?.userData?.archetype,
                  category: nodeModel?.userData?.category,
                  geometryType: sourceGeo?.type,
                  positionCount: arr ? arr.length : 0,
                  reason: invalidReason
              });
          }
          // ===========================================================

          if (!hasFinitePositions(sourceGeo)) {
              return null;
          }
          const edgeGeometry = new THREE.EdgesGeometry(sourceGeo);
          
          // FIX 2: Validate position attribute after EdgesGeometry creation
          const pos = edgeGeometry.attributes?.position;
          if (!pos || pos.array.length === 0) {
              console.error('[VisualReject]', {
                  archetype: nodeModel.userData?.archetype,
                  category: nodeModel.userData?.category,
                  reason: 'EDGES_NAN_EMPTY',
                  geometryType: edgeGeometry.type
              });
              edgeGeometry.dispose();
              return null;
          }
          
          // FIX 2: Check for NaN values in EdgesGeometry output
          for (let i = 0; i < pos.array.length; i++) {
              if (!Number.isFinite(pos.array[i])) {
                  console.error('[VisualReject]', {
                      archetype: nodeModel.userData?.archetype,
                      category: nodeModel.userData?.category,
                      reason: 'EDGES_NAN',
                      geometryType: edgeGeometry.type,
                      NaNAtIndex: i,
                      NaNValue: pos.array[i]
                  });
                  edgeGeometry.dispose();
                  return null;
              }
          }
          
          return edgeGeometry;
      }
      
      nodeModel.traverse((child) => {
        if (child.isMesh && !child.userData.isVFX) {
          const edgeGeometry = safeEdgesGeometry(child.geometry);
          if (!edgeGeometry) return;
          const edgeMaterial = new THREE.LineBasicMaterial({
            color: layerColors.secondary,
            transparent: true,
            opacity: 0.4,
            fog: false,
            linewidth: 1
          });
          const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
          edgeLines.userData.isVFX = true;
          edgeLines.userData.edgeGlow = true;
          // Guard: Only add edge glow if not already present for this child
          const edgeKey = `edge-glow-${child.uuid}`;
          if (!nodeModel.userData.overlays[edgeKey]) {
            child.add(edgeLines);
            nodeModel.userData.overlays[edgeKey] = edgeLines;
          }
        }
      });
    }
    
    // ========== ULTRA EDITION: ENERGY SPARK PARTICLES (increased count) ==========
    const particleCount = 0;
    const sparkParticles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.08, 8, 8);  // Slightly larger
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: layerColors.primary,
        transparent: true,
        opacity: 0.8,
        // FIX: MeshBasicMaterial does NOT support emissive properties
        fog: false
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      const orbitAngle = (i / particleCount) * Math.PI * 2;
      particle.userData = {
        orbitAngle: orbitAngle,
        orbitRadius: 1.4 + Math.random() * 0.4,  // Larger orbit
        orbitSpeed: 0.4 + Math.random() * 0.4,   // Faster movement
        sparkIntensity: 0.5 + Math.random() * 0.5,
        isVFX: true,
        isNonLinkableVisual: true,  // ✅ PROTECTED: VFX particles — immutable to link-state
        visualLayer: 'VFX',
        vfxType: 'sparkParticle'
      };
      
      particle.visible = false; // Neutralize decorative sparks
      particle.userData.neutralized = true;
      // Guard: Only add particle if not already present (track by index)
      const particleKey = `spark-particle-${i}`;
      if (!nodeModel.userData.overlays[particleKey]) {
        nodeModel.add(particle);
        nodeModel.userData.overlays[particleKey] = particle;
        sparkParticles.push(particle);
      }
    }
    
    // ========== ULTRA EDITION: FRACTAL HOLOGRAM LAYER (subtle overlay) ==========
    // Soft fractal projection patterns
    const fractalGeometry = new THREE.IcosahedronGeometry(0.85, 4);
    const fractalMaterial = new THREE.MeshBasicMaterial({
      color: layerColors.secondary,
      transparent: true,
      opacity: 0.05,  // Extremely subtle
      fog: false
    });
    const fractalHolo = new THREE.Mesh(fractalGeometry, fractalMaterial);
    fractalHolo.scale.setScalar(1.1 + Math.random() * 0.1);
    fractalHolo.userData = {
      vfxType: 'fractalHologram',
      isVFX: true,
      isNonLinkableVisual: true,  // ✅ PROTECTED: VFX hologram — immutable to link-state
      visualLayer: 'VFX',
      rotationSpeed: 0.1 + Math.random() * 0.2
    };
    // ✅ EXTREME RELIABILITY: Force frustumCulled=false on hologram shells
    fractalHolo.frustumCulled = true;
    fractalHolo.visible = false; // Neutralize decorative hologram
    fractalHolo.userData.neutralized = true;
    // Guard: Only add fractal hologram if not already present
    if (false && !nodeModel.userData.overlays['fractal-hologram']) {
      nodeModel.add(fractalHolo);
      nodeModel.userData.overlays['fractal-hologram'] = fractalHolo;
    }
    
    // ============ SAFE VFX LAYER 3 & 4: LEVITATION & PULSE (Enhanced) ============
    const levitationPhase = Math.random() * Math.PI * 2;
    const driftPhase = Math.random() * Math.PI * 2;
    const microJitterPhase = Math.random() * Math.PI * 2;
    
    // Point light for activated state
    const light = new THREE.PointLight(coreColor, 0, 10);
    light.position.set(0, 0, 0);
    // Guard: Only add point light if not already present
    if (!nodeModel.userData.overlays['point-light']) {
      nodeModel.add(light);
      nodeModel.userData.overlays['point-light'] = light;
    }
    
    // ========== ULTRA NODE EDITION: Node data with all systems ==========
    nodeModel.userData = {
      category: safeCategory,  // Use validated/redirected category
      requestedCategory: category,  // Store original request for debugging
      categoryValidation: validation,  // Store validation result
      index: index,
      isActive: false,
      activationLevel: 0,
      targetActivation: 0,
      particles: sparkParticles,
      light: light,
      baseColor: coreColor,
      basePosition: position.clone(),
      variant: finalVisualCode % 4,
      pulseOffset: Math.random() * Math.PI * 2,
      originalY: position.y,
      isSpecial: isSpecial,
      
      // VFX Data
      vfxGlow: outerGlow,
      vfxHalo: haloGlow,
      vfxHolo: null,
      vfxRings: orbitRings,
      layerColors: layerColors,
      
      // ULTRA EDITION: Multi-Core System
      ultraMode: true,
      coreA: null,
      coreB: null,
      coreBData: null,
      
      // ULTRA EDITION: Animation State
      levitationPhase: levitationPhase,
      driftPhase: driftPhase,
      microJitterPhase: microJitterPhase,
      
      // ULTRA EDITION: Fractal Hologram
      fractalHolo: fractalHolo,
      
      // ULTRA EDITION: Hover State
      hoveredState: false,
      hoverBoost: 0,
      
      // ATOMA NAMING ENGINE 1.0: Pure linguistic layer (SAFE - read-only names only)
      namingCode: null,  // Will be set after archetype assignment
      namingMeaning: null,
      
      // ========== LINK TARGET CONTRACT 1.0: Explicit visual target ==========
      // This is the ONLY object link-state systems are allowed to mutate
      // Assigned explicitly at spawn time, NEVER inferred or derived
      linkTarget: linkTargetMesh
    };
    
    // ========== SAFE METRICS DNA INTEGRATION 1.0: Attach read-only metrics ==========
    // Pure metadata storage - zero gameplay impact
    SafeMetricsDNAIntegration1_0.attachMetrics(nodeModel, safeCategory);
    
    // ========== EXTREME SYSTEMS ACTIVATION v1.0 - STEP 1: Profile Attachment ==========
    // If node is marked as EXTREME, attach its profile from ExtremeAINodePack
    if (nodeModel?.userData?.isExtreme === true && this.extremeNodePack) {
      try {
        const archetypeKey = nodeModel.userData.extremeArchetype || nodeModel.userData.archetype || category;
        // Get profile from the pack's available profiles
        // For now, store reference to pack for later querying
        nodeModel.userData.extremeProfile = {
          archetype: archetypeKey,
          tier: nodeModel.userData.extremeTier || 1,
          visual: null  // Visual profile available via pack for Step 3
        };
      } catch (err) {
        // Silent fallback - node continues without EXTREME profile
      }
    }

    // ========== SESSION 21 - PHASE 2: VISUAL AUTHORITY GUARD ==========
    // Mark node as having primary visual owner (EnhancedNodeModels)
    // This prevents duplicate persistent visuals from evolution/ritual systems
    nodeModel.userData.visualOwner = 'EnhancedNodeModels';
    nodeModel.userData.hasPrimaryVisual = true;
    
    // ========== SESSION 21 - PHASE 2: SPAWN COLLISION SAFETY (Visual-Only Guard) ==========
    // Mark node as pending visual activation until spawn space clears
    // This prevents overlapping auras when nodes spawn too close
    // MICRO-STUTTER FIX: Use for-loop instead of array.filter() to reduce GC pressure
    const occupancyRadius = 1.5; // Conservative visual-only radius
    let hasNearbyNodes = false;
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      if (n !== nodeModel && n.position.distanceTo(position) < occupancyRadius) {
        hasNearbyNodes = true;
        break;
      }
    }
    
    if (hasNearbyNodes) {
      // Space not clear - delay visual activation
      nodeModel.userData.visualReady = false;
      nodeModel.userData.visualActivationDelay = 150; // ms delay
      nodeModel.userData.spawnTime = Date.now();
    } else {
      // Space clear - activate immediately
      nodeModel.userData.visualReady = true;
    }
    
    // --- Analytics spawn sanity check ---
    if (safeCategory === 'analytics') {
      let hasMesh = false;

      nodeModel.traverse(obj => {
        if (obj.isMesh === true) hasMesh = true;
      });

      if (!hasMesh) {
        console.error('[AnalyticsSpawn] Killed empty analytics node', nodeModel.userData?.nodeId);

        // Dispose if already partially added
        if (nodeModel.parent) {
          nodeModel.parent.remove(nodeModel);
        }

        return null; // IMPORTANT: abort spawn completely
      }
    }
    
    // Scene attachment handled centrally in _finalizeSpawnedNode()
    if (nodeModel.userData?.__nonRenderable !== true) {
      // ========================================================================
      // [INTERACTION AUTHORITY] ENFORCE RAYCAST DISCIPLINE
      // Disable raycasting on visual meshes to ensure reliable node selection
      // ========================================================================
      this._enforceNodeRaycastAuthority(nodeModel);
    }
    
    // ========================================================================
    // SESSION 99: FREEZE NODE VISUALS (Emergency Immutability)
    // ========================================================================
    // Hook into global freeze mode if available
    if (window.__nodeVisualFreezeMode__) {
      try {
        window.__nodeVisualFreezeMode__.freezeNode(nodeModel);
      } catch (err) {
        // Silent fail - freeze mode not critical
      }
    }
    
    // ========================================================================
    // SURGICAL FIX: LOCK NODE CORE RENDER ORDER
    // Ensure node cores ALWAYS render on top of links and auras
    // ========================================================================
    nodeModel.traverse(child => {
      if (child.isMesh) {
        const name = (child.name || '').toLowerCase();
        const isCore = name.includes('core') || name.includes('body');
        
        if (isCore) {
          // Core meshes render at highest priority
          child.renderOrder = 100;
          
          // Lock material depth properties
          if (child.material) {
           
            child.material.depthTest = true;
            child.material.transparent = false;
            child.material.opacity = 1.0;
          }
        }
      }
    });
    
    freezeNodeCoreState(nodeModel);
    
    // Archetype / Integration visual state flags (prevent unintended reapply)
    nodeModel.userData = nodeModel.userData || {};
    nodeModel.userData._archetypeApplied = false;
    nodeModel.userData._integrationApplied = false;
    nodeModel.userData._archetypeDirty = true;
    nodeModel.userData._integrationDirty = true;

    purgeForbiddenNodePrimitives(nodeModel);
    if ((nodeModel.children?.length || 0) === 0) {
      console.warn('[NODE_REJECT] Empty visual root');
      return null;
    }
    this._lastSpawnResult = {
      ok: true,
      category: poolCategory,
      visualCode: finalVisualCode
    };
    if (!nodeModel && typeof window !== 'undefined') {
      window.__SPAWN_STATS = window.__SPAWN_STATS || {};
      const key = category || 'unknown';
      window.__SPAWN_STATS[key] = (window.__SPAWN_STATS[key] || 0) + 1;
    }
    return nodeModel;
  }
  
  /**
   * Get layer-based color scheme (EXTENDED SPAWN SYSTEM 1.0 - now includes MYTHIC/PRIME/ERROR)
   */
  getLayerColorScheme(category) {
    const schemes = {
      'input': { primary: 0x00dddd, secondary: 0x0099ff },      // Cyan
      'process': { primary: 0x0066ff, secondary: 0x3399ff },    // Blue
      'integration': { primary: 0xaa00ff, secondary: 0xdd66ff },// Violet
      'analytics': { primary: 0xff00ff, secondary: 0xff66ff },  // Magenta
      'storage': { primary: 0x00ddaa, secondary: 0x00ffdd },    // Teal
      'control': { primary: 0xffaa00, secondary: 0xffdd33 },    // Amber
      'quantum': { primary: 0x4400ff, secondary: 0xaa66ff },    // Indigo
      'sigma': { primary: 0x00ff00, secondary: 0x66ff66 },      // Green
      
      // NEW CATEGORIES (EXTENDED SPAWN SYSTEM 1.0)
      'mythic': { primary: 0xffdd00, secondary: 0xffaa44 },     // Gold - Ultra-rare ceremonial
      'prime': { primary: 0xffffff, secondary: 0xccccff },      // White/Silver - Perfect topology
      'error': { primary: 0xff3333, secondary: 0xff0000 }       // Red - Unstable/chaotic
    };
    return schemes[category] || { primary: 0x00ffff, secondary: 0x0088ff };
  }
  
  /**
   * Get color based on node category
   */
  getNodeColor(category) {
    return EnhancedNodeModels.getCategoryColor(category);
  }
  
  /**
   * Create connections between nearby nodes
   */
  createNodeConnections() {
    for (let i = 0; i < this.nodes.length; i++) {
      const node1 = this.nodes[i];
      
      // Connect to 1-3 nearby nodes
      let connectionCount = 0;
      const maxConnections = 1 + Math.floor(Math.random() * 3);
      
      for (let j = i + 1; j < this.nodes.length && connectionCount < maxConnections; j++) {
        const node2 = this.nodes[j];
        const distance = node1.position.distanceTo(node2.position);
        
        if (distance < this.connectionDistance) {
          this.createConnection(node1, node2);
          connectionCount++;
        }
      }
    }
  }
  
  /**
   * Create connection line between two nodes
   */
  createConnection(node1, node2) {
    const points = [
      node1.position.clone(),
      node2.position.clone()
    ];
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0
    });
    
    const line = new THREE.Line(geometry, material);
    line.userData = {
      node1: node1,
      node2: node2,
      baseOpacity: 0.15,
      activeOpacity: 0.5
    };
    
    this.scene.add(line);
    this.connections.push(line);
  }
  
  /**
   * SESSION 21 - PHASE 2: Check if node's visual is ready (collision safety)
   * Clears visualReady flag after delay if spawn space is now clear
   * @private
   */
  _checkVisualReadiness(node) {
    const data = node.userData;
    if (data.visualReady) return true; // Already ready
    
    if (!data.spawnTime || !data.visualActivationDelay) return true; // No delay set
    
    const elapsed = Date.now() - data.spawnTime;
    if (elapsed < data.visualActivationDelay) return false; // Still waiting
    
    // Delay expired - clear it
    data.visualReady = true;
    data.visualActivationDelay = 0;
    return true;
  }

  /**
   * Update node system
   */
  update(deltaTime, time) {
    const profileEnabled = typeof window !== 'undefined' && window.__ATOMA_PROFILE__ === true;
    if (profileEnabled) this._ensureProfilingStore();

    // Drain queued spawn visual tasks with small budget per frame
    this._drainSpawnVisualQueue();

    const profileStart = name => profileEnabled ? performance.now() : 0;
    const profileEnd = (name, start) => {
      if (!profileEnabled) return;
      this._recordProfileSample(name, performance.now() - start);
    };

    const playerPos = this.player.position;

    const useActivityModel = typeof window !== 'undefined' && window.__ATOMA_ACTIVITY_MODEL__ === true;
    if (useActivityModel) {
      this._ensureActivityModelSeeded();
    }
    
    const perNodeStart = profileStart('perNodeLoop');
    const processNode = (node) => {
      const data = node.userData;
      
      const activationStart = profileStart('activationAndState');

      // SESSION 21 - PHASE 2: Check visual readiness (spawn collision safety)
      this._checkVisualReadiness(node);
      
      // VISUAL BOOTSTRAP 3.0: Monitor for fallback detection (MeshStandardMaterial >1 frame)
      this.visualBootstrap.updateMonitoring(node);
      
      // Check distance to player
      const distance = node.position.distanceTo(playerPos);
      
      // PHASE VD-3 FIX: Apply hysteresis to prevent visual flickering
      // Only change state when clearly inside or clearly outside threshold
      const showThreshold = this.activationDistance - this.activationHysteresis;
      const hideThreshold = this.activationDistance + this.activationHysteresis;
      
      // Initialize activation hysteresis state if needed
      if (data._activationIsNear === undefined) {
        data._activationIsNear = distance < this.activationDistance;
      }
      
      // Apply hysteresis logic
      const isNearPlayer = data._activationIsNear ? (distance < hideThreshold) : (distance < showThreshold);
      
      // Update activation state only when hysteresis threshold crossed
      if (isNearPlayer && !data.isActive) {
        data.isActive = true;
        data.targetActivation = 1;
        data._activationIsNear = true;
        this.activeNodes.add(node);
        this.onNodeActivated(node);
      } else if (!isNearPlayer && data.isActive) {
        data.targetActivation = 0;
        // Only mark as "not near" after fully deactivated
        if (data.activationLevel === 0) {
          data._activationIsNear = false;
        }
      }
      
      // Smooth activation transition
      const activationSpeed = 3;
      if (data.activationLevel < data.targetActivation) {
        data.activationLevel = Math.min(1, data.activationLevel + deltaTime * activationSpeed);
      } else if (data.activationLevel > data.targetActivation) {
        data.activationLevel = Math.max(0, data.activationLevel - deltaTime * activationSpeed);
        
        if (data.activationLevel === 0 && data.isActive) {
          data.isActive = false;
          this.activeNodes.delete(node);
          this.onNodeDeactivated(node);
        }
      }

      profileEnd('activationAndState', activationStart);
      
      // ========== EXTREME SYSTEMS ACTIVATION v1.0 - STEP 2: Gameplay Modifiers ==========
      // Apply EXTREME gameplay modifiers one-time on first activation
      if (node?.userData?.isExtreme === true && !node.userData._extremeGameplayApplied) {
        try {
          // Mark as applied to prevent re-application
          node.userData._extremeGameplayApplied = true;
          
          // Store archetype-based modifiers on node for external systems to query
          const extremeArchetype = node.userData.extremeArchetype || 0;
          const archetypeModifiers = this.getExtremeGameplayModifiers(extremeArchetype);
          
          node.userData.extremeGameplayModifiers = archetypeModifiers;
        } catch (err) {
          // Silent fallback - node continues with normal behavior
          node.userData._extremeGameplayApplied = true;
        }
      }
      
      // Update visual effects based on activation
      const visualsStart = profileStart('updateNodeVisuals');
      this.updateNodeVisuals(node, data, time, deltaTime);
      profileEnd('updateNodeVisuals', visualsStart);
    };

    if (!useActivityModel) {
      this.nodes.forEach(processNode);
    } else {
      // ACTIVE nodes: every frame
      this._activityPools.active.forEach(processNode);

      // SEMI_ACTIVE nodes: gated cadence (~10 Hz)
      this._activitySemiAccumulator += deltaTime;
      if (this._activitySemiAccumulator >= this._activitySemiInterval) {
        this._activitySemiAccumulator %= this._activitySemiInterval;
        this._activityPools.semiActive.forEach(processNode);
      }
    }
    profileEnd('perNodeLoop', perNodeStart);
    
    // AURA LOD CULLING: Update aura visibility based on distance
    const auraStart = profileStart('auraLOD');
    if (this.auraLOD && this.camera) {
      this.auraLOD.updateCulling(this.nodes, this.camera, deltaTime);
    }
    profileEnd('auraLOD', auraStart);
    
    // Update connections
    const connStart = profileStart('updateConnections');
    this.updateConnections();
    profileEnd('updateConnections', connStart);
  }
  
  /**
   * ULTRA NODE EDITION: Update node visual effects with advanced multi-core animation
   * Features: 3-core rotation, orbit rings, intense glow breathing, smart hover feedback
   */
  updateNodeVisuals(node, data, time, deltaTime) {
    if (!data.activationLevel) {
      data.activationLevel = 0;
    }
    
    const activation = data.activationLevel;
    const interactionActive = (
      data.hoveredState === true ||
      data.isSelected === true ||
      node.userData?.isSelected === true ||
      activation > 0
    );

    // Phase B.3.B: idle path must not mutate visual baseline.
    if (!interactionActive) {
      return;
    }
    
    // Use EnhancedNodeModels animation system
    EnhancedNodeModels.animate(node, deltaTime, time);
    
    // HOLOGRAM SHELL REASSERTION GUARD - Dynamic Stabilization
    // For EXTREME and procedural nodes that may modify meshes at runtime
    // Use stable nodeRoot as reference point
    const nodeRoot = node.userData.nodeRoot || node;
    const nodeCategory = data.category || node.userData.category || '';
    const isRiskyNode = nodeCategory.toLowerCase().includes('extreme') || 
                        nodeCategory.toLowerCase().includes('quantum') ||
                        nodeCategory.toLowerCase().includes('procedural');
    
    if (isRiskyNode) {
      // Find core mesh in stable nodeRoot and verify shell integrity
      const coreMesh = nodeRoot.children.find(child => 
        child.isMesh && child.userData.visualLayer === 'CORE' && !child.userData.isHologramShell
      );
      if (coreMesh) {
        reassertNodeHologramShell(nodeRoot, coreMesh, node.userData.color || 0x00ffff);
      }
    }
    
    // Update hologram shell materials
    node.traverse((child) => {
      if (child.isMesh && child.material && child.material.isShaderMaterial && child.userData.visualLayer === 'CORE_SHELL') {
        updateHologramShellMaterial(child.material, deltaTime);
      }
    });
    
    // Atmosphere: keep glow/halo at their configured static opacity (breathing disabled)
    if (data.vfxGlow && !data.vfxGlow.userData?.neutralized) {
      // Runtime renderOrder mutation disabled by Phase B.3.B
    }
    
    if (data.vfxHalo && !data.vfxHalo.userData?.neutralized) {
      // Halo opacity remains as initialized
    }
    
    // ========== ULTRA EDITION: MULTI-CORE AI STRUCTURE ==========
    // CORE A: Bright Neon Point (pulsing heart)
    // NOTE: Core material properties are IMMUTABLE (Session 30)
    // Rotation and position changes are allowed, but NOT material properties
    // Core meshes removed (interaction-only proxy). Skip core-specific animation.
    // ========== ULTRA EDITION: DYNAMIC ORBIT RINGS ==========
    // Rings rotation speed depends on synergy/traffic (via activation)
    if (data.vfxRings && data.vfxRings.length > 0) {
      data.vfxRings.forEach((ring, ringIdx) => {
        if (ring.userData?.neutralized) return;
        const ringData = ring.userData;
        
        // Rotation speed influenced by activation (slower when hovering)
        const ringSpeedModifier = data.hoveredState ? 0.6 : 1.0;
        const rotSpeed = ringData.rotationSpeed * ringSpeedModifier;
        
        // Rotate around individual axis
        const axis = ringData.rotationAxis;
        const rotAmount = rotSpeed * deltaTime;
        
        // Apply quaternion rotation
        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(axis, rotAmount);
        ring.quaternion.multiplyQuaternions(quaternion, ring.quaternion);
        
        // Interaction-only opacity modulation (no time component)
        const ringOpacityBase = ringData.baseOpacity;
        ring.material.opacity = ringOpacityBase + activation * 0.1;
      });
    }
    
    // ========== ULTRA EDITION: ENERGY SPARK PARTICLES (increased activity) ==========
    if (data.particles && data.particles.length > 0) {
      data.particles.forEach((particle, idx) => {
        if (particle.userData?.neutralized) return;
        const pData = particle.userData;
        
        // Faster orbit speed based on activity
        const orbitSpeedMod = 1 + activation * 0.5;
        pData.orbitAngle += pData.orbitSpeed * deltaTime * orbitSpeedMod;
        
        // Expanded orbit on high activity
        const orbitRadiusMod = 1 + activation * 0.3;
        const radius = pData.orbitRadius * orbitRadiusMod;
        
        particle.position.x = Math.cos(pData.orbitAngle) * radius;
        particle.position.z = Math.sin(pData.orbitAngle) * radius;
        particle.position.y = Math.sin(pData.orbitAngle * 0.7) * 0.35;
        
        // Spark intensity tracks activation only (no time component)
        const sparkBrightness = 0.6 + activation * 0.25;
        particle.material.opacity = sparkBrightness;
        // FIX: Only update emissive on materials that support it
        if (this.ensureEmissiveSafe(particle.material)) particle.material.emissiveIntensity = 0.3 + activation * 0.2;
        
        // Particle size tracks activation only (no time component)
        const particleScale = 0.08 * (0.8 + activation * 0.3);
        particle.scale.setScalar(particleScale);
      });
    }
    
    // ========== ULTRA EDITION: FRACTAL HOLOGRAM LAYER ==========
    if (data.fractalHolo && !data.fractalHolo.userData?.neutralized) {
      // Slow rotation for fractal patterns
      const fractalSpeed = data.fractalHolo.userData.rotationSpeed;
      data.fractalHolo.rotation.x += fractalSpeed * deltaTime * 0.3;
      data.fractalHolo.rotation.y += fractalSpeed * deltaTime * 0.5;
      data.fractalHolo.rotation.z += fractalSpeed * deltaTime * 0.2;
      
      // Opacity tracks activation only (no time component)
      data.fractalHolo.material.opacity = 0.03 + activation * 0.03;
    }
    
    // ========== ULTRA EDITION: NODE HIGHLIGHT ON HOVER ==========
    if (data.ultraMode) {
      // Smooth hover boost
      if (data.hoveredState) {
        data.hoverBoost = Math.min(data.hoverBoost + deltaTime * 3, 0.3);
      } else {
        data.hoverBoost = Math.max(data.hoverBoost - deltaTime * 3, 0);
      }
      
      // NOTE: Core meshes removed; hover feedback limited to aura/overlay meshes
      if (data.vfxGlow && !data.vfxGlow.userData?.neutralized) {
        if (data.originalGlowOpacity === undefined) {
          data.originalGlowOpacity = data.vfxGlow.material.opacity;
        }
        data.vfxGlow.material.opacity = Math.min(0.9, data.originalGlowOpacity + data.hoverBoost * 0.5);
      }
      if (data.vfxRings && data.vfxRings.length > 0) {
        data.vfxRings.forEach(ring => {
          if (ring.userData?.neutralized) return;
          const baseOpacity = ring.userData?.baseOpacity ?? ring.material.opacity;
          ring.material.opacity = Math.min(1, baseOpacity + data.hoverBoost * 0.3);
        });
      }
    }
    
    // Point light intensity based on activation
    if (data.light) {
      data.light.intensity = activation * 2;
      data.light.distance = 10 + activation * 5;
    }
  }
  
  /**
   * Update connection lines
   */
  updateConnections() {
    this.connections.forEach(connection => {
      // LIFECYCLE GUARD: Skip if connection or geometry is disposed
      if (!connection || !connection.geometry || 
          !connection.geometry.attributes || 
          !connection.geometry.attributes.position || 
          !connection.geometry.attributes.position.array) {
        return;
      }
      
      const node1 = connection.userData.node1;
      const node2 = connection.userData.node2;
      
      const isNode1Active = node1.userData.isActive;
      const isNode2Active = node2.userData.isActive;
      
      // Connection glows when both nodes are active
      if (isNode1Active && isNode2Active) {
        connection.material.opacity = connection.userData.activeOpacity;
        
        // Pulse effect
        const activation1 = node1.userData.activationLevel;
        const activation2 = node2.userData.activationLevel;
        const avgActivation = (activation1 + activation2) / 2;
        connection.material.opacity = connection.userData.activeOpacity * avgActivation;
      } else if (isNode1Active || isNode2Active) {
        // Dim connection if only one is active
        const activeNode = isNode1Active ? node1 : node2;
        connection.material.opacity = connection.userData.baseOpacity * 
          activeNode.userData.activationLevel;
      } else {
        connection.material.opacity = 0;
      }
      
      // Update line positions (in case nodes move)
      const positions = connection.geometry.attributes.position;
      positions.setXYZ(0, node1.position.x, node1.position.y, node1.position.z);
      positions.setXYZ(1, node2.position.x, node2.position.y, node2.position.z);
      positions.needsUpdate = true;
    });
  }
  
  /**
   * EXTREME SYSTEMS ACTIVATION v1.0 - Get archetype-based gameplay modifiers
   * 
   * Returns gameplay modifiers for EXTREME archetypes (0-11)
   * These modifiers can be used by other systems (synergy, corruption, load, etc.)
   */
  getExtremeGameplayModifiers(archetypeId) {
    // Archetype IDs map to modifiers (extensible pattern)
    // Modifiers are stored as properties that gameplay systems can query
    const modifierProfiles = {
      0: { name: 'Hyperbolic Prism', loadMult: 1.15, syncBonus: 0.08 },
      1: { name: 'Singularity Knot', loadMult: 1.35, corruptResist: 0.3 },
      2: { name: 'Quantum Lattice', loadMult: 1.2, syncBonus: 0.15 },
      3: { name: 'Fractal Bloom', loadMult: 1.0, cascadeAmp: 1.25 },
      4: { name: 'Reactive Tesseract', cascadeAmp: 1.4, loadMult: 1.1 },
      5: { name: 'Chaotic Heart', loadMult: 1.5, stressMult: 1.5 },
      6: { name: 'Whisper Sphere', loadMult: 0.8, syncBonus: 0.12 },
      7: { name: 'Echo Fractal', cascadeAmp: 1.5, loadMult: 1.05 },
      8: { name: 'Abyssal Shard', loadMult: 0.9, stabilityMult: 1.2 },
      9: { name: 'Tri-Helix', loadMult: 1.0, corruptResist: 0.25 },
      10: { name: 'Infinite Spiral', syncBonus: 0.2, cascadeAmp: 1.1 },
      11: { name: 'Chrono Ripper', loadMult: 1.2, syncBonus: 0.1 }
    };
    
    const id = Math.max(0, Math.min(11, archetypeId || 0));
    return modifierProfiles[id] || { name: 'Unknown', loadMult: 1.0 };
  }
  
  /**
   * EXTREME SYSTEMS ACTIVATION v1.0 - Query EXTREME modifiers for a node
   * Public helper for external gameplay systems
   * 
   * @param {THREE.Object3D} node - Node to query
   * @returns {Object} Modifier object, or empty for non-EXTREME nodes
   */
  queryExtremeModifiers(node) {
    if (!node?.userData?.isExtreme || !node.userData.extremeGameplayModifiers) {
      return { loadMult: 1.0 }; // Default: no modification
    }
    return node.userData.extremeGameplayModifiers;
  }
  
  /**
   * Called when node is activated
   */
  onNodeActivated(node) {
    const data = node.userData;
    console.log(`AI Node ${data.index} [${data.category}] activated`);
    
    // Create activation pulse effect
    this.createActivationPulse(node);
  }
  
  /**
   * Called when node is deactivated
   */
  onNodeDeactivated(node) {
    const data = node.userData;
    const category = this.getNodeCategory(node);
    console.log(`AI Node ${data.index} [${category}] deactivated`);
  }
  
  /**
   * Create visual pulse effect on activation
   * 
   * FIXED (Session 37+ Part 2): Converted requestAnimationFrame loop to orchestrator effect.
   * Now driven by deltaTime instead of wall-clock performance.now().
   */
  createActivationPulse(node) {
    return null;
    const pulseGeometry = new THREE.RingGeometry(0.5, 0.6, 32);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: node.userData.baseColor,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.position.copy(node.position);
    pulse.rotation.x = Math.PI / 2;
    
    this.scene.add(pulse);
    
    // Register with orchestrator instead of requestAnimationFrame
    if (this.effectOrchestrator) {
      const effect = {
        id: `activation-pulse-${node.uuid}`,
        type: 'activationPulse',
        elapsed: 0,
        duration: 1.0, // 1 second in game time
        pulse: pulse,
        baseColor: node.userData.baseColor,
        
        update: (dt, time) => {
          const progress = Math.min(this.elapsed / this.duration, 1);
          
          // Scale from 1 to 3
          const scale = 1 + (3 - 1) * progress;
          pulse.scale.set(scale, scale, 1);
          
          // Fade out
          pulse.material.opacity = 0.8 * (1 - progress);
          
          return { done: progress >= 1 };
        },
        
        dispose: () => {
          this.scene.remove(pulse);
          pulse.geometry.dispose();
          pulse.material.dispose();
        }
      };
      
      this.effectOrchestrator.add(effect);
    } else {
      // Fallback: immediate cleanup if orchestrator unavailable
      console.warn('[AINodes] effectOrchestrator not available for activation pulse');
      this.scene.remove(pulse);
      pulse.geometry.dispose();
      pulse.material.dispose();
    }
  }
  
  /**
   * TRIGGER UPGRADE PULSE
   * Visual feedback when a duplicate spawn is denied but upgrades existing node
   */
  triggerUpgradePulse(node) {
      if (!node) return;
      
      // 1. Visual Flash
      if (this.visualBootstrap) {
          // Use bootstrap effect or custom one
          const pulse = this.createActivationPulse(node);
          if (pulse && pulse.material) {
              pulse.material.color.setHex(0xffdd00); // Gold flash
          }
      }

      // 2. Gameplay Buff (if active)
      if (node.userData) {
          node.userData.activationLevel = 1.0;
          node.userData.isActive = true;
          // Extend visual feedback
          if (node.userData.vfxGlow) {
              node.userData.vfxGlow.scale.multiplyScalar(1.5);
              // Tween back later
          }
      }
  }

  /**
   * Get info about active nodes
   */
  getActiveNodeInfo() {
    const info = {
      totalNodes: this.nodes.length,
      activeNodes: this.activeNodes.size,
      nodesByCategory: {}
    };
    
    this.nodeCategories.forEach(category => {
      info.nodesByCategory[category] = 0;
    });
    
    this.activeNodes.forEach(node => {
      const category = node.userData.category;
      info.nodesByCategory[category] = (info.nodesByCategory[category] || 0) + 1;
    });
    
    return info;
  }

  /**
   * RUN COMPREHENSIVE VISUAL AUDIT
   * Detects and reports all visual anomalies across all nodes
   * 
   * @returns {Object} Audit report with statistics and detailed issues
   */
  auditVisualIntegrity() {
    const audit = new NodeCategoryAudit(this.scene);
    const report = audit.auditAllNodes();
    return {
      report,
      summary: audit.getSeveritySummary(),
      byType: audit.getIssuesByType(),
      bySeverity: this._categorizeIssuesBySeverity(audit.report.detailedIssues),
      printReport: () => console.log(audit.generateReport()),
      exportJSON: () => audit.exportJSON(),
      exportCSV: () => audit.exportCSV()
    };
  }

  /**
   * Quick audit shortcut (no detailed report)
   * 
   * @returns {Object} Summary only
   */
  quickAudit() {
    const result = auditNodeVisuals(this.scene);
    return {
      total: result.report.totalNodesAudited,
      anomalies: result.report.anomaliesFound,
      summary: result.summary,
      healthy: result.report.totalNodesAudited - result.report.anomaliesFound
    };
  }

  /**
   * Get audit for specific node
   */
  auditNode(node) {
    const audit = new NodeCategoryAudit(this.scene);
    audit.auditNode(node);
    return {
      nodeId: node.userData.nodeId,
      category: node.userData.category,
      issues: audit.report.detailedIssues,
      isHealthy: audit.report.detailedIssues.length === 0
    };
  }

  /**
   * Get audit for specific category
   */
  auditCategory(category) {
    const audit = new NodeCategoryAudit(this.scene);
    audit.auditAllNodes();
    
    const categoryIssues = audit.report.anomaliesByCategory[category] || [];
    const categoryStats = audit.report.categoryStats[category] || {};
    
    return {
      category,
      total: categoryStats.total || 0,
      healthy: categoryStats.healthy || 0,
      anomalous: categoryStats.anomalous || 0,
      issues: categoryIssues,
      stats: categoryStats
    };
  }

  /**
   * Fix reported anomalies (auto-repair)
   * 
   * @param {Array} issues - Issues to fix (from audit report)
   * @returns {Object} Fix results
   */
  fixAnomalies(issues) {
    const results = {
      attempted: 0,
      fixed: 0,
      failed: 0,
      details: []
    };

    if (!Array.isArray(issues)) {
      issues = [issues];
    }

    issues.forEach(issue => {
      try {
        results.attempted++;

        // Find affected node
        const node = this.nodes.find(n => n.userData.nodeId === issue.nodeId);
        if (!node) {
          results.failed++;
          results.details.push({
            issue: issue.type,
            result: 'FAILED: Node not found'
          });
          return;
        }

        // Apply fixes based on issue type
        let fixed = false;

        if (issue.type === 'HOLOGRAM_SHELL_FRUSTUM_CULL_ENABLED') {
          const nodeRoot = node.userData.nodeRoot || node;
          const holoShell = nodeRoot.children.find(child =>
            child.isMesh && child.userData.isHologramShell === true
          );
          if (holoShell) {
            holoShell.frustumCulled = true;
            fixed = true;
          }
        }

        if (issue.type === 'CORE_MESH_FRUSTUM_CULL_ENABLED') {
          const nodeRoot = node.userData.nodeRoot || node;
          const coreMesh = nodeRoot.children.find(child =>
            child.isMesh && child.userData.visualLayer === 'CORE'
          );
          if (coreMesh) {
            coreMesh.frustumCulled = true;
            fixed = true;
          }
        }

        if (issue.type === 'HOLOGRAM_SHELL_WRONG_RENDER_ORDER') {
          const nodeRoot = node.userData.nodeRoot || node;
          const holoShell = nodeRoot.children.find(child =>
            child.isMesh && child.userData.isHologramShell === true
          );
          if (holoShell) {
            holoShell.renderOrder = 5;
            fixed = true;
          }
        }

        if (issue.type === 'MISSING_HOLOGRAM_SHELL') {
          // Re-assert hologram shell
          const nodeRoot = node.userData.nodeRoot || node;
          const coreMesh = nodeRoot.children.find(child =>
            child.isMesh && child.userData.visualLayer === 'CORE'
          );
          if (coreMesh) {
            reassertNodeHologramShell(nodeRoot, coreMesh, node.userData.color || 0x00ffff);
            fixed = true;
          }
        }

        if (fixed) {
          results.fixed++;
          results.details.push({
            issue: issue.type,
            result: 'FIXED'
          });
        } else {
          results.failed++;
          results.details.push({
            issue: issue.type,
            result: 'FAILED: Unknown fix for this issue'
          });
        }
      } catch (err) {
        results.failed++;
        results.details.push({
          issue: issue.type,
          result: `FAILED: ${err.message}`
        });
      }
    });

    return results;
  }

  /**
   * Helper: Categorize issues by severity
   */
  _categorizeIssuesBySeverity(issues) {
    const bySeverity = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: []
    };

    issues.forEach(issue => {
      if (bySeverity.hasOwnProperty(issue.severity)) {
        bySeverity[issue.severity].push(issue);
      }
    });

    return bySeverity;
  }

  
  /**
   * Get node category safely - centralizes category reading
   * Prevents undefined categories from reaching HUD or LinkRegistry
   * 
   * @param {THREE.Object3D} node - The node to read from
   * @returns {string} The category (primary source), archetype (fallback), or 'undefined'
   */
  getNodeCategory(node) {
    if (!node || !node.userData) return 'undefined';
    
    // Primary source: userData.category (set during spawn)
    if (node.userData.category) {
      return node.userData.category;
    }
    
    // Fallback 1: archetype
    if (node.userData.archetype) {
      return node.userData.archetype;
    }
    
    // Fallback 2: type (legacy compatibility)
    if (node.userData.type) {
      return node.userData.type;
    }
    
    return 'undefined';
  }

  /**
   * Dynamic Node Spawning System
   * Manages time-based, event-based, and AI-growth spawning
   */
  initializeNodeSpawning() {
    // ============================================================
    // DEV-ONLY GUARD: Detect writes to nextTimeSpawn outside updateSpawning()
    // ============================================================
    const DEV_GUARDS_ENABLED = (typeof window !== 'undefined') && (window.ATOMA_DEV_GUARDS === true);
    
    // Token to allow writes - only set within updateSpawning()
    let allowWriteToken = false;
    
    // ============================================================
    // DEV-ONLY GUARD: Wrap nextTimeSpawn with property interceptor
    // ============================================================
    const guardNextTimeSpawn = (configObj) => {
      if (!DEV_GUARDS_ENABLED) return;
      
      const rawNextTimeSpawn = Date.now() + 5000; // Initial seed value
      
      Object.defineProperty(configObj, 'nextTimeSpawn', {
        get: () => rawNextTimeSpawn,
        set: (value) => {
          if (!allowWriteToken) {
            // Unauthorized write detected!
            const error = new Error('[SPAWN_TIMING_GUARD] Unauthorized write to spawningConfig.nextTimeSpawn');
            console.error(error.message);
            console.error('Stack trace:', error.stack);
            console.error('Value attempted:', value);
            console.error('This property should ONLY be written by updateSpawning()');
          } else {
            // Authorized write - allow it
            rawNextTimeSpawn = Date.now() + value; // value is offset from Date.now()
          }
        },
        enumerable: true,
        configurable: true
      });
      
      // Store raw value for internal use
      configObj._rawNextTimeSpawn = rawNextTimeSpawn;
    };
    
    // ============================================================
    // Store token setter for updateSpawning() to use
    // ============================================================
    this.__spawnTimingGuard = {
      setAllowWriteToken: (value) => { allowWriteToken = value; }
    };
    
    // Spawning configuration - UNIFORM SELECTION (PHASE S3)
    // All categories have equal probability - no rarity weighting
    const defaultTargetPopulation = (() => {
      const mode = (typeof window !== 'undefined' ? window.game?.currentMode : null) || this.currentMode || null;
      return mode === 'chamber' ? 80 : 120;
    })();
    this.spawningConfig = {
      // Legacy interval config (kept for UI/debug reference only)
      // NOT used for actual spawn timing - updateSpawning() is single authority
      timeSpawnInterval: { min: 20000, max: 40000 },
      // Configurable cap (runtime adjustable)
      targetPopulation: defaultTargetPopulation,
      
      // Event-based spawning
      lastLinkTime: 0,
      linkSpawnCooldown: 5000, // 5 second cooldown between link spawns
      
      // AI growth monitoring
      lastNetworkCheck: Date.now(),
      networkCheckInterval: 10000, // Check every 10 seconds
      maxNodesTarget: 50,
      spawnThreshold: 0.7, // Spawn if below 70% of max
      
      // Event-based spawn chances (unchanged - independent of category selection)
      eventSpawnChances: {
        onLinkCreated: 0.2,           // 20% chance on link creation
        onHighSynergy: 0.15,          // 15% when high synergy detected
        chaosEvent: 0.05              // 5% chance ERROR node on chaos
      },
      
      // Rare node spawn chance (legacy, now replaced by weights)
      rareMaterializeChance: 0.15, // 15% chance for rare nodes (kept for compatibility)
      
    };
    
    // ============================================================
    // ACTIVATE THE GUARD on spawningConfig (must be AFTER config creation)
    // ============================================================
    guardNextTimeSpawn(this.spawningConfig);
    
    // Materialize animation tracking
    this.materializingNodes = new Set();
    this._runtimeSpawnIndex = 0;

    // Spawn Visual Burst Gate (queues heavy visual work to spread across frames)
    this.spawnVisualQueue = (typeof window !== 'undefined'
      ? (window.__spawnVisualQueue = window.__spawnVisualQueue || [])
      : []);
    this.spawnVisualStats = (typeof window !== 'undefined'
      ? (window.__spawnVisualStats = window.__spawnVisualStats || { queued: 0, executed: 0 })
      : { queued: 0, executed: 0 });
    this._inputBypassLogged = this._inputBypassLogged || false;
    
    // [SESSION 110] Node Spawn Registry - Single-Instance Enforcement
    // Tracks active nodes to prevent duplicates of unique archetypes
    this.nodeRegistry = new Map();
  }
  
  /**
   * [SESSION 110] Generate unique registry key for a node
   * Determines if a node request represents a Singleton (unique) or Generic (multi) identity
   * 
   * @returns {string|null} Key if singleton, null if generic (always spawn)
   */
  _getRegistryKey(category, archetype) {
    const cleanCategory = (category || 'input').toLowerCase().trim();
    const cleanArchetype = (archetype || '').trim();
    
    // 1. If no specific archetype provided, or archetype == category, it's Generic
    if (!cleanArchetype || cleanArchetype === cleanCategory || cleanArchetype === 'default') {
      return null; // Allow multiple
    }
    
    // 2. If archetype is one of the standard categories, it's Generic
    if (this.nodeCategories.includes(cleanArchetype.toLowerCase())) {
      return null;
    }
    
    // 3. Otherwise, it's a specific named archetype (e.g. "MYTHIC-CEREMONIAL") -> Singleton
    return cleanArchetype;
  }

  /**
   * Get random spawn interval (milliseconds)
   */
  getRandomSpawnInterval() {
    return 6000; // steady interval after ramp
  }
  
  /**
   * Find safe spawn location (open, visible, no overlap)
   */
  findSafeSpawnLocation() {
    const maxAttempts = 15;
    const minDistanceToPlayer = 5;
    const minDistanceBetweenNodes = 2;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Generate random position in world-space
      const angle = Math.random() * Math.PI * 2;
      const distance = 15 + Math.random() * 40;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const y = 2 + Math.random() * 6;
      
      const candidate = new THREE.Vector3(x, y, z);
      
      // Check distance to player (avoid spawning on player)
      if (candidate.distanceTo(this.player.position) < minDistanceToPlayer) {
        continue;
      }
      
      // Check for overlap with existing nodes
      let overlaps = false;
      for (const node of this.nodes) {
        if (candidate.distanceTo(node.position) < minDistanceBetweenNodes) {
          overlaps = true;
          break;
        }
      }
      
      if (overlaps) continue;
      
      // Raycast downward to check for geometry collision
      const raycaster = new THREE.Raycaster(
        candidate.clone().add(new THREE.Vector3(0, 5, 0)),
        new THREE.Vector3(0, -1, 0)
      );
      raycaster.far = 10;
      
      // Check intersection with scene (basic geometry check)
      const intersects = raycaster.intersectObjects(this.scene.children, true);
      const filtered = filterRaycastIntersections(intersects);
      
      // If we hit something close below, it's likely geometry - bad spawn
      if (filtered.length > 0) {
        const hitDistance = filtered[0].distance;
        if (hitDistance < 3) continue; // Too close to geometry
      }
      
      // Safe location found!
      return candidate;
    }
    
    // Fallback: spawn near player at safe distance
    const fallbackAngle = Math.random() * Math.PI * 2;
    const fallbackDistance =
      this.minSpawnDistance +
      Math.random() * (this.maxSpawnDistance - this.minSpawnDistance);
    return this.player.position.clone().add(
      new THREE.Vector3(
        Math.cos(fallbackAngle) * fallbackDistance,
        2,
        Math.sin(fallbackAngle) * fallbackDistance
      )
    );
  }
  
  /**
   * Get uniform random category from all 49 archetypes (EXTENDED SPAWN SYSTEM 1.0)
   * UNIFORM SELECTION: All categories have equal probability
   */
  getWeightedRandomCategory() {
    // Combine all category options into a single uniform pool
    const allCategories = [
      ...this.nodeCategories,      // Standard: input, process, integration, analytics, storage, control
      ...this.newNodeCategories,  // New: mythic, prime, error
      ...this.specialNodeTypes,   // Special: sigma, quantum, emotional
      'extreme'                 // EXTREME archetypes
    ];
    
    // Uniform random selection - each category has equal probability
    return allCategories[Math.floor(Math.random() * allCategories.length)];
  }

  /**
   * Runtime spawn intent injector (Phase 2)
   * Ensures scheduler/event spawns always provide an explicit canonical category
   */
  getRuntimeSpawnCategoryIntent() {
    const category = this.getNextCyclicSpawnCategory();
    if (category) {
      if (!this._spawnIntentLogged) {
        console.info('[SpawnIntent] runtime spawn injected category:', category);
        this._spawnIntentLogged = true;
      }
      return category;
    }

    // Hard fallback: keep scheduler alive but continue cycle next tick.
    return 'input';
  }
  
  /**
   * Register node root with duplicate guard
   */
  registerNodeRoot(root) {
    if (!root) return root;
    const id = root.userData?.nodeId;
    if (!this.nodes) this.nodes = [];
    if (!this.nodesMap) this.nodesMap = new Map();

    if (!id) {
      this.nodes.push(root);
      return root;
    }

    if (this.nodesMap.has(id)) {
      return this.nodesMap.get(id);
    }

    this.nodesMap.set(id, root);
    this.nodes.push(root);
    return root;
  }

  /**
   * Canonical spawn finalizer: ensures visibility, scene attachment, and registration.
   * All spawn entrypoints must route through this to guarantee on-screen results.
   */
  _finalizeSpawnedNode(node, category, position, options = {}) {
    const __diag = __ensureSpawnDiag();
    if (!node || !(node instanceof THREE.Object3D)) {
      if (!this._warnedInvalidNode) {
        console.warn('[SpawnFinalize] Invalid node object supplied; spawn aborted');
        this._warnedInvalidNode = true;
      }
      if (__diag) __diag.finalizeNull.invalid_object3d = (__diag.finalizeNull.invalid_object3d || 0) + 1;
      return null;
    }

    const ensureUserDataObject = (obj) => {
      if (!obj || obj.isObject3D !== true) return null;
      if (obj.userData && typeof obj.userData === 'object') {
        return obj.userData;
      }
      try {
        obj.userData = {};
        return obj.userData;
      } catch (e) {
        return null;
      }
    };

    // Keep child state untouched; only enforce root visibility and sane scale.
    node.visible = true;
    // TEMP DEBUG: prevent frustum culling on spawned node root to diagnose disappearing visuals
    node.frustumCulled = false;
    const scaleNonFinite =
      !Number.isFinite(node.scale?.x) ||
      !Number.isFinite(node.scale?.y) ||
      !Number.isFinite(node.scale?.z);
    if (!Number.isFinite(node.scale.x) || node.scale.x <= 0) node.scale.x = 1;
    if (!Number.isFinite(node.scale.y) || node.scale.y <= 0) node.scale.y = 1;
    if (!Number.isFinite(node.scale.z) || node.scale.z <= 0) node.scale.z = 1;
    if (node.layers && node.layers.mask === 0) {
      try {
        node.layers.mask = 1; // layer 0 only
      } catch (e) {
        // keep original if layers are immutable
      }
    }

    // Hard visual integrity gate: fail fast on missing meshes/materials/geometry.
    // BYPASSED FOR VISUAL-REJECTION-BYPASS PHASE - allow nodes with visual integrity issues
    const integrity = validateNodeVisualIntegrity(node);
    if (false && (
      integrity.meshCount === 0 ||
      integrity.materiallessMeshes.length > 0 ||
      integrity.geometrylessMeshes.length > 0
    )) {
      console.error('[VisualReject]', {
        archetype: node.userData?.archetype,
        category,
        reason:
          integrity.meshCount === 0
            ? 'NoMesh'
          : integrity.materiallessMeshes.length > 0
            ? 'NoMaterial'
            : 'NoGeometry',
        meshCount: integrity.meshCount,
        materiallessMeshes: integrity.materiallessMeshes,
        geometrylessMeshes: integrity.geometrylessMeshes,
        nodeId: node.userData?.nodeId || node.uuid,
      });
      return null;
    }

    let renderableCount = 0;
    let badBoundsCount = 0;
    node.traverse((obj) => {
      if (!obj || obj.isObject3D !== true) return;
      if (obj.isMesh === true || obj.isLine === true || obj.isPoints === true) {
        renderableCount++;
        const geometry = obj.geometry;
        if (geometry) {
          const radius = geometry.boundingSphere?.radius;
          const needsSphere =
            !geometry.boundingSphere ||
            !Number.isFinite(radius) ||
            radius <= 0;
          if (needsSphere && typeof geometry.computeBoundingSphere === 'function') {
            try {
              geometry.computeBoundingSphere();
            } catch (e) {
              // Keep default behavior; mark bad bounds below if still invalid.
            }
          }
        const finalRadius = geometry.boundingSphere?.radius;
        if (!Number.isFinite(finalRadius) || finalRadius <= 0) {
          const retryGeometry = geometry;
          if (retryGeometry && typeof retryGeometry.computeBoundingSphere === 'function') {
            try {
              retryGeometry.computeBoundingSphere();
              const retryRadius = retryGeometry.boundingSphere?.radius;
              if (Number.isFinite(retryRadius) && retryRadius > 0) {
                return;
              }
            } catch (e) {
              // continue to bad-bounds handling
            }
          }
          const ud = ensureUserDataObject(obj);
          if (ud) ud.__badBounds = true;
          badBoundsCount++;
        }
        }
      }
    });

    const issues = [];
    if (!node.parent && !this.scene) issues.push('no-scene-parent');
    if (renderableCount === 0) issues.push('no-renderables');
    if (badBoundsCount > 0) issues.push(`bad-bounds:${badBoundsCount}`);
    if (node.layers && node.layers.mask === 0) issues.push('layer-mask-0');
    if (scaleNonFinite) issues.push('scale-non-finite');

    if (issues.length > 0) {
      console.warn(`[SpawnFinalize] visibility-risk id=${node.uuid || 'unknown'} cat=${category || 'unknown'} issues=${issues.join(',')}`);
    }

    if (renderableCount === 0) {
      if (__diag) __diag.finalizeNull.zero_renderables = (__diag.finalizeNull.zero_renderables || 0) + 1;
      return null;
    }

    // Protection: invisible roots must not enter the scene
    if (!node.children || node.children.length === 0) {
      const nodeId = node.userData?.nodeId || node.uuid || 'unknown';
      console.warn('[NodeInvisibleAbort]', nodeId);
      if (__diag) __diag.finalizeNull.no_children = (__diag.finalizeNull.no_children || 0) + 1;
      return null;
    }

    // Global sphere policy gate before any scene attachment.
 //   const spherePolicyResult = validateSpherePolicyObject3D(node, {
 //     phase: 'spawn-finalize',
 //     category,
 //     nodeId: node.userData?.nodeId || node.uuid,
 //   });
 //   if (!node.parent && (!node.children || node.children.length === 0 || spherePolicyResult.removed > 0 && !hasRenderableVisual(node))) {
 //     console.warn('[NodeSpawnSkipped] Sphere policy removed renderables, skipping node', node.userData?.nodeId || node.uuid || null);
  //    return null;
 //   }

    let sceneAdded = false;
    if (!node.parent && this.scene) {
      this.scene.add(node);
      sceneAdded = true;
    }

    // Minimal identity + category guarantees
    const rootUserData = ensureUserDataObject(node);
    if (rootUserData && !rootUserData.id) {
      rootUserData.id = rootUserData.nodeId || `node-${Date.now()}-${Math.random()}`;
    }
    if (rootUserData && !rootUserData.nodeId) {
      rootUserData.nodeId = rootUserData.id;
    }
    if (rootUserData && !rootUserData.category && category) {
      rootUserData.category = category;
    }

    // Register only after visibility is confirmed
    this.registerNodeRoot(node);

    if (options.registryKey) {
      this.nodeRegistry.set(options.registryKey, node);
      if (typeof window !== 'undefined' && window.DEBUG_SINGLE_INSTANCE_NODES) {
        console.log(`[SpawnRegistry] Registered unique node: ${options.registryKey}`);
      }
    }

    // Recover visual identity from children if missing on root
    if (node?.userData?.visualCode === undefined) {
      let found = null;
      node.traverse(o => {
        if (found || !o?.userData?.visualCode) return;
        found = o;
      });
      if (found) {
        copySpawnIdentity(found, node);
      }
    }
    if (node && node.children && !node.userData.visualCode) {
      const src = node.children.find(c => c.userData?.visualCode);
      if (src) {
        node.userData.visualCode = src.userData.visualCode;
        node.userData.factoryName = src.userData.factoryName;
        node.userData.category = src.userData.category;
      }
    }

    return { node, sceneAdded, renderableCount, badBoundsCount };
  }

  /**
   * SPAWN REPAIR 2.0 (SAFE EDITION): Spawn a single new node with materialize animation
   * 100% SYNCHRONOUS - No queueMicrotask, no setTimeout, no async delays
   * userData.category is guaranteed set BEFORE any HUD or LinkRegistry reads it
   * 
   * [SPAWN AUTHORITY FIX] ENFORCE ENHANCED NODE MODEL AS SINGLE SOURCE OF TRUTH
   */
  spawnNode(category = null, position = null, forceArchetype = null) {
  const __diag = __ensureSpawnDiag();
  if (__diag) __diag.spawnNodeEnter++;
  if (!this.__spawnTraceCounter) this.__spawnTraceCounter = 0;
  this.__spawnTraceCounter++;
  this._lastSpawnResult = { ok: false, reason: 'START', category };
  const allowDirect =
    (typeof window === 'undefined') ? true : window.ATOMA_ALLOW_DIRECT_SPAWN === true;
  if (!allowDirect) {
    console.error('[SPAWN DIRECT CALL BLOCKED]', { stack: new Error().stack });
    if (typeof window !== 'undefined') {
      window.__SPAWN_FAILS = window.__SPAWN_FAILS || {};
      const key = category || 'unknown';
      window.__SPAWN_FAILS[key] = (window.__SPAWN_FAILS[key] || 0) + 1;
    }
    return null;
  }
  if (this.spawnMode !== 'RUNTIME') {
    console.warn('[SPAWN BLOCKED – direct call]', { caller: new Error().stack });
    if (typeof window !== 'undefined') {
      window.__SPAWN_FAILS = window.__SPAWN_FAILS || {};
      const key = category || 'unknown';
      window.__SPAWN_FAILS[key] = (window.__SPAWN_FAILS[key] || 0) + 1;
    }
    return null;
  }
  if (!this._spawnFromUpdate) {
    console.error('[ILLEGAL SPAWN CALL] spawnNode invoked outside updateSpawning', { caller: new Error().stack });
    if (typeof window !== 'undefined') {
      window.__SPAWN_FAILS = window.__SPAWN_FAILS || {};
      const key = category || 'unknown';
      window.__SPAWN_FAILS[key] = (window.__SPAWN_FAILS[key] || 0) + 1;
    }
    return null;
  }
  if (shouldLogSpawn()) {
    console.warn(
      '[SPAWN TRACE]',
      'count=', this.__spawnTraceCounter,
      'category=', category,
      'stack=', new Error().stack.split('\n').slice(2, 6).join(' | ')
    );
  }
    // ============================================================
    // [LINK-SPAWN-TRACE] Debug instrumentation
    // ============================================================
    if (window.ATOMA_DEBUG_LINK_SPAWN === true) {
      console.warn('[LINK-SPAWN] spawnNode called', {
        category,
        position,
        forceArchetype,
        stack: new Error().stack
      });
    }
    if (!this.ensureFactoriesReady()) {
      if (typeof window !== 'undefined') {
        window.__SPAWN_FAILS = window.__SPAWN_FAILS || {};
        const key = category || 'unknown';
        window.__SPAWN_FAILS[key] = (window.__SPAWN_FAILS[key] || 0) + 1;
      }
      return null;
    }

    // Local trackers for fallback detection (no behavioral change to visuals/logic)
    const requestedCategoryRaw = category;
    if (this._fallbackLogged === undefined) this._fallbackLogged = false;
    if (this.fallbackNode === undefined) this.fallbackNode = null;
    if (this._fallbackNode === undefined) this._fallbackNode = null; // single-instance fallback sink
    if (this._fallbackWarned === undefined) this._fallbackWarned = false;
    let fallbackReason = null;

    const archetypeKey = forceArchetype || category;
    // Legacy array guard removed; uniqueness enforced centrally via UniqueSpawnService.

    // ========================================================================
    // [SESSION 110] SINGLE INSTANCE ENFORCEMENT (Registry Check)
    // Prevents duplicate spawning of unique archetypes (Mythic, Prime, Extreme)
    // ========================================================================
    const registryKey = this._getRegistryKey(category, forceArchetype);
    
    // Legacy nodeRegistry duplicate gate removed; unified service handles uniqueness.

    // ========================================================================
    // [SPAWN AUTHORITY] COMPLIANCE GATE: Validate spawn request FIRST
    // ========================================================================
    const spawnPos = position || this.findSafeSpawnLocation();
    const validatedCategory = spawnAuthorityComplianceGate.validateSpawnRequest(category, spawnPos);
    
    // HARD ABORT if validation failed (returns null only on critical errors)
    if (validatedCategory === null) {
      if (__diag) __diag.spawnNodeAbort.compliance_null = (__diag.spawnNodeAbort.compliance_null || 0) + 1;
      this._spawnAbortCounters["COMPLIANCE_BLOCK"] = (this._spawnAbortCounters["COMPLIANCE_BLOCK"] || 0) + 1;
      this._pendingCyclicCandidate = null;
      if (typeof window !== 'undefined') {
        window.__SPAWN_FAILS = window.__SPAWN_FAILS || {};
        const key = category || 'unknown';
        window.__SPAWN_FAILS[key] = (window.__SPAWN_FAILS[key] || 0) + 1;
      }
      return null;  // Clean abort, no node added to scene
    }
    
    // Use validated category (may have been auto-fallback to 'input')
    category = validatedCategory;
    if (requestedCategoryRaw && category !== requestedCategoryRaw && category === 'input') {
      fallbackReason = 'invalid-category';
    }
    
    // ========================================================================
    // [SPAWN AUTHORITY] PRE-VALIDATION: Is this category in EnhancedNodeModel?
    // ========================================================================
    const enhancedNodeModelsSupported = ['input', 'process', 'integration', 'analytics', 'storage', 'control', 'quantum', 'sigma', 'mythic', 'prime', 'error', 'emotional'];
    
    // Double-check: Apply hard fallback if requested category is unknown
    // (compliance gate should have done this, but defense in depth)
    const requestedCategory = (category || '').toLowerCase().trim();
    if (requestedCategory && !enhancedNodeModelsSupported.includes(requestedCategory)) {
      // Unknown or unsupported category - apply hard fallback to 'input'
      category = 'input';
      if (!fallbackReason && requestedCategoryRaw && requestedCategoryRaw !== 'input') {
        fallbackReason = 'invalid-category';
      }
    }
    
    // ========== STEP 1: RESOLVE CATEGORY (SYNC) ==========
    // Default category or weighted random
    if (!category) {
      category = this.getWeightedRandomCategory();
    }
    
    // Ensure category has fallback
    if (!category) {
      category = "input";
      if (!fallbackReason && requestedCategoryRaw && requestedCategoryRaw !== 'input') {
        fallbackReason = 'unknown';
      }
    }

    // Guard: only one fallback INPUT node may exist; reuse existing if present
    const isFallbackSpawn = category === 'input' && requestedCategoryRaw && requestedCategoryRaw !== 'input';
    const fallbackNodeId = (this._fallbackNode && this._fallbackNode.parent)
      ? (this._fallbackNode.userData?.nodeId || this._fallbackNode.userData?.id || this._fallbackNode.uuid)
      : null;
    if (isFallbackSpawn && !this._fallbackWarned) {
      console.warn('[CanonicalCategory] Fallback INPUT node created for unsupported category:', requestedCategoryRaw);
      this._fallbackWarned = true;
    }

    // Single-instance enforcement is centralized in UniqueSpawnService.
    const unifiedUniqueKey = uniqueSpawnService.makeKey({
      category,
      archetype: archetypeKey || category,
      forceArchetype,
      registryKeyMode: isFallbackSpawn ? 'fallback' : 'spawnNode',
    });

    const decision = uniqueSpawnService.check({
      key: unifiedUniqueKey,
      nodes: this.nodes,
      nodeRegistry: this.nodeRegistry,
      fallbackNodeId: isFallbackSpawn ? fallbackNodeId : null,
    });

    if (!decision.allowed) {
      if (__diag) __diag.spawnNodeAbort.unique_denied = (__diag.spawnNodeAbort.unique_denied || 0) + 1;
      this._spawnAbortCounters["UNIQUE_BLOCK"] = (this._spawnAbortCounters["UNIQUE_BLOCK"] || 0) + 1;
      const existingNode =
        (decision.existingNodeId &&
          (this.nodesMap?.get(decision.existingNodeId) ||
            this.nodes.find(
              n =>
                (n.userData?.nodeId || n.userData?.id || n.uuid) === decision.existingNodeId
            ))) ||
        (isFallbackSpawn ? this._fallbackNode : null);

      this._pendingCyclicCandidate = null;
      if (existingNode) return existingNode;
      if (typeof window !== 'undefined') {
        window.__SPAWN_FAILS = window.__SPAWN_FAILS || {};
        const key = category || 'unknown';
        window.__SPAWN_FAILS[key] = (window.__SPAWN_FAILS[key] || 0) + 1;
      }
      return null;
    }
    
    // Canonical category enforcement (Phase 1): prevent INPUT domination when other canonical options exist.
    // Apply only after remap/fallback resolution and only when caller did not explicitly request INPUT.
    const CANONICAL_ENFORCE_SET = ['process', 'integration', 'analytics', 'storage', 'control', 'quantum'];
    const canUseCategory = (cat) => {
      const res = this.validateCategory(cat);
      return res?.valid === true && res.category === cat;
    };
    if (category === 'input' && requestedCategoryRaw && requestedCategoryRaw.toLowerCase() !== 'input' && !isFallbackSpawn) {
      const alternatives = CANONICAL_ENFORCE_SET.filter(canUseCategory);
      if (alternatives.length > 0) {
        const pick = alternatives[Math.floor(Math.random() * alternatives.length)];
        category = pick;
        if (this._inputBypassLogged === undefined) this._inputBypassLogged = false;
        if (!this._inputBypassLogged) {
          console.info('[CanonicalCategory] INPUT bypassed; using canonical category:', pick);
          this._inputBypassLogged = true;
        }
      }
    }

    // ========================================================================
    // [VISUAL HARD GATE] Abort if no canonical visual is registered
    // ========================================================================
    EnhancedNodeModels.ensureRegistryReady?.();
    const registryEntry = EnhancedNodeModels._ALL_NODE_FACTORIES?.[category];
    const hasCanonicalVisual = Array.isArray(registryEntry) && registryEntry.length > 0;
    if (!hasCanonicalVisual) {
      if (shouldLogSpawn() && !this._missingFactoryLogged.has(category)) {
        console.error('[NodeSpawnBlocked]', {
          category,
          reason: 'No canonical visual registered'
        });
        this._missingFactoryLogged.add(category);
      }
      if (__diag) __diag.spawnNodeAbort.missing_visual = (__diag.spawnNodeAbort.missing_visual || 0) + 1;
      this._spawnAbortCounters["INVALID_CATEGORY"] = (this._spawnAbortCounters["INVALID_CATEGORY"] || 0) + 1;
      this._pendingCyclicCandidate = null;
      if (typeof window !== 'undefined') {
        window.__SPAWN_FAILS = window.__SPAWN_FAILS || {};
        const key = category || 'unknown';
        window.__SPAWN_FAILS[key] = (window.__SPAWN_FAILS[key] || 0) + 1;
      }
      return null;
    }

    // ========== STEP 2: FIND SAFE POSITION (SYNC) ==========
    // Position already resolved above

    // ========== STEP 2.5: UNIQUE ARCHETYPE ENFORCEMENT (SYNC) ==========
    const forcedUniqueKey = forceArchetype
      ? this._getUniqueArchetypeKey(category, forceArchetype)
      : null;
    
    // ========== FIX 3: SIMPLE VISUAL REJECTION ==========
    // Reject nodes with simple/fallback visuals (primitive spheres only)
    function isSimpleVisual(node) {
      if (!node) return false;
      let meshCount = 0;
      let hasOnlyPrimitiveSpheres = true;
      let geometryTypes = new Set();
      
      node.traverse(obj => {
        if (obj.isMesh) {
          meshCount++;
          if (obj.geometry) {
            const geoType = obj.geometry.type || obj.geometry.constructor?.name || 'unknown';
            geometryTypes.add(geoType);
            const isPrimitiveSphere = 
              geoType === 'SphereGeometry' ||
              geoType === 'IcosahedronGeometry' ||
              geoType === 'OctahedronGeometry';
            if (!isPrimitiveSphere) {
              hasOnlyPrimitiveSpheres = false;
            }
          }
        }
      });
      
      return meshCount > 0 && (meshCount < 2 || (hasOnlyPrimitiveSpheres && meshCount <= 2));
    }
    
    // ========== STEP 3: CREATE NODE GEOMETRY (SYNC) ==========
    const isSpecial = this.specialNodeTypes.includes(category) || this.newNodeCategories.includes(category);
    let newNode = null;
    try {
      newNode = this.createNode(category, spawnPos, this.nodes.length, isSpecial);
    } catch (e) {
      if (shouldLogSpawn()) {
        console.error('[SpawnVisualError]', {
          category,
          visualCode: undefined,
          error: e
        });
      }
      this._spawnAbortCounters["VISUAL_THROW"] = (this._spawnAbortCounters["VISUAL_THROW"] || 0) + 1;
      this._pendingCyclicCandidate = null;
      return false;
    }
    if (!newNode) {
      // Spawn failed – skip safely
      this._spawnAbortCounters["CREATE_NODE_NULL"] = (this._spawnAbortCounters["CREATE_NODE_NULL"] || 0) + 1;
      if (__diag) __diag.spawnNodeAbort.createNode_null = (__diag.spawnNodeAbort.createNode_null || 0) + 1;
      this._pendingCyclicCandidate = null;
      return false;
    }

    // Ensure visual identity is stamped immediately after factory
    if (newNode.userData) {
      const vc = newNode.userData.visualCode;
      if (vc !== undefined) {
        newNode.userData.visualCode = vc;
        const fn = NODE_VISUAL_REGISTRY[vc]?.factoryName;
        if (fn && !newNode.userData.factoryName) {
          newNode.userData.factoryName = fn;
        }
      }
      // TEMP DEBUG: log boundingSphere radius if present
      const bs = newNode?.geometry?.boundingSphere || newNode?.children?.[0]?.geometry?.boundingSphere;
      if (shouldLogSpawn() && bs) {
        console.warn('[SpawnDebug] boundingSphere', { radius: bs.radius });
      }
    }
    if (false && (newNode.userData?.visualFailed === true || newNode.userData?.__visualFailed === true)) {
      console.warn('[NODE_REJECT] Canonical visual missing - node not spawned');
      // BYPASSED FOR VISUAL-REJECTION-BYPASS PHASE - allow nodes with visual failures
      this._pendingCyclicCandidate = null;
      return null;
    }
    
    // FIX 3: Reject simple visuals at spawn time
    // BYPASSED FOR VISUAL-REJECTION-BYPASS PHASE
    if (false && isSimpleVisual(newNode)) {
      let meshCount = 0;
      let hasOnlyPrimitiveSpheres = true;
      let geometryTypes = new Set();
      
      newNode.traverse(obj => {
        if (obj.isMesh) {
          meshCount++;
          if (obj.geometry) {
            const geoType = obj.geometry.type || obj.geometry.constructor?.name || 'unknown';
            geometryTypes.add(geoType);
            const isPrimitiveSphere = 
              geoType === 'SphereGeometry' ||
              geoType === 'IcosahedronGeometry' ||
              geoType === 'OctahedronGeometry';
            if (!isPrimitiveSphere) {
              hasOnlyPrimitiveSpheres = false;
            }
          }
        }
      });
      
      if (false && meshCount < 2) {
        console.warn('[VisualReject][PrimitiveOnly]', { 
          archetype: newNode.userData?.archetype || category,
          category: category,
          reason: 'MeshCountLessThan2',
          meshCount: meshCount,
          geometryTypes: Array.from(geometryTypes)
        });
        newNode.userData.visualFailed = true;
        console.warn('[NodeSpawnSkipped] Visual build failed, skipping node', newNode.userData?.nodeId || newNode.uuid || null);
        return null;
      }
      
      if (false && hasOnlyPrimitiveSpheres && meshCount <= 2) {
        console.warn('[VisualReject][PrimitiveOnly]', { 
          archetype: newNode.userData?.archetype || category,
          category: category,
          reason: 'PrimitiveSphereOnly',
          meshCount: meshCount,
          geometryTypes: Array.from(geometryTypes)
        });
        newNode.userData.visualFailed = true;
        console.warn('[NodeSpawnSkipped] Visual build failed, skipping node', newNode.userData?.nodeId || newNode.uuid || null);
        return null;
      }
    }
    
    // ========================================================================
    // [SPAWN AUTHORITY] POST-SPAWN VALIDATION: Node must be compliant
    // ========================================================================
    const complianceCheck = spawnAuthorityComplianceGate.validateSpawnedNode(newNode, category);
    if (!complianceCheck.compliant) {
      // Node has violations - log them but continue (some may be auto-fixable)
      // This is advisory rather than fatal
    }
    
    // ========== STEP 4: BASIC USERDATA - SYNC! ==========
    // This is the CRITICAL FIX: Category is set here, NOW, in THIS frame
    if (!newNode.userData) {
      newNode.userData = {};
    }

    // Mark explicit fallback origin for auditability
    if (isFallbackSpawn) {
      newNode.userData.spawnContext = 'fallback';
      newNode.userData.originalCategory = requestedCategoryRaw;
      newNode.userData.isFallback = true;
      newNode.userData.fallbackReason = fallbackReason || 'unknown';
      this.fallbackNode = newNode;
      this._fallbackNode = newNode;
    }
    
    // Primary category assignment (GUARANTEED before HUD/LinkRegistry reads)
    newNode.userData.id = newNode.userData.id || `node-${Date.now()}-${Math.random()}`;
    if (newNode.userData.nodeId && newNode.userData.nodeId !== newNode.userData.id) {
      console.warn('[SpawnIdentity] nodeId diverged; mirroring id');
    }
    newNode.userData.nodeId = newNode.userData.id;
    newNode.userData.category = category;  // <- PRIMARY SOURCE
    newNode.userData.archetype = forceArchetype || category || 'default';
    newNode.userData.archetypeKey = archetypeKey || category;
    
    // ========== REGISTRATION VALIDATION (CRITICAL FOR INTERACTION) ==========
    // Ensure node has required properties for selection system
    let coreMesh = newNode.userData.linkTarget || null;
    if (!coreMesh) {
      // Find suitable core mesh to use as linkTarget
      newNode.traverse(child => {
        if (child.isMesh && !coreMesh && child.userData.isCoreMesh) {
          coreMesh = child;
        }
      });
      if (coreMesh) {
        newNode.userData.linkTarget = coreMesh;
      } else {
        console.warn('[WARN] Node spawned without findable core mesh for linkTarget');
      }
    }

    // Raycast correctness: mark fresh nodes and store explicit core mesh
    newNode.userData.boundingSphere = null;
    newNode.userData._boundsDirty = true;
    newNode.userData.isRaycastTarget = newNode.userData.__nonRenderable === true ? false : true;
    newNode.userData.coreMesh = coreMesh || null;
    
    // Validate all critical tags are set
    if (!newNode.userData.category) {
      newNode.userData.category = 'default';
    }
    if (newNode.userData.isNodeRoot !== true) {
      newNode.userData.isNodeRoot = true;
    }

    // Canonical metrics: ensure present on spawn
    // Phase C.4: legacy metric compatibility applied once at spawn/load
    applyMetricCompatibility([newNode]);
    initNodeMetrics(newNode);

    // PHASE B: Call onNodeSpawn hook after metrics initialization
    onNodeSpawn(newNode);

    // ========== STEP 4.5: EXTREME SPAWN SYSTEM v1.0 - RUNTIME SPAWNING ==========
    // 15% chance to spawn as EXTREME node during runtime
    const EXTREME_SPAWN_CHANCE = 0.15;
    if (Math.random() < EXTREME_SPAWN_CHANCE) {
      newNode.userData.isExtreme = true;
      newNode.userData.extremeArchetype = Math.floor(Math.random() * 12);
      newNode.userData.extremeTier = 1;
    }
    
    // ========== STEP 5: SAFE METRICS DNA (PURE METADATA, SYNC) ==========
    // Attach read-only metrics - NO gameplay side effects
    SafeMetricsDNAIntegration1_0.attachMetrics(newNode, newNode.userData.archetype);
    
    // ========== STEP 6: VISUAL BOOTSTRAP (QUEUED) ==========
    // Queue heavy visual work to spread across frames
    if (this.visualBootstrap && newNode.userData?.__nonRenderable !== true) {
      this._queueSpawnVisual(
        newNode,
        'visual-bootstrap',
        () => this.visualBootstrap.bootstrapNode(
          newNode,
          newNode.userData.category,
          newNode.userData.archetype
        )
      );
    }
    
    // ========== STEP 7: FINALIZE (SCENE ATTACH + REGISTRATION) ==========
    let finalized = null;
    try {
      finalized = this._finalizeSpawnedNode(newNode, category, spawnPos, { registryKey });
    } catch (e) {
      console.error('[SpawnVisualError]', {
        category,
        visualCode: newNode?.userData?.visualCode,
        error: e
      });
      this._spawnAbortCounters["VISUAL_THROW"] = (this._spawnAbortCounters["VISUAL_THROW"] || 0) + 1;
      this._pendingCyclicCandidate = null;
      return false;
    }
    if (!finalized) {
      this._spawnAbortCounters["FINALIZE_NULL"] = (this._spawnAbortCounters["FINALIZE_NULL"] || 0) + 1;
      if (__diag) __diag.spawnNodeAbort.finalize_null = (__diag.spawnNodeAbort.finalize_null || 0) + 1;
      this._pendingCyclicCandidate = null;
      return false;
    }
    const finalizedNode = finalized.node;
    if (window.ATOMA_DEBUG_SPAWN_LOGS) {
      let meshCount = 0;
      let geometryCount = 0;
      finalizedNode.traverse(obj => {
        if (obj.isMesh) {
          meshCount++;
          if (obj.geometry) geometryCount++;
        }
      });
      console.log("[MythicSpawnStats]", {
        category,
        meshCount,
        geometryCount
      });
    }

    const fallbackToken = `instance-${finalizedNode.userData?.nodeId || finalizedNode.userData?.id || Date.now()}-${Math.random().toString(36).slice(2)}`;
    const variantToken = forceArchetype ??
      finalizedNode.userData?.archetypeKey ??
      finalizedNode.userData?.variantId ??
      finalizedNode.userData?.spawnCycle?.visualCode ??
      finalizedNode.userData?.enhancedNodeModelBinding?.visualCode ??
      finalizedNode.userData?.archetype ??
      fallbackToken;
    const normalizedUniqueKey = unifiedUniqueKey ||
      this._getUniqueArchetypeKey(category, `${category}:${variantToken}`);
    finalizedNode.userData.uniqueArchetypeKey = normalizedUniqueKey;

    this._runPostSpawnObservers(finalizedNode, {
      source: 'spawnNode',
      category,
      position: spawnPos,
      archetype: newNode.userData.archetype,
      registryKey,
      uniqueArchetypeKey: finalizedNode.userData.uniqueArchetypeKey,
    });
    if (finalizedNode.userData.uniqueArchetypeKey) {
      const registerNodeId = finalizedNode.userData.nodeId || finalizedNode.userData.id || finalizedNode.uuid;
      uniqueSpawnService.register({
        key: finalizedNode.userData.uniqueArchetypeKey,
        nodeId: registerNodeId,
        meta: {
          category: finalizedNode.userData.category,
          source: 'spawnNode',
        },
      });
    }
    this._commitSpawnCycleSuccess(category);
    
    // NODE SPAWN LOGGER v4.0: Log spawn with visualCode and factoryName
    const ud = finalizedNode.userData || {};
    const nodeId = ud.id || finalizedNode.uuid;
    const visualCode = ud.visualCode;
    const factoryName = ud.factoryName;

    NodeSpawnLogger.logSpawn({
      category,
      visualCode,
      factoryName,
      nodeId,
      source: "AINodes.spawnNode"
    });
    if (__diag) __diag.logged++;

    nodeSpawnRegistry.registerSpawn(newNode, 'AINodes.spawnNode');
    
    // ========== STEP 8: ACTIVATION LOGIC (SYNC) ==========
    // ATOMA NAMING ENGINE 1.0: Assign naming code
    const archetypeToUse = newNode.userData.archetype || category;
    newNode.userData.namingCode = atomaNamingEngine.getNamingCodeForNode(archetypeToUse);
    newNode.userData.namingMeaning = atomaNamingEngine.getReadableMeaning(newNode.userData.namingCode);
    
    // ========== STEP 9: MATERIALIZE ANIMATION ==========
    if (newNode.userData?.__nonRenderable !== true) {
      this.materializeNode(newNode);
    }
    
    // ========== STEP 10: DEFERRED CONNECTIONS ==========
    if (!this.pendingLinkJobs) this.pendingLinkJobs = [];
    this.pendingLinkJobs.push({
      newNodeId: newNode.userData?.nodeId || newNode.userData?.id || newNode.uuid,
      startIndex: 0,
      linksCreated: 0
    });
    
    // Phase D.4: Notify WaveInterferenceEngine of NODE_SPAWN event (DEBUG-gated)
    if (window.CONFIG?.debug?.DEBUG_WAVE_ENGINE && this.waveInterferenceEngine) {
      this.waveInterferenceEngine.requestUpdate('NODE_SPAWN', {
        nodeId: newNode.userData.nodeId,
        nodePosition: newNode.position.clone()
      });
    }

    // ========== STEP 11: DEBUG LOG (OPTIONAL) ==========
    if (this.debugMode) {
      console.log('[AINodes] Spawned node', {
        id: newNode.userData.id,
        category: newNode.userData.category,
        archetype: newNode.userData.archetype,
        hasMetrics: !!newNode.userData.metrics,
        position: `(${spawnPos.x.toFixed(1)}, ${spawnPos.y.toFixed(1)}, ${spawnPos.z.toFixed(1)})`,
      });
    }
    
    // ========================================================================
    // [NODE DEPTH PRESERVATION] ENFORCE HOLOGRAPHIC LAYER PRESERVATION
    // All holographic layers must render after auras and links
    // ========================================================================
    if (newNode.userData?.__nonRenderable !== true) {
      NodeDepthAndHoloPreservationFix.enforceHolographicPreservation(newNode);
    }
    
    return newNode;
  }
  
  /**
   * Holographic materialize animation for new nodes
   * 
   * FIXED (Session 37+): Removed requestAnimationFrame.
   * Now registers effect with orchestrator for central dt-based animation.
   * Caller must ensure effectOrchestrator exists on scene or AINodes instance.
   */
  materializeNode(node) {
    // Root scale is owned by spawn baseline authority; materialization is visual-only.
    const stableRootScale = node.scale.clone();
    node.userData.materializeProgress = 0;
    node.userData.isMaterializing = true;
    
    this.materializingNodes.add(node);
    
    // Register with orchestrator instead of using requestAnimationFrame
    // Orchestrator will drive dt-based animation
    if (this.effectOrchestrator) {
      const effect = {
        id: `materialize-${node.uuid}`,
        type: 'materialization',
        elapsed: 0,
        duration: 0.8, // 800ms in seconds
        node: node,
        
        update: (dt, time) => {
          const progress = Math.min(this.elapsed / this.duration, 1);
          
          // Ease for child-only visual fade.
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          node.scale.copy(stableRootScale);
          
          // Fade in glow layers
          if (node.userData.vfxGlow) {
            node.userData.vfxGlow.material.opacity = 0.25 * easeProgress;
          }
          if (node.userData.vfxHolo) {
            node.userData.vfxHolo.material.opacity = 0.15 * easeProgress;
          }
          if (node.userData.vfxRing) {
            node.userData.vfxRing.material.opacity = 0.6 * easeProgress;
          }
          
          // Particle fade in
          if (node.userData.particles) {
            node.userData.particles.forEach(particle => {
              particle.material.opacity = (0.5 + easeProgress * 0.2) * easeProgress;
            });
          }
          
          node.userData.materializeProgress = progress;
          
          return { done: progress >= 1 };
        },
        
        dispose: () => {
          node.userData.isMaterializing = false;
          this.materializingNodes.delete(node);
        }
      };
      
      this.effectOrchestrator.add(effect);
    } else {
      // Fallback: if orchestrator not available, complete immediately
      console.warn('[AINodes] effectOrchestrator not available, skipping materialization animation');
      node.scale.copy(stableRootScale);
      node.userData.isMaterializing = false;
      this.materializingNodes.delete(node);
    }
  }

  setSpawnMode(mode) {
    this.spawnMode = mode;
  }

  ensureFactoriesReady() {
    const regReady = EnhancedNodeModels.ensureRegistryReady?.() === true;
    const reg = EnhancedNodeModels?._ALL_NODE_FACTORIES || {};
    const totalFactories = Object.values(reg).reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
      0
    );
    const missing = EnhancedNodeModels.__registryMissing || [];

    if (!regReady || totalFactories === 0) {
      this._lastSpawnResult = { ok: false, reason: 'FACTORY_MISSING', category: 'registry' };
      if (!this._factoryBlockLogged) {
        this._factoryBlockLogged = true;
        console.warn('[SPAWN_BLOCK] Factory registry unavailable', {
          totalFactories,
          missingCount: missing.length,
          missingSample: missing.slice(0, 5)
        });
      }
      return false;
    }
    if (!this._factoryReadyLogged) {
      console.log('[SPAWN] factories ready', { totalFactories });
      this._factoryReadyLogged = true;
    }
    return true;
  }

  /**
   * Update spawning system (called every frame)
   * SINGLE AUTHORITY for nextTimeSpawn - only this method writes it
   */
  updateSpawning(currentTime) {
    const cap = this.spawningConfig?.targetPopulation ?? this.getTargetPopulation();
    const nodeCount = this.getNodeCount();
    if (nodeCount >= cap) {
      this.spawnStats.skippedCap++;
      return;
    }
  }

  /**
   * Register link event (triggers potential spawn)
   */
  onLinkCreated() {
    if (this.spawnMode !== 'RUNTIME') return;
    if (!isLinkSpawnEnabled()) {
      if (typeof window !== 'undefined' && window.ATOMA_DEBUG_LINK_SPAWN === true) {
        console.warn('[LINK-SPAWN] blocked (ATOMA_LINK_SPAWN_ENABLED !== true)');
      }
      return;
    }
    // ============================================================
    // [LINK-SPAWN-TRACE] Debug instrumentation
    // ============================================================
    if (window.ATOMA_DEBUG_LINK_SPAWN === true && shouldLogSpawn()) {
      console.warn('[LINK-SPAWN] onLinkCreated called (link -> spawn trigger)', {
        currentTime: Date.now(),
        lastLinkTime: this.spawningConfig.lastLinkTime,
        linkSpawnCooldown: this.spawningConfig.linkSpawnCooldown,
        canSpawn: Date.now() - this.spawningConfig.lastLinkTime > this.spawningConfig.linkSpawnCooldown,
        stack: new Error().stack
      });
    }

    const currentTime = Date.now();
    if (currentTime - this.spawningConfig.lastLinkTime > this.spawningConfig.linkSpawnCooldown) {
      // Occasionally spawn node on link creation (20% chance)
      if (Math.random() < 0.2) {
        const cap = this.spawningConfig?.targetPopulation ?? this.getTargetPopulation();
        if (this.getNodeCount() >= cap) {
          this.spawnStats.skippedCap++;
          return;
        }
        const category = this.getRuntimeSpawnCategoryIntent();
        
        this.spawnNode(category);
        this.spawningConfig.lastLinkTime = currentTime;
        
        // Update last spawn time for analytics
      }
    }
  }
  
  /**
   * Monitor network density and spawn nodes in growth areas
   */
  checkNetworkDensityAndSpawn() {
    // ============================================================
    // [LINK-SPAWN-TRACE] Debug instrumentation
    // ============================================================
    if (window.ATOMA_DEBUG_LINK_SPAWN === true && shouldLogSpawn()) {
      console.warn('[LINK-SPAWN] checkNetworkDensityAndSpawn called', {
        currentNodeCount: this.nodes.length,
        stack: new Error().stack
      });
    }

    const currentNodeCount = this.nodes.length;
    const maxTarget = Math.min(this.spawningConfig.maxNodesTarget, this.getTargetPopulation());

    if (currentNodeCount >= maxTarget) {
      return; // hard cap reached
    }

    const clusterAreas = this.identifyClusterAreas();
    const category = this.getRuntimeSpawnCategoryIntent();
    if (clusterAreas.highDensity.length > 0 && Math.random() < 0.5) {
      this.pendingDensityIntent = category;
    } else {
      this.pendingDensityIntent = category;
    }
  }
  
  /**
   * Identify high and low density cluster areas
   */
  identifyClusterAreas() {
    const gridSize = 50;
    const cellSize = gridSize / 3; // 3x3 grid
    const grid = {};
    
    // Populate grid with node count per cell
    this.nodes.forEach(node => {
      const cellX = Math.floor((node.position.x + gridSize / 2) / cellSize);
      const cellZ = Math.floor((node.position.z + gridSize / 2) / cellSize);
      const key = `${cellX},${cellZ}`;
      grid[key] = (grid[key] || 0) + 1;
    });
    
    // Find high and low density areas
    const areas = { highDensity: [], lowDensity: [] };
    const avgDensity = this.nodes.length / 9; // 3x3 grid
    
    for (let x = 0; x < 3; x++) {
      for (let z = 0; z < 3; z++) {
        const key = `${x},${z}`;
        const count = grid[key] || 0;
        
        const centerX = (x * cellSize) + (cellSize / 2) - (gridSize / 2);
        const centerZ = (z * cellSize) + (cellSize / 2) - (gridSize / 2);
        const position = new THREE.Vector3(centerX, 3, centerZ);
        
        if (count > avgDensity * 1.5) {
          areas.highDensity.push(position);
        } else if (count < avgDensity * 0.5) {
          areas.lowDensity.push(position);
        }
      }
    }
    
    return areas;
  }
  
  dispose() {
    this.nodes.forEach(node => {
      this.releaseUniqueSpawn(node);
      this.scene.remove(node);
      node.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        // DISPOSE SAFETY: Skip shared materials (marked with userData.isShared = true)
        // Shared materials are cached in v2 builders (QUANTUM_V2_MATERIALS, etc.)
        // and must not be disposed - they persist for the lifetime of the application
        if (child.material && !child.material.userData?.isShared) {
          child.material.dispose();
        }
      });
    });
    
    this.connections.forEach(connection => {
      this.scene.remove(connection);
      connection.geometry.dispose();
      connection.material.dispose();
    });
    
    this.nodes = [];
    this.connections = [];
    this.activeNodes.clear();
    this.materializingNodes.clear();
    
    // [SESSION 110] Clear registry
    this.nodeRegistry.clear();
    this.uniqueSpawnRegistry.clear();
    uniqueSpawnService.metaByNodeId?.clear?.();
    this.postSpawnObservers.clear();
  }
  
  // ========== SPECIALIZED SPAWN METHODS (EXTENDED SPAWN SYSTEM 1.0) ==========
  
  /**
   * Spawn a MYTHIC node (ultra-rare: 0.5-1.5% naturally)
   */
  spawnMythicNode(position = null) {
    return this.spawnNode('mythic', position, 'MYTHIC-CEREMONIAL');
  }
  
  /**
   * Spawn a PRIME node (rare: 2-3% naturally)
   */
  spawnPrimeNode(position = null) {
    return this.spawnNode('prime', position, 'PRIME-PERFECT');
  }
  
  /**
   * Spawn an ERROR node (unstable: 0.5-1.5% naturally)
   */
  spawnErrorNode(position = null) {
    return this.spawnNode('error', position, 'ERROR-ANOMALY');
  }
  
  /**
   * Spawn an EXTREME archetype node (medium-rare: 4-6% naturally)
   */
  spawnExtremeNode(position = null) {
    const extremeKeys = Object.keys(this.extremeArchetypes).filter(k => k.startsWith('EXTREME-'));
    const archetype = extremeKeys[Math.floor(Math.random() * extremeKeys.length)];
    const baseCategory = this.extremeArchetypes[archetype];
    return this.spawnNode(baseCategory, position, archetype);
  }
  
  /**
   * Spawn specific archetype by name (e.g., 'CORE-HARMONIC-RESONANT')
   */
  spawnArchetype(archetypeName, position = null) {
    if (!this.extremeArchetypes[archetypeName]) {
      console.warn(`Unknown archetype: ${archetypeName}`);
      return null;
    }
    const baseCategory = this.extremeArchetypes[archetypeName];
    return this.spawnNode(baseCategory, position, archetypeName);
  }
  
  /**
   * Get statistics on spawned archetypes
   */
  getArchetypeStats() {
    const stats = {
      total: this.nodes.length,
      byCategory: {},
      byArchetype: {},
      rarity: {
        mythic: 0,
        prime: 0,
        error: 0,
        extreme: 0
      }
    };
    
    this.nodes.forEach(node => {
      const cat = node.userData.category;
      stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
      
      if (node.userData.archetype) {
        const arch = node.userData.archetype;
        stats.byArchetype[arch] = (stats.byArchetype[arch] || 0) + 1;
        
        // Track rarity
        if (arch.startsWith('MYTHIC')) stats.rarity.mythic++;
        if (arch.startsWith('PRIME')) stats.rarity.prime++;
        if (arch.startsWith('ERROR')) stats.rarity.error++;
        if (arch.startsWith('EXTREME')) stats.rarity.extreme++;
      }
    });
    
    return stats;
  }
  
  /**
   * Print archetype statistics to console
   */
  printArchetypeStats() {
    const stats = this.getArchetypeStats();
    console.log(`
      🧬 ARCHETYPE STATISTICS
      ────────────────────────────────────
      Total Nodes: ${stats.total}
      
      By Category:`, stats.byCategory, `
      
      Rarity Distribution:
        MYTHIC: ${stats.rarity.mythic} (${((stats.rarity.mythic / stats.total) * 100).toFixed(1)}%)
        PRIME:  ${stats.rarity.prime} (${((stats.rarity.prime / stats.total) * 100).toFixed(1)}%)
        ERROR:  ${stats.rarity.error} (${((stats.rarity.error / stats.total) * 100).toFixed(1)}%)
        EXTREME: ${stats.rarity.extreme} (${((stats.rarity.extreme / stats.total) * 100).toFixed(1)}%)
    `);
  }

  /**
   * Initialize profiling storage when enabled
   * @private
   */
  _ensureProfilingStore() {
    if (this._profileStore) return;
    this._profileStore = { sections: {} };
    if (typeof window !== 'undefined') {
      window.__atomaProfile = window.__atomaProfile || {};
      window.__atomaProfile.aiNodes = this._profileStore;
    }
  }

  /**
   * Record a profiling sample for a section
   * @param {string} name
   * @param {number} durationMs
   * @private
   */
  _recordProfileSample(name, durationMs) {
    if (!this._profileStore || !name) return;
    const sections = this._profileStore.sections;
    const entry = sections[name] || (sections[name] = { count: 0, total: 0, max: 0, avg: 0 });
    entry.count += 1;
    entry.total += durationMs;
    if (durationMs > entry.max) entry.max = durationMs;
    entry.avg = entry.total / entry.count;
  }

  /**
   * Ensure all nodes are seeded into the activity model as ACTIVE
   * @private
   */
  _ensureActivityModelSeeded() {
    for (const node of this.nodes) {
      if (!this._activityState.has(node)) {
        this._setNodeActivityState(node, this.activityStateEnum.ACTIVE);
      }
    }
    this._refreshActivityCounters();
  }

  /**
   * Move node to a target activity state (exclusive membership)
   * @private
   */
  _setNodeActivityState(node, targetState) {
    if (!node || !targetState) return;
    const pools = this._activityPools;
    pools.active.delete(node);
    pools.semiActive.delete(node);
    pools.dormant.delete(node);

    this._activityState.set(node, targetState);
    if (targetState === this.activityStateEnum.ACTIVE) {
      pools.active.add(node);
    } else if (targetState === this.activityStateEnum.SEMI_ACTIVE) {
      pools.semiActive.add(node);
    } else {
      pools.dormant.add(node);
    }
  }

  /**
   * Update debug counters for activity pools
   * @private
   */
  _refreshActivityCounters() {
    this.activityCounters.active = this._activityPools.active.size;
    this.activityCounters.semiActive = this._activityPools.semiActive.size;
    this.activityCounters.dormant = this._activityPools.dormant.size;
  }
}

// Debug helper: dump aiNodes profiling table when profiling is enabled
if (typeof window !== 'undefined') {
  window.dumpAiNodesProfile = function() {
    const sections = window.__atomaProfile?.aiNodes?.sections || {};
    const rows = Object.entries(sections).map(([section, data]) => ({
      section,
      avgMs: data.avg,
      maxMs: data.max,
      count: data.count
    }));
    console.table(rows);
    return rows;
  };
}
