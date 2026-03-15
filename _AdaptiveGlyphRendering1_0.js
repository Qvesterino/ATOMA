/**
 * ADAPTIVE GLYPH RENDERING 1.0 — INTELLIGENT VISUAL RESPONSIVENESS
 * 
 * Makes all glyphs visually adapt to node metrics in real-time:
 * - Adaptive Scale (synergy increases, corruption decreases)
 * - Adaptive Hue Shift (colors reflect emotional state)
 * - Adaptive Motion (rotation, wobble, breathing, pulse)
 * 
 * STRICT SAFETY:
 * - NO modifications to createNode(), updateNode(), AINodes.js
 * - NO changes to node lifecycle or gameplay
 * - NO physics modifications
 * - NO new mesh generation
 * - ONLY animation parameter modifications
 * - Visual-only layer
 * - < 0.5ms per frame cost
 * 
 * COMPATIBILITY:
 * ✓ Works with Glyph System 3.0
 * ✓ Works with Multi-Glyph Fusion 4.0
 * ✓ Works with Semantic Glyph AI 5.0
 * ✓ Works with Purity Mode 5.1
 * ✓ Respects Glyph Slot System 2.0
 * 
 * METRICS USED (read-only):
 * - node.userData.metrics.synergy (0-1)
 * - node.userData.metrics.harmony (0-1)
 * - node.userData.metrics.corruption (0-1)
 * - node.userData.metrics.stability (0-1)
 * - node.userData.metrics.loadPressure (0-1)
 */

import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';

export class AdaptiveGlyphRendering1_0 {
  constructor(scene, semanticBus = null) {
    this.scene = scene;
    
    // Enable/disable adaptivity
    this.enabled = true;
    
    // Animation state per node (shared across glyphs)
    this.nodeAnimationState = new Map(); // nodeId → { baseScale, huePhase, motionPhase, etc }
    
    // Global time for synchronized effects
    this.globalTime = 0;
    this._glyphTimeOrigin = undefined;
    this._lastGlyphTime = undefined;
    
    // Configuration for adaptive parameters
    this.config = {
      // Adaptive Scale
      scaleFromSynergy: 0.6,       // Max scale boost from synergy
      scaleFromCorruption: -0.2,   // Scale reduction from corruption
      jitterFromStability: 0.04, // Max jitter amplitude (4%)
      jitterSpeed: 3.0,            // Hz
      
      // Adaptive Hue
      synergyHueShift: 30,         // Degrees toward cyan (hue space)
      harmonyHueShift: -30,        // Degrees toward magenta
      corruptionHueShift: 60,      // Degrees toward red/orange
      stabilityFlicker: 0.02,    // 2% hue flicker
      flickerSpeed: 4.0,           // Hz
      
      // Adaptive Motion
      rotationFromSynergy: 0.25,   // Speed multiplier (10-40% boost)
      wobbleFromStability: 0.02, // Max offset (0.02 = safe micro-wobble)
      wobbleSpeed: 2.0,            // Hz
      pulseFromCorruption: 0.15,   // Phase distortion amplitude
      pulseSpeed: 0.8,             // Hz (slow)
      breathingFromHarmony: 0.08,  // Scale breathing amplitude
      breathingSpeed: 1.2          // Hz
    };
    
    // Statistics
    this.stats = {
      nodesProcessed: 0,
      activeAdaptations: 0,
      lastFrameTime: 0
    };
    
    // Cache for metric tracking
    this.metricCache = new Map(); // nodeId → last metrics used

    // Event-driven metric updates
    this.semanticBus = semanticBus || globalThis?.semanticBus || null;
    this.dirtyNodes = new Set();
    this._eventDrivenEnabled = false;
    this._metricUpdatedHandler = null;
    this._unsubscribeMetricUpdated = null;
    this._setupMetricSubscription();
    
    console.log('✓ Adaptive Glyph Rendering 1.0 initialized');
  }

