import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

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
 *
 * Role split: this class remains a low-cost fallback depth layer.
 * Complex DOF orchestration belongs to DreamDepthEffectManager.
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
    
    // Screen-space overlay stack (for layered DOF effects)
    this.vignetteTexture = this.createVignetteMask();
    this.focusTexture = this.createFocusMask();
    this.screenState = {
      vignetteOpacity: 0,
      focusOpacity: 0,
      pulseOpacity: 0,
      glazeOpacity: 0,
      desaturation: 0,
      contrast: 0,
      warmthTint: 0,
      vignetteColor: new THREE.Color(0xc8f2ff),
      pulseColor: new THREE.Color(0xeafbff),
      glazeColor: new THREE.Color(0xffd7c0)
    };
    this.screenLayers = {
      vignetteLayer: null,
      focusLayer: null,
      pulseLayer: null,
      glazeLayer: null
    };
    this.glazeBaseColor = new THREE.Color(0xffd7c0);
    this.intensityScale = 1.0;
    this.lastPulseTime = 0;
    this.pulseCooldown = 0.15;
    this.setupOverlayQuad();
    
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
    this.screenGeometry = new THREE.PlaneGeometry(2, 2);
    const geometry = this.screenGeometry;

    const baseRenderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_OVERLAY');

    this.screenLayers.vignetteLayer = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      map: this.vignetteTexture,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false
    }));
    this.screenLayers.vignetteLayer.renderOrder = baseRenderOrder;
    this.screenLayers.vignetteLayer.position.z = 0.1;

    this.screenLayers.focusLayer = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      map: this.focusTexture,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false
    }));
    this.screenLayers.focusLayer.renderOrder = baseRenderOrder;
    this.screenLayers.focusLayer.position.z = 0.11;

    this.screenLayers.pulseLayer = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    this.screenLayers.pulseLayer.renderOrder = baseRenderOrder;
    this.screenLayers.pulseLayer.position.z = 0.12;

    this.screenLayers.glazeLayer = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: this.glazeBaseColor,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false
    }));
    this.screenLayers.glazeLayer.renderOrder = baseRenderOrder;
    this.screenLayers.glazeLayer.position.z = 0.13;

    this.vfxContainer.add(
      this.screenLayers.vignetteLayer,
      this.screenLayers.focusLayer,
      this.screenLayers.pulseLayer,
      this.screenLayers.glazeLayer
    );
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
    if (!this.screenLayers.vignetteLayer) return;
    
    const stability = this.getStabilityFactor();
    const state = this.screenState;
    
    // Baseline vignette (always on)
    const scale = this.intensityScale;
    const targetVignette = this.config.vignette.opacity * stability * scale;
    state.vignetteOpacity += (targetVignette - state.vignetteOpacity) * 0.1;
    this.screenLayers.vignetteLayer.material.opacity = state.vignetteOpacity;
    
    // Baseline desaturation
    const targetDesaturation = this.config.desaturation.background * stability * scale;
    state.desaturation += (targetDesaturation - state.desaturation) * 0.08;
    
    // Baseline contrast (subtle center boost)
    const targetContrast = this.config.contrast.centerBoost * stability * scale;
    state.contrast += (targetContrast - state.contrast) * 0.1;
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

    let bestTarget = null;
    let bestScore = -Infinity;
    const cameraPos = this.camera.position;

    const stageMap = {
      ritual: 1.0,
      late: 0.8,
      active: 0.7,
      mid: 0.5,
      early: 0.3,
      passive: 0.2
    };

    for (const target of targets) {
      if (!target || !target.position) continue;

      const distance = cameraPos.distanceTo(target.position);
      const importance = typeof target.importance === 'number' ? target.importance : (typeof target.priority === 'number' ? target.priority : 0);
      const legendary = target.legendary || target.isLegendary || target.legendary === true ? 1 : 0;
      const stage = typeof target.stage === 'string' ? (stageMap[target.stage.toLowerCase()] ?? 0) : (typeof target.stage === 'number' ? Math.min(1, Math.max(0, target.stage / 10)) : 0);
      const distanceScore = Math.max(0, 1 - Math.min(distance / 120, 1));
      const score = importance * 1.2 + legendary * 1.8 + stage * 1.0 + distanceScore * 1.3;

      if (score > bestScore) {
        bestScore = score;
        bestTarget = target;
      }
    }

    if (bestTarget) {
      this.currentFocus = bestTarget;
      this.focusTransition = Math.min(1.0, this.focusTransition + 0.1);
    }
  }
  
  /**
   * Apply focus effect when looking at important objects
   */
  applyFocusEffect(deltaTime) {
    if (!this.currentFocus || this.focusTransition < 0.01) return;
    
    if (!this.screenLayers.focusLayer) return;
    
    const state = this.screenState;
    const t = this.focusTransition;
    
    // Boost focus effects
    const focusBoost = this.config.focus.contrastBoost * t;
    const vignetteBoost = this.config.focus.vignetteIncrease * t;
    const fadeBoost = this.config.focus.backgroundFade * t;
    
    // Tighter clarity, reduced edge darkness, warm glaze
    state.vignetteOpacity = Math.max(0, state.vignetteOpacity - 0.03);
    state.desaturation += fadeBoost * 0.08;
    state.contrast += focusBoost * 0.12;
    state.focusOpacity += t * 0.06;
    state.focusOpacity = Math.min(0.22, state.focusOpacity);
    state.glazeOpacity += 0.03 * t;
    state.warmthTint += 0.02 * t;
    this.screenLayers.focusLayer.material.opacity = state.focusOpacity;
  }
  
  /**
   * Trigger depth pulse (on synergy spike or legendary event)
   */
  triggerDepthPulse() {
    const now = performance.now();
    const recentPulse = this.activePulses[this.activePulses.length - 1];
    if (recentPulse && now - this.lastPulseTime < this.pulseCooldown) {
      recentPulse.maxIntensity = Math.min(this.config.pulse.maxIntensity * 1.5, recentPulse.maxIntensity + this.config.pulse.maxIntensity * 0.35);
      recentPulse.elapsed = 0;
      this.lastPulseTime = now;
      return;
    }

    const pulse = {
      elapsed: 0,
      duration: this.config.pulse.duration,
      intensity: 0,
      maxIntensity: this.config.pulse.maxIntensity,
      startTime: now
    };
    this.activePulses.push(pulse);
    this.lastPulseTime = now;
  }
  
  /**
   * Update depth pulses
   */
  updateDepthPulses(deltaTime) {
    const state = this.screenState;
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
    
    let pulseEffect = 0;
    for (const pulse of this.activePulses) {
      pulseEffect += pulse.intensity;
    }
    
    state.contrast += pulseEffect * 0.12;
    state.pulseOpacity = Math.min(0.24, pulseEffect * 0.9);
    if (this.screenLayers.pulseLayer) {
      this.screenLayers.pulseLayer.material.opacity = state.pulseOpacity;
      this.screenLayers.pulseLayer.material.color.copy(state.pulseColor);
    }
  }
  
  /**
   * Apply dream glaze (micro-bloom, warmth tint)
   */
  applyDreamGlaze(deltaTime) {
    if (!this.screenLayers.glazeLayer) return;
    
    const state = this.screenState;
    
    // Micro-bloom (always subtle)
    const targetGlaze = this.config.glaze.microBloom * this.intensityScale;
    state.glazeOpacity += (targetGlaze - state.glazeOpacity) * 0.05;
    state.warmthTint += (this.config.glaze.warmthTint * this.intensityScale - state.warmthTint) * 0.05;
    if (this.screenLayers.glazeLayer) {
      this.screenLayers.glazeLayer.material.opacity = state.glazeOpacity;
      this.screenLayers.glazeLayer.material.color.lerpColors(
        new THREE.Color(0x000000),
        state.vignetteColor,
        state.warmthTint
      );
    }
  }
  
  /**
   * Apply weather-based tinting
   */
  normalizeWeatherCondition(weatherCondition) {
    const translation = {
      QUANTUM_STORM: 'stormBias',
      FRACTAL_FOG: 'ascensionHaze',
      AURORA_WINDS: 'resonance',
      calm: 'calm',
      pressure: 'pressure',
      resonance: 'resonance',
      stormBias: 'stormBias',
      ascensionHaze: 'ascensionHaze'
    };

    if (!weatherCondition) return null;
    if (typeof weatherCondition === 'object' && weatherCondition.type) {
      return translation[weatherCondition.type] || null;
    }
    return translation[weatherCondition] || null;
  }

  applyWeatherEffects(weatherCondition) {
    const normalizedWeather = this.normalizeWeatherCondition(weatherCondition);
    const state = this.screenState;
    if (!state || !normalizedWeather) return;

    switch (normalizedWeather) {
      case 'calm':
        state.vignetteColor.setHex(0xe8ffff);
        state.focusOpacity = Math.min(0.12, state.focusOpacity + 0.02);
        state.contrast += 0.01;
        break;
      case 'pressure':
        state.vignetteColor.setHex(0x8f78c8);
        state.vignetteOpacity += 0.02;
        state.contrast += 0.02;
        state.warmthTint = Math.min(0.02, state.warmthTint + 0.01);
        break;
      case 'resonance':
        state.vignetteColor.setHex(0x9fffe8);
        state.focusOpacity = Math.min(0.14, state.focusOpacity + 0.02);
        state.pulseColor.setHex(0x95ffdf);
        state.warmthTint += 0.005;
        break;
      case 'stormBias':
        state.vignetteColor.setHex(0xca87e8);
        state.vignetteOpacity += 0.035;
        state.pulseOpacity += 0.04;
        state.pulseColor.setHex(0xe8b4ff);
        break;
      case 'ascensionHaze':
        state.vignetteColor.setHex(0xffffff);
        state.glazeOpacity += 0.03;
        state.warmthTint += 0.02;
        state.pulseColor.setHex(0xffffff);
        break;
      default:
        break;
    }
    if (this.screenLayers.vignetteLayer) {
      this.screenLayers.vignetteLayer.material.color.copy(state.vignetteColor);
    }
    if (this.screenLayers.pulseLayer) {
      this.screenLayers.pulseLayer.material.color.copy(state.pulseColor);
    }
    if (this.screenLayers.glazeLayer) {
      this.screenLayers.glazeLayer.material.color.lerpColors(
        new THREE.Color(0x000000),
        state.vignetteColor,
        state.warmthTint
      );
    }
  }
  
  /**
   * Apply all effects to screen through color modulation
   */
  applyEffectsToScreen(deltaTime) {
    if (!this.screenLayers.vignetteLayer) return;

    const state = this.screenState;

    // Clamp values
    state.vignetteOpacity = Math.min(0.15, Math.max(0, state.vignetteOpacity));
    state.focusOpacity = Math.min(0.2, Math.max(0, state.focusOpacity));
    state.pulseOpacity = Math.min(0.25, Math.max(0, state.pulseOpacity));
    state.glazeOpacity = Math.min(0.12, Math.max(0, state.glazeOpacity));
    state.desaturation = Math.min(0.08, Math.max(0, state.desaturation));
    state.contrast = Math.min(0.08, Math.max(0, state.contrast));
    state.warmthTint = Math.min(0.03, Math.max(0, state.warmthTint));

    this.screenLayers.vignetteLayer.material.opacity = state.vignetteOpacity;
    this.screenLayers.focusLayer.material.opacity = state.focusOpacity;
    this.screenLayers.pulseLayer.material.opacity = state.pulseOpacity;
    this.screenLayers.glazeLayer.material.opacity = state.glazeOpacity;
    this.screenLayers.glazeLayer.material.color.lerpColors(
      new THREE.Color(0x000000),
      this.glazeBaseColor,
      state.warmthTint
    );

    // Apply per-layer blending/composite state
    this.screenLayers.vignetteLayer.visible = state.vignetteOpacity > 0.001;
    this.screenLayers.focusLayer.visible = state.focusOpacity > 0.001;
    this.screenLayers.pulseLayer.visible = state.pulseOpacity > 0.001;
    this.screenLayers.glazeLayer.visible = state.glazeOpacity > 0.001;
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
      
      if (this.screenState) {
        this.screenState.vignetteOpacity *= damping;
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
    const normalizedType = typeof eventType === 'string'
      ? eventType.toUpperCase()
      : (eventType?.type ? String(eventType.type).toUpperCase() : '');

    const pulseEvents = new Set([
      'COSMIC_PULSE',
      'QUANTUM_ECLIPSE',
      'LUMINESCENT_BURST',
      'STARFALL',
      'SYNTHESIS_RITUAL',
      'WEATHER_SHIFT',
      'AETHER_SURGE'
    ]);

    if (pulseEvents.has(normalizedType) || /PULSE|ECLIPSE|BURST|SURGE|RITUAL|STARFALL/.test(normalizedType)) {
      this.triggerDepthPulse();
      return;
    }

    // Additional world events may also drive a subtle focus change
    if (/EVENT|PHASE|SHIFT|BLOOM/.test(normalizedType)) {
      this.focusTransition = Math.min(1.0, this.focusTransition + 0.08);
    }
  }
  
  /**
   * Set DOF intensity (0.0 = off, 1.0 = full)
   */
  setIntensity(value) {
    this.intensityScale = Math.max(0, Math.min(1, value));
  }
  
  /**
   * Toggle active state
   */
  setActive(active) {
    this.isActive = active;
    if (this.screenLayers.vignetteLayer) {
      this.screenLayers.vignetteLayer.visible = active;
      this.screenLayers.focusLayer.visible = active;
      this.screenLayers.pulseLayer.visible = active;
      this.screenLayers.glazeLayer.visible = active;
    }
  }
  
  /**
   * Get debug info
   */
  getDebugInfo() {
    const state = this.screenState;
    return {
      active: this.isActive,
      currentFocus: this.currentFocus ? 'active' : 'none',
      focusTransition: this.focusTransition.toFixed(2),
      activePulses: this.activePulses.length,
      vignette: state?.vignetteOpacity?.toFixed(3),
      focus: state?.focusOpacity?.toFixed(3),
      pulse: state?.pulseOpacity?.toFixed(3),
      glaze: state?.glazeOpacity?.toFixed(3),
      desaturation: state?.desaturation?.toFixed(3),
      contrast: state?.contrast?.toFixed(3)
    };
  }
  
  /**
   * Complete cleanup
   */
  cleanup() {
    for (const layer of Object.values(this.screenLayers)) {
      if (layer) {
        layer.material.dispose();
      }
    }
    if (this.screenGeometry) {
      this.screenGeometry.dispose();
      this.screenGeometry = null;
    }
    if (this.vignetteTexture) {
      this.vignetteTexture.dispose();
      this.vignetteTexture = null;
    }
    if (this.focusTexture) {
      this.focusTexture.dispose();
      this.focusTexture = null;
    }

    if (this.vfxContainer) {
      if (this.root && this.root.remove) {
        this.root.remove(this.vfxContainer);
      }
      this.vfxContainer.clear();
      this.vfxContainer = null;
    }

    this.activePulses = [];
    this.currentFocus = null;
    this.overlayQuad = null;
  }
}
