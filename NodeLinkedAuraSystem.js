import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { NodeSegmentedOrbitRings } from './shaders/NodeSegmentedOrbitRings.js';
import { createMultiBandFresnelRimAura } from './FresnelRimLightAuraShader.js';
import { DEFAULT_LINKED_AURA_HARMONY_BANDS, resolveLinkedAuraHarmonyBand, resolveLinkedAuraHarmonyValue } from './LinkedAuraHarmonyBands.js';

// PHASE S-5: Variant property freezing for shader variant immunity
const VARIANT_CRITICAL_PROPS = [
    'transparent',
    'side',
    'blending',
    'depthWrite',
    'depthTest',
    'alphaTest'
];

function freezeMaterialFlags(material, owner = 'NodeLinkedAuraSystem') {
    if (!material) return;
    if (!material.userData) material.userData = {};
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
 * Standalone 3D pseudo-noise (approximation for flame motion).
 * Extracted from class to avoid per-call method dispatch overhead in hot vertex loop.
 * Uses layered sine waves for organic feel.
 */
function simplexNoise3D(x, y, z) {
  const n1 = Math.sin(x * 1.3 + y * 0.7 + z * 0.9);
  const n2 = Math.sin(x * 2.7 - y * 1.4 + z * 1.8) * 0.5;
  const n3 = Math.sin(x * 5.1 + y * 3.2 - z * 2.4) * 0.25;
  return (n1 + n2 + n3) / 1.75;
}

/**
 * Node Linked Aura System - Dynamic breathing aura for connected nodes
 * 
 * Creates organic, torn-looking aura meshes with flame-like motion behavior.
 * Activated only when nodes have active links. Motion is subtle, unpredictable,
 * and driven by layered noise for a living, breathing feel.
 * 
 * VISUAL: Torn mesh shell (NOT smooth sphere), grey-white/desaturated cyan
 * MOTION: Flame-inspired drift/licking without fire visuals
 * ACTIVATION: Scales with link count (1-4 links max influence)
 * CORRUPTION: High corruption increases irregularity, reduces upward drift, adds opacity variation
 * HARMONY: Stabilizes and smooths motion, restores upward flow, reduces opacity unevenness
 *   - Phase alignment between noise layers
 *   - Reduced silhouette irregularity
 *   - Restored vertical flow bias
 * PERFORMANCE: Zero per-frame allocations, in-place buffer updates
 */

export class NodeLinkedAuraSystem {
  constructor(scene, linkingSystem, options = {}) {
    this.scene = scene;
    this.linkingSystem = linkingSystem;
    this.impactManager = options.impactManager ?? null;  // Optional particle impact manager
    
    // Configuration
    this.enabled = options.enabled ?? true;  // Enabled by default (feature flag)
    console.log("NodeAuraSystem enabled:", this.enabled);
    this.debugMode = false;
    
    // Aura tracking
    this.nodeAuras = new Map();  // node → aura data
    this._nodeMetricCache = new Map();
    this._metricSubscriptionDisposer = null;
    this._hasMetricSubscription = false;
    
    // Visual parameters (ATOMA_AURA_v2: boosted presence)
    this.visualParams = {
      baseOpacity: 0.16,
      minOpacity: 0.10,
      maxOpacity: 0.28,
      harmonyBands: options.harmonyBands ?? DEFAULT_LINKED_AURA_HARMONY_BANDS,
      baseScale: 1.22,
      maxScale: 1.38,
      color: new THREE.Color(0.55, 0.92, 0.85),  // Vibrant aquamarine
      accentColor: new THREE.Color(0.3, 0.95, 0.9),  // Bright cyan
      coreColor: new THREE.Color(0.78, 1.0, 0.94),   // Hot white-cyan core
      roughness: 0.95,
      metalness: 0.0
    };
    
    // Motion parameters - flame-like behavior
    this.motionParams = {
      // Base motion frequencies (low-frequency noise)
      baseFreqX: 0.4,
      baseFreqY: 0.6,  // Slightly faster Y for upward drift
      baseFreqZ: 0.5,
      
      // Motion amplitudes
      baseAmplitude: 0.08,
      maxAmplitude: 0.15,
      
      // Drift behavior (flame-like upward tendency)
      upwardDriftBias: 0.3,  // Gentle upward pull
      driftFrequency: 0.2,
      
      // Link creation spike
      linkSpikeAmplitude: 0.25,
      linkSpikeDuration: 0.15,  // 150ms
      linkSpikeDecay: 0.18,
      
      // Harmonic synchronization
      harmonicSyncStrength: 0.15,
      harmonicPhaseBlend: 0.08
    };

    // Heavy vertex flame deformation runs on a slower cadence than
    // opacity/orbit updates to keep linked nodes visually alive at lower cost.
    this.flameMotionInterval = Math.max(1 / 60, options.flameMotionInterval ?? (1 / 15));
    this._flameMotionAcc = 0;
    
    // Shared noise offsets (for subtle global coherence)
    this.globalTime = 0;
    this.globalNoiseOffset = {
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      z: Math.random() * 1000
    };
    
    // Performance tracking
    this.stats = {
      activeAuras: 0,
      lastUpdateTime: 0,
      avgUpdateTime: 0
    };

    // Reusable temp vector — eliminates per-vertex allocations in hot loop
    this._tmpVec3 = new THREE.Vector3();
    this._linkCountByNode = new Map();
    // Frame counter for throttled normal recomputation
    this._frameCounter = 0;

    this._initMetricSubscription();
    
    if (this.enabled) {
      console.log('[NodeAuraSystem] Initialized (ENABLED)');
    } else {
      console.log('[NodeAuraSystem] Initialized (DISABLED - use game.enableNodeAuras() to activate)');
    }
  }

  _initMetricSubscription() {
    const semanticBus = globalThis.semanticBus;
    const subscribe = semanticBus?.subscribe;
    if (typeof subscribe !== 'function') {
      return;
    }

    const handler = (payload = {}) => {
      const nodeId = payload?.nodeId;
      const metric = payload?.metric;
      const value = payload?.value;
      if (nodeId === undefined || nodeId === null || typeof metric !== 'string') {
        return;
      }
      const normalized = this._sanitizeMetric(metric, value);
      if (normalized === null) {
        return;
      }

      const key = String(nodeId);
      const cached = this._nodeMetricCache.get(key) ?? {};
      cached[metric] = normalized;
      this._nodeMetricCache.set(key, cached);
    };

    this._metricSubscriptionDisposer = subscribe.call(semanticBus, 'node.metric.updated', handler);
    this._hasMetricSubscription = true;
  }

  _sanitizeMetric(metric, value) {
    if (typeof value !== 'number' || !isFinite(value)) return null;
    switch (metric) {
      case 'synergy':
      case 'harmony':
      case 'stability':
      case 'corruption':
      case 'loadPressure':
        return Math.max(0, Math.min(1, value));
      default:
        return null;
    }
  }

  _getNodeMetricKey(node) {
    const key = node?.userData?.nodeId ?? node?.id ?? node?.uuid ?? null;
    return key === null ? null : String(key);
  }

  _getNodeMetric(node, metric, fallback = 0) {
    const fallbackValue = Math.max(0, Math.min(1, fallback));
    if (!this._hasMetricSubscription) {
      return fallbackValue;
    }

    const key = this._getNodeMetricKey(node);
    if (!key) {
      return fallbackValue;
    }

    const cached = this._nodeMetricCache.get(key);
    if (cached && typeof cached[metric] === 'number') {
      return cached[metric];
    }

    const nodeMetrics = node?.userData?.metrics;
    if (nodeMetrics) {
      const seeded = this._nodeMetricCache.get(key) ?? {};
      seeded.synergy = Math.max(0, Math.min(1, nodeMetrics.synergy ?? seeded.synergy ?? 0.5));
      seeded.harmony = Math.max(0, Math.min(1, nodeMetrics.harmony ?? seeded.harmony ?? 0.5));
      seeded.stability = Math.max(0, Math.min(1, nodeMetrics.stability ?? seeded.stability ?? 0.5));
      seeded.corruption = Math.max(
        0,
        Math.min(1, nodeMetrics.corruption ?? node?.userData?.metrics?.corruption ?? node?.userData?.corruption ?? seeded.corruption ?? 0)
      );
      seeded.loadPressure = Math.max(
        0,
        Math.min(1, nodeMetrics.loadPressure ?? nodeMetrics.load ?? nodeMetrics.loadRatio ?? seeded.loadPressure ?? 0)
      );
      this._nodeMetricCache.set(key, seeded);
      if (typeof seeded[metric] === 'number') {
        return seeded[metric];
      }
    }

    return fallbackValue;
  }

  /**
   * Set particle impact manager (for visual feedback when particles arrive)
   * @param {ImpactManagerCollection} impactManager
   */
  setImpactManager(impactManager) {
    this.impactManager = impactManager;
  }

  /**
   * Update all node auras - called every frame
   */
  update(deltaTime, nodes) {
    if (typeof window !== 'undefined' && window.ATOMA_VISUAL_BASELINE) return;
    if (!this.enabled) return;
    
    const startTime = performance.now();
    
    this.globalTime += deltaTime * 1.8; // Increased motion speed
    this._flameMotionAcc += deltaTime;
    this._frameCounter++;
    let activeCount = 0;
    const shouldRunFlameMotion = this._flameMotionAcc >= this.flameMotionInterval;
    const flameMotionDelta = shouldRunFlameMotion ? this._flameMotionAcc : 0;
    if (shouldRunFlameMotion) {
      this._flameMotionAcc = 0;
    }

    this._rebuildLinkCountCache();
    
    // Update existing auras and check for new nodes
    for (const node of nodes) {
      if (!node || !node.userData) continue;
      
      const linkCount = this.getNodeLinkCount(node);
      
      // Early exit: Node has no links
      if (linkCount === 0) {
        this.removeAura(node);
        continue;
      }
      
      // Node has links - ensure aura exists
      if (!this.nodeAuras.has(node)) {
        this.createAura(node);
      }
      
      // Update aura
      this.updateAura(node, linkCount, deltaTime, flameMotionDelta);
      activeCount++;
    }
    
    // Update stats
    this.stats.activeAuras = activeCount;
    this.stats.lastUpdateTime = performance.now() - startTime;
    this.stats.avgUpdateTime = this.stats.avgUpdateTime * 0.95 + this.stats.lastUpdateTime * 0.05;
  }
  
  /**
   * Get active link count for a node
   */
  getNodeLinkCount(node) {
    return this._linkCountByNode.get(node) || 0;
  }

  _rebuildLinkCountCache() {
    this._linkCountByNode.clear();
    const links = this.linkingSystem?.links;
    if (!Array.isArray(links) || links.length === 0) return;

    for (let i = 0, len = links.length; i < len; i++) {
      const link = links[i];
      if (!link?.active) continue;

      const source = link.source || link.sourceNode || link.nodeA || null;
      const target = link.target || link.targetNode || link.nodeB || null;

      if (source) {
        this._linkCountByNode.set(source, (this._linkCountByNode.get(source) || 0) + 1);
      }
      if (target) {
        this._linkCountByNode.set(target, (this._linkCountByNode.get(target) || 0) + 1);
      }
    }
  }
  
  /**
   * Create aura for a node
   */
  createAura(node) {
    // Create torn, irregular mesh geometry (detail=2 for richer flame motion)
    const geometry = this.createTornAuraGeometry();
    
    // PHASE S-5: Variant properties set at creation time, then frozen
    // NO runtime mutations to transparent, depthWrite, depthTest, side, blending allowed
    const material = createMultiBandFresnelRimAura({
      auraColor: this.visualParams.color.clone(),
      edgeColor: this.visualParams.accentColor.clone(),
      coreColor: this.visualParams.coreColor.clone(),
      rimPower1: 1.2,
      rimPower2: 2.8,
      rimPower3: 5.5,
    });
    
    // Freeze variant properties immediately after material creation
    material.userData = material.userData || {};
    material.userData.__owner = 'NodeLinkedAuraSystem';
    material.userData.__domain = 'aura';
    freezeMaterialFlags(material, 'NodeLinkedAuraSystem');
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(node.position);
    mesh.scale.setScalar(this.visualParams.baseScale * node.scale.x);
    mesh.userData = {
      isNodeAura: true,
      nodeRef: node,
      auraLayer: 'AURA_LINKED'
    };
    
    // segmented orbit rings (reactor effect)
    const orbit = new NodeSegmentedOrbitRings(
        this.scene,
        node.position,
        {
            radius: node.scale.x * 1.85,
            segmentCount: 48
        }
    );
    
    // Add orbit as child of aura mesh (orbits automatically follow node)
    mesh.add(orbit.mesh);
    // SACRED_ORBIT: Add inner particle trail as child of aura mesh
    const trailMesh = orbit.getTrailMesh();
    if (trailMesh) mesh.add(trailMesh);
    
    this.scene.add(mesh);
    try {
      mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_SKIN');
    } catch (e) {
      mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_SKIN');
    }
    
    // Store aura data
    const auraData = {
      mesh,
      geometry,
      material,
      orbit,
      originalPositions: geometry.attributes.position.array.slice(),  // Clone for reset
      linkCount: 0,
      
      // Motion state
      phase: Math.random() * Math.PI * 2,  // Random starting phase
      noiseOffset: {
        x: Math.random() * 100,
        y: Math.random() * 100,
        z: Math.random() * 100
      },
      
      // Animation state
      motionAmplitude: this.motionParams.baseAmplitude,
      targetAmplitude: this.motionParams.baseAmplitude,
      flameMotionInitialized: false,
      
      // Link spike state
      spikeActive: false,
      spikeProgress: 0,
      
      // Harmonic sync state
      harmonicPhase: 0,
      harmonicInfluence: 0,
      
      // Corruption influence state
      corruptionInfluence: 0,
      harmonyDampen: 1.0
    };
    
    this.nodeAuras.set(node, auraData);
  }
  
  /**
   * Create torn, irregular aura geometry
   * Generates an organic, uneven mesh shell (NOT a smooth sphere)
   */
  createTornAuraGeometry() {
    // ATOMA_AURA_v2: detail=2 for 162 vertices → richer flame motion
    const geometry = new THREE.IcosahedronGeometry(1, 2);
    
    // Distort to create torn, irregular appearance
    const positions = geometry.attributes.position;
    const count = positions.count;
    
    for (let i = 0; i < count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      // Irregular scaling (creates torn silhouette)
      const angle = Math.atan2(y, x);
      const elevation = Math.asin(z);
      
      // Create gaps and thickness variation
      const irregularity = 
        Math.sin(angle * 3.7) * 0.15 +
        Math.cos(elevation * 4.2) * 0.12 +
        Math.sin(angle * 7.1 + elevation * 5.3) * 0.08;
      
      const scale = 1.0 + irregularity;
      
      positions.setXYZ(i, x * scale, y * scale, z * scale);
    }
    
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  /**
   * Update aura motion and appearance
   */
  updateAura(node, linkCount, deltaTime, flameMotionDelta = 0) {
    const auraData = this.nodeAuras.get(node);
    if (!auraData) return;
    
    // Lazy create orbit rings if aura already exists but orbit was not created
    if (!auraData.orbit) {
      const orbit = new NodeSegmentedOrbitRings(
        this.scene,
        node.position,
        {
          radius: node.scale.x * 1.85,
          segmentCount: 48
        }
      );
      
      auraData.mesh.add(orbit.mesh);
      // SACRED_ORBIT: Add inner particle trail
      const trailMesh = orbit.getTrailMesh();
      if (trailMesh) auraData.mesh.add(trailMesh);
      auraData.orbit = orbit;
    }
    
    // Update link count
    const linkCountChanged = auraData.linkCount !== linkCount;
    if (linkCountChanged) {
      const wasLower = auraData.linkCount < linkCount;
      auraData.linkCount = linkCount;
      
      // Trigger link creation spike if new link added
      if (wasLower) {
        this.triggerLinkSpike(auraData);
      }
    }
    
    // Calculate corruption influence (0-1, defaults to 0 if not set)
    const corruptionLevel = this._getNodeMetric(
      node,
      'corruption',
      node.userData?.metrics?.corruption ?? node.userData?.corruption ?? 0
    );
    
    // Calculate harmony dampening (reduces corruption visual effect)
    const harmonyLevel = resolveLinkedAuraHarmonyValue(node);
    const harmonyBand = resolveLinkedAuraHarmonyBand(harmonyLevel, this.visualParams.harmonyBands);
    const harmonyDampen = 1.0 - (harmonyLevel * 0.4);  // Up to 40% reduction at max harmony
    
    // Effective corruption after harmony dampening
    const effectiveCorruption = corruptionLevel * harmonyDampen;
    
    // Store for noise layer use
    auraData.corruptionInfluence = effectiveCorruption;
    auraData.harmonyDampen = harmonyDampen;
    auraData.harmonyBand = harmonyBand.name;
    auraData.harmonyBandOpacityMultiplier = harmonyBand.opacityMultiplier;
    
    // ========================================================================
    // PARTICLE IMPACT INTEGRATION (WITH ADAPTIVE SCALING & RIPPLE)
    // ========================================================================
    // Query impact manager for active impacts on this node
    // Impacts are temporary modifiers that fade over 150-220ms (polished timing)
    // Adaptive scaling based on node stability (corruption/harmony balance)
    let impactAmplitude = 0;
    let impactInfluence = 0;
    let incomingDirection = null;
    let rippleAmplitude = 0;
    let rippleTriggerTime = -1;
    let nodeStability = 0.5;  // Default: neutral
    
    if (this.impactManager && node.userData?.nodeId !== undefined) {
      // ====================================================================
      // DERIVE STABILITY FROM NODE STATE
      // ====================================================================
      // Stability = inverse of corruption, modulated by harmony
      // Range: 0 (unstable, corrupted) to 1 (stable, harmonious)
      const corruption = corruptionLevel;  // Reuse already-computed corruption (line 487)
      const harmony = this._getNodeMetric(node, 'harmony', node.userData?.metrics?.harmony ?? 0);
      
      // Stability: start from (1 - corruption), boost with harmony
      // = harmony helps stabilize even corrupted nodes
      nodeStability = (1.0 - corruption) * 0.6 + harmony * 0.4;  // Weighted average
      nodeStability = Math.max(0, Math.min(1, nodeStability));
      
      // Query impact manager with stability for adaptive scaling
      const shaderState = this.impactManager.getShaderState(node.userData.nodeId, nodeStability);
      
      if (shaderState) {
        // Impact displacement: -0.3 (contraction) to +0.2 (expansion)
        // Now scaled adaptively based on node stability
        impactAmplitude = shaderState.displacementFactor;
        
        // Impact influence: combine corruption and harmony biases
        // Used to modulate opacity and motion during impact
        impactInfluence = Math.max(
          shaderState.corruptionBias,  // Red tint from corruption arrival
          shaderState.harmonyBias       // Cyan tint from harmony arrival
        );
        
        // Incoming direction: for directional bias toward incoming link
        // Vertices facing the incoming direction react stronger
        incomingDirection = shaderState.incomingDirection;
        
        // Ripple effect data: internal wave triggered on impact
        rippleAmplitude = shaderState.rippleAmplitude ?? 0;
        rippleTriggerTime = shaderState.rippleTriggerTime ?? -1;
      }
    }
    
    // Store impact influence and direction for use in motion calculations
    auraData.impactAmplitude = impactAmplitude;
    auraData.impactInfluence = impactInfluence;
    auraData.incomingDirection = incomingDirection;  // Direction bias for deformation
    auraData.rippleAmplitude = rippleAmplitude;      // Ripple strength [0-1]
    auraData.rippleTriggerTime = rippleTriggerTime;  // When ripple started
    auraData.nodeStability = nodeStability;          // Current stability for debugging
    
    // Update motion amplitude (scales with link count, 1-4 max)
    const linkInfluence = Math.min(linkCount, 4) / 4;
    const linkStrength = 0.4 + linkInfluence * 0.6; // Prevent weak single-link look
    auraData.targetAmplitude = THREE.MathUtils.lerp(
      this.motionParams.baseAmplitude,
      this.motionParams.maxAmplitude,
      linkStrength * 0.5
    );
    
    // Smooth amplitude transition
    auraData.motionAmplitude = THREE.MathUtils.lerp(
      auraData.motionAmplitude,
      auraData.targetAmplitude,
      deltaTime * 2
    );
    
    // Update link spike animation
    if (auraData.spikeActive) {
      auraData.spikeProgress += deltaTime / this.motionParams.linkSpikeDuration;
      
      if (auraData.spikeProgress >= 1) {
        auraData.spikeActive = false;
        auraData.spikeProgress = 0;
      }
    }
    
    // Update phase
    auraData.phase += deltaTime;
    
    // Update mesh transform
    auraData.mesh.position.copy(node.position);
    const scalePulse = 1.0 + Math.sin(this.globalTime * 1.5) * 0.06;
    auraData.mesh.scale.setScalar(this.visualParams.baseScale * node.scale.x * scalePulse);
    auraData.mesh.rotation.y += deltaTime * 0.3 * linkStrength;
    
    // ATOMA_AURA_v2: Update shader time uniform for breathing/shimmer
    if (auraData.material.uniforms && auraData.material.uniforms.uTime) {
      auraData.material.uniforms.uTime.value = this.globalTime;
    }
    
    // Apply heavy flame-like vertex deformation at a reduced cadence while
    // keeping cheaper transform/opacity/orbit updates on the visual cadence.
    if (!auraData.flameMotionInitialized || flameMotionDelta > 0) {
      this.applyFlameMotion(auraData, flameMotionDelta > 0 ? flameMotionDelta : deltaTime);
      auraData.flameMotionInitialized = true;
    }
    
    // Update opacity based on link count
    let targetOpacity = THREE.MathUtils.lerp(
      this.visualParams.minOpacity,
      this.visualParams.maxOpacity,
      linkStrength
    );
    targetOpacity *= harmonyBand.opacityMultiplier;
    
    // Apply opacity boost during link creation spike
    if (auraData.spikeActive) {
      const t = auraData.spikeProgress;
      // Smoothstep envelope for smooth boost (0→1→0)
      const envelope = t < 0.5 
        ? 2 * t * t  // Ease in
        : 1 - 2 * (t - 0.5) * (t - 0.5);  // Ease out
      
      // Add 30% opacity boost during spike
      const opacityBoost = envelope * 0.3 * this.visualParams.maxOpacity;
      targetOpacity = Math.min(targetOpacity + opacityBoost, this.visualParams.maxOpacity * 1.35);
    }
    
    // Apply corruption-based opacity unevenness, dampened by harmony (subtle, non-flickering)
    const corruption = auraData.corruptionInfluence ?? 0;  // ✅ FIX: Define corruption locally
    if (corruption > 0 || auraData.harmonyDampen < 1.0) {
      // Calculate harmony stabilization for opacity (opposite of corruption effect)
      const harmonyStabilizationOpacity = auraData.harmonyDampen > 1.0 ? 0 : (1.0 - auraData.harmonyDampen);
      
      // Use slow oscillation based on corruption + phase for subtle variation
      // Harmony reduces the oscillation amplitude
      const corruptionOscillation = Math.sin(this.globalTime * 0.5 + auraData.phase) * corruption * 0.15;
      const harmonyOpacityStabilization = Math.sin(this.globalTime * 0.5 + auraData.phase) * harmonyStabilizationOpacity * 0.08;  // Up to 8% smoothing
      
      const netOpacityOscillation = corruptionOscillation - harmonyOpacityStabilization;
      targetOpacity += netOpacityOscillation;
      targetOpacity = Math.max(this.visualParams.minOpacity * 0.5, Math.min(this.visualParams.maxOpacity * 1.35, targetOpacity));
    }
    
    // ATOMA_AURA_v2: Gentler pulse modulation (was 0.6 floor, too aggressive)
    const pulse = 0.78 + Math.sin(this.globalTime * 2.0) * 0.22;
    targetOpacity *= pulse;

    auraData.material.opacity = THREE.MathUtils.lerp(
      auraData.material.opacity,
      targetOpacity,
      deltaTime * 3
    );
    
    // Debug wireframe
    if (this.debugMode) {
      auraData.material.wireframe = true;
      auraData.material.opacity = 0.3;
    } else {
      auraData.material.wireframe = false;
    }
    
    // update orbit reactor ring
    if (auraData.orbit) {
        auraData.orbit.update();
    }
  }
  
  /**
   * Apply flame-like motion to aura vertices
   * Uses layered noise for organic, unpredictable movement
   * Corruption affects irregularity and phase instability
   * Harmony stabilizes and smooths motion, counteracting corruption
   */
  applyFlameMotion(auraData, deltaTime) {
    const positions = auraData.geometry.attributes.position;
    const original = auraData.originalPositions;
    const count = positions.count;
    const tmpVec = this._tmpVec3;

    // Get corruption influence
    const corruption = auraData.corruptionInfluence ?? 0;

    // Get harmony stabilization (0-0.4, higher = more stabilized motion)
    const harmonyStabilization = auraData.harmonyDampen > 1.0 ? 0 : (1.0 - auraData.harmonyDampen);

    // ========================================================================
    // HOISTED: All constant computations — identical for every vertex,
    // previously recomputed 162× per frame. Now computed once.
    // ========================================================================

    // Motion multiplier (link spike + particle impacts)
    let motionMultiplier = 1.0;

    if (auraData.spikeActive) {
      const t = auraData.spikeProgress;
      const envelope = t < 0.3
        ? t / 0.3
        : 1.0 - ((t - 0.3) / 0.7) * 0.7;
      motionMultiplier += envelope * 1.5;
    }

    if (auraData.impactInfluence > 0) {
      motionMultiplier += auraData.impactAmplitude * 2.0;
    }

    const amplitude = auraData.motionAmplitude * motionMultiplier;

    // Pre-compute phase shifts (constant across all vertices)
    const corruptionPhaseShift = corruption * this.globalTime * 0.3;
    const harmonyPhaseAlignment = harmonyStabilization * this.globalTime * 0.15;
    const phaseShiftBlend = corruptionPhaseShift - harmonyPhaseAlignment;

    // Layer 1 constants
    const time1 = this.globalTime * this.motionParams.baseFreqX * (1.0 - corruption * 0.15 + harmonyStabilization * 0.08);
    const time1Y = time1 * this.motionParams.baseFreqY;
    const time1Z = time1 * this.motionParams.baseFreqZ;
    const phaseBlendL1 = phaseShiftBlend * 0.2;

    // Layer 2 constants
    const time2 = this.globalTime * 0.8 * (1.0 - corruption * 0.1 + harmonyStabilization * 0.05);
    const layer2Amplitude = 0.5 + corruption * 0.3 - harmonyStabilization * 0.2;
    const time2Y = time2 * 1.2;
    const phaseBlendL2X = phaseShiftBlend * 0.4;
    const phaseBlendL2Y = phaseShiftBlend * 0.3;
    const phaseBlendL2Z = phaseShiftBlend * 0.5;

    // Layer 3 constants
    const time3 = this.globalTime * 1.5 * (1.0 - corruption * 0.2 + harmonyStabilization * 0.1);
    const layer3Amplitude = 0.2 + corruption * 0.15 - harmonyStabilization * 0.1;
    const phaseBlendL3X = phaseShiftBlend;
    const phaseBlendL3Y = phaseShiftBlend * 0.6;
    const phaseBlendL3Z = phaseShiftBlend * 0.8;

    // Drift bias (constant for all vertices)
    const driftAmplitudeProduct = this.motionParams.upwardDriftBias
      * (1.0 - corruption * 0.5 + harmonyStabilization * 0.3)
      * amplitude;

    // Breath phase (constant for all vertices)
    const breathPhase = Math.sin(this.globalTime * this.motionParams.driftFrequency + auraData.phase);
    const radialStretch = 1.0 + breathPhase * 0.03;

    // Pre-compute ripple state (constant for all vertices — was checked 162× per frame)
    let rippleActive = false;
    let rippleWavefront = 0;
    let waveWidth = 0;
    let rippleStrengthScale = 0;

    if (auraData.rippleAmplitude > 0 && auraData.rippleTriggerTime >= 0) {
      const rippleElapsed = this.globalTime - auraData.rippleTriggerTime;
      if (rippleElapsed >= 0 && rippleElapsed < 0.3) {
        rippleActive = true;
        const ripplePhase = rippleElapsed / 0.3;

        // Visibility envelope
        let visibilityEnvelope = 0.0;
        if (ripplePhase < 0.4) {
          visibilityEnvelope = Math.sin((ripplePhase / 0.4) * Math.PI / 2.0);
        } else if (ripplePhase < 0.7) {
          const decayProgress = (ripplePhase - 0.4) / 0.3;
          visibilityEnvelope = 1.0 - decayProgress * decayProgress;
        } else {
          const finalFadeProgress = (ripplePhase - 0.7) / 0.3;
          visibilityEnvelope = Math.max(0, 1.0 - finalFadeProgress * finalFadeProgress);
        }

        const contrastBoostFactor = visibilityEnvelope > 0.5 ? 2.2 : 1.0;
        const rippleFade = 1.0 - ripplePhase;
        rippleWavefront = ripplePhase * 1.5;
        waveWidth = 0.3;
        rippleStrengthScale = auraData.rippleAmplitude
          * rippleFade
          * 0.08
          * (1.0 + visibilityEnvelope * 0.4)
          * contrastBoostFactor;
      }
    }

    // Pre-compute directional impact data (constant for all vertices)
    const hasDirectionalImpact = auraData.impactInfluence > 0 && auraData.incomingDirection;
    const impactFactorBase = hasDirectionalImpact
      ? auraData.impactAmplitude * 2.0 * auraData.impactInfluence
      : 0;
    const incomingDir = hasDirectionalImpact ? auraData.incomingDirection : null;

    // ========================================================================
    // VERTEX LOOP — only per-vertex work remains
    // ========================================================================
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const origX = original[i3];
      const origY = original[i3 + 1];
      const origZ = original[i3 + 2];

      // Per-vertex noise seeds
      const noiseX = auraData.noiseOffset.x + origX * 2;
      const noiseY = auraData.noiseOffset.y + origY * 2;
      const noiseZ = auraData.noiseOffset.z + origZ * 2;

      // Layer 1: Base curl (low frequency)
      const noise1X = simplexNoise3D(noiseX + time1 + phaseBlendL1, noiseY, noiseZ);
      const noise1Y = simplexNoise3D(noiseX, noiseY + time1Y, noiseZ);
      const noise1Z = simplexNoise3D(noiseX, noiseY, noiseZ + time1Z);

      // Layer 2: Medium frequency detail (licking motion)
      const n2x = noiseX * 2.1;
      const n2y = noiseY * 2.1;
      const n2z = noiseZ * 2.1;
      const noise2X = simplexNoise3D(n2x + time2 + phaseBlendL2X, n2y, n2z) * layer2Amplitude;
      const noise2Y = simplexNoise3D(n2x, n2y + time2Y + phaseBlendL2Y, n2z) * layer2Amplitude;
      const noise2Z = simplexNoise3D(n2x, n2y, n2z + time2 + phaseBlendL2Z) * layer2Amplitude;

      // Layer 3: High frequency shimmer (subtle)
      const n3x = noiseX * 4.3;
      const n3y = noiseY * 4.3;
      const n3z = noiseZ * 4.3;
      const noise3X = simplexNoise3D(n3x + time3 + phaseBlendL3X, n3y, n3z) * layer3Amplitude;
      const noise3Y = simplexNoise3D(n3x, n3y + time3 + phaseBlendL3Y, n3z) * layer3Amplitude;
      const noise3Z = simplexNoise3D(n3x, n3y, n3z + time3 + phaseBlendL3Z) * layer3Amplitude;

      // Combine layers with upward bias (flame drift)
      let offsetX = (noise1X + noise2X + noise3X) * amplitude;
      let offsetY = (noise1Y + noise2Y + noise3Y) * amplitude;
      let offsetZ = (noise1Z + noise2Z + noise3Z) * amplitude;

      // Directional bias from incoming particle impact
      if (hasDirectionalImpact) {
        tmpVec.set(origX, origY, origZ).normalize();
        const directionBias = Math.max(0, tmpVec.dot(incomingDir));
        const smoothBias = directionBias * directionBias;
        const directionModulation = 0.7 + smoothBias * 0.6;  // lerp(0.7, 1.3, smoothBias)
        const impactFactor = impactFactorBase * directionModulation;
        offsetX += origX * impactFactor;
        offsetY += origY * impactFactor;
        offsetZ += origZ * impactFactor;
      }

      // Upward drift bias (flame tendency)
      offsetY += driftAmplitudeProduct * (origY + 1) * 0.5;

      // Micro ripple effect — internal pressure wave on impact
      if (rippleActive) {
        const distFromCenter = Math.sqrt(origX * origX + origY * origY + origZ * origZ);
        const distanceFromWave = Math.abs(distFromCenter - rippleWavefront);
        const waveSharpness = Math.max(0, 1.0 - distanceFromWave / waveWidth);
        const sharpedWaveSharpness = Math.pow(waveSharpness, 1.4);
        const waveOscillation = Math.sin(sharpedWaveSharpness * Math.PI * 3.0);

        const rippleStrength = rippleStrengthScale * sharpedWaveSharpness * waveOscillation;

        tmpVec.set(origX, origY, origZ).normalize();
        offsetX += tmpVec.x * rippleStrength;
        offsetY += tmpVec.y * rippleStrength;
        offsetZ += tmpVec.z * rippleStrength;
      }

      // Apply stretch + offsets
      positions.setXYZ(
        i,
        origX * radialStretch + offsetX,
        origY * radialStretch + offsetY,
        origZ * radialStretch + offsetZ
      );
    }

    positions.needsUpdate = true;

    // Throttle normal recomputation to every 2nd frame (halves cost, minimal visual difference
    // for a translucent noise-driven aura with Fresnel rim lighting)
    if (this._frameCounter & 1) {
      auraData.geometry.computeVertexNormals();
    }
  }
  
  /**
   * Trigger link creation spike (brief motion increase)
   */
  triggerLinkSpike(auraData) {
    auraData.spikeActive = true;
    auraData.spikeProgress = 0;
  }
  
  /**
   * Remove aura from node
   */
  removeAura(node) {
    const auraData = this.nodeAuras.get(node);
    if (!auraData) return;
    
    // Remove from scene
    this.scene.remove(auraData.mesh);
    
    // Dispose resources
    auraData.geometry.dispose();
    auraData.material.dispose();
    
    // Dispose orbit rings
    if (auraData.orbit) {
        // Remove from parent before disposing
        if (auraData.orbit.mesh.parent) {
            auraData.orbit.mesh.parent.remove(auraData.orbit.mesh);
        }
        auraData.orbit.dispose();
    }
    
    // Remove from tracking
    this.nodeAuras.delete(node);
  }
  
  // simplexNoise3D extracted to standalone function (top of file) for
  // zero method-dispatch overhead in the hot vertex loop.
  
  /**
   * Enable/disable aura system
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    if (!enabled) {
      // Remove all auras
      for (const [node, auraData] of this.nodeAuras.entries()) {
        this.removeAura(node);
      }
    }
    
    console.log(`[NodeAuraSystem] ${enabled ? 'Enabled' : 'Disabled'}`);
  }
  
  /**
   * Toggle debug mode (wireframe + bounds)
   */
  toggleDebug() {
    this.debugMode = !this.debugMode;
    console.log(`[NodeAuraSystem] Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
    return this.debugMode;
  }
  
  /**
   * Get system status
   */
  getStatus() {
    // Count active spikes, corruption influenced auras, and harmony stabilized auras
    let activeSpikes = 0;
    let corruptedAuras = 0;
    let harmonizedAuras = 0;
    let maxCorruption = 0;
    let maxHarmonyStabilization = 0;
    
    for (const [node, auraData] of this.nodeAuras.entries()) {
      if (auraData.spikeActive) {
        activeSpikes++;
      }
      if (auraData.corruptionInfluence > 0) {
        corruptedAuras++;
        maxCorruption = Math.max(maxCorruption, auraData.corruptionInfluence);
      }
      // Harmony stabilization is inverse of harmonyDampen (0-0.4 range)
      const harmonyStab = auraData.harmonyDampen > 1.0 ? 0 : (1.0 - auraData.harmonyDampen);
      if (harmonyStab > 0) {
        harmonizedAuras++;
        maxHarmonyStabilization = Math.max(maxHarmonyStabilization, harmonyStab);
      }
    }
    
    return {
      enabled: this.enabled,
      activeAuras: this.stats.activeAuras,
      activeSpikes: activeSpikes,
      corruptedAuras: corruptedAuras,
      maxCorruptionInfluence: maxCorruption.toFixed(3),
      harmonizedAuras: harmonizedAuras,
      maxHarmonyStabilization: maxHarmonyStabilization.toFixed(3),
      lastUpdateTime: this.stats.lastUpdateTime.toFixed(2) + 'ms',
      avgUpdateTime: this.stats.avgUpdateTime.toFixed(2) + 'ms',
      debugMode: this.debugMode
    };
  }
  
  /**
   * Dispose system
   */
  dispose() {
    // Remove all auras
    for (const [node, auraData] of this.nodeAuras.entries()) {
      this.removeAura(node);
    }
    
    this.nodeAuras.clear();
    if (typeof this._metricSubscriptionDisposer === 'function') {
      this._metricSubscriptionDisposer();
    }
    this._metricSubscriptionDisposer = null;
    this._nodeMetricCache.clear();
    
    console.log('[NodeAuraSystem] Disposed');
  }
}