  _setupMetricSubscription() {
    if (!this.semanticBus || typeof this.semanticBus.subscribe !== 'function') {
      this._eventDrivenEnabled = false;
      return;
    }

    this._metricUpdatedHandler = (payload = {}) => {
      const nodeId = payload?.nodeId;
      const metric = payload?.metric;
      const value = Number(payload?.value);
      if (nodeId === undefined || nodeId === null || !metric || !Number.isFinite(value)) return;

      const id = String(nodeId);
      const cached = this.metricCache.get(id) || {
        synergy: 0,
        harmony: 0,
        corruption: 0,
        stability: 0,
        load: 0
      };

      if (metric === 'synergy') cached.synergy = Math.max(0, Math.min(1, value));
      if (metric === 'harmony') cached.harmony = Math.max(0, Math.min(1, value));
      if (metric === 'corruption') cached.corruption = Math.max(0, Math.min(1, value));
      if (metric === 'stability') cached.stability = Math.max(0, Math.min(1, value));
      if (metric === 'loadPressure') cached.load = Math.max(0, Math.min(1, value));

      this.metricCache.set(id, cached);
      this.dirtyNodes.add(id);
    };

    const maybeUnsubscribe = this.semanticBus.subscribe(
      'metric.node.updated',
      this._metricUpdatedHandler
    );

    if (typeof maybeUnsubscribe === 'function') {
      this._unsubscribeMetricUpdated = maybeUnsubscribe;
    } else if (typeof this.semanticBus.unsubscribe === 'function') {
      this._unsubscribeMetricUpdated = () => {
        this.semanticBus.unsubscribe('metric.node.updated', this._metricUpdatedHandler);
      };
    }

    this._eventDrivenEnabled = true;
  }

  getNodeId(node, nodeIndex = null) {
    const id =
      node?.userData?.nodeId ??
      node?.userData?.id ??
      node?.id ??
      node?.uuid ??
      (nodeIndex !== null ? `node-${nodeIndex}` : null);
    return id === undefined || id === null ? null : String(id);
  }

  /**
   * Initialize animation state for a node
   * Call once per node when glyphs are attached
   */
  initializeNodeState(nodeId) {
    if (this.nodeAnimationState.has(nodeId)) return;
    
    this.nodeAnimationState.set(nodeId, {
      baseScale: 1.0,
      scaleJitterPhase: Math.random() * Math.PI * 2,
      huePhase: Math.random() * Math.PI * 2,
      motionPhase: Math.random() * Math.PI * 2,
      wobblePhase: Math.random() * Math.PI * 2,
      pulsePhase: Math.random() * Math.PI * 2,
      breathPhase: Math.random() * Math.PI * 2,
      rotationSpeed: 1.0
    });
  }

  /**
   * Get node metrics (read-only from userData)
   */
  getNodeMetrics(node) {
    if (!node || !node.userData) {
      return {
        synergy: 0,
        harmony: 0,
        corruption: 0,
        stability: 0,
        load: 0
      };
    }

    if (this._eventDrivenEnabled) {
      const nodeId = this.getNodeId(node);
      const cached = nodeId ? this.metricCache.get(nodeId) : null;
      if (cached) {
        return {
          synergy: cached.synergy ?? 0,
          harmony: cached.harmony ?? 0,
          corruption: cached.corruption ?? 0,
          stability: cached.stability ?? 0,
          load: cached.load ?? 0
        };
      }
      return {
        synergy: 0,
        harmony: 0,
        corruption: 0,
        stability: 0,
        load: 0
      };
    }

    return {
      synergy: Math.max(0, Math.min(1, node.userData?.metrics?.synergy ?? 0)),
      harmony: Math.max(0, Math.min(1, node.userData?.metrics?.harmony ?? 0)),
      corruption: Math.max(0, Math.min(1, node.userData?.metrics?.corruption ?? 0)),
      stability: Math.max(0, Math.min(1, node.userData?.metrics?.stability ?? node.userData?.Stability ?? 0)),
      load: Math.max(0, Math.min(1, node.userData?.metrics?.loadPressure ?? 0))
    };
  }

