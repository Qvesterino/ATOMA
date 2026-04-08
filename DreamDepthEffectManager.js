import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

/**
 * DreamDepthEffectManager.js - Rich ATOMA Dream Aperture Overlay
 *
 * Primary rich overlay path for ATOMA depth-of-field VFX.
 * SafeDreamDepthPack remains the low-cost fallback depth layer.
 *
 * Palette:
 *   void deep   #05131A
 *   ATOMA cyan  #6DEAFF
 *   mint        #77F7DB
 *   ritual white #F7FBFF
 *   violet      #D07BFF
 *   rose        #FF73CF
 *
 * SAFE: Pure VFX rendering through canvas overlays.
 * No camera mutations, no shader dependencies, no physics changes.
 */

const ATOMA_PALETTE = {
  voidDeep:     0x05131A,
  cyan:         0x6DEAFF,
  mint:         0x77F7DB,
  ritualWhite:  0xF7FBFF,
  violet:       0xD07BFF,
  rose:         0xFF73CF
};

const WEATHER_KEYS = new Set(['calm', 'pressure', 'resonance', 'stormBias', 'ascensionHaze']);

const WEATHER_COLOR_MAP = {
  calm:          { vignette: 0xe8ffff, pulse: ATOMA_PALETTE.cyan,    glaze: ATOMA_PALETTE.mint },
  pressure:      { vignette: 0x8f78c8, pulse: ATOMA_PALETTE.violet,  glaze: 0x6a5a9a },
  resonance:     { vignette: 0x9fffe8, pulse: ATOMA_PALETTE.mint,    glaze: ATOMA_PALETTE.cyan },
  stormBias:     { vignette: ATOMA_PALETTE.violet, pulse: ATOMA_PALETTE.rose, glaze: ATOMA_PALETTE.violet },
  ascensionHaze: { vignette: ATOMA_PALETTE.ritualWhite, pulse: ATOMA_PALETTE.ritualWhite, glaze: ATOMA_PALETTE.ritualWhite }
};

const PULSE_EVENT_PATTERNS = /PULSE|ECLIPSE|BURST|SURGE|RITUAL|STARFALL/;
const PULSE_EVENTS = new Set([
  'COSMIC_PULSE', 'QUANTUM_ECLIPSE', 'LUMINESCENT_BURST',
  'STARFALL', 'SYNTHESIS_RITUAL', 'WEATHER_SHIFT', 'AETHER_SURGE'
]);

const STAGE_MAP = {
  ritual: 1.0, late: 0.8, active: 0.7,
  mid: 0.5, early: 0.3, passive: 0.2
};

export class DreamDepthEffectManager {
  constructor(scene, environmentRoot, camera, renderer) {
    this.scene = scene;
    this.root = environmentRoot || scene;
    this.camera = camera;
    this.renderer = renderer;

    this.palette = ATOMA_PALETTE;

    this.currentWeatherKey = 'calm';
    this.currentWorldEvent = null;
    this.focusTargets = [];
    this.lastPulseTime = 0;
    this.pulseQueue = [];

    this.screenState = {
      vignetteOpacity: 0,
      focusOpacity: 0,
      pulseOpacity: 0,
      glazeOpacity: 0,
      vignetteColor: new THREE.Color(ATOMA_PALETTE.voidDeep),
      pulseColor: new THREE.Color(ATOMA_PALETTE.cyan),
      glazeColor: new THREE.Color(ATOMA_PALETTE.mint)
    };

    this.vignetteLayer = this.createVignetteLayer();
    this.focusLayer = this.createFocusLayer();
    this.pulseLayer = this.createPulseLayer();
    this.glazeLayer = this.createGlazeLayer();

    this.layerContainer = new THREE.Group();
    this.layerContainer.name = 'dream-depth-layers';
    this.layerContainer.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_OVERLAY');
    this.root.add(this.layerContainer);

    this.layerContainer.add(this.vignetteLayer.mesh);
    this.layerContainer.add(this.focusLayer.mesh);
    this.layerContainer.add(this.pulseLayer.mesh);
    this.layerContainer.add(this.glazeLayer.mesh);

    this.effects = {
      vignette: { intensity: 0, target: 0.08 },
      focus:    { intensity: 0, target: 0 },
      pulse:    { intensity: 0, target: 0 },
      glaze:    { intensity: 0, target: 0.04 }
    };

    this.config = {
      transitionSpeed: 0.08,
      maxIntensity: 0.18,
      bloomStrength: 1.2,
      vignette: { opacity: 0.08, softness: 0.25, maxRadius: 0.7 },
      focus: { fadeInTime: 0.35, fadeOutTime: 0.35, contrastBoost: 0.04, backgroundFade: 0.06, vignetteIncrease: 0.02 },
      pulse: { minIntensity: 0.008, maxIntensity: 0.06, duration: 0.4, cooldown: 0.15, attackRatio: 0.2, crestRatio: 0.3, releaseRatio: 0.5 },
      glaze: { microBloom: 0.04, warmthTint: 0.015 },
      stabilityThreshold: 0.5,
      stabilityDamping: 0.3
    };

    this.time = 0;
    this.lastFrameTime = performance.now();
    this.cameraVelocity = new THREE.Vector3();
    this.lastCameraPos = camera.position.clone();
    this.currentFocus = null;
    this.focusTransition = 0;
    this.frameScheduler = null;
    this._fallbackMode = false;

    this.intensityScale = 1.0;
    this.lodLevel = 'HIGH';
  }

