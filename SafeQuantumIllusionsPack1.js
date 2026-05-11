/**
 * SafeQuantumIllusionsPack1.js
 * 
 * SAFE QUANTUM ILLUSIONS PACK 1.0
 * Visual-only hallucination effects caused by quantum instability
 * 
 * 10 Core Illusions:
 * 1. Quantum Echo Doubles - Faint ghost copies with chromatic offset
 * 2. Reality Shards - Glass-like fractures floating in air
 * 3. Space Drift - Localized distortions that warp air
 * 4. Quantum After-Paths - Glitchy shadow trails from fast movement
 * 5. Floating Symbols - AI glyphs that drift and fade
 * 6. Hyperfocus Moment - Screen-space iris focus effect
 * 7. Ghost-Warp Movement Markers - Flickering position traces
 * 8. World Bend Moments - Slight horizon curvature distortions
 * 9. Sigma Hallucination - Rare phantom figures made of dots
 * 10. Despawn & Cleanup - Auto-removal and memory management
 * 
 * SAFETY RULES VERIFIED:
 * ✓ No shader modifications
 * ✓ No physics changes
 * ✓ No collision changes
 * ✓ No input changes
 * ✓ All illusions are temporary VFX objects
 * ✓ All illusions fade and auto-remove
 * ✓ Zero modifications to Node, Link, Player, Weather, or Evolution systems
 * ✓ Pure external VFX architecture
 */

import * as THREE from 'three';
import { QuantumIllusionRegistry } from './QuantumIllusionRegistry.js';
import { normalizeEnvironmentGeometry } from './RoundedEnvironmentGeometry.js';
import { getEnvSpriteTexture } from './EnvironmentPointFXBase.js';

export class SafeQuantumIllusionsPack1 {
  constructor(scene, environmentRoot, camera, aiNodes, linkingSystem, worldEvents, weatherPack, legendaryPack, sharedAssets = null) {
    this.scene = scene;
    this.environmentRoot = environmentRoot || scene;
    this.root = new THREE.Group();
    this.root.name = 'SafeQuantumIllusionsRoot';
    this.environmentRoot.add(this.root);
    this.camera = camera;
    this.aiNodes = aiNodes;
    this.linkingSystem = linkingSystem;
    this.worldEvents = worldEvents;
    this.weatherPack = weatherPack;
    this.legendaryPack = legendaryPack;
    this.sharedAssets = sharedAssets ?? null;
    
    // Central illusion registry
    this.registry = new QuantumIllusionRegistry(scene, this.sharedAssets);
    this.localGeometryCache = new Map();
    this._tempColorA = new THREE.Color();
    this._tempColorB = new THREE.Color();
    this._tempColorC = new THREE.Color();
    this._tempVectorA = new THREE.Vector3();
    this._tempVectorB = new THREE.Vector3();
    this._tempVectorC = new THREE.Vector3();
    // Triggering conditions
    this.synergy = 0;
    this.lastSynergy = 0;
    this.quantumStormActive = false;
    this.lastAwakenTime = -10;
    this.highTrafficBurst = false;
    this.lastLegendaryCount = 0;
    this.runtimeEnabled = true;
    this.echoSpawnCooldown = 0;
    this._afterPathsPruned = false;

    // CPU optimization: spawn/condition logic throttled to ~10Hz
    // Animation (updateAllIllusions) stays at full 30Hz for smooth visuals
    this._spawnAccumulator = 0;
    this._spawnInterval = 0.1; // 100ms = ~10Hz

    // Dramaturgy modulation — driven by EventDramaturgyEngine
    this._dramaturgyModulation = {
      active: false,
      family: null,       // cascade | corruption | resonance | ritual | hazard
      phase: null,        // telegraph | escalation | payoff
      intensity: 0,       // 0-1
      ttl: 0              // auto-decay when dramaturgy stops pushing
    };
    this._dramaturgySpawnBoost = 0;
    
    // Global illusion envelope profile
    this.illusionEnvelopeProfile = {
      attack: 0.15,
      crest: 0.35,
      release: 0.3,
      afterglow: 0.2
    };

    // Shared ATOMA palette
    this.palette = {
      voidDeep: 0x05131a,
      signalCyan: 0x6deaff,
      sacredWhite: 0xf7fbff,
      resurrectionMint: 0x77f7db,
      revelationViolet: 0xd07bff,
      breachRose: 0xff73cf
    };
    
    // Myth mode state
    this.mythModes = {
      REVELATION: {
        effects: ['echoes', 'drifts', 'symbols', 'hyperfocus'],
        palette: [this.palette.signalCyan, this.palette.revelationViolet, this.palette.sacredWhite],
        intensity: 0.95
      },
      VEIL_BREACH: {
        effects: ['shards', 'afterPaths', 'ghostMarkers', 'worldBends'],
        palette: [this.palette.breachRose, this.palette.signalCyan, this.palette.voidDeep],
        intensity: 1.1
      },
      ASCENSION: {
        effects: ['echoes', 'symbols', 'ghostMarkers', 'worldBends', 'sigmaHallucination'],
        palette: [this.palette.resurrectionMint, this.palette.sacredWhite, this.palette.signalCyan],
        intensity: 1.0
      }
    };
    this.mode = 'REVELATION';
    
    // Screen-space effects container
    this.screenSpaceContainer = new THREE.Group();
    this.screenSpaceContainer.name = 'QuantumIllusions_ScreenSpace';
    this.root.add(this.screenSpaceContainer);
    if (typeof window !== 'undefined') {
      window.__ATOMA_SPHERE_POLICY__?.registerRoot?.(this.screenSpaceContainer, 'quantum-illusions-screenspace');
    }
    
    // Illusion config
    this.config = {
      echoes: {
        enabled: true,
        maxActive: 20,
        maxCluster: 6,
        cooldown: 0.28,
        opacityRange: [0.05, 0.2],
        offsetRange: [0.2, 0.5],
        lifetime: [0.2, 1.0]
      },
      shards: {
        enabled: true,
        maxActive: 15,
        lifetime: [1, 3],
        opacityRange: [0.1, 0.3]
      },
      drifts: {
        enabled: true,
        maxActive: 10,
        lifetime: [1.5, 3],
        opacityRange: [0.08, 0.25]
      },
      afterPaths: {
        enabled: false,
        maxActive: 25,
        lifetime: [0.2, 0.4],
        opacityRange: [0.1, 0.25]
      },
      symbols: {
        enabled: true,
        maxActive: 8,
        lifetime: [2, 4],
        opacityRange: [0.3, 0.7]
      },
      hyperfocus: {
        enabled: true,
        duration: 0.15,
        vignetteIntensity: 0.2
      },
      ghostMarkers: {
        enabled: true,
        maxActive: 12,
        lifetime: [0.3, 1.0],
        opacityRange: [0.15, 0.4]
      },
      worldBends: {
        enabled: true,
        maxActive: 3,
        intensity: [0.01, 0.03],
        lifetime: [1, 2]
      },
      sigmaHallucination: {
        enabled: true,
        rarity: 0.002,
        flickerCount: [3, 6],
        lifetime: 0.5
      }
    };
    
    console.log('✓ Safe Quantum Illusions Pack 1.0 initialized');
  }

  _getSharedGeometry(key, factory) {
    const resolveGeometry = () => normalizeEnvironmentGeometry(factory());
    if (this.sharedAssets?.getSharedGeometry) {
      return this.sharedAssets.getSharedGeometry(`SafeQuantumIllusionsPack1:${key}`, resolveGeometry);
    }
    if (this.localGeometryCache.has(key)) {
      return this.localGeometryCache.get(key);
    }
    const geometry = resolveGeometry();
    this.localGeometryCache.set(key, geometry);
    return geometry;
  }

  _getSoftPointSpriteTexture() {
    return getEnvSpriteTexture('plasma');
  }

