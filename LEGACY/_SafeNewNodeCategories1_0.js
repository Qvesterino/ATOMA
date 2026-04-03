import * as THREE from 'three';
import { canEmissive, safeSetEmissive } from './_EmissiveUtils.js';

// Legacy aura overlays kill-switch
const ENABLE_LEGACY_AURAS = false;

/**
 * SAFE NEW NODE CATEGORIES 1.0 - ATOMA Edition
 * 
 * Adds 3 new specialized node categories to the ATOMA network:
 * - MYTHIC NODES (MYT-): Rare ritual-based stabilizers
 * - PRIME NODES (PRM-): Perfect topology anchors
 * - ERROR NODES (ERR-): Unstable glitch entities
 * 
 * ABSOLUTE SAFETY RULES ENFORCED:
 * ✅ NO gameplay core modifications
 * ✅ NO node linking system changes
 * ✅ NO physics or movement modifications
 * ✅ Additive only - no existing archetypes touched
 * ✅ Pure visual layer with optional spawn rules
 * ✅ Fully reversible and safe
 * ✅ Backwards compatible with standardization system
 * 
 * FEATURES PER CATEGORY:
 * - Unique spawn conditions (optional, safe)
 * - Category-specific visuals (reusing existing materials)
 * - Metadata tracking (userData only)
 * - Integration hooks for gameplay systems
 */

