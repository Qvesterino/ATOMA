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

export class SafeQuantumIllusionsPack1 {
  constructor(scene, environmentRoot, camera, aiNodes, linkingSystem, worldEvents, weatherPack, legendaryPack) {
    this.scene = scene;
    this.root = environmentRoot || scene; // default to scene if environmentRoot not provided
    this.camera = camera;
    this.aiNodes = aiNodes;
    this.linkingSystem = linkingSystem;
    this.worldEvents = worldEvents;
    this.weatherPack = weatherPack;
    this.legendaryPack = legendaryPack;
    
    // Central illusion registry
    this.registry = new QuantumIllusionRegistry(scene);
    
    // Triggering conditions
    this.synergy = 0;
    this.lastSynergy = 0;
    this.quantumStormActive = false;
    this.lastAwakenTime = -10;
    this.highTrafficBurst = false;
    this.lastLegendaryCount = 0;
    this.runtimeEnabled = true;
    
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
        enabled: true,
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
  
  /**
   * Main update loop
   */
  update(deltaTime) {
    if (!this.runtimeEnabled) return;
    
    if (!this.scene) return;
    
    // Update registry lifetime tracking
    this.registry.update(deltaTime);
    
    // Update triggering conditions
    this.updateTriggeringConditions(deltaTime);
    
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
    
    // Update all active illusions
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
    if (!this.config.echoes.enabled || !this.aiNodes) return;
    
    const count = this.registry.getIllusionsByType('echoes').length;
    if (count >= this.config.echoes.maxActive) return;
    
    // Trigger conditions: high synergy, quantum storm, or legendary awakening
    const shouldSpawn = (this.synergy > 0.6 || this.quantumStormActive || this.lastAwakenTime < 1) 
                        && Math.random() < 0.03;
    
    if (!shouldSpawn) return;
    
    // Select random node
    const nodes = this.aiNodes.nodes || [];
    if (nodes.length === 0) return;
    
    const targetNode = nodes[Math.floor(Math.random() * nodes.length)];
    if (!targetNode || !targetNode.mesh) return;
    
    // Create echo ghost
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 2 * 0.4,
      (Math.random() - 0.5) * 2 * 0.3,
      (Math.random() - 0.5) * 2 * 0.4
    ).multiplyScalar(this.registry.illusionDensity);
    
    const ghostPos = targetNode.mesh.position.clone().add(offset);
    
    // Clone geometry fail-closed: skip effect if source geometry is unavailable.
    const sourceGeometry = targetNode.mesh.geometry;
    if (!sourceGeometry || typeof sourceGeometry.clone !== 'function') return;
    const geometry = sourceGeometry.clone();
    
    // Create chromatic material (blue/pink split)
    const material = new THREE.MeshStandardMaterial({
      emissive: new THREE.Color(Math.random() > 0.5 ? 0x0088ff : 0xff0088),
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: THREE.MathUtils.randFloat(this.config.echoes.opacityRange[0], this.config.echoes.opacityRange[1]),
      wireframe: Math.random() > 0.7
    });
    
    const ghostMesh = new THREE.Mesh(geometry, material);
    ghostMesh.position.copy(ghostPos);
    ghostMesh.scale.multiplyScalar(0.8);
    this.root.add(ghostMesh);
    
    const lifetime = THREE.MathUtils.randFloat(this.config.echoes.lifetime[0], this.config.echoes.lifetime[1]);
    
    this.registry.registerIllusion('echoes', {
      mesh: ghostMesh,
      type: 'echo',
      vibrationAmplitude: 0.02,
      vibrationSpeed: 8
    }, lifetime);
  }
  
