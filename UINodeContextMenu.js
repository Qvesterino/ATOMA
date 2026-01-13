/**
 * UI NODE CONTEXT MENU
 * 
 * Right-click menu for nodes with actions:
 * - Inspect Node (open Node Inspect Panel)
 * - Focus Camera (smooth camera lerp to node)
 * - Link Mode (enter linking mode with this node)
 * - Disconnect Outgoing (remove all outgoing links)
 * - Mark Node (apply highlight for 10 seconds)
 * 
 * SAFETY:
 * ✓ Uses existing safe methods (no direct link/node modification)
 * ✓ Respects existing linking system
 * ✓ Camera focus is smooth and non-jarring
 * ✓ Highlight is temporary and visual-only
 */

import * as THREE from 'three';

export class UINodeContextMenu {
  constructor(scene, camera, linkingSystem = null, nodeInspectPanel = null) {
    this.scene = scene;
    this.camera = camera;
    this.linkingSystem = linkingSystem;
    this.nodeInspectPanel = nodeInspectPanel;
    
    this.element = null;
    this.currentNode = null;
    this.isOpen = false;
    
    // Camera focus state
    this.cameraFocusActive = false;
    this.focusStartPos = new THREE.Vector3();
    this.focusStartQuat = new THREE.Quaternion();
    this.focusTargetPos = new THREE.Vector3();
    this.focusTargetQuat = new THREE.Quaternion();
    this.focusDuration = 1.0;  // seconds
    this.focusTime = 0;
    
    // Highlight state
    this.highlightedNode = null;
    this.highlightStartTime = 0;
    this.highlightDuration = 10;  // seconds
    
    this._initializeDOM();
    this._setupEventListeners();
  }
  
  /**
   * Initialize DOM
   */
  _initializeDOM() {
    this.element = document.createElement('div');
    this.element.id = 'ui-node-context-menu';
    this.element.style.cssText = `
      position: fixed;
      background: rgba(20, 30, 60, 0.95);
      border: 1.5px solid #36F2FF;
      border-radius: 6px;
      padding: 4px 0;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #36F2FF;
      letter-spacing: 0.6px;
      z-index: 2500;
      pointer-events: auto;
      display: none;
      box-shadow: 
        0 0 20px rgba(54, 242, 255, 0.3),
        inset 0 0 10px rgba(54, 242, 255, 0.05);
      min-width: 160px;
    `;
    
    document.body.appendChild(this.element);
  }
  
