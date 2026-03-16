// === RAYCAST COST INSTRUMENTATION (AUDIT MODE) ===
// Guarded by window.DEBUG_RAYCAST_COST
// No behavior changes when disabled
// IMPORTANT:
// This instrumentation MUST NOT:
// - change raycast targets
// - alter call frequency
// - mutate scene / nodes / proxies
// Phase B.6 – NodeTargeting rename (no behavior change)

import * as THREE from 'three';
import { CONFIG } from './config.js';
import { safeComputeBounds, getSafeBoundingSphere } from './src/three/GeometryBoundsSafe.js';
import { getLinkSynergy, getLinkCorruption } from './SemanticMetricAdapter.js';

// SAFE SOFT REVERT: Use legacy bounds path to restore original visual behavior
// When true: Use simple THREE.js Box3.setFromObject (no sanitization, no unions, no fallbacks)
// When false: Use new safe bounds logic with NaN/Infinity protection
// Legacy bounds path preserved to prevent visual hierarchy corruption.
const USE_LEGACY_NODE_BOUNDS = true;

import { NeonLinkVisuals, setupLinkVisualLanguageDebugAPI } from './NeonLinkVisuals.js';
import { createNeonEdgeGlowMaterial, updateNeonEdgeGlowTime } from './shaders/NeonEdgeGlowShader.js';
import NetworkStateAIReasoner, { buildNetworkStateSnapshot } from './NetworkStateAIReasoner.js';
import { linkEventOrderValidator } from './LinkEventOrderValidator.js';
import { LinkPrioritySystem } from './LinkPrioritySystem.js';
import { DynamicLinkThicknessSystem } from './_DynamicLinkThicknessSystem.js';
import { filterRaycastIntersections } from './CanonicalInteractionFilter.js';
import { 
  applyFinalNodeVisualState, 
  NodeVisualStateBinder, 
  updateNodeSynergyVisuals,
  applyCoreSynergyGlowScaling,
  removeCoreSynergyGlow
} from './NodeVisualStateBinder.js';
import { createFresnelAura } from './FresnelAuraIntegrationPatch.js';
import { SelectedRingSystem } from './src/visual/SelectedRingSystem_v1.js';
import {
  initializeLinkSynergyColor,
  updateLinkSynergyColor,
  updateLinkColorTransition,
  initializeParticleSynergyColors,
  updateParticleColorTransition,
  updateParticleSynergyOpacity,
  updateParticleSynergyEmissive,
  updateParticleCorruptionSpeed
} from './LinkSynergyColorTransition.js';
import { NodeDepthAndHoloPreservationFix } from './NodeDepthAndHoloPreservationFix.js';
import { AnimatedLinkFlow, setupAnimatedLinkFlowConsoleAPI } from './AnimatedLinkFlow.js';
import { LinkRendererConduit } from './LinkRendererConduit.js';
import { LinkEmissionPulsingSystem } from './LinkEmissionPulsingSystem.js';
import { LinkStateVisualLanguageIntegration } from './LinkStateVisualLanguageIntegration.js';
import { LinkEventVisualCoordinator_v1 } from './LinkEventVisualCoordinator_v1.js';
import { 
  UndoRedoSystem, 
  CreateLinkCommand, 
  RemoveLinkCommand, 
  BulkCreateLinksCommand, 
  BulkRemoveLinksCommand 
} from './UndoRedoSystem.js';
import { onLinkCreated, onLinkRemoved, applyMetricImpulse } from './src/metrics/NodeMetricEngine.js';
import { EnhancedNodeModels } from './EnhancedNodeModels.js';
import { captureNodeCoreState, restoreNodeCoreState } from './NodeCoreMaterialAuthority.js';
import { tagAllowedSphere, clampSphere } from './VisualSpherePolicy.js';

function ensureUserData(obj) {
  if (!obj) return {};
  if (obj.userData && typeof obj.userData === 'object') return obj.userData;
  try { Object.defineProperty(obj, 'userData', { value: {}, writable: true, configurable: true }); return obj.userData; }
  catch (e) { try { return obj.userData || {}; } catch (e2) { return {}; } }
}

// Local material patch helper (soft owner tagging for debugging)
function applyMaterialPatch(material, patch = {}) {
  if (!material) return;
  material.userData = material.userData || {};
  const owners = material.userData._propOwner || (material.userData._propOwner = {});
  const owner = patch.owner || 'nls';
  const ensureOwner = (prop) => {
    const current = owners[prop];
    if (current && current !== owner && typeof window !== 'undefined' && window.__DEBUG_LINK_MATERIAL_OWNER__ === true) {
      console.warn('[LinkMaterialOwner]', prop, 'current:', current, 'new:', owner, material.uuid);
    }
    owners[prop] = owners[prop] || owner;
  };
  if (patch.color instanceof THREE.Color && material.color) {
    ensureOwner('color');
    material.color.copy(patch.color);
  }
  if (typeof patch.opacity === 'number' && material.opacity !== undefined) {
    ensureOwner('opacity');
    material.opacity = patch.opacity;
  }
  if (typeof patch.linewidth === 'number' && material.linewidth !== undefined) {
    ensureOwner('linewidth');
    material.linewidth = patch.linewidth;
  }
  if (patch.emissive instanceof THREE.Color && material.emissive) {
    ensureOwner('emissive');
    material.emissive.copy(patch.emissive);
  }
  if (typeof patch.emissiveIntensity === 'number' && material.emissiveIntensity !== undefined) {
    ensureOwner('emissiveIntensity');
    material.emissiveIntensity = patch.emissiveIntensity;
  }
}

const _binderWarned = { invalid: false, noId: false, nonRenderable: false };
function _validateBinderNode(node) {
  // Validate: must be THREE.Object3D with userData and nodeId
  if (!node || node.isObject3D !== true || !node.userData) {
    if (!_binderWarned.invalid) {
      console.warn('[NodeLinkingSystem] Invalid node passed to visual binder', {
        typeof: typeof node,
        hasObject3D: node && typeof node.isObject3D === 'boolean',
        constructor: node?.constructor?.name || 'unknown'
      });
      _binderWarned.invalid = true;
    }
    return false;
  }
  if (node.userData.__nonRenderable === true) {
    if (!_binderWarned.nonRenderable) {
      console.warn('[NodeLinkingSystem] Non-renderable node skipped for visual binder');
      _binderWarned.nonRenderable = true;
    }
    return false;
  }
  if (!node.userData.nodeId && !node.userData.id) {
    if (!_binderWarned.noId) {
      console.warn('[NodeLinkingSystem] Node without id skipped for visual binder');
      _binderWarned.noId = true;
    }
    return false;
  }
  return true;
}

// Debug-only raycast cost instrumentation (opt-in via window.DEBUG_RAYCAST_COST)
const RAYCAST_COST_LOG_INTERVAL_MS = 5000;
const _proxyCandidateScratch = [];
const _scratchVecA = new THREE.Vector3();
const _scratchVecB = new THREE.Vector3();
const _scratchVecC = new THREE.Vector3();
const _scratchFrustum = new THREE.Vector3();
const NODE_TARGETING_MAX_DISTANCE = 8;
const NODE_TARGETING_MAX_DISTANCE_SQ = NODE_TARGETING_MAX_DISTANCE * NODE_TARGETING_MAX_DISTANCE;
const NODE_TARGETING_NDC_RADIUS = 0.6;
const _nodeTargetingWorldPos = new THREE.Vector3();
const _nodeTargetingProjected = new THREE.Vector3();
const _nodeTargetingCandidateScratch = [];
function getRaycastCostState() {
  if (typeof window === 'undefined') return null;
  if (window.DEBUG_RAYCAST_COST === undefined) {
    window.DEBUG_RAYCAST_COST = false;
  }
  if (!window.__raycastCost) {
    window.__raycastCost = {
      enabled: false,
      startTs: (typeof performance !== 'undefined' ? performance.now() : Date.now()),
      lastLogTs: 0,
      categories: {},   // proxy_raycast, visual_raycast, resolve_hit, post_process
      callsites: {},    // hover-loop, click, box-select, crosshair
      interval: { start: (typeof performance !== 'undefined' ? performance.now() : Date.now()), categories: {}, callsites: {} }
    };
  }
  window.__raycastCost.enabled = window.DEBUG_RAYCAST_COST === true;
  return window.__raycastCost;
}

function recordRaycastCost(category, durationMs, callsite, meta = {}) {
  const state = getRaycastCostState();
  if (!state || !state.enabled) return;

  if (!state.categories[category]) {
    state.categories[category] = { count: 0, total: 0, max: 0, samples: [] };
  }
  const bucket = state.categories[category];
  bucket.count += 1;
  bucket.total += durationMs;
  bucket.max = Math.max(bucket.max, durationMs);
  bucket.samples.push(durationMs);
  if (bucket.samples.length > 2000) bucket.samples.shift(); // sliding window

  if (callsite) {
    if (!state.callsites[callsite]) {
      state.callsites[callsite] = { count: 0, paths: {} };
    }
    state.callsites[callsite].count += 1;
    if (meta.path) {
      state.callsites[callsite].paths[meta.path] = (state.callsites[callsite].paths[meta.path] || 0) + 1;
    }
  }

  if (state.interval) {
    state.interval.categories[category] = (state.interval.categories[category] || 0) + 1;
    if (callsite) {
      state.interval.callsites[callsite] = (state.interval.callsites[callsite] || 0) + 1;
    }
  }
}

function computePercentiles(samples) {
  if (!samples || samples.length === 0) return { avg: 0, p50: 0, p95: 0, max: 0 };
  const sorted = [...samples].sort((a, b) => a - b);
  const len = sorted.length;
  const idx50 = Math.floor(0.5 * (len - 1));
  const idx95 = Math.floor(0.95 * (len - 1));
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  return {
    avg: sum / len,
    p50: sorted[idx50],
    p95: sorted[idx95],
    max: sorted[len - 1]
  };
}

function logRaycastCostSummary(renderer, aiNodes) {
  const state = getRaycastCostState();
  if (!state || !state.enabled) return;
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (state.lastLogTs && now - state.lastLogTs < RAYCAST_COST_LOG_INTERVAL_MS) return;

  const intervalMs = now - (state.interval?.start || now);
  const intervalSec = intervalMs / 1000 || 1;
  const callsPerSec = {};
  for (const [name, count] of Object.entries(state.interval?.callsites || {})) {
    callsPerSec[name] = count / intervalSec;
  }

  const statsPerCategory = {};
  for (const [cat, data] of Object.entries(state.categories)) {
    statsPerCategory[cat] = computePercentiles(data.samples);
    statsPerCategory[cat].count = data.count;
  }

  const rendererInfo = renderer?.info ? {
    calls: renderer.info.render?.calls ?? 0,
    triangles: renderer.info.render?.triangles ?? 0,
    geometries: renderer.info.memory?.geometries ?? 0,
    textures: renderer.info.memory?.textures ?? 0
  } : null;

  const nodeCount = aiNodes?.nodes?.length || 0;
  const proxyCount = (typeof window !== 'undefined' && window.hitProxySystem?.registry)
    ? window.hitProxySystem.registry.getAllProxies().length
    : 0;

  console.log('[RaycastCost] window', {
    windowSec: intervalSec.toFixed(2),
    callsPerSec,
    statsPerCategory,
    nodeCount,
    proxyCount,
    rendererInfo
  });

  state.interval = { start: now, categories: {}, callsites: {} };
  state.lastLogTs = now;
}

/**
 * // PRIORITY AUTHORITY
// This system is the sole writer of link.priority.*
 * Node Linking System - Advanced interactive connection system with auto-predict
 * Animated Bézier curves, traffic simulation, special multi-output nodes
 * Enhanced with professional neon visuals and effect system
 * [Session 144+] Undo/Redo support for all linking operations
 */// TODO(P2.2): route all priority updates via authority API

// ===== VISUAL MUTATION SAFETY UTILITIES =====
// These utilities prevent crashes from unsafe visual mutations
// Visual references may be locked by authority system - mutations must be safe
const visualMutationGuards = {
  // Safely set material opacity (required by authority locks)
  setMaterialOpacity(material, value) {
    if (material && typeof material === 'object' && 'opacity' in material) {
      material.opacity = value;
      return true;
    }
    return false;
  },
  
  // Safely set material color (required by authority locks)
  setMaterialColor(material, colorValue) {
    if (material && typeof material === 'object' && material.color) {
      if (typeof colorValue === 'number') {
        material.color.setHex(colorValue);
      } else {
        material.color.copy(colorValue);
      }
      return true;
    }
    return false;
  },
  
  // Safely set mesh visibility (required by authority locks)
  setMeshVisible(mesh, visible) {
    if (mesh && typeof mesh === 'object' && 'visible' in mesh) {
      mesh.visible = visible;
      return true;
    }
    return false;
  },
  
  // Safely set mesh scale (required by authority locks)
  setMeshScale(mesh, scale) {
    if (mesh && typeof mesh === 'object' && mesh.scale) {
      mesh.scale.setScalar(scale);
      return true;
    }
    return false;
  }
};
function hasFinitePositions(geometry) {
  const arr = geometry?.attributes?.position?.array;
  if (!arr) return false;
  for (let i = 0; i < arr.length; i++) {
    if (!Number.isFinite(arr[i])) return false;
  }
  return true;
}


export class NodeLinkingSystem {
  constructor(scene, camera, renderer, aiNodes) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.aiNodes = aiNodes;
    this.linkRoot = null;
    
    // Phase B.4 – event-gated (no visual change)
    this.linksDirty = true;
    this.nodesDirty = true;
    this.cameraDirty = true;
    this._lastDirtyCameraPos = new THREE.Vector3();
    this._lastDirtyCameraQuat = new THREE.Quaternion();
    if (this.camera) {
      this._lastDirtyCameraPos.copy(this.camera.position);
      this._lastDirtyCameraQuat.copy(this.camera.quaternion);
    }
    this.raycastConfig = {
      enabled: true,                   // Phase B.5 – event-gated (no visual change)
      maxProxyDistance: 6000,          // generous; only trims extreme outliers
      screenMargin: 0.2                // allow slight off-screen proxies
    };
    this._raycastProfileState = {
      frame: 0,
      accum: null
    };
    
    // [Audit 6.2] World transition safety flag
    this.worldReady = true;  // Set to false during world resets
    
    // [Patch 3.1] Idempotent dispose flag (prevents multiple dispose calls)
    this._disposed = false;
    
    // [Stab2] Internal map for stable link lookup: nodeId → [links]
    this.nodeIdToLinks = new Map();
    
    // [LinkIndex v3.0] Persistent link index: nodeId → [links]
    this.linksByNode = new Map();
    
    // [Patch 3.2 HYBRID] Mini cache layer for HUD instant reads
    this._linkCategoryCache = new Map();  // nodeId → Set<category>
    this._cacheValidUntil = 0;  // Timestamp for cache expiration
    
    // [Patch 3.2 HYBRID] Sync tracking: ensures index ↔ runtime consistency
    this._syncState = {
      linkCount: 0,  // Expected total links
      lastSyncTime: Date.now(),
      mismatchDetected: false
    };
    
    // [Patch 3.2 HYBRID] Anti-corruption detection
    this._deadLinkDetector = {
      orphanedLinks: [],
      ghostLinks: [],
      lastCleanTime: Date.now()
    };
    // Simulation maintenance accumulators (10 Hz layer)
    this._simulationSyncAccum = 0;
    this._simulationSynergyAccum = 0;

    // When true, conduit visuals are driven externally (FrameScheduler) and
    // internal per-link conduit updates are skipped to avoid double-execution.
    this.conduitManagedByFrameScheduler = false;

    // Link curve/bead audit (throttled)
    this._linkCurveAuditLastLog = 0;
    this._linkCurveAuditLastLog = 0;
    this._linkCurveAuditPrev = {
      total: 0, missingGroup: 0, missingCurve: 0, missingBeads: 0, missingSparks: 0
    };
    
    this.links = [];
    // Per-frame link metrics cache
    this._linkMetricsCache = new Map();
    this._linkMetricsFrame = 0;
    this.ghostLinks = [];  // Predicted connections
    this.activeLink = null;
    this.selectedNode = null;  // Node A for click-to-link (now "Primary Node")
    this.selectedNodeHighlight = null;  // Cyan glow mesh
    // Collapse requests are meaning-only; structural unlink must be executed elsewhere
    this.pendingCollapseRequests = [];
    // Recovery candidates collected after controlled collapse; meaning-only until explicitly requested
    this.recoveryCandidates = [];
    this.lastRecoveryDecisions = new Map(); // candidateId -> decision
    // AI advisory report storage (read-only, debug/QA only)
    this._lastAIReport = null;
    // Collapse arbiter decisions (meaning-only; no structural effects)
    this.lastCollapseDecisions = new Map(); // linkId -> decision object
    
    // [Primary Node System] Persistent selection state
    this.primaryNode = null;  // Persistent Primary Node reference
    
    // [Multi-Select System] Ctrl+Click multi-selection for bulk operations
    this.multiSelectMode = false;  // True when multiple nodes are selected
    this.selectedNodes = new Set();  // Set of selected node references
    this.multiSelectHighlights = new Map();  // node → highlight mesh
    this.selectionPulseAnimations = new Map();  // Track pulse animations by node
    this.deferLinkVisuals = false; // Build link visuals immediately (avoid missed conduit init)
    
    // [Box Selection System] Drag-to-select area-based multi-selection
    this.boxSelectState = {
      isActive: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      dragThreshold: 5,  // Minimum pixels to distinguish from click
      visualBox: null,   // DOM element for selection box
      startedOnEmpty: false,  // Track if drag started on empty space
      suppressNextClick: false,  // Prevent post-drag click handler from overriding box select
      lmbDown: false,
      holdStartTime: 0,
      holdDelayMs: 200,
      pointerLockDrag: false
    };
    this._boxSelectCameraLookPause = {
      active: false,
      prevEnabled: null
    };
    
    // [Double-click Detection] Timing state for click discrimination
    this.clickState = {
      lastClickTime: 0,
      lastClickedNode: null,
      singleClickTimer: null,
      DOUBLE_CLICK_THRESHOLD: 300  // ms
    };
    
    // [RMB Hold Detection] Right-mouse-button hold state for link removal
    this.rmbState = {
      isHolding: false,
      holdStartTime: 0,
      holdThresholdMet: false,
      hoverTarget: null,
      HOLD_THRESHOLD: 350  // ms
    };
    
    // [Metrics Integration v1.0] Link ID counter
    this._linkIdCounter = 0;
    
    // Selection callbacks (for UISelectedHUD and other listeners)
    this.onSelectCallbacks = [];
    this.onDeselectCallbacks = [];
    this.onHoverStartCallbacks = [];
    this.onHoverEndCallbacks = [];
    
    // Link creation/removal callbacks (for UISelectedHUD link event notification)
    this.onLinkCreatedCallbacks = [];
    this.onLinkRemovedCallbacks = [];
    
    this.raycaster = new THREE.Raycaster();
    // Align raycaster layer with hit-proxy interaction layer (default 10)
    this.proxyLayer = (typeof window !== 'undefined' && window.hitProxySystem?.layer?.interactionLayer) || 10;
    this.raycaster.layers.set(this.proxyLayer);
    this.mouse = new THREE.Vector2();
    
    // [SESSION 110] Camera Motion Gating for Smoothness
    // Decouples camera updates from heavy raycasting to eliminate stutter
    this.lastCameraPos = new THREE.Vector3();
    this.lastCameraQuat = new THREE.Quaternion();
    this.isCameraMoving = false;
    this.lastRaycastTime = 0;
    this.lastCrosshairRaycastTime = 0;
    this.lastCrosshairCameraPos = new THREE.Vector3();
    this.lastCrosshairCameraQuat = new THREE.Quaternion();
    this.crosshairRaycastStats = { executed: 0, skipped: 0 };
    
    // Visual system
    this.visuals = new NeonLinkVisuals(scene, camera);

    // [BRAIDED CONDUIT SYSTEM]
    this.conduitRenderer = new LinkRendererConduit(scene, this, camera, this.frameScheduler || null);
    if (typeof window !== 'undefined') {
      window.linkingSystem = this;
    }
    console.error('[PicDiag] NodeLinkingSystem constructed');