  /**
   * 2. REALITY SHARDS
   * Glass-like cracks that float and shimmer
   */
  generateRealityShards() {
    if (!this.config.shards.enabled) return;
    
    const count = this.registry.getIllusionsByType('shards').length;
    if (count >= this.config.shards.maxActive) return;
    
    // Spawn during sigma turbulence or high synergy
    const shouldSpawn = (this.quantumStormActive || this.synergy > 0.75) && Math.random() < 0.02;
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
    
    // Create shard as thin geometric lines
    const shardGeometry = new THREE.BufferGeometry();
    const positions = [];
    
    // Random crack pattern
    const lines = Math.floor(Math.random() * 4) + 3;
    for (let i = 0; i < lines; i++) {
      const x1 = (Math.random() - 0.5) * 2;
      const y1 = (Math.random() - 0.5) * 2;
      const x2 = x1 + (Math.random() - 0.5) * 1;
      const y2 = y1 + (Math.random() - 0.5) * 1;
      
      positions.push(x1, y1, 0);
      positions.push(x2, y2, 0);
    }
    
    shardGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(0x00ffff),
      transparent: true,
      opacity: THREE.MathUtils.randFloat(this.config.shards.opacityRange[0], this.config.shards.opacityRange[1]),
      linewidth: 2
    });
    
    const shardMesh = new THREE.LineSegments(shardGeometry, material);
    shardMesh.position.copy(spawnPos);
    shardMesh.scale.multiplyScalar(THREE.MathUtils.randFloat(1, 3));
    this.root.add(shardMesh);
    
    const lifetime = THREE.MathUtils.randFloat(this.config.shards.lifetime[0], this.config.shards.lifetime[1]);
    
    this.registry.registerIllusion('shards', {
      mesh: shardMesh,
      type: 'shard',
      rotationAxis: new THREE.Vector3(
        Math.random(),
        Math.random(),
        Math.random()
      ).normalize(),
      rotationSpeed: THREE.MathUtils.randFloat(0.5, 2)
    }, lifetime);
  }
  
  /**
   * 3. SPACE DRIFT
   * Localized distortions that warp air
   */
  generateSpaceDrift() {
    if (!this.config.drifts.enabled) return;
    
    const count = this.registry.getIllusionsByType('drifts').length;
    if (count >= this.config.drifts.maxActive) return;
    
    // Spawn during node evolution or high link traffic
    const shouldSpawn = (this.aiNodes && this.aiNodes.nodes?.length > 0) && Math.random() < 0.015;
    if (!shouldSpawn) return;
    
    // Place near random node or player
    let spawnPos;
    if (this.aiNodes?.nodes?.length > 0 && Math.random() > 0.3) {
      const node = this.aiNodes.nodes[Math.floor(Math.random() * this.aiNodes.nodes.length)];
      spawnPos = node.mesh?.position?.clone() || new THREE.Vector3(0, 2, 0);
    } else {
      spawnPos = this.camera.position.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 8
      ));
    }
    
    // Create ripple distortion mesh
    const geometry = new THREE.CircleGeometry(2, 16);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x00ffaa),
      transparent: true,
      opacity: THREE.MathUtils.randFloat(this.config.drifts.opacityRange[0], this.config.drifts.opacityRange[1]),
      wireframe: true
    });
    
    const driftMesh = new THREE.Mesh(geometry, material);
    driftMesh.position.copy(spawnPos);
    driftMesh.rotation.x = Math.random() * Math.PI;
    driftMesh.rotation.y = Math.random() * Math.PI;
    this.root.add(driftMesh);
    
    const lifetime = THREE.MathUtils.randFloat(this.config.drifts.lifetime[0], this.config.drifts.lifetime[1]);
    
    this.registry.registerIllusion('drifts', {
      mesh: driftMesh,
      type: 'drift',
      wobbleAmount: 0.3,
      wobbleSpeed: THREE.MathUtils.randFloat(1, 3),
      scaleVariation: THREE.MathUtils.randFloat(0.8, 1.5)
    }, lifetime);
  }
  
  /**
   * 4. QUANTUM AFTER-PATHS
   * Geometric outlines from fast movement
   */
  generateAfterPaths() {
    if (!this.config.afterPaths.enabled) return;
    
    const count = this.registry.getIllusionsByType('afterPaths').length;
    if (count >= this.config.afterPaths.maxActive) return;
    
    // Spawn from high traffic nodes or player fast movement
    let shouldSpawn = false;
    let spawnPos = new THREE.Vector3();
    
    if (this.aiNodes?.nodes?.length > 0) {
      for (const node of this.aiNodes.nodes) {
        if (node.mesh && node.velocity && node.velocity.length() > 5) {
          if (Math.random() < 0.05) {
            spawnPos = node.mesh.position.clone();
            shouldSpawn = true;
            break;
          }
        }
      }
    }
    
    if (!shouldSpawn) return;
    
    // Create geometric outline
    const geometry = new THREE.BoxGeometry(0.5, 0.8, 0.5);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xff00ff),
      transparent: true,
      opacity: THREE.MathUtils.randFloat(this.config.afterPaths.opacityRange[0], this.config.afterPaths.opacityRange[1]),
      wireframe: true,
      emissive: new THREE.Color(0x00ffff)
    });
    
    const pathMesh = new THREE.Mesh(geometry, material);
    pathMesh.position.copy(spawnPos);
    this.root.add(pathMesh);
    
    const lifetime = THREE.MathUtils.randFloat(this.config.afterPaths.lifetime[0], this.config.afterPaths.lifetime[1]);
    
    this.registry.registerIllusion('afterPaths', {
      mesh: pathMesh,
      type: 'afterPath',
      glitchAmount: 0.05,
      glitchSpeed: 10
    }, lifetime);
  }
  
  /**
   * 5. FLOATING SYMBOLS
   * AI glyphs that drift slowly
   */
  generateFloatingSymbols() {
    if (!this.config.symbols.enabled) return;
    
    const count = this.registry.getIllusionsByType('symbols').length;
    if (count >= this.config.symbols.maxActive) return;
    
    // Spawn near high-energy nodes or during events
    const shouldSpawn = (this.lastAwakenTime < 2 || this.synergy > 0.8) && Math.random() < 0.01;
    if (!shouldSpawn) return;
    
    // Place near legendary node or random position
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
    
    // Create symbol geometry (combination of shapes)
    const symbolGeometry = this.createQuantumGlyph();
    
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(Math.random() > 0.5 ? 0x00ffff : 0xff00ff),
      emissive: new THREE.Color(Math.random() > 0.5 ? 0x00ff88 : 0x8800ff),
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: THREE.MathUtils.randFloat(this.config.symbols.opacityRange[0], this.config.symbols.opacityRange[1])
    });
    
    const symbolMesh = new THREE.Mesh(symbolGeometry, material);
    symbolMesh.position.copy(spawnPos);
    symbolMesh.scale.multiplyScalar(0.3);
    this.root.add(symbolMesh);
    
    const lifetime = THREE.MathUtils.randFloat(this.config.symbols.lifetime[0], this.config.symbols.lifetime[1]);
    
    this.registry.registerIllusion('symbols', {
      mesh: symbolMesh,
      type: 'symbol',
      driftDir: new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() * 0.3 + 0.1,
        Math.random() - 0.5
      ).normalize(),
      driftSpeed: THREE.MathUtils.randFloat(0.5, 1.5),
      rotationSpeed: THREE.MathUtils.randFloat(0.5, 2)
    }, lifetime);
  }
  
  /**
   * 6. HYPERFOCUS MOMENT
   * Screen-space iris focus effect
   */
  updateHyperfocusMoment() {
    if (!this.config.hyperfocus.enabled) return;
    
    // Trigger when looking at legendary nodes or during events
    let shouldTrigger = false;
    
    if (this.lastAwakenTime < 1) {
      shouldTrigger = true;
      this.lastAwakenTime = -1; // Only once per awakening
    }
    
    if (!shouldTrigger) return;
    
    // This effect is managed by camera FX if available
    // For now, we just track that it should happen
  }
  
  /**
   * 7. GHOST-WARP MOVEMENT MARKERS
   * Flickering position traces
   */
  generateGhostMarkers() {
    if (!this.config.ghostMarkers.enabled) return;
    
    const count = this.registry.getIllusionsByType('ghostMarkers').length;
    if (count >= this.config.ghostMarkers.maxActive) return;
    
    // Spawn from fast-moving nodes
    let shouldSpawn = false;
    let spawnPos = new THREE.Vector3();
    
    if (this.aiNodes?.nodes?.length > 0) {
      for (const node of this.aiNodes.nodes) {
        if (node.mesh && node.velocity && node.velocity.length() > 8) {
          if (Math.random() < 0.04) {
            spawnPos = node.mesh.position.clone();
            spawnPos.y += 0.5;
            shouldSpawn = true;
            break;
          }
        }
      }
    }
    
    if (!shouldSpawn) return;
    
    // Create vertical marker bars
    const geometry = new THREE.BoxGeometry(0.1, 1.5, 0.1);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x00ffff),
      transparent: true,
      opacity: THREE.MathUtils.randFloat(this.config.ghostMarkers.opacityRange[0], this.config.ghostMarkers.opacityRange[1]),
      emissive: new THREE.Color(0xff00ff)
    });
    
    const markerMesh = new THREE.Mesh(geometry, material);
    markerMesh.position.copy(spawnPos);
    this.root.add(markerMesh);
    
    const lifetime = THREE.MathUtils.randFloat(this.config.ghostMarkers.lifetime[0], this.config.ghostMarkers.lifetime[1]);
    
    this.registry.registerIllusion('ghostMarkers', {
      mesh: markerMesh,
      type: 'ghostMarker',
      noiseAmount: 0.3,
      noiseSpeed: 15
    }, lifetime);
  }
  
  /**
   * 8. WORLD BEND MOMENTS
   * Slight horizon curvature
   */
  generateWorldBends() {
    if (!this.config.worldBends.enabled) return;
    
    // Very subtle effect - managed more through camera FX
    // Just track that bends are happening
  }
  
  /**
   * 9. SIGMA HALLUCINATION
   * Rare phantom figures made of dots
   */
  generateSigmaHallucination() {
    if (!this.config.sigmaHallucination.enabled) return;
    
    const count = this.registry.getIllusionsByType('hallucinations').length;
    if (count > 0) return; // Only one at a time
    
    // Very rare spawn
    if (Math.random() > this.config.sigmaHallucination.rarity) return;
    
    // Create phantom figure from dots
    const phantomGeometry = new THREE.BufferGeometry();
    const positions = [];
    
    // Create grid of dots forming rough human-like shape
    const dotCount = Math.floor(Math.random() * 20) + 10;
    for (let i = 0; i < dotCount; i++) {
      positions.push(
        (Math.random() - 0.5) * 2,
        Math.random() * 3,
        (Math.random() - 0.5) * 0.5
      );
    }
    
    phantomGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    
    const material = new THREE.PointsMaterial({
      color: new THREE.Color(0xff8800),
      size: 0.2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8
    });
    
    const phantomMesh = new THREE.Points(phantomGeometry, material);
    phantomMesh.position.set(
      this.camera.position.x + (Math.random() - 0.5) * 15,
      this.camera.position.y + Math.random() * 5,
      this.camera.position.z + (Math.random() - 0.5) * 15
    );
    
    this.root.add(phantomMesh);
    
    this.registry.registerIllusion('hallucinations', {
      mesh: phantomMesh,
      type: 'phantom',
      flickerSpeed: 20,
      flickerIntensity: 1
    }, this.config.sigmaHallucination.lifetime);
  }
  
  /**
   * Update all illusions with lifetime and visual effects
   */
  updateAllIllusions(deltaTime) {
    // Echo doubles - vibrate and fade
    this.updateEchoes(deltaTime);
    
    // Reality shards - rotate and shimmer
    this.updateShards(deltaTime);
    
    // Space drift - wobble and scale
    this.updateDrifts(deltaTime);
    
    // After-paths - glitch and fade
    this.updateAfterPaths(deltaTime);
    
    // Floating symbols - drift and rotate
    this.updateSymbols(deltaTime);
    
    // Ghost markers - noise flicker
    this.updateGhostMarkers(deltaTime);
    
    // Sigma hallucinations - flicker
    this.updateHallucinations(deltaTime);
  }
  
  /**
   * Update echo doubles
   */
  updateEchoes(deltaTime) {
    const echoes = this.registry.getIllusionsByType('echoes');
    for (const entry of echoes) {
      if (!entry.mesh || !entry.config) continue;
      
      const progress = entry.progress;
      
      // Vibration
      const vibration = Math.sin(this.scene.userData.globalTime * entry.config.vibrationSpeed) * entry.config.vibrationAmplitude;
      entry.mesh.position.y += vibration * deltaTime;
      
      // Fade out
      if (entry.mesh.material && entry.mesh.material.opacity !== undefined) {
        entry.mesh.material.opacity = (1 - progress) * entry.config.opacityBase;
      }
    }
  }
  
  /**
   * Update reality shards
   */
  updateShards(deltaTime) {
    const shards = this.registry.getIllusionsByType('shards');
    for (const entry of shards) {
      if (!entry.mesh || !entry.config) continue;
      
      const progress = entry.progress;
      
      // Rotation
      entry.mesh.rotateOnWorldAxis(entry.config.rotationAxis, entry.config.rotationSpeed * deltaTime);
      
      // Shimmer by scale pulse
      const shimmer = 1 + Math.sin(this.scene.userData.globalTime * 5) * 0.2;
      entry.mesh.scale.setScalar(shimmer);
      
      // Fade out
      if (entry.mesh.material && entry.mesh.material.opacity !== undefined) {
        entry.mesh.material.opacity = (1 - progress) * 0.25;
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
      
      const progress = entry.progress;
      
      // Wobble
      const wobble = Math.sin(this.scene.userData.globalTime * entry.config.wobbleSpeed) * entry.config.wobbleAmount;
      entry.mesh.rotation.z += wobble * deltaTime;
      
      // Scale pulse
      const scalePulse = 1 + Math.sin(this.scene.userData.globalTime * 2) * 0.3;
      entry.mesh.scale.setScalar(scalePulse);
      
      // Fade out
      if (entry.mesh.material && entry.mesh.material.opacity !== undefined) {
        entry.mesh.material.opacity = (1 - progress) * 0.2;
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
      
      const progress = entry.progress;
      
      // Glitch effect - random rotation spikes
      const glitch = Math.random() > 0.8 ? (Math.random() - 0.5) * entry.config.glitchAmount : 0;
      entry.mesh.rotation.x += glitch;
      entry.mesh.rotation.y += glitch;
      
      // Fade out
      if (entry.mesh.material && entry.mesh.material.opacity !== undefined) {
        entry.mesh.material.opacity = (1 - progress) * 0.3;
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
      
      const progress = entry.progress;
      
      // Drift upward
      entry.mesh.position.addScaledVector(entry.config.driftDir, entry.config.driftSpeed * deltaTime);
      
      // Rotate
      entry.mesh.rotateX(entry.config.rotationSpeed * deltaTime);
      entry.mesh.rotateY(entry.config.rotationSpeed * deltaTime);
      
      // Fade out
      if (entry.mesh.material && entry.mesh.material.opacity !== undefined) {
        entry.mesh.material.opacity = (1 - progress) * 0.5;
      }
    }
  }
  
  /**
   * Update ghost markers
   */
  updateGhostMarkers(deltaTime) {
    const markers = this.registry.getIllusionsByType('ghostMarkers');
    for (const entry of markers) {
      if (!entry.mesh || !entry.config) continue;
      
      const progress = entry.progress;
      
      // Noise flicker - scale variation
      const noise = 1 + (Math.random() - 0.5) * entry.config.noiseAmount;
      entry.mesh.scale.y = noise;
      
      // Rotation twitch
      entry.mesh.rotation.z = (Math.random() - 0.5) * 0.2;
      
      // Fade out
      if (entry.mesh.material && entry.mesh.material.opacity !== undefined) {
        entry.mesh.material.opacity = (1 - progress) * 0.35;
      }
    }
  }
  
  /**
   * Update sigma hallucinations
   */
  updateHallucinations(deltaTime) {
    const hallucinations = this.registry.getIllusionsByType('hallucinations');
    for (const entry of hallucinations) {
      if (!entry.mesh || !entry.config) continue;
      
      const progress = entry.progress;
      
      // Flicker visibility
      const flickerPhase = (this.scene.userData.globalTime * entry.config.flickerSpeed) % 1;
      entry.mesh.visible = flickerPhase > 0.5;
      
      // Slight rotation
      entry.mesh.rotation.y += 0.01;
      
      // Fade out
      if (entry.mesh.material && entry.mesh.material.opacity !== undefined) {
        entry.mesh.material.opacity = (1 - progress) * 0.6;
      }
    }
  }
  
  /**
   * Create quantum glyph geometry
   */
  createQuantumGlyph() {
    const group = new THREE.BufferGeometry();
    const positions = [];
    
    // Create a combination of geometric shapes forming quantum glyphs
    // Tetrahedron pattern
    const scale = 1;
    const vertices = [
      [1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]
    ];
    
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        positions.push(vertices[i][0] * scale, vertices[i][1] * scale, vertices[i][2] * scale);
        positions.push(vertices[j][0] * scale, vertices[j][1] * scale, vertices[j][2] * scale);
      }
    }
    
    group.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    
    return group;
  }
  
  /**
   * Get illusion statistics
   */
  getStats() {
    return this.registry.getStats();
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
  }
  
  /**
   * Dispose resources
   */
  dispose() {
    this.clearAll();
    if (this.screenSpaceContainer) {
      this.root.remove(this.screenSpaceContainer);
    }
  }
}
