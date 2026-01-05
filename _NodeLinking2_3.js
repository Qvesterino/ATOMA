/**
 * NODE LINKING 2.3 (UNIFIED MOUSE + PRIMARY NODE DOUBLE-CLICK) — HARD OVERRIDE
 *
 * Zmeny oproti pôvodnej verzii:
 * - Vlastná double-click detekcia (performance.now, bez selectionCore.recordClickForDoubleDetection)
 * - RMB firewall: zachytáva mousedown/mouseup pre button === 2 a stopuje propagáciu
 * - Fallback HUD: jednoduchý textový banner "SELECTED: ..." aj bez UISelectedNodeTopBar
 */

import * as THREE from 'three';
import { filterRaycastIntersections } from './CanonicalInteractionFilter.js';
import { SafeNodeUnlinking3_3 } from './_SafeNodeUnlinking3_3.js';
import { getLinkTarget, hasValidLinkTarget } from './LinkStateVisualLock.js';

/**
 * SANDBOXING GUARD: Prevents mutations of protected node visual layers
 * Protects: hologram shells, auras, core meshes, node roots
 */
function shouldSkipLegacyVisualMutation(obj) {
  return (
    obj?.userData?.isHologramShell ||
    obj?.userData?.isAura ||
    obj?.userData?.isCoreMesh ||
    obj?.userData?.isNodeRoot
  );
}

export class NodeLinking2_3 {
  constructor(scene, camera, renderer, selectionCore = null, linkingSystem = null, allNodes = null) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.selectionCore = selectionCore;
    this.linkingSystem = linkingSystem;
    this.allNodes = allNodes || [];

    // Raycasting
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // UI references
    this.uiTopBar = null;
    this.uiNodeInspectPanel = null;
    this.uiContextMenu = null;
    this.uiSelectedNodeBadge = null;
    this.uiSelectedNodeHighlight = null;
    this.uiSelectedNodeLabel = null;
    this.uiPrimaryNodeAura = null;
    this.uiPrimaryNodeTopBar = null;

    // Double-click tracking
    this.lastClickTime = 0;
    this.lastClickedNodeId = null;
    this.doubleClickThresholdMs = 250;

    // RMB hold tracking
    this._rmbDownTime = 0;
    this._rmbLongHoldTriggered = false;

