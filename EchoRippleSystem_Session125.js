import * as THREE from 'three';
import { ImpactManagerCollection } from './NodeImpactManager.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

const toVector3 = (value) => {
  if (!value) return null;
  if (value.isVector3) return value.clone();
  if (Array.isArray(value) && value.length >= 3) {
    return new THREE.Vector3(value[0], value[1], value[2]);
  }
  if (typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number') {
    return new THREE.Vector3(value.x, value.y, value.z);
  }
  return null;
};

const toColor = (value, fallback) => {
  if (value?.isColor) return value.clone();
  if (typeof value === 'number' || typeof value === 'string') {
    return new THREE.Color(value);
  }
  return fallback.clone();
};

export class EchoRippleSystem_Session125 {
  constructor(scene, world, linkResonanceSystem, nodeAuraSystem, config = {}) {
    this.scene = scene || null;
    this.world = world || null;
    this.linkResonanceSystem = linkResonanceSystem || null;
    this.nodeAuraSystem = nodeAuraSystem || null;

    this.config = {
      enabled: true,
      debugMode: false,
      maxRipplesPerNode: 6,
      maxTotalRipples: 96,
      maxPropagationDepth: 2,
      maxPropagationBranches: 3,
      minPropagationIntensity: 0.18,
      globalCooldownSeconds: 0.05,
      nodeCooldownSeconds: 0.24,
      linkCooldownSeconds: 0.32,
      propagationDelay: 0.16,
      propagationDecay: 0.72,
      rippleLifetime: 0.92,
      rippleStartRadius: 0.10,
      rippleMaxRadius: 1.6,
      rippleRadiusVariance: 0.18,
      rippleHaloScale: 1.05,
      rippleOpacity: 0.34,
      rippleHaloOpacity: 0.14,
      rippleCoreOpacity: 0.22,
      rippleVerticalOffset: 0.055,
      auraDeformationStrength: 0.35,
      auraImpactDuration: 0.18,
      rippleColor: new THREE.Color(0xb090ff),     // Quantum spectral violet
      haloColor: new THREE.Color(0xfff0d0),       // Spectral white-gold
      corruptionColor: new THREE.Color(0xcc0030),  // Void crimson
      harmonyColor: new THREE.Color(0x40e0d0),     // Celestial teal
      cascadeColor: new THREE.Color(0xffd700),     // Sacred gold

      // ── LoadPressure autonomous spawning ──
      loadPressureSpawn: {
        enabled: true,
        threshold: 0.55,           // loadPressure >= this triggers spawning
        interval: 3.0,             // seconds between spawns per node
        intensity: 0.6,            // base intensity of spawned ripples
        maxConcurrentPerNode: 3,   // max active loadPressure ripples per node
        kind: 'loadPressure',      // ripple kind identifier
        color: new THREE.Color(0xe0a040),  // Arcane amber for pressure ripples
      },

      // ── Visual upgrade config ──
      chromaticShift: 0.18,        // color shift intensity over lifetime
      energyShimmerSpeed: 6.0,     // radial shimmer oscillation speed
      glowPulseFreq: 4.2,          // brightness pulse frequency
      echoRingEnabled: true,       // outer echo ring for depth
      echoRingScale: 1.38,         // scale multiplier for echo ring
      echoRingOpacity: 0.12,       // base opacity of echo ring

      // ── Quantum Echo Resonance Upgrade ──
      enableQuantumEcho: config.enableQuantumEcho ?? true,
      quantumSpectrumHues: [0.75, 0.55, 0.12, 0.97], // mystic violet, arcane teal, sacred gold, ritual crimson
      quantumCycleSpeed: config.quantumCycleSpeed ?? 0.08,

      ...config
    };

    this.config.rippleColor = toColor(this.config.rippleColor, new THREE.Color(0x86f5ff));
    this.config.haloColor = toColor(this.config.haloColor, new THREE.Color(0xe8feff));
    this.config.corruptionColor = toColor(this.config.corruptionColor, new THREE.Color(0xff685d));
    this.config.harmonyColor = toColor(this.config.harmonyColor, new THREE.Color(0x86f5ff));
    this.config.cascadeColor = toColor(this.config.cascadeColor, new THREE.Color(0xffb781));

    this.stats = {
      activeRipples: 0,
      spawnedRipples: 0,
      propagatedRipples: 0,
      suppressedRipples: 0,
      droppedRipples: 0
    };

    this._disposed = false;
    this._elapsedTime = 0;
    this._quantumPhase = 0; // Quantum echo spectral cycling
    this._globalCooldownUntil = -Infinity;
    this._nodeCooldownUntilById = new Map();
    this._linkCooldownUntilById = new Map();
    this._nodeActiveRippleCounts = new Map();
    this._pendingPropagationEvents = [];
    this._activeRipples = [];
    this._ripplePool = [];
    this._previousImpactManager = null;
    this._ownsImpactManager = false;
    this._impactManager = null;

    // ── LoadPressure spawn state ──
    this._lpSpawnTimers = new Map();       // nodeId → lastSpawnTime
    this._lpActiveCounts = new Map();      // nodeId → active loadPressure ripple count
    this._lpNodesCache = null;             // cached node array
    this._lpNodesCacheTime = -Infinity;    // cache refresh timestamp
    this._lpNodesCacheInterval = 2.0;      // seconds between cache refreshes

    this._sceneRoot = new THREE.Group();
    this._sceneRoot.name = 'EchoRippleSystem_Session125';
    this._sceneRoot.frustumCulled = false;
    this._sceneRoot.visible = true;
    this._sceneRoot.userData.isEchoRippleSystem = true;
    this._sceneRoot.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_CASCADE);

    // Hexagonal rings instead of round — echoes have angular, crystalline character
    this._ringGeometry = new THREE.RingGeometry(0.82, 1.0, 6, 1);  // 6 sides = hexagonal echo
    this._haloGeometry = new THREE.RingGeometry(0.74, 1.0, 8, 1);  // 8 sides = octagonal halo
    this._coreGeometry = new THREE.CircleGeometry(1.0, 6);  // Hexagonal core
    this._ringGeometry.rotateX(-Math.PI / 2);
    this._haloGeometry.rotateX(-Math.PI / 2);
    this._coreGeometry.rotateX(-Math.PI / 2);