  /**
   * Calculate adaptive scale based on metrics
   */
  calculateAdaptiveScale(metrics, animState, deltaTime) {
    animState.scaleJitterPhase += deltaTime * this.config.jitterSpeed * Math.PI * 2;
    
    // Base scale from synergy
    let scale = 1.0 + (metrics.synergy * this.config.scaleFromSynergy);
    
    // Reduce scale from corruption
    scale += (metrics.corruption * this.config.scaleFromCorruption);

    // Add jitter from stability
    const jitter = Math.sin(animState.scaleJitterPhase) * metrics.stability * this.config.jitterFromStability;
    scale += jitter;
    
    // Clamp to reasonable range
    return Math.max(0.8, Math.min(1.8, scale));
  }

  /**
   * Calculate adaptive hue shift (0-360 degrees)
   * Returns RGB color object
   */
  calculateAdaptiveHue(metrics, animState, deltaTime, baseColor) {
    if (!baseColor) return null;
    
    animState.huePhase += deltaTime * this.config.flickerSpeed * Math.PI * 2;
    
    // Convert base color to HSL
    const hsl = this.rgbToHsl(
      baseColor.r || (baseColor.getComponent ? baseColor.getComponent(0) : 0),
      baseColor.g || (baseColor.g || (baseColor.getComponent ? baseColor.getComponent(1) : 0)),
      baseColor.b || (baseColor.b || (baseColor.getComponent ? baseColor.getComponent(2) : 0))
    );
    
    // Shift hue based on metrics
    let hueShift = 0;
    hueShift += metrics.synergy * this.config.synergyHueShift;
    hueShift += metrics.harmony * this.config.harmonyHueShift;
    hueShift += metrics.corruption * this.config.corruptionHueShift;

    // Add stability flicker
    const flicker = Math.sin(animState.huePhase) * metrics.stability * this.config.stabilityFlicker * 360;
    hueShift += flicker;
    
    hsl.h = (hsl.h + hueShift) % 360;
    
    // Convert back to RGB
    return this.hslToRgb(hsl.h, hsl.s, hsl.l);
  }

  /**
   * Calculate adaptive rotation speed
   */
  calculateAdaptiveRotationSpeed(metrics, baseSpeed = 1.0) {
    let speedMultiplier = 1.0;
    
    // Synergy increases rotation speed (10-40% boost)
    speedMultiplier += metrics.synergy * this.config.rotationFromSynergy;

    // Stability causes slight speed fluctuation
    const stabilityVariation = Math.sin(this.globalTime * 2) * metrics.stability * 0.1;
    speedMultiplier += stabilityVariation;
    
    return baseSpeed * Math.max(0.5, Math.min(2.0, speedMultiplier));
  }

  /**
   * Calculate micro-wobble offset (safe < 0.02)
   */
  calculateMicroWobble(metrics, animState, deltaTime) {
    animState.wobblePhase += deltaTime * this.config.wobbleSpeed * Math.PI * 2;
    
    const wobbleAmount = Math.sin(animState.wobblePhase) * 
                        metrics.stability * 
                        this.config.wobbleFromStability;
    
    return {
      x: wobbleAmount * Math.cos(animState.wobblePhase),
      y: wobbleAmount * Math.sin(animState.wobblePhase * 0.7),
      z: wobbleAmount * Math.cos(animState.wobblePhase * 1.3)
    };
  }

  /**
   * Calculate phase distortion pulse (corruption effect)
   */
  calculatePulsePhase(metrics, animState, deltaTime) {
    animState.pulsePhase += deltaTime * this.config.pulseSpeed * Math.PI * 2;
    
    const pulse = Math.sin(animState.pulsePhase) * 
                 metrics.corruption * 
                 this.config.pulseFromCorruption;
    
    return pulse;
  }

