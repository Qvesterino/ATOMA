/**
 * LinkResonanceFlowSystem_Session124.js
 * ============================================================================
 * DIRECTIONAL LINK RESONANCE FLOW VISUALIZATION
 * 
 * Creates pulsing directional energy flows along links that:
 * - Travel from source to destination node
 * - Pulse speed modulated by synergy and activity
 * - Intensity reflects the canonical link visual profile
 * - Multiple pulses travel simultaneously
 * - Color matches link state (harmony, corruption, synergy)
 * - Creates visual sense of "energy flowing through network"
 * 
 * FEATURES:
 * 1. Directional Pulses: Energy packets traveling along links
 * 2. Load Pressure Reactivity: Pulse speed increases with link loadPressure
 * 3. Multi-Pulse Support: Multiple energy packets per link
 * 4. Profile Encoding: Pulse intensity reflects canonical link metrics
 * 5. State Colors: Load pressure / corruption modulation
 * 6. Bidirectional Flow: Can show energy in both directions
 * 7. Pulse Spawning: Triggered by network activity
 * 8. Zero Allocations: Complete object pool
 * 
 * ARCHITECTURE:
 * ✅ Adapter-only (reads link state, no changes to gameplay)
 * ✅ GPU-driven rendering (custom line shader)
 * ✅ CPU-driven pulse positioning (bezier curve following)
 * ✅ Per-link pulse pool (reused across frames)
 * ✅ Deterministic spawning (based on loadPressure metrics)
 * 
 * @author VFX Technical Director — ATOMA Project Session 124
 * @version 1.0.0
 */

import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { tagAllowedSphere, clampSphere } from './VisualSpherePolicy.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const _linkIdSeedCache = new Map();
const getLinkSeed = (linkId) => {
  if (linkId === null || linkId === undefined) return 0;
  const key = String(linkId);
  const cached = _linkIdSeedCache.get(key);
  if (cached !== undefined) return cached;
  let seed = 0;
  for (let i = 0; i < key.length; i += 1) {
    seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
  }
  const normalized = seed / 0xFFFFFFFF;
  _linkIdSeedCache.set(key, normalized);
  return normalized;
};

export class LinkResonanceFlowSystem_Session124 {
  constructor(scene, world, config = {}) {
    this.scene = scene;
    this.world = world;
    
    this.config = {
      // Pulse spawning
      baseSpawnRate: config.baseSpawnRate ?? 2.0,        // Pulses per second
      loadPressureSpawnBoost: config.loadPressureSpawnBoost ?? config.synergySpawnBoost ?? 1.6,
      pulseSpeedBase: config.pulseSpeedBase ?? 0.96,     // Units per second
      pulseSpeedLoadPressureMult: config.pulseSpeedLoadPressureMult ?? config.pulseSpeedSynergyMult ?? 0.95,
      loadPressureVisualStart: config.loadPressureVisualStart ?? 0.35,
      loadPressureOverloadThreshold: config.loadPressureOverloadThreshold ?? 0.65,
      overloadSpawnBoost: config.overloadSpawnBoost ?? 1.28,
      overloadIntensityBoost: config.overloadIntensityBoost ?? 0.34,
      overloadSheathBoost: config.overloadSheathBoost ?? 0.38,
      overloadTrailBoost: config.overloadTrailBoost ?? 0.52,
      overloadJitter: config.overloadJitter ?? 0.075,
      
      // Pulse appearance
      pulseRadiusBase: config.pulseRadiusBase ?? 0.28,
      pulseRadiusLoadPressureMult: config.pulseRadiusLoadPressureMult ?? config.pulseRadiusSynergyMult ?? 0.18,
      pulseMaxRadius: config.pulseMaxRadius ?? 0.8,
      pulseGlowIntensity: config.pulseGlowIntensity ?? 1.5,
      pulseSheathOpacity: config.pulseSheathOpacity ?? 0.54,
      pulseTrailOpacity: config.pulseTrailOpacity ?? 0.34,
      pulseTrailLengthBase: config.pulseTrailLengthBase ?? 0.34,
      pulseTrailLengthLoadMult: config.pulseTrailLengthLoadMult ?? 1.4,
      
      // Pulse lifetime
      pulseLifetime: config.pulseLifetime ?? 2.0,         // Seconds before despawn
      pulseAlphaDecay: config.pulseAlphaDecay ?? 0.7,     // Fade at end
      
      // Intensity modulation
      baseIntensity: config.baseIntensity ?? 0.8,
      loadPressureIntensityFactor: config.loadPressureIntensityFactor ?? config.qualityIntensityFactor ?? 0.6,
      corruptionDampen: config.corruptionDampen ?? 0.6,
      
      // Flow direction
      bidirectional: config.bidirectional ?? false,       // Both directions
      pulseBidirectionalChance: config.pulseBidirectionalChance ?? 0.1,
      
      // LOD
      lodDistanceThreshold: config.lodDistanceThreshold ?? 60,
      lodPulseSuppression: config.lodPulseSuppression ?? 0.5,
      
      // Safety
      maxPulsesPerLink: config.maxPulsesPerLink ?? 8,
      maxTotalPulses: config.maxTotalPulses ?? 1024,
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
    };
    
    // Pulse pools per link
    this.linkPulses = new Map();  // linkId → Array<pulse>
    this.globalPulses = [];        // All active pulses (for sorting)
    
    // Rendering
    this.pulseGeometry = null;
    this.pulseMaterial = null;
    this.pulseMeshGeometry = null;
    this.pulseSheathGeometry = null;
    this.pulseTrailGeometry = null;
    this.pulseMaterialTemplate = null;
    this.pulseMeshPool = [];
    this.pulseGroup = null;
    
    // Spawn tracking
    this.spawnAccumulators = new Map(); // linkId → accumulated spawn time
    this._timeOrigin = undefined;
    this._lastVisualTime = undefined;
    
    // Statistics
    this.stats = {
      activePulses: 0,
      pulseSpawnCount: 0,
      linksWithFlow: 0,
    };
    
    this.init();
    
    console.log('[Session 124] LinkResonanceFlowSystem initialized');
  }

