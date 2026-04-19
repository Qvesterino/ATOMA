import * as THREE from 'three';
import { classifyMetricTier, getDefaultMetricThresholds } from './src/metrics/MetricTierClassifier.js';

function vfxFlag(name, def = true) {
  const v = (typeof window !== 'undefined') ? window[name] : undefined;
  return (v === undefined) ? def : !!v;
}

/**
 * NODE VISUALS 4.0 - SAFE UPGRADE SYSTEM
 * 
 * Upgrades all existing node visuals to high-quality 4.0 standard with:
 * - Hologram core (soft inner glow)
 * - Spectral energy ring
 * - Levitation field (low amplitude, no world movement)
 * - Stable neon rim-light
 * - Internal pulse (very subtle, node-only)
 * - Emission accents per node layer
 * - Soft shadow/occlusion halo (static, no movement)
 * 
 * STRICT SAFETY RULES:
 * ✓ No drifting, shaking, or shader displacement of terrain/camera
 * ✓ All effects are node-local only
 * ✓ No world transforms modified
 * ✓ No physics or collision changes
 * ✓ 100% reversible and safe
 */

export class NodeVisuals4_0 {
  constructor(scene, linkingSystem = null) {
    if (typeof window !== 'undefined' && window.ATOMA_VISUAL_BASELINE) {
      // Soft disable: keep instance but mark disabled
      this.scene = scene;
      this.linkingSystem = linkingSystem;
      this.nodeVisualRegistry = new Map();
      this.config = { enabled: false };
      this.registry = { upgradeCount: 0, time: 0, frameCounter: 0 };
      return;
    }

    this.scene = scene;
    this.linkingSystem = linkingSystem;
    this.nodeVisualRegistry = new Map();
    
    this.config = {
      enabled: true,
      
      // Hologram Core
      coreGlowIntensity: 0.4,
      coreGlowScale: 0.7,
      
      // Spectral Energy Ring
      ringOpacity: 0.35,
      ringRotationSpeed: 0.003,
      ringCount: 2,
      
      // Levitation Field (local oscillation only)
      levitationEnabled: true,
      levitationAmplitude: 0.05,      // Very low, no world movement
      levitationFrequency: 0.5,
      
      // Neon Rim-Light
      rimLightIntensity: 0.8,
      rimLightOpacity: 0.4,
      
      // Internal Pulse (very subtle)
      pulseEnabled: true,
      pulseSpeed: 1.5,
      pulseIntensity: 0.15,
      
      // Emission Accents
      emissionIntensity: 0.3,

      // Surrounding shell / orbit accents
      atmosphereShellOpacity: 0.18,
      atmosphereShellScale: 1.82,
      orbitCrownCount: 8,
      orbitCrownRadius: 1.95,
      orbitCrownSize: 0.075,
      orbitCrownOpacity: 0.24,
      orbitCrownWobble: 0.5,
      
      // Soft Shadow/Occlusion Halo
      haloEnabled: true,
      haloOpacity: 0.2,
      
      // Performance
      diagnosticsEnabled: false
    };
    
    this.registry = {
      upgradeCount: 0,
      time: 0,
      frameCounter: 0
    };
  }

  _hash01(value) {
    const str = String(value ?? '');
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return ((hash >>> 0) % 100000) / 100000;
  }

  _mixHex(a, b, t = 0.5) {
    const colorA = new THREE.Color(a);
    return colorA.lerp(new THREE.Color(b), Math.max(0, Math.min(1, t))).getHex();
  }

  _resolveAccentColor(node, nodeData, fallback = 0x00ffff) {
    const direct = nodeData?.color ?? node?.userData?.color ?? node?.userData?.colorHex;
    if (typeof direct === 'number' && Number.isFinite(direct)) {
      return direct;
    }

    const category = String(nodeData?.category || node?.userData?.category || '').toLowerCase().trim();
    const categoryColorMap = {
      input: 0xff6b9d,
      process: 0x00d9ff,
      integration: 0x00ff88,
      analytics: 0xffd700,
      storage: 0x9d4edd,
      control: 0xff006e,
      sigma: 0x0fff50,
      emotional: 0xff4500,
      quantum: 0x00ffff,
      mythic: 0xdda0dd,
      prime: 0xffe135,
      error: 0xffffff
    };

    return categoryColorMap[category] ?? fallback;
  }