  setFrameScheduler(scheduler) {
    this.frameScheduler = scheduler || null;
    this._fallbackMode = !scheduler;
  }

  createVignetteLayer() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;

    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxR = Math.min(cx, cy) * 0.9;

    const gradient = ctx.createRadialGradient(cx, cy, maxR * 0.35, cx, cy, maxR);
    gradient.addColorStop(0, 'rgba(5,19,26,0)');
    gradient.addColorStop(0.5, 'rgba(5,19,26,0.06)');
    gradient.addColorStop(0.8, 'rgba(5,19,26,0.18)');
    gradient.addColorStop(1, 'rgba(5,19,26,0.45)');

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
    mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_OVERLAY');

    return { mesh, material, canvas, texture };
  }

  createFocusLayer() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;

    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const gradient = ctx.createRadialGradient(cx, cy, 15, cx, cy, 220);
    gradient.addColorStop(0, 'rgba(109,234,255,0.18)');
    gradient.addColorStop(0.35, 'rgba(119,247,219,0.08)');
    gradient.addColorStop(0.7, 'rgba(247,251,255,0.02)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

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
    mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_OVERLAY');

    return { mesh, material, canvas, texture };
  }

  createPulseLayer() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(cx, cy));
    gradient.addColorStop(0, 'rgba(109,234,255,0.35)');
    gradient.addColorStop(0.3, 'rgba(247,251,255,0.15)');
    gradient.addColorStop(1, 'rgba(109,234,255,0)');

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
    mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_OVERLAY');

    return { mesh, material, canvas, texture, scale: 1.0 };
  }

  createGlazeLayer() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(119,247,219,0.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(247,251,255,0.04)');
    gradient.addColorStop(0.5, 'rgba(109,234,255,0.02)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
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
    mesh.position.z = 0.08;
    mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_OVERLAY');

    return { mesh, material, canvas, texture };
  }

  update(deltaTime) {
    const dt = Math.max(0, deltaTime);
    const shouldRun = this.frameScheduler?.shouldRunSimulation?.();
    if (shouldRun === false) {
      if (!this._fallbackMode) return;
    }
    this.time += dt;

    this.updateCameraVelocity();
    const stability = this.getStabilityFactor();

    this.applyBaselineVignette(dt, stability);
    this.applyFocus(dt, stability);
    this.updatePulseQueue(dt);
    this.applyGlaze(dt, stability);
    this.applyWeatherModulation();
    this.composeToScreen();
  }

  applyBaselineVignette(dt, stability) {
    const target = this.config.vignette.opacity * stability * this.intensityScale;
    this.effects.vignette.target = target;
    this.effects.vignette.intensity += (this.effects.vignette.target - this.effects.vignette.intensity) * this.config.transitionSpeed;
    const opacity = Math.min(this.config.maxIntensity, this.effects.vignette.intensity);
    this.vignetteLayer.material.opacity = opacity;
    this.screenState.vignetteOpacity = opacity;
  }

  applyFocus(dt, stability) {
    this.autoFocusOnTarget(this.focusTargets);

    if (this.focusTransition > 0.01 && this.currentFocus) {
      const focusBoost = this.config.focus.contrastBoost * this.focusTransition;
      this.effects.focus.target = Math.min(0.22, focusBoost * stability * this.intensityScale);
    } else {
      this.effects.focus.target = 0;
    }

    this.effects.focus.intensity += (this.effects.focus.target - this.effects.focus.intensity) * this.config.transitionSpeed;
    const opacity = Math.min(this.config.maxIntensity * 0.6, this.effects.focus.intensity);
    this.focusLayer.material.opacity = opacity;
    this.screenState.focusOpacity = opacity;
  }

  applyGlaze(dt, stability) {
    const target = this.config.glaze.microBloom * stability * this.intensityScale;
    this.effects.glaze.target = target;
    this.effects.glaze.intensity += (this.effects.glaze.target - this.effects.glaze.intensity) * this.config.transitionSpeed;
    const opacity = Math.min(this.config.maxIntensity * 0.35, this.effects.glaze.intensity);
    this.glazeLayer.material.opacity = opacity;
    this.screenState.glazeOpacity = opacity;
  }

  composeToScreen() {
    const state = this.screenState;

    state.vignetteOpacity = Math.min(0.2, Math.max(0, state.vignetteOpacity));
    state.focusOpacity = Math.min(0.25, Math.max(0, state.focusOpacity));
    state.pulseOpacity = Math.min(0.3, Math.max(0, state.pulseOpacity));
    state.glazeOpacity = Math.min(0.15, Math.max(0, state.glazeOpacity));

    this.vignetteLayer.mesh.visible = state.vignetteOpacity > 0.001;
    this.focusLayer.mesh.visible = state.focusOpacity > 0.001;
    this.pulseLayer.mesh.visible = state.pulseOpacity > 0.001;
    this.glazeLayer.mesh.visible = state.glazeOpacity > 0.001;
  }

  updateCameraVelocity() {
    const currentPos = this.camera.position.clone();
    this.cameraVelocity.subVectors(currentPos, this.lastCameraPos);
    this.lastCameraPos.copy(currentPos);
  }

  getStabilityFactor() {
    const speed = this.cameraVelocity.length();
    if (speed < this.config.stabilityThreshold) return 1.0;
    const excess = speed - this.config.stabilityThreshold;
    return Math.max(0.3, 1.0 - excess * this.config.stabilityDamping);
  }

  setWeatherCondition(weatherKey) {
    const normalized = this.normalizeWeatherCondition(weatherKey);
    if (normalized && WEATHER_KEYS.has(normalized)) {
      this.currentWeatherKey = normalized;
    }
  }

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

  applyWeatherModulation() {
    const key = this.currentWeatherKey;
    const state = this.screenState;
    const colors = WEATHER_COLOR_MAP[key];
    if (!colors) return;

    switch (key) {
      case 'calm':
        state.vignetteColor.setHex(colors.vignette);
        state.pulseColor.setHex(colors.pulse);
        state.glazeColor.setHex(colors.glaze);
        this.effects.vignette.target = Math.max(this.effects.vignette.target, 0.05);
        break;

      case 'pressure':
        state.vignetteColor.setHex(colors.vignette);
        state.pulseColor.setHex(colors.pulse);
        state.glazeColor.setHex(colors.glaze);
        this.effects.vignette.target = Math.min(0.16, this.effects.vignette.target + 0.03);
        break;

      case 'resonance': {
        const breath = 0.5 + 0.5 * Math.sin(this.time * 1.8);
        state.vignetteColor.setHex(colors.vignette);
        state.pulseColor.setHex(colors.pulse);
        state.glazeColor.setHex(colors.glaze);
        this.effects.focus.target = Math.min(0.15, this.effects.focus.target + 0.02 * breath);
        break;
      }

      case 'stormBias':
        state.vignetteColor.setHex(colors.vignette);
        state.pulseColor.setHex(colors.pulse);
        state.glazeColor.setHex(colors.glaze);
        this.effects.vignette.target = Math.min(0.2, this.effects.vignette.target + 0.05);
        break;

      case 'ascensionHaze':
        state.vignetteColor.setHex(colors.vignette);
        state.pulseColor.setHex(colors.pulse);
        state.glazeColor.setHex(colors.glaze);
        this.effects.glaze.target = Math.min(0.12, this.effects.glaze.target + 0.04);
        break;
    }

    this.vignetteLayer.material.color.lerp(state.vignetteColor, 0.05);
    this.pulseLayer.material.color.lerp(state.pulseColor, 0.05);
    this.glazeLayer.material.color.lerp(state.glazeColor, 0.05);
  }

  setFocusTargets(targets) {
    this.focusTargets = Array.isArray(targets) ? targets : [];
  }

  autoFocusOnTarget(targets) {
    if (!targets || targets.length === 0) {
      this.focusTransition = Math.max(0, this.focusTransition - 0.05);
      this.currentFocus = null;
      return;
    }

    let bestTarget = null;
    let bestScore = -Infinity;
    const cameraPos = this.camera.position;

    for (const target of targets) {
      if (!target || !target.position) continue;

      const distance = cameraPos.distanceTo(target.position);
      const importance = typeof target.importance === 'number'
        ? target.importance
        : (typeof target.priority === 'number' ? target.priority : 0);
      const legendary = (target.legendary || target.isLegendary || target.legendary === true) ? 1 : 0;
      const stage = typeof target.stage === 'string'
        ? (STAGE_MAP[target.stage.toLowerCase()] ?? 0)
        : (typeof target.stage === 'number' ? Math.min(1, Math.max(0, target.stage / 10)) : 0);
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

  onWorldEvent(eventType) {
    const normalizedType = typeof eventType === 'string'
      ? eventType.toUpperCase()
      : (eventType?.type ? String(eventType.type).toUpperCase() : '');

    this.currentWorldEvent = normalizedType || eventType;

    if (PULSE_EVENTS.has(normalizedType) || PULSE_EVENT_PATTERNS.test(normalizedType)) {
      this.triggerPulse();
      return;
    }

    if (/EVENT|PHASE|SHIFT|BLOOM/.test(normalizedType)) {
      this.focusTransition = Math.min(1.0, this.focusTransition + 0.08);
    }
  }

  triggerPulse(duration) {
    const now = performance.now();
    const cfg = this.config.pulse;
    const queue = this.pulseQueue;
    const last = queue.length > 0 ? queue[queue.length - 1] : null;

    if (last && now - this.lastPulseTime < cfg.cooldown) {
      last.maxIntensity = Math.min(cfg.maxIntensity * 1.5, last.maxIntensity + cfg.maxIntensity * 0.35);
      last.elapsed = 0;
      this.lastPulseTime = now;
      return;
    }

    queue.push({
      elapsed: 0,
      duration: duration || cfg.duration,
      intensity: 0,
      maxIntensity: cfg.maxIntensity,
      startTime: now,
      attackRatio: cfg.attackRatio,
      crestRatio: cfg.crestRatio,
      releaseRatio: cfg.releaseRatio
    });

    this.lastPulseTime = now;
  }

  triggerDepthPulse() {
    this.triggerPulse();
  }

  updatePulseQueue(dt) {
    const queue = this.pulseQueue;
    let totalPulseEffect = 0;

    for (let i = queue.length - 1; i >= 0; i--) {
      const pulse = queue[i];
      pulse.elapsed += dt;

      const progress = pulse.elapsed / pulse.duration;
      if (progress >= 1) {
        queue.splice(i, 1);
        continue;
      }

      const { attackRatio, crestRatio } = pulse;
      const attackEnd = attackRatio;
      const crestEnd = attackRatio + crestRatio;

      let envelope;
      if (progress < attackEnd) {
        envelope = progress / attackEnd;
        envelope = envelope * envelope;
      } else if (progress < crestEnd) {
        envelope = 1.0;
      } else {
        const releaseProgress = (progress - crestEnd) / (1 - crestEnd);
        envelope = 1.0 - releaseProgress;
        envelope = envelope * envelope;
      }

      pulse.intensity = pulse.maxIntensity * envelope;
      totalPulseEffect += pulse.intensity;
    }

    const state = this.screenState;
    state.pulseOpacity = Math.min(0.3, totalPulseEffect * 0.9);
    this.effects.pulse.intensity = state.pulseOpacity;
    this.pulseLayer.material.opacity = state.pulseOpacity;
    this.pulseLayer.material.color.lerp(state.pulseColor, 0.08);
  }

  setVignette(value) {
    this.effects.vignette.target = Math.max(0, Math.min(1, value));
  }

  setFocus(value) {
    this.effects.focus.target = Math.max(0, Math.min(1, value));
  }

  setGlaze(value) {
    this.effects.glaze.target = Math.max(0, Math.min(1, value));
  }

  setIntensity(value) {
    this.intensityScale = Math.max(0, Math.min(1, value));
  }

  gatherFocusTargets(worldSystems) {
    const targets = [];

    if (worldSystems.aiNodes?.nodes) {
      for (const node of worldSystems.aiNodes.nodes) {
        if (node?.position) targets.push(node);
      }
    }

    if (worldSystems.legendaryRegistry?.nodes) {
      for (const nodeId in worldSystems.legendaryRegistry.nodes) {
        const node = worldSystems.legendaryRegistry.nodes[nodeId];
        if (node?.position) targets.push(node);
      }
    }

    if (worldSystems.colonies) {
      for (const colony of worldSystems.colonies) {
        if (colony?.center) targets.push({ position: colony.center });
      }
    }

    return targets;
  }

  getDebugInfo() {
    const state = this.screenState;
    return {
      role: 'rich-primary',
      enabled: true,
      currentWeatherKey: this.currentWeatherKey,
      currentWorldEvent: this.currentWorldEvent || 'none',
      currentFocus: this.currentFocus ? 'active' : 'none',
      focusTransition: parseFloat(this.focusTransition.toFixed(2)),
      pulseCount: this.pulseQueue.length,
      vignetteOpacity: parseFloat(state.vignetteOpacity.toFixed(3)),
      focusOpacity: parseFloat(state.focusOpacity.toFixed(3)),
      pulseOpacity: parseFloat(state.pulseOpacity.toFixed(3)),
      glazeOpacity: parseFloat(state.glazeOpacity.toFixed(3)),
      intensity: parseFloat(this.intensityScale.toFixed(2)),
      layerVisible: {
        vignette: this.vignetteLayer?.mesh?.visible ?? false,
        focus: this.focusLayer?.mesh?.visible ?? false,
        pulse: this.pulseLayer?.mesh?.visible ?? false,
        glaze: this.glazeLayer?.mesh?.visible ?? false
      },
      schedulerState: this.frameScheduler ? 'active' : (this._fallbackMode ? 'fallback' : 'missing'),
      stabilityFactor: parseFloat(this.getStabilityFactor().toFixed(2))
    };
  }

  cleanup() {
    const layers = [this.vignetteLayer, this.focusLayer, this.pulseLayer, this.glazeLayer];
    for (const layer of layers) {
      if (!layer) continue;
      if (layer.mesh?.geometry) layer.mesh.geometry.dispose();
      if (layer.material) layer.material.dispose();
      if (layer.texture) layer.texture.dispose();
      if (layer.canvas) {
        const ctx = layer.canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
      }
    }

    if (this.layerContainer) {
      this.layerContainer.clear();
      if (this.root && typeof this.root.remove === 'function') {
        this.root.remove(this.layerContainer);
      }
    }

    this.vignetteLayer = null;
    this.focusLayer = null;
    this.pulseLayer = null;
    this.glazeLayer = null;
    this.layerContainer = null;
    this.pulseQueue = [];
    this.currentFocus = null;
    this.focusTargets = [];
    this.currentWeatherKey = null;
    this.currentWorldEvent = null;
    this.lastPulseTime = 0;
    this.screenState = null;
    this.cameraVelocity = null;
    this.lastCameraPos = null;
  }
}