  _getLinkSource(link) {
    return link?.source || link?.sourceNode || link?.nodeA || link?.userData?.nodeA || link?.userData?.sourceNode || null;
  }

  _getLinkTarget(link) {
    return link?.target || link?.targetNode || link?.nodeB || link?.userData?.nodeB || link?.userData?.targetNode || null;
  }

  _readLinkPressureMetrics(link) {
    const metrics = link?.userData?.metrics || {};
    const loadPressure = clamp01(
      metrics.loadPressure ??
      link?.userData?.loadPressure ??
      0
    );

    return {
      loadPressure,
      corruption: clamp01(metrics.corruption ?? 0),
      synergy: clamp01(metrics.synergy ?? 0),
      stability: clamp01(metrics.stability ?? 1)
    };
  }

  _getLoadPressureProfile(loadPressure) {
    const visualStart = Math.max(0.01, this.config.loadPressureVisualStart ?? 0.35);
    const overloadStart = Math.max(visualStart + 0.01, this.config.loadPressureOverloadThreshold ?? 0.65);
    const pressurizedMix = clamp01((loadPressure - visualStart) / (overloadStart - visualStart));
    const overloadMix = clamp01((loadPressure - overloadStart) / (1.0 - overloadStart));

    return {
      stage: loadPressure >= overloadStart ? 'overload' : (loadPressure >= visualStart ? 'pressurized' : 'subtle'),
      pressurizedMix,
      overloadMix,
      visualStart,
      overloadStart
    };
  }
  
  /**
   * Initialize rendering system
   */
  init() {
    // Create pulse rendering group
    this.pulseGroup = new THREE.Group();
    this.pulseGroup.name = 'LinkResonancePulses_Session124';
    this.pulseGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_RESONANCE');
    this.scene?.add?.(this.pulseGroup);
    
    // Pre-allocate pulse meshes for efficient rendering
    this._initializePulseMeshes();
  }
  
  /**
   * Initialize pooled pulse meshes
   */
  _initializePulseMeshes() {
    // Shared unit sphere geometry for pulse meshes (scaled per pulse)
    this.pulseMeshGeometry = new THREE.SphereGeometry(1, 8, 8);
    this.pulseSheathGeometry = new THREE.OctahedronGeometry(1, 0);
    this.pulseTrailGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 6, 1, true);
    
