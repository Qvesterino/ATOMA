/**
 * ATOMA GLYPH LAYER 4.0 - MULTI-GLYPH FUSION (SAFE EDITION)
 * 
 * Advanced multi-layer glyph rendering system that combines multiple symbolic glyphs per node:
 * 1) Core Glyph (node category)
 * 2) Evolution Glyph (stage 1-3)
 * 3) Personality Glyph (synergy/harmony/stability/corruption/clarity)
 * 4) State Glyph (consciousness/ascended/mythic/ritual/cluster)
 * 
 * STRICT SAFETY:
 * - No physics/movement modifications
 * - No node lifecycle changes
 * - No volumetrics or heavy shaders
 * - <0.5ms GPU cost for 50+ nodes
 * - All glyphs are child objects (non-destructive)
 * - NO recursion, NO runtime regeneration
 * 
 * PERFORMANCE:
 * - Shared geometry pools (no per-frame creation)
 * - Local transforms only (no world-space)
 * - <0.5ms overhead per frame
 * - Full batching support
 */

import * as THREE from 'three';

import VisualTime from './src/time/VisualTime.js';

const GLYPH_RENDER_ORDER = 15;
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

export class GlyphLayer4_MultiFusion {
  constructor(scene, enforcementGate = null, resonanceFeedback = null) {
    this.scene = scene;
    this.enforcementGate = enforcementGate;  // Optional enforcement gate
    this.resonanceFeedback = resonanceFeedback;  // Optional resonance feedback system

    // Normalize enforcement gate (defensive: sometimes worldRoot is passed)
    if (this.enforcementGate && typeof this.enforcementGate.canAttach !== 'function') {
      console.warn('[GlyphLayer4] Invalid enforcementGate, disabling gate', this.enforcementGate);
      this.enforcementGate = null;
    }
    
    // Master fusion container
    this.fusionContainer = new THREE.Group();
    this.fusionContainer.userData.isGlyphLayer4 = true;
    this.fusionContainer.name = 'GlyphLayer4_MultiFusion';
    this.fusionContainer.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');  // Render after core/archetype (0/1), before links (200+)
    this.scene.add(this.fusionContainer);
    
    // Registry: nodeId → { node, layers: { core, evolution, personality, state } }
    this.fusionRegistry = new Map();
    this.ambientOrbitRegistry = new Map();
    
    // Geometry pools (reusable, no per-frame creation)
    this.geometryPools = {
      coreGlyphs: new Map(),      // category → geometry
      evolutionGlyphs: new Map(), // stage → geometry
      personalityGlyphs: new Map(), // type → geometry
      stateGlyphs: new Map()      // type → geometry
    };
    
    // Material pools (reusable)
    this.materialPools = new Map();
    
    // Animation state per node
    this.animationState = new Map();  // nodeId → { rotationPhase, pulsePhase, etc }
    
    // Statistics
    this.stats = {
      totalFusions: 0,
      activeFusions: 0,
      byLayer: {
        core: 0,
        evolution: 0,
        personality: 0,
        state: 0
      }
    };
    this._glyphTimeOrigin = undefined;
    this._lastVisualTime = undefined;
    
    // ATOMA color palette
    this.colors = {
      cyan: 0x00F2FF,
      mint: 0x84FFE6,
      magenta: 0xFF00FF,
      violet: 0x9933FF,
      gold: 0xFFD700,
      white: 0xFFFFFF,
      blue: 0x0099FF,
      green: 0x00FF88,
      red: 0xFF3333,
      dark: 0x0a0a14,
      orange: 0xFF8800,
      pink: 0xFF66FF
    };
    
    // Personality metrics (0-1 range)
    this.personalityMetrics = {
      synergy: 0.5,
      harmony: 0.5,
      stability: 0.5,
      corruption: 0.5,
      clarity: 0.5
    };
    
    // Feature flags
    this.enabled = true;
    this.debugMode = false;
    this.hoverOnlyMode = true;
    this.ambientOrbitEnabled = false;
    this.hoverNodeId = null;
    
    console.log('✓ ATOMA Glyph Layer 4.0 - Multi-Glyph Fusion initialized');
  }
  
  // ============================================================
  // LAYER 1: CORE GLYPH (Category-Based)
  // ============================================================
  
  createCoreGlyph(node, nodeId) {
    // Core glyph intentionally disabled:
    // keep node centers clean; hover glyph pipeline remains active via SemanticGlyphAI.
    return null;
  }
  
  updateCoreGlyph(coreGroup, deltaTime) {
    if (!coreGroup) return;
    
    // Gentle rotation
    coreGroup.rotation.y += coreGroup.userData.rotationSpeed * deltaTime;
    coreGroup.rotation.x += coreGroup.userData.rotationSpeed * 0.3 * deltaTime;
    
    // Subtle bob
    coreGroup.userData.bobPhase += deltaTime * 2;
    const bob = Math.sin(coreGroup.userData.bobPhase) * 0.02;
    coreGroup.position.y = 0.08 + bob;
  }
  
  // ============================================================
  // LAYER 2: EVOLUTION GLYPH (Stage 1-3)
  // ============================================================
  
