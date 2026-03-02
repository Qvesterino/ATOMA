import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

/**
 * DreamDepthEffectManager.js - Advanced DOF Effect Rendering
 * 
 * SAFE: Pure VFX rendering through canvas overlays
 * - Creates visual DOF effects without shader modifications
 * - Screen-space color modulation only
 * - No camera or physics modifications
 */

export class DreamDepthEffectManager {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    // Create effect layers
    this.vignetteLayer = this.createVignetteLayer();
    this.focusLayer = this.createFocusLayer();
    this.pulseLayer = this.createPulseLayer();
    this.glazeLayer = this.createGlazeLayer();
    
    // Container for all layers
    this.layerContainer = new THREE.Group();
    this.layerContainer.name = 'dream-depth-layers';
    // PHASE 3B→4: move overlay into world space (WORLD_OVERLAY)
    this.layerContainer.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_OVERLAY');
    this.scene.add(this.layerContainer);
    
    this.layerContainer.add(this.vignetteLayer.mesh);
    this.layerContainer.add(this.focusLayer.mesh);
    this.layerContainer.add(this.pulseLayer.mesh);
    this.layerContainer.add(this.glazeLayer.mesh);
    
    // Effect state - REDUCED to preserve scene detail during linking
    this.effects = {
      vignette: { intensity: 0, target: 0.02 },      // Reduced from 0.08 (80% reduction)
      focus: { intensity: 0, target: 0 },
      pulse: { intensity: 0, target: 0 },
      glaze: { intensity: 0, target: 0.01 }          // Reduced from 0.04 (75% reduction)
    };
    
    // Configuration - BALANCED to maintain clarity and detail
    this.config = {
      transitionSpeed: 0.08,
      maxIntensity: 0.08,              // Reduced from 0.15 (47% reduction)
      bloomStrength: 1.2
    };
  }
  
  /**
   * Create vignette layer (soft edge darkening)
   */
  createVignetteLayer() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.9;
    
    // Create vignette pattern
    const gradient = ctx.createRadialGradient(
      centerX, centerY, maxRadius * 0.3,
      centerX, centerY, maxRadius
    );
    
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.6, 'rgba(0,0,0,0.1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false
    });
    
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = 0.05;
    // PHASE 3B→4: move overlay into world space (WORLD_OVERLAY)
    mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_OVERLAY');
    
    return {
      mesh: mesh,
      material: material,
      canvas: canvas,
      texture: texture
    };
  }
  
  /**
   * Create focus layer (center brightening)
   */
  createFocusLayer() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Create radial focus mask
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 20,
      centerX, centerY, 200
    );
    
    gradient.addColorStop(0, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false
    });
    
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = 0.06;
    // PHASE 3B→4: move overlay into world space (WORLD_OVERLAY)
    mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_OVERLAY');
    
    return {
      mesh: mesh,
      material: material,
      canvas: canvas,
      texture: texture
    };
  }
  
  /**
   * Create pulse layer (radial brightness pulse)
   */
  createPulseLayer() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Soft radial gradient for pulse
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, Math.min(centerX, centerY)
    );
    
    gradient.addColorStop(0, 'rgba(255,255,200,0.3)');
    gradient.addColorStop(1, 'rgba(255,255,200,0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false
    });
    
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = 0.07;
    // PHASE 3B→4: move overlay into world space (WORLD_OVERLAY)
    mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_OVERLAY');
    
    return {
      mesh: mesh,
      material: material,
      canvas: canvas,
      texture: texture,
      scale: 1.0
    };
  }
  
  /**
   * Create glaze layer (micro-bloom and warmth)
   */
  createGlazeLayer() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    
    const ctx = canvas.getContext('2d');
    
    // Soft white overlay for bloom effect
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add warmth tint
    ctx.fillStyle = 'rgba(255,200,150,0.03)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false
    });
    
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = 0.08;
    // PHASE 3B→4: move overlay into world space (WORLD_OVERLAY)
    mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_OVERLAY');
    
    return {
      mesh: mesh,
      material: material,
      canvas: canvas,
      texture: texture
    };
  }
  
  /**
   * Update all effect intensities
   */
  update(deltaTime) {
    if (!this.frameScheduler?.shouldRunSimulation?.()) return;
    // Update vignette
    this.effects.vignette.intensity += (this.effects.vignette.target - this.effects.vignette.intensity) * this.config.transitionSpeed;
    this.vignetteLayer.material.opacity = Math.min(this.config.maxIntensity, this.effects.vignette.intensity);
    
    // Update focus
    this.effects.focus.intensity += (this.effects.focus.target - this.effects.focus.intensity) * this.config.transitionSpeed;
    this.focusLayer.material.opacity = Math.min(this.config.maxIntensity * 0.5, this.effects.focus.intensity);
    
    // Update pulse
    this.effects.pulse.intensity += (this.effects.pulse.target - this.effects.pulse.intensity) * this.config.transitionSpeed;
    this.pulseLayer.material.opacity = Math.min(this.config.maxIntensity * 0.4, this.effects.pulse.intensity);
    
    // Update glaze
    this.effects.glaze.intensity += (this.effects.glaze.target - this.effects.glaze.intensity) * this.config.transitionSpeed;
    this.glazeLayer.material.opacity = Math.min(this.config.maxIntensity * 0.3, this.effects.glaze.intensity);
  }
  
  /**
   * Set vignette intensity (0-1)
   */
  setVignette(value) {
    this.effects.vignette.target = Math.max(0, Math.min(1, value));
  }
  
  /**
   * Set focus intensity (0-1)
   */
  setFocus(value) {
    this.effects.focus.target = Math.max(0, Math.min(1, value));
  }
  
  /**
   * Trigger pulse effect
   */
  triggerPulse(duration = 0.3) {
    this.effects.pulse.target = 1.0;
    
    // Auto-fade after duration
    setTimeout(() => {
      this.effects.pulse.target = 0;
    }, duration * 1000);
  }
  
  /**
   * Set glaze intensity
   */
  setGlaze(value) {
    this.effects.glaze.target = Math.max(0, Math.min(1, value));
  }
  
  /**
   * Cleanup
   */
  cleanup() {
    this.vignetteLayer.mesh.geometry.dispose();
    this.vignetteLayer.material.dispose();
    this.vignetteLayer.texture.dispose();
    
    this.focusLayer.mesh.geometry.dispose();
    this.focusLayer.material.dispose();
    this.focusLayer.texture.dispose();
    
    this.pulseLayer.mesh.geometry.dispose();
    this.pulseLayer.material.dispose();
    this.pulseLayer.texture.dispose();
    
    this.glazeLayer.mesh.geometry.dispose();
    this.glazeLayer.material.dispose();
    this.glazeLayer.texture.dispose();
    
    this.layerContainer.clear();
    this.scene.remove(this.layerContainer);
  }
}