    // PicDiag heartbeat: log once after init and attempt a pictogram tick
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        console.info('[PicDiag] heartbeat', {
          worldReady: this.worldReady,
          links: this.links?.length || 0,
          conduit: !!this.conduitRenderer,
          pictogramSystem: !!this.conduitRenderer?.pictogramSystem
        });
        try {
          this.conduitRenderer?.updatePictograms?.(0, performance.now());
        } catch (err) {
          console.error('[PicDiag] heartbeat pictogram tick error', err);
        }
      }, 1500);
    }

    // [LINK STATE VISUAL LANGUAGE]
    this.linkStateVisualLanguage = new LinkStateVisualLanguageIntegration(this, { debugMode: false });

    // Register callback for new link creation
    if (this.onLinkCreatedCallbacks) {
      this.onLinkCreatedCallbacks.push((link) => {
        if (this.linkStateVisualLanguage) {
          this.linkStateVisualLanguage.registerLink(link);
        }
      });
    }

    // Register callback for link removal
    if (this.onLinkRemovedCallbacks) {
      this.onLinkRemovedCallbacks.push((link) => {
        if (this.linkStateVisualLanguage) {
          this.linkStateVisualLanguage.unregisterLink(link);
        }
      });
    }

    // Initialize auras for existing links (if links already exist)
    if (this.links && this.linkStateVisualLanguage) {
      setTimeout(() => {
        for (const link of this.links) {
          if (this.linkStateVisualLanguage) {
            this.linkStateVisualLanguage.registerLink(link);
          }
        }
        if (this.linkStateVisualLanguage.debugMode) {
          console.log('[NodeLinkingSystem] LinkStateVisualLanguage initialized for', this.links.length, 'existing links');
        }
      }, 100); // Small delay to ensure linking system is fully initialized
    }

    // [Dynamic Thickness v1.0] Real-time traffic-based link thickness
    this.thicknessSystem = new DynamicLinkThicknessSystem(scene, this.visuals);
    this.visualModules = {
      thickness: true,
      flow: true,
      beads: true,
      sparks: true,
      trails: true,
      corruptionFX: true,
      healingFX: true,
      streaks: true,
      aura: true
    };
    
    // [Session 112] Animated Link Flow - Data visualization between nodes
    this.flowSystem = new AnimatedLinkFlow(scene, camera);
    
    // [Phase 2] Link Event Visual Coordinator - Orchestrates visual suppression during events
    this.eventCoordinator = new LinkEventVisualCoordinator_v1();
    
    // [Phase 2] Link Category Transition System - Handles creation animations
    
    // Effects tracking
    this.activeEffects = [];
    this.multiOutputGlows = new Map();
    
    // Interaction distance configuration (4x increase from default)
    this.interactionConfig = {
      // Default raycaster far plane: ~1000 units
      // New extended distance for long-range node linking: 4000 units
      maxLinkingDistance: 4000,
      // Selection buffer for easier node picking (spherecast radius)
      selectionBufferRadius: 0.3,
      // Per-frame update frequency for hover detection
      hoverUpdateFrequency: 1 // Every frame
    };
    
    // Node hover tracking for selection glow
    this.hoveredNodeForSelection = null;
    this.nodeSelectionGlows = new Map(); // Track selection glow meshes per node
    this.hoverGlowEnabled = CONFIG.visuals?.enableNodeHoverGlow === true;

    // Selected ring system (30 Hz visual layer)
    const frameScheduler = (typeof window !== 'undefined' && window.frameScheduler) ? window.frameScheduler : null;
    this.selectedRingSystem = new SelectedRingSystem(this.scene, frameScheduler, VisualHierarchyRegistry);
    
    // [SESSION 51] Visual State Binder - Ensures nodes apply final visuals after linking
    this.visualStateBinder = new NodeVisualStateBinder({ autoRepair: true, verbose: false });
    this.visualStateBinder.addStateChangeCallback((node, oldState, newState, success) => {
      if (success && newState === 'LINKED') {
        console.log(`[NodeLinkingSystem] ✅ Applied final visuals to node ${node.userData?.nodeId}`);
      }
    });
    
    // Traffic simulation
    this.trafficSimulation = {
      enabled: true,
      baseTraffic: 0.3,
      trafficVariation: 0.7
    };
    
    // Special node types that support multiple outputs
    this.specialNodeTypes = {
      'sigma': { maxOutputs: 4, glow: [0xff00ff, 0x00ffff] },
      'quantum': { maxOutputs: 3, glow: [0x00ffff, 0xff00ff] },
      'emotional': { maxOutputs: 2, glow: [0xff8800, 0xff00ff] }
    };
    
    // [Session 144+] Undo/Redo system for reversible operations
    this.undoRedo = new UndoRedoSystem(this, {
      maxHistorySize: 50,
      verbose: false
    });
    
    this.setupEventListeners();
  }

  // Phase B.5 – Raycast candidate filter (coarse frustum + distance)
  _filterRaycastCandidates(objects) {
    if (window.__DBG_RAYCAST_USE_FAST_PATH === false) return objects;
    if (!this.raycastConfig?.enabled || !Array.isArray(objects)) return objects;
    const margin = this.raycastConfig.screenMargin ?? 0.2;
    const maxDist = this.raycastConfig.maxProxyDistance ?? Infinity;
    const maxDistSq = maxDist * maxDist;
    const camera = this.camera;
    _proxyCandidateScratch.length = 0;

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if (!obj) continue;
      obj.getWorldPosition(_scratchVecA);

      // Distance gate (camera origin)
      if (camera) {
        const distSq = camera.position.distanceToSquared(_scratchVecA);
        if (distSq > maxDistSq) continue;
      }

      // Screen-space gate (cheap NDC bounds check)
      if (camera) {
        _scratchFrustum.copy(_scratchVecA).project(camera);
        if (Math.abs(_scratchFrustum.x) > 1 + margin && Math.abs(_scratchFrustum.y) > 1 + margin) {
          continue;
        }
      }

      _proxyCandidateScratch.push(obj);
    }

    return _proxyCandidateScratch.length > 0 ? _proxyCandidateScratch : objects;
  }

  _nodeWithinTargetingBounds(node) {
    if (!node || !this.camera) return true;

    node.getWorldPosition(_nodeTargetingWorldPos);
    const distSq = this.camera.position.distanceToSquared(_nodeTargetingWorldPos);
    if (distSq > NODE_TARGETING_MAX_DISTANCE_SQ) {
      return false;
    }

    _nodeTargetingProjected.copy(_nodeTargetingWorldPos).project(this.camera);
    if (Math.abs(_nodeTargetingProjected.x) > NODE_TARGETING_NDC_RADIUS ||
        Math.abs(_nodeTargetingProjected.y) > NODE_TARGETING_NDC_RADIUS) {
      return false;
    }
    if (_nodeTargetingProjected.z < 0 || _nodeTargetingProjected.z > 1) {
      return false;
    }

    return true;
  }

  _filterNodeTargetingProxies(proxies) {
    if (!Array.isArray(proxies) || proxies.length === 0 || !this.camera) {
      return proxies;
    }

    _nodeTargetingCandidateScratch.length = 0;
    for (const proxy of proxies) {
      if (!proxy) continue;
      const nodeId = proxy.userData?.targetNodeId || proxy.userData?.nodeId;

      if (!nodeId) {
        _nodeTargetingCandidateScratch.push(proxy);
        continue;
      }

      const node = this._findNodeById(nodeId);
      if (!node) {
        _nodeTargetingCandidateScratch.push(proxy);
        continue;
      }

      if (this._nodeWithinTargetingBounds(node)) {
        _nodeTargetingCandidateScratch.push(proxy);
      }
    }

    if (_nodeTargetingCandidateScratch.length === 0) {
      return [];
    }

    if (_nodeTargetingCandidateScratch.length === proxies.length) {
      return proxies;
    }

    return _nodeTargetingCandidateScratch;
  }

  // Phase B.5 – optional debug profiler (opt-in)
  _recordRaycastProfile(sample) {
    if (window.__DBG_RAYCAST_PROFILE !== true) return;
    const state = this._raycastProfileState;
    state.frame = (state.frame || 0) + 1;
    if (!state.accum) {
      state.accum = { totalLinks: 0, candidates: 0, coarsePassed: 0, fineTests: 0, hit: 0, ms: 0, count: 0 };
    }
    const a = state.accum;
    a.totalLinks += sample.totalLinks || 0;
    a.candidates += sample.candidates || 0;
    a.coarsePassed += sample.coarsePassed || 0;
    a.fineTests += sample.fineTests || 0;
    a.hit += sample.hit ? 1 : 0;
    a.ms += sample.ms || 0;
    a.count += 1;
    if (state.frame % 120 === 0) {
      const n = a.count || 1;
      console.log('[RaycastProfile]', {
        totalLinks: Math.round(a.totalLinks / n),
        candidates: Math.round(a.candidates / n),
        coarsePassed: Math.round(a.coarsePassed / n),
        fineTests: Math.round(a.fineTests / n),
        hitRate: (a.hit / n).toFixed(2),
        msAvg: (a.ms / n).toFixed(3)
      });
      state.accum = null;
    }
  }

  // Phase B.4 – event-gated (no visual change)
  _markLinksDirty() {
    this.linksDirty = true;
  }
  _markNodesDirty() {
    this.nodesDirty = true;
  }
  _markCameraDirty() {
    this.cameraDirty = true;
  }
  
  /**
   * Setup mouse/touch event listeners (CLICK-TO-LINK system)
   */
  setupEventListeners() {
    this.onClick = this.handleClick.bind(this);
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onMouseDown = this.handleMouseDown.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onMouseUp = this.handleMouseUp.bind(this);
    this.onContextMenu = (e) => {
      e.preventDefault();
      this.deselectNode();
    };
    
    this.renderer.domElement.addEventListener('click', this.onClick);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.addEventListener('contextmenu', this.onContextMenu);
    document.addEventListener('keydown', this.onKeyDown);
    
    // Touch support for click-to-link
    this.renderer.domElement.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        this.handleClick({ clientX: touch.clientX, clientY: touch.clientY });
      }
    });
    
    // Create box selection visual element
    this.createBoxSelectionElement();
  }
  
  /**
   * Create box selection visual element
   */
  createBoxSelectionElement() {
    // Check if element already exists
    let boxEl = document.getElementById('box-selection');
    if (boxEl) {
      this.boxSelectState.visualBox = boxEl;
      return;
    }
    
    boxEl = document.createElement('div');
    boxEl.id = 'box-selection';
    boxEl.style.cssText = `
      position: fixed;
      display: none;
      border: 2px solid #ffaa00;
      background: rgba(255, 170, 0, 0.1);
      pointer-events: none;
      z-index: 9999;
      box-shadow: 0 0 10px rgba(255, 170, 0, 0.5);
    `;
    
    document.body.appendChild(boxEl);
    this.boxSelectState.visualBox = boxEl;
  }
  
  /**
   * Create feedback for priority change
   */
  createPriorityFeedback(link, level) {
    const colors = { LOW: 0xffaa00, NORMAL: 0x00ffff, HIGH: 0xff00ff };
    const color = colors[level];
    
    // Visual pulse on arrow
    const originalOpacity = link.arrow.material.opacity;
    link.arrow.material.emissive = new THREE.Color(color);
    link.arrow.material.emissiveIntensity = 0.5;
    
    setTimeout(() => {
      link.arrow.material.emissiveIntensity = 0;
    }, 300);
  }
  
  /**
   * Create inspection overlay showing traffic data
   */
  createInspectionOverlay(link) {
    // Create temporary inspection display
    const sourceCategory = link.source.userData.category;
    const targetCategory = link.target.userData.category;
    const traffic = link.traffic;
    
    console.log(`
      📊 LINK INSPECTION
      ─────────────────────
      Source: ${sourceCategory.toUpperCase()} → Target: ${targetCategory.toUpperCase()}
      Load: ${(traffic.load * 100).toFixed(1)}%
      Throughput: ${(traffic.throughput * 100).toFixed(1)}%
      Priority: ${traffic.priority.toFixed(2)}
      Bottleneck: ${traffic.bottleneck ? '⚠ YES' : '✓ NO'}
    `);
  }
  


  /**
   * Mouse down handler - Tracks RMB hold state and box selection start
   */
  handleMouseDown(event) {
    // Track RMB hold state (button 2)
    if (event.button === 2) {
      const hoveredNode = this.getNodeAtPosition(event.clientX, event.clientY, 'mousedown');
      
      this.rmbState.isHolding = true;
      this.rmbState.holdStartTime = Date.now();
      this.rmbState.holdThresholdMet = false;
      this.rmbState.hoverTarget = hoveredNode;
      return;
    }
    
    // Track LMB for potential box selection (button 0)
    if (event.button === 0) {
      if (event.ctrlKey || event.metaKey) {
        this.boxSelectState.startedOnEmpty = false;
        this.boxSelectState.lmbDown = false;
        return;
      }

      const pointerLockActive =
        document.pointerLockElement === this.renderer?.domElement ||
        document.pointerLockElement === document.body;

      this.boxSelectState.lmbDown = true;
      this.boxSelectState.holdStartTime = Date.now();
      this.boxSelectState.isActive = false;
      this.boxSelectState.pointerLockDrag = pointerLockActive;

      if (pointerLockActive) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const crosshairX = rect.left + rect.width * 0.5;
        const crosshairY = rect.top + rect.height * 0.5;
        this.boxSelectState.startX = crosshairX;
        this.boxSelectState.startY = crosshairY;
        this.boxSelectState.currentX = crosshairX;
        this.boxSelectState.currentY = crosshairY;
        this.boxSelectState.startedOnEmpty = true;
      } else {
        const clickedNode = this.getNodeAtPosition(event.clientX, event.clientY, 'mousedown');
        
        // Only start box selection if clicking on empty space
        if (!clickedNode) {
          this.boxSelectState.startX = event.clientX;
          this.boxSelectState.startY = event.clientY;
          this.boxSelectState.currentX = event.clientX;
          this.boxSelectState.currentY = event.clientY;
          this.boxSelectState.startedOnEmpty = true;
        } else {
          this.boxSelectState.startedOnEmpty = false;
        }
      }
    }
  }
  
  /**
   * Mouse move handler - Updates box selection visual
   */
  handleMouseMove(event) {
    // Only process if we started on empty space
    if (!this.boxSelectState.startedOnEmpty || !this.boxSelectState.lmbDown) {
      return;
    }

    // In pointer-lock mode, move selection cursor by relative deltas from crosshair anchor
    if (this.boxSelectState.pointerLockDrag) {
      this.boxSelectState.currentX += event.movementX || 0;
      this.boxSelectState.currentY += event.movementY || 0;

      const maxX = window.innerWidth;
      const maxY = window.innerHeight;
      this.boxSelectState.currentX = Math.max(0, Math.min(maxX, this.boxSelectState.currentX));
      this.boxSelectState.currentY = Math.max(0, Math.min(maxY, this.boxSelectState.currentY));
    } else {
      this.boxSelectState.currentX = event.clientX;
      this.boxSelectState.currentY = event.clientY;
    }

    const holdElapsed = Date.now() - this.boxSelectState.holdStartTime;
    if (holdElapsed < this.boxSelectState.holdDelayMs) {
      return;
    }
    
    // Calculate drag distance
    const deltaX = this.boxSelectState.currentX - this.boxSelectState.startX;
    const deltaY = this.boxSelectState.currentY - this.boxSelectState.startY;
    const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Activate box selection if drag threshold exceeded
    if (dragDistance > this.boxSelectState.dragThreshold && !this.boxSelectState.isActive) {
      this.boxSelectState.isActive = true;
      this.setCameraLookPausedForBoxSelect(true);
      console.log('[Box Select] Started');
      
      // Clear any pending single-click timer (this is a drag, not a click)
      if (this.clickState.singleClickTimer) {
        clearTimeout(this.clickState.singleClickTimer);
        this.clickState.singleClickTimer = null;
      }
    }
    
    // Update visual box if active
    if (this.boxSelectState.isActive) {
      this.updateBoxSelectionVisual();
    }
  }
  
  /**
   * Update box selection visual element
   */
  updateBoxSelectionVisual() {
    if (!this.boxSelectState.visualBox) return;
    
    const x1 = Math.min(this.boxSelectState.startX, this.boxSelectState.currentX);
    const y1 = Math.min(this.boxSelectState.startY, this.boxSelectState.currentY);
    const x2 = Math.max(this.boxSelectState.startX, this.boxSelectState.currentX);
    const y2 = Math.max(this.boxSelectState.startY, this.boxSelectState.currentY);
    
    const width = x2 - x1;
    const height = y2 - y1;
    
    this.boxSelectState.visualBox.style.display = 'block';
    this.boxSelectState.visualBox.style.left = x1 + 'px';
    this.boxSelectState.visualBox.style.top = y1 + 'px';
    this.boxSelectState.visualBox.style.width = width + 'px';
    this.boxSelectState.visualBox.style.height = height + 'px';
  }
  
  /**
   * Mouse up handler - Executes RMB hold actions or completes box selection
   */
  handleMouseUp(event) {
    // Handle RMB (button 2)
    if (event.button === 2 && this.rmbState.isHolding) {
      const holdDuration = Date.now() - this.rmbState.holdStartTime;
      
      // Check if hold threshold was met
      if (holdDuration >= this.rmbState.HOLD_THRESHOLD) {
        this.rmbState.holdThresholdMet = true;
        
        // Multi-select mode - remove links from all selected nodes
        if (this.multiSelectMode && this.selectedNodes.size > 0) {
          console.log(`[Multi-Select] RMB hold: Removing links from ${this.selectedNodes.size} nodes`);
          this.removeLinksFromMultiSelected();
        } 
        // Single node - remove links from hovered node
        else if (this.rmbState.hoverTarget) {
          this.removeAllLinksFromNode(this.rmbState.hoverTarget);
          console.log(`[Primary Node] RMB hold: Removed all links from node`);
        }
      } else {
        this.rmbState.holdThresholdMet = false;
        // Short RMB click: just deselect primary/selection
        this.deselectNode();
      }
      
      // Reset RMB state (delay to allow contextmenu event to check holdThresholdMet)
      setTimeout(() => {
        this.rmbState.isHolding = false;
        this.rmbState.holdStartTime = 0;
        this.rmbState.holdThresholdMet = false;
        this.rmbState.hoverTarget = null;
      }, 50);
      return;
    }
    
    // Handle LMB (button 0) - Complete box selection if active
    if (event.button === 0 && this.boxSelectState.isActive) {
      this.completeBoxSelection(event.shiftKey);
      this.boxSelectState.suppressNextClick = true;
      this.setCameraLookPausedForBoxSelect(false);
      
      // Reset box selection state
      this.boxSelectState.isActive = false;
      this.boxSelectState.startedOnEmpty = false;
      this.boxSelectState.lmbDown = false;
      this.boxSelectState.pointerLockDrag = false;
      
      // Hide visual box
      if (this.boxSelectState.visualBox) {
        this.boxSelectState.visualBox.style.display = 'none';
      }
      return;
    }

    // Reset pending drag start if LMB released before threshold
    if (event.button === 0) {
      this.setCameraLookPausedForBoxSelect(false);
      this.boxSelectState.startedOnEmpty = false;
      this.boxSelectState.lmbDown = false;
      this.boxSelectState.pointerLockDrag = false;
    }
  }

  /**
   * Temporarily pause camera mouse-look while doing box selection in-game.
   * Restores previous camera controller enabled state on release.
   */
  setCameraLookPausedForBoxSelect(paused) {
    if (typeof window === 'undefined') return;
    const cameraController =
      window.game?.cameraController ||
      window.atoma?.cameraController ||
      null;
    if (!cameraController || typeof cameraController.enabled !== 'boolean') {
      return;
    }

    if (paused) {
      if (this._boxSelectCameraLookPause.active) return;
      this._boxSelectCameraLookPause.active = true;
      this._boxSelectCameraLookPause.prevEnabled = cameraController.enabled;
      cameraController.enabled = false;
      return;
    }

    if (!this._boxSelectCameraLookPause.active) return;
    const prevEnabled = this._boxSelectCameraLookPause.prevEnabled;
    cameraController.enabled = (typeof prevEnabled === 'boolean') ? prevEnabled : true;
    this._boxSelectCameraLookPause.active = false;
    this._boxSelectCameraLookPause.prevEnabled = null;
  }
  
  /**
   * CLICK-TO-LINK SYSTEM: Main click handler
   * Implements Primary Node system with double-click detection and Ctrl+Click multi-select
   */
  handleClick(event) {
    // Ignore synthetic click that fires right after a completed box drag selection
    if (this.boxSelectState.suppressNextClick) {
      this.boxSelectState.suppressNextClick = false;
      return;
    }

    // Block LMB actions if RMB is being held
    if (this.rmbState.isHolding) {
      return;
    }
    
    // Check if Ctrl key is held
    const isCtrlClick = event.ctrlKey || event.metaKey;  // metaKey for Mac Cmd
    
    // Get node at click position
    const clickedNode = this.getNodeAtPosition(event.clientX, event.clientY, 'click');
    const now = Date.now();
    const timeSinceLastClick = now - this.clickState.lastClickTime;
    
    // Empty space clicked - defer action to distinguish from potential double-click
    if (!clickedNode) {
      // Detect potential double-click on empty space (shouldn't happen, but handle it)
      const isDoubleClickOnEmpty = (
        timeSinceLastClick < this.clickState.DOUBLE_CLICK_THRESHOLD &&
        this.clickState.lastClickedNode === null
      );
      
      if (isDoubleClickOnEmpty) {
        // Double-click on empty space - clear any pending timer and do nothing
        if (this.clickState.singleClickTimer) {
          clearTimeout(this.clickState.singleClickTimer);
          this.clickState.singleClickTimer = null;
        }
        this.clickState.lastClickTime = 0;
        this.clickState.lastClickedNode = null;
        return;
      }
      
      // Single click on empty space - defer to distinguish from double-click
      if (this.clickState.singleClickTimer) {
        clearTimeout(this.clickState.singleClickTimer);
      }
      
      this.clickState.singleClickTimer = setTimeout(() => {
        this.handleSingleClickOnEmpty();
        this.clickState.singleClickTimer = null;
      }, this.clickState.DOUBLE_CLICK_THRESHOLD);
      
      // Update click state
      this.clickState.lastClickTime = now;
      this.clickState.lastClickedNode = null;
      return;
    }
    
    // Ctrl+Click on node - toggle multi-select (no double-click detection for Ctrl+Click)
    if (isCtrlClick) {
      this.toggleMultiSelect(clickedNode);
      this.clickState.lastClickTime = 0;  // Reset to prevent accidental double-click
      this.clickState.lastClickedNode = null;
      return;
    }
    
    // Detect double-click on same node
    const isDoubleClick = (
      timeSinceLastClick < this.clickState.DOUBLE_CLICK_THRESHOLD &&
      this.clickState.lastClickedNode === clickedNode
    );
    
    if (isDoubleClick) {
      // Double-click detected - set new Primary Node (clears multi-select)
      this.clearMultiSelect();
      this.setPrimaryNode(clickedNode);
      
      // Clear any pending single-click timer
      if (this.clickState.singleClickTimer) {
        clearTimeout(this.clickState.singleClickTimer);
        this.clickState.singleClickTimer = null;
      }
      
      // Reset click state
      this.clickState.lastClickTime = 0;
      this.clickState.lastClickedNode = null;
    } else {
      // Single click - defer action to distinguish from potential double-click
      if (this.clickState.singleClickTimer) {
        clearTimeout(this.clickState.singleClickTimer);
      }
      
      this.clickState.singleClickTimer = setTimeout(() => {
        this.handleSingleClick(clickedNode);
        this.clickState.singleClickTimer = null;
      }, this.clickState.DOUBLE_CLICK_THRESHOLD);
      
      // Update click state
      this.clickState.lastClickTime = now;
      this.clickState.lastClickedNode = clickedNode;
    }
  }
  
  /**
   * Handle single LMB click on empty space (deferred to distinguish from double-click)
   */
  handleSingleClickOnEmpty() {
    // Empty space clicked - clear multi-select or Primary Node
    if (this.multiSelectMode) {
      console.log(`[Multi-Select] Cleared by empty space click`);
      this.clearMultiSelect();
    } else if (this.primaryNode) {
      console.log(`[Primary Node] Cleared by empty space click`);
      this.clearPrimaryNode();
    }
    // If nothing selected, do nothing
  }
  
  /**
   * Handle single LMB click (deferred to distinguish from double-click)
   * [Session 144+] Records bulk operations for undo/redo
   */
  handleSingleClick(clickedNode) {
    const postStart = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    // Multi-select mode active - create links from all selected to target
    if (this.multiSelectMode) {
      // Check if clicked node is in selection
      if (this.selectedNodes.has(clickedNode)) {
        // Clicked on a selected node - do nothing (use Ctrl+Click to deselect)
        return;
      }
      
      // [Session 144+] Record bulk link creation as single undoable operation
      const bulkCommand = new BulkCreateLinksCommand(this, this.selectedNodes, clickedNode);
      bulkCommand.execute();
      this.undoRedo.recordCommand(bulkCommand);
      
      console.log(`[Multi-Select] Created links from ${this.selectedNodes.size} nodes to target`);
      
      // Clear multi-select after bulk operation
      this.clearMultiSelect();
      
      // Set target as new Primary Node
      this.setPrimaryNode(clickedNode);
      return;
    }
    
    // Single-select mode
    if (!this.primaryNode) {
      // No Primary Node exists - set clicked node as Primary
      this.setPrimaryNode(clickedNode);
    } else if (clickedNode !== this.primaryNode) {
      // Primary Node exists and clicked node is different - create link
      this.attemptLink(this.primaryNode, clickedNode);
      // Primary Node remains unchanged
    }
    // If clicked node === Primary Node, do nothing (no deselect on single click)
    const postElapsed = (typeof performance !== 'undefined')
      ? (performance.now() - postStart)
      : (Date.now() - postStart);
    recordRaycastCost('post_process', postElapsed, 'click', { path: 'selection' });
  }
  
  /**
   * Set a node as the persistent Primary Node
   */
  setPrimaryNode(node) {
    if (this.primaryNode === node) return;
    
    // Clear previous Primary Node highlight
    if (this.primaryNode) {
      this.clearPrimaryNodeHighlight();
      this.selectedRingSystem?.setSelectedNode(null);
    }
    
    // Set new Primary Node
    this.primaryNode = node;
    this.selectedNode = node;  // Sync with legacy selectedNode for compatibility
    this._markNodesDirty();
    
    // Create Primary Node highlight
    this.createPrimaryNodeHighlight(node);
    this.selectedRingSystem?.setSelectedNode(node);
    this.selectedRingSystem?.onNodeClicked(node);
    
    console.log(`[Primary Node] Set: ${node.userData.category} (ID: ${this.getNodeId(node)})`);
    
    // Fire selection callbacks
    this._fireSelectCallbacks(node);
  }
  
  /**
   * Create visual highlight for Primary Node
   * Uses NeonEdgeGlowShader for futuristic edge highlighting
   */
  createPrimaryNodeHighlight(node) {
    const auraMesh = createFresnelAura(node.userData || { id: this.getNodeId(node) });
    if (!auraMesh) return;
    auraMesh.scale.copy(node.scale);
    auraMesh.position.copy(node.position);
    auraMesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('SELECTED');
    auraMesh.visible = true;

    this.selectedNodeHighlight = auraMesh;
    this.scene.add(this.selectedNodeHighlight);
  }
  
  /**
   * Clear Primary Node highlight
   */
  clearPrimaryNodeHighlight() {
    if (this.selectedNodeHighlight) {
      this.scene.remove(this.selectedNodeHighlight);
      this.selectedNodeHighlight.geometry.dispose();
      this.selectedNodeHighlight.material.dispose();
      this.selectedNodeHighlight = null;
    }
  }
  
  /**
   * Remove all links connected to a node (for RMB hold action)
   * [Session 144+] Records as single undoable operation
   */
  removeAllLinksFromNode(node) {
    if (!node) return;
    
    const nodeId = this.getNodeId(node);
    const linksToRemove = this.links.filter(link => 
      link.active && (
        this.getNodeId(link.source) === nodeId ||
        this.getNodeId(link.target) === nodeId
      )
    );
    
    if (linksToRemove.length === 0) {
      console.log(`[Primary Node] No links to remove from node`);
      return;
    }
    
    console.log(`[Primary Node] Removing ${linksToRemove.length} links from node`);
    
    // [Session 144+] Record bulk removal as single undoable operation
    const bulkCommand = new BulkRemoveLinksCommand(this, [node]);
    bulkCommand.execute();
    this.undoRedo.recordCommand(bulkCommand);
  }
  
  /**
   * Handle keyboard input (ESC to clear Primary Node or multi-select)
   */
  handleKeyDown(event) {
    if (event.key === 'Escape') {
      this.setCameraLookPausedForBoxSelect(false);
      if (this.multiSelectMode) {
        this.clearMultiSelect();
      } else if (this.primaryNode) {
        this.clearPrimaryNode();
      }
    }
  }
  
  // ========================================================================
  // MULTI-SELECT SYSTEM
  // ========================================================================
  
  /**
   * Toggle multi-select for a node (Ctrl+Click handler)
   */
  toggleMultiSelect(node) {
    if (this.selectedNodes.has(node)) {
      // Node already selected - remove from selection
      this.removeFromMultiSelect(node);
    } else {
      // Node not selected - add to selection
      this.addToMultiSelect(node);
    }
  }
  
  /**
   * Add a node to multi-select
   */
  addToMultiSelect(node) {
    // If this is the first node, convert Primary Node to multi-select
    if (!this.multiSelectMode && this.primaryNode) {
      console.log(`[Multi-Select] Converting Primary Node to multi-select`);
      this.clearPrimaryNodeHighlight();
      this.addToMultiSelect(this.primaryNode);
      this.primaryNode = null;
      this.selectedNode = null;
    }
    
    // Add node to selection
    this.selectedNodes.add(node);
    this.multiSelectMode = true;

    // Create multi-select highlight (orange neon glow)
    const highlightGeometry = new THREE.SphereGeometry(1.0, 32, 32);
    const highlightMaterial = createNeonEdgeGlowMaterial({
      glowColor: 0xffaa00,  // Orange for multi-select
      glowIntensity: 1.6,
      edgeWidth: 0.18,
      pulseSpeed: 2.5,
      pulseAmount: 0.35
    });
    
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    tagAllowedSphere(highlight, { role: 'highlight', source: 'NodeLinkingSystem.addToMultiSelect', owner: this.getNodeId(node) });
    clampSphere(highlight);
    Object.assign(ensureUserData(highlight), { isMultiSelectHighlight: true });
    highlight.scale.copy(node.scale);
    highlight.position.copy(node.position);
    highlight.renderOrder = -1;
    
    this.scene.add(highlight);
    this.multiSelectHighlights.set(node, highlight);
    
    // Start pulse animation for newly selected node
    this.startSelectionPulse(node, highlight);
    
    console.log(`[Multi-Select] Added node (${this.selectedNodes.size} selected)`);
  }
  
  /**
   * Remove a node from multi-select
   */
  removeFromMultiSelect(node) {
    this.selectedNodes.delete(node);
    
    // Clean up pulse animation if active
    if (this.selectionPulseAnimations.has(node)) {
      const anim = this.selectionPulseAnimations.get(node);
      if (anim.timeoutId) {
        clearTimeout(anim.timeoutId);
      }
      this.selectionPulseAnimations.delete(node);
    }
    
    // Remove highlight
    const highlight = this.multiSelectHighlights.get(node);
    if (highlight) {
      this.scene.remove(highlight);
      highlight.geometry.dispose();
      highlight.material.dispose();
      this.multiSelectHighlights.delete(node);
    }
    
    console.log(`[Multi-Select] Removed node (${this.selectedNodes.size} selected)`);
    
    // If no nodes left, exit multi-select mode
    if (this.selectedNodes.size === 0) {
      this.multiSelectMode = false;
      console.log(`[Multi-Select] Exited multi-select mode`);
    }
  }
  
  /**
   * Clear all multi-selected nodes
   */
  clearMultiSelect() {
    if (!this.multiSelectMode) return;
    
    console.log(`[Multi-Select] Clearing ${this.selectedNodes.size} selected nodes`);
    
    // Clean up all pulse animations
    for (const [node, anim] of this.selectionPulseAnimations) {
      if (anim.timeoutId) {
        clearTimeout(anim.timeoutId);
      }
    }
    this.selectionPulseAnimations.clear();
    
    // Remove all highlights
    for (const [node, highlight] of this.multiSelectHighlights) {
      this.scene.remove(highlight);
      highlight.geometry.dispose();
      highlight.material.dispose();
    }
    
    // Clear state
    this.selectedNodes.clear();
    this.multiSelectHighlights.clear();
    this.multiSelectMode = false;
  }
  
  /**
   * Remove all links from all multi-selected nodes (bulk operation)
   * [Session 144+] Records as single undoable operation
   */
  removeLinksFromMultiSelected() {
    if (!this.multiSelectMode) return;
    
    // [Session 144+] Record bulk removal as single undoable operation
    const bulkCommand = new BulkRemoveLinksCommand(this, this.selectedNodes);
    bulkCommand.execute();
    this.undoRedo.recordCommand(bulkCommand);
    
    console.log(`[Multi-Select] Removed all links from ${this.selectedNodes.size} nodes`);
  }
  
  /**
   * Start pulse animation for newly selected node
   * Creates a visual pulse effect to highlight the selection
   * @param {Object} node - The selected node
   * @param {THREE.Mesh} highlight - The highlight mesh
   */
  startSelectionPulse(node, highlight) {
    // Cancel any existing pulse animation for this node
    if (this.selectionPulseAnimations.has(node)) {
      clearTimeout(this.selectionPulseAnimations.get(node).timeoutId);
    }
    
    const pulseStartTime = Date.now();
    const pulseDuration = 400; // ms
    const maxScale = 1.2; // Scale factor at peak
    const baseScale = 1.0;
    
    const animateFrame = () => {
      const elapsed = Date.now() - pulseStartTime;
      const progress = Math.min(elapsed / pulseDuration, 1);
      
      // Ease-out cubic for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      // Scale pulse: grows to maxScale then shrinks back to baseScale
      const currentScale = baseScale + (maxScale - baseScale) * Math.sin(easeProgress * Math.PI);
      
      // Update highlight scale
      if (highlight && this.selectedNodes.has(node)) {
        highlight.scale.copy(node.scale).multiplyScalar(currentScale);

        // Pulse glow intensity for neon edge glow shader
        if (highlight.material && highlight.material.uniforms?.glowIntensity) {
          const intensityPulse = 1.0 + 0.5 * Math.sin(easeProgress * Math.PI);
          highlight.material.uniforms.glowIntensity.value = 1.5 * intensityPulse;
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animateFrame);
      } else {
        // Reset to normal state
        if (highlight && this.selectedNodes.has(node)) {
          highlight.scale.copy(node.scale);
          if (highlight.material && highlight.material.uniforms?.glowIntensity) {
            highlight.material.uniforms.glowIntensity.value = 1.5;  // Reset to base intensity
          }
        }
        this.selectionPulseAnimations.delete(node);
      }
    };
    
    animateFrame();
    
    // Store animation reference
    this.selectionPulseAnimations.set(node, { startTime: pulseStartTime, timeoutId: null });
  }
  
  /**
   * Trigger pulse effect for multiple nodes (used when box selection completes)
   * @param {Array} nodes - Array of newly selected nodes
   */
  triggerSelectionCompletePulse(nodes) {
    // Stagger the pulse animations for visual interest
    nodes.forEach((node, index) => {
      const delay = index * 50; // 50ms stagger between nodes
      setTimeout(() => {
        const highlight = this.multiSelectHighlights.get(node);
        if (highlight && this.selectedNodes.has(node)) {
          this.startSelectionPulse(node, highlight);
        }
      }, delay);
    });
  }
  
  // ========================================================================
  // BOX SELECTION SYSTEM
  // ========================================================================
  
  /**
   * Complete box selection - select all nodes within box bounds
   * @param {boolean} additive - If true, add to existing selection (Shift held)
   */
  completeBoxSelection(additive = false) {
    // Get box bounds in screen space
    const x1 = Math.min(this.boxSelectState.startX, this.boxSelectState.currentX);
    const y1 = Math.min(this.boxSelectState.startY, this.boxSelectState.currentY);
    const x2 = Math.max(this.boxSelectState.startX, this.boxSelectState.currentX);
    const y2 = Math.max(this.boxSelectState.startY, this.boxSelectState.currentY);
    
    // Get all nodes within box
    const nodesInBox = this.getNodesInScreenBox(x1, y1, x2, y2);
    
    if (nodesInBox.length === 0) {
      console.log('[Box Select] No nodes in selection area');
      
      // If not additive, clear existing selection
      if (!additive && this.multiSelectMode) {
        this.clearMultiSelect();
      }
      return;
    }
    
    console.log(`[Box Select] Found ${nodesInBox.length} nodes in selection area`);
    
    // Track newly selected nodes for pulse effect
    const newlySelectedNodes = [];
    
    // If not additive, clear existing selection first
    if (!additive && this.multiSelectMode) {
      this.clearMultiSelect();
    }
    
    // Clear Primary Node if converting to multi-select
    if (this.primaryNode && !this.multiSelectMode) {
      this.clearPrimaryNodeHighlight();
      this.primaryNode = null;
      this.selectedNode = null;
    }
    
    // Add all nodes in box to multi-select
    for (const node of nodesInBox) {
      if (!this.selectedNodes.has(node)) {
        this.addToMultiSelect(node);
        newlySelectedNodes.push(node);
      }
    }
    
    // Trigger completion pulse effect on newly selected nodes
    if (newlySelectedNodes.length > 0) {
      this.triggerSelectionCompletePulse(newlySelectedNodes);
      console.log(`[Box Select] ✓ Pulse animation triggered for ${newlySelectedNodes.length} nodes`);
    }
    
    console.log(`[Box Select] Completed: ${this.selectedNodes.size} nodes selected`);
  }
  
  /**
   * Get all nodes within a screen-space box
   * @param {number} x1 - Left screen coordinate
   * @param {number} y1 - Top screen coordinate
   * @param {number} x2 - Right screen coordinate
   * @param {number} y2 - Bottom screen coordinate
   * @returns {Array} Array of nodes within box
   */
  getNodesInScreenBox(x1, y1, x2, y2) {
    const nodesInBox = [];
    
    // Guard: Ensure renderer and DOM element exist
    if (!this.renderer || !this.renderer.domElement) {
      return nodesInBox;
    }
    
    // Get renderer bounds for coordinate conversion
    const rect = this.renderer.domElement.getBoundingClientRect();
    
    // Iterate through all AI nodes
    if (!this.aiNodes || !this.aiNodes.nodes) return nodesInBox;
    
    for (const node of this.aiNodes.nodes) {
      if (!node || !node.position) continue;
      
      // Project node position to screen space
      const screenPos = this.projectToScreen(node.position);
      
      // Check if screen position is within box bounds
      const screenX = screenPos.x * rect.width / 2 + rect.width / 2 + rect.left;
      const screenY = -(screenPos.y * rect.height / 2) + rect.height / 2 + rect.top;
      
      if (screenX >= x1 && screenX <= x2 && screenY >= y1 && screenY <= y2) {
        nodesInBox.push(node);
      }
    }
    
    return nodesInBox;
  }
  
  /**
   * Project 3D position to normalized screen space
   * @param {THREE.Vector3} position - World position
   * @returns {Object} Normalized screen coordinates {x, y}
   */
  projectToScreen(position) {
    const vector = new THREE.Vector3().copy(position);
    vector.project(this.camera);
    return { x: vector.x, y: vector.y };
  }
  
  /**
   * [Legacy wrapper] Select a node - now delegates to setPrimaryNode
   * Maintained for backward compatibility with existing code
   */
  selectNode(node) {
    this.setPrimaryNode(node);
  }
  
  /**
   * Fire selection callbacks (for UISelectedHUD and other listeners)
   */
  _fireSelectCallbacks(node) {
    for (const callback of this.onSelectCallbacks) {
      try {
        callback(node);
      } catch (err) {
        console.warn('Error in selection callback:', err);
      }
    }
  }
  
  /**
   * [Legacy wrapper] Deselect current node - now clears Primary Node
   * Maintained for backward compatibility with existing code
   */
  deselectNode() {
    this.clearPrimaryNode();
  }
  
  /**
   * Clear Primary Node (ESC key or programmatic call)
   */
  clearPrimaryNode() {
    if (!this.primaryNode) return;
    
    console.log(`[Primary Node] Cleared`);
    
    // Clear state
    this.primaryNode = null;
    this.selectedNode = null;
    this._markNodesDirty();
    
    // Remove highlight
    this.clearPrimaryNodeHighlight();
    this.selectedRingSystem?.setSelectedNode(null);
    
    // Fire deselection callbacks
    this._fireDeselectCallbacks();
  }
  
  /**
   * Fire deselection callbacks (for UISelectedHUD and other listeners)
   */
  _fireDeselectCallbacks() {
    for (const callback of this.onDeselectCallbacks) {
      try {
        callback();
      } catch (err) {
        console.warn('Error in deselection callback:', err);
      }
    }
  }

  /**
   * Fire hover-start callbacks.
   */
  _fireHoverStartCallbacks(node) {
    for (const callback of this.onHoverStartCallbacks) {
      try {
        callback(node);
      } catch (err) {
        console.warn('Error in hover-start callback:', err);
      }
    }
  }

  /**
   * Fire hover-end callbacks.
   */
  _fireHoverEndCallbacks(node) {
    for (const callback of this.onHoverEndCallbacks) {
      try {
        callback(node);
      } catch (err) {
        console.warn('Error in hover-end callback:', err);
      }
    }
  }

  /**
   * Fire link creation callbacks (for UISelectedHUD link event notification)
   */
  _fireLinkCreatedCallbacks(source, target) {
    for (const callback of this.onLinkCreatedCallbacks) {
      try {
        callback(source, target);
      } catch (err) {
        console.warn('Error in link created callback:', err);
      }
    }
  }

  /**
   * Fire link removal callbacks (for UISelectedHUD link event notification)
   */
  _fireLinkRemovedCallbacks(source, target) {
    for (const callback of this.onLinkRemovedCallbacks) {
      try {
        callback(source, target);
      } catch (err) {
        console.warn('Error in link removed callback:', err);
      }
    }
  }

  /**
   * Register callback for link creation events
   */
  onLinkCreated(callback) {
    if (typeof callback === 'function') {
      this.onLinkCreatedCallbacks.push(callback);
    }
  }

  /**
   * Register callback for link removal events
   */
  onLinkRemoved(callback) {
    if (typeof callback === 'function') {
      this.onLinkRemovedCallbacks.push(callback);
    }
  }
  
  /**
   * Add soft hover selection glow to a node (selectable indicator)
   */
  addNodeSelectionGlow(node) {
    if (!CONFIG.visuals?.enableNodeHoverGlow) return; // config-gated hover glow
    if (!this.hoverGlowEnabled) return;
    if (this.nodeSelectionGlows.has(node)) return;
    
    // Create subtle hover glow (smaller and less opaque than active selection)
    const glowGeometry = new THREE.SphereGeometry(0.95, 24, 24);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ddff,
      transparent: true,
      opacity: 0.15,
      emissive: 0x00ddff,
      emissiveIntensity: 0.25,
      side: THREE.BackSide
    });
    
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    tagAllowedSphere(glowMesh, { role: 'highlight', source: 'NodeLinkingSystem.addNodeSelectionGlow', owner: this.getNodeId(node) });
    clampSphere(glowMesh);
    Object.assign(ensureUserData(glowMesh), { isSelectionGlow: true, isHover: true });
    glowMesh.scale.copy(node.scale);
    glowMesh.position.copy(node.position);
    glowMesh.renderOrder = -1;
    
    this.scene.add(glowMesh);
    this.nodeSelectionGlows.set(node, glowMesh);
  }
  
  /**
   * Remove soft hover selection glow from a node
   */
  removeNodeSelectionGlow(node) {
    const glowMesh = this.nodeSelectionGlows.get(node);
    if (!glowMesh) return;
    
    this.scene.remove(glowMesh);
    glowMesh.geometry.dispose();
    glowMesh.material.dispose();
    this.nodeSelectionGlows.delete(node);
  }
  
  /**
   * Check if camera is currently moving
   * Used to throttle expensive raycasts during camera transitions
   * @private
   */
  _checkCameraMotion() {
    if (!this.camera) return false;
    
    // Sensitivity thresholds (tuned for smooth experience)
    const MOVEMENT_THRESHOLD = 0.001; // Squared distance
    const ROTATION_THRESHOLD = 0.0001; // Angle change
    
    const posDist = this.camera.position.distanceToSquared(this.lastCameraPos);
    const rotAngle = this.camera.quaternion.angleTo(this.lastCameraQuat);
    
    this.isCameraMoving = (posDist > MOVEMENT_THRESHOLD || rotAngle > ROTATION_THRESHOLD);
    
    // Update last state
    this.lastCameraPos.copy(this.camera.position);
    this.lastCameraQuat.copy(this.camera.quaternion);
    
    return this.isCameraMoving;
  }

  /**
   * Update hover state for all nodes based on crosshair position
   * Shows soft selection glow on selectable nodes
   * 
   * [SESSION 110] Gated by camera motion to prevent stutter
   */
  updateNodeHoverStates() {
    const postStart = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    // 1. Detect camera motion (updates this.isCameraMoving)
    this._checkCameraMotion();
    
    const now = Date.now();
    
    // 2. Throttle raycast if moving
    // If moving: max 10Hz (100ms)
    // If static: max 60Hz (0ms / per frame)
    const throttleInterval = this.isCameraMoving ? 100 : 0;
    
    if (now - this.lastRaycastTime < throttleInterval) {
      if (window.DEBUG_CAMERA_INTERACTION_LOAD && this.isCameraMoving) {
        // console.debug('[CameraGating] Skipped raycast due to motion');
      }
      return; // Skip update, reuse last state
    }
    
    this.lastRaycastTime = now;

    // Get node from shared crosshair raycast state
    const crosshairState = window.__crosshairRaycastState;
    const rayHoveredNode = (crosshairState && crosshairState.node) ? crosshairState.node : null;
    
    // Skip hover updates if already selected this node
    if (this.selectedNode === rayHoveredNode) {
      if (this.hoveredNodeForSelection) {
        this.removeNodeSelectionGlow(this.hoveredNodeForSelection);
        this._fireHoverEndCallbacks(this.hoveredNodeForSelection);
        this.hoveredNodeForSelection = null;
      }
      return;
    }
    
    // Remove glow from previously hovered node if changed
    if (this.hoveredNodeForSelection && this.hoveredNodeForSelection !== rayHoveredNode) {
      this.removeNodeSelectionGlow(this.hoveredNodeForSelection);
      this._fireHoverEndCallbacks(this.hoveredNodeForSelection);
    }
    
    // Add glow to newly hovered node
    if (rayHoveredNode && this.hoveredNodeForSelection !== rayHoveredNode) {
      this.addNodeSelectionGlow(rayHoveredNode);
      this._fireHoverStartCallbacks(rayHoveredNode);
    }
    
    this.hoveredNodeForSelection = rayHoveredNode;
    const postElapsed = (typeof performance !== 'undefined')
      ? (performance.now() - postStart)
      : (Date.now() - postStart);
    recordRaycastCost('post_process', postElapsed, 'hover-loop', { path: 'hover-update' });
  }
  
  /**
   * Clear all selection glows (used on cleanup)
   */
  clearAllNodeSelectionGlows() {
    if (this.hoveredNodeForSelection) {
      this._fireHoverEndCallbacks(this.hoveredNodeForSelection);
    }
    for (const [node, glowMesh] of this.nodeSelectionGlows.entries()) {
      this.scene.remove(glowMesh);
      glowMesh.geometry.dispose();
      glowMesh.material.dispose();
    }
    this.nodeSelectionGlows.clear();
    this.hoveredNodeForSelection = null;
  }
  
  /**
   * Attempt to link two nodes
   * PERMISSIVE GRAPH LINKING:
   * - Check if link A→B exists: remove it (toggle behavior)
   * - Otherwise: create link A→B (allows multiple links per node)
   * - Only deny: self-links and exact duplicates
   * [Session 144+] Records commands for undo/redo
   */
  attemptLink(sourceNode, targetNode) {
    const denialReason = this.validateLink(sourceNode, targetNode);
    
    if (denialReason) {
      // Denied link: show denial reason internally (no intrusive UI)
      console.log(`✗ Link denied: ${denialReason} (${sourceNode.userData.category} → ${targetNode.userData.category})`);
      this.createIncompatibilityWarning(targetNode);
      return;
    }
    
    // Check if this exact directional link A→B already exists
    if (this.linkExists(sourceNode, targetNode)) {
      // Link already exists: Remove it (toggle off)
      const link = this.links.find(l => 
        l.source === sourceNode && l.target === targetNode
      );
      if (link) {
        // [Session 144+] Record undo command BEFORE removing
        const removeCommand = new RemoveLinkCommand(this, link);
        this.undoRedo.recordCommand(removeCommand);
        
        this.createLinkRemovalPulse(link);
        this.removeLink(link);
        console.log(`✓ Link removed: ${sourceNode.userData.category} → ${targetNode.userData.category}`);
      }
    } else {
      // Link doesn't exist: Create it (toggle on, allow multiple per node)
      // [Session 144+] Record undo command for creation
      const createCommand = new CreateLinkCommand(this, sourceNode, targetNode);
      createCommand.execute();
      this.undoRedo.recordCommand(createCommand);
      
      this.createLinkSuccessPulse(sourceNode, targetNode);
      
      // [ARCH CHANGE] Core visual mutations are disabled by default during linking
      // Enable explicitly via window.ATOMA_LINK_CORE_MUTATION_ENABLED === true
      const __linkCoreMutationEnabled =
        typeof window !== 'undefined' && window.ATOMA_LINK_CORE_MUTATION_ENABLED === true;
      if (__linkCoreMutationEnabled) {
        if (_validateBinderNode(sourceNode)) {
          applyFinalNodeVisualState(sourceNode, { verbose: false });
        } else {
          console.warn('[NodeLinkingSystem] Invalid node passed to visual binder', sourceNode);
        }
        if (_validateBinderNode(targetNode)) {
          applyFinalNodeVisualState(targetNode, { verbose: false });
        } else {
          console.warn('[NodeLinkingSystem] Invalid node passed to visual binder', targetNode);
        }
      }
      
      // Update visual state in binder
      if (this.visualStateBinder) {
        if (_validateBinderNode(sourceNode)) {
          this.visualStateBinder.onNodeStateChange(sourceNode, 'LINKED');
        }
        if (_validateBinderNode(targetNode)) {
          this.visualStateBinder.onNodeStateChange(targetNode, 'LINKED');
        }
      }
      
      // Trigger event-based node spawning
      if (this.aiNodes && this.aiNodes.onLinkCreated) {
        this.aiNodes.onLinkCreated();
      }
      
      // Calculate synergy for logging and visual feedback
      const synergy = this.calculateSynergy({ 
        source: sourceNode, 
        target: targetNode 
      });
      
      // [SESSION 76] Apply core glow scaling only when flag is explicitly enabled
      if (__linkCoreMutationEnabled) {
        const glowResult = applyCoreSynergyGlowScaling(sourceNode, targetNode, synergy);
        // glowResult retained for backward compatibility (unused when disabled)
      }
      
      const synergyLabel = synergy > 0.7 ? '★★ HIGH' : '★ NORMAL';
      console.log(`✓ Link created: ${sourceNode.userData.category} → ${targetNode.userData.category} [${synergyLabel} synergy]`);
    }
  }
  
  /**
   * Create pulse animation when link is successfully created
   */