export class SafeNewNodeCategories1_0 {
  constructor(scene, aiNodes = null) {
    this.scene = scene;
    this.aiNodes = aiNodes;
    this.registeredNodes = new Map();
    
    // Category definitions
    this.categories = {
      mythic: {
        prefix: 'MYT-',
        displayName: 'Mythic Node',
        description: 'Rare ritual-based stabilizer',
        spawnCondition: 'ritual_event_or_high_synergy',
        colors: {
          primary: 0xffd700,    // Gold
          secondary: 0xaa00ff,  // Purple
          tertiary: 0x00ffff    // Cyan
        },
        rarity: 0.02,           // 2% spawn chance (when conditions met)
        visualConfig: {
          auraCount: 3,
          ringCount: 3,
          distortionIntensity: 0.15,
          glowScale: 0.8
        }
      },
      prime: {
        prefix: 'PRM-',
        displayName: 'Prime Node',
        description: 'Perfect network anchor',
        spawnCondition: 'perfect_topology',
        colors: {
          primary: 0xffffff,    // White
          secondary: 0xcccccc,  // Light gray
          tertiary: 0xffffff    // White
        },
        rarity: 0.01,           // 1% spawn chance (when conditions met)
        visualConfig: {
          ringCount: 6,
          hexScale: 1.2,
          spaceBendIntensity: 0.2,
          glowScale: 1.0
        }
      },
      error: {
        prefix: 'ERR-',
        displayName: 'Error Node',
        description: 'Unstable glitch entity',
        spawnCondition: 'high_corruption_or_stability',
        colors: {
          primary: 0xff0000,    // Red
          secondary: 0x00ffff,  // Cyan
          tertiary: 0xff0000    // Red
        },
        rarity: 0.03,           // 3% spawn chance (when conditions met)
        visualConfig: {
          glitchCount: 8,
          jitterAmount: 0.1,
          fractalBreakups: 3,
          flashFrequency: 2.0
        }
      }
    };
    
    // Spawn rule configuration
    this.spawnRules = {
      ritualEventActive: false,
      globalSynergy: 0,
      globalCorruption: 0,
      globalStability: 0,
      perfectTopologyActive: false
    };
    
    // Tracking
    this.nodesByCategory = {
      mythic: [],
      prime: [],
      error: []
    };
    
    this.stats = {
      mythicSpawned: 0,
      primeSpawned: 0,
      errorSpawned: 0,
      totalSpawned: 0
    };
    
    console.log('[SafeNewNodeCategories1_0] Initialized - 3 new node categories ready');
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   * CATEGORY A: MYTHIC NODES
   * Rare, stabilizing, ritual-based nodes with triple aura and distortion
   * ═══════════════════════════════════════════════════════════════════════════════
   */
  
  /**
   * Create a Mythic Node visual enhancement
   * Triple aura (gold/purple/cyan), slow singularity distortion, orbiting rings
   */
  createMythicNodeVisuals(node) {
    if (!node) return false;
    
    try {
      const config = this.categories.mythic;
      const colors = config.colors;
      
      // Container for all mythic VFX
      let mythicGroup = node.getObjectByName('mythic-vfx');
      if (mythicGroup) {
        node.remove(mythicGroup);
      }
      mythicGroup = new THREE.Group();
      mythicGroup.name = 'mythic-vfx';
      node.add(mythicGroup);
      
      // LEGACY_AURA_DISABLED
      // This aura system is disabled to prevent visual stack conflicts.
      // Core aura stack is:
      // - hover (NodeAuraSystem_v1)
      // - selected (_UISelectedNodeHighlight)
      // - linked (NodeLinkedAuraSystem)
      if (false && ENABLE_LEGACY_AURAS) {
        // ===== TRIPLE AURA =====
        // Aura 1: Golden glow (largest)
        const aura1Geo = new THREE.SphereGeometry(0.8, 24, 24);
        const aura1Mat = new THREE.MeshBasicMaterial({
          color: colors.primary,
          transparent: true,
          opacity: 0.15,
          side: THREE.BackSide,
          fog: false,
          depthTest: false,   // ⚠️ CRITICAL: Aura overlay does NOT read depth
          depthWrite: false   // ⚠️ CRITICAL: Aura overlay does NOT write depth
        });
        const aura1 = new THREE.Mesh(aura1Geo, aura1Mat);
        aura1.userData = { isMythicVFX: true, auraType: 'gold' };
        mythicGroup.add(aura1);
        
        // Aura 2: Purple glow (medium)
        const aura2Geo = new THREE.SphereGeometry(0.6, 20, 20);
        const aura2Mat = new THREE.MeshBasicMaterial({
          color: colors.secondary,
          transparent: true,
          opacity: 0.12,
          side: THREE.BackSide,
          fog: false,
          depthTest: false,   // ⚠️ CRITICAL: Aura overlay does NOT read depth
          depthWrite: false   // ⚠️ CRITICAL: Aura overlay does NOT write depth
        });
        const aura2 = new THREE.Mesh(aura2Geo, aura2Mat);
        aura2.userData = { isMythicVFX: true, auraType: 'purple' };
        mythicGroup.add(aura2);
        
        // Aura 3: Cyan glow (inner)
        const aura3Geo = new THREE.SphereGeometry(0.4, 16, 16);
        const aura3Mat = new THREE.MeshBasicMaterial({
          color: colors.tertiary,
          transparent: true,
          opacity: 0.1,
          side: THREE.BackSide,
          fog: false,
          depthTest: false,   // ⚠️ CRITICAL: Aura overlay does NOT read depth
          depthWrite: false   // ⚠️ CRITICAL: Aura overlay does NOT write depth
        });
        const aura3 = new THREE.Mesh(aura3Geo, aura3Mat);
        aura3.userData = { isMythicVFX: true, auraType: 'cyan' };
        mythicGroup.add(aura3);
        
        // ===== ORBITING RINGS =====
        for (let i = 0; i < 3; i++) {
          const ringGeo = new THREE.TorusGeometry(0.5 + i * 0.15, 0.05, 16, 128);
          const ringMat = new THREE.MeshBasicMaterial({
            color: [colors.primary, colors.secondary, colors.tertiary][i],
            transparent: true,
            opacity: 0.4 - i * 0.1,
            fog: false,
            depthTest: false,   // ⚠️ CRITICAL: Aura overlay does NOT read depth
            depthWrite: false   // ⚠️ CRITICAL: Aura overlay does NOT write depth
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = Math.PI * 0.3 * (i - 1);
          ring.rotation.y = (i * Math.PI * 2) / 3;
          ring.userData = {
            isMythicVFX: true,
            ringIndex: i,
            rotationSpeed: 0.3 + i * 0.1,
            rotationAxis: new THREE.Vector3(
              Math.sin(i),
              Math.cos(i),
              0.5
            ).normalize()
          };
          mythicGroup.add(ring);
        }
      }
      
      // ===== SINGULARITY DISTORTION =====
      const distortionGeo = new THREE.IcosahedronGeometry(0.3, 4);
      const distortionMat = new THREE.MeshBasicMaterial({
        color: colors.secondary,
        transparent: true,
        opacity: 0.05,
        emissive: colors.secondary,
        emissiveIntensity: 0.2,
        fog: false
      });
      const distortion = new THREE.Mesh(distortionGeo, distortionMat);
      distortion.userData = {
        isMythicVFX: true,
        distortionPhase: Math.random() * Math.PI * 2,
        distortionSpeed: 0.15
      };
      mythicGroup.add(distortion);
      
      // Mark node as mythic
      node.userData.nodeCategory = 'mythic';
      node.userData.categoryPrefix = 'MYT-';
      node.userData.isMythic = true;
      node.userData.mythicSpawnTime = Date.now();
      node.userData.mythicBonus = {
        stabilityBonus: 0.15,
        glyphSpreadSpeed: 1.3,
        evolutionUnlock: 'mythic'
      };
      
      const nodeId = node.uuid || Math.random().toString();
      this.registeredNodes.set(nodeId, {
        node,
        category: 'mythic',
        createdAt: Date.now(),
        vfxGroup: mythicGroup
      });
      
      this.nodesByCategory.mythic.push(node);
      this.stats.mythicSpawned++;
      this.stats.totalSpawned++;
      
      return true;
    } catch (err) {
      console.error('[SafeNewNodeCategories] Error creating Mythic visuals:', err);
      return false;
    }
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   * CATEGORY B: PRIME NODES
   * Perfect network anchors with white fractal core and holographic hex rings
   * ═══════════════════════════════════════════════════════════════════════════════
   */
  
  /**
   * Create a Prime Node visual enhancement
   * White fractal core, holographic hex rings, subtle space-bending
   */
  createPrimeNodeVisuals(node) {
    if (!node) return false;
    
    try {
      const config = this.categories.prime;
      const colors = config.colors;
      
      // Container for all prime VFX
      let primeGroup = node.getObjectByName('prime-vfx');
      if (primeGroup) {
        node.remove(primeGroup);
      }
      primeGroup = new THREE.Group();
      primeGroup.name = 'prime-vfx';
      node.add(primeGroup);
      
      // ===== WHITE FRACTAL CORE =====
      const coreLayers = 4;
      for (let i = 0; i < coreLayers; i++) {
        const coreGeo = new THREE.OctahedronGeometry(0.15 * (1 - i * 0.15), 2);
        const coreMat = new THREE.MeshBasicMaterial({
          color: colors.primary,
          transparent: true,
          opacity: 0.7 - i * 0.15,
          emissive: colors.primary,
          emissiveIntensity: 0.4,
          fog: false
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        coreMesh.scale.set(1 + i * 0.1, 1 + i * 0.1, 1 + i * 0.1);
        coreMesh.userData = { isPrimeVFX: true, coreLayer: i };
        primeGroup.add(coreMesh);
      }
      
      // ===== HOLOGRAPHIC HEX RINGS =====
      const hexCount = config.visualConfig.ringCount;
      for (let i = 0; i < hexCount; i++) {
        // Create hexagon using torus as base (approximate)
        const hexGeo = new THREE.TorusGeometry(0.4 + i * 0.12, 0.04, 6, 128);
        const hexMat = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? colors.primary : colors.secondary,
          transparent: true,
          opacity: 0.4 - i * 0.05,
          emissive: i % 2 === 0 ? colors.primary : colors.secondary,
          emissiveIntensity: 0.3,
          fog: false
        });
        const hexRing = new THREE.Mesh(hexGeo, hexMat);
        hexRing.rotation.x = (i / hexCount) * Math.PI;
        hexRing.rotation.y = (i / hexCount) * Math.PI * 2;
        hexRing.rotation.z = (i / hexCount) * Math.PI * 0.5;
        hexRing.userData = {
          isPrimeVFX: true,
          hexIndex: i,
          rotationSpeed: 0.15 + i * 0.05,
          rotationAxis: new THREE.Vector3(
            Math.sin(i * 0.5),
            Math.cos(i * 0.5),
            Math.sin(i * 0.3)
          ).normalize()
        };
        primeGroup.add(hexRing);
      }
      
      // ===== SPACE-BENDING DISTORTION =====
      const bendGeo = new THREE.IcosahedronGeometry(0.5, 3);
      const bendMat = new THREE.MeshBasicMaterial({
        color: colors.secondary,
        transparent: true,
        opacity: 0.08,
        fog: false
      });
      const bend = new THREE.Mesh(bendGeo, bendMat);
      bend.userData = {
        isPrimeVFX: true,
        bendPhase: 0,
        bendIntensity: config.visualConfig.spaceBendIntensity
      };
      primeGroup.add(bend);
      
      // Mark node as prime
      node.userData.nodeCategory = 'prime';
      node.userData.categoryPrefix = 'PRM-';
      node.userData.isPrime = true;
      node.userData.primeSpawnTime = Date.now();
      node.userData.primeBonus = {
        globalBonus: 0.2,
        corruptionReduction: 0.25,
        evolutionUnlock: ['prime_ascendant', 'prime_fragmented']
      };
      
      const nodeId = node.uuid || Math.random().toString();
      this.registeredNodes.set(nodeId, {
        node,
        category: 'prime',
        createdAt: Date.now(),
        vfxGroup: primeGroup
      });
      
      this.nodesByCategory.prime.push(node);
      this.stats.primeSpawned++;
      this.stats.totalSpawned++;
      
      return true;
    } catch (err) {
      console.error('[SafeNewNodeCategories] Error creating Prime visuals:', err);
      return false;
    }
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   * CATEGORY C: ERROR NODES
   * Unstable glitch entities with red/cyan layers and jitter animation
   * ═══════════════════════════════════════════════════════════════════════════════
   */
  
  /**
   * Create an Error Node visual enhancement
   * Red/cyan glitch layers, fractal breakups, jitter animation
   */
  createErrorNodeVisuals(node) {
    if (!node) return false;
    
    try {
      const config = this.categories.error;
      const colors = config.colors;
      
      // Container for all error VFX
      let errorGroup = node.getObjectByName('error-vfx');
      if (errorGroup) {
        node.remove(errorGroup);
      }
      errorGroup = new THREE.Group();
      errorGroup.name = 'error-vfx';
      node.add(errorGroup);
      
      // ===== RED/CYAN GLITCH LAYERS =====
      for (let i = 0; i < 4; i++) {
        const glitchGeo = new THREE.BoxGeometry(0.4 + i * 0.1, 0.4 + i * 0.1, 0.4 + i * 0.1);
        const glitchMat = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? colors.primary : colors.secondary,
          transparent: true,
          opacity: 0.25 - i * 0.05,
          emissive: i % 2 === 0 ? colors.primary : colors.secondary,
          emissiveIntensity: 0.6,
          wireframe: i % 2 === 0,
          fog: false
        });
        const glitch = new THREE.Mesh(glitchGeo, glitchMat);
        glitch.position.set(
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.15
        );
        glitch.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        glitch.userData = {
          isErrorVFX: true,
          glitchIndex: i,
          jitterAmount: config.visualConfig.jitterAmount,
          basePosition: glitch.position.clone(),
          baseRotation: glitch.rotation.clone()
        };
        errorGroup.add(glitch);
      }
      
      // ===== FRACTAL BREAKUP PARTICLES =====
      const particleCount = config.visualConfig.fractalBreakups * 3;
      for (let i = 0; i < particleCount; i++) {
        const particleGeo = new THREE.TetrahedronGeometry(0.05, 1);
        const particleMat = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? colors.primary : colors.secondary,
          transparent: true,
          opacity: 0.4,
          emissive: i % 2 === 0 ? colors.primary : colors.secondary,
          emissiveIntensity: 0.7,
          fog: false
        });
        const particle = new THREE.Mesh(particleGeo, particleMat);
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 0.3 + Math.random() * 0.2;
        particle.position.set(
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 0.3,
          Math.sin(angle) * radius
        );
        particle.userData = {
          isErrorVFX: true,
          particleIndex: i,
          orbitAngle: angle,
          orbitRadius: radius,
          orbitSpeed: 1.5 + Math.random() * 1.0
        };
        errorGroup.add(particle);
      }
      
      // ===== CORE FLASH INDICATOR =====
      const coreFlashGeo = new THREE.SphereGeometry(0.2, 16, 16);
      const coreFlashMat = new THREE.MeshBasicMaterial({
        color: colors.primary,
        transparent: true,
        opacity: 0.5,
        emissive: colors.primary,
        emissiveIntensity: 0.8,
        fog: false
      });
      const coreFlash = new THREE.Mesh(coreFlashGeo, coreFlashMat);
      coreFlash.userData = {
        isErrorVFX: true,
        flashPhase: Math.random() * Math.PI * 2,
        flashFrequency: config.visualConfig.flashFrequency
      };
      errorGroup.add(coreFlash);
      
      // Mark node as error
      node.userData.nodeCategory = 'error';
      node.userData.categoryPrefix = 'ERR-';
      node.userData.isError = true;
      node.userData.errorSpawnTime = Date.now();
      node.userData.errorBehavior = {
        spreadCorruption: 0.2,
        glyphPacketType: 'error',
        chaosEventChance: 0.15,
        stabilizable: true,
        stabilizationBonus: 0.3
      };
      
      const nodeId = node.uuid || Math.random().toString();
      this.registeredNodes.set(nodeId, {
        node,
        category: 'error',
        createdAt: Date.now(),
        vfxGroup: errorGroup
      });
      
      this.nodesByCategory.error.push(node);
      this.stats.errorSpawned++;
      this.stats.totalSpawned++;
      
      return true;
    } catch (err) {
      console.error('[SafeNewNodeCategories] Error creating Error visuals:', err);
      return false;
    }
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   * SPAWN RULE SYSTEM
   * Safe, minimal spawn conditions for each category
   * ═══════════════════════════════════════════════════════════════════════════════
   */
  
  /**
   * Update spawn rule conditions (called once per frame)
   */
  updateSpawnRules(worldMetrics = {}) {
    // Extract metrics from world
    this.spawnRules.globalSynergy = worldMetrics.synergy || 0;
    this.spawnRules.globalCorruption = worldMetrics.corruption || 0;
    this.spawnRules.globalStability = worldMetrics.stability || 0;
    this.spawnRules.ritualEventActive = worldMetrics.ritualActive || false;
    this.spawnRules.perfectTopologyActive = worldMetrics.perfectTopology || false;
  }
  
  /**
   * Check if a new Mythic node should spawn
   * Condition: Ritual event active OR synergy > 0.7
   */
  shouldSpawnMythic() {
    return (
      this.spawnRules.ritualEventActive ||
      this.spawnRules.globalSynergy > 0.7
    );
  }
  
  /**
   * Check if a new Prime node should spawn
   * Condition: Perfect topology detected
   */
  shouldSpawnPrime() {
    return this.spawnRules.perfectTopologyActive;
  }
  
  /**
   * Check if a new Error node should spawn
   * Condition: High corruption OR low stability
   */
  shouldSpawnError() {
    return (
      this.spawnRules.globalCorruption > 0.6 ||
      this.spawnRules.globalStability < 0.4
    );
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   * ANIMATION & UPDATE SYSTEM
   * Per-frame animation updates for all new category visuals
   * ═══════════════════════════════════════════════════════════════════════════════
   */
  
  /**
   * Update all new category node visuals (call once per frame)
   */
  update(deltaTime, time = 0) {
    // Update Mythic nodes
    this.nodesByCategory.mythic.forEach(node => {
      this.updateMythicNode(node, deltaTime, time);
    });
    
    // Update Prime nodes
    this.nodesByCategory.prime.forEach(node => {
      this.updatePrimeNode(node, deltaTime, time);
    });
    
    // Update Error nodes
    this.nodesByCategory.error.forEach(node => {
      this.updateErrorNode(node, deltaTime, time);
    });
  }
  
  /**
   * Update Mythic node animations
   */
  updateMythicNode(node, deltaTime, time) {
    const vfxGroup = node.getObjectByName('mythic-vfx');
    if (!vfxGroup) return;
    
    // Rotate auras
    vfxGroup.children.slice(0, 3).forEach((aura, index) => {
      aura.rotation.y += deltaTime * (0.2 + index * 0.1);
      aura.rotation.x += deltaTime * (0.1 + index * 0.05);
    });
    
    // Rotate orbiting rings
    vfxGroup.children.slice(3, 6).forEach((ring, index) => {
      if (ring.userData.rotationAxis) {
        const axis = ring.userData.rotationAxis;
        const angle = deltaTime * ring.userData.rotationSpeed;
        ring.rotateOnWorldAxis(axis, angle);
      }
    });
    
    // Animate distortion with sine wave
    const distortion = vfxGroup.children[6];
    if (distortion && distortion.userData.isMythicVFX) {
      distortion.userData.distortionPhase += deltaTime * distortion.userData.distortionSpeed;
      const scale = 0.3 + Math.sin(distortion.userData.distortionPhase) * 0.15;
      distortion.scale.set(scale, scale, scale);
    }
  }
  
  /**
   * Update Prime node animations
   */
  updatePrimeNode(node, deltaTime, time) {
    const vfxGroup = node.getObjectByName('prime-vfx');
    if (!vfxGroup) return;
    
    // Rotate fractal core layers
    vfxGroup.children.slice(0, 4).forEach((core, index) => {
      core.rotation.x += deltaTime * (0.1 + index * 0.05);
      core.rotation.y += deltaTime * (0.15 + index * 0.08);
      core.rotation.z += deltaTime * (0.08 + index * 0.04);
    });
    
    // Rotate holographic hex rings
    vfxGroup.children.slice(4, 10).forEach((hexRing) => {
      if (hexRing.userData.rotationAxis) {
        const axis = hexRing.userData.rotationAxis;
        const angle = deltaTime * hexRing.userData.rotationSpeed;
        hexRing.rotateOnWorldAxis(axis, angle);
      }
    });
    
    // Animate space-bending distortion
    const bend = vfxGroup.children[10];
    if (bend && bend.userData.isPrimeVFX) {
      bend.userData.bendPhase += deltaTime * 0.5;
      const bendAmount = Math.sin(bend.userData.bendPhase) * bend.userData.bendIntensity;
      bend.scale.set(
        1 + bendAmount,
        1 - bendAmount * 0.5,
        1 + bendAmount * 0.3
      );
    }
  }
  
  /**
   * Update Error node animations
   */
  updateErrorNode(node, deltaTime, time) {
    const vfxGroup = node.getObjectByName('error-vfx');
    if (!vfxGroup) return;
    
    // Jitter glitch layers
    vfxGroup.children.slice(0, 4).forEach((glitch) => {
      if (glitch.userData.isErrorVFX && glitch.userData.basePosition) {
        const jitter = Math.sin(time * 5 + glitch.userData.glitchIndex) * glitch.userData.jitterAmount;
        glitch.position.copy(glitch.userData.basePosition);
        glitch.position.addScaledVector(
          new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          ),
          jitter
        );
      }
    });
    
    // Orbit fractal particles
    const particleStart = 4;
    const particleEnd = 4 + (this.categories.error.visualConfig.fractalBreakups * 3);
    vfxGroup.children.slice(particleStart, particleEnd).forEach((particle) => {
      if (particle.userData.isErrorVFX && particle.userData.particleIndex !== undefined) {
        const newAngle = particle.userData.orbitAngle + deltaTime * particle.userData.orbitSpeed;
        particle.position.x = Math.cos(newAngle) * particle.userData.orbitRadius;
        particle.position.z = Math.sin(newAngle) * particle.userData.orbitRadius;
        particle.position.y += Math.sin(time * 2 + particle.userData.particleIndex) * 0.05;
      }
    });
    
    // Flash core indicator
    const coreFlash = vfxGroup.children[vfxGroup.children.length - 1];
    if (coreFlash && coreFlash.userData.isErrorVFX) {
      // MATERIAL SAFETY 4.0: Guard emissive access
      if (!coreFlash.material || !canEmissive(coreFlash.material)) return;
      
      coreFlash.userData.flashPhase += deltaTime * coreFlash.userData.flashFrequency;
      const flashIntensity = Math.abs(Math.sin(coreFlash.userData.flashPhase));
      coreFlash.material.opacity = 0.2 + flashIntensity * 0.6;
      safeSetEmissive(coreFlash.material, undefined, 0.4 + flashIntensity * 0.8);
    }
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   * UTILITY METHODS
   * ═══════════════════════════════════════════════════════════════════════════════
   */
  
  /**
   * Apply a category to an existing node
   */
  applyCategoryToNode(node, category) {
    if (!this.categories[category]) {
      console.warn(`[SafeNewNodeCategories] Unknown category: ${category}`);
      return false;
    }
    
    switch (category) {
      case 'mythic':
        return this.createMythicNodeVisuals(node);
      case 'prime':
        return this.createPrimeNodeVisuals(node);
      case 'error':
        return this.createErrorNodeVisuals(node);
      default:
        return false;
    }
  }
  
  /**
   * Remove a category from a node
   */
  removeCategoryFromNode(node) {
    if (!node) return;
    
    const nodeId = node.uuid || Math.random().toString();
    const nodeData = this.registeredNodes.get(nodeId);
    
    if (nodeData && nodeData.vfxGroup && nodeData.vfxGroup.parent) {
      nodeData.vfxGroup.parent.remove(nodeData.vfxGroup);
      
      // Cleanup materials and geometries
      nodeData.vfxGroup.traverse(child => {
        if (child.material) child.material.dispose();
        if (child.geometry) child.geometry.dispose();
      });
    }
    
    // Remove from tracking
    this.registeredNodes.delete(nodeId);
    const categoryArray = this.nodesByCategory[nodeData?.category];
    if (categoryArray) {
      const index = categoryArray.indexOf(node);
      if (index > -1) categoryArray.splice(index, 1);
    }
  }
  
  /**
   * Get all nodes of a specific category
   */
  getNodesByCategory(category) {
    return this.nodesByCategory[category] || [];
  }
  
  /**
   * Get statistics on spawned nodes
   */
  getStatistics() {
    return {
      ...this.stats,
      mythicNodes: this.nodesByCategory.mythic.length,
      primeNodes: this.nodesByCategory.prime.length,
      errorNodes: this.nodesByCategory.error.length,
      totalActive: this.registeredNodes.size
    };
  }
  
  /**
   * Print comprehensive status report
   */
  printStatusReport() {
    const stats = this.getStatistics();
    
    console.group('✓ SAFE NEW NODE CATEGORIES 1.0 - Status Report');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('MYTHIC NODES (MYT-)');
    console.log(`  Active: ${stats.mythicNodes} | Spawned: ${stats.mythicSpawned}`);
    console.log(`  Prefix: MYT- | Rarity: 2% | Synergy Bonus: +15%`);
    console.log('');
    console.log('PRIME NODES (PRM-)');
    console.log(`  Active: ${stats.primeNodes} | Spawned: ${stats.primeSpawned}`);
    console.log(`  Prefix: PRM- | Rarity: 1% | Corruption Reduction: -25%`);
    console.log('');
    console.log('ERROR NODES (ERR-)');
    console.log(`  Active: ${stats.errorNodes} | Spawned: ${stats.errorSpawned}`);
    console.log(`  Prefix: ERR- | Rarity: 3% | Corruption Spread: +20%`);
    console.log('');
    console.log('SUMMARY');
    console.log(`  Total Categories: 3 | Total Active: ${stats.totalActive}`);
    console.log(`  Total Spawned: ${stats.totalSpawned}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.groupEnd();
  }
}