  _getNodeMetricValue(node, nodeData, metricName) {
    const metrics = node?.userData?.metrics || null;
    const nodeValue = metrics?.[metricName] ?? node?.userData?.[metricName];
    if (Number.isFinite(nodeValue)) return Math.max(0, Math.min(1, nodeValue));

    const dataMetrics = nodeData?.metrics || null;
    const dataValue = dataMetrics?.[metricName] ?? nodeData?.[metricName];
    if (Number.isFinite(dataValue)) return Math.max(0, Math.min(1, dataValue));

    return 0;
  }

  _getNodeMetricTier(node, nodeData, metricName) {
    const value = this._getNodeMetricValue(node, nodeData, metricName);
    const thresholds = getDefaultMetricThresholds(metricName);
    return classifyMetricTier(value, null, thresholds);
  }

  _resolveNodeLinkCount(node, nodeData) {
    const liveLinkCount = this._getLiveNodeLinkCount(node);
    if (liveLinkCount !== null) {
      return liveLinkCount;
    }

    const metricsCount = node?.userData?.metrics?.activeLinkCount;
    if (Number.isFinite(metricsCount)) return Math.max(0, Math.floor(metricsCount));

    const legacyCount = node?.userData?.activeLinkCount;
    if (Number.isFinite(legacyCount)) return Math.max(0, Math.floor(legacyCount));

    if (Array.isArray(node?.userData?.linkedNodeIds)) {
      return node.userData.linkedNodeIds.length;
    }

    const dataMetricsCount = nodeData?.metrics?.activeLinkCount;
    if (Number.isFinite(dataMetricsCount)) return Math.max(0, Math.floor(dataMetricsCount));

    if (Number.isFinite(nodeData?.activeLinkCount)) {
      return Math.max(0, Math.floor(nodeData.activeLinkCount));
    }

    return 0;
  }

  _getLiveNodeLinkCount(node) {
    const linkingSystem = this.linkingSystem;
    if (!linkingSystem) return null;

    let links = null;
    if (typeof linkingSystem.getNodeLinks === 'function') {
      links = linkingSystem.getNodeLinks(node);
    } else if (typeof linkingSystem.getLinksForNode === 'function') {
      links = linkingSystem.getLinksForNode(node);
    } else if (Array.isArray(linkingSystem.links)) {
      links = linkingSystem.links;
    }

    if (!Array.isArray(links)) return null;

    let count = 0;
    for (const link of links) {
      if (!link) continue;
      if (link.active === false || link.isActive === false) continue;
      count += 1;
    }

    return count;
  }

  setLinkingSystem(linkingSystem) {
    this.linkingSystem = linkingSystem;
  }

  _resolveActivationState(node, nodeData = {}) {
    const linkCount = this._resolveNodeLinkCount(node, nodeData);
    const isLinked = linkCount > 0;

    const harmonyTier = this._getNodeMetricTier(node, nodeData, 'harmony');
    const synergyTier = this._getNodeMetricTier(node, nodeData, 'synergy');
    const stabilityTier = this._getNodeMetricTier(node, nodeData, 'stability');
    const corruptionTier = this._getNodeMetricTier(node, nodeData, 'corruption');

    const isCorruptionHigh = corruptionTier === 'high';
    const hasMidSignal = harmonyTier !== 'low' || synergyTier !== 'low' || stabilityTier !== 'low';
    const hasHighSignal = harmonyTier === 'high' || synergyTier === 'high' || stabilityTier === 'high' || isCorruptionHigh;

    return {
      linkCount,
      isLinked,
      hasMidSignal,
      hasHighSignal,
      isCorruptionHigh
    };
  }
  
