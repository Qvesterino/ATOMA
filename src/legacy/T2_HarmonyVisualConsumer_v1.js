/**
 * ============================================================================
 * ARCHIVED: T2_HarmonyVisualConsumer_v1.js
 * ============================================================================
 * 
 * ARCHIVAL DATE: 2026-03-13
 * REASON: Violates ATOMA visual policy
 * 
 * ============================================================================
 * WHY ARCHIVED:
 * ============================================================================
 * 
 * This system was disabled in main.js (lines 637-639) because:
 * 
 * 1. USES PRIMITIVE GEOMETRIES:
 *    - Line 85: new THREE.SphereGeometry(1.5, 32, 32) for auras
 *    - Line 113: new THREE.SphereGeometry() for oasis zones
 *    - Line 152: new THREE.SphereGeometry() for healing pulses
 * 
 * 2. BYPASSES VISUAL AUTHORITY:
 *    - Creates geometries directly instead of through VisualTemplateResolver
 *    - Does not use EnhancedNodeModels canonical system
 *    - No coordination with CoreVisualAuthoritySystem
 * 
 * 3. DUPLICATES EXISTING FUNCTIONALITY:
 *    - HarmonyAuraController already provides cyan aura effects
 *    - HarmonyAuraController uses proper canonical templates
 *    - HarmonyAuraController integrates with VisualTemplateResolver
 * 
 * ============================================================================
 * REPLACEMENT:
 * ============================================================================
 * 
 * Use HarmonyAuraController.js instead:
 *    - Location: ./HarmonyAuraController.js (root)
 *    - Wiring: Via VisualTemplateResolver.js
 *    - Features: Canonical harmony aura with proper visual authority
 * 
 * ============================================================================
 * ORIGINAL DOCUMENTATION:
 * ============================================================================
 * 
 * T2-003: HARMONY VISUAL CONSUMER v1.0
 * 
 * TIER 2 VISUAL INTEGRATION — HARMONY FEEDBACK LAYER
 * Renders visual feedback from HarmonyStabilizationSystem_v1 runtime data
 * 
 * ✅ RENDERING ONLY — Zero gameplay logic
 * ✅ Read-only consumer of harmony.harmonyLevel from HarmonyStabilizationSystem_v1
 * ✅ Three visual features:
 *    1. Cyan aura around high-harmony nodes (0.6–1.0)
 *    2. Oasis zones as soft radial bloom (visual zone markers)
 *    3. Healing pulses emanating from high-harmony nodes
 * ✅ Safe to disable/enable at any time
 * ✅ No modifications to core systems
 */

