/**
 * ATOMA GLYPH LAYER 4.0 - MULTI-GLYPH FUSION (SAFE EDITION)
 * 
 * Advanced multi-layer glyph rendering system that combines multiple symbolic glyphs per node:
 * 1) Core Glyph (node category)
 * 2) Category Glyph (category-driven, legacy stage fallback)
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

    // Fusion/ambient pool for reuse (avoid destroy/create spikes)
    this.fusionPool = [];
    this.ambientOrbitPool = [];
    this.maxFusionPoolSize = 64;
    this.maxAmbientOrbitPoolSize = 24;

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
  
  createCoreGlyph(node, nodeId) {
    return null;
  }
  
  // ============================================================
  // LAYER 2: EVOLUTION GLYPH (Category-Driven)
  // ============================================================

  resolveNodeCategory(node) {
    return String(
      node?.userData?.category ??
      node?.userData?.nodeCategory ??
      ''
    ).trim().toLowerCase();
  }

  resolveEvolutionGlyphKey(node) {
    const category = this.resolveNodeCategory(node);

    if (category === 'control' || category === 'integration') {
      return 'controlIntegration';
    }

    if (category === 'analytics' || category === 'emotional') {
      return 'analyticsEmotional';
    }

    if (category === 'input' || category === 'process') {
      return 'inputProcess';
    }

    if (category === 'error' || category === 'sigma') {
      return 'errorSigma';
    }

    if (category === 'prime' || category === 'mythic') {
      return 'primeMythic';
    }

    if (category === 'quantum' || category === 'storage') {
      return 'quantumStorage';
    }

    return `stage:${this.resolveEvolutionStage(node)}`;
  }

  _getEvolutionOrbitRadius(glyphKey, stage = 1) {
    const radiusMap = {
      controlIntegration: 0.96,
      analyticsEmotional: 0.9,
      inputProcess: 0.84,
      errorSigma: 0.78,
      primeMythic: 1.05,
      quantumStorage: 1.0,
      1: 0.96,
      2: 0.9,
      3: 0.84,
      4: 0.78
    };

    const resolvedStage = Math.max(1, Math.min(4, Math.round(Number(stage) || 1)));
    return radiusMap[glyphKey] ?? radiusMap[resolvedStage] ?? 0.9;
  }

  _applyEvolutionOrbitMotion(evoGroup, deltaTime) {
    if (!evoGroup) return;

    const rotationSpeed = Number(evoGroup.userData.rotationSpeed) || 0.3;
    const orbitSpeed = Number(evoGroup.userData.orbitSpeed) || 0.6;
    const orbitRadius = Number(evoGroup.userData.orbitRadius) || 0.7;

    evoGroup.rotation.y += rotationSpeed * deltaTime;

    evoGroup.userData.orbitPhase = (Number(evoGroup.userData.orbitPhase) || 0) + deltaTime * orbitSpeed;
    const angle = evoGroup.userData.orbitPhase;

    evoGroup.position.x = Math.cos(angle) * orbitRadius;
    evoGroup.position.z = Math.sin(angle) * orbitRadius;
  }
  
  createEvolutionGlyph(node, nodeId) {
    const glyphKey = this.resolveEvolutionGlyphKey(node);

    if (glyphKey === 'primeMythic') {
      return this.createPrimeMythicGlyph(node, nodeId);
    }

    if (glyphKey === 'quantumStorage') {
      return this.createQuantumStorageGlyph(node, nodeId);
    }

    const categoryStageMap = {
      controlIntegration: 1,
      analyticsEmotional: 2,
      inputProcess: 3,
      errorSigma: 4
    };

    const stage = categoryStageMap[glyphKey] ?? this.resolveEvolutionStage(node);
    if (stage < 1 || stage > 4) return null;
    const orbitRadius = this._getEvolutionOrbitRadius(glyphKey, stage);
    
    const evoGroup = new THREE.Group();
    evoGroup.userData = {
      glyphLayer: 'evolution',
      glyphKey,
      stage,
      orbitRadius,
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    evoGroup.name = `glyph_evo_${nodeId}`;
    evoGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');  // Render after core/archetype, before links
    
    // Stage-specific visuals
    if (stage === 1) {
      const impossibleGlyph = this.createFoldedImpossibleGlyph();
      impossibleGlyph.userData = {
        ...(impossibleGlyph.userData || {}),
        glyphComponent: 'consensusEngineGlyph'
      };
      evoGroup.add(impossibleGlyph);
      evoGroup.userData.rotationSpeed = 0.6;
      
    } else if (stage === 2) {
      const harmonicCell = this.createHarmonicCellGlyph();
      harmonicCell.userData = {
        ...(harmonicCell.userData || {}),
        glyphComponent: 'livingSignalDeityGlyph'
      };
      evoGroup.add(harmonicCell);
      evoGroup.userData.rotationSpeed = 0.42;
      evoGroup.userData.signalPhase = Math.random() * Math.PI * 2;
      evoGroup.userData.haloPhase = Math.random() * Math.PI * 2;
      evoGroup.userData.membranePhase = Math.random() * Math.PI * 2;
      
    } else if (stage === 3) {
      const helicalTrinity = this.createHelicalTrinityGlyph();
      helicalTrinity.userData = {
        ...(helicalTrinity.userData || {}),
        glyphComponent: 'evoHelicalTrinity'
      };
      evoGroup.add(helicalTrinity);
      evoGroup.userData.rotationSpeed = 0.5;
      evoGroup.userData.trinityPhase = Math.random() * Math.PI * 2;

    } else if (stage === 4) {
      const resonanceCrown = this.createResonanceCrownFragmentGlyph();
      resonanceCrown.userData = {
        ...(resonanceCrown.userData || {}),
        glyphComponent: 'alienIntelligenceOrganGlyph'
      };
      evoGroup.add(resonanceCrown);
      evoGroup.userData.rotationSpeed = 0.32;
      evoGroup.userData.organPhase = Math.random() * Math.PI * 2;
      evoGroup.userData.lobePhase = Math.random() * Math.PI * 2;
      evoGroup.userData.tendrilPhase = Math.random() * Math.PI * 2;
    }
    
    // Position offset (orbits core)
    evoGroup.userData.orbitPhase = Math.random() * Math.PI * 2;
    evoGroup.userData.orbitRadius = orbitRadius;
    
    return evoGroup;
  }

  createPrimeMythicGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    const category = this.resolveNodeCategory(node);
    const orbitRadius = this._getEvolutionOrbitRadius('primeMythic');

    glyphGroup.userData = {
      glyphLayer: 'evolution',
      glyphKey: 'primeMythic',
      glyphVariant: 'primeMythic',
      category,
      orbitRadius,
      isVFX: true,
      noEvolve: true,
      noCleanup: true,
      vortexPhase: Math.random() * Math.PI * 2,
      orbitPhase: Math.random() * Math.PI * 2,
      orbitSpeed: 0.52,
      rotationSpeed: 0.42
    };
    glyphGroup.name = `glyph_prime_mythic_${nodeId}`;
    glyphGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');

    const coreGeometry = new THREE.DodecahedronGeometry(0.14, 0);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xf9f2d7,
      transparent: true,
      opacity: 0.82,
      fog: false,
      toneMapped: false,
      wireframe: true
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.scale.set(1.08, 0.92, 1.12);
    core.rotation.set(Math.PI / 8, Math.PI / 7, Math.PI / 11);
    core.userData = {
      glyphComponent: 'primeMythicCore',
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(core);

    const fieldGeometry = this.createHexagonGeometry(0.28, 0.2, 0.12);
    const field = new THREE.LineSegments(
      fieldGeometry,
      new THREE.LineBasicMaterial({
        color: 0xb9a7ff,
        transparent: true,
        opacity: 0.24,
        fog: false
      })
    );
    field.rotation.set(Math.PI / 2.5, 0, Math.PI / 5);
    field.userData = {
      glyphComponent: 'primeMythicField',
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(field);

    const ringA = new THREE.Mesh(
      new THREE.TorusGeometry(0.23, 0.012, 6, 84),
      new THREE.MeshBasicMaterial({
        color: 0xffe8a8,
        transparent: true,
        opacity: 0.2,
        fog: false,
        toneMapped: false,
        wireframe: true
      })
    );
    ringA.rotation.x = Math.PI * 0.5;
    ringA.userData = {
      glyphComponent: 'primeMythicRingA',
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(ringA);

    const ringB = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.009, 6, 84),
      new THREE.MeshBasicMaterial({
        color: 0x86faff,
        transparent: true,
        opacity: 0.18,
        fog: false,
        toneMapped: false,
        wireframe: true
      })
    );
    ringB.rotation.set(Math.PI * 0.5, Math.PI / 4, Math.PI / 8);
    ringB.userData = {
      glyphComponent: 'primeMythicRingB',
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(ringB);

    const plasmaGeometry = new THREE.ConeGeometry(0.045, 0.18, 3, 1, false);
    const plasmaColors = [0xfff8db, 0xc9b8ff, 0x8bf6ff];
    const tau = Math.PI * 2;

    for (let index = 0; index < 3; index++) {
      const plasma = new THREE.Mesh(
        plasmaGeometry,
        new THREE.MeshBasicMaterial({
          color: plasmaColors[index],
          transparent: true,
          opacity: 0.7,
          fog: false,
          toneMapped: false
        })
      );
      const phase = (index / 3) * tau;
      plasma.position.set(Math.cos(phase) * 0.18, 0.02 * index, Math.sin(phase) * 0.18);
      plasma.rotation.set(Math.PI * 0.5, phase + Math.PI / 6, Math.PI * 0.5);
      plasma.userData = {
        glyphComponent: 'primeMythicPlasma',
        plasmaIndex: index,
        orbitPhase: phase,
        orbitRadius: 0.18,
        lockGlyphPosition: true,
        lockGlyphScale: true
      };
      glyphGroup.add(plasma);
    }

    const sparkGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const spark = new THREE.Mesh(
      sparkGeometry,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.48,
        fog: false,
        toneMapped: false
      })
    );
    spark.userData = {
      glyphComponent: 'primeMythicSpark',
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(spark);

    glyphGroup.scale.setScalar(0.98);
    glyphGroup.position.y = 0.06;
    glyphGroup.userData.lockGlyphPosition = true;
    glyphGroup.userData.lockGlyphScale = true;

    return glyphGroup;
  }

  updatePrimeMythicGlyph(glyphGroup, deltaTime) {
    if (!glyphGroup) return;

    this._applyEvolutionOrbitMotion(glyphGroup, deltaTime);
    glyphGroup.userData.vortexPhase = (glyphGroup.userData.vortexPhase ?? 0) + deltaTime * 1.1;
    const vortex = (Math.sin(glyphGroup.userData.vortexPhase) + 1) * 0.5;

    glyphGroup.rotation.x += deltaTime * 0.06;
    glyphGroup.scale.setScalar(0.96 + vortex * 0.05);

    glyphGroup.traverse((child) => {
      if (!child.material) return;

      if (child.userData?.glyphComponent === 'primeMythicCore') {
        child.rotation.y += deltaTime * 0.3;
        child.material.opacity = 0.72 + vortex * 0.18;
      }

      if (child.userData?.glyphComponent === 'primeMythicField') {
        child.rotation.z += deltaTime * 0.18;
        child.material.opacity = 0.12 + vortex * 0.18;
      }

      if (child.userData?.glyphComponent === 'primeMythicRingA') {
        child.rotation.z += deltaTime * 0.26;
        child.material.opacity = 0.15 + vortex * 0.16;
      }

      if (child.userData?.glyphComponent === 'primeMythicRingB') {
        child.rotation.x -= deltaTime * 0.34;
        child.material.opacity = 0.12 + vortex * 0.14;
      }

      if (child.userData?.glyphComponent === 'primeMythicPlasma') {
        const orbitPhase = child.userData.orbitPhase + glyphGroup.userData.vortexPhase * (0.86 + child.userData.plasmaIndex * 0.12);
        const orbitRadius = child.userData.orbitRadius + Math.sin(glyphGroup.userData.vortexPhase * 1.4 + child.userData.plasmaIndex) * 0.02;
        child.position.x = Math.cos(orbitPhase) * orbitRadius;
        child.position.z = Math.sin(orbitPhase) * orbitRadius;
        child.position.y = Math.sin(orbitPhase * 1.2) * 0.06;
        child.rotation.y = orbitPhase + Math.PI / 6;
        child.rotation.x = Math.PI * 0.5 + Math.sin(glyphGroup.userData.vortexPhase + child.userData.plasmaIndex) * 0.12;
        child.material.opacity = 0.5 + vortex * 0.28;
      }

      if (child.userData?.glyphComponent === 'primeMythicSpark') {
        child.rotation.y += deltaTime * 0.48;
        child.material.opacity = 0.24 + vortex * 0.24;
      }
    });
  }

  createQuantumStorageGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    const category = this.resolveNodeCategory(node);
    const orbitRadius = this._getEvolutionOrbitRadius('quantumStorage');

    glyphGroup.userData = {
      glyphLayer: 'evolution',
      glyphKey: 'quantumStorage',
      glyphVariant: 'quantumStorage',
      category,
      orbitRadius,
      isVFX: true,
      noEvolve: true,
      noCleanup: true,
      fluxPhase: Math.random() * Math.PI * 2,
      orbitPhase: Math.random() * Math.PI * 2,
      orbitSpeed: 0.58,
      rotationSpeed: 0.18
    };
    glyphGroup.name = `glyph_quantum_storage_${nodeId}`;
    glyphGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');

    const shellGeometry = new THREE.CylinderGeometry(0.2, 0.23, 0.055, 6, 1, false);
    const shell = new THREE.Mesh(
      shellGeometry,
      new THREE.MeshBasicMaterial({
        color: 0x7efcff,
        transparent: true,
        opacity: 0.24,
        fog: false,
        toneMapped: false,
        wireframe: true
      })
    );
    shell.rotation.y = Math.PI / 6;
    shell.userData = {
      glyphComponent: 'quantumStorageShell',
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(shell);

    const archiveCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.11, 0.22, 4, 1, false),
      new THREE.MeshBasicMaterial({
        color: 0xdcffff,
        transparent: true,
        opacity: 0.76,
        fog: false,
        toneMapped: false,
        wireframe: true
      })
    );
    archiveCore.rotation.y = Math.PI / 4;
    archiveCore.userData = {
      glyphComponent: 'quantumStorageCore',
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(archiveCore);

    const latticeGeometry = this.createHexagonGeometry(0.28, 0.2, 0.12);
    const lattice = new THREE.LineSegments(
      latticeGeometry,
      new THREE.LineBasicMaterial({
        color: 0x95fbff,
        transparent: true,
        opacity: 0.3,
        fog: false
      })
    );
    lattice.rotation.set(Math.PI / 2, 0, Math.PI / 6);
    lattice.userData = {
      glyphComponent: 'quantumStorageLattice',
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(lattice);

    const ringA = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.01, 6, 72),
      new THREE.MeshBasicMaterial({
        color: 0x87dfff,
        transparent: true,
        opacity: 0.16,
        fog: false,
        toneMapped: false,
        wireframe: true
      })
    );
    ringA.rotation.x = Math.PI * 0.5;
    ringA.userData = {
      glyphComponent: 'quantumStorageRingA',
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(ringA);

    const ringB = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.008, 6, 72),
      new THREE.MeshBasicMaterial({
        color: 0xfff0d1,
        transparent: true,
        opacity: 0.14,
        fog: false,
        toneMapped: false,
        wireframe: true
      })
    );
    ringB.rotation.set(Math.PI * 0.5, Math.PI / 3.8, Math.PI / 7);
    ringB.userData = {
      glyphComponent: 'quantumStorageRingB',
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(ringB);

    const moteGeometry = new THREE.SphereGeometry(0.014, 6, 6);
    const moteColors = [0xf7ffff, 0xbdf2ff, 0xf7d9ff, 0xcfe8ff, 0xf1ffe8, 0xaeefff];
    const moteCount = 6;
    for (let index = 0; index < moteCount; index++) {
      const mote = new THREE.Mesh(
        moteGeometry,
        new THREE.MeshBasicMaterial({
          color: moteColors[index % moteColors.length],
          transparent: true,
          opacity: 0.84,
          fog: false,
          toneMapped: false
        })
      );
      const phase = (index / moteCount) * Math.PI * 2;
      mote.position.set(Math.cos(phase) * 0.18, Math.sin(phase * 1.5) * 0.04, Math.sin(phase) * 0.18);
      mote.userData = {
        glyphComponent: 'quantumStorageMote',
        moteIndex: index,
        baseOrbitPhase: phase,
        orbitPhase: phase,
        orbitRadius: 0.18 + (index % 2) * 0.045,
        orbitSpeed: 0.8 + index * 0.08,
        lockGlyphPosition: true,
        lockGlyphScale: true
      };
      glyphGroup.add(mote);
    }

    const fluxCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.45,
        fog: false,
        toneMapped: false
      })
    );
    fluxCap.userData = {
      glyphComponent: 'quantumStorageFluxCap',
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(fluxCap);

    glyphGroup.scale.setScalar(0.96);
    glyphGroup.position.y = 0.04;
    glyphGroup.userData.lockGlyphPosition = true;
    glyphGroup.userData.lockGlyphScale = true;

    return glyphGroup;
  }

  updateQuantumStorageGlyph(glyphGroup, deltaTime) {
    if (!glyphGroup) return;

    this._applyEvolutionOrbitMotion(glyphGroup, deltaTime);
    glyphGroup.userData.fluxPhase = (glyphGroup.userData.fluxPhase ?? 0) + deltaTime * 0.95;
    const flux = (Math.sin(glyphGroup.userData.fluxPhase) + 1) * 0.5;

    glyphGroup.rotation.z += deltaTime * 0.04;
    glyphGroup.scale.setScalar(0.97 + flux * 0.035);

    glyphGroup.traverse((child) => {
      if (!child.material) return;

      if (child.userData?.glyphComponent === 'quantumStorageCore') {
        child.rotation.y += deltaTime * 0.38;
        child.material.opacity = 0.58 + flux * 0.2;
      }

      if (child.userData?.glyphComponent === 'quantumStorageShell') {
        child.rotation.z += deltaTime * 0.16;
        child.material.opacity = 0.12 + flux * 0.14;
      }

      if (child.userData?.glyphComponent === 'quantumStorageLattice') {
        child.rotation.z -= deltaTime * 0.22;
        child.material.opacity = 0.16 + flux * 0.16;
      }

      if (child.userData?.glyphComponent === 'quantumStorageRingA') {
        child.rotation.x += deltaTime * 0.26;
        child.material.opacity = 0.1 + flux * 0.14;
      }

      if (child.userData?.glyphComponent === 'quantumStorageRingB') {
        child.rotation.y -= deltaTime * 0.2;
        child.material.opacity = 0.08 + flux * 0.12;
      }

      if (child.userData?.glyphComponent === 'quantumStorageMote') {
        const orbitPhase = (child.userData.baseOrbitPhase ?? 0) + glyphGroup.userData.fluxPhase * child.userData.orbitSpeed;
        const orbitRadius = child.userData.orbitRadius + Math.sin(glyphGroup.userData.fluxPhase * 1.35 + child.userData.moteIndex) * 0.015;
        child.position.x = Math.cos(orbitPhase) * orbitRadius;
        child.position.z = Math.sin(orbitPhase) * orbitRadius;
        child.position.y = Math.sin(orbitPhase * 1.7) * 0.05;
        child.material.opacity = 0.5 + flux * 0.3;
        child.scale.setScalar(0.72 + flux * 0.2);
      }

      if (child.userData?.glyphComponent === 'quantumStorageFluxCap') {
        child.rotation.y += deltaTime * 0.52;
        child.material.opacity = 0.22 + flux * 0.26;
      }
    });
  }

  createFoldedImpossibleGlyph() {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphComponent: 'consensusEngineRoot',
      consensusPhase: Math.random() * Math.PI * 2,
      ringPhase: Math.random() * Math.PI * 2,
      filamentPhase: Math.random() * Math.PI * 2,
      lockGlyphPosition: true,
      lockGlyphScale: true
    };

    const makeMaterial = (color, opacity, options = {}) => new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      fog: false,
      toneMapped: false,
      wireframe: options.wireframe ?? false,
      side: options.side ?? THREE.DoubleSide
    });

    const core = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.082, 0),
      makeMaterial(0xf7feff, 0.68, { wireframe: true })
    );
    core.scale.set(1.04, 0.88, 1.08);
    core.rotation.set(Math.PI / 8, Math.PI / 6, Math.PI / 12);
    core.userData = {
      glyphComponent: 'consensusEngineVoidCore',
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(core);

    const primaryRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.165, 0.011, 5, 72),
      makeMaterial(0xa7fbff, 0.36, { wireframe: true })
    );
    primaryRing.rotation.set(Math.PI / 2.45, Math.PI / 7, Math.PI / 4.8);
    primaryRing.userData = {
      glyphComponent: 'consensusEnginePrimaryRing',
      lockGlyphPosition: true,
      lockGlyphScale: true,
      ringIndex: 0,
      baseAxis: new THREE.Vector3(0.24, 0.82, 0.52)
    };
    glyphGroup.add(primaryRing);

    const counterRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.122, 0.008, 5, 60),
      makeMaterial(0xf8f6ff, 0.24, { wireframe: true })
    );
    counterRing.rotation.set(Math.PI / 2.0, -Math.PI / 5.2, Math.PI / 2.7);
    counterRing.userData = {
      glyphComponent: 'consensusEngineCounterRing',
      lockGlyphPosition: true,
      lockGlyphScale: true,
      ringIndex: 1,
      baseAxis: new THREE.Vector3(-0.46, 0.58, 0.67)
    };
    glyphGroup.add(counterRing);

    const bridgeGeometry = new THREE.BufferGeometry();
    const bridgeMaterial = new THREE.LineBasicMaterial({
      color: 0xbfefff,
      transparent: true,
      opacity: 0.52,
      fog: false
    });
    const bridgeLayouts = [
      [
        new THREE.Vector3(-0.15, 0.03, 0.02),
        new THREE.Vector3(-0.04, 0.14, 0.06),
        new THREE.Vector3(0.06, 0.06, 0.01),
        new THREE.Vector3(0.14, -0.03, -0.03),
      ],
      [
        new THREE.Vector3(0.1, 0.12, -0.01),
        new THREE.Vector3(0.02, 0.04, 0.08),
        new THREE.Vector3(-0.08, -0.08, 0.02),
        new THREE.Vector3(-0.18, -0.02, -0.04),
      ],
      [
        new THREE.Vector3(0.06, -0.14, 0.04),
        new THREE.Vector3(-0.04, -0.04, -0.09),
        new THREE.Vector3(0.02, 0.11, -0.05),
        new THREE.Vector3(0.12, 0.02, 0.03),
      ]
    ];
    bridgeLayouts.forEach((points, index) => {
      const geometry = bridgeGeometry.clone();
      geometry.setFromPoints([...points, points[0]]);
      const filament = new THREE.Line(geometry, bridgeMaterial.clone());
      filament.rotation.set(index * 0.26, (index - 1) * 0.48, index * -0.12);
      filament.userData = {
        glyphComponent: 'consensusEngineFilament',
        filamentIndex: index,
        lockGlyphPosition: true,
        lockGlyphScale: true,
        basePoints: points.map((p) => p.clone())
      };
      glyphGroup.add(filament);
    });

    const shardGeometry = new THREE.ConeGeometry(0.022, 0.11, 4);
    const shardLayouts = [
      { position: [0.19, 0.04, -0.05], rotation: [Math.PI * 0.52, Math.PI / 4, Math.PI / 6], color: 0xe5ffff },
      { position: [-0.1, -0.12, 0.07], rotation: [Math.PI * 0.48, -Math.PI / 5, Math.PI / 3], color: 0xcfb8ff },
      { position: [0.03, 0.16, 0.02], rotation: [Math.PI * 0.44, Math.PI / 8, -Math.PI / 2.3], color: 0xfff7d8 }
    ];
    shardLayouts.forEach((entry, index) => {
      const shard = new THREE.Mesh(
        shardGeometry,
        makeMaterial(entry.color, 0.58 - index * 0.06)
      );
      shard.position.set(entry.position[0], entry.position[1], entry.position[2]);
      shard.rotation.set(entry.rotation[0], entry.rotation[1], entry.rotation[2]);
      shard.scale.set(1.0, 1.0 + index * 0.12, 1.0);
      shard.userData = {
        glyphComponent: 'consensusEngineShard',
        shardIndex: index,
        basePosition: new THREE.Vector3(...entry.position),
        lockGlyphPosition: true,
        lockGlyphScale: true
      };
      glyphGroup.add(shard);
    });

    const frameGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.17, 0.11, -0.05),
      new THREE.Vector3(-0.02, 0.24, 0.05),
      new THREE.Vector3(0.16, 0.09, 0.03),
      new THREE.Vector3(0.12, -0.13, 0.07),
      new THREE.Vector3(-0.08, -0.22, -0.04),
      new THREE.Vector3(-0.22, -0.02, -0.03),
      new THREE.Vector3(-0.17, 0.11, -0.05)
    ]);
    const frame = new THREE.Line(
      frameGeometry,
      new THREE.LineBasicMaterial({
        color: 0x88f2ff,
        transparent: true,
        opacity: 0.46,
        fog: false
      })
    );
    frame.rotation.set(-Math.PI / 11, Math.PI / 6.8, Math.PI / 9.5);
    frame.userData = {
      glyphComponent: 'consensusEngineFrame',
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(frame);

    glyphGroup.scale.setScalar(0.98);
    glyphGroup.position.y = 0.08;
    glyphGroup.userData.lockGlyphPosition = true;
    glyphGroup.userData.lockGlyphScale = true;

    return glyphGroup;
  }

  updateFoldedImpossibleGlyph(glyphGroup, deltaTime) {
    if (!glyphGroup) return;

    glyphGroup.userData.consensusPhase = (glyphGroup.userData.consensusPhase ?? 0) + deltaTime * 0.98;
    glyphGroup.userData.ringPhase = (glyphGroup.userData.ringPhase ?? 0) + deltaTime * 0.76;
    glyphGroup.userData.filamentPhase = (glyphGroup.userData.filamentPhase ?? 0) + deltaTime * 1.08;

    const consensusPhase = glyphGroup.userData.consensusPhase;
    const ringPhase = glyphGroup.userData.ringPhase;
    const filamentPhase = glyphGroup.userData.filamentPhase;
    const consensusLock = (Math.sin(consensusPhase * 1.18) + 1) * 0.5;
    const judgmentSnap = Math.pow((Math.sin(consensusPhase * 0.47 + 0.8) + 1) * 0.5, 2.2);

    glyphGroup.rotation.y += deltaTime * 0.28;
    glyphGroup.rotation.x += Math.sin(consensusPhase * 0.42) * deltaTime * 0.06;
    glyphGroup.rotation.z = Math.sin(consensusPhase * 0.31) * 0.04;
    glyphGroup.scale.setScalar(0.96 + consensusLock * 0.07 + judgmentSnap * 0.02);

    glyphGroup.traverse((child) => {
      if (!child.material) return;

      if (child.userData?.glyphComponent === 'consensusEngineVoidCore') {
        child.rotation.y += deltaTime * 0.36;
        child.rotation.x += deltaTime * 0.22;
        child.rotation.z += deltaTime * 0.12;
        child.scale.setScalar(1.0 + consensusLock * 0.06);
        child.material.opacity = 0.5 + consensusLock * 0.28 + judgmentSnap * 0.1;
      }

      if (child.userData?.glyphComponent === 'consensusEnginePrimaryRing') {
        child.rotation.z += deltaTime * 0.76;
        child.rotation.x += deltaTime * 0.18;
        child.rotation.y -= deltaTime * 0.14;
        child.material.opacity = 0.24 + consensusLock * 0.2 + judgmentSnap * 0.08;
      }

      if (child.userData?.glyphComponent === 'consensusEngineCounterRing') {
        child.rotation.z -= deltaTime * 0.62;
        child.rotation.x += deltaTime * 0.24;
        child.rotation.y += deltaTime * 0.16;
        child.material.opacity = 0.18 + consensusLock * 0.18 + judgmentSnap * 0.06;
      }

      if (child.userData?.glyphComponent === 'consensusEngineFilament') {
        const filamentPulse = (Math.sin(filamentPhase + child.userData.filamentIndex * 1.3) + 1) * 0.5;
        const basePoints = child.userData.basePoints || [];
        const displaced = basePoints.map((point, pointIndex) => {
          const localPhase = filamentPhase * (0.84 + pointIndex * 0.08) + child.userData.filamentIndex * 0.6;
          const offset = 0.018 + filamentPulse * 0.022;
          return new THREE.Vector3(
            point.x + Math.sin(localPhase * 1.12) * offset,
            point.y + Math.cos(localPhase * 0.91) * offset * 0.72,
            point.z + Math.sin(localPhase * 1.37) * offset * 0.8
          );
        });
        if (child.geometry?.setFromPoints) {
          child.geometry.setFromPoints([...displaced, displaced[0]]);
          child.geometry.attributes.position.needsUpdate = true;
        }
        child.rotation.z += deltaTime * (0.12 + child.userData.filamentIndex * 0.04);
        child.material.opacity = 0.28 + filamentPulse * 0.28 + consensusLock * 0.1;
      }

      if (child.userData?.glyphComponent === 'consensusEngineShard') {
        const shardPhase = ringPhase + child.userData.shardIndex * 1.12;
        const radius = 0.15 + Math.sin(shardPhase * 1.5) * 0.02 + consensusLock * 0.015;
        child.position.x = Math.cos(shardPhase) * radius;
        child.position.z = Math.sin(shardPhase) * radius;
        child.position.y = child.userData.basePosition.y + Math.sin(shardPhase * 1.3) * 0.04;
        child.rotation.y = shardPhase + Math.PI / 5;
        child.rotation.x = Math.PI * 0.5 + Math.sin(shardPhase) * 0.16;
        child.rotation.z += deltaTime * 0.08;
        child.scale.setScalar(0.92 + consensusLock * 0.16);
        child.material.opacity = 0.34 + consensusLock * 0.22 + judgmentSnap * 0.12;
      }

      if (child.userData?.glyphComponent === 'consensusEngineFrame') {
        child.rotation.z += deltaTime * 0.14;
        child.rotation.y += deltaTime * 0.08;
        child.material.opacity = 0.34 + consensusLock * 0.18 + judgmentSnap * 0.09;
      }
    });
  }

  createHarmonicCellGlyph() {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphComponent: 'livingSignalDeityRoot',
      signalPhase: Math.random() * Math.PI * 2,
      haloPhase: Math.random() * Math.PI * 2,
      membranePhase: Math.random() * Math.PI * 2,
      lockGlyphPosition: true,
      lockGlyphScale: true
    };

    const makeMaterial = (color, opacity, options = {}) => new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      fog: false,
      toneMapped: false,
      wireframe: options.wireframe ?? false,
      side: options.side ?? THREE.DoubleSide
    });

    const beacon = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.08, 0),
      makeMaterial(0xf8ffff, 0.86, { wireframe: true })
    );
    beacon.scale.set(0.96, 1.08, 0.92);
    beacon.rotation.set(Math.PI / 10, Math.PI / 8, Math.PI / 12);
    beacon.userData = {
      glyphComponent: 'livingSignalDeityBeacon',
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(beacon);

    const haloA = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.009, 6, 72),
      makeMaterial(0xb8fbff, 0.44, { wireframe: true })
    );
    haloA.rotation.set(Math.PI / 2.65, Math.PI / 7, Math.PI / 5.2);
    haloA.userData = {
      glyphComponent: 'livingSignalDeityHalo',
      haloIndex: 0,
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(haloA);

    const haloB = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.007, 6, 84),
      makeMaterial(0xffe1aa, 0.24, { wireframe: true })
    );
    haloB.rotation.set(Math.PI / 2.1, -Math.PI / 6.2, Math.PI / 3.8);
    haloB.userData = {
      glyphComponent: 'livingSignalDeityHalo',
      haloIndex: 1,
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(haloB);

    const membraneGeometry = new THREE.PlaneGeometry(0.14, 0.28, 1, 1);
    const membraneLayouts = [
      { position: [0.0, 0.14, 0.03], rotation: [0.1, 0.5, 0.2], color: 0xf7ffff },
      { position: [0.12, -0.02, -0.05], rotation: [0.4, 1.22, -0.16], color: 0xb9f6ff },
      { position: [-0.11, -0.06, 0.06], rotation: [-0.34, -0.72, 0.24], color: 0xffedc6 },
      { position: [0.03, 0.0, -0.1], rotation: [0.28, 0.15, 1.02], color: 0xdab7ff }
    ];
    membraneLayouts.forEach((entry, index) => {
      const membrane = new THREE.Mesh(
        membraneGeometry,
        makeMaterial(entry.color, 0.34 - index * 0.02)
      );
      membrane.position.set(entry.position[0], entry.position[1], entry.position[2]);
      membrane.rotation.set(entry.rotation[0], entry.rotation[1], entry.rotation[2]);
      membrane.scale.set(1.0 + index * 0.08, 0.88 + index * 0.05, 1.0);
      membrane.userData = {
        glyphComponent: 'livingSignalDeityMembrane',
        membraneIndex: index,
        basePosition: new THREE.Vector3(...entry.position),
        baseRotation: new THREE.Vector3(...entry.rotation),
        lockGlyphPosition: true,
        lockGlyphScale: true
      };
      glyphGroup.add(membrane);
    });

    const ribLayouts = [
      [
        new THREE.Vector3(0.0, 0.08, 0.0),
        new THREE.Vector3(0.08, 0.18, 0.02),
        new THREE.Vector3(0.16, 0.24, 0.08)
      ],
      [
        new THREE.Vector3(0.0, 0.08, 0.0),
        new THREE.Vector3(-0.08, 0.16, 0.04),
        new THREE.Vector3(-0.18, 0.22, -0.02)
      ],
      [
        new THREE.Vector3(0.0, 0.08, 0.0),
        new THREE.Vector3(0.06, -0.02, -0.08),
        new THREE.Vector3(0.15, -0.08, -0.11)
      ]
    ];
    ribLayouts.forEach((points, index) => {
      const rib = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: index === 2 ? 0xffe9b2 : 0xdffcff,
          transparent: true,
          opacity: 0.48,
          fog: false
        })
      );
      rib.rotation.set(index * 0.18, (index - 1) * 0.28, index * 0.12);
      rib.userData = {
        glyphComponent: 'livingSignalDeityRib',
        ribIndex: index,
        lockGlyphPosition: true,
        lockGlyphScale: true
      };
      glyphGroup.add(rib);
    });

    const crownSpikeGeometry = new THREE.ConeGeometry(0.026, 0.14, 5);
    const crownSpikeLayouts = [
      { position: [0.0, 0.24, 0.0], rotation: [0.0, 0.0, 0.0], color: 0xffffff },
      { position: [0.1, 0.16, 0.04], rotation: [0.1, 0.54, 0.2], color: 0xb8fbff },
      { position: [-0.11, 0.12, -0.04], rotation: [-0.18, -0.66, -0.1], color: 0xffe1aa }
    ];
    crownSpikeLayouts.forEach((entry, index) => {
      const spike = new THREE.Mesh(
        crownSpikeGeometry,
        makeMaterial(entry.color, 0.48 - index * 0.04)
      );
      spike.position.set(entry.position[0], entry.position[1], entry.position[2]);
      spike.rotation.set(entry.rotation[0], entry.rotation[1], entry.rotation[2]);
      spike.scale.set(1.0, 1.0 + index * 0.16, 1.0);
      spike.userData = {
        glyphComponent: 'livingSignalDeityCrown',
        crownIndex: index,
        basePosition: new THREE.Vector3(...entry.position),
        lockGlyphPosition: true,
        lockGlyphScale: true
      };
      glyphGroup.add(spike);
    });

    glyphGroup.scale.setScalar(0.95);
    glyphGroup.position.y = 0.04;
    glyphGroup.userData.lockGlyphPosition = true;
    glyphGroup.userData.lockGlyphScale = true;

    return glyphGroup;
  }

  createHelicalTrinityGlyph() {
    const glyphGroup = new THREE.Group();

    const armGeometry = new THREE.CylinderGeometry(0.022, 0.036, 0.26, 6, 1, false);
    const tipGeometry = new THREE.OctahedronGeometry(0.042, 0);

    const makeArmMaterial = (color, opacity) => new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      fog: false,
      toneMapped: false
    });

    const armColors = [0xd8f9ff, 0x8af0ff, 0xd7b6ff];

    for (let index = 0; index < 3; index++) {
      const armGroup = new THREE.Group();
      armGroup.userData = {
        glyphComponent: 'helicalTrinityArm',
        armIndex: index,
        lockGlyphPosition: true,
        lockGlyphScale: true,
        basePhase: (index / 3) * Math.PI * 2
      };

      const armMesh = new THREE.Mesh(
        armGeometry,
        makeArmMaterial(armColors[index], 0.78)
      );
      armMesh.rotation.z = Math.PI / 2;
      armMesh.userData = {
        glyphComponent: 'helicalTrinityBeam',
        lockGlyphPosition: true,
        lockGlyphScale: true
      };
      armGroup.add(armMesh);

      const tip = new THREE.Mesh(
        tipGeometry,
        makeArmMaterial(0xf6fcff, 0.72)
      );
      tip.position.x = 0.16;
      tip.scale.set(0.65, 1.0, 0.65);
      tip.userData = {
        glyphComponent: 'helicalTrinityTip',
        lockGlyphPosition: true,
        lockGlyphScale: true
      };
      armGroup.add(tip);

      const trailGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.14, 0.0, 0.0),
        new THREE.Vector3(-0.04, 0.06, 0.0),
        new THREE.Vector3(0.08, 0.03, 0.0),
        new THREE.Vector3(0.17, -0.015, 0.0)
      ]);
      const trail = new THREE.Line(
        trailGeometry,
        new THREE.LineBasicMaterial({
          color: armColors[index],
          transparent: true,
          opacity: 0.5,
          fog: false
        })
      );
      trail.userData = {
        glyphComponent: 'helicalTrinityTrail',
        lockGlyphPosition: true,
        lockGlyphScale: true
      };
      armGroup.add(trail);

      glyphGroup.add(armGroup);
    }

    const haloGeometry = new THREE.TorusGeometry(0.18, 0.006, 6, 48, Math.PI * 1.6);
    const halo = new THREE.Mesh(
      haloGeometry,
      new THREE.MeshBasicMaterial({
        color: 0xc6fbff,
        transparent: true,
        opacity: 0.24,
        fog: false,
        wireframe: true
      })
    );
    halo.rotation.set(Math.PI / 2.7, Math.PI / 5, 0);
    halo.userData = {
      glyphComponent: 'helicalTrinityHalo',
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(halo);

    glyphGroup.scale.setScalar(0.95);
    glyphGroup.position.y = 0.04;
    glyphGroup.userData.lockGlyphPosition = true;
    glyphGroup.userData.lockGlyphScale = true;

    return glyphGroup;
  }

  createResonanceCrownFragmentGlyph() {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphComponent: 'alienIntelligenceOrganRoot',
      organPhase: Math.random() * Math.PI * 2,
      lobePhase: Math.random() * Math.PI * 2,
      tendrilPhase: Math.random() * Math.PI * 2,
      lockGlyphPosition: true,
      lockGlyphScale: true
    };

    const makeMaterial = (color, opacity, options = {}) => new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      fog: false,
      toneMapped: false,
      wireframe: options.wireframe ?? false,
      side: options.side ?? THREE.DoubleSide
    });

    const core = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.092, 0),
      makeMaterial(0xf4fff8, 0.72, { wireframe: true })
    );
    core.scale.set(1.02, 0.86, 1.08);
    core.rotation.set(Math.PI / 7, Math.PI / 6, Math.PI / 11);
    core.userData = {
      glyphComponent: 'alienOrganCore',
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(core);

    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(0.158, 8, 8),
      makeMaterial(0xd7fcff, 0.28, { wireframe: true })
    );
    shell.scale.set(1.2, 0.84, 1.08);
    shell.rotation.set(Math.PI / 8, -Math.PI / 5, Math.PI / 9);
    shell.userData = {
      glyphComponent: 'alienOrganShell',
      lockGlyphPosition: true,
      lockGlyphScale: true
    };
    glyphGroup.add(shell);

    const lobeGeometry = new THREE.SphereGeometry(0.064, 7, 7);
    const lobeLayouts = [
      { position: [0.14, 0.06, 0.03], scale: [1.0, 1.15, 0.9], color: 0xb9f7ff },
      { position: [-0.11, -0.02, -0.06], scale: [0.92, 1.05, 1.0], color: 0xf8e2ff },
      { position: [0.02, -0.12, 0.1], scale: [1.08, 0.9, 0.95], color: 0xe9fff4 }
    ];
    lobeLayouts.forEach((entry, index) => {
      const lobe = new THREE.Mesh(
        lobeGeometry,
        makeMaterial(entry.color, 0.46 - index * 0.03)
      );
      lobe.position.set(entry.position[0], entry.position[1], entry.position[2]);
      lobe.scale.set(entry.scale[0], entry.scale[1], entry.scale[2]);
      lobe.userData = {
        glyphComponent: 'alienOrganLobe',
        lobeIndex: index,
        basePosition: new THREE.Vector3(...entry.position),
        lockGlyphPosition: true,
        lockGlyphScale: true
      };
      glyphGroup.add(lobe);
    });

    const spineGeometry = new THREE.ConeGeometry(0.022, 0.15, 4);
    const spineLayouts = [
      { position: [0.19, 0.12, -0.02], rotation: [Math.PI * 0.48, Math.PI / 4.4, Math.PI / 6], color: 0xdffcff },
      { position: [-0.16, 0.08, 0.05], rotation: [Math.PI * 0.42, -Math.PI / 5.2, -Math.PI / 7], color: 0xffdeff },
      { position: [0.03, 0.18, 0.11], rotation: [Math.PI * 0.52, Math.PI / 7, Math.PI / 2.8], color: 0xfff0b8 },
      { position: [-0.05, -0.04, -0.13], rotation: [Math.PI * 0.38, -Math.PI / 3.2, Math.PI / 11], color: 0xb0f0ff }
    ];
    spineLayouts.forEach((entry, index) => {
      const spine = new THREE.Mesh(
        spineGeometry,
        makeMaterial(entry.color, 0.52 - index * 0.04)
      );
      spine.position.set(entry.position[0], entry.position[1], entry.position[2]);
      spine.rotation.set(entry.rotation[0], entry.rotation[1], entry.rotation[2]);
      spine.scale.set(1.0, 1.0 + index * 0.14, 1.0);
      spine.userData = {
        glyphComponent: 'alienOrganSpine',
        spineIndex: index,
        basePosition: new THREE.Vector3(...entry.position),
        baseRotationX: entry.rotation[0],
        baseRotationY: entry.rotation[1],
        lockGlyphPosition: true,
        lockGlyphScale: true
      };
      glyphGroup.add(spine);
    });

    const noduleGeometry = new THREE.SphereGeometry(0.028, 6, 6);
    const noduleLayouts = [
      { position: [0.08, 0.01, 0.15], scale: 1.0, color: 0xf6fff9 },
      { position: [-0.14, -0.08, 0.06], scale: 0.92, color: 0xcdfcff },
      { position: [0.05, 0.14, -0.08], scale: 1.06, color: 0xffe3f4 },
      { position: [0.16, -0.03, -0.05], scale: 0.88, color: 0xe5fff0 }
    ];
    noduleLayouts.forEach((entry, index) => {
      const nodule = new THREE.Mesh(
        noduleGeometry,
        makeMaterial(entry.color, 0.58 - index * 0.04)
      );
      nodule.position.set(entry.position[0], entry.position[1], entry.position[2]);
      nodule.scale.setScalar(entry.scale);
      nodule.userData = {
        glyphComponent: 'alienOrganNodule',
        noduleIndex: index,
        basePosition: new THREE.Vector3(...entry.position),
        lockGlyphPosition: true,
        lockGlyphScale: true
      };
      glyphGroup.add(nodule);
    });

    const tendrilLayouts = [
      [
        new THREE.Vector3(0.0, 0.04, 0.0),
        new THREE.Vector3(0.09, 0.12, 0.02),
        new THREE.Vector3(0.17, 0.18, 0.06),
        new THREE.Vector3(0.23, 0.16, 0.1)
      ],
      [
        new THREE.Vector3(0.0, 0.04, 0.0),
        new THREE.Vector3(-0.08, 0.14, -0.03),
        new THREE.Vector3(-0.16, 0.19, -0.07),
        new THREE.Vector3(-0.24, 0.2, -0.04)
      ],
      [
        new THREE.Vector3(0.0, -0.02, 0.0),
        new THREE.Vector3(0.07, -0.1, 0.05),
        new THREE.Vector3(0.15, -0.16, 0.08),
        new THREE.Vector3(0.22, -0.2, 0.14)
      ]
    ];
    tendrilLayouts.forEach((points, index) => {
      const tendril = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: index === 2 ? 0xffd9a5 : 0xd9fbff,
          transparent: true,
          opacity: 0.46,
          fog: false
        })
      );
      tendril.rotation.set(index * 0.16, (index - 1) * 0.32, index * -0.08);
      tendril.userData = {
        glyphComponent: 'alienOrganTendril',
        tendrilIndex: index,
        basePoints: points.map((point) => point.clone()),
        lockGlyphPosition: true,
        lockGlyphScale: true
      };
      glyphGroup.add(tendril);
    });

    glyphGroup.scale.setScalar(1.0);
    glyphGroup.position.y = 0.06;
    glyphGroup.userData.lockGlyphPosition = true;
    glyphGroup.userData.lockGlyphScale = true;

    return glyphGroup;
  }

  resolveEvolutionStage(node) {
    const explicitStage = Number(node?.userData?.evolutionStage);
    if (Number.isFinite(explicitStage) && explicitStage >= 1) {
      return Math.max(1, Math.min(4, Math.round(explicitStage)));
    }

    const tierStage = Number(node?.userData?.evolutionTier);
    if (Number.isFinite(tierStage) && tierStage >= 1) {
      return Math.max(1, Math.min(4, Math.round(tierStage)));
    }

    return 1;
  }

  syncEvolutionGlyphStage(node, nodeId, container, currentEvolutionGlyph) {
    if (!node || !nodeId || !container || !currentEvolutionGlyph) {
      return currentEvolutionGlyph;
    }

    const targetKey = this.resolveEvolutionGlyphKey(node);
    const currentKey = currentEvolutionGlyph.userData?.glyphKey || currentEvolutionGlyph.userData?.glyphVariant || null;
    if (targetKey === currentKey) {
      return currentEvolutionGlyph;
    }

    const replacementGlyph = this.createEvolutionGlyph(node, nodeId);
    if (!replacementGlyph) {
      return currentEvolutionGlyph;
    }

    const preservedOrbitPhase = Number(currentEvolutionGlyph.userData?.orbitPhase);
    if (Number.isFinite(preservedOrbitPhase)) {
      replacementGlyph.userData.orbitPhase = preservedOrbitPhase;
    }

    const preservedRotationY = currentEvolutionGlyph.rotation?.y;
    if (Number.isFinite(preservedRotationY)) {
      replacementGlyph.rotation.y = preservedRotationY;
    }

    container.remove(currentEvolutionGlyph);
    this._safeAttachGlyph(replacementGlyph, 'GLYPH_LAYER', container, node);
    this._tuneGlyphVisibility(replacementGlyph);

    return replacementGlyph;
  }
  
  updateEvolutionGlyph(evoGroup, deltaTime) {
    if (!evoGroup) return;

    const glyphKey = evoGroup.userData?.glyphKey || evoGroup.userData?.glyphVariant || '';

    this._applyEvolutionOrbitMotion(evoGroup, deltaTime);

    if (glyphKey === 'primeMythic') {
      this.updatePrimeMythicGlyph(evoGroup, deltaTime);
      return;
    }

    if (glyphKey === 'quantumStorage') {
      this.updateQuantumStorageGlyph(evoGroup, deltaTime);
      return;
    }

    if (evoGroup.userData.stage === 1) {
      this.updateFoldedImpossibleGlyph(evoGroup, deltaTime);
      return;
    }
    
    if (evoGroup.userData.stage === 2) {
      evoGroup.userData.signalPhase = (evoGroup.userData.signalPhase ?? 0) + deltaTime * 1.42;
      evoGroup.userData.haloPhase = (evoGroup.userData.haloPhase ?? 0) + deltaTime * 0.92;
      evoGroup.userData.membranePhase = (evoGroup.userData.membranePhase ?? 0) + deltaTime * 1.08;
      const signalPhase = evoGroup.userData.signalPhase;
      const haloPhase = evoGroup.userData.haloPhase;
      const membranePhase = evoGroup.userData.membranePhase;
      const signalPulse = (Math.sin(signalPhase * 1.1) + 1) * 0.5;
      const haloLock = (Math.sin(haloPhase * 0.74 + 0.6) + 1) * 0.5;
      const consecration = Math.pow((Math.sin(signalPhase * 0.36) + 1) * 0.5, 1.7);

      evoGroup.rotation.x = Math.sin(signalPhase * 0.28) * 0.045;
      evoGroup.rotation.z = Math.cos(signalPhase * 0.24) * 0.035;
      evoGroup.rotation.y += deltaTime * 0.26;
      evoGroup.scale.setScalar(0.95 + signalPulse * 0.04 + haloLock * 0.02);

      evoGroup.traverse((child) => {
        if (child.userData?.glyphComponent === 'livingSignalDeityBeacon') {
          child.rotation.y += deltaTime * 0.42;
          child.rotation.x += deltaTime * 0.2;
          child.scale.setScalar(0.92 + signalPulse * 0.16 + haloLock * 0.08);
          child.material.opacity = 0.64 + signalPulse * 0.28;
          child.material.color.setHex(consecration > 0.58 ? 0xffe3aa : 0xf8ffff);
        }

        if (child.userData?.glyphComponent === 'livingSignalDeityHalo') {
          const haloIndex = child.userData.haloIndex ?? 0;
          const haloSpin = haloIndex === 0 ? 0.72 : -0.48;
          child.rotation.z += deltaTime * haloSpin;
          child.rotation.x += deltaTime * (haloIndex === 0 ? 0.12 : 0.18);
          child.rotation.y += deltaTime * (haloIndex === 0 ? 0.08 : -0.06);
          child.scale.setScalar(1.0 + haloLock * 0.05 + haloIndex * 0.04);
          child.material.opacity = (haloIndex === 0 ? 0.28 : 0.12) + haloLock * (haloIndex === 0 ? 0.22 : 0.14);
          child.material.color.setHex(consecration > 0.7 && haloIndex === 1 ? 0xffe6b0 : (haloIndex === 0 ? 0xb8fbff : 0xffe1aa));
        }

        if (child.userData?.glyphComponent === 'livingSignalDeityMembrane') {
          const membraneIndex = child.userData.membraneIndex ?? 0;
          const membranePulse = (Math.sin(membranePhase + membraneIndex * 0.78) + 1) * 0.5;
          const basePosition = child.userData.basePosition || new THREE.Vector3();
          const baseRotation = child.userData.baseRotation || new THREE.Vector3();
          child.position.x = basePosition.x + Math.sin(membranePhase * 0.72 + membraneIndex) * 0.03;
          child.position.y = basePosition.y + Math.cos(membranePhase * 0.64 + membraneIndex * 0.7) * 0.028;
          child.position.z = basePosition.z + Math.sin(membranePhase * 0.88 + membraneIndex * 0.5) * 0.022;
          child.rotation.x = baseRotation.x + Math.sin(membranePhase * 0.6 + membraneIndex) * 0.2;
          child.rotation.y = baseRotation.y + Math.cos(membranePhase * 0.54 + membraneIndex * 0.2) * 0.18;
          child.rotation.z = baseRotation.z + Math.sin(membranePhase * 0.48 + membraneIndex * 0.4) * 0.12;
          child.scale.set(
            0.96 + membranePulse * 0.18,
            0.9 + membranePulse * 0.14,
            1.0 + membranePulse * 0.08
          );
          child.material.opacity = 0.18 + membranePulse * 0.24 + haloLock * 0.06;
          child.material.color.setHex(membraneIndex === 2 && consecration > 0.65 ? 0xffe6aa : (membraneIndex === 3 ? 0xdab7ff : 0xb9f6ff));
        }

        if (child.userData?.glyphComponent === 'livingSignalDeityRib') {
          const ribIndex = child.userData.ribIndex ?? 0;
          const ribPulse = (Math.sin(signalPhase * 1.16 + ribIndex * 0.88) + 1) * 0.5;
          child.rotation.x += deltaTime * (0.12 + ribIndex * 0.03);
          child.rotation.z += deltaTime * (0.08 - ribIndex * 0.02);
          child.material.opacity = 0.24 + ribPulse * 0.28 + consecration * 0.12;
        }

        if (child.userData?.glyphComponent === 'livingSignalDeityCrown') {
          const crownIndex = child.userData.crownIndex ?? 0;
          const crownPulse = (Math.sin(haloPhase + crownIndex * 0.9) + 1) * 0.5;
          const basePosition = child.userData.basePosition || new THREE.Vector3();
          child.position.x = basePosition.x + Math.sin(haloPhase + crownIndex) * 0.02;
          child.position.y = basePosition.y + Math.cos(haloPhase + crownIndex * 0.6) * 0.02;
          child.position.z = basePosition.z + Math.sin(haloPhase + crownIndex * 0.8) * 0.02;
          child.rotation.z += deltaTime * (0.16 + crownIndex * 0.05);
          child.rotation.y += deltaTime * 0.08;
          child.scale.setScalar(1.0 + crownPulse * 0.16);
          child.material.opacity = 0.28 + crownPulse * 0.22 + consecration * 0.12;
          child.material.color.setHex(consecration > 0.72 ? 0xffe3a4 : 0xfff3d8);
        }
      });
    }

    if (evoGroup.userData.stage === 3) {
      evoGroup.userData.trinityPhase += deltaTime * 1.35;
      const phase = evoGroup.userData.trinityPhase;
      const lockWindow = (Math.sin(phase * 0.75) + 1) * 0.5;

      evoGroup.rotation.x = Math.sin(phase * 0.35) * 0.03;
      evoGroup.rotation.z = Math.cos(phase * 0.42) * 0.04;
      evoGroup.scale.setScalar(0.95 + lockWindow * 0.025);

      evoGroup.traverse((child) => {
        if (child.userData?.glyphComponent === 'helicalTrinityArm') {
          const armPhase = phase + child.userData.basePhase;
          const helicalRadius = 0.14 + lockWindow * 0.03;
          child.position.x = Math.cos(armPhase) * helicalRadius;
          child.position.z = Math.sin(armPhase) * helicalRadius;
          child.position.y = Math.sin(armPhase * 1.4) * 0.08;
          child.rotation.z = armPhase + Math.PI / 2;
          child.rotation.x = 0.25 + Math.sin(armPhase) * 0.35;
        }

        if (child.userData?.glyphComponent === 'helicalTrinityBeam') {
          child.material.opacity = 0.56 + lockWindow * 0.26;
        }

        if (child.userData?.glyphComponent === 'helicalTrinityTrail') {
          child.material.opacity = 0.28 + lockWindow * 0.3;
        }

        if (child.userData?.glyphComponent === 'helicalTrinityTip') {
          const tipScale = 0.68 + lockWindow * 0.2;
          child.scale.set(tipScale * 0.65, tipScale, tipScale * 0.65);
          child.material.opacity = 0.5 + lockWindow * 0.3;
        }

        if (child.userData?.glyphComponent === 'helicalTrinityHalo') {
          child.rotation.z += deltaTime * 0.45;
          child.material.opacity = 0.14 + lockWindow * 0.18;
        }
      });
    }

    if (evoGroup.userData.stage === 4) {
      evoGroup.userData.organPhase = (evoGroup.userData.organPhase ?? 0) + deltaTime * 1.12;
      evoGroup.userData.nodulePhase = (evoGroup.userData.nodulePhase ?? 0) + deltaTime * 0.82;
      const organPhase = evoGroup.userData.organPhase;
      const nodulePhase = evoGroup.userData.nodulePhase;
      const organPulse = (Math.sin(organPhase * 1.14) + 1) * 0.5;
      const tissueBreath = (Math.sin(organPhase * 0.58 + 0.7) + 1) * 0.5;
      const corruptionWave = Math.pow((Math.sin(organPhase * 0.31 + 1.2) + 1) * 0.5, 1.8);

      evoGroup.rotation.x = Math.sin(organPhase * 0.24) * 0.04;
      evoGroup.rotation.z = Math.cos(organPhase * 0.29) * 0.035;
      evoGroup.rotation.y += deltaTime * 0.2;
      evoGroup.scale.setScalar(0.94 + organPulse * 0.06 + tissueBreath * 0.02);

      evoGroup.traverse((child) => {
        const material = Array.isArray(child.material) ? child.material[0] : child.material;
        if (!material) return;

        if (child.userData?.glyphComponent === 'alienOrganCore') {
          child.rotation.y += deltaTime * 0.28;
          child.rotation.x += deltaTime * 0.16;
          child.scale.setScalar(0.92 + organPulse * 0.12);
          material.opacity = 0.58 + organPulse * 0.24;
          material.color?.setHex?.(corruptionWave > 0.64 ? 0xff8fd1 : 0xf7fff8);
        }

        if (child.userData?.glyphComponent === 'alienOrganShell') {
          child.rotation.y -= deltaTime * 0.18;
          child.rotation.z += deltaTime * 0.1;
          child.scale.set(
            1.0 + tissueBreath * 0.08,
            0.92 + organPulse * 0.06,
            1.0 + tissueBreath * 0.06
          );
          material.opacity = 0.18 + organPulse * 0.18;
        }

        if (child.userData?.glyphComponent === 'alienOrganLobe') {
          const lobeIndex = child.userData.lobeIndex ?? 0;
          const lobePulse = (Math.sin(nodulePhase + lobeIndex * 1.24) + 1) * 0.5;
          const basePosition = child.userData.basePosition || new THREE.Vector3();
          child.position.x = basePosition.x + Math.sin(organPhase * 0.66 + lobeIndex) * 0.026;
          child.position.y = basePosition.y + Math.cos(organPhase * 0.54 + lobeIndex * 0.7) * 0.024;
          child.position.z = basePosition.z + Math.sin(organPhase * 0.48 + lobeIndex * 0.5) * 0.024;
          child.rotation.y += deltaTime * (0.08 + lobeIndex * 0.02);
          child.rotation.z += deltaTime * 0.06;
          child.scale.setScalar(0.9 + lobePulse * 0.2);
          material.opacity = 0.26 + lobePulse * 0.2;
          material.color?.setHex?.(lobeIndex === 1 && corruptionWave > 0.55 ? 0xff6fbd : 0xc9f2ff);
        }

        if (child.userData?.glyphComponent === 'alienOrganSpine') {
          const spineIndex = child.userData.spineIndex ?? 0;
          const spinePulse = (Math.sin(organPhase * 1.06 + spineIndex * 0.84) + 1) * 0.5;
          child.rotation.x = child.userData.baseRotationX + Math.sin(organPhase * 0.92 + spineIndex) * 0.14;
          child.rotation.y = child.userData.baseRotationY + Math.cos(organPhase * 0.78 + spineIndex * 0.5) * 0.12;
          child.rotation.z += deltaTime * (0.12 + spineIndex * 0.02);
          child.position.x = child.userData.basePosition.x + Math.sin(organPhase * 0.72 + spineIndex) * 0.018;
          child.position.y = child.userData.basePosition.y + Math.cos(organPhase * 0.66 + spineIndex * 0.4) * 0.018;
          child.position.z = child.userData.basePosition.z + Math.sin(organPhase * 0.58 + spineIndex * 0.7) * 0.018;
          child.scale.setScalar(0.92 + spinePulse * 0.2);
          material.opacity = 0.34 + spinePulse * 0.24 + corruptionWave * 0.08;
        }

        if (child.userData?.glyphComponent === 'alienOrganNodule') {
          const noduleIndex = child.userData.noduleIndex ?? 0;
          const nodulePulse = (Math.sin(nodulePhase + noduleIndex * 0.9) + 1) * 0.5;
          child.rotation.y += deltaTime * (0.18 + noduleIndex * 0.03);
          child.rotation.x += deltaTime * 0.08;
          child.scale.setScalar(0.78 + nodulePulse * 0.18 + corruptionWave * 0.04);
          material.opacity = 0.42 + nodulePulse * 0.22;
          material.color?.setHex?.(noduleIndex === 2 && corruptionWave > 0.66 ? 0xff78a8 : 0xf2fff7);
        }

        if (child.userData?.glyphComponent === 'alienOrganTendril') {
          const tendrilIndex = child.userData.tendrilIndex ?? 0;
          const tendrilPulse = (Math.sin(organPhase * 0.74 + tendrilIndex * 1.1) + 1) * 0.5;
          const basePoints = child.userData.basePoints || [];
          const displaced = basePoints.map((point, pointIndex) => {
            const localPhase = organPhase * (0.58 + pointIndex * 0.08) + tendrilIndex;
            const offset = 0.02 + tendrilPulse * 0.022;
            return new THREE.Vector3(
              point.x + Math.sin(localPhase * 1.1) * offset,
              point.y + Math.cos(localPhase * 0.9) * offset * 0.8,
              point.z + Math.sin(localPhase * 1.33) * offset * 0.86
            );
          });
          if (child.geometry?.setFromPoints) {
            child.geometry.setFromPoints(displaced);
            child.geometry.attributes.position.needsUpdate = true;
          }
          child.rotation.z += deltaTime * (0.08 + tendrilIndex * 0.03);
          material.opacity = 0.24 + tendrilPulse * 0.26 + tissueBreath * 0.08;
        }
      });
    }
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

  _acquireFusionGroup(nodeId) {
    let fusionGroup = null;
    if (this.fusionPool.length > 0) {
      fusionGroup = this.fusionPool.pop();
      fusionGroup.name = `fusion_${nodeId}`;
      fusionGroup.userData = {
        isGlyphFusion: true,
        nodeId,
        isFusion: true
      };
      fusionGroup.visible = true;
      fusionGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');
    } else {
      fusionGroup = new THREE.Group();
      fusionGroup.userData = {
        isGlyphFusion: true,
        nodeId,
        isFusion: true
      };
      fusionGroup.name = `fusion_${nodeId}`;
      fusionGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');
    }
    return fusionGroup;
  }

  _releaseFusionGroup(fusionGroup) {
    if (!fusionGroup) return;

    if (fusionGroup.parent) {
      fusionGroup.parent.remove(fusionGroup);
    }

    fusionGroup.traverse((child) => {
      if (child.isMesh || child.isLine || child.isPoints || child.isGroup) {
        child.visible = false;
      }
    });

    fusionGroup.clear();

    if (this.fusionPool.length < this.maxFusionPoolSize) {
      this.fusionPool.push(fusionGroup);
    } else {
      fusionGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
  }

  _acquireAmbientOrbitGroup(nodeId) {
    let ambientGroup = null;
    if (this.ambientOrbitPool.length > 0) {
      ambientGroup = this.ambientOrbitPool.pop();
      ambientGroup.name = `ambient_orbit_${nodeId}`;
      ambientGroup.userData = {
        isAmbientOrbitGlyph: true,
        nodeId,
        isFusion: true
      };
      ambientGroup.visible = true;
      ambientGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');
    } else {
      ambientGroup = new THREE.Group();
      ambientGroup.userData = {
        isAmbientOrbitGlyph: true,
        nodeId,
        isFusion: true
      };
      ambientGroup.name = `ambient_orbit_${nodeId}`;
      ambientGroup.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');
    }
    return ambientGroup;
  }

  _releaseAmbientOrbitGroup(ambientGroup) {
    if (!ambientGroup) return;

    if (ambientGroup.parent) {
      ambientGroup.parent.remove(ambientGroup);
    }

    ambientGroup.traverse((child) => {
      if (child.isMesh || child.isLine || child.isPoints || child.isGroup) {
        child.visible = false;
      }
    });

    ambientGroup.clear();

    if (this.ambientOrbitPool.length < this.maxAmbientOrbitPoolSize) {
      this.ambientOrbitPool.push(ambientGroup);
    } else {
      ambientGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
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
    
    // Create fusion container (pooled if available)
    const fusionGroup = this._acquireFusionGroup(nodeId);
    visualGroup.add(fusionGroup);

    let coreGlyph = null;
    let evoGlyph = null;

    if (this.hoverOnlyMode) {
      evoGlyph = this.createEvolutionGlyph(node, nodeId);
      if (evoGlyph && this._safeAttachGlyph(evoGlyph, 'GLYPH_LAYER', fusionGroup, node)) {
        this.stats.byLayer.evolution++;
      }
    } else {
      coreGlyph = this.createCoreGlyph(node, nodeId);
      if (coreGlyph && this._safeAttachGlyph(coreGlyph, 'GLYPH_LAYER', fusionGroup, node)) {
        this.stats.byLayer.core++;
      }
      
      evoGlyph = this.createEvolutionGlyph(node, nodeId);
      if (evoGlyph && this._safeAttachGlyph(evoGlyph, 'GLYPH_LAYER', fusionGroup, node)) {
        this.stats.byLayer.evolution++;
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
        evolution: evoGlyph
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
          harmonyDominance: node.userData?.metrics?.harmony ?? 0.5,
          corruptionLevel: (node.userData?.metrics?.corruption ?? node.userData?.corruption ?? 0),
          synergyCoherence: node.userData?.metrics?.synergy ?? 0.5,
          stabilityIndex: node.userData?.metrics?.stability ?? 0
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

  _getNodeActiveLinkCount(node) {
    const metricsCount = node?.userData?.metrics?.activeLinkCount;
    if (Number.isFinite(metricsCount)) return metricsCount;

    const legacyCount = node?.userData?.activeLinkCount;
    if (Number.isFinite(legacyCount)) return legacyCount;

    return 0;
  }

  _hasNodeActiveLinks(node) {
    return this._getNodeActiveLinkCount(node) > 0;
  }

  createAmbientOrbitForNode(node, nodeId) {
    if (!this.ambientOrbitEnabled) return;
    if (!node || !node.parent || !nodeId) return;
    if (!this._hasNodeActiveLinks(node)) return;
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

    this.reconcileAmbientOrbitGlyphs(nodes);
  }

  reconcileAmbientOrbitGlyphs(nodes) {
    if (!this.ambientOrbitEnabled) return;
    if (!Array.isArray(nodes) || nodes.length === 0) return;

    const activeNodeIds = new Set();

    nodes.forEach((node) => {
      const nodeId = node?.userData?.nodeId;
      if (!nodeId) return;

      if (this._hasNodeActiveLinks(node)) {
        activeNodeIds.add(nodeId);
        this.createAmbientOrbitForNode(node, nodeId);
        return;
      }

      if (this.ambientOrbitRegistry.has(nodeId)) {
        this.removeAmbientOrbit(nodeId);
      }
    });

    for (const nodeId of Array.from(this.ambientOrbitRegistry.keys())) {
      if (!activeNodeIds.has(nodeId)) {
        this.removeAmbientOrbit(nodeId);
      }
    }
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
    if (!FXDebugSandbox.isEnabled('glyphLayer4')) return;
    if (!this.enabled) return;
    if (this.frameScheduler?.shouldRunVisual?.() === false) return;

    if (this._glyphTimeOrigin === undefined) {
      this._glyphTimeOrigin = VisualTime.now; // Phase 2A: canonical VisualTime anchor for glyph timing
    }
    const currentVisualTime = VisualTime.now - this._glyphTimeOrigin; // Phase 2A: VisualTime canonical clock (behavior-preserving)
    let visualDelta = this._lastVisualTime === undefined
      ? deltaTime
      : currentVisualTime - this._lastVisualTime;
    this._lastVisualTime = currentVisualTime;
    if (!Number.isFinite(visualDelta) || visualDelta <= 0) {
      visualDelta = Math.max(0, deltaTime);
    }
    deltaTime = visualDelta;

    for (const [nodeId, fusionData] of this.fusionRegistry) {
      const { fusionGroup, layers, node } = fusionData;
      
      if (!fusionGroup || !fusionGroup.parent) {
        this.removeFusion(nodeId);
        continue;
      }

      if (layers.evolution) {
        layers.evolution = this.syncEvolutionGlyphStage(node, nodeId, fusionGroup, layers.evolution);
      }
      
      // Update each layer
      if (layers.core) this.updateCoreGlyph(layers.core, deltaTime);
      if (layers.evolution) this.updateEvolutionGlyph(layers.evolution, deltaTime);
    }

    for (const [nodeId, ambientData] of this.ambientOrbitRegistry) {
      const { node, ambientGroup } = ambientData;

      if (!ambientGroup || !ambientGroup.parent || !this._hasNodeActiveLinks(node)) {
        this.removeAmbientOrbit(nodeId);
        continue;
      }

      ambientData.evolution = this.syncEvolutionGlyphStage(node, nodeId, ambientGroup, ambientData.evolution);

      if (ambientData.evolution) this.updateEvolutionGlyph(ambientData.evolution, deltaTime);
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

    // Release fusion group to pool (or dispose if pool full)
    this._releaseFusionGroup(fusionGroup);

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

    this._releaseAmbientOrbitGroup(ambientGroup);

    this.ambientOrbitRegistry.delete(nodeId);
  }
  
  cleanup() {
    for (const nodeId of Array.from(this.fusionRegistry.keys())) {
      this.removeFusion(nodeId);
    }

    for (const nodeId of Array.from(this.ambientOrbitRegistry.keys())) {
      this.removeAmbientOrbit(nodeId);
    }

    // Purge pooled groups
    while (this.fusionPool.length > 0) {
      const fusionGroup = this.fusionPool.pop();
      fusionGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    while (this.ambientOrbitPool.length > 0) {
      const ambientGroup = this.ambientOrbitPool.pop();
      ambientGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
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
    console.log('  - Evolution:', !!fusionData.layers.evolution, fusionData.layers.evolution?.userData?.glyphKey, fusionData.layers.evolution?.userData?.stage);
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