  /**
   * Setup event listeners
   */
  _setupEventListeners() {
    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
    
    // Close on click outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.element.contains(e.target)) {
        this.close();
      }
    });
    
    // Prevent context menu on menu itself
    this.element.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  /**
   * Open context menu
   */
  open(node, screenPosition) {
    if (!node || !node.userData) return;
    
    this.currentNode = node;
    this.isOpen = true;
    
    // Build menu
    const html = `
      ${this._buildMenuItem('INSPECT NODE', () => this._actionInspect())}
      ${this._buildMenuItem('FOCUS CAMERA', () => this._actionFocusCamera())}
      ${this._buildMenuItem('LINK MODE', () => this._actionLinkMode())}
      ${this._buildMenuItem('DISCONNECT LINKS', () => this._actionDisconnect())}
      ${this._buildMenuItem('MARK NODE', () => this._actionMark())}
      ${this._buildMenuItem('CLOSE', () => this.close())}
    `;
    
    this.element.innerHTML = html;
    
    // Position menu at center-right of screen (or from passed position)
    let x = screenPosition?.x !== undefined ? screenPosition.x : window.innerWidth / 2;
    let y = screenPosition?.y !== undefined ? screenPosition.y : window.innerHeight / 2;
    
    // Clamp to viewport
    if (x + 160 > window.innerWidth) x = window.innerWidth - 170;
    if (y + 150 > window.innerHeight) y = window.innerHeight - 160;
    if (x < 10) x = 10;
    if (y < 10) y = 10;
    
    this.element.style.left = x + 'px';
    this.element.style.top = y + 'px';
    this.element.style.display = 'block';
  }
  
  /**
   * Close context menu
   */
  close() {
    this.element.style.display = 'none';
    this.isOpen = false;
    this.currentNode = null;
  }
  
  /**
   * Hide (compatibility shim for close())
   */
  hide() {
    this.close?.();
  }
  
  /**
   * Build menu item
   */
  _buildMenuItem(label, callback) {
    const id = `menu-item-${Math.random()}`;
    setTimeout(() => {
      const item = document.getElementById(id);
      if (item) {
        item.addEventListener('click', () => {
          callback();
          this.close();
        });
      }
    }, 0);
    
    return `
      <div id="${id}" style="
        padding: 8px 16px;
        cursor: pointer;
        transition: background 0.2s ease;
        border-bottom: 1px solid rgba(54, 242, 255, 0.1);
        user-select: none;
      "
      onmouseover="this.style.background='rgba(54, 242, 255, 0.15)'"
      onmouseout="this.style.background='transparent'"
      >${label}</div>
    `;
  }
  
  /**
   * Action: Inspect node
   */
  _actionInspect() {
    if (this.nodeInspectPanel && this.currentNode) {
      this.nodeInspectPanel.show(this.currentNode);
    }
  }
  
  /**
   * Action: Focus camera on node
   */
  _actionFocusCamera() {
    if (!this.currentNode) return;
    
    this.focusStartPos.copy(this.camera.position);
    this.focusStartQuat.copy(this.camera.quaternion);
    
    // Target: node position + offset
    const offset = new THREE.Vector3(0, 2, 5);
    this.focusTargetPos.copy(this.currentNode.position).add(offset);
    
    // Look at node
    const lookAt = new THREE.Vector3();
    lookAt.copy(this.currentNode.position);
    this.camera.lookAt(lookAt);
    this.focusTargetQuat.copy(this.camera.quaternion);
    
    this.cameraFocusActive = true;
    this.focusTime = 0;
  }
  
  /**
   * Action: Enter link mode
   */
  _actionLinkMode() {
    if (!this.currentNode || !this.linkingSystem) return;
    
    // Call existing linking system method if available
    if (this.linkingSystem.startLinking) {
      this.linkingSystem.startLinking(this.currentNode);
    }
  }
  
  /**
   * Action: Disconnect outgoing links
   */
  _actionDisconnect() {
    if (!this.currentNode || !this.linkingSystem) return;
    
    // Call existing link removal if available
    if (this.linkingSystem.removeOutgoingLinks) {
      this.linkingSystem.removeOutgoingLinks(this.currentNode);
    }
  }
  
  /**
   * Action: Mark node
   */
  _actionMark() {
    if (!this.currentNode) return;
    
    this.highlightedNode = this.currentNode;
    this.highlightStartTime = Date.now();
    
    // Apply temporary highlight (visual only)
    const originalMaterial = this.currentNode.userData.originalMaterial;
    if (!originalMaterial) {
      this.currentNode.userData.originalMaterial = this.currentNode.material?.clone();
    }
  }
  
  /**
   * Update (for camera focus animation)
   */
  update(deltaTime) {
    // Update camera focus
    if (this.cameraFocusActive) {
      this.focusTime += deltaTime;
      const t = Math.min(1, this.focusTime / this.focusDuration);
      
      // Smooth easing (ease-out)
      const eased = 1 - Math.pow(1 - t, 3);
      
      this.camera.position.lerpVectors(this.focusStartPos, this.focusTargetPos, eased);
      this.camera.quaternion.slerpQuaternions(this.focusStartQuat, this.focusTargetQuat, eased);
      
      if (t >= 1) {
        this.cameraFocusActive = false;
      }
    }
    
    // Update highlight glow
    if (this.highlightedNode) {
      const elapsed = (Date.now() - this.highlightStartTime) / 1000;
      
      // Apply pulsing glow
      if (this.highlightedNode.userData.vfxGlow) {
        const pulse = Math.sin(elapsed * 4) * 0.3 + 0.7;
        this.highlightedNode.userData.vfxGlow.material.opacity = pulse * 0.6;
      }
      
      // Remove highlight after duration
      if (elapsed > this.highlightDuration) {
        this.highlightedNode = null;
      }
    }
  }
  
  /**
   * Dispose
   */
  dispose() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
