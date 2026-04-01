/**
 * ============================================================================
 * LINK BEAD SYSTEM - Directional Flow Indicators
 * ============================================================================
 * 
 * DESIGN PHILOSOPHY:
 * - Beads are small entities that travel along link curves
 * - They visualize data/signal flow from source to target
 * - They are pure visual consumers (no game logic)
 * - They sit embedded within/between the rope strands
 * - Spawning correlates with synergy and traffic
 * 
 * VISUAL BEHAVIOR:
 * - Multiple bead sizes for organic variation
 * - Subtle glow/transparency
 * - Soft fade-out at target node
 * - No hard edges, no sharp spikes
 * 
 * PERFORMANCE:
 * - Uses object pooling for reuse
 * - Single mesh with InstancedBufferGeometry (future optimization)
 * - Currently: individual instanced meshes for simplicity
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { LinkPointFXBase } from './LinkPointFXBase.js';

// PHASE S-5: Variant property freezing for shader variant immunity
const VARIANT_CRITICAL_PROPS = [
    'transparent',
    'side',
    'blending',
    'depthWrite',
    'depthTest',
    'alphaTest'
];

function isCoreNodeMesh(mesh) {
  return mesh?.userData?.isNodeCore === true ||
         mesh?.userData?.nodeId !== undefined;
}

function freezeMaterialFlags(material, owner = 'LinkBeadSystem') {
    if (!material) return;
    if (!material.userData) {
      Object.defineProperty(material, 'userData', { value: {}, writable: true, configurable: true });
    }
    material.userData.__frozenVariantProps = material.userData.__frozenVariantProps || new Set();
    material.userData.__warnedVariantProp = material.userData.__warnedVariantProp || new Set();

    VARIANT_CRITICAL_PROPS.forEach((prop) => {
        if (material.userData.__frozenVariantProps.has(prop)) return;

        const desc = Object.getOwnPropertyDescriptor(material, prop);
        if (desc && desc.configurable === false) {
            if (!material.userData.__warnedVariantProp.has(prop)) {
                console.warn('[VariantLock] Prop already locked, skip redefine', prop, material.uuid);
                material.userData.__warnedVariantProp.add(prop);
            }
            material.userData.__frozenVariantProps.add(prop);
            return;
        }

        const cachedValue = material[prop];
        try {
            Object.defineProperty(material, prop, {
                configurable: true,
                enumerable: true,
                get() {
                    return cachedValue;
                },
                set(value) {
                    if (cachedValue === value) return;
                    if (!material.userData.__warnedVariantProp.has(prop)) {
                        console.error('[VariantLock]', prop, 'modified after lock');
                        material.userData.__warnedVariantProp.add(prop);
                    }
                }
            });
            material.userData.__frozenVariantProps.add(prop);
        } catch (err) {
            if (!material.userData.__warnedVariantProp.has(prop)) {
                console.warn('[VariantLock] Failed to lock prop', prop, material.uuid, err?.message);
                material.userData.__warnedVariantProp.add(prop);
            }
        }
    });

    material.userData.__owner = material.userData.__owner || owner;
    material.userData.__flagsFrozen = true;
    material.__variantLocked = true;
}

/**
 * Bead configuration
 */
export const BEAD_CONFIG = {
  // Bead sizes (radius)
  sizes: {
    small: 0.03,    // Background flow
    medium: 0.05,   // Active flow
    large: 0.07     // Major impulses
  },
  
  // Base Size distribution (probability)
  // Adjusted dynamically based on activity
  sizeDistribution: {
    small: 0.0,
    medium: 0.75,
    large: 0.25
  },
  
  // Speed range (units per second)
  speedMin: 0.3,
  speedMax: 1.5,
  
  // Spawn behavior
  spawn: {
    // Base spawn rate (beads per second at synergy=1.0, traffic=1.0)
    baseRate: 6.5,
    // Activity = (synergy + traffic) / 2 (plus external boost)
  },
  
  // Echo Wave Configuration
  echo: {
    enabled: true,
    speed: 4.0,           // Speed of the wave along the link
    duration: 0.8,        // Visual duration of the wave
    width: 0.3,           // Width of the wave pulse (0-1 fraction of link)
    intensity: 1.5        // Peak intensity multiplier
  },
  
  // Visual properties
  opacity: 0.35,
  emissiveIntensity: 0.6,
  
  // Roughness and metalness for soft, glowing appearance
  roughness: 0.5,
  metalness: 0.3,
  
  // Fade-out distance from target (as fraction of curve length)
  fadeDistance: 0.1,
  
  // Pool size (max beads per link)
  maxBeadsPerLink: 6,
  
  // Scale opacity with synergy (higher synergy = more visible beads)
  synergyCoupling: {
    enabled: true,
    minMultiplier: 0.5,  // At low synergy
    maxMultiplier: 1.3   // At high synergy
  }
};