    this._attachScene(this.scene);
    this._attachImpactManager(this.nodeAuraSystem);
  }

  rebindScene(scene) {
    if (!scene || scene === this.scene) return;
    this._attachScene(scene);
  }

  setEnabled(enabled) {
    this.config.enabled = enabled !== false;
    return this.config.enabled;
  }

  toggleDebug(enabled = null) {
    this.config.debugMode = enabled === null ? !this.config.debugMode : enabled !== false;
    return this.config.debugMode;
  }

  attachNodeAuraSystem(nodeAuraSystem) {
    this.nodeAuraSystem = nodeAuraSystem || null;
    this._attachImpactManager(this.nodeAuraSystem);
  }

  update(deltaTime, links = null, camera = null) {
    if (this._disposed || !this.config.enabled) return;

    const delta = Number.isFinite(deltaTime) ? Math.max(0, deltaTime) : 0;
    this._elapsedTime += delta;

    // ── Quantum Echo: advance spectral phase ──
    if (this.config.enableQuantumEcho) {
      this._quantumPhase = (this._quantumPhase + delta * this.config.quantumCycleSpeed) % 1.0;
    }

    if (this._sceneRoot.parent !== this.scene && this.scene) {
      this._attachScene(this.scene);
    }

    if (this._impactManager?.update) {
      this._impactManager.update(this._elapsedTime);
    }

    this._processPropagationQueue(links);
    this._updateRipples(delta, camera, links);
    this._updateLoadPressureSpawning(delta);

    this.stats.activeRipples = this._activeRipples.length;
  }

  getStats() {
    return {
      enabled: !!this.config.enabled,
      disposed: !!this._disposed,
      activeRipples: this._activeRipples.length,
      pendingPropagationEvents: this._pendingPropagationEvents.length,
      spawnedRipples: this.stats.spawnedRipples,
      propagatedRipples: this.stats.propagatedRipples,
      suppressedRipples: this.stats.suppressedRipples,
      droppedRipples: this.stats.droppedRipples,
      loadPressureActiveNodes: this._lpActiveCounts.size,
      loadPressureTrackedNodes: this._lpSpawnTimers.size
    };
  }

  clear() {
    this._clearRipples(() => true);
    this._pendingPropagationEvents.length = 0;
    this._nodeCooldownUntilById.clear();
    this._linkCooldownUntilById.clear();
    this._nodeActiveRippleCounts.clear();
    this._lpSpawnTimers.clear();
    this._lpActiveCounts.clear();
    this._globalCooldownUntil = -Infinity;
  }

  clearLink(linkOrId, sourceNode = null, targetNode = null) {
    const linkId = this._resolveLinkId(linkOrId);
    const sourceId = this._resolveNodeId(sourceNode ?? linkOrId?.source ?? linkOrId?.sourceNode ?? linkOrId?.nodeA ?? null);
    const targetId = this._resolveNodeId(targetNode ?? linkOrId?.target ?? linkOrId?.targetNode ?? linkOrId?.nodeB ?? null);

    if (linkId) {
      this._linkCooldownUntilById.delete(linkId);
    }

    this._clearRipples((ripple) => {
      if (!ripple) return false;
      if (linkId && ripple.linkId && ripple.linkId === linkId) return true;
      if (sourceId && ripple.nodeId && ripple.nodeId === sourceId) return true;
      if (targetId && ripple.nodeId && ripple.nodeId === targetId) return true;
      if (sourceId && ripple.originNodeId && ripple.originNodeId === sourceId) return true;
      if (targetId && ripple.originNodeId && ripple.originNodeId === targetId) return true;
      return false;
    });

    if (linkId) {
      this._pendingPropagationEvents = this._pendingPropagationEvents.filter((event) => event.linkId !== linkId);
    }
  }

  dispose() {
    if (this._disposed) return;

    this._disposed = true;
    this.clear();

    for (const ripple of this._ripplePool) {
      this._disposeRippleTemplate(ripple);
    }
    this._ripplePool.length = 0;
    this._activeRipples.length = 0;
    this._pendingPropagationEvents.length = 0;

    if (this._sceneRoot?.parent) {
      this._sceneRoot.parent.remove(this._sceneRoot);
    }

    this._disposeGeometry(this._ringGeometry);
    this._disposeGeometry(this._haloGeometry);
    this._disposeGeometry(this._coreGeometry);

    if (this._ownsImpactManager && this.nodeAuraSystem?.setImpactManager) {
      this.nodeAuraSystem.setImpactManager(this._previousImpactManager || null);
    }

    this._impactManager = null;
    this._sceneRoot = null;
  }

  spawnRippleOnWaveBurst(link, pulse = null) {
    if (this._disposed || !this.config.enabled || !link) return null;
    if (!this._isLiveLink(link)) return null;

    const endpoints = this._resolveLinkEndpoints(link);
    const targetNode = endpoints.targetNode;
    const targetPosition = endpoints.targetPosition;
    const sourcePosition = endpoints.sourcePosition;
    const metrics = this._resolveLinkMetrics(link, pulse);
    const intensity = clamp01(
      pulse?.phaseAlpha ??
      pulse?.echoStrength ??
      pulse?.intensity ??
      metrics.synergy * 0.8 + (1 - metrics.corruption) * 0.2
    );

    return this.createRippleEffect(targetNode || targetPosition, {
      kind: 'waveBurst',
      intensity,
      color: this._resolveRippleColor('waveBurst', metrics, pulse),
      nodeId: targetNode ? this._resolveNodeId(targetNode) : this._resolveNodeId(targetPosition),
      originNodeId: this._resolveNodeId(endpoints.sourceNode),
      sourcePosition,
      targetPosition,
      link,
      linkId: this._resolveLinkId(link),
      pulse,
      metrics,
      depth: 0,
      path: this._buildPath([], this._resolveNodeId(endpoints.sourceNode), this._resolveNodeId(targetNode)),
      allowPropagation: true
    });
  }

  spawnRippleOnCascadeHop(node, intensity = 0.6, context = {}) {
    if (this._disposed || !this.config.enabled || !node) return null;
    if (this._getLiveNodeLinkCount(node) <= 0) return null;

    const nodeId = this._resolveNodeId(node);
    const position = this._resolvePosition(node);
    const metrics = this._resolveNodeMetrics(node, context);

    return this.createRippleEffect(node || position, {
      kind: 'cascadeHop',
      intensity: clamp01(context.intensity ?? intensity),
      color: this._resolveRippleColor('cascadeHop', metrics, context),
      nodeId,
      originNodeId: this._resolveNodeId(context.originNode ?? context.sourceNode ?? node),
      sourcePosition: this._resolvePosition(context.sourcePosition),
      targetPosition: position,
      link: context.link ?? null,
      linkId: this._resolveLinkId(context.link ?? context.linkId ?? null),
      pulse: context.pulse ?? null,
      metrics,
      depth: Number.isFinite(context.depth) ? Math.max(0, context.depth) : 0,
      path: this._buildPath(context.path ?? [], this._resolveNodeId(context.originNode ?? context.sourceNode ?? null), nodeId),
      allowPropagation: context.allowPropagation !== false
    });
  }

  createRippleEffect(positionOrNode, options = {}) {
    if (this._disposed || !this.config.enabled) return null;

    const currentTime = this._elapsedTime;
    const kind = options.kind || 'waveBurst';
    const intensity = clamp01(options.intensity ?? 0.5);
    const nodeId = this._resolveNodeId(options.nodeId ?? positionOrNode);
    const linkId = this._resolveLinkId(options.linkId ?? options.link);
    const anchor = this._resolvePosition(positionOrNode) || this._resolvePosition(options.targetPosition) || this._resolvePosition(options.sourcePosition);

    if (!anchor) {
      this.stats.droppedRipples += 1;
      return null;
    }

    if (!this._canSpawnRipple(currentTime, nodeId, linkId, kind)) {
      this.stats.suppressedRipples += 1;
      return null;
    }

    if (this._activeRipples.length >= Math.max(1, this.config.maxTotalRipples)) {
      this.stats.droppedRipples += 1;
      return null;
    }

    const ripple = this._getRippleFromPool();
    if (!ripple) {
      this.stats.droppedRipples += 1;
      return null;
    }

    const metrics = options.metrics || this._resolveNodeMetrics(positionOrNode, options);
    const color = toColor(options.color, this._resolveRippleColor(kind, metrics, options));
    const lifetime = Math.max(0.26, (options.lifetime ?? this.config.rippleLifetime) * (0.82 + intensity * 0.48));
    const startRadius = Math.max(0.08, options.startRadius ?? this.config.rippleStartRadius);
    const radiusVariance = 1 + ((options.depth ?? 0) * 0.14) + (intensity - 0.5) * (this.config.rippleRadiusVariance ?? 0.18);
    const maxRadius = Math.max(startRadius + 0.12, (options.maxRadius ?? this.config.rippleMaxRadius) * radiusVariance);
    const haloScale = Math.max(1.05, options.haloScale ?? this.config.rippleHaloScale);
    const baseOpacity = Math.max(0.05, options.opacity ?? this.config.rippleOpacity) * (0.72 + intensity * 0.55);
    const haloOpacity = Math.max(0.03, options.haloOpacity ?? this.config.rippleHaloOpacity) * (0.72 + intensity * 0.35);
    const coreOpacity = Math.max(0.05, options.coreOpacity ?? this.config.rippleCoreOpacity) * (0.55 + intensity * 0.4);
    const verticalOffset = Number.isFinite(options.verticalOffset) ? options.verticalOffset : this.config.rippleVerticalOffset;
    const sourcePosition = this._resolvePosition(options.sourcePosition);
    const direction = options.incomingDirection instanceof THREE.Vector3
      ? options.incomingDirection.clone().normalize()
      : (sourcePosition ? new THREE.Vector3().subVectors(anchor, sourcePosition).normalize() : null);

    ripple.active = true;
    ripple.kind = kind;
    ripple.nodeId = nodeId;
    ripple.originNodeId = this._resolveNodeId(options.originNodeId ?? options.originNode ?? options.sourceNode ?? nodeId);
    ripple.linkId = linkId;
    ripple.intensity = intensity;
    ripple.color.copy(color);
    ripple.metrics = metrics;
    ripple.depth = Number.isFinite(options.depth) ? Math.max(0, options.depth) : 0;
    ripple.path = Array.isArray(options.path) ? [...new Set(options.path.map((entry) => String(entry)))] : [];
    ripple.allowPropagation = options.allowPropagation !== false;
    ripple.propagationDecay = Number.isFinite(options.propagationDecay) ? options.propagationDecay : this.config.propagationDecay;
    ripple.propagationDelay = Number.isFinite(options.propagationDelay) ? options.propagationDelay : this.config.propagationDelay;
    ripple.spawnTime = currentTime;
    ripple.age = 0;
    ripple.lifetime = lifetime;
    ripple.startRadius = startRadius;
    ripple.maxRadius = maxRadius;
    ripple.haloScale = haloScale;
    ripple.baseOpacity = baseOpacity;
    ripple.haloOpacity = haloOpacity;
    ripple.coreOpacity = coreOpacity;
    ripple.anchor.copy(anchor);
    ripple.verticalOffset = verticalOffset;
    ripple.wobbleSeed = ((this.stats.spawnedRipples + 1) * 0.73 + (nodeId ? String(nodeId).length * 0.17 : 0) + intensity * 0.33) % (Math.PI * 2);
    ripple.propagationQueued = false;
    ripple.direction = direction;

    ripple.root.position.copy(ripple.anchor);
    ripple.root.position.y += ripple.verticalOffset;
    ripple.root.scale.setScalar(startRadius);
    ripple.root.visible = true;
    ripple.root.userData.nodeId = nodeId;
    ripple.root.userData.linkId = linkId;
    ripple.root.userData.kind = kind;
    ripple.root.userData.depth = ripple.depth;
    ripple.root.userData.direction = direction ? direction.clone() : null;

    // ── Set shader uniforms for upgraded ring ──
    const ringUniforms = ripple.ringMesh.material.uniforms;
    if (ringUniforms) {
      ringUniforms.uColor.value.copy(color);
      ringUniforms.uOpacity.value = baseOpacity;
      ringUniforms.uProgress.value = 0;
      ringUniforms.uIntensity.value = intensity;
      ringUniforms.uTime.value = 0;
      ringUniforms.uWobbleSeed.value = ripple.wobbleSeed;
    }
    ripple.haloMesh.material.color.copy(this._blendColors(color, this.config.haloColor, 0.38));
    ripple.coreMesh.material.color.copy(this._blendColors(color, new THREE.Color(0xffffff), 0.42));
    ripple.haloMesh.material.opacity = haloOpacity;
    ripple.coreMesh.material.opacity = coreOpacity;

    // ── Echo ring setup ──
    if (ripple.echoRingMesh) {
      ripple.echoRingMesh.material.color.copy(this._blendColors(color, this.config.haloColor, 0.55));
      ripple.echoRingMesh.material.opacity = Math.max(0.02, (this.config.echoRingOpacity ?? 0.12) * (0.6 + intensity * 0.5));
      ripple.echoRingMesh.scale.setScalar(this.config.echoRingScale ?? 1.38);
    }

    // ── Track loadPressure ripples ──
    if (kind === 'loadPressure' && nodeId !== null && nodeId !== undefined) {
      const key = String(nodeId);
      this._lpActiveCounts.set(key, (this._lpActiveCounts.get(key) ?? 0) + 1);
    }

    this._sceneRoot.add(ripple.root);
    this._activeRipples.push(ripple);
    this._incrementNodeRippleCount(nodeId);
    this.stats.spawnedRipples += 1;

    if (this._impactManager && nodeId !== null && nodeId !== undefined) {
      const impactType = this._resolveImpactType(kind, metrics, intensity, options);
      const impactIntensity = clamp01(intensity * this.config.auraDeformationStrength);
      if (impactIntensity > 0) {
        this._impactManager.triggerImpact(
          nodeId,
          impactType,
          this._elapsedTime,
          impactIntensity,
          Math.max(0.12, this.config.auraImpactDuration + intensity * 0.06),
          direction
        );
      }
    }

    return ripple;
  }

  _attachScene(scene) {
    if (!scene) return;

    if (this._sceneRoot.parent && this._sceneRoot.parent !== scene) {
      this._sceneRoot.parent.remove(this._sceneRoot);
    }

    this.scene = scene;
    if (this._sceneRoot.parent !== this.scene) {
      this.scene.add(this._sceneRoot);
    }
  }

  _attachImpactManager(nodeAuraSystem) {
    const auraSystem = nodeAuraSystem || this.nodeAuraSystem || this.world?.nodeAuraSystem || globalThis.game?.nodeAuraSystem || null;
    if (!auraSystem) return;

    if (auraSystem.impactManager) {
      this._impactManager = auraSystem.impactManager;
      this._ownsImpactManager = false;
      this.nodeAuraSystem = auraSystem;
      return;
    }

    if (typeof auraSystem.setImpactManager === 'function') {
      this._previousImpactManager = auraSystem.impactManager ?? null;
      this._impactManager = new ImpactManagerCollection();
      auraSystem.setImpactManager(this._impactManager);
      this._ownsImpactManager = true;
      this.nodeAuraSystem = auraSystem;
    }
  }

  _buildPath(path, originNodeId, nodeId) {
    const nextPath = Array.isArray(path)
      ? path.filter((entry) => entry !== undefined && entry !== null).map((entry) => String(entry))
      : [];

    if (originNodeId !== null && originNodeId !== undefined) nextPath.push(String(originNodeId));
    if (nodeId !== null && nodeId !== undefined) nextPath.push(String(nodeId));
    return [...new Set(nextPath)];
  }

  _blendColors(colorA, colorB, blendAmount) {
    const result = colorA.clone();
    result.lerp(colorB, clamp01(blendAmount));
    return result;
  }

  _canSpawnRipple(currentTime, nodeId, linkId, kind) {
    if (nodeId !== null && nodeId !== undefined) {
      const nodeKey = String(nodeId);
      const activeCount = this._nodeActiveRippleCounts.get(nodeKey) ?? 0;
      if (activeCount >= Math.max(1, this.config.maxRipplesPerNode)) {
        return false;
      }

      const nodeCooldown = this._nodeCooldownUntilById.get(nodeKey) ?? -Infinity;
      if (currentTime < nodeCooldown) return false;
    }

    if (kind === 'waveBurst' && linkId !== null && linkId !== undefined) {
      const linkKey = String(linkId);
      const linkCooldown = this._linkCooldownUntilById.get(linkKey) ?? -Infinity;
      if (currentTime < linkCooldown) return false;
    }

    if (kind !== 'propagation' && this.config.globalCooldownSeconds > 0 && currentTime < this._globalCooldownUntil) {
      return false;
    }

    if (kind !== 'propagation' && this.config.globalCooldownSeconds > 0) {
      this._globalCooldownUntil = currentTime + this.config.globalCooldownSeconds;
    }

    if (nodeId !== null && nodeId !== undefined) {
      this._nodeCooldownUntilById.set(String(nodeId), currentTime + this.config.nodeCooldownSeconds);
    }

    if (kind === 'waveBurst' && linkId !== null && linkId !== undefined) {
      this._linkCooldownUntilById.set(String(linkId), currentTime + this.config.linkCooldownSeconds);
    }

    return true;
  }

  _incrementNodeRippleCount(nodeId) {
    if (nodeId === null || nodeId === undefined) return;
    const key = String(nodeId);
    this._nodeActiveRippleCounts.set(key, (this._nodeActiveRippleCounts.get(key) ?? 0) + 1);
  }

  _decrementNodeRippleCount(nodeId) {
    if (nodeId === null || nodeId === undefined) return;
    const key = String(nodeId);
    const nextValue = (this._nodeActiveRippleCounts.get(key) ?? 0) - 1;
    if (nextValue > 0) {
      this._nodeActiveRippleCounts.set(key, nextValue);
    } else {
      this._nodeActiveRippleCounts.delete(key);
    }
  }

  _getRippleFromPool() {
    if (this._ripplePool.length > 0) {
      return this._ripplePool.pop();
    }

    if (this._activeRipples.length + this._ripplePool.length >= Math.max(1, this.config.maxTotalRipples)) {
      return null;
    }

    return this._createRippleTemplate();
  }

  _createRippleTemplate() {
    const root = new THREE.Group();
    root.frustumCulled = false;
    root.visible = false;
    root.userData = {};

    // ── UPGRADED: ShaderMaterial for ring with chromatic shift + energy shimmer ──
    const ringMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: this.config.rippleColor.clone() },
        uOpacity: { value: 0 },
        uProgress: { value: 0 },
        uIntensity: { value: 0.5 },
        uTime: { value: 0 },
        uChromaticShift: { value: this.config.chromaticShift },
        uShimmerSpeed: { value: this.config.energyShimmerSpeed },
        uGlowPulseFreq: { value: this.config.glowPulseFreq },
        uWobbleSeed: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        void main() {
          vUv = uv;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uProgress;
        uniform float uIntensity;
        uniform float uTime;
        uniform float uChromaticShift;
        uniform float uShimmerSpeed;
        uniform float uGlowPulseFreq;
        uniform float uWobbleSeed;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          // Radial distance from ring center (0 = inner edge, 1 = outer edge)
          float radial = length(vUv - 0.5) * 2.0;

          // Ring band: sharp edge with soft falloff
          float ringBand = smoothstep(0.62, 0.72, radial) * (1.0 - smoothstep(0.88, 0.96, radial));

          // Energy shimmer: radial sine pattern
          float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
          float shimmer = sin(angle * 8.0 + uTime * uShimmerSpeed + uWobbleSeed) * 0.15 + 0.85;

          // Glow pulse: brightness oscillation
          float glowPulse = 0.82 + 0.18 * sin(uTime * uGlowPulseFreq + uProgress * 6.28318);

          // Chromatic color shift over lifetime
          vec3 chromaR = uColor * (1.0 + uChromaticShift * sin(uProgress * 3.14159));
          vec3 chromaG = uColor * (1.0 + uChromaticShift * 0.6 * sin(uProgress * 3.14159 + 2.094));
          vec3 chromaB = uColor * (1.0 + uChromaticShift * 0.3 * sin(uProgress * 3.14159 + 4.188));
          vec3 chromaColor = vec3(chromaR.r, chromaG.g, chromaB.b);

          // Hot core whitening at early progress
          float hotCore = (1.0 - smoothstep(0.0, 0.35, uProgress)) * uIntensity * 0.4;
          chromaColor += vec3(hotCore);

          // Combine
          float alpha = ringBand * shimmer * glowPulse * uOpacity;
          gl_FragColor = vec4(chromaColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false
    });

    const haloMaterial = new THREE.MeshBasicMaterial({
      color: this.config.haloColor,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false
    });

    const coreMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xffffff),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false
    });

    const ringMesh = new THREE.Mesh(this._ringGeometry, ringMaterial);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.renderOrder = this._sceneRoot.renderOrder;
    ringMesh.frustumCulled = false;

    const haloMesh = new THREE.Mesh(this._haloGeometry, haloMaterial);
    haloMesh.rotation.x = -Math.PI / 2;
    haloMesh.renderOrder = this._sceneRoot.renderOrder + 1;
    haloMesh.frustumCulled = false;

    const coreMesh = new THREE.Mesh(this._coreGeometry, coreMaterial);
    coreMesh.rotation.x = -Math.PI / 2;
    coreMesh.position.y = 0.01;
    coreMesh.renderOrder = this._sceneRoot.renderOrder + 2;
    coreMesh.frustumCulled = false;

    // ── Echo ring: outer depth layer ──
    const echoRingMaterial = new THREE.MeshBasicMaterial({
      color: this.config.haloColor,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false
    });
    const echoRingMesh = new THREE.Mesh(this._haloGeometry, echoRingMaterial);
    echoRingMesh.rotation.x = -Math.PI / 2;
    echoRingMesh.renderOrder = this._sceneRoot.renderOrder - 1;
    echoRingMesh.frustumCulled = false;

    root.add(echoRingMesh, coreMesh, ringMesh, haloMesh);

    return {
      active: false,
      root,
      ringMesh,
      haloMesh,
      coreMesh,
      echoRingMesh,
      color: new THREE.Color(),
      nodeId: null,
      originNodeId: null,
      linkId: null,
      kind: 'waveBurst',
      intensity: 0,
      age: 0,
      spawnTime: 0,
      lifetime: 0,
      startRadius: 0,
      maxRadius: 0,
      haloScale: 1,
      baseOpacity: 0,
      haloOpacity: 0,
      coreOpacity: 0,
      depth: 0,
      path: [],
      allowPropagation: true,
      propagationDecay: this.config.propagationDecay,
      propagationDelay: this.config.propagationDelay,
      metrics: null,
      direction: null,
      anchor: new THREE.Vector3(),
      verticalOffset: 0,
      wobbleSeed: 0,
      propagationQueued: false
    };
  }

  _returnRippleToPool(ripple) {
    if (!ripple) return;

    // ── Decrement loadPressure active count ──
    if (ripple.kind === 'loadPressure' && ripple.nodeId !== null && ripple.nodeId !== undefined) {
      const key = String(ripple.nodeId);
      const count = (this._lpActiveCounts.get(key) ?? 1) - 1;
      if (count > 0) {
        this._lpActiveCounts.set(key, count);
      } else {
        this._lpActiveCounts.delete(key);
      }
    }

    this._decrementNodeRippleCount(ripple.nodeId);
    ripple.active = false;
    ripple.age = 0;
    ripple.spawnTime = 0;
    ripple.lifetime = 0;
    ripple.startRadius = 0;
    ripple.maxRadius = 0;
    ripple.depth = 0;
    ripple.path = [];
    ripple.linkId = null;
    ripple.nodeId = null;
    ripple.originNodeId = null;
    ripple.kind = 'waveBurst';
    ripple.intensity = 0;
    ripple.allowPropagation = true;
    ripple.metrics = null;
    ripple.direction = null;
    ripple.anchor.set(0, 0, 0);
    ripple.verticalOffset = 0;
    ripple.wobbleSeed = 0;
    ripple.propagationQueued = false;
    ripple.root.visible = false;
    ripple.root.position.set(0, -9999, 0);
    ripple.root.scale.setScalar(1);

    // ── Reset shader uniforms ──
    const ringUniforms = ripple.ringMesh.material.uniforms;
    if (ringUniforms) {
      ringUniforms.uOpacity.value = 0;
      ringUniforms.uProgress.value = 0;
    } else {
      ripple.ringMesh.material.opacity = 0;
    }
    ripple.haloMesh.material.opacity = 0;
    ripple.coreMesh.material.opacity = 0;

    // ── Reset echo ring ──
    if (ripple.echoRingMesh) {
      ripple.echoRingMesh.material.opacity = 0;
    }

    if (this._ripplePool.length < Math.max(1, this.config.maxTotalRipples)) {
      this._ripplePool.push(ripple);
    } else {
      this._disposeRippleTemplate(ripple);
    }
  }

  _disposeRippleTemplate(ripple) {
    if (!ripple) return;
    ripple.ringMesh?.material?.dispose?.();
    ripple.haloMesh?.material?.dispose?.();
    ripple.coreMesh?.material?.dispose?.();
    ripple.echoRingMesh?.material?.dispose?.();
  }

  _disposeGeometry(geometry) {
    if (geometry?.dispose) {
      geometry.dispose();
    }
  }

  _clearRipples(predicate = () => true) {
    for (let i = this._activeRipples.length - 1; i >= 0; i -= 1) {
      const ripple = this._activeRipples[i];
      if (typeof predicate === 'function' && !predicate(ripple)) continue;

      if (ripple?.root?.parent) {
        ripple.root.parent.remove(ripple.root);
      }

      this._activeRipples.splice(i, 1);
      this._returnRippleToPool(ripple);
    }
  }

  _updateRipples(deltaTime, camera = null, links = null) {
    if (this._activeRipples.length === 0) return;

    for (let i = this._activeRipples.length - 1; i >= 0; i -= 1) {
      const ripple = this._activeRipples[i];
      if (!ripple?.active) {
        this._activeRipples.splice(i, 1);
        this._returnRippleToPool(ripple);
        continue;
      }

      ripple.age += deltaTime;
      const progress = clamp01(ripple.age / Math.max(0.0001, ripple.lifetime));
      if (progress >= 1) {
        if (ripple.root?.parent) ripple.root.parent.remove(ripple.root);
        ripple.active = false;
        this._activeRipples.splice(i, 1);
        this._returnRippleToPool(ripple);
        continue;
      }

      const easeIn = Math.sin(Math.min(1, progress / 0.2) * Math.PI * 0.5);
      const easeOut = 1 - Math.pow(Math.max(0, (progress - 0.58) / 0.42), 2);
      const envelope = Math.max(0, easeIn * Math.max(0, easeOut));
      const pulse = 0.86 + Math.sin(ripple.age * 10.4 + ripple.wobbleSeed) * 0.08;
      const radiusT = 1 - Math.pow(1 - progress, 1.78);
      const radius = ripple.startRadius + (ripple.maxRadius - ripple.startRadius) * radiusT;
      const corePulse = Math.max(0, 1 - progress * 1.6);
      const wobble = Math.sin(ripple.age * 9.0 + ripple.wobbleSeed) * 0.0035 * (0.3 + ripple.intensity);
      const debugBoost = this.config.debugMode ? 1.28 : 1.0;

      ripple.root.position.copy(ripple.anchor);
      ripple.root.position.y += ripple.verticalOffset + wobble;
      ripple.root.scale.setScalar(radius);
      ripple.ringMesh.scale.setScalar(1.0);
      ripple.haloMesh.scale.setScalar(ripple.haloScale);
      ripple.coreMesh.scale.setScalar(0.32 + progress * 0.18);

      // ── Drive shader uniforms for upgraded ring ──
      const ringUniforms = ripple.ringMesh.material.uniforms;
      if (ringUniforms) {
        ringUniforms.uOpacity.value = Math.max(0, ripple.baseOpacity * envelope * pulse * debugBoost);
        ringUniforms.uProgress.value = progress;
        ringUniforms.uIntensity.value = ripple.intensity;
        ringUniforms.uTime.value = ripple.age;
      } else {
        ripple.ringMesh.material.opacity = Math.max(0, ripple.baseOpacity * envelope * pulse * debugBoost);
      }
      ripple.haloMesh.material.opacity = Math.max(0, ripple.haloOpacity * envelope * (0.76 + pulse * 0.18) * debugBoost);
      ripple.coreMesh.material.opacity = Math.max(0, ripple.coreOpacity * corePulse * (0.78 + ripple.intensity * 0.38) * debugBoost);

      // ── Echo ring: outer depth layer with delayed fade ──
      if (ripple.echoRingMesh && this.config.echoRingEnabled) {
        const echoEnvelope = Math.max(0, easeIn * Math.max(0, 1 - Math.pow(Math.max(0, (progress - 0.45) / 0.55), 1.6)));
        const echoPulse = 0.78 + Math.sin(ripple.age * 7.2 + ripple.wobbleSeed * 1.3) * 0.14;
        const echoBase = Math.max(0.02, (this.config.echoRingOpacity ?? 0.12) * (0.5 + ripple.intensity * 0.5));
        ripple.echoRingMesh.material.opacity = Math.max(0, echoBase * echoEnvelope * echoPulse * debugBoost);
        ripple.echoRingMesh.scale.setScalar((this.config.echoRingScale ?? 1.38) * (0.96 + progress * 0.08));
      }

      if (ripple.allowPropagation && ripple.depth < Math.max(0, this.config.maxPropagationDepth) && !ripple.propagationQueued && ripple.age >= ripple.propagationDelay) {
        ripple.propagationQueued = true;
        this._schedulePropagation(ripple, links);
      }
    }
  }

  _schedulePropagation(ripple, links = null) {
    if (!ripple || !ripple.nodeId || ripple.intensity < this.config.minPropagationIntensity) return;

    const currentDepth = Number.isFinite(ripple.depth) ? ripple.depth : 0;
    if (currentDepth >= Math.max(0, this.config.maxPropagationDepth)) return;

    const resolvedLinks = Array.isArray(links)
      ? links
      : Array.isArray(this.linkResonanceSystem?.world?.linkingSystem?.links)
      ? this.linkResonanceSystem.world.linkingSystem.links
      : Array.isArray(this.world?.linkingSystem?.links)
        ? this.world.linkingSystem.links
        : Array.isArray(globalThis.game?.linkingSystem?.links)
          ? globalThis.game.linkingSystem.links
          : [];

    if (resolvedLinks.length === 0) return;

    const neighbors = [];
    const visited = new Set((ripple.path || []).map((entry) => String(entry)));
    visited.add(String(ripple.nodeId));

    for (const link of resolvedLinks) {
      const endpoints = this._resolveLinkEndpoints(link);
      if (!endpoints.sourceId && !endpoints.targetId) continue;

      const sourceId = endpoints.sourceId !== null && endpoints.sourceId !== undefined ? String(endpoints.sourceId) : null;
      const targetId = endpoints.targetId !== null && endpoints.targetId !== undefined ? String(endpoints.targetId) : null;
      const rippleNodeId = String(ripple.nodeId);
      const neighborId = sourceId === rippleNodeId
        ? targetId
        : targetId === rippleNodeId
          ? sourceId
          : null;

      if (!neighborId || visited.has(String(neighborId))) continue;

      const metrics = this._resolveLinkMetrics(link);
      const score = (metrics.synergy * 0.45) + (metrics.stability * 0.3) + ((1 - metrics.corruption) * 0.25);
      neighbors.push({
        neighborId: String(neighborId),
        position: sourceId === rippleNodeId ? endpoints.targetPosition : endpoints.sourcePosition,
        node: sourceId === rippleNodeId ? endpoints.targetNode : endpoints.sourceNode,
        score,
        link,
        endpoints
      });
    }

    neighbors.sort((a, b) => b.score - a.score);

    const branchLimit = Math.max(1, this.config.maxPropagationBranches);
    const propagationCount = Math.min(branchLimit, neighbors.length);

    for (let i = 0; i < propagationCount; i += 1) {
      const entry = neighbors[i];
      const nextIntensity = clamp01(ripple.intensity * this.config.propagationDecay * (0.92 - i * 0.08));
      if (nextIntensity < this.config.minPropagationIntensity) continue;

      const spawnTime = this._elapsedTime + this.config.propagationDelay + (currentDepth * this.config.propagationDelay * 0.55) + (i * 0.02);
      this._pendingPropagationEvents.push({
        nodeId: entry.neighborId,
        intensity: nextIntensity,
        depth: currentDepth + 1,
        spawnTime,
        originNodeId: ripple.originNodeId ?? ripple.nodeId,
        sourceNodeId: ripple.nodeId,
        path: this._buildPath(ripple.path ?? [], ripple.originNodeId ?? ripple.nodeId, entry.neighborId),
        linkId: this._resolveLinkId(entry.link),
        link: entry.link,
        position: entry.position ? entry.position.clone?.() ?? toVector3(entry.position) : null,
        kind: 'propagation'
      });
      this.stats.propagatedRipples += 1;
    }
  }

  _processPropagationQueue() {
    if (this._pendingPropagationEvents.length === 0) return;

    for (let i = this._pendingPropagationEvents.length - 1; i >= 0; i -= 1) {
      const event = this._pendingPropagationEvents[i];
      if (!event || event.spawnTime > this._elapsedTime) continue;

      this._pendingPropagationEvents.splice(i, 1);
      const node = this._resolveNodeById(event.nodeId);
      const anchor = node || this._resolvePosition(event.position);
      if (!anchor) continue;

      this.createRippleEffect(anchor, {
        kind: 'propagation',
        intensity: event.intensity,
        nodeId: event.nodeId,
        originNodeId: event.originNodeId,
        sourceNodeId: event.sourceNodeId,
        sourcePosition: this._resolveNodePosition(event.sourceNodeId),
        targetPosition: this._resolveNodePosition(event.nodeId),
        link: event.link,
        linkId: event.linkId,
        depth: event.depth,
        path: event.path,
        allowPropagation: event.depth < Math.max(0, this.config.maxPropagationDepth),
        color: this._resolveRippleColor('propagation', this._resolveNodeMetrics(node, event), event),
        metrics: this._resolveNodeMetrics(node, event),
        verticalOffset: this.config.rippleVerticalOffset * 0.78,
        haloScale: this.config.rippleHaloScale * 0.95,
        lifetime: this.config.rippleLifetime * 0.9
      });
    }
  }

  _resolveRippleColor(kind, metrics = {}, context = {}) {
    const kindKey = String(kind || 'waveBurst');
    const intensity = clamp01(context.intensity ?? metrics.intensity ?? 0.5);
    const corruption = clamp01(metrics.corruption ?? 0);
    const harmony = clamp01(metrics.harmony ?? metrics.synergy ?? 0.5);
    const loadPressure = clamp01(metrics.loadPressure ?? 0);
    const stability = clamp01(metrics.stability ?? 0.5);

    // ── Quantum Echo: spectral ripple color cycling ──
    if (this.config.enableQuantumEcho) {
      const hues = this.config.quantumSpectrumHues;
      const phase = this._quantumPhase;
      const cycleIdx = Math.floor(phase * hues.length) % hues.length;
      const nextIdx = (cycleIdx + 1) % hues.length;
      const frac = (phase * hues.length) % 1;
      const baseHue = THREE.MathUtils.lerp(hues[cycleIdx], hues[nextIdx], frac);

      if (kindKey === 'loadPressure') {
        // Arcane amber with quantum spectral shift at high pressure
        const pressureHue = THREE.MathUtils.lerp(0.08, 0.97, clamp01(loadPressure - 0.5) * 2.0);
        return new THREE.Color().setHSL(pressureHue, 0.8, 0.5 + intensity * 0.15);
      } else if (kindKey === 'cascadeHop') {
        // Sacred gold cascade with quantum phase modulation
        const cascadeHue = THREE.MathUtils.lerp(0.12, baseHue, 0.3);
        return new THREE.Color().setHSL(cascadeHue, 0.85, 0.55 + intensity * 0.15);
      } else if (kindKey === 'propagation') {
        // Quantum spectral propagation — cycles through full spectrum
        return new THREE.Color().setHSL(baseHue, 0.7, 0.55 + harmony * 0.1);
      } else if (kindKey === 'waveBurst') {
        // Quantum wave burst — corruption=void crimson, harmony=celestial teal, default=spectral cycling
        if (corruption >= Math.max(harmony, stability * 0.72)) {
          return new THREE.Color().setHSL(0.97, 0.85, 0.4 + corruption * 0.1);
        } else if (harmony >= 0.54 || stability >= 0.56) {
          return new THREE.Color().setHSL(0.48, 0.75, 0.55 + harmony * 0.1);
        } else {
          return new THREE.Color().setHSL(baseHue, 0.75, 0.55 + intensity * 0.1);
        }
      }
      return new THREE.Color().setHSL(baseHue, 0.7, 0.55);
    }

    // Legacy color resolution
    let baseColor = this.config.rippleColor.clone();

    if (kindKey === 'loadPressure') {
      baseColor = (this.config.loadPressureSpawn?.color ?? this.config.cascadeColor).clone();
      baseColor.lerp(this.config.corruptionColor, clamp01(loadPressure - 0.5) * 0.5);
    } else if (kindKey === 'cascadeHop') {
      baseColor = this.config.cascadeColor.clone();
    } else if (kindKey === 'propagation') {
      baseColor = this.config.harmonyColor.clone().lerp(this.config.cascadeColor, 0.18);
    } else if (kindKey === 'waveBurst') {
      if (corruption >= Math.max(harmony, stability * 0.72)) {
        baseColor = this.config.corruptionColor.clone();
      } else if (harmony >= 0.54 || stability >= 0.56) {
        baseColor = this.config.harmonyColor.clone();
      } else if (loadPressure >= 0.55) {
        baseColor = this.config.cascadeColor.clone();
      }
    }

    baseColor.lerp(new THREE.Color(0xffffff), 0.12 * intensity);
    return baseColor;
  }

  _resolveImpactType(kind, metrics = {}, intensity = 0.5, context = {}) {
    const corruption = clamp01(metrics.corruption ?? 0);
    const harmony = clamp01(metrics.harmony ?? metrics.synergy ?? 0.5);
    const stability = clamp01(metrics.stability ?? 0.5);

    if (kind === 'cascadeHop') {
      return corruption > harmony && corruption > 0.42 ? 'corruption' : 'harmony';
    }

    if (context.pulse?.consensusState === 'deviate' || context.pulse?.consensusState === 'judgment') {
      return 'corruption';
    }

    if (corruption > harmony && corruption > 0.38 && intensity > 0.34) {
      return 'corruption';
    }

    if (harmony >= 0.52 || stability >= 0.58) {
      return 'harmony';
    }

    return intensity > 0.5 ? 'harmony' : 'corruption';
  }

  _resolveNodeMetrics(nodeOrValue, context = {}) {
    const node = nodeOrValue && !nodeOrValue.isVector3 ? nodeOrValue : null;
    const pulse = context.pulse ?? null;
    const metrics = node?.userData?.metrics || context.metrics || pulse?.metrics || {};
    const nodeRef = node || context.node || context.nodeRef || context.nodeId || null;
    const activeLinkCount = this._getLiveNodeLinkCount(nodeRef);
    const loadPressure = activeLinkCount > 0 ? clamp01(metrics.loadPressure ?? pulse?.loadPressure ?? 0) : 0;

    return {
      synergy: clamp01(metrics.synergy ?? metrics.harmony ?? pulse?.synergy ?? 0.5),
      harmony: clamp01(metrics.harmony ?? pulse?.harmony ?? metrics.synergy ?? 0.5),
      corruption: clamp01(metrics.corruption ?? pulse?.corruption ?? 0),
      stability: clamp01(metrics.stability ?? pulse?.stability ?? 0.5),
      loadPressure,
      activeLinkCount
    };
  }

  _resolveLinkMetrics(link, pulse = null) {
    const metrics = link?.userData?.metrics || pulse?.metrics || {};
    return {
      synergy: clamp01(metrics.synergy ?? pulse?.synergy ?? link?.userData?.synergy ?? 0.5),
      harmony: clamp01(metrics.harmony ?? pulse?.harmony ?? link?.userData?.harmony ?? 0.5),
      corruption: clamp01(metrics.corruption ?? pulse?.corruption ?? link?.userData?.corruption ?? 0),
      stability: clamp01(metrics.stability ?? pulse?.stability ?? link?.userData?.stability ?? 0.5),
      loadPressure: clamp01(metrics.loadPressure ?? pulse?.loadPressure ?? link?.userData?.loadPressure ?? 0)
    };
  }

  _getLiveLinks() {
    const sources = [
      this.linkResonanceSystem?.world?.linkingSystem?.links,
      this.linkResonanceSystem?.linkingSystem?.links,
      this.world?.linkingSystem?.links,
      globalThis.game?.linkingSystem?.links
    ];

    for (const collection of sources) {
      if (Array.isArray(collection)) return collection;
      if (collection instanceof Map) return [...collection.values()];
    }

    return [];
  }

  _getLiveNodeLinkCount(nodeOrValue) {
    const nodeId = this._resolveNodeId(nodeOrValue);
    if (nodeId === null || nodeId === undefined) return 0;

    let count = 0;
    for (const link of this._getLiveLinks()) {
      const endpoints = this._resolveLinkEndpoints(link);
      if (endpoints.sourceId === nodeId || endpoints.targetId === nodeId) {
        count += 1;
      }
    }

    return count;
  }

  _isLiveLink(link) {
    if (!link) return false;

    const linkId = this._resolveLinkId(link);
    const liveLinks = this._getLiveLinks();
    if (liveLinks.length === 0) return false;

    return liveLinks.some((liveLink) => liveLink === link || (linkId && this._resolveLinkId(liveLink) === linkId));
  }

  _resolveNodePosition(nodeId) {
    const node = this._resolveNodeById(nodeId);
    return this._resolvePosition(node);
  }

  _resolveNodeById(nodeId) {
    if (nodeId === null || nodeId === undefined) return null;
    const key = String(nodeId);

    const sources = [
      this.world?.nodes,
      this.world?.aiNodes?.nodes,
      this.linkResonanceSystem?.world?.nodes,
      this.linkResonanceSystem?.world?.aiNodes?.nodes,
      globalThis.game?.aiNodes?.nodes,
      globalThis.game?.world?.nodes
    ];

    for (const collection of sources) {
      if (!collection) continue;

      if (collection instanceof Map) {
        const entry = collection.get(nodeId) ?? collection.get(key);
        if (entry) return entry;
      }

      if (Array.isArray(collection)) {
        const found = collection.find((node) => this._resolveNodeId(node) === key);
        if (found) return found;
      }
    }

    return null;
  }

  _resolveNodeId(nodeOrValue) {
    if (nodeOrValue === null || nodeOrValue === undefined) return null;
    if (typeof nodeOrValue === 'string' || typeof nodeOrValue === 'number') return String(nodeOrValue);

    return (
      nodeOrValue.userData?.nodeId ??
      nodeOrValue.userData?.id ??
      nodeOrValue.nodeId ??
      nodeOrValue.id ??
      nodeOrValue.uuid ??
      null
    );
  }

  _resolvePosition(value) {
    if (!value) return null;
    if (value.isVector3) return value.clone();
    if (value.position?.isVector3) return value.position.clone();
    if (typeof value.getWorldPosition === 'function') {
      const position = new THREE.Vector3();
      value.getWorldPosition(position);
      return position;
    }

    return toVector3(value.position || value);
  }

  _resolveLinkId(linkOrId) {
    if (!linkOrId) return null;
    if (typeof linkOrId === 'string' || typeof linkOrId === 'number') return String(linkOrId);

    return (
      linkOrId.userData?.id ??
      linkOrId.userData?.linkId ??
      linkOrId.id ??
      linkOrId.uuid ??
      null
    );
  }

  _resolveLinkEndpoints(linkOrId) {
    const link = (linkOrId && typeof linkOrId === 'object') ? linkOrId : null;
    const sourceNode = link?.source || link?.sourceNode || link?.nodeA || link?.userData?.sourceNode || null;
    const targetNode = link?.target || link?.targetNode || link?.nodeB || link?.userData?.targetNode || null;

    const sourcePosition = this._resolvePosition(sourceNode || link?.userData?.sourcePosition || link?.sourcePosition);
    const targetPosition = this._resolvePosition(targetNode || link?.userData?.targetPosition || link?.targetPosition);

    return {
      sourceNode,
      targetNode,
      sourceId: this._resolveNodeId(sourceNode ?? link?.userData?.sourceId ?? link?.userData?.nodeA ?? null),
      targetId: this._resolveNodeId(targetNode ?? link?.userData?.targetId ?? link?.userData?.nodeB ?? null),
      sourcePosition,
      targetPosition
    };
  }

  _buildPath(path, originNodeId, nodeId) {
    const nextPath = Array.isArray(path)
      ? path.filter((entry) => entry !== undefined && entry !== null).map((entry) => String(entry))
      : [];

    if (originNodeId !== null && originNodeId !== undefined) nextPath.push(String(originNodeId));
    if (nodeId !== null && nodeId !== undefined) nextPath.push(String(nodeId));
    return [...new Set(nextPath)];
  }

  _attachScene(scene) {
    if (!scene) return;

    if (this._sceneRoot.parent && this._sceneRoot.parent !== scene) {
      this._sceneRoot.parent.remove(this._sceneRoot);
    }

    this.scene = scene;
    if (this._sceneRoot.parent !== this.scene) {
      this.scene.add(this._sceneRoot);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LoadPressure Autonomous Spawning
  // Spawns ripples on nodes where loadPressure exceeds threshold.
  // Configurable interval (default 3s), intensity, and max concurrent.
  // ═══════════════════════════════════════════════════════════════════════

  _updateLoadPressureSpawning(deltaTime) {
    const lpConfig = this.config.loadPressureSpawn;
    if (!lpConfig?.enabled || this._disposed || !this.config.enabled) return;

    const threshold = Math.max(0.1, lpConfig.threshold ?? 0.55);
    const interval = Math.max(0.5, lpConfig.interval ?? 3.0);
    const baseIntensity = clamp01(lpConfig.intensity ?? 0.6);
    const maxConcurrent = Math.max(1, lpConfig.maxConcurrentPerNode ?? 3);

    // ── Refresh node cache periodically ──
    if (this._elapsedTime - this._lpNodesCacheTime > this._lpNodesCacheInterval) {
      this._lpNodesCache = this._collectNodes();
      this._lpNodesCacheTime = this._elapsedTime;
    }

    const nodes = this._lpNodesCache;
    if (!nodes || nodes.length === 0) return;

    for (const node of nodes) {
      const nodeId = this._resolveNodeId(node);
      if (nodeId === null || nodeId === undefined) continue;

      const activeLinkCount = this._getLiveNodeLinkCount(node);
      if (activeLinkCount <= 0) {
        this._lpSpawnTimers.delete(String(nodeId));
        this._lpActiveCounts.delete(String(nodeId));
        continue;
      }

      // ── Check loadPressure metric ──
      const metrics = this._resolveNodeMetrics(node);
      const loadPressure = clamp01(metrics.loadPressure ?? 0);
      if (loadPressure < threshold) continue;

      // ── Check concurrent limit ──
      const activeCount = this._lpActiveCounts.get(String(nodeId)) ?? 0;
      if (activeCount >= maxConcurrent) continue;

      // ── Check interval timer ──
      const lastSpawn = this._lpSpawnTimers.get(String(nodeId)) ?? -Infinity;
      if (this._elapsedTime - lastSpawn < interval) continue;

      // ── Scale intensity by how much pressure exceeds threshold ──
      const pressureExcess = clamp01((loadPressure - threshold) / (1.0 - threshold));
      const intensity = baseIntensity * (0.5 + pressureExcess * 0.5);

      // ── Spawn ripple ──
      this.createRippleEffect(node, {
        kind: 'loadPressure',
        intensity,
        nodeId,
        color: lpConfig.color ?? this.config.cascadeColor,
        metrics,
        depth: 0,
        allowPropagation: false,  // loadPressure ripples don't propagate
        lifetime: this.config.rippleLifetime * (0.85 + pressureExcess * 0.3),
        maxRadius: this.config.rippleMaxRadius * (0.7 + pressureExcess * 0.5),
      });

      this._lpSpawnTimers.set(String(nodeId), this._elapsedTime);
    }

    // ── Clean up stale timers ──
    if (this._lpSpawnTimers.size > 200) {
      const cutoff = this._elapsedTime - interval * 3;
      for (const [key, time] of this._lpSpawnTimers) {
        if (time < cutoff) this._lpSpawnTimers.delete(key);
      }
    }
  }

  _collectNodes() {
    const sources = [
      this.world?.nodes,
      this.world?.aiNodes?.nodes,
      this.linkResonanceSystem?.world?.nodes,
      this.linkResonanceSystem?.world?.aiNodes?.nodes,
      globalThis.game?.aiNodes?.nodes,
      globalThis.game?.world?.nodes
    ];

    for (const collection of sources) {
      if (!collection) continue;
      if (collection instanceof Map) return [...collection.values()];
      if (Array.isArray(collection) && collection.length > 0) return collection;
    }

    return [];
  }

  _attachImpactManager(nodeAuraSystem) {
    const auraSystem = nodeAuraSystem || this.nodeAuraSystem || this.world?.nodeAuraSystem || globalThis.game?.nodeAuraSystem || null;
    if (!auraSystem) return;

    if (auraSystem.impactManager) {
      this._impactManager = auraSystem.impactManager;
      this._ownsImpactManager = false;
      this.nodeAuraSystem = auraSystem;
      return;
    }

    if (typeof auraSystem.setImpactManager === 'function') {
      this._previousImpactManager = auraSystem.impactManager ?? null;
      this._impactManager = new ImpactManagerCollection();
      auraSystem.setImpactManager(this._impactManager);
      this._ownsImpactManager = true;
      this.nodeAuraSystem = auraSystem;
    }
  }
}

export default EchoRippleSystem_Session125;
