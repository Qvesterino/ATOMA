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
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        this._focusSuppressedUntil = now + 300;
        this._suppressedNodeIds = new Set([
          payload?.sourceNodeId || payload?.source || payload?.sourceNode?.userData?.nodeId || payload?.sourceNode?.uuid || null,
          payload?.targetNodeId || payload?.target || payload?.targetNode?.userData?.nodeId || payload?.targetNode?.uuid || null
        ].filter(Boolean).map(String));
        this.currentNode = null;
        this.hideOverlay();
      });
    }

    const linkingSystem = this.game?.linkingSystem || this.game?.nodeLinking || null;
    if (linkingSystem?.registerLinkCreatedCallback) {
      this._linkCreatedCallback = (sourceNode, targetNode) => {
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        this._focusSuppressedUntil = now + 300;
        this._suppressedNodeIds = new Set([
          sourceNode?.userData?.nodeId || sourceNode?.userData?.id || sourceNode?.uuid || null,
          targetNode?.userData?.nodeId || targetNode?.userData?.id || targetNode?.uuid || null
        ].filter(Boolean).map(String));
        this.currentNode = null;
        this.hideOverlay();
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
      close: () => {
        this.hideOverlay();
        this.currentNode = null;
        console.log('✓ Overlay closed');
      },
      getCurrentNode: () => this.currentNode
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
    // Create container
    // SIMPLE FIX: Hard-coded position at top: 170px
    // Position: left: 10px, top: 170px (absolute, no dynamic calculation)
    // Shows node data ONLY, no title bar, no collapse arrow
    this.hudPanel = document.createElement('div');
    this.hudPanel.id = 'node-inspect-overlay';
    this.hudPanel.setAttribute('data-hud-id', 'inspectorHUD');
    this.hudPanel.style.cssText = `
      position: fixed;
      left: 10px;
      top: 315px;
      transform: none;
      width: auto;
      max-width: 280px;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid rgba(0, 255, 255, 0.5);
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #00ffff;
      z-index: 1150;
      pointer-events: none;
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
      display: none;
    `;

    this.hudPanel.innerHTML = `
      <div id="node-archetype" style="font-weight: bold; margin-bottom: 4px; font-size: 14px;"></div>
      <div id="node-archetype-code" style="color: #ffaa00; font-size: 10px; margin-bottom: 6px; font-family: 'Courier New', monospace;"></div>
      <div id="node-archetype-meaning" style="color: #88ff88; font-size: 10px; margin-bottom: 8px; font-style: italic;"></div>
      <div id="node-category" style="color: #00ff88; font-size: 11px; margin-bottom: 6px;"></div>
      <div id="node-personality" style="color: #ffaa00; font-size: 11px; margin-bottom: 6px;"></div>
      <div id="node-storm-mood" style="color: #ff00ff; font-size: 11px; margin-bottom: 6px; display: none;"></div>
      <div id="node-authority-status" style="margin-bottom: 8px; border-top: 1px solid rgba(0, 255, 255, 0.3); padding-top: 6px; display: none;"></div>
      <div id="node-event-log" style="color: #ff00ff; font-size: 10px; margin-bottom: 8px; border-top: 1px solid rgba(255, 0, 255, 0.3); padding-top: 6px; display: none;"></div>
      <div id="node-metrics" style="font-size: 11px; line-height: 1.6;"></div>
    `;

    const modeToggle = document.createElement('button');
    modeToggle.id = 'node-inspect-overlay-display-mode-toggle';
    modeToggle.textContent = 'Switch to Glyph Mode';
    modeToggle.style.cssText = `
      margin-top: 8px;
      padding: 3px 6px;
      font-size: 10px;
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid rgba(0, 255, 255, 0.5);
      color: #00ffff;
      cursor: pointer;
      pointer-events: auto;
      border-radius: 3px;
    `;
    modeToggle.addEventListener('click', () => this.toggleMetricDisplayMode());
    this.hudPanel.appendChild(modeToggle);
    this.modeToggleButton = modeToggle;

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

      // Update category display with naming phrase embedded
      const categoryEl = this.hudPanel.querySelector('#node-category');
      if (categoryEl) {
        categoryEl.textContent = `Category: ${category.toUpperCase()} • Name: ${languageName}`;
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

      // Update event log display (if available)
      const eventLogEl = this.hudPanel.querySelector('#node-event-log');
      if (eventLogEl) {
        const eventLog = userData.eventLog;
        if (eventLog && eventLog.length > 0) {
          eventLogEl.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 3px;">Recent Events:</div>
            ${eventLog.map(event => `<div style="margin-left: 8px; color: #ff88ff;">• ${event}</div>`).join('')}
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
      let html = '<div style="font-size: 10px;">';
      html += `<div style="color: #aaaaaa;">Compliance: <span style="color: ${isCompliant ? '#00ff00' : '#ff0000'}; font-weight: bold;">${isCompliant ? 'VERIFIED' : 'FAILED'}</span></div>`;
      html += `<div style="color: #aaaaaa;">Integrity: <span style="color: ${isLocked ? '#00ff00' : '#ffff00'}; font-weight: bold;">${isLocked ? 'LOCKED' : 'OPEN'}</span></div>`;
      
      // Only show uniqueness if we could determine it
      if (window.nodeSpawnRegistry) {
        html += `<div style="color: #aaaaaa;">Uniqueness: <span style="color: ${isUnique ? '#ffaa00' : '#aaaaaa'}; font-weight: bold;">${isUnique ? 'SINGLETON' : 'GENERIC'}</span></div>`;
      }
      
      html += '</div>';
      
      authorityEl.innerHTML = html;
      authorityEl.style.display = 'block';
      
    } catch (e) {
      // If authority check fails, hide the section
      authorityEl.style.display = 'none';
    }
  }

  _getSnapshotMetrics(node) {
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
      'CRYSTAL': '#00ffff',
      'HARMONIC': '#00ff88',
      'FRACTAL': '#ff00ff',
      'QUANTUM': '#ff0080',
      'UMBRA': '#8800ff',
      'SOLAR': '#ffcc00',
      'GLYPH': '#00ff00',
      'ECHO': '#8080ff',
      'CONVERGENCE': '#ff8000',
      'ASCENDED': '#ffffff',
      'INPUT': '#00ff88',
      'PROCESS': '#0080ff',
      'INTEGRATION': '#aa00ff',
      'ANALYTICS': '#ff00ff',
      'STORAGE': '#00ffaa',
      'CONTROL': '#ffaa00',
    };

    return colors[archetype] || '#00ffff';
  }

  /**
   * Render metrics as HTML table with bars
   * Gracefully skips missing metrics
   */
  renderMetricsTable(metrics) {
  const metricsList = [
    { name: 'Synergy', key: 'synergy' },
    { name: 'Harmony', key: 'harmony' },
    { name: 'Stability', key: 'stability' },
    { name: 'Corruption', key: 'corruption' },
    { name: 'Load', key: 'loadPressure' },
    ];

    return metricsList.map(metric => {
      const value = metrics[metric.key];
      
      // Skip if metric doesn't exist (graceful degradation)
      if (value === undefined || value === null) {
        return '';
      }
const v = Math.max(0, Math.min(1, value));
const barLength = Math.round(v * 10);
const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);

      // Create simple bar (5-10 segments)


      return `
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>${metric.name}:</span>
          <span style="font-weight: bold; color: #00ff88;">${this.formatMetricValue(value)}</span>
        </div>
        <div style="font-size: 10px; color: #00ff88; margin-bottom: 4px;">${bar}</div>
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
    return this.clamp01(value).toFixed(6);
  }
  /**
   * Force hide overlay (for debugging/special states)
   */
  forceHide() {
    this.hideOverlay();
    this.currentNode = null;
  }
}