  _disposeObject3D(object3D) {
    if (!object3D) return;

    const disposedGeometries = new Set();
    const disposedMaterials = new Set();

    object3D.traverse((child) => {
      if (child.geometry && !disposedGeometries.has(child.geometry)) {
        disposedGeometries.add(child.geometry);
        if (!this.sharedAssets?.releaseGeometry?.(child.geometry) && typeof child.geometry.dispose === 'function') {
          child.geometry.dispose();
        }
      }

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (!material || disposedMaterials.has(material)) continue;
        disposedMaterials.add(material);
        if (!this.sharedAssets?.releaseMaterial?.(material) && typeof material.dispose === 'function') {
          material.dispose();
        }
      }
    });
  }

  _disposeCachedGeometries() {
    for (const geometry of this.localGeometryCache.values()) {
      if (geometry && typeof geometry.dispose === 'function') {
        geometry.dispose();
      }
    }
    this.localGeometryCache.clear();
  }

  createIllusionEnvelope(overrides = {}) {
    return {
      attack: overrides.attack ?? this.illusionEnvelopeProfile.attack,
      crest: overrides.crest ?? this.illusionEnvelopeProfile.crest,
      release: overrides.release ?? this.illusionEnvelopeProfile.release,
      afterglow: overrides.afterglow ?? this.illusionEnvelopeProfile.afterglow
    };
  }

  calculateEnvelopeProgress(progress, envelope) {
    const p = Math.min(Math.max(progress, 0), 1);
    const attackEnd = envelope.attack;
    const crestEnd = attackEnd + envelope.crest;
    const releaseEnd = crestEnd + envelope.release;
    const total = releaseEnd + envelope.afterglow;
    const normalized = p * total;

    if (normalized <= attackEnd) {
      return {
        value: normalized / Math.max(attackEnd, 1e-6),
        stage: 'attack'
      };
    }
    if (normalized <= crestEnd) {
      return {
        value: 1,
        stage: 'crest'
      };
    }
    if (normalized <= releaseEnd) {
      return {
        value: 1 - (normalized - crestEnd) / Math.max(envelope.release, 1e-6),
        stage: 'release'
      };
    }

    return {
      value: 0.25 + 0.75 * (1 - (normalized - releaseEnd) / Math.max(envelope.afterglow, 1e-6)),
      stage: 'afterglow'
    };
  }

  getOrchestralLayerWeight(effectKey, time) {
    const orchestra = {
      echoes: { speed: 1.0, phase: 0.2, min: 0.24 },
      shards: { speed: 0.58, phase: 1.0, min: 0.18 },
      drifts: { speed: 0.76, phase: 0.5, min: 0.22 },
      afterPaths: { speed: 1.8, phase: 2.2, min: 0.12 },
      symbols: { speed: 0.66, phase: 0.9, min: 0.2 },
      ghostMarkers: { speed: 1.4, phase: 3.1, min: 0.1 },
      worldBends: { speed: 0.24, phase: 0.1, min: 0.18 },
      hallucinations: { speed: 0.12, phase: 1.7, min: 0.05 }
    };
    const spec = orchestra[effectKey] || { speed: 1.0, phase: 0, min: 0.2 };
    const pulse = (Math.sin(time * spec.speed + spec.phase) + 1) * 0.5;
    return Math.max(spec.min, pulse);
  }

  applyEnvelopeToMaterial(entry, envelopeValue) {
    const materials = [];
    if (entry.mesh?.material) {
      materials.push(entry.mesh.material);
    }
    if (Array.isArray(entry.config?.pieceMeshes)) {
      for (const piece of entry.config.pieceMeshes) {
        if (piece?.material) {
          materials.push(piece.material);
        }
      }
    }
    for (const material of materials) {
      if (material.opacity !== undefined) {
        material.opacity = Math.max(0, (entry.config?.baseOpacity ?? 1) * envelopeValue);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Dramaturgy Modulation — Conditional Activation
  // ---------------------------------------------------------------------------

  /**
   * Receive dramaturgy state from EventDramaturgyEngine.
   * Maps event families → illusion modes, phases → spawn intensity.
   *
   * Family → Mode:
   *   cascade     → VEIL_BREACH  (shards, afterPaths, ghostMarkers, worldBends)
   *   corruption  → VEIL_BREACH  (dark distortions)
   *   ritual      → ASCENSION    (echoes, symbols, ghostMarkers, worldBends, sigma)
   *   resonance   → REVELATION   (echoes, drifts, symbols, hyperfocus)
   *   hazard      → VEIL_BREACH  (unstable distortions)
   *
   * Phase → Spawn Boost:
   *   telegraph   → 0.15 (subtle reality flickers)
   *   escalation  → 0.40 (full quantum distortions)
   *   payoff      → 0.08 (fading)
   */
  setDramaturgyModulation(state) {
    if (!state || !state.dominantFamily) {
      return;
    }

    this._dramaturgyModulation.active = true;
    this._dramaturgyModulation.family = state.dominantFamily;
    this._dramaturgyModulation.phase = state.dominantPhase || 'telegraph';
    this._dramaturgyModulation.intensity = state.dominantIntensity || 0;
    this._dramaturgyModulation.ttl = 2.5; // Refresh TTL — 2.5s grace after dramaturgy stops
  }

  /**
   * Map dramaturgy family → myth mode override.
   */
  _getDramaturgyModeOverride() {
    const mod = this._dramaturgyModulation;
    if (!mod.active || mod.ttl <= 0) return null;

    const FAMILY_TO_MODE = {
      cascade: 'VEIL_BREACH',
      corruption: 'VEIL_BREACH',
      ritual: 'ASCENSION',
      resonance: 'REVELATION',
      hazard: 'VEIL_BREACH'
    };

    return FAMILY_TO_MODE[mod.family] || null;
  }

  /**
   * Get spawn boost from dramaturgy phase.
   * This boost is added to spawn scores and multiplied with random chances.
   */
  _getDramaturgySpawnBoost() {
    const mod = this._dramaturgyModulation;
    if (!mod.active || mod.ttl <= 0) return 0;

    switch (mod.phase) {
      case 'telegraph':  return 0.15;
      case 'escalation': return 0.40;
      case 'payoff':     return 0.08;
      default:           return 0;
    }
  }

  /**
   * Decay dramaturgy modulation TTL when no longer receiving updates.
   */
  _decayDramaturgyModulation(deltaTime) {
    const mod = this._dramaturgyModulation;
    if (!mod.active) return;

    mod.ttl -= deltaTime;
    if (mod.ttl <= 0) {
      mod.active = false;
      mod.family = null;
      mod.phase = null;
      mod.intensity = 0;
      mod.ttl = 0;
      this._dramaturgySpawnBoost = 0;
    }
  }

  setMode(mode) {
    if (!this.mythModes[mode]) {
      console.warn(`SafeQuantumIllusionsPack1: unknown mode '${mode}', keeping current mode '${this.mode}'.`);
      return;
    }
    this.mode = mode;
  }

  getModeDefinition(mode = this.mode) {
    return this.mythModes[mode] || this.mythModes.REVELATION;
  }

  getModeColor(index = 0) {
    const palette = this.getModeDefinition().palette;
    return new THREE.Color(palette[index % palette.length]);
  }

  isModeActive(effectKey) {
    const modeEffects = this.getModeDefinition().effects || [];
    return modeEffects.includes(effectKey);
  }
  
  /**
   * Main update loop
   */
  update(deltaTime) {
    if (!this.runtimeEnabled) return;
    
    if (!this.scene) return;

    if (!this.config.afterPaths.enabled) {
      if (!this._afterPathsPruned) {
        this._clearIllusionType('afterPaths');
        this._afterPathsPruned = true;
      }
    } else {
      this._afterPathsPruned = false;
    }

    // Decay dramaturgy modulation (every tick — cheap)
    this._decayDramaturgyModulation(deltaTime);
    
    // Update registry lifetime tracking (every tick — needed for cleanup)
    this.registry.update(deltaTime);
    this.echoSpawnCooldown = Math.max(0, this.echoSpawnCooldown - deltaTime);

    // CPU OPTIMIZATION: throttle spawn/condition logic to ~10Hz
    // These methods read metrics, iterate links, and decide spawning — no need for 30Hz.
    // Animation (updateAllIllusions) stays at full 30Hz for smooth visuals.
    this._spawnAccumulator += deltaTime;
    if (this._spawnAccumulator >= this._spawnInterval) {
      const spawnDt = this._spawnAccumulator;
      this._spawnAccumulator = 0;

      this.updateTriggeringConditions(spawnDt);
      
      // Generate illusions based on conditions
      this.generateEchoDoubles();
      this.generateRealityShards();
      this.generateSpaceDrift();
      this.generateAfterPaths();
      this.generateFloatingSymbols();
      this.updateHyperfocusMoment();
      this.generateGhostMarkers();
      this.generateWorldBends();
      this.generateSigmaHallucination();
    }
    
    // Update all active illusions (every tick — smooth 30Hz animation)
    this.updateAllIllusions(deltaTime);
  }
  
  /**
   * Update triggering conditions from world systems
   */
  updateTriggeringConditions(deltaTime = 0.016) {
    this.synergy = this._readAverageLinkSynergy();
    
    // Detect synergy spike
    const synergySpiked = this.synergy > 0.7 && this.lastSynergy <= 0.7;
    this.lastSynergy = this.synergy;
    
    // Read canonical active weather state from the pack's public API or registry.
    const weatherType =
      this.weatherPack?.getActiveWeatherType?.() ||
      this.weatherPack?.registry?.active ||
      null;
    const activeEventType =
      this.worldEvents?.getActiveEventType?.() ||
      this.worldEvents?.registry?.activeEvent ||
      null;

    this.quantumStormActive = weatherType === 'QUANTUM_STORM' ||
      weatherType === 'SIGMA_TURBULENCE' ||
      activeEventType === 'QUANTUM_ECLIPSE' ||
      activeEventType === 'SIGMA_INVASION';
    
    // Approximate awakening recency from canonical legendary/event state transitions.
    const legendaryCount =
      this.legendaryPack?.getActiveLegendaryCount?.() ??
      Object.keys(this.legendaryPack?.registry || {}).length;
    const legendarySurge = legendaryCount > this.lastLegendaryCount;
    const legendaryEventActive = typeof activeEventType === 'string' &&
      ['QUANTUM_ECLIPSE', 'SIGMA_INVASION', 'COSMIC_PULSE'].includes(activeEventType);
    if (legendarySurge || legendaryEventActive || synergySpiked) {
      this.lastAwakenTime = 0;
    } else {
      this.lastAwakenTime += deltaTime;
    }
    this.lastLegendaryCount = legendaryCount;
    
    // Check for high traffic burst
    if (this.linkingSystem && this.linkingSystem.links) {
      let highTraffic = 0;
      for (const link of this.linkingSystem.links) {
        if (link.active && link.traffic && link.traffic.throughput > 0.8) {
          highTraffic++;
        }
      }
      this.highTrafficBurst = highTraffic > this.linkingSystem.links.length * 0.3;
    }

    // Compute dramaturgy spawn boost for all generate methods
    this._dramaturgySpawnBoost = this._dramaturgyModulation.active && this._dramaturgyModulation.ttl > 0
      ? this._getDramaturgySpawnBoost()
      : 0;

    // Determine current myth mode from meaningful world state.
    // Dramaturgy mode override takes priority.
    const dramMode = this._getDramaturgyModeOverride();
    let nextMode = this.mode;
    if (dramMode) {
      nextMode = dramMode;
    } else if (legendarySurge || legendaryEventActive) {
      nextMode = 'ASCENSION';
    } else if (this.quantumStormActive || ['QUANTUM_ECLIPSE', 'SIGMA_INVASION'].includes(activeEventType)) {
      nextMode = 'VEIL_BREACH';
    } else if (this.highTrafficBurst || this.synergy > 0.6) {
      nextMode = 'REVELATION';
    } else if (activeEventType) {
      nextMode = 'VEIL_BREACH';
    } else {
      nextMode = 'REVELATION';
    }

    if (nextMode !== this.mode) {
      this.setMode(nextMode);
    }
  }

  _readAverageLinkSynergy() {
    const links = Array.isArray(this.linkingSystem?.links) ? this.linkingSystem.links : [];
    if (links.length === 0) return 0;

    let total = 0;
    let count = 0;
    for (const link of links) {
      if (typeof link?.glowData?.synergy === 'number') {
        total += link.glowData.synergy;
        count += 1;
      }
    }

    return count > 0 ? total / count : 0;
  }
  
  /**
   * 1. QUANTUM ECHO DOUBLES
   * Faint ghost copies offset by 0.2-0.5m with chromatic offset
   */
  generateEchoDoubles() {
    if (!this.config.echoes.enabled || !this.isModeActive('echoes') || !this.aiNodes) return;
    if (this.echoSpawnCooldown > 0) return;

    const activeEchoes = this.registry.getIllusionsByType('echoes');
    if (activeEchoes.length >= this.config.echoes.maxActive) return;

    const nodes = Array.isArray(this.aiNodes.nodes) ? this.aiNodes.nodes : [];
    if (nodes.length === 0) return;

    const nodeScores = [];
    for (const node of nodes) {
      if (!node?.mesh) continue;
      const base = 0.15;
      const nodeSynergy = typeof node?.glowData?.synergy === 'number' ? node.glowData.synergy : this.synergy;
      const motion = node.velocity?.length() ?? 0;
      const flux = node.linkFlux ?? node.flux ?? 0;
      const stormBoost = this.quantumStormActive ? 0.24 : 0;
      const awakenBoost = this.lastAwakenTime < 1 ? 0.24 : 0;
      const movementBoost = Math.min(1, motion / 12) * 0.28;
      const fluxBoost = Math.min(1, flux) * 0.18;
      const dramBoost = this._dramaturgySpawnBoost;
      nodeScores.push({
        node,
        score: base + nodeSynergy * 0.5 + movementBoost + fluxBoost + stormBoost + awakenBoost + dramBoost
      });
    }
    nodeScores.sort((a, b) => b.score - a.score);

    if (nodeScores.length === 0) return;
    
    const selection = nodeScores[0].node;
    const targetPos = this._tempVectorA.copy(selection.mesh.position);
    let clusterNearby = 0;
    for (const entry of activeEchoes) {
      if (entry.mesh?.position?.distanceTo(targetPos) < 4) {
        clusterNearby += 1;
      }
    }
    if (clusterNearby >= this.config.echoes.maxCluster) return;

    const intensity = Math.min(1, Math.max(0, (this.synergy - 0.4) * 1.3 + (this.quantumStormActive ? 0.22 : 0) + (this.lastAwakenTime < 1 ? 0.22 : 0)));
    const useHalo = intensity > 0.55;
    const glyphType = useHalo ? 'crown' : 'seal';

    const primaryMaterial = new THREE.MeshStandardMaterial({
      color: this.palette.sacredWhite,
      emissive: this.palette.signalCyan,
      emissiveIntensity: 0.32,
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    });
    const afterImageMaterial = new THREE.MeshStandardMaterial({
      color: this.palette.revelationViolet,
      emissive: this.palette.signalCyan,
      emissiveIntensity: 0.18,
      transparent: true,
      opacity: 0.16,
      depthWrite: false
    });

    const sourceGeometry = selection.mesh.geometry;
    if (!sourceGeometry || typeof sourceGeometry.clone !== 'function') return;
    const geometry = sourceGeometry;

    const dir = this._tempVectorB.set(0, 0, -1);
    if (selection.velocity) {
      dir.copy(selection.velocity).normalize();
    }
    const offset = this._tempVectorC.set(0, 0.05, 0).addScaledVector(dir, 0.22);
    const ghostPos = this._tempVectorA.copy(targetPos).add(offset);

    const ghostRoot = new THREE.Group();
    ghostRoot.name = 'EchoWitnessRoot';
    ghostRoot.position.copy(ghostPos);

    const primaryGhost = new THREE.Mesh(geometry, primaryMaterial);
    primaryGhost.scale.multiplyScalar(0.78);
    ghostRoot.add(primaryGhost);

    const afterImage = new THREE.Mesh(geometry, afterImageMaterial);
    afterImage.position.copy(dir).multiplyScalar(-0.24);
    afterImage.scale.multiplyScalar(0.85);
    ghostRoot.add(afterImage);

    const signatureGlyph = this.createQuantumGlyph(glyphType);
    signatureGlyph.scale.setScalar(useHalo ? 0.8 : 0.7);
    signatureGlyph.position.y = -0.02;
    signatureGlyph.rotation.x = -Math.PI / 2;
    ghostRoot.add(signatureGlyph);

    this.root.add(ghostRoot);
    this.echoSpawnCooldown = this.config.echoes.cooldown;

    const lifetime = THREE.MathUtils.randFloat(this.config.echoes.lifetime[0], this.config.echoes.lifetime[1]);
    this.registry.registerIllusion('echoes', {
      mesh: ghostRoot,
      type: 'echo',
      mythMode: this.mode,
      vibrationAmplitude: 0.03,
      vibrationSpeed: 7,
      driftDir: dir,
      driftSpeed: 0.04,
      emergenceSpeed: 6,
      baseOpacity: primaryMaterial.opacity,
      pieceMeshes: [primaryGhost, afterImage, signatureGlyph],
      envelope: this.createIllusionEnvelope()
    }, lifetime);
  }
  
  /**
   * 2. REALITY SHARDS
   * Glass-like cracks that float and shimmer
   */
  generateRealityShards() {
    if (!this.config.shards.enabled || !this.isModeActive('shards')) return;
    
    const count = this.registry.getIllusionsByType('shards').length;
    if (count >= this.config.shards.maxActive) return;
    
    // Spawn during sigma turbulence, high synergy, or dramaturgy events
    const dramSpawnChance = this._dramaturgySpawnBoost > 0 ? this._dramaturgySpawnBoost * 2 : 0;
    const shouldSpawn = (this.quantumStormActive || this.synergy > 0.75) && Math.random() < (0.02 + dramSpawnChance)
      || (this._dramaturgySpawnBoost > 0.1 && Math.random() < this._dramaturgySpawnBoost);
    if (!shouldSpawn) return;
    
    // Random position in front of camera
    const distance = THREE.MathUtils.randFloat(5, 20);
    const angle = Math.random() * Math.PI * 2;
    const height = Math.random() * 10;
    
    const spawnPos = this.camera.position.clone().add(
      new THREE.Vector3(
        Math.cos(angle) * distance,
        height - 5,
        Math.sin(angle) * distance
      )
    );
    
    // Create scripture fracture layers with segmented shards and ring fragments
    const shardGroup = new THREE.Group();
    shardGroup.name = 'ScriptureFracture';
    shardGroup.position.copy(spawnPos);

    const shardMaterial = new THREE.LineBasicMaterial({
      color: this.getModeColor(0),
      transparent: true,
      opacity: this.config.shards.opacityRange[1],
      linewidth: 2
    });

    const highlightMaterial = new THREE.LineBasicMaterial({
      color: this.palette.sacredWhite,
      transparent: true,
      opacity: 0.38,
      linewidth: 1
    });

    const segmentGeometry = this._getSharedGeometry('shards.segmentGeo', () => {
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const segments = 10;
      for (let i = 0; i < segments; i++) {
        const x = (i / segments - 0.5) * 2;
        const y = Math.sin(i * 1.2) * 0.5;
        const x2 = x + 0.12;
        const y2 = y + (Math.random() - 0.5) * 0.25;
        positions.push(x, y, 0, x2, y2, 0);
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      return geometry;
    });

    const fragmentRingGeometry = this._getSharedGeometry('shards.fragRingGeo', () => new THREE.RingGeometry(0.18, 0.24, 12, 1, 0, Math.PI * 0.75));

    const layers = 3;
    for (let layer = 0; layer < layers; layer++) {
      const shardMesh = new THREE.LineSegments(segmentGeometry, shardMaterial);
      shardMesh.rotation.z = layer * 0.3;
      shardMesh.position.y = layer * 0.15;
      shardMesh.scale.setScalar(1 - layer * 0.08);
      shardGroup.add(shardMesh);

      const edgeMesh = new THREE.LineSegments(segmentGeometry, highlightMaterial);
      edgeMesh.rotation.z = -layer * 0.2;
      edgeMesh.position.y = layer * 0.15 + 0.02;
      edgeMesh.scale.setScalar(1 - layer * 0.08);
      shardGroup.add(edgeMesh);
    }

    // PERFORMANCE: share one material across all 4 ring meshes (was 4 identical materials)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: this.getModeColor(1),
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const ringPositions = [
      [-0.45, 0.4, 0],
      [0.45, -0.4, 0],
      [-0.3, -0.6, 0],
      [0.3, 0.6, 0]
    ];
    for (let i = 0; i < ringPositions.length; i++) {
      const ringMesh = new THREE.Mesh(fragmentRingGeometry, ringMaterial);
      ringMesh.position.set(...ringPositions[i]);
      ringMesh.rotation.z = i * Math.PI * 0.4;
      ringMesh.scale.setScalar(0.75 + i * 0.08);
      shardGroup.add(ringMesh);
    }

    shardGroup.scale.multiplyScalar(THREE.MathUtils.randFloat(1, 2.2));
    this.root.add(shardGroup);

    const lifetime = THREE.MathUtils.randFloat(this.config.shards.lifetime[0], this.config.shards.lifetime[1]);

    this.registry.registerIllusion('shards', {
      mesh: shardGroup,
      type: 'shard',
      mythMode: this.mode,
      baseOpacity: shardMaterial.opacity,
      rotationAxis: new THREE.Vector3(
        Math.random(),
        Math.random(),
        Math.random()
      ).normalize(),
      rotationSpeed: THREE.MathUtils.randFloat(0.5, 2),
      envelope: this.createIllusionEnvelope()
    }, lifetime);
  }

  _createLayeredFieldSheetGeometry(width, height, options = {}) {
    const safeWidth = Math.max(0.001, Math.abs(width));
    const safeHeight = Math.max(0.001, Math.abs(height));
    const halfWidth = safeWidth * 0.5;
    const halfHeight = safeHeight * 0.5;
    const segments = Math.max(6, options.segments ?? 10);
    const taper = options.taper ?? 0.22;
    const arch = options.arch ?? 0.2;
    const wobble = options.wobble ?? 0.08;
    const skew = options.skew ?? 0.06;
    const phase = options.phase ?? 0;
    const shape = new THREE.Shape();
    const lowerPoints = [];
    const upperPoints = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -halfWidth + safeWidth * t;
      const curve = Math.sin(Math.PI * t);
      const edgeFalloff = 1 - Math.pow(Math.abs(t - 0.5) * 2, 1.25) * taper;
      const shimmer = Math.sin((t * Math.PI * 2) + phase) * wobble;
      const tilt = Math.cos((t * Math.PI * 3) + phase * 0.7) * skew;

      lowerPoints.push({
        x: x + tilt * halfWidth * 0.02,
        y: -halfHeight * edgeFalloff - curve * halfHeight * arch + shimmer * halfHeight * 0.18
      });
      upperPoints.push({
        x: x - tilt * halfWidth * 0.02,
        y: halfHeight * edgeFalloff + curve * halfHeight * (arch * 0.84) + shimmer * halfHeight * 0.12
      });
    }

    shape.moveTo(lowerPoints[0].x, lowerPoints[0].y);
    for (let i = 1; i < lowerPoints.length; i++) {
      shape.lineTo(lowerPoints[i].x, lowerPoints[i].y);
    }
    for (let i = upperPoints.length - 1; i >= 0; i--) {
      shape.lineTo(upperPoints[i].x, upperPoints[i].y);
    }
    shape.closePath();

    return new THREE.ShapeGeometry(shape);
  }
  
  /**
   * 3. SPACE DRIFT
   * Localized distortions that warp air
   */
  generateSpaceDrift() {
    if (!this.config.drifts.enabled || !this.isModeActive('drifts')) return;
    
    const count = this.registry.getIllusionsByType('drifts').length;
    if (count >= this.config.drifts.maxActive) return;
    
    // Spawn during node evolution, high link traffic, or dramaturgy events
    const dramDriftChance = this._dramaturgySpawnBoost > 0 ? this._dramaturgySpawnBoost * 1.5 : 0;
    const shouldSpawn = (this.aiNodes && this.aiNodes.nodes?.length > 0) && Math.random() < (0.015 + dramDriftChance);
    if (!shouldSpawn) return;
    
    // Place near random node or player
    let spawnPos;
    if (this.aiNodes?.nodes?.length > 0 && Math.random() > 0.3) {
      const node = this.aiNodes.nodes[Math.floor(Math.random() * this.aiNodes.nodes.length)];
      spawnPos = node.mesh?.position ? this._tempVectorA.copy(node.mesh.position) : this._tempVectorA.set(0, 2, 0);
    } else {
      spawnPos = this.camera.position.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 12
      ));
    }
    
    const veilGroup = new THREE.Group();
    veilGroup.name = 'LensingVeil';
    veilGroup.position.copy(spawnPos);
    
    const veilColor = this.getModeColor(1);
    const veilBase = new THREE.MeshBasicMaterial({
      color: veilColor,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const veilEdge = new THREE.LineBasicMaterial({
      color: this.palette.sacredWhite,
      transparent: true,
      opacity: 0.2,
      linewidth: 1
    });
    
    const planeGeometry = this._getSharedGeometry('spaceDrift.veilPlaneGeo', () => this._createLayeredFieldSheetGeometry(8, 5, {
      segments: 10,
      taper: 0.24,
      arch: 0.28,
      wobble: 0.07,
      skew: 0.05,
      phase: 0.45
    }));
    const edgeGeometry = this._getSharedGeometry('spaceDrift.veilEdgeGeo', () => new THREE.EdgesGeometry(planeGeometry));
    
    const countPlanes = 3;
    for (let i = 0; i < countPlanes; i++) {
      const planeMesh = new THREE.Mesh(planeGeometry, veilBase);
      planeMesh.rotation.x = -Math.PI / 2;
      planeMesh.rotation.z = (i - 1) * 0.08;
      planeMesh.position.set(0, i * 0.15, i * 0.18 - 0.3);
      planeMesh.scale.setScalar(1 + i * 0.3);
      veilGroup.add(planeMesh);

      const edgeMesh = new THREE.LineSegments(edgeGeometry, veilEdge);
      edgeMesh.rotation.x = -Math.PI / 2;
      edgeMesh.rotation.z = (i - 1) * 0.08;
      edgeMesh.position.copy(planeMesh.position);
      edgeMesh.scale.copy(planeMesh.scale);
      veilGroup.add(edgeMesh);
    }
    
    this.root.add(veilGroup);
    
    const lifetime = THREE.MathUtils.randFloat(this.config.drifts.lifetime[0], this.config.drifts.lifetime[1]);
    
    this.registry.registerIllusion('drifts', {
      mesh: veilGroup,
      type: 'drift',
      mythMode: this.mode,
      baseOpacity: veilBase.opacity,
      wobbleAmount: 0.12,
      wobbleSpeed: THREE.MathUtils.randFloat(0.2, 0.8),
      scaleVariation: THREE.MathUtils.randFloat(0.95, 1.05),
      envelope: this.createIllusionEnvelope()
    }, lifetime);
  }
  
  /**
   * 4. QUANTUM AFTER-PATHS
   * Geometric outlines from fast movement
   */
  generateAfterPaths() {
    if (!this.config.afterPaths.enabled || !this.isModeActive('afterPaths')) return;
    
    const count = this.registry.getIllusionsByType('afterPaths').length;
    if (count >= this.config.afterPaths.maxActive) return;
    
    // Spawn from high traffic nodes or player fast movement
    let shouldSpawn = false;
    let spawnPos = new THREE.Vector3();
    let direction = new THREE.Vector3(0, 0, -1);

    if (this.aiNodes?.nodes?.length > 0) {
      for (const node of this.aiNodes.nodes) {
        if (node.mesh && node.velocity && node.velocity.length() > 5) {
          if (Math.random() < (0.05 + this._dramaturgySpawnBoost * 0.8)) {
            spawnPos = this._tempVectorA.copy(node.mesh.position);
            direction = this._tempVectorB.copy(node.velocity).normalize();
            shouldSpawn = true;
            break;
          }
        }
      }
    }
    
    if (!shouldSpawn) return;
    
    const procession = new THREE.Group();
    procession.name = 'AfterPathProcession';
    procession.position.copy(spawnPos);
    procession.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);

    const ribbonGeo = this._getSharedGeometry('afterPaths.ribbonGeo', () => this._createLayeredFieldSheetGeometry(0.18, 3.5, {
      segments: 8,
      taper: 0.38,
      arch: 0.18,
      wobble: 0.04,
      skew: 0.02,
      phase: 1.2
    }));
    const ribbonMat = new THREE.MeshBasicMaterial({
      color: this.getModeColor(1),
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const ghostMat = new THREE.MeshBasicMaterial({
      color: this.getModeColor(0),
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const ribbonCount = 3;
    for (let i = 0; i < ribbonCount; i++) {
      const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbon.position.set((i - 1) * 0.28, 0.1 + i * 0.04, -1.4 + i * 0.2);
      ribbon.rotation.y = 0.12 * (i - 1);
      ribbon.rotation.x = -0.15;
      procession.add(ribbon);

      const ghost = new THREE.Mesh(ribbonGeo, ghostMat);
      ghost.position.copy(ribbon.position);
      ghost.position.z -= 0.4;
      ghost.scale.setScalar(0.95);
      procession.add(ghost);
    }

    const highlightGeo = this._getSharedGeometry('afterPaths.highlightGeo', () => this._createLayeredFieldSheetGeometry(0.05, 3.5, {
      segments: 6,
      taper: 0.44,
      arch: 0.12,
      wobble: 0.02,
      skew: 0.01,
      phase: 0.6
    }));
    const highlightMat = new THREE.MeshBasicMaterial({
      color: this.palette.sacredWhite,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const highlight = new THREE.Mesh(highlightGeo, highlightMat);
    highlight.position.set(0, 0.02, -1.2);
    highlight.rotation.x = -0.15;
    procession.add(highlight);

    this.root.add(procession);
    
    const lifetime = THREE.MathUtils.randFloat(this.config.afterPaths.lifetime[0], this.config.afterPaths.lifetime[1]);
    
    this.registry.registerIllusion('afterPaths', {
      mesh: procession,
      type: 'afterPath',
      mythMode: this.mode,
      baseOpacity: ribbonMat.opacity,
      direction,
      driftSpeed: 1.1,
      rotationSpeed: 1.5,
      envelope: this.createIllusionEnvelope(),
      pieceMeshes: [highlight]
    }, lifetime);
  }
  
  /**
   * 5. FLOATING SYMBOLS
   * AI glyphs that drift slowly
   */
  generateFloatingSymbols() {
    if (!this.config.symbols.enabled || !this.isModeActive('symbols')) return;
    
    const count = this.registry.getIllusionsByType('symbols').length;
    if (count >= this.config.symbols.maxActive) return;
    
    // Spawn near high-energy nodes, during events, or dramaturgy
    const dramSymbolChance = this._dramaturgySpawnBoost > 0 ? this._dramaturgySpawnBoost * 2 : 0;
    const shouldSpawn = (this.lastAwakenTime < 2 || this.synergy > 0.8 || this._dramaturgySpawnBoost > 0.15) && Math.random() < (0.01 + dramSymbolChance);
    if (!shouldSpawn) return;
    
    // Place near a node or a mysterious random position to feel ritualistic
    let spawnPos;
    if (this.aiNodes?.nodes?.length > 0) {
      const node = this.aiNodes.nodes[Math.floor(Math.random() * this.aiNodes.nodes.length)];
      spawnPos = node.mesh?.position?.clone() || new THREE.Vector3(0, 2, 0);
      spawnPos.y += 3;
    } else {
      spawnPos = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        Math.random() * 10 + 3,
        (Math.random() - 0.5) * 20
      );
    }
    
    const choirRoot = new THREE.Group();
    choirRoot.name = 'GlyphChoir';
    const memberCount = 3 + Math.floor(Math.random() * 3);
    const radius = 0.55;

    for (let i = 0; i < memberCount; i++) {
      const glyph = this.createQuantumGlyph();
      const angle = (i / memberCount) * Math.PI * 2;
      glyph.position.set(
        Math.cos(angle) * radius,
        i * 0.18,
        Math.sin(angle) * radius
      );
      glyph.rotation.y = angle + Math.PI * 0.25;
      const scale = 0.16 + Math.random() * 0.08;
      glyph.scale.setScalar(scale);
      choirRoot.add(glyph);
    }

    const haloMesh = new THREE.Mesh(
      this._getSharedGeometry('symbols.choirHaloGeo', () => new THREE.RingGeometry(0.65, 1.05, 32, 1, 0, Math.PI * 1.8)),
      new THREE.MeshBasicMaterial({
        color: this.palette.sacredWhite,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    haloMesh.rotation.x = -Math.PI / 2;
    haloMesh.position.y = 0.42;
    choirRoot.add(haloMesh);

    choirRoot.position.copy(spawnPos);
    choirRoot.scale.setScalar(0.22);
    this.root.add(choirRoot);
    
    const pieceMeshes = [];
    choirRoot.traverse((child) => {
      if (child.material) {
        pieceMeshes.push(child);
      }
    });

    const lifetime = THREE.MathUtils.randFloat(this.config.symbols.lifetime[0], this.config.symbols.lifetime[1]);
    
    this.registry.registerIllusion('symbols', {
      mesh: choirRoot,
      type: 'symbol',
      mythMode: this.mode,
      baseOpacity: 1,
      driftDir: new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() * 0.25 + 0.08,
        Math.random() - 0.5
      ).normalize(),
      driftSpeed: THREE.MathUtils.randFloat(0.25, 0.7),
      rotationSpeed: THREE.MathUtils.randFloat(0.18, 0.8),
      envelope: this.createIllusionEnvelope(),
      pieceMeshes
    }, lifetime);
  }
  
  /**
   * 6. HYPERFOCUS MOMENT
   * Screen-space iris focus effect
   */
  updateHyperfocusMoment() {
    if (!this.config.hyperfocus.enabled || !this.isModeActive('hyperfocus')) return;

    const strongState = this.lastAwakenTime < 1 || this.quantumStormActive || this.synergy > 0.75 || this.highTrafficBurst || this._dramaturgySpawnBoost > 0.2;
    if (!strongState) return;

    const activeFocus = this.registry.getIllusionsByType('focusEffects');
    if (activeFocus.length > 0) return;

    const focusGroup = new THREE.Group();
    focusGroup.name = 'HyperfocusScreenSpace';
    focusGroup.renderOrder = 2500;
    focusGroup.userData.screenSpace = true;

    const veil = new THREE.Mesh(
      this._getSharedGeometry('hyperfocus.screenVeilGeo', () => new THREE.CircleGeometry(1.75, 40)),
      new THREE.MeshBasicMaterial({
        color: this.getModeColor(0),
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false
      })
    );
    veil.name = 'screenVeil';
    focusGroup.add(veil);

    const outerIris = new THREE.LineSegments(
      this._getSharedGeometry('hyperfocus.screenIrisGeo', () => {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const segments = 32;
        const radius = 1.35;
        for (let i = 0; i < segments; i++) {
          const a1 = (i / segments) * Math.PI * 2;
          const a2 = ((i + 1) / segments) * Math.PI * 2;
          positions.push(Math.cos(a1) * radius, Math.sin(a1) * radius, 0);
          positions.push(Math.cos(a2) * radius, Math.sin(a2) * radius, 0);
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        return geometry;
      }),
      new THREE.LineBasicMaterial({
        color: this.palette.sacredWhite,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        linewidth: 1
      })
    );
    outerIris.name = 'screenIris';
    focusGroup.add(outerIris);

    const glyphType = this.quantumStormActive || this.lastAwakenTime < 1 ? 'crown' : 'sigil';
    const screenGlyph = this.createQuantumGlyph(glyphType);
    screenGlyph.name = 'screenGlyph';
    screenGlyph.scale.setScalar(0.42);
    screenGlyph.position.y = 0.02;
    screenGlyph.traverse((child) => {
      if (child.material) {
        child.material.depthTest = false;
        child.material.depthWrite = false;
        child.material.transparent = true;
        child.material.opacity = Math.min(child.material.opacity ?? 0.22, 0.26);
      }
    });
    focusGroup.add(screenGlyph);

    const pulse = new THREE.Mesh(
      this._getSharedGeometry('hyperfocus.screenPulseGeo', () => new THREE.CircleGeometry(0.28, 18)),
      new THREE.MeshBasicMaterial({
        color: this.palette.sacredWhite,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide
      })
    );
    pulse.name = 'screenPulse';
    pulse.rotation.x = -Math.PI / 2;
    pulse.position.y = -0.02;
    focusGroup.add(pulse);

    this.screenSpaceContainer.add(focusGroup);

    this.registry.registerIllusion('focusEffects', {
      mesh: focusGroup,
      type: 'focusEffect',
      mythMode: this.mode,
      baseOpacity: 1,
      vignetteIntensity: this.config.hyperfocus.vignetteIntensity,
      envelope: this.createIllusionEnvelope({
        attack: 0.08,
        crest: 0.22,
        release: 0.25,
        afterglow: 0.2
      }),
      pieceMeshes: [veil, outerIris, screenGlyph, pulse]
    }, this.config.hyperfocus.duration);
  }
  
  updateFocusEffects(deltaTime) {
    const effects = this.registry.getIllusionsByType('focusEffects');
    for (const entry of effects) {
      if (!entry.mesh || !entry.config) continue;
      
      const env = this.calculateEnvelopeProgress(entry.progress, entry.config.envelope || this.createIllusionEnvelope());
      const pulse = 1 + Math.sin((this.scene.userData.globalTime || 0) * 6) * 0.04 * env.value;
      entry.mesh.scale.setScalar(1 + 0.12 * env.value * pulse);
      entry.mesh.rotation.z = 0.18 * env.value * Math.sin((this.scene.userData.globalTime || 0) * 2);

      if (entry.mesh.userData.screenSpace) {
        this._updateScreenSpaceIllusions(entry, env);
      }

      this.applyEnvelopeToMaterial(entry, env.value);
    }
  }

  _updateScreenSpaceIllusions(entry, env) {
    if (!this.camera || !entry.mesh) return;
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    const target = this.camera.position.clone().add(direction.multiplyScalar(2.0));

    entry.mesh.position.copy(target);
    entry.mesh.quaternion.copy(this.camera.quaternion);
    entry.mesh.position.add(this.camera.up.clone().setLength(-0.05));

    const pulse = 1 + Math.sin((this.scene.userData.globalTime || 0) * 1.8) * 0.02;
    entry.mesh.scale.setScalar(0.98 + 0.04 * env.value * pulse);

    for (const child of entry.mesh.children) {
      if (!child.material || child.material.opacity === undefined) continue;
      child.material.opacity = Math.max(0, (entry.config?.baseOpacity ?? 1) * env.value * 0.9);
    }
  }
  
  /**
   * 7. GHOST-WARP MOVEMENT MARKERS
   * Flickering position traces
   */
  generateGhostMarkers() {
    if (!this.config.ghostMarkers.enabled || !this.isModeActive('ghostMarkers')) return;
    
    const count = this.registry.getIllusionsByType('ghostMarkers').length;
    if (count >= this.config.ghostMarkers.maxActive) return;
    
    // Spawn from fast-moving nodes
    let shouldSpawn = false;
    let spawnPos = new THREE.Vector3();
    
    if (this.aiNodes?.nodes?.length > 0) {
      for (const node of this.aiNodes.nodes) {
        if (node.mesh && node.velocity && node.velocity.length() > 8) {
          if (Math.random() < (0.04 + this._dramaturgySpawnBoost * 0.6)) {
            spawnPos = this._tempVectorA.copy(node.mesh.position);
            spawnPos.y += 0.2;
            shouldSpawn = true;
            break;
          }
        }
      }
    }
    
    if (!shouldSpawn) return;
    
    const markerRoot = new THREE.Group();
    markerRoot.name = 'StelaeMarker';
    markerRoot.position.copy(spawnPos);
    
    const pillarHeight = 2.8;
    const pillarGeo = this._getSharedGeometry('ghostMarkers.pillarGeo', () => new THREE.CylinderGeometry(0.08, 0.08, pillarHeight, 10));
    const pillarMat = new THREE.MeshBasicMaterial({
      color: this.getModeColor(0),
      transparent: true,
      opacity: 0.2,
      depthWrite: false
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = pillarHeight * 0.5;
    markerRoot.add(pillar);
    
    const beaconRing = new THREE.Mesh(
      this._getSharedGeometry('ghostMarkers.beaconGeo', () => new THREE.TorusGeometry(0.18, 0.03, 8, 32)),
      new THREE.MeshBasicMaterial({
        color: this.getModeColor(1),
        transparent: true,
        opacity: 0.24,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    beaconRing.rotation.x = Math.PI / 2;
    beaconRing.position.y = pillarHeight * 0.92;
    markerRoot.add(beaconRing);
    
    const glowHalo = new THREE.Mesh(
      this._getSharedGeometry('ghostMarkers.glowHaloGeo', () => new THREE.RingGeometry(0.22, 0.36, 28)),
      new THREE.MeshBasicMaterial({
        color: this.palette.sacredWhite,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    glowHalo.rotation.x = -Math.PI / 2;
    glowHalo.position.y = 0.14;
    markerRoot.add(glowHalo);
    
    this.root.add(markerRoot);
    
    const lifetime = THREE.MathUtils.randFloat(this.config.ghostMarkers.lifetime[0], this.config.ghostMarkers.lifetime[1]);
    
    this.registry.registerIllusion('ghostMarkers', {
      mesh: markerRoot,
      type: 'ghostMarker',
      mythMode: this.mode,
      baseOpacity: pillarMat.opacity,
      noiseAmount: 0.22,
      noiseSpeed: 12,
      envelope: this.createIllusionEnvelope(),
      pieceMeshes: [pillar, beaconRing, glowHalo]
    }, lifetime);
  }
  
  /**
   * 8. WORLD BEND MOMENTS
   * Slight horizon curvature
   */
  generateWorldBends() {
    if (!this.config.worldBends.enabled || !this.isModeActive('worldBends')) return;
    
    const count = this.registry.getIllusionsByType('worldBends').length;
    if (count >= this.config.worldBends.maxActive) return;
    
    const shouldSpawn = (this.quantumStormActive || this.synergy > 0.7 || this.lastAwakenTime < 1.5) && Math.random() < 0.02;
    if (!shouldSpawn) return;
    
    const forward = this._tempVectorB.set(0, 0, -1);
    if (this.camera?.getWorldDirection) {
      this.camera.getWorldDirection(forward);
    }
    const spawnPos = this._tempVectorA.copy(this.camera?.position || this._tempVectorA.set(0, 0, 0));
    spawnPos.addScaledVector(forward, 10);
    spawnPos.y = (this.camera?.position?.y ?? 1.6) - 1.0;
    
    const bendRoot = new THREE.Group();
    bendRoot.name = 'WorldBendAuthority';
    bendRoot.position.copy(spawnPos);
    bendRoot.quaternion.copy(this.camera?.quaternion || new THREE.Quaternion());
    bendRoot.scale.setScalar(0.95);
    
    const arcGeometry = this._getSharedGeometry('worldBends.arcGeo', () => new THREE.TorusGeometry(12, 0.1, 8, 64, Math.PI * 1.7));
    const arcMaterial = new THREE.MeshBasicMaterial({
      color: this.getModeColor(1),
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const arcMesh = new THREE.Mesh(arcGeometry, arcMaterial);
    arcMesh.rotation.x = Math.PI * 0.42;
    arcMesh.position.y = 0.8;
    bendRoot.add(arcMesh);
    
    const sheetGeometry = this._getSharedGeometry('worldBends.sheetGeo', () => this._createLayeredFieldSheetGeometry(18, 9, {
      segments: 12,
      taper: 0.26,
      arch: 0.26,
      wobble: 0.08,
      skew: 0.04,
      phase: 0.25
    }));
    const sheetMaterial = new THREE.MeshBasicMaterial({
      color: this.getModeColor(0),
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const sheetMesh = new THREE.Mesh(sheetGeometry, sheetMaterial);
    sheetMesh.rotation.x = -Math.PI / 2 + 0.08;
    sheetMesh.position.y = 0.1;
    sheetMesh.position.z = -0.6;
    bendRoot.add(sheetMesh);
    
    const ringLineGeometry = this._getSharedGeometry('worldBends.ringLineGeo', () => {
      const ring = new THREE.RingGeometry(10.3, 10.9, 48);
      return new THREE.EdgesGeometry(ring);
    });
    const ringMaterial = new THREE.LineBasicMaterial({
      color: this.palette.sacredWhite,
      transparent: true,
      opacity: 0.14,
      linewidth: 1
    });
    const ringMesh = new THREE.LineSegments(ringLineGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -0.2;
    bendRoot.add(ringMesh);
    
    this.root.add(bendRoot);
    
    const lifetime = THREE.MathUtils.randFloat(this.config.worldBends.lifetime[0], this.config.worldBends.lifetime[1]);
    this.registry.registerIllusion('worldBends', {
      mesh: bendRoot,
      type: 'worldBend',
      mythMode: this.mode,
      baseOpacity: 1,
      arcOpacity: arcMaterial.opacity,
      sheetOpacity: sheetMaterial.opacity,
      ringOpacity: ringMaterial.opacity,
      orbitSpeed: THREE.MathUtils.randFloat(0.002, 0.008),
      envelope: this.createIllusionEnvelope(),
      pieceMeshes: [arcMesh, sheetMesh, ringMesh]
    }, lifetime);
  }
  
  updateWorldBends(deltaTime) {
    const bends = this.registry.getIllusionsByType('worldBends');
    for (const entry of bends) {
      if (!entry.mesh || !entry.config) continue;
      
      const env = this.calculateEnvelopeProgress(entry.progress, entry.config.envelope || this.createIllusionEnvelope());
      entry.mesh.rotation.y += entry.config.orbitSpeed * deltaTime * env.value;
      entry.mesh.position.y += Math.sin((this.scene.userData.globalTime || 0) * 0.2) * 0.005 * env.value;
      
      for (const child of entry.mesh.children) {
        if (!child.material || child.material.opacity === undefined) continue;
        if (child === entry.mesh.children[0]) {
          child.material.opacity = Math.max(0, (entry.config.arcOpacity ?? 0.18) * env.value);
        } else if (child === entry.mesh.children[1]) {
          child.material.opacity = Math.max(0, (entry.config.sheetOpacity ?? 0.12) * env.value);
        } else {
          child.material.opacity = Math.max(0, (entry.config.ringOpacity ?? 0.14) * env.value);
        }
      }
    }
  }
  
  /**
   * 9. SIGMA HALLUCINATION
   * Rare phantom figures made of dots
   */
  generateSigmaHallucination() {
    if (!this.config.sigmaHallucination.enabled || !this.isModeActive('sigmaHallucination')) return;
    
    const count = this.registry.getIllusionsByType('hallucinations').length;
    if (count > 0) return; // Only one at a time
    
    // Very rare spawn
    if (Math.random() > this.config.sigmaHallucination.rarity) return;
    
    const spawnBase = this._tempVectorA.copy(this.camera?.position || this._tempVectorA.set(0, 0, 0));
    const forward = this._tempVectorB.set(0, 0, -1);
    if (this.camera?.getWorldDirection) {
      this.camera.getWorldDirection(forward);
    }
    const spawnPos = spawnBase.addScaledVector(forward, 10);
    spawnPos.y += 1.2;
    
    const apparitionRoot = new THREE.Group();
    apparitionRoot.name = 'SigmaWitnessApparition';
    apparitionRoot.position.copy(spawnPos);
    apparitionRoot.quaternion.copy(this.camera?.quaternion || new THREE.Quaternion());
    
    const constellationGeometry = this._getSharedGeometry('hallucinations.silhouetteGeo', () => {
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const addPoint = (x, y, z) => positions.push(x, y, z);
      const addCircle = (cx, cy, cz, radius, segments) => {
        for (let i = 0; i < segments; i++) {
          const a = (i / segments) * Math.PI * 2;
          addPoint(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, cz);
        }
      };
      addCircle(0, 1.36, 0, 0.22, 10);
      addPoint(0, 1.18, 0);
      addPoint(-0.28, 1.0, 0);
      addPoint(0.28, 1.0, 0);
      addPoint(-0.14, 0.76, 0);
      addPoint(0.14, 0.76, 0);
      addPoint(0, 0.58, 0);
      addPoint(-0.26, 0.38, 0);
      addPoint(0.26, 0.38, 0);
      addPoint(0, 0.14, 0);
      addPoint(-0.18, -0.32, 0);
      addPoint(0.18, -0.32, 0);
      addPoint(-0.12, -0.78, 0);
      addPoint(0.12, -0.78, 0);
      addPoint(0, -1.18, 0);
      return geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3)), geometry;
    });
    
    const pointsMaterial = new THREE.PointsMaterial({
      color: this.getModeColor(1),
      map: this._getSoftPointSpriteTexture(),
      alphaTest: 0.02,
      size: 0.18,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const silhouette = new THREE.Points(constellationGeometry, pointsMaterial);
    silhouette.position.set(0, 0, 0);
    apparitionRoot.add(silhouette);
    
    const lineGeometry = this._getSharedGeometry('hallucinations.silhouetteLineGeo', () => {
      const g = new THREE.BufferGeometry();
      const positions = [
        0, 1.36, 0, 0, 1.18, 0,
        -0.28, 1.0, 0, 0.28, 1.0, 0,
        -0.28, 1.0, 0, -0.14, 0.76, 0,
        0.28, 1.0, 0, 0.14, 0.76, 0,
        -0.14, 0.76, 0, 0, 0.58, 0,
        0, 0.58, 0, 0, 0.14, 0,
        0, 0.14, 0, -0.18, -0.32, 0,
        0, 0.14, 0, 0.18, -0.32, 0,
        -0.18, -0.32, 0, -0.12, -0.78, 0,
        0.18, -0.32, 0, 0.12, -0.78, 0,
        -0.12, -0.78, 0, 0, -1.18, 0,
        0.12, -0.78, 0, 0, -1.18, 0
      ];
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      return g;
    });
    const lineMaterial = new THREE.LineBasicMaterial({
      color: this.palette.sacredWhite,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      linewidth: 1
    });
    const constellationLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    apparitionRoot.add(constellationLines);
    
    const haloRing = new THREE.LineSegments(
      this._getSharedGeometry('hallucinations.silhouetteHaloGeo', () => {
        const g = new THREE.BufferGeometry();
        const positions = [];
        const segments = 24;
        for (let i = 0; i < segments; i++) {
          const a = (i / segments) * Math.PI * 2;
          positions.push(Math.cos(a) * 1.18, Math.sin(a) * 0.04, Math.sin(a) * 0.12);
          positions.push(Math.cos(a) * 1.4, Math.sin(a) * 0.04, Math.sin(a) * 0.12);
        }
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        return g;
      }),
      new THREE.LineBasicMaterial({
        color: this.getModeColor(0),
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        linewidth: 1
      })
    );
    haloRing.rotation.x = -Math.PI / 2;
    haloRing.position.y = -0.45;
    apparitionRoot.add(haloRing);
    
    const starPulse = new THREE.Mesh(
      this._getSharedGeometry('hallucinations.silhouettePulseGeo', () => new THREE.CircleGeometry(0.4, 20)),
      new THREE.MeshBasicMaterial({
        color: this.palette.sacredWhite,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    starPulse.rotation.x = -Math.PI / 2;
    starPulse.position.y = -0.52;
    apparitionRoot.add(starPulse);
    
    this.root.add(apparitionRoot);
    
    this.registry.registerIllusion('hallucinations', {
      mesh: apparitionRoot,
      type: 'phantom',
      mythMode: this.mode,
      baseOpacity: 0.92,
      pulseSpeed: 2.2,
      swayAmount: 0.04,
      envelope: this.createIllusionEnvelope({
        attack: 0.12,
        crest: 0.32,
        release: 0.24,
        afterglow: 0.18
      }),
      pieceMeshes: [silhouette, constellationLines, haloRing, starPulse]
    }, this.config.sigmaHallucination.lifetime);
  }
  
  /**
   * Update all illusions with lifetime and visual effects
   */
  updateAllIllusions(deltaTime) {
    const time = this.scene.userData.globalTime || 0;
    const budgetPressure = Math.min(1, this.registry.totalIllusions / Math.max(this.registry.maxIllusions, 1));

    const layers = {
      echoes: this.getOrchestralLayerWeight('echoes', time) * (1 - budgetPressure * 0.4),
      shards: this.getOrchestralLayerWeight('shards', time) * (1 - budgetPressure * 0.3),
      focus: this.getOrchestralLayerWeight('worldBends', time) * 0.8,
      drifts: this.getOrchestralLayerWeight('drifts', time) * (1 - budgetPressure * 0.2),
      afterPaths: this.getOrchestralLayerWeight('afterPaths', time) * (1 - budgetPressure * 0.5),
      symbols: this.getOrchestralLayerWeight('symbols', time) * (1 - budgetPressure * 0.25),
      ghostMarkers: this.getOrchestralLayerWeight('ghostMarkers', time) * (1 - budgetPressure * 0.45),
      worldBends: this.getOrchestralLayerWeight('worldBends', time) * 0.85,
      hallucinations: this.getOrchestralLayerWeight('hallucinations', time) * (1 - budgetPressure * 0.6)
    };

    if (layers.echoes > 0.22) {
      this.updateEchoes(deltaTime * layers.echoes);
    }
    if (layers.shards > 0.18) {
      this.updateShards(deltaTime * layers.shards);
    }
    if (layers.focus > 0.16) {
      this.updateFocusEffects(deltaTime * layers.focus);
    }
    if (layers.drifts > 0.2) {
      this.updateDrifts(deltaTime * layers.drifts);
    }
    if (layers.afterPaths > 0.14) {
      this.updateAfterPaths(deltaTime * layers.afterPaths);
    }
    if (layers.symbols > 0.2) {
      this.updateSymbols(deltaTime * layers.symbols);
    }
    if (layers.ghostMarkers > 0.18) {
      this.updateGhostMarkers(deltaTime * layers.ghostMarkers);
    }
    if (layers.worldBends > 0.16) {
      this.updateWorldBends(deltaTime * layers.worldBends);
    }
    if (layers.hallucinations > 0.06) {
      this.updateHallucinations(deltaTime * layers.hallucinations);
    }
  }
  
  /**
   * Update echo doubles
   */
  updateEchoes(deltaTime) {
    const echoes = this.registry.getIllusionsByType('echoes');
    for (const entry of echoes) {
      if (!entry.mesh || !entry.config) continue;
      
      const env = this.calculateEnvelopeProgress(entry.progress, entry.config.envelope || this.createIllusionEnvelope());
      
      // Gentle drift with vertical vibration
      if (entry.config.driftDir) {
        entry.mesh.position.addScaledVector(entry.config.driftDir, entry.config.driftSpeed * deltaTime * env.value);
      }
      const vibration = Math.sin((this.scene.userData.globalTime || 0) * entry.config.vibrationSpeed) * entry.config.vibrationAmplitude;
      entry.mesh.position.y += vibration * deltaTime;
      
      // Emergence pulse and fade
      const pulse = 0.8 + 0.25 * env.value + Math.sin((this.scene.userData.globalTime || 0) * entry.config.emergenceSpeed) * 0.04 * env.value;
      entry.mesh.scale.setScalar(pulse);
      this.applyEnvelopeToMaterial(entry, env.value);
    }
  }
  
  /**
   * Update reality shards
   */
  updateShards(deltaTime) {
    const shards = this.registry.getIllusionsByType('shards');
    for (const entry of shards) {
      if (!entry.mesh || !entry.config) continue;
      
      const env = this.calculateEnvelopeProgress(entry.progress, entry.config.envelope || this.createIllusionEnvelope());
      
      // Rotation
      entry.mesh.rotateOnWorldAxis(entry.config.rotationAxis, entry.config.rotationSpeed * deltaTime);
      
      // Shimmer by envelope-driven scale pulse
      const shimmer = 1 + Math.sin(this.scene.userData.globalTime * 5) * 0.1 * env.value;
      entry.mesh.scale.setScalar(1 + 0.15 * env.value * shimmer);
      
      // Envelope opacity
      if (entry.mesh.material && entry.mesh.material.opacity !== undefined) {
        entry.mesh.material.opacity = Math.max(0, (entry.config?.baseOpacity ?? 1) * env.value);
      }
    }
  }
  
  /**
   * Update space drifts
   */
  updateDrifts(deltaTime) {
    const drifts = this.registry.getIllusionsByType('drifts');
    for (const entry of drifts) {
      if (!entry.mesh || !entry.config) continue;
      
      const env = this.calculateEnvelopeProgress(entry.progress, entry.config.envelope || this.createIllusionEnvelope());
      
      // Wobble
      const wobble = Math.sin(this.scene.userData.globalTime * entry.config.wobbleSpeed) * entry.config.wobbleAmount;
      entry.mesh.rotation.z += wobble * deltaTime * env.value;
      
      // Envelope scale
      entry.mesh.scale.setScalar(1 + 0.25 * env.value);
      
      // Envelope opacity
      if (entry.mesh.material && entry.mesh.material.opacity !== undefined) {
        entry.mesh.material.opacity = Math.max(0, (entry.config?.baseOpacity ?? 1) * env.value);
      }
    }
  }
  
  /**
   * Update after-paths
   */
  updateAfterPaths(deltaTime) {
    const paths = this.registry.getIllusionsByType('afterPaths');
    for (const entry of paths) {
      if (!entry.mesh || !entry.config) continue;
      
      const env = this.calculateEnvelopeProgress(entry.progress, entry.config.envelope || this.createIllusionEnvelope());
      
      // Procession moves along its direction with a slow drift
      if (entry.config.direction) {
        entry.mesh.position.addScaledVector(entry.config.direction, entry.config.driftSpeed * deltaTime * env.value);
      }
      
      // Gentle rotation for a majestic sweep
      entry.mesh.rotation.y += entry.config.rotationSpeed * 0.1 * deltaTime * env.value;
      
      // Scale pulse and ghosting intensity
      entry.mesh.scale.setScalar(1 + 0.08 * env.value);
      for (const child of entry.mesh.children) {
        if (child.material && child.material.opacity !== undefined) {
          child.material.opacity = Math.max(0, (entry.config?.baseOpacity ?? 1) * env.value * (child === entry.mesh.children[0] ? 1 : 0.45));
        }
      }
    }
  }
  
  /**
   * Update floating symbols
   */
  updateSymbols(deltaTime) {
    const symbols = this.registry.getIllusionsByType('symbols');
    for (const entry of symbols) {
      if (!entry.mesh || !entry.config) continue;
      
      const env = this.calculateEnvelopeProgress(entry.progress, entry.config.envelope || this.createIllusionEnvelope());
      
      // Drift upward with envelope-driven momentum
      entry.mesh.position.addScaledVector(entry.config.driftDir, entry.config.driftSpeed * deltaTime * env.value);
      
      // Rotate gently based on envelope
      entry.mesh.rotateX(entry.config.rotationSpeed * deltaTime * env.value);
      entry.mesh.rotateY(entry.config.rotationSpeed * deltaTime * env.value);
      entry.mesh.scale.setScalar(0.3 + 0.15 * env.value);
      
      this.applyEnvelopeToMaterial(entry, env.value);
    }
  }
  
  /**
   * Update ghost markers
   */
  updateGhostMarkers(deltaTime) {
    const markers = this.registry.getIllusionsByType('ghostMarkers');
    const time = this.scene.userData.globalTime || 0;
    for (const entry of markers) {
      if (!entry.mesh || !entry.config) continue;
      
      const env = this.calculateEnvelopeProgress(entry.progress, entry.config.envelope || this.createIllusionEnvelope());
      const pulse = Math.sin(time * entry.config.noiseSpeed) * 0.08 * env.value;
      entry.mesh.scale.y = 1 + 0.28 * env.value + pulse;
      entry.mesh.rotation.z = 0.08 * env.value * Math.sin(time * 0.9);
      
      this.applyEnvelopeToMaterial(entry, env.value);
    }
  }
  
  /**
   * Update sigma hallucinations
   */
  updateHallucinations(deltaTime) {
    const hallucinations = this.registry.getIllusionsByType('hallucinations');
    for (const entry of hallucinations) {
      if (!entry.mesh || !entry.config) continue;
      
      const env = this.calculateEnvelopeProgress(entry.progress, entry.config.envelope || this.createIllusionEnvelope());
      
      const pulse = 1 + Math.sin((this.scene.userData.globalTime || 0) * entry.config.pulseSpeed) * 0.08 * env.value;
      entry.mesh.scale.setScalar(0.85 + 0.18 * env.value * pulse);
      entry.mesh.position.y += Math.sin((this.scene.userData.globalTime || 0) * 0.12) * entry.config.swayAmount * env.value * deltaTime;
      entry.mesh.rotation.y += 0.009 * env.value;
      
      const visiblePhase = (this.scene.userData.globalTime || 0) * 0.5;
      entry.mesh.visible = Math.sin(visiblePhase) > -0.6 * env.value;
      
      for (const child of entry.mesh.children) {
        if (!child.material || child.material.opacity === undefined) continue;
        child.material.opacity = Math.max(0, (entry.config?.baseOpacity ?? 1) * env.value * (child === entry.mesh.children[0] ? 1 : 0.7));
      }
    }
  }
  
  /**
   * Create quantum glyph geometry
   */
  createQuantumGlyph(variant = null) {
    const variants = ['seal', 'crown', 'sigil'];
    const glyphType = variants.includes(variant) ? variant : variants[Math.floor(Math.random() * variants.length)];

    const lineMaterial = (color, opacity = 0.24) => new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      linewidth: 1
    });

    if (glyphType === 'seal') {
      const seal = new THREE.Group();
      seal.name = 'QuantumGlyphSeal';

      const outerRing = new THREE.LineSegments(
        this._getSharedGeometry('glyphs.sealOuterGeo', () => {
          const geo = new THREE.BufferGeometry();
          const positions = [];
          const segments = 28;
          const radius = 0.78;
          for (let i = 0; i < segments; i++) {
            const a1 = (i / segments) * Math.PI * 2;
            const a2 = ((i + 1) / segments) * Math.PI * 2;
            positions.push(Math.cos(a1) * radius, Math.sin(a1) * radius, 0);
            positions.push(Math.cos(a2) * radius, Math.sin(a2) * radius, 0);
          }
          geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
          return geo;
        }),
        lineMaterial(this.getModeColor(1), 0.28)
      );
      seal.add(outerRing);

      const innerRing = new THREE.LineSegments(
        this._getSharedGeometry('glyphs.sealInnerGeo', () => {
          const geo = new THREE.BufferGeometry();
          const positions = [];
          const segments = 18;
          const radius = 0.52;
          for (let i = 0; i < segments; i++) {
            const a1 = (i / segments) * Math.PI * 2;
            const a2 = ((i + 1) / segments) * Math.PI * 2;
            positions.push(Math.cos(a1) * radius, Math.sin(a1) * radius, 0);
            positions.push(Math.cos(a2) * radius, Math.sin(a2) * radius, 0);
          }
          geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
          return geo;
        }),
        lineMaterial(this.getModeColor(0), 0.2)
      );
      seal.add(innerRing);

      const cross = new THREE.LineSegments(
        this._getSharedGeometry('glyphs.sealCrossGeo', () => {
          const geo = new THREE.BufferGeometry();
          const positions = [
            -0.24, 0, 0, 0.24, 0, 0,
            0, -0.24, 0, 0, 0.24, 0,
            -0.18, 0.18, 0, 0.18, -0.18, 0
          ];
          geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
          return geo;
        }),
        lineMaterial(this.palette.sacredWhite, 0.3)
      );
      seal.add(cross);
      return seal;
    }

    if (glyphType === 'crown') {
      const crown = new THREE.Group();
      crown.name = 'QuantumGlyphCrown';

      const baseArc = new THREE.LineSegments(
        this._getSharedGeometry('glyphs.crownBaseGeo', () => {
          const geo = new THREE.BufferGeometry();
          const positions = [];
          const segments = 20;
          const radius = 0.55;
          for (let i = 0; i < segments; i++) {
            const a1 = Math.PI * 0.1 + (i / segments) * Math.PI * 1.8;
            const a2 = Math.PI * 0.1 + ((i + 1) / segments) * Math.PI * 1.8;
            positions.push(Math.cos(a1) * radius, Math.sin(a1) * radius, 0);
            positions.push(Math.cos(a2) * radius, Math.sin(a2) * radius, 0);
          }
          geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
          return geo;
        }),
        lineMaterial(this.getModeColor(1), 0.28)
      );
      baseArc.position.y = -0.04;
      crown.add(baseArc);

      const spikes = this._getSharedGeometry('glyphs.crownSpikesGeo', () => {
        const geo = new THREE.BufferGeometry();
        const positions = [];
        const count = 5;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const x = Math.cos(angle) * 0.4;
          const z = Math.sin(angle) * 0.4;
          positions.push(x, 0.05, z, x * 0.85, 0.7, z * 0.85);
        }
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        return geo;
      });
      const spikeLines = new THREE.LineSegments(spikes, lineMaterial(this.palette.sacredWhite, 0.24));
      crown.add(spikeLines);

      const halo = new THREE.LineSegments(
        this._getSharedGeometry('glyphs.crownHaloGeo', () => {
          const geo = new THREE.BufferGeometry();
          const positions = [];
          const segments = 16;
          const inner = 0.98;
          const outer = 1.18;
          for (let i = 0; i < segments; i++) {
            const a1 = (i / segments) * Math.PI * 2;
            const a2 = ((i + 1) / segments) * Math.PI * 2;
            positions.push(Math.cos(a1) * inner, 0.82, Math.sin(a1) * inner);
            positions.push(Math.cos(a2) * outer, 0.82, Math.sin(a2) * outer);
          }
          geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
          return geo;
        }),
        lineMaterial(this.getModeColor(0), 0.22)
      );
      crown.add(halo);
      return crown;
    }

    const sigil = new THREE.Group();
    sigil.name = 'QuantumGlyphSigil';

    const frame = new THREE.LineSegments(
      this._getSharedGeometry('glyphs.sigilFrameGeo', () => {
        const geo = new THREE.BufferGeometry();
        const positions = [
          -0.45, -0.65, 0, 0.45, -0.65, 0,
          0.45, -0.65, 0, 0.45, 0.65, 0,
          0.45, 0.65, 0, -0.45, 0.65, 0,
          -0.45, 0.65, 0, -0.45, -0.65, 0
        ];
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        return geo;
      }),
      lineMaterial(this.getModeColor(1), 0.26)
    );
    sigil.add(frame);

    const core = new THREE.LineSegments(
      this._getSharedGeometry('glyphs.sigilCoreGeo', () => {
        const geo = new THREE.BufferGeometry();
        const positions = [
          0, -0.45, 0, 0, 0.45, 0,
          -0.2, -0.18, 0, 0.2, 0.18, 0,
          -0.2, 0.18, 0, 0.2, -0.18, 0
        ];
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        return geo;
      }),
      lineMaterial(this.getModeColor(0), 0.22)
    );
    sigil.add(core);

    const accents = new THREE.LineSegments(
      this._getSharedGeometry('glyphs.sigilAccentsGeo', () => {
        const geo = new THREE.BufferGeometry();
        const positions = [];
        positions.push(-0.25, 0.48, 0, -0.14, 0.68, 0);
        positions.push(0.25, 0.48, 0, 0.14, 0.68, 0);
        positions.push(-0.25, -0.48, 0, -0.14, -0.68, 0);
        positions.push(0.25, -0.48, 0, 0.14, -0.68, 0);
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        return geo;
      }),
      lineMaterial(this.palette.sacredWhite, 0.18)
    );
    sigil.add(accents);
    return sigil;
  }

  _clearIllusionType(type) {
    const entries = this.registry.getIllusionsByType(type);
    for (let i = entries.length - 1; i >= 0; i--) {
      this.registry.unregisterIllusion(type, i);
    }
  }
  
  /**
   * Get illusion statistics
   */
  getStats() {
    return this.registry.getStats();
  }

  getStatus() {
    const stats = this.registry.getStats();
    return {
      runtimeEnabled: this.runtimeEnabled,
      mode: this.mode,
      afterPaths: {
        enabled: !!this.config.afterPaths?.enabled,
        active: stats.byType?.afterPaths ?? 0
      },
      stats
    };
  }
  
  /**
   * Set global time for animations
   */
  setGlobalTime(time) {
    if (!this.scene.userData) this.scene.userData = {};
    this.scene.userData.globalTime = time;
  }
  
  /**
   * Disable all illusions
   */
  disableAll() {
    this.registry.disableAll();
  }
  
  /**
   * Enable all illusions
   */
  enableAll() {
    this.registry.enableAll();
  }
  
  /**
   * Clear all illusions
   */
  clearAll() {
    this.registry.clearAll();

    if (this.screenSpaceContainer) {
      const children = this.screenSpaceContainer.children.slice();
      for (const child of children) {
        this._disposeObject3D(child);
        this.screenSpaceContainer.remove(child);
      }
    }
  }
  
  /**
   * Dispose resources
   */
  dispose() {
    this.clearAll();

    if (this.screenSpaceContainer) {
      if (this.screenSpaceContainer.parent) {
        this.screenSpaceContainer.parent.remove(this.screenSpaceContainer);
      }
      this._disposeObject3D(this.screenSpaceContainer);
      this.screenSpaceContainer = null;
    }

    if (this.root) {
      if (this.root.parent) {
        this.root.parent.remove(this.root);
      }
      this._disposeObject3D(this.root);
      this.root = null;
    }

    this._disposeCachedGeometries();

    this.registry = null;
    this.localGeometryCache = null;
  }
}