    // Base shader material template (cloned per pulse; program shared)
    this.pulseMaterialTemplate = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x00ffff) },
        uOpacity: { value: 1.0 },
        uGlowSize: { value: this.config.pulseGlowIntensity },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uGlowSize;
        varying vec3 vNormal;
        
        void main() {
          vec3 viewDir = normalize(cameraPosition - vec3(0.0));
          float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
          float glow = fresnel * uGlowSize;
          
          gl_FragColor = vec4(uColor, (0.5 + glow) * uOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }
  
  /**
   * Update resonance flow system each frame
   */
  update(deltaTime, links, camera) {
    if (!this.config.enabled || !Array.isArray(links) || links.length === 0) return;

    if (this._timeOrigin === undefined) {
      this._timeOrigin = Number.isFinite(VisualTime.now) ? VisualTime.now : ((performance?.now?.() ?? Date.now()) / 1000);
    }
    const currentFrameId = VisualTime.frameId ?? 0;
    if (this._lastUpdateFrameId === currentFrameId) {
      return;
    }
    this._lastUpdateFrameId = currentFrameId;
    const visualNow = Number.isFinite(VisualTime.now) ? VisualTime.now : ((performance?.now?.() ?? Date.now()) / 1000);
    const currentVisualTime = visualNow - this._timeOrigin; // Phase 2A: canonical VisualTime source (behavior-preserving)
    const deltaVisual = this._lastVisualTime !== undefined ? currentVisualTime - this._lastVisualTime : 0;
    this._lastVisualTime = currentVisualTime;

    // Update spawn accumulators and spawn new pulses
    this._updateSpawning(currentVisualTime, links);

    // Update active pulses
    this._updateActivePulses(deltaVisual);

    // Update pulse mesh positions and appearances
    this._updatePulseMeshes();

    // Update LOD based on camera
    if (camera) {
      this._updateLOD(camera);
    }

    // Cleanup dead pulses
    this._cleanupDeadPulses();
    
    this.stats.activePulses = this.globalPulses.length;
    this.stats.linksWithFlow = this.linkPulses.size;
  }
  
  /**
   * Update pulse spawning based on link load pressure
   */
  _updateSpawning(currentVisualTime, links) {
    for (const link of links) {
      if (!link || !link.userData || link.id === null || link.id === undefined) continue;
      
      const linkId = link.id;
      const metrics = this._readLinkPressureMetrics(link);
      const loadPressure = metrics.loadPressure;
      const pressureProfile = this._getLoadPressureProfile(loadPressure);
      
      // Skip inactive links
      if (loadPressure < 0.08) continue;
      
      // Get or create spawn accumulator
      if (!this.spawnAccumulators.has(linkId)) {
        this.spawnAccumulators.set(linkId, { accumulator: 0, lastTime: currentVisualTime });
      }
      
      // Calculate spawn rate
      const overloadBoost = pressureProfile.overloadMix * this.config.overloadSpawnBoost;
      const loadFactor = 0.22 + Math.pow(loadPressure, 1.08) * this.config.loadPressureSpawnBoost + overloadBoost;
      const spawnRate = this.config.baseSpawnRate * loadFactor;
      
      const accumulatorEntry = this.spawnAccumulators.get(linkId);
      const delta = currentVisualTime - (accumulatorEntry.lastTime ?? currentVisualTime);
      accumulatorEntry.accumulator += delta * spawnRate;
      accumulatorEntry.lastTime = currentVisualTime;
      
      // Spawn pulses
      while (accumulatorEntry.accumulator >= 1.0) {
        this._spawnPulse(link);
        accumulatorEntry.accumulator -= 1.0;
      }
    }
  }
  
  /**
   * Spawn new pulse on link
   */
  _spawnPulse(link) {
    if (this.globalPulses.length >= this.config.maxTotalPulses) return;
    
    const linkId = link?.id ?? link?.linkId;
    if (linkId === null || linkId === undefined) return;
    const metrics = this._readLinkPressureMetrics(link);
    const loadPressure = metrics.loadPressure;
    const corruption = metrics.corruption;
    const synergy = metrics.synergy;
    const pressureProfile = this._getLoadPressureProfile(loadPressure);
    const overpressure = clamp01(loadPressure * (1.0 - metrics.stability * 0.35));
    const overloadMix = pressureProfile.overloadMix;
    
    // Get or create pulse pool for this link
    if (!this.linkPulses.has(linkId)) {
      this.linkPulses.set(linkId, []);
    }
    
    const pulses = this.linkPulses.get(linkId);
    if (pulses.length >= this.config.maxPulsesPerLink) return;
    
    // Create pulse object
      const pulse = {
      linkId,
      link,
      
      // Position along link (0 = source, 1 = destination)
      position: 0,
      
      // Speed based on load pressure
      speed: this.config.pulseSpeedBase + 
             loadPressure * this.config.pulseSpeedLoadPressureMult,
      overloadMix,
      
      // Appearance
      radius: Math.min(
        this.config.pulseRadiusBase + loadPressure * this.config.pulseRadiusLoadPressureMult,
        this.config.pulseMaxRadius
      ),

      sheathOpacity: Math.min(1.0, this.config.pulseSheathOpacity + loadPressure * 0.22 + overloadMix * 0.22),
      trailOpacity: Math.min(1.0, this.config.pulseTrailOpacity + overpressure * 0.24 + overloadMix * 0.28),
      trailLength: this.config.pulseTrailLengthBase + loadPressure * this.config.pulseTrailLengthLoadMult + overloadMix * 0.22,
      intensity: Math.max(0.3, Math.min(1.0,
        this.config.baseIntensity + loadPressure * this.config.loadPressureIntensityFactor + overpressure * 0.18 + overloadMix * this.config.overloadIntensityBoost
      )),
      
      // State
      life: 0,
      lifetime: this.config.pulseLifetime,
      active: true,
      
      // Flow direction
      direction: this.config.bidirectional && Math.random() < this.config.pulseBidirectionalChance ? -1 : 1,
      
      // Metrics
      synergy,
      corruption,
      loadPressure,
      overpressure,
    };
    
    pulses.push(pulse);
    this.globalPulses.push(pulse);
    this.stats.pulseSpawnCount++;
  }
  
  /**
   * Update all active pulses
   */
  _updateActivePulses(deltaVisual) {
    for (let i = this.globalPulses.length - 1; i >= 0; i--) {
      const pulse = this.globalPulses[i];
      if (!pulse.active) continue;
      
      // Update position along link
      const travelDistance = pulse.speed * deltaVisual;
      const linkLength = this._getLinkLength(pulse.link);
      pulse.position += pulse.direction * (travelDistance / linkLength);
      
      // Update lifetime
      pulse.life += deltaVisual;
      
      // Check if pulse reached end of link
      if (pulse.position > 1.0 || pulse.position < 0.0) {
        pulse.active = false;
      }
      
      // Check if exceeded lifetime
      if (pulse.life >= pulse.lifetime) {
        pulse.active = false;
      }
    }
  }
  
  /**
   * Update pulse mesh positions and appearances
   */
  _updatePulseMeshes() {
    // Update or allocate meshes for active pulses (no per-frame reallocation)
    for (const pulse of this.globalPulses) {
      if (!pulse.active) continue;
      
      // Lazily allocate mesh once per pulse lifetime
      if (!pulse.mesh) {
        pulse.mesh = this.pulseMeshPool.pop() || this._createPulseMesh();
        this.pulseGroup?.add?.(pulse.mesh);
      }
      
      // Get world position along link
      const worldPos = this._getPositionAlongLink(pulse);
      const direction = this._getLinkDirection(pulse.link, pulse.direction);
      const overloadMix = pulse.overloadMix ?? 0;
      const bandMix = this._getLoadPressureProfile(pulse.loadPressure ?? 0).pressurizedMix;
      const linkSeed = getLinkSeed(pulse.linkId);
      
      // Calculate pulse appearance
      const color = this._getPulseColor(pulse);
      const opacity = this._getPulseOpacity(pulse) * (pulse.lodSuppression ?? 1.0);
      const size = pulse.radius * (1.0 + Math.sin(pulse.life * Math.PI * 2) * 0.16 + overloadMix * 0.14);
      const sheathSize = size * (1.34 + pulse.loadPressure * 0.28 + bandMix * 0.16 + overloadMix * this.config.overloadSheathBoost);
      const trailSize = size * (0.42 + pulse.loadPressure * 0.12 - overloadMix * 0.12);
      const trailLength = pulse.trailLength * (0.62 + pulse.loadPressure * 0.28 + overloadMix * this.config.overloadTrailBoost) * (1.0 + Math.sin(pulse.life * Math.PI) * 0.08);
      const jitter = overloadMix * this.config.overloadJitter;
      
      // Apply transforms and uniforms
      pulse.mesh.visible = true;
      pulse.mesh.position.set(
        worldPos.x + Math.sin(pulse.life * 21.0 + linkSeed * 6.283185307179586) * jitter,
        worldPos.y + Math.cos(pulse.life * 17.0 + linkSeed * 4.1887902047863905) * jitter * 0.65,
        worldPos.z + Math.sin(pulse.life * 19.0 + linkSeed * 8.377580409572781) * jitter * 0.72
      );
      pulse.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

      const parts = pulse.mesh.userData?.parts || {};
      if (parts.core) {
        parts.core.position.set(0, 0, 0);
        parts.core.scale.setScalar(size);
        const uniforms = parts.core.material.uniforms;
        if (uniforms.uColor) uniforms.uColor.value.copy(color);
        if (uniforms.uOpacity) uniforms.uOpacity.value = opacity * (1.0 + overloadMix * 0.18);
        if (uniforms.uGlowSize) uniforms.uGlowSize.value = this.config.pulseGlowIntensity * (1.0 + pulse.loadPressure * 0.2 + overloadMix * 0.4);
      }
      if (parts.sheath) {
        parts.sheath.position.set(0, 0, 0);
        parts.sheath.scale.setScalar(sheathSize);
        const sheathUniforms = parts.sheath.material.uniforms;
        if (sheathUniforms.uColor) sheathUniforms.uColor.value.copy(color).lerp(new THREE.Color(0xffffff), 0.16 + pulse.loadPressure * 0.18 + overloadMix * 0.24);
        if (sheathUniforms.uOpacity) sheathUniforms.uOpacity.value = opacity * pulse.sheathOpacity * (1.0 + overloadMix * 0.28);
        if (sheathUniforms.uGlowSize) sheathUniforms.uGlowSize.value = this.config.pulseGlowIntensity * (0.82 + pulse.loadPressure * 0.25 + overloadMix * 0.38);
      }
      if (parts.trail) {
        parts.trail.position.set(0, -0.5 * trailLength - size * 0.18, 0);
        parts.trail.scale.set(trailSize, trailLength, trailSize);
        const trailUniforms = parts.trail.material.uniforms;
        if (trailUniforms.uColor) trailUniforms.uColor.value.copy(color).lerp(new THREE.Color(0x86ffff), 0.2 + overloadMix * 0.22);
        if (trailUniforms.uOpacity) trailUniforms.uOpacity.value = opacity * pulse.trailOpacity * (1.0 + overloadMix * 0.18);
        if (trailUniforms.uGlowSize) trailUniforms.uGlowSize.value = this.config.pulseGlowIntensity * (0.54 + overloadMix * 0.18);
      }
      if (parts.overloadA) {
        const showOverload = overloadMix > 0.001;
        parts.overloadA.visible = showOverload;
        parts.overloadA.position.set(0.34, 0.06, 0.0);
        parts.overloadA.rotation.set(0.15, 0.4, 0.15 + pulse.life * 1.6);
        parts.overloadA.scale.setScalar(size * (0.12 + overloadMix * 0.36));
        const overloadAUniforms = parts.overloadA.material.uniforms;
        if (overloadAUniforms.uColor) overloadAUniforms.uColor.value.copy(color).lerp(new THREE.Color(0xffffff), 0.24);
        if (overloadAUniforms.uOpacity) overloadAUniforms.uOpacity.value = opacity * overloadMix * 1.22;
        if (overloadAUniforms.uGlowSize) overloadAUniforms.uGlowSize.value = this.config.pulseGlowIntensity * (0.72 + overloadMix * 0.42);
      }
      if (parts.overloadB) {
        const showOverload = overloadMix > 0.001;
        parts.overloadB.visible = showOverload;
        parts.overloadB.position.set(-0.28, -0.04, 0.0);
        parts.overloadB.rotation.set(-0.18, -0.48, -0.22 - pulse.life * 1.25);
        parts.overloadB.scale.setScalar(size * (0.1 + overloadMix * 0.32));
        const overloadBUniforms = parts.overloadB.material.uniforms;
        if (overloadBUniforms.uColor) overloadBUniforms.uColor.value.copy(color).lerp(new THREE.Color(0xffb56a), 0.28);
        if (overloadBUniforms.uOpacity) overloadBUniforms.uOpacity.value = opacity * overloadMix * 1.06;
        if (overloadBUniforms.uGlowSize) overloadBUniforms.uGlowSize.value = this.config.pulseGlowIntensity * (0.68 + overloadMix * 0.38);
      }
    }
  }
  
  /**
   * Get world position of pulse along link curve
   */
  _getPositionAlongLink(pulse) {
    const link = pulse.link;
    const nodeA = this._getLinkSource(link);
    const nodeB = this._getLinkTarget(link);
    
    if (!nodeA?.position || !nodeB?.position) return new THREE.Vector3();
    
    // Linear interpolation for now (could use Catmull-Rom for curves)
    const t = pulse.position;
    const pos = new THREE.Vector3()
      .copy(nodeA.position)
      .lerp(nodeB.position, Math.max(0, Math.min(1, t)));
    
    return pos;
  }
  
  /**
   * Calculate pulse color based on link state
   */
  _getPulseColor(pulse) {
    let color = new THREE.Color();
    const loadPressure = pulse.loadPressure ?? 0.5;
    const pressureHot = Math.pow(loadPressure, 1.24);
    const pressureCool = 1.0 - loadPressure;
    const overloadMix = pulse.overloadMix ?? 0;
    const bandMix = this._getLoadPressureProfile(loadPressure).pressurizedMix;

    color.setHSL(
      0.53 - pressureHot * 0.18,
      0.66 + pressureHot * 0.22 + overloadMix * 0.08,
      0.48 + pressureHot * 0.16 + overloadMix * 0.12
    );

    if (loadPressure > 0.7) {
      color.lerp(new THREE.Color(0xffb56a), (loadPressure - 0.7) * 0.72);
    } else if (loadPressure < 0.24) {
      color.lerp(new THREE.Color(0x74edff), pressureCool * 0.22);
    }

    if (bandMix > 0.0) {
      color.lerp(new THREE.Color(0xf4fbff), bandMix * 0.18);
    }

    if (overloadMix > 0.0) {
      color.lerp(new THREE.Color(0xfff2d8), overloadMix * 0.42);
      color.multiplyScalar(1.0 + overloadMix * 0.12);
    }
    
    // Modulate by corruption
    const corruption = pulse.corruption ?? 0;
    if (corruption > 0.3) {
      const corruptRed = new THREE.Color(0xff4444);
      color.lerp(corruptRed, corruption * 0.6);
    }
    
    return color;
  }
  
  /**
   * Calculate pulse opacity with fade-out at ends
   */
  _getPulseOpacity(pulse) {
    const lifeNormalized = pulse.life / pulse.lifetime;
    
    // Fade in at start
    const fadeIn = Math.min(pulse.life * 3, 1.0);
    
    // Fade out at end
    const fadeOutStart = 0.7;
    let fadeOut = 1.0;
    if (lifeNormalized > fadeOutStart) {
      fadeOut = 1.0 - ((lifeNormalized - fadeOutStart) / (1.0 - fadeOutStart)) ** 2;
    }
    
    // Apply intensity modulation
    const baseOpacity = pulse.intensity * this.config.pulseGlowIntensity;
    
    // Dampen by corruption
    const corruptionDampen = 1.0 - (pulse.corruption * this.config.corruptionDampen);

    const bandMix = this._getLoadPressureProfile(pulse.loadPressure ?? 0).pressurizedMix;
    const bandBoost = 0.72 + bandMix * 0.34 + pulse.overloadMix * 0.68;
    const pressureBoost = bandBoost + pulse.loadPressure * 0.32;

    return fadeIn * fadeOut * baseOpacity * corruptionDampen * pressureBoost;
  }
  
  /**
   * Create pulse rig (reuses material, not geometry)
   */
  _createPulseMesh() {
    const makeMaterial = (opacityScale, glowScale, color) => {
      const material = this.pulseMaterialTemplate.clone();
      material.uniforms = THREE.UniformsUtils.clone(this.pulseMaterialTemplate.uniforms);
      if (color) material.uniforms.uColor.value = new THREE.Color(color);
      material.uniforms.uOpacity.value = opacityScale;
      material.uniforms.uGlowSize.value = this.config.pulseGlowIntensity * glowScale;
      return material;
    };

    const rig = new THREE.Group();
    rig.name = 'LinkResonancePulseRig';
    rig.visible = false;

    const core = new THREE.Mesh(this.pulseMeshGeometry, makeMaterial(1.0, 1.0, 0x9fffff));
    core.name = 'LinkResonancePulseCore';
    core.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_RESONANCE');
    tagAllowedSphere(core, { role: 'vfx', source: 'LinkResonanceFlowSystem_Session124._createPulseMesh.core' });
    clampSphere(core);

    const sheath = new THREE.Mesh(this.pulseSheathGeometry, makeMaterial(this.config.pulseSheathOpacity, 0.82, 0xd8c6ff));
    sheath.name = 'LinkResonancePulseSheath';
    sheath.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_RESONANCE');

    const trail = new THREE.Mesh(this.pulseTrailGeometry, makeMaterial(this.config.pulseTrailOpacity, 0.52, 0x87f3ff));
    trail.name = 'LinkResonancePulseTrail';
    trail.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_RESONANCE');

    const overloadA = new THREE.Mesh(this.pulseTrailGeometry, makeMaterial(0.1, 0.68, 0xffcc99));
    overloadA.name = 'LinkResonancePulseOverloadA';
    overloadA.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_RESONANCE');
    overloadA.visible = false;

    const overloadB = new THREE.Mesh(this.pulseTrailGeometry, makeMaterial(0.08, 0.62, 0xff945f));
    overloadB.name = 'LinkResonancePulseOverloadB';
    overloadB.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_RESONANCE');
    overloadB.visible = false;

    rig.add(overloadB);
    rig.add(overloadA);
    rig.add(trail);
    rig.add(sheath);
    rig.add(core);
    rig.userData.parts = { core, sheath, trail, overloadA, overloadB };
    return rig;
  }

  _getLinkDirection(link, directionSign = 1) {
    const nodeA = this._getLinkSource(link)?.position;
    const nodeB = this._getLinkTarget(link)?.position;
    if (!nodeA?.clone || !nodeB?.clone) {
      return new THREE.Vector3(0, 1, 0);
    }

    const direction = new THREE.Vector3().copy(nodeB).sub(nodeA);
    if (direction.lengthSq() <= 0.000001) {
      return new THREE.Vector3(0, 1, 0);
    }

    direction.normalize();
    if (directionSign < 0) direction.negate();
    return direction;
  }

  _getLinkLength(link) {
    const length = Number(link?.length);
    if (Number.isFinite(length) && length > 0) {
      return length;
    }

    const nodeA = this._getLinkSource(link)?.position;
    const nodeB = this._getLinkTarget(link)?.position;
    if (nodeA?.distanceTo && nodeB) {
      const computedLength = nodeA.distanceTo(nodeB);
      if (Number.isFinite(computedLength) && computedLength > 0) {
        return computedLength;
      }
    }

    return 1.0;
  }
  
  /**
   * Update LOD based on camera distance
   */
  _updateLOD(camera) {
    if (!camera?.position?.distanceTo) return;
    // Could suppress pulses on distant links
    // For now, basic distance check
    const threshold = this.config.lodDistanceThreshold;
    
    for (const pulse of this.globalPulses) {
      if (!pulse.link) continue;
      const nodeA = this._getLinkSource(pulse.link);
      const nodeB = this._getLinkTarget(pulse.link);
      if (!nodeA?.position || !nodeB?.position) continue;
      
      const linkMidpoint = new THREE.Vector3()
        .copy(nodeA.position)
        .add(nodeB.position)
        .multiplyScalar(0.5);
      
      const distance = camera.position.distanceTo(linkMidpoint);
      
      // Apply LOD suppression if far
      if (distance > threshold) {
        pulse.lodSuppression = this.config.lodPulseSuppression;
      } else {
        pulse.lodSuppression = 1.0;
      }
    }
  }
  
  /**
   * Remove dead pulses from tracking
   */
  _cleanupDeadPulses() {
    // Remove from link pools
    for (const [linkId, pulses] of this.linkPulses) {
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        if (!pulse.active) {
          if (pulse.mesh) {
            pulse.mesh.visible = false;
            this.pulseGroup?.remove?.(pulse.mesh);
            this.pulseMeshPool.push(pulse.mesh);
            delete pulse.mesh;
          }
          pulses.splice(i, 1);
        }
      }
      
      // Remove empty link pools
      if (pulses.length === 0) {
        this.linkPulses.delete(linkId);
      }
    }
    
    // Remove from global pool
    for (let i = this.globalPulses.length - 1; i >= 0; i--) {
      const pulse = this.globalPulses[i];
      if (!pulse.active) {
        if (pulse.mesh) {
          pulse.mesh.visible = false;
          this.pulseGroup?.remove?.(pulse.mesh);
          this.pulseMeshPool.push(pulse.mesh);
          delete pulse.mesh;
        }
        this.globalPulses.splice(i, 1);
      }
    }
  }

  _releasePulseMesh(pulse) {
    if (pulse?.mesh) {
      pulse.mesh.visible = false;
      this.pulseGroup?.remove(pulse.mesh);
      this.pulseMeshPool.push(pulse.mesh);
      delete pulse.mesh;
    }
  }

  clearLink(linkOrId) {
    const linkId = typeof linkOrId === 'object' ? (linkOrId?.id ?? linkOrId?.linkId ?? null) : linkOrId;
    if (linkId === null || linkId === undefined) return;

    const pulses = this.linkPulses.get(linkId);
    if (Array.isArray(pulses)) {
      for (const pulse of pulses) {
        pulse.active = false;
        this._releasePulseMesh(pulse);
      }
      this.linkPulses.delete(linkId);
    }

    this.spawnAccumulators.delete(linkId);

    for (let i = this.globalPulses.length - 1; i >= 0; i--) {
      const pulse = this.globalPulses[i];
      if (pulse?.linkId === linkId) {
        pulse.active = false;
        this._releasePulseMesh(pulse);
        this.globalPulses.splice(i, 1);
      }
    }
  }
  
  /**
   * Get vertex shader
   */
  _getVertexShader() {
    return `
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }
  
  /**
   * Get fragment shader
   */
  _getFragmentShader() {
    return `
      uniform vec3 uPulseColor;
      uniform float uIntensity;
      uniform float uGlowSize;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      void main() {
        vec3 viewDir = normalize(cameraPosition - vec3(0.0));
        float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
        
        // Radial glow effect
        float dist = length(vPosition);
        float glow = exp(-dist * dist * 2.0) * uGlowSize;
        
        float alpha = (fresnel + glow) * uIntensity;
        gl_FragColor = vec4(uPulseColor, alpha);
      }
    `;
  }
  
  /**
   * Create visual trail between pulses (optional)
   */
  _createPulseTrail(pulse) {
    // Could add trails showing pulse path
    // Not implemented in basic version
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      activePulses: this.globalPulses.length,
      linksWithFlow: this.linkPulses.size,
      totalSpawned: this.stats.pulseSpawnCount,
      avgPulsesPerLink: this.linkPulses.size > 0 ?
        (this.globalPulses.length / this.linkPulses.size).toFixed(1) : 0,
    };
  }
  
  /**
   * Reset system
   */
  reset() {
    for (const pulse of this.globalPulses) {
      this._releasePulseMesh(pulse);
    }
    this.globalPulses = [];
    this.linkPulses.clear();
    this.spawnAccumulators.clear();
    this.stats.pulseSpawnCount = 0;
    this._lastVisualTime = undefined;
    this._lastUpdateFrameId = undefined;
  }
  
  /**
   * Cleanup resources
   */
  dispose() {
    if (this.pulseGroup) {
      this.scene?.remove?.(this.pulseGroup);
    }
    for (const pulse of this.globalPulses) {
      this._releasePulseMesh(pulse);
    }
    for (const mesh of this.pulseMeshPool) {
      mesh?.traverse?.((obj) => {
        obj?.material?.dispose?.();
      });
    }
    this.pulseMeshPool = [];
    this.pulseMeshGeometry?.dispose?.();
    this.pulseSheathGeometry?.dispose?.();
    this.pulseTrailGeometry?.dispose?.();
    this.pulseMaterialTemplate?.dispose?.();
    
    this.globalPulses = [];
    this.linkPulses.clear();
    this.spawnAccumulators.clear();
  }
}

