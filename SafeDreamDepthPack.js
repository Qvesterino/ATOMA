import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';

/**
 * SafeDreamDepthPack.js - AI Depth-of-Field Simulation (Pure VFX)
 * 
 * SAFE: 100% non-destructive VFX overlays
 * - NO camera modifications
 * - NO shader changes
 * - NO physics alterations
 * - NO FOV changes
 * - NO rotation enforcement
 * 
 * Only screen-space overlays, color modulation, and soft masking
 */

export class SafeDreamDepthPack {
  constructor(scene, environmentRoot, camera, renderer) {
    this.scene = scene;
    this.root = environmentRoot || scene;
    this.camera = camera;
    this.renderer = renderer;
    
    // VFX container for all DOF effects
    this.vfxContainer = new THREE.Group();
    this.vfxContainer.name = 'dream-depth-vfx';
    this.root.add(this.vfxContainer);
    
    // Screen-space overlay quad (for all effects)
    this.overlayQuad = null;
    this.setupOverlayQuad();
    
    // Textures for masks and gradients
    this.vignetteTexture = this.createVignetteMask();
    this.focusTexture = this.createFocusMask();
    
    // State tracking
    this.isActive = true;
    this.currentFocus = null;
    this.focusTransition = 0;
    this.focusDuration = 0;
    this.focusIntensity = 0;
    
    // Configuration
    this.config = {
      // Baseline DOF (always applied)
      vignette: {
        opacity: 0.08,
        softness: 0.25,
        maxRadius: 0.7
      },
      
      desaturation: {
        background: 0.04,        // 4% desaturation
        periphery: 0.06          // 6% at edges
      },
      
      contrast: {
        centerBoost: 0.03,       // +3% center contrast
        edgeDim: 0.02            // -2% edge contrast
      },
      
      // Auto-focus effects
      focus: {
        fadeInTime: 0.35,
        fadeOutTime: 0.35,
        contrastBoost: 0.04,
        backgroundFade: 0.06,
        vignetteIncrease: 0.02
      },
      
      // Depth pulse
      pulse: {
        minIntensity: 0.008,
        maxIntensity: 0.015,
        duration: 0.25
      },
      
      // Dream glaze
      glaze: {
        microBloom: 0.04,
        warmthTint: 0.015       // Subtle warmth
      },
      
      // Stability
      stabilityThreshold: 0.5,  // Movement speed threshold
      stabilityDamping: 0.3     // Reduce effects if moving fast
    };
    
    // Timing
    this.time = 0;
    this.lastFrameTime = performance.now();
    this.cameraVelocity = new THREE.Vector3();
    this.lastCameraPos = camera.position.clone();
    this._timeOrigin = undefined;
    this._lastVisualTime = undefined;
    
    // Pulse tracking
    this.activePulses = [];
    
    // Performance LOD
    this.lodLevel = 'HIGH';
    this.fpsTarget = 60;
    
    console.log('✓ Safe Dream Depth Pack initialized');
  }
  