    this.enabled = true;
    this._setupEventListeners();
  }

  /**
   * Setup event listeners - SINGLE HANDLERS, NO DOUBLE-BINDING
   */
  _setupEventListeners() {
    // RMB mousedown - record timestamp
    this._onMouseDownCapture = (e) => {
      if (!this.enabled) return;
      if (e.button === 2) {
        this._rmbDownTime = performance.now();
        this._rmbLongHoldTriggered = false;
      }
    };
    this._onMouseUpCapture = (e) => {
      if (!this.enabled) return;
      if (e.button === 2) {
        const now = performance.now();
        const duration = now - (this._rmbDownTime || now);
        
        // ================================================================
        // SHORT RMB CLICK (< 220ms) - UNLINK FIRST (before deselection)
        // ================================================================
        if (duration < 220) {
          console.log('[RMB-UP] Short click detected (' + duration.toFixed(0) + 'ms)');
          this.unlinkSelectedNode();  // Execute immediately while selection is active
        }
        // ================================================================
        // LONG RMB HOLD (>= 300ms) - trigger Ghost Mode
        // ================================================================
        else if (duration >= 300) {
          this._rmbLongHoldTriggered = true;
          console.log('[RMB-UP] Long hold detected (' + duration.toFixed(0) + 'ms)');
        }
        // else: 220-300ms range - do nothing, let it be ignored
        
        this._rmbDownTime = 0;
      }
    };
    document.addEventListener('mousedown', this._onMouseDownCapture, true);
    document.addEventListener('mouseup', this._onMouseUpCapture, true);

    // Mouse move - update raycaster
    this._onMouseMoveHandler = (e) => this._onMouseMove(e);
    document.addEventListener('mousemove', this._onMouseMoveHandler);

    // Left click - selection + linking + double-click primary
    this._onLeftClickHandler = (e) => this._onLeftClick(e);
    document.addEventListener('click', this._onLeftClickHandler);

    // Right click - unlinking (používame contextmenu event)
    this._onRightClickHandler = (e) => {
      e.preventDefault();
      this._onRightClick(e);
    };
    document.addEventListener('contextmenu', this._onRightClickHandler);

    // ESC key - close all and deselect (keep primary)
    this._onEscapeHandler = (e) => {
      if (e.key === 'Escape') {
        this._onEscapeKey();
      }
    };
    document.addEventListener('keydown', this._onEscapeHandler);

    // E key - open context menu
    this._onEKeyHandler = (e) => {
      if (e.key === 'e' || e.key === 'E') {
        if (this.selectionCore?.hasSelection() && this.uiContextMenu) {
          const selectedNode = this.selectionCore.getSelected();
          const screenPos = this._getScreenPosition(selectedNode);
          this.uiContextMenu.open(selectedNode, screenPos);
        }
      }
    };
    document.addEventListener('keydown', this._onEKeyHandler);
  }

  /**
   * On mouse move - update raycaster position
   */
  _onMouseMove(e) {
    if (!this.enabled) return;

    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  /**
   * LMB - SELECT or LINK + SELECT or DOUBLE-CLICK PRIMARY
   */
  _onLeftClick(e) {
    if (!this.enabled || e.button !== 0) return;

    // Ignore clicks on UI
    if (this._isClickOnUI(e.target)) return;

    const node = this._getRaycastNode();

    if (node) {
      // ------- DOUBLE-CLICK DETEKCIA (lokálna, bez selectionCore) -------
      const now = performance.now();
      const clickedId = node.uuid;
      const isDoubleClick =
        this.lastClickedNodeId === clickedId &&
        now - this.lastClickTime <= this.doubleClickThresholdMs;

      this.lastClickTime = now;
      this.lastClickedNodeId = clickedId;

      if (isDoubleClick) {
        // DOUBLE-CLICK → Set as primary + select
        this._setPrimaryNode(node);
        this._selectNode(node);
        return;
      }

      // ------- SINGLE CLICK LOGIKA -------
      const selectedNode = this.selectionCore?.getSelected();
      const primaryNode = this.selectionCore?.getPrimaryNode
        ? this.selectionCore.getPrimaryNode()
        : null;

      if (!selectedNode) {
        // No current selection → select this node
        this._selectNode(node);
      } else if (selectedNode === node) {
        // LMB na už vybraný node → nič
        return;
      } else if (primaryNode && primaryNode !== node) {
        // Primary existuje a kliknem na iný node → link + select
        this._attemptLink(primaryNode, node);
        this._selectNode(node);
      } else {
        // Bez primary alebo primary == node → iba select
        this._selectNode(node);
      }
    } else {
      // LMB na prázdno → deselect + zavrieť UI (primary ostáva)
      this._deselectNode();
      this._closeAllUI();
    }
  }

  /**
   * RMB - LONG GHOST MODE (>=300ms)
   * Note: Short RMB unlink is handled in mouseup capture
   */
  _onRightClick(e) {
    if (!this.enabled) return;

    const selectedNode = this.selectionCore?.getSelected();

    // ===============================================
    // LONG RMB HOLD (>= 300ms) - Ghost Mode
    // ===============================================
    if (this._rmbLongHoldTriggered && selectedNode) {
      console.log('[RMB-GHOST] Activating ghost mode');
      this.handleGhostMode(selectedNode);
      this._rmbLongHoldTriggered = false;
      return;
    }
  }

  /**
   * ESC - CLOSE ALL UI + DESELECT (KEEP PRIMARY)
   */
  _onEscapeKey() {
    this._closeAllUI();
    this._deselectNode();
    // Primary ostáva aktívny
  }

  /**
   * RMB LONG HOLD - Ghost Mode (Link Muting + Visual Dim for 3s)
   * Called when user holds RMB for >300ms on a selected node
   * 
   * Only affects:
   * - Link packet flow (muted with __ghostMuted flag)
   * - Link visual opacity (dimmed to 0.15)
   * - Node visual opacity (dimmed to 0.35)
   * 
   * Does NOT affect:
   * - AI processing (node remains active)
   * - Node selection or linking
   * - Any other game logic
   */
  handleGhostMode(node) {
    if (!node) return;
    
    // ✅ ABSOLUTE LOCK: Check linkTarget exists — if not, SILENT ABORT
    if (!hasValidLinkTarget(node)) {
      return;
    }

    const nodeId = node.id || node.uuid || 'unknown';
    console.log('[GHOST] Muting link flow for node:', nodeId);

    // ========================================
    // 1. COLLECT ALL LINKS CONNECTED TO NODE
    // ========================================
    const ghostMutedLinks = [];
    const linkSystem = this.linkSystem;

    // Try to find links using linkSystem.findLinks() if available
    if (linkSystem && typeof linkSystem.findLinks === 'function') {
      try {
        const foundLinks = linkSystem.findLinks(node);
        if (Array.isArray(foundLinks)) {
          ghostMutedLinks.push(...foundLinks);
        }
      } catch (err) {
        console.warn('[GHOST] Error finding links via linkSystem:', err);
      }
    }

    // ✅ NO SCENE TRAVERSAL — Traversal disabled per link-state contract
    // LinkingSystem manages link lookup, not link-state code

    // ========================================
    // 2. MUTE ALL LINKS - PACKET FLOW (CONTRACT-BASED)
    // ========================================
    for (const link of ghostMutedLinks) {
      if (!link) continue;

      // Mark link as muted (blocks packet flow)
      link.__ghostMuted = true;
      link.skipUpdate = true;

      // Dim link visual via contract (linkTarget only)
      // Old traversal-based approach REMOVED ✓
      // const linkId = link.id || link.uuid || 'unknown';
      // console.log('[GHOST] Muted link:', linkId);
    }

    // ========================================
    // 3. DIM NODE VISUAL (CONTRACT-BASED)
    // ========================================
    // ✅ linkTarget is the ONLY object link-state can mutate
    const linkTarget = getLinkTarget(node);
    
    if (linkTarget && linkTarget.material) {
      linkTarget.__originalOpacity = linkTarget.material.opacity;
      linkTarget.material.transparent = true;
      linkTarget.material.opacity = 0.35;
    }
    
 
    console.log('[GHOST] Node dimmed via linkTarget:', nodeId);

    // ========================================
    // 4. MARK NODE AS GHOSTED
    // ========================================
    node.__ghostDisabled = true;
    const ghostStartTime = performance.now();

    console.log('[GHOST] Node dimmed (35% opacity), links muted:', nodeId);

    // ========================================
    // 5. AUTO-RESTORE AFTER 3 SECONDS
    // ========================================
    const restoreTimeout = setTimeout(() => {
      const now = performance.now();
      const elapsed = now - ghostStartTime;

      // Restore node visual via linkTarget (CRITICAL: not via undefined nodeMaterial)
      if (linkTarget && linkTarget.material) {
        linkTarget.material.opacity = linkTarget.__originalOpacity || 1.0;
        delete linkTarget.__originalOpacity;
      }

      // Restore all links
      for (const link of ghostMutedLinks) {
        if (!link) continue;

        // Restore link visual
        if (link.material) {
          link.material.opacity = link.__originalOpacity || 1.0;
          delete link.__originalOpacity;
        }

        // Re-enable packet flow
        delete link.__ghostMuted;
        delete link.skipUpdate;
      }

      // Clear ghost flag
      node.__ghostDisabled = false;

      console.log(`[GHOST] Restored node ${nodeId} (ghosted for ${Math.round(elapsed)}ms)`);
    }, 3000);

    // Store timeout ref for cleanup if needed
    node.__ghostModeTimeout = restoreTimeout;
  }

  /**
   * SHORT RMB - Unlink all links from selected node, then deselect
   * Called from mouseup capture when short RMB click detected (< 220ms)
   */
  unlinkSelectedNode() {
    const node = this.selectionCore?.getSelected();
    if (!node) {
      console.log('[RMB-UNLINK] No node selected');
      return;
    }

    const nodeId = node.id || node.uuid || 'unknown';
    const nodeName = node.userData?.namingCode || nodeId;

    // Unlink using linkSystem.findLinks + removeLink if available
    if (this.linkSystem && typeof this.linkSystem.findLinks === 'function') {
      try {
        const links = this.linkSystem.findLinks(node) || [];
        let removedCount = 0;

        for (const link of links) {
          if (this.linkSystem.removeLink && typeof this.linkSystem.removeLink === 'function') {
            try {
              this.linkSystem.removeLink(link);
              removedCount++;
            } catch (err) {
              console.warn('[RMB-UNLINK] Failed to remove link:', err);
            }
          }
        }

        console.log('[RMB-UNLINK] Removed ' + removedCount + ' links from node ' + nodeName);
        
        // Refresh HUD display to show updated linked categories
        if (window.game && window.game.selectedHUD) {
          window.game.selectedHUD.refreshDisplay();
        }
      } catch (err) {
        console.warn('[RMB-UNLINK] linkSystem.findLinks() failed:', err);
        // Fallback to SafeNodeUnlinking3_3
        this._unlinkAllViaSystem(node);
      }
    } else {
      // Fallback: use existing SafeNodeUnlinking3_3 method
      this._unlinkAllViaSystem(node);
    }

    // Deselect the node after unlinking
    this._deselectNode();
    console.log('[RMB-UNLINK] Deselected node ' + nodeName);
    
    // Refresh visual rendering of all links
    this._refreshLinkVisuals();
  }

  /**
   * Comprehensive visual refresh after link removal
   * Handles:
   * - LinkGlyphFlow visual updates
   * - LinkedGlyphSynchronization state refresh
   * - LegacyDebugConeCleanup mesh cleanup
   * - All extra link visual layers
   * 
   * Cascading fallbacks ensure removed links disappear immediately
   */
  _refreshLinkVisuals() {
    if (!this.linkSystem) {
      console.log('[RMB-UNLINK-REFRESH] No linkSystem available');
      return;
    }

    const startTime = performance.now();
    let refreshMethod = 'none';

    // ================================================================
    // METHOD A: linkSystem.update() - Full refresh cycle
    // ================================================================
    if (typeof this.linkSystem.update === 'function') {
      try {
        this.linkSystem.update(0, performance.now());
        refreshMethod = 'update()';
        console.log('[RMB-UNLINK-REFRESH] update() used (' + (performance.now() - startTime).toFixed(1) + 'ms)');
        return;
      } catch (err) {
        console.warn('[RMB-UNLINK-REFRESH] update() failed, trying geometry fallback:', err.message);
      }
    }

    // ================================================================
    // METHOD B: Manual updateGeometry on each link
    // ================================================================
    if (this.linkSystem.links && Array.isArray(this.linkSystem.links)) {
      try {
        let geometryUpdateCount = 0;

        for (const link of this.linkSystem.links) {
          // Try updateGeometry method
          if (link.updateGeometry && typeof link.updateGeometry === 'function') {
            try {
              link.updateGeometry();
              geometryUpdateCount++;
            } catch (e) {
              // silently skip individual link failures
            }
          }
        }

        if (geometryUpdateCount > 0) {
          refreshMethod = 'geometry fallback';
          console.log('[RMB-UNLINK-REFRESH] geometry fallback (' + geometryUpdateCount + ' links, ' + (performance.now() - startTime).toFixed(1) + 'ms)');
          return;
        }
      } catch (err) {
        console.warn('[RMB-UNLINK-REFRESH] geometry fallback failed:', err.message);
      }
    }

    // ================================================================
    // METHOD C: Manual updateVisual on each link
    // ================================================================
    if (this.linkSystem.links && Array.isArray(this.linkSystem.links)) {
      try {
        let visualUpdateCount = 0;

        for (const link of this.linkSystem.links) {
          // Try updateVisual method
          if (link.updateVisual && typeof link.updateVisual === 'function') {
            try {
              link.updateVisual();
              visualUpdateCount++;
            } catch (e) {
              // silently skip individual link failures
            }
          }
        }

        if (visualUpdateCount > 0) {
          refreshMethod = 'visual fallback';
          console.log('[RMB-UNLINK-REFRESH] visual fallback (' + visualUpdateCount + ' links, ' + (performance.now() - startTime).toFixed(1) + 'ms)');
          return;
        }
      } catch (err) {
        console.warn('[RMB-UNLINK-REFRESH] visual fallback failed:', err.message);
      }
    }

    // ================================================================
    // METHOD D: Full scene traversal - hide dead link meshes
    // Final comprehensive fallback for all custom Rosebud systems
    // ================================================================
    if (this.renderer && this.scene) {
      try {
        let hiddenMeshes = 0;
        let updatedMaterials = 0;

        // ✓ REMOVED BLANKET TRAVERSAL ✓
        // Old scene.traverse() pattern COMPLETELY REMOVED
        // Links should manage their own visibility through link system
        // Nodes should use linkTarget contract only
        
        // This method now only handles explicit link markers, not visual mutations
        // Visual mutations only occur via LinkTargetContract
        
        // If link visuals need to be hidden, it should be done by:
        // 1. LinkingSystem.removeLink() → handles link visual cleanup
        // 2. NOT by traversing entire scene and mutating random meshes

        refreshMethod = 'scene traversal fallback';
        console.log('[RMB-UNLINK-REFRESH] scene traversal fallback (hidden: ' + hiddenMeshes + ', materials updated: ' + updatedMaterials + ', ' + (performance.now() - startTime).toFixed(1) + 'ms)');
      } catch (err) {
        console.warn('[RMB-UNLINK-REFRESH] scene traversal failed:', err.message);
      }
    }

    // If we reach here, log that all methods were attempted
    if (refreshMethod === 'none') {
      console.warn('[RMB-UNLINK-REFRESH] All refresh methods exhausted, no visual update performed');
    }
  }

  /**
   * Get raycast node at current mouse position
   */
  _getRaycastNode() {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const nodes = [];
    this.scene.traverse((obj) => {
      if (obj.userData && obj.userData.isNode) {
        nodes.push(obj);
      }
    });

    const intersects = this.raycaster.intersectObjects(nodes);
    const filtered = filterRaycastIntersections(intersects);
    return filtered.length > 0 ? filtered[0].object : null;
  }

  /**
   * Check if node has any links
   */
  _nodeHasLinks(node) {
    if (!node) return false;

    if (node.links && Array.isArray(node.links) && node.links.length > 0) {
      return true;
    }

    for (const otherNode of this.allNodes) {
      if (
        otherNode !== node &&
        otherNode.links &&
        Array.isArray(otherNode.links) &&
        otherNode.links.includes(node)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Set primary node + show aura
   */
  _setPrimaryNode(node) {
    if (!node || !this.selectionCore || !this.selectionCore.setPrimaryNode) return;

    this.selectionCore.setPrimaryNode(node);

    const primaryNode = this.selectionCore.getPrimaryNode
      ? this.selectionCore.getPrimaryNode()
      : null;

    if (primaryNode) {
      if (this.uiPrimaryNodeAura) {
        this.uiPrimaryNodeAura.showAura(primaryNode);
      }
      if (this.uiPrimaryNodeTopBar) {
        this.uiPrimaryNodeTopBar.show(primaryNode);
      }
    } else {
      if (this.uiPrimaryNodeAura) {
        this.uiPrimaryNodeAura.hideAura();
      }
      if (this.uiPrimaryNodeTopBar) {
        this.uiPrimaryNodeTopBar.hide();
      }
    }
  }

  /**
   * Unlink all links from/to node (keep selected + primary)
   */
  _unlinkAll(node) {
    if (!node || !this.allNodes) return;

    try {
      SafeNodeUnlinking3_3.unlinkAllConnections(node, this.allNodes);
      console.log(
        `✓ Unlinked all connections for ${node.userData?.namingCode || 'node'}`
      );
    } catch (err) {
      console.warn('Unlinking failed:', err);
    }
  }

  /**
   * SHORT RMB UNLINK - Delete all links via linkSystem
   * Called on short RMB click (< 250ms)
   * Uses linkSystem.deleteAllLinks() if available
   */
  _unlinkAllViaSystem(node) {
    if (!node) return;

    const nodeId = node.id || node.uuid || 'unknown';
    const nodeName = node.userData?.namingCode || node.id || 'unknown';

    // Try linkSystem.deleteAllLinks() first
    if (this.linkSystem && typeof this.linkSystem.deleteAllLinks === 'function') {
      try {
        this.linkSystem.deleteAllLinks(node);
        console.log('[RMB-UNLINK] Unlinked node:', nodeName);
        return;
      } catch (err) {
        console.warn('[RMB-UNLINK] linkSystem.deleteAllLinks() failed:', err);
      }
    }

    // Fallback: use SafeNodeUnlinking3_3
    if (this.allNodes) {
      try {
        SafeNodeUnlinking3_3.unlinkAllConnections(node, this.allNodes);
        console.log('[RMB-UNLINK] Unlinked node (fallback):', nodeName);
        return;
      } catch (err) {
        console.warn('[RMB-UNLINK] Fallback unlinking failed:', err);
      }
    }

    console.warn('[RMB-UNLINK] No unlinking method available for node:', nodeName);
  }

  /**
   * Blink highlight (visual feedback when no links)
   */
  _blinkHighlight(node) {
    if (!node || !this.uiSelectedNodeHighlight) return;

    if (this.uiSelectedNodeHighlight.highlightMeshes.has(node)) {
      const meshData = this.uiSelectedNodeHighlight.highlightMeshes.get(node);

      if (meshData.ring?.material && meshData.glow?.material) {
        const originalRingOpacity = meshData.ring.material.opacity;
        const originalGlowOpacity = meshData.glow.material.opacity;

        meshData.ring.material.opacity = 0.2;
        meshData.glow.material.opacity = 0.1;

        setTimeout(() => {
          if (meshData.ring?.material && meshData.glow?.material) {
            meshData.ring.material.opacity = originalRingOpacity;
            meshData.glow.material.opacity = originalGlowOpacity;
          }
        }, 150);
      }
    }
  }

  /**
   * Long RMB Hold - Node Disable (Ghost Mode)
   * Triggered when holding RMB for >300ms on a node
   */
  _onLongRightHold(node) {
    if (!node || !node.material) return;

    // Already ghosted? stop
    if (node.userData._ghostActive) return;

    node.userData._ghostActive = true;

    const originalOpacity = node.material.opacity ?? 1;
    const originalTransparent = node.material.transparent;

    // Ghost mode (disable)
    node.material.transparent = true;
    node.material.opacity = 0.3;
    node.userData._disableLinks = true;

    // Restore after 3s
    setTimeout(() => {
      if (node.material) {
        node.material.opacity = originalOpacity;
        node.material.transparent = originalTransparent;
      }
      node.userData._ghostActive = false;
      node.userData._disableLinks = false;
    }, 3000);

    console.log('⛔ Node disabled (ghost mode):', node.userData?.namingCode || node.uuid);
  }

  /**
   * Short RMB Hold - Optional placeholder
   * Triggered when holding RMB for <=300ms on a node
   */
  _onShortRightClick(node) {
    // optional short RMB behavior, leave empty
    // short RMB is handled by contextmenu event listener instead
  }

  /**
   * Select node - update Core + show visuals
   */
  _selectNode(node) {
    if (!node || !node.userData || !node.userData.isNode) return;

    this.selectionCore?.selectNode?.(node);

    if (this.uiTopBar) {
      this.uiTopBar.show(node);
    }

    if (this.uiSelectedNodeBadge) {
      this.uiSelectedNodeBadge.show(node);
    }

    if (this.uiSelectedNodeHighlight) {
      this.uiSelectedNodeHighlight.applyHighlight(node);
    }

    if (this.uiSelectedNodeLabel) {
      this.uiSelectedNodeLabel.applyLabel(node);
    }

    if (this.uiNodeInspectPanel) {
      this.uiNodeInspectPanel.show(node);
    }
  }

  /**
   * Deselect node - update Core + hide visuals
   */
  _deselectNode() {
    const selectedNode = this.selectionCore?.getSelected
      ? this.selectionCore.getSelected()
      : null;
    if (!selectedNode) {
      return;
    }

    this.selectionCore?.deselectNode?.();

    if (this.uiTopBar) {
      this.uiTopBar.hide();
    }

    if (this.uiSelectedNodeBadge) {
      this.uiSelectedNodeBadge.hide();
    }

    if (this.uiSelectedNodeHighlight) {
      this.uiSelectedNodeHighlight.removeHighlight(selectedNode);
    }

    if (this.uiSelectedNodeLabel) {
      this.uiSelectedNodeLabel.removeLabel(selectedNode);
    }

    if (this.uiNodeInspectPanel) {
      this.uiNodeInspectPanel.hide();
    }
  }

  /**
   * Attempt to link two nodes
   */
  _attemptLink(fromNode, toNode) {
    if (this.linkingSystem && fromNode && toNode && fromNode !== toNode) {
      try {
        this.linkingSystem.createLink(fromNode, toNode);
      } catch (err) {
        console.warn('Link creation failed:', err);
      }
    }
  }

  /**
   * Close all UI panels
   */
  _closeAllUI() {
    if (this.uiContextMenu) {
      if (typeof this.uiContextMenu.hide === 'function') {
        this.uiContextMenu.hide();
      } else if (typeof this.uiContextMenu.close === 'function') {
        this.uiContextMenu.close();
      }
    }
  }

  /**
   * Check if click is on UI element
   */
  _isClickOnUI(target) {
    const uiIds = [
      'ui-world-status-bar',
      'ui-node-inspect-panel',
      'ui-hud-manager',
      'ui-context-menu',
      'ui-category-legend',
      'ai-emotional-feed',
      'ui-node-hover-tooltip',
      'ui-selected-node-badge-3-3',
      'ui-selected-node-top-bar-3-4',
      'ui-primary-node-top-bar-3-7'
    ];

    for (const id of uiIds) {
      if (target.closest && target.closest(`#${id}`)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get screen position for node
   */
  _getScreenPosition(node) {
    if (!node) return { x: 0, y: 0 };

    const vector = node.position.clone();
    vector.project(this.camera);

    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(vector.y * 0.5 - 0.5)) * window.innerHeight;

    return { x, y };
  }

  /**
   * Update (minimal - called from main loop)
   */
  update(deltaTime) {
    if (!this.enabled) return;
    // Všetka logika je v event handleroch
  }

  /**
   * Set UI references
   */
  setUIReferences(
    topBar = null,
    inspectPanel = null,
    contextMenu = null,
    badge = null,
    highlight = null,
    label = null,
    primaryAura = null,
    primaryTopBar = null
  ) {
    this.uiTopBar = topBar;
    this.uiNodeInspectPanel = inspectPanel;
    this.uiContextMenu = contextMenu;
    this.uiSelectedNodeBadge = badge;
    this.uiSelectedNodeHighlight = highlight;
    this.uiSelectedNodeLabel = label;
    this.uiPrimaryNodeAura = primaryAura;
    this.uiPrimaryNodeTopBar = primaryTopBar;
  }

  /**
   * Set all nodes reference (for unlinking checks)
   */
  setAllNodes(allNodes) {
    this.allNodes = allNodes || [];
  }

  /**
   * Set selection core reference
   */
  setSelectionCore(selectionCore) {
    this.selectionCore = selectionCore;
  }

  /**
   * Enable/disable
   */
  setEnabled(value) {
    this.enabled = value;
  }

  /**
   * Dispose - clean up all event listeners
   */
  dispose() {
    this.enabled = false;

    if (this._onMouseDownCapture) {
      document.removeEventListener('mousedown', this._onMouseDownCapture, true);
    }
    if (this._onMouseUpCapture) {
      document.removeEventListener('mouseup', this._onMouseUpCapture, true);
    }
    if (this._onMouseMoveHandler) {
      document.removeEventListener('mousemove', this._onMouseMoveHandler);
    }
    if (this._onLeftClickHandler) {
      document.removeEventListener('click', this._onLeftClickHandler);
    }
    if (this._onRightClickHandler) {
      document.removeEventListener('contextmenu', this._onRightClickHandler);
    }
    if (this._onEscapeHandler) {
      document.removeEventListener('keydown', this._onEscapeHandler);
    }
    if (this._onEKeyHandler) {
      document.removeEventListener('keydown', this._onEKeyHandler);
    }

    this.selectionCore = null;
  }
}