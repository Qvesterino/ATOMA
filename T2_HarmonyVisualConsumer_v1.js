/**
 * ============================================================================
 * T2_HarmonyVisualConsumer_v1.js
 * ============================================================================
 *
 * TIER 2 VISUAL INTEGRATION — HARMONY FEEDBACK LAYER
 * Renders visual feedback from HarmonyStabilizationSystem_v1 runtime data.
 *
 * ✅ RENDERING ONLY — Zero gameplay logic
 * ✅ Read-only consumer of harmony state from HarmonyStabilizationSystem_v1
 * ✅ Visual features:
 *    1. Cyan aura around high-harmony nodes
 *    2. Oasis zones as soft radial bloom
 *    3. Healing pulses emanating from high-harmony nodes
 * ✅ Safe to disable or rebind at runtime
 *
 * This module is designed as a direct visual consumer and does not alter
 * core gameplay state.
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

const HARMONY_FIELD_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vLocalPosition;

void main() {
  vUv = uv;
  vLocalPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const HARMONY_FIELD_FRAGMENT_SHADER = `
uniform float uTime;
uniform vec3 uBaseColor;
uniform float uIntensity;

varying vec2 vUv;
varying vec3 vLocalPosition;

void main() {
  float flow = sin(vUv.x * 10.0 + uTime * 2.0);
  flow = 0.5 + 0.5 * flow;

  float radial = 1.0 - clamp(length(vLocalPosition.xy) * 0.12, 0.0, 1.0);
  float mask = mix(flow, flow * radial, 0.35);
  vec3 emissive = uBaseColor * mask;
  float opacity = mask * uIntensity;

  gl_FragColor = vec4(emissive, opacity);
}
`;

export class T2_HarmonyVisualConsumer_v1 {
  constructor(scene, harmonySystem, options = {}) {
    this.scene = scene;
    this.harmonySystem = harmonySystem; // Read-only reference to HarmonyStabilizationSystem_v1
    this.attachRoot = options.attachRoot || null;
    this.attachRootResolver = options.attachRootResolver || null;
    this.semanticBus = options.semanticBus || this._resolveSemanticBus();
    this.enabled = true;
    this.config = {
      harmonyFieldThreshold: 0.5,
      enableNodeHarmonySemanticResponse: options.enableNodeHarmonySemanticResponse ?? true,
      harmonyHighThreshold: 0.7,
      pulseThreshold: 0.85,
      fieldBaseOpacity: 0.85,
      fieldMaxOpacity: 0.95,
      fieldBaseEmissiveIntensity: 1.5,
      fieldMaxEmissiveIntensity: 2.2,
      fieldMetalness: 0.16,
      fieldRoughness: 0.58,
      fieldBreathingSpeed: 1.2,
      fieldBreathingAmplitude: 0.05,
      fieldHueMin: 0.40,
      fieldHueMax: 0.46,
      fieldSaturation: 0.72,
      fieldLightness: 0.54,
      fieldColorFlowSpeed: 0.9,
      fieldPulseBoostDuration: 0.6,
      fieldPulseBoostIntensityMultiplier: 1.5,
      fieldPulseBoostScaleMultiplier: 1.2,
      ringScaleVariants: [1.0, 0.96, 1.04],
      ringRotationSpeeds: [
        { x: 0.2, y: 0.0, z: 0.0 },
        { x: 0.0, y: 0.15, z: 0.0 },
        { x: 0.0, y: 0.0, z: 0.18 }
      ],
      
      // Oasis Zone Settings
      oasisZoneRadius: 15,
      oasisZoneOpacity: 0.15,
      oasisZoneMaxOpacity: 0.35,
      oasisZoneEmissiveIntensity: 0.3,
      oasisZoneMaxEmissiveIntensity: 0.6,
      oasisZoneBreathingFrequency: 0.3,
      oasisZoneVerticalDrift: 0.12,
      oasisZoneMaxGroups: 4,  // Reduced from 4 for performance
      
      // Healing Pulse Settings
      pulseEmitRate: 2.0, // pulses per second from high-harmony nodes
      pulseSpeed: 8.0, // units per second
      pulseRadius: 0.3,
      pulseColor: new THREE.Color(0x22ffd8),
      pulseMaxDistance: 50,
      pulseLifetime: 3.0, // seconds
      pulseShardCount: 5  // Reduced from 5 for performance
    };
    
    this.registry = {
      nodeAuras: new Map(),        // node → aura visual data
      oasisZones: new Map(),       // harmony region → zone mesh
      activeHealingPulses: [],     // list of active pulse objects
      totalPulsesCreated: 0,
      time: 0,
      attachRoot: null,
      borromeanRingGeometries: this._createBorromeanRingGeometries(),
      pulseShardGeometry: new THREE.BoxGeometry(this.config.pulseRadius * 0.15, this.config.pulseRadius * 0.9, this.config.pulseRadius * 0.08)
    };

    this._tmpWorldPosition = new THREE.Vector3();
    this._tmpTargetPosition = new THREE.Vector3();
    this._tmpPulseStep = new THREE.Vector3();
    this._tmpColor = new THREE.Color();
    this._tmpEmissive = new THREE.Color();
    this._tmpActiveLinkedNodeKeys = new Set();
    this.aiNodes = null;
    this._semanticSubscriptions = [];
    this._boundNodeHarmonyHigh = this._handleNodeHarmonyEvent.bind(this, 'high');
    this._boundNodeHarmonyMid = this._handleNodeHarmonyEvent.bind(this, 'mid');
    this._setupSemanticSubscriptions();
  }

  _getDistanceLODController() {
    return globalThis?.window?.ATOMA_DISTANCE_LOD || null;
  }

  _getWorldPositionLODLevel(object3d, forceUpdate = false) {
    const controller = this._getDistanceLODController();
    if (!controller || !object3d) return 0;

    // Cache LOD level in userData to avoid repeated calculations
    if (!forceUpdate && object3d.userData?.meshLODLevel !== undefined) {
      return object3d.userData.meshLODLevel;
    }

    const position = object3d?.getWorldPosition
      ? object3d.getWorldPosition(this._tmpWorldPosition)
      : object3d?.position;

    if (!position) return 0;
    const level = controller.getLODLevel(position);
    const lodLevel = Number.isFinite(level) ? level : 0;
    
    // Cache for next frame
    if (object3d.userData !== undefined) {
      object3d.userData.meshLODLevel = lodLevel;
    }
    
    return lodLevel;
  }

  _getLODScale(lodLevel) {
    if (lodLevel >= 3) return 0;
    if (lodLevel >= 2) return 0.3;
    if (lodLevel >= 1) return 0.6;
    return 1.0;
  }

  _createBorromeanRingGeometries(lodLevel = 0) {
    // LOD-based geometry complexity
    const ringRadius = 1.1;
    const tubeRadius = 0.08;
    // LOD 0: full detail, LOD 1: medium, LOD 2+: low
    const sections = lodLevel >= 2 ? 24 : lodLevel >= 1 ? 40 : 56;
    const radialSegments = lodLevel >= 2 ? 4 : lodLevel >= 1 ? 6 : 8;
    const geometries = [];

    for (let ringIndex = 0; ringIndex < 3; ringIndex++) {
      const angle = (ringIndex * Math.PI * 2) / 3;
      const cx = Math.cos(angle);
      const sx = Math.sin(angle);
      const points = [];

      for (let i = 0; i <= sections; i++) {
        const theta = (i / sections) * Math.PI * 2;
        const x = cx * ringRadius * Math.cos(theta);
        const y = sx * ringRadius * Math.cos(theta);
        const z = ringRadius * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      geometries.push(new THREE.TubeGeometry(curve, sections, tubeRadius, radialSegments, false));
    }

    return geometries;
  }

  _createFlowShaderMaterial(baseColorHex = 0x66ffd9) {
    return new THREE.ShaderMaterial({
      vertexShader: HARMONY_FIELD_VERTEX_SHADER,
      fragmentShader: HARMONY_FIELD_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(baseColorHex) },
        uIntensity: { value: 0 }
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false
    });
  }

  _createOasisClusterDescriptors(radius) {
    const groupCount = Math.max(2, Math.min(this.config.oasisZoneMaxGroups, Math.round(radius / 5)));
    const scaleFactors = [1.15, 0.92, 0.74, 0.6];
    const offsetFactors = [0.0, 0.18, 0.34, 0.5];
    const descriptors = [];

    for (let index = 0; index < groupCount; index++) {
      const angle = (index / groupCount) * Math.PI * 2;
      const offsetRadius = radius * offsetFactors[index];
      descriptors.push({
        scale: radius * scaleFactors[index],
        offset: new THREE.Vector3(
          Math.cos(angle) * offsetRadius,
          (index - (groupCount - 1) * 0.5) * radius * 0.08,
          Math.sin(angle) * offsetRadius * 0.85
        ),
        falloff: 1.0 - index / Math.max(1, groupCount),
        phaseOffset: index * 1.37
      });
    }

    return descriptors;
  }

  _updateOasisZoneVisual(zone, deltaTime) {
    zone.userData.breathingPhase += deltaTime * this.config.oasisZoneBreathingFrequency;
    const breathing = 1.0 + Math.sin(zone.userData.breathingPhase) * 0.04;
    const hueAmplitude = (this.config.fieldHueMax - this.config.fieldHueMin) * 0.5;
    const hueCenter = this.config.fieldHueMin + hueAmplitude;
    const harmonyIntensity = Math.max(0, Math.min(1, zone.userData.harmonyIntensity || 0));

    for (const cluster of zone.userData.clusters || []) {
      const drift = Math.sin(this.registry.time * 0.32 + cluster.phaseOffset) * this.config.oasisZoneVerticalDrift * (zone.userData.radius || 1);
      cluster.group.position.copy(cluster.baseOffset);
      cluster.group.position.y += drift;
      cluster.group.scale.setScalar(cluster.baseScale * breathing);

      cluster.ringMeshes.forEach((ringMesh, index) => {
        const material = cluster.ringMaterials[index];
        const phaseOffset = cluster.phaseOffset + index * 0.61;
        const hue = hueCenter + Math.sin(this.registry.time * (this.config.fieldColorFlowSpeed * 0.45) + phaseOffset) * hueAmplitude;
        const lightness = this.config.fieldLightness + Math.sin(this.registry.time * 0.25 + phaseOffset) * 0.02;
        const opacity = (this.config.oasisZoneOpacity + (this.config.oasisZoneMaxOpacity - this.config.oasisZoneOpacity) * harmonyIntensity) * cluster.falloff;
        const emissiveIntensity = (this.config.oasisZoneEmissiveIntensity + (this.config.oasisZoneMaxEmissiveIntensity - this.config.oasisZoneEmissiveIntensity) * harmonyIntensity) * cluster.falloff;

        this._tmpColor.setHSL(hue, this.config.fieldSaturation * 0.78, lightness);
        material.uniforms.uTime.value = this.registry.time * 0.55 + phaseOffset;
        material.uniforms.uBaseColor.value.copy(this._tmpColor);
        material.uniforms.uIntensity.value = Math.max(opacity, emissiveIntensity * 0.4);

        ringMesh.rotation.x += this.config.ringRotationSpeeds[index].x * deltaTime * 0.25;
        ringMesh.rotation.y += this.config.ringRotationSpeeds[index].y * deltaTime * 0.25;
        ringMesh.rotation.z += this.config.ringRotationSpeeds[index].z * deltaTime * 0.25;
        ringMesh.visible = true;
      });
    }
  }

  _getNodeKeyCandidates(node) {
    return [node?.userData?.nodeId, node?.uuid];
  }

  _createHealingPulseMesh() {
    const pulseGroup = new THREE.Group();
    // Reduced from 5 to 3 shards for performance
    const shardSpecs = [
      { position: [0.0, 0.18, 0.0], rotation: [0.0, 0.0, -0.12], scale: [1.0, 1.05, 1.0], opacity: 0.78 },
      { position: [0.1, 0.1, 0.03], rotation: [0.0, 0.0, -0.55], scale: [0.72, 0.88, 1.0], opacity: 0.62 },
      { position: [-0.12, 0.04, -0.02], rotation: [0.0, 0.0, 0.48], scale: [0.8, 0.82, 1.0], opacity: 0.58 }
    ];

    const materials = [];

    for (const spec of shardSpecs) {
      const shardMaterial = new THREE.MeshBasicMaterial({
        color: this.config.pulseColor,
        transparent: true,
        opacity: spec.opacity,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        toneMapped: false
      });
      shardMaterial.userData = {
        baseOpacity: spec.opacity
      };

      const shard = new THREE.Mesh(this.registry.pulseShardGeometry, shardMaterial);
      shard.position.set(spec.position[0], spec.position[1], spec.position[2]);
      shard.rotation.set(spec.rotation[0], spec.rotation[1], spec.rotation[2]);
      shard.scale.set(spec.scale[0], spec.scale[1], spec.scale[2]);
      shard.userData.isHarmonyHealingPulseShard = true;
      pulseGroup.add(shard);
      materials.push(shardMaterial);
    }

    pulseGroup.userData.isHarmonyHealingPulse = true;
    pulseGroup.userData.baseOpacity = 0.8;
    pulseGroup.userData.materials = materials;

    return pulseGroup;
  }

  _setHealingPulseOpacity(pulseMesh, opacity) {
    if (!pulseMesh) return;

    const materials = pulseMesh.userData?.materials;
    if (Array.isArray(materials) && materials.length > 0) {
      const normalizedOpacity = Math.max(0, Math.min(1, opacity / Math.max(0.001, pulseMesh.userData?.baseOpacity || 0.8)));
      for (const material of materials) {
        if (!material) continue;
        const baseOpacity = material.userData?.baseOpacity ?? material.opacity ?? 0.8;
        material.opacity = baseOpacity * normalizedOpacity;
      }
      return;
    }

    if (pulseMesh.material) {
      pulseMesh.material.opacity = opacity;
    }
  }

  _disposeHealingPulseMesh(pulseMesh) {
    if (!pulseMesh) return;
    pulseMesh.parent?.remove?.(pulseMesh);

    const materials = pulseMesh.userData?.materials;
    if (Array.isArray(materials)) {
      for (const material of materials) {
        material?.dispose?.();
      }
      return;
    }

    pulseMesh.material?.dispose?.();
  }

  _getNodeActiveLinkCount(node) {
    const metricsCount = node?.userData?.metrics?.activeLinkCount;
    if (Number.isFinite(metricsCount)) return metricsCount;

    const legacyCount = node?.userData?.activeLinkCount;
    if (Number.isFinite(legacyCount)) return legacyCount;

    return 0;
  }

  _getNodeIdentityKey(node) {
    return node?.userData?.nodeId ?? node?.uuid ?? null;
  }

  _hasNodeActiveLinks(node, activeLinkedNodeKeys = null) {
    if (this._getNodeActiveLinkCount(node) > 0) {
      return true;
    }

    if (!(activeLinkedNodeKeys instanceof Set) || activeLinkedNodeKeys.size === 0) {
      return false;
    }

    return this._isActiveLinkedNode(node, activeLinkedNodeKeys);
  }

  _markNodeAsActive(node, activeLinkedNodeKeys) {
    const identityKey = this._getNodeIdentityKey(node);
    if (identityKey !== null && identityKey !== undefined) {
      activeLinkedNodeKeys.add(identityKey);
    }

    for (const key of this._getNodeKeyCandidates(node)) {
      if (key === undefined || key === null) continue;
      activeLinkedNodeKeys.add(key);
    }
  }

  _collectActiveLinkedNodeKeys(harmonySystem = this.harmonySystem) {
    this._tmpActiveLinkedNodeKeys.clear();

    const links = harmonySystem?.linkSystem?.links;
    if (Array.isArray(links)) {
      for (const link of links) {
        if (link?.sourceNodeId !== undefined && link?.sourceNodeId !== null) {
          this._tmpActiveLinkedNodeKeys.add(link.sourceNodeId);
        }
        if (link?.targetNodeId !== undefined && link?.targetNodeId !== null) {
          this._tmpActiveLinkedNodeKeys.add(link.targetNodeId);
        }
        this._markNodeAsActive(link?.source || link?.sourceNode, this._tmpActiveLinkedNodeKeys);
        this._markNodeAsActive(link?.target || link?.targetNode, this._tmpActiveLinkedNodeKeys);
      }
    }

    return this._tmpActiveLinkedNodeKeys;
  }

  _isActiveLinkedNode(node, activeLinkedNodeKeys) {
    for (const key of this._getNodeKeyCandidates(node)) {
      if (key !== undefined && key !== null && activeLinkedNodeKeys.has(key)) {
        return true;
      }
    }

    return false;
  }

  _disposeNodeField(fieldData) {
    if (!fieldData) return;
    fieldData.auraGroup?.parent?.remove(fieldData.auraGroup);
    if (Array.isArray(fieldData.ringMaterials)) {
      fieldData.ringMaterials.forEach((material) => material?.dispose?.());
    }
    fieldData.ringMeshes = [];
    fieldData.ringMaterials = [];
  }

  _updateHarmonyFieldVisual(fieldData, deltaTime, harmonyIntensity) {
    fieldData.breathingPhase += deltaTime * this.config.fieldBreathingSpeed;
    const groupScale = (1 + Math.sin(fieldData.breathingPhase) * this.config.fieldBreathingAmplitude) * 1.45;
    let pulseIntensityMultiplier = 1.0;
    let pulseScaleMultiplier = 1.0;

    if (fieldData.pulseBoost?.remaining > 0 && fieldData.pulseBoost.duration > 0) {
      fieldData.pulseBoost.remaining = Math.max(0, fieldData.pulseBoost.remaining - deltaTime);
      const progress = 1.0 - (fieldData.pulseBoost.remaining / fieldData.pulseBoost.duration);
      const envelope = Math.sin(Math.max(0, Math.min(1, progress)) * Math.PI);
      pulseIntensityMultiplier = 1.0 + ((fieldData.pulseBoost.intensityMultiplier || 1.0) - 1.0) * envelope;
      pulseScaleMultiplier = 1.0 + ((fieldData.pulseBoost.scaleMultiplier || 1.0) - 1.0) * envelope;

      if (fieldData.pulseBoost.remaining <= 0) {
        fieldData.pulseBoost = null;
      }
    }

    fieldData.auraGroup.scale.setScalar(groupScale * pulseScaleMultiplier);
    fieldData.auraGroup.visible = true;

    const hueAmplitude = (this.config.fieldHueMax - this.config.fieldHueMin) * 0.5;
    const hueCenter = this.config.fieldHueMin + hueAmplitude;
    const lodScale = fieldData.distanceLodScale ?? 1.0;
    const targetOpacity = (this.config.fieldBaseOpacity + (this.config.fieldMaxOpacity - this.config.fieldBaseOpacity) * harmonyIntensity) * pulseIntensityMultiplier * lodScale;
    const emissiveIntensity = (this.config.fieldBaseEmissiveIntensity +
      (this.config.fieldMaxEmissiveIntensity - this.config.fieldBaseEmissiveIntensity) * harmonyIntensity) * pulseIntensityMultiplier * lodScale;

    fieldData.ringMeshes.forEach((ringMesh, index) => {
      const material = fieldData.ringMaterials[index];
      const phaseOffset = fieldData.phaseOffsets[index] || 0;
      const hue = hueCenter + Math.sin(this.registry.time * this.config.fieldColorFlowSpeed + phaseOffset) * hueAmplitude;
      const lightness = this.config.fieldLightness + Math.sin(this.registry.time * 0.7 + phaseOffset) * 0.03;

      this._tmpColor.setHSL(hue, this.config.fieldSaturation, lightness);
      this._tmpEmissive.copy(this._tmpColor);

      material.uniforms.uTime.value = this.registry.time + phaseOffset;
      material.uniforms.uBaseColor.value.copy(this._tmpEmissive);
      material.uniforms.uIntensity.value = Math.max(targetOpacity, emissiveIntensity * 0.45);

      const rotationSpeed = this.config.ringRotationSpeeds[index];
      ringMesh.rotation.x += rotationSpeed.x * deltaTime;
      ringMesh.rotation.y += rotationSpeed.y * deltaTime;
      ringMesh.rotation.z += rotationSpeed.z * deltaTime;
      ringMesh.scale.setScalar(this.config.ringScaleVariants[index]);
      ringMesh.visible = true;
    });
  }

  _resolveAttachRoot() {
    return this.attachRootResolver?.() || this.attachRoot || this.scene || null;
  }

  _syncAttachmentRoot() {
    const nextRoot = this._resolveAttachRoot();
    if (!nextRoot) return null;

    if (this.registry.attachRoot === nextRoot) {
      return nextRoot;
    }

    this.registry.attachRoot = nextRoot;

    this.registry.oasisZones.forEach((zone) => {
      if (zone.parent !== nextRoot) {
        nextRoot.add(zone);
      }
    });

    for (const pulse of this.registry.activeHealingPulses) {
      if (pulse.mesh?.parent !== nextRoot) {
        nextRoot.add(pulse.mesh);
      }
    }

    return nextRoot;
  }

  _resolveSemanticBus() {
    return globalThis?.semanticBus || globalThis?.ATOMA_BUS || null;
  }

  _setupSemanticSubscriptions() {
    this._teardownSemanticSubscriptions();
    if (!this.config.enableNodeHarmonySemanticResponse || !this.semanticBus) {
      return;
    }

    const subscribe = typeof this.semanticBus.on === 'function'
      ? this.semanticBus.on.bind(this.semanticBus)
      : typeof this.semanticBus.subscribe === 'function'
        ? this.semanticBus.subscribe.bind(this.semanticBus)
        : null;

    if (!subscribe) {
      return;
    }

    subscribe('node.harmony.high', this._boundNodeHarmonyHigh);
    subscribe('node.harmony.mid', this._boundNodeHarmonyMid);
    this._semanticSubscriptions.push(
      { type: 'node.harmony.high', handler: this._boundNodeHarmonyHigh },
      { type: 'node.harmony.mid', handler: this._boundNodeHarmonyMid }
    );
  }

  _teardownSemanticSubscriptions() {
    if (!this.semanticBus || this._semanticSubscriptions.length === 0) return;

    const unsubscribe = typeof this.semanticBus.off === 'function'
      ? this.semanticBus.off.bind(this.semanticBus)
      : typeof this.semanticBus.unsubscribe === 'function'
        ? this.semanticBus.unsubscribe.bind(this.semanticBus)
        : null;

    if (!unsubscribe) {
      this._semanticSubscriptions = [];
      return;
    }

    for (const subscription of this._semanticSubscriptions) {
      try {
        unsubscribe(subscription.type, subscription.handler);
      } catch (err) {
        // ignore errors during cleanup
      }
    }

    this._semanticSubscriptions = [];
  }

  _handleNodeHarmonyEvent(tier, payload = {}) {
    if (!this.enabled || !this.config.enableNodeHarmonySemanticResponse) return;

    const node = this._resolveNodeFromPayload(payload);
    if (!node) return;

    if (!this.registry.nodeAuras.has(node.uuid)) {
      this.registerNode(node);
    }

    const boostOptions = tier === 'high'
      ? { duration: 0.85, intensityMultiplier: 1.8, scaleMultiplier: 1.3 }
      : { duration: 0.55, intensityMultiplier: 1.25, scaleMultiplier: 1.12 };

    const overrideHarmony = this._normalizeHarmonyValue(payload.value ?? (tier === 'high' ? 0.9 : 0.65));
    const minimumHarmony = tier === 'high' ? 0.35 : 0.25;

    this.flashHarmonyField(node, {
      ...boostOptions,
      overrideHarmonyLevel: overrideHarmony,
      minimumHarmonyLevel: minimumHarmony,
      ignoreLinkRequirement: true
    });

    if (tier === 'high') {
      this.emitHealingPulse(node);
    }
  }

  _resolveNodeFromPayload(payload = {}) {
    if (!payload || typeof payload !== 'object') return null;

    const candidate = payload.node || payload.sourceNode || payload.targetNode || payload.nodeId || payload.id || null;
    if (!candidate) return null;

    if (typeof candidate === 'string' || typeof candidate === 'number') {
      const lookupKey = String(candidate);
      if (this.aiNodes && Array.isArray(this.aiNodes.nodes)) {
        for (const node of this.aiNodes.nodes) {
          if (!node) continue;
          if (String(node.id) === lookupKey || String(node.uuid) === lookupKey || String(node.userData?.nodeId) === lookupKey) {
            return node;
          }
        }
      }
      return null;
    }

    if (candidate?.uuid) return candidate;
    if (candidate?.id) return candidate;
    return null;
  }

  _normalizeHarmonyValue(value) {
    if (!Number.isFinite(value)) return null;
    if (value > 1) return Math.max(0, Math.min(1, value / 100));
    return Math.max(0, Math.min(1, value));
  }

  _resolveNodeHarmonyLevel(node, harmonySystem = this.harmonySystem) {
    const nodeHarmony = harmonySystem?.nodeHarmony;
    const candidateKeys = [node?.id, node?.userData?.nodeId, node?.uuid];

    const canonicalHarmony = this._normalizeHarmonyValue(node?.userData?.harmonyLevel);
    if (canonicalHarmony !== null) return canonicalHarmony;

    if (nodeHarmony instanceof Map) {
      for (const key of candidateKeys) {
        if (key === undefined || key === null) continue;
        const harmonyData = nodeHarmony.get(key);
        const level = this._normalizeHarmonyValue(harmonyData?.level);
        if (level !== null) {
          return level;
        }
      }
    }

    const metricsHarmony = this._normalizeHarmonyValue(node?.userData?.metrics?.harmony);
    if (metricsHarmony !== null) return metricsHarmony;

    return 0;
  }

  _getNodeAuraParent(node) {
    return node?.userData?.nodeRoot || node;
  }

  _disposeMesh(mesh) {
    if (!mesh) return;
    mesh.parent?.remove(mesh);
    mesh.traverse?.((child) => {
      child.geometry?.dispose?.();
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material?.dispose?.());
      } else {
        child.material?.dispose?.();
      }
    });
    mesh.geometry?.dispose?.();
    mesh.material?.dispose?.();
  }

  _pruneStaleNodeAuras(activeNodeSet) {
    this.registry.nodeAuras.forEach((auraData, nodeKey) => {
      if (activeNodeSet.has(nodeKey) && auraData.node?.parent) return;

      this._disposeNodeField(auraData);
      this.registry.nodeAuras.delete(nodeKey);
    });
  }

  _syncOasisZones(harmonySystem = this.harmonySystem) {
    const activeZoneKeys = new Set();
    const oasisZones = harmonySystem?.oasisZones;
    const attachRoot = this._syncAttachmentRoot();

    if (!(oasisZones instanceof Map) || !attachRoot) {
      this.registry.oasisZones.forEach((zone, zoneKey) => {
        this._disposeMesh(zone);
        this.registry.oasisZones.delete(zoneKey);
      });
      return;
    }

    oasisZones.forEach((zoneData, zoneKey) => {
      if (!zoneData?.centerPos) return;

      activeZoneKeys.add(zoneKey);

      let zoneMesh = this.registry.oasisZones.get(zoneKey);
      if (!zoneMesh) {
        zoneMesh = this.createOasisZone(zoneData.centerPos, zoneData.intensity, zoneData.radius, zoneKey);
      }

      if (!zoneMesh) return;

      const zoneLOD = this._getWorldPositionLODLevel(zoneMesh);
      zoneMesh.visible = this.enabled && zoneLOD < 3;
      if (zoneLOD >= 3) return;

      zoneMesh.visible = this.enabled;
      zoneMesh.position.set(
        zoneData.centerPos.x || 0,
        zoneData.centerPos.y || 0,
        zoneData.centerPos.z || 0
      );
      zoneMesh.userData.harmonyIntensity = Math.max(0, Math.min(1, zoneData.intensity || 0));
      zoneMesh.userData.radius = zoneData.radius || this.config.oasisZoneRadius;

      if (zoneMesh.parent !== attachRoot) {
        attachRoot.add(zoneMesh);
      }
    });

    this.registry.oasisZones.forEach((zoneMesh, zoneKey) => {
      if (activeZoneKeys.has(zoneKey)) return;
      this._disposeMesh(zoneMesh);
      this.registry.oasisZones.delete(zoneKey);
    });
  }
  
  setEnabled(enabled) {
    this.enabled = enabled;
    this.registry.nodeAuras.forEach((data) => {
      if (data.auraGroup) data.auraGroup.visible = enabled;
    });
    this.registry.oasisZones.forEach((zone) => {
      zone.visible = enabled;
    });
    this.registry.activeHealingPulses.forEach((pulse) => {
      if (pulse.mesh) pulse.mesh.visible = enabled;
    });
  }
  
  registerNode(node) {
    if (!node || this.registry.nodeAuras.has(node.uuid)) return;

    const auraParent = this._getNodeAuraParent(node);
    if (!auraParent) return;
    
    const auraGroup = new THREE.Group();
    auraGroup.name = `harmony-aura-${node.uuid}`;
    auraGroup.userData.isAura = true;
    auraGroup.userData.isVFX = true;
    auraGroup.userData.visualLayer = 'BASELINE_AURA';
    auraGroup.visible = false;

    const ringMeshes = [];
    const ringMaterials = [];
    const phaseOffsets = [0, Math.PI * 0.66, Math.PI * 1.33];

    this.registry.borromeanRingGeometries.forEach((geometry) => {
      const ringMaterial = this._createFlowShaderMaterial(0x66ffd9);

      const ringMesh = new THREE.Mesh(geometry, ringMaterial);
      ringMesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('BASELINE_AURA');
      ringMesh.visible = false;
      ringMesh.frustumCulled = false;
      ringMesh.userData.isAura = true;
      ringMesh.userData.isVFX = true;
      ringMesh.userData.visualLayer = 'BASELINE_AURA';
      auraGroup.add(ringMesh);
      ringMeshes.push(ringMesh);
      ringMaterials.push(ringMaterial);
    });
    auraParent.add(auraGroup);
    
    this.registry.nodeAuras.set(node.uuid, {
      node: node,
      auraGroup: auraGroup,
      ringMeshes,
      ringMaterials,
      phaseOffsets,
      breathingPhase: Math.random() * Math.PI * 2,
      lastHarmonyLevel: 0,
      pulseBoost: null
    });
  }

  flashHarmonyField(node, options = {}) {
    if (!this.enabled || !node?.uuid) return false;

    const activeLinkedNodeKeys = options.activeLinkedNodeKeys instanceof Set
      ? options.activeLinkedNodeKeys
      : this._collectActiveLinkedNodeKeys(this.harmonySystem);

    if (!options.ignoreLinkRequirement && !this._hasNodeActiveLinks(node, activeLinkedNodeKeys)) {
      return false;
    }

    if (!this.registry.nodeAuras.has(node.uuid)) {
      this.registerNode(node);
    }

    const auraData = this.registry.nodeAuras.get(node.uuid);
    if (!auraData) return false;

    const harmonyLevel = options.overrideHarmonyLevel !== undefined && options.overrideHarmonyLevel !== null
      ? this._normalizeHarmonyValue(options.overrideHarmonyLevel)
      : this._resolveNodeHarmonyLevel(node, this.harmonySystem);

    const minimumThreshold = options.minimumHarmonyLevel ?? this.config.harmonyHighThreshold;
    if (!Number.isFinite(harmonyLevel) || harmonyLevel < minimumThreshold) {
      return false;
    }

    const duration = Math.max(0.05, options.duration ?? this.config.fieldPulseBoostDuration);
    auraData.pulseBoost = {
      duration,
      remaining: duration,
      intensityMultiplier: Math.max(1.0, options.intensityMultiplier ?? this.config.fieldPulseBoostIntensityMultiplier),
      scaleMultiplier: Math.max(1.0, options.scaleMultiplier ?? this.config.fieldPulseBoostScaleMultiplier)
    };
    auraData.auraGroup.visible = true;

    return true;
  }
  
  createOasisZone(position, harmonyIntensity = 0.8, radius = this.config.oasisZoneRadius, zoneKey = null) {
    if (!this.enabled) return;
    const attachRoot = this._syncAttachmentRoot();
    if (!attachRoot) return;

    const zoneMesh = new THREE.Group();
    zoneMesh.position.set(position.x || 0, position.y || 0, position.z || 0);
    zoneMesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_OVERLAY');
    zoneMesh.frustumCulled = false;

    // Get LOD level for this zone and create simplified geometries if far away
    const lodLevel = this._getWorldPositionLODLevel(zoneMesh, true);
    const zoneGeometries = this._createBorromeanRingGeometries(lodLevel);

    const clusters = [];
    for (const descriptor of this._createOasisClusterDescriptors(radius)) {
      const clusterGroup = new THREE.Group();
      clusterGroup.position.copy(descriptor.offset);
      clusterGroup.scale.setScalar(Math.max(0.001, descriptor.scale));

      const ringMeshes = [];
      const ringMaterials = [];

      zoneGeometries.forEach((geometry, index) => {
        const ringMaterial = this._createFlowShaderMaterial(0x5ef7d6);
        const ringMesh = new THREE.Mesh(geometry, ringMaterial);
        ringMesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('WORLD_OVERLAY');
        ringMesh.visible = true;
        ringMesh.frustumCulled = false;
        ringMesh.userData.isAura = true;
        ringMesh.userData.isVFX = true;
        ringMesh.userData.visualLayer = 'WORLD_OVERLAY';
        ringMesh.scale.setScalar(this.config.ringScaleVariants[index] * (0.96 + descriptor.falloff * 0.12));
        clusterGroup.add(ringMesh);
        ringMeshes.push(ringMesh);
        ringMaterials.push(ringMaterial);
      });

      zoneMesh.add(clusterGroup);
      clusters.push({
        group: clusterGroup,
        ringMeshes,
        ringMaterials,
        phaseOffset: descriptor.phaseOffset,
        baseOffset: descriptor.offset.clone(),
        baseScale: descriptor.scale,
        falloff: descriptor.falloff
      });
    }

    zoneMesh.userData = {
      isOasisZone: true,
      harmonyIntensity: harmonyIntensity,
      radius,
      createdAt: this.registry.time,
      breathingPhase: Math.random() * Math.PI * 2,
      clusters
    };
    
    attachRoot.add(zoneMesh);
    
    const resolvedZoneKey = zoneKey || `oasis-${position.x.toFixed(1)}-${position.y.toFixed(1)}-${position.z.toFixed(1)}`;
    this.registry.oasisZones.set(resolvedZoneKey, zoneMesh);
    
    return zoneMesh;
  }
  
  emitHealingPulse(fromNode, targetPosition = null) {
    if (!this.enabled || !fromNode) return;
    if (this._getWorldPositionLODLevel(fromNode) >= 3) return;
    const attachRoot = this._syncAttachmentRoot();
    if (!attachRoot) return;

    const pulseMesh = this._createHealingPulseMesh();
    const sourceObject = this._getNodeAuraParent(fromNode) || fromNode;
    sourceObject.getWorldPosition(this._tmpWorldPosition);
    pulseMesh.position.copy(this._tmpWorldPosition);
    pulseMesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('FX');
    pulseMesh.frustumCulled = false;
    pulseMesh.visible = this.enabled;
    pulseMesh.userData.isHarmonyHealingPulse = true;
    
    attachRoot.add(pulseMesh);
    
    let direction = new THREE.Vector3(0, 0, 1);
    if (targetPosition) {
      this._tmpTargetPosition.copy(targetPosition);
      direction = this._tmpTargetPosition.sub(this._tmpWorldPosition).normalize();
    } else {
      direction = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
    }
    
    const pulse = {
      mesh: pulseMesh,
      position: pulseMesh.position.clone(),
      direction: direction,
      speed: this.config.pulseSpeed,
      lifetime: this.config.pulseLifetime,
      ageSeconds: 0,
      fromNode: fromNode
    };
    
    this.registry.activeHealingPulses.push(pulse);
    this.registry.totalPulsesCreated++;
    
    return pulse;
  }
  
  update(deltaTime, aiNodes, harmonySystem) {
    if (!this.enabled) return;
    
    this.aiNodes = aiNodes || this.aiNodes;
    this.registry.time += deltaTime;
    const resolvedHarmonySystem = harmonySystem || this.harmonySystem;
    this.harmonySystem = resolvedHarmonySystem || this.harmonySystem;
    this._syncAttachmentRoot();
    this._syncOasisZones(resolvedHarmonySystem);
    
    if (aiNodes && aiNodes.nodes) {
      const activeNodeSet = new Set();
      const activeLinkedNodeKeys = this._collectActiveLinkedNodeKeys(resolvedHarmonySystem);
      for (const node of aiNodes.nodes) {
        if (!node.userData) continue;
        activeNodeSet.add(node.uuid);
        
        if (!this.registry.nodeAuras.has(node.uuid)) {
          this.registerNode(node);
        }
        
        const auraData = this.registry.nodeAuras.get(node.uuid);
        if (!auraData) continue;
        const auraParent = this._getNodeAuraParent(node);
        if (auraData.auraGroup?.parent !== auraParent) {
          auraParent?.add?.(auraData.auraGroup);
        }

        // Force LOD cache update if node moved significantly
        const lastNodePosition = auraData._lastCachedNodePosition || new THREE.Vector3();
        const nodePosition = node.position || new THREE.Vector3();
        const nodeMoved = nodePosition.distanceToSquared(lastNodePosition) > 0.5;
        if (nodeMoved || !auraData._lodCacheInitialized) {
          node.userData.meshLODLevel = undefined; // Force recompute
          auraData._lastCachedNodePosition = nodePosition.clone();
          auraData._lodCacheInitialized = true;
        }

        const lodLevel = this._getWorldPositionLODLevel(node);
        const lodScale = this._getLODScale(lodLevel);
        auraData.distanceLodScale = lodScale;
        if (lodLevel >= 3) {
          auraData.auraGroup.visible = false;
          auraData.lastHarmonyLevel = 0;
          continue;
        }

        const harmonyLevel = this._resolveNodeHarmonyLevel(node, resolvedHarmonySystem);
        const hasActiveLinks = this._hasNodeActiveLinks(node, activeLinkedNodeKeys);
        const hasPulseBoost = !!auraData.pulseBoost?.remaining;

        // Use harmonyFieldThreshold (0.5) as base visibility threshold
        // harmonyHighThreshold (0.7) is used for healing pulse emission only
        const baseThreshold = this.config.harmonyFieldThreshold;
        const isHarmonyVisible = harmonyLevel >= baseThreshold || hasPulseBoost;

        if (isHarmonyVisible) {
          // Scale intensity from baseThreshold to 1.0, with pulseBoost providing a floor
          const rawIntensity = Math.max(
            0,
            Math.min(1, (harmonyLevel - baseThreshold) / (1 - baseThreshold))
          );
          const harmonyIntensity = hasPulseBoost
            ? Math.max(0.35, rawIntensity)
            : rawIntensity;

          this._updateHarmonyFieldVisual(auraData, deltaTime, harmonyIntensity * lodScale);
          auraData.auraGroup.visible = true;

          // Healing pulses still require high harmony AND active links
          if (hasActiveLinks && harmonyLevel >= this.config.pulseThreshold) {
            const pulseInterval = 1.0 / this.config.pulseEmitRate;
            const timeSinceLastPulse = this.registry.time % pulseInterval;
            if (timeSinceLastPulse < deltaTime) {
              this.emitHealingPulse(node);
            }
          }
        } else {
          auraData.auraGroup.visible = false;
        }
        
        auraData.lastHarmonyLevel = harmonyLevel;
      }

      this._pruneStaleNodeAuras(activeNodeSet);
    }
    
    this.registry.oasisZones.forEach((zone) => {
      if (!zone.userData.isOasisZone) return;

      // Force LOD cache update periodically or if zone moved significantly
      const lastPosition = zone.userData._lastCachedPosition || new THREE.Vector3();
      const positionChanged = zone.position.distanceToSquared(lastPosition) > 1.0;
      if (positionChanged || zone.userData._lodCacheAge > 30) {
        zone.userData.meshLODLevel = undefined; // Force recompute
        zone.userData._lastCachedPosition = zone.position.clone();
        zone.userData._lodCacheAge = 0;
      } else {
        zone.userData._lodCacheAge = (zone.userData._lodCacheAge || 0) + 1;
      }

      this._updateOasisZoneVisual(zone, deltaTime);
    });
    
    for (let i = this.registry.activeHealingPulses.length - 1; i >= 0; i--) {
      const pulse = this.registry.activeHealingPulses[i];
      
      // Force LOD cache update for moving pulses
      const lodLevel = this._getWorldPositionLODLevel(pulse.mesh);
      if (lodLevel >= 3) {
        this._disposeHealingPulseMesh(pulse.mesh);
        this.registry.activeHealingPulses.splice(i, 1);
        continue;
      }
      
      pulse.ageSeconds += deltaTime;

      this._tmpPulseStep.copy(pulse.direction).multiplyScalar(pulse.speed * deltaTime);
      pulse.mesh.position.add(this._tmpPulseStep);
      
      const fadeStart = pulse.lifetime * 0.7;
      if (pulse.ageSeconds > fadeStart) {
        const fadeProgress = (pulse.ageSeconds - fadeStart) / (pulse.lifetime - fadeStart);
        this._setHealingPulseOpacity(pulse.mesh, 0.8 * (1.0 - fadeProgress));
      }
      
      if (pulse.ageSeconds >= pulse.lifetime) {
        this._disposeHealingPulseMesh(pulse.mesh);
        this.registry.activeHealingPulses.splice(i, 1);
      }
    }
  }

  resetForWorldSwitch(options = {}) {
    if (options.scene) {
      this.scene = options.scene;
    }
    if (options.harmonySystem) {
      this.harmonySystem = options.harmonySystem;
    }
    if (options.attachRoot !== undefined) {
      this.attachRoot = options.attachRoot;
    }
    if (options.attachRootResolver) {
      this.attachRootResolver = options.attachRootResolver;
    }

    this.cleanup();
    this.registry.attachRoot = null;
  }
  
  cleanup() {
    this.registry.nodeAuras.forEach((data) => {
      this._disposeNodeField(data);
    });
    this.registry.nodeAuras.clear();
    
    this.registry.oasisZones.forEach((zone) => {
      this._disposeMesh(zone);
    });
    this.registry.oasisZones.clear();
    
    this.registry.activeHealingPulses.forEach((pulse) => {
      this._disposeHealingPulseMesh(pulse.mesh);
    });
    this.registry.activeHealingPulses = [];
  }

  dispose() {
    this.cleanup();
    this.registry.borromeanRingGeometries?.forEach?.((geometry) => geometry?.dispose?.());
    this.registry.pulseShardGeometry?.dispose?.();
  }
  
  getStatus() {
    return {
      enabled: this.enabled,
      activeAuras: this.registry.nodeAuras.size,
      activeOasisZones: this.registry.oasisZones.size,
      activeHealingPulses: this.registry.activeHealingPulses.length,
      totalPulsesCreated: this.registry.totalPulsesCreated
    };
  }
}
