/**
 * NODE INSPECT OVERLAY 1.0 (SAFE EDITION)
 * 
 * Pure HUD-only system for inspecting nodes
 * ZERO gameplay impact - no modifications to nodes, materials, physics, or game logic
 * 
 * Triggers when:
 * 1. Player raycast points at a node, OR
 * 2. Player is within 1.0-1.5 units of a node
 * 
 * Updates at max 30Hz (not every frame) for performance
 * 
 * ENHANCED IN v1.1:
 * • Added Authority Status section (when available)
 * • Added Stats tracking
 * • Added Console API (window.nodeInspect1)
 * • Added Thought Storms mood display
 */

import * as THREE from 'three';
import { AtomaLanguageEngine2_0 } from './_AtomaLanguageEngine2_0.js';
import { atomaNamingEngine } from './_AtomaNamingEngine.js';
import { NodeSpatialIndex } from './NodeSpatialIndex.js';

const METRIC_DISPLAY_MODES = Object.freeze({
  NUMERIC: 'numeric',
  GLYPH: 'glyph'
});

const DIGIT_GLYPHS = {
  '0': '◯',
  '1': '|',
  '2': '∿',
  '3': '△',
  '4': '▢',
  '5': '⬟',
  '6': '⟡',
  '7': '⟐',
  '8': '◎',
  '9': '✶',
  '.': '·'
};

export class NodeInspectOverlay1_0 {
  constructor(scene, camera, renderer, linguisticOverlay = null, game = null, thoughtStormsSystem = null) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.game = game;
    
    // ATOMA Language Engine: For archetype naming
    this.languageEngine = new AtomaLanguageEngine2_0();

    // ATOMA Naming Engine: For category/tag/factory code generation
    this.namingEngine = atomaNamingEngine;
    
    // Runtime-loaded assignment table from NodeVisualRegistryNameAssignments.json
    this.nodeVisualRegistryNames = null;
    this._loadVisualRegistryNames();
    
    // Linguistic Overlay: For semantic language display (optional)
    this.linguisticOverlay = linguisticOverlay;
    
    // Thought Storms System: For storm mood display (optional)
    this.thoughtStormsSystem = thoughtStormsSystem;
    
    // SPATIAL INDEX: Octree for accelerated proximity queries (O(log n) instead of O(n))
    this.spatialIndex = new NodeSpatialIndex({
      worldSize: 200,
      maxDepth: 6,
      maxObjectsPerNode: 8
    });
    this.spatialIndexBuilt = false;
    this._focusSuppressedUntil = 0;
    this._suppressedNodeIds = new Set();
    
    // Statistics tracking
    this.stats = {
      inspections: 0,
      updates: 0,
      lastUpdateFrameTime: 0
    };
    // Timing control (20-30Hz max = every 33-50ms)
    this.lastCheckTime = 0;
    this.checkInterval = 1 / 25; // ~40ms (25Hz - reduced from 30Hz)
    
    // Current inspection state
    this.currentNode = null;
    this.previousNode = null;
    this._lastExternalTickAt = 0;
    this._fallbackPollMs = 100;
    this._fallbackPollHandle = null;

    // Metric display mode (numeric/glyph)
    this.metricDisplayMode = METRIC_DISPLAY_MODES.NUMERIC;
    this.modeToggleButton = null;
    this.activeOverlaysDebugEnabled = false;
    this.activeOverlayDebugButton = null;
    
    // Raycaster for crosshair detection
    this.raycaster = new THREE.Raycaster();
    this.raycasterDirection = new THREE.Vector3(0, 0, -1);
    
    // HUD panel (DOM element)
    this.hudPanel = null;
    this.isVisible = false;
    this.enabled = true;
    
    // Initialize HUD
    this.initializeHUD();

    const semanticBus = globalThis.semanticBus;
    if (semanticBus?.subscribe) {
      this._linkCreatedDismissDisposer = semanticBus.subscribe('link.created', (payload = {}) => {
        void payload;
        this.hideOverlay();
        this.currentNode = null;
      });
    }

    const linkingSystem = this.game?.linkingSystem || this.game?.nodeLinking || null;
    if (linkingSystem?.registerLinkCreatedCallback) {
      this._linkCreatedCallback = (sourceNode, targetNode) => {
        void sourceNode;
        void targetNode;
        this.hideOverlay();
        this.currentNode = null;
      };
      linkingSystem.registerLinkCreatedCallback(this._linkCreatedCallback, {
        layerKey: 'LINK_INSPECT_Dismiss',
        immediate: true
      });
    }

    this._startFallbackPoll();
    