  createEvolutionGlyph(node, nodeId) {
    const stage = this.resolveEvolutionStage(node);
    if (stage < 1 || stage > 3) return null;
    
    const evoGroup = new THREE.Group();
    evoGroup.userData = {
      glyphLayer: 'evolution',
      stage,
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    evoGroup.name = `glyph_evo_${nodeId}`;
    evoGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');  // Render after core/archetype, before links
    
    // Stage-specific visuals
    if (stage === 1) {
      const impossibleGlyph = this.createFoldedImpossibleGlyph();
      impossibleGlyph.userData = { glyphComponent: 'evoFoldedImpossible' };
      evoGroup.add(impossibleGlyph);
      evoGroup.userData.rotationSpeed = 0.6;
      
    } else if (stage === 2) {
      // Squares (nested wireframe)
      const geometry = new THREE.BufferGeometry();
      const positions = [
        // Outer square
        -0.15, 0, -0.15,  0.15, 0, -0.15,
        0.15, 0, -0.15,   0.15, 0, 0.15,
        0.15, 0, 0.15,    -0.15, 0, 0.15,
        -0.15, 0, 0.15,   -0.15, 0, -0.15,
        // Inner square
        -0.08, 0, -0.08,  0.08, 0, -0.08,
        0.08, 0, -0.08,   0.08, 0, 0.08,
        0.08, 0, 0.08,    -0.08, 0, 0.08,
        -0.08, 0, 0.08,   -0.08, 0, -0.08
      ];
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      
      const mat = new THREE.LineBasicMaterial({
        color: this.colors.gold,
        transparent: true,
        opacity: 0.5,
        fog: false
      });
      
      const lines = new THREE.LineSegments(geometry, mat);
      lines.userData = { glyphComponent: 'evoSquares' };
      evoGroup.add(lines);
      evoGroup.userData.rotationSpeed = 0.4;
      
    } else if (stage === 3) {
      // Prism (cone)
      const geo = new THREE.ConeGeometry(0.12, 0.25, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: this.colors.violet,
        transparent: true,
        opacity: 0.55,
        emissive: this.colors.magenta,
        emissiveIntensity: 0.25,
        fog: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { glyphComponent: 'evoPrism' };
      evoGroup.add(mesh);
      evoGroup.userData.rotationSpeed = 0.5;
    }
    
    // Position offset (orbits core)
    evoGroup.userData.orbitPhase = Math.random() * Math.PI * 2;
    evoGroup.userData.orbitRadius = stage === 1 ? 0.62 : 0.38;
    
    return evoGroup;
  }

  createFoldedImpossibleGlyph() {
    const glyphGroup = new THREE.Group();

    const beamGeometry = new THREE.BoxGeometry(0.24, 0.06, 0.08);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0xcff6ff,
      transparent: true,
      opacity: 0.68,
      fog: false,
      toneMapped: false
    });

    const createBeam = (position, rotation, scale = [1, 1, 1]) => {
      const beam = new THREE.Mesh(beamGeometry, beamMaterial.clone());
      beam.position.set(position[0], position[1], position[2]);
      beam.rotation.set(rotation[0], rotation[1], rotation[2]);
      beam.scale.set(scale[0], scale[1], scale[2]);
      beam.userData.lockGlyphPosition = true;
      beam.userData.lockGlyphScale = true;
      glyphGroup.add(beam);
    };

    createBeam([0.0, 0.1, 0.0], [0.0, Math.PI / 4, Math.PI / 9], [1.45, 1.0, 1.0]);
    createBeam([0.12, -0.02, 0.08], [Math.PI / 2.6, Math.PI / 4, 0.0], [1.2, 0.95, 0.9]);
    createBeam([-0.08, -0.13, -0.02], [0.0, -Math.PI / 4, -Math.PI / 2.7], [1.15, 0.9, 0.85]);

    const frameGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.16, 0.15, -0.03),
      new THREE.Vector3(0.0, 0.24, 0.02),
      new THREE.Vector3(0.18, 0.08, 0.05),
      new THREE.Vector3(0.08, -0.16, 0.03),
      new THREE.Vector3(-0.12, -0.2, -0.04),
      new THREE.Vector3(-0.2, -0.02, -0.06),
      new THREE.Vector3(-0.16, 0.15, -0.03)
    ]);

    const frame = new THREE.Line(
      frameGeometry,
      new THREE.LineBasicMaterial({
        color: 0x7fe7ff,
        transparent: true,
        opacity: 0.9,
        fog: false
      })
    );
    frame.rotation.y = Math.PI / 6;
    frame.rotation.x = -Math.PI / 9;
    frame.userData.lockGlyphPosition = true;
    frame.userData.lockGlyphScale = true;
    glyphGroup.add(frame);

    const knotGeometry = new THREE.TorusKnotGeometry(0.08, 0.012, 64, 8, 2, 3);
    const knot = new THREE.Mesh(
      knotGeometry,
      new THREE.MeshBasicMaterial({
        color: 0xf4fbff,
        transparent: true,
        opacity: 0.42,
        fog: false,
        wireframe: true
      })
    );
    knot.rotation.set(Math.PI / 3.2, Math.PI / 5, Math.PI / 8);
    knot.userData.lockGlyphPosition = true;
    knot.userData.lockGlyphScale = true;
    glyphGroup.add(knot);

    glyphGroup.scale.setScalar(0.9);
    glyphGroup.position.y = 0.06;
    glyphGroup.userData.lockGlyphPosition = true;
    glyphGroup.userData.lockGlyphScale = true;

    return glyphGroup;
  }

  resolveEvolutionStage(node) {
    const explicitStage = Number(node?.userData?.evolutionStage);
    if (Number.isFinite(explicitStage) && explicitStage >= 1) {
      return Math.max(1, Math.min(3, Math.round(explicitStage)));
    }

    const tierStage = Number(node?.userData?.evolutionTier);
    if (Number.isFinite(tierStage) && tierStage >= 1) {
      return Math.max(1, Math.min(3, Math.round(tierStage)));
    }

    return 1;
  }
  
  updateEvolutionGlyph(evoGroup, deltaTime) {
    if (!evoGroup) return;
    
    // Main rotation
    evoGroup.rotation.y += evoGroup.userData.rotationSpeed * deltaTime;
    
    // Orbital motion around core
    evoGroup.userData.orbitPhase += deltaTime * 0.6;
    const angle = evoGroup.userData.orbitPhase;
    const radius = evoGroup.userData.orbitRadius;
    
    evoGroup.position.x = Math.cos(angle) * radius;
    evoGroup.position.z = Math.sin(angle) * radius;
  }
  
  // ============================================================
  // LAYER 3: PERSONALITY GLYPH (Synergy/Harmony/etc)
  // ============================================================
  
  getDominantPersonality(node) {
    const metrics = node.userData?.personalityMetrics || {};
    
    const personalities = [
      { name: 'synergy', value: metrics.synergy || 0 },
      { name: 'harmony', value: metrics.harmony || 0 },
      { name: 'stability', value: metrics.stability || 0 },
      { name: 'corruption', value: metrics.corruption || 0 },
      { name: 'clarity', value: metrics.clarity || 0 }
    ];
    
    // Find highest
    const dominant = personalities.reduce((max, p) => 
      p.value > max.value ? p : max
    );
    
    return dominant.value > 0.3 ? dominant.name : null;
  }
  
  createPersonalityGlyph(node, nodeId) {
    const personality = this.getDominantPersonality(node);
    if (!personality) return null;
    
    const persGroup = new THREE.Group();
    persGroup.userData = {
      glyphLayer: 'personality',
      personality,
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    persGroup.name = `glyph_pers_${nodeId}`;
    persGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');  // Render after core/archetype, before links
    
    // Personality-specific visuals
    const personalityConfigs = {
      'synergy': {
        geometry: () => new THREE.TorusGeometry(0.105, 0.012, 8, 28),
        color: this.colors.cyan,
        emissive: this.colors.cyan,
        emissiveIntensity: 0.3,
        opacity: 0.45
      },
      'harmony': {
        geometry: () => new THREE.TorusGeometry(0.11, 0.01, 8, 28),
        color: this.colors.green,
        emissive: this.colors.green,
        emissiveIntensity: 0.25,
        opacity: 0.4
      },
      'stability': {
        geometry: () => new THREE.TorusGeometry(0.095, 0.013, 8, 24),
        color: this.colors.red,
        emissive: this.colors.red,
        emissiveIntensity: 0.3,
        opacity: 0.5
      },
      'corruption': {
        geometry: () => new THREE.TorusGeometry(0.1, 0.03, 8, 12),
        color: this.colors.magenta,
        emissive: this.colors.magenta,
        emissiveIntensity: 0.25,
        opacity: 0.45
      },
      'clarity': {
        geometry: () => new THREE.TorusGeometry(0.1, 0.01, 8, 30),
        color: this.colors.white,
        emissive: this.colors.white,
        emissiveIntensity: 0.2,
        opacity: 0.4
      }
    };
    
    const config = personalityConfigs[personality] || personalityConfigs['harmony'];
    const geo = config.geometry();
    
    const mat = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: config.opacity,
      emissive: config.emissive,
      emissiveIntensity: config.emissiveIntensity,
      fog: false
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { glyphComponent: 'personalityMarker' };
    persGroup.add(mesh);
    
    // Animation state
    persGroup.userData.pulsePhase = Math.random() * Math.PI * 2;
    persGroup.userData.rotationSpeed = 0.3;
    
    return persGroup;
  }
  
  updatePersonalityGlyph(persGroup, deltaTime) {
    if (!persGroup) return;
    
    // Gentle rotation
    persGroup.rotation.y += persGroup.userData.rotationSpeed * deltaTime;
    
    // Soft pulsing opacity
    persGroup.userData.pulsePhase += deltaTime * 1.5;
    const pulse = (Math.sin(persGroup.userData.pulsePhase) + 1) * 0.5;
    
    persGroup.children.forEach(child => {
      if (child.material) {
        child.material.opacity = 0.3 + pulse * 0.2;
      }
    });
  }
  
  // ============================================================
  // LAYER 4: STATE GLYPH (Consciousness/Ascended/Mythic/etc)
  // ============================================================
  
  createStateGlyph(node, nodeId) {
    // Check state flags in order of priority
    
    // Consciousness state (cyan fractal hexagon)
    if (node.userData?.consciousness === true) {
      return this.createConsciousnessStateGlyph(node, nodeId);
    }
    
    // Ascended state (orbital rings)
    if (node.userData?.ascended === true) {
      return this.createAscendedStateGlyph(node, nodeId);
    }
    
    // Mythic seed state (triangular crystal)
    if (node.userData?.mythicSeedActive === true) {
      return this.createMythicStateGlyph(node, nodeId);
    }
    
    // Ritual influence (rotating eclipse)
    if (node.userData?.ritualInfluence === true) {
      return this.createRitualStateGlyph(node, nodeId);
    }
    
    // Cluster events (fractal web)
    if (node.userData?.clusterEvent === true) {
      return this.createClusterStateGlyph(node, nodeId);
    }
    
    return null;
  }
  
  createConsciousnessStateGlyph(node, nodeId) {
    const stateGroup = new THREE.Group();
    stateGroup.userData = {
      glyphLayer: 'state',
      stateType: 'consciousness',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    stateGroup.name = `glyph_state_consciousness_${nodeId}`;
    stateGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');  // Render after core/archetype, before links
    
    // Cyan fractal hexagon (3 nested rings)
    const hexGeometry = this.createHexagonGeometry(0.18, 0.12, 0.06);
    const hexMat = new THREE.LineBasicMaterial({
      color: this.colors.cyan,
      transparent: true,
      opacity: 0.7,
      fog: false
    });
    
    const hex = new THREE.LineSegments(hexGeometry, hexMat);
    hex.userData = { glyphComponent: 'consciousnessHex' };
    stateGroup.add(hex);
    
    // Inner pulse core
    const coreGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const coreMat = new THREE.MeshBasicMaterial({
      color: this.colors.cyan,
      transparent: true,
      opacity: 0.5,
      emissive: this.colors.cyan,
      emissiveIntensity: 0.4,
      fog: false
    });
    
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.userData = { glyphComponent: 'consciousnessCore' };
    stateGroup.add(core);
    
    stateGroup.userData.rotationSpeed = 0.15;
    stateGroup.userData.pulsePhase = Math.random() * Math.PI * 2;
    stateGroup.position.y = 0.8;
    
    return stateGroup;
  }
  
  createAscendedStateGlyph(node, nodeId) {
    const stateGroup = new THREE.Group();
    stateGroup.userData = {
      glyphLayer: 'state',
      stateType: 'ascended',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    stateGroup.name = `glyph_state_ascended_${nodeId}`;
    stateGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');  // Render after core/archetype, before links
    
    // 3 concentric orbital rings
    const radii = [0.16, 0.22, 0.28];
    const colors = [this.colors.white, this.colors.blue, this.colors.cyan];
    const speeds = [0.3, -0.2, 0.25];
    
    radii.forEach((radius, idx) => {
      const torus = new THREE.TorusGeometry(radius, 0.02, 12, 60);
      const mat = new THREE.LineBasicMaterial({
        color: colors[idx],
        transparent: true,
        opacity: 0.6 - idx * 0.1,
        fog: false
      });
      
      const ring = new THREE.LineLoop(
        torus.getAttribute('position'),
        new THREE.BufferAttribute(new Uint16Array(torus.getIndex().array), 1)
      );
      ring.material = mat;
      ring.userData = {
        glyphComponent: 'ascendedRing',
        ringIndex: idx,
        rotationSpeed: speeds[idx]
      };
      
      stateGroup.add(ring);
    });
    
    stateGroup.userData.ringPhases = [0, 0, 0];
    stateGroup.position.y = 0.85;
    
    return stateGroup;
  }
  
  createMythicStateGlyph(node, nodeId) {
    const stateGroup = new THREE.Group();
    stateGroup.userData = {
      glyphLayer: 'state',
      stateType: 'mythic',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    stateGroup.name = `glyph_state_mythic_${nodeId}`;
    stateGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');  // Render after core/archetype, before links
    
    // 3 orbiting triangles (crystalline)
    for (let i = 0; i < 3; i++) {
      const triGeo = new THREE.ConeGeometry(0.07, 0.14, 3);
      const triMat = new THREE.MeshBasicMaterial({
        color: this.colors.violet,
        transparent: true,
        opacity: 0.65,
        emissive: this.colors.magenta,
        emissiveIntensity: 0.3,
        fog: false
      });
      
      const tri = new THREE.Mesh(triGeo, triMat);
      tri.position.x = Math.cos((i / 3) * Math.PI * 2) * 0.2;
      tri.position.z = Math.sin((i / 3) * Math.PI * 2) * 0.2;
      tri.rotation.x = Math.PI / 2;
      
      tri.userData = {
        glyphComponent: 'mythicTri',
        triIndex: i,
        orbitRadius: 0.2
      };
      
      stateGroup.add(tri);
    }
    
    stateGroup.userData.orbitSpeed = 1.0;
    stateGroup.userData.breathPhase = Math.random() * Math.PI * 2;
    stateGroup.position.y = 0.75;
    
    return stateGroup;
  }
  
  createRitualStateGlyph(node, nodeId) {
    const stateGroup = new THREE.Group();
    stateGroup.userData = {
      glyphLayer: 'state',
      stateType: 'ritual',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    stateGroup.name = `glyph_state_ritual_${nodeId}`;
    stateGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');  // Render after core/archetype, before links
    
    // Rotating eclipse glyph (overlapping circles)
    const geometry = new THREE.BufferGeometry();
    
    // Two overlapping circles
    const positions = [];
    for (let i = 0; i <= 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      // Circle 1
      positions.push(Math.cos(angle) * 0.1, 0, Math.sin(angle) * 0.1);
    }
    for (let i = 0; i <= 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      // Circle 2 (offset)
      positions.push(Math.cos(angle) * 0.1 + 0.07, 0, Math.sin(angle) * 0.1);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    
    const mat = new THREE.LineBasicMaterial({
      color: this.colors.gold,
      transparent: true,
      opacity: 0.7,
      fog: false
    });
    
    const lines = new THREE.LineSegments(geometry, mat);
    lines.userData = { glyphComponent: 'ritualEclipse' };
    stateGroup.add(lines);
    
    stateGroup.userData.rotationSpeed = 1.2;
    stateGroup.userData.pulsePhase = Math.random() * Math.PI * 2;
    stateGroup.position.y = 0.7;
    
    return stateGroup;
  }
  
  createClusterStateGlyph(node, nodeId) {
    const stateGroup = new THREE.Group();
    stateGroup.userData = {
      glyphLayer: 'state',
      stateType: 'cluster',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    stateGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');  // Render after core/archetype, before links
    stateGroup.name = `glyph_state_cluster_${nodeId}`;
    
    // Fractal web sphere (simplified)
    const geometry = new THREE.IcosahedronGeometry(0.13, 1);
    const mat = new THREE.LineBasicMaterial({
      color: this.colors.pink,
      transparent: true,
      opacity: 0.6,
      fog: false
    });
    
    const web = new THREE.LineSegments(geometry, mat);
    web.userData = { glyphComponent: 'clusterWeb' };
    stateGroup.add(web);
    
    stateGroup.userData.rotationSpeed = 0.4;
    stateGroup.userData.expandPhase = Math.random() * Math.PI * 2;
    stateGroup.position.y = 0.8;
    
    return stateGroup;
  }
  
  updateStateGlyph(stateGroup, deltaTime) {
    if (!stateGroup) return;
    
    const stateType = stateGroup.userData.stateType;
    
    if (stateType === 'consciousness') {
      // Rotate + pulse
      stateGroup.rotation.y += stateGroup.userData.rotationSpeed * deltaTime;
      
      stateGroup.userData.pulsePhase += deltaTime * 1.5;
      const pulse = (Math.sin(stateGroup.userData.pulsePhase) + 1) * 0.5;
      
      stateGroup.children.forEach(child => {
        if (child.userData?.glyphComponent === 'consciousnessCore' && child.material) {
          child.material.opacity = 0.3 + pulse * 0.3;
        }
      });
      
    } else if (stateType === 'ascended') {
      // Multi-ring rotation
      stateGroup.children.forEach((child, idx) => {
        if (child.userData?.glyphComponent === 'ascendedRing') {
          const speed = child.userData.rotationSpeed;
          stateGroup.userData.ringPhases[idx] = (stateGroup.userData.ringPhases[idx] + speed * deltaTime) % (Math.PI * 2);
          child.rotation.y = stateGroup.userData.ringPhases[idx];
        }
      });
      
    } else if (stateType === 'mythic') {
      // Orbit + breathe
      stateGroup.userData.orbitSpeed += deltaTime;
      
      stateGroup.children.forEach((child, idx) => {
        if (child.userData?.glyphComponent === 'mythicTri') {
          const orbitAngle = stateGroup.userData.orbitSpeed * 2 + (idx / 3) * Math.PI * 2;
          child.position.x = Math.cos(orbitAngle) * 0.2;
          child.position.z = Math.sin(orbitAngle) * 0.2;
          child.rotation.y = orbitAngle;
        }
      });
      
      stateGroup.userData.breathPhase += deltaTime;
      const breath = (Math.sin(stateGroup.userData.breathPhase) + 1) * 0.5;
      stateGroup.scale.set(1 + breath * 0.05, 1 + breath * 0.05, 1 + breath * 0.05);
      
    } else if (stateType === 'ritual') {
      // Fast rotation + pulse
      stateGroup.rotation.z += stateGroup.userData.rotationSpeed * deltaTime;
      
      stateGroup.userData.pulsePhase += deltaTime * 2;
      const pulse = (Math.sin(stateGroup.userData.pulsePhase) + 1) * 0.5;
      
      stateGroup.children.forEach(child => {
        if (child.material) {
          child.material.opacity = 0.5 + pulse * 0.2;
        }
      });
      
    } else if (stateType === 'cluster') {
      // Expand + rotate
      stateGroup.rotation.x += stateGroup.userData.rotationSpeed * deltaTime;
      stateGroup.rotation.y += stateGroup.userData.rotationSpeed * 0.7 * deltaTime;
      
      stateGroup.userData.expandPhase += deltaTime;
      const expand = (Math.sin(stateGroup.userData.expandPhase) + 1) * 0.5;
      stateGroup.scale.set(1 + expand * 0.08, 1 + expand * 0.08, 1 + expand * 0.08);
    }
  }
  
  // ============================================================
  // FALLBACK GLYPH (Neural Point Dot)
  // ============================================================
  
  createFallbackGlyph(node, nodeId) {
    const fallbackGroup = new THREE.Group();
    fallbackGroup.userData = {
      glyphLayer: 'fallback',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    fallbackGroup.name = `glyph_fallback_${nodeId}`;
    fallbackGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');  // Render after core/archetype, before links
    
    // Tiny neural point dot
    const dotGeo = new THREE.SphereGeometry(0.04, 4, 4);
    const dotMat = new THREE.MeshBasicMaterial({
      color: this.colors.white,
      transparent: true,
      opacity: 0.3,
      emissive: this.colors.white,
      emissiveIntensity: 0.1,
      fog: false
    });
    
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.userData = { glyphComponent: 'neuralPoint' };
    fallbackGroup.add(dot);
    
    fallbackGroup.userData.pulsePhase = Math.random() * Math.PI * 2;
    fallbackGroup.position.y = 0.5;
    
    return fallbackGroup;
  }
  
  updateFallbackGlyph(fallbackGroup, deltaTime) {
    if (!fallbackGroup) return;
    
    fallbackGroup.userData.pulsePhase += deltaTime * 0.6;
    const pulse = (Math.sin(fallbackGroup.userData.pulsePhase) + 1) * 0.5;
    
    fallbackGroup.children.forEach(child => {
      if (child.material) {
        child.material.opacity = 0.15 + pulse * 0.15;
      }
    });
  }
  
  // ============================================================
  // HELPER: CREATE HEXAGON GEOMETRY
  // ============================================================
  
  createHexagonGeometry(outerRadius, midRadius, innerRadius) {
    const positions = [];
    const indices = [];
    let vertexCount = 0;
    
    // Three hex rings
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
      
      // Ring edges
      for (let i = 0; i < 6; i++) {
        indices.push(startVertex + i, startVertex + i + 1);
      }
    });
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geo.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
    
    return geo;
  }
  
  // ============================================================
  // SAFE ATTACHMENT WITH ENFORCEMENT GATE
  // ============================================================
  
  _safeAttachGlyph(glyphGroup, layerType, targetContainer, node) {
    if (!glyphGroup) return false;

    // Safe to attach (VisualLayerEnforcementGate removed in Phase B cleanup)
    targetContainer.add(glyphGroup);
    return true;
  }

  /**
   * Visibility tuning to keep glyphs readable around node cores
   */
  _tuneGlyphVisibility(group) {
    if (!group) return;

    const applyMaterialFlags = (mat) => {
      if (!mat) return;
      mat.transparent = true;
      mat.depthWrite = false;
      mat.depthTest = true;
    };

    group.traverse((obj) => {
      if (!(obj.isMesh || obj.isLine || obj.isPoints)) return;

      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(applyMaterialFlags);
        } else {
          applyMaterialFlags(obj.material);
        }
      }

      // Ensure glyphs draw after node cores
      obj.renderOrder = GLYPH_RENDER_ORDER;

      // Bring glyphs slightly outside the core and enlarge for readability
      if (!obj.userData?.lockGlyphScale) {
        obj.scale.multiplyScalar(2.0);
      }
      if (!obj.userData?.lockGlyphPosition) {
        if (obj.position.lengthSq() === 0) {
          obj.position.set(0, 0.35, 0);
        } else {
          obj.position.multiplyScalar(1.2);
        }
      }
    });
  }
  
  /**
   * Estimate opacity from glyph materials for enforcement reporting
   */
  _estimateGlyphOpacity(glyphGroup) {
    if (!glyphGroup || !glyphGroup.children) return 0.5;
    
    for (const child of glyphGroup.children) {
      if (child.material && typeof child.material.opacity === 'number') {
        return child.material.opacity;
      }
    }
    return 0.5;
  }

  // ============================================================
  // CORE FUSION: Attach All Layers to Node
  // ============================================================
  
  createGlyphFusion(node, nodeId) {
    if (!node || !node.parent) return;
    if (this.hoverOnlyMode && (!this.hoverNodeId || nodeId !== this.hoverNodeId)) return;
    
    // Skip if already fused
    if (this.fusionRegistry.has(nodeId)) return;
    
    // Find or create visual group
    let visualGroup = node.children?.find(child => 
      child.userData?.isVisualGroup || child.name === 'visualGroup'
    );
    
    if (!visualGroup) {
      visualGroup = new THREE.Group();
      visualGroup.userData.isVisualGroup = true;
      visualGroup.name = 'visualGroup';
      node.add(visualGroup);
    }
    
    // Create fusion container
    const fusionGroup = new THREE.Group();
    fusionGroup.userData = {
      isGlyphFusion: true,
      nodeId,
      isFusion: true
    };
    fusionGroup.name = `fusion_${nodeId}`;
    fusionGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');  // Render after core/archetype (0/1), before links (200+)
    visualGroup.add(fusionGroup);
    
    let coreGlyph = null;
    let evoGlyph = null;
    let persGlyph = null;
    let stateGlyph = null;

    if (this.hoverOnlyMode) {
      // Hover-only mode: render only the ascended ring marker for hovered node.
      stateGlyph = this.createAscendedStateGlyph(node, nodeId);
      if (stateGlyph && this._safeAttachGlyph(stateGlyph, 'STATE_GLYPH', fusionGroup, node)) {
        this.stats.byLayer.state++;
      }
    } else {
      // Layer 1: Core Glyph (always present)
      coreGlyph = this.createCoreGlyph(node, nodeId);
      if (coreGlyph && this._safeAttachGlyph(coreGlyph, 'GLYPH_LAYER', fusionGroup, node)) {
        this.stats.byLayer.core++;
      }
      
      // Layer 2: Evolution Glyph (if evolution stage exists)
      evoGlyph = this.createEvolutionGlyph(node, nodeId);
      if (evoGlyph && this._safeAttachGlyph(evoGlyph, 'GLYPH_LAYER', fusionGroup, node)) {
        this.stats.byLayer.evolution++;
      }
      
      // Layer 3: Personality Glyph (if personality exists)
      persGlyph = this.createPersonalityGlyph(node, nodeId);
      if (persGlyph && this._safeAttachGlyph(persGlyph, 'STATE_GLYPH', fusionGroup, node)) {
        this.stats.byLayer.personality++;
      }
      
      // Layer 4: State Glyph (if state flags exist)
      stateGlyph = this.createStateGlyph(node, nodeId);
      if (stateGlyph && this._safeAttachGlyph(stateGlyph, 'STATE_GLYPH', fusionGroup, node)) {
        this.stats.byLayer.state++;
      }
    }
    
    // Fallback if no glyphs
    if (fusionGroup.children.length === 0) {
      const fallback = this.createFallbackGlyph(node, nodeId);
      if (fallback) {
        this._safeAttachGlyph(fallback, 'GLYPH_LAYER', fusionGroup, node);
      }
    }

    // Visibility tuning: ensure glyphs sit outside cores and render above node bodies
    this._tuneGlyphVisibility(fusionGroup);
    
    // Register fusion
    const fusionData = {
      node,
      fusionGroup,
      visualGroup,
      layers: {
        core: coreGlyph,
        evolution: evoGlyph,
        personality: persGlyph,
        state: stateGlyph
      }
    };
    
    this.fusionRegistry.set(nodeId, fusionData);
    
    // Register with resonance feedback system (if available)
    // This creates a perceptible "resonance aura" around the composite glyph
    if (this.resonanceFeedback && typeof this.resonanceFeedback.registerCompositeGlyph === 'function') {
      // Collect source node IDs (for reabsorption during dissolution)
      // Sources are typically linked nodes or nearby nodes that contributed to fusion
      const sourceNodeIds = [];
      if (node.userData?.linkedNodeIds && Array.isArray(node.userData.linkedNodeIds)) {
        sourceNodeIds.push(...node.userData.linkedNodeIds);
      }
      // Fallback: add the composite node's own ID (sources will be discovered by proximity)
      if (sourceNodeIds.length === 0 && node.userData?.id) {
        sourceNodeIds.push(node.userData.id);
      }
      
      const compositeGlyph = {
        id: nodeId,
        mesh: fusionGroup,
        isFused: true,
        decayStrength: 1.0,
        sourceNodeIds: sourceNodeIds,  // For source glyph reabsorption during dissolution
        // Provide access to node metrics for resonance modulation
        glyphData: {
          harmonyDominance: node.userData?.metrics?.harmony || 0.5,
          corruptionLevel: (node.userData?.metrics?.corruption ?? node.userData?.corruption ?? 0),
          synergyCoherence: node.userData?.metrics?.synergy || 0.5,
          stabilityIndex: node.userData?.metrics?.stability || 0
        }
      };
      this.resonanceFeedback.registerCompositeGlyph(compositeGlyph);
      
      // Set source node IDs on the resonance zone (if available)
      if (this.resonanceFeedback.resonanceZones && this.resonanceFeedback.resonanceZones.has(nodeId)) {
        const zone = this.resonanceFeedback.resonanceZones.get(nodeId);
        zone.setSourceNodeIds(sourceNodeIds);
      }
    }
    
    this.stats.totalFusions++;
    this.stats.activeFusions++;
  }

  _getOrCreateVisualGroup(node) {
    let visualGroup = node.children?.find(child =>
      child.userData?.isVisualGroup || child.name === 'visualGroup'
    );

    if (!visualGroup) {
      visualGroup = new THREE.Group();
      visualGroup.userData.isVisualGroup = true;
      visualGroup.name = 'visualGroup';
      node.add(visualGroup);
    }

    return visualGroup;
  }

  createAmbientOrbitForNode(node, nodeId) {
    if (!this.ambientOrbitEnabled) return;
    if (!node || !node.parent || !nodeId) return;
    if (this.ambientOrbitRegistry.has(nodeId)) return;

    const visualGroup = this._getOrCreateVisualGroup(node);
    const evolutionGlyph = this.createEvolutionGlyph(node, nodeId);
    if (!evolutionGlyph) return;

    const ambientGroup = new THREE.Group();
    ambientGroup.userData = {
      isAmbientOrbitGlyph: true,
      nodeId,
      isFusion: true
    };
    ambientGroup.name = `ambient_orbit_${nodeId}`;
    ambientGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');
    visualGroup.add(ambientGroup);

    this._safeAttachGlyph(evolutionGlyph, 'GLYPH_LAYER', ambientGroup, node);
    this._tuneGlyphVisibility(ambientGroup);

    this.ambientOrbitRegistry.set(nodeId, {
      node,
      visualGroup,
      ambientGroup,
      evolution: evolutionGlyph
    });
  }

  createAmbientOrbitGlyphsForNodes(nodes) {
    if (!this.ambientOrbitEnabled) return;
    if (!nodes || nodes.length === 0) return;

    nodes.forEach((node) => {
      const nodeId = node?.userData?.nodeId;
      if (!nodeId) return;
      this.createAmbientOrbitForNode(node, nodeId);
    });
  }
  
  // ============================================================
  // BULK CREATION
  // ============================================================
  
  createGlyphFusionsForNodes(nodes) {
    if (this.hoverOnlyMode) return;
    if (!nodes || nodes.length === 0) return;
    const missing = nodes.filter(n => !n?.userData?.nodeId);
    if (missing.length > 0) {
      console.error('[GlyphLayer4] Missing nodeId on nodes; fusion skipped for these entries:', missing);
    }
    
    const startTime = performance.now();
    
    nodes.forEach((node, index) => {
      if (!node) return;
    if (!node.userData?.nodeId) {
      console.error('[GlyphLayer4] Missing canonical nodeId on node; fusion skipped', node);
      return;
    }
    const nodeId = node.userData.nodeId;
      this.createGlyphFusion(node, nodeId);
    });
    
    const elapsed = performance.now() - startTime;
    if (elapsed > 5) {
      console.warn(`⚠ Glyph Layer 4.0 fusion took ${elapsed.toFixed(2)}ms for ${nodes.length} nodes`);
    }
  }

  setHoverNode(node) {
    const nextNodeId = node?.userData?.nodeId || null;
    if (nextNodeId === this.hoverNodeId) return;

    if (this.hoverNodeId) {
      this.removeFusion(this.hoverNodeId);
    }

    this.hoverNodeId = nextNodeId;
    if (!this.hoverNodeId || !node) return;

    this.createGlyphFusion(node, this.hoverNodeId);
  }
  
  // ============================================================
  // UPDATE LOOP
  // ============================================================
  
  update(deltaTime) {
    if (!this.enabled) return;
    if (!this.frameScheduler?.shouldRunVisual?.()) return;

    if (this._glyphTimeOrigin === undefined) {
      this._glyphTimeOrigin = VisualTime.now; // Phase 2A: canonical VisualTime anchor for glyph timing
    }
    const currentVisualTime = VisualTime.now - this._glyphTimeOrigin; // Phase 2A: VisualTime canonical clock (behavior-preserving)
    const visualDelta = this._lastVisualTime === undefined
      ? 0
      : Math.max(0, currentVisualTime - this._lastVisualTime); // Phase 2A: derived delta from VisualTime (behavior-preserving)
    this._lastVisualTime = currentVisualTime;
    deltaTime = visualDelta;

    for (const [nodeId, fusionData] of this.fusionRegistry) {
      const { fusionGroup, layers } = fusionData;
      
      if (!fusionGroup || !fusionGroup.parent) {
        this.removeFusion(nodeId);
        continue;
      }
      
      // Update each layer
      if (layers.core) this.updateCoreGlyph(layers.core, deltaTime);
      if (layers.evolution) this.updateEvolutionGlyph(layers.evolution, deltaTime);
      if (layers.personality) this.updatePersonalityGlyph(layers.personality, deltaTime);
      if (layers.state) this.updateStateGlyph(layers.state, deltaTime);
      
      // Update fallback if only child
      if (fusionGroup.children.length === 1 && 
          fusionGroup.children[0].userData?.glyphLayer === 'fallback') {
        this.updateFallbackGlyph(fusionGroup.children[0], deltaTime);
      }
    }

    for (const [nodeId, ambientData] of this.ambientOrbitRegistry) {
      const { ambientGroup, evolution } = ambientData;

      if (!ambientGroup || !ambientGroup.parent) {
        this.removeAmbientOrbit(nodeId);
        continue;
      }

      if (evolution) this.updateEvolutionGlyph(evolution, deltaTime);
    }
  }
  
  // ============================================================
  // REMOVAL & CLEANUP
  // ============================================================
  
  removeFusion(nodeId) {
    const fusionData = this.fusionRegistry.get(nodeId);
    if (!fusionData) return;
    
    const { fusionGroup } = fusionData;
    
    // Unregister from resonance feedback (initiates decay phase)
    if (this.resonanceFeedback && typeof this.resonanceFeedback.unregisterCompositeGlyph === 'function') {
      this.resonanceFeedback.unregisterCompositeGlyph(nodeId);
    }
    
    // Remove from parent
    if (fusionGroup && fusionGroup.parent) {
      fusionGroup.parent.remove(fusionGroup);
    }
    
    // Dispose geometries and materials
    fusionGroup.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    
    this.fusionRegistry.delete(nodeId);
    this.stats.activeFusions--;
  }

  removeAmbientOrbit(nodeId) {
    const ambientData = this.ambientOrbitRegistry.get(nodeId);
    if (!ambientData) return;

    const { ambientGroup } = ambientData;

    if (ambientGroup && ambientGroup.parent) {
      ambientGroup.parent.remove(ambientGroup);
    }

    ambientGroup.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    this.ambientOrbitRegistry.delete(nodeId);
  }
  
  cleanup() {
    for (const nodeId of this.fusionRegistry.keys()) {
      this.removeFusion(nodeId);
    }

    for (const nodeId of this.ambientOrbitRegistry.keys()) {
      this.removeAmbientOrbit(nodeId);
    }
    
    this.stats = {
      totalFusions: 0,
      activeFusions: 0,
      byLayer: {
        core: 0,
        evolution: 0,
        personality: 0,
        state: 0
      }
    };
    
    console.log('✓ ATOMA Glyph Layer 4.0 cleaned up');
  }
  
  // ============================================================
  // DEBUG & CONTROL
  // ============================================================
  
  debugGlyphFusion(nodeId) {
    const fusionData = this.fusionRegistry.get(nodeId);
    
    if (!fusionData) {
      console.warn(`No fusion data for node ${nodeId}`);
      return;
    }
    
    console.group(`🔍 Glyph Layer 4.0 Fusion - Node ${nodeId}`);
    console.log('Fusion Active:', !!fusionData.fusionGroup);
    console.log('Layers:');
    console.log('  - Core:', !!fusionData.layers.core, fusionData.layers.core?.userData?.category);
    console.log('  - Evolution:', !!fusionData.layers.evolution, fusionData.layers.evolution?.userData?.stage);
    console.log('  - Personality:', !!fusionData.layers.personality, fusionData.layers.personality?.userData?.personality);
    console.log('  - State:', !!fusionData.layers.state, fusionData.layers.state?.userData?.stateType);
    console.log('Child count:', fusionData.fusionGroup.children.length);
    console.groupEnd();
  }
  
  printStatus() {
    console.group('📊 ATOMA Glyph Layer 4.0 Status');
    console.log('Enabled:', this.enabled);
    console.log('Total Fusions Created:', this.stats.totalFusions);
    console.log('Active Fusions:', this.stats.activeFusions);
    console.log('Ambient Orbit Glyphs:', this.ambientOrbitRegistry.size);
    console.log('Layer Distribution:');
    console.table(this.stats.byLayer);
    console.groupEnd();
  }
  
  disable() {
    this.enabled = false;
    console.log('✓ Glyph Layer 4.0 disabled');
  }
  
  enable() {
    this.enabled = true;
    console.log('✓ Glyph Layer 4.0 enabled');
  }
}