  /**
   * Upgrade a node to 4.0 visual standard
   */
  upgradeNode(node, nodeData = {}) {
    if (typeof window !== 'undefined' && window.ATOMA_VISUAL_BASELINE) return;

    if (!node || !node.children) return;

    const activation = this._resolveActivationState(node, nodeData);
    if (!activation.isLinked) {
      // Node visuals must stay dormant until the node has at least one active link.
      this.downgradeNode(node);
      return;
    }

    if (!activation.hasMidSignal && !activation.hasHighSignal) {
      this.downgradeNode(node);
      return;
    }
    
    const allowAnimatedScale = node.userData?.allowAnimatedScale === true;
    const nodeId = node.uuid || Math.random().toString();
    
    // Store original for reference and attach overlay container
    if (!this.nodeVisualRegistry.has(nodeId)) {
      this.nodeVisualRegistry.set(nodeId, {
        node: node,
        data: nodeData,
        components: {}
      });
    }
    
    const visualData = this.nodeVisualRegistry.get(nodeId);
    
    // Create or reset overlay group (single attachment per node)
    this.ensureOverlayGroup(node, visualData, nodeId);
    
    // T2-001: Check if this is an extreme node (visual override)
    const isExtreme = node.userData?.extremeAI === true;
    const extremeArchetypeId = node.userData?.extremeArchetype ?? -1;
    const accentColor = this._resolveAccentColor(node, nodeData, 0x00ffff);
    let baseColor = accentColor;
    
    // T2-001: Apply extreme archetype color if available
    if (isExtreme && extremeArchetypeId >= 0) {
      baseColor = this.getExtremeArchetypeColor(extremeArchetypeId);
      visualData.components.isExtreme = true;
      visualData.components.extremeArchetypeId = extremeArchetypeId;
    }
    
    // Baseline stage: linked node + at least mid metric signal.
    this.addHologramCore(visualData, baseColor);
    this.addNeonRimLight(visualData, baseColor);

    // High-expression stage: linked node + high tier signal.
    if (activation.hasHighSignal) {
      this.addSpectralEnergyRing(visualData, baseColor);

      if (allowAnimatedScale) {
        this.addLevitationField(visualData, baseColor);
      }

      this.addOcclusionHalo(visualData, baseColor);
      this.addAtmosphericShell(visualData, baseColor);
      this.addOrbitCrown(visualData, baseColor, nodeId);
      this.addTriAxisAura(visualData, baseColor);
    }
    
    // T2-001: Add secondary glow layer for extreme nodes (ring/chromatic halo)
    if (isExtreme && activation.hasHighSignal) {
      this.addExtremeSecondaryGlowLayer(visualData, baseColor);
    }
    
    // Step 9: Mark for internal pulse (opt-in)
    if (allowAnimatedScale && activation.hasHighSignal) {
      visualData.components.pulseEnabled = true;
      visualData.components.pulseTime = 0;
    }
    
    this.registry.upgradeCount++;
  }
  
  /**
   * T2-001: Get color for extreme archetype
   * Maps archetype ID to visual color
   */
  getExtremeArchetypeColor(archetypeId) {
    const extremeColors = [
      0xff00ff,  // 0: Hyperbolic Prism - magenta
      0x00ffff,  // 1: Singularity Knot - cyan
      0xffff00,  // 2: Quantum Lattice - yellow
      0xff8800,  // 3: Fractal Bloom - orange
      0xff0088,  // 4: Reactive Tesseract - hot pink
      0xff2200,  // 5: Chaotic Heart - crimson
      0x88ff00,  // 6: Whisper Sphere - lime
      0x0088ff,  // 7: Echo Fractal - azure
      0xff00aa,  // 8: Abyssal Shard - magenta-red
      0x00ff88,  // 9: Tri-Helix - spring green
      0x8800ff,  // 10: Infinite Spiral - violet
      0xffaa00   // 11: Chrono Ripper - gold
    ];
    return extremeColors[Math.max(0, Math.min(11, archetypeId))];
  }
  
  /**
   * T2-001: Add secondary glow layer for extreme nodes
   * Creates enhanced ring and chromatic halo effect
   */
  addExtremeSecondaryGlowLayer(visualData, color) {
    const overlayGroup = visualData.components.overlayGroup;
    if (!overlayGroup) return;
    
    this.removeChildByName(overlayGroup, 'extreme-secondary-glow');
    
    const extremeContainer = new THREE.Group();
    extremeContainer.name = 'extreme-secondary-glow';
    overlayGroup.add(extremeContainer);
    
    // Secondary ring with 2-3× glow radius
    const ringGeometry = new THREE.TorusGeometry(2.5, 0.15, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      emissive: color,
      emissiveIntensity: 0.8,
      side: THREE.DoubleSide
    });
    