/**
 * Single bead object (data only, not visual)
 */
export class Bead {
  constructor(size = 'medium', speed = 1.0) {
    this.size = size;
    this.radius = BEAD_CONFIG.sizes[size];
    this.speed = speed; // units per second along curve
    this.link = null;
    
    this.t = 0; // Parameter on curve [0, 1]
    this.age = 0; // Time since spawn
    this.isActive = false;
    this.spawnTime = 0; // Absolute time of spawn for offset variety
    this.laneIndex = 0;
    this.laneJitter = 0;
    this.laneCount = 4;
  }
  
  /**
   * Update bead position
   * @param {number} deltaTime - seconds
   * @param {number} curveLength - total curve length
   */
  update(deltaTime, curveLength, speedMultiplier = 1) {
    this.age += deltaTime;
    
    // Movement: t increases as bead travels
    // If curve length is L and speed is v, then dt = (v/L) per second
    const dt = (this.speed / curveLength) * Math.max(0, speedMultiplier) * deltaTime;
    this.t += dt;
    
    // Bead reaches target when t > 1.0
    if (this.t > 1.0) {
      this.isActive = false;
      return true; // Reached target
    }
    return false; // Still traveling
  }
  
  /**
   * Reset for reuse
   */
  reset() {
    this.t = 0;
    this.age = 0;
    this.isActive = false;
    this.spawnTime = 0;
    this.laneIndex = 0;
    this.laneJitter = 0;
    this.laneCount = 4;
    this.link = null;
  }
}

/**
 * Link Bead System
 * Manages beads for a single link
 */
export class LinkBeadPool {
  constructor(link, maxBeads = BEAD_CONFIG.maxBeadsPerLink) {
    this.link = link;
    this.maxBeads = maxBeads;
    this.beads = [];
    this.activeBead = null;
    this.activityBoost = 0.6; // higher baseline so beads are always visible
    
    // Spawn accumulator
    this.spawnAccumulator = 0;
    
    // Echo Wave State
    this.echoWave = {
      active: false,
      progress: 0,      // 0.0 to 1.0 along link
      intensity: 0      // Current intensity
    };
    this.waveInterferenceEngine = globalThis?.game?.waveInterferenceEngine || null;
    
    // Initialize pool
    for (let i = 0; i < maxBeads; i++) {
      this.beads.push(new Bead());
    }
  }
  
  /**
   * Calculate current activity level
   */
  getActivityLevel() {
    const synergy = this.link?.synergyScore ?? 0.5;
    const traffic = this.link.traffic?.load ?? 0;
    return (synergy + traffic) / 2;
  }
  
  /**
   * External intensity boost (set each frame by conduit)
   */
  setActivityBoost(v = 0.1) {
    // Clamp to a sensible minimum to keep beads spawning
    this.activityBoost = Math.max(0.5, v);
  }
  
  /**
   * Trigger an echo wave
   */
  triggerEchoWave() {
    if (!BEAD_CONFIG.echo.enabled) return;
    
    // Restart wave or boost existing
    this.echoWave.active = true;
    this.echoWave.progress = 0;
    this.echoWave.intensity = BEAD_CONFIG.echo.intensity;
  }
  
  /**
   * Update echo wave state
   */
  updateEcho(deltaTime, curveLength) {
    if (!this.echoWave.active) return;
    
    // Speed is units/sec, so progress (0-1) change is speed/length * dt
    const progressSpeed = BEAD_CONFIG.echo.speed / Math.max(0.1, curveLength);
    this.echoWave.progress += progressSpeed * deltaTime;
    
    if (this.echoWave.progress > 1.2) { // Allow to go slightly past end for fade out
      this.echoWave.active = false;
      this.echoWave.progress = 0;
    }
  }

