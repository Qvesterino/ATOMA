/**
 * LINK DEBUG MODE v1.0
 * ====================
 * 
 * Temporary debug visualization for link eligibility debugging
 * Purpose: See EXACTLY why links work or don't work
 * 
 * Features:
 * - Render links as thin WHITE lines only (no effects)
 * - Overlay text at link midpoint:
 *   - "LINK OK" (green) if link is valid
 *   - "BLOCKED: reason" (red) if link was rejected
 * - Disable ALL visual effects on links
 * - Pure geometry + text, nothing else
 */

import * as THREE from 'three';

export class LinkDebugMode_v1 {
  constructor(options = {}) {
    this.enabled = options.enabled ?? false;
    this.scene = options.scene || null;
    this.linkingSystem = options.linkingSystem || null;
    this.eligibilityGate = options.eligibilityGate || null;

    this.debugLines = new Map();    // uuid → THREE.Line
    this.debugLabels = new Map();   // uuid → THREE.Sprite with label
    this.canvas = null;             // Shared canvas for text rendering
    this.material = null;           // Shared line material

    if (this.enabled) {
      this._initDebugMode();
    }

    console.log('[LinkDebugMode]', this.enabled ? 'ENABLED' : 'DISABLED');
  }

  /**
   * Initialize debug mode resources
   */
  _initDebugMode() {
    // Create simple white line material (no effects)
    this.material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2,
      fog: false,
      transparent: false,
      depthTest: true,
      depthWrite: true
    });

    // Pre-create canvas for text rendering
    this.canvas = document.createElement('canvas');
    this.canvas.width = 256;
    this.canvas.height = 64;
  }

  /**
   * Enable debug mode
   */
  enable() {
    this.enabled = true;
    this._initDebugMode();
    console.log('[LinkDebugMode] ENABLED');
  }

  /**
   * Disable debug mode
   */
  disable() {
    this.enabled = false;
    this.clearAllDebugVisuals();
    console.log('[LinkDebugMode] DISABLED');
  }

  /**
   * Update debug visuals for all links
   */
  updateDebugVisuals() {
    if (!this.enabled || !this.linkingSystem || !this.linkingSystem.links) return;

    for (const link of this.linkingSystem.links) {
      if (link.active) {
        this.renderDebugLink(link);
      } else {
        this.removeDebugLink(link.uuid);
      }
    }
  }

  /**
   * Render debug visualization for a single link
   */
  renderDebugLink(link) {
    if (!link.nodeA || !link.nodeB) return;

    const uuid = link.uuid;
    const posA = link.nodeA.position;
    const posB = link.nodeB.position;

    // ========================================================================
    // PART 1: Draw simple white line
    // ========================================================================
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([
        posA.x, posA.y, posA.z,
        posB.x, posB.y, posB.z
      ]),
      3
    ));

    // Remove old line if exists
    if (this.debugLines.has(uuid)) {
      const oldLine = this.debugLines.get(uuid);
      this.scene.remove(oldLine);
    }

    const line = new THREE.Line(geometry, this.material);
    line.userData.debugLine = true;
    this.scene.add(line);
    this.debugLines.set(uuid, line);

    // ========================================================================
    // PART 2: Add text label at midpoint
    // ========================================================================
    const midpoint = new THREE.Vector3(
      (posA.x + posB.x) / 2,
      (posA.y + posB.y) / 2,
      (posA.z + posB.z) / 2
    );

    // Remove old label if exists
    if (this.debugLabels.has(uuid)) {
      const oldLabel = this.debugLabels.get(uuid);
      this.scene.remove(oldLabel);
    }

    // Determine label text and color
    let labelText = 'LINK OK';
    let labelColor = '#00ff00'; // Green
    let bgColor = 'rgba(0, 0, 0, 0.8)';

    // Check if link was eligible
    if (this.eligibilityGate && link.nodeA && link.nodeB) {
      const eligibility = this.eligibilityGate.canLink(link.nodeA, link.nodeB);
      if (!eligibility.allowed) {
        labelText = `BLOCKED: ${eligibility.reason}`;
        labelColor = '#ff0000'; // Red
      }
    }

    // Create text texture
    const texture = this._createTextTexture(labelText, labelColor, bgColor);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.copy(midpoint);
    sprite.scale.set(2, 0.5, 1);
    sprite.userData.debugLabel = true;
    
    this.scene.add(sprite);
    this.debugLabels.set(uuid, sprite);
  }

  /**
   * Create canvas texture with text
   */
  _createTextTexture(text, color, bgColor) {
    const ctx = this.canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw text
    ctx.fillStyle = color;
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

    // Create texture
    const texture = new THREE.CanvasTexture(this.canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  /**
   * Remove debug visuals for a single link
   */
  removeDebugLink(uuid) {
    if (this.debugLines.has(uuid)) {
      const line = this.debugLines.get(uuid);
      this.scene.remove(line);
      this.debugLines.delete(uuid);
    }

    if (this.debugLabels.has(uuid)) {
      const label = this.debugLabels.get(uuid);
      this.scene.remove(label);
      this.debugLabels.delete(uuid);
    }
  }

  /**
   * Clear all debug visuals
   */
  clearAllDebugVisuals() {
    // Remove all debug lines
    for (const [uuid, line] of this.debugLines) {
      this.scene.remove(line);
    }
    this.debugLines.clear();

    // Remove all debug labels
    for (const [uuid, label] of this.debugLabels) {
      this.scene.remove(label);
    }
    this.debugLabels.clear();
  }

  /**
   * Get debug status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      activeDebugLines: this.debugLines.size,
      activeDebugLabels: this.debugLabels.size
    };
  }
}

/**
 * Quick setup function
 */
export function setupLinkDebugMode(options = {}) {
  const debugMode = new LinkDebugMode_v1(options);
  window.__linkDebugMode__ = debugMode;

  console.log('[LinkDebugMode] Ready — Access via window.__linkDebugMode__');
  console.log('  Methods: enable(), disable(), updateDebugVisuals(), getStatus()');

  return debugMode;
}

export default LinkDebugMode_v1;
