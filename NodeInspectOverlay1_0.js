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
 */

import * as THREE from 'three';
import { CameraSteadyFix1_0 } from './CameraSteadyFix1_0.js';
import { AtomaLanguageEngine2_0 } from './_AtomaLanguageEngine2_0.js';

export class NodeInspectOverlay1_0 {
  constructor(scene, camera, renderer, linguisticOverlay = null) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    // CAMERA STEADY FIX: Ensure camera stays stable
    this.cameraSteadyFix = new CameraSteadyFix1_0();
    
    // ATOMA Language Engine: For archetype naming
    this.languageEngine = new AtomaLanguageEngine2_0();
    
    // Linguistic Overlay: For semantic language display (optional)
    this.linguisticOverlay = linguisticOverlay;
    
    // Timing control (20-30Hz max = every 33-50ms)
    this.lastCheckTime = 0;
    this.checkInterval = 1 / 25; // ~40ms (25Hz - reduced from 30Hz)
    
    // Current inspection state
    this.currentNode = null;
    this.previousNode = null;
    
    // Raycaster for crosshair detection
    this.raycaster = new THREE.Raycaster();
    this.raycasterDirection = new THREE.Vector3(0, 0, -1);
    
    // HUD panel (DOM element)
    this.hudPanel = null;
    this.isVisible = false;
    
    // Initialize HUD
    this.initializeHUD();
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
      <div id="node-event-log" style="color: #ff00ff; font-size: 10px; margin-bottom: 8px; border-top: 1px solid rgba(255, 0, 255, 0.3); padding-top: 6px; display: none;"></div>
      <div id="node-metrics" style="font-size: 11px; line-height: 1.6;"></div>
    `;

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
        this.showOverlay();
        this.updateOverlayContent();
        
        // Trigger linguistic overlay if available
        if (this.linguisticOverlay) {
          this.linguisticOverlay.inspectNode(this.currentNode);
        }
      } else {
        this.hideOverlay();
        
        // Hide linguistic overlay if available
        if (this.linguisticOverlay) {
          this.linguisticOverlay.hideOverlay();
        }
      }
    } else if (this.currentNode) {
      // Node unchanged, but update display in case metrics changed
      // (though they shouldn't - they're frozen)
      this.updateOverlayContent();
    }
  }

  /**
   * Find the node being targeted via raycast or proximity
   * Uses existing raycaster if available, falls back to proximity check
   */
  findTargetedNode() {
    // Method 1: Raycast from camera through center of screen (crosshair)
    const raycastNode = this.raycastFromCrosshair();
    if (raycastNode) return raycastNode;

    // Method 2: Proximity check (fallback)
    const proximityNode = this.checkProximity();
    if (proximityNode) return proximityNode;

    return null;
  }

  /**
   * Raycast from camera through screen center (where crosshair would be)
   */
  raycastFromCrosshair() {
    // Set up raycaster from camera through center of screen
    this.raycaster.setFromCamera(
      new THREE.Vector2(0, 0), // Screen center
      this.camera
    );

    // Get all nodes in scene (filter by userData.category to identify nodes)
    const allObjects = this.scene.children;
    const nodeObjects = allObjects.filter(obj => 
      obj.userData && obj.userData.category && !obj.userData.isVFX
    );

    if (nodeObjects.length === 0) return null;

    // Raycast against node objects
    const intersects = this.raycaster.intersectObjects(nodeObjects, false);

    // Return first (closest) intersected node
    if (intersects.length > 0) {
      const intersection = intersects[0];
      
      // Find the root node (traverse up to get the main node object)
      let node = intersection.object;
      while (node.parent && node.parent !== this.scene) {
        if (node.userData && node.userData.category) {
          return node;
        }
        node = node.parent;
      }
      
      return node;
    }

    return null;
  }

  /**
   * Check proximity - find closest node within range
   * UPDATED (Session 28): Extended to 5-meter hover range for better detection
   * Uses raycast from camera toward cursor position for accuracy
   */
  checkProximity() {
    const proximityRange = 5.0; // Extended to 5 meters (Session 28 fix)
    const playerPos = this.camera.position;

    let closestNode = null;
    let closestDistance = proximityRange;

    const allObjects = this.scene.children;
    allObjects.forEach(obj => {
      // Improved filter: check node-specific properties
      if (obj.userData && obj.userData.category && !obj.userData.isVFX) {
        // Check if object has geometry/bounds for proper distance calculation
        if (obj.geometry || obj.boundingBox || obj.children.length > 0) {
          const distance = playerPos.distanceTo(obj.position);
          
          // Only show if within 5-meter hover range
          if (distance < closestDistance && distance <= proximityRange) {
            closestDistance = distance;
            closestNode = obj;
          }
        }
      }
    });

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

  /**
   * Update overlay content based on current node
   * Gracefully handles missing fields
   */
  updateOverlayContent() {
    if (!this.currentNode || !this.hudPanel) return;

    const userData = this.currentNode.userData;
    if (!userData) return;

    try {
      // Get archetype code and name from Language Engine
      const archetypeCode = userData.archetypeCode || this.inferArchetypeCode(userData);
      const archetype = this.getArchetypeName(userData);
      
      // Get language engine info
      let languageName = '';
      let languageMeaning = '';
      if (archetypeCode) {
        languageName = this.languageEngine.getShortLabel(archetypeCode);
        languageMeaning = this.languageEngine.getFullName(archetypeCode);
      }
      
      // Get category (functional type)
      const category = userData.category || 'UNKNOWN';
      
      // Get metrics (safely)
      const metrics = userData.metrics || {};
      
      // Update archetype display
      const archetypeEl = this.hudPanel.querySelector('#node-archetype');
      if (archetypeEl) {
        archetypeEl.textContent = archetype;
        archetypeEl.style.color = this.getArchetypeColor(archetype);
      }
      
      // Update archetype code display
      const archetypeCodeEl = this.hudPanel.querySelector('#node-archetype-code');
      if (archetypeCodeEl) {
        archetypeCodeEl.textContent = archetypeCode ? `[${archetypeCode}]` : 'N/A';
      }
      
      // Update archetype meaning display
      const archetypeMeaningEl = this.hudPanel.querySelector('#node-archetype-meaning');
      if (archetypeMeaningEl) {
        archetypeMeaningEl.textContent = languageName || languageMeaning || 'Unclassified node';
      }

      // Update category display
      const categoryEl = this.hudPanel.querySelector('#node-category');
      if (categoryEl) {
        categoryEl.textContent = `Category: ${category.toUpperCase()}`;
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
          <span style="font-weight: bold; color: #00ff88;">${this.formatFloat(value)}</span>
        </div>
        <div style="font-size: 10px; color: #00ff88; margin-bottom: 4px;">${bar}</div>
      `;
    }).join('');
  }

  /**
   * Destroy overlay (cleanup)
   */
  destroy() {
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