    // Setup console API
    this._setupConsoleAPI();
  }

  async _loadVisualRegistryNames() {
    if (typeof window === 'undefined' || typeof fetch !== 'function') {
      return;
    }

    try {
      const jsonUrl = new URL('./NodeVisualRegistryNameAssignments.json', import.meta.url);
      const response = await fetch(jsonUrl);
      if (!response.ok) {
        console.warn('NodeInspectOverlay1_0: Failed to load visual registry names', response.status, response.statusText);
        return;
      }
      this.nodeVisualRegistryNames = await response.json();
    } catch (error) {
      console.warn('NodeInspectOverlay1_0: Error loading visual registry names', error);
    }
  }

  _startFallbackPoll() {
    if (this._fallbackPollHandle) return;
    if (typeof window === 'undefined' || typeof window.setInterval !== 'function') return;

    this._fallbackPollHandle = window.setInterval(() => {
      if (!this.enabled) return;
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      if (now - this._lastExternalTickAt < 180) {
        return;
      }
      this.update(this.checkInterval);
    }, this._fallbackPollMs);
  }
  
  /**
   * Setup console API for debugging
   * @private
   */
  _setupConsoleAPI() {
    window.nodeInspect1 = {
      enable: () => {
        this.enabled = true;
        console.log('✓ Node Inspect Overlay 1.0 enabled');
      },
      disable: () => {
        this.enabled = false;
        this.hideOverlay();
        console.log('✓ Node Inspect Overlay 1.0 disabled');
      },
      stats: () => {
        console.table(this.getStats());
      },
      getStats: () => this.getStats(),
      toggleActiveOverlayDebugMode: () => this.toggleActiveOverlayDebugMode(),
      setActiveOverlayDebugMode: (enabled) => this.setActiveOverlayDebugMode(enabled),
      getActiveOverlayDebugMode: () => this.activeOverlaysDebugEnabled,
      close: () => {
        this.hideOverlay();
        this.currentNode = null;
        console.log('✓ Overlay closed');
      },
      getCurrentNode: () => this.currentNode,
      getActiveOverlays: () => this._collectActiveOverlaySystems()
    };
    
    console.log('✓ Node Inspect Overlay 1.0 console API: window.nodeInspect1.enable(), window.nodeInspect1.disable(), window.nodeInspect1.stats(), window.nodeInspect1.close()');
  }
  
  /**
   * Get overlay statistics
   */
  getStats() {
    return {
      enabled: this.enabled,
      isVisible: this.isVisible,
      currentNodeCategory: this.currentNode?.userData?.category || 'none',
      currentNodeId: this.currentNode?.userData?.nodeId || this.currentNode?.uuid || 'none',
      inspections: this.stats.inspections,
      updates: this.stats.updates,
      averageFrameTime: this.stats.lastUpdateFrameTime.toFixed(3) + 'ms'
    };
  }
  
  /**
   * Enable overlay
   */
  enable() {
    if (!this.enabled) {
      this.enabled = true;
      console.log('✓ Node Inspect Overlay 1.0 enabled');
    }
  }
  
  /**
   * Disable overlay
   */
  disable() {
    if (this.enabled) {
      this.enabled = false;
      this.hideOverlay();
      console.log('✓ Node Inspect Overlay 1.0 disabled');
    }
  }

  /**
   * Initialize the HUD panel (DOM-based, not Three.js)
   * Creates a simple, lightweight HTML overlay
   */
  initializeHUD() {
    // ── Inject CSS (once) ────────────────────────────────────────────
    if (!document.getElementById('atoma-node-inspect-styles')) {
      const style = document.createElement('style');
      style.id = 'atoma-node-inspect-styles';
      style.textContent = `
        /* ── ATOMA Node Inspect Overlay — Minimalist v2.0 ── */
        #node-inspect-overlay {
          position: fixed;
          left: 10px;
          top: 315px;
          max-width: 280px;
          padding: 16px 18px;
          background: rgba(8, 12, 20, 0.75);
          backdrop-filter: blur(16px) saturate(1.2);
          -webkit-backdrop-filter: blur(16px) saturate(1.2);
          border-left: 2px solid rgba(111, 133, 191, 0.35);
          border-radius: 0 8px 8px 0;
          font-family: 'Rajdhani', 'Segoe UI', sans-serif;
          font-size: 12px;
          color: rgba(219, 226, 238, 0.85);
          z-index: 1150;
          pointer-events: none;
          user-select: none;
          display: none;
        }
        #node-inspect-overlay .inspect-archetype {
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 4px;
          letter-spacing: 0.05em;
        }
        #node-inspect-overlay .inspect-code {
          color: #9c8a5a;
          font-size: 10px;
          margin-bottom: 6px;
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
        }
        #node-inspect-overlay .inspect-meaning {
          color: #6f85bf;
          font-size: 10px;
          margin-bottom: 8px;
          font-style: italic;
          opacity: 0.8;
        }
        #node-inspect-overlay .inspect-personality {
          color: #9c8a5a;
          font-size: 11px;
          margin-bottom: 6px;
        }
        #node-inspect-overlay .inspect-storm-mood {
          color: #8b6a7b;
          font-size: 11px;
          margin-bottom: 6px;
        }
        #node-inspect-overlay .inspect-section {
          margin-bottom: 8px;
          border-top: 1px solid rgba(111, 133, 191, 0.1);
          padding-top: 6px;
        }
        #node-inspect-overlay .inspect-metrics {
          font-size: 11px;
          line-height: 1.6;
        }
        #node-inspect-overlay .inspect-metric-row {
          display: flex;
          align-items: center;
          margin: 4px 0;
          gap: 8px;
        }
        #node-inspect-overlay .inspect-metric-label {
          font-size: 8px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(219, 226, 238, 0.35);
          width: 28px;
          flex-shrink: 0;
          font-weight: 700;
        }
        #node-inspect-overlay .inspect-metric-bar-track {
          flex: 1;
          height: 3px;
          background: rgba(111, 133, 191, 0.06);
          border-radius: 2px;
          overflow: hidden;
        }
        #node-inspect-overlay .inspect-metric-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        #node-inspect-overlay .inspect-metric-bar-fill.bar-synergy {
          background: linear-gradient(90deg, rgba(111, 133, 191, 0.15), #6f85bf);
        }
        #node-inspect-overlay .inspect-metric-bar-fill.bar-harmony {
          background: linear-gradient(90deg, rgba(122, 105, 192, 0.15), #7a69c0);
        }
        #node-inspect-overlay .inspect-metric-bar-fill.bar-stability {
          background: linear-gradient(90deg, rgba(160, 169, 184, 0.15), #a0a9b8);
        }
        #node-inspect-overlay .inspect-metric-bar-fill.bar-corruption {
          background: linear-gradient(90deg, rgba(107, 91, 149, 0.15), #6b5b95);
        }
        #node-inspect-overlay .inspect-metric-bar-fill.bar-loadPressure {
          background: linear-gradient(90deg, rgba(139, 106, 123, 0.15), #8b6a7b);
        }
        #node-inspect-overlay .inspect-metric-value {
          font-size: 11px;
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          font-weight: 500;
          min-width: 36px;
          text-align: right;
          flex-shrink: 0;
        }
        #node-inspect-overlay .inspect-button {
          margin-top: 6px;
          padding: 3px 8px;
          font-size: 9px;
          background: rgba(111, 133, 191, 0.08);
          border: 1px solid rgba(111, 133, 191, 0.2);
          color: rgba(111, 133, 191, 0.6);
          cursor: pointer;
          pointer-events: auto;
          border-radius: 3px;
          font-family: 'Rajdhani', 'Segoe UI', sans-serif;
          letter-spacing: 0.05em;
          transition: background 0.2s ease, color 0.2s ease;
        }
        #node-inspect-overlay .inspect-button:hover {
          background: rgba(111, 133, 191, 0.15);
          color: rgba(219, 226, 238, 0.9);
        }
        #node-inspect-overlay .authority-row {
          font-size: 10px;
          color: rgba(219, 226, 238, 0.5);
          margin: 2px 0;
        }
        #node-inspect-overlay .authority-value {
          font-weight: 700;
        }
        #node-inspect-overlay .authority-value.pass { color: #a0a9b8; }
        #node-inspect-overlay .authority-value.warn { color: #9c8a5a; }
        #node-inspect-overlay .authority-value.fail { color: #8b6a7b; }
        #node-inspect-overlay .overlay-header {
          font-weight: 700;
          margin-bottom: 3px;
          color: rgba(111, 133, 191, 0.6);
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        #node-inspect-overlay .overlay-entry {
          margin-left: 8px;
          margin-bottom: 2px;
          font-size: 10px;
        }
        #node-inspect-overlay .overlay-name { color: rgba(111, 133, 191, 0.7); }
        #node-inspect-overlay .overlay-detail { color: #a0a9b8; }
        #node-inspect-overlay .event-entry {
          margin-left: 8px;
          color: #8b6a7b;
          font-size: 10px;
        }
      `;
      document.head.appendChild(style);
    }

    // ── Main container ───────────────────────────────────────────────
    this.hudPanel = document.createElement('div');
    this.hudPanel.id = 'node-inspect-overlay';
    this.hudPanel.setAttribute('data-hud-id', 'inspectorHUD');

    this.hudPanel.innerHTML = `
      <div id="node-archetype" class="inspect-archetype"></div>
      <div id="node-archetype-code" class="inspect-code"></div>
      <div id="node-archetype-meaning" class="inspect-meaning"></div>
      <div id="node-personality" class="inspect-personality"></div>
      <div id="node-storm-mood" class="inspect-storm-mood" style="display:none;"></div>
      <div id="node-authority-status" class="inspect-section" style="display:none;"></div>
      <div id="node-active-overlays" class="inspect-section" style="display:none;"></div>
      <div id="node-event-log" class="inspect-section" style="display:none;"></div>
      <div id="node-metrics" class="inspect-metrics"></div>
    `;

    const modeToggle = document.createElement('button');
    modeToggle.className = 'inspect-button';
    modeToggle.textContent = 'Switch to Glyph Mode';
    modeToggle.addEventListener('click', () => this.toggleMetricDisplayMode());
    this.hudPanel.appendChild(modeToggle);
    this.modeToggleButton = modeToggle;

    const overlayDebugToggle = document.createElement('button');
    overlayDebugToggle.className = 'inspect-button';
    overlayDebugToggle.textContent = 'Show Active Overlays';
    overlayDebugToggle.addEventListener('click', () => this.toggleActiveOverlayDebugMode());
    this.hudPanel.appendChild(overlayDebugToggle);
    this.activeOverlayDebugButton = overlayDebugToggle;
    this._syncActiveOverlayDebugButton();

    document.body.appendChild(this.hudPanel);
  }

  /**
   * Reposition Inspector HUD below Core Metrics HUD
   * @private
   */
  repositionBelowCoreMetrics() {
    // Deferred positioning to ensure Core Metrics exists in DOM
    const positionInspector = () => {
      const coreMetrics = document.getElementById('core-metrics-hud');
      if (coreMetrics) {
        const rect = coreMetrics.getBoundingClientRect();
        const inspectorTop = rect.bottom + 10; // 10px gap
        this.hudPanel.style.top = inspectorTop + 'px';
        this.hudPanel.style.bottom = '';
      }
    };
    
    // Try immediately
    positionInspector();
    
    // Also try after a short delay in case DOM is still loading
    setTimeout(positionInspector, 100);
    setTimeout(positionInspector, 500);
  }

  /**
   * Update inspection state (called from game loop, max 30Hz)
   * Checks for node targeting via raycast or proximity
   */
  update(deltaTime) {
    // Check if disabled
    if (this.enabled === false) {
      return;
    }
    
    // Throttle checks to 30Hz for performance
    this.lastCheckTime += deltaTime;
    if (this.lastCheckTime < this.checkInterval) {
      return;
    }
    this.lastCheckTime = 0;

    // Find targeted node
    const targetedNode = this.findTargetedNode();

    // Update inspection if node changed
    if (targetedNode !== this.currentNode) {
      this.currentNode = targetedNode;
      
      if (this.currentNode) {
        this.stats.inspections++;
        this.showOverlay();
        this.updateOverlayContent();
        
        // Trigger procedural poetry if available
        this.game?.poetryEngine?.generateNodePoetry?.(this.currentNode);
        
        // Trigger linguistic overlay if available
        if (this.linguisticOverlay) {
          this.linguisticOverlay.inspectNode(this.currentNode);
        }
      } else {
        this.hideOverlay();
        this.game?.poetryEngine?.hideNodePoetry?.();
        
        // Hide linguistic overlay if available
        if (this.linguisticOverlay) {
          this.linguisticOverlay.hideOverlay();
        }
      }
    } else if (this.currentNode) {
      // Node unchanged, but update display in case metrics changed
      // (though they shouldn't - they're frozen)
      const startTime = performance.now();
      this.updateOverlayContent();
      this.stats.updates++;
      this.stats.lastUpdateFrameTime = performance.now() - startTime;
    }
  }

  /**
   * Find the node being targeted via raycast or proximity
   * Uses existing raycaster if available, falls back to proximity check
   */
  findTargetedNode() {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    // Prefer explicit interaction state first.
    // Keeps inspector stable when hover state already exists, even if crosshair misses a proxy for a tick.
    const selectionCore = this.game?.selectionCore;
    const linkingSystem = this.game?.linkingSystem || this.game?.nodeLinking || null;
    const explicitTargets = [
      selectionCore?.hoveredNodeForSelection,
      linkingSystem?.hoveredNodeForSelection,
      selectionCore?.selectedNode,
      selectionCore?.primaryNode,
      linkingSystem?.selectedNode,
      this.game?.selectedNode
    ];

    for (const target of explicitTargets) {
      if (this._isSuppressedTarget(target, now)) {
        continue;
      }
      if (target?.userData?.category) {
        return target;
      }
    }

    // Method 1: Raycast from camera through center of screen (crosshair)
    const raycastNode = this.raycastFromCrosshair();
    if (raycastNode && !this._isSuppressedTarget(raycastNode, now)) return raycastNode;

    // Method 2: Proximity check (fallback)
    const proximityNode = this.checkProximity();
    if (proximityNode && !this._isSuppressedTarget(proximityNode, now)) return proximityNode;

    return null;
  }

  _isSuppressedTarget(node, now = null) {
    if (!node) return false;
    const timeNow = now ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (timeNow >= this._focusSuppressedUntil) {
      return false;
    }

    const nodeId = node?.userData?.nodeId || node?.userData?.id || node?.uuid || node?.id || null;
    if (!nodeId) return false;
    return this._suppressedNodeIds.has(String(nodeId));
  }

  /**
   * Raycast from camera through screen center (where crosshair would be)
   */
  raycastFromCrosshair() {
    const crosshairState = window.__crosshairRaycastState;
    if (!crosshairState || !crosshairState.node) return null;
    return crosshairState.node;
  }

  /**
    * Build or rebuild spatial index from scene nodes
    * Called lazily when needed to avoid overhead
    * @private
    */
  _buildSpatialIndex() {
    if (this.spatialIndexBuilt) return;
    
    // Clear existing index
    this.spatialIndex.clear();
    
    // Add all node objects from scene
    const allObjects = this.scene.children;
    allObjects.forEach(obj => {
      // Improved filter: check node-specific properties
      if (obj.userData && obj.userData.category && !obj.userData.isVFX) {
        // Check if object has geometry/bounds for proper distance calculation
        if (obj.geometry || obj.boundingBox || obj.children.length > 0) {
          this.spatialIndex.insert(obj);
        }
      }
    });
    
    this.spatialIndexBuilt = true;
  }

  /**
    * Check proximity - find closest node within range
    * UPDATED (Session 28): Extended to 5-meter hover range for better detection
    * Uses spatial index for O(log n) query instead of O(n) iteration
    */
  checkProximity() {
    // Build spatial index if not already built
    this._buildSpatialIndex();
    
    const proximityRange = 5.0; // Extended to 5 meters (Session 28 fix)
    const playerPos = this.camera.position;

    // Query spatial index for nodes within proximity range
    const candidates = this.spatialIndex.querySphere(playerPos, proximityRange);
    
    let closestNode = null;
    let closestDistance = proximityRange;

    // Find closest among candidates
    for (const obj of candidates) {
      const distance = playerPos.distanceTo(obj.position);
      
      // Only show if within 5-meter hover range
      if (distance < closestDistance && distance <= proximityRange) {
        closestDistance = distance;
        closestNode = obj;
      }
    }

    return closestNode;
  }

  /**
   * Show the overlay panel
   */
  showOverlay() {
    if (!this.isVisible && this.hudPanel) {
      this.hudPanel.style.display = 'block';
      this.isVisible = true;
    }
  }

  /**
   * Hide the overlay panel
   */
  hideOverlay() {
    if (this.isVisible && this.hudPanel) {
      this.hudPanel.style.display = 'none';
      this.isVisible = false;
    }
  }

  _getVisualRegistryAssignment(userData) {
    if (!userData || !this.nodeVisualRegistryNames?.nodes) return null;
    const code = userData.visualCode ?? userData.userData?.visualCode ?? userData.archetype;
    if (code != null) {
      const normalized = String(code);
      if (this.nodeVisualRegistryNames.nodes[normalized]) {
        return this.nodeVisualRegistryNames.nodes[normalized];
      }
    }

    // fallback by exact node data match
    if (userData.factoryName && userData.category && userData.archetypeTag) {
      return Object.values(nodeVisualRegistryNames.nodes).find((entry) => {
        return entry.factoryName === userData.factoryName &&
               entry.category === userData.category &&
               entry.archetypeTag === userData.archetypeTag;
      }) || null;
    }

    return null;
  }

  /**
   * Update overlay content based on current node
   * Gracefully handles missing fields
   */
  updateOverlayContent() {
    if (!this.currentNode || !this.hudPanel) return;

    const userData = this.currentNode.userData;
    if (!userData) return;

    try {
      // Get naming info from AtomaNamingEngine and LanguageEngine
      const assignment = this._getVisualRegistryAssignment(userData);
      const assignmentName = assignment?.name;
      const assignmentMeaning = assignment?.meaning;
      const namingCode = assignmentName || this.namingEngine.getNamingCodeForNode(userData.archetype || userData.category, userData);
      const namingLabel = assignmentMeaning || this.namingEngine.getNodeLabelForData(userData) || this.languageEngine.getShortLabel(this.inferArchetypeCode(userData));
      const namingMeaning = assignmentMeaning || this.namingEngine.getNodeMeaningForData(userData) || this.languageEngine.getFullName(this.inferArchetypeCode(userData));

      const archetypeCode = namingCode || userData.archetypeCode || this.inferArchetypeCode(userData);
      const archetype = this.getArchetypeName(userData);
      
      const category = userData.category || 'UNKNOWN';
      let languageName = namingLabel;
      let languageMeaning = namingMeaning;
      
      // Get metrics from simulation snapshot (read-only)
      const metrics = this._getSnapshotMetrics(this.currentNode) || {};
      
      // Update archetype display
      const archetypeEl = this.hudPanel.querySelector('#node-archetype');
      if (archetypeEl) {
        archetypeEl.textContent = archetype;
        archetypeEl.style.color = this.getArchetypeColor(archetype);
      }
      
      // Update archetype code display (naming engine code)
      const archetypeCodeEl = this.hudPanel.querySelector('#node-archetype-code');
      if (archetypeCodeEl) {
        archetypeCodeEl.textContent = archetypeCode ? `[${archetypeCode}]` : 'N/A';
      }
      
      // Update archetype meaning display (naming-derived description)
      const archetypeMeaningEl = this.hudPanel.querySelector('#node-archetype-meaning');
      if (archetypeMeaningEl) {
        archetypeMeaningEl.textContent = languageMeaning || languageName || 'Unclassified node';
      }

      // Update personality display (if available)
      const personalityEl = this.hudPanel.querySelector('#node-personality');
      if (personalityEl) {
        const personality = userData.personality;
        if (personality) {
          personalityEl.textContent = `${personality.type.replace(/_/g, ' ')} • ${personality.mood}`;
          personalityEl.style.display = 'block';
        } else {
          personalityEl.style.display = 'none';
        }
      }

      // Update Thought Storms mood (if available)
      this._updateStormMood();

      // Update Authority Status (if available)
      this._updateAuthorityStatus(category, archetypeCode);

      // Update active runtime overlay systems
      this._updateActiveOverlays();

      // Update event log display (if available)
      const eventLogEl = this.hudPanel.querySelector('#node-event-log');
      if (eventLogEl) {
        const eventLog = userData.eventLog;
        if (eventLog && eventLog.length > 0) {
          eventLogEl.innerHTML = `
            <div class="overlay-header">Recent Events:</div>
            ${eventLog.map(event => `<div class="event-entry">• ${event}</div>`).join('')}
          `;
          eventLogEl.style.display = 'block';
        } else {
          eventLogEl.style.display = 'none';
        }
      }

      // Update metrics display
      const metricsEl = this.hudPanel.querySelector('#node-metrics');
      if (metricsEl) {
        metricsEl.innerHTML = this.renderMetricsTable(metrics);
      }

    } catch (e) {
      // Fail silently - don't crash if data is malformed
      console.warn('NodeInspectOverlay: Error updating content', e);
    }
  }
  
  /**
   * Update Thought Storms mood display
   * @private
   */
  _updateStormMood() {
    const stormMoodEl = this.hudPanel.querySelector('#node-storm-mood');
    if (!stormMoodEl) return;
    
    if (this.thoughtStormsSystem && this.thoughtStormsSystem.stormState) {
      const stormMood = this.thoughtStormsSystem.stormState.currentMood || 'CALM';
      stormMoodEl.textContent = `Storm: ${stormMood}`;
      stormMoodEl.style.display = 'block';
    } else {
      stormMoodEl.style.display = 'none';
    }
  }
  
  /**
   * Update Authority Status display
   * @private
   */
  _updateAuthorityStatus(category, archetypeCode) {
    const authorityEl = this.hudPanel.querySelector('#node-authority-status');
    if (!authorityEl) return;
    
    try {
      // Try to get authority info from global registry (if available)
      const isCompliant = !!this.currentNode.userData.enhancedNodeModelBinding;
      const isLocked = this.currentNode.userData.loggedAuthority === true;
      
      // Try to check uniqueness (requires nodeSpawnRegistry)
      let isUnique = false;
      if (window.nodeSpawnRegistry && archetypeCode) {
        const existingId = window.nodeSpawnRegistry.getExistingNodeId(
          category,
          archetypeCode
        );
        const currentNodeId = this.currentNode.userData.nodeId || this.currentNode.uuid;
        isUnique = existingId === currentNodeId;
      }
      
      // Build authority HTML
      let html = '';
      html += `<div class="authority-row">Compliance: <span class="authority-value ${isCompliant ? 'pass' : 'fail'}">${isCompliant ? 'VERIFIED' : 'FAILED'}</span></div>`;
      html += `<div class="authority-row">Integrity: <span class="authority-value ${isLocked ? 'pass' : 'warn'}">${isLocked ? 'LOCKED' : 'OPEN'}</span></div>`;
      
      // Only show uniqueness if we could determine it
      if (window.nodeSpawnRegistry) {
        html += `<div class="authority-row">Uniqueness: <span class="authority-value ${isUnique ? 'warn' : ''}">${isUnique ? 'SINGLETON' : 'GENERIC'}</span></div>`;
      }
      
      authorityEl.innerHTML = html;
      authorityEl.style.display = 'block';
      
    } catch (e) {
      // If authority check fails, hide the section
      authorityEl.style.display = 'none';
    }
  }

  _updateActiveOverlays() {
    const overlaysEl = this.hudPanel.querySelector('#node-active-overlays');
    if (!overlaysEl) return;

    if (!this.activeOverlaysDebugEnabled) {
      overlaysEl.style.display = 'none';
      overlaysEl.innerHTML = '';
      return;
    }

    const activeOverlays = this._collectActiveOverlaySystems();
    if (activeOverlays.length === 0) {
      overlaysEl.innerHTML = `
        <div class="overlay-header">Active Overlays:</div>
        <div class="overlay-entry"><span class="overlay-detail">No active overlays</span></div>
      `;
      overlaysEl.style.display = 'block';
      return;
    }

    overlaysEl.innerHTML = `
      <div class="overlay-header">Active Overlays:</div>
      ${activeOverlays.map(({ name, detail }) => `
        <div class="overlay-entry">
          <span class="overlay-name">${this._escapeHtml(name)}</span>
          ${detail ? `<span class="overlay-detail"> · ${this._escapeHtml(detail)}</span>` : ''}
        </div>
      `).join('')}
    `;
    overlaysEl.style.display = 'block';
  }

  toggleActiveOverlayDebugMode() {
    return this.setActiveOverlayDebugMode(!this.activeOverlaysDebugEnabled);
  }

  setActiveOverlayDebugMode(enabled) {
    this.activeOverlaysDebugEnabled = !!enabled;
    this._syncActiveOverlayDebugButton();

    if (this.currentNode) {
      this._updateActiveOverlays();
    } else {
      this._hideActiveOverlaysSection();
    }

    return this.activeOverlaysDebugEnabled;
  }

  _syncActiveOverlayDebugButton() {
    if (!this.activeOverlayDebugButton) return;
    this.activeOverlayDebugButton.textContent = this.activeOverlaysDebugEnabled
      ? 'Hide Active Overlays'
      : 'Show Active Overlays';
  }

  _hideActiveOverlaysSection() {
    const overlaysEl = this.hudPanel?.querySelector('#node-active-overlays');
    if (!overlaysEl) return;
    overlaysEl.style.display = 'none';
    overlaysEl.innerHTML = '';
  }

  _collectActiveOverlaySystems(node = this.currentNode) {
    if (!node) return [];

    const entries = [];
    const nodeId = this._getRuntimeNodeKey(node);
    const nodeUuid = node?.uuid || null;

    const evolutionState = nodeId ? this.game?.evolutionManager?.registry?.[nodeId] : null;
    if (Array.isArray(evolutionState?.activeMutations) && evolutionState.activeMutations.length > 0) {
      const detailParts = [`stage ${evolutionState.stage}`];
      const mutationList = this._formatOverlayList(evolutionState.activeMutations);
      if (mutationList) {
        detailParts.push(mutationList);
      }
      entries.push({
        name: 'SafeEvolutionManager',
        detail: detailParts.join(' · ')
      });
    }

    const microEventKeys = this._getNodeMicroEventKeys(nodeUuid);
    if (microEventKeys.length > 0) {
      entries.push({
        name: 'NodeMicroEvents',
        detail: this._formatOverlayList(microEventKeys)
      });
    }

    const fusionEntry = this._getGlyphFusionOverlayEntry(nodeId, nodeUuid);
    if (fusionEntry) {
      entries.push(fusionEntry);
    }

    const linkedAuraEntry = this._getLinkedAuraOverlayEntry(node);
    if (linkedAuraEntry) {
      entries.push(linkedAuraEntry);
    }

    const hubAuraEntry = this._getHarmonicHubOverlayEntry(nodeId);
    if (hubAuraEntry) {
      entries.push(hubAuraEntry);
    }

    const selectionEntry = this._getSelectionOverlayEntry(node);
    if (selectionEntry) {
      entries.push(selectionEntry);
    }

    const embeddedOverlayKeys = this._getVisibleEmbeddedOverlayKeys(node);
    if (embeddedOverlayKeys.length > 0) {
      entries.push({
        name: 'AINodes Embedded Overlays',
        detail: this._formatOverlayList(embeddedOverlayKeys)
      });
    }

    return entries;
  }

  _getRuntimeNodeKey(node) {
    return node?.userData?.nodeId || node?.id || node?.uuid || null;
  }

  _getNodeMicroEventKeys(nodeUuid) {
    if (!nodeUuid) return [];

    const activeVisuals = this.game?.nodeMicroEvents?.activeVisuals;
    if (!(activeVisuals instanceof Map)) {
      return [];
    }

    const prefix = `${nodeUuid}_`;
    const keys = new Set();
    for (const visualKey of activeVisuals.keys()) {
      if (typeof visualKey !== 'string' || !visualKey.startsWith(prefix)) {
        continue;
      }
      keys.add(this._humanizeOverlayToken(visualKey.slice(prefix.length)));
    }

    return Array.from(keys).sort();
  }

  _getGlyphFusionOverlayEntry(nodeId, nodeUuid) {
    const fusionOverlay = this.game?.glyphFusionOverlay;
    if (!fusionOverlay || fusionOverlay.enabled === false) {
      return null;
    }

    const fusionKey =
      (nodeId && fusionOverlay.nodeFusionMap?.has?.(nodeId) && nodeId) ||
      (nodeUuid && fusionOverlay.nodeFusionMap?.has?.(nodeUuid) && nodeUuid) ||
      null;

    if (!fusionKey) {
      return null;
    }

    const fusionData = fusionOverlay.nodeFusionMap?.get?.(fusionKey) || null;
    const animState = fusionOverlay.animationState?.get?.(fusionKey) || null;
    const intensity = Number.isFinite(fusionData?.intensity)
      ? fusionData.intensity
      : (Number.isFinite(animState?.currentFadeTarget) ? animState.currentFadeTarget : 0);
    const meshCount = Array.isArray(fusionData?.meshes) ? fusionData.meshes.length : 0;

    if (meshCount === 0 && intensity <= 0.05) {
      return null;
    }

    const detailParts = [];
    if (fusionData?.meaningType) {
      detailParts.push(this._humanizeOverlayToken(fusionData.meaningType));
    }
    if (meshCount > 0) {
      detailParts.push(`${meshCount} meshes`);
    }
    if (intensity > 0.05) {
      detailParts.push(`intensity ${this.clamp01(intensity).toFixed(2)}`);
    }

    return {
      name: 'GlyphFusionOverlay4_1',
      detail: detailParts.join(' · ') || 'active'
    };
  }

  _getLinkedAuraOverlayEntry(node) {
    const auraSystem = this.game?.nodeAuraSystem;
    if (!auraSystem || auraSystem.enabled === false) {
      return null;
    }

    const auraData = auraSystem.nodeAuras?.get?.(node) || null;
    if (!auraData || auraData.linkCount <= 0) {
      return null;
    }

    const detailParts = [`${auraData.linkCount} links`];
    if (auraData.harmonyBand) {
      detailParts.push(`band ${this._humanizeOverlayToken(auraData.harmonyBand)}`);
    }
    if (auraData.spikeActive) {
      detailParts.push('spike');
    }

    return {
      name: 'NodeLinkedAuraSystem',
      detail: detailParts.join(' · ')
    };
  }

  _getHarmonicHubOverlayEntry(nodeId) {
    if (!nodeId) {
      return null;
    }

    const hubSystem = this.game?.harmonicHubAuraSystem;
    if (!hubSystem || hubSystem.config?.enabled === false) {
      return null;
    }

    const hubId = hubSystem.nodeToHub?.get?.(nodeId) || null;
    if (!hubId) {
      return null;
    }

    const hub = hubSystem.hubs?.get?.(hubId) || null;
    if (!hub?.active) {
      return null;
    }

    const detailParts = [hubId];
    if (Array.isArray(hub.nodes) && hub.nodes.length > 0) {
      detailParts.push(`${hub.nodes.length} nodes`);
    }
    if (Number.isFinite(hub.harmony)) {
      detailParts.push(`harmony ${this.clamp01(hub.harmony).toFixed(2)}`);
    }

    return {
      name: 'HarmonicHubAuraSystem',
      detail: detailParts.join(' · ')
    };
  }

  _getSelectionOverlayEntry(node) {
    const linkingSystem = this.game?.linkingSystem || this.game?.nodeLinking || null;
    if (!linkingSystem) {
      return null;
    }

    const detailParts = [];
    if (linkingSystem.hoveredNodeForSelection === node || linkingSystem.nodeSelectionGlows?.has?.(node)) {
      detailParts.push('hover glow');
    }
    if (linkingSystem.selectedNode === node || linkingSystem.primaryNode === node) {
      detailParts.push('primary highlight');
    }

    if (detailParts.length === 0) {
      return null;
    }

    return {
      name: 'NodeLinkingSystem',
      detail: detailParts.join(' · ')
    };
  }

  _getVisibleEmbeddedOverlayKeys(node) {
    const overlays = node?.userData?.overlays;
    if (!overlays || typeof overlays !== 'object') {
      return [];
    }

    const ignoredKeys = new Set(['interaction-proxy', 'point-light']);
    const visibleKeyCounts = new Map();

    for (const [key, overlay] of Object.entries(overlays)) {
      if (ignoredKeys.has(key) || !overlay) {
        continue;
      }

      if (overlay.visible === false || overlay.userData?.neutralized === true) {
        continue;
      }

      const label = this._humanizeOverlayToken(String(key).replace(/-[0-9a-f-]{8,}$/i, ''));
      visibleKeyCounts.set(label, (visibleKeyCounts.get(label) || 0) + 1);
    }

    return Array.from(visibleKeyCounts.entries())
      .map(([label, count]) => count > 1 ? `${label} x${count}` : label)
      .sort();
  }

  _formatOverlayList(items, maxItems = 3) {
    if (!Array.isArray(items) || items.length === 0) {
      return '';
    }

    const filtered = items.filter(Boolean);
    const shown = filtered.slice(0, maxItems).join(', ');
    if (filtered.length <= maxItems) {
      return shown;
    }

    return `${shown} +${filtered.length - maxItems}`;
  }

  _humanizeOverlayToken(value) {
    const normalized = String(value || '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalized) {
      return '';
    }

    return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  _escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  _getSnapshotMetrics(node) {
    const liveMetrics = node?.userData?.metrics;
    if (liveMetrics && typeof liveMetrics === 'object') {
      return liveMetrics;
    }

    const snapshot = this.game?.metricsRuntime_v1?.lastSimulationSnapshot;
    if (!snapshot?.nodes) return null;
    const id = node?.userData?.nodeId || node?.userData?.id || node?.id;
    if (!id) return null;
    const entry = snapshot.nodes.find(n => n.id === id);
    return entry?.metrics || null;
  }

  /**
   * Switch display mode between numeric and glyph.
   */
  toggleMetricDisplayMode() {
    const newMode = this.metricDisplayMode === METRIC_DISPLAY_MODES.NUMERIC
      ? METRIC_DISPLAY_MODES.GLYPH
      : METRIC_DISPLAY_MODES.NUMERIC;
    this.setMetricDisplayMode(newMode);
  }

  /**
   * Set display mode explicitly.
   */
  setMetricDisplayMode(mode) {
    if (!Object.values(METRIC_DISPLAY_MODES).includes(mode)) return;
    this.metricDisplayMode = mode;
    if (this.modeToggleButton) {
      this.modeToggleButton.textContent = mode === METRIC_DISPLAY_MODES.GLYPH
        ? 'Switch to Numeric Mode'
        : 'Switch to Glyph Mode';
    }
    // Recompute metrics text if currently visible
    if (this.currentNode) {
      this.updateOverlayContent();
    }
  }

  /**
   * Format metric value either numeric or glyph-based.
   */
  formatMetricValue(value) {
    const clamped = this.clamp01(value);
    if (this.metricDisplayMode === METRIC_DISPLAY_MODES.GLYPH) {
      return this.formatGlyphFromString(this.formatFloat(clamped));
    }
    return this.formatFloat(clamped);
  }

  /**
   * Convert numeric string to glyph string.
   */
  formatGlyphFromString(valueString) {
    if (typeof valueString !== 'string') return '';
    let out = '';
    for (const ch of valueString) {
      out += DIGIT_GLYPHS[ch] || ch;
    }
    return out;
  }

  onSimulationTick(snapshot) {
    this.lastSnapshot = snapshot;
    this._lastExternalTickAt = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    // reuse throttling interval: run one update pass per simulation tick
    console.log("NODE INSPECT UPDATE");
    this.update(this.checkInterval);
  }

  /**
   * Infer archetype code from node category
   * Maps standard categories to standardized archetype codes
   */
  inferArchetypeCode(userData) {
    const categoryToCode = {
      'input': 'QNT-ORB-HLD',
      'process': 'SIG-VEC-RSP',
      'integration': 'NEX-ORB-CPL',
      'analytics': 'AET-HEX-SYN',
      'storage': 'UMB-ORB-HLD',
      'control': 'ASC-CRW-PRM',
      'sigma': 'SIG-CRW-NEX',
      'quantum': 'QNT-HEX-VAR',
      'emotional': 'ECO-TOR-FLX',
    };
    
    const category = userData.category || 'input';
    return categoryToCode[category.toLowerCase()] || null;
  }

  /**
   * Get archetype name from node data
   * Maps category to archetype if possible
   */
  getArchetypeName(userData) {
    // If metrics exist, use archetype from there
    if (userData.metrics && userData.metrics.archetype) {
      return userData.metrics.archetype.toUpperCase();
    }

    // Map category to archetype
    const categoryToArchetype = {
      'input': 'INPUT',
      'process': 'PROCESS',
      'integration': 'INTEGRATION',
      'analytics': 'ANALYTICS',
      'storage': 'STORAGE',
      'control': 'CONTROL',
      'quantum': 'QUANTUM',
      'sigma': 'CONVERGENCE',
      'emotional': 'HARMONIC',
    };

    const category = userData.category || 'UNKNOWN';
    return categoryToArchetype[category.toLowerCase()] || category.toUpperCase();
  }

  /**
   * Get color for archetype name based on theme
   */
  getArchetypeColor(archetype) {
    const colors = {
      'CRYSTAL': '#6f85bf',
      'HARMONIC': '#66508f',
      'FRACTAL': '#7a69c0',
      'QUANTUM': '#8b6a7b',
      'UMBRA': '#4a5568',
      'SOLAR': '#9c8a5a',
      'GLYPH': '#728096',
      'ECHO': '#6f85bf',
      'CONVERGENCE': '#66508f',
      'ASCENDED': '#dbe2ee',
      'INPUT': '#728096',
      'PROCESS': '#6f85bf',
      'INTEGRATION': '#7a69c0',
      'ANALYTICS': '#8b6a7b',
      'STORAGE': '#a0a9b8',
      'CONTROL': '#9c8a5a',
    };

    return colors[archetype] || '#6f85bf';
  }

  /**
   * Render metrics as HTML table with bars
   * Gracefully skips missing metrics
   */
  renderMetricsTable(metrics) {
    const metricsList = [
      { name: 'SYN', key: 'synergy' },
      { name: 'HRM', key: 'harmony' },
      { name: 'STB', key: 'stability' },
      { name: 'CPT', key: 'corruption' },
      { name: 'LOD', key: 'loadPressure' },
    ];

    return metricsList.map(metric => {
      const value = metrics[metric.key];
      
      // Skip if metric doesn't exist (graceful degradation)
      if (value === undefined || value === null) {
        return '';
      }

      const v = Math.max(0, Math.min(1, value));
      const widthPercent = (v * 100).toFixed(1);

      return `
        <div class="inspect-metric-row">
          <span class="inspect-metric-label">${metric.name}</span>
          <div class="inspect-metric-bar-track">
            <div class="inspect-metric-bar-fill bar-${metric.key}" style="width:${widthPercent}%"></div>
          </div>
          <span class="inspect-metric-value">${this.formatMetricValue(value)}</span>
        </div>
      `;
    }).join('');
  }

  /**
   * Destroy overlay (cleanup)
   */
  destroy() {
    if (this._fallbackPollHandle) {
      clearInterval(this._fallbackPollHandle);
      this._fallbackPollHandle = null;
    }
    if (this.hudPanel && this.hudPanel.parentNode) {
      this.hudPanel.parentNode.removeChild(this.hudPanel);
    }
    this.hudPanel = null;
  }

  /**
   * Check if overlay is currently visible
   */
  isOverlayVisible() {
    return this.isVisible;
  }

  /**
   * Get current inspected node (debug/testing)
   */
  getCurrentNode() {
    return this.currentNode;
  }

  /**
   * Clamp a metric float to [0, 1]
   */
  clamp01(value) {
    const num = Number.isFinite(value) ? value : 0;
    return Math.max(0, Math.min(1, num));
  }

  /**
   * Format a clamped float (0..1) for display
   */
  formatFloat(value) {
    return this.clamp01(value).toFixed(2);
  }
  /**
   * Force hide overlay (for debugging/special states)
   */
  forceHide() {
    this.hideOverlay();
    this.currentNode = null;
  }
}
