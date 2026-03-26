/**
 * ATOMA GLYPH SYSTEM 4.0 — ANIMATED MEANING EDITION
 * 
 * Intelligent, contextual glyph animations that communicate node state,
 * metrics, personalities, and world events through expressive visual behavior.
 * 
 * STRICT SAFETY RULES:
 * - DO NOT modify: createNode(), updateNode(), AINodes.js, physics, collisions,
 *   movement, world transitions, or shader pipelines.
 * - All glyphs are non-destructive visual children only.
 * - Glyphs fail-safe: if something is missing, simply skip.
 * - All animations: rotation, scale, opacity, colorLerp only.
 * - No post-processing, no volumetrics, no new materials.
 * - < 1ms per frame total overhead.
 * 
 * GLYPH MEANING THROUGH ANIMATION:
 * - AI Consciousness: Stable self-aware processing (breathing hexagon)
 * - Mythic Seed: Incubation state (spiraling growth)
 * - Ascended Node: Transcended function (spectral halos)
 * - Evolution Stages 1-3: Growth progression (complexity increases)
 * - Personality States: Emotional health (harmony/stability/corruption/synergy)
 * - Event Glyphs: Real-time phenomena (rituals/surges/world events)
 */

import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

export class AtomaGlyphSystem4_0 {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    // Master glyph container
    this.glyphContainer = new THREE.Group();
    this.glyphContainer.userData.isAtomaGlyph4Container = true;
    this.glyphContainer.name = 'AtomaGlyphSystem4';
    this.root = this.glyphContainer;
    this.scene.add(this.glyphContainer);
    
    // Registry: nodeId → { node, glyphGroup, glyphType, metadata, context }
    this.glyphRegistry = new Map();
    
    // Context cache: nodeId → { synergy, stability, harmony, corruption, load, personality }
    this.contextCache = new Map();
    
    // Animation state: nodeId → { phase, rotationAngles[], colorPhase, etc }
    this.animationState = new Map();
    
    // [SYNERGY GLYPH REVEAL] Synergy state tracking per node
    this.synergyGlyphStates = new Map(); // nodeId → { linkedSynergy, revealLevel, revealed }
    
    // [SYNERGY GLYPH REVEAL] Synergy-based glyph visibility thresholds
    this.synergyThresholds = {
      linkedSynergy: 0.70,   // Connected nodes must have this synergy to engage
      reveal1: 0.75,         // Tier 1 reveal at 75% synergy
      reveal2: 0.85,         // Tier 2 reveal (full) at 85% synergy
      colorShift: 0.80       // Color shift intensity ramps from 80%
    };
    
    // [CORRUPTION GLYPH DIMMING] Corruption-based opacity reduction
    this.corruptionDimmingConfig = {
      activeThreshold: 0.65,   // Dimming starts at 65% corruption (matches visual deformation)
      maxDimmingThreshold: 0.85, // Full dimming at 85% corruption
      minOpacityFactor: 0.25   // Glyphs dim to 25% of normal opacity at max corruption
    };
    
    // VISUAL HIERARCHY: Global scale & opacity normalization (Session 18 Audit)
    this.glyphScaleFactors = {
      default: 0.40,      // 40% of original scale for standard nodes
      storage: 0.32,      // 32% for storage nodes (additional 20% reduction)
      breathing: 0.15,    // +15% max breathing (vs. +30% before)
    };
    
    this.glyphOpacityLimits = {
      min: 0.45,
      max: 0.60,
      breathing: 0.08,    // ±0.08 from midpoint during animation
    };
    
    this.glyphYOffsets = {
      default: 0.65,      // 0.60–0.70 standard
      storage: 0.55,      // 0.55 for compact storage nodes
    };
    
    // Statistics
    this.stats = {
      totalGlyphsCreated: 0,
      activeGlyphs: 0,
      byType: {},
      lastUpdateTime: 0
    };
    
    // ATOMA color palette
    this.colors = {
      cyan: new THREE.Color(0x00F2FF),
      mint: new THREE.Color(0x84FFE6),
      magenta: new THREE.Color(0xFF00FF),
      violet: new THREE.Color(0x9933FF),
      gold: new THREE.Color(0xFFD700),
      white: new THREE.Color(0xFFFFFF),
      blue: new THREE.Color(0x0099FF),
      green: new THREE.Color(0x00FF88),
      red: new THREE.Color(0xFF3333),
      orange: new THREE.Color(0xFF8844),
      dark: new THREE.Color(0x0a0a14)
    };
    
    // Global time for synchronized animations
    this.globalTime = 0;
    this._timeOrigin = undefined;
    this._lastVisualTime = undefined;
    
    // Cluster detection (for synchronized rotation)
    this.clusterGroups = new Map(); // nodeId → clusterId
    this.clusterSync = new Map(); // clusterId → { nodes, syncPhase }
    this.clusterSyncDuration = 1.5; // seconds
    this.lastClusterCheck = 0;
    
