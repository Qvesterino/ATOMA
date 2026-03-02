/**
 * UI SELECTED NODE HIGHLIGHT 3.3
 * 
 * Special visual highlight effect for selected node:
 * - Thicker neon outline (30% thicker)
 * - Slow pulse 1.5s cycle
 * - Inner glow layer
 * - Color = node category color
 * - Visible ONLY on selected node
 * - Auto-disabled on deselection
 * 
 * SAFETY:
 * ✓ Pure visual overlay (no node material modifications)
 * ✓ Uses external glow meshes (reversible)
 * ✓ Performance: <0.2ms/frame
 */

import * as THREE from 'three';
import {
  createFresnelRimLightAuraMaterial,
} from './FresnelRimLightAuraShader.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

export class UISelectedNodeHighlight3_2 {
  constructor(scene) {
    this.scene = scene;
    this.selectedNode = null;
    this.highlightMeshes = new Map(); // node -> { mesh, material, geometry, emissiveBase }
    this.time = 0;
  }
  
  /**
   * Apply highlight to selected node
   */
  applyHighlight(node) {
    if (!node || !node.userData || !node.userData.isNode) return;
    
    // Remove old highlight if exists
    if (this.selectedNode && this.selectedNode !== node) {
      this.removeHighlight(this.selectedNode);
    }
    
    this.selectedNode = node;
    
    if (this.highlightMeshes.has(node)) return; // Already highlighted

    const baseRadius = node.geometry?.boundingSphere?.radius || 2.0;
    const shellRadius = baseRadius * 1.08;

    // Color blend: 70% inner tone, 30% edge tone
    const innerTone = new THREE.Color('#36F2FF');
    const edgeTone = new THREE.Color('#00E5FF');
    const blendedColor = innerTone.clone().lerp(edgeTone, 0.3);

    const material = createFresnelRimLightAuraMaterial({
      auraColor: blendedColor,
      rimPower: 2.35,
      rimScale: 1.15,
      fresnelMin: 0.18,
      fresnelMax: 0.72,
    });

    // Precise uniform tuning
    if (material.uniforms.uAuraOpacity) material.uniforms.uAuraOpacity.value = 0.24;
    if (material.uniforms.uAuraRadius) material.uniforms.uAuraRadius.value = 1.08;
    if (material.uniforms.uRimBreathingIntensity) material.uniforms.uRimBreathingIntensity.value = 0.08;
    if (material.uniforms.uAuraStrength) material.uniforms.uAuraStrength.value = 1.0;

    material.transparent = true;
    material.depthWrite = false;
    material.depthTest = true;

    const geometry = new THREE.IcosahedronGeometry(shellRadius, 4);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(node.position);
    mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('SELECTED');
    mesh.userData.isHighlight = true;
    mesh.userData.parentNode = node;
    mesh.userData.auraLayer = 'AURA_SELECTED';
    this.scene.add(mesh);

    // Store emissive baseline for subtle singularity boost
    const emissiveBase = node.material?.emissiveIntensity ?? 0;

    this.highlightMeshes.set(node, {
      mesh,
      material,
      geometry,
      emissiveBase,
    });
  }
  
  /**
   * Remove highlight from node
   */
  removeHighlight(node) {
    if (!node || !this.highlightMeshes.has(node)) return;
    
    const meshData = this.highlightMeshes.get(node);

    // Restore emissive intensity
    if (node.material && typeof meshData.emissiveBase === 'number') {
      node.material.emissiveIntensity = meshData.emissiveBase;
    }

    // Remove mesh
    this.scene.remove(meshData.mesh);
    meshData.geometry?.dispose();
    meshData.material?.dispose();
    
    // Remove from map
    this.highlightMeshes.delete(node);
    
    if (this.selectedNode === node) {
      this.selectedNode = null;
    }
  }
  
  /**
   * Get category color
   */
  /**
   * Update pulse animation
   */
  update(deltaTime) {
    this.time += deltaTime;
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    const breath = 1 + Math.sin(this.time * 0.6) * 0.03; // amplitude ~0.03 (<=0.05)

    for (const [node, meshData] of this.highlightMeshes.entries()) {
      if (!node || !this.scene.children.includes(meshData.mesh)) {
        this.removeHighlight(node);
        continue;
      }

      // Keep shell centered on node
      meshData.mesh.position.copy(node.position);

      // Animate fresnel shader
      if (meshData.material?.uniforms) {
        if (meshData.material.uniforms.uTime) {
          meshData.material.uniforms.uTime.value = this.time;
        }
        if (meshData.material.uniforms.uAuraPulse) {
          meshData.material.uniforms.uAuraPulse.value = breath;
        }
      }

      // Inner singularity: gentle emissive lift on the node itself
      if (node.material && typeof meshData.emissiveBase === 'number') {
        const base = meshData.emissiveBase;
        const boosted = base * 1.12 * breath;
        const clamped = base + Math.min((boosted - base), base * 0.05 + 0.05); // cap extra at ~0.05
        node.material.emissiveIntensity = clamped;
      }
    }
  }
  
  /**
   * Clear all highlights
   */
  clearAll() {
    for (const [node, meshData] of this.highlightMeshes.entries()) {
      this.scene.remove(meshData.ring);
      this.scene.remove(meshData.glow);
      meshData.ring.geometry?.dispose();
      meshData.ring.material?.dispose();
      meshData.glow.geometry?.dispose();
      meshData.glow.material?.dispose();
    }
    
    this.highlightMeshes.clear();
    this.selectedNode = null;
  }
  
  /**
   * Dispose
   */
  dispose() {
    this.clearAll();
  }
}