    const secondaryRing = new THREE.Mesh(ringGeometry, ringMaterial);
    secondaryRing.rotation.x = Math.PI / 3;
    extremeContainer.add(secondaryRing);
    
    // Chromatic halo (rings offset in time)
    const haloGeometry = new THREE.SphereGeometry(2.0, 32, 32);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      emissive: color,
      emissiveIntensity: 0.4,
      depthWrite: false
    });
    
    const extremeHalo = new THREE.Mesh(haloGeometry, haloMaterial);
    extremeContainer.add(extremeHalo);
    
    visualData.components.extremeSecondaryGlow = extremeContainer;
    visualData.components.extremeRing = secondaryRing;
    visualData.components.extremeHalo = extremeHalo;
  }

  /**
   * Ensure overlay group exists once per node and reset component cache
   */
  ensureOverlayGroup(node, visualData, nodeId) {
    let overlayGroup = visualData.components.overlayGroup;
    
    if (overlayGroup && overlayGroup.parent !== node) {
      overlayGroup = null;
    }
    
    if (!overlayGroup) {
      overlayGroup = new THREE.Group();
      overlayGroup.name = `VFX::NodeVisuals4::${nodeId}`;
      node.add(overlayGroup);
    } else {
      // Clear previous children to prevent duplication
      this.clearOverlayGroupChildren(overlayGroup);
      overlayGroup.position.set(0, 0, 0);
      overlayGroup.rotation.set(0, 0, 0);
      overlayGroup.scale.set(1, 1, 1);
    }
    
    // Reset components while keeping overlay reference
    visualData.components = { overlayGroup };
  }

  /**
   * Remove named child from overlay group (with disposal)
   */
  removeChildByName(group, name) {
    if (!group) return;
    const child = group.getObjectByName(name);
    if (child) {
      group.remove(child);
      this.disposeObjectRecursive(child);
    }
  }

  /**
   * Dispose geometries/materials recursively
   */
  disposeObjectRecursive(obj) {
    if (!obj) return;
    obj.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose?.();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose?.());
        } else {
          child.material.dispose?.();
        }
      }
    });
  }

  /**
   * Clear all children from overlay group safely
   */
  clearOverlayGroupChildren(group) {
    if (!group) return;
    const children = [...group.children];
    children.forEach(child => {
      group.remove(child);
      this.disposeObjectRecursive(child);
    });
  }
  
  /**
   * Step 1: Add hologram core with soft inner glow
   */
  addHologramCore(visualData, color) {
    const overlayGroup = visualData.components.overlayGroup;
    if (!overlayGroup) return;
    
    this.removeChildByName(overlayGroup, 'hologram-core');
    
    const coreContainer = new THREE.Group();
    coreContainer.name = 'hologram-core';
    overlayGroup.add(coreContainer);
    
    // Inner glow sphere
    if (vfxFlag('ATOMA_VFX_ENABLE_NODE_INNER_GLOW', true)) {
      const glowGeometry = new THREE.SphereGeometry(
        this.config.coreGlowScale,
        32,
        32
      );
      
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: this.config.coreGlowIntensity,
        side: THREE.BackSide
      });
      
      const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
      coreContainer.add(glowSphere);
      
      visualData.components.glowSphere = glowSphere;
      visualData.components.glowMaterial = glowMaterial;
    } else {
      visualData.components.glowSphere = null;
      visualData.components.glowMaterial = null;
    }
  }
  
  /**
   * Step 2: Add spectral energy ring (rotating)
   */
  addSpectralEnergyRing(visualData, color) {
    const overlayGroup = visualData.components.overlayGroup;
    if (!overlayGroup) return;
    
    this.removeChildByName(overlayGroup, 'spectral-rings');
    
    const ringContainer = new THREE.Group();
    ringContainer.name = 'spectral-rings';
    overlayGroup.add(ringContainer);
    
    // Create multiple energy rings
    const rings = [];
    const seedKey = String(visualData.node?.uuid || visualData.node?.userData?.nodeId || visualData.node?.id || 'node');
    for (let i = 0; i < this.config.ringCount; i++) {
      const ringGeometry = new THREE.TorusGeometry(1.2 + i * 0.3, 0.06, 16, 100);
      
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: this.config.ringOpacity - (i * 0.1)
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      const phase = this._hash01(`${seedKey}:ring:${i}`);
      ring.rotation.x = (Math.PI * 0.18) + phase * Math.PI * 0.82;
      ring.rotation.y = phase * Math.PI * 2;
      ring.rotation.z = (Math.PI * 0.12) + this._hash01(`${seedKey}:ring:z:${i}`) * Math.PI * 0.6;
      ring.userData.phase = phase;
      
      ringContainer.add(ring);
      rings.push(ring);
    }
    
    visualData.components.spectralRings = rings;
  }
  
  /**
   * Step 3: Add levitation field (local oscillation only, no world movement)
   */
  addLevitationField(visualData, color) {
    if (!this.config.levitationEnabled) return;
    
    const overlayGroup = visualData.components.overlayGroup;
    if (!overlayGroup) return;
    
    // Store base overlay position (always zeroed when created)
    visualData.components.levitationBaseY = 0;
    visualData.components.levitationTime = 0;
    
    // Create visual indicator (subtle floating particles effect)
    this.removeChildByName(overlayGroup, 'levitation-field');
    
    const levitationContainer = new THREE.Group();
    levitationContainer.name = 'levitation-field';
    overlayGroup.add(levitationContainer);
    
    // Create subtle levitation particles
    const particleGeometry = new THREE.SphereGeometry(0.02, 4, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3
    });
    
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(
        Math.cos(angle) * 0.8,
        0,
        Math.sin(angle) * 0.8
      );
      levitationContainer.add(particle);
    }
    
    visualData.components.levitationContainer = levitationContainer;
  }
  
  /**
   * Step 4: Add neon rim-light (stable, not pulsing)
   */
  addNeonRimLight(visualData, color) {
    const overlayGroup = visualData.components.overlayGroup;
    if (!overlayGroup) return;
    
    this.removeChildByName(overlayGroup, 'neon-rim');
    
    const rimContainer = new THREE.Group();
    rimContainer.name = 'neon-rim';
    overlayGroup.add(rimContainer);
    
    // Create rim-light torus
    const rimGeometry = new THREE.TorusGeometry(1.3, 0.08, 16, 100);
    const rimMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: this.config.rimLightOpacity,
      emissive: color,
      emissiveIntensity: this.config.rimLightIntensity
    });
    
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2.5;
    rim.userData.phase = this._hash01(`${visualData.node?.uuid || 'node'}:rim`);
    rimContainer.add(rim);
    
    visualData.components.rimLight = rim;
  }
  
  /**
   * Step 5: Add soft shadow/occlusion halo (static, no movement)
   */
  addOcclusionHalo(visualData, color) {
    if (!this.config.haloEnabled) return;
    
    const overlayGroup = visualData.components.overlayGroup;
    if (!overlayGroup) return;
    
    this.removeChildByName(overlayGroup, 'occlusion-halo');
    
    const haloContainer = new THREE.Group();
    haloContainer.name = 'occlusion-halo';
    
    // Create halo as soft shadow effect
    const haloGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: this.config.haloOpacity,
      side: THREE.BackSide
    });
    
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    haloContainer.add(halo);
    
    visualData.components.halo = halo;
  }

  /**
   * Step 6: Add an outer atmosphere shell to give the node more volume
   */
  addAtmosphericShell(visualData, color) {
    const overlayGroup = visualData.components.overlayGroup;
    if (!overlayGroup) return;

    this.removeChildByName(overlayGroup, 'atmosphere-shell');

    const shellContainer = new THREE.Group();
    shellContainer.name = 'atmosphere-shell';
    overlayGroup.add(shellContainer);

    const shellGeometry = new THREE.SphereGeometry(this.config.atmosphereShellScale, 28, 28);
    const shellMaterial = new THREE.MeshBasicMaterial({
      color: this._mixHex(color, 0xffffff, 0.16),
      transparent: true,
      opacity: this.config.atmosphereShellOpacity,
      side: THREE.BackSide,
      depthWrite: false
    });

    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    shell.userData.phase = this._hash01(`${visualData.node?.uuid || 'node'}:shell`);
    shellContainer.add(shell);

    visualData.components.atmosphereShell = shell;
    visualData.components.atmosphereShellMaterial = shellMaterial;
  }

  /**
   * Step 7: Add small orbit crown markers around the node perimeter
   */
  addOrbitCrown(visualData, color, seedKey) {
    const overlayGroup = visualData.components.overlayGroup;
    if (!overlayGroup) return;

    this.removeChildByName(overlayGroup, 'orbit-crown');

    const crownContainer = new THREE.Group();
    crownContainer.name = 'orbit-crown';
    overlayGroup.add(crownContainer);

    const crownGeometry = new THREE.SphereGeometry(this.config.orbitCrownSize, 10, 10);
    const crownMarkers = [];
    for (let i = 0; i < this.config.orbitCrownCount; i++) {
      const phase = this._hash01(`${seedKey}:crown:${i}`);
      const crownMaterial = new THREE.MeshBasicMaterial({
        color: this._mixHex(color, 0xffffff, 0.18 + phase * 0.18),
        transparent: true,
        opacity: this.config.orbitCrownOpacity - (phase * 0.04)
      });
      const marker = new THREE.Mesh(crownGeometry.clone(), crownMaterial);
      const angle = phase * Math.PI * 2;
      const wobble = 1 + (phase - 0.5) * this.config.orbitCrownWobble;
      marker.position.set(
        Math.cos(angle) * this.config.orbitCrownRadius * wobble,
        (phase - 0.5) * 0.12,
        Math.sin(angle) * this.config.orbitCrownRadius * wobble
      );
      marker.userData.phase = phase;
      crownContainer.add(marker);
      crownMarkers.push(marker);
    }

    visualData.components.orbitCrown = crownContainer;
    visualData.components.orbitCrownMarkers = crownMarkers;
  }

  /**
   * Step 8: Add a wider tri-axis aura so the node remains readable at scale
   */
  addTriAxisAura(visualData, color) {
    const overlayGroup = visualData.components.overlayGroup;
    if (!overlayGroup) return;

    this.removeChildByName(overlayGroup, 'tri-axis-aura');

    const auraGroup = new THREE.Group();
    auraGroup.name = 'tri-axis-aura';
    overlayGroup.add(auraGroup);

    const auraColor = this._mixHex(color, 0xffffff, 0.08);
    const auraConfigs = [
      { radius: 2.15, tube: 0.028, rot: [Math.PI / 2, 0, 0], opacity: 0.18 },
      { radius: 1.92, tube: 0.024, rot: [0, Math.PI / 2, 0], opacity: 0.15 },
      { radius: 1.7, tube: 0.02, rot: [0, 0, Math.PI / 2], opacity: 0.13 }
    ];

    const rings = [];
    for (const config of auraConfigs) {
      const geometry = new THREE.TorusGeometry(config.radius, config.tube, 16, 120);
      const material = new THREE.MeshBasicMaterial({
        color: auraColor,
        transparent: true,
        opacity: config.opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(geometry, material);
      ring.rotation.set(config.rot[0], config.rot[1], config.rot[2]);
      auraGroup.add(ring);
      rings.push(ring);
    }

    const auraShellGeometry = new THREE.SphereGeometry(2.05, 24, 24);
    const auraShellMaterial = new THREE.MeshBasicMaterial({
      color: auraColor,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const auraShell = new THREE.Mesh(auraShellGeometry, auraShellMaterial);
    auraGroup.add(auraShell);

    visualData.components.triAxisAura = auraGroup;
    visualData.components.triAxisAuraRings = rings;
    visualData.components.triAxisAuraShell = auraShell;
  }
  
  /**
   * Update all nodes with 4.0 effects
   */
  update(deltaTime) {
    if (typeof window !== 'undefined' && window.ATOMA_VISUAL_BASELINE) return;

    if (!this.config.enabled) return;
    
    this.registry.time += deltaTime;
    this.registry.frameCounter++;
    
    // Update each upgraded node
    this.nodeVisualRegistry.forEach((visualData, nodeId) => {
      const node = visualData.node;
      if (!node || !node.parent || node.uuid !== nodeId) return;
      
      const overlayGroup = visualData.components.overlayGroup;
      if (!overlayGroup || overlayGroup.parent !== node) return;
      
      // Update spectral rings rotation
      if (visualData.components.spectralRings) {
        visualData.components.spectralRings.forEach((ring, i) => {
          const direction = i % 2 === 0 ? 1 : -1;
          const phase = ring.userData?.phase ?? 0.5;
          ring.rotation.x += this.config.ringRotationSpeed * direction * (0.85 + phase * 0.25);
          ring.rotation.y += this.config.ringRotationSpeed * 0.35 * (direction > 0 ? 1 : -1);
          ring.rotation.z += this.config.ringRotationSpeed * 0.7;
          ring.material.opacity = Math.max(0.08, (this.config.ringOpacity - (i * 0.1)) * (0.9 + Math.sin(this.registry.time * 0.9 + phase * Math.PI * 2) * 0.08));
        });
      }
      
      // Update levitation field (local position oscillation only)
      if (visualData.components.levitationContainer) {
        visualData.components.levitationTime += deltaTime;
        
        const oscillation = Math.sin(visualData.components.levitationTime * this.config.levitationFrequency) 
          * this.config.levitationAmplitude;
        
        // Only oscillate overlay group Y position (baseline untouched)
        overlayGroup.position.y = visualData.components.levitationBaseY + oscillation;
      }
      
      // Update internal pulse
      if (visualData.components.pulseEnabled && visualData.components.glowMaterial) {
        const pulse = 0.5 + 0.5 * Math.sin(this.registry.time * this.config.pulseSpeed);
        const pulseOpacity = this.config.coreGlowIntensity * (0.85 + pulse * this.config.pulseIntensity);
        visualData.components.glowMaterial.opacity = pulseOpacity;
      }

      if (visualData.components.atmosphereShellMaterial) {
        const phase = visualData.components.atmosphereShell?.userData?.phase ?? 0.5;
        const pulse = 0.5 + 0.5 * Math.sin(this.registry.time * 0.72 + phase * Math.PI * 2);
        visualData.components.atmosphereShellMaterial.opacity = this.config.atmosphereShellOpacity + pulse * 0.03;
      }

      if (visualData.components.orbitCrown) {
        const crownPulse = 0.5 + 0.5 * Math.sin(this.registry.time * 1.2);
        visualData.components.orbitCrown.rotation.y += 0.0025;
        visualData.components.orbitCrown.rotation.x = Math.sin(this.registry.time * 0.45) * 0.06;
        visualData.components.orbitCrown.children.forEach((marker, index) => {
          if (!marker?.material) return;
          const phase = marker.userData?.phase ?? 0.5;
          const markerPulse = crownPulse * (0.86 + phase * 0.22);
          marker.scale.setScalar(0.95 + markerPulse * 0.3);
          marker.material.opacity = Math.max(0.05, this.config.orbitCrownOpacity * (0.7 + markerPulse * 0.4));
          marker.position.y = Math.sin(this.registry.time * 1.1 + index * 0.45) * 0.05;
        });
      }

      if (visualData.components.triAxisAura) {
        const auraPulse = 0.5 + 0.5 * Math.sin(this.registry.time * 0.8);
        visualData.components.triAxisAura.rotation.y += 0.0018;
        visualData.components.triAxisAura.rotation.z = Math.sin(this.registry.time * 0.32) * 0.05;
        if (visualData.components.triAxisAuraRings) {
          visualData.components.triAxisAuraRings.forEach((ring, i) => {
            if (!ring?.material) return;
            const phase = i * 0.85;
            ring.rotation.x += 0.0008 * (i % 2 === 0 ? 1 : -1);
            ring.rotation.z += 0.0005 * (i + 1);
            ring.scale.setScalar(1 + auraPulse * 0.08);
            ring.material.opacity = 0.11 + auraPulse * (0.04 + i * 0.01);
          });
        }
        if (visualData.components.triAxisAuraShell?.material) {
          visualData.components.triAxisAuraShell.material.opacity = 0.06 + auraPulse * 0.04;
          visualData.components.triAxisAuraShell.scale.setScalar(1 + auraPulse * 0.03);
        }
      }

      if (visualData.components.extremeSecondaryGlow) {
        visualData.components.extremeSecondaryGlow.rotation.y += 0.0015;
        visualData.components.extremeSecondaryGlow.rotation.z += 0.0008;
      }
    });
  }
  
  /**
   * Upgrade all nodes in scene
   */
  upgradeAllNodes(nodes) {
    if (typeof window !== 'undefined' && window.ATOMA_VISUAL_BASELINE) return;

    nodes.forEach(node => {
      this.upgradeNode(node);
    });
    console.log(`✅ NODE VISUALS 4.0: Upgraded ${nodes.length} nodes`);
  }
  
  /**
   * Enable/disable visuals
   */
  enable() {
    this.config.enabled = true;
  }
  
  disable() {
    this.config.enabled = false;
  }
  
  /**
   * Downgrade/cleanup visuals for a single node
   */
  downgradeNode(node) {
    if (!node) return;
    const nodeId = node.uuid || null;
    if (!nodeId) return;
    
    const visualData = this.nodeVisualRegistry.get(nodeId);
    if (!visualData) return;
    
    const overlayGroup = visualData.components?.overlayGroup;
    if (overlayGroup) {
      this.clearOverlayGroupChildren(overlayGroup);
      if (overlayGroup.parent) {
        overlayGroup.parent.remove(overlayGroup);
      }
    }
    
    visualData.components = {};
    this.nodeVisualRegistry.delete(nodeId);
  }
  
  /**
   * Get status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      upgradeCount: this.registry.upgradeCount,
      registrySize: this.nodeVisualRegistry.size,
      frameCounter: this.registry.frameCounter,
      time: this.registry.time
    };
  }
  
  /**
   * Print status report
   */
  printStatusReport() {
    console.log('\n🎨 NODE VISUALS 4.0: STATUS REPORT');
    console.log('   ┌────────────────────────────────┐');
    
    console.log('   1️⃣  HOLOGRAM CORE');
    console.log(`       Glow Intensity: ${this.config.coreGlowIntensity}`);
    console.log(`       Glow Scale:     ${this.config.coreGlowScale}`);
    
    console.log('   2️⃣  SPECTRAL ENERGY RINGS');
    console.log(`       Ring Count:     ${this.config.ringCount}`);
    console.log(`       Ring Opacity:   ${this.config.ringOpacity}`);
    console.log(`       Rotation Speed: ${this.config.ringRotationSpeed}`);
    
    console.log('   3️⃣  LEVITATION FIELD');
    console.log(`       Enabled:        ${this.config.levitationEnabled}`);
    console.log(`       Amplitude:      ${this.config.levitationAmplitude}`);
    console.log(`       Frequency:      ${this.config.levitationFrequency}`);
    
    console.log('   4️⃣  NEON RIM-LIGHT');
    console.log(`       Intensity:      ${this.config.rimLightIntensity}`);
    console.log(`       Opacity:        ${this.config.rimLightOpacity}`);
    
    console.log('   5️⃣  INTERNAL PULSE');
    console.log(`       Enabled:        ${this.config.pulseEnabled}`);
    console.log(`       Speed:          ${this.config.pulseSpeed}`);
    console.log(`       Intensity:      ${this.config.pulseIntensity}`);
    
    console.log('   6️⃣  OCCLUSION HALO');
    console.log(`       Enabled:        ${this.config.haloEnabled}`);
    console.log(`       Opacity:        ${this.config.haloOpacity}`);
    
    console.log('   ├────────────────────────────────┤');
    console.log(`   Upgraded Nodes: ${this.registry.upgradeCount}`);
    console.log(`   Status: ${this.config.enabled ? '✅ ACTIVE' : '❌ INACTIVE'}`);
    console.log('   └────────────────────────────────┘\n');
  }
}
