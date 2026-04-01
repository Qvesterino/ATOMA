/**
 * LINK CORRUPTION SPREAD ANIMATOR
 * ============================================================================
 * Animates corruption spread along links with directional color shift
 * from source to target nodes
 * 
 * Features:
 * - Tracks corruption level per link
 * - Animates wave front traveling source → target
 * - Shifts strand colors progressively (clean → tainted → corrupted)
 * - Independent animation state per link
 * - Visual-only, no gameplay changes
 * 
 * @author VFX Technical Director — ATOMA Project
 * @version 1.0.0
 */

import * as THREE from 'three';
import { LinkPointFXBase } from './LinkPointFXBase.js';

const CASCADE_CORRUPTION_THRESHOLD = 0.35;

function claimStrandChannel(material, channel, writer, priority) {
  const ownerState = material?.userData?.__strandOwnerStateRef;
  if (!ownerState) return true;
  ownerState.claims = ownerState.claims || {};
  ownerState.trace = ownerState.trace || {};
  const current = ownerState.claims[channel];
  if (current && Number.isFinite(current.priority) && current.priority > priority) {
    return false;
  }
  ownerState.claims[channel] = { writer, priority };
  ownerState.trace[channel] = writer;
  return true;
}

export class LinkCorruptionSpreadAnimator {
  constructor() {
    // Per-link corruption animation state
    this.animationStates = new Map(); // link.id → {wavePhase, intensity, startTime}
    
    // Color palette for corruption progression
    this.corruptionColors = {
      // Clean state colors (by category)
      clean: {
        'input': new THREE.Color(0x00ddff),
        'process': new THREE.Color(0xffaa00),
        'integration': new THREE.Color(0x00ff88),
        'analytics': new THREE.Color(0xaa00ff),
        'storage': new THREE.Color(0x88ccff),
        'control': new THREE.Color(0xff0088),
        'quantum': new THREE.Color(0x00ffff),
        'sigma': new THREE.Color(0x00ff00),
        'emotional': new THREE.Color(0xff8800),
        'default': new THREE.Color(0xcccccc)
      },
      // Tainted state (slight corruption)
      tainted: new THREE.Color(0xff6633), // Orange-red
      // Corrupted state (heavy infection)
      corrupted: new THREE.Color(0xff0044)  // Deep red-magenta
    };

    this.pointFXBase = null;
    
    // Configuration
    this.config = {
      spreadDuration: 2000,           // 2s for wave to travel source → target
      waveDuration: 800,              // Wave front width duration
      spreadStartThreshold: CASCADE_CORRUPTION_THRESHOLD, // Corruption level that triggers spread
      inactiveResetThreshold: 0.08,   // Drop below this to cancel lingering sweep state cleanly
      triggerDeltaThreshold: 0.04,    // Minimum rise needed to trigger a new sweep
      retriggerCooldownMs: 550,       // Debounce to keep sweeps readable (avoid flicker spam)
      pulsePauseMs: 1800,             // Requested cadence: spread / pause / spread
      forceRetriggerDelta: 0.16,      // Large jumps can bypass cooldown
      maxCorruptionForSpread: 0.95,   // Cap on corruption visualization
      dustTravelSpeed: 0.42,
      dustParticleCount: 18,
      dustWaveWidth: 0.18,
      dustHeight: 0.16,
      dustLateralSpread: 0.06
    };

    this.dustGlyphTexture = this._createDustGlyphTexture();
  }

  _disposeDustState(state) {
    if (!state?.dust) return;

    const dust = state.dust;
    if (dust.points) {
      dust.points.parent?.remove(dust.points);
    }
    dust.geometry?.dispose?.();
    dust.material?.dispose?.();
    state.dust = null;
  }

