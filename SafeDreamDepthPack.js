import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

/**
 * SafeDreamDepthPack.js - Low-Cost ATOMA Depth Fallback Layer
 *
 * SAFE: 100% non-destructive VFX overlays
 * - NO camera modifications
 * - NO shader changes
 * - NO physics alterations
 * - NO FOV changes
 * - NO rotation enforcement
 *
 * Only screen-space overlays, color modulation, and soft masking.
 *
 * Role split: this class remains a low-cost fallback depth layer.
 * Complex DOF orchestration belongs to DreamDepthEffectManager.
 *
 * Palette (shared with DreamDepthEffectManager):
 *   void deep   #05131A
 *   ATOMA cyan  #6DEAFF
 *   mint        #77F7DB
 *   ritual white #F7FBFF
 *   violet      #D07BFF
 *   rose        #FF73CF
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

export class SafeDreamDepthPack {
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

    this.vfxContainer = new THREE.Group();
    this.vfxContainer.name = 'dream-depth-vfx';
    this.vfxContainer.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_OVERLAY');
    this.root.add(this.vfxContainer);

    this.vignetteTexture = this.createVignetteMask();
    this.focusTexture = this.createFocusMask();

    this.screenState = {
      vignetteOpacity: 0,
      focusOpacity: 0,
      pulseOpacity: 0,
      glazeOpacity: 0,
      vignetteColor: new THREE.Color(ATOMA_PALETTE.voidDeep),
      pulseColor: new THREE.Color(ATOMA_PALETTE.cyan),
      glazeColor: new THREE.Color(ATOMA_PALETTE.mint)
    };

    this.screenLayers = {
      vignetteLayer: null,
      focusLayer: null,
      pulseLayer: null,
      glazeLayer: null
    };

    this.intensityScale = 1.0;

    this.setupOverlayQuad();

    this.isActive = true;
    this.currentFocus = null;
    this.focusTransition = 0;

    this.config = {
      vignette: { opacity: 0.08, softness: 0.25, maxRadius: 0.7 },
      desaturation: { background: 0.04, periphery: 0.06 },
      contrast: { centerBoost: 0.03, edgeDim: 0.02 },
      focus: { fadeInTime: 0.35, fadeOutTime: 0.35, contrastBoost: 0.04, backgroundFade: 0.06, vignetteIncrease: 0.02 },
      pulse: {
        minIntensity: 0.008,
        maxIntensity: 0.015,
        duration: 0.3,
        cooldown: 0.15,
        attackRatio: 0.2,
        crestRatio: 0.3,
        releaseRatio: 0.5
      },
      glaze: { microBloom: 0.04 },
      stabilityThreshold: 0.5,
      stabilityDamping: 0.3,
      transitionSpeed: 0.1
    };

    this.time = 0;
    this.lastFrameTime = performance.now();
    this.cameraVelocity = new THREE.Vector3();
    this.lastCameraPos = camera.position.clone();
    this._timeOrigin = undefined;
    this._lastVisualTime = undefined;

    this.lodLevel = 'HIGH';
    this.fpsTarget = 60;
  }

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
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false
    }));
    this.screenLayers.focusLayer.renderOrder = baseRenderOrder;
    this.screenLayers.focusLayer.position.z = 0.11;

    this.screenLayers.pulseLayer = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: ATOMA_PALETTE.cyan,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    this.screenLayers.pulseLayer.renderOrder = baseRenderOrder;
    this.screenLayers.pulseLayer.position.z = 0.12;

    this.screenLayers.glazeLayer = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: ATOMA_PALETTE.mint,
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

  createVignetteMask() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxRadius = Math.min(cx, cy);

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
    gradient.addColorStop(0, 'rgba(5,19,26,0)');
    gradient.addColorStop(0.45, 'rgba(5,19,26,0.04)');
    gradient.addColorStop(0.75, 'rgba(5,19,26,0.14)');
    gradient.addColorStop(1, 'rgba(5,19,26,0.4)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createFocusMask() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const gradient = ctx.createRadialGradient(cx, cy, 8, cx, cy, Math.min(cx, cy));
    gradient.addColorStop(0, 'rgba(109,234,255,0.15)');
    gradient.addColorStop(0.4, 'rgba(119,247,219,0.06)');
    gradient.addColorStop(0.7, 'rgba(247,251,255,0.015)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(cx, cy), 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
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

  applyBaselineDOF(deltaTime) {
    if (!this.screenLayers.vignetteLayer) return;

    const stability = this.getStabilityFactor();
    const state = this.screenState;
    const scale = this.intensityScale;
    const lerp = this.config.transitionSpeed;

    const targetVignette = this.config.vignette.opacity * stability * scale;
    state.vignetteOpacity += (targetVignette - state.vignetteOpacity) * lerp;
    this.screenLayers.vignetteLayer.material.opacity = state.vignetteOpacity;
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

  applyFocusEffect(deltaTime) {
    const state = this.screenState;

    if (!this.currentFocus || this.focusTransition < 0.01) {
      const targetFocus = 0;
      state.focusOpacity += (targetFocus - state.focusOpacity) * this.config.transitionSpeed;
      if (this.screenLayers.focusLayer) {
        this.screenLayers.focusLayer.material.opacity = state.focusOpacity;
      }
      return;
    }

    if (!this.screenLayers.focusLayer) return;

    const t = this.focusTransition;
    const stability = this.getStabilityFactor();
    const scale = this.intensityScale;

    const focusTarget = Math.min(0.18, this.config.focus.contrastBoost * t * stability * scale * 2.5);
    state.focusOpacity += (focusTarget - state.focusOpacity) * this.config.transitionSpeed;
    state.focusOpacity = Math.min(0.2, Math.max(0, state.focusOpacity));

    const vignetteRelax = state.vignetteOpacity * (1 - t * 0.15);
    state.vignetteOpacity = vignetteRelax;

    this.screenLayers.focusLayer.material.opacity = state.focusOpacity;
  }

  triggerDepthPulse() {
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
      duration: cfg.duration,
      intensity: 0,
      maxIntensity: cfg.maxIntensity,
      startTime: now,
      attackRatio: cfg.attackRatio,
      crestRatio: cfg.crestRatio
    });

    this.lastPulseTime = now;
  }

  triggerPulse() {
    this.triggerDepthPulse();
  }

  updateDepthPulses(deltaTime) {
    const state = this.screenState;
    const queue = this.pulseQueue;
    let totalPulseEffect = 0;

    for (let i = queue.length - 1; i >= 0; i--) {
      const pulse = queue[i];
      pulse.elapsed += deltaTime;

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

    state.pulseOpacity = Math.min(0.24, totalPulseEffect * 0.9);

    if (this.screenLayers.pulseLayer) {
      this.screenLayers.pulseLayer.material.opacity = state.pulseOpacity;
      this.screenLayers.pulseLayer.material.color.lerp(state.pulseColor, 0.08);
    }
  }

  applyDreamGlaze(deltaTime) {
    if (!this.screenLayers.glazeLayer) return;

    const state = this.screenState;
    const stability = this.getStabilityFactor();
    const scale = this.intensityScale;

    const targetGlaze = this.config.glaze.microBloom * stability * scale;
    state.glazeOpacity += (targetGlaze - state.glazeOpacity) * 0.05;

    this.screenLayers.glazeLayer.material.opacity = state.glazeOpacity;
    this.screenLayers.glazeLayer.material.color.lerp(state.glazeColor, 0.04);
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

  normalizeWeatherKey(weatherCondition) {
    return this.normalizeWeatherCondition(weatherCondition);
  }

  setWeatherCondition(weatherKey) {
    const normalized = this.normalizeWeatherCondition(weatherKey);
    if (normalized && WEATHER_KEYS.has(normalized)) {
      this.currentWeatherKey = normalized;
    }
  }

  setFocusTargets(targets) {
    this.focusTargets = Array.isArray(targets) ? targets : [];
  }

  applyWeatherEffects(weatherCondition) {
    const normalizedWeather = this.normalizeWeatherCondition(weatherCondition);
    const state = this.screenState;
    if (!state || !normalizedWeather) return;

    this.currentWeatherKey = normalizedWeather;
    const colors = WEATHER_COLOR_MAP[normalizedWeather];
    if (!colors) return;

    switch (normalizedWeather) {
      case 'calm':
        state.vignetteColor.setHex(colors.vignette);
        state.pulseColor.setHex(colors.pulse);
        state.glazeColor.setHex(colors.glaze);
        break;

      case 'pressure':
        state.vignetteColor.setHex(colors.vignette);
        state.pulseColor.setHex(colors.pulse);
        state.glazeColor.setHex(colors.glaze);
        state.vignetteOpacity = Math.min(0.14, state.vignetteOpacity + 0.01);
        break;

      case 'resonance': {
        const breath = 0.5 + 0.5 * Math.sin(this.time * 1.8);
        state.vignetteColor.setHex(colors.vignette);
        state.pulseColor.setHex(colors.pulse);
        state.glazeColor.setHex(colors.glaze);
        state.focusOpacity = Math.min(0.14, state.focusOpacity + 0.01 * breath);
        break;
      }

      case 'stormBias':
        state.vignetteColor.setHex(colors.vignette);
        state.pulseColor.setHex(colors.pulse);
        state.glazeColor.setHex(colors.glaze);
        state.vignetteOpacity = Math.min(0.16, state.vignetteOpacity + 0.02);
        state.pulseOpacity = Math.min(0.2, state.pulseOpacity + 0.01);
        break;

      case 'ascensionHaze':
        state.vignetteColor.setHex(colors.vignette);
        state.pulseColor.setHex(colors.pulse);
        state.glazeColor.setHex(colors.glaze);
        state.glazeOpacity = Math.min(0.1, state.glazeOpacity + 0.015);
        break;

      default:
        break;
    }

    if (this.screenLayers.vignetteLayer) {
      this.screenLayers.vignetteLayer.material.color.lerp(state.vignetteColor, 0.04);
    }
    if (this.screenLayers.pulseLayer) {
      this.screenLayers.pulseLayer.material.color.lerp(state.pulseColor, 0.04);
    }
    if (this.screenLayers.glazeLayer) {
      this.screenLayers.glazeLayer.material.color.lerp(state.glazeColor, 0.04);
    }
  }

  applyEffectsToScreen(deltaTime) {
    if (!this.screenLayers.vignetteLayer) return;

    const state = this.screenState;

    state.vignetteOpacity = Math.min(0.15, Math.max(0, state.vignetteOpacity));
    state.focusOpacity = Math.min(0.2, Math.max(0, state.focusOpacity));
    state.pulseOpacity = Math.min(0.25, Math.max(0, state.pulseOpacity));
    state.glazeOpacity = Math.min(0.12, Math.max(0, state.glazeOpacity));

    this.screenLayers.vignetteLayer.material.opacity = state.vignetteOpacity;
    this.screenLayers.focusLayer.material.opacity = state.focusOpacity;
    this.screenLayers.pulseLayer.material.opacity = state.pulseOpacity;
    this.screenLayers.glazeLayer.material.opacity = state.glazeOpacity;

    this.screenLayers.vignetteLayer.visible = state.vignetteOpacity > 0.001;
    this.screenLayers.focusLayer.visible = state.focusOpacity > 0.001;
    this.screenLayers.pulseLayer.visible = state.pulseOpacity > 0.001;
    this.screenLayers.glazeLayer.visible = state.glazeOpacity > 0.001;
  }

  enforceCameraStability() {
    if (Math.abs(this.camera.rotation.z) > 0.01) {
      const rollAmount = Math.abs(this.camera.rotation.z);
      const damping = Math.max(0.5, 1.0 - rollAmount);
      if (this.screenState) {
        this.screenState.vignetteOpacity *= damping;
      }
    }
  }

  update(deltaTime, worldSystems) {
    if (this._timeOrigin === undefined) {
      this._timeOrigin = VisualTime.now;
    }
    const currentTime = VisualTime.now - this._timeOrigin;
    const visualDelta = this._lastVisualTime === undefined
      ? 0
      : Math.max(0, currentTime - this._lastVisualTime);
    this._lastVisualTime = currentTime;
    this.time = currentTime;
    this.lastFrameTime = visualDelta;

    this.updateCameraVelocity();

    this.applyBaselineDOF(visualDelta);

    if (worldSystems) {
      const targets = this.gatherFocusTargets(worldSystems);
      this.focusTargets = targets;
      this.autoFocusOnTarget(targets);
    }

    this.applyFocusEffect(visualDelta);

    this.updateDepthPulses(visualDelta);

    this.applyDreamGlaze(visualDelta);

    if (worldSystems && worldSystems.weatherRegistry) {
      const weather = worldSystems.weatherRegistry.currentWeather;
      this.applyWeatherEffects(weather);
    }

    this.applyEffectsToScreen(visualDelta);

    this.enforceCameraStability();
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

  onSynergySpike() {
    this.triggerDepthPulse();
  }

  onLegendaryLinkActivated() {
    this.triggerDepthPulse();
  }

  onWorldEvent(eventType) {
    const normalizedType = typeof eventType === 'string'
      ? eventType.toUpperCase()
      : (eventType?.type ? String(eventType.type).toUpperCase() : '');

    this.currentWorldEvent = normalizedType || eventType;

    if (PULSE_EVENTS.has(normalizedType) || PULSE_EVENT_PATTERNS.test(normalizedType)) {
      this.triggerDepthPulse();
      return;
    }

    if (/EVENT|PHASE|SHIFT|BLOOM/.test(normalizedType)) {
      this.focusTransition = Math.min(1.0, this.focusTransition + 0.08);
    }
  }

  setIntensity(value) {
    this.intensityScale = Math.max(0, Math.min(1, value));
  }

  setActive(active) {
    this.isActive = active;
    if (this.screenLayers.vignetteLayer) {
      this.screenLayers.vignetteLayer.visible = active;
      this.screenLayers.focusLayer.visible = active;
      this.screenLayers.pulseLayer.visible = active;
      this.screenLayers.glazeLayer.visible = active;
    }
  }

  getDebugInfo() {
    const state = this.screenState;
    return {
      role: 'low-cost-fallback',
      enabled: this.isActive,
      currentWeatherKey: this.currentWeatherKey,
      currentWorldEvent: this.currentWorldEvent || 'none',
      currentFocus: this.currentFocus ? 'active' : 'none',
      focusTransition: parseFloat(this.focusTransition.toFixed(2)),
      pulseCount: this.pulseQueue.length,
      vignetteOpacity: parseFloat((state?.vignetteOpacity ?? 0).toFixed(3)),
      focusOpacity: parseFloat((state?.focusOpacity ?? 0).toFixed(3)),
      pulseOpacity: parseFloat((state?.pulseOpacity ?? 0).toFixed(3)),
      glazeOpacity: parseFloat((state?.glazeOpacity ?? 0).toFixed(3)),
      intensity: parseFloat(this.intensityScale.toFixed(2)),
      layerVisible: {
        vignette: this.screenLayers.vignetteLayer?.visible ?? false,
        focus: this.screenLayers.focusLayer?.visible ?? false,
        pulse: this.screenLayers.pulseLayer?.visible ?? false,
        glaze: this.screenLayers.glazeLayer?.visible ?? false
      },
      schedulerState: 'none',
      stabilityFactor: parseFloat(this.getStabilityFactor().toFixed(2))
    };
  }

  cleanup() {
    for (const layer of Object.values(this.screenLayers)) {
      if (layer) {
        layer.material.dispose();
      }
    }
    this.screenLayers = { vignetteLayer: null, focusLayer: null, pulseLayer: null, glazeLayer: null };

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
      this.vfxContainer.clear();
      if (this.root && typeof this.root.remove === 'function') {
        this.root.remove(this.vfxContainer);
      }
      this.vfxContainer = null;
    }

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