  /**
   * Calculate breathing motion (harmony effect)
   */
  calculateBreathingScale(metrics, animState, deltaTime) {
    animState.breathPhase += deltaTime * this.config.breathingSpeed * Math.PI * 2;
    
    const breath = Math.sin(animState.breathPhase) * 
                  metrics.harmony * 
                  this.config.breathingFromHarmony;
    
    return 1.0 + breath;
  }

  /**
   * Apply adaptive scale to a glyph
   */
  applyAdaptiveScale(glyphGroup, scale, wobble) {
    if (!glyphGroup) return;
    
    glyphGroup.scale.set(scale, scale, scale);
    
    // Apply micro-wobble to position (very subtle)
    if (wobble) {
      glyphGroup.position.x = (glyphGroup.position.x || 0) + wobble.x;
      glyphGroup.position.y = (glyphGroup.position.y || 0) + wobble.y;
      glyphGroup.position.z = (glyphGroup.position.z || 0) + wobble.z;
    }
  }

  /**
   * Apply adaptive hue to a glyph
   */
  applyAdaptiveHue(glyphGroup, hueColor) {
    if (!glyphGroup || !hueColor) return;
    
    // Update material colors in glyph
    glyphGroup.traverse((child) => {
      if (child.material) {
        // Update emissive color to track hue
        if (child.material.emissive) {
          child.material.emissive.copy(hueColor);
          child.material.emissiveIntensity = Math.max(0.2, child.material.emissiveIntensity || 0.3);
        }
        
        // Update base color if not locked
        if (child.material.color && !child.userData.lockColor) {
          child.material.color.copy(hueColor);
        }
      }
    });
  }

  /**
   * Apply adaptive rotation to a glyph
   */
  applyAdaptiveRotation(glyphGroup, deltaTime, rotationSpeed, pulse) {
    if (!glyphGroup) return;
    
    // Primary rotation
    glyphGroup.rotation.y += deltaTime * rotationSpeed * (Math.PI / 180) * 60; // Normalize to rad/s
    
    // Phase distortion from corruption
    if (pulse) {
      glyphGroup.rotation.x += Math.sin(this.globalTime * pulse) * 0.02;
      glyphGroup.rotation.z += Math.cos(this.globalTime * pulse) * 0.02;
    }
  }

  /**
   * Apply breathing motion to a glyph
   */
  applyBreathingMotion(glyphGroup, breathScale) {
    if (!glyphGroup || breathScale === 1.0) return;
    
    // FIX: Use absolute scaling from base scale to prevent drift
    if (!glyphGroup.userData.baseScale) {
      glyphGroup.userData.baseScale = glyphGroup.scale.x || 1.0;
    }
    const absoluteScale = glyphGroup.userData.baseScale * breathScale;
    glyphGroup.scale.setScalar(absoluteScale);
  }