  _createDustGlyphTexture() {
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, 128, 128);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,248,235,0.98)';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255,110,42,0.88)';
    ctx.shadowBlur = 16;

    // Interlocked chain-link pair.
    ctx.beginPath();
    ctx.ellipse(52, 50, 24, 15, -0.56, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(76, 64, 24, 15, -0.56, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 4.5;
    ctx.strokeStyle = 'rgba(255,155,72,0.96)';
    ctx.shadowColor = 'rgba(255,100,38,0.92)';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.ellipse(52, 50, 17, 10.5, -0.56, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(76, 64, 17, 10.5, -0.56, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.98)';
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.moveTo(63, 42);
    ctx.lineTo(67, 45);
    ctx.lineTo(70, 56);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  _readDebugConfig() {
    if (typeof window === 'undefined') {
      return {
        forceSweep: false,
        sweepIntervalMs: 900,
        minCorruption: 0.1,
        visibilityBoost: 1.0
      };
    }

    const forceSweep = window.__DEBUG_CORRUPTION_SPREAD_FORCE_SWEEP__ === true;
    const sweepIntervalRaw = window.__DEBUG_CORRUPTION_SPREAD_INTERVAL_MS__;
    const minCorruptionRaw = window.__DEBUG_CORRUPTION_SPREAD_MIN_CORRUPTION__;
    const visibilityBoostRaw = window.__DEBUG_CORRUPTION_SPREAD_BOOST__;

    return {
      forceSweep,
      sweepIntervalMs: Number.isFinite(sweepIntervalRaw) ? Math.max(120, sweepIntervalRaw) : 900,
      minCorruption: Number.isFinite(minCorruptionRaw) ? Math.max(0, Math.min(1, minCorruptionRaw)) : 0.1,
      visibilityBoost: Number.isFinite(visibilityBoostRaw) ? Math.max(1.0, Math.min(3.0, visibilityBoostRaw)) : 1.0
    };
  }
  
  /**
   * Initialize corruption animation state for a link
   * @param {Object} link - The link object
   */
  initializeLink(link) {
    if (link?.id === null || link?.id === undefined) return;
    
    this.animationStates.set(link.id, {
      wavePhase: 0,
      dustTravelPhase: 0,
      intensity: 0,
      time: 0,
      startTime: performance.now(),
      previousCorruption: 0,
      lastTriggerTime: -Infinity,
      lastCycleEndTime: -Infinity,
      nextRetriggerAtTime: -Infinity,
      isAnimating: false,
      dust: null
    });
  }

  attachScene(scene) {
    if (!scene) return;
    this.pointFXBase = new LinkPointFXBase(scene, {
      renderLayer: 'LINK_PARTICLES',
      preset: 'corruption',
      capacity: 18,
      textureKind: 'ember'
    });
  }
  
  /**
   * Update corruption spread animation
   * @param {Object} link - Link to animate
   * @param {number} deltaTime - Delta time in seconds
   * @param {Array} strands - Link strand meshes to color
   * @param {Object} options - { corruptionLevel, nowMs }
   * @returns {Object} Animation state
   */
  update(link, deltaTime, strands, options = {}) {
    if (link?.id === null || link?.id === undefined || !strands || strands.length === 0) return null;
    const safeDelta = Number.isFinite(deltaTime) ? Math.max(0, deltaTime) : 0;
    
    const corruptionLevel = Math.min(this.config.maxCorruptionForSpread, this._readCorruptionLevel(link, options));
    
    const nowMs = Number.isFinite(options?.nowMs) ? options.nowMs : ((performance?.now?.() ?? Date.now()));
    
    let state = this.animationStates.get(link.id);
    if (!state) {
      this.initializeLink(link);
      state = this.animationStates.get(link.id);
    }

    state.time = (state.time || 0) + safeDelta;
    
    if (corruptionLevel <= this.config.inactiveResetThreshold) {
      state.previousCorruption = corruptionLevel;
      state.wavePhase = 0;
      state.dustTravelPhase = 0;
      state.intensity = 0;
      if (state.isAnimating) {
        state.isAnimating = false;
        state.lastCycleEndTime = nowMs;
      }
      state.nextRetriggerAtTime = nowMs + this.config.pulsePauseMs;
      this._disposeDustState(state);
      return null;
    }

    const debugCfg = this._readDebugConfig();
    
    // Trigger spread animation on meaningful corruption rise, with cooldown
    const corruptionDelta = corruptionLevel - state.previousCorruption;
    const aboveThreshold = corruptionLevel > CASCADE_CORRUPTION_THRESHOLD;
    const risingEnough = corruptionDelta >= this.config.triggerDeltaThreshold;
    const cooldownElapsed = (nowMs - state.lastTriggerTime) >= this.config.retriggerCooldownMs;
    const forceRetrigger = corruptionDelta >= this.config.forceRetriggerDelta;
    const pulsePauseElapsed = nowMs >= (state.nextRetriggerAtTime || -Infinity);
    const canStartNewPulse = pulsePauseElapsed && cooldownElapsed;

    if (aboveThreshold && canStartNewPulse && (risingEnough || forceRetrigger)) {
      state.isAnimating = true;
      state.startTime = nowMs;
      state.wavePhase = 0;
      state.lastTriggerTime = nowMs;
      state.nextRetriggerAtTime = Infinity;
    }

    if (aboveThreshold && !state.isAnimating && canStartNewPulse) {
      state.isAnimating = true;
      state.startTime = nowMs;
      state.wavePhase = 0;
      state.lastTriggerTime = nowMs;
      state.nextRetriggerAtTime = Infinity;
    }

    // Debug-only periodic sweep retrigger for visual verification.
    if (
      debugCfg.forceSweep &&
      corruptionLevel >= debugCfg.minCorruption &&
      pulsePauseElapsed &&
      (nowMs - state.lastTriggerTime) >= debugCfg.sweepIntervalMs
    ) {
      state.isAnimating = true;
      state.startTime = nowMs;
      state.wavePhase = 0;
      state.lastTriggerTime = nowMs;
      state.nextRetriggerAtTime = Infinity;
    }
    state.previousCorruption = corruptionLevel;

    if (state.isAnimating) {
      state.dustTravelPhase = ((state.dustTravelPhase || 0) + safeDelta * this.config.dustTravelSpeed) % 1;
    }
    
    // Update animation phase (0 to 1, represents wave position)
    if (state.isAnimating) {
      const elapsed = nowMs - state.startTime;
      state.wavePhase = Math.min(1.0, elapsed / this.config.spreadDuration);
      
      // End animation when wave completes
      if (state.wavePhase >= 1.0) {
        state.isAnimating = false;
        state.lastCycleEndTime = nowMs;
        state.dustTravelPhase = 0;
        state.nextRetriggerAtTime = nowMs + this.config.pulsePauseMs;
        this._disposeDustState(state);
      }
    }
    
    // Update animation intensity (0 at phase start/end, 1 at peak)
    const wavePos = state.wavePhase;
    const waveFalloff = Math.sin(wavePos * Math.PI) * (1.0 - Math.abs(wavePos - 0.5) * 2); // Peaked wave
    state.intensity = Math.max(waveFalloff, corruptionLevel * 0.5);
    
    // Apply colors to strands based on corruption progression
    this._applyCorruptionGradient(strands, corruptionLevel, state.wavePhase, link, {
      isAnimating: state.isAnimating,
      debugVisibilityBoost: debugCfg.visibilityBoost
    });

    this._updateDustWave(link, state, corruptionLevel);
    
    return state;
  }

  _ensureDustState(link, state) {
    if (state.dust || !link?.group) return state.dust;

    const count = this.config.dustParticleCount;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));

    const material = new THREE.PointsMaterial({
      color: 0xffefd6,
      map: this.dustGlyphTexture,
      transparent: true,
      opacity: 0.0,
      size: 0.1,
      alphaTest: 0.08,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.visible = false;
    if (this.pointFXBase) {
      this.pointFXBase.ensureAttached(points);
    } else {
      link.group.add(points);
    }

    const seeds = [];
    for (let i = 0; i < count; i++) {
      const tMin = 0.045;
      const tMax = 0.955;
      seeds.push({
        tOffset: tMin + (i / Math.max(1, count - 1)) * (tMax - tMin),
        lateral: (Math.random() - 0.5) * this.config.dustLateralSpread,
        vertical: Math.random() * this.config.dustHeight,
        phase: Math.random() * Math.PI * 2,
        sizeBias: 0.8 + Math.random() * 0.6
      });
    }

    state.dust = { points, geometry, material, seeds };
    return state.dust;
  }

  _sampleLinkPosition(link, t) {
    if (link?.curve?.getPointAt) {
      return link.curve.getPointAt(Math.max(0, Math.min(1, t)));
    }

    const source = link?.source?.position;
    const target = link?.target?.position;
    if (source && target) {
      return new THREE.Vector3().lerpVectors(source, target, Math.max(0, Math.min(1, t)));
    }

    return new THREE.Vector3();
  }

  _computeLinkBasis(link) {
    const source = link?.source?.position;
    const target = link?.target?.position;
    const forward = new THREE.Vector3(1, 0, 0);
    if (source && target) {
      forward.subVectors(target, source);
      if (forward.lengthSq() > 1e-8) forward.normalize();
    }

    const up = new THREE.Vector3(0, 1, 0);
    const lateral = new THREE.Vector3().crossVectors(forward, up);
    if (lateral.lengthSq() <= 1e-8) {
      lateral.set(1, 0, 0);
    } else {
      lateral.normalize();
    }

    return { up, lateral };
  }

  _updateDustWave(link, state, corruptionLevel, flags = {}) {
    const active = state.isAnimating;
    if (!active) {
      this._disposeDustState(state);
      return;
    }

    const dust = this._ensureDustState(link, state);
    if (!dust) return;

    dust.points.visible = active;

    const positions = dust.geometry.attributes.position.array;
    const basis = this._computeLinkBasis(link);
    const travelPhase = state.dustTravelPhase || 0;
    const width = this.config.dustWaveWidth;

    for (let i = 0; i < dust.seeds.length; i++) {
      const seed = dust.seeds[i];
      const relative = seed.tOffset - travelPhase;
      const influence = Math.exp(-(relative * relative) / Math.max(0.0001, width * width));
      const sampleT = Math.max(0, Math.min(1, travelPhase + relative * 0.45));
      const basePos = this._sampleLinkPosition(link, sampleT);
      const shimmer = Math.sin(state.time * 4.0 + seed.phase + sampleT * 9.0);

      basePos.addScaledVector(basis.up, this.config.dustHeight * (0.35 + influence * 0.85) + shimmer * 0.015);
      basePos.addScaledVector(
        basis.lateral,
        seed.lateral + shimmer * 0.012 + Math.sin(state.time + seed.phase) * 0.01
      );

      positions[i * 3 + 0] = basePos.x;
      positions[i * 3 + 1] = basePos.y;
      positions[i * 3 + 2] = basePos.z;
    }

    dust.geometry.attributes.position.needsUpdate = true;
    dust.material.opacity = Math.min(0.96, 0.3 + corruptionLevel * 0.98);
    dust.material.size = 0.08 + corruptionLevel * 0.09;
  }

  _readCorruptionLevel(link, options = {}) {
    const fromOptions = options?.corruptionLevel;
    if (Number.isFinite(fromOptions)) return Math.max(0, fromOptions);

    const value =
      link?.group?.userData?.conduitState?.metrics?.corruption ??
      link?.userData?.metrics?.corruption ??
      link?.userData?.corruption ??
      link?.userData?.corruptionLevel;

    if (Number.isFinite(value)) {
      return Math.max(0, value);
    }

    return 0;
  }
  
  /**
   * Apply corruption color gradient along strands
   * Colors progress from clean → tainted → corrupted
   * @private
   */
  _applyCorruptionGradient(strands, corruptionLevel, wavePhase, link, options = {}) {
    if (corruptionLevel < this.config.spreadStartThreshold) {
      // No visible corruption yet
      return;
    }
    if (!options?.isAnimating) {
      // Ownership override only during active corruption sweep moments.
      return;
    }
    
    // Get base color from source node category
    const sourceCategory = link.source?.userData?.category || 'default';
    const baseColor = this.corruptionColors.clean[sourceCategory] || this.corruptionColors.clean.default;
    
    // Determine corruption stage
    let targetColor;
    if (corruptionLevel < 0.5) {
      // Tainted: blend base → tainted
      const t = corruptionLevel / 0.5;
      targetColor = new THREE.Color().lerpColors(baseColor, this.corruptionColors.tainted, t);
    } else {
      // Corrupted: blend tainted → corrupted
      const t = (corruptionLevel - 0.5) / 0.5;
      targetColor = new THREE.Color().lerpColors(this.corruptionColors.tainted, this.corruptionColors.corrupted, t);
    }
    
    // Apply color to each strand based on position along wave
    strands.forEach((strand, strandIndex) => {
      if (!strand || !strand.material) return;
      const material = strand.material;
      if (!claimStrandChannel(material, 'colorEmissive', 'CorruptionSpreadAnimator', 300)) {
        return;
      }
      
      const strandColor = new THREE.Color(baseColor);
      
      // Create wave sweep effect: color progresses along strands as wave travels
      const waveInfluence = this._getWaveInfluenceAtStrand(strandIndex, wavePhase, strands.length);
      
      // Blend strand color toward corruption color based on wave position.
      // Debug visibility boost applies only when sweep is actively animating.
      let blend = waveInfluence * corruptionLevel * 0.9;
      if (options?.isAnimating && Number.isFinite(options?.debugVisibilityBoost)) {
        blend *= options.debugVisibilityBoost;
      }
      blend = Math.max(0, Math.min(1, blend));
      strandColor.lerp(targetColor, blend);
      
      // Apply to strand material
      material.userData = material.userData || {};
      material.userData.__colorLockedByCorruption = true;
      if (material.uniforms?.uBaseColor?.value?.copy) {
        material.uniforms.uBaseColor.value.copy(strandColor);
      } else if (material.color) {
        material.color.copy(strandColor);
      }
      
      // Enhance emissive for corrupted strands
      if (material.emissive) {
        const corruptionEmissive = new THREE.Color(targetColor).multiplyScalar(corruptionLevel * 0.6);
        material.emissive.copy(corruptionEmissive);
      }
      
      // Slightly increase emissive intensity with corruption
      if (material.emissiveIntensity !== undefined) {
        material.emissiveIntensity = 0.6 + (corruptionLevel * 1.4);
      }
    });
  }
  
  /**
   * Calculate wave influence at specific strand
   * Wave travels from strandIndex 0 to max over time
   * @private
   */
  _getWaveInfluenceAtStrand(strandIndex, wavePhase, strandCount) {
    // Wave center position (0 = source, 1 = target)
    const waveCenter = wavePhase;
    
    // Strand position normalized (0 = first, 1 = last)
    const strandPos = strandCount > 1 ? strandIndex / (strandCount - 1) : 0;
    
    // Distance from wave center
    const distFromWave = Math.abs(strandPos - waveCenter);
    
    // Wave width: travels as Gaussian bell curve
    const waveWidth = this.config.waveDuration / this.config.spreadDuration;
    const waveFalloff = Math.exp(-(distFromWave * distFromWave) / (waveWidth * waveWidth * 0.5));
    
    return Math.pow(waveFalloff, 2); // Square for sharper wave front
  }
  
  /**
   * Get base clean color for a link's source node category
   * @param {string} category - Node category
   * @returns {THREE.Color} Base color
   */
  getCleanColor(category) {
    return this.corruptionColors.clean[category] || this.corruptionColors.clean.default;
  }
  
  /**
   * Dispose animation state for a link (called on link removal)
   * @param {string} linkId - Link ID to dispose
   */
  disposeLinkAnimation(linkId) {
    const state = this.animationStates.get(linkId);
    if (state?.dust) {
      state.dust.points.parent?.remove(state.dust.points);
      state.dust.geometry.dispose();
      state.dust.material.dispose();
      state.dust = null;
    }
    this.animationStates.delete(linkId);
  }
  
  /**
   * Clear all animation states
   */
  dispose() {
    if (this.dustGlyphTexture?.dispose) {
      this.dustGlyphTexture.dispose();
      this.dustGlyphTexture = null;
    }
    this.pointFXBase = null;
    this.animationStates.clear();
  }
}