createLinkSuccessPulse(sourceNode, targetNode) {
  const startPos = sourceNode?.position?.clone();
  const endPos = targetNode?.position?.clone();

  if (!startPos || !endPos) {
    console.warn('[LinkPulseCreate] Missing positions', startPos, endPos);
    return;
  }

  const pulseGeometry = new THREE.SphereGeometry(0.12, 16, 16);
  const pulseMaterial = new THREE.MeshBasicMaterial({
    color: 0xaa00ff,
    transparent: true,
    opacity: 0.8,
    emissive: 0xaa00ff,
    emissiveIntensity: 0.6
  });

  const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
  tagAllowedSphere(pulse, { role: 'vfx', source: 'NodeLinkingSystem.createLinkSuccessPulse' });
  clampSphere(pulse);
  pulse.position.copy(startPos);
  this.scene.add(pulse);

  if (!this.effectOrchestrator) {
    console.warn('[LinkPulseCreate] EffectOrchestrator missing');
    return;
  }

  const start = startPos.clone();
  const end = endPos.clone();
  let elapsed = 0;
  const duration = 0.5;

  const effect = {
    id: `pulse-link-create-${Date.now()}`,
    type: 'linkPulse',
    pulse,

    update: (dt) => {
      elapsed += dt;
      const progress = Math.min(elapsed / duration, 1);

      if (!pulse || !start || !end) return { done: true };

      pulse.position.lerpVectors(start, end, progress);

      const scale = 1 + Math.sin(progress * Math.PI) * 0.5;
      pulse.scale.setScalar(scale);
      pulse.material.opacity = 0.8 * (1 - progress);

      return { done: progress >= 1 };
    },

    dispose: () => {
      if (!pulse) return;
      pulse.removeFromParent();
      pulse.geometry.dispose();
      pulse.material.dispose();
    }
  };

  this.effectOrchestrator.add(effect);
}



  
  /**
   * Create pulse animation when link is removed
   */
  createLinkRemovalPulse(link) {
  this.triggerCrosshairPulse();

  const sourcePos = link?.source?.position?.clone();
  const targetPos = link?.target?.position?.clone();

  if (!sourcePos || !targetPos) {
    console.warn('[LinkPulseRemove] Missing positions', sourcePos, targetPos);
    return;
  }

  const pulseGeometry = new THREE.SphereGeometry(0.12, 16, 16);
  const pulseMaterial = new THREE.MeshBasicMaterial({
    color: 0xaa00ff,
    transparent: true,
    opacity: 0.7,
    emissive: 0xaa00ff,
    emissiveIntensity: 0.5
  });

  const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
  tagAllowedSphere(pulse, { role: 'vfx', source: 'NodeLinkingSystem.createLinkRemovalPulse' });
  clampSphere(pulse);
  pulse.position.copy(sourcePos);
  this.scene.add(pulse);

  if (!this.effectOrchestrator) {
    console.warn('[LinkPulseRemove] EffectOrchestrator missing');
    return;
  }

  const from = targetPos.clone();
  const to = sourcePos.clone();
  let elapsed = 0;
  const duration = 0.4;

  const effect = {
    id: `pulse-link-remove-${Date.now()}`,
    type: 'linkPulseRemoval',
    pulse,

    update: (dt) => {
      elapsed += dt;
      const progress = Math.min(elapsed / duration, 1);

      if (!pulse || !from || !to) return { done: true };

      pulse.position.lerpVectors(from, to, progress);

      const scale = 0.8 + Math.sin(progress * Math.PI) * 0.4;
      pulse.scale.setScalar(scale);
      pulse.material.opacity = 0.7 * (1 - progress);

      return { done: progress >= 1 };
    },

    dispose: () => {
      if (!pulse) return;
      pulse.removeFromParent();
      pulse.geometry.dispose();
      pulse.material.dispose();
    }
  };

  this.effectOrchestrator.add(effect);
}



  /**
   * Create warning glow when nodes are incompatible
   */
  createIncompatibilityWarning(targetNode) {
    // Trigger crosshair pulse with red warning variant
    this.triggerCrosshairPulse('warning');
    
    const ringGeometry = new THREE.RingGeometry(0.5, 0.7, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(targetNode.position);
    ring.rotation.x = Math.PI / 2;
    this.scene.add(ring);
    
    // FIXED (Session 37+): Removed requestAnimationFrame.
    // Now registers with effect orchestrator for central dt-based animation.
    if (this.effectOrchestrator) {
      const effect = {
        id: `warning-ring-${Date.now()}`,
        type: 'incompatibilityWarning',
        elapsed: 0,
        duration: 0.3, // 300ms in seconds
        ring: ring,
        
        update: (dt, time) => {
          const progress = Math.min(this.elapsed / this.duration, 1);
          
          // Pulse and shake
          const scale = 1 + Math.sin(progress * Math.PI * 4) * 0.2;
          ring.scale.setScalar(scale);
          ring.material.opacity = 0.8 * (1 - progress);
          
          return { done: progress >= 1 };
        },
        
        dispose: () => {
          this.scene.remove(ring);
          ring.geometry.dispose();
          ring.material.dispose();
        }
      };
      
      this.effectOrchestrator.add(effect);
    } else {
      console.warn('[NodeLinkingSystem] effectOrchestrator not available for warning ring');
    }
  }
  
  /**
   * [Stab2] Get stable node identifier
   * Used for consistent link lookups across selection cycles
   * 
   * Priority:
   * 1. userData.nodeId (assigned during spawn)
   * 2. uuid (THREE.Object3D property)
   * 3. id (fallback)
   * 
   * @param {THREE.Object3D} node - The node to identify
   * @returns {string} Stable identifier for this node
   */
  getNodeId(node) {
    if (!node) return null;
    
    // Primary: Dedicated nodeId field
    if (node.userData && node.userData.nodeId) {
      return node.userData.nodeId;
    }
    
    // Fallback 1: THREE.js uuid (always present)
    if (node.uuid) {
      return node.uuid;
    }
    
    // Fallback 2: Legacy id field
    if (node.id) {
      return String(node.id);
    }
    
    return null;
  }

  /**
   * [LinkIndex v3.0] Get persistent node identifier (private helper)
   * Wraps getNodeId but returns null safely if needed
   * @private
   */
_getNodeId(node) {
  if (!node) return null;

  // If aggregator already passes an ID, accept it
  if (typeof node === 'string') return node;

  return this.getNodeId(node);
}

  /**
   * [LinkIndex v3.0] Add link to persistent index
   * Called whenever a link is created
   * @private
   */
  _addLinkToIndex(link) {
    if (!link || !link.source || !link.target) {
      console.debug('[LinkIndex] Skipping link with invalid structure');
      return;
    }

    const a = this._getNodeId(link.source);
    const b = this._getNodeId(link.target);
    
    if (!a || !b) {
      console.debug('[LinkIndex] Skipping link with invalid node IDs', { a, b });
      return;
    }

    // Add to source node's link list
    if (!this.linksByNode.has(a)) {
      this.linksByNode.set(a, []);
    }
    this.linksByNode.get(a).push(link);

    // Add to target node's link list
    if (!this.linksByNode.has(b)) {
      this.linksByNode.set(b, []);
    }
    this.linksByNode.get(b).push(link);
    
    console.debug(`[LinkIndex] ✓ Added link to index: ${a} ↔ ${b}`);
  }

  /**
   * [LinkIndex v3.0] Remove link from persistent index
   * Called whenever a link is removed
   * @private
   */
  _removeLinkFromIndex(link) {
    if (!link || !link.source || !link.target) {
      console.debug('[LinkIndex] Skipping removal - invalid link structure');
      return;
    }

    const a = this._getNodeId(link.source);
    const b = this._getNodeId(link.target);
    
    if (!a || !b) {
      console.debug('[LinkIndex] Skipping removal - invalid node IDs');
      return;
    }

    const removeFrom = (id) => {
      const arr = this.linksByNode.get(id);
      if (!arr) return;
      
      // Filter out this link (by reference)
      const remaining = arr.filter(l => l !== link);
      
      if (remaining.length === 0) {
        // No more links for this node - remove entry
        this.linksByNode.delete(id);
      } else {
        // Update with filtered list
        this.linksByNode.set(id, remaining);
      }
    };

    removeFrom(a);
    removeFrom(b);
    
    console.debug(`[LinkIndex] ✓ Removed link from index: ${a} ↔ ${b}`);
  }

  /**
   * [LinkIndex v3.0] PUBLIC API - Get all links for a node using persistent index
   * Returns a shallow copy to prevent accidental mutations
   * 
   * @param {THREE.Object3D} node - The node to get links for
   * @returns {Array} Array of links connected to this node
   */
getLinksForNode(node) {
  if (!node) return [];

  const id = this._getNodeId(node);
  if (!id) {
    // bez ID = bez linkov, ale bez spamu
    return [];
  }

  const links = this.linksByNode.get(id);
  const result = Array.isArray(links) ? links.slice() : [];

  // DEBUG: len občas, nie každý frame
  if (this.DEBUG && Math.random() < 0.01) {
    console.log(
      `[LinkIndex] Node ${id.substring(0, 8)}: ${result.length} links`
    );
  }

  return result;
}

  /**
   * [Patch 3.2 HYBRID] Get linked categories (for HUD) with instant cache
   * Reads from mini cache if valid, bypasses 1-frame delay
   * 
   * @param {THREE.Object3D} node - The node to get categories for
   * @returns {Array<string>} Array of category strings (alphabetical)
   */
  getLinkedCategories(node) {
    if (!node) return [];
    
    const nodeId = this._getNodeId(node);
    if (!nodeId) return [];
    
    // Check if cache is still valid (5-frame validity window)
    const now = Date.now();
    if (now < this._cacheValidUntil) {
      const cached = this._linkCategoryCache.get(nodeId);
      if (cached) {
        return Array.from(cached).sort();  // Return instant, no delay ✓
      }
    }
    
    // Cache miss or expired: rebuild from links
    const links = this.getLinksForNode(node);
    const categories = new Set();
    
    for (const link of links) {
      if (!link || !link.source || !link.target) continue;
      
      const linkedNode = link.source === node ? link.target : link.source;
      if (!linkedNode || !linkedNode.userData) continue;
      
      const cat = linkedNode.userData.category || 'unknown';
      if (cat !== 'unknown') {
        categories.add(cat);
      }
    }
    
    // Update cache (valid for ~83ms = 5 frames @ 60fps)
    this._linkCategoryCache.set(nodeId, categories);
    this._cacheValidUntil = now + 83;
    
    const result = Array.from(categories).sort();
    
    // [Session 20 DEBUG] Log linked categories
    console.debug(`[LinkedCategories] Node ${nodeId.substring(0, 8)}: ${result.length} categories`, {
      nodeCategory: node.userData?.category || 'unknown',
      categories: result.join(', '),
      linkCount: links.length,
      cacheHit: false
    });
    
    return result;
  }

  /**
   * [Stab2] LEGACY - Get node links using both index and reference fallback
   * Kept for backward compatibility
   * 
   * @param {THREE.Object3D} node - The node to get links for
   * @returns {Array} Array of links connected to this node
   */
  getNodeLinks(node) {
    // [LinkIndex v3.0] PRIMARY: Use persistent index
    const indexLinks = this.getLinksForNode(node);
    if (indexLinks.length > 0) {
      return indexLinks;
    }

    // FALLBACK: Reference-based lookup (for backward compat)
    // This handles pre-index links or edge cases
    return this.links.filter(l => 
      l && (l.source === node || l.target === node)
    );
  }

  /**
   * [Patch 3.2 HYBRID] Validate link integrity and detect corruption
   * Returns validation report
   * 
   * @param {Object} link - Link to validate
   * @returns {Object} { valid: bool, reason: string }
   */
  _validateLinkIntegrity(link) {
    if (!link) {
      return { valid: false, reason: 'link is null' };
    }
    
    // Check structure
    if (!link.source || !link.target) {
      return { valid: false, reason: 'missing source or target' };
    }
    
    // Check nodes still in scene
    if (!link.source.parent || !link.target.parent) {
      return { valid: false, reason: 'node not in scene' };
    }
    
    // Check nodes have valid positions
    if (!this._isValidNodeForLink(link.source) || !this._isValidNodeForLink(link.target)) {
      return { valid: false, reason: 'invalid node position' };
    }
    
    // Check nodes exist in aiNodes
    if (!this.aiNodes.nodes.includes(link.source) || !this.aiNodes.nodes.includes(link.target)) {
      return { valid: false, reason: 'node not in aiNodes array' };
    }
    
    return { valid: true, reason: 'ok' };
  }

  /**
   * [Patch 3.2 HYBRID] Run synchronization: ensure index ↔ runtime consistency
   * Detects and auto-heals mismatches
   * 
   * @returns {Object} Sync report { indexed, runtime, healed, mismatches }
   */
  _syncIndexWithRuntime() {
    const report = {
      indexed: this.linksByNode.size,
      runtime: this.links.length,
      healed: 0,
      mismatches: 0,
      timestamp: Date.now()
    };
    
    // Detect dead links (nodes disappeared)
    const deadLinks = [];
    for (const link of this.links) {
      const validation = this._validateLinkIntegrity(link);
      if (!validation.valid) {
        deadLinks.push(link);
      }
    }
    
    if (deadLinks.length > 0) {
      report.mismatches += deadLinks.length;
      for (const deadLink of deadLinks) {
        this._removeLinkFromIndex(deadLink);
        this.links = this.links.filter(l => l !== deadLink);
        report.healed++;
      }
      console.debug(`[Hybrid] Auto-healed ${deadLinks.length} dead links`);
    }
    
    // Validate index integrity: every indexed link should be in runtime
    const orphanedIndexEntries = [];
    for (const [nodeId, indexedLinks] of this.linksByNode.entries()) {
      const validatedLinks = indexedLinks.filter(link => {
        const validation = this._validateLinkIntegrity(link);
        if (!validation.valid) {
          orphanedIndexEntries.push({ nodeId, link, reason: validation.reason });
          return false;
        }
        return this.links.includes(link);
      });
      
      if (validatedLinks.length < indexedLinks.length) {
        report.mismatches += indexedLinks.length - validatedLinks.length;
        this.linksByNode.set(nodeId, validatedLinks);
        if (validatedLinks.length === 0) {
          this.linksByNode.delete(nodeId);
        }
        report.healed += indexedLinks.length - validatedLinks.length;
      }
    }
    
    if (orphanedIndexEntries.length > 0) {
      console.debug(`[Hybrid] Auto-healed ${orphanedIndexEntries.length} orphaned index entries`);
    }
    
    // Update sync state
    this._syncState.linkCount = this.links.length;
    this._syncState.lastSyncTime = Date.now();
    this._syncState.mismatchDetected = report.mismatches > 0;
    
    return report;
  }

  /**
   * Get node category (returns category directly)
   */
  getNodeCategory(nodeType) {
    // Node types are already categories in new system
    return nodeType || 'input';
  }
  
  /**
   * [SESSION 87] LOAD PRESSURE LINK VALIDATION
   * 
   * Validates if link is allowed based on:
   * 1. Self-link protection (hard deny)
   * 2. Duplicate link protection (hard deny)
   * 3. Per-node load pressure constraints (hard deny if exceeded)
   * 
   * CORE PRINCIPLE:
   * - ANY node can link to ANY other node (category-agnostic)
   * - Links are denied ONLY due to load capacity limits or duplication
   * - Network behavior is emergent and self-regulating via load pressure
   * 
   * LOAD PRESSURE MODEL:
   * - Each node has maxLinkCapacity (based on category and evolution)
   * - currentLinkCount = number of active links (both directions)
   * - Link denied if: currentLinkCount >= maxLinkCapacity
   */
  validateLink(sourceNode, targetNode) {
    // HARD DENY: Self-link
    if (sourceNode === targetNode) {
      return "self-link";
    }
    
    // HARD DENY: Exact duplicate link A→B
    if (this.linkExists(sourceNode, targetNode)) {
      return "duplicate link";
    }
    
    // [SESSION 87] LOAD PRESSURE CHECK: Source node capacity
    const sourceLoadCheck = this._checkNodeLoadPressure(sourceNode);
    if (!sourceLoadCheck.allowed) {
      return `load pressure exceeded (source: ${sourceLoadCheck.currentCount}/${sourceLoadCheck.maxCapacity})`;
    }
    
    // [SESSION 87] LOAD PRESSURE CHECK: Target node capacity
    const targetLoadCheck = this._checkNodeLoadPressure(targetNode);
    if (!targetLoadCheck.allowed) {
      return `load pressure exceeded (target: ${targetLoadCheck.currentCount}/${targetLoadCheck.maxCapacity})`;
    }
    
    // ALLOW: All other combinations
    // - All category combinations allowed
    // - Load pressure constraints satisfied
    return null;
  }
  
  /**
   * [SESSION 87] Check if a node has exceeded its load pressure capacity
   * Returns { allowed: bool, currentCount: number, maxCapacity: number }
   * 
   * maxLinkCapacity is determined by:
   * 1. Node category (base capacity)
   * 2. Node evolution stage (higher tier = higher capacity)
   * 3. Special traits (optional multiplier)
   * 
   * @private
   */
  _checkNodeLoadPressure(node) {
    if (!node || !node.userData) {
      return { allowed: false, currentCount: 0, maxCapacity: 0 };
    }
    
    // Count current active links (both incoming and outgoing)
    const currentCount = this.links.filter(link =>
      link.active && (link.source === node || link.target === node)
    ).length;
    
    // Determine max link capacity based on node properties
    const maxCapacity = this._getMaxLinkCapacity(node);
    
    // Deny if at or exceeding capacity
    const allowed = currentCount < maxCapacity;
    
    return {
      allowed,
      currentCount,
      maxCapacity
    };
  }
  
  /**
   * [SESSION 87] Determine max link capacity for a node
   * Based on category and evolution stage
   * 
   * Base capacities by category:
   * - input/output: 6 links (I/O constrained)
   * - process: 8 links (moderate processing)
   * - integration: 12 links (hub role)
   * - analytics: 8 links (analysis role)
   * - storage: 16 links (storage hub)
   * - control: 10 links (coordination)
   * - quantum/special: 10 links (unstable)
   * - emotional: 6 links (empathetic connections)
   * 
   * Evolution multipliers:
   * - Tier 1 (base): 1.0x
   * - Tier 2: 1.3x
   * - Tier 3: 1.6x
   * - Tier 4: 2.0x
   * 
   * @private
   */
  _getMaxLinkCapacity(node) {
    if (!node || !node.userData) return 6; // Safe default
    
    const category = (node.userData.category || 'input').toLowerCase();
    
    // Base capacity by category
    const baseLinkCapacity = {
      'input': 6,
      'output': 6,
      'process': 8,
      'integration': 12,
      'analytics': 8,
      'storage': 16,
      'control': 10,
      'quantum': 10,
      'special': 10,
      'emotional': 6,
      'prime': 8,
      'sigma': 10,
      'apex': 12,
      'mythic': 14
    };
    
    let capacity = baseLinkCapacity[category] || 6;
    
    // Apply evolution tier multiplier (if available)
    if (node.userData.evolutionTier && typeof node.userData.evolutionTier === 'number') {
      const tier = Math.max(1, Math.min(4, node.userData.evolutionTier)); // Clamp 1-4
      const tierMultiplier = [1.0, 1.3, 1.6, 2.0][tier - 1];
      capacity = Math.ceil(capacity * tierMultiplier);
    }
    
    // Cap absolute maximum to prevent runaway networks
    return Math.min(capacity, 32);
  }
  
  /**
   * [LEGACY - kept for reference]
   * Old strict layer compatibility rules (now soft/advisory)
   * Layer compatibility influences synergy score (0.5 vs 0.8)
   * but does NOT prevent linking
   */
  getLayerCompatibility(sourceNode, targetNode) {
    const sourceCategory = sourceNode.userData.category;
    const targetCategory = targetNode.userData.category;
    
    // Legacy compatibility rules (for synergy calculation only)
    const strongPairs = [
      ['input', 'process'],
      ['process', 'integration'],
      ['integration', 'storage'],
      ['storage', 'control'],
      ['analytics', 'control']
    ];
    
    const isStrongPair = strongPairs.some(pair => 
      (sourceCategory === pair[0] && targetCategory === pair[1]) ||
      (sourceCategory === pair[1] && targetCategory === pair[0])
    );
    
    return isStrongPair ? 0.8 : 0.5; // Used for visual synergy only
  }
  
  /**
   * Check if link already exists
   */
  linkExists(sourceNode, targetNode) {
    return this.links.some(link => 
      link.source === sourceNode && link.target === targetNode
    );
  }

  /**
   * [Stab2] Check if link is valid and its nodes still exist
   * Used for cleanup and validation
   * 
   * @param {Object} link - The link to validate
   * @returns {boolean} True if link is valid
   */
  isLinkValid(link) {
    if (!link) return false;
    if (!link.source || !link.target) return false;
    
    // Check if nodes are still in the scene
    if (!link.source.parent || !link.target.parent) {
      return false;
    }
    
    // Check if nodes have valid positions (prevent "position of undefined" error)
    if (!this._isValidNodeForLink(link.source) || !this._isValidNodeForLink(link.target)) {
      return false;
    }
    
    // Link is valid
    return true;
  }
  
  /**
   * Get node at mouse position with extended interaction distance
   * Includes selection buffer (spherecast radius) for easier picking
   */
  /**
   * Traverse up from a mesh to find its parent AI node
   * Handles cases where raycast hits glyphs or wrapper groups instead of core
   */
  findParentAINode(mesh) {
    let current = mesh;
    while (current) {
      // Check if this object is in the aiNodes.nodes array
      if (this.aiNodes.nodes.includes(current)) {
        return current;
      }
      // Move up the hierarchy
      current = current.parent;
    }
    return null;
  }

  /**
   * Sort raycast hits with priority for node cores
   * Node cores always win over glyphs, halos, and visual effects
   */
  sortRaycastHits(intersects) {
    // Separate hits into priorities
    const coreHits = [];
    const otherHits = [];

    for (const hit of intersects) {
      // If marked as node core, prioritize it
      if (hit.object.userData?.isNodeCore === true) {
        coreHits.push(hit);
      } else {
        otherHits.push(hit);
      }
    }

    // Return cores first, then others by distance
    return coreHits.concat(otherHits);
  }

  /**
   * Compute and store a node's bounding sphere for raycast selection.
   * Marks result on userData.boundingSphere for reuse.
   * 
   * [SOFT REVERT] Two code paths based on USE_LEGACY_NODE_BOUNDS flag:
   * - Legacy path: Simple THREE.js Box3.setFromObject (original behavior)
   * - New path: Safe bounds with NaN/Infinity protection
   * Legacy bounds path preserved to prevent visual hierarchy corruption.
   */
  computeNodeBoundingSphere(node) {
    if (!node) return null;
    if (!node.userData) node.userData = {};

    // Return cached result if available
    if (node.userData.boundingSphere && !node.userData._boundsDirty) {
      return node.userData.boundingSphere;
    }

    // Legacy bounds path: Simple THREE.js Box3.setFromObject
    // No sanitization, no unions, no fallbacks - original behavior
    if (USE_LEGACY_NODE_BOUNDS) {
      const box = new THREE.Box3().setFromObject(node);
      const sphere = new THREE.Sphere();
      box.getBoundingSphere(sphere);
      node.userData.boundingSphere = sphere;
      return sphere;
    }

    // New bounds path: Safe bounds with NaN/Infinity protection
    // Try to compute bounding sphere from node's geometries
    // Traverse node to find mesh geometries and compute bounds using safe helper
    let hasValidGeometry = false;
    let tempBox = new THREE.Box3();
    
    node.traverse(child => {
      if (child.isMesh && child.visible && child.geometry) {
        const result = safeComputeBounds(child.geometry);
        if (result.ok && result.boundingBox) {
          tempBox.union(result.boundingBox);
          hasValidGeometry = true;
        }
      }
    });

    if (hasValidGeometry) {
      // Successfully computed bounds from valid geometries
      const sphere = new THREE.Sphere();
      tempBox.getBoundingSphere(sphere);
      
      // Validate sphere radius is finite
      if (Number.isFinite(sphere.radius) && sphere.radius > 0) {
        node.userData.boundingSphere = sphere;
        return sphere;
      }
    }

    // Fallback: create minimal sphere based on node world position
    // This ensures raycast selection works even with malformed geometry
    const worldPos = new THREE.Vector3();
    node.getWorldPosition(worldPos);
    
    if (!Number.isFinite(worldPos.x) || !Number.isFinite(worldPos.y) || !Number.isFinite(worldPos.z)) {
      // Node position is also invalid - return null to prevent crashes
      console.warn('[computeNodeBoundingSphere] Node has invalid position', node.id || node.uuid);
      return null;
    }
    
    // Create minimal fallback sphere (radius 0.001 = just enough for raycast hit)
    const fallbackSphere = new THREE.Sphere(worldPos.clone(), 0.001);
    node.userData.boundingSphere = fallbackSphere;
    node.userData._fallbackBounds = true; // Mark as fallback for debugging
    
    return fallbackSphere;
  }

  getNodeAtPosition(clientX, clientY, callsite = 'unknown') {
    // ========================================================================
    // [INTERACTION AUTHORITY FIX] RELIABLE NODE SELECTION
    // Enforces single raycast target per node: CORE MESH ONLY
    // ========================================================================
    
    // Fast path: use hit-proxy system when fully ready to avoid failsafe violations
    const proxiesReady = window.HITPROXY_READY === true &&
                         window.hitProxySystem?.registry?.getAllProxies()?.length > 0 &&
                         window.safeProxyRaycaster;

    if (proxiesReady) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      window.safeProxyRaycaster.setFromCamera(this.mouse, this.camera);
      const proxyStart = (typeof performance !== 'undefined') ? performance.now() : Date.now();
      const proxyHits = window.hitProxySystem.raycast(
        window.safeProxyRaycaster,
        this.camera,
        null,
        { callsite }
      );
      const proxyElapsed = (typeof performance !== 'undefined')
        ? (performance.now() - proxyStart)
        : (Date.now() - proxyStart);
      recordRaycastCost('proxy_raycast', proxyElapsed, callsite, { path: 'proxy' });

      if (proxyHits.length > 0) {
        const resolveStart = (typeof performance !== 'undefined') ? performance.now() : Date.now();
        const nodeId = proxyHits[0].nodeId || proxyHits[0].object?.userData?.targetNodeId;
        const hitNode = this.aiNodes.nodes.find(n => {
          const identity = (typeof window !== 'undefined' && window.getNodeIdentity)
            ? window.getNodeIdentity(n)
            : (n.userData?.id || n.userData?.nodeId || n.uuid);
          return identity === nodeId || n.userData?.id === nodeId || n.userData?.nodeId === nodeId;
        });
        const resolveElapsed = (typeof performance !== 'undefined')
          ? (performance.now() - resolveStart)
          : (Date.now() - resolveStart);
        recordRaycastCost('resolve_hit', resolveElapsed, callsite, { path: 'proxy' });
        if (hitNode) {
          if (typeof window !== 'undefined') {
            window.__raycastProxyHitCount = (window.__raycastProxyHitCount || 0) + 1;
          }
          return hitNode;
        }
      }
      if (typeof window !== 'undefined') {
        window.__raycastProxyMissCount = (window.__raycastProxyMissCount || 0) + 1;
        window.__raycastVisualFallbackCount = (window.__raycastVisualFallbackCount || 0) + 1;
        const dbg = window.DEBUG_RAYCAST_PROXY === true;
        const every = window.RAYCAST_PROXY_MISS_LOG_EVERY || 120;
        const miss = window.__raycastProxyMissCount;
        if (dbg && miss % every === 0) {
          const info = { miss, hit: window.__raycastProxyHitCount || 0, fallback: window.__raycastVisualFallbackCount || 0 };
          console.debug("[Raycast] proxy miss → fallback to visual", info);
        }
      }
    }

    // Convert to normalized device coordinates
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update raycaster with extended distance (4x default)
    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.raycaster.far = this.interactionConfig.maxLinkingDistance;
    
    // ========================================================================
    // STRATEGY: Direct raycast against node core meshes ONLY
    // ========================================================================
    // Collect all node core meshes (authoritative raycast targets)
    const coreMeshes = [];
    
    for (const node of this.aiNodes.nodes) {
      if (!node || !node.visible) continue;
      if (!this._nodeWithinTargetingBounds(node)) continue;

      if (node.userData?._boundsDirty) {
        this.computeNodeBoundingSphere(node);
        node.userData._boundsDirty = false;
      }
      
      // Traverse node tree to find core mesh
      // Priority: find mesh marked as isNodeCore, or first mesh in node
      const raycastTargetAllowed = node.userData?.isRaycastTarget !== false;
      let coreMesh = node.userData?.coreMesh || null;

      if ((!coreMesh || !coreMesh.isMesh) && raycastTargetAllowed) {
        node.traverse(child => {
          if (!coreMesh && child.isMesh && child.visible) {
            // Prefer explicitly marked core mesh
            if (child.userData?.isNodeCore === true) {
              coreMesh = child;
            }
            // Otherwise accept first visible mesh (likely the core)
            // But skip obvious visual-only meshes
            else if (!child.userData?.isAura && 
                     !child.userData?.isShell &&
                     !child.userData?.isHologramShell &&
                     !child.userData?.isParticle &&
                     !child.userData?.isFX &&
                     !child.userData?.isGlyph &&
                     !child.userData?.isLinkVisual &&
                     child.userData?.isNodeCore !== false) {
              coreMesh = child;
            }
          }
        });
      }
      
      if (coreMesh) {
        if (node.userData) {
          node.userData.coreMesh = coreMesh;
          node.userData.isRaycastTarget = node.userData.isRaycastTarget ?? true;
        }
        if (raycastTargetAllowed) {
          coreMeshes.push(coreMesh);
        }
      } else if (raycastTargetAllowed && node?.userData?.boundingSphere === undefined) {
        console.warn("⚠ Raycast node without bounds", node.id || node.userData?.id || node.uuid);
      }
    }
    
    // Guard: No core meshes found
    if (coreMeshes.length === 0) {
      return null;
    }
    
    // ========================================================================
    // PRIMARY: Raycast against core meshes ONLY
    // ========================================================================
    const previousFallbackFlag = window.__RAYCAST_FALLBACK_ACTIVE === true;
    window.__RAYCAST_FALLBACK_ACTIVE = true;
    const visualStart = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    const intersects = this.raycaster.intersectObjects(coreMeshes, false);
    const visualElapsed = (typeof performance !== 'undefined')
      ? (performance.now() - visualStart)
      : (Date.now() - visualStart);
    recordRaycastCost('visual_raycast', visualElapsed, callsite, { path: 'visual-core' });
    window.__RAYCAST_FALLBACK_ACTIVE = previousFallbackFlag;
    
    if (intersects.length > 0) {
      // Find the parent node for this core mesh
      const resolveStart = (typeof performance !== 'undefined') ? performance.now() : Date.now();
      const hitMesh = intersects[0].object;
      let parentNode = hitMesh;
      
      while (parentNode) {
        if (this.aiNodes.nodes.includes(parentNode)) {
          if (parentNode.userData?.nodeId) {
            console.log('[NodeLinkingSystem] ✓ Node core raycast hit confirmed');
          }
          const resolveElapsed = (typeof performance !== 'undefined')
            ? (performance.now() - resolveStart)
            : (Date.now() - resolveStart);
          recordRaycastCost('resolve_hit', resolveElapsed, callsite, { path: 'visual-core' });
          return parentNode;
        }
        parentNode = parentNode.parent;
      }
      const resolveElapsed = (typeof performance !== 'undefined')
        ? (performance.now() - resolveStart)
        : (Date.now() - resolveStart);
      recordRaycastCost('resolve_hit', resolveElapsed, callsite, { path: 'visual-core' });
    }
    
    // ========================================================================
    // FALLBACK: Selection buffer (spherecast) for easier picking
    // This prevents accidental misclicks when hovering near nodes
    // ========================================================================
    const rayOrigin = this.raycaster.ray.origin;
    const rayDirection = this.raycaster.ray.direction;
    const bufferRadius = this.interactionConfig.selectionBufferRadius;
    let closestNode = null;
    let closestDistance = Infinity;
    const resolveStart = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    
    for (const node of this.aiNodes.nodes) {
      // Skip invisible nodes
      if (!node || !node.visible) continue;
      
      // Use node's bounding sphere for selection buffer check
      if (!node.userData.boundingSphere || node.userData._boundsDirty) {
        this.computeNodeBoundingSphere(node);
        if (node.userData) {
          node.userData._boundsDirty = false;
        }
      }

      if (!node.userData.boundingSphere) {
        console.warn("⚠ Raycast node without bounds", node.id || node.userData?.id || node.uuid);
        continue;
      }
      
      const nodeSphere = node.userData.boundingSphere;
      _scratchVecB.copy(nodeSphere.center);
      const effectiveRadius = nodeSphere.radius + bufferRadius;
      
      // Calculate closest point on ray to sphere center
      _scratchVecC.copy(_scratchVecB).sub(rayOrigin);
      const projection = _scratchVecC.dot(rayDirection);
      
      // Only consider nodes in front of camera
      if (projection < 0) continue;
      
      _scratchVecA.copy(rayDirection).multiplyScalar(projection).add(rayOrigin);
      const distanceToNode = _scratchVecA.distanceTo(_scratchVecB);
      
      // Check if ray passes within selection buffer of node
      if (distanceToNode <= effectiveRadius && projection <= this.interactionConfig.maxLinkingDistance) {
        const distanceFromCamera = rayOrigin.distanceTo(_scratchVecB);
        
        // Select closest node (prefer nodes closer to camera)
        if (distanceFromCamera < closestDistance) {
          closestDistance = distanceFromCamera;
          closestNode = node;
        }
      }
    }
    
    const resolveElapsed = (typeof performance !== 'undefined')
      ? (performance.now() - resolveStart)
      : (Date.now() - resolveStart);
    recordRaycastCost('resolve_hit', resolveElapsed, callsite, { path: 'sphere-buffer' });
    return closestNode;
  }
  
  /**
   * [CRITICAL STABILIZATION] NODE INTERACTION AUTHORITY
   * Get node ONLY via hit-proxies (guaranteed safe, visual meshes never participate)
   * Used when LOCK_INTERACTION = true
   * @private
   */
  _getNodeAtPositionFromProxies(clientX, clientY) {
    try {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      this.raycaster.far = this.interactionConfig.maxLinkingDistance;
      
      // ONLY use hit-proxies (visual meshes excluded)
      const hitProxyMeshes = window.hitProxySystem?.registry?.getAllProxies() || [];

      if (hitProxyMeshes.length === 0) {
        return null;  // No proxies available
      }

      const boundedProxies = this._filterNodeTargetingProxies(hitProxyMeshes);
      if (boundedProxies.length === 0) {
        return null;
      }

      const intersects = this.raycaster.intersectObjects(boundedProxies, false);
      const filtered = filterRaycastIntersections(intersects);
      
      if (filtered.length > 0) {
        const targetNodeId = filtered[0].object?.userData?.targetNodeId;
        if (targetNodeId) {
          const hitNode = this.aiNodes.nodes.find(n => n.userData?.id === targetNodeId);
          if (hitNode) {
            return hitNode;
          }
        }
      }
      
      return null;
    } catch (err) {
      return null;
    }
  }

  /**
   * [DEBUG MODE] Direct node selection (temporary recovery mode)
   * Used when window.DEBUG_DIRECT_NODE_SELECTION === true
   * Bypasses hit-proxy system entirely - raycast directly against visible meshes
   * @private
   */
  _getNodeAtPositionDirect(clientX, clientY) {
    try {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      this.raycaster.far = this.interactionConfig.maxLinkingDistance;

      // Collect all visible node meshes (direct - no proxies)
      const nodeMeshes = [];
      if (this.aiNodes?.nodes) {
      for (const node of this.aiNodes.nodes) {
        if (!this._nodeWithinTargetingBounds(node)) continue;
        node.traverse(child => {
            if (child.isMesh) {
              nodeMeshes.push(child);
            }
          });
        }
      }

      if (nodeMeshes.length === 0) return null;

      // Raycast directly (temporary recovery only)
      const intersects = this.raycaster.intersectObjects(nodeMeshes, false);
      if (intersects.length > 0) {
        // Find parent node
        for (const intersection of intersects) {
          let obj = intersection.object;
          while (obj) {
            if (obj.userData?.id && this.aiNodes.nodes.includes(obj)) {
              return obj;
            }
            obj = obj.parent;
          }
        }
      }

      return null;
    } catch (err) {
      return null;
    }
  }
  
  /**
   * Check if source node is a special multi-output node
   */
  isSpecialNode(node) {
    return this.specialNodeTypes[node.userData.type] !== undefined;
  }
  
  /**
   * Get output link count for a node
   */
  getOutputLinkCount(node) {
    return this.links.filter(link => link.source === node && link.active).length;
  }
  
  /**
   * Create multi-layer glow beam around link (SAFE VFX - Effect #1)
   * 3 layers: dense inner glow, mid-radius neon haze, outer atmospheric veil
   */
  createMultiLayerGlow(link) {
    const sourceCategory = link.source.userData.category;
    const categoryColors = {
      'input': 0x00ddff,
      'process': 0xffaa00,
      'integration': 0x00ff88,
      'analytics': 0xaa00ff,
      'storage': 0x88ccff,
      'control': 0xff0088
    };
    
    const synergy = this.calculateSynergy(link);
    const baseColor = categoryColors[sourceCategory] || 0x00ddff;
    
    // Layer 1: Dense inner glow (bright)
    const layer1 = new THREE.Group();
    layer1.userData = { vfxType: 'glowLayer1', isVFX: true };
    const layer1Geometry = new THREE.BufferGeometry();
    const layer1Positions = new Float32Array(60 * 3);
    layer1Geometry.setAttribute('position', new THREE.BufferAttribute(layer1Positions, 3));
    const layer1Material = new THREE.LineBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.15 * synergy,
      linewidth: 8
    });
    const layer1Line = new THREE.Line(layer1Geometry, layer1Material);
    layer1.add(layer1Line);
    layer1.userData.material = layer1Material;
    link.group.add(layer1);
    
    // Layer 2: Mid-radius neon haze (soft)
    const layer2 = new THREE.Group();
    layer2.userData = { vfxType: 'glowLayer2', isVFX: true };
    const layer2Geometry = new THREE.BufferGeometry();
    const layer2Positions = new Float32Array(60 * 3);
    layer2Geometry.setAttribute('position', new THREE.BufferAttribute(layer2Positions, 3));
    const layer2Material = new THREE.LineBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.08 * synergy,
      linewidth: 15
    });
    const layer2Line = new THREE.Line(layer2Geometry, layer2Material);
    layer2.add(layer2Line);
    layer2.userData.material = layer2Material;
    link.group.add(layer2);
    
    // Layer 3: Outer atmospheric veil (very subtle)
    const layer3 = new THREE.Group();
    layer3.userData = { vfxType: 'glowLayer3', isVFX: true };
    const layer3Geometry = new THREE.BufferGeometry();
    const layer3Positions = new Float32Array(60 * 3);
    layer3Geometry.setAttribute('position', new THREE.BufferAttribute(layer3Positions, 3));
    const layer3Material = new THREE.LineBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.04 * synergy,
      linewidth: 25
    });
    const layer3Line = new THREE.Line(layer3Geometry, layer3Material);
    layer3.add(layer3Line);
    layer3.userData.material = layer3Material;
    link.group.add(layer3);
    
    return {
      layers: [layer1, layer2, layer3],
      lines: [layer1Line, layer2Line, layer3Line],
      materials: [layer1Material, layer2Material, layer3Material],
      synergy: synergy
    };
  }
  
  /**
   * Calculate synergy between two nodes (0-1)
   */
  calculateSynergy(link) {
    const sourceCategory = link.source.userData.category;
    const targetCategory = link.target.userData.category;
    const strongPairs = [
      ['input', 'process'],
      ['process', 'integration'],
      ['integration', 'storage'],
      ['storage', 'control'],
      ['analytics', 'control']
    ];
    const isPair = strongPairs.some(pair => 
      (sourceCategory === pair[0] && targetCategory === pair[1]) ||
      (sourceCategory === pair[1] && targetCategory === pair[0])
    );
    return isPair ? 0.8 : 0.5;
  }
  
  /**
   * Create energy pulse travel animation (SAFE VFX - Effect #2)
   * Pulse travels along curve with speed/color based on synergy/load
   */
  createEnergyPulseTravel(link) {
    const pulseMesh = new THREE.Group();
    pulseMesh.userData = { vfxType: 'energyPulse', isVFX: true };
    
    const synergy = link.glowData ? link.glowData.synergy : 0.6;
    const pulseColor = synergy > 0.7 ? 0xffff00 : 0x88ccff;
    
    const pulseGeometry = new THREE.IcosahedronGeometry(0.08, 2);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: pulseColor,
      transparent: true,
      opacity: 0.8,
      emissive: pulseColor,
      emissiveIntensity: 0.5
    });
    
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulseMesh.add(pulse);
    pulseMesh.userData = {
      ...pulseMesh.userData,
      progress: 0,
      speed: synergy * 2,
      color: pulseColor,
      mesh: pulse
    };
    
    link.group.add(pulseMesh);
    return pulseMesh;
  }
  
  /**
   * Create holographic circuit texture overlay (SAFE VFX - Effect #3)
   * Faint animated circuit pattern along link, appears when carrying data
   */
  createHolographicCircuit(link) {
    const circuitGroup = new THREE.Group();
    circuitGroup.userData = { vfxType: 'holographicCircuit', isVFX: true };
    
    const circuitGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.02);
    const circuitMaterial = new THREE.MeshBasicMaterial({
      color: link.color,
      transparent: true,
      opacity: 0.3,
      emissive: link.color,
      emissiveIntensity: 0.2
    });
    
    const circuitNodeCount = 10;
    const circuitNodes = [];
    
    for (let i = 0; i < circuitNodeCount; i++) {
      const circuitNode = new THREE.Mesh(circuitGeometry.clone(), circuitMaterial.clone());
      circuitNode.userData = {
        index: i,
        progress: i / circuitNodeCount,
        shimmerPhase: Math.random() * Math.PI * 2
      };
      circuitGroup.add(circuitNode);
      circuitNodes.push(circuitNode);
    }
    
    circuitGroup.userData = {
      ...circuitGroup.userData,
      nodes: circuitNodes,
      animationPhase: 0
    };
    
    link.group.add(circuitGroup);
    return circuitGroup;
  }
  
  /**
   * Create link edge highlights (SAFE VFX - Effect #4)
   * Thin neon edges along curvature with Fresnel-like additive glow
   */
  createLinkEdgeHighlights(link) {
    const edgeGroup = new THREE.Group();
    edgeGroup.userData = { vfxType: 'edgeHighlights', isVFX: true };
    
    const sourceCategory = link.source.userData.category;
    const edgeColors = {
      'input': 0x00ffff,
      'process': 0xffff00,
      'integration': 0x00ff00,
      'analytics': 0xff00ff,
      'storage': 0x00ccff,
      'control': 0xff0099
    };
    
    const edgeColor = edgeColors[sourceCategory] || 0x00ddff;
    
    const edgeGeometry = new THREE.BufferGeometry();
    const edgePositions = new Float32Array(60 * 3);
    edgeGeometry.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
    
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: edgeColor,
      transparent: true,
      opacity: 0.4,
      linewidth: 2
    });
    
    const edgeLine = new THREE.Line(edgeGeometry, edgeMaterial);
    edgeGroup.add(edgeLine);
    
    edgeGroup.userData = {
      ...edgeGroup.userData,
      color: edgeColor,
      line: edgeLine,
      material: edgeMaterial,
      shimmerPhase: 0
    };
    
    link.group.add(edgeGroup);
    return edgeGroup;
  }
  
  /**
   * Create soft particle stream (SAFE VFX - Effect #5)
   * Tiny particles flowing along link, elegant and minimal
   */
  createSoftParticleStream(link) {
    const streamGroup = new THREE.Group();
    streamGroup.userData = { vfxType: 'particleStream', isVFX: true };
    
    const synergy = link.glowData ? link.glowData.synergy : 0.6;
    const particleCount = Math.floor(4 + synergy * 4);
    
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.04, 6, 6);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: link.color,
        transparent: true,
        opacity: 0.6,
        emissive: link.color,
        emissiveIntensity: 0.3
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      tagAllowedSphere(particle, { role: 'vfx', source: 'NodeLinkingSystem.createSoftParticleStream' });
      clampSphere(particle);
      particle.userData = {
        progress: i / particleCount,
        speed: 0.4 + Math.random() * 0.3,
        flowDirection: new THREE.Vector3()
      };
      
      streamGroup.add(particle);
      particles.push(particle);
    }
    
    streamGroup.userData = {
      ...streamGroup.userData,
      particles: particles,
      flowSpeed: synergy
    };
    
    link.group.add(streamGroup);
    return streamGroup;
  }
  
  /**
   * Create quantum link effects (SAFE VFX - Effect #6)
   * Refractive shimmer aura, micro-distortion waves, spectral separation
   */
  createQuantumLinkEffects(link) {
    if (link.source.userData.category !== 'quantum' && link.target.userData.category !== 'quantum') {
      return null;
    }
    
    const quantumGroup = new THREE.Group();
    quantumGroup.userData = { vfxType: 'quantumEffects', isVFX: true };
    
    const shimmerCount = 8;
    const shimmerMeshes = [];
    
    for (let i = 0; i < shimmerCount; i++) {
      const shimmerGeometry = new THREE.SphereGeometry(0.06, 4, 4);
      const shimmerMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.2,
        wireframe: false
      });
      
      const shimmer = new THREE.Mesh(shimmerGeometry, shimmerMaterial);
      tagAllowedSphere(shimmer, { role: 'vfx', source: 'NodeLinkingSystem.createQuantumLinkEffects' });
      clampSphere(shimmer);
      shimmer.userData = {
        index: i,
        angle: (i / shimmerCount) * Math.PI * 2,
        distance: 0.2 + Math.random() * 0.15,
        phase: Math.random() * Math.PI * 2
      };
      
      quantumGroup.add(shimmer);
      shimmerMeshes.push(shimmer);
    }
    
    quantumGroup.userData = {
      ...quantumGroup.userData,
      shimmers: shimmerMeshes,
      distortionPhase: 0
    };
    
    link.group.add(quantumGroup);
    return quantumGroup;
  }
  
  /**
   * Create Sigma link effects (SAFE VFX - Effect #7)
   * Green-teal fracture flickers, glitch lines, anomaly pulses
   */
  createSigmaLinkEffects(link) {
    if (link.source.userData.category !== 'sigma' && link.target.userData.category !== 'sigma') {
      return null;
    }
    
    const sigmaGroup = new THREE.Group();
    sigmaGroup.userData = { vfxType: 'sigmaEffects', isVFX: true };
    
    const fractureCount = 5;
    const fractures = [];
    
    for (let i = 0; i < fractureCount; i++) {
      const fractureGeometry = new THREE.BoxGeometry(0.03, 0.15, 0.01);
      const fractureColor = Math.random() > 0.5 ? 0x00ff88 : 0x00ddff;
      const fractureMaterial = new THREE.MeshBasicMaterial({
        color: fractureColor,
        transparent: true,
        opacity: 0.4,
        emissive: fractureColor,
        emissiveIntensity: 0.3
      });
      
      const fracture = new THREE.Mesh(fractureGeometry, fractureMaterial);
      fracture.userData = {
        index: i,
        glitchPhase: Math.random() * Math.PI * 2,
        activeTime: 0
      };
      
      sigmaGroup.add(fracture);
      fractures.push(fracture);
    }
    
    sigmaGroup.userData = {
      ...sigmaGroup.userData,
      fractures: fractures,
      glitchIntensity: 0,
      anomalyPhase: 0
    };
    
    link.group.add(sigmaGroup);
    return sigmaGroup;
  }

  /**
   * BRAIDED CONDUIT LINK SYSTEM (Replaces Extreme Link)
   * Creates organic, twisted multi-strand cable geometry.
   */
  createLink(sourceNode, targetNode) {
    captureNodeCoreState(sourceNode);
    captureNodeCoreState(targetNode);
    try {
    // 1. Construct Link Object first (so conduit gets real reference)
    const linkId = `link-${this._linkIdCounter++}`;
    const link = {
      source: sourceNode,
      target: targetNode,
      sourceNodeId: this.getNodeId(sourceNode),
      targetNodeId: this.getNodeId(targetNode),
      group: null,
      curve: null,
      active: true,
      // Traffic data (required for logic simulation)
      traffic: {
        load: this.trafficSimulation.baseTraffic + Math.random() * 0.2,
        throughput: 0.5 + Math.random() * 0.5,
        priority: Math.random(),
        bottleneck: false
      },
      // Animation state
      animation: {
        pulsePhase: Math.random() * Math.PI * 2
      },
      // Identity
      id: linkId,
      // Compatibility flags
      vfxEnabled: true,
      extremeMode: false, // Disables legacy extreme visual updates
      // Creation timestamp
      createdAt: performance.now(),
      visualState: 'pending',
      // Canonical link metrics container (always present)
      userData: {
        synergy: {
          score: 0,
          synergyNorm: 0
        }
      }
    };
    
    // 2. Create visual group via new renderer using real link reference
    const linkGroup = this.conduitRenderer.createLinkVisuals(link);
    link.group = linkGroup;
    const parent = this.linkRoot || this.scene;
    parent.add(linkGroup);
    
    // 3. Enforce depth authority (standard ATOMA protocol)
    NodeDepthAndHoloPreservationFix.enforceLinkDepthAuthority(linkGroup);
    
    this.links.push(link);
    this._markLinksDirty();
    this._markNodesDirty();

    // Trigger global metrics aggregation immediately on link creation
    if (this.metricsRuntime?.runNetworkMetricsAggregator) {
      try {
        this.metricsRuntime.runNetworkMetricsAggregator();
      } catch (e) {
        console.warn('[NodeLinkingSystem] metrics aggregation trigger failed', e);
      }
    } else if (typeof window !== 'undefined' && window.metricsRuntime?.runNetworkMetricsAggregator) {
      try {
        window.metricsRuntime.runNetworkMetricsAggregator();
      } catch (e) {
        console.warn('[NodeLinkingSystem] window.metricsRuntime aggregation trigger failed', e);
      }
    }
    
    // 4. Register with sub-systems
      this.visuals.registerLink(link.id, link.group);
      
      if (this.thicknessSystem) {
        this.thicknessSystem.registerLinkCurve(link.group, link);
      }

      // Register link with harmonic sync manager (if available)
      if (this.conduitRenderer?.nodeHarmonicManager) {
        this.conduitRenderer.nodeHarmonicManager.registerLinkWithNodes(
          link,
          link.source,
          link.target
        );
      }
      // Register link with node interference manager (if available)
      if (this.conduitRenderer?.nodeInterferenceManager) {
        this.conduitRenderer.nodeInterferenceManager.registerLinkWithNodes(
          link,
          link.source,
          link.target
        );
      }
      
      LinkPrioritySystem.initializeLinkPriority(link);
      this._addLinkToIndex(link);
      
      // [Phase 2] Initialize Emission Pulsing System (supports both Legacy and Conduit links)
      LinkEmissionPulsingSystem.initializeLinkEmissionPulsing(link, link.traffic.load);
      
      // Update internal map (Legacy support)
      const srcId = link.sourceNodeId;
      const tgtId = link.targetNodeId;
      if (srcId) {
        if (!this.nodeIdToLinks.has(srcId)) this.nodeIdToLinks.set(srcId, []);
        this.nodeIdToLinks.get(srcId).push(link);
      }
      if (tgtId) {
        if (!this.nodeIdToLinks.has(tgtId)) this.nodeIdToLinks.set(tgtId, []);
        this.nodeIdToLinks.get(tgtId).push(link);
      }

      // Canonical metrics: link creation hook
      if (_validateBinderNode(sourceNode) && _validateBinderNode(targetNode)) {
        onLinkCreated(sourceNode, targetNode);
      } else {
        console.warn('[NodeLinkingSystem] onLinkCreated skipped - invalid nodes detected');
      }
    
    // UI Callback
    this._fireLinkCreatedCallbacks(sourceNode, targetNode);
    
    // [Phase 2] Trigger Event Coordinator (suppresses node auras during link creation)
    if (this.eventCoordinator) {
      this.eventCoordinator.onLinkEvent(sourceNode, targetNode);
    }
    
    // Canonical semantic event: link created
    const semanticBus = this.semanticBus || (typeof globalThis !== 'undefined' ? globalThis.semanticBus : null);
    if (semanticBus?.emit) {
      const sourceId = this.getNodeId(sourceNode);
      const targetId = this.getNodeId(targetNode);
      const payload = {
        source: sourceId,
        target: targetId,
        linkId: link.id,
        midpoint: (sourceNode?.position && targetNode?.position)
          ? {
              x: (sourceNode.position.x + targetNode.position.x) * 0.5,
              y: (sourceNode.position.y + targetNode.position.y) * 0.5,
              z: (sourceNode.position.z + targetNode.position.z) * 0.5
            }
          : undefined
      };
      semanticBus.emit('link.created', payload, { priority: semanticBus.priority?.INTERACTIVE });

      if (window.game?.waveInterferenceEngine) {
        window.game.waveInterferenceEngine.requestBurstIntent({
          type: "synergy",
          sourceId: payload?.linkId || "link",
          center: payload?.position || payload?.midpoint || { x: 0, y: 0, z: 0 },
          toRegime: "collaborative",
          fromRegime: "baseline"
        });
      }
    }
    
    // categoryTransitionSystem removed (unused)
    
    // 5. Initial Visual Update
    this.conduitRenderer.update(link, 0, 0);
    
    // 5.5. LINK BIRTH AURA ENHANCEMENT
    // Mark nodes as just-linked to trigger aura birth animation
    sourceNode.justLinked = true;
    targetNode.justLinked = true;
    sourceNode.linkBirthTime = performance.now();
    targetNode.linkBirthTime = performance.now();
    
    // Store link direction for aura shader modulation
    if (sourceNode.userData) {
      sourceNode.userData.lastLinkDirection = new THREE.Vector3()
        .subVectors(targetNode.position, sourceNode.position)
        .normalize();
    }
    if (targetNode.userData) {
      targetNode.userData.lastLinkDirection = new THREE.Vector3()
        .subVectors(sourceNode.position, targetNode.position)
        .normalize();
    }
    
    // 6. Synergy & Metrics (Standard Integration)
    if (window.ComputeSynergyScore2_0) {
       try {
         const res = window.ComputeSynergyScore2_0(link, { linkingSystem: this });
         link['synergyScore'] = res?.score || 0.5;
       } catch(e) { link['synergyScore'] = 0.5; }
    } else {
       link['synergyScore'] = 0.5;
    }
    
    if (link.id) {
        this.updateLinkMetrics(link, {
            corruption: link.corruptionLevel ?? 0,
            synergy: link['synergyScore'] ?? 0.5,
            harmony: link.harmonyScore ?? 0
        });
    }
    
    console.log(`✓ Braided Link Created: ${sourceNode.userData.category} -> ${targetNode.userData.category}`);
    return link;
    } finally {
      restoreNodeCoreState(sourceNode);
      restoreNodeCoreState(targetNode);
    }
  }
  
  // Deferred visual builder (Phase 3B)
  _realizeLinkVisuals(pending) {
    const { link, sourceNode, targetNode } = pending || {};
    if (!link || !sourceNode || !targetNode) return;
    if (link.visualState === 'ready') return;

    captureNodeCoreState(sourceNode);
    captureNodeCoreState(targetNode);
    try {
      const linkGroup = this.conduitRenderer.createLinkVisuals(link);
      (this.linkRoot || this.scene).add(linkGroup);
      NodeDepthAndHoloPreservationFix.enforceLinkDepthAuthority(linkGroup);
      link.group = linkGroup;

      this.visuals.registerLink(link.id, link.group);
      if (this.thicknessSystem) {
        this.thicknessSystem.registerLinkCurve(link.group, link);
      }
      LinkEmissionPulsingSystem.initializeLinkEmissionPulsing(link, link.traffic.load);

      this._fireLinkCreatedCallbacks(sourceNode, targetNode);
      if (this.eventCoordinator) {
        this.eventCoordinator.onLinkEvent(sourceNode, targetNode);
      }
      // categoryTransitionSystem removed (unused)

      this.conduitRenderer.update(link, 0, 0);
      sourceNode.justLinked = true;
      targetNode.justLinked = true;
      sourceNode.linkBirthTime = performance.now();
      targetNode.linkBirthTime = performance.now();
      if (sourceNode.userData) {
        sourceNode.userData.lastLinkDirection = new THREE.Vector3()
          .subVectors(targetNode.position, sourceNode.position)
          .normalize();
      }
      if (targetNode.userData) {
        targetNode.userData.lastLinkDirection = new THREE.Vector3()
          .subVectors(sourceNode.position, targetNode.position)
          .normalize();
      }

      if (window.ComputeSynergyScore2_0) {
        try {
          const res = window.ComputeSynergyScore2_0(link, { linkingSystem: this });
          link['synergyScore'] = res?.score || 0.5;
        } catch (e) { link['synergyScore'] = 0.5; }
      } else {
        link['synergyScore'] = 0.5;
      }
      if (link.id) {
        this.updateLinkMetrics(link, {
          corruption: link.corruptionLevel ?? 0,
          synergy: link['synergyScore'] ?? 0.5,
          harmony: link.harmonyScore ?? 0
        });
      }

      link.visualState = 'ready';
      console.log('✓ Braided Link Visuals Ready:', link.id);
    } finally {
      restoreNodeCoreState(sourceNode);
      restoreNodeCoreState(targetNode);
    }
  }

  createLinkLegacy(sourceNode, targetNode) {
    captureNodeCoreState(sourceNode);
    captureNodeCoreState(targetNode);
    try {
    const linkGroup = new THREE.Group();
    
    // ===== HARD GUARD: PROTECT NODE CORE MATERIALS =====
    // Store node core material state BEFORE creating link
    // This prevents any link creation code from affecting nodes
    const sourceCoreMaterial = sourceNode.userData?.authoritativeMaterial || sourceNode.material;
    const targetCoreMaterial = targetNode.userData?.authoritativeMaterial || targetNode.material;
    
    // Mark nodes as protected during link creation
    sourceNode.userData = sourceNode.userData || {};
    targetNode.userData = targetNode.userData || {};
    sourceNode.userData._linkCreationProtected = true;
    targetNode.userData._linkCreationProtected = true;
    
    // Get node category for color
    const sourceCategory = sourceNode.userData.category;
    const categoryColors = {
      'input': 0x00ddff,      // Cyan
      'process': 0xffaa00,    // Amber/Gold
      'integration': 0x00ff88, // Green
      'analytics': 0xaa00ff,   // Violet
      'storage': 0x88ccff,     // Silver/Pale Blue
      'control': 0xff0088      // Red/Magenta
    };
    
    // Check if this is a special node (Sigma, Quantum, Emotional)
    const isSpecial = sourceNode.userData.isSpecial;
    const specialNodeConfig = this.specialNodeTypes[sourceNode.userData.category];
    
    // For special nodes, use enhanced glow color
    let linkColor = categoryColors[sourceCategory] || 0x00ddff;
    if (isSpecial && specialNodeConfig) {
      linkColor = specialNodeConfig.glow;
    }
    
    // EXTREME: Create Bézier curve geometry with high fidelity
    const curvePoints = isSpecial ? 120 : 100; // 50% more points for smooth curves
    const positions = new Float32Array(curvePoints * 3);
    const curveGeometry = new THREE.BufferGeometry();
    curveGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // ========== EXTREME THICKNESS UPGRADE ==========
    // CORE 1: Inner Neon Core (EXTREME - 4x thicker)
    const coreMaterial = new THREE.LineBasicMaterial({
      color: linkColor,
      transparent: true,
      opacity: isSpecial ? 0.95 : 0.85,
      linewidth: isSpecial ? 12 : 10  // 4x baseline (was 3:2)
    });
    const coreLine = new THREE.Line(curveGeometry, coreMaterial);
    coreLine.userData = { vfxType: 'extremeCore1', isVFX: true };
    linkGroup.add(coreLine);
    
    // CORE 2: Mid Glow Layer (Enhanced)
    const midGlowMaterial = new THREE.LineBasicMaterial({
      color: linkColor,
      transparent: true,
      opacity: isSpecial ? 0.45 : 0.35,
      linewidth: isSpecial ? 20 : 16  // 2-3x thicker
    });
    const midGlowLine = new THREE.Line(curveGeometry.clone(), midGlowMaterial);
    midGlowLine.userData = { vfxType: 'extremeCore2', isVFX: true };
    linkGroup.add(midGlowLine);
    
    // CORE 3: Outer Extreme Halo (EXTREME - massive)
    const haloMaterial = new THREE.LineBasicMaterial({
      color: linkColor,
      transparent: true,
      opacity: isSpecial ? 0.25 : 0.15,
      linewidth: isSpecial ? 32 : 28  // Ultra massive bloom base
    });
    const haloLine = new THREE.Line(curveGeometry.clone(), haloMaterial);
    haloLine.userData = { vfxType: 'extremeHalo', isVFX: true };
    linkGroup.add(haloLine);
    
    // CORE 4: Ultra Outer Bloom Aura (NEW EXTREME)
    const bloomAuraMaterial = new THREE.LineBasicMaterial({
      color: linkColor,
      transparent: true,
      opacity: isSpecial ? 0.12 : 0.08,
      linewidth: isSpecial ? 48 : 40,  // Massive cinematic bloom
      depthTest: false,   // ⚠️ CRITICAL: Aura overlay does NOT read depth
      depthWrite: false   // ⚠️ CRITICAL: Aura overlay does NOT write depth
    });
    const bloomAuraLine = new THREE.Line(curveGeometry.clone(), bloomAuraMaterial);
    bloomAuraLine.userData = { vfxType: 'extremeBloom', isVFX: true };
    linkGroup.add(bloomAuraLine);
    
    // ========== ENERGY VEIN ANIMATION LAYER ==========
    // Fast-moving thin streaks inside the beam core
    const veinCount = isSpecial ? 6 : 4;
    const veins = [];
    for (let i = 0; i < veinCount; i++) {
      const veinGeometry = new THREE.BufferGeometry();
      const veinPositions = new Float32Array(curvePoints * 3);
      veinGeometry.setAttribute('position', new THREE.BufferAttribute(veinPositions, 3));
      
      const veinMaterial = new THREE.LineBasicMaterial({
        color: linkColor,
        transparent: true,
        opacity: 0.4,
        linewidth: 1
      });
      const vein = new THREE.Line(veinGeometry, veinMaterial);
      vein.userData = {
        vfxType: 'energyVein',
        isVFX: true,
        veinIndex: i,
        phaseOffset: (i / veinCount) * Math.PI * 2
      };
      linkGroup.add(vein);
      veins.push(vein);
    }
    
    // ========== NEON EDGE BLADE (EXTREME) ==========
    // Ultra-thin, bright edge highlight for "neon blade" effect
    const edgeGeometry = new THREE.BufferGeometry();
    const edgePositions = new Float32Array(curvePoints * 3);
    edgeGeometry.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
    
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,  // Bright white edge
      transparent: true,
      opacity: 0.6,
      linewidth: isSpecial ? 3 : 2  // Thin but bright
    });
    const edgeLine = new THREE.Line(edgeGeometry, edgeMaterial);
    edgeLine.userData = { vfxType: 'neonEdgeBladeExtreme', isVFX: true };
    linkGroup.add(edgeLine);
    
    // ========== EXTREME TRAFFIC PARTICLES (DATA FLOW) ==========
    // Larger, faster, more numerous
    const particleCount = isSpecial ? 20 : 14;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(isSpecial ? 0.16 : 0.12, 10, 10);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: linkColor,
        transparent: true,
        opacity: 0.85,
        emissive: linkColor,
        emissiveIntensity: 0.5
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      tagAllowedSphere(particle, { role: 'vfx', source: 'NodeLinkingSystem.createEnhancedLinkVisuals' });
      clampSphere(particle);
      particle.userData = {
        progress: i / particleCount,
        speed: 0.5 + Math.random() * 0.4  // Faster movement
      };
      
      linkGroup.add(particle);
      particles.push(particle);
    }
    
    // ========== EXTREME DIRECTIONAL ARROW ==========
    // REMOVED: Large cone geometries were visually overwhelming and reduced readability
    // Links still function normally - only the visual cone representation is disabled
    // (Kept null reference for backward compatibility with animation code)
    const arrow = new THREE.Object3D();
    arrow.userData = { vfxType: 'extremeArrow', isVFX: true, disabled: true };
    // Not added to scene - arrow is purely disabled for visual clarity
    
    // ========== EXTREME ACCENT RINGS (SPECIAL NODES) ==========
    if (isSpecial) {
      // Main accent ring
      const ringGeometry = new THREE.TorusGeometry(0.45, 0.04, 12, 24);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: linkColor,
        transparent: true,
        opacity: 0.6,
        emissive: linkColor,
        emissiveIntensity: 0.4
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(targetNode.position);
      ring.rotation.x = Math.PI / 2;
      ring.userData = { vfxType: 'extremeRing', isVFX: true };
      linkGroup.add(ring);
      
      // Secondary pulse ring
      const pulseRingGeometry = new THREE.TorusGeometry(0.6, 0.02, 8, 16);
      const pulseRingMaterial = new THREE.MeshBasicMaterial({
        color: linkColor,
        transparent: true,
        opacity: 0.3,
        emissive: linkColor,
        emissiveIntensity: 0.3
      });
      const pulseRing = new THREE.Mesh(pulseRingGeometry, pulseRingMaterial);
      pulseRing.position.copy(targetNode.position);
      pulseRing.rotation.x = Math.PI / 2;
      pulseRing.userData = { vfxType: 'extremePulseRing', isVFX: true };
      linkGroup.add(pulseRing);
    }
    
    (this.linkRoot || this.scene).add(linkGroup);
    
    // ========================================================================
    // [NODE DEPTH PRESERVATION] ENFORCE DEPTH AUTHORITY ON LINK VISUALS
    // Links must NEVER write depth or occlude holographic layers
    // ========================================================================
    NodeDepthAndHoloPreservationFix.enforceLinkDepthAuthority(linkGroup);
    
    // Store link data with traffic simulation
    const link = {
      source: sourceNode,
      target: targetNode,
      
      // [Stab2] Stable node identifiers (for consistent link lookup)
      sourceNodeId: this.getNodeId(sourceNode),
      targetNodeId: this.getNodeId(targetNode),
      
      group: linkGroup,
      coreLine: coreLine,
      midGlowLine: midGlowLine,
      haloLine: haloLine,
      bloomAuraLine: bloomAuraLine,
      edgeLine: edgeLine,
      arrow: arrow,
      particles: particles,
      veins: veins,
      color: linkColor,
      active: true,
      isSpecial: isSpecial,
      
      // [Audit 6.2] 1-frame delay flag for new links
      _justCreated: true,
      
      // Traffic simulation data
      traffic: {
        load: this.trafficSimulation.baseTraffic + 
              Math.random() * this.trafficSimulation.trafficVariation,
        throughput: 0.5 + Math.random() * 0.5,
        priority: Math.random(),
        bottleneck: false
      },
      
      // EXTREME LINK EDITION animation state
      animation: {
        pulsePhase: Math.random() * Math.PI * 2,
        glowIntensity: 1,
        lastUpdate: performance.now(),
        veinPhase: Math.random() * Math.PI * 2,
        bloomPhase: 0,
        edgePulse: 0,
        hoverBoost: 0  // Hover interaction
      },
      
      // EXTREME VFX System
      vfxEnabled: true,
      hoveredState: false,
      baseThickness: isSpecial ? 10 : 8,  // EXTREME: 4x baseline
      extremeMode: true,
      
      // 1. Multi-layer glow (4 layers: core, mid, halo, bloom)
      glowData: null,
      
      // 2. Energy pulse travel
      energyPulse: null,
      
      // 3. Holographic circuit texture
      circuitOverlay: null,
      
      // 4. Edge highlights (Fresnel-like)
      edgeHighlights: null,
      
      // 5. Soft particle stream
      particleStream: null,
      
      // 6. Quantum effects (if applicable)
      quantumEffects: null,
      
      // 7. Sigma effects (if applicable)
      sigmaEffects: null,
      
      // 8. Intensity-based thickness (animation data)
      thicknessPhase: 0,
      
      // 9. Hover interaction (state)
      hoverHighlight: null,
      
      // 10. Environment reactivity (light projection)
      environmentLight: null,

      // EXTREME ADDITIONS
      // 11. Energy vein animation
      veinAnimation: {
        active: true,
        speed: 2.0
      },

      // 12. Neon edge blade
      edgeBladeActive: true,

      // 13. Node impact effects
      lastNodeImpact: 0,
      impactCooldown: 500,

      // Canonical link metrics container (always present)
      userData: {
        synergy: {
          score: 0,
          synergyNorm: 0
        }
      }
    };
    
    this.links.push(link);
    
    // [Session 112] Initialize animated link flow visualization
    if (this.flowSystem) {
      this.flowSystem.initializeLinkFlow(link, linkId);
    }
    
    // [Metrics Integration v1.0] Register with visuals
    this.visuals.registerLink(link.id, link.group);
    
    // [Dynamic Thickness v1.0] Register link for real-time thickness updates
    if (this.thicknessSystem) {
      this.thicknessSystem.registerLinkCurve(link.group, link);
    }
    
    // [LinkPriority v1.0] Initialize priority system (non-destructive add-on)
    LinkPrioritySystem.initializeLinkPriority(link);
    
    // [LinkIndex v3.0] Add link to persistent index for stable lookups
    this._addLinkToIndex(link);
    
    // [Patch 3.2 HYBRID] Mirror link to index immediately (soft sync)
    // Invalidate cache for both nodes
    const hybridSrcId = this.getNodeId(sourceNode);
    const hybridTgtId = this.getNodeId(targetNode);
    this._linkCategoryCache.delete(hybridSrcId);
    this._linkCategoryCache.delete(hybridTgtId);
    this._cacheValidUntil = Date.now() - 1;  // Expire cache immediately
    
    // [Stab2] Update internal map for stable link lookup (LEGACY - kept for compatibility)
    const srcId = link.sourceNodeId;
    const tgtId = link.targetNodeId;
    if (srcId) {
      if (!this.nodeIdToLinks.has(srcId)) {
        this.nodeIdToLinks.set(srcId, []);
      }
      this.nodeIdToLinks.get(srcId).push(link);
    }
    if (tgtId) {
      if (!this.nodeIdToLinks.has(tgtId)) {
        this.nodeIdToLinks.set(tgtId, []);
      }
      this.nodeIdToLinks.get(tgtId).push(link);
    }
    
    // Fire link creation callback (for UI updates)
    this._fireLinkCreatedCallbacks(sourceNode, targetNode);
    
    // Initial curve update
    this.updateLinkCurve(link);
    
    // Initialize all 10 SAFE VFX effects (pure additive overlays)
    if (link.vfxEnabled) {
      link.glowData = this.createMultiLayerGlow(link);
      link.energyPulse = this.createEnergyPulseTravel(link);
      link.circuitOverlay = this.createHolographicCircuit(link);
      link.edgeHighlights = this.createLinkEdgeHighlights(link);
      link.particleStream = this.createSoftParticleStream(link);
      link.quantumEffects = this.createQuantumLinkEffects(link);
      link.sigmaEffects = this.createSigmaLinkEffects(link);
    }
    
    // [Synergy Canonical Writer] Compute and store initial synergy object
    try {
      let synergyResult = null;
      if (window.ComputeSynergyScore2_1) {
        // Prefer Phase 3b calculator; supports synergyNorm
        const calc = window.ComputeSynergyScore2_1;
        synergyResult =
          typeof calc === 'function'
            ? calc(link, { linkingSystem: this })
            : typeof calc?.compute === 'function'
              ? calc.compute(link, { linkingSystem: this })
              : null;
      }
      if (!synergyResult && window.ComputeSynergyScore2_0) {
        // Fallback to legacy 2.0
        synergyResult = window.ComputeSynergyScore2_0(link, {
          linkingSystem: this,
          config: { weights: { type: 0.35, priority: 0.25, traffic: 0.20, decay: 0.10, topology: 0.10 } }
        });
      }

      const score = synergyResult?.score ?? 0.5;
      const synergyNorm = synergyResult?.synergyNorm ?? score ?? 0.5;

      if (!link.userData) link.userData = {};
      link.userData.synergy = { score, synergyNorm };
      link['synergyScore'] = score; // Compatibility mirror

      console.debug(`[Synergy] Link created with score: ${score.toFixed(3)} norm: ${synergyNorm.toFixed(3)}`);

      // Push to LinkHistoryTracker if active
      if (window.linkHistoryTracker) {
        const viability = window.linkQualityPredictor?.computeLinkQuality(link) || 50;
        window.linkHistoryTracker.recordSample(link, score, viability, 0.7);
      }
    } catch (err) {
      console.warn('[Synergy] computation error:', err?.message || err);
      link['synergyScore'] = 0.5;
      if (!link.userData) link.userData = {};
      link.userData.synergy = { score: 0.5, synergyNorm: 0.5 };
    }
    
    // [Metrics Integration v1.0] Initial metric wiring (read-only, no computation)
    // Bootstrap the visual system with initial metric values
    if (link.id) {
      const initialMetrics = {
        corruption: link.corruptionLevel ?? 0,
        synergy: link['synergyScore'] ?? 0.5,
        harmony: link.harmonyScore ?? 0
      };
      this.updateLinkMetrics(link, initialMetrics);
    }
    
    // [Session 77] Initialize synergy-driven link color
    // Color reflects link quality: cyan (low) → purple (mid) → red (high)
    initializeLinkSynergyColor(link);
    
    // [Session 78] Initialize particle stream color synchronization
    // Particles match link color and glow with synergy intensity
    initializeParticleSynergyColors(link);
    updateParticleSynergyOpacity(link, link['synergyScore'] ?? 0.5);
    updateParticleSynergyEmissive(link, link['synergyScore'] ?? 0.5);
    
    // [Session 79] Initialize particle speed corruption scaling
    // Particles move fast on healthy links, slow on corrupted links
    const initialCorruption = link.corruptionLevel ?? 0;
    updateParticleCorruptionSpeed(link, initialCorruption);
    
    // ===== FINAL SAFETY ASSERTION: RESTORE NODE CORE MATERIALS =====
    // After all link creation code, restore node core materials to their original state
    // This ensures linking NEVER modifies node visuals
    sourceNode.userData._linkCreationProtected = false;
    targetNode.userData._linkCreationProtected = false;
    
    // Traverse nodes and restore core meshes to authoritative materials
    sourceNode.traverse(child => {
      if (child.isMesh) {
        const name = (child.name || '').toLowerCase();
        const isCore = name.includes('core') || name.includes('body') || name.includes('shell');
        const isNotUI = !name.includes('glyph') && !name.includes('outline') && !name.includes('aura');
        
        if (isCore && isNotUI) {
          // Restore to authoritative material
          child.material = sourceCoreMaterial;
          // Force material properties locked
          if (child.material) {
            child.material.transparent = false;
            child.material.opacity = 1.0;
            child.material.depthWrite = true;
            child.material.depthTest = true;
          }
        }
      }
    });
    
    targetNode.traverse(child => {
      if (child.isMesh) {
        const name = (child.name || '').toLowerCase();
        const isCore = name.includes('core') || name.includes('body') || name.includes('shell');
        const isNotUI = !name.includes('glyph') && !name.includes('outline') && !name.includes('aura');
        
        if (isCore && isNotUI) {
          // Restore to authoritative material
          child.material = targetCoreMaterial;
          // Force material properties locked
          if (child.material) {
            child.material.transparent = false;
            child.material.opacity = 1.0;
            child.material.depthWrite = true;
            child.material.depthTest = true;
          }
        }
      }
    });
    
    console.log(`✓ Link created: ${sourceNode.userData.category} → ${targetNode.userData.category}${isSpecial ? ' [MULTI-OUTPUT]' : ''} [SAFE VFX PACK ACTIVE] [Synergy: ${(link['synergyScore'] || 0).toFixed(2)}]`);
  }
  
  /**
   * Create shatter effect for broken link
   * 
   * FIXED (Session 37+ Part 2): Converted requestAnimationFrame loop to orchestrator effects.
   * Now driven by deltaTime instead of hard-coded 0.016 delta and performance.now().
   */
     finally {
      restoreNodeCoreState(sourceNode);
      restoreNodeCoreState(targetNode);
    }
  }

  createLinkBreakEffect(link) {
    const startPos = link.source.position;
    const endPos = link.target.position;
    const midPos = startPos.clone().add(endPos).multiplyScalar(0.5);
    
    // Create shatter particles
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: link.color,
        transparent: true,
        opacity: 0.9
      });
      
      const particle = new THREE.Mesh(geometry, material);
      tagAllowedSphere(particle, { role: 'vfx', source: 'NodeLinkingSystem.createLinkBreakEffect' });
      clampSphere(particle);
      particle.position.copy(midPos);
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      );
      
      this.scene.add(particle);
      
      // Register with orchestrator instead of requestAnimationFrame
      if (this.effectOrchestrator) {
        const effect = {
          id: `shatter-particle-${Date.now()}-${i}`,
          type: 'shatterParticle',
          elapsed: 0,
          duration: 0.5, // 500ms in game time
          particle: particle,
          velocity: velocity,
          
          update: (dt, time) => {
            const progress = Math.min(this.elapsed / this.duration, 1);
            
            // Move particle with velocity
            particle.position.add(velocity.clone().multiplyScalar(dt));
            
            // Fade out
            particle.material.opacity = 0.9 * (1 - progress);
            
            return { done: progress >= 1 };
          },
          
          dispose: () => {
            this.scene.remove(particle);
            particle.geometry.dispose();
            particle.material.dispose();
          }
        };
        
        this.effectOrchestrator.add(effect);
      } else {
        // Fallback: immediate cleanup
        this.scene.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
      }
    }
  }
  
  /**
   * Create error feedback for invalid connection
   * 
   * FIXED (Session 37+ Part 2): Converted requestAnimationFrame loop to orchestrator effect.
   * Now driven by deltaTime instead of performance.now() wall-clock timing.
   */
  createErrorFeedback(node, errorType) {
    const colors = {
      'incompatible': 0xff0000,     // Red
      'conflict': 0xffaa00,         // Yellow
      'broken': 0xff0000            // Red
    };
    
    const color = colors[errorType] || 0xff0000;
    
    // Create error pulse at node
    const pulseGeometry = new THREE.RingGeometry(0.5, 0.7, 32);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: color,
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
      const durationSeconds = errorType === 'conflict' ? 1.0 : 0.5;
      
      const effect = {
        id: `error-feedback-${Date.now()}`,
        type: 'errorFeedback',
        elapsed: 0,
        duration: durationSeconds,
        pulse: pulse,
        errorType: errorType,
        
        update: (dt, time) => {
          const progress = Math.min(this.elapsed / this.duration, 1);
          
          if (errorType === 'conflict') {
            // Yellow pulse: soft oscillation
            const oscillation = Math.sin(progress * Math.PI * 4);
            pulse.scale.setScalar(1 + oscillation * 0.2);
            pulse.material.opacity = 0.8 * (1 - progress * 0.5);
          } else {
            // Red pulse: quick flash
            pulse.scale.setScalar(1 + progress * 0.3);
            pulse.material.opacity = 0.8 * (1 - progress);
          }
          
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
      // Fallback: immediate cleanup
      console.warn('[NodeLinkingSystem] effectOrchestrator not available for error feedback');
      this.scene.remove(pulse);
      pulse.geometry.dispose();
      pulse.material.dispose();
    }
  }
  

  /**
   * Check if a node is valid and ready for linking
   * @private
   */
  _isValidNodeForLink(node) {
    if (!node) return false;
    if (!node.position) return false;
    // Position should be a Vector3-like object with x, y, z
    if (typeof node.position.x !== 'number' || 
        typeof node.position.y !== 'number' || 
        typeof node.position.z !== 'number') {
      return false;
    }
    return true;
  }

  /**
   * EXTREME EDITION: Update link Bézier curve geometry (all layers + veins)
   * Handles 4-core structure + energy veins + edge blades
   */
  updateLinkCurve(link) {
    // [BRAIDED CONDUIT] Handled by updateLinkAnimations/update loop directly for non-extreme links
    if (this.conduitRenderer && !link.extremeMode) {
      return; 
    }

    // [Audit 6.2] World not ready - skip update
    if (!this.worldReady) {
      return;
    }
    
    // [LinkGuard] Early return if link or nodes are invalid
    if (!link || !link.source || !link.target) {
      return;
    }
    
    // [Audit 6.2] Parent check - nodes must be in scene
    if (!link.source.parent || !link.target.parent) {
      return;
    }
    
    if (!this._isValidNodeForLink(link.source) || !this._isValidNodeForLink(link.target)) {
      return;
    }
    
    // [Audit 6.2] 1-frame delay on newly created links
    if (link._justCreated) {
      link._justCreated = false;
      return;  // Skip first frame, retry next frame
    }
    
    const start = link.source.position;
    const end = link.target.position;
    
    // Dynamic control point for natural arc
    const distance = start.distanceTo(end);
    const arcHeight = Math.max(1.5, distance * 0.2);
    
    const midPoint = new THREE.Vector3(
      (start.x + end.x) / 2,
      Math.max(start.y, end.y) + arcHeight,
      (start.z + end.z) / 2
    );
    
    // Generate curve points (EXTREME: more points for smoothness)
    const pointCount = link.isSpecial ? 120 : 100;
    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
    const points = curve.getPoints(pointCount);
    
    // Build position array for all curves
    const positions = new Float32Array(points.length * 3);
    points.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    });
    
    // Update ALL core layers (EXTREME multi-layer structure)
    if (link.coreLine && link.coreLine.geometry) {
      link.coreLine.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions.slice(), 3)
      );
    }
    
    if (link.midGlowLine && link.midGlowLine.geometry) {
      link.midGlowLine.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions.slice(), 3)
      );
    }
    
    if (link.haloLine && link.haloLine.geometry) {
      link.haloLine.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions.slice(), 3)
      );
    }
    
    if (link.bloomAuraLine && link.bloomAuraLine.geometry) {
      link.bloomAuraLine.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions.slice(), 3)
      );
    }
    
    // Update neon edge blade
    if (link.edgeLine && link.edgeLine.geometry) {
      link.edgeLine.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions.slice(), 3)
      );
    }
    
    // Update energy veins (animated inside)
    if (link.veins && link.veins.length > 0) {
      link.veins.forEach(vein => {
        if (vein.geometry) {
          vein.geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(positions.slice(), 3)
          );
        }
      });
    }
    
    // Update all VFX overlay curves to match main curve
    if (link.vfxEnabled) {
      // Update glow layers
      if (link.glowData && link.glowData.lines) {
        link.glowData.lines.forEach(line => {
          line.geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(positions.slice(), 3)
          );
        });
      }
      
      // Update edge highlights
      if (link.edgeHighlights && link.edgeHighlights.userData.line) {
        link.edgeHighlights.userData.line.geometry.setAttribute(
          'position',
          new THREE.BufferAttribute(positions.slice(), 3)
        );
      }
    }
    
    // Store curve for particle movement
    link.curve = curve;
    
    // Update arrow direction (skip if disabled)
    if (link.arrow && !link.arrow.userData.disabled) {
      const tangent = curve.getTangent(1);
      link.arrow.position.copy(end);
      link.arrow.lookAt(end.clone().add(tangent));
      link.arrow.rotateX(-Math.PI / 2);
    }
  }
  
  /**
   * Update all links - positions, animations, and traffic simulation
   */
  update(deltaTime, time) {
    if (!this._picDiagUpdateLogged) {
      console.error('[PicDiag] NodeLinkingSystem.update entered', { worldReady: this.worldReady, links: this.links?.length || 0 });
      this._picDiagUpdateLogged = true;
    }
    // [Audit 6.2] Skip update if world not ready (during world transitions)
    if (!this.worldReady) {
      return;
    }

    // Update neon edge glow time for selection highlights
    if (this.selectedNodeHighlight?.material) {
      updateNeonEdgeGlowTime(this.selectedNodeHighlight.material, deltaTime);
    }
    for (const highlight of this.multiSelectHighlights.values()) {
      if (highlight?.material) {
        updateNeonEdgeGlowTime(highlight.material, deltaTime);
      }
    }

    // Update link state visual language time
    if (this.linkStateVisualLanguage) {
      this.linkStateVisualLanguage.updateAnimationTime(time);
    }

    // [LinkAudit] Aggregate link/curve/bead/spark state (throttled 1s) when enabled
    if (typeof window !== 'undefined' && window.__DEBUG_LINK_CURVE_AUDIT__ === true) {
      const now = Date.now();
      if (now - (this._linkCurveAuditLastLog || 0) >= 1000) {
        let total = 0, missingGroup = 0, missingCurve = 0, missingBeads = 0, missingSparks = 0;
        const links = this.links || [];
        for (const link of links) {
          total++;
          const group = link?.group;
          if (!group) missingGroup++;
          if (!link?.curve) missingCurve++;
          const conduitState = group?.userData?.conduitState;
          const beadsState = conduitState?.beads;
          const sparksState = conduitState?.sparks;
          if (!beadsState) missingBeads++;
          if (!sparksState) missingSparks++;
        }
        console.log(`[LinkAudit] total=${total} missingGroup=${missingGroup} missingCurve=${missingCurve} missingBeads=${missingBeads} missingSparks=${missingSparks}`);
        this._linkCurveAuditLastLog = now;
      }
    }

    // Phase B.4 – event-gated (no visual change)
    if (this.camera) {
      const posDist = this.camera.position.distanceToSquared(this._lastDirtyCameraPos);
      const rotAngle = this.camera.quaternion.angleTo(this._lastDirtyCameraQuat);
      const POS_EPS = 1e-7;
      const ROT_EPS = 1e-7;
      if (posDist > POS_EPS || rotAngle > ROT_EPS) {
        this._markCameraDirty();
        this._lastDirtyCameraPos.copy(this.camera.position);
        this._lastDirtyCameraQuat.copy(this.camera.quaternion);
      }
    }

    // (pending visuals removed — visuals are created synchronously)
    
    // [CORRUPTION CONTAGION v1.0] Process corruption spread every frame
    if (!this._contagionInitialized) {
      this._contagionInitialized = true;
      // Initialize contagion config on first run
      this._contagionConfig = {
        spreadThreshold: 0.60,        // Start spreading when >= 0.60
        maxSpreadRate: 0.15,          // Max corruption/second at full infection
        linkResistance: 0.8,          // Links reduce spread by 20% by default
        proximityBoost: 1.2,          // Multi-link infections boost spread
      };
    }
    
    // Process corruption contagion (every frame)
    this._updateCorruptionContagion(deltaTime);
    
    // categoryTransitionSystem removed (unused)

    // Conduit visuals are updated per-link below using frameState (single entry point)
    
    // [Session 112] Update animated link flow animations
    if (this.flowSystem) {
      this.flowSystem.animate(deltaTime, time);
    }
    
    // [LinkGuard] Collect dead links for cleanup after iteration
    const deadLinks = [];
    
    // Update real links
    this._frameIndex = (this._frameIndex || 0) + 1;
    this._linkMetricsFrame = (this._linkMetricsFrame || 0) + 1;
    this._linkMetricsCache.clear();
    this.links.forEach(link => {
      if (!link.active) return;
      
      // [LinkGuard] Check if source/target nodes are still valid
      if (!this._isValidNodeForLink(link.source) || !this._isValidNodeForLink(link.target)) {
        deadLinks.push(link);
        return;
      }
      
      // ===== HARD GUARD: PREVENT NODE VISUAL MUTATION DURING LINK UPDATE =====
      // Links MUST NEVER touch node core materials, opacity, colors, or geometry
      // This guard ensures links only animate themselves, never their connected nodes
      // Visual references may be locked by authority system - all mutations are safe
      
      // Pre-update: Store node visual state (defensive null-safe read)
      const sourceInitialOpacity = link.source?.material?.opacity ?? 1.0;
      const targetInitialOpacity = link.target?.material?.opacity ?? 1.0;
      
      // Update curve to follow node positions (smooth anchoring)
      this.updateLinkCurve(link);

      // Build per-link frameState once and drive conduit visuals (single entry)
      if (!this.conduitManagedByFrameScheduler && this.conduitRenderer) {
        const frameState = this._buildLinkFrameState(link, deltaTime, time);
        this.conduitRenderer.update(link, deltaTime, time, frameState);
      }
      
      // categoryTransitionSystem removed (unused)
      
      // Traffic simulation
      this.updateTrafficSimulation(link, deltaTime);
      
      // Visual animations (all mutations guarded internally)
      this.updateLinkAnimations(link, time, deltaTime);
      
      // [Session 77] Update synergy-driven link color transitions
      // Smoothly animates link color based on synergy value changes
      updateLinkColorTransition(link, deltaTime);
      
      // [Session 78] Update particle stream color transitions
      // Particles smoothly animate colors alongside link mesh
      updateParticleColorTransition(link, deltaTime);
      
      // [Dynamic Thickness v1.0] Update link thickness based on traffic load
      if (this.thicknessSystem && this.visualModules.thickness) {
        const metrics = this.getLinkMetricsSnapshot(link);
        this.thicknessSystem.updateLinkThickness(link.id, metrics.loadPressure ?? metrics.traffic ?? 0);
      }
      
      // ===== POST-UPDATE NODE PROTECTION: RESTORE NODE VISUALS =====
      // After all link animations, verify nodes haven't been modified
      // Links are SECONDARY and must not override nodes
      // Use defensive guards to safely restore node opacity if authorities allow
      if (link.source?.material && link.source.material.opacity !== sourceInitialOpacity) {
        visualMutationGuards.setMaterialOpacity(link.source.material, sourceInitialOpacity);
      }
      if (link.target?.material && link.target.material.opacity !== targetInitialOpacity) {
        visualMutationGuards.setMaterialOpacity(link.target.material, targetInitialOpacity);
      }
    });

    // Global pictogram tick (once per frame)
    if (!this.conduitManagedByFrameScheduler && this.conduitRenderer) {
      console.info('[PicDiag] pictogram tick requested', deltaTime);
      try {
        this.conduitRenderer.updatePictograms(deltaTime, time);
      } catch (err) {
        if (!this._picDiagErrorLogged) {
          console.error('[PicDiag] pictogram tick error', err);
          this._picDiagErrorLogged = true;
        }
      }
    }

    // Tick conduit-managed particle systems (trail + healing) so emitted particles animate
    if (!this.conduitManagedByFrameScheduler && this.conduitRenderer) {
      this.conduitRenderer.updateTrailParticles(deltaTime, time);
      this.conduitRenderer.updateHealingParticles(deltaTime, time);

      // Ensure interference controllers are fed with current node/link graph every visual frame.
      if (Array.isArray(this.aiNodes?.nodes) && this.conduitRenderer?.nodeInterferenceManager) {
        for (const node of this.aiNodes.nodes) {
          if (node) this.conduitRenderer.nodeInterferenceManager.registerNode(node);
        }
      }

      const networkMetrics = this.aiNodes?.nodeDynamicMetrics || this.nodeDynamicMetrics || {};
      const avgHarmony = Number.isFinite(networkMetrics.avgHarmony) ? networkMetrics.avgHarmony : 0.5;
      const avgCorruption = Number.isFinite(networkMetrics.avgCorruption) ? networkMetrics.avgCorruption : 0.0;
      const avgStability = Number.isFinite(networkMetrics.avgStability) ? networkMetrics.avgStability : 0.5;
      const avgInstability = Math.max(0, Math.min(1, 1 - avgStability));

      this.conduitRenderer.updateNodeInterference?.(
        this.links,
        avgHarmony,
        avgCorruption,
        avgInstability
      );
    }
    
    // [Dynamic Thickness v1.0] Animate all links toward target thickness values
    if (this.thicknessSystem && this.visualModules.thickness) {
      this.thicknessSystem.animateAllLinks(deltaTime);
    }
    
    // [LinkGuard] Clean up dead links after iteration (safe cleanup)
    // [Stab2] Now also validates by stable ID before removal
    deadLinks.forEach(link => {
      if (this.links.includes(link)) {
        // Double-check validity before removal
        if (!this.isLinkValid(link)) {
          console.warn('[LinkGuard] Removing invalid link', {
            source: link.source?.userData?.category || 'unknown',
            target: link.target?.userData?.category || 'unknown',
            sourceNodeId: link.sourceNodeId,
            targetNodeId: link.targetNodeId
          });
          this.removeLink(link);
        }
      }
    });
  }

  // Phase B.5 – FrameScheduler-driven node targeting tick (visual tier)
  processNodeTargeting() {
    if (!this.worldReady) return;
    this.updateCrosshairNodeTargeting();
    this.updateNodeHoverStates();

    // Debug-only: emit aggregated raycast cost stats on interval
    logRaycastCostSummary(this.renderer, this.aiNodes);

    // Dirty flags are no longer required for hover updates; keep them false to avoid stale gating
    this.linksDirty = false;
    this.nodesDirty = false;
    this.cameraDirty = false;
  }

  // Backward compatibility alias (no behavior change)
  processRaycast() {
    return this.processNodeTargeting();
  }

  /**
   * Build per-link frame state for visual systems (single source of metrics/time).
   */
  _buildLinkFrameState(link, deltaTime, time) {
    const seed = (link.userData && link.userData.ditherSeed !== undefined)
      ? link.userData.ditherSeed
      : (link.userData ? (link.userData.ditherSeed = Math.random()) : Math.random());

    const metrics = this.getLinkMetricsSnapshot(link);

    // Geometry snapshot (relies on updateLinkCurve just run)
    const curve = link.curve;
    const start = curve?.getPoint ? curve.getPoint(0).clone() : link.source?.position?.clone();
    const end = curve?.getPoint ? curve.getPoint(1).clone() : link.target?.position?.clone();
    const tangent = curve?.getTangent ? curve.getTangent(0.5).clone() : null;
    const length = curve?.getLength ? curve.getLength() : (start && end ? start.distanceTo(end) : 0);

    const frameIndex = this._frameIndex || 0;
    return {
      time: {
        visualTime: time ?? 0,
        visualDelta: deltaTime ?? 0,
        deltaTime,
        time,
        frameIndex,
        seed
      },
      metrics,
      geometry: {
        start,
        end,
        tangent,
        length,
        curve
      },
      cadence: {
        burst8: frameIndex % 8 === 0,
        burst16: frameIndex % 16 === 0,
        burst32: frameIndex % 32 === 0
      }
    };
  }

  /**
   * Per-frame metrics snapshot for a link (cache by frame).
   */
  getLinkMetricsSnapshot(link) {
    const linkId = link.id || link.uuid;
    const cached = this._linkMetricsCache.get(linkId);
    if (cached && cached.frame === this._linkMetricsFrame) {
      return cached.metrics;
    }

    const userData = link?.userData || {};
    const userMetrics = userData.metrics || {};
    const readMetric = (...values) => {
      for (const value of values) {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
      }
      return undefined;
    };

    const sourceCorruption = readMetric(
      link?.source?.userData?.metrics?.corruption,
      link?.sourceNode?.userData?.metrics?.corruption,
      link?.nodeA?.userData?.metrics?.corruption
    );
    const targetCorruption = readMetric(
      link?.target?.userData?.metrics?.corruption,
      link?.targetNode?.userData?.metrics?.corruption,
      link?.nodeB?.userData?.metrics?.corruption
    );
    const endpointCorruption =
      (typeof sourceCorruption === 'number' && typeof targetCorruption === 'number')
        ? Math.max(sourceCorruption, targetCorruption)
        : (sourceCorruption ?? targetCorruption);

    const sourceStability = readMetric(
      link?.source?.userData?.metrics?.stability,
      link?.sourceNode?.userData?.metrics?.stability,
      link?.nodeA?.userData?.metrics?.stability
    );
    const targetStability = readMetric(
      link?.target?.userData?.metrics?.stability,
      link?.targetNode?.userData?.metrics?.stability,
      link?.nodeB?.userData?.metrics?.stability
    );
    const endpointStability =
      (typeof sourceStability === 'number' && typeof targetStability === 'number')
        ? (sourceStability + targetStability) * 0.5
        : (sourceStability ?? targetStability);
    const stability = readMetric(
      userMetrics.stability,
      userData.stabilityLevel,
      userData.stability,
      link.stability,
      link.stabilityLevel,
      endpointStability
    );

    const metrics = {
      synergy: getLinkSynergy(link) ?? 0.5,
      harmony: readMetric(
        userData.harmonyLevel,
        userData.harmony,
        userMetrics.harmony,
        link.harmonyLevel,
        link.harmony
      ) ?? 1.0,
      corruption: readMetric(
        userMetrics.corruption,
        userData.corruption,
        userData.corruptionLevel,
        link.corruption,
        link.corruptionLevel,
        endpointCorruption,
        getLinkCorruption(link)
      ) ?? 0.0,
      instability: readMetric(
        userData.instabilityLevel,
        userData.instability,
        userMetrics.instability,
        link.instability,
        link.instabilityLevel,
        (typeof stability === 'number') ? (1 - stability) : undefined
      ) ?? 0.0,
      stability: stability ?? 0.5,
      traffic: readMetric(
        link.traffic?.load,
        userData.traffic?.load,
        userData.traffic,
        userMetrics.traffic
      ) ?? 0,
      loadPressure: readMetric(
        link.loadPressure,
        userData.loadPressure,
        userMetrics.loadPressure,
        link.traffic?.load,
        userData.traffic?.load
      ) ?? 0,
      quality: readMetric(
        link.quality,
        userData.quality?.score,
        userData.quality,
        userMetrics.quality
      ) ?? 0.5
    };

    this._linkMetricsCache.set(linkId, { frame: this._linkMetricsFrame, metrics });
    return metrics;
  }
  
  /**
   * Update crosshair targeting state (node targeting via raycast implementation)
   */
  updateCrosshairNodeTargeting() {
    const crosshairEl = document.getElementById('crosshair');
    const crosshairState = window.__crosshairRaycastState || (window.__crosshairRaycastState = {
      node: null,
      proxyHit: false,
      source: null,
      timestamp: 0
    }); // Crosshair raycasting is owned here; other systems must only read this state.
    if (!crosshairEl) {
      crosshairState.node = null;
      crosshairState.proxyHit = false;
      crosshairState.source = null;
      crosshairState.timestamp = (typeof performance !== 'undefined') ? performance.now() : Date.now();
      return;
    }

    // [SESSION 62B] HITPROXY_READY GATE - Prevent FPS death during startup
    // Prefer HITPROXY_READY but fall back to live registry presence
    const proxyList = window.hitProxySystem?.registry?.getAllProxies?.() || [];
    const proxiesAvailable = proxyList.length > 0;
    const ready = (window.HITPROXY_READY === true) || proxiesAvailable;
    if (!ready) {
      crosshairEl.classList.remove('targeting');
      crosshairState.node = null;
      crosshairState.proxyHit = false;
      crosshairState.source = null;
      crosshairState.timestamp = (typeof performance !== 'undefined') ? performance.now() : Date.now();
      return;
    }
    
    // Raycast from camera through center of screen
    const viewportCenter = new THREE.Vector2(0, 0);
    this.raycaster.setFromCamera(viewportCenter, this.camera);
    
    // [SESSION 62] SURGICAL FIX: Use ONLY hit-proxy meshes
    // Before: Collected all real meshes (cores, auras, glyphs) → raycast violations
    // After: Use registered hit-proxy meshes only → zero violations
    let proxyMeshes = [];
    if (window.hitProxySystem && window.hitProxySystem.registry) {
      proxyMeshes = window.hitProxySystem.registry.getAllProxies();
    }
    const totalProxies = proxyMeshes.length;
    const boundedProxies = this._filterNodeTargetingProxies(proxyMeshes);
    const candidateMeshes = this._filterRaycastCandidates(boundedProxies);
    
    // If no proxy system available, fall back safely
    if (candidateMeshes.length === 0) {
      crosshairEl.classList.remove('targeting');
      crosshairState.node = null;
      crosshairState.proxyHit = false;
      crosshairState.source = null;
      crosshairState.timestamp = (typeof performance !== 'undefined') ? performance.now() : Date.now();
      return;
    }

    // Frequency gate: limit crosshair raycasts based on camera motion
    const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    const posDist = this.camera.position.distanceToSquared(this.lastCrosshairCameraPos);
    const rotAngle = this.camera.quaternion.angleTo(this.lastCrosshairCameraQuat);
    const MOVEMENT_EPS = 0.0001; // small epsilon for motion detection
    const ROTATION_EPS = 0.00005;
    const cameraMoving = (posDist > MOVEMENT_EPS || rotAngle > ROTATION_EPS);
    const minInterval = cameraMoving ? 100 : 33; // ms
    if (now - this.lastCrosshairRaycastTime < minInterval) {
      this.crosshairRaycastStats.skipped++;
      recordRaycastCost('proxy_raycast', 0, 'crosshair', { path: 'gated_skip' });
      return;
    }
    
    // ASSERTION: Verify ALL objects are hit-proxies (dev-only audit)
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      for (const mesh of proxyMeshes) {
        console.assert(
          mesh.userData?.isHitProxy === true,
          `[RAYCAST AUDIT] Non-proxy in crosshair targeting: ${mesh.name}`
        );
      }
    }
    
    // Raycast ONLY against hit-proxy meshes
    const proxyStart = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    const intersects = this.raycaster.intersectObjects(candidateMeshes, false);
    const proxyElapsed = (typeof performance !== 'undefined')
      ? (performance.now() - proxyStart)
      : (Date.now() - proxyStart);
    recordRaycastCost('proxy_raycast', proxyElapsed, 'crosshair', { path: 'proxy' });

    const resolveStart = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    const filtered = filterRaycastIntersections(intersects);
    const resolveElapsed = (typeof performance !== 'undefined')
      ? (performance.now() - resolveStart)
      : (Date.now() - resolveStart);
    recordRaycastCost('resolve_hit', resolveElapsed, 'crosshair', { path: 'proxy' });
    this._recordRaycastProfile({
      totalLinks: totalProxies,
      candidates: candidateMeshes.length,
      coarsePassed: filtered.length,
      fineTests: intersects.length,
      hit: filtered.length > 0,
      ms: proxyElapsed + resolveElapsed
    });
    
    // Resolve node from proxy hit (if any)
    let resolvedNode = null;
    if (filtered.length > 0) {
      const nodeId = filtered[0].object?.userData?.targetNodeId || filtered[0].nodeId;
      if (nodeId && this.aiNodes?.nodes) {
        resolvedNode = this.aiNodes.nodes.find(n => {
          const identity = (typeof window !== 'undefined' && window.getNodeIdentity)
            ? window.getNodeIdentity(n)
            : (n.userData?.id || n.userData?.nodeId || n.uuid);
          return identity === nodeId || n.userData?.id === nodeId || n.userData?.nodeId === nodeId;
        }) || null;
      }
    }

    // Check if we're targeting a node
    const isTargetingNode = filtered.length > 0;
    
    // Update crosshair visual state
    if (isTargetingNode) {
      crosshairEl.classList.add('targeting');
    } else {
      crosshairEl.classList.remove('targeting');
    }

    // Publish shared crosshair raycast state
    crosshairState.node = resolvedNode;
    crosshairState.proxyHit = true;
    crosshairState.source = 'proxy';
    crosshairState.timestamp = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    this.lastCrosshairRaycastTime = now;
    this.lastCrosshairCameraPos.copy(this.camera.position);
    this.lastCrosshairCameraQuat.copy(this.camera.quaternion);
    this.crosshairRaycastStats.executed++;
  }

  // Backward compatibility alias (no behavior change)
  updateCrosshairTargeting() {
    return this.updateCrosshairNodeTargeting();
  }
  
  /**
   * Trigger crosshair pulse feedback (called on link creation/removal/incompatibility)
   */
  triggerCrosshairPulse(type = 'success') {
    const crosshairEl = document.getElementById('crosshair');
    if (!crosshairEl) return;
    
    // Remove animation class if it exists to retrigger
    crosshairEl.classList.remove('link-feedback');
    
    // Remove any variant classes
    crosshairEl.classList.remove('link-feedback-warning');
    
    // Force reflow to restart animation
    void crosshairEl.offsetWidth;
    
    // Add animation class with optional variant
    crosshairEl.classList.add('link-feedback');
    if (type === 'warning') {
      crosshairEl.classList.add('link-feedback-warning');
    }
    
    // Remove after animation completes
    setTimeout(() => {
      crosshairEl.classList.remove('link-feedback');
      crosshairEl.classList.remove('link-feedback-warning');
    }, 400);
  }
  
  /**
   * Update traffic simulation for link
   */
  updateTrafficSimulation(link, deltaTime) {
    const traffic = link.traffic;
    
    // Simulate traffic load fluctuation
    const loadChange = (Math.random() - 0.5) * 0.1 * deltaTime;
    traffic.load = Math.max(0.1, Math.min(1, traffic.load + loadChange));
    
    // Throughput affects pulse speed
    traffic.throughput = 0.3 + traffic.load * 0.7;
    
    // Bottleneck detection (high load, low throughput)
    traffic.bottleneck = traffic.load > 0.8 && traffic.throughput < 0.5;
    
    // Priority affects visual emphasis
    traffic.priority = Math.max(0.2, Math.min(1, traffic.priority + (Math.random() - 0.5) * 0.05));
  }
  
  /**
   * Update all 10 SAFE VFX effects for link (Effect animations)
   */
  updateLinkVFXEffects(link, time, deltaTime) {
    if (!link.vfxEnabled || !link.curve) return;
    
    // [LinkGuard] Verify nodes are still valid before accessing positions
    if (!this._isValidNodeForLink(link.source) || !this._isValidNodeForLink(link.target)) {
      return;
    }
    
    const traffic = link.traffic;
    const start = link.source.position;
    const end = link.target.position;
    
    // Effect #1: Multi-layer glow pulsing
    // Defensive guard: verify materials exist before mutation (authority locks)
    if (link.glowData && link.glowData.materials) {
      const glowPulse = Math.sin(time * 2) * 0.3 + 0.7;
      link.glowData.materials.forEach((mat, idx) => {
        if (!mat) return;
        const baseOpacity = [0.15, 0.08, 0.04][idx] * link.glowData.synergy;
        visualMutationGuards.setMaterialOpacity(mat, baseOpacity * glowPulse * (0.5 + traffic.load * 0.5));
      });
    }
    
    // Effect #2: Energy pulse travel along curve
    // Defensive guard: verify pulse mesh exists before mutation (authority locks)
    if (link.energyPulse && link.energyPulse.userData) {
      const pulseData = link.energyPulse.userData;
      pulseData.progress += deltaTime * pulseData.speed * (0.5 + traffic.throughput);
      if (pulseData.progress > 1) pulseData.progress = 0;
      
      const pulsePoint = link.curve.getPoint(pulseData.progress);
      if (link.energyPulse.position) {
        link.energyPulse.position.copy(pulsePoint);
      }
      
      // Size pulses with traffic
      // Defensive guard: verify scale exists before mutation (authority locks)
      const pulseScale = 1 + Math.sin(time * 5) * 0.3 + traffic.load * 0.2;
      if (link.energyPulse.scale) {
        visualMutationGuards.setMeshScale(link.energyPulse, pulseScale);
      }
      
      // Fade at curve ends
      // Defensive guard: verify mesh material exists before mutation (authority locks)
      const fadeIn = Math.min(1, pulseData.progress * 3);
      const fadeOut = Math.min(1, (1 - pulseData.progress) * 3);
      if (link.energyPulse.userData.mesh?.material) {
        visualMutationGuards.setMaterialOpacity(link.energyPulse.userData.mesh.material, 0.8 * fadeIn * fadeOut);
      }
    }
    
    // Effect #3: Holographic circuit shimmer
    // Defensive guard: verify circuit nodes and materials before mutation (authority locks)
    if (link.circuitOverlay && link.circuitOverlay.userData.nodes) {
      link.circuitOverlay.userData.animationPhase += deltaTime * traffic.throughput * 2;
      const nodes = link.circuitOverlay.userData.nodes;
      
      nodes.forEach((node, idx) => {
        if (!node) return;
        const progress = (idx / nodes.length + link.circuitOverlay.userData.animationPhase * 0.5) % 1;
        const circuitPoint = link.curve.getPoint(progress);
        if (node.position) {
          node.position.copy(circuitPoint);
        }
        
        // Shimmer effect
        // Defensive guard: verify material exists before mutation (authority locks)
        const shimmer = Math.sin(link.circuitOverlay.userData.animationPhase + idx) * 0.3 + 0.5;
        if (node.material) {
          visualMutationGuards.setMaterialOpacity(node.material, shimmer * traffic.load * 0.4);
        }
      });
    }
    
    // Effect #4: Edge highlights shimmer
    // Defensive guard: verify material exists before mutation (authority locks)
    if (link.edgeHighlights && link.edgeHighlights.userData) {
      link.edgeHighlights.userData.shimmerPhase += deltaTime * 3;
      const shimmerEffect = Math.sin(link.edgeHighlights.userData.shimmerPhase) * 0.2 + 0.3;
      if (link.edgeHighlights.userData.material) {
        visualMutationGuards.setMaterialOpacity(link.edgeHighlights.userData.material, shimmerEffect * traffic.load);
      }
    }
    
    // Effect #5: Soft particle stream flow
    // Defensive guard: verify particle materials before mutation (authority locks)
    if (link.particleStream && link.particleStream.userData.particles) {
      const particles = link.particleStream.userData.particles;
      const flowSpeed = link.particleStream.userData.flowSpeed;
      
      particles.forEach(particle => {
        if (!particle) return;
        const pData = particle.userData;
        pData.progress += deltaTime * pData.speed * flowSpeed;
        if (pData.progress > 1) pData.progress -= 1;
        
        const streamPoint = link.curve.getPoint(pData.progress);
        if (particle.position) {
          particle.position.copy(streamPoint);
        }
        
        const fadeIn = Math.min(1, pData.progress * 4);
        const fadeOut = Math.min(1, (1 - pData.progress) * 4);
        if (particle.material) {
          visualMutationGuards.setMaterialOpacity(particle.material, 0.6 * fadeIn * fadeOut * traffic.load);
        }
      });
    }
    
    // Effect #6: Quantum shimmer effect (for quantum nodes)
    // Defensive guard: verify shimmer materials before mutation (authority locks)
    if (link.quantumEffects && link.quantumEffects.userData.shimmers) {
      link.quantumEffects.userData.distortionPhase += deltaTime * 2;
      const shimmers = link.quantumEffects.userData.shimmers;
      
      shimmers.forEach(shimmer => {
        if (!shimmer) return;
        const sData = shimmer.userData;
        const midProgress = 0.5;
        const midPoint = link.curve.getPoint(midProgress);
        
        const orbitRadius = sData.distance + Math.sin(link.quantumEffects.userData.distortionPhase + sData.phase) * 0.1;
        const angle = sData.angle + link.quantumEffects.userData.distortionPhase;
        
        if (shimmer.position) {
          shimmer.position.x = midPoint.x + Math.cos(angle) * orbitRadius;
          shimmer.position.y = midPoint.y + Math.sin(angle) * orbitRadius * 0.5;
          shimmer.position.z = midPoint.z + Math.sin(angle) * orbitRadius;
        }
        
        const opacity = 0.1 + Math.sin(link.quantumEffects.userData.distortionPhase + sData.index) * 0.15;
        if (shimmer.material) {
          visualMutationGuards.setMaterialOpacity(shimmer.material, opacity);
        }
      });
    }
    
    // Effect #7: Sigma glitch effects (for Sigma nodes)
    // Defensive guard: verify fracture materials before mutation (authority locks)
    if (link.sigmaEffects && link.sigmaEffects.userData.fractures) {
      link.sigmaEffects.userData.anomalyPhase += deltaTime * 4;
      const fractures = link.sigmaEffects.userData.fractures;
      
      fractures.forEach(fracture => {
        if (!fracture) return;
        const fData = fracture.userData;
        const glitchChance = Math.random();
        const glitchPos = 0.2 + (fData.index / fractures.length) * 0.6;
        
        if (glitchChance < 0.3) {
          const glitchPoint = link.curve.getPoint(glitchPos);
          if (fracture.position) {
            fracture.position.copy(glitchPoint);
            fracture.position.x += (Math.random() - 0.5) * 0.1;
          }
          
          const glitchIntensity = Math.sin(link.sigmaEffects.userData.anomalyPhase + fData.index) * 0.5 + 0.3;
          if (fracture.material) {
            visualMutationGuards.setMaterialOpacity(fracture.material, glitchIntensity * traffic.load * 0.5);
          }
        }
      });
    }
    
    // Effect #8: Intensity-based thickness (static linewidth to avoid shader churn)
    if (link.coreLine?.material && 'linewidth' in link.coreLine.material) {
      setStaticLinewidth(link.coreLine.material, link.baseThickness);
    }
    if (link.haloLine?.material && 'linewidth' in link.haloLine.material) {
      setStaticLinewidth(link.haloLine.material, (link.baseThickness + 3));
    }
    
    // Effect #9: Hover interaction (checked externally via raycasting)
    // Defensive guard: verify highlight material before mutation (authority locks)
    if (link.hoveredState && link.hoverHighlight?.material) {
      visualMutationGuards.setMaterialOpacity(link.hoverHighlight.material, Math.sin(time * 6) * 0.2 + 0.4);
    }
    
    // Effect #10: Environment reactivity (soft light projection)
    // Defensive guard: verify light exists before mutation (authority locks)
    if (link.environmentLight) {
      const midPoint = link.curve.getPoint(0.5);
      if (link.environmentLight.position) {
        link.environmentLight.position.copy(midPoint);
      }
      if ('intensity' in link.environmentLight) {
        link.environmentLight.intensity = 0.3 + traffic.load * 0.2;
      }
    }
  }
  
  /**
   * Update link visual animations
   */
  updateLinkAnimations(link, time, deltaTime) {
    const setStaticLinewidth = (mat, value) => {
      if (!mat || typeof mat.linewidth === 'undefined') return;
      if (mat._baseLinewidth === undefined) mat._baseLinewidth = value;
      mat.linewidth = mat._baseLinewidth;
    };
    // [Phase 2] Update Emission Pulsing (Logic Calculation)
    // This calculates the pulse wave (0-1) and stores it in link.userData.emissionPulse
    // We do this BEFORE the renderer update so the renderer has fresh data
    if (LinkEmissionPulsingSystem) {
      // Use traffic load as the driver for pulse intensity/frequency
      LinkEmissionPulsingSystem.updateLinkEmissionPulsing(link, link.traffic.load, deltaTime);
    }

    // [BRAIDED CONDUIT] Delegate animation only when frame-scheduler path owns conduit updates.
    if (this.conduitRenderer && !link.extremeMode && this.conduitManagedByFrameScheduler) {
      this.conduitRenderer.update(link, deltaTime, time);
      return;
    }

    // [LinkGuard] Quick check if curve is available
    if (!link.curve) return;
    
    // [Metrics Integration v1.0] Wire existing metrics into visual system
    // Reads from: corruption engine, synergy computation, harmony stabilization
    // No computation happens here - purely wiring existing values
    if (link.id) {
      const metrics = {
        // Corruption from existing corruption state or transmission engine
        corruption: link.corruptionLevel ?? link.corruptionIntensity ?? 0,
        // Synergy from existing computation engine
        synergy: link['synergyScore'] ?? 0,
        // Harmony from existing stabilization system
        harmony: link.harmonyScore ?? 0
      };
      
      // Pass to visual system (applies color, pulse, emissive based on metrics)
      this.updateLinkMetrics(link, metrics);
    }
    
    const traffic = link.traffic;
    const anim = link.animation;
    
    // Pulse animation based on throughput
    anim.pulsePhase += deltaTime * traffic.throughput * 3;
    const pulseIntensity = Math.sin(anim.pulsePhase) * 0.3 + 0.7;
    
    // Line thickness based on traffic load (simulated with opacity)
    // Defensive guard: verify material exists before mutation (authority locks)
    const baseOpacity = 0.4 + traffic.load * 0.4;
    if (link.coreLine?.material) {
      visualMutationGuards.setMaterialOpacity(link.coreLine.material, baseOpacity * pulseIntensity);
    }
    
    // Halo pulsing
    // Defensive guard: verify material exists before mutation (authority locks)
    const haloIntensity = Math.sin(anim.pulsePhase * 0.5) * 0.15 + 0.2;
    if (link.haloLine?.material) {
      visualMutationGuards.setMaterialOpacity(link.haloLine.material, haloIntensity * traffic.load);
    }
    
    // Bottleneck warning - orange tint
    // Defensive guard: verify material exists before mutation (authority locks)
    if (traffic.bottleneck) {
      if (link.coreLine?.material) visualMutationGuards.setMaterialColor(link.coreLine.material, 0xff8800);
      if (link.haloLine?.material) visualMutationGuards.setMaterialColor(link.haloLine.material, 0xff8800);
    } else {
      if (link.coreLine?.material) visualMutationGuards.setMaterialColor(link.coreLine.material, link.color);
      if (link.haloLine?.material) visualMutationGuards.setMaterialColor(link.haloLine.material, link.color);
    }
    
    // Animate traffic particles along curve
    // Defensive guard: verify particle material before mutation (authority locks)
    if (link.curve && link.particles && Array.isArray(link.particles)) {
      link.particles.forEach(particle => {
        if (!particle || !particle.userData) return;
        const pData = particle.userData;
        
        // Move along curve based on throughput
        pData.progress += deltaTime * pData.speed * traffic.throughput;
        if (pData.progress > 1) pData.progress = 0;
        
        // Position on curve
        const point = link.curve.getPoint(pData.progress);
        if (point) {
          particle.position.copy(point);
        }
        
        // Fade in/out at ends
        // Defensive guard: verify material exists before mutation (authority locks)
        const fadeIn = Math.min(1, pData.progress * 5);
        const fadeOut = Math.min(1, (1 - pData.progress) * 5);
        if (particle.material) {
          visualMutationGuards.setMaterialOpacity(particle.material, 0.8 * fadeIn * fadeOut * traffic.load);
        }
        
        // Scale based on traffic priority
        // Defensive guard: verify scale property exists before mutation (authority locks)
        const scale = 0.8 + traffic.priority * 0.4;
        if (particle.scale) {
          visualMutationGuards.setMeshScale(particle, scale);
        }
      });
    }
    
    // Arrow pulse (skip if disabled)
    // Defensive guard: verify arrow and material before mutation (authority locks)
    const arrowPulse = Math.sin(time * 4) * 0.2 + 1;
    if (link.arrow && !link.arrow.userData?.disabled) {
      if (link.arrow.scale) {
        visualMutationGuards.setMeshScale(link.arrow, arrowPulse * (0.8 + traffic.load * 0.4));
      }
      if (link.arrow.material) {
        visualMutationGuards.setMaterialOpacity(link.arrow.material, 0.7 + pulseIntensity * 0.3);
      }
    }
    
    // ========== EXTREME LINK EDITION ANIMATIONS ==========
    
    // EXTREME: Update all 4-core layers with traffic-based intensity
    if (link.extremeMode) {
      const coreIntensity = 0.7 + traffic.load * 0.25;
      const glowMultiplier = 1 + Math.sin(time * 2) * 0.15;
      
      // Core 1: Inner Neon Core
      if (link.coreLine && link.coreLine.material) {
        link.coreLine.material.opacity = (link.isSpecial ? 0.95 : 0.85) * coreIntensity * glowMultiplier;
        setStaticLinewidth(link.coreLine.material, (link.isSpecial ? 12 : 10));
      }
      
      // Core 2: Mid Glow Layer
      if (link.midGlowLine && link.midGlowLine.material) {
        link.midGlowLine.material.opacity = (link.isSpecial ? 0.45 : 0.35) * coreIntensity * glowMultiplier;
        setStaticLinewidth(link.midGlowLine.material, (link.isSpecial ? 20 : 16));
      }
      
      // Core 3: Outer Halo
      if (link.haloLine && link.haloLine.material) {
        link.haloLine.material.opacity = (link.isSpecial ? 0.25 : 0.15) * glowMultiplier;
        setStaticLinewidth(link.haloLine.material, (link.isSpecial ? 32 : 28));
      }
      
      // Core 4: Extreme Bloom Aura (20-30% bloom boost)
      if (link.bloomAuraLine && link.bloomAuraLine.material) {
        const bloomBoost = 1.25; // 25% bloom intensity increase
        link.bloomAuraLine.material.opacity = ((link.isSpecial ? 0.12 : 0.08) * bloomBoost) * glowMultiplier;
        setStaticLinewidth(link.bloomAuraLine.material, (link.isSpecial ? 48 : 40));
      }
    }
    
    // EXTREME: Energy Vein Animation (fast-moving streaks inside beam)
    if (link.veins && link.veins.length > 0 && link.veinAnimation && link.veinAnimation.active) {
      anim.veinPhase += deltaTime * link.veinAnimation.speed * traffic.throughput;
      
      link.veins.forEach((vein, veinIdx) => {
        if (vein.material) {
          const veinData = vein.userData;
          const veinProgress = (anim.veinPhase + veinData.phaseOffset) % (Math.PI * 2);
          
          // Oscillate vein opacity based on traffic and phase
          const veinOpacity = 0.3 + Math.sin(veinProgress) * 0.2 + traffic.load * 0.1;
          vein.material.opacity = veinOpacity;
          setStaticLinewidth(vein.material, 1);
        }
      });
    }
    
    // EXTREME: Neon Edge Blade animation
      if (link.edgeLine && link.edgeLine.material && link.edgeBladeActive) {
        anim.edgePulse += deltaTime * 2;
        const edgeIntensity = 0.5 + Math.sin(anim.edgePulse) * 0.15 + traffic.load * 0.1;
        link.edgeLine.material.opacity = edgeIntensity;
      
      // Add hover boost to edge blade
        if (link.hoveredState) {
          anim.hoverBoost = Math.min(anim.hoverBoost + deltaTime * 2, 0.3);
        } else {
          anim.hoverBoost = Math.max(anim.hoverBoost - deltaTime * 2, 0);
        }
        link.edgeLine.material.opacity += anim.hoverBoost;
        setStaticLinewidth(link.edgeLine.material, (link.isSpecial ? 3 : 2));
      }
    
    // EXTREME: Bloom Phase animation
    anim.bloomPhase += deltaTime * traffic.throughput * 1.5;
    
    // EXTREME: Enhanced particle movement and size
    if (link.curve && link.particles && Array.isArray(link.particles) && link.particles.length > 0) {
      link.particles.forEach((particle, idx) => {
        if (!particle || !particle.userData) return;
        const pData = particle.userData;
        
        // Faster movement for extreme mode
        pData.progress += deltaTime * pData.speed * traffic.throughput * 1.3;
        if (pData.progress > 1) pData.progress = 0;
        
        const point = link.curve.getPoint(pData.progress);
        if (point) {
          particle.position.copy(point);
        }
        
        // Pulse on node arrival
        const nodeDistStart = Math.abs(pData.progress - 0.05);
        const nodeDistEnd = Math.abs(pData.progress - 0.95);
        const nodeProximity = 1 - Math.min(nodeDistStart, nodeDistEnd) / 0.1;
        
        const baseScale = link.isSpecial ? 0.16 : 0.12;
        const expandScale = Math.max(1, nodeProximity * 1.5);
        particle.scale.setScalar(baseScale * expandScale);
        
        // Fade in/out at ends
        const fadeIn = Math.min(1, pData.progress * 5);
        const fadeOut = Math.min(1, (1 - pData.progress) * 5);
        if (particle.material) {
          particle.material.opacity = 0.85 * fadeIn * fadeOut * traffic.load;
          particle.material.emissiveIntensity = 0.5 + nodeProximity * 0.3;
        }
      });
    }
    
    // EXTREME: Arrow rotation and scale (skip if disabled)
    if (link.arrow && !link.arrow.userData.disabled && link.arrow.material) {
      const arrowExtremeScale = arrowPulse * (0.9 + traffic.load * 0.5) * (1 + Math.sin(time * 5) * 0.1);
      link.arrow.scale.setScalar(arrowExtremeScale);
      link.arrow.material.opacity = 0.85 + pulseIntensity * 0.2;
      link.arrow.material.emissiveIntensity = 0.6 + traffic.load * 0.2;
    }
    
    // EXTREME: Accent rings animation for special nodes
    if (link.isSpecial && link.group && link.group.children) {
      link.group.children.forEach(child => {
        if (child.userData && child.userData.vfxType === 'extremeRing') {
          const ringRotation = time * 0.8;
          child.rotation.z = ringRotation;
          if (child.material) {
            child.material.opacity = 0.6 + Math.sin(time * 3) * 0.2;
          }
        }
        if (child.userData && child.userData.vfxType === 'extremePulseRing') {
          const pulseRingScale = 1 + Math.sin(time * 4 + Math.PI) * 0.15;
          child.scale.setScalar(pulseRingScale);
          if (child.material) {
            child.material.opacity = 0.3 + Math.sin(time * 4) * 0.15;
          }
        }
      });
    }
    
    // Update all 10 VFX effects
    this.updateLinkVFXEffects(link, time, deltaTime);
  }
  
  /**
   * Update active visual effects
   */
  updateActiveEffects(deltaTime) {
    const effectsToRemove = [];
    
    this.activeEffects.forEach(effect => {
      const elapsed = this.visuals.time - effect.createdAt;
      
      if (effect.userData.type === 'errorPulse') {
        const progress = Math.min(elapsed / effect.userData.duration, 1);
        
        // Pulse travels back to source
        const currentPos = effect.userData.pulse.position;
        const travelBack = THREE.MathUtils.lerp(
          effect.userData.curvePoints[0].x,
          effect.userData.startPos.x,
          progress
        );
        
        effect.userData.pulse.material.opacity = (1 - progress) * 0.8;
        effect.userData.pulse.scale.setScalar(0.15 + progress * 0.1);
        
        if (progress >= 1) {
          this.scene.remove(effect);
          effect.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
          effectsToRemove.push(effect);
        }
      } 
      else if (effect.userData.type === 'shatterEffect') {
        const progress = Math.min(elapsed / effect.userData.duration, 1);
        
        effect.userData.fragments.forEach(frag => {
          frag.mesh.position.add(frag.velocity.clone().multiplyScalar(deltaTime * 2));
          frag.mesh.material.opacity = (1 - progress) * 0.9;
          frag.mesh.rotation.x += 0.05;
          frag.mesh.rotation.y += 0.05;
        });
        
        if (progress >= 1) {
          this.scene.remove(effect);
          effect.userData.fragments.forEach(frag => {
            frag.mesh.geometry.dispose();
            frag.mesh.material.dispose();
          });
          effectsToRemove.push(effect);
        }
      }
    });
    
    // Remove finished effects
    this.activeEffects = this.activeEffects.filter(e => !effectsToRemove.includes(e));
  }
  
  /**
   * Update multi-output node glow animations
   */
  updateMultiOutputGlows() {
    this.multiOutputGlows.forEach((glowGroup) => {
      this.visuals.updateMultiOutputGlow(glowGroup);
    });
  }
  
  /**
   * Register active effect for tracking
   */
  registerEffect(effect) {
    this.activeEffects.push(effect);
  }
  
  /**
   * [Metrics Integration v1.0] Update link visual state with metric values
   * Call this whenever corruption, synergy, or harmony values are computed
   * This integrates existing metric values (no computation happens here)
   * [SYNERGY/HARMONY UPGRADE] Also applies node visual upgrades based on thresholds
   * 
   * @param {Object} link - The link to update
   * @param {Object} metrics - { corruption, synergy, harmony }
   */
  updateLinkMetrics(link, metrics = {}) {
    if (!link || !link.id || !this.visuals) return;
    
    // Normalize metrics to 0-1 range if needed
    const normalized = {
      corruption: this._normalizeMetric(metrics.corruption),
      synergy: this._normalizeMetric(metrics.synergy),
      harmony: this._normalizeMetric(metrics.harmony)
    };
    
    // Pass to visual system for real-time color/pulse updates
    this.visuals.updateLinkState(link.id, normalized);
    
    // [Session 79] Update particle speed based on corruption
    // High corruption → Slow particles, Low corruption → Fast particles
    updateParticleCorruptionSpeed(link, normalized.corruption);
    
    // [SYNERGY/HARMONY/CORRUPTION UPGRADE] Apply node visual upgrades based on metric thresholds
    if (link.source && link.target) {
      const isSynergyAwakened = normalized.synergy >= 0.85;
      const isHarmonyStabilized = normalized.harmony >= 0.80;
      const isCorrupted = normalized.corruption >= 0.65;
      
      // [CORRUPTION VISUAL STATE] Apply corruption first (overrides harmony visual order)
      // Corruption makes the system look broken/unstable
      if (isCorrupted) {
        if (!link.source.userData.corruptedState) {
          this._applyCorruptionToNode(link.source, normalized.corruption);
        } else if ((link.source.userData.metrics?.corruption ?? 0) !== normalized.corruption) {
          this._applyCorruptionToNode(link.source, normalized.corruption);  // Update intensity
        }
        
        if (!link.target.userData.corruptedState) {
          this._applyCorruptionToNode(link.target, normalized.corruption);
        } else if ((link.target.userData.metrics?.corruption ?? 0) !== normalized.corruption) {
          this._applyCorruptionToNode(link.target, normalized.corruption);  // Update intensity
        }
      } else {
        // Remove corruption state if it was active
        if (link.source.userData.corruptedState === 'CORRUPTED') {
          this._removeCorruptionFromNode(link.source);
        }
        if (link.target.userData.corruptedState === 'CORRUPTED') {
          this._removeCorruptionFromNode(link.target);
        }
      }
      
      // Synergy: Reveal internal node geometry (can be deformed by corruption)
      if (isSynergyAwakened) {
        if (!link.source.userData.synergizedState) {
          this._applySynergyToNode(link.source);
        }
        if (!link.target.userData.synergizedState) {
          this._applySynergyToNode(link.target);
        }
      } else {
        // Remove synergy state if it was active
        if (link.source.userData.synergizedState === 'AWAKENED') {
          this._removeSynergyFromNode(link.source);
        }
        if (link.target.userData.synergizedState === 'AWAKENED') {
          this._removeSynergyFromNode(link.target);
        }
      }
      
      // Harmony: Stabilize node motion and oscillations (corruption introduces tension that fights this)
      if (isHarmonyStabilized) {
        if (!link.source.userData.harmonyStabilized) {
          this._applyHarmonyToNode(link.source);
        }
        if (!link.target.userData.harmonyStabilized) {
          this._applyHarmonyToNode(link.target);
        }
      } else {
        // Remove harmony state if it was active
        if (link.source.userData.harmonyStabilized) {
          this._removeHarmonyFromNode(link.source);
        }
        if (link.target.userData.harmonyStabilized) {
          this._removeHarmonyFromNode(link.target);
        }
      }
    }
    
    // [SYNERGY GLYPH REVEAL] Update glyph system with synergy levels for both nodes
    // Glyphs reveal progressively as synergy increases
    if (window.glyphSystem && link.source && link.target) {
      const sourceNodeId = link.source.userData?.nodeId || link.source.uuid;
      const targetNodeId = link.target.userData?.nodeId || link.target.uuid;
      
      if (sourceNodeId) {
        window.glyphSystem.updateNodeSynergy(sourceNodeId, normalized.synergy);
      }
      if (targetNodeId) {
        window.glyphSystem.updateNodeSynergy(targetNodeId, normalized.synergy);
      }
    }
  }
  
  /**
   * [SYNERGY/HARMONY UPGRADE] Internal helper - apply synergy state to node
   * Reveals internal geometry and adds transparency for depth
   * @private
   */
  _applySynergyToNode(node) {
    if (!node || !node.children) return;
    
    try {
      for (const child of node.children) {
        if (!child.userData) child.userData = {};
        
        // Detect internal/secondary layers
        const isInternal = 
          child.userData.visualLayer === 'INTERNAL' ||
          child.userData.type === 'internal' ||
          (child.material && child.material.opacity < 0.3);
        
        if (isInternal && child.material) {
          // Store base opacity
          if (child.userData.baseSynergyOpacity === undefined) {
            child.userData.baseSynergyOpacity = child.material.opacity;
          }
          // Increase visibility by 15%
          child.material.opacity = Math.min(1.0, child.userData.baseSynergyOpacity + 0.15);
        }
      }
      
      node.userData.synergizedState = 'AWAKENED';
    } catch (err) {
      console.error('[NodeLinkingSystem] Synergy application failed:', err.message);
    }
  }
  
  /**
   * [SYNERGY/HARMONY UPGRADE] Internal helper - remove synergy state from node
   * @private
   */
  _removeSynergyFromNode(node) {
    if (!node || !node.children) return;
    
    try {
      for (const child of node.children) {
        if (child.userData && child.userData.baseSynergyOpacity !== undefined && child.material) {
          child.material.opacity = child.userData.baseSynergyOpacity;
        }
      }
      node.userData.synergizedState = 'NORMAL';
    } catch (err) {
      console.error('[NodeLinkingSystem] Synergy removal failed:', err.message);
    }
  }
  
  /**
   * [SYNERGY/HARMONY UPGRADE] Internal helper - apply harmony state to node
   * Enables motion damping and stabilization
   * @private
   */
  _applyHarmonyToNode(node) {
    if (!node) return;
    
    try {
      node.userData.harmonyStabilized = true;
      node.userData.harmonyDampingFactor = 0.2;  // 20% damping
      
      for (const child of node.children || []) {
        if (!child.userData) child.userData = {};
        child.userData.harmonyDampingEnabled = true;
        child.userData.harmonyDampingFactor = 0.2;
      }
    } catch (err) {
      console.error('[NodeLinkingSystem] Harmony application failed:', err.message);
    }
  }
  
  /**
   * [SYNERGY/HARMONY UPGRADE] Internal helper - remove harmony state from node
   * @private
   */
  _removeHarmonyFromNode(node) {
    if (!node) return;
    
    try {
      node.userData.harmonyStabilized = false;
      node.userData.harmonyDampingFactor = 0;
      
      for (const child of node.children || []) {
        if (child.userData) {
          child.userData.harmonyDampingEnabled = false;
          child.userData.harmonyDampingFactor = 0;
        }
      }
    } catch (err) {
      console.error('[NodeLinkingSystem] Harmony removal failed:', err.message);
    }
  }

  /**
   * [CORRUPTION VISUAL STATE] Apply corruption state to node
   * When corruption >= 0.65: Internal geometry loses symmetry, layers misaligned
   * When corruption >= 0.80: Structure appears partially collapsed/fractured
   * 
   * Creates visual tension without destroying the node.
   * @private
   */
  _applyCorruptionToNode(node, corruptionLevel) {
    if (!node || !node.children) return;
    
    try {
      const isCorrupted = corruptionLevel >= 0.65;
      const isHighlyCorrupted = corruptionLevel >= 0.80;
      
      if (isCorrupted) {
        // Progressive corruption intensity
        const corruptionIntensity = (corruptionLevel - 0.65) / 0.35; // 0-1 scale
        
        for (const child of node.children) {
          if (!child.userData) child.userData = {};
          
          // Mark as corrupted
          child.userData.isCorrupted = true;
          child.userData.corruptionLevel = corruptionLevel;
          
          // Detect internal/secondary layers
          const isInternal = 
            child.userData.visualLayer === 'INTERNAL' ||
            child.userData.type === 'internal' ||
            (child.material && child.material.opacity < 0.5);
          
          if (isInternal && child.material) {
            // Store original state
            if (child.userData.baseCorruptionOpacity === undefined) {
              child.userData.baseCorruptionOpacity = child.material.opacity;
            }
            
            // Apply misalignment opacity (layers appear offset/fractured)
            // At 0.65: subtle loss of symmetry (-5% opacity)
            // At 0.80: visible fracture (-15% opacity)
            const opacityShift = -0.05 - corruptionIntensity * 0.10;
            child.material.opacity = Math.max(0.05, child.userData.baseCorruptionOpacity + opacityShift);
          }
          
          // Apply spatial offset/skew to internal geometries
          if (isInternal && child.geometry) {
            if (!child.userData.basePosition) {
              child.userData.basePosition = child.position.clone();
              child.userData.baseRotation = child.rotation.clone();
            }
            
            // Misregistration offset (max ±0.1 units at high corruption)
            const offsetAmount = corruptionIntensity * 0.1;
            const randomX = (Math.random() - 0.5) * offsetAmount;
            const randomY = (Math.random() - 0.5) * offsetAmount;
            const randomZ = (Math.random() - 0.5) * offsetAmount;
            
            // Apply offset on top of base position
            child.position.copy(child.userData.basePosition);
            child.position.x += randomX;
            child.position.y += randomY;
            child.position.z += randomZ;
            
            // Slight rotation skew for highly corrupted
            if (isHighlyCorrupted) {
              const skewAmount = corruptionIntensity * 0.1;
              child.rotation.x = child.userData.baseRotation.x + (Math.random() - 0.5) * skewAmount;
              child.rotation.y = child.userData.baseRotation.y + (Math.random() - 0.5) * skewAmount;
            }
          }
        }
        
        node.userData.corruptedState = 'CORRUPTED';
      } else {
        // Restore to normal
        for (const child of node.children) {
          if (child.userData) {
            child.userData.isCorrupted = false;
            
            // Restore opacity if we have base value
            if (child.userData.baseCorruptionOpacity !== undefined && child.material) {
              child.material.opacity = child.userData.baseCorruptionOpacity;
            }
            
            // Restore position/rotation
            if (child.userData.basePosition) {
              child.position.copy(child.userData.basePosition);
            }
            if (child.userData.baseRotation) {
              child.rotation.copy(child.userData.baseRotation);
            }
          }
        }
        node.userData.corruptedState = 'NORMAL';
      }
    } catch (err) {
      console.error('[NodeLinkingSystem] Corruption application to node failed:', err.message);
    }
  }

  /**
   * [CORRUPTION VISUAL STATE] Remove corruption state from node
   * Restores internal geometry to normal alignment and visibility
   * @private
   */
  _removeCorruptionFromNode(node) {
    if (!node || !node.children) return;
    
    try {
      for (const child of node.children) {
        if (child.userData) {
          child.userData.isCorrupted = false;
          
          // Restore opacity
          if (child.userData.baseCorruptionOpacity !== undefined && child.material) {
            child.material.opacity = child.userData.baseCorruptionOpacity;
          }
          
          // Restore position/rotation
          if (child.userData.basePosition) {
            child.position.copy(child.userData.basePosition);
          }
          if (child.userData.baseRotation) {
            child.rotation.copy(child.userData.baseRotation);
          }
        }
      }
      node.userData.corruptedState = 'NORMAL';
    } catch (err) {
      console.error('[NodeLinkingSystem] Corruption removal failed:', err.message);
    }
  }

  _readNodeCorruption(node) {
    return node?.userData?.metrics?.corruption ?? 0;
  }

  _writeNodeCorruption(node, value) {
    if (!node || !node.userData) return;
    const current = node.userData.metrics?.corruption ?? 0;
    const clamped = Math.max(0, Math.min(1, value ?? 0));
    const delta = clamped - current;
    if (delta !== 0) {
      applyMetricImpulse(node, { corruption: delta });
    }
  }
  
  /**
   * [CORRUPTION CONTAGION v1.0] Main update loop for corruption spread
   * Processes all links to calculate and apply contagion effects
   * Runs every frame at minimal cost (delta-time based)
   * 
   * @param {number} deltaTime - Time since last frame (seconds)
   * @private
   */
  _updateCorruptionContagion(deltaTime) {
    if (!this.links || this.links.length === 0) return;
    
    const config = this._contagionConfig;
    
    // Track nodes that received contagion this frame
    const contagionEvents = [];
    
    // Scan all links for contagion propagation
    for (const link of this.links) {
      if (!link.active || !link.source || !link.target) continue;
      
      // Get corruption levels from both nodes (canonical metrics)
      const sourceCorruption = this._readNodeCorruption(link.source);
      const targetCorruption = this._readNodeCorruption(link.target);
      
      // Initialize link contagion state if needed
      if (!link.userData) link.userData = {};
      if (!link.userData.contagionState) {
        link.userData.contagionState = {
          isInfected: false,
          infectionIntensity: 0,
          lastSpreadTime: Date.now(),
          spreadDirection: null,  // 'source->target', 'target->source', or 'bidirectional'
        };
      }
      
      // Determine spread direction(s)
      const sourceInfects = sourceCorruption >= config.spreadThreshold && sourceCorruption > targetCorruption;
      const targetInfects = targetCorruption >= config.spreadThreshold && targetCorruption > sourceCorruption;
      
      // Calculate bidirectional infection (mutual corruption propagation)
      const bothInfected = sourceCorruption >= config.spreadThreshold && targetCorruption >= config.spreadThreshold;
      
      if (sourceInfects || targetInfects || bothInfected) {
        // Link is active for contagion
        if (!link.userData.contagionState.isInfected) {
          link.userData.contagionState.isInfected = true;
          link.userData.contagionState.lastSpreadTime = Date.now();
        }
        
        // Calculate spread direction
        if (bothInfected) {
          link.userData.contagionState.spreadDirection = 'bidirectional';
        } else if (sourceInfects) {
          link.userData.contagionState.spreadDirection = 'source->target';
        } else {
          link.userData.contagionState.spreadDirection = 'target->source';
        }
        
        // Process contagion spread
        if (sourceInfects) {
          const spreadAmount = this._calculateContagionSpread(
            sourceCorruption,
            targetCorruption,
            deltaTime,
            link,
            config
          );
          
          if (spreadAmount > 0) {
            const newTargetCorruption = Math.min(1.0, targetCorruption + spreadAmount);
            this._writeNodeCorruption(link.target, newTargetCorruption);
            link.userData.contagionState.infectionIntensity = spreadAmount / deltaTime;
            
            contagionEvents.push({
              type: 'contagion',
              source: link.source,
              target: link.target,
              amount: spreadAmount,
              newLevel: newTargetCorruption,
              link: link
            });
          }
        }
        
        if (targetInfects) {
          const spreadAmount = this._calculateContagionSpread(
            targetCorruption,
            sourceCorruption,
            deltaTime,
            link,
            config
          );
          
          if (spreadAmount > 0) {
            const newSourceCorruption = Math.min(1.0, sourceCorruption + spreadAmount);
            this._writeNodeCorruption(link.source, newSourceCorruption);
            link.userData.contagionState.infectionIntensity = spreadAmount / deltaTime;
            
            contagionEvents.push({
              type: 'contagion',
              source: link.target,
              target: link.source,
              amount: spreadAmount,
              newLevel: newSourceCorruption,
              link: link
            });
          }
        }
      } else {
        // Link is not infected, reset state
        if (link.userData.contagionState.isInfected) {
          link.userData.contagionState.isInfected = false;
          link.userData.contagionState.infectionIntensity = 0;
          link.userData.contagionState.spreadDirection = null;
        }
      }
    }
    
    // Apply proximity boost for nodes with multiple incoming infections
    this._applyProximityBoost(contagionEvents, config);
  }
  
  /**
   * [CORRUPTION CONTAGION v1.0] Calculate spread amount for a single link
   * Takes into account:
   * - Corruption differential (steeper gradient = faster spread)
   * - Link resistance (can be modified per link)
   * - Target node immunity (can be modified per node)
   * - Spread saturation (slows down as target approaches source level)
   * 
   * @private
   */
  _calculateContagionSpread(sourceCorruption, targetCorruption, deltaTime, link, config) {
    // Base spread amount from source corruption
    const baseSpread = config.maxSpreadRate * deltaTime;
    
    // Corruption differential drives spread speed
    // Larger gap = faster spread (exponential curve)
    const differential = sourceCorruption - targetCorruption;
    const spreadIntensity = Math.pow(differential, 1.5);  // Exponential weighting
    
    // Link resistance factor (0.5 = 50% slower, 2.0 = 2x faster)
    const linkResistance = link.userData?.linkResistanceFactor ?? config.linkResistance;
    
    // Target node resistance (default 1.0, higher = more resistant)
    const targetResistance = link.target.userData?.contagionResistance ?? 1.0;
    
    // Calculate final spread amount
    const spreadAmount = baseSpread * spreadIntensity * (1 / linkResistance) * (1 / targetResistance);
    
    // Saturation control: spread slows as target approaches source
    // When differential < 0.1, apply saturation damping
    if (differential < 0.1) {
      const saturationDamping = (differential / 0.1);  // 0-1
      return spreadAmount * saturationDamping;
    }
    
    return spreadAmount;
  }
  
  /**
   * [CORRUPTION CONTAGION v1.0] Apply proximity boost
   * When a node receives contagion from multiple sources, infection spreads faster
   * This models "overwhelmed defenses" concept
   * 
   * @private
   */
  _applyProximityBoost(contagionEvents, config) {
    // Group events by target node
    const targetGroups = new Map();
    
    for (const event of contagionEvents) {
      const targetId = event.target.uuid;
      if (!targetGroups.has(targetId)) {
        targetGroups.set(targetId, []);
      }
      targetGroups.get(targetId).push(event);
    }
    
    // Apply boost to nodes receiving multiple infections
    for (const [targetId, events] of targetGroups.entries()) {
      if (events.length > 1) {
        // Multiple infections detected - apply proximity boost
        const boostFactor = Math.min(1.5, 1.0 + (events.length - 1) * 0.15);
        
        for (const event of events) {
          event.target.userData.contagionBoost = boostFactor;
          event.target.userData.contagionSourceCount = events.length;
        }
      }
    }
  }
  
  /**
   * [CORRUPTION CONTAGION v1.0] Set link resistance factor
   * Higher values = more resistance to contagion spread
   * Default: 0.8 (20% slower than baseline)
   * 
   * @param {Object} link - The link to modify
   * @param {number} resistance - Resistance factor (0.5-2.0 typical)
   */
  setLinkContagionResistance(link, resistance) {
    if (!link) return;
    if (!link.userData) link.userData = {};
    link.userData.linkResistanceFactor = Math.max(0.1, Math.min(10, resistance));
  }
  
  /**
   * [CORRUPTION CONTAGION v1.0] Set node immunity factor
   * Higher values = more resistance to contagion infection
   * Default: 1.0 (normal infection rate)
   * 
   * @param {Object} node - The node to modify
   * @param {number} immunity - Immunity factor (0.1-5.0 typical)
   */
  setNodeContagionResistance(node, immunity) {
    if (!node) return;
    if (!node.userData) node.userData = {};
    node.userData.contagionResistance = Math.max(0.1, Math.min(10, immunity));
  }
  
  /**
   * [CORRUPTION CONTAGION v1.0] Get contagion status for a link
   * Returns current infection state and intensity
   * 
   * @param {Object} link - The link to query
   * @returns {Object} Contagion state { isInfected, intensity, direction }
   */
  getLinkContagionStatus(link) {
    if (!link || !link.userData || !link.userData.contagionState) {
      return {
        isInfected: false,
        intensity: 0,
        direction: null
      };
    }
    
    return {
      isInfected: link.userData.contagionState.isInfected,
      intensity: link.userData.contagionState.infectionIntensity,
      direction: link.userData.contagionState.spreadDirection
    };
  }
  
  /**
   * [CORRUPTION CONTAGION v1.0] Get contagion status for a node
   * Returns current infection threat level from connected links
   * 
   * @param {Object} node - The node to query
   * @returns {Object} Contagion threat { threatLevel, sourceCount, speed }
   */
  getNodeContagionThreat(node) {
    if (!node) return { threatLevel: 0, sourceCount: 0, speed: 0 };
    
    const linkedCorruptedNodes = this.getLinksForNode(node)
      .filter(link => {
        if (!link.active) return false;
        const otherNode = link.source === node ? link.target : link.source;
        return otherNode?.userData?.corruptionLevel >= this._contagionConfig.spreadThreshold;
      });
    
    const sourceCount = linkedCorruptedNodes.length;
    const threatLevel = Math.min(1.0, sourceCount * 0.25);  // Up to 1.0 at 4+ sources
    const speed = sourceCount > 0 
      ? linkedCorruptedNodes.reduce((sum, link) => sum + (link.userData?.contagionState?.infectionIntensity ?? 0), 0) / sourceCount
      : 0;
    
    return {
      threatLevel,
      sourceCount,
      speed
    };
  }
  
  /**
   * [Metrics Integration v1.0] Normalize metric value to 0-1 range
   * @private
   */
  _normalizeMetric(value) {
    if (typeof value !== 'number') return 0;
    // Assuming values are already 0-1, but clamp to be safe
    return Math.max(0, Math.min(1, value));
  }
  
  /**
   * Remove a specific link
   */
  removeLink(link) {
    link.active = false;
    this._markLinksDirty();
    this._markNodesDirty();
    // Drop cached metrics for this link
    const _lid = link.id || link.uuid;
    if (this._linkMetricsCache && _lid) this._linkMetricsCache.delete(_lid);
    
    // Canonical metrics: link removal hook
    if (link.source && link.target) {
      onLinkRemoved(link.source, link.target);
    }
    
    // --- LINK REMOVAL DISSIPATION EFFECT ---
    // Mark both nodes as link-removing to trigger aura contraction animation
    if (link.source && link.target) {
      link.source.linkRemoving = true;
      link.target.linkRemoving = true;
      link.source.linkRemovalTime = performance.now();
      link.target.linkRemovalTime = performance.now();
      
      // Store reverse link direction for dissipation contraction
      if (link.source.userData) {
        link.source.userData.lastRemovalDirection = new THREE.Vector3()
          .subVectors(link.target.position, link.source.position)
          .normalize();
      }
      if (link.target.userData) {
        link.target.userData.lastRemovalDirection = new THREE.Vector3()
          .subVectors(link.source.position, link.target.position)
          .normalize();
      }
    }
    
    // [Session 112] Remove animated link flow visualization
    if (this.flowSystem) {
      if (link.id) {
        this.flowSystem.removeLinkFlow(link.id);
      }
      // Fallback: handle legacy links lacking stable id or id mismatch
      if (typeof this.flowSystem.removeLinkFlowByLink === 'function') {
        this.flowSystem.removeLinkFlowByLink(link);
      }
    }
    
    // [Metrics Integration v1.0] Unregister link from visual metrics system
    if (link.id && this.visuals) {
      this.visuals.unregisterLink(link.id);
    }
    
    // [Dynamic Thickness v1.0] Unregister link from thickness system
    if (link.id && this.thicknessSystem) {
      this.thicknessSystem.unregisterLinkCurve(link.id);
    }
    
    // [SESSION 76] Remove core synergy glow from both nodes when link is removed
    // Restores core glow intensity to baseline (before synergy scaling was applied)
    if (link.source && link.target) {
      removeCoreSynergyGlow(link.source);
      removeCoreSynergyGlow(link.target);
    }
    
    // Fire link removal callback (for UI updates) - do this BEFORE disposal
    this._fireLinkRemovedCallbacks(link.source, link.target);
    
    // [Session 20 FIX] Notify tracking systems on link removal
    if (window.linkHistoryTracker) {
      try {
        console.debug(`[LinkHistory] Removing tracking for link: ${link.sourceNodeId} → ${link.targetNodeId}`);
      } catch (err) {
        console.warn('[Session 20] LinkHistoryTracker cleanup error:', err.message);
      }
    }
    
    if (window.synergyTrendHUD) {
      try {
        // Hide trend HUD if this was the selected link
        if (window.synergyTrendHUD.selectedLink?.id === link.id) {
          window.synergyTrendHUD.onLinkSelected(null);  // Deselect
        }
      } catch (err) {
        console.warn('[Session 20] SynergyTrendHUD cleanup error:', err.message);
      }
    }
    
    // Unified visual dispose (conduit + particles)
    if (this.conduitRenderer && link.group && link.group.userData.conduitState) {
      this.conduitRenderer.disposeLinkVisuals(link.group, link);
    }
    // Unregister from harmonic sync manager
    if (this.conduitRenderer?.nodeHarmonicManager) {
      this.conduitRenderer.nodeHarmonicManager.unregisterLinkFromNodes(
        link,
        link.source,
        link.target
      );
    }
    // Forced trail cleanup even if group/conduitState is missing
    const conduit = this.conduitRenderer;
    if (conduit?.trailParticles && link?.id) {
      conduit.trailParticles.clearLink(link.id);
    }
    if (conduit?.trailEmitters?.has?.(link?.id)) {
      const emitter = conduit.trailEmitters.get(link.id);
      emitter?.disable?.();
      conduit.trailEmitters.delete(link.id);
    }
    // Ensure memory ghost trails are cleared for all unlink call paths
    if (this.memoryTrails?.linkTrails?.removeLinkTrail && link?.id !== undefined) {
      this.memoryTrails.linkTrails.removeLinkTrail(link.id);
    }
    if (this.memoryTrails?.linkTrails?.removeLinkTrail &&
        link?.userData?.id !== undefined &&
        link.userData.id !== link?.id) {
      this.memoryTrails.linkTrails.removeLinkTrail(link.userData.id);
    }

    // Dispose group and all children (defensive pass after conduit disposal)
    if (link.group) {
      this.scene.remove(link.group);
      
      link.group.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
    
    // [LinkIndex v3.0] Remove link from persistent index
    this._removeLinkFromIndex(link);
    
    // [Patch 3.2 HYBRID] Invalidate cache for both nodes
    if (link.source && link.target) {
      const srcId = this.getNodeId(link.source);
      const tgtId = this.getNodeId(link.target);
      if (srcId) this._linkCategoryCache.delete(srcId);
      if (tgtId) this._linkCategoryCache.delete(tgtId);
      this._cacheValidUntil = Date.now() - 1;  // Expire cache immediately
    }
    
    // [Stab2] Remove from internal map
    if (link.sourceNodeId) {
      const srcLinks = this.nodeIdToLinks.get(link.sourceNodeId);
      if (srcLinks) {
        this.nodeIdToLinks.set(link.sourceNodeId, srcLinks.filter(l => l !== link));
      }
    }
    if (link.targetNodeId) {
      const tgtLinks = this.nodeIdToLinks.get(link.targetNodeId);
      if (tgtLinks) {
        this.nodeIdToLinks.set(link.targetNodeId, tgtLinks.filter(l => l !== link));
      }
    }
    
    this.links = this.links.filter(l => l !== link);
    
    // Refresh HUD if a node is selected
    if (window.game && window.game.selectedHUD && this.selectedNode) {
      window.game.selectedHUD.refreshDisplay();
    }
  }
  
  /**
   * Get all links for a node
   * [Stab2] Uses stable node ID for consistent lookup across selection cycles
   * 
   * @param {THREE.Object3D} node - The node to find links for
   * @returns {Array} Array of links connected to this node
   */
  getNodeLinks(node) {
    if (!node) return [];
    
    // [Stab2] Primary method: Use stable nodeId lookup
    const nodeId = this.getNodeId(node);
    if (nodeId && this.nodeIdToLinks.has(nodeId)) {
      const mapLinks = this.nodeIdToLinks.get(nodeId);
      
      // Filter out inactive/invalid links
      const validLinks = mapLinks.filter(link => link.active && this.isLinkValid(link));
      
      if (validLinks.length > 0) {
        return validLinks;
      }
    }
    
    // [Stab2] Fallback: Reference-based lookup (for backward compatibility)
    // This catches links created before stable ID system was added
    const refLinks = this.links.filter(link =>
      link.active &&
      this.isLinkValid(link) &&
      (link.source === node || link.target === node)
    );
    
    // If we found links via reference and nodeId exists, update the map
    if (refLinks.length > 0 && nodeId) {
      if (!this.nodeIdToLinks.has(nodeId)) {
        this.nodeIdToLinks.set(nodeId, refLinks);
      }
    }
    
    return refLinks;
  }
  
  /**
   * Clean up - SAFE DISPOSE (Patch 3.1)
   * 
   * Idempotent: Safe to call multiple times
   * Defensive: All operations guarded against null/undefined
   * Non-blocking: No crashes during world transitions
   */
  dispose() {
    // [Patch 3.1] Idempotent guard: prevent multiple dispose calls
    if (this._disposed) {
      console.warn('[NodeLinkingSystem] dispose() called multiple times – skipping');
      return;
    }
    
    // Mark as disposed immediately to prevent re-entrance
    this._disposed = true;
    
    // [Session 144+] Dispose undo/redo system
    if (this.undoRedo) {
      this.undoRedo.dispose();
      this.undoRedo = null;
    }
    
    // [SESSION 51] Dispose visual state binder
    if (this.visualStateBinder) {
      this.visualStateBinder.dispose();
      this.visualStateBinder = null;
    }
    
    try {
      // Remove event listeners (defensive - check existence first)
      if (this.renderer && this.renderer.domElement) {
        if (typeof this.onClick === 'function') {
          this.renderer.domElement.removeEventListener('click', this.onClick);
        }
        if (typeof this.onContextMenu === 'function') {
          this.renderer.domElement.removeEventListener('contextmenu', this.onContextMenu);
        }
        if (typeof this.onMouseDown === 'function') {
          this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
        }
        if (typeof this.onMouseMove === 'function') {
          this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
        }
        if (typeof this.onMouseUp === 'function') {
          this.renderer.domElement.removeEventListener('mouseup', this.onMouseUp);
        }
      }
      if (typeof this.onKeyDown === 'function') {
        document.removeEventListener('keydown', this.onKeyDown);
      }
    } catch (err) {
      console.warn('[NodeLinkingSystem] Error removing event listeners:', err);
    }
    
    try {
      // Clear click state timers (defensive)
      if (this.clickState && this.clickState.singleClickTimer) {
        clearTimeout(this.clickState.singleClickTimer);
        this.clickState.singleClickTimer = null;
      }
    } catch (err) {
      console.warn('[NodeLinkingSystem] Error clearing click timers:', err);
    }
    
    try {
      // Clear multi-select highlights (defensive)
      if (this.multiSelectMode && this.multiSelectHighlights) {
        for (const [node, highlight] of this.multiSelectHighlights) {
          if (this.scene && typeof this.scene.remove === 'function') {
            this.scene.remove(highlight);
          }
          if (highlight.geometry && typeof highlight.geometry.dispose === 'function') {
            highlight.geometry.dispose();
          }
          if (highlight.material && typeof highlight.material.dispose === 'function') {
            highlight.material.dispose();
          }
        }
        this.multiSelectHighlights.clear();
        this.selectedNodes.clear();
        this.multiSelectMode = false;
      }
    } catch (err) {
      console.warn('[NodeLinkingSystem] Error clearing multi-select highlights:', err);
    }
    
    try {
      // Clear selection pulse animations (defensive)
      if (this.selectionPulseAnimations) {
        for (const [node, anim] of this.selectionPulseAnimations) {
          if (anim.timeoutId) {
            clearTimeout(anim.timeoutId);
          }
        }
        this.selectionPulseAnimations.clear();
      }
    } catch (err) {
      console.warn('[NodeLinkingSystem] Error clearing pulse animations:', err);
    }
    
    try {
      // Remove box selection element (defensive)
      if (this.boxSelectState && this.boxSelectState.visualBox) {
        if (this.boxSelectState.visualBox.parentNode) {
          this.boxSelectState.visualBox.parentNode.removeChild(this.boxSelectState.visualBox);
        }
        this.boxSelectState.visualBox = null;
      }
    } catch (err) {
      console.warn('[NodeLinkingSystem] Error removing box selection element:', err);
    }
    
    try {
      // [LinkIndex v3.0] Clear persistent link index (defensive)
      if (this.linksByNode && typeof this.linksByNode.clear === 'function') {
        this.linksByNode.clear();
      }
    } catch (err) {
      console.warn('[NodeLinkingSystem] Error clearing linksByNode:', err);
    }
    
    try {
      // [Stab2] Clear node ID to links mapping (defensive)
      if (this.nodeIdToLinks && typeof this.nodeIdToLinks.clear === 'function') {
        this.nodeIdToLinks.clear();
      }
    } catch (err) {
      console.warn('[NodeLinkingSystem] Error clearing nodeIdToLinks:', err);
    }
    
    try {
      // Remove selected node highlight if present (defensive)
      if (this.selectedNodeHighlight) {
        if (this.scene && typeof this.scene.remove === 'function') {
          this.scene.remove(this.selectedNodeHighlight);
        }
        if (this.selectedNodeHighlight.geometry && typeof this.selectedNodeHighlight.geometry.dispose === 'function') {
          this.selectedNodeHighlight.geometry.dispose();
        }
        if (this.selectedNodeHighlight.material && typeof this.selectedNodeHighlight.material.dispose === 'function') {
          this.selectedNodeHighlight.material.dispose();
        }
        this.selectedNodeHighlight = null;
      }
    } catch (err) {
      console.warn('[NodeLinkingSystem] Error disposing selected node highlight:', err);
    }
    
    try {
      // Clear all node selection glows (defensive)
      if (typeof this.clearAllNodeSelectionGlows === 'function') {
        this.clearAllNodeSelectionGlows();
      }
    } catch (err) {
      console.warn('[NodeLinkingSystem] Error clearing node selection glows:', err);
    }
    
    try {
      // Remove all links (defensive - copy array first to avoid mutation during iteration)
      if (Array.isArray(this.links) && this.links.length > 0) {
        const linksCopy = this.links.slice(); // Shallow copy
        for (const link of linksCopy) {
          try {
            if (link && typeof this.removeLink === 'function') {
              this.removeLink(link);
            }
          } catch (err) {
            console.warn('[NodeLinkingSystem] Error removing link during disposal:', err);
          }
        }
      }
    } catch (err) {
      console.warn('[NodeLinkingSystem] Error during link disposal loop:', err);
    }
    
    try {
      // Dispose visuals (defensive)
      if (this.visuals && typeof this.visuals.dispose === 'function') {
        this.visuals.dispose();
      }
      this.visuals = null;
    } catch (err) {
      console.warn('[NodeLinkingSystem] Error disposing visuals:', err);
    }
    
    try {
      // [Dynamic Thickness v1.0] Dispose thickness system (defensive)
      if (this.thicknessSystem && typeof this.thicknessSystem.dispose === 'function') {
        this.thicknessSystem.dispose();
      }
      this.thicknessSystem = null;
    } catch (err) {
      console.warn('[NodeLinkingSystem] Error disposing thickness system:', err);
    }
    
    // Clear callback arrays
    try {
      if (Array.isArray(this.onSelectCallbacks)) {
        this.onSelectCallbacks.length = 0;
      }
      if (Array.isArray(this.onDeselectCallbacks)) {
        this.onDeselectCallbacks.length = 0;
      }
      if (Array.isArray(this.onHoverStartCallbacks)) {
        this.onHoverStartCallbacks.length = 0;
      }
      if (Array.isArray(this.onHoverEndCallbacks)) {
        this.onHoverEndCallbacks.length = 0;
      }
      if (Array.isArray(this.onLinkCreatedCallbacks)) {
        this.onLinkCreatedCallbacks.length = 0;
      }
      if (Array.isArray(this.onLinkRemovedCallbacks)) {
        this.onLinkRemovedCallbacks.length = 0;
      }
    } catch (err) {
      console.warn('[NodeLinkingSystem] Error clearing callback arrays:', err);
    }
    
    // Clear collections
    try {
      if (Array.isArray(this.links)) {
        this.links.length = 0;
      }
      if (Array.isArray(this.ghostLinks)) {
        this.ghostLinks.length = 0;
      }
      if (Array.isArray(this.activeEffects)) {
        this.activeEffects.length = 0;
      }
      if (this.multiOutputGlows && typeof this.multiOutputGlows.clear === 'function') {
        this.multiOutputGlows.clear();
      }
      if (this.nodeSelectionGlows && typeof this.nodeSelectionGlows.clear === 'function') {
        this.nodeSelectionGlows.clear();
      }
    } catch (err) {
      console.warn('[NodeLinkingSystem] Error clearing collections:', err);
    }
    
    // [Patch 3.2 HYBRID] Clear mini cache and sync state
    try {
      if (this._linkCategoryCache && typeof this._linkCategoryCache.clear === 'function') {
        this._linkCategoryCache.clear();
      }
    } catch (err) {
      console.warn('[NodeLinkingSystem] Error clearing link cache:', err);
    }
    
    // Final state cleanup
    if (this.hoveredNodeForSelection) {
      this._fireHoverEndCallbacks(this.hoveredNodeForSelection);
    }
    this.selectedNode = null;
    this.activeLink = null;
    this.selectedLink = null;
    this.hoveredNodeForSelection = null;
    
    console.log('[NodeLinkingSystem] dispose() completed safely ✓');
  }
  
  /**
   * Register callback for node selection events
   * 
   * @param {Function} callback - Called with (node) when node selected
   */
  onNodeSelected(callback) {
    if (typeof callback === 'function') {
      this.onSelectCallbacks.push(callback);
    }
  }
  
  /**
   * Register callback for node deselection events
   * 
   * @param {Function} callback - Called when node deselected
   */
  onNodeDeselected(callback) {
    if (typeof callback === 'function') {
      this.onDeselectCallbacks.push(callback);
    }
  }

  /**
   * Register callback for hover-enter events.
   *
   * @param {Function} callback - Called with (node) when hover begins
   */
  onNodeHoverStart(callback) {
    if (typeof callback === 'function') {
      this.onHoverStartCallbacks.push(callback);
    }
  }

  /**
   * Register callback for hover-exit events.
   *
   * @param {Function} callback - Called with (node) when hover ends
   */
  onNodeHoverEnd(callback) {
    if (typeof callback === 'function') {
      this.onHoverEndCallbacks.push(callback);
    }
  }

  /**
   * [Audit 6.2] Set world ready state
   * Call worldReady=false BEFORE world destroy, true AFTER new nodes created
   */
  setWorldReady(ready) {
    this.worldReady = ready;
    if (!ready) {
      // Mark all existing links as "just created" on world reset
      // This gives them 1-frame delay before updating
      this.links.forEach(link => {
        link._justCreated = true;
      });
    }
  }

  /**
   * Enqueue a collapse request (meaning-only, no structural action here).
   * @param {Object} link - Link object
   * @param {Object} context - Optional context { reason, severity, source }
   */
  enqueueCollapseRequest(link, context = {}) {
    if (!link) return;
    const linkId = link.id || `${link.source?.id ?? 'src'}-${link.target?.id ?? 'tgt'}`;
    const request = {
      linkId,
      reason: context.reason || 'collapse-threshold',
      severity: context.severity || 'critical',
      source: context.source || 'LinkCollapseSystem',
      timestamp: Date.now(),
    };
    this.pendingCollapseRequests.push(request);
  }

  /**
   * Run collapse arbiter: decides allow/defer/deny for pending collapse requests.
   * Meaning-only: no structural unlink or state mutation is performed.
   */
  runCollapseArbiter() {
    if (!Array.isArray(this.pendingCollapseRequests) || this.pendingCollapseRequests.length === 0) {
      return;
    }

    const remaining = [];
    const now = Date.now();
    const allowQueue = [];

    for (const req of this.pendingCollapseRequests) {
      const link = this._findLinkById(req.linkId);
      const decision = this._decideCollapse(link, req, now);

      // Record decision
      this.lastCollapseDecisions.set(req.linkId, decision);

      // Defer keeps the request for future cycles; allow/deny drop it
      if (decision.decision === 'defer') {
        remaining.push(req);
      } else if (decision.decision === 'allow') {
        allowQueue.push(decision);
      }
    }

    this.pendingCollapseRequests = remaining;

    // Single controlled structural execution per tick
    if (allowQueue.length > 0) {
      this._executeCollapseDecision(allowQueue[0]);
    }

    // QA-only advisory AI hook (manual/explicit): run once per arbiter pass if enabled
    this._maybeRunAIReasoningDebug();
  }

  /**
   * Evaluate a single collapse request conservatively (no structural effect).
   * @private
   */
  _decideCollapse(link, req, now) {
    // Default conservative stance: deny if link missing, defer otherwise
    if (!link) {
      return { linkId: req.linkId, decision: 'deny', reason: 'link-missing', decidedAt: now, source: req.source };
    }

    const prioritySnapshot = link.prioritySnapshot || null;
    const integrity = link.userData?.integrity;
    const corruption = link.userData?.corruption;

    // Priority alone must never trigger allow; corruption/integrity gates apply
    const hasCriticalCorruption = typeof corruption === 'number' && corruption >= 80;
    const hasLowIntegrity = typeof integrity === 'number' && integrity <= 8;

    if (hasCriticalCorruption || hasLowIntegrity) {
      return { linkId: req.linkId, decision: 'allow', reason: 'corruption-or-integrity', decidedAt: now, source: req.source, prioritySnapshot };
    }

    // If insufficient evidence, defer to future cycles
    return { linkId: req.linkId, decision: 'defer', reason: 'insufficient-signal', decidedAt: now, source: req.source, prioritySnapshot };
  }

  /**
   * Lookup link by id helper.
   * @private
   */
  _findLinkById(linkId) {
    if (!Array.isArray(this.links)) return null;
    return this.links.find(l => l.id === linkId || `${l.source?.id ?? 'src'}-${l.target?.id ?? 'tgt'}` === linkId) || null;
  }

  /**
   * Controlled structural executor: unlinks exactly one allowed collapse per tick.
   * No other system may perform unlink for collapse.
   * @private
   */
  _executeCollapseDecision(decision) {
    if (!decision || decision.decision !== 'allow') return;
    const link = this._findLinkById(decision.linkId);
    if (!link) return;

    // Capture recovery candidate before structural removal
    this._addRecoveryCandidate(link, decision);

    const semanticBus = this.semanticBus || (typeof globalThis !== 'undefined' ? globalThis.semanticBus : null);
    if (semanticBus?.emit) {
      const sourceId = this.getNodeId(link.source);
      const targetId = this.getNodeId(link.target);
      semanticBus.emit('link:collapsed', {
        linkId: decision.linkId,
        sourceId,
        targetId,
        reason: decision.reason,
        source: decision.source || 'LinkCollapseSystem',
        timestamp: performance.now()
      }, { priority: semanticBus.priority?.INTERACTIVE });
    }

    console.log(`[CollapseExecutor] unlinking link=${decision.linkId} reason=${decision.reason} source=${decision.source || 'unknown'} at=${new Date(decision.decidedAt).toISOString()}`);
    this.removeLink(link);
    this.lastCollapseDecisions.set(decision.linkId, { ...decision, executedAt: Date.now() });
  }

  /**
   * Record a recovery candidate after a controlled collapse (meaning-only).
   * No automatic relink occurs; recovery must be explicitly requested and gated.
   * @private
   */
  _addRecoveryCandidate(link, decision) {
    const sourceNodeId = this.getNodeId(link.source);
    const targetNodeId = this.getNodeId(link.target);
    const collapsedAt = decision.decidedAt || Date.now();
    const recoveryDelayMs = 10000; // Conservative default cooldown
    const candidateId = `${decision.linkId}:${collapsedAt}`;

    this.recoveryCandidates.push({
      candidateId,
      linkId: decision.linkId,
      sourceNodeId,
      targetNodeId,
      collapsedAt,
      earliestRecoveryAt: collapsedAt + recoveryDelayMs,
      reason: decision.reason,
      source: decision.source || 'LinkCollapseSystem',
      conditions: {
        maxCorruption: 20,   // Require corruption to fall below 20%
        minIntegrity: 50,    // Require integrity to recover to 50%
        maxLoad: 0.8,        // Avoid immediate reloading under high load
      },
    });
  }

  /**
   * Run recovery arbiter: evaluates one recovery candidate per tick.
   * Meaning-only: does not create links; external caller must request relink.
   */
  runRecoveryArbiter() {
    if (!Array.isArray(this.recoveryCandidates) || this.recoveryCandidates.length === 0) {
      return;
    }

    const candidate = this.recoveryCandidates[0]; // Evaluate at most one per tick
    const now = Date.now();
    const decision = this._decideRecovery(candidate, now);
    this.lastRecoveryDecisions.set(candidate.candidateId, decision);

    if (decision.decision === 'allow' || decision.decision === 'deny') {
      // Remove candidate once a terminal decision is made
      this.recoveryCandidates.shift();
    } else {
      // Defer keeps candidate for future evaluation
      this.recoveryCandidates[0] = candidate;
    }

    // QA-only advisory AI hook (manual/explicit): run once per arbiter pass if enabled
    this._maybeRunAIReasoningDebug();
  }

  /**
   * Decide recovery eligibility based on integrity/corruption/load/time.
   * No structural or semantic mutations performed.
   * @private
   */
  _decideRecovery(candidate, now) {
    if (!candidate) return null;

    const sourceNode = this._findNodeById(candidate.sourceNodeId);
    const targetNode = this._findNodeById(candidate.targetNodeId);

    if (!sourceNode || !targetNode) {
      return {
        candidateId: candidate.candidateId,
        decision: 'deny',
        reason: 'missing-nodes',
        decidedAt: now,
      };
    }

    if (now < candidate.earliestRecoveryAt) {
      return {
        candidateId: candidate.candidateId,
        decision: 'defer',
        reason: 'cooldown',
        decidedAt: now,
      };
    }

    const srcIntegrity = sourceNode.userData?.integrity;
    const tgtIntegrity = targetNode.userData?.integrity;
    const srcCorruption = sourceNode.userData?.corruption;
    const tgtCorruption = targetNode.userData?.corruption;
    const srcLoad = sourceNode.userData?.load;
    const tgtLoad = targetNode.userData?.load;

    const cond = candidate.conditions || {};
    const maxCorruption = cond.maxCorruption ?? 20;
    const minIntegrity = cond.minIntegrity ?? 50;
    const maxLoad = cond.maxLoad ?? 0.8;

    const corruptionOk =
      (typeof srcCorruption !== 'number' || srcCorruption <= maxCorruption) &&
      (typeof tgtCorruption !== 'number' || tgtCorruption <= maxCorruption);

    const integrityOk =
      (typeof srcIntegrity !== 'number' || srcIntegrity >= minIntegrity) &&
      (typeof tgtIntegrity !== 'number' || tgtIntegrity >= minIntegrity);

    const loadOk =
      (typeof srcLoad !== 'number' || srcLoad <= maxLoad) &&
      (typeof tgtLoad !== 'number' || tgtLoad <= maxLoad);

    if (corruptionOk && integrityOk && loadOk) {
      return {
        candidateId: candidate.candidateId,
        decision: 'allow',
        reason: 'conditions-met',
        decidedAt: now,
        sourceNodeId: candidate.sourceNodeId,
        targetNodeId: candidate.targetNodeId,
      };
    }

    return {
      candidateId: candidate.candidateId,
      decision: 'defer',
      reason: 'conditions-not-met',
      decidedAt: now,
    };
  }

  /**
   * Request a recovery relink using normal createLink flow (explicit call only).
   * Does nothing automatically; caller must ensure an 'allow' decision exists.
   */
  requestRecoveryLink(sourceNodeId, targetNodeId) {
    const sourceNode = this._findNodeById(sourceNodeId);
    const targetNode = this._findNodeById(targetNodeId);
    if (!sourceNode || !targetNode) {
      console.warn('[Recovery] Cannot relink missing nodes', sourceNodeId, targetNodeId);
      return null;
    }
    return this.createLink(sourceNode, targetNode);
  }

  /**
   * Run AI advisory analysis on the current network state.
   * READ-ONLY. DEBUG / QA ONLY. No authority, no side effects.
   * Never called automatically unless QA flag is set.
   * @private
   */
  _runAIReasoningDebug() {
    if (!window.__ATOMA_QA__) return;
    const snapshot = buildNetworkStateSnapshot(this);
    const ai = new NetworkStateAIReasoner();
    const report = ai.analyze(snapshot);
    this._lastAIReport = Object.freeze(report);
  }

  /**
   * QA-only hook to optionally run AI reasoning once per debug-triggered path.
   * @private
   */
  _maybeRunAIReasoningDebug() {
    if (window.__ATOMA_QA__ && this.debugFlags?.runAIOnce) {
      this._runAIReasoningDebug();
      this.debugFlags.runAIOnce = false;
    }
  }

  /**
   * Read-only accessor for last AI report (debug/QA only).
   * @returns {Object|null}
   */
  getAIReport() {
    return this._lastAIReport || null;
  }

  /**
   * World rebuild hook: clear link visuals/state and attach a fresh LinkRoot under the new world root.
   * Safe to call multiple times; keeps FrameScheduler registration intact.
   */
  resetForWorldRebuild({ scene, worldRoot } = {}) {
    // Detach and dispose existing link visuals
    if (Array.isArray(this.links)) {
      for (const link of this.links) {
        if (this.conduitRenderer && link?.group) {
          this.conduitRenderer.disposeLinkVisuals(link.group, link);
        }
        if (link?.group?.parent) {
          link.group.parent.remove(link.group);
        }
        link.group = null;
        link.curve = null;
      }
    }

    // Preserve link objects; rebuild visuals on next update
    this.ghostLinks = this.ghostLinks || [];
    this.activeLink = null;
    this.linksDirty = true;
    this.nodesDirty = true;
    this._syncState.linkCount = this.links?.length || 0;
    this._syncState.mismatchDetected = false;

    // Dispose existing link root if present
    if (this.linkRoot?.parent) {
      this.linkRoot.parent.remove(this.linkRoot);
    }

    // Create and attach a dedicated link root under the active world root
    this.linkRoot = new THREE.Group();
    this.linkRoot.name = 'ATOMA_LinkRoot';
    this.linkRoot.userData = this.linkRoot.userData || {};
    this.linkRoot.userData.tag = 'LinkRoot';
    const parent = worldRoot || scene || this.scene;
    if (parent) {
      parent.add(this.linkRoot);
    }
  }

  /**
   * Find node by stable ID.
   * @private
   */
  _findNodeById(nodeId) {
    if (!nodeId || !this.aiNodes?.nodes) return null;
    return this.aiNodes.nodes.find(n => this.getNodeId(n) === nodeId) || null;
  }

  /**
   * Reset internal state for world switch
   * Clears mutable state without removing objects from scene
   * Safe to call multiple times
   */
  resetForWorldSwitch() {
    if (this.linksByNode instanceof Map) {
      this.linksByNode.clear();
    }

    if (this._syncState) {
      this._syncState.linkCount = 0;
      this._syncState.lastSyncTime = Date.now();
    }

    this.linksDirty = false;
    this.nodesDirty = false;

    if (Array.isArray(this.ghostLinks)) {
      this.ghostLinks.length = 0;
    }
  }
}