  /**
   * Main update - apply adaptivity to all node glyphs
   * Call once per frame from main game loop
   */
  update(deltaTime, nodes) {
    if (!this.enabled || !nodes) return;

    const startTime = VisualTime.now;
    if (this._glyphTimeOrigin === undefined) {
      this._glyphTimeOrigin = VisualTime.now;
    }
    const currentGlyphTime = VisualTime.now - this._glyphTimeOrigin; // Phase 2A: canonical VisualTime source (behavior-preserving)
    const glyphDelta = this._lastGlyphTime === undefined
      ? 0
      : Math.max(0, currentGlyphTime - this._lastGlyphTime);
    this._lastGlyphTime = currentGlyphTime;
    this.globalTime = currentGlyphTime;
    
    let processedCount = 0;

    let nodesToProcess = nodes;
    if (this._eventDrivenEnabled) {
      if (this.dirtyNodes.size === 0) {
        this.stats.nodesProcessed = 0;
        this.stats.activeAdaptations = 0;
        this.stats.lastFrameTime = (VisualTime.now - startTime) * 1000;
        return;
      }

      nodesToProcess = [];
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!node) continue;
        const nodeId = this.getNodeId(node, i);
        if (nodeId && this.dirtyNodes.has(nodeId)) {
          nodesToProcess.push(node);
        }
      }
    }
    
    nodesToProcess.forEach((node, nodeIndex) => {
      if (!node || !node.visualGroup) return;
      
      const nodeId = this.getNodeId(node, nodeIndex);
      if (!nodeId) return;
      
      // Initialize state if needed
      if (!this.nodeAnimationState.has(nodeId)) {
        this.initializeNodeState(nodeId);
      }
      
      const animState = this.nodeAnimationState.get(nodeId);
      const metrics = this.getNodeMetrics(node);
      
      // Get all glyph groups in visualGroup
      node.visualGroup.traverse((child) => {
        if (!child.userData || child.userData.isGlyphSlotAnchor) return;
        if (child instanceof THREE.Group && child.children.length > 0) {
          // This is likely a glyph group or slot anchor
          
          // Process all meshes in this group
          child.traverse((mesh) => {
            if (!mesh.isMesh || !mesh.visible) return;
            
            // Calculate adaptive parameters
            const adaptiveScale = this.calculateAdaptiveScale(metrics, animState, glyphDelta);
            const wobble = this.calculateMicroWobble(metrics, animState, glyphDelta);
            const pulse = this.calculatePulsePhase(metrics, animState, glyphDelta);
            const breathScale = this.calculateBreathingScale(metrics, animState, glyphDelta);
            
            // Apply scale
            this.applyAdaptiveScale(mesh, adaptiveScale * breathScale, wobble);
            
            // Apply hue adaptation
            if (mesh.material && mesh.material.color) {
              const baseColor = mesh.userData.baseColor || mesh.material.color.clone();
              if (!mesh.userData.baseColor) {
                mesh.userData.baseColor = baseColor.clone();
              }
              
              const adaptiveHue = this.calculateAdaptiveHue(metrics, animState, glyphDelta, baseColor);
              if (adaptiveHue) {
                this.applyAdaptiveHue(mesh, adaptiveHue);
              }
            }
            
            // Apply rotation with pulse distortion
            const rotationSpeed = this.calculateAdaptiveRotationSpeed(metrics, 0.5);
            this.applyAdaptiveRotation(child.parent || child, glyphDelta, rotationSpeed, pulse);
            
            processedCount++;
          });
        }
      });
    });

    if (this._eventDrivenEnabled) {
      this.dirtyNodes.clear();
    }
    
    this.stats.nodesProcessed = nodesToProcess.length;
    this.stats.activeAdaptations = processedCount;
    this.stats.lastFrameTime = (VisualTime.now - startTime) * 1000;
  }

  /**
   * RGB to HSL conversion
   */
  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return {
      h: h * 360,
      s: s * 100,
      l: l * 100
    };
  }

  /**
   * HSL to RGB conversion
   */
  hslToRgb(h, s, l) {
    h = h % 360;
    if (h < 0) h += 360;
    s /= 100;
    l /= 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (h < 60) {
      r = c; g = x; b = 0;
    } else if (h < 120) {
      r = x; g = c; b = 0;
    } else if (h < 180) {
      r = 0; g = c; b = x;
    } else if (h < 240) {
      r = 0; g = x; b = c;
    } else if (h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }
    
    const color = new THREE.Color();
    color.setRGB(r + m, g + m, b + m);
    return color;
  }

  /**
   * Enable/disable adaptive rendering
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`✓ Adaptive Glyph Rendering ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get current statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Print debug report
   */
  printDebugReport() {
    console.group('🎨 Adaptive Glyph Rendering 1.0 Status');
    console.log(`Status: ${this.enabled ? '✓ ENABLED' : '✗ DISABLED'}`);
    console.log(`Nodes Processed: ${this.stats.nodesProcessed}`);
    console.log(`Active Adaptations: ${this.stats.activeAdaptations}`);
    console.log(`Last Frame Time: ${this.stats.lastFrameTime.toFixed(2)}ms`);
    console.log(`Global Time: ${this.globalTime.toFixed(2)}s`);
    console.log('Adaptive Parameters:');
    console.log(`  Scale from Synergy: ±${this.config.scaleFromSynergy}`);
    console.log(`  Scale from Corruption: ${this.config.scaleFromCorruption}`);
    console.log(`  Stability Jitter: ±${this.config.jitterFromStability}`);
    console.log(`  Hue Shift Range: ±${Math.max(this.config.synergyHueShift, this.config.harmonyHueShift, this.config.corruptionHueShift)}°`);
    console.log(`  Rotation Boost: ±${(this.config.rotationFromSynergy * 100).toFixed(0)}%`);
    console.log(`  Wobble Amplitude: ±${this.config.wobbleFromStability}`);
    console.log(`  Breathing Amplitude: ±${this.config.breathingFromHarmony}`);
    console.groupEnd();
  }

  /**
   * Print single node adaptation state
   */
  debugNodeAdaptation(nodeId, node) {
    const metrics = this.getNodeMetrics(node);
    const animState = this.nodeAnimationState.get(nodeId);
    
    console.group(`🎨 Adaptive Rendering for Node ${nodeId}`);
    console.log('Metrics:');
    console.log(`  Synergy: ${(metrics.synergy * 100).toFixed(1)}%`);
    console.log(`  Harmony: ${(metrics.harmony * 100).toFixed(1)}%`);
    console.log(`  Corruption: ${(metrics.corruption * 100).toFixed(1)}%`);
    console.log(`  Stability: ${(metrics.stability * 100).toFixed(1)}%`);
    console.log(`  Load: ${(metrics.load * 100).toFixed(1)}%`);
    
    if (animState) {
      console.log('Animation State:');
      console.log(`  Base Scale: ${animState.baseScale.toFixed(2)}`);
      console.log(`  Rotation Speed: ${animState.rotationSpeed.toFixed(2)}`);
      console.log(`  Motion Phases: Jitter=${(animState.scaleJitterPhase / Math.PI).toFixed(1)}π, Wobble=${(animState.wobblePhase / Math.PI).toFixed(1)}π`);
    }
    
    // Calculate current values
    const scale = this.calculateAdaptiveScale(metrics, animState, 0.016);
    const wobble = this.calculateMicroWobble(metrics, animState, 0.016);
    const pulse = this.calculatePulsePhase(metrics, animState, 0.016);
    const breath = this.calculateBreathingScale(metrics, animState, 0.016);
    const rotation = this.calculateAdaptiveRotationSpeed(metrics, 1.0);
    
    console.log('Current Adaptations:');
    console.log(`  Scale: ${scale.toFixed(2)}`);
    console.log(`  Breathing: ${breath.toFixed(2)}`);
    console.log(`  Rotation Speed: ${rotation.toFixed(2)}`);
    console.log(`  Wobble: X=${wobble.x.toFixed(3)}, Y=${wobble.y.toFixed(3)}, Z=${wobble.z.toFixed(3)}`);
    console.log(`  Pulse: ${pulse.toFixed(3)}`);
    
    console.groupEnd();
  }

  /**
   * Clear animation state for cleanup
   */
  cleanup() {
    if (typeof this._unsubscribeMetricUpdated === 'function') {
      try {
        this._unsubscribeMetricUpdated();
      } catch (e) {
        // noop
      }
    }

    this._unsubscribeMetricUpdated = null;
    this._metricUpdatedHandler = null;
    this._eventDrivenEnabled = false;
    this.dirtyNodes.clear();
    this.metricCache.clear();
    this.nodeAnimationState.clear();
    console.log('✓ Adaptive Glyph Rendering cleaned up');
  }
}