  /**
   * Create overlay quad for screen-space effects
   */
  setupOverlayQuad() {
    // Create full-screen quad
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    // Use canvas-based approach for maximum safety
    // No custom shader - just color modulation through material
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false
    });
    
    this.overlayQuad = new THREE.Mesh(geometry, material);
    this.overlayQuad.position.z = 0.1; // In front of everything
    // PHASE 3B→4: move overlay into world space (WORLD_OVERLAY)
    this.overlayQuad.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_OVERLAY'); // Render last
    
    this.overlayQuad.userData = {
      type: 'dream-depth-overlay',
      vignetteOpacity: 0,
      desaturation: 0,
      contrast: 0,
      warmthTint: 0
    };
    
    this.vfxContainer.add(this.overlayQuad);
  }
  
  /**
   * Create vignette mask texture (soft radial gradient)
   */
  createVignetteMask() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY);
    
    // Create radial gradient
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, maxRadius
    );
    
    gradient.addColorStop(0, 'rgba(255,255,255,1)');      // Clear center
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');  // Soft transition
    gradient.addColorStop(1, 'rgba(0,0,0,0.8)');          // Dark edges
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
  
  /**
   * Create focus mask texture
   */
  createFocusMask() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Create focus circle
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 10,
      centerX, centerY, Math.min(centerX, centerY)
    );
    
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.min(centerX, centerY), 0, Math.PI * 2);
    ctx.fill();
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
  
  /**
   * Update camera velocity (for stability mode)
   */
  updateCameraVelocity() {
    const currentPos = this.camera.position.clone();
    this.cameraVelocity.subVectors(currentPos, this.lastCameraPos);
    this.lastCameraPos.copy(currentPos);
  }
  
  /**
   * Get stability factor (1.0 = normal, <1.0 = reduced effects)
   */
  getStabilityFactor() {
    const speed = this.cameraVelocity.length();
    if (speed < this.config.stabilityThreshold) {
      return 1.0;
    }
    
    // Reduce effect intensity when moving fast
    const excess = speed - this.config.stabilityThreshold;
    return Math.max(0.3, 1.0 - excess * this.config.stabilityDamping);
  }
  
  /**
   * Apply baseline DOF illusion
   */
  applyBaselineDOF(deltaTime) {
    if (!this.overlayQuad) return;
    
    const stability = this.getStabilityFactor();
    const userData = this.overlayQuad.userData;
    
    // Baseline vignette (always on)
    const targetVignette = this.config.vignette.opacity * stability;
    userData.vignetteOpacity += (targetVignette - userData.vignetteOpacity) * 0.1;
    
    // Baseline desaturation
    const targetDesaturation = this.config.desaturation.background * stability;
    userData.desaturation += (targetDesaturation - userData.desaturation) * 0.08;
    
    // Baseline contrast (subtle center boost)
    const targetContrast = this.config.contrast.centerBoost * stability;
    userData.contrast += (targetContrast - userData.contrast) * 0.1;
  }
  
  /**
   * Auto-focus on nearby important objects
   */
  autoFocusOnTarget(targets) {
    if (!targets || targets.length === 0) {
      // Fade out focus
      this.focusTransition = Math.max(0, this.focusTransition - 0.05);
      return;
    }
    
    // Find closest target to camera center
    let closestTarget = null;
    let closestDistance = Infinity;
    
    for (const target of targets) {
      if (!target.position) continue;
      
      const distance = this.camera.position.distanceTo(target.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTarget = target;
      }
    }
    
    if (closestTarget) {
      this.currentFocus = closestTarget;
      this.focusTransition = Math.min(1.0, this.focusTransition + 0.1);
    }
  }
  
  /**
   * Apply focus effect when looking at important objects
   */
  applyFocusEffect(deltaTime) {
    if (!this.currentFocus || this.focusTransition < 0.01) return;
    
    if (!this.overlayQuad) return;
    
    const userData = this.overlayQuad.userData;
    const t = this.focusTransition;
    
    // Boost focus effects
    const focusBoost = this.config.focus.contrastBoost * t;
    const vignetteBoost = this.config.focus.vignetteIncrease * t;
    const fadeBoost = this.config.focus.backgroundFade * t;
    
    userData.vignetteOpacity += vignetteBoost * 0.1;
    userData.desaturation += fadeBoost * 0.08;
    userData.contrast += focusBoost * 0.1;
  }
  
  /**
   * Trigger depth pulse (on synergy spike or legendary event)
   */
  triggerDepthPulse() {
    const pulse = {
      elapsed: 0,
      duration: this.config.pulse.duration,
      intensity: 0,
      maxIntensity: this.config.pulse.maxIntensity,
      startTime: performance.now()
    };
    
    this.activePulses.push(pulse);
  }
  
  /**
   * Update depth pulses
   */
  updateDepthPulses(deltaTime) {
    for (let i = this.activePulses.length - 1; i >= 0; i--) {
      const pulse = this.activePulses[i];
      pulse.elapsed += deltaTime;
      
      // Calculate pulse intensity (smooth bell curve)
      const progress = pulse.elapsed / pulse.duration;
      if (progress >= 1) {
        this.activePulses.splice(i, 1);
        continue;
      }
      
      // Bell curve intensity
      pulse.intensity = pulse.maxIntensity * Math.sin(progress * Math.PI);
    }
    
    // Apply all active pulses
    if (!this.overlayQuad) return;
    
    const userData = this.overlayQuad.userData;
    let pulseEffect = 0;
    
    for (const pulse of this.activePulses) {
      pulseEffect += pulse.intensity;
    }
    
    userData.contrast += pulseEffect * 0.1;
  }
  
  /**
   * Apply dream glaze (micro-bloom, warmth tint)
   */
  applyDreamGlaze(deltaTime) {
    if (!this.overlayQuad) return;
    
    const userData = this.overlayQuad.userData;
    
    // Micro-bloom (always subtle)
    const targetGlaze = this.config.glaze.microBloom;
    userData.warmthTint += (targetGlaze - userData.warmthTint) * 0.05;
  }
  
  /**
   * Apply weather-based tinting
   */
  applyWeatherEffects(weatherCondition) {
    if (!this.overlayQuad) return;
    
    const userData = this.overlayQuad.userData;
    
    if (weatherCondition === 'QUANTUM_STORM') {
      // Softer haze
      userData.vignetteOpacity += 0.02;
    } else if (weatherCondition === 'FRACTAL_FOG') {
      // Slight desaturation boost
      userData.desaturation += 0.02;
    } else if (weatherCondition === 'AURORA_WINDS') {
      // Light color tinting
      userData.warmthTint += 0.01;
    }
  }
  
  /**
   * Apply all effects to screen through color modulation
   */
  applyEffectsToScreen(deltaTime) {
    if (!this.overlayQuad) return;
    
    const userData = this.overlayQuad.userData;
    
    // Clamp values
    userData.vignetteOpacity = Math.min(0.15, Math.max(0, userData.vignetteOpacity));
    userData.desaturation = Math.min(0.08, Math.max(0, userData.desaturation));
    userData.contrast = Math.min(0.08, Math.max(0, userData.contrast));
    userData.warmthTint = Math.min(0.03, Math.max(0, userData.warmthTint));
    
    // Update material properties
    if (userData.vignetteOpacity > 0.001) {
      this.overlayQuad.material.opacity = userData.vignetteOpacity;
      this.overlayQuad.material.color.setHex(0x000000);
    } else {
      this.overlayQuad.material.opacity = 0;
    }
  }
  
  /**
   * Ensure camera stays upright (Z rotation = 0)
   * Apply only to VFX layer, never modify actual camera
   */
  enforceCameraStability() {
    // This is a read-only check - we never modify the camera
    // Just ensure our VFX respects camera orientation
    if (Math.abs(this.camera.rotation.z) > 0.01) {
      // Log but don't fix (safety - never touch camera rotation)
      // Just reduce VFX intensity temporarily
      const rollAmount = Math.abs(this.camera.rotation.z);
      const damping = Math.max(0.5, 1.0 - rollAmount);
      
      if (this.overlayQuad && this.overlayQuad.userData) {
        this.overlayQuad.userData.vignetteOpacity *= damping;
      }
    }
  }
  
  /**
   * Main update (call once per frame)
   */
  update(deltaTime, worldSystems) {
    if (this._timeOrigin === undefined) {
      this._timeOrigin = VisualTime.now;
    }
    const currentTime = VisualTime.now - this._timeOrigin; // Phase 2A: canonical VisualTime source (behavior-preserving)
    const visualDelta = this._lastVisualTime === undefined
      ? 0
      : Math.max(0, currentTime - this._lastVisualTime);
    this._lastVisualTime = currentTime;
    this.time = currentTime;
    this.lastFrameTime = visualDelta;

    // Update camera velocity for stability
    this.updateCameraVelocity();

    // Apply baseline DOF
    this.applyBaselineDOF(visualDelta);

    // Auto-focus on nearby targets
    if (worldSystems) {
      const targets = this.gatherFocusTargets(worldSystems);
      this.autoFocusOnTarget(targets);
    }

    // Apply focus effect
    this.applyFocusEffect(visualDelta);

    // Update pulses
    this.updateDepthPulses(visualDelta);

    // Apply dream glaze
    this.applyDreamGlaze(visualDelta);

    // Apply weather effects if available
    if (worldSystems && worldSystems.weatherRegistry) {
      const weather = worldSystems.weatherRegistry.currentWeather;
      this.applyWeatherEffects(weather);
    }

    // Apply all effects to screen
    this.applyEffectsToScreen(visualDelta);

    // Enforce camera stability (read-only check)
    this.enforceCameraStability();
  }
  
  /**
   * Gather potential focus targets from world systems
   */
  gatherFocusTargets(worldSystems) {
    const targets = [];
    
    // Nodes
    if (worldSystems.aiNodes && worldSystems.aiNodes.nodes) {
      for (const node of worldSystems.aiNodes.nodes) {
        if (node && node.position) {
          targets.push(node);
        }
      }
    }
    
    // Legendary nodes
    if (worldSystems.legendaryRegistry && worldSystems.legendaryRegistry.nodes) {
      for (const nodeId in worldSystems.legendaryRegistry.nodes) {
        const node = worldSystems.legendaryRegistry.nodes[nodeId];
        if (node && node.position) {
          targets.push(node);
        }
      }
    }
    
    // Colonies (if available)
    if (worldSystems.colonies) {
      for (const colony of worldSystems.colonies) {
        if (colony && colony.center) {
          targets.push({ position: colony.center });
        }
      }
    }
    
    return targets;
  }
  
  /**
   * Trigger DOF effect on synergy spike
   */
  onSynergySpike() {
    this.triggerDepthPulse();
  }
  
  /**
   * Trigger DOF effect on legendary link activation
   */
  onLegendaryLinkActivated() {
    this.triggerDepthPulse();
  }
  
  /**
   * Trigger DOF effect on world event
   */
  onWorldEvent(eventType) {
    if (eventType === 'COSMIC_PULSE' || eventType === 'QUANTUM_ECLIPSE') {
      this.triggerDepthPulse();
    }
  }
  
  /**
   * Set DOF intensity (0.0 = off, 1.0 = full)
   */
  setIntensity(value) {
    value = Math.max(0, Math.min(1, value));
    
    // Scale all effects
    const factor = value;
    this.config.vignette.opacity *= factor;
    this.config.desaturation.background *= factor;
    this.config.contrast.centerBoost *= factor;
  }
  
  /**
   * Toggle active state
   */
  setActive(active) {
    this.isActive = active;
    if (this.overlayQuad) {
      this.overlayQuad.visible = active;
    }
  }
  
  /**
   * Get debug info
   */
  getDebugInfo() {
    return {
      active: this.isActive,
      currentFocus: this.currentFocus ? 'active' : 'none',
      focusTransition: this.focusTransition.toFixed(2),
      activePulses: this.activePulses.length,
      overlayOpacity: this.overlayQuad?.material.opacity.toFixed(3),
      vignette: this.overlayQuad?.userData.vignetteOpacity.toFixed(3),
      desaturation: this.overlayQuad?.userData.desaturation.toFixed(3),
      contrast: this.overlayQuad?.userData.contrast.toFixed(3)
    };
  }
  
  /**
   * Complete cleanup
   */
  cleanup() {
    if (this.overlayQuad) {
      this.overlayQuad.geometry.dispose();
      this.overlayQuad.material.dispose();
    }
    
    this.vfxContainer.clear();
    this.scene.remove(this.vfxContainer);
    
    this.activePulses = [];
    this.currentFocus = null;
  }
}