// One-time archetype shader warm-up to prevent GPU stalls on first spawn.
export function warmUpArchetypeShaders(renderer, patchers = {}) {
  if (!renderer || typeof renderer.render !== 'function') return;
  if (typeof window !== 'undefined' && window.__shaderWarmupDone === true) return;

  const categories = ['input', 'process', 'integration', 'analytics', 'storage', 'control', 'quantum'];
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 10);
  camera.position.z = 2;
  const { waveShaderBridge, waveShaderMaterialPatch, waveTravelShaderPack, waveDynamicsShaderPack } = patchers || {};

  const disposeNode = (node) => {
    node.traverse((child) => {
      if (child.geometry && child.geometry.dispose) child.geometry.dispose();
      const mat = child.material;
      if (mat && Array.isArray(mat)) {
        mat.forEach(m => m && m.dispose && m.dispose());
      } else if (mat && mat.dispose) {
        mat.dispose();
      }
    });
  };

  EnhancedNodeModels.ensureRegistryReady?.();
  for (const cat of categories) {
    // Spawn removed: single authority = AINodes.spawnNode()
    const node = null;
    if (!node) continue;
    node.scale.setScalar(0.001); // tiny, keeps warm-up invisible
    node.position.set(0, 0, 0);

    // Apply wave shader stacks so compiled program matches runtime variants
    node.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        try {
          waveShaderBridge?.registerNodeMaterial?.(mat, 'DEFAULT');
          waveShaderMaterialPatch?.patch?.(mat, 'DEFAULT');
          waveTravelShaderPack?.register?.(mat, 'TRAVEL_LINEAR');
          waveDynamicsShaderPack?.applyToMaterial?.(mat, 'AURA');
        } catch (err) {
          // best-effort only
        }
      });
    });

    scene.add(node);
    try {
      renderer.render(scene, camera); // trigger shader program compilation/link
    } catch (err) {
      // best-effort warm-up; ignore failures
    }
    scene.remove(node);
    disposeNode(node);
  }

    if (typeof window !== 'undefined') {
      window.__shaderWarmupDone = true;
      window.__ATOMA_WARMUP_COMPLETE = true;
      if (typeof window.markAtomaWarmupComplete === 'function') {
        window.markAtomaWarmupComplete();
      }
    }
  }

NodeLinkingSystem.prototype.setUIReferences = function() {};
NodeLinkingSystem.prototype.setAllNodes = function() {};
NodeLinkingSystem.prototype.setSelectionCore = function() {};


export default NodeLinkingSystem;