    console.log('✓ ATOMA Glyph System 4.0 (Animated Meaning Edition) initialized');
  }

  dispose() {
    const root = this.root || this.glyphContainer;
    if (!root) return;
    root.traverse((obj) => {
      if (obj.geometry && typeof obj.geometry.dispose === 'function') {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m && typeof m.dispose === 'function' && m.dispose());
        } else if (typeof obj.material.dispose === 'function') {
          obj.material.dispose();
        }
      }
    });
  }
  
  // ============================================================
  // CONTEXT ANALYSIS (Core Meaning Engine)
  // ============================================================
  
  /**
   * Analyze node metrics and world state to build animation context
   */
  analyzeContext(node, nodeId) {
    if (!node || !node.userData) {
      return null;
    }
    
    const context = {
      synergy: node.userData?.metrics?.synergy ?? 0,
      stability: node.userData?.metrics?.stability ?? 0,
      harmony: node.userData?.metrics?.harmony ?? 0,
      corruption: node.userData?.metrics?.corruption ?? 0,
      load: node.userData?.metrics?.loadPressure ?? 0,
      energy: node.userData?.metrics?.synergy ?? 0.5,
      clarity: node.userData?.metrics?.harmony ?? 0.5,
      personality: node.userData.personality || { type: 'BALANCED', mood: 'CALM' },
      evolutionStage: node.userData.evolutionStage || 1,
      isMythic: node.userData.isMythic || false,
      isAscended: node.userData.category === 'ascended' || false,
      linked: node.userData.linked || false,
      distanceToCamera: this.calculateDistanceToCamera(node)
    };
    
    this.contextCache.set(nodeId, context);
    return context;
  }
  
  calculateDistanceToCamera(node) {
    if (!this.camera || !node) return Infinity;
    
    const nodePos = new THREE.Vector3();
    node.getWorldPosition(nodePos);
    return this.camera.position.distanceTo(nodePos);
  }
  
  // ============================================================
  // GLYPH CREATORS (with Animation State Setup)
  // ============================================================
  
  createAIConsciousnessGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'aiConsciousness',
      isVFX: true,
      noEvolve: true,
      noCleanup: true,
      isLegacyHex: true  // MARK AS LEGACY FOR CLEANUP
    };
    glyphGroup.name = `glyph4_ai_${nodeId}`;
    
    // 3 layered hex rings
    const hexGeometry = this.createHexagonGeometry(0.5, 0.35, 0.2);
    const hexMaterial = new THREE.LineBasicMaterial({
      color: this.colors.cyan,
      transparent: true,
      opacity: 0.65,
      fog: false
    });
    
    const hexMarker = new THREE.LineSegments(hexGeometry, hexMaterial);
    hexMarker.userData = { glyphComponent: 'hexOutline', isLegacyHex: true };
    glyphGroup.add(hexMarker);
    
    // Inner pulsing core
    const coreGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const coreMat = new THREE.MeshBasicMaterial({
      color: this.colors.cyan,
      transparent: true,
      opacity: 0.75,
      emissive: this.colors.cyan,
      emissiveIntensity: 0.5,
      fog: false
    });
    
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.userData = { glyphComponent: 'corePoint', isLegacyHex: true };
    glyphGroup.add(core);
    
    // Animation state
    const animState = {
      breathPhase: Math.random() * Math.PI * 2,
      rotationCW: 0,
      rotationCCW: 0,
      intensityPhase: Math.random() * Math.PI * 2
    };
    this.animationState.set(nodeId, animState);
    
    this.attachGlyph(node, nodeId, glyphGroup, 'aiConsciousness');
    this.recordGlyphStat('aiConsciousness');
    
    return glyphGroup;
  }
  
  createMythicSeedGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'mythicSeed',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph4_mythic_${nodeId}`;
    
    // 3 orbiting micro-triangles in fractal formation
    for (let i = 0; i < 3; i++) {
      const triGeo = new THREE.ConeGeometry(0.08, 0.15, 3);
      const triMat = new THREE.MeshBasicMaterial({
        color: this.colors.magenta,
        transparent: true,
        opacity: 0.7,
        emissive: this.colors.violet,
        emissiveIntensity: 0.35,
        fog: false
      });
      
      const tri = new THREE.Mesh(triGeo, triMat);
      tri.position.x = Math.cos((i / 3) * Math.PI * 2) * 0.35;
      tri.position.z = Math.sin((i / 3) * Math.PI * 2) * 0.35;
      tri.rotation.x = Math.PI / 2;
      
      tri.userData = { glyphComponent: 'orbitTri', orbitIndex: i };
      glyphGroup.add(tri);
    }
    
    // Center seed core
    const seedGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const seedMat = new THREE.MeshBasicMaterial({
      color: this.colors.magenta,
      transparent: true,
      opacity: 0.8,
      emissive: this.colors.magenta,
      emissiveIntensity: 0.6,
      fog: false
    });
    
    const seed = new THREE.Mesh(seedGeo, seedMat);
    seed.userData = { glyphComponent: 'seedCore' };
    glyphGroup.add(seed);
    
    // Animation state
    const animState = {
      orbitPhase: Math.random() * Math.PI * 2,
      bobPhase: Math.random() * Math.PI * 2,
      colorPhase: Math.random() * Math.PI * 2,
      expansionPhase: Math.random() * Math.PI * 2
    };
    this.animationState.set(nodeId, animState);
    
    this.attachGlyph(node, nodeId, glyphGroup, 'mythicSeed');
    this.recordGlyphStat('mythicSeed');
    
    return glyphGroup;
  }
  
  createAscendedNodeGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'ascendedNode',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph4_ascended_${nodeId}`;
    
    // 3 spectral halos
    const haloRadii = [0.4, 0.55, 0.7];
    const haloPhases = [0, 0, 0];
    
    haloRadii.forEach((radius, idx) => {
      const torus = new THREE.TorusGeometry(radius, 0.03, 16, 100);
      const mat = new THREE.LineBasicMaterial({
        color: idx === 0 ? this.colors.white : (idx === 1 ? this.colors.blue : this.colors.cyan),
        transparent: true,
        opacity: 0.55 + idx * 0.08,
        fog: false
      });
      
      const halo = new THREE.LineLoop(
        torus.getAttribute('position'),
        new THREE.BufferAttribute(new Uint16Array(torus.getIndex().array), 1)
      );
      halo.material = mat;
      halo.userData = { glyphComponent: 'haloRing', haloIndex: idx };
      
      glyphGroup.add(halo);
    });
    
    // Animation state
    const animState = {
      haloPhases: haloPhases,
      colorShiftPhase: Math.random() * Math.PI * 2,
      tiltPhase: Math.random() * Math.PI * 2
    };
    this.animationState.set(nodeId, animState);
    
    this.attachGlyph(node, nodeId, glyphGroup, 'ascendedNode');
    this.recordGlyphStat('ascendedNode');
    
    return glyphGroup;
  }
  
  createEvolutionStage1Glyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'evolutionStage1',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph4_evo1_${nodeId}`;
    
    // Small rotating diamond
    const diamondGeo = new THREE.OctahedronGeometry(0.12, 1);
    const diamondMat = new THREE.MeshBasicMaterial({
      color: this.colors.mint,
      transparent: true,
      opacity: 0.7,
      emissive: this.colors.cyan,
      emissiveIntensity: 0.35,
      fog: false
    });
    
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    diamond.userData = { glyphComponent: 'diamond' };
    glyphGroup.add(diamond);
    
    // Animation state
    const animState = {
      rotationPhase: Math.random() * Math.PI * 2,
      bobPhase: Math.random() * Math.PI * 2
    };
    this.animationState.set(nodeId, animState);
    
    this.attachGlyph(node, nodeId, glyphGroup, 'evolutionStage1');
    this.recordGlyphStat('evolutionStage1');
    
    return glyphGroup;
  }
  
  createEvolutionStage2Glyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'evolutionStage2',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph4_evo2_${nodeId}`;
    
    // Double square-loop fractal
    const squareGeo = new THREE.BufferGeometry();
    const positions = [
      -0.25, 0, -0.25,  0.25, 0, -0.25,
      0.25, 0, -0.25,   0.25, 0, 0.25,
      0.25, 0, 0.25,    -0.25, 0, 0.25,
      -0.25, 0, 0.25,   -0.25, 0, -0.25,
      -0.15, 0, -0.15,  0.15, 0, -0.15,
      0.15, 0, -0.15,   0.15, 0, 0.15,
      0.15, 0, 0.15,    -0.15, 0, 0.15,
      -0.15, 0, 0.15,   -0.15, 0, -0.15
    ];
    
    squareGeo.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array(positions), 3
    ));
    
    const squareMat = new THREE.LineBasicMaterial({
      color: this.colors.gold,
      transparent: true,
      opacity: 0.65,
      fog: false
    });
    
    const square = new THREE.LineSegments(squareGeo, squareMat);
    square.userData = { glyphComponent: 'squareLoop' };
    glyphGroup.add(square);
    
    // Animation state
    const animState = {
      rotationPhase: Math.random() * Math.PI * 2,
      expansionPhase: Math.random() * Math.PI * 2,
      shimmerPhase: Math.random() * Math.PI * 2
    };
    this.animationState.set(nodeId, animState);
    
    this.attachGlyph(node, nodeId, glyphGroup, 'evolutionStage2');
    this.recordGlyphStat('evolutionStage2');
    
    return glyphGroup;
  }
  
  createEvolutionStage3Glyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'evolutionStage3',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph4_evo3_${nodeId}`;
    
    // 6-sided prism
    const prismGeo = new THREE.ConeGeometry(0.2, 0.35, 6);
    const prismMat = new THREE.MeshBasicMaterial({
      color: this.colors.violet,
      transparent: true,
      opacity: 0.75,
      emissive: this.colors.magenta,
      emissiveIntensity: 0.45,
      fog: false
    });
    
    const prism = new THREE.Mesh(prismGeo, prismMat);
    prism.userData = { glyphComponent: 'prism' };
    glyphGroup.add(prism);
    
    // Animation state
    const animState = {
      rotationY: Math.random() * Math.PI * 2,
      rotationX: Math.random() * Math.PI * 2,
      shimmerPhase: Math.random() * Math.PI * 2
    };
    this.animationState.set(nodeId, animState);
    
    this.attachGlyph(node, nodeId, glyphGroup, 'evolutionStage3');
    this.recordGlyphStat('evolutionStage3');
    
    return glyphGroup;
  }
  
  createPersonalityHarmonyGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'personalityHarmony',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph4_harmony_${nodeId}`;
    
    // 6-petal lotus flower
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const petalGeo = new THREE.SphereGeometry(0.08, 6, 6);
      const petalMat = new THREE.MeshBasicMaterial({
        color: this.colors.green,
        transparent: true,
        opacity: 0.7,
        emissive: this.colors.cyan,
        emissiveIntensity: 0.35,
        fog: false
      });
      
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.x = Math.cos(angle) * 0.3;
      petal.position.z = Math.sin(angle) * 0.3;
      petal.scale.set(1.2, 0.8, 1.2);
      
      petal.userData = { component: 'petal', petalIndex: i };
      glyphGroup.add(petal);
    }
    
    // Animation state
    const animState = {
      bloomPhase: Math.random() * Math.PI * 2,
      rotationPhase: Math.random() * Math.PI * 2
    };
    this.animationState.set(nodeId, animState);
    
    this.attachGlyph(node, nodeId, glyphGroup, 'personalityHarmony');
    this.recordGlyphStat('personalityHarmony');
    
    return glyphGroup;
  }
  
  createPersonalityStabilityGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'personalityStability',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph4_stability_${nodeId}`;
    
    // 3 chaotic tetrahedrons
    for (let i = 0; i < 3; i++) {
      const tetraGeo = new THREE.TetrahedronGeometry(0.1, 0);
      const tetraMat = new THREE.MeshBasicMaterial({
        color: this.colors.red,
        transparent: true,
        opacity: 0.6,
        emissive: this.colors.orange,
        emissiveIntensity: 0.25,
        fog: false
      });
      
      const tetra = new THREE.Mesh(tetraGeo, tetraMat);
      tetra.userData = {
        component: 'tetra',
        tetraIndex: i,
        restPos: {
          x: (Math.random() - 0.5) * 0.3,
          z: (Math.random() - 0.5) * 0.3
        }
      };
      
      glyphGroup.add(tetra);
    }
    
    // Animation state
    const animState = {
      jitterPhase: Math.random() * Math.PI * 2,
      colorPhase: Math.random() * Math.PI * 2
    };
    this.animationState.set(nodeId, animState);
    
    this.attachGlyph(node, nodeId, glyphGroup, 'personalityStability');
    this.recordGlyphStat('personalityStability');
    
    return glyphGroup;
  }
  
  createPersonalityCorruptionGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'personalityCorruption',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph4_corruption_${nodeId}`;
    
    // Broken, jagged geometry
    const brokenGeo = new THREE.BufferGeometry();
    const brokenVerts = [];
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const r = 0.25 + (Math.random() - 0.5) * 0.12;
      brokenVerts.push(
        Math.cos(angle) * r,
        (Math.random() - 0.5) * 0.12,
        Math.sin(angle) * r
      );
    }
    
    brokenGeo.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array(brokenVerts), 3
    ));
    
    const brokenMat = new THREE.LineBasicMaterial({
      color: this.colors.red,
      transparent: true,
      opacity: 0.7,
      fog: false
    });
    
    const broken = new THREE.LineLoop(brokenGeo, brokenMat);
    broken.userData = { component: 'brokenEdges' };
    glyphGroup.add(broken);
    
    // Animation state
    const animState = {
      driftPhase: Math.random() * Math.PI * 2,
      flickerPhase: Math.random() * Math.PI * 2
    };
    this.animationState.set(nodeId, animState);
    
    this.attachGlyph(node, nodeId, glyphGroup, 'personalityCorruption');
    this.recordGlyphStat('personalityCorruption');
    
    return glyphGroup;
  }
  
  createPersonalitySynergyGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'personalitySynergy',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph4_synergy_${nodeId}`;
    
    // Twin spirals
    for (let spiral = 0; spiral < 2; spiral++) {
      const spiralGeo = new THREE.BufferGeometry();
      const spiralVerts = [];
      
      for (let t = 0; t < Math.PI * 2; t += Math.PI / 6) {
        const spiralDir = spiral === 0 ? 1 : -1;
        const x = Math.cos(t + spiralDir * Math.PI / 2) * (0.3 - t * 0.05);
        const y = (t / (Math.PI * 2)) * 0.3 - 0.15;
        const z = Math.sin(t + spiralDir * Math.PI / 2) * (0.3 - t * 0.05);
        spiralVerts.push(x, y, z);
      }
      
      spiralGeo.setAttribute('position', new THREE.BufferAttribute(
        new Float32Array(spiralVerts), 3
      ));
      
      const spiralMat = new THREE.LineBasicMaterial({
        color: spiral === 0 ? this.colors.cyan : this.colors.magenta,
        transparent: true,
        opacity: 0.65,
        fog: false
      });
      
      const spiralLine = new THREE.Line(spiralGeo, spiralMat);
      spiralLine.userData = { component: 'spiral', spiralIndex: spiral };
      
      glyphGroup.add(spiralLine);
    }
    
    // Animation state
    const animState = {
      mergePhase: Math.random() * Math.PI * 2,
      rotationPhase: Math.random() * Math.PI * 2,
      isClusterHead: false
    };
    this.animationState.set(nodeId, animState);
    
    this.attachGlyph(node, nodeId, glyphGroup, 'personalitySynergy');
    this.recordGlyphStat('personalitySynergy');
    
    return glyphGroup;
  }
  
  createEventMythicRitualGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'eventMythicRitual',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph4_ritual_${nodeId}`;
    
    // Tetra-wheel
    for (let i = 0; i < 4; i++) {
      const tetraGeo = new THREE.TetrahedronGeometry(0.08, 0);
      const tetraMat = new THREE.MeshBasicMaterial({
        color: this.colors.magenta,
        transparent: true,
        opacity: 0.7,
        emissive: this.colors.violet,
        emissiveIntensity: 0.35,
        fog: false
      });
      
      const tetra = new THREE.Mesh(tetraGeo, tetraMat);
      const angle = (i / 4) * Math.PI * 2;
      tetra.position.x = Math.cos(angle) * 0.3;
      tetra.position.z = Math.sin(angle) * 0.3;
      tetra.rotation.y = angle;
      
      tetra.userData = { component: 'tetraWheel', wheelIndex: i };
      glyphGroup.add(tetra);
    }
    
    // Animation state
    const animState = {
      rotationPhase: Math.random() * Math.PI * 2,
      pulsePhase: Math.random() * Math.PI * 2,
      brightnessPulse: 0
    };
    this.animationState.set(nodeId, animState);
    
    this.attachGlyph(node, nodeId, glyphGroup, 'eventMythicRitual');
    this.recordGlyphStat('eventMythicRitual');
    
    return glyphGroup;
  }
  
  createEventClusterSurgeGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'eventClusterSurge',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph4_surge_${nodeId}`;
    
    // Expanding hex-grid (3 rings)
    for (let ring = 0; ring < 3; ring++) {
      const hexGeo = this.createHexagonGeometry(
        0.4 - ring * 0.12,
        0.3 - ring * 0.09,
        0.2 - ring * 0.06
      );
      const hexMat = new THREE.LineBasicMaterial({
        color: this.colors.gold,
        transparent: true,
        opacity: 0.65 - ring * 0.12,
        fog: false
      });
      
      const hex = new THREE.LineSegments(hexGeo, hexMat);
      hex.userData = {
        component: 'surgeHex',
        ringIndex: ring
      };
      
      glyphGroup.add(hex);
    }
    
    // Animation state
    const animState = {
      expansionPhase: Math.random() * Math.PI * 2,
      fadePhase: 0
    };
    this.animationState.set(nodeId, animState);
    
    this.attachGlyph(node, nodeId, glyphGroup, 'eventClusterSurge');
    this.recordGlyphStat('eventClusterSurge');
    
    return glyphGroup;
  }
  
  createEventWorldEventGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'eventWorldEvent',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph4_worldevent_${nodeId}`;
    
    // Fractal sphere
    const sphereGeo = new THREE.IcosahedronGeometry(0.25, 2);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: this.colors.white,
      transparent: true,
      opacity: 0.3,
      emissive: this.colors.cyan,
      emissiveIntensity: 0.25,
      fog: false
    });
    
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.userData = { component: 'fractalSphere' };
    glyphGroup.add(sphere);
    
    // Orbit lines
    const orbitGeo = new THREE.BufferGeometry();
    const orbitVerts = [];
    
    for (let axis = 0; axis < 3; axis++) {
      for (let i = 0; i <= 32; i++) {
        const t = (i / 32) * Math.PI * 2;
        if (axis === 0) {
          orbitVerts.push(Math.cos(t) * 0.3, 0, Math.sin(t) * 0.3);
        } else if (axis === 1) {
          orbitVerts.push(0, Math.cos(t) * 0.3, Math.sin(t) * 0.3);
        } else {
          orbitVerts.push(Math.sin(t) * 0.3, Math.cos(t) * 0.3, 0);
        }
      }
    }
    
    orbitGeo.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array(orbitVerts), 3
    ));
    
    const orbitMat = new THREE.LineBasicMaterial({
      color: this.colors.blue,
      transparent: true,
      opacity: 0.45,
      fog: false
    });
    
    const orbits = new THREE.LineSegments(orbitGeo, orbitMat);
    orbits.userData = { component: 'orbitLines' };
    glyphGroup.add(orbits);
    
    // Animation state
    const animState = {
      sphereRotations: [0, 0, 0],
      orbitSpeeds: [0.15, 0.2, 0.1]
    };
    this.animationState.set(nodeId, animState);
    
    this.attachGlyph(node, nodeId, glyphGroup, 'eventWorldEvent');
    this.recordGlyphStat('eventWorldEvent');
    
    return glyphGroup;
  }
  
  // ============================================================
  // CONTEXTUAL ANIMATION UPDATERS (Core Intelligence)
  // ============================================================
  
  updateAIConsciousnessGlyph(glyphGroup, context, animState, deltaTime) {
    if (!animState) return;
    
    // Breathing based on stability
    animState.breathPhase += deltaTime * (1.5 + context.stability * 2);
    const breath = (Math.sin(animState.breathPhase) + 1) * 0.5;
    const breathScale = 0.96 + breath * 0.06;
    glyphGroup.scale.set(breathScale, breathScale, breathScale);
    
    // Rotation speeds: CW inner ring, CCW outer ring
    animState.rotationCW += (0.3 + context.synergy * 0.5) * deltaTime;
    animState.rotationCCW -= (0.2 - context.stability * 0.3) * deltaTime;
    
    glyphGroup.rotation.y = animState.rotationCW;
    
    // Brightness with synergy
    animState.intensityPhase += deltaTime;
    const intensity = 0.5 + (context.synergy * 0.3) + (Math.sin(animState.intensityPhase) * 0.1);
    
    glyphGroup.children.forEach(child => {
      if (child.material && child.userData.glyphComponent === 'corePoint') {
        child.material.opacity = Math.min(intensity, 0.9);
        child.material.emissiveIntensity = intensity * 0.7;
      }
    });
  }
  
  updateMythicSeedGlyph(glyphGroup, context, animState, deltaTime) {
    if (!animState) return;
    
    // Orbital rotation
    animState.orbitPhase += (0.5 + context.synergy * 1.2) * deltaTime;
    
    glyphGroup.children.forEach(child => {
      if (child.userData.component === 'orbitTri') {
        const idx = child.userData.orbitIndex;
        const orbitAngle = animState.orbitPhase + (idx / 3) * Math.PI * 2;
        child.position.x = Math.cos(orbitAngle) * 0.35;
        child.position.z = Math.sin(orbitAngle) * 0.35;
        child.rotation.y = orbitAngle;
      }
    });
    
    // Vertical bobbing
    animState.bobPhase += deltaTime * 1.5;
    const bob = Math.sin(animState.bobPhase) * 0.15;
    glyphGroup.position.y = 0.9 + bob;
    
    // Color pulse (violet → cyan)
    animState.colorPhase += deltaTime;
    const colorLerp = (Math.sin(animState.colorPhase) + 1) * 0.5;
    
    glyphGroup.children.forEach(child => {
      if (child.material && child.userData.component === 'seedCore') {
        child.material.color.lerpColors(this.colors.violet, this.colors.cyan, colorLerp);
      }
    });
    
    // Expansion as seed matures
    animState.expansionPhase += deltaTime * 0.5;
    const expansion = 1.0 + (Math.sin(animState.expansionPhase) * 0.05);
    const orchetGeom = glyphGroup.children.find(c => c.userData.component === 'orbitTri');
    if (orchetGeom) {
      orchetGeom.scale.set(expansion, expansion, expansion);
    }
  }
  
  updateAscendedNodeGlyph(glyphGroup, context, animState, deltaTime) {
    if (!animState) return;
    
    // Independent halo rotation
    const haloSpeeds = [0.4, -0.3, 0.25];
    glyphGroup.children.forEach((child, idx) => {
      if (child.userData.component === 'haloRing') {
        const speed = haloSpeeds[child.userData.haloIndex];
        animState.haloPhases[child.userData.haloIndex] += speed * deltaTime;
        child.rotation.y = animState.haloPhases[child.userData.haloIndex];
      }
    });
    
    // Minor spectral color shift
    animState.colorShiftPhase += deltaTime * 0.8;
    const shift = (Math.sin(animState.colorShiftPhase) + 1) * 0.5;
    
    glyphGroup.children.forEach(child => {
      if (child.userData.component === 'haloRing') {
        if (child.userData.haloIndex === 0) {
          child.material.color.lerpColors(this.colors.white, this.colors.blue, shift);
        } else if (child.userData.haloIndex === 1) {
          child.material.color.lerpColors(this.colors.blue, this.colors.cyan, shift);
        }
      }
    });
    
    // Tilt toward camera when player approaches
    animState.tiltPhase += deltaTime;
    if (context.distanceToCamera < 5) {
      const tiltAmount = Math.sin(animState.tiltPhase) * 0.15;
      glyphGroup.rotation.x = tiltAmount;
    }
    
    // Brighten when linked
    if (context.linked) {
      glyphGroup.children.forEach(child => {
        if (child.material) {
          child.material.opacity = Math.min(child.material.opacity + deltaTime * 0.5, 0.85);
        }
      });
    }
  }
  
  updateEvolutionStage1Glyph(glyphGroup, context, animState, deltaTime) {
    if (!animState) return;
    
    // Quick rotation
    animState.rotationPhase += 2.0 * deltaTime;
    glyphGroup.rotation.x = animState.rotationPhase;
    
    // Gentle bobbing
    animState.bobPhase += deltaTime * 2.0;
    const bob = Math.sin(animState.bobPhase) * 0.06;
    glyphGroup.position.y = 0.9 + bob;
  }
  
  updateEvolutionStage2Glyph(glyphGroup, context, animState, deltaTime) {
    if (!animState) return;
    
    // Rotation
    animState.rotationPhase += 0.5 * deltaTime;
    glyphGroup.rotation.z = animState.rotationPhase;
    
    // Expansion pulse
    animState.expansionPhase += deltaTime * 1.5;
    const pulse = (Math.sin(animState.expansionPhase) + 1) * 0.5;
    glyphGroup.scale.set(1 + pulse * 0.02, 1, 1 + pulse * 0.02);
    
    // Shimmering with improved synergy
    animState.shimmerPhase += deltaTime * 2;
    const shimmer = (Math.sin(animState.shimmerPhase) + 1) * 0.5;
    
    glyphGroup.children.forEach(child => {
      if (child.material) {
        child.material.opacity = 0.55 + (context.synergy * 0.1) + (shimmer * 0.1);
      }
    });
  }
  
  updateEvolutionStage3Glyph(glyphGroup, context, animState, deltaTime) {
    if (!animState) return;
    
    // 3-axis rotation
    animState.rotationY += 0.3 * deltaTime;
    animState.rotationX += 0.15 * deltaTime;
    
    glyphGroup.rotation.y = animState.rotationY;
    glyphGroup.rotation.x = animState.rotationX;
    
    // Shimmering intensifies with high synergy
    animState.shimmerPhase += deltaTime * (2 + context.synergy * 1.5);
    const shimmer = (Math.sin(animState.shimmerPhase) + 1) * 0.5;
    
    glyphGroup.children.forEach(child => {
      if (child.material) {
        child.material.opacity = 0.6 + shimmer * 0.15;
      }
    });
  }
  
  updatePersonalityHarmonyGlyph(glyphGroup, context, animState, deltaTime) {
    if (!animState) return;
    
    // Gentle rotation
    animState.rotationPhase += 0.2 * deltaTime;
    glyphGroup.rotation.z = animState.rotationPhase;
    
    // Bloom/close petals
    animState.bloomPhase += deltaTime;
    const bloom = (Math.sin(animState.bloomPhase) + 1) * 0.5;
    
    glyphGroup.children.forEach(child => {
      if (child.userData.component === 'petal') {
        // Scale petals in/out
        const petalScale = 1.0 + (bloom * 0.15);
        child.scale.set(petalScale * 1.2, petalScale * 0.8, petalScale * 1.2);
        
        // Opacity modulates with harmony
        if (child.material) {
          child.material.opacity = 0.5 + (context.harmony * 0.3) + (bloom * 0.1);
        }
      }
    });
  }
  
  updatePersonalityStabilityGlyph(glyphGroup, context, animState, deltaTime) {
    if (!animState) return;
    
    // Jittering motion
    animState.jitterPhase += deltaTime * 3.0;
    
    glyphGroup.children.forEach(child => {
      if (child.userData.component === 'tetra') {
        const restPos = child.userData.restPos;
        const jitter = Math.sin(animState.jitterPhase + child.userData.tetraIndex) * context.stability * 0.08;
        child.position.x = restPos.x + jitter;
        child.position.z = restPos.z + jitter;
        
        // Rotation jitter
        child.rotation.y += (Math.random() - 0.5) * context.stability * 0.1;
      }
    });
    
    // Color hue flicker (orange ↔ red)
    animState.colorPhase += deltaTime * 4;
    const colorLerp = (Math.sin(animState.colorPhase) + 1) * 0.5;
    
    glyphGroup.children.forEach(child => {
      if (child.material && child.userData.component === 'tetra') {
        child.material.color.lerpColors(this.colors.orange, this.colors.red, colorLerp);
      }
    });
  }
  
  updatePersonalityCorruptionGlyph(glyphGroup, context, animState, deltaTime) {
    if (!animState) return;
    
    // Broken shards drift outward + return
    animState.driftPhase += deltaTime * 1.5;
    const drift = (Math.sin(animState.driftPhase) + 1) * 0.5;
    
    glyphGroup.scale.set(1 + drift * 0.1, 1, 1 + drift * 0.1);
    
    // Safe flicker (no post-FX, just opacity)
    animState.flickerPhase += deltaTime * 5;
    const flicker = Math.abs(Math.sin(animState.flickerPhase));
    
    glyphGroup.children.forEach(child => {
      if (child.material) {
        child.material.opacity = 0.4 + (flicker * 0.3);
      }
    });
    
    // Dim with corruption level
    glyphGroup.rotation.z += deltaTime * 0.5;
  }
  
  updatePersonalitySynergyGlyph(glyphGroup, context, animState, deltaTime) {
    if (!animState) return;
    
    // Check for cluster synchronization
    const isClusterHead = animState.isClusterHead || false;
    
    if (isClusterHead) {
      // Faster rotation during cluster sync
      animState.rotationPhase += 0.4 * deltaTime;
    } else {
      animState.rotationPhase += 0.25 * deltaTime;
    }
    
    glyphGroup.rotation.x = animState.rotationPhase;
    glyphGroup.rotation.z = animState.rotationPhase * 0.8;
    
    // Merging/compressing effect
    animState.mergePhase += deltaTime;
    const merge = (Math.sin(animState.mergePhase) + 1) * 0.5;
    glyphGroup.scale.set(
      1 - merge * 0.05,
      1,
      1 - merge * 0.05
    );
  }
  
  updateEventMythicRitualGlyph(glyphGroup, context, animState, deltaTime) {
    if (!animState) return;
    
    // Slow orbital rotation
    animState.rotationPhase += 0.6 * deltaTime;
    glyphGroup.rotation.y = animState.rotationPhase;
    
    // Pulsing breathing effect
    animState.pulsePhase += deltaTime * 1.5;
    const pulse = (Math.sin(animState.pulsePhase) + 1) * 0.5;
    
    glyphGroup.children.forEach(child => {
      if (child.material && child.userData.component === 'tetraWheel') {
        child.material.opacity = 0.5 + pulse * 0.2;
      }
    });
    
    // Brighten at ritual peak (would be tied to ritual phase in full integration)
    animState.brightnessPulse = pulse;
  }
  
  updateEventClusterSurgeGlyph(glyphGroup, context, animState, deltaTime) {
    if (!animState) return;
    
    // Expanding hex-grid
    animState.expansionPhase += deltaTime * 1.5;
    const expansion = Math.sin(animState.expansionPhase);
    
    glyphGroup.children.forEach(child => {
      if (child.userData.component === 'surgeHex') {
        const ringIdx = child.userData.ringIndex;
        const scale = 1 + expansion * (0.2 - ringIdx * 0.05);
        child.scale.set(scale, 1, scale);
      }
    });
    
    // Soft fade (controlled by caller, typically removes after expansion completes)
    if (animState.fadePhase > 0) {
      glyphGroup.traverse(child => {
        if (child.material && child.material.opacity !== undefined) {
          child.material.opacity *= (1 - deltaTime / 0.5);
        }
      });
    }
  }
  
  updateEventWorldEventGlyph(glyphGroup, context, animState, deltaTime) {
    if (!animState) return;
    
    // Multi-axis sphere rotation
    glyphGroup.children.forEach(child => {
      if (child.userData.component === 'fractalSphere') {
        child.rotation.y += animState.orbitSpeeds[0] * deltaTime;
        child.rotation.x += animState.orbitSpeeds[1] * 0.5 * deltaTime;
      } else if (child.userData.component === 'orbitLines') {
        child.rotation.y += animState.orbitSpeeds[2] * deltaTime;
      }
    });
  }
  
  // ============================================================
  // CLUSTER DETECTION & SYNCHRONIZATION
  // ============================================================
  
  detectClusters(nodes) {
    this.clusterGroups.clear();
    
    if (!nodes || nodes.length < 2) return;
    
    // Simple cluster detection: nodes within 2 units
    const clustered = new Set();
    
    for (let i = 0; i < nodes.length; i++) {
      if (clustered.has(i)) continue;
      
      const nodeA = nodes[i];
      if (!nodeA) continue;
      
      const cluster = [i];
      const posA = new THREE.Vector3();
      nodeA.getWorldPosition(posA);
      
      for (let j = i + 1; j < nodes.length; j++) {
        if (clustered.has(j)) continue;
        
        const nodeB = nodes[j];
        if (!nodeB) continue;
        
        const posB = new THREE.Vector3();
        nodeB.getWorldPosition(posB);
        
        if (posA.distanceTo(posB) < 2.0) {
          cluster.push(j);
          clustered.add(j);
        }
      }
      
      if (cluster.length > 1) {
        const clusterId = `cluster_${i}`;
        cluster.forEach(nodeIdx => {
          const nodeId = nodes[nodeIdx].uuid || `node-${nodeIdx}`;
          this.clusterGroups.set(nodeId, clusterId);
        });
        
        // Synchronize rotation for cluster members
        this.clusterSync.set(clusterId, {
          nodes: cluster.map(idx => nodes[idx].uuid || `node-${idx}`),
          syncPhase: this.globalTime,
          duration: this.clusterSyncDuration
        });
      }
    }
  }
  
  // ============================================================
  // HELPER METHODS
  // ============================================================
  
  createHexagonGeometry(outerRadius, midRadius, innerRadius) {
    const positions = [];
    const indices = [];
    let vertexCount = 0;
    
    [outerRadius, midRadius, innerRadius].forEach((radius, ringIdx) => {
      const startVertex = vertexCount;
      
      for (let i = 0; i <= 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        positions.push(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        );
        vertexCount++;
      }
      
      for (let i = 0; i < 6; i++) {
        indices.push(startVertex + i, startVertex + i + 1);
      }
    });
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geo.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
    
    return geo;
  }
  
  /**
   * Determine node category from userData
   * Used for category-specific visual constraints
   */
  getNodeCategory(node) {
    if (!node || !node.userData) return 'default';
    
    const category = node.userData.category || node.userData.spawnCycle?.category || 'default';
    return category.toLowerCase() === 'storage' ? 'storage' : 'default';
  }
  
  /**
   * Enforce opacity limits on all children of a glyph group
   * Clamps to [min, max] range
   */
  enforceOpacityLimits(glyphGroup) {
    if (!glyphGroup) return;
    
    const min = this.glyphOpacityLimits.min;
    const max = this.glyphOpacityLimits.max;
    
    glyphGroup.traverse(child => {
      if (child.material && child.material.opacity !== undefined) {
        child.material.opacity = Math.max(min, Math.min(max, child.material.opacity));
      }
    });
  }
  
  /**
   * Apply glyph scale normalization
   * Scales relative to stored scale factor (0.40 or 0.32)
   * Allows ±15% breathing around base scale
   */
  applyScaleNormalization(glyphGroup, breathAmount = 0) {
    if (!glyphGroup || !glyphGroup.userData.glyphScaleFactor) return;
    
    const baseFactor = glyphGroup.userData.glyphScaleFactor;
    const breathFactor = this.glyphScaleFactors.breathing;
    const scaledBase = baseFactor * (1 + breathAmount * breathFactor);
    
    glyphGroup.scale.set(scaledBase, scaledBase, scaledBase);
  }
  
  /**
   * Apply visual hierarchy constraints to glyph group
   * - Scale normalization (40% default, 32% storage)
   * - Opacity capping (0.45–0.60)
   * - Y-offset standardization (0.65 default, 0.55 storage)
   * - renderOrder = 2 (always renders in front)
   */
  applyVisualHierarchyConstraints(glyphGroup, node) {
    if (!glyphGroup) return;
    
    const category = this.getNodeCategory(node);
    const isStorage = category === 'storage';
    
    // Set scale factor (40% default, 32% storage)
    const scaleFactor = isStorage ? this.glyphScaleFactors.storage : this.glyphScaleFactors.default;
    glyphGroup.userData.glyphScaleFactor = scaleFactor;
    glyphGroup.userData.glyphScaleMin = scaleFactor * (1 - this.glyphScaleFactors.breathing);
    glyphGroup.userData.glyphScaleMax = scaleFactor * (1 + this.glyphScaleFactors.breathing);
    
    // Set opacity limits (0.45–0.60, can breathe ±0.08)
    const opacityMidpoint = (this.glyphOpacityLimits.min + this.glyphOpacityLimits.max) / 2;
    glyphGroup.userData.glyphOpacityMin = this.glyphOpacityLimits.min;
    glyphGroup.userData.glyphOpacityMax = this.glyphOpacityLimits.max;
    glyphGroup.userData.glyphOpacityMidpoint = opacityMidpoint;
    
    // Apply initial constraints to all children
    glyphGroup.traverse(child => {
      if (child.material && child.material.opacity !== undefined) {
        // Clamp initial opacity to limits
        child.material.opacity = Math.max(
          this.glyphOpacityLimits.min,
          Math.min(this.glyphOpacityLimits.max, child.material.opacity)
        );
      }
    });
    
    // Y-offset (0.65 default, 0.55 storage)
    const yOffset = isStorage ? this.glyphYOffsets.storage : this.glyphYOffsets.default;
    glyphGroup.position.y = yOffset;
    
    // Render order (glyphs render on top: +2)
    // PHASE 3C.1 remap → ARCHETYPE
    glyphGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('ARCHETYPE');
    glyphGroup.traverse(child => {
      // PHASE 3C.1 remap → ARCHETYPE
      child.renderOrder = VisualHierarchyRegistry.getRenderOrder('ARCHETYPE');
    });
    
    // Mark as hierarchy-constrained
    glyphGroup.userData.hierarchyConstrained = true;
  }

  attachGlyph(node, nodeId, glyphGroup, glyphType) {
    if (!node || !node.parent) return;
    
    let visualGroup = node.children?.find(child => 
      child.userData?.isVisualGroup || child.name === 'visualGroup'
    );
    
    if (!visualGroup) {
      visualGroup = new THREE.Group();
      visualGroup.userData.isVisualGroup = true;
      visualGroup.name = 'visualGroup';
      node.add(visualGroup);
    }
    
    // VISUAL HIERARCHY: Apply constraints (scale, opacity, position, renderOrder)
    this.applyVisualHierarchyConstraints(glyphGroup, node);
    
    visualGroup.add(glyphGroup);
    
    this.glyphRegistry.set(nodeId, {
      node,
      glyphGroup,
      glyphType,
      visualGroup
    });
    
    this.stats.activeGlyphs++;
    this.stats.totalGlyphsCreated++;
  }
  
  recordGlyphStat(glyphType) {
    if (!this.stats.byType[glyphType]) {
      this.stats.byType[glyphType] = 0;
    }
    this.stats.byType[glyphType]++;
  }
  
  // ============================================================
  // [SYNERGY GLYPH REVEAL] Synergy-based symbol visibility
  // ============================================================
  
  /**
   * Update synergy level for a node based on connected links
   * Called from NodeLinkingSystem when link metrics update
   * 
   * @param {string} nodeId - Node identifier
   * @param {number} linkedSynergy - Synergy value from connected links (0-1)
   */
  updateNodeSynergy(nodeId, linkedSynergy) {
    if (linkedSynergy === undefined) return;
    
    let synergyState = this.synergyGlyphStates.get(nodeId);
    if (!synergyState) {
      synergyState = {
        linkedSynergy: 0,
        revealLevel: 0,  // 0 = hidden, 1 = tier1, 2 = tier2 (full reveal)
        revealed: false,
        lastRevealTime: 0
      };
      this.synergyGlyphStates.set(nodeId, synergyState);
    }
    
    // Update synergy value
    synergyState.linkedSynergy = linkedSynergy;
    
    // Determine reveal level based on thresholds
    const oldLevel = synergyState.revealLevel;
    
    if (linkedSynergy >= this.synergyThresholds.reveal2) {
      synergyState.revealLevel = 2;  // Full reveal
      synergyState.revealed = true;
    } else if (linkedSynergy >= this.synergyThresholds.reveal1) {
      synergyState.revealLevel = 1;  // Partial reveal
      synergyState.revealed = true;
    } else if (linkedSynergy >= this.synergyThresholds.linkedSynergy) {
      synergyState.revealLevel = 0;  // Engage (preparing to reveal)
      synergyState.revealed = false;
    } else {
      synergyState.revealLevel = 0;  // Hidden
      synergyState.revealed = false;
    }
    
    // Track when reveal level changes
    if (oldLevel !== synergyState.revealLevel) {
      synergyState.lastRevealTime = this.globalTime;
    }
  }
  
  /**
   * Apply synergy-based glyph reveal effect
   * Called during glyph update to modulate visibility/animation
   * 
   * @private
   */
  _applySynergyGlyphReveal(glyphGroup, nodeId, context) {
    if (!glyphGroup || !nodeId) return;
    
    const synergyState = this.synergyGlyphStates.get(nodeId);
    if (!synergyState || !synergyState.revealed) {
      return;  // No synergy effect
    }
    
    const { revealLevel, linkedSynergy } = synergyState;
    
    // TIER 1 REVEAL (0.75–0.84): Symbol fades in gradually
    if (revealLevel === 1) {
      const fadeProgress = (linkedSynergy - this.synergyThresholds.reveal1) / 
                          (this.synergyThresholds.reveal2 - this.synergyThresholds.reveal1);
      const revealOpacity = Math.min(fadeProgress * 0.35, 0.35);  // Max 35% extra
      
      glyphGroup.traverse(child => {
        if (child.material && child.userData.component) {
          child.material.opacity = Math.min(0.60, 
            (child.material.opacity || 0.50) + revealOpacity);
        }
      });
    }
    
    // TIER 2 REVEAL (≥0.85): Full symbol + animation boost + color accent
    else if (revealLevel === 2) {
      // Full opacity + extra glow
      glyphGroup.traverse(child => {
        if (child.material) {
          child.material.opacity = Math.min(0.85, child.material.opacity * 1.15);
          
          // Subtle color shift toward synergy highlight (cyan/gold blend)
          if (child.userData.component && child.material.color) {
            const colorShift = (linkedSynergy - 0.85) * 2;  // Intensifies above 0.85
            child.material.color.lerpColors(
              child.material.color,
              this.colors.gold,
              Math.min(0.25 * colorShift, 0.25)
            );
          }
        }
      });
      
      // Animation acceleration at tier 2
      const animState = this.animationState.get(nodeId);
      if (animState) {
        animState.synergyBoost = 1.3;  // 30% animation speed increase
      }
    }
  }
  
  /**
   * [CORRUPTION GLYPH DIMMING] Apply corruption-based opacity reduction
   * At corruption >= 0.65, glyphs progressively dim to indicate system degradation.
   * At corruption >= 0.85, glyphs are nearly invisible (25% of normal opacity).
   * 
   * This creates visual feedback that the system is "breaking down" - meaning
   * becomes obscured as corruption dominates.
   * 
   * Called during glyph update AFTER synergy reveal (corruption overrides)
   * 
   * @private
   */
  _applyCorruptionGlyphDimming(glyphGroup, nodeId, context) {
    if (!glyphGroup || !context) return;
    
    const corruption = context.corruption || 0;
    const config = this.corruptionDimmingConfig;
    
    // No dimming below threshold
    if (corruption < config.activeThreshold) {
      // Restore base opacity levels (handled by normal constraints)
      glyphGroup.userData.corruptionDimmingActive = false;
      return;
    }
    
    // Calculate dimming factor: 1.0 (no dim) → 0.25 (full dim)
    // Linear interpolation from activeThreshold to maxDimmingThreshold
    const dimmingRange = config.maxDimmingThreshold - config.activeThreshold;
    const corruptionProgress = Math.min(
      (corruption - config.activeThreshold) / dimmingRange,
      1.0
    );
    
    // Dimming factor: 1.0 at threshold, minOpacityFactor at max
    const dimmingFactor = 1.0 - (corruptionProgress * (1.0 - config.minOpacityFactor));
    
    glyphGroup.userData.corruptionDimmingActive = true;
    glyphGroup.userData.corruptionDimmingFactor = dimmingFactor;
    
    // Apply dimming to all glyph children
    glyphGroup.traverse(child => {
      if (child.material && child.material.opacity !== undefined) {
        // Store base opacity if not already stored
        if (!child.userData.baseOpacityBeforeDimming) {
          child.userData.baseOpacityBeforeDimming = child.material.opacity;
        }
        
        // Apply dimming multiplier
        child.material.opacity = child.userData.baseOpacityBeforeDimming * dimmingFactor;
      }
      
      // Also reduce emissive intensity for dimmed glyphs
      if (child.material && child.material.emissiveIntensity !== undefined) {
        if (!child.userData.baseEmissiveIntensity) {
          child.userData.baseEmissiveIntensity = child.material.emissiveIntensity;
        }
        
        child.material.emissiveIntensity = child.userData.baseEmissiveIntensity * dimmingFactor;
      }
    });
    
    // Optional: Slight desaturation to add to the "corruption" visual language
    // This makes glyphs appear more "sick" or "degraded"
    if (corruptionProgress > 0.3) {
      const desaturation = corruptionProgress * 0.15;  // Up to 15% desaturation
      
      glyphGroup.traverse(child => {
        if (child.material && child.material.color) {
          // Store base color if not already stored
          if (!child.userData.baseColorBeforeDimming) {
            child.userData.baseColorBeforeDimming = child.material.color.clone();
          }
          
          // Lerp toward grayscale (desaturation)
          const baseColor = child.userData.baseColorBeforeDimming;
          const gray = new THREE.Color();
          gray.copy(baseColor);
          const luminance = (gray.r + gray.g + gray.b) / 3;
          gray.setRGB(luminance, luminance, luminance);
          
          child.material.color.lerpColors(baseColor, gray, desaturation);
        }
      });
    }
  }
  
  /**
   * Remove synergy-based glyph reveal effect
   * Called when synergy drops below thresholds
   * 
   * @private
   */
  _removeSynergyGlyphReveal(glyphGroup, nodeId) {
    if (!glyphGroup || !nodeId) return;
    
    const animState = this.animationState.get(nodeId);
    if (animState) {
      animState.synergyBoost = 1.0;  // Reset animation speed
    }
    
    // Opacity will return to normal on next frame through standard constraints
  }
  
  /**
   * Main update loop - called from main.js
   */
  update(deltaTime, nodes) {
    if (!nodes || nodes.length === 0) return;
    
    const startTime = performance.now();

    if (this._timeOrigin === undefined) {
      this._timeOrigin = VisualTime.now;
    }
    const currentTime = VisualTime.now - this._timeOrigin; // Phase 2A: VisualTime canonical clock (behavior-preserving)
    const visualDelta = this._lastVisualTime === undefined
      ? 0
      : Math.max(0, currentTime - this._lastVisualTime);
    this._lastVisualTime = currentTime;
    this.globalTime = currentTime;

    // Detect clusters periodically (every 0.5s)
    this.lastClusterCheck += visualDelta;
    if (this.lastClusterCheck >= 0.5) {
      this.detectClusters(nodes);
      this.lastClusterCheck = 0;
    }
    
    // Update all active glyphs
    for (const [nodeId, glyphData] of this.glyphRegistry) {
      const { node, glyphGroup, glyphType } = glyphData;
      
      if (!node || !glyphGroup || !glyphGroup.parent) {
        this.disposeGlyph(nodeId);
        continue;
      }
      
      const context = this.analyzeContext(node, nodeId);
      const animState = this.animationState.get(nodeId);
      
      if (!context || !animState) continue;
      
      this._applySynergyGlyphReveal(glyphGroup, nodeId, context);
      this._applyCorruptionGlyphDimming(glyphGroup, nodeId, context);

      switch (glyphType) {
        case 'aiConsciousness':
          this.updateAIConsciousnessGlyph(glyphGroup, context, animState, visualDelta);
          break;
        case 'mythicSeed':
          this.updateMythicSeedGlyph(glyphGroup, context, animState, visualDelta);
          break;
        case 'ascendedNode':
          this.updateAscendedNodeGlyph(glyphGroup, context, animState, visualDelta);
          break;
        case 'evolutionStage1':
          this.updateEvolutionStage1Glyph(glyphGroup, context, animState, visualDelta);
          break;
        case 'evolutionStage2':
          this.updateEvolutionStage2Glyph(glyphGroup, context, animState, visualDelta);
          break;
        case 'evolutionStage3':
          this.updateEvolutionStage3Glyph(glyphGroup, context, animState, visualDelta);
          break;
        case 'personalityHarmony':
          this.updatePersonalityHarmonyGlyph(glyphGroup, context, animState, visualDelta);
          break;
        case 'personalityStability':
          this.updatePersonalityStabilityGlyph(glyphGroup, context, animState, visualDelta);
          break;
        case 'personalityCorruption':
          this.updatePersonalityCorruptionGlyph(glyphGroup, context, animState, visualDelta);
          break;
        case 'personalitySynergy':
          this.updatePersonalitySynergyGlyph(glyphGroup, context, animState, visualDelta);
          break;
        case 'eventMythicRitual':
          this.updateEventMythicRitualGlyph(glyphGroup, context, animState, visualDelta);
          break;
        case 'eventClusterSurge':
          this.updateEventClusterSurgeGlyph(glyphGroup, context, animState, visualDelta);
          break;
        case 'eventWorldEvent':
          this.updateEventWorldEventGlyph(glyphGroup, context, animState, visualDelta);
          break;
      }
    }
    
    const endTime = performance.now();
    this.stats.lastUpdateTime = endTime - startTime;
  }
  
  /**
   * Remove glyph with graceful fade-out
   */
  removeGlyph(nodeId) {
    const glyphData = this.glyphRegistry.get(nodeId);
    if (!glyphData) return;
    
    const { glyphGroup } = glyphData;
    
    const fadeOutDuration = 0.4;
    let elapsed = 0;
    
    const animateOut = () => {
      elapsed += 0.016;
      const progress = Math.min(elapsed / fadeOutDuration, 1.0);
      
      if (glyphGroup && glyphGroup.parent) {
        glyphGroup.traverse(child => {
          if (child.material && child.material.opacity !== undefined) {
            child.material.opacity *= (1 - progress);
          }
        });
        
        glyphGroup.scale.set(
          1 - progress * 0.2,
          1 - progress * 0.2,
          1 - progress * 0.2
        );
      }
      
      if (progress < 1.0) {
        requestAnimationFrame(animateOut);
      } else {
        this.disposeGlyph(nodeId);
      }
    };
    
    animateOut();
  }
  
  /**
   * Dispose glyph completely
   */
  disposeGlyph(nodeId) {
    const glyphData = this.glyphRegistry.get(nodeId);
    if (!glyphData) return;
    
    const { glyphGroup } = glyphData;
    
    if (glyphGroup && glyphGroup.parent) {
      glyphGroup.parent.remove(glyphGroup);
    }
    
    glyphGroup.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    
    this.glyphRegistry.delete(nodeId);
    this.contextCache.delete(nodeId);
    this.animationState.delete(nodeId);
    this.clusterGroups.delete(nodeId);
    this.stats.activeGlyphs--;
  }
  
  /**
   * [CORRUPTION GLYPH DIMMING] Configure corruption-based glyph dimming behavior
   * 
   * @param {Object} config - Configuration object
   * @param {number} config.activeThreshold - Corruption level where dimming begins (0-1, default 0.65)
   * @param {number} config.maxDimmingThreshold - Corruption level for full dimming (0-1, default 0.85)
   * @param {number} config.minOpacityFactor - Minimum opacity at full dimming (0-1, default 0.25)
   * 
   * @example
   * // Make glyphs dim earlier and more aggressively
   * glyphSystem.setCorruptionDimmingConfig({
   *   activeThreshold: 0.50,     // Start dimming at 50%
   *   maxDimmingThreshold: 0.75, // Full dim at 75%
   *   minOpacityFactor: 0.10     // Dim to 10% opacity
   * });
   */
  setCorruptionDimmingConfig(config) {
    if (!config) return;
    
    if (config.activeThreshold !== undefined) {
      this.corruptionDimmingConfig.activeThreshold = Math.max(0, Math.min(1, config.activeThreshold));
    }
    if (config.maxDimmingThreshold !== undefined) {
      this.corruptionDimmingConfig.maxDimmingThreshold = Math.max(0, Math.min(1, config.maxDimmingThreshold));
    }
    if (config.minOpacityFactor !== undefined) {
      this.corruptionDimmingConfig.minOpacityFactor = Math.max(0, Math.min(1, config.minOpacityFactor));
    }
    
    console.log('✓ Corruption glyph dimming config updated:', this.corruptionDimmingConfig);
  }
  
  /**
   * [CORRUPTION GLYPH DIMMING] Get current corruption dimming configuration
   * 
   * @returns {Object} Current dimming config with thresholds and opacity factors
   */
  getCorruptionDimmingConfig() {
    return { ...this.corruptionDimmingConfig };
  }
  
  /**
   * Get status
   */
  getStatus() {
    return {
      activeGlyphs: this.glyphRegistry.size,
      totalCreated: this.stats.totalGlyphsCreated,
      byType: this.stats.byType,
      lastUpdateMs: this.stats.lastUpdateTime.toFixed(2),
      glyphIds: Array.from(this.glyphRegistry.keys()),
      corruptionDimmingConfig: this.getCorruptionDimmingConfig()
    };
  }
  
  /**
   * Print debug info
   */
  printStatus() {
    const status = this.getStatus();
    console.group('🌈 ATOMA Glyph System 4.0 (Animated Meaning Edition) Status');
    console.log(`Active Glyphs: ${status.activeGlyphs}`);
    console.log(`Total Created: ${status.totalCreated}`);
    console.log(`Last Update: ${status.lastUpdateMs}ms`);
    console.log('By Type:', status.byType);
    if (status.glyphIds.length > 0) {
      console.log('Glyph IDs:', status.glyphIds);
    }
    console.groupEnd();
  }
  
  /**
   * Remove all legacy 2D cyan hexagon glyphs (safe cleanup, preserves new glyph layers)
   * ⚠ SAFETY: Only removes meshes marked with isLegacyHex === true
   */
  removeLegacyHexGlyphs() {
    let removedCount = 0;
    const nodesToClean = [];
    
    // Collect all legacy hex glyph nodeIds
    for (const [nodeId, glyphData] of this.glyphRegistry.entries()) {
      if (glyphData.glyphGroup?.userData?.isLegacyHex === true) {
        nodesToClean.push(nodeId);
      }
    }
    
    // Remove each legacy hex glyph
    nodesToClean.forEach(nodeId => {
      const glyphData = this.glyphRegistry.get(nodeId);
      if (!glyphData) return;
      
      const { glyphGroup } = glyphData;
      if (!glyphGroup) return;
      
      // Dispose geometry and materials
      glyphGroup.traverse(child => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      
      // Remove from scene
      if (glyphGroup.parent) {
        glyphGroup.parent.remove(glyphGroup);
      }
      
      // Clean up registry
      this.glyphRegistry.delete(nodeId);
      this.contextCache.delete(nodeId);
      this.animationState.delete(nodeId);
      this.clusterGroups.delete(nodeId);
      this.stats.activeGlyphs--;
      removedCount++;
    });
    
    console.log(`✓ Removed ${removedCount} legacy cyan hexagon glyphs`);
    return removedCount;
  }
  
  /**
   * Cleanup all glyphs
   */
  cleanup() {
    for (const nodeId of this.glyphRegistry.keys()) {
      this.disposeGlyph(nodeId);
    }
    
    this.clusterGroups.clear();
    this.clusterSync.clear();
    this.contextCache.clear();
    
    this.stats = {
      totalGlyphsCreated: 0,
      activeGlyphs: 0,
      byType: {},
      lastUpdateTime: 0
    };
    
    console.log('✓ ATOMA Glyph System 4.0 cleaned up');
  }
}