import * as THREE from 'three';
import { VisualHierarchyRegistry } from '../../VisualHierarchyRegistry.js';

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
    
    this.enabled = true;
    this.config = {
      harmonyFieldThreshold: 0.6,
      pulseThreshold: 0.93,
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
      oasisZoneMaxGroups: 4,
      
      // Healing Pulse Settings
      pulseEmitRate: 2.0, // pulses per second from high-harmony nodes
      pulseSpeed: 8.0, // units per second
      pulseRadius: 0.3,
      pulseColor: new THREE.Color(0x00ffdd),
      pulseMaxDistance: 50,
      pulseLifetime: 3.0 // seconds
    };
    
    this.registry = {
      nodeAuras: new Map(),        // node → aura visual data
      oasisZones: new Map(),       // harmony region → zone mesh
      activeHealingPulses: [],     // list of active pulse objects
      totalPulsesCreated: 0,
      time: 0,
      attachRoot: null,
      borromeanRingGeometries: this._createBorromeanRingGeometries(),
      pulseGeometry: new THREE.OctahedronGeometry(this.config.pulseRadius, 0)
    };

    this._tmpWorldPosition = new THREE.Vector3();
    this._tmpTargetPosition = new THREE.Vector3();
    this._tmpPulseStep = new THREE.Vector3();
    this._tmpColor = new THREE.Color();
    this._tmpEmissive = new THREE.Color();
    this._tmpActiveLinkedNodeKeys = new Set();
  }

  _createBorromeanRingGeometries() {
    const ringRadius = 1.1;
    const tubeRadius = 0.08;
    const sections = 56;
    const radialSegments = 8;
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
    return [node?.uuid, node?.id, node?.userData?.nodeId];
  }

  _markNodeAsActive(node, activeLinkedNodeKeys) {
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
    const targetOpacity = (this.config.fieldBaseOpacity + (this.config.fieldMaxOpacity - this.config.fieldBaseOpacity) * harmonyIntensity) * pulseIntensityMultiplier;
    const emissiveIntensity = (this.config.fieldBaseEmissiveIntensity +
      (this.config.fieldMaxEmissiveIntensity - this.config.fieldBaseEmissiveIntensity) * harmonyIntensity) * pulseIntensityMultiplier;

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

  _normalizeHarmonyValue(value) {
    if (!Number.isFinite(value)) return null;
    if (value > 1) return Math.max(0, Math.min(1, value / 100));
    return Math.max(0, Math.min(1, value));
  }

  _resolveNodeHarmonyLevel(node, harmonySystem = this.harmonySystem) {
    const nodeHarmony = harmonySystem?.nodeHarmony;
    const candidateKeys = [node?.id, node?.userData?.nodeId, node?.uuid];

    if (nodeHarmony instanceof Map) {
      for (const key of candidateKeys) {
        if (key === undefined || key === null) continue;
        const harmonyData = nodeHarmony.get(key);
        if (Number.isFinite(harmonyData?.level)) {
          return harmonyData.level;
        }
      }
    }

    const metricsHarmony = this._normalizeHarmonyValue(node?.userData?.metrics?.harmony);
    if (metricsHarmony !== null) return metricsHarmony;

    const shadowHarmony = this._normalizeHarmonyValue(node?.userData?.harmonyLevel);
    if (shadowHarmony !== null) return shadowHarmony;

    const auraStrength = this._normalizeHarmonyValue(node?.userData?.harmonyAuraStrength);
    if (auraStrength !== null) return auraStrength;

    const legacyHarmony = this._normalizeHarmonyValue(node?.userData?.harmony);
    if (legacyHarmony !== null) return legacyHarmony;

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

    if (!this.registry.nodeAuras.has(node.uuid)) {
      this.registerNode(node);
    }

    const auraData = this.registry.nodeAuras.get(node.uuid);
    if (!auraData) return false;

    const harmonyLevel = this._resolveNodeHarmonyLevel(node, this.harmonySystem);
    if (!Number.isFinite(harmonyLevel) || harmonyLevel < this.config.harmonyFieldThreshold) {
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

    const clusters = [];
    for (const descriptor of this._createOasisClusterDescriptors(radius)) {
      const clusterGroup = new THREE.Group();
      clusterGroup.position.copy(descriptor.offset);
      clusterGroup.scale.setScalar(Math.max(0.001, descriptor.scale));

      const ringMeshes = [];
      const ringMaterials = [];

      this.registry.borromeanRingGeometries.forEach((geometry, index) => {
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
    const attachRoot = this._syncAttachmentRoot();
    if (!attachRoot) return;
    
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: this.config.pulseColor,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    
    const pulseMesh = new THREE.Mesh(this.registry.pulseGeometry, pulseMaterial);
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
    
    this.registry.time += deltaTime;
    const resolvedHarmonySystem = harmonySystem || this.harmonySystem;
    this.harmonySystem = resolvedHarmonySystem || this.harmonySystem;
    this._syncAttachmentRoot();
    this._syncOasisZones(resolvedHarmonySystem);
    
    if (aiNodes && aiNodes.nodes) {
      const activeNodeSet = new Set();
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
        
        const harmonyLevel = this._resolveNodeHarmonyLevel(node, resolvedHarmonySystem);

        if (harmonyLevel >= this.config.harmonyFieldThreshold) {
          const harmonyIntensity = Math.max(
            0,
            Math.min(1, (harmonyLevel - this.config.harmonyFieldThreshold) / (1 - this.config.harmonyFieldThreshold))
          );

          this._updateHarmonyFieldVisual(auraData, deltaTime, harmonyIntensity);

          if (harmonyLevel >= this.config.pulseThreshold) {
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

      this._updateOasisZoneVisual(zone, deltaTime);
    });
    
    for (let i = this.registry.activeHealingPulses.length - 1; i >= 0; i--) {
      const pulse = this.registry.activeHealingPulses[i];
      
      pulse.ageSeconds += deltaTime;

      this._tmpPulseStep.copy(pulse.direction).multiplyScalar(pulse.speed * deltaTime);
      pulse.mesh.position.add(this._tmpPulseStep);
      
      const fadeStart = pulse.lifetime * 0.7;
      if (pulse.ageSeconds > fadeStart) {
        const fadeProgress = (pulse.ageSeconds - fadeStart) / (pulse.lifetime - fadeStart);
        pulse.mesh.material.opacity = 0.8 * (1.0 - fadeProgress);
      }
      
      if (pulse.ageSeconds >= pulse.lifetime) {
        pulse.mesh.parent?.remove(pulse.mesh);
        pulse.mesh.material.dispose();
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
      pulse.mesh?.parent?.remove?.(pulse.mesh);
      pulse.mesh?.material?.dispose?.();
    });
    this.registry.activeHealingPulses = [];
  }

  dispose() {
    this.cleanup();
    this.registry.borromeanRingGeometries?.forEach?.((geometry) => geometry?.dispose?.());
    this.registry.pulseGeometry?.dispose?.();
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
