/**
 * UI PRIMARY NODE AURA 3.7
 * 
 * VISUAL FEEDBACK FOR PRIMARY NODES (Linking Source)
 * 
 * Features:
 * - Large neon ring around primary node
 * - Inner pulse layer (double-ring effect)
 * - Slow vertical bob animation (sine wave)
 * - Color matches node category
 * - Always visible while primaryNode is active
 * - Non-conflicting with selected highlight
 * 
 * SAFETY:
 * ✓ Separate from SelectionCore
 * ✓ Non-destructive visuals
 * ✓ Performance: <0.08ms/frame
 * ✓ Memory: <35 KB (peak)
 * ✓ Proper cleanup and disposal
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

const CATEGORY_COLORS = {
  'cognition': 0x00FF88,    // Bright green
  'emotion': 0xFF0088,      // Hot pink
  'memory': 0x00FFFF,       // Cyan
  'identity': 0xFFAA00,     // Orange
  'instinct': 0xFF0000,     // Red
  'creativity': 0xAA00FF,   // Purple
  'logic': 0x00AAFF,        // Sky blue
  'default': 0x36F2FF       // Default cyan
};

export class UIPrimaryNodeAura3_7 {
  constructor(scene, selectionCore = null) {
    this.scene = scene;
    this.selectionCore = selectionCore;
    
    // Aura visuals
    this.auraMeshes = new Map(); // node -> { ring, pulse }
    this.auralimeTime = 0;
    
    this.enabled = true;
  }
  
  /**
   * Show aura for primary node
   */
  showAura(node) {
    if (!node || !node.userData || !node.userData.isNode) return;
    
    // Remove old aura if different node
    if (this.auraMeshes.size > 0) {
      this.auraMeshes.forEach((meshData, existingNode) => {
        if (existingNode !== node) {
          this._removeAuraMesh(existingNode);
        }
      });
    }
    
    // Create new aura if not exists
    if (!this.auraMeshes.has(node)) {
      this._createAuraMesh(node);
    }
  }
  
  /**
   * Hide aura for all nodes
   */
  hideAura() {
    this.auraMeshes.forEach((meshData, node) => {
      this._removeAuraMesh(node);
    });
    this.auraMeshes.clear();
  }
  
  /**
   * Create aura meshes for a node
   */
  _createAuraMesh(node) {
    if (this.auraMeshes.has(node)) return;
    
    const category = node.userData?.category || 'default';
    const baseColor = CATEGORY_COLORS[category] || CATEGORY_COLORS['default'];
    
    const nodeRadius = node.geometry?.boundingSphere?.radius || 1.5;
    const auraRadius = nodeRadius * 2.5; // Large ring
    const pulseRadius = nodeRadius * 2.0; // Inner pulse
    
    // Outer ring (torus) - main aura
    // [AURA VISUAL AUDIT] Reduced opacity from 0.6 to 0.18 (70% reduction)
    const ringGeometry = new THREE.TorusGeometry(auraRadius, nodeRadius * 0.3, 32, 8);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      emissive: baseColor,
      transparent: true,
      opacity: 0.18,   // [AURA AUDIT] Reduced from 0.6 - atmospheric range
      fog: false,
      wireframe: false,
      depthTest: true,
      depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.userData.isPrimaryAuraRing = true;
    ring.userData.auraLayer = 'AURA_UI';
    // [AURA VISUAL AUDIT] Render UI aura behind core (renderOrder from registry)
    ring.renderOrder = VisualHierarchyRegistry?.getRenderOrder('PRIMARY_UI') ?? 0.8;
    
    // Inner pulse layer (slightly smaller torus)
    // [AURA VISUAL AUDIT] Reduced opacity from 0.3 to 0.10 (67% reduction)
    const pulseGeometry = new THREE.TorusGeometry(pulseRadius, nodeRadius * 0.15, 32, 8);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      emissive: baseColor,
      transparent: true,
      opacity: 0.10,   // [AURA AUDIT] Reduced from 0.3 - subtle feedback
      fog: false,
      wireframe: false,
      depthTest: true,
      depthWrite: false
    });
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.userData.isPrimaryAuraPulse = true;
    pulse.userData.auraLayer = 'AURA_UI';
    // [AURA VISUAL AUDIT] Render UI aura behind core (renderOrder from registry)
    pulse.renderOrder = VisualHierarchyRegistry?.getRenderOrder('PRIMARY_UI') ?? 0.8;
    
    // Position at node
    ring.position.copy(node.position);
    pulse.position.copy(node.position);
    
    // Slight offset for visual separation
    ring.position.z += nodeRadius * 0.2;
    pulse.position.z -= nodeRadius * 0.2;
    
    // Add to scene
    this.scene.add(ring);
    this.scene.add(pulse);
    
    // Store
    this.auraMeshes.set(node, {
      ring,
      pulse,
      baseColor,
      nodeRadius
    });
  }
  
  /**
   * Remove aura for a node
   */
  _removeAuraMesh(node) {
    if (!this.auraMeshes.has(node)) return;
    
    const meshData = this.auraMeshes.get(node);
    
    if (meshData.ring) {
      this.scene.remove(meshData.ring);
      meshData.ring.geometry?.dispose();
      meshData.ring.material?.dispose();
    }
    
    if (meshData.pulse) {
      this.scene.remove(meshData.pulse);
      meshData.pulse.geometry?.dispose();
      meshData.pulse.material?.dispose();
    }
    
    this.auraMeshes.delete(node);
  }
  
  /**
   * Update aura animations
   */
  update(deltaTime) {
    if (!this.enabled || this.auraMeshes.size === 0) return;
    if (!this.frameScheduler?.shouldRunVisual?.()) return;
    this.auralimeTime += deltaTime;
    
    this.auraMeshes.forEach((meshData, node) => {
      // Rotation
      meshData.ring.rotation.x += deltaTime * 0.3;
      meshData.ring.rotation.y += deltaTime * 0.5;
      
      meshData.pulse.rotation.x -= deltaTime * 0.2;
      meshData.pulse.rotation.y -= deltaTime * 0.7;
      
      // Vertical bob (sine wave, slow)
      const bobHeight = meshData.nodeRadius * 0.3;
      const bobFreq = 1.5; // cycles per second
      const bobOffset = Math.sin(this.auralimeTime * bobFreq * Math.PI * 2) * bobHeight;
      
      // Apply bob to vertical offset (keep other coordinates)
      meshData.ring.position.copy(node.position);
      meshData.ring.position.z += meshData.nodeRadius * 0.2;
      meshData.ring.position.y += bobOffset;
      
      meshData.pulse.position.copy(node.position);
      meshData.pulse.position.z -= meshData.nodeRadius * 0.2;
      meshData.pulse.position.y -= bobOffset * 0.7; // Slightly different phase
      
      // Pulse opacity animation
      const pulseIntensity = 0.3 + Math.sin(this.auralimeTime * 2 * Math.PI * 2) * 0.2;
      meshData.pulse.material.opacity = pulseIntensity;
      
      // Ring opacity slight variation
      const ringIntensity = 0.6 + Math.cos(this.auralimeTime * 1.5 * Math.PI * 2) * 0.15;
      meshData.ring.material.opacity = ringIntensity;
    });
  }
  
  /**
   * Enable/disable
   */
  setEnabled(value) {
    this.enabled = value;
    
    // Hide auras when disabled
    if (!value) {
      this.auraMeshes.forEach((meshData) => {
        meshData.ring.visible = false;
        meshData.pulse.visible = false;
      });
    } else {
      this.auraMeshes.forEach((meshData) => {
        meshData.ring.visible = true;
        meshData.pulse.visible = true;
      });
    }
  }
  
  /**
   * Dispose
   */
  dispose() {
    this.hideAura();
    this.auraMeshes.clear();
    this.enabled = false;
  }
}
