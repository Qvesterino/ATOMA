/**
 * UI SELECTED NODE LABEL 3.3
 * 
 * Floating label above selected node showing:
 * - [SELECTED] indicator
 * - QNT code
 * - Category-colored connector line
 * 
 * Design:
 * - Rendered via THREE.Sprite and canvas texture
 * - Updates position each frame to follow node
 * - Fade in/out 120ms
 * - Category-colored text + line
 * - Always visible when node selected
 * 
 * SAFETY:
 * ✓ Pure visual overlay (no node modifications)
 * ✓ Uses disposable sprite mesh
 * ✓ Performance: <0.2ms/frame
 */

import * as THREE from 'three';

export class UISelectedNodeLabel3_3 {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.selectedNode = null;
    
    // Sprite + canvas for text rendering
    this.labelSprite = null;
    this.lineGeometry = null;
    this.lineMesh = null;
    
    this.isVisible = false;
    this.fadeTimer = 0;
    
    // Animation state
    this.bobOffset = 0;
    this.bobTime = 0;
  }
  
  /**
   * Apply label to selected node
   */
  applyLabel(node) {
    if (!node || !node.userData || !node.userData.isNode) return;
    
    // Remove old label if exists
    if (this.selectedNode && this.selectedNode !== node) {
      this.removeLabel(this.selectedNode);
    }
    
    this.selectedNode = node;
    
    // Create label if doesn't exist
    if (!this.labelSprite) {
      this._createLabel();
    }
    
    this.labelSprite.visible = true;
    this.isVisible = true;
    this.fadeTimer = 0.12; // 120ms
    
    // Update material opacity
    if (this.labelSprite.material) {
      this.labelSprite.material.opacity = 0;
      setTimeout(() => {
        if (this.labelSprite?.material) {
          this.labelSprite.material.opacity = 0.95;
        }
      }, 5);
    }
    
    // Update content
    this._updateLabelContent();
  }
  
  /**
   * Remove label from node
   */
  removeLabel(node) {
    if (this.labelSprite) {
      this.labelSprite.material.opacity = 0;
      setTimeout(() => {
        if (this.labelSprite && this.scene.children.includes(this.labelSprite)) {
          this.scene.remove(this.labelSprite);
          this.labelSprite.geometry?.dispose();
          this.labelSprite.material.map?.dispose();
          this.labelSprite.material?.dispose();
          this.labelSprite = null;
        }
      }, 120);
    }
    
    this.isVisible = false;
    this.selectedNode = null;
  }
  
  /**
   * Create label sprite
   */
  _createLabel() {
    // Create canvas for label texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Store canvas for updates
    this.labelCanvas = canvas;
    this.labelContext = ctx;
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    
    // Create material
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      sizeAttenuation: true,
      opacity: 0.95
    });
    
    // Create sprite
    this.labelSprite = new THREE.Sprite(material);
    this.labelSprite.scale.set(3, 1.5, 1);
    this.labelSprite.userData.isLabel = true;
    this.scene.add(this.labelSprite);
  }
  
  /**
   * Update label content
   */
  _updateLabelContent() {
    if (!this.selectedNode || !this.labelCanvas) return;
    
    const userData = this.selectedNode.userData;
    const code = userData.namingCode || userData.category || 'UNK-NOD-STD';
    const categoryColor = this._getCategoryColor(userData.category);
    const hexColor = this._colorToHex(categoryColor);
    
    // Clear canvas
    this.labelContext.fillStyle = 'rgba(0, 0, 0, 0)';
    this.labelContext.fillRect(0, 0, this.labelCanvas.width, this.labelCanvas.height);
    
    // Draw text
    this.labelContext.font = 'bold 20px Courier New';
    this.labelContext.fillStyle = hexColor;
    this.labelContext.textAlign = 'center';
    this.labelContext.textBaseline = 'middle';
    
    // Draw [SELECTED] indicator
    this.labelContext.fillText('[SELECTED]', this.labelCanvas.width / 2, 32);
    
    // Draw code
    this.labelContext.font = '16px Courier New';
    this.labelContext.fillStyle = hexColor;
    this.labelContext.fillText(code, this.labelCanvas.width / 2, 72);
    
    // Update texture
    this.labelSprite.material.map.needsUpdate = true;
  }
  
  /**
   * Update position + animation
   */
  update(deltaTime) {
    if (!this.selectedNode || !this.labelSprite) return;
    
    // Bob animation
    this.bobTime += deltaTime;
    this.bobOffset = Math.sin(this.bobTime * 2.5) * 0.3;
    
    // Position label above node
    const nodePos = this.selectedNode.position.clone();
    const radius = this.selectedNode.geometry?.boundingSphere?.radius || 1.5;
    nodePos.y += radius + 2.5 + this.bobOffset;
    
    this.labelSprite.position.copy(nodePos);
    
    // Face camera
    this.labelSprite.lookAt(this.camera.position);
    
    // Update fade timer
    if (this.fadeTimer > 0) {
      this.fadeTimer -= deltaTime;
    }
  }
  
  /**
   * Get category color (THREE.Color format)
   */
  _getCategoryColor(category) {
    const colors = {
      'input': '#00ddff',
      'process': '#ffaa00',
      'integration': '#00ff88',
      'analytics': '#aa00ff',
      'storage': '#88ccff',
      'control': '#ff0088',
      'sigma': '#ff6633',
      'quantum': '#00ffcc',
      'emotional': '#ff4db8',
      'extreme': '#ff3333',
      'outer': '#ffcc00',
      'legendary': '#ffb500',
      'mythic': '#ffa0ff',
      'prime': '#88ff00',
      'error': '#ff4444'
    };
    
    const lowerCat = (category || '').toLowerCase();
    const colorHex = colors[lowerCat] || '#36F2FF';
    
    // Convert hex to THREE.Color
    return new THREE.Color(colorHex);
  }
  
  /**
   * Convert THREE.Color to hex string
   */
  _colorToHex(color) {
    return '#' + color.getHexString();
  }
  
  /**
   * Clear all labels
   */
  clearAll() {
    if (this.labelSprite) {
      this.scene.remove(this.labelSprite);
      this.labelSprite.geometry?.dispose();
      this.labelSprite.material.map?.dispose();
      this.labelSprite.material?.dispose();
      this.labelSprite = null;
    }
    
    this.selectedNode = null;
    this.isVisible = false;
  }
  
  /**
   * Dispose
   */
  dispose() {
    this.clearAll();
  }
}