  /**
   * Spawn a new bead if conditions are met
   */
  trySpawn(deltaTime) {
    const activity = Math.max(this.getActivityLevel(), this.activityBoost, 0.3);
    
    // Spawn rate scales with activity
    const spawnRate = BEAD_CONFIG.spawn.baseRate * activity;
    
    // Accumulate time
    this.spawnAccumulator += deltaTime * spawnRate;
    
    if (this.spawnAccumulator >= 1.0) {
      this.spawnAccumulator -= 1.0;
      
      // Find an inactive bead
      const bead = this.beads.find(b => !b.isActive);
      if (bead) {
        // Determine Bead Size based on activity
        // Higher activity -> higher chance of Medium/Large
        
        const rand = Math.random();
        let size;
        
        // Boost probabilities based on activity
        // Base: Small 0.7, Medium 0.25, Large 0.05
        // At Activity 1.0: Boost Medium/Large chances
        
        let pLarge = BEAD_CONFIG.sizeDistribution.large;
        let pMedium = BEAD_CONFIG.sizeDistribution.medium;
        
        if (activity > 0.6) {
          pLarge = 0.15; // Triple chance of large
          pMedium = 0.40; // Increased medium
        } else if (activity > 0.3) {
           pLarge = 0.08;
           pMedium = 0.30;
        }
        
        if (rand < pLarge) {
          size = 'large';
          // Trigger Echo Wave on Large Bead
          this.triggerEchoWave();
        } else {
          size = 'medium';
        }

        bead.size = size;
        bead.radius = BEAD_CONFIG.sizes[size];

        if (size === 'large') {
          bead.speed = BEAD_CONFIG.speedMin * 1.2; 
        } else {
          bead.speed = (BEAD_CONFIG.speedMin + BEAD_CONFIG.speedMax) * 0.5;
        }
        
        bead.t = 0;
        bead.age = 0;
        bead.spawnTime = Date.now() / 1000;
        bead.isActive = true;
        const laneCount = Math.max(3, Math.min(5, this.link?.group?.userData?.conduitState?.strandCount || 4));
        bead.laneCount = laneCount;
        bead.laneIndex = Math.floor(Math.random() * laneCount); // follow one braid lane
        bead.laneJitter = (Math.random() - 0.5) * 0.12;         // low jitter, avoid side drift
        bead.link = this.link;
        
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Update all active beads
   */
  update(deltaTime, onArrival, spawnEnabled = true) {
    // Safety check: need a valid curve to proceed
    if (!this.link.curve) {
      // Clear active beads deterministically when curve is missing
      for (const bead of this.beads) {
        bead.isActive = false;
      }
      return;
    }
    
    // Get curve length (cached or compute once per frame)
    const curveLength = this.getCurveLength();
    
    // Update Echo Wave
    this.updateEcho(deltaTime, curveLength);
    
    // Spawn new beads
    if (spawnEnabled) {
      this.trySpawn(deltaTime);
    }
    // Force at least one bead when none are active (debug visibility)
    if (spawnEnabled && this.getActiveBead().length === 0) {
      this.trySpawn(deltaTime * 3); // triple boost to guarantee spawn
    }

    // Update active beads
    for (const bead of this.beads) {
      if (bead.isActive) {
        const waveEnergyRaw = this.waveInterferenceEngine?.sampleLinkEnergy?.(this.link?.id, bead.t) ?? 0;
        const waveEnergy = Number.isFinite(waveEnergyRaw) ? Math.max(0, waveEnergyRaw) : 0;
        const waveSpeedMultiplier = 1 + waveEnergy * 2.0;
        const arrived = bead.update(deltaTime, curveLength, waveSpeedMultiplier);
        if (arrived && onArrival) {
            onArrival(bead);
        }
      }
    }

  }
  
  /**
   * Get approximate curve length (simple caching)
   */
  getCurveLength() {
    if (!this.link.curve) return 1.0;
    
    // Cache length if not available
    if (!this._cachedLength) {
      // Approximate by sampling
      let length = 0;
      let prevPos = this.link.curve.getPointAt(0);
      
      for (let i = 1; i <= 10; i++) {
        const t = i / 10;
        const pos = this.link.curve.getPointAt(t);
        length += pos.distanceTo(prevPos);
        prevPos = pos;
      }
      
      // Ensure we have a non-zero length
      this._cachedLength = Math.max(0.1, length);
    }
    
    return this._cachedLength;
  }
  
  /**
   * Clear length cache when curve changes
   */
  invalidateCache() {
    this._cachedLength = null;
  }
  
  /**
   * Get all active beads
   */
  getActiveBead() {
    return this.beads.filter(b => b.isActive);
  }
}

/**
 * Bead visual renderer
 * Creates and manages mesh instances for beads
 */
export class BeadRenderer {
  constructor(scene, link = null) {
    this.scene = scene;
    this.link = link;
    this.pointFXBase = new LinkPointFXBase(scene, {
      renderLayer: 'LINK_BEADS',
      preset: 'spark',
      capacity: BEAD_CONFIG.maxBeadsPerLink,
      textureKind: 'spark'
    });

    const cloud = this.pointFXBase.createPointCloud({
      capacity: BEAD_CONFIG.maxBeadsPerLink,
      renderLayer: 'LINK_BEADS',
      preset: 'spark',
      textureKind: 'spark',
      attributeSchema: {
        aColor: { itemSize: 3 },
        aAlpha: { itemSize: 1 },
        aSize: { itemSize: 1 }
      },
      materialOptions: {
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
        vertexColors: false,
        uniforms: {
          uSizeScale: { value: 12.0 }
        }
      },
      userData: {
        isBeadPointCloud: true
      }
    });

    this.points = cloud.points;
    this.geometry = cloud.geometry;
    this.material = cloud.material;
    this.positionAttr = this.geometry.getAttribute('position');
    this.colorAttr = this.geometry.getAttribute('aColor');
    this.alphaAttr = this.geometry.getAttribute('aAlpha');
    this.sizeAttr = this.geometry.getAttribute('aSize');

    this._frameUp = new THREE.Vector3(0, 1, 0);
    this._frameForward = new THREE.Vector3(0, 0, 1);
    this._frameFallback = new THREE.Vector3(1, 0, 0);
    this._frameNormal = new THREE.Vector3();
    this._frameBinormal = new THREE.Vector3();

    this._clearAllSlots();
  }

  _buildLaneFrame(direction, normal, binormal) {
    normal.copy(this._frameUp);
    if (Math.abs(direction.dot(normal)) > 0.92) {
      normal.copy(this._frameFallback);
    }
    binormal.crossVectors(direction, normal).normalize();
    normal.crossVectors(binormal, direction).normalize();
  }

  _clearAllSlots() {
    const max = this.positionAttr?.count || BEAD_CONFIG.maxBeadsPerLink;
    for (let i = 0; i < max; i += 1) {
      this.clearSlot(i);
    }
    this.commit();
  }

  clearSlot(slot) {
    if (!Number.isFinite(slot) || slot < 0) return;
    const i = slot | 0;
    const p = i * 3;
    if (this.positionAttr?.array) {
      this.positionAttr.array[p] = 1e6;
      this.positionAttr.array[p + 1] = 1e6;
      this.positionAttr.array[p + 2] = 1e6;
      this.positionAttr.needsUpdate = true;
    }
    if (this.colorAttr?.array) {
      this.colorAttr.array[p] = 1.0;
      this.colorAttr.array[p + 1] = 1.0;
      this.colorAttr.array[p + 2] = 1.0;
      this.colorAttr.needsUpdate = true;
    }
    if (this.alphaAttr?.array) {
      this.alphaAttr.array[i] = 0.0;
      this.alphaAttr.needsUpdate = true;
    }
    if (this.sizeAttr?.array) {
      this.sizeAttr.array[i] = 0.0;
      this.sizeAttr.needsUpdate = true;
    }
  }

  writeSlot(slot, bead, curve, synergy, sourceColor, targetColor) {
    if (!bead || !bead.isActive || !curve) {
      this.clearSlot(slot);
      return;
    }

    const i = slot | 0;
    const t = bead.t;
    const pos = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const normal = this._frameNormal;
    const binormal = this._frameBinormal;
    this._buildLaneFrame(tangent, normal, binormal);

    const linkLength = curve.getLength ? curve.getLength() : 10.0;
    const twistSpacing = 4.2;
    const twists = Math.max(1.5, linkLength / twistSpacing);
    const laneCount = Math.max(3.0, bead.laneCount || 4.0);
    const lanePhase = (bead.laneIndex / laneCount) * Math.PI * 2.0 + bead.laneJitter + Math.PI * 0.5;
    const helixAngle = t * Math.PI * 2.0 * twists + lanePhase;
    const envelope = this.link?.userData?.visualEnvelopeRadius ?? 0.14;
    const laneRadius = (bead.size === 'medium')
      ? Math.max(bead.radius * 0.34, envelope * 0.28)
      : Math.max(bead.radius * 0.40, envelope * 0.34);

    pos.addScaledVector(normal, Math.cos(helixAngle) * laneRadius);
    pos.addScaledVector(binormal, Math.sin(helixAngle) * laneRadius);

    const p = i * 3;
    this.positionAttr.array[p] = pos.x;
    this.positionAttr.array[p + 1] = pos.y;
    this.positionAttr.array[p + 2] = pos.z;

    const color = new THREE.Color(sourceColor || 0x88ccff);
    if (sourceColor && targetColor) {
      color.lerpColors(sourceColor, targetColor, t);
    }
    this.colorAttr.array[p] = color.r;
    this.colorAttr.array[p + 1] = color.g;
    this.colorAttr.array[p + 2] = color.b;

    let baseAlpha = BEAD_CONFIG.opacity;
    if (BEAD_CONFIG.synergyCoupling.enabled) {
      const synergyFactor = THREE.MathUtils.mapLinear(
        synergy,
        0.0, 1.0,
        BEAD_CONFIG.synergyCoupling.minMultiplier,
        BEAD_CONFIG.synergyCoupling.maxMultiplier
      );
      baseAlpha *= synergyFactor;
    }
    baseAlpha = Math.max(0.16, baseAlpha);

    const fadeStart = 1.0 - BEAD_CONFIG.fadeDistance;
    if (t > fadeStart) {
      const fadeAmount = (t - fadeStart) / BEAD_CONFIG.fadeDistance;
      baseAlpha *= (1.0 - fadeAmount);
    }

    const pulse = 1.0 + Math.sin(bead.age * 8.0) * 0.15;
    const sizeScale = bead.size === 'large' ? 1.55 : bead.size === 'medium' ? 1.15 : 0.95;
    this.alphaAttr.array[i] = baseAlpha;
    this.sizeAttr.array[i] = (bead.radius * 32.0 + 1.4) * sizeScale * pulse;

    this.positionAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;
    this.alphaAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
  }

  commit() {
    if (this.geometry?.attributes?.position) this.geometry.attributes.position.needsUpdate = true;
    if (this.geometry?.attributes?.aColor) this.geometry.attributes.aColor.needsUpdate = true;
    if (this.geometry?.attributes?.aAlpha) this.geometry.attributes.aAlpha.needsUpdate = true;
    if (this.geometry?.attributes?.aSize) this.geometry.attributes.aSize.needsUpdate = true;
  }
}

/**
 * Link Bead Visualizer
 * Integrates bead pool and renderer
 */
export class LinkBeadVisualizer {
  constructor(link, scene) {
    this.link = link;
    this.scene = scene;
    
    // Pool and renderer
    this.pool = new LinkBeadPool(link);
    this.renderer = new BeadRenderer(scene, link);
    this._fixedAccum = 0;
    
    // Point group for beads
    this.group = new THREE.Group();
    {
      const ud = this.group.userData || (Object.defineProperty(this.group, 'userData', { value: {}, writable: true, configurable: true }), this.group.userData);
      Object.assign(ud, { isBeadGroup: true });
    }

    if (this.renderer.points) {
      this.group.add(this.renderer.points);
    }
    
    // Initialize colors
    this.updateColors();

    this._debugAcc = 0;
  }

  /**
   * Set external intensity (baseline beads when metrics are low)
   */
  setIntensity(intensity = 0.1) {
    if (this.pool && typeof this.pool.setActivityBoost === 'function') {
      this.pool.setActivityBoost(intensity);
    }
  }
  
  /**
   * Update source and target colors
   */
  updateColors() {
    // Source Color
    const sourceCat = this.link.source.userData.category || 'input';
    this.sourceColor = this.getCategoryColor(sourceCat);
    
    // Target Color (fallback to source if invalid)
    const targetCat = this.link.target.userData.category || sourceCat;
    this.targetColor = this.getCategoryColor(targetCat);
    
    // Default color for creation (source color)
    this.color = this.sourceColor;
  }

  /**
   * Force render state each frame to undo global depth/opacity clamps.
   */
  forceRenderState() {
    // PHASE 4A: temporarily disabled to avoid overriding renderOrder into DEBUG space
    return;
    this.group?.traverse((child) => {
      if (!child.isMesh && !child.isPoints) return;
      if (!child.material) return;
      // PHASE 3B: normalized extreme renderOrder → DEBUG_OVERLAY
      child.renderOrder = VisualHierarchyRegistry.getRenderOrder('DEBUG_OVERLAY');
      child.visible = true;
      const mat = child.material;
      mat.transparent = true;
      mat.depthWrite = false;
      mat.depthTest = false;
      mat.blending = THREE.AdditiveBlending;
      mat.opacity = BEAD_CONFIG.opacity;
      if (mat.emissive) mat.emissiveIntensity = BEAD_CONFIG.emissiveIntensity;
      mat.needsUpdate = true;
    });
  }
  
  /**
   * Helper: Get color by category name
   */
  getCategoryColor(category) {
    const colors = {
      'input': new THREE.Color(0x00ddff),
      'process': new THREE.Color(0xffaa00),
      'integration': new THREE.Color(0x00ff88),
      'analytics': new THREE.Color(0xaa00ff),
      'storage': new THREE.Color(0x88ccff),
      'control': new THREE.Color(0xff0088),
      'quantum': new THREE.Color(0x00ffff),
      'sigma': new THREE.Color(0x00ff00),
      'emotional': new THREE.Color(0xff8800)
    };
    
    return colors[category] || new THREE.Color(0xcccccc);
  }
  
  /**
   * Update all beads
   */
  update(deltaTime, onArrival, spawnEnabled = true) {
    this._fixedAccum += deltaTime;
    if (this._fixedAccum < 0.1) return;
    const step = this._fixedAccum;
    this._fixedAccum = 0;

    // Update pool (spawning and bead logic)
    this.pool.update(step, onArrival, spawnEnabled);
    this.pool.invalidateCache(); // Reset cache each frame
    
    // Safety check: need valid curve to render beads
    if (!this.link.curve) {
      // Hide all point slots when curve is absent
      const maxSlots = this.pool.maxBeads;
      for (let i = 0; i < maxSlots; i += 1) {
        this.renderer.clearSlot(i);
      }
      this.renderer.commit();
      return;
    }
    
    const synergy = this.link?.synergyScore ?? 0.5;
    const activeBead = this.pool.getActiveBead();

    // Debug: emit bead counts once per second when debug flag is on
    if (typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
      this._debugAcc += step;
      if (this._debugAcc >= 1.0) {
        console.debug('[Beads]', this.link.id, 'active:', activeBead.length, 'points:', this.pool.maxBeads);
        this._debugAcc = 0;
      }
    }
    
    // Update point slots directly from pooled beads
    for (let i = 0; i < this.pool.beads.length; i += 1) {
      const bead = this.pool.beads[i];
      this.renderer.writeSlot(
        i,
        bead,
        this.link.curve,
        synergy,
        this.sourceColor,
        this.targetColor
      );
    }

    this.renderer.commit();

    if (typeof window !== 'undefined' && window.__DEBUG_LINK_PARTICLES__ === true) {
      this._debugAcc += deltaTime;
      if (this._debugAcc >= 1.0) {
        console.log('[Beads] dt:', deltaTime.toFixed(4), 'active:', activeBead.length);
        this._debugAcc = 0;
      }
    }
  }
  
  /**
   * Get visual group (for adding to scene)
   */
  getGroup() {
    return this.group;
  }
  
  /**
   * Get current echo wave state
   */
  getEchoState() {
    return this.pool.echoWave;
  }

  /**
   * Get stats about current beads (for debugging)
   */
  getStats() {
    const activeBead = this.pool.getActiveBead();
    return {
      active: activeBead.length,
      max: this.pool.maxBeads,
      activity: this.pool.getActivityLevel(),
      spawnRate: BEAD_CONFIG.spawn.baseRate * this.pool.getActivityLevel(),
      avgSpeed: activeBead.length > 0 
        ? activeBead.reduce((sum, b) => sum + b.speed, 0) / activeBead.length
        : 0
    };
  }
  
  /**
   * Cleanup resources
   */
  dispose() {
    if (this.renderer?.points && this.renderer.pointFXBase?.disposePointCloud) {
      this.renderer.pointFXBase.disposePointCloud(this.renderer.points);
    } else if (this.renderer?.points) {
      this.group.remove(this.renderer.points);
      this.renderer.geometry?.dispose?.();
      this.renderer.material?.dispose?.();
    }
    this.renderer = null;
  }
}

export const LinkBeadSystem = {
  Bead,
  LinkBeadPool,
  BeadRenderer,
  LinkBeadVisualizer,
  BEAD_CONFIG
};

export default LinkBeadSystem;
