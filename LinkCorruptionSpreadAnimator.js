import * as THREE from 'three';
import { applyLinkRenderLayer } from './LinkRenderLayerPolicy.js';

const _tmpPointA = new THREE.Vector3();
const _tmpPointB = new THREE.Vector3();
const _tmpPointC = new THREE.Vector3();
const _tmpPointD = new THREE.Vector3();
const _tmpNormalA = new THREE.Vector3();
const _tmpNormalB = new THREE.Vector3();
const _tmpNormalC = new THREE.Vector3();
const _tmpTangentA = new THREE.Vector3();
const _tmpTangentB = new THREE.Vector3();
const _tmpUp = new THREE.Vector3(0, 1, 0);
const _tmpSide = new THREE.Vector3(1, 0, 0);
const _tmpMatrix = new THREE.Matrix4();
const _tmpColorA = new THREE.Color();
const _tmpColorB = new THREE.Color();
const _tmpColorC = new THREE.Color();

const clamp01 = (value) => {
  const numeric = Number.isFinite(value) ? value : 0;
  if (numeric <= 0) return 0;
  if (numeric >= 1) return 1;
  return numeric;
};

const seededNoise = (seed) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const hashString32 = (value = '') => {
  const text = String(value);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

function quadraticPoint(p0, p1, p2, t, target) {
  const inv = 1 - t;
  const a = inv * inv;
  const b = 2 * inv * t;
  const c = t * t;
  target.set(
    p0.x * a + p1.x * b + p2.x * c,
    p0.y * a + p1.y * b + p2.y * c,
    p0.z * a + p1.z * b + p2.z * c
  );
  return target;
}

function quadraticTangent(p0, p1, p2, t, target) {
  const inv = 1 - t;
  target.set(
    2 * inv * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
    2 * inv * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
    2 * inv * (p1.z - p0.z) + 2 * t * (p2.z - p1.z)
  );
  if (target.lengthSq() <= 1e-8) {
    target.set(1, 0, 0);
  } else {
    target.normalize();
  }
  return target;
}

export class LinkCorruptionSpreadAnimator {
  constructor() {
    this.animationStates = new Map();
    this.scene = null;
    this._eventBus = null;
    this._eventDisposers = [];

    this.corruptionColors = {
      clean: {
        input: new THREE.Color(0x00ddff),
        process: new THREE.Color(0xffaa00),
        integration: new THREE.Color(0x00ff88),
        analytics: new THREE.Color(0xaa00ff),
        storage: new THREE.Color(0x88ccff),
        control: new THREE.Color(0xff0088),
        quantum: new THREE.Color(0x00ffff),
        sigma: new THREE.Color(0x00ff00),
        emotional: new THREE.Color(0xff8800),
        default: new THREE.Color(0xcccccc)
      },
      steel: new THREE.Color(0x6c7380),
      tainted: new THREE.Color(0x7c5146),
      corrupted: new THREE.Color(0x7f1b27)
    };

    this.config = {
      maxCorruptionForSpread: 0.95,
      minCorruptionForVisuals: 0.01,
      minCorruptionForMidVisuals: 0.32,
      minCorruptionForHighVisuals: 0.68,
      chainLayerCount: 3,
      midChainSegments: 6,
      highChainSegments: 10,
      maxChainSegments: 12,
      chainRadius: 0.062,
      chainTube: 0.022,
      chainOrbitJitter: 0.028,
      chainPulseSpeed: 1.15,
      chainRollSpeed: 0.55,
      chainRippleSpeedMid: 0.55,
      chainRippleSpeedHigh: 0.92,
      chainRippleWidth: 0.18,
      chainSnapDecay: 2.15,
      chainSnapTriggerDelta: 0.16,
      chainSnapTravelSpeed: 1.7,
      chainSegmentFlutter: 0.14,
      chainSegmentBreath: 0.05,
      strandGradientStrengthMid: 0.48,
      strandGradientStrengthHigh: 0.82,
      chainLayerSpecs: [
        {
          role: 'primary',
          segmentCountOffset: 0,
          radiusScale: 1.0,
          tubeScale: 1.0,
          opacityMid: 0.74,
          opacityHigh: 0.92,
          emissiveMid: 0.16,
          emissiveHigh: 0.34,
          orbitScale: 1.0,
          phaseOffset: 0.0,
          rippleScale: 1.0,
          snapScale: 1.0,
          colorBias: 0.12,
          taintBias: 0.0,
          motionBias: 1.0
        },
        {
          role: 'inner',
          segmentCountOffset: -1,
          radiusScale: 0.78,
          tubeScale: 0.76,
          opacityMid: 0.42,
          opacityHigh: 0.62,
          emissiveMid: 0.10,
          emissiveHigh: 0.22,
          orbitScale: 0.72,
          phaseOffset: 0.33,
          rippleScale: 0.84,
          snapScale: 0.72,
          colorBias: 0.08,
          taintBias: -0.05,
          motionBias: 0.82
        },
        {
          role: 'outer',
          segmentCountOffset: -2,
          radiusScale: 1.28,
          tubeScale: 1.12,
          opacityMid: 0.28,
          opacityHigh: 0.44,
          emissiveMid: 0.08,
          emissiveHigh: 0.18,
          orbitScale: 1.22,
          phaseOffset: 0.67,
          rippleScale: 1.15,
          snapScale: 0.64,
          colorBias: 0.18,
          taintBias: 0.10,
          motionBias: 1.12
        }
      ]
    };
  }

  attachScene(scene) {
    this.scene = scene || null;
  }

  setEventBus(bus) {
    if (!bus || this._eventBus) return;
    this._eventBus = bus;

    const register = (tag, handler) => {
      if (typeof bus.subscribe === 'function') {
        const unsub = bus.subscribe(tag, handler, { priority: bus.priority?.NORMAL });
        this._eventDisposers.push(() => unsub?.());
      } else if (typeof bus.on === 'function') {
        bus.on(tag, handler, { priority: bus.priority?.NORMAL });
        this._eventDisposers.push(() => bus.off?.(tag, handler));
      }
    };

    // Canonical tiered corruption events → chain snap animation
    register('link.corruption.high', (payload) => {
      const link = payload?.link;
      if (!link?.id) return;
      let state = this.animationStates.get(link.id);
      if (!state) {
        this.initializeLink(link);
        state = this.animationStates.get(link.id);
      }
      if (state) {
        this._triggerChainSnap(state, 'high', 0.9, 'event');
      }
    });

    register('link.corruption.mid', (payload) => {
      const link = payload?.link;
      if (!link?.id) return;
      let state = this.animationStates.get(link.id);
      if (!state) {
        this.initializeLink(link);
        state = this.animationStates.get(link.id);
      }
      if (state) {
        this._triggerChainSnap(state, 'mid', 0.6, 'event');
      }
    });

    register('link.corruption.low', (payload) => {
      const link = payload?.link;
      if (!link?.id) return;
      let state = this.animationStates.get(link.id);
      if (!state) {
        this.initializeLink(link);
        state = this.animationStates.get(link.id);
      }
      if (state) {
        this._triggerChainSnap(state, 'low', 0.3, 'event');
      }
    });
  }

  initializeLink(link) {
    if (link?.id === null || link?.id === undefined) return;

    if (this.animationStates.has(link.id)) return;

    this.animationStates.set(link.id, {
      time: 0,
      phase: 0,
      ripplePhase: 0,
      snapPhase: 0.14,
      snapEnergy: 0,
      intensity: 0,
      tier: 'low',
      isAnimating: false,
      lastTier: 'low',
      lastCorruption: 0,
      seed: hashString32(link.id),
      chain: null
    });
  }

  update(link, deltaTime, strands, options = {}) {
    if (link?.id === null || link?.id === undefined || !strands || strands.length === 0) return null;

    let state = this.animationStates.get(link.id);
    if (!state) {
      this.initializeLink(link);
      state = this.animationStates.get(link.id);
    }
    if (!state) return null;

    const safeDelta = Number.isFinite(deltaTime) ? Math.max(0, deltaTime) : 0;
    const corruptionLevel = Math.min(this.config.maxCorruptionForSpread, this._readCorruptionLevel(link, options));
    const tier = this._resolveCorruptionTier(link, options, corruptionLevel);
    const previousTier = state.tier || 'low';
    const corruptionRise = corruptionLevel - (state.lastCorruption ?? corruptionLevel);

    state.time += safeDelta;
    state.phase = (state.phase + safeDelta * this.config.chainRollSpeed) % (Math.PI * 2);
    state.ripplePhase = (state.ripplePhase + safeDelta * (tier === 'high' ? this.config.chainRippleSpeedHigh : this.config.chainRippleSpeedMid)) % 1.0;

    if (tier !== previousTier && (tier === 'mid' || tier === 'high')) {
      this._triggerChainSnap(state, tier, corruptionLevel, 'tier');
    } else if (corruptionRise >= this.config.chainSnapTriggerDelta) {
      this._triggerChainSnap(state, tier, corruptionLevel, 'spike');
    }

    if (state.snapEnergy > 0) {
      state.snapEnergy = Math.max(0, state.snapEnergy - safeDelta * this.config.chainSnapDecay);
      state.snapPhase = (state.snapPhase + safeDelta * this.config.chainSnapTravelSpeed * (0.72 + state.intensity * 0.45)) % 1.0;
    } else {
      state.snapPhase = (state.snapPhase + safeDelta * 0.08) % 1.0;
    }

    if (tier !== 'mid' && tier !== 'high') {
      this._setChainVisibility(state, false);
      state.intensity = 0;
      state.tier = tier || 'low';
      state.isAnimating = false;
      state.lastTier = state.tier;
      state.lastCorruption = corruptionLevel;
      return null;
    }

    const chain = this._ensureChainRig(link, state);
    if (!chain) {
      state.isAnimating = false;
      return null;
    }

    state.tier = tier;
    state.intensity = this._computeIntensity(corruptionLevel, tier);
    state.isAnimating = true;
    state.lastTier = tier;
    state.lastCorruption = corruptionLevel;

    this._applyCorruptionGradient(strands, corruptionLevel, tier, state.phase, link);
    this._updateChainRig(link, state, corruptionLevel, tier);

    return state;
  }

  _ensureChainRig(link, state) {
    if (!link?.group) return null;

    const existing = state.chain;
    if (existing?.layers?.length === this.config.chainLayerCount && existing.root && existing.root.parent === link.group) {
      return existing;
    }

    if (existing) {
      this._disposeChainState(state);
    }

    const root = new THREE.Group();
    root.name = 'CorruptionChainRig';
    root.visible = false;
    root.userData.__linkOwnerId = link.id;

    const layerSpecs = this._getChainLayerSpecs();
    const layers = layerSpecs.map((spec) => this._createChainLayer(link, spec));
    layers.forEach((layer) => {
      root.add(layer.mesh);
    });

    link.group.add(root);

    state.chain = {
      root,
      layers,
      visibleCount: 0
    };

    return state.chain;
  }

  _setChainVisibility(state, visible) {
    const chain = state?.chain;
    if (!chain?.root) return;
    chain.root.visible = !!visible;
    if (Array.isArray(chain.layers)) {
      chain.layers.forEach((layer) => {
        if (layer?.mesh) {
          layer.mesh.visible = !!visible;
          if (!visible) {
            layer.mesh.count = 0;
          }
        }
      });
    } else if (chain.mesh) {
      chain.mesh.visible = !!visible;
      if (!visible) {
        chain.mesh.count = 0;
      }
    }
    if (!visible) {
      chain.visibleCount = 0;
    }
  }

  _computeIntensity(corruptionLevel, tier) {
    const level = clamp01(corruptionLevel);
    if (tier === 'high') {
      return clamp01(0.55 + level * 0.45);
    }
    return clamp01(Math.max(0, (level - this.config.minCorruptionForMidVisuals) /
      Math.max(0.0001, this.config.minCorruptionForHighVisuals - this.config.minCorruptionForMidVisuals)));
  }

  _resolveCorruptionTier(link, options = {}, corruptionLevel = 0) {
    const fromOptions = this._normalizeTierValue(options?.corruptionTier);
    if (fromOptions === 'mid' || fromOptions === 'high') return fromOptions;

    const fromLinkState = this._normalizeTierValue(
      link?.userData?.__metricEventState?.metricTiers?.corruption ??
      link?.group?.userData?.__metricEventState?.metricTiers?.corruption
    );
    if (fromLinkState === 'mid' || fromLinkState === 'high') return fromLinkState;

    if (!Number.isFinite(corruptionLevel)) return 'low';
    if (corruptionLevel >= this.config.minCorruptionForHighVisuals) return 'high';
    if (corruptionLevel >= this.config.minCorruptionForMidVisuals) return 'mid';
    return 'low';
  }

  _normalizeTierValue(value) {
    if (value === null || value === undefined) return null;
    const tier = String(value).toLowerCase();
    if (tier === 'medium') return 'mid';
    if (tier === 'critical') return 'high';
    if (tier === 'mid' || tier === 'high' || tier === 'low') return tier;
    return null;
  }

  _sampleChainPoint(link, t, target) {
    const curve = link?.curve;
    if (curve?.v0 && curve?.v1 && curve?.v2) {
      return quadraticPoint(curve.v0, curve.v1, curve.v2, t, target);
    }

    const source = link?.source?.position;
    const targetPos = link?.target?.position;
    if (source && targetPos) {
      return target.lerpVectors(source, targetPos, t);
    }

    return target.set(0, 0, 0);
  }

  _sampleChainTangent(link, t, target) {
    const curve = link?.curve;
    if (curve?.v0 && curve?.v1 && curve?.v2) {
      return quadraticTangent(curve.v0, curve.v1, curve.v2, t, target);
    }

    const source = link?.source?.position;
    const targetPos = link?.target?.position;
    if (source && targetPos) {
      target.subVectors(targetPos, source);
      if (target.lengthSq() <= 1e-8) {
        target.set(1, 0, 0);
      } else {
        target.normalize();
      }
      return target;
    }

    return target.set(1, 0, 0);
  }

  _getChainLayerSpecs() {
    return this.config.chainLayerSpecs.map((spec) => ({ ...spec }));
  }

  _createChainLayer(link, spec) {
    const geometry = new THREE.TorusGeometry(
      this.config.chainRadius * spec.radiusScale,
      this.config.chainTube * spec.tubeScale,
      4,
      8
    );

    const material = new THREE.MeshStandardMaterial({
      color: this.corruptionColors.steel.clone(),
      metalness: 0.94,
      roughness: 0.42,
      emissive: new THREE.Color(0x050505),
      emissiveIntensity: 0.18,
      transparent: true,
      opacity: spec.opacityMid,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      vertexColors: true
    });

    const mesh = new THREE.InstancedMesh(geometry, material, this.config.maxChainSegments);
    mesh.frustumCulled = false;
    mesh.count = 0;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.userData.__linkOwnerId = link.id;
    mesh.userData.__chainLayerRole = spec.role;
    if (typeof mesh.setColorAt === 'function') {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.config.maxChainSegments * 3), 3);
      mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    }

    applyLinkRenderLayer(mesh, 'LINK_CORE_OVERLAY');

    return {
      role: spec.role,
      spec,
      mesh,
      geometry,
      material,
      visibleCount: 0
    };
  }

  _triggerChainSnap(state, tier, corruptionLevel, reason = 'tier') {
    const severity = tier === 'high' ? 1.0 : 0.68;
    const bonus = reason === 'spike' ? 0.22 : 0.0;
    state.snapEnergy = Math.max(state.snapEnergy || 0, Math.min(1, severity + bonus + corruptionLevel * 0.25));
    state.snapPhase = reason === 'spike'
      ? (state.snapPhase + 0.13) % 1.0
      : (tier === 'high' ? 0.08 : 0.84);
  }

  _applyChainInstanceColor(mesh, index, baseColor, tintColor, ripple, snap, layer, corruptionLevel, tier) {
    if (!mesh?.setColorAt) return;

    const layerBias = layer?.spec?.colorBias ?? 0.1;
    const taintBias = tier === 'high' ? 0.28 : 0.15;
    const finalMix = clamp01(layerBias + corruptionLevel * taintBias + ripple * 0.18 + snap * 0.24 + (layer?.spec?.taintBias ?? 0));
    _tmpColorC.copy(baseColor).lerp(tintColor, finalMix);
    mesh.setColorAt(index, _tmpColorC);
  }

  _updateChainRig(link, state, corruptionLevel, tier) {
    const chain = state.chain;
    if (!chain?.layers?.length) return;

    const baseCount = tier === 'high'
      ? this.config.highChainSegments
      : this.config.midChainSegments;
    const visibleLayerMultiplier = tier === 'high' ? this.config.chainLayerCount : 2;
    chain.root.visible = true;
    chain.visibleCount = baseCount * visibleLayerMultiplier;
    const startT = 0.12;
    const endT = 0.88;
    const sourceCategory = link?.source?.userData?.category || 'default';
    const baseColor = this.getCleanColor(sourceCategory);
    const taintColor = tier === 'high' ? this.corruptionColors.corrupted : this.corruptionColors.tainted;
    const snapCenter = state.snapPhase % 1.0;
    const rippleWidth = this.config.chainRippleWidth * (tier === 'high' ? 0.88 : 1.08);
    const snapWidth = 0.10;
    const ripple = state.ripplePhase;
    const motion = state.time * this.config.chainPulseSpeed;

    const visibleLayerCount = tier === 'high'
      ? this.config.chainLayerCount
      : Math.min(this.config.chainLayerCount, 2);

    chain.layers.forEach((layer, layerIndex) => {
      if (!layer?.mesh) return;

      const isLayerVisible = layerIndex < visibleLayerCount;
      layer.mesh.visible = isLayerVisible;
      if (!isLayerVisible) {
        layer.mesh.count = 0;
        layer.visibleCount = 0;
        return;
      }

      const layerCount = Math.max(
        1,
        Math.min(
          baseCount + (layer.spec.segmentCountOffset || 0),
          this.config.maxChainSegments
        )
      );
      layer.mesh.count = layerCount;
      layer.visibleCount = layerCount;

      const layerPhaseOffset = layer.spec.phaseOffset || 0;
      const layerRippleCenter = (ripple + layerPhaseOffset) % 1.0;
      const layerSnapCenter = (snapCenter + layerPhaseOffset * 0.5) % 1.0;
      const layerRippleWidth = rippleWidth * (0.92 + layerIndex * 0.09);
      const layerSnapWidth = snapWidth * (1.0 + layerIndex * 0.12);
      const layerMotionBias = layer.spec.motionBias || 1.0;
      const step = layerCount > 1 ? (endT - startT) / (layerCount - 1) : 0;

      for (let i = 0; i < layerCount; i += 1) {
        const baseT = layerCount > 1 ? (startT + step * i) : 0.5;
        const t = Math.max(0.02, Math.min(0.98, baseT + (layerPhaseOffset - 0.5) * 0.02));
        const seed = state.seed + (i * 17.11) + (layerIndex * 101.7);
        const waveDist = Math.abs(t - layerRippleCenter);
        const snapDist = Math.abs(t - layerSnapCenter);
        const rippleInfluence = Math.exp(-(waveDist * waveDist) / (layerRippleWidth * layerRippleWidth * 0.5));
        const snapInfluence = Math.exp(-(snapDist * snapDist) / (layerSnapWidth * layerSnapWidth * 0.5)) * (state.snapEnergy || 0);
        const motionRipple = Math.sin(motion * (1.6 + layerIndex * 0.2) + seed * 0.013 + rippleInfluence * Math.PI * 2);
        const flutter = Math.sin(state.time * (2.4 + layerIndex * 0.34) + seed * 0.021);
        const breath = Math.sin(state.time * 1.75 + t * 8.0 + layerPhaseOffset * Math.PI * 3);
        const impulse = (rippleInfluence * (0.35 + state.intensity * 0.65) + snapInfluence) * layer.spec.rippleScale;
        const twist = (i % 2 === 0 ? 0 : Math.PI * 0.5) + (seededNoise(seed + 2.7) - 0.5) * 0.24 + state.phase * 0.08 + motionRipple * 0.12;

        this._sampleChainPoint(link, t, _tmpPointA);
        this._sampleChainTangent(link, t, _tmpTangentA);

        _tmpNormalA.crossVectors(_tmpTangentA, Math.abs(_tmpTangentA.dot(_tmpUp)) < 0.92 ? _tmpUp : _tmpSide);
        if (_tmpNormalA.lengthSq() <= 1e-8) {
          _tmpNormalA.crossVectors(_tmpTangentA, _tmpSide);
        }
        _tmpNormalA.normalize();
        _tmpNormalB.crossVectors(_tmpTangentA, _tmpNormalA).normalize();

        const orbit = (seededNoise(seed + 7.3) - 0.5) * this.config.chainOrbitJitter * (0.5 + state.intensity * 0.85) * (layer.spec.orbitScale || 1.0);
        const drift = motionRipple * this.config.chainOrbitJitter * 0.35 + snapInfluence * 0.05;
        const snapLift = snapInfluence * 0.06 * (layer.spec.snapScale || 1.0);
        const rippleLift = impulse * 0.04;
        const flutterLift = flutter * this.config.chainSegmentFlutter * layerMotionBias;
        const breathLift = breath * this.config.chainSegmentBreath * (0.7 + state.intensity * 0.5);

        _tmpPointB.copy(_tmpPointA)
          .addScaledVector(_tmpNormalA, orbit + drift * 0.8 + rippleLift)
          .addScaledVector(_tmpNormalB, orbit * 0.55 - drift * 0.35 + snapLift);

        _tmpPointB.addScaledVector(_tmpTangentA, (flutterLift + breathLift) * 0.035);

        const rollCos = Math.cos(twist + rippleInfluence * 0.28 + snapInfluence * 0.45);
        const rollSin = Math.sin(twist + rippleInfluence * 0.28 + snapInfluence * 0.45);
        _tmpPointC.copy(_tmpNormalA).multiplyScalar(rollCos).addScaledVector(_tmpNormalB, rollSin);
        _tmpPointD.copy(_tmpNormalB).multiplyScalar(rollCos).addScaledVector(_tmpNormalA, -rollSin);

        const baseScale = 1.0 + state.intensity * 0.06 + impulse * 0.08;
        const scaleX = this.config.chainRadius * layer.spec.radiusScale * (baseScale + rippleInfluence * 0.06 + flutterLift * 0.3);
        const scaleY = this.config.chainTube * layer.spec.tubeScale * (baseScale + snapInfluence * 0.08 + breathLift * 0.4);
        const scaleZ = (0.92 + state.intensity * 0.08) * (1.0 + rippleInfluence * 0.03 + snapInfluence * 0.06);

        _tmpMatrix.set(
          _tmpPointC.x * scaleX, _tmpPointD.x * scaleY, _tmpTangentA.x * scaleZ, _tmpPointB.x,
          _tmpPointC.y * scaleX, _tmpPointD.y * scaleY, _tmpTangentA.y * scaleZ, _tmpPointB.y,
          _tmpPointC.z * scaleX, _tmpPointD.z * scaleY, _tmpTangentA.z * scaleZ, _tmpPointB.z,
          0, 0, 0, 1
        );
        layer.mesh.setMatrixAt(i, _tmpMatrix);
        this._applyChainInstanceColor(layer.mesh, i, baseColor, taintColor, rippleInfluence, snapInfluence, layer, corruptionLevel, tier);
      }

      layer.mesh.instanceMatrix.needsUpdate = true;
      if (layer.mesh.instanceColor) {
        layer.mesh.instanceColor.needsUpdate = true;
      }

      const layerOpacity = tier === 'high' ? layer.spec.opacityHigh : layer.spec.opacityMid;
      const layerEmissive = tier === 'high' ? layer.spec.emissiveHigh : layer.spec.emissiveMid;
      this._applyChainMaterial(layer.material, sourceCategory, corruptionLevel, tier, state.intensity, layer, layerOpacity, layerEmissive);
    });

    chain.root.scale.setScalar(0.98 + state.intensity * (tier === 'high' ? 0.12 : 0.07));
  }

  _applyChainMaterial(material, category, corruptionLevel, tier, intensity, layer, opacity, emissiveScale) {
    if (!material) return;

    const sourceColor = this.getCleanColor(category);
    const taintColor = tier === 'high' ? this.corruptionColors.corrupted : this.corruptionColors.tainted;
    const layerColorBias = layer?.spec?.colorBias ?? 0.12;
    const taintBias = layer?.spec?.taintBias ?? 0;
    const taintMix = tier === 'high'
      ? 0.34 + intensity * 0.30 + taintBias
      : 0.18 + intensity * 0.18 + taintBias;

    _tmpColorA.copy(this.corruptionColors.steel).lerp(sourceColor, clamp01(layerColorBias));
    _tmpColorB.copy(_tmpColorA).lerp(taintColor, clamp01(taintMix));
    material.color.copy(_tmpColorB);
    material.emissive.copy(_tmpColorB).multiplyScalar(emissiveScale);
    material.emissiveIntensity = tier === 'high'
      ? 0.28 + intensity * 0.36
      : 0.16 + intensity * 0.20;
    material.opacity = opacity;
    material.roughness = tier === 'high' ? 0.32 : 0.46;
    material.metalness = 0.94;
  }

  _applyCorruptionGradient(strands, corruptionLevel, tier, phase, link) {
    if (!Array.isArray(strands) || strands.length === 0) return;
    if (tier !== 'mid' && tier !== 'high') return;

    const sourceCategory = link?.source?.userData?.category || 'default';
    const baseColor = this.getCleanColor(sourceCategory);
    const taintColor = tier === 'high' ? this.corruptionColors.corrupted : this.corruptionColors.tainted;
    const gradientStrength = tier === 'high'
      ? this.config.strandGradientStrengthHigh
      : this.config.strandGradientStrengthMid;

    strands.forEach((strand, strandIndex) => {
      if (!strand?.material) return;

      const material = strand.material;
      const strandT = strands.length > 1 ? strandIndex / (strands.length - 1) : 0;
      const waveInfluence = this._getWaveInfluenceAtStrand(strandIndex, phase, strands.length);
      const blend = clamp01(waveInfluence * corruptionLevel * gradientStrength);

      _tmpColorC.copy(baseColor).lerp(taintColor, blend);

      if (material.uniforms?.uBaseColor?.value?.copy) {
        material.uniforms.uBaseColor.value.copy(_tmpColorC);
      } else if (material.color) {
        material.color.copy(_tmpColorC);
      }

      if (material.emissive) {
        material.emissive.copy(_tmpColorC).multiplyScalar(0.10 + corruptionLevel * 0.18 + strandT * 0.04);
      }

      if (material.emissiveIntensity !== undefined) {
        material.emissiveIntensity = 0.55 + corruptionLevel * (tier === 'high' ? 1.05 : 0.65);
      }
    });
  }

  _getWaveInfluenceAtStrand(strandIndex, phase, strandCount) {
    const waveCenter = phase / (Math.PI * 2);
    const strandPos = strandCount > 1 ? strandIndex / (strandCount - 1) : 0;
    const distFromWave = Math.abs(strandPos - waveCenter);
    const waveWidth = 0.18;
    const waveFalloff = Math.exp(-(distFromWave * distFromWave) / (waveWidth * waveWidth * 0.5));
    return Math.pow(waveFalloff, 2);
  }

  _readCorruptionLevel(link, options = {}) {
    const fromOptions = options?.corruptionLevel;
    if (Number.isFinite(fromOptions)) return clamp01(fromOptions);

    const value =
      link?.group?.userData?.conduitState?.metrics?.corruption ??
      link?.userData?.metrics?.corruption ??
      link?.userData?.corruption ??
      link?.userData?.corruptionLevel;

    if (Number.isFinite(value)) {
      return clamp01(value);
    }

    return 0;
  }

  getCleanColor(category) {
    return this.corruptionColors.clean[category] || this.corruptionColors.clean.default;
  }

  _disposeChainState(state) {
    const chain = state?.chain;
    if (!chain) return;

    if (Array.isArray(chain.layers)) {
      chain.layers.forEach((layer) => {
        if (layer?.mesh?.parent) {
          layer.mesh.parent.remove(layer.mesh);
        }
        layer.geometry?.dispose?.();
        layer.material?.dispose?.();
      });
    } else if (chain.mesh) {
      chain.mesh.parent?.remove(chain.mesh);
      chain.geometry?.dispose?.();
      chain.material?.dispose?.();
    }

    if (chain.root?.parent) {
      chain.root.parent.remove(chain.root);
    }
    state.chain = null;
  }

  disposeLinkAnimation(linkId) {
    const state = this.animationStates.get(linkId);
    if (!state) return;
    this._disposeChainState(state);
    this.animationStates.delete(linkId);
  }

  dispose() {
    for (const dispose of this._eventDisposers) {
      try { dispose(); } catch (_e) {}
    }
    this._eventDisposers = [];
    this._eventBus = null;

    for (const state of this.animationStates.values()) {
      this._disposeChainState(state);
    }
    this.animationStates.clear();
    this.scene = null;
  }
}
